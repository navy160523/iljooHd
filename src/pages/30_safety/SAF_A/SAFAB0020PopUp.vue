<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 사고 세부사항 팝업    -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue"
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
import SAFAB0020ApprovalLine from "@/pages/30_safety/SAF_A/SAFAB0020ApprovalLine .vue"

import { getQDomain } from '@/utils/common'
import OZReport  from "@/components/OZReport.vue"
import OZReport2 from "@/components/OZReport.vue"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const tab = ref(null)
const tab1 = ref(null)
const tab2 = ref(null)
const dataCheck = ref({})
const emit = defineEmits(["upData"])
const dataInner = reactive({})
const HSdataInner = reactive({})
const disasterInner = reactive({})
const ApprovalLine = ref(null)
const passPort = ref(null)
const visibleSago = ref(false)
// OzReport 팝업 여부
const showOz = ref(false)
const reportName = ref("")
const params = ref([])

// OzReport 팝업 여부
const showOz2 = ref(false)
const reportName2 = ref("")
const params2 = ref([])
const isMulti = ref(false)

const Url1 = ref("")
const Url2 = ref("")
const Url3 = ref("")
const visibleSagoAM = ref(false)
const btnList = reactive([
  { name: "조회", id: "Search", disabled: false, visible: true },
  { name: "결재", id: "Apply", disabled: false, visible: true },
  { name: "출력", id: "Print", disabled: false, visible: true },
  { name: "닫기", id: "Close", disabled: false, visible: true },
])

const intCode = () => {
  Promise.all([]).then((res) => {})
}

//  팝업 관련

const openPopup = async (popupParam, gbn) => {
  console.log("gbn", gbn)
  dataCheck.value = popupParam
  passPort.value = gbn
  tab.value = null

  console.log(passPort.value, "passPort.value")
  await searchData()
  dialog.value = true
}

const searchData = async () => {
  let param = {
    CMPNY_DIV: dataCheck.value.CMPNY_DIV,
    SAGO_SN: dataCheck.value.SAGO_SN,
  }

  await commonRequest("/hse/safety/SEARCH", {
    queryId: "SAFAB0020_search03",
    param: param,
  }).then((res) => {
    for (let i in res.ORESULT_CUR) {
      if (passPort.value === "passPort") {
        res.ORESULT_CUR[i].passPort = "Y"
      } else {
        res.ORESULT_CUR[i].passPort = "N"
      }

      dataInner[i] = res.ORESULT_CUR[i]
    }
    if (
      (dataInner[0].SAGO_TYPE_CD == "SJE" ||
        dataInner[0].SAGO_TYPE_CD == "GMS" ||
        dataInner[0].SAGO_TYPE_CD == "HRS") &&
      dataInner[0].APPROVAL_STATUS !== "즉보작성 진행" &&
      dataInner[0].APPROVAL_STATUS !== "즉보작성 완료"
    ) {
      visibleSago.value = true
    } else {
      visibleSago.value = false
    }
    if (
      (dataInner[0].SAGO_DIV_L === "E" || dataInner[0].SAGO_DIV_L === "D") &&
      (dataInner[0].COME_SERIOUS_YN === "Y" ||
        dataInner[0].COME_SERIOUS_YN === "S")
    ) {
      visibleSagoAM.value = true
    } else {
      visibleSagoAM.value = false
    }
  })
}

watch(
  () => dataInner[0],
  (newValue) => {
    console.log(newValue, 'watch1')

    if (tab.value === '사고 보고서'){
      if (newValue.APPROVAL_STATUS == "즉보작성 진행") {
        btnList.forEach((e) => {
          if (e.name === "결재" || e.name === "출력") {
            e.disabled = true
          }
        })
      } else {
        if (newValue.APPROVAL_STATUS == "보고서 안전확인 완료") {
          btnList.forEach((e) => {
            if (e.name === "결재" || e.name === "출력") {
              e.visible = true
              e.disabled = false
            }
          })
        } else {
          btnList.forEach((e) => {
            if (e.name === "결재") {
              e.visible = false
            }
            if (e.name === "출력") {
              e.disabled = false
            }
          })
        }
      }
    } else { // 사고보고서만 결재 버튼 필요 나머지 탭은 결재 필요 X
      btnList.forEach((e) => {
        if (e.name === "결재") {
          e.visible = false
        }
        // 산재사고 재발방지대책 이행점검은 출력 무조건 활성화
        if (e.name === "출력"){
          e.disabled = false
        }
      })
    }
  }
)

