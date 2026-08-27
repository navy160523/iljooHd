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
import SAFFA0020_PopUp03 from "@/pages/30_safety/SAF_F/SAFFA0020_PopUp03.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(['selected'])
const dialog = ref(false)
const grdMain = ref(null)
const saffa0020_popup03 = ref(null)
const searchParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  YYYYMM: '',
  TARGET_ID: '',
  ASGN_NM: '',
  JOB_TIT_NM: '',
  KOR_NM: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: [],
  field: [
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육일자') }, editable: false, styleName: 'left-column',},
    { fieldName: 'EDU_TIME_ST', dataType: 'text', header: { text: t('시작') }, editable: false, styleName: 'left-column',},
    { fieldName: 'EDU_TIME_FN', dataType: 'text', header: { text: t('종료') }, editable: false, styleName: 'left-column',},
    { fieldName: 'LEAD_TIME', dataType: 'text', header: { text: t('시간(분)') }, editable: false, styleName: 'left-column',},
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('과정명') }, editable: false, styleName: 'left-column',},
    { fieldName: 'LECTURER_NM', dataType: 'text', header: { text: t('강사명') }, editable: false, styleName: 'left-column',},
    { fieldName: 'EPLACE_NM', dataType: 'text', header: { text: t('교육장소') }, editable: false, styleName: 'left-column',},
    { fieldName: 'DIV_DESC', dataType: 'text', header: { text: t('이수여부') }, editable: false, styleName: 'left-column',},

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', visible: false },
    { fieldName: 'TARGET_ID', dataType: 'text', visible: false },
    { fieldName: 'EDU_DIV', dataType: 'text', visible: false },
    { fieldName: 'ADD_EDU_DATE', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    'EDU_DATE',
    {
      name: '교육시각',
      direction: 'horizontal',
      items: [ 'EDU_TIME_ST', 'EDU_TIME_FN', 'LEAD_TIME'],
      header: { text: t('교육시각') },
    },
    'CURR_NM',
    'LECTURER_NM',
    'EPLACE_NM',
    'DIV_DESC',
  ]
})

grdMainProps.columns = grdMainProps.field

const openPopup = (popupParam) => {
  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParams.BSNS_CD = popupParam.BSNS_CD
  searchParams.YYYYMM = popupParam.YYYYMM
  searchParams.TARGET_ID = popupParam.EMP_NO
  searchParams.ASGN_NM = popupParam.ASGN_NM
  searchParams.JOB_TIT_NM = popupParam.JOB_TIT_NM
  searchParams.KOR_NM = popupParam.KOR_NM
  
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
  } else if (btn.id === 'btnUpdate') { // 임시
    saffa0020_popup03.value.openPopup({
      CMPNY_DIV: 'HHI',
      YEAR: '2024',
      SCHEDULE_ID: '202407250284',
      EDUTIME_SERIAL: '1',
    })
  }
}

/* ------------- 조회 ------------- */
const beforeSearch = async () => {
  return true
}

const searchData = () => {
  return commonSearchApi({ queryId: 'SAFFA0020_SEARCH_06', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  saffa0020_popup03.value.openPopup(data)
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
    width="1150"
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
      <span>교육이수 상세내역</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title> 
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                :label="$t('이름')"
                class="mr-4"
                label-width="30px"
                width="250px"
                v-model="searchParams.KOR_NM"
                type="Text"
                :disabled="true"
              />
              <i-input
                :label="$t('직위')"
                class="mr-4"
                label-width="30px"
                width="250px"
                v-model="searchParams.JOB_TIT_NM"
                type="Text"
                :disabled="true"
              />
              <i-input
                :label="$t('소속')"
                class="mr-4"
                label-width="53px"
                width="500px"
                v-model="searchParams.ASGN_NM"
                type="Text"
                :disabled="true"
              />
              
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :column-layout="grdMainProps.columnLayout"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
        <SAFFA0020_PopUp03
          ref="saffa0020_popup03"
        />
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
