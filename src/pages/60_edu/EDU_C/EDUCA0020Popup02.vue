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
  commonSearchApi,
} from "@hiway/api/commonApi"
import { commonDeleteAllFilesApi } from '@hiway/api/commonFileApi'
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
const fileUpload = ref(null)
const STATUS = ref(false) // 개선계획 및 시행결과 등록 모니터링에서 열었을 경우 비활성화

let popupTitle = ref('')

const dialog = ref(null)
const popupParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DEPT_CD: '',      // 부서 코드
  YEAR: '',         // 년도
  RESULT_ID: '',      // 계획 ID
  RESULT_CONTENT: '',
  ATTACH_FILE_KEY: '',
  SAVE_YN: '',
  USER_ID: userStore.userId
})


/* 코드 리스트 */
const codeList = reactive({
})





const openPopup = (rowData,type,status) => {
  console.log('rowData',rowData)
    if(type === 'reg'){ //신규 등록
      popupTitle.value = '시행결과 등록'
      popupParams.DEPT_CD= rowData.DEPT_CD
      popupParams.YEAR= rowData.YEAR
      popupParams.SAVE_YN= 'N'

    } else if(type === 'update'){ // 수정
      popupTitle.value = '시행결과 수정'
      popupParams.DEPT_CD= rowData.DEPT_CD
      popupParams.YEAR= rowData.YEAR
      popupParams.RESULT_ID= rowData.RESULT_ID
      popupParams.SAVE_YN= 'Y'
      popupParams.RESULT_CONTENT = rowData.RESULT_CONTENT
      popupParams.ATTACH_FILE_KEY = rowData.ATTACH_FILE_KEY
      // commonSearchApi({  
      // queryId : 'EDUCA0020_POP02_SEARCH_01',
      // param: rowData }).then(res=>{
      //   console.log('res',res.ORESULT_CUR[0])
      //   const data = res.ORESULT_CUR[0]
      //   console.log('data',data)
      //   console.log('popupParams',popupParams)
      //   popupParams.RESULT_CONTENT = data.RESULT_CONTENT
      //   popupParams.ATTACH_FILE_KEY = data.ATTACH_FILE_KEY
      // })
    }  
    console.log('status',status)
    STATUS.value = status
    dialog.value = true  


    vm.$nextTick(() => {
      if(type === 'reg'){ //신규 등록
        fileUpload.value.setGuid()
        popupParams.ATTACH_FILE_KEY = fileUpload.value.guid
      }else if(type === 'update'){
        fileUpload.value.setGuid(popupParams.ATTACH_FILE_KEY)
        console.log('fileUpload.value.guid',fileUpload.value.guid)
        fileUpload.value.onButtonsClick({id:'btnSearch'})

      }
    })
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

const resetPopup = async () => {
  
  popupParams.CMPNY_DIV= userStore.cmpnyDiv
  popupParams.DEPT_CD= ''      // 부서 코드
  popupParams.YEAR= ''         // 년도
  popupParams.RESULT_ID= ''   // 계획 ID
  popupParams.RESULT_CONTENT= '' // 세부 실행 방안

  if(popupParams.SAVE_YN === 'N'){
    console.log('popupParams.ATTACH_FILE_KEY',popupParams.ATTACH_FILE_KEY)
  } 
  popupParams.ATTACH_FILE_KEY= ''

}


// 팝업 버튼
const onButtonsClick = (btn) => {
  if(btn.id === "btnSearch"){
    
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
  if(popupParams.RESULT_CONTENT === '' || popupParams.RESULT_CONTENT === null ){
    Message.warn(t('내용을 입력해주세요.'))
    status = false
  } 
  return status
}

const saveData = () =>{
  popupParams.SAVE_YN = 'Y'
  let saveParams = []
  saveParams.push(popupParams)
  console.log('saveParams',saveParams)
  return commonExecuteApi({
    queryId: "EDUCA0020_POP02_SAVE_01",
    list: saveParams,
  })
}

const uploaded = () =>{
  console.log('fileUpload.value.guid',fileUpload.value.guid)

  // console.log('')
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
    height="505"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">{{ popupTitle }}</div>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          :button-list="STATUS ? [ 'btnClose'] : ['btnUpdate', 'btnClose']"
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
            :readonly="STATUS"
            v-model="popupParams.RESULT_CONTENT"
          />
        </div>
        <IUpload
          ref="fileUpload"
          style="height: 200px"
          @uploaded="uploaded"
          :is-visibled="!STATUS"
          :button-list="STATUS ? [ 'btnDownLoad'] : ['btnDownLoad', 'btnDelete']"
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