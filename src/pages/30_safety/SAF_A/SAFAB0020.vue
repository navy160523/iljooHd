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
import EmpPopup from '@/pages/30_safety/SAF_A/SAFAB0010EMP.vue'
import EmpPopup2 from '@/components/popup/EmpPopup.vue'
import DeptPopup from "@/components/popup/DeptPopup.vue"
import DeptPopup2 from "@/components/popup/DeptPopup.vue"
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
import SAFAB0010PopUp from "@/pages/30_safety/SAF_A/SAFAB0010AddPopUp.vue"

defineOptions({
  name: "30_safety-SAF_A-SAFAB0020",
})

// 작업표준 신규제정에서 팝업 호출시 (RSKBA0010)
const props = defineProps({
  dialog: "N",
  val1: "",
  half: "",
})

const emit = defineEmits(["close"])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const menuTitle2 = ref(null)
const { sliSAFAB0020 } = history.state
const grdMain = ref(null)
const grdDetail = ref(null)
const safab0010PopUp = ref(null)


// 팝업관련
const empPopup = ref(null)
const empPopup2 = ref(null)
const DelParma = reactive([])
const delparams = reactive([])
const deptPopup = ref(null)
const deptPopup2 = ref(null)
const MainPopOpen = ref(null)
const ManPopOpen = ref(null)
const disableSet = ref(true)
const disablebtns = ref(null)
const dateList = ref([
  { TEXT: '발생일자', VALUE: 'A' },
  { TEXT: 'SLI일자', VALUE: 'B' },
])
const deptList = ref([
  { TEXT: '재해조직', VALUE: 'A' },
  { TEXT: '책임조직', VALUE: 'B' },
  { TEXT: '재해+책임', VALUE: 'C' },
])

// sli 대시보드에서 파라미터 넘길때 watch에서 초기화 안되게 막기위한 변수
const watchFlag = ref(0)

const searchParams = reactive({
  DT_GBN: "1",
  OCCUR_FROM: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  OCCUR_TO: dayjs().format("YYYY-MM-DD"),
  // DEPT_CD: "",
  // BSNS_CD: "",
  INJR_DEPT_CD: '',
  DEPT_GBN: 'A',          // 부서 구분 A: 재해, B: 책임, C: 재해+책임
  CMPNY_DIV: userStore.cmpnyDiv,
  DEPT_CD: userStore.deptCd,
  BSNS_CD: '',
  ASGN_NM: ` ${userStore.bsnsNm} - ${userStore.deptNm}`,
  SAGOBURU: "",
  SAGO_PLAN_CHK: "",
  NM1:"",
  DATE_GBN: 'A',
  INJR_BSNS_CD: '',
  INJR_DEPT_CD: '',
  INJR_DEPT_NM: '',
  RESP_BSNS_CD: userStore.bsnsCd,
  RESP_DEPT_CD: userStore.deptCd,
  RESP_DEPT_NM: userStore.deptNm,
  ALL_BSNS_CD: '',
  ALL_DEPT_CD: '',
  ALL_DEPT_NM: '',
})

// 안전 직원 그룹
const isSafeUser = userStore.authGrpCd.includes('GRP00381')
const isadmin = userStore.authGrpCd.includes('SAFAA001')
// 부서 선택이 가능한 조건
const searchAuth = userStore.bsnsCd === 'AN00' || userStore.authGrpCd.includes('HIWAYGRP00001')
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
    { TXT: "산재(직영/협력사)", COD: "SJE" },
    { TXT: "경미공상(직영)", COD: "GMS" },
    { TXT: "휴업 3일 이상 사고(협력사)", COD: "HRS" },
    { TXT: "휴업 3일 미만 일반사고 (직영/협력사)", COD: "SNE" },
    { TXT: "미정", COD: "NON" },
  ],
})


const StatusDiv = ref([
    { TXT: "즉보작성 진행", COlOR: "#E6B9B8" },
    { TXT: "즉보작성 완료", COlOR: "#FCD5B5" },
    { TXT: "즉보안전확인 완료", COlOR: "#D7E4BD" },
    { TXT: "보고서 작성 완료", COlOR: "#FCD5B5" },
    { TXT: "보고서 안전확인 완료", COlOR: "#D7E4BD" },
    { TXT: "결재중", COlOR: "#45C4B0" },
    { TXT: "결재완료", COlOR: "#13678A" },
    { TXT: "종결", COlOR: "#B1B1B1" },
])

