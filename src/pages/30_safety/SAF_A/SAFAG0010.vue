<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 산재정보 등록/현황  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFAG0010DblClickPopup from '@/pages/30_safety/SAF_A/SAFAG0010DblClickPopup.vue'
import SAFAG0010btnRegist1Popup from '@/pages/30_safety/SAF_A/SAFAG0010btnRegist1Popup.vue'
import SAFAG0010btnRegist2Popup from '@/pages/30_safety/SAF_A/SAFAG0010btnRegist2Popup.vue'
import SAFAG0010btnRegist3Popup from '@/pages/30_safety/SAF_A/SAFAG0010btnRegist3Popup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { truncate } from 'lodash-es'
import AcdtPopup from '@/components/popup/AcdtPopup.vue'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
defineOptions({
  name: '30_safety-SAF_A-SAFAG0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)
const DblClickPopUp = ref(null)
const btnRegist1Popup = ref(null)
const btnRegist2Popup = ref(null)
const btnRegist3Popup = ref(null)
const empPopup = ref(null) //인원팝업
const noBsns = ref(true)
const fileUploadPopup = ref(null) //파일 업로드 팝업
const acdtPopupRef = ref(null) //사고형태 팝업
let currentRow = ref(null) //선택 행

const MainSearchParams = reactive({
  CMPNY_DIV: '', //회사
  STATUS: '', //진행상태
  FROM: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), //검색기간 FROM
  TO: dayjs().format('YYYY-MM-DD'), //검색기간 TO
  DATE_YN: 'N', //검색기간 체크박스
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  EMP_NO: '', //재해자사번
  NAME: '', //재해자이름
  SANGBN: '', //산재구분
  SAGOTYPE: '', //사고형태
  SAGOTYPE_NM: '', //사고형태 이름 (실제로DB에서 조회조건으로 사용되지는 않음 사용자에게 보여주기 위한 값)
  USER_ID: userStore.userId, //로그인유저 아이디
  IP_ADDRESS: userStore.clientIp, //IP주소
  //WORK_HEAL_GBN: '', //취업치료
  //SANOK: '', //승인여부 2024.07.08 김민선 사원 요청으로 승인여부 삭제
})

//코드리스트
const codeList = reactive({
  company: [], //회사
  STATUS: [], //진행상태
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  SANGBN: [], //산재구분(진폐x)
  GRD_SANGBN: [], //그리드바인딩 산재구분(진폐포함)
  UNION_YN: [
    //노조가입여부
    { COD: 'Y', TXT: '가입' },
    { COD: 'N', TXT: '미가입' },
  ],
  HLD_OFFI_GBN: [
    //재직여부
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴직' },
    { COD: '4', TXT: '입대' },
  ],
})

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIZ000'), //회사구분 조회
    getCodeList('HHIB250060'), //진행상태 조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
    }), //사업부조회
    getCodeList('HHIB250030'), //산재구분 조회 (일반사고,난청,진폐,중대재해)
    getCodeList('HHIB250010'), //신청구분 조회
    getCodeList('HHIB250020'), //요양구분 조회
    getCodeList('HHIB080'), //산재구분 조회(업무상사고,질병,출퇴근 재해)

    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_01',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }), //7

    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_02',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }), //8
    getCodeList('HHIB310'),
  ])
    .then((res) => {
      codeList.company = res[0].ORESULT_CUR.filter(
        (x) => x.COD === '100' || x.COD === 'HHI' || x.COD === '230'
      )
      codeList.STATUS = res[1].ORESULT_CUR
      codeList.SANGBN = res[3].ORESULT_CUR
      codeList.GRD_SANGBN = res[3].ORESULT_CUR
      codeList.WORK_HEAL_GBN = res[9].ORESULT_CUR
      grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
      grdMain.value.setBindingColumn(
        'SANGBN',
        codeList.GRD_SANGBN,
        'COD',
        'TXT'
      )
      grdMain.value.setBindingColumn('REQGBN', res[4].ORESULT_CUR, 'COD', 'TXT')
      grdMain.value.setBindingColumn('YOGBN', res[5].ORESULT_CUR, 'COD', 'TXT')
      grdMain.value.setBindingColumn(
        'SJE_TYPE_CD',
        res[6].ORESULT_CUR,
        'COD',
        'TXT'
      )

      grdMain.value.setBindingColumn(
        'INJURYPART',
        res[8].ORESULT_CUR,
        'COD',
        'TXT'
      )
      grdMain.value.setBindingColumn(
        'UNION_YN',
        codeList.UNION_YN,
        'COD',
        'TXT'
      )
      grdMain.value.setBindingColumn(
        'HLD_OFFI_GBN',
        codeList.HLD_OFFI_GBN,
        'COD',
        'TXT'
      )
      grdMain.value.setBindingColumn(
        'WORK_HEAL_GBN',
        codeList.WORK_HEAL_GBN,
        'COD',
        'TXT'
      )
      grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
      codeList.STATUS.unshift({ TXT: '전체', COD: '' })
      codeList.SANGBN.unshift({ TXT: '전체', COD: '' })
      codeList.company.unshift({ TXT: '전체', COD: '' })
      codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      codeList.DEPT_CD.unshift({ TXT: '전체', COD: '' })
      codeList.WORK_HEAL_GBN.unshift({ TXT: '전체', COD: '' })
    })
    .catch((err) => {})
}

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()

  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 16,
    })
  })

  grdMain.value.getGridView().filterPanel.visible = true
})

//  재해자변경 감지
watch(
  () => MainSearchParams.NAME,
  (newValue) => {
    if (newValue === '') {
      MainSearchParams.EMP_NO = ''
    }
  }
)

//  회사변경 감지
watch(
  () => MainSearchParams.CMPNY_DIV,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: newValue, USE_DIV: 'N' },
    }).then((res) => {
      MainSearchParams.BSNS_CD = ''
      codeList.BSNS_CD = res.ORESULT_CUR

      codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    })
  }
)

