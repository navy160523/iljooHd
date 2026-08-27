<!-- 
  화면명 : MSDS 교육대상 자재관리
  화면개요 : MSDS 교육대상 자재관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import PdfView from '@/pages/99_indexPopUp/PdfViewPopup.vue'
import HLTDA0030Popup01 from '@/pages/100_health/HLT_D/HLTDA0030Popup01.vue'
import HLTDA0030Popup02 from '@/pages/100_health/HLT_D/HLTDA0030Popup02.vue'
import EDUPopup from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01.vue'
import EDUEVALPopup from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import HLTDA0050Popup01 from '@/pages/100_health/HLT_D/HLTDA0050Popup01.vue'

defineOptions({
  name:'100_health-HLT_D-HLTDA0030', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const pdfPopup = ref(null)
const hltda0030Popup01 = ref(null)
const hltda0030Popup02 = ref(null)
const eduPopup = ref(null)
const eduEvalPopup = ref(null)
const selectRow = ref(null)
const hltda0050Popup01 = ref(null) // 유해성 평가 결과

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  SAUPBU: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  STATUS: '',
  CHK_NEW_DATE: 'N',
  TMP_FRDATE: dayjs().format('YYYY-MM-01'),
  TMP_TODATE: dayjs().format('YYYY-MM-DD'),
})

