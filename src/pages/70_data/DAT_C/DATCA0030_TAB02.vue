<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import DATCA0030Popup from "./DATCA0030Popup.vue"

const props = defineProps({
  NOTICE_DIV_LIST: {
    Type: Array,
    default: [],
  },
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const grdMain = ref(null)
const Popup2 = ref(null)

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
  NOTICE_DIV: "",
  dtDate: "A",
  ALL_UP_CD: "HHIZ090EB",
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
    { fieldName: "NOTICE_DIV", dataType: "text", header: { text: t("구분") }, lookupDisplay: true },
    {
      fieldName: "NOTICE_TITLE",
      dataType: "text",
      width: "250",
      header: { text: t("제목") },
      styleName: "left-column",
    },
    { fieldName: "FILE_CNT", dataType: "text", header: { text: t("첨부자료[건]") }, styleName: "right-column" },
    { fieldName: "KOR_NM", dataType: "text", header: { text: t("작성자") } },
    { fieldName: "INSERT_DATE", dataType: "text", width: "200", header: { text: t("작성일시") } },
    { fieldName: "NOTICE_CNT", dataType: "text", header: { text: t("조회[건]") }, styleName: "right-column" },

    // { fieldName: "SORT_NO", dataType: "text", header: { text: t("일련번호") } },

    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("회사") }, visible: false },
    { fieldName: "NOTICE_FILEID", dataType: "text", header: { text: t("첨부파일ID") }, visible: false },
    { fieldName: "NOTICE_NO", dataType: "text", header: { text: t("NOTICE_NO") }, visible: false },
    { fieldName: "NOTICE_RANGE", dataType: "text", header: { text: t("NOTICE_RANGE") }, visible: false },
    { fieldName: "NOTICE_REG_EMPNO", dataType: "text", header: { text: t("NOTICE_REG_EMPNO") }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
  } else {
    Popup2.value.openPopup()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId: "DATCA0030_SEARCH_01", param: searchParams })
}

const afterSearch = async (res) => {
  grdMain.value.setBindingColumn("NOTICE_DIV", props.NOTICE_DIV_LIST, "COD", "TXT")
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
  Popup2.value.openPopup(data)
}

const reset = () => {
  grdMain.value.getDataProvider().setRows([])
}

watch(
  () => props.NOTICE_DIV_LIST,
  () => {
    grdMain.value.setBindingColumn("NOTICE_DIV", props.NOTICE_DIV_LIST, "COD", "TXT")
  }
)

defineExpose({
  onButtonsClick,
})

onMounted(() => {
  onButtonsClick({ id: "btnSearch" })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.dtDate"
            :label="$t('기간')"
            label-width="50px"
            width="200px"
            :items="dtDate"
            item-title="TXT"
            item-value="COD"
            @update:modelValue="dateChange"
          />
          <i-input
            v-model="searchParams.DATE_FROM"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            label-width="35px"
            width="205px"
            type="date"
            margin="10px"
          />
          <i-input
            v-model="searchParams.DATE_TO"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            width="190px"
            :label="$t('-')"
            type="date"
          />
          <i-select
            v-model="searchParams.GUBUN"
            :label="$t('조회 구분')"
            label-width="80px"
            append-inner-icon="mdi-magnify"
            :items="dtGbn"
            item-title="TXT"
            item-value="COD"
            width="250px"
            clearable
            @update:modelValue="reset"
          />
          <i-input v-model="searchParams.SEARCH" width="250px" />
          <i-select
            v-model="searchParams.NOTICE_DIV"
            :label="$t('구분')"
            label-width="50px"
            append-inner-icon="mdi-magnify"
            :items="props.NOTICE_DIV_LIST"
            item-title="TXT"
            item-value="COD"
            width="250px"
            clearable
            @update:modelValue="reset"
          />
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
      </div>
      <DATCA0030Popup
        :id="searchParams.ALL_UP_CD"
        ref="Popup2"
        :NOTICE_DIV_LIST="props.NOTICE_DIV_LIST"
        @after-search="() => onButtonsClick({ id: 'btnSearch' })"
      />
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