// 사업부 변경감지
watch(
  () => MainSearchParams.BSNS_CD,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: MainSearchParams.CMPNY_DIV, BSNS_CD: newValue },
    }).then((res) => {
      MainSearchParams.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR

      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      noBsns.value = false
    })
    if (!newValue) {
      noBsns.value = true
    }
  }
)

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'RESULT_FILE_ID',
      dataType: 'text',
      width: '38',
      editable: false,
      header: { text: t('유첨') },
      isFile: { value: true, showAlways: true },
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      header: { text: t('진행상태') },
      width: '45',
      lookupDisplay: true,
      styleName: 'editable-column',
      editor: {
        type: 'dropdown',
      },
      lookupDisplay: true,
    },
    {
      fieldName: 'HLD_OFFI_GBN',
      dataType: 'text',
      width: '45',
      editable: false,
      header: { text: t('재직구분') },
      lookupDisplay: true,
    },
    {
      fieldName: 'HAP_YN',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('합의여부') },
    },
    {
      fieldName: 'SANOK',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('승인여부') },
    },
    {
      fieldName: 'EMAIL_YN',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('메일발송여부') },
    },
    {
      fieldName: 'FILENUM',
      dataType: 'text',
      width: '40',
      header: { text: t('파일번호') },
    },
    {
      fieldName: 'SANGBN',
      dataType: 'text',
      width: '60',
      header: { text: t('산재구분') },
      lookupDisplay: true,
    },
    {
      fieldName: 'YOGBN',
      dataType: 'text',
      width: '45',
      editable: false,
      header: { text: t('요양구분') },
      lookupDisplay: true,
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '85',
      editable: false,
      header: { text: t('부서명') },
    },

    {
      fieldName: 'EMPLNO',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('사번') },
    },

    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'REG_NO',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('주민번호') },
    },
    {
      fieldName: 'OCCURDATE',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('재해일자') },
    },
    {
      fieldName: 'OKDTE',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('승인일자') },
    },
    {
      fieldName: 'REQGBN',
      dataType: 'text',
      width: '45',
      editable: false,
      header: { text: t('신청구분') },
      lookupDisplay: true,
    },
    {
      fieldName: 'SJE_TYPE_CD',
      dataType: 'text',
      width: '45',
      editable: false,
      header: { text: t('요양내용') },
      lookupDisplay: true,
    },
    {
      fieldName: 'SAGOTYPE_NM2',
      dataType: 'text',
      width: '45',
      editable: false,
      header: { text: t('사고형태') },
    },
    {
      fieldName: 'INJURYPART',
      dataType: 'text',
      width: '45',
      editable: false,
      header: { text: t('재해부위') },
      lookupDisplay: true,
    },
    {
      fieldName: 'TARGETDTE',
      dataType: 'text',
      width: '90',
      editable: false,
      header: {
        text: t('종결예정일'),
      },
    },
    {
      fieldName: 'TELNO1',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('연락처') },
    },
    {
      fieldName: 'SALARY',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('평균임금') },
    },
    {
      fieldName: 'YOSTART',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('요양시작일') },
    },
    {
      fieldName: 'HUDTE',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('휴직일자') },
    },
    {
      fieldName: 'REQDTE',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      width: '90',
      editable: false,
      header: { text: t('신청일자') },
    },
    {
      fieldName: 'ADD_DESC',
      dataType: 'text',
      width: '45',
      editable: false,
      header: { text: t('추가내용') },
    },
    {
      fieldName: 'BIGO',
      editable: false,
      dataType: 'text',
      width: '50',
      header: { text: t('비고') },
    },
    {
      fieldName: 'RETI_TMP_DATE',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('퇴직일') },
    },
    {
      fieldName: 'UNION_YN',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('노조가입여부') },
      lookupDisplay: true,
    },
    //  안보이는 컬럼들
    {
      fieldName: 'WORK_HEAL_GBN',
      dataType: 'text',
      width: '65',
      editable: false,
      header: { text: t('취업치료 구분') },
      visible: false,
      lookupDisplay: true,
    },
    { fieldName: 'ADDR', dataType: 'text', visible: false }, // 주소
    { fieldName: 'APPROVEDTE', dataType: 'text', visible: false }, //결재완료일
    { fieldName: 'BANK', dataType: 'text', visible: false }, // 거래은행
    { fieldName: 'BOKDTE', dataType: 'text', visible: false }, //복직일자
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'BVTYP', dataType: 'text', visible: false }, // 계좌코드
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'COM_ENT_DATE', dataType: 'text', visible: false }, //   입사일
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'DMCL_DOM', dataType: 'text', visible: false }, // 본적
    { fieldName: 'EMAILDTE', dataType: 'text', visible: false }, // 이메일최초발신일시
    { fieldName: 'ENDDTE', dataType: 'text', visible: false }, //종결일자
    // { fieldName: 'FILE_ID', dataType: 'text', visible: false }, //첨부파일 ID
    { fieldName: 'FROMDTE1', dataType: 'text', visible: false }, //입원기간 from
    { fieldName: 'FROMDTE2', dataType: 'text', visible: false }, //통원기간FROM
    { fieldName: 'GAINUM', dataType: 'text', visible: false }, //가입번호코드
    { fieldName: 'GRADE', dataType: 'text', visible: false }, //장해등급코드
    { fieldName: 'GRADEDTE', dataType: 'text', visible: false }, //등급입력일자
    { fieldName: 'HAPAMT', dataType: 'text', visible: false }, //합의금액
    { fieldName: 'HAPBIGO', dataType: 'text', visible: false }, //합의비고
    { fieldName: 'HAPDTE', dataType: 'text', visible: false }, //합의시간
    { fieldName: 'HAP_STATUS', dataType: 'text', visible: false }, //합의상태
    { fieldName: 'HOSPITAL', dataType: 'text', visible: false }, //병원
    { fieldName: 'INGAMDTE', dataType: 'text', visible: false }, //인감일자
    { fieldName: 'INJURYTYPE', dataType: 'text', visible: false }, //상해종류
    { fieldName: 'IP_ADDRESS', dataType: 'text', visible: false }, //IP_ADDRESS
    { fieldName: 'JOB_TIT_NM', dataType: 'text', visible: false }, //직위
    { fieldName: 'OCCURTIME', dataType: 'text', visible: false }, //발생시간
    { fieldName: 'OFFICE_TEL', dataType: 'text', visible: false }, //회사전화
    { fieldName: 'ORGBELNR', dataType: 'text', visible: false }, //합의금전표번호
    { fieldName: 'ORGBELNRDTE', dataType: 'text', visible: false }, //전표입력일
    { fieldName: 'P_SANNO', dataType: 'text', visible: false }, //재요양 시 최초 산재번호
    { fieldName: 'RECEIPTDTE', dataType: 'text', visible: false }, //위로금접수일자
    { fieldName: 'REQEMP', dataType: 'text', visible: false }, //신청자
    { fieldName: 'REQEMP_NM', dataType: 'text', visible: false }, //
    { fieldName: 'FILE_ID', dataType: 'text', visible: false }, //    산재유첨 FILE_ID
    { fieldName: 'SAGOGAEYO', dataType: 'text', visible: false }, //사고개요
    { fieldName: 'SAGOLOC', dataType: 'text', visible: false }, //사고장소
    { fieldName: 'SAGONO', dataType: 'text', visible: false }, //사고번호, 안전환경시스템상 사고번호 연계
    { fieldName: 'SAGOTYPE', dataType: 'text', visible: false }, //  사고형태코드
    { fieldName: 'SAGOTYPE_NM1', dataType: 'text', visible: false }, //사고형태명1
    { fieldName: 'SAGOTYPE_NM3', dataType: 'text', visible: false }, //사고형태명3
    { fieldName: 'SAGO_CMPNY_DIV', dataType: 'text', visible: false }, //사고회사코드
    { fieldName: 'SALARYDTE', dataType: 'text', visible: false }, //임금산정일자
    { fieldName: 'SALARY_CORRECT_YN', dataType: 'text', visible: false }, //평균임금정정 대상여부
    { fieldName: 'SALARY_YN', dataType: 'text', visible: false }, //임금산정여부
    { fieldName: 'SANGBYUNG', dataType: 'text', visible: false }, //상병명
    { fieldName: 'SANNO', dataType: 'text', visible: false }, //산재번호
    { fieldName: 'SEND_YN', dataType: 'text', visible: false }, //공단송부여부
    { fieldName: 'TELGBN', dataType: 'text', visible: false }, //가족관계
    { fieldName: 'TELNO2', dataType: 'text', visible: false }, //가족전화
    { fieldName: 'TODTE1', dataType: 'text', visible: false }, //입원기간TO
    { fieldName: 'TODTE2', dataType: 'text', visible: false }, //통원기간TO
    { fieldName: 'UNT_DUTY_NM', dataType: 'text', visible: false }, //직무
    { fieldName: 'WORK_HEAL_DT', dataType: 'text', visible: false }, ///취업치료시작일
    { fieldName: 'WRT_FILE_ID', dataType: 'text', visible: false }, //WRT_FILE_ID
    { fieldName: 'YODTE', dataType: 'text', visible: false }, //요양일수
    { fieldName: 'YO_STDT', dataType: 'text', visible: false }, //요양시작일
    { fieldName: 'TONGDTE', dataType: 'text', visible: false }, //통원일
    { fieldName: 'IBWONDTE', dataType: 'text', visible: false }, //입원일
    { fieldName: 'YOBIGO', dataType: 'text', visible: false },
    { fieldName: 'BE_BIGO', dataType: 'text', visible: false },
    { fieldName: 'SANG_CD', dataType: 'text', visible: false },
    { fieldName: 'ENDEMAILDTE', dataType: 'text', visible: false }, //종결메일발송일
    { fieldName: 'END_SEND_YN', dataType: 'text', visible: false }, //종결메일발송일
    { fieldName: 'YODAY_CNT', dataType: 'text', visible: false }, //요양일수
    { fieldName: 'HUDAY', dataType: 'text', visible: false }, //휴직일수
    { fieldName: 'AUTO_SALARYDTE', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//조회관련 로직 시작
const searchData01 = (idx) => {
  grdMain.value.getGridView().filterPanel.clearInput() 
  
  return commonSearchApi({
    queryId: 'SAFAG0010_SEARCH01',
    param: MainSearchParams,
  })
}

const afterSearch01 = (res) => {
  let rowData = null
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  let params = {
    userStore: userStore,
    params: MainSearchParams,
    mgs: '개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

//조회관련 로직 끝

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  }
  if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .run()
  }
  // 등록 (사고) 버튼클릭 이벤트
  if (btn.id === 'btnRegist1') {
    //등록(사고) 팝업 오픈
    btnRegist1Popup.value.openPopup()
  } else if (btn.id === 'btnUpdate') {
    //저장버튼 클릭
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave01)
      .run()
  }
  //  등록 (재요양) 버튼클릭 이벤트
  else if (btn.id === 'btnRegist2') {
    btnRegist2Popup.value.openPopup()
  }
  // 등록(일반) 버튼클릭 이벤트
  else if (btn.id === 'btnRegist3') {
    btnRegist3Popup.value.openPopup()
  }
  //종결버튼 클릭시
  else if (btn.id === 'btnComplete') {
    updateComplete()
  }
  //종결반려 버튼 클릭시
  else if (btn.id === 'btnEmployCareCancel') {
    cancelComplete()
  }
}

