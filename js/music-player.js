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
    this.lastActivityTime = Date.now();
    this.lastSavedSecond = -1;
    this.init();
    instance = this;
  }

  MusicPlayer.prototype.init = function () {
    this.createContainer();
    this.createAudio();
    this.bindEvents();
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

  MusicPlayer.prototype.createAudio = function () {
    if (sharedAudio) {
      this.audio = sharedAudio;
      return;
    }
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.audio.loop = false;
    this.audio.volume = 0.5;
    if (this.config.musicList.length > 0) {
      this.audio.src = this.config.musicList[this.currentIndex].url;
    }
    sharedAudio = this.audio;
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
        if (savedState.currentTime !== undefined && this.config.musicList.length > 0) {
          this.audio.src = this.config.musicList[this.currentIndex].url;
          this.audio.currentTime = savedState.currentTime;
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
              console.warn('Auto-play blocked by browser');
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
      this.setLoading(false);
      this.updateProgress();
    });

    this.audio.addEventListener("loadedmetadata", () => {
      this.updateProgress();
    });

    this.audio.addEventListener("timeupdate", () => {
      this.updateProgress();
      const currentSecond = Math.floor(this.audio.currentTime || 0);
      if (currentSecond !== this.lastSavedSecond) {
        this.lastSavedSecond = currentSecond;
        this.saveState();
      }
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
      this.updateSongMeta("加载失败");
      console.warn("音乐加载失败");
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
      } else {
        this.resetAutoHideTimer();
      }
    });

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
    
    this.setLoading(true);
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.setLoading(false);
      }).catch(() => {
        this.setLoading(false);
        this.updateSongMeta("等待播放");
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
    this.audio.src = this.config.musicList[this.currentIndex].url;
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
      const song = this.config.musicList[this.currentIndex];
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
    if (song.cover) {
      // Encode URL to support spaces and non-ASCII characters in filenames.
      const safeCoverUrl = encodeURI(song.cover).replace(/"/g, "%22");
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
