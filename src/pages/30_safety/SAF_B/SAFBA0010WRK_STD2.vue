<!-- SI2팀 김성근  위험작업 허가서 현황 / 작업표준서 선택팝업 loginCmCd !== '현대중공업' || 'MOS' -->
<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { update, value } from "lodash-es"
import Message from "@hiway/utils/notify"
import { useUserStore } from "@hiway/stores/user"
import queryFlowHelper from "@/utils/searchFlowHelper"
import DeptPopup from "@/components/popup/DeptPopup.vue"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const dialog = ref(false)
const grdMain = ref(null)
const grdDetail = ref(null)
const emit = defineEmits(["selected"])
const deptPopup = ref(null)

let rowData = reactive({})
//  인원검색
const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
  USER_DIV: [
    { COD: "A", TXT: "직영", DISABLE: false },
    { COD: "B", TXT: "사내협력사", DISABLE: false },
  ],
  accdntType: [],
  proc: [],
})

const options = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format("YYYY"),
  asgnfullname: userStore.asgnFullNm,
})

const openPopup = (popupParam) => {
  dialog.value = true
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    console.log(options, "options.year")
    if (!options.YEAR) {
      return Message.warn(t("년도는 필수 입력입니다."))
    }
    if (!options.asgnfullname) {
      return Message.warn(t("부서/협력사는 필수 입력입니다."))
    }
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  } else if (btn.id === "btnSelect") {
    let row = grdDetail.value.getDataProvider().getJsonRows()
    emit("selected", row)
    onButtonsClick({ id: "btnClose" })
  } else if (btn.id === "btnDelete") {
  } else if (btn.id == "btnClose") {
    dialog.value = false
  }
}

const rowChanged = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    return
  }
  rowData = grdMain.value.getDataProvider().getJsonRow(newRow)
}

//  조회
const searchData01 = (idx) => {
  return commonSearchApi({
    queryId: "SAFBA0010_SEARCH_05",
    param: options,
  })
}

const afterSearch01 = (res) => {
  console.log(res, "resMains")
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장

//  삭제

//메인
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },

  keys: ["WS_NM"],
  field: [
    {
      fieldName: "WRK_TITLE",
      dataType: "text",
      header: { text: t("작업명") },
      styleName: "left-column",
    },
    {
      fieldName: "WRK_GUD_NO",
      dataType: "text",

      header: { text: t("표준서NO.") },
    },
    {
      fieldName: "ROUTN_YN",
      dataType: "text",
      header: { text: t("작업분류") },
      editable: false,
      renderer: {
        type: "html",
        callback: (grid, model, field) => {
          return GBNCallback(grid, model, field)
        },
      },
    },
    {
      fieldName: "EVAL_DATE",
      dataType: "text",
      header: { text: t("평가일자") },
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
      fieldName: "EVAL_PRSN",
      dataType: "text",
      header: { text: t("평가위원") },
    },
    {
      fieldName: "RGSTR_YN",
      dataType: "text",
      header: { text: t("등록부 등재여부") },
    },

    // 출력 안함

    { fieldName: "YEAR", dataType: "text", visible: false },
    { fieldName: "SAVE_YN", dataType: "text", visible: false },
    { fieldName: "GUD_SER_NO", dataType: "text", visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "BSNS_CD", dataType: "text", visible: false },
    { fieldName: "ASGN_CD", dataType: "text", visible: false },
    { fieldName: "YN_OUT", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

// grid radio 생성
const GBNCallback = (grid, model, field) => {
  let checkedY = ""
  let checkedN = ""
  if (model._index.value === "Y") {
    checkedY = "checked"
  } else {
    checkedN = "checked"
  }

  return (
    "<input type='radio' " +
    "value='Y'" +
    "name=" +
    "'group" +
    model._index.dataRow +
    "G" +
    "' " +
    checkedY +
    " />" +
    "<span style='padding: 0 10px 0 10px !important; margin-right: 20px;'>일상</span>" +
    "<input type='radio' " +
    "value='N'" +
    "name=" +
    "'group" +
    model._index.dataRow +
    "G" +
    "'" +
    checkedN +
    " />" +
    "<span style='padding: 0 10px 0 10px !important;'>비일상</span>"
  )
}

const openDept = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: "Y",
    ASGN_NM: options.asgnfullname,
  })
}

const onDeptSelected = (row) => {
  options.BSNS_CD = row.BSNS_CD
  options.ASGN_CD = row.ASGN_CD
  options.CMPNY_DIV = row.CMPNY_DIV
  options.asgnfullname = row.ASGN_FULL_NM
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1200"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">작업 표준서</div>

    <VContainer style="background-color: white">
      <IMenuTitle
        :button-list="['btnSearch', 'btnSelect', 'btnClose']"
        @click-button="onButtonsClick"
      />

      <v-row>
        <v-col class="d-flex" cols="12">
          <!-- 인원검색 -->
          <v-col cols="12">
            <VRow>
              <VCol>
                <VForm 
                  ref="searchArea" 
                  class="searchArea"
                  @submit.prevent="onButtonsClick({ id: 'btnSearch' })"
                >
                  <div class="d-flex">
                    <i-select
                      :label="$t('년도')"
                      label-width="50px"
                      width="250px"
                      margin="10px"
                      type="YEAR"
                      v-model="options.YEAR"
                      required
                    />
                    <i-input
                      width="370px"
                      :label="t('부서/협력사')"
                      append-inner-icon="mdi-magnify"
                      v-model="options.asgnfullname"
                      @keydown.enter="
                        (e) => {
                          openDept()
                        }
                      "
                      @click:appendInner="openDept()"
                      required
                    />
                  </div>
                </VForm>
              </VCol>
            </VRow>
            <!-- /조회조건 -->

            <!-- 메인그리드 -->
            <VRow>
              <VCol>
                <RealGrid
                  ref="grdMain"
                  class="mt-2"
                  style="height: 500px"
                  :gridViewOption="grdMainProps.gridViewOption"
                  :fields="grdMainProps.field"
                  :columns="grdMainProps.columns"
                />
              </VCol>
            </VRow>
          </v-col>
        </v-col>
      </v-row>

      <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
