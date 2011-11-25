/**
 * dependency
 */
var fs = require('fs')
  , express = require('express')
  , weibo = require('./node_modules/weibo')
  , tapi = weibo.tapi
  , url = require('url')
  , usersImpl = require('./service/users')
  , config = require('./config')
  , DateFormat = require('./util/dateFormat');
  
/*
var tsinaApp = { 
  appkey : '3246993349',
  secret : '795c1b5b70e0d476db2e30a18c4ea367'
}
*/

var sinaApp = {
	key : '1306060637',
	secret : '0850d7407392fb537bff0762406c567d',
	blogType: 'tsina'
}

var qqApp = {
	key : '801004324',
	secret : 'f4dccb3a9f1689adcc66dc933b38445e',
	blogType: 'tqq'
}

var sohuApp = {
	key : 'geDQ7cFZ7iruNPHm3lZk',
	secret : 'iQ%mtL!eh%xVl!SjQN^($Efdw41!#Ytt*r8SMtw8',
	blogType: 'tsohu'
}
	
exports.boot = function(app){
  bootApplication(app);
  bootControllers(app);
};
/**
 * 很烂的代码，待优化
 * @todo 正则表达式 ,需要更灵活的配置
 */
var NologinUrls = config.nologinUrls;
var NeedloginUrls = config.needloginUrls;
var IsNoLoginPage = function(url){
	for(var i=0;i<NologinUrls.length;i++){
		var pattern = new RegExp(NologinUrls[i] ,'ig');
		if(pattern.test(url))
			return true;
	}
	return false;
}
var IsNeedLoginPage = function(url){
	for(var i=0;i<NeedloginUrls.length;i++){
		var pattern = new RegExp(NeedloginUrls[i] ,'ig');
		if(pattern.test(url))
			return true;
	}
	return false;
}
var redirect =function(res, url , reffer) {
	res.writeHead(302, {
		'Location': url,
		'Content-Length': 0 ,
		'Referer' : reffer
	});
	res.end();
};
// App settings and middleware 
function bootApplication(app) {
	
  var apps = [sinaApp , qqApp , sohuApp];
  for(var i = 0 ; i < apps.length; i++) {
	tapi.init(apps[i].blogType, apps[i].key, apps[i].secret);	
  }
  
  app.use(express.logger(':method :url :status'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  
   //authen judge
  app.use(function(req , res , next){
  	 if(!req.session.curUser && IsNeedLoginPage(req.url)) {
  	 	var blogtype = url.parse(req.url, true).query['blogtype'];
  	 	blogtype = blogtype ? blogtype : 'tsina';
  	 	res.redirect('/oauth?blogType='+blogtype+'&reffer='+encodeURIComponent(req.url));
  	 }else
  		next();
  });
  
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  
 
  app.use(weibo.oauth_middleware(function(oauth_user, referer, req, res, callback) {
	req.session.curUser = oauth_user;
	
	var user = {
		type : oauth_user.blogType, 
     	user : oauth_user ,
	 	time : DateFormat.format(new Date(),"yyyy-MM-dd hh:mm:ss"),
	 	name : oauth_user.blogType + '_' + oauth_user.name
	}
	
	//console.log(oauth_user);
	
	usersImpl.isExist(user.name ,function(err , flag , data){
		//如果不存在，则应该增加
		if(!flag) {
			usersImpl.insert(user , function(err){
				if(err)
					console.log(err);
				else
					redirect(res , referer);
			});
		} else {
            user.id = data[0].id;
            usersImpl.save(user , function(err){
    			if(err)
					console.log(err);
				else
					redirect(res , referer);
			});		
		}
	});
	/*
	tapi.user_timeline({user: oauth_user}, function(error, data){
		if(error)
			console.log(err);
		else
			console.log(data);
	});
	*/
  },{
	 default_blogtype : 'tsina'
  }));
  
   // set default layout, usually "layout"
  app.set('view options', {
	  layout: 'layouts/default',
	  open: '<<',
      close: '>>'
  });
  	// Example 404 page via simple Connect middleware
  app.use(function(req, res){
  	var opt = {};
  	setGlobalInfo(opt , req, res);
    res.render('404' , opt);
  });  
  // Example 500 page
  app.error(function(err, req, res){
    //console.dir(err);
    var opt = {};
  	setGlobalInfo(opt , req, res);
    res.render('500',opt);
  });
  // Setup ejs views as default, with .html as the extension
  app.set('views', __dirname + '/views');
  app.register('.html', require('ejs'));
  app.set('view engine', 'html');
  // Some dynamic view helpers
  app.dynamicHelpers({
    request: function(req){
      return req;
    },
    hasMessages: function(req){
      if (!req.session) return false;
      return Object.keys(req.session.flash || {}).length;
    },
    messages: function(req){
      return function(){
        var msgs = req.flash();
        return Object.keys(msgs).reduce(function(arr, type){
          return arr.concat(msgs[type]);
        }, []);
      }
    }
  });
}
// Bootstrap controllers
function bootControllers(app) {
  fs.readdir(__dirname + '/controllers', function(err, files){
    if (err) throw err;
    files.forEach(function(file){
      bootController(app, file);
    });
  });
}
// (simplistic) controller support
function bootController(app, file) {
  var controller = file.replace('.js', '')
    , actions = require('./controllers/' + controller);
  Object.keys(actions).map(function(key){
  	 var action = actions[key],
     	  fn = controllerAction(controller, key , action);
     	  
     var MapAction = function(method , url){
     	var urls = Object.prototype.toString.apply(url) === '[object Array]'? url : [url];
     	for(var i=0;i<urls.length;i++){
	     	console.log(urls[i] +' '+ method);
	     	app[method](urls[i],fn);
     	}
     }
     if(action.methods && action.methods.length>0) {
     	for(var i=0;i<action.methods.length;i++) {
	     	 var method = action.methods[i];
	     	 MapAction(method , action.url);     	 
	      } 	
     } else {
     	MapAction('get' , action.url);
     }   
  });
}
function setGlobalInfo(options , req, res){
	options.CUSER = req.session && typeof(req.session.curUser)!='undefined' ? req.session.curUser : { name : '游客'};
	options.Global_User = config.Global_User;
	options.Global_Site = config.Global_Site;
	options.Global_Page = config.Global_Page;
	options.Global_Page.path = url.parse(req.url).pathname;
	options.IsLogin = req.session && typeof(req.session.curUser)!='undefined' ? true : false;
}
/*
 * Proxy res.render() to config common views path or something else
 * extend res.sendJson() to config all the response for json format
 */
function controllerAction(controller , key , action  ) {
  return function(req, res, next){
    var render = res.render, 
        format = req.params.format, 
        view = action.view ,
        path = __dirname + '/views/' + controller + '/' + view + '.html';
    res.render = function(obj, options, fn){
      res.render = render;
      if (typeof obj === 'string') {
        return res.render(obj, options, fn);
       }
      options = options || {};      
      for(var name in obj) {
         options[name] = obj[name];
       }
      setGlobalInfo(options , req, res);
     
      return res.render(path, options, fn);
    };
    
    res.sendJson = function(status, statusText, data, view){
	  var result={
	    status:status,
	    statusText:statusText
	  };  
	  if(data)
		  result.data = data;
	  if(view)
		  result.view = view;	  
	  return res.send(result);
	};
	
    action.excute.call(this, req, res, next);
  };
}
