
<!-- 
  * Vue 내 용 : 평가협력사 선정
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/02
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/02 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { isEmpty } from "@/@core/utils"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'

const emit = defineEmits(["closed"])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const deptPopUp = ref(null)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

//조회조건
const searchParams = reactive({
  YEAR: dayjs().get("year"),
  QUARTER: '',
  BSNS_CD_SB: 'Y',  //조선
  BSNS_CD_MR: 'Y',  //해양
  BSNS_CD_SS: 'Y',  //특수선
  BSNS_CD_EM: 'Y',  //엔진기계
  ASGN_CD: '',
  ASGN_NM: '',
  CHRG_GRP: '',
  CMPNY_GBN: '',
})

/* 조회 구분 */
const dtQuater = reactive([
  { COD: "1", TXT: "1분기" },
  { COD: "2", TXT: "2분기" },
  { COD: "3", TXT: "3분기" },
  { COD: "4", TXT: "4분기" },
])

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  field: [
    {
      fieldName: "SEL_NM",
      dataType: "text",
      width: "70",
      header: { text: t("선택여부") },
    },
    {
      fieldName: "BSNS_NM",
      dataType: "text",
      editable: false,
      width: "120",
      header: { text: t("사업부") },
    },
    {
      fieldName: "ASGN_SHRT_NM",
      dataType: "text",
      editable: false,
      width: "120",
      styleName: "left-column",
      header: { text: t("등록부서") },
    },
    {
      fieldName: "COMP_CD",
      dataType: "text",
      editable: false,
      width: "90",
      header: { text: t("협력사코드") },
    },
    {
      fieldName: "COMP_NM",
      dataType: "text",
      editable: false,
      width: "150",
      styleName: "left-column",
      header: { text: t("협력사명") },
    },
    {
      fieldName: "OPEN_YMD",
      dataType: "date",
      datetimeFormat: 'yyyy-MM-dd',
      type: 'data',
      editable: false,
      width: "100",
      header: { text: t("사업개시일") },
    },
    {
      fieldName: "QUATER_PERIOD",
      dataType: "text",
      editable: false,
      width: "70",
      header: { text: t("사업개시경과일") },
    },
    {
      fieldName: "REG_CNT",
      dataType: "text",
      editable: false,
      width: "70",
      styleName: " right-column",
      header: { text: t("등록인원") },
    },
    {
      fieldName: "REMARK",
      dataType: "text",
      editable: true,
      width: "500",
      styleName: "left-column",
      header: { text: t("비고") },
    },

    { fieldName: "COMPANY", dataType: "text", visible: false },
    { fieldName: "ASGN_CD", dataType: "text", visible: false },
    { fieldName: "ENTRY_DATE", dataType: "text", visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "BSNS_CD", dataType: "text", visible: false },
    { fieldName: "SEL_CNT", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = val => {
  searchParams.ASGN_CD = ''
  searchParams.ASGN_NM = ''
  searchParams.QUARTER = getQuarter(new Date())
  searchParams.CHRG_GRP = val

  grdMain.value.getGridView().setFixedOptions({
    colCount: 5,
  })

  initDate()
  grdMain.value.getGridView().filterPanel.visible = true
  dialog.value = true
}

// 이전 분기로 설정
const initDate = () => {
  if(searchParams.QUARTER === '1') {
    searchParams.YEAR = (dayjs().get("year") - 1)
    searchParams.QUARTER = '4'
  }
  else if(searchParams.QUARTER === '2') {
    searchParams.QUARTER = '1'
  }
  else if(searchParams.QUARTER === '3') {
    searchParams.QUARTER = '2'
  }
  else if(searchParams.QUARTER === '4') {
    searchParams.QUARTER = '3'
  }

  onButtonsClick({ id :'btnSearch' }) 
}


const onClose = () => {
  dialog.value = false
  emit("closed")
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if (btn.id === 'btnSelect')
  {
    let msg = searchParams.YEAR + '년 ' + searchParams.QUARTER + '분기로 저장하시겠습니까?'

    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setConfirmMessage(msg)
      .setBefore(beforeCheck)
      .setQuery(saveData)
      .setAfter(res => { 
        onClose()
      })
      .run()
  }
  else if (btn.id === 'btnDelete')
  {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])  
      .setBefore(beforeCheck)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  }
  else if (btn.id === 'btnClose')
  {
    onClose()
  }
}

// 평가협력사 목록 조회
const searchData = () =>{
  grdMain.value.getGridView().clearColumnFilters("COMP_CD") // 필터해제

  return commonSearchApi({ queryId : 'SAFIB0010_SEARCH_POPUP01', param: searchParams })
}

