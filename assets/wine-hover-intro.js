document.addEventListener('DOMContentLoaded', function () {
  var sections = document.querySelectorAll('.wine-hover-section');

  sections.forEach(function (section) {
    var bottle = section.querySelector('.wine-hover-bottle');
    var words = section.querySelectorAll('.wine-hover-word');
    if (!bottle || !words.length) return;

    words.forEach(function (word) {
      var img = word.getAttribute('data-image');

      word.addEventListener('mouseenter', function () { 
        if (!img) return;
        bottle.src = img;
        bottle.classList.add('is-visible');
      });

      word.addEventListener('mousemove', function (e) {
        bottle.style.left = e.clientX + 'px';
        bottle.style.top = e.clientY + 'px';
      });

      word.addEventListener('mouseleave', function () {
        bottle.classList.remove('is-visible');
      });

      // Prevent click navigating if there's no real link set
      word.addEventListener('click', function (e) {
        if (!word.getAttribute('href') || word.getAttribute('href') === '#') {
          e.preventDefault();
        }
      });
    });
  });
});
