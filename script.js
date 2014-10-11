function sketchProc(processing) {
/*Simple 2D airplane simulator. Author Jiri Roznovjak*/

var CWIDTH = 800; //canvas width and height
var CHEIGHT = 600;
var KEY = 0; // current processing.key pressed. for some reason, processing js doesn't allow to use boolean variable processing.keypressed, so I have to handle it on my own. 0 signifies no processing.key is pressed.
var SCENE = 1;
processing.size(CWIDTH,CHEIGHT);
processing.background(72,208,235);
var sceneOffset = 100; //offset for scene shifting
var groundLevel = 50; //offset of the ground from the bottom
var leftMostGround = 400; 
var rightMostGround = 400; //x-coordinate of the leftmost and rightmost ground
var img = processing.loadImage('plane.png'); //169x79px
//issue: What happens to the mouse position when I translate the canvas?

var Button = function (x,y,width,height,color,text,textSize) { //x and y are the center of the button
	this.position = new processing.PVector(x,y);
	this.width = width;
	this.height = height;
	this.color = color;
	this.text = text;
	this.textSize = textSize;
	this.stroke = 0;
};

Button.prototype.setStroke = function (stroke,color) { //sets rect stroke and its color
	this.stroke = stroke;
	this.strokeColor = color;
};
Button.prototype.setRadius = function (radius) {
};
Button.prototype.checkMouse = function () { //returns true is mouse is above the button, nothing else
};
Button.prototype.display = function () {
	if (this.stroke === 0) {
		processing.noStroke();
	} else {
		processing.stroke(this.strokeColor);
		processing.strokeWeight(this.stroke);
	}
	processing.rectMode(processing.CENTER);
	processing.fill(this.color);
	processing.rect(this.position.x,this.position.y,this.width,this.height);
	processing.textSize(this.textSize);
	processing.textAlign(processing.CENTER);
	processing.fill(0,0,0);
	processing.text(this.text,this.position.x,this.position.y);
};

var Ground = function (xCenter) { //ground function, later will be animated
	this.xCenter = xCenter;
};

Ground.prototype.display = function () {
	processing.noStroke();
	processing.fill(131,247,73);
	processing.rectMode(processing.CORNER);
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

var controls = function (airplane) {
	if (KEY === 37 || KEY === 38) {
		airplane.turn(-1);
	} else if (KEY === 39 || KEY === 40) {
		airplane.turn(1);
	}
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

var updateSmokes = function (smokes,airplane) { //function that gets called in the draw method and handles all the smoke stuff
	if (processing.millis() - airplane.smokeTime > 200) {
		airplane.smokeTime = processing.millis();
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
	this.angleMag = 0.04; //magnitude with which the plane will be turning
	this.velRange = 1;
	this.minVel = 3;
	this.isFlying = 1; //multiplies the velocitymag, is set to 0 when crashed
	this.smokeTime = 0; //last time smoke was deployed
};

Airplane.prototype.update = function () {
	//updates current position according to current velocity magnitude and angle using trig
	this.velocityMag = Math.sin(this.angle)*this.velRange + this.minVel; //velocity is a function of the angle (up-slower,down-faster)
	this.velocityMag += this.acceleration;
	this.velocityMag *= this.isFlying;
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
	this.checkGround();
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

Airplane.prototype.checkGround = function () { //checks if the airplane crashed to the ground
	if (this.position.y > CHEIGHT-groundLevel) {
		this.crash();
	}
};

Airplane.prototype.crash = function () { //crashes the airplane (needs further implementation)
	this.isFlying = 0;
};

var GameScene = function () {
};

GameScene.prototype.setup = function () {
	this.aircraft = new Airplane(CWIDTH/2,540);
	this.rings = [];
	this.grounds = [new Ground(400)];
	this.smokes = [];
	this.xTranslate = 0; //how much the scene is shifted in the x-direction
	var x = 100;
	var y = 0;
	for (var i=0;i<5;i++) {
		//x = Math.random()*760+20;
		y = Math.random()*490+30;
		this.rings.push(new Ring(x,y,30));
		x+=100;
	}
};

GameScene.prototype.shiftScene = function () { //shifts the scene according to how the plane is moving
	processing.stroke(255,0,0);
	this.xTranslate -= this.aircraft.velocity.x;
	processing.translate(this.xTranslate,0);
};

GameScene.prototype.run = function () {
	processing.background(72,208,235);
	testButt.display();
	this.grounds[0].display();
	this.shiftScene(this.aircraft);
	controls(this.aircraft);
	updateSmokes(this.smokes,this.aircraft);
	for (var i=0;i<this.rings.length;i++) {
		this.rings[i].display();
		if (this.rings[i].checkThrough(this.aircraft)) {
			this.rings[i].opacity = 0;
		}
	};
	this.aircraft.run();
};

var initialScene = function () {
	processing.background(72,208,235);
	processing.fill(255,255,255);
	processing.textSize(50);
	processing.text('Initial Scene',230,280);
};

var pause = function () {
	processing.noStroke();
	processing.fill(150,150,150,100);
	processing.rectMode(processing.CORNER);
	processing.rect(0,0,CWIDTH,CHEIGHT);
	processing.fill(255,255,255);
	processing.textSize(50);
	processing.text('Pause',230,280);
};

var testButt = new Button (100,100,100,60,processing.color(50,100,200),"Test",20);
testButt.setStroke(10,processing.color(80,150,70));
var mainScene = new GameScene();
mainScene.setup();

processing.draw = function () { //what gets called before the shift scene stays the same and what after, gets shifted
	if (SCENE === 0) {
		initialScene();
	}
	else if (SCENE === 1) {
		mainScene.run();
	}
	else if (SCENE < 0) {
		//pause, does nothing, pause function invoked in the processing.keypressed method
	}
};

processing.mouseClicked = function () {
	if (SCENE===0) {
		SCENE=1;
	} else if (SCENE===1) {
		//SCENE=0;
	}
};

processing.keyPressed = function () {
	KEY = processing.keyCode;
	if (KEY === 80) {
		SCENE *= -1;
		pause();
	}
};

processing.keyReleased = function () { //Key is reset to 0 when released
	KEY = 0;
};

}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
