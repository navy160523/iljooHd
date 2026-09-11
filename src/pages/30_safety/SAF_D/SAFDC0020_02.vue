<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"

import { useUserStore } from "@hiway/stores/user"

import { useI18n } from "vue-i18n"

import {

  commonPgSearchApi,

  commonPgExecuteApi,

  getPgCodeList,

} from "@hiway/api/commonApi"

import RealGrid from "@/components/RealGrid.vue"

import IGridTitle from "@/components/IGridTitle.vue"

import EmpPopup from "@/components/popup/EmpPopup.vue" //점검자 팝업

import deleteFlowHelper from "@/utils/deleteFlowHelper"

import queryFlowHelper from "@/utils/searchFlowHelper"

import dayjs from "dayjs"

import Message from "@hiway/utils/notify"

import SAFDC0020_02Popup01 from "./SAFDC0020_02Popup01.vue" //2026.09.11 수정 (종결자)

defineOptions({

  name: "30_safety-SAF_D-SAFDC0020_02", //2026.09.11 수정

})

const vm = getCurrentInstance().proxy

const t = useI18n().t

const grdMain = ref(null)

const userStore = useUserStore()

const sAFDC0020_02_Popup01 = ref(null) //2026.09.11 수정 (종결자)

const empPopup = ref(null) // 점검자 팝업

const searchParam = reactive({

  CMPNY_DIV: userStore.cmpnyDiv,

  TYPE: "A",

  ACT_YN: "",

  ACT_EMP_NO: "",

  GUBUN: "A",

  //날짜조회

  NOTI_FROM: "",

  NOTI_TO: "",

  CHK_DEPT_CD: "",

  SEND_BSNS_CD: "AN00",

  REC_BSNS_CD: userStore.bsnsCd,

  REC_DEPT_CD: userStore.deptCd,

  REC_ASGN_CD: "",

  SEND_ASGN_CD: "",

  SUBJECT_CD: "",

  //회신요구일 제외

  // REQ_REPLY_CHK: "Y",

  // REQ_REPLY_FROM: "",

  // REQ_REPLY_TO: "",

  SAGO_DIV_M: "",

  STATUS: "",

  CHK_EMP_NM: "",

  CHK_EMP_NO: "",

})

const codeList = reactive({

  SEND_BSNS_CD: [{ BSNS_NM: "전체", BSNS_CD: "" }], //2026.09.11 수정 (필수)

  CHK_DEPT_CD: [{ DEPT_NM: "전체", DEPT_CD: "" }], //2026.09.11 수정 (필수)

  SEND_ASGN_CD: [{ ASGN_NM: "전체", ASGN_CD: "" }], //2026.09.11 수정 (필수)

  REC_BSNS_CD: [{ BSNS_NM: "전체", BSNS_CD: "" }], //2026.09.11 수정 (필수)

  REC_DEPT_CD: [{ DEPT_NM: "전체", DEPT_CD: "" }], //2026.09.11 수정 (필수)

  REC_ASGN_CD: [{ ASGN_NM: "전체", ASGN_CD: "" }], //2026.09.11 수정 (필수)

  STATUS: [{ TXT: "전체", COD: "" }], //2026.09.11 수정 (필수)

})

const rowStyleCallback = (grid, item) => {

  const rowIndex = item.index

  const status = String(grid.getValue(rowIndex, "STATUS") ?? "").trim()

  const actionDivision = String(

    grid.getValue(rowIndex, "ACT_DIV") ?? "",

  ).trim()

  const isApproved = status === "30" || status === "승인"

  const needsAction = actionDivision === "10" || actionDivision === "조치필요"

  //승인이면서 조치필요일때

  if (isApproved && needsAction) {

    return {

      style: {

        background: "#ffcdd2",

      },

    }

  }

  return {}

}

const initCodeList = () => {

  Promise.all([

    //조직

    commonPgSearchApi({

      queryId: "searchBSNS",

      param: { CMPNY_DIV: userStore.cmpnyDiv },

    }),

    //진행상태

    getPgCodeList("HHIG190"),

  ]).then(res => {

    codeList.SEND_BSNS_CD = res[0].ORESULT_CUR

    codeList.REC_BSNS_CD = res[0].ORESULT_CUR

    codeList.STATUS = res[1].ORESULT_CUR

    codeList.SEND_BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })

    codeList.REC_BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })

    codeList.STATUS.unshift({ TXT: "전체", COD: "" })

  })

}

