<!--
  화면명 : 안전긴급예산 상세 팝업
  화면개요 : 안전긴급예산 내용 연도별로 상세데이터 조회하는 화면
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi, commonExecuteApi2,commonSendApi } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from "@/components/ILabel.vue"
import { useI18n } from "vue-i18n"
import dayjs from 'dayjs'
import _ from "lodash"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

import Echart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { color, use } from 'echarts/core'
import { LineChart , BarChart , PieChart } from 'echarts/charts'  
import { TooltipComponent , LegendComponent, GridComponent, ToolboxComponent } from 'echarts/components'

//******************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)
const grdSub = ref(null)
const dialog = ref(false)
const empPopup = ref(null)
// OzReport 팝업 여부
const showOz = ref(false)
const fileUploadPopup = ref(null)
const emit = defineEmits(['saved'])

use([
  CanvasRenderer,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  BarChart,
  PieChart
])

//Area Visible
const areaVisible = reactive({
  SAFETY : true,
})

//등록데이터
const popupDatas = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR : dayjs().format('YYYY'),
  BG_FAC_INV : '',
  BG_CUR_EXP : '',
})

const popupTables = reactive({
  MAINDATA : [],
  SUBDATA : [],
  CHART:[],
})

const clearData = async () => {
  popupDatas.BG_FAC_INV = ''
  popupDatas.BG_CUR_EXP = ''
  popupDatas.YEAR = dayjs().format('YYYY')

  if(grdMain.value != null && grdMain.value.getDataProvider().rowCount > 0){ grdMain.value.getDataProvider().clearRows() }
  if(grdSub.value != null && grdSub.value.getDataProvider().rowCount > 0){ grdSub.value.getDataProvider().clearRows() }
  grdMain.value.getDataProvider().addRow({
    FAC01 : '',FAC02 : '',FAC03 : '',FAC04 : '',FAC05 : '',FAC06 : '',FAC07 : '',FAC08 : '',FAC09 : '',FAC10 : '',FAC11 : ''
  })
  grdSub.value.getDataProvider().addRow({
    RISK : '',URGENCY : '',COST_EFFECT : '',ETC_ELEMENT : ''
  })
}

const CardNewsImg = reactive([])
const CardEduImg = reactive([])

//******************************세팅 영역(종료)***************************************************/
// 투자타당성 검토 요소 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'GUBN', dataType: 'text', header: { text: t('구분') }, editable: false, width: '70' },
    { fieldName: 'BUDGET', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('배정 예산') }, width: '70' },
    { fieldName: 'PRE_EXE', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('집행 예정 예산(A)') }, editable: false, width: '70' },
    { fieldName: 'COMP_BUDGET', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('집행 완료 예산(B)') }, editable: false, width: '70' },
    { fieldName: 'ASG_BUDGET', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('배정 완료 예산(A + B)') }, editable: false, width: '70' },
    { fieldName: 'REMAINS', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('잔여 가용 예산') }, editable: false, width: '70' },
    { fieldName: 'USING_RATE', dataType: 'text', header: { text: t('사용비율') }, editable: false, width: '70' },
    { fieldName: 'REM_RATE', dataType: 'text', header: { text: t('잔여비율') }, editable: false, width: '70' },
  ],
  columns : [],
})

// 투자타당성 검토 점수 결과 그리드 셋팅
const grdSubProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'GUBN', dataType: 'text', header: { text: t('구분') }, editable: false, width: '100' },
    { fieldName: 'MON01', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('1월') }, editable: false, width: '100' },
    { fieldName: 'MON02', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('2월') }, editable: false, width: '100' },
    { fieldName: 'MON03', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('3월') }, editable: false, width: '100' },
    { fieldName: 'MON04', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('4월') }, editable: false, width: '100' },
    { fieldName: 'MON05', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('5월') }, editable: false, width: '100' },
    { fieldName: 'MON06', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('6월') }, editable: false, width: '100' },
    { fieldName: 'MON07', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('7월') }, editable: false, width: '100' },
    { fieldName: 'MON08', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('8월') }, editable: false, width: '100' },
    { fieldName: 'MON09', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('9월') }, editable: false, width: '100' },
    { fieldName: 'MON10', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('10월') }, editable: false, width: '100' },
    { fieldName: 'MON11', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('11월') }, editable: false, width: '100' },
    { fieldName: 'MON12', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('12월') }, editable: false, width: '100' },
    { fieldName: 'TOTAL', dataType: "number",styleName: "right-column", numberFormat: "#,##0.###", header: { text: t('합계') }, editable: false, width: '100' },
  ],
  columns : [],
})

