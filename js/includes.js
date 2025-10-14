;(function () {
  function insert(el, html) {
    var tmp = document.createElement('div')
    tmp.innerHTML = html
    var nodes = []
    while (tmp.firstChild) {
      nodes.push(tmp.firstChild)
      tmp.removeChild(tmp.firstChild)
    }
    if (nodes.length) el.replaceWith.apply(el, nodes)
    else el.remove()
  }

  function fallbackHeader() {
    return '<header class="site-header">\
      <div class="brand">RedefineIt</div>\
      <nav class="site-nav" aria-label="Primary">\
        <a href="index.html" data-nav-to="index.html">Home</a>\
        <a href="about.html" data-nav-to="about.html">Exploring AI</a>\
        <a href="games.html" data-nav-to="games.html">Games</a>\
        <a href="kinetic-art.html" data-nav-to="kinetic-art.html">Kinetic Art</a>\
        <a href="blogs.html" data-nav-to="blogs.html">Blogs</a>\
        <a href="photography.html" data-nav-to="photography.html">Photography</a>\
        <a href="app-experiments.html" data-nav-to="app-experiments.html">App Experiments</a>\
      </nav>\
      <div class="spacer">\
        <button id="toggleEye" class="nav-eye" aria-label="Toggle content visibility" title="Toggle content">\
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">\
            <path fill="currentColor" d=\"M12 5c5.5 0 9.5 4.5 10.5 6-.9 1.3-4.8 6-10.5 6S2.5 12.3 1.5 11C2.5 9.5 6.5 5 12 5zm0 2C7.9 7 4.7 10.2 3.3 11 4.7 11.8 7.9 15 12 15s7.3-3.2 8.7-4c-1.4-.8-4.6-4-8.7-4zm0 2.5A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5zm0 2A1.5 1.5 0 1 0 13.5 13 1.5 1.5 0 0 0 12 11.5z\"/>\
          </svg>\
        </button>\
      </div>\
    </header>'
  }

  function fallbackFooter() {
    return '<footer class="site-footer"><div>© RedefineIt / Christopher Vaught</div></footer>'
  }

  function loadIncludes() {
    var nodes = document.querySelectorAll('[data-include]')
    nodes.forEach(function (el) {
      var src = el.getAttribute('data-include')
      if (!src) return
      fetch(src, { credentials: 'same-origin' })
        .then(function (r) { return r.text() })
        .then(function (html) { insert(el, html) })
        .catch(function () {
          if (src.indexOf('header.html') !== -1) insert(el, fallbackHeader())
          else if (src.indexOf('footer.html') !== -1) insert(el, fallbackFooter())
          else el.remove()
        })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadIncludes)
  } else {
    loadIncludes()
  }
})()
