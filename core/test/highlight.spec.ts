import { expect, it } from "vitest";
import highlight from "../src/web/highlight.ts";

it("should support diff syntax", () => {
	expect(highlight("+A\n-B\nC", "ini", "diff")).toMatchSnapshot();
});

it("should work without diff", () => {
	expect(highlight("+A\n-B\nC", "ini")).toMatchSnapshot();
});

it("should only escape HTML for unknown language", () => {
	expect(highlight("<foo>", "UNKNOWN")).toBe("&lt;foo&gt;");
});

it("should only escape HTML without language", () => {
	expect(highlight("<foo>", "")).toBe("&lt;foo&gt;");
});
