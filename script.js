function sketchProc(processing) {
/*Simple 2D airplane simulator. Author Jiri Roznovjak*/

var CWIDTH = 800, CHEIGHT = 600; //canvas width and height
var KEY = 0; // current processing.key pressed. for some reason, processing js doesn't allow to use boolean variable processing.keypressed, so I have to handle it on my own. 0 signifies no processing.key is pressed.
var SCENE = 0; //current scene. (initial screen, game, pause, crash screen, time out
var LEVEL = 1; //current level
processing.size(CWIDTH,CHEIGHT);
processing.background(72,208,235);
var sceneOffset = 100; //offset for scene shifting
var GROUND_LEVEL = 50; //offset of the ground from the bottom
var leftMostGround = 400, rightMostGround = 400; //x-coordinate of the leftmost and rightmost ground
var cloudOffset = 300; //distance between two clouds in the x-direction
var smokeOffset = 80; //time in milliseconds between airplane releases two smokes
var smokeOpacityDecrase = 0.5; //amount by which the opacity of the smoke decrease
var planeImg = processing.loadImage('plane.png'); //169x79px
var PLANE_CRASHED_R = processing.loadImage('plane_crashed_right.png'); //159x77
var PLANE_CRASHED_L = processing.loadImage('plane_crashed_left.png'); //159x77
var cloud1img = processing.loadImage('cloud1.png'); //214x108
var cloud2img = processing.loadImage('cloud2.png'); //164x82
var cloud3img = processing.loadImage('cloud3.png'); //223x105
var cloud4img = processing.loadImage('cloud4.png'); //222x116
var cloud5img = processing.loadImage('cloud5.png'); //244x128
var clouds = [];
var initialScene, mainScene, timeOut, pause;
var GROUND_SHADOW = 15; //shadow of the airplane will appear x pixes from the margin of the ground


var Airplane = function (x,y,vel) {
	this.position = new processing.PVector(x,y);
	this.velocityMag = 0; //magnitude, only in the x-direction
	this.velocity = new processing.PVector(0,0); //needed to compute screen shifting
	this.angle = 0; //declination from the X axis in radians
	this.acceleration = 0;
	this.angleMag = 0.05; //magnitude with which the plane will be turning
	this.velRange = 1;
	this.minVel = vel;
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
	//clockwise positive, counterclockwise negative
	var angleMag = this.angleMag;
	angleMag *= direction;
	this.angle += angleMag;
};

Airplane.prototype.display = function () {
	processing.fill(0,0,0);
	processing.pushMatrix();
	processing.translate(this.position.x,this.position.y);
	processing.imageMode(processing.CENTER);
	if (this.isFlying === 1) {
		processing.rotate(this.angle);
		processing.image(planeImg,0,0,56,26);
	} else if ((this.angle >= 0 && this.angle <= Math.PI/2) || (this.angle > -2*Math.PI && this.angle < -3*Math.PI/2) ) {
		processing.image(PLANE_CRASHED_R,0,0,56,26);
		SCENE = 1.7;
	} else if ((this.angle > Math.PI/2 && this.angle < Math.PI) || (this.angle >= -3*Math.PI/2 && this.angle <= -1*Math.PI) ) {
		processing.image(PLANE_CRASHED_L,0,0,56,26);
		SCENE = 1.7;
	}
	processing.popMatrix();
};

Airplane.prototype.run = function () { //gets called in the draw method, handles all airplane methods
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
	if (this.position.y > CHEIGHT-GROUND_LEVEL+GROUND_SHADOW) {
		this.crash();
	}
};

Airplane.prototype.crash = function () { //crashes the airplane
	this.isFlying = 0;
};

Airplane.prototype.controls = function () { 
	if (KEY === 37 || KEY === 38) {
		this.turn(-1);
	} else if (KEY === 39 || KEY === 40) {
		this.turn(1);
	}
};

Airplane.prototype.ai = function () { //AI for the inital screen display
};

Airplane.prototype.flyToPoint = function (x,y) { //makes the airplane fly to a specific point
	var deltaX = x-this.position.x;
	var deltaY = y-this.position.y;
	var alpha = Math.atan(deltaY/deltaX);
	alpha = alpha.toFixed(1);
	alpha = Number(alpha);
	var currentAngle = this.angle.toFixed(1);
	currentAngle = Number(currentAngle);
	if (alpha > currentAngle) {
		this.turn(1);
	} else if (alpha < currentAngle) {
		this.turn(-1);
	}
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

Button.prototype.setText = function (text) {
	this.text = text;
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

var Cloud = function (img,w,h) {
	this.image = img;
	this.height = h;
	this.width = w;
};

Cloud.prototype.display = function (x,y) {
	processing.imageMode(processing.CENTER);
	processing.image(this.image,x,y,this.width,this.height);
};

var EndLevel = function (text) {
	this.displayed = false;
	this.text = text;
	this.win = false;
	this.returnToMM = new Button (400,450,120,50,processing.color(56,69,183),'Main Menu',20,60);
	this.returnToMM.setRadius(5);
	this.levelFinisher = new Button (400,390,120,50,processing.color(56,69,183),'Try Again',20,60);
	this.levelFinisher.setRadius(5);

};

EndLevel.prototype.display = function (score) {
	if (score >= scoreNeeded()) { //10 is a placeholder, need to be replaced by a variable
		this.win = true;
	} else {
		this.win = false;
	}
	this.displayed = true;
	processing.noStroke();
	processing.fill(150,150,150,100);
	processing.rectMode(processing.CORNER);
	processing.rect(0,0,CWIDTH,CHEIGHT);
	processing.textAlign(processing.CENTER);
	processing.fill(0,0,0);
	this.returnToMM.display();
	if (this.win) {
		this.levelFinisher.setText("Next Level");
	} else {
		this.levelFinisher.setText("Try Again");
	}
	this.levelFinisher.display();
	processing.textSize(70);
	processing.text(this.text,CWIDTH/2,0.4*CHEIGHT);
	processing.textSize(25);
	processing.text("Final Score: " + score,CWIDTH/2,300);
	processing.text("Needed for the next level: " + scoreNeeded(),CWIDTH/2,340);
};

EndLevel.prototype.mouseHandler = function () { //gets called in the mouse clicked function
	if (this.returnToMM.checkMouse()) {
		returnToMainMenu();
		this.displayed = false;
	}
	if (this.levelFinisher.checkMouse()) {
		if (this.win) {
			LEVEL += 1;
		}
		mainScene.setup(LEVEL);
		SCENE = 1;
		this.displayed = false;
	}
};

var GameScene = function () {
	this.time = new Time();
};

GameScene.prototype.setup = function (level) {
	this.level = level;
	this.time.setup(20);
	this.aircraft = new Airplane(CWIDTH/2,CHEIGHT-GROUND_LEVEL-10,5);
	this.grounds = [new Ground(400)];
	this.smokes = [];
	this.xTranslate = 0; //how much the scene is shifted in the x-direction
	this.score = 0;
	this.probability = 0.75; //probability that a new ring will appear forward of the airplane
	this.rings = [];
	this.rings.push(new Ring(900,200,30,true));
	this.rings.push(new Ring(1200,300,30,false));
	this.activeRing = 0; //index of the active and nonactive ring in the rings array
	this.nonActiveRing = 1;
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
	this.time.run();
	processing.textSize(20);
	processing.text("Level " + this.level,50,40);
	this.shiftScene(this.aircraft); //shifts the scene by third and between two shifts clouds are displayed
	this.displayClouds();
	this.checkClouds(); //checks if new clouds need to be added and adds them
	this.shiftScene(this.aircraft);
	this.shiftScene(this.aircraft);
	this.grounds[0].displayShadow(this.aircraft);
	this.updateSmokes();
	this.rings[0].update();
	this.rings[1].update();
	if (this.rings[this.activeRing].checkThrough(this.aircraft)) {
		this.rings[this.activeRing].newPosition(this.rings[this.nonActiveRing],this.probability);
		this.rings[this.activeRing].fading = true;
		this.rings[this.activeRing].appearing = false; //if it was appearing at the same time turn it off
		this.rings[this.nonActiveRing].appearing = true;
		this.rings[this.nonActiveRing].fading = false; //if it was fading at the same time turn it off
		var temp = this.activeRing; //swaps active and nonactive ring
		this.activeRing = this.nonActiveRing;
		this.nonActiveRing = temp;
		this.score += 1;
	}
	this.aircraft.controls();
	this.aircraft.run();
	if (this.time.displayTime === 0) {
		SCENE = 1.5;
	}
};

GameScene.prototype.generateClouds = function () {
	var x = 100;
	for (var i = 0; i < 4; i++) {
		this.addCloud(x);
		x += cloudOffset;
	}
};

GameScene.prototype.addCloud = function (x) {
	var cloud = [];
	cloud.push(x);
	var y = Math.random()*100+70;
	cloud.push(y);
	index = Math.floor(Math.random()*4);
	cloud.push(index);
	if (x > 0) {
		this.clouds.push(cloud);
	} else {
		this.clouds.splice(0,0,cloud);
	}
};

GameScene.prototype.displayClouds = function () {
	for (var i = 0; i < this.clouds.length; i++) {
		clouds[this.clouds[i][2]].display(this.clouds[i][0],this.clouds[i][1]);
	}
};

GameScene.prototype.checkClouds = function () { //checks if a cloud needs to be added and adds one if necessary
	if (this.clouds[this.clouds.length-1][0]-this.aircraft.position.x < 600) {
		this.addCloud(this.clouds[this.clouds.length-1][0]+cloudOffset);
	}
	if (this.aircraft.position.x-this.clouds[0][0]<600) {
		this.addCloud(this.clouds[0][0]-cloudOffset);
	}
};

GameScene.prototype.updateSmokes = function () { //function that gets called in the draw method and handles all the smoke stuff
	if (processing.millis() - this.aircraft.smokeTime > smokeOffset) {
		this.aircraft.smokeTime = processing.millis();
		this.smokes.push(new Smoke(this.aircraft.position.x,this.aircraft.position.y));
	}
	for (var i=0;i<this.smokes.length;i++) {
		this.smokes[i].update();
		this.smokes[i].display();
		if (this.smokes[i].opacity < 0) { //deletes the smoke that is no longer visible.
			this.smokes.splice(i,1);
			if (i != this.smokes.length-1) {
				i--;
			}
		}
	}
};

var Ground = function (xCenter) { //ground function, later will be animated
	this.xCenter = xCenter;
};

Ground.prototype.display = function () {
	processing.noStroke();
	processing.fill(131,247,73);
	processing.rectMode(processing.CORNER);
	processing.rect(this.xCenter-CWIDTH/2,CHEIGHT-GROUND_LEVEL,this.xCenter+CWIDTH/2,CHEIGHT);
};

Ground.prototype.displayShadow = function (airplane) {
	processing.noStroke();
	var opacity = (airplane.position.y)/CHEIGHT * 100;
	var w = airplane.position.y/CHEIGHT * 10 + 20;
	processing.fill(0,0,0,opacity);
	processing.ellipse(airplane.position.x,CHEIGHT - GROUND_LEVEL + GROUND_SHADOW,w,w/4);
};

var InitialScene = function() {
    GameScene.call(this);
};

InitialScene.prototype = Object.create(GameScene.prototype);

InitialScene.prototype.setup = function () {
	this.title = new Button(400,200,400,100,processing.color(53,228,53),"Flight Aerobatics",50,180);
	this.title.setRadius(10);
	this.newGame = new Button(400,300,200,50,processing.color(53,228,53),"New game",30,100);
	this.newGame.setRadius(5);
	this.newGame.hoverHighlight = 80;
	this.aircraft = new Airplane(0,450,3);
	this.smokes = [];
};

InitialScene.prototype.run = function () {
	processing.background(72,208,235);
	this.displayClouds();
	this.title.display();
	if (this.newGame.checkMouse()) { //hover above the newgame button
		this.newGame.hover = true;
	}
	this.newGame.display();
	processing.textSize(20);
	processing.textAlign(processing.CENTER);
	processing.text("Jiri Roznovjak",400,550);
	this.updateSmokes();
	this.aircraft.run();
};

InitialScene.prototype.checkNewGame = function () { //checks if the mouse is located above the newgame
	if (this.newGame.checkMouse()) {
		return true;
	}
};

InitialScene.prototype.displayClouds = function () {
	clouds[0].display(130,100);
	clouds[1].display(650,100);
	clouds[2].display(400,80);
	clouds[3].display(170,380);
	clouds[4].display(600,400);
};

InitialScene.prototype.mouseHandler = function () {
	if (this.checkNewGame()) {
		mainScene.setup(LEVEL);
		SCENE=1;
	}
};

var Pause = function () { //invoked after pressing P
	this.resume = new Button(400,300,150,50,processing.color(56,69,183),'Resume',20,60);
	this.resume.setRadius(5);
	this.returnToMM = new Button(400,360,150,50,processing.color(56,69,183),'Main Menu',20,60);
	this.returnToMM.setRadius(5);
};

Pause.prototype.display = function () {
	processing.noStroke();
	processing.fill(150,150,150,100);
	processing.rectMode(processing.CORNER);
	processing.textAlign(processing.CENTER);
	processing.rect(0,0,CWIDTH,CHEIGHT);
	processing.fill(0,0,0);
	processing.textSize(70);
	processing.text('Pause',CWIDTH/2,0.4*CHEIGHT);
	this.returnToMM.display();
	this.resume.display();
};

Pause.prototype.mouseHandler = function () {
	if (this.returnToMM.checkMouse()) {
		returnToMainMenu();
	} else if (this.resume.checkMouse()) {
		SCENE *= -1;
	}
};

var returnToMainMenu = function () { //what should the program do when I return to main menu
	initialScene.setup();
	SCENE = 0;
	LEVEL = 1;
};

var Ring = function (x,y,radius,visible) { //visible determines whether the ring is visible at first, it's a boolean
	this.position = new processing.PVector(x,y);
	this.radius = radius; //constant radius, actual radius will oscilate around this value
	this.displayRadius = radius; //actual radius in the y direction
	if (visible) {
		this.opacity = 255;
	} else {
		this.opacity = 0;
	}
	this.angle = 0;
	this.fading = false; //the ring is not appearing nor fading when initialized
	this.appearing = false;
	this.rateFade = 8; //rate by which the ring will be appearing/fading
	this.radiusOscillating = false;
	this.radiusSine = 0; //helper variable for the sine function that causes the radius oscillation
};

Ring.prototype.display = function () {
	if (this.fading === true) {
		this.opacity -= this.rateFade;
	}
	if (this.appearing === true) {
		this.opacity += this.rateFade;
	}
	var ratio = 1;
	if (this.radiusOscillating) {
		this.radiusSine += 0.05; //0.1 determines how quickly the radius oscillates
		ratio = 0.4 * Math.sin(this.radiusSine) + 1; //0.3 is the range of the oscillation and 1 the offset
	}
	processing.noFill();
	processing.strokeWeight(5);
	processing.stroke(255,0,0,this.opacity);
	processing.pushMatrix();
	processing.translate(this.position.x,this.position.y);
	processing.rotate(this.angle);
	processing.ellipse(0,0,this.displayRadius*ratio,this.displayRadius*2*ratio);
	processing.popMatrix();
};

Ring.prototype.checkShift = function () { //checks if the ring is supposed to be shifted and shifts it
	if (this.opacity < 0) {
		this.opacity = 0;
		this.position.x = this.newXpos;
		this.position.y = this.newYpos;
		this.fading = false;
		this.newRingData();
	}
	if (this.opacity > 255) {
		this.opacity = 255;
		this.appearing = false;
	}
};

Ring.prototype.checkThrough = function (plane) { //returns true if airplane is in the ring
	if (plane.position.x<this.position.x+3 && plane.position.x>this.position.x-3 && plane.position.y>this.position.y-this.radius && plane.position.y<this.position.y+this.radius) {
		return true;
	}
};

Ring.prototype.newPosition = function (nextRing,probability) { //method that generates and stores new ring position
	if (Math.random() < probability) {
		var xshift = Math.random()*250+100;
	} else {
		var xshift = Math.random()*200*(-1)-50;
	}
	this.newXpos = nextRing.position.x + xshift;
	this.newYpos = Math.random()*(CHEIGHT-200)+GROUND_LEVEL+50;
};

Ring.prototype.newRingData = function () { //generates new ring data (except new position, for which you need to know the position of the next ring
	if (Math.random() > 0.5) { //if true ring will have a new radius. Depend on the level.
		this.displayRadius = this.radius*(Math.random()*0.5+0.5);
	} else {
		this.displayRadius = this.radius;
	}
	if (Math.random() > 0) { //determines if radius will be oscillating
		this.radiusOscillating = true;
	} else {
		this.radiusOscillating = false;
	}
	this.radiusSine = 0;
};

Ring.prototype.update = function () {
	this.display();
	this.checkShift();
};

var scoreNeeded = function () { //determines what score is needed in each level
	return (5+2*LEVEL);	
};

var Smoke = function (x,y) { //smoke behind the airplane
	this.position = new processing.PVector(x,y);
	this.opacity = Math.random()*60+50;
	var radius = Math.random()*2+5; //implement standard distribution
	this.radius = radius;
};

Smoke.prototype.update = function () { //updates opacity so that it decreases by some number
	this.opacity -= smokeOpacityDecrase;
};

Smoke.prototype.display = function () {
	processing.noStroke();
	var col = processing.color(140,140,140,this.opacity);
	processing.fill(col);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
};

var Time = function () { //keeps track of and displays time
	this.displayTime = 0;
	this.currentTime = 0;
	this.x = 750;
	this.y = 40;
};

Time.prototype.setup = function (start) {
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
	processing.textSize(20);
	processing.fill(0,0,0);
	processing.textAlign(processing.CENTER);
	processing.text(this.displayTime,this.x,this.y);
};

Time.prototype.run = function () {
	this.update();
	this.display();
};


clouds.push(new Cloud(cloud1img,214,108));
clouds.push(new Cloud(cloud2img,165,82));
clouds.push(new Cloud(cloud3img,223,105));
clouds.push(new Cloud(cloud4img,222,116));
clouds.push(new Cloud(cloud5img,244,128));

initialScene = new InitialScene();
mainScene = new GameScene();
timeOut = new EndLevel('Time Out!');
crashScreen = new EndLevel('You Crashed!');
pause = new Pause();

initialScene.setup();

processing.draw = function () { //what gets called before the shift scene stays the same and what after, gets shifted
	if (SCENE === 0) { //initial scene
		initialScene.run();
	}
	else if (SCENE === 1) { //main game screen
		mainScene.run();
	}
	else if (SCENE === 1.5) { //time out
		if (timeOut.displayed === false) {
			timeOut.display(mainScene.score);
		}
	}
	else if (SCENE === 1.7) { //crash screen
		if (crashScreen.displayed === false) {
			crashScreen.display(mainScene.score);
		}
	}
	else if (SCENE < 0) {
		//pause, does nothing, pause function invoked in the processing.keypressed method
	}
};

processing.keyPressed = function () {
	KEY = processing.keyCode;
	if (SCENE === 1 || SCENE < 0) {
		if (KEY === 80) { //Pause
			SCENE *= -1;
			pause.display();
		}
	}
	if (KEY === 82) { //R
		SCENE=1;
		mainScene.setup(LEVEL);
		timeOut.displayed = false;
	}
};

processing.keyReleased = function () { //Key is reset to 0 when released
	KEY = 0;
};

processing.mouseClicked = function () {
	clickX = processing.mouseX;
	clickY = processing.mouseY;
	if (SCENE===0) { //initial scene
		initialScene.mouseHandler();
	} else if (SCENE===1) { //main game
	} else if (SCENE===1.5) { //time out
		timeOut.mouseHandler();
	} else if (SCENE === 1.7) { //crash screen
		crashScreen.mouseHandler();
	} else if (SCENE<0) { //pause
		pause.mouseHandler();
	}
};
}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
