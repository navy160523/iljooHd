<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 사고 결재 라인 지정 팝업    -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import ILabel from "@/components/ILabel.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import {
  commonRequest,
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonHiOfficeApproval,
  commonSearchApi3
} from "@hiway/api/commonApi"
import { commonApprovalList, commonLogExecuteApi } from "@hiway/api/commonApi"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { value } from "lodash-es"

import Message from "@hiway/utils/notify"
import AcdtPopup from "@/components/popup/AcdtPopup.vue"
import SendMailPopup from "@/components/popup/SendMailPopup.vue"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import IUpload from "@/components/IUpload.vue"
import SAFAB0020PopUpTab1 from "@/pages/30_safety/SAF_A/SAFAB0020PopUpTab1.vue"
import SAFAB0020PopUpTab2 from "@/pages/30_safety/SAF_A/SAFAB0020PopUpTab2.vue"
import SAFAB0020PopUpTab3 from "@/pages/30_safety/SAF_A/SAFAB0020PopUpTab3.vue"
import SAFAB0020PopUpTab4 from "@/pages/30_safety/SAF_A/SAFAB0020PopUpTab4.vue"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import OZReport from "@/components/OZReport.vue"

const menuTitle = ref(null)
const gridTitle = ref(null)
const userStore = useUserStore() //유저정보
const logsStore = useLogsStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const tab = ref(null)
const dataCheck = reactive({})
const Popdata = reactive({})
const dataZip = ref(null)
const emit = defineEmits(["upData"])
const dataInner = reactive({})
const inju = reactive({})
const empPopup = ref(null)
const approvalLine  = ref("")
const approvalLine1 = ref("")
const approvalLine2 = ref("")
const fileUpload = ref(null)
const fileName = ref("")
const fileName2 = ref([])
const m_dialog = ref(false)
const btnList = reactive([
  { name: "조회", id: "Search" },
  { name: "결재", id: "Apply" },
  { name: "출력", id: "Print" },
  { name: "닫기", id: "Close" },
])
const isFile = ref(false)

// 재해부서
const EM = reactive([
  { Vmodel: "INJR_TMMGR_NM", Label: "팀장",     Index: 0,   KOR: "INJR_TMMGR_NM_KR", DISABLE: true },
  { Vmodel: "INJR_GAMGR_NM", Label: "과장",     Index: 1,   KOR: "INJR_GAMGR_NM_KR", DISABLE: true },
  { Vmodel: "INJR_BSMGR_NM", Label: "부서장",   Index: 2,   KOR: "INJR_BSMGR_NM_KR", DISABLE: false },
  { Vmodel: "INJR_DDMGR_NM", Label: "담당임원", Index: 3,   KOR: "INJR_DDMGR_NM_KR", DISABLE: true },
  { Vmodel: "INJR_BMMGR_NM", Label: "부문장",   Index: 4,   KOR: "INJR_BMMGR_NM_KR", DISABLE: true },
])

// 책임부서
const RDE = reactive([
  { Vmodel: "RESP_VNDSB_NM", Label: "소/반장",  Index: 5, KOR: "RESP_VNDSB_NM_KR", DISABLE: false, DISPLAY: 'N'},
  { Vmodel: "RESP_VNDDP_NM", Label: "대표",     Index: 5, KOR: "RESP_VNDDP_NM_KR", DISABLE: false, DISPLAY: 'N'},
  { Vmodel: "RESP_TMMGR_NM", Label: "팀장",     Index: 5, KOR: "RESP_TMMGR_NM_KR", DISABLE: false, DISPLAY: 'Y'},
  { Vmodel: "RESP_GAMGR_NM", Label: "과장",     Index: 6, KOR: "RESP_GAMGR_NM_KR", DISABLE: false, DISPLAY: 'Y'},
  { Vmodel: "RESP_BSMGR_NM", Label: "부서장",   Index: 7, KOR: "RESP_BSMGR_NM_KR", DISABLE: false, DISPLAY: 'Y'},
  { Vmodel: "RESP_DDMGR_NM", Label: "담당임원", Index: 8, KOR: "RESP_DDMGR_NM_KR", DISABLE: false, DISPLAY: 'Y'},
  { Vmodel: "RESP_BMMGR_NM", Label: "부문장",   Index: 9, KOR: "RESP_BMMGR_NM_KR", DISABLE: false, DISPLAY: 'Y'},
])

const BSD = reactive([
  // {
  //   Vmodel: "SAFE_TMMGR_NM",
  //   Label: "팀장",
  //   Index: 10,
  //   KOR: "SAFE_TMMGR_NM_KR",
  // },
  // {
  //   Vmodel: "SAFE_GAMGR_NM",
  //   Label: "과장",
  //   Index: 11,
  //   KOR: "SAFE_GAMGR_NM_KR",
  // },
  {
    Vmodel: "SAFE_BSMGR_NM",
    Label: "부서장",
    Index: 12,
    KOR: "SAFE_BSMGR_NM_KR",
  },
  // {
  //   Vmodel: "SAFE_DDMGR_NM",
  //   Label: "담당임원",
  //   Index: 13,
  //   KOR: "SAFE_DDMGR_NM_KR",
  // },
  // {
  //   Vmodel: "SAFE_BMMGR_NM",
  //   Label: "부문장",
  //   Index: 14,
  //   KOR: "SAFE_BMMGR_NM_KR",
  // },
])

let approvalParams = reactive({
  FORM_ID: "421",
  SUBJECT: "[HiSEs]사고보고서",
  AUTHOR_ID: userStore.userId,
  BODY: "",
  APPROVER: "",
  SYSKEY1: "421",
  SYSKEY2: logsStore.vueId.substring(0, 5),
  SYSKEY3: logsStore.vueId,
  SYSKEY4:
    userStore.cmpnyDiv +
    ";" +
    userStore.bsnsCd +
    ";" +
    userStore.deptCd +
    ";" +
    userStore.asgnCd +
    ";",
  SENDTO: "",
  COPYTO: "",
  CIRCULAR: "",
  FORMNAME: "[HiSEs]사고보고서",
})

const intCode = () => {
  Promise.all([]).then((res) => {})
}

