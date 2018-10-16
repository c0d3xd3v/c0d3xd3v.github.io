////////////////////////////////////////////////////////////////////////////////////
function random(min, max) {
	return (Math.random()*(max - min) + min);
}
var TransformMatrix = function () {
    this.identity();
}
TransformMatrix.prototype.identity = function() {
    this.a  = 1;
    this.b  = 0;
    this.c  = 0;
    this.d  = 1;
    this.e  = 0;
    this.f  = 0;
}
TransformMatrix.prototype.setTransform = function(a, b, c, d, e, f) {
    this.identity();
    this.multiply(a, b, c, d, e, f);
}
TransformMatrix.prototype.transform = function(a, b, c, d, e, f) {
    this.multiply(a, b, c, d, e, f);
}
TransformMatrix.prototype.multiply = function(a, b, c, d, e, f) {
    this.a = this.a*a + this.c*b;
    this.b = a*this.b + b*this.d;
    this.c = this.a*c + this.c*d;
    this.d = this.b*c + this.d*d;
    this.e = this.a*e + this.c*f + this.e;
    this.f = this.b*e + this.d*f + this.f;
}
TransformMatrix.prototype.multiplyVector = function(x, y, w) {
    var v = {x : 0, y : 0, w : 1};
    v.x = this.a*x + this.c*y + this.e*w;
    v.y = this.b*x + this.d*y + this.f*w;
    v.w = w;
    return v;
}
TransformMatrix.prototype.multiplyInverseVector = function(x, y, w) {
    var inv = this.inverse();
    var v = inv.multiplyVector(x, y, w);
    return v;
}
TransformMatrix.prototype.inverse = function() {
    var det = this.a*this.d - this.c*this.b;
    var inv = new TransformMatrix();
    inv.a =  this.d/det;
    inv.b = -this.b/det;
    inv.c = -this.c/det;
    inv.d =  this.a/det;
    inv.e = (this.c*this.f - this.e*this.d)/det;
    inv.f = (this.e*this.b - this.a*this.f)/det;
    return inv;
}
////////////////////////////////////////////////////////////////////////////////////
function MouseHandler(canvas, plotter) {
	this.tm = new TransformMatrix();
	this.tm.setTransform(1, 0, 0, -1, canvas.width/2, -canvas.height/2);
	this.leftDown = false;
    this.rightDown = false;
    this.mouseInMap = false;
    this.scale = {x : 1, y : 1};
    this.mouse = {x : 0, y : 0};
    this.mouseOffset = {x : 0, y : 0};
    this.mouseOnMap = {x : 0, y : 0};
    this.mouseSelect = false;
	this.selectRect = {x1 : 0, y1 : 0, x2 : 0, y2 : 0};
	this.plotter = plotter;
	this.canvas = canvas;
	this.canvas.addEventListener('contextmenu', function(e) {
      if (e.button === 2) {
          e.preventDefault();
           return false;
         }
     }, false);
	// to access methods from handler in context of canvas.
	this.canvas.mouseHandler = this;
	// canvas event listeners registration 
	this.canvas.addEventListener("mousemove", this.ev_mousemove.bind(this.canvas), false);
	this.canvas.addEventListener("mouseout", this.ev_mouseout.bind(this.canvas), false);
	this.canvas.addEventListener("mousedown", this.ev_mousedown.bind(this.canvas), false);
	this.canvas.addEventListener("mouseup", this.ev_mouseup.bind(this.canvas), false);
	// Chrome / IE
	this.canvas.addEventListener("mousewheel", this.ev_mouseWheelHandler.bind(this.canvas), false);
	// Firefox
	this.canvas.addEventListener("DOMMouseScroll", this.ev_mouseWheelHandler.bind(this.canvas), false);
    this.newInteraction = true;
}

