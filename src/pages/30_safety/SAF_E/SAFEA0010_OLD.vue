<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import SAFEA0010Popup from "./SAFEA0010Popup.vue"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"

defineOptions({
  name: "30_safety-SAF_E-SAFEA0010",
})

// 작업표준 신규제정에서 팝업 호출시 (RSKBA0010)
const props = defineProps({
  dialog: 'N',
  val1 : '',
  half : ''
})

const emit = defineEmits(['close'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)
const empPopup2 = ref(null)
const sAFEA0010Popup = ref(null)
const selectedData = reactive({})

//컴포넌트별 readonly 플래그값
const readOnlyValue = {
  CMPNY_DIV: true,
  BSNS_CD: true,
  DEPT_CD: true,
}

const name = reactive({
  ACT_EMP_NM: "", //조치자이름
  REQ_EMP_NM: "", //요청자이름
})

const searchParam = reactive({
  CMPNY_DIV: "",
  DATE_YN: "Y", //기간 체크박스
  FROM: "", //기간 FROM
  TO: "", //기간 TO
  COMPANY: "", //회사구분
  BSNS_CD: "", //사업부
  DEPT_CD: "", //부서
  ACT_EMP_NO: "", //조치자 사번
  EMP_NO: "", // 요청자 사번
  CHANNEL: "", //
  END_YN: "", //
})

const codeList = reactive({
  company: [], //회사구분
  bsnscd: [], //사업부
  deptcd: [], //부서
  radiovalue: [
    { TXT: "전체", COD: "" },
    { TXT: "URL", COD: "URL" },
    { TXT: "Hi-SNS", COD: "SNS" },
    { TXT: "프로그램", COD: "CS" },
  ],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //회사조회
      queryId: "searchCommonCode",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: "HHIZ000",
        USE_FLAG: "Y",
        CODE_NAME_TYPE: "0",
      },
    }),
    commonSearchApi({
      //사업부조회
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      //부서조회
      queryId: "searchDept",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ORGN_DIV: "A",
        BSNS_CD: "",
        ASGN_NM: "",
        DEPT_CD: "",
        HSE_ONLY: "",
        USE_ONLY: "Y",
      },
    }),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnscd = res[1].ORESULT_CUR
    codeList.deptcd = res[2].ORESULT_CUR
    codeList.company.unshift({ TXT: "전체", COD: "" })
    codeList.bsnscd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.deptcd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
  })
}

//관리자 권한 체크하는 함수
const checkAdmin = () => {
  //관리자면 회사구분,사업부,부서 활성화
  if (userLogStore.isMenuAdmin === "Y") {
    readOnlyValue.CMPNY_DIV = false
    readOnlyValue.BSNS_CD = false
    readOnlyValue.DEPT_CD = false
  }
  //관리자가 아니면 회사구분,사업부,부서 비활성화 및 본인이 속한 조직만 검색가능
  else {
    searchParam.COMPANY = userStore.cmpnyDiv
    searchParam.BSNS_CD = userStore.bsnsCd
    searchParam.DEPT_CD = userStore.deptCd
  }
}