const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  GRD_DEPT_CD: [],
  STATUS: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '교육대기' },
    { COD: 'B', TXT: '교육완료' },
    { COD: 'C', TXT: '대상제외' },
  ]
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // 화학물질관리자 : HLTD001, 보건총괄: GRP00372, HSE추진자: GRP00392
  if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTD001') || 
    userStore.authGrpCd.includes('GRP00372') || userStore.authGrpCd.includes('GRP00392')) isAdmin.value = true 

  onButtonsClick({ id: 'btnSearch' })  

  Promise.all([
    // 회사구분 
    getCodeList('HHIZ000'), 
    // 사업부
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV } }), // 부서
    commonSearchApi({ queryId : 'HLTDA0030_SEARCH_DEPT', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.SAUPBU, USE_DIV:'Y' } }), // 부서
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.SAUPBU, USE_DIV:'Y' } }), // 부서
  ]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.GRD_DEPT_CD = res[2].ORESULT_CUR
    codeList.DEPT_CD = res[3].ORESULT_CUR


    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: ''})
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})

    grdMain.value.setBindingColumn('DEPT_CD', codeList.GRD_DEPT_CD, 'DEPT_CD', 'DEPT_NM')
    grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
  })
  
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_CD', width: '150', dataType: 'text', editable: false, styleName: 'left-column', header: { text: t('부서명') }, lookupDisplay: true, },
    { fieldName: 'MATNO', width: '150', dataType: 'text', editable: false, header: { text: t('자재번호') } },
    { fieldName: 'MATDSC', width: '200', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('제품명') } },
    { fieldName: 'MSDS_NM', width: '200', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('MSDS명') } },
    { fieldName: 'TYPE_ID', width: '100', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('TYPE') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var btnColor = '#1a40c7'
          if(isEmpty(grid.getValue(cell.index.itemIndex, 'MSDS_FILEID'))) {
            btnColor = '#FF0000'
          }
          var str = 
          `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <button 
              class="v-btn" 
              style="color: #fff; background: ${btnColor}; padding: 4px;"
            >MSDS</button>
          </div>`;
          return str;
        },
      },
    },
    { fieldName: 'VNDNME', width: '150', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('납품사') } },
    { fieldName: 'NEW_DATE',  width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('발생일자') } },
    { fieldName: 'VAL_RESULT',  width: '120', editable: false, dataType: 'text', header: { text: t('유해성 평가 결과') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <button 
              class="v-btn" 
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >상세</button>
          </div>`;
          return str;
        },
      },
    },
    { fieldName: 'REG_SCH',  width: '120', editable: false, dataType: 'text', header: { text: t('일정') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <button 
              class="v-btn" 
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >일정등록</button>
          </div>`;
          return str;
        },
      },
    },
    { fieldName: 'REG_REAL',  width: '70', editable: false, dataType: 'text', header: { text: t('실적') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<div>
            <button 
              class="v-btn" 
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >실적등록</button>
          </div>`;
          return str;
        },
      },
    },
    { fieldName: 'STATUS',  width: '100', editable: false, dataType: 'text', header: { text: t('진행상태') }, lookupDisplay: true },
    { fieldName: 'DEL_REASON',  width: '200', editable: false, dataType: 'text', header: { text: t('제외사유') } },
    { fieldName: 'DEL_USER_NM',  width: '100', editable: false, dataType: 'text', header: { text: t('제외자') } },
    { fieldName: 'DEL_DATE',  width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('제외일자') } },
    { fieldName: 'REMARK',  width: '250', editable: false, dataType: 'text', header: { text: t('비고') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('해당년도') },visible: false, },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('현황순번') },visible: false, },
    { fieldName: 'SAUPBU', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사코드') },visible: false, },
    { fieldName: 'MSDS_FILEID', dataType: 'text', header: { text: t('MSDS파일') }, visible: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('변경ID') },visible: false, },
  ],
  columnLayout: [
    'DEPT_CD',
    'MATNO',
    'MATDSC',
    'MSDS_NM',
    'TYPE_ID',
    'VNDNME',
    'NEW_DATE',
    'VAL_RESULT',
    {
      name: 'MSDS교육',
      direction: 'horizontal',
      items: [ 'REG_SCH', 'REG_REAL' ],
      header: { text: t('MSDS교육') },
    },
    'STATUS',
    'DEL_REASON',
    'DEL_USER_NM',
    'DEL_DATE',
    'REMARK'
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력
// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }

  if (btn.id === 'btnSearch') {
    searchParams.FILTER = ''
    getData()
  } else if (btn.id === 'btnShift') {
    // check 항목이 없을 시 return
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    let popupParam = []
    if(isEmpty(checkedRows)) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    }
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      popupParam.push(data)
    }
    hltda0030Popup01.value.openPopup(popupParam)
  } else if (btn.id === 'btnExclusionQu') {
    // check 항목이 없을 시 return
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    let popupParam = []
    if(isEmpty(checkedRows)) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    }
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      popupParam.push(data)
    }
    hltda0030Popup02.value.openPopup(popupParam)
  } else if (btn.id === 'btnUnexclude') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setConfirmMessage(t('제외 취소 하시겠습니까?'))
      .setBefore(beforeDelCancel)
      .setQuery(delCancelData)
      .setAfter(afterDelCancelData)
      .run()

  } else if (btn.id === 'btnMSDSEduGuide') {
    pdfPopup.value.openPopupUrl('https://hises.hd.com/HiSEsFiles/Excel/IA/IA1140C01.pdf')
  } else if (btn.id === 'btnSystemUseGuide') {
    pdfPopup.value.openPopupUrl('https://hises.hd.com/HiSEsFiles/Excel/IA/IA1140C02.pdf')
  } else if (btn.id === 'btnRegisterEduDate') {
    // check 항목이 없을 시 return
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    let popupParam = {
      DIVISION: 'A',
      CURR_ID: 'C140',
      EDU_CONTENT: '[물질안전보건교육]\n' + 
        '1. 대상 화학물질의 명칭(또는 제품명)\n' +
        '2. 물리적 위험성 및 건강 유해성\n' +
        '3. 취급 시 주의사항\n'  +
        '4. 적정한 보호구\n' +
        '5. 응급조치 요령 및 사고시 대처방법\n' +
        '6. 물질안전보건자료 및 경고표지를 이해하는 방법\n' +
        '[교육 진행 제품 LIST]',
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: dayjs().get('year'),
      SCHEDULE_ID: '',
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD
    }
    if(isEmpty(checkedRows)) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    }

    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      if(data.REG_SCH == 'Y') {
        return Message.warn(t('교육일정이 존재 하는 데이터가 있습니다.'))
      }
    }

    eduPopup.value.openPopup(popupParam)
  }
}
const getData = () => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }
  
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  searchParams.FRDATE = dayjs(searchParams.TMP_FRDATE).format('YYYYMMDD')
  searchParams.TODATE = dayjs(searchParams.TMP_TODATE).format('YYYYMMDD')
  return commonSearchApi({ queryId: 'HLTDA0030_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장 전
const beforeDelCancel = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }
  return true
}

const delCancelData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.STATUS === 'C') {
      saveParams.push(data)
    }
  }
  return commonExecuteApi({ queryId : 'HLTDA0030_SAVE_02', list: saveParams })
}

const afterDelCancelData = () => {
  getData() 
  Message.success(t('성공적으로 제외취소되었습니다'))
}

//팝업 선택 이벤트
const onDeptSelected = val => {  
  searchParams.SAUPBU = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
  getData()
}

const openDeptcdPopup = () => {
  if(!isAdmin.value) return
  // 화학물질관리자가 아니고 보건총괄도 아니고 hse추진자면 return
  if(!(useLogsStore().isMenuAdmin === 'Y') && !userStore.authGrpCd.includes('HLTD001') && 
    !userStore.authGrpCd.includes('GRP00372') && userStore.authGrpCd.includes('GRP00392')) return
  deptPopup.value.openPopup({ CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.SAUPBU, HSE_ONLY : 'Y', ASGN_NM : searchParams.DEPT_NM })
}

const clearDeptcd = () => {
  if(!isAdmin.value) return
  // 화학물질관리자가 아니고 보건총괄도 아니고 hse추진자면 return
  if(!(useLogsStore().isMenuAdmin === 'Y') && !userStore.authGrpCd.includes('HLTD001') && 
    !userStore.authGrpCd.includes('GRP00372') && userStore.authGrpCd.includes('GRP00392')) return
  searchParams.DEPT_CD = ''
  searchParams.DEPT_NM = ''
}

// MSDS 교육대상 자재관리 저장
const saveMatManage = (data) => {

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let saveParams = []

  for (let rowIdx of checkedRows) {
    let sData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let param = {
      CMPNY_DIV: data.CMPNY_DIV,
      DEPT_CD: sData.DEPT_CD,
      VNDCOD: sData.VNDCOD,
      SAUPBU: sData.SAUPBU,
      MATNO: sData.MATNO,
      YEAR: data.YEAR,
      SCHEDULE_ID: data.SCHEDULE_ID,
      USER_ID: data.USER_ID
    }
    saveParams.push(param)
  }

  commonExecuteApi({ queryId : 'HLTDA0030_SAVE_01', list: saveParams }).then(res => {
    Message.success(t('교육일정이 등록되었습니다.'))
  })
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  // PDF 뷰어 ON
  if (col.target.className === 'v-btn' && col.column === 'TYPE_ID') {
    if(isEmpty(data.MSDS_FILEID)) {
      return Message.err(t('해당 자재 및 TYPE에는 첨부파일이 없습니다.'))
    }
    pdfPopup.value.openMSDSPopup(data, 'HLTDA0020_SEARCH_08')
  } else if (col.target.className === 'v-btn' && col.column === 'VAL_RESULT') {
    hltda0050Popup01.value.openPopup(data)
  } else if (col.target.className === 'v-btn' && col.column === 'REG_SCH') {
    let popupParam = {
      DIVISION: 'A',
      CURR_ID: 'C140',
      EDU_CONTENT: '[물질안전보건교육]\n' + 
        '1. 대상 화학물질의 명칭(또는 제품명)\n' +
        '2. 물리적 위험성 및 건강 유해성\n' +
        '3. 취급 시 주의사항\n'  +
        '4. 적정한 보호구\n' +
        '5. 응급조치 요령 및 사고시 대처방법\n' +
        '6. 물질안전보건자료 및 경고표지를 이해하는 방법\n' +
        '[교육 진행 제품 LIST]',
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: isEmpty(data.YEAR)? dayjs().get('year') : data.YEAR,
      SCHEDULE_ID: isEmpty(data.SCHEDULE_ID) ? '' : data.SCHEDULE_ID,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD
    }
    selectRow.value = data
    eduPopup.value.openPopup(popupParam)
  } else if (col.target.className === 'v-btn' && col.column === 'REG_REAL') {
    let popupParam = {
      DIVISION: 'A',
      CURR_ID: 'C140',
      EDU_CONTENT: '[물질안전보건교육]\n' + 
        '1. 대상 화학물질의 명칭(또는 제품명)\n' +
        '2. 물리적 위험성 및 건강 유해성\n' +
        '3. 취급 시 주의사항\n'  +
        '4. 적정한 보호구\n' +
        '5. 응급조치 요령 및 사고시 대처방법\n' +
        '6. 물질안전보건자료 및 경고표지를 이해하는 방법\n' +
        '[교육 진행 제품 LIST]' + data.MATDSC , 
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: isEmpty(data.YEAR)? dayjs().get('year') : data.YEAR,
      SCHEDULE_ID: isEmpty(data.SCHEDULE_ID) ? '' : data.SCHEDULE_ID,
      SAVE_YN: 'N'
    }

    if(data.REG_SCH == 'N') {
      return Message.warn(t('교육일정이 등록된 건만 실적등록이 가능합니다.'))
    }
    eduEvalPopup.value.openPopup(popupParam)
  }
}
watch(() => searchParams.SAUPBU, (newValue, oldValue) => {
  searchParams.DEPT_CD = ''
  if(isEmpty(newValue)) {
    codeList.DEPT_CD = [
      {DEPT_NM: '전체', DEPT_CD: ''}
    ]
    return
  }
  Promise.all([
    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
  })
})

watch(() => searchParams.STATUS, (newValue, oldValue) => {
  getData()
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnShift', 'btnExclusionQu', 'btnUnexclude', 'btnMSDSEduGuide', 'btnSystemUseGuide', 'btnRegisterEduDate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.CMPNY_DIV"
            :label="$t('회사구분')"
            label-width="70px"
            :items="codeList.CMPNY_DIV"
            item-value="COD"
            item-title="TXT" 
            width="220px"
            :readonly="true"
          />
          <i-select
            v-model="searchParams.SAUPBU"
            :label="$t('사업부')"
            label-width="50px"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            width="200px" 
          />
          <i-select
            v-model="searchParams.DEPT_CD"
            :label="$t('부서')"
            label-width="50px"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM" 
            width="200px"
            :readonly="!isAdmin || (!(useLogsStore().isMenuAdmin === 'Y') && !userStore.authGrpCd.includes('HLTD001') &&
              !userStore.authGrpCd.includes('GRP00372') && userStore.authGrpCd.includes('GRP00392')) ||
              isEmpty(searchParams.SAUPBU)"
          />
          <i-select
            v-model="searchParams.STATUS"
            :label="$t('진행상태')"
            label-width="50px"
            :items="codeList.STATUS"
            item-value="COD"
            item-title="TXT"
            width="200px"
          />
          <v-checkbox
            v-model="searchParams.CHK_NEW_DATE"
            :label="$t('발생일자 체크')"
            true-value="Y" 
            false-value="N"
            class="mt-1"
          />
          <i-input
            v-if="searchParams.CHK_NEW_DATE == 'Y'"
            v-model="searchParams.TMP_FRDATE"
            label-width="20px"
            :label="$t('')"
            type="date"
            width="150px"
            class="mr-2 ml-2"
          />
          <i-input
            v-if="searchParams.CHK_NEW_DATE == 'Y'"
            v-model="searchParams.TMP_TODATE"
            label-width="20px"
            :label="$t('~')"
            type="date"
            width="170px"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </div>
      <!-- 팝업존 -->
      <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
      <PdfView ref="pdfPopup"/>
      <HLTDA0030Popup01 ref="hltda0030Popup01" @after-search="getData"/>
      <HLTDA0030Popup02 ref="hltda0030Popup02" @after-search="getData"/>
      <EDUPopup ref="eduPopup" @after-search="getData" @saveSchedule="saveMatManage"/>
      <EDUEVALPopup ref="eduEvalPopup" />
      <HLTDA0050Popup01 ref="hltda0050Popup01" />
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>