/**
 * @author lurenfake
 * @link http://www.lurenfake.com
 * 2010-12-12
 */
 define(function(require , exports , module){
 	
 	var $ =require('jquery');
 	
	var goToTop = function(elm , b){
		var b=$.extend({
			pageWidth:940,
			pageWGap:10,
			pageHGap:30,
			startline:20,
			duration:200,
			showBtntime:100
		},b);
			
		var e=$(elm);
		var f=$(window);
		var d=(window.opera)?(document.compatMode=="CSS1Compat"?$("html"):$("body")):$("html,body");
		
		var c=!($.browser.msie&&parseFloat($.browser.version)<7);
		var a=false;
		
		e.css({
			opacity:0,
			position:(c?"fixed":"absolute")
		});
		
		e.click(function(g){
			d.stop().animate({scrollTop:0},b.duration);
			e.blur();
			g.preventDefault();
			g.stopPropagation()
		});
		
		f.bind("scroll resize",function(i){
			var h;
			if(f.width()>b.pageHGap*2+b.pageWidth){
				h=(f.width()-b.pageWidth)/2+b.pageWidth+b.pageWGap
			}else {
				h=f.width()-b.pageWGap-e.width()
			}
			
			var j=f.height()-e.height()-b.pageHGap;
				j=c?j:f.scrollTop()+j;e.css({left:h+"px",top:j+"px"});
			
			var g=(f.scrollTop()>=b.startline)?true:false;
			
			if(g&&!a){e.stop().animate({opacity:1},b.showBtntime);a=true
				
			}else{
				if(a&&!g){
					e.stop().animate({opacity:0},b.showBtntime);
					a=false;
				}
			}
		})
	}
	
	return goToTop;

});
