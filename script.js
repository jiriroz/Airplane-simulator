function sketchProc(processing) {
/*Simple 2D airplane simulator. Author Jiri Roznovjak*/

var CWIDTH = 800, CHEIGHT = 600; //canvas width and height
var KEY = 0; // current processing.key pressed. for some reason, processing js doesn't allow to use boolean variable processing.keypressed, so I have to handle it on my own. 0 signifies no processing.key is pressed.
var SCENE = 1;
processing.size(CWIDTH,CHEIGHT);
processing.background(72,208,235);
var sceneOffset = 100; //offset for scene shifting
var groundLevel = 50; //offset of the ground from the bottom
var leftMostGround = 400, rightMostGround = 400; //x-coordinate of the leftmost and rightmost ground
var img = processing.loadImage('plane.png'); //169x79px

var Time = function () { //keeps track of and displays time
	this.displayTime = 0;
	this.currentTime = 0;
	this.x = 0;
	this.y = 0;
};

Time.prototype.setup = function (x,y,start) {
	this.x = x;
	this.y = y;
	this.displayTime = start;
	this.currentTime = processing.millis();
};

Time.prototype.update = function () {
	if (processing.millis()-this.currentTime > 1000) {
		this.currentTime = processing.millis();
		this.displayTime -= 1;
	}
};

Time.prototype.display = function () {
	processing.textSize(12);
	processing.fill(0,0,0);
	processing.textAlign(processing.CENTER);
	processing.text(this.displayTime,this.x,this.y);
};

Time.prototype.run = function () {
	this.update();
	this.display();
};

var Button = function (x,y,width,height,color,text,textSize) { //x and y are the center of the button
	this.position = new processing.PVector(x,y);
	this.width = width;
	this.height = height;
	this.color = color;
	this.text = text;
	this.textSize = textSize;
	this.stroke = 0;
	this.radius = 0;
};

Button.prototype.setStroke = function (stroke,color) { //sets rect stroke and its color
	this.stroke = stroke;
	this.strokeColor = color;
};
Button.prototype.setRadius = function (radius) {
	this.radius = radius;
};
Button.prototype.checkMouse = function () { //returns true is mouse is above the button, nothing else
	var right = this.position.x+this.width/2;
	var left = this.position.x-this.width/2;
	var up = this.position.y-this.height/2;
	var down = this.position.y+this.height/2;
	if (processing.mouseX>left && processing.mouseX < right && processing.mouseY > up && processing.mouseY < down) {
		return true;
	}
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
	processing.rect(this.position.x,this.position.y,this.width,this.height,0);
	processing.textSize(this.textSize);
	processing.textAlign(processing.CENTER);
	processing.fill(0,0,0);
	processing.text(this.text,this.position.x,this.position.y+this.textSize/3);
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

var Ring = function (x,y,radius,visible) { //visible determines whether the ring is visible at first, can have values 1 or 0
	this.position = new processing.PVector(x,y);
	this.radius = radius; //radius in the y-direction
	this.opacity = 255*visible;
	this.angle = 0;
};

Ring.prototype.display = function () {
	var s = 5;
	processing.noFill();
	processing.strokeWeight(s);
	processing.stroke(255,0,0,this.opacity);
	processing.ellipse(this.position.x,this.position.y,this.radius,this.radius*2);
};

Ring.prototype.checkThrough = function (plane) { //returns true if airplane is in the ring
	if (plane.position.x<this.position.x+2 && plane.position.x>this.position.x-2 && plane.position.y>this.position.y-this.radius && plane.position.y<this.position.y+this.radius) {
		return true;
	}
};

Ring.prototype.airplaneThrough = function () { //method that handles when the airplane flies through the ring
	this.position.x += 600;
	this.position.y += Math.random()*200-100;
	this.opacity = 0;
};

Ring.prototype.show = function () { //ring is shown after the previous ring is flown through
	this.opacity = 255;
}

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
	this.velRange = 0.7;
	this.minVel = 4;
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

Airplane.prototype.controls = function () {
	if (KEY === 37 || KEY === 38) {
		this.turn(-1);
	} else if (KEY === 39 || KEY === 40) {
		this.turn(1);
	}
};


var GameScene = function () {
};

GameScene.prototype.setup = function () {
	this.aircraft = new Airplane(CWIDTH/2,CHEIGHT-groundLevel-10);
	this.rings = [];
	this.grounds = [new Ground(400)];
	this.smokes = [];
	this.xTranslate = 0; //how much the scene is shifted in the x-direction
	this.score = 0;
	this.rings.push(new Ring(900,200,30,1));
	this.rings.push(new Ring(1200,300,30,0));
};

GameScene.prototype.shiftScene = function () { //shifts the scene according to how the plane is moving
	processing.stroke(255,0,0);
	this.xTranslate -= this.aircraft.velocity.x;
	processing.translate(this.xTranslate,0);
};

GameScene.prototype.run = function () {
	processing.background(72,208,235);
	this.grounds[0].display();
	processing.fill(0,0,0);
	time.run();
	this.shiftScene(this.aircraft);
	this.aircraft.controls();
	updateSmokes(this.smokes,this.aircraft);
	this.rings[0].display();
	this.rings[1].display();
	if (this.rings[0].checkThrough(this.aircraft)) {
		this.rings[0].airplaneThrough();
		this.rings[1].show();
			this.score += 1;
	}
	if (this.rings[1].checkThrough(this.aircraft)) {
		this.rings[1].airplaneThrough();
		this.rings[0].show();
			this.score += 1;
	}
	/*for (var i=0;i<this.rings.length;i++) {
		this.rings[i].display();
		if (this.rings[i].checkThrough(this.aircraft)) {
			this.rings[i].airplaneThrough();
			this.score += 1;
		}
	};*/
	this.aircraft.run();
	if (time.displayTime === 0) {
		SCENE = 1.5;
	}
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

var TimeOut = function () {
	this.displayed = false;
};

TimeOut.prototype.display = function (score) {
	this.displayed = true;
	processing.noStroke();
	processing.fill(150,150,150,100);
	processing.rectMode(processing.CORNER);
	processing.rect(0,0,CWIDTH,CHEIGHT);
	processing.textSize(40);
	processing.fill(0,0,0);
	processing.text("Time Out!",300,200);
	processing.textSize(20);
	processing.text("Final Score:",300,250);
	processing.text(score,400,250);
};

var mainScene = new GameScene();
var time = new Time();
var timeOut = new TimeOut();
mainScene.setup();
time.setup(700,100,20);


processing.draw = function () { //what gets called before the shift scene stays the same and what after, gets shifted
	if (SCENE === 0) {
		initialScene();
	}
	else if (SCENE === 1) {
		mainScene.run();
	}
	else if (SCENE === 1.5) {
		if (timeOut.displayed === false) {
			timeOut.display(mainScene.score);
		}
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
	} else if (SCENE===1.5) {
		SCENE=1;
		mainScene.setup();
		timeOut.displayed = false;
		time.setup(700,100,20);
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
