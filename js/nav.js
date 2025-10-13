;(function () {
  var home = 'index.html'
  var order = ['about.html', 'games.html', 'kinetic-art.html', 'blogs.html', 'photography.html', 'app-experiments.html']

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
      'photography.html': { lineColor: 'rgba(255, 176, 208, 0.95)', trail: 0.21, glow: 24 },
      'app-experiments.html': { lineColor: 'rgba(64, 255, 240, 0.95)', trail: 0.22, glow: 24 },
      // Blog posts (stark contrasting themes)
      'fibonacci-flow.html': { lineColor: 'rgba(255, 96, 96, 0.98)', trail: 0.18, glow: 28 },
      'sound-experiment.html': { lineColor: 'rgba(208, 255, 82, 0.98)', trail: 0.20, glow: 26 }
    }
    // Route blog posts to the blogs theme
    if (/^blog\//.test(path)) return map['blogs.html']
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
      // Notify listeners that content has been replaced (for dynamic init)
      try { document.dispatchEvent(new CustomEvent('ri:content-updated')) } catch (e) {}
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
        // Update starspinner theme (reset to avoid lingering trails)
        try { if (window.updateStarspinner) window.updateStarspinner(getThemeFor(filename(path)), { reset: true }) } catch (e) {}
        swapContent(res.html, dir)
        recalcCycle(path)
        // Initialize dynamic enhancements (e.g., photo gallery) after swap
        try { initDynamicEnhancements() } catch (e) {}
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
        try { if (window.updateStarspinner) window.updateStarspinner(getThemeFor(filename(path)), { reset: true }) } catch (err) {}
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

  // --- Dynamic enhancements (photography gallery & lightbox) ---
  function ensureLightbox() {
    var lb = document.getElementById('lightbox')
    if (lb) return lb
    lb = document.createElement('div')
    lb.id = 'lightbox'
    lb.className = 'lightbox'
    lb.setAttribute('aria-hidden', 'true')
    lb.setAttribute('role', 'dialog')
    lb.setAttribute('aria-modal', 'true')
    lb.innerHTML = '<div class="lightbox-inner">\
      <img id="lightboxImg" class="lightbox-img enter" alt="Expanded photograph" />\
      <div id="lightboxCaption" class="lightbox-caption"></div>\
    </div>\
    <button id="lbPrev" class="lb-btn lb-prev" aria-label="Previous">&#x2039;</button>\
    <button id="lbNext" class="lb-btn lb-next" aria-label="Next">&#x203A;</button>\
    <button id="lbClose" class="lb-btn lb-close" aria-label="Close">&#x2715;</button>'
    document.body.appendChild(lb)
    return lb
  }

  function initPhotoGallery() {
    var grid = document.getElementById('photoGrid')
    if (!grid || grid.dataset.enhanced === '1') return
    var base = 'images/photography/'
    var items = []
    for (var i = 1; i <= 16; i++) items.push('image' + i + '.jpg')
    var placeholder = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">\n' +
      '<rect width="100%" height="100%" fill="#0f1622"/>\n' +
      '<text x="50%" y="50%" fill="#688" font-size="28" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif">No Image</text>\n' +
      '</svg>'
    )
    items.forEach(function (name, idx) {
      var a = document.createElement('a')
      a.className = 'photo-item'
      a.href = base + name
      a.rel = 'noopener'
      var img = document.createElement('img')
      img.alt = 'Photograph ' + (idx + 1)
      img.src = base + name
      img.onerror = function () { this.onerror = null; this.src = placeholder }
      a.appendChild(img)
      grid.appendChild(a)
    })
    grid.dataset.enhanced = '1'

    // Bind lightbox
    var lb = ensureLightbox()
    var lbImg = document.getElementById('lightboxImg')
    var caption = document.getElementById('lightboxCaption')
    var prevBtn = document.getElementById('lbPrev')
    var nextBtn = document.getElementById('lbNext')
    var closeBtn = document.getElementById('lbClose')
    var links = Array.prototype.slice.call(grid.querySelectorAll('a.photo-item'))
    var sources = links.map(function (a) { return a.getAttribute('href') })
    var idx = 0

    function preload(i) {
      var pre = new Image()
      pre.src = sources[(i + sources.length) % sources.length]
    }
    function show(i) {
      idx = (i + sources.length) % sources.length
      var src = sources[idx]
      var thumbImg = links[idx].querySelector('img')
      caption.textContent = (thumbImg && thumbImg.alt) || ''
      lbImg.classList.remove('showing')
      lbImg.classList.add('enter')
      requestAnimationFrame(function () {
        lbImg.onload = function () { lbImg.classList.add('showing'); lbImg.onload = null }
        lbImg.src = src
      })
      preload(idx + 1)
      preload(idx - 1)
    }
    function open(i) {
      show(i)
      lb.classList.add('show')
      lb.setAttribute('aria-hidden', 'false')
      try { document.body.style.overflow = 'hidden' } catch (e) {}
    }
    function close() {
      lb.classList.remove('show')
      lb.setAttribute('aria-hidden', 'true')
      try { document.body.style.overflow = '' } catch (e) {}
    }

    if (!grid.dataset.lbBound) {
      grid.addEventListener('click', function (e) {
        var a = e.target && e.target.closest && e.target.closest('a.photo-item')
        if (!a) return
        e.preventDefault()
        var i = links.indexOf(a)
        if (i === -1) i = 0
        open(i)
      })
      prevBtn.addEventListener('click', function () { show(idx - 1) })
      nextBtn.addEventListener('click', function () { show(idx + 1) })
      closeBtn.addEventListener('click', close)
      lb.addEventListener('click', function (e) { if (e.target === lb) close() })
      window.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('show')) return
        if (e.key === 'Escape') close()
        else if (e.key === 'ArrowRight') show(idx + 1)
        else if (e.key === 'ArrowLeft') show(idx - 1)
      })
      grid.dataset.lbBound = '1'
    }
  }

  function initDynamicEnhancements() {
    try { initPhotoGallery() } catch (e) {}
    try { initThumbnails() } catch (e) {}
    try { initBlogListing() } catch (e) {}
  }

  // Initial pass on first load
  try { initDynamicEnhancements() } catch (e) {}

  // When starspinner first becomes ready, set it to the current page theme
  window.addEventListener('starspinner:ready', function () {
    try { if (window.updateStarspinner) window.updateStarspinner(getThemeFor(current), { reset: true }) } catch (e) {}
  })

  // Re-run enhancements after SPA content swaps
  document.addEventListener('ri:content-updated', function () {
    try { initDynamicEnhancements() } catch (e) {}
  })

  // Replace card thumbs with global thumbnails named after destination folder
  function initThumbnails() {
    var anchors = document.querySelectorAll('.card a.thumb')
    if (!anchors || !anchors.length) return
    var placeholder = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">\n' +
      '<rect width="100%" height="100%" fill="#0f1622"/>\n' +
      '<text x="50%" y="50%" fill="#688" font-size="24" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif">No Thumbnail</text>\n' +
      '</svg>'
    )
    anchors.forEach(function (a) {
      var img = a.querySelector('img')
      if (!img) return
      var original = img.getAttribute('src') || ''
      if (!img.dataset.fallback) img.dataset.fallback = original
      var href = a.getAttribute('href') || ''
      // Compute folder name from href, ignoring common build folders
      var parts = href.split('/').filter(Boolean)
      var ignore = { 'index.html': 1, 'dist': 1 }
      var folder = ''
      for (var i = parts.length - 1; i >= 0; i--) {
        if (!ignore[parts[i]]) { folder = parts[i]; break }
      }
      if (!folder && parts.length) folder = parts[0]
      if (!folder) return
      var thumb = '/images/thumbnails/' + folder + '.png'
      if (img.src !== thumb) {
        img.onerror = function () {
          this.onerror = null
          var fb = this.dataset.fallback
          this.src = fb || placeholder
        }
        img.src = thumb
      }
    })
  }

  // Dynamically render blog listing from JSON manifest
  function initBlogListing() {
    var list = document.getElementById('blogList')
    if (!list || list.dataset.loaded === '1') return
    var placeholder = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">\n' +
      '<rect width="100%" height="100%" fill="#0f1622"/>\n' +
      '<text x="50%" y="50%" fill="#688" font-size="24" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif">No Cover</text>\n' +
      '</svg>'
    )
    fetch('blog/posts.json', { credentials: 'same-origin' })
      .then(function (r) { return r.json() })
      .then(function (data) {
        try { list.innerHTML = '' } catch (e) {}
        var posts = (data && data.posts) || []
        posts.sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') })
        posts.forEach(function (p) {
          var slug = p.slug || ''
          var url = 'blog/' + slug + '.html'
          var cover = p.cover || ''
          var title = p.title || slug
          var date = p.date || ''
          var read = p.readTime ? (p.readTime + ' min read') : ''
          var excerpt = p.excerpt || ''
          var tags = Array.isArray(p.tags) ? p.tags : []

          var article = document.createElement('article')
          article.className = 'panel blog-post'

          var h2 = document.createElement('h2')
          h2.className = 'post-title'
          var aTitle = document.createElement('a')
          aTitle.href = url
          aTitle.textContent = title
          h2.appendChild(aTitle)
          article.appendChild(h2)

          var meta = document.createElement('div')
          meta.className = 'post-meta'
          var dateText = ''
          try { dateText = new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) } catch (e) {}
          meta.textContent = [dateText, read].filter(Boolean).join(' • ')
          article.appendChild(meta)

          var aCover = document.createElement('a')
          aCover.className = 'post-cover'
          aCover.href = url
          var img = document.createElement('img')
          img.alt = (p.coverAlt || (title + ' cover'))
          img.src = cover
          img.onerror = function () { this.onerror = null; this.src = placeholder }
          aCover.appendChild(img)
          article.appendChild(aCover)

          if (excerpt) {
            var pex = document.createElement('p')
            pex.textContent = excerpt
            article.appendChild(pex)
          }

          if (tags.length) {
            var tagWrap = document.createElement('div')
            tagWrap.className = 'post-tags'
            tags.forEach(function (t) {
              var span = document.createElement('span')
              span.className = 'post-tag'
              span.textContent = t
              tagWrap.appendChild(span)
            })
            article.appendChild(tagWrap)
          }

          var note = document.createElement('p')
          note.className = 'note'
          var more = document.createElement('a')
          more.href = url
          more.textContent = 'Full post'
          note.appendChild(document.createTextNode('Read more: '))
          note.appendChild(more)
          article.appendChild(note)

          list.appendChild(article)
        })
        list.dataset.loaded = '1'
        var fallback = document.getElementById('blogStatic')
        if (fallback) fallback.style.display = 'none'
      })
      .catch(function () { /* leave static fallback if present */ })
  }
})()
