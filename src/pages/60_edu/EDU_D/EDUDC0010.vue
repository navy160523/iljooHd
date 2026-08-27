<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import dayjs from "dayjs"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from "@hiway/utils/notify"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'

defineOptions({
  name: "60_edu-EDU_D-EDUDC0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const gridTitle = ref(null)
const grdMain = ref(null)
const grdMain2 = ref(null)
const grdDetail = ref(null)
const empPopup = ref(null)
let showMessageYN = true


const searchParams1 = reactive({ 
    YEAR: dayjs().format('YYYY'),
    CMPNY_DIV: userStore.cmpnyDiv,
    MNTH :  dayjs().format('MM'),  //"이번달",
    TODAY : dayjs(new Date()).format('YYYY-MM'),
  })

const searchParams2 = reactive({ 
  YEAR: dayjs().format('YYYY'),
  CMPNY_DIV: userStore.cmpnyDiv,
  MNTH : dayjs().format('MM'),  //"이번달",                     
  TODAY : dayjs(new Date()).format('YYYY-MM'),
})

const today = dayjs().format('YYYY-MM-DD');

const searchDetailParams = reactive({})
const tab = ref('Department')
const codeList = reactive({})

// 팝업
const deptPopup = ref(null)


const upDataRow = () => {
  onButtonsClick({ id: "btnSearch" })
}

const upDataRowDetail = () => {
  onButtonsClick({ id: "btnSearch" })
  searchDetail()
}


const cmpnyDivText  = ref('HD현대중공업')

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ TAB1 함수■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

const searchData01 = () => {
  const paramsCopy = JSON.parse(JSON.stringify(searchParams1))
  console.log("파람 코피",paramsCopy)
  return commonSearchApi({ queryId: "EDUDC0010_search01" , param: paramsCopy })
}

const afterSearch01 = (res) => {
  console.log(res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const saveData01 = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)  // 체크된 ROW들 받아올 수 있는 함수

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId
    data.MNTH = searchParams1.MNTH
    data.YEAR = searchParams1.YEAR.toString()
    data.CMPNY_DIV = 'HHI'
    saveParams.push(data)
  }

  console.log('saveParams = ', saveParams)

  return commonExecuteApi({ queryId : 'EDUDC0010_save01', list: saveParams })
}



//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' }, checkBar: { visible: true }, stateBar: { visible: false }  ,footer: {visible: true}},
  keys: [],
  fields: [
    {
      fieldName: "BSNS_NM",
      header: { text: t("사업부") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "DEPT_NM",
      header: { text: t("부서") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "JIK_CNT",
      header: { text: t("직영 인원") },
      width: '40',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "HYUB_CNT",
      header: { text: t("협력사 인원") },
      width: '40',
      dataType: "text",
      editable: false,
      footer: { styleName: 'right-column', text: '소계 : ' },
    },
    
    {
      fieldName: "CPN_REG_CNT",
      header: { text: t("쿠폰 매수") },
      styleName: "editable_column-right",
      dataType: "number",
      width: '70',
      editable: true,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    {
      fieldName: "CPN_REG_DT",
      dataType: "text",
      width: '70',
      datetimeFormat: "yyyy-MM-dd",
      header: { text: t("쿠폰배부일자") },
      styleName: "editable_column",
      editButtonVisibility: "always",
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM-dd",
      },
    },
    {
      fieldName: "REMARK",
      header: { text: t("비고") },
      width: '200',
      dataType: "text",
      styleName: "editable_column",
      editable: true,
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 200,
      }
    },
    {
      fieldName: "GBN",
      width: '40',
      header: { text: t("배부여부") },
      dataType: "text",
      editable: false,
    },
    //  안보임
    { fieldName: 'BSNS_CD',   dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD',   dataType: 'text' , visible: false },
    { fieldName: 'CMPNY_DIV',   dataType: 'text' , visible: false },
  ],
  columns: [],
  columnLayout: [
    "BSNS_NM",  
    "DEPT_NM", 
    {
      name: "소속인원",
      direction: "horizontal",
      items: [
        'JIK_CNT', 'HYUB_CNT'
      ],
      header: {
        text: t("소속인원"),
      },
    },
    "CPN_REG_CNT",  
    "CPN_REG_DT", 
    "REMARK",
    "GBN",  
  ],
})

grdProps1.columns = grdProps1.fields



//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ TAB2 함수■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■



const MnthList = reactive([
  { code: '01', text: '1월' },
  { code: '02', text: '2월' },
  { code: '03', text: '3월' },
  { code: '04', text: '4월' },
  { code: '05', text: '5월' },
  { code: '06', text: '6월' },
  { code: '07', text: '7월' },
  { code: '08', text: '8월' },
  { code: '09', text: '9월' },
  { code: '10', text: '10월' },
  { code: '11', text: '11월' },
  { code: '12', text: '12월' },

])


const afterSearch02 = (res) => {
  grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)
}


