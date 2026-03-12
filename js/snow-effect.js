(function () {
  "use strict";

  let instance = null;
  const STORAGE_KEY = 'snow_effect_state';

  function SnowEffect(config) {
    if (instance) {
      return instance;
    }
    
    this.config = Object.assign({
      type: "petal",
      density: 20,
      speed: 2,
      size: { min: 12, max: 28 },
      colors: {
        light: ["#ff6b9d", "#ff8fab", "#ffc3d0", "#ffd6e0", "#ffebf0"],
        dark: ["#e0a4ff", "#c084fc", "#a855f7", "#9333ea", "#7c3aed"]
      },
      zIndex: 1000
    }, config);
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    this.isDarkMode = document.documentElement.dataset.theme === "dark";
    this.init();
    instance = this;
  }

  SnowEffect.prototype.init = function () {
    this.createCanvas();
    this.bindEvents();
    this.restoreState();
  };

  SnowEffect.prototype.createCanvas = function () {
    const existingCanvas = document.querySelector('.particle-canvas');
    if (existingCanvas) {
      this.canvas = existingCanvas;
      this.ctx = this.canvas.getContext('2d');
      return;
    }
    this.canvas = document.createElement("canvas");
    this.canvas.className = "particle-canvas";
    this.canvas.style.cssText = 
      "position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: " + this.config.zIndex + ";";
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.resize();
  };

  SnowEffect.prototype.resize = function () {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  SnowEffect.prototype.createParticles = function () {
    this.particles = [];
    for (let i = 0; i < this.config.density; i++) {
      this.particles.push(this.createParticle());
    }
  };

  SnowEffect.prototype.saveState = function () {
    try {
      const state = {
        isRunning: this.isRunning,
        particles: this.particles.map(p => ({
          x: p.x,
          y: p.y,
          size: p.size,
          speed: p.speed,
          rotation: p.rotation,
          rotationSpeed: p.rotationSpeed,
          swing: p.swing,
          swingSpeed: p.swingSpeed,
          swingAmplitude: p.swingAmplitude,
          color: p.color,
          type: p.type,
          opacity: p.opacity,
          layer: p.layer
        }))
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save particle state:', e);
    }
  };

  SnowEffect.prototype.restoreState = function () {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        this.isRunning = state.isRunning || false;
        if (state.particles && state.particles.length > 0) {
          this.particles = state.particles;
        } else {
          this.createParticles();
        }
      } else {
        this.createParticles();
      }
    } catch (e) {
      console.warn('Failed to restore particle state:', e);
      this.createParticles();
    }
    if (this.isRunning) {
      this.animate();
    }
  };

  SnowEffect.prototype.createParticle = function () {
    const colors = this.isDarkMode ? this.config.colors.dark : this.config.colors.light;
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * -this.canvas.height - 100,
      size: this.config.size.min + Math.random() * (this.config.size.max - this.config.size.min),
      speed: this.config.speed * (0.5 + Math.random() * 1),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      swing: Math.random() * Math.PI * 2,
      swingSpeed: 0.01 + Math.random() * 0.02,
      swingAmplitude: 30 + Math.random() * 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: this.config.type,
      opacity: 0.6 + Math.random() * 0.4,
      layer: Math.random()
    };
  };

  SnowEffect.prototype.bindEvents = function () {
    window.addEventListener("resize", () => {
      this.resize();
    });

    const observer = new MutationObserver(() => {
      this.isDarkMode = document.documentElement.dataset.theme === "dark";
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    window.addEventListener('beforeunload', () => {
      this.saveState();
    });
  };

  SnowEffect.prototype.drawPetal = function (particle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = particle.opacity;
    
    const size = particle.size;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      const petalLength = size * 0.8;
      const petalWidth = size * 0.4;
      
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -size * 0.2);
      ctx.beginPath();
      ctx.ellipse(0, -petalLength / 2, petalWidth, petalLength / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = "#ffeb3b";
    ctx.fill();
    
    ctx.restore();
  };

  SnowEffect.prototype.drawLeaf = function (particle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = particle.opacity;
    
    const size = particle.size;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    
    ctx.moveTo(0, -size / 2);
    ctx.quadraticCurveTo(size / 2, -size / 4, size / 3, size / 3);
    ctx.quadraticCurveTo(0, size / 2, -size / 3, size / 3);
    ctx.quadraticCurveTo(-size / 2, -size / 4, 0, -size / 2);
    ctx.fill();
    
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(0, size / 4);
    ctx.stroke();
    
    ctx.restore();
  };

  SnowEffect.prototype.drawStar = function (particle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = particle.opacity;
    
    const size = particle.size;
    const spikes = 5;
    const outerRadius = size / 2;
    const innerRadius = size / 4;
    
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI / spikes) - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  };

  SnowEffect.prototype.draw = function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(particle => {
      const layerFactor = 0.5 + particle.layer * 0.5;
      
      particle.swing += particle.swingSpeed * layerFactor;
      const swingOffset = Math.sin(particle.swing) * particle.swingAmplitude * layerFactor;
      
      particle.x += swingOffset * 0.02;
      particle.y += particle.speed * layerFactor;
      particle.rotation += particle.rotationSpeed;

      if (particle.y > this.canvas.height + particle.size) {
        Object.assign(particle, this.createParticle());
        particle.y = -particle.size - 50;
        particle.x = Math.random() * this.canvas.width;
      }

      if (particle.x < -particle.size * 2) {
        particle.x = this.canvas.width + particle.size;
      } else if (particle.x > this.canvas.width + particle.size * 2) {
        particle.x = -particle.size;
      }

      switch (particle.type) {
        case "petal":
          this.drawPetal(particle);
          break;
        case "leaf":
          this.drawLeaf(particle);
          break;
        case "star":
          this.drawStar(particle);
          break;
        default:
          this.drawPetal(particle);
      }
    });
  };

  SnowEffect.prototype.animate = function () {
    if (!this.isRunning) return;
    this.draw();
    
    if (!this.lastSaveTime || Date.now() - this.lastSaveTime > 500) {
      this.saveState();
      this.lastSaveTime = Date.now();
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  };

  SnowEffect.prototype.start = function () {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
    this.saveState();
  };

  SnowEffect.prototype.stop = function () {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.saveState();
  };

  SnowEffect.prototype.setType = function (type) {
    this.config.type = type;
    this.particles.forEach(particle => {
      particle.type = type;
    });
  };

  SnowEffect.prototype.setDensity = function (density) {
    this.config.density = density;
    while (this.particles.length < density) {
      this.particles.push(this.createParticle());
    }
    if (this.particles.length > density) {
      this.particles = this.particles.slice(0, density);
    }
  };

  SnowEffect.prototype.setSpeed = function (speed) {
    this.config.speed = speed;
    this.particles.forEach(particle => {
      particle.speed = speed * (0.5 + Math.random() * 1);
    });
  };

  SnowEffect.prototype.destroy = function () {
    this.stop();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  };

  window.SnowEffect = SnowEffect;
})();
