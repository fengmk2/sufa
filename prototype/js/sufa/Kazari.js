define(function(require , exports , module){

	var JSTweener = require('third/JSTweener');

	var Kazari = function () {};

	Kazari.ResourceLoader = function () {
		this.initialize();
	}
	Kazari.ResourceLoader.prototype.initialize = function () {
		/// <summary>Kazari.ResourceLoader</summary>
		this.isLoadingStarted = false;
		this.isCompleted = false;
		this.loadedCount = 0;
		this.errorCount = 0;

		this.loadQueue = [];
		this.loadedResources = [];
		this.loadedResourcesByUrl = {};
		
		this.onProgressCallback = null;
		this.onCompleteCallback = null;
		this.onErrorCallback = null;

		return this;
	}
	Kazari.ResourceLoader.prototype.add = function (urlOrUrlArray) {
		/// <summary>Add image URL(s) to queue</summary>
		/// <return>Kazari.ResourceLoader</return>

		if (this.isLoadingStarted) throw "ResourceLoader is already loading.";

		var loader = this;
		if (urlOrUrlArray instanceof Array) {
			urlOrUrlArray.forEach(function (e, i) { loader.loadQueue.push(e); });
		} else {
			this.loadQueue.push(urlOrUrlArray);
		}
		return this;
	}
	Kazari.ResourceLoader.prototype.onProgress = function (callback) {
		/// <summary>Set 'Progress' event Callback (function (image, url, loadedCount, totalLoadCount) {...})</summary>
		/// <return>Kazari.ResourceLoader</return>
		this.onProgressCallback = callback;
		return this;
	}
	Kazari.ResourceLoader.prototype.onComplete = function (callback) {
		/// <summary>Set 'Complete' event Callback</summary>
		/// <return>Kazari.ResourceLoader</return>
		this.onCompleteCallback = callback;
		return this;
	}
	Kazari.ResourceLoader.prototype.onError = function (callback) {
		/// <summary>Set 'Complete' event Callback</summary>
		/// <return>Kazari.ResourceLoader</return>
		this.onErrorCallback = callback;
		return this;
	}
	Kazari.ResourceLoader.prototype._error = function (image, url) {
		this.loadedCount++;
		this.errorCount++;

		if (this.onErrorCallback)
			this.onErrorCallback(url);

		this._complete();
	}

	Kazari.ResourceLoader.prototype._loaded = function (image, url) {
		this.loadedCount++;
		this.loadedResourcesByUrl[url] = image;

		if (this.onProgressCallback)
			this.onProgressCallback(image, url, this.loadedCount, this.loadQueue.length);

		this._complete();
	}

	Kazari.ResourceLoader.prototype._complete = function () {
		if (this.loadedCount == this.loadQueue.length) {
			this.isCompleted = true;
			if (this.onCompleteCallback)
				this.onCompleteCallback(this.errorCount == 0, this.loadedResources);
		}
	}

	Kazari.ResourceLoader.prototype.get = function (url) {
		/// <summary>Get HTMLImageElement by URL</summary>
		/// <return>HTMLImageElement</return>
		return this.loadedResourcesByUrl[url];
	}

	Kazari.ResourceLoader.prototype.abort = function () {
		/// <summary>Abort loading images</summary>
		/// <return>Kazari.ResourceLoader</return>
		if (!this.isLoadingStarted) throw "ResourceLoader is not loading.";

		this.onCompleteCallback = null;
		this.onProgressCallback = null;
		this.onErrorCallback = null;

		return this;
	}

	Kazari.ResourceLoader.prototype.start = function () {
		/// <summary>Start loading images</summary>
		/// <return>Kazari.ResourceLoader</return>
		if (this.isLoadingStarted) throw "ResourceLoader is already loading.";

		this.isLoadingStarted = true;

		var loader = this;
		this.loadQueue.forEach(function (url, i) {
			var resource = loader.createResource(url);
			loader.loadedResources.push(resource);
		});
		return this;
	}

	Kazari.ResourceLoader.prototype.createResource = function (url) {
		throw "NotImplemented";
	}

	/* ------------------------------------------------------------------------- */

	Kazari.MediaLoader = function (mediaType) {
		/// <summary>MediaLoader</summary>
		this.initialize();
		this.mediaType = mediaType;
	}
	Kazari.MediaLoader.prototype = new Kazari.ResourceLoader();
	Kazari.MediaLoader.prototype.createResource = function (url) {
		var loader = this;
		var media = document.createElement(this.mediaType);
		media.onerror = function () { loader._error(media, url); };
		media.onload = function () { loader._loaded(media, url); };
		media.src = url;

		return media;
	}

	/* ------------------------------------------------------------------------- */

	Kazari.Interval = function (interval, callback) {
		this.interval = interval;
		this.callback = callback;

		this.timerId = null;
	}
	Kazari.Interval.prototype.start = function () {
		this.stop();
		this.timerId = setInterval(this.callback, this.interval);
	}
	Kazari.Interval.prototype.stop = function () {
		if (this.timerId != null)
			clearInterval(this.timerId);
	}

	/* ------------------------------------------------------------------------- */

	Kazari.ResourceLoadingWatcher = function () {
		var self = this;
		this.watchTargets = [];
		this.onCompleteCallback = null;
		this.isRunning = false;
		this.timer = new Kazari.Interval(100, function () { self._checkTargets(); });
		this.totalCount = 0;
	}

	Kazari.ResourceLoadingWatcher.prototype.register = function (e) {
		if (this.isRunning) throw "ResourceLoadingWatcher is already started.";
		if (e == null) throw "argument can not be null.";

		var self = this;
		if (e instanceof Array) {
			e.forEach(function (e1, i) { self.watchTargets.push(e1); });
		} else {
			this.watchTargets.push(e);
		}

		return this;
	}

	Kazari.ResourceLoadingWatcher.prototype.start = function () {
		if (this.isRunning) throw "ResourceLoadingWatcher is already started.";
		
		this.totalCount = this.watchTargets.length;
		this.isRunning = true;
		this.timer.start();
		this._progress();

		return this;
	}

	Kazari.ResourceLoadingWatcher.prototype._progress = function () {
		if (this.onProgressCallback != null) {
			this.onProgressCallback(this.totalCount - this.watchTargets.length, this.totalCount);
		}
	}

	Kazari.ResourceLoadingWatcher.prototype._complete = function () {
		if (this.onCompleteCallback != null) {
			this.onCompleteCallback();
		}
		this.onCompleteCallback = null;
		this.watchTargets = [];
		this.timer.stop();
		this.isRunning = false;
	}

	Kazari.ResourceLoadingWatcher.prototype.onProgress = function (callback) {
		this.onProgressCallback = callback;
		return this;
	}

	Kazari.ResourceLoadingWatcher.prototype.onComplete = function (callback) {
		this.onCompleteCallback = callback;
		return this;
	}

	Kazari.ResourceLoadingWatcher.prototype._checkTargets = function () {
		var currentRemains = this.watchTargets.length;
		this.watchTargets = this.watchTargets.filter(function (e) {
			return !(e.complete ||
					(e.readyState == 4) ||
					(e instanceof HTMLMediaElement && e.readyState > 1)); 
		});

		if (this.watchTargets.length != currentRemains) {
			this._progress();
		}

		if (this.watchTargets.length == 0) {
			this._complete();
		}
	}

	/* ------------------------------------------------------------------------- */

	Kazari.MediaManager = function (name, defaultOptions) {
		/// <summary>Media Manager</summary>
		if (!defaultOptions) defaultOptions = {};
		
		this.name = name;
		this.mediaCollection = [];
		this.setMuted(defaultOptions.muted || 1.0);
		this.setVolume(defaultOptions.volume || false);
	}

	if (Object.defineProperties) {
		Object.defineProperties(Kazari.MediaManager.prototype, {
			volume: {
				get: function () { return this.getVolume(); },
				set: function (value) { this.setVolume(value); }
			},
			muted: {
				get: function () { return this.getMuted(); },
				set: function (value) { this.setMuted(value); }
			},
		});
	}

	Kazari.MediaManager.prototype.register = function (e) {
		/// <summary>Register a media element</summary>
		/// <param name="e">HTMLMediaElement</param>

		if (!e.play || !e.pause) throw "Not Supported Media Element: "+e;

		e.volume = this._volume;
		e.muted = this._muted;

		this.mediaCollection.push(e);
	}
	Kazari.MediaManager.prototype.pause = function () {
		/// <summary>Pause all registed media elements</summary>
		this.mediaCollection.forEach(function (e, i) { e.pause(); });
	}
	Kazari.MediaManager.prototype.play = function () {
		/// <summary>Play/Resume all registed media elements</summary>
		this.mediaCollection.forEach(function (e, i) { e.play(); });
	}
	Kazari.MediaManager.prototype.mute = function () {
		/// <summary>Mute all registed media elements</summary>
		this.setMuted(true);
	}
	Kazari.MediaManager.prototype.unmute = function () {
		/// <summary>Unmute all registed media elements</summary>
		this.setMuted(false);
	}
	Kazari.MediaManager.prototype.setMuted = function (muted) {
		/// <summary>Set 'muted' property of all registed media elements</summary>
		this._muted = muted;
		this.mediaCollection.forEach(function (e, i) {
			e.muted = !e.muted;
			e.muted = muted;
		});
		Kazari.LocalStorage.setItem(this.name + '_muted', muted);
	}
	Kazari.MediaManager.prototype.getMuted = function (value) {
		/// <summary>Get 'muted' property of all registed media elements</summary>
		return this._muted;
	}
	Kazari.MediaManager.prototype.setVolume = function (value) {
		/// <summary>Set volume of all registed media elements</summary>
		value = Math.min(1, Math.max(0, value)); // 0..1
		this._volume = value;
		this.mediaCollection.forEach(function (e, i) { e.volume = value; });
		Kazari.LocalStorage.setItem(this.name + '_volume', value);
	}
	Kazari.MediaManager.prototype.getVolume = function (value) {
		/// <summary>Get volume of all registed media elements</summary>
		return this._volume;
	}

	/* ------------------------------------------------------------------------- */

	Kazari.LocalStorage = {
		enabled: (function () { try { return window.localStorage; } catch (e) { return false; } })()
	}
	Kazari.LocalStorage.getItem = function (key, defaultValue) {
		/// <summary>return a stored value or default value</summary>
		if (!this.enabled) return defaultValue;

		var value = window.localStorage.getItem(key);
		if (value == undefined || value == null) return defaultValue;

		try { return JSON.parse(value); } catch (e) { return defaultValue; }
	}
	Kazari.LocalStorage.setItem = function (key, value) {
		/// <summary>store key/value pair to localStorage</summary>
		if (!this.enabled) return;
		window.localStorage.setItem(key, JSON.stringify(value));
	}
	Kazari.LocalStorage.removeItem = function (key) {
		/// <summary>remove key/value pair from localStorage</summary>
		if (!this.enabled) return;
		window.localStorage.removeItem(key);
	}

	Kazari.SessionStorage = {
		enabled: (function () { try { return window.sessionStorage; } catch (e) { return false; } })()
	}
	Kazari.SessionStorage.getItem = function (key, defaultValue) {
		/// <summary>return a stored value or default value</summary>
		if (!this.enabled) return defaultValue;

		var value = window.sessionStorage.getItem(key);
		if (value == undefined || value == null) return defaultValue;

		try { return JSON.parse(value); } catch (e) { return defaultValue; }
	}
	Kazari.SessionStorage.setItem = function (key, value) {
		/// <summary>store key/value pair to sessionStorage</summary>
		if (!this.enabled) return;
		window.sessionStorage.setItem(key, JSON.stringify(value));
	}
	Kazari.SessionStorage.removeItem = function (key) {
		/// <summary>remove key/value pair from sessionStorage</summary>
		if (!this.enabled) return;
		window.sessionStorage.removeItem(key);
	}

	/* ------------------------------------------------------------------------- */

	Kazari.CommandHooker = function () { }

	Kazari.CommandHooker.prototype._friendlySeqMap = {
		 'up'     : 38
		,'left'   : 37
		,'right'  : 39
		,'down'   : 40
		,'backspace': 8
		,'bs'     : 8
		,'del'    : 46
	}

	Kazari.CommandHooker.prototype.setup = function (bindTarget) {
		this._keySeq = [];
		this._commandMap = {};
		var self = this;
		bindTarget.addEventListener('keyup', function (e) { self._addKeySequence(e); }, false);
	}

	Kazari.CommandHooker.prototype.onKeyProcess = function (keySeq) {}
	Kazari.CommandHooker.prototype.onInvalidCommand = function () {}

	Kazari.CommandHooker.prototype._addKeySequence = function (e) {
		this._keySeq.push(e.keyCode);
		var map = this._commandMap;

		for (var i = 0, n = this._keySeq.length; i < n; i++) {
			var val = this._keySeq[i];
			map = map[val];

			if (map == null) {
				this._keySeq = [];
				if (i != 0) {
					if (this.onInvalidCommand != null) {
						this.onInvalidCommand();
					}
				}
				return;
			}
			if (this.onKeyProcess != null) {
				this.onKeyProcess(this._keySeq);
			}
		}

		if (map['__ACTION__']) {
			map['__ACTION__']();
			this._keySeq = [];
		}
	}

	Kazari.CommandHooker.prototype.addMapping = function (keySeq, action) {
		var map = this._commandMap;
		keySeq = this._friendlySeqToNumberSeq(keySeq);
		keySeq.forEach(function (v, i) {
			if (map[v] == null) {
				map[v] = {};
			}
			map = map[v];
		});
		map['__ACTION__'] = action;
	}

	Kazari.CommandHooker.prototype._friendlySeqToNumberSeq = function (keySeq) {
		var self = this;
		return keySeq.map(function (val) {
			if (typeof(val) == "number") {
				return val;
			} else if (self._friendlySeqMap[val.toLowerCase()] != null) {
				return self._friendlySeqMap[val.toLowerCase()];
			} else if (val.length == 1) {
				return val.toUpperCase().charCodeAt(0);
			} else {
				throw "key '"+val+"' not supported";
			}
		});
	}

	/* ------------------------------------------------------------------------- */

	Kazari.Animation = {
		interval:       1000/60 /* 60 fps */,
		//interval:       1000 /* 60 fps */,
		timer:          null,
		sceneStartTime: null,
		queue:          [],
		currentScene:   { animations: [] },
		onBeforeUpdate: null,
		onAfterUpdate:  null,
		defaultEasing:  'linear',
		logging:        false
	};

	// JSTweener#toNumber / from JSTweener
	Kazari.Animation._toNumber = function(value, prefix, suffix) {
		// for style
		if (!suffix) suffix = 'px';

		return value.toString().match(/[0-9]/) ? Number(value.toString().replace(
														new RegExp(suffix + '$'), ''
														).replace(
														new RegExp('^' + (prefix ? prefix : '')), ''
														))
												: 0;
	}

	Kazari.Animation._onTick = function () {
		var t = new Date().valueOf();

		if (this.currentScene.animations && this.currentScene.animations.length == 0) {
			if (this.queue.length == 0) {
				this._shutdown();
				return;
			}
			this.sceneStartTime = t;
			this.currentScene = this.queue.shift();
			if (!(this.currentScene instanceof Function)) {
				this.currentScene.animations.forEach(function (anim) {
					// prepare animations
					if (anim.target instanceof HTMLElement) {
						if (typeof(anim.update) == 'string') {
							var propName = anim.update;
							anim.update = function (target, value) { target.style[propName] = value; };
							anim.getter = function (target) { return target.style[propName]; };
						}
						if (anim.suffix == null) {
							anim.suffix = 'px';
						}
					}

					if (anim.from == null) {
						anim.from = (anim.update instanceof Function) ? anim.getter(anim.target)
																	  : anim.target[anim.update];
						anim.from = Kazari.Animation._toNumber(anim.from, anim.prefix, anim.suffix);
					}

					if (anim.easing == null) {
						anim.easing = Kazari.Animation.defaultEasing;
					}
					if (typeof(anim.easing) == 'string') {
						anim.easing = Kazari.JSTweener.easingFunctions[anim.easing];
					}
				});
			}
			this._log('Scene Started: ' + t);
		}

		var elapsed = t - this.sceneStartTime;

		if (this.currentScene instanceof Function) {
			// Callback
			this.currentScene({
				onNext: function () { Kazari.Animation._onNext(); },
				onPause: function () { Kazari.Animation.onPause(); },
				elapsed: elapsed
			});
			return;
		} else {
			//this._log('_onTick: ' + elapsed);
			if (this.onBeforeUpdate) this.onBeforeUpdate(elapsed);
			if (this.currentScene.onBeforeUpdate) this.currentScene.onBeforeUpdate(elapsed);
			this._updateFrame(elapsed);
			if (this.currentScene.onAfterUpdate) this.currentScene.onAfterUpdate(elapsed);
			if (this.onAfterUpdate) this.onAfterUpdate(elapsed);
		}

		this.currentScene.animations = this.currentScene.animations.filter(function (e) { return e.time > elapsed; });
	}

	Kazari.Animation._updateFrame = function (elapsed) {
		this.currentScene.animations.forEach(function (e) {
			var value = (elapsed >= e.time) ? e.to : e.easing(elapsed, e.from, e.to - e.from, e.time);

			if (e.prefix) value = e.prefix + '' + value;
			if (e.suffix) value += '' + e.suffix;

			e.update(e.target, value);
		});
	}

	Kazari.Animation._log = function (s) {
		if (this.logging && window.console && console.log) console.log(s);
	}

	Kazari.Animation._start = function () {
		if (this.timer != null)
			clearInterval(this.timer);

		this.sceneStartTime = new Date().valueOf();
		this.timer = setInterval(function () { Kazari.Animation._onTick(); }, this.interval);
		Kazari.Animation._log('start: ' + this.sceneStartTime);
	}

	Kazari.Animation.onPause = function () {
		if (this.timer != null) {
			clearInterval(this.timer);
			this.timer = null;
		}
		Kazari.Animation._log('paused: ' + this.sceneStartTime);
	}

	Kazari.Animation._onNext = function () {
		this.currentScene = { animations: [] };
		if (this.timer == null) {
			this.timer = setInterval(function () { Kazari.Animation._onTick(); }, this.interval);
		}
		Kazari.Animation._log('_onNext: ' + this.sceneStartTime);
	}

	Kazari.Animation._retryAfter = function () {
		this.timer = setInterval(function () { Kazari.Animation._onTick(); }, this.interval);
		//Kazari.Animation._log('_retryAfter: ' + this.sceneStartTime);
	}

	Kazari.Animation._shutdown = function () {
		Kazari.Animation._log('shutdown: ' + new Date().valueOf());
		 
		if (this.timer != null) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	Kazari.Animation.initialize = function (options) {
		/// <summary>Initialize Animations<summary>
		/// <returns>Kazari.Animation</returns>
		options = options || {};
		this.queue = [];
		this.currentScene = { animations: [] };
		this.defaultEasing = options.defaultEasing || 'linear';
		this.onAfterUpdate = options.onAfterUpdate;
		this.onBeforeUpdate = options.onBeforeUpdate;
		this._shutdown();

		return this;
	}

	Kazari.Animation.addScene = function (scene) {
		/// <summary>Add a animation scene<summary>
		/// <param name="scene">a Scene object or Function</param>
		this.queue.push(scene);

		if (this.timer == null) {
			this._start();
		}

		return this;
	}

	Kazari.Animation.delay = function (value) {
		Kazari.Animation.addScene(function (state) {
			if (state.elapsed > value)
				state.onNext();
		});
		return this;
	}

	Kazari.Animation.newScene = function () {
		var sceneAnimations = [];
		var sceneFluent = {
			animate: function (target) {
				var animateCommon = {};
				var animateFluent = {
					property: function (propertyName) {
						var animateObj = { update: propertyName, target: target, time: animateCommon.time, suffix: animateCommon.suffix, easing: animateCommon.easing };
						return {
							to: function (value) {
								animateObj.to = value;
								return this;
							},
							from: function (value) {
								animateObj.from = value;
								return this;
							},
							easing: function (value) {
								animateObj.easing = value;
								return this;
							},
							time: function (value) {
								animateObj.time = value;
								return this;
							},
							suffix: function (value) {
								animateObj.suffix = value;
								return this;
							},
							end: function () {
								sceneAnimations.push(animateObj);
								return animateFluent;
							}
						};
					},
					suffix: function (value) {
						animateCommon.suffix = value;
						return this;
					},
					time: function (value) {
						animateCommon.time = value;
						return this;
					},
					easing: function (value) {
						animateCommon.easing = value;
						return this;
					},
					end: function () {
						return sceneFluent;
					}
				};
				return animateFluent;
			},
			end: function () {
				Kazari.Animation.addScene({ animations: sceneAnimations });
				return Kazari.Animation;
			}
		};

		return sceneFluent;
	}

	/* ------------------------------------------------------------------------- */
	Kazari.JSTweener = JSTweener;

	return Kazari;

});
