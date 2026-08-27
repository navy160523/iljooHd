<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(['selected'])
const dialog = ref(false)
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: 'HHI',
  BSNS_CD: '',
  DEPT_CD: '',
  YYYYMMDD: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: [],
  field: [
    { fieldName: 'GUBUN', width: 100, dataType: 'text', header: { text: t('구분') }, editable: false, },
    { fieldName: 'CMM_DT', width: 120, dataType: 'text', header: { text: t('요구/제보일시') }, editable: false, },
    { fieldName: 'SOSOG', width: 230, dataType: 'text', header: { text: t('소속') }, editable: false, styleName: 'left-column',},
    { fieldName: 'EMP_NO', width: 70, dataType: 'text', header: { text: t('사번') }, editable: false, },
    { fieldName: 'EMP_NM', width: 70, dataType: 'text', header: { text: t('성명') }, editable: false, },
    { fieldName: 'SLI_SOSOG', width: 230, dataType: 'text', header: { text: t('SLI소속') }, editable: false, },
    { fieldName: 'PLACE_NM', width: 220, dataType: 'text', header: { text: t('장소') }, editable: false, styleName: 'left-column',},
    { fieldName: 'CONTENT', width: 150, dataType: 'text', header: { text: t('내용') }, editable: false, styleName: 'right-column',},
    { fieldName: 'JOCHI_YN', width: 60, dataType: 'text', header: { text: t('조치유무') }, editable: false, },

    { fieldName: 'BSNS_NM', dataType: 'text', visible: false },
    { fieldName: 'DEPT_NM', dataType: 'text', visible: false },
    { fieldName: 'ASGN_NM', dataType: 'text', visible: false },
    { fieldName: 'JOB_LPLC_NM', dataType: 'text', visible: false },
    { fieldName: 'JOB_MPLC_NM', dataType: 'text', visible: false },
    { fieldName: 'JOB_SPLC_NM', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    'GUBUN',
    'CMM_DT',
    { 
      name: '요청자/제보자',
      direction: 'horizontal',
      items: ['SOSOG', 'EMP_NO','EMP_NM'],
      header: { text: t('요청자/제보자') },
    },
    'SLI_SOSOG',
    'PLACE_NM',
    'CONTENT',
    'JOCHI_YN',
  ],
})

grdMainProps.columns = grdMainProps.field

const openPopup = (popupParam) => {  
  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParams.BSNS_CD = popupParam.BSNS_CD
  searchParams.DEPT_CD = popupParam.DEPT_CD
  searchParams.YYYYMMDD = popupParam.TMP_TO_DT
  //그리드, 선택 상태 초기화
  grdMain.value.getGridView().setAllCheck(false)
  grdMain.value.getDataProvider().setRows([])

  onButtonsClick({ id : 'btnSearch' })
  dialog.value = true
}

/* ------------- 클릭 이벤트 ------------- */
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnClose') {
    grdMain.value.getDataProvider().setRows([])
    dialog.value = false
  }
}

/* ------------- 조회 ------------- */
const beforeSearch = async () => {
  return true
}

const searchData = () => {
  return commonSearchApi({ queryId: 'SAFFA0020_SEARCH_10', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

watch(() => searchParams.TARGET_DIV, (newValue, oldValue) => {
  onButtonsClick({ id : 'btnSearch' })
})

defineExpose({
  openPopup,
}) 
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1450"
    height="900"
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
      <span>안전작업요구권/ 안전제보 현황</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title> 
      
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>
    
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.notice {
  background-color: rgb(var(--v-theme-base));
  margin-bottom: 10px;
  border-radius: 5px;
  margin-left: 16px;
  margin-right: 16px;
  line-height: 2;
  .notice-content {
    font-size: 1rem;
    padding: 10px;
  }
}
</style>

