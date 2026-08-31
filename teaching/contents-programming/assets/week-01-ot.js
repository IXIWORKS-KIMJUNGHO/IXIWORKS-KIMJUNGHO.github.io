(() => {
  document.documentElement.classList.add("orientation-document");

  const navigation = document.querySelector("[data-orientation-toc]");
  if (!navigation) return;

  const links = Array.from(navigation.querySelectorAll('a[href^="#"]'));
  const entries = links
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const target = document.getElementById(id);
      return target ? { id, link, target } : null;
    })
    .filter(Boolean);

  if (entries.length === 0) return;

  let currentId = "";

  const setCurrent = (id, reveal = false) => {
    if (currentId === id) return;
    currentId = id;

    for (const entry of entries) {
      if (entry.id === id) {
        entry.link.setAttribute("aria-current", "location");
        if (reveal && matchMedia("(max-width: 980px)").matches) {
          entry.link.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      } else {
        entry.link.removeAttribute("aria-current");
      }
    }
  };

  const initialId = location.hash
    ? decodeURIComponent(location.hash.slice(1))
    : entries[0].id;
  setCurrent(entries.some((entry) => entry.id === initialId) ? initialId : entries[0].id);

  for (const entry of entries) {
    entry.link.addEventListener("click", () => setCurrent(entry.id, true));
  }

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (observedEntries) => {
      const visible = observedEntries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible[0]?.target.id) setCurrent(visible[0].target.id, true);
    },
    {
      rootMargin: "-18% 0px -70% 0px",
      threshold: [0, 1],
    },
  );

  for (const entry of entries) observer.observe(entry.target);
})();

