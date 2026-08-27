<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCompanyList, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import _ from 'lodash'

defineOptions({
  name: '30_safety-SAF_C-SAFCC0020',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const menuTitle = ref(null)
const titleMain = ref(null)
const titleSub = ref(null)
const titleSub2 = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const grdSub2 = ref(null)

const grdMainProps = reactive({
  gridViewOption: {
    // edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  fields: [
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', header: { text: t('작업표준번호'), }, styleName: 'left-column', editable: false, },
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', header: { text: t('작업표준명'), }, styleName: 'left-column', editable: false, },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서명'), }, styleName: 'left-column', editable: false, },
    { fieldName: 'CHK_REQUIRED', dataType: 'text', header: { text: t('점검 구분'), }, styleName: 'left-column', editable: false, },
    { fieldName: 'LDIV_CD', dataType: 'text', header: { text: t('작업 구분'), }, styleName: 'editable_column left-column',
      lookupDisplay: true, editor: { type: 'dropdown', }, },
    
    { fieldName: 'MAX_REV', dataType: 'text', header: { text: t('차수 번호'), }, visible: false, },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사코드'), }, visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드'), }, visible: false, },
    { fieldName: 'CORP_ASGN_CD', dataType: 'text', header: { text: t('주관부서코드'), }, visible: false, },
    { fieldName: 'CORP_ASGN_NM', dataType: 'text', header: { text: t('주관부서명'), }, visible: false, },
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
    { fieldName: 'LDIV_NM', dataType: 'text', header: { text: t('구분명'), }, styleName: 'editable_column left-column', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사코드'), }, visible: false, },
    { fieldName: 'LDIV_CD', dataType: 'text', header: { text: t('구분코드'), }, visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부'), }, visible: false, },
  ],
  columns: [],
})

const grdSub2Props = reactive({
  gridViewOption: {
    // edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  fields: [
    { fieldName: 'MDIV_NM', dataType: 'text', header: { text: t('점검사항'), }, styleName: 'editable_column left-column', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사코드'), }, visible: false, },
    { fieldName: 'LDIV_CD', dataType: 'text', header: { text: t('작업 구분'), }, visible: false, },
    { fieldName: 'MDIV_CD', dataType: 'text', header: { text: t('점검 구분'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields
grdSub2Props.columns = grdSub2Props.fields

const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  LDIV_CD: [],
})

const getCode = () => {
  Promise.all([
    getCompanyList(),
    commonSearchApi({
      queryId: 'searchBSNS',
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        USE_DIV: 'N',
      },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV: 'Y',
      },
    }),
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.CMPNY_DIV.splice(0, 0, { COD: '', TXT: '전체', })

    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.BSNS_CD.splice(0, 0, { BSNS_CD: '', BSNS_NM: '전체', })

    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.DEPT_CD.splice(0, 0, { DEPT_CD: '', DEPT_NM: '전체', })
  })
}

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: 'AK00',
  DEPT_CD: ''
})

const searchAll = () => {
  Promise.all([
    commonSearchApi({ queryId: 'SAFCC0020_SEARCH_01', param: searchParams }),
    commonSearchApi({ queryId: 'SAFCC0020_SEARCH_02', param: {} }),
  ]).then(res => {
    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
    codeList.LDIV_CD = _.cloneDeep(res[1].ORESULT_CUR)
    grdMain.value.setBindingColumn(
      'LDIV_CD',
      codeList.LDIV_CD,
      'LDIV_CD',
      'LDIV_NM',
    )

    grdSub.value.getDataProvider().setRows(res[1].ORESULT_CUR)
    
    if(res[1].ORESULT_CUR.length > 0) {
      grdSub.value.getGridView().setCurrent({ itemIndex: 0 })
    }

    Message.success(t('조회되었습니다.'))
  })
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    searchAll()
  }
}

const changeCmpnyDiv = () => {
  commonSearchApi({
    queryId: 'searchBSNS',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      USE_DIV: 'N',
    },
  }).then(res => {
    codeList.BSNS_CD = res.ORESULT_CUR
    codeList.BSNS_CD.splice(0, 0, { BSNS_CD: '', BSNS_NM: '전체', })
    searchParams.BSNS_CD = ''

    codeList.DEPT_CD = [{ DEPT_CD: '', DEPT_NM: '전체', }]
    searchParams.DEPT_CD = ''
  })
}

const changeBsnsCd = () => {
  commonSearchApi({
    queryId: 'searchDept3',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD
    },
  }).then(res => {
    codeList.DEPT_CD = res.ORESULT_CUR
    codeList.DEPT_CD.splice(0, 0, { DEPT_CD: '', DEPT_NM: '전체', })
    searchParams.DEPT_CD = ''
  })
}

