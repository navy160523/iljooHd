<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonSearchMySqlApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonRequest,
  commonSendApi,
  commonSendFirebase,
  commonWordExportApi,
  chatbotTranslateLn,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import ImageViewerPopup from '@/components/popup/ImageViewerPopup.vue'
import {
  required,
  passwordValidator,
  confirmedValidator,
  emailValidator,
  lengthValidator,
} from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { getJsonFromExcel } from '@/utils/excel'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import TemplatePopup_01 from '@/pages/00_sample/templatePopup_01.vue'
import SendSMSPopUp from '@/components/popup/SendSMSPopUp.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import OZReport from '@/components/OZReport.vue'
import { getQDomain } from '@/utils/common'
import { excelDown } from '@/utils/excel'
import IButtonList from '@/components/IButtonList.vue'

defineOptions({
  name: '00_sample-template',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const appDoc = ref(null)
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const deptPopup = ref(null)
const empPopup = ref(null)
const approvalPopup = ref(null)
const templatePopup_01 = ref(null)
const newChip = ref('')
const chips = reactive([])
const imageViewerPopup = ref(null)
const sendSMSPopup = ref(null)
const sendMailPopup = ref(null) //메일 발송 팝업
const saveParams= ref([])
const addChip = () => {
  if (newChip) {
    chips.push(newChip)
    newChip.value = ''
  }
}

const removeChip = (index) => {
  splice(index, 1)
}
// OzReport 팝업 여부
const showOz = ref(false)
const params = ref([])
const reportName = ref('/manage/hse/EDUBA0030.ozr')

//조회조건
let searchParams = reactive({
  COL1: '',
  COL2: '',
  COL3: '',
  COL4: '',
  COL5: '',
  COL6: '',
  COL7: '',
  COL8: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  EMAIL: '',
  TAREA: '',
  EMP_NO : '',
  CMPNY_DIV : '',
  ORGN_DIV : '',
  OZ_EMP_NO : 'X130875',
  TRAN_LANG : 'en',
  TRAN_TEXT : '',
  TRAN_RESULT : '',
})

// 엑셀용 Param
// 자세한 내용은 excel.js 확인
let excelParam = {
  '분류' : 'DIVISION',
  '교육명' : 'CURR_NM',
  '대상' : 'TARGET',
  '삭제여부' : 'DELETE_YN',
  'SLI 반영여부' : 'SLI_YN',
  '모니터링 대상여부' : 'MONITOR_YN',
}
//조회조건
const excelSearchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DIVISION_MAIN: '',
  MNG_ORGN: '',
  CURR_NM: '',
  DELETE_YN: 'N',
  CURR_ID: '',
  USER_ID: userStore.userId,
})
let id = "EDUAA0020_TAB01_SEARCH02"
let sheetName = "교육 강좌 리스트"
let fileName = "교육 강좌 리스트"


//console.log('cmpnyDiv', userStore)

