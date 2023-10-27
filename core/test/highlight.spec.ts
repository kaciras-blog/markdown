import { expect, it } from "vitest";
import highlight from "../src/web/highlight.ts";

it("should support diff syntax", () => {
	expect(highlight("+A\n-B\nC", "ini", "diff")).toMatchSnapshot();
});

it("should work without diff", () => {
	expect(highlight("+A\n-B\nC", "ini")).toMatchSnapshot();
});

it("should return falsy value for unknown language", () => {
	expect(highlight("+A\n-B\nC", "UNKNOWN")).toBeFalsy();
});
