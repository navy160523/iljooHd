<!-- SPPDB0010 위험기계기구 안전검사 -->
<!-- SI2팀 김성근 2024-04-09 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import dayjs from "dayjs"
import { useUserStore } from "@hiway/stores/user"
import { commonSampleDownFilesApi} from "@hiway/api/commonFileApi"
import { getJsonFromExcel } from "@/utils/excel"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import SPPDA0010Change from "@/pages/50_safety-support/SPP_D/SPPDA0010PopUp.vue"
import SPPDA0010Add from "@/pages/50_safety-support/SPP_D/SPPDA0010PopUp1.vue"
import Tab1 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab1.vue"
import Tab2 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab2.vue"
import Tab3 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab3.vue"
import Tab4 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab4.vue"
import Tab5 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab5.vue"
import Tab6 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab6.vue"
import Tab7 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab7.vue"
import Tab8 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab8.vue"
import Tab9 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab9.vue"
import Tab10 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab10.vue"
import Tab11 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab11.vue"
import Tab12 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab12.vue"
import Tab13 from "@/pages/50_safety-support/SPP_D/SPPDA0010Tab13.vue"

defineOptions({
  name: "50_safety-support-SPP_D-SPPDA0010",
})

const userStore = useUserStore()
const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const NOCMPNY = ref(true)
const NOBSNS = ref(true)
const NOGUACD = ref(true)
const tab = ref('two')
const menuTitle = ref(null)
const grdMain = ref(null) 
const empPopup = ref(null)
const ChangePopUp = ref(null)
const NewTestPopUp = ref(null)
const intData = ref([])
const intData_uploaded = ref([])
 
const hueCode = reactive({
  SYS_CDNM: "",
  SYS_CD: "",
  CMPNY_DIV: "",
})
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  INSTALL_DT_FR: dayjs().subtract(6, 'month').format("YYYY-MM-DD"),
  INSTALL_DT_TO: dayjs().format("YYYY-MM-DD"),
  EXPIRATION_TO: dayjs().add(3, "year").format("YYYY-MM-DD"),
  TEST_CMPNY_DIV: userStore.cmpnyDiv,
})
const addRun = ref(false)
const codeList = reactive({})
const initCodeList = reactive({
  FB110: [],
  F810: [],
  F810A: [],
  F812: [],
  F815: [],
  FB140: [],
  FB150: [],
})
const flag_pop_tab1 = ref(false)
const flag_pop_tab2 = ref(false)
const flag_pop_tab3 = ref(false)
const flag_pop_tab4 = ref(false)
const flag_pop_tab5 = ref(false)
const flag_pop_tab6 = ref(false)
const flag_pop_tab7 = ref(false)
const flag_pop_tab8 = ref(false)
const flag_pop_tab9 = ref(false)
const flag_pop_tab10 = ref(false)
const flag_pop_tab11 = ref(false)
const flag_pop_tab12 = ref(false)
const flag_pop_tab13 = ref(false)
const tab1 = ref(null)
const tab2 = ref(null)
const tab3 = ref(null)
const tab4 = ref(null)
const tab5 = ref(null)
const tab6 = ref(null)
const tab7 = ref(null)
const tab8 = ref(null)
const tab9 = ref(null)
const tab10 = ref(null)
const tab11 = ref(null)
const tab12 = ref(null)
const tab13 = ref(null)
const TestParams = ref({
  CMPNY_DIV: userStore.cmpnyDiv,
  STATUS: "30",
  PLAN_DT_FR: dayjs().startOf("year").format("YYYYMMDD"),
  PLAN_DT_TO: dayjs().endOf("year").format("YYYYMMDD"),
})

onMounted(() => {
  // 일괄양식 다운 및 올리기 가리기
  menuTitle.value.setBtnProperty('btnFormDown',   'visible', false)              
  menuTitle.value.setBtnProperty('btnFromUpload', 'visible', false)  
  menuTitle.value.setBtnProperty('btnUpdate', 'visible', false)                
  menuTitle.value.setBtnProperty('btnSearch', 'visible', true)  

  Promise.all([
    getCodeList("HHIZ000"), //회사구분 조회
    getCodeList("HHIFB110"), //상태 조회
    commonSearchApi({
      queryId: "SPPDA0010_SEARCH_05",
      param: TestParams.value,
    }),

    getCodeList("HHIF810"), // 810
    getCodeList("HHIF810A"), // 810A
    getCodeList("HHIF812"), // 812
    getCodeList("HHIF815"), // 815

    getCodeList("HHIFB140"), // B140
    getCodeList("HHIFB150"), // B150
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.STATUS = res[1].ORESULT_CUR
    codeList.STATUS.unshift({ TXT: "전체", COD: "" })
    codeList.Test = res[2].ORESULT_CUR
    codeList.Test.unshift({ TEST_ID: "전체", TEST_ID: "" })

    initCodeList.FB110 = res[1].ORESULT_CUR
    initCodeList.F810 = res[3].ORESULT_CUR
    initCodeList.F810A = res[4].ORESULT_CUR
    initCodeList.F812 = res[5].ORESULT_CUR
    initCodeList.F815 = res[6].ORESULT_CUR
    initCodeList.FB140 = res[7].ORESULT_CUR
    initCodeList.FB150 = res[8].ORESULT_CUR
  })
})