/*  공통코드 세팅 */
onMounted(() => {
  Promise.all([
    getCodeList("HHIB210"), //0
    getCodeList("HHIB330"), //1
    getCodeList("HHIB010"), //2
    getCodeList("HHIB070"), //3
    getCodeList("HHIB080"), //4
    getCodeList("HHIB040"), //5
    getCodeList("HHIB340"), //6
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: "N" },
    }),
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: userStore.bsnsCd },
    }),
    commonSearchApi({ queryId : 'searchASGN20', 
    param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: userStore.bsnsCd, USE_DIV: 'Y' } 
    }), // 부문
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

    grdMain.value.getGridView().filterPanel.visible = true 

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

    // console.log(disablebtns.value, "disablebtns")
    // disablebtns.value.disableBtn("btnSafetyDetailSearch", true)
    codeList.BSNS_CD = res[7].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.DEPT_CD = res[8].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
    codeList.asgn20Cd = res[9].ORESULT_CUR
    codeList.asgn20Cd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })

    codeList.RESP_BSNS_CD = res[7].ORESULT_CUR
    codeList.RESP_DEPT_CD = res[8].ORESULT_CUR
    codeList.RESP_asgn20Cd = res[9].ORESULT_CUR
    
    codeList.ALL_BSNS_CD = res[7].ORESULT_CUR
    codeList.ALL_DEPT_CD = res[8].ORESULT_CUR
    codeList.ALL_asgn20Cd = res[9].ORESULT_CUR

    console.log("isadmin", isadmin)
    console.log('안전소속 ?', isSafeUser)

    setDeptAble()

    if(sliSAFAB0020 != undefined) {
      // console.log('sliSAFAB0020', sliSAFAB0020)
      watchFlag.value++

      if(sliSAFAB0020.DATE_GBN != undefined) {
        searchParams.DATE_GBN = sliSAFAB0020.DATE_GBN
      }

      searchParams.DEPT_GBN = sliSAFAB0020.DEPT_GBN
      searchParams.OCCUR_FROM = sliSAFAB0020.FROM_DT
      searchParams.OCCUR_TO = sliSAFAB0020.TO_DT
      searchParams.RESP_BSNS_CD = sliSAFAB0020.BSNS_CD
      searchParams.RESP_ASGN20 = sliSAFAB0020.PART_CD
      searchParams.RESP_DEPT_CD = sliSAFAB0020.DEPT_CD
      // searchParams.RESP_DEPT_NM = sliSAFAB0020.DEPT_NM
      searchParams.SLICHECK = sliSAFAB0020.SLICHECK
      searchParams.JEWECHECK = sliSAFAB0020.JEWECHECK
      searchParams.JUNGDAECHECK = sliSAFAB0020.JUNGDAECHECK
      searchParams.COMECHECK = sliSAFAB0020.COMECHECK

      // console.log('searchParams', searchParams)

      onButtonsClick({ id: "btnSearch" })
    }
  })

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}

    let status = grid.getValue(item.index, 'APPROVAL_STATUS').replace(/ /gi, '')
    let chkYN = grid.getValue(item.index, 'SAGOJIYEON')

    if(chkYN === 'Y' && (status === '즉보작성진행' || status === '즉보작성완료' || status === '즉보안전확인완료')) {
      ret.style = { 'background-color': 'rgba(255, 204, 204, 0.5)' }
    }

    return ret
  })

  //  스타일 지정
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    ret.style = { background: '', color:'' }

    if(dataCell.dataColumn.fieldName === 'APPROVAL_STATUS') {
      if (dataCell.value == '즉보작성 진행') {
        ret.style = { background: '#E6B9B8' } // ret.style = {background:'#ffff00'} 직접 스타일 적용 가능
      } else if (dataCell.value == '즉보작성 완료') {
        ret.style = { background: '#FCD5B5', color:'#222' }
      } else if (dataCell.value == '즉보안전확인 완료') {
        ret.style = { background: '#D7E4BD', color:'#222' }
      } else if (dataCell.value == '보고서 작성 완료') {
        ret.style = { background: '#FCD5B5', color:'#222' }
      } else if (dataCell.value == '보고서 안전확인 완료') {
        ret.style = { background: '#D7E4BD', color:'#222' }
      } else if (dataCell.value == '결재 중') {
        ret.style = { background: '#45C4B0', color:'#222' }
      } else if (dataCell.value == '결재완료') {
        ret.style = { background: '#13678A', color:'#222' }
      } else if (dataCell.value == '결재 반려') {
        ret.style = { background: '#D1180B', color:'#fff' }
      } else if (dataCell.value == '종결') {
        ret.style = { background: '#B1B1B1', color:'#222' }
      }
    } else if(dataCell.dataColumn.fieldName === 'WIHEOM_STATUS') {
      if (dataCell.value == '평가미완료') {
        ret.style = { background: '#E6B9B8', color:'#222' }
      }
    }

    return ret
  })

  vm.$nextTick(()=>{
    // 작업표준 신규제정에서 팝업으로 호출시 -------------//
    if (props.dialog == "Y") {
      menuTitle.value.setBtnProperty("btnAdd", "visible", false)
      menuTitle.value.setBtnProperty("btnRegist", "visible", false)      
      menuTitle.value.setBtnProperty("btnDelete2", "visible", false)
      menuTitle.value.setBtnProperty("btnClose", "visible", true)
      menuTitle2.value.setBtnProperty("btnCreate", "visible", false)
      menuTitle2.value.setBtnProperty("btnDelete", "visible", false)

      searchParams.OCCUR_FROM = props.half.from
      searchParams.OCCUR_TO = props.half.to

      searchParams.DEPT_GBN = "C"
      searchParams.CMPNY_DIV = props.val1.COMPANY_CD
      searchParams.ALL_BSNS_CD = props.val1.BSNS_CD
      searchParams.ALL_DEPT_CD = props.val1.DEPT_CD
      searchParams.ASGN_NM = props.val1.DEPT_NM      

      onButtonsClick({ id: "btnSearch" })
    } else menuTitle.value.setBtnProperty("btnClose", "visible", false)
    //-------------------------------------------------//
  //   if(userStore.empNo === 'A524835'){
  //     menuTitle.value.setBtnProperty("btnDelete2", "visible", true)
  //   }
  //   else{
  //     menuTitle.value.setBtnProperty("btnDelete2", "visible", false)
  //   }
  })

})