watch(
  () => searchParams2.TODAY,
  (newValue, oldValue) => {
    searchParams2.YEAR = newValue.substring(0,4)
    searchParams2.MNTH = newValue.substring(5,7)
  }
)

watch(
  () => searchParams1.TODAY,
  (newValue, oldValue) => {
    searchParams1.YEAR = newValue.substring(0,4)
    searchParams1.MNTH = newValue.substring(5,7)
  }
)


const searchData02 = () => {
  const paramsCopy = JSON.parse(JSON.stringify(searchParams2))
  console.log(paramsCopy)
  //paramsCopy.MNTH = searchParams2.TODAY
  return commonSearchApi({ queryId: "EDUDC0010_search02" , param: paramsCopy })
}

const saveData02 = () => {

  let saveParams = []
  let checkedRows = grdMain2.value.getGridView().getCheckedRows(true)  // 체크된 ROW들 받아올 수 있는 함수

  for (let rowIdx of checkedRows) {
    let data = grdMain2.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId
    data.MNTH = searchParams2.MNTH
    data.YEAR = searchParams2.YEAR
    // data.CMPNY_DIV = 'HHI'
    saveParams.push(data)
  }
  console.log('save?', saveParams)
  return commonExecuteApi({ queryId : 'EDUDC0010_save02', list: saveParams })
}



//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' }, checkBar: { visible: true }, stateBar: { visible: false }  ,footer: {visible: true}},
  keys: [],
  fields: [
    {
      fieldName: "BSNS_NM",
      header: { text: t("사업부") },
      styleName: 'left-column',
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "DEPT_NM",
      header: { text: t("부서") },
      styleName: 'left-column',
      width: '60',
      dataType: "text",
      editable: false,
      footer: { styleName: 'right-column', text: '소계 : ' },
    },

    {
      fieldName: "CPN_REG_CNT",
      header: { text: t("쿠폰 매수") },
      styleName: "editable_column-right",
      width: '60',
      dataType: "number",
      editable: true,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    {
      fieldName: "CPN_RCV_NAME",
      header: { text: t("쿠폰 수령자 성명") },
      styleName: "editable_column",
      width: '80',
      dataType: "text",
      editable: true,
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
    },
    {
      fieldName: "CPN_REG_DT",
      dataType: "text",
      datetimeFormat: "yyyy-MM-dd",
      header: { text: t("쿠폰배부일자") },
      width: '80',
      styleName: "editable_column",
      editButtonVisibility: "always",
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM-dd",
      },
    },
    {
      fieldName: "REMARK",
      header: { text: t("비고") },
      width: '200',
      dataType: "text",
      styleName: "editable_column",
      editable: true,
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 200,
      }
    },

    //  안보임
    { fieldName: 'YEAR',   dataType: 'text' , visible: false },
    { fieldName: 'MNTH',   dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD',   dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD',   dataType: 'text' , visible: false },
    { fieldName: 'CPN_RCV_NO',   dataType: 'text' , visible: false },
    { fieldName: 'CMPNY_DIV',   dataType: 'text' , visible: false },
  ],
  columns: [],
  columnLayout: [
    "BSNS_NM",  
    "DEPT_NM", 
    "CPN_REG_CNT",  
    "CPN_RCV_NAME", 
    "CPN_REG_DT", 
    "REMARK",
  ],
})

