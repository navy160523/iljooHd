<!-- 
  화면명 : 장비자격증 발급(통합안전교육센터)
  화면개요 : 장비자격증 신청을 확정, 반려 또는 자격증을 출력할 수 있는 화면
 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from '@/utils/excel'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import EDUBA0010Popup_01 from '@/pages/60_edu/EDU_B/EDUBA0010Pop01.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import _ from 'lodash'
// import { requiredNumber } from '@/utils/required.js'

defineOptions({
  name: '60_edu-EDU_B-EDUBA0040',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const searchArea = ref(null)
let BSNS_NM = ref(null)
let DEPT_NM = ref(null)
const eDUBA0010Popup_01 = ref(null)
const gridLock = ref(0) //그리드 조회시
const firstLock = ref(0)
const fileUploadPopup = ref(null) //파일 업로드 팝업
const fieldIndex = ref(null)
const fieldName = reactive('FILE_ID')

const printEMP_NO = ref('')
const picFronts = reactive({}) //자격증 앞면 이미지
const picBacks = reactive({}) //자격증 뒷면 이미지
const picIds = reactive({}) //사원 이미지
const userStats = reactive({}) //사원 정보
const licGetDts = reactive({}) //자격증 취득 일자
const licKindsNm = reactive({}) //자격 종류
const dialog = ref(false)
const REJECT_DESC = ref('')

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const printParams = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

const setPrint = () => {
  reportName.value = reportName.value

  printParams.value = [
    'IN_CMPNY_DIV=' + userStore.cmpnyDiv, // 회사구분
    'IN_EMP_NO=' + printEMP_NO.value, // 사번
  ]
}

// #1 END ------------------------------------------------------

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DATE_GBN: 'Y', //날짜사용여부
  DATE_FR: dayjs(new Date().setDate(new Date().getDate() - 10)).format(
    'YYYY-MM-DD'
  ), //기간 시작
  DATE_TO: dayjs(new Date()).format('YYYY-MM-DD'), //기간 종료
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  ORGN_DIV: '', //소속구분
  //STATUS : 'N',   //반려제외(진행상태 조회조건 추가로 비활성화 (2024-01-25))
  REQ_DIV: '', //신청구분
  GBN: '', //자격종류
  EMP_NO: '', //사번
  EMP_NM: '', //성명
  STATUS: '', //진행상태
  REPRINT_YN: 'N', //자격증 재출력
})