//  팝업 관련
const openPopup = async (popupParam) => {
  for (let i in dataCheck) {
    dataCheck[i] = ""
  }
  console.log(popupParam, "asdasd")
  if (popupParam.WRT_FILE_ID) {
    dataCheck.WRT_FILE_ID = popupParam.WRT_FILE_ID
  }
  dataZip.value = ""
  dialog.value = true

  let fileParams = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    FILE_ID: dataCheck.WRT_FILE_ID,
  }
  commonSearchApi({ queryId: "searchFile", param: fileParams }).then((res) => {
    if (res.ORESULT_CUR.length > 0){
      fileName2.value = []
      for (let i = 0; i < res.ORESULT_CUR.length; i++){
        fileName2.value.push(res.ORESULT_CUR[i].FILE_NAME)
      }
      fileName.value = res.ORESULT_CUR[0].FILE_NAME
    }
  })
  let param = {
    CMPNY_DIV: popupParam.CMPNY_DIV,
    SAGO_SN: popupParam.SAGO_SN,
  }

  for (let i in popupParam) {
    Popdata[i] = popupParam[i]
  }
    vm.$nextTick(() => {
      // 2024.09.09 PSJ 작업 시작
      let respon = Popdata.RESPON_DIV       // 책임 구분 (1: 직영, 2: 협력사)
      let form = Popdata.FORM_DIV           // 사고 구분 (J: 직영, H: 협력사)
      let sago_type = Popdata.SAGO_TYPE_CD  // 사고 타입 (SJE: 산재(휴업일 3일이상), GMS: 경미공상(직영), HRS: 휴업 3일 이상 사고(협력사))
      let status = Popdata.STATUS           // 내부 결재 진행상태 (10: 결재중, 20: 결재 완료)
      let ingr_dept = Popdata.INJR_DEPT_CD  // 재해부서 코드
      let resp_dept = Popdata.RESP_DEPT_CD  // 책임부서 코드
      let serious = Popdata.COME_SERIOUS_YN // 사고강도 (N: 일반사고, Y: 중대성 사고, S:중대재해)
      
      // 2024.12.31 김성일 매니저 요청으로 사고강도가 중대성 사고이면 책임부서(직영) 활성화
      if (serious === 'Y'){
        // 직영은 내부결재 버튼 필요 X
        menuTitle.value.visibleBtn('btnInternalApply', false)

      } else {
        if (respon === '1') { // 책임 - 직영

        // 직영은 내부결재 버튼 필요 X
        menuTitle.value.visibleBtn('btnInternalApply', false)

        // 진행상태 10, 20 결재중, 결재 완료시 결재, 저장 버튼 비활성화
        if (status === '10' || status === '20') {
          menuTitle.value.disableBtn('btnApply', true)
          menuTitle.value.disableBtn('btnUpdate', true)
        }else{
          menuTitle.value.disableBtn('btnApply', false)
          menuTitle.value.disableBtn('btnUpdate', false)
        }

        if (form === 'J'){ // 재해 - 직영

          if (sago_type === 'GMS'){
            RDE[6].DISABLE = true
          } else if (sago_type === 'SJE'){

          } else {
            RDE[2].DISABLE = true
            RDE[3].DISABLE = true
            RDE[4].DISABLE = true
            RDE[5].DISABLE = true
            RDE[6].DISABLE = true
          }

        } else if(form === 'H'){ // 재해 - 협력사
          if (sago_type === 'HRS'){
            RDE[6].DISABLE = true
          } else if (sago_type === 'SJE'){

          } else {
            RDE[2].DISABLE = true
            RDE[3].DISABLE = true
            RDE[4].DISABLE = true
            RDE[5].DISABLE = true
            RDE[6].DISABLE = true
          }
        }
        } else if (respon === '2') { // 책임 - 협력사

        // 내부 결재 / 결재 버튼 활성화 처리
        if (status === '20'){
          menuTitle.value.disableBtn('btnInternalApply', true)
          menuTitle.value.disableBtn('btnApply', false)
          menuTitle.value.disableBtn('btnUpdate', false)
        }else{
          menuTitle.value.disableBtn('btnInternalApply', false)
          menuTitle.value.disableBtn('btnApply', true)
          menuTitle.value.disableBtn('btnUpdate', true)
        }

        if (form === 'J'){ // 재해 직영
          if (sago_type === 'GMS'){
            RDE[0].DISPLAY = 'Y'
            RDE[1].DISPLAY = 'Y'
            RDE[2].DISPLAY = 'N'
            RDE[3].DISPLAY = 'N'
            RDE[4].DISPLAY = 'Y'
            RDE[5].DISPLAY = 'N'
            RDE[6].DISPLAY = 'N'
          } else if (sago_type === 'SJE'){
            RDE[0].DISPLAY = 'Y'
            RDE[1].DISPLAY = 'Y'
            RDE[2].DISPLAY = 'N'
            RDE[3].DISPLAY = 'N'
            RDE[4].DISPLAY = 'Y'
            RDE[5].DISPLAY = 'N'
            RDE[6].DISPLAY = 'N'
          } else {
            RDE[0].DISPLAY = 'Y'
            RDE[1].DISPLAY = 'Y'
            RDE[2].DISPLAY = 'N'
            RDE[3].DISPLAY = 'N'
            RDE[4].DISPLAY = 'Y'
            RDE[5].DISPLAY = 'N'
            RDE[6].DISPLAY = 'N'
          }
          
        } else if(form === 'H'){ // 재해 협력사
          if (sago_type === 'SJE'){
            RDE[0].DISPLAY = 'Y'
            RDE[1].DISPLAY = 'Y'
            RDE[2].DISPLAY = 'N'
            RDE[3].DISPLAY = 'N'
            RDE[4].DISPLAY = 'Y'
            RDE[5].DISPLAY = 'N'
            RDE[6].DISPLAY = 'N'
          } else if (sago_type === 'HRS'){
            RDE[0].DISPLAY = 'Y'
            RDE[1].DISPLAY = 'Y'
            RDE[2].DISPLAY = 'N'
            RDE[3].DISPLAY = 'N'
            RDE[4].DISPLAY = 'Y'
            RDE[5].DISPLAY = 'N'
            RDE[6].DISPLAY = 'N'
          } else {
            RDE[0].DISPLAY = 'Y'
            RDE[1].DISPLAY = 'Y'
            RDE[2].DISPLAY = 'N'
            RDE[3].DISPLAY = 'N'
            RDE[4].DISPLAY = 'Y'
            RDE[5].DISPLAY = 'N'
            RDE[6].DISPLAY = 'N'
          }
        }
        } else {

        // 단기공사는 내부결재 버튼 필요 X
        menuTitle.value.visibleBtn('btnInternalApply', false)

        // 진행상태 10, 20 결재중, 결재 완료시 결재, 저장 버튼 비활성화
        if (status === '10' || status === '20') {
          menuTitle.value.disableBtn('btnApply', true)
          menuTitle.value.disableBtn('btnUpdate', true)
        }else{
          menuTitle.value.disableBtn('btnApply', false)
          menuTitle.value.disableBtn('btnUpdate', false)
        }

        RDE[0].DISPLAY = 'N'
        RDE[1].DISPLAY = 'N'
        RDE[2].DISPLAY = 'N'
        RDE[3].DISPLAY = 'N'
        RDE[4].DISPLAY = 'Y'
        RDE[5].DISPLAY = 'N'
        RDE[6].DISPLAY = 'N'
        }
      }


      

      // 재해부서와 책임부서가 동일하지 않은 경우 활성화
      if (ingr_dept !== resp_dept){
        EM[2].DISABLE = false
      } else{
        EM[2].DISABLE = true
      }
    })
  
  commonSearchApi({ queryId: 'SAFAB0020_search02', param: param })
  .then((res)=>{
    if(res.ORESULT_CUR.length > 0){
      inju.name  = res.ORESULT_CUR[0].NAME
      inju.SOSOG_DESC  = res.ORESULT_CUR[0].SOSOG_DESC
    }
    else{
      inju.name  = ''
      inju.SOSOG_DESC  = ''
    }
  })

  await commonSearchApi({ queryId: "SAFAB0020_search15", param: param }).then(
    (res) => {
      console.log("결재선 조회 ▶ ", res)

      // 코드
      dataCheck.INJR_TMMGR_NM = res.ORESULT_CUR[0].INJR_TMMGR_NM
      dataCheck.INJR_GAMGR_NM = res.ORESULT_CUR[0].INJR_GAMGR_NM
      dataCheck.INJR_BSMGR_NM = res.ORESULT_CUR[0].INJR_BSMGR_NM
      dataCheck.INJR_DDMGR_NM = res.ORESULT_CUR[0].INJR_DDMGR_NM
      dataCheck.INJR_BMMGR_NM = res.ORESULT_CUR[0].INJR_BMMGR_NM
      dataCheck.INJR_BBMGR_NM = res.ORESULT_CUR[0].INJR_BBMGR_NM

      if(RDE[0].DISPLAY === "Y") dataCheck.RESP_VNDSB_NM = res.ORESULT_CUR[0].RESP_VNDSB_NM
      if(RDE[1].DISPLAY === "Y") dataCheck.RESP_VNDDP_NM = res.ORESULT_CUR[0].RESP_VNDDP_NM
      if(RDE[2].DISPLAY === "Y") dataCheck.RESP_TMMGR_NM = res.ORESULT_CUR[0].RESP_TMMGR_NM
      if(RDE[3].DISPLAY === "Y") dataCheck.RESP_GAMGR_NM = res.ORESULT_CUR[0].RESP_GAMGR_NM
      if(RDE[4].DISPLAY === "Y") dataCheck.RESP_BSMGR_NM = res.ORESULT_CUR[0].RESP_BSMGR_NM
      dataCheck.SAFE_BSMGR_NM = res.ORESULT_CUR[0].SAFE_BSMGR_NM // 결재선 순서때문에 변경
      if(RDE[5].DISPLAY === "Y") dataCheck.RESP_DDMGR_NM = res.ORESULT_CUR[0].RESP_DDMGR_NM
      if(RDE[6].DISPLAY === "Y") dataCheck.RESP_BMMGR_NM = res.ORESULT_CUR[0].RESP_BMMGR_NM
      
      dataCheck.SAFE_TMMGR_NM = res.ORESULT_CUR[0].SAFE_TMMGR_NM
      dataCheck.SAFE_GAMGR_NM = res.ORESULT_CUR[0].SAFE_GAMGR_NM
      //dataCheck.SAFE_BSMGR_NM = res.ORESULT_CUR[0].SAFE_BSMGR_NM
      dataCheck.SAFE_GYMGR_NM = res.ORESULT_CUR[0].SAFE_GYMGR_NM
      dataCheck.SAFE_DDMGR_NM = res.ORESULT_CUR[0].SAFE_DDMGR_NM
      dataCheck.SAFE_BMMGR_NM = res.ORESULT_CUR[0].SAFE_BMMGR_NM

      // 한국어
      dataCheck.INJR_TMMGR_NM_KR = res.ORESULT_CUR[0].INJR_TMMGR_NM_KR
      dataCheck.INJR_GAMGR_NM_KR = res.ORESULT_CUR[0].INJR_GAMGR_NM_KR
      dataCheck.INJR_BSMGR_NM_KR = res.ORESULT_CUR[0].INJR_BSMGR_NM_KR
      dataCheck.INJR_DDMGR_NM_KR = res.ORESULT_CUR[0].INJR_DDMGR_NM_KR
      dataCheck.INJR_BMMGR_NM_KR = res.ORESULT_CUR[0].INJR_BMMGR_NM_KR
      dataCheck.INJR_BBMGR_NM_KR = res.ORESULT_CUR[0].INJR_BBMGR_NM_KR

      if(RDE[0].DISPLAY === "Y")dataCheck.RESP_VNDSB_NM_KR = res.ORESULT_CUR[0].RESP_VNDSB_NM_KR
      if(RDE[1].DISPLAY === "Y")dataCheck.RESP_VNDDP_NM_KR = res.ORESULT_CUR[0].RESP_VNDDP_NM_KR
      if(RDE[2].DISPLAY === "Y")dataCheck.RESP_TMMGR_NM_KR = res.ORESULT_CUR[0].RESP_TMMGR_NM_KR
      if(RDE[3].DISPLAY === "Y")dataCheck.RESP_GAMGR_NM_KR = res.ORESULT_CUR[0].RESP_GAMGR_NM_KR
      if(RDE[4].DISPLAY === "Y")dataCheck.RESP_BSMGR_NM_KR = res.ORESULT_CUR[0].RESP_BSMGR_NM_KR
      if(RDE[5].DISPLAY === "Y")dataCheck.RESP_DDMGR_NM_KR = res.ORESULT_CUR[0].RESP_DDMGR_NM_KR
      if(RDE[6].DISPLAY === "Y")dataCheck.RESP_BMMGR_NM_KR = res.ORESULT_CUR[0].RESP_BMMGR_NM_KR
      
      dataCheck.SAFE_TMMGR_NM_KR = res.ORESULT_CUR[0].SAFE_TMMGR_NM_KR
      dataCheck.SAFE_GAMGR_NM_KR = res.ORESULT_CUR[0].SAFE_GAMGR_NM_KR
      dataCheck.SAFE_BSMGR_NM_KR = res.ORESULT_CUR[0].SAFE_BSMGR_NM_KR
      dataCheck.SAFE_GYMGR_NM_KR = res.ORESULT_CUR[0].SAFE_GYMGR_NM_KR
      dataCheck.SAFE_DDMGR_NM_KR = res.ORESULT_CUR[0].SAFE_DDMGR_NM_KR
      dataCheck.SAFE_BMMGR_NM_KR = res.ORESULT_CUR[0].SAFE_BMMGR_NM_KR
      console.log(dataCheck, "ㅎㅎㅎㅎ", "dataCheck")
    }
  )

  // 추가로직
  let filteredObject  = {}
  let filteredObject1 = {} // 책임부서
  let filteredObject2 = {} // 재해부서
  for (const key in dataCheck) {
    const value = dataCheck[key]
    if (
      value !== "" &&
      value !== null &&
      !key.endsWith("_KR") &&
      key.endsWith("_NM") 
      &&
      key !== "RESP_VNDSB_NM" && 
      key !== "RESP_VNDDP_NM"
    ) {
      filteredObject[key] = value
      if (key.includes('RESP') || key.includes('SAFE')){
        filteredObject1[key] = value
      }
      if (key.includes('INJR')){
        filteredObject2[key] = value
      }
        
    }
  }
  approvalLine.value = Object.values(filteredObject)
    .map((value) => String(value))
    .join("; ")

  approvalLine1.value = Object.values(filteredObject1)
    .map((value) => String(value))
    .join("; ")
  
  approvalLine2.value = Object.values(filteredObject2)
    .map((value) => String(value))
    .join("; ")
    
  console.log(filteredObject, "filteredObject")
  console.log(approvalLine1, "resultString1")
  console.log(approvalLine2, "resultString2")
}

