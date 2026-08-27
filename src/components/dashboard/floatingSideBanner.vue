<!-- 
  * Vue 내 용 : 통합안전 Dashboard
  * 작 성 자 : 일주지앤에스 박성학
  * 최초 작성일 : 2024/05/16
  * 최종 수정자 : 박성학
  * 최종 수정일 : 2024/05/28
-->

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/scss'

const props = defineProps({
  list: {
    type: Array,
    required: true,
  },
  count: {  // 노출할 콘텐츠의 개수
    type: Number,
    default: 1,
  },
  contentWidth: { // 각 콘텐츠의 너비 (단위: px)
    type: String,
    required: true,
  },
  contentHeight: {  // 각 콘텐츠의 높이 (단위: px)
    type: Number,
    required: true,
  },
  gap: {  // 콘텐츠 사이의 간격 (단위: px)
    type: Number,
    default: 10,
  },
  speed: {  // 슬라이드 속도
    type: Number,
    default: 10000,
  },
  useAutoplay: {
    type: Boolean,
    default: true,
  },
  useLoop: {
    type: Boolean,
    default: true,
  },
  isVertical: {
    type: Boolean,
    default: true,
  },
})

const delay = ref(props.speed)
const modules = ref([Autoplay])
const floatingBannerSwiper = ref()

function onSwiper(swiper) {
  console.log('onSwiper',swiper)
  floatingBannerSwiper.value = swiper
}

// 여기서 높이를 설정한다.
const computedLength = computed(() => {
  return props.contentHeight * props.count + props.gap * (props.count - 1)
})
</script>

<template>
  <div
    :style="{ width: `${isVertical ? contentWidth : computedLength}px` }"
  >
    <swiper
      ref="floatingBannerSwiper"
      :style="isVertical ? { height: `${computedLength}px` } : { width: `${computedLength}px` }"
      :direction="props.isVertical ? 'vertical' : 'horizontal'"
      :slides-per-view="props.count"
      :space-between="props.gap"
      :loop="props.useLoop"
      :modules="modules"
      :autoplay="{
        delay: delay,
        disableOnInteraction: false,
      }"
      @swiper="onSwiper"        
    >
      <!-- 콘텐츠 영역은 이렇게 슬롯으로 받았다. -->      
      <!-- <slot></slot> -->
      <swiper-slide
        v-for="(item, i) in props.list"
        :key="i"
      >
        <div class="banner-content">
          <v-chip color="primary" variant="flat" :text="item.PART_NM" />
          <span class="dataNum pl-2 pr-1">{{ item.AHEAD_ITEM }}</span>이/가 전월 대비
          <span class="dataNum pl-1">{{ item.MON_YUL }}% 감소/증가 했습니다.</span>
        </div>
      </swiper-slide>
    </swiper>
  </div>
</template>

<style lang="scss" scoped>
.swiper {
  margin-left: auto;
  margin-right: auto;
  position: relative;
  overflow: clip;
  list-style: none;
  padding: 0;
  z-index: 1;
  display: block;
}
.dataNum {
  line-height: 31px;
}
</style>
