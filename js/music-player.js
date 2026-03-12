(function () {
  "use strict";

  let instance = null;
  let sharedAudio = null;

  function MusicPlayer(config) {
    if (instance) {
      return instance;
    }
    
    this.config = Object.assign({
      autoPlay: false,
      musicList: [],
      currentIndex: 0,
      animationDuration: 300,
      autoHideDelay: 5000,
      position: {
        bottom: 24
      }
    }, config);
    
    this.audio = null;
    this.container = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.isHidden = false;
    this.currentIndex = this.config.currentIndex;
    this.isAnimating = false;
    this.animationTimeout = null;
    this.autoHideTimer = null;
    this.autoPlayUnlockHandler = null;
    this.hasAutoPlayUnlockListeners = false;
    this.preloadHandler = null;
    this.hasPreloadListeners = false;
    this.hasPrimedAudio = false;
    this.lastActivityTime = Date.now();
    this.lastSavedSecond = -1;
    this.pendingSeekTime = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryTimer = null;
    this.saveTimer = null;
    this.saveInterval = 5000;
    this.isSlowNetwork = false;
    this.isCompactViewport = false;
    this.init();
    instance = this;
  }

  MusicPlayer.prototype.init = function () {
    this.createContainer();
    this.createAudio();
    this.bindEvents();
    this.primeAudio();
    this.bindPreloadUnlock();
    const hasSavedState = this.restoreState();
    this.updateSongInfo();
    if (this.config.autoPlay && !hasSavedState && this.config.musicList.length > 0) {
      this.tryAutoPlay();
    }
  };

  MusicPlayer.prototype.createContainer = function () {
    const existingContainer = document.querySelector('.music-player');
    if (existingContainer) {
      this.container = existingContainer;
      return;
    }
    this.container = document.createElement("div");
    this.container.className = "music-player";
    this.container.style.setProperty('--animation-duration', this.config.animationDuration + 'ms');
    this.container.innerHTML = 
      '<button class="music-nav-bar" type="button" aria-label="展开或收起音乐播放器" title="展开或收起音乐播放器">' +
        '<span class="music-nav-bar-dot"></span>' +
      '</button>' +
      '<div class="music-player-content">' +
        '<div class="music-player-shell">' +
          '<div class="music-top-row">' +
            '<div class="music-album-cover">' +
              '<div class="music-album-cover-inner"></div>' +
            '</div>' +
            '<div class="music-info-section">' +
              '<div class="music-kicker">MUSIC</div>' +
              '<div class="music-song-info">' +
                '<div class="music-song-name">未选择音乐</div>' +
                '<div class="music-song-meta">等待播放</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="music-progress-track" aria-hidden="true">' +
            '<span class="music-buffer-fill"></span>' +
            '<span class="music-progress-fill"></span>' +
          '</div>' +
          '<div class="music-controls">' +
            '<button class="music-prev-btn" type="button" title="上一首" aria-label="上一首">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<polygon points="19 20 9 12 19 4 19 20"></polygon>' +
                '<line x1="5" y1="19" x2="5" y2="5"></line>' +
              '</svg>' +
            '</button>' +
            '<button class="music-play-btn" type="button" title="播放或暂停" aria-label="播放或暂停">' +
              '<svg class="play-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                '<polygon points="5 3 19 12 5 21 5 3"></polygon>' +
              '</svg>' +
              '<svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                '<rect x="6" y="4" width="4" height="16"></rect>' +
                '<rect x="14" y="4" width="4" height="16"></rect>' +
              '</svg>' +
              '<svg class="loading-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                '<line x1="12" y1="2" x2="12" y2="6"></line>' +
                '<line x1="12" y1="18" x2="12" y2="22"></line>' +
                '<line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>' +
                '<line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>' +
                '<line x1="2" y1="12" x2="6" y2="12"></line>' +
                '<line x1="18" y1="12" x2="22" y2="12"></line>' +
                '<line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>' +
                '<line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>' +
              '</svg>' +
            '</button>' +
            '<button class="music-next-btn" type="button" title="下一首" aria-label="下一首">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<polygon points="5 4 15 12 5 20 5 4"></polygon>' +
                '<line x1="19" y1="5" x2="19" y2="19"></line>' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(this.container);
  };

  MusicPlayer.prototype.detectNetwork = function () {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      var dominated = conn.saveData || (conn.effectiveType && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g'));
      this.isSlowNetwork = !!dominated;
    } else {
      this.isSlowNetwork = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    }

    this.isCompactViewport = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768;
  };

  MusicPlayer.prototype.shouldUseCompactMedia = function () {
    return this.isSlowNetwork || this.isCompactViewport;
  };

  MusicPlayer.prototype.resolveMediaVariant = function (resource, variants) {
    const compactCandidate = variants.mobile || variants.compact || variants.low;
    const standardCandidate = variants.desktop || variants.standard || variants.default;

    if (resource && typeof resource === 'object' && !Array.isArray(resource)) {
      const objectCompact = resource.mobile || resource.compact || resource.low;
      const objectStandard = resource.desktop || resource.standard || resource.default;
      if (this.shouldUseCompactMedia()) {
        return objectCompact || objectStandard || compactCandidate || standardCandidate || '';
      }
      return objectStandard || objectCompact || standardCandidate || compactCandidate || '';
    }

    if (typeof resource === 'string' && resource) {
      return resource;
    }

    if (this.shouldUseCompactMedia()) {
      return compactCandidate || standardCandidate || '';
    }
    return standardCandidate || compactCandidate || '';
  };

  MusicPlayer.prototype.getSongAudioUrl = function (song) {
    if (!song) {
      return '';
    }

    return this.resolveMediaVariant(song.audio, {
      mobile: song.url_mobile || song.mobile_url,
      desktop: song.url_desktop || song.desktop_url,
      default: song.url
    });
  };

  MusicPlayer.prototype.getSongCoverUrl = function (song) {
    if (!song) {
      return '';
    }

    return this.resolveMediaVariant(song.covers || song.cover_set, {
      mobile: song.cover_mobile || song.mobile_cover,
      desktop: song.cover_desktop || song.desktop_cover,
      default: song.cover
    });
  };

  MusicPlayer.prototype.createAudio = function () {
    if (sharedAudio) {
      this.audio = sharedAudio;
      return;
    }
    this.detectNetwork();
    this.audio = new Audio();
    this.audio.preload = this.isSlowNetwork ? "metadata" : "auto";
    this.audio.loop = false;
    this.audio.volume = 0.5;
    this.audio.setAttribute("playsinline", "");
    this.audio.setAttribute("webkit-playsinline", "");
    if (this.config.musicList.length > 0) {
      this.setAudioSource(this.currentIndex);
    }
    sharedAudio = this.audio;
  };

  MusicPlayer.prototype.getCurrentSong = function () {
    return this.config.musicList[this.currentIndex] || null;
  };

  MusicPlayer.prototype.getSafeMediaUrl = function (url) {
    return url ? encodeURI(url).replace(/"/g, "%22") : "";
  };

  MusicPlayer.prototype.setAudioSource = function (index) {
    const song = this.config.musicList[index];
    const songUrl = this.getSongAudioUrl(song);
    if (!song || !songUrl) {
      return;
    }

    this.audio.src = this.getSafeMediaUrl(songUrl);
    this.audio.dataset.resolvedSrc = songUrl;
  };

  MusicPlayer.prototype.refreshResponsiveMedia = function () {
    const song = this.getCurrentSong();
    if (!song || !this.audio) {
      return;
    }

    const nextSource = this.getSongAudioUrl(song);
    const currentSource = this.audio.dataset.resolvedSrc || '';

    this.updateAlbumCoverImage();

    if (!nextSource || nextSource === currentSource) {
      return;
    }

    const resumeTime = Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0;
    const wasPlaying = this.isPlaying && !this.audio.paused;

    this.setAudioSource(this.currentIndex);
    this.hasPrimedAudio = false;
    this.queueSeek(resumeTime);
    this.audio.load();

    if (wasPlaying) {
      this.play();
      return;
    }

    this.updateSongMeta('已切换到适合当前设备的音源');
  };

  MusicPlayer.prototype.queueSeek = function (time) {
    if (!Number.isFinite(time) || time <= 0) {
      this.pendingSeekTime = null;
      return;
    }

    this.pendingSeekTime = time;
    this.applyPendingSeek();
  };

  MusicPlayer.prototype.applyPendingSeek = function () {
    if (this.pendingSeekTime === null || !this.audio || this.audio.readyState < 1) {
      return;
    }

    const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
    const targetTime = duration > 0 ? Math.min(this.pendingSeekTime, Math.max(duration - 0.1, 0)) : this.pendingSeekTime;

    try {
      this.audio.currentTime = Math.max(targetTime, 0);
      this.pendingSeekTime = null;
    } catch (error) {
      console.warn("恢复播放进度失败", error);
    }
  };

  MusicPlayer.prototype.primeAudio = function () {
    if (!this.audio || !this.config.musicList.length || this.hasPrimedAudio) {
      return;
    }

    if (!this.audio.src) {
      this.setAudioSource(this.currentIndex);
    }

    try {
      this.audio.load();
      this.hasPrimedAudio = true;
    } catch (error) {
      console.warn("音频预加载失败", error);
    }
  };

  MusicPlayer.prototype.scheduleRetry = function () {
    if (this.retryCount >= this.maxRetries) {
      this.updateSongMeta("加载失败，点击重试");
      this.retryCount = 0;
      return;
    }
    this.retryCount++;
    var delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 8000);
    var self = this;
    this.updateSongMeta("加载失败，" + delay / 1000 + "秒后重试");
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(function () {
      self.setLoading(true);
      self.setAudioSource(self.currentIndex);
      self.audio.load();
      if (self.isPlaying) {
        self.play();
      }
    }, delay);
  };

  MusicPlayer.prototype.scheduleSave = function () {
    if (this.saveTimer) return;
    var self = this;
    this.saveTimer = setTimeout(function () {
      self.saveTimer = null;
      self.saveState();
    }, this.saveInterval);
  };

  MusicPlayer.prototype.updateBufferProgress = function () {
    var bufferFill = this.container.querySelector('.music-buffer-fill');
    if (!bufferFill) return;
    var duration = this.audio.duration || 0;
    if (duration <= 0) {
      bufferFill.style.transform = 'scaleX(0)';
      return;
    }
    var buffered = this.audio.buffered;
    var currentTime = this.audio.currentTime || 0;
    var maxBuffered = 0;
    for (var i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && buffered.end(i) > maxBuffered) {
        maxBuffered = buffered.end(i);
      }
    }
    var ratio = Math.min(maxBuffered / duration, 1);
    bufferFill.style.transform = 'scaleX(' + ratio + ')';
  };

  MusicPlayer.prototype.bindPreloadUnlock = function () {
    if (this.hasPreloadListeners) {
      return;
    }

    this.preloadHandler = () => {
      this.primeAudio();
      this.removePreloadUnlock();
    };

    ["touchstart", "pointerdown", "click", "keydown"].forEach((eventName) => {
      document.addEventListener(eventName, this.preloadHandler, true);
    });
    this.hasPreloadListeners = true;
  };

  MusicPlayer.prototype.removePreloadUnlock = function () {
    if (!this.hasPreloadListeners || !this.preloadHandler) {
      return;
    }

    ["touchstart", "pointerdown", "click", "keydown"].forEach((eventName) => {
      document.removeEventListener(eventName, this.preloadHandler, true);
    });
    this.preloadHandler = null;
    this.hasPreloadListeners = false;
  };

  MusicPlayer.prototype.saveState = function () {
    if (window.appState) {
      window.appState.setState('musicPlayer.isPlaying', this.isPlaying);
      window.appState.setState('musicPlayer.currentIndex', this.currentIndex);
      window.appState.setState('musicPlayer.currentTime', this.audio.currentTime);
      window.appState.setState('musicPlayer.isHidden', this.isHidden);
    }
  };

  MusicPlayer.prototype.restoreState = function () {
    let hasSavedState = false;
    if (window.appState) {
      const savedState = window.appState.getState('musicPlayer');
      if (savedState) {
        hasSavedState = true;
        if (savedState.currentIndex !== undefined) {
          this.currentIndex = savedState.currentIndex;
        }
        if (this.config.musicList.length > 0) {
          this.setAudioSource(this.currentIndex);
        }
        if (savedState.currentTime !== undefined && this.config.musicList.length > 0) {
          this.queueSeek(savedState.currentTime);
        }
        if (savedState.isHidden !== undefined) {
          this.isHidden = savedState.isHidden;
          if (this.isHidden) {
            this.container.classList.add('hidden');
          } else {
            this.container.classList.remove('hidden');
          }
        }
        if (savedState.isPlaying && this.config.musicList.length > 0) {
          const playPromise = this.audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              this.isPlaying = true;
              this.updateButtonState();
              this.updateAlbumCoverState();
            }).catch(() => {
              this.updateSongMeta("等待交互后继续播放");
              this.bindAutoPlayUnlock();
            });
          } else {
            this.isPlaying = true;
            this.updateButtonState();
            this.updateAlbumCoverState();
          }
        }
      }
    }
    return hasSavedState;
  };

  MusicPlayer.prototype.tryAutoPlay = function () {
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        this.updateSongMeta("等待交互后自动播放");
        this.bindAutoPlayUnlock();
      });
      return;
    }

    this.play();
  };

  MusicPlayer.prototype.bindAutoPlayUnlock = function () {
    if (this.hasAutoPlayUnlockListeners) {
      return;
    }

    this.autoPlayUnlockHandler = () => {
      this.removeAutoPlayUnlock();
      if (!this.isPlaying) {
        this.play();
      }
    };

    ["click", "touchstart", "keydown"].forEach((eventName) => {
      document.addEventListener(eventName, this.autoPlayUnlockHandler, true);
    });
    this.hasAutoPlayUnlockListeners = true;
  };

  MusicPlayer.prototype.removeAutoPlayUnlock = function () {
    if (!this.hasAutoPlayUnlockListeners || !this.autoPlayUnlockHandler) {
      return;
    }

    ["click", "touchstart", "keydown"].forEach((eventName) => {
      document.removeEventListener(eventName, this.autoPlayUnlockHandler, true);
    });
    this.autoPlayUnlockHandler = null;
    this.hasAutoPlayUnlockListeners = false;
  };

  MusicPlayer.prototype.debounce = function (func, wait) {
    return () => {
      if (this.isAnimating) return;
      this.isAnimating = true;
      func.apply(this, arguments);
      clearTimeout(this.animationTimeout);
      this.animationTimeout = setTimeout(() => {
        this.isAnimating = false;
      }, wait);
    };
  };

  MusicPlayer.prototype.bindEvents = function () {
    const playBtn = this.container.querySelector(".music-play-btn");
    const nextBtn = this.container.querySelector(".music-next-btn");
    const prevBtn = this.container.querySelector(".music-prev-btn");
    const triggerPill = this.container.querySelector(".music-nav-bar");
    const card = this.container.querySelector(".music-player-content");
    
    playBtn.addEventListener("click", () => {
      this.resetAutoHideTimer();
      this.toggle();
    });

    nextBtn.addEventListener("click", () => {
      this.resetAutoHideTimer();
      this.next();
    });

    prevBtn.addEventListener("click", () => {
      this.resetAutoHideTimer();
      this.prev();
    });

    const debouncedToggle = this.debounce(this.toggleVisibility, this.config.animationDuration + 50);
    triggerPill.addEventListener("click", () => {
      debouncedToggle.call(this);
      if (!this.isHidden) {
        this.resetAutoHideTimer();
      }
    });

    triggerPill.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        debouncedToggle.call(this);
        if (!this.isHidden) {
          this.resetAutoHideTimer();
        }
      }
    });

    [this.container, card].forEach((element) => {
      ["mouseenter", "mousemove", "touchstart", "focusin"].forEach((eventName) => {
        element.addEventListener(eventName, () => {
          this.resetAutoHideTimer();
        }, { passive: true });
      });
    });

    this.audio.addEventListener("loadstart", () => {
      this.setLoading(true);
      this.updateSongMeta();
    });

    this.audio.addEventListener("canplay", () => {
      this.hasPrimedAudio = true;
      this.retryCount = 0;
      this.setLoading(false);
      this.updateProgress();
      this.updateBufferProgress();
    });

    this.audio.addEventListener("loadedmetadata", () => {
      this.hasPrimedAudio = true;
      this.applyPendingSeek();
      this.updateProgress();
    });

    this.audio.addEventListener("timeupdate", () => {
      this.updateProgress();
      this.scheduleSave();
    });

    this.audio.addEventListener("progress", () => {
      this.updateBufferProgress();
    });

    this.audio.addEventListener("play", () => {
      this.removeAutoPlayUnlock();
      this.isPlaying = true;
      this.updateButtonState();
      this.updateAlbumCoverState();
      this.updateSongMeta();
      this.saveState();
    });

    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updateButtonState();
      this.updateAlbumCoverState();
      this.updateSongMeta();
      this.saveState();
    });

    this.audio.addEventListener("ended", () => {
      this.next();
    });

    this.audio.addEventListener("error", () => {
      this.setLoading(false);
      console.warn("音乐加载失败，第" + (this.retryCount + 1) + "次尝试");
      this.scheduleRetry();
    });

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !e.target.matches("input, textarea")) {
        e.preventDefault();
        this.resetAutoHideTimer();
        this.toggle();
      }
    });

    const activityEvents = ["mousemove", "mousedown", "touchstart", "scroll", "keydown"];
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.resetAutoHideTimer();
      }, { passive: true });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimeout(this.autoHideTimer);
        this.saveState();
      } else {
        this.resetAutoHideTimer();
        if (this.isPlaying && this.audio.paused) {
          this.audio.play().catch(function () {});
        }
      }
    });

    window.addEventListener("beforeunload", () => {
      this.saveState();
    });

    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener("change", () => {
        this.detectNetwork();
        if (!this.isPlaying && this.audio) {
          this.audio.preload = this.isSlowNetwork ? "metadata" : "auto";
        }
        this.refreshResponsiveMedia();
      });
    }

    window.addEventListener('resize', () => {
      const previousCompactState = this.isCompactViewport;
      this.detectNetwork();
      if (previousCompactState !== this.isCompactViewport) {
        this.refreshResponsiveMedia();
      }
    }, { passive: true });

    this.startAutoHideTimer();
  };

  MusicPlayer.prototype.startAutoHideTimer = function () {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
    }
    if (this.isHidden) {
      return;
    }
    this.autoHideTimer = setTimeout(() => {
      if (!this.isHidden) {
        this.hide();
      }
    }, this.config.autoHideDelay);
  };

  MusicPlayer.prototype.resetAutoHideTimer = function () {
    this.lastActivityTime = Date.now();
    if (!this.isHidden) {
      this.startAutoHideTimer();
    }
  };

  MusicPlayer.prototype.setLoading = function (loading) {
    this.isLoading = loading;
    const btn = this.container.querySelector(".music-play-btn");
    if (loading) {
      btn.classList.add("loading");
    } else {
      btn.classList.remove("loading");
    }
  };

  MusicPlayer.prototype.play = function () {
    if (this.config.musicList.length === 0) {
      return;
    }

    this.primeAudio();
    clearTimeout(this.retryTimer);
    this.retryCount = 0;

    if (!this.audio.src) {
      this.setAudioSource(this.currentIndex);
    }

    if (this.isSlowNetwork && this.audio.preload === "metadata") {
      this.audio.preload = "auto";
    }

    this.setLoading(true);
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.setLoading(false);
      }).catch(() => {
        this.setLoading(false);
        this.updateSongMeta("等待交互后播放");
        this.bindAutoPlayUnlock();
      });
    } else {
      this.isPlaying = true;
      this.updateButtonState();
      this.updateAlbumCoverState();
      this.setLoading(false);
      this.updateSongMeta();
      this.saveState();
    }
  };

  MusicPlayer.prototype.pause = function () {
    this.audio.pause();
  };

  MusicPlayer.prototype.toggle = function () {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  };

  MusicPlayer.prototype.next = function () {
    if (this.config.musicList.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.config.musicList.length;
    this.loadCurrentSong();
  };

  MusicPlayer.prototype.prev = function () {
    if (this.config.musicList.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.config.musicList.length) % this.config.musicList.length;
    this.loadCurrentSong();
  };

  MusicPlayer.prototype.loadCurrentSong = function () {
    if (this.config.musicList.length === 0) return;
    const wasPlaying = this.isPlaying;
    this.setLoading(true);
    this.hasPrimedAudio = false;
    this.pendingSeekTime = null;
    this.retryCount = 0;
    clearTimeout(this.retryTimer);
    this.setAudioSource(this.currentIndex);
    this.primeAudio();
    this.updateSongInfo();
    this.updateProgress();
    this.saveState();
    if (wasPlaying) {
      this.play();
    } else {
      this.audio.load();
      this.setLoading(false);
      this.updateSongMeta();
    }
  };

  MusicPlayer.prototype.updateSongInfo = function () {
    const songNameEl = this.container.querySelector(".music-song-name");
    if (this.config.musicList.length > 0) {
      const song = this.getCurrentSong();
      songNameEl.textContent = this.truncateText(song.name, 18);
    } else {
      songNameEl.textContent = "未选择音乐";
    }
    this.updateAlbumCoverImage();
    this.updateSongMeta();
  };

  MusicPlayer.prototype.updateAlbumCoverImage = function () {
    const coverInner = this.container.querySelector(".music-album-cover-inner");
    if (!coverInner) {
      return;
    }

    if (!this.config.musicList.length) {
      coverInner.style.background = "";
      return;
    }

    const song = this.config.musicList[this.currentIndex] || {};
    const coverUrl = this.getSongCoverUrl(song);
    if (coverUrl) {
      // Encode URL to support spaces and non-ASCII characters in filenames.
      const safeCoverUrl = encodeURI(coverUrl).replace(/"/g, "%22");
      coverInner.style.background = 'center / cover no-repeat url("' + safeCoverUrl + '")';
      return;
    }

    coverInner.style.background = "";
  };

  MusicPlayer.prototype.truncateText = function (text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  MusicPlayer.prototype.updateButtonState = function () {
    const btn = this.container.querySelector(".music-play-btn");
    if (this.isPlaying) {
      btn.classList.add("playing");
    } else {
      btn.classList.remove("playing");
    }
  };

  MusicPlayer.prototype.updateAlbumCoverState = function () {
    const coverInner = this.container.querySelector(".music-album-cover-inner");
    if (this.isPlaying) {
      coverInner.classList.add("rotating");
    } else {
      coverInner.classList.remove("rotating");
    }
  };

  MusicPlayer.prototype.updateSongMeta = function (customText) {
    const metaEl = this.container.querySelector(".music-song-meta");
    if (!metaEl) {
      return;
    }

    if (customText) {
      metaEl.textContent = customText;
      return;
    }

    const total = this.config.musicList.length;
    if (!total) {
      metaEl.textContent = "暂无曲目";
      return;
    }

    const statusText = this.isLoading ? "缓冲中" : (this.isPlaying ? "正在播放" : "已暂停");
    const indexText = String(this.currentIndex + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    metaEl.textContent = indexText + " · " + statusText;
  };

  MusicPlayer.prototype.updateProgress = function () {
    const progressFill = this.container.querySelector(".music-progress-fill");
    if (!progressFill) {
      return;
    }

    const duration = this.audio.duration || 0;
    const currentTime = this.audio.currentTime || 0;
    const ratio = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
    progressFill.style.transform = 'scaleX(' + ratio + ')';
  };

  MusicPlayer.prototype.toggleVisibility = function () {
    if (this.isHidden) {
      this.show();
    } else {
      this.hide();
    }
  };

  MusicPlayer.prototype.show = function () {
    if (!this.isHidden) return;
    this.isHidden = false;
    this.container.classList.remove("hidden");
    this.startAutoHideTimer();
    this.saveState();
  };

  MusicPlayer.prototype.hide = function () {
    if (this.isHidden) return;
    this.isHidden = true;
    this.container.classList.add("hidden");
    clearTimeout(this.autoHideTimer);
    this.saveState();
  };

  window.MusicPlayer = MusicPlayer;
})();
