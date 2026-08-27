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
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import SAFDC0030_01Popup01 from './SAFDC0030_01Popup01.vue'

defineOptions({
  name: '30_safety-SAF_D-SAFDC0030',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const grdMain = ref(null)
const userStore = useUserStore()
const sAFDC0030_01_Popup01 = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  JSTOP_DATE_FR: '',
  JSTOP_DATE_TO: '',
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: '',
  RESTART_DIV: '',
})

const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
  asgnCd: [],
  restartDiv: [],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchCommonCode',
      param: {
        ALL_UP_CD: 'HHIZ000',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    getCodeList('HHIF170'),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.restartDiv = res[1].ORESULT_CUR
    
    codeList.company.unshift({ TXT: '전체', COD: '' })
    codeList.restartDiv.unshift({ TXT: '전체', COD: '' })
    
    // Trigger initial watch calls
    searchParam.CMPNY_DIV = userStore.cmpnyDiv
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    { fieldName: 'JSTOP_NO', dataType: 'text' },
    { fieldName: 'JSTOP_DT', dataType: 'text' },
    { fieldName: 'JSTOP_TIME', dataType: 'text' },
    { fieldName: 'RESTART_DT', dataType: 'text' },
    { fieldName: 'RESTART_TIME', dataType: 'text' },
    { fieldName: 'RESTART_DIV_NM', dataType: 'text' },
    { fieldName: 'ASGN_NM', dataType: 'text' },
    { fieldName: 'CHG_EMP_NM', dataType: 'text' },
    { fieldName: 'WORKER_CNT', dataType: 'text' },
    { fieldName: 'JSTOP_DESC', dataType: 'text' },
    { fieldName: 'STOP_IMG_YN', dataType: 'text' },
    { fieldName: 'STOP_FILE_YN', dataType: 'text' },
    { fieldName: 'RESTART_DESC', dataType: 'text' },
    { fieldName: 'ACT_IMG_YN', dataType: 'text' },
    { fieldName: 'ACT_FILE_YN', dataType: 'text' },
    { fieldName: 'JOB_SPLC_NM', dataType: 'text' },
    { fieldName: 'JOB_PLC_DESC', dataType: 'text' },
    { fieldName: 'SHIP_NO', dataType: 'text' },
    { fieldName: 'LOSS_TIME', dataType: 'text' },
    { fieldName: 'FILE_ID', dataType: 'text' },
    { fieldName: 'FILE_ID2', dataType: 'text' },
  ],
  columns: [
    { name: 'JSTOP_DT', fieldName: 'JSTOP_DT', width: 120, header: { text: t('중지일자') } },
    { name: 'JSTOP_TIME', fieldName: 'JSTOP_TIME', width: 100, header: { text: t('중지시간') } },
    { name: 'RESTART_DT', fieldName: 'RESTART_DT', width: 120, header: { text: t('재개일자') } },
    { name: 'RESTART_TIME', fieldName: 'RESTART_TIME', width: 100, header: { text: t('재개시간') } },
    { name: 'RESTART_DIV_NM', fieldName: 'RESTART_DIV_NM', width: 150, header: { text: t('진행상태') } },
    { name: 'ASGN_NM', fieldName: 'ASGN_NM', width: 250, header: { text: t('작업담당소속') } },
    { name: 'CHG_EMP_NM', fieldName: 'CHG_EMP_NM', width: 120, header: { text: t('작업담당자') } },
    { name: 'WORKER_CNT', fieldName: 'WORKER_CNT', width: 80, header: { text: t('인원') } },
    { name: 'JSTOP_DESC', fieldName: 'JSTOP_DESC', width: 350, header: { text: t('중지사유') } },
    { name: 'STOP_IMG_YN', fieldName: 'STOP_IMG_YN', width: 60, header: { text: t('사진') } },
    { name: 'STOP_FILE_YN', fieldName: 'STOP_FILE_YN', width: 60, header: { text: t('자료') } },
    { name: 'RESTART_DESC', fieldName: 'RESTART_DESC', width: 350, header: { text: t('조치결과') } },
    { name: 'ACT_IMG_YN', fieldName: 'ACT_IMG_YN', width: 60, header: { text: t('사진') } },
    { name: 'ACT_FILE_YN', fieldName: 'ACT_FILE_YN', width: 60, header: { text: t('자료') } },
    { name: 'JOB_SPLC_NM', fieldName: 'JOB_SPLC_NM', width: 150, header: { text: t('장소') } },
    { name: 'JOB_PLC_DESC', fieldName: 'JOB_PLC_DESC', width: 200, header: { text: t('장소상세') } },
    { name: 'SHIP_NO', fieldName: 'SHIP_NO', width: 150, header: { text: t('호선/프로젝트No.') } },
    { name: 'LOSS_TIME', fieldName: 'LOSS_TIME', width: 120, header: { text: t('시간손실') } },
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
            'JSTOP_DT',
            'JSTOP_TIME',
            'RESTART_DT',
            'RESTART_TIME',
            'RESTART_DIV_NM',
          ]
        },
        {
          name: 'Row2',
          direction: 'horizontal',
          header: { visible: false },
          items: [
            'ASGN_NM',
            'CHG_EMP_NM',
            'WORKER_CNT',
            'JSTOP_DESC',
            {
              name: 'StopGroup',
              direction: 'horizontal',
              items: ['STOP_IMG_YN', 'STOP_FILE_YN'],
              header: { text: t('중지') }
            }
          ]
        },
        {
          name: 'Row3',
          direction: 'horizontal',
          header: { visible: false },
          items: [
            'RESTART_DESC',
            {
              name: 'ActGroup',
              direction: 'horizontal',
              items: ['ACT_IMG_YN', 'ACT_FILE_YN'],
              header: { text: t('조치') }
            },
            'JOB_SPLC_NM',
            'JOB_PLC_DESC',
            'SHIP_NO',
          ]
        },
        {
          name: 'Row4',
          direction: 'horizontal',
          header: { visible: false },
          items: [
            'LOSS_TIME',
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
  sAFDC0030_01_Popup01.value.openPopup()
}

const onDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return
  }

  new deleteFlowHelper(vm, t)
    .setBefore(() => true)
    .setQuery(deleteData)
    .setAfter(() => {
      Message.success(t('삭제되었습니다.'))
      onSearch()
    })
    .run()
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    deleteParam.push({
      CMPNY_DIV: data.CMPNY_DIV,
      JSTOP_NO: data.JSTOP_NO,
      COMPANY: data.CMPNY_DIV,
    })
  }

  return commonExecuteApi({
    queryId: 'SAFDC0010_DELETE05',
    list: deleteParam,
  })
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_13',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  let list = res.ORESULT_CUR || []
  list.forEach(row => {
    row.STOP_IMG_YN = row.FILE_ID ? 'Y' : 'N'
    row.STOP_FILE_YN = row.FILE_ID ? 'Y' : 'N'
    row.ACT_IMG_YN = row.FILE_ID2 ? 'Y' : 'N'
    row.ACT_FILE_YN = row.FILE_ID2 ? 'Y' : 'N'
    row.LOSS_TIME = row.LOSS_TIME || '-'
  })
  grdMain.value.getDataProvider().setRows(list)
}

