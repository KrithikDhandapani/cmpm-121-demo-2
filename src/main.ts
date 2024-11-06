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

interface Sticker {
  icon: string;
  label: string;
}

const stickers: Sticker[] = [
  { icon: "🐱", label: "Cat" },
  { icon: "🐶", label: "Dog" },
  { icon: "🦄", label: "Unicorn" }
];


// Helper function to create a button for each sticker
function addStickerButton(sticker: Sticker, index: number) {
  const stickerButton = document.createElement("button");
  stickerButton.textContent = sticker.icon;
  stickerButton.id = `stickerButton${index}`;
  stickerButton.addEventListener("click", () => selectSticker(sticker.icon));
  stickersContainer.appendChild(stickerButton);
}

// Render initial stickers
stickers.forEach((sticker, index) => addStickerButton(sticker, index));

// Function to add custom sticker
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

// Update MarkerLine to implement the Drawable interface
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
      ctx.stroke();
      ctx.closePath();
    }
  }

  // Add a draw method that matches the Drawable interface
  draw(ctx: CanvasRenderingContext2D) {
    this.display(ctx);
  }
}

// Class for tool preview
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

// Update StickerPreview to implement the Drawable interface
class StickerPreview implements Drawable {
  private sticker: string;
  private positionX: number = 0;
  private positionY: number = 0;
  private size: number = 164; // Increased size for the emoji


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



// Handle tool selection for markers
thinMarkerButton.addEventListener("click", () => {
  currentMarkerThickness = 3;
  highlightSelectedTool(thinMarkerButton);
  toolPreview = new ToolPreview(currentMarkerThickness);
});

thickMarkerButton.addEventListener("click", () => {
  currentMarkerThickness = 7;
  highlightSelectedTool(thickMarkerButton);
  toolPreview = new ToolPreview(currentMarkerThickness);
});

// Function to select a sticker
function selectSticker(sticker: string) {
  currentSticker = new StickerPreview(sticker);
  canvasElement.dispatchEvent(new Event("tool-moved"));
}

// Function to highlight the selected tool
function highlightSelectedTool(button: HTMLButtonElement) {
  thinMarkerButton.classList.remove("selectedTool");
  thickMarkerButton.classList.remove("selectedTool");
  button.classList.add("selectedTool");
}

// Mouse event listeners
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

// Clear, undo, and redo buttons
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

canvasElement.addEventListener("drawing-changed", () => {
  canvasContext?.clearRect(0, 0, canvasElement.width, canvasElement.height);

  completedPaths.forEach(path => {
    if (path instanceof MarkerLine) {
      path.display(canvasContext!);
    } else if (path instanceof StickerPreview) {
      path.draw(canvasContext!); // Draw stickers with larger size
    }
  });

  if (!isDrawing && toolPreview) {
    toolPreview.draw(canvasContext!); 
  }

  if (currentSticker) {
    currentSticker.draw(canvasContext!); // Draw the sticker preview with larger size
  }
});


// Handle tool-moved event
canvasElement.addEventListener("tool-moved", () => {
  if (!isDrawing && toolPreview) {
    canvasElement.dispatchEvent(new Event("drawing-changed"));
  }
});


exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportContext = exportCanvas.getContext("2d")!;

  exportContext.scale(4, 4);

  completedPaths.forEach(path => path.draw(exportContext));

  exportCanvas.toBlob(blob => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "drawing.png";
      downloadLink.click();
      URL.revokeObjectURL(url);
    }
  }, "image/png");
});
