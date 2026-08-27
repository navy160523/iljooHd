<!-- 
  * Vue 내 용 : 평가지 관리
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
import { useRouter }    from 'vue-router'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'

import OPRAH0030Popup01 from "./OPRAH0030Popup01.vue"
import OPRAH0030Popup02 from "./OPRAH0030Popup02.vue"
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import { isEmpty } from "@/@core/utils"

defineOptions({
  name:'80_operation-OPR_A-OPRAH0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const router = useRouter()

const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub1 = ref(null)
const grdSub2 = ref(null)
const oPRAH0030Popup01 = ref(null)
const oPRAH0030Popup02 = ref(null)

// 메인 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,

  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  YEAR: dayjs().get("year"),
  TITLE : '',
  KIND : '',
  DIVISION : '',
  USE_YN : 'Y',
})

// 서브 그리드 조회조건
const searchSubParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EVAL_DIV: '',
  EVAL_ID: '',
  QSTN_CATEGORY : '',
})

const mainParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,

  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  ASGN_CD: true? userStore.deptCd : userStore.asgnCd,
  YEAR: dayjs().get("year"),
  TITLE : '',
  EVAL_DESC : '',
  KIND : null,
  DIVISION : null,
  USE_YN : 'Y',
  EVAL_ID : '',
  SAVE_GBN : '',
  MODIFY_YN : 'N',
})

