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
import SAFDC0010_01Popup01 from './SAFDC0010_01Popup01.vue'

defineOptions({
  name: '30_safety-SAF_D-SAFDC0010',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const grdMain = ref(null)
const userStore = useUserStore()
const sAFDC0010Popup01 = ref(null)
const safetyDansokEmpPopup = ref(null)

const tab = ref('vioReg') // 'vioReg' (수칙위반등록), 'vioApp' (수칙위반승인)

const searchField = reactive({
  PAST_ORG: 'N',
  CHK_DAY: 'Y',
})

const searchParam = reactive({
  VIO_DATE_FR: '',
  VIO_DATE_TO: '',
  COMPANY: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: '',
  VIO_GDIV: '',
  CMPNY_DIV: userStore.cmpnyDiv,
  DANSOK_BSNS_CD: '',
  DANSOK_ASGN_CD: '',
  DANSOK_EMP_NM: '',
  DANSOK_EMP_NO: '',
  STATUS: '',
})

const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
  dansokCompany: [],
  dansokBsnsCd: [],
  dansokDeptCd: [],
  gubun: [],
  status: [],
})

const initCodeList = async () => {
  await Promise.all([
    commonSearchApi({
      queryId: 'searchCommonCode',
      param: {
        ALL_UP_CD: 'HHIZ000',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    getCodeList('HHIF110'),
    getCodeList('HHIF180'),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR.slice()
    codeList.dansokCompany = res[0].ORESULT_CUR
    codeList.gubun = res[1].ORESULT_CUR.filter((x) => !x.COD.includes('S'))
    codeList.status = res[2].ORESULT_CUR
    
    codeList.company.unshift({ TXT: '전체', COD: '' })
    codeList.dansokCompany.unshift({ TXT: '전체', COD: '' })
    codeList.gubun.unshift({ TXT: '전체', COD: '' })
    
    // Trigger initial watch calls
    searchParam.COMPANY = userStore.cmpnyDiv
    searchParam.CMPNY_DIV = userStore.cmpnyDiv
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    { fieldName: 'VIO_NO', dataType: 'text' },
    { fieldName: 'VIO_TIME_DS', dataType: 'text' },
    { fieldName: 'STATUS_NM', dataType: 'text' },
    { fieldName: 'IO_DIV_NM', dataType: 'text' },
    { fieldName: 'BSNS_NM', dataType: 'text' },
    { fieldName: 'DEPT_NM', dataType: 'text' },
    { fieldName: 'DTL_ASGN_NM', dataType: 'text' },
    { fieldName: 'VIOLATOR', dataType: 'text' },
    { fieldName: 'ACT_DIV_NM', dataType: 'text' },
    { fieldName: 'VIO_GDIV_NM', dataType: 'text' },
    { fieldName: 'VIO_MDIV_NM', dataType: 'text' },
    { fieldName: 'VIO_DESC', dataType: 'text' },
    { fieldName: 'VIO_SPLC_NM', dataType: 'text' },
    { fieldName: 'VIO_PLC_DESC', dataType: 'text' },
    { fieldName: 'SHIP_NO', dataType: 'text' },
    { fieldName: 'VIO_IMG_YN', dataType: 'text' },
    { fieldName: 'VIO_FILE_YN', dataType: 'text' },
    { fieldName: 'ACT_RSLT', dataType: 'text' },
    { fieldName: 'ACT_IMG_YN', dataType: 'text' },
    { fieldName: 'ACT_FILE_YN', dataType: 'text' },
    { fieldName: 'DANSOK_ASGN_NM', dataType: 'text' },
    { fieldName: 'ACT_DT', dataType: 'text' },
    { fieldName: 'VEHICLE_DIV_NM', dataType: 'text' },
    { fieldName: 'SPEED', dataType: 'text' },
    { fieldName: 'OUT_VEND_NM', dataType: 'text' },
    { fieldName: 'EDU_YN', dataType: 'text' },
    { fieldName: 'GEN_VIO_CNT_EDU', dataType: 'text' },
    { fieldName: 'TRAFFIC_VIO_CNT', dataType: 'text' },
  ],
  columns: [
    { name: 'VIO_TIME_DS', fieldName: 'VIO_TIME_DS', width: 120, header: { text: t('위반일시') } },
    { name: 'STATUS_NM', fieldName: 'STATUS_NM', width: 100, header: { text: t('진행상태') } },
    { name: 'IO_DIV_NM', fieldName: 'IO_DIV_NM', width: 100, header: { text: t('소속구분') } },
    { name: 'BSNS_NM', fieldName: 'BSNS_NM', width: 120, header: { text: t('사업부') } },
    { name: 'DEPT_NM', fieldName: 'DEPT_NM', width: 120, header: { text: t('부서') } },
    { name: 'DTL_ASGN_NM', fieldName: 'DTL_ASGN_NM', width: 150, header: { text: t('상세소속') } },
    { name: 'VIOLATOR', fieldName: 'VIOLATOR', width: 100, header: { text: t('성명') } },
    { name: 'ACT_DIV_NM', fieldName: 'ACT_DIV_NM', width: 100, header: { text: t('조치구분') } },
    { name: 'VIO_GDIV_NM', fieldName: 'VIO_GDIV_NM', width: 120, header: { text: t('위반구분') } },
    { name: 'VIO_MDIV_NM', fieldName: 'VIO_MDIV_NM', width: 150, header: { text: t('위반항목') } },
    { name: 'VIO_DESC', fieldName: 'VIO_DESC', width: 350, header: { text: t('위반내용') } },
    { name: 'VIO_SPLC_NM', fieldName: 'VIO_SPLC_NM', width: 120, header: { text: t('위반장소') } },
    { name: 'VIO_PLC_DESC', fieldName: 'VIO_PLC_DESC', width: 200, header: { text: t('위반장소상세') } },
    { name: 'SHIP_NO', fieldName: 'SHIP_NO', width: 120, header: { text: t('호선/프로젝트No.') } },
    { name: 'VIO_IMG_YN', fieldName: 'VIO_IMG_YN', width: 50, header: { text: t('사진') } },
    { name: 'VIO_FILE_YN', fieldName: 'VIO_FILE_YN', width: 50, header: { text: t('자료') } },
    { name: 'ACT_RSLT', fieldName: 'ACT_RSLT', width: 300, header: { text: t('조치결과') } },
    { name: 'ACT_IMG_YN', fieldName: 'ACT_IMG_YN', width: 50, header: { text: t('사진') } },
    { name: 'ACT_FILE_YN', fieldName: 'ACT_FILE_YN', width: 50, header: { text: t('자료') } },
    { name: 'DANSOK_ASGN_NM', fieldName: 'DANSOK_ASGN_NM', width: 200, header: { text: t('단속자조직') } },
    { name: 'ACT_DT', fieldName: 'ACT_DT', width: 100, header: { text: t('조치일자') } },
    { name: 'VEHICLE_DIV_NM', fieldName: 'VEHICLE_DIV_NM', width: 100, header: { text: t('차량구분') } },
    { name: 'SPEED', fieldName: 'SPEED', width: 80, header: { text: t('속도') } },
    { name: 'OUT_VEND_NM', fieldName: 'OUT_VEND_NM', width: 150, styleName: 'pink-column', header: { text: t('사외협력사') } },
    { name: 'EDU_YN', fieldName: 'EDU_YN', width: 80, styleName: 'pink-column', header: { text: t('교육이수') } },
    { name: 'GEN_VIO_CNT_EDU', fieldName: 'GEN_VIO_CNT_EDU', width: 180, styleName: 'pink-column', header: { text: t('일반수칙 1년건수 / 교육이수') } },
    { name: 'TRAFFIC_VIO_CNT', fieldName: 'TRAFFIC_VIO_CNT', width: 150, styleName: 'pink-column', header: { text: t('교통위반 - 1년건수') } },
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
            'VIO_TIME_DS',
            'STATUS_NM',
            'IO_DIV_NM',
            'BSNS_NM',
            'DEPT_NM',
          ]
        },
        {
          name: 'Row2',
          direction: 'horizontal',
          header: { visible: false },
          items: [
            'DTL_ASGN_NM',
            'VIOLATOR',
            'ACT_DIV_NM',
            'VIO_GDIV_NM',
            'VIO_MDIV_NM',
            'VIO_DESC',
          ]
        },
        {
          name: 'Row3',
          direction: 'horizontal',
          header: { visible: false },
          items: [
            'VIO_SPLC_NM',
            'VIO_PLC_DESC',
            'SHIP_NO',
            {
              name: 'VioGroup',
              direction: 'horizontal',
              items: ['VIO_IMG_YN', 'VIO_FILE_YN'],
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
            'DANSOK_ASGN_NM',
            'ACT_DT',
            'VEHICLE_DIV_NM',
            'SPEED',
            'OUT_VEND_NM',
            'EDU_YN',
            'GEN_VIO_CNT_EDU',
            'TRAFFIC_VIO_CNT',
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
  sAFDC0010Popup01.value.openPopup()
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  let list = res.ORESULT_CUR || []
  list.forEach(row => {
    row.VIO_IMG_YN = row.FILE_ID1 ? 'Y' : 'N'
    row.VIO_FILE_YN = row.FILE_ID1 ? 'Y' : 'N'
    row.ACT_IMG_YN = row.FILE_ID2 ? 'Y' : 'N'
    row.ACT_FILE_YN = row.FILE_ID2 ? 'Y' : 'N'
    
    // Mock pink-background values
    row.OUT_VEND_NM = row.VEND_NAME || '-'
    row.EDU_YN = row.EDU_YN_A || 'N'
    row.GEN_VIO_CNT_EDU = (row.VIO_CNT_B || 0) + '건 / ' + (row.EDU_YN_B || 'N')
    row.TRAFFIC_VIO_CNT = (row.VIO_CNT_C || 0) + '건'
  })
  grdMain.value.getDataProvider().setRows(list)
}

const openDansokEmpPopup = () => {
  safetyDansokEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    readonly: true,
  })
}

const selectedDansokEmp = (val) => {
  searchParam.DANSOK_EMP_NM = val.EMP_NM
  searchParam.DANSOK_EMP_NO = val.EMP_NO
}

const defaultDate = () => {
  let date = dayjs()
  let dateFrom = dayjs().subtract(7, 'day')
  searchParam.VIO_DATE_FR = dateFrom.format('YYYY-MM-DD')
  searchParam.VIO_DATE_TO = date.format('YYYY-MM-DD')
}

onMounted(() => {
  defaultDate()
  initCodeList()
  onSearch()
})

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFDC0010Popup01.value.openPopup2(data)
}

const closedPopup = () => {
  onSearch()
}

// 위반조직 연동
watch(
  () => searchParam.COMPANY,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: newValue },
    }).then((res) => {
      searchParam.BSNS_CD = ''
      codeList.bsnsCd = res.ORESULT_CUR
      codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    })
  }
)
watch(
  () => searchParam.BSNS_CD,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: searchParam.COMPANY, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)

