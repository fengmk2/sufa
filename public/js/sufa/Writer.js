define(function(require , exports , module){
	var StrokeEngine = require('sufa/StrokeEngine'),
		StrokeManager = require('sufa/StrokeManager'),
		Kazari = require('sufa/Kazari'),
		$ = require('jquery'),
		SimpleTmpl = require('third/SimpleTmpl');
	var strokeEngine , strokeManager , 
		CanvasTmpl = 'writer-tmpl';
	var Writer = function(renderTo , options){
		this.opts = $.extend({
			idPreffix : 'sufa_' ,
			tmpl : CanvasTmpl ,
			defaultBrush : 'Medium',
			bgWidth : 1024 ,
			bgHeight:  784,
			topGap : 110 ,
			width : 715 ,
			height : 580 ,
			toolEnable : false,
			paper: 1
		},options);
		this.renderTo = renderTo;
	};
	Writer.prototype.prepareStage = function () {	
		var obj = {
			width : this.opts.width ,
			height : this.opts.height ,
			bgWidth : this.opts.bgWidth ,
			bgHeight: this.opts.bgHeight ,
			layerCanvas : this.opts.idPreffix + '-layer' + new Date().getTime(),
			writeCanvas : this.opts.idPreffix + '_write' + new Date().getTime(),
			handCanvas : this.opts.idPreffix + '_hand' + new Date().getTime(),
			topGap : this.opts.topGap ,
			toolLeft : parseInt((this.opts.bgWidth - 375 )/2 ,10),
			//toolTop : parseInt(this.opts.bgHeight - 90 ,10)
			toolTop : 0 ,
			toolEnable : this.opts.toolEnable
		};
		this.container = $(this.renderTo);	
		this.container.append(SimpleTmpl(this.opts.tmpl , obj));
		this.paper = this.container.find('div.paper-wrapper');
		this.layerCanvas = $('#'+obj.layerCanvas);
		this.writeCanvas = $('#'+obj.writeCanvas);
		this.handCanvas = $('#'+obj.handCanvas);
		this.stageImage = this.container.find('img.stage');
		this.handImage = this.container.find('div.hand-image-wrapper');
		this.cookbook = this.container.find('div.cookbook-layer');
	}
		
	Writer.prototype.initialize = function () {
		this.prepareStage();
		this.initializeCookbook();
		this.initializeStrokeEngine();
		this.changePaper(this.opts.paper);
		
	}
	Writer.prototype.initializeCookbook = function () {
		var fontsize = 500;
		this.cookbook.css('width' , fontsize+ 'px')
			.css('height' ,this.opts.height+ 'px')
			.css('font-size' ,fontsize+ 'px');	
	}
	Writer.prototype.initializeStrokeEngine = function () {
		var canvas = this.writeCanvas;
		var canvasE = this.writeCanvas.get(0);
		var layeredCanvas = this.layerCanvas;
		var layeredCanvasE = layeredCanvas.get(0);
		strokeEngine = new StrokeEngine(canvas, {
			compositedCanvas :layeredCanvasE ,
			defaultBrush : this.opts.defaultBrush ,
			stageImage : this.stageImage
		});
		strokeEngine.backgroundImage = this.stageImage;
		strokeManager = new StrokeManager(this.handCanvas, strokeEngine ,{
			handImage : this.handImage ,
			stage : this.container
		});
		strokeManager.isHandVisible = true;
		strokeManager.start();
	}
	Writer.prototype.getStrokenManager = function(){
		return strokeManager;
	}
	Writer.prototype.showCookbook = function(word){
		word = word || ' ';
		word = word[0];
		this.cookbook.fadeIn('fast').find('span').html(word);
		return this;
	}
	
	Writer.prototype.changePaper = function(index){
		var url = 'http://' + Global_Site.domain + '/images/bg-' + index + '.jpg';
		this.paper.css('background-image' ,'url('+ url + ')');
		this.stageImage.attr('src', url);
		this.paper.data('data-url' , url);
	}
	Writer.prototype.hideCookbook = function(){
		this.cookbook.fadeOut('fast');
		return this;
	}
	Writer.prototype.clear = function () {
		strokeManager.lock();
		var layeredE = this.layerCanvas.get(0);
		var maxSize = 1;
		var initSize = 1;
		var duration = 300;
		var canvas = layeredE;
		var ctx = canvas.getContext('2d');
		// "syuwa-syuwa-" effect animation
		var currentImage = strokeEngine.getImage(true);
		Kazari.Animation.initialize()
			.addScene(function (state) {
				var easing = Kazari.JSTweener.easingFunctions.easeOutQuad;
				if (state.elapsed > duration) {
					state.onNext();
					return;
				}
				ctx.save();
				ctx.globalAlpha = 0.1;
				var value = (state.elapsed >= duration) ? maxSize : easing(state.elapsed, 0, maxSize, duration);
	//            ctx.drawImage(currentImage,
	//                          0, 0, canvas.width, canvas.height, /* src */
	//                          0-value/2, 0-value/2, canvas.width + value, canvas.height + value /* dst */);
				[0, -value, value].forEach(function (left) {
					[0, -value, value].forEach(function (top) {
						ctx.drawImage(currentImage,
									  0, 0, canvas.width, canvas.height, /* src */
									  top, left, canvas.width, canvas.height /* dst */);
					});
				});
				ctx.restore();
				
				// Opacity: 1 -> 0
				var opacity = (state.elapsed >= duration) ? 0 : easing(state.elapsed, 1, 0 - 1, duration);
				canvas.style.opacity = opacity;
			})
			.addScene(function (state) {
				strokeManager.unlock();
				strokeManager.clearHistory();
				canvas.style.opacity = 1;
				state.onNext();
			})
		;
	}
	return Writer;
});
