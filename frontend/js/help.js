// Globo de ayuda compartido (mapa y laboratorio Monte Carlo).
// Cualquier elemento con data-help="<texto/HTML estático>" lo muestra con hover o foco;
// los botones .help-dot también con toque (móvil). Escape, scroll o tocar fuera lo cierran.
(function initHelp() {
  const pop = document.createElement('div');
  pop.id = 'help-pop';
  pop.setAttribute('role', 'tooltip');
  document.body.appendChild(pop);
  let popFor = null;

  function show(el) {
    popFor = el;
    pop.innerHTML = el.dataset.help;  // solo textos estáticos definidos en el propio código
    pop.classList.add('show');
    const r = el.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8) + 'px';
    pop.style.top = (r.bottom + h + 12 > innerHeight ? r.top - h - 8 : r.bottom + 8) + 'px';
  }
  function hide() { popFor = null; pop.classList.remove('show'); }

  document.addEventListener('mouseover', e => { const el = e.target.closest('[data-help]'); if (el && el !== popFor) show(el); });
  document.addEventListener('mouseout', e => { const el = e.target.closest('[data-help]'); if (el && !el.contains(e.relatedTarget)) hide(); });
  document.addEventListener('focusin', e => { const el = e.target.closest('[data-help]'); if (el) show(el); });
  document.addEventListener('focusout', hide);
  document.addEventListener('click', e => {
    const dot = e.target.closest('.help-dot');
    if (dot) { e.stopPropagation(); return show(dot); }  // el foco ya pudo abrirlo: el clic nunca lo cierra
    if (!e.target.closest('[data-help]')) hide();
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  addEventListener('scroll', hide, { passive: true, capture: true });
})();
