<!--
  화면명 : SAFBA0010 / 위험작업허가 작성/승인
  화면개요 :∙ 부서별 위험작업 허가서를 작성하고 승인한다.
-->

<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  registerRuntimeCompiler,
} from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonRequest2,
  commonRequest,
} from "@hiway/api/commonApi"
import { useRouter } from "vue-router"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import { required } from "@hiway/utils/validation"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import OZReport from "@/components/OZReport.vue"
import SAFBA0010PopUp1_new from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1_new.vue"
import SAFBA0010PopUp1_shrt from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1_shrt.vue"
import SAFBA0010PopUp1 from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1.vue"
import WrkChkPopUp from "@/pages/30_safety/SAF_B/SAFBA0010WrkChkPopUp.vue"
import LogoImg from "@/assets/images/SAFBA0010LoGoPrint.png"
import { commonSampleDownFilesApi  } from "@hiway/api/commonFileApi"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import SafeAppPopUp from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1_SafeApp.vue"
import planningPopup from "@/pages/30_safety/SAF_B/SAFBA0010PlanningPopUp.vue"


defineOptions({
  name: "30_safety-SAF_B-SAFBA0010",
})
import { getQDomain } from '@/utils/common'
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const codeList = reactive({})
const wrkChk = ref(null)
const plannPopup = ref(null)

const NOBSNS = ref(true)
const NODAN = ref(true)
const safba00101 = ref(null)
const safba00101_n = ref(null)
const safba00101_s = ref(null)
const isAdmin = ref(userStore.authGrpCd.includes('GRP00381') ?  false : true)
// 라우터
const router = useRouter()
// Report Name Name.ozr
const reportName = ref([])
const isMulti = ref(false)
const params = ref([])
// OzReport 팝업 여부
const showOz = ref(false)
const gbnEmp =ref(null)
const empPopup =ref(null)
const SafeAppPop =  ref(null)
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  WORK_NO: "",
  ORGN_DIV: userStore.userDiv,
  // ORGN_DIV:'',
  // BSNS_CD: "AG00",
  // DEPT_CD: "GBS0",
  // ASGN_CD: "GBS1",
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  // ASGN_CD: userStore.userDiv == 'B' ? userStore.asgnCd : '' ,
  ASGN_CD: userStore.asgnCd,
  WORK_FROM: dayjs().format("YYYY-MM-DD"),
  WORK_TO: dayjs().add(2, "day").format("YYYY-MM-DD"),
  WORK_DIV: "",
  STATUS: "",
  RESP_EMP_NO: "",
  GBN: "1",
  REQ_EMP_NO: "",
  CHECK: "N",
  CHECK_EMP: userStore.empNo,
})
const userOrgDiv = ref(true)
const isDivVisible = ref(false)
const QRAD =ref('')
onMounted(() => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: "N" },
    }),
    getCodeList("HHIE100CODE000"),
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: userStore.bsnsCd },
    }),
    commonSearchApi({
      queryId: "SAFBC0010_search02",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }), // 1
   
    
  ]).then((res) => {
    console.log(res[1],'3123123kasedk')
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.STATUS = 
    res[1].ORESULT_CUR.filter(x=>x.COD =='20'|| x.COD =='21' || x.COD=='25' || x.COD =='35'|| x.COD =='40' || x.COD =='41' || x.COD =='50')
    console.log('ddkd')
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
    codeList.WorkNo = res[3].ORESULT_CUR
    codeList.WorkNo.unshift({ SHIP_KIND_NM: "", WORK_NO: "전체" })
    console.log(isAdmin.value,'isAdmin')
    console.log(useLogsStore().isMenuAdmin === 'Y' ? false : isAdmin.value ,'isAdmin')
    codeList.STATUS.unshift({ TXT: "전체", COD: "" })
    codeList.DAN_DIV = [{ TXT: "전체", COD: "1" },{ TXT: "단기공사", COD: "3" } , { TXT: "일반공사", COD: "2" }  ]


    // console.log(useLogsStore().isMenuAdmin)
    console.log('dmddkdㅁㄴㅇㅁㄴㅇㄴㅁㅇk')
    vm.$nextTick(() => {
      if (useLogsStore().isMenuAdmin === "Y") {
        menuTitle.value.setBtnProperty("btnPOBA", "visible", true)
        menuTitle.value.setBtnProperty("btnIndividualPermit", "visible", true)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", true)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", true)
      } else {
        menuTitle.value.setBtnProperty("btnPOBA", "visible", false)
        menuTitle.value.setBtnProperty("btnIndividualPermit", "visible", false)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
      }
      console.log(userStore.userDiv,'ddd')
      if(userStore.userDiv ==='B'){
        userOrgDiv.value = false
      }



      // 일렉일 경우 호선, 규격/선종 칼럼을 숨긴다. 3중점검여부를 점검여부로 변경한다. (2024.11.11. by kykim)
      let cmpnyDiv = userStore.cmpnyDiv
      console.log("cmpnyDiv=" + cmpnyDiv)
      if (cmpnyDiv == '200') {
        console.log("200")
        grdMain.value.getGridView().setColumnProperty("WORK_NO", "visible", false)
        grdMain.value.getGridView().setColumnProperty("SHPTYP_NAM", "visible", false)
        grdMain.value.getGridView().setColumnProperty("THREECHECKYN", "header", "점검여부")

      }


    })
  })
})


// 사업부 변경감지
watch(
  () => searchParams.BSNS_CD,
  (newValue) => {
    if (!newValue) {
      NOBSNS.value = true
      searchParams.DEPT_CD = ""
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        // console.log(res, "res")
        searchParams.DEPT_CD = ""
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        NOBSNS.value = false
      })
    }
  }
)

