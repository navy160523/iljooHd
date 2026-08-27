<!--
오토바이 번호 검색 팝업
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonSearchApi } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from "@/components/IMenuTitle.vue"
import { useI18n } from "vue-i18n"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const t = useI18n().t
const emit = defineEmits(["selected"])
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BIKE_NO: "",
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: "BIKE_NO",
      dataType: "text",
      header: { text: t("차량번호") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "BIKE_REG_NO",
      dataType: "text",
      header: { text: t("등록번호") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      header: { text: t("사번") },
      editable: false,
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      header: { text: t("성명") },
      editable: false,
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      header: { text: t("소속") },
      editable: false,
      styleName: "left-column",
      width: "200",
    },

    {
      fieldName: "CMPNY_DIV",
      header: { text: t("") },
      visible: false,
    },
    {
      fieldName: "BSNS_CD",
      header: { text: t("") },
      visible: false,
    },
    {
      fieldName: "DEPT_CD",
      header: { text: t("") },
      visible: false,
    },
    {
      fieldName: "ASGN_CD",
      header: { text: t("") },
      visible: false,
    },
    {
      fieldName: "TEL_NO",
      header: { text: t("") },
      visible: false,
    },
    {
      fieldName: "HP_NO",
      header: { text: t("") },
      visible: false,
    },
    {
      fieldName: "IO_DIV",
      header: { text: t("") },
      visible: false,
    },
    {
      fieldName: "VND_NAME",
      header: { text: t("") },
      visible: false,
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  dialog.value = true
  if (!param) {
    onButtonsClick({ id: "btnSearch" })
  } else {
    searchParam.BIKE_NO = param
    onButtonsClick({ id: "btnSearch" })
  }
}

const closePopup = () => {
  dialog.value = false
  searchParam.BIKE_NO = "" //팝업 닫을때 초기화
  grdMain.value.getDataProvider().setRows(null)
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === "btnSelect") {
    selected()
  } else {
    closePopup()
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: "SAFDC0010_SEARCH_07",
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//선택관련 로직 시작
const onCellDblClicked = (grid, clickData) => {

  //필터링 처리하기
  // 필터링이 적용된 후의 실제 데이터 인덱스 가져오기
  let dataRow = clickData.dataRow;

  // dataRow가 -1이면 헤더나 비어 있는 셀을 클릭한 경우이므로 처리하지 않음
  if (dataRow >= 0) {
    let data = grdMain.value.getDataProvider().getJsonRow(dataRow);
    emit("selected", data);
    closePopup();
  }

  // let data = grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex)
  // emit("selected", data)
  // closePopup()
}

const selected = () => {
  let focusedRow = grdMain.value.getFocusedRowData()
  console.log("포커스로우", focusedRow)
}
//선택관련 로직 끝
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
    width="850"
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
      <span>차량번호 검색</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                width="200px"
                :label="$t('차량번호')"
                v-model="searchParam.BIKE_NO"
              >
              </i-input>
            </div>
          </v-sheet>
          <v-sheet class="h-auto mt-2">
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
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
