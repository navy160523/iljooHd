<!-- 
  화면명 : 정기안전보건교육
  화면개요 : 정기안전보건교육 자료 조회및 추가, 수정, 삭제, 등록 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { getCodeList, commonSendApi } from "@hiway/api/commonApi"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi } from "@hiway/api/commonApi"
import DATCA0010Popup from "./DATCA0010Popup.vue"
defineOptions({
  name: "70_data-DAT_C-DATCA0010",
})
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const grdMain = ref(null)
const Popup = ref(null)
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
  ALL_UP_CD: "HHIZ090G",
})

const initCodeList = () => {
  Promise.all([getCodeList("HHIZ090G")]).then((res) => {console.log(res)})
}

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

/* 조회 범위 */
const dtRange = reactive([
  { COD: "A", TXT: "전체" },
  { COD: "I", TXT: "사내" },
  { COD: "O", TXT: "사외" },
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
  keys: [],
  fields: [
    { fieldName: "NOTICE_DIV", visible: false, dataType: "text", header: { text: t("구분") }, lookupDisplay: true },
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

onMounted(() => {
  initCodeList()
  onButtonsClick({ id: "btnSearch" })
})

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
  } else {
    Popup.value.openPopup()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId: "DATCA0010_SEARCH_01", param: searchParams })
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
</script>

<template>
  <v-card>
    <v-card-title>
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.dtDate"
            :items="dtDate"
            item-title="TXT"
            item-value="COD"
            class="mr-0"
            :label="$t('기간')"
            width="150px"
            @update:modelValue="dateChange"
          >
          </i-select>
          <i-input
            class="ml-3"
            type="date"
            width="180px"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            v-model="searchParams.DATE_FROM"
          >
          </i-input>
          <span class="mt-1">~</span>
          <i-input
            class="ml-3"
            type="date"
            width="180px"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            v-model="searchParams.DATE_TO"
          >
          </i-input>
          <i-select
            :items="dtGbn"
            item-title="TXT"
            item-value="COD"
            v-model="searchParams.GUBUN"
            :label="$t('조회 구분')"
            width="250px"
          ></i-select>
          <i-input v-model="searchParams.SEARCH" width="200px"></i-input>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <DATCA0010Popup ref="Popup" @after-search="() => onButtonsClick({ id: 'btnSearch' })"></DATCA0010Popup>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 185px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