//삭제관련 로직 시작
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = async () => {
  let deleteParam = []
  let chkNum = await grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < chkNum.length; i++) {
    let data = await grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let state = await grdMain.value.getDataProvider().getRowState(chkNum[i])

    /* 기존 저장 되어 있는 행만 리스트 push후  DB삭제 신규 추가 행은 바로 삭제 */
    if (state !== 'created') {
      let deleteData = {
        CMPNY_DIV: data.CMPNY_DIV,
        SANNO: data.SANNO,
        SERNO: data.SERNO,
      }
      let params = {
        userStore: userStore,
        params: data,
        mgs: '산재정보 등록/현황 삭제했습니다.',
        crudGbn: 'D', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
        logDesc: '', // 사유입력
        menuId: useLogsStore().menuId,
        menuNm: t(useLogsStore().menuId),
      }
      commonLogExecuteApi(params)
      deleteParam.push(deleteData)
    }
  }

  /* realgrid 기본 설정이 softDeleting: true로 되어 있기 때문에 
     removeRows시 상태값만 변경되어 실제 삭제 되지 않아 softDeleting: false 변경후 로우 삭제 진행 */
  grdMain.value.getDataProvider().setOptions({ softDeleting: false })
  /* ********* 체크된 로우 삭제 ********* */
  grdMain.value.getDataProvider().removeRows(chkNum)

  return commonExecuteApi({
    queryId: 'SAFAG0010_DELETE_01',
    list: deleteParam,
  })
}

//삭제관련 로직 끝

//종결반려버튼 클릭 관련 로직 시작
const cancelComplete = () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave03)
    .setQuery(saveData03)
    .setConfirmMessage('종결반려 하시겠습니까?')
    .setAfter(afterSave03)
    .run()
}

const beforeSave03 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('종결반려할 데이터를 선택해주세요.'))
    return false
  }

  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.STATUS != 'G') {
      Message.warn(t('진행상태가 종결신청인 재해자만 종결반려가 가능합니다.'))
      return false
    }
  }

  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.STATUS === 'H') {
      Message.warn(t('진행상태가 종결신청반려인 데이터가 있습니다.'))
      return false
    }
  }
  return true
}

