/* Vitalia search upgrade: tolerant token matching in any word order,
   plus mobile-friendly results UX. Loaded last; overrides ctlScope and
   wraps ctlRender without changing card markup, prices or filters. */
(function(){
 if(typeof ctlScope!=='function'||typeof ctlRender!=='function')return;
 var ctlQ=document.getElementById('ctlQ');
 if(!ctlQ)return;

 /* Normalize Arabic spelling variants so ة/ه, ى/ي, همزات and
    Arabic-Indic digits never decide a match. */
 function norm(s){
  return (s==null?'':String(s)).toLowerCase()
   .replace(/[أإآٱ]/g,'ا')
   .replace(/ى/g,'ي')
   .replace(/ئ/g,'ي')
   .replace(/ؤ/g,'و')
   .replace(/ة/g,'ه')
   .replace(/[ً-ْٰ]/g,'')
   .replace(/ـ/g,'')
   .replace(/[٠-٩]/g,function(d){return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d));})
   .replace(/[۰-۹]/g,function(d){return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));})
   .replace(/\s+/g,' ')
   .trim()
   /* Attached connectors (وال/فال/بال/كال/لل/ال) never decide a match:
      «بالعسل»/«للعسل»/«العسل» match a name written «عسل». Applied to
      query and names alike, so existing queries keep working. */
   .split(' ').map(function(w){return w.replace(/^(وال|فال|بال|كال|لل|ال)/,'');}).filter(Boolean).join(' ');
 }
 function haystack(co,p){
  var h=p.n+' '+(p.code||'')+' '+co.ar+' '+(co.en||'');
  if(p.v){p.v.forEach(function(v){h+=' '+v.n;});}
  return norm(h);
 }

 var origScope=ctlScope;
 ctlScope=function(){
  var q=norm(ctlState.q);
  if(!q)return origScope(); /* chips and categories behave exactly as before */
  var tokens=q.split(' ').filter(Boolean);
  if(!tokens.length)return origScope();
  var list=[];
  CTL_COMPANIES.forEach(function(co){
   co.products.forEach(function(p){
    var hay=haystack(co,p);
    var ok=tokens.every(function(t){return hay.indexOf(t)>-1;});
    if(ok)list.push({co:co,p:p});
   });
  });
  if(ctlState.sort==='alpha'){list=list.slice().sort(function(a,b){return a.p.n.localeCompare(b.p.n,'ar');});}
  return list;
 };

 /* "Show results" button: closes the phone keyboard and scrolls to the grid. */
 var toolbar=document.querySelector('.ctl-toolbar');
 var goBtn=document.createElement('button');
 goBtn.type='button';
 goBtn.id='ctlGoResults';
 goBtn.className='ctl-chip';
 goBtn.style.display='none';
 goBtn.addEventListener('click',function(){
  ctlQ.blur();
  var g=document.getElementById('ctlGrid');
  if(!g)return;
  var y=g.getBoundingClientRect().top+window.pageYOffset-90;
  window.scrollTo({top:y,behavior:'smooth'});
 });
 if(toolbar)toolbar.appendChild(goBtn);

 /* Clear empty state: message plus one button resetting search and filters. */
 var noRes=document.createElement('div');
 noRes.id='ctlNoRes';
 noRes.style.cssText='display:none;text-align:center;margin:18px 0 6px';
 var noResText=document.createElement('p');
 noResText.className='vc-muted';
 noResText.style.margin='0 0 10px';
 noResText.textContent='لا توجد نتائج مطابقة لبحثك أو الفلاتر الحالية. جرّب كلمة أقصر أو جزءًا من الاسم.';
 var clearBtn=document.createElement('button');
 clearBtn.type='button';
 clearBtn.className='ctl-chip';
 clearBtn.textContent='مسح البحث والفلاتر';
 clearBtn.addEventListener('click',function(){
  ctlState.q='';ctlQ.value='';
  ctlState.co='all';ctlState.cat='الكل';
  ctlState.shown=CTL_BATCH;
  ctlRender();
  ctlQ.focus();
 });
 noRes.appendChild(noResText);
 noRes.appendChild(clearBtn);
 var shownEl=document.getElementById('ctlShown');
 if(shownEl&&shownEl.parentNode)shownEl.parentNode.insertBefore(noRes,shownEl.nextSibling);

 /* Result count beside sort follows the filtered results while searching. */
 var statsEl=document.getElementById('ctlStats');
 var statsOrig=statsEl?statsEl.innerHTML:'';
 function countLabel(n){
  if(n===0)return 'لا نتائج';
  if(n===1)return 'نتيجة واحدة';
  if(n===2)return 'نتيجتان';
  if(n<=10)return arDig(n)+' نتائج';
  return arDig(n)+' نتيجة';
 }

 var origRender=ctlRender;
 ctlRender=function(){
  origRender();
  var searching=norm(ctlState.q)!=='';
  var count=ctlScope().length;
  if(searching){
   goBtn.style.display='';
   goBtn.textContent=count?('عرض النتائج ('+arDig(count)+')'):'لا توجد نتائج';
   if(statsEl)statsEl.innerHTML='<span>'+countLabel(count)+'</span>';
  }else{
   goBtn.style.display='none';
   if(statsEl)statsEl.innerHTML=statsOrig;
  }
  noRes.style.display=count===0?'':'none';
 };


 /* Agreed change (preview only, 2026-11-12): pressing the magnifier icon
    or the keyboard search/Enter key finishes the search and scrolls the
    page to the start of the results, or to the no-results message when
    nothing matches. Everything else stays as it was. */
 function ctlJumpToResults(){
  var count=ctlScope().length;
  var target=count?document.getElementById('ctlGrid'):noRes;
  if(!target)return;
  function scrollOnce(){
   var y=target.getBoundingClientRect().top+window.pageYOffset-90;
   window.scrollTo({top:y,behavior:'smooth'});
  }
  scrollOnce();
  /* Re-aim once after late image/layout shifts so the first tap on a
     freshly loaded page does not land short of the results. */
  setTimeout(function(){
   if(Math.abs(target.getBoundingClientRect().top-90)>60)scrollOnce();
  },700);
 }
 function ctlSubmitSearch(){
  if(ctlDeb){clearTimeout(ctlDeb);ctlDeb=null;}
  ctlState.q=ctlQ.value.trim();
  ctlState.shown=CTL_BATCH;
  ctlRender();
  if(norm(ctlState.q)==='')return;
  ctlQ.blur();
  ctlJumpToResults();
 }
 var sic=ctlQ.parentElement?ctlQ.parentElement.querySelector('.sic'):null;
 if(sic){
  sic.setAttribute('role','button');
  sic.setAttribute('tabindex','0');
  sic.setAttribute('aria-label','عرض نتائج البحث');
  /* The stylesheet marks the icon pointer-events:none (decorative);
     re-enable it here and widen the tap area so mobile taps reach it. */
  sic.style.pointerEvents='auto';
  sic.style.cursor='pointer';
  sic.style.padding='10px';
  sic.style.margin='-10px';
  sic.addEventListener('click',function(){ctlSubmitSearch();});
  sic.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();ctlSubmitSearch();}});
 }
 ctlQ.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();ctlSubmitSearch();}});
 ctlQ.addEventListener('search',function(){if(ctlQ.value.trim()!=='')ctlSubmitSearch();});
 ctlRender();
})();
