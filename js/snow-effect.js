(function () {
  "use strict";

  let instance = null;
  const STORAGE_KEY = "snow_effect_state";

  function SnowEffect(config) {
    if (instance) {
      return instance;
    }

    this.config = Object.assign({
      type: "sakura",
      density: 26,
      speed: 0.16,
      size: { min: 12, max: 26 },
      colors: {
        light: ["#f8c7d8", "#f6b8cf", "#fbd9e7", "#fde7ef", "#ffd4df"],
        dark: ["#f2b5d4", "#f59ac2", "#f7c6dd", "#f0a6ca", "#ffd6e8"]
      },
      zIndex: 1000,
      maxFps: 45
    }, config || {});

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    this.isDarkMode = document.documentElement.dataset.theme === "dark";
    this.prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.viewportScale = 1;
    this.lastFrameTime = 0;
    this.performanceProfile = null;
    this.boundThemeObserver = null;
    this.boundResize = null;
    this.boundBeforeUnload = null;
    this.boundVisibilityChange = null;
    this.boundConnectionChange = null;
    this.init();
    instance = this;
  }

  SnowEffect.prototype.init = function () {
    this.createCanvas();
    this.resize();
    this.bindEvents();
    this.restoreState();
    this.ensureParticles();
    if (this.isRunning && !this.prefersReducedMotion) {
      this.lastFrameTime = 0;
      this.animationId = requestAnimationFrame((timestamp) => this.animate(timestamp));
    }
  };

  SnowEffect.prototype.createCanvas = function () {
    const existingCanvas = document.querySelector(".particle-canvas");
    if (existingCanvas) {
      this.canvas = existingCanvas;
      this.ctx = existingCanvas.getContext("2d");
      return;
    }

    this.canvas = document.createElement("canvas");
    this.canvas.className = "particle-canvas";
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.style.cssText = [
      "position: fixed",
      "inset: 0",
      "width: 100%",
      "height: 100%",
      "pointer-events: none",
      "z-index: " + this.config.zIndex
    ].join("; ");
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
  };

  SnowEffect.prototype.updatePerformanceProfile = function () {
    const width = window.innerWidth;
    const compactViewport = width <= 768;
    const veryCompactViewport = width <= 480;
    const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
    const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = !!(conn && conn.saveData);
    const lowBandwidth = !!(conn && conn.effectiveType && (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g" || conn.effectiveType === "3g"));
    const constrained = compactViewport || lowCpu || lowMemory || saveData || lowBandwidth;

    this.performanceProfile = {
      dpr: constrained ? 1 : Math.min(window.devicePixelRatio || 1, 2),
      densityScale: veryCompactViewport ? 0.34 : compactViewport ? 0.48 : width <= 1024 ? 0.76 : 1,
      maxFps: veryCompactViewport ? 20 : compactViewport ? 26 : constrained ? 32 : this.config.maxFps,
      useFilterEffects: !constrained,
      useGlow: !constrained,
      useGradient: !constrained
    };
  };

  SnowEffect.prototype.resize = function () {
    if (!this.canvas || !this.ctx) {
      return;
    }

    this.updatePerformanceProfile();

    const dpr = this.performanceProfile.dpr;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.viewportScale = this.performanceProfile.densityScale;
  };

  SnowEffect.prototype.getParticleCount = function () {
    if (this.prefersReducedMotion) {
      return 0;
    }
    return Math.max(4, Math.round(this.config.density * this.viewportScale));
  };

  SnowEffect.prototype.normalizeType = function (type) {
    if (!type || type === "petal") {
      return "sakura";
    }
    return type;
  };

  SnowEffect.prototype.getPalette = function () {
    return this.isDarkMode ? this.config.colors.dark : this.config.colors.light;
  };

  SnowEffect.prototype.ensureParticles = function () {
    const targetCount = this.getParticleCount();

    if (this.particles.length < targetCount) {
      while (this.particles.length < targetCount) {
        this.particles.push(this.createParticle(true));
      }
      return;
    }

    if (this.particles.length > targetCount) {
      this.particles = this.particles.slice(0, targetCount);
    }
  };

  SnowEffect.prototype.createParticle = function (spawnAboveViewport) {
    const palette = this.getPalette();
    const layer = Math.random();
    const normalizedType = this.normalizeType(this.config.type);
    const size = this.config.size.min + Math.random() * (this.config.size.max - this.config.size.min);
    const depth = 0.55 + layer * 0.95;
    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      x: Math.random() * width,
      y: spawnAboveViewport ? -Math.random() * height - size * 2 : Math.random() * height,
      size: size * (0.8 + layer * 0.5),
      baseSpeed: (0.05 + Math.random() * 0.09) * this.config.speed * depth,
      drift: (Math.random() - 0.5) * (0.008 + layer * 0.025),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * (0.001 + layer * 0.004),
      opacity: 0.58 + layer * 0.28,
      blur: this.performanceProfile && this.performanceProfile.useFilterEffects ? (layer < 0.18 ? 1.4 : layer < 0.48 ? 0.55 : 0) : 0,
      squish: 0.72 + Math.random() * 0.28,
      sway: 0.94 + Math.random() * 0.2,
      layer: layer,
      type: normalizedType,
      color: palette[Math.floor(Math.random() * palette.length)],
      glow: this.performanceProfile && this.performanceProfile.useGlow ? 6 + layer * 12 : 0
    };
  };

  SnowEffect.prototype.recycleParticle = function (particle) {
    const next = this.createParticle(true);
    Object.keys(next).forEach((key) => {
      particle[key] = next[key];
    });
    particle.x = Math.random() * window.innerWidth;
  };

  SnowEffect.prototype.saveState = function () {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        isRunning: this.isRunning,
        type: this.normalizeType(this.config.type)
      }));
    } catch (error) {
      console.warn("Failed to save particle state:", error);
    }
  };

  SnowEffect.prototype.restoreState = function () {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return;
      }
      const state = JSON.parse(saved);
      this.isRunning = !!state.isRunning;
      if (state.type) {
        this.config.type = state.type;
      }
    } catch (error) {
      console.warn("Failed to restore particle state:", error);
    }
  };

  SnowEffect.prototype.bindEvents = function () {
    this.boundResize = () => {
      this.resize();
      this.ensureParticles();
    };
    window.addEventListener("resize", this.boundResize, { passive: true });

    this.boundThemeObserver = new MutationObserver(() => {
      this.isDarkMode = document.documentElement.dataset.theme === "dark";
      const palette = this.getPalette();
      this.particles.forEach((particle) => {
        particle.color = palette[Math.floor(Math.random() * palette.length)];
      });
    });
    this.boundThemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    this.boundBeforeUnload = () => {
      this.saveState();
    };
    window.addEventListener("beforeunload", this.boundBeforeUnload);

    this.boundVisibilityChange = () => {
      if (document.hidden) {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
          this.animationId = null;
        }
        return;
      }

      if (this.isRunning && !this.animationId && !this.prefersReducedMotion) {
        this.lastFrameTime = 0;
        this.animationId = requestAnimationFrame((timestamp) => this.animate(timestamp));
      }
    };
    document.addEventListener("visibilitychange", this.boundVisibilityChange);

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && typeof conn.addEventListener === "function") {
      this.boundConnectionChange = () => {
        this.resize();
        this.ensureParticles();
      };
      conn.addEventListener("change", this.boundConnectionChange);
    }
  };

  SnowEffect.prototype.drawSakura = function (particle) {
    const ctx = this.ctx;
    const size = particle.size;

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.scale(1, particle.squish);
    ctx.globalAlpha = particle.opacity;
    if (this.performanceProfile.useFilterEffects) {
      ctx.filter = particle.blur ? "blur(" + particle.blur + "px)" : "none";
    }
    if (this.performanceProfile.useGlow) {
      ctx.shadowColor = this.mixColor(particle.color, "#ffffff", 0.35);
      ctx.shadowBlur = particle.glow;
    }

    ctx.beginPath();
    ctx.moveTo(0, -size * 0.56);
    ctx.bezierCurveTo(size * 0.4, -size * 0.68, size * 0.72, -size * 0.06, size * 0.18, size * 0.32);
    ctx.bezierCurveTo(size * 0.04, size * 0.44, size * 0.05, size * 0.62, 0, size * 0.74);
    ctx.bezierCurveTo(-size * 0.05, size * 0.62, -size * 0.04, size * 0.44, -size * 0.18, size * 0.32);
    ctx.bezierCurveTo(-size * 0.72, -size * 0.06, -size * 0.4, -size * 0.68, 0, -size * 0.56);
    ctx.closePath();

    if (this.performanceProfile.useGradient) {
      const gradient = ctx.createLinearGradient(0, -size * 0.6, 0, size * 0.8);
      gradient.addColorStop(0, this.mixColor(particle.color, "#ffffff", 0.42));
      gradient.addColorStop(0.45, this.mixColor(particle.color, "#fff7fb", 0.18));
      gradient.addColorStop(0.72, particle.color);
      gradient.addColorStop(1, this.mixColor(particle.color, "#f48fb1", 0.36));
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = particle.color;
    }
    ctx.fill();

    if (this.performanceProfile.useGradient) {
      ctx.beginPath();
      ctx.arc(0, size * 0.08, size * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 240, 170, 0.9)";
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(-size * 0.12, -size * 0.14, size * 0.18, size * 0.07, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
      ctx.fill();
    }

    ctx.restore();
  };

  SnowEffect.prototype.drawLeaf = function (particle) {
    const ctx = this.ctx;
    const size = particle.size;

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = particle.opacity;
    if (this.performanceProfile.useFilterEffects) {
      ctx.filter = particle.blur ? "blur(" + particle.blur + "px)" : "none";
    }

    ctx.beginPath();
    ctx.moveTo(0, -size * 0.6);
    ctx.quadraticCurveTo(size * 0.75, -size * 0.1, size * 0.2, size * 0.7);
    ctx.quadraticCurveTo(0, size * 0.48, -size * 0.2, size * 0.7);
    ctx.quadraticCurveTo(-size * 0.75, -size * 0.1, 0, -size * 0.6);
    ctx.closePath();
    ctx.fillStyle = particle.color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(0, size * 0.48);
    ctx.strokeStyle = "rgba(70, 95, 55, 0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  SnowEffect.prototype.drawStar = function (particle) {
    const ctx = this.ctx;
    const size = particle.size * 0.9;
    const spikes = 5;
    const outerRadius = size * 0.48;
    const innerRadius = size * 0.2;

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = particle.opacity;
    if (this.performanceProfile.useFilterEffects) {
      ctx.filter = particle.blur ? "blur(" + particle.blur + "px)" : "none";
    }
    ctx.fillStyle = particle.color;
    ctx.beginPath();

    for (let index = 0; index < spikes * 2; index++) {
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      const angle = (index * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  SnowEffect.prototype.mixColor = function (base, target, amount) {
    function hexToRgb(hex) {
      const value = hex.replace("#", "");
      return {
        r: parseInt(value.substring(0, 2), 16),
        g: parseInt(value.substring(2, 4), 16),
        b: parseInt(value.substring(4, 6), 16)
      };
    }

    const start = hexToRgb(base);
    const end = hexToRgb(target);

    return "rgb(" + ["r", "g", "b"].map((channel) => {
      return Math.round(start[channel] + (end[channel] - start[channel]) * amount);
    }).join(", ") + ")";
  };

  SnowEffect.prototype.drawParticle = function (particle) {
    switch (particle.type) {
      case "leaf":
        this.drawLeaf(particle);
        break;
      case "star":
        this.drawStar(particle);
        break;
      case "sakura":
      default:
        this.drawSakura(particle);
        break;
    }
  };

  SnowEffect.prototype.updateParticle = function (particle, deltaMultiplier) {
    particle.rotation += particle.rotationSpeed * deltaMultiplier * 60;
    particle.x += particle.drift * deltaMultiplier * 60;
    particle.y += particle.baseSpeed * deltaMultiplier * 60;

    if (particle.y > window.innerHeight + particle.size * 1.6) {
      this.recycleParticle(particle);
    }

    if (particle.x < -particle.size * 2) {
      particle.x = window.innerWidth + particle.size;
    } else if (particle.x > window.innerWidth + particle.size * 2) {
      particle.x = -particle.size;
    }
  };

  SnowEffect.prototype.draw = function (deltaMultiplier) {
    if (!this.ctx) {
      return;
    }

    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.particles.forEach((particle) => {
      this.updateParticle(particle, deltaMultiplier);
      this.drawParticle(particle);
    });
  };

  SnowEffect.prototype.animate = function (timestamp) {
    if (!this.isRunning) {
      return;
    }

    const frameInterval = 1000 / this.performanceProfile.maxFps;
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }

    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed >= frameInterval) {
      const deltaMultiplier = Math.min(elapsed / 16.67, 2.5);
      this.lastFrameTime = timestamp;
      this.draw(deltaMultiplier);
    }

    this.animationId = requestAnimationFrame((nextTimestamp) => this.animate(nextTimestamp));
  };

  SnowEffect.prototype.start = function () {
    if (this.isRunning || this.prefersReducedMotion) {
      return;
    }

    this.ensureParticles();
    this.isRunning = true;
    this.lastFrameTime = 0;
    this.animationId = requestAnimationFrame((timestamp) => this.animate(timestamp));
    this.saveState();
  };

  SnowEffect.prototype.stop = function () {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    this.saveState();
  };

  SnowEffect.prototype.setType = function (type) {
    this.config.type = this.normalizeType(type);
    this.particles.forEach((particle) => {
      particle.type = this.config.type;
    });
    this.saveState();
  };

  SnowEffect.prototype.setDensity = function (density) {
    this.config.density = density;
    this.ensureParticles();
  };

  SnowEffect.prototype.setSpeed = function (speed) {
    this.config.speed = speed;
    this.particles.forEach((particle) => {
      particle.baseSpeed = (0.05 + Math.random() * 0.09) * this.config.speed * (0.55 + particle.layer * 0.95);
    });
  };

  SnowEffect.prototype.destroy = function () {
    this.stop();
    if (this.boundResize) {
      window.removeEventListener("resize", this.boundResize);
    }
    if (this.boundThemeObserver) {
      this.boundThemeObserver.disconnect();
    }
    if (this.boundBeforeUnload) {
      window.removeEventListener("beforeunload", this.boundBeforeUnload);
    }
    if (this.boundVisibilityChange) {
      document.removeEventListener("visibilitychange", this.boundVisibilityChange);
    }
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && this.boundConnectionChange) {
      conn.removeEventListener("change", this.boundConnectionChange);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    instance = null;
  };

  window.SnowEffect = SnowEffect;
})();
