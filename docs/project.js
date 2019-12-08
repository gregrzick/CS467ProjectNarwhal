//Using canvas
var canvas;
//Using canvas libs
var ctx;
//Keeps track of current image
var savedImage;
//Using brush
var dragging = false;
//Default brush color (#000000 = black)
var currentColor = '#000000';
//Default line width
var lineWidth = 2;
//Default polygon shapes
var polygonSides = 3;
//Current tool. Defaut is brush
var currentTool = 'brush';
//Drawing boundries
var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;
//Toggles drawing
var drawing = false;
//Brush x and y points into arrays
var xPositions = [];
var yPositions = [];
//If the mouse is clicked down
var downPos = [];
//Storing image states for undo/redo
var redoList = [];
var undoList = [];
//Selection tool temp image
var tempImage;

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
document.addEventListener('DOMContentLoaded', startUp);

function startUp(){
    canvas = document.getElementById('my-canvas');
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = lineWidth;
    var myWidth=window.innerWidth;
    var myHeight=window.innerHeight;

    ctx.canvas.width  = myWidth-56;
    ctx.canvas.height = myHeight-67;
    //Sets backround to white
    ctx.lineJoin = ctx.lineCap = "round";
    // ctx.fillStyle = "white";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.getElementById("width").value=canvasWidth;
    document.getElementById("height").value=canvasHeight;
    tempImage = document.getElementById("temp-img");
    //Mouse functions
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("wheel", mouseScroll);

    //Implementing ctrl+z for undo and ctrl+y for redo
    document.onkeyup = function(e){
        if(e.ctrlKey && (e.which==90 || e.which==122)){
            undo();
        } else if(e.ctrlKey && (e.which==89 || e.which==121)){
            redo();
        }
    }
}
//WOP no button implemented yet
function drawGrid() {
    for (x = 0; x <= canvasWidth; x += 20) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        for (y = 0; y <= canvasHeight; y += 20) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
        }
    }
    ctx.stroke();
};
function setTransparant(alpha){
  //identical to clearCanvas(), but alters background opacity
  canvas.width = canvas.width;
  xPositions.length = 0;
  yPositions.length = 0;
  downPos.length = 0;
  //Fix line/style width not staying the same
  ctx.lineJoin = ctx.lineCap = "round";
  ctx.lineWidth = lineWidth;
  if (alpha > 0)
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  else
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function changeTool(tool){
    //Removes highlight on current tool and shape dropdown icon
    document.getElementById(currentTool).className="";
    document.getElementById("shape-dropdown").className="";
    //Highlight current tool
    document.getElementById(tool).className="selected";
    //Highlight shape dropdown icon when circle or polygon is selected
    if(tool==="circle" || tool==="polygon"){
        document.getElementById("shape-dropdown").className="selected";
    }
    //Change current tool
    currentTool=tool;
}
//Draw with current tool
function draw(loc){
    switch(currentTool){
        case "brush":
            //Draw line
            drawBrush();
            break;
        case "spray-can":
            //Draw radial gradient
            break;
        case "eraser":
            //Draw line, but white
            drawBrush();
            break;
        case "line":
            //Draw straight Line
            ctx.beginPath();
            ctx.moveTo(mousedown.x, mousedown.y);
            ctx.lineTo(loc.x, loc.y);
            ctx.stroke();
            break;
        case "circle":
            //Draw circle
            var radius=shapeBoundingBox.width;
            ctx.beginPath();
            ctx.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case "polygon":
            //Draw polygons
            getPolygon();
            ctx.stroke();
            break;
        case "selection":
            selectArea();
            break;
        default:
            break;
    }
}
function mouseDown(e){
    xPositions=new Array();
    yPositions=new Array();
    downPos=new Array();

    //Saves previous state before drawing
    saveState(undoList, false);
    canvas.style.cursor = "crosshair";
    loc = getMousePosition(e.clientX, e.clientY);
    saveCanvasImage();
    //Store start positions
    mousedown.x=loc.x;
    mousedown.y=loc.y;
    //Store that the mouse is being held down
    dragging=true;
    //Store line points
    if(currentTool==='brush' || currentTool==='eraser' || currentTool==='spray-can'){
        drawing = true;
        storePos(loc.x, loc.y);
        if(currentTool==='spray-can'){
            ctx.moveTo(e.clientX, e.clientY);
        }
    }
};
//Get canvas position
function getMousePosition(x,y){
    var canvasSizeData=canvas.getBoundingClientRect();
    x=(x-canvasSizeData.left)*(canvas.width/canvasSizeData.width);
    y=(y-canvasSizeData.top)*(canvas.height/canvasSizeData.height);
    return {x,y};
}
//Store image
function saveCanvasImage(){
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
    if (drawing && currentTool==='spray-can'){
        var radgrad = ctx.createRadialGradient(
        e.clientX,e.clientY,10,e.clientX,e.clientY,20);
        myColor = document.getElementById("my-color").value;
        radgrad.addColorStop(0, myColor);
        radgrad.addColorStop(0.5, myColor);
        radgrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radgrad;
        ctx.fillRect(e.clientX-20, e.clientY-20, 40, 40);
        
    }
    else{
        canvas.style.cursor = "crosshair";
        loc = getMousePosition(e.clientX, e.clientY);
        //If using the brush or eraser and holding down the mouse, store points
        if((currentTool==='brush' || currentTool==='eraser') && drawing && dragging){
            if(currentTool==='brush'){
                ctx.strokeStyle = document.getElementById("my-color").value;
            }
            if(currentTool==='eraser'){
                ctx.strokeStyle = "white";
            }
            //Draw only inside canvas
            if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight){
                storePos(loc.x, loc.y, true);
            }
            redrawCanvas();
            drawBrush();
        }else{
            ctx.strokeStyle = document.getElementById("my-color").value;
            if(dragging){
                redrawCanvas();
                updateRubberbandOnMove(loc);
            }
        }
    }

};
//Connect brush points in the array
function drawBrush(){
    ctx.lineJoin = ctx.lineCap = "round";
    for(var i=1;i<xPositions.length;i++){
        ctx.beginPath();
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

//Reset mouse on mouseup
function mouseUp(e){
    canvas.style.cursor = "default";
    loc = getMousePosition(e.clientX, e.clientY);
    if (currentTool !='spray-can')
        redrawCanvas();
    updateRubberbandOnMove(loc);
    dragging = false;
    drawing = false;
}
function updateRubberbandSizeData(loc){
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
function getAngle(mouselocX, mouselocY){
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

//Convert degree to redians
function degreesToRadians(degrees){
    degrees=degrees*(Math.PI/180);
    return degrees;
}
function getPolygonPoints(){
    // Get angle in radians based on x & y of mouse location
    var angle =  degreesToRadians(getAngle(loc.x, loc.y));

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
    // You find the Y = mouseLoc.y - radiusY * Cos(angle)
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
//Draw selected polygon
function getPolygon(){
    var polygonPoints = getPolygonPoints();
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for(var i = 1; i < polygonSides; i++){
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    ctx.closePath();
}
function updateRubberbandOnMove(loc){
    // Stores changing height, width, x & y position of most
    // top left point being either the click or mouse location
    updateRubberbandSizeData(loc);
    // Redraw the shape
    draw(loc);
}
//Clears page and resets brush points
function clearCanvas(){
    canvas.width = canvas.width;
    xPositions.length = 0;
    yPositions.length = 0;
    downPos.length = 0;
    //Fix line/style width not staying the same
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
//Changes and displays line width
function changeLineWidth(slideAmount) {
    ctx.lineWidth = slideAmount;
    lineWidth = slideAmount;
    var sliderDiv = document.getElementById("slider-amount");
    sliderDiv.innerHTML = slideAmount;
}
//Changes # of polygon sides
function changeSides(sideAmount){
    switch(sideAmount){
        case '3':
            document.getElementById("current-polygon").src="icons/triangle-icon.png";
            break;
        case '4':
            document.getElementById("current-polygon").src="icons/rectangle-icon.png";
            break;
        case '5':
            document.getElementById("current-polygon").src="icons/pentagon-icon.png";
            break;
        case '6':
            document.getElementById("current-polygon").src="icons/hexagon-icon.png";
            break;
        default:
            break;
    }
    polygonSides=sideAmount;
}
// save the canvas as an image file type
function saveImage(format){
    switch(format){
        case 1:
            var download = document.getElementById("canvas-PNG");
            var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            break;
        case 2:
            var download = document.getElementById("canvas-JPG");
            var image = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
            break;
        case 3:
            var download = document.getElementById("canvas-BMP");
            var image = canvas.toDataURL("image/bmp").replace("image/bmp", "image/octet-stream");
            break;
        default:
            break;
    }
    download.setAttribute("href", image);
}
//Undo/redo functionality
function saveState(list, keepRedo){
    if(!keepRedo){
        redoList = [];
    }
    list.push(canvas.toDataURL());
}
function undo(){
    restoreState(undoList);
}
function redo(){
    restoreState(redoList);
}
function restoreState(list){
    if(list.length){
        if(list===undoList){
            saveState(redoList, true);
        }else{
            saveState(undoList, true);
        }
        var stateToRestore = list.pop();
        var img = document.createElement('img');
        img.setAttribute('src', stateToRestore);
        img.onload = function(){
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(img, 0, 0);
        }
    }
}
//End undo/redo functionality

//Open file via explorer
function openImage(){
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = e =>{
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function(e){
            var img = document.createElement('img');
            img.src = e.target.result;
            img.onload = function(){
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                //Fits image to canvas iff it is larger than the canvas itself
                if(this.width <= canvasWidth && this.height <= canvasHeight){
                    ctx.drawImage(img, 0, 0);
                }else{
                    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                }
            }
        }
        reader.readAsDataURL(file);
    }
    input.click();
    //Reset undo/redo lists (technically unnecessary)
    redoList = [];
    undoList = [];
}

function changeColorBg(color) {
    // console.log(color)
    var wi=document.querySelector('#my-canvas').offsetWidth;
    var he=document.querySelector('#my-canvas').offsetHeight;
    // var can=document.createElement('canvas');
    // can.width=wi;
    // can.height=he;
    // var ctx2=can.getContext('2d');
    // ctx2.fillStyle=color;
    // ctx2.fillRect(0,0,wi,he);
    // var ctx3=canvas.getContext('2d');
    // console.log(can)
    // ctx3.globalCompositeOperation='destination-over';
    // ctx3.drawImage(can,0,0,wi,he);
    // ctx3.globalCompositeOperation='source-over';
    var c=document.querySelector('#my-canvas-bg');
    c.width=wi;
    c.height=he;
    var ct=c.getContext('2d');
    ct.fillStyle=color;
    ct.fillRect(0,0,999999,999999);
    // ct.drawImage(can,0,0,999999,999999);
}
window.onload=function () {
    document.querySelector('#my-color-bg').addEventListener('change',function () {
        changeColorBg(document.querySelector('#my-color-bg').value)
    })
}
//End open file via explorer
//Color change buttons in dropdown
function changeColor(color){
    document.getElementById("my-color").value = color;
    currentColor = color;
    ctx.strokeStyle = color;

    //Set custom color and sliders to correct positions for preset colors  #000000
    document.getElementById("color-slider-r").value = hexToDecimal(color.substr(1,2));
    document.getElementById("color-slider-g").value = hexToDecimal(color.substr(3,2));
    document.getElementById("color-slider-b").value = hexToDecimal(color.substr(5,2));
    (document.getElementById("rgb-amount")).innerHTML = 'RGB(' + document.getElementById("color-slider-r").value + ','
        + document.getElementById("color-slider-g").value
        + ',' + document.getElementById("color-slider-b").value + ')';
}

//End color change
//RGB color
function changeRGB(r, g, b){
    document.getElementById(currentColor).setAttribute("style", "background:#" + componentToHex(document.getElementById("color-slider-r").value) + componentToHex(document.getElementById("color-slider-g").value) +
    componentToHex(document.getElementById("color-slider-b").value));

    document.getElementById(currentColor).value =
    "#" + componentToHex(document.getElementById("color-slider-r").value) + componentToHex(document.getElementById("color-slider-g").value) +
    componentToHex(document.getElementById("color-slider-b").value);

    var newColor = "";
    if(g===undefined && b===undefined){
        newColor = "#" + componentToHex(r) + currentColor.substr(3,4);
    }else if(r===undefined && b===undefined){
        newColor = "#" + currentColor.substr(1,2) + componentToHex(g) + currentColor.substr(5,2);
    }else if(r===undefined && g===undefined){
        newColor = "#" + currentColor.substr(1,4) + componentToHex(b);
    }
    document.getElementById(currentColor).setAttribute("id", newColor);
    changeColor(newColor);
    if(g===undefined && b===undefined){
        var bAmount = document.getElementById("rgb-amount");
        bAmount.innerHTML = 'RGB(' + document.getElementById("color-slider-r").value + ',' + document.getElementById("color-slider-g").value
            + ',' + document.getElementById("color-slider-b").value + ')';
    }else if(r===undefined && b===undefined){
        var gAmount = document.getElementById("rgb-amount");
        gAmount.innerHTML = 'RGB(' + document.getElementById("color-slider-r").value + ',' + document.getElementById("color-slider-g").value
            + ',' + document.getElementById("color-slider-b").value + ')';;
    }else if(r===undefined && g===undefined){
        var bAmount = document.getElementById("rgb-amount");
        bAmount.innerHTML = 'RGB(' + document.getElementById("color-slider-r").value + ',' + document.getElementById("color-slider-g").value
            + ',' + document.getElementById("color-slider-b").value + ')';;
    }

}
//Convert RGB to Hex
function componentToHex(rgb) {
    var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
}
//Convert Hex to Decimal
function hexToDecimal(hex){
    return parseInt(hex, 16);
}
//End RGB color
//Attempting basic selection tool
function selectionBox(){
    //Formating for selection box
    //ctx.setLineDash([10, 10]);
    //ctx.strokeStyle = '#000000';
    //ctx.lineWidth = 1;
    //Draw selection box
    //ctx.strokeRect(shapeBoundingBox.left, shapeBoundingBox.top,
    //    shapeBoundingBox.width, shapeBoundingBox.height);
    //Reset format
    //ctx.setLineDash([]);
    //ctx.strokeStyle = currentColor;
    //ctx.lineWidth = lineWidth;
    //selectArea();
}
function selectArea(){
    if((shapeBoundingBox.wdith || shapeBoundingBox.height) == 0){
        return false;
    }
    var selection = ctx.getImageData(mousedown.x, mousedown.y, 
        shapeBoundingBox.width, shapeBoundingBox.height);
    //Create temp canvas to use toDataURL() from a portion of a canvas
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = shapeBoundingBox.width + 2;
    tempCanvas.height = shapeBoundingBox.height + 2;
    var tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(selection, 0, 0);
    //Create image element and move to correct location
    var image = document.getElementById("temp-img");
    image.setAttribute("src", tempCanvas.toDataURL());
    image.style.transform = "translate3d(" + (mousedown.x + 44) + "px, " + (mousedown.y - canvas.height - 18) + "px, 0)";
    image.style.border = "1px dashed #000000";
    //Clear old position
    ctx.clearRect(mousedown.x, mousedown.y, 
        shapeBoundingBox.width, shapeBoundingBox.height);
    //Writes selection to top left
    //ctx.putImageData(selection, 0, 0);
}
//Selection helper
/*tempImage.onmousedown = function(event) {
    let shiftX = event.clientX - tempImage.getBoundingClientRect().left;
    let shiftY = event.clientY - tempImage.getBoundingClientRect().top;
    tempImage.style.position = 'absolute';
    tempImage.style.zIndex = 1000;
    document.body.append(tempImage);
    moveAt(event.pageX, event.pageY);
    function moveAt(pageX, pageY) {
        tempImage.style.left = pageX - shiftX + 'px';
        tempImage.style.top = pageY - shiftY + 'px';
    }
    function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
    }
    document.addEventListener('mousemove', onMouseMove);
    tempImage.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        tempImage.onmouseup = null;
    };
};
tempImage.ondragstart = function() {
    return false;
};*/
//End basic selection tool
function mouseScroll(e){
            // cross-browser wheel delta
            var delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;
        if(delta<1){
            canvas.style.width = Math.max(100, canvasWidth-50)+ "px";
            canvas.style.height = Math.max(100, canvasHeight-50) + "px";
            canvasWidth =canvasWidth-50;
            canvasHeight =canvasHeight-50;
        }else{
            canvas.style.width = Math.max(100, canvasWidth+50)+ "px";
            canvas.style.height = Math.max(100, canvasHeight+50) + "px";
            canvasWidth =canvasWidth+50;
            canvasHeight =canvasHeight+50;
        }
}
function changeWidth(width){
    canvas.style.width = Math.min(window.innerWidth-70,Math.max(100, width))+ "px";
    document.getElementById("width").value=Math.min(window.innerWidth,Math.max(100, width));
}
function changeHeight(height){
    canvas.style.height = Math.min(window.innerHeight-70,Math.max(100, height)) + "px";
    document.getElementById("height").value=Math.min(window.innerHeight,Math.max(100, height));
}
