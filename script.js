window.onload = function() {
  var map = L.map('map').setView([0.8, 37.2], 9);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var boundary = [[0.565, 36.895], [0.560, 36.938], [0.552, 37.000], [0.530, 37.189], [0.520, 37.182], [0.508, 37.174], [0.495, 37.166], [0.483, 37.148], [0.470, 37.150], [0.456, 37.151], [0.443, 37.164], [0.435, 37.167], [0.420, 37.154], [0.402, 37.152], [0.393, 37.150], [0.380, 37.144], [0.372, 37.136], [0.358, 37.125], [0.350, 37.121], [0.337, 37.124], [0.347, 37.095], [0.364, 37.057], [0.399, 37.048], [0.407, 37.046], [0.418, 37.043], [0.429, 37.037], [0.459, 37.020], [0.461, 37.006], [0.463, 36.995], [0.466, 36.978], [0.467, 36.969], [0.472, 36.966], [0.449, 36.932], [0.444, 36.925], [0.437, 36.900], [0.438, 36.898], [0.442, 36.899], [0.446, 36.898], [0.452, 36.901], [0.456, 36.898], [0.461, 36.895], [0.464, 36.894], [0.468, 36.894], [0.473, 36.893], [0.478, 36.891], [0.482, 36.889], [0.486, 36.888], [0.492, 36.885], [0.504, 36.878], [0.509, 36.876], [0.512, 36.867], [0.516, 36.867], [0.520, 36.869], [0.524, 36.869], [0.530, 36.868], [0.537, 36.863], [0.542, 36.861], [0.548, 36.858], [0.553, 36.858], [0.556, 36.865], [0.561, 36.865], [0.565, 36.865], [0.568, 36.865], [0.565, 36.895]];

  L.polygon(boundary, {color: '#1e40af', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.1}).addTo(map).bindPopup('<b>Naibunga Conservancy</b><br>471 km²');

  L.polygon([[0.52, 36.95], [0.50, 37.00], [0.48, 37.02], [0.46, 37.00], [0.47, 36.96], [0.52, 36.95]], {color: '#2d5016', fillColor: '#4a7c2c', fillOpacity: 0.4, weight: 2}).addTo(map).bindPopup('<b>Ewaso Zone</b><br>Recovery<br>+2.1% carbon');

  L.polygon([[0.45, 37.05], [0.43, 37.10], [0.40, 37.08], [0.41, 37.03], [0.45, 37.05]], {color: '#b45309', fillColor: '#d97706', fillOpacity: 0.4, weight: 2}).addTo(map).bindPopup('<b>Tura Zone</b><br>Rotational<br>320 cattle');

  L.polygon([[0.48, 37.12], [0.46, 37.16], [0.43, 37.14], [0.44, 37.10], [0.48, 37.12]], {color: '#991b1b', fillColor: '#b91c1c', fillOpacity: 0.4, weight: 2}).addTo(map).bindPopup('<b>Seek Zone</b><br>Active<br>450 cattle');

  L.polygon([[0.40, 37.00], [0.38, 37.05], [0.35, 37.02], [0.37, 36.98], [0.40, 37.00]], {color: '#2d5016', fillColor: '#4a7c2c', fillOpacity: 0.4, weight: 2}).addTo(map).bindPopup('<b>Ilpolei Zone</b><br>Recovery<br>+18% vegetation');

  L.polygon([[0.50, 37.08], [0.48, 37.12], [0.45, 37.10], [0.47, 37.06], [0.50, 37.08]], {color: '#b45309', fillColor: '#d97706', fillOpacity: 0.4, weight: 2}).addTo(map).bindPopup('<b>Mumonyot Zone</b><br>Rotational<br>280 cattle');

  L.polygon([[0.53, 37.10], [0.51, 37.15], [0.48, 37.13], [0.50, 37.08], [0.53, 37.10]], {color: '#2d5016', fillColor: '#4a7c2c', fillOpacity: 0.4, weight: 2}).addTo(map).bindPopup('<b>Lmotiok Zone</b><br>Recovery<br>High sequestration');

  L.marker([1.5, 37.0]).addTo(map).bindPopup('<b>Sera Conservancy</b><br>875 km²');
  L.marker([0.8, 37.8]).addTo(map).bindPopup('<b>Lewa Conservancy</b><br>250 km²');
  L.marker([1.2, 36.8]).addTo(map).bindPopup('<b>Kalama Conservancy</b><br>384 km²');
};
