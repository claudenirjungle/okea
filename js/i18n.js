/**
 * i18n client-side da ÓKEA.
 * O HTML é servido sempre em pt-BR (base "assada"). Este script troca os textos
 * no navegador a partir de window.OKEA_I18N (gerado de resources/lang/*) e guarda
 * a escolha em localStorage. Funciona em hospedagem estática (GitHub Pages) e no
 * cPanel, sem depender de PHP/sessão.
 *
 * Estratégia: sempre reaplica a partir da base pt-BR. Ao trocar de idioma,
 * salva no localStorage e recarrega a página (o servidor sempre devolve pt-BR;
 * o JS converte para o idioma escolhido após o load).
 */
(function () {
  'use strict';

  var LANGS = ['pt-BR', 'en', 'es'];
  var STORE = 'okea_lang';

  function getLang() {
    // Páginas que devem ficar sempre em pt-BR (ex.: landing page da Febratex).
    if (window.OKEA_FORCE_PT) return 'pt-BR';
    var l = localStorage.getItem(STORE);
    return LANGS.indexOf(l) >= 0 ? l : 'pt-BR';
  }

  function normPlain(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  // Títulos com HTML (<b>, <span class="o">, ...): casa pelo texto puro do elemento
  // e substitui o innerHTML inteiro pela versão traduzida.
  function applyHtml(lang) {
    var dict = window.OKEA_I18N && window.OKEA_I18N.html;
    if (!dict) return;
    var els = document.querySelectorAll(
      'h1,h2,h3,h4,h5,h6,p,span,a,li,button,label,strong,b,em,small,figcaption,blockquote'
    );
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = normPlain(el.textContent);
      if (!key) continue;
      var entry = dict[key];
      if (entry && entry[lang]) {
        el.innerHTML = entry[lang];
      }
    }
  }

  // Textos simples: percorre os nós de texto e troca por correspondência exata.
  function applyText(lang) {
    var dict = window.OKEA_I18N && window.OKEA_I18N.text;
    if (!dict) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var raw = node.nodeValue;
      var key = raw.trim();
      if (!key) continue;
      var entry = dict[key];
      if (entry && entry[lang]) {
        node.nodeValue = raw.replace(key, entry[lang]);
      }
    }
  }

  function markSelected(lang) {
    var btns = document.querySelectorAll('.btn-lang');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.value === lang) b.classList.add('selected');
      else b.classList.remove('selected');
    }
  }

  function translate(lang) {
    if (lang !== 'pt-BR') {
      applyHtml(lang);
      applyText(lang);
    }
    markSelected(lang);
    document.documentElement.setAttribute('lang', lang === 'pt-BR' ? 'pt-br' : lang);
  }

  function wireButtons() {
    // intercepta o clique nos botões de idioma e o submit do form
    // (o POST /language-switch só funciona no servidor PHP, não no Pages).
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.btn-lang') : null;
      if (!btn) return;
      e.preventDefault();
      var lang = btn.value;
      if (LANGS.indexOf(lang) < 0) return;
      if (lang === getLang()) return;
      localStorage.setItem(STORE, lang);
      location.reload();
    });
    var forms = document.querySelectorAll('form[action$="language-switch"]');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function (e) { e.preventDefault(); });
    }
  }

  function init() {
    translate(getLang());
    wireButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