const empPopupOpen = (e) => {
  dataZip.value = e
  let name = dataZip.value + "_KR"
  console.log(e, "e")
  console.log(dataZip.value, " dataZip.value")
  console.log(name, " name..name.")
  console.log(dataCheck[name])
  empPopup.value.openPopup({ EMP_NM: dataCheck[name] })
}

const selectedemp = (row) => {
  let name = dataZip.value + "_KR"
  console.log(dataCheck,'dataCheck')
  dataCheck[name] = row.EMP_NM
  dataCheck[dataZip.value] = row.EMP_NO

  let filteredObject = {}

  let uniqueApprovalSet = new Set()
  let uniqueApprovalSet1 = new Set() // 책임부서
  let uniqueApprovalSet2 = new Set() // 재해부서

  for (const key in dataCheck) {
    const value = dataCheck[key]
    if (
      value !== "" &&
      value !== null &&
      !key.endsWith("_KR") &&
      key.endsWith("_NM") 
      &&
      key !== "RESP_VNDSB_NM" && 
      key !== "RESP_VNDDP_NM"
    ) {
      if (uniqueApprovalSet.has(value)) {
        Message.warn(
          t("중복된 값이 감지되었습니다. 중복된 값을 선택할 수 없습니다.")
        )
        dataCheck[name] = ""
        dataCheck[dataZip.value] = ""
        return
      }
      filteredObject[key] = value
      uniqueApprovalSet.add(value)
      if (key.includes('RESP') || key.includes('SAFE')){
        uniqueApprovalSet1.add(value)
      }
      if (key.includes('INJR')){
        uniqueApprovalSet2.add(value)
      }
    }
  }

  approvalLine.value = [...uniqueApprovalSet]
    .map((value) => String(value))
    .join("; ")
  approvalLine1.value = [...uniqueApprovalSet1]
    .map((value) => String(value))
    .join("; ")
  approvalLine2.value = [...uniqueApprovalSet2]
    .map((value) => String(value))
    .join("; ")
    
  console.log(filteredObject, "filteredObject")
  console.log(approvalLine, "resultString")
  console.log(approvalLine1, "resultString1")
  console.log(approvalLine2, "resultString2")
}

