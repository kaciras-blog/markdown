<template>
	<button
		type='button'
		:class='[$style.button, active && $style.active]'
	>
		<slot/>
	</button>
</template>

<script setup lang="ts">
defineProps<{ active?: boolean }>();
</script>

<style module>
.button {
	display: inline-flex;
	align-items: center;
	justify-content: center;

	/* SVG 可能被设为 1em 尺寸 */
	font-size: 24px;

	padding: 5px;
	color: #555;
	border: none;
	background: none;
	cursor: pointer;
}

.button:is(
	:hover,
	:focus-visible,
	.active
) {
	color: #0059ff;
}
</style>
