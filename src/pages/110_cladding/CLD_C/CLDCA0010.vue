<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import OZReport from '@/components/OZReport.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, commonSendApi, selectFunction } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import _ from 'lodash'
defineOptions({
  name: '110_cladding-CLD_C-CLDCA0010',
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const fileUploadPopup = ref(null)
const reportName = ref('/manage/hse/CLDCA0010.ozr')
const reportParam = reactive(['IN_KEY=', 'IN_CMPNY_DIV', 'IN_YEAR', 'IN_REQ_CHA'])
const menuAdmin = ref(null)
const deptPopup = ref(null)
const dutyYn = ref(null)
const empPopup = ref(null)
// OzReport 팝업 여부
const showOz = ref(false)
let day = dayjs().format('MM-DD')

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  USER_DIV: menuAdmin.value ? '' : userStore.userDiv, //조직구분
  BSNS_CD: userStore.bsnsCd, //사업부코드
  DEPT_CD: userStore.deptCd, //부서코드
  ASGN_CD: userStore.asgnCd, //조직코드
  STATUS: '', //신청상태
  REQ_DATE_FROM: '', //신청일자
  REQ_DATE_TO: '', //신청일자
  DUTY_YN: 'N', //대상자만 조회 체크박스
  DEPT_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm, //소속명
  REQ_CHA: '',
})

const codeList = reactive({
  REQ_CHA: [], //신청시기
  STATUS: [], //신청상태
  CLOTHE_GUBUN: [], //피복종류
  CLOTHE_SIZE: [], //사이즈
  REQ_REASON: [], //신청사유
  STANDARD: [], //지급기준
})

