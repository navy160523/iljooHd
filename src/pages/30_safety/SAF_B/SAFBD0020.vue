<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { commonExecuteApi, commonSearchApi } from "@/@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
/*위험작업 분류별 체크리스트 화면*/

defineOptions({
  name: "30_safety-SAF_B-SAFBD0020",
})

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const menuTitle = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)
const grdSub = ref(null)
//위험작업분류 그리드 조회조건
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})
//위험작업 분류별 체크리스트 조회조건
const searchParam2 = reactive({
  CMPNY_DIV: "",
  WORK_DIV: "",
})

//위험작업분류 그리드 속성셋팅
const grdMainProps = reactive({
  fields: [
    {
      fieldName: "SYS_CD",
      dataType: "text",
      editable: false,
      header: { text: t("작업분류CODE") },
    },
    {
      fieldName: "SYS_CDNM",
      dataType: "text",
      editable: false,
      header: { text: t("작업분류명") },
      styleName: "left-column",
    },
    {
      fieldName: "ALL_SYS_CD",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "MAXCNT",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ORDER_NUM",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "USE_FLAG",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
  ],
  columns: [],
})

//위험작업 분류별 체크리스트 속성셋팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: "CHKLIST_DESC",
      width: "280",
      dataType: "text",
      header: { text: t("체크리스트") },
      styleName: "left-column editable_column",
    },
    {
      fieldName: "ORDER_NUM",
      dataType: "text",
      editor: {
        mask: {
          editMask: "0",
          inputCharacters: "1-8",
        },
        //type: "number",
        // //integerOnly: true,
      },
      header: { text: t("순번") },
      styleName: "editable_column",
    },
    {
      fieldName: "CHK_SEQ",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "SAVE_YN",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "WORK_DIV",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

onMounted(() => {
  onButtonsClick({ id: "btnSearch" })
})

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === "btnCreate") {
    addRow()
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}
//추가관련 로직 시작
const addRow = () => {
  let rowLength = grdSub.value.getDataProvider().getRowCount()
  if (rowLength >= 8) {
    Message.warn(
      t(
        "체크리스트는 최대 8개까지만 작성할 수 있습니다. 추가 필요시 관리자께 문의하세요."
      )
    )
    return false
  }
  const addedRow = {
    CMPNY_DIV: userStore.cmpnyDiv,
    WORK_DIV: searchParam2.WORK_DIV,
    GBN1: "KOR",
    GBN2: "ENG",
    CHK_SEQ: "0",
    SAVE_YN: "N",
  }

  if (rowLength === 0) {
    addedRow.ORDER_NUM = 1
  } else {
    let seq = grdSub.value.getDataProvider().getFieldValues("ORDER_NUM")
    addedRow.ORDER_NUM = parseInt(seq[seq.length - 1]) + 1
  }
  grdSub.value.addRow(addedRow)
}

//추가관련 로직 끝

//저장관련 로직 시작
const beforeSave = () => {
  let chkNum = grdSub.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t("저장할 데이터를 선택해주세요."))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let chkNum = grdSub.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdSub.value.getDataProvider().getJsonRow(chkNum[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      WORK_DIV: data.WORK_DIV,
      CHK_SEQ: data.CHK_SEQ,
      CHKLIST_DESC: data.CHKLIST_DESC,
      ORDER_NUM: data.ORDER_NUM,
      USER_ID: userStore.userId,
      SAVE_YN: data.SAVE_YN,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: "SAFBD0020_SAVE01",
    list: saveParam,
  })
}

const afterSave = () => {
  onButtonsClick({ id: "btnSearch" })
}
//저장관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let chkNum = grdSub.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t("삭제할 데이터를 선택해주세요."))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let chkNum = grdSub.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdSub.value.getDataProvider().getJsonRow(chkNum[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV,
      WORK_DIV: data.WORK_DIV,
      CHK_SEQ: data.CHK_SEQ,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: "SAFBD0020_DELETE01",
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: "btnSearch" })
}
//삭제관련 로직 끝

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: "SAFBD0020_SEARCH01",
    param: searchParam,
  })
}

const afterSearch = (res) => {
  console.log("메인", res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  let data = grdMain.value.getDataProvider().getJsonRow(newIdx)
  searchParam2.CMPNY_DIV = data.CMPNY_DIV
  searchParam2.WORK_DIV = data.SYS_CD
  new queryFlowHelper(vm, t)
    .setUseDefaultBefore(false)
    .setQuery(searchData02, newIdx)
    .setAfter(afterSearch02)
    .showMessage(false)
    .run()
}

const searchData02 = () => {
  return commonSearchApi({
    queryId: "SAFBD0020_SEARCH02",
    param: searchParam2,
  })
}

const afterSearch02 = (res) => {
  console.log("res", res)
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//조회관련 로직 끝

//
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-2">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <div class="h-grow">
          <v-sheet width="30%" class="pa-0 h-auto mr-3">
            <IGridTitle :title="$t('위험작업 분류')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCurrentRowChanged="onGrdMainCurrRowChanged"
              @onRowInserted="onRowInserted"
            />
          </v-sheet>
          <v-sheet width="70%" class="pa-0 h-auto">
            <IGridTitle
              :title="$t('위험작업 분류별 체크리스트')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              class="mt-2"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              @onRowCountChanged="onRowCountChanged"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
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
