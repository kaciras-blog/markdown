import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueSvgSfc from "vite-plugin-svg-sfc";

export default defineConfig({
	plugins: [
		vue(),
		vueSvgSfc({ svgProps: attrs => delete attrs.class }),
	]
})