const onButtonsClick = async(btn) => {
  if (btn.id === "btnSearch") {
    let search = {}

    search = { ...searchParams }

    if (search.EXPIRATION_TO) {
      search.EXPIRATION_TO = dayjs(search.EXPIRATION_TO).format("YYYYMMDD")
    }
    if (search.INSTALL_DT_TO) {
      search.INSTALL_DT_TO = dayjs(search.INSTALL_DT_TO).format("YYYYMMDD")
    }
    if (search.INSTALL_DT_FR) {
      search.INSTALL_DT_FR = dayjs(search.INSTALL_DT_FR).format("YYYYMMDD")
    }
    if (search.EXPIRATION_FR) {
      search.EXPIRATION_FR = dayjs(search.EXPIRATION_FR).format("YYYYMMDD")
    }

    search.PORT_CRANE_YN = 'N'
    switch (tab.value) {
      case "one":
        search.EQUIP_KIND = ''
        tab1.value.getData(search)
        break
      case "two":
        search.EQUIP_KIND = 'A'
        tab2.value.getData(search)
        break
      case "three":
        search.EQUIP_KIND = 'B'
        tab3.value.getData(search)
        break
      case "four":
        search.EQUIP_KIND = 'C'
        tab4.value.getData(search)
        break
      case "five":
        search.EQUIP_KIND = 'D'
        tab5.value.getData(search)
        break
      case "six":
        search.EQUIP_KIND = 'E'
        tab6.value.getData(search)
        break
      case "seven":
        search.EQUIP_KIND = 'G'
        tab7.value.getData(search)
        break
      case "eight":
        search.EQUIP_KIND = 'A'
        search.PORT_CRANE_YN = 'Y'
        tab8.value.getData(search)
        break
      case "nine":
        search.EQUIP_KIND = 'I'
        tab9.value.getData(search)
        break
      case "ten":
        search.EQUIP_KIND = 'J'
        tab10.value.getData(search)
        break
      case "eleven":
        search.EQUIP_KIND = 'K'
        tab11.value.getData(search)
        break
      case "twelve":
        break
      case "thirteen":
        search.EQUIP_KIND = 'M'
        tab13.value.getData(search)
        break

      default:
        search.EQUIP_KIND = ''
    }
  }
  if (btn.id === "btnBATCH_CHANGE_HAZARDOUS_MACHINE_INFORMATION") {
    ChangePopUp.value.openPopup()
  }
  if (btn.id === "btnNewTest") {
    switch (tab.value) {
      case "one":
        flag_pop_tab1.value = true
        break
      case "two":
        flag_pop_tab2.value = true
        break
      case "three":
        flag_pop_tab3.value = true
        break
      case "four":
        flag_pop_tab4.value = true
        break
      case "five":
        flag_pop_tab5.value = true
        break
      case "six":
        flag_pop_tab6.value = true
        break
      case "seven":
        flag_pop_tab7.value = true
        break
      case "eight":
        flag_pop_tab8.value = true
        break
      case "nine":
        flag_pop_tab9.value = true
        break
      case "ten":
        flag_pop_tab10.value = true
        break
      case "eleven":
        flag_pop_tab11.value = true
        break
      case "twelve":
        flag_pop_tab12.value = true
        break
      case "thirteen":
        flag_pop_tab13.value = true
        break

      default:
        flag_pop_tab11.value = true
    }
  }

  if(btn.id == 'btnFormDown'){
    let params = {
      PATH : 'Excel',
      FILE_PATH: 'SPP_D',
      FILE_NAME: 'FB4014.xlsx',
    };
    commonSampleDownFilesApi(params);
  
  }
  
  if(btn.id == 'btnFromUpload'){
    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  }
  
  if(btn.id == 'btnUpdate'){

    let param = []

    for (let i in intData_uploaded.value) {
        param[i] = intData_uploaded.value[i]
        param[i].TEST_TYPE = '기본'
        if(!isValidDateRange(param[i].INSTALL_DT)){
            console.log(param[i].INSTALL_DT)
            Message.err(t(`잘못된 데이터입니다. [날짜] ${param[i].EQUIP_KIND} ,  ${param[i].EQUIP_SEQ}`),)
            return
        } 
        await commonSearchApi({ queryId: "EDUDC0020_TAB01_SEARCH_03" , param: {CMPNY_DIV: 'HHI', EMP_NO : param[i].CHARGE_EMP_NO}}).then(res=>{
          if (res.ORESULT_CUR[0]){
            param[i].CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
            param[i].CHARGE_COMPANY =  res.ORESULT_CUR[0].CMPNY_DIV
            param[i].USE_DEPT_COMPANY =  res.ORESULT_CUR[0].CMPNY_DIV
            param[i].USE_DEPT_CD =  res.ORESULT_CUR[0].DEPT_CD
          }
          else{
            console.log(res.ORESULT_CUR[0])
            Message.err(t(`잘못된 데이터입니다. [사용부서담당자]  ${param[i].EQUIP_KIND} ,  ${param[i].EQUIP_SEQ}`),)
            return
          }
        })
        await commonSearchApi({ queryId: "EDUDC0020_TAB01_SEARCH_03" , param: {CMPNY_DIV: 'HHI', EMP_NO : param[i].ITMANAGER_EMPNO}}).then(res=>{
          if (res.ORESULT_CUR[0]){
            param[i].MANAGE_COMPANY =  res.ORESULT_CUR[0].CMPNY_DIV
            param[i].MANAGE_ASGN_CD =  res.ORESULT_CUR[0].ASGN_CD
            param[i].MANAGE_DEPT_CD =  res.ORESULT_CUR[0].DEPT_CD
          }
          else{
            console.log(res.ORESULT_CUR[0])
            Message.err(t(`잘못된 데이터가 존재합니다. [관리부서담당자]   ${param[i].EQUIP_KIND} ,  ${param[i].EQUIP_SEQ}`),)
            return
          }
        })
      }
    commonExecuteApi({ queryId: "SPPDA0010_SAVE_01", list: param }).then((res) =>{
      Message.info('일괄 업로드되었습니다.')
    })
  }
}

