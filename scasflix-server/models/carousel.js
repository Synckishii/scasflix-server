/**
 * carousel.js
 * SCASFLIX - Hero Carousel Logic
 */

(function () {
  const TOTAL      = 5;
  let   current    = 0;
  let   autoTimer  = null;

  function slides() { return document.querySelectorAll('.hero-slide'); }
  function dots()   { return document.querySelectorAll('.hero-dot'); }

  function goSlide(idx) {
    slides().forEach((s, i) => s.classList.toggle('active', i === idx));
    dots().forEach((d, i)   => d.classList.toggle('active', i === idx));
    current = idx;
  }

  function next() { goSlide((current + 1) % TOTAL); }
  function prev() { goSlide((current - 1 + TOTAL) % TOTAL); }

  function resetTimer() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, 6000);
  }

  // Public API attached to window so inline onclick handlers work
  window.carouselNext   = function () { next(); resetTimer(); };
  window.carouselPrev   = function () { prev(); resetTimer(); };
  window.carouselGoSlide = function (idx) { goSlide(idx); resetTimer(); };

  // Boot
  document.addEventListener('DOMContentLoaded', function () {
    goSlide(0);
    resetTimer();
  });
})();