//코드리스트
const codeList = reactive({
  DIVISION : [],
  KIND : [],
  QSTN_CATEGORY : [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    edit: { editable: false },
  },
  keys : ['YEAR','EVAL_ID','CMPNY_DIV'],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', width: '100', header: { text: t('사업부명') }  },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '100', header: { text: t('부서명') }  },
    { fieldName: 'DIVISION_NM', dataType: 'text', width: '100', header: { text: t('평가지 구분') }  },
    
    // { fieldName: 'KIND_NM', dataType: 'text', width: '100', header: { text: t('평가지 종류') } },
    { 
      fieldName: 'TITLE',
      dataType: 'text', 
      width: '150',
      styleName: "left-column",
      header: { text: t('평가지 제목') },
    },
    { 
      fieldName: 'EVAL_DESC', 
      dataType: 'text', 
      width: '400', 
      styleName: "left-column",
      header: { text: t('평가지 설명') },
    },
    { fieldName: 'KOR_NM', dataType: 'text', width: '70', header: { text: t('최종작성자') } },
    { fieldName: 'USE_YN_NM', dataType: 'text', width: '70', type: 'data', header: { text: t('평가지') } },
    
    // 출력 안함
    { fieldName: 'YEAR', dataType: 'text' , visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'EVAL_ID', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text' , visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible: false },
    { fieldName: 'KIND', dataType: 'text' , visible: false },
    { fieldName: 'DIVISION', dataType: 'text' , visible: false },
    { fieldName: 'MODIFY_YN', dataType: 'text' , visible: false },
    { fieldName: 'USE_YN', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSub1Props = reactive({
  gridViewOption : { 
    stateBar: { visible: false }, 
    checkBar: { visible: true }, 
    edit: { editable: false },
  },
  keys : ['CMPNY_DIV','QSTN_ID'],
  fields : [ 
    { 
      fieldName: 'QSTN_TITLE',
      dataType: 'text',
      width: '300', 
      styleName: "left-column",
      header: { text: t('평가 문항') },
    },
    { 
      fieldName: 'QSTN_TYPE_NM', 
      dataType: 'text',
      width: '100', 
      header: { text: t('문항 유형') },
    },
    { 
      fieldName: 'QSTN_EXPL_LIST', 
      dataType: 'text',
      width: '400',
      styleName: "left-column",
      header: { text: t('보기') },
    },
    { 
      fieldName: 'QSTN_ANSWR_LIST', 
      dataType: 'text',
      width: '200',
      styleName: "left-column",
      header: { text: t('정답') },
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_ID', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_TYPE', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdSub1Props.columns = grdSub1Props.fields

//그리드 속성셋팅
const grdSub2Props = reactive({
  gridViewOption : { 
    stateBar: { visible: false }, 
    checkBar: { visible: true },
    edit: { editable: false },
  },
  keys : ['CMPNY_DIV','QSTN_ID'],
  fields : [ 
    { 
      fieldName: 'QSTN_TITLE',
      dataType: 'text', 
      width: '300', 
      styleName: "left-column",
      header: { text: t('평가 문항') },
    },
    { 
      fieldName: 'QSTN_TYPE_NM', 
      dataType: 'text', 
      width: '100', 
      header: { text: t('문항 유형') },
    },
    { 
      fieldName: 'SEQ', 
      dataType: 'text',
      editable: false,
      width: '70',
      header: { text: t('순서') },
    },
    { 
      fieldName: 'QSTN_EXPL_LIST', 
      dataType: 'text', 
      width: '400',
      styleName: "left-column",
      header: { text: t('보기') },
    },
    { 
      fieldName: 'QSTN_ANSWR_LIST', 
      dataType: 'text', 
      width: '200',
      styleName: "left-column",
      header: { text: t('정답') },
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'PRV_EVAL_ID', dataType: 'text' , visible: false },
    { fieldName: 'EVAL_ID', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_ID', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_TYPE', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdSub2Props.columns = grdSub2Props.fields

onMounted(() => {
  
  console.log('onMounted')
  
  vm.$nextTick(() => {
    initCombo()
  })  
})

//콤보박스 셋팅
const initCombo = () => {

  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'ZE10'), //평가지 구분
  ]).then(res => {
    codeList.DIVISION = res[0].ORESULT_CUR
    searchParams.DIVISION = 'A'
  })
} 

watch(() => searchParams.DIVISION, (newValue, oldValue) => {
  resetCodeDivision(newValue)
})

const resetCodeDivision = val =>{
  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'ZE20'), //카테고리
  ]).then(res => {
    codeList.QSTN_CATEGORY = res[0].ORESULT_CUR.filter(data => data.CODE_DESC1 === val)
    searchSubParams.QSTN_CATEGORY = 'A'
    onButtonsClick({ id :'btnSearch' })
    onSubButtonsClick({ id :'btnSearch' })
    onButtonsClick({ id :'btnSearchSub2' })
  })
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {

    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataGrdMain)
      .setAfter(afterSearchGrdMain)
      .run()
  } 
  else if (btn.id === 'btnCreate') {

    oPRAH0030Popup01.value.openPopup({
      CMPNY_DIV: mainParams.CMPNY_DIV,
      BSNS_CD: mainParams.BSNS_CD,
      DEPT_CD: mainParams.DEPT_CD,
      ASGN_CD: mainParams.ASGN_CD,
      YEAR:  mainParams.YEAR,    
      TITLE : '',
      EVAL_DESC : '',
      KIND : '',
      DIVISION : 'A',
      USE_YN : 'Y',
      FILE_ID : '',
      EVAL_ID : '',
      SAVE_GBN : 'NEW',
    })
  } 
  else if (btn.id === 'btnUpdate') {

    if (isEmpty(mainParams.EVAL_ID)) {
      return Message.err("수정할 평가지 항목을 선택해 주세요.")
    }

    if (mainParams.MODIFY_YN === 'N') {
      return Message.err("평가 답변된 평가지는 수정할 수 없습니다.")
    }

    oPRAH0030Popup01.value.openPopup({ 
      CMPNY_DIV: mainParams.CMPNY_DIV,
      BSNS_CD: mainParams.BSNS_CD,
      DEPT_CD: mainParams.DEPT_CD,
      ASGN_CD: mainParams.ASGN_CD,
      YEAR:  mainParams.YEAR,   
      TITLE : mainParams.TITLE,
      EVAL_DESC : mainParams.EVAL_DESC,
      KIND : mainParams.KIND,
      DIVISION : mainParams.DIVISION,
      USE_YN : mainParams.USE_YN,
      EVAL_ID : mainParams.EVAL_ID,
      SAVE_GBN : 'UPDATE',
    })

  }
  else if (btn.id === 'btnCopy') {

    new saveFlowHelper(vm, t)
      .setBefore(beforeCopyData)
      .setQuery(copyData)
      .setConfirmMessage('복사 하시겠습니까?')
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' })
        onSubButtonsClick({ id :'btnSearch' })
        onButtonsClick({ id :'btnSearchSub2' }) 
      })
      .run()
  }
  else if (btn.id === 'btnPreview') {
    if (grdMain.value.getDataProvider().rowCount === 0) {
      return Message.err("평가지 목록에 데이터가 없습니다.")
    }

    if (isEmpty(mainParams.EVAL_ID)) {
      return Message.err("평가지를 선택해주세요.")
    }

    oPRAH0030Popup02.value.openPopup({ 
      CMPNY_DIV : mainParams.CMPNY_DIV,
      EVAL_ID : mainParams.EVAL_ID,
      TITLE : mainParams.TITLE,
      EVAL_DESC : mainParams.EVAL_DESC,
    })
  }
  else if (btn.id === 'btnSearchSub2') {

    new queryFlowHelper(vm, t)
      .setGridList([grdSub2])
      .setQuery(searchDataGrdSub2)
      .setAfter(afterSearchGrdSub2)
      .run()
  }
}

// 평가지 목록 조회
const searchDataGrdMain = () =>{
  return commonSearchApi({ queryId : 'OPRAH0030_SEARCH_01', param: searchParams })
}

// 평가지 목록 조회 후 데이터 처리
const afterSearchGrdMain = res =>{
  console.log('afterSearchGrdMain : ', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 선택된 평가지 평가 목록 조회
const searchDataGrdSub2 = () =>{
  return commonSearchApi({ queryId : 'OPRAH0030_SEARCH_03', param: mainParams })
}

// 조회 후 데이터 처리
const afterSearchGrdSub2 = res =>{
  grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
} 

// 평가지 복사전 체크
const beforeCopyData = () =>{
  console.log('Checked before Copy Data...')

  if (grdMain.value.getDataProvider().rowCount === 0) {
    return Message.err("평가지 목록에 데이터가 없습니다.")
  }

  if (isEmpty(mainParams.EVAL_ID)) {
    return Message.err("복사할 평가지를 선택해주세요.")
  }

  return true
} 

// 평가지 복사
const copyData = () =>{
  let copyParams = []

  console.log('Start copy Data....', mainParams)

  copyParams.push({
    CMPNY_DIV: userStore.cmpnyDiv, // 회사 코드
    EVAL_ID: mainParams.EVAL_ID,
    BSNS_CD: userStore.bsnsCd, // 사업부코드
    DEPT_CD: userStore.deptCd, // 부서코드(A:직영일경우)
    ASGN_CD: true? userStore.deptCd : userStore.asgnCd,
    YEAR: dayjs().get("year"), // 년도
    KIND: mainParams.KIND, // 종류
    DIVISION: mainParams.DIVISION, // 구분
    USER_ID: userStore.userId, // 로그인 사용자 정보
    RES_COD: "", // return 값
    RES_MSG: "", // return 값
    RES_COL: "", // return 값
  })

  return commonExecuteApi({
    queryId: "OPRAH0030_SAVE_03", list: copyParams,
  })
}

// 서브 그리드 메뉴버튼
const onSubButtonsClick = async btn => {
  if (btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdSub1])
      .setQuery(searchDataGrdSub1)
      .setAfter(afterSearchGrdSub1)
      .run()
  }
  else if (btn.id === 'btnCreate') {
    router.push('/80_operation/OPR_A/OPRAH0040')
  }
  else if (btn.id === 'btnUseQu') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub1, row: null }])
      .setGridList([grdSub1])
      .setBefore(beforeSaveQue)
      .setQuery(saveDataQue)
      .setConfirmMessage('사용 하시겠습니까?')
      .setAfter(() => { 
        console.log('사용 후........')

        onButtonsClick({ id :'btnSearch' })
        onSubButtonsClick({ id :'btnSearch' })

        // 사용 후 순번 재정렬
        onSearchSubGrid2()
      })
      .run()
  }
  else if (btn.id === 'btnExclusionQu') {

    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub2, row: null }])
      .setGridList([grdSub2])
      .setQuery(deleteSub2Data)
      .setConfirmMessage('제외 하시겠습니까?')
      .setAfter(() => {
        onButtonsClick({ id :'btnSearch' })
        onSubButtonsClick({ id :'btnSearch' })

        // 제외 후 순번 재정렬
        onSearchSubGrid2()
      })
      .run()
  }
  else if (btn.id === 'btnMoveUp') {
    let rowIdx = grdSub2.value.getGridView().getCurrent().dataRow
    let grdData = grdSub2.value.getDataProvider().getJsonRows()

    if(grdData.length > 1 && rowIdx > 0) {
      grdSub2.value.getDataProvider().moveRow(rowIdx-1,rowIdx)
      grdSub2.value.getGridView().setCurrent({ itemIndex: rowIdx-1 })
      grdSub2.value.getGridView().checkAll(true)
    }

    refreshSequence()
  }
  else if (btn.id === 'btnMoveDown') {
    let rowIdx = grdSub2.value.getGridView().getCurrent().dataRow
    let grdData = grdSub2.value.getDataProvider().getJsonRows()

    if(grdData.length > 1 && grdData.length > rowIdx + 1) {
      grdSub2.value.getDataProvider().moveRow(rowIdx+1,rowIdx)
      grdSub2.value.getGridView().setCurrent({ itemIndex: rowIdx+1 })
      grdSub2.value.getGridView().checkAll(true)
    }

    refreshSequence()
  }
  else if (btn.id === 'btnSaveSeq') {

    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub2, row: null }])
      .setGridList([grdSub2])
      .setBefore(beforeSub2Data)
      .setQuery(saveSub2Data)
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' })
        onSubButtonsClick({ id :'btnSearch' })
        onButtonsClick({ id :'btnSearchSub2' }) 
      })
      .run()
  }
}

