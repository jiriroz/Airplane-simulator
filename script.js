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
var planeImg = processing.loadImage('plane.png'); //169x79px
var cloud1img = processing.loadImage('cloud1.png'); //214x108
var cloud2img = processing.loadImage('cloud2.png'); //164x82
var cloud3img = processing.loadImage('cloud3.png'); //223x105
var cloud4img = processing.loadImage('cloud4.png'); //222x116
var cloud5img = processing.loadImage('cloud5.png'); //244x128


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

var Button = function (x,y,width,height,color,text,textSize,opacity) { //x and y are the center of the button
	this.position = new processing.PVector(x,y);
	this.width = width;
	this.height = height;
	this.color = color;
	this.opacity = opacity;
	this.text = text;
	this.textSize = textSize;
	this.stroke = 0;
	this.radius = 0;
	this.hover = false;
	this.hoverHighlight = 0;
};

Button.prototype.setStroke = function (stroke,color) { //sets rect stroke and its color
	this.stroke = stroke;
	this.strokeColor = color;
};
Button.prototype.setRadius = function (radius) {
	this.radius = radius;
};

Button.prototype.setOpacity = function (opacity) {
	this.opacity = opacity;
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
	if (this.hover) {
		processing.fill(this.color,this.opacity+this.hoverHighlight);
	} else {
		processing.fill(this.color,this.opacity);
	}
	processing.rect(this.position.x,this.position.y,this.width,this.height,this.radius);
	processing.textSize(this.textSize);
	processing.textAlign(processing.CENTER);
	processing.fill(0,0,0);
	processing.text(this.text,this.position.x,this.position.y+this.textSize/3);
	this.hover = false;
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

var Ring = function (x,y,radius) { //visible determines whether the ring is visible at first, can have values 1 or 0
	this.position = new processing.PVector(x,y);
	this.radius = radius; //radius in the y-direction
	this.opacity = 255;
	this.angle = 0;
};

Ring.prototype.display = function () {
	processing.noFill();
	processing.strokeWeight(5);
	processing.stroke(255,0,0,this.opacity);
	processing.pushMatrix();
	processing.translate(this.position.x,this.position.y);
	processing.rotate(this.angle);
	processing.ellipse(0,0,this.radius,this.radius*2);
	processing.popMatrix();
};

Ring.prototype.checkThrough = function (plane) { //returns true if airplane is in the ring
	if (plane.position.x<this.position.x+3 && plane.position.x>this.position.x-3 && plane.position.y>this.position.y-this.radius && plane.position.y<this.position.y+this.radius) {
		return true;
	}
};

Ring.prototype.airplaneThrough = function (nextRing,probability) { //method that handles when the airplane flies through the ring
	if (Math.random() < probability) {
		var xshift = Math.random()*300+100;
	} else {
		var xshift = Math.random()*200*(-1)-50;
	}
	this.position.x = nextRing.position.x + xshift;
	this.position.y = Math.random()*(CHEIGHT-200)+groundLevel+50;
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

var Cloud = function (img,w,h) {
	this.image = img;
	this.height = h;
	this.width = w;
};

Cloud.prototype.display = function (x,y) {
	processing.imageMode(processing.CENTER);
	processing.image(this.image,x,y,this.width,this.height);
};

var Airplane = function (x,y) {
	this.position = new processing.PVector(x,y);
	this.velocityMag = 0; //magnitude, only in the x-direction
	this.velocity = new processing.PVector(0,0); //needed to compute screen shifting
	this.angle = 0; //declination from the X axis in radians
	this.acceleration = 0;
	this.angleMag = 0.05; //magnitude with which the plane will be turning
	this.velRange = 1;
	this.minVel = 5;
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
	processing.image(planeImg,0,0,56,26);
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
	if (this.position.y < -100) {
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
	time = new Time(); //defined as global
	this.aircraft = new Airplane(CWIDTH/2,CHEIGHT-groundLevel-10);
	this.rings = [];
	this.grounds = [new Ground(400)];
	this.smokes = [];
	this.xTranslate = 0; //how much the scene is shifted in the x-direction
	this.score = 0;
	this.probability = 0.75; //probability that a new ring will appear forward of the airplane
	this.rings.push(new Ring(900,200,30));
	this.rings.push(new Ring(1200,300,30));
	this.activeRing = 0;
	this.clouds = []; //coordinates and types of clouds
	this.generateClouds();
	
};

GameScene.prototype.shiftScene = function () { //shifts the scene according to how the plane is moving
	processing.stroke(255,0,0);
	this.xTranslate -= this.aircraft.velocity.x;
	processing.translate(this.xTranslate/9,0);
};

GameScene.prototype.run = function () {
	processing.background(72,208,235);
	this.grounds[0].display();
	processing.fill(0,0,0);
	time.run();
	this.shiftScene(this.aircraft); //shifts the scene by third and between two shifts clouds are displayed
	this.displayClouds();
	this.shiftScene(this.aircraft);
	this.shiftScene(this.aircraft);
	this.aircraft.controls();
	updateSmokes(this.smokes,this.aircraft);
	this.rings[this.activeRing].display();
	if (this.rings[this.activeRing].checkThrough(this.aircraft)) {
		var nonActiveRing = Math.abs(Math.pow(2,this.activeRing)-2); //opposite value of the active ring
		this.rings[this.activeRing].airplaneThrough(this.rings[nonActiveRing],this.probability);
		this.activeRing = nonActiveRing;
		this.score += 1;
	}
	this.aircraft.run();
	if (time.displayTime === 0) {
		SCENE = 1.5;
	}
};

GameScene.prototype.generateClouds = function () {
	var x = 100;
	for (var i = 0; i < 8; i++) {
		this.addCloud(x);
		x += 200;
	}
};

GameScene.prototype.addCloud = function (x) {
	var cloud = []
	cloud.push(x);
	cloud.push(100);
	index = Math.floor(Math.random()*4);
	cloud.push(index);
	this.clouds.push(cloud);
};

GameScene.prototype.displayClouds = function () {
	for (var i = 0; i < this.clouds.length; i++) {
		clouds[this.clouds[i][2]].display(this.clouds[i][0],this.clouds[i][1]);
	}
};

var InitialScene = function () { //innital screen, scene number = 0
	this.title = new Button(400,200,400,100,processing.color(0,0,255),"Flight Aerobatics",50,100);
	this.title.setRadius(10);
	this.newGame = new Button(400,300,200,50,processing.color(0,0,255),"New game",30,70);
	this.newGame.setRadius(5);
	this.newGame.hoverHighlight = 20;
};

InitialScene.prototype.run = function () {
	processing.background(72,208,235);
	this.title.display();
	if (this.newGame.checkMouse()) { //hover above the newgame button
		this.newGame.hover = true;
	}
	this.newGame.display();
	processing.textSize(20);
	processing.textAlign(processing.CENTER);
	processing.text("Jiri Roznovjak",400,550);
};

InitialScene.prototype.checkNewGame = function () { //checks if the mouse is located above the newgame
	if (this.newGame.checkMouse()) {
		return true;
	}
};

var pause = function () { //invoked after pressing P, scene num = 1.5 (later maybe change)
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

var clouds = [];
clouds.push(new Cloud(cloud1img,214,108));
clouds.push(new Cloud(cloud2img,165,82));
clouds.push(new Cloud(cloud3img,223,105));
clouds.push(new Cloud(cloud4img,222,116));
clouds.push(new Cloud(cloud5img,244,128));

var initialScene = new InitialScene();
var mainScene = new GameScene();
var timeOut = new TimeOut();
mainScene.setup();
time.setup(700,100,30);

processing.draw = function () { //what gets called before the shift scene stays the same and what after, gets shifted
	if (SCENE === 0) {
		initialScene.run();
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
		if (initialScene.checkNewGame()) {
			SCENE=1;
		}
	} else if (SCENE===1) {
		//SCENE=0;
	} else if (SCENE===1.5) {
		SCENE=1;
		mainScene.setup();
		timeOut.displayed = false;
		time.setup(700,100,30);
	}
};

processing.keyPressed = function () {
	KEY = processing.keyCode;
	if (KEY === 73) { //I
		SCENE = 0;
	}
	if (KEY === 80) { //P
		SCENE *= -1;
		pause();
	}
	if (KEY === 82) { //R
		SCENE=1;
		mainScene.setup();
		timeOut.displayed = false;
		time.setup(700,100,30);
	}
};

processing.keyReleased = function () { //Key is reset to 0 when released
	KEY = 0;
};

}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