const grdMainProps = reactive({

  gridViewOption: { checkBar: true },

  fields: [

    { fieldName: "CMPNY_DIV", dataType: "text" },

    { fieldName: "MNG_NO", dataType: "text" },

    { fieldName: "BSNS_CD", dataType: "text" },

    //1. 일시 및 장소

    { fieldName: "NOTI_DT", width: 100, header: { text: t("점검일자") } },

    { fieldName: "REQ_REPLY_DT", dataType: "text", width: 100, header: { text: t("회신요구일") } },

    { fieldName: "NOTI_LPLC", dataType: "text", width: 120, visible: false, header: { text: t("장소(대분류)") } },

    { fieldName: "NOTI_MPLC", dataType: "text", width: 120, visible: false, header: { text: t("장소(중분류)") } },

    { fieldName: "NOTI_SPLC", dataType: "text", width: 120, visible: false, header: { text: t("장소(소분류)") } },

    { fieldName: "NOTI_SPLC_NM", dataType: "text", width: 120, header: { text: t("장소") } },

    { fieldName: "NOTI_PLC_DESC", dataType: "text", width: 200, header: { text: t("장소상세") } },

    { fieldName: "SHIP_NO", dataType: "text", width: 120, header: { text: t("호선/프로젝트No.") } },

    //2. 위반정보

    { fieldName: "NOTI_TITLE", dataType: "text" },

    { fieldName: "REC_DEPT_CD", dataType: "text" },

    { fieldName: "REC_ASGN_CD", dataType: "text" },

    { fieldName: "REC_ASGN_NM", dataType: "text", width: 200, header: { text: t("수신조직") } },

    //3. 위반내용

    { fieldName: "PROBLEM_DESC", dataType: "text", width: 350, header: { text: t("문제점") } },

    { fieldName: "REQUIRE_DESC", dataType: "text" },

    { fieldName: "IMG_ID1", dataType: "text" },

    { fieldName: "FILE_ID1", dataType: "text" },

    { fieldName: "NOTI_IMG_YN", dataType: "text", width: 50, header: { text: t("사진") } },

    { fieldName: "NOTI_FILE_YN", dataType: "text", width: 50, header: { text: t("자료") } },

    //4. 조치내용

    { fieldName: "ACT_DT_2", dataType: "text", width: 100, header: { text: t("조치일자") } },

    { fieldName: "ACT_EMP_NO", dataType: "text" },

    { fieldName: "ACT_EMP_NM", dataType: "text" },

    { fieldName: "ACT_DEPT_CD", dataType: "text" },

    { fieldName: "ACT_DEPT_NM", dataType: "text" },

    { fieldName: "ACT_ASGN_CD", dataType: "text" },

    { fieldName: "ACT_ASGN_NM", dataType: "text" },

    { fieldName: "ACT_JOB_TIT_NM", dataType: "text" },

    { fieldName: "ACT_TEL_NO", dataType: "text" },

    { fieldName: "ACT_RSLT", dataType: "text", width: 300, header: { text: t("조치내용") } },

    { fieldName: "ACT_DIV", dataType: "text" },

    { fieldName: "IMG_ID2", dataType: "text" },

    { fieldName: "FILE_ID2", dataType: "text" },

    { fieldName: "ACT_IMG_YN", dataType: "text", width: 50, header: { text: t("사진") } },

    { fieldName: "ACT_FILE_YN", dataType: "text", width: 50, header: { text: t("자료") } },

    //5. 단속자/승인자 정보

    { fieldName: "CHK_EMP_NM", dataType: "text", width: 100, header: { text: t("점검자") } },

    { fieldName: "CHK_EMP_NO", dataType: "text" },

    { fieldName: "CHK_DEPT_CD", dataType: "text" },

    { fieldName: "CHK_DEPT_NM", dataType: "text" },

    { fieldName: "CHK_TEL_NO", dataType: "text" },

    { fieldName: "CHK_ASGN_CD", dataType: "text" },

    { fieldName: "CHK_ASGN_NM", dataType: "text", width: 200, header: { text: t("발신조직") } },

    { fieldName: "APP_SAME", dataType: "text" },

    { fieldName: "APP_EMP_NO", dataType: "text" },

    { fieldName: "APP_EMP_NM", dataType: "text" },

    { fieldName: "STATUS_NM", dataType: "text", width: 150, header: { text: t("진행상태") } },

    { fieldName: "ACT_DT", dataType: "text", width: 100, header: { text: t("조치일자") } },

  ],

  columns: [],

  columnLayout: [

    "NOTI_DT",

    "REQ_REPLY_DT",

    "STATUS_NM",

    "ACT_DT",

    "REC_ASGN_NM",

    "PROBLEM_DESC",

    "NOTI_SPLC_NM",

    "NOTI_PLC_DESC",

    "SHIP_NO",

    {

      name: "위반",

      direction: "horizontal",

      items: ["NOTI_IMG_YN", "NOTI_FILE_YN"],

    },

    "ACT_RSLT",

    {

      name: "조치",

      direction: "horizontal",

      items: ["ACT_IMG_YN", "ACT_FILE_YN"],

    },

    "CHK_ASGN_NM",

    "CHK_EMP_NM",

    "ACT_DT_2",

  ],

})

