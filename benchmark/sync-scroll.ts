import "../vue/demo/main.ts";
import { defineSuite } from "esbench";

export default defineSuite(async scene => {
	await new Promise(resolve => setTimeout(resolve, 2000));

	scene.bench("E2P", () => window.$debug.scrollPreviewByEditor(5000));
	scene.bench("P2E", () => window.$debug.scrollEditorByPreview(5000));
});
