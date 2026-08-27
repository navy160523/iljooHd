<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import { commonSearchApi, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import OPRAI0010Popup from '@/pages/80_operation/OPR_A/OPRAI0010Popup.vue'

defineOptions({
  name:'80_operation-OPR_A-OPRAI0010',
})

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t

const refOPRAI0010Popup = ref(null)
const menuTitle = ref(null)
const gridTitle = ref(null)
const grdMain = ref(null)
// const grdSub = ref(null)
const lanList = ref([])

const frontCol = [
  { fieldName: 'FLAG', dataType: 'text', header: { text: t('FLAG') }, visible: false },
  { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ') }, visible: false },
  {
    fieldName: 'CONTENT', dataType: 'text', header: { text: t('내용') }, styleName: 'left-column',
    width: 200, editable: false,
  },
]

const endCol = [
  { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('등록일') }, editable: false },
  { fieldName: 'INSERT_USER_NM', dataType: 'text', header: { text: t('등록자') }, editable: false },
  { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일') }, editable: false },
  { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자') }, editable: false },
]

const searchMainParams = reactive({
  CONTENT: '',
})

// const searchSubParams = reactive({
//   SEQ: '',
// })

const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['SEQ'],
  fields : [],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

// const grdSubProps = reactive({
//   gridViewOption : { checkBar: {  visible: true }, stateBar: { visible: false } },
//   keys : ['SEQ', 'LANG'],
//   fields : [
//     { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ') }, visible: false },
//     {
//       fieldName: 'LANG', dataType: 'text', header: { text: t('언어') }, width: '30', required: true,
//       lookupDisplay: true,
//       editor: {
//         type: 'dropdown',
//       },
//       width: '125',
//     },
//     {
//       fieldName: 'CONTENT', dataType: 'text', header: { text: t('내용') }, styleName: 'left-column',
//       editor: {
//         maxLength: 400,
//       },
//       width: '350',
//     },
//     { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('등록일') }, editable: false },
//     { fieldName: 'INSERT_USER_NM', dataType: 'text', header: { text: t('등록자') }, editable: false },
//     { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일') }, editable: false },
//     { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자') }, editable: false },
//   ],
//   columns : [],
// })

// grdSubProps.columns = grdSubProps.fields

const searchMain = () => {
  // console.log('searchMain searchMainParams', searchMainParams)

  return commonSearchApi({ queryId : 'OPRAI0010_SEARCH_01', param: searchMainParams })
}

const afterSearchMain = res => {
  // console.log('afterSearchMain res', res.ORESULT_CUR)

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  // grdMain.value.getGridView().setFixedOptions({
  //   colCount: 1,
  // })
}

// const searchSub = idx => {
//   // console.log('searchSub param', param)
//   let row = grdMain.value.getDataProvider().getJsonRow(idx)
//   searchSubParams.SEQ = row.SEQ

//   return commonSearchApi({ queryId : 'OPRAI0010_SEARCH_02', param: searchSubParams })
// }

// const afterSearchSub = res => {
//   // console.log('afterSearchSub res', res.ORESULT_CUR)

//   grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
// }

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchMain)
      .setAfter(afterSearchMain)
      .run()
  }
}

const mainCheck = async () => {
  let result = false
  let checkedRow = await grdMain.value.getGridView().getCheckedRows()
  
  if(checkedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
  } else {
    result = true
  }

  return result
}

const mainSaveData = async () => {
  let checkedRow = await grdMain.value.getGridView().getCheckedRows()
  let param = []

  // let paramSub = []

  await checkedRow.forEach(async item => {
    let data = await grdMain.value.getDataProvider().getJsonRow(item)
    data.LANG = 'KO'
    data.USER_ID = userStore.userId

    param.push(data)
  })

  param.forEach(itemMain => {
    lanList.value.forEach(itemLan => {
      const item = {
        SEQ: itemMain.SEQ,
        LANG: itemLan.COD,
        CONTENT: itemMain[itemLan.COD],
        USER_ID: userStore.userId,
      }

      param.push(item)
    })
  })

  // console.log('param', param)

  // console.log('paramSub', paramSub)
  // console.log('paramMain', paramMain)

  // return null

  return commonExecuteApi({ queryId : 'OPRAI0010_SAVE_01', list: param })
}

