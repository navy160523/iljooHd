<!--
  화면명 : 개인별안전화신청
  화면개요 : 개인 안전화 신청관리(현중은 수시신청 X)
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' //결재
import IGridTitle from '@/components/IGridTitle.vue'

import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
// import HLTHA0010Popup01 from './HLTHF0010Popup01.vue'

defineOptions({
  name: '100_health-HLT_H-HLTHA0010',
})

const codeList = reactive({
  //구분
  shoesKind: [],
  shoesSize: [],
  shoesCount: [],
  reqReason: [],
  dutyYn: [
    {COD: 'Y', TXT: '대상'},
    {COD: 'N', TXT: '비대상'},
  ]
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const grdMain = ref(null)
const selectDiv = ref('')
const tab = ref(null)

//신청자정보(읽기전용)
const empDept = ref('') //소속
const empNm = ref('') //이름
const empJobGroup = ref('') //직군
const empJobCat = ref('') //직렬
const empJobRole = ref('') //직무
const empPaymentCri = ref('') //지급기준
const dutyYn = ref('')

const reqYear = ref('') //해당연도
const reqDate = ref('') //신청날짜 수시신청시 활용
const reqCHA = ref(null) //신청시기 정기신청시 활용
const reqDeadLine = ref('') //마감기한
const reqShoesKind = ref('') //안전화종류
const reqShoesSize = ref('') //안전화사이즈
const reqCOUPONYN = ref('') //쿠폰여부
const reqINSOREYN = ref('') //보온깔창여부
const reqSHOESCOUNT = ref('') //신청수량
const reqDUTYYN = ref('') //대상여부
const reqSTATUSNM = ref('') //신청상태
const reqShoesVend = ref('') //안전화
const reqDiv = ref('A') //신청구분 A:정기, B수시
const reqVendName = ref('')
const reqReason = ref('')

const rYEAR = ref(null) //정기신청 파악을 위한 년도
const rCHA = ref(null) //정기신청 파악을 위한 시기
const rDeadLine = ref(null) //정기신청 파악을 위한 마감기한
const cReadonly = ref(false)
const iReadonly = ref(false)

const ReqCHA = ref([
  { TXT: '', COD: '' },
  { TXT: '상반기', COD: '1' },
  { TXT: '하반기', COD: '2' },
])

const tabhide = ref(true)

const imgUrl = ref(null);
const couponDisabled = ref(null)
const insoreDisabled = ref(null)
const shoesK = ref('')
const saveParam = ref([])

const appParam = ref([])

const approvalPopup = ref(null)

const isAdmin = ref(null)

const initCodeList = async () => {
  //안전화
  await commonSearchApi({
    queryId: 'HLTHA0010_COMBO_01',
    param: searchParam,
  }).then((res) => {
    console.log("안전화:",res)
    codeList.shoesKind = res.ORESULT_CUR
    if (codeList.shoesKind.length > 0) {
      codeList.shoesKind.unshift({ TXT: '', COD: '' })
      grdMain.value.setBindingColumn('SHOES_VEND', codeList.shoesKind, 'COD', 'TXT')
    }
  })  

  //안전화 사이즈
  Promise.all([
    //구분
    getCodeList('HHII720'),
    getCodeList('HHII740'),
    getCodeList('HHII730'),
  ]).then((res) => {
    codeList.shoesSize = res[0].ORESULT_CUR
    codeList.shoesCount = res[1].ORESULT_CUR
    codeList.reqReason = res[2].ORESULT_CUR
    if (codeList.shoesSize.length > 0) {
      codeList.shoesSize.unshift({ TXT: '', COD: '' })
    }
    if (codeList.shoesCount.length > 0) {
      codeList.shoesCount.unshift({ TXT: '', COD: '' })
    }
    if (codeList.reqReason.length > 0) {
      codeList.reqReason.unshift({ TXT: '', COD: '' })
      grdMain.value.setBindingColumn('REASON', codeList.reqReason, 'COD', 'TXT')
    }
  })
}

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업부
  EMP_NO: userStore.empNo, //사번
  ASGN_CD: userStore.asgnCd, 
  DEPT_CD: userStore.deptCd,
  YEAR: '', //신청년도
  REQ_DIV: '', //신청구분(A:정기신청, B:수시신청)
  REQ_CHA: '', //신청시기(1:상반기, 2:하반기)
  REQ_DT: '', //신청일자
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    {
      fieldName: 'YEAR',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('년도') },
    },
    {
      fieldName: 'REQ_DIV',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('구분') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REQ_CHA',
      dataType: 'text',
      width: '87',
      editable: false,
      header: { text: t('신청시기\n(신청일자)'), styleName: 'multi-line-css' },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'SHOES_VEND',
      dataType: 'text',
      width: '167',
      editable: false,
      lookupDisplay: true,
      header: { text: t('안전화 종류') },
      editor: {
        type: 'dropdown',
        textReadOnly: true,
        dropDownCount: 5,
        partialMatch: true,
        domainOnly: true,
        dropDownWhenClick: true,
      },
    },
    {
      fieldName: 'USER_GBN',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('직영여부') },
    },
    {
      fieldName: 'SHOES_SIZE',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('사이즈') },
    },
    {
      fieldName: 'SHOES_COUNT',
      width: '100',
      styleName: 'center-column',
      editable: false,
      header: { text: t('신청수량') },
    },
    {
      fieldName: 'COUPON_YN',
      width: '80',
      styleName: 'center-column',
      editable: false,
      header: { text: t('쿠폰여부') },
    },
    {
      fieldName: 'INSORE_YN',
      width: '80',
      styleName: 'center-column',
      editable: false,
      header: { text: t('보온 깔창여부') },
    },
    {
      fieldName: 'REASON',
      dataType: 'text',
      width: '180',
      styleName: 'left-column',
      editable: false,
      lookupDisplay: true,
      header: { text: t('신청사유') },
      editor: {
        type: 'dropdown',
        textReadOnly: true,
        dropDownCount: 5,
        partialMatch: true,
        domainOnly: true,
        dropDownWhenClick: true,
      },
    },
    {
      fieldName: 'REMARKS',
      width: '180',
      styleName: 'left-column',
      editable: false,
      header: { text: t('비고') },
    },
    //안보이는컬럼
    {
      fieldName: 'VEND_NAME',
      visible: false,
      header: { text: t('납품업체') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(async () => {
  if (useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTH001')) isAdmin.value = true
  reqYear.value = dayjs().format('YYYY')
  reqDate.value = dayjs().format('YYYY-MM-DD')

  await initCodeList()

  await GetEmpInfo()

  if (!userStore.userDiv || userStore.userDiv == 'B') {
    tabhide.value = false
  }

  if (userStore.cmpnyDiv && userStore.cmpnyDiv == 'HHI') {
    tabhide.value = false
  }

  if (userStore.cmpnyDiv == '320') {
    couponDisabled.value = true
    insoreDisabled.value = true
  } else {
    couponDisabled.value = false
    insoreDisabled.value = false
  }

  await onButtonsClick({ id: 'btnSearch' })

  if (!reqCHA.value) {
    reqCHA.value = parseInt(dayjs().format('MM')) <= 6 ? '1' : '2'
    // console.log("reqCHA:",reqCHA.value);
  }

  grdMain.value.getGridView().filterPanel.visible = true
})

const btnSet = async () => {
  menuTitle.value.disableBtn('btnApplication', true)
  menuTitle.value.disableBtn('btnReqCancel', true)
  menuTitle.value.disableBtn('btnApply', true)

  if (tab.value == 'tab1') {
    menuTitle.value.visibleBtn('btnApplication', true)
    menuTitle.value.visibleBtn('btnReqCancel', true)
    menuTitle.value.visibleBtn('btnApply', false)

    // console.log("reqSTATUSNM:",reqSTATUSNM.value)
    if (reqSTATUSNM.value == '지급완료'){
      menuTitle.value.disableBtn('btnReqCancel', true)
      menuTitle.value.disableBtn('btnApplication', true)
      cReadonly.value = true
      insoreDisabled.value = true
      couponDisabled.value = true
    } else if (reqSTATUSNM.value == '신청완료') {
      menuTitle.value.disableBtn('btnReqCancel', false)
      cReadonly.value = true
      insoreDisabled.value = true
      couponDisabled.value = true
    } else if (reqDeadLine.value == '') {
      menuTitle.value.disableBtn('btnApplication', true)
    } else {
      menuTitle.value.disableBtn('btnApplication', false)
      cReadonly.value = false
      insoreDisabled.value = false
      couponDisabled.value = false
    }
    if (reqDUTYYN.value == 'N') {
      menuTitle.value.disableBtn('btnApplication', true)
      menuTitle.value.disableBtn('btnReqCancel', true)
      menuTitle.value.disableBtn('btnApply', true)
    }
  } else {
    menuTitle.value.visibleBtn('btnApplication', true)
    menuTitle.value.visibleBtn('btnReqCancel', true)
    menuTitle.value.visibleBtn('btnApply', true)

    // console.log("reqSTATUSNM:",reqSTATUSNM.value)
    if (!reqSTATUSNM.value || reqSTATUSNM.value == '미신청') {
      menuTitle.value.disableBtn('btnApplication', false)
    } else if (reqSTATUSNM.value == '신청중') {
      menuTitle.value.disableBtn('btnReqCancel', false)
      menuTitle.value.disableBtn('btnApply', false)
    }
  }
}

const GetEmpInfo = () => {
  let empinfo

  return commonSearchApi({
    queryId: 'HLTHA0010_SEARCH_01',
    param: searchParam,
  }).then((res) => {
    console.log('empinfo: ', res.ORESULT_CUR)
    empinfo = res.ORESULT_CUR

    if (empinfo.length > 0) {
      // console.log("empinfo:",empinfo)
      empDept.value = empinfo[0].ASGN_FULL_NM
      empNm.value = empinfo[0].EMP_NM
      empJobGroup.value = empinfo[0].JOB_ROW_NM
      empJobCat.value = empinfo[0].STD_DUTY_NM
      empJobRole.value = empinfo[0].UNT_DUTY_NM
      empPaymentCri.value = empinfo[0].SHOES_COUNT
      dutyYn.value = empinfo[0].DUTY_YN
    }
  })
}
const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setBefore(beforeSearch).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnApplication') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('신청 하시겠습니까?')
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id == 'btnReqCancel') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('신청을 취소 하시겠습니까?')
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id == 'btnApply') {
    approval()
  }
  // else {
  //   new deleteFlowHelper(vm, t)
  //     .setBefore(beforeDelete)
  //     .setQuery(deleteData)
  //     .setAfter(afterDelete)
  //     .run()
  // }
}