//  팝업

// 부서선택팝업
const openPopup = (gbn) => {
  if (searchAuth){
    deptPopup.value.openPopup()
  }
  else{
    Message.warn(t("관리자만 변경 가능합니다."))
  }
}

const onDeptSelected = (val) => {
  searchParams.RESP_BSNS_CD = val.BSNS_CD
  searchParams.RESP_DEPT_CD = val.DEPT_CD
  searchParams.RESP_DEPT_NM = val.ASGN_FULL_NM
  console.log('dmndld')
}

// 부서선택팝업
const openPopup2 = (gbn) => {
  deptPopup2.value.openPopup()
}

const onDeptSelected2 = (val) => {
  searchParams.INJR_BSNS_CD = val.BSNS_CD
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.INJR_DEPT_CD = val.DEPT_CD
  searchParams.INJR_DEPT_NM = val.ASGN_FULL_NM
  console.log('dmndld')
}

const NOBSNS      = ref(false)
const NODEPT      = ref(false)
const NOASGN      = ref(false)
const respNOBSNS  = ref(false)
const respNODEPT  = ref(false)
const respNOASGN  = ref(false)
const allNOBSNS   = ref(false)
const allNODEPT   = ref(false)
const allNOASGN   = ref(false)

const setDeptAble = () => {
  NOBSNS.value     = true
  NODEPT.value     = true
  NOASGN.value     = true
  respNOBSNS.value = true
  respNODEPT.value = true
  respNOASGN.value = true
  allNOBSNS.value  = true
  allNODEPT.value  = true
  allNOASGN.value  = true

  NOBSNS.value     = false
  respNOBSNS.value = false
  respNODEPT.value = false
  respNOASGN.value = false
  allNOBSNS.value  = false

  // if (searchAuth){
  //   NOBSNS.value     = false
  //   respNOBSNS.value = false
  //   allNOBSNS.value  = false
  // }
}

// 2025.01.08 조회 조건 변경으로 주석 처리 
watch(
  () => searchParams.BSNS_CD,
  (newValue) => {
    if (!newValue) {
      NODEPT.value = true
      NOASGN.value = true
      searchParams.INJR_DEPT_CD = ""
      searchParams.INJR_ASGN20 = ''
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        // console.log(res, "res")
        searchParams.INJR_DEPT_CD = ""
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        NODEPT.value = false
      })

      commonSearchApi({ queryId : 'searchASGN20', 
        param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: newValue, USE_DIV: 'Y' }
      }).then((res)=>{
          searchParams.INJR_ASGN20 = ''
          if(res.ORESULT_CUR.length === 0){
            searchParams.INJR_ASGN20 = ''
            NOASGN.value = true
          }
          else{
            codeList.asgn20Cd = res.ORESULT_CUR
            codeList.asgn20Cd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
            NOASGN.value = false
          }

        })
    
      }
    })

  watch(
  () => searchParams.RESP_BSNS_CD,
  async (newValue) => {
    if (!newValue) {
      respNODEPT.value = true
      respNOASGN.value = true
      
      searchParams.RESP_DEPT_CD = ""
      searchParams.RESP_ASGN20 = ''
    } else {
      await commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        // console.log(res, "res")
        if(watchFlag.value === 0) {
          searchParams.RESP_DEPT_CD = ""
        }
        codeList.RESP_DEPT_CD = res.ORESULT_CUR
        codeList.RESP_DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        respNODEPT.value = false
      })

      await commonSearchApi({ queryId : 'searchASGN20', 
        param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: newValue, USE_DIV: 'Y' }
      }).then((res)=>{
        if(watchFlag.value === 0) {
          searchParams.RESP_ASGN20 = ''
        }

        if(res.ORESULT_CUR.length === 0){
          searchParams.RESP_ASGN20 = ''
          respNOASGN.value = true
        }
        else{
          codeList.RESP_asgn20Cd = res.ORESULT_CUR
          codeList.RESP_asgn20Cd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
          respNOASGN.value = false
        }
      })

      if(watchFlag.value > 0) {
        watchFlag.value = 0
      }
    }
})

watch(
  () => searchParams.ALL_BSNS_CD,
  (newValue) => {
    if (!newValue) {
      allNODEPT.value = true
      allNOASGN.value = true
      searchParams.ALL_DEPT_CD = ""
      searchParams.ALL_ASGN20 = ''
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        // console.log(res, "res")
        searchParams.ALL_DEPT_CD = ""
        codeList.ALL_DEPT_CD = res.ORESULT_CUR
        codeList.ALL_DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        allNODEPT.value = false
      })

      commonSearchApi({ queryId : 'searchASGN20', 
        param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: newValue, USE_DIV: 'Y' }
      }).then((res)=>{
          searchParams.ALL_ASGN20 = ''
          if(res.ORESULT_CUR.length === 0){
            searchParams.ALL_ASGN20 = ''
            allNOASGN.value = true
          }
          else{
            codeList.ALL_asgn20Cd = res.ORESULT_CUR
            codeList.ALL_asgn20Cd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
            allNOASGN.value = false
          }
        })
    }
})

