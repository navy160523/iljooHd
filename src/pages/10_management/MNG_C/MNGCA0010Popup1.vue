<!--
  화면명 : MNGCA0010Popup1.vue
  화면개요 :HSE 조직도 -> 조직도 확인하기 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import html2canvas from 'html2canvas' 
// import LoadingDialog from '@layouts/components/LoadingDialog.vue'
import { useCommonStore } from '@hiway/stores/common' 

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const fullDate = ref('')
const commonStore = useCommonStore() 



let myText = ref('')

const openPopup =  (data) => {
  dialog.value = true 
  myText.value = data.divPrint.innerHTML
  fullDate.value = data.fullDate
  
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnClose') {

    dialog.value = false
  }
  else if(btn.id === 'btnDownLoad') {

    commonStore.loading = true
    const canvas = document.createElement('canvas')
    const orgChartElement = chartOrgchart.value // ref로 요소에 접근합니다.
    // const orgChartElement = document.querySelector('.chartOrgchart').innerHTML // ref로 요소에 접근합니다.
    // 이미지를 생성하고 캔버스에 그림
    html2canvas(orgChartElement).then(canvas => {
      // 이미지 다운로드
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = fullDate.value+'.png'
      link.click()
    })
    commonStore.loading = false 
  }
}

const chartOrgchart = ref(null)


defineExpose({
  openPopup,
})

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  // let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="100%"
    height="100%"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
    >
  <v-sheet
    color="primarySub"
    height="50"
    class="px-4 d-flex align-center rounded-t-5 cursor-move"
    @mousedown="startDragging"
  >
    <span>조직도 확인하기</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnDownLoad','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div v-html='myText' class="chartOrgchart" ref="chartOrgchart" style="width:100% height:100%"></div>
      </v-card-text>
  </v-card>

  </v-dialog>
</template>

<style>
.chartContent {
  white-space: pre-wrap !important;
  min-height: 1.25rem !important;
  height: auto !important;
}
</style>
<style scoped>
.content-area {
  text-align: center;
}
</style>