//  이벤트 종료

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },

  keys: ["CMPNY_DIV"],
  fields: [
    {
      fieldName: "WRKCHK",
      dataType: "text",
      width: "30",
      header: { text: t("　") },
      renderer: {
        type: "html",
        callback: (grid, model, field) => {
          return GBNCallback(grid, model, field)
        },
      },
      mergeRule: { criteria: "value" },
    },
    {
      header: { text: t('　') },
      fieldName: "PLANNING",
      dataType: "text",
      width: "70",
      renderer:{ type:"button" }
    },

    {
      fieldName: "WORK_TIME",
      dataType: "text",
      width: "100",
      header: { text: t("작업시간") },
    },
    {
      fieldName: "WORK_DT",
      dataType: "text",
      width: "100",
      header: { text: t("작업일") },

      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM-DD") : null
      },
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM",
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM",
          includedFormat: true,
        },
      },
    },
    {
      fieldName: "BSNSNM",
      dataType: "text",
      width: "100",
      header: { text: t("사업부") },
      mergeRule: { criteria: "value" },
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "DEPTNM",
      dataType: "text",
      width: "100",
      header: { text: t("부서") },
      mergeRule: { criteria: "value" },
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "100",
      header: { text: t("조직") },
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "WORKER_CNT",
      dataType: "text",
      width: "100",
      header: { text: t("인원") },
      styleName: "right-column",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "RESP_HP_NO",
      dataType: "text",
      width: "150",
      header: { text: t("책임자 전화번호") },
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "RESP_EMP_NM",
      dataType: "text",
      width: "100",
      header: { text: t("책임자") },
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "MNGR_HP_NO",
      dataType: "text",
      width: "150",
      header: { text: t("관리감독자 전화번호") },
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "MNGR_EMP_NM",
      dataType: "text",
      width: "100",
      header: { text: t("관리감독자　　　(승인자)") },
      mergeRule: { criteria: "value" },
    },
    /* ********** 호선,규격-선종 요청으로 인해 추가함(2024.07.21 염인식) ********** */
    {
      header: { text: t("호선") },
      fieldName: "WORK_NO",
      dataType: "text",
    },
    {
      header: { text: t("규격-선종") },
      fieldName: "SHPTYP_NAM",
      dataType: "text",
    },

    // 장소
    {
      fieldName: "JOB_SPLC",
      dataType: "text",
      width: "150",
      header: { text: t("기본") },
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "DIV_M",
      dataType: "text",
      width: "100",
      header: { text: t("상세") },
      styleName: "left-column",
      width:'250',
      mergeRule: { criteria: "value" },
    },

    // 작업
    {
      fieldName: "DANG_DIV",
      dataType: "text",
      width: "150",
      header: { text: t("위험작업분류") },
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "WRK_DIST",
      dataType: "text",
      width: "250",
      header: { text: t("작업명") },
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "WORK_DETAIL",
      dataType: "text",
      width: "250",
      header: { text: t("작업상세") },
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "THREECHECKYN",
      width: "100",
      header: { text: t("3중점검여부") },
      editable: false,
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "STATUS_NM",
      width: "120",
      header: { text: t("진행상태") },
      dataType: "text",
      mergeRule: { criteria: "value" },
    },
    {
      // 대면/전산
      header: { text: t("허가구분") },
      fieldName: "CF_DIV_NM",
      dataType: "text",
      mergeRule: { criteria: "value" },
    },
    // {
    //   fieldName: "REL_ASGN_NM",
    //   width: "100",
    //   header: { text: t("안전팀") },
    //   dataType: "text",
    // },

    {
      header: { text: t("허가번호") },
      fieldName: "RCV_NO",
      dataType: "text",
      width: "170",
      mergeRule: { criteria: "value" },
    },
    {
      header: { text: t("신청일") },
      fieldName: "REQ_DT",
      dataType: "text",
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM-DD") : null
      },
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM",
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM",
          includedFormat: true,
        },
      },
      mergeRule: { criteria: "value" },
    },
    {
      header: { text: t("단기공사번호") },
      fieldName: "SHORT_WORK_NO",
      dataType: "text",
      mergeRule: { criteria: "value" },
    },
    {
      header: { text: t("밀폐공간") },
      fieldName: "CONFINED_YN",
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
      visible: false,
    },
    {
      header: { text: t("아르곤") },
      fieldName: "ARGN_YN",
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
      visible: false,
    },
    {
      header: { text: t("수전") },
      fieldName: "ELEC_YN",
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
      visible: false,
    },

    {
      header: { text: t("고소") },
      fieldName: "HEIGHT",
      dataType: "number",
      styleName: "right-column",
      visible: false,
    },

    {
      header: { text: t("테스트압력") },
      fieldName: "PRESSURE",
      dataType: "number",
      styleName: "right-column",
      visible: false,
    },
    {
      header: { text: t("압력 테스트") },
      fieldName: "PIPE_DIA",
      dataType: "number",
      styleName: "right-column",
      visible: false,
    },
    {
      header: { text: t("긴급작업여부") },
      fieldName: "URGENT_YN",
      dataType: "text",
      mergeRule: { criteria: "value" },
    },
    {
      header: { text: t("병행작업여부") },
      fieldName: "PARA_YN",
      dataType: "text",
      renderer:{ type:"button" },
      mergeRule: { criteria: "value" },
    },

    {
      header: { text: t("CANCELED_YN") },
      fieldName: "CANCELED_YN",
      dataType: "text",
      visible: false,
    },

    {
      fieldName: "GBN",
      visible: false,
    },
    {
      fieldName: "ORGN_NM",
      visible: false,
    },    
    {
      fieldName: "JOB_PLC",
      visible: false,
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
    },
    {
      fieldName: "BSNS_CD",
      visible: false,
    },
    {
      fieldName: "STATUS",
      visible: false,
    },
    {
      fieldName: "CF_DIV",
      visible: false,
    },
    {
      fieldName: "WRK_PLC",
      visible: false,
    },
    {
      fieldName: "DANG_DIV_CD",
      visible: false,
    },
    {
      fieldName: "P_WRK_ID",
      visible: false,
    },

    {
      fieldName: "JOB_BSNS_CD",
      visible: false,
    },
    {
      fieldName: "DN_DIV",
      visible: false,
    },
    {
      fieldName: "MNGR_EMP_NO",
      visible: false,
    },
    {
      fieldName: "WRK_DIV",
      visible: false,
    },
    {
      fieldName: "DEPT_CD",
      visible: false,
    },
    {
      fieldName: "JOB_LPLC",
      visible: false,
    },
    {
      fieldName: "JOB_MPLC",
      visible: false,
    },


  ],
  columns: [],
  columnLayout: [
    //"CANCELED_YN",
    "WRKCHK",
    "PLANNING",
    "RCV_NO",
    "WORK_DT",
    "WORK_TIME",
    "BSNSNM",
    "DEPTNM",
    "ASGN_NM",
    "STATUS_NM",
    {
      name: "장소",
      direction: "horizontal",
      items: ["JOB_SPLC", "DIV_M"],
      header: {
        text: t("장소"),
      },
    },
    "WORK_NO",
    "SHPTYP_NAM",
    {
      name: "작업",
      direction: "horizontal",
      items: ["DANG_DIV", "WRK_DIST", "WORK_DETAIL", "THREECHECKYN"],
      header: {
        text: t("작업"),
      },
    },
    "WORKER_CNT",
    "RESP_HP_NO",
    "RESP_EMP_NM",
    "MNGR_HP_NO",
    "MNGR_EMP_NM",


    // "REL_ASGN_NM",
    "CF_DIV_NM",
    "REQ_DT",
    "SHORT_WORK_NO",
    "URGENT_YN",
    "PARA_YN",
    "CONFINED_YN",
    "ARGN_YN",
    "ELEC_YN",
    "HEIGHT",
    "PRESSURE",
    "PIPE_DIA",

  ],
})

