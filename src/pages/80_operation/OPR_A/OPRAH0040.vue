<!-- 
  * Vue 내 용 : 평가항목 관리
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/26
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/26 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from "@hiway/utils/notify"
import { isEmpty } from "@/@core/utils"

defineOptions({
  name:'80_operation-OPR_A-OPRAH0040',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EVAL_DIV: '',
  QSTN_CATEGORY: '',
  QSTN_TITLE: '',
  EVAL_DIV_NM: '',
  QSTN_CATEGORY_NM: '',
  USE_YN: 'Y',
})

const mainParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  QSTN_ID : '',
  EVAL_DIV : '',
  QSTN_CATEGORY : null,
  QSTN_TITLE : null,
  EVAL_DIV_NM: '',
  QSTN_CATEGORY_NM: '',
  USE_YN : 'Y',
  USER_ID : 'N',
})

//코드리스트
const codeList = reactive({
  EVAL_DIV : [],
  QSTN_CATEGORY : [],
})

// 그리드 콤보박스
const DIVList = ref([])
const CATEGORYList = ref([])
const TYPEList = ref([])

const USEList = ref(
  [
    { COD: 'Y' , TXT: '사용' },
    { COD: 'N' , TXT: '미사용' },
  ],
)

const ANSWRList = ref(
  [
    { COD: 'Y' , TXT: '예' },
    { COD: 'N' , TXT: '아니오' },
  ],
)

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false }, 
    checkBar: { visible: true },
    display: { selectionStyle : 'rows' },
  },
  keys : ['CMPNY_DIV, EVAL_DIV'],
  fields : [
    {
      fieldName: "EVAL_DIV",
      dataType: "text",
      width: "90",
      header: { text: t("평가지구분") },
      editable: false,
      editor: { type: 'dropdown' }, 
      lookupDisplay: true,
    },
    { 
      fieldName: 'QSTN_TITLE',
      dataType: 'text', 
      width: '200', 
      styleName: "left-column", 
      header: { text:'평가 문항' }, 
      styleName: 'editable_column-left',
      editable: true,
    },
    {
      fieldName: "QSTN_CATEGORY",
      dataType: "text",
      width: "120",
      header: { text: t("카테고리") },
      editable: false,
      editor: { type: 'dropdown' }, 
      lookupDisplay: true,
    },
    {
      fieldName: "QSTN_TYPE",
      dataType: "text",
      width: "90",
      header: { text: t("문항유형") },
      styleName: 'editable_column',
      lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true }, 
    },
    {
      fieldName: "SEQ",
      dataType: "text",
      width: "50",
      header: { text: t("순서") },
      editable: false,
    },
    {
      fieldName: "USE_YN",
      dataType: "text",
      width: "70",
      header: { text: t("평가지") },
      styleName: 'editable_column',
      lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true }, 
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_ID', dataType: 'text' , visible: false },
    { fieldName: 'USER_ID', dataType: 'text' , visible: false },
    { fieldName: 'EVAL_DIV_NM', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_CATEGORY_NM', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false }, 
    checkBar: { visible: true },
    display: { selectionStyle : 'rows' },
  },
  keys : ['CMPNY_DIV'],
  fields : [ 
    { 
      fieldName: 'EXMPL_TITLE', 
      dataType: 'text', 
      width: '400', 
      styleName: "left-column", 
      header: { text:'비고' }, 
      styleName: 'editable_column-left',
      editable: true,
    },
    {
      fieldName: "SEQ",
      dataType: "text",
      width: "50",
      header: { text: t("순서") },
      editable: false,
    },
    {
      fieldName: "ANSWR",
      dataType: "text",
      width: "70",
      header: { text: t("정답") },
      styleName: 'editable_column',
      lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true }, 
    },


    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_ID', dataType: 'text' , visible: false },
    { fieldName: 'EXMPL_ID', dataType: 'text' , visible: false },
    { fieldName: 'USER_ID', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdSubProps.columns = grdSubProps.fields

onMounted(() => {
  
  console.log('onMounted')
  
  vm.$nextTick(() => {
    initCombo()
  })  
})

//콤보박스 셋팅
const initCombo = () => {
  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'ZE10'), //구분
  ]).then(res => {
    codeList.EVAL_DIV = res[0].ORESULT_CUR
    searchParams.EVAL_DIV = 'A'
    DIVList.value = res[0].ORESULT_CUR

    setBindCombo()
  })
}

watch(() => searchParams.EVAL_DIV, (newValue, oldValue) => {
  resetCodeDivision(newValue)
})

watch(() => searchParams.QSTN_CATEGORY, (newValue, oldValue) => {
  resetCodeCategory(newValue)
})

