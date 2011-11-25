
module.exports = {
	mapArray : function(data , keyname){
		var map = {};
		for(var i= 0 ;i<data.length;i++){
			map[data[i][keyname]] = data[i];
		}
		return map;
	},
	clone : function(target){
		return this.copy({} , target);
	},
	copy : function(source , target){
		var obj = source ? source : {};
		for(var key in source) {
			obj[key] = source[key];
		}
		return obj;
	}
}