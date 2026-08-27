<!-- 
  화면명 : 업무상질병 결과 관리
  화면개요 : 업무상질병 결과 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonRequest } from '@hiway/api/commonApi'
import { useRoute, useRouter } from 'vue-router'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import HLTJB0010Popup01 from '@/pages/100_health/HLT_J/HLTJB0010Popup01.vue'
import HLTJB0010Popup02 from '@/pages/100_health/HLT_J/HLTJB0010Popup02.vue'
import HLTJB0010Popup03 from '@/pages/100_health/HLT_J/HLTJB0010Popup03.vue'
import HLTJB0010Popup04 from '@/pages/100_health/HLT_J/HLTJB0010popup04.vue'
import HLTJB0010Popup05 from '@/pages/100_health/HLT_J/HLTJB0010Popup05.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' //결재

defineOptions({
  name:'100_health-HLT_J-HLTJB0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const router = useRouter() 

// 첨부파일 버튼 리스트
const buttonList = reactive(['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose'])

// const isAdmin = ref(0)
const empPopup = ref(null)
const fileUploadPopup = ref(null)
const hltjb0010Popup01 = ref(null) // 추가,변경
const hltjb0010Popup02 = ref(null) // 사실통지
const hltjb0010Popup03 = ref(null)
const hltjb0010Popup04 = ref(null) // 작업표준 복사
const hltjb0010Popup05 = ref(null) // 최종제출
const approvalPopup = ref(null) // 결재
const menuTitle = ref(null)
const grdMain = ref(null)
const selectedRow = ref(null)
const selectedCol = ref(null)
const fileTitle = ref('')
// 관리자
const isAdmin = ref(0)
// 부서장, 직책과장
const noGRP = ref(false)
// 부서원
const noGRP2 = ref(false)
// 아무 권한 없는 사람
const unKnown = ref(false)
// 부서장, 직책과장 여부 테스트 ( 맞으면 사업부, 부서 disable )
// userStore.authGrpCd = ['GRP00387'];
// admin그룹 테스트
// userStore.authGrpCd = ['HIWAYGRP00001'];

// 조회조건
const searchParams = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  EMP_NO: '',
  EMP_NM: '',
  APPLI_GUBUN: '',
  EVAL_RESULT: '',
  TMP_DIAGNOSIS_DATE_FROM: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
  DIAGNOSIS_DATE_FROM: '',
  TMP_DIAGNOSIS_DATE_TO: dayjs().format('YYYY-MM-DD'),
  DIAGNOSIS_DATE_TO: '',
  RETI_YN: 'N'
})

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EMP_NO: '',
  DIAGNOSIS_DATE: '',
  HOSPITAL_CODE: '',
  HOSPITAL_NM: '',
  EVAL_RESULT: '',
  AMBUL_DATE: '',
  INPATIENT_DATE: '',
  SUM_DATE: '',
  EVAL_DATE: '',
  REST_DATE: '',
  RETURN_DATE: '',
  REST_GUBUN: '',
  REST_DAY: '',
  REMARK: '',
  USER_ID: userStore.userId,
})

const codeList = reactive({
  COMPANY: [],
  BSNS_CD: [],
  DEPT_CD: [],
  APPLI_GUBUN: [],
  HOSPITAL: [],
  BODY1: [],
  BODY2: [],
  DISEASE: [],
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴사' },
    { COD: '4', TXT: '군입영' },
  ],
  EVAL_RESULT: []
})

// 보건관리자여부 확인
// HLTJ001 (직업병관리 모듈 담당자)
// HLTJ002 (직업병관리 부서 담당자)
// GRP00372 (보건 총괄)
// 0: 일반 사용자, 1:부서담당자 ,2: 직엽병관리 모듈 담당자
if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTJ001') || userStore.authGrpCd.includes('GRP00372')) isAdmin.value = 2
else if (userStore.authGrpCd.includes('GRP00387') || userStore.authGrpCd.includes('GRP00389') || userStore.authGrpCd.includes('HLTJ002')) isAdmin.value = 1
else isAdmin.value = 0 

