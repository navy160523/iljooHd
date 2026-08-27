<!--
  화면명 : 강사 상세정보 관리
  화면개요 : 강사를 추가하거나 강사의 담당 가능 과목을 추가 또는 삭제할 수 있는 화면
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi, commonExecuteApi2  } from '@hiway/api/commonApi'
import ILabel from "@/components/ILabel.vue"
import dayjs from "dayjs"
import { useI18n } from "vue-i18n"
import IUpload from "@/components/IUpload.vue"
import _ from "lodash"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import CurriculumPopup from '@/components/popup/CurriculumPopup.vue'
import EDUAA0010Pop02 from '@/pages/60_edu/EDU_A/EDUAA0010Pop02.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import { useLogsStore } from "@hiway/stores/logs"

//******************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const deleteYnDialog = ref(false)
const grdSub = ref(null)   //담당 가능 과목 그리드
const grdSub2 = ref(null)  //강의 이력 그리드
const empPopup = ref(null) // 강사 조회 POP
const curriculumPopup = ref(null) // 강의 조회 POP
const eDUAA0010Pop02 = ref(null)
const currBtnTitle = ref(null)
const scrollDirection = ref(0)
const waiting = ref(false)
const scrollTrace = ref(0)
let CREATE_YN = ''
let checkedMobile = 'Y'
let checkedEmail = 'Y'
const emit = defineEmits(['saved'])
var saveDataList = []
const isAdmin = ref(false)

//강의 이력 조회조건[년도]
var yearSet = new Date()
yearSet = yearSet.getFullYear()
var yearList = []
for(let i = yearSet; i >= yearSet-20; i--){
  yearList.push(i)
}
const fileUpload = ref(null)

const searchParams = reactive({
  YEAR : yearList[0],
})

//코드 리스트 세팅
const codeList = ref({
  DIVISION: [],             //구분
  YEAR: yearList,           //년도
  ASGN_NM_B: [],            //소속(사외)
  YN: [                     //삭제, 퇴직 여부
    { TXT: 'Y', COD: 'Y' },
    { TXT: 'N', COD: 'N' },
  ],

})

//담당 가능 과목 그리드 세팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } }, 
  fields : [
    { fieldName: 'DIVISION', dataType: 'text', width: '100', editable: false,  lookupDisplay: true, header: { text: t('분류') } },
    { fieldName: 'CURR_NM', dataType: 'text', width: '250', editable: false, header: { text: t('교육명') }, styleName: 'left-column' },
    { fieldName: 'MNG_ORGN', dataType: 'text', width: '150', editable: false, lookupDisplay: true, header: { text: t('주관부서') }, styleName: 'left-column' },
    { fieldName: 'EDU_CONTENT', dataType: 'text', width: '200', editable: false, header: { text: t('교육내용') }, styleName: 'left-column' },
    { fieldName: 'EDU_CYCLE', dataType: 'text', width: '100', editable: false, header: { text: t('주기') } },
    { fieldName: 'EDU_TIME', dataType: 'text', width: '100', editable: false, header: { text: t('시간') } },

    //출력 안함
    { fieldName: 'CURR_ID', dataType: 'text', visible: false },

  ],
  columns : [],
})

//강의 이력 그리드 세팅
const grdSubProps2 = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } }, 
  fields : [
    { fieldName: 'DIVISION', dataType: 'text', width: '100', editable: false, lookupDisplay: true, header: { text: t('분류') } },
    { fieldName: 'CURR_NM', dataType: 'text', width: '250', editable: false, header: { text: t('교육명') }, styleName: 'left-column' },
    { fieldName: 'MNG_ORGN', dataType: 'text', width: '150', editable: false, lookupDisplay: true, header: { text: t('주관부서') }, styleName: 'left-column' },
    { fieldName: 'EDU_DATE', dataType: 'text', width: '200', editable: false, header: { text: t('교육일자') } },
    { fieldName: 'TIME_SEQ', dataType: 'number', width: '100', editable: false, header: { text: t('주기') }, styleName: 'right-column' },
    { fieldName: 'EDU_TIME', dataType: 'text', width: '100', editable: false, header: { text: t('시작') } },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', width: '100', editable: false, header: { text: t('종료') } },
    { fieldName: 'EDU_TIME_MI', dataType: 'text', width: '100', editable: false, header: { text: t('시간') }, styleName: 'right-column' },
    { fieldName: 'EPLACE_ETC', dataType: 'text', width: '100', editable: false, header: { text: t('교육장소') }, styleName: 'left-column' },

  ],
  columns : [],
  columnLayout: [
    'DIVISION',
    'CURR_NM', 
    'MNG_ORGN', 
    'EDU_DATE', 
    'TIME_SEQ',
    {
      name: 'STD_TIME',
      direction: 'horizontal',
      items: [ 'EDU_TIME', 'EDU_TIME_FN', 'EDU_TIME_MI' ],
      header: { text: t('교육시각') },
    },
    'EPLACE_ETC',
  ],
})

