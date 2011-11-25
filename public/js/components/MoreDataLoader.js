define(function(require , exports , module){
	 
	var $ = require('jquery'),
		SimpleTmpl = require('third/SimpleTmpl');
	var MoreDataLoader  = function(options){
		this.opts = $.extend({
			page : 1,
			size : 20 ,
			hasMore: false,
			moreWrapper : '#loadMore' ,
			moreBtn : 'a.fuc',
			dataUrl : 'http://'+Global_Site.domain+'/',
			tmpl : 'tmplBlog',
			appdendTo : '',
			params: {},
			gap : 200 ,
			autoload : false ,
            callback : function(){}
		},options);
		
		this._init(this.opts.autoload);		
	}
	
	var reachBottom = function(gap) {
	    var scrollTop = 0;
	    var clientHeight = 0;
	    var scrollHeight = 0;
	    if (document.documentElement && document.documentElement.scrollTop) {
	        scrollTop = document.documentElement.scrollTop;
	    } else if (document.body) {
	        scrollTop = document.body.scrollTop;
	    }
	    if (document.body.clientHeight && document.documentElement.clientHeight) {
	        clientHeight = (document.body.clientHeight < document.documentElement.clientHeight) ? document.body.clientHeight: document.documentElement.clientHeight;
	    } else {
	        clientHeight = (document.body.clientHeight > document.documentElement.clientHeight) ? document.body.clientHeight: document.documentElement.clientHeight;
	    }
	    scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
	    if (scrollTop + clientHeight >= scrollHeight - gap) {
	        return true;
	    } else {
	        return false;
	    }
	}
	
	MoreDataLoader.prototype._init = function(autoload){
		 var self = this;
		 this.page = this.opts.page ;
	     this.size = this.opts.size ; 
	     this.hasMore = this.opts.hasMore;
	     this.isloading = false;
	     this.loadMoreWrap = $(this.opts.moreWrapper);
	     this.loadBtn = this.loadMoreWrap.find(this.opts.moreBtn);
	     this.container = $(this.opts.appdendTo);	 
	    	 
	   $(window).scroll(function(){
			if(reachBottom(self.opts.gap)){
				self.loadBtn.trigger('click');
			}
		});
	    
	   var loadMoreData = function(){
	        if(self.isloading || !self.hasMore) return ;
	        self.isloading = true;
	
	       self.loadBtn.html('加载中...');
	       
	       var params = $.extend(self.opts.params,{ type: 'json' , page: ++self.page , size:self.size });
	       
	   		$.ajax({
				type: 'get',
				url: self.opts.dataUrl,
				data: params,
				success: function (res, textStatus, xhr) {
					var t = null;
					if(res.status==0 && res.data.works.length>0) {
						t = $(SimpleTmpl(self.opts.tmpl,res.data));
                        t.appendTo(self.container).fadeIn('slow');
						self.hasMore = res.data.hasMore;
						
					} 		
					self.isloading = false;
					self.loadBtn.html('查看更多');
					if(self.hasMore)
						self.loadMoreWrap.show();
					else
						self.loadMoreWrap.hide();  
					self.opts.callback(t);
				},
				error: function (xhr, textStatus, error) {
					alert('网络连接出错了');
					self.isloading = false;
					loadBtn.html('查看更多');
				},
				dataType: 'json'
			});	
	    }
	    
	    self.loadBtn.bind('click' , loadMoreData);	
	    
	    if(autoload)
	    	self.loadBtn.trigger('click');
	}
	
	MoreDataLoader.prototype.reload = function(options, params , autoload){
		if(params)
			this.opts.params = params;
		 this.page = options.page ;
	     this.size = options.size ; 
	     this.hasMore = options.hasMore;
	     this.isloading = false;
	     if(autoload)
	    	this.loadBtn.trigger('click');
	}
	
	return MoreDataLoader;
});