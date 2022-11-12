import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from "element-plus";

import "./assets/main.css";
import "element-plus/dist/index.css";

createApp(App).use(ElementPlus).mount("#app");
