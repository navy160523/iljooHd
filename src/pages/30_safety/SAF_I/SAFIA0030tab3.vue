<!-- SAFIA0030 사내 협력사 현황 -->
<!-- SI2팀 김성근 작업 -->
<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  registerRuntimeCompiler,
} from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import DeptPopup from "@/components/popup/DeptPopup.vue"

import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import deleteFlowHelper from "@/utils/deleteFlowHelper"

const props = defineProps({
  tab: { type: String, default: "" },
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const grdMain = ref(null)
const menuTitle = ref(null)
const SearchParam = reactive({
  FROMDT: dayjs().subtract(6, "month").format("YYYY-MM-DD"),
  TODT: dayjs().format("YYYY-MM-DD"),
})

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
})

// props 감지
watch(
  () => props.tab,
  (newValue) => {
    if (newValue == "tab3") onButtonsClick({ id: "btnSearch" })
  }
)

// 그리드
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ["COMP_CD"],
  fields: [
    {
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      header: { text: t("소속") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "COMP_NM",
      dataType: "text",
      header: { text: t("협력사명") },
      editable: false,
      styleName: "left-column",
    },

    {
      fieldName: "REG_NO",
      header: { text: t("사업자등록번호") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "text",
      editable: false,
    },

    {
      fieldName: "OWNER_NM",
      dataType: "text",
      header: { text: t("대표자") },
      editable: false,
    },
    {
      fieldName: "TEL_NO",
      dataType: "text",
      header: { text: t("연락처") },
      editable: false,
    },
    {
      fieldName: "ENT_DATE",
      header: { text: t("사업개시일") },
      dataType: "text",
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM-DD") : null
      },
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM-dd",
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM-dd",
          includedFormat: true,
        },
      },
    },
    {
      fieldName: "INSERT_USER_ID",
      header: { text: t("등록자") },
      dataType: "text",
    },
    {
      fieldName: "INSERT_DATE",
      header: { text: t("등록일시") },
      dataType: "text",
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM-DD") : null
      },
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM-dd",
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM-dd",
          includedFormat: true,
        },
      },
    },

    { fieldName: "COMP_CD", visible: false },
    { fieldName: "COMP_CDM", visible: false },
    { fieldName: "COMP_CD_ALL", visible: false },
    { fieldName: "PATH", visible: false },

    //  {fieldName: "COMP_CDMage",visible:false},
  ],
  columns: [],
})
grdProps1.columns = grdProps1.fields

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(true)
      .run()
  }
  if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(Chek)
      .setQuery(DelData)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run()
  }
}
/* 조회 */
const searchData = (idx) => {
  if (!SearchParam.FROMDT) {
    return Message.warn(t("병합일은 필수 입력입니다."))
  }
  if (!SearchParam.TODT) {
    return Message.warn(t("병합일은 필수 입력입니다."))
  }
  return commonSearchApi({ queryId: "SAFIA0030_search03", param: SearchParam })
}
const afterSearch = (res) => {
  console.log(res, "res")
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, "PATH")
  grdMain.value.getGridView().expandAll()
  grdMain.value.getGridView().setColumnProperty("COMP_NM", "autoFilter", true)
}

const Chek = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedRows.length == 0) {
    return Message.warn(t("선택된 행이없습니다."))
  }
  for (let i of checkedRows) {
    let children = grdMain.value.getDataProvider().getChildren(i)
    console.log(grdMain.value.getDataProvider().getJsonRow(i))
    if (children) {
      Message.warn(t("하위 데이터가 있으면 삭제할 수 없습니다."))
      return false
    }
    if (!children) {
      return true
    }
  }
}

const DelData = () => {
  let delMain = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let i of checkedRows) {
    let rowData = grdMain.value.getDataProvider().getJsonRow(i)
    delMain.push(rowData)
  }

  return commonExecuteApi({
    queryId: "SAFIA0030_DELETE_01",
    list: delMain,
  })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-0 mt-3 mr-3">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <v-sheet class="d-flex flex-column fill-height">
        <VForm ref="searchArea" class="searchArea d-flex">
          <i-input
            :label="$t('병합일')"
            width="195px"
            type="Date"
            margin="10px"
            v-model="SearchParam.FROMDT"
            required
          />
          <i-input
            :label="$t('-')"
            width="160px"
            type="Date"
            margin="10px"
            v-model="SearchParam.TODT"
          />
        </VForm>
        <v-sheet class="mb-3" height="75%">
          <RealGrid
            ref="grdMain"
            :is-tree="true"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
          />
        </v-sheet>
      </v-sheet>
      <!-- 조회조건 -->

      <!-- 메인그리드 -->
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px + 13px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