const onButtonsClick = (btn) => {

  // 내부결재
  if (btn.id === "btnInternalApply") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeApproval)
      .setConfirmMessage('결재상신 하시겠습니까?')
      .setQuery(approvalRun)
      .run()
  }

  // 저장
  if (btn.id === "btnUpdate") {
    vm.$swal({
      title: t("결재선을 저장하시겠습니까? "),
      showCancelButton: true,
    }).then((swalRes) => {
      if (swalRes.isConfirmed === true) {
        //  결재선 저장
        dataCheck.CMPNY_DIV = Popdata.CMPNY_DIV
        dataCheck.SAGO_SN = Popdata.SAGO_SN
        let saveParams = []
        saveParams.push(dataCheck)
        console.log(dataCheck, "dataCheck 저장")
        console.log(saveParams, "saveParams 저장")
        commonExecuteApi({
          queryId: "SAFAB0020_save16",
          list: saveParams,
        })
      }
    })
  }

  // 결재
  if (btn.id === "btnApply") {
    if (!isFile.value) {
      return Message.warn(
        t("사고 보고서가 첨부되어있지않습니다. 첨부 후 결재해주시기 바랍니다.")
      )
    }
    // 책임부서 직영 - 2024.10.21 김성일 매니저 요청으로 책임부서 필수 체크 해제 
    if (Popdata.RESPON_DIV === '1'){
      // if (!dataCheck.RESP_TMMGR_NM) {
      //   Message.err(t('책임부서 팀장을 선택해주세요.'))
      //   return false
      // }
      // if (!dataCheck.RESP_GAMGR_NM) {
      //   Message.err(t('책임부서 과장을 선택해주세요.'))
      //   return false
      // }
      // if (!dataCheck.RESP_BSMGR_NM) {
      //   Message.err(t('책임부서 부서장을 선택해주세요.'))
      //   return false
      // }
      // if (!dataCheck.RESP_DDMGR_NM) {
      //   Message.err(t('책임부서 담당임원을 선택해주세요.'))
      //   return false
      // }

      // 사고 구분 : 산재인경우 부문장 선택 확인
      if (Popdata.SAGO_TYPE_CD === 'SJE'){
        // if (!dataCheck.RESP_BMMGR_NM) {
        //   Message.err(t('책임부서 부문장을 선택해주세요.'))
        //   return false
        // }
      }
      
    // 책임부서 협력사  
    } else {
      // 오피스 결재는 소/반장, 대표 선택 확인 불필요
      // if (!dataCheck.RESP_VNDSB_NM) {
      //   Message.err(t('소/반장을 선택해주세요.'))
      //   return false
      // }

      // if (!dataCheck.RESP_VNDDP_NM) {
      //   Message.err(t('대표를 선택해주세요.'))
      //   return false
      // }

      // if (!dataCheck.RESP_BSMGR_NM) {
      //   Message.err(t('책임부서 부서장을 선택해주세요.'))
      //   return false
      // }
    }

    // 책임부서와 재해부서가 동일하지 않을 때 재해부서 부서장 체크
    if (Popdata.RESP_DEPT_CD !== Popdata.INJR_DEPT_CD){
      // if (!dataCheck.INJR_BSMGR_NM) {
      //   Message.err(t('재해부서 부서장을 선택해주세요.'))
      //   return false
      // }
    }
    
    // 조건 상관 없이 필수 값 체크
    if (!dataCheck.SAFE_BSMGR_NM) {
      Message.err(t('사업부안전 부서장을 선택해주세요.'))
      return false
    }

    // if (!approvalLine1.value) {
    //   return Message.warn(t("책임부서 / 사업부안전 결재선이 지정되어있지 않습니다."))
    // }

    // if (!approvalLine2.value) {
    //   return Message.warn(t("재해부서 결재선이 지정되어있지 않습니다."))
    // }

    vm.$swal({
      title: t("결재 상신하시겠습니까? <br> ※주의 결재선이 저장됩니다. "),
      showCancelButton: true,
    }).then((swalRes) => {
      if (swalRes.isConfirmed === true) {
        // 결재 파람
        let Date = `${dayjs(Popdata.OCCUR_DT).format('YYYY')}년 ${dayjs(Popdata.OCCUR_DT).format('MM')}월 ${dayjs(Popdata.OCCUR_DT).format('DD')}일`
        let hours = Popdata.OCCUR_TIME.substring(0, 2)
        let minutes = Popdata.OCCUR_TIME.substring(2)
        Popdata.OCCUR_TIME = `${hours}:${minutes}`
        let place = `${Popdata.SAGO_LOC_L_NM} ${Popdata.SAGO_LOC_M_NM} ${Popdata.SAGO_LOC_S_NM} ${Popdata.SAGO_LOC_DTL}`
        let sagoType =  ''
        switch(Popdata.SAGO_TYPE_CD) {
          case 'SJE':  // if (x === 'value1')
          sagoType = '산재(휴업일 3일이상)'
          break

          case 'GMS':  // if (x === 'value2')
          sagoType = '경미공상(직영)'
          break
          case 'HRS':  // if (x === 'value2')
          sagoType = '휴업 3일 이상 사고(협력사)'
          break
          case 'SNE':  // if (x === 'value2')
          sagoType = '휴업 3일 미만 일반사고 (직영/협력사)'
          break
        }

        console.log(sagoType,place,Popdata.OCCUR_TIME,Date)
        // 결재 로직 시작
        // 이너 html
        let sb = []
        sb.push(`<!DOCTYPE html>\n`)
        sb.push(`<html lang="en">\n`)
        sb.push(`<head>\n`)
        sb.push(`<meta charset="UTF-8">\n`)
        sb.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`)
        sb.push(`<title>Document</title>\n`)
        sb.push(`</head>\n`)
        sb.push(`<style type="text/css">\n`)
        sb.push(`.tg  {border-collapse:collapse;border-spacing:0;}\n`)
        sb.push(`.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;\n`)
        sb.push(`overflow:hidden;padding:10px 5px;word-break:normal;}\n`)
        sb.push(`.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;\n`)
        sb.push(`font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}\n`)
        sb.push(`.tg .tg-6qw1{background-color:#c0c0c0;text-align:center;vertical-align:top}\n`)
        sb.push(`.tg .tg-0lax{text-align:left;vertical-align:top}\n`)
        sb.push(`</style>\n`)
        sb.push(`<body>\n`)
        sb.push(`<p>아래와 같이 사고보고서 를 보고드리니, 확인 후 승인하여 주시기 바랍니다.</p>\n`)
        sb.push(`<table class="tg"><thead>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<th class="tg-6qw1">작업표준</th>\n`)
        sb.push(`<th class="tg-0lax">${isNullCheck(Popdata.WRK_STD_NM)}</th>\n`)
        sb.push(`</tr></thead>\n`)
        sb.push(`<tbody>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<td class="tg-6qw1">HI-Standard 개정 <br>필요여부</td>\n`)
        sb.push(`<td class="tg-0lax">${isNullCheck(Popdata.WIHEOM_YN)}</td>\n`)
        sb.push(`</tr>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<td class="tg-6qw1">발생일시</td>\n`)
        sb.push(`<td class="tg-0lax">${Date} ${Popdata.OCCUR_TIME}</td>\n`)
        sb.push(`</tr>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<td class="tg-6qw1">발생장소</td>\n`)
        sb.push(`<td class="tg-0lax">${place}</td>\n`)
        sb.push(`</tr>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<td class="tg-6qw1">사고형태</td>\n`)
        sb.push(`<td class="tg-0lax">${Popdata.SAGO_DIV_M_NM}</td>\n`)
        sb.push(`</tr>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<td class="tg-6qw1">사고처리 구분</td>\n`)
        sb.push(`<td class="tg-0lax">${sagoType}</td>\n`)
        sb.push(`</tr>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<td class="tg-6qw1">재해자 소속</td>\n`)
        sb.push(`<td class="tg-0lax">${inju.SOSOG_DESC}</td>\n`)
        sb.push(`</tr>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<td class="tg-6qw1">재해자명</td>\n`)
        sb.push(`<td class="tg-0lax">${inju.name}</td>\n`)
        sb.push(`</tr>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<td class="tg-6qw1">사고 개요</td>\n`)
        sb.push(`<td class="tg-0lax">${Popdata.SAGO_GAEYO}</td>\n`)
        sb.push(`</tr>\n`)
        sb.push(`<tr>\n`)
        sb.push(`<td class="tg-6qw1" colspan="2">\n`)
        for(let i = 0; i < fileName2.value.length; i++){
          sb.push("<a")
          sb.push(" href=")
          sb.push(`https://hises.hd.com/HiSEsFiles/HSE/XX08/30_safety/SAF_A/SAFAB0020/${fileName2.value[i]}`)
          sb.push(`> 파일 다운로드 링크</a>\n`)
        }
        sb.push(`</td>\n`)
        sb.push(`</tr>\n`)
        sb.push(`</tbody>\n`)
        sb.push(`</table>\n`)
        sb.push(`</body>\n`)
        sb.push(`</html>\n`)

        console.log(sb,'sb')

        let xmlSrc = sb.join("")
        approvalParams.BODY = xmlSrc
        // 결재선1 Set - 책임부서와 재해부서가 다른경우 approvalLine2
        approvalParams.APPROVER = approvalLine1.value

        //  결재선 저장
        dataCheck.CMPNY_DIV = Popdata.CMPNY_DIV
        dataCheck.SAGO_SN = Popdata.SAGO_SN
        let saveParams = []
        saveParams.push(dataCheck)

        commonExecuteApi({ queryId: "SAFAB0020_save16", list: saveParams })

        // 결재전 저장
        const today = dayjs().format("YYYYMMDDHHmmssSSS")
        let resId = logsStore.vueId + "_" + userStore.userId + "_" + today
        let DATA_KEY =
          userStore.cmpnyDiv +
          ";" +
          userStore.bsnsCd +
          ";" +
          userStore.deptCd +
          ";" +
          userStore.asgnCd +
          ";" +
          dayjs().format("YYYY") // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
        let saveApprovalParam = []
        let saveSearchData = {
          CMPNY_DIV: dataCheck.CMPNY_DIV,
          BUSINESS_UNIT: userStore.bsnsCd,
          USER_ID: userStore.userId,
          ACCESS_IP: userStore.clientIp,
          PGM_ID: logsStore.vueId,
          ZZ_RES_ID: resId,
          ZZ_FORMID: approvalParams.FORM_ID,
          ZZ_FORMNM: approvalParams.SUBJECT,
          ZZ_FORMTITLE: approvalParams.SUBJECT,
          ZZ_SYSKEY1: approvalParams.FORM_ID,
          ZZ_SYSKEY2: logsStore.vueId.substring(0, 5),
          ZZ_SYSKEY3: logsStore.vueId,
          ZZ_SYSKEY4: DATA_KEY,
          ZZ_APPDOC: xmlSrc,
          ZZ_PRE_APPKEY: "",
          ZZ_CALLBACK1: "",
          ZZ_CALLBACK2: "",
          ZZ_CALLBACK3: "",
          RES_COD: "",
          RES_MSG: "",
          RES_COL: "",
        }

        saveApprovalParam.push(saveSearchData)
        // 결재전 저장
        commonRequest("/hse/common/APPROVAL_SAVE_01", {
          queryId: "APPROVAL_SAVE_01",
          list: saveApprovalParam,
        }).then((res) => {
          let rcol = res.list.OUT_RES_COL
          let rmsg = res.list.OUT_RES_MSG
          let rcod = res.list.OUT_RES_COD
          let strZZ_RES_ID = rcol

          if (rcod != "0") {
            Message.err(t(rmsg))
            strZZ_RES_ID = ""

            return false
          }

          console.log("현중오피스 결재>>approvalParams: ", approvalParams)
          console.log("app: ", approvalLine.value)
          console.log("app1: ", approvalLine1.value)
          console.log("app2: ", approvalLine2.value)

          // 결재
          commonHiOfficeApproval(approvalParams).then((res) => {
            console.log("APPROVE:", res)
            let appret = res.body
            console.log(res.body, "res")
            // 로그기록
            let paramApp = {
              CMPNY_DIV: userStore.cmpnyDiv,
              ZZ_FORMTITLE: approvalParams.SUBJECT,
              ZZ_SYSKEY1: approvalParams.FORM_ID,
              ZZ_RES_ID: strZZ_RES_ID,
              appret: appret,
            }
            let afterparams = {
              userStore: userStore,
              params: paramApp,
              mgs: "결재상신 인터페이스 결과 로그 기록",
              crudGbn: "A", //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
              logDesc: "", //사유입력
              menuId: useLogsStore().menuId,
              menuNm: t(useLogsStore().menuId),
            }

            commonLogExecuteApi(afterparams)
            if (appret.substr(0, 1) != "S") {
              Message.err(t("결재 상신 시 HD 오피스 결재 전송 오류입니다"))
              strZZ_RES_ID = ""
              return false
            }

            let appkey = appret.substring(2)
            
            // 결재후 저장 (책임부서 / 사업부 안전)
            let approvalLineParam = {
              CMPNY_DIV: userStore.cmpnyDiv, //회사
              BUSINESS_UNIT: userStore.bsnsCd,
              USER_ID: approvalParams.AUTHOR_ID,
              ACCESS_IP: userStore.clientIp,
              PGM_ID: logsStore.vueId,
              ZZ_RES_ID: rcol, // 화면ID_유저ID_시분초 : EX. XXNNNNX_AXXXXXXX_YYYYMMDDHH24MISS
              ZZ_APPKEY: appkey, // 결재KEY
              ZZ_PRE_APPKEY: "", // 이전 결재KEY 사용안함
              ZZ_CLRLINE: approvalLine1.value, // 결재선(;로 분리)
              ZZ_COMMENT: "", // 상신자 코멘트
              RES_COD: "",
              RES_MSG: "",
              RES_COL: "",
            }

            let APPROVALSAVE = [
              {
                CMPNY_DIV: Popdata.CMPNY_DIV,
                SAGO_SN: Popdata.SAGO_SN,
                APPROVE_ID: rcol,
                DIV: "RESP",
              }
            ]
            commonExecuteApi({
              queryId: "SAFAB0020_APPROVAL_01" ,
              list: APPROVALSAVE ,
            })

            commonExecuteApi({
              queryId: "APPROVAL_APPUP_01",
              list: [approvalLineParam],
            }).then((res) => {
              console.log(res, "res 결재후")
              rcod = res.list[0].OUT_RES_COD
              rmsg = res.list[0].OUT_RES_MSG
              if (rcod != "0") {
                Message.err(t(rmsg))
                strZZ_RES_ID = ""

                return false
              } else {
                Message.info(t("결재를 상신 하였습니다."))
              }
            })
          })

          // 재해부서와 책임부서가 다른 경우 재해부서 결재
          if (Popdata.INJR_DEPT_CD !== Popdata.RESP_DEPT_CD){
            approvalParams.APPROVER = approvalLine2.value

            // 결재
            commonHiOfficeApproval(approvalParams).then((res) => {
              let appret = res.body
              console.log(res.body, "res")
              // 로그기록
              let paramApp = {
                CMPNY_DIV: userStore.cmpnyDiv,
                ZZ_FORMTITLE: approvalParams.SUBJECT,
                ZZ_SYSKEY1: approvalParams.FORM_ID,
                ZZ_RES_ID: strZZ_RES_ID,
                appret: appret,
              }
              let afterparams = {
                userStore: userStore,
                params: paramApp,
                mgs: "결재상신 인터페이스 결과 로그 기록",
                crudGbn: "A", //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
                logDesc: "", //사유입력
                menuId: useLogsStore().menuId,
                menuNm: t(useLogsStore().menuId),
              }

              commonLogExecuteApi(afterparams)

              if (appret.substr(0, 1) != "S") {
                Message.err(t("결재 상신 시 HD 오피스 결재 전송 오류입니다"))
                strZZ_RES_ID = ""
                return false
              }

              let appkey = appret.substring(2)

              // 결재후 저장 (재해부서)
              let approvalLineParam = {
                CMPNY_DIV: userStore.cmpnyDiv, //회사
                BUSINESS_UNIT: userStore.bsnsCd,
                USER_ID: approvalParams.AUTHOR_ID,
                ACCESS_IP: userStore.clientIp,
                PGM_ID: logsStore.vueId,
                ZZ_RES_ID: rcol, // 화면ID_유저ID_시분초 : EX. XXNNNNX_AXXXXXXX_YYYYMMDDHH24MISS
                ZZ_APPKEY: appkey, // 결재KEY
                ZZ_PRE_APPKEY: "", // 이전 결재KEY 사용안함
                ZZ_CLRLINE: approvalLine2.value, // 결재선(;로 분리)
                ZZ_COMMENT: "", // 상신자 코멘트
                RES_COD: "",
                RES_MSG: "",
                RES_COL: "",
              }

              let APPROVALSAVE = [
                {
                  CMPNY_DIV: Popdata.CMPNY_DIV,
                  SAGO_SN: Popdata.SAGO_SN,
                  APPROVE_ID: rcol,
                  DIV: "INJR",
                }
              ]
              commonExecuteApi({
                queryId: "SAFAB0020_APPROVAL_01",
                list: APPROVALSAVE,
              })

              commonExecuteApi({
                queryId: "APPROVAL_APPUP_01",
                list: [approvalLineParam],
              }).then((res) => {
                console.log(res, "res 결재후")
                rcod = res.list[0].OUT_RES_COD
                rmsg = res.list[0].OUT_RES_MSG
                if (rcod != "0") {
                  Message.err(t(rmsg))
                  strZZ_RES_ID = ""

                  return false
                } else {
                  Message.info(t("결재를 상신 하였습니다."))
                }
              })
            })
          }
        })
        // 결재후 저장
      }
    })

    // 결재
  }
  if (btn.id === "btnClose") {
    close()
  }
}

