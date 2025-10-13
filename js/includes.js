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
      <div class="spacer"></div>\
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
