/***
 * 如果开启了mongoDB,将下面代码注释去掉，
 * 并将dbUserName, dbPassword和dbName都
 * 替换成分配得到的值。即可查看 mongoDB
 * 测试程序。否则则开启hello world程序。
 ***/
var mongo = require("mongoskin");
var debug = true;
if(debug) {
	exports.db_url = "test:123456@127.0.0.1:27017/db_sufa";
	var port = 8024 ;
	var domain = 'localhost:' + port;
} else {
	exports.db_url = "j0jvmo04y08mk:gmsvriina9k@127.0.0.1:20088/oh3m5iwlvznpu";
	var port = 80 ;
	var domain = 'sufa.cnodejs.net' ;
}
exports.db = mongo.db(exports.db_url);
exports.startParams = {
	port : port ,
	uploadPath : 'public/files',
	appname : 'sufa'
}
exports.Global_User = {
	name : 'sufa官方微博' ,
	sina : 'http://weibo.com/2113472683',
	sinaNick : 'sufa官方微博',
	blog : 'http://www.nodejser.com/' ,
	blogName :'黄月月鸟飞',
	email : 'hpf1908@gmail.com',
	signatureUrl : 'http://service.t.sina.com.cn/widget/qmd/2113472683/2547a738/1.png'
}
exports.Global_Site = {
	title : '书法' ,
	desc : '书法应用',
	domain : domain
}
exports.Global_Page = {
	
}
exports.nologinUrls = ['/*','/oauth*','/index*','/css*','/images*','/files*','/js*'];
exports.needloginUrls = ['/login*'];
