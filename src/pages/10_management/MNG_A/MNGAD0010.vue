<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import ApprovalPopup from "@/components/popup/ApprovalPopup.vue"
import { stubString } from 'lodash-es'
import OZReport from '@/components/OZReport.vue'


defineOptions({
  name: '10_management-MNG_A-MNGAD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const approvalPopup = ref(null)

const logsStore = useLogsStore()

let isSearch = false

const reportName = ref('')

// # OZ ----------------------------------------------------

const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// Oz 출력 세팅
const setPrint = () => {
  reportName.value = '/manage/hse/MNGAD0010.ozr'
  
  params.value = [
    'IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
    'IN_YEAR=' + searchParams.YEAR,
    'IN_BSNS_CD=' + searchParams.BSNS_CD,
    'IN_ASGN_CD=' + searchParams.ASGN_CD,
    'IN_ASGN_NM=' + searchParams.ASGN_NM,
    'IN_REG_DATE=' + writeInfo.writeDate,
    
  ]
}

//조회조건
let searchParams = reactive({    
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  ASGN_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm,
  ORGN_DIV: userStore.userDiv,
  EMP_NO: userStore.userId,
})

const confirmParam = reactive({
  CMPNY_DIV: null,
  YEAR: null,
  BSNS_CD: null,  
  ASGN_CD: null,
  CNFM_EMP_NO: null,
  USER_ID: null,
})

// 업무분장표 작성현황
const writeInfo = reactive({
  writer: '',
  writeDate: '',
  status: '',
})

const codeList = reactive({
  DIVISION: [],
})

//코드리스트 셋팅
const initCodeList = () => {
  // 구분 리스트 조회
  if(searchParams.ORGN_DIV === 'B'){
    Promise.all([getCodeList('HHIAF22')]).then(res => {
      codeList.DIVISION = res[0].ORESULT_CUR
      grdMain.value.setBindingColumn("DIVISION", codeList.DIVISION, "COD", "TXT")   // 구분 lookup set
    })
  }else{
    Promise.all([getCodeList('HHIAF21')]).then(res => {
      codeList.DIVISION = res[0].ORESULT_CUR
      grdMain.value.setBindingColumn("DIVISION", codeList.DIVISION, "COD", "TXT")   // 구분 lookup set
    })
  }
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : ['CMPNY_DIV', 'YEAR', 'BSNS_CD', 'ASGN_NM', 'SEQ'],
  fields : [ 
    { fieldName: 'DIVISION', dataType: 'text', width: '40', header: { text:'구분' },
      mergeRule: { "criteria": "value" }, editor: { type: "dropdown" }, 
      lookupDisplay: true,
    },
    { fieldName: 'CONTENTS', dataType: 'text', styleName: 'left-column', width: '160', header: { text:'업무내용' } },
    { fieldName: 'PERIOD', dataType: 'text', width: '30', styleName: 'left-column', header: { text:'주기' } },
    { fieldName: 'STANDARD', dataType: 'text', styleName: 'left-column', header: { text:'관련표준' } },
    { fieldName: 'REMARKS', dataType: 'text', styleName: 'left-column', header: { text:'비고' } },
    
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible: false },
    { fieldName: 'YEAR', dataType: 'text' , visible: false },
    { fieldName: 'SEQ', dataType: 'number' , visible: false },
    { fieldName: 'ODRNUM', dataType: 'number' , visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text' , visible: false },
    { fieldName: 'USER_ID', dataType: 'text' , visible: false },
    { fieldName: 'DIVISION_NM', dataType: 'text' , visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields


//메뉴버튼
const onButtonsClick = btn => {
  let oldYearValue = writeInfo.writeDate.substring(0,4)
  let result = oldYearValue !== searchParams.YEAR

  if (btn.id === 'btnSearch') {  // 조회
    if (!searchParams.ASGN_NM) {
      Message.warn('부서/협력사를 선택해주세요.')
    } else {
      
      // 업무분장표 작성현황
      if (!writeInfo.writeDate && !writeInfo.writer || result === true) {
        new queryFlowHelper(vm, t)
          .setQuery(searchData)
          .setAfter(afterSearch)
          .run()
      }
      
      // 업무분장표 상세(그리드)
      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchData2)
        .setAfter(afterSearch02)
        .run()
    }
    
  } 
  else if (btn.id === 'btnCreate') { // 추가
    addData()
  } 
  else if (btn.id === 'btnUpdate') { // 저장
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {  // 삭제
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if (btn.id === 'btnCopy') {
    openCopyPopup()
  } else if (btn.id === 'btnReqApply') {
    approveData()

    // 결재 후 재조회
    onButtonsClick({ id: 'btnSearch' })
    
  } else if (btn.id === 'btnConfirm') {
    // 확정
    Confirm()
  } else if (btn.id === 'btnCancelConfirm') {
    // 확정취소
    CancelConfirm()
  } else if (btn.id === 'btnPrint'){
    showOz.value = true
  }
}

/* ---------- 업무분장표 작성현황 조회 ---------- */
const searchData = () => {
  writeInfo.writeDate = ''
  writeInfo.writer = ''
  writeInfo.status = ''
  writeInfo.remark = ''

  return commonSearchApi({ queryId : 'MNGAD0010_SEARCH_01', param: searchParams })
}

const afterSearch = async (res) => {
  isSearch = true

  // HSE 추진자 여부
  let auth = false
  await commonSearchApi({ queryId: 'searchHseAuth', param: searchParams }).then(
    async (res2) => {
      auth = res2.ORESULT_CUR[0].AUTH === 'Y' ? true : false
    }
  )

  if(logsStore.isMenuAdmin === 'Y'){
    auth = true
  }

  if(searchParams.ORGN_DIV === 'A'){
    // 직영
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', true)                // 결재상신 보이기
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', false)                // 확정버튼 숨기기
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false)          // 확정취소버튼 숨기기
  }else{
    //협력사
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', false)                // 결재상신 숨기기
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', true)                // 확정버튼 보이기
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', true)          // 확정취소버튼 보이기
  }

  if(auth){
    menuTitle.value.disableBtn('btnCreate', false)
    menuTitle.value.disableBtn('btnUpdate', false)
    menuTitle.value.disableBtn('btnDelete', false)
    menuTitle.value.disableBtn('btnReqApply', false)
    menuTitle.value.disableBtn('btnConfirm', false)
    menuTitle.value.disableBtn('btnCancelConfirm', false)
    menuTitle.value.disableBtn('btnCopy', false)
  } else {
    menuTitle.value.disableBtn('btnCreate', true)
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnDelete', true)
    menuTitle.value.disableBtn('btnReqApply', true)
    menuTitle.value.disableBtn('btnConfirm', true)
    menuTitle.value.disableBtn('btnCancelConfirm', true)
    menuTitle.value.disableBtn('btnCopy', true)
  }
  
  if (res.ORESULT_CUR.length > 0) {
    
    writeInfo.writer = res.ORESULT_CUR[0].WRITE_EMP_NM
    writeInfo.writeDate = res.ORESULT_CUR[0].WRITE_DATE
    writeInfo.status = res.ORESULT_CUR[0].ZZ_APP_STATUS_DES

    setPrint()

    if(res.ORESULT_CUR[0].ZZ_APP_STATUS === 'B' || res.ORESULT_CUR[0].ZZ_APP_STATUS === 'Y'){
      menuTitle.value.disableBtn('btnCreate', true)
      menuTitle.value.disableBtn('btnUpdate', true)
      menuTitle.value.disableBtn('btnDelete', true)
      menuTitle.value.disableBtn('btnReqApply', true)
      menuTitle.value.disableBtn('btnConfirm', true)
      menuTitle.value.disableBtn('btnCancelConfirm', true)
      menuTitle.value.disableBtn('btnCopy', true)
    }
    
    if(searchParams.ORGN_DIV === 'B'){
      if(res.ORESULT_CUR[0].CNFM_DATE === null || res.ORESULT_CUR[0].CNFM_DATE === ''){
        menuTitle.value.disableBtn('btnCreate', false)
        menuTitle.value.disableBtn('btnUpdate', false)
        menuTitle.value.disableBtn('btnDelete', false)
        menuTitle.value.disableBtn('btnConfirm', false)
        menuTitle.value.disableBtn('btnCancelConfirm', true)
        menuTitle.value.disableBtn('btnCopy', false)
      }else{       
        menuTitle.value.disableBtn('btnCreate', true)
        menuTitle.value.disableBtn('btnUpdate', true)
        menuTitle.value.disableBtn('btnDelete', true)
        menuTitle.value.disableBtn('btnConfirm', true)
        menuTitle.value.disableBtn('btnCancelConfirm', false)
        menuTitle.value.disableBtn('btnCopy', true)
      }
    }
  }else{
    menuTitle.value.disableBtn('btnCreate', false)
    menuTitle.value.disableBtn('btnUpdate', false)
    menuTitle.value.disableBtn('btnDelete', false)
    menuTitle.value.disableBtn('btnReqApply', false)
    menuTitle.value.disableBtn('btnConfirm', false)
    menuTitle.value.disableBtn('btnCancelConfirm', true)
    menuTitle.value.disableBtn('btnCopy', false)
  } 
}

/* ---------- 업무분장표 상세조회(그리드) ---------- */
const searchData2 = () => {
  return commonSearchApi({ queryId : 'MNGAD0010_SEARCH_02', param: searchParams })
}

const afterSearch02 = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 추가
const addData = () => {
  let rows = grdMain.value.getDataProvider().getRows()
  
  if (rows.length === 0) {
    if (isSearch === false) {
      Message.warn(t('데이터를 조회해주세요'))
    } else if (isSearch === true) {
      grdMain.value.addRow({
        CMPNY_DIV : userStore.cmpnyDiv,
        BSNS_CD : searchParams.BSNS_CD,
        ASGN_CD : searchParams.ASGN_CD,
        YEAR : searchParams.YEAR,
        SAVE_YN : 'N',
        SEQ: null,
        USER_ID : userStore.userId,
        ODRNUM: null,
      })  
    }
  } else {
    grdMain.value.addRow({
      CMPNY_DIV : userStore.cmpnyDiv,
      BSNS_CD : searchParams.BSNS_CD,
      ASGN_CD : searchParams.ASGN_CD,
      YEAR : searchParams.YEAR,
      SAVE_YN : 'N',
      SEQ: null,
      USER_ID : userStore.userId,
      ODRNUM: null,
    })
  }
}

const validationCheck = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      if (!data.DIVISION) {
        Message.warn(t('구분을 선택해주세요.'))
      } else if (!data.CONTENTS) {
        Message.warn(t('업무내용을 입력해주세요.'))
      } else if (!data.PERIOD) {
        Message.warn(t('주기을 입력해주세요.'))
      } else if (!data.STANDARD) {
        Message.warn(t('관련표준을 입력해주세요.'))
      } else {
        return true
      }
    }
  }
}

//메뉴버튼 - 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  commonExecuteApi({ queryId : 'MNGAD0010_SAVE_01', list: saveParams })

  return commonExecuteApi({ queryId : 'MNGAD0010_SAVE_02', list: saveParams })
}

//메뉴버튼 - 삭제
const deleteData = () => {

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

    return commonExecuteApi({ queryId : 'MNGAD0010_DELETE_02', list: delParams })
  }
}

