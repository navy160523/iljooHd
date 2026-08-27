<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

defineOptions({
  name:'60_edu-EDU_C-EDUCB0010Tab2',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const grdMain = ref(null)
const grdSub = ref(null)
const gridTitleSub = ref(null)

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'TEST_ITEM', dataType: 'text', header: { text: t('문항ID'), }, width: '65', },
    { fieldName: 'TEST_DESC', dataType: 'text', header: { text: t('내용'), }, width: '350',
      styleName: 'editable_column left-column', },
    { fieldName: 'FIRST_ANSW', dataType: 'text', header: { text: t('첫 선택항목'), }, width: '240',
      styleName: 'left-column', editable: false, },
    { fieldName: 'TEST_TYPE1', dataType: 'text', header: { text: t('문항유형'), }, width: '90',
      styleName: 'editable_column', editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'TEST_TYPE2', dataType: 'text', header: { text: t('유형항목'), }, width: '190', styleName: 'editable_column',
      lookupDisplay: true, editor: { type: 'dropdown' }, lookupSourceId: 'testType2', lookupKeyFields: ['TEST_TYPE1', 'TEST_TYPE2'],
    },
    { fieldName: 'TEST_LEVEL', dataType: 'text', header: { text: t('난이도'), }, width: '65',
      styleName: 'editable_column', editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'ORDER_NUM', dataType: 'number', numberFormat: '#,###', header: { text: t('순서'), }, width: '65',
      styleName: 'editable_column', editor: { type: 'number', editFormat: '#,###' }, },
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부'), }, width: '65', editable: false,
      styleName: 'editable_column change_back_check', renderer: { type: 'check', trueValues: 'Y', falseValues: 'N', }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const grdSubProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'ANSW_DESC', dataType: 'text', header: { text: t('내용'), }, width: '320',
      styleName: 'editable_column left-column', },
    { fieldName: 'ORDER_NUM', dataType: 'number', numberFormat: '#,###', header: { text: t('순서'), }, width: '65',
      styleName: 'editable_column', editor: { type: 'number', editFormat: '#,###' }, },
    { fieldName: 'PASS_YN', dataType: 'text', header: { text: t('정답여부'), }, width: '65',
      styleName: 'editable_column', editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부'), }, width: '65', editable: false,
      styleName: 'editable_column change_back_check', renderer: { type: 'check', trueValues: 'Y', falseValues: 'N', }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'TEST_ITEM', dataType: 'text', header: { text: t('TEST_ITEM'), }, visible: false, },
    { fieldName: 'ANSW_ITEM', dataType: 'text', header: { text: t('ANSW_ITEM'), }, visible: false, },
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  ANSW_DESC: '',
  TEST_TYPE1: '',
  TEST_TYPE2: '',
  TEST_LEVEL: '',
  USE_YN: 'Y',
})

const codeList = reactive({
  TEST_TYPE1: [],
  TEST_TYPE2: [],
  TEST_LEVEL: [],
  EQUIP_LIST: [],
  JIC_LIST: [],
  PASS_YN: [
    { COD: 'Y', TXT: '예' },
    { COD: 'N', TXT: '아니오' },
  ]
})

const getSystemCode = () => {
  Promise.all([
    getCodeList('HHID270A'),
    getCodeList('HHID270B'),
    commonSearchApi({ queryId: 'EDUCB0010_SEARCH_TEST_TYPE2', param: { CMPNY_DIV: searchParams.CMPNY_DIV, TEST_TYPE1: 'B' } }),
    commonSearchApi({ queryId: 'EDUCB0010_SEARCH_TEST_TYPE2', param: { CMPNY_DIV: searchParams.CMPNY_DIV, TEST_TYPE1: 'C' } }),
  ]).then(res => {
    codeList.TEST_TYPE1 = _.cloneDeep(res[0].ORESULT_CUR)
    codeList.TEST_TYPE1.splice(0, 0, { COD: '', TXT: '전체', })
    
    codeList.TEST_LEVEL = _.cloneDeep(res[1].ORESULT_CUR)
    codeList.TEST_LEVEL.splice(0, 0, { COD: '', TXT: '전체', })

    codeList.JIC_LIST = _.cloneDeep(res[2].ORESULT_CUR)

    codeList.EQUIP_LIST = _.cloneDeep(res[3].ORESULT_CUR)

    grdMain.value.setBindingColumn('TEST_TYPE1', res[0].ORESULT_CUR, 'COD', 'TXT')
    grdMain.value.setBindingColumn('TEST_LEVEL', res[1].ORESULT_CUR, 'COD', 'TXT')

    grdSub.value.setBindingColumn('PASS_YN', codeList.PASS_YN, 'COD', 'TXT')

    grdMain.value.getGridView().setLookups([{
      id: 'testType2',
      levels: 2,
      keys: [...codeList.JIC_LIST.map(item => { return ['B', item.COD] }), ...codeList.EQUIP_LIST.map(item => { return ['C', item.COD] })],
      values: [...codeList.JIC_LIST.map(item => item.TXT), ...codeList.EQUIP_LIST.map(item => item.TXT)],
    }])
  })
}

