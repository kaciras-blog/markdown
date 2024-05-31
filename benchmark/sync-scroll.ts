import "../vue/demo/main.ts";
import { defineSuite } from "esbench";

async function waitForMounted() {
	for (let i = 0; i < 10; i++) {
		await new Promise(resolve => setTimeout(resolve, 200));
		if ("scrollPreviewByEditor" in window.$debug) {
			return;
		}
	}
	throw new Error("咋两秒过了还没渲染好，有问题啊。");
}

/*
 * 二分优化后的测速，scrollEditorByPreview 性能提升较大，因为它循环里要访问 DOM。
 *
 * | No. | Name |      time |  time.SD | time.diff |
 * | --: | ---: | --------: | -------: | --------: |
 * |   0 |  E2P |   6.32 us | 34.87 ns |    -3.64% |
 * |   1 |  P2E | 123.72 us |  1.08 us |   -37.07% |
 */
export default defineSuite(async scene => {
	await waitForMounted();
	scene.bench("E2P", () => window.$debug.scrollPreviewByEditor(5000));
	scene.bench("P2E", () => window.$debug.scrollEditorByPreview(5000));
});