//자격종류별 보유자 현황
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  fields: [
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      header: { text: t('소속') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'USER_DIV_NM',
      dataType: 'text',
      header: { text: t('소속구분') },
      editable: false,
    },
    {
      fieldName: 'JOB_TIT_NM',
      dataType: 'text',
      header: { text: t('직위') },
      editable: false,
    },
    {
      fieldName: 'REQ_EMP_NO',
      dataType: 'text',
      header: { text: t('사번') },
      editable: false,
    },
    {
      fieldName: 'REQ_EMP_NM',
      dataType: 'text',
      header: { text: t('사원명') },
      editable: false,
    },
    {
      fieldName: 'HLD_OFFI_GBN_NM',
      dataType: 'text',
      header: { text: t('재직여부') },
      editable: false,
    },
    {
      fieldName: 'REQ_DIV_NM',
      dataType: 'text',
      header: { text: t('신청구분') },
      editable: false,
    },
    {
      fieldName: 'LIC_KIND_NM',
      dataType: 'text',
      header: { text: t('자격종류') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'MORGN_NM',
      dataType: 'text',
      header: { text: t('교육주관') },
      styleName: 'left-column',
      editable: false,
    },
    {
      fieldName: 'LIC_GET_DT',
      dataType: 'text',
      header: { text: t('자격취득일') },
      editable: false,
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
    },
    {
      fieldName: 'REQ_DT',
      dataType: 'text',
      header: { text: t('신청일') },
      editable: false,
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
    },
    {
      fieldName: 'CONFIRM_DT',
      dataType: 'text',
      header: { text: t('확정일') },
      editable: false,
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
    },
    {
      fieldName: 'REQ_REASON',
      dataType: 'text',
      header: { text: t('재발급사유') },
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      editable: false,
    },
    {
      fieldName: 'FILE_ID_YN',
      dataType: 'text',
      header: { text: t('사유서 첨부') },
      editable: false,
      button: 'action',
      buttonVisibility: 'always',
      styleName: 'editable_column',
    },
    {
      fieldName: 'REISSUE_DESC',
      dataType: 'text',
      width: '100',
      header: { text: t('구 부서명(소속변경시 작성)') },
      editable: false,
    },
    {
      fieldName: 'INSERT_USER_NM',
      dataType: 'text',
      header: { text: t('등록자') },
      editable: false,
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      header: { text: t('진행상태') },
      editable: false,
      lookupDisplay: true,
      editor: { type: 'list' },
      editable: false,
    },
    {
      fieldName: 'REJECT_DESC',
      dataType: 'text',
      header: { text: t('반려사유') },
      editable: false,
    },
    {
      fieldName: 'PRINT_YN',
      dataType: 'text',
      header: { text: t('출력여부') },
      editable: false,
    },
    {
      fieldName: 'ISSUE_DT',
      dataType: 'text',
      header: { text: t('발급일자') },
      editable: false,
    },

    //비활성화
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('회사구분') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'REQ_SEQ',
      dataType: 'text',
      header: { text: t('REQ_SEQ') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      header: { text: t('FILE_ID') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'LIC_KIND',
      dataType: 'text',
      header: { text: t('LIC_KIND') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'INSERT_USER_EMAIL',
      dataType: 'text',
      header: { text: t('INSERT_USER_EMAIL') },
      editable: false,
      visible: false,
    },
    // 2024.07.26 박용훈 추가
    {
      fieldName: 'REQ_DIV',
      dataType: 'text',
      header: { text: t('REQ_DIV') },
      editable: false,
      visible: false,
    },
  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields

const codeList = reactive({
  bsnsCd: [], //사업부
  deptCd: [], //부서
  orgnDiv: [], //소속구분
  gbn: [], //자격종류
  reqDiv: [], //신청구분
  status: [], //진행상태
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
    }), // 사업부
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: 'Y' },
    }), // 부서
    getCodeList('HHID210'), //소속구분
    getCodeList('HHID240'), //자격종류
    getCodeList('HHID230'), //재발급사유
    getCodeList('HHIF320'), //진행상태
  ]).then((res) => {
    //사업부 데이터 세팅
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    let findIndex = res[0].ORESULT_CUR.findIndex(
      (item) => item.BSNS_CD === userStore.bsnsCd
    )
    searchParams.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD

    //부서 데이터 세팅
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

    //소속구분 데이터 세팅
    codeList.orgnDiv = res[2].ORESULT_CUR
    codeList.orgnDiv.unshift({ TXT: '전체', COD: '' })
    searchParams.ORGN_DIV = codeList.orgnDiv[0].COD

    codeList.status = res[5].ORESULT_CUR
    codeList.status.unshift({ TXT: '전체', COD: '' })
    searchParams.STATUS = codeList.status[0].COD

    //자격종류 데이터 세팅
    codeList.gbn = res[3].ORESULT_CUR
    searchParams.GBN = codeList.gbn[0].COD

    //신청구분 데이터 세팅(하드코딩)
    codeList.reqDiv.push(
      { TXT: '전체', COD: '' },
      { TXT: '신규', COD: 'NW' },
      { TXT: '재발급', COD: 'R' }
    )

    //재발급사유 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn(
      'REQ_REASON',
      res[4].ORESULT_CUR,
      'COD',
      'TXT'
    )

    //진행상태 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn('STATUS', res[5].ORESULT_CUR, 'COD', 'TXT')
  })
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    searchParams.DEPT_CD = ''
    if (newValue === '') {
      codeList.deptCd = []
      codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

      return
    }
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    })
      .then((res) => {
        codeList.deptCd = res.ORESULT_CUR
        codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        if (firstLock.value === 0) {
          let findIndex = res.ORESULT_CUR.findIndex(
            (item) => item.DEPT_CD === userStore.deptCd
          )
          searchParams.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
          firstLock.value = 1
        } else {
          searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
        }
      })
      .finally(() => {
        // if(firstLock.value === 1){
        //   onButtonsClick({ id : 'btnSearch' })
        //   firstLock.value = 2
        // }
      })
  }
)

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = (btn) => {
  //조회
  gridRefresh()
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

//
const btnMainGrd = async (btn) => {
  if (btn.id === 'btnConfirm') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('확정하시겠습니까?')
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnTurnBack') {
    let checkData = []
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    if (checkedRows.length === 0) {
      Message.warn(t('반려할 데이터를 선택해 주세요.'))

      return
    }
    for (let i = 0; i < checkedRows.length; i++) {
      checkData.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
      if (checkData[i].STATUS === '15') {
        Message.warn(t('이미 반려된 데이터 입니다.'))

        return
      } else if (checkData[i].STATUS === '20') {
        Message.warn(t('확정된 데이터는 반려할 수 없습니다.'))

        return
      } else if (checkData[i].STATUS === '30') {
        Message.warn(t('발급완료된 데이터는 반려할 수 없습니다.'))

        return
      }
    }
    dialog.value = true
  } else if (btn.id === 'btnLicePrintForm') {
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    if (checkedRows.length === 0) {
      Message.warn(t('출력할 데이터를 선택해 주세요.'))
      return
    }
    setPrintForm('btnLicePrintForm')
  } else if (btn.id === 'btnLicePrint') {
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    if (checkedRows.length === 0) {
      Message.warn(t('출력할 데이터를 선택해 주세요.'))
      return
    }
    setPrintForm('btnLicePrint')
  }
}

//반려사유 팝업 버튼 이벤트
const onPopButtonsClick = (btn) => {
  if (btn.id === 'btnTurnBack') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('반려하시겠습니까?')
      .setGridList([grdMain])
      .setBefore(popBeforeSave)
      .setQuery(popSaveData)
      .setAfter(popAfterSave)
      .run()
  } else if (btn.id === 'btnClose') {
    dialog.value = false
  }
}

