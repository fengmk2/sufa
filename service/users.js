/**
  {
  	 type : 'tsina', 
     user :  obj , //对应微薄的结构体
     id :  1 ,       //本地维护的一个id
     time : ‘2011-01-01 00：00：00’ //加入时间
  }
 * @type 
 */
 
var CommonImpl = require('../service/common');
var collectionName = "users";
var impl = function(name){
	this.init(collectionName);
}
impl.prototype.__proto__ = CommonImpl.prototype;
impl.prototype.isExist = function(name , callback){
	this.collection.find({name:name}).toArray(function(err, data){
		if(err)
			callback(err, false);
		else
			callback(err, data.length >0 , data );
	});
}
	
module.exports = new impl(collectionName);