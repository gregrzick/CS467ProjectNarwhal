//Using canvas
var canvas;
//Using canvas libs
var ctx;
//Keeps track of current image
var savedImage;
//Using brush
var dragging = false;
//Default brush color
var brushColor = 'black';
//Default line width
var line_Width=2;
//Default polygon shapes
var polygonSides =3;
//Current tool. Defaut is brush
var currentTool = 'brush';
//Drawing boundries
var canvasWidth = 800;
var canvasHeight = 800;
//Toggles drawing
var drawing = false;
//Brush x and y points into arrays
var xPositions;
var yPositions;
//If the mouse is clicked down
var downPos;

// Stores size data used to create rubber band shapes
// that will redraw as the user moves the mouse
class ShapeBoundingBox{
    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}
// Holds x & y position where clicked
class MouseDownPos{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}
// Holds x & y location of the mouse
class Location{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}
// Holds x & y polygon point values
class PolygonPoint{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}
// Stores top left x & y and size of rubber band box
var shapeBoundingBox = new ShapeBoundingBox(0,0,0,0);
// Holds x & y position where clicked
var mousedown = new MouseDownPos(0,0);
// Holds x & y location of the mouse
var loc = new Location(0,0);

// Call for our function to execute when page is loaded
document.addEventListener('DOMContentLoaded', Canvas);

function Canvas(){
    canvas = document.getElementById('my-canvas');
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = line_Width;
    //Sets backround to white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //Mouse functions
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("mouseup", mouseUp);
}
function ChangeTool(tool){
    document.getElementById("brush").className="";
    document.getElementById("line").className="";
    document.getElementById("eraser").className="";
    document.getElementById("text").className="";
    document.getElementById("circle").className="";
    document.getElementById("polygon").className="";
    //Highlight current tool
    document.getElementById(tool).className="selected";
    //Change current tool
    currentTool=tool;
}
//Draw with current tool
function draw(loc){
    if(currentTool==="brush"){
        //Draw line
        DrawBrush();
    }else if(currentTool==="eraser"){
        //Draw line, but white
        DrawBrush();
    }else if(currentTool==="line"){
        //Draw straight Line
        ctx.beginPath();
        ctx.moveTo(mousedown.x, mousedown.y);
        ctx.lineTo(loc.x, loc.y);
        ctx.stroke();
    } else if(currentTool==="circle"){
        //Draw circle
        var radius=shapeBoundingBox.width;
        ctx.beginPath();
        ctx.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }  else if(currentTool==="polygon"){
        //Draw polygons
        getPolygon();
        ctx.stroke();
    }
}
function mouseDown(e){
    xPositions=new Array();
    yPositions=new Array();
    downPos=new Array()

    canvas.style.cursor = "crosshair";
    loc = GetMousePosition(e.clientX, e.clientY);
    SaveCanvasImage();
    //Store start positions
    mousedown.x=loc.x;
    mousedown.y=loc.y;
    //Store that the mouse is being held down
    dragging=true;
    //Store line points
    if(currentTool==='brush' || currentTool==='eraser'){
        drawing = true;
        storePos(loc.x, loc.y);
    }
};
//Get canvas position
function GetMousePosition(x,y){
    var canvasSizeData=canvas.getBoundingClientRect();
    x=(x-canvasSizeData.left)*(canvas.width/canvasSizeData.width);
    y=(y-canvasSizeData.top)*(canvas.height/canvasSizeData.height);
    return {x,y};
}
//Store image
function SaveCanvasImage(){
    savedImage = ctx.getImageData(0,0,canvas.width,canvas.height);
}
//Push array positions
function storePos(x, y, mouseDown){
    xPositions.push(x);
    yPositions.push(y);
    downPos.push(mouseDown);
}
function redrawCanvas(){
    // Restore image
    ctx.putImageData(savedImage,0,0);
}
function mouseMove(e){
    canvas.style.cursor = "crosshair";
    loc = GetMousePosition(e.clientX, e.clientY);
    //If using the brush or eraser and holding down the mouse, store points
    if((currentTool==='brush' || currentTool==='eraser') && drawing && dragging){
        if(currentTool==='brush'){
            ctx.strokeStyle = document.getElementById("myColor").value;
        }
        if(currentTool==='eraser'){
            ctx.strokeStyle = 'white';
        }
        //Draw only inside canvas
        if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight){
            storePos(loc.x, loc.y, true);
        }
        redrawCanvas();
        DrawBrush();
    }else{
        ctx.strokeStyle = document.getElementById("myColor").value;
        if(dragging){
            redrawCanvas();
            UpdateRubberbandOnMove(loc);
        }
    }
};
// Cycle through all brush points and connect them with lines
function DrawBrush(){
    for(var i=1;i<xPositions.length;i++){
        ctx.beginPath();
        // Check if the mouse button was down at this point
        // and if so continue drawing
        if(downPos[i]){
            ctx.moveTo(xPositions[i-1], yPositions[i-1]);
        }else {
            ctx.moveTo(xPositions[i]-1, yPositions[i]);
        }
        ctx.lineTo(xPositions[i], yPositions[i]);
        ctx.closePath();
        ctx.stroke();
    }
}
function mouseUp(e){
    canvas.style.cursor = "default";
    loc = GetMousePosition(e.clientX, e.clientY);
    redrawCanvas();
    UpdateRubberbandOnMove(loc);
    dragging = false;
    drawing = false;
}
function UpdateRubberbandSizeData(loc){
    // Height & width are the difference between were clicked
    // and current mouse position
    shapeBoundingBox.width = Math.abs(loc.x-mousedown.x);
    shapeBoundingBox.height = Math.abs(loc.y-mousedown.y);

    // If mouse is below where mouse was clicked originally
    if(loc.x > mousedown.x){
        // Store mousedown because it is farthest left
        shapeBoundingBox.left = mousedown.x;
    } else {
        // Store mouse location because it is most left
        shapeBoundingBox.left = loc.x;
    }
    // If mouse location is below where clicked originally
    if(loc.y > mousedown.y){

        // Store mousedown because it is closer to the top
        // of the canvas
        shapeBoundingBox.top = mousedown.y;
    } else {
        // Otherwise store mouse position
        shapeBoundingBox.top = loc.y;
    }
}

