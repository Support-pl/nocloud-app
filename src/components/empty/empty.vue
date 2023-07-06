<template>
  <div class="none">
		<div class="smile">:(</div>
		{{ $t('It’s empty...') }}
	</div>
</template>

<script>
export default { name: 'emptyPlaceholder' }
</script>

<style>
.none {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	height: 100%;
  padding: 10px 25px;
	font-size: 32px;
  text-align: center;
}

.smile {
  width: 100px;
	height: 100px;
	font-size: 64px;
	transform: rotate(90deg);
}

</style>
