<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { getAllMenus } from '@hiway/api/menu'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import RealGrid from '@/components/RealGrid.vue'
import { chkEmpty } from '@/utils/common'
import _ from 'lodash'

const emit = defineEmits(['select'])

const vm = getCurrentInstance().proxy
const t = useI18n().t
const grdMain = ref(null)
const dialog = ref(false)
const popupTitle = ref('메뉴 선택 팝업')
const popupParams = reactive({
  CMPNY_DIV: '',
  NOTICE_NO: '',
})

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true },
    edit: { editable: false },
  },
  fields: [
    { fieldName: 'NOTICE_MENU', dataType: 'text', header: { text: t('메뉴 경로'), }, styleName: 'left-column', },
    { fieldName: 'NOTICE_MENU_NM', dataType: 'text', header: { text: t('메뉴명'), }, styleName: 'left-column', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'NOTICE_NO', dataType: 'text', header: { text: t('NOTICE_NO'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = param => {
  popupParams.CMPNY_DIV = param.CMPNY_DIV
  popupParams.NOTICE_NO = param.NOTICE_NO

  dialog.value = true

  onButtonsClick({ id: 'btnSearch' }, false)
}

const searchData = () => {
  grdMain.value.getDataProvider().setRows([])
  return commonSearchApi({ queryId: 'OPRAJ0010_SEARCH_03', param: popupParams })
}

const afterSearch = res => {
  const resData = res.ORESULT_CUR

  getAllMenus().then(resMenu => {
    const grdData = _.filter(resMenu, mn => {
      return !chkEmpty(mn.href)
          && mn.use_yn === 'Y'
          && mn.href.toUpperCase().indexOf('00_SAMPLE') < 0
          && mn.href.toUpperCase().indexOf('MANAGER') < 0
          && mn.href.toUpperCase().indexOf('SITEMAP') < 0
    }).map(mn => {
      return {
        CMPNY_DIV: popupParams.CMPNY_DIV,
        NOTICE_NO: popupParams.NOTICE_NO,
        NOTICE_MENU: mn.href,
        NOTICE_MENU_NM: mn.mnu_nm,
        SORT_NO: mn.href.substring(1, mn.href.indexOf('_')) * 1
      }
    })

    const sorted = _.sortBy(grdData, ['SORT_NO', 'NOTICE_MENU'])

    grdMain.value.getDataProvider().setRows(sorted)

    const dataRows = grdMain.value.getDataProvider().getRows()
    for(let i = 0; i < dataRows.length; i++) {
      const dataRow = grdMain.value.getDataProvider().getJsonRow(i)

      if(_.some(resData, { NOTICE_MENU: dataRow.NOTICE_MENU })) {
        grdMain.value.getGridView().checkRow(i, true)
      } else {
        grdMain.value.getGridView().checkRow(i, false)
      }
    }
  })
}

const onButtonsClick = async (btn, showMsg = true) => {
  const btnId = btn.id

  if(btnId === 'btnClose') {
    await grdMain.value.getGridView().filterPanel.clearInput()
    dialog.value = false
  } else if(btnId === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .showMessage(showMsg)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btnId === 'btnSelect') {
    const selected = []

    const checkedRows = grdMain.value.getGridView().getCheckedRows(false, false, true)
    for(let i = 0; i < checkedRows.length; i++){
      selected.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    }

    emit('select', selected)
    onButtonsClick({ id: 'btnClose' })
  }
}

onMounted(() => {
  nextTick(() => {
    grdMain.value.getGridView().filterPanel.visible = true
  })
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
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    width="1000px"
    height="100%"
  >
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      {{ popupTitle }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0 py-0">
        <IGridTitle
          ref="gridTitle"
          title="메뉴 리스트"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
</style>