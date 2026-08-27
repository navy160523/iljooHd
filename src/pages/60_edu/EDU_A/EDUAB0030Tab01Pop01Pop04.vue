<!--
  화면명 : 사내협력사 신규채용자교육 대상자 조회(팝업), 단기 공사 교육대상자 조회_안전통합경영실(팝업), 단기공사 교육대상자 조회(팝업),
           일자별 대상자 조회(팝업), 절대수칙 위반자 조회(팝업)
  화면개요 : 파라미터 오픈 시 받아오는 파라미터에 따라 5개의 팝업 중 하나가 열리며, 
             데이터를 선택하여 대상자 목록 그리드에 데이터를 추가한다. 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const deptPopup = ref(null)
const popupButtons = ref(null)
const dialog = ref(false)
const grdMain = ref(null)
const grdSub = ref(null)
const emit = defineEmits([])
const _YEAR = ref(null)
const _TITLE = ref(null)
const _OPEN_CODE = ref(null)


const popupData_07 = reactive({
  EDU_DT_FROM : '',   //교육신청일(시작)
  EDU_DT_TO : '',     //교육신청일(종료)
})

//C120 | 단기 공사 교육대상자 조회_안전통합경영실
const popupData_C120 = reactive({
  VND_NAME : '',
  EMP_NAME : ''
})

//C227 | 단기 공사 교육대상자 조회
const popupData_C227 = reactive({
  EDATE : '',   //공사기준일
  WORK : '',    //공사명
  DTEGBN : '',  //기간선택
})

//C179 | 일자별 대상자 조회
const popupData_C179 = reactive({
  SAFEDU_YM : '',   //이수년월
  SAFEDU_DT : '',   //체험관이수일
})


//ELSE | 절대수칙 위반자 조회
const popupData_ELSE = reactive({
  CUTOFF_YM : '',     //컷오프년월
  CUTOFF_DT : '',     // 컷오프일
  HEAD_CNFM_DT : '',  // 확정일
})

const codeList = reactive({
  work : [],       //C227 | 공사명
  dteGbn : [],     //C227 | 기간선택
  safeduDt : [],   //C179 | 체험관이수일
  cutoffDt : [],   //ELSE | CUTOFF
  headCnfmDt : [], //ELSE | 확정일
})

const visible = ref(null)


//교육장 목록
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  columns: [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Object.keys(codeList).forEach(key => {
    codeList[key] = []
  })
  console.log("오픈코드 재확인",_OPEN_CODE.value)
  if(_OPEN_CODE.value === 'C227'){
    let searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      BSNS_CD : userStore.bsnsCd,
      DEPT_CD : userStore.deptCd,
      CURR_ID : _OPEN_CODE.value,
      EDATE : popupData_C227.EDATE
    }
    console.log("코드리스트 조회 데이터",searchParams)
    popupData_C227.WORK = ''
    commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP04_SEARCH_03', param : searchParams }).then(res => {
      console.log("조회후 데이터 227",res)
      if(res.ORESULT_CUR.length > 0){
        codeList.work = res.ORESULT_CUR
        console.log("코드리스트 확인",codeList.work)
      }

    })
    codeList.dteGbn.push({COD : 'ALL', TXT : '전체'}, {COD : 'DOWN', TXT : '15일미만'}, {COD : 'UP', TXT : '15일이상'})
    popupData_C227.DTEGBN = codeList.dteGbn[0].COD
  }
  else if(_OPEN_CODE.value === 'C179'){
    let searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      YYYYMM : popupData_C179.SAFEDU_YM,
    }
    console.log("C179조회 파람",searchParams)
    popupData_C179.SAFEDU_DT = ''
    commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP04_SEARCH_05', param : searchParams }).then(res => {
      console.log("C179조회 후 결과",res)
      if(res.ORESULT_CUR.length > 0){
        codeList.safeduDt = res.ORESULT_CUR
        popupData_C179.SAFEDU_DT = codeList.safeduDt[0].SAFEDU_FIN_DT
      }else{
      }
    })
  }
  else if(_OPEN_CODE.value === 'ELSE'){
    let searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      CUTOFF_YYYYMM : popupData_ELSE.CUTOFF_YM
    }
    console.log("서치파람 ELSE",searchParams)
    commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP04_SEARCH_07', param : searchParams }).then(res => {
      console.log("ELSE조회 후 결과",res)
      if(res.ORESULT_CUR.length > 0){
        if(res.ORESULT_CUR.length === 1){
          if(res.ORESULT_CUR[0] !== null){
            codeList.cutoffDt = res.ORESULT_CUR
          }else{
            codeList.cutoffDt = []
            popupData_ELSE.CUTOFF_DT = ''
            popupData_ELSE.HEAD_CNFM_DT = ''
          }
        }else{
          codeList.cutoffDt = res.ORESULT_CUR
        }
        if(codeList.cutoffDt.length > 0){
          popupData_ELSE.CUTOFF_DT = codeList.cutoffDt[0].CUTOFF_DT
        }
      }
    })
  }
}

