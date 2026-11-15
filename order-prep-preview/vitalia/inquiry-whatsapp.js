(function(){'use strict';
 var form=document.querySelector('.inquiry-form'),review=document.getElementById('inquiryReview');if(!form||!review)return;
 form.onsubmit=function(e){e.preventDefault();if(!form.reportValidity())return false;
 var name=document.getElementById('inquiryName').value.trim(),reply=document.getElementById('inquiryReply').value.trim(),message=document.getElementById('inquiryMessage').value.trim();
 if(!name||!reply||!message){review.textContent='اكتب الاسم ووسيلة الرد والاستفسار.';return false;}
 review.replaceChildren();var title=document.createElement('h4');title.textContent='راجع استفسارك';review.appendChild(title);
 VitaliaWhatsApp.mount(review,['استفسار تجريبي - فيتاليا','الاسم: '+name,'وسيلة الرد: '+reply,'','الاستفسار:',message].join('\n'),'فتح واتساب بالاستفسار');
 review.scrollIntoView({block:'nearest',behavior:'smooth'});return false;};
 form.addEventListener('input',function(){review.replaceChildren();});
 var direct=document.getElementById('contactWhatsApp');if(direct)direct.onclick=function(){review.replaceChildren();VitaliaWhatsApp.mount(review,'استفسار تجريبي - فيتاليا\nمرحبًا، عندي استفسار عن المنتجات.','فتح واتساب');review.scrollIntoView({block:'nearest',behavior:'smooth'});};
})();
