define(function(require , exports , module){

	var $ = require('jquery');

	var StrokeManager = function (eventCaptureTarget, strokeEngine , options) {

		this.opts = options;

		this.eventCaptureTarget  = eventCaptureTarget;
		this.strokeEngine        = strokeEngine;
		this.timerObservable     = null;
		this.timerInterval       = 1000 /*/ 60*/;
		this.handElementSelector = this.opts.handImage;
		this.strokeHistory       = [];
		this.isHandVisible       = false;
		this.isInStroke          = false;
		this.strokeBeginTime     = null;
		this.isLocked            = false;

		this.stage = $(this.opts.stage);
	}

	StrokeManager.prototype.StrokeOperation = {
		Stroke    : 0,
		SetOpacity: 1,
		SetBrush  : 2
	}

	StrokeManager.prototype.lock = function () {
		this.isLocked = true;
	}

	StrokeManager.prototype.unlock = function () {
		this.isLocked = false;
	}

	StrokeManager.prototype.selectBrush = function (brushName , color) {
		if (this.isLocked) return;

		this.endStroke();

		this.strokeHistory.push({
			O: this.StrokeOperation.SetBrush,
			D: brushName
		});

		return this.strokeEngine.selectBrush(brushName , color);
	}

	StrokeManager.prototype.selectBrushColor = function (color) {
		if (this.isLocked) return;
		this.endStroke();
		return this.strokeEngine.selectBrushColor(color);
	}

	StrokeManager.prototype.getCurrentBrush = function () {
		return this.strokeEngine.getCurrentBrush().name;
	}

	StrokeManager.prototype.setBrushOpacity = function (value) {
		if (this.isLocked) return;

		this.endStroke();

		this.strokeHistory.push({
			O: this.StrokeOperation.SetOpacity,
			D: value
		});
		
		return this.strokeEngine.setBrushOpacity(value);
	}

	StrokeManager.prototype.getBrushOpacity = function () {
		return this.strokeEngine.getBrushOpacity();
	}

	StrokeManager.prototype.toDataURL = function () {
		return this.strokeEngine.toDataURL();
	}

	StrokeManager.prototype.clearHistory = function () {
		if (this.isLocked) return;

		this.endStroke();
		this.strokeHistory = [];
		this.strokeEngine.clear();

		// set current style to History
		this.setBrushOpacity(this.getBrushOpacity());
		this.selectBrush(this.getCurrentBrush());

		return this;
	}

	StrokeManager.prototype.beginStroke = function () {
		/// <summary>Begin state of one stroke</summary>
		/// <return>TheShodo.Shodo.StrokeManager</return>
		if (this.isLocked) return;

		this.endStroke();

		this.isInStroke = true;
		this.strokeBeginTime = new Date().valueOf();
		this.currentStroke = [];
		this.strokeEngine.beginStroke();

		return this;
	}

	StrokeManager.prototype.addStrokePosition = function (x, y) {
		/// <summary>Add stroke position to history and render</summary>
		/// <return>TheShodo.Shodo.StrokeManager</return>
		if (this.isLocked) return;
		
		var pos = { x: x, y: y, t: new Date().valueOf() - this.strokeBeginTime };
		this.currentStroke.push(pos);
		this.strokeEngine.addStrokePosition(pos);
		this.strokeEngine.draw();

		//console.log(pos.x + ', ' + pos.y);

		return this;
	}

	StrokeManager.prototype.endStroke = function () {
		if (this.isLocked) return;

		if (!this.isInStroke) return;

		this.strokeHistory.push({
			O: this.StrokeOperation.Stroke,
			D: this.currentStroke.map(function (e) { return { X:e.x, Y:e.y, T:e.t }; }) // convert format
		});
		this.isInStroke = false;
		this.currentStroke = null;
		this.strokeEngine.endStroke();

		return this;
	}

	StrokeManager.prototype.undoStroke = function () {
		if (this.isLocked) return;

		throw "NotSupported";

		this.strokeEngine.endStroke();
		this.strokeHistory.pop();
		this.currentStroke = null;
		this.strokeEngine.undoStroke();

		return this;
	}

	StrokeManager.prototype.start = function () {
		var handCanvasObject = $(this.eventCaptureTarget);
		var handCanvas = handCanvasObject.get(0);

		
		this.stage.live('mousemove', function(e) {
			handCanvasObject.trigger('mouseup', e);
		});

		var isMouseDown = false;
		var handE = $(this.handElementSelector);		

		var self = this;
		handCanvasObject
			.mousedown(function(e) {
				e.preventDefault();
				isMouseDown = true;

				var offset = $(this).offset();
				var x = e.pageX - offset.left;
				var y = e.pageY - offset.top;
				handE.css('top', y);
				handE.css('left', x);

				if (self.isHandVisible) {
					handE.find('img').hide();
					handE.find('img.'+self.strokeEngine.currentBrushName).show();
					handE.fadeIn('fast');
				}

				self.beginStroke();
			})
			.mousemove(function (e) {
				e.preventDefault(); e.stopPropagation();
				if (!isMouseDown) return;

				var offset = $(this).offset();
				var x = e.pageX - offset.left;
				var y = e.pageY - offset.top;

				self.addStrokePosition(x, y);

				handE.css('top', y);
				handE.css('left', x);
			})
			.mouseup(function(e) {
				e.preventDefault();
				if (!isMouseDown) return;
				isMouseDown = false;

				var offset = $(this).offset();
				var x = e.pageX - offset.left;
				var y = e.pageY - offset.top;

				self.endStroke();
				
				if (self.isHandVisible)
					handE.fadeOut('fast');
			})
		;
	}

	StrokeManager.prototype.startRx = function () {
		/// <summary></summary>
		/// <return>TheShodo.Shodo.StrokeManager</return>

		var self = this;

		// Observe Events
		$(this.eventCaptureTarget)
			.toObservable('mousedown')
			.Do(function (e) {
				e.preventDefault();
				// ストローク開始
				self.beginStroke();
			})
			.Select(function (e) {
				var offset = $(e.target).offset();
				return offset;
			})
			.SelectMany(function (offset) {
				return $(self.eventCaptureTarget)
							.toObservable('mousemove')
							//.Merge(Rx.Observable.Timer(0, self.timerInterval))
							.TakeUntil($(self.eventCaptureTarget).toObservable('mouseup'))
							.TakeUntil($('body').toObservable('mouseup'))
							.Select(function (e) {
								//var offset = $(e.target).offset();
								return {
									x: e.pageX - offset.left,
									y: e.pageY - offset.top
								};
							})
							.Finally(function (e) {
								self.endStroke();
							})
						;
			})
			.DistinctUntilChanged(function (v) { return v; }, function (a,b) { return a.x == b.x && a.y == b.y; })
			.Subscribe(function (pos) {
				self.addStrokePosition(pos.x, pos.y);
			})
		;

		return this;
	}

	return StrokeManager;
});