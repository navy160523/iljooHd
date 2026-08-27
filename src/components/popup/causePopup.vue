<!-- si2팀김성근 기인물 공통팝업 -->
<script setup>
import { ref, reactive, onMounted, onUpdated, watch } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import Message from "@hiway/utils/notify"
import _ from "lodash"
const emit = defineEmits(["selectedArr", "checkedData"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const UserStore = useUserStore()
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
let checkedData = []
const menuTitle = ref(null)
const props = defineProps({
  //체크바 표시여부
  checkBar: {
    type: Boolean,
    default: false,
  },
})

// 결재 상신 파라미터

// 조직도 부서 조회 파라미터
let acdtParms = reactive({
  CMPNY_DIV: "HHI",
  ALL_UP_CD: "HHIB040",
  USE_FLAG: "Y",
})

// 조직도 부서 그리드
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: props.checkBar },
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: ["TXT"],
  field: [
    { fieldName: "ALL_SYS_CD", dataType: "text", visible: false },
    { fieldName: "ALL_UP_CD", dataType: "text", visible: false },
    { fieldName: "COD", dataType: "text", visible: false },
    { fieldName: "TXT", dataType: "text", header: { text: t("기인물") } },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = (popupParam) => {
  dialog.value = true

  //체크바 표시여부에따라 선택버튼 visible 여부 설정
  vm.$nextTick(() => {
    setButtonVisible()
  })

  onButtonsClick({ id: "btnSearch" })
}

const onCellDblClicked = (grd, data) => {
  let pushArr = []

  if (data.cellType === "data") {
    let index = grdMain.value.getGridView().getCurrent().itemIndex
    let parent = grdMain.value.getGridView().getAncestors(index, true)
    parent.sort()

    for (let i of parent) {
      let enterObj = grdMain.value.getGridView().getValues(i)

      if (enterObj) {
        pushArr.push(enterObj)
      }
    }

    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)

    pushArr.push(innerData)
    if (pushArr.length === 1) {
      if (grdMain.value.getGridView().getModelOfRow(data.dataRow).expanded) {
        grdMain.value.getGridView().collapse(data.itemIndex)
      } else {
        grdMain.value.getGridView().expand(data.itemIndex)
      }
    } else if (
      grdMain.value.getGridView().getModelOfRow(data.dataRow).expanded
    ) {
      grdMain.value.getGridView().collapse(data.itemIndex)
    } else {
      grdMain.value.getGridView().expand(data.itemIndex)
    }

    if (pushArr.length === 3) {
      let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow
      let currentRow = grdMain.value.getDataProvider().getJsonRow(currentRowIdx)
      emit("selectedArr", pushArr)

      dialog.value = false
    }

    // return Message.warn("자세한 분류까지 선택해 주십시오");
  }
}

onMounted(() => {})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataDept)
      .setAfter(afterSearchDept)
      .run()
  } else if (btn.id === "btnSelect") {
    selectedData()
  } else if (btn.id === "btnClose") {
    closePopup()
  }
}

const closePopup = () => {
  if (checkedData.length > 0) {
    checkedData = []
  }
  dialog.value = false
}

// 조회로직
const searchDataDept = () => {
  return commonSearchApi({ queryId: "searchCommonCodeF", param: acdtParms })
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const afterSearchDept = (res) => {
  //console.log("조회값", res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, "ALL_SYS_CD")
}
const checkNode = (grid, dataRow, checked) => {
  const provider = grid.getDataSource()
  //형제노드체크 후 부모노드 체크
  checkSiblingNode(grid, dataRow, checked)

  //자식노드체크
  const desRows = provider.getDescendants(dataRow)
  if (desRows) {
    grid.checkRows(desRows, checked, false)
  }
}

const checkSiblingNode = (grid, dataRow, checked) => {
  const provider = grid.getDataSource()
  //부모노드
  const parent = provider.getParent(dataRow)

  //형제노드
  const sibling =
    parent == -1 ? provider.getChildren() : provider.getChildren(parent) //자식행 인덱스
  const index = sibling.indexOf(dataRow)

  //자기자신은 제외
  if (index !== -1) {
    sibling.splice(index, 1)
  }

  if (checked) {
    for (const i in sibling) {
      const value = grid.isCheckedRow(sibling[i])
      //console.log("value??", value)
      if (checked != value) {
        checked = false
        break
      }
    }
  } else {
    checked = false
  }

  if (parent > -1) grid.checkRow(parent, checked, false, false)
  //checkBar.head 영역의 V표시 제어
  if (parent == -1) grid.setAllCheck(checked, false)
  if (parent > -1) checkSiblingNode(grid, parent, checked)
}

const onItemChecked = (grid, itemIndex, checked) => {
  const dataRow = grid.getDataRow(itemIndex)
  checkNode(grid, dataRow, checked)
}

const selectedData = () => {
  const checkedData = []

  const allDatas = grdMain.value.getGridView().getJsonRows(null, true)
  const checkedRows = grdMain.value.getGridView().getCheckedRows()

  checkedRows.forEach((row) => {
    const currRow = grdMain.value.getDataProvider().getJsonRow(row)
    // console.log('currRow', currRow)
    // console.log('abc', _.some(allDatas, { ALL_UP_CD: currRow.ALL_SYS_CD }))

    if (!_.some(allDatas, { ALL_UP_CD: currRow.ALL_SYS_CD })) {
      checkedData.push(currRow)
    }
  })
  if (checkedData.length === 0) {
    Message.warn("데이터를 선택해주세요.")
    return false
  }

  emit("selectedData", checkedData)
  closePopup()
}

//체크박스 선택 이벤트 관련 로직 끝

//버튼 visible 설정 로직 시작
const setButtonVisible = () => {
  if (props.checkBar) {
    menuTitle.value.setBtnProperty("btnSelect", "visible", true)
  } else {
    menuTitle.value.setBtnProperty("btnSelect", "visible", false)
  }
}
//버튼 visible 설정 로직 끝
defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    persistent
    width="500"
    height="700"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">기인물 검색</div>
    <VContainer style="background-color: white">
      <VRow>
        <VCol>
          <IGridTitle
            :use-permission="false"
            ref="menuTitle"
            :button-list="['btnSelect', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>

      <VRow>
        <RealGrid
          ref="grdMain"
          class="mt-2"
          style="height: 640px"
          :is-tree="true"
          :gridViewOption="grdMainProps.gridViewOption"
          :fields="grdMainProps.field"
          :columns="grdMainProps.columns"
          @onCellDblClicked="onCellDblClicked"
          @onItemChecked="onItemChecked"
        />
      </VRow>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