// 내부 결재 시작
const beforeApproval = () => {

  if (!isFile.value) {
    Message.warn(t("사고 보고서가 첨부되어있지않습니다. 첨부 후 결재해주시기 바랍니다."))
    return false
  }
  
  if (!dataCheck.RESP_VNDSB_NM) {
    Message.err(t('소/반장을 선택해주세요.'))
    return false
  }

  if (!dataCheck.RESP_VNDDP_NM) {
    Message.err(t('대표를 선택해주세요.'))
    return false
  }

  // 미리 결재선 저장
  dataCheck.CMPNY_DIV = Popdata.CMPNY_DIV
  dataCheck.SAGO_SN = Popdata.SAGO_SN
  let saveParams = []
  saveParams.push(dataCheck)
  commonExecuteApi({
    queryId: "SAFAB0020_save16",
    list: saveParams,
  })

  return true
}

const approvalRun = () => {
  let day = dayjs()
  const searchAddParams= ref([])
  let approvalParam = {
    CMPNY_DIV: userStore.cmpnyDiv, //로그인유저 사업부
    YEAR: day.$y, //결재올리는 년도
    APPROVE_ID:
      dataCheck.SAGO_SN +
      '_' +
      dataCheck.RESP_VNDSB_NM,
      // +
      // '_' +
      // day.$y +
      // (day.$M + 1).toString().padStart(2, '0') +
      // day.$D.toString().padStart(2, '0') +
      // day.$H.toString().padStart(2, '0') +
      // day.$m.toString().padStart(2, '0') +
      // day.$s.toString().padStart(2, '0'), //결재ID
    FORM_ID: 'SAFAB0020',
    APP_EMP_NO: dataCheck.RESP_VNDSB_NM,
    APPROVE_GBN: 'I', //I로고정(내부결재)
    APP_REQ_EMP_NO: userStore.userId, //결재상신자
    APP_STATUS: 'N', //결재상태는 미결로
    PATH: '/30_safety/SAF_A/SAFAB0020',
    USER_ID: userStore.userId, //로그인유저 아이디
  }

  let approvalParam2 = {
    CMPNY_DIV: userStore.cmpnyDiv, //로그인유저 사업부
    YEAR: day.$y, //결재올리는 년도
    APPROVE_ID:
      dataCheck.SAGO_SN +
      '_' +
      dataCheck.RESP_VNDDP_NM,
      // +
      // '_' +
      // day.$y +
      // (day.$M + 1).toString().padStart(2, '0') +
      // day.$D.toString().padStart(2, '0') +
      // day.$H.toString().padStart(2, '0') +
      // day.$m.toString().padStart(2, '0') +
      // day.$s.toString().padStart(2, '0'), //결재ID
    FORM_ID: 'SAFAB0020',
    APP_EMP_NO: dataCheck.RESP_VNDDP_NM,
    APPROVE_GBN: 'I', //I로고정(내부결재)
    APP_REQ_EMP_NO: userStore.userId, //결재상신자
    APP_STATUS: 'N', //결재상태는 미결로
    PATH: '/30_safety/SAF_A/SAFAB0020',
    USER_ID: userStore.userId, //로그인유저 아이디
  }
  searchAddParams.value.push(approvalParam)
  searchAddParams.value.push(approvalParam2)

  return commonSearchApi3({ 
    queryId : 'OPRAB0010_SAVE_01', 
    list: searchAddParams.value 
  }).then((res) => {
    console.log(res, "res 결재후")
    rcod = res.list[0].OUT_RES_COD
    rmsg = res.list[0].OUT_RES_MSG
    if (rcod != "0") {
      Message.err(t(rmsg))
      strZZ_RES_ID = ""

      return false
    } else {
      m_dialog.value = true
    }
  })
  // return Promise.all([
  //   commonExecuteApi({queryId: 'OPRAB0010_SAVE_01',list: [approvalParam],}),
  //   commonExecuteApi({queryId: 'OPRAB0010_SAVE_01',list: [approvalParam2],})
  // ]).then((res) => {

  // })
}