const initCodeList = () => {
  Promise.all([
    //신청시기
    getCodeList('HHIT050'),
    //피복사이즈
    getCodeList('HHIT100'),
    //신청사유
    getCodeList('HHIT110'),
    //지급기준
    getCodeList('HHIT080'),
    //신청상태
    getCodeList('HHIT120'),
  ]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR
    codeList.CLOTHE_SIZE = res[1].ORESULT_CUR
    codeList.REQ_REASON = res[2].ORESULT_CUR
    codeList.STANDARD = res[3].ORESULT_CUR
    codeList.STATUS = res[4].ORESULT_CUR
    codeList.STATUS.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('CLOTHE_GUBUN', codeList.CLOTHE_GUBUN, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CLOTHE_SIZE', codeList.CLOTHE_SIZE, 'COD', 'TXT')
    grdMain.value.setBindingColumn('REQ_REASON', codeList.REQ_REASON, 'COD', 'TXT')
    grdMain.value.setBindingColumn('STANDARD', codeList.STANDARD, 'COD', 'TXT')
    grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
    //피복종류 조회
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      USER_DIV: menuAdmin.value ? '' : userStore.userDiv, //관리자면 모든피복조회 가능 관리자가 아니면 본인소속 피복만 조회
    }

    commonSearchApi({
      queryId: 'CLDBA0010_SEARCH_98',
      param: param,
    }).then((res) => {
      codeList.CLOTHE_GUBUN = res.ORESULT_CUR
      grdMain.value.setBindingColumn('CLOTHE_GUBUN', codeList.CLOTHE_GUBUN, 'COD', 'TXT')
    })
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '25',
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('부서코드') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '75',
      editable: false,
      header: { text: t('소속') },
    },
    {
      fieldName: 'EMP_NO',
      width: '20',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('직책') },
    },
    {
      fieldName: 'OFFI_RES_DATE',
      dataType: 'text',
      width: '25',
      editable: false,
      header: { text: t('직책보임일자') },
    },
    {
      fieldName: 'DUTY_YN',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('대상여부') },
    },
    {
      fieldName: 'CLOTHE_GUBUN',
      dataType: 'text',
      width: '50',
      styleName: 'editable_column',
      header: { text: t('피복종류') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'GET_CLOTHE_DATE',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('최근피복 수령일') },
    },
    {
      fieldName: 'STANDARD',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('지급기준') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'CLOTHE_SIZE',
      dataType: 'text',
      width: '15',
      styleName: 'editable_column',
      header: { text: t('사이즈') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REQ_COUNT',
      dataType: 'number',
      numberFormat: '#',
      width: '20',
      editable: false,
      header: { text: t('신청수량') },
    },
    {
      fieldName: 'REQ_REASON',
      dataType: 'text',
      width: '20',
      styleName: 'editable_column',
      header: { text: t('신청사유') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('첨부') },
      isFile: { value: true, showAlways: true },
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('신청상태') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'PAYMENT_DATE',
      editable: false,
      width: '25',
      header: { text: t('지급일자') },
    },
    {
      fieldName: 'PRINT_YN',
      width: '20',
      editable: false,
      header: { text: t('출력유무') },
    },
    {
      fieldName: 'REMARKS',
      width: '60',
      styleName: 'editable_column-left',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },

    {
      fieldName: 'ASGN_CD',
      visible: false,
      header: { text: t('조직코드') },
    },
    {
      fieldName: 'BSNS_CD',
      visible: false,
      header: { text: t('사업부코드') },
    },
    {
      fieldName: 'USER_DIV',
      visible: false,
      header: { text: t('조직구분') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'REQ_CHA',
      visible: false,
      header: { text: t('신청시기') },
    },
    {
      fieldName: 'REQ_DATE',
      visible: false,
      header: { text: t('신청일자') },
    },
    {
      fieldName: 'REQ_SEQ',
      visible: false,
      header: { text: t('신청 SEQ') },
    },

    {
      fieldName: 'YEAR',
      visible: false,
      header: { text: t('신청년도') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(async () => {
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()
  defaultDate()
  if (userStore.authGrpCd.includes('CLDA001')) {
    menuAdmin.value = true
  } else {
    if (!(await checkRegular())) {
      return false
    }
  }
})

//수시신청 기간인지 확인 -> 2025.10.16 김현재 작성
//안전보건지원부 박래순 책임님이 수시신청도 정기신청처럼 관리하고 싶다는 요청이 있어서 추가
const checkRegular = async () => {
  try {
    const res = await commonSearchApi({
      queryId: 'CLDCA0010_SEARCH_03',
      param: {},
    }).thens( () => {
      
    })

    
    if (!res || !res.ORESULT_CUR) {
      return false
    }

    if (res.ORESULT_CUR.length === 0) {
      await vm.$swal({
        title: t(`수시신청 기간이 아닙니다.
                  조회만 가능합니다.
                  ${res.ORESULT_CUR2[0].SUSI_ST_DATE}일 08:00시부터 신청가능`),
        showCancelButton: false,
      })
      initCodeList()
      /*2025.10.13 김현재 작성
      기존에는 정기신청기간이 아닐때 관리자 이외에 사람이 접속하면 모든버튼을 비활성화 했는데
      박래순책임님 요청으로 정기신청 기간이 아닐때도 조회는 가능하도록 수정*/
      //menuTitle.value.disableBtn('btnSearch', true)
      menuTitle.value.disableBtn('btnCreate', true)
      menuTitle.value.disableBtn('btnUpdate', true)
      menuTitle.value.disableBtn('btnApplication', true)
      menuTitle.value.disableBtn('btnReqCancel', true)
      menuTitle.value.disableBtn('btnPrint', true)

      return false
    }

    //searchParam.EN_DATE = res.ORESULT_CUR[0].EN_DATE
    //searchParam.REQ_CHA = res.ORESULT_CUR[0].REQ_CHA
    return true
  } catch (error) {
    return false
  }
}

//디폴트 날짜 설정 -2일~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -2일 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(2, 'day')
  searchParam.REQ_DATE_FROM =
    dateFrom.$y + '-' + (dateFrom.$M + 1).toString().padStart(2, '0') + '-' + dateFrom.$D.toString().padStart(2, '0')

  searchParam.REQ_DATE_TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setBefore(beforeSearch).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnCreate') {
    if (menuAdmin.value === true) {
      empPopup.value.openPopup({ MULTI: true })
    } else {
      empPopup.value.openPopup({
        CMPNY_DIV_D: true,
        USER_DIV: userStore.userDiv,
        USER_DIV_D: true,
        BSNS_CD: userStore.bsnsCd,
        BSNS_CD_D: true,
        DEPT_CD: userStore.deptCd,
        DEPT_CD_D: true,
        MULTI: true,
      })
    }
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave01).setQuery(saveData01).setAfter(afterSave01).run()
  } else if (btn.id === 'btnApplication') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('신청 하시겠습니까?')
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .run()
  } else if (btn.id === 'btnReqCancel') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('신청취소 하시겠습니까?')
      .setBefore(beforeSave03)
      .setQuery(saveData03)
      .setAfter(afterSave03)
      .run()
  } else {
    ozPrint()
  }
}

//저장관련 로직 시작
const beforeSave01 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (!data.CLOTHE_GUBUN) {
      Message.warn(t('피복종류를 선택해주세요.'))
      return false
    } else if (!data.CLOTHE_SIZE) {
      Message.warn(t('피복사이즈를 선택해주세요.'))
      return false
    } else if (!data.REQ_COUNT) {
      Message.warn(t('신청수량을 입력해주세요.'))
      return false
    } else if (!data.REQ_REASON) {
      Message.warn(t('신청사유를 입력해주세요.'))
      return false
    }
    return true
  }
}

