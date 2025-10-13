;(function () {
  var home = 'index.html'
  var order = ['about.html', 'games.html', 'kinetic-art.html', 'blogs.html', 'photography.html']

  function filename(path) {
    if (!path) return ''
    var parts = path.split('/')
    var last = parts[parts.length - 1]
    return last === '' ? 'index.html' : last
  }

  var current = filename(window.location.pathname)
  // Build a full cycle that includes Home as the first element
  var cycle = [home].concat(order)
  var idx = cycle.indexOf(current)
  if (idx === -1) idx = 0
  var next = cycle[(idx + 1) % cycle.length]
  var prev = cycle[(idx - 1 + cycle.length) % cycle.length]

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Theme map for starspinner per page
  function getThemeFor(path) {
    var map = {
      'index.html': { lineColor: 'rgba(140, 200, 255, 0.9)', trail: 0.22, glow: 22 },
      'about.html': { lineColor: 'rgba(159, 214, 255, 0.9)', trail: 0.23, glow: 20 },
      'games.html': { lineColor: 'rgba(255, 204, 136, 0.95)', trail: 0.20, glow: 26 },
      'kinetic-art.html': { lineColor: 'rgba(202, 169, 255, 0.95)', trail: 0.25, glow: 24 },
      'blogs.html': { lineColor: 'rgba(139, 255, 196, 0.9)', trail: 0.23, glow: 20 },
      'photography.html': { lineColor: 'rgba(255, 176, 208, 0.95)', trail: 0.21, glow: 24 }
    }
    return map[path] || map['index.html']
  }

  // Preload hint for next/prev HTML
  function prefetchLinks() {
    try {
      var l1 = document.createElement('link')
      l1.rel = 'prefetch'
      l1.href = next
      document.head.appendChild(l1)
      var l2 = document.createElement('link')
      l2.rel = 'prefetch'
      l2.href = prev
      document.head.appendChild(l2)
    } catch (e) {}
  }
  prefetchLinks()

  // Utility: update cycle given a current path
  function recalcCycle(curr) {
    current = filename(curr)
    idx = cycle.indexOf(current)
    if (idx === -1) idx = 0
    next = cycle[(idx + 1) % cycle.length]
    prev = cycle[(idx - 1 + cycle.length) % cycle.length]
  }

  function swapContent(newHTML, dir) {
    var content = document.querySelector('.content')
    if (!content) return
    var outClass = dir === 'right' ? 'slide-out' : 'slide-out-right'
    content.classList.add(outClass)
    window.setTimeout(function () {
      content.classList.remove(outClass)
      content.innerHTML = newHTML
      try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch (e) { window.scrollTo(0, 0) }
      var preClass = dir === 'right' ? 'pre-enter-from-right' : 'pre-enter-from-left'
      content.classList.add(preClass)
      // Next frame: remove pre-enter to slide in
      requestAnimationFrame(function () {
        content.classList.remove(preClass)
      })
    }, 240)
  }

  function fetchPage(path) {
    return fetch(path, { credentials: 'same-origin' })
      .then(function (r) { return r.text() })
      .then(function (html) {
        var parser = new DOMParser()
        var doc = parser.parseFromString(html, 'text/html')
        var contentEl = doc.querySelector('.content')
        var titleEl = doc.querySelector('title')
        return {
          html: contentEl ? contentEl.innerHTML : '',
          title: titleEl ? titleEl.textContent : document.title
        }
      })
  }

  function performTransition(dir, path) {
    // SPA swap: only move content, keep background in place
    if (reduceMotion) {
      window.location.href = path
      return
    }
    fetchPage(path)
      .then(function (res) {
        // Update title and URL
        try { document.title = res.title } catch (e) {}
        try { history.pushState({ path: path }, res.title, path) } catch (e) {}
        // Update starspinner theme subtly
        try { if (window.updateStarspinner) window.updateStarspinner(getThemeFor(filename(path))) } catch (e) {}
        swapContent(res.html, dir)
        recalcCycle(path)
        // Prefetch neighbors for snappier nav
        prefetchLinks()
      })
      .catch(function () {
        // Fallback to hard navigation if fetch fails
        window.location.href = path
      })
  }

  // Apply enter animation based on last direction
  (function applyEnter() {
    // No-op on SPA; content is already on screen
  })()

  var right = document.getElementById('slideArrow')
  var left = document.getElementById('slideArrowLeft')
  if (right) right.addEventListener('click', function () { performTransition('right', next) })
  if (left) left.addEventListener('click', function () { performTransition('left', prev) })

  // Optional: keyboard navigation
  window.addEventListener('keydown', function (e) {
    if (e.defaultPrevented) return
    var tag = (e.target && e.target.tagName) || ''
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      performTransition('right', next)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      performTransition('left', prev)
    }
  })

  // Handle back/forward
  window.addEventListener('popstate', function (e) {
    var path = (e && e.state && e.state.path) || window.location.pathname
    // Direction heuristic: if new index greater, assume right; else left
    var oldIdx = idx
    recalcCycle(path)
    var dir = idx >= oldIdx ? 'right' : 'left'
    fetchPage(path)
      .then(function (res) {
        try { document.title = res.title } catch (err) {}
        try { if (window.updateStarspinner) window.updateStarspinner(getThemeFor(filename(path))) } catch (err) {}
        swapContent(res.html, dir)
      })
      .catch(function () { /* ignore */ })
  })

  // Header nav: intercept clicks on data-nav-to
  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest && e.target.closest('a[data-nav-to]')
    if (!link) return
    var to = link.getAttribute('data-nav-to')
    if (!to) return
    e.preventDefault()
    performTransition('right', to)
  })
})()
