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

canvasElement.addEventListener("mousedown", (event) => {
  isMouseDrawing = true;
  canvasContext?.beginPath();
  canvasContext?.moveTo(event.offsetX, event.offsetY);
});

canvasElement.addEventListener("mousemove", (event) => {
  if (isMouseDrawing) {
    canvasContext?.lineTo(event.offsetX, event.offsetY);
    canvasContext?.stroke();
  }
});

canvasElement.addEventListener("mouseup", () => {
  isMouseDrawing = false;
  canvasContext?.closePath();
});

canvasElement.addEventListener("mouseleave", () => {
  isMouseDrawing = false;
  canvasContext?.closePath();
});

clearCanvasButton.addEventListener("click", () => {
  canvasContext?.clearRect(0, 0, canvasElement.width, canvasElement.height);
});