const onSearchSubGrid2 = () =>{

  Promise.all([
    commonSearchApi({ queryId : 'OPRAH0030_SEARCH_03', param: mainParams }),
  ]).then(res => {
    console.log('[onSearchSubGrid2] 조회 후 : ', res)
    grdSub2.value.getDataProvider().setRows(res[0].ORESULT_CUR)

    vm.$swal({ 
      title: t('순번이 변경되었습니다. 확인 후 저장해주세요.'), 
      showCancelButton: false,
    })

    refreshSequence()
  })
}

const refreshSequence = () =>{
  let grdData = grdSub2.value.getDataProvider().getJsonRows()

  for(let i=0; i <grdData.length;i++){
    grdSub2.value.getDataProvider().setValue(i, 'SEQ', i + 1)
  }
}

// 평가 항목 목록 조회
const searchDataGrdSub1 = () =>{
  searchSubParams.CMPNY_DIV = searchParams.CMPNY_DIV
  searchSubParams.EVAL_DIV = searchParams.DIVISION
  searchSubParams.EVAL_ID = mainParams.EVAL_ID

  return commonSearchApi({ queryId : 'OPRAH0030_SEARCH_02', param: searchSubParams })
}

// 평가 항목 목록 조회 후 데이터 처리
const afterSearchGrdSub1 = res =>{
  console.log('afterSearchGrdSub1 : ', res)
  grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 전체 평가 목록에서 선택 사용 저장 전 체크
const beforeSaveQue = () => {

  if (grdMain.value.getDataProvider().rowCount === 0) {
    return Message.err("평가지 목록에 데이터가 없습니다.")
  }

  let checkedRows = grdSub1.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  if (isEmpty(mainParams.EVAL_ID)) {
    return Message.err("문항을 저장할 평가지를 선택해주세요.")
  }

  return true
}

// 전체 평가 목록에서 선택 사용 저장
const saveDataQue = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdSub1.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdSub1.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,
        EVAL_ID : mainParams.EVAL_ID,   
        QSTN_ID : data.QSTN_ID,
        USER_ID : userStore.userId,   
      },
    )
  }

  console.log('saveData : ', saveParams)

  return commonExecuteApi({ queryId : 'OPRAH0030_SAVE_02', list: saveParams })
}

