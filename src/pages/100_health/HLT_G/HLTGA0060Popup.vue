<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IUpload from "@/components/IUpload.vue"
import { toUpper } from "lodash-es"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from '@/components/RealGrid.vue'
import { nextTick } from "vue";

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const emit = defineEmits(["selected"])
const isCreate = ref(false)
const isAdmin = ref(false)
const grdMain = ref(null)
const saveParams = reactive([]);
const allData = reactive([]);

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FRDATE: '',
  TODATE: '',
})

const openPopup = () => {
  dialog.value = true
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setBefore(searchBefore).setQuery(searchData).setAfter(afterSearch).run() 
  } else if (btn.id === "btnClose") {
    closePopup()
  } else if (btn.id === 'btnRskCopyApp') {
    onSelect()
  }
}

const searchBefore = () => {
  // console.log('FRDATE:', searchParam.FRDATE);
  // console.log('TODATE:', searchParam.TODATE);

  if(!searchParam.FRDATE || !searchParam.TODATE) {
    Message.warn(t('조회기간을 입력해주세요.'))
    return false
  }

  return true
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTGA0060_SEARCH_02',
    param: searchParam,
  })
}
const afterSearch = (res) => {
  // console.log("resssss", res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ********** 닫기 ********** */
const closePopup = () => {
  dialog.value = false
  grdMain.value.getDataProvider().setRows([])
}

const onSelect = (clickData) => {
  const chekedRow = grdMain.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  }

  const cData = chekedRow.map((rowIndex) => grdMain.value.getDataProvider().getJsonRow(rowIndex));
  // console.log("c", cData)

  emit('selected', cData)
  onButtonsClick({ id: "btnClose" })
}



const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys : [], 
  fields: [
  {
      fieldName: 'REQ_DATE',
      dataType: 'text',
      width: '140',
      editable: false,
      header: { text: t('신청일시') },  
      styleName: 'left-column',
    },
    {
      fieldName: 'DEPTID',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('변경전 부서코드') }, 
    },
    {
      fieldName: 'ZZ_DEPTNAME',
      dataType: 'text',
      width: '110',
      editable: false,
      styleName: 'left-column',
      header: { text: t('변경전 부서명') },
    },
    {
      fieldName: 'DEPTID2',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('변경후 부서코드') }, 
    },
    {
      fieldName: 'ZZ_DEPTNAME2',
      dataType: 'text',
      width: '110',
      editable: false,
      styleName: 'left-column',
      header: { text: t('변경후 부서명') }, 
    },
    {
      fieldName: 'ZZ_POSITION_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'left-column',
      header: { text: t('직위') }, 
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('사번') }, 
    },
    {
      fieldName: 'DISPLAY_NAME',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('성명') }, 
    },
    {
      fieldName: 'JOBCODE',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('변경전 직무코드') }, 
    },
    {
      fieldName: 'ZZ_JOB_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'left-column',
      header: { text: t('변경전 직무명') }, 
    },
    {
      fieldName: 'JOBCODE2',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('변경후 직무코드') }, 
    },
    {
      fieldName: 'ZZ_JOB_NM2',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'left-column',
      header: { text: t('변경후 직무명') }, 
    },
    {
      fieldName: 'ZZ_JOBCHG_STATUS',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('진행상태') }, 
    },
    {
      fieldName: 'ZZ_HEALTH_YN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('배치전 검진대상 여부') }, 
    },
    {
      fieldName: 'ZZ_HEALTH_CD',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('검진코드') }, 
    },
    {
      fieldName: 'ZZ_HEALTH_CD2',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('배치전 검진코드') }, 
    },
    {
      fieldName: 'ZZ_HEALTH_DT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('검진일자') }, 
    },{
      fieldName: 'ZZ_HEALTH_RESULT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('판정결과') }, 
    },
    {
      fieldName: 'ZZ_HEALTH_APPR_DT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('검토일자') }, 
    },
    {
      fieldName: 'ZZ_HEALTH_FACTOR',
      dataType: 'text',
      width: '400',
      editable: false,
      styleName: 'left-column',
      header: { text: t('배치전 유해인자') }, 
    },
    {
      fieldName: 'ZZ_HEALTH_RSN',
      dataType: 'text',
      width: '400',
      editable: false,
      styleName: 'left-column',
      header: { text: t('보건관리자/산업보건의 의견') }, 
    },
    {
      fieldName: 'ZZ_HEALTH_NOTE',
      dataType: 'text',
      width: '400',
      editable: false,
      styleName: 'left-column',
      header: { text: t('비고') }, 
    },
    {
      fieldName: 'ZZ_JOBCHG_DT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직무변경일자') }, 
    },
    {
      fieldName: 'TEST_DATE_LIMIT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('검진예정일자') }, 
    },
    {
      fieldName: 'MOVE_YN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('이관여부') }, 
    },
    {
      fieldName: 'TEST_IN_YEAR',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('년도') }, 
    },
    {
      fieldName: 'TEST_IN_HALF_DIV',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('구분') }, 
    },
  ],
  columns : [],
  columnLayout: [
    'REQ_DATE',
    'ZZ_DEPTNAME',
    'ZZ_DEPTNAME2',
    'ZZ_POSITION_NM',
    'EMP_NO',
    'DISPLAY_NAME',
    'ZZ_JOB_NM',
    'ZZ_JOB_NM2',
    'ZZ_JOBCHG_STATUS',
    'ZZ_HEALTH_YN',
    'ZZ_HEALTH_CD',
    'ZZ_HEALTH_CD2',
    'ZZ_HEALTH_DT',
    'ZZ_HEALTH_RESULT',
    'ZZ_HEALTH_APPR_DT',
    'ZZ_HEALTH_FACTOR',
    'ZZ_HEALTH_RSN',
    'ZZ_HEALTH_NOTE',
    'ZZ_JOBCHG_DT',
    'TEST_DATE_LIMIT',
    'MOVE_YN',
    {
      name: '검진포함',
      direction: 'horizontal',
      items: ['TEST_IN_YEAR', 'TEST_IN_HALF_DIV'],
    },
  ]
})
grdMainProps.columns = grdMainProps.fields



defineExpose({
  openPopup,
})

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true

  // 기간입력
  const today = dayjs().format('YYYY-MM-DD');
  // 한 달 전 날짜
  const monthAgo = dayjs().subtract(12, 'month').format('YYYY-MM-DD');
  const monthAgo2 = dayjs().subtract(48, 'month').format('YYYY-MM-DD');

  const year = dayjs().year();
  const yearStart = dayjs(`${year-2}-01-01`).format('YYYY-MM-DD');
  const yearCustomEnd = dayjs(`${year}-12-13`).format('YYYY-MM-DD');

  // searchParam.FRDATE = monthAgo;
  searchParam.FRDATE = yearStart;
  searchParam.TODATE = yearCustomEnd;
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1500"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>배치 후 검진대상자</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2 d-flex justify-space-between">
        <div class="d-flex">
          <i-input
            :label="$t('검진일')"
            type="date"
            width="200px"
            v-model="searchParam.FRDATE"
          >
          </i-input>
          <span class="mt-1 mr-1">~</span>
          <i-input
            class="ml-3"
            type="date"
            width="160px"
            v-model="searchParam.TODATE"
          >
          </i-input>
        </div>

        <IGridTitle
          ref="menuTitle"
          :use-permission="true"
          :button-list="['btnSearch', 'btnRskCopyApp', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <div class="d-flex flex-column fill-height">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            style="height: 500px;"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">

</style>