grdMainProps.columns = grdMainProps.fields

// 병행작업 html
const GBNCallback = (grid, model, field) => {
  let backgroundColor = ""

  if (model._index.value === "Y1") {
    backgroundColor = "#be2e22"
  }
  if (model._index.value === "Y2") {
    backgroundColor = "#8db600"
  }
  if (model._index.value === "N") {
    backgroundColor = "#00aaff"
  }
  if (model._index.value === "CN") {
    backgroundColor = "#d3d3d3"
  }

  return `<div style="border-radius: 20px; margin: 0 auto; background-color:${backgroundColor};width: 15px;height: 15px;"></div>`
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  } 
  else if (btn.id === "btnWritePermission") {
    if (userStore.authGrpCd.includes("HIWAYGRP00001") || userStore.authGrpCd.includes("GRP00504") ){
      safba00101_n.value.openPopup("", "") 
    }
    else{
      safba00101.value.openPopup("", "")
    }

  }
  else if (btn.id === "btnWritePermissionS") {
    if (userStore.authGrpCd.includes("HIWAYGRP00001") || userStore.authGrpCd.includes("GRP00504") ){
      safba00101_s.value.openPopup("", "") 
    }
    else{
      safba00101.value.openPopup("", "")
    }
  }
  else if (btn.id === "btnDeletePermission") {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(deleteDataChek)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  } else if (btn.id === "btnPrintCheck") {
    let checkedRow = grdMain.value.getGridView().getCheckedRows()
    if (checkedRow.length === 0) {
      Message.warn(t("선택된 데이터가 없습니다."))
      return
    }

    for (let i of checkedRow) {
      let rowData = grdMain.value.getDataProvider().getJsonRow(i)
      console.log(rowData.STATUS)
      if (rowData.STATUS != "50" && rowData.STATUS != "35") {
        Message.warn(t("진행상태가 승인완료 또는 안전 승인확정대기인 항목만 출력 할 수 있습니다"))
        return
      }
    }

    setPrint()
  } else if (btn.id === "btnPrintHandwriting") {
    setHandPrint()
  } else if (btn.id === "btnPOBA") {
    POBA()
  } else if (btn.id === "btnIndividualPermit") {
    IndividualPermit()
  } else if (btn.id === "btnApproveCancel") {
    ApproveCancel()
  } else if (btn.id === "btnApplication") {
    Application()
  } else if (btn.id === "btnTurnBack") {
    TurnBack()
  }
} 

/* ---------- 조회 ---------- */
const searchData = () => {
  let searchPam = {}

  if (searchParams.CHECK == "N") {
    if (useLogsStore().isMenuAdmin === "N") {
      vm.$nextTick(() => {
        menuTitle.value.setBtnProperty("btnPOBA", "visible", false)
        menuTitle.value.setBtnProperty("btnIndividualPermit", "visible", true)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
      })
    } else {
      menuTitle.value.setBtnProperty("btnPOBA", "visible", true)
      menuTitle.value.setBtnProperty("btnIndividualPermit", "visible", true)
      menuTitle.value.setBtnProperty("btnApproveCancel", "visible", true)
      menuTitle.value.setBtnProperty("btnTurnBack", "visible", true)
    }
  } else {
    vm.$nextTick(() => {
      menuTitle.value.setBtnProperty("btnPOBA", "visible", true)
      menuTitle.value.setBtnProperty("btnIndividualPermit", "visible", true)
      menuTitle.value.setBtnProperty("btnApproveCancel", "visible", true)
      menuTitle.value.setBtnProperty("btnTurnBack", "visible", true)
    })
  }

  for (let i in searchParams) {
    searchPam[i] = searchParams[i]
  }
  searchPam.WORK_NO = searchPam.WORK_NO === "전체" ? "" : searchPam.WORK_NO
  searchPam.WORK_FROM = searchPam.WORK_FROM.replace(/-/g, "")
  searchPam.WORK_TO = searchPam.WORK_TO.replace(/-/g, "")

  return commonSearchApi({
    queryId: "SAFBA0010_search01",
    param: searchPam,
  })
}

const afterSearch = async (res) => {
  if (searchParams.CHECK == "Y"){
    for (let i in res.ORESULT_CUR) {
      //PARA_CHK_YN 의 값은 PARA_CHK_YN 필드의 값과 작업시작일과 Today 값을 비교한 결과를 가져온다.
      //즉, 작업 시작일이 Today 이전이면 'N' 값을 가져온다.
      //END_YN 의 값은 작업종결(STATUS='50') 일 경우 'Y' 를 가져온다.
      if (res.ORESULT_CUR[i].PARA_CHK_YN === "N") {
        res.ORESULT_CUR[i].WRKCHK = "CN"
        continue
      } // 구분 1추가하고
      res.ORESULT_CUR[i].GBN = 1
      // 조회하고
      await commonSearchApi({
        queryId: "SAFBA0010_search02",
        param: res.ORESULT_CUR[i],
      }).then((resSub) => {
        // console.log(resSub, "ddd")
        // 조회값넣고
        res.ORESULT_CUR[i].WRKCHK = resSub.ORESULT_CUR[0].WRKCHK
      })
    }
  }

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)



  grdMain.value.getGridView().groupBy(["RCV_NO"]) //BSNS_NM 기준으로 그룹핑
  grdMain.value.getGridView().setRowGroup({
    expandedAdornments: "footer",
    collapsedAdornments: "footer",
    mergeExpanderVisibility: "none",
    indentVisible: false,
  })

  // 작업취소 색깔변경 
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = {}
      var clnmnm = dataCell.dataColumn.fieldName

      if( clnmnm === 'WORK_DT' || clnmnm === 'WORK_TIME' || clnmnm === 'PLANNING'){
        
        var canceledYn = grid.getValue(dataCell.index.itemIndex, "CANCELED_YN")

        if ( canceledYn === "Y") {
          ret.style = { background: "#dbdbdb" } 
        } else if  ( canceledYn === "N") {
          ret.style = { background: "transparent" } 
        }
      }

      // else if( clnmnm === 'STATUS_NM'){

      //   var status = grid.getValue(dataCell.index.itemIndex, "STATUS")
      //   console.log('dataCell.value', status)
      //   if ( status === "50") {
      //     ret.style = { background: "#D7E4BD" } 
      //   } else {
      //     ret.style = { background: "transparent" } 
      //   }
      // }

      return ret
    })





    
}