//코드리스트 선언
const codeList = reactive({
  cmpnyDiv: [], // 회사구분
  bsnsCd: [], //사업부
  deptCd : [],  //부서
  // orgnDiv: [
  //   // { COD: "", TXT: "전체" },
  //   { COD: 'A', TXT: '직영' },
  //   { COD: 'B', TXT: '사내협력사' },
  //   { COD: 'D', TXT: '단기공사' },
  //   { COD: 'Z', TXT: '기타' },
  // ],
  orgnDiv : [], //소속구분
  asgnCd : [{ ASGN_NM: '전체', ASGN_CD: '' }], //협력사
  accdntType: [],
  proc: [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, USE_DIV:'Y' } }), // 부서
    getCodeList('HHID210'), //소속구분
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, DEPT_CD:userStore.deptCd, USE_DIV:'Y' } }), // 협력사
    // commonSearchApi({
    //   queryId: 'searchBSNS',
    //   param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
    // }),
    getCodeList('HHIB010A'),
    getCodeList('HHII626D'),
  ]).then((res) => {
    console.log('codeList', res)
    // 회사구분
    codeList.cmpnyDiv = res[0].ORESULT_CUR

    // 사업부 설정
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })

    // 부서 설정
    codeList.deptCd = res[2].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

    // 소속구분
    codeList.orgnDiv = res[3].ORESULT_CUR
    codeList.orgnDiv.unshift({TXT : '전체', COD : ''})

    // 협력사
    codeList.asgnCd = res[4].ORESULT_CUR
    codeList.asgnCd.unshift({ASGN_NM : '전체', ASGN_CD : ''})

    
    codeList.accdntType = res[5].ORESULT_CUR
    codeList.proc = res[6].ORESULT_CUR

    searchParams.BSNS_CD = codeList.bsnsCd[0].BSNS_CD

    codeList.bsnsCd.push({ BSNS_CD: '04', BSNS_NM: '04' })
    grdMain.value.setBindingColumn('COL02', codeList.accdntType, 'COD', 'TXT')
    grdMain.value.setBindingColumn(
      'COL04',
      codeList.bsnsCd,
      'BSNS_CD',
      'BSNS_NM'
    )
  })
}

// 사업부가 바뀌면 부서 데이터 가져옴 오고 소속구분 협력사는 초기화
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  searchParams.DEPT_CD = ''
  searchParams.ASGN_CD = ''
  searchParams.ORGN_DIV = ''
  if(isNullCheck(newValue)){
    codeList.deptCd = []
    codeList.deptCd.unshift({ DEPT_NM:'전체', DEPT_CD:'' })

    // 협력사 리셋
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })

    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
      searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
    }).finally(() => {
    })
})

// 부서가 바뀌면 소속구분 적립컨텐츠 사번 성명 초기화
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  searchParams.ASGN_CD = ''
  searchParams.ORGN_DIV = ''
  if(isNullCheck(newValue)){

    // 협력사 리셋
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
    return
  }
})

// 소속구분이 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.ORGN_DIV, (newValue, oldValue) => {
  searchParams.ASGN_CD = ''
  if(isNullCheck(newValue)){
    // 협력사 리셋
    codeList.asgnCd = []
    codeList.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
    return
  }
  if(newValue === 'B' && searchParams.DEPT_CD != ''&& searchParams.BSNS_CD != ''){
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD } })
    .then(res => {
      codeList.asgnCd = []
      codeList.asgnCd = res.ORESULT_CUR
      codeList.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      searchParams.ASGN_CD = codeList.asgnCd[0].ASGN_CD
    })
  }
})

//널 체크 이벤트
const isNullCheck = data => {
  return (data === undefined || data === null || data === '') ? true : false
}

// // 사업부가 바뀌면 부서 데이터 가져옴
// watch(
//   () => searchParams.BSNS_CD,
//   (newValue, oldValue) => {
//     console.log('newValue : ', newValue)
//     commonSearchApi({
//       queryId: 'searchDept3',
//       param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
//     }).then((res) => {
//       codeList.deptCd = res.ORESULT_CUR
//       codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
//       searchParams.DEPT_CD = '전체'
//     })
//   }
// )