// 단속조직 연동
watch(
  () => searchParam.CMPNY_DIV,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: newValue },
    }).then((res) => {
      searchParam.DANSOK_BSNS_CD = ''
      codeList.dansokBsnsCd = res.ORESULT_CUR
      codeList.dansokBsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    })
  }
)
watch(
  () => searchParam.DANSOK_BSNS_CD,
  (newValue) => {
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_00',
      param: { CMPNY_DIV: searchParam.CMPNY_DIV, DANSOK_BSNS_CD: newValue },
    }).then((res) => {
      searchParam.DANSOK_ASGN_CD = ''
      codeList.dansokDeptCd = res.ORESULT_CUR
      codeList.dansokDeptCd.unshift({ DANSOK_ASGN_NM: '전체', DANSOK_ASGN_CD: '' })
    })
  }
)

watch(tab, (newTab) => {
  if (newTab === 'vioReg') {
    searchParam.STATUS = ''
  } else if (newTab === 'vioApp') {
    searchParam.STATUS = '20' // 승인대기상태
  }
  onSearch()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- Header with Tabs and Actions aligned -->
    <div class="d-flex align-center justify-space-between border-b bg-white">
      <v-tabs v-model="tab" color="primary" class="tabs-area">
        <v-tab value="vioReg" class="font-weight-bold">수칙위반등록</v-tab>
        <v-tab value="vioApp" class="font-weight-bold">수칙위반승인</v-tab>
      </v-tabs>
      <div class="d-flex gap-2 py-2 pr-4 align-center">
        <v-btn color="primary" size="small" @click="onSearch" class="font-weight-bold">조회</v-btn>
        <v-btn color="primary" size="small" @click="onRegister" class="font-weight-bold">등록</v-btn>
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
                v-model="searchParam.VIO_DATE_FR"
                hide-details
              ></i-input>
              <span class="mx-1">~</span>
              <i-input
                width="140px"
                type="date"
                v-model="searchParam.VIO_DATE_TO"
                hide-details
              ></i-input>
            </div>

            <div class="d-flex align-center flex-wrap">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('위반조직') }}</span>
              <i-select
                width="150px"
                item-title="TXT"
                item-value="COD"
                :items="codeList.company"
                v-model="searchParam.COMPANY"
                hide-details
                class="mr-1"
              ></i-select>
              <i-select
                width="150px"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                :items="codeList.bsnsCd"
                v-model="searchParam.BSNS_CD"
                hide-details
                class="mr-1"
              ></i-select>
              <i-select
                width="150px"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                :items="codeList.deptCd"
                v-model="searchParam.DEPT_CD"
                hide-details
              ></i-select>
            </div>
          </div>

          <!-- Second Row -->
          <div class="d-flex align-center flex-wrap gap-4">
            <div class="d-flex align-center flex-wrap">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('단속조직') }}</span>
              <i-select
                width="150px"
                item-title="TXT"
                item-value="COD"
                :items="codeList.dansokCompany"
                v-model="searchParam.CMPNY_DIV"
                hide-details
                class="mr-1"
              ></i-select>
              <i-select
                width="150px"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                :items="codeList.dansokBsnsCd"
                v-model="searchParam.DANSOK_BSNS_CD"
                hide-details
                class="mr-1"
              ></i-select>
              <i-select
                width="150px"
                item-title="DANSOK_ASGN_NM"
                item-value="DANSOK_ASGN_CD"
                :items="codeList.dansokDeptCd"
                v-model="searchParam.DANSOK_ASGN_CD"
                hide-details
              ></i-select>
            </div>

            <div class="d-flex align-center">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('수칙구분') }}</span>
              <i-select
                width="150px"
                item-title="TXT"
                item-value="COD"
                :items="codeList.gubun"
                v-model="searchParam.VIO_GDIV"
                hide-details
              ></i-select>
            </div>

            <div class="d-flex align-center">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('진행상태') }}</span>
              <i-select
                width="150px"
                item-title="TXT"
                item-value="COD"
                :items="codeList.status"
                v-model="searchParam.STATUS"
                hide-details
              ></i-select>
            </div>

            <div class="d-flex align-center">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('단속자') }}</span>
              <i-input
                width="150px"
                v-model="searchParam.DANSOK_EMP_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openDansokEmpPopup"
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

  <SAFDC0010_01Popup01
    ref="sAFDC0010Popup01"
    @closed="closedPopup"
  ></SAFDC0010_01Popup01>

  <EmpPopup ref="safetyDansokEmpPopup" @selected="selectedDansokEmp"></EmpPopup>
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
:deep(.pink-column) {
  background-color: #ffe5e5 !important;
}
</style>

