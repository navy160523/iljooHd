<script setup>
import { ref, reactive, onMounted, getCurrentInstance, onUpdated } from 'vue'
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
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import Message from '@hiway/utils/notify'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
import _ from 'lodash'
defineOptions({
  name: '30_safety-SAF_A-SAFAG0020',
})
//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const userLogStore = useLogsStore()
const empPopup = ref(null)
const fileUploadPopup = ref(null)

//컴포넌트별 readonly 값
const readOnlyValue = {
  CMPNY_DIV: true, //회사
  BSNS_CD: true, //사업부
  DEPT_CD: true, //부서
  RETI_YN: true, //퇴직자 조회여부
}

const searchParam = reactive({
  CMPNY_DIV: '', //회사
  STATUS: '', //진행상태
  DATE_YN: 'N',
  FROM: '', //검색기간 FROM
  TO: '', //검색기간 TO
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  EMP_NO: '', //재해자 사번
  NAME: '', //재해자 이름
  SANGBN: '', //산재구분
  SANOK: '', //승인여부
  RETI_YN: '', //퇴직포함
  ADMIN: 'Y', //
  STATUS2: ''
})

const codeList = reactive({
  company: [], //회사
  status: [], //진행상태
  bsnsCd: [], //사업부
  deptCd: [], //부서
  sangbn: [], //산재구분
  sanok: [
    //승인여부
    { TXT: '전체', COD: '' },
    { TXT: '승인', COD: 'Y' },
    { TXT: '불승인', COD: 'N' },
  ],
  yogbn: [], //요양구분
  reqgbn: [], //신청구분
  injurypart: [], //재해부위
  sjetypecd: [], //요양내용
})
//변수선언부 끝

//공통코드 조회
const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //회사조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIZ000',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //진행상태조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250060',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      //산재구분조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250030',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //요양구분조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250020',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //신청구분조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250010',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //상해부위
      queryId: 'SAFAG0020_SEARCH02',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
    commonSearchApi({
      //요양내용조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB080',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: null,
        USE_DIV: 'Y',
      },
    }), // 부서
  ]).then((res) => {
    if (
      userStore.cmpnyDiv === 'HHI' ||
      userStore.cmpnyDiv === '100' ||
      userStore.cmpnyDiv === '230'
    ) {
      codeList.company = res[0].ORESULT_CUR.filter(
        (x) => x.COD === 'HHI' || x.COD === '100' || x.COD === '230'
      ) //현대중공업, 한국조선해양,현대중공업모스
    } else {
      codeList.company = res[0].ORESULT_CUR.filter((x) => x.COD === '200') //현대중공업모스
    }
    codeList.status = res[1].ORESULT_CUR
    codeList.bsnsCd = res[2].ORESULT_CUR
    codeList.sangbn = res[3].ORESULT_CUR.filter((x) => x.COD != 'J').filter(
      (x) => x.COD != 'N'
    ) //전체,일반사고만 보이도록
    codeList.yogbn = res[4].ORESULT_CUR
    codeList.reqgbn = res[5].ORESULT_CUR
    codeList.injurypart = res[6].ORESULT_CUR
    codeList.sjetypecd = res[7].ORESULT_CUR
    codeList.deptCd = res[8].ORESULT_CUR
    codeList.company.unshift({ TXT: '전체', COD: '' })
    codeList.sangbn.unshift({ TXT: '전체', COD: '' })
    codeList.status.unshift({ TXT: '전체', COD: '' })
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    grdMain.value.setBindingColumn('STATUS', codeList.status, 'COD', 'TXT')
    grdMain.value.setBindingColumn('SANOK', codeList.sanok, 'COD', 'TXT')
    grdMain.value.setBindingColumn('SANGBN', codeList.sangbn, 'COD', 'TXT')
    grdMain.value.setBindingColumn('YOGBN', codeList.yogbn, 'COD', 'TXT')
    // grdMain.value.setBindingColumn('REQGBN', codeList.reqgbn, 'COD', 'TXT')
    grdMain.value.setBindingColumn(
      'INJURYPART',
      codeList.injurypart,
      'COD',
      'TXT'
    )
    // grdMain.value.setBindingColumn(
    //   'SJE_TYPE_CD',
    //   codeList.sjetypecd,
    //   'COD',
    //   'TXT'
    // )
    console.log('코드리스트', codeList)
    checkGroup() //그룹별권한 체크
  })
}

