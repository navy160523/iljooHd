<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import _ from 'lodash'
import { chkEmpty } from '@/utils/common'

defineOptions({
  name: '80_operation-OPR-A-OPRAM0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const gridTitleMain = ref(null)
const gridTitleSub = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const empPopup = ref(null)
const uploadInput = ref(null)

const grdMainProps = reactive({
  gridViewOption: {
    // edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  fields: [
    { fieldName: 'GROUP_ID', dataType: 'text', header: { text: t('그룹ID'), }, width: '60', editable: false, },
    { fieldName: 'GROUP_NM', dataType: 'text', header: { text: t('그룹명'), }, width: '200', styleName: 'editable_column left-column' },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자'), }, width: '80', editable: false, },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일시'), }, width: '150', editable: false, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
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
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위'), }, width: '120', },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책'), }, width: '120', },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), }, width: '120', },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름'), }, width: '120', },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'GROUP_ID', dataType: 'text', header: { text: t('GROUP_ID'), }, visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD'), }, visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD'), }, visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD'), }, visible: false, },
    { fieldName: 'ADD_ROW', dataType: 'text', header: { text: t('ADD_ROW'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  GROUP_NM: '',
})

const searchData = () => {
  grdSub.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows([])

  return commonSearchApi({ queryId: 'OPRAM0010_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const searchMain = showMsg => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(showMsg)
    .run()
}

const searchSub = async () => {
  // console.log('searchSub')

  grdSub.value.getDataProvider().setRows([])

  const currMain = await grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)

  if(currMain.GROUP_ID == null) {
    gridTitleSub.value.disableBtn('btnCreate', true)
    gridTitleSub.value.disableBtn('btnUpdate', true)
    gridTitleSub.value.disableBtn('btnDelete', true)
    gridTitleSub.value.disableBtn('btnExcelUpload', true)
  } else {
    gridTitleSub.value.disableBtn('btnCreate', false)
    gridTitleSub.value.disableBtn('btnUpdate', false)
    gridTitleSub.value.disableBtn('btnDelete', false)
    gridTitleSub.value.disableBtn('btnExcelUpload', false)

    commonSearchApi({ queryId: 'OPRAM0010_SEARCH_02', param: currMain }).then(res => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    searchMain(true)
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

const addMain = () => {
  const row = grdMain.value.getDataProvider().addRow({ CMPNY_DIV: searchParams.CMPNY_DIV, })
  grdMain.value.getGridView().setCurrent({ dataRow: row })
  grdMain.value.getGridView().checkRow(row)
}

const addSub = async () => {
  empPopup.value.openPopup({ MULTI:true })
}

const beforeSaveMain = () => {
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if(checkedRows.length < 1){
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  }

  return true
}

const beforeSaveSub = () => {
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)

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

  return commonExecuteApi({ queryId : 'OPRAM0010_SAVE_01', list: saveParams })
}

const saveSubData = () => {
  const saveParams = []
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdSub.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'OPRAM0010_SAVE_02', list: saveParams })
}

const afterSaveMain = () => {
  grdMain.value.getGridView().setAllCheck(false)
  searchMain(false)
}

const afterSaveSub = () => {
  grdSub.value.getGridView().setAllCheck(false)
  searchSub()
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

const saveSub = () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdSub, row: 'check' }])
    .setGridList([grdSub])
    .setBefore(beforeSaveSub)
    .setQuery(saveSubData)
    .setAfter(afterSaveSub)
    .run()
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

  if(!_.some(deleteParams, item => item.GROUP_ID != null )) {
    grdMain.value.getDataProvider().removeRows(checkedRows)
    grdMain.value.getGridView().checkRows(checkedRows, false)
  } else {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(() => { return commonExecuteApi({ queryId : 'OPRAM0010_DELETE_01', list: deleteParams }) })
      .setAfter(afterSaveMain)
      .run()
  }
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
      .setQuery(() => { return commonExecuteApi({ queryId : 'OPRAM0010_DELETE_02', list: deleteParams }) })
      .setAfter(afterSaveSub)
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
  } else if(btnId === 'btnExcelUpload') {
    uploadInput.value.click()
  } else if(btnId === 'btnSampleDown') {
    sampleDown()
  }
}

const sampleDown = () => {
  const sampleParam = {
    FILE_PATH: 'OPR_A',
    FILE_NAME: '그룹별 대상자 관리 업로드 양식.xlsx',
  }

  commonSampleDownFilesApi(sampleParam)
}

const mainRowChanged = async (grid, oldIdx, newIdx) => {
  if(newIdx < 0){
    return
  }

  searchSub()
}

const uploadData = e => {
  // console.log('uploadData', e.target.files)

  getJsonFromExcel(
    e.target.files[0],
    async data => {
      // console.log('data', data)

      uploadInput.value.value = null

      const currMain = await grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)
      const saveParams = []

      for(let i = 0; i < data.length; i++) {
        const row = data[i]

        if(chkEmpty(row.회사코드)) {
          Message.err('회사코드를 입력해 주세요')
          return
        } else if(chkEmpty(row.사업부코드)) {
          Message.err('사업부코드를 입력해 주세요')
          return
        } else if(chkEmpty(row.사번)) {
          Message.err('사번을 입력해 주세요')
          return
        }

        saveParams.push({
          CMPNY_DIV: row.회사코드,
          GROUP_ID: currMain.GROUP_ID,
          BSNS_CD: row.사업부코드,
          EMP_NO: row.사번
        })
      }

      commonExecuteApi({ queryId : 'OPRAM0010_SAVE_03', list: saveParams }).then(res => {
        searchSub()
        Message.success('업로드 되었습니다.')
      })
    }
  )
}

const onEmpSelected = async emps => {
  // console.log('emps', emps)

  const currMain = await grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)

  emps.forEach(emp => {
    emp.GROUP_ID = currMain.GROUP_ID
    emp.ADD_ROW = 'Y'
    const row = grdSub.value.addRow(emp)
    grdSub.value.getGridView().checkRow(row)
  })
}

onMounted(() => {
  nextTick(() => {
    gridTitleSub.value.disableBtn('btnCreate', true)
    gridTitleSub.value.disableBtn('btnUpdate', true)
    gridTitleSub.value.disableBtn('btnDelete', true)
    gridTitleSub.value.disableBtn('btnExcelUpload', true)

    searchMain(false)
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('그룹명')"
            v-model="searchParams.GROUP_NM"
            @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
            width="250px"
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="40%" class="h-auto mr-3">
            <IGridTitle 
              ref="gridTitleMain"
              :title="$t('그룹 목록')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
              @click-button="onMainButtonsClick"
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
              :title="$t('그룹 대상자 리스트')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete', 'btnExcelUpload', 'btnSampleDown']"
              @click-button="onSubButtonsClick"
            />
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </div>
   </v-card-text>

   <input ref="uploadInput" type="file" hidden @input="uploadData" accept=".xlsx,.xls" />
   <EmpPopup ref="empPopup" @selected="onEmpSelected" />
  </v-card>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>