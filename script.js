function sketchProc(processing) {
/*Simple 2D airplane simulator. Author Jiri Roznovjak*/

//canvas width and height
var CWIDTH = 800, CHEIGHT = 600;
// current processing.key pressed
var KEY = 0;
//current scene
var SCENE = 0;
//current level
var LEVEL = 1;
processing.size(CWIDTH,CHEIGHT);
//offset of the ground from the bottom
var GROUND_LEVEL = 50;
//shadow of the airplane will appear x pixes from the margin of the ground
var GROUND_SHADOW = 15;
var cloud1img = processing.loadImage('img/cloud1.png'); //214x108
var cloud2img = processing.loadImage('img/cloud2.png'); //164x82
var cloud3img = processing.loadImage('img/cloud3.png'); //223x105
var cloud4img = processing.loadImage('img/cloud4.png'); //222x116
var cloud5img = processing.loadImage('img/cloud5.png'); //244x128
var clouds = [];
var initialScene, mainScene, timeOut, pause, instructionScreen;

var Airplane = function (x,y,vel) {
    this.position = new processing.PVector(x,y);
    //magnitude, only in the x-direction
    this.velocityMag = 0;
    //needed for computing screen shifting
    this.velocity = new processing.PVector(0,0); 
    this.angle = 0;
    this.acceleration = 0;
    //magnitude with which the plane will be turning
    this.angleMag = 0.05;
    //how the velocity will be affected when flying up/down
    this.velRange = 1;
    this.straightVel = vel;
    this.isFlying = 1;
    this.smokeTime = 0;
    this.imgFlying = processing.loadImage('img/plane.png'); //169x79px
    this.imgCrashedR = processing.loadImage('img/plane_crashed_right.png'); //159x77
    this.imgCrashedL = processing.loadImage('img/plane_crashed_left.png'); //159x77
};

Airplane.prototype.update = function () {
    this.updatePosition();
    this.updateAngle();
};

Airplane.prototype.updateAngle = function () {
    if (this.angle >= 2*Math.PI || this.angle <= -2*Math.PI) {
        this.angle = 0;
    }
};

Airplane.prototype.updatePosition = function () {
    //updates current position according to current velocity magnitude and angle using trig
    this.velocityMag = Math.sin(this.angle)*this.velRange + this.straightVel;
    this.velocityMag += this.acceleration;
    this.velocityMag *= this.isFlying;
    this.velocity.x = this.velocityMag * Math.cos(this.angle);
    this.velocity.y = this.velocityMag * Math.sin(this.angle);
    this.position.add(this.velocity);
    this.acceleration = 0;
};

Airplane.prototype.applyForce = function (force) {
    this.acceleration = force;
};

Airplane.prototype.turn = function (direction) {
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
        this.displayImage(this.imgFlying);
    } else if ( this.isOrientedRight() ) {
        this.displayImage(this.imgCrashedR);
    } else if ( this.isOrientedLeft() ) {
        this.displayImage(this.imgCrashedL);
    }
    processing.popMatrix();
};

Airplane.prototype.isOrientedRight = function () {
    return ((this.angle >= 0 && this.angle <= Math.PI/2) ||
               (this.angle > -2*Math.PI && this.angle < -3*Math.PI/2));
};

Airplane.prototype.isOrientedLeft = function () {
    return ((this.angle > Math.PI/2 && this.angle < Math.PI) ||
               (this.angle >= -3*Math.PI/2 && this.angle <= -1*Math.PI));
};

Airplane.prototype.displayImage = function (planeImage) {
    processing.image(planeImage,0,0,56,26);
};

//gets called in the draw method, handles all airplane methods
Airplane.prototype.run = function () {
    this.handleUpperEdge();
    this.handleGround();
    this.update();
    this.display();
};

//function that handles when airplane flies off the screen up
Airplane.prototype.handleUpperEdge = function () {
    if (this.position.y < -100) {
        this.angle *= -1;
    }
};