const saveData01 = () => {
  let saveParam = []
  let REQ_CHA = ''
  let day = dayjs().format('MM-DD')
  let date = dayjs()
  if (day >= '07-01') {
    REQ_CHA = '1'
  } else {
    REQ_CHA = '0'
  }
  let REQ_DATE = dayjs().format('YYYYMMDD')

  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      REQ_SEQ: data.REQ_SEQ, //수시신청 SEQ
      CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
      REQ_CHA: data.REQ_CHA ? data.REQ_CHA : REQ_CHA, //신청시기
      YEAR: data.YEAR ? data.YEAR : date.get('year'), //신청년도
      EMP_NO: data.EMP_NO, //사번
      REQ_DATE: data.REQ_DATE ? data.REQ_DATE : REQ_DATE, //신청일자
      USER_DIV: data.USER_DIV, //조직구분
      BSNS_CD: data.BSNS_CD, //사업부코드
      DEPT_CD: data.DEPT_CD, //부서코드
      ASGN_CD: data.ASGN_CD, //조직코드
      CLOTHE_GUBUN: data.CLOTHE_GUBUN, //피복종류
      CLOTHE_SIZE: data.CLOTHE_SIZE, //피복사이즈
      REQ_COUNT: data.REQ_COUNT, //신청수량
      REQ_REASON: data.REQ_REASON, //신청사유
      FILE_ID: data.FILE_ID, //파일아이디
      STATUS: data.STATUS, //신청상태
      REQ_DIV: '1', //신청구분(수시신청이니까 신청구분은 1로 고정)
      REMARKS: data.REMARKS, //비고
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }

  return commonExecuteApi({
    queryId: 'CLDCA0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave01 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//저장관련 로직 끝

//신청관련 로직 시작
const beforeSave02 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.STATUS === '30') {
      Message.warn(t('지급완료된 데이터가 있습니다.'))
      return false
    } else if (data.STATUS === '20') {
      Message.warn(t('신청완료된 데이터가 있습니다.'))
      return false
    } else if (!data.CLOTHE_GUBUN) {
      Message.warn(t('피복종류를 선택해주세요.'))
      return false
    } else if (!data.CLOTHE_SIZE) {
      Message.warn(t('피복사이즈를 선택해주세요.'))
      return false
    } else if (!data.REQ_COUNT) {
      Message.warn(t('신청수량을 입력해주세요.'))
      return false
    } else if (!data.REQ_REASON) {
      Message.warn(t('신청사유를 입력해주세요.'))
      return false
    }
    return true
  }
}

const saveData02 = () => {
  let saveParam = []
  let REQ_CHA = ''
  let REQ_DATE = dayjs().format('YYYYMMDD')
  let day = dayjs().format('MM-DD')
  let date = dayjs()
  if (day >= '07-01') {
    REQ_CHA = '1'
  } else {
    REQ_CHA = '0'
  }

  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      REQ_SEQ: data.REQ_SEQ, //신청SEQ
      CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
      REQ_CHA: data.REQ_CHA ? data.REQ_CHA : REQ_CHA, //신청시기
      YEAR: data.YEAR ? data.YEAR : date.get('year'), //신청년도
      EMP_NO: data.EMP_NO, //사번
      ASGN_NM: data.ASGN_NM, //소속
      EMP_NM: data.EMP_NM, //성명
      REQ_DATE: data.REQ_DATE ? data.REQ_DATE : REQ_DATE, //신청일자
      USER_DIV: data.USER_DIV, //조직구분
      BSNS_CD: data.BSNS_CD, //사업부코드
      DEPT_CD: data.DEPT_CD, //부서코드
      ASGN_CD: data.ASGN_CD, //조직코드
      CLOTHE_GUBUN: data.CLOTHE_GUBUN, //피복종류
      CLOTHE_SIZE: data.CLOTHE_SIZE, //피복사이즈
      REQ_COUNT: data.REQ_COUNT, //신청수량
      REQ_REASON: data.REQ_REASON, //신청사유
      FILE_ID: data.FILE_ID, //파일아이디
      REQ_DIV: '1', //신청구분(수시신청이니까 신청구분은 1로 고정)
      REMARKS: data.REMARKS, //비고
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }

  return commonExecuteApi({
    queryId: 'CLDCA0010_SAVE_02',
    list: saveParam,
  })
}

const afterSave02 = (res) => {
  sendMail(res)
  onButtonsClick({ id: 'btnSearch' })
}
//신청관련 로직 끝

//신청취소 관련 로직 시작
const beforeSave03 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])

    if (data.STATUS !== '20') {
      Message.warn(t('신청완료인 데이터만 신청취소가 가능합니다.'))
      return false
    }
  }
  return true
}

const saveData03 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      REQ_SEQ: data.REQ_SEQ,
      CMPNY_DIV: data.CMPNY_DIV,
      REQ_CHA: data.REQ_CHA,
      YEAR: data.YEAR,
      EMP_NO: data.EMP_NO,
      REQ_DATE: data.REQ_DATE,
      USER_DIV: data.USER_DIV,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDCA0010_SAVE_03',
    list: saveParam,
  })
}

const afterSave03 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//신청취소 관련 로직 끝