const saveData03 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      SANNO: data.SANNO,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
    let params = {
      userStore: userStore,
      params: saveData,
      mgs: '산재정보 등록/현황 종결반려 했습니다.',
      crudGbn: 'U', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
  }

  return commonExecuteApi({
    queryId: 'SAFAG0010_SAVE_12',
    list: saveParam,
  })
}

const afterSave03 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < checkedData.length; i++) {
    grdMain.value.getDataProvider().setValue(checkedData[i], 'STATUS', 'H')
    grdMain.value.getDataProvider().setRowState(checkedData[i], 'none')
  }
  grdMain.value.getGridView().checkAll(false)
}

//종결반려버튼 클릭 관련 로직 끝

//종결버튼 클릭 관련 로직 시작
const updateComplete = () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setConfirmMessage('종결하시겠습니까?')
    .setAfter(afterSave02)
    .run()
}

const beforeSave = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('종결할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveData = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveParam = {
      CMPNY_DIV: data.CMPNY_DIV, //회사
      SANNO: data.SANNO, //산재번호
      TARGETDTE: data.TARGETDTE, //종결예정일
      USER_ID: userStore.userId, //로그인유저아이디
    }
    saveData.push(saveParam)
    let params = {
      userStore: userStore,
      params: saveParam,
      mgs: '산재정보 등록/현황 종결했습니다.',
      crudGbn: 'U', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
  }
  return commonExecuteApi({
    queryId: 'SAFAG0010_SAVE_10',
    list: saveData,
  })
}

const afterSave02 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  console.log('checkedData', checkedData)
  let today = dayjs().format('YYYY-MM-DD')
  for (let i = 0; i < checkedData.length; i++) {
    grdMain.value.getDataProvider().setValue(checkedData[i], 'STATUS', 'F')
    grdMain.value.getDataProvider().setValue(checkedData[i], 'TARGETDTE', today)
    grdMain.value.getDataProvider().setRowState(checkedData[i], 'none')
  }
  grdMain.value.getGridView().checkAll(false)
}

//종결버튼 클릭 관련 로직 끝

//저장버튼 관련 로직 시작
const beforeSave02 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  return true
}

const isWithinThreeMonths = (dt) => {
  // 입력된 날짜를 Date 객체로 변환
  const inputDate = new Date(dt)
    
  // 현재 날짜를 가져옴
  const today = new Date()
  
  // 오늘 날짜 기준으로 3개월 후의 날짜를 계산
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(today.getMonth() + 3)

  // 오늘 날짜 기준으로 3개월 전의 날짜를 계산
  const threeMonthsEarlier = new Date()
  threeMonthsEarlier.setMonth(today.getMonth() - 3)

  // 주어진 날짜가 오늘부터 3개월 전과 3개월 후 사이에 있는지 확인
  return inputDate >= threeMonthsEarlier && inputDate <= threeMonthsLater
}

const saveData02 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      SANNO: data.SANNO,
      REQGBN: data.REQGBN,
      YOGBN: data.YOGBN,
      SANGBN: data.SANGBN,
      SAGONO: data.SAGONO,
      EMPLNO: data.EMPLNO,
      FILENUM: data.FILENUM,
      GAINUM: '01',
      OCCURDATE: data.OCCURDATE,
      OCCURTIME: data.OCCURTIME,
      SAGOTYPE: data.SAGOTYPE,
      INJURYTYPE: data.INJURYTYPE,
      INJURYPART: data.INJURYPART,
      REQDTE: data.REQDTE,
      REQEMP: data.REQEMP,
      SANOK: data.SANOK,
      OKDTE: data.OKDTE,
      HUDTE: data.HUDTE,
      BOKDTE: data.BOKDTE,
      ENDDTE: data.ENDDTE,
      GRADE: data.GRADE,
      GRADEDTE: data.GRADEDTE,
      HAPDTE: data.HAPDTE,
      HAPAMT: data.HAPAMT,
      SALARY: data.SALARY,
      SALARYDTE: data.SALARYDTE,
      TARGETDTE: data.TARGETDTE,
      TELNO1: data.TELNO1,
      TELNO2: data.TELNO2,
      TELGBN: data.TELGBN,
      ORGBELNR: data.ORGBELNR,
      ORGBELNRDTE: data.ORGBELNRDTE,
      BANK: data.BANK,
      APPROVEDTE: data.APPROVEDTE,
      INGAMDTE: data.INGAMDTE,
      RECEIPTDTE: data.RECEIPTDTE,
      HAP_STATUS: data.HAP_STATUS,
      HAPBIGO: data.HAPBIGO,
      FILE_ID: data.FILE_ID,
      RESULT_FILE_ID: data.RESULT_FILE_ID,
      STATUS: data.STATUS,
      SANGBYUNG: data.SANGBYUNG,
      SAGOLOC: data.SAGOLOC,
      SAGOGAEYO: data.SAGOGAEYO,
      BIGO: data.BIGO,
      ADD_DESC: data.ADD_DESC,
      SJE_TYPE_CD: data.SJE_TYPE_CD,
      SEND_YN: data.SEND_YN,
      SAVE_YN: data.SAVE_YN,
      USER_ID: userStore.userId,
      IP_ADDRESS: data.IP_ADDRESS,
      P_SANNO: data.P_SANNO,
      SAGO_CMPNY_DIV: data.SAGO_CMPNY_DIV,
      SALARY_CORRECT_YN: data.SALARY_CORRECT_YN,
    }

    // 진행상태가 승인일시
    if(saveData.STATUS == 'C') {
      if(data.HLD_OFFI_GBN == '3') { // 퇴직자
        if(isWithinThreeMonths(saveData.RETI_TMP_DATE) ) { // 퇴직일 3개월 이내이고
          if(saveData.YOGBN == '0') { // 최초 요양
            saveData.SALARYDTE = saveData.OCCURDATE // 산정기준일에 재해일시를 넣는다.
          } else {
            saveData.SALARYDTE = data.RETI_TMP_DATE // 산정기준일에 퇴직일을 넣는다.
          }
        } else { // 퇴직일 3개월 이후이고
          if(saveData.YOGBN == '0') { // 최초 요양
            saveData.SALARYDTE = saveData.YOSTART // 산정기준일에 재해일시를 넣는다.
          } else {
            saveData.SALARYDTE = data.RETI_TMP_DATE // 산정기준일에 퇴직일을 넣는다.
          }
        }
      } else { // 재직자
        if(saveData.YOGBN == '0') { // 최초 요양
          saveData.SALARYDTE = saveData.OCCURDATE // 산정기준일에 재해일시를 넣는다.
        } else { // 재요양
          saveData.SALARYDTE = saveData.YOSTART // 산정기준일에 요양시작일 넣는다.
        }
      }
    } 

    saveParam.push(saveData)
    let params = {
      userStore: userStore,
      params: saveData,
      mgs: '산재정보 등록/현황 수정했습니다.',
      crudGbn: 'U', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
  }
  return commonExecuteApi({ queryId: 'SAFAG0010_SAVE_01', list: saveParam })
}

