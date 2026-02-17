/**
 * Shared – navigation (hamburger, layer nav)
 */
(function() {
  'use strict';

  function initNav() {
    var hamburger = document.getElementById('hamburger');
    var layerNav = document.querySelector('.layer-nav');
    var navLinks = document.querySelectorAll('.layer-nav a');
    var overlay = null;
    function setExpanded(open) {
      if (hamburger) hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function closeNav() {
      document.body.classList.remove('nav-open');
      setExpanded(false);
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
    }
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.addEventListener('click', function() {
        var open = !document.body.classList.contains('nav-open');
        document.body.classList.toggle('nav-open');
        setExpanded(open);
        if (open) {
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.setAttribute('class', 'nav-overlay');
            overlay.setAttribute('aria-hidden', 'true');
            overlay.addEventListener('click', closeNav);
          }
          if (overlay.parentNode !== document.body) document.body.appendChild(overlay);
        } else {
          closeNav();
        }
      });
    }
    navLinks.forEach(function(link) {
      link.addEventListener('click', closeNav);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
