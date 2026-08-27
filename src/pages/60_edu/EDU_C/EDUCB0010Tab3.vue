<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import dayjs from 'dayjs'

defineOptions({
  name:'60_edu-EDU_C-EDUCB0010Tab3',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const grdCnt = ref(null)
const grdDt = ref(null)

const codeList = reactive({
  QUARTER: [
    { COD: '', TXT: '전체', },
    { COD: '1', TXT: '1분기', },
    { COD: '2', TXT: '2분기', },
    { COD: '3', TXT: '3분기', },
    { COD: '4', TXT: '4분기', },
  ]
})

const grdCntProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false, },
  },
  fields: [
    { fieldName: 'TEST_TYPE1_NM', dataType: 'text', header: { text: t('문항유형'), }, editable: false, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'TEST_TYPE1', dataType: 'text', header: { text: t('문항유형'), }, visible: false, },
  ],
  columns: [],
  columnLayout: [],
})

grdCntProps.columns = grdCntProps.fields

const grdDtProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'YEAR', dataType: 'number', numberFormat: '####', header: { text: t('년도'), }, styleName: 'editable_column',
      editor: { type: 'number', editFormat: '####', }, },
    { fieldName: 'QUARTER', dataType: 'text', header: { text: t('분기'), }, styleName: 'editable_column',
      editor: { type: 'dropdown' }, lookupDisplay: true, lookupData: { value: 'COD', label: 'TXT', list: _.filter(codeList.QUARTER, row => row.COD !== ''), }, },
    { fieldName: 'TEST_START_DT', dataType: 'text', header: { text: t('응시시작일'), }, styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }, }, },
    { fieldName: 'TEST_END_DT', dataType: 'text', header: { text: t('응시종료일'), }, styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }, }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'YEAR_ORG', dataType: 'text', header: { text: t('YEAR_ORG'), }, visible: false, },
    { fieldName: 'QUARTER_ORG', dataType: 'text', header: { text: t('QUARTER_ORG'), }, visible: false, },
  ],
  columns: [],
})

grdDtProps.columns = grdDtProps.fields

const searchParamsCnt = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})

const searchParamsDt = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY'),
  QUARTER: '',//Math.ceil(dayjs().format('MM') * 1 / 3) + '',
})

const searchDataCnt = () => {
  grdCnt.value.getDataProvider().setRows([])

  return commonSearchApi({ queryId: 'EDUCB0010_SEARCH_05', param: searchParamsCnt })
}

const afterSearchCnt = res => {
  const result = []
  const temp = res.ORESULT_CUR
  const columnLayout = [
    'TEST_TYPE1_NM',
    {
      name: '문항 수',
      direction: 'horizontal',
      items: [],
      header: { text: t('문항 수') },
    },
  ]

  const testType1 = _.uniqWith(
    temp.map(row => {
      return { CMPNY_DIV: row.CMPNY_DIV, TEST_TYPE1: row.TEST_TYPE1, TEST_TYPE1_NM: row.TEST_TYPE1_NM }
    }),
    (a, b) => {
      return a.CMPNY_DIV === b.CMPNY_DIV && a.TEST_TYPE1 === b.TEST_TYPE1
    }
  )

  // console.log('testType1', testType1)

  const testLevel = _.uniqBy(
    temp.map(row => {
      return { TEST_LEVEL: row.TEST_LEVEL, TEST_LEVEL_NM: row.TEST_LEVEL_NM }
    }),
    'TEST_LEVEL'
  )

  const tempFields = _.cloneDeep(grdCntProps.fields)
  _.remove(tempFields, col => {
    return col.fieldName.indexOf('COL_') > -1
  })

  let sumExp = ''
  testLevel.forEach(rowLevel => {
    tempFields.push({
      fieldName: `COL_${rowLevel.TEST_LEVEL}`,
      dataType: 'number',
      numberFormat: '#,##0',
      editor: { type: 'number', editFormat: '#,##0', },
      header: { text: t(`${rowLevel.TEST_LEVEL_NM}`), },
      styleName: 'editable_column',
    })
    columnLayout[1].items.push(`COL_${rowLevel.TEST_LEVEL}`)

    sumExp = sumExp === '' ? "value['" + `COL_${rowLevel.TEST_LEVEL}` + "']" : (sumExp + " + value['" + `COL_${rowLevel.TEST_LEVEL}` + "']")
  })

  // console.log('sumExp', sumExp)

  tempFields.push({
    fieldName: 'COL_SUM',
    dataType: 'number',
    numberFormat: '#,##0',
    header: { text: t('합계'), },
    editable: false,
    valueExpression: sumExp
  })

  columnLayout[1].items.push('COL_SUM')

  testType1.forEach(rowType => {
    testLevel.forEach(rowLevel => {
      rowType[`COL_${rowLevel.TEST_LEVEL}`] = _.find(temp, { TEST_TYPE1: rowType.TEST_TYPE1, TEST_LEVEL: rowLevel.TEST_LEVEL }).TEST_CNT
    })
    rowType.COL_SUM = null

    result.push(rowType)
  })

  grdCntProps.columns = grdCntProps.fields = tempFields
  grdCntProps.columnLayout = columnLayout

  grdCnt.value.getDataProvider().setFields(grdCntProps.fields)
  grdCnt.value.getGridView().setColumns(grdCntProps.columns)
  grdCnt.value.getGridView().setColumnLayout(grdCntProps.columnLayout)

  grdCnt.value.getDataProvider().setRows(result)
}

const beforeSearchDt = () => {
  if(chkEmpty(searchParamsDt.YEAR)) {
    Message.warn('년도를 입력해주세요.')
    return false
  }

  return true
}