//-1달 ~ 오늘날짜
const defaultDate = () => {
  let today = dayjs()
  let toDay =
    today.get("year") +
    "-" +
    (today.get("month") + 1).toString().padStart(2, "0") +
    "-" +
    today.get("date").toString().padStart(2, "0")
  let fromDay = dayjs().subtract(1, "month")
  let from =
    fromDay.$y + "-" + (fromDay.$M + 1).toString().padStart(2, "0") + "-" + fromDay.$D.toString().padStart(2, "0")
  searchParam.FROM = from
  searchParam.TO = toDay
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {},
  fields: [
    {
      fieldName: "REQ_DATETIME",
      editable: false,
      dataType: "text",
      width: "130",
      header: { text: t("요구일시") },
    },
    {
      fieldName: "ASGN_NM",
      editable: false,
      dataType: "text",
      width: "130",
      header: { text: t("소속") },
    },
    {
      fieldName: "EMP_NO",
      editable: false,
      dataType: "text",
      header: { text: t("사번") },
    },
    {
      fieldName: "EMP_NM",
      editable: false,
      dataType: "text",
      header: { text: t("성명") },
    },
    {
      fieldName: "REQ_TYPE_NM",
      editable: false,
      dataType: "text",
      header: { text: t("요청대상") },
    },
    {
      fieldName: "JOB_PLC_NM",
      editable: false,
      dataType: "text",
      header: { text: t(" ") },
    },
    {
      fieldName: "JOB_PLC_DETAIL",
      editable: false,
      dataType: "text",
      width: "130",
      header: { text: t(" ") },
    },
    {
      fieldName: "CHANNEL_NM",
      editable: false,
      dataType: "text",
      header: { text: t("등록구분") },
    },
    {
      fieldName: "APPLY_YN",
      editable: false,
      dataType: "text",
      header: { text: t("조치완료") },
    },
    {
      fieldName: "ACTION_DATETIME",
      editable: false,
      dataType: "text",
      header: { text: t("조치일시") },
    },
    {
      fieldName: "ACT_ASGN_NM",
      editable: false,
      dataType: "text",
      width: "130",
      header: { text: t("소속") },
    },
    {
      fieldName: "ACT_EMP_NO",
      editable: false,
      dataType: "text",
      header: { text: t("사번") },
    },
    {
      fieldName: "ACT_EMP_NM",
      editable: false,
      dataType: "text",
      header: { text: t("성명") },
    },
    {
      fieldName: "SLI_ASGN_NM",
      editable: false,
      dataType: "text",
      width: "130",
      header: { text: t("SLI소속") },
    },
    {
      fieldName: "INSERT_USER_ID",
      editable: false,
      dataType: "text",
      header: { text: t("사번") },
    },
    {
      fieldName: "INSERT_EMP_NM",
      editable: false,
      dataType: "text",
      header: { text: t("성명") },
    },
    {
      fieldName: "INSERT_ASGN_NM",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "APPLY_DATE",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ACTION_DIV",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ACTION_DIV_NM",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ACTION_DATE",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ACTION_DESC",
      dataType: "text",
      visible: false,
      header: { text: t("조치내용") },
    },
    {
      fieldName: "ACTION_NM",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ACTION_TIME",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ACT_COMPANY",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "APPLY_EMP",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ASGN_CD",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "BSNS_CD",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "CHANNEL",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "CHK",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "DEPT_CD",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "INSERT_DT",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "JOB_LPLC",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "JOB_MPLC",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "JOB_PLC_FULL_NM",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "JOB_SPLC",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "REGIST_DATE",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "REGIST_EMP",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "REL_RULE_L",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "REL_RULE_S",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "REQ_DATE",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "REQ_DESC",
      dataType: "text",
      visible: false,
      header: { text: t("위험내용") },
    },
    {
      fieldName: "REQ_TIME",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "REL_RULE_LNM",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "REL_RULE_SNM",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "SAVE_YN",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "SEQ",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "SLI_ASGN_CD",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "SLI_BSNS_CD",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "SLI_COMPANY",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "SLI_DEPT_CD",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ATTACH_ID",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "ATTACH_ID2",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "INSERT_ID",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "REQ_TYPE",
      dataType: "text",
      visible: false,
      header: { text: t("") },
    },
  ],
  columnLayout: [
    "REQ_DATETIME",
    {
      name: "요청자/작성자",
      direction: "horizontal",
      items: ["ASGN_NM", "EMP_NO", "EMP_NM"],
      header: { text: t("요청자/작성자") },
    },
    "REQ_TYPE_NM",
    {
      name: "장소",
      direction: "horizontal",
      hideChildHeaders: true,
      items: ["JOB_PLC_NM", "JOB_PLC_DETAIL"],
      header: { text: t("장소") },
    },
    "REQ_DESC",
    "CHANNEL_NM",
    "APPLY_YN",
    "ACTION_DATETIME",
    {
      name: "조치자",
      direction: "horizontal",
      items: ["ACT_ASGN_NM", "ACT_EMP_NO", "ACT_EMP_NM"],
      header: { text: t("조치자") },
    },
    "SLI_ASGN_NM",
    "ACTION_DESC",
    {
      name: "작성자",
      direction: "horizontal",
      items: ["INSERT_USER_ID", "INSERT_EMP_NM"],
      header: { text: t("작성자") },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {

  defaultDate()
  initCodeList()
  checkAdmin() //관리자 권한 체크
  //초기조회조건값 세팅
  searchParam.ACT_EMP_NO = userStore.empNo //조치자 기본값 로그인 유저 사번
  name.ACT_EMP_NM = userStore.empNm
  searchParam.DATE_YN = "Y" //기간 체크박스 기본값 체크
  searchParam.END_YN = "N" //기간 체크박스 기본값 미체크
  searchParam.CHANNEL = "" //등록구분 라디오그룹 기본값 전체
  
  // 작업표준 신규제정에서 팝업으로 호출시 -------------//
  if(props.dialog == 'Y')
  {
    menuTitle.value.setBtnProperty('btnCreate', 'visible', false)
    menuTitle.value.setBtnProperty('btnExtraction', 'visible', false)
    menuTitle.value.setBtnProperty('btnClose', 'visible', true)
    
    searchParam.FROM = props.half.from
    searchParam.TO = props.half.to
    
    //console.log('props.val1 = ', props.val1)

    searchParam.CMPNY_DIV = props.val1.COMPANY_CD
    searchParam.BSNS_CD = props.val1.BSNS_CD
    searchParam.DEPT_CD = props.val1.DEPT_CD
  }
  else
    menuTitle.value.setBtnProperty('btnClose', 'visible', false)
  //-------------------------------------------------//

  onButtonsClick({ id: "btnSearch" })
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  } else if (btn.id === "btnCreate") {
    sAFEA0010Popup.value.addPopup()
  }else if(btn.id === 'btnClose')
  {
    emit('close', false)
  }else {
    //엑셀추출
    let now = dayjs()
    let title = "안전작업요구권_"
    let fullTitle =
      title +
      now.$y +
      (now.$M + 1).toString().padStart(2, "0") +
      now.$D.toString().padStart(2, "0") +
      now.$H.toString().padStart(2, "0") +
      now.$m.toString().padStart(2, "0") +
      now.$s.toString().padStart(2, "0")
    grdMain.value.getGridView().exportGrid({
      type: "excel",
      target: "local",
      fileName: fullTitle,
      progressMessage: "엑셀 다운로드중입니다.",
      showProgress: true,
      indicator: "visible",
      header: "visible",
      footer: "hidden",
      allColumns: true,
    })
  }
}

//조회관련 로직시작
const searchData = () => {
  return commonSearchApi({
    queryId: "SAFEA0010_SEARCH01",
    param: searchParam,
  })
}

const afterSearch = (res) => {
  //console.log("조회값", res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//조회관련 로직 끝

//회사가 바뀌면 회사에 맞는 사업부 가져옴
//회사 바뀌면 사업부 가져옴 (회사변경 감지)
watch(
  () => searchParam.COMPANY,
  (newValue, oldValue) => {
    if (userLogStore.isMenuAdmin === "Y") {
      if (newValue === "") {
        searchParam.BSNS_CD = ""
        searchParam.DEPT_CD = ""
        codeList.bsnscd = []
        codeList.bsnscd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
        codeList.deptcd = []
        codeList.deptcd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
        return false
      }
      commonSearchApi({
        //사업부조회
        queryId: "searchBSNS",
        param: { CMPNY_DIV: newValue },
      }).then((res) => {
        searchParam.BSNS_CD = ""
        codeList.bsnscd = res.ORESULT_CUR
        codeList.bsnscd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
      })
    }
  }
)

//사업부변경 감지
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    if (userLogStore.isMenuAdmin === "Y") {
      if (newValue === "") {
        searchParam.DEPT_CD = ""
        codeList.deptcd = []
        codeList.deptcd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
        return false
      }
      commonSearchApi({
        queryId: "searchDept",
        param: {
          CMPNY_DIV: searchParam.CMPNY_DIV,
          ORGN_DIV: "A",
          BSNS_CD: newValue,
          ASGN_NM: "",
          DEPT_CD: "",
          HSE_ONLY: "",
          USE_ONLY: "Y",
        },
      }).then((res) => {
        searchParam.DEPT_CD = ""
        codeList.deptcd = res.ORESULT_CUR
        codeList.deptcd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
      })
    }
  }
)

//로우 더블클릭시 상세정보 팝업 출력
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFEA0010Popup.value.openPopup(data)
}

