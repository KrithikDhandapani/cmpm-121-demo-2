import "./style.css";

const APP_NAME = "Hello, I am Krithik";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;