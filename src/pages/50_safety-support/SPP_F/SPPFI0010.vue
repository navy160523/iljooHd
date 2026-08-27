<!--
  화면명 : 가동 전 점검
  화면개요 : 가동 전 점검
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
// import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
// import { isEmpty, isEmptyArray } from "@/@core/utils"
import SPPFI0010Popup from '@/pages/50_safety-support/SPP_F/SPPFI0010Popup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' //결재
import { useRoute } from 'vue-router'

defineOptions({
  name: '50_safety-support-SPP_F-SPPFI0010',
})
 
const sppfi0010Popup = ref(null)
const approvalPopup = ref(null)
const FIUploadPopup = ref(null)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const useLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const selectrow = ref(null)
const route = useRoute()

const popupParam=reactive({})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.empNo,
})

const isAdmin = ref(0)

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  process: [],
  item: [],
  GUBUN: [
    { COD: 'A', TXT: '신규 설비 설치'},
    { COD: 'B', TXT: '주요 구조 변경'},
    { COD: 'C', TXT: '1개월 이상 운휴'}
  ],
  APP_STATUS: []
})

//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    checkBar: { visible: false, exclusive: true}
  },
  fields : [
    { fieldName: 'BSNS_NM', dataType: 'text', width: '100', header: { text: t('사업부')} },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '100', header: { text: t('부서') } },
    { fieldName: 'PROCESS_NM', dataType: 'text', width: '150', styleName: 'left-column', header: { text: t('공정설비')} },
    { fieldName: 'INSPECT_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '150', header: { text: t('가동 전 점검일자')} },
    { fieldName: 'GUBUN', dataType: 'text', width: '150', header: { text: t('구분')}, lookupDisplay: true },
    { fieldName: 'CONTENT', dataType: 'text', width: '150', header: { text: t('내용')} },
    { fieldName: 'REV_APP_STATUS', dataType: 'text', width: '150', header: { text: t('결재 완료')}, lookupDisplay: true },
    { fieldName: 'FILE_YN', dataType: 'text', width: '150', header: { text: t('첨부') }, 
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20
        
        if (dataCell.value) {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/image-search-outline.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        return ret
      },
    },
    { fieldName: 'REMARKS', dataType: 'text', width: '150', styleName: 'left-column', header: { text: t('비고') }},


    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'REV_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false, },    
  ],
  columns : [],
  columnLayout :[
    'BSNS_NM',
    'DEPT_NM',
    'PROCESS_NM',
    {
      name:'가동 전 점검 현황',
      direction: 'horizontal',
      items:['INSPECT_DATE', 'GUBUN', 'CONTENT', 'REV_APP_STATUS', 'FILE_YN']
    }, 
    'REMARKS'
  ]
})

grdMain1Props.columns = grdMain1Props.fields

const grdMain2Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    rowIndicator: { visible: true },
  },
  fields : [
    { fieldName: 'INSPECT_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '150', styleName: 'left-column', header: { text: t('일자')} },
    { fieldName: 'GUBUN', dataType: 'text', width: '150', styleName: 'left-column', header: { text: t('구분') }, lookupDisplay: true, editor: { type: 'dropdown'}},
    { fieldName: 'CONTENT', dataType: 'text', width: '150', styleName: 'left-column', header: { text: t('내용')} },
    { fieldName: 'REV_APP_STATUS', dataType: 'text', width: '80', styleName: 'center-column', header: { text: t('결과')}, lookupDisplay: true },
    { fieldName: 'FILE_YN', dataType: 'text', width: '150', styleName: 'left-column', header: { text: t('첨부') } ,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_YN')
          if (value == 'Y') {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부 완료</button>
              </div>
            `;
          } else { 
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
              </div>
            `;
          } 
        }
      }
    },
    { fieldName: 'REMARKS', dataType: 'text', width: '150', styleName: 'left-column', header: { text: t('비고')} },


    { fieldName: 'REV_SEQ', dataType: 'text', width: '150', styleName: 'left-column', visible : false },
    { fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible : false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('등록자') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
  ],
  columns : [],
  columnLayout :[
    'INSPECT_DATE',
    'GUBUN',
    {
      name:'변동현황',
      direction: 'horizontal',
      items:['CONTENT', 'REV_APP_STATUS', 'FILE_YN']
    }, 
    'REMARKS'
  ]
})