const approval = async () => {
  appData.CMPNY_DIV = userStore.cmpnyDiv
  appData.YEAR = reqYear.value
  appData.REQ_DIV = reqDiv.value
  appData.REQ_DT = reqDate.value
  appData.EMP_NO = userStore.empNo
  appData.USER_ID = userStore.userId

  searchParam.CMPNY_DIV = userStore.cmpnyDiv
  searchParam.EMP_NO = userStore.empNo
  searchParam.YEAR = rYEAR.value
  searchParam.REQ_DIV = 'B'
  searchParam.REQ_CHA = ''
  searchParam.REQ_DT = reqDate.value.replace(/-/g, '')
  // console.log("수시searchParam:",searchParam);
  commonSearchApi({
    queryId: 'HLTHA0010_SEARCH_02',
    param: searchParam,
  }).then((res) => {
    approvalPopup.value.openPopup({
      CLSS_ID: 'HLTHA0010',
      TITLE: '부서별 안전화 수시신청',
      CMPNY_DIV: userStore.cmpnyDiv,
      DATA_KEY:
        userStore.cmpnyDiv + ';' + reqYear.value + ';' + reqDiv.value + ';' + reqCHA.value + ';' + userStore.empNo,
      REPORT: setReport(res.ORESULT_CUR), // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      CLRLINE: 'CLR_15', //결재라인
      // PARAM424 : '',  //사고보고서용 결재라인no,사번
    })
  })

  onButtonsClick({ id: 'btnSearch' })
}

