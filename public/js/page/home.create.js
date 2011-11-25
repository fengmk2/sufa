define(function(require , exports , module){
	
	var $ = require('jquery'), 
		Writer = require('sufa/Writer'), 
		$Colorbox = require('third/jquery.colorbox'), 
		rColorpicker = require('third/colorpicker');
		
		
	var $toolbars = $('#tools'),
		$brushPanel = $('#toolbtn-1'),
		$colorPanel = $('#toolbtn-2'),
		$opacityPanel = $('#toolbtn-3'),
		$cookbookPanel = $('#toolbtn-4'),
		$paperPanel = $('#toolbtn-5'),
		$color = $('#colorTools').find('.j_color'),
		savePanel = $('#savePanel'),
		defaultColor = '0,0,0',
		reg = /^#(.)\1(.)\2(.)\3$/,
		colorPicker = rColorpicker.colorpicker(40, 20, 300, defaultColor ,document.getElementById('colorTools')),
		getRgbStrByHsb = function(clr){
			var rgbClr = rColorpicker.getRGB(clr);
			return [rgbClr.r ,rgbClr.g ,rgbClr.b].join(',');
		},
		$composer = savePanel.find('textarea'),
		defaultTips = [
			CUSER.name + '使用了书法应用，你也来练练吧！！网址在这里：http://' + Global_Site.domain + '/',
			CUSER.name + '使用了书法应用，大家一起来发扬国粹把！网址在这里：http://' + Global_Site.domain + '/',
			CUSER.name + '使用了书法应用，不错哦！网址在这里：http://' + Global_Site.domain + '/',
			CUSER.name + '使用了书法应用，试试把！网址在这里：http://' + Global_Site.domain + '/',
			CUSER.name + '使用了书法应用，我挺喜欢的，推荐大家一起来试试 网址在这里：http://' + Global_Site.domain + '/',
			CUSER.name + '使用了书法应用，很给力哦 网址在这里：http://' + Global_Site.domain + '/'
		],
		toolbox = $('#tools-container').find('div.appbox'),
		isOnUpload = false,
		writer = null;
	
		
	module.exports = {
		init: function(id, options){
            var testCanvas = document.getElementById("testCanvas"); 
            if (!testCanvas.getContext){
                 window.location.href="http://"+Global_Site.domain+'/notSupport';
                 return;
            }
			writer = new Writer(id,options);
            this.saveWithOutBack = false;
			$color.val(defaultColor);
			writer.initialize();
			
			this.initBrushTool();
			this.initColorTool();
			this.initOpacityTool();
			this.initClearTool();
			this.initSaveTool();
			
			this.initCookbook();
			this._initPaperTool();
            $('#loading').hide();
            $('#bshare').show();    
		},
		initBrushTool : function(){
			$brushPanel.delegate('.j_brush','click' , function(){
				writer.getStrokenManager().selectBrush($(this).attr('brushname'),$color.val());
				toolbox.addClass('none');
			});		
		},
		initColorTool : function(){
			$colorPanel.delegate('.j_color','click' , function(){
				var clr = $(this).attr('color');
				$color.val(clr);
				writer.getStrokenManager().selectBrushColor(clr);
				toolbox.addClass('none');
			});	
		},
		initOpacityTool : function(){
			$opacityPanel.delegate('.j_opacity','click' , function(){
				var op = $(this).attr('opacity');
				writer.getStrokenManager().setBrushOpacity(op);
				toolbox.addClass('none');
			});	
		},
		initSaveTool : function(){
			//保存
			var hDw = 580 / 715, imgWidth = 200, imgHeight = parseInt(imgWidth * hDw,10) , wrapperWidth = imgWidth + 20,
				weiboName = Sufa.adaptWeiboName(CUSER.blogType) , self = this;
			
			savePanel.find('.j_tip').html('&nbsp;&nbsp;同时发到' + weiboName);
			
			$toolbars.find('a.j_save').colorbox({
				title: window.IsLogin ? "点击确定发到" + weiboName: "点击确定发表作品", 
				width:"400px", 
				inline:true, 
				href:"#savePanel" ,
				onOpen:function(){
                    self.saveWithOutBack = true;
					var imageData = writer.getStrokenManager().toDataURL(self.saveWithOutBack);
					savePanel.find('img').attr('src' , imageData).width(imgWidth).height(imgHeight);	
					$composer.val(defaultTips[Math.floor(Math.random()*defaultTips.length)]);
				}
			});      
            
            $toolbars.find('a.j_save_withback').colorbox({
    			title: window.IsLogin ? "点击确定发到" + weiboName: "点击确定发表作品", 
				width:"400px", 
				inline:true, 
				href:"#savePanel" ,
				onOpen:function(){
                    self.saveWithOutBack = false;
					var imageData = writer.getStrokenManager().toDataURL(self.saveWithOutBack);
					savePanel.find('img').attr('src' , imageData).width(imgWidth).height(imgHeight);	
					$composer.val(defaultTips[Math.floor(Math.random()*defaultTips.length)]);
				}
			});
          
			savePanel.delegate('.j_save','click' ,function(){
				self._saveWork();
			});	
		},
		initClearTool: function(){
			$toolbars.delegate('a.j_clear','click' ,function(){
				writer.clear();
			});
		},
		initCookbook : function(){
			$cookbookPanel.delegate('a.j_zhi','click' ,function(){
				if($(this).attr('zhi')!='none')
					writer.showCookbook($(this).attr('zhi'));
				else
					writer.hideCookbook();
				toolbox.addClass('none');
			});
		},
		_initPaperTool : function(){
			$paperPanel.delegate('a.j_paper','click' ,function(){
				writer.changePaper($(this).attr('index'));
				toolbox.addClass('none');
			});
		},
		_scaleDataUrl : function(scale , dataUrl){
			var img = new Image();
			img.src = dataUrl;
			
			var width = Math.round(scale * img.width);
			var height = Math.round(scale * img.height);
		
			var tmpCanvas = document.createElement('canvas');
			tmpCanvas.width = width;
			tmpCanvas.height = height;
			
			var ctx = tmpCanvas.getContext('2d');
			ctx.drawImage(img, 0, 0, width, height);
			return tmpCanvas.toDataURL();
		},
		_saveWork : function(){
			
			if(isOnUpload) return;
    			isOnUpload = true;
    			
			var val = $.trim($composer.val());
			if(val=='') {
				alert('多写几个字吧');	
				return;				
			}
            
            savePanel.find('.j_save').val('保存图片中，耐心等待一下吧');
            
			var sendData = writer.getStrokenManager().toDataURL(this.saveWithOutBack),
			    b64 = sendData.substring( 22 );  	
			 
			var smallData = this._scaleDataUrl(1/4,sendData),
				sb64 = smallData.substring( 22 );  	
			
			 $.ajax({
				type: 'POST',
				url: 'status',
				data: {pic:b64, spic: sb64 , status: val , twitter: savePanel.find('.j_check')[0].checked ? 1 : 0 },
				success: function (res, textStatus, xhr) {
					if(res.status==0) {
						alert(res.statusText);
                        writer.clear();
					}
					else {
				  		alert(res.statusText);
					}		
    				$Colorbox.colorbox.close();
    				isOnUpload = false;
                    savePanel.find('.j_save').val('确定');
				},
				error: function (xhr, textStatus, error) {
				 	alert('不好意思，网络貌似不太好，刷新后重试吧');
      				$Colorbox.colorbox.close();
     				isOnUpload = false;
                     savePanel.find('.j_save').val('确定');
				},
				dataType: 'json'
			 });
		}
	}
});