(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function canvasBox(canvas) {
    const parent = canvas.parentElement;
    return Math.max(
      parent?.clientWidth || 0,
      canvas.getBoundingClientRect().width || 0,
      canvas.clientWidth || 0,
    );
  }

  function sizeCanvas(canvas, ratio) {
    const width = Math.max(canvasBox(canvas), 320);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextW = Math.round(width * dpr);
    const nextH = Math.round(width * ratio * dpr);
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW;
      canvas.height = nextH;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height: width * ratio };
  }

  function onSize(canvas, paint) {
    let last = -1;
    const run = () => {
      const width = Math.max(canvasBox(canvas), 320);
      if (width === last) return;
      last = width;
      paint();
    };
    run();
    const target = canvas.parentElement || canvas;
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(run).observe(target);
    } else {
      window.addEventListener("resize", run, { passive: true });
    }
    window.addEventListener("load", run);
  }

  function playWhileVisible(canvas, draw) {
    let playing = false;
    const loop = (now) => {
      if (!playing) return;
      draw(now);
      window.requestAnimationFrame(loop);
    };
    const start = () => {
      if (playing) return;
      playing = true;
      window.requestAnimationFrame(loop);
    };
    onSize(canvas, () => draw(performance.now()));
    if (reducedMotion) {
      draw(0);
      return;
    }
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) start();
        else playing = false;
      }, { threshold: 0.12 });
      observer.observe(canvas);
    } else {
      start();
    }
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const interruptions = document.querySelector("[data-interruptions-studio]");
  if (interruptions) {
    const rerun = document.querySelector("[data-interruptions-rerun]");
    let seed = (Math.random() * 0xffffffff) >>> 0;

    function drawInterruptions() {
      const random = mulberry32(seed);
      const { ctx, width, height } = sizeCanvas(interruptions, 1);
      const n = 32;
      const pad = width * 0.08;
      const span = Math.min(width, height) - pad * 2;
      const cell = span / n;
      const length = cell * 0.78;
      const originX = (width - span) / 2;
      const originY = (height - span) / 2;
      const holes = Array.from({ length: 4 }, () => ({
        x: 4 + random() * (n - 8),
        y: 4 + random() * (n - 8),
        r: 2.2 + random() * 3.4,
      }));

      ctx.fillStyle = "#fcfcf9";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#132c36";
      ctx.lineWidth = Math.max(1.15, cell * 0.09);
      ctx.lineCap = "butt";

      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) {
          if (
            holes.some((hole) => {
              const dx = j - hole.x;
              const dy = i - hole.y;
              return dx * dx + dy * dy < hole.r * hole.r;
            })
          ) {
            continue;
          }
          const cx = originX + (j + 0.5) * cell;
          const cy = originY + (i + 0.5) * cell;
          const angle = random() * Math.PI;
          const dx = Math.cos(angle) * length * 0.5;
          const dy = Math.sin(angle) * length * 0.5;
          ctx.beginPath();
          ctx.moveTo(cx - dx, cy - dy);
          ctx.lineTo(cx + dx, cy + dy);
          ctx.stroke();
        }
      }
    }

    onSize(interruptions, drawInterruptions);
    rerun?.addEventListener("click", () => {
      seed = (Math.random() * 0xffffffff) >>> 0;
      drawInterruptions();
    });
  }

  const datamatics = document.querySelector("[data-datamatics-studio]");
  if (datamatics) {
    let frame = 0;
    let playing = false;
    const bits = "0100110101101001011101000110000101110100011010010110001101110011";

    function drawDatamatics(time) {
      const { ctx, width, height } = sizeCanvas(datamatics, 9 / 16);
      const tick = Math.floor((time || 0) / 48);

      ctx.fillStyle = "#050607";
      ctx.fillRect(0, 0, width, height);

      const colW = Math.max(9, width / 80);
      const rowH = Math.max(11, height / 34);
      const cols = Math.ceil(width / colW);
      const rows = Math.ceil(height / rowH);

      ctx.textBaseline = "top";
      ctx.font = `${Math.max(10, Math.floor(rowH * 0.82))}px "IBM Plex Mono", ui-monospace, monospace`;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if ((col * 19 + row * 11 + tick) % 13 === 0) continue;
          const ch = bits[(col * 17 + row + tick) % bits.length];
          const hot = (col + tick * 2) % 31 === 0;
          ctx.fillStyle = hot ? "rgba(244, 246, 247, 0.96)" : "rgba(198, 214, 216, 0.78)";
          ctx.fillText(ch, col * colW + 1, row * rowH + 1);
        }
      }

      for (let i = 0; i < Math.ceil(height / 7); i += 1) {
        const y = ((i * 7 + frame * 1.15) % (height + 8)) - 4;
        const long = i % 8 === 0;
        ctx.strokeStyle = long ? "rgba(244, 246, 247, 0.42)" : "rgba(244, 246, 247, 0.14)";
        ctx.lineWidth = long ? 1.35 : 0.55;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width * (long ? 0.92 : 0.58 + ((i + tick) % 6) * 0.05), y);
        ctx.stroke();
      }

      const scanX = ((frame * 2.4) % width);
      ctx.fillStyle = "rgba(244, 246, 247, 0.05)";
      ctx.fillRect(scanX, 0, Math.max(28, width * 0.07), height);

      ctx.fillStyle = "rgba(244, 246, 247, 0.92)";
      for (let i = 0; i < 90; i += 1) {
        const x = (i * 41 + frame * 3) % width;
        const y = (i * 53 + frame) % height;
        ctx.fillRect(x, y, 1.25, (i % 10) + 3);
      }
    }

    function loop(now) {
      if (!playing) return;
      frame += 1;
      drawDatamatics(now);
      window.requestAnimationFrame(loop);
    }

    onSize(datamatics, () => drawDatamatics(performance.now()));

    if (reducedMotion) {
      drawDatamatics(0);
    } else if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !playing) {
          playing = true;
          window.requestAnimationFrame(loop);
        } else if (!visible) {
          playing = false;
        }
      }, { threshold: 0.12 });
      observer.observe(datamatics);
    } else {
      playing = true;
      window.requestAnimationFrame(loop);
    }
  }

  const flight = document.querySelector("[data-flight-studio]");
  if (flight) {
    let routes = [];
    let routeWidth = 0;

    function rebuildRoutes(width, height) {
      if (width === routeWidth && routes.length) return;
      routeWidth = width;
      const n = Math.round(52 + width / 28);
      routes = Array.from({ length: n }, (_, i) => ({
        y: height * (0.12 + ((i * 19) % 76) / 100),
        amp: height * (0.035 + (i % 5) * 0.01),
        speed: 0.016 + (i % 9) * 0.0035,
        phase: (i * 0.37) % 1,
        bend: (i % 2 === 0 ? 1 : -1) * (0.55 + (i % 4) * 0.14),
      }));
    }

    playWhileVisible(flight, (now) => {
      const { ctx, width, height } = sizeCanvas(flight, 9 / 16);
      rebuildRoutes(width, height);
      ctx.fillStyle = "#07080a";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(220, 230, 232, 0.055)";
      ctx.lineWidth = 1;
      for (let g = 1; g < 8; g += 1) {
        const x = (width * g) / 8;
        const y = (height * g) / 8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      const t = (now || 0) / 1000;
      ctx.lineCap = "round";
      for (const route of routes) {
        const x = ((route.phase + t * route.speed) % 1.25) - 0.12;
        ctx.strokeStyle = "rgba(214, 228, 232, 0.58)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let k = 26; k >= 0; k -= 1) {
          const xt = x - k * 0.01;
          const px = xt * width;
          const py = route.y + Math.sin(xt * Math.PI * route.bend + route.phase) * route.amp;
          if (k === 20) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        const px = x * width;
        const py = route.y + Math.sin(x * Math.PI * route.bend + route.phase) * route.amp;
        ctx.fillStyle = "rgba(244, 246, 247, 0.95)";
        ctx.fillRect(px - 1, py - 1, 2.2, 2.2);
      }
    });
  }

  const wind = document.querySelector("[data-wind-studio]");
  if (wind) {
    let particles = [];
    let particleWidth = 0;

    function rebuildParticles(width, height) {
      if (width === particleWidth && particles.length) return;
      particleWidth = width;
      const n = Math.round(width * 0.95);
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
      }));
    }

    function field(x, y, t) {
      return (
        Math.sin(x * 0.013 + t * 0.00032) +
        Math.cos(y * 0.015 - t * 0.00026) * 0.85 +
        Math.sin((x + y) * 0.007)
      );
    }

    playWhileVisible(wind, (now) => {
      const { ctx, width, height } = sizeCanvas(wind, 9 / 16);
      rebuildParticles(width, height);
      ctx.fillStyle = "#fcfcf9";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(19, 44, 54, 0.38)";
      ctx.lineWidth = 0.9;
      ctx.lineCap = "round";
      const t = now || 0;
      for (const particle of particles) {
        const angle = field(particle.x, particle.y, t);
        const dx = Math.cos(angle) * 8;
        const dy = Math.sin(angle) * 8;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x + dx, particle.y + dy);
        ctx.stroke();
        if (!reducedMotion) {
          particle.x += dx * 0.2;
          particle.y += dy * 0.2;
          if (particle.x < 0) particle.x = width;
          if (particle.x > width) particle.x = 0;
          if (particle.y < 0) particle.y = height;
          if (particle.y > height) particle.y = 0;
        }
      }
    });
  }

  const pulse = document.querySelector("[data-pulse-studio]");
  if (pulse) {
    const cols = 14;
    const rows = 8;
    const slots = cols * rows;
    const beats = Array(slots).fill(null);
    for (let i = 0; i < 36; i += 1) {
      beats[i] = { period: 600 + i * 29, phase: i * 0.33 };
    }

    function drawPulse(now) {
      const { ctx, width, height } = sizeCanvas(pulse, 9 / 16);
      ctx.fillStyle = "#0b0c0b";
      ctx.fillRect(0, 0, width, height);
      const padX = width * 0.055;
      const padY = height * 0.12;
      const cellW = (width - padX * 2) / cols;
      const cellH = (height - padY * 2) / rows;
      const radius = Math.min(cellW, cellH) * 0.26;
      const t = now || 0;
      for (let i = 0; i < slots; i += 1) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padX + (col + 0.5) * cellW;
        const y = padY + (row + 0.5) * cellH;
        const beat = beats[i];
        let glow = 0.11;
        if (beat) {
          glow = reducedMotion
            ? 0.68
            : 0.1 + Math.max(0, Math.sin((t / beat.period) * Math.PI * 2 + beat.phase)) * 0.9;
        }
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 214, 150, ${glow})`;
        ctx.fill();
      }
    }

    playWhileVisible(pulse, drawPulse);
    document.querySelector("[data-pulse-add]")?.addEventListener("click", () => {
      beats.pop();
      beats.unshift({ period: 540 + Math.random() * 420, phase: 0 });
      drawPulse(performance.now());
    });
  }

  const morellet = document.querySelector("[data-morellet-studio]");
  if (morellet) {
    const digits = "31415926535897932384626433832795028841971693993751";
    let offset = 0;

    function drawMorellet() {
      const { ctx, width, height } = sizeCanvas(morellet, 2 / 3);
      ctx.fillStyle = "#fcfcf9";
      ctx.fillRect(0, 0, width, height);
      const cols = 3;
      const rows = 2;
      const gap = Math.max(10, width * 0.02);
      const panel = Math.min((width - gap * (cols + 1)) / cols, (height - gap * (rows + 1)) / rows);
      const originX = (width - (panel * cols + gap * (cols - 1))) / 2;
      const originY = (height - (panel * rows + gap * (rows - 1))) / 2;
      ctx.strokeStyle = "#132c36";
      ctx.lineWidth = 1.2;
      for (let p = 0; p < 6; p += 1) {
        const col = p % cols;
        const row = Math.floor(p / cols);
        const px = originX + col * (panel + gap);
        const py = originY + row * (panel + gap);
        const cell = panel / 2;
        for (let i = 0; i < 4; i += 1) {
          const digit = Number(digits[(offset + p * 4 + i) % digits.length]);
          ctx.fillStyle = digit % 2 === 0 ? "#0d110e" : "#fcfcf9";
          ctx.fillRect(px + (i % 2) * cell, py + Math.floor(i / 2) * cell, cell, cell);
        }
        ctx.strokeRect(px, py, panel, panel);
        ctx.beginPath();
        ctx.moveTo(px + cell, py);
        ctx.lineTo(px + cell, py + panel);
        ctx.moveTo(px, py + cell);
        ctx.lineTo(px + panel, py + cell);
        ctx.stroke();
      }
    }

    onSize(morellet, drawMorellet);
    document.querySelector("[data-morellet-advance]")?.addEventListener("click", () => {
      offset = (offset + 4) % digits.length;
      drawMorellet();
    });
  }

  const listening = document.querySelector("[data-listening-studio]");
  if (listening) {
    const lines = [
      "I am",
      "hello",
      "anyone",
      "오늘",
      "where",
      "see you",
      "지금",
      "waiting",
    ];

    playWhileVisible(listening, (now) => {
      const { ctx, width, height } = sizeCanvas(listening, 9 / 16);
      ctx.fillStyle = "#050607";
      ctx.fillRect(0, 0, width, height);
      const cols = 12;
      const rows = 6;
      const padX = width * 0.04;
      const padY = height * 0.1;
      const cellW = (width - padX * 2) / cols;
      const cellH = (height - padY * 2) / rows;
      const tick = Math.floor((now || 0) / 900);
      ctx.font = `${Math.max(9, cellH * 0.2)}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const x = padX + col * cellW + 2;
          const y = padY + row * cellH + 2;
          ctx.fillStyle = "#111614";
          ctx.fillRect(x, y, cellW - 4, cellH - 4);
          const phrase = lines[(col + row * 3 + tick) % lines.length];
          const lit = (col + row + tick) % 5 !== 0;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x + 6, y, cellW - 16, cellH - 4);
          ctx.clip();
          ctx.fillStyle = lit ? "#9dffc8" : "rgba(157, 255, 200, 0.28)";
          ctx.fillText(phrase, x + 8, y + (cellH - 4) / 2);
          ctx.restore();
        }
      }
    });
  }
})();
