// js/transfer.js
// Reisebüro Dashboard — Transfer: Route, Flüge, Mietwagen, Routing-Regeln
// Liest: window.MEXIKO_OAXACA.transfer

window.transferModule = (function() {
  'use strict';

  var _currentTab = 'route';

  // ---------- Daten aus Destination-Namespace (lazy — erst in init() befüllt) ----------
  var _ns, _trf, ROUTE, FLIGHTS, CARS, REGELN, VERWORFEN, SUMMARY;

  function _loadData() {
    _ns       = window.MEXIKO_OAXACA || window.DASHBOARD_NS || {};
    _trf      = (_ns && _ns.transfer) || {};
    ROUTE     = _trf.legs      || [];
    FLIGHTS   = _trf.flights   || [];
    CARS      = _trf.cars      || [];
    REGELN    = _trf.rules     || [];
    VERWORFEN = _trf.verworfen || [];
    SUMMARY   = _trf.summary   || {};
  }

  // ---------- GPX Download ----------

  function _downloadGPX() {
    var dest = (_ns.meta && _ns.meta.title) ? _ns.meta.title : 'Reise';
    var wpts = ROUTE.map(function(r) {
      if (!r.lat || !r.lng) return '';
      return '  <wpt lat="' + r.lat + '" lon="' + r.lng + '"><name>' + r.to + '</name></wpt>';
    }).filter(Boolean).join('\n');
    var trkpts = ROUTE.map(function(r) {
      if (!r.lat || !r.lng) return '';
      return '    <trkpt lat="' + r.lat + '" lon="' + r.lng + '"><name>' + r.to + '</name></trkpt>';
    }).filter(Boolean).join('\n');
    var gpx = '<?xml version="1.0" encoding="UTF-8"?>\n'
      + '<gpx version="1.1" creator="Reisebüro Dashboard" xmlns="http://www.topografix.com/GPX/1/1">\n'
      + '  <metadata><name>' + dest + '</name></metadata>\n'
      + wpts + '\n'
      + '  <trk><name>' + dest + '</name><trkseg>\n'
      + trkpts + '\n'
      + '  </trkseg></trk>\n</gpx>';
    var blob = new Blob([gpx], { type: 'application/gpx+xml' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = dest.replace(/\s+/g, '-').toLowerCase() + '.gpx';
    a.click();
  }

  // ---------- Render ----------

  function _renderRoute() {
    var hasLegs = ROUTE.length > 0;
    var html = '';

    // GPX download button + summary strip
    if (hasLegs) {
      html += '<div class="trf-route-header">'
        + '<button class="trf-gpx-btn" id="trf-gpx-dl">⬇ GPX herunterladen</button>'
        + '</div>';
    }

    // Summary bar
    var hasSummary = SUMMARY && (SUMMARY.flights || SUMMARY.bufferNights || SUMMARY.carSections !== undefined);
    if (hasSummary) {
      html += '<div class="trf-summary">'
        + '<div class="trf-sum-item"><span class="trf-sum-val">' + (SUMMARY.flights || 0) + '</span><span class="trf-sum-lbl">Flugereignisse</span></div>'
        + '<div class="trf-sum-item"><span class="trf-sum-val">' + (SUMMARY.bufferNights || 0) + '</span><span class="trf-sum-lbl">Puffernächte</span></div>'
        + '<div class="trf-sum-item"><span class="trf-sum-val">' + (SUMMARY.waitDays !== undefined ? SUMMARY.waitDays : 0) + '</span><span class="trf-sum-lbl">Wartetage</span></div>'
        + '<div class="trf-sum-item"><span class="trf-sum-val">' + (SUMMARY.carSections || 0) + '</span><span class="trf-sum-lbl">Fahrabschnitte</span></div>'
        + '</div>';
    }

    html += '<div class="trf-route">';
    if (!hasLegs) {
      html += '<div class="trf-empty">Keine Routenetappen hinterlegt.</div>';
    } else {
      ROUTE.forEach(function(r) {
        // Build links HTML
        var linksHtml = '';
        if (r.links && r.links.length) {
          linksHtml = '<div class="trf-leg-links">';
          r.links.forEach(function(lnk) {
            linksHtml += '<a class="trf-leg-link" href="' + lnk.url + '" target="_blank" rel="noopener noreferrer">'
              + lnk.label + ' ↗</a>';
          });
          linksHtml += '</div>';
        }

        var metaHtml = '';
        if (r.duration || r.distance || r.preis) {
          metaHtml = '<div class="trf-leg-meta">';
          if (r.duration) metaHtml += '<span>⏱ ' + r.duration + '</span>';
          if (r.distance) metaHtml += '<span>📍 ' + r.distance + '</span>';
          if (r.preis)    metaHtml += '<span>💶 ' + r.preis + '</span>';
          metaHtml += '</div>';
        }

        html += '<div class="trf-leg trf-leg--' + (r.mode || 'drive') + '">'
          + '<div class="trf-leg-num">' + r.n + '</div>'
          + '<div class="trf-leg-body">'
            + '<div class="trf-leg-title">' + (r.emoji || '') + ' ' + r.title + '</div>'
            + (r.description ? '<div class="trf-leg-desc">' + r.description + '</div>' : '')
            + metaHtml
            + linksHtml
          + '</div>'
          + '</div>';
      });
    }
    html += '</div>';

    return html;
  }

  function _renderFlights() {
    if (!FLIGHTS.length) {
      return '<div class="trf-empty">Keine Flugdaten hinterlegt.</div>';
    }
    var html = '<div class="trf-grid">';
    FLIGHTS.forEach(function(f) {
      html += '<div class="trf-card trf-card--' + (f.type || 'international') + '">'
        + '<div class="trf-card-head">'
          + '<span class="trf-card-title">' + f.route + '</span>'
          + '<span class="trf-tag trf-tag--' + (f.type || 'international') + '">' + (f.type === 'international' ? 'Langstrecke' : 'Inland') + '</span>'
        + '</div>'
        + '<div class="trf-price">' + f.preis + '</div>'
        + '<div class="trf-note">' + f.buchung + '</div>'
        + (f.puffer ? '<div class="trf-puffer">🛏 ' + f.puffer + ' Nächte Puffer danach</div>' : '')
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  function _renderCars() {
    if (!CARS.length) {
      return '<div class="trf-empty">Kein Mietwagen für diese Destination.</div>';
    }
    var html = '<div class="trf-grid trf-grid--wide">';
    CARS.forEach(function(c) {
      html += '<div class="trf-card trf-card--car">'
        + '<div class="trf-card-head">'
          + '<span class="trf-card-title">' + c.id + ' · ' + c.titel + '</span>'
          + '<span class="trf-tag trf-tag--car">' + c.typ + '</span>'
        + '</div>'
        + '<div class="trf-strecke">' + c.strecke + '</div>'
        + '<div class="trf-carmeta">'
          + '<span>' + c.dauer + '</span>'
          + '<span>' + c.km + '</span>'
          + '<span>' + c.aufschlag + '</span>'
        + '</div>'
        + '<div class="trf-sub-title">Etappen</div>'
        + '<ul class="trf-list">';
      (c.etappen || []).forEach(function(e) { html += '<li>' + e + '</li>'; });
      html += '</ul>'
        + '<div class="trf-sub-title">Achtung</div>'
        + '<ul class="trf-list trf-list--warn">';
      (c.hinweise || []).forEach(function(h) { html += '<li>' + h + '</li>'; });
      html += '</ul></div>';
    });
    html += '</div>';
    return html;
  }

  function _renderRules() {
    var html = '';
    if (!REGELN.length && !VERWORFEN.length) {
      return '<div class="trf-empty">Keine Routing-Regeln hinterlegt.</div>';
    }
    if (REGELN.length) {
      html += '<div class="trf-grid">';
      REGELN.forEach(function(r) {
        html += '<div class="trf-card trf-card--rule">'
          + '<div class="trf-card-title">' + r.titel + '</div>'
          + '<div class="trf-note">' + r.text + '</div>'
          + '</div>';
      });
      html += '</div>';
    }
    if (VERWORFEN.length) {
      html += '<div class="trf-sub-title trf-sub-title--block">Verworfene Varianten</div>';
      html += '<div class="trf-grid">';
      VERWORFEN.forEach(function(v) {
        html += '<div class="trf-card trf-card--dead">'
          + '<div class="trf-card-head">'
            + '<span class="trf-card-title">' + v.v + '</span>'
            + '<span class="trf-tag trf-tag--dead">' + v.delta + '</span>'
          + '</div>'
          + '<div class="trf-note">' + v.grund + '</div>'
          + '</div>';
      });
      html += '</div>';
    }
    return html;
  }

  var TABS = [
    { id: 'route',  label: '🧭 Route',     render: _renderRoute },
    { id: 'flug',   label: '✈ Flüge',      render: _renderFlights },
    { id: 'auto',   label: '🚗 Mietwagen', render: _renderCars },
    { id: 'regeln', label: '📐 Regeln',    render: _renderRules }
  ];

  function _renderBody(container, tabId) {
    var tab = TABS.filter(function(t) { return t.id === tabId; })[0] || TABS[0];
    var body = container.querySelector('.trf-body');
    if (body) {
      body.innerHTML = tab.render();
      // Bind GPX button after render
      var gpxBtn = body.querySelector('#trf-gpx-dl');
      if (gpxBtn) {
        gpxBtn.addEventListener('click', function(e) {
          e.preventDefault();
          _downloadGPX();
        });
      }
    }
  }

  function _bind(container) {
    container.addEventListener('click', function(e) {
      var btn = e.target;
      while (btn && btn !== container) {
        if (btn.classList && btn.classList.contains('trf-tab')) break;
        btn = btn.parentNode;
      }
      if (!btn || !btn.classList || !btn.classList.contains('trf-tab')) return;

      _currentTab = btn.getAttribute('data-tab');
      var all = container.querySelectorAll('.trf-tab');
      for (var i = 0; i < all.length; i++) { all[i].classList.remove('trf-tab--active'); }
      btn.classList.add('trf-tab--active');
      _renderBody(container, _currentTab);
    });
  }

  return {
    init: function() {
      _loadData();
      var el = document.getElementById('transfer-content');
      if (!el) return;

      var html = '<div class="trf-tabs">';
      TABS.forEach(function(t) {
        html += '<button class="trf-tab' + (t.id === _currentTab ? ' trf-tab--active' : '') + '" data-tab="' + t.id + '">' + t.label + '</button>';
      });
      html += '</div><div class="trf-body"></div>';

      el.classList.remove('placeholder');
      el.innerHTML = html;
      _renderBody(el, _currentTab);
      _bind(el);
      console.log('[transfer.js] initialisiert (' + ROUTE.length + ' Etappen, ' + FLIGHTS.length + ' Flüge, ' + CARS.length + ' Mietwagen-Abschnitte)');
    }
  };

})();
