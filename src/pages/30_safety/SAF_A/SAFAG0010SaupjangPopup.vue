<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 산재정보 등록/현황  사업장 선택팝업-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { value } from "lodash-es"
import queryFlowHelper from "@/utils/searchFlowHelper"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import { useUserStore } from "@hiway/stores/user"
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from "@hiway/utils/notify"
import OZReport from "@/components/OZReport.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(["selected", "upDataRow"])
const dialog = ref(false)

const userStore = useUserStore() //유저정보

// OzReport 팝업 여부
const showOz = ref(false)
const reportName = ref("")
const params = ref([])
const GuBunValue = ref("")
const valueCheck = ref("")

// 데이터 바인딩

const MainSearchParams = reactive({})

const printData = reactive({})

//팝업 오픈

//오픈팝업

const openPopup = (popupParam, DateData, GuBun) => {
  // 초기화
  valueCheck.value = ""
  printData.popupParam = []
  printData.DateData = []

  printData.popupParam = popupParam
  printData.DateData = DateData
  GuBunValue.value = GuBun

  dialog.value = true
}

// 그리드 데이터입력 0: 최초요양 1:재요양

// const print_01 = ()=>{

//   reportName.value = '/manage/hse/SAFAG0010_01.ozr'
//     showOz.value = true

//     const year = day =>{
//         let Result = new Date(day).getFullYear()
//         return Result
//       }
//       const month = day =>{
//         let Result = String(new Date(day).getMonth() + 1).padStart(2, '0')
//         return Result
//       }
//       const day = day =>{
//         let Result = String(new Date(day).getDate()).padStart(2, '0')
//         return Result
//       }
//       let YOGBN = ''
//       switch(printData.popupParam.YOGBN)
//       {
//             case 0:
//               if(printData.popupParam.SJE_TYPE_CD == "01"){
//                 YOGBN ="[V] 업무상 사고      [ ] 업무상 질병(진폐․CS2 포함)      [ ] 출퇴근 재해"
//               }
//               else if(printData.popupParam.SJE_TYPE_CD == "02"){
//                 YOGBN ="[ ] 업무상 사고      [V] 업무상 질병(진폐․CS2 포함)      [ ] 출퇴근 재해"
//               }
//               else if(printData.popupParam.SJE_TYPE_CD == "03"){
//                 YOGBN = "[ ] 업무상 사고      [ ] 업무상 질병(진폐․CS2 포함)      [V] 출퇴근 재해"
//               }
//               break
//             case 1:  YOGBN = "[ ] 업무상 사고      [ ] 업무상 질병(진폐․CS2 포함)      [ ] 출퇴근 재해"
//                      break
//             default: YOGBN = "[ ] 업무상 사고      [ ] 업무상 질병(진폐․CS2 포함)      [ ] 출퇴근 재해"
//                       break
//             }

//     console.log(YOGBN)

//     params.value = [
//       "IN_KOR_NM="+printData.popupParam.KOR_NM,
//       "IN_REG_NO="+printData.popupParam.REG_NO,
//       "IN_ADDR="+printData.popupParam.ADDR,
//       "IN_TELNO1="+printData.popupParam.TELNO1,
//       "IN_OCCURDATE_DESC="+`${year( printData.popupParam.OCCURDATE)}년 ${month( printData.popupParam.OCCURDATE )}월 ${day( printData.popupParam.OCCURDATE)}일 ${printData.popupParam.OCCURTIME ? printData.popupParam.OCCURTIME.substring(0,2)+"시" + printData.popupParam.OCCURTIME.substring(2,4)+"분" : ''}`,
//       "IN_COM_ENT_DATE_DESC="+`${year( printData.DateData.COM_ENT_DATE)}년 ${month( printData.DateData.COM_ENT_DATE )}월 ${day( printData.DateData.COM_ENT_DATE )}일`,
//       "IN_UNT_DUTY_NM="+printData.popupParam.UNT_DUTY_NM,
//       "IN_YOGBN="+YOGBN,
//       "IN_nowDate="+`${dayjs().$y}년 ${dayjs().$M + 1}월 ${dayjs().$D}일`,
//       "IN_SAGOGAEYO="+printData.popupParam.SAGOGAEYO,
//       "IN_SAUPJANG="+ ` ${ valueCheck.value === 'HD현대중공업' ?  'HD현대중공업': 'HD한국조선해양'}`,
//       "IN_SAUPJU="+ ` ${valueCheck.value === 'HD현대중공업' ?  '한영석,이상균' : '권오갑,가삼현' }` ,
//       "IN_SAUPJANGTELNO="+ ` ${valueCheck.value === 'HD현대중공업' ?  '052-202-2206': '052-202-2206'}`,
//       "IN_SAUPJANGNUMBER="+ ` ${valueCheck.value === 'HD현대중공업' ?  '907-00-78050-1': '919-19-59856-1'}`,
//       "IN_SAUPJANGJUSO="+ ` ${valueCheck.value === 'HD현대중공업' ?  '울산광역시 동구 방어진순환도로 1000  현대중공업': ' 서울특별시 종로구 율곡로 75 (계동)'}`,

