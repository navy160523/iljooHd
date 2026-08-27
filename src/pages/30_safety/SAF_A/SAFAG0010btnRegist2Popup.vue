<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 산재정보 등록/현황   등록(재요양)-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { value } from 'lodash-es'
import queryFlowHelper from '@/utils/searchFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { commonLogExecuteApi } from '@hiway/api/commonApi'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const dialog = ref(false)
const grdPopUp = ref(null)
const userStore = useUserStore() //유저정보

const empPopup = ref(null)

const MainSearchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
  TO: dayjs().format('YYYY-MM-DD'),
  EMP_NO: '',
  EMP_NM: '',
  USER_ID: userStore.userId,
  IP_ADDRESS: userStore.clientIp,
})

const codeList = reactive({})

const SaveData = reactive({})

const intCode = () => {
  Promise.all([
    getCodeList('HHIZ000'), //0

    getCodeList('HHIB250010'), //1
    getCodeList('HHIB250020'), //2
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_02',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }), //3
  ])
    .then((res) => {
      codeList.company = res[0].ORESULT_CUR.filter(
        (x) => x.COD === '100' || x.COD === 'HHI' || x.COD === '230'
      )
      grdPopUp.value.setBindingColumn(
        'REQGBN',
        res[1].ORESULT_CUR,
        'COD',
        'TXT'
      )
      grdPopUp.value.setBindingColumn('YOGBN', res[2].ORESULT_CUR, 'COD', 'TXT')
      grdPopUp.value.setBindingColumn(
        'INJURYPART',
        res[3].ORESULT_CUR,
        'COD',
        'TXT'
      )
    })
    .catch((err) => {})
}

//  팝업오픈 emp
const empPopupOpen = () => {
  if (MainSearchParams.CMPNY_DIV === '') {
    return Message.warn(t('회사 정보를 먼저 입력해주십시오'))
  }
  empPopup.value.openPopup({
    CMPNY_DIV: MainSearchParams.CMPNY_DIV,
    EMP_NM: MainSearchParams.EMP_NM,
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    readonly: true,
    FLAG: 'Y',
    SANJE: true,
  })
}
//  조치자 셀렉트 이벤트

const openPopup = (popupParam) => {
  SaveData.param = ''
  intCode()
  dialog.value = true
}

//초기 데이터셋팅
// onMounted(() => {
//   console.log(uploader.value)
// })

