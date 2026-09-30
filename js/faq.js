// js/faq.js
// Mexiko Reise-Dashboard — FAQ Checkliste (read-only)
// FAQ-Status hier ändern: data.js faq[].status = "open" | "resolved"

window.faqModule = (function() {
  'use strict';

  function _makeFaqItem(q) {
    var statusIcon  = q.status === 'resolved' ? '&#x1F7E2;' : '&#x1F534;';
    var statusLabel = q.status === 'resolved' ? 'Gekl&#xE4;rt' : 'Offen';
    var priorityClass = 'faq-priority faq-priority--' + q.priority;

    var header = '<div class="faq-header">'
      + '<span class="faq-status-icon">' + statusIcon + '</span>'
      + '<span class="faq-status-label">' + statusLabel + '</span>'
      + '<span class="' + priorityClass + '">' + q.priority + '</span>'
      + '</div>';

    var question = '<div class="faq-question">' + q.question + '</div>';

    var tip = '';
    if (q.tip) { tip = '<div class="faq-tip">&#x1F4A1; ' + q.tip + '</div>'; }

    var answer = '';
    if (q.answer !== null && q.answer !== undefined) {
      answer = '<div class="faq-answer">&#x2714; ' + q.answer + '</div>';
    }

    return '<div class="faq-item faq-item--' + q.status + '">'
      + header + question + tip + answer
      + '</div>';
  }

  function _render(container) {
    var items = window.MEXIKO_OAXACA.faq;
    var html = '<div class="faq-list">';
    for (var i = 0; i < items.length; i++) { html += _makeFaqItem(items[i]); }
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  return {
    init: function() {
      if (!window.MEXIKO_OAXACA || !window.MEXIKO_OAXACA.faq) return;
      var el = document.getElementById('faq-content');
      if (!el) return;
      el.innerHTML = '';
      _render(el);
      console.log('[faq.js] initialisiert (' + window.MEXIKO_OAXACA.faq.length + ' Fragen)');
    }
  };

})();