//디폴트 날짜 설정
const defaultDate = () => {
  let today = dayjs()
  let toDay =
    today.get('year') +
    '-' +
    (today.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    today.get('date').toString().padStart(2, '0')
  let fromDay = dayjs().subtract(1, 'year')
  let from =
    fromDay.$y +
    '-' +
    (fromDay.$M + 1).toString().padStart(2, '0') +
    '-' +
    fromDay.$D.toString().padStart(2, '0')
  searchParam.FROM = from
  searchParam.TO = toDay
}

//산재관리 모듈 관리자 권한 체크
const checkGroup = () => {
  console.log('그룹권한', userStore.authGrpCd)

  //산재모듈 관리자 권한일때
  if (userStore.authGrpCd.includes('GRP00374')) {
    console.log('로그인유저가 산재모듈 관리자일때')
    console.log('전체사업부조회,퇴직자조회')
    readOnlyValue.CMPNY_DIV = false //회사구분
    readOnlyValue.BSNS_CD = false //사업부
    readOnlyValue.DEPT_CD = false //부서
    readOnlyValue.RETI_YN = false //퇴직포함
    searchParam.RETI_YN = 'Y'
    menuTitle.value.visibleBtn('btnEmployCare', true) //종결신청 버튼 보이기
  }
  //산재현황조회 권한일때
  else if (userStore.authGrpCd.includes('GRP00394')) {
    console.log('로그인유저가 산재현황조회 권한일때(안전,급여)')
    console.log('전체사업부조회,퇴직자조회')
    readOnlyValue.CMPNY_DIV = false //회사구분
    readOnlyValue.BSNS_CD = false //사업부
    readOnlyValue.DEPT_CD = false //부서
    readOnlyValue.RETI_YN = false //퇴직포함
    searchParam.RETI_YN = 'Y'
    menuTitle.value.visibleBtn('btnEmployCare', false) //종결신청 버튼 숨기기

    searchParam.STATUS2 = 'A'
    codeList.status = _.filter(codeList.status, item => {
      return item.COD === ''
             ||item.COD === 'A'
             ||item.COD === 'C'
             ||item.COD === 'D'
             ||item.COD === 'F'
             ||item.COD === 'G'
             ||item.COD === 'H'
    })
  }
  //법무 권한일때
  else if (userStore.authGrpCd.includes('GRP00416')) {
    console.log('로그인유저가 법무 권한일때')
    console.log('전체사업부조회,퇴직자조회')
    readOnlyValue.CMPNY_DIV = false //회사구분
    readOnlyValue.BSNS_CD = false //사업부
    readOnlyValue.DEPT_CD = false //부서
    readOnlyValue.RETI_YN = false //퇴직포함
    searchParam.RETI_YN = 'Y'
    menuTitle.value.visibleBtn('btnEmployCare', false) //종결신청 버튼 숨기기
  }
  //인사 권한일때
  else if (userStore.authGrpCd.includes('GRP00266')) {
    console.log('로그인유저가 인사 권한일때')
    console.log('본인사업부 조회,퇴직자조회')
    readOnlyValue.CMPNY_DIV = true //회사구분
    readOnlyValue.BSNS_CD = true //사업부
    readOnlyValue.DEPT_CD = false //부서
    readOnlyValue.RETI_YN = false //퇴직포함
    searchParam.RETI_YN = 'Y' //퇴직포함
    searchParam.CMPNY_DIV = userStore.cmpnyDiv //로그인유저 회사
    searchParam.BSNS_CD = userStore.bsnsCd //로그인유저 사업부
    console.log('서치파람', searchParam)

    menuTitle.value.visibleBtn('btnEmployCare', false) //종결신청 버튼 숨기기

    searchParam.STATUS2 = 'B'
    codeList.status = _.filter(codeList.status, item => {
      return item.COD === ''
             ||item.COD === 'A'
             ||item.COD === 'C'
             ||item.COD === 'D'
             ||item.COD === 'F'
             ||item.COD === 'G'
             ||item.COD === 'H'
    })
  }
  //직영기본일때
  else {
    console.log('직영기본일때')
    console.log('본인사업부조회,본인부서조회,종결신청')
    readOnlyValue.CMPNY_DIV = true //회사구분
    readOnlyValue.BSNS_CD = true //사업부
    readOnlyValue.BSNS_CD = true //사업부
    readOnlyValue.RETI_YN = true //퇴직포함
    searchParam.CMPNY_DIV = userStore.cmpnyDiv //로그인유저 회사
    // searchParam.BSNS_CD = userStore.bsnsCd //로그인유저 사업부
    // searchParam.DEPT_CD = userStore.deptCd //로그인유저 부서
    searchParam.RETI_YN = 'N'
    menuTitle.value.visibleBtn('btnEmployCare', true) //종결신청 버튼 보이기

    searchParam.STATUS2 = 'C'
    codeList.status = _.filter(codeList.status, item => {
      return item.COD === ''
             ||item.COD === 'A'
             ||item.COD === 'C'
             ||item.COD === 'G'
             ||item.COD === 'H'
    })
  }
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'RESULT_FILE_ID',
      dataType: 'text',
      editable: false,
      width: '40',
      header: { text: t('유첨') },
      isFile: { value: true, showAlways: true },
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      width: '60',
      editor: {
        type: 'dropdown',
      },
      header: { text: t('진행상태') },
    },
    {
      fieldName: 'SANOK',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      width: '60',
      editor: {
        type: 'dropdown',
      },
      header: { text: t('승인여부') },
    },
    {
      fieldName: 'SANGBN',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      width: '60',
      editor: {
        type: 'dropdown',
      },
      header: { text: t('산재구분') },
    },
    {
      fieldName: 'YOGBN',
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      width: '60',
      editable: false,
      header: { text: t('요양구분') },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      editable: false,
      width: '80',
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      editable: false,
      width: '90',
      styleName: 'left-column',
      header: { text: t('부서') },
    },
    {
      fieldName: 'EMPLNO',
      dataType: 'text',
      editable: false,
      width: '70',
      styleName: 'left-column',
      header: { text: t('사번') },
    },
    {
      fieldName: 'JOB_TIT_NM',
      dataType: 'text',
      editable: false,
      width: '60',
      header: { text: t('직위') },
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      editable: false,
      width: '50',
      header: { text: t('성명') },
    },
    {
      fieldName: 'OCCURDATE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      width: '80',
      header: { text: t('재해일자') },
    },
    {
      fieldName: 'SAGOTYPE_NM2',
      dataType: 'text',
      editable: false,
      width: '70',
      header: { text: t('사고형태') },
    },
    {
      fieldName: 'INJURYPART',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      width: '70',
      editor: {
        type: 'dropdown',
      },
      header: { text: t('재해부위') },
    },
    {
      fieldName: 'OKDTE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      width: '80',
      editable: false,
      header: { text: t('승인일자') },
    },
    {
      fieldName: 'TARGETDTE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      width: '90',
      editable: false,

      header: { text: t('종결(예정)일') },
    },
    {
      fieldName: 'WORK_HEAL_DT',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      width: '50',
      editable: false,
      header: { text: t('취업치료시작일') },
    },
    {
      fieldName: 'ENDDTE',
      dataType: 'datetime',
      editable: false,
      datetimeFormat: 'yyyy-MM-dd',
      width: '90',
      header: { text: t('종결일자') },
    },
    {
      fieldName: 'YODAY_CNT',
      dataType: 'text',
      editable: false,
      width: '40',
      header: { text: t('요양일수') },
    },
    {
      fieldName: 'ADD_DESC',
      dataType: 'text',
      styleName: 'editable_column',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },
    {
      fieldName: 'RETI_TMP_DATE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      width: '90',
      editable: false,
      header: { text: t('퇴직일') },
    },
    // {
    //   fieldName: 'REQDTE',
    //   dataType: 'datetime',
    //   datetimeFormat: 'yyyy-MM-dd',
    //   width: '80',
    //   editable: false,
    //   header: { text: t('신청일자') },
    // },
    // {
    //   fieldName: 'HUDTE',
    //   dataType: 'datetime',
    //   datetimeFormat: 'yyyy-MM-dd',
    //   width: '80',
    //   editable: false,
    //   header: { text: t('휴직일자') },
    // },
    // {
    //   fieldName: 'SJE_TYPE_CD',
    //   dataType: 'text',
    //   lookupDisplay: true,
    //   width: '80',
    //   editor: {
    //     type: 'dropdown',
    //   },
    //   editable: false,
    //   header: { text: t('요양내용') },
    // },
    // {
    //   fieldName: 'REQGBN',
    //   dataType: 'text',
    //   editable: false,
    //   lookupDisplay: true,
    //   width: '70',
    //   editor: {
    //     type: 'dropdown',
    //   },
    //   header: { text: t('신청구분') },
    // },
    {
      fieldName: 'SANNO',
      dataType: 'text',
      visible: false,
      header: { text: t(' ') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t(' ') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t(' ') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(async () => {
  await initCodeList() //시스템 코드값 조회하여 각 컬럼 및 컴포넌트에 바인딩
  await defaultDate() //검색기간 기본값 세팅

  //2024.06.27 김민선사원 요청으로 화면 마운트시 자동조회 안하도록 설정
  //onButtonsClick({ id: 'btnSearch' })
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .setConfirmMessage('종결신청 하시겠습니까?')
      .run()
  }
}
//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFAG0020_SEARCH01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  console.log('res', res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '산재현황 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}
//조회관련 로직 끝

//인원팝업 오픈
const openEmpPopup = async (gbn) => {
  if (gbn === '인원조회') {
    empPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: 'Y',
      EMP_NM: searchParam.NAME,
      DISABLE: ['전체', '사내협력사', '단기공사'],
      SANJE: true,
    })
  }
}

//저장관련 로직 시작
const beforeSave = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('종결신청할 데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < chkNum.length; i++) {
    let checkedData = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    if (checkedData.STATUS != 'C' && checkedData.STATUS != 'H') {
      Message.warn(
        t('진행상태가 승인또는 종결신청반려인 재해자만 종결신청이 가능합니다.')
      )
      return false
    }
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
      SANNO: data.SANNO,
      BIGO: data.BIGO,
      USER_ID: userStore.userId,
      ENDREQ_EMPLNO: userStore.empNo, //요양종결신청자 사번
    }
    let params = {
      userStore: userStore,
      params: searchParam,
      mgs: '산재현황 수정했습니다.',
      crudGbn: 'U', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
    saveData.push(saveParam)
  }
  return commonExecuteApi({
    queryId: 'SAFAG0020_SAVE01',
    list: saveData,
  })
}

const afterSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < checkedData.length; i++) {
    grdMain.value.getDataProvider().setRowState(checkedData[i], 'none')
    grdMain.value.getDataProvider().setValue(checkedData[i], 'STATUS', 'G')
  }
  grdMain.value.getGridView().checkAll(false)

  //onButtonsClick({ id: 'btnSearch' })
}

//저장관련 로직 끝

//행변경시 변경된 행의 부서와 로그인 유저를 비교하여 같으면 종결신청 버튼 활성화 아니면 비활성화
// const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
//   if (newIdx === -1) {
//     return false
//   }
//   const row = grdMain.value.getDataProvider().getJsonRow(newIdx)
//   if (row.DEPT_CD === userStore.DEPT_CD) {
//     menuTitle.value.disableBtn('btnEmployCare', true)
//   } else {
//     menuTitle.value.disableBtn('btnEmployCare', false)
//   }
// }

//파일첨부 관련 로직 시작
const onCellButtonClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  //파일아이디 없을때 파일아이디 저장
  if (!data.RESULT_FILE_ID) {
    fileUploadPopup.value.setGuid()
    let fileID = fileUploadPopup.value.guid
    let fileData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      RESULT_FILE_ID: fileID,
      SANNO: data.SANNO,
    }
    new saveFlowHelper(vm, t)
      .setQuery(saveData02(fileData))
      .setResultMessage(false)
      .setConfirmMessage(false)
      .run()
    fileUploadPopup.value.openPopup(fileID)
  } else {
    fileUploadPopup.value.openPopup(data.RESULT_FILE_ID)
  }
}