const chkEmpty = data => {
  return data == undefined || data == null || data === ''
}

const searchDataMain = () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])

  return commonSearchApi({ queryId: 'EDUCB0010_SEARCH_03', param: searchParams })
}

const afterSearchMain = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onButtonsClick = (btn, showMsg = true) => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .showMessage(showMsg)
      .setQuery(searchDataMain)
      .setAfter(afterSearchMain)
      .run()
  }
}

const beforeSaveMain = () => {
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++) {
    const row = grdMain.value.getDataProvider().getJsonRow(checkedRows[i])

    if(chkEmpty(row.TEST_DESC)) {
      Message.warn('시험문항 내용을 입력해주세요.')
      return false
    } else if(chkEmpty(row.TEST_TYPE1)) {
      Message.warn('문항유형을 선택해주세요.')
      return false
    } else if((row.TEST_TYPE1 === 'B' || row.TEST_TYPE1 === 'C') && chkEmpty(row.TEST_TYPE2)) {
      Message.warn('유형항목을 선택해주세요.')
      return false
    } else if(chkEmpty(row.TEST_LEVEL)) {
      Message.warn('난이도를 선택해주세요.')
      return false
    }
  }

  return true
}

const saveDataMain = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdMain.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'EDUCB0010_SAVE_03', list: saveParams })
}

const afterSaveMain = () => {
  onButtonsClick({ id: 'btnSearch' }, false)
}

const beforeSaveSub = () => {
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  const allData = grdSub.value.getDataProvider().getJsonRows()

  for(let i = 0; i < checkedRows.length; i++) {
    const row = grdSub.value.getDataProvider().getJsonRow(checkedRows[i])

    if(chkEmpty(row.ANSW_DESC)) {
      Message.warn('선택항목 내용을 입력해주세요.')
      return false
    }
  }

  if(!_.some(allData, { PASS_YN: 'Y' })) {
    Message.warn('선택항목 중 정답이 없습니다.')
    return false
  }

  return true
}

const saveDataSub = () => {
  const saveParams = []
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdSub.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'EDUCB0010_SAVE_04', list: saveParams })
}

const afterSaveSub = () => {
  searchSub()
}

const onButtonsClickMain = btn => {
  if(btn.id === 'btnCreate') {
    const row = grdMain.value.getDataProvider().addRow({
      CMPNY_DIV: searchParams.CMPNY_DIV,
      TEST_TYPE1: searchParams.TEST_TYPE1,
      TEST_TYPE2: searchParams.TEST_TYPE2,
      TEST_LEVEL: searchParams.TEST_LEVEL,
      USE_YN: 'Y',
    })

    grdMain.value.getGridView().setCurrent({ dataRow: row })
    // grdMain.value.getGridView().checkRow(row)
  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSaveMain)
      .setQuery(saveDataMain)
      .setAfter(afterSaveMain)
      .run()
  }
}

const onButtonsClickSub = async btn => {
  if(btn.id === 'btnCreate') {
    const currMain = await grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)

    const row = grdSub.value.getDataProvider().addRow({
      CMPNY_DIV: currMain.CMPNY_DIV,
      TEST_ITEM: currMain.TEST_ITEM,
      PASS_YN: 'N',
      USE_YN: 'Y',
    })

    grdSub.value.getGridView().setCurrent({ dataRow: row })
    // grdSub.value.getGridView().checkRow(row)
  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSaveSub)
      .setQuery(saveDataSub)
      .setAfter(afterSaveSub)
      .run()
  }
}

