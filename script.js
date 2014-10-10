function sketchProc(processing) {
/*Simple 2D airplane simulator. Author Jiri Roznovjak*/

var CWIDTH = 800; //canvas width and height
var CHEIGHT = 600;
var KEY = 0; // current processing.key pressed. for some reason, processing js doesn't allow to use boolean variable processing.keypressed, so I have to handle it on my own. 0 signifies no processing.key is pressed.
processing.size(CWIDTH,CHEIGHT);
processing.background(72,208,235);

var smokes = []; //smoke behind the airplane
var smokeTime = 0; //last time smoke was deployed

var Smoke = function (x,y) { //smoke behind the airplane
	this.position = new processing.PVector(x,y);
	this.opacity = Math.random()*150+30;
	radius = Math.random()*4+5 //implement standard distribution
	this.radius = radius;
};

Smoke.prototype.update = function () { //updates opacity so that it decreases by some number
	this.opacity -= 0.7;
};

Smoke.prototype.display = function () {
	processing.noStroke();
	col = processing.color(155,155,155,this.opacity);
	processing.fill(col);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
};

var updateSmokes = function () { //function that gets called in the draw method and handles all the smoke stuff
	if (processing.millis() - smokeTime > 200) {
		smokeTime = processing.millis();
		smokes.push(new Smoke(airplane.position.x,airplane.position.y));
	}
	for (var i=0;i<smokes.length;i++) {
		smokes[i].update();
		smokes[i].display();
		if (smokes[i].opacity < 0) { //deletes the smoke that is no longer visible.
			smokes.splice(i,1);
			if (i != smokes.length-1) {
				i--;
			}
		}
	}
}


var Airplane = function (x,y) {
	this.position = new processing.PVector(x,y);
	this.velocity = 2; //magnitude, only in the x-direction
	this.angle = 3.14/4; //declination from the X axis in radians
	this.acceleration = 0;
	this.angleMag = 0.05; //magnitude with which the plane will be turning
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

Airplane.prototype.run = function () { //gets called in the draw method, handles all airplane methods
	airplane.update();
	airplane.display();
};

var airplane = new Airplane(200,200);

processing.draw = function () {
	processing.background(72,208,235);
	if (KEY === 37 || KEY === 38) {
		airplane.turn(-1);
	} else if (KEY === 39 || KEY === 40) {
		airplane.turn(1);
	}
	if (airplane.position.x > 700) {
		processing.translate(5,0);
		processing.pushMatrix();
		processing.popMatrix();
	}
	updateSmokes();
	airplane.run();
};

processing.keyPressed = function () {
	KEY = processing.keyCode;
};

processing.keyReleased = function () {
	KEY = 0;
};
}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
