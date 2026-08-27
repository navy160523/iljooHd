<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonRequest, commonExecuteApi } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import OPRAJ0010Popup from "./OPRAJ0010Popup.vue"
import IGridTitle from "@/components/IGridTitle.vue"

defineOptions({
  name: "80_operation-OPR_A-OPRAJ0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const oPRAJ0010Popup = ref(null)
const NOTICE_NO = ref('0')

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    stateBar: { visible: false },
  },
  fields: [
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
      header: { text: t("첨부자료[건]") },
      editable: false,
      styleName: "right-column",
    },
    {
      fieldName: "KOR_NM",
      dataType: "text",
      header: { text: t("작성자") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "INSERT_DATE",
      dataType: "text",
      header: { text: t("작성일") },
      editable: false,
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
      //styleName: "left-column",
    },
    {
      fieldName: "NOTICE_CNT",
      dataType: "text",
      header: { text: t("조회") },
      editable: false,
      width: "60",
      //styleName: "right-column",
    },
    {
      fieldName: "NOTICE_POPUP",
      dataType: "text",
      header: { text: t("팝업 여부") },
      editable: false,
      width: "50",
    },
    {
      fieldName: "NOTICE_EXPOSURE",
      dataType: "text",
      header: { text: t("메인노출 여부") },
      editable: false,
      width: "50",
    },
    {
      fieldName: "NOTICE_MENU_CNT",
      dataType: "text",
      header: { text: t("노출메뉴(건)") },
      editable: false,
      width: "50",
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: t("사업장구분") },
      editable: false,
      visible: false,
    },
    {
      fieldName: "NOTICE_NO",
      dataType: "text",
      header: { text: t("게시물번호") },
      editable: false,
      visible: false,
    },
    {
      fieldName: "NOTICE_REG_EMPNO",
      dataType: "text",
      header: { text: t("게시자") },
      editable: false,
      visible: false,
    },
    {
      fieldName: "NOTICE_TAG",
      dataType: "text",
      header: { text: t("게시물 태그") },
      editable: false,
      visible: false,
    },
    {
      fieldName: "NOTICE_FILEID",
      dataType: "text",
      header: { text: t("첨부파일 ID") },
      editable: false,
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
  searchGubun: [
    { TXT: "제목", COD: "T" },
    { TXT: "내용", COD: "N" },
    { TXT: "제목 + 내용", COD: "TN" },
  ],
})

const watchValue = {
  DATE_CODE: ref("A"),
  GUBUN_CODE: ref("T"),
}

//조회조건
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DATE_FROM: "",
  DATE_TO: "",
  GUBUN: "",
  SEARCH: "",
  NOTICE_RANGE: "",
})

const rowSearchParam = reactive({
  CMPNY_DIV: "",
  NOTICE_NO: "",
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
  if (searchParam.GUBUN === "") {
    Message.warn(t("조회구분을 입력해주세요."))
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
  return commonRequest("/hse/operation/search01", {
    queryId: "OPRAJ0010_SEARCH_01",
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const openPopup = () => {
  let isCreate = true
  oPRAJ0010Popup.value.openPopup(isCreate)
}

// gird 더블 클릭 시 조회
const onCellDblClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  rowSearchParam.CMPNY_DIV = row.CMPNY_DIV
  rowSearchParam.NOTICE_NO = row.NOTICE_NO

  new queryFlowHelper(vm, t).setQuery(serachData02).setAfter(afterSearch02).run()
}

const serachData02 = () => {
  return commonRequest("/hse/operation/search01", {
    queryId: "OPRAJ0010_SEARCH_02",
    param: rowSearchParam,
  })
}

//로우 더블클릭하면 공지사항 상세내역 조회 팝업 출력
const afterSearch02 = (res) => {
  let noticeInfo = res.ORESULT_CUR[0]
  noticeInfo.isModified = true
  noticeInfo.NOTICE_NO = noticeInfo.NOTICE_NO + ''
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    NOTICE_NO: noticeInfo.NOTICE_NO,
    USER_ID: noticeInfo.USER_ID,
  }
  NOTICE_NO.value = noticeInfo.NOTICE_NO,
  saveParam.push(saveData)
  oPRAJ0010Popup.value.openPopup2(noticeInfo)
  return commonRequest("/hse/operation/save01", {
    queryId: "OPRAJ0010_SAVE_02",
    list: saveParam,
  })
}

onMounted(() => {
  grdMain.value.setBindingColumn("NOTICE_PERIOD", period, "COD", "TXT")
  onButtonsClick({ id: "btnSearch" })
})

watch(
  [watchValue.DATE_CODE, watchValue.GUBUN_CODE],
  (newValue, oldValue) => {
    checkChange(newValue[0])
    searchParam.GUBUN = newValue[1]
  },
  {
    immediate: true,
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnNoticeAdd']"
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
          ></i-select>
          <i-input type="date" v-model="searchParam.DATE_FROM" width="200px"> </i-input>
          <i-input v-model="searchParam.DATE_TO" type="date" width="200px"> </i-input>
          <i-select
            :label="$t('조회 구분')"
            v-model="searchParam.GUBUN"
            :items="codeList.searchGubun"
            item-value="COD"
            item-title="TXT"
            width="200px"
          ></i-select>
          <i-input v-model="searchParam.SEARCH" width="300px"> </i-input>
          <span class="mt-2">조회범위</span>
          <v-checkbox class="ml-1 mt-1" label="사내" v-model="checkValue.IN" true-value="I" false-value=""></v-checkbox>
          <v-checkbox class="ml-1 mt-1" label="사외" v-model="checkValue.OT" true-value="O" false-value=""></v-checkbox>
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('공지 목록')"> </IGridTitle>
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
  <OPRAJ0010Popup :id="NOTICE_NO" @after-search="() => onButtonsClick({ id: 'btnSearch' })" ref="oPRAJ0010Popup"></OPRAJ0010Popup>
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
