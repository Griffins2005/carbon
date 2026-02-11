/**
 * Dashboard – interactive map with boundaries and detail panel.
 * Data: kenya-carbon-projects.json; kenya-carbon-projects-comprehensive.json (NRT conservancy polygons).
 */
(function() {
  'use strict';

  var KENYA_DATA = null;
  var KENYA_COMPREHENSIVE = null;

  var MAP_STYLES = {
    nrtProject:    { color: '#14532d', weight: 4, fillColor: '#166534', fillOpacity: 0.08 },
    nrtConservancy: { color: '#15803d', weight: 1.5, fillColor: '#22c55e', fillOpacity: 0.18 },
    komaza:        { color: '#0e7490', weight: 2, fillColor: '#06b6d4', fillOpacity: 0.25 },
    boomitra:      { color: '#b45309', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.25 },
    kcsa:          { color: '#6d28d9', weight: 2, fillColor: '#8b5cf6', fillOpacity: 0.25 }
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

  function clipToKenyaTurkana(latlngs) {
    if (!latlngs || latlngs.length < 3) return latlngs;
    var minLng = 34.55;
    return latlngs.map(function(p) {
      if (!p || p.length < 2) return p;
      if (p[1] < minLng) return [p[0], minLng];
      return p;
    });
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
    var nrt = data.projects && data.projects.filter(function(p) { return (p.project_id || '') === 'VCS1468'; })[0];
    if (nrt && nrt.conservancies && nrt.conservancies.length) {
      var totalIssued = 0, totalRetired = 0;
      nrt.conservancies.forEach(function(c) {
        var cc = c.carbon_credits || {};
        if (cc.issued_tco2e != null) totalIssued += Number(cc.issued_tco2e);
        if (cc.retired_tco2e != null) totalRetired += Number(cc.retired_tco2e);
      });
      if (totalIssued > 0 && (el = document.getElementById('stat-credits-issued'))) el.textContent = (totalIssued / 1e6).toFixed(1) + 'M';
      if (totalRetired > 0 && (el = document.getElementById('stat-credits-retired'))) el.textContent = (totalRetired / 1e6).toFixed(1) + 'M';
    }
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
    if (data.carbon_credits_summary) {
      var ccs = data.carbon_credits_summary;
      if ((el = document.getElementById('stat-credits-issued')) && ccs.total_issued_tco2e != null) el.textContent = (ccs.total_issued_tco2e / 1e6).toFixed(1) + 'M';
      if ((el = document.getElementById('stat-credits-retired')) && ccs.total_retired_tco2e != null) el.textContent = (ccs.total_retired_tco2e / 1e6).toFixed(1) + 'M';
      if ((el = document.getElementById('stat-community-share')) && data.community_benefits_summary && data.community_benefits_summary.community_share_percent != null) el.textContent = data.community_benefits_summary.community_share_percent + '%';
    }
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
    }
    if (data.social_community_data && data.social_community_data.grievance_mechanism) {
      var gm = data.social_community_data.grievance_mechanism;
      if ((el = document.getElementById('data-grievances-total'))) el.textContent = gm.total_grievances_2025 != null ? gm.total_grievances_2025 : '—';
      if ((el = document.getElementById('data-grievances-resolved'))) el.textContent = gm.resolved != null ? gm.resolved : '—';
      if ((el = document.getElementById('data-grievances-rate'))) el.textContent = gm.resolution_rate_percent != null ? gm.resolution_rate_percent + '%' : '—';
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

  function renderConservancyDetail(c) {
    if (!c) return '';
    var name = c.name || c.short_name || 'Conservancy';
    var areaStr = c.area_km2 != null ? formatAreaKm2(c.area_km2) : (c.area_hectares != null ? formatAreaHa(c.area_hectares) + ' (ha)' : 'N/A');
    var cc = c.carbon_credits || {};
    var issued = cc.issued_tco2e != null ? naNum(cc.issued_tco2e) + ' tCO2e' : 'N/A';
    var retired = cc.retired_tco2e != null ? naNum(cc.retired_tco2e) + ' tCO2e' : 'N/A';
    var pop = c.population != null ? naNum(c.population) : 'N/A';
    var hh = c.households != null ? naNum(c.households) : 'N/A';
    var counties = (c.counties && c.counties.length) ? c.counties.join(', ') : 'N/A';
    var established = c.established || 'N/A';
    return '<p><strong>Land area</strong> ' + areaStr + '</p>' +
      '<p><strong>Carbon issued</strong> ' + issued + '</p>' +
      '<p><strong>Carbon retired</strong> ' + retired + '</p>' +
      '<p><strong>Households</strong> ' + hh + '</p>' +
      '<p><strong>Population</strong> ' + pop + '</p>' +
      '<p><strong>Counties</strong> ' + counties + '</p>' +
      '<p><strong>Established</strong> ' + established + '</p>';
  }

  function renderProjectDetail(p) {
    if (!p) return '';
    var name = p.short_name || p.name || p.project_id;
    var areaStr = (p.area && p.area.hectares != null) ? formatAreaHa(p.area.hectares) : 'N/A';
    var counties = (p.counties && p.counties.length) ? p.counties.join(', ') : 'N/A';
    return '<p><strong>Project</strong> ' + name + ' (' + (p.project_id || '') + ')</p>' +
      '<p><strong>Area</strong> ' + areaStr + '</p>' +
      '<p><strong>Counties</strong> ' + counties + '</p>' +
      '<p><strong>Status</strong> ' + (p.status || 'N/A') + '</p>';
  }

  function initMap() {
    var mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    var data = KENYA_DATA;
    var comp = KENYA_COMPREHENSIVE;
    var nrtProject = data && data.projects ? data.projects.filter(function(p) { return (p.project_id || '') === 'VCS1468'; })[0] : null;
    var conservanciesPrimary = (nrtProject && nrtProject.conservancies) ? nrtProject.conservancies : (window.NRT_CONSERVANCIES || []);
    var conservanciesWithBoundaries = [];
    var nrtFromComp = comp && comp.projects ? comp.projects.filter(function(p) { return (p.project_id || '') === 'VCS1468'; })[0] : null;
    if (nrtFromComp && nrtFromComp.conservancies) conservanciesWithBoundaries = nrtFromComp.conservancies;
    var allProjects = (data && data.projects) ? data.projects : [];
    var allBounds = [];

    var map = L.map('map', { zoomControl: true }).setView([0.75, 37.25], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

    var panel = document.getElementById('conservancy-detail-panel');
    var panelName = document.getElementById('conservancy-detail-name');
    var panelBody = document.getElementById('conservancy-detail-body');
    var panelClose = document.getElementById('conservancy-detail-close');

    function showPanel(title, html) {
      if (!panel || !panelName || !panelBody) return;
      panelName.textContent = title;
      panelBody.innerHTML = html;
      panel.classList.add('conservancy-detail-panel-visible');
      panel.setAttribute('aria-hidden', 'false');
    }
    function hidePanel() {
      if (!panel) return;
      panel.classList.remove('conservancy-detail-panel-visible');
      panel.setAttribute('aria-hidden', 'true');
      if (panelName) panelName.textContent = 'Select a conservancy or project';
      if (panelBody) panelBody.innerHTML = '<p class="conservancy-detail-placeholder">Click a conservancy marker or project area on the map to view details.</p>';
    }
    if (panelClose) panelClose.addEventListener('click', hidePanel);

    function mergeConservancyData(compC) {
      var key = (compC.short_name || compC.name || '').toLowerCase().replace(/\s+/g, '');
      var match = conservanciesPrimary.filter(function(p) {
        var n = (p.short_name || p.name || '').toLowerCase().replace(/\s+/g, '');
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
    conservanciesWithBoundaries.forEach(function(compC) {
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
    nrtPoly.bindTooltip('NRT project boundary – whole project (VCS 1468)', { permanent: false, direction: 'center', className: 'nrt-boundary-tooltip' });
    nrtMain.forEach(function(c) { allBounds.push(c); });
    nrtPoly.bringToFront();

    conservanciesWithBoundaries.forEach(function(compC) {
      var bc = compC.boundary_coordinates;
      if (!bc || !bc.simplified_coordinates || !Array.isArray(bc.simplified_coordinates)) return;
      var latlngs = parseSimplifiedCoordinates(bc.simplified_coordinates);
      if (latlngs.length < 3) return;
      latlngs.forEach(function(c) { allBounds.push(c); });
      var merged = mergeConservancyData(compC);
      var name = compC.name || compC.short_name || 'Conservancy';
      var poly = L.polygon(latlngs, s.nrtConservancy).addTo(nrtConservanciesLayer);
      poly.on('click', function() { showPanel(name, renderConservancyDetail(merged)); });
      poly.on('mouseover', function() { this.setStyle({ fillOpacity: 0.35, weight: 2.5, color: s.nrtConservancy.color, fillColor: s.nrtConservancy.fillColor }); this.bringToFront(); });
      poly.on('mouseout', function() { this.setStyle(s.nrtConservancy); });
      poly.bindTooltip(name, { permanent: false, direction: 'center' });
      poly._data = merged;
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
        if ((p.project_id || '') === 'VCS5451') latlngs = clipToKenyaTurkana(latlngs);
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
        var otherIcon = L.divIcon({ className: 'other-project-marker', html: '<span class="other-project-marker-dot"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
        var m = L.marker(pos, { icon: otherIcon }).addTo(markersLayer);
        var projName = (p.short_name || p.name || p.project_id) + (county ? ' – ' + county : '');
        m.on('click', function() { showPanel(p.short_name || p.name || p.project_id, renderProjectDetail(p)); });
        m.bindTooltip(projName + ' (' + (p.project_id || '') + ')', { permanent: false, direction: 'top', offset: [0, -8] });
      });
      if (counties.length === 0 && centerLat != null && centerLng != null) {
        allBounds.push([centerLat, centerLng]);
        var otherIcon = L.divIcon({ className: 'other-project-marker', html: '<span class="other-project-marker-dot"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
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
      'NRT conservancy boundaries': nrtConservanciesLayer,
      'Komaza (VCS 2623)': komazaLayer,
      'Boomitra Kenya (VCS 3340)': boomitraLayer,
      'KCSA (VCS 5451)': kcsaLayer,
      'Markers': markersLayer
    }, { collapsed: true }).addTo(map);
  }

  function run() {
    var primary = typeof fetch !== 'undefined'
      ? fetch('kenya-carbon-projects.json').then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; })
      : Promise.resolve(null);
    var comprehensive = typeof fetch !== 'undefined'
      ? fetch('kenya-carbon-projects-comprehensive.json').then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; })
      : Promise.resolve(null);
    Promise.all([primary, comprehensive]).then(function(results) {
      KENYA_DATA = results[0];
      KENYA_COMPREHENSIVE = results[1] || null;
      if (KENYA_DATA) updateDashboardFromData(KENYA_DATA);
      initMap();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