grdProps2.columns = grdProps2.fields



/* ---------- 행 삭제 ---------- */
const deleteData = () => {

let delParams = []
let checkedRows = grdMain2.value.getGridView().getCheckedRows(true)

for (let rowIdx of checkedRows) {
  let data = grdMain2.value.getDataProvider().getJsonRow(rowIdx)
  delParams.push(data)
}
commonExecuteApi({ 
  queryId : 'EDUDC0010_delete01', 
  list: delParams 
}).then(res => {
  for (let i of res.list) {
    if (i.RES_COD == '-100'){Message.warn(t(i.RES_MSG))}
    else {Message.success(t("삭제되었습니다."))}
  }     
  onButtonsClick({ id :'btnSearch' })
})
}

/* ---------- 행 추가 ---------- */



const addRow = e => {
  // const rowIdx = grdMain2.value.getGridView().getCurrent().dataRow
  // console.log('rowIdx?', rowIdx)
  // /* ********** 포커스가 있을시 인원조회 팝업 호출 ************* */
  // if(rowIdx === -1){
  //   Message.err(t('포커스된 데이터가 없습니다.'))

  //   return
  // }
  // else {


  // }
  // const focusData = grdMain2.value.getDataProvider().getJsonRow(rowIdx)
  // console.log('focusData?', focusData)
  // // 추가시 필터중인 컬럼 클리어
  // grdProps2.fields.forEach(async item => {
  //   await grdMain2.value.getGridView().clearColumnFilters(item.fieldName)
  // })

  // /* ********** ADMIN만 전체 사업부, 부서 수정가능, 이외는 접속자의 부서/협력사만 가능 ************* */
  // if(!userStore.authGrpCd[0] === 'HIWAYGRP00001' && ( searchParams2.CMPNY_DIV !== focusData.CMPNY_DIV ||
  //     searchParams2.BSNS_CD !== focusData.BSNS_CD || searchParams2.ASGN_CD !== focusData.ASGN_CD )){
  //   Message.err(t('접속자의 부서/협력사 정보만 저장/삭제 할 수 있습니다.'))
  // }

  let popupParam = {
    // CMPNY_DIV : focusData.CMPNY_DIV,
    // BSNS_CD : focusData.BSNS_CD,
    // DEPT_CD : focusData.DEPT_CD,
    CMPNY_DIV : 'HHI',
    BSNS_CD : '',
    DEPT_CD : '',
    EMP_NO : '',
    EMP_NM : '',
  }
  console.log('popupParam?', popupParam)
  empPopup.value.openPopup(popupParam)
}

// 인원 조회 팝업 선택
const onEmpSelected = val => {
  if(!val){
    return
  }


  let rowIdx = grdMain2.value.getGridView().getCurrent().dataRow
  // let focusData = grdMain2.value.getDataProvider().getJsonRow(rowIdx)
  let addRowData = {
      CMPNY_DIV: val.CMPNY_DIV,
      BSNS_CD: val.BSNS_CD,
      BSNS_NM: val.BSNS_NM,
      DEPT_CD: val.DEPT_CD,
      DEPT_NM: val.DEPT_NM,
      CPN_REG_CNT: null,
      CPN_RCV_NAME: val.EMP_NM,  
      CPN_RCV_NO: val.EMP_NO,
      REMARK: null,
      CPN_REG_DT: today,
      YEAR: searchParams2.YEAR,
      MNTH: searchParams2.MNTH
    }

  // if(focusData.ASGN_CD === null){
  //   addRowData = {
  //     CMPNY_DIV: val.CMPNY_DIV,
  //     BSNS_CD: val.BSNS_CD,
  //     BSNS_NM: val.BSNS_NM,
  //     DEPT_CD: val.DEPT_CD,
  //     DEPT_NM: val.DEPT_NM,
  //     CPN_REG_CNT: null,
  //     CPN_RCV_NAME: val.EMP_NM,  
  //     CPN_RCV_NO: val.EMP_NO,
  //     REMARK: null,
  //     CPN_REG_DT: today,
  //     YEAR: searchParams2.YEAR,
  //     MNTH: searchParams2.MNTH
  //   }
  // } else {
  //   addRowData = {
  //     CMPNY_DIV: searchParams2.CMPNY_DIV,
  //     BSNS_CD: focusData.BSNS_CD,
  //     BSNS_NM: focusData.BSNS_NM,
  //     DEPT_CD: focusData.DEPT_CD,
  //     DEPT_NM: focusData.DEPT_NM,
  //     CPN_REG_CNT: null,
  //     CPN_RCV_NAME: val.EMP_NM,  
  //     CPN_RCV_NO: val.EMP_NO,
  //     REMARK: null,
  //     CPN_REG_DT: today,
  //     YEAR: searchParams2.YEAR,
  //     MNTH: searchParams2.MNTH
  //   }
  // }
  grdMain2.value.addRow(addRowData)
}



