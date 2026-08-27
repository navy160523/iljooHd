<!-- 
  화면명 : SAFCB0010 / 부서 관리 작업 대상/체크리스트 관리 팝업
  화면개요 : ∙ 부서 관리 작업 대상 및 체크리스트를 관리(CRUD)한다.
            ∙ 타 부서의 ‘부서 관리 작업 대상’ 가져오기가 가능하다. (등록된 ‘체크리스트’ 포함)

-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
defineOptions({
  name: "30_safety-SAF_C-SAFCB0010PopUp",
})
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const dialog = ref(false)
const deptPopup = ref(null)
const grdMain = ref(null)
const intData = ref({})
const searchParams = reactive({
  USE_YN: "",
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.asgnFullNm,
})
const codeList = reactive({
  USE_YN: [
    { COD: "", TXT: "전체" },
    { COD: "Y", TXT: "사용" },
    { COD: "N", TXT: "미사용" },
  ],
  STATUS: [
    { COD: "D", TXT: "부서" },
    { COD: "A", TXT: "PTW신청" },
  ],
})
const openPopup = (param) => {
  intData.value = param
  dialog.value = true
  vm.$nextTick(() => {
    grdMain.value.setBindingColumn("STATUS", codeList.STATUS, "COD", "TXT")
  })
}
const emit = defineEmits(["update"])

// 그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: false } },
  keys: [],
  fields: [
    {
      fieldName: "WRK_DIST",
      width: "300",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("작업종류") },
    },
    {
      fieldName: "DANG_DIVNM",
      dataType: "text",
      header: { text: t("위험작업분류") },
    },
    {
      fieldName: "STATUS",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("상태") },
    },
    {
      fieldName: "USE_YN",
      width: "70",
      dataType: "text",
      editable: false,
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      header: { text: t("사용유무") },
    },
    {
      fieldName: "ORDER_NUM",
      width: "70",
      styleName: "right-column",
      dataType: "number",
      numberFormat: "#,###",
      header: { text: t("정렬순서") },
    },
    {
      fieldName: "DESCRIPTION",
      width: "300",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("비고") },
    },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "BSNS_CD", dataType: "text", visible: false },
    { fieldName: "DEPT_CD", dataType: "text", visible: false },
    { fieldName: "D_WRK_ID", dataType: "text", visible: false },
    {
      fieldName: "WRK_DIV",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("작업구분") },
      visible: false,
    },
    {
      fieldName: "DANG_DIV",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("위험작업분류") },
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopupdept = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: "Y",
    ASGN_NM: searchParams.DEPT_NM,
  })
}

const onDeptSelected = (row) => {
  searchParams.DEPT_NM = row.ASGN_FULL_NM
  searchParams.DEPT_CD = row.DEPT_CD
  searchParams.BSNS_CD = row.BSNS_CD
  searchParams.CMPNY_DIV = row.CMPNY_DIV
}

const closePopup = () => {
  dialog.value = false
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnClose") {
    closePopup()
  }
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearchData)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  if (btn.id === "btnIMPR") {
    bringData()
  }
}

const beforeSearchData = () => {
  if (!searchParams.DEPT_CD) {
    Message.warn(t("부서는 필수입력입니다."))
    return false
  }
  return true
}

// 메인조회
const searchData = () => {
  return commonSearchApi({
    queryId: "SAFCB0010_POPUP_SEARCH_01",
    param: searchParams,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const bringData = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  let paramM = []
  for (let i of chekedRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    paramM.push(data)
  }

  for (let i of paramM) {
    i.C = i.CMPNY_DIV
    i.B = i.BSNS_CD
    i.D = i.DEPT_CD

    i.CMPNY_DIV = intData.value.CMPNY_DIV
    i.BSNS_CD = intData.value.BSNS_CD
    i.DEPT_CD = intData.value.DEPT_CD
  }

  commonExecuteApi({ queryId: "SAFCB0010_SAVE_03", list: paramM }).then(
    (res) => {
      emit("update")
      onButtonsClick({ id: "btnClose" })
    }
  )
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>점검항목 불러오기</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnIMPR', 'btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('부서')"
              label-width="80px"
              width="350px"
              margin="4px"
              v-model="searchParams.DEPT_NM"
              append-inner-icon="mdi-magnify"
              @keydown.enter="
                (e) => {
                  openPopupdept()
                }
              "
              @update:modelValue="
                (e) => {
                  searchParams.DEPT_CD = null
                }
              "
              @click:appendInner="openPopupdept()"
              required
            />
            <i-input
              :label="$t('')"
              v-model="searchParams.DEPT_CD"
              width="100px"
              readonly
            />
            <i-select
              :label="$t('사용유무')"
              labelWidth="70px"
              width="250px"
              v-model="searchParams.USE_YN"
              :items="codeList.USE_YN"
              item-value="COD"
              item-title="TXT"
            />
          </v-sheet>

          <v-sheet class="h-auto">
            <div class="h-grow">
              <v-sheet width="100%" class="pa-0 h-auto mr-3">
                <IGridTitle :title="$t('부서 관리 작업 대상')">
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys"
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                />
              </v-sheet>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>

    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
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
