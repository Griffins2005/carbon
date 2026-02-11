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
    var msgIn = document.getElementById('phone-msg-in');
    if (msgIn) msgIn.textContent = d.msgIn;
    var msgOut = document.getElementById('phone-msg-out');
    if (msgOut) msgOut.textContent = d.msgOut;
    var input = document.getElementById('phone-input');
    if (input) input.placeholder = d.placeholder;
    var sendBtn = document.getElementById('phone-send-btn');
    if (sendBtn) sendBtn.textContent = d.send;
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
    var input = document.getElementById('phone-input');
    var thread = document.querySelector('.phone-thread');
    if (!input || !thread) return;
    var text = (input.value || '').trim();
    if (!text) return;
    var lang = currentLang();
    var time = getTime();
    var msgOut = document.createElement('div');
    msgOut.className = 'msg msg-out';
    msgOut.innerHTML = '<span class="msg-body">' + escapeHtml(text) + '</span><span class="msg-time">' + escapeHtml(time) + '</span>';
    thread.appendChild(msgOut);
    input.value = '';
    thread.scrollTop = thread.scrollHeight;
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
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
    setLang(currentLang());

    var input = document.getElementById('phone-input');
    var sendBtn = document.getElementById('phone-send-btn');
    if (input) {
      input.removeAttribute('readonly');
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        }
      });
    }
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