// 선택된 평가지 문항 목록 제외
const deleteSub2Data = () => {

  let deleteParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdSub2.value.getGridView().getCheckedRows(true) 
  
  if (checkedRows.length === 0) {
    return Message.err("선택된 평가 문항이 없습니다.")
  }
  else {
    for (let rowIdx of checkedRows) {
      let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
      
      deleteParams.push(
        {
          CMPNY_DIV : data.CMPNY_DIV,
          PRV_EVAL_ID : data.PRV_EVAL_ID,
        },
      )
    }

    return commonExecuteApi({ queryId : 'OPRAH0030_DELETE_01', list: deleteParams })
  }
}

// 선택된 평가지 평가 목록 순서 저장 전 체크
const beforeSub2Data = () => {

  if (grdMain.value.getDataProvider().rowCount === 0) {
    return Message.err("평가지 목록에 데이터가 없습니다.")
  }

  if (isEmpty(mainParams.EVAL_ID)) {
    return Message.err("문항을 저장할 평가지를 선택해주세요.")
  }

  return true
}

// 선택된 평가지 평가 목록 순서 저장
const saveSub2Data = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdSub2.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 평가지 문항이 없습니다.")
  }
  else {
    for (let rowIdx of checkedRows) {
      let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
      
      saveParams.push(
        {
          CMPNY_DIV : data.CMPNY_DIV,
          PRV_EVAL_ID : data.PRV_EVAL_ID,
          EVAL_ID : data.EVAL_ID,       
          QSTN_ID : data.QSTN_ID,
          SEQ : data.SEQ,
          USER_ID : userStore.userId,   
          RES_COD : '',               // return 값
          RES_MSG : '',               // return 값
          RES_COL : '',               // return 값
        },
      )
    }

    console.log('saveData4 : ', saveParams)

    return commonExecuteApi({ queryId : 'OPRAH0030_SAVE_04', list: saveParams })
  }
}

