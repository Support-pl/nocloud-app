<template>
	<div class="maintanance">
		<a-result title="Oops...">
			<template #icon>
				<a-icon type="tool"></a-icon>
			</template>
			<template #subTitle>
				<p>Something is not working as it should.</p>
				<p>We already know about this and are taking all necessary measures right now.</p>
				<p>Thank you for your patience.</p>
				<p>Soon we will be back online.</p>
			</template>
			<template #extra>
				<router-link v-if="mainPageButton" :to="{name: 'root'}">
					<a-button type="primary">
						Back Home
					</a-button>
				</router-link>
			</template>
		</a-result>
	</div>
</template>

<script>
export default {
	name: "maintanance-mode",
	props: {
		"main-page-button": Boolean
	}
}
</script>

<style scoped>
.maintanance{
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}

p {
	padding: 0;
	margin: 0;
	margin-bottom: 5px;
}
</style>