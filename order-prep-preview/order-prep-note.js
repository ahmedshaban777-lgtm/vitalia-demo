/* order-prep-preview banner: describes this preview's checkout/message/code changes. Preview only. */
(function(){
 function note(){
  if(document.getElementById('op-note'))return;
  var b=document.createElement('div');
  b.id='op-note';
  b.style.cssText='position:static;margin:10px auto;max-width:94%;background:#3a2340;color:#f5e9f0;text-align:center;padding:10px 14px;font-size:14px;line-height:1.8;border-radius:10px;font-family:Tajawal,Cairo,sans-serif;';
  b.textContent='معاينة تجريبية إضافية: فورم طلب مختصر (اسم + عنوان أو فرع فقط، ورقم التواصل اختياري) · رسالة واتساب أوضح للتحضير بسطر واحد لكل صنف · لينك داخل الرسالة يفتح الطلب بالصور · كود مختصر (E00066 بدل VTL-E00066) مع بقاء الكود الكامل في التفاصيل — الموقع الأساسي لم يتغير';
  var t=document.getElementById('en-coverage');
  if(t&&t.parentNode){t.parentNode.insertBefore(b,t.nextSibling);return;}
  var p=document.getElementById('products')||document.body.firstChild;
  p.parentNode.insertBefore(b,p);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',note);
 else note();
 setTimeout(note,800);
})();