//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■





//  팝업
const openPopup = (gbn) => {
  if (gbn === "부서조회") {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: "Y",
      ASGN_NM: searchParams1.ASGN_NM,
    })
  }
}

const onDeptSelected = (val) => {
  searchParams1.BSNS_CD = val.BSNS_CD
  searchParams1.DEPT_CD = val.DEPT_CD
  searchParams1.ASGN_NM = val.ASGN_FULL_NM
}

watch(
  () => searchParams1.ASGN_NM,
  (newValue) => {
    if (newValue === "") {
      searchParams1.BSNS_CD = ""
      searchParams1.DEPT_CD = ""
    }
  }
)



const validationCheck01 = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      return true
    }
  }
}

const validationCheck02 = () => {
  let checkedRows = grdMain2.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    for (let rowIdx of checkedRows) {
      let data = grdMain2.value.getDataProvider().getJsonRow(rowIdx)
      if (data.CPN_REG_CNT === null) return false

    }
  }
  return true
}



const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    if(tab.value ==='Department'){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchData01)
        .setAfter(afterSearch01)
        .showMessage(showMessageYN)
        .run()
    }
    else if(tab.value ==='Person'){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain2])
        .setQuery(searchData02)
        .setAfter(afterSearch02)
        .showMessage(showMessageYN)
        .run()
    }
    showMessageYN = true
  }
  else if (btn.id === 'btnUpdate') { // 저장
    if(tab.value === 'Department'){
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid:grdMain, row: null }])
        .setGridList([grdMain])
        .setBefore(validationCheck01)
        .setQuery(saveData01)
        .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
        .run()
    }
    else if(tab.value === 'Person'){
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid:grdMain2, row: null }])
        .setGridList([grdMain2])
        .setBefore(validationCheck02)
        .setQuery(saveData02)
        .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
        .run()
    } 
  }  
    else if (btn.id === 'btnCreate') { // 추가
      addRow()
    } 
    
    else if (btn.id === 'btnDelete') {  // 삭제
      if(validationCheck02()){
        deleteData()
      }
      showMessageYN = false
    // new deleteFlowHelper(vm, t)
    //   .setTargetGridRow([{ grid:grdMain2, row: 'check' }])
    //   .setGridList([grdMain2])
    //   .setQuery(deleteData)
    //   .setAfter(() => { onButtonsClick({ id :'btnSearch' }) } )
    //   .run()
  }

    else if (btn.id === 'btnCopy') { // 전월복사

      saveCopy()
      showMessageYN = false
    }
}