// 삭제 로직

const deleteDataChek = () => {
  let checkedRow = grdMain.value.getGridView().getCheckedRows()
  if (checkedRow.length === 0) {
    Message.warn(t("선택된 데이터가 없습니다."))
    return false
  }
  for (let i of checkedRow) {
    let rowData = grdMain.value.getDataProvider().getJsonRow(i)
    if (rowData.STATUS != "20") {
      Message.warn(t("진행상태가 [작성중(사내)]인 항목만 삭제 할 수 있습니다"))
      return false
    }
  }

  return true
}

const deleteData = async () => {
  let checkedRow = await grdMain.value.getGridView().getCheckedRows()
  let param = []

  await checkedRow.forEach(async (item) => {
    let data = await grdMain.value.getDataProvider().getJsonRow(item)

    param.push(data)
  })

  return commonExecuteApi({ queryId: "SAFBA0010_delete01", list: param })
}
// 그리드 이벤트
const onCellDblClicked = (grd, data) => {
  if (data.column === "PLANNING") {
    return
  }

  if (data.cellType === "data") {
    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
   
    if (userStore.authGrpCd.includes("HIWAYGRP00001") || userStore.authGrpCd.includes("GRP00504") ){
      if (innerData.SHORT_WORK_NO){
        safba00101_s.value.openPopup(innerData.CMPNY_DIV, innerData.RCV_NO)
      }
      else{
        safba00101_n.value.openPopup(innerData.CMPNY_DIV, innerData.RCV_NO)
      }
    }
    else{
      safba00101.value.openPopup(innerData)
    } 
  }
}

const onCellClicked = (grid, clickData) => {

   console.log(clickData, "clickData")

   if (clickData.cellType === "data" && clickData.column === "PARA_YN") {
    let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    wrkChk.value.openPopup(data)
  }


  if (clickData.cellType === "data" && clickData.column === "WRKCHK") {
    let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    wrkChk.value.openPopup(data)
  }



  if (clickData.cellType === "data" && clickData.column === "PLANNING") {

      // return
      let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  
      if (data.CANCELED_YN === 'Y'){
        return
      } else {
        plannPopup.value.openPopup(data) 
      }
  
  }

}



const upData = () => {
  console.log("upData")
  onButtonsClick({ id: "btnSearch" })
}