const Confirm = () => {
  confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV
  confirmParam.YEAR = searchParams.YEAR
  confirmParam.BSNS_CD = searchParams.BSNS_CD 
  confirmParam.ASGN_CD = searchParams.ASGN_CD
  confirmParam.CNFM_EMP_NO = userStore.userId 
  confirmParam.USER_ID = userStore.userId

  commonExecuteApi({ queryId: 'MNGAD0010_SAVE_05', list: [confirmParam] })
      .then((res) => {
        if (res.list[0].OUT_RES_COD === '0') {
          try {
            // 협력사만 확정하기 때문에 굳이 메일 보낼 필요 없음
            Message.success(t('확정 되었습니다.'))            
          } catch (e) {
            
          }
        }
      })
      .finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
}

const CancelConfirm = () => {
  confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV
  confirmParam.YEAR = searchParams.YEAR
  confirmParam.BSNS_CD = searchParams.BSNS_CD 
  confirmParam.ASGN_CD = searchParams.ASGN_CD
  confirmParam.CNFM_EMP_NO = ''
  confirmParam.USER_ID = userStore.userId

  commonExecuteApi({ queryId: 'MNGAD0010_SAVE_05', list: [confirmParam] })
      .then((res) => {
        if (res.list[0].OUT_RES_COD === '0') {
          try {
            // 협력사만 확정하기 때문에 굳이 메일 보낼 필요 없음
            Message.success(t('확정취소 되었습니다.'))            
          } catch (e) {
            
          }
        }
      })
      .finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
}

