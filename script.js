function sketchProc(processing) {
/*Simple 2D airplane simulator. Author Jiri Roznovjak*/
var CWIDTH = 800;
var CHEIGHT = 600;
processing.size(CWIDTH,CHEIGHT);
processing.background(150,150,50);
processing.draw = function () {
	
};
processing.fill(0,0,0);
processing.mouseDragged = function () {
	processing.ellipse(processing.mouseX,processing.mouseY,5,5);
};
}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