//Echart 속성 세팅
const lineChartsOptions1 = ref(
  {
  grid:{
    left:'5%',
    right:'2%',
    bottom:'10%'
  },
  legend: {
    data: ['시설투자','경상비']
  },
  xAxis: [
    {
      type: 'category',
      data: ['1월', '2월', '3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
    }
  ],
  yAxis: [
    {
      type: 'value',
      min: 0,
    }
  ],
  series: [
    {
      name: '시설투자',
      type: 'bar',
      color:'#1A40C7',
      data: [
        2, 4, 7, 23, 25, 26, 13, 16, 32, 20, 6, 3
      ]
    },
    {
      name: '경상비',
      type: 'bar',
      color:'#0581FD',
      data: [
        1, 0, 1, 13, 5, 16, 23, 16, 12, 3, 6, 3
      ]
    },
  ]
}
)

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

//데이터 조회 시작 
const search = async () =>{
  new queryFlowHelper(vm, t)
    .setQuery(searchData01)
    .setAfter(afterSearch01)
    .showMessage(false)
    .run()
}

//데이터 조회
const searchData01 = async () =>{
  return commonSearchApi({
    queryId: "SRMFA0020_POP01_SEARCH_01",
    param: { CMPNY_DIV : popupDatas.CMPNY_DIV, YEAR : popupDatas.YEAR },
  })
}

//조회 데이터 입력
const afterSearch01 = async res =>{
  if(res.ORESULT_CUR1.length > 0){
    popupDatas.BG_CUR_EXP = res.ORESULT_CUR1[0]['BG_CUR_EXP']
    popupDatas.BG_FAC_INV = res.ORESULT_CUR1[0]['BG_FAC_INV']
  }else{
    popupDatas.BG_CUR_EXP = '3000000'
    popupDatas.BG_FAC_INV = '7000000'
  }

  await setGrdMain(res.ORESULT_CUR2)

  await setGrdSub(res.ORESULT_CUR3)

  await setChart(res.ORESULT_CUR3)
}
//집형현황 세팅
const setGrdMain = async data =>{
  await initGrdMain()
  if(data.length > 0){
    let row = data[0]
    if(row === null) return
    let PRE_EXE = [isNullAndZero(row['EB_PRE1_BG_FAC_INV']) + isNullAndZero(row['EB_PRE2_BG_FAC_INV']), isNullAndZero(row['EB_PRE1_BG_CUR_EXP']) + isNullAndZero(row['EB_PRE2_BG_CUR_EXP']), 
      isNullAndZero(row['EB_PRE1_BG_FAC_INV']) + isNullAndZero(row['EB_PRE2_BG_FAC_INV'])+ isNullAndZero(row['EB_PRE1_BG_CUR_EXP']) + isNullAndZero(row['EB_PRE2_BG_CUR_EXP'])]
    let COMP_BUDGET = [ isNullAndZero(row['EB_EXE_BG_FAC_INV']), isNullAndZero(row['EB_EXE_BG_CUR_EXP']), isNullAndZero(row['EB_EXE_BG_CUR_EXP']) + isNullAndZero(row['EB_EXE_BG_FAC_INV'])]

    let budget = [isNullAndZero(popupDatas.BG_FAC_INV), isNullAndZero(popupDatas.BG_CUR_EXP), isNullAndZero(popupDatas.BG_FAC_INV) + isNullAndZero(popupDatas.BG_CUR_EXP)]

    for(let i = 0 ; i < popupTables.MAINDATA.length ; i++){
      popupTables.MAINDATA[i]['BUDGET'] = budget[i]
      popupTables.MAINDATA[i]['PRE_EXE'] = PRE_EXE[i]
      popupTables.MAINDATA[i]['COMP_BUDGET'] = COMP_BUDGET[i]
      popupTables.MAINDATA[i]['ASG_BUDGET'] = PRE_EXE[i] + COMP_BUDGET[i]
      popupTables.MAINDATA[i]['REMAINS'] = budget[i] - (PRE_EXE[i] + COMP_BUDGET[i])
      popupTables.MAINDATA[i]['USING_RATE'] = Math.round((PRE_EXE[i] + COMP_BUDGET[i]) / budget[i] * 100) + '%'
      popupTables.MAINDATA[i]['REM_RATE'] = 100 - Math.round(((PRE_EXE[i] + COMP_BUDGET[i]) / budget[i] * 100)) + '%'
    }

    grdMain.value.getDataProvider().setRows(popupTables.MAINDATA)
  }
}
//실적 세팅
const setGrdSub = async data =>{
  await initGrdSub()
  if(data.length > 0){
    let row = data[0]
    let colKind = ['_BG_FAC_INV', '_BG_CUR_EXP', 'TOTAL']
    for(let i = 0 ; i < popupTables.SUBDATA.length ; i+=2){
      let total = 0
      let kindIdx = i / 2
      if(kindIdx < 2){
        for(let k = 1 ; k < 13 ; k++){
          if(k < 10) {
            popupTables.SUBDATA[i]['MON0' + k] = isNullAndZero(row['MON0' + k + colKind[kindIdx]])
            total += isNullAndZero(row['MON0' + k + colKind[kindIdx]])
          }
          else {
            popupTables.SUBDATA[i]['MON' + k] = isNullAndZero(row['MON' + k + colKind[kindIdx]])
            total += isNullAndZero(row['MON' + k + colKind[kindIdx]])
          }
        }
      } else{
        for(let k = 1 ; k < 13 ; k++){
          if(k < 10) {
            popupTables.SUBDATA[i]['MON0' + k] = isNullAndZero(popupTables.SUBDATA[0]['MON0' + k]) + isNullAndZero(popupTables.SUBDATA[2]['MON0' + k])
            total += isNullAndZero(popupTables.SUBDATA[0]['MON0' + k ]) + isNullAndZero(popupTables.SUBDATA[2]['MON0' + k ])
          }
          else {
            popupTables.SUBDATA[i]['MON' + k] = isNullAndZero(popupTables.SUBDATA[0]['MON' + k ]) + isNullAndZero(popupTables.SUBDATA[2]['MON' + k ])
            total += isNullAndZero(popupTables.SUBDATA[0]['MON' + k ]) + isNullAndZero(popupTables.SUBDATA[2]['MON' + k ])
          }
        }
      }
      popupTables.SUBDATA[i]['TOTAL'] = total
    }
    let budget = [isNullAndZero(popupDatas.BG_FAC_INV), isNullAndZero(popupDatas.BG_CUR_EXP), isNullAndZero(popupDatas.BG_FAC_INV) + isNullAndZero(popupDatas.BG_CUR_EXP)]
    for(let i = 1  ; i < popupTables.SUBDATA.length ; i+=2){
      let kindIdx = parseInt(i / 2)
      if(kindIdx < 2){
        for(let k = 1 ; k < 13 ; k++){
          if(k < 10) {
            budget[kindIdx] -= isNullAndZero(row['MON0' + k + colKind[kindIdx]])
            popupTables.SUBDATA[i]['MON0' + k] = budget[kindIdx]
          }
          else {
            budget[kindIdx] -= isNullAndZero(row['MON' + k + colKind[kindIdx]])
            popupTables.SUBDATA[i]['MON' + k] = budget[kindIdx]
          }
        }
      } else{
        for(let k = 1 ; k < 13 ; k++){
          if(k < 10) {
            popupTables.SUBDATA[i]['MON0' + k] = isNullAndZero(popupTables.SUBDATA[1]['MON0' + k ]) + isNullAndZero(popupTables.SUBDATA[3]['MON0' + k ])
            budget[kindIdx] = isNullAndZero(popupTables.SUBDATA[1]['MON0' + k ]) + isNullAndZero(popupTables.SUBDATA[3]['MON0' + k ])
          }
          else {
            popupTables.SUBDATA[i]['MON' + k] = isNullAndZero(popupTables.SUBDATA[1]['MON' + k ]) + isNullAndZero(popupTables.SUBDATA[3]['MON' + k ])
            budget[kindIdx] = isNullAndZero(popupTables.SUBDATA[1]['MON' + k ]) + isNullAndZero(popupTables.SUBDATA[3]['MON' + k ])
          }
        }
      }
      popupTables.SUBDATA[i]['TOTAL'] = budget[kindIdx]
    }
    grdSub.value.getDataProvider().setRows(popupTables.SUBDATA)
  }
}
//차트 세팅
const setChart = async data =>{
  await initChart()
  if(data.length > 0){
    let row = data[0]
    let colKind = ['_BG_FAC_INV', '_BG_CUR_EXP']
    for(let i = 0  ; i < colKind.length ; i++){
      let arr = []
      for(let k = 1 ; k < 13 ; k++){
        if(k < 10) {
          arr.push(isNullAndZero(row['MON0' + k + colKind[i]])) 
        }
        else {
          arr.push(isNullAndZero(row['MON' + k + colKind[i]])) 
        }
      }
      lineChartsOptions1.value.series[i].data = arr
    }
  }
}
//집형현황 초기화
const initGrdMain = async () =>{
  popupTables.MAINDATA = []
  let gubn = ['시설투자', '경상비', '합계']
  for(let i = 0 ; i < 3 ; i++){
    popupTables.MAINDATA.push(
      {GUBN : gubn[i], BUDGET : '', PRE_EXE : '', COMP_BUDGET : '', ASG_BUDGET : '', REMAINS : '', USING_RATE : '', REM_RATE : ''}
    )
  }
  grdMain.value.getDataProvider().setRows(popupTables.MAINDATA)
}
//실적 초기화
const initGrdSub = async () =>{
  popupTables.SUBDATA = []
  let gubn = ['시설투자 집행','시설투자 잔여','경상비 집행','경상비 잔액','총 집행예산','총 잔여예산']
  for(let i = 0 ; i < 6 ; i++){
    popupTables.SUBDATA.push(
      {GUBN : gubn[i], MON01 : '', MON02 : '', MON03 : '', MON04 : '', MON05 : '', MON06 : '', MON07 : '', MON08 : '', MON09 : ''
        , MON10 : '', MON11 : '', MON12 : '', TOTAL : ''}
    )
  }
  grdSub.value.getDataProvider().setRows(popupTables.SUBDATA)
}
//차트 초기화
const initChart = async () =>{
  lineChartsOptions1.value.series[0].data = []
  lineChartsOptions1.value.series[1].data = []
}
// 연도변경시 이벤트
watch(() => popupDatas.YEAR, (newValue, oldValue) => {
  search()
})
//*****************************************오픈 팝업********************************************/

const openPopup = async data => { 

  await search()
  //팝업 오픈
  dialog.value = true 
}

//****************************************오픈 팝업(종료)************************************************/
//널 체크 메서드
const isNullCheck = data => {
  return (data === undefined || data === null || data === '') ? true : false
}

const isNullAndZero = data =>{
  return isNullCheck(data) ? 0 : parseInt(data)
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const onButtonsClick = async btn => {  
  if(btn.id === 'btnUpdate'){
    saveData()
  }else if(btn.id === 'btnClose'){
    emit("saved")
    onClose()
  }
}

//메일 발송 및 상태 변경
const saveData = (gubn) => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeSaveData1)
    .setQuery(saveDataQuery1)
    .setAfter(() => search())
    .run()
}

