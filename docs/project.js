//Using canvas
let canvas;
//Using canvas libs
let ctx;
//Keeps track of current image
let savedImage;
//Using brush
let dragging = false;
//Default brush color
let brushColor = 'black';
//Default line width
let line_Width=2;
//Default polygon shapes
let polygonSides =3;
//Current tool. Defaut is brush
let currentTool = 'brush';
//Drawing boundries
let canvasWidth = 800;
let canvasHeight = 800;
//Toggles drawing
let drawing = false;
//Brush x and y points into arrays
let xPositions;
let yPositions;
//If the mouse is clicked down
let downPos;

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
let shapeBoundingBox = new ShapeBoundingBox(0,0,0,0);
// Holds x & y position where clicked
let mousedown = new MouseDownPos(0,0);
// Holds x & y location of the mouse
let loc = new Location(0,0);

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
    // Store that yes the mouse is being held down
    dragging=true;
    //Store line points
    if(currentTool==='brush' || currentTool==='eraser'){
        drawing = true;
        storePos(loc.x, loc.y);
    }
};
//Get canvas position
function GetMousePosition(x,y){
    let canvasSizeData=canvas.getBoundingClientRect();
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
    // Store true that mouse is down
    downPos.push(mouseDown);
}
// Returns mouse x & y position based on canvas position in page



function RedrawCanvasImage(){
    // Restore image
    ctx.putImageData(savedImage,0,0);
}

function UpdateRubberbandSizeData(loc){
    // Height & width are the difference between were clicked
    // and current mouse position
    shapeBoundingBox.width = Math.abs(loc.x - mousedown.x);
    shapeBoundingBox.height = Math.abs(loc.y - mousedown.y);

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
    let adjacent = mousedown.x - mouselocX;
    let opposite = mousedown.y - mouselocY;
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
    let angle =  degreesToRadians(getAngleUsingXAndY(loc.x, loc.y));

    // X & Y for the X & Y point representing the radius is equal to
    // the X & Y of the bounding rubberband box
    let radiusX = shapeBoundingBox.width;
    let radiusY = shapeBoundingBox.height;
    // Stores all points in the polygon
    let polygonPoints = [];

    // Each point in the polygon is found by breaking the
    // parts of the polygon into triangles
    // Then I can use the known angle and adjacent side length
    // to find the X = mouseLoc.x + radiusX * Sin(angle)
    // You find the Y = mouseLoc.y + radiusY * Cos(angle)
    for(let i = 0; i < polygonSides; i++){
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
    let polygonPoints = getPolygonPoints();
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for(let i = 1; i < polygonSides; i++){
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    ctx.closePath();
}

// Called to draw the line
function drawRubberbandShape(loc){
    if(currentTool === "brush"){
        // Create paint brush
        DrawBrush();
    }else if(currentTool === "eraser"){
        //Creat line, but white
        DrawBrush();
    }else if(currentTool === "line"){
        // Draw Line
        ctx.beginPath();
        ctx.moveTo(mousedown.x, mousedown.y);
        ctx.lineTo(loc.x, loc.y);
        ctx.stroke();
    } else if(currentTool === "circle"){
        // Create circles
        let radius = shapeBoundingBox.width;
        ctx.beginPath();
        ctx.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }  else if(currentTool === "polygon"){
        // Create polygons
        getPolygon();
        ctx.stroke();
    }
}
function UpdateRubberbandOnMove(loc){
    // Stores changing height, width, x & y position of most
    // top left point being either the click or mouse location
    UpdateRubberbandSizeData(loc);
    // Redraw the shape
    drawRubberbandShape(loc);
}
// Store each point as the mouse moves and whether the mouse
// button is currently being dragged


// Cycle through all brush points and connect them with lines
function DrawBrush(){
    for(let i = 1; i < xPositions.length; i++){
        ctx.beginPath();
        // Check if the mouse button was down at this point
        // and if so continue drawing
        if(downPos[i]){
            ctx.moveTo(xPositions[i-1], yPositions[i-1]);
        } else {
            ctx.moveTo(xPositions[i]-1, yPositions[i]);
        }
        ctx.lineTo(xPositions[i], yPositions[i]);
        ctx.closePath();
        ctx.stroke();
    }
}


function mouseMove(e){
    canvas.style.cursor = "crosshair";
    loc = GetMousePosition(e.clientX, e.clientY);

    // If using brush tool and dragging store each point
    if((currentTool === 'brush' || currentTool === 'eraser') && dragging && drawing){
        // Throw away brush drawings that occur outside of the canvas
        if(currentTool==='brush'){
            ctx.strokeStyle = document.getElementById("myColor").value;
        }
        if(currentTool==='eraser'){
            ctx.strokeStyle = 'white';
        }
        if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight){
            storePos(loc.x, loc.y, true);
        }
        RedrawCanvasImage();
        DrawBrush();
    }
    else {
        ctx.strokeStyle = document.getElementById("myColor").value;
        if(dragging){
            RedrawCanvasImage();
            UpdateRubberbandOnMove(loc);
        }
    }
};
function mouseUp(e){
    canvas.style.cursor = "default";
    loc = GetMousePosition(e.clientX, e.clientY);
    RedrawCanvasImage();
    UpdateRubberbandOnMove(loc);
    dragging = false;
    drawing = false;
}
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