//조회관련 로직 시작
const beforeSearch = () => {
  //2025.06.27 김현재 작성
  //신청일자의 년도가 다르면 쿼리단에서 대상여부 판단을 하지못함
  //ex) 신청일자 FROM이 2024-12-01 이고 신청일자 TO가 2025-01-03일때 년도가 다르므로 대상여부 판단하지 못해서 같은년도로만 조회되도록 함
  let YEAR_FROM = searchParam.REQ_DATE_FROM.substring(0, 4)
  let YEAR_TO = searchParam.REQ_DATE_TO.substring(0, 4)

  if (YEAR_FROM !== YEAR_TO) {
    Message.warn(t('신청일자는 같은 년도로만 조회가능합니다.'))
    return false
  }
  //2025.08.29김현재 작성
  //신청일자의 조회일자는 상반기,하반기로만 하도록
  //사유는 위와 같음
  let MONTH_FROM = searchParam.REQ_DATE_FROM.substring(5, 7)
  let MONTH_TO = searchParam.REQ_DATE_TO.substring(5, 7)
  if (MONTH_FROM <= '01' && MONTH_TO <= '06') {
    searchParam.REQ_CHA = '0' //하반기로 조회했으니 하반기값
    return true
  } else if (MONTH_FROM >= '07' && MONTH_TO >= '07') {
    searchParam.REQ_CHA = '1' //상반기로 조회했으니 상반기값
    return true
  } else {
    Message.warn(t('신청일자는 상반기,하반기로만 조회 가능합니다.'))
    return false
  }
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'CLDCA0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//그리드 셀 클릭 이벤트 첨부컬럼 셀을 클릭하면 파일 업로드 팝업을 띄운다.
const onCellButtonClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  //파일아이디 없을때 파일아이디 저장
  if (!data.FILE_ID) {
    fileUploadPopup.value.setGuid()
    let fileID = fileUploadPopup.value.guid
    grdMain.value.getDataProvider().setValue(col.dataRow, 'FILE_ID', fileID)
    grdMain.value.getGridView().checkItem(col.dataRow, true)
    fileUploadPopup.value.openPopup(fileID)
  } else {
    fileUploadPopup.value.openPopup(data.FILE_ID)
  }
}

//신청사유를 훼손으로 선택했을때, 신청사유를 신규보임으로 선택했을때 각각 안내팝업을 띄워준다.
//신규보임 0 피복훼손 1
const onCellEdited = async (grid, itemIndex, row, field) => {
  let fileName = grdMain.value.getGridView().getColumn(field)

  if (fileName.name === 'REQ_REASON') {
    let day = dayjs().format('MM-DD')
    let REQ_CHA = ''
    if (day >= '07-01') {
      REQ_CHA = '1'
    } else {
      REQ_CHA = '0'
    }
    let data = grdMain.value.getDataProvider().getJsonRow(itemIndex)
    if (data.REQ_REASON === '0') {
      //신규보임선택시
      await vm.$swal({
        title: t('신규보임 신청시, 직영(보임변경공문 첨부), 협력사 SCMS 직책화면 첨부'),
        showCancelButton: false,
      })
      //대상자일때는 초도지급여부 다시 조회해서 세팅해줌
      //신청사유를 피복훼손으로 선택하면 신청수량이 1로 변경되는데 피복훼손으로 선택한 상태에서 신규보임으로 선택했을때 수량을 다시 조회해서 넣어주기위해서
      if (data.DUTY_YN === 'Y') {
        //초도지급여부 조회
        await selectFunction({
          queryId: 'GET_CLD_INITIAL_YN',
          CMPNY_DIV: userStore.cmpnyDiv,
          EMP_NO: data.EMP_NO,
          YEAR: searchParam.REQ_DATE_FROM.substring(0, 4),
          REQ_CHA: REQ_CHA,
          USER_DIV: data.USER_DIV,
        }).then((res) => {
          grdMain.value.getDataProvider().setValue(itemIndex, 'REQ_COUNT', res.ORESULT_CUR === 'Y' ? 2 : 1)
        })
      } else {
        //대상자 아닐때는 1
        grdMain.value.getDataProvider().setValue(itemIndex, 'REQ_COUNT', 1)
      }
    }
    //피복훼손 선택시
    else if (data.REQ_REASON === '1') {
      await vm.$swal({
        title: t(`1. 훼손 신청 시, 반드시 훼손된사진을 첨부해야 신청 가능합니다.

                  2. 단순변색 등은 훼손교체 불가합니다.

                  3. 피복교환 시 1:1 맞교환하여야 합니다.

                  4. 훼손 사진 : 전체사진 + 훼손된 부분사진 + 피복안쪽 테그사진

                  * 당해년도 지급분에 한해 교환 가능
`),
        showCancelButton: false,
      })
      grdMain.value.getDataProvider().setValue(itemIndex, 'REQ_COUNT', 1) //피복훼손은 무조건 1
    }
    //신청사유 정기분미지급
    else if (data.REQ_REASON === '2') {
      if (data.DUTY_YN === 'Y') {
        //초도지급여부 조회
        await selectFunction({
          queryId: 'GET_CLD_INITIAL_YN',
          CMPNY_DIV: userStore.cmpnyDiv,
          EMP_NO: data.EMP_NO,
          YEAR: searchParam.REQ_DATE_FROM.substring(0, 4),
          REQ_CHA: REQ_CHA,
          USER_DIV: data.USER_DIV,
        }).then((res) => {
          grdMain.value.getDataProvider().setValue(itemIndex, 'REQ_COUNT', res.ORESULT_CUR === 'Y' ? 2 : 1)
        })
      } else {
        //대상자 아닐때는 1
        grdMain.value.getDataProvider().setValue(itemIndex, 'REQ_COUNT', 1)
      }
    }
    //신청사유 기타
    else {
      grdMain.value.getDataProvider().setValue(itemIndex, 'REQ_COUNT', 1)
    }
  }
}

