<!-- SAFIA0030 사내 협력사 현황 -->
<!-- SI2팀 김성근 작업 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"

import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const grdMain = ref(null)
const grdDetail = ref(null)
const menuTitle = ref(null)
const searchParam = reactive({
  COMP_NM: "",
})
const SearchParamDetail = reactive({
  COMP_NM: "",
})
const changeData = ref("")
const expandData = ref("")
const emit = defineEmits(["Saved"])

// 그리드
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ["COMP_CD"],
  fields: [
    {
      fieldName: "ASGN_NM",
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

    { fieldName: "COMP_CD", visible: false },
    { fieldName: "ASGN_CD", visible: false },
    { fieldName: "ALLCOMP_CDASGN", visible: false },
  ],
  columns: [],
})
grdProps1.columns = grdProps1.fields
 
const grdProps2 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ["COMP_CD"],
  fields: [
    {
      fieldName: "ASGN_NM",
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

    { fieldName: "COMP_CD", visible: false },
    { fieldName: "ASGN_CD", visible: false },
    { fieldName: "ALLCOMP_CDASGN", visible: false },
    { fieldName: "COMP_CDM", visible: false },
    { fieldName: "COMP_CD_ALL", visible: false },
    { fieldName: "isCreate", visible: false },

    //  {fieldName: "COMP_CDMage",visible:false},
  ],
  columns: [],
})
grdProps2.columns = grdProps2.fields

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()
  }
}

const onSubButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setQuery(searchData02)
      .setAfter(afterSearch02)
      .showMessage(true)
      .run()
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(Check)
      .setQuery(saveData)
      .setAfter(() => {
        emit("Saved")
      }).run()
  }
}

// 조회

const searchData01 = () => {
  if (!searchParam.COMP_NM) {
    return Message.warn(t("협력사명은 필수 입력입니다."))
  }

  return commonSearchApi({ queryId: "SAFIA0030_search02", param: searchParam })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const searchData02 = () => {
  if (!SearchParamDetail.COMP_NM) {
    return Message.warn(t("협력사명은 필수 입력입니다."))
  }
  return commonSearchApi({
    queryId: "SAFIA0030_search02",
    param: SearchParamDetail,
  })
}

const afterSearch02 = async (res) => {
  // for(let i in res.ORESULT_CUR){
  //   res.ORESULT_CUR[i].COMP_CDMage = res.ORESULT_CUR[i].COMP_CD
  // }
  await grdDetail.value
    .getDataProvider()
    .setRows(res.ORESULT_CUR, "ALLCOMP_CDASGN")
}

//  저장
const Check = () => {
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true)
  if (checkedRows.length == 0) {
    Message.warn(t("선택된 행이 없습니다."))
    return false
  }
  for (let i of checkedRows) {
    let parents = grdDetail.value.getDataProvider().getAncestors(i)
    //  부모가 있거나 부모가 [] 이면 true ,없으면  fasle
    let include = parents.length == 0 ? true : checkedRows.includes(parents[0])
    if (!include) {
      return Message.warn(t("부모행이 선택되어있지 않습니다."))
    }
  }

  return true
}

const saveData = () => {
  let saveParamsMain = []
  let saveParamsDeatil = []
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true)
  for (let i of checkedRows) {
    let parents = grdDetail.value.getDataProvider().getAncestors(i)
    let codm = grdDetail.value.getDataProvider().getJsonRow(parents)
    let rows = grdDetail.value.getDataProvider().getJsonRow(i)

    if (parents.length == 0) {
      saveParamsMain.push(rows)
    } else {
      rows.COMP_CDM = codm.COMP_CD
      saveParamsMain.push(rows)
    }
  }

  return commonExecuteApi({
    queryId: "SAFIA0030_save02",
    list: saveParamsMain,
  }).then((res) => {
  })
}