/*  공통코드 세팅 */
onMounted(() => {
  Promise.all([
    // 회사구분
    getCompanyList(),
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y'} }),
    // 신청구분
    getCodeList('HHII820A'),
    // 진단기관
    getCodeList('HHII820C'),
    // 신체부위1
    getCodeList('HHII820D'),
    // 신체부위2
    getCodeList('HHII820E'),
    // 상병
    getCodeList('HHII820F'),
    // 판정결과
    getCodeList('HHII820I')
  ]).then((res) => {
    codeList.COMPANY = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.APPLI_GUBUN = res[3].ORESULT_CUR
    codeList.HOSPITAL = res[5].ORESULT_CUR
    codeList.BODY1 = res[5].ORESULT_CUR
    codeList.BODY2 = res[6].ORESULT_CUR
    codeList.DISEASE = res[7].ORESULT_CUR
    codeList.EVAL_RESULT = res[8].ORESULT_CUR

    codeList.COMPANY.unshift({ TXT: '전체', COD: ''})
    codeList.BSNS_CD.unshift({ BSNS_NM : '전체', BSNS_CD : '' })
    codeList.DEPT_CD.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
    codeList.APPLI_GUBUN = codeList.APPLI_GUBUN.filter(item => item.TXT.replaceAll(' ', '') != '직접입력')
    codeList.APPLI_GUBUN.unshift({ TXT : '전체', COD : '' })
    // codeList.EVAL_RESULT.unshift({ TXT : '전체', COD : '' })
    grdMain.value.setBindingColumn('HLD_OFFI_GBN', codeList.HLD_OFFI_GBN, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EVAL_RESULT', codeList.EVAL_RESULT, 'COD', 'TXT')
    grdMain.value.setBindingColumn('REST_GUBUN', codeList.HLD_OFFI_GBN, 'COD', 'TXT')

  })
})


//그리드 속성셋팅 
const grd1Props = reactive({ 
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }, header: { height: 75 }},
  keys : [], 
  fields : [ 
    { fieldName: 'EMP_NO', width: '80', editable: false, dataType: 'text', header: { text: t('사번') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }},
    { fieldName: 'CMPNY_NM', width: '120', editable: false, dataType: 'text', header: { text: t('회사구분') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }},
    { fieldName: 'BSNS_NM', width: '80', editable: false, dataType: 'text', header: { text: t('사업부') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }, lookupDisplay: true },
    { fieldName: 'DEPT_NM', width: '120', editable: false, dataType: 'text', header: { text: t('부서') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }, lookupDisplay: true},
    { fieldName: 'GWA_NM', width: '80', editable: false, dataType: 'text', header: { text: t('과') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }, lookupDisplay: true },
    { fieldName: 'KOR_NM', width: '80', editable: false, dataType: 'text', header: { text: t('성명') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'JOB_TIT_NM', width: '80', editable: false, dataType: 'text', header: { text: t('직위') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'HLD_OFFI_GBN', width: '80', editable: false, dataType: 'text', header: { text: t('재직구분') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' }, lookupDisplay: true },
    { fieldName: 'BIRTH_DAY', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('생년월일') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'COM_ENT_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('입사일') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'RETI_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('휴•퇴직일') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'WORK_YEAR', width: '100', editable: false, dataType: 'text', header: { text: t('근속연수') },  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    // { fieldName: 'STD_DUTY_NM', width: '100', editable: false, dataType: 'text', header: { text: t('직종') },  mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'APPLI_GUBUN_NM', width: '100', editable: false, dataType: 'text', header: { text: t('신청구분') }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'APPLI_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('진정일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'DIAGNOSIS_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('진단일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'CMPNY_RCPT_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('회사접수일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'HOSPITAL_NM', width: '150', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('진단기관') }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + value' } },
    { fieldName: 'BODY1_NM', width: '120', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('신체부위1') }, lookupDisplay: true },
    { fieldName: 'BODY2_NM', width: '120', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('신체부위2') }, lookupDisplay: true },
    { fieldName: 'DISEASE_NM', width: '150', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('상병명') }, lookupDisplay: true },
    
    // 판정결과부터 최종저장일이 있으면 수정가능
    { fieldName: 'EVAL_RESULT', width: '100', dataType: 'text', header: { text: t('판정결과') }, lookupDisplay: true,  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' },
      // 권한에 따라 editor 유/무
      styleName: isAdmin.value < 2 ? 'left-column' : 'editable_column',
      editable: isAdmin.value < 2 ? false : true,
      editor: isAdmin.value < 2 ? {} : { type: 'dropdown',}
    },
    { fieldName: 'AMBUL_DATE', width: '100', dataType: 'text', header: { text: t('통원일수(일)') }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' }, 
      // 권한에 따라 editor 유/무
      styleName: isAdmin.value < 2 ? 'right-column' : 'editable_column right-column',
      editable: isAdmin.value < 2 ? false : true,
      },
    { fieldName: 'INPATIENT_DATE', width: '100', dataType: 'text', header: { text: t('입원일수(일)') }, lookupDisplay: true,  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' },
      // 권한에 따라 editor 유/무
      styleName: isAdmin.value < 2 ? 'right-column' : 'editable_column right-column',
      editable: isAdmin.value < 2 ? false : true,
    },
    { fieldName: 'SUM_DATE', width: '70', dataType: 'text', header: { text: t('합계(일)') }, lookupDisplay: true,  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' }, styleName:'right-column', editable: false },
    { fieldName: 'EVAL_DATE', width: '100', dataType: 'text', header: { text: t('판정일') }, lookupDisplay: true,  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' },
      // 권한에 따라 editor 유/무
      styleName: isAdmin.value < 2 ? 'left-column' : 'editable_column',
      editable: isAdmin.value < 2 ? false : true,
      editor: isAdmin.value < 2 ? {} :{
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
    { fieldName: 'REST_DATE', width: '100', dataType: 'text', header: { text: t('휴직일') }, lookupDisplay: true,  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' },
      // 권한에 따라 editor 유/무
      styleName: isAdmin.value < 2 ? 'left-column' : 'editable_column',
      editable: isAdmin.value < 2 ? false : true,
      editor: isAdmin.value < 2 ? {} :{
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
    // { fieldName: 'leaveDate', width: '100', dataType: 'text', header: { text: t('휴직일') }, editable: false, lookupDisplay: true,  mergeRule: { criteria: 'values["HOSPITAL_CODE"]+ values["EMP_NO"]' } },
    { fieldName: 'RETURN_DATE', width: '100', dataType: 'text', header: { text: t('복직일') }, lookupDisplay: true,  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' },
      // 권한에 따라 editor 유/무
      styleName: isAdmin.value < 2 ? 'left-column' : 'editable_column',
      editable: isAdmin.value < 2 ? false : true,
      editor: isAdmin.value < 2 ? {} :{
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
    // { fieldName: 'returnDate', width: '100', dataType: 'text', header: { text: t('복직일') }, editable: false, lookupDisplay: true,  mergeRule: { criteria: 'values["HOSPITAL_CODE"]+ values["EMP_NO"]' } },
    { fieldName: 'REST_GUBUN', width: '100', dataType: 'text', header: { text: t('휴직구분') }, lookupDisplay: true,  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' },
      // 권한에 따라 editor 유/무
      styleName: isAdmin.value < 2 ? 'left-column' : 'editable_column',
      editable: isAdmin.value < 2 ? false : true,
      editor: isAdmin.value < 2 ? {} : { type: 'dropdown',}
    },
    // { fieldName: 'leaveReason', width: '100', dataType: 'text', header: { text: t('휴직구분') }, editable: false, lookupDisplay: true,  mergeRule: { criteria: 'values["HOSPITAL_CODE"]+ values["EMP_NO"]' } },
    { fieldName: 'REST_DAY', width: '100', dataType: 'text', header: { text: t('휴직일수(일)') }, styleName: 'right-column', editable: false, lookupDisplay: true,  mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    // { fieldName: 'restDay', width: '50', dataType: 'text', header: { text: t('휴직일수(일)') }, editable: false, lookupDisplay: true,  mergeRule: { criteria: 'values["HOSPITAL_CODE"]+ values["EMP_NO"]' } },
    { fieldName: 'REMARK', width: '170', dataType: 'text', styleName:'left-column', header: { text: t('비고') }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' }, 
      // 권한에 따라 editor 유/무
      styleName: isAdmin.value < 2 ? 'left-column' : 'editable_column left-column',
      editable: isAdmin.value < 2 ? false : true,
    },
    { fieldName: 'FINAL_DATE', dataType: 'text', header: { text: t('최종제출일') }, editable: false, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'NOTIFY_FILE_ID', dataType: 'text', header: { text: t('통지 첨부파일ID') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') },visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('과') },visible: false, },
    { fieldName: 'HOSPITAL_CODE', dataType: 'text', header: { text: t('진단기관') },visible: false, },
    { fieldName: 'BODY1_CODE', dataType: 'text', header: { text: t('부위1') },visible: false, },
    { fieldName: 'BODY2_CODE', dataType: 'text', header: { text: t('부위2') },visible: false, },
    { fieldName: 'DISEASE_CODE', dataType: 'text', header: { text: t('상병') },visible: false, },
    { fieldName: 'APPLI_GUBUN', dataType: 'text', header: { text: t('신청구분') },visible: false, },
    { fieldName: 'ADD_FILE_ID', dataType: 'text', header: { text: t('추가 첨부파일ID') },visible: false, },
    { fieldName: 'INCIDENT_CODE', dataType: 'text', header: { text: t('발생경위 코드') },visible: false, },
    { fieldName: 'INCIDENT_NM', dataType: 'text', header: { text: t('발생경위') },visible: false, },
    { fieldName: 'IDX', dataType: 'text', header: { text: t('상병IDX') },visible: false, },
    { fieldName: 'HR_MEMO_FILE_ID', dataType: 'text', header: { text: t('인사기록부') },visible: false, },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', header: { text: t('작업표준ID') },visible: false, },
    { fieldName: 'HR_ATTEND_FILE_ID', dataType: 'text', header: { text: t('근태기록부') },visible: false, },
    { fieldName: 'HR_REMARK_FILE_ID', dataType: 'text', header: { text: t('인사부서용 기타자료') },visible: false, },
    { fieldName: 'DEPT_REMARK_FILE_ID', dataType: 'text', header: { text: t('현업부서용 기타자료') },visible: false, },
    { fieldName: 'WORK_EVAL', dataType: 'text', header: { text: t('작업력평가') },visible: false, },
    { fieldName: 'CHK_DISEASE', dataType: 'text', header: { text: t('체크된 상병명') },visible: false, },
    { fieldName: 'CHK_STD1', dataType: 'text', header: { text: t('체크된 용접') },visible: false, },
    { fieldName: 'CHK_STD2', dataType: 'text', header: { text: t('체크된 취부') },visible: false, },
    { fieldName: 'CHK_STD3', dataType: 'text', header: { text: t('체크된 배관') },visible: false, },
    { fieldName: 'CHK_STD4', dataType: 'text', header: { text: t('체크된 도장') },visible: false, },
    { fieldName: 'AGE', dataType: 'text', header: { text: t('나이') },visible: false, },
    { fieldName: 'SEX', dataType: 'text', header: { text: t('성별') },visible: false, },
  ],
  columnLayout: [
    {
      name: '대상자 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'EMP_NO', 'CMPNY_NM', 'BSNS_NM', 'DEPT_NM', 'GWA_NM', 'KOR_NM', 'JOB_TIT_NM', 'HLD_OFFI_GBN', 'BIRTH_DAY', 'COM_ENT_DATE', 'RETI_DATE', 'WORK_YEAR' ],
      header: { text: t('대상자 정보') },
    },
    { 
      name: '결과 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'APPLI_GUBUN_NM', 'APPLI_DATE', 'DIAGNOSIS_DATE', 'CMPNY_RCPT_DATE', 'HOSPITAL_NM', 'BODY1_NM', 'BODY2_NM', 'DISEASE_NM', 'EVAL_RESULT',
                {
                  name: '인정 요양기간',
                  styleName: 'multiline-editor-pre',
                  direction: 'horizontal',
                  items: [ 'AMBUL_DATE', 'INPATIENT_DATE', 'SUM_DATE' ],
                  header: { text: t('인정 요양기간') },
                },
                'EVAL_DATE'],
      header: { text: t('결과 정보') },
    },
    {
      name: '요양 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'REST_DATE', 'RETURN_DATE', 'REST_GUBUN', 'REST_DAY', 'REMARK'],
      header: { text: t('요양 정보') },
    },
    'FINAL_DATE'
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
    .run()
  }
}

// 그리드 데이터 조회
const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  searchParams.DIAGNOSIS_DATE_FROM = searchParams.TMP_DIAGNOSIS_DATE_FROM.replaceAll('-','')
  searchParams.DIAGNOSIS_DATE_TO = searchParams.TMP_DIAGNOSIS_DATE_TO.replaceAll('-','')
  // Back단에서 인사정보 API 호출해서 기존 조회 데이터와 합쳐서 결과값을 보내주는걸로 확인
  // 인사정보 API로 호출된 값은 앞에 API를 붙임
  return commonRequest('/hse/health/HLTJB0020_GET_01', searchParams )
}
 
// 조회 후
const afterSearch = res => {
  grdMain.value.getGridView().filterPanel.visible = true
  const filtered = res.filter(row => {
    return Object.values(row).some(val => val !== null && val !== '');
  }).map(row => {

      // 기존 저장데이터가 없으면 인사정보 API 에서 가져오는 데이터로 덮어쓰기  
      if(isEmpty(row.REST_DATE)) {
        row.REST_DATE = row.API_REST_DATE
      }

      if(isEmpty(row.RETURN_DATE)) {
        row.RETURN_DATE = row.API_RETURN_DATE
      }

      if(isEmpty(row.REST_GUBUN)) {
        row.REST_GUBUN = row.API_REST_GUBUN
      }

      const ambulStr = row.AMBUL_DATE;
      const inpatientStr = row.INPATIENT_DATE;

      const hasAmbul = ambulStr !== null && ambulStr !== '';
      const hasInpatient = inpatientStr !== null && inpatientStr !== '';

      let sum = '';

      if (hasAmbul || hasInpatient) {
        const ambul = parseInt(ambulStr) || 0;
        const inpatient = parseInt(inpatientStr) || 0;
        sum = ambul + inpatient;
      }

      return {
        ...row,
        SUM_DATE: sum
      };
    });
  grdMain.value.getDataProvider().setRows(filtered)
}

// 저장 전
const beforeSave = () => {
  let chekedRow = ref([])
  let bCheck = true
  chekedRow = grdMain.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }

  saveParams.value = [];

  let uniqueRows = [];
  let rowKeys = new Set();
  let invalidRows = [];

   // 숫자 유효성 검사 함수
  const isValidNumber = (val) => /^\d+$/.test(val);

  // 날짜 유효성 검사 함수
  // const isValidEvalDate = (val) => {
  //   if (!val) return false;
  //   const clean = val.replace(/-/g, '');
  //   if (!/^\d{8}$/.test(clean)) return false;

  //   const year = parseInt(clean.slice(0, 4));
  //   const month = parseInt(clean.slice(4, 6)) - 1;
  //   const day = parseInt(clean.slice(6, 8));
  //   const date = new Date(year, month, day);

  //   return (
  //     date.getFullYear() === year &&
  //     date.getMonth() === month &&
  //     date.getDate() === day
  //   );
  // };

  chekedRow.forEach(index => {
    let row = grdMain.value.getDataProvider().getJsonRow(index);

    // 고유키 생성
    let uniqueKey = `${row.HOSPITAL_CODE}`;

    if (!rowKeys.has(uniqueKey)) {
      rowKeys.add(uniqueKey);
      uniqueRows.push(row);
    }
  });

  uniqueRows.forEach(row => {
    const ambul = row.AMBUL_DATE;
    const inpatient = row.INPATIENT_DATE;
    // const evalDate = row.EVAL_DATE;

    // 최종 제출일 없으면 오류
    if (!row.FINAL_DATE || row.FINAL_DATE.trim() === "") {
      invalidRows.push(row);
      return;
    }

    // 통원일 숫자 체크
    if (ambul !== undefined && ambul !== '' && !isValidNumber(ambul)) {
      Message.warn(t('통원일은 숫자만 입력 가능합니다.'));
      bCheck = false;
      return;
    }

    // 입원일 숫자 체크
    if (inpatient !== undefined && inpatient !== '' && !isValidNumber(inpatient)) {
      Message.warn(t('입원일은 숫자만 입력 가능합니다.'));
      bCheck = false;
      return;
    }

    saveParams.value.push({
      cmpnyDiv: userStore.cmpnyDiv,
      userId: userStore.userId,
      ...row
    });

  });

  if (invalidRows.length > 0) {
    Message.warn(t("최종 제출일이 없는 항목은 저장할 수 없습니다."));
    return false;
  }

  return bCheck;
  }

// 저장
const saveData = () => {
  return commonExecuteApi({ queryId : 'HLTJB0020_SAVE_01', list: saveParams.value })
}

//팝업 선택 이벤트
const onEmpSelected = val => {
  searchParams.EMP_NO = val.EMP_NO
  searchParams.EMP_NM = val.EMP_NM
  onButtonsClick({ id: 'btnSearch'})
}

const openEmpPopup = () => {
  empPopup.value.openPopup({MENU_ID: 'HLTJB0020', USER_DIV: 'A', FLAG: 'Y', readonly: true})
}

const clearEmp = () => {
  searchParams.EMP_NO = ''
  searchParams.EMP_NM = ''
  onButtonsClick({ id: 'btnSearch'})
} 

// 회사구분 변경 이벤트
watch(() => searchParams.CMPNY_DIV, (newValue, oldValue) => {
  searchParams.BSNS_CD = ''
  if(isEmpty(newValue)) {
    codeList.BSNS_CD = [
      {BSNS_NM: '전체', BSNS_CD: ''}
    ]
    return
  }
  Promise.all([
    // 부서
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({BSNS_NM: '전체', BSNS_CD: ''})
  })
})

watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  Promise.all([
    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue, USE_DIV: 'Y'} }),
  ]).then((res) => {
    searchParams.DEPT_CD = ''
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
  })
})

// watch(() => searchParams.APPLI_GUBUN, (newValue, oldValue) => {
//   getData()
// })
// watch(() => searchParams.EVAL_RESULT, (newValue, oldValue) => {
//   getData()
// })

// 그리드 데이터 변경 시
const onEditCommit = async (grid, index, oldValue, newValue) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.itemIndex);
  if(index.fieldName === 'AMBUL_DATE' || index.fieldName === 'INPATIENT_DATE') {
    // 숫자가 아니면 0으로 변경
    if(!/^\d+$/.test(newValue)) {
      newValue = 0
    }
  }
  
  await grid.commit(); // 값 즉시 반영
  
  // 입력한 값 그룹화된 컬럼들 동기화
  for (let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0, -1).length; i++) {
    let rowData = grdMain.value.getDataProvider().getJsonRow(i);

    // 같은 그룹(회사구분, 사번, 진단일, 병원코드, 병원이름)이면 동기화
    if (
      data.CMPNY_DIV === rowData.CMPNY_DIV &&
      data.EMP_NO === rowData.EMP_NO &&
      // data.DIAGNOSIS_DATE === rowData.DIAGNOSIS_DATE &&
      data.HOSPITAL_CODE === rowData.HOSPITAL_CODE &&
      data.HOSPITAL_NM === rowData.HOSPITAL_NM
    ) {
      grid.setValue(i, index.fieldName, newValue); // 같은 그룹의 값 동기화
      grdMain.value.getGridView().checkRow(i, true, false, false); // 자동 체크
    }
  }

  // 동기화된 데이터로 합계일 계산
  for (let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0, -1).length; i++) {
    let rowData = grdMain.value.getDataProvider().getJsonRow(i);
    if(!isEmpty(rowData.AMBUL_DATE) && !isEmpty(rowData.INPATIENT_DATE)) {
      grid.setValue(i, 'SUM_DATE', Number(rowData.AMBUL_DATE) + Number(rowData.INPATIENT_DATE))
    }
  }

  // 동기화된 데이터로 휴직일 수 계산
  for (let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0, -1).length; i++) {
    let rowData = grdMain.value.getDataProvider().getJsonRow(i);
    if(!isEmpty(rowData.REST_DATE) && !isEmpty(rowData.RETURN_DATE)) {
      grid.setValue(i, 'REST_DAY', dayjs(rowData.RETURN_DATE).diff(rowData.REST_DATE, 'day'))
    }
  }
};