//  조회 후 데이터 처리
const afterSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 조건에 따라 그리드 색상 변경
  customGridStyle()
}

// 선택 전 체크
const beforeCheck = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if (grdMain.value.getDataProvider().rowCount === 0) {
    return Message.err("목록에 데이터가 없습니다.")
  }

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(data.QUATER_PERIOD === '6개월미만') {
      return Message.err(data.COMP_NM + "은(는) 사업개시일로부터 해당 분기 6개월 미만입니다. 저장할 수 없습니다.")
    }
  }

  return true
}

// 선택
const saveData = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,
        COMP_CD : data.COMP_CD,
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        REG_CNT : data.REG_CNT,
        REMARK : data.REMARK,
        YEAR : searchParams.YEAR,
        QUARTER : searchParams.QUARTER,
        USER_ID : userStore.userId,
      },
    )
  }

  return commonExecuteApi({ queryId : 'SAFIB0010_SAVE_POPUP01', list: saveParams })
}

// 삭제
const deleteData = () => {
  let deleteParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }
  else {
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      
      deleteParams.push(
        {
          CMPNY_DIV : data.CMPNY_DIV,
          COMP_CD : data.COMP_CD,
          BSNS_CD : data.BSNS_CD,
          DEPT_CD : data.DEPT_CD,
          ASGN_CD : data.ASGN_CD,
          YEAR : searchParams.YEAR,
          QUARTER : searchParams.QUARTER,
        },
      )
    }

    return commonExecuteApi({ queryId : 'SAFIB0010_DELETE_POPUP01', list: deleteParams })
  }
}

const openDeptPopup = () => {
  let popupParam = {
    DISABLE:true,
    ASGN_NM: searchParams.ASGN_NM,
  }

  //필터 해제
  grdMain.value.getGridView().clearColumnFilters("COMP_CD")

  deptPopUp.value.openPopup(popupParam)
}

const onDeptSelected = row =>{
  let filters = []

  if(isEmpty(row.length)) { //협력사 단일 선택시
    filters.push({ name: row.ASGN_SHRT_NM, criteria: "value = '" + row.ASGN_CD + "'", active:true })
    grdMain.value.getGridView().setColumnFilters('COMP_CD', filters)
  }
  else if(row.length > 0) { //협력사 복수 선택시
    row.forEach((e,idx) => {
      filters.push({ name: row[idx].ASGN_SHRT_NM + idx, criteria: "value = '" + row[idx].ASGN_CD + "'", active:true })
    })

    grdMain.value.getGridView().setColumnFilters('COMP_CD', filters)
  }
}

const getQuarter  = date => {
  return Math.ceil((date.getMonth() + 1) / 3).toString()
}

const customGridStyle = () => {

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}

    if(grid.getValue(item.index, "QUATER_PERIOD") === '6개월미만'){
      ret.style = { background: "#FAED7D" }
    }

    return ret
  })
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="980"
    height="780"
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
      <span>평가협력사 선정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="searchParams.YEAR"
                :label="$t('년도')"
                top-label
                label-width="50px"
                type="Number"
                width="120px"
                required
              />
              <i-select
                v-model="searchParams.QUARTER"
                :label="$t('분기')"
                top-label
                label-width="60px"
                append-inner-icon="mdi-magnify"
                :items="dtQuater"
                item-title="TXT"
                item-value="COD"
                width="120px"
              />
              <i-input
                v-model="searchParams.ASGN_NM" 
                :label="t('협력사')"
                top-label
                width="200px"
                label-width="60px"
                append-inner-icon="mdi-magnify"
                @click:append-inner="openDeptPopup"
                @keydown.enter="openDeptPopup"
              />
            </div>
            <div class="d-flex mt-2">
              <VCheckbox
                v-model="searchParams.BSNS_CD_SB"
                :label="$t('조선')"
                class="pe-5"
              />
              <VCheckbox
                v-model="searchParams.BSNS_CD_MR"
                :label="$t('해양')"
                class="pe-5"
              />
              <VCheckbox
                v-model="searchParams.BSNS_CD_SS"
                :label="$t('특수선')"
                class="pe-5"
              />
              <VCheckbox
                v-model="searchParams.BSNS_CD_EM"
                :label="$t('엔진기계')"
              />
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </div>
        <DeptPopup 
          ref="deptPopUp"
          :checkBar=true 
          @selected="onDeptSelected"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