//저장 전 데이터 체크
const beforeSaveData1 = () =>{
  return true
}

//저장 쿼리
const saveDataQuery1 = () =>{  
  return commonExecuteApi2({ queryId : 'SRMFA0020_POP01_SAVE_01', list: [{
    YEAR : popupDatas.YEAR, 		
    CMPNY_DIV : popupDatas.CMPNY_DIV, 	
    BG_FAC_INV : popupDatas.BG_FAC_INV, 
    BG_CUR_EXP : popupDatas.BG_CUR_EXP, 
    USER_ID : userStore.userId, 	
  }] })
}

//콤보박스 설정
const initCombo = async () => {  
  Promise.all([
    getCodeList('HHIAF40'),
  ]).then(res => {

  })

  clearData()
}



onMounted(() => {
  vm.$nextTick(() => {
    initCombo()  
  })  
})

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1500"
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
      <span>예산집행현황</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <!-- 조회기간 -->
            <i-select
              width="180px"
              :label="$t('년도')"
              v-model="popupDatas.YEAR"
              label-width="30px"
              type="YEAR"
              margin="10px"
            /> 
            <div
              class="title align-center formLabelText d-flex"
            >
              경상비
              <svg-icon class="dot" name="redDot"></svg-icon>
            </div>
            <i-number
              class="pr-5"
              style="width : 300px"
              type="number"
              v-model="popupDatas.BG_CUR_EXP"
            />
            <div
              class="title align-center formLabelText d-flex"
            >
            시설투자
              <svg-icon class="dot" name="redDot"></svg-icon>
            </div>
            <i-number
              class="pr-5"
              style="width : 300px"
              type="number"
              v-model="popupDatas.BG_FAC_INV"
            />
          </v-sheet>
          <div class="h-auto">
            <div class="flex-column">
              <div class="title formLabelText d-flex">{{ popupDatas.YEAR + '년도 안전긴급예산 집행 현황' }}</div>
              <RealGrid
                ref="grdMain"
                style="height: 170px"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
              <div class="title formLabelText d-flex">월별 집행 완료 실적 상세(B)</div>
              <RealGrid
                ref="grdSub"
                style="height: 230px"
                :grid-view-option="grdSubProps.gridViewOption"
                :keys="grdSubProps.keys" 
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
              />
              <v-card style="height: 230px" class="pa-3">
                <e-chart :option="lineChartsOptions1"/>
              </v-card>
            </div>
          </div>
        </div>  
      </v-card-text>    
    </v-card>
    <!-- 임직원 선택 팝업 -->
    <EmpPopup ref="empPopup" @selected ="selectedEmpData" />
    <!-- 업로드 팝업-->
    <IUploadPopup ref="fileUploadPopup" @closed="afterFileSearch"/>
    <!-- OZReport -->
    <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