// // 부서가 바뀌면 협력사 데이터 가져옴
// watch(
//   () => searchParams.DEPT_CD,
//   (newValue, oldValue) => {
//     console.log('newValue : ', newValue)
//     commonSearchApi({
//       queryId: 'searchVend',
//       param: {
//         CMPNY_DIV: userStore.cmpnyDiv,
//         BSNS_CD: searchParams.BSNS_CD,
//         DEPT_CD: newValue,
//       },
//     }).then((res) => {
//       codeList.asgnCd = res.ORESULT_CUR
//       codeList.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
//       searchParams.ASGN_CD = '전체'
//     })
//   }
// )

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys: ['COL01'],
  fields: [
    { fieldName: 'COL01', dataType: 'text', header: { text: t('text') } },
    { fieldName: 'COL02', dataType: 'text', header: { text: t('select'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true
      , editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'COL03', dataType: 'text', header: { text: t('number') }, numberFormat: '#,##0.##', styleName: 'right-column'
      , editor: { type: 'number', textAlignment: 'far', editFormat: '#,##0.##' } },
    { fieldName: 'COL04', dataType: 'text', header: { text: t('multi check') }, lookupDisplay: true
      , editor: {
        type: 'checklist',
        textReadOnly: true,
        showAllCheck: true,
        showButtons: true,
        allCheckText: t('전체선택'),
        acceptText: t('확인'),
        cancelText: t('취소'),
      } 
    },
    { fieldName: 'COL05', dataType: 'datetime', header: { text: t('datetime') }, styleName: 'center-column editable_column'
      ,editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      }
      , datetimeFormat: 'yyyy-MM-dd' 
    },
    { fieldName: 'COL06', dataType: 'text', header: { text: t('memo') }, styleName: 'multiline-editor', editor: { type: 'multiline' } },
    { fieldName: 'COL07', dataType: 'text', header: { text: t('Popup') }, button: 'action' },
    { fieldName: 'COL08', dataType: 'text', header: { text: t('check') }, styleName: 'center-column'
      , editable: false, renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' } 
    },
  ],
  columns: [],
})

// const grdSubProps = reactive({
//   gridViewOption: { header: { height: 60 } },
//   fields: [
//     { fieldName: 'COL01', dataType: 'text' },
//     { fieldName: 'COL02', dataType: 'text' },
//     { fieldName: 'COL03', dataType: 'text' },
//     { fieldName: 'COL04', dataType: 'text' },
//     { fieldName: 'COL05', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd' },
//     { fieldName: 'COL06', dataType: 'text' },
//     { fieldName: 'COL08', dataType: 'text' },
//   ],
//   columns: [
//     {
//       name: 'COL01',
//       fieldName: 'COL01',
//       width: '100',
//       required: true,
//       header: { text: t('text') },
//     },
//     {
//       name: 'COL02',
//       fieldName: 'COL02',
//       width: '120',
//       header: { text: t('combo') },
//     },
//     {
//       name: 'COL03',
//       fieldName: 'COL03',
//       width: '100',
//       header: { text: t('spin') },
//     },
//     {
//       name: 'COL04',
//       fieldName: 'COL04',
//       width: '120',
//       header: { text: t('multi check') },
//     },
//     {
//       name: 'COL05',
//       fieldName: 'COL05',
//       width: '120',
//       header: { text: t('datetime') },
//       editor: { datetimeFormat: 'yyyy-MM-dd' },
//     },
//     {
//       name: 'COL06',
//       fieldName: 'COL06',
//       width: '120',
//       header: { text: t('Popup') },
//     },
//     {
//       name: 'COL08',
//       fieldName: 'COL08',
//       type: 'data',
//       width: '120',
//       header: { text: t('checkBox') },
//     },
//   ],
//   columnLayout: [
//     'COL01',
//     'COL02',
//     {
//       name: '그룹COL',
//       direction: 'horizontal',
//       items: ['COL03', 'COL04'],
//       header: { text: t('그룹COL') },
//     },
//     'COL05',
//   ],
// })

// 그리드 세팅
grdMainProps.columns = grdMainProps.fields
// grdSubProps.columns = grdSubProps.fields

//초기 데이터셋팅
onMounted(() => {
  initCodeList()

  //searchParams.COL1 = 'X130875' //key : TEXT
  /*
  searchParams.COL2 = userStore.company     //autocomplates
  searchParams.COL3 = dayjs().get("year")   //spin
  searchParams.COL4 = ""                    //multi autocomplates
  searchParams.COL5 = dayjs().format("YYYY-MM-DD")  //date
  searchParams.COL6 = ""                    //Popup
  searchParams.COL7 = ""                    //radio  
  */
})

