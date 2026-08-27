<script setup>
import { ref, reactive, onMounted } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const dialog = ref(false)
const grdMain = ref(null)
const searchParams = reactive({
  TASK_SEQ: '',
  TASK_NO_1: '',
  FROM_DT: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  TO_DT: dayjs().format('YYYY-MM-DD'),
  IS_HISAFE: 'N',
  DEPT_GBN: 'A',
})

const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: false },
  }, 
  fields: [
    { fieldName: 'INSERT_DATE2', dataType: 'text',  header: { text: t('변경일시') }, width: '160', },
    { fieldName: 'TASK_SEQ', dataType: 'text',  header: { text: t('통합관리번호') }, width: '120', },
    { fieldName: 'TASK_NO_1', dataType: 'text',  header: { text: t('Hi-SAFE') }, width: '120', },
    { fieldName: 'CHANGE_COL_NM', dataType: 'text',  header: { text: t('부서구분'), width: '120', } },
    { fieldName: 'DEPT_NM', dataType: 'text',  header: { text: t('부서') }, styleName: 'left-column', width: '300' },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const initSearchParams = () => {
  searchParams.TASK_SEQ = ''
  searchParams.TASK_NO_1 = ''
  searchParams.FROM_DT = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
  searchParams.TO_DT = dayjs().format('YYYY-MM-DD')
  searchParams.IS_HISAFE = 'N'
  searchParams.DEPT_GBN = 'A'
}

const openPopup = param => {
  dialog.value = true

  initSearchParams()

  if(param != undefined && param != null) {
    if(param.IS_HISAFE != undefined && param.IS_HISAFE != null) {
      searchParams.IS_HISAFE = param.IS_HISAFE
    }
  }

  onButtonsClick({ id: 'btnSearch' })
}

const searchData = () => {
  return commonSearchApi({ queryId: 'SRMAA0030_SEARCH_07', param: searchParams }) 
}

const afterSearch = res => {
  const data = res.ORESULT_CUR

  grdMain.value.getDataProvider().setRows(data)
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    new queryFlowHelper(vm, t)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
  } else if(btnId === 'btnClose') {
    dialog.value = false
  }
}

const initPopup = () => {
  
}

onMounted(() => {
  initPopup()
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
    class="draggable-dialog"
    width="920px"
  >
    <div class="title-bar">
      {{ $t('부서 변경이력') }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-2 py-0">
        <IGridTitle :button-list="['btnSearch', 'btnClose']" @click-button="onButtonsClick" />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <v-sheet class="searchArea mb-0">
          <div class="d-flex">
            <i-input
              v-model="searchParams.FROM_DT"
              :label="$t('변경기간')" 
              width="200px"
              type="date" 
              margin="10px"
            /> 
            <i-input 
              v-model="searchParams.TO_DT"
              :label="$t('~')" 
              label-width="10px"
              width="165px"
              type="date"
            />
            <i-input
              v-model="searchParams.TASK_SEQ"
              :label="$t('통합관리번호')" 
              width="200px"
            />
            <i-input
              v-model="searchParams.TASK_NO_1"
              :label="$t('Hi-SAFE 관리번호')" 
              width="220px"
            />
          </div>
        </v-sheet>
        <v-sheet height="500px" class="mt-2">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>