<script setup>
import { ref, reactive, onMounted, onUpdated } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
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
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import _ from "lodash"
const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const props = defineProps({
  //체크바 표시여부
  checkBar: {
    type: Boolean,
    default: false,
  },
})
// 구분 조직도 그리드
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: props.checkBar },
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: ["COMP_CODE"],
  field: [
    { fieldName: "CODE_ID", dataType: "text", visible: false },
    { fieldName: "PARENT_ID", dataType: "text", visible: false },
    { fieldName: "SYS_CDNM", dataType: "text", header: { text: t("코드명") } },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = (popupParam) => {
  onButtonsClick({ id: "btnSearch" })
  //팝업 visible
  dialog.value = true
}

//초기 데이터셋팅
onMounted(() => {
  // window.addEventListener('mousemove', mouseUpdate)
})

// 화면이 다 뜨고 난 뒤 자동으로 조직도 조회
onUpdated(() => {
  
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchGubun)
      .setAfter(afterSearchGubun)
      .showMessage(false)
      .run()
  } else if (btn.id === "btnSelect") {
    selectedData()
  } else if (btn.id === "btnClose") {
    onClose()
  }
}

// 조회로직
const searchGubun = () => {
  return commonSearchApi({ queryId: "RSKBA0010_SEARCH_02", param: { TYPE: "RISK_CD" } })
}

// 조회로직
const afterSearchGubun = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, "CODE_ID")
}

/*메뉴버튼 조회*********************************************/

defineExpose({
  openPopup,
})

// const onSelect = (grd, data) => {
//   let pushArr = []
//   let innerData = []
//   // if(data.cellType === 'data'){

//   let index = grdMain.value.getGridView().getCurrent().dataRow
//   let row = grdMain.value.getDataProvider().getJsonRow(index)
//   let children = grdMain.value.getDataProvider().getChildCount(index)
//   console.log("children", children)

//   if (children > 0) {
//     return Message.warn("자세한 분류까지 선택해 주십시오")
//   } else {
//     emit("selected", row)
//     dialog.value = false
//   }
//   // }
// }

const selectedData = () => {
  /*
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
  
  emit("selected", row)
  dialog.value = false
  */

  let index = grdMain.value.getGridView().getCurrent().dataRow
  let row = grdMain.value.getDataProvider().getJsonRow(index)

  if(row.PARENT_ID === '#')
  {
    Message.warn("자세한 분류까지 선택해 주십시오")
    return false
  }

  emit("selected", row)
  dialog.value = false
}

let ary = []

const onCellDblClicked = (grd, data) => {
  let pushArr = []
  let innerData = []
  if (data.cellType === "data") {
    let index = grdMain.value.getGridView().getCurrent().dataRow
    let row = grdMain.value.getDataProvider().getJsonRow(index)
    let children = grdMain.value.getDataProvider().getChildCount(index)

    if (children > 0) {
      if(ary[data.itemIndex] == null)
      {
        ary[data.itemIndex] = 'expand'

        // 선택한 노드가 부모이면 펼치기
        grdMain.value.getGridView().expand(data.itemIndex)
      }
      else
      {
        ary[data.itemIndex] = null
        // 선택한 노드가 부모이면 접기
        grdMain.value.getGridView().collapse(data.itemIndex)
      }
      
      //return Message.warn("자세한 분류까지 선택해 주십시오")
    } else {
      emit("selected", row)
      dialog.value = false
    }
  }
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
  const sibling = parent == -1 ? provider.getChildren() : provider.getChildren(parent) //자식행 인덱스
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

const onClose = () => {
  dialog.value = false
}

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    width="500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">위험요인 분류 검색</div>
    <VContainer style="background-color: white">
      <VRow>
        <VCol>
          <IGridTitle
            :use-permission="false"
            :button-list="['btnSelect', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>

      <!-- 조회조건 -->
      <VRow>
        <VCol>
          <VForm ref="searchArea" style="background-color: #fafafa" class="searchArea"> </VForm>
        </VCol>
      </VRow>
      <!-- /조회조건 -->

      <!-- 메인그리드 -->
      <VRow>
        <VCol>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 500px"
            :is-tree="true"
            :gridViewOption="grdMainProps.gridViewOption"
            :fields="grdMainProps.field"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
            @onItemChecked="onItemChecked"
          />
        </VCol>
      </VRow>
      <!-- /메인그리드 -->
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
