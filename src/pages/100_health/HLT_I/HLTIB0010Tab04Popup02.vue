<script setup>
import { ref, reactive } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import { useUserStore } from '@hiway/stores/user'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
const menuTitle = ref(null)
const userStore = useUserStore()
const emit = defineEmits(['importData'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const dialog = ref(null)
const searchParam = reactive({})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    {
      fieldName: 'WORK_STANDARD_ID',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('작업표준ID') },
    },
    {
      fieldName: 'WORK_STANDARD_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('작업표준명') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('소속') },
    },
    {
      fieldName: 'EMP_NO',
      width: '70',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'ES_DATE',
      visible: false,
      header: { text: t('조사일자') },
    },
    {
      fieldName: 'ES_SEQ',
      visible: false,
      header: { text: t('순번') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  dialog.value = true
  grdMain.value.getGridView().filterPanel.visible = true
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_19',
    param: param,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const closePopup = () => {
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  emit('importData', data)
  closePopup()
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    height="600"
    width="50%"
    class="draggable-dialog"
    eager
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    :no-click-animation="true"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ t('작업인원 불러오기') }}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <IGridTitle :button-list="['btnClose']" @click-button="onButtonsClick" class="mt-2 mr-2" />
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <v-sheet class="pa-0" style="height: 580px">
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-sheet>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
