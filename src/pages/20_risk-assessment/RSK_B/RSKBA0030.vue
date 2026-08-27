<!-- 
  화면명   : 중요위험 특별감소대책 관리
  화면개요 : 중요위험 특별감소대책 관리 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import editPopup from '@/pages/20_risk-assessment/RSK_B/Popup/RSKBA0030Popup.vue'
import dayjs from 'dayjs'
import { useCommonStore } from '@hiway/stores/common'
import { useRouter }    from 'vue-router'
import ApprovalPopup from "@/components/popup/ApprovalPopup.vue"
import ApprovalPopupInApp from "@/components/popup/ApprovalPopupInApp.vue"

defineOptions({
  name: '20_risk-assessment-RSK_B-RSKBA0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const router = useRouter()
const commonStore = useCommonStore()

const menuTitle = ref(null)
const grdMain = ref(null)
const editDataPopup = ref(null)

const approvalPopup = ref(null)
const approvalPopupInApp = ref(null) // 결재(내부 : 협력사용)

//조회조건
let searchParams = reactive({    
  COMPANY_CD: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  PARTNER_CD: '',
  HALF: (dayjs().get("month") + 1) <= 6 ? '1' : '2',
  USR_ID: userStore.userId,
})

// 코드리스트
const codeList = reactive({
  COMPANY_CD: [],
  BSNS_CD: [],
  DEPT_CD: [],
  PARTNER_CD: [],
  HALF: [
    { COD: '1', TXT: '상반기' },
    { COD: '2', TXT: '하반기' },
  ],
  LEVEL: [
    { COD: '1', TXT: '1(최하)' },
    { COD: '2', TXT: '2(하)' },
    { COD: '3', TXT: '3(중)' },
    { COD: '4', TXT: '4(상)' },
    { COD: '5', TXT: '5(최상)' },
  ],
})


//코드리스트 셋팅
const initCodeList = async () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),
    // 사업부 [1]
    commonSearchApi({ 
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N'
      }
    }),
    commonSearchApi({ 
      queryId : 'searchDept3',
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD, 
        USE_DIV:'Y' 
      } 
    }),
    commonSearchApi({ 
      queryId : 'searchVend',
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD, 
        DEPT_CD: searchParams.DEPT_CD,        
      } 
    })
  ]).then(res => {
    codeList.COMPANY_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR 
    codeList.PARTNER_CD = res[3].ORESULT_CUR 
    codeList.PARTNER_CD.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
    if(userStore.userDiv === 'B'){
      searchParams.PARTNER_CD = userStore.asgnCd
    }
  })
  codeList.BSNS_CD.unshift({ BSNS_NM:"전체", BSNS_CD:"" })  
  if(userStore.userDiv === 'B'){
    menuTitle.value.visibleBtn('btnPartnerApply', true)
  }
  else{
    menuTitle.value.visibleBtn('btnPartnerApply', false)
  }

  if(window.history.state.data){
    let data = await window.history.state.data
    console.log('initCodeList data', data)

    searchParams.COMPANY_CD = data.COMP_CD
    searchParams.BSNS_CD = data.BSNS_CD
    await setDeptList(searchParams.BSNS_CD)
    searchParams.DEPT_CD = data.DEPT_CD
    await setPartnerList(searchParams.DEPT_CD)
    searchParams.PARTNER_CD = data.PARTNER_CD ? data.PARTNER_CD : ''

    commonStore.loading = false
    onButtonsClick({id: 'btnSearch'})
  }
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : ['SRSRM_ID'],
  fields : [ 
    { fieldName: 'PROGRESS_STATUS', dataType: 'text', editable: false, header: { text:'상태정보' } },
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', styleName: 'left-column multiline-editor', editable: false, header: { text:'작업표준명' } },
    { fieldName: 'ACT_NM', dataType: 'text', styleName: 'left-column', editable: false, header: { text:'작업행동' } },
    { fieldName: 'RISK_NM', dataType: 'text', styleName: 'left-column multiline-editor', editable: false, header: { text:'위험요인' } },
    { 
      fieldName: 'RISK_TOTAL',
      dataType: 'int',
      editable: false,
      header: { text: '개선전 위험성' },
      styleCallback: function(grid, dataCell) {
        let ret = { style: { background: '#FFFFFF' } }
        if (dataCell.value !== null && typeof dataCell.value !== 'undefined') {
          if (dataCell.value < 4) {
            ret = { style: { background: '#008000' } }
          } else if (dataCell.value < 8) {
            ret = { style: { background: '#ADFF2F' } }
          } else if (dataCell.value < 15) {
            ret = { style: { background: '#FFA500' } }
          } else {
            ret = { style: { background: '#FF0000' } }
          }
        }

        return ret
      },
      displayCallback: function (grd, idx, val) {
        let txt = ''
        let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)
        if (data.RISK_TOTAL < 4) {
          txt = data.RISK_TOTAL === null ? '' : data.RISK_TOTAL + '(매우낮음)'
        } else if (data.RISK_TOTAL < 8) {
          txt = data.RISK_TOTAL === null ? '' : data.RISK_TOTAL + '(낮음)'
        } else if (data.RISK_TOTAL < 15) {
          txt = data.RISK_TOTAL === null ? '' : data.RISK_TOTAL + '(위험)'
        } else {
          txt = data.RISK_TOTAL === null ? '' : data.RISK_TOTAL + '(매우위험)'
        }

        return txt
      },
    },
    { fieldName: 'RM_NM', dataType: 'text', styleName: 'left-column multiline-editor', editable: false, header: { text:'위험성 감소대책' } },
    // 담당자, 개선예정일은 현재 입력하거나 저장하는 로직이 없어서 임시로 숨기기처리하였음
    // 추후 유지보수 때 해당 기능 적용하여야함 (대시보드의 기간경과 감소대책과의 연계도 필요함)
    { fieldName: 'USR_INFO', dataType: 'text', editable: false, header: { text:'담당자' }, visible: false },
    { fieldName: 'IM_TOBE_DT', dataType: 'text', width: '110', editable: false, header: { text:'개선예정일' }, visible: false },
    { fieldName: 'SRSRM_TOTAL',
      dataType: 'int',
      editable: false,
      header: { text: '개선후 위험성' },
      styleCallback: function(grid, dataCell) {
        let ret = { style: { background: '#FFFFFF' } }
        if (dataCell.value !== null && typeof dataCell.value !== 'undefined') {
          if (dataCell.value < 4) {
            ret = { style: { background: '#008000' } }
          } else if (dataCell.value < 8) {
            ret = { style: { background: '#ADFF2F' } }
          } else if (dataCell.value < 15) {
            ret = { style: { background: '#FFA500' } }
          } else {
            ret = { style: { background: '#FF0000' } }
          }
        }

        return ret
      },
      displayCallback: function (grd, idx, val) {
        let txt = ''
        let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)
        if (data.SRSRM_TOTAL !== undefined) {
          if (data.SRSRM_TOTAL < 4) {
            txt = data.SRSRM_TOTAL + '(매우낮음)'
          } else if (data.SRSRM_TOTAL < 8) {
            txt = data.SRSRM_TOTAL + '(낮음)'
          } else if (data.SRSRM_TOTAL < 15) {
            txt = data.SRSRM_TOTAL + '(위험)'
          } else {
            txt = data.SRSRM_TOTAL + '(매우위험)'
          }
        } else {
          txt = ''
        }

        return txt
      },
    },
    { fieldName: 'SRSRM_DESC', dataType: 'text', styleName: 'left-column', editable: false,  header: { text:'조치결과' } },
    { 
      fieldName: 'FILE_TITLE', dataType: 'text', styleName: 'left-column', editable: false, header: { text:'첨부파일' },
      displayCallback: function (grd, idx, val) {
        let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)

        return data.FILE_TITLE === null ? '' : data.FILE_TITLE + (data.FILE_COUNT > 0 ? ' 외 ' + data.FILE_COUNT + '건' : '')
      },
    },
    { fieldName: 'APPR_STATUS', dataType: 'text', editable: false, header: { text:'결재상태' } },
    { fieldName: 'IM_COMPLETE_DT', dataType: 'text', editable: false, header: { text:'결재완료일' } },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', editable: false, header: { text:'문서번호' } },

    // 숨기는 필드 visible:'false'
    { fieldName: 'SRSRM_ID', dataType: 'text', visible: false },
    { fieldName: 'GUBUN_NM', dataType: 'text', visible: false },
    { fieldName: 'ACT_ID', dataType: 'text', visible: false },
    { fieldName: 'RISK_ID', dataType: 'text', visible: false },
    { fieldName: 'APPR_DT', dataType: 'text', visible: false },
    { fieldName: 'SRSRM_SORT', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'FILE_COUNT', dataType: 'text', visible: false },
    { fieldName: 'BEFOR_FRE', dataType: 'int', visible: false }, // 개선(전) 위험성 빈도
    { fieldName: 'BEFOR_MAT', dataType: 'int', visible: false }, // 개선(전) 위험성 강도
    { fieldName: 'AFTER_FRE', dataType: 'int', visible: false }, // 개선(후) 위험성 빈도
    { fieldName: 'AFTER_MAT', dataType: 'int', visible: false }, // 개선(후) 위험성 강도
  ],

  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 버튼 클릭 이벤트
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnReqApply') {
    if(userStore.userDiv === 'A'){
      approval()
    }
    else{
      approvalReq()
    }
  } else if (btn.id === 'btnDownLoad') {
    // 사업부명 가져오기
    const findBsns = codeList.BSNS_CD.find(el => el.BSNS_CD === searchParams.BSNS_CD)
    const isBsns = findBsns ? findBsns.BSNS_NM : ''

    // 부서명 가져오기
    const findDept = codeList.DEPT_CD.find(el => el.DEPT_CD === searchParams.DEPT_CD)
    const isDept = findDept ? findDept.DEPT_NM : ''

    // 협력사명 가져오기
    const findPartner = codeList.PARTNER_CD.find(el => el.ASGN_CD === searchParams.PARTNER_CD)
    const isPartner = findPartner.ASGN_CD !== '' ? findPartner.ASGN_NM : ''

    // 반기 text 가져오기
    const findHalf = codeList.HALF.find(el => el.COD === searchParams.HALF)
    const isHalf = findHalf ? findHalf.TXT : ''

    let excelFileNM = '중요위험 특별감소대책 관리_' + isBsns + '_' + isDept + (searchParams.PARTNER_CD ? '_' + isPartner : '') + '(' + searchParams.YEAR + '년 ' + isHalf + ')' +'.xlsx'

    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }
    
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.', 
      showProgress: true, 
      indicator: 'visible', 
      header: 'visible',
      footer: 'hidden', 
      allColumns: false,
    })
  }else if (btn.id === 'btnPartnerApply') {
    let result = await vm.$swal({ 
      title: t('승인 하시겠습니까?'), 
      showCancelButton: true,
    })    

    if(result.isConfirmed){
      let apprParams = []
      let checkedRows = grdMain.value.getGridView().getCheckedRows()
      let data = []
      
      if (checkedRows.length === 0) {
        return Message.warn(t('선택된 항목이 없습니다.'))
      }

      for (let i of checkedRows) {
        // 선택된 데이터 가져오기
        data = grdMain.value.getDataProvider().getJsonRow(i)
        apprParams.push({
          SCHEDULE_ID : data.SRSRM_ID,
          MENU_ID : 'RSKBA0030',
          USER_ID : userStore.userId,
        })
      }   

      await commonExecuteApi({ 
        queryId : 'OPRAB0010_SAVE_03',
        list: apprParams
      }).then(() => {
        Message.success(t('승인 되었습니다.')) 
      })
    }
  }
}

