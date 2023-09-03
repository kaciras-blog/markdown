import { defineConfig } from "vite";
import htmlStringPlugin from "./html-string.js";

export default defineConfig({
	plugins: [
		htmlStringPlugin(),
	],
});