grdSubProps.columns = grdSubProps.fields
grdSubProps2.columns = grdSubProps2.fields

//******************************세팅 영역(종료)***************************************************/

//********************************강사 상세정보 데이터***************************************//
const popupData = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  LECTURER_ID: '',  //강사 일련번호
  DIVISION: '',     //구분
  NAME: '',         //강사명
  NAME_A: '',       //강사명(사내)
  NAME_B: '',        //강사명(사외)
  EMP_NO: '',       //사번
  JOB_TIT_NM: '',   //직위
  BIRTHDAY: '',     //생년월일
  ASGN_NM : '',     //소속(저장할 때 담길 값)
  ASGN_NM_A: '',    //소속(사내)
  ASGN_NM_B: '',    //소속(사외)
  OFFI_TEL: '',     //사무실전화
  MOBILE: '',       //휴대폰
  EMAIL: '',        //이메일
  CURRICULUM: '',   //주요 강좌
  DELETE_YN: '',    //삭제 여부
  RETIRED_YN: '',   //퇴직 여부
  REMARK: '',       //비고
  ASGN_CD: '',      //소속 코드
  JOB_TIT_CD: '',   //직위 코드
  FILE_ID: '',      //첨부파일 코드
  SLI_YN: '', //sli 가점대상
})

//********************************/강사 상세정보 데이터(종료)***********************************//

const show = ref({
  ASGN_NM:true,
  divCheck_A:false,
  divCheck_B:false,
  divCheck_B_1:false,
  name_A : false,
  name_B : false,
})


