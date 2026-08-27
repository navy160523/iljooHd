<!--
  화면명 : 안전사고 등록/현황
  화면개요 : 안전사고 발생 시 사업부 안전에서 사고 등록
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import dayjs from "dayjs"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import SAFAB0010PopUp from "@/pages/30_safety/SAF_A/SAFAB0010AddPopUp.vue"
import SAFAB0010ManPopUp from "@/pages/30_safety/SAF_A/SAFAB0010ManPopUp.vue"
import Message from "@hiway/utils/notify"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/pages/30_safety/SAF_A/SAFAB0010EMP.vue'
import { commonLogExecuteApi } from "@hiway/api/commonApi"
defineOptions({
  name: "30_safety-SAF_A-SAFAB0010",
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
const grdMain = ref(null)
const grdDetail = ref(null)
const safab0010PopUp = ref(null)
const safa0010manpopup = ref(null)
const DelParma = reactive([])
const delparams = reactive([])
const NOBSNS = ref(false)
const searchParams = reactive({
  DT_GBN: "1",
  OCCUR_FROM: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  OCCUR_TO: dayjs().format("YYYY-MM-DD"),
  SAGOBURU: "",
  DEPT_CD: userStore.deptCd,
  BSNS_CD: userStore.bsnsCd,
  INJR_DEPT_CD: userStore.deptCd,
  CMPNY_DIV: userStore.cmpnyDiv,
  APPROVAL_STATUS: "",
  SAGO_PLAN_CHK: "",
  ASGN_NM: ` ${userStore.bsnsNm} - ${userStore.deptNm}`,
  ASGN20:'',
})
const searchDetailParams = reactive({})

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

// 팝업
const deptPopup = ref(null)
const empPopup = ref(null)
/*  공통코드 세팅 */
onMounted(() => {
  Promise.all([
    getCodeList("HHIB010"), //0
    getCodeList("HHIB070"), //1
    getCodeList("HHIB040"), //2
    getCodeList("HHIB080"), //3
    getCodeList("HHIB330"), //4
    getCodeList("HHIB340"), //5
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
  ])
    .then((res) => {
      codeList.SAGOBURU = res[0].ORESULT_CUR.filter(
        (x) => x.COD === "A" || x.COD === "B" || x.COD === "D" || x.COD === "E"
      )
      
      if(props.dialog != 'Y') {
        grdDetail.value.setBindingColumn(
          "RPT_TYPE_CD",
          res[1].ORESULT_CUR,
          "COD",
          "TXT"
        )
      }
      
      grdMain.value.setBindingColumn(
        "GIINMUL1_CD",
        res[2].ORESULT_CUR,
        "COD",
        "TXT"
      )
      
      if(props.dialog != 'Y') {
        grdDetail.value.setBindingColumn(
          "SJE_TYPE_CD",
          res[3].ORESULT_CUR,
          "COD",
          "TXT"
        )
      }
      
      
      codeList.SAGOBURU.unshift({ TXT: "전체", COD: "" })
      codeList.SAGO_PLAN_CHK = res[4].ORESULT_CUR
      codeList.APPROVAL_STATUS = res[5].ORESULT_CUR
      codeList.APPROVAL_STATUS.unshift({ TXT: "전체", COD: "" })
      codeList.SAGO_PLAN_CHK.unshift({ TXT: "전체", COD: "" })
      
      grdMain.value.setBindingColumn(
        "SAGO_TYPE_CD",
        codeList.sagoCheck,
        "COD",
        "TXT"
      )
    codeList.BSNS_CD = res[6].ORESULT_CUR
    
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.DEPT_CD = res[7].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
    codeList.asgn20Cd = res[8].ORESULT_CUR
    codeList.asgn20Cd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
    })
    .catch((err) => {})

   //  스타일 지정
   grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    if (dataCell.value == "즉보작성 진행") {
      ret.style = { background: "#E6B9B8" } // ret.style = {background:"#ffff00"} 직접 스타일 적용 가능
    } else if (dataCell.value == "즉보작성 완료") {
      ret.style = { background: "#FCD5B5", color:"#222" }
    } else if (dataCell.value == "즉보안전확인 완료") {
      ret.style = { background: "#D7E4BD", color:"#222" }
    }
     else if (dataCell.value == "보고서 작성 완료") {
      ret.style = { background: "#FCD5B5", color:"#222" }
    } else if (dataCell.value == "보고서 안전확인 완료") {
      ret.style = { background: "#D7E4BD", color:"#222" }
    }else if (dataCell.value == "결재중") {
      ret.style = { background: "#45C4B0", color:"#222" }
    }else if (dataCell.value == "결재완료") {
      ret.style = { background: "#13678A", color:"#222" }
    } else if (dataCell.value == "종결") {
      ret.style = { background: "#012030" , color:"#fff" }
    }
    return ret
  })

  //console.log('props dialog = ', props.dialog)

  vm.$nextTick(() => {
    // 작업표준 신규제정에서 팝업으로 호출시 -------------//
    if (props.dialog == "Y") {
      menuTitle.value.setBtnProperty("btnAdd", "visible", false)
      menuTitle.value.setBtnProperty("btnRegist", "visible", false)
      menuTitle.value.setBtnProperty("btnCreate", "visible", false)
      menuTitle.value.setBtnProperty("btnDelete", "visible", false)
      menuTitle.value.setBtnProperty("btnClose", "visible", true)

      searchParams.OCCUR_FROM = props.half.from
      searchParams.OCCUR_TO = props.half.to

      searchParams.CMPNY_DIV = props.val1.COMPANY_CD
      searchParams.BSNS_CD = props.val1.BSNS_CD
      searchParams.ASGN_NM = props.val1.DEPT_NM
      searchParams.DEPT_CD = props.val1.DEPT_CD

      onButtonsClick({ id: "btnSearch" })
    } else menuTitle.value.setBtnProperty("btnClose", "visible", false)
    //-------------------------------------------------//
  })
})