const resetCodeDivision = val  =>{
  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'ZE20'), //카테고리
  ]).then(res => {
    codeList.QSTN_CATEGORY = res[0].ORESULT_CUR.filter(data => data.CODE_DESC1 === val)
    searchParams.QSTN_CATEGORY = 'A'
    CATEGORYList.value = res[0].ORESULT_CUR.filter(data => data.CODE_DESC1 === val)
  })
}

const resetCodeCategory = val =>{
  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'ZE30'), //유형
  ]).then(res => {
    TYPEList.value = res[0].ORESULT_CUR.filter(data => data.CODE_DESC1 === val)
    
    onButtonsClick({ id :'btnSearch' })
    setBindCombo()
  })
}

const setBindCombo = () => {
  grdMain.value.setBindingColumn(
    'EVAL_DIV',
    DIVList.value,
    'COD',
    'TXT',
  )

  grdMain.value.setBindingColumn(
    'QSTN_CATEGORY',
    CATEGORYList.value,
    'COD',
    'TXT',
  )

  grdMain.value.setBindingColumn(
    'QSTN_TYPE',
    TYPEList.value,
    'COD',
    'TXT',
  )

  grdMain.value.setBindingColumn(
    'USE_YN',
    USEList.value,
    'COD',
    'TXT',
  )

  grdSub.value.setBindingColumn(
    'ANSWR',
    ANSWRList.value,
    'COD',
    'TXT',
  )
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    console.log('조회')

    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataGrdMain)
      .setAfter(afterSearchGrdMain)
      .run()

  }
  else if (btn.id === 'btnCopy') {
    console.log('복사')

    new saveFlowHelper(vm, t)
      .setBefore(beforeCopyData)
      .setQuery(copyData)
      .setConfirmMessage('복사 하시겠습니까?')
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  }
  else if (btn.id === 'btnSearchSub') {
    new queryFlowHelper(vm, t)
      .setGridList([grdSub])
      .setQuery(searchDataGrdSub)
      .setAfter(afterSearchGrdSub)
      .showMessage(false)
      .run()
  }
  else if (btn.id === 'btnCreate') {
    addData("M")
  }
  else if (btn.id === 'btnCreate2') {
    addData("S")
  }
  else if (btn.id === 'btnUpdate') {
    console.log('Main 저장')
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSaveMain)
      .setQuery(saveDataMain)
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  }
  else if (btn.id === 'btnUpdate2') {
    console.log('Sub 저장')

    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: null }])
      .setGridList([grdSub])
      .setBefore(beforeSaveSub)
      .setQuery(saveDataSub)
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearchSub' })
      })
      .run()
  }
  else if (btn.id === 'btnDelete') {

    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setQuery(deleteDataMain)
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  }
  else if (btn.id === 'btnDelete2') {

    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: null }])
      .setGridList([grdSub])
      .setQuery(deleteDataSub)
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearchSub' }) 
      })
      .run()
  }
  else if (btn.id === 'btnMoveUp') {
    let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let grdData = grdMain.value.getDataProvider().getJsonRows()

    if(grdData.length > 1 && rowIdx > 0) {
      grdMain.value.getDataProvider().moveRow(rowIdx-1,rowIdx)
      grdMain.value.getGridView().setCurrent({ itemIndex: rowIdx-1 })
      grdMain.value.getGridView().checkAll(true)
    }

    for(let i=0; i <grdData.length;i++){
      grdMain.value.getDataProvider().setValue(i, 'SEQ', i + 1)
    }
  }
  else if (btn.id === 'btnMoveDown') {
    let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let grdData = grdMain.value.getDataProvider().getJsonRows()

    if(grdData.length > 1 && grdData.length > rowIdx + 1) {
      grdMain.value.getDataProvider().moveRow(rowIdx+1,rowIdx)
      grdMain.value.getGridView().setCurrent({ itemIndex: rowIdx+1 })
      grdMain.value.getGridView().checkAll(true)
    }

    for(let i=0; i <grdData.length;i++){
      grdMain.value.getDataProvider().setValue(i, 'SEQ', i + 1)
    }
  }
  else if (btn.id === 'btnMoveUp2') {
    let rowIdx = grdSub.value.getGridView().getCurrent().dataRow
    let grdData = grdSub.value.getDataProvider().getJsonRows()

    if(grdData.length > 1 && rowIdx > 0) {
      grdSub.value.getDataProvider().moveRow(rowIdx-1,rowIdx)
      grdSub.value.getGridView().setCurrent({ itemIndex: rowIdx-1 })
      grdSub.value.getGridView().checkAll(true)
    }

    for(let i=0; i <grdData.length;i++){
      grdSub.value.getDataProvider().setValue(i, 'SEQ', i + 1)
    }
  }
  else if (btn.id === 'btnMoveDown2') {
    let rowIdx = grdSub.value.getGridView().getCurrent().dataRow
    let grdData = grdSub.value.getDataProvider().getJsonRows()

    if(grdData.length > 1 && grdData.length > rowIdx + 1) {
      grdSub.value.getDataProvider().moveRow(rowIdx+1,rowIdx)
      grdSub.value.getGridView().setCurrent({ itemIndex: rowIdx+1 })
      grdSub.value.getGridView().checkAll(true)
    }

    for(let i=0; i <grdData.length;i++){
      grdSub.value.getDataProvider().setValue(i, 'SEQ', i + 1)
    }
  }
}