grdMainProps.columns = grdMainProps.fields

// const onGridLoaded = () => {

//   if (grdMain.value && grdMain.value.getGridView()) {

//     grdMain.value.getGridView().displayOptions.rowHeight = 120;

//   }

// };

const onButtonsClick = ({ id }) => {

  switch (id) {

  case "btnSearch":

    onSearch()

    break

  case "btnRegist":

    onRegister()

    break

  case "btnApprove":

    onApproval()

    break

  case "btnApproveCancel":

    onCancelApproval()

    break

  default:

    break

  }

}

const onSearch = () => {

  new queryFlowHelper(vm, t)

    .setQuery(searchData)

    .setAfter(afterSearch)

    .run()

}

const onRegister = () => {

  sAFDC0020_02_Popup01.value.openPopup() //2026.09.11 수정 (종결자)

}

const onApproval = () => {

  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedData.length === 0) {

    Message.warn(t("승인 신청할 데이터를 선택해주세요."))

    return

  }

  let list = []

  let day = dayjs()

  for (let i in checkedData) {

    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])

    if (!data.APP_EMP_NO) {

      Message.warn(t(`관리번호 ${data.MNG_NO} 건은 승인자가 지정되지 않았습니다.`))

      return

    }

    list.push({

      CMPNY_DIV: userStore.cmpnyDiv,

      YEAR: day.format("YYYY"),

      APPROVE_ID: "SAFDC0020_" + userStore.userId + "_" + day.format("YYYYMMDDHHmmss") + "_" + i,

      FORM_ID: "SAFDC0020",

      APP_EMP_NO: data.APP_EMP_NO,

      APPROVE_GBN: "I",

      APP_REQ_EMP_NO: userStore.userId,

      APP_STATUS: "N",

      PATH: "/30_safety/SAF_D/SAFDC0020",

      USER_ID: userStore.userId,

      MNG_NO: data.MNG_NO,

    })

  }

  commonPgExecuteApi({

    queryId: "OPRAB0010_SAVE_01",

    list: list,

  }).then(() => {

    Message.success(t("승인신청 되었습니다."))

    onSearch()

  })

}

const onCancelApproval = () => {

  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedData.length === 0) {

    Message.warn(t("승인 취소할 데이터를 선택해주세요."))

    return

  }

  let list = []

  for (let i in checkedData) {

    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])

    list.push({

      CMPNY_DIV: userStore.cmpnyDiv,

      VIO_NO: data.MNG_NO,

      MNG_NO: data.MNG_NO,

      USER_ID: userStore.userId,

    })

  }

  commonPgExecuteApi({

    queryId: "SAFDC0010_CANCEL01",

    list: list,

  }).then(() => {

    Message.success(t("결재 신청이 취소되었습니다."))

    onSearch()

  })

}

const searchData = () => commonPgSearchApi({

  queryId: "SAFDC0010_SEARCH_14",

  param: searchParam,

})