const searchSub = async () => {
  grdSub.value.getDataProvider().setRows([])

  const currMain = await grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)

  if(chkEmpty(currMain.TEST_ITEM)) {
    gridTitleSub.value.disableBtn('btnCreate', true)
    gridTitleSub.value.disableBtn('btnUpdate', true)
  } else {
    gridTitleSub.value.disableBtn('btnCreate', false)
    gridTitleSub.value.disableBtn('btnUpdate', false)

    commonSearchApi({
      queryId: 'EDUCB0010_SEARCH_04',
      param: {
        CMPNY_DIV: currMain.CMPNY_DIV,
        TEST_ITEM: currMain.TEST_ITEM,
        USE_YN: searchParams.USE_YN,
      }
    }).then(res => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

const onEditChangeMain = (grid, index, value) => {
  if(index.fieldName === 'TEST_TYPE1') {
    grid.setValue(index.itemIndex, 'TEST_TYPE2', '')
  }
}

const onCurrentRowChangedMain = async (grid, oldIdx, newIdx) => {
  if(newIdx < 0){
    return
  }

  searchSub()
}

const onEditChangeSub = (grid, index, value) => {
  if(index.fieldName === 'PASS_YN') {
    grid.commit()
    
    if(value === 'Y') {
      grdSub.value.getDataProvider().beginUpdate()

      try {
        for(let i = 0; i < grdSub.value.getDataProvider().getRowCount(); i++) {
          if(i !== index.dataRow) {
            grdSub.value.getDataProvider().setValue(i, 'PASS_YN', 'N')
          }
        }
      } finally {
        grdSub.value.getDataProvider().endUpdate()
      }

      grdSub.value.getGridView().checkAll(true)
    }
  }
}

watch(
  () => searchParams.TEST_TYPE1,
  () => {
    let result = []

    if(searchParams.TEST_TYPE1 === 'B') {
      result = _.cloneDeep(codeList.JIC_LIST)
    } else if(searchParams.TEST_TYPE1 === 'C') {
      result = _.cloneDeep(codeList.EQUIP_LIST)
    }

    result.splice(0, 0, { COD: '', TXT: '전체', })

    codeList.TEST_TYPE2 = _.cloneDeep(result)

    searchParams.TEST_TYPE2 = ''
  },
  { immediate: true, },
)

onMounted(async () => {
  vm.$nextTick(() => {
    gridTitleSub.value.disableBtn('btnCreate', true)
    gridTitleSub.value.disableBtn('btnUpdate', true)

    getSystemCode()
    onButtonsClick({ id: 'btnSearch' }, false)
  })
})
</script>

<template>
  <div class="h-grow px-2 pt-1 pb-2">
    <v-sheet class="h-auto">
      <IGridTitle
        title="시험문항 관리"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="searchArea">
        <div class="d-flex align-center">
          <i-input
            :label="$t('선택항목 내용')"
            v-model="searchParams.ANSW_DESC"
            @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
            width="300px"
          />
          <i-select
            :label="$t('문항유형')"
            v-model="searchParams.TEST_TYPE1"
            :items="codeList.TEST_TYPE1"
            item-value="COD"
            item-title="TXT"
            width="225px"
          />
          <i-select
            :label="$t('유형항목')"
            v-model="searchParams.TEST_TYPE2"
            :items="codeList.TEST_TYPE2"
            item-value="COD"
            item-title="TXT"
            width="300px"
          />
          <i-select
            :label="$t('난이도')"
            v-model="searchParams.TEST_LEVEL"
            :items="codeList.TEST_LEVEL"
            item-value="COD"
            item-title="TXT"
            width="175px"
          />
          <v-checkbox
            v-model="searchParams.USE_YN"
            label="사용여부"
            true-value="Y"
            false-value="N"
          />
        </div>
      </v-sheet>
      <div class="h-grow">
        <v-sheet width="65%" class="h-auto">
          <IGridTitle
            title="시험문항"
            :button-list="['btnCreate', 'btnUpdate']"
            @click-button="onButtonsClickMain"
          />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onEditChange="onEditChangeMain"
            @onCurrentRowChanged="onCurrentRowChangedMain"
          />
        </v-sheet>
        <v-sheet width="35%" class="h-auto ml-3">
          <IGridTitle
            ref="gridTitleSub"
            title="선택항목"
            :button-list="['btnCreate', 'btnUpdate']"
            @click-button="onButtonsClickSub"
          />
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys" 
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            @onEditChange="onEditChangeSub"
          />
        </v-sheet>
      </div>
    </v-sheet>
  </div>
</template>
  
<style scoped lang="scss">
</style>