// js/sicherheit.js
// Reise-Dashboard — Sicherheit: Live-Fetch von server.py /security
// Flexibles Schema: Themen destinations-spezifisch (Erdbeben, Tsunami, Hurrikan, Kriminalität etc.)
// Fallback auf data.js (window.MEXIKO_OAXACA.kriminalitaet / seismik / hurrikan / imd)

window.sicherheitModule = (function() {
  'use strict';

  // -------------------------------------------------------
  // Hilfsfunktionen
  // -------------------------------------------------------

  function _fmtDate(iso) {
    if (!iso) return '–';
    try { return new Date(iso).toLocaleDateString('de-AT', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch(e) { return iso; }
  }

  var _LEVEL_META = {
    niedrig: { color: '#4a9e4a', icon: '🟢', label: 'Niedrig' },
    gering:  { color: '#4a9e4a', icon: '🟢', label: 'Gering' },
    mittel:  { color: '#e8c547', icon: '🟡', label: 'Mittel' },
    erhoht:  { color: '#F59E0B', icon: '🟠', label: 'Erhöht' },
    hoch:    { color: '#EF4444', icon: '🔴', label: 'Hoch' }
  };

  function _lvl(k) { return _LEVEL_META[k] || _LEVEL_META['mittel']; }

  // -------------------------------------------------------
  // Generischer Topic-Renderer
  // -------------------------------------------------------

  function _renderTopic(topic) {
    var lv = _lvl(topic.level || 'mittel');
    var html = '<div class="sec-block">';
    html += '<h3 class="sec-block-title">' + (topic.icon || '⚠️') + ' ' + topic.title + '</h3>';

    // Offizielle Warnung
    if (topic.warning) {
      html += '<div class="sk-official-warning" style="border-left:3px solid ' + lv.color + '">';
      html += '<span style="color:' + lv.color + ';font-weight:700">' + lv.icon + ' ' + lv.label + '</span> · ';
      html += topic.warning;
      html += '</div>';
    }

    if (topic.intro) html += '<p class="sec-block-intro">' + topic.intro + '</p>';

    // Fakten
    if (topic.facts && topic.facts.length) {
      html += '<div class="wd-metrics">';
      topic.facts.forEach(function(f) {
        html += '<div class="wd-metric"><span class="wd-metric-value">' + f.value + '</span><span class="wd-metric-label">' + f.label + '</span></div>';
      });
      html += '</div>';
    }

    // Regionen / Bundesstaaten
    if (topic.regions && topic.regions.length) {
      html += '<div class="krim-grid">';
      topic.regions.forEach(function(r) {
        var rl = _lvl(r.level || 'mittel');
        html += '<div class="krim-card" style="border-left-color:' + rl.color + '">';
        html += '<div class="krim-head">';
        html += '<span class="krim-icon">' + rl.icon + '</span>';
        html += '<span class="krim-name">' + r.name + '</span>';
        html += '<span class="krim-badge" style="color:' + rl.color + ';border-color:' + rl.color + '">' + rl.label + '</span>';
        html += '</div>';
        if (r.note) html += '<div class="krim-note">' + r.note + '</div>';
        if (r.phaseIds && r.phaseIds.length) {
          html += '<div class="krim-phases">Betrifft: ' + r.phaseIds.map(function(id){return 'Phase '+id;}).join(', ') + '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    // Chart-Canvas für Kriminalität & Erdbeben
    if (topic.id === 'kriminalitaet' && topic.regions && topic.regions.length) {
      html += '<div class="sec-chart-wrap"><canvas id="chart-sec-krim" aria-label="Kriminalit\u00e4tslevel nach Region"></canvas></div>';
    }
    if (topic.id === 'erdbeben') {
      html += '<div class="sec-chart-wrap"><canvas id="chart-sec-seismik" aria-label="Erdbebenrisiko pro Phase"></canvas></div>';
    }

    // Tipps
    if (topic.tipps && topic.tipps.length) {
      html += '<h4 class="sec-sub">Tipps</h4><ul class="sk-list">';
      topic.tipps.forEach(function(t) { html += '<li>' + t + '</li>'; });
      html += '</ul>';
    }

    // Apps
    if (topic.apps && topic.apps.length) {
      html += '<h4 class="sec-sub">Apps</h4><div class="sk-apps">';
      topic.apps.forEach(function(a) {
        html += '<div class="sk-app"><div class="sk-app-head"><strong>' + a.name + '</strong><span class="badge">' + (a.note||'') + '</span></div>';
        if (a.what) html += '<div class="sk-app-what">' + a.what + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // IMD (Impfungen/Medikamente/Dokumente) — topic.id === 'imd' oder hat impfungen
    if (topic.impfungen || topic.medikamente || topic.dokumente) {
      html += _renderImdFields(topic);
    }

    html += '</div>';
    return html;
  }

  function _renderImdFields(d) {
    var html = '';
    if (d.impfungen && d.impfungen.length) {
      html += '<div class="imd-section"><div class="imd-section-label">Impfungen</div><div class="imd-rows">';
      d.impfungen.forEach(function(v) {
        var badge = v.pflicht
          ? '<span class="imd-badge imd-badge--pflicht">Pflicht</span>'
          : '<span class="imd-badge imd-badge--empfohlen">Empfohlen</span>';
        html += '<div class="imd-row">' + badge + '<span class="imd-name">' + v.name + '</span>';
        if (v.note) html += '<span class="imd-note">' + v.note + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    }
    if (d.medikamente && d.medikamente.length) {
      html += '<div class="imd-section"><div class="imd-section-label">Reiseapotheke</div><div class="imd-rows">';
      d.medikamente.forEach(function(m) {
        html += '<div class="imd-row"><span class="imd-name">💊 ' + m.name + '</span>';
        if (m.note) html += '<span class="imd-note">' + m.note + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    }
    if (d.dokumente && d.dokumente.length) {
      html += '<div class="imd-section"><div class="imd-section-label">Dokumente</div><div class="imd-rows">';
      d.dokumente.forEach(function(doc) {
        html += '<div class="imd-row"><span class="imd-name">📄 ' + doc.name + '</span>';
        if (doc.note) html += '<span class="imd-note">' + doc.note + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    }
    if (d.versicherung) {
      html += '<div class="imd-versicherung">🛡 ' + d.versicherung + '</div>';
    }
    return html;
  }

  // -------------------------------------------------------
  // Fallback: data.js Legacy → topics-Array konvertieren
  // -------------------------------------------------------

  function _legacyToTopics(ns) {
    var topics = [];
    var k = ns.kriminalitaet;
    if (k && k.bundesstaaten) {
      var kTopic = {
        id: 'kriminalitaet', title: 'Kriminalität & Sicherheit', icon: '🚨',
        level: k.bundesstaaten[0] && k.bundesstaaten[0].level || 'mittel',
        intro: k.intro || '', warning: k.reiseWarnung || '',
        regions: k.bundesstaaten.map(function(b) {
          return { name: b.name, level: b.level, note: b.note, phaseIds: b.phaseIds };
        }),
        tipps: k.tipps || [],
        sources: k.sources || []
      };
      topics.push(kTopic);
    }

    var s = ns.seismik;
    if (s && s.intro) {
      var sTopic = {
        id: 'erdbeben', title: 'Erdbeben', icon: '⚡',
        level: s.risiko || 'mittel',
        intro: s.intro, facts: s.facts || [],
        regions: (s.regionen || []).map(function(r) {
          return { name: r.name, level: r.level, note: r.note };
        }),
        apps: s.apps || []
      };
      topics.push(sTopic);
    }

    var h = ns.hurrikan;
    if (h && h.intro) {
      topics.push({
        id: 'hurrikan', title: 'Hurrikan & Sturm', icon: '🌀',
        level: h.statusLevel || h.risiko || 'niedrig',
        intro: h.intro, warning: h.status || '',
        regions: h.regions || []
      });
    }

    var imd = ns.imd;
    if (imd) {
      topics.push({
        id: 'imd', title: 'Impfungen, Medikamente & Dokumente', icon: '💉',
        intro: '', level: 'niedrig',
        impfungen: imd.impfungen || [],
        medikamente: imd.medikamente || [],
        dokumente: imd.dokumente || [],
        versicherung: imd.versicherung || ''
      });
    }
    return topics;
  }

  // -------------------------------------------------------
  // seismikBadge für Timeline (aus live-topics oder legacy)
  // -------------------------------------------------------

  window.seismikBadge = function(phaseId) {
    // Versucht cached live-data, dann legacy data.js
    var ns = window.MEXIKO_OAXACA;
    if (!ns) return '';
    var seismik = ns.seismik;
    if (!seismik) return '';
    var entry = seismik.phases ? seismik.phases[phaseId] : null;
    if (!entry) return '';
    var color = '#e8c547';
    var icon = '⚡';
    var label = entry.level || 'mittel';
    if (_LEVEL_META[label]) { color = _LEVEL_META[label].color; icon = _LEVEL_META[label].icon; }
    var html = '<div class="tl-seismik" style="--lvl:' + color + '">';
    html += '<div class="tl-seismik-head"><span class="sk-bar">' + icon + '</span>';
    html += '<strong>Erdbeben: ' + label + '</strong>';
    if (entry.headline) html += ' · ' + entry.headline;
    html += '</div>';
    if (entry.note) html += '<div class="tl-seismik-note">' + entry.note + '</div>';
    html += '<a class="tl-seismik-link" href="#sicherheit">Sicherheits-Details →</a>';
    html += '</div>';
    return html;
  };

  // -------------------------------------------------------
  // Render: Topics in DOM schreiben
  // -------------------------------------------------------

  function _renderTopics(el, topics, sources, lastCheck) {
    var html = '';
    topics.forEach(function(topic) {
      if (topic.id === 'imd') {
        html += '<div class="sec-block sk-block imd-block">';
        html += '<h3 class="sk-block-title">' + (topic.icon || '💉') + ' ' + topic.title + '</h3>';
        html += _renderImdFields(topic);
        html += '</div>';
      } else {
        html += _renderTopic(topic);
      }
    });

    // Quellen-Footer
    if (sources && sources.length) {
      html += '<div class="wd-sources">';
      sources.forEach(function(s) {
        html += '<a class="wd-source" href="' + s.url + '" target="_blank" rel="noopener">' + s.label + ' ↗</a>';
      });
      html += '</div>';
    }
    if (lastCheck) html += '<p class="wd-lastcheck">Stand: ' + _fmtDate(lastCheck) + '</p>';

    el.classList.remove('placeholder');
    el.innerHTML = html;
  }

  // -------------------------------------------------------
  // Sicherheits-Charts initialisieren
  // -------------------------------------------------------

  function _initSecCharts(ns) {
    if (typeof Chart === 'undefined') return;

    var lv = { gering: 1, niedrig: 1, mittel: 2, erhoht: 3, hoch: 3 };

    // Chart: Kriminalität nach Region (horizontal bar)
    var crimCanvas = document.getElementById('chart-sec-krim');
    if (crimCanvas && ns.kriminalitaet && ns.kriminalitaet.bundesstaaten) {
      var bs = ns.kriminalitaet.bundesstaaten;
      new Chart(crimCanvas, {
        type: 'bar',
        data: {
          labels: bs.map(function(b) { return b.name; }),
          datasets: [{
            data:            bs.map(function(b) { return lv[b.level] || 2; }),
            backgroundColor: bs.map(function(b) { return (_LEVEL_META[b.level] || _LEVEL_META['mittel']).color; }),
            borderRadius: 6, borderSkipped: false, barThickness: 28
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#fff', titleColor: '#1A1208', bodyColor: '#7A6A58', borderColor: 'rgba(180,140,100,0.18)', borderWidth: 1, cornerRadius: 10, padding: 12,
              callbacks: {
                label: function(ctx) {
                  var meta = _LEVEL_META[bs[ctx.dataIndex].level] || _LEVEL_META['mittel'];
                  return ' ' + meta.icon + ' ' + meta.label;
                },
                afterLabel: function(ctx) {
                  var note = bs[ctx.dataIndex].note;
                  return note ? note : '';
                }
              }
            }
          },
          scales: {
            x: { min: 0, max: 3, grid: { color: 'rgba(120,80,40,0.07)' }, ticks: { color: '#7A6A58', callback: function(v) { return ['', 'Gering', 'Mittel', 'Hoch'][v] || ''; } } },
            y: { ticks: { color: '#7A6A58' }, grid: { display: false } }
          }
        }
      });
    }

    // Chart: Erdbebenrisiko pro Phase (bar)
    var seisCanvas = document.getElementById('chart-sec-seismik');
    if (seisCanvas && ns.seismik && ns.seismik.phases) {
      var phases = ns.seismik.phases;
      var pIds = Object.keys(phases).sort(function(a, b) { return parseInt(a) - parseInt(b); });
      new Chart(seisCanvas, {
        type: 'bar',
        data: {
          labels: pIds.map(function(id) { return 'Phase ' + id; }),
          datasets: [{
            data:            pIds.map(function(id) { return lv[phases[id].level] || 2; }),
            backgroundColor: pIds.map(function(id) { return (_LEVEL_META[phases[id].level] || _LEVEL_META['mittel']).color; }),
            borderRadius: 6, borderSkipped: false
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#fff', titleColor: '#1A1208', bodyColor: '#7A6A58', borderColor: 'rgba(180,140,100,0.18)', borderWidth: 1, cornerRadius: 10, padding: 12,
              callbacks: {
                title: function(items) { return 'Phase ' + pIds[items[0].dataIndex]; },
                label: function(ctx) {
                  var ph = phases[pIds[ctx.dataIndex]];
                  var meta = _LEVEL_META[ph.level] || _LEVEL_META['mittel'];
                  return ' ' + meta.icon + ' ' + meta.label + (ph.headline ? ' · ' + ph.headline : '');
                }
              }
            }
          },
          scales: {
            x: { ticks: { color: '#7A6A58' }, grid: { display: false } },
            y: { min: 0, max: 3, grid: { color: 'rgba(120,80,40,0.07)' }, ticks: { color: '#7A6A58', callback: function(v) { return ['', 'Gering', 'Mittel', 'Hoch'][v] || ''; } } }
          }
        }
      });
    }
  }

  // -------------------------------------------------------
  // Init — Live-Fetch, dann Fallback
  // -------------------------------------------------------

  return {
    init: function() {
      var ns = window.MEXIKO_OAXACA;
      if (!ns) return;
      var el = document.getElementById('sicherheit-content');
      if (!el) return;

      var slug = (ns.meta && ns.meta.slug) || 'mexiko-oaxaca';
      var base = (window.API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

      // Sofort aus data.js rendern
      var topics = _legacyToTopics(ns);
      _renderTopics(el, topics, (ns.kriminalitaet && ns.kriminalitaet.sources) || [], ns.kriminalitaet && ns.kriminalitaet.lastCheck);
      _initSecCharts(ns);
      console.log('[sicherheit.js] Fallback-Daten gerendert (' + topics.length + ' Topics)');

      // Live-Fetch im Hintergrund — überschreibt nur bei Erfolg
      fetch(base + '/security?slug=' + encodeURIComponent(slug))
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function(data) {
          console.log('[sicherheit.js] Live-Daten geladen:', data.dest, data.lastCheck);
          _renderTopics(el, data.topics || [], data.sources || [], data.lastCheck);
        })
        .catch(function(e) {
          console.warn('[sicherheit.js] Live-Fetch fehlgeschlagen:', e.message);
        });
    }
  };

})();
