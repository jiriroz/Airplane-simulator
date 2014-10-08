function sketchProc(processing) {
/*Simple 2D airplane simulator. Author Jiri Roznovjak*/

var CWIDTH = 800; //canvas width and height
var CHEIGHT = 600;
processing.size(CWIDTH,CHEIGHT);
processing.background(72,208,235);

var Airplane = function (x,y) {
	this.position = new processing.PVector(x,y);
	this.velocity = new processing.PVector(0,0); //will have a non-zero value just in the x-direction
	this.orientation = 0 //declination from the X axis in radians
};

Airplane.prototype.update = function () {
	this.position.add(this.velocity);

};

Airplane.prototype.display = function () {
	//simple triangle for now
	processing.fill(0,0,0);
	processing.pushMatrix();
	processing.translate(this.position.x,this.position.y);
	processing.rotate(this.orientation);
	processing.triangle(0,0,-30,10,-30,-10);
	processing.popMatrix();
};


var airplane = new Airplane(200,200);

processing.draw = function () {
	airplane.display();
};
}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