//*****************************************오픈 팝업********************************************/
const openPopup =  (data) => {
  console.log('data',data)
  CREATE_YN = data.CREATE_YN
  //그리드 초기화
  grdSub.value.getDataProvider().setRows([])
  grdSub2.value.getDataProvider().setRows([])

  if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('GRP00414')){
    isAdmin.value = true
  } 

  //담당 가능 과목, 강의 이력 데이터 바인딩
  Promise.all([
    getCodeList('HHID160'),
    getCodeList('HHID010'),
  ]).then(res => {
    codeList.value.DIVISION = res[0].ORESULT_CUR
    grdSub.value.setBindingColumn("DIVISION", res[1].ORESULT_CUR, "COD", "TXT") 
    grdSub2.value.setBindingColumn("DIVISION", res[1].ORESULT_CUR, "COD", "TXT") 
  })
  
  //상세정보를 추가할 경우 텍스트박스 초기화 작업
  //CREATE_YN = 'Y' : 추가버튼 클릭
  //CREATE_YN = 'N' : 강사 리스트 그리드 row 더블클릭
  if(data.CREATE_YN === 'Y' ){
    CREATE_YN = data.CREATE_YN
    Object.keys(popupData).forEach(key => {
      popupData[key] = ''
    })
    popupData.CMPNY_DIV = userStore.cmpnyDiv
    popupData.USER_ID = userStore.userId
    popupData.DELETE_YN = 'N'
    popupData.SLI_YN = 'N'
    popupData.RETIRED_YN = 'N'
    popupData.DIVISION = 'A'
    divChanged()
  } else {
    CREATE_YN = 'N'
  }

  // 상세정보, 담당 가능 과목, 강의 이력 조회 세팅
  popupData.LECTURER_ID = data.LECTURER_ID

  const params = {
    CMPNY_DIV: userStore.cmpnyDiv,
    LECTURER_ID: popupData.LECTURER_ID,
  }

  //강사 상세정보 조회
  commonSearchApi({ queryId : 'EDUAA0010_POP01_SEARCH_01', param: params }).then(res => {
    if(CREATE_YN === 'N'){
      popupData.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
      popupData.LECTURER_ID = res.ORESULT_CUR[0].LECTURER_ID
      popupData.DIVISION = res.ORESULT_CUR[0].DIVISION
      popupData.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD
      popupData.EMP_NO = res.ORESULT_CUR[0].EMP_NO
      popupData.JOB_TIT_NM = res.ORESULT_CUR[0].JOB_TIT_NM
      popupData.JOB_TIT_NM = res.ORESULT_CUR[0].JOB_TIT_NM
      // popupData.BIRTHDAY =dayjs(res.ORESULT_CUR[0].BIRTHDAY).format('YYYY-MM-DD')
      popupData.OFFI_TEL = res.ORESULT_CUR[0].OFFI_TEL
      popupData.MOBILE = res.ORESULT_CUR[0].MOBILE
      popupData.EMAIL = res.ORESULT_CUR[0].EMAIL
      popupData.CURRICULUM = res.ORESULT_CUR[0].CURRICULUM
      popupData.REMARK = res.ORESULT_CUR[0].REMARK
      popupData.DELETE_YN = res.ORESULT_CUR[0].DELETE_YN
      popupData.SLI_YN = res.ORESULT_CUR[0].SLI_YN
      popupData.RETIRED_YN = res.ORESULT_CUR[0].RETIRED_YN
      popupData.ASGN_NM_B = res.ORESULT_CUR[0].ASGN_NM
      popupData.ASGN_NM_A = res.ORESULT_CUR[0].ASGN_NM
      popupData.FILE_ID = res.ORESULT_CUR[0].FILE_ID

      if(res.ORESULT_CUR[0].DIVISION === 'A'){
        popupData.NAME_A = res.ORESULT_CUR[0].NAME
      } else {
        popupData.NAME_B = res.ORESULT_CUR[0].NAME
      }
    }

    //CREATE_YN = 'Y' : 추가버튼 클릭
    //CREATE_YN = 'N' : 강사 리스트 그리드 row 더블클릭
    if(CREATE_YN === 'N'){
      //사내일 경우
      if(res.ORESULT_CUR[0].DIVISION == 'A'){
        show.value.divCheck_A = true
        show.value.name_A = true
        show.value.divCheck_B = false
        show.value.divCheck_B_1 = false
        show.value.name_B = false
        popupData.ASGN_NM_A = res.ORESULT_CUR[0].ASGN_NM
        popupData.ASGN_NM_B = ''

      //사외일 경우
      } else if(res.ORESULT_CUR[0].DIVISION === 'B'){
        show.value.divCheck_A = false
        show.value.name_A = false
        show.value.divCheck_B = true
        show.value.name_B = true
        if(popupData.ASGN_NM_B === '99999999_001'){
          show.value.divCheck_B_1 = true
        } else {
          show.value.divCheck_B_1 = false 
        }
        popupData.ASGN_NM_B = res.ORESULT_CUR[0].ASGN_NM
        popupData.ASGN_NM_A = ''
      }
    }
    fileUpload.value.clearGrid()
    if(CREATE_YN === 'Y' || popupData.FILE_ID === ''|| popupData.FILE_ID === null
    || popupData.FILE_ID === undefined){
      console.log('파일 ID가 비어있음')
      fileUpload.value.setGuid()
      popupData.FILE_ID = fileUpload.value.guid 
      fileUpload.value.onButtonsClick({ id: 'btnSearch' })
    }else{
      console.log('파일 ID가 있음', popupData.FILE_ID)
      fileUpload.value.setGuid(popupData.FILE_ID)
      fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
  })

  //구분이 사외일때 소속 콤보 박스 데이터 추가
  commonSearchApi({ queryId : 'EDUAA0010_SEARCH_05', param: params }).then(res => {
    codeList.value.ASGN_NM_B = res.ORESULT_CUR
  })

  //담당 가능 과목, 강의 이력의 분류, 주관부서 데이터 바인딩
  commonSearchApi({ queryId : 'EDUAA0010_POP01_POP01_SEARCH_03', param: params }).then(res => {
    grdSub.value.setBindingColumn("MNG_ORGN", res.ORESULT_CUR, "MORGN_ID", "MORGN_NM") 
    grdSub2.value.setBindingColumn("MNG_ORGN", res.ORESULT_CUR, "MORGN_ID", "MORGN_NM")  
  })
  if(CREATE_YN === 'N'){
    //담당 가능 과목 조회
    new queryFlowHelper(vm, t)
      .setGridList([grdSub])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()

    //강의 이력 조회
    new queryFlowHelper(vm, t)
      .setGridList([grdSub2])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch2)
      .setQuery(searchData2)
      .setAfter(afterSearch2)
      .showMessage(false)
      .run()
  }

  if(CREATE_YN === 'N'){
    Message.success(t('조회되었습니다.'))
  }

  //팝업 오픈
  dialog.value = true 

  var logData = {
    CMPNY_DIV : userStore.cmpnyDiv,
    USER_ID : userStore.userId,
    CONN_GBN : 'WEB',
    CONN_IP : userStore.clientIp,
    CONN_COMMENT: '[' + t(useLogsStore().menuId) + '] 화면 - 개인정보관련 조회했습니다.(조회조건:CMPNY_DIV=' 
    + params.CMPNY_DIV + ', LECTURER_ID=' + params.LECTURER_ID + ')',
    CRUD_GBN: '',
    LOG_DESC: '',
    MENU_ID : useLogsStore().menuId,
  }
  commonExecuteApi({ queryId : 'EDUAA0010_SAVE_LOG', list: [logData] })
}

//****************************************오픈 팝업(종료)************************************************/

