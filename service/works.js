/**
  {
  	fileName : fileName,             //文件名
	path : 'files/' + fileName,      //文件相对路径
	user : req.session.curUser,      //冗余设计
	status : req.param('status'),    //发布的内容
	type : 'tsina'                   //在哪发布
  }
 * @type 
 */
 
var CommonImpl = require('../service/common');
var collectionName = "works";
var impl = function(name){
	this.init(collectionName);
}
impl.prototype.__proto__ = CommonImpl.prototype;
var HasMore = function(cur , pagesize , count){
	return count > cur * pagesize;
}
impl.prototype.genWorksList = function(curpage , pagesize , options, sort , callback){
	var self = this;
	this.getCount(options, function(err , count){
		if(err) { callback(err); return;}
		self.getByPage(curpage , pagesize , options , sort , function(err , data){
			callback(err , {
				works : data ,
				hasMore : HasMore(curpage , pagesize , parseInt(count,10))
			});
		});
	});
}
impl.prototype.hasMore = function(curpage , pagesize , callback){
	this.getCount({},function(err , count){
		callback(err ,HasMore(curpage , pagesize , parseInt(count,10)));
	});		
}
impl.prototype.digg = function(wid , uname, callback){
	var self = this ;
	this.collection.findOne({ id : wid } , function(err , data){
		if(err) { callback(err); return;};
		if(!data) {callback({noUser: true});return}
		var work = {};	
		if(!data.digusers) {
			data.digusers = {};
		}
		if(!data.digusers[uname]) {
			work.id = data.id;
			data.dignum = isNaN(data.dignum) ?  0: data.dignum;
			work.dignum = data.dignum + 1;	
            work.digusers = data.digusers;
			work.digusers[uname] = true;
			self.save(work , function(err ,data){
				callback(err , work.dignum);
			});		
		} else {
			callback({hasDig: true});
		}
	});		
}
	
module.exports = new impl(collectionName);