const defaultDate = () => {
  let date = dayjs()
  let dateFrom = dayjs().subtract(7, 'day')
  searchParam.JSTOP_DATE_FR = dateFrom.format('YYYY-MM-DD')
  searchParam.JSTOP_DATE_TO = date.format('YYYY-MM-DD')
}

onMounted(() => {
  defaultDate()
  initCodeList()
  onSearch()
})

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFDC0030_01_Popup01.value.openPopup2(data)
}

const closedPopup = () => {
  onSearch()
}

// 대상조직 연동
watch(
  () => searchParam.CMPNY_DIV,
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
      param: { CMPNY_DIV: searchParam.CMPNY_DIV, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)
watch(
  () => searchParam.DEPT_CD,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchTeam',
      param: { CMPNY_DIV: searchParam.CMPNY_DIV, BSNS_CD: searchParam.BSNS_CD, DEPT_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.ASGN_CD = ''
      codeList.asgnCd = res.ORESULT_CUR
      codeList.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    })
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- Header with Title and Actions aligned -->
    <div class="d-flex align-center justify-space-between border-b bg-white px-4 py-2">
      <div class="font-weight-bold text-h6">작업중지 등록/현황</div>
      <div class="d-flex gap-2">
        <v-btn color="primary" size="small" @click="onSearch" class="font-weight-bold">조회</v-btn>
        <v-btn color="primary" size="small" @click="onRegister" class="font-weight-bold">등록</v-btn>
        <v-btn color="error" size="small" @click="onDelete" class="font-weight-bold">삭제</v-btn>
      </div>
    </div>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        
        <!-- Search Conditions Section -->
        <v-sheet class="searchArea pa-4 bg-lightgrey mt-2 mb-2 rounded-5">
          <div class="sheetTitle mb-2">{{ $t('조회조건') }}</div>
          
          <div class="d-flex mb-3 align-center flex-wrap gap-4">
            <!-- 일자 -->
            <div class="d-flex align-center">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('일자') }}</span>
              <i-input
                width="140px"
                type="date"
                v-model="searchParam.JSTOP_DATE_FR"
                hide-details
              ></i-input>
              <span class="mx-1">~</span>
              <i-input
                width="140px"
                type="date"
                v-model="searchParam.JSTOP_DATE_TO"
                hide-details
              ></i-input>
            </div>

            <!-- 대상조직 -->
            <div class="d-flex align-center flex-wrap">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('대상조직') }}</span>
              <i-select
                width="150px"
                item-title="TXT"
                item-value="COD"
                :items="codeList.company"
                v-model="searchParam.CMPNY_DIV"
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

            <!-- 조치구분 -->
            <div class="d-flex align-center">
              <span class="mr-2 font-weight-bold text-body-2">{{ $t('조치구분') }}</span>
              <i-select
                width="150px"
                item-title="TXT"
                item-value="COD"
                :items="codeList.restartDiv"
                v-model="searchParam.RESTART_DIV"
                hide-details
              ></i-select>
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

  <SAFDC0030_01Popup01
    ref="sAFDC0030_01_Popup01"
    @closed="closedPopup"
  ></SAFDC0030_01Popup01>
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