const close = () => {
  emit("upData")
  dialog.value = false
}

const minus = (Vmodel, Text, Index) => {
  console.log(Vmodel)
  dataCheck[Vmodel] = ""
  dataCheck[`${Vmodel}_KR`] = ""
  // 추가로직
  let filteredObject = {}
  for (const key in dataCheck) {
    const value = dataCheck[key]
    if (
      value !== "" &&
      value !== null &&
      !key.endsWith("_KR") &&
      key.endsWith("_NM") 
      &&
      key !== "RESP_VNDSB_NM" && 
      key !== "RESP_VNDDP_NM"
    ) {
      filteredObject[key] = value
    }
  }
  approvalLine.value = Object.values(filteredObject)
    .map((value) => String(value))
    .join("; ")
  approvalLine1.value = Object.values(filteredObject1)
    .map((value) => String(value))
    .join("; ")
  approvalLine2.value = Object.values(filteredObject2)
    .map((value) => String(value))
    .join("; ")

  console.log(approvalLine,  "approvalLine")
  console.log(approvalLine1, "approvalLine1")
  console.log(approvalLine2, "approvalLine2")
}

// 업로드
watch(
  () => fileUpload.value,
  (newValue) => {
    if (newValue !== null && newValue !== "" && newValue !== undefined) {
      checkFileId()
    }
  }
)

