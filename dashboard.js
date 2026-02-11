/**
 * Dashboard – map and conservancy detail panel
 */
(function() {
  'use strict';

  function formatMoney(n) {
    return '$' + n.toLocaleString();
  }

  function na(v) {
    return (v === null || v === undefined || v === '') ? 'N/A' : v;
  }
  function naNum(v) {
    return (v === null || v === undefined) ? 'N/A' : v.toLocaleString();
  }
  function naMoney(v) {
    return (v === null || v === undefined) ? 'N/A' : formatMoney(v);
  }

  function renderConservancyDetail(c) {
    if (!c) return '';
    var cycles = c.cycles || [];
    var cycleRows = cycles.map(function(cy, i) {
      var carbonStr = (cy.carbonSold != null) ? naNum(cy.carbonSold) + ' tCO2e' : 'N/A';
      var amountStr = naMoney(cy.amountReceivedUSD);
      var spendingStr = 'N/A';
      if (cy.spending && cy.spending.length) {
        spendingStr = cy.spending.map(function(s) { return s.category + ': ' + formatMoney(s.amount); }).join('; ');
      }
      return '<tr><td>' + (i + 1) + '</td><td>' + (cy.period || 'N/A') + '</td><td>' + carbonStr + '</td><td>' + amountStr + '</td><td>' + spendingStr + '</td></tr>';
    }).join('');
    var landStr = 'N/A';
    if (c.landKm2 != null) landStr = c.landKm2.toLocaleString() + ' km²';
    else if (c.landHectares != null) landStr = (c.landHectares / 100).toLocaleString() + ' km²';
    var firstPaymentStr = (c.firstPaymentFeb2022USD != null) ? formatMoney(c.firstPaymentFeb2022USD) + ' (NRT, Feb 2022)' : 'N/A';
    return (
      '<div class="conservancy-detail-grid">' +
        '<div class="conservancy-detail-item"><span class="conservancy-detail-label">Land area</span><span class="conservancy-detail-value">' + landStr + '</span></div>' +
        '<div class="conservancy-detail-item"><span class="conservancy-detail-label">First payment (Feb 2022)</span><span class="conservancy-detail-value conservancy-detail-highlight">' + firstPaymentStr + '</span></div>' +
        '<div class="conservancy-detail-item"><span class="conservancy-detail-label">Communities</span><span class="conservancy-detail-value">' + na(c.numCommunities) + '</span></div>' +
        '<div class="conservancy-detail-item"><span class="conservancy-detail-label">Families</span><span class="conservancy-detail-value">' + naNum(c.numFamilies) + '</span></div>' +
        '<div class="conservancy-detail-item"><span class="conservancy-detail-label">Population</span><span class="conservancy-detail-value">' + naNum(c.population) + '</span></div>' +
        '<div class="conservancy-detail-item full-width"><span class="conservancy-detail-label">Year joined NRT</span><span class="conservancy-detail-value">' + na(c.yearJoined) + '</span></div>' +
        '<div class="conservancy-detail-item full-width"><span class="conservancy-detail-label">Status</span><span class="conservancy-detail-value">' + na(c.status) + '</span></div>' +
      '</div>' +
      '<div class="conservancy-cycles-detail"><h5>Verification cycles (carbon sold, amount received, spending)</h5>' +
      '<table class="conservancy-cycles-table"><thead><tr><th>Cycle</th><th>Period</th><th>Carbon sold</th><th>Amount received</th><th>Spending</th></tr></thead><tbody>' +
      (cycleRows || '<tr><td colspan="5">N/A</td></tr>') +
      '</tbody></table></div>'
    );
  }

  function initMap() {
    var mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    var conservancies = window.NRT_CONSERVANCIES;
    if (!conservancies || !conservancies.length) return;

    var map = L.map('map').setView([0.75, 37.25], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    var nrtBoundary = [
      [0.02, 36.82], [0.02, 37.08], [0.15, 37.55], [0.45, 38.05], [0.95, 38.35],
      [1.55, 38.42], [2.15, 38.18], [2.55, 37.65], [2.48, 37.12], [2.05, 36.78],
      [1.35, 36.72], [0.65, 36.78], [0.22, 36.82]
    ];
    L.polygon(nrtBoundary, {
      color: '#1a3a0f',
      weight: 2.5,
      fillColor: '#2d5016',
      fillOpacity: 0.08
    }).addTo(map).bindTooltip('NRT boundary – Northern Kenya', {
      permanent: false,
      direction: 'center',
      className: 'nrt-boundary-tooltip'
    });

    var panel = document.getElementById('conservancy-detail-panel');
    var panelName = document.getElementById('conservancy-detail-name');
    var panelBody = document.getElementById('conservancy-detail-body');
    var panelClose = document.getElementById('conservancy-detail-close');

    function showPanel(c) {
      if (!panel || !panelName || !panelBody) return;
      panelName.textContent = c.name;
      panelBody.innerHTML = renderConservancyDetail(c);
      panel.classList.add('conservancy-detail-panel-visible');
      panel.setAttribute('aria-hidden', 'false');
    }

    function hidePanel() {
      if (!panel) return;
      panel.classList.remove('conservancy-detail-panel-visible');
      panel.setAttribute('aria-hidden', 'true');
      if (panelName) panelName.textContent = 'Select a conservancy';
      if (panelBody) panelBody.innerHTML = '<p class="conservancy-detail-placeholder">Click any marker on the map to view name, land size, communities, population, carbon credits sold, amount received and spending breakdown.</p>';
    }

    if (panelClose) panelClose.addEventListener('click', hidePanel);

    var greenIcon = L.divIcon({
      className: 'conservancy-marker',
      html: '<span class="conservancy-marker-dot"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    conservancies.forEach(function(c) {
      var marker = L.marker([c.lat, c.lng], { icon: greenIcon })
        .addTo(map)
        .on('click', function() { showPanel(c); });
      marker._conservancy = c;
      marker.bindTooltip(c.name, { permanent: false, direction: 'top', offset: [0, -10] });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
