import "./style.css";

const APP_TITLE = "Hello, I am Krithik";
const appContainer = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_TITLE;

appContainer.innerHTML = `
  <h1>${APP_TITLE}</h1>
  <canvas id="drawingCanvas" width="256" height="256"></canvas>
  <button id="clearCanvasButton">Clear</button>
`;

const canvasElement = document.querySelector<HTMLCanvasElement>("#drawingCanvas")!;
const clearCanvasButton = document.querySelector<HTMLButtonElement>("#clearCanvasButton")!;
const canvasContext = canvasElement.getContext("2d");

let isMouseDrawing = false;
let drawnPaths: { x: number; y: number }[][] = [];
let currentPath: { x: number; y: number }[] = [];

canvasElement.addEventListener("mousedown", (event) => {
  isMouseDrawing = true;
  currentPath = [{ x: event.offsetX, y: event.offsetY }];
  drawnPaths.push(currentPath);
});

canvasElement.addEventListener("mousemove", (event) => {
  if (isMouseDrawing) {
    currentPath.push({ x: event.offsetX, y: event.offsetY });
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

canvasElement.addEventListener("mouseup", () => {
  isMouseDrawing = false;
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

canvasElement.addEventListener("mouseleave", () => {
  isMouseDrawing = false;
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

clearCanvasButton.addEventListener("click", () => {
  drawnPaths = [];
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

canvasElement.addEventListener("drawing-changed", () => {
  canvasContext?.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  drawnPaths.forEach(path => {
    if (path.length > 1) {
      canvasContext?.beginPath();
      canvasContext?.moveTo(path[0].x, path[0].y);
      path.forEach(point => {
        canvasContext?.lineTo(point.x, point.y);
      });
      canvasContext?.stroke();
      canvasContext?.closePath();
    }
  });
});
