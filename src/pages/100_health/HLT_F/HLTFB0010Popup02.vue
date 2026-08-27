<!--
  화면명 : 예비조사 단기공사 상세
  화면개요 : 단기공사 상세
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, getCodeList, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(["after-search"])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

const codeList = reactive({
  DEPT_CD: [],
  CMPNY_DIV: [],
  PROCESS_CD: [],
})
/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DEPT_CD: '',
  DEPT_NM: '',
  FR_DT: '',
  TO_DT: '',
})
 
//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'REQ_DEPT_NM', dataType: 'text', width: '80', header: { text: t('부서') }, styleName: 'left-column',  lookupDisplay: true },
    { fieldName: 'REQ_KOR_NM', dataType: 'text', width: '40', header: { text: t('담당자') }, },
    { fieldName: 'WRK_DEPT_NM', dataType: 'text', width: '80', header: { text: t('부서')} },
    { fieldName: 'WRK_KOR_NM', dataType: 'text', width: '40', header: { text: t('담당자') } },
    { fieldName: 'VND_NAME', dataType: 'text', width: '80', header: { text: t('업체명') } },
    { fieldName: 'WORK_DIVNM', dataType: 'text', width: '80', header: { text: t('작업분류') }, styleName: 'left-column' },
    { fieldName: 'WORK_DESC', dataType: 'text', width: '120', header: { text: t('공사명') }, styleName: 'left-column' },
    { fieldName: 'REQ_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '50', header: { text: t('신청일') } },
    { fieldName: 'WORK_DT', dataType: 'text', width: '100', header: { text: t('공사기간') }, styleName: 'left-column' },
    { fieldName: 'PERIOD', dataType: 'text', width: '30', header: { text: t('일수') } },
    { fieldName: 'WORK_AREA', dataType: 'text', width: '80', header: { text: t('공사장소') } },
    { fieldName: 'IN_PERSON', dataType: 'text', width: '40', header: { text: t('출입인원') } },
    { fieldName: 'DANGER_H', dataType: 'text', width: '50', header: { text: t('위험작업\n허가대상'), styleName:'multiline-editor-pre' } },
    { fieldName: 'STATUS_NAME', dataType: 'text', width: '60', header: { text: t('진행상태') } },

    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '120', header: { text: t('회사코드') }, visible : false },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '120', header: { text: t('의뢰 부서코드') }, visible : false },
    { fieldName: 'REQ_PIC_EMPNO', dataType: 'text', width: '120', header: { text: t('의뢰부서 담당자 사번') }, visible : false },
    { fieldName: 'WRK_MNG_EMPNO', dataType: 'text', width: '120', header: { text: t('관리부서 담당자 사번') }, visible : false },
    { fieldName: 'VEND_CD', dataType: 'text', width: '120', header: { text: t('업체코드') }, visible : false },
    { fieldName: 'STATUS', dataType: 'text', width: '120', header: { text: t('진행상태코드') }, visible : false },
    // { fieldName: 'SELECT', dataType: 'text', header: { text: t('SELECT') }, visible: false },
  ],
  columnLayout: [
    {
      name: '의뢰 부서',
      direction: 'horizontal',
      items: [ 'REQ_DEPT_NM', 'REQ_KOR_NM' ],
      header: { text: t('의뢰 부서') },
    },
    {
      name: '공사관리 부서',
      direction: 'horizontal',
      items: [ 'WRK_DEPT_NM', 'WRK_KOR_NM' ],
      header: { text: t('공사관리 부서') },
    },
    'VND_NAME',
    'WORK_DIVNM',
    'WORK_DESC',
    'REQ_DATE',
    'WORK_DT',
    'PERIOD',
    'WORK_AREA',
    'IN_PERSON',
    'DANGER_H',
    'STATUS_NAME',
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  grdMain.value.getDataProvider().setRows([])

  grdMain.value.getGridView().filterPanel.visible = true

  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.DEPT_NM = param.DEPT_NM
  searchParams.FR_DT = dayjs().subtract(7,'days').format('YYYY-MM-DD')
  searchParams.TO_DT = dayjs().format('YYYY-MM-DD')

  getCode()
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === "btnClose") {
    closePopup()
  } 
}

const getCode = () => {
  Promise.all([
    // 회사코드
    getCodeList('HHIZ000'),
  ]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    getData()
  })
}

// 메인 데이터 조회
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//DB 조회
const searchData = () => { 
  return commonSearchApi({ queryId : 'HLTFB0010_SEARCH_08', param: searchParams })
}

//조회 후 반영
const afterSearch = res =>{
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  dialog.value = false
}

defineExpose({
  openPopup
})

onMounted(() => {
  
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1650"
    height="820"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>단기공사 상세</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-select
              v-model="searchParams.CMPNY_DIV"
              :label="$t('회사구분')"
              label-width="50px"
              :items="codeList.CMPNY_DIV"
              :readonly="true"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
            <i-input
              v-model="searchParams.DEPT_CD"
              :label="$t('공사 관리 부서')"
              type="text"
              width="200px"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.DEPT_NM"
              type="text"
              width="200px"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.FR_DT"
              :label="$t('발급일')"
              type="text"
              width="200px"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.TO_DT"
              :label="$t('~')"
              type="text"
              width="200px"
              :readonly="true"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area" style="height:600px;">
          <v-sheet class="searchArea flex-column">
            <RealGrid 
              ref="grdMain"
              style="height: 530px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