//###########################################이벤트 영역##################################################/
//*********************************이벤트 영역(강사 상세 정보)***********************************/
//팝업 오픈
const openEmpPopup = async () => {
  empPopup.value.openPopup({EMP_NM : popupData.NAME_A })
}

//상세정보 버튼 클릭 이벤트
const onButtonsClick = btn => {

  if(btn.id === 'btnUpdate'){//저장
    new saveFlowHelper(vm, t)
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()

  } else if(btn.id === 'btnClose'){//닫기
    searchParams.YEAR =  String(yearList[0])
    dialog.value = false
    emit("saved", '')
  }
}

//구분 변경시 실행되는 이벤트
const divChanged = () => {
  //사내일 경우
  if(popupData.DIVISION == 'A'){
    show.value.divCheck_A = true
    show.value.name_A = true
    show.value.divCheck_B = false
    show.value.divCheck_B_1 = false
    show.value.name_B = false

  //사외일 경우
  } else if(popupData.DIVISION === 'B'){
    show.value.divCheck_A = false
    show.value.name_A = false
    show.value.divCheck_B = true
    show.value.name_B = true

    //사외이며 직접 입력을 선택한 경우
    if(popupData.ASGN_NM_B === '99999999_001'){
      show.value.divCheck_B_1 = true
    } 
  }
}

//강사명을 선택했을 때 실행되는 이벤트
const onEmpSelected = row => {
  popupData.NAME_A = row.EMP_NM
  popupData.EMP_NO = row.EMP_NO
  popupData.JOB_TIT_NM = row.JOB_TIT_NM
  // popupData.BIRTHDAY = row.BIRTH_DAY
  popupData.ASGN_NM_A = row.ASGN_NM
  popupData.OFFI_TEL = row.TEL_NO
  popupData.MOBILE = row.HND_PHN
  popupData.EMAIL = row.EMAIL
  popupData.CURRICULUM = row.CURRICULUM
  popupData.DELETE_YN = 'N'
  popupData.SLI_YN = 'N'
  popupData.RETIRED_YN = 'N'
  popupData.REMARK = row.REMARK
  inputMobile()
}

//소속 변경시 실행되는 이벤트
//구분이 사외이고 소속이 직접입력일 경우 직접입력칸을 활성화 함
const asgnChanged = () => {
  if(popupData.ASGN_NM_B === '99999999_001'){
    show.value.divCheck_B_1 = true
  } else {
    show.value.divCheck_B_1 = false
  }
}

//삭제여부 변경시 실행되는 이벤트
const deleteYnChanged = (data) => {
  if(data === 'Y'){
    deleteYnDialog.value = true
    currBtnTitle.value.disableBtn('btnCreate', true)
    currBtnTitle.value.disableBtn('btnUpdate', true)
    currBtnTitle.value.disableBtn('btnDelete', true)
    onCurrButtonsClick()
  } else {
    currBtnTitle.value.disableBtn('btnCreate', false)
    currBtnTitle.value.disableBtn('btnUpdate', false)
    currBtnTitle.value.disableBtn('btnDelete', false)
  }
}

//직위 유효성 검사(한글 입력 불가)
const inputJOB_TIT_NM = (value) => {
  popupData.JOB_TIT_NM = popupData.JOB_TIT_NM.replace(/[^ㄱ-힣]+/g, '')
}

//사무실전화 유효성 검사(한글 입력 불가)
const inputOFFI_TEL = (value) => {
  popupData.OFFI_TEL = popupData.OFFI_TEL.replace(/[^0-9-]/g, '')
}


const requiredOFFI_TEL = () => {

}

const requiredJOB_TIT_NM = () => {

}

//휴대폰 유효성 검사(숫자와 하이픈만 입력 가능)
const inputMobile = value => {
  let str = popupData.MOBILE

  if (!str) {
    return ""
  }

  str = str.replace(/[^0-9]/g, "")

  let result = []
  let restNumber = ""

  // 지역번호와 나머지 번호로 나누기
  if (str.startsWith("02")) {
    // 서울 02 지역번호
    result.push(str.substr(0, 2))
    restNumber = str.substring(2)
  } else if (str.startsWith("1")) {
    // 지역 번호가 없는 경우
    // 1xxx-yyyy
    restNumber = str
  } else {
    // 나머지 3자리 지역번호
    // 0xx-yyyy-zzzz
    result.push(str.substr(0, 3))
    restNumber = str.substring(3)
  }

  if (restNumber.length === 7) {
    // 7자리만 남았을 때는 xxx-yyyy
    result.push(restNumber.substring(0, 3))
    result.push(restNumber.substring(3))
  } else {
    result.push(restNumber.substring(0, 4))
    result.push(restNumber.substring(4))
  }

  popupData.MOBILE = result.filter((val) => val).join("-")
}