/* -------------- 조회 -------------- */
const searchData = () => {
  if(searchParams.BSNS_CD === '') {
    return Message.warn('사업부를 선택해주세요.')
  } else if(searchParams.DEPT_CD === '') {
    return Message.warn('부서를 선택해주세요.')
  }

  return commonSearchApi({ queryId : 'RSKBA0030_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
 
  console.log('search Data = ', res.ORESULT_CUR)



  menuTitle.value.disableBtn('btnReqApply', searchParams.DEPT_CD !== userStore.deptCd) //저장
  //menuTitle.value.disableBtn('btnPartnerApply', searchParams.ASGN_CD !== userStore.asgnCd)
  menuTitle.value.disableBtn('btnPartnerApply', false)

  // 데이터 길이에 따른 Column 너비 자동 조절
  grdMain.value.getGridView().fitLayoutWidth('WORK_STANDARD_NM', 200, 190, true) // 작업표준명
  grdMain.value.getGridView().fitLayoutWidth('ACT_NM', 135, 130, true) // 작업행동
  grdMain.value.getGridView().fitLayoutWidth('RISK_NM', 210, 200, true) // 위험요인
  grdMain.value.getGridView().fitLayoutWidth('RM_NM', 235, 200, true) // 위험성 감소대책
  grdMain.value.getGridView().fitLayoutWidth('USR_INFO') // 담당자
  grdMain.value.getGridView().fitLayoutWidth('FILE_TITLE') // 첨부파일
  grdMain.value.getGridView().fitLayoutWidth('WORK_STANDARD_ID', 300, 50, true) // 문서번호
}

// 사업부 변경 시 부서 변경 이벤트
/* watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  commonSearchApi({ 
    queryId : 'searchDept3',
    param : { 
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: newValue, 
      USE_DIV:'Y' 
    } 
  }).then(res => {
      codeList.DEPT_CD = res.ORESULT_CUR

      if (!oldValue) {
        return searchParams.DEPT_CD = userStore.deptCd
      }

      if (newValue !== oldValue) {
        // 사업부가 변경 시 부서 리스트의 첫 인덱스의 데이터를 출력
        if(!window.history.state.data){
          searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD
        }
      }
    })
})

// 부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: newValue } })
    .then(res => {
      codeList.PARTNER_CD = res.ORESULT_CUR
      codeList.PARTNER_CD.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
      if (codeList.PARTNER_CD.length !== 0 || !window.history.state.data) {
        searchParams.PARTNER_CD = ''
      }

      if(window.history.state.data){
        codeList.PARTNER_CD.forEach(e => {
          if(window.history.state.data.CORP_NM && window.history.state.data.CORP_NM === e.ASGN_NM){
            searchParams.PARTNER_CD = e.ASGN_CD
          }
        })
      }

    })
}) */

// 팝업이 닫힌 후 이벤트
const onEditPopup = el => {
  if (el === 'saveAfter') {
    commonSearchApi({ 
      queryId : 'RSKBA0030_SEARCH_01', 
      param: searchParams 
    }).then(res => {
      console.log(res)
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

// 셀 클릭 수정팝업 호출
const editPopupOpen = (grid, clickData) => {
  if (clickData.fieldIndex && clickData.fieldIndex > 2) {
    let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    editDataPopup.value.openPopup(data)
  }
}

router.afterEach(async (to, from, next) => {
  if(from.path === '/20_risk-assessment/RSK_A/RSKAB0010'){
    let data = await window.history.state.data
    console.log('afterEach data', data)

    searchParams.COMPANY_CD = data.COMP_CD
    searchParams.BSNS_CD = data.BSNS_CD
    await setDeptList(searchParams.BSNS_CD)
    searchParams.DEPT_CD = data.DEPT_CD
    await setPartnerList(searchParams.DEPT_CD)
    searchParams.PARTNER_CD = data.PARTNER_CD ? data.PARTNER_CD : ''
    searchParams.YEAR = data.YEAR
    searchParams.HALF = data.HALF

    commonStore.loading = false
    onButtonsClick({id: 'btnSearch'})
  }
})

// 결재
const approval = () => {
  let apprParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  let data = []
  
  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 항목이 없습니다.'))
  }

  for (let i of checkedRows) {
    // 선택된 데이터 가져오기
    data = grdMain.value.getDataProvider().getJsonRow(i)
    if(data.APPR_STATUS === 'SC_AD' || data.APPR_STATUS === 'SC_AP' ||data.APPR_STATUS === 'SC_AC' ){
      return Message.warn(t('선택된 항목 중에 결재중인 항목이 있습니다.'))
    }

    if(data.SRSRM_ID === '' || data.SRSRM_ID === null){
      return Message.warn(t('선택된 항목 중에 저장이 안된 항목이 있습니다. 저장 후 결재 상신 바랍니다.'))
    }

    apprParams.push(data)
  }

  approvalPopup.value.openPopup({
    RSK_RES_ID: 'S' + apprParams[0].SRSRM_ID,
    CLSS_ID : useLogsStore().vueId,
    TITLE : '[중요위험 특별감소대책] ' + apprParams[0].WORK_STANDARD_NM,
    CMPNY_DIV : userStore.cmpnyDiv,
    DATA_KEY : userStore.cmpnyDiv+';'+userStore.bsnsCd+';'+userStore.deptCd+';'+userStore.asgnCd+';'+searchParams.YEAR,
    REPORT : infoSet(apprParams),
    MODE : '3', //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE : '', //결재라인
  })
/*
  approvalPopup.value.openPopup({
      RSK_RES_ID: taskType + WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      CLSS_ID: useLogsStore().vueId,
      TITLE: (taskType === 'R' ? header : '(폐지)') + WORK_STANDARD_MASTER.WORK_STANDARD_NM,
      CMPNY_DIV: WORK_STANDARD_MASTER.COMPANY_CD,
      DATA_KEY: WORK_STANDARD_MASTER.COMPANY_CD + ';' +
                userStore.bsnsCd + ';' +
                userStore.deptCd + ';' +
                userStore.asgnCd + ';' +
                new Date().getFullYear(),
      //REPORT: '결재 내용?',
      REPORT: infoSet(taskType).apprContents,
      MODE: '3',
      FORM_ID: '421',
      CLRLINE: line
      //CLRLINE: 'CLR_15'
    }) */
}

const approvalResult = (res) => {
  console.log('approval Res =======', res)

  let apprParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  let data = []
  let srsrmID = ''
  
  for (let i of checkedRows) {
    // 선택된 데이터 가져오기
    data = grdMain.value.getDataProvider().getJsonRow(i)
    srsrmID += data.SRSRM_ID + ";"
  }
  
  console.log('srsrmID =', srsrmID)

  let apprType = res.appkey.substring(0, 1)
  let workId = res.appkey.substring(1)
  let draft = res.draft
  let approver = res.clrLine

  // 폐지인 경우, 앞의 두자리가 WD이므로 예외처리
  if(res.appkey.substring(0, 2) == 'WD')
  {
    apprType = res.appkey.substring(0, 2)
    workId = res.appkey.substring(2)
  }

  //console.log('apprType =', apprType)
  //console.log('workId =', workId)
  //console.log('draft =', draft)

  if(apprType == undefined || apprType == null)
    return

  let params = [{
    APPR_ID: res.appkey,
    APPR_TYPE: apprType,
    WORK_ID: srsrmID,
    DRAFT_USR: draft,
    //APPR_USR: draft + ';' + approver, // 기안자가 앞에 들어가고 결재자 넣기
    //APPR_COMMENT: '',
    WORK_DESC:  ''
  }]
  
  commonExecuteApi({ queryId: "PKG_CSX02_COMMON_COMM_APPROVAL", list: params  }).then( res => {
    // 결재상신 처리 후, 저장, 상신, 폐지 버튼 비활성화 시키기
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnReqApply', true)
    menuTitle.value.disableBtn('btnRskDel', true)
    
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

//널 체크 메서드
const isNull = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}
const isNullAndEmpty = (data) => {
  return isNull(data) ? '' : data
}

// 협력사 결재
const approvalReq = () =>{
  let apprParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  let data = []
  
  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 항목이 없습니다.'))
  }
  for (let i of checkedRows) {
    // 선택된 데이터 가져오기
    data = grdMain.value.getDataProvider().getJsonRow(i)
    data.CMPNY_DIV = userStore.cmpnyDiv
    data.FORM_ID = useLogsStore().vueId
    data.PATH = useLogsStore().path
    apprParams.push(data)
  }

  approvalPopupInApp.value.openPopup({
    WORK_TYPE: 'S',    // R: 위험성평가 제정/개정,  WD: 폐지
    PARAM: apprParams
  })
}

// 결재양식 세팅
const infoSet = val => {
  let html = ''
  val.forEach(item => {
    html += '<tr style="border : 1px solid black;" >'
    html += '<td style="border : 1px solid black;" >' + isNullAndEmpty(item.WORK_STANDARD_NM) + '</td>'
    html += '<td style="border : 1px solid black;" >' + isNullAndEmpty(item.RISK_NM) + '</td>'
    html += '<td style="border : 1px solid black;" >' + isNullAndEmpty(item.RM_NM) + '</td>'
    html += '<td style="border : 1px solid black;" >' + isNullAndEmpty(item.SRSRM_DESC) + '</td>'
    html += '</tr>'
  })

  let contents = ''
    contents = '아래와 같이 위험성평가 중요위험 특별감소대책 결과를 보고드리니, 확인 후 승인하여 주시기 바랍니다. ' +
      // '<table class="table_10" style="margin-bottom:5px;">' +
      // '<colgroup>' +
      // '<col style="width:13%">' +
      // '<col style="width:87%">' +
      // '</colgroup>' +
      // '<tbody>' +
      // '<tr>' +
      // '<th>구분</th>' +
      // '<td>' + val.GUBUN_NM + '</td>' +
      // '</tr>' +
      // '<tr>' +
      // '<th>표준번호</th>' +
      // '<td>' + val.SRSRM_ID +
      // // '-' + val.WORK_STANDARD_REVISION +
      // '</td>' +
      // '</tr>' +
      // '<tr>' +
      // '<th>표준서명</th>' +
      // '<td>' + val.WORK_STANDARD_NM + '</td>' +
      // '</tr>' +
      // '<tr>' +
      // '<th>위험요인</th>' +
      // '<td>' + val.RISK_NM + '</td>' +
      // '</tr>' +
      // '<tr>' +
      // '<th>조치결과</th>' +
      // '<td>' + val.SRSRM_DESC + '</td>' +
      // '</tr>' +
      // '<tr>' +
      // '<td colspan="2">' +
      '<a target="_blank" href="' +
      'http://' +
      window.location.hostname + (window.location.hostname === 'localhost' ? ':8080' : '') +
      '/hse/EXCEL/WORK_DETAIL2' +  // 테스트 향후 주소 변경해야함
      '?IN_EXCEL_TYPE=STD&IN_TRANS=ko&IN_WORK_STANDARD_ID=' + '&IN_USER_DIV=A' +
      val[0].WORK_STANDARD_ID +
      '">위험성평가 결과 상세보기(Hi-STANDARD)</a>' +
      html
      // '</td>' +
      // '</tr>' +
      // '</tbody>' +
      // '</table>'

  return apprBodyHtmlSet(contents)
}

// html 세팅
const apprBodyHtmlSet = contents => {
  let html = ''

  html = '<table class="table_10">'
  html += '<colgroup>'
  html += '<col style="width:100%">'
  html += '</colgroup>'
  html += '<tbody>'

  html += '<tr>'
  html += '<td colspan="2">'
  html += '<table style="border : 1px solid black;" class="table_10">'
  html += '<colgroup>'
  html += '<col style="width:15%">'
  html += '<col style="width:15%">'
  html += '<col style="width:15%">'
  html += '<col style="width:15%">'
  html += '</colgroup>'
  html += '<tbody>'
  html += '<tr style="border : 1px solid black;" >'
  html += '<th style="border : 1px solid black;" >작업표준</th>'
  html += '<th style="border : 1px solid black;" >위험요인</th>'
  html += '<th style="border : 1px solid black;" >위험성 감소대책</th>'
  html += '<th style="border : 1px solid black;" >조치결과</th>'
  html += '</tr>'
  html += contents
  html += '</tbody></table>'

  return html
}

// 부서 세팅
const setDeptList = async (bsnsCd) => {

await commonSearchApi({ 
    queryId : 'searchDept3', 
    param : { 
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: bsnsCd,
      USE_DIV: 'Y',
    }
  },
  {
    useProgress: false
  }
).then(async res => {
    codeList.DEPT_CD = res.ORESULT_CUR
    searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD

    // 부서 리스트 바뀔 때, 최상단으로 선택된 부서를 협력사 조회조건으로 전달
    await setPartnerList(searchParams.DEPT_CD)
  }
)
}

// 협력사 세팅
const setPartnerList = async (deptCd) => {  
await commonSearchApi({ 
    queryId : 'searchVend', 
    param : { 
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: deptCd,
      USE_DIV: 'Y',
    } 
  },
  {
       useProgress: false
  }
).then(async res => {
    // 협력사 바인딩, 최상단에 선택안함 추가하기
    codeList.PARTNER_CD = res.ORESULT_CUR
    codeList.PARTNER_CD.unshift({ ASGN_CD: '', ASGN_NM: '선택안함' })
    searchParams.PARTNER_CD = ''
  }
)
}



onMounted(async() => {
  await initCodeList()

  // 사업부 전체 추가
  codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD:'' })

  // 부서별 위험성평가 대시보드에서 작업표준 클릭 시 넘어오는 데이터
  if (window.history.state.data) {
    for (let i in window.history.state.data) {
      searchParams[i] = window.history.state.data[i]
    }
    onButtonsClick({id: 'btnSearch'})
  }
 

})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnReqApply', 'btnPartnerApply', 'btnDownLoad']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <!-- 조회조건 -->
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <!-- 회사 -->
            <i-select
              :label="$t('회사')"
              label-width="50px"
              width="270px"
              v-model="searchParams.COMPANY_CD"
              :items="codeList.COMPANY_CD"
              item-value="COD"
              item-title="TXT"
              readonly 
            />
            <!-- 사업부 -->
            <i-select
              :label="$t('사업부')"
              label-width="50px"
              width="270px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              @update:modelValue="e => setDeptList(e)"
            />
            <!-- 부서 -->
            <i-select
              :label="$t('부서')"
              label-width="50px"
              width="270px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              @update:modelValue="e => setPartnerList(e)"
            />
            <!-- 협력사 -->
            <i-select
              :label="$t('협력사')"
              label-width="50px"
              width="270px"
              v-model="searchParams.PARTNER_CD"
              :items="codeList.PARTNER_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
            />
            <!-- 기준년도 -->
            <i-select
              :label="$t('기준년도')"
              label-width="50px"
              width="270px"
              v-model="searchParams.YEAR"
              type="YEAR"
            />
            <!-- 반기 -->
            <i-select
              :label="$t('반기')"
              label-width="50px"
              width="270px"
              v-model="searchParams.HALF"
              :items="codeList.HALF"
              item-value="COD"
              item-title="TXT"
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellClicked="editPopupOpen"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>

  <editPopup
    ref="editDataPopup"
    @updated="onEditPopup"
  />
  <ApprovalPopupInApp ref="approvalPopupInApp"/>
  <ApprovalPopup ref="approvalPopup" @approvalClrLine="approvalResult"/>
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
    min-height: 700px;
  }
}

</style>
