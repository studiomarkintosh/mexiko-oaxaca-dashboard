// js/booking.js
// Mexiko Reise-Dashboard — Booking-Cards mit Deeplinks und Viator/GYG-Touren
// Liest: window.MEXIKO_OAXACA.booking, window.MEXIKO_OAXACA.tours

window.bookingModule = (function() {
  'use strict';

  var SERVER = 'http://localhost:8767';

  // Live-Ergebnisse aus scripts/booking-research.py (js/booking-results.js)
  function _liveHotels(phaseId) {
    var r = window.MEXIKO_OAXACA_BOOKING_RESULTS;
    if (!r || !r.phases) return null;
    var d = r.phases[String(phaseId)];
    if (!d || !d.hotels || !d.hotels.length) return null;
    return d;
  }

  function _renderExampleHotels(hotels, phaseId) {
    var live = _liveHotels(phaseId);
    if (live) {
      var lh = '<div class="bkg-hotels bkg-hotels--live">'
        + '<div class="bkg-live-head">&#x1F50D; Recherche ' + (window.MEXIKO_OAXACA_BOOKING_RESULTS.updated || '') + '</div>';
      live.hotels.forEach(function(h) {
        lh += '<div class="bkg-hotel">'
          + '<span class="bkg-hotel-name">' + h.name + '</span>'
          + '<span class="bkg-hotel-area">' + (h.area || '') + '</span>'
          + '<span class="bkg-hotel-price">&euro;' + h.priceEur + '/N</span>'
          + (h.score ? '<span class="bkg-hotel-score">' + h.score + '</span>' : '')
          + (h.url ? ' <a class="bkg-hotel-link" href="' + h.url + '" target="_blank" rel="noopener">Ansehen &#x2197;</a>' : '')
          + '</div>';
      });
      return lh + '</div>';
    }
    if (!hotels || hotels.length === 0) {
      return '<div class="bkg-hotels-empty">Noch keine Recherche &mdash; Button oben dr&#xFC;cken</div>';
    }
    var html = '<div class="bkg-hotels">';
    hotels.forEach(function(h) {
      html += '<div class="bkg-hotel">'
        + '<span class="bkg-hotel-name">' + h.name + '</span>'
        + (h.priceEur ? '<span class="bkg-hotel-price">ab &euro;' + h.priceEur + '</span>' : '')
        + (h.url ? ' <a class="bkg-hotel-link" href="' + h.url + '" target="_blank" rel="noopener">Ansehen &#x2197;</a>' : '')
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  function _renderTours(phaseId) {
    if (!window.MEXIKO_OAXACA || !window.MEXIKO_OAXACA.tours) return '';
    var tours = window.MEXIKO_OAXACA.tours.filter(function(t) { return t.phaseId === phaseId; });
    if (!tours.length) return '';

    var html = '<div class="bkg-tours">';
    tours.forEach(function(t) {
      var isPlaceholder = !/\d/.test(t.url);
      var linkHtml = isPlaceholder
        ? '<span class="bkg-tour-placeholder">&#x26A0; URL Platzhalter &mdash; Viator/GYG URL in data.js eintragen</span>'
        : '<a class="bkg-tour-link" href="' + t.url + '" target="_blank" rel="noopener">Buchen &#x2197;</a>';
      var buggyIcon = t.buggyFriendly ? '&#x1F6BC;' : '&#x1F6BC;&#x26A0;';

      html += '<div class="bkg-tour">'
        + '<div class="bkg-tour-name">' + t.name + '</div>'
        + '<div class="bkg-tour-meta">'
          + '<span>' + t.provider + '</span>'
          + '<span>ab &euro;' + t.priceEur + '</span>'
          + '<span>' + buggyIcon + '</span>'
          + linkHtml
        + '</div>'
        + (t.note ? '<div class="bkg-tour-note">' + t.note + '</div>' : '')
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  function _makeBookingCard(b) {
    var earlyBadge = b.earlyBook === true
      ? '<span class="bkg-badge bkg-badge--warn">&#x26A0;&#xFE0F; Fr&#xFC;h buchen!</span>'
      : '';

    return '<div class="bkg-card">'
      + '<div class="bkg-phase-header">'
        + '<span class="bkg-phase-num">Phase ' + b.phaseId + '</span>'
        + '<span class="bkg-region">' + b.region + '</span>'
        + earlyBadge
      + '</div>'
      + '<div class="bkg-dates">' + b.checkIn + ' &ndash; ' + b.checkOut + ' (' + b.nights + ' N&#xE4;chte)</div>'
      + (b.criteria && b.criteria.notes ? '<div class="bkg-criteria">' + b.criteria.notes + '</div>' : '')
      + '<div class="bkg-links">'
        + '<a class="bkg-link bkg-link--primary" href="' + b.bookingUrl + '" target="_blank" rel="noopener">Booking.com &#x2197;</a>'
        + '<a class="bkg-link bkg-link--secondary" href="' + b.airbnbUrl + '" target="_blank" rel="noopener">&#x1F3E0; Airbnb &#x2197;</a>'
      + '</div>'
      + _renderExampleHotels(b.exampleHotels, b.phaseId)
      + _renderTours(b.phaseId)
      + '</div>';
  }

  // ---- Recherche-Leiste: Button + Status -----------------------------
  function _researchBar() {
    var r = window.MEXIKO_OAXACA_BOOKING_RESULTS;
    var stand = r && r.updated ? 'Stand ' + r.updated : 'noch nie gelaufen';
    var korridor = r && r.params
      ? '&euro;' + r.params.priceMinEur + '&ndash;' + r.params.priceMaxEur + '/Nacht'
      : '&euro;45&ndash;110/Nacht';
    return '<div class="bkg-research">'
      + '<div class="bkg-research-info">'
        + '<strong>Automatische Recherche</strong> &middot; ' + korridor
        + ' &middot; 2 Erw. + Kind (2&nbsp;J.) &middot; kein Adults-only'
        + '<div class="bkg-research-stand" id="bkg-stand">' + stand + '</div>'
      + '</div>'
      + '<div class="bkg-research-btns">'
        + '<button class="bkg-btn bkg-btn--primary" onclick="bookingModule.research(\'all\', this)">&#x1F50D; Alle Phasen suchen</button>'
        + '<button class="bkg-btn" onclick="bookingModule.research(\'due\', this)">&#x23F1; Nur f&#xE4;llige Phasen</button>'
      + '</div>'
      + '<div class="bkg-research-status" id="bkg-status"></div>'
    + '</div>';
  }

  function _poll(btn, label) {
    var box = document.getElementById('bkg-status');
    var t = setInterval(function() {
      fetch(SERVER + '/booking/research/status')
        .then(function(r) { return r.json(); })
        .then(function(s) {
          if (!box) return;
          box.textContent = (s.progress != null ? s.progress + '% — ' : '') + (s.message || '');
          if (s.state === 'done' || s.state === 'error') {
            clearInterval(t);
            btn.disabled = false;
            btn.innerHTML = label;
            if (s.state === 'done') {
              box.textContent = s.message + ' — Seite neu laden für Ergebnisse';
            }
          }
        })
        .catch(function() {});
    }, 3000);
  }

  function _render(container) {
    var html = _researchBar() + '<div class="bkg-grid">';
    window.MEXIKO_OAXACA.booking.forEach(function(b) { html += _makeBookingCard(b); });
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  return {
    research: function(mode, btn) {
      var label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '&#x23F3; l&#xE4;uft&hellip;';
      var box = document.getElementById('bkg-status');
      if (box) box.textContent = 'Browser startet…';
      fetch(SERVER + '/booking/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: mode })
      })
        .then(function(r) { return r.json(); })
        .then(function() { _poll(btn, label); })
        .catch(function(e) {
          btn.disabled = false;
          btn.innerHTML = label;
          if (box) box.textContent = 'Server nicht erreichbar — Master Dashboard server.py starten (Port 8767)';
        });
    },
    init: function() {
      if (!window.MEXIKO_OAXACA || !window.MEXIKO_OAXACA.booking) return;
      var el = document.getElementById('booking-content');
      if (!el) return;
      el.innerHTML = '';
      el.classList.remove('placeholder');
      _render(el);
      console.log('[booking.js] initialisiert');
    }
  };

})();
