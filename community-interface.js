/**
 * Community Interface – SMS tool: language toggle and interactive phone mockup
 */
(function() {
  'use strict';

  var LANG = {
    en: {
      intro: 'Community members receive alerts and can reply via SMS or IVR. Use the mockup below to see how messages appear in English or Kiswahili. Type a message and send to try it.',
      divider: 'Today 9:15',
      msgIn: 'Reply with your conservancy code to check carbon payment status or report an issue.',
      msgOut: 'Sera. Payment not received.',
      placeholder: 'Text (Safaricom)',
      send: 'Send'
    },
    sw: {
      intro: 'Wanachama wa jamii wanapokea arifa na wanaweza kujibu kupitia SMS au IVR. Tumia mfano hapa chini kuona jinsi ujumbe unavyoonekana kwa Kiswahili. Andika ujumbe na kutuma kujaribu.',
      divider: 'Leo 9:15',
      msgIn: 'Jibu kwa msimbo wa conservancy yako kuangalia hali ya malipo ya kaboni au ripoti tatizo.',
      msgOut: 'Sera. Malipo hayajapokelewa.',
      placeholder: 'Andika (Safaricom)',
      send: 'Tuma'
    }
  };

  function setLang(lang) {
    var d = LANG[lang] || LANG.en;
    var intro = document.getElementById('phone-intro');
    if (intro) intro.textContent = d.intro;
    var div = document.getElementById('phone-divider');
    if (div) div.textContent = d.divider;
    var divFeat = document.getElementById('phone-divider-feature');
    if (divFeat) divFeat.textContent = d.divider;
    var msgIn = document.getElementById('phone-msg-in');
    if (msgIn) msgIn.textContent = d.msgIn;
    var msgOut = document.getElementById('phone-msg-out');
    if (msgOut) msgOut.textContent = d.msgOut;
    var msgInFeat = document.getElementById('phone-msg-in-feature');
    if (msgInFeat) msgInFeat.textContent = d.msgIn;
    var msgOutFeat = document.getElementById('phone-msg-out-feature');
    if (msgOutFeat) msgOutFeat.textContent = d.msgOut;
    var input = document.getElementById('phone-input');
    if (input) input.placeholder = d.placeholder;
    var inputFeat = document.getElementById('phone-input-feature');
    if (inputFeat) inputFeat.placeholder = d.placeholder;
    var sendBtn = document.getElementById('phone-send-btn');
    if (sendBtn) sendBtn.textContent = d.send;
    var sendFeat = document.getElementById('phone-send-feature');
    if (sendFeat) sendFeat.textContent = d.send;
    var contactEn = document.getElementById('contact-text');
    var contactSw = document.getElementById('contact-sw');
    if (contactEn && contactSw) {
      contactEn.style.display = lang === 'en' ? 'block' : 'none';
      contactSw.style.display = lang === 'sw' ? 'block' : 'none';
    }
  }

  function currentLang() {
    var active = document.querySelector('.tool-card-phone .lang-btn.active');
    return (active && active.getAttribute('data-lang')) || 'en';
  }

  function getTime() {
    var d = new Date();
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function sendMessage() {
    var inputSmart = document.getElementById('phone-input');
    var inputFeat = document.getElementById('phone-input-feature');
    var threadSmart = document.getElementById('thread-smart');
    var threadFeat = document.getElementById('thread-feature');
    var text = ((inputSmart && inputSmart.value) || (inputFeat && inputFeat.value) || '').trim();
    if (!text) return;
    var time = getTime();
    var msgHtml = '<span class="msg-body">' + escapeHtml(text) + '</span><span class="msg-time">' + escapeHtml(time) + '</span>';
    var msgOut = document.createElement('div');
    msgOut.className = 'msg msg-out';
    msgOut.innerHTML = msgHtml;
    if (threadSmart) {
      threadSmart.appendChild(msgOut.cloneNode(true));
      threadSmart.scrollTop = threadSmart.scrollHeight;
    }
    if (threadFeat) {
      threadFeat.appendChild(msgOut.cloneNode(true));
      threadFeat.scrollTop = threadFeat.scrollHeight;
    }
    if (inputSmart) inputSmart.value = '';
    if (inputFeat) inputFeat.value = '';
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function setDevice(device) {
    var viewSmart = document.getElementById('phone-view-smart');
    var viewFeat = document.getElementById('phone-view-feature');
    var btns = document.querySelectorAll('.device-btn');
    btns.forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-device') === device);
      b.setAttribute('aria-pressed', b.getAttribute('data-device') === device ? 'true' : 'false');
    });
    if (viewSmart) {
      viewSmart.classList.toggle('active', device === 'smart');
      viewSmart.setAttribute('aria-hidden', device !== 'smart');
    }
    if (viewFeat) {
      viewFeat.classList.toggle('active', device === 'feature');
      viewFeat.setAttribute('aria-hidden', device !== 'feature');
    }
  }

  function init() {
    var toolCard = document.querySelector('.tool-card-phone');
    if (!toolCard) return;

    toolCard.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        toolCard.querySelectorAll('.lang-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        setLang(btn.getAttribute('data-lang'));
      });
    });
    toolCard.querySelectorAll('.device-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        setDevice(btn.getAttribute('data-device'));
      });
    });
    setLang(currentLang());
    setDevice('smart');

    var input = document.getElementById('phone-input');
    var inputFeat = document.getElementById('phone-input-feature');
    var sendBtn = document.getElementById('phone-send-btn');
    var sendFeat = document.getElementById('phone-send-feature');
    function onEnter(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    }
    if (input) {
      input.removeAttribute('readonly');
      input.addEventListener('keydown', onEnter);
    }
    if (inputFeat) inputFeat.addEventListener('keydown', onEnter);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (sendFeat) sendFeat.addEventListener('click', sendMessage);

    var keypadKeys = toolCard.querySelectorAll('.keypad-key[data-char]');
    keypadKeys.forEach(function(k) {
      k.addEventListener('click', function() {
        if (!inputFeat) return;
        var c = k.getAttribute('data-char');
        if (c.length === 1) {
          inputFeat.value = inputFeat.value + c;
          inputFeat.focus();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
