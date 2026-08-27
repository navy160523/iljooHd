<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import SAFDC0020_01Popup01 from './SAFDC0020_01Popup01.vue'

defineOptions({
  name: '30_safety-SAF_D-SAFDC0020',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const grdMain = ref(null)
const userStore = useUserStore()
const sAFDC0020_01_Popup01 = ref(null)
const safetyChkEmpPopup = ref(null)

const tab = ref('muniReg') // 'muniReg' (시정통보등록), 'muniClose' (시정통보종결처리)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  TYPE: 'A',
  ACT_YN: '',
  ACT_EMP_NO: '',
  GUBUN: 'A',
  NOTI_CHK: 'Y',
  NOTI_FROM: '',
  NOTI_TO: '',
  SEND_DEPT_CD: '',
  SEND_BSNS_CD: 'AN00',
  REC_BSNS_CD: userStore.bsnsCd,
  REC_DEPT_CD: userStore.deptCd,
  REC_ASGN_CD: '',
  SEND_ASGN_CD: '',
  SUBJECT_CD: '',
  REQ_REPLY_CHK: 'Y',
  REQ_REPLY_FROM: '',
  REQ_REPLY_TO: '',
  SAGO_DIV_M: '',
  STATUS: '',
  CHK_EMP_NM: '',
  CHK_EMP_NO: '',
})

