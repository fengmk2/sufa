var fs = require('fs');

module.exports = {
	saveFileFromBase64 : function(filePath , base64Str , callback){
		var buffer = new Buffer(base64Str,'base64').toString('binary'),
		    buffer = new Buffer(buffer,'binary');
		    
		fs.open(filePath, 'w', 0666, function(err, fd){
			if(err)
				return callback(err);
			fs.write(fd, buffer, 0, buffer.length, null , function(err, written, buffer){	
				fs.close(fd);
				callback(err);
			});
		});	
	},
	genRandomFile : function(ext){
		  var name = '';
  		  for (var i = 0; i < 32; i++) {
		    name += Math.floor(Math.random() * 16).toString(16);
		  }
		  return name + ext;
	}
}