const setPrintForm = async (btn) => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let checkedParams = []
  if (searchParams.GBN === 'N') {
    for (let i = 0; i < checkedRows.length; i++) {
      checkedParams.push(
        grdMain.value.getDataProvider().getJsonRow(checkedRows[i])
      )
      if (isNullCheck(checkedParams[i].CONFIRM_DT)) {
        Message.warn(t('확정되지 않은 데이터는 출력할 수 없습니다.'))
        return
      }
      printEMP_NO.value +=
        grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).REQ_EMP_NO +
        ';'
    }
    printEMP_NO.value = printEMP_NO.value.slice(0, -1)
    setPrint()

    if (btn === 'btnLicePrint') {

      for (let i = 0; i < checkedRows.length; i++) {
        if (grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).HLD_OFFI_GBN_NM === '퇴직') {
          Message.warn(t('퇴직자가 포함되어 있습니다. 퇴직자 선택 해제 후 다시 출력해주세요.'))
          return
        }
      }
      
      reportName.value = '/manage/hse/EDUBA0030.ozr'
      let ck = await vm.$swal({
        title: t(
          '양면인쇄가 가능한 프린터에 최적화된 인쇄물입니다. 진행하시겠습니까?'
        ),
        showCancelButton: true,
      })
      if (!ck.isConfirmed) {
        return
      }
    } else if (btn === 'btnLicePrintForm') {
      for (let i = 0; i < checkedRows.length; i++) {
        if (grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).HLD_OFFI_GBN_NM === '퇴직') {
          Message.warn(t('퇴직자가 포함되어 있습니다. 퇴직자 선택 해제 후 다시 출력해주세요.'))
          return
        }
      }
      reportName.value = '/manage/hse/EDUBA0032.ozr'
    }

    showOz.value = true

    // commonSearchApi({ queryId : 'EDUBA0030_SEARCH_02', param: search02Params }).then(res => {
    //   let searchData = res.ORESULT_CUR
    //   let picFronts = {}  //자격증 앞면 이미지
    //   let picBacks = {}   //자격증 뒷면 이미지
    //   let picIds = {}     //사원 이미지
    //   let userStats = {}  //사원 정보
    //   let licGetDts = {}  //자격증 취득 일자
    //   let licKindsNm = {} //자격 종류
    //   if(searchData[0].CMPNY_DIV === 'HHI' || searchData[0].CMPNY_DIV === '200' ||
    //      searchData[0].CMPNY_DIV === '210' || searchData[0].CMPNY_DIV === '230'){
    //     for(let i = 0; i < 9; i++){ // 자격증 앞, 뒷면 이미지 경로
    //       if(i < res.ORESULT_CUR.length){
    //         //picFronts[i] = "http://hises.hhi.co.kr/HiSEsFiles/Template/LICE_IMAGE/HG3_"+searchData[0].CMPNY_DIV+".png"
    //         picBacks[`PIC_BACK${i + 1}`] = "http://hises.hhi.co.kr/HiSEsFiles/Template/LICE_IMAGE/HG4_"+searchData[0].CMPNY_DIV+".png"
    //       }else{
    //         picBacks[`PIC_BACK${i + 1}`] = ''
    //       }
    //     }

    //     for(let i = 0; i < searchData.length; i++){
    //       if(searchData[i].USER_DIV === 'A'){ // 직영일 경우 직영의 이미지 경로 사용, 아닐 경우 다른 경로 사용
    //         picIds[i] = "http://hihr.hhi.co.kr/EHR/PHOTO/searchPhoto_dec/searchPhoto_dec/?_params=[EMPLID="+ searchData[i].EMP_NO_ENC + "]"
    //       } else {
    //         picIds[i] = "http://SCMS.HHIGROUP.KR/services/Common/LoadResources.aspx?EID=" + searchData[i].EMP_NO
    //       }
    //       userStats[`EMP${i + 1}_VND_NM`] = searchData[i].VND_NM  //소속
    //       userStats[`EMP${i + 1}_EMP_NO`] = searchData[i].EMP_NO  //사번
    //       userStats[`EMP${i + 1}_KOR_NM`] = searchData[i].KOR_NM  //성명

    //       printParams.value[`EMP${i + 1}_VND_NM`]=searchData[i].VND_NM
    //       printParams.value[`EMP${i + 1}_EMP_NO`]=searchData[i].EMP_NO
    //       printParams.value[`EMP${i + 1}_KOR_NM`]=searchData[i].KOR_NM
    //       for(let j = 0; j < 9; j++){ //취득일자와 자격 종류
    //         licGetDts[`EMP${i + 1}_LIC_GET_DT${j + 1}`] = searchData[i][`LIC_GET_DT${j + 1}`]     //취득일자
    //         licKindsNm[`EMP${i + 1}_LIC_KIND_NM${j + 1}`] = searchData[i][`LIC_KIND_NM${j + 1}`]  //자격종류

    //         printParams.value[`EMP${i + 1}_LIC_GET_DT${j + 1}`]=searchData[i][`LIC_GET_DT${j + 1}`]
    //         printParams.value[`EMP${i + 1}_LIC_KIND_NM${j + 1}`]=searchData[i][`LIC_KIND_NM${j + 1}`]
    //       }
    //     }
    //   }
    // })
    //showOz.value = true
  } else {
    for (let i = 0; i < checkedRows.length; i++) {
      checkedParams.push(
        grdMain.value.getDataProvider().getJsonRow(checkedRows[i])
      )
      if (isNullCheck(checkedParams[i].CONFIRM_DT)) {
        Message.warn(t('확정되지 않은 데이터는 출력할 수 없습니다.'))
        return
      }
      printEMP_NO.value +=
        grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).REQ_EMP_NO +
        ';'
    }
    printEMP_NO.value = printEMP_NO.value.slice(0, -1)
    setPrint()

    if (btn === 'btnLicePrint') {

      for (let i = 0; i < checkedRows.length; i++) {
        if (grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).HLD_OFFI_GBN_NM === '퇴직') {
          Message.warn(t('퇴직자가 포함되어 있습니다. 퇴직자 선택 해제 후 다시 출력해주세요.'))
          return
        }
      }
      
      reportName.value = '/manage/hse/EDUBA0031.ozr'
      let ck = await vm.$swal({
        title: t(
          '출력하시겠습니까?'
        ),
        showCancelButton: true,
      })
      if (!ck.isConfirmed) {
        return
      }
    } 

    showOz.value = true
  }

  printEMP_NO.value = ''
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().setAllCheck(false)
}

