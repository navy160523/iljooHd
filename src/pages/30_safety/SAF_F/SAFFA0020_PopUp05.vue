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
const grdSub = ref(null)

const date = ref('')
const searchParams = reactive({
  CMPNY_DIV: 'HHI',
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
    { fieldName: 'BSNS_NM', width: 100, dataType: 'text', header: { text: t('사업부') }, editable: false,},
    { fieldName: 'DEPT_NM', width: 100, dataType: 'text', header: { text: t('부서') }, editable: false, },
    { fieldName: 'WORK_ASGN', width: 80, dataType: 'text', header: { text: t('누적배정인원') }, editable: false, styleName: 'right-column',},
    { fieldName: 'WORK_CFRM', width: 80, dataType: 'text', header: { text: t('현장위험성평가\n누적 실시 인원'), styleName: 'multiline-editor', }, editable: false, styleName: 'right-column',},
    { fieldName: 'RATE_CFM', width: 80, dataType: 'text', header: { text: t('위험성평가 실시율(평균)') }, editable: false, styleName: 'right-column',},

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD2', dataType: 'text', visible: false },
    { fieldName: 'WORK_CNT', dataType: 'text', visible: false },
  ],
  columns: [],
})

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: [],
  field: [
    { fieldName: 'ASGN_NM', width: 100, dataType: 'text', header: { text: t('소속') }, editable: false, },
    { fieldName: 'WORK_CNT', width: 100, dataType: 'text', header: { text: t('작업(건)') }, editable: false, styleName: 'right-column',},
    { fieldName: 'WORK_ASGN', width: 80, dataType: 'text', header: { text: t('누적배정인원') }, editable: false, styleName: 'right-column',},
    { fieldName: 'WORK_CFRM', width: 80, dataType: 'text', header: { text: t('현장위험성평가\n누적 실시 인원'), styleName: 'multiline-editor', }, editable: false, styleName: 'right-column',},
    { fieldName: 'RATE_CFM', width: 80, dataType: 'text', header: { text: t('위험성평가 실시율(평균)') }, editable: false, styleName: 'right-column', styleName: 'right-column',},

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD2', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field
grdSubProps.columns = grdSubProps.field

const openPopup = (popupParam) => {  
  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParams.DEPT_CD = popupParam.DEPT_CD
  searchParams.YYYYMMDD = popupParam.TMP_TO_DT.replaceAll('-','')
  setDate(popupParam.TMP_TO_DT)
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

const setDate = (dt) => {
  const today = new Date(dt)
  const before = new Date(dt)
  before.setDate(before.getDate() - 6)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const dayIndex = today.getDay()
  const beforeIndex = before.getDay()
  date.value = ': ' + before.getFullYear() + '-' + ('0' + (before.getMonth() + 1)).slice(-2) + '-' + ('0' + before.getDate()).slice(-2) + '(' + days[beforeIndex] + ')'
  date.value += ' ~ ' + dt + '(' + days[dayIndex] + ')'
}

/* ------------- 조회 ------------- */
const beforeSearch = async () => {
  return true
}

const searchData = () => {
  return commonSearchApi({ queryId: 'SAFFA0020_SEARCH_11', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR2)
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
      <span>현장 위험성평가 (최근 1주일 누적)</span>
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
          <v-sheet height="18%">
            <div class="d-flex">
              <IGridTitle 
                :title="$t('부서현황')"
              >
                <template #editors />
              </IGridTitle>
              <div class="ml-auto mt-1">
                기준일 {{ date }}
              </div>
            </div>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
          <v-sheet class="mt-3" height="82%">
            <div class="d-flex">
              <IGridTitle 
                :title="$t('상세현황')"
              >
                <template #editors />
              </IGridTitle>
              <div class="notice">
                ※ 소속별 현장 위험성평가 실시 현황과 내용은 모바일 안전작업지시 시스템을 통해 확인 바랍니다.
              </div>
            </div>
            <RealGrid
              ref="grdSub"
              class="mt-2"
              :gridViewOption="grdSubProps.gridViewOption"
              :fields="grdSubProps.field"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.notice {
  z-index: 9999;
  color: red;
  font-size: 1.1rem;
  font-weight: bold;
  margin-top:2px;
}
</style>

