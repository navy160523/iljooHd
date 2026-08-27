<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonSearchApi } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import RealGrid from "@/components/RealGrid.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import _ from "lodash"

const emit = defineEmits(["selected", "closed"])

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const t = useI18n().t

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible: false } },
  keys: ["TXT"],
  fields: [
    { fieldName: "PATH", dataType: "text", header: { text: t("ID") }, editable: false, visible: false },
    { fieldName: "LVL", dataType: "text", header: { text: t("LVL") }, editable: false, visible: false },
    { fieldName: "COD", dataType: "text", header: { text: t("COD") }, editable: false, visible: false },
    { fieldName: "TXT", dataType: "text", header: { text: t("구분") }, editable: false, styleName: "left-column" },
  ],
})

grdMainProps.columns = grdMainProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
})

const searchMain = () => {
  return commonSearchApi({ queryId: "SAFDC0010_SEARCH_03", param: searchParams })
}

const afterSearchMain = (res) => {
  const data = res.ORESULT_CUR

  // console.log('data', data)

  grdMain.value.getDataProvider().setRows(data, "PATH", false, null)
}

const openPopup = () => {
  dialog.value = true
  onButtonsClick({ id: "btnSearch" })
}

const btnSearch = () => {
  new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchMain).setAfter(afterSearchMain).run()
}

const btnSelect = () => {
  const clickData = grdMain.value.getGridView().getCurrent()
  const rowData = grdMain.value.getRowData(clickData.dataRow)
  const isParent = rowData.LVL === "1"

  if (!isParent) {
    const parent = grdMain.value.getGridView().getParent(clickData.itemIndex)
    const parentRowIdx = grdMain.value.getGridView().getRowsOfItems([parent])[0]
    const parentData = grdMain.value.getRowData(parentRowIdx)

    // console.log('rowData', rowData)
    // console.log('parentData', parentData)

    const selectedData = [
      { COD: parentData.COD, TXT: parentData.TXT },
      { COD: rowData.COD, TXT: rowData.TXT },
    ]

    emit("selected", selectedData)
    dialog.value = false
  }
}

const btnClose = () => {
  dialog.value = false
  emit("closed")
  grdMain.value.getDataProvider().setRows(null)
}

const onButtonsClick = (btn) => {
  const btnId = btn.id

  if (btnId === "btnSearch") {
    btnSearch()
  } else if (btnId === "btnSelect") {
    btnSelect()
  } else if (btnId === "btnClose") {
    btnClose()
  }
}

const onCellDblClicked = (grid, clickData) => {
  // console.log('grid', grid)
  // console.log('clickData', clickData)

  if (clickData.cellType === "data") {
    const rowData = grdMain.value.getRowData(clickData.dataRow)
    const isParent = rowData.LVL === "1"

    if (!isParent) {
      const parent = grdMain.value.getGridView().getParent(clickData.itemIndex)
      const parentRowIdx = grdMain.value.getGridView().getRowsOfItems([parent])[0]
      const parentData = grdMain.value.getRowData(parentRowIdx)

      // console.log('rowData', rowData)
      // console.log('parentData', parentData)

      const selectedData = [
        { COD: parentData.COD, TXT: parentData.TXT },
        { COD: rowData.COD, TXT: rowData.TXT },
      ]

      emit("selected", selectedData)
      dialog.value = false
    }
  }
}

onMounted(() => {
  //
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
    width="800"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>구분선택</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="gridTitle"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto mt-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              is-tree
              @on-cell-dbl-clicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 400px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}
</style>
