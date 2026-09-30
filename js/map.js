// js/map.js
// Mexiko Reise-Dashboard — Leaflet-Karte
// Liest: window.MEXIKO_OAXACA.phases, window.MEXIKO_OAXACA.sights
// Schreibt: window.mapModule

window.mapModule = (function() {

  var map;
  var clusterGroup;
  var layerGroups = {};
  var routeLayer;
  var activeFilters = {};

  function initMap() {
    var ns = window.MEXIKO_OAXACA || {};
    var clat = (ns.meta && ns.meta.centerLat !== undefined && ns.meta.centerLat !== 0) ? ns.meta.centerLat : 20.0;
    var clng = (ns.meta && ns.meta.centerLng !== undefined && ns.meta.centerLng !== 0) ? ns.meta.centerLng : 0.0;
    var czoom = (ns.meta && ns.meta.defaultZoom) || 6;
    map = L.map('map', { center: [clat, clng], zoom: czoom });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map);

    clusterGroup = L.markerClusterGroup({
      iconCreateFunction: function(cluster) {
        return L.divIcon({
          html: '<div class="cluster-icon">' + cluster.getChildCount() + '</div>',
          className: 'cluster-icon-wrapper',
          iconSize: [36, 36]
        });
      }
    });
  }

  function makeDiamondIcon(color) {
    return L.divIcon({
      className: 'map-diamond-icon',
      html: '<div class="diamond" style="background:' + color + ';border-color:' + color + '"></div>',
      iconSize:    [14, 14],
      iconAnchor:  [7, 7],
      popupAnchor: [0, -10]
    });
  }

  function makePopup(sight) {
    var price = sight.gratis
      ? '<div class="popup-tip">✓ Gratis</div>'
      : (sight.price && sight.price.eur ? '<div class="popup-tip">~€' + sight.price.eur + '</div>' : '');
    var tip = sight.tip ? '<div class="popup-tip">💡 ' + sight.tip + '</div>' : '';
    var gmaps = sight.googleMapsUrl
      ? '<a class="popup-gmaps-btn" href="' + sight.googleMapsUrl + '" target="_blank" rel="noopener">Google Maps ↗</a>'
      : '';
    return '<div class="map-popup">'
      + '<div class="popup-name">' + sight.name + (sight.buggyFriendly ? ' 🚶' : '') + '</div>'
      + price + tip + gmaps
      + '</div>';
  }

  function getPhaseColor(phaseId) {
    if (typeof window.getPhaseColor === 'function') {
      return window.getPhaseColor(phaseId);
    }
    var phase = window.MEXIKO_OAXACA.phases.find(function(p) { return p.id === phaseId; });
    return phase ? phase.color : '#6366F1';
  }

  function drawRoute() {
    var coords = window.MEXIKO_OAXACA.phases
      .filter(function(p) { return p.base && p.base.lat; })
      .map(function(p) { return [p.base.lat, p.base.lng]; });
    if (!coords.length) return;
    routeLayer = L.polyline(coords, {
      color: '#4B5563',
      weight: 2,
      opacity: 0.6,
      dashArray: null
    }).addTo(map);
  }

  function drawPhaseMarkers() {
    window.MEXIKO_OAXACA.phases.forEach(function(phase) {
      if (!phase.base || !phase.base.lat) return;
      var color = getPhaseColor(phase.id);
      var icon = L.divIcon({
        className: 'map-phase-icon',
        html: '<div class="phase-base-marker" style="background:' + color + '">' + phase.id + '</div>',
        iconSize:    [28, 28],
        iconAnchor:  [14, 14],
        popupAnchor: [0, -16]
      });
      var marker = L.marker([phase.base.lat, phase.base.lng], { icon: icon });
      marker.bindPopup(
        '<div class="map-popup">'
        + '<div class="popup-name">' + phase.emoji + ' Phase ' + phase.id + ': ' + phase.name + '</div>'
        + '<div class="popup-tip">' + phase.nights + ' Nächte · ' + phase.startDate + '</div>'
        + '</div>'
      );
      marker.addTo(map);
    });
  }

  function drawSights() {
    window.MEXIKO_OAXACA.phases.forEach(function(phase) {
      var color = getPhaseColor(phase.id);
      var sights = window.MEXIKO_OAXACA.sights.filter(function(s) {
        if (Array.isArray(s.phaseIds)) return s.phaseIds.indexOf(phase.id) !== -1;
        return s.phaseId === phase.id;
      });

      var phaseClusterLayer = L.layerGroup();
      var phaseDaytripLayer = L.layerGroup();

      sights.forEach(function(sight) {
        if (!sight.lat || !sight.lng) return;
        var popup = makePopup(sight);

        if (sight.type === 'daytrip') {
          var diamond = L.marker([sight.lat, sight.lng], { icon: makeDiamondIcon(color) });
          diamond.bindPopup(popup);
          phaseDaytripLayer.addLayer(diamond);

          if (phase.base && phase.base.lat) {
            var dashedLine = L.polyline(
              [[phase.base.lat, phase.base.lng], [sight.lat, sight.lng]],
              { color: color, weight: 1, opacity: 0.4, dashArray: '4,6' }
            );
            phaseDaytripLayer.addLayer(dashedLine);
          }
        } else {
          var circle = L.circleMarker([sight.lat, sight.lng], {
            radius: 7, fillColor: color, fillOpacity: 0.85,
            color: '#ffffff', weight: 1.5, opacity: 1
          });
          circle.bindPopup(popup);
          phaseClusterLayer.addLayer(circle);
        }
      });

      layerGroups[phase.id] = { cluster: phaseClusterLayer, daytrips: phaseDaytripLayer };
      activeFilters[phase.id] = true;

      phaseClusterLayer.eachLayer(function(layer) { clusterGroup.addLayer(layer); });
      phaseDaytripLayer.addTo(map);
    });

    clusterGroup.addTo(map);
  }

  function buildFilterButtons() {
    var container = document.getElementById('map-filters');
    if (!container) return;

    var allBtn = document.createElement('button');
    allBtn.className = 'map-filter-btn map-filter-all active';
    allBtn.textContent = 'Alle';
    allBtn.addEventListener('click', function() {
      var anyOff = Object.values(activeFilters).some(function(v) { return !v; });
      if (anyOff) {
        window.MEXIKO_OAXACA.phases.forEach(function(p) { showPhase(p.id); });
        container.querySelectorAll('.map-filter-phase').forEach(function(b) { b.classList.add('active'); });
        allBtn.classList.add('active');
      } else {
        window.MEXIKO_OAXACA.phases.forEach(function(p) { hidePhase(p.id); });
        container.querySelectorAll('.map-filter-phase').forEach(function(b) { b.classList.remove('active'); });
        allBtn.classList.remove('active');
      }
    });
    container.appendChild(allBtn);

    window.MEXIKO_OAXACA.phases.forEach(function(phase) {
      var color = getPhaseColor(phase.id);
      var btn = document.createElement('button');
      btn.className = 'map-filter-btn map-filter-phase active';
      btn.dataset.phaseId = phase.id;
      btn.title = phase.name;
      btn.innerHTML = '<span class="filter-dot" style="background:' + color + '"></span>' + phase.id;
      btn.style.setProperty('--phase-color', color);

      btn.addEventListener('click', function() {
        if (activeFilters[phase.id]) {
          hidePhase(phase.id);
          btn.classList.remove('active');
        } else {
          showPhase(phase.id);
          btn.classList.add('active');
        }
        var allActive = Object.values(activeFilters).every(function(v) { return v; });
        allBtn.classList.toggle('active', allActive);
      });

      container.appendChild(btn);
    });
  }

  function showPhase(phaseId) {
    if (!layerGroups[phaseId]) return;
    activeFilters[phaseId] = true;
    layerGroups[phaseId].cluster.eachLayer(function(layer) {
      if (!clusterGroup.hasLayer(layer)) clusterGroup.addLayer(layer);
    });
    if (!map.hasLayer(layerGroups[phaseId].daytrips)) layerGroups[phaseId].daytrips.addTo(map);
  }

  function hidePhase(phaseId) {
    if (!layerGroups[phaseId]) return;
    activeFilters[phaseId] = false;
    layerGroups[phaseId].cluster.eachLayer(function(layer) { clusterGroup.removeLayer(layer); });
    if (map.hasLayer(layerGroups[phaseId].daytrips)) map.removeLayer(layerGroups[phaseId].daytrips);
  }

  function drawTransferPolyline() {
    var trf = window.MEXIKO_OAXACA && window.MEXIKO_OAXACA.transfer;
    if (!trf || !trf.legs || !trf.legs.length) return;
    var latlngs = trf.legs
      .filter(function(l) { return l.lat && l.lng; })
      .map(function(l) { return [l.lat, l.lng]; });
    if (latlngs.length < 2) return;
    L.polyline(latlngs, {
      color: '#FF5A5F',
      weight: 3,
      opacity: 0.7,
      dashArray: '8, 8'
    }).addTo(map);
  }

  function downloadGpx() {
    var ns = window.MEXIKO_OAXACA || {};
    var phases = (ns.phases || []).filter(function(p) { return p.base && p.base.lat; });
    var name = (ns.meta && ns.meta.destination) || 'MEXIKO_OAXACA';
    var wpts = phases.map(function(p) {
      return '  <wpt lat="' + p.base.lat + '" lon="' + p.base.lng + '"><name>' + (p.name || 'Phase ' + p.id) + '</name></wpt>';
    }).join('\n');
    var trkpts = phases.map(function(p) {
      return '      <trkpt lat="' + p.base.lat + '" lon="' + p.base.lng + '"><name>' + (p.name || 'Phase ' + p.id) + '</name></trkpt>';
    }).join('\n');
    var gpx = '<?xml version="1.0" encoding="UTF-8"?>\n'
      + '<gpx version="1.1" creator="Reisebuero" xmlns="http://www.topografix.com/GPX/1/1">\n'
      + wpts + '\n'
      + '  <trk><name>' + name + '</name><trkseg>\n'
      + trkpts + '\n'
      + '  </trkseg></trk>\n</gpx>';
    var blob = new Blob([gpx], { type: 'application/gpx+xml' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name.toLowerCase().replace(/\s+/g, '-') + '.gpx';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function geocodePhases(phases, callback) {
    var API = (window.API_BASE_URL || 'http://localhost:8080');
    var pending = phases.filter(function(p) { return !p.base || !p.base.lat; });
    if (!pending.length) { callback(); return; }
    var done = 0;
    pending.forEach(function(phase) {
      var q = (phase.title || phase.name || '').split('—')[0].split('–')[0].trim();
      if (!q) {
        if (++done === pending.length) callback();
        return;
      }
      fetch(API + '/geocode?q=' + encodeURIComponent(q))
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) phase.base = { lat: data.lat, lng: data.lon };
        })
        .catch(function() {})
        .then(function() {
          if (++done === pending.length) callback();
        });
    });
  }

  return {
    init: function() {
      var mapEl = document.getElementById('map');
      if (!mapEl) return;
      mapEl.innerHTML = '';
      initMap();
      var phases = (window.MEXIKO_OAXACA && window.MEXIKO_OAXACA.phases) || [];
      geocodePhases(phases, function() {
        drawRoute();
        drawPhaseMarkers();
        drawSights();
        drawTransferPolyline();
        buildFilterButtons();
        var btn = document.getElementById('map-gpx-btn');
        if (btn) btn.addEventListener('click', downloadGpx);
        console.log('[map.js] Leaflet-Karte initialisiert (' + window.MEXIKO_OAXACA.sights.length + ' Sights)');
      });
    }
  };

})();
