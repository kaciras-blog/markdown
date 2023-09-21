<template>
	<button :class='[
		$style.button,
		active && $style.active,
	]'>
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
	font-size: 24px;
	color: #555;

	border: none;
	background: none;
	cursor: pointer;

	&:is(:hover, :focus-visible, .active) {
		color: #0059ff;
	}
}
</style>