// 프린트
const setPrint = async() => {
  let checkRows = grdMain.value.getGridView().getCheckedRows()
  let dataRort = []
  let urlArr =''
  params.value = []
  reportName.value = []
  let cnt = -1
  let visible = ""
  let THREECHECKYN = ""
  for (let rowIdx of checkRows) {

    cnt++
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    /* await commonRequest(
      '/hse/slm/',
      {
        orgLinkUrl: getQDomain() + `/#/ptw_qr?RCV_NO=${data.RCV_NO}&SHORT_WORK_NO=`,
        shortLinkUrl: getQDomain(),
      },
      "post", // HTTP 메서드
      "application/json;charset=utf8", // Content-Type
      { apiVersion: "1.0.0" } // meta 정보
    ).then(res => {
      console.log('res2 : ', res.body) */
      //urlArr =   res.body
      urlArr = getQDomain() + `/#/ptw_qr?RCV_NO=${data.RCV_NO}&SHORT_WORK_NO=`
      // 이후 만들어진 단축 URL을 가지고 QR 리포트 생성 호출
      // searchParams.TAREA = JSON.stringify(res)
   
      console.log(urlArr,'dmdkdddk')
      console.log(data,'data')
      console.log(cnt)
    

      if(data.DANG_DIV_CD === "Z00"){
        // PSM 출력
        let sP_WRK_ID = data.P_WRK_ID

        data.CF_DIV === "F" ? (visible = "Y") : (visible = "N")
        let sCF_DIV_NM = data.CF_DIV === "C" ? `[전산허가]` : data.CF_DIV === "F" ? `[안전대면허가]` : `[안전현장허가]`
        
        dataRort = [
          "CF_DIV_NM=" + sCF_DIV_NM,
          "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
            ? "병행"
            : "",
          "IN_CMPNY_DIV=" + data.CMPNY_DIV,
          "IN_RCV_NO=" + data.RCV_NO,          
          "QR=" + urlArr,
          "visible=" + visible,
        ]

        reportName.value = "/manage/hse/" + sP_WRK_ID + ".ozr"

      }
      else{
        //   // 99 공통 01 내업 36외업 
        //   console.log(data.BSNS_CD , data.CF_DIV,data.WRK_PLC)
        if (
          data.JOB_BSNS_CD === "AC00" ||
          data.JOB_BSNS_CD === "AQ00" ||
          data.JOB_BSNS_CD === "AE00"
        ) {
          // 건설공사 출력양식 수정 
          // 대면허가
          if (data.WRK_DIV === "B" && data.CF_DIV === "F") {
            data.CF_DIV === "F" ? (visible = "Y") : (visible = "N")
            let sCF_DIV_NM = data.CF_DIV === "F" ? `[안전대면허가]` : `[안전현장허가]`

            dataRort = [
              "CF_DIV_NM=" + sCF_DIV_NM,
              "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                ? "병행"
                : "",
              "IN_CMPNY_DIV=" + data.CMPNY_DIV,
              "IN_RCV_NO=" + data.RCV_NO,
              "IN_THREECHECKYN" + THREECHECKYN,
              "QR=" + urlArr,
              "visible=" + visible,
            ]
            reportName.value = "/manage/hse/RETA3017C.ozr"

          // 현장
          } else if (data.WRK_DIV === "B" && data.CF_DIV === "S") {
            data.CF_DIV === "F" ? (visible = "Y") : (visible = "N")
            let sCF_DIV_NM = data.CF_DIV === "F" ? `[안전대면허가]` : `[안전현장허가]`

            dataRort = [
              "CF_DIV_NM=" + sCF_DIV_NM,
              "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                ? "병행"
                : "",
              "IN_CMPNY_DIV=" + data.CMPNY_DIV,
              "IN_RCV_NO=" + data.RCV_NO,
              "IN_THREECHECKYN" + THREECHECKYN,
              "QR=" + urlArr,
              "visible=" + visible,
            ]
            reportName.value = "/manage/hse/RETA3014C.ozr"
            

          // 전산허가  
          } else if (data.WRK_DIV === "B" && data.CF_DIV === "C") {
            data.CF_DIV === "F" ? (visible = "Y") : (visible = "N")

            dataRort = [
              "CF_DIV_NM=" + `[전산허가]`,
              "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                ? "병행"
                : "",
              "IN_CMPNY_DIV=" + data.CMPNY_DIV,
              "IN_RCV_NO=" + data.RCV_NO,
              "IN_THREECHECKYN" + THREECHECKYN,
              "QR=" + urlArr,
              "visible=" + visible,
            ]
            reportName.value = "/manage/hse/RETA3015C.ozr"
          }
          else if(data.JOB_LPLC === "B"){
            if (data.CF_DIV === "F") {
              reportName.value = "/manage/hse/RETA3011_04C_v2.ozr"
              dataRort = [
                "CF_DIV_NM=" + `[안전대면허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }
            if (data.CF_DIV === "S") {
              reportName.value = "/manage/hse/RETA3011_06C_v2.ozr"
              dataRort = [
                "CF_DIV_NM=" + `[안전현장허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }
            if (data.CF_DIV === "C") {
              reportName.value = "/manage/hse/RETA3011_05C_v2.ozr"
              dataRort = [
                "CF_DIV_NM=" + `[전산허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }
          }
          else {
            //F 대면 C 전산 S 현장
            if (data.CF_DIV === "F") {
              reportName.value = "/manage/hse/RETA3011C.ozr"
              dataRort = [
                "CF_DIV_NM=" + `[안전대면허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }
            if (data.CF_DIV === "S") {
              reportName.value = "/manage/hse/RETA3013C.ozr"
              dataRort = [
                "CF_DIV_NM=" + `[안전현장허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }
            if (data.CF_DIV === "C") {
              reportName.value = "/manage/hse/RETA3012C.ozr"
              dataRort = [
                "CF_DIV_NM=" + `[전산허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }
          } 
        } else {
          // 대면허가
          if (data.WRK_DIV === "B" && data.CF_DIV === "F"
              && data.DANG_DIV_CD !== "E03"
          ) {
            data.CF_DIV === "F" ? (visible = "Y") : (visible = "N")
            let sCF_DIV_NM = data.CF_DIV === "F" ? `[안전대면허가]` : `[안전현장허가]`

            dataRort = [
              "CF_DIV_NM=" + sCF_DIV_NM,
              "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                ? "병행"
                : "",
              "IN_CMPNY_DIV=" + data.CMPNY_DIV,
              "IN_RCV_NO=" + data.RCV_NO,
              "QR=" + urlArr,
              "visible=" + visible,
            ]
            reportName.value = "/manage/hse/RETA3017C_B.ozr"
          
          // 현장허가
          } else if(data.WRK_DIV === "B" && data.CF_DIV === "S"
              && data.DANG_DIV_CD !== "E03") {

            data.CF_DIV === "F" ? (visible = "Y") : (visible = "N")
            let sCF_DIV_NM = data.CF_DIV === "F" ? `[안전대면허가]` : `[안전현장허가]`

            dataRort = [
              "CF_DIV_NM=" + sCF_DIV_NM,
              "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                ? "병행"
                : "",
              "IN_CMPNY_DIV=" + data.CMPNY_DIV,
              "IN_RCV_NO=" + data.RCV_NO,
              "QR=" + urlArr,
              "visible=" + visible,
            ]
            reportName.value = "/manage/hse/RETA3014C_B.ozr"
        
          // 전산허가
          }else if (data.WRK_DIV === "B" && data.CF_DIV === "C"
              && data.DANG_DIV_CD !== "E03") {
            data.CF_DIV === "F" ? (visible = "Y") : (visible = "N")

            dataRort = [
              "CF_DIV_NM=" + `[전산허가]`,
              "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                ? "병행"
                : "",
              "IN_CMPNY_DIV=" + data.CMPNY_DIV,
              "IN_RCV_NO=" + data.RCV_NO,
              "QR=" + urlArr,
              "visible=" + visible,
            ]
            reportName.value = "/manage/hse/RETA3015C_B.ozr"
          }
          else if (data.DANG_DIV_CD === "E03") { 

            if (data.CF_DIV === "F") {
            reportName.value = "/manage/hse/RETA3016C.ozr"
            dataRort = [
                "CF_DIV_NM=" + `[안전대면허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }

          } else {

            if (data.CF_DIV === "F") {
              reportName.value = "/manage/hse/RETA3011C_B.ozr"
              dataRort = [
                "CF_DIV_NM=" + `[안전대면허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }
            if (data.CF_DIV === "S") {
              reportName.value = "/manage/hse/RETA3013C_B.ozr"
              dataRort = [
                "CF_DIV_NM=" + `[안전현장허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }
            if (data.CF_DIV === "C") {
              reportName.value = "/manage/hse/RETA3012C_B.ozr"
              dataRort = [
                "CF_DIV_NM=" + `[전산허가]`,
                "WRKCHK=" + data.WRKCHK === "Y1" || data.WRKCHK === "Y2"
                  ? "병행"
                  : "",
                "IN_CMPNY_DIV=" + data.CMPNY_DIV,
                "IN_RCV_NO=" + data.RCV_NO,
                "QR=" + urlArr,
              ]
            }
          }

        }
     }



      params.value.push({ reportName: reportName.value, args: dataRort })
  //})
    // params.value.param.push(reportName.value)
  }
  console.log("setprint", params.value)

  isMulti.value = true

  showOz.value = true
}

const itemProps = (item) => {
  return {
    title: item.WORK_NO,
    subtitle: item.SHIP_KIND_NM,
  }
}
const setHandPrint = () => {
  // NAS:\HSE\XX08\sample\ZIP\SAFB
  let params = {
    FILE_PATH: "SAFB",
    PATH:"ZIP",
    FILE_NAME: "위험작업허가서(PTW)서식_수기작성용.zip",
  }
  commonSampleDownFilesApi(params)
}

const beforeCheck = async(data) => {
  // console.log(data, "gggg")
  const nowDt = dayjs() // 현재 날짜
  const WorkDay = dayjs(data.WORK_DT) // 작업 날짜



  // //  병행 여부 체크 
  // let oresult = await commonSearchApi({queryId: "SAFBA0010_SEARCH_15", param: { CMPNY_DIV: data.CMPNY_DIV ,  RCV_NO: data.RCV_NO }})
  // if (oresult.ORESULT_CUR.length > 0) {
  //   Message.warn(`병행작업이`)
  //     return false
  // }



  if (useLogsStore().isMenuAdmin !== "Y") {
    if ((userStore.empNo !== data.MNGR_EMP_NO) & (userStore.empNo.substring(0,4) != userStore.DEPT_CD)) {
      Message.warn(`승인자만 승인 할수 있습니다.`)
      return false
    }
  }

  if (data.STATUS !== "25" && data.STATUS !== "41" && data.STATUS !== "35") {
    Message.warn(
      `허가 번호 : ${data.RCV_NO}의 진행상태가  승인대기 / 승인취소 일때만 승인 가능합니다.`
    )
    return false
  }
  // 내업인 경우 작업일시 확인
  if (!data.SHORT_WORK_NO &&  (data.URGENT_YN === 'N') ) {
    if (data.WRK_PLC === "01") {
      if (data.JOB_BSNS_CD === "AK00") {
        if (nowDt.hour() >= 15 && nowDt.add(1, "day").isSame(WorkDay, "day")) {
          Message.warn(
            "내업작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
          )
          return false
        }
      } else {
        if (nowDt.hour() >= 15 && nowDt.add(1, "day").isSame(WorkDay, "day")) {
          Message.warn(
            "내업작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
          )
          return false
        }
      }
    } else {
      if (data.DN_DIV === "D") {
        if (data.JOB_BSNS_CD === "AK00") {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "주간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return false
          }
        } else {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "주간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return false
          }
        }
      } else {
        if (nowDt.hour() >= 15 && nowDt.add(1, "day").isSame(WorkDay, "day")) {
          Message.warn(
            "야간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
          )
          return false
        }
      }
    }

    // 작업일이 내일인 경우
    if (nowDt.add(1, "day").isSame(WorkDay, "day")) {
      if (data.WRK_PLC === "01") {
        if (data.JOB_BSNS_CD === "AK00") {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "내업작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return false
          }
        } else {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "내업작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return false
          }
        }
      } else {
        if (data.DN_DIV === "D") {
          if (data.JOB_BSNS_CD === "AK00") {
            if (
              nowDt.hour() >= 15 &&
              nowDt.add(1, "day").isSame(WorkDay, "day")
            ) {
              Message.warn(
                "주간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
              )
              return false
            }
          } else {
            if (
              nowDt.hour() >= 15 &&
              nowDt.add(1, "day").isSame(WorkDay, "day")
            ) {
              Message.warn(
                "주간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
              )
              return false
            }
          }
        } else {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "야간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return false
          }
        }
      }
    }

    // 내업인 경우 위험작업 허가신청 마감시간 확인
    if (data.WRK_PLC === "01") {
      if (data.JOB_BSNS_CD === "AK00") {
        if (nowDt.hour() > 15 && nowDt.add(1, "day").isAfter(WorkDay, "day")) {
          Message.warn(
            "내업 위험작업 허가신청 마감시간은 작업 전일 15:00까지 입니다."
          )
          return false
        }
      } else {
        if (nowDt.hour() > 15 && nowDt.add(1, "day").isAfter(WorkDay, "day")) {
          Message.warn(
            "내업 위험작업 허가신청 마감시간은 작업 전일 15:00까지 입니다."
          )
          return false
        }
      }
    }

    // 과거일자가 포함된 공사인 경우
    if (nowDt.isAfter(WorkDay, "day")) {
      Message.warn("과거일자가 포함된 공사는 승인할 수 없습니다.")
      return
    }
    if (userStore.empNo !== data.MNGR_EMP_NO) {
      if (data.STATUS !== "25" && data.STATUS !== "41") {
        Message.warn("승인대기 / 승인취소 일때만 승인 가능합니다.")
        return false
      }
    }
  }

  return true
}

const POBA = () => {
  let rows = grdMain.value.getDataProvider().getJsonRows()
  let saveParams = []

  if (rows.length === 0) {
    return Message.warn("조회 후 이용하십시오.")
  }
  vm.$swal({
    title: t("일괄 승인 하시겠습니까? "),
    showCancelButton: true,
  }).then(async(swalRes) => {
    if (swalRes.isConfirmed === true) {
      for (let i of rows) {
        if (i.STATUS == "25" || i.STATUS == "41") {
          if (!beforeCheck(i)) {
            return
          }

          //  병행 여부 체크 
          let cross_yn =  ''
          let oresult = await commonSearchApi({queryId: "SAFBA0010_SEARCH_15", param: { CMPNY_DIV: i.CMPNY_DIV ,  RCV_NO: i.RCV_NO }})
          if (oresult.ORESULT_CUR.length > 0) {
              cross_yn = 'Y'
            }

          // 긴급 신청 여부는 신청 때부터 가져옴
          let urgetn_yn  =  i.URGENT_YN

          if (urgetn_yn === 'Y' || cross_yn === 'Y'){
            return
          }
        }
        if (i.WRKCHK !== "Y1" && (i.STATUS == "25" || i.STATUS == "41")) {
          saveParams.push(i)
        }
      }

      if (saveParams.length === 0) {
        return Message.warn("일괄 허가할수있는 데이터가 없습니다.")
      }
      commonExecuteApi({ queryId: "SAFBA0010_SAVE_06", list: saveParams }).then(
        (res) => {
          if (res.list[0].RES_COD == '-200'){
            Message.warn(res.list[0].RES_MSG)
          }
          else{
            onButtonsClick({ id: "btnSearch" })
            Message.warn("일괄 허가되었습니다.")
          }



        }
      )
    }
  })
}
const IndividualPermit = () => {
  let checkedRow = grdMain.value.getGridView().getCheckedRows()
  let saveParams = []
  if (checkedRow.length === 0) {
    Message.warn(t("선택된 데이터가 없습니다."))
    return false
  }
  if (checkedRow.length > 1) {
    Message.warn(t("개별승인는 한 개씩 진행해주세요"))
    return false
  }

  let rowData =  grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCheckedRows()[0])
  
  if (rowData.MNGR_EMP_NO != userStore.empNo){
    Message.warn(t("개별승인는 관리감독자만 가능합니다."))
    return false
  }

  vm.$swal({
    title: t(`개별승인 하시겠습니까? </div>`),
    showCancelButton: true,
  }).then(async(swalRes) => {
    if (swalRes.isConfirmed === true) {
      
      let flag = await beforeCheck(rowData)
      if (!flag) {
        return
      } else {
        saveParams.push(rowData)
      }

      let cross_yn =  ''
      // 긴급 신청 여부는 신청 때부터 가져옴
      let urgetn_yn  =  rowData.URGENT_YN
      //  병행 여부 체크 
      let oresult = await commonSearchApi({queryId: "SAFBA0010_SEARCH_15", param: { CMPNY_DIV: rowData.CMPNY_DIV ,  RCV_NO: rowData.RCV_NO }})
      if (oresult.ORESULT_CUR.length > 0) {
        cross_yn = 'Y'
      }

      // 병행작업 또는 긴급작업의 경우 안전승인 절차
      if ( cross_yn === 'Y' || urgetn_yn === 'Y'){
        SafeAppPop.value.openPopup(cross_yn, urgetn_yn, rowData.CMPNY_DIV, rowData.RCV_NO)}

      else{
        commonExecuteApi({ queryId: "SAFBA0010_SAVE_06", list: saveParams }).then(
          (res) => {
            if (res.list[0].RES_COD == '-200'){
              Message.warn(res.list[0].RES_MSG)
            }
            else{
              onButtonsClick({ id: "btnSearch" })
              Message.warn("허가되었습니다.")
            }


        })}
    }

  })
}

const ApproveCancel = () => {
  let checkedRow = grdMain.value.getGridView().getCheckedRows()
  let saveParams = []
  if (checkedRow.length === 0) {
    Message.warn(t("선택된 데이터가 없습니다."))
    return false
  }
  vm.$swal({
    title: t("승인취소를 하시겠습니까?"),
    showCancelButton: true,
  }).then((swalRes) => {




    if (swalRes.isConfirmed === true) {
      for (let i of checkedRow) {
        let rowData = grdMain.value.getDataProvider().getJsonRow(i)
        rowData.GBN = "3"

        if (rowData.STATUS !== "50") {
          Message.warn("승인완료 일때만 승인취소 가능합니다.")
          return
        }
        if (useLogsStore().isMenuAdmin !== "Y") {
          if ((userStore.empNo !== rowData.MNGR_EMP_NO) & (userStore.empNo.substring(0,4) != userStore.DEPT_CD)) {
            Message.warn("승인자만 승인취소 가능합니다.")
            return
          }
        } else {
          saveParams.push(rowData)
        }
      }
      commonExecuteApi({
        queryId: "SAFBA0010_DELETE05",
        list: saveParams,
      }).then((res) => {

        console.log('delete res', res)

        if (res.list[0].RES_COD === '-100'){
          Message.warn("작업 시작일이 금일 또는 금일 이전인 허가서는 승인 취소가 불가능합니다. ")
          return
        }


        onButtonsClick({ id: "btnSearch" })
        Message.warn("승인취소 되었습니다.")
      })
    }
  })
}

const TurnBack = () => {
  let checkedRow = grdMain.value.getGridView().getCheckedRows()
  let saveParams = []
  if (checkedRow.length === 0) {
    Message.warn(t("선택된 데이터가 없습니다."))
    return false
  }
  vm.$swal({
    title: t("허가서 신청을 반려하시겠습니까?"),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      for (let i of checkedRow) {
        let rowData = grdMain.value.getDataProvider().getJsonRow(i)
        rowData.GBN = "1"
        if (rowData.STATUS !== "25") {
          Message.warn("승인대기 일때만 반려 가능합니다.")
          return
        } else {
          saveParams.push(rowData)
        }
      }
      commonExecuteApi({
        queryId: "SAFBA0010_DELETE05",
        list: saveParams,
      }).then((res) => {
        onButtonsClick({ id: "btnSearch" })
        Message.warn("반려 하였습니다.")
      })
    }
  })
}
const openEmpPopup = (gbn) => {
  if (gbn === "작업") {
    gbnEmp.value = "job"
    empPopup.value.openPopup({ EMP_NM: searchParams.RESP_EMP_NM })
  }
  if (gbn === "관리자") {
    gbnEmp.value = "gwan"
    empPopup.value.openPopup({ EMP_NM: searchParams.MNGR_EMP_NM })
  }
  if (gbn === "공사담당자") {
    gbnEmp.value = "req"
    empPopup.value.openPopup({ EMP_NM: searchParams.REQ_EMP_NM })
  }
}
const onEmpSelected = (row) => {
  console.log(row)
  console.log(gbnEmp.value,'dddd')
  if (gbnEmp.value === "job") {
    searchParams.RESP_EMP_NM = row.EMP_NM
    searchParams.RESP_EMP_NO = row.EMP_NO
  }
  if (gbnEmp.value === "gwan") {
    searchParams.MNGR_EMP_NM = row.EMP_NM
    searchParams.MNGR_EMP_NO = row.EMP_NO
  }
  if (gbnEmp.value === "req") {
    searchParams.REQ_EMP_NM = row.EMP_NM
    searchParams.REQ_EMP_NO = row.EMP_NO
  }
}


watch(()=>searchParams.RESP_EMP_NM,(newValue)=>{
  if(!newValue){
    searchParams.RESP_EMP_NO =''
  }

})
watch(()=>searchParams.MNGR_EMP_NO,(newValue)=>{
  if(!newValue){
    searchParams.MNGR_EMP_NO =''
  }

})
const clearable =(e)=>{
  if(e ==='책임자'){
    searchParams.RESP_EMP_NM = ''
    searchParams.RESP_EMP_NO = ''
  }
  else {
    searchParams.MNGR_EMP_NM = ''
    searchParams.MNGR_EMP_NO = ''
  }
  console.log('ddjdj')
}

const chkCHECK_change =()=>{
  // console.log(isDivVisible.value)  
  isDivVisible.value = !isDivVisible.value;
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnPOBA',
          'btnIndividualPermit',
          'btnApproveCancel',
          'btnTurnBack',
          'btnSearch',
          'btnWritePermission',
          'btnWritePermissionS', // 단기공사
          'btnDeletePermission',
          'btnPrintCheck',
          'btnPrintHandwriting',
        ]"
        @click-button="onButtonsClick"
      />
      <!-- 'btnReqCancel', -->
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex" style="align-items: center">
            <i-input
              :label="$t('작업일')"
              v-model="searchParams.WORK_FROM"
              type="Date"
              width="195px"
              margin="10px"
              required
            />
            <i-input
              :label="$t('-')"
              v-model="searchParams.WORK_TO"
              type="Date"
              width="160px"
              margin="10px"
            />

            <i-select
              :label="$t('사업부')"
              width="270px"
              margin="10px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              :disabled="useLogsStore().isMenuAdmin === 'Y' ? false : isAdmin"
            />
            <i-select
              :label="$t('부서')"
              width="300px"
              margin="10px"
              placeholder="부서"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :disabled="useLogsStore().isMenuAdmin === 'Y' ? false : isAdmin"
            />
  
            <div
              class="d-flex align-center"
              style="width: 280px; margin-right: 10px"
            >
              <p class="mr-2">{{ $t("호선/공사") }}</p>
              <v-select
                v-model="searchParams.WORK_NO"
                :items="codeList.WorkNo"
                item-value="WORK_NO"
                :item-props="itemProps"
              />
            </div>
            
          <div>
            
            <div class="d-flex">
                <!-- <div
                  class="d-flex align-center"
                  style="width: 97px; margin-right: 10px"
                >
                  <v-checkbox
                    v-model="searchParams.GBN"
                    true-value="1"
                    false-value="2"
                    :label="t('단기공사포함')"
                  />
                </div> -->
    
                <div
                  class="d-flex align-center"
                  style="width: 120px; margin-right: 10px"
                >
                  <v-checkbox
                    v-model="searchParams.CHECK"
                    true-value="Y"
                    false-value="N"
                    :label="t('승인 필요대상 건')"
                    
                    @change="chkCHECK_change"
                    />
                </div>
            </div>
              <span
    
              style="font-size :14px; color:#1a40c7"> 
                *승인자는 ‘승인 필요대상 건’ 선택/조회 시 승인 버튼이 활성화 됩니다.
              </span>
            </div>
     
            </div>



          <div class="d-flex mt-3">
             <!-- <div
              class="d-flex align-center"
              style="width: 120px; margin-right: 10px"
            >
              <v-checkbox
                v-model="searchParams.ASGN_CD"
                :true-value="userStore.asgnCd"
                false-value=""
                :label="t('내 조직만 검색')"
                />
              </div> -->
            <i-select
              :label="$t('진행상태')"
              width="235px"
              margin="10px"
              placeholder="사업부"
              v-model="searchParams.STATUS"
              :items="codeList.STATUS"
              item-value="COD"
              item-title="TXT"
            />

            <i-input
              :label="$t('작업책임자')"
              width="205px"
              margin="10px"
              placeholder="책임자"
              v-model="searchParams.RESP_EMP_NM"
              @keydown.enter="
                  (e) => {
                    openEmpPopup('작업')
                  }
                "
                @click:appendInner="openEmpPopup('작업')"
                append-inner-icon="mdi-magnify"
                clearable
            @click:clearable="clearable('책임자')"
            />

            <i-input
              :label="$t('관리감독자')"
              width="205px"
              margin="10px"
              placeholder="관리감독자"
              v-model="searchParams.MNGR_EMP_NM"
              @keydown.enter="
                  (e) => {
                    openEmpPopup('관리자')
                  }
                "
                @click:appendInner="openEmpPopup('관리자')"
                append-inner-icon="mdi-magnify"
                clearable
            @click:clearable="clearable('관리자')"
            />


            <i-select
              :label="$t('단기공사여부')"
              width="300px"
              margin="10px"
              v-model="searchParams.GBN"
              :items="codeList.DAN_DIV"
              item-value="COD"
              item-title="TXT"
            />

            <i-input
              :label="$t('공사담당자')"
              width="205px"
              margin="10px"
              placeholder="공사담당자"
              :disabled="searchParams.GBN === '3' ? false : true"
              v-model="searchParams.REQ_EMP_NM"
              @keydown.enter="
                  (e) => {
                    openEmpPopup('공사담당자')
                  }
                "
                @click:appendInner="openEmpPopup('공사담당자')"
                append-inner-icon="mdi-magnify"
                clearable
            @click:clearable="clearable('공사담당자')"
            />



          </div>
        </v-sheet>

        <div class="d-flex align-center mb-3" v-if="isDivVisible">
          병행작업확인 범례
          <div class="boxBumRel">
            <div class="cricleBumRel" style="background-color: #d3d3d3" />
            병행확인불필요
          </div>
          <div class="boxBumRel">
            <div class="cricleBumRel" style="background-color: #00aaff" />
            일반작업(화기/도장)
          </div>
          <div class="boxBumRel">
            <div class="cricleBumRel" style="background-color: #be2e22" />
            병행작업
          </div>
          <div class="boxBumRel">
            <div class="cricleBumRel" style="background-color: #8db600" />
            병행작업(승인)
          </div>
        </div>
        <v-sheet class="h-auto">
          ※ 승인 취소된 건은 PTW 점검 대상으로 잡히지 않습니다. 
          
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SAFBA0010PopUp1 ref="safba00101" @upData="upData" />
  <SAFBA0010PopUp1_new ref="safba00101_n" @upData="upData" />
  <SAFBA0010PopUp1_shrt ref="safba00101_s" @upData="upData" />
  <!-- OZReport -->
  <OZReport
    :showPop="showOz"
    :MultiArr="params"
    :isMulti="(isMulti = true)"
    @close="showOz = $event"
    @falseMulti="isMulti = $event"
  />

   <!--담당자 팝업-->
   <EmpPopup ref="empPopup" @selected="onEmpSelected" />
   <SafeAppPopUp ref="SafeAppPop" @upData="upData" />
   <planningPopup ref="plannPopup" @upData="upData" />
   <WrkChkPopUp ref="wrkChk" />


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
.boxBumRel {
  padding: 6px;
  margin: 0px 2px;
  text-align: center;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.cricleBumRel {
  width: 15px;
  height: 15px;
  border-radius: 16px;
  margin-right: 4px;
}
.boxBumRel:first-child {
  margin-left: 10px;
}
</style>
