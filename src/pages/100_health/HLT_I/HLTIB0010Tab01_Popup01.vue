<script setup>
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi } from '@hiway/api/commonApi'
import { reactive } from 'vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
const dialog = ref(null)
const grdMain = ref(null)
const emit = defineEmits(['selected'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const props = defineProps({
  popupNumber: {
    type: String,
  },
})

const searchParam = reactive({
  WORK_STANDARD_ID: '',
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'UNIT_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('단위작업') },
    },
    {
      fieldName: 'UNIT_ID',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('단위작업ID') },
    },
    {
      fieldName: 'UNIT_SORT',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('UNIT_SORT') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

const openPopup = async (WORK_STANDARD_ID) => {
  dialog.value = true
  searchParam.WORK_STANDARD_ID = WORK_STANDARD_ID
  await searchData()
  //new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
}

const closePopup = () => {
  dialog.value = false
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  emit('selected', data)
  closePopup()
}

//단위작업 조회 로직 시작
const searchData = () => {
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_02',
    param: searchParam,
  }).then((res) => {
    if (props.popupNumber === '1') {
      res.ORESULT_CUR.push({ UNIT_NM: '직접입력', UNIT_ID: 'UNIT_ID_Z1', UNIT_SORT: 1 })
    } else if (props.popupNumber === '2') {
      res.ORESULT_CUR.push({ UNIT_NM: '직접입력', UNIT_ID: 'UNIT_ID_Z2', UNIT_SORT: 2 })
    } else {
      res.ORESULT_CUR.push({ UNIT_NM: '직접입력', UNIT_ID: 'UNIT_ID_Z3', UNIT_SORT: 3 })
    }
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>단위작업 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="[
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea" style="height: 500px">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