//휴대폰 유효성 검사(휴대폰 형식 체크)
const requiredMobile = (value) =>{
  const mobileRegex = /^(\d{3})-(\d{4})-(\d{4})$/
  if(value !== null){
    if(popupData.MOBILE !== '' && !mobileRegex.test(value)){
      checkedMobile='N'

      return mobileRegex.test(value) || '유효한 휴대폰 번호를 입력하세요.'
    } else {checkedMobile = 'Y'}
  }

}

//이메일 유효성 검사(한글 입력 불가)
const inputEmail = (value) => {
  popupData.EMAIL = popupData.EMAIL.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '')
}

//이메일 유효성 검사(이메일 형식 체크)
const requiredEmail = (value) =>{
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if(value !== null){
    if(popupData.EMAIL !== '' && !emailRegex.test(value)){
      checkedEmail = 'N'

      return emailRegex.test(value) || '유효한 이메일 주소를 입력하세요.'
    } else { checkedEmail = 'Y' }
  }
}

//************************************이벤트 영역(강사 상세 정보) 종료 **************************************/

//************************************이벤트 영역(담당 가능 과목) **************************************/

//담당 가능 과목 버튼 이벤트
const onCurrButtonsClick = btn => {
  console.log("popupData.LECTURER_ID",popupData.LECTURER_ID)
  if(!popupData.LECTURER_ID){
    Message.warn(t('추가 입력한 강사정보 저장 후 담당가능과목 추가 가능 합니다.'))

    return
  }
  if(popupData.DELETE_YN === 'Y'){
    return
  }
  if(btn.id === 'btnCreate'){           //추가
    curriculumPopup.value.openPopup()

  } else if(btn.id === 'btnUpdate'){    //저장
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: null }])
      .setGridList([grdSub])
      .setBefore(validationCheck2)
      .setQuery(saveData2)
      .setAfter(afterSave2)
      .run()
  } else if(btn.id === 'btnDelete'){    //삭제
    new deleteFlowHelper(vm, t)
      .setBefore(validationCheck3)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

//담당 가능 과목을 추가했을 때 실행되는 이벤트
const onCurriculumSelected = row =>{
  let getGrdData = []
  getGrdData.push(grdSub.value.getDataProvider().getRows())
  row.forEach(item => {
    for(let i = 0; i < getGrdData[0].length; i++){
      if(getGrdData[0][i][0] == item.DIVISION && getGrdData[0][i][1] == item.CURR_NM 
      && getGrdData[0][i][2] == item.MNG_ORGN && getGrdData[0][i][6] == item.CURR_ID){
        return
      }
    }
    grdSub.value.addRow(item)
  })
}

//************************************이벤트 영역(담당 가능 과목) 종료 **************************************/

//************************************이벤트 영역(강의 이력) **********************************************/
//년도 변경시 실행되는 이벤트(조회)
const yearChanged = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub2])
    //.setSearchArea(searchArea)
    .setBefore(beforeSearch2)
    .setQuery(searchData2)
    .setAfter(afterSearch2)
    .run()
}

//************************************이벤트 영역(강의 이력) 종료******************************************/
//########################################이벤트 영역(종료)################################################/


//*****************************************조회 영역 *****************************************//

//담당 가능 과목 조회 전
const beforeSearch = async () => {
  return true
}

//담당 가능 과목 조회
const searchData = idx => {
  const params ={
    CMPNY_DIV: userStore.cmpnyDiv,
    LECTURER_ID: popupData.LECTURER_ID,
  }

  return commonSearchApi({ queryId : 'EDUAA0010_POP01_SEARCH_02', param: params })
}

//담당 가능 과목 조회 후
const afterSearch = res => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//강의 이력 조회 전
const beforeSearch2 = async () => {
  return true
}

//강의 이력 조회
const searchData2 = idx => {
  const params = {
    CMPNY_DIV: userStore.cmpnyDiv,
    LECTURER_ID: popupData.LECTURER_ID,
    YEAR: searchParams.YEAR,
  }

  return commonSearchApi({ queryId : 'EDUAA0010_POP01_SEARCH_03', param: params })
}