const setReport = (data) => {
  let htmlReport
  // console.log(data)

  htmlReport =
    `<html>
  <head>
    <style>
        /* .div_style */
        #approval
        {
          width: 95%;
          align-items:center;
        }
        .Report_Header
        {
          width: 100%;
          height: 100px;
          border: 1px solid black;
          font-size: 25px;
          font-weight: bold;
          padding: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        
        #approval table {
          border-collapse: collapse;
          width: 100%;
          border: 1px solid black;
          table-layout: fixed;
        }

        #approval .table_head {
          padding: 4px;
          text-align: center; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          border: 1px solid black;
          margin-top: 2px;
          margin-bottom: 2px;
          font-weight: bold;
        }
        
        #approval .Content_header
        {
          padding: 4px;
          text-align: center; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          border: 1px solid black;
          margin-top: 2px;
          margin-bottom: 2px;
          font-size: 16px;
          font-weight: bold;
        }

        #approval .Content
        {
          padding: 4px;
          vertical-align: middle; /* 세로 가운데 정렬 */
          border: 1px solid black;
          margin-top: 2px;
          margin-bottom: 2px;
          font-size: 16px;
        }

        .table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
        }

        #appbody
        {
          justify-items: center;
          padding-top: 40px;
          padding-bottom: 40px;
          border-collapse: collapse;
          border: 1px solid black;
          width: 210mm;
          height: 297mm;
        }
    </style>
  </head>
  <body id="appbody">
  <div id='approval'>     
    <div class="Report_Header">
      <span>안전화 수시 신청서</span>
      <span>(직영외)</span>
    </div>
    <table class="table">
      <tr>
        <td class="table_head" style="width: 10%">사업부</td>
        <td class="table_head" style="width: 30%">` +
    data[0].ASGN_FULL_NM.split('-')[0] +
    `</td>
        <td class="table_head" style="width: 10%">부서</td>
        <td class="table_head" style="width: 30%">` +
    data[0].ASGN_FULL_NM.split('-')[1] +
    `</td>
        <td class="table_head" style="width: 15%">신청일자</td>
        <td class="table_head" style="width: 30%">` +
    dayjs(data[0].REQ_DT.split('T')[0]).format('YYYY년 MM월 DD일') +
    `</td>
      </tr>
    </table>
    <table class="table">
      <tr>
        <th class="Content_header" style="width : 5%" >No.</th>
        <th class="Content_header" style="width: 20%">소속</th>
        <th class="Content_header" style="width: 10%">이름</th>
        <th class="Content_header" style="width: 10%">직위</th>
        <th class="Content_header" style="width: 15%">안전화 종류</th>
        <th class="Content_header" style="width: 10%">사이즈</th>
        <th class="Content_header" style="width: 5%">수량</th>
        <th class="Content_header" style="width: 10%">사유</th>
        <th class="Content_header" style="width: 15%">비고</th>
      </tr>
      <tr>
        <td class="Content" style="width : 5%" >` +
    1 +
    `</td>
        <td class="Content" style="width: 20%; justify-items: start;">` +
    data[0].ASGN_FULL_NM.split('-')[1] +
    `</td>
        <td class="Content" style="width: 10%">` +
    isNullAndEmpty(data[0].EMP_NM) +
    `</td>
        <td class="Content" style="width: 10%">` +
    isNullAndEmpty(data[0].JOB_TIT_NM) +
    `</td>
        <td class="Content" style="width: 15%">` +
    data[0].SHOES_KIND_NM +
    `</td>
        <td class="Content" style="width: 10%">` +
    data[0].SHOES_SIZE +
    `</td>
        <td class="Content" style="width: 5%; justify-items: end;">` +
    data[0].SHOES_COUNT +
    `</td>
        <td class="Content" style="width: 10%">` +
    data[0].REASON_NM +
    `</td>
        <td class="Content" style="width: 15%">` +
    isNullAndEmpty(data[0].REMARKS) +
    `</td>
      </tr>
  </div>
  </body>
</html>`

  return htmlReport
}

