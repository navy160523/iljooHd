<!--
  화면명 : 채용검진자 관리 사번찾기
  화면개요 : 채용검진자 관리 사번찾기
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['selected'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  KOR_NM: '',
  BIRTH: ''
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'EMP_NO', width: '40', dataType: 'text', header: { text: t('사번') }, },
    { fieldName: 'KOR_NM', width: '40', dataType: 'text',  header: { text: t('성명') }, },
    { fieldName: 'BIRTH_DAY', width: '40', dataType: 'text', styleName: '', header: { text: t('생년월일') }, },
    { fieldName: 'DEPT_NM', width: '40', dataType: 'text', styleName: '', header: { text: t('부서명') }, },
    { fieldName: 'JOB_TIT_NM', width: '40', dataType: 'text', styleName: '', header: { text: t('직급') }, },
    { fieldName: 'DUTY_NM', width: '40', dataType: 'text', styleName: '', header: { text: t('직무') }, },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.KOR_NM = param.KOR_NM
  searchParams.BIRTH = param.BIRTH
  
  onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}


// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnSelect') {
    selectEmpno()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTGA0040_SEARCH_02', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 셀 더블클릭
const onCellDblClicked = (grid, clickData) => {  
  if(clickData.cellType !== 'data') return
  selectEmpno()
}

const selectEmpno = () => {
  const rowData = grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)
  emit('selected', rowData)
  closePopup()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  //searchSubData.value()
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="700"
    height="500"
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
      <span>사번 찾기</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area"> 
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 350px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