grdMain2Props.columns = grdMain2Props.fields

onMounted(() => {
  // PSM 관리자 확인
  // 2: PSM 모듈 관리자, 1: PSM 부서 담당자, 0: 일반 사용자
  if (useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('SPPF001')) {
    isAdmin.value = 2
  } else if (userStore.authGrpCd.includes('SPPF002')) {
    isAdmin.value = 1
  }

  if (isAdmin.value == 0) {
    menuTitle.value.visibleBtn('btnCreate', false)
    menuTitle.value.visibleBtn('btnReqApply', false)
  } else {
    menuTitle.value.visibleBtn('btnCreate', true)
    menuTitle.value.visibleBtn('btnReqApply', true)
  }

  initCodeList()
  getData()

  grdMain1.value.getGridView().filterPanel.visible = true
  grdMain2.value.getGridView().filterPanel.visible = true
})

const initCodeList = () => {
  Promise.all([ 
    commonSearchApi({ queryId: 'SPPFE0010_COMBO_01', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFE0010_COMBO_02', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFE0010_COMBO_03', param: searchParams }),
    getCodeList('HHIZ030')
  ]).then(res => {    
    codeList.bsnscd = res[0].ORESULT_CUR
    if(searchParams.BSNS_CD !== '') {
      codeList.deptcd = res[1].ORESULT_CUR
      codeList.process = res[2].ORESULT_CUR
    }

    codeList.APP_STATUS = res[3].ORESULT_CUR
    codeList.bsnscd.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
    codeList.deptcd.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
    codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })

    if(codeList.bsnscd.find(item => userStore.bsnsCd == item.CODE)) {
      searchParams.BSNS_CD = userStore.bsnsCd
    }
    if(codeList.deptcd.find(item => userStore.deptCd == item.CODE)) {
      searchParams.DEPT_CD = userStore.deptCd
    } 

    grdMain1.value.setBindingColumn('REV_APP_STATUS', codeList.APP_STATUS, 'COD', 'TXT')
    grdMain1.value.setBindingColumn('GUBUN', codeList.GUBUN, 'COD', 'TXT')
    grdMain2.value.setBindingColumn('REV_APP_STATUS', codeList.APP_STATUS, 'COD', 'TXT')
    grdMain2.value.setBindingColumn('GUBUN', codeList.GUBUN, 'COD', 'TXT')
  })
}

const onButtonsClick = btn => {
  if(btn.id === 'btnCreate') {
    openPopup('C')
  } else if(btn.id === 'btnSearch') {
    getData('B')
  } else if(btn.id == 'btnReqApply') {
    approval()
  }
}

// 추가 버튼 팝업 실행
const openPopup = (data) => {
  let row = grdMain1.value.getGridView().getSelectedRows()
  let rowData = grdMain1.value.getDataProvider().getJsonRow(row)

  //2025.07.07 내용 추가시 파일 첨부 내역 확인 부분 추가
  if(rowData.FILE_YN !='Y' && rowData.REV_SEQ && data=="C")
  {
    return Message.warn(t('이전 내용에 파일이 첨부되지 않았습니다.'))
  }

  if(rowData.REV_APP_STATUS != 'Y' && rowData.REV_SEQ && data=="C") {
    return Message.warn(t('이전 내용의 결재가 완료되지 않았습니다.'))
  }
  popupParam.DIV = data
  sppfi0010Popup.value.openPopup(popupParam)
}

const getData = (val) => {
  if (val == 'B') {
    selectrow.value = 0
  } else {
    selectrow.value = selectrow.value;
  }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain1])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {  
  return commonSearchApi({ queryId: 'SPPFI0010_SEARCH_01', param: searchParams })  
}

// 조회 후
const afterSearch = (res) => {
  grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);
  gridSelect()
}

const gridSelect =()=>{
  grdMain1.value.getGridView().clearCurrent();
  grdMain1.value.getGridView().setCurrent({itemIndex : selectrow.value});
}

