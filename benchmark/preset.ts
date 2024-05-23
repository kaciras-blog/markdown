import { readFileSync } from "fs";
import { defineSuite } from "esbench";
import { kfmPreset, MarkdownIt } from "../core/lib/index.ts";

const article = readFileSync("vue/demo/KFM-zh.md", "utf8");

/**
 * 综合测试下预设的性能，AMD Ryzen 5 5625U，DDR4-1600。
 *
 * | No. |   Name | preset |    time |  time.SD |
 * | --: | -----: | -----: | ------: | -------: |
 * |   0 | render |  plain | 2.18 ms | 31.73 us |
 * |   1 | render |  guest | 2.21 ms | 11.38 us |
 * |   2 | render |   rich |  2.5 ms | 61.32 us |
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