watch(
  () => tab.value,
  (newValue) => {
    btnList.forEach((e) => {
      // TAB1 사고 즉보 
      if (newValue === "사고즉보") {
        // 사고즉보는 결재 필요 없음
        if (e.name === "결재"){
          e.visible = false
        }

        // 즉보 작성 진행 단계 에서 출력 X
        if (dataInner[0].APPROVAL_STATUS === "즉보작성 진행") {
          if (e.name === "출력"){
            e.disabled = true
          } else {
            e.disabled = false
          }
        } else {
          e.disabled = false
        }

      // TAB2 사고 보고서  
      } else if (newValue === "사고 보고서") {
        // 보고서 안전 확인 완료 되면 결재 활성화
        if (dataInner[0].APPROVAL_STATUS === "보고서 안전확인 완료") {
          
          if (e.name === "결재") {
            e.visible = true
            e.disabled = false
          } else {
            e.disabled = false
          }
        }
        
      // TAB3 산재사고 재발방지대책 이행점검  
      } else if (newValue === "산재사고재발방지대책이행점검") {
        // 산재사고 재발방지대책 이행점검은 결재 필요 없음
        if (e.name === "결재"){
          e.visible = false
        }
        // 산재사고 재발방지대책 이행점검은 출력 무조건 활성화
        if (e.name === "출력"){
          e.disabled = false
        }
      }
    })

    /************************************************ 이전 소스 **************************************************************/
    // btnList.forEach((e) => {
    //   if (dataInner[0].APPROVAL_STATUS !== "즉보작성 진행") {
    //     if ( newValue === "사고관리" && (e.name === "결재" || e.name === "출력")) {
    //       e.disabled = true
    //     } else if ((newValue === "사고즉보" || newValue === "산재사고재발방지대책이행점검") && e.name === "결재") {
    //       e.disabled = true
    //     } else {
    //       e.disabled = false
    //     }
    //   }
    //   // if 종료
    // })

    // console.log(newValue, 'NewVal')
    // console.log(dataInner[0].APPROVAL_STATUS, 'AppStatus')
    // if ((newValue === "사고 보고서" || newValue === "산재사고재발방지대책이행점검") && dataInner[0].APPROVAL_STATUS === "보고서 안전확인 완료") {
    //   btnList.forEach((e) => {
    //     if (e.name === "결재" || e.name === "출력") {
          
    //       e.disabled = false
    //     }
    //   })
    // } else {
    //   btnList.forEach((e) => {
    //     if (e.name === "결재" || e.name === "출력") {
          
    //       e.disabled = true
    //     }
    //   })  
    // }
  }
)

const upData = () => {
  searchData()
}

const onButtonsClick = (e) => {
  if (e == "Close") {
    close()
  }

  if (e == "Search") {
    searchData()
  }
  if (e == "Apply") {
    ApprovalLine.value.openPopup(dataInner[0])
  }
  if (e == "Print") {
    if (tab.value == "사고즉보") {
      reportName.value = "/manage/hse/SAFAB0020_1.ozr"
      showOz.value = true
      console.log(dataCheck.value.SAGO_SN, "dataCheck.value.SAGO_SN")
      params.value = [
        "IN_CMPNY_DIV=" + dataCheck.value.CMPNY_DIV,
        "IN_SAGO_SN=" + dataCheck.value.SAGO_SN,
        // "Url1=" + Url1.value,
        // "Url2=" + Url2.value,
        // "Url3=" + Url3.value,
      ]
    }

    if (tab.value == "사고 보고서") {
      reportName.value = "/manage/hse/SAFAB0020_2_1.ozr"

      // reportName.value = "/manage/hse/ozsample.ozr";
      showOz.value = true

      params.value = [
        "IN_CMPNY_DIV=" + dataCheck.value.CMPNY_DIV,
        "IN_SAGO_SN=" + dataCheck.value.SAGO_SN,
        "IN_YEAR=" + dayjs().year(),
        // "Url1=" + Url1.value,
        // "Url2=" + Url2.value,
        // "Url3=" + Url3.value,
        // "Test=" + "N",
      ]
    }

    if (tab.value == "산재사고재발방지대책이행점검") {
      let dataRort = []
      params2.value = []

      commonSearchApi({
        queryId: 'SAFAB0020_search14',
        param: { CMPNY_DIV: dataCheck.value.CMPNY_DIV, SAGO_SN: dataCheck.value.SAGO_SN,},
      }).then((res) => {
        console.log('res: ', res)
        res.ORESULT_CUR.forEach((number) => {
          dataRort = [
            "IN_CMPNY_DIV=" + dataCheck.value.CMPNY_DIV,
            "IN_SAGO_SN=" + dataCheck.value.SAGO_SN,
            "IN_SEQ=" + number.SEQ,
          ]
          reportName.value = "/manage/hse/SAFAB0020_10N2.ozr"
          params2.value.push({ reportName: reportName.value, args: dataRort })
        });
      })
      
      // reportName.value = "/manage/hse/SAFAB0020_10.ozr"
      // showOz.value = true

      // params.value = [
      //   "IN_CMPNY_DIV=" + dataCheck.value.CMPNY_DIV,
      //   "IN_SAGO_SN=" + dataCheck.value.SAGO_SN,
      //   // "IN_YEAR=" + dayjs().year(),
      // ]
      // console.log(params.value, "params.value")

      isMulti.value = true
      showOz2.value = true
    }
  }
}

