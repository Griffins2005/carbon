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
      groupA: 'A) Production Decisions (carbon-relevant)', groupB: 'B) Nutrition Decisions', groupC: 'C) Resource Control (Land/Water/Grazing)', groupD: 'D) Income Control (especially carbon funds)', groupE: 'E) Opportunities (meetings, groups, agenda-setting)', groupF: 'F) Time & Workload', groupG: 'G) Voice in Meetings (plus safety)',
      q_pd1: 'When decisions are made about grazing zones/rotations or where animals move, what is your role?',
      q_pd2: 'If the conservancy changes rules to support carbon goals (e.g., grazing restrictions), how much say do you have in whether your household follows them?',
      q_n1: 'Who decides how money is spent on food most weeks?',
      q_n2: 'If food is limited, how much influence do you have on who gets priority (children/elderly/sick)?',
      q_rc1: 'For land/water/grazing access, do you need permission from someone to use it?',
      q_rc2: 'If there is a grazing or water dispute, can you push for a fair resolution without fear of retaliation?',
      q_ic1: 'When income comes in (livestock/crops/wages), who decides how it\'s used?',
      q_ic2: 'Do you know how carbon-related money is allocated and can you question it if it seems unfair?',
      q_op1: 'In the last 3 months, how often were you invited to a conservancy/carbon meeting that matters?',
      q_op2: 'When you speak in those meetings, what usually happens?',
      q_tw1: 'How much control do you have over your daily workload and schedule?',
      q_tw2: 'Have you missed meetings/opportunities because of workload or caregiving?',
      q_vm1: 'Do you feel safe speaking honestly about benefit-sharing or project issues?',
      q_vm2: 'If you report a complaint, do you trust it will be handled fairly and confidentially?',
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
      groupA: 'A) Maamuzi ya uzalishaji (carbon)', groupB: 'B) Maamuzi ya lishe', groupC: 'C) Udhibiti wa rasilimali (ardhi/maji/malisho)', groupD: 'D) Udhibiti wa kipato', groupE: 'E) Fursa (mikutano, vikundi)', groupF: 'F) Muda na mzigo wa kazi', groupG: 'G) Sauti katika mikutano',
      q_pd1: 'Unacho jukumu gani unapoamua kuhusu maeneo ya malisho au mwendo wa mifugo?',
      q_pd2: 'Unacho neno gani kuhusu kufuata sheria mpya za carbon (k.m. vikwazo vya malisho)?',
      q_n1: 'Nani anaamua matumizi ya pesa za chakula?',
      q_n2: 'Una ushawishi gani kuhusu kipaumbele (watoto/wazee/wagonjwa) chakula kinapokuwa kidogo?',
      q_rc1: 'Unahitaji ruhusa ya mtu kutumia ardhi, maji au malisho?',
      q_rc2: 'Unaweza kusukuma suluhu sahihi bila hofu ya kisasi?',
      q_ic1: 'Kipato kinapoingia (mifugo/mazao/mishahara), nani anaamua matumizi?',
      q_ic2: 'Unajua jinsi pesa za carbon zinavyotumika na unaweza kuuliza ikiwa si sawa?',
      q_op1: 'Miezi 3 iliyopita, ulialikwa mara ngapi kwenye mkutano muhimu wa conservancy/carbon?',
      q_op2: 'Unaposema katika mikutano, kwa kawaida kinachotokea ni nini?',
      q_tw1: 'Una udhibiti gani juu ya mzigo wa kazi na ratiba yako?',
      q_tw2: 'Umekosa mikutano au fursa kwa sababu ya kazi au utunzaji?',
      q_vm1: 'Unajisikia salama kusema ukweli kuhusu kushiriki faida au mambo ya mradi?',
      q_vm2: 'Unapotoa malalamiko, una imani yatashughulikiwa kwa haki na siri?',
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
        function getVal(name) {
          var r = form.querySelector('input[name="' + name + '"]:checked');
          return r ? parseInt(r.value, 10) : 3;
        }
        var pd1 = getVal('pd1'), pd2 = getVal('pd2'), n1 = getVal('n1'), n2 = getVal('n2');
        var rc1 = getVal('rc1'), rc2 = getVal('rc2'), ic1 = getVal('ic1'), ic2 = getVal('ic2');
        var op1 = getVal('op1'), op2 = getVal('op2'), tw1 = getVal('tw1'), tw2 = getVal('tw2');
        var vm1 = getVal('vm1'), vm2 = getVal('vm2');
        var tw2Reversed = 6 - tw2;
        var vals = {
          production: Math.round((pd1 + pd2) / 2),
          nutrition: Math.round((n1 + n2) / 2),
          resources: Math.round((rc1 + rc2) / 2),
          income: Math.round((ic1 + ic2) / 2),
          opportunities: Math.round((op1 + op2) / 2),
          time: Math.round((tw1 + tw2Reversed) / 2),
          voice: Math.round((vm1 + vm2) / 2)
        };
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
