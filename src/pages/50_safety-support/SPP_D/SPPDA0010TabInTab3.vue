<!-- SPPDA0010Tab3위험기계기구 안전검사 정보변경이력 탭-->
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

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const grdMain = ref(null)
const emit = defineEmits(["saveDataThree", "resetValue"])

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: [""],
  fields: [
    {
      fieldName: "INSERT_DATE",
      dataType: "text",
      header: { text: t("수정일시") },
    },
    {
      fieldName: "INSERT_USER_NM",
      dataType: "text",
      header: { text: t("수정자") },
    },
    {
      fieldName: "CHG_COLUMN_NM",
      dataType: "text",
      header: { text: t("수정항목") },
    },
    {
      fieldName: "BEFORE_CHG",
      dataType: "text",
      header: { text: t("수정전") },
    },
    { fieldName: "AFTER_CHG", dataType: "text", header: { text: t("수정후") } },
    {
      fieldName: "CFM_EMP_NM",
      dataType: "text",
      header: { text: t("확인자") },
    },
    {
      fieldName: "CFM_DATE",
      dataType: "text",
      header: { text: t("확인일시") },
    },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "EQUIP_KIND", dataType: "text", visible: false },
    { fieldName: "EQUIP_SEQ", dataType: "text", visible: false },
    { fieldName: "LOG_SEQ", dataType: "text", visible: false },
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
  SaveFlag3: {
    type: Boolean,
  },
  resetClick: {
    type: Boolean,
  },
})

watch(
  () => [props.clickData, props.tab],
  ([newValueA, newValueB]) => {
    if (newValueA.length !== 0 && newValueB === "three") {
      commonSearchApi({
        queryId: "SPPDA0010_SEARCH_03",
        param: props.clickData,
      }).then((res) => {
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
  }
)

watch(
  () => props.SaveFlag3,
  (newValue) => {
    if (newValue) {
      let checkedRows = grdMain.value.getGridView().getCheckedRows()
      if (checkedRows.length == 0) {
        emit("saveDataThree", undefined)
        return Message.warn(t("선택된 데이터가 없습니다."))
      }
      let rows = []
      for (let i of checkedRows) {
        let data = grdMain.value.getDataProvider().getJsonRow(i)
        rows.push(data)
      }

      emit("saveDataThree", rows)
    }
  }
)

watch(
  () => props.resetClick,
  (newValue) => {
    if (newValue) {
      console.log(newValue, "dmdasdasdkdkddk")
      grdMain.value.getDataProvider().setRows(null)
      emit("resetValue")
    }
  }
)

onMounted(() => {
  if (props.clickData.length !== 0) {
    commonSearchApi({
      queryId: "SPPDA0010_SEARCH_03",
      param: props.clickData,
    }).then((res) => {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
})
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
        />
      </v-sheet>
    </div>
  </v-card>
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 761px);
}
</style>