//사유서 첨부 컬럼의 버튼 클릭 이벤트
const buttonClicked = (grid, index, fixed) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  fieldIndex.value = index.dataRow
  if (data.REQ_REASON !== 'R3') {
    Message.warn(t('사유서 첨부는 재발급사유가 분실일 경우 가능합니다.'))

    return
  }
  fileUploadPopup.value.openPopup(data['FILE_ID'])
}

const uploaded = (val) => {
  if (val.fileId) {
    grdMain.value
      .getDataProvider()
      .setValue(fieldIndex.value, 'FILE_ID_YN', 'Y')
  }
  grdMain.value
    .getDataProvider()
    .setValue(fieldIndex.value, fieldName, val.fileId)
}

const editRowChange = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grdMain.value.getGridView().checkRow(dataRow, true)
  let data = grdMain.value.getDataProvider().getJsonRow(dataRow)
  grid.commit()
  if (field === 11 && newValue === 'R3') {
    if (data.FILE_ID !== null) {
      grdMain.value.getDataProvider().setValue(dataRow, 'FILE_ID_YN', 'Y')
    } else {
      grdMain.value.getDataProvider().setValue(dataRow, 'FILE_ID_YN', 'N')
    }
  } else {
    grdMain.value.getDataProvider().setValue(dataRow, 'FILE_ID_YN', '')
  }
}

// 기간(FR)이 TO보다 높을 경우 TO와 FR값을 같게 함
const dateFrChanged = (data) => {
  if (data.target.value > searchParams.DATE_TO) {
    searchParams.DATE_TO = searchParams.DATE_FR
  }
}

// 기간(TO)이 FR보다 낮을 경우 TO와 FR값을 같게 함
const dateToChanged = (data) => {
  if (data.target.value < searchParams.DATE_FR) {
    searchParams.DATE_FR = searchParams.DATE_TO
  }
}

//자격증 재출력 버튼 체크시 반드시 발급완료된 데이터들만 출력(다수의 데이터 출력 방지)
//위와 같은 이유로 기간 사용여부도 Y로 고정 => 2024.12.24 재출력 시는 기간 관계없이 조회 되어야 하므로 주석처리
const changedPrintYn = () => {
  gridRefresh()
  if (searchParams.REPRINT_YN === 'Y') {
    searchParams.STATUS = '30'
    //searchParams.DATE_GBN = 'Y'
  } else {
    searchParams.STATUS = ''
  }
}

//사번 유효성 검사
const requiredEMP_NO = (val) => {
  const regex = /^[a-zA-Z0-9]*$/
  if (!regex.test(val)) {
    searchParams.EMP_NO = searchParams.EMP_NO.slice(0, -1)
  }
}

//성명 유효성 검사
const requiredEMP_NM = (val) => {
  const regex = /^[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]*$/
  if (!regex.test(val)) {
    searchParams.EMP_NM = searchParams.EMP_NM.slice(0, -1)
  }
}

//널 체크 이벤트
const isNullCheck = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}
//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
// 조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

// 리스트 조회
const searchData = () => {
  console.log('조회조건 확인', searchParams)
  return commonSearchApi({
    queryId: 'EDUBA0040_SEARCH_01',
    param: searchParams,
  })
}

// 리스트 조회 후
const afterSearch = (res) => {
  //재발급사유가 분실이 아닐경우 사유서 첨부 YN 숨김
  res.ORESULT_CUR.forEach((val) => {
    if (val.REQ_REASON !== 'R3') {
      val.FILE_ID_YN = ''
    }
    if (val.REQ_REASON === 'NW') {
      val.REQ_REASON = ''
    }
  })

  console.log('조회된 데이터', res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//*****************************************조회 영역(종료)***********************************************************/
//*******************************************저장 영역***********************************************************/
//확정 전 유효성 검사
const beforeSave = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedRows.length === 0) {
    Message.warn(t('확정할 데이터를 선택해 주세요.'))

    return false
  }
  for (let i = 0; i < checkedRows.length; i++) {
    if (
      grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).STATUS === '20'
    ) {
      Message.warn(t('이미 확정된 데이터 입니다.'))

      return false
    }
  }

  return true
}