//     ]

// }

// const print_02 = ()=>{
//   reportName.value = '/manage/hse/SAFAG0010_02.ozr'
//     showOz.value = true

//     const year = day =>{
//         let Result = new Date(day).getFullYear()
//         return Result
//       }
//       const month = day =>{
//         let Result = String(new Date(day).getMonth() + 1).padStart(2, '0')
//         return Result
//       }
//       const day = day =>{
//         let Result = String(new Date(day).getDate()).padStart(2, '0')
//         return Result
//       }

//     params.value = [
//       "IN_KOR_NM="+printData.popupParam.KOR_NM,
//       "IN_REG_NO="+printData.popupParam.REG_NO,
//       "IN_ADDR="+printData.popupParam.ADDR,
//       "IN_TELNO1="+printData.popupParam.TELNO1,
//       "IN_OCCURDATE_DESC="+`${year( printData.popupParam.OCCURDATE)}년 ${month( printData.popupParam.OCCURDATE )}월 ${day( printData.popupParam.OCCURDATE)}일`,
//       "IN_YESORNO="+ `${printData.popupParam.HAP_YN ==='Y' ? "[V]예 2. [ ]아니오" : " [ ]예 2. [V]아니오"}`,
//       "IN_HAPAMT_DESC="+`${printData.popupParam.HAP_YN ==='Y' ? printData.popupParam.HAPAMT : '' }` ,
//       "IN_HAPDTE_DESC=" +  `${printData.popupParam.HAP_YN ==='Y' ? printData.popupParam.HAPDTE : '' }` ,
//       "IN_NOWDATE="+`${dayjs().$y}년 ${dayjs().$M + 1}월 ${dayjs().$D}일`,
//       "IN_SAGOGAEYO="+printData.popupParam.SAGOGAEYO,
//       "IN_SAUPJANG="+ ` ${ valueCheck.value === 'HD현대중공업' ?  'HD현대중공업': 'HD한국조선해양'}`,
//       "IN_SAUPJU="+ ` ${valueCheck.value === 'HD현대중공업' ?  '한영석,이상균' : '권오갑,가삼현' }` ,
//       "IN_SAUPJANGTELNO="+ ` ${valueCheck.value === 'HD현대중공업' ?  '052-202-2206': '052-202-2206'}`,
//       "IN_SAUPJANGNUMBER="+ ` ${valueCheck.value === 'HD현대중공업' ?  '907-00-78050-1': '919-19-59856-1'}`,
//       "IN_SAUPJANGJUSO="+ ` ${valueCheck.value === 'HD현대중공업' ?  '울산광역시 동구 방어진순환도로 1000  현대중공업': ' 서울특별시 종로구 율곡로 75 (계동)'}`,

//     ]

// }

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn === "btnClose") {
    dialog.value = false
  } else if (btn === "btnPrint") {
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
    width="400"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">사업관련 입력창</div>
    <VContainer style="background-color: white">
      <!-- 최상단 -->
      <VRow class="my-1 popUp-input-Form">
        <!-- 1번째 -->
        <VCol cols="12">
          <v-row>
            <VCol cols="12" md="12">
              <i-input label="출력사유입력" />
            </VCol>
          </v-row>
        </VCol>

        <VCol class="mt-2" style="display: flex; justify-content: flex-end">
          <v-btn class="mr-2" @click="onButtonsClick('btnPrint')"> 출력 </v-btn>
          <v-btn @click="onButtonsClick('btnClose')"> 닫기 </v-btn>
        </VCol>
      </VRow>

      <OZReport
        :showPop="showOz"
        :reportName="reportName"
        :params="params"
        @close="showOz = $event"
      />
    </VContainer>
  </VDialog>
</template>
<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