const isNullCheck = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}

const isNullAndEmpty = (data) => {
  return isNullCheck(data) ? '' : data
}

const appData = reactive({})
const approvalAppkey = (appKey) => {
  appData.APPROVE_ID = appKey

  return commonExecuteApi({ queryId: 'HLTHA0010_SAVE_01', list: appData })
}

const beforeSearch = async () => {
  if (tab.value == 'tab1') {
    if (!(await checkPriod())) {
      menuTitle.value.disableBtn('btnApplication', true)
      menuTitle.value.disableBtn('btnReqCancel', true)
      menuTitle.value.disableBtn('btnApply', true)
    }
    //정기
    await dataSet1()
  } else {
    //수시
    await dataSet2()
  }

  await btnSet()

  return true
}

const dataSet1 = async () => {
  let resvalue
  searchParam.CMPNY_DIV = userStore.cmpnyDiv
  searchParam.EMP_NO = userStore.empNo
  searchParam.YEAR = rYEAR.value
  searchParam.REQ_DIV = 'A'
  searchParam.REQ_CHA = rCHA.value
  searchParam.REQ_DT = ''
  // console.log("정기searchParam:",searchParam)
  return commonSearchApi({
    queryId: 'HLTHA0010_SEARCH_02',
    param: searchParam,
  }).then((res1) => {
    resvalue = res1.ORESULT_CUR
    //  console.log("resvalue:",resvalue)
    if (resvalue.length > 0) {
      reqYear.value = resvalue[0].YEAR
      reqCHA.value = String(resvalue[0].REQ_CHA)
      reqShoesKind.value = resvalue[0].SHOES_KIND
      reqShoesSize.value = resvalue[0].SHOES_SIZE
      reqCOUPONYN.value = resvalue[0].COUPON_YN
      reqINSOREYN.value = resvalue[0].INSORE_YN
      reqSHOESCOUNT.value = resvalue[0].SHOES_COUNT
      reqDUTYYN.value = resvalue[0].DUTY_YN
      reqSTATUSNM.value = resvalue[0].STATUS_NM
      reqShoesVend.value = resvalue[0].SHOES_VEND
      reqDeadLine.value = rDeadLine.value
    } else {
      reqYear.value = rYEAR.value
      reqCHA.value = String(rCHA.value)
      reqShoesKind.value = ''
      reqShoesSize.value = ''
      reqCOUPONYN.value = 'N'
      reqINSOREYN.value = 'N'
      reqSHOESCOUNT.value = ''
      reqDUTYYN.value = 'N'
      reqShoesVend.value = ''
      reqSTATUSNM.value = '미신청'
      reqDeadLine.value = rDeadLine.value
    }
  })
}

const dataSet2 = async () => {
  let resvalue
  searchParam.CMPNY_DIV = userStore.cmpnyDiv
  searchParam.EMP_NO = userStore.empNo
  searchParam.YEAR = rYEAR.value
  searchParam.REQ_DIV = 'B'
  searchParam.REQ_CHA = ''
  searchParam.REQ_DT = reqDate.value.replace(/-/g, '')
  // console.log("수시searchParam:",searchParam);
  return commonSearchApi({
    queryId: 'HLTHA0010_SEARCH_02',
    param: searchParam,
  }).then((res) => {
    resvalue = res.ORESULT_CUR
    // console.log("resvalue:",resvalue)
    if (resvalue.length > 0) {
      reqYear.value = resvalue[0].YEAR
      reqDate.value = resvalue[0].REQ_DT.split('T')[0]
      reqShoesKind.value = resvalue[0].SHOES_KIND
      reqShoesSize.value = resvalue[0].SHOES_SIZE
      reqCOUPONYN.value = resvalue[0].COUPON_YN
      reqINSOREYN.value = resvalue[0].INSORE_YN
      reqSHOESCOUNT.value = resvalue[0].SHOES_COUNT
      reqDUTYYN.value = resvalue[0].DUTY_YN
      reqShoesVend.value = resvalue[0].SHOES_VEND
      reqSTATUSNM.value = resvalue[0].STATUS_NM
      reqReason.value = resvalue[0].REASON
      reqCHA.value = resvalue[0].REQ_CHA
    } else {
      reqYear.value = rYEAR.value
      reqDate.value = reqDate.value
      reqShoesKind.value = ''
      reqShoesSize.value = ''
      reqCOUPONYN.value = 'N'
      reqINSOREYN.value = 'N'
      reqSHOESCOUNT.value = ''
      reqDUTYYN.value = dutyYn.value
      reqShoesVend.value = ''
      reqSTATUSNM.value = '미신청'
      reqReason.value = ''
      reqCHA.value = ''
    }
  })
}

