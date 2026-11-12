/* TRIAL PREVIEW ONLY - illustrative category images for 3 empty product cards.
 * Each is a real catalog product with no photo; image is Vitalia's own category
 * concept art, clearly badged «صورة توضيحية». Not fabricated branded packaging.
 * Applied by exact Arabic product name; reversible (badge class illus-trial). */
(function(){
 var TRIAL = {
  "لو صبغة برودجى بنى داكن رقم ٠٫٣": "https://vitalia-current-preview.lovable.app/assets/department-hair-concept.webp",
  "كيارا كريم مرطب بشرة جافه ١٢٠جرام": "https://vitalia-current-preview.lovable.app/assets/department-skin-concept.webp",
  "باشون بيبى زيت مساج للجسم ١٠٠مل": "https://vitalia-current-preview.lovable.app/assets/department-baby-concept.webp"
 };
 function apply(root){
  (root||document).querySelectorAll('.ctl-card').forEach(function(card){
   if(card.querySelector('.illus-trial'))return;
   var h3=card.querySelector('.ctl-body h3');
   if(!h3)return;
   var src=TRIAL[h3.textContent.trim()];
   if(!src)return;
   var thumb=card.querySelector('.ctl-thumb');
   if(!thumb)return;
   var pending=thumb.querySelector('.ctl-pending');
   if(!pending)return; // only touch genuinely empty cards
   pending.remove();
   var img=document.createElement('img');
   img.className='illus-trial';
   img.src=src;
   img.alt='صورة توضيحية - '+h3.textContent.trim();
   img.loading='lazy';
   thumb.appendChild(img);
   var badge=document.createElement('span');
   badge.className='fam illus-trial-badge';
   badge.hidden=false;
   badge.textContent='صورة توضيحية';
   thumb.appendChild(badge);
  });
 }
 new MutationObserver(function(){apply();}).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){apply();});
 else apply();
 setInterval(apply,1500);
})();
