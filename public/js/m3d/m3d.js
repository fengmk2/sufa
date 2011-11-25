/**
 * @fileoverview  3d个人简历展示
 * @author        script written by Gerard Ferrandez - http://www.dhteumeuleu.com/  
 * @version  			0.1
 * @modifed       hpf1908@gmail.com
 */
define(function () { 
	// ---- private vars ---- 
	var 
		ctx, 
		points, 
		faces, 
		nPoints, 
		nFaces, 
		scene, 
		wireframe, 
		vRotationEnabled = true, 
		targetImage, 
		imageOver, 
		imageOverBak, 
		background, 
		screen = {}, 
		imageMap={},      //图片map缓存
		canSelect=false;
		canMove=false;
		mouse = { 
			mov: -5 
		}, 
		fps = 0, 
		npoly = 0;
		 
	// ---- 摄像机相关参数对象 ---- 
	var camera = { 
		x: 0, 
		z: 0, 
		angleTargetX: 0, 
		angleTargetZ: 0, 
		angleH: 0, 
		angleV: 0, 
		focalLength: 500 
	}; 
	/*  
	 * 主循环线程
	 */ 
	var run = function () { 
		//摄像机坐标变换
		camera.movements(); 
		
		// 背景渐变
		if (vRotationEnabled || !background) { 
			var horizon = 0.5 + camera.angleV * 1.2; 
			if (horizon < 0) horizon = 0; else if (horizon > 1) horizon = 1; 
			background = ctx.createLinearGradient(0, 0, 0, screen.h); 
			background.addColorStop(0, scene.ceilingColor); 
			background.addColorStop(horizon, scene.horizonColor); 
			background.addColorStop(horizon, scene.horizonColor); 
			background.addColorStop(1, scene.groundColor); 
		} 
		// 填充背景
		ctx.fillStyle = background; 
		ctx.fillRect(0, 0, screen.w, screen.h); 
		var i = nPoints; 
		
		//3D到2D的透视投影
		while( i-- ) points[i].projection(); 
		// ---- compute faces ---- 
		imageOver = false; 
		i = nFaces; 
		
		//重新计算各个图形单位，进行平面着色
		while( i-- ) faces[i].compute(); 
		
		//z轴排序
		faces.sort(function (p0, p1) { 
			return p1.zIndex - p0.zIndex; 
		}); 
		
		//调整z轴显示顺序并绘制
		for (var i = 0, p; p = faces[i++];) p.visible && p.draw(); 
		
		//鼠标样式切换
		if (!imageOverBak) { 
			if (imageOver) screen.div.style.cursor = "pointer"; 
		} else if (!imageOver) { 
			screen.div.style.cursor = "default"; 
		} 
		imageOverBak = imageOver; 
		
		// 完成一帧的绘制 
		fps++; 
		setTimeout(run, 16); 
	}; 
 
	/*摄像机变换和旋转*/ 
	camera.movements = function () { 
		// ---- translation ---- 
		this.x += (this.targetX - this.x) * .05; 
		this.z += (this.targetZ - this.z) * .05; 
		this.normalLength = Math.sqrt(this.x * this.x + this.z * this.z); 
		// ---- Y axis Rotation ---- 
		var angleH = ( 
			(mouse.mov > 0 ? ((mouse.x - mouse.xd) / screen.md) : 0) + 
			Math.atan2(this.angleTargetX - this.x, this.angleTargetZ - this.z) 
		) % (2 * Math.PI); 
		// ---- normalize quadran ---- 
		if (Math.abs(angleH - this.angleH) > Math.PI) { 
			if (angleH < this.angleH)  this.angleH -= 2 * Math.PI; 
			else this.angleH += 2 * Math.PI; 
		} 
		// ---- easing and trigo ---- 
		this.angleH += (angleH - this.angleH) * 0.1; 
		this.cosh = Math.cos(this.angleH); 
		this.sinh = Math.sin(this.angleH); 
		// ---- X axis Rotation ---- 
		if (vRotationEnabled) { 
			this.angleV += (((screen.mh - mouse.y) * 0.002) - this.angleV) * 0.1; 
			this.cosv = Math.cos(this.angleV); 
			this.sinv = Math.sin(this.angleV); 
		} 
	}; 
 
	/* 三维点类定义 */ 
	var Point = function (x, y, z, tx, ty) { 
		this.x  = x; 
		this.y  = y; 
		this.z  = z; 
		this.tx = tx; 
		this.ty = ty; 
		this.projection(); 
	}; 
 
	/* ==== bisection constructor ==== */ 
	var Bisection = function (p0, p1) { 
		this.x  = (p1.x  + p0.x)  * 0.5; 
		this.y  = (p1.y  + p0.y)  * 0.5; 
		this.z  = (p1.z  + p0.z)  * 0.5; 
		this.tx = (p1.tx + p0.tx) * 0.5; 
		this.ty = (p1.ty + p0.ty) * 0.5; 
		this.projection(); 
	}; 
 
	/*  
	 * 3D 投影映射到2D的点
	 */ 
	Point.prototype.projection = Bisection.prototype.projection = function () { 
		//3D摄像头调整 
		var nx = this.x - camera.x; 
		var nz = this.z - camera.z; 
		//水平坐标变换
		var  tx = camera.cosh * nx - camera.sinh * nz; 
		this.zp = camera.sinh * nx + camera.cosh * nz; 
		if (vRotationEnabled) { 
			
			// ---- vertical rotation enabled ---- 
			var ty  = camera.cosv * this.y - camera.sinv * this.zp; 
			this.zp = camera.sinv * this.y + camera.cosv * this.zp; 
		} else { 
			// ---- vertical rotation disabled ---- 
			ty = this.y; 
		} 
		// 实现2D的投影
		this.scale = camera.focalLength / Math.max(1, this.zp); 
		this.xp = screen.mw + tx * this.scale; 
		this.yp = screen.mh - ty * this.scale; 
	}; 
 
	/* 添加新的三维点 */ 
	var addPoint = function(x, y, z, tx, ty) { 
		var i = 0, p; 
		while (p = points[i++]) { 
			if (x == p.x && y == p.y && z == p.z) return p; 
		} 
		nPoints++; 
		points.push(p = new Point(x, y, z, tx, ty)); 
		return p; 
	}; 
 
	/* 3D图像构造函数 */ 
	var ProjectedImage = function (face, p) { 
		for (var i in p) this[i] = p[i]; 
		this.face = face; 
		this.targetX = this.x + Math.cos(this.angle / 180 * Math.PI) * this.distView; 
		this.targetZ = this.z + Math.sin(this.angle / 180 * Math.PI) * this.distView; 
		this.srcImg = new Image(); 
		
		if(scene.projectImageWidth && scene.projectImageHeight){
			this.srcImg.width = scene.projectImageWidth;
			this.srcImg.height = scene.projectImageHeight;
		}
		this.srcImg.src = scene.imagesPath + p.src; 
		this.pc = new Point(this.x, this.y, this.z); 
	}; 
 
	/*选择目标图片，修改target位置做动画 */ 
	ProjectedImage.prototype.select = function () { 
		targetImage         = imageOver; 
		camera.targetX      = targetImage.targetX; 
		camera.targetZ      = targetImage.targetZ; 
		camera.angleTargetX = targetImage.x; 
		camera.angleTargetZ = targetImage.z; 
		mouse.mov = -5; 
		mouse.xd  = mouse.x; 
	}; 
 
	/* ==== loading image ==== */ 
	ProjectedImage.prototype.loading = function () { 
		if (this.srcImg.complete) { 
			this.face.image = this; 
			this.face.preImage = false; 
			//计算图片大小
			var zoom = this.zoom || 1; 
			var tw = this.srcImg.width  * zoom * 0.5; 
			var th = this.srcImg.height * zoom * 0.5; 
			// 创建图像四个点对应坐标系的位置
			var dx = Math.sin(this.angle / 180 * Math.PI); 
			var dz = Math.cos(this.angle / 180 * Math.PI); 
			this.p0 = addPoint(this.x + (tw * dx), this.y + th, this.z - (tw * dz), 0, 0); 
			this.p1 = addPoint(this.x - (tw * dx), this.y + th, this.z + (tw * dz), this.srcImg.width, 0); 
			this.p2 = addPoint(this.x - (tw * dx), this.y - th, this.z + (tw * dz), this.srcImg.width, this.srcImg.height); 
			this.p3 = addPoint(this.x + (tw * dx), this.y - th, this.z - (tw * dz), 0, this.srcImg.height); 
		} 
	}; 
 
/* ==== draw projected image ==== */ 
	ProjectedImage.prototype.draw = function () { 
		var image = this.srcImg, k = 0; 
		/* ==== recursive triangulation ===== */ 
		var triangulate = function (p0, p1, p2, level) { 
			if (--level === 0) { 
				var ox = offsetX[k]; 
				var oy = offsetY[k++]; 
				// ---- clipping ---- 
				ctx.save(); 
				ctx.beginPath(); 
				ctx.moveTo(Math.round(p0.xp + ox), Math.round(p0.yp + oy)); 
				ctx.lineTo(Math.round(p1.xp + ox), Math.round(p1.yp + oy)); 
				ctx.lineTo(Math.round(p2.xp + ox), Math.round(p2.yp + oy)); 
				ctx.clip(); 
				// ---- transform ---- 
				var d = p0.tx * (p2.ty - p1.ty) - p1.tx * p2.ty + p2.tx * p1.ty + (p1.tx - p2.tx) * p0.ty; 
				ctx.transform( 
					-(p0.ty * (p2.xp - p1.xp) -  p1.ty * p2.xp  + p2.ty *  p1.xp + (p1.ty - p2.ty) * p0.xp) / d, // m11 
					 (p1.ty *  p2.yp + p0.ty  * (p1.yp - p2.yp) - p2.ty *  p1.yp + (p2.ty - p1.ty) * p0.yp) / d, // m12 
					 (p0.tx * (p2.xp - p1.xp) -  p1.tx * p2.xp  + p2.tx *  p1.xp + (p1.tx - p2.tx) * p0.xp) / d, // m21 
					-(p1.tx *  p2.yp + p0.tx  * (p1.yp - p2.yp) - p2.tx *  p1.yp + (p2.tx - p1.tx) * p0.yp) / d, // m22 
					 (p0.tx * (p2.ty * p1.xp  -  p1.ty * p2.xp) + p0.ty * (p1.tx *  p2.xp - p2.tx  * p1.xp) + (p2.tx * p1.ty - p1.tx * p2.ty) * p0.xp) / d, // dx 
					 (p0.tx * (p2.ty * p1.yp  -  p1.ty * p2.yp) + p0.ty * (p1.tx *  p2.yp - p2.tx  * p1.yp) + (p2.tx * p1.ty - p1.tx * p2.ty) * p0.yp) / d  // dy 
				); 
				if (wireframe) { 
					// ---- wireframe mode ---- 
					ctx.closePath(); 
					ctx.strokeStyle = "#fff"; 
					ctx.stroke(); 
				} else { 
					if(scene.projectImageWidth && scene.projectImageHeight){
						ctx.drawImage(image, 0, 0 , scene.projectImageWidth ,scene.projectImageHeight); 
					} else 
						ctx.drawImage(image, 0, 0); 	
				} 
				ctx.restore(); 
				npoly++; 
			} else { 
				// ---- subdivision ---- 
				var p3 = new Bisection(p0, p1); 
				var p4 = new Bisection(p1, p2); 
				var p5 = new Bisection(p2, p0); 
				// ---- recursive call ---- 
				triangulate(p0, p3, p5, level); 
				triangulate(p3, p1, p4, level); 
				triangulate(p5, p4, p2, level); 
				triangulate(p5, p3, p4, level); 
			} 
		}; 
		// ---- distance from camera ---- 
		var dx = this.pc.x - camera.x; 
		var dz = this.pc.z - camera.z; 
		var dist = Math.sqrt(dx * dx + dz * dz); 
		// ---- adapt tessellation quality ---- 
		if (dist > 1000) { 
			// ---- 8 triangles ---- 
			var level = 2; 
			var offsetX = [1,-1,-1,0,2,0,2,1]; 
			var offsetY = [2,2,0,1,1,-1,-1,0]; 
		} else { 
			// ---- 32 triangles ---- 
			var level = 3; 
			var offsetX = [3,1,1,2,-1,-3,-3,-2,-1,-3,-3,-2,0,0,-2,-1,4,2,4,3,0,-2,0,-1,4,2,4,3,3,1,1,2]; 
			var offsetY = [4,4,2,3,4,4,2,3,0,0,-2,-1,1,3,1,2,3,1,1,2,-1,-3,-3,-2,-1,-3,-3,-2,0,0,-2,-1]; 
		} 
		// ---- start triangulation ---- 
		triangulate(this.p0, this.p1, this.p2, level); 
		triangulate(this.p0, this.p2, this.p3, level); 
		// ---- on mouse over ---- 
		(mouse.y > Math.min(this.p0.yp, this.p1.yp)) && (mouse.y < Math.max(this.p2.yp, this.p3.yp)) && 
		(mouse.x > Math.min(this.p0.xp, this.p3.xp)) && (mouse.x < Math.max(this.p1.xp, this.p2.xp)) && (imageOver = this); 
	}; 
 
///////////////////////////////////////////////////////////////////////////////////// 
	/* ==== surface constructor ==== */ 
	var Surface = function (p) { 
		// ---- properties ---- 
		for (var i in p) this[i] = p[i]; 
		if (!this.shadingLight) this.shadingLight = scene.shadingLight; 
		this.alpha = this.fillColor.alpha || 1; 
		this.nP = p.x.length; 
		if (this.nP < 3 || this.nP > 4) alert("ERROR: triangles or rectangles only"); 
		// ---- tri/quad points ---- 
		this.p0 = addPoint(p.x[0], p.y[0], p.z[0]); 
		this.p1 = addPoint(p.x[1], p.y[1], p.z[1]); 
		this.p2 = addPoint(p.x[2], p.y[2], p.z[2]); 
		if (this.nP == 4) this.p3 = addPoint(p.x[3], p.y[3], p.z[3]); 
		// ---- normal vector for flat shading ---- 
		this.normalX = ((this.p1.y - this.p0.y) * (this.p2.z - this.p0.z)) - ((this.p1.z - this.p0.z) * (this.p2.y - this.p0.y)); 
		this.normalY = ((this.p1.z - this.p0.z) * (this.p2.x - this.p0.x)) - ((this.p1.x - this.p0.x) * (this.p2.z - this.p0.z)); 
		this.normalZ = ((this.p1.x - this.p0.x) * (this.p2.y - this.p0.y)) - ((this.p1.y - this.p0.y) * (this.p2.x - this.p0.x)); 
    this.normalLength = Math.sqrt(this.normalX * this.normalX + this.normalY * this.normalY + this.normalZ * this.normalZ); 
		// ---- create attached image ---- 
		if (this.image) { 
			this.preImage = new ProjectedImage(this, this.image); 
			
			//save imageMap
			imageMap[this.image.src]=this.preImage;
			this.image = false; 
		} 
		// ---- create custom function ---- 
		this.createFunction(); 
		nFaces++; 
	}; 
 
	/* ==== draw shapes ==== 
	 * 绘制表面
	 */ 
	Surface.prototype.draw = function () { 
		npoly++; 
		// ---- shape ---- 
		ctx.beginPath(); 
		ctx.moveTo(this.p0.xp - 0.5, this.p0.yp); 
		ctx.lineTo(this.p1.xp + 0.5, this.p1.yp); 
		ctx.lineTo(this.p2.xp + 0.5, this.p2.yp); 
		if (this.p3) ctx.lineTo(this.p3.xp - 0.5, this.p3.yp); 
		if (wireframe) { 
			// ---- wireframe mode ---- 
			ctx.closePath(); 
			ctx.strokeStyle = "#fff"; 
			ctx.stroke(); 
		} else { 
			// ---- fill shape ---- 
			ctx.fillStyle = "rgba(" + 
				Math.round(this.fillColor.r * this.light) + "," + 
				Math.round(this.fillColor.g * this.light) + "," + 
				Math.round(this.fillColor.b * this.light) + "," + this.alpha + ")"; 
			ctx.fill(); 
		} 
		// ---- draw image ---- 
		this.image && this.image.draw(); 
		// ---- href (door) on mouse over ---- 
		(this.href) && (mouse.y > Math.min(this.p0.yp, this.p1.yp)) && (mouse.y < Math.max(this.p2.yp, this.p3.yp)) && 
		(mouse.x > Math.min(this.p0.xp, this.p3.xp)) && (mouse.x < Math.max(this.p1.xp, this.p2.xp)) && (imageOver = this); 
	}; 
 
	/* ==== z buffering, flat shading ==== */ 
	Surface.prototype.compute = function () { 
		// ---- average z-index ---- 
		this.zIndex = (this.p0.zp + this.p1.zp + this.p2.zp + (this.p3 ? this.p3.zp : 0)) / this.nP; 
		if (this.zIndex > -200) { 
			// ---- back face culling ---- 
			if (this.alwaysVisible || ((this.p1.yp - this.p0.yp) / (this.p1.xp - this.p0.xp) < (this.p2.yp - this.p0.yp) / (this.p2.xp - this.p0.xp) ^ this.p0.xp < this.p1.xp == this.p0.xp > this.p2.xp)) { 
				// ---- visible face ---- 
				this.visible = true; 
				this.zIndex += this.zIndexOffset || 0; 
				// ---- load image ---- 
				this.preImage && this.preImage.loading(); 
				// ---- run custom function ---- 
				this.run && this.run(); 
				// ---- flat shading ---- 
				this.light = this.noShading ? 1 : scene.ambientLight + Math.abs(this.normalZ * camera.cosh - this.normalX * camera.sinh) * this.shadingLight / (camera.normalLength * this.normalLength); 
			} else this.visible = false; 
		} else this.visible = false; 
	}; 
 
	/* ==== sprite constructor ==== */ 
	var Sprite = function (p) { 
		for (var i in p) this[i] = p[i]; 
		this.pc = addPoint(p.x, p.y, p.z); 
		// ---- create canvas image ---- 
		this.srcImg = new Image(); 
		this.srcImg.src = scene.imagesPath + p.src; 
		this.createFunction(); 
		nFaces++; 
	}; 
 
	/* ==== draw sprite ==== */ 
	Sprite.prototype.draw = function () { 
		npoly++; 
		this.run && this.run(); 
		var w = this.w * this.pc.scale; 
		var h = this.h * this.pc.scale; 
		ctx.drawImage(this.srcImg, this.pc.xp - w * 0.5, this.pc.yp - h * 0.5, w, h); 
	}; 
 
	/* ==== z buffering, loading sprite ==== */ 
	Sprite.prototype.compute = function () { 
		if (this.isLoaded) { 
			// ---- z-index ---- 
			if (this.pc.zp > -200) { 
				this.zIndex  = (this.zIndexOffset || 0) + this.pc.zp; 
				this.visible = true; 
			} else this.visible = false; 
		} else { 
			if (this.srcImg.complete) { 
				// ---- load image ---- 
				this.isLoaded = true; 
				this.w = this.srcImg.width  * this.zoom; 
				this.h = this.srcImg.height * this.zoom; 
			} 
		} 
	}; 
 
	/* ==== create custom objects function ==== */ 
	Sprite.prototype.createFunction = Surface.prototype.createFunction = function () { 
		if (this.code) { 
			if (this.code.init) { 
				// ---- compile and execute init() function ---- 
				this.init = new Function(this.code.init); 
				this.init(); 
			} 
			// ---- compile run() function ---- 
			if (this.code.run) this.run  = new Function(this.code.run); 
		} 
	}; 
 
	//////////////////////////////////////////////////////////////////////////// 
 
	/* ===== copy JS object ==== */ 
	var cloneObject = function (obj) { 
		if (typeof(obj) != "object" || obj == null) return obj; 
		var newObj = obj.constructor(); 
		for (var i in obj) newObj[i] = cloneObject(obj[i]); 
		return newObj; 
	}; 
 
	/* ==== loading geometry file ==== */ 
	// assuming native XHR and JSON.parse support 
	var loadGeometry = function (href) { 	
		var s = document.createElement("script");
		s.type = 'text/javascript';
		s.src = href;
		document.getElementsByTagName('head')[0].appendChild(s);
	}; 
 
	/* ==== screen dimensions ==== */ 
	var resize = function () { 
		screen.w  = screen.div.offsetWidth; 
		screen.h  = screen.div.offsetHeight; 
		screen.md = screen.w / Math.PI * 0.5; 
		screen.mw = screen.w / 2; 
		screen.mh = screen.h / 2; 
		mouse.y   = screen.mh; 
		// ---- canvas size and position ---- 
		screen.canvas.width  = screen.w; 
		screen.canvas.height = screen.h; 
		var o = screen.div; 
		for (screen.x = 0, screen.y = 0; o != null; o = o.offsetParent) { 
			screen.x += o.offsetLeft; 
			screen.y += o.offsetTop; 
		} 
	}; 
 
	/* ==== init geometry ==== */ 
	var initGeometry = function (geometry , works) { 
		var data   = geometry; 
		nPoints = 0; 
		nFaces  = 0; 
		points  = []; 
		faces   = []; 
		scene   = data.params; 
		// ---- create surfaces ---- 
		var i = 0, p , imgIndex =0;
		while (p = data.geometry[i++]) { 
			// ---- push object geometry ---- 
			if(p.image) {
				p.image.src = works[imgIndex++].path;
				//p.image.src = 'images/bg-2.jpg';
			}
			
			if (p.type == "poly") faces.push(new Surface(p)); 
			else if (p.type == "sprite") faces.push(new Sprite(p)); 
			else if (p.type == "object") { 
				// ---- object reference ---- 
				var o = data.objects[p.ref]; 
				for (var j = 0; j < o.length; j++) { 
					var c = cloneObject(o[j]); 
					for (var k in p) if (!c[k]) c[k] = p[k]; 
					for (var k = 0; k < c.x.length; k++) { 
						c.x[k] += p.x; 
						c.y[k] += p.y; 
						c.z[k] += p.z; 
					} 
					// ---- push object geometry ---- 
					faces.push(new Surface(c)); 
				} 
			} 
		} 
	}; 
	
	var changeScence=function(){
		resize(); 
		camera.angleTargetX = 0; 
		camera.angleTargetZ = 10000; 
		camera.targetX = scene.targetX || 0; 
		camera.targetZ = scene.targetZ || 0; 
		camera.angleH = camera.angleH - Math.PI; 
		mouse.mov = -3; 
		mouse.xd  = mouse.x; 		
	}
	
	var startRun=function(){
		resize(); 
		onresize = resize; 
	
		screen.div.onmousemove = function (e) {
			if(!canMove) return; 
			if (window.event) e = window.event; 
			mouse.x = e.clientX - screen.x; 
			mouse.y = e.clientY - screen.y; 
			mouse.mov++; 
		}; 
			
		screen.div.onclick = function () { 
			if (imageOver && canSelect) { 
				if (imageOver.href) { 
					var href = imageOver.href; 
					camera.targetX  = imageOver.exitX; 
					camera.targetZ  = imageOver.exitZ; 
					setTimeout(function() { 
						//loadGeometry(href);
					}, 500); 
				} else {						
					imageOver.select(); 
				}
			} 
		} 
		mouse.x        = screen.w / 2; 
		mouse.xd       = mouse.x; 
		camera.x       = scene.startX || 0; 
		camera.z       = scene.startZ || 0; 
		camera.targetX = scene.targetX || 0; 
		camera.targetZ = scene.targetZ || 0; 
		setInterval(function () { 
			document.getElementById('fps').innerHTML = fps * 2; 
			document.getElementById('npoly').innerHTML = npoly * 2; 
			fps = 0; 
			npoly = 0; 
		}, 500); 
		run(); 
		currentImage=0;
			
		/*进行轮询ppt展示
		var ppt=function(){		
				 
			currentImage++;	
			var image=imageMap['r'+currentImage+'.jpg'];
			if(image){
				imageOver=image;
				imageOver.select();
			}		
			if(currentImage<=13)
				setTimeout(ppt,10000);
			else {
				canSelect=true;
				canMove=true;
			}
		}	
			
		setTimeout(function(){
			ppt();
		},3000);
		*/
		canSelect=true;
		canMove=true;
	}
 
	var init = function (geoDatas , works) { 
		initGeometry(geoDatas , works); 
		if(geoDatas.type==0){
			screen.div = document.getElementById("screen"); 
			screen.canvas = document.getElementById("canvas"); 
			ctx = screen.canvas.getContext("2d"); 
			startRun();
		}
		else
			changeScence();	
	}; 
 
	//////////////////////////////////////////////////////////////////////////// 
	return { 
		init: init
	} 
}); 