//checks if the airplane crashed to the ground
Airplane.prototype.handleGround = function () {
    if (this.position.y > CHEIGHT-GROUND_LEVEL+GROUND_SHADOW) {
        this.crash();
    }
};

//sets necessary variables and constants after crashing
Airplane.prototype.crash = function () {
    this.isFlying = 0;
    SCENE = 3;
};

Airplane.prototype.controls = function () { 
    if (KEY === 37 || KEY === 38) {
        this.turn(-1);
    } else if (KEY === 39 || KEY === 40) {
        this.turn(1);
    }
};

//x and y are the center of the button
var Button = function (x,y,width,height,color,text,textSize,opacity) {
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

Button.prototype.setRadius = function (radius) {
    this.radius = radius;
};

Button.prototype.setText = function (text) {
    this.text = text;
};

//returns true is mouse is above the button, nothing else
Button.prototype.checkMouse = function () {
    var right = this.position.x+this.width/2;
    var left = this.position.x-this.width/2;
    var up = this.position.y-this.height/2;
    var down = this.position.y+this.height/2;
    return (processing.mouseX > left && processing.mouseX < right &&
                processing.mouseY > up && processing.mouseY < down);
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


//determines velocity of vertical oscillation of rings
var determineVerticalOscillation = function () {
    return (0.015 + (LEVEL - 1) * 0.004);
};

//determines frequency of radius oscillation
var determineRadiusOscillation = function () {
    return 0.03 + LEVEL * 0.01;
};

//class for crash and time out screens
var EndLevel = function (text,canWin) { 
    //boolean, determines if it's possible to get Next level button in this scene
    this.canWin = canWin; 
    this.displayed = false;
    this.text = text;
    this.win = false;
    this.returnToMM = new Button(400,450,120,50,processing.color(56,69,183),
                'Main Menu',20,60);
    this.returnToMM.setRadius(5);
    this.levelFinisher = new Button(400,390,120,50,processing.color(56,69,183),
                'Try Again',20,60);
    this.levelFinisher.setRadius(5);
};

EndLevel.prototype.display = function (score) {
    this.win = (score >= scoreNeeded() && this.canWin == true);
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

//gets called in the mouse clicked function
EndLevel.prototype.mouseHandler = function () {
    if (this.returnToMM.checkMouse()) {
        returnToMainMenu();
        this.displayed = false;
    }
    if (this.levelFinisher.checkMouse()) {
        this.nextLevelTryAgain();
    }
};

EndLevel.prototype.nextLevelTryAgain = function () {
    if (this.win) {
        LEVEL += 1;
    }
    mainScene.setup(LEVEL);
    SCENE = 1;
    this.displayed = false;
};


var GameScene = function () {
    this.time = new Time();
        this.cloudOffset = 300;
};

GameScene.prototype.setup = function (level) {
    this.level = level;
    this.time.setup(30);
    this.aircraft = new Airplane(CWIDTH/2,CHEIGHT-GROUND_LEVEL-10,4);
    this.grounds = [new Ground(400)];
    this.smokes = [];
    //how much the scene is shifted in the x-direction
    this.xTranslate = 0;
    this.score = 0;
    this.rings = [];
    this.rings.push(new Ring(900,Math.random()*400+100,30,true));
    this.rings.push(new Ring(1200,Math.random()*400+100,30,false));
    //index of the active and nonactive ring in the rings array
    this.activeRing = 0;
    this.nonActiveRing = 1;
    //stores Cloud objects
    this.clouds = [];
    this.generateClouds();
};

//shifts the scene according to how the plane is moving
GameScene.prototype.shiftScene = function () {
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
    //shifts the scene by third and between two shifts clouds are displayed
    this.shiftScene();
    this.displayClouds();
    //checks if new clouds need to be added and adds them
    this.checkClouds();
    this.shiftScene();
    this.shiftScene();
    this.grounds[0].displayShadow(this.aircraft);
    this.updateSmokes();
    this.rings[0].update();
    this.rings[1].update();
    if (this.rings[this.activeRing].checkThrough(this.aircraft)) {
        this.rings[this.activeRing].storeNextRingPosition(
                        this.rings[this.nonActiveRing].position.x);
        this.rings[this.activeRing].fading = true;
        this.rings[this.activeRing].appearing = false;
        this.rings[this.nonActiveRing].appearing = true;
        this.rings[this.nonActiveRing].fading = false;
        var temp = this.activeRing;
        this.activeRing = this.nonActiveRing;
        this.nonActiveRing = temp;
        this.score += 1;
    }
    this.aircraft.controls();
    this.aircraft.run();
    if (this.time.displayTime === 0) {
        SCENE = 2;
    }
    if (!instructionScreen.displayed) {
        SCENE = 0.5;
    }
};

GameScene.prototype.generateClouds = function () {
    var x = 100;
    for (var i = 0; i < 4; i++) {
        this.addCloud(x);
        x += this.cloudOffset;
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

//checks if a cloud needs to be added and adds one if necessary
GameScene.prototype.checkClouds = function () { 
    if (this.clouds[this.clouds.length-1][0]-this.aircraft.position.x < 600) {
        this.addCloud(this.clouds[this.clouds.length-1][0]+this.cloudOffset);
    }
    if (this.aircraft.position.x-this.clouds[0][0]<600) {
        this.addCloud(this.clouds[0][0]-this.cloudOffset);
    }
};

//function that gets called in the draw method and handles all the smoke stuff
GameScene.prototype.updateSmokes = function () { 
    if (processing.millis() - this.aircraft.smokeTime > 80) {
        this.aircraft.smokeTime = processing.millis();
        this.smokes.push(new Smoke(
                        this.aircraft.position.x,this.aircraft.position.y));
    }
    for (var i=0;i<this.smokes.length;i++) {
        this.smokes[i].update();
        this.smokes[i].display();
        if (this.smokes[i].opacity < 0) {
            this.smokes.splice(i,1);
            if (i != this.smokes.length-1) {
                i--;
            }
        }
    }
};


var Ground = function (xCenter) {
    this.xCenter = xCenter;
};

Ground.prototype.display = function () {
    processing.noStroke();
    processing.fill(131,247,73);
    processing.rectMode(processing.CORNER);
    processing.rect(this.xCenter-CWIDTH/2,CHEIGHT-GROUND_LEVEL,
                this.xCenter+CWIDTH/2,CHEIGHT);
};

Ground.prototype.displayShadow = function (airplane) {
    processing.noStroke();
    var opacity = (airplane.position.y)/CHEIGHT * 100;
    var w = airplane.position.y/CHEIGHT * 10 + 20;
    processing.fill(0,0,0,opacity);
    processing.ellipse(airplane.position.x,
                CHEIGHT - GROUND_LEVEL + GROUND_SHADOW,w,w/4);
};


var InitialScene = function() {
    GameScene.call(this);
};

InitialScene.prototype = Object.create(GameScene.prototype);

InitialScene.prototype.setup = function () {
    this.title = new Button(400,200,400,100,
                processing.color(53,228,53),"Flight Aerobatics",50,180);
    this.title.setRadius(10);
    this.newGame = new Button(400,300,200,50,
                processing.color(53,228,53),"New game",30,100);
    this.newGame.setRadius(5);
    this.newGame.hoverHighlight = 80;
    this.aircraft = new Airplane(0,450,3);
    this.smokes = [];
};

InitialScene.prototype.run = function () {
    processing.background(72,208,235);
    this.displayClouds();
    this.title.display();
    if (this.newGame.checkMouse()) {
        this.newGame.hover = true;
    }
    this.newGame.display();
    processing.textSize(20);
    processing.textAlign(processing.CENTER);
    processing.text("Jiri Roznovjak",400,550);
    this.updateSmokes();
    this.aircraft.run();
};

InitialScene.prototype.checkNewGame = function () {
    return this.newGame.checkMouse();
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


var Instructions = function () {
    this.displayed = false;
};

Instructions.prototype.display = function () {
    this.displayed = true;
    processing.noStroke();
    processing.fill(150,150,150,100);
    processing.rectMode(processing.CORNER);
    processing.rect(0,0,CWIDTH,CHEIGHT);
    processing.textAlign(processing.CENTER);
    processing.fill(0,0,0);
    processing.textSize(40);
    processing.text("Fly through the rings!",400,200);
    processing.textSize(20);
    processing.text("Press up or left arrow to fly up.",400,280);
    processing.text("Down or right arrow to fly down.",400,320);
    processing.text('P to pause.',400,360);
    processing.textSize(25);
    processing.text("Fly up to start.",400,430);
};

//invoked after pressing P
var Pause = function () {
    this.resume = new Button(400,300,150,50,
                processing.color(56,69,183),'Resume',20,60);
    this.resume.setRadius(5);
    this.returnToMM = new Button(400,360,150,50,
                processing.color(56,69,183),'Main Menu',20,60);
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

//what should the program do when I return to main menu
var returnToMainMenu = function () {
    initialScene.setup();
    SCENE = 0;
    LEVEL = 1;
};

//visible determines whether the ring is visible at first, it's a boolean
var Ring = function (x,y,radius,visible) { 
    this.position = new processing.PVector(x,y);
    //radius in the y direction before dynamic oscillation
    this.radius = radius;
    //actual radius in the y direction after both oscillations
    this.currentRadius = radius;
    if (visible) {
        this.opacity = 255;
    } else {
        this.opacity = 0;
    }
    this.angle = 0;
    this.fading = false; 
    this.appearing = false;
    this.rateFade = 8;
    this.radiusOscillating = true;
    this.radiusSine = 0;
    this.verticalOscillating = true;
    this.verticalSine = 0;
    //stores the vertical position for the oscillation
    this.positionYStatic = this.position.y;
    this.nextRingX = 0; //x-position of the next ring
    this.yOscillationRange = 100;
};

Ring.prototype.display = function () {
    if (this.fading) {
        this.opacity -= this.rateFade;
    }
    if (this.appearing) {
        this.opacity += this.rateFade;
    }
    this.currentRadius = this.radius;
    if (this.radiusOscillating) {
        var ratioRadius = 0.3 * Math.sin(this.radiusSine) + 1;
        this.radiusSine += determineRadiusOscillation();
        this.currentRadius = this.radius*ratioRadius;
    }
    if (this.verticalOscillating) {
        var range = this.yOscillationRange;
        //checks if the ring won't fly off the screen while oscillating
        if (this.positionYStatic - range - this.currentRadius < 0) {
            //if true, lowers the range.
            range = this.positionYStatic - this.currentRadius;
        } else if (CHEIGHT-GROUND_LEVEL-this.positionYStatic - this.currentRadius < range) {
            range = CHEIGHT-GROUND_LEVEL - this.positionYStatic - this.currentRadius;
        }
        //oscillating in the y direction
        this.position.y = range * Math.sin(this.verticalSine) + this.positionYStatic;
        this.verticalSine += determineVerticalOscillation();
    }
    processing.noFill();
    processing.strokeWeight(5);
    processing.stroke(255,0,0,this.opacity);
    processing.pushMatrix();
    processing.translate(this.position.x,this.position.y);
    processing.rotate(this.angle);
    processing.ellipse(0,0,this.currentRadius,this.currentRadius*2);
    processing.popMatrix();
};

//checks if the ring is supposed to be shifted and shifts it
Ring.prototype.checkOpacityToShift = function () {
    if (this.opacity < 0) {
        this.newPosition();
        this.opacity = 0;
        //stores the y-position (we need it because the position will be changing)
        this.positionYStatic = this.position.y;
        this.fading = false;
        this.newRingData();
    }
    if (this.opacity > 255) {
        this.opacity = 255;
        this.appearing = false;
    }
};

//returns true if airplane is in the ring
Ring.prototype.checkThrough = function (plane) {
    return (plane.position.x < this.position.x+3 &&
                plane.position.x > this.position.x-3 &&
                plane.position.y > this.position.y-this.currentRadius &&
                plane.position.y < this.position.y+this.currentRadius);
};

//method that generates and stores new ring position.
Ring.prototype.newPosition = function () {
    if (Math.random() < 0.75) {
        var xshift = Math.random()*250+100;
    } else {
        var xshift = Math.random()*200*(-1)-50;
    }
    this.position.x = this.nextRingX + xshift;
    this.position.y = Math.random()*(CHEIGHT - 100 - GROUND_LEVEL) + 100;
};

//generates new ring data (except new position, for which you need to know the position of the next ring
Ring.prototype.newRingData = function () { 
    //determines if radius will be oscillating
    if (Math.random() < 0.4 + LEVEL * 0.1) {
        this.radiusOscillating = true;
    } else {
        this.radiusOscillating = false;
    }
    //determines vertical oscillation
    if (Math.random() < 0.5 + LEVEL * 0.1) {
        this.verticalOscillating = true;
    } else {
        this.verticalOscillating = false;
    }
    this.verticalSine = 0;
    this.radiusSine = 0;
};

Ring.prototype.storeNextRingPosition = function (x) {
    this.nextRingX = x;
};

Ring.prototype.update = function () {
    this.display();
    this.checkOpacityToShift();
};

//determines what score is needed in each level
var scoreNeeded = function () {
    return Math.floor(4+1.5*LEVEL);    
};


var Smoke = function (x,y) {
    this.position = new processing.PVector(x,y);
    this.opacity = Math.random()*60+50;
    var radius = Math.random()*2+5;
    this.radius = radius;
};

Smoke.prototype.update = function () {
    this.opacity -= 0.5;
};

Smoke.prototype.display = function () {
    processing.noStroke();
    var col = processing.color(140,140,140,this.opacity);
    processing.fill(col);
    processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
};


var Time = function () {
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
timeOut = new EndLevel('Time Out!',true);
crashScreen = new EndLevel('You Crashed!',false);
pause = new Pause();
instructionScreen = new Instructions();

initialScene.setup();

processing.draw = function () {
    if (SCENE === 0) { //initial scene
        initialScene.run();
    }
    else if (SCENE === 1) { //main game screen
        mainScene.run();
    }
    else if (SCENE === 2) { //time out
        if (!timeOut.displayed) {
            timeOut.display(mainScene.score);
        }
    }
    else if (SCENE === 3) { //crash screen
        if (!crashScreen.displayed) {
            crashScreen.display(mainScene.score);
        }
    }
    else if (SCENE < 0) {
        //pause, does nothing, pause function invoked in the processing.keypressed method
    } else if (SCENE === 0.5) {
        if (!instructionScreen.displayed) {
            instructionScreen.display();
        }
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
    if (SCENE === 0.5 ) { // instructions
        if (KEY === 37 || KEY === 38) {
            SCENE = 1;
        }
    }
    //try again on enter in crash screen or timeout
    if (KEY === 10) {
        if (SCENE === 2) {
            timeOut.nextLevelTryAgain();
        }
        if (SCENE === 3) {
            crashScreen.nextLevelTryAgain();
        }
    }
};

//Key is reset to 0 when released
processing.keyReleased = function () {
    KEY = 0;
};

processing.mouseClicked = function () {
    clickX = processing.mouseX;
    clickY = processing.mouseY;
    if (SCENE===0) { //initial scene
        initialScene.mouseHandler();
    } else if (SCENE === 1) { //main game
    } else if (SCENE === 2) { //time out
        timeOut.mouseHandler();
    } else if (SCENE === 3) { //crash screen
        crashScreen.mouseHandler();
    } else if (SCENE<0) { //pause
        pause.mouseHandler();
    }
};
}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