const afterSearch = res => {

  let list = res.ORESULT_CUR || []

  console.log("list: ", list)

  list.forEach(row => {

    row.ACT_DT_2 = row.ACT_DT

    row.NOTI_IMG_YN = row.IMG_ID1 ? "Y" : "N"

    row.NOTI_FILE_YN = row.FILE_ID1 ? "Y" : "N"

    row.ACT_IMG_YN = row.IMG_ID2 ? "Y" : "N"

    row.ACT_FILE_YN = row.FILE_ID2 ? "Y" : "N"

  })

  grdMain.value.getDataProvider().setRows(list)

  //grdMain.value.getGridView().setRowStyleCallback(rowStyleCallback);

}

const defaultDate = () => {

  let date = dayjs()

  let dateFrom = dayjs().subtract(7, "day")

  searchParam.NOTI_FROM = dateFrom.format("YYYY-MM-DD")

  searchParam.NOTI_TO = date.format("YYYY-MM-DD")

  //회신요구일 제외

  // searchParam.REQ_REPLY_FROM = dateFrom.format("YYYY-MM-DD");

  // searchParam.REQ_REPLY_TO = date.format("YYYY-MM-DD");

}

onMounted(() => {

  defaultDate()

  initCodeList()

  onSearch()

})

const onCellDblClicked = (grid, clickData) => {

  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  sAFDC0020_02_Popup01.value.openPopup2(data) //2026.09.11 수정 (종결자)

}

const closedPopup = () => {

  onSearch()

}

// 단속자 인원팝업 오픈

const openCheckEmpPopup = () => {

  empPopup.value.openPopup({

    CMPNY_DIV: userStore.cmpnyDiv,

    HSE_ONLY: "Y",

    readonly: true,

  })

}

const selectedChkEmp = val => {

  console.log("인원 : ", val)

  searchParam.CHK_EMP_NM = val.EMP_NM

  searchParam.CHK_EMP_NO = val.EMP_NO

}

// 점검자 내부 X아이콘 클릭시 점검자 사번,성명 초기화

const clearInsert = () => {

  searchParam.CHK_EMP_NM = ""

  searchParam.CHK_EMP_NO = ""

}

watch(

  () => searchParam.REC_BSNS_CD,

  newValue => {

    commonPgSearchApi({

      queryId: "searchDept3",

      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: "Y" },

    }).then(res => {

      searchParam.REC_DEPT_CD = ""

      codeList.REC_DEPT_CD = res.ORESULT_CUR

      codeList.REC_DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })

    })

  },

  { immediate: true },

)

watch(

  () => searchParam.REC_DEPT_CD,

  newValue => {

    commonPgSearchApi({

      queryId: "searchTeam",

      param: {

        CMPNY_DIV: userStore.cmpnyDiv,

        BSNS_CD: searchParam.REC_BSNS_CD,

        DEPT_CD: newValue,

        USE_DIV: "Y",

      },

    }).then(res => {

      searchParam.REC_ASGN_CD = ""

      codeList.REC_ASGN_CD = res.ORESULT_CUR

      codeList.REC_ASGN_CD.unshift({ ASGN_NM: "전체", ASGN_CD: "" })

    })

  },

  { immediate: true },

)

watch(

  () => searchParam.SEND_BSNS_CD,

  newValue => {

    commonPgSearchApi({

      queryId: "searchDept3",

      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: "Y" },

    }).then(res => {

      searchParam.CHK_DEPT_CD = ""

      codeList.CHK_DEPT_CD = res.ORESULT_CUR || []

      // 중복 방지 체크 후 "전체" 추가 (CHK_DEPT_CD) //2026.09.11 수정 (필수)

      if (codeList.CHK_DEPT_CD.length === 0 || codeList.CHK_DEPT_CD[0].DEPT_CD !== "") {

        codeList.CHK_DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" }) //2026.09.11 수정 (필수)

      }

    })

  },

  { immediate: true },

)

