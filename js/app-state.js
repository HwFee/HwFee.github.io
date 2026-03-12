(function () {
  "use strict";

  function AppState() {
    this.listeners = [];
    this.state = {
      musicPlayer: {
        isPlaying: false,
        currentIndex: 0,
        currentTime: 0,
        volume: 1,
        isHidden: false
      },
      particleEffect: {
        isRunning: false,
        particles: []
      }
    };
    this.storageKey = 'myblog_app_state';
    this.loadFromStorage();
  }

  AppState.prototype.subscribe = function (listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  };

  AppState.prototype.notify = function () {
    this.listeners.forEach(listener => listener(this.state));
  };

  AppState.prototype.setState = function (path, value) {
    const keys = path.split('.');
    let obj = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.saveToStorage();
    this.notify();
  };

  AppState.prototype.getState = function (path) {
    if (!path) return this.state;
    const keys = path.split('.');
    let obj = this.state;
    for (let i = 0; i < keys.length; i++) {
      if (obj === undefined) return undefined;
      obj = obj[keys[i]];
    }
    return obj;
  };

  AppState.prototype.saveToStorage = function () {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  };

  AppState.prototype.loadFromStorage = function () {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = Object.assign(this.state, parsed);
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
  };

  if (!window.appState) {
    window.appState = new AppState();
  }
})();
