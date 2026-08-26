(function () {
  var header = document.getElementById('site-header');
  if (!header) return;
  var lastY = window.scrollY;
  var hidden = false;
  var threshold = 8;

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    var delta = y - lastY;

    if (Math.abs(delta) < threshold) return;

    if (delta > 0 && y > header.offsetHeight) {
      if (!hidden) {
        header.style.transform = 'translateY(-100%)';
        hidden = true;
      }
    } else {
      if (hidden) {
        header.style.transform = 'translateY(0)';
        hidden = false;
      }
    }
    lastY = y;
  }, { passive: true });
})();
