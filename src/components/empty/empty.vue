<template>
  	<div class="none">
		<div class="smile">:(</div>
		{{$t('It’s empty...')}}
	</div>
</template>

<script>
export default {
	name: 'emptyPlaceholder'
}
</script>

<style>


.none{
	display: flex;
	height: 100%;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	font-size: 32px;
}
.smile{
	transform: rotate(90deg);
	width: 100px;
	height: 100px;
	font-size: 64px;
}

</style>