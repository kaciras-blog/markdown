import { defineSuite } from "esbench";
import { getEmphasis } from "../core/lib/index.js";

export default defineSuite(scene => {
	scene.bench("getEmphasis", () => getEmphasis("`***ooooooopsooooooo***`"));
});
