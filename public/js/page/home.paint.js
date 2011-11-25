define(function(require , exports , module){
	
	var $ = require('jquery'), 
		Writer = require('sufa/Writer'), 
		$Colorbox = require('third/jquery.colorbox'), 
		rColorpicker = require('third/colorpicker');
	
	module.exports = {
		init: function(id , options){
			var writer = new Writer(id,options),
					$brushPanel = $('#brushTools'),
					$color = $('#colorTools').find('.j_color'),
					$opacityPanel = $('#opacityTools'),
					defaultColor = '#000',
					reg = /^#(.)\1(.)\2(.)\3$/,
					colorPicker = rColorpicker.colorpicker(40, 20, 300, defaultColor ,document.getElementById('colorTools')),
					getRgbStrByHsb = function(clr){
						var rgbClr = rColorpicker.getRGB(clr);
						return [rgbClr.r ,rgbClr.g ,rgbClr.b].join(',');
					},
					savePanel = $('#savePanel'),
					$composer = savePanel.find('textarea'),
					defaultTips = CUSER.name + ' 用在线书法写了一个字，大家一起来发扬国粹吧，书法、国画要多加练习啊... ';
					
				$color.val(defaultColor);
				
				writer.initialize();
				$brushPanel.delegate('.j_brush','click' , function(){
					writer.getStrokenManager().selectBrush($(this).attr('brushname'),getRgbStrByHsb($color.val()));
					$Colorbox.colorbox.close();
				});	
				$opacityPanel.delegate('.j_opacity','click' , function(){
					var op = $(this).attr('opacity');
					writer.getStrokenManager().setBrushOpacity(op);
					$Colorbox.colorbox.close();
				});	
				//笔
				$Colorbox('#write-paper').find('input.bi').colorbox({width:"630px", inline:true, href:"#brushTools"});
	
				//墨
				$Colorbox('#write-paper').find('input.mo').colorbox({width:"380px", inline:true, href:"#colorTools",onOpen:function(){
					colorPicker.color($color.val());
				}});
				//纸
				$Colorbox('#write-paper').find('input.zhi').bind('click' ,function(){
					writer.clear();
				});
				//砚
				$Colorbox('#write-paper').find('input.yan').colorbox({width:"240px", inline:true, href:"#opacityTools"});
				$('#colorTools').find('.j_confirm').click(function(){
					var clr = colorPicker.color();
					$color.val(clr);
					writer.getStrokenManager().selectBrushColor(getRgbStrByHsb(clr));
					$Colorbox.colorbox.close();
				});
				//save
				var hDw = 715 / 580 , imgWidth = 100, imgHeight = parseInt(imgWidth * hDw,10) , wrapperWidth = imgWidth + 20;
				$Colorbox('#write-paper').find('input.save').colorbox({title:"点击确定发到新浪微博" , width:"400px", inline:true, href:"#savePanel" ,onOpen:function(){
					savePanel.find('img').attr('src' , writer.getStrokenManager().toDataURL('image/png')).width(imgWidth).height(imgHeight);
					$composer.val(defaultTips);
				},onClosed:function(){
				}});
                
                var isOnUpload = false;
				savePanel.find('.j_save').bind('click' ,function(){
                    
                    			if(isOnUpload) return;
                    			isOnUpload = true;

					var val = $.trim($composer.val());
					if(val=='') {
						alert('多写几个字吧');	
						return;				
					}
					
					var sendData = writer.getStrokenManager().toDataURL('image/png'),
					    b64 = sendData.substring( 22 );  
					 $.ajax({
						type: 'POST',
						url: 'ajaxUpload/pic',
						data: {pic:b64, status: val},
						success: function (res, textStatus, xhr) {
							if(res.status==0) {
								alert('发表微博成功，书法要多加练习哦');
                                				writer.clear();
							}
							else {
    						  		var err = res.data.message.message.split(':'),
                                  					code = err[0],
                                  					msg = err[1];
                                  
                      				if(code == '40028')
                        					alert( msg + '小提示：可能发的内容重复了，微博内容修改一下，再发试试吧！！' );
                      				else
                         					alert(msg);
							}		
                            				$Colorbox.colorbox.close();
                            				isOnUpload = false;
						},
						error: function (xhr, textStatus, error) {
						 	 alert('不好意思，网络貌似不太好，刷新后重试吧');
                              				$Colorbox.colorbox.close();
                             				isOnUpload = false;
						},
						dataType: 'json'
					 });
				});
		}
	}
});

