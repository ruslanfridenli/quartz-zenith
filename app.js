(() => {
  // main.ts
  var I18N = { "en": { "controls": "Controls", "params": "Parameters", "mode": "Field mode", "particles": "Particles", "speed": "Speed", "field scale": "Field scale", "trail fade": "Trail fade", "palette": "Palette", "seed": "Seed", "regen": "\u21BB Regenerate", "png": "\u2913 Export PNG" }, "de": { "controls": "Steuerung", "params": "Parameter", "mode": "Feldmodus", "particles": "Partikel", "speed": "Geschwindigkeit", "field scale": "Feldskalierung", "trail fade": "Nachleuchten", "palette": "Palette", "seed": "Seed", "regen": "\u21BB Neu generieren", "png": "\u2913 PNG exportieren" } };
  var lang = localStorage.getItem("lang") || "en";
  var t = (k) => I18N[lang][k] || k;
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i]").forEach((el) => el.textContent = t(el.dataset.i));
    document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
  }
  document.querySelectorAll(".lang button").forEach((b) => b.onclick = () => {
    lang = b.dataset.lang;
    localStorage.setItem("lang", lang);
    applyLang();
  });
  var PAL = [["#0b1020", "#4dd8ff", "#b18cff", "#ff6ec7", "#e8f6ff"], ["#07130d", "#8be28b", "#ffd479", "#4dd8ff", "#f0fff4"], ["#140b1e", "#ff9ecb", "#ffd479", "#8be28b", "#fbefff"], ["#0d0a14", "#c792ea", "#f78c6c", "#82aaff", "#efeaff"], ["#04121f", "#4dd8ff", "#8ecbff", "#ffd479", "#eaf7ff"], ["#1a0b12", "#ff8a80", "#ffd479", "#8be28b", "#fff0ee"], ["#081018", "#5eead4", "#a78bfa", "#f472b6", "#ecfeff"], ["#100c04", "#fbbf24", "#fb923c", "#fde68a", "#fff7ed"]];
  var cv = document.getElementById("cv");
  var ctx = cv.getContext("2d");
  var $ = (id) => document.getElementById(id);
  var W;
  var H;
  var raf;
  var pts = [];
  function rng(seed) {
    return function() {
      seed |= 0;
      seed = seed + 1831565813 | 0;
      let z = Math.imul(seed ^ seed >>> 15, 1 | seed);
      z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z;
      return ((z ^ z >>> 14) >>> 0) / 4294967296;
    };
  }
  function noise2(x, y, seed) {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    W = cv.width = r.width * devicePixelRatio;
    H = cv.height = r.height * devicePixelRatio;
  }
  addEventListener("resize", resize);
  resize();
  var palIdx = PAL.findIndex((p) => p[1] === "#4dd8ff");
  if (palIdx < 0) palIdx = 0;
  var palWrap = $("pals");
  PAL.forEach((p, i) => {
    const b = document.createElement("button");
    b.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + p[1] + ';margin-right:8px"></span>palette ' + (i + 1);
    b.onclick = () => {
      palIdx = i;
      paint();
    };
    palWrap.appendChild(b);
  });
  function init() {
    const r = rng(+$("seed").value || 1);
    pts = [];
    const n = +$("parts").value;
    for (let i = 0; i < n; i++) pts.push({ x: r() * W, y: r() * H, h: Math.floor(r() * 360) });
  }
  function fieldAngle(x, y, t2, mode, scale, seed) {
    const s = scale / 600;
    if (mode === "flow") {
      const a = noise2(x * s, y * s + t2 * 0.15, seed) * Math.PI * 4;
      return a;
    }
    if (mode === "vortex") {
      const dx = x - W / 2, dy = y - H / 2, d = Math.hypot(dx, dy) + 1;
      return Math.atan2(dy, dx) + Math.PI / 2 + t2 * 0.1;
    }
    if (mode === "spiral") {
      const dx = x - W / 2, dy = y - H / 2, d = Math.hypot(dx, dy) + 1;
      return Math.atan2(dy, dx) * 2 + d * 0.01 - t2 * 0.2;
    }
    return noise2(x * s * 3, y * s * 3, t2 * 0.4, seed) * Math.PI * 2;
  }
  var time = 0;
  function paint() {
    cancelAnimationFrame(raf);
    const bg = PAL[palIdx][0];
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const mode = $("mode").value, speed = +$("speed").value, scale = +$("scale").value, fade = +$("fade").value, seed = +$("seed").value || 1;
    function frame() {
      time += 8e-3 * speed;
      ctx.fillStyle = bg;
      ctx.globalAlpha = fade * 8;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      const pal = PAL[palIdx];
      for (const p of pts) {
        const a = fieldAngle(p.x, p.y, time, mode, scale, seed);
        p.x += Math.cos(a) * speed * 1.6;
        p.y += Math.sin(a) * speed * 1.6;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        const c = pal[Math.floor(p.x / W * pal.length + Math.random() * 0.9) % pal.length] || pal[1];
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(p.x, p.y, 1.4 * devicePixelRatio, 1.4 * devicePixelRatio);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    frame();
  }
  $("mode").value = "vortex";
  $("mode").onchange = () => {
    paint();
  };
  $("parts").oninput = () => {
    init();
  };
  $("speed").oninput = () => {
  };
  $("scale").oninput = () => {
  };
  $("fade").oninput = () => {
  };
  $("regen").onclick = () => {
    $("seed").value = Math.floor(Math.random() * 99999);
    init();
    paint();
  };
  $("dice").onclick = $("regen").onclick;
  $("seed").onchange = () => {
    init();
    paint();
  };
  $("png").onclick = () => {
    cancelAnimationFrame(raf);
    ctx.fillStyle = PAL[palIdx][0];
    const a = document.createElement("a");
    a.download = "flow-field-" + $("seed").value + ".png";
    a.href = cv.toDataURL("image/png");
    a.click();
    paint();
  };
  init();
  paint();
  applyLang();
})();