const subRowChanged = async (grid, oldIdx, newIdx) => {
  if(newIdx < 0){
    return
  }

  grdSub2.value.getDataProvider().setRows([])

  const currMain = await grdSub.value.getDataProvider().getJsonRow(grdSub.value.getGridView().getCurrent().dataRow)

  if(currMain.LDIV_CD != null) {
    commonSearchApi({ queryId: 'SAFCC0020_SEARCH_03', param: currMain }).then(res => {
      grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

const beforeSaveMain = () => {
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++) {
    const ldivCd = grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).LDIV_CD

    if(ldivCd == undefined || ldivCd == null || ldivCd === '') {
      Message.warn(t('작업 구분은 필수 입력 항목입니다.'))
      return false
    }
  }

  return true
}

const saveMain = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdMain.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'SAFCC0020_SAVE_01', list: saveParams })
}

const afterSaveMain = () => {
  grdMain.value.getGridView().setAllCheck(false)

  commonSearchApi({ queryId: 'SAFCC0020_SEARCH_01', param: searchParams }).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const deleteMain = () => {
  const deleteParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    deleteParams.push(grdMain.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'SAFCC0020_DELETE_01', list: deleteParams })
}

const onMainButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSaveMain)
      .setQuery(saveMain)
      .setAfter(afterSaveMain)
      .run()
  } else if(btnId === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteMain)
      .setAfter(afterSaveMain)
      .run()
  }
}

const beforeSaveSub = () => {
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++) {
    const ldivNm = grdSub.value.getDataProvider().getJsonRow(checkedRows[i]).LDIV_NM

    if(ldivNm == undefined || ldivNm == null || ldivNm === '') {
      Message.warn(t('구분명은 필수 입력 항목입니다.'))
      return false
    }
  }

  return true
}

const saveSub = () => {
  const saveParams = []
  const checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdSub.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'SAFCC0020_SAVE_02', list: saveParams })
}

const afterSaveSub = () => {
  grdSub.value.getGridView().setAllCheck(false)

  commonSearchApi({ queryId: 'SAFCC0020_SEARCH_02', param: {} }).then(res => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)

    codeList.LDIV_CD = _.cloneDeep(res.ORESULT_CUR)
    grdMain.value.setBindingColumn(
      'LDIV_CD',
      codeList.LDIV_CD,
      'LDIV_CD',
      'LDIV_NM',
    )
  })
}

const onSubButtonsClick = async btn => {
  const btnId = btn.id

  if(btnId === 'btnCreate') {
    const row = grdSub.value.getDataProvider().addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
    })

    grdSub.value.getGridView().setCurrent({ dataRow: row })
    grdSub.value.getGridView().checkRow(row)
  } else if(btnId === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSaveSub)
      .setQuery(saveSub)
      .setAfter(afterSaveSub)
      .run()
  } else if(btnId === 'btnDelete') {
    const checkedRows = grdSub.value.getGridView().getCheckedRows(true)
    const deleteParams = []

    if(checkedRows.length < 1) {
      Message.warn(t('삭제할 데이터가 없습니다.'))
      return
    }

    for (const rowIdx of checkedRows) {
      const data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
      deleteParams.push(data)
    }

    if(_.some(deleteParams, item => item.LDIV_CD != undefined && item.LDIV_CD != null && item.LDIV_CD !== '')) {
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdSub, row: 'check' }])
        .setGridList([grdSub])
        .setConfirmMessage(t('작업구분 삭제시 점검항목도 삭제됩니다. 삭제 하시겠습니까?'))
        .setQuery(() => { return commonExecuteApi({ queryId : 'SAFCC0020_DELETE_02', list: deleteParams }) })
        .setAfter(afterSaveSub)
        .run()
    } else {
      grdSub.value.getDataProvider().removeRows(checkedRows)
      grdSub.value.getGridView().checkRows(checkedRows, false)
    }
  }
}

const beforeSaveSub2 = () => {
  const checkedRows = grdSub2.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++) {
    const mldivNm = grdSub2.value.getDataProvider().getJsonRow(checkedRows[i]).MDIV_NM

    if(mldivNm == undefined || mldivNm == null || mldivNm === '') {
      Message.warn(t('점검사항은 필수 입력 항목입니다.'))
      return false
    }
  }

  return true
}

