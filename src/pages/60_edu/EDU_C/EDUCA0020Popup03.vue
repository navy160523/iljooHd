<!-- 
  화면명   : 개선 계획 의견 등록 팝업
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, readonly, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonExecuteApi,
  commonSearchApi
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import dayjs from "dayjs"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { isNull } from "lodash-es"
import IUpload from "@/components/IUpload.vue"


//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(["closed"])
const userStore = useUserStore()

const grdMain = ref(null)

let popupTitle = ref('')

const dialog = ref(null)
const popupParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DEPT_CD: '',      // 부서 코드
  YEAR: '',         // 년도
  OPINION_ID: '',      // 계획 ID
  CONTENT: '',
  OPINION_TYPE: '',
  STATUS: '',
  USER_ID: userStore.userId
})


/* 코드 리스트 */
const codeList = reactive({
  STATUS: [
    {COD: 'A', TXT: '확인완료'}
    ,{COD: 'B', TXT: '재수립요망'}
  ]
})





const openPopup = (rowData,type,OPINION_TYPE) => {
  console.log('rowData',rowData)
  if(OPINION_TYPE === 'A'){
    if(type === 'reg'){ //신규 등록
      popupTitle.value = '개선계획 의견 등록'
      popupParams.DEPT_CD= rowData.DEPT_CD
      popupParams.YEAR= rowData.YEAR
      popupParams.OPINION_TYPE= OPINION_TYPE
    } else if(type === 'update'){ // 수정
      popupTitle.value = '개선계획 의견 수정'
      popupParams.DEPT_CD= rowData.DEPT_CD
      popupParams.YEAR= rowData.YEAR
      popupParams.OPINION_ID= rowData.OPINION_ID
      commonSearchApi({  
      queryId : 'EDUCA0020_POP03_SEARCH_01',
      param: rowData }).then(res=>{
        console.log('res',res.ORESULT_CUR[0])
        const data = res.ORESULT_CUR[0]
        popupParams.CONTENT = data.CONTENT
        popupParams.STATUS = data.STATUS
        popupParams.OPINION_TYPE = data.OPINION_TYPE
        console.log('data',data)
        console.log('popupParams',popupParams)
      })
    }  
  } else if(OPINION_TYPE === 'B'){
    if(type === 'reg'){ //신규 등록
      popupTitle.value = '시행결과 의견 등록'
      popupParams.DEPT_CD= rowData.DEPT_CD
      popupParams.YEAR= rowData.YEAR
      popupParams.OPINION_TYPE= OPINION_TYPE

    } else if(type === 'update'){ // 수정
      popupTitle.value = '시행결과 의견 수정'
      popupParams.DEPT_CD= rowData.DEPT_CD
      popupParams.YEAR= rowData.YEAR
      popupParams.OPINION_ID= rowData.OPINION_ID
      commonSearchApi({  
      queryId : 'EDUCA0020_POP03_SEARCH_01',
      param: rowData }).then(res=>{
        console.log('res',res.ORESULT_CUR[0])
        const data = res.ORESULT_CUR[0]
        popupParams.CONTENT = data.CONTENT
        popupParams.STATUS = data.STATUS
        popupParams.OPINION_TYPE = data.OPINION_TYPE
        console.log('data',data)
        console.log('popupParams',popupParams)
        // popupParams.
      })
    }  
  }
  
 
  dialog.value = true
  // onButtonsClick({ id :'btnSearch' })
}


//초기 코드값 세팅로직 시작
const initCodeList = () => {

}


//팝업닫을때 팝업내부 변수 초기화
const closePopup = () => {
  resetPopup()
  emit("closed")
  dialog.value = false
}

const resetPopup = () => {
  
  popupParams.CMPNY_DIV= userStore.cmpnyDiv
  popupParams.DEPT_CD= ''      // 부서 코드
  popupParams.YEAR= ''         // 년도
  popupParams.OPINION_ID= ''   // 계획 ID
  popupParams.CONTENT= '' // 세부 실행 방안
  popupParams.STATUS= '' // 세부 실행 방안


}


// 팝업 버튼
const onButtonsClick = (btn) => {
  if(btn.id === "btnSearch"){
    // commonSearchApi({ queryId: "EDUCA0020_POP01_SEARCH_01", param: popupParams }).then((res) => {
      
    // })
  }else if (btn.id === "btnUpdate") {
    // console.log('EXCELLENT', popupParams.EXCELLENT)
    new saveFlowHelper(vm, t)
    .setBefore(saveCheck)
    .setQuery(saveData)
    .setAfter(closePopup)
    .run()
  
  } else if(btn.id === "btnClose"){
    closePopup()
  }
}
const saveCheck = () =>{
  console.log('popupParams',popupParams)
  let status = true
  if(popupParams.CONTENT === '' || popupParams.CONTENT === null ){
    Message.warn(t('내용을 입력해주세요.'))
    status = false
  } 
  if(popupParams.STATUS === '' || popupParams.STATUS === null ){
    Message.warn(t('진행상태를 선택해 주세요.'))
    status = false
  } 
  return status
}

const saveData = () =>{
  let saveParams = []
  saveParams.push(popupParams)
  console.log('saveParams',saveParams)
  return commonExecuteApi({
    queryId: "EDUCA0020_POP03_SAVE_01",
    list: saveParams,
  })
}


defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="700"
    height="340"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">{{ popupTitle }}</div>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column" style="height: 170px; margin-bottom: 15px;">
          <i-textarea 
            width="100%"
            height="170px"
            :row="8"
            topLabel
            v-model="popupParams.CONTENT"
          />
        </div>
        <i-select
          :label="$t('진행상태')"
          width="250px"
          v-model="popupParams.STATUS"
          :items="codeList.STATUS"
          item-value="COD"
          item-title="TXT"
          required
        />
      </v-card-text>
    </v-card>
  </VDialog>
</template>
<style scoped lang="scss">
table{ border-collapse : collapse; }  /*이중선 제거*/
td{
      // width: 100px;
      // height: 50px;
      text-align: center;
      border: 2px solid #000;
      
    }
.dot {
  justify-content: normal !important;
  align-items: normal !important;
}
</style>