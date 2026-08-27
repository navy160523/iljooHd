<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import EmpPopup from '@/components/popup/EmpPopup.vue'

const emit = defineEmits(['saved'])

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const dialog = ref(false)

const gridTitleMain = ref(null)
const gridTitleSub = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const empPopup = ref(null)

const codeList = reactive({
  USE_YN: [
    { COD: '', TXT: '전체', },
    { COD: 'Y', TXT: '사용', },
    { COD: 'N', TXT: '사용안함', },
  ],
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  CONTENT_HD: '',
  USE_YN: 'Y',
})

const grdMainProps = reactive({
  gridViewOption: {
    // edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  fields: [
    { fieldName: 'CONTENT_HD', dataType: 'text', header: { text: t('말머리'), }, width: '200', styleName: 'editable_column left-column' },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자'), }, width: '80', editable: false, },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일시'), }, width: '150', editable: false, },
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부'), }, width: '75', styleName: 'editable_column',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ'), }, visible: false, },
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  fields: [
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속'), }, styleName: 'left-column', width: '300', },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), }, width: '120', },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름'), }, width: '120', },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위'), }, width: '120', },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책'), }, width: '120', },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ'), }, visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD'), }, visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD'), }, visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD'), }, visible: false, },
    { fieldName: 'ADD_ROW', dataType: 'text', header: { text: t('ADD_ROW'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const init = () => {
  gridTitleSub.value.disableBtn('btnCreate', true)
  gridTitleSub.value.disableBtn('btnUpdate', true)
  gridTitleSub.value.disableBtn('btnDelete', true)

  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  searchParams.CONTENT_HD = ''
  searchParams.USE_YN = 'Y'

  grdSub.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows([])
}

const openPopup = () => {
  init()
  searchMain(false)
  dialog.value = true
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    searchMain()
  } else if(btnId === 'btnClose') {
    dialog.value = false
  }
}

const onMainButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnCreate') {
    addMain()
  } else if(btnId === 'btnUpdate') {
    saveMain()
  } else if(btnId === 'btnDelete') {
    deleteMain()
  }
}

const searchMain = (showMsg = true) => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(showMsg)
    .run()
}

const searchData = () => {
  grdSub.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows([])

  return commonSearchApi({ queryId: 'DATDA0010_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const addMain = () => {
  const row = grdMain.value.getDataProvider().addRow({
    CMPNY_DIV: searchParams.CMPNY_DIV,
    USE_YN: 'Y',
  })
  grdMain.value.getGridView().setCurrent({ dataRow: row })
  grdMain.value.getGridView().checkRow(row)
}

const saveMain = () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setBefore(beforeSaveMain)
    .setQuery(saveMainData)
    .setAfter(afterSaveMain)
    .run()
}

const beforeSaveMain = () => {
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if(checkedRows.length < 1){
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  }

  return true
}

const saveMainData = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdMain.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'DATDA0010_SAVE_01', list: saveParams })
}

const afterSaveMain = () => {
  grdMain.value.getGridView().setAllCheck(false)
  searchMain(false)
  emit('saved')
}

const deleteMain = () => {
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  const deleteParams = []

  if(checkedRows.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  }

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  if(!_.some(deleteParams, item => item.SEQ != null )) {
    grdMain.value.getDataProvider().removeRows(checkedRows)
    grdMain.value.getGridView().checkRows(checkedRows, false)
  } else {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(() => { return commonExecuteApi({ queryId : 'DATDA0010_DELETE_01', list: deleteParams }) })
      .setAfter(afterSaveMain)
      .run()
  }
}

const onSubButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnCreate') {
    addSub()
  } else if(btnId === 'btnUpdate') {
    saveSub()
  } else if(btnId === 'btnDelete') {
    deleteSub()
  }
}

const afterSaveSub = () => {
  grdSub.value.getGridView().setAllCheck(false)
  searchSub()
}

const saveSub = () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdSub, row: 'check' }])
    .setGridList([grdSub])
    .setBefore(beforeSaveSub)
    .setQuery(saveSubData)
    .setAfter(afterSaveSub)
    .run()
}

const beforeSaveSub = () => {
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  if(checkedRows.length < 1){
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  }

  return true
}

const saveSubData = () => {
  const saveParams = []
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdSub.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'DATDA0010_SAVE_02', list: saveParams })
}

const addSub = async () => {
  empPopup.value.openPopup({ MULTI:true, AUTO_CLOSE: 'N', })
}

const deleteSub = () => {
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  const deleteParams = []

  if(checkedRows.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  }

  for (const rowIdx of checkedRows) {
    const data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  if(!_.some(deleteParams, item => item.ADD_ROW !== 'Y' )) {
    grdSub.value.getDataProvider().removeRows(checkedRows)
    // grdSub.value.getGridView().checkRows(checkedRows, false)
  } else {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setQuery(() => { return commonExecuteApi({ queryId : 'DATDA0010_DELETE_02', list: deleteParams }) })
      .setAfter(afterSaveSub)
      .run()
  }
}

const mainRowChanged = async (grid, oldIdx, newIdx) => {
  if(newIdx < 0){
    return
  }

  searchSub()
}

const searchSub = async () => {
  // console.log('searchSub')

  grdSub.value.getDataProvider().setRows([])

  const currMain = await grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)

  if(currMain.SEQ == null) {
    gridTitleSub.value.disableBtn('btnCreate', true)
    gridTitleSub.value.disableBtn('btnUpdate', true)
    gridTitleSub.value.disableBtn('btnDelete', true)
  } else {
    gridTitleSub.value.disableBtn('btnCreate', false)
    gridTitleSub.value.disableBtn('btnUpdate', false)
    gridTitleSub.value.disableBtn('btnDelete', false)

    commonSearchApi({ queryId: 'DATDA0010_SEARCH_02', param: currMain }).then(res => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

const onEmpSelected = async emps => {
  // console.log('emps', emps)

  const currMain = await grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)

  emps.forEach(emp => {
    emp.SEQ = currMain.SEQ
    emp.ADD_ROW = 'Y'
    const row = grdSub.value.addRow(emp)
    grdSub.value.getGridView().checkRow(row)
  })
}

onMounted(() => {
  //
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
    width="100%"
    height="100%"
  >
    <div class="title-bar">
      {{ $t('말머리 관리자 지정') }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0">
        <IGridTitle
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
          :use-permission="false"
        />
      </v-card-title>
      <v-card-text class="pa-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-input
              v-model="searchParams.CONTENT_HD"
              :label="$t('말머리')"
              width="250px"
            />
            <i-select
              v-model="searchParams.USE_YN"
              :items="codeList.USE_YN"
              item-value="COD"
              item-title="TXT"
              :label="$t('사용여부')"
              width="200px"
            />
          </v-sheet>
          <div class="h-grow">
            <v-sheet width="40%" class="h-auto mr-3">
              <IGridTitle 
                ref="gridTitleMain"
                :title="$t('말머리 목록')"
                :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                @click-button="onMainButtonsClick"
                :use-permission="false"
              />
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCurrentRowChanged="mainRowChanged"
              />
            </v-sheet>
            <v-sheet width="60%" class="pa-0 h-auto">
              <IGridTitle
                ref="gridTitleSub"
                :title="$t('말머리 관리자 목록')"
                :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                @click-button="onSubButtonsClick"
                :use-permission="false"
              />
              <RealGrid
                ref="grdSub"
                :grid-view-option="grdSubProps.gridViewOption"
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
              />
            </v-sheet>
          </div>
        </v-sheet>
      </v-card-text>

      <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
</style>