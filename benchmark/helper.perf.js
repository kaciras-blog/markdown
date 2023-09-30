import { performance } from "perf_hooks";
import { getEmphasis } from "@kaciras-blog/markdown";

function run(name, text) {

	function iter() {
		for (let i = 0; i < 1000_000; i++) getEmphasis(text);
	}

	// warm up
	iter();

	const start = performance.now();
	iter();
	const end = performance.now();

	console.log("\n" + name);
	console.log(`${(end - start).toFixed(3)} ns/op`);
}

run("Default", "`***ooooooopsooooooo***`");
