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
import _ from 'lodash'
import OZReport from '@/components/OZReport.vue'

defineOptions({
  name: '60_edu-EDU_A-EDUAB0090',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const gridTitleMain = ref(null)
const gridTitleSub = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const uploadInput = ref(null)

const showOz = ref(false)
const reportName = ref('/manage/hse/EDUAB0090.ozr')
const ozParams = ref([])

const grdMainProps = reactive({
  gridViewOption: {
    // edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  fields: [
    { fieldName: 'GRP_NM', dataType: 'text', header: { text: t('그룹명'), }, width: '200', styleName: 'editable_column left-column' },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자'), }, width: '100', editable: false, },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일시'), }, width: '160', editable: false, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사'), }, visible: false, },
    { fieldName: 'GRP_SEQ', dataType: 'text', header: { text: t('그룹ID'), }, visible: false, },
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption: {
    // edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  fields: [
    { fieldName: 'EDU_NM', dataType: 'text', header: { text: t('과정명'), }, styleName: 'editable_column left-column', },
    { fieldName: 'EDU_DT', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('이수일자'), }, styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }, },
    },
    { fieldName: 'EDU_TM', dataType: 'number', numberFormat: '#,###', header: { text: t('이수시간'), }, styleName: 'editable_column right-column', },
    { fieldName: 'BIRTH_DT', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('생년월일'), }, styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }, },
    },
    { fieldName: 'TEAM_NM', dataType: 'text', header: { text: t('소속'), }, styleName: 'editable_column left-column', },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름'), }, styleName: 'editable_column left-column', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사'), }, visible: false, },
    { fieldName: 'GRP_SEQ', dataType: 'text', header: { text: t('그룹ID'), }, visible: false, },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('이수ID'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  GRP_NM: '',
})

const searchData = () => {
  grdSub.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows([])

  return commonSearchApi({ queryId: 'EDUAB0090_SEARCH_01', param: searchParams })
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

  if(currMain.GRP_SEQ == null) {
    gridTitleSub.value.disableBtn('btnCreate', true)
    gridTitleSub.value.disableBtn('btnUpdate', true)
    gridTitleSub.value.disableBtn('btnDelete', true)
    gridTitleSub.value.disableBtn('btnExcelUpload', true)
  } else {
    gridTitleSub.value.disableBtn('btnCreate', false)
    gridTitleSub.value.disableBtn('btnUpdate', false)
    gridTitleSub.value.disableBtn('btnDelete', false)
    gridTitleSub.value.disableBtn('btnExcelUpload', false)

    commonSearchApi({ queryId: 'EDUAB0090_SEARCH_02', param: currMain }).then(res => {
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
  const currMain = await grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)

  const row = grdSub.value.getDataProvider().addRow({
    CMPNY_DIV: currMain.CMPNY_DIV,
    GRP_SEQ: currMain.GRP_SEQ,
  })

  grdSub.value.getGridView().setCurrent({ dataRow: row })
  grdSub.value.getGridView().checkRow(row)
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

  return commonExecuteApi({ queryId : 'EDUAB0090_SAVE_01', list: saveParams })
}

const saveSubData = () => {
  const saveParams = []
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdSub.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'EDUAB0090_SAVE_02', list: saveParams })
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

  if(!_.some(deleteParams, item => item.GRP_SEQ != null )) {
    grdMain.value.getDataProvider().removeRows(checkedRows)
    grdMain.value.getGridView().checkRows(checkedRows, false)
  } else {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(() => { return commonExecuteApi({ queryId : 'EDUAB0090_DELETE_01', list: deleteParams }) })
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

  if(!_.some(deleteParams, item => item.SEQ != null )) {
    grdSub.value.getDataProvider().removeRows(checkedRows)
    grdSub.value.getGridView().checkRows(checkedRows, false)
  } else {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setQuery(() => { return commonExecuteApi({ queryId : 'EDUAB0090_DELETE_02', list: deleteParams }) })
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
  } else if(btnId === 'btnPrint') {
    printOZ()
  }
}

const sampleDown = () => {
  const sampleParam = {
    FILE_PATH: 'EDU_A',
    FILE_NAME: '사외 이수증 업로드 양식.xlsx',
  }

  commonSampleDownFilesApi(sampleParam)
}

const printOZ = async () => {
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  
  if(checkedRows.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  }

  const currMain = await grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)
  let seq = ''

  for (const rowIdx of checkedRows) {
    const data = grdSub.value.getDataProvider().getJsonRow(rowIdx)

    if(seq === '') {
      seq = data.SEQ
    } else {
      seq += ',' + data.SEQ
    }
  }

  ozParams.value = [
    'IN_CMPNY_DIV=' + currMain.CMPNY_DIV,
    'IN_GRP_SEQ=' + currMain.GRP_SEQ,
    'IN_SEQ=' + seq,
  ]

  showOz.value = true
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

        // console.log('chkNull(row.이수시간)', chkNull(row.이수시간))

        if(isNaN(chkNull(row.이수시간))) {
          Message.err(`이수시간은 숫자만 입력 가능합니다.(오류값: ${chkNull(row.이수시간)})`)
          return
        }

        if(chkNull(row.이수일자).replace(/-/gi, '').length > 8 || isNaN(chkNull(row.이수일자).replace(/-/gi, ''))) {
          Message.err(`이수일자에 잘못된 날짜가 있습니다.(오류값: ${chkNull(row.이수일자)})`)
          return
        }

        if(chkNull(row.생년월일).replace(/-/gi, '').length > 8 || isNaN(chkNull(row.생년월일).replace(/-/gi, ''))) {
          Message.err(`생년월일에 잘못된 날짜가 있습니다.(오류값: ${chkNull(row.생년월일)})`)
          return
        }

        saveParams.push({
          CMPNY_DIV: currMain.CMPNY_DIV,
          GRP_SEQ: currMain.GRP_SEQ,
          SEQ: '',
          EDU_NM: chkNull(row.과정명),
          EDU_DT: chkNull(row.이수일자),
          EDU_TM: chkNull(row.이수시간),
          BIRTH_DT: chkNull(row.생년월일),
          TEAM_NM: chkNull(row.소속),
          EMP_NM: chkNull(row.이름),
        })
      }

      commonExecuteApi({ queryId : 'EDUAB0090_SAVE_02', list: saveParams }).then(res => {
        searchSub()
        Message.success('업로드 되었습니다.')
      })
    }
  )
}

const chkNull = data => {
  return data == undefined || data == null ? '' : data
}

onMounted(() => {
  nextTick(() => {
    gridTitleSub.value.disableBtn('btnCreate', true)
    gridTitleSub.value.disableBtn('btnUpdate', true)
    gridTitleSub.value.disableBtn('btnDelete', true)
    gridTitleSub.value.disableBtn('btnExcelUpload', true)
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
            v-model="searchParams.GRP_NM"
            @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
            width="250px"
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="35%" class="h-auto mr-3">
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
          <v-sheet width="65%" class="pa-0 h-auto">
            <IGridTitle
              ref="gridTitleSub"
              :title="$t('그룹 대상자 리스트')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete', 'btnExcelUpload', 'btnSampleDown', 'btnPrint']"
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
   <OZReport :showPop="showOz" :reportName="reportName" :params="ozParams" @close="showOz = $event" />
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