const isValidDateRange = (yyyymmdd) => {
    // 문자열을 숫자로 변환
    const year = parseInt(yyyymmdd.substring(0, 4), 10);
    const month = parseInt(yyyymmdd.substring(4, 6), 10);
    const day = parseInt(yyyymmdd.substring(6, 8), 10);

    // 유효한 월(1~12)인지 확인
    if (month < 1 || month > 12) return false;

    // 해당 연월의 마지막 날짜 구하기
    const lastDay = new Date(year, month, 0).getDate();

    // 1일 이상 말일 이하인지 확인
    return day >= 1 && day <= lastDay;
}

//엑셀 업로드 이벤트
const excelUploadCallback = (excelData) => {
  let mappedData = []

  excelData.forEach((i,idx) => {
    if(idx < 6) return
    
    let items = {
      EQUIP_KIND: i['위험기계기구 일괄등록 양식'], // 장비군
      EQUIP_SEQ: i['__EMPTY']  ?  String(i['__EMPTY']): '', // 장비 seq, 신규면 빈값이 들어가야함.
      CHARGE_EMP_NO: String(i['__EMPTY_1']), // 관리부서 담당자
      ITMANAGER_EMPNO : String(i['__EMPTY_2']),     // 사용부서 담당자
      EQUIP_NO: String(i['__EMPTY_3']),           // 장비번호
      TRMS_NO: String(i['__EMPTY_4']),            // 설비번호
      STATUS: String(i['__EMPTY_5']),             // 장비상태
      INSTALL_PLACE: String(i['__EMPTY_6']),      // 설치위치
      INSTALL_DT: String(i['__EMPTY_7']),                //설치일자 
      MAKER: String(i['__EMPTY_8']),                  //제조사
    }
    mappedData.push(items)
  })

  intData_uploaded.value = []
  for (let i in mappedData) {
    intData_uploaded.value[i] = mappedData[i]
  }
}

