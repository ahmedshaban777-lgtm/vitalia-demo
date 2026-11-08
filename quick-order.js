/* Vitalia quick order by list - preview build.
   Paste one product per line, match against the full catalog,
   choose ambiguous type/size inline, keep unknowns flagged,
   then compose a WhatsApp draft the customer sends himself.
   No backend, no cart, no auto-send. */
(function(){
if(typeof CTL_COMPANIES==='undefined'||typeof VITALIA_EXCEL_IMPORT==='undefined')return;

/* ---------- same normalization rules as the live search ---------- */
function norm(s){
 return (s==null?'':String(s)).toLowerCase()
  .replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ئ/g,'ي').replace(/ؤ/g,'و')
  .replace(/ة/g,'ه').replace(/چ/g,'ج').replace(/گ/g,'ج').replace(/پ/g,'ب')
  .replace(/[ً-ْٰ]/g,'').replace(/ـ/g,'')
  .replace(/[٠-٩]/g,function(d){return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d));})
  .replace(/[۰-۹]/g,function(d){return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));})
  .replace(/\s+/g,' ').trim();
}

/* ---------- build the product index ---------- */
var items=[];
CTL_COMPANIES.forEach(function(co){
 (co.products||[]).forEach(function(p){
  if(p.v&&p.v.length){
   p.v.forEach(function(v){
    items.push({name:co.ar+' '+p.n+' '+v.n, brand:co.ar, code:v.code||p.code||'', cat:p.cat||''});
   });
  }else{
   items.push({name:p.n, brand:co.ar, code:p.code||'', cat:p.cat||''});
  }
 });
});
VITALIA_EXCEL_IMPORT.groups.forEach(function(g){
 (g.products||[]).forEach(function(p){
  items.push({name:p.n, brand:'', code:p.code||'', cat:p.cat||''});
 });
});
var seen={}, uniq=[];
items.forEach(function(it){
 var k=norm(it.name);
 if(seen[k])return; seen[k]=1;
 it.n=norm(it.name);
 it.hay=norm(it.brand+' '+it.name+' '+it.cat);
 it.toks=it.n.split(' ').filter(Boolean);
 uniq.push(it);
});

/* token -> item index for fast candidate lookup */
var tokIdx={};
uniq.forEach(function(it,i){
 var set={};
 it.hay.split(' ').forEach(function(t){ if(t&&!set[t]){set[t]=1;(tokIdx[t]=tokIdx[t]||[]).push(i);} });
});

/* simple bigram similarity (0..1) */
function sim(a,b){
 if(a===b)return 1;
 if(!a||!b)return 0;
 function bg(s){var r=[],i;for(i=0;i<s.length-1;i++)r.push(s.slice(i,i+2));return r;}
 var A=bg(a),B=bg(b);if(!A.length||!B.length)return a[0]===b[0]?0.5:0;
 var hit=0,used=B.map(function(){return 0;});
 A.forEach(function(x){for(var j=0;j<B.length;j++){if(!used[j]&&B[j]===x){used[j]=1;hit++;break;}}});
 return 2*hit/(A.length+B.length);
}

/* ---------- quantity parsing: explicit markers only, never size numbers ---------- */
function parseLine(raw){
 var t=raw.trim(),qty=1;
 var m=t.match(/^(\d{1,3})\s*[x×*]\s+(.+)$/i);          /* "2 x صابونه دوف" */
 if(m){qty=+m[1];t=m[2];}
 else if((m=t.match(/^(.+?)\s+[x×*]\s*(\d{1,3})$/i))){ /* "صابونه دوف × 2" */
  qty=+m[2];t=m[1];
 }
 else if((m=t.match(/^(.+?)\s+(?:عدد|كميه)\s*(\d{1,3})$/))){ /* "صابونه دوف عدد 2" */
  qty=+m[2];t=m[1];
 }
 if(qty<1||qty>999)qty=1;
 return {text:t.trim(), qty:qty};
}