const checkPriod = async () => {
  //정기 신청기간 정보 조회
  let Priod

  return commonSearchApi({
    queryId: 'HLTHA0010_COMBO_02',
    param: { CMPNY_DIV: userStore.cmpnyDiv },
  }).then((res) => {
    Priod = res.ORESULT_CUR

    if (Priod.length > 0) {
      rYEAR.value = Priod[0].YEAR
      rCHA.value = Priod[0].REQ_CHA
      // rDeadLine.value = Priod[0].EN_DATE.split('T')[0]
      rDeadLine.value = Priod[0].EN_DATE

      // menuTitle.value.disableBtn('btnApplication',false)
      // menuTitle.value.disableBtn('btnReqCancel',false)
      // menuTitle.value.disableBtn('btnApply',false)
      return true
    } else {
      rYEAR.value = dayjs().format('YYYY')
      rCHA.value = parseInt(dayjs().format('MM')) <= 6 ? '1' : '2'
      rDeadLine.value = ''

      // tabhide.value=false;
      Message.warn(t('정기신청 기간이 아닙니다.'))

      // menuTitle.value.disableBtn('btnApplication',true)
      // menuTitle.value.disableBtn('btnReqCancel',true)
      // menuTitle.value.disableBtn('btnApply',true)

      return false
    }
    // else if(!shoesYN.value || shoesYN.value=='N')
    // {
    //   rYEAR.value=dayjs().format("YYYY")
    //   rCHA.value= (parseInt(dayjs().format("MM"))<=6) ? '1' : '2'
    //   rDeadLine.value=''

    //   Message.warn(t('안전화지급 대상부서가 아닙니다.'))

    //   menuTitle.value.disableBtn('btnApplication',true)
    //   menuTitle.value.disableBtn('btnReqCancel',true)
    //   menuTitle.value.disableBtn('btnApply',true)

    //   return false
    // }
  })
}