//  진술 파일 업로드
const checkFileId = () => {
  console.log("업로드 ")
  if (dataCheck.WRT_FILE_ID === null || dataCheck.WRT_FILE_ID === undefined) {
    fileUpload.value.setGuid()
    dataCheck.WRT_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(dataCheck.WRT_FILE_ID)
    dataCheck.WRT_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
}

const uploaded = () => {
  let param = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      WRT_FILE_ID: dataCheck.WRT_FILE_ID,
    },
  ]

  commonExecuteApi({ queryId: "SAFAB0020_save17", list: param }).then((res) => {
    console.log(res, "asdasdasdasdasczxcvxcv")
  })

  let fileParams = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    FILE_ID: dataCheck.WRT_FILE_ID,
  }
  commonSearchApi({ queryId: "searchFile", param: fileParams }).then((res) => {
    if (res.ORESULT_CUR.length > 0){
      fileName2.value = []
      for (let i = 0; i < res.ORESULT_CUR.length; i++){
        fileName2.value.push(res.ORESULT_CUR[i].FILE_NAME)
      }
      fileName.value = res.ORESULT_CUR[0].FILE_NAME
    }
  })
}

//널 체크 메서드
const isNullCheck = (data) => {
  return data === undefined || data === null || data === '' ? '' : data
}