//확정
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedRows.length; i++) {
    saveParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    saveParams[i].USER_ID = userStore.userId
  }

  return commonExecuteApi({ queryId: 'EDUBA0040_SAVE_01', list: saveParams })
}

//확정 후
const afterSave = () => {
  let INSERT_USER_EMAIL = []
  let checkedData = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedRows.length; i++) {
    checkedData.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    checkedData[i].USER_ID = userStore.userId
    checkedData[i].REJECT_DESC = REJECT_DESC.value
    checkedData[i].ASGN_NM =
      checkedData[i].ASGN_NM === null ? '' : checkedData[i].ASGN_NM
    checkedData[i].REQ_REASON =
      checkedData[i].REQ_REASON === 'R1'
        ? '소속변경'
        : checkedData[i].REQ_REASON === 'R2'
        ? '훼손'
        : checkedData[i].REQ_REASON === 'R3'
        ? '분실'
        : ''
    checkedData[i].REQ_DT =
      checkedData[i].REQ_DT === null
        ? ''
        : dayjs(checkedData[i].REQ_DT).format('YYYY-MM-DD')
    INSERT_USER_EMAIL.push(checkedData[i].INSERT_USER_EMAIL)
  }
  INSERT_USER_EMAIL = INSERT_USER_EMAIL.filter((val, idx) => {
    return INSERT_USER_EMAIL.indexOf(val) === idx
  })
  for (let i = 0; i < INSERT_USER_EMAIL.length; i++) {
    let confirmParams = {
      EMAIL: [INSERT_USER_EMAIL[i]],
      SUBJECT: '[HiSEs] 장비자격증 재발급 신청 건 확정 처리 안내',
      CONTENT: '',
    }

    confirmParams.CONTENT += '<!doctype html>'
    confirmParams.CONTENT += '<html>'
    confirmParams.CONTENT += '<head>'
    confirmParams.CONTENT += "<meta charset='utf-8'>"
    confirmParams.CONTENT += '<title>장비자격증 재발급</title>'
    confirmParams.CONTENT += '<style>'
    confirmParams.CONTENT += "    html { font-family: '돋움'; }"
    confirmParams.CONTENT += '    table{border:1px solid #bbb; width: 1024px;}'
    confirmParams.CONTENT +=
      '    th, td {border:1px solid #bbb; border-collapse: collapse; border-spacing: 2px; padding: 5px 10px;}'
    confirmParams.CONTENT +=
      "    .text{display: block!important; color: #3c3c3c; font-family: 'HY헤드라인M'; font-size: 15px; }"
    confirmParams.CONTENT += '</style>'
    confirmParams.CONTENT += '</head>'
    confirmParams.CONTENT += '<body>'
    confirmParams.CONTENT +=
      "<p style='line-height: 30px;'> <span class='text'>HiSEs에서 신청하신 장비자격증 재발급이 확정되었으니, 현업에서 출력하시기 바랍니다. </br>"
    confirmParams.CONTENT +=
      '                              &nbsp;&nbsp;&nbsp;&nbsp;※ 관련문의: 안전문화과 정경동 책임(3-4725)'
    confirmParams.CONTENT += '<table>'
    confirmParams.CONTENT += '    <tr>'
    confirmParams.CONTENT +=
      "        <th width='33px' bgcolor='#D3D3D3'>&nbsp;</th>"
    confirmParams.CONTENT +=
      "        <th width='200px' bgcolor='#D3D3D3'>소속</th>"
    confirmParams.CONTENT +=
      "        <th width='40px' bgcolor='#D3D3D3'>소속구분</th>"
    confirmParams.CONTENT +=
      "        <th width='76px' bgcolor='#D3D3D3'>사번</th>"
    confirmParams.CONTENT +=
      "        <th width='60px' bgcolor='#D3D3D3'>직위</th>"
    confirmParams.CONTENT +=
      "        <th width='71px' bgcolor='#D3D3D3'>성명</th>"
    confirmParams.CONTENT +=
      "        <th width='59px' bgcolor='#D3D3D3'>재직여부</th>"
    confirmParams.CONTENT +=
      "        <th width='60px' bgcolor='#D3D3D3'>재발급사유</th>"
    confirmParams.CONTENT +=
      "        <th width='80px' bgcolor='#D3D3D3'>재발급신청일</th>"
    confirmParams.CONTENT +=
      "        <th width='75px' bgcolor='#D3D3D3'>상태</th>"
    confirmParams.CONTENT +=
      "        <th width='75px' bgcolor='#D3D3D3'>비고</th>"
    confirmParams.CONTENT += '    </tr>'

    for (let j = 0; j < checkedRows.length; j++) {
      if (INSERT_USER_EMAIL[i] === checkedData[j].INSERT_USER_EMAIL) {
        let strASGN_NM = checkedData[j].ASGN_NM
        let strUSER_DIV_NM = checkedData[j].USER_DIV_NM
        let strREQ_EMP_NO = checkedData[j].REQ_EMP_NO
        let strJOB_TIT_NM = checkedData[j].JOB_TIT_NM
        let strREQ_EMP_NM = checkedData[j].REQ_EMP_NM
        let strHLD_OFFI_GBN_NM = checkedData[j].HLD_OFFI_GBN_NM
        let strREQ_REASON = checkedData[j].REQ_REASON
        let strREQ_DT = checkedData[j].REQ_DT
        let strSTATUS = '확정'
        let strREJECT_DESC = checkedData[j].REJECT_DESC

        confirmParams.CONTENT += '    <tr>'
        confirmParams.CONTENT +=
          "        <td width='33px' align='center'>" + j + 1 + '</td>'
        confirmParams.CONTENT +=
          "        <td width='200px' align='left'>" + strASGN_NM + '</td>'
        confirmParams.CONTENT +=
          "        <td width='40px' align='center'>" + strUSER_DIV_NM + '</td>'
        confirmParams.CONTENT +=
          "        <td width='76px' align='center'>" + strREQ_EMP_NO + '</td>'
        confirmParams.CONTENT +=
          "        <td width='60px' align='center'>" + strJOB_TIT_NM + '</td>'
        confirmParams.CONTENT +=
          "        <td width='71px' align='center'>" + strREQ_EMP_NM + '</td>'
        confirmParams.CONTENT +=
          "        <td width='59px' align='center'>" +
          strHLD_OFFI_GBN_NM +
          '</td>'
        confirmParams.CONTENT +=
          "        <td width='60px' align='center'>" + strREQ_REASON + '</td>'
        confirmParams.CONTENT +=
          "        <td width='80px' align='center'>" + strREQ_DT + '</td>'
        confirmParams.CONTENT +=
          "        <td width='75px' align='center'>" + strSTATUS + '</td>'
        confirmParams.CONTENT +=
          "        <td width='150px' align='left' bgcolor='#F0F8FF'>" +
          strREJECT_DESC +
          '</td>'
        confirmParams.CONTENT += '    </tr>'
      }
    }
    confirmParams.CONTENT += '</table>'
    confirmParams.CONTENT += '</body>'
    confirmParams.CONTENT += '</html>'
    commonSendApi(confirmParams).then((res) => {
      Message.success(t('메일이 전송되었습니다.'))
    })
    grdMain.value.getGridView().setAllCheck(false)
  }
  onButtonsClick({ id: 'btnSearch' })
}

