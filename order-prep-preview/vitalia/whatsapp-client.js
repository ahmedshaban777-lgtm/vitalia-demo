/* Official client-side click-to-chat format, https://faq.whatsapp.com/5913398998672934 . No API keys or automatic sending. */
window.VitaliaWhatsApp=(function(){
 'use strict';
 var recipient='201144679878',base='https://wa.me/'+recipient;
 function url(text){return base+'?text='+encodeURIComponent(text);}
 function mount(root,text,label){
  var pre=document.createElement('pre');pre.className='wa-order-message';pre.textContent=text;
  var note=document.createElement('p');note.className='vc-muted';note.textContent='المستلم: فيتاليا 01144679878. راجع النص، ثم افتح واتساب واضغط إرسال بنفسك. فتح المحادثة لا يعني إرسال أو تأكيد الطلب.';
  var actions=document.createElement('div');actions.className='wa-actions';
  var link=document.createElement('a');link.className='vc-btn primary';link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';
  var full=url(text),long=full.length>7500;
  link.href=long?base:full;link.textContent=long?'فتح واتساب ثم لصق الرسالة':label;
  if(long){var warning=document.createElement('p');warning.className='vc-note';warning.textContent='الرسالة طويلة: انسخ النص كاملًا، ثم افتح واتساب والصقه. لم يتم اختصار أو حذف أي صنف.';root.appendChild(warning);}
  var copy=document.createElement('button');copy.type='button';copy.className='vc-btn';copy.textContent='نسخ الرسالة';
  copy.onclick=async function(){try{await navigator.clipboard.writeText(text);copy.textContent='تم نسخ الرسالة';}catch(e){var area=document.createElement('textarea');area.className='wa-copy-area';area.readOnly=true;area.value=text;root.appendChild(area);area.focus();area.select();copy.textContent='حدّد النص وانسخه';}};
  root.appendChild(pre);root.appendChild(note);actions.appendChild(link);actions.appendChild(copy);root.appendChild(actions);
  return {long:long};
 }
 return {mount:mount,url:url,recipient:recipient};
})();
