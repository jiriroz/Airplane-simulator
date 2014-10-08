function sketchProc(processing) {
/*Simple 2D airplane simulator. Author Jiri Roznovjak*/

var CWIDTH = 800; //canvas width and height
var CHEIGHT = 600;
processing.size(CWIDTH,CHEIGHT);
processing.background(72,208,235);

var Airplane = function (x,y) {
	this.position = new processing.PVector(x,y);
	this.velocity = 2; //magnitude, only in the x-direction
	this.angle = 3.14/4; //declination from the X axis in radians
	this.acceleration = 0;
	this.angleMag = 0.02; //magnitude with which the plane will be turning
};

Airplane.prototype.update = function () {
	//updates current position according to current velocity magnitude and angle using trig
	this.velocity += this.acceleration;
	var x = this.velocity * processing.cos(this.angle);
	var y = this.velocity * processing.sin(this.angle);
	this.position.x += x;
	this.position.y += y;
};

Airplane.prototype.turn = function (direction) {
	//gets called in the event handler function, changes the angle of the airplane according to direction (positive/negative)
	var angleMag = this.angleMag;
	angleMag *= direction;
	this.angle += angleMag;
};

Airplane.prototype.display = function () {
	//simple triangle for now
	processing.fill(0,0,0);
	processing.pushMatrix();
	processing.translate(this.position.x,this.position.y);
	processing.rotate(this.angle);
	processing.triangle(0,10,0,-10,30,0);
	processing.popMatrix();
};


var airplane = new Airplane(200,200);

processing.draw = function () {
	processing.background(72,208,235);
	airplane.update();
	airplane.display();
	if (processing.keyPressed===true) {
		airplane.turn(1);
	}
};


}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
