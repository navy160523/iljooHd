<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi } from "@hiway/api/commonApi"
import DATCA0050Popup from "./DATCA0050Popup.vue"

const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const grdMain = ref(null)
const Popup = ref(null)
const critical = ref(true)

/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  DEPT_CD: userStore.deptCd,
  DATE_FROM: "",
  DATE_TO: "",
  GUBUN: "T",
  SEARCH: "",
  NOTICE_DIV: "MNZFCB11002Y",
  dtDate: "A",
  ALL_UP_CD: "",
})

/* 기간 */
const dtDate = reactive([
  { COD: "A", TXT: "전체기간" },
  { COD: "W", TXT: "최근 1주" },
  { COD: "M", TXT: "최근 1개월" },
  { COD: "C", TXT: "기간 선택" },
])

/* 조회 구분 */
const dtGbn = reactive([
  { COD: "T", TXT: "제목" },
  { COD: "N", TXT: "내용" },
  { COD: "TN", TXT: "제목 + 내용" },
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
  keys: [],
  fields: [
    // { fieldName: 'NOTICE_DIV', dataType: 'text', header: { text: t('구분') }, lookupDisplay: true, editor: { type: 'dropdown' }},
    {
      fieldName: "NOTICE_TITLE",
      dataType: "text",
      width: "300",
      header: { text: t("제목") },
      styleName: "left-column",
    },
    { fieldName: "FILE_CNT", dataType: "text", header: { text: t("첨부자료[건]") }, styleName: "right-column" },
    { fieldName: "KOR_NM", dataType: "text", header: { text: t("작성자") } },
    { fieldName: "INSERT_DATE", dataType: "text", width: "200", header: { text: t("작성일시") } },
    // { fieldName: 'NOTICE_PERIOD', dataType: 'text', header: { text: t('게시기간') }, lookupDisplay: true, lookupData: dtPeriod },
    { fieldName: "NOTICE_CNT", dataType: "text", header: { text: t("조회[건]") }, styleName: "right-column" },
    // { fieldName: 'SORT_NO', dataType: 'text', header: { text: t('일련번호') } },

    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("회사") }, visible: false },
    { fieldName: "NOTICE_FILEID", dataType: "text", header: { text: t("첨부파일ID") }, visible: false },
    { fieldName: "NOTICE_NO", dataType: "text", header: { text: t("NOTICE_NO") }, visible: false },
    { fieldName: "NOTICE_REG_EMPNO", dataType: "text", header: { text: t("NOTICE_REG_EMPNO") }, visible: false },
    { fieldName: "NOTICE_DIV", dataType: "text", header: { text: t("NOTICE_DIV") }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
  } else {
    Popup.value.openPopup()
  }
}

const searchData = () => {
  /* 조회후 날짜 초기화 떄문에 새로 param 만들어서 조회 */
  let param = {}
  for (let i in searchParams) {
    if (i === "DATE_FROM") {
      param[i] = searchParams[i] ? dayjs(searchParams[i]).format("YYYYMMDD") : null
    } else if (i === "DATE_TO") {
      param[i] = searchParams[i] ? dayjs(searchParams[i]).format("YYYYMMDD") : null
    } else {
      param[i] = searchParams[i]
    }
  }
  return commonSearchApi({ queryId: "DATCA0050_SEARCH_01", param: param })
}

const afterSearch = async (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const dateChange = (e) => {
  if (e === "A" || e === "C") {
    /* ************* 전체기간 ************** */
    searchParams.DATE_FROM = ""
    searchParams.DATE_TO = ""
  } else if (e === "W") {
    /* ************* 최근 1주 ************** */
    searchParams.DATE_FROM = dayjs(new Date().setDate(new Date().getDate() - 7)).format("YYYY-MM-DD")
    searchParams.DATE_TO = dayjs(new Date()).format("YYYY-MM-DD")
  } else if (e === "M") {
    /* ************ 최근 1개월 ************* */
    searchParams.DATE_FROM = dayjs(new Date().setDate(new Date().getDate() + 1))
      .subtract(1, "month")
      .format("YYYY-MM-DD")
    searchParams.DATE_TO = dayjs(new Date()).format("YYYY-MM-DD")
  }

  reset()
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  Popup.value.openPopup(data)
}

const reset = () => {
  grdMain.value.getDataProvider().setRows([])
}

onMounted(() => {
  onButtonsClick({ id: "btnSearch" })
})

defineExpose({
  onButtonsClick,
})
</script>
<template>
  <div class="d-flex flex-column fill-height">
    <v-sheet class="searchArea d-flex">
      <i-select
        v-model="searchParams.dtDate"
        :label="$t('기간')"
        label-width="35px"
        width="200px"
        :items="dtDate"
        item-title="TXT"
        item-value="COD"
        @update:modelValue="dateChange"
      />
      <i-input
        v-model="searchParams.DATE_FROM"
        label-width="35px"
        width="205px"
        type="date"
        margin="10px"
        :disabled="searchParams.dtDate === 'A' ? true : false"
      />
      <i-input
        v-model="searchParams.DATE_TO"
        width="190px"
        :label="$t('-')"
        type="date"
        :disabled="searchParams.dtDate === 'A' ? true : false"
      />
      <i-select
        v-model="searchParams.GUBUN"
        :label="$t('조회 구분')"
        label-width="60px"
        append-inner-icon="mdi-magnify"
        :items="dtGbn"
        item-title="TXT"
        item-value="COD"
        width="230px"
        clearable
        class="mr-0"
        @update:modelValue="reset"
      />
      <i-input v-model="searchParams.SEARCH" width="250px" />
    </v-sheet>
    <v-sheet class="h-auto">
      <RealGrid
        ref="grdMain"
        :grid-view-option="grdMainProps.gridViewOption"
        :keys="grdMainProps.keys"
        :fields="grdMainProps.fields"
        :columns="grdMainProps.columns"
        @onCellDblClicked="onCellDblClicked"
      />
    </v-sheet>
    <DATCA0050Popup
      :id="searchParams.NOTICE_DIV"
      ref="Popup"
      @after-search="() => onButtonsClick({ id: 'btnSearch' })"
    />
  </div>
</template>