MouseHandler.prototype.detect_button = function (e) {
    e = e || window.event;
    var button = 0;
    if (e.which == null) {
        button = (e.button < 2)  ?  1 :// left
                ((e.button == 4) ?  2 :// middle
                                    3);// right
    } else {
        button = (e.which < 2)  ?   1 :// left
                ((e.which == 2) ?   2 :// middle
                                    3);// right
    }
    return button;
}
MouseHandler.prototype.ev_mousemove = mousemove; 
function mousemove(event) {
	window.setTimeout((function() {
        this.mouseHandler.mouseInMap = true;
        var old = this.mouseHandler.mouse;
        this.mouseHandler.mouse = this.mouseHandler.getMousePos(event);
        var area = this.mouseHandler.plotter.getDiagramArea();
        if(this.mouseHandler.mouse.x > area.x1 && this.mouseHandler.mouse.x < area.x2 && 
           this.mouseHandler.mouse.y > area.y1 && this.mouseHandler.mouse.y < area.y2) {
           this.mouseHandler.plotter.canvas.style.cursor = 'none';
           this.mouseHandler.mouseOnMap = this.mouseHandler.tm.multiplyInverseVector(this.mouseHandler.mouse.x, this.mouseHandler.mouse.y, 1);
           if(this.mouseHandler.leftDown) {
                var diff = {
                            x : (this.mouseHandler.mouse.x - old.x)/this.mouseHandler.scale.x,
                            y : (this.mouseHandler.mouse.y - old.y)/this.mouseHandler.scale.y
                        };
                this.mouseHandler.tm.transform(1, 0, 0, 1, diff.x, -diff.y);
                this.mouseHandler.newInteraction = true;
            } else if(this.mouseHandler.rightDown && this.mouseHandler.mouseSelect) {
            	this.mouseHandler.selectRect.x2 = this.mouseHandler.mouse.x - this.mouseHandler.selectRect.x1;
            	this.mouseHandler.selectRect.y2 = this.mouseHandler.mouse.y - this.mouseHandler.selectRect.y1;
            }
        } else {
            this.mouseHandler.mouseInMap = false;
            this.mouseHandler.leftDown = false;
            this.mouseHandler.rightDown = false;
            this.mouseHandler.mouseInMap = false;
            this.mouseHandler.plotter.canvas.style.cursor = 'default';
        }
       this.mouseHandler.plotter.draw();
	}).bind(this), 0);
}
MouseHandler.prototype.ev_mouseout = mouseout; 
function mouseout(event) {
    this.mouseHandler.mouseInMap = false;
    this.mouseHandler.leftDown = false;
    this.mouseHandler.rightDown = false;
    this.mouseHandler.plotter.draw();
}
MouseHandler.prototype.ev_mousedown = function(event) {
	if(this.mouseHandler.mouseInMap) {
    	var button = this.mouseHandler.detect_button(event);
        if(button == 1) {
            this.mouseHandler.leftDown = true;
        } else if(button == 3) {
            this.mouseHandler.rightDown = true;
            this.mouseHandler.mouseSelect = true;
            this.mouseHandler.selectRect.x1 = this.mouseHandler.mouse.x;
            this.mouseHandler.selectRect.y1 = this.mouseHandler.mouse.y;
        }
        this.mouseHandler.plotter.draw();
	}
}
MouseHandler.prototype.getMousePos = function (ev) {
    var _x = 0, _y = 0;
    // Get the mouse position relative to the canvas element.
    if (ev.layerX || ev.layerX == 0) {// Firefox
      _x = ev.layerX;
      _y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) {// Opera
      _x = ev.offsetX;
      _y = ev.offsetY;
    }
    this.mouseOffset = {
  		  x : ev.screenX - _x,
  		  y : ev.screenY - _y
    };
    return {
      x : _x,
      y : _y
    };
}
MouseHandler.prototype.ev_mouseWheelHandler = function(event) {
	window.setTimeout((function() {
    	 var wheel = event.wheelDelta/120 || -event.detail;//n or -n
    	 if(!isNaN(wheel) && this.mouseHandler.mouseInMap) {
        	 wheel = wheel/Math.abs(wheel);
             var zoom = 1 + wheel * 0.2;
             this.mouseHandler.mouse = this.mouseHandler.getMousePos(event);
             this.mouseHandler.mouseOnMap = this.mouseHandler.tm.multiplyInverseVector(this.mouseHandler.mouse.x, this.mouseHandler.mouse.y, 1);
             this.mouseHandler.scale.x *= zoom;
             this.mouseHandler.scale.y *= zoom;
             this.mouseHandler.tm.transform(1, 0, 0, 1, this.mouseHandler.mouseOnMap.x, this.mouseHandler.mouseOnMap.y);
             this.mouseHandler.tm.transform(zoom, 0, 0, zoom, 0, 0);
             this.mouseHandler.tm.transform(1, 0, 0, 1, -this.mouseHandler.mouseOnMap.x, -this.mouseHandler.mouseOnMap.y);
             this.mouseHandler.newInteraction = true;
             this.mouseHandler.plotter.draw();
    	 }
	}).bind(this), 0);
	event.preventDefault();
}
MouseHandler.prototype.ev_mouseup = function(event) {
	if(this.mouseHandler.mouseInMap) {
    	var button = this.mouseHandler.detect_button(event);
        if(button == 1) {
            this.mouseHandler.leftDown = false;
        } else if(button == 3 && this.mouseHandler.mouseSelect) {
        	this.mouseHandler.newInteraction = true;
            this.mouseHandler.rightDown = false;
            if(this.mouseHandler.selectRect.x2 < 0) {
                this.mouseHandler.selectRect.x1 += this.mouseHandler.selectRect.x2;
                this.mouseHandler.selectRect.x2 = -this.mouseHandler.selectRect.x2;
            }
            if(this.mouseHandler.selectRect.y2 < 0) {
                this.mouseHandler.selectRect.y1 += this.mouseHandler.selectRect.y2;
                this.mouseHandler.selectRect.y2 = -this.mouseHandler.selectRect.y2;
            }
            if(this.mouseHandler.selectRect.x2 > 0 && this.mouseHandler.selectRect.y2 > 0) {
                var min = this.mouseHandler.tm.multiplyInverseVector(this.mouseHandler.selectRect.x1, this.mouseHandler.selectRect.y1 + this.mouseHandler.selectRect.y2, 1);
            	var max = this.mouseHandler.tm.multiplyInverseVector(this.mouseHandler.selectRect.x1 + this.mouseHandler.selectRect.x2, this.mouseHandler.selectRect.y1 , 1);
            	this.mouseHandler.setRange(min.x, min.y, max.x, max.y);
                this.mouseHandler.selectRect.x1 = 0;
                this.mouseHandler.selectRect.y1 = 0;
                this.mouseHandler.selectRect.x2 = 0;
                this.mouseHandler.selectRect.y2 = 0;
                this.mouseHandler.mouseSelect = false;
                this.mouseHandler.plotter.draw();
            }
        }
	}
}
MouseHandler.prototype.setRange = function (x1, y1, x2, y2) {
	var area = this.plotter.getDiagramArea();
	var minScreen = this.tm.multiplyInverseVector(area.x1, area.y2, 1);
    var maxScreen = this.tm.multiplyInverseVector(area.x2, area.y1, 1);
    var min = { x: x1, y : y1};
	var max = { x: x2, y : y2};
	var translate = {x : (min.x + max.x)/2, y : (max.y + min.y)/2};
    var zoom = {
        x : Math.abs((maxScreen.x - minScreen.x)/(max.x - min.x)),
        y : Math.abs((maxScreen.y - minScreen.y)/(max.y - min.y))
    };
	this.tm.transform(1, 0, 0, 1, translate.x, translate.y);
    this.tm.transform(zoom.x, 0, 0, zoom.y, 0, 0);
    this.tm.transform(1, 0, 0, 1, -translate.x, -translate.y);
    // correct translation caused by scaling trough adjusting 
    // min.y and min.x to minScreen.x and minScreen.y
    minScreen = this.tm.multiplyInverseVector(area.x1, area.y2, 1);
	this.tm.transform(1, 0, 0, 1, minScreen.x - min.x, minScreen.y - min.y);
    this.scale.x *= zoom.x;
    this.scale.y *= zoom.y;
    this.newInteraction = true;
    this.plotter.draw();
}
MouseHandler.prototype.getRange = function() {
    var minScreen = this.tm.multiplyInverseVector(0, this.canvas.height, 1);
    var maxScreen = this.tm.multiplyInverseVector(this.canvas.width, 0, 1);
    var range = {
        x1 : minScreen.x,
        y1 : minScreen.y,
        x2 : maxScreen.x,
        y2 : maxScreen.y
    };
    return range;
}
////////////////////////////////////////////////////////////////////////////////////