const codeList = reactive({
  SEND_BSNS_CD: [],
  SEND_DEPT_CD: [],
  SEND_ASGN_CD: [],
  REC_BSNS_CD: [],
  REC_DEPT_CD: [],
  REC_ASGN_CD: [],
  STATUS: [],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    getCodeList('HHIF190'),
  ]).then((res) => {
    codeList.SEND_BSNS_CD = res[0].ORESULT_CUR
    codeList.REC_BSNS_CD = res[0].ORESULT_CUR
    codeList.STATUS = res[1].ORESULT_CUR
    
    codeList.SEND_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.REC_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.STATUS.unshift({ TXT: '전체', COD: '' })
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    { fieldName: 'MNG_NO', dataType: 'text' },
    { fieldName: 'SEND_ASGN_NM', dataType: 'text' },
    { fieldName: 'REC_ASGN_NM', dataType: 'text' },
    { fieldName: 'PROBLEM_DESC', dataType: 'text' },
    { fieldName: 'NOTI_DT', dataType: 'text' },
    { fieldName: 'REQ_REPLY_DT', dataType: 'text' },
    { fieldName: 'STATUS_NM', dataType: 'text' },
    { fieldName: 'ACT_DT', dataType: 'text' },
    { fieldName: 'CHK_EMP_NM', dataType: 'text' },
    { fieldName: 'SHIP_NO', dataType: 'text' },
    { fieldName: 'LOCATION_NM', dataType: 'text' },
    { fieldName: 'NOTI_PLC_DESC', dataType: 'text' },
    { fieldName: 'NOTI_IMG_YN', dataType: 'text' },
    { fieldName: 'NOTI_FILE_YN', dataType: 'text' },
    { fieldName: 'ACT_RSLT', dataType: 'text' },
    { fieldName: 'ACT_IMG_YN', dataType: 'text' },
    { fieldName: 'ACT_FILE_YN', dataType: 'text' },
    { fieldName: 'ACT_DT_2', dataType: 'text' },
    { fieldName: 'APP_EMP_NO', dataType: 'text' },
  ],
  columns: [
    { name: 'NOTI_DT', fieldName: 'NOTI_DT', width: 100, header: { text: t('점검일자') } },
    { name: 'REQ_REPLY_DT', fieldName: 'REQ_REPLY_DT', width: 100, header: { text: t('회신요구일') } },
    { name: 'STATUS_NM', fieldName: 'STATUS_NM', width: 150, header: { text: t('진행상태') } },
    { name: 'ACT_DT', fieldName: 'ACT_DT', width: 100, header: { text: t('조치일자') } },
    { name: 'REC_ASGN_NM', fieldName: 'REC_ASGN_NM', width: 200, header: { text: t('수신조직') } },
    { name: 'PROBLEM_DESC', fieldName: 'PROBLEM_DESC', width: 350, header: { text: t('문제점') } },
    { name: 'LOCATION_NM', fieldName: 'LOCATION_NM', width: 120, header: { text: t('장소') } },
    { name: 'NOTI_PLC_DESC', fieldName: 'NOTI_PLC_DESC', width: 200, header: { text: t('장소상세') } },
    { name: 'SHIP_NO', fieldName: 'SHIP_NO', width: 120, header: { text: t('호선/프로젝트No.') } },
    { name: 'NOTI_IMG_YN', fieldName: 'NOTI_IMG_YN', width: 50, header: { text: t('사진') } },
    { name: 'NOTI_FILE_YN', fieldName: 'NOTI_FILE_YN', width: 50, header: { text: t('자료') } },
    { name: 'ACT_RSLT', fieldName: 'ACT_RSLT', width: 300, header: { text: t('조치결과') } },
    { name: 'ACT_IMG_YN', fieldName: 'ACT_IMG_YN', width: 50, header: { text: t('사진') } },
    { name: 'ACT_FILE_YN', fieldName: 'ACT_FILE_YN', width: 50, header: { text: t('자료') } },
    { name: 'SEND_ASGN_NM', fieldName: 'SEND_ASGN_NM', width: 200, header: { text: t('발신조직') } },
    { name: 'CHK_EMP_NM', fieldName: 'CHK_EMP_NM', width: 100, header: { text: t('단속자') } },
    { name: 'ACT_DT_2', fieldName: 'ACT_DT_2', width: 100, header: { text: t('조치일자') } },
  ],
  columnLayout: [
    {
      name: 'MainLayoutGroup',
      direction: 'vertical',
      header: { visible: false },
      items: [
        {
          name: 'Row1',
          direction: 'horizontal',
          header: { visible: false },
          items: [
            'NOTI_DT',
            'REQ_REPLY_DT',
            'STATUS_NM',
            'ACT_DT',
          ]
        },
        {
          name: 'Row2',
          direction: 'horizontal',
          header: { visible: false },
          items: [
            'REC_ASGN_NM',
            'PROBLEM_DESC',
          ]
        },
        {
          name: 'Row3',
          direction: 'horizontal',
          header: { visible: false },
          items: [
            'LOCATION_NM',
            'NOTI_PLC_DESC',
            'SHIP_NO',
            {
              name: 'VioGroup',
              direction: 'horizontal',
              items: ['NOTI_IMG_YN', 'NOTI_FILE_YN'],
              header: { text: t('위반') }
            },
            'ACT_RSLT',
            {
              name: 'ActGroup',
              direction: 'horizontal',
              items: ['ACT_IMG_YN', 'ACT_FILE_YN'],
              header: { text: t('조치') }
            }
          ]
        },
        {
          name: 'Row4',
          direction: 'horizontal',
          header: { visible: false },
          items: [
            'SEND_ASGN_NM',
            'CHK_EMP_NM',
            'ACT_DT_2',
          ]
        }
      ]
    }
  ]
})

const onGridLoaded = () => {
  if (grdMain.value && grdMain.value.getGridView()) {
    grdMain.value.getGridView().displayOptions.rowHeight = 120
  }
}

const onSearch = () => {
  new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
}

const onRegister = () => {
  sAFDC0020_01_Popup01.value.openPopup()
}

const onApproval = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('승인 신청할 데이터를 선택해주세요.'))
    return
  }
  
  let list = []
  let day = dayjs()
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (!data.APP_EMP_NO) {
      Message.warn(t(`관리번호 ${data.MNG_NO} 건은 승인자가 지정되지 않았습니다.`))
      return
    }
    list.push({
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: day.format('YYYY'),
      APPROVE_ID: 'SAFDC0020_' + userStore.userId + '_' + day.format('YYYYMMDDHHmmss') + '_' + i,
      FORM_ID: 'SAFDC0020',
      APP_EMP_NO: data.APP_EMP_NO,
      APPROVE_GBN: 'I',
      APP_REQ_EMP_NO: userStore.userId,
      APP_STATUS: 'N',
      PATH: '/30_safety/SAF_D/SAFDC0020',
      USER_ID: userStore.userId,
      MNG_NO: data.MNG_NO,
    })
  }

  commonExecuteApi({
    queryId: 'OPRAB0010_SAVE_01',
    list: list,
  }).then(() => {
    Message.success(t('승인신청 되었습니다.'))
    onSearch()
  })
}