/* ---------- matching ---------- */
function covered(it,t){
 if(it.hay.indexOf(t)>-1)return true;
 if(t.length>=4){ /* compound token like بالحنه covers catalog حنه */
  var ws=it.hay.split(' ');
  for(var i=0;i<ws.length;i++){if(ws[i].length>=3&&t.indexOf(ws[i])>-1)return true;}
 }
 return false;
}
function candidatesFor(q){
 var toks=q.split(' ').filter(Boolean);
 if(!toks.length)return [];
 /* fast path: every query token appears in the item haystack (live-search behavior, plus compound tokens) */
 var strict=[];
 uniq.forEach(function(it){
  var ok=toks.every(function(t){return covered(it,t);});
  if(ok)strict.push(it);
 });
 if(strict.length)return strict;
 /* relaxed path: share at least one token via the index, then rank */
 var counts={},i,j;
 toks.forEach(function(t){
  var list=tokIdx[t]||[];
  for(j=0;j<list.length;j++){counts[list[j]]=(counts[list[j]]||0)+1;}
 });
 var out=[];
 Object.keys(counts).forEach(function(k){
  var it=uniq[+k];
  var cover=counts[k]/toks.length;
  if(cover>=0.5||counts[k]>=2)out.push(it);
 });
 return out;
}
function scoreItem(q,it){
 var toks=q.split(' ').filter(Boolean);
 var cover=toks.filter(function(t){return covered(it,t);}).length/Math.max(1,toks.length);
 return 0.45*cover+0.55*sim(q,it.n);
}
function matchLine(text){
 var q=norm(text);
 if(!q)return {status:'empty',options:[]};
 var cands=candidatesFor(q);
 if(!cands.length)return {status:'unknown',options:[]};
 var scored=cands.map(function(it){return {it:it,s:scoreItem(q,it)};})
  .sort(function(a,b){return b.s-a.s;}).slice(0,6);
 if(scored[0].s<0.5)return {status:'unknown',options:scored.slice(0,4)};
 if(scored.length>1&&scored[0].s-scored[1].s<0.07)return {status:'ambiguous',options:scored};
 return {status:'matched',options:scored};
}

/* ---------- state ---------- */
var rows=[]; /* {raw,text,qty,status,options,choice} */