//수시신청후 피복담당자(안전보건지원부 박래순책임)에게 메일 전송
const sendMail = (saveData) => {
  let mailData = _.cloneDeep(saveData.list)
  for (let i = 0; i < saveData.list.length; i++) {
    let reqReason =
      mailData[i].REQ_REASON === '0'
        ? '신규보임'
        : mailData[i].REQ_REASON === '1'
        ? '피복훼손'
        : mailData[i].REQ_REASON === '2'
        ? '정기분미신청'
        : mailData[i].REQ_REASON === '3'
        ? '기타'
        : null
    let sendMailParam = {
      EMAIL: ['hhiprs@hd.com'], //받는사람 이메일주소(안전통합경영실 - 박래순책임) 2025.01.23 김현재 작성 2025.01.23일 기준으로 메일 수신자는 박래순책임 이지만 추후 피복담당자가 변경되면 담당자 이메일로 변경할것
      SUBJECT: '피복 수시신청 메일', //메일제목
      CONTENT: `
    피복 수시신청 내역이 있습니다. <br>
    <br>
    소속 : ${mailData[i].ASGN_NM} <br> 성명 : ${mailData[i].EMP_NM} <br> 신청일자: ${mailData[i].REQ_DATE.slice(
        0,
        4
      )}-${mailData[i].REQ_DATE.slice(4, 6)}-${mailData[i].REQ_DATE.slice(6, 8)} <br> 신청사유 : ${reqReason}`, //메일내용
    }
    commonSendApi(sendMailParam)
  }
  //2025.10.16 김현재 작성 염동희매니저에게 메일 가는 부분을 염동희 매니저 요청으로 안가도록 주석처리
  // for (let i = 0; i < saveData.list.length; i++) {
  //   let reqReason =
  //     mailData[i].REQ_REASON === '0'
  //       ? '신규보임'
  //       : mailData[i].REQ_REASON === '1'
  //       ? '피복훼손'
  //       : mailData[i].REQ_REASON === '2'
  //       ? '정기분미신청'
  //       : mailData[i].REQ_REASON === '3'
  //       ? '기타'
  //       : null
  //   let sendMailParam = {
  //     EMAIL: ['a550481@hd.com'], //받는사람 이메일주소(안전통합경영실 -염동희매니저) 2025.09.05 김현재 작성 박래순 책임님 요청으로 염동희매니저에게도 메일 가도록 추가
  //     SUBJECT: '피복 수시신청 메일', //메일제목
  //     CONTENT: `
  //   피복 수시신청 내역이 있습니다. <br>
  //   <br>
  //   소속 : ${mailData[i].ASGN_NM} <br> 성명 : ${mailData[i].EMP_NM} <br> 신청일자: ${mailData[i].REQ_DATE.slice(
  //       0,
  //       4
  //     )}-${mailData[i].REQ_DATE.slice(4, 6)}-${mailData[i].REQ_DATE.slice(6, 8)} <br> 신청사유 : ${reqReason}`, //메일내용
  //   }
  //   commonSendApi(sendMailParam)
  // }
}

//출력관련 로직 시작
const ozPrint = async () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  let saveParam = []
  if (chkNum.length === 0) {
    Message.warn(t('출력할 데이터를 선택해주세요.'))
    return false
  }
  reportParam[0] = 'IN_KEY='
  reportParam[1] = 'IN_CMPNY_DIV='
  reportParam[2] = 'IN_YEAR='
  reportParam[3] = 'IN_REQ_CHA='

  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    if (!data.PAYMENT_DATE) {
      Message.warn(t('지급일자가 없는 데이터는 출력할 수 없습니다.'))
      return false
    } else if (data.PRINT_YN === '출력완료') {
      await vm.$swal({
        title: t(`재출력은 불가합니다.
                 안전보건지원부 - 박래순책임에게 문의(2-5466)`),
        showCancelButton: false,
      })
      return false
    }
    reportParam[0] += data.REQ_SEQ + data.CMPNY_DIV + data.YEAR + data.EMP_NO + ','
    let saveData = {
      REQ_SEQ: data.REQ_SEQ,
      CMPNY_DIV: data.CMPNY_DIV,
      REQ_CHA: data.REQ_CHA,
      YEAR: data.YEAR,
      EMP_NO: data.EMP_NO,
      REQ_DATE: data.REQ_DATE,
      USER_DIV: data.USER_DIV,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  //2025.10.31 김현재 작성
  /*
  안전보건지원부 박래순책임님 요청으로 한번 출력한 인원은 재출력을 하지 못하도록 막음
  계속 출력하도록하면 신청자가 재출력해서 피복을 또 지급받을수 있을수도 있다는 요청이 있어서 이러한 경우를 방지하기위해 추가함
  만약 다시 출력을 하게되는 경우에는 수시신청관리 화면에서 출력취소를해서 플래그값을 바꿔주면 재출력이 가능
  박래순책임님과 협의후에 개발 진행함.
  */
  commonExecuteApi({
    queryId: 'CLDCA0010_SAVE_04',
    list: saveParam,
  }).then(() => {
    //마지막 , 제거
    reportParam[0] = reportParam[0].substring(0, reportParam[0].length - 1) + ''
    reportParam[1] += userStore.cmpnyDiv
    reportParam[2] += new Date().getFullYear()
    reportParam[3] += day >= '07-01' ? '1' : '0'

    showOz.value = true
  })
}
//출력관련 로직 끝