//저장버튼 관련 로직 끝

//
const afterSave01 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < checkedData.length; i++) {
    grdMain.value.getDataProvider().setRowState(checkedData[i], 'none')
  }
  grdMain.value.getGridView().checkAll(false)
}

//그리드 셀 더블클릭 이벤트
const onCellDblClicked = (grd, data) => {
  //파일번호 수정해야 하니까 파일번호 셀 더블클릭하면 팝업 열리지 않도록
  if (data.column === 'FILENUM') {
    return false
  }

  if (data.cellType === 'data') {
    let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    if (row.SANNO) {
      DblClickPopUp.value.openPopup(row)
    } else {
      Message.warn(t('등록된 산재번호가 없습니다. 저장을 해주세요.'))
      return false
    }
  }
}

//인원팝업 오픈 이벤트
const empPopupOpen = () => {
  empPopup.value.openPopup({
    EMP_NM: MainSearchParams.NAME,
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    readonly: true,
    SANJE: true,
    FLAG: 'Y',
  })
}

//인원팝업 선택 이벤트
const selected = (row) => {
  if (row) {
    MainSearchParams.EMP_NO = row.EMP_NO
    MainSearchParams.NAME = row.EMP_NM
  }
}

//등록(사고) 팝업에서 데이터를 선택했을때 실행되는함수
//팝업에서 선택한 데이터가 그리드에 추가된다.
const addRow = (val) => {
  console.log('최초요양 데이터', val)
  if (Array.isArray(val)) {
    //여러개선택했을때
    for (let i = 0; i < val.length; i++) {
      let data = {
        ADDR: val[i].ADDR, //주소
        BSNS_CD: val[i].BSNS_CD, //사업부코드
        BSNS_NM: val[i].BSNS_NM, //사업부
        CMPNY_DIV: val[i].CMPNY_DIV, //회사구분
        COM_ENT_DATE: val[i].COM_ENT_DATE, //회사입사일자
        DEPT_CD: val[i].DEPT_CD, //부서코드
        DEPT_NM: val[i].DEPT_NM, //부서명
        DMCL_DOM: val[i].DMCL_DOM, //본적
        EMPLNO: val[i].EMPLNO, //사번
        SANGBN: val[i].SANGBN, //산재구분
        HAP_YN: val[i].HAP_YN, //합의여부
        YOGBN: val[i].YOGBN, //요양구분(최초요양)
        HLD_OFFI_GBN: val[i].HLD_OFFI_GBN, //재직구분
        INJURYTYPE: val[i].INJURYTYPE, //상해종류
        KOR_NM: val[i].KOR_NM, //성명
        OCCURDATE: val[i].OCCURDATE, //재해일자
        OCCURTIME: val[i].OCCURTIME, //재해시간
        OFFICE_TEL: val[i].OFFICE_TEL, //회사전화
        REG_NO: val[i].REG_NO, //주민등록번호
        RETI_TMP_DATE: val[i].RETI_TMP_DATE, //퇴직일
        SAGOGAEYO: val[i].SAGOGAEYO, //사고개요
        SAGOLOC: val[i].SAGOLOC, //사고장소
        SAGONO: val[i].SAGONO, //사고번호
        SAGOTYPE: val[i].SAGOTYPE, //사고형태 코드
        SAGOTYPE_NM1: val[i].SAGOTYPE_NM1, //사고형태이름1
        SAGOTYPE_NM2: val[i].SAGOTYPE_NM2, //사고형태이름2
        SAGOTYPE_NM3: val[i].SAGOTYPE_NM3, //사고형태이름3
        SALARYDTE: val[i].SALARYDTE, //임금산정일자
        SANNO: val[i].SANNO, //산재번호
        JOB_TIT_NM: val[i].JOB_TIT_NM, //직위
        SJE_TYPE_CD: val[i].SJE_TYPE_CD, //산재구분코드
        INJURYPART: val[i].INJURYPART, //상해부위
        REQGBN: val[i].REQGBN, //신청구분
        TELNO1: val[i].TELNO1, //휴대폰번호
        UNION_YN: val[i].UNION_YN, //노조가입여부
        UNT_DUTY_NM: val[i].UNT_DUTY_NM, //직무
      }
      grdMain.value.addRow(data, false) //그리드에 로우 추가
    }
  } else {
    //더블클릭했을때
    let data = {
      ADDR: val.ADDR, //주소
      BSNS_CD: val.BSNS_CD, //사업부코드
      BSNS_NM: val.BSNS_NM, //사업부
      CMPNY_DIV: val.CMPNY_DIV, //회사구분
      COM_ENT_DATE: val.COM_ENT_DATE, //회사입사일자
      DEPT_CD: val.DEPT_CD, //부서코드
      DEPT_NM: val.DEPT_NM, //부서명
      DMCL_DOM: val.DMCL_DOM, //본적
      EMPLNO: val.EMP_NO, //사번
      SANGBN: val.SANGBN, //산재구분
      HAP_YN: val.HAP_YN, //합의여부
      HLD_OFFI_GBN: val.HLD_OFFI_GBN, //재직구분
      INJURYTYPE: val.INJURYTYPE, //상해종류
      KOR_NM: val.KOR_NM, //성명
      OCCURDATE: val.OCCURDATE, //재해일자
      OCCURTIME: val.OCCURTIME, //재해시간
      OFFICE_TEL: val.OFFICE_TEL, //회사전화
      REG_NO: val.REG_NO, //주민등록번호
      RETI_TMP_DATE: val.RETI_TMP_DATE, //퇴직일
      SAGOGAEYO: val.SAGOGAEYO, //사고개요
      SAGOLOC: val.SAGOLOC, //사고장소
      SAGONO: val.SAGONO, //사고번호
      SAGOTYPE: val.SAGOTYPE, //사고형태 코드
      SAGOTYPE_NM1: val.SAGOTYPE_NM1, //사고형태이름1
      SAGOTYPE_NM2: val.SAGOTYPE_NM2, //사고형태이름2
      SAGOTYPE_NM3: val.SAGOTYPE_NM3, //사고형태이름3
      SALARYDTE: val.SALARYDTE, //임금산정일자
      SANNO: val.SANNO, //산재번호
      JOB_TIT_NM: val.JOB_TIT_NM, //직위
      SJE_TYPE_CD: val.SJE_TYPE_CD, //산재구분코드
      INJURYPART: val.INJURYPART, //상해부위
      REQGBN: val.REQGBN, //신청구분
      TELNO1: val.TELNO1, //휴대폰번호
      UNION_YN: val.UNION_YN, //노조가입여부
      UNT_DUTY_NM: val.UNT_DUTY_NM, //직무
    }
    grdMain.value.addRow(data, false) //그리드에 로우 추가
  }
}

