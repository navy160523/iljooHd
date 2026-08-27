<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import {
  commonDownloadFilesApi,
  commonBigUploadFilesApi,
} from '@hiway/api/commonFileApi'
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import IUpload from '@/components/IUpload.vue'
import { lowerCase } from 'lodash-es'
import SAFDC0010_02Tab02Popup from './SAFDC0010_02Tab02Popup.vue'
import IUploadImage from '@/components/IUploadImage.vue'
import IGridTitle from '@/components/IGridTitle.vue'
const imageUpload = ref(null)
defineOptions({
  name: '30_safety-SAF_D-SAFDC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const sAFDC0010_02_Tab02_Popup = ref(null)
const OLD_ASGN = ref('N') //과거조직 포함

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //회사구분
  TYPE: 'B',
  NOTI_CHK: 'Y', //점검일자 옆 체크박스
  NOTI_FROM: '', //점검일자 FROM
  NOTI_TO: '', //점검일자 TO
  REQ_REPLY_CHK: 'N', //회신요구일 옆 체크박스
  REQ_REPLY_FROM: '', //회신요구일 FROM
  REQ_REPLY_TO: '', //회신요구일 TO
  // BSNS_CD: userStore.bsnsCd, //사업부
  // REC_DEPT_CD: userStore.deptCd, //부서
  SEND_BSNS_CD: 'AN00',  //발신사업부
  SEND_DEPT_CD: userStore.deptCd, //발신부서
  REC_CMPNY_DIV: userStore.cmpnyDiv, //수신회사
  REC_BSNS_CD: userStore.bsnsCd, //수신사업부
  REC_DEPT_CD: '', //수신부서
  SUBJECT_CD: '',
  SAGO_DIV_M: '',
  STATUS: '', //진행상태
  ACT_YN: '',
  ACT_EMP_NO: '',
  GUBUN: 'B',
})

const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: 'Y' },
    }),
    //진행상태조회
    getCodeList('HHIF190'),
    //회사구분조회
    getCodeList('HHIZ000'),
  ]).then((res) => {
    // codeList.SEND_BSNS_CD = []
    // codeList.SEND_DEPT_CD = []
    codeList.SEND_BSNS_CD = res[0].ORESULT_CUR
    codeList.REC_BSNS_CD = res[0].ORESULT_CUR
    // codeList.SEND_DEPT_CD = res[1].ORESULT_CUR
    // codeList.REC_DEPT_CD = res[1].ORESULT_CUR
    codeList.STATUS = res[2].ORESULT_CUR
    codeList.COMPANY = res[3].ORESULT_CUR
     codeList.SEND_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    // codeList.REC_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    // codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.STATUS.unshift({ TXT: '전체', COD: '' })
    codeList.COMPANY.unshift({ TXT: '전체', COD: '' })
  })
}