//강의 이력 조회 후
const afterSearch2 = res => {
  grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//담당 가능 과목 저장 시 담당 가능 과목만 재조회
const search = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    //.setSearchArea(searchArea)
    .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

//*****************************************조회 영역(종료)*****************************************//

//*****************************************저장 영역********************************************//

// 강사 상세정보 저장 전 유효성 검사
const validationCheck = () => {
  //구분이 사내일 경우
  if(popupData.DIVISION === 'A'){ 
    popupData.ASGN_NM = popupData.ASGN_NM_A
    popupData.NAME = popupData.NAME_A

    //구분이 사외이며 소속이 직접 입력이 아닌 경우
  } else if(popupData.DIVISION === 'B' && popupData.ASGN_NM_B !== '99999999_001'){
    popupData.ASGN_NM = popupData.ASGN_NM_B
    popupData.NAME = popupData.NAME_B

    //구분이 사외이며 소속이 직접 입력인 경우
  } else if(popupData.DIVISION === 'B' && popupData.ASGN_NM_B === '99999999_001'){
    popupData.ASGN_NM = popupData.ASGN_NM_DIRECT_INPUT
    popupData.NAME = popupData.NAME_B
  }

  //유효성 검사
  if(popupData.NAME === '' || popupData.NAME === null){
    Message.warn(t('강사명은 필수 입력입니다.'))

    return false
  } 
  // else if(popupData.BIRTHDAY === '' || popupData.BIRTHDAY === null){
  //   Message.warn(t('생년월일은 필수 입력입니다.'))

  //   return false
  // }
   else if(popupData.ASGN_NM === '' || popupData.ASGN_NM === null || popupData.ASGN_NM === undefined){
    Message.warn(t('소속은 필수 입력입니다.'))

    return false
  } else if(checkedMobile === 'N'){
    Message.warn(t('휴대폰 형식이 올바르지 않습니다.'))

    return false
  } else if(checkedEmail === 'N'){
    Message.warn(t('이메일 형식이 올바르지 않습니다.'))
    
    return false
  }
  else { return true }
}

// 강사 상세정보 저장
const saveData = () => {
  // popupData.BIRTHDAY = popupData.BIRTHDAY.substring(0,10).replace(/-/g,'')

  return commonExecuteApi2({ queryId : 'EDUAA0010_POP01_SAVE_01', list: [popupData] })
  
}

//강사 상세정보 저장 후
const afterSave = res => {
  console.log(" 저장 > " , res)
  saveDataList.push(res)

  // popupData.BIRTHDAY = dayjs(res.BIRTHDAY).format('YYYY-MM-DD')

  //구분이 사외이고 소속이 직접입력이며 소속 직접입력칸에 데이터가 있을 경우
  if(res.DIVISION === 'B' && popupData.ASGN_NM_B === '99999999_001'
  && (popupData.ASGN_NM_DIRECT_INPUT !== '' || popupData.ASGN_NM_DIRECT_INPUT !== null)){
    //직접입력 데이터 -> 소속으로 옮김
    popupData.ASGN_NM_B = res.ASGN_NM
    popupData.ASGN_NM_DIRECT_INPUT = ''

    //소속 직접입력 칸 비활성화
    show.value.divCheck_B_1 = false
  }
  popupData.LECTURER_ID = res.OUT_RES_SEQ_NO

  var logData = {
    CMPNY_DIV : userStore.cmpnyDiv,
    USER_ID : userStore.userId,
    CONN_GBN : 'WEB',
    CONN_IP : userStore.clientIp,
    CONN_COMMENT: '[' + t(useLogsStore().menuId) + '] 화면 - 개인정보관련 저장했습니다.(조회조건:CMPNY_DIV=' 
    + userStore.cmpnyDiv + ', LECTURER_ID=' + res.LECTURER_ID  + ', NAME=' + res.NAME +
    + ', EMP_NO=' + res.EMP_NO + ', JOB_TIT_NM=' + res.JOB_TIT_NM  + ', ASGN_NM=' + res.ASGN_NM  + ', OFFI_TEL=' + res.OFFI_TEL +
    ', CURRICULUM=' + res.CURRICULUM + ', DELETE_YN=' + res.DELETE_YN + ', RETIRED_YN=' + res.RETIRED_YN + ', REMARK=' + res.REMARK +
    ', ASGN_CD=' + res.ASGN_CD + ', OUT_RES_COD=' + res.OUT_RES_COD + ', OUT_RES_COL=' + res.OUT_RES_COL +
    ', OUT_RES_MSG=' + res.OUT_RES_MSG + ', OUT_RES_SEQ_NO=' + res.OUT_RES_SEQ_NO + ', USER_ID=' + userStore.userId +
    ')',
    CRUD_GBN: '',
    LOG_DESC: '',
    MENU_ID : useLogsStore().menuId,
  }
  console.log("로그데이타",logData)
  commonExecuteApi({ queryId : 'EDUAA0010_SAVE_LOG', list: [logData] })

}

//담당 가능 과목 저장 전 유효성 검사
const validationCheck2 = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('저장할 데이터를 선택해 주세요.'))

    return false
  }

  return true
}