// 사업부 변경감지


const NOASGN  = ref(false)

watch(
  () => searchParams.BSNS_CD,
  (newValue) => {
    if (!newValue) {
      NOBSNS.value = true
      NOASGN.value =true
      searchParams.INJR_DEPT_CD = ""
      searchParams.ASGN20 = ''
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        // console.log(res, "res")
        searchParams.INJR_DEPT_CD = ""
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        NOBSNS.value = false
      })

      commonSearchApi({ queryId : 'searchASGN20', 
        param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: newValue, USE_DIV: 'Y' }
      }).then((res)=>{
          searchParams.ASGN20 = ''
          if(res.ORESULT_CUR.length === 0){
            searchParams.ASGN20 = ''
            NOASGN.value = true
          }
          else{
            codeList.asgn20Cd = res.ORESULT_CUR
            codeList.asgn20Cd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
            NOASGN.value = false
            console.log('dmdkdk')
          }

        })
    
      }
    })
  

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
      fieldName: "JUCA",
      header: { text: t("주별") },
      dataType: "text",
      editable: false,
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
    },
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
    },
    {
      fieldName: "NM1",
      dataType: "text",
      header: { text: t("재해자") },
      editable: false,
      visible: !props.dialog,
    },
    {
      fieldName: "RESP_DEPT_NM",
      dataType: "text",
      header: { text: t("책임부서/협력사") },
      width:'260',
      editable: false,
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
      header: { text: t("사고처리") },
      editable: false,
      lookupDisplay: true,
      width: "150",
    },
    
    {
      fieldName: "SAGO_LOC_DTL",
      dataType: "text",
      header: { text: t("장소") },
      editable: false,
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
      visible: !props.dialog,
    },
  

    {
      fieldName: "JEWE_YN",
      header: { text: t("통계 반영") },
      renderer: { type: "check", trueValues: "N", falseValues: "Y" },
      editable: false,
      visible: !props.dialog,
    },
    {
      fieldName: "SLI_YN",
      header: { text: t("SLI 집계") },
      renderer: { type: "check", trueValues: "N", falseValues: "Y" },
      editable: false,
      visible: !props.dialog,
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
      visible: !props.dialog,
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
    { fieldName: "BSNS_CDM", visible: false },
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
  // columnLayout: [
  //   {
  //     name: "사고현황",
  //     direction: "horizontal",
  //     items: [
  //       "OCCUR_DT_TM",
  //       "INSERT_DATE",
  //       "JUCA",
  //       "INJR_ORGN_FULL_NM",
  //       "RESP_DEPT_NM",
  //       "VNDR_NM",
  //       "RESPON_DIV_NM",
  //       "NM1",
  //       "SAGO_DIV_L_NM",
  //       "SAGO_DIV_M_NM",
  //       "GIINMUL1_CD",
  //       "GUGUP_YN",
  //       "SAGO_LOC_DTL",
  //       "SAGO_GAEYO",
  //       "APPROVAL_STATUS",
  //       "JEWE_YN",
  //       "JUNGDAE_YN",
  //       "COME_SERIOUS_YN",
  //       "SAGO_HIDE_YN",
  //       "SAGO_NM",
  //       "SLI_YN",
  //       "TONGOK",
  //     ],
  //     header: {
  //       text: t("사고현황"),
  //     },
  //   },
  // ],
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
      header: { text: t("사고처리") },
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
      header: { text: t("직급") },
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
      fieldName: "CONTACTING",
      header: { text: t("개인진정") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    {
      fieldName: "SJE_TYPE_CD",
      dataType: "text",
      header: { text: t("산재구분") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
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
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields
grdProps2.columns = grdProps2.fields

onMounted(() => {})

// 더블클릭팝업
const onCellDblClickedMain = (grd, data) => {
  if (data.cellType === "data") {
    let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    safab0010PopUp.value.openPopup(row, "dblclick", props.dialog)
  }
}

const onCellDblClickedSub = (grd, data) => {
  if (data.cellType === "data") {
    let row = grdDetail.value.getDataProvider().getJsonRow(data.dataRow)
    safa0010manpopup.value.openPopup(row, true, "dblclick")
  }
}

//
const upDataRow = () => {
  onButtonsClick({ id: "btnSearch" })
}

const upDataRowDetail = () => {
  onButtonsClick({ id: "btnSearch" })
  searchDetail()
}

//  조회
const searchData01 = (idx) => {
  return commonSearchApi({
    queryId: "SAFAB0010_search01",
    param: searchParams,
  })
}

const afterSearch01 = (res) => {
  console.log(res, "res")
  for (let i of res.ORESULT_CUR) {
    if(i.INSERT_DATE){
      i.INSERT_DATE = dayjs(i.INSERT_DATE).format('YYYYMMDDHHmmssSSS')
    }
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 서브조회
const searchData02 = (idx) => {
  let afterparams = {
    userStore: userStore,
    params: searchDetailParams,
    mgs: "안전사고 등록/현황 개인 정보 관련 을 조회했습니다.",
    crudGbn: "R", //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: "", // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }

  commonLogExecuteApi(afterparams)

  return commonSearchApi({
    queryId: "SAFAB0010_search02",
    param: searchDetailParams,
  })
}

const afterSearch02 = (res) => {
  console.log(res, "resdetail")
  grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//  삭제

//  메인 삭제 위한 데잍 ㅓ들고오기
// const onCellClicked = (grid, cellData) => {
//   if (cellData.dataRow == -1 || cellData.dataRow == undefined) {
//     return
//   }
// }

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

const DeltailChek = async () => {
  DelParma.value = []
  let chekedRow = await grdDetail.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return false
  }
  return true
}

const MainDelData = async () => {
  return commonExecuteApi({
    queryId: "SAFAB0010_delete01",
    list: [delparams.param],
  })
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

// 버튼 이벤트

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  } else if (btn.id === "btnRegist") {
    safab0010PopUp.value.openPopup()
  } else if (btn.id === "btnCreate2") {
    if (searchDetailParams.SAGO_SN) {
      safa0010manpopup.value.openPopup(searchDetailParams)
    } else {
      return Message.warn(t("저장되지않는 데이터는 추가할수없습니다."))
    }
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setBefore(DelMainChek)
      .setQuery(MainDelData)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run()
  } else if (btn.id === "btnDelete2") {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdDetail, row: "check" }])
      .setGridList([grdDetail])
      .setBefore(DeltailChek)
      .setQuery(DeltailDelData)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run()
  } else if (btn.id === "btnClose") {
    // 이 페이지가 팝업으로 띄워진 경우, 닫기 버튼을 눌러 종료
    emit("close", false)
  }
}
//  로우 챌린지

const rowChanged = (grid, oldRow, newRow) => {
  if(grdDetail.value != null) {
    console.log(oldRow, newRow, "oldRow, newRow")
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

//  재해부서 팝업

const openPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: "Y",
    BSNS_CD: searchParams.BSNS_CD,
  })
}

const onDeptSelected = (val) => {
  searchParams.RESP_BSNS_CD = val.BSNS_CD
  searchParams.RESP_DEPT_CD = val.DEPT_CD
  searchParams.RESP_DEPT_NM = val.ASGN_FULL_NM
}

watch(
  () => searchParams.ASGN_NM,
  (newValue) => {
    if (newValue === "") {
      searchParams.BSNS_CD = ""
      searchParams.DEPT_CD = ""
      searchParams.INJR_DEPT_CD = ""
    }
  }
)

const clearable =(e)=>{
  searchParams.RESP_BSNS_CD = ''
  searchParams.RESP_DEPT_CD = ''
  searchParams.RESP_DEPT_NM = ''
  if(e ==='안전'){
    searchParams.SAFE_GAMGR_EMPKORNM = ''
    searchParams.SAFE_GAMGR_EMP = ''
  }
  console.log('e')
}


const empPopupOpen = (e) => {
  console.log(e, 'e')
  empPopup.value.openPopup({
    BSNS_CD: 'AN00',
    EMP_NM: searchParams.SAFE_GAMGR_EMPKORNM,
  })
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
        :title="props.dialog == 'Y' ? '' : $t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnRegist', 'btnDelete', 'btnClose']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <VForm ref="searchArea" class="searchArea">
          <div class="d-flex">
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
          <i-select
              :label="$t('재해사업부')"
              width="250px"
              margin="10px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />
     
            <i-select
              :label="$t('재해부서')"
              width="278px"
              margin="10px"
              placeholder="부서"
              v-model="searchParams.INJR_DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :disabled="NOBSNS"
            />
            <i-select
              :label="$t('재해부문')"
              width="210px"
              margin="10px"
              placeholder="부서"
              v-model="searchParams.ASGN20"
              :items="codeList.asgn20Cd"
              item-title="ASGN_SHRT_NM"
              item-value="ASGN_CD"
              :disabled="NOASGN"
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
          </div>
          <div class="d-flex mt-3">
          <i-input
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
            @click:clearable="clearable()"
          />
          <i-input
            :label="$t('')"
            v-model="searchParams.RESP_DEPT_CD"
            width="80px"
            readonly
          />

          <i-input
            :label="$t('안전과장')"
            v-model="searchParams.SAFE_GAMGR_EMPKORNM"
            width="300px"
            margin="4px"
            readonly
            append-inner-icon="mdi-magnify"
            @click:appendInner="empPopupOpen"
            @keydown.enter="(e) => empPopupOpen(e)"
            clearable
            @click:clearable="clearable('안전')"
          />
          </div>
        </VForm>
        <v-sheet :height="props.dialog == 'Y' ? '100%' : '60%'" class="mb-3">
          <IGridTitle title="사고 현황" @click-button="onButtonsClick">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            @onCurrentRowChanged="rowChanged"
            @onCellDblClicked="onCellDblClickedMain"
          />
        </v-sheet>
        <!-- :column-layout="grdProps1.columnLayout" -->
        <v-sheet v-if="props.dialog != 'Y'" class="h-auto">
          <IGridTitle
            :title="$t('사고보고서별 인적현황')"
            :button-list="['btnCreate2', 'btnDelete2']"
            @click-button="onButtonsClick"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdDetail"
            :grid-view-option="grdProps2.gridViewOption"
            :keys="grdProps2.keys"
            :fields="grdProps2.fields"
            :columns="grdProps2.columns"
            :column-layout="grdProps2.columnLayout"
            @onCellDblClicked="onCellDblClickedSub"
          />
        </v-sheet>
        <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
        <SAFAB0010PopUp @upDataRow="upDataRow" ref="safab0010PopUp" />
        <SAFAB0010ManPopUp
          @upDataRow="upDataRowDetail"
          ref="safa0010manpopup"
        />
        <EmpPopup ref="empPopup" @selected="selectedemp" />
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
</style>