/*grid load 이벤트************************************************/
const loaded = () => {
  console.log('loaded')

  //그리드 validation 추가
  grdMain.value.getGridView().setValidations([
    {
      message: 'Too expensive!',
      criteria: "values['COL03'] > 0",
      mode: 'always',
    },
    {
      message: 'required',
      criteria: "values['COL01'] = null",
      mode: 'always',
    },
  ])
}

/*/grid load 이벤트************************************************/

/*Form Validation************************************************/
//문자 길이 체크
const chkLength = (value) => {
  if (value && value.length <= 10) return true
  else return '길이는 10자 이내로 입력가능합니다.'
}

/*/Form Validation************************************************/

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnCreate') {
    addData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  } else if (btn.id === 'btnApply') {
    console.log('doc', appDoc)
    console.log('doc', document.getElementById(appDoc))

    let doc = document.getElementById(appDoc)

    // let appkey = 'S;527447782BB846628E3E7C073C8647D2'
    // let appkey2 = ''
    // let appkey3 = ''

    // appkey2 = appkey.substring(0, 1)
    // appkey3 = appkey.substr(0, 1)

    // console.log('hiOfficeApproval>> appkey2: ', appkey2)
    // console.log('hiOfficeApproval>> appkey3: ', appkey3)
    console.log('hiOfficeApproval>> clientIp: ', userStore.clientIp)

    approvalPopup.value.openPopup({
      CLSS_ID: 'MNGAB0010',
      TITLE: '내/외부 이슈 및 리스크/기회 평가 작성',
      CMPNY_DIV: userStore.cmpnyDiv,
      DATA_KEY: 'HHI;AX00;X0Q0;X0Q0;2023', // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      REPORT: '', // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      FIX_YN: 'Y',
      FIX_CLRLINE: 'A526166',
      CLRLINE: 'BP16992', //결재라인
      CCLINE: 'BP16992', //참조라인
      PARAM424: '', //사고보고서용 결재라인no,사번
    })
  } else if (btn.id === 'btnPrint') {
    //오즈 리포트
    params.value = []
    params.value = ['IN_CMPNY_DIV=HHI', 'IN_EMP_NO=' + searchParams.OZ_EMP_NO]
    showOz.value = true
  } else if (btn.id === 'btnHtmlCopy') {
    const divPrint = document.getElementById('divPrint')

    console.log('divPrint', divPrint)

    templatePopup_01.value.openPopup({
      divPrint: divPrint,
    })
  } else if (btn.id === 'btnExcelUpload') {
    //html 에 display:none input 추가

    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function (event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  } else if (btn.id === 'btnSampleDown') {
    let params = {
      PATH: '', //샘플은 엑셀 말고도 있어서 기본적으로는 엑셀이고 PATH에 값이 있으면 그 값을 경로로 지정
      FILE_PATH: 'DB',
      FILE_NAME: '708c2e25-e503-44e0-a39c-f65dbfa1baea.png',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnFileUpload') {
    imageViewerPopup.value.openPopup('TEST')
  } else if (btn.id === 'btnSendSms') {
    // 받는 사람 BP23040(김성현)
    sendSMSPopup.value.openPopup(userStore.empNo, true) //유저 ID 테스트용
  } else if (btn.id === 'btnSendMail') {
    vm.$swal({
      title: t(
        '메일을 전송 하시겠습니까?\r\n 바로 보내기는 아래 이메일에 적힌 주소로 메일을 발송 합니다.'
      ),
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '팝업창 호출',
      denyButtonText: '바로 보내기',
    }).then((res) => {
      console.log('res : ', res)
      if (res.isConfirmed === true) {
        sendMailPopup.value.openPopup('', false)
      } else if (res.isDenied === true) {
        if (searchParams.EMAIL === '') {
          return Message.warn(t('등록된 이메일이 없습니다.'))
        } else {
          let mailParams = {
            EMAIL: [],
            SUBJECT: '테스트용 메일 입니다.',
            CONTENT: '테스트용 메일 입니다.',
          }
          mailParams.EMAIL.push(searchParams.EMAIL)
          commonSendApi(mailParams).then((res) => {
            Message.success(t('메일이 전송되었습니다.'))
          })
        }
      }
    })
  } else if (btn.id === 'btnPersonCreate') {
    empPopup.value.openPopup({ MULTI: true })
  } else if (btn.id === 'btnQrCodePrint') {
    // 단축 URL
    let param = {
      originalURL:
        getQDomain() +
        '/#/survey?CMPNY_DIV=HHI&SCHEDULE_ID=202404080001&EDUTIME_SERIAL=1&YEAR=2024&TARGET_KEY=testKey&CURR_ID=C140&DIVISION=A&SUVY_ID=2024HHIBA1020&LOGIN_YN=Y&REG_YN=Y&DEPT_YN=Y',
    }
   
    commonRequest(
      '/hse/slm/',
      {
        orgLinkUrl: getQDomain() + `/#/ptw_qr?RCV_NO=12345&SHORT_WORK_NO=abc`,
        shortLinkUrl: getQDomain(),
      },
      "post", // HTTP 메서드
      "application/json;charset=utf8", // Content-Type
      { apiVersion: "1.0.0" } // meta 정보
    ).then(res => {
      console.log('res : ', res)
      // 이후 만들어진 단축 URL을 가지고 QR 리포트 생성 호출
      searchParams.TAREA = res.body
    })
  } else if (btn.id === 'btnSendFirebase') {
    // 알람 예시
    let test = {
      list: [
        { EMP_NO: 'BP23978' },
        { EMP_NO: 'BP22612' },
        { EMP_NO: 'BP1234' },
      ],
      TITLE: 'FIREBASE TITLE',
      BODY: 'FIREBASE BODY',
      PATH: 'test',
    }
    commonSendFirebase(test).then((res) => {
      console.log('commonSendFirebase : ', res)
    })
  }
  else if (btn.id === "btnExcel") {
    // 자세한 내용은 excel.js 확인
    excelDown(excelParam, excelSearchParams, id, sheetName, fileName)
  }else if(btn.id === "btnWordPrint"){
    //console.log('워드출력 : ', WORK_STANDARD_MASTER)

    // if (isEmpty(WORK_STANDARD_MASTER.WORK_STANDARD_ID)) {
    //   return Message.warn(t('출력할 데이터가 없습니다.'))
    // }
    //console.log('in_work_standard_id = ', WORK_STANDARD_MASTER.WORK_STANDARD_ID)
    commonWordExportApi({ IN_TRANS: 'ko', IN_WORK_STANDARD_ID: 'HHIS-CW-XBS0-0001-001',
      // IN_TRANS: WORK_STANDARD_MASTER.IN_TRANS,
    }).then(res => {

      console.log('res : ', res)
 
      // const fileURL = URL.createObjectURL(
      //   new Blob([res], {
      //     type: 'application/octet-stream',
      //   }),
      // )

      // let title =
      //   '[위험성평가]' +
      //   WORK_STANDARD_MASTER.WORK_STANDARD_NM +
      //   '(' +
      //   WORK_STANDARD_MASTER.DEPT_NM +
      //   ')_' +
      //   d.getFullYear() +
      //   (d.getMonth() + 1).toString().padStart(2, '0') +
      //   d
      //     .getDate()
      //     .toString()
      //     .padStart(2, '0')

      // var fileLink = document.createElement('a')

      // fileLink.href = fileURL
      // fileLink.setAttribute('download', title + '.docx')
      // document.body.appendChild(fileLink) 
      // fileLink.click()
    })
  } else if(btn.id === "btnTrans"){
    let param = {
      sLang: searchParams.TRAN_LANG, //번역할언어
      sText: searchParams.TRAN_TEXT, //번역할말
    }
    
    chatbotTranslateLn(param).then((res) => {
      console.log('응답값?', res)
      searchParams.TRAN_RESULT = res.TRANSATED_WORD
    })
    
  }
}

const excelUploadCallback = (excelData) => {
  console.log(excelData)
  var mappedData = excelData.map((item) => {
    return {
      COL01: item.text,
      COL02: item.combo,
      COL03: item.number,
      COL04: item['multi check'],
      COL05: item.datetime,
      COL06: item.memo,
      COL07: item.Popup,
      COL08: item.check,
    }
  })
  grdMain.value.getDataProvider().fillJsonData(mappedData)
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const beforeSearch = async () => {
  return true
}

// 조회로직
const searchData = () => {
  return commonSearchApi({ queryId: 'template_search01', param: searchParams })
}

const afterSearch = (res) => {
  console.log('res', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/*/메뉴버튼 조회*********************************************/

/*메뉴버튼 추가*********************************************/
//메뉴버튼 - 추가
const addData = () => {
  grdMain.value.addRow({ COL01: dayjs().format('YYYY-MM-DD HH:mm') })
}

/*/메뉴버튼 추가*********************************************/

/*메뉴버튼 저장*********************************************/
//저장전 사용자 정의 validation - 필요에 따라 추가
const beforeSave = () => {
  let chekedRow = ref([])
  let bCheck = true
  chekedRow = grdMain.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.value = []
  let data = ref([])

  chekedRow.forEach(val => {
    data = grdMain.value.getDataProvider().getJsonRow(val)
    data.UPDATE_USER_ID = userStore.userId // 수정자
    saveParams.value.push(data)
  })
  //console.log("저장 파라메트", saveParams.value)
  return bCheck
}

//메뉴버튼 - 저장
const saveData = () => {
  // let stateCheckedRows = grdMain.value.getDataProvider().getStateRows('updated')
  // console.log('[DUCHA] saveData>>>>>>:', stateCheckedRows)

  saveParams.forEach(val => {
    console.log('val : ', val)
    // data = grdMain.value.getDataProvider().getJsonRow(val)
    // data.UPDATE_USER_ID = userStore.userId // 수정자
    // saveParams.value.push(data)
  })

  searchParams.TAREA = saveParams.value

  //return commonExecuteApi({ queryId : 'template_update01', list: saveParams.value })
}

/*/메뉴버튼 저장*********************************************/

/*메뉴버튼 삭제*********************************************/
//메뉴버튼 - 삭제
const deleteData = () => {}

/*/메뉴버튼 삭제*********************************************/

/*서브 grid*****************************************************/
const searchData02 = (idx) => {
  let searchParams2 = {}

  let row = grdMain.value.getDataProvider().getJsonRow(idx)

  // 데이터가 null 일경우 빈 Promise 반환
  if (!row) {
    return new Promise((resolve, reject) => resolve(null))
  }

  searchParams2.COL1 = row.COL01 //key : TEXT

  return commonSearchApi({ queryId: 'template_search01', param: searchParams2 })
}

const afterSearch02 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/*/서브 grid*****************************************************/

/*팝업******************************************************/
// 부서 조회 팝업 오픈
const openDeptPopup = () => {
  //deptPopup.value.openPopup('openPop from parent')
  deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv, 
      ASGN_NM : searchParams.COL6,
      HSE_SYS : 'N',
    })
}

// 부서 조회 팝업 선택 이벤트(테스트용)
const onDeptSelected = (val) => {
  searchParams.COL6 = val.ASGN_SHRT_NM
}

// 인원 조회 팝업 오픈
const openEmpPopup = () => {
  //console.log('searchParams.EMP_NO', searchParams.EMP_NO)
  //empPopup.value.openPopup({ EMP_NM: searchParams.COL8 })
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: searchParams.COL8,
  })
}

