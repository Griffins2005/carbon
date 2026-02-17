/**
 * Dashboard – interactive map with boundaries and detail panel.
 * Prefers kenya-carbon-harmonized.json (merged from primary + comprehensive + conservancies.js + 4 KMLs).
 * Fallback: kenya-carbon-projects.json + kenya-carbon-projects-comprehensive.json (+ conservancies.js).
 */
(function() {
  'use strict';

  var KENYA_DATA = null;
  var KENYA_COMPREHENSIVE = null;

  var MAP_STYLES = {
    nrtProject:    { color: '#14532d', weight: 4, fillColor: '#166534', fillOpacity: 0.12 },
    nrtConservancy: { color: '#15803d', weight: 2, fillColor: '#22c55e', fillOpacity: 0.68 },
    komaza:        { color: '#0e7490', weight: 2, fillColor: '#06b6d4', fillOpacity: 0.6 },
    boomitra:      { color: '#b45309', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.6 },
    kcsa:          { color: '#6d28d9', weight: 2, fillColor: '#8b5cf6', fillOpacity: 0.6 }
  };

  function formatMoney(n) {
    return n != null ? '$' + Number(n).toLocaleString() : 'N/A';
  }
  function na(v) {
    return (v === null || v === undefined || v === '') ? 'N/A' : v;
  }
  function naNum(v) {
    return (v === null || v === undefined) ? 'N/A' : Number(v).toLocaleString();
  }
  /** Use N/A instead of zero where data isn't available (optional counts/amounts). */
  function naNumOrZero(v) {
    if (v === null || v === undefined || v === '') return 'N/A';
    var n = Number(v);
    return (n === 0 || isNaN(n)) ? 'N/A' : n.toLocaleString();
  }
  function formatAreaHa(ha) {
    if (ha == null) return 'N/A';
    var n = Number(ha);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M ha';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'k ha';
    return n.toLocaleString() + ' ha';
  }
  function formatAreaKm2(km2) {
    if (km2 == null) return 'N/A';
    return Number(km2).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' km²';
  }

  function toLatLng(coord) {
    if (!coord || coord.length < 2) return null;
    var a = coord[0], b = coord[1];
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
      if (a >= 25 && a <= 50 && b >= -5 && b <= 12) return [b, a];
      return [a, b];
    }
    return [b, a];
  }

  function parseBoundaryLatLngs(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(function(c) { return toLatLng(c); }).filter(Boolean);
  }

  function ensureVisiblePolygon(latlngs, centerLat, centerLng) {
    if (!latlngs || latlngs.length < 3) {
      var lat = centerLat != null ? centerLat : (latlngs && latlngs[0] && latlngs[0][0] != null ? latlngs[0][0] : 0);
      var lng = centerLng != null ? centerLng : (latlngs && latlngs[0] && latlngs[0][1] != null ? latlngs[0][1] : 37);
      var d = 0.08;
      return [[lat - d, lng - d], [lat - d, lng + d], [lat + d, lng + d], [lat + d, lng - d]];
    }
    var uniq = [];
    latlngs.forEach(function(p) {
      if (!p || p.length < 2) return;
      var key = p[0].toFixed(5) + ',' + p[1].toFixed(5);
      if (uniq.some(function(u) { return (u[0].toFixed(5) + ',' + u[1].toFixed(5)) === key; })) return;
      uniq.push(p);
    });
    if (uniq.length < 3) {
      var c = uniq[0] || [0, 37];
      var d = 0.08;
      return [[c[0] - d, c[1] - d], [c[0] - d, c[1] + d], [c[0] + d, c[1] + d], [c[0] + d, c[1] - d]];
    }
    return latlngs;
  }

  function parseSimplifiedCoordinates(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(function(c) {
      if (!Array.isArray(c) || c.length < 2) return null;
      return toLatLng(c);
    }).filter(Boolean);
  }

  function polygonCentroid(latlngs) {
    if (!latlngs || latlngs.length < 1) return null;
    var sumLat = 0, sumLng = 0;
    latlngs.forEach(function(p) {
      sumLat += p[0];
      sumLng += p[1];
    });
    return [sumLat / latlngs.length, sumLng / latlngs.length];
  }

  function convexHull(points) {
    if (!points || points.length < 3) return points || [];
    var pts = points.slice();
    var start = pts[0];
    pts.forEach(function(p) {
      if (p[0] < start[0] || (p[0] === start[0] && p[1] < start[1])) start = p;
    });
    var byAngle = pts.filter(function(p) { return p !== start; }).map(function(p) {
      return { p: p, angle: Math.atan2(p[1] - start[1], p[0] - start[0]) };
    });
    byAngle.sort(function(a, b) { return a.angle - b.angle; });
    var hull = [start];
    for (var i = 0; i < byAngle.length; i++) {
      var q = byAngle[i].p;
      while (hull.length >= 2) {
        var a = hull[hull.length - 2], b = hull[hull.length - 1];
        var cross = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
        if (cross <= 0) hull.pop();
        else break;
      }
      hull.push(q);
    }
    return hull;
  }

  var KENYA_COUNTY_CENTERS = {
    'Kilifi': [-3.8, 39.6], 'Kwale': [-4.2, 39.5], 'Nyandarua': [-0.5, 36.4],
    'Laikipia': [0.2, 36.9], 'Nakuru': [-0.3, 36.1], 'Narok': [-1.5, 35.9],
    'Turkana': [3.5, 35.5], 'Samburu': [1.2, 37.2], 'Isiolo': [0.4, 37.6],
    'Marsabit': [2.3, 37.9], 'Baringo': [0.5, 35.9]
  };

  function updateDashboardFromData(data) {
    if (!data || !data.metadata) return;
    var meta = data.metadata;
    var el;
    if (meta.total_projects != null && (el = document.getElementById('stat-total-projects'))) el.textContent = meta.total_projects;
    var totalIssued = 0, totalRetired = 0;
    if (data.projects && data.projects.length) {
      data.projects.forEach(function(proj) {
        if (proj.conservancies && Array.isArray(proj.conservancies)) {
          proj.conservancies.forEach(function(c) {
            var cc = c.carbon_credits || {};
            if (cc.issued_tco2e != null) totalIssued += Number(cc.issued_tco2e);
            if (cc.retired_tco2e != null) totalRetired += Number(cc.retired_tco2e);
          });
        }
      });
    }
    if (totalIssued > 0 && (el = document.getElementById('stat-credits-issued'))) el.textContent = (totalIssued / 1e6).toFixed(1) + 'M';
    if (totalRetired > 0 && (el = document.getElementById('stat-credits-retired'))) el.textContent = (totalRetired / 1e6).toFixed(1) + 'M';
    var container = document.getElementById('kenya-projects-overview');
    if (!container || !data.projects || !data.projects.length) return;
    var html = '';
    data.projects.forEach(function(p) {
      var verraId = (p.project_id || '').replace('VCS', '');
      var verraUrl = 'https://registry.verra.org/app/projectDetail/VCS/' + verraId;
      var areaStr = (p.area && p.area.hectares != null) ? formatAreaHa(p.area.hectares) : 'N/A';
      html += '<div class="project-overview-card" data-project-id="' + (p.project_id || '') + '">' +
        '<div class="project-overview-name">' + (p.short_name || p.name || p.project_id) + '</div>' +
        '<div class="project-overview-meta">' + (p.proponent || '') + ' · ' + (p.status || '') + '</div>' +
        '<div class="project-overview-area">' + areaStr + '</div>' +
        '<a href="' + verraUrl + '" target="_blank" rel="noopener">Verra VCS ' + verraId + '</a>' +
        '</div>';
    });
    container.innerHTML = html;
    if (data.carbon_credits_summary && (data.carbon_credits_summary.total_issued_tco2e != null || data.carbon_credits_summary.total_retired_tco2e != null)) {
      var ccs = data.carbon_credits_summary;
      if ((el = document.getElementById('stat-credits-issued')) && ccs.total_issued_tco2e != null) el.textContent = (ccs.total_issued_tco2e / 1e6).toFixed(1) + 'M';
      if ((el = document.getElementById('stat-credits-retired')) && ccs.total_retired_tco2e != null) el.textContent = (ccs.total_retired_tco2e / 1e6).toFixed(1) + 'M';
    }
    if ((el = document.getElementById('stat-community-share')) && data.community_benefits_summary && data.community_benefits_summary.community_share_percent != null) el.textContent = data.community_benefits_summary.community_share_percent + '%';
    populateDashboardCards(data);
  }

  function populateDashboardCards(data) {
    var el;
    if (data.carbon_credits_summary) {
      var ccs = data.carbon_credits_summary;
      if ((el = document.getElementById('data-credits-issued'))) el.textContent = ccs.total_issued_tco2e != null ? (ccs.total_issued_tco2e / 1e6).toFixed(1) + 'M tCO2e' : '—';
      if ((el = document.getElementById('data-credits-retired'))) el.textContent = ccs.total_retired_tco2e != null ? (ccs.total_retired_tco2e / 1e6).toFixed(1) + 'M tCO2e' : '—';
      if ((el = document.getElementById('data-credits-available'))) el.textContent = ccs.total_available_tco2e != null ? (ccs.total_available_tco2e / 1e6).toFixed(1) + 'M tCO2e' : '—';
      if ((el = document.getElementById('data-credits-revenue'))) el.textContent = ccs.total_revenue_usd != null ? formatMoney(ccs.total_revenue_usd) : '—';
    }
    if (data.social_community_data) {
      var sc = data.social_community_data;
      var weli = sc.womens_empowerment && sc.womens_empowerment.weli_index;
      if (weli) {
        var current = weli.current_score != null ? weli.current_score : 0;
        var target = weli.target_score != null ? weli.target_score : 50;
        if ((el = document.getElementById('data-weli'))) el.textContent = current + '%';
        if ((el = document.getElementById('data-weli-target'))) el.textContent = 'Target: ' + target + '%';
        if ((el = document.getElementById('data-weli-fill'))) el.style.width = Math.min(100, current) + '%';
      }
      var trust = sc.community_trust && sc.community_trust.overall_trust_index;
      if (trust && (el = document.getElementById('data-trust'))) el.textContent = (trust.score != null && trust.max_score != null) ? trust.score + ' / ' + trust.max_score : '—';
      var part = sc.participation_metrics && sc.participation_metrics.household_participation;
      if (part && (el = document.getElementById('data-participation'))) el.textContent = part.participation_rate_percent != null ? part.participation_rate_percent + '%' : '—';
      if ((el = document.getElementById('data-population'))) el.textContent = sc.total_population_covered != null ? naNum(sc.total_population_covered) : '—';
    } else {
      /* Dummy SCOUT / SocialCoMMs when no survey data (illustrative) */
      if ((el = document.getElementById('data-weli'))) el.textContent = '—';
      if ((el = document.getElementById('data-weli-target'))) el.textContent = 'Target: 50%';
      if ((el = document.getElementById('data-weli-fill'))) el.style.width = '0%';
      if ((el = document.getElementById('data-trust'))) el.textContent = '—';
      if ((el = document.getElementById('data-participation'))) el.textContent = '—';
      if ((el = document.getElementById('data-population'))) el.textContent = '—';
    }
    if (data.social_community_data && data.social_community_data.grievance_mechanism) {
      var gm = data.social_community_data.grievance_mechanism;
      var rateVal = gm.resolution_rate_percent != null ? gm.resolution_rate_percent : (gm.resolved != null && gm.total_grievances_2025 != null && gm.total_grievances_2025 > 0 ? Math.round(100 * gm.resolved / gm.total_grievances_2025) : null);
      if ((el = document.getElementById('data-grievances-total'))) el.textContent = gm.total_grievances_2025 != null ? gm.total_grievances_2025 : '—';
      if ((el = document.getElementById('data-grievances-resolved'))) el.textContent = gm.resolved != null ? gm.resolved : '—';
      if ((el = document.getElementById('data-grievances-rate'))) el.textContent = rateVal != null ? rateVal + '%' : '—';
      var list = document.getElementById('feedback-list');
      if (list && gm.categories) {
        var items = [];
        Object.keys(gm.categories).forEach(function(k) {
          var cat = gm.categories[k];
          if (cat && cat.count != null) items.push({ name: k.replace(/_/g, ' '), count: cat.count, resolved: cat.resolved, pct: cat.percent_resolved });
        });
        items.sort(function(a, b) { return (b.count || 0) - (a.count || 0); });
        list.innerHTML = items.slice(0, 6).map(function(i) {
          var status = (i.pct >= 85) ? 'status-resolved' : (i.pct >= 50 ? 'status-review' : 'status-open');
          return '<div class="feedback-item">' +
            '<div><div class="feedback-text">' + i.name + '</div><div class="feedback-date">' + (i.resolved != null ? i.resolved + ' resolved' : '') + (i.pct != null ? ' · ' + i.pct + '%' : '') + '</div></div>' +
            '<div class="status-tag ' + status + '">' + (i.count || 0) + '</div></div>';
        }).join('');
      }
    } else {
      /* Dummy grievance when no data (illustrative) */
      if ((el = document.getElementById('data-grievances-total'))) el.textContent = '—';
      if ((el = document.getElementById('data-grievances-resolved'))) el.textContent = '—';
      if ((el = document.getElementById('data-grievances-rate'))) el.textContent = '—';
      var list = document.getElementById('feedback-list');
      if (list) list.innerHTML = '';
    }
    if (data.community_benefits_summary) {
      var cbs = data.community_benefits_summary;
      if ((el = document.getElementById('benefits-subtitle'))) el.textContent = 'Community share: ' + (cbs.community_share_percent != null ? cbs.community_share_percent + '%' : '—') + (cbs.total_investment_usd != null ? ' · Total investment: ' + formatMoney(cbs.total_investment_usd) : '');
      var grid = document.getElementById('community-benefits-grid');
      if (grid && cbs.distribution) {
        var cards = [];
        Object.keys(cbs.distribution).forEach(function(k) {
          var d = cbs.distribution[k];
          if (!d || d.investment_usd == null) return;
          var title = k.replace(/_/g, ' ');
          var detail = (d.projects_count != null ? d.projects_count + ' projects' : '') + (d.beneficiaries != null ? ' · ' + naNum(d.beneficiaries) + ' beneficiaries' : '');
          cards.push('<div class="project-card">' +
            '<div class="project-title">' + title + '</div>' +
            '<div class="project-amount">' + formatMoney(d.investment_usd) + '</div>' +
            '<div class="project-detail">' + detail + '</div>' +
            '</div>');
        });
        grid.innerHTML = cards.join('');
      }
    }
  }

  function unwrapVal(v) {
    if (v != null && typeof v === 'object' && 'value' in v) return v.value;
    return v;
  }
  function renderConservancyDetail(c) {
    if (!c) return '';
    var name = c.name || c.short_name || 'Conservancy';
    var areaKm2 = unwrapVal(c.area_km2) != null ? unwrapVal(c.area_km2) : c.area_km2;
    var areaHa = unwrapVal(c.area_hectares) != null ? unwrapVal(c.area_hectares) : c.landHectares;
    var areaStr = areaKm2 != null ? formatAreaKm2(areaKm2) : (areaHa != null ? formatAreaHa(areaHa) + ' (ha)' : 'N/A');
    var cc = c.carbon_credits || {};
    var issuedVal = unwrapVal(cc.issued_tco2e);
    var retiredVal = unwrapVal(cc.retired_tco2e);
    var proposedVal = unwrapVal(cc.proposed_tco2e);
    var issued = (issuedVal != null && Number(issuedVal) !== 0) ? naNum(issuedVal) + ' tCO2e' : 'N/A';
    var retired = (retiredVal != null && Number(retiredVal) !== 0) ? naNum(retiredVal) + ' tCO2e' : 'N/A';
    var proposed = (proposedVal != null && Number(proposedVal) !== 0) ? naNum(proposedVal) + ' tCO2e' : 'N/A';
    var pop = naNumOrZero(unwrapVal(c.population));
    var hh = naNumOrZero(unwrapVal(c.households));
    var livestock = naNumOrZero(unwrapVal(c.livestock_units));
    var counties = (c.counties && c.counties.length) ? c.counties.join(', ') : 'N/A';
    var established = c.established || 'N/A';
    var subLocs = (c.sub_locations && c.sub_locations.length) ? c.sub_locations.join(', ') : 'N/A';
    var firstPayment = (c.firstPaymentFeb2022USD != null || c.first_payment_feb_2022_usd != null) ? formatMoney(c.firstPaymentFeb2022USD != null ? c.firstPaymentFeb2022USD : c.first_payment_feb_2022_usd) : 'N/A';
    var communities = naNumOrZero(c.numCommunities);
    var status = (c.status != null && c.status !== '') ? c.status : 'N/A';
    var html = '<p><strong>Land area</strong> ' + areaStr + '</p>' +
      '<p><strong>Counties</strong> ' + counties + '</p>' +
      '<p><strong>Sub-locations</strong> ' + subLocs + '</p>' +
      '<p><strong>Established</strong> ' + established + '</p>' +
      '<p><strong>Households</strong> ' + hh + '</p>' +
      '<p><strong>Population</strong> ' + pop + '</p>' +
      '<p><strong>Livestock units</strong> ' + livestock + '</p>' +
      (communities !== 'N/A' ? '<p><strong>Communities</strong> ' + communities + '</p>' : '') +
      '<p><strong>Carbon issued</strong> ' + issued + '</p>' +
      '<p><strong>Carbon retired</strong> ' + retired + '</p>' +
      '<p><strong>Carbon proposed</strong> ' + proposed + '</p>' +
      '<p><strong>First payment (Feb 2022)</strong> ' + firstPayment + '</p>' +
      (status !== 'N/A' ? '<p><strong>Status</strong> ' + status + '</p>' : '');
    var cycles = c.cycles && Array.isArray(c.cycles) && c.cycles.length;
    if (cycles) {
      html += '<p><strong>Verification cycles</strong></p><ul class="conservancy-cycles">';
      c.cycles.forEach(function(cy) {
        var sold = (cy.carbonSold != null && Number(cy.carbonSold) !== 0) ? naNum(cy.carbonSold) + ' tCO2e' : 'N/A';
        var received = (cy.amountReceivedUSD != null && Number(cy.amountReceivedUSD) !== 0) ? formatMoney(cy.amountReceivedUSD) : 'N/A';
        var spend = (cy.spending != null && cy.spending !== '') ? cy.spending : 'N/A';
        html += '<li><strong>' + (cy.period || '') + '</strong>: Sold ' + sold + ', Received ' + received + ', Spending ' + spend + '</li>';
      });
      html += '</ul>';
    }
    return html;
  }

  function renderDetailForPanel(item) {
    if (item && item.project_id && (item.area || item.proponent)) return renderProjectDetail(item);
    return renderConservancyDetail(item);
  }

  /** Return array of { label, value } for table comparison. */
  function getDetailRows(item) {
    if (!item) return [];
    var rows = [];
    function add(label, value) {
    if (value != null && value !== '') rows.push({ label: label, value: String(value) });
    }
    if (item.project_id && (item.area || item.proponent)) {
      var p = item;
      var areaStr = (p.area && p.area.hectares != null) ? formatAreaHa(p.area.hectares) : '';
      if (areaStr) rows.push({ label: 'Area', value: areaStr + ((p.area && p.area.km2 != null) ? ' (' + formatAreaKm2(p.area.km2) + ')' : '') });
      if (p.counties && p.counties.length) rows.push({ label: 'Counties', value: p.counties.join(', ') });
      add('Status', p.status);
      add('Proponent', p.proponent);
      add('Verification', p.verification);
      add('Methodology', p.methodology);
      if (p.crediting_period) rows.push({ label: 'Crediting period', value: (p.crediting_period.start || '') + ' – ' + (p.crediting_period.end || '') });
      if (p.farms && (p.farms.total_farms != null || p.farms.average_farm_size_hectares != null)) {
        var farms = (p.farms.total_farms != null ? naNumOrZero(p.farms.total_farms) : '') + ' farms';
        if (p.farms.average_farm_size_hectares != null) farms += ', avg ' + p.farms.average_farm_size_hectares + ' ha';
        rows.push({ label: 'Farms', value: farms });
      }
      if (p.landowners && (p.landowners.total_landowners != null || p.landowners.average_land_size_acres != null)) {
        var owners = (p.landowners.total_landowners != null ? naNumOrZero(p.landowners.total_landowners) : '') + ' landowners';
        if (p.landowners.average_land_size_acres != null) owners += ', avg ' + Number(p.landowners.average_land_size_acres).toLocaleString() + ' acres';
        rows.push({ label: 'Landowners', value: owners });
      }
      return rows;
    }
    var c = item;
    var areaKm2 = unwrapVal(c.area_km2) != null ? unwrapVal(c.area_km2) : c.area_km2;
    var areaHa = unwrapVal(c.area_hectares) != null ? unwrapVal(c.area_hectares) : c.landHectares;
    var areaStr = areaKm2 != null ? formatAreaKm2(areaKm2) : (areaHa != null ? formatAreaHa(areaHa) + ' (ha)' : '');
    if (areaStr) rows.push({ label: 'Land area', value: areaStr });
    if (c.counties && c.counties.length) rows.push({ label: 'Counties', value: c.counties.join(', ') });
    if (c.sub_locations && c.sub_locations.length) rows.push({ label: 'Sub-locations', value: c.sub_locations.join(', ') });
    add('Established', c.established);
    add('Households', naNumOrZero(unwrapVal(c.households)));
    add('Population', naNumOrZero(unwrapVal(c.population)));
    add('Livestock units', naNumOrZero(unwrapVal(c.livestock_units)));
    if (c.numCommunities != null) rows.push({ label: 'Communities', value: naNumOrZero(c.numCommunities) });
    var cc = c.carbon_credits || {};
    var issued = (unwrapVal(cc.issued_tco2e) != null && Number(cc.issued_tco2e) !== 0) ? naNum(cc.issued_tco2e) + ' tCO2e' : '';
    var retired = (unwrapVal(cc.retired_tco2e) != null && Number(cc.retired_tco2e) !== 0) ? naNum(cc.retired_tco2e) + ' tCO2e' : '';
    var proposed = (unwrapVal(cc.proposed_tco2e) != null && Number(cc.proposed_tco2e) !== 0) ? naNum(cc.proposed_tco2e) + ' tCO2e' : '';
    if (issued) rows.push({ label: 'Carbon issued', value: issued });
    if (retired) rows.push({ label: 'Carbon retired', value: retired });
    if (proposed) rows.push({ label: 'Carbon proposed', value: proposed });
    if (c.firstPaymentFeb2022USD != null || c.first_payment_feb_2022_usd != null) rows.push({ label: 'First payment (Feb 2022)', value: formatMoney(c.firstPaymentFeb2022USD != null ? c.firstPaymentFeb2022USD : c.first_payment_feb_2022_usd) });
    add('Status', c.status);
    return rows;
  }

  function buildComparisonTableHTML(dataA, dataB) {
    var rowsA = getDetailRows(dataA);
    var rowsB = getDetailRows(dataB);
    var byLabelA = {};
    var byLabelB = {};
    rowsA.forEach(function(r) { byLabelA[r.label] = r.value; });
    rowsB.forEach(function(r) { byLabelB[r.label] = r.value; });
    var allLabels = [];
    var seen = {};
    rowsA.forEach(function(r) { if (!seen[r.label]) { seen[r.label] = true; allLabels.push(r.label); } });
    rowsB.forEach(function(r) { if (!seen[r.label]) { seen[r.label] = true; allLabels.push(r.label); } });
    var nameA = dataA.name || dataA.short_name || dataA.project_id || 'A';
    var nameB = dataB.name || dataB.short_name || dataB.project_id || 'B';
    var col1 = escapeHtml(nameA);
    var col2 = escapeHtml(nameB);
    var attr = function(s) { return (s || '').replace(/"/g, '&quot;'); };
    var html = '<table class="compare-filter-table" aria-label="Comparison">' +
      '<thead><tr><th scope="col">Metric</th><th scope="col">' + col1 + '</th><th scope="col">' + col2 + '</th></tr></thead><tbody>';
    allLabels.forEach(function(label) {
      var vA = byLabelA[label] != null ? byLabelA[label] : '—';
      var vB = byLabelB[label] != null ? byLabelB[label] : '—';
      html += '<tr><th scope="row">' + escapeHtml(label) + '</th><td data-label="' + attr(nameA) + '">' + escapeHtml(vA) + '</td><td data-label="' + attr(nameB) + '">' + escapeHtml(vB) + '</td></tr>';
    });
    html += '</tbody></table>';
    return html;
  }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderProjectDetail(p) {
    if (!p) return '';
    var name = p.short_name || p.name || p.project_id;
    var areaStr = (p.area && p.area.hectares != null) ? formatAreaHa(p.area.hectares) : 'N/A';
    var areaKm2 = (p.area && p.area.km2 != null) ? formatAreaKm2(p.area.km2) : 'N/A';
    var counties = (p.counties && p.counties.length) ? p.counties.join(', ') : 'N/A';
    var status = p.status || 'N/A';
    var proponent = p.proponent || 'N/A';
    var verification = p.verification || 'N/A';
    var methodology = p.methodology || 'N/A';
    var crediting = p.crediting_period ? ((p.crediting_period.start || '') + ' – ' + (p.crediting_period.end || '')) : 'N/A';
    var html = '<p><strong>Project</strong> ' + name + ' (' + (p.project_id || '') + ')</p>' +
      '<p><strong>Area</strong> ' + areaStr + (areaKm2 !== 'N/A' ? ' (' + areaKm2 + ')' : '') + '</p>' +
      '<p><strong>Counties</strong> ' + counties + '</p>' +
      '<p><strong>Status</strong> ' + status + '</p>' +
      '<p><strong>Proponent</strong> ' + proponent + '</p>' +
      '<p><strong>Verification</strong> ' + verification + '</p>' +
      '<p><strong>Methodology</strong> ' + methodology + '</p>' +
      '<p><strong>Crediting period</strong> ' + crediting + '</p>';
    if (p.farms && (p.farms.total_farms != null || p.farms.average_farm_size_hectares != null)) {
      var farms = (p.farms.total_farms != null ? naNumOrZero(p.farms.total_farms) : 'N/A') + ' farms';
      if (p.farms.average_farm_size_hectares != null) farms += ', avg ' + p.farms.average_farm_size_hectares + ' ha';
      html += '<p><strong>Farms</strong> ' + farms + '</p>';
    }
    if (p.landowners && (p.landowners.total_landowners != null || p.landowners.average_land_size_acres != null)) {
      var owners = (p.landowners.total_landowners != null ? naNumOrZero(p.landowners.total_landowners) : 'N/A') + ' landowners';
      if (p.landowners.average_land_size_acres != null) owners += ', avg ' + Number(p.landowners.average_land_size_acres).toLocaleString() + ' acres';
      html += '<p><strong>Landowners</strong> ' + owners + '</p>';
    }
    return html;
  }

  function initMap() {
    var mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    var data = KENYA_DATA;
    var comp = KENYA_COMPREHENSIVE;
    var nrtProject = data && data.projects ? data.projects.filter(function(p) { return (p.project_id || '') === 'VCS1468'; })[0] : null;
    // Use all 14 NRT conservancies from conservancies.js for map markers; JSON may have fewer.
    var conservanciesPrimary = (window.NRT_CONSERVANCIES && window.NRT_CONSERVANCIES.length >= 14) ? window.NRT_CONSERVANCIES : ((nrtProject && nrtProject.conservancies) ? nrtProject.conservancies : (window.NRT_CONSERVANCIES || []));
    // Collect all conservancies that have boundary geodata, from any project (NRT and others).
    var conservanciesWithBoundaries = [];
    if (comp && comp.projects && Array.isArray(comp.projects)) {
      comp.projects.forEach(function(proj) {
        if (!proj.conservancies || !Array.isArray(proj.conservancies)) return;
        proj.conservancies.forEach(function(c) {
          var bc = c.boundary_coordinates;
          if (bc && bc.simplified_coordinates && Array.isArray(bc.simplified_coordinates)) {
            conservanciesWithBoundaries.push({ _project: proj, conservancy: c });
          }
        });
      });
    }
    var nrtFromComp = comp && comp.projects ? comp.projects.filter(function(p) { return (p.project_id || '') === 'VCS1468'; })[0] : null;
    var nrtBoundariesOnly = (nrtFromComp && nrtFromComp.conservancies) ? nrtFromComp.conservancies : [];
    var allProjects = (data && data.projects) ? data.projects : [];
    var allBounds = [];

    var kenyaBounds = L.latLngBounds([[ -4.72, 33.91 ], [ 5.03, 41.91 ]]);
    var map = L.map('map', {
      zoomControl: true,
      touchZoom: true,
      tap: true,
      maxBounds: kenyaBounds,
      maxBoundsViscosity: 1
    }).setView([0.75, 37.25], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

    var panel = document.getElementById('conservancy-detail-panel');
    var panelName = document.getElementById('conservancy-detail-name');
    var panelBody = document.getElementById('conservancy-detail-body');
    var panelClose = document.getElementById('conservancy-detail-close');

    function showPanel(title, html) {
      if (!panel || !panelName || !panelBody) return;
      panelName.textContent = title;
      panelBody.className = 'conservancy-detail-body';
      panelBody.innerHTML = html;
      panel.classList.add('conservancy-detail-panel-visible');
      panel.setAttribute('aria-hidden', 'false');
    }
    function hidePanel() {
      if (!panel) return;
      panel.classList.remove('conservancy-detail-panel-visible');
      panel.setAttribute('aria-hidden', 'true');
      if (panelName) panelName.textContent = 'Select a conservancy or project';
      if (panelBody) { panelBody.className = 'conservancy-detail-body'; panelBody.innerHTML = '<p class="conservancy-detail-placeholder">Click a conservancy or project area on the map to view details.</p>'; }
    }
    if (panelClose) panelClose.addEventListener('click', hidePanel);

    function normalizeName(s) {
      return (s || '').toLowerCase().replace(/\s+/g, '').replace(/'/g, '');
    }
    function mergeConservancyData(compC) {
      var key = normalizeName(compC.short_name || compC.name);
      var match = conservanciesPrimary.filter(function(p) {
        var n = normalizeName(p.short_name || p.name);
        return n === key || n.indexOf(key) >= 0 || key.indexOf(n) >= 0;
      })[0];
      return match || compC;
    }

    var s = MAP_STYLES;
    var nrtBoundaryLayer = L.layerGroup();
    var nrtConservanciesLayer = L.layerGroup();
    var komazaLayer = L.layerGroup();
    var boomitraLayer = L.layerGroup();
    var kcsaLayer = L.layerGroup();
    var markersLayer = L.layerGroup();

    var nrtBoundaryPoints = [];
    nrtBoundariesOnly.forEach(function(compC) {
      var bc = compC.boundary_coordinates;
      if (!bc || !bc.simplified_coordinates || !Array.isArray(bc.simplified_coordinates)) return;
      var latlngs = parseSimplifiedCoordinates(bc.simplified_coordinates);
      latlngs.forEach(function(pt) { nrtBoundaryPoints.push(pt); });
    });
    conservanciesPrimary.forEach(function(c) {
      var lat = (c.coordinates && c.coordinates.lat != null) ? c.coordinates.lat : c.lat;
      var lng = (c.coordinates && c.coordinates.lng != null) ? c.coordinates.lng : c.lng;
      if (lat != null && lng != null) nrtBoundaryPoints.push([lat, lng]);
    });
    var nrtMain = nrtBoundaryPoints.length >= 3 ? convexHull(nrtBoundaryPoints) : null;
    if (!nrtMain || nrtMain.length < 3) {
      nrtMain = [[0.02, 36.82], [0.02, 37.08], [0.15, 37.55], [0.45, 38.05], [0.95, 38.35], [1.55, 38.42], [2.15, 38.18], [2.55, 37.65], [2.48, 37.12], [2.05, 36.78], [1.35, 36.72], [0.65, 36.78], [0.22, 36.82]];
    }
    var first = nrtMain[0], last = nrtMain[nrtMain.length - 1];
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) nrtMain.push([first[0], first[1]]);
    var nrtPoly = L.polygon(nrtMain, Object.assign({}, s.nrtProject, { weight: 5, fillOpacity: 0.04 })).addTo(nrtBoundaryLayer);
    nrtPoly.bindTooltip('NRT project boundary (VCS 1468)', { permanent: false, direction: 'center', className: 'nrt-boundary-tooltip' });
    if (nrtProject) {
      var nrtTitle = nrtProject.short_name || nrtProject.name || 'Northern Kenya Rangeland Project (NRT / VCS 1468)';
      nrtPoly.on('click', function() { showPanel(nrtTitle, renderProjectDetail(nrtProject)); });
    }
    nrtMain.forEach(function(c) { allBounds.push(c); });
    nrtPoly.bringToFront();

    var conservancyPolygonsDrawn = [];
    conservanciesWithBoundaries.forEach(function(item) {
      var compC = item.conservancy;
      var proj = item._project;
      var bc = compC.boundary_coordinates;
      if (!bc || !bc.simplified_coordinates || !Array.isArray(bc.simplified_coordinates)) return;
      var latlngs = parseSimplifiedCoordinates(bc.simplified_coordinates);
      if (latlngs.length < 3) return;
      latlngs.forEach(function(c) { allBounds.push(c); });
      var merged = mergeConservancyData(compC);
      var name = compC.name || compC.short_name || 'Conservancy';
      var style = ((proj && (proj.project_id || '') === 'VCS1468') ? s.nrtConservancy : s.nrtConservancy);
      var poly = L.polygon(latlngs, style).addTo(nrtConservanciesLayer);
      poly.on('click', function() { showPanel(name, renderConservancyDetail(merged)); });
      poly.on('mouseover', function() { this.setStyle({ fillOpacity: 0.75, weight: 2.5, color: style.color, fillColor: style.fillColor }); this.bringToFront(); });
      poly.on('mouseout', function() { this.setStyle(style); });
      poly.bindTooltip(name + ((proj && (proj.project_id || '') !== 'VCS1468') ? ' (' + (proj.short_name || proj.name || '') + ')' : ''), { permanent: false, direction: 'center' });
      poly._data = merged;
      poly._latlngs = latlngs;
      poly._compC = compC;
      conservancyPolygonsDrawn.push(poly);
    });

    var greenIcon = L.divIcon({ className: 'conservancy-marker', html: '<span class="conservancy-marker-dot"></span>', iconSize: [24, 24], iconAnchor: [12, 12] });
    conservanciesPrimary.forEach(function(c) {
      var lat = (c.coordinates && c.coordinates.lat != null) ? c.coordinates.lat : c.lat;
      var lng = (c.coordinates && c.coordinates.lng != null) ? c.coordinates.lng : c.lng;
      if (lat == null || lng == null) return;
      allBounds.push([lat, lng]);
      var name = c.name || c.short_name || 'Conservancy';
      var marker = L.marker([lat, lng], { icon: greenIcon }).addTo(markersLayer);
      marker.on('click', function() { showPanel(name, renderConservancyDetail(c)); });
      marker.on('mouseover', function() { marker.getTooltip() && marker.openTooltip(); });
      marker.bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -10] });
      marker._data = c;
    });

    conservancyPolygonsDrawn.forEach(function(poly) {
      var compC = poly._compC;
      var latlngs = poly._latlngs;
      if (!latlngs || latlngs.length < 1) return;
      var key = normalizeName(compC.short_name || compC.name);
      var hasMarker = conservanciesPrimary.some(function(p) { return normalizeName(p.short_name || p.name) === key; });
      if (hasMarker) return;
      var center = polygonCentroid(latlngs);
      if (!center) return;
      allBounds.push(center);
      var name = compC.name || compC.short_name || 'Conservancy';
      var marker = L.marker(center, { icon: greenIcon }).addTo(markersLayer);
      marker.on('click', function() { showPanel(name, renderConservancyDetail(poly._data)); });
      marker.on('mouseover', function() { marker.getTooltip() && marker.openTooltip(); });
      marker.bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -10] });
      marker._data = poly._data;
    });

    nrtConservanciesLayer.addTo(map);
    nrtBoundaryLayer.addTo(map);

    allProjects.forEach(function(p) {
      if ((p.project_id || '') === 'VCS1468') return;
      var bc = p.boundary_coordinates;
      var coords = p.coordinates;
      var centerLat = coords && coords.center_lat != null ? coords.center_lat : null;
      var centerLng = coords && coords.center_lng != null ? coords.center_lng : null;
      var style = null;
      var layer = null;
      if ((p.project_id || '') === 'VCS2623') { style = s.komaza; layer = komazaLayer; }
      else if ((p.project_id || '') === 'VCS3340') { style = s.boomitra; layer = boomitraLayer; }
      else if ((p.project_id || '') === 'VCS5451') { style = s.kcsa; layer = kcsaLayer; }
      else { style = s.kcsa; layer = kcsaLayer; }

      if (bc && bc.main_boundary && Array.isArray(bc.main_boundary)) {
        var latlngs = parseBoundaryLatLngs(bc.main_boundary);
        if (latlngs.length >= 3 && layer) {
          var poly = L.polygon(latlngs, style).addTo(layer);
          latlngs.forEach(function(c) { allBounds.push(c); });
          var projName = p.short_name || p.name || p.project_id;
          poly.on('click', function() { showPanel(projName, renderProjectDetail(p)); });
          poly.on('mouseover', function() { this.setStyle({ fillOpacity: style.fillOpacity + 0.15, weight: 2.5, color: style.color, fillColor: style.fillColor }); this.bringToFront(); });
          poly.on('mouseout', function() { this.setStyle(style); });
          poly.bindTooltip(projName + ' (' + (p.project_id || '') + ')', { permanent: false, direction: 'center' });
        }
      }
      var countyPositions = {};
      if (bc && bc.representative_boundaries && Array.isArray(bc.representative_boundaries) && layer) {
        bc.representative_boundaries.forEach(function(rb) {
          var latlngs = (rb.coordinates && parseBoundaryLatLngs(rb.coordinates)) || (rb.sample_coordinates && parseBoundaryLatLngs(rb.sample_coordinates));
          if (latlngs && latlngs.length >= 1) {
            latlngs = ensureVisiblePolygon(latlngs, centerLat, centerLng);
            if (latlngs.length < 3) return;
            var poly = L.polygon(latlngs, style).addTo(layer);
            latlngs.forEach(function(c) { allBounds.push(c); });
            var regionName = rb.region || rb.landowner || '';
            var projName = (p.short_name || p.name || '') + (regionName ? ' – ' + regionName : '');
            poly.on('click', function() { showPanel(p.short_name || p.name || p.project_id, renderProjectDetail(p)); });
            poly.on('mouseover', function() { this.setStyle({ fillOpacity: style.fillOpacity + 0.12, color: style.color, fillColor: style.fillColor }); this.bringToFront(); });
            poly.on('mouseout', function() { this.setStyle(style); });
            poly.bindTooltip(projName, { permanent: false, direction: 'center' });
            if (regionName && latlngs.length) {
              var cLat = 0, cLng = 0;
              latlngs.forEach(function(pt) { cLat += pt[0]; cLng += pt[1]; });
              countyPositions[regionName] = [cLat / latlngs.length, cLng / latlngs.length];
            }
          }
        });
      }
      var counties = (p.counties && Array.isArray(p.counties)) ? p.counties : [];
      var used = {};
      counties.forEach(function(county) {
        var pos = countyPositions[county] || (KENYA_COUNTY_CENTERS[county] ? [KENYA_COUNTY_CENTERS[county][0], KENYA_COUNTY_CENTERS[county][1]] : null);
        if (!pos || (centerLat != null && centerLng != null && pos[0] === centerLat && pos[1] === centerLng && used[pos[0] + ',' + pos[1]])) return;
        if (!pos && centerLat != null && centerLng != null) pos = [centerLat, centerLng];
        if (!pos) return;
        var key = pos[0].toFixed(4) + ',' + pos[1].toFixed(4);
        if (used[key]) return;
        used[key] = true;
        allBounds.push(pos);
        var dotClass = (p.project_id || '') === 'VCS2623' ? 'komaza-dot' : (p.project_id || '') === 'VCS3340' ? 'boomitra-dot' : (p.project_id || '') === 'VCS5451' ? 'kcsa-dot' : '';
        var otherIcon = L.divIcon({ className: 'other-project-marker', html: '<span class="other-project-marker-dot ' + dotClass + '"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
        var m = L.marker(pos, { icon: otherIcon }).addTo(markersLayer);
        var projName = (p.short_name || p.name || p.project_id) + (county ? ' – ' + county : '');
        m.on('click', function() { showPanel(p.short_name || p.name || p.project_id, renderProjectDetail(p)); });
        m.bindTooltip(projName + ' (' + (p.project_id || '') + ')', { permanent: false, direction: 'top', offset: [0, -8] });
      });
      if (counties.length === 0 && centerLat != null && centerLng != null) {
        allBounds.push([centerLat, centerLng]);
        var dotClass = (p.project_id || '') === 'VCS2623' ? 'komaza-dot' : (p.project_id || '') === 'VCS3340' ? 'boomitra-dot' : (p.project_id || '') === 'VCS5451' ? 'kcsa-dot' : '';
        var otherIcon = L.divIcon({ className: 'other-project-marker', html: '<span class="other-project-marker-dot ' + dotClass + '"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
        var m = L.marker([centerLat, centerLng], { icon: otherIcon }).addTo(markersLayer);
        var projName = p.short_name || p.name || p.project_id;
        m.on('click', function() { showPanel(projName, renderProjectDetail(p)); });
        m.bindTooltip(projName + ' (' + (p.project_id || '') + ')', { permanent: false, direction: 'top', offset: [0, -8] });
      }
    });

    komazaLayer.addTo(map);
    boomitraLayer.addTo(map);
    kcsaLayer.addTo(map);
    markersLayer.addTo(map);

    if (allBounds.length > 0) {
      try { map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 7 }); } catch (e) {}
    }

    L.control.layers(null, {
      'NRT project boundary': nrtBoundaryLayer,
      'Conservancy boundaries': nrtConservanciesLayer,
      'Komaza (VCS 2623)': komazaLayer,
      'Boomitra Kenya (VCS 3340)': boomitraLayer,
      'KCSA (VCS 5451)': kcsaLayer,
      'Markers': markersLayer
    }, { collapsed: true }).addTo(map);

    function buildComparisonHTML(dataA, dataB) {
      var nameA = dataA.name || dataA.short_name || dataA.project_id || 'A';
      var nameB = dataB.name || dataB.short_name || dataB.project_id || 'B';
      return '<div class="comparison-col"><h5>' + nameA + '</h5>' + renderDetailForPanel(dataA) + '</div><div class="comparison-col"><h5>' + nameB + '</h5>' + renderDetailForPanel(dataB) + '</div>';
    }
    function showComparison(dataA, dataB) {
      if (!panel || !panelName || !panelBody) return;
      var nameA = dataA.name || dataA.short_name || dataA.project_id || 'A';
      var nameB = dataB.name || dataB.short_name || dataB.project_id || 'B';
      panelName.textContent = 'Compare: ' + nameA + ' vs ' + nameB;
      panelBody.className = 'conservancy-detail-body comparison-view';
      panelBody.innerHTML = buildComparisonHTML(dataA, dataB);
      panel.classList.add('conservancy-detail-panel-visible');
      panel.setAttribute('aria-hidden', 'false');
    }
    var filterResultEl = document.getElementById('compare-filter-result');
    var filterResultTitle = document.getElementById('compare-filter-result-title');
    var filterResultBody = document.getElementById('compare-filter-result-body');
    function updateCompareFilterResult(dataA, dataB) {
      if (!filterResultEl || !filterResultTitle || !filterResultBody) return;
      if (!dataA || !dataB) {
        filterResultEl.setAttribute('hidden', '');
        filterResultEl.setAttribute('aria-hidden', 'true');
        return;
      }
      var nameA = dataA.name || dataA.short_name || dataA.project_id || 'A';
      var nameB = dataB.name || dataB.short_name || dataB.project_id || 'B';
      filterResultTitle.textContent = 'Compare: ' + nameA + ' vs ' + nameB;
      filterResultBody.innerHTML = buildComparisonTableHTML(dataA, dataB);
      filterResultEl.removeAttribute('hidden');
      filterResultEl.setAttribute('aria-hidden', 'false');
    }
    function clearCompareFilterResult() {
      updateCompareFilterResult(null, null);
    }
    var comparables = [];
    conservanciesPrimary.forEach(function(c, i) {
      var merged = mergeConservancyData(c);
      comparables.push({ value: 'c:' + i, label: (c.name || c.short_name) + ' (Conservancy)', data: merged });
    });
    allProjects.forEach(function(p, i) {
      comparables.push({ value: 'p:' + i, label: (p.short_name || p.name || p.project_id) + ' (Project)', data: p });
    });
    var selectA = document.getElementById('compare-select-a');
    var selectB = document.getElementById('compare-select-b');
    var clearCompareBtn2 = document.getElementById('compare-clear-btn');
    if (selectA && selectB) {
      comparables.forEach(function(o) {
        var optA = document.createElement('option');
        optA.value = o.value;
        optA.textContent = o.label;
        selectA.appendChild(optA);
        var optB = document.createElement('option');
        optB.value = o.value;
        optB.textContent = o.label;
        selectB.appendChild(optB);
      });
      var dataByValue = {};
      comparables.forEach(function(o) { dataByValue[o.value] = o.data; });
      function updateComparison() {
        var vA = selectA.value;
        var vB = selectB.value;
        if (vA && vB && dataByValue[vA] && dataByValue[vB]) {
          updateCompareFilterResult(dataByValue[vA], dataByValue[vB]);
        } else {
          clearCompareFilterResult();
        }
      }
      selectA.addEventListener('change', updateComparison);
      selectB.addEventListener('change', updateComparison);
      if (clearCompareBtn2) {
        clearCompareBtn2.addEventListener('click', function() {
          selectA.value = '';
          selectB.value = '';
          clearCompareFilterResult();
        });
      }
    }
  }

  function run() {
    var hasFetch = typeof fetch !== 'undefined';
    var harmonized = hasFetch
      ? fetch('data/kenya-carbon-harmonized.json').then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; })
      : Promise.resolve(null);
    var primary = hasFetch
      ? fetch('data/kenya-carbon-projects.json').then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; })
      : Promise.resolve(null);
    var comprehensive = hasFetch
      ? fetch('data/kenya-carbon-projects-comprehensive.json').then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; })
      : Promise.resolve(null);

    harmonized.then(function(harmonizedData) {
      if (harmonizedData && harmonizedData.projects && harmonizedData.metadata) {
        KENYA_DATA = harmonizedData;
        KENYA_COMPREHENSIVE = harmonizedData;
        var nrtProj = harmonizedData.projects.filter(function(p) { return (p.project_id || '') === 'VCS1468'; })[0];
        if (nrtProj && nrtProj.conservancies && nrtProj.conservancies.length) {
          window.NRT_CONSERVANCIES = nrtProj.conservancies.filter(function(c) { return c.nrt_primary_14 === true; });
          if (window.NRT_CONSERVANCIES.length < 14) {
            window.NRT_CONSERVANCIES = nrtProj.conservancies.slice(0, 14);
          }
        }
        primary.then(function(primaryData) {
          if (primaryData && KENYA_DATA) {
            if (primaryData.carbon_credits_summary) KENYA_DATA.carbon_credits_summary = primaryData.carbon_credits_summary;
            if (primaryData.social_community_data) KENYA_DATA.social_community_data = primaryData.social_community_data;
            if (primaryData.community_benefits_summary) KENYA_DATA.community_benefits_summary = primaryData.community_benefits_summary;
          }
          if (KENYA_DATA) updateDashboardFromData(KENYA_DATA);
        }).catch(function() {
          if (KENYA_DATA) updateDashboardFromData(KENYA_DATA);
        });
        initMap();
        initProjectSelector();
        initExportButtons();
        initStatTooltips();
        return;
      }
      Promise.all([primary, comprehensive]).then(function(results) {
        KENYA_DATA = results[0];
        KENYA_COMPREHENSIVE = results[1] || null;
        if (KENYA_DATA) updateDashboardFromData(KENYA_DATA);
        initMap();
        initProjectSelector();
        initExportButtons();
        initStatTooltips();
      });
    });
  }

  function getProjectTotals(projectId) {
    if (!KENYA_DATA || !KENYA_DATA.projects) return { issued: 0, retired: 0, communityShare: null };
    if (projectId === 'all') {
      var totalIssued = 0, totalRetired = 0;
      KENYA_DATA.projects.forEach(function(proj) {
        if (proj.conservancies && Array.isArray(proj.conservancies)) {
          proj.conservancies.forEach(function(c) {
            var cc = c.carbon_credits || {};
            if (cc.issued_tco2e != null) totalIssued += Number(cc.issued_tco2e);
            if (cc.retired_tco2e != null) totalRetired += Number(cc.retired_tco2e);
          });
        }
      });
      var cbs = KENYA_DATA.community_benefits_summary;
      return { issued: totalIssued, retired: totalRetired, communityShare: (cbs && cbs.community_share_percent != null) ? cbs.community_share_percent : null };
    }
    var p = KENYA_DATA.projects.filter(function(proj) { return (proj.project_id || '') === projectId; })[0];
    if (!p) return { issued: 0, retired: 0, communityShare: null };
    var issued = 0, retired = 0;
    if (p.conservancies && Array.isArray(p.conservancies)) {
      p.conservancies.forEach(function(c) {
        var cc = c.carbon_credits || {};
        if (cc.issued_tco2e != null) issued += Number(cc.issued_tco2e);
        if (cc.retired_tco2e != null) retired += Number(cc.retired_tco2e);
      });
    }
    var communityShare = (projectId === 'VCS1468') ? 40 : null;
    return { issued: issued, retired: retired, communityShare: communityShare };
  }

  function applyProjectSelection(projectId) {
    var subheading = document.getElementById('dashboard-subheading');
    if (subheading) {
      if (projectId === 'all') subheading.textContent = 'Totals across all 4 Verra projects in Kenya';
      else if (projectId === 'VCS1468') subheading.textContent = 'Northern Kenya Rangeland / NRT (VCS 1468)';
      else if (projectId === 'VCS2623') subheading.textContent = 'Komaza (VCS 2623)';
      else if (projectId === 'VCS3340') subheading.textContent = 'Boomitra Kenya (VCS 3340)';
      else if (projectId === 'VCS5451') subheading.textContent = 'KCSA (VCS 5451)';
      else subheading.textContent = 'Selected project';
    }
    var totals = getProjectTotals(projectId);
    var el;
    if (totals.issued > 0 && (el = document.getElementById('stat-credits-issued'))) el.textContent = (totals.issued / 1e6).toFixed(1) + 'M';
    else if ((el = document.getElementById('stat-credits-issued'))) el.textContent = totals.issued > 0 ? (totals.issued / 1e6).toFixed(1) + 'M' : '—';
    if (totals.retired > 0 && (el = document.getElementById('stat-credits-retired'))) el.textContent = (totals.retired / 1e6).toFixed(1) + 'M';
    else if ((el = document.getElementById('stat-credits-retired'))) el.textContent = totals.retired > 0 ? (totals.retired / 1e6).toFixed(1) + 'M' : '—';
    if ((el = document.getElementById('stat-community-share'))) el.textContent = totals.communityShare != null ? totals.communityShare + '%' : '—';
    var sourceEl = document.getElementById('stats-data-source');
    if (sourceEl) {
      if (projectId === 'all') sourceEl.innerHTML = 'All figures above are platform totals (all 4 projects). Community share shown where disclosed. <a href="sources.html">Sources</a>.';
      else sourceEl.innerHTML = 'Figures for the selected project. Community share shown where disclosed (NRT: 40%). <a href="sources.html">Sources</a>.';
    }
    var cards = document.querySelectorAll('.kenya-projects-overview .project-overview-card');
    cards.forEach(function(card) {
      var id = card.getAttribute('data-project-id');
      card.classList.toggle('project-selected', projectId === 'all' || id === projectId);
    });
  }

  function initProjectSelector() {
    var sel = document.getElementById('dashboard-project-select');
    if (!sel) return;
    sel.addEventListener('change', function() { applyProjectSelection(sel.value); });
    applyProjectSelection(sel.value);
  }

  function doExportCsv() {
    if (!KENYA_DATA || !KENYA_DATA.projects) return;
    var rows = ['Project,Proponent,Area (ha),Status'];
    KENYA_DATA.projects.forEach(function(p) {
      var area = (p.area && p.area.hectares != null) ? p.area.hectares : '';
      rows.push([p.short_name || p.name || p.project_id, (p.proponent || '').replace(/,/g, ' '), area, p.status || ''].join(','));
    });
    var nrt = KENYA_DATA.projects.filter(function(p) { return (p.project_id || '') === 'VCS1468'; })[0];
    if (nrt && nrt.conservancies && nrt.conservancies.length) {
      rows.push('');
      rows.push('Conservancy,Land (ha),Population,Households');
      nrt.conservancies.forEach(function(c) {
        var name = (c.name || c.short_name || '').replace(/,/g, ' ');
        var ha = c.landHectares != null ? c.landHectares : (c.area_hectares != null ? c.area_hectares : '');
        var pop = c.population != null ? c.population : '';
        var hh = c.households != null ? c.households : (c.numFamilies != null ? c.numFamilies : '');
        rows.push([name, ha, pop, hh].join(','));
      });
    }
    var blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'carbonwatch-kenya-data.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function doExportPdf() {
    window.print();
  }
  function initExportButtons() {
    var headerBtn = document.getElementById('header-export-btn');
    var dropdown = document.getElementById('export-dropdown');
    if (headerBtn && dropdown) {
      headerBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = dropdown.getAttribute('hidden') == null;
        if (open) {
          dropdown.setAttribute('hidden', '');
          headerBtn.setAttribute('aria-expanded', 'false');
        } else {
          dropdown.removeAttribute('hidden');
          headerBtn.setAttribute('aria-expanded', 'true');
        }
      });
      dropdown.querySelectorAll('[data-export]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (btn.getAttribute('data-export') === 'csv') doExportCsv();
          else if (btn.getAttribute('data-export') === 'pdf') doExportPdf();
          dropdown.setAttribute('hidden', '');
          headerBtn.setAttribute('aria-expanded', 'false');
        });
      });
      document.addEventListener('click', function() {
        dropdown.setAttribute('hidden', '');
        headerBtn.setAttribute('aria-expanded', 'false');
      });
    }
  }

  function initStatTooltips() {
    var tooltipEl = document.getElementById('stat-tooltip');
    var buttons = document.querySelectorAll('.stat-info');
    var activeBtn = null;
    var justOpened = false;
    if (!tooltipEl || !buttons.length) return;
    function hide() {
      tooltipEl.setAttribute('hidden', '');
      tooltipEl.setAttribute('aria-hidden', 'true');
      activeBtn = null;
    }
    var tipWidth = 280;
    var tipHeightEst = 80;
    function show(btn) {
      var text = btn.getAttribute('data-tooltip') || btn.getAttribute('title') || '';
      if (!text) return;
      var rect = btn.getBoundingClientRect();
      var left = rect.left + (rect.width / 2) - (tipWidth / 2);
      left = Math.max(8, Math.min(left, window.innerWidth - tipWidth - 8));
      var top = rect.bottom + 8;
      if (top + tipHeightEst > window.innerHeight - 8) top = rect.top - tipHeightEst - 8;
      tooltipEl.style.left = left + 'px';
      tooltipEl.style.top = Math.max(8, top) + 'px';
      tooltipEl.textContent = text;
      tooltipEl.removeAttribute('hidden');
      tooltipEl.setAttribute('aria-hidden', 'false');
      activeBtn = btn;
    }
    function handleClick(e) {
      e.stopPropagation();
      var btn = e.currentTarget;
      if (activeBtn === btn) {
        hide();
        return;
      }
      activeBtn = btn;
      justOpened = true;
      show(btn);
      setTimeout(function() { justOpened = false; }, 0);
    }
    buttons.forEach(function(btn) {
      btn.addEventListener('click', handleClick);
    });
    document.addEventListener('click', function(e) {
      if (justOpened) return;
      if (e.target.closest('#stat-tooltip') || e.target.closest('.stat-info')) return;
      hide();
    });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') hide(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
