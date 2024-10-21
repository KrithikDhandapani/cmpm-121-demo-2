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

// Default marker thickness
let currentThickness = 2; 

class MarkerLine {
  private points: { x: number; y: number }[] = [];
  private thickness: number;  // Line thickness

  constructor(initialX: number, initialY: number, thickness: number) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;  // Set line thickness
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
      ctx.lineWidth = this.thickness;  // Set line width based on thickness
      ctx.stroke();
      ctx.closePath();
    }
  }
}

let isMouseDrawing = false;
let drawnPaths: MarkerLine[] = [];  
let currentPath: MarkerLine | null = null;  
let redoStack: MarkerLine[] = [];

thinMarkerButton.addEventListener("click", () => {
  currentThickness = 2;  // Set to thin line
  selectTool(thinMarkerButton);  // Add selected class to button
});

thickMarkerButton.addEventListener("click", () => {
  currentThickness = 6;  // Set to thick line
  selectTool(thickMarkerButton);  // Add selected class to button
});

function selectTool(button: HTMLButtonElement) {
  thinMarkerButton.classList.remove("selectedTool");
  thickMarkerButton.classList.remove("selectedTool");
  button.classList.add("selectedTool");
}

canvasElement.addEventListener("mousedown", (event) => {
  isMouseDrawing = true;
  currentPath = new MarkerLine(event.offsetX, event.offsetY, currentThickness);  // Pass thickness
  drawnPaths.push(currentPath);
  redoStack = [];
});

canvasElement.addEventListener("mousemove", (event) => {
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

canvasElement.addEventListener("drawing-changed", () => {
  canvasContext?.clearRect(0, 0, canvasElement.width, canvasElement.height);

  drawnPaths.forEach(path => {
    path.display(canvasContext!);
  });
});