// const img1 = (e) => {
//   if (e) {
//     Url1.value = e
//   }
// }
// const img2 = (e) => {
//   if (e) {
//     Url2.value = e
//   }
// }
// const img3 = (e) => {
//   if (e) {
//     Url3.value = e
//   }
// }

const close = () => {
  dialog.value = false
  // console.log('popup close')
  emit("upData")
}

const upDngTab1 = () => {
  upData()
  
  if(tab2.value != null) {
    tab2.value.searchDNG()
  }
}

const upDngTab2 = () => {
  upData()
  
  if(tab1.value != null) {
    tab1.value.searchDNG()
  }
}

defineExpose({
  openPopup,
})
</script>
<!-- if(dataInner[0].SAGO_DIV_L === "B"){
  visibleSagoAM.value = false
} -->
<template>
  <VDialog
    v-model="dialog"
    persistent
    transition="dialog-bottom-transition"
    fullscreen
  >
    <VContainer style="background-color: white; height: 100%; min-height: 100%">
      <v-tabs v-model="tab" class="align">
        <v-tab value="사고즉보">{{ t("사고즉보") }}</v-tab>
        <v-tab value="사고 보고서" v-if="((visibleSago || visibleSagoAM) && dataInner[0].SAGO_DIV_L !== 'B') || dataInner[0].COME_SERIOUS_YN === 'Y'" >{{
          t("사고 보고서")
        }}</v-tab> <!-- 2025.04.01 김성일 매니저 요청으로 사고 강도가 중대성 사고 이면 조건 상관 없이 사고 보고서 활성화 -->
        <!-- <v-tab value="사고관리">{{ t("사고관리") }}</v-tab> -->
        <v-tab
        v-if="dataInner[0].SAGO_TYPE_CD == 'SJE' && dataInner[0].SAGO_DIV_L == 'A'"
          value="산재사고재발방지대책이행점검"
          >{{ t("산재사고 재발방지대책 이행점검") }}</v-tab
        >
        <v-spacer />

        <v-btn
          v-for="(item, i) in btnList"
          :key="i"
          @click="onButtonsClick(item.id)"
          :disabled="item.disabled"
          :style="`display:${item.visible ? '' : 'none'}`"
        >
          {{ item.name }}
        </v-btn>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="사고즉보">
          <SAFAB0020PopUpTab1
            ref="tab1"
            :popupParam="dataInner[0]"
            @upData="upData"
            @upDngTab1="upDngTab1"
            @close="close"
            @img1="img1($event)"
            @img2="img2($event)"
            @img3="img3($event)"
          />
        </v-window-item>

        <v-window-item value="사고 보고서">
          <SAFAB0020PopUpTab2
            ref="tab2"
            :popupParam="dataInner[0]"
            @upData="upData"
            @upDngTab2="upDngTab2"
            @close="close"
          />
        </v-window-item>

        <!-- <v-window-item value="사고관리">
          <SAFAB0020PopUpTab3 :popupaPram="dataInner[0]" @upData="upData" />
        </v-window-item> -->
        <v-window-item
          value="산재사고재발방지대책이행점검">
          <SAFAB0020PopUpTab4
            :popupParam="dataInner[0]"
            @upData="upData"
            v-if="dataInner[0].SAGO_TYPE_CD == 'SJE'"
          />
        </v-window-item>
      </v-window>

      <SAFAB0020ApprovalLine ref="ApprovalLine" @upData="upData" />
      <OZReport
        :showPop="showOz"
        :reportName="reportName"
        :params="params"
        @close="showOz = $event"
      />
      <OZReport2
        :showPop="showOz2"
        :MultiArr="params2"
        :isMulti="(isMulti = true)"
        @close="showOz2 = $event"
        @falseMulti="isMulti = $event"
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
