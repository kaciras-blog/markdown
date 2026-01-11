import { defineSuite } from "esbench";
import { kfmPreset, MarkdownIt } from "../core/src/index.ts";
import article from "../vue/demo/KFM-zh.md?raw";

/**
 * 综合测试下预设的性能，AMD Ryzen 5 5625U，DDR4-1600, Firefox 146。
 *
 * | No. | preset |        time |  time.SD |
 * | --: | -----: | ----------: | -------: |
 * |   0 |  plain |   926.46 us | 11.38 us |
 * |   1 |  guest |   989.08 us |  7.35 us |
 * |   2 |   rich | 1,160.16 us |  9.71 us |
 */
export default defineSuite({
	params: {
		preset: ["plain", "guest", "rich"],
	},
	setup(scene) {
		const markdownIt = new MarkdownIt();
		switch (scene.params.preset) {
			case "plain":
				markdownIt.use(kfmPreset, { plain: true });
				break;
			case "guest":
				markdownIt.use(kfmPreset, { guest: true });
				break;
			case "rich":
				markdownIt.use(kfmPreset);
				break;
		}
		scene.bench("render", () => markdownIt.render(article));
	},
});