const mainDeleteData = async () => {
  let checkedRow = await grdMain.value.getGridView().getCheckedRows()
  let param = []

  await checkedRow.forEach(async item => {
    let data = await grdMain.value.getDataProvider().getJsonRow(item)

    param.push(data)
  })

  // console.log('param', param)

  return commonExecuteApi({ queryId : 'OPRAI0010_DELETE_01', list: param })
}

const onGrdMainButtonsClick = btn => {
  if(btn.id === 'btnCreate') {
    // if(grdSub.value.getDataProvider().getRowCount() > 0) {
    //   // console.log('abc')
    //   grdSub.value.getDataProvider().setRows('')
    // }

    commonSearchApi({ queryId : 'OPRAI0010_GET_SEQ', param: {} }).then(res => {
      const newSeq = res.ORESULT_CUR[0].SEQ + ''

      refOPRAI0010Popup.value.openPopup({
        isNew: true,
        data: {
          LANG_LIST: lanList.value,
          SEQ: newSeq,
        },
      })
    })
  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(mainSaveData)
      .setAfter(() => { onButtonsClick({ id : 'btnSearch' }) })
      .run()
  } else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(mainDeleteData)
      .setAfter(() => { onButtonsClick({ id : 'btnSearch' }) })
      .run()
  }
}

// const funcSearchSub = (idx, showMsg = true) => {
//   new queryFlowHelper(vm, t)
//     .setQuery(searchSub, idx)
//     .setAfter(afterSearchSub)
//     .showMessage(showMsg)
//     .run()
// }

// const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
//   if(newIdx > -1) {
//     const row = grdMain.value.getDataProvider().getJsonRow(newIdx)

//     // if(row.SEQ) {
//     if(row.FLAG !== 'C') {
//       funcSearchSub(newIdx)
//     } else {
//       grdSub.value.getDataProvider().setRows('')
//     }
//   } else {
//     grdSub.value.getDataProvider().setRows('')
//   }
// }

// const subCheck = async () => {
//   let result = false
//   let checkedRow = await grdSub.value.getGridView().getCheckedRows()
  
//   if(checkedRow.length === 0) {
//     Message.warn(t('선택한 데이터가 없습니다.'))
//   } else {
//     result = true
//   }

//   return result
// }

// const subSaveData = async () => {
//   let checkedRow = await grdSub.value.getGridView().getCheckedRows()
//   let param = []

//   await checkedRow.forEach(async item => {
//     let data = await grdSub.value.getDataProvider().getJsonRow(item)
//     data.USER_ID = userStore.userId
//     // data.STATE = grdSub.value.getDataProvider().getRowState(item) === 'created' ? 'C' : 'U'
//     param.push(data)
//   })

//   // console.log('param', param)

//   return commonExecuteApi({ queryId : 'OPRAI0010_SAVE_02', list: param })
// }

// const subDeleteData = async () => {
//   let checkedRow = await grdSub.value.getGridView().getCheckedRows()
//   let param = []

//   await checkedRow.forEach(async item => {
//     let data = await grdSub.value.getDataProvider().getJsonRow(item)

//     param.push(data)
//   })

//   // console.log('param', param)

//   return commonExecuteApi({ queryId : 'OPRAI0010_DELETE_02', list: param })
// }

// const onGrdSubButtonsClick = async btn => {
//   // console.log('masterIdx', masterIdx)
//   // console.log('masterRow', masterRow)
//   // console.log('masterRow.SEQ', masterRow.SEQ)

