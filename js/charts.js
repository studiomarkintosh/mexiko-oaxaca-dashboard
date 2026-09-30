// js/charts.js
// Chart.js 4.4 Infografiken — Mexiko Reise-Dashboard
// Liest: window.MEXIKO_OAXACA.charts.* + window.MEXIKO_OAXACA.meta.*
// Schreibt: window.chartsModule

window.chartsModule = (function () {
  'use strict';

  var _charts = {};

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
        datasets: [{ data: d.values, backgroundColor: d.colors, borderColor: '#0D0F12', borderWidth: 2, hoverOffset: 6 }]
      },
      options: {
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 }, padding: 12 } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                var total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                var pct = Math.round(ctx.parsed / total * 100);
                return ctx.label + ': \u20AC' + ctx.parsed + ' (' + pct + '%)';
              }
            }
          }
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
        labels: d.labels,
        datasets: [{ data: d.values, backgroundColor: d.colors, borderWidth: 0, borderRadius: 4 }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9CA3AF' }, grid: { color: '#1F2937' } },
          y: { ticks: { color: '#9CA3AF', stepSize: 5 }, grid: { color: '#1F2937' } }
        }
      }
    });
  }

  function _initTemp() {
    var canvas = document.getElementById('chart-temp');
    if (!canvas) return;
    if (_charts.temp) { _charts.temp.destroy(); }

    var d = window.MEXIKO_OAXACA.charts.temp;
    if (!d) return;
    _charts.temp = new Chart(canvas, {
      type: 'line',
      data: {
        labels: d.labels,
        datasets: [
          { label: 'Min', data: d.tempMin, borderColor: '#06B6D4', backgroundColor: 'rgba(6,182,212,0.15)', fill: '+1', tension: 0.3 },
          { label: 'Max', data: d.tempMax, borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', fill: '-1', tension: 0.3 }
        ]
      },
      options: {
        plugins: {
          legend: { labels: { color: '#9CA3AF', font: { size: 11 } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y + '\u00B0C'; } } }
        },
        scales: {
          x: { ticks: { color: '#9CA3AF', font: { size: 10 }, maxRotation: 30 }, grid: { color: '#1F2937' } },
          y: { ticks: { color: '#9CA3AF', callback: function(v) { return v + '\u00B0C'; } }, grid: { color: '#1F2937' } }
        }
      }
    });
  }

  function _initEntries() {
    var canvas = document.getElementById('chart-entries');
    if (!canvas) return;
    if (_charts.entries) { _charts.entries.destroy(); }

    if (!window.MEXIKO_OAXACA.charts.entries) {
      var card = canvas.closest('.chart-card');
      if (card) card.style.display = 'none';
      return;
    }
    var entries = window.MEXIKO_OAXACA.charts.entries.data;
    var gratisData = [];
    var paidData = [];

    entries.forEach(function (d, i) {
      if (d.gratis) { gratisData.push({ x: i, y: 0, label: d.label }); }
      else          { paidData.push({ x: i, y: d.eur, label: d.label }); }
    });

    _charts.entries = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Gratis', data: gratisData, backgroundColor: '#10B981', pointRadius: 8 },
          { label: 'Eintritt', data: paidData, backgroundColor: '#F59E0B', pointRadius: 8 }
        ]
      },
      options: {
        plugins: {
          legend: { labels: { color: '#9CA3AF', font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                var d = ctx.raw;
                return d.label + (ctx.dataset.label === 'Gratis' ? ' (gratis)' : ' \u20AC' + d.y);
              }
            }
          }
        },
        scales: {
          x: { display: false },
          y: { ticks: { color: '#9CA3AF', callback: function(v) { return v === 0 ? 'gratis' : '\u20AC' + v; } }, grid: { color: '#1F2937' } }
        }
      }
    });
  }

  function _initTempStops() {
    var canvas = document.getElementById('chart-temp-stops');
    if (!canvas) return;
    var ns = window.MEXIKO_OAXACA;
    var d = ns.charts.temp_stops;
    if (!d || !d.stops || !d.stops.length) { canvas.closest('.chart-card').style.display='none'; return; }
    var labels = d.stops.map(function(s){return s.phase;});
    new Chart(canvas, { type:'bar', data:{ labels:labels, datasets:[
      {label:'Max °C', data:d.stops.map(function(s){return s.max;}), backgroundColor:'#EF4444'},
      {label:'Min °C', data:d.stops.map(function(s){return s.min;}), backgroundColor:'#6366F1'}
    ]}, options:{ responsive:true, plugins:{legend:{labels:{color:'#9CA3AF'}}},
      scales:{ x:{ticks:{color:'#9CA3AF'},grid:{color:'#1F2937'}},
               y:{ticks:{color:'#9CA3AF',callback:function(v){return v+'°C';}},grid:{color:'#1F2937'}}}}});
  }

  function _initRain() {
    var canvas = document.getElementById('chart-rain');
    if (!canvas) return;
    var ns = window.MEXIKO_OAXACA;
    var d = ns.charts.rain;
    if (!d || !d.values) { canvas.closest('.chart-card').style.display='none'; return; }
    // thin out labels: every 3rd
    var lbls = d.labels.map(function(l,i){return i%3===0?l:'';});
    new Chart(canvas, { type:'bar', data:{ labels:lbls, datasets:[
      {label:'Regen mm', data:d.values, backgroundColor:'#06B6D4', yAxisID:'y'},
      {label:'Temp max °C', data:ns.charts.temp ? ns.charts.temp.tempMax : [], type:'line', borderColor:'#F59E0B', backgroundColor:'transparent', yAxisID:'y2', tension:0.3}
    ]}, options:{ responsive:true, plugins:{legend:{labels:{color:'#9CA3AF'}}},
      scales:{ x:{ticks:{color:'#9CA3AF'},grid:{color:'#1F2937'}},
               y:{position:'left',ticks:{color:'#9CA3AF',callback:function(v){return v+' mm';}},grid:{color:'#1F2937'}},
               y2:{position:'right',ticks:{color:'#9CA3AF',callback:function(v){return v+'°C';}},grid:{display:false}}}}});
  }

  function _initActivityDays() {
    var canvas = document.getElementById('chart-activity-days');
    if (!canvas) return;
    var ns = window.MEXIKO_OAXACA;
    var d = ns.charts.activity_days;
    if (!d) { canvas.closest('.chart-card').style.display='none'; return; }
    new Chart(canvas, { type:'doughnut', data:{ labels:d.labels, datasets:[{data:d.values, backgroundColor:d.colors}]},
      options:{ responsive:true, plugins:{legend:{position:'right',labels:{color:'#9CA3AF'}}}}});
  }

  function _initTransport() {
    var canvas = document.getElementById('chart-transport');
    if (!canvas) return;
    var ns = window.MEXIKO_OAXACA;
    var d = ns.charts.transport;
    if (!d || !d.labels) { canvas.closest('.chart-card').style.display='none'; return; }
    new Chart(canvas, { type:'bar', data:{ labels:d.labels, datasets:[
      {label:'km', data:d.values, backgroundColor:'#8B5CF6'}
    ]}, options:{ indexAxis:'y', responsive:true, plugins:{legend:{display:false}},
      scales:{ x:{ticks:{color:'#9CA3AF'},grid:{color:'#1F2937'}},
               y:{ticks:{color:'#9CA3AF'},grid:{color:'#1F2937'}}}}});
  }

  function _initRadar() {
    var canvas = document.getElementById('chart-radar');
    if (!canvas) return;
    var ns = window.MEXIKO_OAXACA;
    var d = ns.charts.radar;
    if (!d) { canvas.closest('.chart-card').style.display='none'; return; }
    new Chart(canvas, { type:'radar', data:{ labels:d.labels, datasets:[
      {label:'Interesse', data:d.values, backgroundColor:'rgba(99,102,241,0.2)', borderColor:'#6366F1', pointBackgroundColor:'#6366F1'}
    ]}, options:{ responsive:true, plugins:{legend:{display:false}},
      scales:{ r:{ticks:{display:false},grid:{color:'#374151'},pointLabels:{color:'#9CA3AF'}}}}});
  }

  function _initFoodVsSleep() {
    var canvas = document.getElementById('chart-food-vs-sleep');
    if (!canvas) return;
    var ns = window.MEXIKO_OAXACA;
    var d = ns.charts.food_vs_sleep;
    if (!d) { canvas.closest('.chart-card').style.display='none'; return; }
    new Chart(canvas, { type:'doughnut', data:{ labels:d.labels, datasets:[
      {data:d.values, backgroundColor:d.colors}
    ]}, options:{ responsive:true, plugins:{legend:{position:'right',labels:{color:'#9CA3AF'}},
      tooltip:{callbacks:{label:function(ctx){return ctx.label+': €'+ctx.parsed;}}}}}});
  }

  function _initGreenspace() {
    var canvas = document.getElementById('chart-greenspace');
    if (!canvas) return;
    var ns = window.MEXIKO_OAXACA;
    var d = ns.charts.greenspace;
    if (!d || !d.orte || !d.orte.length) { canvas.closest('.chart-card').style.display='none'; return; }
    var valid = d.orte.filter(function(o){return o.pct !== null;});
    if (!valid.length) { canvas.closest('.chart-card').style.display='none'; return; }
    new Chart(canvas, { type:'bar', data:{ labels:valid.map(function(o){return o.name;}), datasets:[
      {label:'Grünfläche %', data:valid.map(function(o){return o.pct;}), backgroundColor:'#34D399'}
    ]}, options:{ responsive:true, plugins:{legend:{display:false}},
      scales:{ x:{ticks:{color:'#9CA3AF'},grid:{color:'#1F2937'}},
               y:{ticks:{color:'#9CA3AF',callback:function(v){return v+'%';}},grid:{color:'#1F2937'},max:100}}}});
  }

  function _initAqi() {
    var canvas = document.getElementById('chart-aqi');
    if (!canvas) return;
    var ns = window.MEXIKO_OAXACA;
    var d = ns.charts.aqi;
    if (!d || !d.orte || !d.orte.length) { canvas.closest('.chart-card').style.display='none'; return; }
    new Chart(canvas, { type:'bar', data:{ labels:d.orte.map(function(o){return o.name;}), datasets:[
      {label:'PM2.5 µg/m³', data:d.orte.map(function(o){return o.pm25;}), backgroundColor:d.orte.map(function(o){return o.color;})}
    ]}, options:{ responsive:true, plugins:{legend:{display:false}},
      scales:{ x:{ticks:{color:'#9CA3AF'},grid:{color:'#1F2937'}},
               y:{ticks:{color:'#9CA3AF'},grid:{color:'#1F2937'}}}}});
  }

  function _initOepnv() {
    var el = document.getElementById('oepnv-card');
    if (!el) return;
    var ns = window.MEXIKO_OAXACA;
    var d = ns.charts.oepnv;
    if (!d) return;
    var html = '<div class="oepnv-inner"><h3 class="chart-title">Öffentlicher Verkehr</h3>';
    html += '<p class="oepnv-bezahlung">'+d.bezahlung+'</p>';
    html += '<div class="oepnv-grid">';
    d.kategorien.forEach(function(k){
      html += '<div class="oepnv-item"><span class="oepnv-icon">'+k.icon+'</span><div><strong>'+k.name+'</strong><p>'+k.note+'</p></div></div>';
    });
    html += '</div>';
    if (d.tipp) html += '<p class="oepnv-tipp">💡 '+d.tipp+'</p>';
    html += '</div>';
    el.innerHTML = html;
    el.style.display = 'block';
  }

  return {
    init: function () {
      if (!window.MEXIKO_OAXACA) return;

      Chart.defaults.color = '#9CA3AF';
      Chart.defaults.borderColor = '#1F2937';

      _renderBudgetCounter();
      _initCosts();
      _initNights();
      _initTemp();
      _initEntries();
      _initTempStops();
      _initRain();
      _initActivityDays();
      _initTransport();
      _initRadar();
      _initFoodVsSleep();
      _initGreenspace();
      _initAqi();
      _initOepnv();

      console.log('[charts.js] initialisiert');
    }
  };

})();
