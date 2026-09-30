// js/sights.js
// Highlight-Kacheln für Sights — Phase + Kategorie filterbar

window.sightsModule = (function() {
  'use strict';

  var _currentPhase = 'all';
  var _currentCat   = 'all';

  function _allSights() {
    return window.MEXIKO_OAXACA.sights || [];
  }

  function _filter() {
    return _allSights().filter(function(s) {
      var phaseOk = _currentPhase === 'all'
        ? true
        : (Array.isArray(s.phaseIds)
            ? s.phaseIds.indexOf(parseInt(_currentPhase, 10)) !== -1
            : s.phaseId === parseInt(_currentPhase, 10));
      var catOk = _currentCat === 'all' ? true : s.category === _currentCat;
      return phaseOk && catOk;
    });
  }

  function _uniqueCategories() {
    var cats = [];
    _allSights().forEach(function(s) {
      if (s.category && cats.indexOf(s.category) === -1) cats.push(s.category);
    });
    return cats;
  }

  function _makeCard(s) {
    var mapsUrl = s.lat && s.lng
      ? 'https://www.google.com/maps/place/' + encodeURIComponent(s.name) + '/@' + s.lat + ',' + s.lng + ',17z'
      : (s.googleMapsUrl || null);
    var badges = '';
    if (s.kidFriendly)   badges += '<span class="sight-badge">👶</span>';
    if (s.veganFriendly) badges += '<span class="sight-badge">🌱</span>';

    return '<div class="sight-card">'
      + (s.image ? '<div class="sight-img" style="background-image:url(\'' + s.image + '\')"></div>' : '')
      + '<div class="sight-header">'
        + '<span class="sight-name">' + s.name + '</span>'
        + (s.rating ? '<span class="sight-rating">★ ' + s.rating + '</span>' : '')
      + '</div>'
      + '<div class="sight-meta">'
        + (s.category  ? '<span class="sight-cat sight-cat--clickable" data-cat="' + s.category.replace(/"/g,'&quot;') + '">' + s.category + '</span>' : '')
        + (s.city      ? '<span class="sight-city">' + s.city + '</span>' : '')
        + (s.duration  ? '<span class="sight-dur">⏱ ' + s.duration + '</span>' : '')
        + (s.price     ? '<span class="sight-price">' + s.price + '</span>' : '')
        + badges
      + '</div>'
      + (s.tip ? '<div class="sight-tip">💡 ' + s.tip + '</div>' : '')
      + (mapsUrl ? '<a class="sight-link" href="' + mapsUrl + '" target="_blank" rel="noopener">Maps ↗</a>' : '')
      + '</div>';
  }

  function _renderCards(container) {
    var old = container.querySelector('.sight-grid');
    if (old) old.parentNode.removeChild(old);
    var items = _filter();
    var html = '<div class="sight-grid">';
    items.forEach(function(s) { html += _makeCard(s); });
    if (!items.length) html += '<p class="sight-empty">Keine Sights für diese Auswahl.</p>';
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  function _renderPhaseButtons(container) {
    var html = '<div class="rst-filters sight-phase-filters">';
    html += '<button class="rst-filter rst-filter--active" data-phase="all">Alle Phasen</button>';
    (window.MEXIKO_OAXACA.phases || []).forEach(function(p) {
      html += '<button class="rst-filter" data-phase="' + p.id + '">' + (p.title || 'Phase ' + p.id) + '</button>';
    });
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  function _renderCatChips(container) {
    var cats = _uniqueCategories();
    if (!cats.length) return;
    var html = '<div class="sight-cat-filters">';
    html += '<button class="sight-chip sight-chip--active" data-cat="all">Alle</button>';
    cats.forEach(function(c) {
      html += '<button class="sight-chip" data-cat="' + c.replace(/"/g,'&quot;') + '">' + c + '</button>';
    });
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  function _syncCatChips(container) {
    var chips = container.querySelectorAll('.sight-chip');
    for (var i = 0; i < chips.length; i++) {
      var isActive = chips[i].getAttribute('data-cat') === _currentCat;
      if (isActive) chips[i].classList.add('sight-chip--active');
      else          chips[i].classList.remove('sight-chip--active');
    }
  }

  function _bindEvents(container) {
    container.addEventListener('click', function(e) {
      var t = e.target;

      // Phase-Button
      if (t.classList && t.classList.contains('rst-filter')) {
        _currentPhase = t.getAttribute('data-phase');
        var allBtns = container.querySelectorAll('.rst-filter');
        for (var i = 0; i < allBtns.length; i++) allBtns[i].classList.remove('rst-filter--active');
        t.classList.add('rst-filter--active');
        _renderCards(container);
        _syncCatChips(container);
        return;
      }

      // Kategorie-Chip (Filter-Leiste)
      if (t.classList && t.classList.contains('sight-chip')) {
        _currentCat = t.getAttribute('data-cat');
        _renderCards(container);
        _syncCatChips(container);
        return;
      }

      // Kategorie-Tag auf Card (klick = direkt filtern)
      if (t.classList && t.classList.contains('sight-cat--clickable')) {
        _currentCat = t.getAttribute('data-cat');
        _renderCards(container);
        _syncCatChips(container);
        return;
      }
    });
  }

  return {
    init: function() {
      if (!window.MEXIKO_OAXACA || !window.MEXIKO_OAXACA.sights) return;
      var el = document.getElementById('sights-content');
      if (!el) return;
      el.innerHTML = '';
      el.classList.remove('placeholder');
      _renderPhaseButtons(el);
      _renderCatChips(el);
      _renderCards(el);
      _bindEvents(el);
      console.log('[sights.js] initialisiert (' + window.MEXIKO_OAXACA.sights.length + ' Einträge)');
    }
  };

})();
