<!-- 2024-04-16  김성근 SI2팀  SAFBD0040 / PTW 대상 부서 매핑-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import MNGAA0020Popup from "@/pages/10_management/MNG_A/MNGAA0020Popup.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"

defineOptions({
  name: "30_safety-SAF_B-SAFBD0040",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const searchParams = reactive({
  WRK_DIV: "",
  USE_YN: "Y",
  CMPNY_DIV: userStore.cmpnyDiv,
})
const grdMain = ref(null)
const grdSub1 = ref(null)
const grdSub2 = ref(null)
const ChangeRow = ref({})
const codeList = reactive({
  USE_YN: [
    { COD: "", TXT: "전체" },
    { COD: "Y", TXT: "사용" },
    { COD: "N", TXT: "미사용" },
  ],
})

const MainTitle = ref(null)
const dept = ref(null)

onMounted(() => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
    }),
    getCodeList("HHIE150"),
    getCodeList("HHIE120"),
    getCodeList("HHIE160"),
  ]).then((res) => {
    codeList.WRK_DIV = res[1].ORESULT_CUR
    grdMain.value.setBindingColumn(
      "BSNS_CD",
      res[0].ORESULT_CUR,
      "BSNS_CD",
      "BSNS_NM"
    )
    grdSub1.value.setBindingColumn(
      "BSNS_CD",
      res[0].ORESULT_CUR,
      "BSNS_CD",
      "BSNS_NM"
    )
    grdMain.value.setBindingColumn("WRK_DIV", res[1].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("DANG_DIV", res[2].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("CF_DIV", res[3].ORESULT_CUR, "COD", "TXT")

    grdSub2.value.setBindingColumn("WRK_DIV", res[1].ORESULT_CUR, "COD", "TXT")
    grdSub2.value.setBindingColumn("DANG_DIV", res[2].ORESULT_CUR, "COD", "TXT")
    grdSub2.value.setBindingColumn("CF_DIV", res[3].ORESULT_CUR, "COD", "TXT")
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.WRK_DIV.unshift({ TXT: "전체", COD: "" })
  })
  MainTitle.value.disableBtn("btnCreate", true)
  MainTitle.value.disableBtn("btnUpdate", true)
  MainTitle.value.disableBtn("btnDelete", true)
  onButtonsClick({ id: "btnSearch" })
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: [],
  fields: [
    {
      fieldName: "BSNS_CD",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("사업부") },
    },
    {
      fieldName: "WRK_DIV",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("공종/계열") },
    },
    {
      fieldName: "WRK_DIST",
      width: "300",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("작업종류") },
    },
    {
      fieldName: "DANG_DIV",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("위험작업분류") },
    },
    {
      fieldName: "CF_DIV",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("허가구분") },
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
      styleName: "left-column",
      dataType: "text",
      header: { text: t("비고") },
    },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "P_WRK_ID", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps1 = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true },
    edit: { editable: false },
  },
  keys: [],
  fields: [
    {
      fieldName: "BSNS_CD",
      width: "250",
      lookupDisplay: true,
      editable: false,
      styleName: "left-column",
      dataType: "text",
      header: { text: t("사업부") },
    },
    {
      fieldName: "PART_NM",
      width: "250",
      editable: false,
      styleName: "left-column",
      dataType: "text",
      header: { text: t("부문") },
    },
    {
      fieldName: "ASGN_SHRT_NM",
      width: "250",
      dataType: "text",
      editable: false,
      styleName: "left-column",
      header: { text: t("부서") },
    },
    { fieldName: "dummy1", dataType: "text", header: { text: t("　") } },
    { fieldName: "dummy2", dataType: "text", header: { text: t("　") } },
    { fieldName: "dummy3", dataType: "text", header: { text: t("　") } },
    { fieldName: "dummy4", dataType: "text", header: { text: t("　") } },
    { fieldName: "dummy5", dataType: "text", header: { text: t("　") } },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "P_WRK_ID", dataType: "text", visible: false },
    { fieldName: "DEPT_CD", dataType: "text", visible: false },
  ],
  columns: [],
})

grdSubProps1.columns = grdSubProps1.fields

//그리드 속성셋팅
const grdSubProps2 = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: [],
  fields: [
    {
      fieldName: "WRK_DIV",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("공종/계열") },
    },
    {
      fieldName: "WRK_DIST",
      width: "300",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("작업종류") },
    },
    {
      fieldName: "DANG_DIV",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("위험작업분류") },
    },
    {
      fieldName: "CF_DIV",
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("허가구분") },
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
      styleName: "left-column",
      dataType: "text",
      header: { text: t("비고") },
    },
    {
      fieldName: "BSNS_CD",
      lookupDisplay: false,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      dataType: "text",
      header: { text: t("사업부") },
      visible: false,
    },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "P_WRK_ID", dataType: "text", visible: false },
  ],
  columns: [],
})

grdSubProps2.columns = grdSubProps2.fields

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }

  if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setGridList([grdSub1])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  }

  if (btn.id === "btnCreate") {
    dept.value.openPopup()
  }
  if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setGridList([grdSub1])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  }
}

