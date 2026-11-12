/* Vitalia quick order by list (production).
   Paste one product per line -> match against the full catalog ->
   customer explicitly reviews/confirms every row (ambiguous type/size
   choices are always made by the customer; auto-matches are reviewable
   and changeable) -> customer info -> review -> WhatsApp draft the
   customer sends himself to the shop number. No cart, no backend,
   no auto-send. Catalog data is never modified. */
(function(){
if(typeof CTL_COMPANIES==='undefined'||typeof VITALIA_EXCEL_IMPORT==='undefined')return;
if(document.getElementById('qoOverlay'))return;

var WA_NUMBER='201144679878';
var MIN_NOTE='الحد الأدنى للطلب ١٬٠٠٠ جنيه قبل الشحن؛ يُراجع عند تأكيد الطلب.';

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

/* ---------- product index (display names + codes only) ---------- */
var items=[];
CTL_COMPANIES.forEach(function(co){
 (co.products||[]).forEach(function(p){
  if(p.v&&p.v.length){
   p.v.forEach(function(v){
    items.push({name:co.ar+' '+p.n+' '+v.n, brand:co.ar, code:v.code||p.code||''});
   });
  }else{
   items.push({name:p.n, brand:co.ar, code:p.code||''});
  }
 });
});
VITALIA_EXCEL_IMPORT.groups.forEach(function(g){
 (g.products||[]).forEach(function(p){ items.push({name:p.n, brand:'', code:p.code||''}); });
});
var seen={}, uniq=[];
items.forEach(function(it){
 var k=norm(it.name);
 if(seen[k])return; seen[k]=1;
 it.n=norm(it.name);
 it.hay=norm(it.brand+' '+it.name);
 uniq.push(it);
});
var tokIdx={};
uniq.forEach(function(it,i){
 var set={};
 it.hay.split(' ').forEach(function(t){ if(t&&!set[t]){set[t]=1;(tokIdx[t]=tokIdx[t]||[]).push(i);} });
});

function sim(a,b){
 if(a===b)return 1;
 if(!a||!b)return 0;
 function bg(s){var r=[],i;for(i=0;i<s.length-1;i++)r.push(s.slice(i,i+2));return r;}
 var A=bg(a),B=bg(b);if(!A.length||!B.length)return a[0]===b[0]?0.5:0;
 var hit=0,used=B.map(function(){return 0;});
 A.forEach(function(x){for(var j=0;j<B.length;j++){if(!used[j]&&B[j]===x){used[j]=1;hit++;break;}}});
 return 2*hit/(A.length+B.length);
}
function sizeTokens(n){var m=n.match(/\d+\s*(مل|ملى|جم|جرام|لتر|قطعه|ق|اكياس)?/g);return m?m.map(function(x){return x.replace(/\s+/g,'');}):[];}
function covered(it,t){
 if(it.hay.indexOf(t)>-1)return true;
 if(t.length>=4){
  var ws=it.hay.split(' ');
  for(var i=0;i<ws.length;i++){if(ws[i].length>=3&&t.indexOf(ws[i])>-1)return true;}
 }
 return false;
}
function candidatesFor(q){
 var toks=q.split(' ').filter(Boolean);
 if(!toks.length)return [];
 var strict=[];
 uniq.forEach(function(it){
  if(toks.every(function(t){return covered(it,t);}))strict.push(it);
 });
 if(strict.length)return strict;
 var counts={},j;
 toks.forEach(function(t){(tokIdx[t]||[]).forEach(function(i){counts[i]=(counts[i]||0)+1;});});
 var out=[];
 Object.keys(counts).forEach(function(k){
  var it=uniq[+k];
  if(counts[k]/toks.length>=0.5||counts[k]>=2)out.push(it);
 });
 return out;
}
function scoreItem(q,it){
 var toks=q.split(' ').filter(Boolean);
 var cover=toks.filter(function(t){return covered(it,t);}).length/Math.max(1,toks.length);
 var s=0.45*cover+0.55*sim(q,it.n);
 /* size awareness: matching size tokens boost, conflicting ones penalize */
 var qs=sizeTokens(q),is=sizeTokens(it.n);
 if(qs.length&&is.length){
  var inter=qs.filter(function(x){return is.indexOf(x)>-1;}).length;
  if(inter)s+=0.05*inter;else s-=0.10;
 }else if(qs.length&&!is.length){s-=0.03;}
 return s;
}
function matchLine(text){
 var q=norm(text);
 if(!q)return {status:'empty',options:[]};
 var cands=candidatesFor(q);
 if(!cands.length)return {status:'unknown',options:[]};
 var scored=cands.map(function(it){return {it:it,s:scoreItem(q,it)};})
  .sort(function(a,b){return b.s-a.s;}).slice(0,6);
 if(scored[0].s<0.5)return {status:'unknown',options:scored.slice(0,4)};
 /* auto-match only on a strong, clearly-ahead score; still reviewable/changeable */
 if(scored[0].s>=0.82&&(scored.length<2||scored[0].s-scored[1].s>=0.12))
  return {status:'matched',options:scored};
 return {status:'ambiguous',options:scored};
}

/* ---------- quantity: explicit markers only, never size numbers ---------- */
function parseLine(raw){
 var t=raw.trim(),qty=1,m;
 if((m=t.match(/^(\d{1,3})\s*[x×*]\s+(.+)$/i))){qty=+m[1];t=m[2];}
 else if((m=t.match(/^(.+?)\s+[x×*]\s*(\d{1,3})$/i))){qty=+m[2];t=m[1];}
 else if((m=t.match(/^(.+?)\s+(?:عدد|كميه)\s*(\d{1,3})$/))){qty=+m[2];t=m[1];}
 if(!Number.isInteger(qty)||qty<1||qty>999)qty=1;
 return {text:t.trim(),qty:qty};
}

/* ---------- overlay markup ---------- */
function el(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function num(n){return Number(n).toLocaleString('ar-EG');}

var ov=document.createElement('div');
ov.className='qo-overlay';ov.id='qoOverlay';
ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','qoTitle');
ov.innerHTML='<div class="qo-panel">'
 +'<div class="qo-head"><h2 id="qoTitle">طلب سريع بالقائمة</h2><button class="vc-btn" id="qoClose" aria-label="إغلاق الطلب السريع">✕</button></div>'
 +'<div class="vc-note">أسعار وأرصدة تجريبية · رسائل واتساب تجريبية · لا دفع · الطلب لا يمر بالسلة</div>'
 +'<div class="qo-steps">'
 +'<div class="qo-step" data-step="1">'
 +'<p class="qo-lead">اكتب أو الصق قائمتك، صنف واحد في كل سطر. لتحديد كمية اكتب «2 ×» قبل الصنف أو «× 2» بعده أو «عدد 2». الأرقام داخل اسم الصنف (مثل الحجم) لا تُعتبر كمية.</p>'
 +'<textarea id="qoInput" rows="7" placeholder="مثال:\nكريم فاتيكا بالحنه\nصابونه دوف × 2\nريكسونا اسبراي"></textarea>'
 +'<div class="qo-actions"><button class="vc-btn primary" id="qoRun">طابق الأصناف</button><button class="vc-btn" id="qoClear">مسح القائمة</button></div>'
 +'</div>'
 +'<div class="qo-step" data-step="2" hidden>'
 +'<p class="qo-lead">راجع كل سطر: اختر النوع أو الحجم من القائمة، أو عدّل المطابقة التلقائية، والأسماء غير المعروفة تُرسل بنصها للتأكيد.</p>'
 +'<div id="qoRows"></div>'
 +'<div class="qo-actions"><button class="vc-btn" id="qoBack1">تعديل القائمة</button><button class="vc-btn primary" id="qoToInfo">استكمال بيانات الطلب</button></div>'
 +'</div>'
 +'<div class="qo-step" data-step="3" hidden>'
 +'<div class="qo-form">'
 +'<label>الاسم<input id="qoName" type="text" maxlength="100" autocomplete="off" placeholder="اسم العميل"></label>'
 +'<label>موبايل العميل<input id="qoPhone" type="tel" maxlength="20" autocomplete="off" placeholder="01xxxxxxxxx" dir="ltr"></label>'
 +'<label>طريقة الاستلام<select id="qoMethod"><option value="delivery">توصيل</option><option value="pickup">استلام من فرع تجريبي</option></select></label>'
 +'<div id="qoDeliveryFields"><label>المنطقة<input id="qoArea" type="text" maxlength="120" autocomplete="off"></label>'
 +'<label>العنوان بالتفصيل<input id="qoAddress" type="text" maxlength="200" autocomplete="off"></label></div>'
 +'<div id="qoPickupField" hidden><label>الفرع<select id="qoBranch"><option>الفرع الرئيسي - وسط البلد (تجريبي)</option><option>فرع التجمع (تجريبي)</option></select></label></div>'
 +'</div>'
 +'<div class="qo-actions"><button class="vc-btn" id="qoBack2">رجوع للمطابقة</button><button class="vc-btn primary" id="qoToReview">مراجعة الطلب</button></div>'
 +'<p class="qo-err" id="qoInfoErr" role="alert"></p>'
 +'</div>'
 +'<div class="qo-step" data-step="4" hidden>'
 +'<div id="qoStat" class="qo-stat"></div>'
 +'<textarea id="qoMsg" readonly rows="12" aria-label="نص رسالة واتساب"></textarea>'
 +'<div class="qo-actions"><button class="vc-btn" id="qoBack3">تعديل البيانات</button><button class="vc-btn" id="qoCopy">نسخ نص الرسالة</button><a class="vc-btn primary qo-wa" id="qoWa" href="#" target="_blank" rel="noopener">فتح واتساب - العميل يضغط إرسال بنفسه</a></div>'
 +'<p class="qo-note2">'+MIN_NOTE+' الأسعار والمخزون توضيحية وتُؤكد عند تجهيز الطلب. لا يُرسل الموقع أي شيء تلقائيًا.</p>'
 +'</div>'
 +'</div></div>';
document.body.appendChild(ov);

/* ---------- state ---------- */
var rows=[];
var draft={name:'',phone:'',method:'delivery',area:'',address:'',branch:''};

function open(){ov.classList.add('on');document.body.style.overflow='hidden';showStep(1);setTimeout(function(){el('qoInput').focus();},80);}
function close(){ov.classList.remove('on');document.body.style.overflow='';}
function showStep(n){
 ov.querySelectorAll('.qo-step').forEach(function(s){s.hidden=+s.dataset.step!==n;});
 ov.querySelector('.qo-panel').scrollTop=0;
}

/* step 1 -> 2 */
function runMatch(){
 var raw=el('qoInput').value;
 rows=raw.split(/\n+/).map(function(l){return l.trim();}).filter(Boolean).map(function(l){
  var p=parseLine(l);
  var m=matchLine(p.text);
  return {raw:l,text:p.text,qty:p.qty,status:m.status,options:m.options,choice:(m.status==='matched'?0:null)};
 });
 if(!rows.length){el('qoInput').focus();return;}
 renderRows();
 showStep(2);
}

function statusTag(r){
 if(r.status==='matched')return '<span class="qo-tag ok">مطابقة تلقائية - راجعها</span>';
 if(r.status==='ambiguous')return '<span class="qo-tag warn">اختر النوع/الحجم</span>';
 return '<span class="qo-tag bad">غير معروف - يحتاج تأكيد</span>';
}
function renderRows(){
 var host=el('qoRows');
 host.innerHTML=rows.map(function(r,i){
  var chosen=(r.choice!=null)?r.options[r.choice].it:null;
  var mid;
  if(r.status==='unknown'){
   var sug=r.options.length
     ?'<div class="qo-sug">أقرب اقتراحات (اختيار يدوي فقط): '+r.options.map(function(o,j){return '<button type="button" class="qo-chip" data-row="'+i+'" data-opt="'+j+'">'+esc(o.it.name)+'</button>';}).join(' ')+'</div>'
     :'<div class="qo-sug">لا يوجد شيء قريب في الكتالوج الحالي.</div>';
   mid='<div class="qo-unknown">سيُرسل بنصه الأصلي ضمن «أصناف تحتاج تأكيد».</div>'+sug;
  }else{
   mid='<select class="qo-select" data-row="'+i+'" aria-label="اختيار الصنف">'
     +(r.choice==null?'<option value="-1" selected>— اختر الصنف الصحيح —</option>':'')
     +r.options.map(function(o,j){return '<option value="'+j+'"'+(r.choice===j?' selected':'')+'>'+esc(o.it.name)+(o.it.code?' · '+esc(o.it.code):'')+'</option>';}).join('')
     +'</select>';
  }
  return '<div class="qo-row st-'+r.status+(chosen?' chosen':'')+'">'
   +'<div class="qo-orig"><span class="qo-raw">'+esc(r.raw)+'</span>'+statusTag(r)+'</div>'
   +mid
   +'<div class="qo-qty"><label>الكمية <input type="number" min="1" max="999" value="'+r.qty+'" data-qty="'+i+'"></label></div>'
   +'</div>';
 }).join('');
 host.querySelectorAll('.qo-select').forEach(function(s){
  s.onchange=function(){var i=+s.dataset.row;var v=+s.value;rows[i].choice=v>=0?v:null;renderRows();};
 });
 host.querySelectorAll('.qo-chip').forEach(function(b){
  b.onclick=function(){var i=+b.dataset.row;rows[i].choice=+b.dataset.opt;renderRows();};
 });
 host.querySelectorAll('[data-qty]').forEach(function(inp){
  inp.onchange=function(){var i=+inp.dataset.qty;var q=Number(inp.value);if(!Number.isInteger(q)||q<1||q>999){inp.value=rows[i].qty;return;}rows[i].qty=q;};
 });
}

/* step 3 -> 4 */
function chosenItem(r){
 if(r.status==='matched')return r.options[r.choice!=null?r.choice:0].it;
 if(r.choice!=null)return r.options[r.choice].it;
 return null;
}
function buildMessage(){
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
  unk.forEach(function(r){lines.push('- '+r.text+' · الكمية: '+num(r.qty));});
 }
 lines.push('','الأسعار والمخزون تُؤكد عند مراجعة الطلب.',MIN_NOTE,'',
  'الاسم: '+draft.name,
  'موبايل العميل: '+draft.phone,
  'الاستلام: '+(draft.method==='delivery'?('توصيل - '+draft.area+' - '+draft.address):'استلام من '+draft.branch));
 return lines.join('\n');
}
function renderReview(){
 var pend=rows.filter(function(r){return r.status==='ambiguous'&&r.choice==null;}).length;
 var ok=rows.filter(function(r){return chosenItem(r);}).length;
 el('qoStat').textContent='الأصناف: '+num(rows.length)+' · لها صنف محدد: '+num(ok)+' · تحتاج تأكيد: '+num(rows.length-ok)+(pend?' · لم يُختر لها صنف: '+num(pend):'');
 var msg=buildMessage();
 el('qoMsg').value=msg;
 el('qoWa').href='https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(msg);
}

/* ---------- wiring ---------- */
var openers=['qoOpen','qoOpenM'];
openers.forEach(function(id){var b=el(id);if(b)b.onclick=open;});
el('qoClose').onclick=close;
ov.addEventListener('click',function(e){if(e.target===ov)close();});
el('qoRun').onclick=runMatch;
el('qoClear').onclick=function(){el('qoInput').value='';el('qoInput').focus();};
el('qoBack1').onclick=function(){showStep(1);};
el('qoToInfo').onclick=function(){
 var pend=rows.filter(function(r){return r.status==='ambiguous'&&r.choice==null;}).length;
 if(pend){renderRows();var first=el('qoRows').querySelector('.qo-row.st-ambiguous:not(.chosen)');if(first)first.scrollIntoView({block:'center'});}
 showStep(3);
};
el('qoBack2').onclick=function(){showStep(2);};
el('qoMethod').onchange=function(){
 var d=el('qoMethod').value==='delivery';
 el('qoDeliveryFields').hidden=!d;
 el('qoPickupField').hidden=d;
};
el('qoToReview').onclick=function(){
 draft.name=el('qoName').value.trim();
 draft.phone=el('qoPhone').value.trim();
 draft.method=el('qoMethod').value;
 draft.area=el('qoArea').value.trim();
 draft.address=el('qoAddress').value.trim();
 draft.branch=el('qoBranch').value;
 var missing=!draft.name||!draft.phone||(draft.method==='delivery'?(!draft.area||!draft.address):!draft.branch);
 if(missing){el('qoInfoErr').textContent='املأ الاسم والموبايل وبيانات الاستلام قبل المراجعة.';return;}
 el('qoInfoErr').textContent='';
 renderReview();
 showStep(4);
};
el('qoBack3').onclick=function(){showStep(3);};
el('qoCopy').onclick=async function(){
 try{await navigator.clipboard.writeText(el('qoMsg').value);el('qoCopy').textContent='تم نسخ الرسالة';}
 catch(e){el('qoMsg').focus();el('qoMsg').select();el('qoCopy').textContent='حدّد النص وانسخه';}
 setTimeout(function(){el('qoCopy').textContent='نسخ نص الرسالة';},1600);
};
})();
