<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'

const imgUrlTemp = ref([])

const getImg = async () => {
  await commonDownloadFilesApi({
    CMPNY_DIV: 'HHI',
    FILE_ID: 'T2023-001',
    FILE_NO: '48',
    FILE_TITLE: 'PDF 첨부 테스트.pdf',
    FILE_NAME_ORIGINAL: 'PDF 첨부 테스트.pdf',
    FILE_NAME: '85d2e171-3532-48f1-9f2f-481750bce222.pdf',
    FILE_PATH: '/user_home/xx08/HSE/XX08/00_sample/UploadTest/',
    FILE_TYPE: 'pdf',
    FILE_SIZE: '24.000',
  }).then(res => {
    console.log('res', res)

    const blob = new Blob([res], { type: 'application/pdf' })
    const imageURL = URL.createObjectURL(blob)

    imgUrlTemp.value.push(imageURL)
  })

  // await commonDownloadFilesApi({
  //   CMPNY_DIV: 'HHI',
  //   FILE_ID: 'T2023-001',
  //   FILE_NO: '45',
  //   FILE_TITLE: '이미지테스트5.png',
  //   FILE_NAME_ORIGINAL: '이미지테스트5.png',
  //   FILE_NAME: 'dc1801ec-48dd-4adb-9940-0b0824bc3bcd.png',
  //   FILE_PATH: '/user_home/xx08/HSE/XX08/00_sample/UploadTest/',
  //   FILE_TYPE: 'png',
  //   FILE_SIZE: '523.000',
  // }).then(res => {
  //   // console.log('res', res)

  //   const blob = new Blob([res])
  //   const imageURL = URL.createObjectURL(blob)

  //   imgUrlTemp.value.push(imageURL)
  // })

  console.log('imgUrlTemp', imgUrlTemp.value)
}

onMounted(() => {
  getImg()
})
</script>


<template>
  <div class="page-wrap h-full">
    <VContainer class="pt-0 h-full">
      <div class="contentPanel h-full">
        <div
          v-for="(item, idx) in imgUrlTemp"
          :key="`img_${idx}`"
        >
          <iframe
            width="500"
            :src="item"
          />
          <!--
            <img
            width="500"
            :src="item"
            >
          -->
        </div>
      </div>
    </VContainer>
  </div>
</template>