// 목록에서 평가지 선택
const onCellClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  mainParams.CMPNY_DIV = row.CMPNY_DIV
  mainParams.BSNS_CD = row.BSNS_CD
  mainParams.DEPT_CD = row.DEPT_CD
  mainParams.ASGN_CD = row.ASGN_CD
  mainParams.YEAR = row.YEAR
  mainParams.TITLE = row.TITLE
  mainParams.EVAL_DESC = row.EVAL_DESC
  mainParams.KIND = row.KIND
  mainParams.DIVISION = row.DIVISION
  mainParams.USE_YN = row.USE_YN
  mainParams.EVAL_ID = row.EVAL_ID
  mainParams.MODIFY_YN = row.MODIFY_YN

  onButtonsClick({ id :'btnSearchSub2' })
  onSubButtonsClick({ id :'btnSearch' })
}

// 팝업에서 저장 종료 후 재조회
const afterSaveData = () => {
  console.log("저장 후 >>>>>>")
  onButtonsClick({ id: "btnSearch" })
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnCopy', 'btnPreview']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.YEAR"
            :label="$t('년도')"
            label-width="50px"
            type="Number"
            width="200px"
            required
          />
          <i-select
            v-model="searchParams.DIVISION" 
            :label="$t('평가지구분')"
            label-width="100px"
            append-inner-icon="mdi-magnify"
            :items="codeList.DIVISION"
            item-value="COD"
            item-title="TXT"
            width="300px"
            required
          />
          <i-input
            v-model="searchParams.TITLE" 
            :label="$t('평가지 제목 검색')"
            label-width="100px"
          />
          <VCheckbox
            v-model="searchParams.USE_YN"
            :label="$t('평가지 사용 여부')"
          />
        </v-sheet>
        <v-sheet 
          class="mb-3" 
          height="40%"
        >
          <!-- 메인그리드 -->
          <IGridTitle :title="$t('평가지 목록')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @on-cell-clicked="onCellClicked"
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet 
            width="50%" 
            class="pa-0 h-auto pe-2"
          >
            <!-- 서브그리드1 -->
            <IGridTitle
              :title="$t('전체 평가 목록')"
              :button-list="['btnSearch', 'btnCreate', 'btnUseQu']"
              @click-button="onSubButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <div class="content mb-1">
              <VForm
                ref="searchArea"
                class="searchArea d-flex"
              >
                <i-select
                  v-model="searchSubParams.QSTN_CATEGORY"
                  :label="$t('카테고리')"
                  label-width="100px"
                  append-inner-icon="mdi-magnify"
                  :items="codeList.QSTN_CATEGORY"
                  item-value="COD"
                  item-title="TXT"
                  width="300px"
                />
              </VForm>
            </div>
            <RealGrid
              ref="grdSub1"
              :grid-view-option="grdSub1Props.gridViewOption"
              :keys="grdSub1Props.keys" 
              :fields="grdSub1Props.fields"
              :columns="grdSub1Props.columns"
              :column-layout="grdSub1Props.columnLayout"
            />
          </v-sheet>
          <v-sheet 
            width="50%" 
            class="pa-0 h-auto"
          >
            <!-- 서브그리드2 --> 
            <IGridTitle
              :title="$t('선택된 평가지 평가 목록')"
              :button-list="['btnMoveUp', 'btnMoveDown', 'btnSaveSeq', 'btnExclusionQu']"
              @click-button="onSubButtonsClick"
            />
            <RealGrid
              ref="grdSub2"
              :grid-view-option="grdSub2Props.gridViewOption"
              :keys="grdSub2Props.keys" 
              :fields="grdSub2Props.fields"
              :columns="grdSub2Props.columns"
              :column-layout="grdSub2Props.columnLayout"
            />
          </v-sheet>
        </div>
        <!-- 평가지 등록/수정 팝업 -->
        <OPRAH0030Popup01 
          ref="oPRAH0030Popup01" 
          @closed="afterSaveData"
        />
        <!-- 평가지 미리보기 팝업 -->
        <OPRAH0030Popup02 ref="oPRAH0030Popup02" />
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