function Plotter(canvas) {
	this.canvas = canvas;
	this.mouseHandler = new MouseHandler(this.canvas, this);
	window.mouseHandler = this.mouseHandler;
	this.diagram = document.createElement("canvas");
	this.diagram.width = this.canvas.width;
	this.diagram.height = this.canvas.height;
	this.canvas.style.cursor = "none";
	this.canvas.textAlign = 'top';
	// disable selecting for the plotter
	this.canvas.style.webkitTouchCallout = "none";
	this.canvas.style.webkitUserSelect = "none";
	this.canvas.style.webkitTapHighlightColor = "none";
	this.canvas.style.khtmlUserSelect = "none";
	this.canvas.style.mozUserSelect = "none";
	this.canvas.style.msUserSelect = "none";
	this.canvas.style.userSelect = "none";
	this.canvas.style.outline = "none";
	this.canvas.onselectstart = function() {
		return false;
	}// ie
	this.canvas.oncontextmenu = function(e){
        	return false;
    	};
	this.canvas.imageSmoothingEnabled = false;
	this.gridFontColor = '#808080';
	this.gridLineColor = '#D2D2D2';
	this.textColor = 'black';
	this.selectionLineColor = '#1e90ff';
	this.selectionFillColor = '#b0c4de';
	this.toolTipBackground = '#ECE5B6';
	this.cursorColor = 'black';//'#000000';
	this.fontSize = 11;
	this.gridStep = 7.5;
	this.labels = {
			x : {data : new Array(), max : 0, offset : 0}, 
			y : {data : new Array(), max : 0, offset : 0}
	};
	this.zeroRect = {x1 : 0, y1 : 0, x2 : 0, y2 : 0};
	this.xFormatter = this.defaultFormatter;
	this.yFormatter = this.defaultFormatter;
	this.functions = new Array();
    this.pointSets = new Array();
    this.lines = new Array();
	this.mouseHandler.newInteraction = true;
	this.draw();
}
Plotter.prototype.getDiagramArea = function() {
	return {
		x1 : this.labels.y.max + this.labels.y.offset,
		y1 : 0,
		x2 : this.canvas.width,
		y2 : this.canvas.height - 2*this.fontSize
	};
}
Plotter.prototype.resize = function (width, height) {
    var range = this.mouseHandler.getRange();
	this.mouseHandler.canvas.width = width;
	this.mouseHandler.canvas.height = height;
	this.diagram.width = this.canvas.width;
	this.diagram.height = this.canvas.height;
    this.mouseHandler.setRange(range.x1, range.y1, range.x2, range.y2);
    this.mouseHandler.newInteraction = true;
	this.draw();
    this.mouseHandler.newInteraction = true;
    this.draw();
}
Plotter.prototype.setRange = function (x1, y1, x2, y2) {
	this.mouseHandler.setRange(x1, y1, x2, y2);
}
Plotter.prototype.drawMouseSelectionRect = function(context) {
	if(this.mouseHandler.rightDown) {
    	context.save();
    	context.setTransform(1, 0, 0, 1, 0, 0);
    	context.beginPath();
    	context.rect(this.mouseHandler.selectRect.x1, this.mouseHandler.selectRect.y1, this.mouseHandler.selectRect.x2, this.mouseHandler.selectRect.y2);
    	context.strokeStyle = this.selectionLineColor;
    	context.fillStyle = this.selectionFillColor;
    	context.globalAlpha=0.45; 
    	context.fill();
    	context.globalAlpha=0.4; 
    	context.stroke();
    	context.restore();
    	context.globalAlpha=1.0;
    }
}
Plotter.prototype.drawMouseCursor = function(context) {
    if(this.mouseHandler.mouseInMap) {
    	this.mouseHandler.mouseOnMap = this.mouseHandler.tm.multiplyInverseVector(this.mouseHandler.mouse.x, this.mouseHandler.mouse.y, 1);
        context.save();
        var txt = this.xFormatter(this.mouseHandler.mouseOnMap.x) + ", " + this.yFormatter(this.mouseHandler.mouseOnMap.y);
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.font = this.fontSize + "px Arial";
        this.canvas.lineWidth = 1;
        context.globalAlpha=1; 
        var txtwidth = context.measureText(txt).width;
        var txtpos = {
            x : 0,
            y : 0
        };
        if(this.mouseHandler.mouse.x + 2 + txtwidth > this.canvas.width) {
            txtpos.x = this.mouseHandler.mouse.x - 6 - txtwidth;
        } else {
            txtpos.x = this.mouseHandler.mouse.x + 6;
        }
        if(this.mouseHandler.mouse.y + 12 + this.fontSize > this.getDiagramArea().y2) {
            txtpos.y = this.mouseHandler.mouse.y - this.fontSize + 2;
        } else {
            txtpos.y = this.mouseHandler.mouse.y + this.fontSize + 4;
        }
        context.fillStyle = this.toolTipBackground;
        context.fillRect(txtpos.x, txtpos.y + 1, txtwidth, -this.fontSize);
        context.fillStyle = this.textColor;
        context.fillText(txt, txtpos.x, txtpos.y);
        context.fillStyle = this.cursorColor;
        context.strokeStyle = this.cursorColor;

        context.fillRect(this.labels.y.max + this.labels.y.offset, this.mouseHandler.mouse.y-0.5, this.canvas.width, 0.5);
        context.fillRect(this.mouseHandler.mouse.x, 0, 0.5, this.canvas.height - this.labels.x.offset );

        context.beginPath();
        context.fillStyle = this.cursorColor;
        context.arc(this.mouseHandler.mouse.x+0.5, this.mouseHandler.mouse.y-0.5, 2, 0, Math.PI*2, true);
        context.fill();

        context.restore();
    }
}
Plotter.prototype.round = function(x) {
	// With a bitwise or.
	var ret = (0.5 + x) | 0;
	// A double bitwise not.
	ret = ~~ (0.5 + x);
	// Finally, a left bitwise shift.
	ret = (0.5 + x) << 0;
	return ret;
}
Plotter.prototype.drawGrid = function(context) {
	var minScreen = this.mouseHandler.tm.multiplyInverseVector(0, this.mouseHandler.canvas.height, 1);
    var maxScreen = this.mouseHandler.tm.multiplyInverseVector(this.mouseHandler.canvas.width, 0, 1);
    var x = {start : 0, end : 0, step : 0};
    var y = {start : 0, end : 0, step : 0};
    if(minScreen.x > 0) {
    	x.step = (maxScreen.x - minScreen.x)/this.gridStep;
    	var xcount = Math.floor(minScreen.x/x.step);
    	x.start = (xcount+1)*x.step;
    	x.end = maxScreen.x;
    } else if(maxScreen.x < 0) {
    	x.step = (maxScreen.x - minScreen.x)/this.gridStep;
    	var xcount = Math.abs(Math.floor(maxScreen.x/x.step));
    	x.start = (xcount+this.gridStep)*-x.step;
    	x.end = x.start - (this.gridStep + 1)*-x.step;
    } else {
    	x.step = (maxScreen.x - minScreen.x)/this.gridStep;
    	x.start = Math.floor(minScreen.x/x.step)*x.step;
    	x.end = (Math.floor(maxScreen.x/x.step) + 1)*x.step;
    }
    if(minScreen.y > 0) {
    	y.step = (maxScreen.y - minScreen.y)/this.gridStep;
    	var ycount = Math.floor(minScreen.y/y.step);
    	y.start = (ycount+1)*y.step;
    	y.end = maxScreen.y;
    } else if(maxScreen.y < 0) {
    	y.step = (maxScreen.y - minScreen.y)/this.gridStep;
    	var ycount = Math.abs(Math.floor(maxScreen.y/y.step));
    	y.start = (ycount+this.gridStep)*-y.step;
    	y.end = y.start - (this.gridStep + 1)*-y.step;
    } else {
    	y.step = (maxScreen.y - minScreen.y)/this.gridStep;
    	y.start = Math.floor(minScreen.y/y.step)*y.step;
    	y.end = (Math.floor(maxScreen.y/y.step) + 1)*y.step;
    }
    this.labels.x.data = new Array();
    this.labels.y.data = new Array();
    this.labels.y.max = 0;
    this.labels.x.max = 0;
    context.fillStyle = this.gridLineColor;
    context.strokeStyle = this.gridLineColor;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.lineWidth=1;
    context.font = this.fontSize + "px Arial";
    for(var step = x.start; step < x.end; step+=x.step) {
    	var p = this.mouseHandler.tm.multiplyVector(step, 0, 1);
        context.fillRect(this.round(p.x-0.5), 0, this.round(0.5), this.round(this.canvas.height - this.labels.x.offset));
        var txt = this.xFormatter(step);
        var width = context.measureText(txt).width;
        var label = {label : txt, width : width, x : p.x, y : this.canvas.height};
        if(this.labels.x.max < label.width) {
        	this.labels.x.max = label.width;
        }
        this.labels.x.data.push(label);
	}
    for(var step = y.start; step < y.end; step+=y.step) {
    	var p = this.mouseHandler.tm.multiplyVector(0, step, 1);
    	if(p.y < (this.canvas.height - this.fontSize)) {
        	context.fillRect(0, this.round(p.y-0.5), this.round(this.canvas.width), this.round(0.5));
            var txt = this.yFormatter(step);
            var width = context.measureText(txt).width;
            var label = {label : txt, width : width, x : 0, y : p.y};
            if(this.labels.y.max < label.width) { 
            	this.labels.y.max = label.width;
            }
            this.labels.y.data.push(label);
        }  
	}
    
    context.restore();
    this.labels.y.offset = Math.round(this.labels.y.max/13+0.5); 
    this.labels.x.offset = this.fontSize*2;
}
Plotter.prototype.drawLabels = function(context) {
	context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = 'white';
	context.fillRect(0,0, this.labels.y.max + this.labels.y.offset, this.canvas.height);
	context.fillRect(0,this.canvas.height - this.fontSize*2, this.canvas.width, this.canvas.height - this.fontSize*2);
	context.fillStyle = this.textColor;
	context.strokeStyle = 'black';
	context.font = this.fontSize + "px Arial";
	context.textAlign="end"; 
	context.fillRect(this.round(this.labels.y.max + this.labels.y.offset), 0, this.round(0.5), this.round(this.canvas.height - this.fontSize*2));
	context.fillRect(this.round(this.labels.y.max + this.labels.y.offset), this.round(this.canvas.height - this.fontSize*2), this.round(this.canvas.width - 1), this.round(0.5));
	context.fillRect(this.round(this.canvas.width - 1), this.round(this.canvas.height - this.fontSize*2), this.round(0.5), -this.round(this.canvas.height - this.fontSize*2));
	context.fillRect(this.round(this.labels.y.max + this.labels.y.offset), 0, this.round(this.canvas.width - 1), this.round(0.5));
	var step = Math.round((this.fontSize*2)/Math.abs(this.labels.y.data[1].y - this.labels.y.data[0].y)+0.5);
	for(var i = 0; i < this.labels.y.data.length; i+=step) {
		var label = this.labels.y.data[i];
		if(label.y < this.canvas.height - this.fontSize*2) {
			context.fillText(label.label, this.labels.y.max , label.y+this.fontSize/2);
			context.fillRect(this.round(this.labels.y.max+this.labels.y.offset), this.round(label.y-0.5), -3, this.round(0.5));
		}
	}
	context.textAlign="start";
	step = Math.round(this.labels.x.max/(this.labels.x.data[1].x - this.labels.x.data[0].x)+0.5);
	for(var i = 0; i < this.labels.x.data.length; i+=step) {
		var label = this.labels.x.data[i];
		if(label.x > this.labels.y.max + this.labels.y.offset) {
			context.fillText(label.label, label.x-label.width/2, label.y);
			context.fillRect(this.round(label.x-0.5), this.round(this.canvas.height - this.fontSize*2), this.round(0.5), 5);
		}
	}
    context.restore();
}
Plotter.prototype.drawRectSignal = function (fx, context) {
	context.save();
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.fillStyle = fx.color;
    context.beginPath();
    context.strokeStyle = fx.lineColor;
    this.canvas.lineWidth = 1;
	for(var i = 1; i < fx.points.length; i++) {
		var p1 = this.mouseHandler.tm.multiplyVector(fx.points[i-1].x, fx.points[i-1].y, 1);
        var p2 = this.mouseHandler.tm.multiplyVector(fx.points[i].x, fx.points[i].y, 1);
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p1.y);
        context.lineTo(p2.x, p2.y);
	}
	context.stroke();
	context.restore();
}
Plotter.prototype.drawConnected = function (fx, context) {
	context.save();
	context.setTransform(1, 0, 0, 1, 0, 0);
    context.strokeStyle = fx.lineColor;
    context.lineWidth = fx.lineWidth;
    context.beginPath();
    var p = this.mouseHandler.tm.multiplyVector(fx.points[0].x, fx.points[0].y, 1);
    context.moveTo(p.x, p.y);
    
	for(var i = 1; i < fx.points.length; i++) {
        p = this.mouseHandler.tm.multiplyVector(fx.points[i].x, fx.points[i].y, 1);
        context.lineTo(p.x, p.y);
	}
	context.stroke();
	context.restore();
}
Plotter.prototype.drawConnectedFill = function (fx, context) {
	context.save();
	context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = fx.lineColor;
    context.globalAlpha = fx.alpha;
    this.canvas.lineWidth = 1;
    context.beginPath();
    var p = this.mouseHandler.tm.multiplyVector(fx.points[0].x, fx.points[0].y, 1);
    var origin = this.mouseHandler.tm.multiplyVector(0, 0, 1);
    context.moveTo(p.x, origin.y);
    context.lineTo(p.x, p.y);
	for(var i = 1; i < fx.points.length; i++) {
        p = this.mouseHandler.tm.multiplyVector(fx.points[i].x, fx.points[i].y, 1);
        context.lineTo(p.x, p.y);
	}
	context.lineTo(p.x, origin.y);
	context.fill();
	context.globalAlpha = 1;
	context.restore();
}
Plotter.prototype.drawImpulse = function (fx, context) {
    context.save();
    var origin = this.mouseHandler.tm.multiplyVector(0, 0, 1);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.lineWidth = fx.lineWidth;
    context.fillStyle = fx.lineColor;
    context.strokeStyle = fx.lineColor;
    for(var i = 0; i < fx.points.length; i++) {
        context.beginPath();
        var p = this.mouseHandler.tm.multiplyVector(fx.points[i].x, fx.points[i].y, 1);
        context.moveTo(p.x, origin.y);
        context.lineTo(p.x, p.y);
        context.stroke();
    }
    context.restore();
}
Plotter.prototype.drawPoints = function (fx, context) {
     context.save();
     context.setTransform(1, 0, 0, 1, 0, 0);
     context.lineWidth = fx.lineWidth;
     if(fx.pointsFill) {
    	 context.fillStyle = fx.color;
     } else {
    	 context.fillStyle = 'white';
     }
     context.strokeStyle = fx.lineColor;
     for(var i = 0; i < fx.points.length; i++) {
         var p = this.mouseHandler.tm.multiplyVector(fx.points[i].x, fx.points[i].y, 1);
         context.beginPath();
         context.arc(p.x, p.y, fx.pointSize, 0, Math.PI*2, true);
         context.fill();
         context.beginPath();
         context.arc(p.x, p.y, fx.pointSize, 0, Math.PI*2, true);
         context.stroke();
     }
    context.restore();
}
Plotter.prototype.drawZeroLine = function (context) {
	context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.strokeStyle = this.gridColor;
    var width = 1.5;
    var zeroLine = this.mouseHandler.tm.multiplyVector(0, 0, 1);
    context.beginPath();
    context.fillRect(this.round(0), this.round(zeroLine.y-width), this.round(this.canvas.width), this.round(2*width));
    context.fill();
    context.restore();
}
Plotter.prototype.draw = function () {
	var context = this.canvas.getContext("2d");
    context.fillStyle = "white";
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.save();
    context.setTransform(this.mouseHandler.tm.a, this.mouseHandler.tm.b, this.mouseHandler.tm.c, this.mouseHandler.tm.d, this.mouseHandler.tm.e, this.mouseHandler.tm.f);
    if(this.mouseHandler.newInteraction) {
        var m_context = this.diagram.getContext("2d");
        m_context.fillStyle = "white";
        m_context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        m_context.save();
        m_context.setTransform(this.mouseHandler.tm.a, this.mouseHandler.tm.b, this.mouseHandler.tm.c, this.mouseHandler.tm.d, this.mouseHandler.tm.e, this.mouseHandler.tm.f);
        this.drawGrid(m_context);
        for(var i = 0; i < this.functions.length; i++) {
            if(this.functions[i].points != null) {
                if(this.functions[i].connected && this.functions[i].fill) {
                    this.drawConnectedFill(this.functions[i], m_context);
                }
                if(this.functions[i].showImpulse) {
                    this.drawImpulse(this.functions[i], m_context);
                }
            }
        }

        this.drawZeroLine(m_context);
       	for(var i = 0; i < this.functions.length; i++) {
            if(this.functions[i].points != null) {
                if(this.functions[i].rectangleSignal) {
                    this.drawRectSignal(this.functions[i], m_context);
                }
                if(this.functions[i].connected) {
                    this.drawConnected(this.functions[i], m_context);
                }
                if(this.functions[i].showPoints) {
                    this.drawPoints(this.functions[i], m_context);
                }
            }
       	}
       	
        for(var i = 0; i < this.pointSets.length; i++) {
            if(this.pointSets[i].points != null) {
                this.pointSets[i].draw(m_context,  this.mouseHandler.tm);
            }
       	}
       	
        for(var i = 0; i < this.lines.length; i++) {
            this.lines[i].draw(m_context,  this.mouseHandler.tm);
       	}
       	
       	this.drawLabels(m_context);
       	m_context.restore();
       	this.mouseHandler.newInteraction = false;
    }
   	context.save();
   	context.setTransform(1, 0, 0, 1, 0, 0);
   	context.drawImage(this.diagram, 0, 0);
   	context.restore();
    this.drawMouseSelectionRect(context);
    this.drawMouseCursor(context);
    context.restore();
}
Plotter.prototype.update = function() {
    this.mouseHandler.newInteraction = true;
    this.draw();
}
/**
 * Expected an Date represented as milliseconds and returns a formated String 
 * formated as dd.MM.YY HH:MM 
 **/
