<!-- 2024-04-16  김성근 SI2팀  SAFBD0030 / 허가작업(PTW) 대상/체크리스트 관리-->

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
  name: "30_safety-SAF_B-SAFBD0030",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const searchParams = reactive({
  WRK_DIV: "",
  USE_YN: "",
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: "",
})
const grdMain = ref(null)
const grdSub = ref(null)
const grdSubSafeCare = ref(null)
const ChangeRow = ref({})
const codeList = reactive({
  USE_YN: [
    { COD: "", TXT: "전체" },
    { COD: "Y", TXT: "사용" },
    { COD: "N", TXT: "미사용" },
  ],
})

const subTitle = ref(null)
const subTitleSafeCare = ref(null)

onMounted(() => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
    }),
    getCodeList("HHIE150"),
    getCodeList("HHIE120", "HHI", "Y", "0", null, "N"),
    getCodeList("HHIE160"),
  ]).then((res) => {
    console.log(res[2])
    codeList.WRK_DIV = res[1].ORESULT_CUR.filter((x) => x.CODE_DESC1 !== "Y")
    grdMain.value.setBindingColumn(
      "BSNS_CD",
      res[0].ORESULT_CUR,
      "BSNS_CD",
      "BSNS_NM"
    )
    grdMain.value.setBindingColumn("WRK_DIV", codeList.WRK_DIV, "COD", "TXT")
    grdMain.value.setBindingColumn("DANG_DIV", res[2].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn(
      "CF_DIV",
      res[3].ORESULT_CUR.filter((x) => x.TXT !== "수기"),
      "COD",
      "TXT"
    )
    codeList.WRK_DIV.unshift({ TXT: "전체", COD: "" })
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
  })
  subTitle.value.disableBtn("btnCreate2", true)
  subTitle.value.disableBtn("btnUpdate2", true)
  subTitle.value.disableBtn("btnDelete2", true)
  subTitleSafeCare.value.disableBtn("btnUpdate", true)

  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
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
      header: { text: t("작업명") },
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
      fieldName: "THE_SAFE_CARE", 
      dataType: "text",
      header: { text: t("The Safe Care") },
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
    { fieldName: "P_WRK_ID", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: "CHECK_DESC",
      width: "300",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("점검내용") },
    },
    {
      fieldName: "CHECK_IMP",
      dataType: "text",
      editable: false,
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      header: { text: t("핵심점검항목") },
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
      fieldName: "USE_YN",
      dataType: "text",
      editable: false,
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      header: { text: t("사용유무") },
    },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "P_WRK_ID", dataType: "text", visible: false },
    { fieldName: "CHECK_SEQ", dataType: "text", visible: false },
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.fields

//SafeCare 그리드 속성셋팅
const grdSubSafeCareProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "THE_SAFE_CARE_NM",
      width: "300",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("핵심안전수칙") },
    },
    {
      fieldName: "TARGET_YN",
      dataType: "text",
      editable: true,
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      header: { text: t("대상여부") },
    },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "P_WRK_ID", dataType: "text", visible: false },
    { fieldName: "THE_SAFE_CARE_CD", dataType: "text", visible: false },
  ],
  columns: [],
})

grdSubSafeCareProps.columns = grdSubSafeCareProps.fields

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
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  }

  if (btn.id === "btnCreate") {
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      USE_YN: "Y",
      P_WRK_ID: "",
    })
  }
  if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  }

  // 서브그리드
  if (btn.id === "btnCreate2") {
    // console.log(ChangeRow.value,'ChangasdeRow.value')
    grdSub.value.addRow({
      CMPNY_DIV: ChangeRow.value.CMPNY_DIV,
      USE_YN: "Y",
      P_WRK_ID: ChangeRow.value.P_WRK_ID,
    })
  }
  if (btn.id === "btnUpdate2") {
    new saveFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeSave2)
      .setQuery(saveData2)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  }
  if (btn.id === "btnDelete2") {
    new deleteFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeDelete2)
      .setQuery(deleteData2)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  }
}

const onButtonsClick2 = (btn) => {  

  if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setGridList([grdSubSafeCare])
      .setBefore(beforeSave3)
      .setQuery(saveData3)
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
  let chekedRow = grdMain.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  return true
}

const saveData = () => {
  let param = []
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }
  return commonExecuteApi({ queryId: "SAFBD0030_SAVE01", list: param })
}

const beforeDelete = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  if (grdSub.value.getDataProvider().getRows().length !== 0) {
    Message.warn(t("하위 데이터가 있으면 삭제할 수 없습니다.."))
    return false
  }
  return true
}

// 메인삭제
const deleteData = () => {
  let param = []
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }
  return commonExecuteApi({ queryId: "SAFBD0030_DELETE_01", list: param })
}

// 서브 저장
const beforeSave2 = () => {
  let chekedRow = grdSub.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  return true
}

