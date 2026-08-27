<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  onBeforeMount,
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
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import { commonExcelDownApi } from "@hiway/api/commonApi"
import { excelDown } from "@/utils/excel"
defineOptions({
  name: "MNGAA0020",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const grdSub = ref(null)
const menuTitle = ref(null)
const userId = ref(userStore.userId)
let checkedRow = reactive([])
const codeList = reactive({
  LIC_KIND: [], //자격종류
})

let searchParams = reactive({
  LIC_KIND: "",
})
let searchParams2 = reactive({})
//그리드 속성셋팅
const grdMainProps = reactive({
  fields: [
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("사업장구분") },
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("자격사번") },
    },
    {
      fieldName: "LIC_KIND",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("자격종류") },
    },
    {
      fieldName: "LIC_GET_DT",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("자격취득일") },
    },
    {
      fieldName: "MORGN_ID",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("발행처") },
    },
    {
      fieldName: "INSERT_USER_ID",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("등록자") },
    },
    {
      fieldName: "INSERT_DATE",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("등록일시") },
    },
    {
      fieldName: "UPDATE_USER_ID",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("수정자") },
    },
    {
      fieldName: "UPDATE_DATE",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("수정일시") },
    },
    {
      fieldName: "RMK",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("비고") },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// //그리드 속성셋팅
const grdSubProps = reactive({
  fields: [
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      width: "100",
      header: { text: t("사업장구분") },
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "100",
      header: { text: t("자격사번") },
    },
    {
      fieldName: "LIC_KIND",
      dataType: "text",
      width: "100",
      header: { text: t("자격종류") },
    },
    {
      fieldName: "LIC_GET_DT",
      dataType: "text",
      width: "100",
      header: { text: t("자격취득일") },
    },
    {
      fieldName: "EDU_DATE",
      dataType: "text",
      width: "100",
      header: { text: t("보수교육이수일") },
    },
    {
      fieldName: "LIC_STATUS",
      dataType: "text",
      width: "100",
      header: { text: t("자격상태") },
    },
    {
      fieldName: "LICE_TYPE",
      dataType: "text",
      width: "100",
      header: { text: t("자격구분") },
    },
    {
      fieldName: "INSERT_USER_ID",
      dataType: "text",
      width: "100",
      header: { text: t("등록자") },
    },
    {
      fieldName: "INSERT_DATE",
      dataType: "text",
      width: "100",
      header: { text: t("등록일시") },
    },
    {
      fieldName: "UPDATE_USER_ID",
      dataType: "text",
      width: "100",
      header: { text: t("수정자") },
    },
    {
      fieldName: "UPDATE_DATE",
      dataType: "text",
      width: "100",
      header: { text: t("수정일시") },
    },
    {
      fieldName: "RMK",
      dataType: "text",
      width: "100",
      header: { text: t("비고") },
    },
    {
      fieldName: "STATUS_EXP_DATE",
      dataType: "text",
      width: "100",
      header: { text: t("상태고정만료일") },
    },
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.fields

let testParam = {
  사업장구분: "CMPNY_DIV",
  자격사번: "EMP_NO",
  자격종류: "LIC_KIND",
  자격취득일: "LIC_GET_DT",
  발행처: "MORGN_ID",
  등록자: "INSERT_USER_ID",
  등록일시: "INSERT_DATE",
  수정자: "UPDATE_USER_ID",
  수정일시: "UPDATE_DATE",
  비고: "RMK",
}
let id = "main_search01"
let sheetName = "excelTestSheet"
let fileName = "excel00_1"

onBeforeMount(() => {
  commonSearchApi({
    queryId: "searchLicKind2",
    param: { CMPNY_DIV: userStore.company },
  }).then((res) => {
    codeList.LIC_KIND = res
  })
})

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  } else if (btn.id === "btnExcel") {
    excelDown(testParam, searchParams, id, sheetName, fileName)
  } else if (btn.id === "btnCreate") {
    addRowData()
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  }
}
const beforeSave = () => {
  return true
}

const beforeDelete = () => {
  return true
}

const searchData = () => {
  return commonSearchApi({
    queryId: "main_search01",
    param: searchParams,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const afterSave2 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const beforeSearch = async () => {
  return true
}
//메인그리드 로우가 변경될때 발생하는 이벤트(디테일 그리드를 조회한다.)
const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData2, newIdx)
    .setAfter(afterSearch02)
    .run()
}

const searchData2 = (idx) => {
  let row = grdMain.value.getDataProvider().getJsonRow(idx)
  searchParams2.LIC_KIND = row.LIC_KIND
  searchParams2.CMPNY_DIV = userStore.company
  return commonSearchApi({
    queryId: "detail_search01",
    param: searchParams2,
  })
}

const afterSearch02 = (res) => {
  if (res.length >= 1) {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  } else {
    Message.err("데이터가 없습니다.")
    grdSub.value.getDataProvider().setRows("")
  }
}
//로우 추가하는 함수
const addRowData = () => {
  grdSub.value.addRow({})
}

//저장버튼 눌렀을때 실행되는 함수
const saveData = () => {
  let saveParams = []
  let updateParams = []
  const updatedRows = grdSub.value.getDataProvider().getStateRows("updated")
  const createdRows = grdSub.value.getDataProvider().getStateRows("created")
  for (let rowIdx of createdRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  for (let rowIdx of updatedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId: "detail_save01", list: saveParams })
}

const deleteData = () => {
  let deleteParams = []
  const updatedRows = grdSub.value.getDataProvider().getStateRows("updated")
  const createdRows = grdSub.value.getDataProvider().getStateRows("created")
  for (let rowIdx of createdRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }
  for (let rowIdx of updatedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }
  return commonExecuteApi({ queryId: "detail_delete01", list: deleteParams })
}
</script>

<template>
  <div>
    <VContainer class="pt-0">
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <VRow no-gutters>
        <VCol>
          <VForm ref="searchArea" class="searchArea">
            <VRow>
              <VCol cols="12" md="4">
                <ILabel :label="$t('자격종류')">
                  <template #editor="editorProps">
                    <VAutocomplete
                      v-model="searchParams.LIC_KIND"
                      :items="codeList.LIC_KIND"
                      item-title="TXT"
                      item-value="COD"
                    />
                  </template>
                </ILabel>
              </VCol>
            </VRow>
          </VForm>
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="6">
          <IGridTitle :title="$t('장비자격')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 700px"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCurrentRowChanged="onGrdMainCurrRowChanged"
          />
        </VCol>
        <VCol cols="6">
          <IGridTitle
            title="장비자격상태"
            :button-list="['btnCreate', 'btnUpdate', 'btnDelete', 'btnExcel']"
            @click-button="onButtonsClick"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdSub"
            class="mt-2"
            style="height: 700px"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :grid-view-option="grdSubProps.gridViewOption"
            @onItemChecked="checkItem"
          />
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
