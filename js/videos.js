// js/videos.js
// YouTube-Video-Grid mit Tab-Filter, Lazy-Load und Custom-Video-Eingabe (localStorage)
// ES5 — kein const/let, keine Arrow Functions, keine Template Literals

window.videosModule = (function () {
  'use strict';

  var _currentCat = 'alle';
  var LS_KEY = 'mexiko_custom_videos';

  // ── localStorage helpers ──────────────────────────────────────

  function _loadCustomVideos() {
    try {
      var stored = localStorage.getItem(LS_KEY);
      if (stored) { return JSON.parse(stored); }
    } catch (e) {}
    return [];
  }

  function _saveCustomVideo(video) {
    var videos = _loadCustomVideos();
    videos.push(video);
    localStorage.setItem(LS_KEY, JSON.stringify(videos));
  }

  function _deleteCustomVideo(youtubeId) {
    var videos = _loadCustomVideos().filter(function (v) {
      return v.youtubeId !== youtubeId;
    });
    localStorage.setItem(LS_KEY, JSON.stringify(videos));
  }

  function _getAllVideos() {
    return window.MEXIKO_OAXACA.videos.concat(_loadCustomVideos());
  }

  function _isCustom(youtubeId) {
    return _loadCustomVideos().some(function (v) {
      return v.youtubeId === youtubeId;
    });
  }

  function _extractYoutubeId(url) {
    var m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  // ── Categories ───────────────────────────────────────────────

  function _getCategories() {
    var cats = [];
    var videos = _getAllVideos();
    for (var i = 0; i < videos.length; i++) {
      var vcat = videos[i].category;
      if (vcat && cats.indexOf(vcat) === -1) { cats.push(vcat); }
    }
    return cats;
  }

  // ── Tabs ─────────────────────────────────────────────────────

  function _renderTabs(container) {
    var old = container.querySelector('.vid-tabs');
    if (old) { old.parentNode.removeChild(old); }
    var cats = _getCategories();
    var all = ['alle'].concat(cats);
    var html = '<div class="vid-tabs">';
    for (var i = 0; i < all.length; i++) {
      var cat = all[i];
      var active = cat === _currentCat ? ' vid-tab--active' : '';
      html += '<button class="vid-tab' + active + '" data-cat="' + cat + '">' + cat + '</button>';
    }
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  // ── Cards ────────────────────────────────────────────────────

  function _makeCard(video) {
    var isPlaceholder = video.youtubeId.indexOf('PLACEHOLDER') !== -1;
    var custom = _isCustom(video.youtubeId);
    var thumbHtml;
    if (isPlaceholder) {
      thumbHtml = '<div class="vid-thumb-placeholder"><span class="vid-placeholder-label">Noch kein Video gefunden</span></div>';
    } else {
      thumbHtml = '<img class="vid-thumb" src="https://img.youtube.com/vi/' + video.youtubeId + '/hqdefault.jpg" alt="' + video.title + '" loading="lazy" />';
    }
    var deleteBtn = custom
      ? '<button class="vid-delete-btn" data-delete-id="' + video.youtubeId + '" title="Video entfernen">\u00d7</button>'
      : '';
    return '<div class="vid-card' + (custom ? ' vid-card--custom' : '') + '" data-youtube-id="' + video.youtubeId + '">'
      + deleteBtn
      + '<div class="vid-thumb-wrap">'
      + thumbHtml
      + '<div class="vid-play-btn' + (isPlaceholder ? ' vid-play-btn--search' : '') + '" aria-label="' + (isPlaceholder ? 'Auf YouTube suchen' : 'Video abspielen') + '">'
      + (isPlaceholder ? '\uD83D\uDD0D auf YouTube suchen' : '\u25B6')
      + '</div>'
      + '</div>'
      + '<div class="vid-title">' + video.title + '</div>'
      + '</div>';
  }

  // ── Grid ─────────────────────────────────────────────────────

  function _renderGrid(container, cat) {
    var old = container.querySelector('.vid-grid');
    if (old) { old.parentNode.removeChild(old); }
    var videos = _getAllVideos();
    var filtered = [];
    for (var i = 0; i < videos.length; i++) {
      if (cat === 'alle' || videos[i].category === cat) { filtered.push(videos[i]); }
    }
    var html = '<div class="vid-grid">';
    for (var j = 0; j < filtered.length; j++) { html += _makeCard(filtered[j]); }
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  // ── Add-Form ─────────────────────────────────────────────────

  function _renderAddBtn(container) {
    var html = '<div class="vid-add-wrap">'
      + '<button class="vid-add-btn" id="vid-add-toggle">+ Video hinzuf\u00fcgen</button>'
      + '<div class="vid-add-form" id="vid-add-form" style="display:none">'
      + '<div class="vid-form-row">'
      + '<input class="vid-input" id="vid-url" type="text" placeholder="YouTube URL (z.B. https://youtube.com/watch?v=...)" />'
      + '</div>'
      + '<div class="vid-form-row">'
      + '<input class="vid-input" id="vid-title" type="text" placeholder="Titel" />'
      + '</div>'
      + '<div class="vid-form-row vid-form-row--split">'
      + '<select class="vid-input vid-select" id="vid-category">'
      + '<option value="kultur">Kultur</option>'
      + '<option value="natur">Natur</option>'
      + '<option value="food">Food</option>'
      + '<option value="familie">Familie</option>'
      + '<option value="strand">Strand</option>'
      + '</select>'
      + '<div class="vid-phase-checks">'
      + '<span class="vid-phase-label">Phasen:</span>'
      + '<label><input type="checkbox" class="vid-phase-cb" value="1"> CDMX</label>'
      + '<label><input type="checkbox" class="vid-phase-cb" value="2"> Oaxaca</label>'
      + '<label><input type="checkbox" class="vid-phase-cb" value="3"> Sierra Sur</label>'
      + '<label><input type="checkbox" class="vid-phase-cb" value="4"> Huatulco</label>'
      + '<label><input type="checkbox" class="vid-phase-cb" value="5"> Yucat\u00e1n</label>'
      + '<label><input type="checkbox" class="vid-phase-cb" value="6"> R\u00fcckreise</label>'
      + '</div>'
      + '</div>'
      + '<div class="vid-form-row vid-form-row--actions">'
      + '<button class="vid-save-btn" id="vid-save">Speichern</button>'
      + '<button class="vid-cancel-btn" id="vid-cancel">Abbrechen</button>'
      + '<span class="vid-feedback" id="vid-feedback"></span>'
      + '</div>'
      + '</div>'
      + '</div>';
    container.insertAdjacentHTML('afterbegin', html);
  }

  function _bindFormEvents(container) {
    var toggleBtn = document.getElementById('vid-add-toggle');
    var form      = document.getElementById('vid-add-form');
    var saveBtn   = document.getElementById('vid-save');
    var cancelBtn = document.getElementById('vid-cancel');
    if (!toggleBtn || !form) { return; }

    toggleBtn.addEventListener('click', function () {
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    cancelBtn.addEventListener('click', function () {
      form.style.display = 'none';
      _clearForm();
    });

    saveBtn.addEventListener('click', function () {
      var urlVal   = document.getElementById('vid-url').value.trim();
      var titleVal = document.getElementById('vid-title').value.trim();
      var catVal   = document.getElementById('vid-category').value;
      var cbs      = document.querySelectorAll('.vid-phase-cb:checked');
      var feedback = document.getElementById('vid-feedback');

      if (!urlVal || !titleVal) {
        feedback.textContent = 'URL und Titel sind Pflicht.';
        return;
      }
      var ytId = _extractYoutubeId(urlVal);
      if (!ytId) {
        feedback.textContent = 'Keine g\u00fcltige YouTube-URL.';
        return;
      }

      var phaseIds = [];
      Array.prototype.forEach.call(cbs, function (cb) {
        phaseIds.push(parseInt(cb.value, 10));
      });
      if (phaseIds.length === 0) { phaseIds = [2]; }

      _saveCustomVideo({
        id:        'custom-' + Date.now(),
        title:     titleVal,
        youtubeId: ytId,
        category:  catVal,
        phaseIds:  phaseIds
      });

      feedback.textContent = '\u2713 Gespeichert';
      setTimeout(function () { feedback.textContent = ''; }, 2000);
      _clearForm();
      form.style.display = 'none';
      _renderTabs(container);
      _renderGrid(container, _currentCat);
    });
  }

  function _clearForm() {
    var url      = document.getElementById('vid-url');
    var title    = document.getElementById('vid-title');
    var feedback = document.getElementById('vid-feedback');
    var cbs      = document.querySelectorAll('.vid-phase-cb');
    if (url)      { url.value = ''; }
    if (title)    { title.value = ''; }
    if (feedback) { feedback.textContent = ''; }
    Array.prototype.forEach.call(cbs, function (cb) { cb.checked = false; });
  }

  // ── Grid + Tab + Delete Events ────────────────────────────────

  function _bindEvents(container) {
    container.addEventListener('click', function (e) {

      var delBtn = e.target.closest('[data-delete-id]');
      if (delBtn) {
        _deleteCustomVideo(delBtn.getAttribute('data-delete-id'));
        _renderTabs(container);
        _renderGrid(container, _currentCat);
        return;
      }

      var tab = e.target.closest('.vid-tab');
      if (tab) {
        _currentCat = tab.getAttribute('data-cat');
        var allTabs = container.querySelectorAll('.vid-tab');
        Array.prototype.forEach.call(allTabs, function (t) { t.classList.remove('vid-tab--active'); });
        tab.classList.add('vid-tab--active');
        _renderGrid(container, _currentCat);
        return;
      }

      var card = e.target.closest('[data-youtube-id]');
      if (!card) { return; }
      var id = card.getAttribute('data-youtube-id');

      if (id.indexOf('PLACEHOLDER') !== -1) {
        var titleEl = card.querySelector('.vid-title');
        var q = titleEl ? titleEl.textContent.trim() : 'Mexiko Reise';
        window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), '_blank');
        return;
      }

      var wrap = card.querySelector('.vid-thumb-wrap');
      if (!wrap) { return; }
      wrap.innerHTML = '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" style="width:100%;height:100%;position:absolute;top:0;left:0"></iframe>';
    });
  }

  // ── Init ─────────────────────────────────────────────────────

  return {
    init: function () {
      if (!window.MEXIKO_OAXACA || !window.MEXIKO_OAXACA.videos) { return; }
      var el = document.getElementById('videos-content');
      if (!el) { return; }
      el.innerHTML = '';
      el.classList.remove('placeholder');
      _renderAddBtn(el);
      _renderTabs(el);
      _renderGrid(el, 'alle');
      _bindEvents(el);
      _bindFormEvents(el);
      console.log('[videos.js] initialisiert');
    }
  };
})();
