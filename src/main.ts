import "./style.css";

const APP_TITLE = "Hello, I am Krithik";
const appContainer = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_TITLE;

appContainer.innerHTML = `
  <h1>${APP_TITLE}</h1>
  <canvas id="drawingCanvas" width="256" height="256"></canvas>
  <button id="clearCanvasButton">Clear</button>
  <button id="undoButton">Undo</button>
  <button id="redoButton">Redo</button>
  <button id="thinMarkerButton">Thin Marker</button>
  <button id="thickMarkerButton">Thick Marker</button>
`;

const canvasElement = document.querySelector<HTMLCanvasElement>("#drawingCanvas")!;
const clearCanvasButton = document.querySelector<HTMLButtonElement>("#clearCanvasButton")!;
const undoButton = document.querySelector<HTMLButtonElement>("#undoButton")!;
const redoButton = document.querySelector<HTMLButtonElement>("#redoButton")!;
const thinMarkerButton = document.querySelector<HTMLButtonElement>("#thinMarkerButton")!;
const thickMarkerButton = document.querySelector<HTMLButtonElement>("#thickMarkerButton")!;
const canvasContext = canvasElement.getContext("2d");

let currentThickness = 2;  
let isMouseDrawing = false;
let drawnPaths: MarkerLine[] = [];  
let currentPath: MarkerLine | null = null;  
let redoStack: MarkerLine[] = [];  
let toolPreview: ToolPreview | null = null; // Tool preview object

class MarkerLine {
  private points: { x: number; y: number }[] = [];
  private thickness: number; 

  constructor(initialX: number, initialY: number, thickness: number) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      this.points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.lineWidth = this.thickness;
      ctx.stroke();
      ctx.closePath();
    }
  }
}

// Class to represent the tool preview
class ToolPreview {
  private x: number = 0;
  private y: number = 0;
  private thickness: number; 

  constructor(thickness: number) {
    this.thickness = thickness;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y; // Update the y position as well
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness, 0, Math.PI * 2); 
    ctx.fillStyle = "rgba(255, 165, 0, 0.5)"; 
    ctx.fill();
    ctx.closePath();
  }
}

// Handle tool selection for thin marker
thinMarkerButton.addEventListener("click", () => {
  currentThickness = 2;  
  selectTool(thinMarkerButton);
  toolPreview = new ToolPreview(currentThickness); // Update preview tool
});

// Handle tool selection for thick marker
thickMarkerButton.addEventListener("click", () => {
  currentThickness = 6;  
  selectTool(thickMarkerButton);  
  toolPreview = new ToolPreview(currentThickness); // Update preview tool
});

// Function to highlight the selected tool
function selectTool(button: HTMLButtonElement) {
  thinMarkerButton.classList.remove("selectedTool");
  thickMarkerButton.classList.remove("selectedTool");
  button.classList.add("selectedTool");
}

// Mouse event listeners for drawing
canvasElement.addEventListener("mousedown", (event) => {
  isMouseDrawing = true;
  currentPath = new MarkerLine(event.offsetX, event.offsetY, currentThickness);
  drawnPaths.push(currentPath);
  redoStack = [];
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

canvasElement.addEventListener("mousemove", (event) => {
  if (!isMouseDrawing && toolPreview) {
    toolPreview.setPosition(event.offsetX, event.offsetY); // Update preview position
    canvasElement.dispatchEvent(new Event("tool-moved")); // Fire tool-moved event
  }
  if (isMouseDrawing && currentPath) {
    currentPath.drag(event.offsetX, event.offsetY);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

canvasElement.addEventListener("mouseup", () => {
  isMouseDrawing = false;
  currentPath = null;
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

canvasElement.addEventListener("mouseleave", () => {
  isMouseDrawing = false;
  currentPath = null;
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

clearCanvasButton.addEventListener("click", () => {
  drawnPaths = [];
  redoStack = [];
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

undoButton.addEventListener("click", () => {
  if (drawnPaths.length > 0) {
    const lastPath = drawnPaths.pop();
    redoStack.push(lastPath!);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoPath = redoStack.pop();
    drawnPaths.push(redoPath!);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

// Handle drawing-changed event
canvasElement.addEventListener("drawing-changed", () => {
  canvasContext?.clearRect(0, 0, canvasElement.width, canvasElement.height);

  drawnPaths.forEach(path => {
    path.display(canvasContext!);
  });

  if (!isMouseDrawing && toolPreview) {
    toolPreview.draw(canvasContext!); // Draw the tool preview when not drawing
  }
});

// Handle tool-moved event to update preview position
canvasElement.addEventListener("tool-moved", () => {
  if (!isMouseDrawing && toolPreview) {
    // The preview position is already updated in the mousemove event
    canvasElement.dispatchEvent(new Event("drawing-changed")); // Redraw the preview
  }
});
