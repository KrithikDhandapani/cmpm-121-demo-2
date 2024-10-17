import "./style.css";

const APP_TITLE = "Hello, I am Krithik";

const appContainer = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_TITLE;

appContainer.innerHTML = `
  <h1>${APP_TITLE}</h1>
  <canvas id="mainCanvas" width="256" height="256"></canvas>
  <button id="clearCanvasButton">Clear</button>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#mainCanvas")!;
const clearButton = document.querySelector<HTMLButtonElement>("#clearCanvasButton")!;
const ctx = canvas.getContext("2d");

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  ctx?.beginPath();
  ctx?.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    ctx?.lineTo(e.offsetX, e.offsetY);
    ctx?.stroke();
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  ctx?.closePath();
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  ctx?.closePath();
});

clearButton.addEventListener("click", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
});