const dataLength = (e) => {
  if (e !== 0) {
    isFile.value = true
  } else {
    isFile.value = false
  }
}
defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1100"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">안전사고 결재선</div>

    <v-card>
      <v-card-title class="my-2">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('결재선 지정')"
          :button-list="['btnInternalApply', 'btnApply', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        >
          <template #editors />
        </IMenuTitle>
      </v-card-title>

      <v-card-text class="overflowY">
        <div class="d-flex justify-space-between">

          <!-- 책임부서 -->
          <div>
            <div class="d-flex">
              <IGridTitle :title="$t('책임부서')">
                <template #editors /> 
              </IGridTitle>
              <div>
                <span style="font-size: 12px; color: #ef5350">
                  * 책임부서가 있을경우에만 지정하시면됩니다.
                </span>
              </div>
            </div>
            <div class="popUp-input-Form">
              <div
                v-for="(item, i) in RDE"
                :key="i"
                
              >
                <div v-if = "item.DISPLAY === 'Y'" class="d-flex align-center">
                  <i-input
                    :label="$t(item.Label)"
                    v-model="dataCheck[item.KOR]"
                    label-width="90px"
                    type="Text"
                    width="230px"
                    margin="10px"
                    append-inner-icon="mdi-magnify"
                    @click:appendInner="empPopupOpen(item.Vmodel)"
                    @keypress.enter="empPopupOpen(item.Vmodel)"
                    :disabled="item.DISABLE"
                  />
                  <v-btn
                    class="mr-3"
                    size="x-small"
                    @click="minus(item.Vmodel)"
                    icon="mdi-minus"
                    :disabled="item.DISABLE"
                  /> 
                  <!-- <v-btn v-if = "item.Vmodel === 'RESP_VNDSB_NM' || item.Vmodel === 'RESP_VNDDP_NM'"
                    class="mr-3"
                    size="x-small"
                    @click="minus(item.Vmodel)"
                    icon="mdi-clipboard"
                    :disabled="item.DISABLE"
                  />  -->
                </div>
              </div>
            </div>
          </div>

          <!-- 재해부서 -->
          <div>
            <IGridTitle :title="$t('재해부서')">
              <template #editors />
            </IGridTitle>
            <div class="popUp-input-Form">
              <div v-for="(item, i) in EM" :key="i" class="d-flex align-center">
                <i-input
                  :label="$t(item.Label)"
                  v-model="dataCheck[item.KOR]"
                  label-width="90px"
                  type="Text"
                  width="230px"
                  margin="10px"              
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="empPopupOpen(item.Vmodel)"
                  @keypress.enter="empPopupOpen(item.Vmodel)"
                  :disabled="item.DISABLE"
                />
                <v-btn
                  class="mr-3"
                  size="x-small"
                  @click="minus(item.Vmodel)"
                  icon="mdi-minus"
                  :disabled="item.DISABLE"
                />
              </div>
            </div>
          </div>

          <!-- 안전사업부 -->
          <div>
            <IGridTitle :title="$t('사업부안전')">
              <template #editors />
            </IGridTitle>
            <div class="popUp-input-Form">
              <div
                v-for="(item, i) in BSD"
                :key="i"
                class="d-flex align-center"
              >
                <i-input
                  :label="$t(item.Label)"
                  v-model="dataCheck[item.KOR]"
                  label-width="90px"
                  type="Text"
                  width="230px"
                  margin="10px"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="empPopupOpen(item.Vmodel)"
                  @keypress.enter="empPopupOpen(item.Vmodel)"
                />
                <v-btn
                  class="mr-3"
                  size="x-small"
                  @click="minus(item.Vmodel)"
                  icon="mdi-minus"
                />
              </div>
            </div>
          </div>

          <!-- 안전 경영부 -->
          <!-- <div>
            <IGridTitle :title="$t('안전 경영부')">
              <template #editors />
            </IGridTitle>

            <div class="popUp-input-Form">
              <div class="d-flex align-center">
                <i-input
                  :label="$t('확인자')"
                  v-model="dataCheck.SAFE_GYMGR_NM_KR"
                  label-width="90px"
                  type="Text"
                  width="230px"
                  margin="10px"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="empPopupOpen('SAFE_GYMGR_NM')"
                  @keypress.enter="empPopupOpen('SAFE_GYMGR_NM')"
                />
                <v-btn
                  class="mr-3"
                  size="x-small"
                  @click="minus(dataCheck.SAFE_GYMGR_NM, 15)"
                  icon="mdi-minus"
                />
              </div>
            </div>
          </div> -->
        </div>
        <!-- 2025.06.17 김성일 매니저 요청으로 파일 첨부 단건 → 다건으로 수정 (특수선 결재시 작업표준건으로 수정) -->
        <IUpload
          class="mt-3"
          gridTitle="사고보고서 등록"
          :showSearchMessage="false"
          ref="fileUpload"
          @uploaded="uploaded"
          :fileDan="false"
          style="height: 200px"
          @dataLength="dataLength($event)"
        />
      </v-card-text>
      <EmpPopup ref="empPopup" @selected="selectedemp" />
    </v-card>
  </VDialog>

  <v-dialog
    v-model="m_dialog"
    width="auto"
  >
    <v-card
      max-width="600"
      style="padding: 20px;"
      prepend-icon="mdi-information"
      text="협력사 결재가 상신되었습니다. 해당 소/반장, 대표는 Hi-SEs 내 승인,결재창에서 안전사고 보고서 결재바랍니다."
      title="알림"
    >
      <template v-slot:actions>
        <v-btn
          class="ms-auto"
          text="Ok"
          @click="m_dialog = false"
        ></v-btn>
      </template>
    </v-card>
  </v-dialog>


</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}

.popUp-input-Form > div {
  margin: 10px 0;
}
</style>
