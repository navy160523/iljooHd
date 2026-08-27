<script setup>
import { ref, reactive, onMounted } from 'vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import { commonSearchApi, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'

const emit = defineEmits([
  'saved',
])

defineOptions({
  name:'80_operation-OPR_A-OPRADI0010Popup',
})

/* 변수 *******************************************/
const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t
const dialog = ref(false)
const isCreate = ref(true)
const menuTitle = ref(null)
const lanList = ref([])
const grdMain = ref(null)
const isSaved = ref(false)

const saveParam = reactive({
  SEQ: '',
  KO: '',
  KO_ORG: '',
  LANG: '',
  TRANS: '',
})

const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['SEQ', 'LANG'],
  fields : [
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ') }, visible: false },
    { fieldName: 'LANG', dataType: 'text', header: { text: t('언어') },
      lookupDisplay: true,
    },
    {
      fieldName: 'CONTENT', dataType: 'text', header: { text: t('내용') }, styleName: 'left-column',
      editor: { maxLength: 250 }, width: 200, editable: false,
    },
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('등록일') }, editable: false },
    { fieldName: 'INSERT_USER_NM', dataType: 'text', header: { text: t('등록자') }, editable: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일') }, editable: false },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자') }, editable: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

/* 함수 *******************************************/
const openPopup = async param => {
  isCreate.value = param.isNew
  lanList.value = param.data.LANG_LIST
  saveParam.SEQ = param.data.SEQ
  saveParam.LANG = lanList.value[0].COD

  if(!isCreate.value) {
    await searchHeader()
    searchData()
  }

  grdMain.value.setBindingColumn(
    'LANG',
    lanList.value,
    'COD',
    'TXT',
  )

  dialog.value = true
}

const clearPop = () => {
  if(isSaved.value) {
    emit('saved', saveParam.SEQ)
  }

  saveParam.SEQ = ''
  saveParam.KO = ''
  saveParam.KO_ORG = ''
  saveParam.LANG = ''
  saveParam.TRANS = ''
  isSaved.value = false
  grdMain.value.getDataProvider().setRows('')
}

const onButtonsClick = async btn => {
  switch(btn.id) {
  case 'btnUpdate':
    const param = []
    const ko = saveParam.KO.replaceAll(' ', '')
    const trans = saveParam.TRANS.replaceAll(' ', '')

    if(!ko) {
      Message.warn(t('한국어 내용을 입력해 주세요.'))

      return false
    } else if(!trans) {
      Message.warn(t('번역 내용을 입력해 주세요.'))

      return false
    }

    // console.log('saveParam.KO', saveParam.KO)
    // console.log('saveParam.KO_ORG', saveParam.KO_ORG)

    if(saveParam.KO !== saveParam.KO_ORG) {
      param.push({
        SEQ: saveParam.SEQ,
        LANG: 'KO',
        CONTENT: saveParam.KO,
        USER_ID: userStore.userId,
      })
    }

    param.push({
      SEQ: saveParam.SEQ,
      LANG: saveParam.LANG,
      CONTENT: saveParam.TRANS,
      USER_ID: userStore.userId,
    })

    // console.log('param', param)

    const confirm = await vm.$swal({ 
      title: t('저장 하시겠습니까?'), 
      showCancelButton: true,
    })
    
    if (confirm.isConfirmed) {
      commonExecuteApi({ queryId : 'OPRAI0010_SAVE_01', list: param }).then(res => {
        isSaved.value = true
        commonSearchApi({ queryId : 'OPRAI0010_SEARCH_02', param: saveParam }).then(res2 => {
          grdMain.value.getDataProvider().setRows(res2.ORESULT_CUR)
          grdMain.value.goRow({
            SEQ: param[0].SEQ,
            LANG: param[0].LANG,
          })

          Message.success('저장되었습니다.')
        })
      })
    }

    // new saveFlowHelper(vm, t)
    //   .setTargetGridRow([{ grid: grdMain, row: null }])
    //   .setGridList([grdMain])
    //   .setBefore(mainCheck)
    //   .setQuery(mainSaveData)
    //   .setAfter(() => { searchData() })
    //   .run()
    break
  case 'btnDelete':
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(mainDeleteData)
      .setAfter(() => {
        isSaved.value = true
        searchHeader(false)
        searchData()
      })
      .run()
    break
  case 'btnClose':
    clearPop()
    dialog.value = false
    break
  default: break
  }
}

