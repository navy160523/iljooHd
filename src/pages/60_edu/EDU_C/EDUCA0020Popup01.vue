<!-- 
  화면명   : 개선 계획 등록 팝업
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

//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(["closed"])
const userStore = useUserStore()

const grdMain = ref(null)
const STATUS = ref(false)

let popupTitle = ref('')

const dialog = ref(null)
const popupParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DEPT_CD: '',      // 부서 코드
  YEAR: '',         // 년도
  PLAN_ID: '',      // 계획 ID
  PLAN_TITLE: '',   // 세부 추진 사항
  PLAN_CONTENT: '', // 세부 실행 방안
  PLAN_STANDARD: '',// 평가지표 및 실적 측정 기능 
  PERIOD: '',       // 이행주기
  EVA_DIV: '',      // 평가구분
  TO_MONTH: '',     // 종료월
  FROM_MONTH: '',  // 시작월
  USER_ID: userStore.userId
})


/* 코드 리스트 */
const codeList = reactive({
  MONTH: [
    {COD: '1', TXT: '1월' }
    ,{COD: '2', TXT: '2월' }
    ,{COD: '3', TXT: '3월' }
    ,{COD: '4', TXT: '4월' }
    ,{COD: '5', TXT: '5월' }
    ,{COD: '6', TXT: '6월' }
    ,{COD: '7', TXT: '7월' }
    ,{COD: '8', TXT: '8월' }
    ,{COD: '9', TXT: '9월' }
    ,{COD: '10', TXT: '10월' }
    ,{COD: '11', TXT: '11월' }
    ,{COD: '12', TXT: '12월' }
  ],
  EVA_DIV: [
  {COD: 'A', TXT: '정성' }
  ,{COD: 'B', TXT: '정량' }
  ],
  PERIOD: [
  {COD: 'A', TXT: '월별' }
  ,{COD: 'B', TXT: '발생시' }
  ,{COD: 'C', TXT: '주별' }
  ,{COD: 'D', TXT: '1회(년)' }
  ,{COD: 'E', TXT: '2회(년)' }
    
  ]
})


const grdMainProps = reactive({
  gridViewOption : {edit: { editable: false }, },
  fields: [
  { fieldName: "CATEGORY_NM", width: "60",dataType: "text", header: { text: t("영역") } }
  ,{ fieldName: "GUIDE_DETAIL", dataType: "text", header: { text: t("안내용 문구") } }
  
  // 숨김
  ,{ fieldName: "SUVY_ID", dataType: "text", visible: false }
  ,{ fieldName: "CATEGORY", dataType: "text", visible: false }
  ,{ fieldName: "QSTN_ID", dataType: "text", visible: false }
  ],
  columns: [],
})


grdMainProps.columns = grdMainProps.fields