const onDeptSelect = () => {
  if(searchParams.ORGN_DIV === 'A'){
    // 직영
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', true)                // 결재상신 보이기
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', false)                // 확정버튼 숨기기
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false)          // 확정취소버튼 숨기기
  }else{
    //협력사
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', false)                // 결재상신 숨기기
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', true)                // 확정버튼 보이기
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', true)          // 확정취소버튼 보이기
  }

  let oldYearValue = writeInfo.writeDate.substring(0,4)
  let result = oldYearValue !== searchParams.YEAR

  // 업무분장표 작성현황
  if (!writeInfo.writeDate && !writeInfo.writer || result === true) {
    new queryFlowHelper(vm, t)
      .setSearchArea(searchArea)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }

  // 업무분장표 상세(그리드)
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setSearchArea(searchArea)
    .setQuery(searchData2)
    .setAfter(afterSearch02)
    .run()
}

/* ------------------- 팝업 ------------------- */
// 부서 선택 팝업 오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup({ ASGN_NM: searchParams.ASGN_NM })
}

// 부서 선택 팝업 이벤트
const onDeptSelected = val => {
  //console.log('onDeptSelected', val)

  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
  searchParams.ORGN_DIV = val.ORGN_DIV

  initCodeList()
  //onDeptSelect()
  onButtonsClick({ id: 'btnSearch' })
}

