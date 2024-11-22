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
  <div id="stickersContainer"></div>
  <button id="customStickerButton">Create Custom Sticker</button>
  <button id="exportButton">Export</button>
  <div id="colorBar">
    <label for="colorPicker">Select Color: </label>
    <input type="color" id="colorPicker" value="#000000">
  </div>
`;

const canvasElement = document.querySelector<HTMLCanvasElement>("#drawingCanvas")!;
const clearCanvasButton = document.querySelector<HTMLButtonElement>("#clearCanvasButton")!;
const undoButton = document.querySelector<HTMLButtonElement>("#undoButton")!;
const redoButton = document.querySelector<HTMLButtonElement>("#redoButton")!;
const thinMarkerButton = document.querySelector<HTMLButtonElement>("#thinMarkerButton")!;
const thickMarkerButton = document.querySelector<HTMLButtonElement>("#thickMarkerButton")!;
const customStickerButton = document.querySelector<HTMLButtonElement>("#customStickerButton")!;
const exportButton = document.querySelector<HTMLButtonElement>("#exportButton")!;
const stickersContainer = document.querySelector<HTMLDivElement>("#stickersContainer")!;
const canvasContext = canvasElement.getContext("2d");

let currentMarkerThickness = 3;
let isDrawing = false;
let completedPaths: (MarkerLine | StickerPreview)[] = [];
let activePath: MarkerLine | null = null;
let redoPathsStack: (MarkerLine | StickerPreview)[] = [];
let toolPreview: ToolPreview | null = null;
let currentSticker: StickerPreview | null = null;
let currentColor = "#000000"; // Default black color

interface Sticker {
  icon: string;
  label: string;
}

const stickers: Sticker[] = [
  { icon: "🐱", label: "Cat" },
  { icon: "🐶", label: "Dog" },
  { icon: "🦄", label: "Unicorn" },
  { icon: "🐘", label: "Dog" },
  { icon: "🦒", label: "Dog" },
];

// Create sticker button
function addStickerButton(sticker: Sticker, index: number) {
  const stickerButton = document.createElement("button");
  stickerButton.textContent = sticker.icon;
  stickerButton.id = `stickerButton${index}`;
  stickerButton.addEventListener("click", () => selectSticker(sticker.icon));
  stickersContainer.appendChild(stickerButton);
}

// Render stickers
stickers.forEach((sticker, index) => addStickerButton(sticker, index));

// Add custom sticker
customStickerButton.addEventListener("click", () => {
  const customIcon = prompt("Enter a custom sticker emoji:", "✨");
  if (customIcon) {
    const newSticker = { icon: customIcon, label: "Custom Sticker" };
    stickers.push(newSticker);
    addStickerButton(newSticker, stickers.length - 1); 
  }
});

interface Drawable {
  draw(ctx: CanvasRenderingContext2D): void;
}

// MarkerLine class
class MarkerLine implements Drawable {
  private pathPoints: { x: number; y: number }[] = [];
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
      ctx.strokeStyle = currentColor;  // Apply selected color
      ctx.stroke();
      ctx.closePath();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.display(ctx);
  }
}

// ToolPreview class
class ToolPreview {
  private previewX: number = 0;
  private previewY: number = 0;
  private thickness: number;

  constructor(thickness: number) {
    this.thickness = thickness;
  }

  setPosition(x: number, y: number) {
    this.previewX = x;
    this.previewY = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.previewX, this.previewY, this.thickness, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 165, 0, 0.5)";
    ctx.fill();
    ctx.closePath();
  }
}

// StickerPreview class
class StickerPreview implements Drawable {
  private sticker: string;
  private positionX: number = 0;
  private positionY: number = 0;
  private size: number = 164;

  constructor(sticker: string) {
    this.sticker = sticker;
  }

  setPosition(x: number, y: number) {
    this.positionX = x;
    this.positionY = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = '32px Arial';
    ctx.fillText(this.sticker, this.positionX, this.positionY);
  }
}

// Random color generator
function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Thin marker button
thinMarkerButton.addEventListener("click", () => {
  currentMarkerThickness = 3;
  currentColor = getRandomColor();
  highlightSelectedTool(thinMarkerButton);
  toolPreview = new ToolPreview(currentMarkerThickness);
});

// Thick marker button
thickMarkerButton.addEventListener("click", () => {
  currentMarkerThickness = 7;
  currentColor = getRandomColor();
  highlightSelectedTool(thickMarkerButton);
  toolPreview = new ToolPreview(currentMarkerThickness);
});

// Select sticker
function selectSticker(sticker: string) {
  currentColor = getRandomColor();
  currentSticker = new StickerPreview(sticker);
  canvasElement.dispatchEvent(new Event("tool-moved"));
}

// Highlight selected tool
function highlightSelectedTool(button: HTMLButtonElement) {
  thinMarkerButton.classList.remove("selectedTool");
  thickMarkerButton.classList.remove("selectedTool");
  button.classList.add("selectedTool");
}

// Handle color picker
const colorPicker = document.querySelector<HTMLInputElement>("#colorPicker")!;
colorPicker.addEventListener("input", (event) => {
  currentColor = (event.target as HTMLInputElement).value;
  highlightSelectedColor(currentColor); 
});

// Highlight selected color
function highlightSelectedColor(color: string) {
  const colorBar = document.querySelector<HTMLDivElement>("#colorBar")!;
  colorBar.style.backgroundColor = color;
}

// Mouse events for drawing
canvasElement.addEventListener("mousedown", (event) => {
  if (currentSticker) {
    currentSticker.setPosition(event.offsetX, event.offsetY);
    completedPaths.push(currentSticker);
    currentSticker = null;
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  } else {
    isDrawing = true;
    activePath = new MarkerLine(event.offsetX, event.offsetY, currentMarkerThickness);
    completedPaths.push(activePath);
    redoPathsStack = [];
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

canvasElement.addEventListener("mousemove", (event) => {
  if (!isDrawing && toolPreview) {
    toolPreview.setPosition(event.offsetX, event.offsetY);
    canvasElement.dispatchEvent(new Event("tool-moved"));
  }
  
  if (currentSticker) {
    currentSticker.setPosition(event.offsetX, event.offsetY);
    canvasElement.dispatchEvent(new Event("tool-moved"));
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

// Clear canvas
clearCanvasButton.addEventListener("click", () => {
  completedPaths = [];
  redoPathsStack = [];
  canvasElement.dispatchEvent(new Event("drawing-changed"));
});

// Undo button
undoButton.addEventListener("click", () => {
  if (completedPaths.length > 0) {
    const lastPath = completedPaths.pop();
    redoPathsStack.push(lastPath!);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

// Redo button
redoButton.addEventListener("click", () => {
  if (redoPathsStack.length > 0) {
    const redoPath = redoPathsStack.pop();
    completedPaths.push(redoPath!);
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});

// Drawing changed event
canvasElement.addEventListener("drawing-changed", () => {
  canvasContext?.clearRect(0, 0, canvasElement.width, canvasElement.height);

  completedPaths.forEach(path => path.draw(canvasContext!));

  if (toolPreview) {
    toolPreview.draw(canvasContext!);
  }

  if (currentSticker) {
    currentSticker.draw(canvasContext!);
  }
});

// Export drawing
exportButton.addEventListener("click", () => {
  const dataURL = canvasElement.toDataURL();
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "drawing.png";
  link.click();
});

// Tool moved event
canvasElement.addEventListener("tool-moved", () => {
  canvasContext?.clearRect(0, 0, canvasElement.width, canvasElement.height);
  completedPaths.forEach(path => path.draw(canvasContext!));
  if (toolPreview) {
    toolPreview.draw(canvasContext!);
  }
});