//사업부변경 감지
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    const param = { 
      CMPNY_DIV: searchParams.CMPNY_DIV, 
      BSNS_CD: newValue 
    }

    if (newValue !== '') {
      Promise.all([ 
        commonSearchApi({ queryId: 'SPPFE0010_COMBO_02', param: param }),
        commonSearchApi({ queryId: 'SPPFE0010_COMBO_03', param: param })
      ]).then((res) => {
        searchParams.DEPT_CD = ''
        searchParams.PROCESS_CD = ''
        codeList.deptcd = res[0].ORESULT_CUR
        codeList.process = []
        // codeList.process = res[1].ORESULT_CUR
        codeList.deptcd.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
        codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
      })
    } else {
      searchParams.DEPT_CD = ''
      searchParams.PROCESS_CD = ''
      codeList.deptcd = []
      codeList.process = []
      codeList.deptcd.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
      codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
    }
  }
)

// 부서변경 감지
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    if (newValue !== '') {
      commonSearchApi({ 
        queryId: 'SPPFE0010_COMBO_03', 
        param: { 
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: newValue
        } 
      }).then((res) => {
        searchParams.PROCESS_CD = ''
        codeList.process = res.ORESULT_CUR
        codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
      })
    } else {
      // console.log('dept and process Empty!')
      searchParams.PROCESS_CD = ''
      codeList.process = []
      codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
    }
  }
)

const onCurrentChanged = async (grid, oldRow, newRow) =>{
  const gridView = grdMain1.value.getGridView()
  const clickedColumn = grid.getCurrent().column
  let clickedField
  if(clickedColumn) {
    clickedField = grid.columnByName(clickedColumn).fieldName
  }
  let row = grdMain1.value.getGridView().getSelectedRows()
  if(row[0] >= 0) {
    selectrow.value = row[0]
  }
  gridView.checkAll(false)
  gridView.checkItem(row, true)

  if (clickedField == 'FILE_YN' || clickedField == null) {
    return
  } else {
    popupParam.BSNS_CD = grdMain1.value.getGridView().getValues(row)["BSNS_CD"]
    popupParam.DEPT_CD = grdMain1.value.getGridView().getValues(row)["DEPT_CD"]
    popupParam.PROCESS_CD = grdMain1.value.getGridView().getValues(row)["PROCESS_CD"]
    popupParam.BSNS_NM = grdMain1.value.getGridView().getValues(row)["BSNS_NM"]
    popupParam.DEPT_NM = grdMain1.value.getGridView().getValues(row)["DEPT_NM"]
    popupParam.PROCESS_NM = grdMain1.value.getGridView().getValues(row)["PROCESS_NM"]
    commonSearchApi({
      queryId: 'SPPFI0010_SEARCH_02',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD : grdMain1.value.getGridView().getValues(row)["BSNS_CD"],
        DEPT_CD : grdMain1.value.getGridView().getValues(row)["DEPT_CD"],
        PROCESS_CD : grdMain1.value.getGridView().getValues(row)["PROCESS_CD"]},
      }).then(res2 => {
      grdMain2.value.getDataProvider().setRows(res2.ORESULT_CUR);
    })
  }
}

// 셀 클릭 이벤트
const onCellItemClicked = (grid, index, col) => {
  if (col.fieldName === 'FILE_YN') {    
    let fileId=grdMain1.value.getGridView().getValues(col.dataRow)['FILE_ID']
    FIUploadPopup.value.openPopup(fileId);
  }
}

const onCellDblClicked = (grid, index, col) => {
  let data = grdMain2.value.getDataProvider().getJsonRow(index.dataRow)
  if(index.dataRow == 0 && isAdmin.value != 0 && [null, 'A', 'Z', 'C'].includes(data.REV_APP_STATUS)) {
    data.WRITE = 'Y'
  } else {
    data.WRITE = 'N'
  }
  data.Admin = isAdmin.value
  data.DIV = 'M'

  sppfi0010Popup.value.openPopup(data)
}

const upDate = () => {
  getData("F")
}

const appData = reactive({})
const approvalAppkey = (appKey) => {
  appData.APPROVE_ID = appKey
  
  commonExecuteApi({ queryId: 'SPPFI0010_SAVE_02', list: [appData] }).then(res => {
    getData("F")
  })
}