// //  관리조직 변경 감지
watch(
  () => searchParams.MANAGE_CMPNY_DIV,
  (newValue) => {
    if (!newValue) {
      NOCMPNY.value = true
      searchParams.MANAGE_DEPT_CD = ""
      searchParams.MANAGE_GUA_CD = ""
      searchParams.MANAGE_TEAM_CD = ""
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: newValue, BSNS_CD: "", USE_DIV: "Y" },
      }).then((res) => {
        searchParams.MANAGE_DEPT_CD = ""
        codeList.MANAGE_DEPT_CD = res.ORESULT_CUR
        codeList.MANAGE_DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        NOCMPNY.value = false
      })
    }
  }
)

// //  관리조직 변경 감지
watch(
  () => searchParams.MANAGE_DEPT_CD,
  (newValue) => {
    console.log(newValue)
    if (!newValue || newValue == "") {
      NOBSNS.value = true
      searchParams.MANAGE_GUA_CD = ""
      searchParams.MANAGE_TEAM_CD = ""
    } else {
      let param = {
        CMPNY_DIV: searchParams.MANAGE_CMPNY_DIV,
        DEPT_CD: searchParams.MANAGE_DEPT_CD,
        CLSS_CD: "60",
      }
      commonSearchApi({
        queryId: "SPPDA0010_COMBO_01",
        param: param,
      }).then((res) => {
        searchParams.MANAGE_GUA_CD = ""
        codeList.MANAGE_GUA_CD = res.ORESULT_CUR
        codeList.MANAGE_GUA_CD.unshift({ TXT: "전체", COD: "" })
        NOBSNS.value = false
      })
    }
  }
)

// //  관리조직 변경 감지
watch(
  () => searchParams.MANAGE_GUA_CD,
  (newValue) => {
    if (!newValue || newValue == "") {
      NOGUACD.value = true
      searchParams.MANAGE_TEAM_CD = ""
    } else {
      let param = {
        CMPNY_DIV: searchParams.MANAGE_CMPNY_DIV,
        DEPT_CD: searchParams.MANAGE_DEPT_CD,
        GUA_CD: searchParams.MANAGE_GUA_CD,
        CLSS_CD: "70",
      }
      commonSearchApi({
        queryId: "SPPDA0010_COMBO_01",
        param: param,
      }).then((res) => {
        searchParams.MANAGE_TEAM_CD = ""
        codeList.MANAGE_TEAM_CD = res.ORESULT_CUR
        codeList.MANAGE_TEAM_CD.unshift({ TXT: "전체", COD: "" })
        NOGUACD.value = false
      })
    }
  }
)



// 탭 12번일때만 버튼보이게
watch(
  () => tab.value,
  (newValue) => {
    intData.value = []
    if (newValue === "twelve"){
      menuTitle.value.setBtnProperty('btnFormDown',   'visible', true)              
      menuTitle.value.setBtnProperty('btnFromUpload', 'visible', true)      
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)     
      menuTitle.value.setBtnProperty('btnSearch', 'visible', false)     

    }
    else{
      menuTitle.value.setBtnProperty('btnFormDown',   'visible', false)              
      menuTitle.value.setBtnProperty('btnFromUpload', 'visible', false)  
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false)                
      menuTitle.value.setBtnProperty('btnSearch', 'visible', true)       
    }
  }
)



const updataMain = () => {
  onButtonsClick({ id: "btnSearch" })
}

