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

  function initHomeTeamCarousel() {
    var carousel = document.querySelector('[data-team-carousel]');
    if (!carousel) return;

    var track = carousel.querySelector('[data-carousel-track]');
    var prevButton = carousel.querySelector('[data-carousel-prev]');
    var nextButton = carousel.querySelector('[data-carousel-next]');
    var status = carousel.querySelector('[data-carousel-status]');
    var dotsContainer = carousel.querySelector('[data-carousel-dots]');
    if (!track || !prevButton || !nextButton || !status || !dotsContainer) return;

    var slides = track.querySelectorAll('.home-team-slide');
    if (!slides.length) return;

    var currentIndex = 0;
    var slideCount = slides.length;
    var dots = [];
    var visibleSlides = 1;
    var maxIndex = 0;

    function getVisibleSlides() {
      return window.matchMedia('(max-width: 768px)').matches ? 1 : 2;
    }

    function getMaxIndex() {
      return Math.max(0, slideCount - visibleSlides);
    }

    function updateLayoutState() {
      visibleSlides = getVisibleSlides();
      maxIndex = getMaxIndex();
      if (currentIndex > maxIndex) currentIndex = maxIndex;
    }

    function clampIndex(index) {
      if (index < 0) return maxIndex;
      if (index > maxIndex) return 0;
      return index;
    }

    function buildDots() {
      dotsContainer.innerHTML = '';
      dots = [];
      var totalSteps = maxIndex + 1;
      for (var i = 0; i < totalSteps; i += 1) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'home-team-dot';
        dot.setAttribute('aria-label', 'Go to carousel position ' + (i + 1));
        (function(index) {
          dot.addEventListener('click', function() {
            currentIndex = index;
            render();
          });
        })(i);
        dotsContainer.appendChild(dot);
        dots.push(dot);
      }
    }

    function render() {
      track.style.transform = 'translateX(-' + (currentIndex * (100 / visibleSlides)) + '%)';
      if (visibleSlides === 1) {
        status.textContent = (currentIndex + 1) + ' / ' + slideCount;
      } else {
        status.textContent = (currentIndex + 1) + '-' + (currentIndex + visibleSlides) + ' / ' + slideCount;
      }
      dots.forEach(function(dot, index) {
        dot.classList.toggle('is-active', index === currentIndex);
        dot.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
      });
    }

    prevButton.addEventListener('click', function() {
      currentIndex = clampIndex(currentIndex - 1);
      render();
    });

    nextButton.addEventListener('click', function() {
      currentIndex = clampIndex(currentIndex + 1);
      render();
    });

    window.addEventListener('resize', function() {
      var previousVisibleSlides = visibleSlides;
      updateLayoutState();
      if (previousVisibleSlides !== visibleSlides) {
        buildDots();
      }
      render();
    });

    updateLayoutState();
    buildDots();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initNav();
      initHomeTeamCarousel();
    });
  } else {
    initNav();
    initHomeTeamCarousel();
  }
})();