//담당 가능 과목 저장
const saveData2 = () => {
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  for(let i = 0; i < saveParams.length; i++){
    saveParams[i].CMPNY_DIV = userStore.cmpnyDiv
    saveParams[i].USER_ID = userStore.userId
    saveParams[i].LECTURER_ID = popupData.LECTURER_ID
    saveParams[i].UNT_PRC = 0
  }

  return commonExecuteApi({ queryId : 'EDUAA0010_POP01_SAVE_02', list: saveParams })
}

//담당 가능 과목 저장 후
const afterSave2 = () => {
  const params ={
    CMPNY_DIV: userStore.cmpnyDiv,
    LECTURER_ID: popupData.LECTURER_ID,
  }
  commonSearchApi({ queryId : 'EDUAA0010_POP01_SEARCH_02', param: params }).then(res => {
    if(res.ORESULT_CUR.length > 0){
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

//*****************************************저장 영역(종료)********************************************//

//*****************************************삭제 영역************************************************//
//담당 가능 과목 삭제전 유효성 검사
const validationCheck3 = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))

    return false
  }
  
  return true
}

//담당 가능 과목 삭제
const deleteData = () => {
  let checkedRowIndex = grdSub.value.getGridView().getCheckedRows()
  var checkedRows =[]
  for(var item in checkedRowIndex){
    checkedRows.push(grdSub.value.getDataProvider().getJsonRow(item))
  }
  for(let i = 0; i < checkedRows.length; i++){
    checkedRows[i].CMPNY_DIV = userStore.cmpnyDiv
    checkedRows[i].LECTURER_ID = popupData.LECTURER_ID
  }

  return commonExecuteApi({ queryId : 'EDUAA0010_POP01_DELETE_01', list: checkedRows })
}