//   if(btn.id === 'btnCreate') {
//     const masterIdx = await grdMain.value.getGridView().getCurrent().dataRow

//     if(masterIdx < 0) {
//       Message.err(t('한국어를 선택해주세요.'))

//       return
//     }

//     const masterRow = await grdMain.value.getDataProvider().getJsonRow(masterIdx)

//     if(!masterRow || masterRow.FLAG === 'C') {
//       Message.err(t('한국어를 먼저 저장해주세요.'))

//       return
//     }

//     grdSub.value.addRow({
//       SEQ: masterRow.SEQ,
//     })
//   } else if(btn.id === 'btnUpdate') {
//     new saveFlowHelper(vm, t)
//       .setTargetGridRow([{ grid: grdSub, row: 'check' }])
//       .setGridList([grdSub])
//       .setBefore(subCheck)
//       .setQuery(subSaveData)
//       .setAfter(async () => {
//         funcSearchSub(grdMain.value.getGridView().getCurrent().dataRow, false)
//       })
//       .run()
//   } else if(btn.id === 'btnDelete') {
//     new deleteFlowHelper(vm, t)
//       .setTargetGridRow([{ grid: grdSub, row: null }])
//       .setGridList([grdSub])
//       .setBefore(subCheck)
//       .setQuery(subDeleteData)
//       .setAfter(async () => {
//         funcSearchSub(grdMain.value.getGridView().getCurrent().dataRow, false)
//       })
//       .run()
//   }
// }

const getCmmCd = async () => {
  await getCodeList('HHIZLAN').then(res => {
    // console.log('res', res)

    const data = res.ORESULT_CUR

    _.remove(data, { COD: 'KO' })
    
    lanList.value = data

    const langFields = []

    lanList.value.forEach(item => {
      langFields.push({
        fieldName: item.COD, dataType: 'text', header: { text: t(item.TXT) }, styleName: 'left-column',
        width: 200, editable: false,
      })
    })

    const cols = [...frontCol, ...langFields, ...endCol]

    grdMainProps.columns = grdMainProps.fields = cols

    grdMain.value.getDataProvider().setFields(grdMainProps.fields)
    grdMain.value.getGridView().setColumns(grdMainProps.columns)

    // console.log('grdMainProps.columns', grdMainProps.columns)

    // console.log('lanList', lanList.value)
    // grdSub.value.setBindingColumn(
    //   'LANG',
    //   lanList.value,
    //   'COD',
    //   'TXT',
    // )
  })
}

const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType !== "header") {
    const currRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    refOPRAI0010Popup.value.openPopup({
      isNew: false,
      data: {
        LANG_LIST: lanList.value,
        SEQ: currRow.SEQ,
      },
    })
  }
}

const popupSaved = param => {
  // console.log('popupSaved param', param)

  commonSearchApi({ queryId : 'OPRAI0010_SEARCH_01', param: searchMainParams }).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.goRow({
      SEQ: param,
    })
  })
}

onMounted(() => {
  vm.$nextTick(async () => {
    gridTitle.value.setBtnProperty('btnCreate', 'text', '등록')
    await getCmmCd()
    onButtonsClick({ id: 'btnSearch' })
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
            :label="$t('한국어 내용')"
            v-model="searchMainParams.CONTENT"
            width="350px"
            @keyup.enter="onButtonsClick({ id: 'btnSearch' })"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle
            :title="$t('한국어')"
            :button-list="['btnCreate', 'btnDelete']"
            ref="gridTitle"
            @click-button="onGrdMainButtonsClick"
          />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @on-cell-dbl-clicked="onCellDblClicked"
          />
          <!-- @on-current-row-changed="onCurrentRowChanged" -->
        </v-sheet>
      </div>
    </v-card-text>

    <OPRAI0010Popup
      ref="refOPRAI0010Popup"
      @saved="popupSaved"
    />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>