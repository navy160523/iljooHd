
<!-- 
  * Vue 내 용 : 평가협력사 대상자 선정
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
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { isEmpty } from "@/@core/utils"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

const emit = defineEmits(["closed"])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  HALF: '',
  BSNS_CD: '',
  BSNS_NM: '',
  CHRG_GRP: '',
})

const dtHalf = reactive([
  { COD: "1", TXT: "상반기" },
  { COD: "2", TXT: "하반기" },
])

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
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
      width: "120",
      header: { text: t("사업부") },
      styleName: "left-column",
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "150",
      header: { text: t("협력사명") },
      styleName: "left-column",
    },
    {
      fieldName: "DEPT_NM",
      dataType: "text",
      width: "150",
      header: { text: t("등록부서") },
      styleName: "left-column",
    },
    {
      fieldName: "KOR_NM",
      dataType: "text",
      width: "70",
      header: { text: t("대상자") },
    },
    {
      fieldName: "HALF_PERIOD_NM",
      dataType: "text",
      width: "100",
      header: { text: t("해당반기 현 소속 근속기간") },
    },
    { 
      fieldName: 'GRADE_NM', 
      dataType: 'text', 
      width: "70",
      header: { text: t('자격순위') }, 
    },
    {
      fieldName: "REMARK",
      dataType: "text",
      width: "300",
      styleName: "left-column",
      header: { text: t("비고") },
    },

    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "BSNS_CD", dataType: "text", visible: false },
    { fieldName: "ASGN_CD", dataType: "text", visible: false },
    { fieldName: "DEPT_CD", dataType: "text", visible: false },
    { fieldName: "EMP_NO", dataType: "text", visible: false },
    { fieldName: "SEL_CNT", dataType: "text", visible: false },
    { fieldName: "GRADE", dataType: "text", visible: false },
    { fieldName: "CAREER_DAYS", dataType: "text", visible: false },
    { fieldName: "CAREER", dataType: "text", visible: false },
    { fieldName: "HALF_PERIOD", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = (cd, nm, gunsan) => {
  searchParams.YEAR = dayjs().get("year")
  searchParams.HALF = getHalf(dayjs().format('MM'))
  searchParams.BSNS_CD = cd
  searchParams.BSNS_NM = nm
  searchParams.CHRG_GRP = gunsan

  dialog.value = true

  onButtonsClick({ id: "btnSearch" })
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
    console.log('조회')
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if (btn.id === 'btnSelect')
  {
    let msg = ''

    if(searchParams.HALF === '1') {
      msg = searchParams.YEAR + '년 상반기로 저장하시겠습니까?'
    }
    else{
      msg = searchParams.YEAR + '년 하반기로 저장하시겠습니까?'
    }
    
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
  console.log('searchData : ', searchParams)
  
  return commonSearchApi({ queryId : 'SAFIC0010_SEARCH_POPUP01', param: searchParams })
}

//  조회 후 데이터 처리
const afterSearch = res =>{
  console.log('afterSearch : ', res)
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

    if(isEmpty(data.GRADE)) {
      return Message.err("자격순위가 공란입니다. 저장할 수 없습니다.")
    }

    if(data.HALF_PERIOD === 'N') {
      return Message.err("해당반기 현 소속 근속기간 6개월 미만입니다. 저장할 수 없습니다.")
    }
  }

  return true
}

// 저장
const saveData = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        DEPT_CD : data.DEPT_CD,
        EMP_NO : data.EMP_NO,
        YEAR : searchParams.YEAR,
        HALF : searchParams.HALF,
        REMARK : data.REMARK,
        USER_ID : userStore.userId,
      },
    )
  }

  return commonExecuteApi({ queryId : 'SAFIC0010_SAVE_POPUP01', list: saveParams })
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
          BSNS_CD : data.BSNS_CD,
          DEPT_CD : data.DEPT_CD,
          ASGN_CD : data.ASGN_CD,
          YEAR : searchParams.YEAR,
          HALF : searchParams.HALF,
          EMP_NO : data.EMP_NO,
        },
      )
    }

    console.log('deleteData : ', deleteParams)

    return commonExecuteApi({ queryId : 'SAFIC0010_DELETE_POPUP01', list: deleteParams })
  }
}

const getHalf  = month => {
  let half = '1'
  
  switch(month) {
  case "01":
  case "02":
  case "03":
  case "04":
  case "05":
  case "06":
    half = '1'
    break
  case "07":
  case "08":
  case "09":
  case "10":
  case "11":
  case "12":
    half = '2'
    break
  }

  return half
}

const customGridStyle = () => {

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}
    let value1 = grid.getValue(item.index, "GRADE")

    if(isEmpty(value1)){
      ret.style = { background: "#FAED7D" }
    }

    if(grid.getValue(item.index, "HALF_PERIOD") === 'N'){
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
    width="900"
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
      <span>협력사 안전관리자 선정</span>
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
            <div class="d-flex mt-1">
              <i-input
                v-model="searchParams.BSNS_NM"
                :label="$t('대상')"
                top-label
                label-width="50px"
                type="text"
                width="160px"
                readonly
              />
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
                v-model="searchParams.HALF"
                :label="$t('반기')"
                top-label
                label-width="60px"
                append-inner-icon="mdi-magnify"
                :items="dtHalf"
                item-title="TXT"
                item-value="COD"
                width="120px"
              />
              <h4 
                style="color:red" 
                class="mt-1"
              >
                ※ 해당반기 현 소속(협력사)에서 6개월 이상 근속한 대상에 한해 평가 실시
              </h4>
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
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
