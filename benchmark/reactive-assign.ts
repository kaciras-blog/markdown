import { defineSuite } from "esbench";
import { reactive, shallowRef, toRaw } from "vue";

export default defineSuite(scene => {
	const object = reactive({
		a: 0,
		b: 0,
		c: 0,
		d: 0,
		e: 0,
		f: 0,
	});
	const ref = shallowRef(toRaw(object));

	scene.bench("ref", () => {
		ref.value = {
			a: 1,
			b: 2,
			c: 3,
			d: 4,
			e: 5,
			f: 6,
		};
	});
	scene.bench("reactive", () => {
		object.a = 1;
		object.b = 2;
		object.c = 3;
		object.d = 4;
		object.e = 5;
		object.f = 6;
	});
});