const flagfalse = (e) => {
  switch (tab.value) {
    case "one":
      flag_pop_tab1.value = false
      break
    case "two":
      flag_pop_tab2.value = false
      break
    case "three":
      flag_pop_tab3.value = false
      break
    case "four":
      flag_pop_tab4.value = false
      break
    case "five":
      flag_pop_tab5.value = false
      break
    case "six":
      flag_pop_tab6.value = false
      break
    case "seven":
      flag_pop_tab7.value = false
      break
    case "eight":
      flag_pop_tab8.value = false
      break
    case "nine":
      flag_pop_tab9.value = false
      break
    case "ten":
      flag_pop_tab10.value = false
      break
    case "eleven":
      flag_pop_tab11.value = false
      break
    case "twelve":
      flag_pop_tab12.value = false
      break
    case "thirteen":
      flag_pop_tab13.value = false
      break
    default:
      flag_pop_tab11.value = false
  }
  NewTestPopUp.value.openPopup(e)
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',
          'btnBATCH_CHANGE_HAZARDOUS_MACHINE_INFORMATION',
          'btnNewTest',
          'btnUpdate',
          'btnFormDown',
          'btnFromUpload'
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-3">
            <i-select
              width="220px"
              :label="$t('회사')"
              label-width="49px"
              margin="10px"
              placeholder="회사"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.company"
              item-value="COD"
              item-title="TXT"
              required
            />
            <!--<i-input
              width="210px"
              :label="$t('설치일자')"
              v-model="searchParams.INSTALL_DT_FR"
              type="date"
              margin="4px"
            />
            <i-input
              width="160px"
              :label="$t('-')"
              type="date"
              v-model="searchParams.INSTALL_DT_TO"
              margin="10px"
            />-->
            <i-input
              width="210px"
              :label="$t('만료일자')"
              v-model="searchParams.EXPIRATION_FROM"
              type="date"
              margin="4px"
            />
            <i-input
              width="160px"
              :label="$t('-')"
              type="date"
              v-model="searchParams.EXPIRATION_TO"
              margin="10px"
            />

            <i-input
              width="200px"
              :label="$t('장비번호')"
              type="text"
              v-model="searchParams.EQUIP_NO"
            />
          </div>
          <div class="d-flex">
            <i-select
              width="220px"
              :label="$t('관리조직')"
              margin="4px"
              placeholder="회사"
              v-model="searchParams.MANAGE_CMPNY_DIV"
              :items="codeList.company"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              width="200px"
              margin="4px"
              placeholder="사업부"
              v-model="searchParams.MANAGE_DEPT_CD"
              :items="codeList.MANAGE_DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :disabled="NOCMPNY"
            />
            <i-select
              width="240px"
              margin="4px"
              placeholder="부서"
              v-model="searchParams.MANAGE_GUA_CD"
              :items="codeList.MANAGE_GUA_CD"
              item-value="COD"
              item-title="TXT"
              :disabled="NOBSNS"
            />
            <i-select
              width="240px"
              margin="10px"
              placeholder="팀"
              v-model="searchParams.MANAGE_TEAM_CD"
              :items="codeList.MANAGE_TEAM_CD"
              item-value="COD"
              item-title="TXT"
              :disabled="NOGUACD"
            />
            <i-select
              :label="$t('상태')"
              width="180px"
              margin="10px"
              v-model="searchParams.STATUS"
              :items="codeList.STATUS"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('검사대상조회')"
              width="240px"
              margin="10px"
              v-model="searchParams.TEST_ID"
              :items="codeList.Test"
              item-value="TEST_ID"
              item-title="TEST_ID"
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <!-- 텝 -->
          <VTabs v-model="tab" center-active >
            <VTab value="one">공통</VTab>
            <VTab value="two">크레인</VTab> 
            <VTab value="three">압력용기</VTab>
            <VTab value="four">리프트</VTab>
            <VTab value="five">프레스</VTab>
            <VTab value="six">전단기</VTab>
            <VTab value="seven">곤돌라</VTab>
            <VTab value="eight">항만크레인</VTab>
            <VTab value="nine">컨베이어</VTab>
            <VTab value="ten">산업용로봇</VTab>
            <VTab value="eleven">이동식카크레인</VTab>
            <VTab value="thirteen">환기설비</VTab>
            <VTab value="twelve">일괄양식올리기</VTab>
          </VTabs>
          <!-- 텝아이템 -->
          <VWindow v-model="tab">
            <VWindowItem value="one">
              <Tab1
                ref="tab1"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab1"
                :intData="intData"
                :codeList="initCodeList"
              />
            </VWindowItem>
            <VWindowItem value="two">
              <Tab2
                ref="tab2"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab2"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="three">
              <Tab3
                ref="tab3"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab3"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="four">
              <Tab4
                ref="tab4"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab4"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="five">
              <Tab5
                ref="tab5"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab5"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="six">
              <Tab6
                ref="tab6"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab6"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="seven">
              <Tab7
                ref="tab7"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab7"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="eight">
              <Tab8
                ref="tab8"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab8"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="nine">
              <Tab9
                ref="tab9"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab9"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="ten">
              <Tab10
                ref="tab10"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab10"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="eleven">
              <Tab11
                ref="tab11"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab11"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="thirteen">
              <Tab13
                ref="tab13"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab13"
                :intData="intData"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
            <VWindowItem value="twelve">
              <Tab12
                ref="tab12"
                :tab="tab"
                @flagfalse="flagfalse($event)"
                :flag_pop="flag_pop_tab12"
                :intData="intData_uploaded"
                :codeList="initCodeList"
                @updataMain="updataMain"
              />
            </VWindowItem>
          </VWindow> 
        </v-sheet>
      </div>
    </v-card-text>
    <SPPDA0010Change ref="ChangePopUp" />
    <SPPDA0010Add ref="NewTestPopUp" />
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  //height: calc(100vh - 219px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}

.v-tab {
  width: 120px;
}
</style>