// popupData_ELSE.CUTOFF_DT가 변경될 때 발생하는 이벤트
watch(() => popupData_ELSE.CUTOFF_DT, (newValue, oldValue) => {
  console.log("분류 바뀜")
  if(newValue === ''){
    popupData_ELSE.HEAD_CNFM_DT = ''
    return
  }
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    CUTOFF_DT : newValue
  }
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP04_SEARCH_08', param :searchParams }).then(res => {
    if(res.ORESULT_CUR[0] !== null){
      popupData_ELSE.HEAD_CNFM_DT = res.ORESULT_CUR[0].HEAD_CNFM_DT
    }else{
      popupData_ELSE.HEAD_CNFM_DT = ''
    }
  })
})


//오픈코드에 따라 컬럼 변경 이벤트
const grdMainfieldSetting = OPEN_CODE => {
  if(OPEN_CODE === '07'){
    grdMainProps.fields = [
      { fieldName: 'SAFEDU_REQ_DT', dataType: 'text', header: { text: t('교육신청일') }, editable: false,
        'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
        editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} } },
      { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName:'left-column', editable: false },
      { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, styleName:'left-column', editable: false },
      { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사') }, styleName:'left-column', editable: false },
      { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
      { fieldName: 'REG_REQ_SEQ', dataType: 'text', header: { text: t('등록순번') }, editable: false },
      { fieldName: 'CERT_VNO', dataType: 'text', header: { text: t('인증번호') }, editable: false },

      //비활성화
      { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'COMPANY', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    ]
  }
  else if(OPEN_CODE === 'C120'){
    grdMainProps.fields = [
      { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('협력사') }, styleName:'left-column', editable: false },
      { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
      { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('ID(사번)') }, editable: false },
      { fieldName: 'EDU_COMP_DT', dataType: 'text', header: { text: t('교육이수일') }, editable: false,
        'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
        editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} } },
      { fieldName: 'EDU_END_DT', dataType: 'text', header: { text: t('교육만료일') }, editable: false,
        'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
        editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} } },
      { fieldName: 'EDU_END_YN', dataType: 'text', header: { text: t('이수여부') }, editable: false },
    
      //비활성화
      { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'VEND_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'DANGI_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    ]
  }
  else if(OPEN_CODE === 'C227'){
    grdMainProps.fields = [
      { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('협력사') }, styleName:'left-column', editable: false },
      { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
      { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('ID(사번)') }, editable: false },
      { fieldName: 'EDU_COMP_DT', dataType: 'text', header: { text: t('교육이수일') }, editable: false,
        'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
        editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} } },
      { fieldName: 'EDU_END_DT', dataType: 'text', header: { text: t('교육만료일') }, editable: false,
        'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
        editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} } },
      { fieldName: 'WORK_DT', dataType: 'text', width:'200', header: { text: t('공사일자') }, editable: false },
      { fieldName: 'WORK_PERIOD', dataType: 'text', header: { text: t('기간') }, editable: false },
      { fieldName: 'WORK_DESC', dataType: 'text', width:'250', header: { text: t('공사명') }, styleName:'left-column', editable: false },
      { fieldName: 'EDU_END_YN', dataType: 'text', header: { text: t('이수여부') }, editable: false },
    
      //비활성화
      { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, editable: false, visible: false },
      { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부명') }, styleName:'left-column', editable: false, visible: false },
      { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, editable: false, visible: false },
      { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서명') }, styleName:'left-column', editable: false, visible: false },
      { fieldName: 'VEND_CD', dataType: 'text', header: { text: t('업체등록코드') }, editable: false, visible: false },
      { fieldName: 'WORK_NO', dataType: 'text', header: { text: t('단기공사번호') }, editable: false, visible: false },
      { fieldName: 'BIZ_REG_NO', dataType: 'text', header: { text: t('사업자번호') }, editable: false, visible: false },
      { fieldName: 'REV_NO', dataType: 'text', header: { text: t('REVISION') }, editable: false, visible: false },
    ]
  }
  else if(OPEN_CODE === 'C179'){
    grdMainProps.fields = [
      { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName:'left-column', editable: false },
      { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, styleName:'left-column', editable: false },
      { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사') }, styleName:'left-column', editable: false },
      { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
      { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
      { fieldName: 'SAFEDU_FIN_DT', dataType: 'text', header: { text: t('교육일시') }, editable: false,
        'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
        editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} } },
      { fieldName: 'JOB_NM', dataType: 'text', header: { text: t('구분') }, editable: false },

      //비활성화
      { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('사업부') }, editable: false, visible: false },
      { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('사업부명') }, editable: false, visible: false },
      { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, editable: false, visible: false },
      { fieldName: 'JOB_ROW_CD', dataType: 'text', header: { text: t('부서명') }, editable: false, visible: false },
      { fieldName: 'STD_DUTY_CD', dataType: 'text', header: { text: t('업체등록코드') }, editable: false, visible: false },
      { fieldName: 'UNIT_DUTY_CD', dataType: 'text', header: { text: t('단기공사번호') }, editable: false, visible: false },
      { fieldName: 'BIZ_REG_NO', dataType: 'text', header: { text: t('사업자번호') }, editable: false, visible: false },
      { fieldName: 'REV_NO', dataType: 'text', header: { text: t('REVISION') }, editable: false, visible: false },
    ]
  }
  else if(OPEN_CODE === 'ELSE'){
    grdMainProps.fields = [
      { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('조직명') }, styleName:'left-column', editable: false },
      { fieldName: 'NATN_CD', dataType: 'text', header: { text: t('국적') }, editable: false },
      { fieldName: 'VIOLATOR', dataType: 'text', header: { text: t('성명') }, editable: false },
      { fieldName: 'VIO_EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
      // 2024.08.30 박용훈 재직여부 추가
      { fieldName: 'HLD_OFFI_GBN', dataType: 'text', header: { text: t('재직여부') }, editable: false },
      { fieldName: 'DIV', dataType: 'text', header: { text: t('구분') }, editable: false },
      { fieldName: 'WIBAN_CNT', dataType: 'text', header: { text: t('1년 건수') }, editable: false },
      { fieldName: 'USER_DIV_NM', dataType: 'text', header: { text: t('소속구분') }, editable: false },
      { fieldName: 'VIO_TIME', dataType: 'text', header: { text: t('위반일시') }, styleName:'left-column', editable: false },
      { fieldName: 'VIO_PLC_NM', dataType: 'text', header: { text: t('위반장소') }, styleName:'left-column', editable: false },
      { fieldName: 'VIO_DESC', dataType: 'text', header: { text: t('위반내용') }, styleName:'left-column', editable: false },
      { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('교육이수여부') }, editable: false },

      //비활성화
      { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'YEAR', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('사업부') }, editable: false, visible: false },
      { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('사업부명') }, editable: false, visible: false },
      { fieldName: 'OFFI_RES_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false, visible: false },
      { fieldName: 'EMAIL', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, editable: false, visible: false },
      { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, editable: false, visible: false },
      { fieldName: 'ASGN_SHRT_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'SEX', dataType: 'text', header: { text: t('성별') }, editable: false, visible: false },
      { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'VIO_NO', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'VIO_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'HND_PHN', dataType: 'text', header: { text: t('핸드폰') }, editable: false, visible: false },
    ]
  }
  console.log("grdMainProps.fields!##",grdMainProps.fields)
  grdMainProps.columns = grdMainProps.fields
}

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = data => {
  console.log("받아온 데이터",data)
  _OPEN_CODE.value = data.OPEN_CODE
  _YEAR.value = data.YEAR
  visible.value = ''

  //법정-신규채용자 안전보건교육(채용시교육)
  if(data.OPEN_CODE === '07'){
    Object.keys(popupData_07).forEach(key => {
      popupData_07[key] = ''
    })
    popupData_07.EDU_DT_FROM = dayjs(new Date()).format('YYYY-MM-DD'),   //교육신청일(시작)
    popupData_07.EDU_DT_TO = dayjs().add(30, 'day').format('YYYY-MM-DD'),//교육신청일(종료)
    grdMainfieldSetting(_OPEN_CODE.value)
    _TITLE.value = '사내협력사 신규채용자교육 대상자 조회'
    visible.value = '07'
  }
  //법정-신규채용자 안전보건교육(단기공사-안전통합경영실)
  else if(data.OPEN_CODE === 'C120'){
    Object.keys(popupData_C120).forEach(key => {
      popupData_C120[key] = ''
    })
    grdMainfieldSetting(_OPEN_CODE.value)
    _TITLE.value = '단기공사 교육대상자 조회'
    visible.value = 'C120'
  }
  //법정-신규채용자 안전보건교육(단기공사-생산부서)
  else if(data.OPEN_CODE === 'C227'){
    Object.keys(popupData_C227).forEach(key => {
      popupData_C227[key] = ''
    })
    popupData_C227.EDATE = dayjs(new Date()).format('YYYY-MM-DD')
    grdMainfieldSetting(_OPEN_CODE.value)
    initCodeList()
    _TITLE.value = '단기공사 교육대상자 조회'
    visible.value = 'C227'
  }
  //법정-신규채용자 안전보건교육(협력사/통합안전교육센터)
  else if(data.OPEN_CODE === 'C179'){
    Object.keys(popupData_C179).forEach(key => {
      popupData_C179[key] = ''
    })
    popupData_C179.SAFEDU_YM = dayjs(new Date()).format('YYYY-MM')
    grdMainfieldSetting(_OPEN_CODE.value)
    initCodeList()
    _TITLE.value = '일자별 대상자 조회'
    visible.value = 'C179'
  }
  //의무-안전 아카데미
  else if(data.OPEN_CODE === 'ELSE'){
    Object.keys(popupData_ELSE).forEach(key => {
      popupData_ELSE[key] = ''
    })
    popupData_ELSE.CUTOFF_YM = dayjs(new Date()).format('YYYY-MM')
    grdMainfieldSetting(_OPEN_CODE.value)
    initCodeList()
    _TITLE.value = '절대수칙 위반자 조회'
    visible.value ='ELSE'
  }

  //grdMainSearch()
  dialog.value = true
}