//담당 가능 과목 삭제 후
const afterDelete = () => {
  const params ={
    CMPNY_DIV: userStore.cmpnyDiv,
    LECTURER_ID: popupData.LECTURER_ID,
  }

  commonSearchApi({ queryId : 'EDUAA0010_POP01_SEARCH_02', param: params }).then(res => {
    if(res.ORESULT_CUR.length > 0){
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

//*****************************************삭제 영역(종료)************************************************//


//파일 업로드 기능
const uploaded = (e) => {
  const saveParam = []
  // console.log('popupData',popupData)
  // console.log('val',e)

  // console.log('val',e.fileId)
  const temp = {
    CMPNY_DIV: popupData.CMPNY_DIV,
    LECTURER_ID: popupData.LECTURER_ID,
    EMP_NO: popupData.EMP_NO,
    FILE_ID: popupData.FILE_ID,
    USER_ID: userStore.userId,
  }
  saveParam.push(temp)
    
  return commonExecuteApi
  ({ 
      queryId : 'EDUAA0010_POP01_SAVE_03'
    , list: saveParam
  })
}

const SLIOpen =()=>{
  eDUAA0010Pop02.value.openPopup()
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="900"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>강사 상세정보 관리</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :title="$t(useLogsStore().menuId)"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 상세 -->
      <v-card-text class="pa-4 pt-0 content-area">

          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                :label="$t('일련번호')"
                topLabel
                v-model="popupData.LECTURER_ID"
                width="200px"
                disabled
                readonly
              />
              <i-select
                :label="$t('구분')"
                topLabel
                v-model="popupData.DIVISION"
                :items="codeList.DIVISION"
                item-title="TXT"
                item-value="COD"
                @update:model-value="divChanged"
                width="180px"
              />
              <i-input 
                :label="$t('강사명')"
                topLabel
                v-if="show.name_A"
                v-model="popupData.NAME_A"
                append-inner-icon="mdi-magnify" 
                @click:appendInner="openEmpPopup"
                @keydown.enter="e => {openEmpPopup()}"
                width="200px"
                required
              />
              <i-input 
                :label="$t('강사명')"
                topLabel
                v-if="show.name_B"
                v-model="popupData.NAME_B"
                width="200px"
                required
              />
              <i-input 
                :label="$t('사번')"
                topLabel
                v-model="popupData.EMP_NO"
                width="200px"
                disabled
                readonly
              />
            </div>
            <div class="d-flex mb-2 pt-2">
              
              <i-input 
                :label="$t('직위')"
                topLabel
                v-model="popupData.JOB_TIT_NM"
                :rules="[requiredJOB_TIT_NM]"
                @change="inputJOB_TIT_NM"
                @input="inputJOB_TIT_NM"
                width="200px"
              />
              <i-input 
                :label="$t('사무실전화')"
                topLabel
                v-model="popupData.OFFI_TEL"
                :rules="[requiredOFFI_TEL]"
                @change="inputOFFI_TEL"
                @input="inputOFFI_TEL"
                width="180px"
              />
              <!-- <i-input 
                :label="$t('생년월일')"
                topLabel
                type="Date"
                format="yyyy-MM-dd"
                v-model="popupData.BIRTHDAY"
                width="250px"
                required
              /> -->
              <i-input 
                :label="$t('소속')"
                topLabel
                v-if="show.divCheck_A"
                v-model="popupData.ASGN_NM_A"
                width="420px"
                required
              />
              <!-- 소속(사외) -->
              <i-select 
                :label="$t('소속')"
                topLabel
                v-if="show.divCheck_B"
                v-model="popupData.ASGN_NM_B"
                :items="codeList.ASGN_NM_B"
                item-title="TXT"
                item-value="COD"
                @update:model-value="asgnChanged"
                width="420px"
                required
              />
            </div>

            <div class="d-flex mb-2 pt-1" v-if="show.divCheck_B_1">
              <!-- 직접입력 칸 -->
              <i-input 
                :label="$t('소속직접입력')"
                topLabel
                v-if="show.divCheck_B_1"
                v-model="popupData.ASGN_NM_DIRECT_INPUT"
                width="400px"
                required
              />            
            </div>
           
            
              <!-- 사무실전화 -->
              
              <!-- 휴대폰 -->
              <!-- <i-input 
                :label="$t('휴대폰')"
                topLabel
                v-model="popupData.MOBILE"
                :rules="[requiredMobile]"
                counter
                maxlength="13"
                @change="inputMobile"
                @input="inputMobile"
                width="250px"
                /> -->
              <!-- 이메일 -->
              <!-- <i-input
                :label="$t('이메일')"
                topLabel
                v-model="popupData.EMAIL"
                @input="inputEmail"
                :rules="[requiredEmail]"
                width="250px"
              /> -->
            
            <div class="d-flex mb-2">
              <!-- 주요 강좌 -->
              <i-input
                :label="$t('주요 강좌')"
                topLabel
                v-model="popupData.CURRICULUM"
                width="400px"
              />
              <!-- 비고 -->
              <i-input
                :label="$t('비고')"
                topLabel
                type="text"
                v-model="popupData.REMARK"
                width="420px"
              />
            </div>
            <div class="d-flex mb-2">              
              <!-- 삭제여부 -->
              <i-select
                :label="$t('삭제여부')"
                topLabel
                v-model="popupData.DELETE_YN"
                :items="codeList.YN"
                item-title="TXT"
                item-value="COD"
                width="200px"
                @update:model-value="deleteYnChanged"
              />
              <!-- 퇴직여부 -->
              <i-select
                :label="$t('퇴직여부')"
                topLabel
                v-model="popupData.RETIRED_YN"
                :items="codeList.YN"
                item-title="TXT"
                item-value="COD"
                disabled
                width="180px"
              />
              <!-- SLI 가점대상 -->
              <i-select
                :label="$t('SLI 가점대상')"
                topLabel
                v-model="popupData.SLI_YN"
                :items="codeList.YN"
                item-title="TXT"
                item-value="COD"
                width="180px"   
                class="mr-1"
                :readonly="!isAdmin"             
              />
              <v-btn class="mt-6 mr-3" @click="SLIOpen">SLI가점대상 정보</v-btn>
            </div>            
          </v-sheet>
        <v-sheet class="mt-2" style="height: -webkit-fill-available;">
            <IUpload
              ref="fileUpload"
              grid-title="첨부파일"
              :auto-upload="true"
              style="min-height: 300px;padding-bottom: 4px;"
              @uploaded="uploaded($event)"
            />
            <!-- 담당 가능 과목 그리드 -->
            <IGridTitle 
              ref="currBtnTitle"
              :title="$t('담당 가능 과목')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
              @click-button="onCurrButtonsClick"
            >
            <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
            <!-- 강의 이력 그리드 -->
            <IGridTitle :title="$t('강의 이력')">
            <template #editors />
            </IGridTitle>
            <i-select
              :label="$t('년도')"
              :items="codeList.YEAR"
              v-model="searchParams.YEAR"
              @update:model-value="yearChanged"
              width="250px"
            />
            
            <RealGrid
              ref="grdSub2"
              class="mt-2"
              :grid-view-option="grdSubProps2.gridViewOption"
              :fields="grdSubProps2.fields"
              :columns="grdSubProps2.columns"
            />
        </v-sheet>
      </v-card-text>
    </v-card>
  <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
  <CurriculumPopup ref="curriculumPopup" @selected="onCurriculumSelected"/>
  </v-dialog>
  <v-dialog
      v-model="deleteYnDialog"
      width="auto"
    >
      <v-card>
        <v-card-text>
          삭제 상태로 변경 후 저장시 담당 가능 과목은 삭제됩니다.
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="deleteYnDialog = false">확인</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- SLI가점대상 팝업 -->
    <EDUAA0010Pop02 ref="eDUAA0010Pop02" />
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
    min-height: 270px;
  }
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