// 메인조회
const searchData = () => {
  return commonSearchApi({
    queryId: "SAFBD0030_SEARCH_01",
    param: searchParams,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 메인저장
const beforeSave = () => {
  let chekedRow = grdSub1.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  return true
}

const saveData = () => {
  let param = []
  let chekedRow = grdSub1.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdSub1.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }
  return commonExecuteApi({ queryId: "SAFBD0040_SAVE01", list: param })
}

const beforeDelete = () => {
  let chekedRow = grdSub1.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  return true
}

// 메인삭제
const deleteData = () => {
  let param = []
  let chekedRow = grdSub1.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdSub1.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }
  return commonExecuteApi({ queryId: "SAFBD0040_DELETE_01", list: param })
}

// rowChanged 이벤트

const rowChanged = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    ChangeRow.value.P_WRK_ID = null
    grdSub1.value.getDataProvider().setRows(null)
    MainTitle.value.disableBtn("btnCreate2", true)
    MainTitle.value.disableBtn("btnUpdate2", true)
    MainTitle.value.disableBtn("btnDelete2", true)
    return
  }
  ChangeRow.value = null
  grdSub1.value.getDataProvider().setRows(null)
  ChangeRow.value = grdMain.value.getDataProvider().getJsonRow(newRow)

  commonSearchApi({
    queryId: "SAFBD0040_SEARCH_01",
    param: ChangeRow.value,
  }).then((res) => {
    grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const rowChanged2 = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    grdSub2.value.getDataProvider().setRows(null)
    return
  }
  grdSub2.value.getDataProvider().setRows(null)
  let data = grdSub1.value.getDataProvider().getJsonRow(newRow)
  if (data.newRow !== "Y") {
    commonSearchApi({ queryId: "SAFBD0040_SEARCH_02", param: data }).then(
      (res) => {
        grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
      }
    )
  }
}

// watch
watch(
  () => ChangeRow.value.P_WRK_ID,
  (newValue) => {
    if (!newValue) {
      MainTitle.value.disableBtn("btnCreate", true)
      MainTitle.value.disableBtn("btnUpdate", true)
      MainTitle.value.disableBtn("btnDelete", true)
    } else {
      MainTitle.value.disableBtn("btnCreate", false)
      MainTitle.value.disableBtn("btnUpdate", false)
      MainTitle.value.disableBtn("btnDelete", false)
    }
  }
)

// selected
const selected = (row) => {
  //2024.05.24 김현재 작성
  //부서팝업에서 다중선택일때 체크를하고 선택버튼을 누르면 배열이 넘어온다. 그래서 넘어오는 값이 배열인지 확인하는 로직을 추가함
  if (Array.isArray(row)) {
    for (let i = 0; i < row.length; i++) {
      let newRow = {
        BSNS_CD: row[i].BSNS_CD,
        ASGN_SHRT_NM: row[i].ASGN_SHRT_NM,
        CMPNY_DIV: row[i].CMPNY_DIV,
        P_WRK_ID: ChangeRow.value.P_WRK_ID,
        DEPT_CD: row[i].DEPT_CD,
        PART_NM: row[i].PART_NM,
        newRow: "Y",
      }
      grdSub1.value.getDataProvider().insertRow(0, newRow)
      grdSub1.value.getGridView().checkItem(0, true)
      grdSub1.value.getGridView().commit()
    }
  } else {
    //2024.05.24 김현재 작성
    //부서팝업에서 로우를 더블클릭 하면 객체가 넘어온다. 그래서 배열이 아니면 객체이라는 뜻이라서 if문으로 처리함
    let newRow = {
      BSNS_CD: row.BSNS_CD,
      ASGN_SHRT_NM: row.ASGN_SHRT_NM,
      CMPNY_DIV: row.CMPNY_DIV,
      P_WRK_ID: ChangeRow.value.P_WRK_ID,
      DEPT_CD: row.DEPT_CD,
      PART_NM: row.PART_NM,
      newRow: "Y",
    }
    grdSub1.value.getDataProvider().insertRow(0, newRow)
    grdSub1.value.getGridView().checkItem(0, true)
    grdSub1.value.getGridView().commit()
  }

  console.log("ro124214w")
}
</script>
<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('사업부')"
            labelWidth="70px"
            width="250px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-title="BSNS_NM"
            item-value="BSNS_CD"

          />
          <i-select
            :label="$t('공종/계열')"
            labelWidth="70px"
            width="250px"
            v-model="searchParams.WRK_DIV"
            :items="codeList.WRK_DIV"
            item-value="COD"
            item-title="TXT"

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
            <v-sheet width="50%" class="pa-0 h-auto mr-3">
              <div class="h-auto mb-3">
                <IGridTitle
                  :title="$t('PTW 목록')"
                  @click-button="onButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys"
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  @onCurrentRowChanged="rowChanged"
                />
              </div>
              <div class="h-auto">
                <IGridTitle
                  :title="$t('PTW 적용 부서')"
                  :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                  ref="MainTitle"
                  @click-button="onButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdSub1"
                  :grid-view-option="grdSubProps1.gridViewOption"
                  :keys="grdSubProps1.keys"
                  :fields="grdSubProps1.fields"
                  :columns="grdSubProps1.columns"
                  @onCurrentRowChanged="rowChanged2"
                />
              </div>
            </v-sheet>

            <v-sheet width="50%" class="pa-0 h-auto">
              <IGridTitle :title="$t('부서 PTW 현황')">
                <template #editors />
              </IGridTitle>

              <RealGrid
                ref="grdSub2"
                :grid-view-option="grdSubProps2.gridViewOption"
                :keys="grdSubProps2.keys"
                :fields="grdSubProps2.fields"
                :columns="grdSubProps2.columns"
              />
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
    <DeptPopup ref="dept" :checkBar="true" @selected="selected" />
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
