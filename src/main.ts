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
`;

const canvasElement = document.querySelector<HTMLCanvasElement>("#drawingCanvas")!;
const clearCanvasButton = document.querySelector<HTMLButtonElement>("#clearCanvasButton")!;
const undoButton = document.querySelector<HTMLButtonElement>("#undoButton")!;
const redoButton = document.querySelector<HTMLButtonElement>("#redoButton")!;
const canvasContext = canvasElement.getContext("2d");

// Class to store drawing points
class MarkerLine {
  private points: { x: number; y: number }[] = [];

  // Store the initial position
  constructor(initialX: number, initialY: number) {
    this.points.push({ x: initialX, y: initialY });
  }

  // Add points as user drags
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  // Display the line on canvas
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      this.points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.closePath();
    }
  }
}

// Variables for drawing states
let isMouseDrawing = false;
let drawnPaths: MarkerLine[] = [];  // Array of drawn lines
let currentPath: MarkerLine | null = null;  // Line currently being drawn
let redoStack: MarkerLine[] = [];  // Stack for redo paths

// Start drawing on mousedown
canvasElement.addEventListener("mousedown", (event) => {
  isMouseDrawing = true;
  
  currentPath = new MarkerLine(event.offsetX, event.offsetY);  // Create new line
  drawnPaths.push(currentPath);  // Add to drawn paths
  redoStack = [];  // Clear redo stack on new draw
});

// Add points on mousemove
canvasElement.addEventListener("mousemove", (event) => {
  if (isMouseDrawing && currentPath) {
    currentPath.drag(event.offsetX, event.offsetY);  // Add new points
    canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger redraw
  }
});

// Stop drawing on mouseup
canvasElement.addEventListener("mouseup", () => {
  isMouseDrawing = false;
  currentPath = null;  // Reset current path
  canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger redraw
});

// Handle when mouse leaves canvas
canvasElement.addEventListener("mouseleave", () => {
  isMouseDrawing = false;
  currentPath = null;  // Reset current path
  canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger redraw
});

// Clear canvas and paths
clearCanvasButton.addEventListener("click", () => {
  drawnPaths = [];
  redoStack = [];  // Clear redo stack on clear
  canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger redraw
});

// Undo last drawn path
undoButton.addEventListener("click", () => {
  if (drawnPaths.length > 0) {
    const lastPath = drawnPaths.pop();  // Remove last path
    redoStack.push(lastPath!);  // Push to redo stack
    canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger redraw
  }
});

// Redo last undone path
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoPath = redoStack.pop();  // Pop from redo stack
    drawnPaths.push(redoPath!);  // Add back to paths
    canvasElement.dispatchEvent(new Event("drawing-changed"));  // Trigger redraw
  }
});

// Redraw canvas on drawing change
canvasElement.addEventListener("drawing-changed", () => {
  canvasContext?.clearRect(0, 0, canvasElement.width, canvasElement.height);  // Clear canvas

  drawnPaths.forEach(path => {
    path.display(canvasContext!);  // Draw each path
  });
});