//등록(재요양) 팝업에서 데이터를 선택했을때 실행되는함수
//팝업에서 선택한 데이터가 그리드에 추가된다.
//등록(재요양) 팝업에서 데이터를 선택했을때 실행되는함수
//팝업에서 선택한 데이터가 그리드에 추가된다.
const addRow2 = (val) => {
  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      let data = {
        ADDR: val[i].ADDR,
        ADD_DESC: val[i].ADD_DESC,
        APPROVEDTE: val[i].APPROVEDTE,
        BANK: val[i].BANK,
        BIGO: val[i].BIGO,
        BOKDTE: val[i].BOKDTE,
        BSNS_CD: val[i].BSNS_CD,
        BSNS_NM: val[i].BSNS_NM,
        BVTYP: val[i].BVTYP,
        CMPNY_DIV: val[i].CMPNY_DIV,
        COM_ENT_DATE: val[i].COM_ENT_DATE,
        DEPT_CD: val[i].DEPT_CD,
        DEPT_NM: val[i].DEPT_NM,
        DMCL_DOM: val[i].DMCL_DOM,
        EMPLNO: val[i].EMPLNO,
        ENDDTE: val[i].ENDDTE,
        FILENUM: val[i].FILENUM,
        FILE_ID: val[i].FILE_ID,
        HLD_OFFI_GBN: val[i].HLD_OFFI_GBN,
        FROMDTE1: val[i].FROMDTE1,
        FROMDTE2: val[i].FROMDTE2,
        GAINUM: val[i].GAINUM,
        GRADE: val[i].GRADE,
        GRADEDTE: val[i].GRADEDTE,
        HAPAMT: val[i].HAPAMT,
        HAPBIGO: val[i].HAPBIGO,
        HAPDTE: val[i].HAPDTE,
        INGAMDTE: val[i].INGAMDTE,
        INJURYPART: val[i].INJURYPART,
        INJURYTYPE: val[i].INJURYTYPE,
        JOB_TIT_NM: val[i].JOB_TIT_NM,
        KOR_NM: val[i].KOR_NM,
        OCCURDATE: val[i].OCCURDATE,
        OCCURTIME: val[i].OCCURTIME,
        OFFICE_TEL: val[i].OFFICE_TEL,
        OKDTE: val[i].OKDTE,
        ORGBELNR: val[i].ORGBELNR,
        ORGBELNRDTE: val[i].ORGBELNRDTE,
        RECEIPTDTE: val[i].RECEIPTDTE,
        REG_NO: val[i].REG_NO,
        REQEMP: val[i].REQEMP,
        REQEMP_NM: val[i].REQEMP_NM,
        REQGBN: val[i].REQGBN,
        RETI_TMP_DATE: val[i].RETI_TMP_DATE,
        SAGOGAEYO: val[i].SAGOGAEYO,
        SAGOLOC: val[i].SAGOLOC,
        SAGOTYPE: val[i].SAGOTYPE,
        SAGOTYPE_NM1: val[i].SAGOTYPE_NM1,
        SAGOTYPE_NM2: val[i].SAGOTYPE_NM2,
        SAGOTYPE_NM3: val[i].SAGOTYPE_NM3,
        SALARY: val[i].SALARY,
        SALARYDTE: val[i].SALARYDTE,
        SANGBN: val[i].SANGBN,
        SANGBYUNG: val[i].SANGBYUNG,
        SANNO: val[i].SANNO,
        SANOK: val[i].SANOK,
        SEND_YN: val[i].SEND_YN,
        SJE_TYPE_CD: val[i].SJE_TYPE_CD,
        STATUS: val[i].STATUS,
        TARGETDTE: val[i].TARGETDTE,
        TELGBN: val[i].TELGBN,
        TELNO1: val[i].TELNO1,
        TELNO2: val[i].TELNO2,
        TODTE1: val[i].TODTE1,
        TODTE2: val[i].TODTE2,
        UNION_YN: val[i].UNION_YN,
        UNT_DUTY_NM: val[i].UNT_DUTY_NM,
        WRT_FILE_ID: val[i].WRT_FILE_ID,
        YOGBN: val[i].YOGBN,
      }
      grdMain.value.addRow(data) //그리드에 로우 추가
    }
  } else {
    let data = {
      ADDR: val.ADDR,
      ADD_DESC: val.ADD_DESC,
      APPROVEDTE: val.APPROVEDTE,
      BANK: val.BANK,
      BIGO: val.BIGO,
      BOKDTE: val.BOKDTE,
      BSNS_CD: val.BSNS_CD,
      BSNS_NM: val.BSNS_NM,
      BVTYP: val.BVTYP,
      CMPNY_DIV: val.CMPNY_DIV,
      COM_ENT_DATE: val.COM_ENT_DATE,
      DEPT_CD: val.DEPT_CD,
      DEPT_NM: val.DEPT_NM,
      DMCL_DOM: val.DMCL_DOM,
      EMPLNO: val.EMPLNO,
      ENDDTE: val.ENDDTE,
      FILENUM: val.FILENUM,
      FILE_ID: val.FILE_ID,
      HLD_OFFI_GBN: val.HLD_OFFI_GBN,
      FROMDTE1: val.FROMDTE1,
      FROMDTE2: val.FROMDTE2,
      GAINUM: val.GAINUM,
      GRADE: val.GRADE,
      GRADEDTE: val.GRADEDTE,
      HAPAMT: val.HAPAMT,
      HAPBIGO: val.HAPBIGO,
      HAPDTE: val.HAPDTE,
      INGAMDTE: val.INGAMDTE,
      INJURYPART: val.INJURYPART,
      INJURYTYPE: val.INJURYTYPE,
      JOB_TIT_NM: val.JOB_TIT_NM,
      KOR_NM: val.KOR_NM,
      OCCURDATE: val.OCCURDATE,
      OCCURTIME: val.OCCURTIME,
      OFFICE_TEL: val.OFFICE_TEL,
      OKDTE: val.OKDTE,
      ORGBELNR: val.ORGBELNR,
      ORGBELNRDTE: val.ORGBELNRDTE,
      RECEIPTDTE: val.RECEIPTDTE,
      REG_NO: val.REG_NO,
      REQEMP: val.REQEMP,
      REQEMP_NM: val.REQEMP_NM,
      REQGBN: val.REQGBN,
      RETI_TMP_DATE: val.RETI_TMP_DATE,
      SAGOGAEYO: val.SAGOGAEYO,
      SAGOLOC: val.SAGOLOC,
      SAGOTYPE: val.SAGOTYPE,
      SAGOTYPE_NM1: val.SAGOTYPE_NM1,
      SAGOTYPE_NM2: val.SAGOTYPE_NM2,
      SAGOTYPE_NM3: val.SAGOTYPE_NM3,
      SALARY: val.SALARY,
      SALARYDTE: val.SALARYDTE,
      SANGBN: val.SANGBN,
      SANGBYUNG: val.SANGBYUNG,
      SANNO: val.SANNO,
      SANOK: val.SANOK,
      SEND_YN: val.SEND_YN,
      SJE_TYPE_CD: val.SJE_TYPE_CD,
      STATUS: val.STATUS,
      TARGETDTE: val.TARGETDTE,
      TELGBN: val.TELGBN,
      TELNO1: val.TELNO1,
      TELNO2: val.TELNO2,
      TODTE1: val.TODTE1,
      TODTE2: val.TODTE2,
      UNION_YN: val.UNION_YN,
      UNT_DUTY_NM: val.UNT_DUTY_NM,
      WRT_FILE_ID: val.WRT_FILE_ID,
      YOGBN: val.YOGBN,
    }
    grdMain.value.addRow(data) //그리드에 로우 추가
  }
}