//널값체크
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}

//날짜 체크
const dateFromChange = number => {
  if(number === '07'){
    if(popupData_07.EDU_DT_FROM > popupData_07.EDU_DT_TO){
      popupData_07.EDU_DT_TO = popupData_07.EDU_DT_FROM
    }
  }
}

const dateToChange = number => {
  if(number === '07'){
    if(popupData_07.EDU_DT_TO < popupData_07.EDU_DT_FROM){
      popupData_07.EDU_DT_FROM = popupData_07.EDU_DT_TO
    }
  }
}

const gridRefresh = data => {
  console.log("그리드 리프레쉬", _OPEN_CODE.value)
  console.log("데이터", data)
  if(_OPEN_CODE.value === 'C227' || _OPEN_CODE.value === 'C179' || _OPEN_CODE.value === 'ELSE'){
    if((_OPEN_CODE.value === 'C179' || _OPEN_CODE.value === 'C227' || _OPEN_CODE.value === 'ELSE') && data === 'YM'){
      initCodeList()
      grdMain.value.getDataProvider().setRows([])
    }else{
      grdMain.value.getDataProvider().setRows([])
      return
    }
  }
}

//************************************************이벤트 영역(종료)*********************************************************/
//**********************************************버튼 클릭 이벤트 영역*******************************************************/
//버튼 클릭 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    console.log("서치버튼 누름")
    grdMainSearch()
  }
  else if(btn.id === 'btnTargetAdd'){
    btnTargetAdd()
  }
  else if(btn.id === 'btnClose'){
    grdMain.value.getDataProvider().setRows([])
    dialog.value = false
  }
}
//*******************************************버튼 클릭 이벤트 영역(종료)****************************************************/
//***************************************************조회 영역**************************************************************/
//