const saveSub2 = () => {
  const saveParams = []
  const checkedRows = grdSub2.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(dataRow => {
    saveParams.push(grdSub2.value.getDataProvider().getJsonRow(dataRow))
  })

  return commonExecuteApi({ queryId : 'SAFCC0020_SAVE_03', list: saveParams })
}

const afterSaveSub2 = async () => {
  grdSub2.value.getGridView().setAllCheck(false)
  grdSub2.value.getDataProvider().setRows([])

  const currMain = await grdSub.value.getDataProvider().getJsonRow(grdSub.value.getGridView().getCurrent().dataRow)

  if(currMain.LDIV_CD != null) {
    commonSearchApi({ queryId: 'SAFCC0020_SEARCH_03', param: currMain }).then(res => {
      grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

const onSub2ButtonsClick = async btn => {
  const btnId = btn.id

  if(btnId === 'btnCreate') {
    const currSub = await grdSub.value.getDataProvider().getJsonRow(grdSub.value.getGridView().getCurrent().dataRow)

    if(currSub.LDIV_CD == undefined || currSub.LDIV_CD == null || currSub.LDIV_CD === '') {
      Message.warn(t('작업구분을 먼저 저장 후 추가해 주세요.'))
      return false
    }

    const row = grdSub2.value.getDataProvider().addRow({
      CMPNY_DIV: currSub.CMPNY_DIV,
      LDIV_CD: currSub.LDIV_CD,
    })

    grdSub2.value.getGridView().setCurrent({ dataRow: row })
    grdSub2.value.getGridView().checkRow(row)
  } else if(btnId === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdSub2, row: 'check' }])
      .setGridList([grdSub2])
      .setBefore(beforeSaveSub2)
      .setQuery(saveSub2)
      .setAfter(afterSaveSub2)
      .run()
  } else if(btnId === 'btnDelete') {
    const checkedRows = grdSub2.value.getGridView().getCheckedRows(true)
    const deleteParams = []

    if(checkedRows.length < 1) {
      Message.warn(t('삭제할 데이터가 없습니다.'))
      return
    }

    for (const rowIdx of checkedRows) {
      const data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
      deleteParams.push(data)
    }

    if(_.some(deleteParams, item => item.MDIV_CD != undefined && item.MDIV_CD != null && item.MDIV_CD !== '')) {
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdSub2, row: 'check' }])
        .setGridList([grdSub2])
        .setQuery(() => { return commonExecuteApi({ queryId : 'SAFCC0020_DELETE_03', list: deleteParams }) })
        .setAfter(afterSaveSub2)
        .run()
    } else {
      grdSub2.value.getDataProvider().removeRows(checkedRows)
      grdSub2.value.getGridView().checkRows(checkedRows, false)
    }
  }
}

onMounted(() => {
  nextTick(() => {
    getCode()
    grdMain.value.getGridView().filterPanel.visible = true
    grdSub.value.getGridView().filterPanel.visible = true
    grdSub2.value.getGridView().filterPanel.visible = true
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
          <i-select
            :label="$t('회사')"
            v-model="searchParams.CMPNY_DIV"
            :items="codeList.CMPNY_DIV"
            item-value="COD"
            item-title="TXT"
            width="250px"
            disabled
            @update:model-value="changeCmpnyDiv"
            />
          <i-select
            :label="$t('사업부')"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            width="250px"
            disabled
            @update:model-value="changeBsnsCd"
            />
          <i-select
            :label="$t('부서')"
            v-model="searchParams.DEPT_CD"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
            width="250px"
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="70%" class="h-auto mr-3">
            <IGridTitle 
              ref="titleMain"
              :title="$t('체크리스트 관리')"
              :button-list="['btnUpdate', 'btnDelete']"
              @click-button="onMainButtonsClick"
            />
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
          <v-sheet width="30%" class="pa-0 h-auto">
            <v-sheet class="h-auto">
              <IGridTitle
                ref="titleSub"
                :title="$t('작업구분관리')"
                :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                @click-button="onSubButtonsClick"
              />
              <RealGrid
                ref="grdSub"
                :grid-view-option="grdSubProps.gridViewOption"
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
                @on-current-row-changed="subRowChanged"
              />
            </v-sheet>
            <v-sheet class="h-auto mt-2">
              <IGridTitle
                ref="titleSub2"
                :title="$t('점검사항관리')"
                :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                @click-button="onSub2ButtonsClick"
              />
              <RealGrid
                ref="grdSub2"
                :grid-view-option="grdSub2Props.gridViewOption"
                :fields="grdSub2Props.fields"
                :columns="grdSub2Props.columns"
              />
            </v-sheet>
          </v-sheet>
        </div>
      </div>
   </v-card-text>
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