const searchData = () => {
  // console.log("searchParam:",searchParam)
  return commonSearchApi({
    queryId: 'HLTHA0010_SEARCH_03',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  onChangeShoes()
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  // changeReqCha()
}

const deleteData = () => {
  let deleteParam = []

  let deleteData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: reqYear.value,
    REQ_DIV: reqDiv.value,
    REQ_CHA: Number(reqCHA.value),
    EMP_NO: userStore.empNo,
    USER_ID: userStore.userId,
  }

  deleteParam.push(deleteData)

  // console.log("deleteParam:",deleteParam)
  return commonExecuteApi({
    queryId: 'HLTHA0010_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  menuTitle.value.disableBtn('btnApplication', false)
  menuTitle.value.disableBtn('btnReqCancel', true)
  menuTitle.value.disableBtn('btnApply', true)
  initiCode()
  onButtonsClick({ id: 'btnSearch' })
}

const beforeSave = async () => {
  saveParam.value = []
  let data = ref([])

  if(reqDiv.value=='A')
  {
    reqReason.value='09'
  }

  if (!(await checkPriod())) {
    return false
  }

  if (!(await valiedChk())) {
    return false
  }

  (data.CMPNY_DIV = userStore.cmpnyDiv), //회사
    (data.EMP_NO = userStore.empNo), //사번
    (data.YEAR = reqYear.value),
    (data.REQ_DIV = reqDiv.value),
    (data.REQ_CHA = Number(reqCHA.value)),
    (data.REQ_DT = reqDate.value),
    (data.BSNS_CD = userStore.bsnsCd),
    (data.DEPT_CD = userStore.deptCd),
    (data.DIVISION = 'A'),
    (data.SHOES_KIND = shoesK.value),
    (data.SHOES_SIZE = reqShoesSize.value),
    (data.SHOES_COUNT = reqSHOESCOUNT.value),
    (data.COUPON_YN = reqCOUPONYN.value),
    (data.INSORE_YN = reqINSOREYN.value),
    (data.DUTY_YN = reqDUTYYN.value),
    (data.USER_DIV = userStore.userDiv),
    (data.REASON = reqReason.value)
  data.VEND = reqVendName.value
  data.SAVE_YN = 'N'
  data.USER_ID = userStore.userId

  saveParam.value.push(data)
  return true
}

const saveData = () => {
  // console.log("saveParam:",saveParam.value);
  return commonExecuteApi({ queryId: 'HLTHA0010_SAVE_01', list: saveParam.value })
}

const afterSave = () => {
  // let result
  // result=res.ORESULT_CUR
  onButtonsClick({ id: 'btnSearch' })
}

const valiedChk = async () => {
  if (tab.value == 'tab1') {
    if (reqCOUPONYN.value == 'N') {
      if (!reqShoesVend.value) {
        Message.warn(t('안전화 종류는 필수입력 사항입니다.'))
        return false
      }

      if (!reqShoesSize.value) {
        Message.warn(t('안전화 사이즈는 필수입력 사항입니다.'))
        return false
      }

      if (!reqSHOESCOUNT.value) {
        Message.warn(t('신청수량은 필수입력 사항입니다.'))
        return false
      }
    }
    return true
  } else {
    if (!reqShoesVend.value) {
      Message.warn(t('안전화 종류는 필수입력 사항입니다.'))
      return false
    }
    if (!reqShoesSize.value) {
      Message.warn(t('안전화 사이즈는 필수입력 사항입니다.'))
      return false
    }
    if (!reqSHOESCOUNT.value) {
      Message.warn(t('신청수량은 필수입력 사항입니다.'))
      return false
    }
    if (!reqReason.value) {
      Message.warn(t('신청사유는 필수입력 사항입니다.'))
      return false
    }
    return true
  }
}

const onChangeShoes = () => {
  try {
    let fileId = ''
    let iSearchParam = reactive({})
    let fResult
    imgUrl.value = ''

    // shoesK.value = codeList.shoesKind.find((item) => item.COD == reqShoesVend.value).SHOES_NAME
    shoesK.value = codeList.shoesKind.find((item) => item.COD == reqShoesVend.value).ITEM_NAME
    
    fileId = codeList.shoesKind.find((item) => item.COD == reqShoesVend.value).FILE_ID
    
    reqVendName.value = codeList.shoesKind.find((item) => item.COD == reqShoesVend.value).VEND
    
    if (!reqSHOESCOUNT.value || reqSHOESCOUNT.value == 0) {
      reqSHOESCOUNT.value = 1
    }

    if (reqShoesVend.value && reqCOUPONYN.value == 'Y') {
      reqCOUPONYN.value = 'N'
      insoreDisabled.value = false
    }

    if (!['100', '101', '102', '108'].includes(shoesK.value)) {
      reqINSOREYN.value = 'N'
    }
    
    commonSearchApi({
      queryId: 'HLTHA0010_SEARCH_04',
      param: { CMPNY_DIV: userStore.cmpnyDiv, FILE_ID: fileId },
    }).then((res) => {
      fResult = res.ORESULT_CUR
      if (fResult.length > 0) {
        iSearchParam.CMPNY_DIV = userStore.cmpnyDiv
        iSearchParam.FILE_ID = fileId
        iSearchParam.FILE_NO = fResult[0].FILE_NO
        iSearchParam.FILE_TITLE = fResult[0].FILE_TITLE
        iSearchParam.FILE_NAME_ORIGINAL = fResult[0].FILE_NAME_ORIGINAL
        iSearchParam.FILE_NAME = fResult[0].FILE_NAME
        iSearchParam.FILE_PATH = fResult[0].FILE_PATH
        iSearchParam.FILE_TYPE = fResult[0].FILE_TYPE
        iSearchParam.FILE_SIZE = fResult[0].FILE_SIZE
        iSearchParam.USER_ID = fResult[0].USER_ID
        
          commonDownloadFilesApi(iSearchParam).then((res1) => {
            const blob = new Blob([res1])
            imgUrl.value = URL.createObjectURL(blob)
          })
      } else {
        imgUrl.value = '/noimage.png'
      }
    })

  } catch {}
}
const insoreChanged = () => {
  if (reqCHA.value != '2') {
    reqINSOREYN.value = 'N'
    return Message.warn(t('신청기간이 하반기일때만 선택됩니다.'))
  } else if (!['100', '101', '102', '108'].includes(shoesK.value)) {
    reqINSOREYN.value = 'N'
    return Message.warn(t('안전화종류가 8인치 일때만 선택됩니다.'))
  } else if (empPaymentCri.value != '12') {
    reqINSOREYN.value = 'N'
    return Message.warn(t('지급기준이 1년2착일때만 선택됩니다.'))
  }
}

const couponChanged = () => {
  if (reqCOUPONYN.value == 'Y') {
    if (reqShoesVend.value) {
      reqShoesVend.value = ''
      onChangeShoes(reqShoesVend.value)
    }

    if (reqShoesSize.value) {
      reqShoesSize.value = ''
    }

    if (reqSHOESCOUNT.value) {
      reqSHOESCOUNT.value = ''
    }

    if (reqINSOREYN.value == 'Y') {
      reqINSOREYN.value = 'N'
    }
    insoreDisabled.value = true
  } else {
    insoreDisabled.value = false
  }
}
const onTabChange = () => {
  if (tab.value == 'tab1') {
    reqDiv.value = 'A'
    menuTitle.value.visibleBtn('btnApply', false)
  } else {
    reqDiv.value = 'B'
    menuTitle.value.visibleBtn('btnApply', true)
  }
  // console.log("reqDiv:",reqDiv.value)
}

const initiCode = () => {
  (shoesK.value = ''),
    (reqShoesSize.value = ''),
    (reqSHOESCOUNT.value = ''),
    (reqCOUPONYN.value = ''),
    (reqINSOREYN.value = ''),
    (reqReason.value = '')
    reqVendName.value = ''
}

const inputStyle = () =>{
  if(reqSTATUSNM.value === '지급완료'){
    return { backgroundColor: '#C0FFFF'}
  }else{
    return { backgroundColor: null}
  }
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnApplication', 'btnReqCancel', 'btnApply']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('소속')"
              type="text"
              labelWidth="40px"
              width="350px"
              margin="1%"
              v-model="empDept"
              readonly
            />
            <i-input
              :label="$t('이름')"
              type="text"
              labelWidth="40px"
              width="180px"
              margin="1%"
              v-model="empNm"
              readonly
            />
            <i-input
              :label="$t('직군')"
              type="text"
              labelWidth="40px"
              width="180px"
              margin="1%"
              v-model="empJobGroup"
              readonly
            />
            <i-input
              :label="$t('직렬')"
              type="text"
              labelWidth="40px"
              width="180px"
              margin="1%"
              v-model="empJobCat"
              readonly
            />
            <i-input
              :label="$t('직무')"
              type="text"
              labelWidth="40px"
              width="180px"
              margin="1%"
              v-model="empJobRole"
              readonly
            />
            <i-select
              :label="$t('지급기준')"
              type="text"
              labelWidth="50px"
              width="180px"
              margin="1%"
              :items="codeList.shoesCount"
              item-value="COD"
              item-title="TXT"
              v-model="empPaymentCri"
              readonly
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <VTabs v-model="tab" @update:modelValue="onTabChange">
            <VTab value="tab1">정기신청</VTab>
            <VTab value="tab2" v-show="tabhide">수시신청</VTab>
          </VTabs>
          <VWindow v-model="tab">
            <VWindowItem value="tab1">
              <v-sheet class="d-flex">
                <v-sheet width="70%">
                  <v-sheet class="d-flex mb-1">
                    <i-input
                      :label="$t('해당연도')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      v-model="reqYear"
                      readonly
                      top-label
                      :disabled="true"
                    />
                    <!-- bgColor="#ffa" -->
                    <i-select
                      :label="$t('신청시기')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      :items="ReqCHA"
                      item-title="TXT"
                      item-value="COD"
                      v-model="reqCHA"
                      readonly
                      top-label
                      :disabled="true"
                    />
                    <!-- :items=""
                          item-value=""
                          item-title="" -->
                    <i-input
                      :label="$t('마감기한')"
                      type="date"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      v-model="reqDeadLine"
                      readonly
                      top-label
                      :disabled="true"
                    />
                    <i-select
                      :label="$t('대상여부')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      v-model="reqDUTYYN"
                      :items="codeList.dutyYn"
                      item-value="COD"
                      item-title="TXT"
                      readonly
                      top-label
                      :disabled="true"
                    />
                  </v-sheet>
                  <v-sheet class="d-flex mb-1">
                    <i-select
                      :label="$t('안전화종류')"
                      type="text"
                      labelWidth="100px"
                      width="612px"
                      margin="1%"
                      :items="codeList.shoesKind"
                      item-value="COD"
                      item-title="TXT"
                      v-model="reqShoesVend"
                      @update:modelValue="onChangeShoes"
                      required
                      top-label
                      :readonly="cReadonly"
                    />
                    <i-select
                      :label="$t('사이즈')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      :items="codeList.shoesSize"
                      item-value="COD"
                      item-title="TXT"
                      v-model="reqShoesSize"
                      required
                      top-label
                      :readonly="cReadonly"
                    />

                    <i-input
                      :label="$t('신청수량')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      v-model="reqSHOESCOUNT"
                      required
                      top-label
                      readonly
                      :disabled="true"
                    />
                  </v-sheet>
                  <v-sheet class="d-flex mb-1">
                    <!-- <i-input 
                          :label="$t('쿠폰여부')" type="checkbox"
                          labelWidth="100px"
                          width="300px"
                          margin="1%"
                          v-model="reqCOUPONYN"
                          class="custom-checkbox"
                        /> -->
                    <div class="d-flex custom-checkbox">
                      <div class="formLabelText custom-div">
                        {{ $t('쿠폰여부') }}
                      </div>
                      <v-checkbox
                        class="checkbox"
                        v-model="reqCOUPONYN"
                        true-value="Y"
                        false-value="N"
                        :disabled="couponDisabled"
                        @change="couponChanged"
                      />
                    </div>
                    <div class="d-flex custom-checkbox">
                      <div class="formLabelText custom-div">
                        {{ $t('보온깔창여부') }}
                      </div>
                      <v-checkbox
                        class="checkbox"
                        true-value="Y"
                        false-value="N"
                        v-model="reqINSOREYN"
                        :disabled="insoreDisabled"
                        @change="insoreChanged"
                      />
                    </div>
                    <i-input
                      :label="$t('신청상태')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      v-model="reqSTATUSNM"
                      readonly
                      top-label
                      :disabled="true"
                      :style="inputStyle"
                    />
                  </v-sheet>
                </v-sheet>
                <v-sheet width="30%">
                  <v-img :src="imgUrl == '' ? '/noimage.png' : imgUrl" height="150" width="240" style="margin: 10px" />
                </v-sheet>
              </v-sheet>
            </VWindowItem>
            <VWindowItem value="tab2">
              <v-sheet v-if="userStore.cmpnyDiv == '200'">
                <span :style="{ color: 'RoyalBlue', margin: '5px' }">{{
                  '일렉트릭 : 4인치 절연화, 8인치 일반화(지퍼부착형)만 신청가능(울산 外 근무자는 메일로 파우치 요청)'
                }}</span>
                <span :style="{ color: 'RoyalBlue', margin: '5px' }">{{
                  '일렉트릭 : 매주 화,목 13:00~14:00 안전용품실 직접수령 (수령 전 재고 확인 必)'
                }}</span>
              </v-sheet>
              <v-sheet class="d-flex">
                <v-sheet width="50%">
                  <v-sheet class="d-flex">
                    <i-input
                      :label="$t('해당연도')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      v-model="reqYear"
                      readonly
                      top-label
                      bgColor="#ffa"
                    />
                    <i-input
                      :label="$t('신청일자')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      v-model="reqDate"
                      readonly
                      top-label
                      bgColor="#ffa"
                    />
                    <i-input
                      :label="$t('신청상태')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      v-model="reqSTATUSNM"
                      readonly
                      bgColor="#ffa"
                      top-label
                    />
                  </v-sheet>
                  <v-sheet class="d-flex mb-1">
                    <i-select
                      :label="$t('안전화종류')"
                      type="text"
                      labelWidth="100px"
                      width="615px"
                      margin="1%"
                      :items="codeList.shoesKind"
                      item-value="COD"
                      item-title="TXT"
                      v-model="reqShoesVend"
                      top-label
                      @update:modelValue="onChangeShoes"
                      required
                      :readonly="cReadonly"
                    />
                    <i-select
                      :label="$t('사이즈')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      :items="codeList.shoesSize"
                      item-value="COD"
                      item-title="TXT"
                      top-label
                      v-model="reqShoesSize"
                      required="true"
                      :readonly="cReadonly"
                    />
                  </v-sheet>
                  <!-- <v-sheet class="d-flex mb-1"> -->
                  <!-- <i-input 
                          :label="$t('쿠폰여부')" type="checkbox"
                          labelWidth="100px"
                          width="300px"
                          margin="1%"
                          v-model="reqCOUPONYN"
                          class="custom-checkbox"
                        /> -->
                  <!-- <div class="d-flex custom-checkbox" margin="1%">
                          <div class="formLabelText custom-div">
                            {{ $t('쿠폰여부') }}
                          </div>
                          <v-checkbox 
                          class="checkbox"
                          v-model="reqCOUPONYN"
                          true-value="Y"
                          false-value="N"
                          :disabled="couponDisabled"
                          @change="couponChanged"/>
                        </div>
                        <div class="d-flex custom-checkbox" margin="1%">
                          <div class="formLabelText custom-div">
                            {{ $t('보온깔창여부') }}
                          </div>
                          <v-checkbox 
                          class="checkbox"
                          v-model="reqINSOREYN"
                          true-value="Y"
                          false-value="N"
                          :disabled="insoreDisabled"
                          @change="insoreChanged"/>
                        </div> -->
                  <!-- <i-input 
                          :label="$t('보온깔창여부')" type="checkbox"
                          labelWidth="100px"
                          width="300px"
                          margin="1%"
                          v-model="reqINSOREYN"
                          class="custom-checkbox"
                        /> -->
                  <!-- <i-input 
                          :label="$t('신청수량')" type="text"
                          labelWidth="100px"
                          width="300px"
                          margin="1%"
                          top-label
                          v-model="reqSHOESCOUNT"
                        /> -->
                  <!-- </v-sheet> -->
                  <v-sheet class="d-flex mb-1">
                    <!-- <i-input 
                          :label="$t('대상여부')" type="text"
                          labelWidth="100px"
                          width="300px"
                          margin="1%"
                          v-model="reqDUTYYN"
                          readonly
                          top-label
                          bgColor="#ffa"
                        /> -->

                    <i-select
                      :label="$t('신청사유')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      :items="codeList.reqReason"
                      item-value="COD"
                      item-title="TXT"
                      v-model="reqReason"
                      top-label
                      required="true"
                    />
                    <i-input
                      :label="$t('신청수량')"
                      type="text"
                      labelWidth="100px"
                      width="300px"
                      margin="1%"
                      top-label
                      v-model="reqSHOESCOUNT"
                      readonly
                      bgColor="#ffa"
                    />
                  </v-sheet>
                </v-sheet>
                <v-sheet width="50%">
                  <v-img :src="imgUrl" height="100" width="180" style="margin: 10px" />
                </v-sheet>
              </v-sheet>
            </VWindowItem>
          </VWindow>
          <v-sheet class="h-auto">
            <IGridTitle :title="$t('지급내역')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            >
            </RealGrid>
          </v-sheet>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
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

.multi-line-css {
  white-space: pre;
}

.custom-checkbox {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 300px;
  // align-items: center;
  // justify-items: flex-start;
  margin-right: 12px;
}

.custom-div {
  display: flex;
  width: 100px;
  align-items: center;
  justify-items: flex-start;
  margin-right: 8px;
}

.checkbox {
  width: 300px;
}
</style>