//로우클릭시 해당로우 정보 get
const onCellClicked = (grid, clickData) => {
  let rowData = grdMain.value.getFocusedRowData()
  selectedData.value = rowData
}

//조치자 인원팝업 오픈
const openActEmpPopup = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: name.ACT_EMP_NM,
  })
}

//조치자 선택 이벤트
const onActEmpSelected = (val) => {
  searchParam.ACT_EMP_NO = val.EMP_NO
  name.ACT_EMP_NM = val.EMP_NM
}

//요청자 인원팝업 오픈
const openReqEmpPopup = () => {
  empPopup2.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: name.REQ_EMP_NM,
  })
}
//요청자 선택 이벤트
const onReqEmpSelected = (val) => {
  searchParam.EMP_NO = val.EMP_NO
  name.REQ_EMP_NM = val.EMP_NM
}

//조치자 내부 X아이콘 클릭시 조치자 사번,성명 초기화
const clearAct = () => {
  searchParam.ACT_EMP_NO = ""
  name.ACT_EMP_NM = ""
}

//요청자 내부 X아이콘 클릭시 요청자 사번,성명 초기화
const clearReq = () => {
  searchParam.EMP_NO = ""
  name.REQ_EMP_NM = ""
}

//팝업 닫혔을때 조회
const closedPopup = () => {
  onButtonsClick({ id: "btnSearch" })
}
</script>