// 평가 항목 조회
const searchDataGrdSub = () =>{
  return commonSearchApi({ queryId : 'OPRAH0040_SEARCH_02', param: mainParams })
}

// 평가 항목 조회 후 데이터 처리
const afterSearchGrdSub = res =>{
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
} 


// 평가 항목 조회
const searchDataGrdMain = () =>{
  return commonSearchApi({ queryId : 'OPRAH0040_SEARCH_01', param: searchParams })
}

// 평가 항목 조회 후 데이터 처리
const afterSearchGrdMain = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // param 값 저장(추가용)
  if(res.ORESULT_CUR.length > 0) {
    mainParams.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
    mainParams.QSTN_ID = res.ORESULT_CUR[0].QSTN_ID
    mainParams.EVAL_DIV = res.ORESULT_CUR[0].EVAL_DIV
    mainParams.QSTN_CATEGORY = res.ORESULT_CUR[0].QSTN_CATEGORY
    mainParams.EVAL_DIV_NM = res.ORESULT_CUR[0].EVAL_DIV_NM
    mainParams.QSTN_CATEGORY_NM = res.ORESULT_CUR[0].QSTN_CATEGORY_NM
  }

  // grdSub clear
  grdSub.value.getDataProvider().setRows(null)
}

// 평가지 복사전 체크
const beforeCopyData = () =>{
  console.log('Checked before Copy Data...')

  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(isEmpty(data.QSTN_TITLE)) {
      return Message.warn(t('평가 문항 미입력된 데이터가 있습니다.'))
    }

    if(mainParams.QSTN_ID === 'NEW' || isEmpty(mainParams.QSTN_ID)) {
      return Message.warn(t('저장이 안된 평가 문항이 있습니다.'))
    }
  }

  return true
} 

// 평가지 복사
const copyData = () =>{
  let copyParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId
    copyParams.push(data)
  }

  console.log('Start copy Data....', copyParams)

  return commonExecuteApi({ queryId : 'OPRAH0040_SAVE_03', list: copyParams })
}

const beforeSaveMain = () => {
  
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(isEmpty(data.QSTN_TITLE)) {
      return Message.warn(t('평가 문항 미입력된 데이터가 있습니다.'))
    }
  }

  return true
}

//저장
const saveDataMain = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId
    saveParams.push(data)
  }

  console.log('saveParams = ', saveParams)

  return commonExecuteApi({ queryId : 'OPRAH0040_SAVE_01', list: saveParams })
}

const beforeSaveSub = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows()
  let cnt = 0

  if(checkedRows.length === 0){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)

    if(isEmpty(data.EXMPL_TITLE)) {
      return Message.warn(t('비고에 미입력된 데이터가 있습니다.'))
    }
  }

  let rows = grdSub.value.getDataProvider().getRows()

  console.log('[beforeSaveSub] rows : ',rows)

  for (let data of rows) {
    if(data[2] === 'Y') {
      cnt++
    }
  }

  if(cnt === 0) {
    return Message.warn(t('정답이 없는 비고항목이 있습니다.'))
  }

  return true
}

//저장
const saveDataSub = () => {
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId
    saveParams.push(data)
  }

  console.log('saveParams = ', saveParams)

  return commonExecuteApi({ queryId : 'OPRAH0040_SAVE_02', list: saveParams })
}

//평가항목 - 삭제
const deleteDataMain = () => {
  let delParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // 추가버튼 클릭으로 생긴 셀 삭제
  let rowNum = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in rowNum) {
    grdMain.value.getDataProvider().removeRow(rowNum[i])
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      delParams.push(data)
    }

    return commonExecuteApi({ queryId : 'OPRAH0040_DELETE_01', list: delParams })
  }
}

//평가보기 - 삭제
const deleteDataSub = () => {
  let delParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  // 추가버튼 클릭으로 생긴 셀 삭제
  let rowNum = grdSub.value.getGridView().getCheckedRows(true)
  for (let i in rowNum) {
    grdSub.value.getDataProvider().removeRow(rowNum[i])
    for (let rowIdx of checkedRows) {
      let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
      delParams.push(data)
    }

    return commonExecuteApi({ queryId : 'OPRAH0040_DELETE_02', list: delParams })
  }
}