const grdMainSearch = () => {
  let queryId = ''
  let searchParams = {}
  if(_OPEN_CODE.value === '07'){
    queryId = 'EDUAB0030_TAB01_POP01_POP04_SEARCH_01'
    searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      FROM_DT : popupData_07.EDU_DT_FROM,
      TO_DT : popupData_07.EDU_DT_TO,
    }
  }
  else if(_OPEN_CODE.value === 'C120'){
    queryId = 'EDUAB0030_TAB01_POP01_POP04_SEARCH_02'
    searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      BSNS_CD : userStore.bsnsCd,
      DEPT_CD : userStore.deptCd,
      VND_NAME : popupData_C120.VND_NAME,
      EMP_NAME : popupData_C120.EMP_NAME,
    }
  }
  else if(_OPEN_CODE.value === 'C227'){
    queryId = 'EDUAB0030_TAB01_POP01_POP04_SEARCH_04'
    let workSelectData = {
      BIZ_REG_NO : '',
      VEND_CD : '',
      WORK_NO : '',
      REV_NO : ''
    }

    // 2024.08.13 김홍규 단기공사 교육 대상자 조회 조건 WORK_NO => WORK_KEY로 비교 변경

    codeList.work.forEach(val => {
      if(popupData_C227.WORK === val.WORK_KEY){
        workSelectData.BIZ_REG_NO = val.BIZ_REG_NO
        workSelectData.VEND_CD = val.VEND_CD
        workSelectData.WORK_NO = val.WORK_NO
        workSelectData.REV_NO = val.REV_NO
      }
    })
    searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      BIZ_REG_NO : workSelectData.BIZ_REG_NO,
      VEND_CD : workSelectData.VEND_CD,
      WORK_NO : workSelectData.WORK_NO,
      REV_NO : workSelectData.REV_NO,
      BSNS_CD : userStore.bsnsCd,
      DEPT_CD : userStore.deptCd,
      CURR_ID : _OPEN_CODE.value,
      EDATE : popupData_C227.EDATE
    }
  }
  else if(_OPEN_CODE.value === 'C179'){
    queryId = 'EDUAB0030_TAB01_POP01_POP04_SEARCH_06'
    searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      YYYYMM : popupData_C179.SAFEDU_YM,
      SAFEDU_DT : popupData_C179.SAFEDU_DT
    }
  }
  else if(_OPEN_CODE.value === 'ELSE'){
    queryId = 'EDUAB0030_TAB01_POP01_POP04_SEARCH_09'
    searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      CUTOFF_DT : popupData_ELSE.CUTOFF_DT,
      YEAR : _YEAR.value
    }
  }

  commonSearchApi({ queryId : queryId, param : searchParams }).then(res => {
    console.log("조회 결과 :::: >>>> ",res)
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      if(_OPEN_CODE.value === 'C120' || _OPEN_CODE.value === 'C227'){
        grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
          var ret = {}
          res.ORESULT_CUR.forEach(val => {
            var COLOR_YN = val.COLOR_YN
            if(COLOR_YN == 'Y'){
              ret.style = { background:"#FFBB00" }
            }
          })
          return ret
        })
      }
      if(_OPEN_CODE.value === 'C227'){
        setGrid(res.ORESULT_CUR)
      }
      Message.success(t('조회되었습니다.'))
    }else{
      grdMain.value.getDataProvider().setRows([])
      Message.warn(t('데이터가 없습니다.'))
    }
  })
}

