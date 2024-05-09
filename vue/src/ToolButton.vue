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

	padding: 5px;
	font-size: 1em;
	border: none;

	color: #555;
	background: none;
	cursor: pointer;

	&:is(:hover, :focus-visible, .active) {
		color: #0059ff;
	}

	/* TODO: tablar 丢失了图标的默认值 */
	& > svg {
		width: 1.5em;
		height: 1.5em;
		stroke-width: 2;
	}
}
</style>
