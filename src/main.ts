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

let currentMarkerThickness = 2;  
let isDrawing = false;  // Renamed for clarity
let completedPaths: MarkerLine[] = [];  
let activePath: MarkerLine | null = null;  
let redoPathsStack: MarkerLine[] = [];  
let toolPreview: ToolPreview | null = null; // Tool preview object

class MarkerLine {
  private pathPoints: { x: number; y: number }[] = []; // Renamed for clarity
  private thickness: number; 

  constructor(initialX: number, initialY: number, thickness: number) {
    this.pathPoints.push({ x: initialX, y: initialY });
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.pathPoints.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.pathPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
      this.pathPoints.forEach(point => {
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
  private previewX: number = 0; // Renamed for clarity
  private previewY: number = 0; // Renamed for clarity
  private thickness: number; 

  constructor(thickness: number) {
    this.thickness = thickness;
  }

  setPosition(x: number, y: number) {
    this.previewX = x;
    this.previewY = y; // Update the y position as well
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.previewX, this.previewY, this.thickness, 0, Math.PI * 2); 
    ctx.fillStyle = "rgba(255, 165, 0, 0.5)"; 
    ctx.fill();
    ctx.closePath();
  }
}

// Handle tool selection for thin marker
thinMarkerButton.addEventListener("click", () => {
  currentMarkerThickness = 2;  
  highlightSelectedTool(thinMarkerButton);
  toolPreview = new ToolPreview(currentMarkerThickness); // Update preview tool
});

// Handle tool selection for thick marker
thickMarkerButton.addEventListener("click", () => {
  currentMarkerThickness = 6;  
  highlightSelectedTool(thickMarkerButton);  
  toolPreview = new ToolPreview(currentMarkerThickness); // Update preview tool
});

// Function to highlight the selected tool
function highlightSelectedTool(button: HTMLButtonElement) {
  thinMarkerButton.classList.remove("selectedTool");
  thickMarkerButton.classList.remove("selectedTool");
  button.classList.add("selectedTool");
}

// Mouse event listeners for drawing
canvasElement.addEventListener("mousedown", (event) => {
  isDrawing = true;
  activePath = new MarkerLine(event.offsetX, event.offsetY, currentMarkerThickness);
  completedPaths.push(activePath);
  redoPathsStack = [];
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

canvasElement.addEventListener("mousemove", (event) => {
  if (!isDrawing && toolPreview) {
    toolPreview.setPosition(event.offsetX, event.offsetY); // Update preview position
    canvasElement.dispatchEvent(new Event("tool-moved")); // Fire tool-moved event
  }
  if (isDrawing && activePath) {
    activePath.drag(event.offsetX, event.offsetY);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

canvasElement.addEventListener("mouseup", () => {
  isDrawing = false;
  activePath = null;
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

canvasElement.addEventListener("mouseleave", () => {
  isDrawing = false;
  activePath = null;
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

clearCanvasButton.addEventListener("click", () => {
  completedPaths = [];
  redoPathsStack = [];
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

undoButton.addEventListener("click", () => {
  if (completedPaths.length > 0) {
    const lastPath = completedPaths.pop();
    redoPathsStack.push(lastPath!);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoPathsStack.length > 0) {
    const redoPath = redoPathsStack.pop();
    completedPaths.push(redoPath!);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

// Handle drawing-changed event
canvasElement.addEventListener("drawing-changed", () => {
  canvasContext?.clearRect(0, 0, canvasElement.width, canvasElement.height);

  completedPaths.forEach(path => {
    path.display(canvasContext!);
  });

  if (!isDrawing && toolPreview) {
    toolPreview.draw(canvasContext!); // Draw the tool preview when not drawing
  }
});

// Handle tool-moved event to update preview position
canvasElement.addEventListener("tool-moved", () => {
  if (!isDrawing && toolPreview) {
    // The preview position is already updated in the mousemove event
    canvasElement.dispatchEvent(new Event("drawing-changed")); // Redraw the preview
  }
});