const saveData02 = (fileData) => {
  let fileSaveParam = []
  fileSaveParam.push(fileData)
  return commonExecuteApi({
    queryId: 'SAFAG0020_SAVE02',
    list: fileSaveParam,
  })
}

//회사 바뀌면 사업부 가져옴 (회사변경 감지)
watch(
  () => searchParam.CMPNY_DIV,
  (newValue, oldValue) => {
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: newValue },
    }).then((res) => {
      if (oldValue) {
        searchParam.BSNS_CD = ''
        searchParam.DEPT_CD = ''
      }
      codeList.bsnsCd = res.ORESULT_CUR
      codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    })
  }
)

//사업부변경 감지
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    console.log('newValue', newValue)
    console.log('oldValue', oldValue)
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue) {
        searchParam.DEPT_CD = ''
        codeList.deptCd = res.ORESULT_CUR
        codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      } else {
        codeList.deptCd = res.ORESULT_CUR
        codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
    }) // 부서
  }
)
//파일첨부 관련 로직 끝

const onEmpSelected = (val) => {
  searchParam.NAME = val.EMP_NM
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnEmployCare']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('회사')"
              :readonly="readOnlyValue.CMPNY_DIV"
              :items="codeList.company"
              item-title="TXT"
              item-value="COD"
              v-model="searchParam.CMPNY_DIV"
              width="200px"
            >
            </i-select>
            <i-select
              :label="$t('진행상태')"
              :items="codeList.status"
              item-title="TXT"
              item-value="COD"
              v-model="searchParam.STATUS"
              width="200px"
            >
            </i-select>
            <span class="mt-2">검색기간</span>
            <v-checkbox
              class="mt-1 ml-2"
              true-value="Y"
              false-value="N"
              v-model="searchParam.DATE_YN"
            >
            </v-checkbox>
            <i-input
              type="date"
              v-model="searchParam.FROM"
              width="150px"
              class="mr-0"
            ></i-input>
            <span class="mt-2 mx-2"> ~ </span>
            <i-input
              type="date"
              v-model="searchParam.TO"
              width="150px"
              class="ml-0"
            ></i-input>
            <i-select
              :label="$t('사업부')"
              :readonly="readOnlyValue.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              v-model="searchParam.BSNS_CD"
              width="200px"
              label-width="50px"
            ></i-select>
            <i-select
              :label="$t('부서')"
              :readonly="readOnlyValue.DEPT_CD"
              v-model="searchParam.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              width="200px"
              label-width="50px"
            >
            </i-select>
          </div>

          <div class="d-flex mt-2">
            <i-input
              :label="$t('재해자')"
              v-model="searchParam.NAME"
              @click:appendInner="openEmpPopup('인원조회')"
              @keydown.enter="
                (e) => {
                  openEmpPopup('인원조회')
                }
              "
              append-inner-icon="mdi-magnify"
              width="200px"
            >
            </i-input>
            <i-select
              :label="$t('산재구분')"
              :items="codeList.sangbn"
              item-title="TXT"
              item-value="COD"
              v-model="searchParam.SANGBN"
              width="200px"
            >
            </i-select>
            <i-select
              :label="$t('승인여부')"
              :items="codeList.sanok"
              item-title="TXT"
              item-value="COD"
              v-model="searchParam.SANOK"
              width="200px"
            >
            </i-select>
            <span class="mt-2">퇴직포함</span>
            <v-checkbox
              class="mt-1 ml-2"
              v-model="searchParam.RETI_YN"
              :disabled="readOnlyValue.RETI_YN"
            >
            </v-checkbox>
          </div>
        </v-sheet>

        <v-sheet class="h-auto">
          <IGridTitle :title="$t('산재 요양 현황')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellItemClicked="onCellButtonClicked"
            @onCurrentRowChanged="onCurrentRowChanged"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>

    <IUploadPopup
      ref="fileUploadPopup"
      @closed="afterFileSearch"
    ></IUploadPopup>
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
    min-height: 700px;
  }
}
</style>