//그리드 셋팅
const grdPopUpProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'FILENUM',
      dataType: 'text',
      header: { text: t('파일번호'), editable: false },
    },
    {
      fieldName: 'YOGBN',
      dataType: 'text',
      header: { text: t('요양구분') },
      lookupDisplay: true,
      editable: false,
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      header: { text: t('부서'), editable: false },
    },
    {
      fieldName: 'EMPLNO',
      dataType: 'text',
      header: { text: t('사번'), editable: false },
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      header: { text: t('성명'), editable: false },
    },
    {
      fieldName: 'REG_NO',
      dataType: 'text',
      header: { text: t('주민번호'), editable: false },
    },
    {
      fieldName: 'OCCURDATE',
      dataType: 'text',
      header: { text: t('재해일자') },
      editable: false,
    },
    {
      fieldName: 'REQGBN',
      dataType: 'text',
      header: { text: t('신청구분') },
      lookupDisplay: true,
      editable: false,
    },
    {
      fieldName: 'SAGOTYPE_NM2',
      dataType: 'text',
      header: { text: t('사고형태') },
      editable: false,
    },
    {
      fieldName: 'INJURYPART',
      dataType: 'text',
      header: { text: t('재해부위') },
      lookupDisplay: true,
      editable: false,
    },

    //  저장 위함
    { fieldName: 'ADDR', dataType: 'text', visible: false },
    { fieldName: 'ADD_DESC', dataType: 'text', visible: false },
    { fieldName: 'APPROVEDTE', dataType: 'text', visible: false },
    { fieldName: 'BANK', dataType: 'text', visible: false },
    { fieldName: 'BIGO', dataType: 'text', visible: false },
    { fieldName: 'BOKDTE', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', visible: false },
    { fieldName: 'BVTYP', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'COM_ENT_DATE', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'DMCL_DOM', dataType: 'text', visible: false },
    { fieldName: 'ENDDTE', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'FROMDTE1', dataType: 'text', visible: false },
    { fieldName: 'FROMDTE2', dataType: 'text', visible: false },
    { fieldName: 'GAINUM', dataType: 'text', visible: false },
    { fieldName: 'GRADE', dataType: 'text', visible: false },
    { fieldName: 'GRADEDTE', dataType: 'text', visible: false },
    { fieldName: 'HAPAMT', dataType: 'text', visible: false },
    { fieldName: 'HAPBIGO', dataType: 'text', visible: false },
    { fieldName: 'HAPDTE', dataType: 'text', visible: false },
    { fieldName: 'HAP_STATUS', dataType: 'text', visible: false },
    { fieldName: 'HAP_YN', dataType: 'text', visible: false },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', visible: false },
    { fieldName: 'HOSPITAL', dataType: 'text', visible: false },
    { fieldName: 'HUDTE', dataType: 'text', visible: false },
    { fieldName: 'INGAMDTE', dataType: 'text', visible: false },
    { fieldName: 'INJURYTYPE', dataType: 'text', visible: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', visible: false },
    { fieldName: 'OCCURTIME', dataType: 'text', visible: false },
    { fieldName: 'OFFICE_TEL', dataType: 'text', visible: false },
    { fieldName: 'OKDTE', dataType: 'text', visible: false },
    { fieldName: 'ORGBELNR', dataType: 'text', visible: false },
    { fieldName: 'ORGBELNRDTE', dataType: 'text', visible: false },
    { fieldName: 'RECEIPTDTE', dataType: 'text', visible: false },
    { fieldName: 'REQEMP', dataType: 'text', visible: false },
    { fieldName: 'REQEMP_NM', dataType: 'text', visible: false },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', visible: false },
    { fieldName: 'SAGOGAEYO', dataType: 'text', visible: false },
    { fieldName: 'SAGOLOC', dataType: 'text', visible: false },
    { fieldName: 'SAGOTYPE', dataType: 'text', visible: false },
    { fieldName: 'SAGOTYPE_NM1', dataType: 'text', visible: false },
    { fieldName: 'SAGOTYPE_NM3', dataType: 'text', visible: false },
    { fieldName: 'SALARY', dataType: 'text', visible: false },
    { fieldName: 'SALARYDTE', dataType: 'text', visible: false },
    { fieldName: 'SANGBN', dataType: 'text', visible: false },
    { fieldName: 'SANGBYUNG', dataType: 'text', visible: false },
    { fieldName: 'SANNO', dataType: 'text', visible: false },
    { fieldName: 'SANOK', dataType: 'text', visible: false },
    { fieldName: 'SEND_YN', dataType: 'text', visible: false },
    { fieldName: 'SJE_TYPE_CD', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
    { fieldName: 'TARGETDTE', dataType: 'text', visible: false },
    { fieldName: 'TELGBN', dataType: 'text', visible: false },
    { fieldName: 'TELNO1', dataType: 'text', visible: false },
    { fieldName: 'TELNO2', dataType: 'text', visible: false },
    { fieldName: 'TODTE1', dataType: 'text', visible: false },
    { fieldName: 'TODTE2', dataType: 'text', visible: false },
    { fieldName: 'UNION_YN', dataType: 'text', visible: false },
    { fieldName: 'UNT_DUTY_NM', dataType: 'text', visible: false },
    { fieldName: 'WRT_FILE_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdPopUpProps.columns = grdPopUpProps.fields
// 조회

const searchData01 = (idx) => {
  return commonSearchApi({
    queryId: 'SAFAG0010_SEARCH10',
    param: MainSearchParams,
  })
}

const afterSearch01 = (res) => {
  console.log(res)

  grdPopUp.value.getDataProvider().setRows(res.ORESULT_CUR)
  let params = {
    userStore: userStore,
    params: MainSearchParams,
    mgs: '등록(재요양) 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
  console.log('로그끝')
}

// 저장

// const onCellClicked = (grid, clickData) => {
//   if (clickData.cellType === 'data') {
//     SaveData.param = grdPopUp.value
//       .getDataProvider()
//       .getJsonRow(clickData.dataRow)
//   }
// }

// const mainCheck = () => {
//   if (!SaveData.param) {
//     Message.warn(t('저장할 데이터를 선택해 주십시오'))

//     return false
//   } else {
//     return true
//   }
// }

const closePopup = () => {
  MainSearchParams.CMPNY_DIV = userStore.cmpnyDiv
  MainSearchParams.DATE_YN = 'Y'
  MainSearchParams.FROM = dayjs().subtract(1, 'year').format('YYYY-MM-DD')
  MainSearchParams.TO = dayjs().format('YYYY-MM-DD')
  MainSearchParams.EMP_NO = ''
  MainSearchParams.EMP_NM = ''
  dialog.value = false
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdPopUp])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  } else if (btn.id === 'btnSelect') {
    selectData()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const empSelected = (row) => {
  if (row) {
    MainSearchParams.EMP_NO = row.EMP_NO
    MainSearchParams.EMP_NM = row.EMP_NM
  }
}

//  재해자가 바뀌면
watch(
  () => MainSearchParams.EMP_NM,
  (newValue) => {
    if (newValue === '') {
      MainSearchParams.EMP_NO = ''
    }
  }
)

//셀 더블클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  console.log('clickData', clickData)
  let saveParam = []
  let data = grdPopUp.value.getDataProvider().getJsonRow(clickData.dataRow)
  let saveData = {
    FILENUM: data.FILENUM, //파일번호
    YOGBN: '1', //재요양 //요양구분
    DEPT_NM: data.DEPT_NM, //부서명
    EMPLNO: data.EMPLNO, //사번
    KOR_NM: data.KOR_NM, //성명
    REG_NO: data.REG_NO, //주민등록번호
    OCCURDATE: data.OCCURDATE, //재해일자
    REQGBN: data.REQGBN, //신청구분코드(공통코드 B250010)
    SAGOTYPE_NM2: data.SAGOTYPE_NM2, //사고형태 이름2
    INJURYPART: data.INJURYPART, //상해부위코드 (공통코드 B020)
    ADDR: data.ADDR, //
    ADD_DESC: data.ADD_DESC, //추가내용
    APPROVEDTE: data.APPROVEDTE, //결재완료일
    BANK: data.BANK, //거래은행
    BIGO: data.BIGO, //비고
    BOKDTE: data.BOKDTE, //복직일자
    BSNS_CD: data.BSNS_CD, //사업부코드
    BSNS_NM: data.BSNS_NM, //사업부명
    BVTYP: data.BVTYP, //계좌코드
    CMPNY_DIV: data.CMPNY_DIV, //사업장구분
    COM_ENT_DATE: data.COM_ENT_DATE, //
    DEPT_CD: data.DEPT_CD, //부서코드
    DMCL_DOM: data.DMCL_DOM, //
    ENDDTE: '', //종결일자
    FILE_ID: '', //첨부파일ID
    FROMDTE1: '', //입원기간FROM
    FROMDTE2: '', //통원기간FROM
    GAINUM: data.GAINUM, //가입번호코드(공통코드 B250050)
    GRADE: data.GRADE, //장해등급(공통코드 B250040)
    GRADEDTE: data.GRADEDTE, //등급입력일자
    HAPAMT: data.HAPAMT, //합의금액
    HAPBIGO: data.HAPBIGO, //산재위로금비고
    HAPDTE: data.HAPDTE, //합의일자
    HAP_STATUS: data.HAP_STATUS, //합의상태
    HAP_YN: data.HAP_YN, //
    HLD_OFFI_GBN: data.HLD_OFFI_GBN, //
    HOSPITAL: '', //병원명
    HUDTE: '', //휴직일자
    INGAMDTE: data.INGAMDTE, //인감일자
    INJURYTYPE: data.INJURYTYPE, //상해종류코드(공통코드 B030)
    JOB_TIT_NM: data.JOB_TIT_NM, //
    OCCURTIME: data.OCCURTIME, //발생시간
    OFFICE_TEL: data.OFFICE_TEL, //
    OKDTE: '', //산재승인일자
    ORGBELNR: data.ORGBELNR, //합의금전표번호
    ORGBELNRDTE: data.ORGBELNRDTE, //전표입력일
    RECEIPTDTE: data.RECEIPTDTE, //위로금접수일자
    REQEMP: '', //신청자
    REQEMP_NM: data.REQEMP_NM, //
    RETI_TMP_DATE: data.RETI_TMP_DATE, //
    SAGOGAEYO: data.SAGOGAEYO, //사고개요
    SAGOLOC: data.SAGOLOC, //사고장소
    SAGOTYPE: data.SAGOTYPE, //사고형태 코드
    SAGOTYPE_NM1: data.SAGOTYPE_NM1, //사고형태이름1
    SAGOTYPE_NM3: data.SAGOTYPE_NM3, //사고형태이름2
    SALARY: '', //평균임금
    SALARYDTE: '', //임금산정일자
    SANGBN: data.SANGBN, //산재구분코드(B250030)
    SANGBYUNG: data.SANGBYUNG, //상병명
    SANNO: '', //산재번호
    SANOK: '', //산재결과
    SEND_YN: data.SEND_YN, //공단송부여부
    SJE_TYPE_CD: data.SJE_TYPE_CD, //산재구분코드(01:업무상사고,02:업무상질병:03:출퇴근재해 공통코드 B080)
    STATUS: '', //진행상태
    TARGETDTE: '', //종결예정일자
    TELGBN: data.TELGBN, //가족관계
    TELNO1: data.TELNO1, //본인전화
    TELNO2: data.TELNO2, //가족전화
    TODTE1: '', //입원기간TO
    TODTE2: '', //통원기간TO
    UNION_YN: data.UNION_YN, //
    UNT_DUTY_NM: data.UNT_DUTY_NM, //
    WRT_FILE_ID: data.WRT_FILE_ID, //
    P_SANNO: data.SANNO, //재요양시 최초산재번호
  }
  saveParam.push(saveData)
  let params = {
    userStore: userStore,
    params: saveData,
    mgs: '등록(재요양) 저장했습니다.',
    crudGbn: 'C', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
  commonExecuteApi({
    queryId: 'SAFAG0010_SAVE_01',
    list: saveParam,
  }).then((res) => {
    console.log('res', res)
    let param = {
      CMPNY_DIV: res.list[0].CMPNY_DIV,
      STATUS: '',
      DATE_YN: 'N',
      FROM: '',
      TO: '',
      SANNO: res.list[0].OUT_RES_SANNO,
      EMP_NO: res.list[0].EMPLNO,
      SANGBN: '',
      SANOK: '',
      SAGOTYPE: '',
      BSNS_CD: '',
      DEPT_CD: '',
      NAME: '',
    }
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH01',
      param: param,
    }).then((res) => {
      //선택한 데이터저장하고 다시 조회해서  emit으로 올려준다.
      console.log('재요양등록', res)
      emit('selected', res.ORESULT_CUR[0])
      closePopup()
    })
  })
}

//선택버튼을 클릭했을때
const selectData = async () => {
  let selectedData = []
  let saveParam = []
  let checkedData = grdPopUp.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdPopUp.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      FILENUM: data.FILENUM, //파일번호
      YOGBN: '1', //재요양 //요양구분
      DEPT_NM: data.DEPT_NM, //부서명
      EMPLNO: data.EMPLNO, //사번
      KOR_NM: data.KOR_NM, //성명
      REG_NO: data.REG_NO, //주민등록번호
      OCCURDATE: data.OCCURDATE, //재해일자
      REQGBN: data.REQGBN, //신청구분코드(공통코드 B250010)
      SAGOTYPE_NM2: data.SAGOTYPE_NM2, //사고형태 이름2
      INJURYPART: data.INJURYPART, //상해부위코드 (공통코드 B020)
      ADDR: data.ADDR, //
      ADD_DESC: data.ADD_DESC, //추가내용
      APPROVEDTE: data.APPROVEDTE, //결재완료일
      BANK: data.BANK, //거래은행
      BIGO: data.BIGO, //비고
      BOKDTE: data.BOKDTE, //복직일자
      BSNS_CD: data.BSNS_CD, //사업부코드
      BSNS_NM: data.BSNS_NM, //사업부명
      BVTYP: data.BVTYP, //계좌코드
      CMPNY_DIV: data.CMPNY_DIV, //사업장구분
      COM_ENT_DATE: data.COM_ENT_DATE, //
      DEPT_CD: data.DEPT_CD, //부서코드
      DMCL_DOM: data.DMCL_DOM, //
      ENDDTE: '', //종결일자
      FILE_ID: '', //첨부파일ID
      FROMDTE1: '', //입원기간FROM
      FROMDTE2: '', //통원기간FROM
      GAINUM: data.GAINUM, //가입번호코드(공통코드 B250050)
      GRADE: data.GRADE, //장해등급(공통코드 B250040)
      GRADEDTE: data.GRADEDTE, //등급입력일자
      HAPAMT: data.HAPAMT, //합의금액
      HAPBIGO: data.HAPBIGO, //산재위로금비고
      HAPDTE: data.HAPDTE, //합의일자
      HAP_STATUS: data.HAP_STATUS, //합의상태
      HAP_YN: data.HAP_YN, //
      HLD_OFFI_GBN: data.HLD_OFFI_GBN, //
      HOSPITAL: '', //병원명
      HUDTE: '', //휴직일자
      INGAMDTE: data.INGAMDTE, //인감일자
      INJURYTYPE: data.INJURYTYPE, //상해종류코드(공통코드 B030)
      JOB_TIT_NM: data.JOB_TIT_NM, //
      OCCURTIME: data.OCCURTIME, //발생시간
      OFFICE_TEL: data.OFFICE_TEL, //
      OKDTE: '', //산재승인일자
      ORGBELNR: data.ORGBELNR, //합의금전표번호
      ORGBELNRDTE: data.ORGBELNRDTE, //전표입력일
      RECEIPTDTE: data.RECEIPTDTE, //위로금접수일자
      REQEMP: '', //신청자
      REQEMP_NM: data.REQEMP_NM, //
      RETI_TMP_DATE: data.RETI_TMP_DATE, //
      SAGOGAEYO: data.SAGOGAEYO, //사고개요
      SAGOLOC: data.SAGOLOC, //사고장소
      SAGOTYPE: data.SAGOTYPE, //사고형태 코드
      SAGOTYPE_NM1: data.SAGOTYPE_NM1, //사고형태이름1
      SAGOTYPE_NM3: data.SAGOTYPE_NM3, //사고형태이름2
      SALARY: '', //평균임금
      SALARYDTE: '', //임금산정일자
      SANGBN: data.SANGBN, //산재구분코드(B250030)
      SANGBYUNG: data.SANGBYUNG, //상병명
      SANNO: '', //산재번호
      SANOK: '', //산재결과
      SEND_YN: data.SEND_YN, //공단송부여부
      SJE_TYPE_CD: data.SJE_TYPE_CD, //산재구분코드(01:업무상사고,02:업무상질병:03:출퇴근재해 공통코드 B080)
      STATUS: '', //진행상태
      TARGETDTE: '', //종결예정일자
      TELGBN: data.TELGBN, //가족관계
      TELNO1: data.TELNO1, //본인전화
      TELNO2: data.TELNO2, //가족전화
      TODTE1: '', //입원기간TO
      TODTE2: '', //통원기간TO
      UNION_YN: data.UNION_YN, //
      UNT_DUTY_NM: data.UNT_DUTY_NM, //
      WRT_FILE_ID: data.WRT_FILE_ID, //
      P_SANNO: data.SANNO, //재요양시 최초산재번호
    }
    saveParam.push(saveData)
    let params = {
      userStore: userStore,
      params: saveData,
      mgs: '등록(재요양) 저장했습니다.',
      crudGbn: 'C', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
  }
  await commonExecuteApi({
    queryId: 'SAFAG0010_SAVE_01',
    list: saveParam,
  }).then(async (res) => {
    for (let i = 0; i < res.list.length; i++) {
      console.log('재요양 재조회 데이터', res.list[i])
      console.log('재요양 받아온 산재번호', res.list[i].OUT_RES_SANNO)
      let param = {
        CMPNY_DIV: res.list[i].CMPNY_DIV,
        STATUS: '',
        DATE_YN: 'N',
        FROM: '',
        TO: '',
        SANNO: res.list[i].OUT_RES_SANNO,
        EMP_NO: res.list[i].EMPLNO,
        SANGBN: '',
        SANOK: '',
        SAGOTYPE: '',
        BSNS_CD: '',
        DEPT_CD: '',
        NAME: '',
      }
      await commonSearchApi({
        queryId: 'SAFAG0010_SEARCH01',
        param: param,
      }).then((res) => {
        selectedData.push(res.ORESULT_CUR[0])
      })
    }
  })
  await emit('selected', selectedData)

  closePopup()
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1440"
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
      <div class="title-bar" @mousedown="startDragging">재요양</div>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('회사')"
              v-model="MainSearchParams.CMPNY_DIV"
              :items="codeList.company"
              item-value="COD"
              item-title="TXT"
              width="200px"
            >
            </i-select>
            <i-input
              :label="$t('재해자')"
              v-model="MainSearchParams.EMP_NM"
              append-inner-icon="mdi-magnify"
              @click:appendInner="empPopupOpen"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
              width="200px"
            >
            </i-input>
          </v-sheet>
          <v-sheet>
            <RealGrid
              ref="grdPopUp"
              class="mt-2"
              style="height: 650px"
              :grid-view-option="grdPopUpProps.gridViewOption"
              :keys="grdPopUpProps.keys"
              :fields="grdPopUpProps.fields"
              :columns="grdPopUpProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="empPopup" @selected="empSelected" />
  </v-dialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
