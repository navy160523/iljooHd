<script setup>
import { useSkins } from '@core/composable/useSkins'
import { useThemeConfig } from '@core/composable/useThemeConfig'

// @layouts plugin
import { AppContentLayoutNav } from '@layouts/enums'

const DefaultLayout = defineAsyncComponent(() => import('./components/DefaultLayout.vue'))
const DefaultLayoutWithHorizontalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithHorizontalNav.vue'))
const DefaultLayoutWithVerticalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithVerticalNav.vue'))
const { width: windowWidth } = useWindowSize()
const { appContentLayoutNav, switchToVerticalNavOnLtOverlayNavBreakpoint } = useThemeConfig()

// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint(windowWidth)

const { layoutAttrs, injectSkinClasses } = useSkins()

injectSkinClasses()
</script>

<template>
  <DefaultLayout v-bind="layoutAttrs" />
  <!-- <DefaultLayoutWithHorizontalNav v-bind="layoutAttrs" /> -->
</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use "@layouts/styles/default-layout";
</style>