const onCancelApproval = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('승인 취소할 데이터를 선택해주세요.'))
    return
  }
  
  let list = []
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    list.push({
      CMPNY_DIV: userStore.cmpnyDiv,
      VIO_NO: data.MNG_NO,
      MNG_NO: data.MNG_NO,
      USER_ID: userStore.userId,
    })
  }

  commonExecuteApi({
    queryId: 'SAFDC0010_CANCEL01',
    list: list,
  }).then(() => {
    Message.success(t('결재 신청이 취소되었습니다.'))
    onSearch()
  })
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_14',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  let list = res.ORESULT_CUR || []
  list.forEach(row => {
    row.ACT_DT_2 = row.ACT_DT
    row.NOTI_IMG_YN = row.NOTI_SCAN ? 'Y' : 'N'
    row.NOTI_FILE_YN = row.NOTI_SCAN ? 'Y' : 'N'
    row.ACT_IMG_YN = row.ACT_RSLT_SCAN ? 'Y' : 'N'
    row.ACT_FILE_YN = row.ACT_RSLT_SCAN ? 'Y' : 'N'
  })
  grdMain.value.getDataProvider().setRows(list)
}

const openSafetyChkEmpPopup = () => {
  safetyChkEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    readonly: true,
  })
}
const selectedSafetyChkEmp = (val) => {
  searchParam.CHK_EMP_NM = val.EMP_NM
  searchParam.CHK_EMP_NO = val.EMP_NO
}

const defaultDate = () => {
  let date = dayjs()
  let dateFrom = dayjs().subtract(7, 'day')
  searchParam.NOTI_FROM = dateFrom.format('YYYY-MM-DD')
  searchParam.NOTI_TO = date.format('YYYY-MM-DD')
  searchParam.REQ_REPLY_FROM = dateFrom.format('YYYY-MM-DD')
  searchParam.REQ_REPLY_TO = date.format('YYYY-MM-DD')
}

onMounted(() => {
  defaultDate()
  initCodeList()
  onSearch()
})

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFDC0020_01_Popup01.value.openPopup2(data)
}

const closedPopup = () => {
  onSearch()
}

// 수신조직 연동
watch(
  () => searchParam.REC_BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.REC_DEPT_CD = ''
      codeList.REC_DEPT_CD = res.ORESULT_CUR
      codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  },
  { immediate: true }
)
watch(
  () => searchParam.REC_DEPT_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchTeam',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.REC_BSNS_CD, DEPT_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.REC_ASGN_CD = ''
      codeList.REC_ASGN_CD = res.ORESULT_CUR
      codeList.REC_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    })
  },
  { immediate: true }
)

// 발신조직 연동
watch(
  () => searchParam.SEND_BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.SEND_DEPT_CD = ''
      codeList.SEND_DEPT_CD = res.ORESULT_CUR
      codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  },
  { immediate: true }
)
watch(
  () => searchParam.SEND_DEPT_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchTeam',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.SEND_BSNS_CD, DEPT_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.SEND_ASGN_CD = ''
      codeList.SEND_ASGN_CD = res.ORESULT_CUR
      codeList.SEND_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    })
  },
  { immediate: true }
)

