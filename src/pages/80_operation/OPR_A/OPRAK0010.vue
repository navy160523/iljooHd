<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonRequest, commonExecuteApi, commonSearchApi } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import OPRAK0010Popup from "./OPRAK0010Popup.vue"

defineOptions({
  name: "80_operation-OPR-A-OPRAK0010",
})

//MN04362 hse 경영
//MN04238 위험성평가
//MN04236 안전
//MN04677 안전리스크
//MN04237 안전지원
//MN04239 교육/문화/포상
//MN04962 보건
//MN04963 환경
//MN04964 모니터링
//MN04930 운영관리
//HIWAYMN00061 시스템관리

const searchGubun = [
  { TXT: "전체", COD: "" },
  { TXT: "HSE 경영시스템", COD: "MN04362" },
  { TXT: "위험성평가", COD: "MN04238" },
  { TXT: "안전", COD: "MN04236" },
  { TXT: "안전리스크", COD: "MN04677" },
  { TXT: "안전지원", COD: "MN04237" },
  { TXT: "교육/문화/포상", COD: "MN04239" },
  { TXT: "보건", COD: "MN04962" },
  { TXT: "환경", COD: "MN04963" },
  { TXT: "모니터링", COD: "MN04964" },
  { TXT: "운영관리", COD: "MN04930" },
  { TXT: "시스템관리", COD: "HIWAYMN00061" },
]

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const oPRAK0010Popup = ref(null)
let FROM
let TO
const searchFaq = reactive({
  CMPNY_DIV: "",
  NOTICE_DIV: "",
  NOTICE_NO: "",
})

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    stateBar: { visible: false },
  },
  fields: [
    {
      fieldName: "CATEGORY1",
      dataType: "text",
      header: { text: t("분류") },
      editable: false,
      lookupDisplay: true,
      editor: {
        type: "dropdown",
      },
      styleName: "left-column",
    },
    {
      fieldName: "NOTICE_TITLE",
      dataType: "text",
      width: "200",
      header: { text: t("제목") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "FILE_CNT",
      dataType: "text",
      width: "50",
      header: { text: t("첨부자료[건]") },
      editable: false,
      styleName: "right-column",
    },

    {
      fieldName: "KOR_NM",
      dataType: "text",
      width: "50",
      header: { text: t("작성자") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "INSERT_DATE",
      dataType: "text",
      width: "100",
      header: { text: t("작성일시") },
      editable: false,
      lookupDisplay: true,
    },
    {
      fieldName: "NOTICE_PERIOD",
      dataType: "text",
      width: "30",
      header: { text: t("게시기간") },
      editable: false,
      lookupDisplay: true,
      editor: {
        type: "dropdown",
      },
      styleName: "left-column",
    },
    {
      fieldName: "NOTICE_CNT",
      dataType: "text",
      header: { text: t("조회[건]") },
      editable: false,
      styleName: "right-column",
    },
    // {
    //   fieldName: "REPLY_DATE",
    //   dataType: "text",
    //   header: { text: t("답글일시") },
    //   editable: false,
    // },
    {
      fieldName: "NOTICE_DIV",
      dataType: "text",
      visible: false,
    },
    {
      fieldName: "NOTICE_NO",
      dataType: "text",
      visible: false,
    },
    {
      fieldName: "NOTICE_FILEID",
      dataType: "text",
      visible: false,
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const codeList = reactive({
  dateList: [
    { TXT: "전체기간", COD: "A" },
    { TXT: "최근 1주", COD: "W" },
    { TXT: "최근 1개월", COD: "M" },
    { TXT: "기간 선택", COD: "C" },
  ],
  searchGubun: [],
})

const watchValue = {
  DATE_CODE: ref("A"),
}

//조회조건
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장
  DATE_FROM: "", //기간 FROM
  DATE_TO: "", //기간 TO
  NOTICE_DIV: "MNZE11002", //화면구분
  GUBUN: "", //조회구분
  NOTICE_RANGE: "", //조회범위
})

let period = reactive([
  { TXT: "영구", COD: "A" },
  { TXT: "7일", COD: "7" },
  { TXT: "15일", COD: "15" },
  { TXT: "30일", COD: "30" },
  { TXT: "90일", COD: "90" },
])

const checkValue = reactive({
  IN: "", //사내
  OT: "", //사외
})

const checkChange = (e) => {
  //기간 변경시 조회일자 변경
  let today = dayjs()
  let toDay =
    today.get("year") +
    "-" +
    (today.get("month") + 1).toString().padStart(2, "0") +
    "-" +
    today.get("date").toString().padStart(2, "0")
  if (e === "A") {
    //전체기간
    searchParam.DATE_FROM = "2015-01-01"
    searchParam.DATE_TO = toDay
  } else if (e === "W") {
    //최근 1주
    let fromDay = dayjs().subtract(7, "day")
    let from =
      fromDay.$y + "-" + (fromDay.$M + 1).toString().padStart(2, "0") + "-" + fromDay.$D.toString().padStart(2, "0")
    searchParam.DATE_FROM = from
    searchParam.DATE_TO = toDay
  } else if (e === "M") {
    //최근 1달
    let fromDay = dayjs().subtract(1, "month")
    let from =
      fromDay.$y + "-" + (fromDay.$M + 1).toString().padStart(2, "0") + "-" + fromDay.$D.toString().padStart(2, "0")
    searchParam.DATE_FROM = from
    searchParam.DATE_TO = toDay
  } else if (e === "C") {
    //전체기간
    searchParam.DATE_FROM = ""
    searchParam.DATE_TO = ""
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else {
    openPopup()
  }
}

const beforeSearch = async () => {
  //조회기간 입력체크
  if (searchParam.DATE_FROM === "" || searchParam.DATE_TO === "") {
    Message.warn(t("조회기간을 입력해주세요."))
    return false
  }
  //조회범위 코드값 지정
  if ((checkValue.IN === "" && checkValue.OT === "") || (checkValue.IN === "I" && checkValue.OT === "O")) {
    //둘다 체크가 되지 않거나 둘다 체크되었을때
    searchParam.NOTICE_RANGE = "A" //사내,사외 전체조회
  } else if (checkValue.IN === "I" && checkValue.OT === "") {
    //사내만 체크 되었을때
    searchParam.NOTICE_RANGE = "I"
  } else if (checkValue.IN == "" || checkValue.OT == "O") {
    //사외만 체크 되었을때
    searchParam.NOTICE_RANGE = "O"
  }
  return true
}

const searchData = () => {
  return commonRequest("/hse/operation/FAQ_SEARCH_01", {
    queryId: "OPRAK0010_SEARCH_02",
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const openPopup = () => {
  let isCreate = true //등록할때는 답변등록 컴포넌트 안보여야함
  oPRAK0010Popup.value.openPopup(isCreate)
}

const openPopup2 = (res) => {
  res.isModified = true //FAQ 등록할때는 답변등록 컴포넌트 보여야함
  oPRAK0010Popup.value.openPopup2(res)
}

// gird 더블 클릭 시 FAQ상세조회
const onCellDblClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  new saveFlowHelper(vm, t).setQuery(saveData(row)).setConfirmMessage(false).run()

  searchFaq.CMPNY_DIV = row.CMPNY_DIV
  searchFaq.NOTICE_DIV = row.NOTICE_DIV
  searchFaq.NOTICE_NO = row.NOTICE_NO

  return commonRequest("/hse/operation/FAQ_SEARCH_01", {
    queryId: "OPRAK0010_SEARCH_03",
    param: searchFaq,
  }).then((res) => {
    openPopup2(res.ORESULT_CUR[0])
  })
}

const beforeSave = () => {
  return true
}

const saveData = (rowData) => {
  let saveSearchParam = [] //조회건수 저장하는 파라미터
  let saveSearchData = {
    CMPNY_DIV: rowData.CMPNY_DIV,
    NOTICE_DIV: rowData.NOTICE_DIV,
    NOTICE_NO: rowData.NOTICE_NO,
    USER_ID: userStore.userId,
  }
  saveSearchParam.push(saveSearchData)
  return commonRequest("/hse/operation/FAQ_SAVE_01", {
    queryId: "OPRAK0010_SAVE_02",
    list: saveSearchParam,
  })
}

watch(
  [watchValue.DATE_CODE],
  (newValue, oldValue) => {
    checkChange(newValue[0])
  },
  {
    immediate: true,
  }
)

onMounted(() => {
  grdMain.value.setBindingColumn("CATEGORY1", searchGubun, "COD", "TXT")
  grdMain.value.setBindingColumn("NOTICE_PERIOD", period, "COD", "TXT")
  onButtonsClick({ id: "btnSearch" })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnFaqAdd']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('기간')"
            v-model="watchValue.DATE_CODE.value"
            :items="codeList.dateList"
            item-value="COD"
            item-title="TXT"
            width="200px"
          >
          </i-select>
          <i-input class="mr-1" type="date" v-model="searchParam.DATE_FROM" width="170px"> </i-input>
          <span class="mr-1 mt-1">~</span>
          <i-input v-model="searchParam.DATE_TO" type="date" width="170px"> </i-input>
          <i-select
            :label="$t('조회 구분')"
            v-model="searchParam.GUBUN"
            :items="searchGubun"
            item-value="COD"
            item-title="TXT"
            width="200px"
          />
          <span class="mt-2 mr-1">조회범위</span>
          <v-checkbox class="mt-1 mr-2" label="사내" v-model="checkValue.IN" true-value="I" false-value=""></v-checkbox>
          <v-checkbox class="mt-1" label="사외" v-model="checkValue.OT" true-value="O" false-value=""></v-checkbox>
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
  <OPRAK0010Popup ref="oPRAK0010Popup" @after-search="() => onButtonsClick({ id: 'btnSearch' })"></OPRAK0010Popup>
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