//부서팝업 오픈 이벤트
const openDeptPopup = () => {
  deptPopup.value.openPopup({})
}

const selectedDept = (val) => {
  searchParam.DEPT_NM = val.ASGN_FULL_NM
  searchParam.DEPT_CD = val.DEPT_CD
  searchParam.BSNS_CD = val.BSNS_CD
  searchParam.ASGN_CD = val.ASGN_CD
  searchParam.USER_DIV = val.ORGN_DIV
  onButtonsClick({ id: 'btnSearch' })
}

const selectedEmp = async (val) => {
  let notDutyYn = 0
  let addRowData = []
  let REQ_CHA = ''
  let day = dayjs().format('MM-DD')
  //오늘날짜 기준으로 상,하반기 구분
  if (day >= '07-01') {
    //하반기
    REQ_CHA = '1'
  } else {
    //상반기
    REQ_CHA = '0'
  }
  for (let i = 0; i < val.length; i++) {
    let date = dayjs()
    if (val[i].USER_DIV === 'A') {
      //대상여부 확인(직영)
      await selectFunction({
        queryId: 'GET_CLD_DUTY_YN_A',
        CMPNY_DIV: val[i].CMPNY_DIV,
        EMP_NO: val[i].EMP_NO,
        BSNS_CD: val[i].BSNS_CD,
        ASGN_CD: val[i].ASGN_CD,
        OFFI_RES_CD: val[i].OFFI_RES_CD,
        YEAR: date.get('year'),
        REQ_CHA: REQ_CHA,
      }).then(async (res) => {
        if (res.ORESULT_CUR === 'Y') {
          //대상자면 지급기준 조회
          await selectFunction({
            queryId: 'GET_CLD_STANDARD_A',
            CMPNY_DIV: val[i].CMPNY_DIV,
            EMP_NO: val[i].EMP_NO,
            BSNS_CD: val[i].BSNS_CD,
            OFFI_RES_CD: val[i].OFFI_RES_CD,
            OFFI_RES_DATE: val[i].OFFI_RES_DATE,
            JOB_DEPT_CD: val[i].JOB_DEPT_CD,
          }).then(async (res) => {
            //최근피복수령일 조회
            let param = {
              CMPNY_DIV: val[i].CMPNY_DIV,
              USER_DIV: val[i].USER_DIV,
              EMP_NO: val[i].EMP_NO,
            }
            await commonSearchApi({
              queryId: 'CLDCA0010_SEARCH_02',
              param: param,
            }).then(async (paymentRes) => {
              //초도지급여부 조회
              let initialYn = await selectFunction({
                queryId: 'GET_CLD_INITIAL_YN',
                CMPNY_DIV: val[i].CMPNY_DIV,
                EMP_NO: val[i].EMP_NO,
                YEAR: searchParam.REQ_DATE_FROM.substring(0, 4),
                REQ_CHA: REQ_CHA,
                USER_DIV: userStore.userDiv,
              })
              let rowData = {
                BSNS_CD: val[i].BSNS_CD, //사업부코드
                BSNS_NM: val[i].BSNS_NM, // 사업부
                DEPT_CD: val[i].DEPT_CD, //부서코드
                ASGN_CD: val[i].ASGN_CD, //조직코드
                ASGN_NM: val[i].ASGN_NM, // 소속
                EMP_NO: val[i].EMP_NO, // 사번
                EMP_NM: val[i].EMP_NM, //성명
                USER_DIV: val[i].USER_DIV, //조직구분
                OFFI_RES_NM: val[i].OFFI_RES_NM, // 직책
                OFFI_RES_DATE: val[i].OFFI_RES_DATE, // 직책보임일자
                GET_CLOTHE_DATE: paymentRes.ORESULT_CUR[0]?.PAYMENT_DATE ? paymentRes.ORESULT_CUR[0]?.PAYMENT_DATE : '', //최근피복수령일
                DUTY_YN: 'Y', //대상여부
                REQ_COUNT: initialYn.ORESULT_CUR === 'Y' ? 2 : 1,
                STATUS: '10', //신청상태 -> 미신청
                STANDARD: res.ORESULT_CUR, //지급기준
              }
              addRowData.push(rowData)
            })
          })
        }
        //대상자가 아닐때(직영)
        else {
          //최근피복수령일 조회
          let param = {
            CMPNY_DIV: val[i].CMPNY_DIV,
            USER_DIV: val[i].USER_DIV,
            EMP_NO: val[i].EMP_NO,
          }
          await commonSearchApi({
            queryId: 'CLDCA0010_SEARCH_02',
            param: param,
          }).then((paymentRes) => {
            let rowData = {
              BSNS_CD: val[i].BSNS_CD, //사업부코드
              BSNS_NM: val[i].BSNS_NM, // 사업부
              DEPT_CD: val[i].DEPT_CD, //부서코드
              ASGN_CD: val[i].ASGN_CD, //조직코드
              ASGN_NM: val[i].ASGN_NM, // 소속
              EMP_NO: val[i].EMP_NO, // 사번
              EMP_NM: val[i].EMP_NM, //성명
              USER_DIV: val[i].USER_DIV, //조직구분
              OFFI_RES_NM: val[i].OFFI_RES_NM, // 직책
              OFFI_RES_DATE: val[i].OFFI_RES_DATE, // 직책보임일자
              GET_CLOTHE_DATE: paymentRes.ORESULT_CUR[0]?.PAYMENT_DATE ? paymentRes.ORESULT_CUR[0]?.PAYMENT_DATE : '', //최근피복수령일
              DUTY_YN: '', //대상여부
              REQ_COUNT: 1, //대상자가 아니면 1
              STATUS: '10', //신청상태 -> 미신청
              STANDARD: '', //지급기준
            }
            addRowData.push(rowData)
          })
        }
      })
    } else {
      //협력사 대상자조회
      await selectFunction({
        queryId: 'GET_CLD_DUTY_YN_B',
        CMPNY_DIV: val[i].CMPNY_DIV,
        EMP_NO: val[i].EMP_NO,
        BSNS_CD: val[i].BSNS_CD,
        ASGN_CD: val[i].ASGN_CD,
        JOB_TIT_NM: val[i].JOB_TIT_NM,
        STD_DUTY_CD: val[i].STD_DUTY_CD,
        UNT_DUTY_CD: val[i].UNT_DUTY_CD,
        YEAR: date.get('year'),
        REQ_CHA: REQ_CHA,
      }).then(async (res) => {
        //대상자일때(협력사)
        if (res.ORESULT_CUR === 'Y') {
          await selectFunction({
            queryId: 'GET_CLD_STANDARD_B',
            CMPNY_DIV: val[i].CMPNY_DIV,
            EMP_NO: val[i].EMP_NO,
            JOB_TIT_NM: val[i].JOB_TIT_NM,
            STD_DUTY_CD: val[i].STD_DUTY_CD,
            UNT_DUTY_CD: val[i].UNT_DUTY_CD,
          }).then(async (res) => {
            //초도지급여부 조회
            let initialYn = await selectFunction({
              queryId: 'GET_CLD_INITIAL_YN',
              CMPNY_DIV: val[i].CMPNY_DIV,
              EMP_NO: val[i].EMP_NO,
              YEAR: searchParam.REQ_DATE_FROM.substring(0, 4),
              REQ_CHA: REQ_CHA,
              USER_DIV: userStore.userDiv,
            })
            //최근피복수령일 조회
            let param = {
              CMPNY_DIV: val[i].CMPNY_DIV,
              USER_DIV: val[i].USER_DIV,
              EMP_NO: val[i].EMP_NO,
            }
            await commonSearchApi({
              queryId: 'CLDCA0010_SEARCH_02',
              param: param,
            }).then((paymentRes) => {
              let rowData = {
                BSNS_CD: val[i].BSNS_CD, //사업부코드
                BSNS_NM: val[i].BSNS_NM, // 사업부
                DEPT_CD: val[i].DEPT_CD, // 부서코드
                ASGN_CD: val[i].ASGN_CD, //조직코드
                ASGN_NM: val[i].ASGN_NM, // 소속
                EMP_NO: val[i].EMP_NO, // 사번
                EMP_NM: val[i].EMP_NM, //성명
                USER_DIV: val[i].USER_DIV, //조직구분
                OFFI_RES_NM: val[i].JOB_TIT_NM, // 직위
                GET_CLOTHE_DATE: paymentRes.ORESULT_CUR[0]?.PAYMENT_DATE ? paymentRes.ORESULT_CUR[0].PAYMENT_DATE : '', //최근피복수령일
                DUTY_YN: 'Y', //대상여부
                REQ_COUNT: initialYn.ORESULT_CUR === 'Y' ? 2 : 1,
                STATUS: '10', //신청상태 -> 미신청
                STANDARD: res.ORESULT_CUR, //지급기준
              }
              addRowData.push(rowData)
            })
          })
        } else {
          //대상자가 아닐때(협력사)
          //최근피복수령일 조회
          let param = {
            CMPNY_DIV: val[i].CMPNY_DIV,
            USER_DIV: val[i].USER_DIV,
            EMP_NO: val[i].EMP_NO,
          }
          await commonSearchApi({
            queryId: 'CLDCA0010_SEARCH_02',
            param: param,
          }).then((paymentRes) => {
            let rowData = {
              BSNS_CD: val[i].BSNS_CD, //사업부코드
              BSNS_NM: val[i].BSNS_NM, // 사업부
              DEPT_CD: val[i].DEPT_CD, // 부서코드
              ASGN_CD: val[i].ASGN_CD, //조직코드
              ASGN_NM: val[i].ASGN_NM, // 소속
              EMP_NO: val[i].EMP_NO, // 사번
              EMP_NM: val[i].EMP_NM, //성명
              USER_DIV: val[i].USER_DIV, //조직구분
              OFFI_RES_NM: val[i].OFFI_RES_NM, // 직책
              OFFI_RES_DATE: val[i].OFFI_RES_DATE, // 직책보임일자
              GET_CLOTHE_DATE: paymentRes.ORESULT_CUR[0]?.PAYMENT_DATE ? paymentRes.ORESULT_CUR[0]?.PAYMENT_DATE : '', //최근피복수령일
              DUTY_YN: '', //대상여부
              REQ_COUNT: 1, //대상자가 아니면 1
              STATUS: '10', //신청상태 -> 미신청
              STANDARD: '', //지급기준 대상자가 아니면 지급기준 표시 안함
            }
            addRowData.push(rowData)
          })
        }
      })
    }
  }
  for (let i = 0; i < addRowData.length; i++) {
    grdMain.value.addRow(addRowData[i])
  }
  Message.warn(t('인원이 추가되었습니다.'))
}

