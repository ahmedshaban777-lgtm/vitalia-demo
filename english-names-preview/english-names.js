/* English display name sample - preview only. Whitelist of packaging/retailer-verified English names. */
(function(){
 var MAP={
  'بلانكي رول اون كيدز قطن كاندى ٤٠مل':'Blankie Kids Roll-On Cotton Candy 40ml',
  'بلانكي زيت لطفال ١٠٠ملى':'Blankie Baby Oil 100ml',
  'بلانكي كريم ديابير راش٧٥ مل':'Blankie Diaper Rash Cream 75ml',
  'بارادونتكس كبير ١٠٠م انتعاش':'Parodontax Extra Fresh 100ml',
  'نيفيا كريم أزرق':'Nivea Creme'
 };
 function inject(root){
  (root||document).querySelectorAll('.ctl-card').forEach(function(card){
   if(card.querySelector('.en-name'))return;
   var h3=card.querySelector('.ctl-body h3');
   if(!h3)return;
   var en=MAP[h3.textContent.trim()];
   if(!en)return;
   var d=document.createElement('div');
   d.className='en-name';d.dir='ltr';d.textContent=en;
   h3.insertAdjacentElement('afterend',d);
  });
 }
 new MutationObserver(function(muts){inject();}).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){inject();});
 else inject();
 setInterval(inject,1500);
})();
/* Auto-demo: ?show=<query> lands directly on the results so the sample is visible without typing */
(function(){
 var m=location.search.match(/[?&]show=([^&]+)/);
 if(!m)return;
 var q=decodeURIComponent(m[1]);
 function go(){
  var i=document.getElementById('ctlQ');
  if(!i){setTimeout(go,400);return;}
  var s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  s.call(i,q);i.dispatchEvent(new Event('input',{bubbles:true}));
  setTimeout(function(){var c=document.getElementById('ctlGoResults');if(c)c.click();},900);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(go,600);});
 else setTimeout(go,600);
})();