Plotter.prototype.millisecondsToDateFormater = function(value) {
	var v = value;
	var date = new Date(v);
	var day = date.getDate();
	var month = date.getMonth() + 1; // begins counting at zero
	var year = date.getFullYear();
	var string = day + "." + month + "." + year + "\n" + 
	date.getHours() + ":" + date.getMinutes();
	return string;
}
/**
 * default formater, converts value only to string.
 **/
Plotter.prototype.defaultFormatter = function(value) {
	var string = "";
	string += Math.round(value*100000)/100000;
	return string;
}
Plotter.prototype.addMathFunction = function(fx) {
	this.functions.push(fx);
}
Plotter.prototype.addPointSet = function(set) {
	this.pointSets.push(set);
}
Plotter.prototype.addLine = function(line) {
	this.lines.push(line);
}
Plotter.prototype.clearMathFunctions = function() {
	this.functions = new Array();
}
Plotter.prototype.focus = function() {
    var xmin = -1;
    var xmax =  1;
    var ymin = -1;
    var ymax =  1;
	if(this.functions.length > 0) {
        if(this.functions[0].points != null && this.functions[0].points.length > 0) {
            xmin = this.functions[0].points[0].x;
            xmax = this.functions[0].points[0].x;
            ymin = this.functions[0].points[0].y;
            ymax = this.functions[0].points[0].y;
            // search for min and max of all functions with naive algorithm
            for(var i = 0; i < this.functions.length; i++) {
                var fx = this.functions[i];
                for(var j = 0; j < fx.points.length; j++) {
                    if(fx.points[j].x > xmax) {
                        xmax = fx.points[j].x;
                    } else if(fx.points[j].x < xmin) {
                        xmin = fx.points[j].x;
                    }
                    if(fx.points[j].y > ymax) {
                        ymax = fx.points[j].y;
                    } else if(fx.points[j].y < ymin) {
                        ymin = fx.points[j].y;
                    }
                }
            }
	   	}
	}
	if(this.pointSets.length > 0) {
        if(this.pointSets[0].points != null && this.pointSets[0].points.length > 0) {
            for(var i = 0; i < this.pointSets.length; i++) {
                var set = this.pointSets[i];
                for(var j = 0; j < set.points.length; j++) {
                    if(set.points[j].x > xmax) {
                        xmax = set.points[j].x;
                    } else if(set.points[j].x < xmin) {
                        xmin = set.points[j].x;
                    }
                    if(set.points[j].y > ymax) {
                        ymax = set.points[j].y;
                    } else if(set.points[j].y < ymin) {
                        ymin = set.points[j].y;
                    }
                }
            }
        }
    }
    if(this.lines.length > 0) {
        for(var i = 0; i < this.lines.length; i++) {
            var line = this.lines[i];
            
            if(line.p1.x > xmax) {
                xmax = line.p1.x;
            }
            if(line.p1.x < xmin) {
                xmin = line.p1.x;
            }
            
            if(line.p2.x > xmax) {
                xmax = line.p2.x;
            } 
            
            if(line.p2.x < xmin) {
                xmin = line.p2.x;
            }
            
            if(line.p1.y > ymax) {
                ymax = line.p1.y;
            }
            
            if(line.p1.y < ymin) {
                ymin = line.p1.y;
            }
            
            if(line.p2.y > ymax) {
                ymax = line.p2.y;
            }
            
            if(line.p2.y < ymin) {
                ymin = line.p2.y;
            }
        }
    }
    var offset = 1.08;
    this.mouseHandler.setRange(xmin*offset, ymin*offset, xmax*offset, ymax*offset);
	this.mouseHandler.newInteraction = true;
	this.draw();
}
////////////////////////////////////////////////////////////////////////////////////
function MathFunction(f) {
	this.name = '';
	this.points = new Array();
	this.color = 'white';
	this.alpha = 0.2;
    this.lineColor = 'red';
    this.rectangleSignal = false;
    this.connected = false;
    this.showImpulse = false;
    this.showPoints = true;
    this.lineWidth = 1.0;
    this.fill = false;
    this.pointsFill = false;
    this.start = 0;
    this.end = 100;
    this.step = 0;
    this.count = 100;
    this.pointSize = 3;
    this. f = f;
    this.df = null;
    this.mAv = null;
}
MathFunction.prototype.setFilledConnected = function(color, filledPoints) {
	this.lineColor = color;
	if(filledPoints) {
		this.color = color;
	} else {
		this.color = 'white';
	}
	this.fill = true;
	this.connected = true;
	this.rectangleSignal = false;
}
MathFunction.prototype.addPoint = function (_x, _y) {
	this.points.push({x : _x, y : _y});
}
MathFunction.prototype.init = function () {
	var x = this.start;
	var dx = (this.end - x) / this.count;
	this.step = dx;
	for(;x < this.end;x+=dx) {
        var p = {
            x : x,
            y : this.f(x)
        };
        this.addPoint(p.x, p.y);
    }
}
MathFunction.prototype.incrementMathFunction = function () {
	for(var i = 1; i < this.points.length; i++) {
        this.points[i-1].x = this.points[i].x;
        this.points[i-1].y = this.points[i].y;
    }
	var x = this.points[this.points.length-1].x + this.step;
	this.points[this.points.length-1].x = x;
	this.points[this.points.length-1].y = this.f(x);
}
MathFunction.prototype.copyMathFunction = function() {
	var c = new MathFunction();
	for(var i = 0; i < this.points.length; i++) {
		c.addPoint(this.points[i].x, this.points[i].y);
	}
	return c;
}
MathFunction.prototype.differentiate = function() {
    this.df = new MathFunction(null);
    this.df.showPoints = false;
    this.df.lineColor = 'blue';
    for(var i = 1; i < this.points.length-1; i++) {
        var x1 = this.points[i-1].x;
        var y1 = this.points[i-1].y;
        var x2 = this.points[i+1].x;
        var y2 = this.points[i+1].y;
        var m = (y2 - y1) / (x2 - x1);
        this.df.addPoint(x1, m);
    }
}
MathFunction.prototype.movingAverage = function() {
    this.mAv = new MathFunction(null);
    this.mAv.showPoints = false;
    this.mAv.lineColor = 'blue';
    var q = 6;
    var n = 2*q + 1;
    for(var i = 0; i < this.points.length; i++) {
        tmp = 0;
        tmpx = 0;
        for(var j = i; j < i + n; j++) {
            if(j < this.points.length)
                tmp += this.points[j].y;
            else
                break;
        }
        tmp /= n;
        this.mAv.addPoint(this.points[i].x, tmp);
    }
}
MathFunction.prototype.interfereX = function() {
    for(var i = 1; i < this.points.length-1; i++) {
         this.points[i-1].x += random(-0.5, 0.5);
    }
}
MathFunction.prototype.getRange = function(start, end) {
}
MathFunction.prototype.clearPoints = function () {
	this.points = new Array();
}
////////////////////////////////////////////////////////////////////////////////////
function PointSet() {
	this.name = '';
    this.points = new Array();
	this.color = 'black';
	this.alpha = 0.2;
    this.pointSize = 3;
}
PointSet.prototype.addPoint = function (_x, _y) {
	this.points.push({x : _x, y : _y});
}
PointSet.prototype.setPoint = function (i, _x, _y) {
	this.points[i].x = _x;
    this.points[i].y = _y;
}
PointSet.prototype.draw = function (context, tm) {
     context.save();
     context.setTransform(1, 0, 0, 1, 0, 0);

     context.fillStyle = this.color;
     context.strokeStyle = this.color;
    
     for(var i = 0; i < this.points.length; i++) {
         var p = tm.multiplyVector(this.points[i].x, this.points[i].y, 1);
         context.beginPath();
         context.arc(p.x, p.y, this.pointSize, 0, Math.PI*2, true);
         context.fill();
     }

     context.restore();
}
////////////////////////////////////////////////////////////////////////////////////
function Line() {
	this.name = '';
    this.p1 = {x:0, y:0};
    this.p2 = {x:1, y:1};

	this.color = 'black';
	this.alpha = 1.2;
    this.pointSize = 3;
    this.lineWidth = 2;
}
Line.prototype.setP1 = function (_x, _y) {
	this.p1.x = _x;
    this.p1.y = _y;
}
Line.prototype.setP2 = function (_x, _y) {
	this.p2.x = _x;
    this.p2.y = _y;
}
Line.prototype.draw = function (context, tm) {

     context.save();
     context.setTransform(1, 0, 0, 1, 0, 0);
     context.fillStyle = this.color;
     context.strokeStyle = this.color;
    
     context.beginPath();
     var p = tm.multiplyVector(this.p1.x, this.p1.y, 1);
     context.moveTo(p.x, p.y);
     
     p = tm.multiplyVector(this.p2.x, this.p2.y, 1);
     context.lineTo(p.x, p.y);
	 
     context.stroke();
     
	 context.restore();
}
////////////////////////////////////////////////////////////////////////////////////
