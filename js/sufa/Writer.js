define(function(require , exports , module){

	var StrokeEngine = require('sufa/StrokeEngine'),
		StrokeManager = require('sufa/StrokeManager'),
		Kazari = require('sufa/Kazari'),
		$ = require('jquery'),
		SimpleTmpl = require('third/SimpleTmpl');

	var strokeEngine , strokeManager , 
		CanvasTmpl = ['<div class="sufa" style="width:<%=width%>px;height"<%=height%>px;" >',
							'<div class="stage"><img src="./images/hanshi.png" width="<%=width%>" height="<%=height%>"></div>',
							'<canvas id="<%=layerCanvas%>" class="layer" width="<%=width%>" height="<%=height%>"></canvas>',
							'<canvas id="<%=writeCanvas%>" class="writer" width="<%=width%>" height="<%=height%>"></canvas>',
							'<canvas id="<%=handCanvas%>" class="hand" width="<%=width%>" height="<%=height%>"></canvas>',	
							'<div class="hand-image-wrapper">',
								'<img class="Large" style="display:none;" height="563" width="374" src="./images/hand_L.png">',
								'<img class="Medium" style="display:none;" height="552" width="407" src="./images/hand_M.png">',
								'<img class="Small" style="display:none;" height="540" width="401" src="./images/hand_S.png">',
							'</div>',
						'</div'].join('');

	var Writer = function(renderTo , options){
		this.opts = $.extend({
			idPreffix : 'sufa_' ,
			tmpl : CanvasTmpl ,
			defaultBrush : 'Medium'
		},options);

		this.renderTo = renderTo;
	};

	Writer.prototype.prepareStage = function () {			   
		var obj = {
			width : 415 ,
			height : 498 ,
			layerCanvas : this.opts.idPreffix + '-layer' + new Date().getTime(),
			writeCanvas : this.opts.idPreffix + '_write' + new Date().getTime(),
			handCanvas : this.opts.idPreffix + '_hand' + new Date().getTime()
		};

		this.container = $(this.renderTo);
		this.container.html(SimpleTmpl(this.opts.tmpl , obj));

		this.layerCanvas = $('#'+obj.layerCanvas);
		this.writeCanvas = $('#'+obj.writeCanvas);
		this.handCanvas = $('#'+obj.handCanvas);

		this.stageImage = this.container.find('img.stage').get(0);
		this.handImage = this.container.find('div.hand-image-wrapper');
	}

	Writer.prototype.initialize = function () {
		this.prepareStage();
		this.initializeStrokeEngine();
	}

	Writer.prototype.initializeStrokeEngine = function () {
		var canvas = this.writeCanvas;
		var canvasE = this.writeCanvas.get(0);

		var layeredCanvas = this.layerCanvas;
		var layeredCanvasE = layeredCanvas.get(0);

		strokeEngine = new StrokeEngine(canvas, {
			compositedCanvas :layeredCanvasE ,
			defaultBrush : this.opts.defaultBrush
		});
		strokeEngine.backgroundImage = this.stageImage;

		strokeManager = new StrokeManager(this.handCanvas, strokeEngine ,{
			handImage : this.handImage ,
			stage : this.container
		});
		strokeManager.isHandVisible = true;
		strokeManager.start();
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