const TongHap = () => {
  let param = {}
  let setData = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let checkData = grdDetail.value.getDataProvider()
  let getArr = checkData.getJsonRows()
  let checkedRowDetail = grdDetail.value.getGridView().getCheckedRows(true)

  if (checkedRowDetail.length == 0) {
    changeData.value = ""
    return Message.warn(t("선택된 행이없습니다."))
  }

  if (checkedRowDetail.length > 1) {
    return Message.warn(t("협력사 병합은 한건만처리가능합니다."))
  }

  if (!getArr) {
    return Message.warn(t("검색 후 사용해 주십시오."))
  }

  if (checkedRows.length == 0) {
    return Message.warn(t("선택된 행이없습니다."))
  }
  if (changeData.value == "") {
    return Message.warn(t("추가된 행에는 추가시킬수없습니다."))
  }
  for (let i of checkedRows) {
    param = grdMain.value.getDataProvider().getJsonRow(i)
    setData.push(param)
  }

  if (changeData.value) {
    let self = grdDetail.value.getDataProvider().getJsonRow(checkedRowDetail[0])
    let selfArr = []

    selfArr.push(self)
    let checked = checkData.getChildren(checkedRowDetail[0])
    if (checked) {
      let rows = checkData.getJsonRows(checkedRowDetail[0])
      let result = rows.length >= setData.length ? rows : setData
      let cnt = -1
      for (let i of result) {
        cnt++
        if (setData[cnt] !== undefined) {
          let selfRoll = selfArr.some(
            (x) => x.ALLCOMP_CDASGN === setData[cnt].ALLCOMP_CDASGN
          )
          if (selfRoll) {
            return Message.warn(t("동일한 협력사는 부모가될수없습니다."))
          }
          let checkRule = rows.some(
            (x) => x.ALLCOMP_CDASGN === setData[cnt].ALLCOMP_CDASGN
          )

          if (!checkRule) {
            grdDetail.value.getGridView().filterPanel.clearInput()
            let addrow = grdDetail.value.getDataProvider().addChildRow(
              checkedRowDetail[0],
              {
                ASGN_CD: setData[cnt].ASGN_CD,
                ASGN_NM: setData[cnt].ASGN_NM,
                COMP_CD: setData[cnt].COMP_CD,
                COMP_CD: setData[cnt].COMP_CD,
                COMP_NM: setData[cnt].COMP_NM,
                ENT_DATE: setData[cnt].ENT_DATE,
                OWNER_NM: setData[cnt].OWNER_NM,
                REG_NO: setData[cnt].REG_NO,
                TEL_NO: setData[cnt].TEL_NO,
                isCreate: "Y",
              },
              -1,
              false
            )
            grdDetail.value.getGridView().expand(expandData.value)
            grdDetail.value.getGridView().checkRow(addrow, true, false, false)
          }
        }
      }
    } else {
      let cnt = -1
      for (let i of setData) {
        cnt++
        let selfRoll = selfArr.some(
          (x) => x.ALLCOMP_CDASGN === setData[cnt].ALLCOMP_CDASGN
        )

        if (selfRoll) {
          return Message.warn(t("동일한 협력사는 부모가될수없습니다."))
        }

        grdDetail.value.getGridView().filterPanel.clearInput()
        let addrow = grdDetail.value.getDataProvider().addChildRow(
          checkedRowDetail[0],
          {
            ASGN_CD: i.ASGN_CD,
            ASGN_NM: i.ASGN_NM,
            COMP_CD: i.COMP_CD,
            COMP_NM: i.COMP_NM,
            ENT_DATE: i.ENT_DATE,
            OWNER_NM: i.OWNER_NM,
            REG_NO: i.REG_NO,
            TEL_NO: i.TEL_NO,
            isCreate: "Y",
          },
          -1,
          false
        )
        grdDetail.value.getGridView().checkRow(addrow, true, false, false)
      } 
      grdDetail.value.getGridView().expand(expandData.value)
    }
  }
}

const Cancel = () => {
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true)
  if (checkedRows.length == 0) {
    return Message.warn(t("선택된 행이없습니다."))
  }

  if (changeData.value !== "") {
    return Message.warn(t("기존행 은 삭제할수없습니다."))
  }

  for (let i of checkedRows) {
    let parents = grdDetail.value.getDataProvider().getAncestors(i)

    if (parents.length != 0) {
      grdDetail.value.getDataProvider().removeRow(i)
    } else {
      changeData.value = i
    }
  }
}

const onCellClicked = (grid, clickData) => {
  if (clickData.cellType == "data" || clickData.cellType == "check") {
    let row = grdDetail.value.getDataProvider().getJsonRow(clickData.dataRow)
    if (!row.isCreate) {
      changeData.value = clickData.dataRow
      expandData.value = clickData.itemIndex
    } else {
      changeData.value = ""
    }
  } else {
    return
  }
}

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  grdDetail.value.getGridView().filterPanel.visible = true
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="h-grow h-auto">
        <v-sheet class="d-flex flex-column h-auto mr-3" width="45%">
          <v-card-title class="pa-0 mt-3 mr-3">
            <IGridTitle
              :title="$t('흡수대상 협력사')"
              ref="menuTitle"
              :button-list="['btnSearch']"
              @click-button="onButtonsClick({ id: 'btnSearch' })"
            />
          </v-card-title>
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('협력사명')"
              width="200px"
              margin="10px"
              v-model="searchParam.COMP_NM"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
              required
            />
          </v-sheet>
          <v-sheet class="mb-3" height="75%">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
            />
          </v-sheet>
        </v-sheet>

        <v-sheet
          class="d-flex flex-column h-auto mr-3 justify-center"
          width="10%"
        >
          <v-btn class="mb-3" @click="TongHap">통합</v-btn>
          <v-btn @click="Cancel">취소</v-btn>
        </v-sheet>

        <v-sheet class="d-flex flex-column h-auto" width="45%">
          <v-card-title class="pa-0 mt-3 mr-3">
            <IGridTitle
              :title="$t('인수기업(최종)')"
              ref="menuTitle"
              :button-list="['btnSearch', 'btnUpdate']"
              @click-button="onSubButtonsClick"
            />
          </v-card-title> 
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('협력사명')"
              width="200px"
              margin="10px"
              v-model="SearchParamDetail.COMP_NM"
              @keypress.enter="onSubButtonsClick({ id: 'btnSearch' })"
              required
            />
          </v-sheet>
          <v-sheet class="mb-3" height="75%">
            <RealGrid
              ref="grdDetail"
              :grid-view-option="grdProps2.gridViewOption"
              :is-tree="true"
              :keys="grdProps2.keys"
              :fields="grdProps2.fields"
              :columns="grdProps2.columns"
              :column-layout="grdProps2.columnLayout"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </v-sheet>
      </div>
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