/* ---------- 메인 그리드 셀 추가 ---------- */
const addData = grid => {
  if(grid === 'M') {

    let ordMax = 1
    for(var i = 0; i < grdMain.value.getDataProvider().getRowCount(); i++) {
      const data = grdMain.value.getDataProvider().getJsonRow(i)
      if(data.SEQ >= ordMax) {
        ordMax = Number(data.SEQ) + 1
      }
    }
    
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      QSTN_ID: 'NEW',
      EVAL_DIV: searchParams.EVAL_DIV,
      QSTN_TITLE: '',
      QSTN_CATEGORY: searchParams.QSTN_CATEGORY,
      EVAL_DIV_NM: searchParams.EVAL_DIV_NM,
      QSTN_CATEGORY_NM: searchParams.QSTN_CATEGORY_NM,
      QSTN_TYPE: '',
      SEQ: ordMax,
      USE_YN: 'Y',
      USER_ID: userStore.userId,
    })
  }
  else {

    if(isEmpty(mainParams.QSTN_ID)) {
      Message.warn(t('평가 문항 데이터를 선택해주세요'))
    }
    else if(mainParams.QSTN_ID === 'NEW') {
      Message.warn(t('신규 평가 문항 데이터는 저장 후 추가해 주세요'))
    }
    else{
      let ordMax = 1
      for(var i = 0; i < grdSub.value.getDataProvider().getRowCount(); i++) {
        const data = grdSub.value.getDataProvider().getJsonRow(i)
        if(data.SEQ >= ordMax) {
          ordMax = Number(data.SEQ) + 1
        }
      }

      grdSub.value.addRow({
        CMPNY_DIV: mainParams.CMPNY_DIV,
        QSTN_ID: mainParams.QSTN_ID,
        EXMPL_ID: 'NEW',
        EXMPL_TITLE: '',
        SEQ: ordMax,
        ANSWR: 'N',
        USER_ID: userStore.userId,
      })
    }
  }
}

const onCellClicked = (grid, clickData) => {

  if (clickData.cellType === "data") {
    let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    mainParams.CMPNY_DIV = row.CMPNY_DIV
    mainParams.QSTN_ID = row.QSTN_ID
    mainParams.EVAL_DIV = row.EVAL_DIV
    mainParams.QSTN_CATEGORY = row.QSTN_CATEGORY
    mainParams.QSTN_TITLE = row.QSTN_TITLE
    mainParams.USE_YN = row.USE_YN
    mainParams.EVAL_DIV_NM = row.EVAL_DIV_NM
    mainParams.QSTN_CATEGORY_NM = row.QSTN_CATEGORY_NM
    mainParams.USER_ID = row.USER_ID

    if(clickData.fieldName !== 'QSTN_TYPE'
    && clickData.fieldName !== 'USE_YN' 
    && row.QSTN_ID !== 'NEW') {
      onButtonsClick({ id :'btnSearchSub' })
    }
  }
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCopy']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select 
            v-model="searchParams.EVAL_DIV"
            :label="$t('평가지구분')"
            label-width="100px"
            append-inner-icon="mdi-magnify"
            :items="codeList.EVAL_DIV"
            item-value="COD"
            item-title="TXT"
            width="300px"
            required
          />
          <i-select 
            v-model="searchParams.QSTN_CATEGORY" 
            :label="$t('카테고리')"
            label-width="100px"
            append-inner-icon="mdi-magnify"
            :items="codeList.QSTN_CATEGORY"
            item-value="COD"
            item-title="TXT"
            width="300px"
          />
          <i-input
            v-model="searchParams.QSTN_TITLE"
            :label="$t('문항 제목 검색')"
            label-width="100px"
          />
          <VCheckbox
            v-model="searchParams.USE_YN"
            :label="$t('평가지 사용 항목 포함')"
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet 
            width="50%" 
            class="pa-0 h-auto pe-3"
          >
            <!-- 메인그리드 -->
            <IGridTitle 
              :title="$t('평가 문항 목록')"
              :button-list="['btnMoveUp', 'btnMoveDown', 'btnCreate', 'btnUpdate', 'btnDelete']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-3"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @on-cell-clicked="onCellClicked"
            />
          </v-sheet>
          <v-sheet 
            width="50%" 
            class="pa-0 h-auto"
          >
            <IGridTitle
              :title="$t('평가 보기 목록')"
              :button-list="['btnMoveUp2', 'btnMoveDown2', 'btnCreate2', 'btnUpdate2', 'btnDelete2']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              class="mt-3"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>