//*****************************************저장 영역(종료)***********************************************************/
//********************************************반려 영역***********************************************************/

//반려 전
const popBeforeSave = () => {
  if (REJECT_DESC.value === '') {
    Message.warn(t('반려사유를 입력해 주세요.'))

    return false
  }

  return true
}

//반려
const popSaveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedRows.length; i++) {
    saveParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    saveParams[i].USER_ID = userStore.userId
    saveParams[i].REJECT_DESC = REJECT_DESC.value
  }

  return commonExecuteApi({ queryId: 'EDUBA0040_SAVE_02', list: saveParams })
}

//반려 후
const popAfterSave = () => {
  dialog.value = false

  let INSERT_USER_EMAIL = []
  let checkedData = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedRows.length; i++) {
    checkedData.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    checkedData[i].USER_ID = userStore.userId
    checkedData[i].REJECT_DESC = REJECT_DESC.value
    checkedData[i].ASGN_NM =
      checkedData[i].ASGN_NM === null ? '' : checkedData[i].ASGN_NM
    checkedData[i].REQ_REASON =
      checkedData[i].REQ_REASON === 'R1'
        ? '소속변경'
        : checkedData[i].REQ_REASON === 'R2'
        ? '훼손'
        : checkedData[i].REQ_REASON === 'R3'
        ? '분실'
        : ''
    checkedData[i].REQ_DT =
      checkedData[i].REQ_DT === null
        ? ''
        : dayjs(checkedData[i].REQ_DT).format('YYYY-MM-DD')
    INSERT_USER_EMAIL.push(checkedData[i].INSERT_USER_EMAIL)
  }
  INSERT_USER_EMAIL = INSERT_USER_EMAIL.filter((val, idx) => {
    return INSERT_USER_EMAIL.indexOf(val) === idx
  })

  for (let i = 0; i < INSERT_USER_EMAIL.length; i++) {
    let rejectParams = {
      EMAIL: [INSERT_USER_EMAIL[i]],
      SUBJECT: '[HiSEs] 장비자격증 재발급 신청 건 반려 처리 안내',
      CONTENT: '',
    }
    rejectParams.CONTENT += '<!doctype html>'
    rejectParams.CONTENT += '<html>'
    rejectParams.CONTENT += '<head>'
    rejectParams.CONTENT += "<meta charset='utf-8'>"
    rejectParams.CONTENT += '<title>기타/단기공사</title>'
    rejectParams.CONTENT += '<style>'
    rejectParams.CONTENT += "    html { font-family: '돋움'; }"
    rejectParams.CONTENT += '    table{border:1px solid #bbb; width: 1024px;}'
    rejectParams.CONTENT +=
      '    th, td {border:1px solid #bbb; border-collapse: collapse; border-spacing: 2px; padding: 5px 10px;}'
    rejectParams.CONTENT +=
      "    .text{display: block!important; color: #3c3c3c; font-family: 'HY헤드라인M'; font-size: 15px; }"
    rejectParams.CONTENT += '</style>'
    rejectParams.CONTENT += '</head>'
    rejectParams.CONTENT += '<body>'
    rejectParams.CONTENT +=
      "<p style='line-height: 30px;'> <span class='text'>HiSEs에서 신청하신 장비자격증 재발급이 아래와 같은 사유로 반려되었으니, 확인 바랍니다. </br>"
    rejectParams.CONTENT +=
      '                              &nbsp;&nbsp;&nbsp;&nbsp;※ 관련문의: 안전문화과 정경동 책임(3-4725)'
    rejectParams.CONTENT += '<table>'
    rejectParams.CONTENT += '    <tr>'
    rejectParams.CONTENT +=
      "        <th width='33px' bgcolor='#D3D3D3'>&nbsp;</th>"
    rejectParams.CONTENT +=
      "        <th width='200px' bgcolor='#D3D3D3'>소속</th>"
    rejectParams.CONTENT +=
      "        <th width='40px' bgcolor='#D3D3D3'>소속구분</th>"
    rejectParams.CONTENT +=
      "        <th width='76px' bgcolor='#D3D3D3'>사번</th>"
    rejectParams.CONTENT +=
      "        <th width='60px' bgcolor='#D3D3D3'>직위</th>"
    rejectParams.CONTENT +=
      "        <th width='71px' bgcolor='#D3D3D3'>성명</th>"
    rejectParams.CONTENT +=
      "        <th width='59px' bgcolor='#D3D3D3'>재직여부</th>"
    rejectParams.CONTENT +=
      "        <th width='60px' bgcolor='#D3D3D3'>재발급사유</th>"
    rejectParams.CONTENT +=
      "        <th width='80px' bgcolor='#D3D3D3'>재발급신청일</th>"
    rejectParams.CONTENT +=
      "        <th width='75px' bgcolor='#D3D3D3'>상태</th>"
    rejectParams.CONTENT +=
      "        <th width='150px' bgcolor='#D3D3D3'>반려사유</th>"
    rejectParams.CONTENT += '    </tr>'
    for (let j = 0; j < checkedRows.length; j++) {
      if (INSERT_USER_EMAIL[i] === checkedData[j].INSERT_USER_EMAIL) {
        let strASGN_NM = checkedData[j].ASGN_NM
        let strUSER_DIV_NM = checkedData[j].USER_DIV_NM
        let strREQ_EMP_NO = checkedData[j].REQ_EMP_NO
        let strJOB_TIT_NM = checkedData[j].JOB_TIT_NM
        let strREQ_EMP_NM = checkedData[j].REQ_EMP_NM
        let strHLD_OFFI_GBN_NM = checkedData[j].HLD_OFFI_GBN_NM
        let strREQ_REASON = checkedData[j].REQ_REASON
        let strREQ_DT = checkedData[j].REQ_DT
        let strSTATUS = '반려'
        let strREJECT_DESC = checkedData[j].REJECT_DESC

        rejectParams.CONTENT += '    <tr>'
        rejectParams.CONTENT +=
          "        <td width='33px' align='center'>" + j + 1 + '</td>'
        rejectParams.CONTENT +=
          "        <td width='200px' align='left'>" + strASGN_NM + '</td>'
        rejectParams.CONTENT +=
          "        <td width='40px' align='center'>" + strUSER_DIV_NM + '</td>'
        rejectParams.CONTENT +=
          "        <td width='76px' align='center'>" + strREQ_EMP_NO + '</td>'
        rejectParams.CONTENT +=
          "        <td width='60px' align='center'>" + strJOB_TIT_NM + '</td>'
        rejectParams.CONTENT +=
          "        <td width='71px' align='center'>" + strREQ_EMP_NM + '</td>'
        rejectParams.CONTENT +=
          "        <td width='59px' align='center'>" +
          strHLD_OFFI_GBN_NM +
          '</td>'
        rejectParams.CONTENT +=
          "        <td width='60px' align='center'>" + strREQ_REASON + '</td>'
        rejectParams.CONTENT +=
          "        <td width='80px' align='center'>" + strREQ_DT + '</td>'
        rejectParams.CONTENT +=
          "        <td width='75px' align='center'>" + strSTATUS + '</td>'
        rejectParams.CONTENT +=
          "        <td width='150px' align='left' bgcolor='#F0F8FF'>" +
          strREJECT_DESC +
          '</td>'
        rejectParams.CONTENT += '    </tr>'
      }
    }
    rejectParams.CONTENT += '    </table>'
    rejectParams.CONTENT += '  </body>'
    rejectParams.CONTENT += '</html>'
    commonSendApi(rejectParams).then((res) => {
      Message.success(t('메일이 전송되었습니다.'))
    })
  }
  REJECT_DESC.value = ''
  grdMain.value.getGridView().setAllCheck(false)
  onButtonsClick({ id: 'btnSearch' })
}