// 인원 조회 팝업 선택 이벤트(테스트용)
const onEmpSelected = (val) => {
  console.log('선택된 데이터', val)
  searchParams.COL8 = val.EMP_NM
  searchParams.EMP_NO = val.EMP_NO
}

/*/팝업******************************************************/

/*이벤트*****************************************************/
// const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
//   new queryFlowHelper(vm, t)
//     .setUseDefaultBefore(false)
//     .setQuery(searchData02, newIdx)
//     .setAfter(afterSearch02)
//     .showMessage(false)
//     .run()
// }

/*/이벤트*****************************************************/

/*기타**************************************************/
//버튼 disable 처리
const disableBtn = () => {
  let buttonList = menuTitle.value.getButtonItems()
  let btn = buttonList.find((x) => x.id == 'btnApply')
  btn.disable = true
}

/*/기타**************************************************/
// 결재 상신 팝업창이 닫혔을때 리로드.
const onApprovalClosed = (appKey) => {
  console.log('[ApprovalPopup] onApprovalClosed: ', appKey)
  alert('결재상신 완료 RES ID: ', appKey)
}

const mySqlTest = () => {
  //alert('mySqlTest() 실행됨')
  console.log("🟡 mySqlTest() 실행됨");
  commonSearchMySqlApi({ queryId : 'SAFJA0010_REJECT_USER', param : { USER_NM: '홍길동', USER_BIRTH: '880808' } })
    .then(res => {
      console.log("🟢 응답:", res);
      console.log("🟢 응답CNT:", res[0].CNT);      
    }).catch(err => {
      console.error("🔴 에러:", err);
    }).finally(() => {
      console.log("🔵 요청 완료");
    })
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch',
              'btnCreate',
              'btnUpdate',
              'btnDelete',
              'btnApply',
              'btnExcel',
              'btnExcelUpload',
              'btnSampleDown',
              'btnHtmlCopy',
              'btnFileUpload',
              'btnSendSms',
              'btnQrCodePrint',
              'btnSendFirebase',
              'btnWordPrint',]"
        @click-button="onButtonsClick"
      />
      <VBtn class="mx-1" @click="mySqlTest()">mySql Test</VBtn>
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-2 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-input
              :label="$t('TEXT1')"
              v-model="searchParams.COL1"
              width="250px"
            />
            <i-select
              :label="$t('select')"
              width="300px"
              labelWidth="100px"
              v-model="searchParams.COL2" 
              :items="codeList.bsnsCd"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />
            <i-input
              :label="$t('spin')"
              v-model="searchParams.COL3"
              type="Number"
              width="100px"
              labelWidth="25px"
            />
            <i-select
              :label="$t('multi')"
              width="200px"
              labelWidth="40px"
              v-model="searchParams.COL4" 
              :items="codeList.accdntType"
              item-value="COD"
              item-title="TXT"
              multiple
            />
            <i-input labelWidth="30px" width="190px" 
              :label="$t('기간')" type="date"
              v-model="searchParams.COL5"
              @focusout="dateFrChanged"
              margin="10px"
            />
            <i-input width="170px"
              :label="$t('-')" type="date"
              v-model="searchParams.DATE_TO"
              @focusout="dateToChanged"
            />

              <span class="mr-2 formLabelText" style="width:50px">
                  {{$t('Radio')}}
                </span>
              <v-radio-group inline
                v-model="searchParams.COL7"
              >
                <v-radio
                  v-for="item in codeList.orgnDiv"
                  :key="item"
                  :value="item.COD"
                  :label="item.TXT"
                />
              </v-radio-group>
          </div>
            
          <div class="d-flex">
            <i-input 
              :label="$t('소속')"
              v-model="searchParams.COL6"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup"
              @keydown.enter="e => {openDeptPopup('search')}"
              width="250px"
            />
            <i-input
              v-model="searchParams.DEPT_CD"
              width="150px"
              readonly
            />
           
            <i-input 
              :label="$t('성명')"
              labelWidth="26px"
              width="200px"
              v-model="searchParams.COL8"
              append-inner-icon="mdi-magnify" 
              @click:appendInner="openEmpPopup"
              korean
              maxlength="500"
            />
             <i-input 
              width="200px"
              v-model="searchParams.EMP_NO"
              readonly
            />
            

          </div>
          <div class="d-flex">
            <i-select
              :label="$t('회사구분')"
              labelWidth="52px"
              width="250px"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              labelWidth="39px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
            />
            <i-select
              :label="$t('부서')"
              width="250px"
              labelWidth="26px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
            />
            <i-select
              :label="$t('소속구분')"
              labelWidth="52px"
              width="180px"
              v-model="searchParams.ORGN_DIV"
              :items="codeList.orgnDiv"
              item-title="TXT"
              item-value="COD"
            />
            <i-select
              :label="$t('협력사')"
              labelWidth="39px"
              width="250px"
              v-model="searchParams.ASGN_CD"
              :items="codeList.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
            />
            <v-sheet class="d-flex justify-end">
              <i-input 
                :label="$t('이메일')"
                labelWidth="50px"
                width="300px"
                v-model="searchParams.EMAIL"
                :rules="[emailValidator]"
              />
              <IButtonList
                :button-list="['btnSendMail']"
                @click-button="onButtonsClick"
              />
             </v-sheet>
          </div>
          <div class="d-flex">
            <i-input 
                :label="$t('번역')"
                labelWidth="50px"
                width="300px"
                placeholder="언어"
                v-model="searchParams.TRAN_LANG"                
              />
              <i-input                 
                labelWidth="50px"
                width="300px"
                placeholder="번역할 내용"
                v-model="searchParams.TRAN_TEXT"                
              />
              <IButtonList
                :button-list="['btnTrans']"
                @click-button="onButtonsClick"
              />
              <i-input                 
                labelWidth="50px"
                width="300px"
                class="ml-2"
                placeholder="번역결과"
                v-model="searchParams.TRAN_RESULT"                
              />
          </div>
          <div class="d-flex">
             <i-textarea
                v-model="searchParams.TAREA"
                :label="$t('단축 URL 내용 확인/저장 버튼 클릭시 데이터 확인')"
                width="100%"
                class="mt-2"
              />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <div id="divPrint">
            <IGridTitle :title="$t('Master Grid')">
              <template #editors />
            </IGridTitle>
            <v-sheet class="d-flex justify-end">
              <i-input
                :label="$t('오즈리포트 출력(장비자격)')"
                v-model="searchParams.OZ_EMP_NO"
                width="250px"
              />
              <IButtonList
                :button-list="['btnPrint']"
                @click-button="onButtonsClick"
              />
            </v-sheet>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
        </div>
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서 팝업창 -->
    <DeptPopup
      ref="deptPopup"
      @selected="onDeptSelected"
    /> 
    <!-- 인원조회팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    <!-- 오피스결재 팝업 -->
    <ApprovalPopup ref="approvalPopup" @approval-appkey="onApprovalClosed" />
    <!-- 화면 캡처 팝업 -->
    <TemplatePopup_01 ref="templatePopup_01" />
    <!-- 이미지 파일 업로드 팝업 -->
    <ImageViewerPopup ref="imageViewerPopup" />
    <!-- SMS 팝업 -->
    <SendSMSPopUp ref="sendSMSPopup" />
    <!-- 메일 팝업 -->
    <SendMailPopup ref="sendMailPopup" />
    <!-- OZReport -->
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="params"
      @close="showOz = $event"
    />

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
    min-height: 700px;
  }
}
</style>
