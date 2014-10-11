function sketchProc(processing) {
/*Simple 2D airplane simulator. Author Jiri Roznovjak*/

var CWIDTH = 800; //canvas width and height
var CHEIGHT = 600;
var KEY = 0; // current processing.key pressed. for some reason, processing js doesn't allow to use boolean variable processing.keypressed, so I have to handle it on my own. 0 signifies no processing.key is pressed.
processing.size(CWIDTH,CHEIGHT);
processing.background(72,208,235);
var xTranslate = 0; //how much the scene is translated in the x-direction
var smokes = []; //smoke behind the airplane
var smokeTime = 0; //last time smoke was deployed
var sceneOffset = 100; //offset for scene shifting
var rings = [];
var grounds = [];
var groundLevel = 50; //offset of the ground from the bottom
var leftMostGround = 400; 
var rightMostGround = 400; //x-coordinate of the leftmost and rightmost ground

img = processing.loadImage('plane.png'); //169x79px

var Ground = function (xCenter) { //ground function, later will be animated
	this.xCenter = xCenter;
};

Ground.prototype.display = function () {
	processing.noStroke();
	processing.fill(49,247,49);
	processing.rect(this.xCenter-CWIDTH/2,CHEIGHT-groundLevel,this.xCenter+CWIDTH/2,CHEIGHT);
};

var Ring = function (x,y,radius) {
	this.position = new processing.PVector(x,y);
	this.radius = radius; //radius in the y-direction
	this.opacity = 255;
};

Ring.prototype.display = function () {
	var s = 5;
	processing.noFill();
	processing.strokeWeight(s);
	processing.stroke(255,0,0,this.opacity);
	processing.ellipse(this.position.x,this.position.y,this.radius,this.radius*2);
	processing.stroke(0,0,0,this.opacity);
	processing.strokeWeight(4);
	processing.line(this.position.x,this.position.y+this.radius+s,this.position.x,CHEIGHT-groundLevel);
};

Ring.prototype.checkThrough = function (plane) { //returns true if airplane is in the ring
	if (plane.position.x<this.position.x+2 && plane.position.x>this.position.x-2 && plane.position.y>this.position.y-this.radius && plane.position.y<this.position.y+this.radius) {
		return true;
	}
};

var controls = function () {
	if (KEY === 37 || KEY === 38) {
		airplane.turn(-1);
	} else if (KEY === 39 || KEY === 40) {
		airplane.turn(1);
	}
};

var shiftScene = function (airplane) { //shifts the scene when the plane gets offset close to the margin
	processing.stroke(255,0,0);
	xTranslate -= airplane.velocity.x;
	processing.translate(xTranslate,0);
};

var Smoke = function (x,y) { //smoke behind the airplane
	this.position = new processing.PVector(x,y);
	this.opacity = Math.random()*150+50;
	var radius = Math.random()*4+5; //implement standard distribution
	this.radius = radius;
};

Smoke.prototype.update = function () { //updates opacity so that it decreases by some number
	this.opacity -= 0.3;
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
};

var Airplane = function (x,y) {
	this.position = new processing.PVector(x,y);
	this.velocityMag = 0; //magnitude, only in the x-direction
	this.velocity = new processing.PVector(0,0); //needed to compute screen shifting
	this.angle = 0; //declination from the X axis in radians
	this.acceleration = 0;
	this.angleMag = 0.03; //magnitude with which the plane will be turning
	this.velRange = 1;
	this.minVel = 3;
};

Airplane.prototype.update = function () {
	//updates current position according to current velocity magnitude and angle using trig
	this.velocityMag = Math.sin(this.angle)*this.velRange + this.minVel; //velocity is a function of the angle (up-slower,down-faster)
	this.velocityMag += this.acceleration;
	this.velocity.x = this.velocityMag * Math.cos(this.angle);
	this.velocity.y = this.velocityMag * Math.sin(this.angle);
	this.position.add(this.velocity);
	this.acceleration = 0;
	if (this.angle >= 2*Math.PI || this.angle <= -2*Math.PI) {
		this.angle = 0;
	}
};

Airplane.prototype.applyForce = function (force) {
	this.acceleration = force;
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
	processing.imageMode(processing.CENTER);
	processing.image(img,0,0,56,26);
	processing.popMatrix();
};

Airplane.prototype.run = function () { //gets called in the draw method, handles all airplane methods
	if (this.velocityMag < 3) {
		this.takeOff();
	}
	this.checkUp();
	this.update();
	this.display();
	
};

Airplane.prototype.takeOff = function () {
	this.applyForce(0.03);
	this.angle -=0.001;
};

Airplane.prototype.checkUp = function () { //function that handles when airplane flies off the screen up
	if (this.position.y < -70) {
		this.angle *= -1;
	}
};


var airplane = new Airplane(CWIDTH/2,540);
var x = 0;
var y = 0;
for (var i=0;i<5;i++) {
	x = Math.random()*760+20;
	y = Math.random()*500+30;
	rings.push(new Ring(x,y,30));
}
grounds.push(new Ground(400));

processing.draw = function () { //what gets called before the shift scene stays the same and what after, gets shifted
	processing.background(72,208,235);
	grounds[0].display();
	shiftScene(airplane);
	controls();
	updateSmokes();
	
	/*if (airplane.position.x > rightMostGround) { left checking partially not working, because rectangle apparently cant have + and - x coord.
		grounds.push(new Ground(rightMostGround+800)); zatim to tak nech byt, kdyztak te pak neco napadne. Ted se bude zem posouvat se scenou.
		rightMostGround += 800;
	}
	if (airplane.position.x < leftMostGround) {
		grounds.push(new Ground(leftMostGround-800));
		leftMostGround -= 800;
	}*/
	
	
	for (var i=0;i<rings.length;i++) {
		rings[i].display();
		if (rings[i].checkThrough(airplane)) {
			rings[i].opacity = 0;
		}
	};
	airplane.run();
};

processing.keyPressed = function () {
	KEY = processing.keyCode;
};

processing.keyReleased = function () { //Key is reset to 0 when released
	KEY = 0;
};


}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