<template>
  <div>
    <VContainer class="pt-0">
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            :title="props.dialog == 'Y' ? '' : $t(useLogsStore().menuId)"
            :button-list="['btnSearch', 'btnCreate', 'btnExtraction', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <!-- 조회조건 -->
      <VRow no-gutters>
        <VCol>
          <VForm ref="searchArea" class="searchArea">
            <VRow>
              <VCol cols="12" md="3">
                <ILabel :label="$t('기간')">
                  <template #editor="editorProps">
                    <VCheckbox true-value="Y" false-value="N" v-model="searchParam.DATE_YN"></VCheckbox>
                    <VTextField type="date" class="pl-1" v-model="searchParam.FROM" />
                    <span class="pa-1"> ~ </span>
                    <VTextField type="date" v-model="searchParam.TO" />
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="3" class="pr-0">
                <ILabel :label="$t('등록구분')">
                  <template #editor="editorProps">
                    <VRadioGroup v-model="searchParam.CHANNEL" inline>
                      <VRadio
                        v-for="(item, index) in codeList.radiovalue"
                        :label="item.TXT"
                        :value="item.COD"
                        :key="index"
                      ></VRadio>
                    </VRadioGroup>
                  </template>
                </ILabel>
              </VCol>
              <VCheckbox
                class="mt-1"
                label="조치 미완료 건"
                true-value="Y"
                false-value="N"
                v-model="searchParam.END_YN"
              ></VCheckbox>
            </VRow>
            <VRow>
              <VCol cols="12" md="2">
                <ILabel :label="$t('회사구분')">
                  <template #editor="editorProps">
                    <VAutocomplete
                      :readonly="readOnlyValue.CMPNY_DIV"
                      class="pl-1"
                      v-model="searchParam.COMPANY"
                      :items="codeList.company"
                      item-title="TXT"
                      item-value="COD"
                    >
                    </VAutocomplete>
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="2">
                <ILabel :label="$t('사업부')">
                  <template #editor="editorProps">
                    <VAutocomplete
                      :readonly="readOnlyValue.BSNS_CD"
                      v-model="searchParam.BSNS_CD"
                      :items="codeList.bsnscd"
                      item-title="BSNS_NM"
                      item-value="BSNS_CD"
                    >
                    </VAutocomplete>
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="2">
                <ILabel :label="$t('부서')">
                  <template #editor="editorProps">
                    <VAutocomplete
                      :readonly="readOnlyValue.DEPT_CD"
                      v-model="searchParam.DEPT_CD"
                      :items="codeList.deptcd"
                      item-title="ASGN_SHRT_NM"
                      item-value="ASGN_CD"
                    >
                    </VAutocomplete>
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="2">
                <ILabel :label="$t('조치자')">
                  <template #editor="editorProps">
                    <VTextField readonly v-model="name.ACT_EMP_NM">
                      <template v-slot:append-inner>
                        <v-icon @click="openActEmpPopup" icon="mdi-magnify" />
                        <v-icon color="error" @click="clearAct" icon="mdi-window-close" />
                      </template>
                    </VTextField>
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="2">
                <ILabel :label="$t('요청자')">
                  <template #editor="editorProps">
                    <VTextField v-model="name.REQ_EMP_NM" readonly>
                      <template v-slot:append-inner>
                        <v-icon @click="openReqEmpPopup" icon="mdi-magnify" />
                        <v-icon color="error" @click="clearReq" icon="mdi-window-close" />
                      </template>
                    </VTextField>
                  </template>
                </ILabel>
              </VCol>
            </VRow>
          </VForm>
        </VCol>
      </VRow>
      <!-- 메인그리드 -->
      <VRow>
        <VCol>
          <IGridTitle :title="$t('안전작업 요구권 등록/조회')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-1"
            style="height: calc(100vh - 400px)"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
            @onCellClicked="onCellClicked"
          />
        </VCol>
      </VRow>
      <EmpPopup ref="empPopup" @selected="onActEmpSelected"></EmpPopup>
      <EmpPopup ref="empPopup2" @selected="onReqEmpSelected"></EmpPopup>
      <SAFEA0010Popup ref="sAFEA0010Popup" @closed="closedPopup"></SAFEA0010Popup>
    </VContainer>
  </div>
</template>