const openPopup = (rowData,type,status) => {
  console.log('rowData',rowData)
  if(type === 'reg'){ //신규 등록
    popupTitle.value = '개선계획 등록'
    popupParams.DEPT_CD= rowData.DEPT_CD
    popupParams.YEAR= rowData.YEAR
  } else if(type === 'update'){ // 수정
    popupTitle.value = '개선계획 수정'
    popupParams.DEPT_CD= rowData.DEPT_CD
    popupParams.YEAR= rowData.YEAR
    popupParams.PLAN_ID= rowData.PLAN_ID
    commonSearchApi({  
    queryId : 'EDUCA0020_SEARCH_02',
    param: rowData }).then(res=>{
      console.log('res',res.ORESULT_CUR[0])
      const data = res.ORESULT_CUR[0]
      popupParams.PLAN_TITLE= data.PLAN_TITLE   // 세부 추진 사항
      popupParams.PLAN_CONTENT= data.PLAN_CONTENT // 세부 실행 방안
      popupParams.PLAN_STANDARD= data.PLAN_STANDARD // 평가지표 및 실적 측정 기능 
      popupParams.PERIOD= data.PERIOD       // 이행주기
      popupParams.EVA_DIV= data.EVA_DIV      // 평가구분
      popupParams.TO_MONTH= data.TO_MONTH     // 종료월
      popupParams.FROM_MONTH= data.FROM_MONTH   // 시작월
    })
  }
  commonSearchApi({  
    queryId : 'EDUCA0020_SEARCH_01',
    param: popupParams }).then(res=>{
      const grdMainData = res.ORESULT_CUR[0]
      console.log('EDUCA0020_SEARCH_01 res',res)
      const grdMainList = [
            {CATEGORY_NM: grdMainData.DISADVANTAGE_1, GUIDE_DETAIL: grdMainData.GUIDE_DETAIL_1 ,CATEGORY: grdMainData.DISADVANTAGE_1_COD, YEAR: grdMainData.YEAR, DEPT_CD: grdMainData.DEPT_CD}
            ,{CATEGORY_NM: grdMainData.DISADVANTAGE_2, GUIDE_DETAIL: grdMainData.GUIDE_DETAIL_2, CATEGORY: grdMainData.DISADVANTAGE_2_COD, YEAR: grdMainData.YEAR, DEPT_CD: grdMainData.DEPT_CD}
            ,{CATEGORY_NM: grdMainData.DISADVANTAGE_3, GUIDE_DETAIL: grdMainData.GUIDE_DETAIL_3, CATEGORY: grdMainData.DISADVANTAGE_3_COD, YEAR: grdMainData.YEAR, DEPT_CD: grdMainData.DEPT_CD}
          ]
      console.log('grdMainList',grdMainList)
      grdMain.value.getDataProvider().setRows(grdMainList)
      grdMain.value.getGridView().displayOptions.syncGridHeight = 'always'
    })
  STATUS.value = status
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
  popupParams.PLAN_ID= ''   // 계획 ID
  popupParams.PLAN_TITLE= ''   // 세부 추진 사항
  popupParams.PLAN_CONTENT= '' // 세부 실행 방안
  popupParams.PLAN_STANDARD= ''// 평가지표 및 실적 측정 기능 
  popupParams.PERIOD= ''       // 이행주기
  popupParams.EVA_DIV= ''      // 평가구분
  popupParams.TO_MONTH= ''     // 종료월
  popupParams.FROM_MONTH= ''   // 시작월
  popupParams.USER_ID= userStore.userId

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
  if(popupParams.FROM_MONTH === '' || popupParams.FROM_MONTH === null ){
    Message.warn(t('시작월을 선택해주세요.'))
    status = false
  } else if(popupParams.TO_MONTH === '' || popupParams.TO_MONTH === null ){
    Message.warn(t('종료월을 선택해주세요.'))
    status = false
  } 

  if(status){
    // console.log('시작,종료우러 체크')
    if(parseInt(popupParams.FROM_MONTH) > parseInt(popupParams.TO_MONTH)){
        Message.warn('시작월이 종료월보다 늦을 수 없습니다.')
        status = false
      }
    // if(parseInt(popupParams.FROM_MONTH) < parseInt(popupParams.TO_MONTH)){
    //     Message.warn('종료월이 시작월보다 빠를 수 없습니다.')
    //     status = false
    //   }
  }
      
    
  return status
}

const saveData = () =>{
  let saveParams = []
  saveParams.push(popupParams)
  console.log('saveParams',saveParams)
  return commonExecuteApi({
    queryId: "EDUCA0020_POP01_SAVE_01",
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
    height="565"
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
        <div class="d-flex flex-column" style="min-height: 130px;">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </div>
        
        <div class="d-flex flex-column mt-2">
          <i-textarea 
            :label="$t('세부추진 사항')"
            width="100%"
            height="100%"
            :row="2"
            topLabel
            v-model="popupParams.PLAN_TITLE"
            :readonly="STATUS"
          />
          <i-textarea 
            :label="$t('세부실행 방안')"
            width="100%"
            height="100%"
            :row="3"
            topLabel
            v-model="popupParams.PLAN_CONTENT"
            class="mt-1"
            :readonly="STATUS"

          />
          
          <i-textarea 
            :label="$t('평가지표 및 실적 측정 기준')"
            width="100%"
            height="100%"
            :row="2"
            topLabel
            v-model="popupParams.PLAN_STANDARD"
            top-label
            class="mt-1"
            :readonly="STATUS"

            />
          <div class="mt-1 d-flex">
            <i-select
              :label="$t('이행주기')"
              width="26%"
              v-model="popupParams.PERIOD"
              :items="codeList.PERIOD"
              item-value="COD"
              item-title="TXT"
              top-label
              :readonly="STATUS"

            />
            <i-select
              :label="$t('평가구분')"
              width="25%"
              v-model="popupParams.EVA_DIV"
              :items="codeList.EVA_DIV"
              item-value="COD"
              item-title="TXT"
              top-label
              :readonly="STATUS"

            />  
            <i-select
              :label="$t('시작월')"
              width="20%"
              v-model="popupParams.FROM_MONTH"
              :items="codeList.MONTH"
              item-value="COD"
              item-title="TXT"
              required
              top-label
              :readonly="STATUS"
            />
            <i-select
              :label="$t('종료월')"
              width="20%"
              v-model="popupParams.TO_MONTH"
              :items="codeList.MONTH"
              item-value="COD"
              item-title="TXT"
              required
              top-label
              :readonly="STATUS"
            />
          </div>
        </div>
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