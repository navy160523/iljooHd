<script setup>
import { ref, reactive, onMounted, onUpdated, watch } from "vue"
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
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { VWindow, VWindowItem } from "vuetify/lib/components/index.mjs"
import Message from "@hiway/utils/notify"
import _ from "lodash"
const emit = defineEmits(["selected", "selectedData"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const UserStore = useUserStore()
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const menuTitle = ref(null)
const title = ref("")
let checkedData = []
// 결재 상신 파라미터
const searchText = ref("")
// 조직도 부서 조회 파라미터
let comCode = reactive({
  CMPNY_DIV: "HHI",
  ALL_UP_CD: "",
  USE_FLAG: "Y",
})
const props = defineProps({
  //체크바 표시여부
  checkBar: {
    type: Boolean,
    default: false,
  },
})

const openPopup = (popupParam) => {
  if (!popupParam) {
    return Message.warn(t("개발자전용 : 파라미터를 확인해주십시오"))
  }

  //체크바 표시여부에따라 선택버튼 visible 여부 설정

  title.value = popupParam

  switch (popupParam) {
    case "장소":      
      comCode.CMPNY_DIV = "200"
      comCode.ALL_UP_CD = "200Z010"
      break
    case "사고분류":
    case "잠재사고":      
      comCode.CMPNY_DIV = "HHI"  
      comCode.ALL_UP_CD = "HHIB010"
      break
    case "상해부위":    
      comCode.CMPNY_DIV = "HHI"  
      comCode.ALL_UP_CD = "HHIB020"
      break
    case "기인물":
    case "점검대상물":
    case "대상물":      
      comCode.CMPNY_DIV = "HHI"  
      comCode.ALL_UP_CD = "HHIB040"
      break
    case "손실비용항목":      
      comCode.CMPNY_DIV = "HHI"    
      comCode.ALL_UP_CD = "HHIB110"
      break
    case "위반구분":      
      comCode.CMPNY_DIV = "HHI"  
      comCode.ALL_UP_CD = "HHIF110"
      break

    case "대상설비":      
      comCode.CMPNY_DIV = "HHI"    
      comCode.ALL_UP_CD = "HHIF120"
      break
    case "관리분류":      
      comCode.CMPNY_DIV = "HHI"    
      comCode.ALL_UP_CD = "HHIF813"
      break
    default:
      comCode.CMPNY_DIV = ""
      comCode.ALL_UP_CD = ""
      comCode.USE_FLAG = ""
      break
  }
  dialog.value = true
  searchText.value = ""
  vm.$nextTick(() => {
    setButtonVisible()
  })

  onButtonsClick({ id: "btnSearch" })
}

const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: props.checkBar },
  },
  keys: ["TXT"],
  field: [
    { fieldName: "ALL_SYS_CD", dataType: "text", visible: false },
    { fieldName: "ALL_UP_CD", dataType: "text", visible: false },
    { fieldName: "COD", dataType: "text", visible: false },
    { fieldName: "TXT", dataType: "text", header: { text: "코드" } },
    { fieldName: "HIDDENFIELD", dataType: "text", visible: false },
    { fieldName: "CODE_DESC1", dataType: "text", visible: false },
    { fieldName: "CODE_DESC2", dataType: "text", visible: false },
    { fieldName: "CODE_DESC3", dataType: "text", visible: false },
    { fieldName: "CODE_DESC4", dataType: "text", visible: false },
    { fieldName: "CODE_DESC5", dataType: "text", visible: false },
    { fieldName: "CODE_DESC6", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const onCellDblClicked = (grd, data) => {
  let pushArr = []

  if (data.cellType === "data") {
    let index = grdMain.value.getGridView().getCurrent().itemIndex
    let parent = grdMain.value.getGridView().getAncestors(index, true)
    let Check = grdMain.value.getGridView().getDescendants(index, true)
    parent.sort()
    if (Check.length === 0) {
      for (let i of parent) {
        let enterObj = grdMain.value.getGridView().getValues(i)
        if (enterObj) {
          pushArr.push(enterObj)
        }
      }
      let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)

      pushArr.push(innerData)
      emit("selected", pushArr)
      dialog.value = false
    } else {
      if (grdMain.value.getGridView().getModelOfRow(data.dataRow).expanded) {
        grdMain.value.getGridView().collapse(data.itemIndex)
      } else {
        grdMain.value.getGridView().expand(data.itemIndex)
      }
    }
  }
}

watch(
  () => grdMain.value,
  (newValue) => {
    if (newValue) {
      grdMain.value.getGridView().setColumnProperty("TXT", "autoFilter", true)
    }
  }
)

//초기 데이터셋팅
onUpdated(() => {})

const SearchGrd = () => {
  let gridView = grdMain.value.getGridView()

  let idx = 0
  let ret = grdMain.value.getDataProvider().searchData({
    fields: ["TXT"],
    value: searchText.value,
    partialMatch: true,
  })
  if (ret == null) {
    gridView.collapseAll()
    return Message.warn("검색된 결과가 없습니다.")
  }
  while (ret != null) {
    if (ret) {
      idx = ret.dataRow
      var rowId = ret.dataRow
      var parents = grdMain.value.getDataProvider().getAncestors(rowId)
      if (parents) {
        gridView.expand(parents, false, true)
        for (var i = parents.length - 1; i >= 0; i--) {
          gridView.expand(gridView.getItemIndex(parents[i]))
        }

        // 찾은 row 포커싱
        gridView.setCurrent({
          itemIndex: gridView.getItemIndex(rowId),
          fieldIndex: ret.fieldIndex,
        })

        // 찾은 row 히든필드에 값넣기 HIDDENFIELD
        grdMain.value
          .getDataProvider()
          .setValue(rowId, "HIDDENFIELD", searchText.value)

        // 찾은 값들을 강조하기
        grdMain.value
          .getGridView()
          .setRowStyleCallback(function (grid, item, fixed) {
            var retVal = {}

            var val = grid.getValue(item.index, "HIDDENFIELD")

            if (val === searchText.value) {
              retVal.style = { background: "#D9E5FF" }
            }

            return retVal
          })
      }
      ret = grdMain.value.getDataProvider().searchData({
        fields: ["TXT"],
        value: searchText.value,
        partialMatch: true,
        startIndex: idx + 1,
        wrap: false,
      })
      console.log("ddddk")
    }
  }
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataDept)
      .setAfter(afterSearchDept)
      .run()
  } else if (btn.id === "btnClose") {
    dialog.value = false
    grdMain.value.getGridView().setColumnProperty("TXT", "autoFilter", false)
  } else if (btn.id === "btnSelect") {
    selectedData()
  }
}

// 조회로직
const searchDataDept = () => {
  return commonSearchApi({ queryId: "searchCommonCodeF", param: comCode })
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const afterSearchDept = (res) => {
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
const closePopup = () => {
  if (checkedData.length > 0) {
    checkedData = []
  }
  dialog.value = false
}
//체크박스 선택 이벤트 관련 로직 끝

//버튼 visible 설정 로직 시작
const setButtonVisible = () => {
  console.log(props.checkBar, "props.checkBar")
  if (props.checkBar) {
    menuTitle.value.setBtnProperty("btnSelect", "visible", true)
  } else {
    menuTitle.value.setBtnProperty("btnSelect", "visible", false)
  }
}
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
    <div class="title-bar" @mousedown="startDragging">{{ title }} 검색</div>
    <VContainer style="background-color: white">
      <VRow>
        <VCol>
          <IGridTitle
            ref="menuTitle"
            :use-permission="false"
            :button-list="['btnSelect', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <v-row>
        <i-input
          v-model="searchText"
          @keypress.enter="SearchGrd"
          width="480px"
          :label="t('검색')"
        />
      </v-row>
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
