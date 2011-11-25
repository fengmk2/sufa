/**
 * 查找删除注意类型和值一致，注意 1和"1"的区别
 * mongo update 会对值作隐式类型转换，这是一个潜在的陷阱，需要注意
 * @type 
 */

var db = require('../config').db,
	utilCommon = require('../util/common');

var Service = function(collection){
	this.collection = db.collection(collection);
}

Service.prototype = {
	init : function(collection , options , callback){
		var self = this;
		this.options = utilCommon.copy({
			uniqueKey : 'id'
		} , options);
		this.collection = db.collection(collection);
		
		this.collection.count(function(err , count){
			self.primaryId = isNaN(count) ? 0 : parseInt(count,10);
		});
	},
	del : function(id , callback){
		var obj = {};
		obj[this.options.uniqueKey] = parseInt(id,10);
		this.collection.remove(obj ,function(err){
			callback(err);
		});
	},
	insert : function(obj , callback){
		obj[this.options.uniqueKey] = ++this.primaryId;
		this.collection.save(obj ,function(err){
			callback(err);
		});
	},
	save : function(obj , callback){
		var findOpt = {};
		findOpt[this.options.uniqueKey] = parseInt(obj[this.options.uniqueKey],10);
		delete obj.id;
		this.collection.update(findOpt , {$set :obj}, {upsert:true} ,function(err){
			callback(err);
		});
	},
	getAll : function(callback){
		this.get(false , callback);
	},
	get: function(num , callback){  
		 //JSON.stringify(p); 序列化
		var limitOpt = num ? {limit:num} : {};  
		this.collection.find({},limitOpt).toArray(function(err, data){
		   	callback(err, data);
		});
	},
	getByPage : function(page, pageNum , options , sort , callback){
		var page = page ?  page : 1,
			pageNum = pageNum ?  pageNum : 20 ,
			options = options ? options : {};

		this.collection.find(options ,{sort:sort,skip:pageNum*(page-1), limit:pageNum}).toArray(function(err, data){
			callback(err, data);
		});
	},
	getAllMap : function(key , callback){
		if(typeof(key)== 'function') {
			callback = key;
			key = this.options.uniqueKey;
		}
		this.getMap(false , key , callback);
	},
	getMap : function(num , key , callback){
		this.get(num , function(err, data){
			if(err) {
				callback(err, data);
				return;
			}
			callback(err, utilCommon.mapArray(data, key));
		});
	},
	getCount : function(options , callback){
		this.collection.count(options , function(err, data){
			callback(err, data);
		});
	}
};

module.exports = Service;