const codeList = reactive({
  COMPANY: [], //회사구분
  SEND_BSNS_CD: [], //발신사업부
  SEND_DEPT_CD: [], //부서
  REC_BSNS_CD: [], //수신사업부
  REC_DEPT_CD: [], //부서
  STATUS: [], //진행상태
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'MNG_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('관리번호') },
    },
    {
      fieldName: 'SEND_ASGN_NM',
      dataType: 'text',
      width: '250',
      editable: false,
      styleName: 'left-column',
      header: { text: t('발신') },
    },
    {
      fieldName: 'REC_ASGN_NM',
      dataType: 'text',
      width: '250',
      editable: false,
      styleName: 'left-column',
      header: { text: t('수신') },
    },
    {
      fieldName: 'PROBLEM_DESC',
      dataType: 'text',
      width: '300',
      editable: false,
      styleName: 'left-column',
      header: { text: t('문제점') },
    },
    {
      fieldName: 'NOTI_DT',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('점검일자') },
    },
    {
      fieldName: 'REQ_REPLY_DT',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('회신요구일자') },
    },
    {
      fieldName: 'ACT_DT',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('회신일') },
    },
    {
      fieldName: 'STATUS_NM',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('진행상태') },
    },

    {
      fieldName: 'CHK_EMP_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('점검자') },
    },
    {
      fieldName: 'SHIP_NO',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('호선번호') },
    },
      {
      fieldName: 'ACT_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('조치자소속') },
    },
    {
      fieldName: 'COMPANY',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },

    {
      fieldName: 'REASON',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'VEND_NAME',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_LPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_MPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_SPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_SCAN',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REQUIRE_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_EMP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_TEL_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'LOCATION_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_PLC_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REC_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_TITLE',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SEND_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SEND_DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_RSLT',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_RSLT_SCAN',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_ASGN_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_EMP_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_EMP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_FACILITY_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('분야/대상설비') },
    },
    {
      fieldName: 'SAGO_DIV_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('사고유형') },
    },
    {
      fieldName: 'REJECT_DESC',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('재조치사유') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('작성자') },
    },
    {
      fieldName: 'ACT_TEL_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('조치자 연락처') },
    },
    {
      fieldName: 'SAGO_DIV_L_CODE',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_M_CODE',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_S_CODE',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_L_NM',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_M_NM',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_S_NM',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_EMP_EMAIL',
      visible: false,
      header: { text: t('') },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnMuniNotice') {
    sAFDC0010_02.value.openPopup()
  } else {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_14',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      MNG_NO: data.MNG_NO,
      REASON: '',
      USER_ID: userStore.userId,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFDC0010_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//팝업 닫혔을때 조회
const afterPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//디폴트 날짜 설정 -7일~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -7일 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(7, 'day')
  searchParam.NOTI_FROM =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.NOTI_TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')

  searchParam.REQ_REPLY_FROM =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.REQ_REPLY_TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
    
    if ( userStore.authGrpCd.includes('GRP00381') || userStore.authGrpCd.includes('GRP00369')) {
      searchParam.REC_BSNS_CD = ''
      searchParam.REC_DEPT_CD = ''
      searchParam.REQ_REPLY_CHK = 'N'
    }
}

onMounted(() => {
  defaultDate()
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

//셀 더블클릭 이벤트 관련 로직 시작
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFDC0010_02_Tab02_Popup.value.openPopup(data)
}
//셀 더블클릭 이벤트 관련 로직 끝

//팝업닫히면 재조회
const closedPoup = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//수신회사 바뀌면 사업부 가져옴 (회사변경 감지)
watch(
  () => searchParam.CMPNY_DIV,
  (newValue, oldValue) => {
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: newValue },
    }).then((res) => {
      // searchParam.BSNS_CD = ''
      // searchParam.REC_DEPT_CD = ''
      searchParam.SEND_BSNS_CD = ''
      searchParam.SEND_DEPT_CD = ''
      codeList.SEND_BSNS_CD = res.ORESULT_CUR
      codeList.SEND_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      codeList.SEND_DEPT_CD = []
      codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)

//회사 바뀌면 사업부 가져옴 (회사변경 감지)
watch(
  () => searchParam.REC_CMPNY_DIV,
  (newValue, oldValue) => {
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: newValue },
    }).then((res) => {
      // searchParam.BSNS_CD = ''
      // searchParam.REC_DEPT_CD = ''
      if (oldValue !== undefined) {
        searchParam.REC_BSNS_CD = ''
        searchParam.REC_DEPT_CD = ''
        codeList.REC_BSNS_CD = res.ORESULT_CUR
        codeList.REC_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
        codeList.REC_DEPT_CD = []
        codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
      else{
        searchParam.REC_DEPT_CD = ''
        codeList.REC_BSNS_CD = res.ORESULT_CUR
        codeList.REC_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
        codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
    })
  }
)

watch(
  () => searchParam.SEND_BSNS_CD,
  (newValue, oldValue) => {
    if (!newValue) {
      searchParam.SEND_DEPT_CD = ''
      codeList.SEND_DEPT_CD = []
      codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      return false
    }
    //사업부변경시 부서가져옴
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.SEND_DEPT_CD = ''
      codeList.SEND_DEPT_CD = res.ORESULT_CUR
      codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  },
  {
    immediate: true,
  }
)