//  버튼이밴트
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    disableSet.value = true
    console.log("searchAuth", searchAuth)
    console.log("searchParams", searchParams)

    // if(!searchAuth){
    //   if(!searchParams.INJR_DEPT_CD && !searchParams.RESP_DEPT_CD){
    //     return Message.warn(t("책임부서와 재해부서 중 하나는 선택해주세요."))
    //   }
    // }

    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  }
  if (btn.id === "btnCreate") {
    console.log(searchDetailParams.CMPNY_DIV, "sadsadasd")
    if (!searchDetailParams.CMPNY_DIV) {
      return Message.warn(t(" 저장되지않은 사고보고서는 추가하실수없습니다."))
    } else {
      ManPopOpen.value.openPopup(searchDetailParams)
    }
  }
  else if (btn.id === 'btnRegist'){
    safab0010PopUp.value.openPopup()
  }
  else if (btn.id === "btnDelete2") {
    new deleteFlowHelper(vm, t)
      .setBefore(DelMainChek)
      .setQuery(MainDelData)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run()
  }
  if (btn.id === "btnDelete") {
    console.log(searchDetailParams.CMPNY_DIV, "sadsadasd")
    if (!searchDetailParams.CMPNY_DIV) {
      return Message.warn(t(" 저장되지않은 사고보고서는 삭제하실수없습니다."))
    } else {
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdDetail, row: "check" }])
        .setGridList([grdDetail])
        .setBefore(DeltailChek)
        .setQuery(DeltailDelData)
        .setAfter(() => onButtonsClick({ id: "btnSearch" }))
        .run()
    }
  } else if (btn.id === "btnClose") {
    // 이 페이지가 팝업으로 띄워진 경우, 닫기 버튼을 눌러 종료
    emit("close", false)
  }
  // if (btn.id === "btnSafetyDetailSearch") {
  //   MainPopOpen.value.openPopup(searchDetailParams)
  // }
}