// 체크박스 클릭
const onItemChecked = (grid, itemIndex, checked) => {
  let data = grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getDataRow(itemIndex))
  for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0,-1).length; i++) {
    let dt = grdMain.value.getDataProvider().getJsonRow(i)
    if(i == grdMain.value.getGridView().getDataRow(itemIndex)) {
      continue
    }
    if(data.CMPNY_DIV == dt.CMPNY_DIV && data.EMP_NO == dt.EMP_NO && dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') && data.HOSPITAL_CODE == dt.HOSPITAL_CODE && data.HOSPITAL_NM == dt.HOSPITAL_NM) {
      grdMain.value.getGridView().checkRow(i, checked, false, false)
    }
  }
}

// 휴직일 복직일 휴직구분
const getCurrentStatusInfo = (data) => {

  let status = null;
  let leaveDate = null;
  let returnDate = null;
  let leaveReason = null;
  let restDay = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const reason = row.ACTION_REASON_DESCR || "";
    const actDate = row.ACT_DATE;

    // 1. 첫 등장으로 현재 상태 판단
    if (!status) {
      if (reason.includes("복직")) {
        status = "재직";
      } else if (reason.startsWith("휴직/")) {
        status = "휴직";
        leaveDate = actDate;
        leaveReason = reason.replace("휴직/", "").trim();
        break;
      }
    }

    // 2. 상태가 재직인 경우 → 휴직/복직일 찾기
    if (status === "재직") {
      if (!leaveDate && reason.startsWith("휴직/")) {
        leaveDate = actDate;
        leaveReason = reason.replace("휴직/", "").trim();
      }
      if (!returnDate && reason.includes("복직")) {
        returnDate = actDate;
      }

      if (leaveDate && returnDate) break;
    }
  }

      // 휴직일수 계산
      if (returnDate) {
        const start = new Date(leaveDate);
        const end = new Date(returnDate);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        restDay = isNaN(diff) ? null : diff;
      }

  return {
    status: status,
    REST_DATE: leaveDate,
    RETURN_DATE: returnDate,
    REST_GUBUN: leaveReason,
    REST_DAY: restDay
  };
};

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.CMPNY_DIV"
            :label="$t('회사구분')"
            label-width="50px"
            :items="codeList.COMPANY"
            item-value="COD"
            item-title="TXT" 
            width="200px"
            :readonly="isAdmin < 2"
          />
          <i-select
            v-model="searchParams.BSNS_CD"
            :label="$t('사업부')"
            label-width="50px"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM" 
            width="200px"
            :disabled="(isAdmin < 2)"
            :readonly="isEmpty(searchParams.CMPNY_DIV)"            
          />
          <i-select
            v-model="searchParams.DEPT_CD"
            :label="$t('부서')"
            label-width="50px"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM" 
            width="200px"
            :disabled="(isAdmin < 2)"
            :readonly="isEmpty(searchParams.BSNS_CD)"
          />
          <i-input
              v-model="searchParams.EMP_NM"
              :label="$t('산재자')"
              label-width="50px"
              width="200px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openEmpPopup"
              @keydown.enter="openEmpPopup"
            >
              <template #append-inner>
                <v-icon
                  icon="mdi-window-close"
                  @click="clearEmp"
                />
              </template>
          </i-input>
          <i-select
            v-model="searchParams.APPLI_GUBUN"
            :label="$t('산재구분')"
            label-width="50px"
            :items="codeList.APPLI_GUBUN"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.EVAL_RESULT"
            :label="$t('승인구분')"
            label-width="50px"
            :items="codeList.EVAL_RESULT"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-input
            v-model="searchParams.TMP_DIAGNOSIS_DATE_FROM"
            label-width="50px"
            :label="$t('진단일')"
            type="date"
            width="200px"
            class="mr-2"
          />
          <i-input
            v-model="searchParams.TMP_DIAGNOSIS_DATE_TO"
            label-width="20px"
            :label="$t('~')"
            type="date"
            width="180px"
          />
          <v-checkbox
            v-model="searchParams.RETI_YN"
            :label="$t('퇴직포함')"
            true-value="Y" 
            false-value="N"
            class="mt-1"
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
            @onItemChecked="onItemChecked"
            @onEditCommit="onEditCommit"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
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