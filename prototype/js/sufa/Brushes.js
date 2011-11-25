define(function(require , exports , module){

	var Brush = function (brushName, opt) {
		this.name           = brushName;
		this.width          = opt.width;
		this.height         = opt.height;
		this.maxSize        = opt.maxSize || opt.width;
		this.minSize        = opt.minSize || 0;
		this.brushImageName = opt.brushImageName || brushName;
		//this.image        = Resources.getImage('Brushes', this.brushImageName);
	}

	Brush.prototype.draw = function (ctx, pos, size) {
		ctx.drawImage(this.image,
			pos.x - (size/2),
			pos.y - (size/2),
			size,
			size);
	}

	var Brushes = {
		Small: new Brush('Small', {
			width  : 90,
			height : 90,
			maxSize: 15,
			minSize: 3,
			brushImageName: 'Medium'
		})
		, Middle: new Brush('Middle', {
			width  : 90,
			height : 90,
			maxSize: 40,
			minSize: 3,
			brushImageName: 'Medium'
		})
		, Medium: new Brush('Medium', {
			width  : 90,
			height : 90,
			maxSize: 40,
			minSize: 3
		})
		, Large: new Brush('Large', {
			width  : 90,
			height : 90,
			maxSize: 60,
			minSize: 3,
			brushImageName: 'Medium'
		})
		, getBrush : function (brushName , color) {
			if (!this[brushName].image || color ) {
				this[brushName].image = Resources.getImage('Brushes', brushName , color);
				this[brushName].kasureImage = Resources.getImage('KasureBrushes', brushName , color);
			}
			return this[brushName];
		}
	}

	var Resources = {
		getCanvas : function(width , height){
			if(this.canvas) return this.canvas;
			this.canvas = document.createElement('canvas');
			this.canvas.width = width;
			this.canvas.height = height;
			return this.canvas;
		},
		createImage: function (url , color) {
			var image = document.createElement('img');
			image.src = url;		

			image = document.getElementById('brush');
			if(color) {
				var canvas = this.getCanvas(image.width, image.height), 
					ctx = canvas.getContext('2d');	
					ctx.drawImage(image , 0 , 0  , image.width, image.height),
					imageData = ctx.getImageData(0, 0, image.width, image.height ),
					newImageData = this.setColor(ctx , imageData , color);
				ctx.putImageData(newImageData , 0 , 0);
				image.src = canvas.toDataURL();
			}
			return image;
		} , 
		getImage: function (category, name , color) {
			return this.createImage(this[category][name] , color);
		} ,
		setColor : function( ctx, imageData, color ){
			var w = imageData.width,
				h = imageData.height,
				ret = ctx.createImageData( w, h ),
				rgb = color.split(','),
				total = w * h * 4;
			for (var i=0; i<total; i +=4 ) {
				ret.data[i]  = rgb[0]; 
				ret.data[i+1]= rgb[1];
				ret.data[i+2]= rgb[2];
				ret.data[ i+3]= imageData.data[ i + 3 ];
			}			
			return ret;
		}	
	}

	Resources.Write = {
		ClearAnimationInk: Resources.createImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAcCAYAAAB2+A+pAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAf9JREFUeNq8lrsvQ3EUx29f3kGUaCME8Yik8UpMJhFLFwtikVhNBn+A1SARsZgtEjEZxcAkYvCoBQlqIqh6VpVe39N8r9w0+uL+nOST+8u96e/bc87vnN+xadmZDTSDUuAkT8AFwiACYuANPGa7YSqrBCOgk5vLughcgRKuC8EzOKboPZgEt9ofbAxcAh3E+UxeJyOCa2AGtAF7tmISyiYwDo7ANfhMI5SOFeDOVrgbzDN/+h8JAX8mQTdzs2uBoJlDMAtGQcVPwoM8GDGLhQ0WQIFZ0MHnO09qB0vEShPhauAFeeDE/LEHBBV5ayDltgiKNR53F5uDV1NrUiHrrJKEsI8161IsXAf66XlC2MkcfGrqrZ3RTRyuKNgAraBRoajkOR8EpDnZWegtoFaxtzamM2iEWv5FH2j4h1Cf85L5tl6+1BXzAobNDSTG0+1T7LGTt9aBcW09gA/erarzLA0kYgjLBLHFfh1XLL4K9swv5JBN0XsV+Q1R1Jequ1woEJUoTpu7Y/JoEmYY4gpyW5tp3y5eXVZ6vMPpJq05mIdl/ij2i7DqbBRyDc7lWqZ+TplnaUSiFPrgWmdJysgzxH2Kc52rPbzGBkA9pweZQKvozTbYBzWc2TwU3gRL4PS3A71hJTyNMihMsO0F6NUNv92BMvDKcrS83ZVbtdmXAAMArYo2cGf7G3sAAAAASUVORK5CYII='),
		String: {
			  SendErrorOnDone: 'An error occurred while sending. Please try again'
			, Error: 'An error occurred'
			, ClearPanel_Body: 'Clear?'
		}
	}

	Resources.Brushes = {
		Small:  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAOOSURBVHja7JxfhFRRHMfPNAzLsAzDEvu0REQZNjHEUC89xRI9TeplX3uKEkv0usxTbCKWlrVPPSR6SL1sdm12FWvZlNKIsllapUy/0/yuPffOnZlz555zu+fe75eP/Wt29nPPnPs7/6bQ6XQEYj9HoACiIRqBaIiGaASiIRqBaIiGaASiIRqBaIjOeeR8tIqSElEjJmDJgNcBomfl7yvsEgvERWIcKs2ILhI7AdEqP4lF4hyUxhNdHyA5yA63/jHojS66FUG0x1dijqhAs77ojRFEe+wT88RRiB4susR9cCcm8jHuEccgOlz0lAHJQR4RDYj2i65ZEK2WiLfz0K3oiK5bFK3ylJjJ6oAo6LUQ3KlUKBRO0IfNhJ/XB+KVwjbRdl20z2uIaPmy/piS5yuFfyde89dviQP+/JNyMQ74Z06JFlyilR1uUN4F+UVs8ffafHG2+RX0Lg2i1/immPVssfCXxBPlohgX3W/AMp/QDTFtyNHtCtGMO6WgOzK8kFPRKl94SqFqU7S8mj8g2zfCLdsQLfMQkn1sRmndUUTXIbeHFzwXZFR03Fm8rDJnQ/QMxIb22cdNiy6iVfftQoomRaOv7s+sadGCyxvI7R3cVEyLrvADQ7Cfu6ZFy1yF2NAb45Rp0RjE9F+mMy5aDkPfQG4PddOiBdeQ+5DrYyNY7pkQLXMJcgeXe6ZEy1yH3J5yb8KGaMHlDSQf8sCWaJlFCPaVe9Uw0SZ2/F8hlgUieAq1qTeCGS1FftmgVfOeGBtdh5oWRP9j3LZomTsQLRo2+uhgbhHXePNKXtOzidPW8bf7xHnh+P65GBlLSrTMc+K0yd0/DqVtq+oYdnXzNus3mcTNcND8yF4OJO/aGrDoZok4JbobCrOcJZsDlqiDm5vCzIGkNLbmchIDliiRp7WeZa1+tjmpFDfNjCz8tmzNR5uMXGWXWxp+O7zCUnJBtLpMtuKY5D0Rcmg17aK9TIvutisXVlWmtYqMlIr2cpZ4nFLJq6LPng4XRatdykJKSsLPxOVhT9hV0V7kMtEN8f/2lrSE5hEL10WrqfE/nkRp+F503+JIO1kSrabBCw6rFsq2kd5dR+csuOtzDVW+iZ7hiuCk0D9R9UccnkdfjjMvo3tyNmuR8ie5ZYYdi5CnZ78R66b+4FDRiJ3gnRwhGqIRiIZoiIYCiIZoBKIhGqIRiIZoBKIhGqIRiM5Q/gowAMsRJLrK/gy+AAAAAElFTkSuQmCC",
		Medium: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAOOSURBVHja7JxfhFRRHMfPNAzLsAzDEvu0REQZNjHEUC89xRI9TeplX3uKEkv0usxTbCKWlrVPPSR6SL1sdm12FWvZlNKIsllapUy/0/yuPffOnZlz555zu+fe75eP/Wt29nPPnPs7/6bQ6XQEYj9HoACiIRqBaIiGaASiIRqBaIiGaASiIRqBaIjOeeR8tIqSElEjJmDJgNcBomfl7yvsEgvERWIcKs2ILhI7AdEqP4lF4hyUxhNdHyA5yA63/jHojS66FUG0x1dijqhAs77ojRFEe+wT88RRiB4susR9cCcm8jHuEccgOlz0lAHJQR4RDYj2i65ZEK2WiLfz0K3oiK5bFK3ylJjJ6oAo6LUQ3KlUKBRO0IfNhJ/XB+KVwjbRdl20z2uIaPmy/piS5yuFfyde89dviQP+/JNyMQ74Z06JFlyilR1uUN4F+UVs8ffafHG2+RX0Lg2i1/immPVssfCXxBPlohgX3W/AMp/QDTFtyNHtCtGMO6WgOzK8kFPRKl94SqFqU7S8mj8g2zfCLdsQLfMQkn1sRmndUUTXIbeHFzwXZFR03Fm8rDJnQ/QMxIb22cdNiy6iVfftQoomRaOv7s+sadGCyxvI7R3cVEyLrvADQ7Cfu6ZFy1yF2NAb45Rp0RjE9F+mMy5aDkPfQG4PddOiBdeQ+5DrYyNY7pkQLXMJcgeXe6ZEy1yH3J5yb8KGaMHlDSQf8sCWaJlFCPaVe9Uw0SZ2/F8hlgUieAq1qTeCGS1FftmgVfOeGBtdh5oWRP9j3LZomTsQLRo2+uhgbhHXePNKXtOzidPW8bf7xHnh+P65GBlLSrTMc+K0yd0/DqVtq+oYdnXzNus3mcTNcND8yF4OJO/aGrDoZok4JbobCrOcJZsDlqiDm5vCzIGkNLbmchIDliiRp7WeZa1+tjmpFDfNjCz8tmzNR5uMXGWXWxp+O7zCUnJBtLpMtuKY5D0Rcmg17aK9TIvutisXVlWmtYqMlIr2cpZ4nFLJq6LPng4XRatdykJKSsLPxOVhT9hV0V7kMtEN8f/2lrSE5hEL10WrqfE/nkRp+F503+JIO1kSrabBCw6rFsq2kd5dR+csuOtzDVW+iZ7hiuCk0D9R9UccnkdfjjMvo3tyNmuR8ie5ZYYdi5CnZ78R66b+4FDRiJ3gnRwhGqIRiIZoiIYCiIZoBKIhGqIRiIZoBKIhGqIRiM5Q/gowAMsRJLrK/gy+AAAAAElFTkSuQmCC",
		Middle: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAOOSURBVHja7JxfhFRRHMfPNAzLsAzDEvu0REQZNjHEUC89xRI9TeplX3uKEkv0usxTbCKWlrVPPSR6SL1sdm12FWvZlNKIsllapUy/0/yuPffOnZlz555zu+fe75eP/Wt29nPPnPs7/6bQ6XQEYj9HoACiIRqBaIiGaASiIRqBaIiGaASiIRqBaIjOeeR8tIqSElEjJmDJgNcBomfl7yvsEgvERWIcKs2ILhI7AdEqP4lF4hyUxhNdHyA5yA63/jHojS66FUG0x1dijqhAs77ojRFEe+wT88RRiB4susR9cCcm8jHuEccgOlz0lAHJQR4RDYj2i65ZEK2WiLfz0K3oiK5bFK3ylJjJ6oAo6LUQ3KlUKBRO0IfNhJ/XB+KVwjbRdl20z2uIaPmy/piS5yuFfyde89dviQP+/JNyMQ74Z06JFlyilR1uUN4F+UVs8ffafHG2+RX0Lg2i1/immPVssfCXxBPlohgX3W/AMp/QDTFtyNHtCtGMO6WgOzK8kFPRKl94SqFqU7S8mj8g2zfCLdsQLfMQkn1sRmndUUTXIbeHFzwXZFR03Fm8rDJnQ/QMxIb22cdNiy6iVfftQoomRaOv7s+sadGCyxvI7R3cVEyLrvADQ7Cfu6ZFy1yF2NAb45Rp0RjE9F+mMy5aDkPfQG4PddOiBdeQ+5DrYyNY7pkQLXMJcgeXe6ZEy1yH3J5yb8KGaMHlDSQf8sCWaJlFCPaVe9Uw0SZ2/F8hlgUieAq1qTeCGS1FftmgVfOeGBtdh5oWRP9j3LZomTsQLRo2+uhgbhHXePNKXtOzidPW8bf7xHnh+P65GBlLSrTMc+K0yd0/DqVtq+oYdnXzNus3mcTNcND8yF4OJO/aGrDoZok4JbobCrOcJZsDlqiDm5vCzIGkNLbmchIDliiRp7WeZa1+tjmpFDfNjCz8tmzNR5uMXGWXWxp+O7zCUnJBtLpMtuKY5D0Rcmg17aK9TIvutisXVlWmtYqMlIr2cpZ4nFLJq6LPng4XRatdykJKSsLPxOVhT9hV0V7kMtEN8f/2lrSE5hEL10WrqfE/nkRp+F503+JIO1kSrabBCw6rFsq2kd5dR+csuOtzDVW+iZ7hiuCk0D9R9UccnkdfjjMvo3tyNmuR8ie5ZYYdi5CnZ78R66b+4FDRiJ3gnRwhGqIRiIZoiIYCiIZoBKIhGqIRiIZoBKIhGqIRiM5Q/gowAMsRJLrK/gy+AAAAAElFTkSuQmCC",
		Large:  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAOOSURBVHja7JxfhFRRHMfPNAzLsAzDEvu0REQZNjHEUC89xRI9TeplX3uKEkv0usxTbCKWlrVPPSR6SL1sdm12FWvZlNKIsllapUy/0/yuPffOnZlz555zu+fe75eP/Wt29nPPnPs7/6bQ6XQEYj9HoACiIRqBaIiGaASiIRqBaIiGaASiIRqBaIjOeeR8tIqSElEjJmDJgNcBomfl7yvsEgvERWIcKs2ILhI7AdEqP4lF4hyUxhNdHyA5yA63/jHojS66FUG0x1dijqhAs77ojRFEe+wT88RRiB4susR9cCcm8jHuEccgOlz0lAHJQR4RDYj2i65ZEK2WiLfz0K3oiK5bFK3ylJjJ6oAo6LUQ3KlUKBRO0IfNhJ/XB+KVwjbRdl20z2uIaPmy/piS5yuFfyde89dviQP+/JNyMQ74Z06JFlyilR1uUN4F+UVs8ffafHG2+RX0Lg2i1/immPVssfCXxBPlohgX3W/AMp/QDTFtyNHtCtGMO6WgOzK8kFPRKl94SqFqU7S8mj8g2zfCLdsQLfMQkn1sRmndUUTXIbeHFzwXZFR03Fm8rDJnQ/QMxIb22cdNiy6iVfftQoomRaOv7s+sadGCyxvI7R3cVEyLrvADQ7Cfu6ZFy1yF2NAb45Rp0RjE9F+mMy5aDkPfQG4PddOiBdeQ+5DrYyNY7pkQLXMJcgeXe6ZEy1yH3J5yb8KGaMHlDSQf8sCWaJlFCPaVe9Uw0SZ2/F8hlgUieAq1qTeCGS1FftmgVfOeGBtdh5oWRP9j3LZomTsQLRo2+uhgbhHXePNKXtOzidPW8bf7xHnh+P65GBlLSrTMc+K0yd0/DqVtq+oYdnXzNus3mcTNcND8yF4OJO/aGrDoZok4JbobCrOcJZsDlqiDm5vCzIGkNLbmchIDliiRp7WeZa1+tjmpFDfNjCz8tmzNR5uMXGWXWxp+O7zCUnJBtLpMtuKY5D0Rcmg17aK9TIvutisXVlWmtYqMlIr2cpZ4nFLJq6LPng4XRatdykJKSsLPxOVhT9hV0V7kMtEN8f/2lrSE5hEL10WrqfE/nkRp+F503+JIO1kSrabBCw6rFsq2kd5dR+csuOtzDVW+iZ7hiuCk0D9R9UccnkdfjjMvo3tyNmuR8ie5ZYYdi5CnZ78R66b+4FDRiJ3gnRwhGqIRiIZoiIYCiIZoBKIhGqIRiIZoBKIhGqIRiM5Q/gowAMsRJLrK/gy+AAAAAElFTkSuQmCC"
	}
		 
	Resources.KasureBrushes = {
		/*
		Small:  "data:image/png;base64,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",
		Medium: "data:image/png;base64,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",
		Middle: "data:image/png;base64,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",
		Large:  "data:image/png;base64,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"
		*/
		Small: Resources.createImage("./images/brush.png"),
		Medium : Resources.createImage("./images/brush.png"),
		Large : Resources.createImage("./images/brush.png")
	}

	return Brushes;
});