//행변경 이벤트
const rowChanged = async (grid, oldRow, newRow) => {
  if (newRow === -1) {
    return false
  }

  let rowData = await grdMain.value.getDataProvider().getJsonRow(newRow)
  // 지급완료된건 수정불가
  if (rowData.STATUS === '30') {
    grdMain.value.getGridView().columnByName('CLOTHE_GUBUN').editable = false
    grdMain.value.getGridView().columnByName('REQ_COUNT').editable = false
    grdMain.value.getGridView().columnByName('REMARKS').editable = false
    grdMain.value.getGridView().columnByName('CLOTHE_SIZE').editable = false
    grdMain.value.getGridView().columnByName('REQ_REASON').editable = false
  } else {
    //Y면 수정가능
    grdMain.value.getGridView().columnByName('CLOTHE_GUBUN').editable = true
    //grdMain.value.getGridView().columnByName('REQ_COUNT').editable = true
    grdMain.value.getGridView().columnByName('REMARKS').editable = true
    grdMain.value.getGridView().columnByName('CLOTHE_SIZE').editable = true
    grdMain.value.getGridView().columnByName('REQ_REASON').editable = true
  }
}

const clearDeptcd = () => {
  searchParam.DEPT_NM = '전체'
  searchParam.DEPT_CD = ''
  searchParam.BSNS_CD = ''
  searchParam.ASGN_CD = ''
  searchParam.USER_DIV = ''
}

