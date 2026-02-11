/**
 * Shared – navigation (hamburger, layer nav)
 */
(function() {
  'use strict';

  function initNav() {
    var hamburger = document.getElementById('hamburger');
    var navLinks = document.querySelectorAll('.layer-nav a');
    if (hamburger) {
      hamburger.addEventListener('click', function() {
        document.body.classList.toggle('nav-open');
      });
    }
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        document.body.classList.remove('nav-open');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
