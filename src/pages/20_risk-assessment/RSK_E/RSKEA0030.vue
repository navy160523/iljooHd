<!-- 2024-11-01  이규호  위험성평가 수준평가 체크리스트 관리-->

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
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"

defineOptions({
  name: "20_risk_assessment-RSK_E-RSKEA0030",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const searchParams = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv,  
})
const grdMain = ref(null)
const grdSub = ref(null)
const ChangeRow = ref({})
const codeList = reactive({
  USE_YN: [
    { COD: "", TXT: "전체" },
    { COD: "Y", TXT: "사용" },
    { COD: "N", TXT: "미사용" },
  ],
})

const subTitle = ref(null)

onMounted(() => {
  onButtonsClick({ id: "btnSearch" })
  
  subTitle.value.disableBtn("btnCreate2", true)
  subTitle.value.disableBtn("btnUpdate2", true)
  subTitle.value.disableBtn("btnDelete2", true)
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  keys: [],
  fields: [    
    {
      fieldName: "CHECK_NM",
      width: "300",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("수준평가 명") },
    },    
    {
      fieldName: "USE_YN",
      width: "70",
      dataType: "text",
      editable: false,
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      header: { text: t("사용유무") },
    },    
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },    
    { fieldName: "CHECK_ID", dataType: "text", visible: false },
    { fieldName: "CHECK_DIV", dataType: "text", visible: false },
    { fieldName: 'INS_USR', dataType: 'text', visible: false },
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
      fieldName: "CHECK_LIST_ITEM",
      width: "300",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("수준평가 Check List") },
    },    
    {
      fieldName: "CHECK_LIST_SEQ",
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
    { fieldName: "CHECK_ID", dataType: "text", visible: false },
    { fieldName: "CHECK_LIST_ID", dataType: "text", visible: false },
    { fieldName: 'INS_USR', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.fields

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
    for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){            
      grdMain.value.getDataProvider().setValue(i, 'USE_YN', 'N')
      grdMain.value.getGridView().checkRow(i, true)
    }

    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      USE_YN: "Y",
      CHECK_ID: "",
      INS_USR : userStore.userId,
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
      CHECK_ID: ChangeRow.value.CHECK_ID,
      CHECK_LIST_ID: "",
      INS_USR : userStore.userId,
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

// 메인조회
const searchData = () => {
  return commonSearchApi({
    queryId: "RSKEA0030_SEARCH_01",
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
  } else {
    for (let i of chekedRow) {
      let data = grdMain.value.getDataProvider().getJsonRow(i)
      if(!data.CHECK_NM){
        return Message.warn(t("수준평가 명을 입력해주세요."))
      }
    }
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
  return commonExecuteApi({ queryId: "RSKEA0030_SAVE_01", list: param })
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
  return commonExecuteApi({ queryId: "RSKEA0030_DELETE_01", list: param })
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
  return commonExecuteApi({ queryId: "RSKEA0030_SAVE_02", list: param })
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

// 서브삭제
const deleteData2 = () => {
  let param = []
  let chekedRow = grdSub.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdSub.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }

  return commonExecuteApi({ queryId: "RSKEA0030_DELETE_02", list: param })
}

// rowChanged 이벤트

const rowChanged = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    ChangeRow.value.P_WRK_ID = null
    grdSub.value.getDataProvider().setRows(null)
    subTitle.value.disableBtn("btnCreate2", true)
    subTitle.value.disableBtn("btnUpdate2", true)
    subTitle.value.disableBtn("btnDelete2", true)
    return
  }
  ChangeRow.value = null
  grdSub.value.getDataProvider().setRows(null)
  ChangeRow.value = grdMain.value.getDataProvider().getJsonRow(newRow)
  if (ChangeRow.value.CHECK_ID) {
    commonSearchApi({
      queryId: "RSKEA0030_SEARCH_02",
      param: ChangeRow.value,
    }).then((res) => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

//셀변경 이벤트
const onCellEdited = async (grid, itemIndex, row, field) => {
  console.log('row', row)
  console.log('itemIndex', itemIndex)
  let fieldName = grdMain.value.getGridView().getColumn(field)
  console.log('필드네임', fieldName)
  if (fieldName.name === 'USE_YN') {
    let data = grdMain.value.getDataProvider().getJsonRow(row)
    if (data.USE_YN === 'Y') {
      for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){      
        if(i === itemIndex) {
          continue
        } else {       
          grdMain.value.getDataProvider().setValue(i, 'USE_YN', 'N')
          grdMain.value.getGridView().checkRow(i, true)
        }
      }
    }
  }
}

// watch
watch(
  () => ChangeRow.value.CHECK_ID,
  (newValue) => {
    if (!newValue) {
      subTitle.value.disableBtn("btnCreate2", true)
      subTitle.value.disableBtn("btnUpdate2", true)
      subTitle.value.disableBtn("btnDelete2", true)
    } else {
      subTitle.value.disableBtn("btnCreate2", false)
      subTitle.value.disableBtn("btnUpdate2", false)
      subTitle.value.disableBtn("btnDelete2", false)
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

        <v-sheet class="h-auto">
          <div class="h-grow">
            <v-sheet width="60%" class="pa-0 h-auto mr-3">
              <IGridTitle
                :title="$t('수준평가 Check List')"
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
                @onCellEdited="onCellEdited"
              />
            </v-sheet>

            <v-sheet width="40%" class="pa-0 h-auto">
              <IGridTitle
                :title="$t('Check List 상세 항목')"
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
              />
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
