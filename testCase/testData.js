/**
 * db.category.remove();
 * db.blogSite.remove();
 * db.users.remove();
 */
var assert = require('assert') ,
	usersImpl = require('../service/users'),
	worksImpl = require('../service/works');
	 
module.exports = {
	test : function(){
		
	}
}

cats.collection.remove(function(){
	usersImpl.collection.remove(function(){
		worksImpl.collection.remove(function(){
			setTimeout(function(){
				cats.primaryId = 0;
				blogSite.primaryId = 0;
				UsersImpl.primaryId = 0;
				module.exports.test();
			},1000);
		});	
	});	
});
	 