//C227 한정 그리드 세팅
const setGrid = data => {
  let filterDataRows = []
  data.forEach(val => {
    if(popupData_C227.DTEGBN === 'DOWN'){
      if(val.DATE_GBN === 'DOWN'){
        filterDataRows.push(val)
      }
    }
    else if(popupData_C227.DTEGBN === 'UP'){
      if(val.DATE_GBN === 'UP'){
        filterDataRows.push(val)
      }
    }else{
      filterDataRows.push(val)
    }
  })
  grdMain.value.getDataProvider().setRows(filterDataRows)
}
//*************************************************조회 영역(종료)**********************************************************/
//************************************************데이터 선택 영역**********************************************************/
const btnTargetAdd = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length < 1){
    Message.warn(t("추가할 대상자를 선택해 주세요."))
    return
  }
  let selectDataRows = []
  for(let i = 0; i < checkedRows.length; i++){
    selectDataRows.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    if(_OPEN_CODE.value === 'ELSE'){//절대수칙 위반자 조회
      selectDataRows[i].EMP_NM =  selectDataRows[i].VIOLATOR
      selectDataRows[i].EMP_NO =  selectDataRows[i].VIO_EMP_NO
    }
  }
  console.log("셀렉트 데이터 확인",selectDataRows)
  emit('onSelect',selectDataRows, _OPEN_CODE.value)
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}
//**********************************************데이터 선택 영역(종료)******************************************************/