const approval = async () => {
  let row = grdMain1.value.getGridView().getSelectedRows()
  let rowData = grdMain1.value.getDataProvider().getJsonRow(row)

  
  if (rowData.REV_APP_STATUS == 'Y') {
    return Message.warn(t('결재가 완료된 건입니다.'))
  } else if(rowData.REV_APP_STATUS == 'B') {
    return Message.warn(t('결재가 진행 중인 건입니다.'))
  } else if (rowData.FILE_YN != 'Y') {
    return Message.warn(t('파일첨부는 필수입니다.'))
  }

  appData.CMPNY_DIV = userStore.cmpnyDiv
  appData.BSNS_CD = rowData.BSNS_CD
  appData.DEPT_CD = rowData.DEPT_CD
  appData.PROCESS_CD = rowData.PROCESS_CD
  appData.REV_SEQ = rowData.REV_SEQ
  appData.USER_ID = userStore.userId

  approvalPopup.value.openPopup({
    CLSS_ID: 'SPPFI0010',
    TITLE: '공정안전관리(PSM) // 가동 전 점검 - 검토 결과 보고 件.',
    CMPNY_DIV: userStore.cmpnyDiv,
    DATA_KEY:
      userStore.cmpnyDiv + ';' + rowData.BSNS_CD + ';' + rowData.DEPT_CD + ';' + rowData.PROCESS_CD + ';' + rowData.REV_SEQ,
    REPORT: setReport(rowData), // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE: 'CLR_15', //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })
}

const setReport = (data) => {
  let htmlReport =
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
            width: 50%;
            table-layout: fixed;
            border-collapse: collapse;
          }
      </style>
    </head>
    <body>
    <div>     
      <div class="Content_header">Ⅰ.개요</div>
      <div class="Content">○ PSM 가동 전 점검 결과 보고</div>
      <br/>
      <div class="Content_header">Ⅱ. 검토사항</div>
      <table class="table">
        <tr>
          <td class="table_Header_side">구분</td>
          <td class="table_header_cell">PSM <br>대상설비</td>
          <td class="table_header_cell">점검내용</td>
          <td class="table_Header_side">비고</td>
        </tr>
        <tr>
          <td class="table_content_side">PSM 가동 전 점검<br>검토</td>
          <td class="table_content_cell">`+ data.DEPT_NM +`<br>`+ data.PROCESS_NM +`</td>
          <td class="table_content_cell">`+ data.CONTENT +`</td>
          <td class="table_content_side">
          <a href=`+window.location.href+` target="_blank" rel="noopener noreferrer">
          ` + window.location.href + `
          </a></td>
        </tr>
      </table>
      <br/>
    </div>
    </body>
  </html>`

  return htmlReport
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnSearch','btnCreate','btnReqApply']"
        @click-button="onButtonsClick"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('사업부')"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnscd"
              item-title="DISPLAY_TEXT"
              item-value="CODE" 
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('부서')"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptcd"
              item-title="DISPLAY_TEXT"
              item-value="CODE"
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('공정설비')"
              v-model="searchParams.PROCESS_CD"
              :items="codeList.process"
              item-title="DISPLAY_TEXT"
              item-value="CODE"
            />
          </div> 
        </v-sheet>
        <v-sheet height="50%">
          <RealGrid
            ref="grdMain1"
            :grid-view-option="grdMain1Props.gridViewOption"
            :keys="grdMain1Props.keys" 
            :fields="grdMain1Props.fields"
            :columns="grdMain1Props.columns"
            :column-layout="grdMain1Props.columnLayout"
            @onCurrentChanged="onCurrentChanged"  
            @onCellItemClicked="onCellItemClicked" 
          />
        </v-sheet>
        <v-sheet class="mt-2" height="40%">
          <IGridTitle 
            :title="$t('변경이력확인')"
          >
          </IGridTitle>
          <RealGrid
            ref="grdMain2"
            :grid-view-option="grdMain2Props.gridViewOption"
            :keys="grdMain2Props.keys" 
            :fields="grdMain2Props.fields"
            :columns="grdMain2Props.columns"
            :column-layout="grdMain2Props.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
      <IUploadPopup ref="FIUploadPopup" 
        gridTitle="첨부파일 다운로드"
        width="1200" 
        height="800" 
        :button-list="['btnDownLoad','btnClose']"
        :isVisibled="false"
      ></IUploadPopup>
      <SPPFI0010Popup ref="sppfi0010Popup" @upDate="upDate"/>
      <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
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
