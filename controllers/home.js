var usersImpl = require('../service/users'),
	worksImpl = require('../service/works');
	
module.exports = [{
	url : ['/','/index','/login'],
	view : 'show',
	methods : ['get','post'],
	excute : function(req, res  , next ) {
		var stype = req.param('stype'),
			sortType = stype ? isNaN(stype) ? 0 :parseInt(stype ,10): 0;
		sortType = sortType < 0 || sortType > 1 ? 0 : sortType;
		
		res.render({
			user:req.session.curUser,
			page : 0,
			size : 20,
			hasMore : true ,
			sortType : sortType
		});	
	}
},{
	url : ['/hot'],
	view : 'show',
	methods : ['get','post'],
	excute : function(req, res  , next ) {		
		res.render({
			user:req.session.curUser,
			page : 0,
			size : 20,
			hasMore : true ,
			sortType : 1
		});	
	}
},{
	url : ['/new'],
	view : 'show',
	methods : ['get','post'],
	excute : function(req, res  , next ) {		
		res.render({
			user:req.session.curUser,
			page : 0,
			size : 20,
			hasMore : true ,
			sortType : 0
		});	
	}
},{
	url : ['/3dshow'],
	view : '3d',
	methods : ['get','post'],
	excute : function(req, res  , next ) {		
		res.render({
			user:req.session.curUser,
			page : 0,
			size : 20,
			hasMore : true ,
			sortType : 2
		});	
	}
},{
	url : ['/advice'],
	view : 'advice',
	methods : ['get','post'],
	excute : function(req, res  , next ) {		
		res.render({
			user:req.session.curUser,
			sortType : 0
		});	
	}
},{
	url : ['/paint'],
	view : 'paint',
	methods : ['get'],
	excute : function(req, res  , next ) {	
		res.render({user:req.session.curUser});
	}
},{
	url : ['/create'],
	view : 'create',
	methods : ['get','post'],
	excute : function(req, res  , next ) {	
		res.render({
			user:req.session.curUser,
			paper: req.param('paper') ? req.param('paper') :1
		});
	}
},{
	url : ['/notSupport'],
	view : 'notSupport',
	methods : ['get'],
	excute : function(req, res  , next ) {	
		res.render({user:req.session.curUser,
    		sortType : 0});
	}
},{
	url : ['/getUsers'],
	methods : ['get'],
	excute : function(req, res  , next ) {	
	  	usersImpl.getByPage(page , pageNum , {} ,[['time', -1]] ,function(err , data){
	  		if(err)
		  		res.sendJson(-1 , 'error' , err);
			else
		  		res.sendJson(0 , 'success' , data);
	  	});
	}
},{
	url : ['/logout'],
	methods : ['get'],
	excute : function(req, res  , next ) {	
		delete req.session.curUser;
		res.redirect('/');
	}
},{
	url : ['/getWorks'],
	methods : ['get'],
	excute : function(req, res  , next ) {	
		var page = req.param('page'),
	  		pageNum = req.param('size'),
	  		sortType = isNaN(req.param('sortType')) ? 0 : parseInt(req.param('sortType'),10),
	  		sort = [['time', -1],['dignum', -1]];
	  	if(sortType == 1)
	  		sort = [['dignum', -1],['time', -1]];
	  	worksImpl.genWorksList(page , pageNum , {} , sort , function(err , data){
	  		if(err)
		  		res.sendJson(-1 , 'error' , err);
			else {
				data.sortType = sortType;
		  		res.sendJson(0 , 'success'  , data);
			}
	  	});
	}
}];