const saveCopy = async() => {

  let saveList = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YEAR : searchParams2.YEAR,
    MNTH : searchParams2.MNTH,
    USER_ID : userStore.userId,
  }

  let ck = ''
  ck = await vm.$swal({ 
  title: t(searchParams2.YEAR + '년 ' + searchParams2.MNTH+ '월의 ' + '직전 달 데이터를 복사하시겠습니까?'), 
  showCancelButton: true,
  })
  if(ck.isConfirmed === true){
    commonExecuteApi({ 
      queryId : 'EDUDC0010_save03', 
      list:  [saveList] 
    }).then(res => {
      console.log(res)
      for (let i of res.list) {
        if (i.RES_COD == '-100'){Message.warn(t(i.RES_MSG))}
        else if(i.RES_COD == '-1489'){Message.warn(t("이미 지급된 쿠폰이 있어 복사가 불가능합니다."))} // 지급된 쿠폰이 너무 많을때 -1489 에러
        else {Message.success(t("복사되었습니다."))}
      }
      onButtonsClick({ id :'btnSearch' })
    })

  }
}




const validationChk = async () => {
  return true
}

//탭변경 이벤트
const selectedChanged = tab => {
  
  if(tab === 'Department'){

  }  
  else{    
    let btnItems = gridTitle.value.getButtonItems()
    btnItems[0].text = '전 월 복사'
  }  
}

watch(() => tab.value , (newValue, oldValue) => {
  onButtonsClick({ id: 'btnSearch' })
})


onMounted(
  onButtonsClick({ id :'btnSearch' })
)

</script>

//
<template>
  <v-card class="pa-3 fill-height">
    <IMenuTitle
      ref="menuTitle"
      :title="$t(useLogsStore().menuId)"
    />
    <v-tabs class="mb-2" v-model="tab" @click="selectedChanged(tab)">
      <v-tab value="Department"> 부서 </v-tab>
      <v-tab value="Person"> 개인 </v-tab>
    </v-tabs>
    <v-window v-model="tab" class="h-window">
    <!-- 부서 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ -->
      <v-window-item value="Department">
        <v-card-title class="pa-0">
          <IMenuTitle
            ref="menuTitle"
            :button-list="['btnSearch', 'btnUpdate']"
            @click-button="onButtonsClick"
          />
        </v-card-title>
        <v-card-text class="pa-0 content-area">
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('회사구분')"
              labelWidth="52px"
              width="250px"
              v-model='cmpnyDivText'
              readonly
            />   
            <i-input
              :label="$t('배부 기준월')"
              labelWidth="70px"
              width="250px"
              v-model="searchParams1.TODAY"
              type="month"
              required
            />
          </v-sheet>
          <v-sheet>
            <IGridTitle title="안전칭찬쿠폰 배부(부서)" >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 550px"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              :column-layout="grdProps1.columnLayout"
            />
          </v-sheet>
        </v-card-text>
      </v-window-item>
<!-- 개인 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ -->
      <v-window-item value="Person">
        <v-card-title  class="pa-0">
          <IMenuTitle
            ref="menuTitle"
            :button-list="['btnSearch', 'btnUpdate', 'btnCreate','btnDelete']"
            @click-button="onButtonsClick"
          />
        </v-card-title>
        <v-card-text class="pa-0 content-area">
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('회사구분')"
              labelWidth="52px"
              width="250px"
              v-model='cmpnyDivText'
              readonly
            />    
            <i-input
              :label="$t('배부 기준월')"
              labelWidth="70px"
              width="250px"
              v-model="searchParams2.TODAY"
              type="month"
              required
            />
          </v-sheet>
          <v-sheet>
            <IGridTitle 
              ref="gridTitle"
              title="안전칭찬쿠폰 배부(개인)" 
              :button-list="['btnCopy']"
              @click-button="onButtonsClick">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain2"
              class="mt-2"
              style="height: 550px"
              :grid-view-option="grdProps2.gridViewOption"
              :keys="grdProps2.keys"
              :fields="grdProps2.fields"
              :columns="grdProps2.columns"
              :column-layout="grdProps2.columnLayout"
            />
          </v-sheet>
        </v-card-text>
      </v-window-item>
    </v-window>
  </v-card>


    <!-- 인원조회팝업 -->
    <EmpPopup 
      ref="empPopup" 
      @selected="onEmpSelected"
    />
</template>