const openCopyPopup = () => {
  let path = useLogsStore().path.split('/')
  let menuId = path[path.length -1] 
  copyPopup.value.openCopyPopup(menuId, searchParams)
}

const approveData = async () => {
  let rowCount = await grdMain.value.getDataProvider().getRowCount()

  if(rowCount === 0){
    Message.warn(t('조회된 데이터가 없습니다.'))
    return
  }

  let setGrid = `
  <html>
    <head>      
      <style>
        .tbl {                        
          border: 1px solid #444444;
          border-collapse: collapse;
          font-family:조선일보명조;
          width:100%;
        }                              
        .title2{
          background-color:lightsteelblue;
          font-weight: bold;
          text-align: center;  
          border: 1px solid #444444;
          padding: 5px;
          font-size: 14px;                             
        }
        .item{
          border: 1px solid #444444;
          padding: 5px;
          font-size: 14px;    
          text-align: center;                   
        }        
        .span_25 {
          font-size: 25px; 						
        }
        .span_15 {
          font-size: 15px; 						
        }
      </style>
    </head>
    <body>
      <center><div><span class="span_25"><b>업 무 분 장 표</b></span></div></center>
      <br/>
      <div style="display:flex;margin-bottom:5px">
        <span class="span_15"><b>부서명: ${searchParams.ASGN_NM}</b></span>
        <span class="span_15" style="margin-left:auto"><b>작성일: ${writeInfo.writeDate}</b></span>
      </div>                                   
      <table class="tbl" id="tableList"> 
        <thead>
          <tr>
            <th class="title2" style="width:10%">구분</th>
            <th class="title2" style="width:35%">업무내용</th>
            <th class="title2" style="width:10%">주기</th>
            <th class="title2" style="width:25%">관련표준</th>
            <th class="title2" style="width:20%">비고</th>                                         
          </tr>
        </thead>
        <tbody class="grdTbody">
  `

  let rows = grdMain.value.getDataProvider().getRows()

  for (let rowIdx in rows) {
    //console.log("row : " + row)
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)   

    setGrid += `
        <tr>
					<td class="item">${data.DIVISION_NM}</td>
          <td class="item" style="text-align:left">${data.CONTENTS}</td>
				  <td class="item">${data.PERIOD}</td>
          <td class="item" style="text-align:left">${data.STANDARD}</td>
				  <td class="item" style="text-align:left">${data.REMARKS === null ? '' : data.REMARKS}</td>                      				  
				</tr>
    `
  }

  setGrid += `
      </tbody>                    
      </table>
    </body>
  </html>
    `

  //console.log("setGrid : " + setGrid)  

  approvalPopup.value.openPopup({
    CLSS_ID: 'MNGAD0010',
    TITLE: '안전보건환경 업무 분장표',
    CMPNY_DIV: userStore.cmpnyDiv,
    DATA_KEY:
      userStore.cmpnyDiv +
      ";" +
      searchParams.BSNS_CD +
      ";" +
      searchParams.BSNS_CD +
      ";" +
      new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
    REPORT: setGrid,//xmlSrc, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE: "3", //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: "421", //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE: "CLR_15", //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })
}

// 결재 상신 후, 처리 결과 리턴
const approvalResult = (res) => {
  console.log('approval Res =======', res)

  if(res == undefined || res == null)
    return

  let params = [{
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: searchParams.YEAR,
    BSNS_CD: searchParams.BSNS_CD,
    ASGN_CD: searchParams.ASGN_CD,    
    APPROVE_ID: res.appkey,
    USER_ID: userStore.userId,
  }]
  
  commonExecuteApi({ queryId: "MNGAD0010_SAVE_04", list: params  }).then( res => {
    // 결재상신 처리 후, 저장, 상신, 폐지 버튼 비활성화 시키기
    menuTitle.value.disableBtn('btnCreate', true)
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnDelete', true)
    menuTitle.value.disableBtn('btnReqApply', true)
    menuTitle.value.disableBtn('btnCopy', true)
    
      //console.log('떴나??')  
  })
  

  // 결재 상신 완료시, 저장/결재상신 버튼 비활성화
  /*
  if(res.toUpperCase() === 'OK')
  {
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnReqApply', true)
  }*/
}

/* 조회 조건 변경에 따른 업무분장표 작성현황 변경 */
// 부서/협력사 변경 시
watch(() => searchParams.ASGN_CD, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    new queryFlowHelper(vm, t)
      .setSearchArea(searchArea)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
})

