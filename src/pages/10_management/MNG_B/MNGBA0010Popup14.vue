<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 안전사고 보고서 등록/현황   -->
<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  nextTick,
  watch,
} from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { useLogsStore } from "@hiway/stores/logs"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import DeptPopup from "@/components/popup/DeptPopup.vue"
import dayjs from "dayjs"
import {
  commonRequest,
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import SAFAB0020PopUp from "@/pages/30_safety/SAF_A/SAFAB0020PopUp.vue"
import SAFAB0020ManPopUp from "@/pages/30_safety/SAF_A/SAFAB0020ManPopUp.vue"

defineOptions({
  name: "30_safety-SAF_A-SAFAB0020",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdDetail = ref(null)
// 팝업관련
const dialog = ref(false)
const deptPopup = ref(null)
const MainPopOpen = ref(null)
const ManPopOpen = ref(null)
const disableSet = ref(true)
const disablebtns = ref(null)
const searchParams = reactive({
  DT_GBN: "1",
  OCCUR_FROM: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
  OCCUR_TO: dayjs().format("YYYY-MM-DD"),
  DEPT_CD: "",
  BSNS_CD: "",
  INJR_DEPT_CD: userStore.deptCd,
  CMPNY_DIV: userStore.cmpnyDiv,
  DEPT_CD: userStore.deptCd,
  BSNS_CD: userStore.bsnsCd,
  ASGN_NM: ` ${userStore.bsnsNm} - ${userStore.deptNm}`,
  SAGOBURU: "",
  SAGO_PLAN_CHK: "",
})

const searchDetailParams = reactive({})
// 코드리스트

const codeList = reactive({
  APPROVAL_STATUS: [
    { TXT: "전체", COD: "" },
    { TXT: "작성진행", COD: "작성 진행" },
    { TXT: "작성완료", COD: "작성 완료" },
    { TXT: "안전확인 완료", COD: "안전확인 완료" },
    { TXT: "안전접수 중", COD: "안전접수 중" },
    { TXT: "안전접수 완료", COD: "안전접수 완료" },
    { TXT: "안전접수 반려", COD: "안전접수 반려" },
    { TXT: "종결", COD: "종결" },
  ],
  sagoCheck: [
    { TXT: "산재(휴업일 3일이상)", COD: "SJE" },
    { TXT: "경미공상(직영)", COD: "GMS" },
    { TXT: "휴업 3일 이상 사고(협력사)", COD: "HRS" },
    { TXT: "휴업 3일 미만 일반사고 (직영/협력사)", COD: "SNE" },
    { TXT: "미정", COD: "NON" },
  ],
})

/*  공통코드 세팅 */

//  팝업

// 부서선택팝업
const openDeptPopup = (gbn) => {
  deptPopup.value.openPopup()
}

const onDeptSelected = (val) => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.INJR_DEPT_CD = val.DEPT_CD
  searchParams.ASGN_NM = val.ASGN_FULL_NM
}

//  버튼이밴트

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    disableSet.value = true
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  }
  if (btn.id === "btnClose") {
    onClose()
  }
}

watch(
  () => disableSet.value,
  (newValue) => {
    if (newValue == true) {
      disablebtns.value.disableBtn("btnSafetyDetailSearch", true)
    }
    if (newValue == false) {
      disablebtns.value.disableBtn("btnSafetyDetailSearch", false)
    }
  }
)

//  조회
const searchData01 = (idx) => {
  return commonRequest("/hse/safety/SEARCH", {
    queryId: "SAFAB0020_search01",
    param: searchParams,
  })
}

const afterSearch01 = (res) => {
  console.log(res, "메인 res")
  if (res.ORESULT_CUR.length != 0) {
    disableSet.value = false
  }
  for (let i of res.ORESULT_CUR) {
    if (i.COME_SERIOUS_YN === "S") {
      i.COME_SERIOUS_YN = "N"
    }
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 서브조회
const searchData02 = (idx) => {
  return commonSearchApi({
    queryId: "SAFAB0020_search02",
    param: searchDetailParams,
  })
}

const afterSearch02 = (res) => {
  console.log(res, "resdetail")
  grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//  로우 챌린지

const rowChanged = (grid, oldRow, newRow) => {
  grdDetail.value.getDataProvider().setRows(null)
  if (oldRow === -1) {
    newRow = 0
  }
  let rowData = grdMain.value.getDataProvider().getJsonRow(newRow)
  searchDetailParams.CMPNY_DIV = rowData.CMPNY_DIV
  searchDetailParams.SAGO_SN = rowData.SAGO_SN

  searchDetail()
}
//  서브 그리드 조회
const searchDetail = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdDetail])
    .setQuery(searchData02)
    .setAfter(afterSearch02)
    .showMessage(false)
    .run()
}

