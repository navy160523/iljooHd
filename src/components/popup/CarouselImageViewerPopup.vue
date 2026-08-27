<script setup>
/*
**안전점검-일상점검에 있는 이미지를 보여주는 팝업을 공통 팝업으로 변경**
Vue 내용 : 이미지를 캐러셀 형태로 보여주는 팝업
작 성 자 : 일주지엔에스 SI3팀 김현재 선임
최초 작성일 : 2025.01.07
*/

import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import { useUserStore } from '@hiway/stores/user'
import { commonSearchApi } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
const userStore = useUserStore()
const dialog = ref(false)
const images = ref('')
const name = ref(null)

const props = defineProps({
  //팝업 상단 타이틀
  title: {
    type: String,
    default: '이미지',
  },
  //팝업 가로길이
  width: {
    type: String,
    default: 600,
  },
  //팝업 높이
  height: {
    type: String,
    default: 600,
  },
})

const imageList = reactive({
  src: [],
})
// 캐러셀
const carousel = ref(0)
const carouselIdx = ref(0)

const openPopup = async (fileId) => {
  dialog.value = true
  getImages(fileId)
}

const getImages = async (FILE_ID) => {
  await commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: FILE_ID,
    },
  }).then((res) => {
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      commonDownloadFilesApi(res.ORESULT_CUR[i]).then((res) => {
        const blob = new Blob([res])
        const url = URL.createObjectURL(blob)
        imageList.src.push(url)
      })
    }
  })
}

const closePopup = () => {
  dialog.value = false
  imageList.src = []
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    @afterLeave="closePopup()"
    v-model="dialog"
    :width="props.width"
    :height="props.height"
  >
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle :title="props.title"> </IGridTitle>
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <v-carousel
          hide-delimiters
          height="100%"
          class="border"
          show-arrows="hover"
          hide-delimiter-background
          :key="carousel"
          v-model="carouselIdx"
        >
          <v-carousel-item
            v-for="(item, i) in imageList.src"
            :key="i"
            :src="item"
            width="100%"
          />
        </v-carousel>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
