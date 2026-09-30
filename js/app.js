// js/app.js
// Mexiko Dashboard — App-Initialisierung
// Läuft nach allen anderen Scripts (letzter script-Tag in index.html)

(function() {
  'use strict';

  var PASSWORD    = 'sri30';
  var SESSION_KEY = 'mexiko-oaxaca_unlocked';

  // --- Passwort-Gate ---
  function initGate() {
    var overlay = document.getElementById('gate-overlay');
    var app     = document.getElementById('app');
    var input   = document.getElementById('gate-input');
    var btn     = document.getElementById('gate-btn');
    var errMsg  = document.getElementById('gate-error');

    function unlock() {
      overlay.classList.add('hidden');
      app.classList.remove('hidden');
      localStorage.setItem(SESSION_KEY, '1');
      setTimeout(initModules, 150);
    }

    if (localStorage.getItem(SESSION_KEY) === '1') {
      unlock();
      return;
    }

    var isLocal = location.hostname === 'localhost' ||
                  location.hostname === '127.0.0.1' ||
                  location.protocol === 'file:';

    if (isLocal) {
      input.value = PASSWORD;
      setTimeout(function() { unlock(); }, 100);
      return;
    }

    overlay.classList.remove('hidden');

    function checkPassword() {
      if (input.value === PASSWORD) {
        errMsg.classList.remove('visible');
        input.classList.remove('error');
        unlock();
      } else {
        errMsg.classList.add('visible');
        input.classList.add('error');
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', checkPassword);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') checkPassword();
    });
  }

  // --- Nav: Active-Link beim Scrollen ---
  function initNav() {
    var links = document.querySelectorAll('.nav-link');
    var sections = [];
    links.forEach(function(link) {
      var id = link.getAttribute('href').replace('#', '');
      var el = document.getElementById(id);
      if (el) sections.push({ id: id, el: el, link: link });
    });

    function onScroll() {
      var scrollY = window.scrollY || window.pageYOffset;
      var active = null;
      sections.forEach(function(s) {
        if (s.el.offsetTop - 80 <= scrollY) active = s;
      });
      links.forEach(function(l) { l.classList.remove('active'); });
      if (active) active.link.classList.add('active');
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- Phase-Farbe (für map.js + sicherheit.js) ---
  window.getPhaseColor = function(phaseId) {
    if (!window.MEXIKO_OAXACA || !window.MEXIKO_OAXACA.phases) return '#6366F1';
    var phase = window.MEXIKO_OAXACA.phases.find(function(p) { return p.id === phaseId; });
    return phase ? phase.color : '#6366F1';
  };

  // --- Seismic-Badge ---
  window.seismikBadge = function(phaseId) {
    var ns = window.MEXIKO_OAXACA;
    if (!ns || !ns.seismik || !ns.seismik.phases) return '';
    var pd = ns.seismik.phases[String(phaseId)];
    if (!pd) return '';
    var sc = (ns.seismik.scale || []).find(function(s) { return s.key === pd.level; }) || {};
    var icon = sc.icon || '\u25aa';
    var hl = (pd.headline || '').replace(/"/g, '&quot;');
    var nt = (pd.note    || '').replace(/"/g, '&quot;');
    return '<span class="tl-sei-pill tl-sei-pill--' + pd.level + '">'
         + icon + '\u202f' + 'Erdbeben\u00a0' + (sc.label || pd.level)
         + '<button class="tl-sei-q" type="button" data-headline="' + hl + '" data-note="' + nt + '">?</button>'
         + '</span>';
  };

  // --- Timeline ---
  function renderPhaseCard(phase, index) {
    // Normalize schema: support both Mexico (name/emoji/color/nights) and Japan (title/icon) formats
    phase = Object.assign({}, phase);
    if (!phase.name)   { phase.name   = (phase.title || '').split('—')[0].trim() || ('Phase ' + phase.id); }
    if (!phase.emoji)  { phase.emoji  = phase.icon  || '📍'; }
    if (!phase.color)  { phase.color  = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316'][(phase.id - 1) % 7]; }
    if (!phase.nights) { phase.nights = phase.subtitle ? (phase.subtitle.match(/(\d+)\s+N/i) || [])[1] || '' : ''; }
    var isOpen = false;

    var tempBadge = '';
    if (phase.avgTempC) {
      tempBadge = '<span class="tl-badge tl-temp-badge">'
                + phase.avgTempC.min + '–' + phase.avgTempC.max + '°C</span>';
    }

    var seismikBadge = '';
    if (window.seismikBadge) {
      try { seismikBadge = window.seismikBadge(phase.id) || ''; } catch(e) {}
    }

    var flightBadge = '';
    if (phase.flightIn) {
      var isIntl = phase.flightIn.type === 'international';
      flightBadge += '<span class="tl-flight-badge tl-flight-badge--' + phase.flightIn.type + '">'
        + (isIntl ? '🌍' : '✈') + ' ' + phase.flightIn.route
        + ' <span class="tl-flight-date">' + phase.flightIn.date + '</span></span>';
    }
    if (phase.flightOut) {
      var isIntlOut = phase.flightOut.type === 'international';
      flightBadge += '<span class="tl-flight-badge tl-flight-badge--' + phase.flightOut.type + '">'
        + (isIntlOut ? '🌍' : '✈') + ' ' + phase.flightOut.route
        + ' <span class="tl-flight-date">' + phase.flightOut.date + '</span></span>';
    }

    var highlights = '';
    if (phase.highlights && phase.highlights.length) {
      highlights = '<div class="tl-highlights">';
      phase.highlights.forEach(function(h) {
        highlights += '<span class="tl-highlight-tag">' + h + '</span>';
      });
      highlights += '</div>';
    }

    // Itinerary normalisieren
    var itinerary = Array.isArray(phase.itinerary) ? phase.itinerary
                  : Array.isArray(phase.days) ? phase.days : [];

    // Anzahl Tage bestimmen: aus "1–7" String oder "7 Nächte" subtitle
    var numDays = itinerary.length || 1;
    var daysStrRaw = typeof phase.days === 'string' ? phase.days : '';
    var dmatch = daysStrRaw.match(/(\d+)[–\-](\d+)/);
    if (dmatch) {
      numDays = parseInt(dmatch[2]) - parseInt(dmatch[1]) + 1;
    } else if (phase.subtitle) {
      var smatch = phase.subtitle.match(/(\d+)/);
      if (smatch) numDays = parseInt(smatch[1]) + 1;
    }

    // Itinerary als date→data Map
    var dayMap = {};
    var startDate = null;
    itinerary.forEach(function(d) {
      if (d && d.date) { dayMap[d.date] = d; if (!startDate) startDate = d.date; }
    });

    // Alle Datums-Keys für numDays Tage
    var allDates = [];
    if (startDate) {
      for (var di = 0; di < numDays; di++) {
        var dd = new Date(startDate + 'T12:00:00Z');
        dd.setUTCDate(dd.getUTCDate() + di);
        allDates.push(dd.toISOString().split('T')[0]);
      }
    } else {
      for (var di = 0; di < numDays; di++) allDates.push(null);
    }

    // Tile-Grid rendern
    var days = '';
    if (allDates.length) {
      days = '<div class="tl-day-tiles">';
      allDates.forEach(function(dateKey, ti) {
        var dayData = dateKey ? (dayMap[dateKey] || null) : null;
        var dateStr = '';
        if (dateKey) {
          var dobj = new Date(dateKey + 'T12:00:00Z');
          dateStr = dobj.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: 'short' });
        }
        days += '<div class="tl-day-tile">';
        days += '<div class="tl-day-tile-header">';
        days += '<span class="tl-day-tile-num">Tag ' + (ti + 1) + '</span>';
        if (dateStr) days += '<span class="tl-day-tile-date">' + dateStr + '</span>';
        days += '</div>';
        if (dayData && dayData.slots && dayData.slots.length) {
          days += '<ul class="tl-day-tile-slots">';
          dayData.slots.forEach(function(slot) {
            if (!slot.label) return;
            days += '<li class="tl-day-tile-slot-label">' + slot.label + '</li>';
            (slot.items || []).slice(0, 2).forEach(function(item) {
              var badge = item.gratis ? '<span class="tl-badge tl-badge--gratis">gratis</span>'
                        : (item.price && item.price.eur != null && item.price.eur > 0 ? '<span class="tl-badge tl-badge--price">~€' + item.price.eur + '</span>'
                        : (item.priceLevel ? '<span class="tl-badge tl-badge--price">' + item.priceLevel + '</span>' : ''));
              var nameStr = item.name.split('—')[0].trim();
              var nameHtml = item.googleMapsUrl
                ? '<a class="tl-item-link" href="' + item.googleMapsUrl + '" target="_blank" rel="noopener">' + nameStr + '</a>'
                : nameStr;
              days += '<li class="tl-day-tile-item">' + nameHtml + (badge ? '<span class="tl-item-badge-wrap">' + badge + '</span>' : '') + '</li>';
            });
            if ((slot.items || []).length > 2) {
              days += '<li class="tl-day-tile-more">+' + (slot.items.length - 2) + ' weitere</li>';
            }
          });
          days += '</ul>';
        } else {
          days += '<div class="tl-day-tile-empty">Freier Tag</div>';
        }
        days += '</div>';
      });
      days += '</div>';
    } else {
      days = '<div style="padding:1rem;color:#9CA3AF">'
        + (phase.subtitle || 'Keine Tages-Daten vorhanden')
        + (phase.tips ? '<br><br>💡 ' + phase.tips : '')
        + '</div>';
    }

    var chevronSvg = '<svg class="tl-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var html = '<div class="tl-card-row' + (phase.image ? ' tl-card-row--img' : '') + '">';
    if (phase.image) html += '<div class="tl-phase-img" style="background-image:url(\'' + phase.image + '\')"></div>';
    html += '<div class="tl-card' + (isOpen ? ' tl-card--open' : '') + '" style="--phase-color:' + phase.color + '">';
    html += '<div class="tl-card-header" tabindex="0" role="button" aria-expanded="' + isOpen + '">';
    html += '<div class="tl-phase-num">' + phase.id + '</div>';
    html += '<div class="tl-header-content">';
    html += '<div class="tl-header-top">';
    html += '<span class="tl-phase-emoji">' + phase.emoji + '</span>';
    html += '<span class="tl-phase-name">' + phase.name + '</span>';
    html += '</div>';
    html += '<div class="tl-meta-row">';
    html += '<span class="tl-badge tl-badge--nights">' + phase.nights + ' Nächte</span>';
    html += tempBadge + seismikBadge;
    html += '</div>';
    if (flightBadge) {
      html += '<div class="tl-flight-row">' + flightBadge + '</div>';
    }
    html += highlights;
    if (phase.buggyNote) {
      html += '<div class="tl-buggy-note">🚶 ' + phase.buggyNote + '</div>';
    }
    html += '</div>';
    html += '<div class="tl-chevron-wrap">' + chevronSvg + '</div>';
    html += '</div>';
    html += '<div class="tl-card-body"><div class="tl-card-body-inner">';
    html += days;
    html += '</div></div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderTimeline() {
    var container = document.getElementById('timeline-container');
    if (!container) return;
    if (!window.MEXIKO_OAXACA || !window.MEXIKO_OAXACA.phases) return;

    var phases = window.MEXIKO_OAXACA.phases;
    var html = '';
    phases.forEach(function(phase, index) {
      html += renderPhaseCard(phase, index);
    });
    container.innerHTML = html;
    if (phases.length >= 4) container.classList.add('tl-multi-col');

    // Seismic-Popup-Handler
    container.querySelectorAll('.tl-sei-q').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var old = document.getElementById('tl-sei-pop');
        if (old && old._src === btn) { old.remove(); return; }
        if (old) old.remove();
        var pop = document.createElement('div');
        pop.id = 'tl-sei-pop';
        pop._src = btn;
        pop.className = 'tl-sei-overlay';
        pop.innerHTML = '<div class="tl-sei-ov-title">' + (btn.getAttribute('data-headline') || '') + '</div>'
                      + '<div class="tl-sei-ov-note">'  + (btn.getAttribute('data-note')     || '') + '</div>';
        document.body.appendChild(pop);
        var r = btn.getBoundingClientRect();
        var left = Math.min(r.left + window.scrollX, window.innerWidth - 296);
        pop.style.cssText = 'top:' + (r.bottom + window.scrollY + 8) + 'px;left:' + Math.max(8, left) + 'px';
        setTimeout(function() {
          document.addEventListener('click', function _close(ev) {
            if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener('click', _close, true); }
          }, true);
        }, 0);
      });
    });

    container.addEventListener('click', function(e) {
      var header = e.target.closest('.tl-card-header');
      if (!header) return;
      var card = header.closest('.tl-card');
      if (!card) return;
      var isOpen = card.classList.contains('tl-card--open');
      card.classList.toggle('tl-card--open', !isOpen);
      header.setAttribute('aria-expanded', !isOpen);
    });

    container.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var header = e.target.closest('.tl-card-header');
        if (header) { e.preventDefault(); header.click(); }
      }
    });
  }

  function safeInit(mod) { try { if (mod) mod.init(); } catch(e) { console.warn('init error:', e.message); } }

  function initModules() {
    safeInit(window.mapModule);
    safeInit(window.chartsModule);
    safeInit(window.transferModule);
    safeInit(window.videosModule);
    safeInit(window.sightsModule);
    safeInit(window.restaurantsModule);
    safeInit(window.bookingModule);
    safeInit(window.faqModule);
    safeInit(window.sicherheitModule);
    try { renderTimeline(); } catch(e) { console.warn('timeline error:', e.message); }
  }

  // --- Init ---
  initGate();
  initNav();

})();