watch(
  () => searchParam.REC_BSNS_CD,
  (newValue, oldValue) => {
    if (!newValue) {
      searchParam.REC_DEPT_CD = ''
      codeList.REC_DEPT_CD = []
      codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      return false
    }
    //사업부변경시 부서가져옴
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.REC_DEPT_CD = ''
        codeList.REC_DEPT_CD = res.ORESULT_CUR
        codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
      else{
        codeList.REC_DEPT_CD = res.ORESULT_CUR
        codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
    })
  },
  {
    immediate: true,
  }
)

//과거조직포함 변경시 부서에 과거조직까지 조회
watch(
  () => OLD_ASGN.value,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchBSNS3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        USE_DIV: newValue === 'Y' ? '' : 'Y',
      },
    }).then((res) => {
      codeList.SEND_BSNS_CD = res.ORESULT_CUR
      codeList.SEND_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      searchParam.SEND_BSNS_CD = userStore.bsnsCd

      codeList.REC_BSNS_CD = res.ORESULT_CUR
      codeList.REC_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      searchParam.REC_BSNS_CD = userStore.bsnsCd
    })
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <v-checkbox
              label="점검일자"
              class="mr-5"
              true-value="Y"
              false-value="N"
              v-model="searchParam.NOTI_CHK"
            ></v-checkbox>
            <i-input
              width="150px"
              type="date"
              class="mr-0"
              v-model="searchParam.NOTI_FROM"
            >
            </i-input>
            <span class="mt-2 mx-2">~</span>
            <i-input
              width="150px"
              type="date"
              v-model="searchParam.NOTI_TO"
            ></i-input>
            <i-select
              :items="codeList.COMPANY"
              label-width="80px"
              width="280px"
              :label="$t('발신 회사구분')"
              v-model="searchParam.CMPNY_DIV"
              item-title="TXT"
              item-value="COD"
            />
            <i-select
              :items="codeList.SEND_BSNS_CD"
              width="250px"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :label="$t('발신 사업부')"
              v-model="searchParam.SEND_BSNS_CD"
            />
            <i-select
              :items="codeList.SEND_DEPT_CD"
              width="250px"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :label="$t('부서')"
              v-model="searchParam.SEND_DEPT_CD"
            />
           
            <v-checkbox
              label="과거조직포함"
              true-value="Y"
              false-value="N"
              v-model="OLD_ASGN"
            ></v-checkbox>
          </div>
          <div class="d-flex">
            <v-checkbox
              label="회신요구일"
              class="mr-2"
              true-value="Y"
              false-value="N"
              v-model="searchParam.REQ_REPLY_CHK"
            ></v-checkbox>
            <i-input
              width="150px"
              type="date"
              class="mr-0"
              v-model="searchParam.REQ_REPLY_FROM"
            ></i-input>
            <span class="mt-2 mx-2">~</span>
             <i-input
              width="150px"
              type="date"
              v-model="searchParam.REQ_REPLY_TO"
            ></i-input>
            <i-select
              :items="codeList.COMPANY"
              width="280px"
              label-width="80px"
              :label="$t('수신 회사구분')"
              v-model="searchParam.REC_CMPNY_DIV"
              item-title="TXT"
              item-value="COD"
            />
             <i-select
              :label="$t('수신 사업부')"
              width="250px"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :items="codeList.REC_BSNS_CD"
              v-model="searchParam.REC_BSNS_CD"
            ></i-select>
            <i-select
              :label="$t('부서')"
              width="250px"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :items="codeList.REC_DEPT_CD"
              v-model="searchParam.REC_DEPT_CD"
            ></i-select>
             <i-select
              :items="codeList.STATUS"
              width="230px"
              item-title="TXT"
              item-value="COD"
              :label="$t('진행상태')"
              v-model="searchParam.STATUS"
            ></i-select>
          </div>
        </v-sheet>
        <v-sheet style="height: -webkit-fill-available">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
      <SAFDC0010_02Tab02Popup
        ref="sAFDC0010_02_Tab02_Popup"
        @closed="afterPopup"
      ></SAFDC0010_02Tab02Popup>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 345px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}
</style>