// 서브그리드 삭제
const DeltailChek = async () => {
  let chekedRow = await grdDetail.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  return true
}

const DeltailDelData = async () => {
  let checkedRow = await grdDetail.value.getGridView().getCheckedRows()
  let param = []

  await checkedRow.forEach(async (item) => {
    let data = await grdDetail.value.getDataProvider().getJsonRow(item)

    param.push(data)
  })

  console.log(param, "param")

  return commonExecuteApi({ queryId: "SAFAB0010_delete02", list: param })
}

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: ["NM1", "PRNT_SAGO_SN", "SAGO_SN"],
  fields: [
    {
      fieldName: "OCCUR_DT_TM",
      header: { text: t("발생일시") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },

    {
      fieldName: "JUCA",
      header: { text: t("주별") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "INJR_ORGN_FULL_NM",
      dataType: "text",
      header: { text: t("재해부서명") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "RESP_DEPT_NM",
      dataType: "text",
      header: { text: t("책임부서명") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "VNDR_NM",
      dataType: "text",
      header: { text: t("협력사") },
      editable: false,
    },
    {
      fieldName: "RESPON_DIV_NM",
      dataType: "text",
      header: { text: t("소속") },
      editable: false,
    },
    {
      fieldName: "NM1",
      dataType: "text",
      header: { text: t("재해자") },
      editable: false,
    },

    {
      fieldName: "SAGO_DIV_L_NM",
      dataType: "text",
      header: { text: t("사고구분") },
      editable: false,
    },
    {
      fieldName: "SAGO_DIV_M_NM",
      dataType: "text",
      header: { text: t("사고유형") },
      editable: false,
    },
    {
      fieldName: "GIINMUL1_CD",
      dataType: "text",
      header: { text: t("기인물") },
      lookupDisplay: true,
      editable: false,
    },
    {
      fieldName: "GUGUP_YN",
      dataType: "text",
      header: { text: t("구급차이용") },
      editable: false,
    },
    {
      fieldName: "SAGO_LOC_DTL",
      dataType: "text",
      header: { text: t("장소") },
      editable: false,
    },
    {
      fieldName: "SAGO_TYPE_CD",
      dataType: "text",
      header: { text: t("사고처리 구분") },
      editable: false,
      lookupDisplay: true,
      width: "150",
    },
    {
      fieldName: "SAGO_GAEYO",
      dataType: "text",
      header: { text: t("사고개요") },
      editable: false,
      styleName: "left-column",
      width: "331",
    },
    {
      fieldName: "APPROVAL_STATUS",
      dataType: "text",
      header: { text: t("진행상태") },
      editable: false,
    },

    {
      fieldName: "JEWE_YN",
      header: { text: t("통계 반영") },
      renderer: { type: "check", trueValues: "N", falseValues: "Y" },
      editable: false,
    },
    {
      fieldName: "SLI_YN",
      header: { text: t("SLI 집계") },
      renderer: { type: "check", trueValues: "N", falseValues: "Y" },
      editable: false,
    },
    {
      fieldName: "JUNGDAE_YN",
      header: { text: t("중대 재해") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    {
      fieldName: "COME_SERIOUS_YN",
      header: { text: t("중대성 사고") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    // {
    //   fieldName: "SAGO_HIDE_YN",
    //   header: { text: t("사고 은폐") },
    //   renderer: { type: "check", trueValues: "Y", falseValues: "N" },
    //   editable: false,
    // },
    {
      fieldName: "SAGOJIYEON",
      header: { text: t("지연 보고") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },

    {
      fieldName: "TONGOK",
      dataType: "text",
      header: { text: t("통계 확정") },
      editable: false,
      visible: false,
    },

    //  안보임
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: t("CMPNY_DIV") },
      visible: false,
    },
    {
      fieldName: "WRT_FN_DT",
      header: { text: t("작성완료일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      visible: false,
    },
    {
      fieldName: "WRT_CNFM_DT",
      header: { text: t("안전확인일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      visible: false,
    },
    {
      fieldName: "HSE_CLS_DT",
      header: { text: t("종결일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      visible: false,
    },
    {
      fieldName: "CERT_CAN_DATE",
      header: { text: t("자율인증취소일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      visible: false,
    },
    {
      fieldName: "PRNT_SAGO_SN",
      dataType: "text",
      header: { text: t("원 사고번호") },
      visible: false,
    },
    {
      fieldName: "OPEN_SCOPE",
      dataType: "text",
      header: { text: t("공개 범위") },
      visible: false,
    },
    {
      fieldName: "SAGO_SN",
      dataType: "text",
      header: { text: t("사고번호") },
      visible: false,
    },
    {
      fieldName: "INSERT_DATE",
      header: { text: t("등록일시") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      visible: false,
    },
    { fieldName: "OCCUR_DT", visible: false },
    { fieldName: "OCCUR_TIME", visible: false },
    { fieldName: "BSNS_CD", visible: false },
    { fieldName: "SAGO_LOC_LM", visible: false },
    { fieldName: "SAGO_LOC_MM", visible: false },
    { fieldName: "SAGO_LOC_SM", visible: false },
    { fieldName: "SAGO_DIV_S_NM", visible: false },
    { fieldName: "GUGUP_USE", visible: false },
    { fieldName: "SAGO_LOC_L", visible: false },
    { fieldName: "SAGO_LOC_M", visible: false },
    { fieldName: "SAGO_LOC_S", visible: false },
    { fieldName: "PIC_FILE_ID1", visible: false },
    { fieldName: "PIC_FILE_ID2", visible: false },
    { fieldName: "PIC_FILE_ID3", visible: false },
    { fieldName: "PIC_1_DESC", visible: false },
    { fieldName: "PIC_2_DESC", visible: false },
    { fieldName: "PIC_3_DESC", visible: false },
    { fieldName: "SAGO_DIV_L", visible: false },
    { fieldName: "SAGO_DIV_M", visible: false },
    { fieldName: "SAGO_DIV_S", visible: false },
    { fieldName: "SAFE_GAMGR_EMPKORNM", visible: false },
    { fieldName: "SAFE_GAMGR_EMP", visible: false },
    { fieldName: "SAFE_GAMGR_BSNS", visible: false },
    { fieldName: "SAFE_GAMGR_DEPT", visible: false },
    { fieldName: "SAFE_GAMGR_ASGN", visible: false },
    { fieldName: "INJR_DEPT_CD", visible: false },
    { fieldName: "RESP_DEPT_CD", visible: false },
    { fieldName: "RESP_BSNS_CD", visible: false },
  ],
  columns: [],
})

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ["BIRTHDAY", "NAME", "SOSOG_DESC"],
  fields: [
    {
      fieldName: "PRSN_DIV_NM",
      dataType: "text",
      header: { text: t("구분") },
      editable: false,
    },
    {
      fieldName: "NAME",
      dataType: "text",
      header: { text: t("재해자") },
      editable: false,
    },
    {
      fieldName: "RPT_TYPE_CD",
      dataType: "text",
      header: { text: t("사고구분") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
    },
    {
      fieldName: "SOSOG_DIV_NM",
      dataType: "text",
      header: { text: t("소속구분") },
      editable: false,
    },
    {
      fieldName: "SOSOG_DESC",
      dataType: "text",
      header: { text: t("소속조직명") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      header: { text: t("사번") },
      editable: false,
    },
    {
      fieldName: "GRD_DESC",
      dataType: "text",
      header: { text: t("직위") },
      editable: false,
    },
    {
      fieldName: "JIKJONG_NM",
      dataType: "text",
      header: { text: t("직종") },
      editable: false,
    },
    {
      fieldName: "AGE",
      dataType: "text",
      header: { text: t("나이") },
      editable: false,
    },
    {
      fieldName: "BIRTHDAY",
      header: { text: t("생년월일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },

    {
      fieldName: "IPSAIL",
      header: { text: t("입사일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },

    {
      fieldName: "HND_PHN",
      dataType: "text",
      header: { text: t("연락처(HP)") },
      editable: false,
    },
    {
      fieldName: "SJE_TYPE_CD",
      dataType: "text",
      header: { text: t("산재구분") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
    },
    {
      fieldName: "CONTACTING",
      header: { text: t(" 진정") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },

    // 안보이는거

    {
      fieldName: "REGTDTE",
      header: { text: t("총무부접수일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },
    {
      fieldName: "OKDTE",
      header: { text: t("산재승인일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },
    {
      fieldName: "HUDTE",
      header: { text: t("휴직일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },
    {
      fieldName: "BOKDTE",
      header: { text: t("복직일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },

    {
      fieldName: "DAYCNT",
      dataType: "text",
      header: { text: t("손실일수") },
      editable: false,
      visible: false,
    },
    {
      fieldName: "LOSTCOST",
      dataType: "number",
      header: { text: t("손실비용(원)") },
      numberFormat: "#,###",
      editable: false,
      visible: false,
    },

    {
      fieldName: "GRP_ENT_DATE",
      header: { text: t("그룹입사일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      visible: false,
    },
    {
      fieldName: "JINDAN_NM",
      dataType: "text",
      header: { text: t("진단") },
      visible: false,
    },
    { fieldName: "PRSN_DIV", dataType: "text", visible: false },
    { fieldName: "SEX", dataType: "text", visible: false },
    { fieldName: "JIKJONG_CD", dataType: "text", visible: false },
    { fieldName: "SOSOG_TEL", dataType: "text", visible: false },
    { fieldName: "UMJU_MSR_MTHD", dataType: "text", visible: false },
    { fieldName: "UMJU_ALCOL", dataType: "text", visible: false },
    { fieldName: "SOSOG_DIV", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_LM", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_SM", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_L", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_S", dataType: "text", visible: false },
    { fieldName: "INJURY_TYPE", dataType: "text", visible: false },
    { fieldName: "JINDAN_CD", dataType: "text", visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "SAGO_SN", dataType: "text", visible: false },
    { fieldName: "SEQ", dataType: "text", visible: false },
    { fieldName: "RPT_FILE_ID", dataType: "text", visible: false },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields
grdProps2.columns = grdProps2.fields

const upData = () => {
  onButtonsClick({ id: "btnSearch" })
}

const clearable = () => {
  searchParams.ASGN_NM = "전체"
  searchParams.INJR_DEPT_CD = ""
  searchParams.DEPT_CD = ""
  searchParams.BSNS_CD = ""
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {  
  Promise.all([
    getCodeList("HHIB210"), //0
    getCodeList("HHIB330"), //1
    getCodeList("HHIB010"), //2
    getCodeList("HHIB070"), //3
    getCodeList("HHIB080"), //4
    getCodeList("HHIB040"), //5
    getCodeList("HHIB340"), //6
  ]).then((res) => {
    // codeList.DT_GBN = [
    //   { TXT: "발생기간", COD: "1" },
    //   { TXT: "등록기간", COD: "2" },
    // ];

    grdMain.value.setBindingColumn(
      "OPEN_SCOPE",
      res[0].ORESULT_CUR,
      "COD",
      "TXT"
    )

    codeList.SAGO_PLAN_CHK = res[1].ORESULT_CUR
    codeList.SAGOBURU = res[2].ORESULT_CUR

    grdMain.value.setBindingColumn(
      "GIINMUL1_CD",
      res[5].ORESULT_CUR,
      "COD",
      "TXT"
    )

    grdMain.value.setBindingColumn(
      "SAGO_TYPE_CD",
      codeList.sagoCheck,
      "COD",
      "TXT"
    )
    grdDetail.value.setBindingColumn(
      "SJE_TYPE_CD",
      res[4].ORESULT_CUR,
      "COD",
      "TXT"
    )

    grdDetail.value.setBindingColumn(
      "RPT_TYPE_CD",
      res[3].ORESULT_CUR,
      "COD",
      "TXT"
    )
    codeList.APPROVAL_STATUS = res[6].ORESULT_CUR
    codeList.APPROVAL_STATUS.unshift({ TXT: "전체", COD: "" })

    console.log(codeList.SAGO_PLAN_CHK, "ddd")

    codeList.SAGOBURU.unshift({ TXT: "전체", COD: "" })
    codeList.SAGO_PLAN_CHK.unshift({ TXT: "전체", COD: "" })

    console.log(disablebtns.value, "disablebtns")
    disablebtns.value.disableBtn("btnSafetyDetailSearch", true)
  })

  //  스타일 지정
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    if (dataCell.value == "즉보작성 진행") {
      ret.style = { background: "#E6B9B8" } // ret.style = {background:"#ffff00"} 직접 스타일 적용 가능
    } else if (dataCell.value == "즉보작성 완료") {
      ret.style = { background: "#FCD5B5" }
    } else if (dataCell.value == "즉보안전확인 완료") {
      ret.style = { background: "#D7E4BD" }
    } else if (dataCell.value == "안전접수 중") {
      ret.style = { background: "#B7DEE8" }
    } else if (dataCell.value == "안전접수 완료") {
      ret.style = { background: "#4EB4E3" }
    } else if (dataCell.value == "안전반려") {
      ret.style = { background: "#5EB4E3" }
    } else if (dataCell.value == "종결") {
      ret.style = { background: "#8EB4E3" }
    } else if (dataCell.value == "보고서 작성 진행") {
      ret.style = { background: "#E6B9B8" } // ret.style = {background:"#ffff00"} 직접 스타일 적용 가능
    } else if (dataCell.value == "보고서 작성 완료") {
      ret.style = { background: "#FCD5B5" }
    } else if (dataCell.value == "보고서 안전확인 완료") {
      ret.style = { background: "#D7E4BD" }
    }

    return ret
  })
  //팝업 오픈
  dialog.value = true 
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1600"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{'주요 사고 현황 및 재발방지대책 이행현황 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('주요 사고 현황 및 재발방지대책 이행현황')"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <VForm ref="searchArea" class="searchArea d-flex">
            <i-input
              :label="$t('발생일자')"
              v-model="searchParams.OCCUR_FROM"
              label-width="60px"
              type="Date"
              width="210px"
              margin="10px"
            />

            <i-input
              :label="$t('-')"
              v-model="searchParams.OCCUR_TO"
              type="Date"
              width="160px"
            />

            <i-input
              :label="$t('재해부서')"
              v-model="searchParams.ASGN_NM"
              width="300px"
              margin="4px"
              append-inner-icon="mdi-magnify"
              readonly
              clearable
              @click:clearable="clearable()"
              @click:appendInner="openDeptPopup()"
              @keydown.enter="
                (e) => {
                  openDeptPopup()
                }
              "
            />
            <i-input
              :label="$t('')"
              v-model="searchParams.INJR_DEPT_CD"
              width="100px"
              readonly
            />
            <i-select
              :label="$t('사고구분')"
              v-model="searchParams.SAGOBURU"
              :items="codeList.SAGOBURU"
              item-value="COD"
              item-title="TXT"
              width="180px"
            />
            <i-select
              :label="$t('진행상태')"
              v-model="searchParams.APPROVAL_STATUS"
              :items="codeList.APPROVAL_STATUS"
              item-value="COD"
              item-title="TXT"
              width="200px"
            />
            <i-select
              :label="$t('대책이행점검')"
              v-model="searchParams.SAGO_PLAN_CHK"
              :items="codeList.SAGO_PLAN_CHK"
              item-value="COD"
              item-title="TXT"
              width="200px"
            />
          </VForm>
          <v-sheet height="60%" class="mb-3">
            <IGridTitle
              ref="disablebtns"
              :title="$t('사고보고서 현황')"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              @onCurrentRowChanged="rowChanged"
            />
          </v-sheet>
          <v-sheet class="h-auto">
            <IGridTitle
              :title="$t('사고보고서별 인적현황')"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdDetail"
              :grid-view-option="grdProps2.gridViewOption"
              :keys="grdProps2.keys"
              :fields="grdProps2.fields"
              :columns="grdProps2.columns"
            />
          </v-sheet>
          <!-- 팝업촌 -->
          <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
          <SAFAB0020PopUp ref="MainPopOpen" @upData="upData" />
          <SAFAB0020ManPopUp ref="ManPopOpen" @upData="upData" />
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