defineExpose({
  openPopup
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ _TITLE }}</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :button-list="['btnSearch','btnTargetAdd','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!--07 | 사내협력사 신규채용자교육 대상자 조회----------------------------------------------------------------------------->
      <v-card-text class="pa-4 pt-0 content-area" v-if="visible == '07'">
        <v-sheet class="d-flex searchArea">
          <i-input 
            labelWidth="70px" width="220px" 
            :label="$t('교육신청일')" type="date"
            v-model="popupData_07.EDU_DT_FROM"
            @focusout="dateFromChange('07')"
            class="ma-0 mr-2"
          />
          <i-input width="155px"
            :label="$t('-')" type="date"
            v-model="popupData_07.EDU_DT_TO"
            @focusout="dateToChange('07')"
          />
        </v-sheet>
        <v-sheet class="flex-column" height="87%">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </v-card-text>

      <!--C120 | 단기 공사 교육대상자 조회_안전통합경영실----------------------------------------------------------------------------->
      <v-card-text class="pa-4 pt-0 content-area" v-if="visible == 'C120'">
        <v-sheet class="d-flex searchArea">
          <i-input 
            labelWidth="70px" 
            width="218px" 
            :label="$t('협력사명')" 
            v-model="popupData_C120.VND_NAME"
            @keydown.enter="() => onButtonsClick({id : 'btnSearch'})"
            @update:model-value="gridRefresh"
          />
          <i-input 
            width="155px"
            :label="$t('성명')"
            v-model="popupData_C120.EMP_NAME"
            @keydown.enter="() => onButtonsClick({id : 'btnSearch'})"
            @update:model-value="gridRefresh"
          />
        </v-sheet>
        <v-sheet class="flex-column" height="87%">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </v-card-text>

      <!--C227 | 단기공사 교육대상자 조회----------------------------------------------------------------------------->
      <v-card-text class="pa-4 pt-0 content-area" v-if="visible == 'C227'">
        <v-sheet class="d-flex searchArea">
          <i-input 
            labelWidth="70px" 
            width="228px" 
            :label="$t('공사기준일')" 
            v-model="popupData_C227.EDATE"
            type="date"
            @update:model-value="gridRefresh('YM')"
          />
          
   <!--2024.08.13 김홍규 단기공사 교육 대상자 조회 조건 WORK_NO => WORK_KEY로 비교 변경-->
          <i-select 
            labelWidth="40px"
            width="400px"
            :label="$t('공사명')"
            v-model="popupData_C227.WORK"
            :items="codeList.work"
            item-title="WORK_DESC"
            item-value="WORK_KEY"
            @update:model-value="gridRefresh"
          />
          <i-select 
            width="180px"
            :label="$t('기간선택')"
            v-model="popupData_C227.DTEGBN"
            :items="codeList.dteGbn"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh"
          />
        </v-sheet>
        <v-sheet class="flex-column" height="87%">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </v-card-text>

      <!--C179 | 일자별 대상자 조회------------------------------------------------------------------------------>
      <v-card-text class="pa-4 pt-0 content-area" v-if="visible == 'C179'">
        <v-sheet class="d-flex searchArea">
          <i-input 
            labelWidth="50px" 
            width="218px" 
            :label="$t('이수년월')" 
            type="month"
            v-model="popupData_C179.SAFEDU_YM"
            @update:model-value="gridRefresh('YM')"
          />
          <i-select 
            labelWidth="80px"
            width="230px"
            :label="$t('체험관이수일')"
            v-model="popupData_C179.SAFEDU_DT"
            :items="codeList.safeduDt"
            item-title="SAFEDU_FIN_DT"
            item-value="SAFEDU_FIN_DT"
            @update:model-value="gridRefresh"
          />
        </v-sheet>
        <v-sheet class="flex-column" height="87%">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </v-card-text>

      <!--ELSE | 절대수칙 위반자 조회------------------------------------------------------------------------------>
      <v-card-text class="pa-4 pt-0 content-area" v-if="visible == 'ELSE'">
        <v-sheet class="d-flex searchArea">
          <i-input width="210px" 
            :label="$t('컷오프년월')" type="month"
            v-model="popupData_ELSE.CUTOFF_YM"
            margin="5px"
            class="mr-2"
            @update:model-value="gridRefresh('YM')"
          />
          <i-select width="220px"
            :label="$t('컷오프일')"
            v-model="popupData_ELSE.CUTOFF_DT"
            :items="codeList.cutoffDt"
            item-title="CUTOFF_DT"
            item-value="CUTOFF_DT"
            class="mr-2"
            @change="cutoffChanged"
            @update:model-value="gridRefresh"
          />
          <i-input width="190px"
            :label="$t('확정일')"
            v-model="popupData_ELSE.HEAD_CNFM_DT"
            @update:model-value="gridRefresh"
            readonly
          />
        </v-sheet>
        <v-sheet class="flex-column" height="87%">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (400px - 12px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>