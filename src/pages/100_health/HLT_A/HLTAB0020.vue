<!-- HLTAB0020 작업환경개선계획 관리 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' //결재
import HLTAB0020Popup01 from '@/pages/100_health/HLT_A/HLTAB0020Popup01.vue'

defineOptions({
  name: '100_health-HLT_A-HLTAB0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)
const WeiEmpPopup = ref(null)
const selectedRow = ref(0)
const selectedData = ref('')
const appPopup =ref('')

const appData = reactive({})
const popup01 = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,          //사업부
  DEPT_CD: userStore.deptCd,          //부서
  ASGN_CD: (userStore.userDiv === 'A' || userStore.deptCd === userStore.asgnCd) ? '' : userStore.asgnCd, // 협력사
  YEAR: String(dayjs().get('year')),  // 기준년도
  EVA_DIV: '',                        //평가구분
})

// 코드리스트
const codeList = reactive({
  evaDiv: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' }
  ],
  EST_STEP: [
    {COD:'1',TXT:'1단계[매우 낮음]'},
    {COD:'2',TXT:'2단계[낮음]'},
    {COD:'3',TXT:'3단계[보통]'},
    {COD:'4',TXT:'4단계[높음]'},
    {COD:'5',TXT:'5단계[매우 높음]'},
  ],
  BSNS_CD: [],
  DEPT_CD: [],
  COMBO_DEPT_CD: [],
  ASGN_CD: [],
  COMBO_ASGN_CD: [],
  APP_STATUS: [
    { COD: '', TXT: '검토대기' },
    { COD: 'A', TXT: '계획수립' },
    { COD: 'B', TXT: '결재중' },
    { COD: 'Y', TXT: '결재완료' },
  ],
})

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

const initCodeList = () => {
  Promise.all([
    // 사업부
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    // 부서
    commonSearchApi({
      queryId: 'HLTAB0010_SEARCH_ASGN',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    }),

    getCodeList('HHIZ030')
  ]).then((res) => { 
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'A')
    codeList.ASGN_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'B')
    codeList.ASGN_CD.unshift({ ASGN_NM: '직영', ASGN_CD: '' })

    codeList.COMBO_DEPT_CD = codeList.DEPT_CD.filter(item => item.BSNS_CD == searchParams.BSNS_CD)
    codeList.COMBO_ASGN_CD = codeList.ASGN_CD.filter(item => item.DEPT_CD == searchParams.DEPT_CD)
    codeList.COMBO_ASGN_CD.unshift({ ASGN_NM: '직영', ASGN_CD: '' })

    grdMain.value.setBindingColumn('EST_STEP', codeList.EST_STEP, 'COD', 'TXT')
    grdMain.value.setBindingColumn('APP_STATUS', codeList.APP_STATUS, 'COD', 'TXT')
  })
}

//사업부 변경시 부서 조회
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  // getData()
  searchParams.ASGN_CD = ''
  searchParams.DEPT_CD = ''
  codeList.COMBO_DEPT_CD = codeList.DEPT_CD.filter(item => item.BSNS_CD == newValue)
})

watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  // getData()
  searchParams.ASGN_CD = ''
  codeList.COMBO_ASGN_CD = codeList.ASGN_CD.filter(item => item.DEPT_CD == newValue)
  codeList.COMBO_ASGN_CD.unshift({ ASGN_NM: '직영', ASGN_CD: '' })
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }},
  keys : [],
  fields: [
    { fieldName: 'GBN_NM', width: '120', styleName: 'center-column', dataType: 'text', header: { text: t('위험구분') }, editable: false },
    { fieldName: 'PROCESS_NM', width: '80', styleName: 'left-column', dataType: 'text', header: { text: t('대상공정\n/직무') }, lookupDisplay: true,editable: false },
    { fieldName: 'HARM_NM', width: '250', styleName: 'left-column', dataType: 'text', header: { text: t('주요 유해\n위험요인') }, lookupDisplay: true,editable: false,
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<div class="d-flex justify-space-between" style="align-items: center;">
            <p style="text-align:left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cell.value}</p>
          </div>`;
          return str;
        },
      }
    },
    { fieldName: 'POINT', width: '100', dataType: 'text', 
      header: { text: t('개선 전\n위험성 단계') }, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },editable: false},
    { fieldName: 'PLAN_DECREASE', width: '100', styleName: 'left-column', dataType: 'text', header: { text: t('현행 위험성\n감소대책') },editable: false},
    { fieldName: 'RISK_PLAN', width: '100', styleName: 'left-column', dataType: 'text', header: { text: t('위험성 추가\n저감 계획') },editable: false},
    { fieldName: 'EST_STEP', width: '100', styleName: 'left-column', dataType: 'text', header: { text: t('개선 후\n추정 위험성 단계') }, lookupDisplay: true, editable: false},
    { fieldName: 'REPAIR_USER_NM', width: '80', styleName: 'left-column', dataType: 'text',header: { text: t('개선 추진자') },},
    { fieldName: 'PLAN_ACT_DATE', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('조치 예정일') }, editable: false},
    { fieldName: 'ACT_DATE', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('조치 일자') }, editable: false},
    { fieldName: 'ACT_DETAIL', width: '120', styleName: 'left-column', dataType: 'text', header: { text: t('조치결과\n상세내용') },editable: false},
    { fieldName: 'APP_STATUS', width: '80', dataType: 'text', header: { text: t('진행상태') },editable: false,lookupDisplay: true},
    { fieldName: 'APP_DATE', width: '80', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('결재완료일') },editable: false,},


    { fieldName: 'YEAR', width: '80', dataType: 'text', header: { text: t('기준연도') }, visible: false },
    { fieldName: 'FILE_ID', width: '100', dataType: 'text', visible: false},
    { fieldName: 'FILE_YN', width: '100', dataType: 'text', visible: false},
    { fieldName: 'REPAIR_USER', width: '100', dataType: 'text', visible: false},
    { fieldName: 'CMPNY_DIV', width: '100', dataType: 'text', visible: false},
    { fieldName: 'BSNS_CD', width: '100', dataType: 'text', visible: false},
    { fieldName: 'DEPT_CD', width: '100', dataType: 'text', visible: false},
    { fieldName: 'ASGN_CD', width: '100', dataType: 'text', visible: false},
    { fieldName: 'GBN_NO', width: '100', dataType: 'text', visible: false},
    { fieldName: 'PROCESS_CD', width: '100', dataType: 'text', visible: false},
    { fieldName: 'SAVE_YN', width: '100', dataType: 'text', visible: false},
  ],
  columns: [],
}) 

grd1Props.columns = grd1Props.fields

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id == 'btnPrint') {
    grdMain.value.getGridView().exportGrid({ 
        type: 'excel',
        target: 'local',
        fileName: '작업환경 개선계획 관리',
        progressMessage: '엑셀 다운로드중입니다.',
        showProgress: true,
        indicator: 'visible',
        header: 'visible',
        footer: 'hidden',
        allColumns: false,
        exportTemplate: true
      })
  } else if (btn.id=='btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if(btn.id=='btnReqApply') {
    // 체크된 데이터 전부 일괄 결재 
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    const rowData = checkedRows.map(idx => grdMain.value.getDataProvider().getJsonRow(idx))
    
    for(let data of rowData) {
      // 입력란에 전부 입력해야 결재상신 가능
      if(!(data.RISK_PLAN 
      && data.EST_STEP 
      && data.REPAIR_USER_NM 
      && data.PLAN_ACT_DATE 
      && data.ACT_DATE 
      && data.ACT_DETAIL)) {
        return Message.warn(t('입력란에 전부 입력하셔야 결재상신이 가능합니다.'))
      }

      if(data.APP_STATUS == 'Y') {
        return Message.warn(t('이미 결재완료된 건입니다.'))
      } else if (data.APP_STATUS == 'B') {
        return Message.warn(t('이미 결재중인 건입니다.'))
      }
    }

    approval(rowData)
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const afterSearch = (res) => {
  // 결재 구분
  // 검토대기('') : 아무것도 입력되지 않았을때
  // 개획수립('A') : 위험성 추가 저감계획(추가) / 개선 추진자/ 조치예정일 등록 되었을때
  // 결재중('Y')   : 결재 상신 하였을때(위험성 추가 저감 계획 / 개선 후 추정 위험성 단계 / 개선추진자 / 조치예정일 / 조치일자 / 조치결과 상세내용까지 입력완료)
  // 결재완료('B') : 결재 완료 되었을때 
  res.ORESULT_CUR.forEach(item => {
    if(!item.APP_STATUS) {
      if(item.RISK_PLAN && item.REPAIR_USER && item.PLAN_ACT_DATE) {
        item.APP_STATUS = 'A'
      }else {
        item.APP_STATUS = ''
      }
    }
  })
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAB0020_SEARCH_01', param: searchParams })
}


// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) { 
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (isEmpty(data.BSNS_CD)) {
      return Message.warn(t('사업부코드는 필수입력입니다.')) 
    } else if (isEmpty(data.DEPT_CD)) {
      return Message.warn(t('부서코드는 필수입력입니다.')) 
    } else if (isEmpty(data.GBN_NO)) {
      return Message.warn(t('위험요소는 필수입력입니다.')) 
    } else if (isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수입력입니다.')) 
    } else if (isEmpty(data.PROCESS_CD)) {
      return Message.warn(t('공정코드는 필수입력입니다.'))
    } else if (!isEmpty(data.RISK_PLAN) && data.RISK_PLAN.length > 50) {
      return Message.warn(t('위험성추가 저감 계획은 최대 50글자입니다.'))
    } else if (!isEmpty(data.ACT_DETAIL) && data.ACT_DETAIL.length > 150) {
      return Message.warn(t('조치결과 상세내용은 최대 150글자입니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(!isEmpty(data.PLAN_ACT_DATE)) {
      data.PLAN_ACT_DATE = data.PLAN_ACT_DATE.replaceAll('-', '')
    }

    if(!isEmpty(data.ACT_DATE)) {
      data.ACT_DATE = data.ACT_DATE.replaceAll('-', '')
    }
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTAB0020_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const approvalClrLine = (val) => {

  let saveParams = []
  let checkRow = grdMain.value.getGridView().getCheckedRows(true)
  for(let rowIdx of checkRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.APPROVAL_STATUS = 'B'
    data.APPROVAL_KEY = val.appkey
    saveParams.push(data)
  }

  commonExecuteApi
  ({ 
      queryId : 'HLTAB0020_SAVE_02'
    , list: saveParams
  }).then(res=>{
    onButtonsClick({ id: 'btnSearch' })
  })
  
}

const approval = (rowData) => {
  appPopup.value.openPopup({
    CLSS_ID: 'HLTAB0020',
    TITLE: '작업환경 개선계획',
    CMPNY_DIV: userStore.cmpnyDiv,
    DATA_KEY:
      rowData[0].CMPNY_DIV + ';' + rowData[0].BSNS_CD + ';' + rowData[0].DEPT_CD + ';' 
      + rowData[0].ASGN_CD + ';' + dayjs().format('YYYYMMDDHHmmss'),
    REPORT: setReport(rowData), // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE: 'CLR_15', //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })
}

const setReport = (rowData) => {
  let htmlReport
  let tableHtml = ``
  for(let data of rowData) {
    tableHtml += `
    <table class="table">
      <tr>
        <td class="table_Header_side">위험구분</td>
        <td class="table_header_cell">대상공정 /직무</td>
        <td class="table_header_cell">주요 유해 위험요인</td>
        <td class="table_header_cell">개선 전 위험성 단계</td>
        <td class="table_header_cell">현행 위험성 감소대책</td>
        <td class="table_header_cell">위험성 추가 저감 계획</td>
        <td class="table_header_cell">개선 후 추정 위험성 단계</td>
        <td class="table_header_cell">개선 추진자</td>
        <td class="table_header_cell">조치 예정일</td>
        <td class="table_header_cell">조치 일자</td>
        <td class="table_Header_side">조치결과 상세내용</td>
      </tr>
      <tr>
        <td class="table_content_side">${data.GBN_NM}</td>
        <td class="table_content_cell">${data.PROCESS_NM}</td>
        <td class="table_content_cell">${data.HARM_NM}</td>
        <td class="table_content_cell">${data.POINT}</td>
        <td class="table_content_cell">${data.PLAN_DECREASE}</td>
        <td class="table_content_cell">${data.RISK_PLAN}</td>
        <td class="table_content_cell">${codeList.EST_STEP.find(item => item.COD == data.EST_STEP).TXT}</td>
        <td class="table_content_cell">${data.REPAIR_USER_NM}</td>
        <td class="table_content_cell">${data.ACT_DATE}</td>
        <td class="table_content_cell">${data.PLAN_ACT_DATE}</td>
        <td class="table_content_side">${data.ACT_DETAIL}</td>
      </tr>
    </table>
    <br>
    `
  }

  htmlReport =
    `<html>
  <head>
    <style>
        /* .div_style */
                
        .table_Header_side {
          text-align: center; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          border-collapse: collapse;
          width: 100%;
          height: 50px;
          border-top : 3px solid black;
          border-bottom : 1px solid black;
          table-layout: fixed;
        }
        .table_content_side {
          text-align: center; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          border-collapse: collapse;
          width: 100%;
          height: 150px;
          border-top : 3px solid black;
          border-bottom : 1px solid black;
          table-layout: fixed;
        }

        .table_header_cell {
          text-align: center; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          border-collapse: collapse;
          width: 100%;
          height: 50px;
          border-top : 3px solid black;
          border-bottom : 1px solid black;
          border-left : 1px solid black;
          border-right : 1px solid black;
          table-layout: fixed;
        }

        .table_content_cell {
          text-align: center; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          border-collapse: collapse;
          width: 100%;
          height: 50px;
          border-top : 3px solid black;
          border-bottom : 1px solid black;
          border-left : 1px solid black;
          border-right : 1px solid black;
          table-layout: fixed;
        }
        
        .Content_header
        {
          text-align: left; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          font-size: 18px;
          font-weight: bold;
        }

        .Content
        {
          text-align: left; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          padding: 10px;
          font-size: 18px;
        }

        .table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
        }
    </style>
  </head>
  <body>
  <div>     
    <div class="Content_header">Ⅰ.개요</div>
    <div class="Content">○ 작업환경개선계획 관리</div>
    <br/>
    <div class="Content_header">Ⅱ. 검토사항</div>
    ${tableHtml}
  </div>
  </body>
</html>`

 return htmlReport
}

const onCellClicked = (grid, rowData) => {
  if(rowData.cellType === 'data') {
    let data = grdMain.value.getDataProvider().getJsonRow(rowData.dataRow)
    data.ONLY_VIEW = false
    if(data.APP_STATUS === 'Y' || data.APP_STATUS === 'B') {
      data.ONLY_VIEW = true
    }
    popup01.value.openPopup(data)
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnReqApply','btnPrint',]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              v-model="searchParams.YEAR"
              :label="$t('기준년도')"
              label-width="50px"
              width="200px"
              type="number"
            />
            <i-select
              :label="$t('평가구분')"
              width="200px"
              placeholder="평가구분"
              v-model="searchParams.EVA_DIV"
              :items="codeList.evaDiv"
              item-value="COD"
              item-title="TXT"
              class="mr-4"
            />
            <i-select
              :label="$t('사업부')"
              width="200px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              class="mr-4"
            />

            <i-select
              :label="$t('부서')"
              width="200px"
              placeholder="부서"
              v-model="searchParams.DEPT_CD"
              :items="codeList.COMBO_DEPT_CD"
              item-value="DEPT_CD"
              item-title="ASGN_NM"
              :readonly="isEmpty(searchParams.BSNS_CD)"
              class="mr-4"
            />
            <i-select
              :label="$t('협력사')"
              width="200px"
              placeholder="협력사"
              v-model="searchParams.ASGN_CD"
              :items="codeList.COMBO_ASGN_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              :readonly="isEmpty(searchParams.DEPT_CD)"
            />

          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onCellClicked="onCellClicked"  
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <ApprovalPopup ref="appPopup" @approvalClrLine="approvalClrLine" />
  <HLTAB0020Popup01 ref="popup01" @after-search="getData"/>
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
::v-deep(.rg-header .rg-table tr td) {
  white-space: pre-line !important;
}
</style>