const onCellItemClicked = (grid, index, col) => {
  const selectRow = grdMain.value.getRowData(index.dataRow)
  currentRow.value = selectRow
  let fileID = ''
  fileID = selectRow.RESULT_FILE_ID
  if (!fileID) {
    fileUploadPopup.value.setGuid()
    fileID = fileUploadPopup.value.guid
    grdMain.value
      .getDataProvider()
      .setValue(index.dataRow, 'RESULT_FILE_ID', fileID)
    fileUploadPopup.value.openPopup(fileID)
  } else {
    //파일아이디 있을때
    fileUploadPopup.value.setGuid(fileID)
    fileID = fileUploadPopup.value.guid
    fileUploadPopup.value.openPopup(fileID)
  }
}

//파일 업로드 이벤트
const uploaded = (item) => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: currentRow.value.CMPNY_DIV,
    SANNO: currentRow.value.SANNO,
    RESULT_FILE_ID: item.fileId,
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  commonExecuteApi({ queryId: 'SAFAG0010_SAVE_11', list: saveParam })
}

//사고형태 오픈 이벤트
const acdtOpen = () => {
  acdtPopupRef.value.openPopup()
}

//사고형태 선택 이벤트
const selectedArr = (row) => {
  MainSearchParams.SAGOTYPE = row[2].ALL_UP_CD
  MainSearchParams.SAGOTYPE_NM = row[2].TXT
}
//사고형태 x아이콘 클릭 이벤트
const clearAcdt = () => {
  MainSearchParams.SAGOTYPE = ''
  MainSearchParams.SAGOTYPE_NM = ''
}

//등록(일반) 팝업에서 데이터 저장시
//저장된 데이터를 그리드에 추가한다.
const savedGeneral = (val) => {
  console.log('등록(일반) 받은데이터', val)
  grdMain.value.addRow(val) //그리드에 로우 추가
  // let obj = {
  //   ASGN_CD: val.ASGN_CD, //조직
  //   ASGN_NM: val.ASGN_NM, //조직이름
  //   BSNS_CD: val.BSNS_CD, //사업부
  //   BSNS_NM: val.BSNS_NM, //사업부이름
  //   CMPNY_DIV: val.CMPNY_DIV, //회사구분
  //   DEPT_CD: val.DEPT_CD, //부서코드
  //   DEPT_NM: val.DEPT_NM, //부서이름
  //   EMPLNO: val.EMP_NO, //사번
  //   KOR_NM: val.EMP_NM, //성명
  //   HLD_OFFI_GBN: val.HLD_OFFI_GBN, //재직구분
  //   INJURYPART: val.INJURYPART, //상해부위
  //   INJURYTYPE: val.INJURYTYPE, //상해종류
  //   OCCURDATE: val.OCCURDATE, //재해일시
  //   OCCURTIME: val.OCCURTIME, //재해시간
  //   REQGBN: val.REQGBN, //신청구분
  //   SAGOGAEYO: val.SAGOGAEYO, //사고개요
  //   SAGOTYPE: val.SAGOTYPE, //사고형태
  //   SAGOTYPE_NM1: val.SAGOTYPE_NM1, //사고형태 이름1
  //   SAGOTYPE_NM2: val.SAGOTYPE_NM2, //사고형태 이름2
  //   SAGOTYPE_NM3: val.SAGOTYPE_NM3, //사고형태 이름3
  //   SANGBN: val.SANGBN, //산재구분
  //   SANNO: val.SANNO, //산재번호
  //   YOGBN: '0', //요양구분
  //   TELNO1: val.TELNO1, //연락처
  //   ADDR: val.ADDR, //주소
  // }
}