/* ---------- rendering ---------- */
function el(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function num(n){return Number(n).toLocaleString('ar-EG');}

function runMatch(){
 var raw=el('qoInput').value;
 rows=raw.split(/\n+/).map(function(l){return l.trim();}).filter(Boolean).map(function(l){
  var p=parseLine(l);
  var m=matchLine(p.text);
  return {raw:l,text:p.text,qty:p.qty,status:m.status,options:m.options,choice:(m.status==='matched'?0:null)};
 });
 renderRows();
 renderSummary();
}

function statusTag(r){
 if(r.status==='matched')return '<span class="qo-tag ok">مطابق</span>';
 if(r.status==='ambiguous')return '<span class="qo-tag warn">اختر النوع/الحجم</span>';
 return '<span class="qo-tag bad">غير معروف - يحتاج مراجعة</span>';
}

function renderRows(){
 var host=el('qoRows');
 if(!rows.length){host.innerHTML='<p class="qo-empty">اكتب أو الصق قائمة الأصناف، صنف في كل سطر، ثم اضغط «طابق الأصناف».</p>';return;}
 host.innerHTML=rows.map(function(r,i){
  var mid;
  if(r.status==='matched'){
   var o=r.options[0].it;
   mid='<div class="qo-match"><b>'+esc(o.name)+'</b><span class="qo-code">'+esc(o.code||'')+'</span></div>';
  }else if(r.status==='ambiguous'){
   mid='<select class="qo-select" data-row="'+i+'">'
     +'<option value="-1">— اختر الصنف الصحيح —</option>'
     +r.options.map(function(o,j){return '<option value="'+j+'">'+esc(o.it.name)+(o.it.code?' · '+esc(o.it.code):'')+'</option>';}).join('')
     +'</select>';
  }else{
   var sug=r.options&&r.options.length
     ?'<div class="qo-sug">أقرب اقتراحات (للاختيار اليدوي فقط): '+r.options.map(function(o,j){return '<button type="button" class="qo-chip" data-row="'+i+'" data-opt="'+j+'">'+esc(o.it.name)+'</button>';}).join(' ')+'</div>'
     :'<div class="qo-sug">لا يوجد شيء قريب في الكتالوج الحالي.</div>';
   mid='<div class="qo-unknown">سيُدرج في الطلب بنصه الأصلي كصنف «تحتاج تأكيد».</div>'+sug;
  }
  var overridden=r.choice!=null&&r.status!=='matched';
  var chosen=(r.choice!=null)?r.options[r.choice].it:null;
  return '<div class="qo-row st-'+r.status+(chosen?' chosen':'')+'">'
   +'<div class="qo-orig"><span class="qo-raw">'+esc(r.raw)+'</span>'+statusTag(r)+'</div>'
   +(chosen?'<div class="qo-match"><b>'+esc(chosen.name)+'</b><span class="qo-code">'+esc(chosen.code||'')+'</span></div>':mid)
   +'<div class="qo-qty"><label>الكمية <input type="number" min="1" max="999" value="'+r.qty+'" data-qty="'+i+'"></label></div>'
   +'</div>';
 }).join('');
 host.querySelectorAll('.qo-select').forEach(function(s){
  s.onchange=function(){var i=+s.dataset.row;rows[i].choice=+s.value;if(rows[i].choice<0)rows[i].choice=null;renderRows();renderSummary();};
 });
 host.querySelectorAll('.qo-chip').forEach(function(b){
  b.onclick=function(){var i=+b.dataset.row;rows[i].choice=+b.dataset.opt;renderRows();renderSummary();};
 });
 host.querySelectorAll('[data-qty]').forEach(function(inp){
  inp.onchange=function(){var i=+inp.dataset.qty;var q=Number(inp.value);if(!Number.isInteger(q)||q<1||q>999){inp.value=rows[i].qty;return;}rows[i].qty=q;renderSummary();};
 });
}

function chosenItem(r){
 if(r.status==='matched')return r.options[0].it;
 if(r.choice!=null)return r.options[r.choice].it;
 return null;
}
function renderSummary(){
 var ok=rows.filter(function(r){return chosenItem(r);});
 var unk=rows.filter(function(r){return !chosenItem(r);});
 var lines=['تجريبي - طلب سريع بالقائمة',''];
 ok.forEach(function(r){
  var it=chosenItem(r);
  lines.push((it.code?it.code+' | ':'')+(it.brand?it.brand+' | ':'')+it.name);
  lines.push('الكمية: '+num(r.qty));
 });
 if(unk.length){
  lines.push('','أصناف تحتاج تأكيد (كتبها العميل):');
  unk.forEach(function(r){lines.push('- '+r.raw+' · الكمية: '+num(r.qty));});
 }
 lines.push('','الأسعار والمخزون تُؤكد عند مراجعة الطلب. الحد الأدنى للطلب ١٬٠٠٠ جنيه قبل الشحن.');
 var msg=lines.join('\n');
 el('qoMsg').value=msg;
 var pend=rows.filter(function(r){return r.status==='ambiguous'&&r.choice==null;}).length;
 el('qoStat').textContent='الأصناف: '+num(rows.length)+' · مطابقة: '+num(ok.length)+' · تحتاج تأكيد: '+num(unk.length)+(pend?' · بلا اختيار: '+num(pend):'');
 el('qoWa').href='https://wa.me/201144679878?text='+encodeURIComponent(msg);
 el('qoWa').classList.toggle('off',!rows.length);
}

el('qoRun').onclick=runMatch;
el('qoClear').onclick=function(){el('qoInput').value='';rows=[];renderRows();renderSummary();};
el('qoCopy').onclick=async function(){
 try{await navigator.clipboard.writeText(el('qoMsg').value);el('qoCopy').textContent='تم نسخ الرسالة';}
 catch(e){el('qoMsg').focus();el('qoMsg').select();el('qoCopy').textContent='حدّد النص وانسخه';}
 setTimeout(function(){el('qoCopy').textContent='نسخ نص الرسالة';},1600);
};
renderRows();renderSummary();
})();