//*****************************************반려 영역(종료)***********************************************************/

onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })

  // 2024.02.07 박용훈 ozreport8.html 에서 메세지 전달 하는 내용을 받아서 다시 상위로 메세지 전달
  window.addEventListener('message', receiveMsgFromParent)
})

// 2024.02.07 박용훈 ozreport8.html 에서 메세지 전달 하는 내용을 받아서 다시 상위로 메세지 전달
const receiveMsgFromParent = (e) => {
  // 여기서 e.data.params 0=정상출력, 1=정상출력 아님
  // 정상출력일때 출력일 등록
  // 발급일자 업데이트
  let checkedData = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedRows.length; i++) {
    checkedData.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    // checkedData[i].REQ_DIV = grdMain.value
    //   .getDataProvider()
    //   .getJsonRow(checkedRows[i]).REQ_REASON
    checkedData[i].USER_ID = userStore.userId
  }
  if (e.data.params[0] === '0') {
    commonExecuteApi({ queryId: 'EDUBA0040_SAVE_03', list: checkedData }).then(
      () => {
        onButtonsClick({ id: 'btnSearch' })
      }
    )
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <vCheckbox
              class="mt-1"
              v-model="searchParams.DATE_GBN"
              false-value="N"
              true-value="Y"              
              @update:model-value="gridRefresh"
            />
            <i-input
              :label="$t('기간')"
              labelWidth="26px"
              width="213px"
              margin="10px"
              v-model="searchParams.DATE_FR"
              type="date"
              @blur="dateFrChanged"
              @update:model-value="gridRefresh"
            />
            <i-input
              :label="$t('-')"
              width="190px"
              v-model="searchParams.DATE_TO"
              type="date"
              @blur="dateToChanged"
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('사업부')"
              width="300px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('부서')"
              width="300px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('소속구분')"
              width="200px"
              v-model="searchParams.ORGN_DIV"
              :items="codeList.orgnDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh"
            />
            <!-- 진행상태 조회조건 추가로 비활성화(2024-01-25)
                <v-checkbox 
                    v-model="searchParams.STATUS"
                    label="반려 제외"
                    false-value="N"
                    true-value="Y"
                  />
                -->
          </div>
          <div class="d-flex mt-2">
            <i-select
              :label="$t('신청구분')"
              width="200px"
              v-model="searchParams.REQ_DIV"
              :items="codeList.reqDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('자격종류')"
              width="216px"
              v-model="searchParams.GBN"
              :items="codeList.gbn"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh"
            />
            <i-input
              :label="$t('사ㅤ번')"
              width="200px"
              v-model="searchParams.EMP_NO"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{[,./]}]/, '');"
              maxlength="20"
              :rules="[requiredEMP_NO]"
              @keydown.enter="() => onButtonsClick({ id: 'btnSearch' })"
              @update:model-value="gridRefresh"
            />
            <i-input
              :label="$t('성명')"
              width="200px"
              v-model="searchParams.EMP_NM"
              oninput="javascript: this.value = this.value.replace(/[0-9~!@#$%^&*()_+|<>?:{}]/, '' );"
              maxlength="500"
              :rules="[requiredEMP_NM]"
              @keydown.enter="() => onButtonsClick({ id: 'btnSearch' })"
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('진행상태')"
              width="200px"
              v-model="searchParams.STATUS"
              :items="codeList.status"
              :readonly="searchParams.REPRINT_YN === 'Y'"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh"
            />
            <v-checkbox
              v-model="searchParams.REPRINT_YN"
              true-value="Y"
              false-value="N"
              label="자격증 재출력"
              @update:model-value="changedPrintYn"
            />
          </div>
        </v-sheet>
        <div style="height: 80%">
          <!-- 메인그리드 -->
          <IGridTitle
            :button-list="[
              'btnConfirm',
              'btnTurnBack',
              'btnLicePrintForm',
              'btnLicePrint',
            ]"
            @click-button="btnMainGrd"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellButtonClicked="buttonClicked"
            @onEditRowChanged="editRowChange"
          />
        </div>
      </div>
    </v-card-text>
    <!-- OZReport -->
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="printParams"
      @close="showOz = $event"
    />
    <!-- 부서/ 협력사 팝업 -->
    <EDUBA0010Popup_01 ref="eDUBA0010Popup_01" />
    <!-- 첨부파일 관리 -->
    <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded" />
  </v-card>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="600"
    height="200"
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
      <span>반려사유</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <div class="pa-2">
        <i-input
          placeholder="반려사유를 작성해 주세요."
          width="582px"
          v-model="REJECT_DESC"
          maxlength="1000"
          counter="1000"
          max-
        />
      </div>
      <div class="pa-2">
        <IGridTitle
          :use-permission="false"
          :title="$t('')"
          :button-list="['btnTurnBack', 'btnClose']"
          @click-button="onPopButtonsClick"
        />
      </div>
    </v-card>
  </v-dialog>
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