//진행상태가 '승인또는 불승인'으로 변경시 파일번호 생성 및 승인일자생성 오늘날짜 -1일
const onCellEdited = (grid, itemIndex, row, field) => {
  let fileName = grdMain.value.getGridView().getColumn(field)
  let rowData = grdMain.value.getDataProvider().getJsonRow(row)
  //A:신청 B:미결 C:승인 D:불승인 E:종결예정 F:종결
  console.log('rowData', rowData)
  if (
    (fileName.name === 'STATUS' && rowData.STATUS === 'A') ||
    rowData.STATUS === 'D'
  ) {
    let saveParam = []
    let saveData = {
      CMPNY_DIV: rowData.CMPNY_DIV,
      SANNO: rowData.SANNO,
      STATUS: rowData.STATUS,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
    commonExecuteApi({
      queryId: 'SAFAG0010_SAVE_04',
      list: saveParam,
    }).then((res) => {
      grdMain.value
        .getDataProvider()
        .setValue(row, 'FILENUM', res.list[0].OUT_RES_FILENUM)
      grdMain.value
        .getDataProvider()
        .setValue(row, 'OKDTE', res.list[0].OUT_RES_OKDTE)
      grdMain.value
        .getDataProvider()
        .setValue(row, 'SANOK', res.list[0].OUT_RES_SANOK)
      grdMain.value
        .getDataProvider()
        .setValue(row, 'STATUS', res.list[0].OUT_RES_STATUS)
    })
  } else if (fileName.name === 'STATUS' && rowData.STATUS === 'C') {
    let saveParam = []
    let saveData = {
      CMPNY_DIV: rowData.CMPNY_DIV,
      SANNO: rowData.SANNO,
      STATUS: rowData.STATUS,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
    commonExecuteApi({
      queryId: 'SAFAG0010_SAVE_04',
      list: saveParam,
    }).then((res) => {
      grdMain.value
        .getDataProvider()
        .setValue(row, 'FILENUM', res.list[0].OUT_RES_FILENUM)
      grdMain.value
        .getDataProvider()
        .setValue(row, 'OKDTE', res.list[0].OUT_RES_OKDTE)
      grdMain.value
        .getDataProvider()
        .setValue(row, 'SANOK', res.list[0].OUT_RES_SANOK)
      grdMain.value
        .getDataProvider()
        .setValue(row, 'STATUS', res.list[0].OUT_RES_STATUS)
    })
  }
  //종결일때
  else if (fileName.name === 'STATUS' && rowData.STATUS === 'F') {
    let TARGETDTE = dayjs().format('YYYY-MM-DD') //종결예정일
    let ENDDTE = dayjs().format('YYYY-MM-DD') //종결일
    grdMain.value.getDataProvider().setValue(row, 'TARGETDTE', TARGETDTE)
    grdMain.value.getDataProvider().setValue(row, 'ENDDTE', ENDDTE)
  }
  //불승인으로 변경시
  // else if (fileName.name === 'STATUS' && rowData.STATUS === 'D') {
  //   let OKDTE = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  //   grdMain.value.getDataProvider().setValue(row, 'OKDTE', OKDTE)
  //   grdMain.value.getDataProvider().setValue(row, 'FILENUM', '')
  //
  // }
}

//산재정보 등록/현황 상세 팝업을 닫았을때 모든 데이터를 받아서 그리드에 넣어준다.
const popupClosed = (val) => {
  console.log('팝업닫을때', val)
  let current = grdMain.value.getGridView().getCurrent().dataRow
  //승인 처리시 승인여부 컬럼에 Y표시함
  if (val.STATUS === 'C') {
    val.SANOK = 'Y'
  }
  grdMain.value.getDataProvider().updateRow(current, val, true)
  grdMain.value.getDataProvider().setRowState(current, 'none')
  //grdMain.value.getDataProvider().setOptions({ softDeleting: false })
}

const popupDeleted = (val) => {
  console.log('???')
  /* realgrid 기본 설정이 softDeleting: true로 되어 있기 때문에 
     removeRows시 상태값만 변경되어 실제 삭제 되지 않아 softDeleting: false 변경후 로우 삭제 진행 */
  grdMain.value.getDataProvider().setOptions({ softDeleting: false })
  let current = grdMain.value.getGridView().getCurrent().dataRow
  grdMain.value.getDataProvider().removeRow(current)
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',
          'btnUpdate',
          'btnDelete',
          'btnRegist1',
          'btnRegist2',
          'btnRegist3',
          'btnComplete',
          'btnEmployCareCancel',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('회사')"
              width="200px"
              labelWidth="50px"
              v-model="MainSearchParams.CMPNY_DIV"
              :items="codeList.company"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              width="170px"
              :label="$t('진행상태')"
              v-model="MainSearchParams.STATUS"
              :items="codeList.STATUS"
              item-value="COD"
              item-title="TXT"
            >
            </i-select>
            <span class="mt-2 mr-2">검색기간</span>
            <v-checkbox
              class="mt-1"
              v-model="MainSearchParams.DATE_YN"
            ></v-checkbox>
            <i-input
              width="150px"
              v-model="MainSearchParams.FROM"
              type="date"
              class="mr-2"
            ></i-input>

            <i-input
              label="~"
              width="170px"
              v-model="MainSearchParams.TO"
              type="date"
              class="ml-0"
            ></i-input>
          </div>
          <div class="d-flex mt-2">
            <i-select
              width="200px"
              :label="$t('산재구분')"
              :items="codeList.SANGBN"
              item-value="COD"
              item-title="TXT"
              v-model="MainSearchParams.SANGBN"
            ></i-select>
            <i-input
              :label="$t('재해자')"
              width="200px"
              v-model="MainSearchParams.NAME"
              append-inner-icon="mdi-magnify"
              @click:appendInner="empPopupOpen"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            >
            </i-input>
            <i-select
              :label="$t('사업부')"
              width="200px"
              v-model="MainSearchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            >
            </i-select>
            <i-select
              :label="$t('부서')"
              width="200px"
              v-model="MainSearchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :disabled="noBsns"
            >
            </i-select>
            <i-input
              :label="$t('사고형태')"
              width="300px"
              v-model="MainSearchParams.SAGOTYPE_NM"
              readonly
              @click:appendInner="acdtOpen"
              append-inner-icon="mdi-magnify"
            >
              <template v-slot:append-inner>
                <v-icon icon="mdi-window-close" @click="clearAcdt"></v-icon>
              </template>
            </i-input>
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
            @onCellDblClicked="onCellDblClicked"
            @onCellItemClicked="onCellItemClicked"
            @onCellEdited="onCellEdited"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="selected" />
  <SAFAG0010DblClickPopup
    @upDataRow="upDataRow"
    @closed="popupClosed"
    @deleted="popupDeleted"
    ref="DblClickPopUp"
  />
  <SAFAG0010btnRegist1Popup @selected="addRow" ref="btnRegist1Popup" />
  <SAFAG0010btnRegist2Popup @selected="addRow2" ref="btnRegist2Popup" />
  <SAFAG0010btnRegist3Popup
    @savedGeneral="savedGeneral"
    ref="btnRegist3Popup"
  />
  <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded($event)" />
  <AcdtPopup ref="acdtPopupRef" @selectedArr="selectedArr" />
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

// ::v-deep(.rg-data-cell) {
//   div {
//     overflow: hidden;
//   }
// }
</style>

<route lang="yaml">
# meta:
#   chkAuthIp: true
</route>