onMounted(() => {
  initCodeList() 
  onDeptSelect()  
})


</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnConfirm', 'btnCancelConfirm', 'btnReqApply', 'btnCopy', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <div class="d-flex me-auto">
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('년도')"
              label-width="35px"
              width="150px"
              type="YEAR"
            />
            <!-- 부서/협력사 --> 
            <i-input
              :label="$t('부서/협력사')"
              label-width="70px"
              width="300px"
              v-model="searchParams.ASGN_NM" 
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup"
              @keydown="e => { if(e.keyCode == 13) openDeptPopup() }"
            />
          </div>
          <div class="d-flex">
            <i-input
              :label="$t('작성일자')"
              label-width="60px"
              width="200px"
              v-model="writeInfo.writeDate"
              readonly
            />
            <i-input
              :label="$t('작성자')"
              label-width="60px"
              width="200px"
              v-model="writeInfo.writer"
              readonly
            />
            <i-input
              :label="$t('결재상태')"
              label-width="60px"
              width="200px"
              v-model="writeInfo.status"
              readonly
            />
          </div>
        </v-sheet>
        <v-sheet>
          <IGridTitle :title="$t('업무분장표 상세')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: calc(100vh - 380px);"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>

  <!-- 부서/ 협력사 팝업 -->
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
  <!-- 복사 팝업 -->
  <CopyPopup ref="copyPopup" />

  <!-- OZReport -->
  <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="params"
      @close="showOz = $event"
    />

  <!-- 결재 팝업 -->
  <ApprovalPopup ref="approvalPopup" @approvalClrLine="approvalResult"/>
</template>
  
