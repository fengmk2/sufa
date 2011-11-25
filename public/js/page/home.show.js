define(function(require , exports , module){
	
	var $ = require('jquery') , 
		$Colorbox = require('third/jquery.colorbox'), 
		SimpleTmpl = require('third/SimpleTmpl') , 
		MoreDataLoader = require('components/MoreDataLoader'),
		page = 1 , 
		pageNum = 20;
	
	module.exports = {
		init: function(options){
            var first = true;
			var opts = $.extend({
				usersTmpl : 'usersTmpl',
				worksTmpl : 'worksTmpl',
                callback : function(works){
                    if(first) {
	                    $('#goTop').show();
	                    $('#loading').hide();
                        $('#bshare').show();
	                    first = false;
                    }
                    if(!works) return;
                    works.each(function(){
                    	$(this).find('img.j_work').bind('load' , function(){
                    		$(this).removeClass('j_work').prev().remove();
                    	});
                    });
                }
			},options);
			/*
			$.ajax({
				type: 'get',
				url: 'getUsers',
				data: {page: 1, pageNum: pageNum},
				success: function (res, textStatus, xhr) {
					if(res.status==0) {
						var html = SimpleTmpl(opts.usersTmpl , {users : res.data });
						$('#profile').hide().append(html).fadeIn('slow');
					}
					else {
				  		var err = res.data.message.message.split(':'),
	                  		code = err[0],
	                  		msg = err[1];
             			alert(msg);
					}		
				},
				error: function (xhr, textStatus, error) {
					alert('error');
				},
				dataType: 'json'
			 });		
			 */
			
			$(options.appdendTo).delegate('.j_digg','click',function(){
				if($(this).hasClass('disable')) return;
				var elm = $(this);
					
				$.ajax({
					type: 'post',
					url: '/digg',
					data: {wid:elm.attr('wid'),uname: window.CUSER.blogType+ '_'+window.CUSER.name},
					success: function (res, textStatus, xhr) {
						if(res.status==0) { 					
							$('<span class="j_digg_add">+ 1</span>').css('opacity',1.0).appendTo(elm).animate({'top': '-20px','opacity': 0} , 1000, function(){
								elm.addClass('disable').find('.j_digg_count').html(res.data);
							});
						} else {
							alert(res.statusText);  
						}
					},
					error: function (xhr, textStatus, error) {
						alert('网络连接出错了');
					},
					dataType: 'json'
				});	
			});
			var dataLoader = new MoreDataLoader(opts);
			 
			 $('#works').delegate('.j_image' ,'click' , function(){
			 	var $this= $(this) , name = $this.parents('.mark').attr('username');
			 	$Colorbox(this).colorbox({title: name + '的作品' });
			 });	 
		}
	}
});