// watch(
//   () => disableSet.value,
//   (newValue) => {
//     if (newValue == true) {
//       disablebtns.value.disableBtn("btnSafetyDetailSearch", true)
//     }
//     if (newValue == false) {
//       disablebtns.value.disableBtn("btnSafetyDetailSearch", false)
//     }
//   }
// )

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
    if(i.INSERT_DATE){
      i.INSERT_DATE = dayjs(i.INSERT_DATE).format('YYYY-MM-DD')
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

// 더블클릭팝업
const onCellDblClickedMain = (grd, data) => {
  if (data.cellType === "data") {
    let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    MainPopOpen.value.openPopup(row)
  }
}
const onCellDblClickedDetail = (grd, data) => {
  if (data.cellType === "data") {
    let row = grdDetail.value.getDataProvider().getJsonRow(data.dataRow)
    ManPopOpen.value.openPopup(row, true, true)
  }
}
//  로우 챌린지

const rowChanged = (grid, oldRow, newRow) => {
  grdDetail.value.getDataProvider().setRows(null)
  if (oldRow === -1) {
    newRow = 0
    delparams.param = []
    grdDetail.value.getDataProvider().setRows(null)
  }
  let rowData = grdMain.value.getDataProvider().getJsonRow(newRow)
  delparams.param = rowData
  searchDetailParams.CMPNY_DIV = rowData.CMPNY_DIV
  searchDetailParams.SAGO_SN = rowData.SAGO_SN

  searchDetail()
}



const DelMainChek = async () => {
  DelParma.value = []

  let delCheck = grdDetail.value.getDataProvider().getRowCount()
  console.log(delCheck, "delCheck")
  if (delCheck != 0) {
    Message.warn(t("하위데이터가 존재하면 삭제할 수 없습니다."))
    return false
  }
  if (!delparams.param) {
    Message.warn(t("데이터가 없습니다."))
    return false
  }
  // if (delparams.param.APPROVAL_STATUS !== "즉보작성 진행") {
  //   Message.warn(t("진행상태가 즉보작성 진행 상태가 아니면 삭제 할수없습니다."))
  //   return false
  // }
  return true
}

const MainDelData = async () => {
  return commonExecuteApi({
    queryId: "SAFAB0010_delete01",
    list: [delparams.param],
  })
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
  console.log('dmddk')
}

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: ["NM1", "PRNT_SAGO_SN", "SAGO_SN"],
  fields: [
    {
      fieldName: "OCCUR_DT_TM",
      header: { text: t("발생일시") },
      dataType: "text",
      editable: false,
      width:'150'
    },
    {
      fieldName: "INSERT_DATE",
      header: { text: t("등록일자") },
      // dataType: "datetime",
      // datetimeFormat: "yyyyMMddHHmmssSSS",
      editable: false
    },

    {
      fieldName: "APPROVAL_STATUS",
      dataType: "text",
      header: { text: t("진행상태") },
      editable: false,
    },
    {
      fieldName: "SAGO_DIV_L_NM",
      dataType: "text",
      header: { text: t("사고구분") },
      editable: false,
      width:'80'
    },

    // {
    //   fieldName: "JUCA",
    //   header: { text: t("주별") },
    //   dataType: "text",
    //   editable: false,
    // },
    {
      fieldName: "SAGO_DIV_M_NM",
      dataType: "text",
      header: { text: t("사고유형") },
      editable: false,
    },
    {
      fieldName: "INJR_ORGN_FULL_NM",
      dataType: "text",
      header: { text: t("재해부서/협력사") },
      editable: false,
      styleName: "left-column",
      width:'260'
    },
    {
      fieldName: "NM1",
      dataType: "text",
      header: { text: t("재해자/유발자") },
      editable: false,
    },
    {
      fieldName: "RESP_DEPT_NM",
      dataType: "text",
      header: { text: t("책임부서/협력사") },
      editable: false,
      styleName: "left-column",
      width:'260'
    },
    {
      fieldName: "RESPON_DIV_NM",
      dataType: "text",
      header: { text: t("책임구분") },
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

    // {
    //   fieldName: "VNDR_NM",
    //   dataType: "text",
    //   header: { text: t("협력사") },
    //   editable: false,
    // },
    {
      fieldName: "SAGO_LOC_DTL",
      dataType: "text",
      header: { text: t("장소") },
      editable: false,
      width:'200'
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
      fieldName: "SAFE_GAMGR_EMPKORNM2",
      dataType: "text",
      header: { text: t("담당 안전과장") },
      editable: false,
      width: "200",
    },
    {
      fieldName: "GIINMUL1_CD",
      dataType: "text",
      header: { text: t("기인물") },
      lookupDisplay: true,
      editable: false,
      width:'150'
    },
    {
      fieldName: "GUGUP_YN",
      dataType: "text",
      header: { text: t("구급차이용") },
      editable: false,
    },
    {
      fieldName: "WIHEOM_YN",
      header: { text: t("Hi-Standard\n개정 필요여부"), styleName: 'multiline-editor' },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    {
      fieldName: "WIHEOM_STATUS",
      header: { text: t("Hi-Standard\n개정 진행상태"), styleName: 'multiline-editor' },
      editable: false,
    },
    {
      fieldName: "WORK_STANDARD_ID",
      header: { text: t("작업표준ID") },
      styleName: "left-column",
      editable: false,
      width:'200'
    },
    {
      fieldName: "TONG_CHK",
      header: { text: t("통계 확인") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    {
      fieldName: "JEWE_YN",
      header: { text: t("통계 반영") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
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
      fieldName: "SLI_YN",
      header: { text: t("SLI 집계") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    {
      fieldName: "SAGOJIYEON",
      header: { text: t("지연 보고/등록") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    {
      fieldName: "WRT_FN_DT2",
      header: { text: t("즉보\n작성 완료일"), styleName: 'multiline-editor' },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "SFTRP_CM_DT2",
      header: { text: t("보고서\n작성 완료일"), styleName: 'multiline-editor' },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "SAGO_SN",
      dataType: "text",
      header: { text: t("사고번호") },
      width:'150'
    },
    {
      fieldName: "SJE_STATUS",
      dataType: "text",
      header: { text: t("산재사고 재발방지대책\n이행점검"), styleName: 'multiline-editor' },
      width:'150'
    },
    {
      fieldName: "RPT_FILE_YN",
      dataType: "text",
      header: { text: t("첨부") },
      width:'50'
    },
    {
      fieldName: "RPT_CHK_NM",
      dataType: "text",
      header: { text: t("제출여부") },
      width:'120'
    },

    //  안보임
    {
      fieldName: "TONGOK",
      dataType: "text",
      header: { text: t("통계 확정") },
      editable: false,
      visible: false,
    },
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
    // {
    //   fieldName: "INSERT_DATE",
    //   header: { text: t("등록일시") },
    //   editor: { datetimeFormat: "yyyy-MM-dd" },
    //   dataType: "datetime",
    //   datetimeFormat: "yyyy-MM-dd",
    //   visible: false,
    // },
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
    { fieldName: "WRK_STD_NM_E", visible: false },
    { fieldName: "WRT_USER_ID", visible: false },
    { fieldName: "GINDANS_USER_ID", visible: false },
  ],
  columns: [],
  columnLayout: isSafeUser ? 
  [
    'OCCUR_DT_TM',
    'INSERT_DATE',
    'APPROVAL_STATUS',
    'SAGO_DIV_L_NM',
    'SAGO_DIV_M_NM',
    'INJR_ORGN_FULL_NM',
    'NM1',
    'RESP_DEPT_NM',
    'RESPON_DIV_NM',
    'SAGO_TYPE_CD',
    'SAGO_LOC_DTL',
    'SAGO_GAEYO',
    'SAFE_GAMGR_EMPKORNM2',
    'GIINMUL1_CD',
    'GUGUP_YN',
    'WIHEOM_YN',
    'WIHEOM_STATUS',
    'WORK_STANDARD_ID',
    'TONG_CHK',
    'JEWE_YN',
    'JUNGDAE_YN',
    'COME_SERIOUS_YN',
    'SLI_YN',
    'SAGOJIYEON',
    'WRT_FN_DT2',
    'SFTRP_CM_DT2',
    'SAGO_SN',
    'SJE_STATUS',
    {
      name: '산업재해조사표',
      direction: 'horizontal',
      items: ['RPT_FILE_YN', 'RPT_CHK_NM'],
      header: {
        text: t('산업재해조사표'),
      },
    },
  ] : [
    'OCCUR_DT_TM',
    'INSERT_DATE',
    'APPROVAL_STATUS',
    'SAGO_DIV_L_NM',
    'SAGO_DIV_M_NM',
    'INJR_ORGN_FULL_NM',
    'NM1',
    'RESP_DEPT_NM',
    'RESPON_DIV_NM',
    'SAGO_TYPE_CD',
    'SAGO_LOC_DTL',
    'SAGO_GAEYO',
    'SAFE_GAMGR_EMPKORNM2',
    'GIINMUL1_CD',
    'GUGUP_YN',
    'WIHEOM_YN',
    'WIHEOM_STATUS',
    'WORK_STANDARD_ID',
    'TONG_CHK',
    'JEWE_YN',
    'JUNGDAE_YN',
    'COME_SERIOUS_YN',
    'SLI_YN',
    'SAGOJIYEON',
    'WRT_FN_DT2',
    'SFTRP_CM_DT2',
    'SAGO_SN',
  ] 
  ,
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
      header: { text: t("성명") },
      editable: false,
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
      visible: false,
    },
    {
      fieldName: "BIRTHDAY",
      header: { text: t("생년월일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },

    {
      fieldName: "IPSAIL",
      header: { text: t("입사일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },

    {
      fieldName: "CONTACT_NUMBER",
      dataType: "text",
      header: { text: t("연락처(HP)") },
      editable: false,
      visible: false,
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
    // {
    //   fieldName: "JINDAN_NM",
    //   dataType: "text",
    //   header: { text: t("진단") },
    //   visible: false,
    // },
    {
      fieldName: "RPT_TYPE_CD",
      dataType: "text",
      header: { text: t("사고구분") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
      visible: false,
    },
    {
      fieldName: "SJE_TYPE_CD",
      dataType: "text",
      header: { text: t("산재구분") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
      visible: false,
    },
    {
      fieldName: "CONTACTING",
      header: { text: t(" 진정") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
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

//그리드2 속성셋팅
const grdProps2_admin = reactive({
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
      header: { text: t("성명") },
      editable: false,
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
      fieldName: "INJURY_PART_SM",
      dataType: "text",
      header: { text: t("상해부위") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "INJURY_TYPE_NM",
      dataType: "text",
      header: { text: t("상해종류") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "JINDAN_NM",
      dataType: "text",
      header: { text: t("진단:주") },
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
      fieldName: "CONTACT_NUMBER",
      dataType: "text",
      header: { text: t("연락처(HP)") },
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
    // {
    //   fieldName: "JINDAN_CD",
    //   dataType: "text",
    //   header: { text: t("진단") },
    //   visible: false,
    // },
    {
      fieldName: "RPT_TYPE_CD",
      dataType: "text",
      header: { text: t("사고구분") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
      visible: false,
    },
    {
      fieldName: "SJE_TYPE_CD",
      dataType: "text",
      header: { text: t("산재구분") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
      visible: false,
    },
    {
      fieldName: "CONTACTING",
      header: { text: t(" 진정") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
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
    //{ fieldName: "INJURY_PART_SM", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_L", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_S", dataType: "text", visible: false },
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
grdProps2_admin.columns = grdProps2_admin.fields

const upData = () => {
  onButtonsClick({ id: "btnSearch" })
}

const clearable =(e)=>{
  
  
  if(e ==='안전'){
    searchParams.SAFE_GAMGR_EMPKORNM = ''
    searchParams.SAFE_GAMGR_EMP = ''
  }
  else if(e ==='재해') {
    searchParams.NM1 = ''
  }else if(e ==='재해부서'){
    searchParams.INJR_BSNS_CD = ''
    searchParams.INJR_DEPT_CD = ''
    searchParams.INJR_DEPT_NM = ''
  }else if(e ==='책임부서'){
    // if (searchAuth){
    //   searchParams.RESP_BSNS_CD = ''
    //   searchParams.RESP_DEPT_CD = ''
    //   searchParams.RESP_DEPT_NM = ''
    // }else{
    //   Message.warn(t("관리자만 변경 가능합니다."))
    // }

    searchParams.RESP_BSNS_CD = ''
    searchParams.RESP_DEPT_CD = ''
    searchParams.RESP_DEPT_NM = ''

  }

}

const empPopupOpen = (e) => {
  console.log(e, 'e')
  empPopup.value.openPopup({
    BSNS_CD: '',
    EMP_NM: searchParams.SAFE_GAMGR_EMPKORNM,
  })
}

// 재해자 인원팝업 오픈
const openJaehaeEmpPopup = (e) => {
  empPopup2.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: searchParams.NM1,
  })
}

// 재해자 선택 이벤트
const onJaehaeEmpSelected = (val) => {
  searchParams.NM1 = val.EMP_NM
}

const selectedemp = (row) => {
  console.log(row, 'row')
  searchParams.SAFE_GAMGR_EMPKORNM = row.EMP_NM
  searchParams.SAFE_GAMGR_EMP = row.EMP_NO
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnRegist','btnDelete2', 'btnClose']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <VForm ref="searchArea" class="searchArea">
          <div class="d-flex">
          <i-select
            v-model="searchParams.DATE_GBN"
            :items="dateList"
            item-value="VALUE"
            item-title="TEXT"
            width="120px"
            margin="5px"
          />
          <i-input
            v-model="searchParams.OCCUR_FROM"
            type="Date"
            
            width="146px"
            margin="10px"
          />

          <i-input
            :label="$t('-')"
            v-model="searchParams.OCCUR_TO"
            type="Date"
            width="160px"
          />

          <i-select
            v-model="searchParams.DEPT_GBN"
            :items="deptList"
            item-value="VALUE"
            item-title="TEXT"
            width="120px"
            margin="10px"
          />

<!-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■  재해  ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ -->

          <i-select
            v-if="searchParams.DEPT_GBN === 'A'"
            :label="$t('재해사업부')"
            width="250px"
            margin="10px"
            placeholder="사업부"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            :disabled="NOBSNS"
          />

          <i-select
              v-if="searchParams.DEPT_GBN === 'A'"
              :label="$t('재해부문')"
              width="250px"
              margin="10px"
              placeholder="부문"
              v-model="searchParams.INJR_ASGN20"
              :items="codeList.asgn20Cd"
              item-title="ASGN_SHRT_NM"
              item-value="ASGN_CD"
              :disabled="NOASGN"
            />

            <i-select
              v-if="searchParams.DEPT_GBN === 'A'"
              :label="$t('재해부서')"
              width="278px"
              margin="10px"
              placeholder="부서"
              v-model="searchParams.INJR_DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :disabled="NODEPT"
            />

<!-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■  책임  ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ -->

            <i-select
            v-if="searchParams.DEPT_GBN === 'B'"
            :label="$t('책임사업부')"
            width="250px"
            margin="10px"
            placeholder="사업부"
            v-model="searchParams.RESP_BSNS_CD"
            :items="codeList.RESP_BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            :disabled="respNOBSNS"
          />

          <i-select
            v-if="searchParams.DEPT_GBN === 'B'"
            :label="$t('책임부문')"
            width="250px"
            margin="10px"
            placeholder="부문"
            v-model="searchParams.RESP_ASGN20"
            :items="codeList.RESP_asgn20Cd"
            item-title="ASGN_SHRT_NM"
            item-value="ASGN_CD"
            :disabled="respNOASGN"
          />

          <i-select
            v-if="searchParams.DEPT_GBN === 'B'"
            :label="$t('책임부서')"
            width="278px"
            margin="10px"
            placeholder="부서"
            v-model="searchParams.RESP_DEPT_CD"
            :items="codeList.RESP_DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
            :disabled="respNODEPT"
          />
<!-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■  재해 + 책임  ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ -->
          <i-select
            v-if="searchParams.DEPT_GBN === 'C'"
            :label="$t('사업부')"
            width="250px"
            margin="10px"
            placeholder="사업부"
            v-model="searchParams.ALL_BSNS_CD"
            :items="codeList.ALL_BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            :disabled="allNOBSNS"
          />

          <i-select
            v-if="searchParams.DEPT_GBN === 'C'"
            :label="$t('부문')"
            width="250px"
            margin="10px"
            placeholder="부문"
            v-model="searchParams.ALL_ASGN20"
            :items="codeList.ALL_asgn20Cd"
            item-title="ASGN_SHRT_NM"
            item-value="ASGN_CD"
            :disabled="allNOASGN"
          />

          <i-select
            v-if="searchParams.DEPT_GBN === 'C'"
            :label="$t('부서')"
            width="278px"
            margin="10px"
            placeholder="부서"
            v-model="searchParams.ALL_DEPT_CD"
            :items="codeList.ALL_DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
            :disabled="allNODEPT"
          />

            <!-- <i-input
            :label="$t('재해부서')"
            v-model="searchParams.INJR_DEPT_NM"
            width="300px"
            margin="4px"
            readonly
            append-inner-icon="mdi-magnify"
            @keydown.enter="
              (e) => {
                openPopup2()
              }
            "
            @update:modelValue="
              (e) => {
                searchParams.INJR_DEPT_CD = null
              }
            "
            @click:appendInner="openPopup2()"
            clearable
            @click:clearable="clearable('재해부서')"
          />
          <i-input
            :label="$t('')"
            v-model="searchParams.INJR_DEPT_CD"
            width="80px"
            readonly
          /> -->

            <i-input
              :label="$t('재해자')"
              @click:appendInner="openJaehaeEmpPopup"
              @keydown.enter="(e) => openJaehaeEmpPopup(e)"
              append-inner-icon="mdi-magnify"
              v-model="searchParams.NM1"
              width="200px"
              margin="4px"
              clearable
              @click:clearable="clearable('재해')"
            />

          
          <!-- <i-select
            :label="$t('대책이행점검')"
            v-model="searchParams.SAGO_PLAN_CHK"
            :items="codeList.SAGO_PLAN_CHK"
            item-value="COD"
            item-title="TXT"
            width="200px"
          /> -->
          </div>
          <div class="d-flex mt-3">
          <!-- <i-input
            :label="$t('책임부서')"
            v-model="searchParams.RESP_DEPT_NM"
            width="300px"
            margin="4px"
            readonly
            append-inner-icon="mdi-magnify"
            @keydown.enter="
              (e) => {
                openPopup()
              }
            "
            @update:modelValue="
              (e) => {
                searchParams.RESP_DEPT_CD = null
              }
            "
            @click:appendInner="openPopup()"
            clearable
            @click:clearable="clearable('책임부서')"
          />
          <i-input
            :label="$t('')"
            v-model="searchParams.RESP_DEPT_CD"
            width="80px"
            readonly
          /> -->

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

           <i-input
            :label="$t('안전과장')"
            v-model="searchParams.SAFE_GAMGR_EMPKORNM"
            width="300px"
            margin-right="10px"
            append-inner-icon="mdi-magnify"
            @click:appendInner="empPopupOpen"
            @keydown.enter="(e) => empPopupOpen(e)"
            clearable
            @click:clearable="clearable('안전')"
          />
          <div
              class="d-flex align-center checkbox-group"
            >
              <v-checkbox
                v-model="searchParams.SLICHECK"
                true-value="Y"
                :false-value= null 
                :label="t('SLI 집계 대상')"
                width="100px"
                margin-right="10px"
              />

              <v-checkbox
                v-model="searchParams.JEWECHECK"
                true-value="Y"
                :false-value= null 
                :label="t('통계 반영 대상')"
                width="100px"
                margin-right="10px"
              />

              <v-checkbox
                v-model="searchParams.JUNGDAECHECK"
                true-value="Y"
                :false-value= null 
                :label="t('중대재해')"
                width="100px"
                margin-right="10px"
              />

              <v-checkbox
                v-model="searchParams.COMECHECK"
                true-value="Y"
                :false-value= null 
                :label="t('중대성사고')"
                width="100px"
                margin-right="10px"
              />
            </div>
          <v-spacer/>
          
          </div>
        </VForm>
        <v-sheet height="60%" class="mb-3">
          <IGridTitle
            ref="disablebtns"
            :title="$t('사고보고서 현황') "
            @click-button="onButtonsClick"
          >
            <template #editors>
              <!-- <div class="d-flex align-center" style="margin-left: 790px;" v-if="props.dialog != 'Y'"> -->
              <div class="d-flex align-center" style="position: absolute; top: -6px; right: 0;" v-if="props.dialog != 'Y'">
                {{ $t('지연 감점 대상') }}
                <div class="ml-1 mr-4" style="width: 75px; height: 40px; background-color: rgba(255, 204, 204, 0.5);"></div>
                {{ $t('즉보/보고서 처리단계') }}
                <div v-for="(i, key) in StatusDiv" 
                    :key="key" 
                    :style="{ backgroundColor: i.COlOR, color: i.TXT === '종결' ? '#222' : '#222' }" 
                    style="padding: 10px; margin: 0 4px" >
                  {{ i.TXT }}
                </div>
              </div>
            </template>
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onCellDblClicked="onCellDblClickedMain"
            @onCurrentRowChanged="rowChanged"
          />
        </v-sheet>

        <v-sheet class="h-auto">
          <IGridTitle
            ref="menuTitle2"
            :title="$t('사고보고서별 인적현황')"
            :button-list="['btnCreate', 'btnDelete']"
            @click-button="onButtonsClick"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            v-if = "isadmin"
            ref="grdDetail"
            :grid-view-option="grdProps2_admin.gridViewOption"
            :keys="grdProps2_admin.keys"
            :fields="grdProps2_admin.fields"
            :columns="grdProps2_admin.columns"
            @onCellDblClicked="onCellDblClickedDetail"
          />
          <RealGrid
            v-if = "!isadmin"
            ref="grdDetail"
            :grid-view-option="grdProps2.gridViewOption"
            :keys="grdProps2.keys"
            :fields="grdProps2.fields"
            :columns="grdProps2.columns"
            @onCellDblClicked="onCellDblClickedDetail"
          />
        </v-sheet>



        <!-- 팝업촌 -->
        <DeptPopup  ref="deptPopup" @selected="onDeptSelected" />
        <DeptPopup2 ref="deptPopup2" @selected="onDeptSelected2" />
        <SAFAB0020PopUp ref="MainPopOpen" />
        <!-- @upData="upData"  -->
        <SAFAB0020ManPopUp ref="ManPopOpen" />
        <SAFAB0010PopUp @upDataRow="upDataRow" ref="safab0010PopUp" />
        <EmpPopup ref="empPopup" @selected="selectedemp" />
        <EmpPopup2 ref="empPopup2" @selected="onJaehaeEmpSelected" />
        <!-- @upData="upData" -->
      </div>
    </v-card-text>
  </v-card>
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

.checkbox-group {
  gap: 15px
}
</style>