const searchDataDt = () => {
  grdDt.value.getDataProvider().setRows([])

  return commonSearchApi({ queryId: 'EDUCB0010_SEARCH_06', param: searchParamsDt })
}

const afterSearchDt = res => {
  grdDt.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const beforeSaveCnt = () => {
  return true
}

const saveDataCnt = () => {
  const saveParams = []
  const rows = grdCnt.value.getDataProvider().getJsonRows()

  rows.forEach(row => {
    Object.keys(row).forEach(key => {
      if(key.indexOf('COL_') > -1 && key.indexOf('COL_SUM') < 0) {
        saveParams.push({
          CMPNY_DIV: row.CMPNY_DIV,
          TEST_TYPE1: row.TEST_TYPE1,
          TEST_LEVEL: key.replace('COL_', ''),
          TEST_CNT: row[key],
        })
      }
    })
  })

  return commonExecuteApi({ queryId : 'EDUCB0010_SAVE_05', list: saveParams })
}

const afterSaveCnt = () => {
  onButtonsClickCnt({ id: 'btnSearch' }, false)
}

const beforeSaveDt = () => {
  const checkedRows = grdDt.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++) {
    const row = grdDt.value.getDataProvider().getJsonRow(checkedRows[i])

    if(chkEmpty(row.YEAR)) {
      Message.warn('년도를 입력해주세요.')
      return false
    } else if(chkEmpty(row.QUARTER)) {
      Message.warn('분기를 선택해주세요.')
      return false
    }
  }

  return true
}

const saveDataDt = () => {
  const saveParams = []
  const checkedRows = grdDt.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdDt.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'EDUCB0010_SAVE_06', list: saveParams })
}

const afterSaveDt = () => {
  onButtonsClickDt({ id: 'btnSearch' }, false)
}

const onButtonsClickCnt = (btn, showMsg = true) => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdCnt])
      .showMessage(showMsg)
      .setQuery(searchDataCnt)
      .setAfter(afterSearchCnt)
      .run()
  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdCnt, row: 'check' }])
      .setGridList([grdCnt])
      .setBefore(beforeSaveCnt)
      .setQuery(saveDataCnt)
      .setAfter(afterSaveCnt)
      .run()
  }
}

const onButtonsClickDt = (btn, showMsg = true) => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdDt])
      .showMessage(showMsg)
      .setBefore(beforeSearchDt)
      .setQuery(searchDataDt)
      .setAfter(afterSearchDt)
      .run()
  } else if(btn.id === 'btnCreate') {
    const row = grdDt.value.getDataProvider().addRow({
      CMPNY_DIV: searchParamsDt.CMPNY_DIV,
      YEAR: dayjs().format('YYYY'),
    })

    grdDt.value.getGridView().setCurrent({ dataRow: row })
    // grdDt.value.getGridView().checkRow(row)
  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdDt, row: 'check' }])
      .setGridList([grdDt])
      .setBefore(beforeSaveDt)
      .setQuery(saveDataDt)
      .setAfter(afterSaveDt)
      .run()
  } else if(btn.id === 'btnDelete') {
    const checkedRows = grdDt.value.getGridView().getCheckedRows(true)
    const deleteParams = []

    if(checkedRows.length < 1) {
      Message.warn(t('선택한 데이터가 없습니다.'))
      return
    }

    for (const rowIdx of checkedRows) {
      const data = grdDt.value.getDataProvider().getJsonRow(rowIdx)
      deleteParams.push(data)
    }

    if(!_.some(deleteParams, item => !chkEmpty(item.YEAR_ORG) )) {
      grdDt.value.getDataProvider().removeRows(checkedRows)
      grdDt.value.getGridView().checkRows(checkedRows, false)
    } else {
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdDt, row: 'check' }])
        .setGridList([grdDt])
        .setQuery(() => { return commonExecuteApi({ queryId : 'EDUCB0010_DELETE_06', list: deleteParams }) })
        .setAfter(afterSaveDt)
        .run()
    }
  }
}

const chkEmpty = data => {
  return data == undefined || data == null || data === ''
}

onMounted(async () => {
  vm.$nextTick(() => {
    onButtonsClickCnt({ id: 'btnSearch' }, false)
    onButtonsClickDt({ id: 'btnSearch' }, false)
  })
})
</script>

<template>
  <div class="h-grow px-2 pt-1 pb-2">
    <v-sheet width="55%" class="h-auto">
      <IGridTitle
        title="출제 관리"
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClickCnt"
      />
      <RealGrid
        ref="grdCnt"
        :grid-view-option="grdCntProps.gridViewOption"
        :keys="grdCntProps.keys" 
        :fields="grdCntProps.fields"
        :columns="grdCntProps.columns"
        :column-layout="grdCntProps.columnLayout"
      />
    </v-sheet>
    <v-sheet width="45%" class="h-auto ml-3">
      <IGridTitle
        title="응시 관리"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClickDt"
      />
      <v-sheet class="searchArea">
        <div class="d-flex align-center">
          <i-input
            width="160px"
            :label="$t('년도')"
            type="number"
            :min="1900"
            :max="3000"
            v-model="searchParamsDt.YEAR"
            oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
            required
          />
          <i-select
            width="160px"
            :label="$t('분기')"
            :items="codeList.QUARTER"
            item-value="COD"
            item-title="TXT"
            v-model="searchParamsDt.QUARTER"
          />
        </div>
      </v-sheet>
      <RealGrid
        ref="grdDt"
        :grid-view-option="grdDtProps.gridViewOption"
        :keys="grdDtProps.keys" 
        :fields="grdDtProps.fields"
        :columns="grdDtProps.columns"
      />
    </v-sheet>
  </div>
</template>
  
<style scoped lang="scss">
</style>