// Returns the angle using x and y
// x = Adjacent Side
// y = Opposite Side
// Tan(Angle) = Opposite / Adjacent
// Angle = ArcTan(Opposite / Adjacent)
function getAngleUsingXAndY(mouselocX, mouselocY){
    var adjacent = mousedown.x - mouselocX;
    var opposite = mousedown.y - mouselocY;
    return radiansToDegrees(Math.atan2(opposite, adjacent));
}
function radiansToDegrees(rad){
    if(rad < 0){
        // Correct the bottom error by adding the negative
        // angle to 360 to get the correct result around
        // the whole circle
        return (360.0 + (rad * (180 / Math.PI))).toFixed(2);
    } else {
        return (rad * (180 / Math.PI)).toFixed(2);
    }
}

// Converts degrees to radians
function degreesToRadians(degrees){
    return degrees * (Math.PI / 180);
}
function getPolygonPoints(){
    // Get angle in radians based on x & y of mouse location
    var angle =  degreesToRadians(getAngleUsingXAndY(loc.x, loc.y));

    // X & Y for the X & Y point representing the radius is equal to
    // the X & Y of the bounding rubberband box
    var radiusX = shapeBoundingBox.width;
    var radiusY = shapeBoundingBox.height;
    // Stores all points in the polygon
    var polygonPoints = [];

    // Each point in the polygon is found by breaking the
    // parts of the polygon into triangles
    // Then I can use the known angle and adjacent side length
    // to find the X = mouseLoc.x + radiusX * Sin(angle)
    // You find the Y = mouseLoc.y + radiusY * Cos(angle)
    for(var i = 0; i < polygonSides; i++){
        polygonPoints.push(new PolygonPoint(loc.x + radiusX * Math.sin(angle),
        loc.y - radiusY * Math.cos(angle)));

        // 2 * PI equals 360 degrees
        // Divide 360 into parts based on how many polygon
        // sides you want
        angle += 2 * Math.PI / polygonSides;
    }
    return polygonPoints;
}

// Get the polygon points and draw the polygon
function getPolygon(){
    var polygonPoints = getPolygonPoints();
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for(var i = 1; i < polygonSides; i++){
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    ctx.closePath();
}


function UpdateRubberbandOnMove(loc){
    // Stores changing height, width, x & y position of most
    // top left point being either the click or mouse location
    UpdateRubberbandSizeData(loc);
    // Redraw the shape
    draw(loc);
}
// Store each point as the mouse moves and whether the mouse
// button is currently being dragged


//Clears page and resets brush points
function clearCanvas(){
    canvas.width = canvas.width;
    xPositions.length = 0;
    yPositions.length = 0;
    downPos.length = 0;
}
//changes and displays line width
function changeLineWidth(slideAmount) {
    ctx.lineWidth=slideAmount;
    var sliderDiv = document.getElementById("sliderAmount");
    sliderDiv.innerHTML = slideAmount;
}
//Changes # of polygon sides
function changeSides(sideAmount){
    if(sideAmount==='3'){
        document.getElementById("currentPolygon").src="icons/triangle-icon.png";
    }
    if(sideAmount==='4'){
        document.getElementById("currentPolygon").src="icons/rectangle-icon.png";
    }
    if(sideAmount==='5'){
        document.getElementById("currentPolygon").src="icons/pentagon-icon.png";
    }
    if(sideAmount==='6'){
        document.getElementById("currentPolygon").src="icons/hexagon-icon.png";
    }
    polygonSides=sideAmount;
}
// Download canvas image as a PNG
// Can expand later to several buttons to download as different file types
// Need some function to have user specify a custom filename
function canvasToPng(){
  var download = document.getElementById("canvasPNG");
  //get current canvas
  var canvas  = document.getElementById("my-canvas");
  //get actual image data
  var image   = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

  // send image to download through your browser. Default filename is narwhal-image.
  download.setAttribute("href", image);

  console.log(image);
}