watch(tab, (newTab) => {
  if (newTab === 'muniReg') {
    searchParam.STATUS = ''
  } else if (newTab === 'muniClose') {
    searchParam.STATUS = '40' // 조치완료만 표시
  }
  onSearch()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- Header with Tabs and Actions aligned -->
    <div class="d-flex align-center justify-space-between border-b bg-white">
      <v-tabs v-model="tab" color="primary" class="tabs-area">
        <v-tab value="muniReg" class="font-weight-bold">시정통보등록</v-tab>
        <v-tab value="muniClose" class="font-weight-bold">시정통보종결처리</v-tab>
      </v-tabs>
      <div class="d-flex gap-2 py-2 pr-4 align-center">
        <v-btn color="primary" size="small" @click="onSearch" class="font-weight-bold">조회</v-btn>
        <v-btn color="primary" size="small" @click="onRegister" class="font-weight-bold">등록</v-btn>
        <v-btn color="primary" size="small" @click="onApproval" class="font-weight-bold">승인</v-btn>
        <v-btn color="primary" size="small" @click="onCancelApproval" class="font-weight-bold">승인취소</v-btn>
      </div>
    </div>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        
        <!-- Search Conditions Section -->
        <v-sheet class="searchArea pa-4 bg-lightgrey mt-2 mb-2 rounded-5">
          <div class="sheetTitle mb-2">{{ $t('조회조건') }}</div>
          
          <!-- First Row -->
          <div class="d-flex mb-3 align-center flex-wrap gap-4">
            <div class="d-flex align-center">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('일자') }}</span>
              <i-input
                width="140px"
                type="date"
                v-model="searchParam.NOTI_FROM"
                hide-details
              ></i-input>
              <span class="mx-1">~</span>
              <i-input
                width="140px"
                type="date"
                v-model="searchParam.NOTI_TO"
                hide-details
              ></i-input>
            </div>

            <div class="d-flex align-center flex-wrap">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('수신조직') }}</span>
              <i-select
                width="150px"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                :items="codeList.REC_BSNS_CD"
                v-model="searchParam.REC_BSNS_CD"
                hide-details
                class="mr-1"
              ></i-select>
              <i-select
                width="150px"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                :items="codeList.REC_DEPT_CD"
                v-model="searchParam.REC_DEPT_CD"
                hide-details
                class="mr-1"
              ></i-select>
              <i-select
                width="150px"
                item-title="ASGN_NM"
                item-value="ASGN_CD"
                :items="codeList.REC_ASGN_CD"
                v-model="searchParam.REC_ASGN_CD"
                hide-details
              ></i-select>
            </div>
          </div>

          <!-- Second Row -->
          <div class="d-flex align-center flex-wrap gap-4">
            <div class="d-flex align-center flex-wrap">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('발신조직') }}</span>
              <i-select
                width="150px"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                :items="codeList.SEND_BSNS_CD"
                v-model="searchParam.SEND_BSNS_CD"
                hide-details
                class="mr-1"
              ></i-select>
              <i-select
                width="150px"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                :items="codeList.SEND_DEPT_CD"
                v-model="searchParam.SEND_DEPT_CD"
                hide-details
                class="mr-1"
              ></i-select>
              <i-select
                width="150px"
                item-title="ASGN_NM"
                item-value="ASGN_CD"
                :items="codeList.SEND_ASGN_CD"
                v-model="searchParam.SEND_ASGN_CD"
                hide-details
              ></i-select>
            </div>

            <div class="d-flex align-center">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('진행상태') }}</span>
              <i-select
                width="150px"
                item-title="TXT"
                item-value="COD"
                :items="codeList.STATUS"
                v-model="searchParam.STATUS"
                hide-details
              ></i-select>
            </div>

            <div class="d-flex align-center">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('점검자') }}</span>
              <i-input
                width="150px"
                v-model="searchParam.CHK_EMP_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openSafetyChkEmpPopup"
                hide-details
              ></i-input>
            </div>
          </div>
        </v-sheet>

        <!-- Grid Header and Table Section -->
        <div class="sheetTitle mb-2 mt-2 px-1">{{ $t('그리드헤더') }}</div>
        <v-sheet style="height: -webkit-fill-available">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @loaded="onGridLoaded"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>

      </div>
    </v-card-text>
  </v-card>

  <SAFDC0020_01Popup01
    ref="sAFDC0020_01_Popup01"
    @closed="closedPopup"
  ></SAFDC0020_01Popup01>

  <EmpPopup ref="safetyChkEmpPopup" @selected="selectedSafetyChkEmp"></EmpPopup>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 120px);
  overflow-y: auto;
  > div {
    min-height: 500px;
  }
}
.sheetTitle {
  font-size: 14px;
  font-weight: bold;
  border-bottom: 2px solid #1a237e;
  padding-bottom: 4px;
}
.bg-lightgrey {
  background-color: #f5f5f5 !important;
}
.border-b {
  border-bottom: 1px solid #e0e0e0;
}
.gap-2 {
  gap: 8px;
}
.gap-4 {
  gap: 16px;
}
</style>



