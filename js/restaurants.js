// js/restaurants.js
// Mexiko Reise-Dashboard — Restaurant-Cards mit Phasen-Filter

window.restaurantsModule = (function() {
  'use strict';

  var _currentPhase = 'all';

  var TYPE_LABEL = {
    'vegan':        '\uD83C\uDF31 Vegan',
    'vegetarisch':  '\uD83E\uDD57 Vegetarisch',
    'veg-option':   '\u2713 Veg-Option'
  };

  function _filter(phaseId) {
    if (phaseId === 'all') return window.MEXIKO_OAXACA.restaurants;
    return window.MEXIKO_OAXACA.restaurants.filter(function(r) {
      if (Array.isArray(r.phaseIds)) return r.phaseIds.indexOf(phaseId) !== -1;
      return r.phaseId === phaseId;
    });
  }

  function _makeCard(r) {
    // Neues Schema: category/tip/veganFriendly/priceLevel — Altes: type/note/veganSymbol/pricePerPerson
    var isVegan    = r.veganFriendly || r.veganSymbol;
    var namePrefix = isVegan ? '\uD83C\uDF31 ' : '';
    var typeLabel  = TYPE_LABEL[r.type] || r.category || r.type || '';
    var note       = r.tip || r.note || '';
    var mapsUrl    = r.googleMapsUrl || (r.lat && r.lng ? 'https://maps.google.com/?q=' + r.lat + ',' + r.lng : null);

    var priceHtml = '';
    if (r.pricePerPerson) {
      priceHtml = '<span class="rst-price">\u20AC' + r.pricePerPerson.eur + '/P</span>';
    } else if (r.priceLevel) {
      priceHtml = '<span class="rst-price">' + r.priceLevel + '</span>';
    }

    var ratingHtml = r.rating ? '<span class="rst-rating">\u2605 ' + r.rating + '</span>' : '';

    return '<div class="rst-card">'
      + '<div class="rst-name">' + namePrefix + r.name + '</div>'
      + '<div class="rst-meta">'
        + (typeLabel ? '<span class="rst-type">' + typeLabel + '</span>' : '')
        + priceHtml
        + ratingHtml
      + '</div>'
      + (note ? '<div class="rst-note">' + note + '</div>' : '')
      + (r.mustTry ? '<div class="rst-musttry">\u2728 ' + r.mustTry + '</div>' : '')
      + (mapsUrl ? '<a class="rst-link" href="' + mapsUrl + '" target="_blank" rel="noopener">Google Maps \u2197</a>' : '')
      + '</div>';
  }

  function _renderCards(container, phase) {
    var old = container.querySelector('.rst-grid');
    if (old) old.parentNode.removeChild(old);

    var items = _filter(phase === 'all' ? 'all' : parseInt(phase, 10));
    var html = '<div class="rst-grid">';
    items.forEach(function(r) { html += _makeCard(r); });
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  function _renderFilterButtons(container) {
    var html = '<div class="rst-filters">';
    html += '<button class="rst-filter rst-filter--active" data-phase="all">Alle</button>';
    window.MEXIKO_OAXACA.phases.forEach(function(p) {
      html += '<button class="rst-filter" data-phase="' + p.id + '">Phase ' + p.id + ' ' + (p.title || p.name || '') + '</button>';
    });
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  function _bindEvents(container) {
    container.addEventListener('click', function(e) {
      var btn = e.target;
      while (btn && btn !== container) {
        if (btn.classList && btn.classList.contains('rst-filter')) break;
        btn = btn.parentNode;
      }
      if (!btn || !btn.classList || !btn.classList.contains('rst-filter')) return;

      var phase = btn.getAttribute('data-phase');
      _currentPhase = phase;

      var allBtns = container.querySelectorAll('.rst-filter');
      for (var i = 0; i < allBtns.length; i++) { allBtns[i].classList.remove('rst-filter--active'); }
      btn.classList.add('rst-filter--active');

      _renderCards(container, phase);
    });
  }

  return {
    init: function() {
      if (!window.MEXIKO_OAXACA || !window.MEXIKO_OAXACA.restaurants) return;
      var el = document.getElementById('restaurants-content');
      if (!el) return;
      el.innerHTML = '';
      el.classList.remove('placeholder');
      _renderFilterButtons(el);
      _renderCards(el, 'all');
      _bindEvents(el);
      console.log('[restaurants.js] initialisiert (' + window.MEXIKO_OAXACA.restaurants.length + ' Einträge)');
    }
  };

})();