watch(

  () => searchParam.CHK_DEPT_CD,

  newValue => {

    commonPgSearchApi({

      queryId: "searchTeam",

      param: {

        CMPNY_DIV: userStore.cmpnyDiv,

        BSNS_CD: searchParam.SEND_BSNS_CD,

        DEPT_CD: newValue,

        USE_DIV: "Y",

      },

    }).then(res => {

      searchParam.SEND_ASGN_CD = ""

      codeList.SEND_ASGN_CD = res.ORESULT_CUR || []

      // 중복 방지 체크 후 "전체" 추가 (SEND_ASGN_CD) //2026.09.11 수정 (필수)

      if (codeList.SEND_ASGN_CD.length === 0 || codeList.SEND_ASGN_CD[0].ASGN_CD !== "") {

        codeList.SEND_ASGN_CD.unshift({ ASGN_NM: "전체", ASGN_CD: "" }) //2026.09.11 수정 (필수)

      }

    })

  },

  { immediate: true },

)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        class="mt-0"
        :button-list="['btnSearch', 'btnRegist', 'btnApprove', 'btnApproveCancel']"

        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text
      class="pa-3 pt-0 content-area"
    >
      <div class=" d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex mb-0">
          <i-input
            v-model="searchParam.NOTI_FROM"
            label-width="25px"
            :label="$t('일자')"
            width="170px"
            class="mr-1"

            type="date"
          />

          <span class="mt-2">~</span>

          <i-input
            v-model="searchParam.NOTI_TO"
            class="ml-1"
            type="date"
            width="150px"
          />

          <i-select
            v-model="searchParam.REC_BSNS_CD"
            :label="$t('수신조직')"
            label-width="60px"
            width="250px"

            :items="codeList.REC_BSNS_CD"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
          />

          <i-select
            v-model="searchParam.REC_DEPT_CD"
            width="200px"
            :items="codeList.REC_DEPT_CD"
            item-title="DEPT_NM"

            item-value="DEPT_CD"
          />

          <i-select
            v-model="searchParam.REC_ASGN_CD"
            width="250px"
            :items="codeList.REC_ASGN_CD"
            item-title="ASGN_NM"

            item-value="ASGN_CD"
          />
        </v-sheet>

        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParam.SEND_BSNS_CD"
            :label="$t('발신조직')"
            label-width="60px"
            width="250px"

            :items="codeList.SEND_BSNS_CD"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
          />

          <i-select
            v-model="searchParam.CHK_DEPT_CD"
            width="200px"
            :items="codeList.CHK_DEPT_CD"
            item-title="DEPT_NM"

            item-value="DEPT_CD"
          />

          <i-select
            v-model="searchParam.SEND_ASGN_CD"
            width="250px"
            :items="codeList.SEND_ASGN_CD"
            item-title="ASGN_NM"

            item-value="ASGN_CD"
          />

          <i-select
            v-model="searchParam.STATUS"
            :label="$t('진행상태')"
            label-width="60px"
            width="220px"

            :items="codeList.STATUS"
            item-title="TXT"
            item-value="COD"
          />

          <i-input
            v-model="searchParam.CHK_EMP_NM"
            :label="$t('점검자')"
            label-width="50px"
            width="250px"
            readonly
          >
            <template #append-inner>
              <v-icon
                icon="mdi-magnify"
                @click="openCheckEmpPopup"
              />

              <v-icon
                color="error"
                icon="mdi-window-close"
                @click="clearInsert"
              />
            </template>
          </i-input>
        </v-sheet>

        <v-sheet style="height: -webkit-fill-available">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"

            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"

            :row-style-callback="rowStyleCallback"
            @on-cell-dbl-clicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>

    <SAFDC0020_02Popup01
      ref="sAFDC0020_02_Popup01"
      @closed="closedPopup"
    /> <!-- 2026.09.11 수정 (종결자) -->

    <EmpPopup
      ref="empPopup"
      @selected="selectedChkEmp"
    />
  </v-card>
</template>

<style scoped lang="scss">
.tableBackGround {

  background-color: #f2fe8a;

}

table,

th,

td {

  border: 1px solid black;

  border-collapse: collapse;

  text-align: center;

  font-size: 17px;

}

.content-area {

  position: relative;

  // 만약 타이틀 영역에 컴포넌트를 추가한다면

  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.

  height: calc(100vh - 293px);

  overflow-y: auto;

  >div {

    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.

    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.

    min-height: 500px;

  }

}
</style>
