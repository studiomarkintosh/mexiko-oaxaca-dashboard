// js/charts.js
// Chart.js 4.4 Infografiken — Reise-Dashboard
// Liest: window.MEXIKO_OAXACA.charts.* + window.MEXIKO_OAXACA.meta.*
// Schreibt: window.chartsModule

window.chartsModule = (function () {
  'use strict';

  var _charts = {};

  // Oaxaca warm light palette
  var C = {
    terracotta: '#C14A2E',
    amber:      '#E8953A',
    tan:        '#D4A96A',
    sage:       '#5A8A62',
    blue:       '#3B6FA0',
    purple:     '#7C5CBF',
    text:       '#7A6A58',
    grid:       'rgba(120,80,40,0.07)',
    tooltip: {
      bg:     '#FFFFFF',
      title:  '#1A1208',
      body:   '#7A6A58',
      border: 'rgba(180,140,100,0.18)'
    }
  };

  function _tooltip() {
    return {
      backgroundColor: C.tooltip.bg,
      titleColor:      C.tooltip.title,
      bodyColor:       C.tooltip.body,
      borderColor:     C.tooltip.border,
      borderWidth: 1, cornerRadius: 10, padding: 12, enabled: true
    };
  }

  function _scaleX() {
    return { grid: { color: C.grid }, ticks: { color: C.text, maxRotation: 0, autoSkip: true } };
  }
  function _scaleY(cb) {
    return {
      grid: { color: C.grid },
      ticks: Object.assign({ color: C.text }, cb ? { callback: cb } : {}),
      border: { dash: [4, 4] }
    };
  }
  function _legend() {
    return { labels: { color: C.text, boxWidth: 12, padding: 14, font: { size: 11 } } };
  }

  // ---------------------------------------------------------------

  function _renderBudgetCounter() {
    var c = document.getElementById('budget-counter-container');
    if (!c) return;
    var daily = window.MEXIKO_OAXACA.meta.dailyBudget;
    var budget = window.MEXIKO_OAXACA.meta.budget;
    if (!daily || !budget) return;
    var html = '<div class="budget-counter">'
      + '<div class="budget-item budget-item--comfort">'
      +   '<span class="budget-amount">\u20AC' + daily.comfort + '</span>'
      +   '<span class="budget-label">pro Tag \u00B7 Komfort</span>'
      + '</div>'
      + '<div class="budget-vs">vs.</div>'
      + '<div class="budget-item budget-item--backpacker">'
      +   '<span class="budget-amount">\u20AC' + daily.backpacker + '</span>'
      +   '<span class="budget-label">pro Tag \u00B7 ' + (daily.backpackerLabel || 'Budget-Ziel') + '</span>'
      + '</div>'
      + '<div class="budget-total">'
      +   'Gesamtbudget: \u20AC' + budget.low + '\u2013\u20AC' + budget.high
      + '</div>'
      + (daily.backpackerRef ? '<div class="budget-ref">Referenz Solo-Backpacker: \u20AC' + daily.backpackerRef + '/Tag &middot; <span class="budget-ref-note">' + daily.backpackerRefNote + '</span></div>' : '')
      + '</div>';
    c.innerHTML = html;
  }

  function _initCosts() {
    var canvas = document.getElementById('chart-costs');
    if (!canvas) return;
    if (_charts.costs) { _charts.costs.destroy(); }
    var d = window.MEXIKO_OAXACA.charts.costs;
    if (!d) return;
    _charts.costs = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: d.labels,
        datasets: [{ data: d.values, backgroundColor: d.colors || [C.terracotta,C.amber,C.tan,C.sage,C.blue], borderColor: '#fff', borderWidth: 3, hoverOffset: 8 }]
      },
      options: {
        cutout: '64%',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: _legend().labels },
          tooltip: Object.assign(_tooltip(), { callbacks: {
            label: function(ctx) {
              var total = ctx.dataset.data.reduce(function(a,b){ return a+b; },0);
              var pct = Math.round(ctx.parsed / total * 100);
              return ' ' + ctx.label + ': \u20AC' + ctx.parsed + ' (' + pct + '%)';
            }
          }})
        }
      }
    });
  }

  function _initNights() {
    var canvas = document.getElementById('chart-nights');
    if (!canvas) return;
    if (_charts.nights) { _charts.nights.destroy(); }
    var d = window.MEXIKO_OAXACA.charts.nights;
    if (!d) return;
    _charts.nights = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: d.labels.map(function(l, i){ return String(i + 1); }),
        datasets: [{ data: d.values, backgroundColor: d.colors || [C.terracotta,C.amber,C.sage,C.blue], borderRadius: 8, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: Object.assign(_tooltip(), { callbacks: {
          title: function(items){ return d.labels[items[0].dataIndex]; }
        }})},
        scales: {
          x: Object.assign(_scaleX(), { title: { display: true, text: 'Phase', color: C.text, font: { size: 11 } } }),
          y: _scaleY(function(v){ return v + ' N'; })
        }
      }
    });
  }

  function _initTempStops() {
    var canvas = document.getElementById('chart-temp-stops');
    if (!canvas) return;
    if (_charts.tempStops) { _charts.tempStops.destroy(); }
    var d = window.MEXIKO_OAXACA.charts.temp_stops;
    if (!d || !d.stops || !d.stops.length) { canvas.closest('.chart-card').style.display = 'none'; return; }
    var labels = d.stops.map(function(s, i){ return String(i + 1); });
    _charts.tempStops = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Max \u00B0C', data: d.stops.map(function(s){ return s.max; }), backgroundColor: C.terracotta, borderRadius: 6 },
          { label: 'Min \u00B0C', data: d.stops.map(function(s){ return s.min; }), backgroundColor: C.blue, borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: _legend(), tooltip: Object.assign(_tooltip(), { callbacks: {
          title: function(items){ return d.stops[items[0].dataIndex].phase; },
          label: function(ctx){ return ' ' + ctx.dataset.label + ': ' + ctx.parsed.y + '\u00B0C'; }
        }})},
        scales: {
          x: Object.assign(_scaleX(), { title: { display: true, text: 'Phase', color: C.text, font: { size: 11 } } }),
          y: _scaleY(function(v){ return v + '\u00B0C'; })
        }
      }
    });
  }

  // C4: Regen & Temperatur PRO REGION (per-ort, nicht timeline)
  function _initRain() {
    var canvas = document.getElementById('chart-rain');
    if (!canvas) return;
    if (_charts.rain) { _charts.rain.destroy(); }
    var ns = window.MEXIKO_OAXACA;

    // Use temp_stops for per-ort x-axis, compute avg rain per stop from daily data
    var stops = ns.charts.temp_stops && ns.charts.temp_stops.stops;
    if (!stops || !stops.length) { canvas.closest('.chart-card').style.display = 'none'; return; }

    var dailyRain  = ns.charts.rain  ? ns.charts.rain.values  : [];
    var totalDays  = dailyRain.length || 1;
    var stopCount  = stops.length;
    var chunkSize  = Math.ceil(totalDays / stopCount);

    var rainPerStop = stops.map(function(s, i) {
      var slice = dailyRain.slice(i * chunkSize, (i + 1) * chunkSize);
      if (!slice.length) return 0;
      var sum = slice.reduce(function(a, b){ return a + b; }, 0);
      return Math.round(sum / slice.length * 10) / 10;
    });

    var labels    = stops.map(function(s, i){ return String(i + 1); });
    var tempMaxes = stops.map(function(s){ return s.max; });

    _charts.rain = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Ø Regen mm/Tag', data: rainPerStop, backgroundColor: 'rgba(59,111,160,0.65)', borderRadius: 6, yAxisID: 'y' },
          { label: 'Temp max \u00B0C',   data: tempMaxes,  type: 'line', borderColor: C.terracotta,
            backgroundColor: 'rgba(193,74,46,0.08)', fill: true, tension: 0.35,
            pointRadius: 5, pointBackgroundColor: C.terracotta, yAxisID: 'y2', borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: _legend(), tooltip: Object.assign(_tooltip(), { callbacks: {
          title: function(items){ return stops[items[0].dataIndex].phase; }
        }})},
        scales: {
          x: Object.assign(_scaleX(), { title: { display: true, text: 'Phase', color: C.text, font: { size: 11 } } }),
          y:  Object.assign(_scaleY(function(v){ return v + ' mm'; }), { position: 'left' }),
          y2: { position: 'right', grid: { display: false }, ticks: { color: C.text, callback: function(v){ return v + '\u00B0C'; } } }
        }
      }
    });
  }

  function _initActivityDays() {
    var canvas = document.getElementById('chart-activity-days');
    if (!canvas) return;
    if (_charts.activityDays) { _charts.activityDays.destroy(); }
    var d = window.MEXIKO_OAXACA.charts.activity_days;
    if (!d) { canvas.closest('.chart-card').style.display = 'none'; return; }
    _charts.activityDays = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: d.labels,
        datasets: [{ data: d.values, backgroundColor: d.colors || [C.terracotta,C.amber,C.tan,C.sage,C.blue,C.purple], borderColor: '#fff', borderWidth: 3, hoverOffset: 8 }]
      },
      options: {
        cutout: '58%',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: C.text, boxWidth: 10, padding: 12, font: { size: 11 } } },
          tooltip: Object.assign(_tooltip(), { callbacks: {
            label: function(ctx){ return ' ' + ctx.label + ': ' + ctx.parsed + ' Tage'; }
          }})
        }
      }
    });
  }

  function _initGreenspace() {
    var canvas = document.getElementById('chart-greenspace');
    if (!canvas) return;
    if (_charts.greenspace) { _charts.greenspace.destroy(); }
    var d = window.MEXIKO_OAXACA.charts.greenspace;
    if (!d || !d.orte || !d.orte.length) { canvas.closest('.chart-card').style.display = 'none'; return; }
    var valid = d.orte.filter(function(o){ return o.pct !== null; });
    if (!valid.length) { canvas.closest('.chart-card').style.display = 'none'; return; }
    _charts.greenspace = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: valid.map(function(o){ return o.name; }),
        datasets: [{
          label: 'Gr\u00fcnfl\u00e4che %',
          data: valid.map(function(o){ return o.pct; }),
          backgroundColor: valid.map(function(o){ return o.pct > 60 ? '#3D7A45' : o.pct > 25 ? C.sage : '#8BB88F'; }),
          borderRadius: 8, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: Object.assign(_tooltip(), { callbacks: {
          label: function(ctx){ return ' ' + ctx.parsed.y + '% Gr\u00fcnfl\u00e4che'; }
        }})},
        scales: {
          x: _scaleX(),
          y: Object.assign(_scaleY(function(v){ return v + '%'; }), { max: 100 })
        }
      }
    });
  }

  function _initAqi() {
    var canvas = document.getElementById('chart-aqi');
    if (!canvas) return;
    if (_charts.aqi) { _charts.aqi.destroy(); }
    var d = window.MEXIKO_OAXACA.charts.aqi;
    if (!d || !d.orte || !d.orte.length) { canvas.closest('.chart-card').style.display = 'none'; return; }
    _charts.aqi = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: d.orte.map(function(o){ return o.name; }),
        datasets: [{
          label: 'PM2.5 \u00b5g/m\u00b3',
          data:  d.orte.map(function(o){ return o.pm25; }),
          backgroundColor: d.orte.map(function(o){ return o.color || (o.pm25 <= 12 ? '#3D7A45' : o.pm25 <= 35 ? C.amber : C.terracotta); }),
          borderRadius: 8, borderSkipped: false, maxBarThickness: 60
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: Object.assign(_tooltip(), { callbacks: {
          label: function(ctx){ return ' PM2.5: ' + ctx.parsed.y + ' \u00b5g/m\u00b3'; }
        }})},
        scales: {
          x: _scaleX(),
          y: _scaleY(function(v){ return v + ' \u00b5g/m\u00b3'; })
        }
      }
    });
  }

  function _initOepnv() {
    var el = document.getElementById('oepnv-card');
    if (!el) return;
    var d = window.MEXIKO_OAXACA.charts.oepnv;
    if (!d) return;
    var html = '<div class="oepnv-inner"><h3 class="chart-title">\u00d6ffentlicher Verkehr</h3>';
    html += '<p class="oepnv-bezahlung">' + d.bezahlung + '</p>';
    html += '<div class="oepnv-grid">';
    d.kategorien.forEach(function(k){
      html += '<div class="oepnv-item"><span class="oepnv-icon">' + k.icon + '</span><div><strong>' + k.name + '</strong><p>' + k.note + '</p></div></div>';
    });
    html += '</div>';
    if (d.tipp) html += '<p class="oepnv-tipp">\ud83d\udca1 ' + d.tipp + '</p>';
    html += '</div>';
    el.innerHTML = html;
    el.style.display = 'block';
  }

  return {
    init: function () {
      if (!window.MEXIKO_OAXACA) return;

      // Light mode defaults — warm Oaxaca palette
      Chart.defaults.color       = '#7A6A58';
      Chart.defaults.borderColor = 'rgba(120,80,40,0.07)';
      Chart.defaults.plugins.legend.labels.color    = '#7A6A58';
      Chart.defaults.plugins.legend.labels.boxWidth = 12;
      Chart.defaults.plugins.tooltip.backgroundColor = '#FFFFFF';
      Chart.defaults.plugins.tooltip.titleColor      = '#1A1208';
      Chart.defaults.plugins.tooltip.bodyColor       = '#7A6A58';
      Chart.defaults.plugins.tooltip.cornerRadius    = 10;
      Chart.defaults.plugins.tooltip.padding         = 12;
      Chart.defaults.scales = Chart.defaults.scales || {};
      ['linear','category','time','logarithmic'].forEach(function(t) {
        var s = Chart.defaults.scales[t] = Chart.defaults.scales[t] || {};
        s.grid  = Object.assign(s.grid  || {}, { color: 'rgba(120,80,40,0.07)' });
        s.ticks = Object.assign(s.ticks || {}, { color: '#7A6A58' });
      });

      _renderBudgetCounter();
      _initCosts();
      _initNights();
      _initTempStops();
      _initRain();
      _initActivityDays();
      _initGreenspace();
      _initAqi();
      _initOepnv();

      console.log('[charts.js] initialisiert');
    }
  };

})();
