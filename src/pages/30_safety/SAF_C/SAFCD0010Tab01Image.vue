<script setup>
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import { useUserStore } from '@hiway/stores/user'
import { commonSearchApi } from '@hiway/api/commonApi'
import IUploadImageSingle from '@/components/IUploadImageSingle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
const userStore = useUserStore()
const dialog = ref(false)
const images = ref('')
const name = ref(null)
const title = ref('')
const imageList = reactive({
  src: [],
})
// 캐러셀
const carousel = ref(0)
const carouselIdx = ref(0)

const openPopup = async (fileId, imageTitle) => {
  dialog.value = true
  title.value = imageTitle
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
  <v-dialog @afterLeave="closePopup()" v-model="dialog" width="600" height="600">
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle :title="title"> </IGridTitle>
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
          <v-carousel-item v-for="(item, i) in imageList.src" :key="i" :src="item" width="100%" />
        </v-carousel>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
