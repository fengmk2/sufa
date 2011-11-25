var uploadUtil = require('../util/upload'),
	tapi = require('../node_modules/weibo').tapi,
	worksImpl = require('../service/works'),
	DateFormat = require('../util/dateFormat'),
	config = require('../config');
	
var addWork = function(work , twitterSuccess , req , res){
	var work = {
		fileName : work.fileName,
		path : 'files/' + work.fileName,
		user : req.session.curUser,
		status : req.param('status'),
		type : req.session.curUser.blogType,
		time : DateFormat.format(new Date(),"yyyy-MM-dd hh:mm:ss") ,
        t_url : work.t_url,
        dignum : 0 ,
        digusers :{},
        twitter : work.twitter
	};
	
	worksImpl.insert(work, function(err){
		if(err) {
  			res.sendJson(-2 , '不好意思，保存失败了，可能是服务器抽风了，稍候重试一下，实在不好意思哦' );
  			return;
		}
		
		if(work.twitter && twitterSuccess)
			res.sendJson(0 , '发表微博成功' );
		else if(work.twitter && !twitterSuccess)
			res.sendJson(0 , '保存图片成功，但是发表微博由于种种原因失败了哦，不好意思哦' );
		else
			res.sendJson(0 , '保存成功' );
	});
	
}
	
module.exports = [{
	url : '/status',
	view : '',
	methods : ['post'],
	excute : function(req, res  , next ) {	
		var fileName = uploadUtil.genRandomFile('.png'),
			filePath = config.startParams.uploadPath + '/' + fileName,
			twitter = parseInt(req.param('twitter'),10) == 1 ,
			blogType = req.session.curUser.blogType;
	
		var work = {
			fileName : fileName ,
			t_url : false ,
			twitter : twitter
		};
		
		uploadUtil.saveFileFromBase64(filePath , req.param('pic') , function(err){		
			if(twitter) {
				tapi.upload({user:req.session.curUser ,status :req.param('status')}, filePath ,function(err,data){
		 			if(err) {
		 					addWork(work, false , req , res );
				  			return;
		 			} else {
		 				work.t_url = data.t_url;
		 				addWork(work, true , req , res );
		 			} 			
		    	});	
			} else {
				addWork(work, false, req , res );
			}
		});
		
		var smallFileName = fileName.replace('png','jpg');
		uploadUtil.saveFileFromBase64(config.startParams.uploadPath + '/small/' + smallFileName , req.param('spic') ,function(err,data){
			//console.log(err);
		});
	}
},{
	url : '/digg',
	view : '',
	methods : ['post'],
	excute : function(req, res  , next ) {	
		var wid = parseInt(req.param('wid',10)),
			uname = req.param('uname',10);
			
		worksImpl.digg(wid , uname , function(err , data){
			if(err) {
				if(err.hasDig)
					res.sendJson( -1 , '您已经赞过了哦' );
				else
					res.sendJson( -2 , '服务器暂时出了一点小故障，稍候再试一下把' );
			} else {
				res.sendJson( 0 , '您赞了这个作品' , data);
			}
		});
	}
}];