const searchHeader = async (koReload = true) => {
  await commonSearchApi({ queryId : 'OPRAI0010_SEARCH_03', param: saveParam }).then(res => {
    // console.log('res', res.ORESULT_CUR)
    const result = res.ORESULT_CUR

    if(result.length > 0) {
      if(koReload) {
        saveParam.KO = result[0].CONTENT ? result[0].CONTENT : ''
        saveParam.KO_ORG = result[0].CONTENT_ORG ? result[0].CONTENT_ORG : ''
      }

      saveParam.TRANS = result[0].CONTENT_TRANS ? result[0].CONTENT_TRANS : ''
    }
  })
}

const searchMain = () => {
  // console.log('saveParam', saveParam)
  return commonSearchApi({ queryId : 'OPRAI0010_SEARCH_02', param: saveParam })
}

const afterSearchMain = res => {
  // console.log('res', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const searchData = () => {
  // console.log('grdMain.value', grdMain.value)
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMain)
    .setAfter(afterSearchMain)
    .run()
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

const mainDeleteData = async () => {
  let checkedRow = await grdMain.value.getGridView().getCheckedRows()
  let param = []

  await checkedRow.forEach(async item => {
    let data = await grdMain.value.getDataProvider().getJsonRow(item)

    param.push(data)
  })

  // console.log('param', param)

  return commonExecuteApi({ queryId : 'OPRAI0010_DELETE_02', list: param })
}

const mainSaveData = () => {
  const param = []
  
  if(saveParam.KO !== saveParam.KO_ORG) {
    param.push({
      SEQ: saveParam.SEQ,
      LANG: 'KO',
      CONTENT: saveParam.KO,
      USER_ID: userStore.userId,
    })
  }

  param.push({
    SEQ: saveParam.SEQ,
    LANG: saveParam.LANG,
    CONTENT: saveParam.TRANS,
    USER_ID: userStore.userId,
  })

  return commonExecuteApi({ queryId : 'OPRAI0010_SAVE_01', list: param })
}

const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
  if(newIdx > -1) {
    const row = grdMain.value.getDataProvider().getJsonRow(newIdx)

    saveParam.LANG = row.LANG
    searchHeader(false)
  }
}

onMounted(() => {
  grdMain.value.getGridView().footer.visible = false
})

/* 외부사용 ***************************************/
defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="850"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      {{ `다국어 번역 관리 ${isCreate ? '등록' : '수정'}` }}
    </div>

    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="h-grow fill-height">
          <v-sheet width="100%" class="pa-0">
            <div class="d-flex">
              <i-input
                :label="$t('한국어')"
                top-label
                required
                v-model="saveParam.KO"
                width="200px"
              />
              <i-select
                v-model="saveParam.LANG"
                :label="$t('언어선택')"
                top-label
                :items="lanList"
                item-title="TXT"
                item-value="COD"
                @update:model-value="searchHeader(false)"
                width="200px"
              />
              <i-input
                :label="$t('번역')"
                top-label
                required
                v-model="saveParam.TRANS"
                width="200px"
              />
            </div>
            <div class="mt-2">
              <RealGrid
                ref="grdMain"
                style="height: 600px;"
                class="mt-4"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @on-current-row-changed="onCurrentRowChanged"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  height: fit-content;
  > div {
    min-height: 0;
  }
}
</style>