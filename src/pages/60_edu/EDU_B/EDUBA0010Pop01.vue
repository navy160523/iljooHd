<!--
  화면명 : PDF 다운로드(팝업)
  화면개요 :장비자격 보수교육 기준 PDF를 다운받을 수 있는 화면.
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"

//******************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
let ALM_TARGET = reactive({})
let Month = reactive({})
let explain1 = reactive({})
let explain2 = reactive({})
let explain3 = reactive({})

//******************************세팅 영역(종료)***************************************************/

//********************************강사 상세정보 데이터***************************************//

//********************************/강사 상세정보 데이터(종료)***********************************//


//*****************************************오픈 팝업********************************************/
const openPopup = (data) => {
  if(data.ALM_TARGET === 'C'){
    ALM_TARGET = '취소'
    Month = '1'
    explain1 = '자격 갱신 불가'
    explain2 = '사외자격 : 신규자격교육'
    explain3 = ' '
  } else if(data.ALM_TARGET === 'S'){
    ALM_TARGET = '정지'
    Month = '3'
    explain1 = '자격 갱신 기준'
    explain2 = '사외자격 : 인증교육'
    explain3 = '사내자격 : 보수교육'
  }

  dialog.value = true
}

const btnSampleDown = () => {
  let params = {
    PATH : 'Pdf',
    FILE_PATH: 'EDU_B',
    FILE_NAME: '장비자격 보수교육 기준.pdf',  
  }
  commonSampleDownFilesApi(params)
}

//****************************************오픈 팝업(종료)************************************************/

//###########################################이벤트 영역##################################################/
const onButtonsClick = btn => {
  dialog.value = false
}



defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    width="600"
    height="350"
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      id="app"
      @mousedown="startDragging"
    >
      <span>PDF 다운로드</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :title="$t('')"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text  class="pa-4 pt-0">
      <div class="center" >{{ ALM_TARGET }} : 보수교육일 {{ Month }}개월 경과 시
        <br> {{ explain1 }} 
        <br> {{ explain2 }} 
        <br> {{ explain3 }} 
      </div>
      <div class="centerBtn mt-2">
        <IGridTitle
          :button-list="['btnSampleDown']"
          @click-button="btnSampleDown"
        >
          <template #editors />
        </IGridTitle>  
      </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}

.center{
  display: flex;
  align-items: center;
  text-align: center;
  margin-left: 170px;
  padding-top: 10px;
  margin-top: px;
  font-size: large;
}
.centerBtn{
  display: flex;
  align-items: center;
  margin-left: 210px;
  margin-bottom: 30px;
}

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
