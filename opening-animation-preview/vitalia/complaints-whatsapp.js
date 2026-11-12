/* Complaints & suggestions -> WhatsApp click-to-chat. No storage, no automatic
   sending: customer reviews the composed message, opens WhatsApp and presses
   send himself. Reuses window.VitaliaWhatsApp (whatsapp-client.js). */
(function () {
  'use strict';
  var WA = window.VitaliaWhatsApp;
  if (!WA) return;
  function $(id) { return document.getElementById(id); }
  var tC = $('cmpTypeC'), tS = $('cmpTypeS'), label = $('cmpMsgLabel');
  var msg = $('cmpMsg'), order = $('cmpOrder'), form = $('cmpForm');
  var review = $('cmpReview'), waMsg = $('cmpWaMsg'), waOpen = $('cmpWaOpen');
  var copy = $('cmpCopy'), again = $('cmpAgain');
  if (!tC || !form || !review) return;

  function setType(isComplaint) {
    tC.classList.toggle('active', isComplaint);
    tS.classList.toggle('active', !isComplaint);
    tC.setAttribute('aria-pressed', isComplaint ? 'true' : 'false');
    tS.setAttribute('aria-pressed', isComplaint ? 'false' : 'true');
    label.textContent = isComplaint ? 'اكتب شكواك' : 'اكتب اقتراحك';
    msg.placeholder = isComplaint ? 'احكيلنا إيه اللي حصل...' : 'إيه الفكرة اللي حابب تشاركها معانا؟';
    order.closest('.cmp-order-field').style.display = isComplaint ? '' : 'none';
  }
  tC.addEventListener('click', function () { setType(true); });
  tS.addEventListener('click', function () { setType(false); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!msg.value.trim()) { msg.focus(); msg.style.borderColor = '#e0457b'; return; }
    var isComplaint = tC.classList.contains('active');
    var text = 'شكاوى واقتراحات - فيتاليا\n';
    text += 'النوع: ' + (isComplaint ? 'شكوى' : 'اقتراح') + '\n';
    if (isComplaint && order.value.trim()) { text += 'رقم الطلب: ' + order.value.trim() + '\n'; }
    text += 'الرسالة:\n' + msg.value.trim();
    waMsg.textContent = text;
    waOpen.href = WA.url(text);
    form.style.display = 'none';
    review.style.display = 'block';
    review.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  copy.addEventListener('click', function () {
    function done() { copy.textContent = 'تم نسخ الرسالة'; }
    function fail() { copy.textContent = 'حدّد النص وانسخه'; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(waMsg.textContent).then(done, fail);
    } else { fail(); }
  });

  again.addEventListener('click', function () {
    form.style.display = '';
    review.style.display = 'none';
    msg.value = '';
    order.value = '';
    copy.textContent = 'نسخ الرسالة';
  });

  setType(true);
})();