const saveData2 = () => {
  let param = []
  let chekedRow = grdSub.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdSub.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }
  return commonExecuteApi({ queryId: "SAFBD0030_SAVE02", list: param })
}

// 서브 삭제
const beforeDelete2 = () => {
  let chekedRow = grdSub.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  return true
}

// 메인삭제
const deleteData2 = () => {
  let param = []
  let chekedRow = grdSub.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdSub.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }

  return commonExecuteApi({ queryId: "SAFBD0030_DELETE_02", list: param })
}

// grdSubSafeCare 서브 저장
const beforeSave3 = () => {
  let chekedRow = grdSubSafeCare.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  return true
}

const saveData3 = () => {
  let param = []
  let chekedRow = grdSubSafeCare.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdSubSafeCare.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }
  return commonExecuteApi({ queryId: "SAFBD0030_SAVE03", list: param })
}

// rowChanged 이벤트

const rowChanged = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    ChangeRow.value.P_WRK_ID = null
    grdSub.value.getDataProvider().setRows(null)
    grdSubSafeCare.value.getDataProvider().setRows(null)
    subTitle.value.disableBtn("btnCreate2", true)
    subTitle.value.disableBtn("btnUpdate2", true)
    subTitle.value.disableBtn("btnDelete2", true)
    subTitleSafeCare.value.disableBtn("btnUpdate", true)
    return
  }
  ChangeRow.value = null
  grdSub.value.getDataProvider().setRows(null)
  grdSubSafeCare.value.getDataProvider().setRows(null)
  ChangeRow.value = grdMain.value.getDataProvider().getJsonRow(newRow)
  if (ChangeRow.value.P_WRK_ID) {
    Promise.all([
      commonSearchApi({
        queryId: "SAFBD0030_SEARCH_02",
        param: ChangeRow.value,
      }),
      commonSearchApi({
        queryId: "SAFBD0030_SEARCH_03",
        param: ChangeRow.value,
      }),
    ]).then((res) => {
      grdSub.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      grdSubSafeCare.value.getDataProvider().setRows(res[1].ORESULT_CUR)
      
    })    
  }
}

// watch
watch(
  () => ChangeRow.value.P_WRK_ID,
  (newValue) => {
    if (!newValue) {
      subTitle.value.disableBtn("btnCreate2", true)
      subTitle.value.disableBtn("btnUpdate2", true)
      subTitle.value.disableBtn("btnDelete2", true)
      subTitleSafeCare.value.disableBtn("btnUpdate", true)
    } else {
      subTitle.value.disableBtn("btnCreate2", false)
      subTitle.value.disableBtn("btnUpdate2", false)
      subTitle.value.disableBtn("btnDelete2", false)
      subTitleSafeCare.value.disableBtn("btnUpdate", false)
    }
  }
)
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
            required
          />
          <i-select
            :label="$t('공종/계열')"
            labelWidth="70px"
            width="250px"
            v-model="searchParams.WRK_DIV"
            :items="codeList.WRK_DIV"
            item-value="COD"
            item-title="TXT"
            required
          />
          <i-select
            :label="$t('사용유무')"
            labelWidth="70px"
            width="250px"
            v-model="searchParams.USE_YN"
            :items="codeList.USE_YN"
            item-value="COD"
            item-title="TXT"
            required
          />
        </v-sheet>

        <v-sheet class="h-auto">
          <div class="h-grow">
            <v-sheet width="60%" class="pa-0 h-auto mr-3">
              <IGridTitle
                :title="$t('PTW 대상')"
                :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
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
            </v-sheet>

            <v-sheet width="40%" class="pa-2">
              <VRow no-gutters>
                <VCol>
                  <IGridTitle
                    :title="$t('PTW 체크리스트')"
                    :button-list="['btnCreate2', 'btnUpdate2', 'btnDelete2']"
                    ref="subTitle"
                    @click-button="onButtonsClick"
                  >
                    <template #editors />
                  </IGridTitle>

                  <RealGrid
                    ref="grdSub"
                    :grid-view-option="grdSubProps.gridViewOption"
                    :keys="grdSubProps.keys"
                    :fields="grdSubProps.fields"
                    :columns="grdSubProps.columns"
                    style="height:90%"
                  />
                </VCol>
              </VRow>
              <VRow>
                <VCol>
                  <IGridTitle
                    :title="$t('The Safe Care 대상')"
                    :button-list="['btnUpdate']"
                    ref="subTitleSafeCare"
                    @click-button="onButtonsClick2"
                  >
                    <template #editors />
                  </IGridTitle>

                  <RealGrid
                    ref="grdSubSafeCare"
                    :grid-view-option="grdSubSafeCareProps.gridViewOption"
                    :keys="grdSubSafeCareProps.keys"
                    :fields="grdSubSafeCareProps.fields"
                    :columns="grdSubSafeCareProps.columns"
                    style="height:90%"
                  />
                </VCol>
              </VRow>              
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
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
