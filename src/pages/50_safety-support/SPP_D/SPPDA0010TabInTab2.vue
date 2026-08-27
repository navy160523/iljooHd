<!-- SPPDA0010Tab2위험기계기구  인증/검사 탭-->
<!-- SI2팀 김성근 2024-04-03  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
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
import { useUserStore } from "@hiway/stores/user"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const grdMain = ref(null)
const emit = defineEmits(["saveData", "resetValue"])
const fileIndexgrd = ref(null)
const fileDatagrd = ref(null)
const fileUploadgrd = ref(null)
//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: true }, checkBar: { visible: true } },
  keys: [""],
  fields: [
    {
      fieldName: "TEST_DIV_NM",
      dataType: "text",
      header: { text: t("구분") },
      editable: false,
    },
    {
      fieldName: "TEST_DT",
      dataType: "text",
      header: { text: t("인증/검사일") },
      editable: false,
    },
    {
      fieldName: "TEST_RESULT",
      dataType: "text",
      header: { text: t("검사결과") },
      editable: false,
    },
    {
      fieldName: "PASS_NO",
      dataType: "text",
      header: { text: t("인증/합격번호") },
      editable: false,
    },
    {
      fieldName: "EXPIRATION",
      dataType: "text",
      header: { text: t("유효기한") },
      editable: false,
    },
    {
      fieldName: "TEST_AGENCY_NM",
      dataType: "text",
      header: { text: t("검사기관") },
      editable: false,
    },
    {
      fieldName: "INSPECTOR",
      dataType: "text",
      header: { text: t("검사원") },
      editable: false,
    },
    {
      fieldName: "NEXT_TEST_DT",
      styleName: "editable_column",
      header: { text: t("차기검사년도") },
      dataType: "text",
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM") : null
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
      styleName: "editable_column",
    },
    {
      fieldName: "ATTACH_NAME",
      editable: false,
      dataType: "text",
      header: { text: t("인증서 합격증") },
      isFile: { value: true, align: "right", showAlways: true },
      displayCallback: function (grd, idx, val) {
        let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)

        return !data.ATTACH_NAME ? "" : data.ATTACH_NAME
      },
      styleName: "editable_column",
    },
    { fieldName: "TEST_ID", visible: false },
    { fieldName: "ATTACH_YN", visible: false },
    { fieldName: "EQUIP_COMPANY", visible: false },
    { fieldName: "EQUIP_KIND", visible: false },
    { fieldName: "EQUIP_SEQ", visible: false },
    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "ATTACH_ID", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//  이벤트 시작

const props = defineProps({
  tab: {
    type: String,
    default: "",
  },
  clickData: {
    type: Object,
    required: false,
    default() {
      return {}
    },
  },
  SaveFlag2: {
    type: Boolean,
  },
  resetClick: {
    type: Boolean,
  },
})

watch(
  () => [props.clickData, props.tab],
  ([newValueA, newValueB]) => {
    if (newValueA.length !== 0 && newValueB === "two") {
      commonSearchApi({
        queryId: "SPPDA0010_SEARCH_02",
        param: props.clickData,
      }).then((res) => {
        for (let i of res.ORESULT_CUR) {
          if (i.TEST_RESULT) {
            i.TEST_RESULT = i.TEST_RESULT == "Y" ? "합격" : "불합격"
          }
          if (i.ATTACH_ID) {
            i.ATTACH_NAME = "업로드완료"
          }
          if (i.NEXT_TEST_DT) {
            // i.NEXT_TEST_DT = dayjs(i.NEXT_TEST_DT)
          }
        }
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
  }
)

watch(
  () => props.SaveFlag2,
  (newValue) => {
    if (newValue) {
      let checkedRows = grdMain.value.getGridView().getCheckedRows()
      if (checkedRows.length == 0) {
        emit("saveData", undefined)
        return Message.warn(t("선택된 데이터가 없습니다."))
      }

      let rows = []
      for (let i of checkedRows) {
        let data = grdMain.value.getDataProvider().getJsonRow(i)
        data.NEXT_TEST_DT = dayjs(data.NEXT_TEST_DT).format("YYYYMM")
        rows.push(data)
      }

      emit("saveData", rows)
    }
  }
)

watch(
  () => props.resetClick,
  (newValue) => {
    if (newValue) {
      grdMain.value.getDataProvider().setRows(null)
      emit("resetValue")
    }
  }
)

onMounted(() => {
  if (props.clickData.length !== 0) {
    commonSearchApi({
      queryId: "SPPDA0010_SEARCH_02",
      param: props.clickData,
    }).then((res) => {
      for (let i of res.ORESULT_CUR) {
        if (i.TEST_RESULT) {
          i.TEST_RESULT = i.TEST_RESULT == "Y" ? "합격" : "불합격"
        }
        if (i.ATTACH_ID) {
          i.ATTACH_NAME = "업로드완료"
        }
      }
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
})

const onCellItemClicked = (grid, index, col) => {
  fileIndexgrd.value = ""
  fileDatagrd.value = ""

  if (index.fieldName == "ATTACH_NAME") {
    let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
    fileIndexgrd.value = index.dataRow
    fileDatagrd.value = "ATTACH_ID"
    fileUploadgrd.value.openPopup(data.ATTACH_ID)
  }
}

const uploaded = (val) => {
  if (fileDatagrd.value == "ATTACH_ID") {
    grdMain.value
      .getDataProvider()
      .setValue(fileIndexgrd.value, "ATTACH_ID", val.fileId)
    grdMain.value
      .getDataProvider()
      .setValue(fileIndexgrd.value, "ATTACH_YN", "Y")
    grdMain.value
      .getDataProvider()
      .setValue(fileIndexgrd.value, "ATTACH_NAME", "업로드완료")

    grdMain.value.getGridView().checkRow(fileIndexgrd.value)
  }
}

const deleted = (val) => {
  if (fileDatagrd.value == "ATTACH_ID") {
    let searchParams = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: val.fileId,
    }
    let rows = grdMain.value.getDataProvider().getJsonRow(fileIndexgrd.value)
    let param = []
    param.push(rows)
    commonSearchApi({ queryId: "searchFile", param: searchParams }).then(
      async (res) => {
        if (res.ORESULT_CUR.length === 0) {
          grdMain.value
            .getDataProvider()
            .setValue(fileIndexgrd.value, "ATTACH_ID", null)
          grdMain.value
            .getDataProvider()
            .setValue(fileIndexgrd.value, "ATTACH_YN", "N")
          grdMain.value
            .getDataProvider()
            .setValue(fileIndexgrd.value, "ATTACH_NAME", "")
          param[0].ATTACH_YN = "N"
          param[0].ATTACH_ID = null
        }
        await commonExecuteApi({
          queryId: "SPPDA0010_SAVE_03",
          list: param,
        })
      }
    )
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <div class="content-area">
      <v-sheet height="100%" class="mb-3">
        <RealGrid
          ref="grdMain"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          @onCellItemClicked="onCellItemClicked"
        />
      </v-sheet>
    </div>
    <IUploadPopup
      ref="fileUploadgrd"
      :fileDan="true"
      @uploaded="uploaded"
      @deleted="deleted"
    />
  </v-card>
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 761px);
}
</style>