const closed = (val) => {
  console.log('val', val)
  onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnApplication', 'btnReqCancel', 'btnPrint']"
        @click-button="onButtonsClick"
        :use-permission="false"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('부서')"
              width="250px"
              v-model="searchParam.DEPT_NM"
              :append-inner-icon="menuAdmin ? 'mdi-magnify' : null"
              @click:appendInner="openDeptPopup"
              readonly
            >
              <template #append-inner v-if="menuAdmin">
                <v-icon icon="mdi-window-close" @click="clearDeptcd" />
              </template>
            </i-input>
            <i-input width="70px" v-model="searchParam.DEPT_CD" readonly> </i-input>
            <v-checkbox true-value="Y" false-value="N" class="mt-1" v-model="searchParam.DUTY_YN"> </v-checkbox>
            <span class="mt-2 mr-5">대상자만 조회</span>
            <i-input
              :label="$t('신청일자')"
              label-width="50px"
              width="200px"
              v-model="searchParam.REQ_DATE_FROM"
              type="date"
            >
            </i-input>
            <span class="mt-2 mr-2">~</span>
            <i-input width="140px" v-model="searchParam.REQ_DATE_TO" type="date"> </i-input>
            <i-select
              :label="$t('신청상태')"
              width="170px"
              v-model="searchParam.STATUS"
              :items="codeList.STATUS"
              item-title="TXT"
              item-value="COD"
            ></i-select>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellItemClicked="onCellButtonClicked"
            @onCellEdited="onCellEdited"
            @onCurrentRowChanged="rowChanged"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <IUploadPopup ref="fileUploadPopup" :file-dan="true"></IUploadPopup>
  <!-- 레포트 -->
  <OZReport :showPop="showOz" :reportName="reportName" :params="reportParam" @close="showOz = $event" />
  <DeptPopup ref="deptPopup" @selected="selectedDept"></DeptPopup>
  <EmpPopup ref="empPopup" @selected="selectedEmp"></EmpPopup>
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
