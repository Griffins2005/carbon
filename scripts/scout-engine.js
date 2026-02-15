/**
 * SCOUT Engine – survey language toggle and report generation
 */
(function() {
  'use strict';

  var dims = ['production', 'nutrition', 'resources', 'income', 'opportunities', 'time', 'voice'];
  var dimKeys = ['dim1', 'dim2', 'dim3', 'dim4', 'dim5', 'dim6', 'dim7'];
  var LANG = {
    en: {
      intro: 'Survey for community members—aligned to empowerment dimensions (WELI-style). Answer each question; SCOUT will produce indices, warning signs, and action prompts. Use as in the field (phone or tablet) or to see how the tool works.',
      dim1: 'Production decisions', dim2: 'Nutrition', dim3: 'Resource control', dim4: 'Income control', dim5: 'Opportunities', dim6: 'Time & workload', dim7: 'Voice in meetings',
      q1: 'When your household decides what to grow or which animals to keep, what is your role?',
      q2: 'When your household decides how to spend money on food and nutrition, what is your role?',
      q3: 'When it comes to access to and control over land, water, or grazing, what is your role in your household?',
      q4: 'When it comes to income from livestock, crops, or conservancy work, who controls it and what is your role?',
      q5: 'Regarding groups or meetings that affect the conservancy and carbon project, which best describes you?',
      q6: 'How much say do you have over your own time and the work you are expected to do?',
      q7: 'In conservancy or carbon-project meetings, which best describes your ability to speak and be heard?',
      opt1_1: 'Someone else decides; I am not asked or informed', opt1_2: 'I am told what was decided but had no say', opt1_3: 'I am asked my view and it is sometimes considered', opt1_4: 'We decide together (equal say)', opt1_5: 'I make the decision alone or have final say',
      opt2_1: 'Someone else decides; I am not asked or informed', opt2_2: 'I am told what was decided but had no say', opt2_3: 'I am asked my view and it is sometimes considered', opt2_4: 'We decide together (equal say)', opt2_5: 'I make the decision alone or have final say',
      opt3_1: 'Someone else has control; I have no say or access', opt3_2: 'I can use resources but someone else decides access', opt3_3: 'I am consulted; we share access and some control', opt3_4: 'We decide together who uses land, water, or grazing', opt3_5: 'I control access and use (alone or final say)',
      opt4_1: 'Someone else controls the income; I am not involved', opt4_2: 'I am told how income is used but had no say', opt4_3: 'I am asked my view on how to use income; sometimes considered', opt4_4: 'We decide together how to use the income', opt4_5: 'I control the income (alone or have final say)',
      opt5_1: 'I am not invited / no such group or meeting for people like me', opt5_2: 'I can attend but I don\'t speak (or am not expected to)', opt5_3: 'I attend and can speak when I choose', opt5_4: 'I am encouraged to speak and my view is recorded', opt5_5: 'I am a formal member and help set the agenda',
      opt6_1: 'I have no say; my tasks are decided by others', opt6_2: 'I can ask to change but it is rarely accepted', opt6_3: 'I can sometimes refuse or reschedule tasks', opt6_4: 'I have a lot of say in my daily tasks', opt6_5: 'I fully control my time and workload',
      opt7_1: 'I don\'t attend (not allowed or no opportunity)', opt7_2: 'I attend but never speak, or am not heard when I do', opt7_3: 'I speak only when asked a direct question', opt7_4: 'I speak when I want and am usually heard', opt7_5: 'I speak freely and my view influences decisions',
      submitBtn: 'Submit survey → Run SCOUT',
      reportTitle: 'SCOUT report',
      indicesLabel: 'Community-level indices',
      dimScoresLabel: 'Dimension scores',
      redFlagsLabel: 'Red flags',
      actionPromptsLabel: 'Action prompts',
      noRedFlags: 'No red flags. Indices within acceptable range. Continue monitoring.',
      indicesLine: 'Inclusivity (avg): {avg}/5  Voice: {voice}/5  Resource control: {res}/5  Income control: {inc}/5',
      redFlags: { low: 'Low score in one or more empowerment dimensions', income: 'Income control concern', voice: 'Voice / meeting participation low', resources: 'Resource control (land, water, grazing) weak', opportunities: 'Limited access to groups and decision-making' },
      prompts: { income: 'Education module needed on carbon funds & income', voice: 'Governance response overdue: increase meeting voice', resources: 'Review benefit-sharing and resource access with community', opportunities: 'Open opportunities for participation in conservancy and carbon project meetings', generic: 'Review benefit-sharing and resource access' }
    },
    sw: {
      intro: 'Muhtasari wa jamii—unalingana na mwelekeo wa uwezeshaji (WELI). Jibu kila swali; SCOUT itatoa viashirio, ishara za tahadhari na maagizo ya hatua. Tumia shambani (simu au tablet) au angalia jinsi zana inavyofanya kazi.',
      dim1: 'Maamuzi ya uzalishaji', dim2: 'Lishe', dim3: 'Udhibiti wa rasilimali', dim4: 'Udhibiti wa kipato', dim5: 'Fursa', dim6: 'Muda na mzigo wa kazi', dim7: 'Sauti katika mikutano',
      q1: 'Wakati kaya yako inapoamua nini kuotesha au mifugo gani kuwa na, wewe unacho jukumu gani?', q2: 'Wakati pesa za chakula na lishe zinapoamuliwa matumizi yake, wewe unacho jukumu gani?', q3: 'Kuhusu ufikiaji na udhibiti wa ardhi, maji au malisho katika kaya yako, unacho jukumu gani?', q4: 'Kuhusu kipato kutoka mifugo, mazao au kazi ya conservancy, nani anadhibiti na wewe unacho jukumu gani?', q5: 'Kuhusu vikundi au mikutano inayoathiri conservancy na mradi wa carbon, ni ipi inakufaa zaidi?', q6: 'Una neno gani juu ya muda wako na kazi unayotakiwa kufanya?', q7: 'Katika mikutano ya conservancy au mradi wa carbon, ni ipi inaeleza uwezo wako wa kusema na kusikilizwa?',
      opt1_1: 'Mtu mwingine anaamua; sina ombi wala taarifa', opt1_2: 'Ninaambiwa niliamuliwacho lakini sikuwa na neno', opt1_3: 'Ninaulizwa maoni yangu na wakati mwingine yanazingatiwa', opt1_4: 'Tunaamua pamoja (neno sawa)', opt1_5: 'Mimi naamua peke yangu au nina neno la mwisho',
      opt2_1: 'Mtu mwingine anaamua; sina ombi wala taarifa', opt2_2: 'Ninaambiwa niliamuliwacho lakini sikuwa na neno', opt2_3: 'Ninaulizwa maoni yangu na wakati mwingine yanazingatiwa', opt2_4: 'Tunaamua pamoja (neno sawa)', opt2_5: 'Mimi naamua peke yangu au nina neno la mwisho',
      opt3_1: 'Mtu mwingine ana udhibiti; sina neno wala ufikiaji', opt3_2: 'Naweza kutumia rasilimali lakini mtu mwingine anaamua ufikiaji', opt3_3: 'Ninaombwa maoni; tunashiriki ufikiaji na udhibiti fulani', opt3_4: 'Tunaamua pamoja nani atumie ardhi, maji au malisho', opt3_5: 'Mimi nadhibiti ufikiaji na matumizi (peke yangu au neno la mwisho)',
      opt4_1: 'Mtu mwingine anadhibiti kipato; sihusiki', opt4_2: 'Ninaambiwa kipato kinatumwaje lakini sikuwa na neno', opt4_3: 'Ninaulizwa maoni juu ya matumizi ya kipato; wakati mwingine yanazingatiwa', opt4_4: 'Tunaamua pamoja matumizi ya kipato', opt4_5: 'Mimi nadhibiti kipato (peke yangu au nina neno la mwisho)',
      opt5_1: 'Sialikiwa / hakuna kikundi au mkutano kwa watu kama mimi', opt5_2: 'Naweza kuhudhuria lakini sisemi (au siatarajiwa kusema)', opt5_3: 'Nahudhuria na naweza kusema ninapotaka', opt5_4: 'Ninahimizwa kusema na maoni yangu yanaandikwa', opt5_5: 'Nina uanachama rasmi na nasaidia kuweka ajenda',
      opt6_1: 'Sina neno; kazi zangu zinaamuliwa na wengine', opt6_2: 'Naweza kuomba mabadiliko lakini mara chache inakubalika', opt6_3: 'Wakati mwingine naweza kukataa au kuahirisha kazi', opt6_4: 'Nina neno kubwa katika kazi zangu za kila siku', opt6_5: 'Nadhibiti kabisa muda wangu na mzigo wa kazi',
      opt7_1: 'Sihudhuria (siwaruhusiwa au hakuna nafasi)', opt7_2: 'Nahudhuria lakini sisemi kamwe, au hasikilizwi ninaposema', opt7_3: 'Ninasema tu ninapoulizwa swali moja kwa moja', opt7_4: 'Ninasema ninapotaka na kawaida nasikilizwa', opt7_5: 'Ninasema huru na maoni yangu yanaathiri maamuzi',
      submitBtn: 'Wasilisha muhtasari',
      reportTitle: 'Ripoti ya SCOUT',
      indicesLabel: 'Viashirio vya kiwango cha jamii',
      dimScoresLabel: 'Alama za mwelekeo',
      redFlagsLabel: 'Ishara za tahadhari',
      actionPromptsLabel: 'Maagizo ya hatua',
      noRedFlags: 'Hakuna ishara za tahadhari. Viashirio vyote viko ndani ya kiwango. Endelea kufuatilia.',
      indicesLine: 'Wasiliani (wastani): {avg}/5  Sauti: {voice}/5  Udhibiti rasilimali: {res}/5  Udhibiti kipato: {inc}/5',
      redFlags: { low: 'Alama ya chini katika mwelekeo mmoja au zaidi wa uwezeshaji', income: 'Wasiwasi wa udhibiti wa kipato', voice: 'Sauti na ushiriki katika mikutano ni wa chini', resources: 'Udhibiti wa rasilimali (ardhi, maji, malisho) hautoshi', opportunities: 'Fursa kidogo za kushiriki katika vikundi na maamuzi' },
      prompts: { income: 'Moduli ya elimu inahitajika kuhusu mifuko ya carbon na kipato', voice: 'Jibu la utawala limechelewa: ongeza nafasi ya kusema mikutanoni', resources: 'Kagua kushiriki faida na ufikiaji wa rasilimali na jamii', opportunities: 'Fungua fursa za kushiriki mikutanoni ya conservancy na mradi wa carbon', generic: 'Kagua kushiriki faida na ufikiaji wa rasilimali' }
    }
  };

  var form = document.getElementById('scout-survey-form');
  var reportEl = document.getElementById('scout-report');
  var toolCard = document.querySelector('.tool-card-scout');
  var introEl = document.getElementById('scout-intro');
  var submitBtn = document.getElementById('scout-submit-btn');

  function currentLang() {
    var active = toolCard && toolCard.querySelector('.lang-btn.active');
    return (active && active.getAttribute('data-lang')) || 'en';
  }

  function applyScoutLang() {
    var lang = currentLang();
    var t = LANG[lang] || LANG.en;
    if (introEl) introEl.textContent = t.intro;
    if (submitBtn) submitBtn.textContent = t.submitBtn;
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });
  }

  function scrollToFirstQuestion() {
    var first = document.getElementById('scout-first-question');
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var firstInput = first.querySelector('input[type="radio"]');
      if (firstInput) {
        setTimeout(function() { firstInput.focus({ preventScroll: true }); }, 400);
      }
    }
  }

  function init() {
    if (location.hash === '#scout-first-question') {
      setTimeout(scrollToFirstQuestion, 100);
    }
    var startBtn = document.getElementById('scout-start-survey-btn');
    if (startBtn) {
      startBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (document.getElementById('scout-first-question')) {
          history.replaceState(null, '', document.location.pathname + '#scout-first-question');
          scrollToFirstQuestion();
        } else {
          document.location.hash = 'scout-first-question';
        }
      });
    }
    if (toolCard) {
      toolCard.querySelectorAll('.lang-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          toolCard.querySelectorAll('.lang-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          applyScoutLang();
        });
      });
    }
    applyScoutLang();
    initSocialCommsCharts();

    if (form && reportEl) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var lang = currentLang();
        var t = LANG[lang] || LANG.en;
        var vals = {};
        dims.forEach(function(_, i) {
          var name = dims[i];
          var r = form.querySelector('input[name="q' + (i + 1) + '"]:checked');
          vals[name] = r ? parseInt(r.value, 10) : 3;
        });
        var sum = 0, n = dims.length;
        dims.forEach(function(k) { sum += vals[k]; });
        var avg = (sum / n).toFixed(1);
        var min = Math.min(vals.production, vals.nutrition, vals.resources, vals.income, vals.opportunities, vals.time, vals.voice);
        var redFlags = [];
        if (min <= 2) redFlags.push(t.redFlags.low);
        if (vals.income <= 2) redFlags.push(t.redFlags.income);
        if (vals.voice <= 2) redFlags.push(t.redFlags.voice);
        if (vals.resources <= 2) redFlags.push(t.redFlags.resources);
        if (vals.opportunities <= 2) redFlags.push(t.redFlags.opportunities);
        var prompts = [];
        if (vals.income <= 2) prompts.push(t.prompts.income);
        if (vals.voice <= 2) prompts.push(t.prompts.voice);
        if (vals.resources <= 2) prompts.push(t.prompts.resources);
        if (vals.opportunities <= 2) prompts.push(t.prompts.opportunities);
        if (min <= 2 && prompts.length === 0) prompts.push(t.prompts.generic);
        var dimLabels = dimKeys.map(function(k, i) { return (t[k] || dims[i]) + ': ' + vals[dims[i]] + '/5'; }).join(' \u00A0 ');
        var html = '<h5 class="scout-report-title">' + t.reportTitle + '</h5>';
        html += '<div class="scout-indices"><strong>' + t.indicesLabel + '</strong><br>' + (t.indicesLine || '').replace('{avg}', avg).replace('{voice}', vals.voice).replace('{res}', vals.resources).replace('{inc}', vals.income) + '</div>';
        html += '<div class="scout-dims"><strong>' + t.dimScoresLabel + '</strong><br>' + dimLabels + '</div>';
        if (redFlags.length) html += '<div class="scout-flags"><strong>' + t.redFlagsLabel + '</strong><ul><li>' + redFlags.join('</li><li>') + '</li></ul></div>';
        if (prompts.length) html += '<div class="scout-prompts"><strong>' + t.actionPromptsLabel + '</strong><ul><li>' + prompts.join('</li><li>') + '</li></ul></div>';
        if (!redFlags.length && !prompts.length) html += '<div class="scout-ok">' + t.noRedFlags + '</div>';
        reportEl.innerHTML = html;
        reportEl.hidden = false;
        reportEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  var PIE_COLORS = ['#1e3a0f', '#166534', '#15803d', '#0d9488', '#16a34a', '#65a30d', '#a3e635', '#86efac', '#4b5563', '#6b7280'];

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function buildPieChart(title, items, colors) {
    var total = 0;
    items.forEach(function(item) { total += (item.percent != null ? item.percent : (item.count != null ? item.count : 0)); });
    if (total <= 0) return '';
    var cumul = 0;
    var paths = [];
    for (var i = 0; i < items.length; i++) {
      var pct = items[i].percent != null ? items[i].percent : (total > 0 ? (items[i].count || 0) / total * 100 : 0);
      if (pct <= 0) continue;
      var startDeg = -90 + 360 * (cumul / 100);
      var endDeg = -90 + 360 * ((cumul + pct) / 100);
      cumul += pct;
      var startRad = startDeg * Math.PI / 180;
      var endRad = endDeg * Math.PI / 180;
      var x1 = 50 + 40 * Math.cos(startRad);
      var y1 = 50 + 40 * Math.sin(startRad);
      var x2 = 50 + 40 * Math.cos(endRad);
      var y2 = 50 + 40 * Math.sin(endRad);
      var large = pct > 50 ? 1 : 0;
      var d = 'M 50 50 L ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' A 40 40 0 ' + large + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' Z';
      var color = colors[i % colors.length];
      paths.push('<path fill="' + color + '" stroke="#fff" stroke-width="0.8" d="' + d + '"/>');
    }
    var legend = items.map(function(item, i) {
      var pct = item.percent != null ? item.percent : (item.count != null && total > 0 ? ((item.count / total) * 100).toFixed(1) : '');
      var color = colors[i % colors.length];
      return '<div class="social-pie-legend-item"><span class="social-pie-dot" style="background:' + color + '"></span><span class="social-pie-label">' + escapeHtml(item.label) + '</span><span class="social-pie-pct">' + (pct !== '' ? (typeof pct === 'number' ? pct.toFixed(1) : pct) + '%' : '') + '</span></div>';
    }).join('');
    return '<div class="social-pie-card">' +
      '<h4 class="social-pie-title">' + escapeHtml(title) + '</h4>' +
      '<div class="social-pie-viz">' +
      '<svg viewBox="0 0 100 100" class="social-pie-svg" aria-hidden="true">' + paths.join('') + '</svg>' +
      '</div>' +
      '<div class="social-pie-legend">' + legend + '</div>' +
      '</div>';
  }

  function initSocialCommsCharts() {
    var grid = document.getElementById('social-comms-charts-grid');
    if (!grid) return;
    if (typeof fetch === 'undefined') {
      grid.innerHTML = '<p class="social-comms-charts-missing">Charts require fetch. Data: <code>data/social-comms.json</code>.</p>';
      return;
    }
    fetch('data/social-comms.json').then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }).then(function(data) {
      if (!data) {
        grid.innerHTML = '<p class="social-comms-charts-missing">Could not load <code>data/social-comms.json</code>.</p>';
        return;
      }
      var titles = {
        livelihood: 'Livelihood activities',
        grievance_categories: 'Grievances by category (2025)',
        gender: 'Gender',
        age: 'Age distribution',
        education: 'Education level',
        income_sources: 'Income sources'
      };
      var order = ['livelihood', 'grievance_categories', 'income_sources', 'gender', 'age', 'education'];
      var html = '';
      order.forEach(function(key) {
        var arr = data[key];
        if (Array.isArray(arr) && arr.length) html += buildPieChart(titles[key] || key, arr, PIE_COLORS);
      });
      grid.innerHTML = html || '<p class="social-comms-charts-missing">No chart data in social-comms.json.</p>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
