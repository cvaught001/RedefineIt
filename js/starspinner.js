;(function (global) {
  function initStarspinner(target, opts) {
    var canvas = typeof target === 'string' ? document.querySelector(target) : target
    if (!canvas) return { stop: function () {} }
    var ctx = canvas.getContext('2d')
    var dpr = function () { return window.devicePixelRatio || 1 }
    function resize() {
      var d = dpr()
      canvas.width = Math.floor(innerWidth * d)
      canvas.height = Math.floor(innerHeight * d)
      ctx.setTransform(d, 0, 0, d, 0, 0)
    }
    window.addEventListener('resize', resize)
    resize()

    var time = 0
    var rot = 0
    var settings = Object.assign(
      {
        numShapes: 12,
        spacing: 70,
        frequency: 5,
        resonance: 36,
        modulation: 18,
        lineColor: 'rgba(140,220,255,0.9)',
        trail: 0.2,
        glow: 20,
        lineWidth: 1.2,
        rotSpeed: 0.03,
        jiggle: 8
      },
      opts || {}
    )

    function drawWave(cx, cy, baseRadius, timeOffset, rotOffset) {
      var numPoints = 280
      var amplitude =
        settings.resonance + Math.sin((time + timeOffset) * 0.1) * settings.modulation
      ctx.beginPath()
      for (var i = 0; i <= numPoints; i++) {
        var frac = i / numPoints
        var theta = frac * Math.PI * 2
        var wave = Math.sin(settings.frequency * theta + time + timeOffset) * amplitude
        var jiggle = Math.sin(time * 2 + i * 0.45) * settings.jiggle
        var r = baseRadius + wave + jiggle
        var thetaRot = theta + rot + rotOffset
        var x = cx + Math.cos(thetaRot) * r
        var y = cy + Math.sin(thetaRot) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.lineWidth = settings.lineWidth
      ctx.strokeStyle = settings.lineColor
      ctx.shadowColor = settings.lineColor
      ctx.shadowBlur = settings.glow
      ctx.stroke()
    }

    var rafId
    function loop() {
      ctx.fillStyle = 'rgba(0,0,0,' + (1 - settings.trail) + ')'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      var cx = innerWidth / 2
      var cy = innerHeight / 2
      for (var i = 0; i < settings.numShapes; i++) {
        var baseRadius = 40 + i * settings.spacing
        var timeOffset = i * 36
        var rotOffset = i * 0.28
        drawWave(cx, cy, baseRadius, timeOffset, rotOffset)
      }
      time += 0.14
      rot += settings.rotSpeed
      rafId = requestAnimationFrame(loop)
    }
    loop()

    return {
      stop: function () {
        if (rafId) cancelAnimationFrame(rafId)
        window.removeEventListener('resize', resize)
      }
    }
  }

  global.initStarspinner = initStarspinner
})(window)

