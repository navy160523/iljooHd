<!-- SI2팀 김성근  위험작업 허가서 현황 / 작업장소선택 팝업  -->
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
import { update, value } from "lodash-es"
import Message from "@hiway/utils/notify"
import { useUserStore } from "@hiway/stores/user"
import queryFlowHelper from "@/utils/searchFlowHelper"
import block from "@/pages/30_safety/SAF_B/SAFBA0010WorkPlaceblock.vue"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dataInt = reactive({})
const dataIntE = reactive({})
const gunbn = ref({})
const dtes = ref("")
const dialog = ref(false)
const grdMain = ref(null)
const grdDetail = ref(null)
const emit = defineEmits(["selected"])
const TypeL = ref("")
const blockPopUp = ref(null)
const codeList = reactive({})
const intFlag = ref(false)
const DivS = ref({})
const hwa = ref(true)
const DANG_DIV = ref("")
const ae00YN = ref(false)
const pcsYN = ref(false)
const fmaYN = ref(false)

const openPopup = (popupParam, Type) => {
  console.log(popupParam, "popupParam??")
  DANG_DIV.value = popupParam.DANG_DIV

  if (popupParam.DANG_DIV === "H00" || popupParam.DANG_DIV === "P00") {
    //화기, 도장일 때 pcs, fma 활성화
    hwa.value = false
  } else {
    hwa.value = true
  }
  gunbn.value = popupParam
  TypeL.value = Type
  if (Type === "D") {
    // 장소 [대]
    for (let i in dataInt) {
      dataInt[i] = []
    }
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_07",
      param: { BSNS_CD: gunbn.value.JOB_BSNS_CD, SHIP_NO: gunbn.value.WORK_NO },
    }).then((res) => {
      codeList.DIV_L = res.ORESULT_CUR
    })
  }

  if (Type === "E") {
    // 구조물
    for (let i in dataInt) {
      dataIntE[i] = []
    }
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_11",
      param: { SHIP_NO: gunbn.value.WORK_NO, LVL: 2, UP_BLK_SEQ: 1 },
    }).then((res) => {
      codeList.LVL1 = res.ORESULT_CUR
    })
  }

  if(gunbn.value.JOB_BSNS_CD === 'AE00'){
    ae00YN.value = true
  }else{
    ae00YN.value = false
  }

  pcsYN.value = false
  fmaYN.value = false

  dialog.value = true
}

//   DIV_M : 중분류    DIV_S: 블록/소분류

const check_cross = (DANG_DIV, DIV_M, DIV_S, DIV_L) => {
  console.log("check_cross",DANG_DIV , DIV_M, DIV_S, DIV_L)

  if(DIV_L){
    if(DIV_L.length > 0) {
      if (TypeL.value === "D" || TypeL.value === "E") {
          if (DANG_DIV === 'H00'){
            if (!DIV_S){
              console.log('1')
              Message.warn('화기작업은 호선/공사 선택 시 장소에 블록정보까지 의무 기입입니다.')
              return false
            }
          } 
      }
    }
  }

  return true
}


const onButtonsClick = (btn) => {
  if (btn.id === "btnChk") {


    let DIVLM = ''
    let DIVMM = ''

    if (TypeL.value === "D") {
      if (!dataInt.DIV_L || !dataInt.DIV_M) {
        if (codeList.DIV_L.length > 0) {  // 대분류가 있는 경우에는 꼭 선택해야 함
          return Message.warn(t("필수입력조건을 확인해주십시오."))
        }
        dataInt.DIV_L_NM = ''
        dataInt.DIV_M_NM = ''
      }
      else {

        DIVLM = codeList.DIV_L.filter((x) => x.COD === dataInt.DIV_L)
        DIVMM = codeList.DIV_M.filter((x) => x.COD === dataInt.DIV_M)
        dataInt.DIV_L_NM = DIVLM[0].TXT
        dataInt.DIV_M_NM = DIVMM[0].TXT
      }

      if(gunbn.value.JOB_BSNS_CD === 'AE00') {
        if(!dataInt.DIV_DESC){
          return Message.warn(t("특수선사업부는 상세위치 필수입력입니다."))
        }
      }

      console.log('codeList.PCS_DIV',codeList.PCS_DIV)
      console.log('codeList.FMA_DIV',codeList.FMA_DIV)

      if (DANG_DIV.value === "H00" || DANG_DIV.value === "P00") {
        if(!dataInt.PCS_DIV){
          if(codeList.PCS_DIV){
            if (codeList.PCS_DIV.length > 1) {  // PCS가 있는 경우에는 꼭 선택해야 함
              return Message.warn(t("P/C/S를 선택해주세요"))
            }
          }
        }

        if(!dataInt.FMA_DIV){
          if(codeList.FMA_DIV){
            if (codeList.FMA_DIV.length > 1) {  // FMA가 있는 경우에는 꼭 선택해야 함
              return Message.warn(t("F/M/A를 선택해주세요"))
            }
          }
        }
      }

      if (check_cross(DANG_DIV.value, dataInt.DIV_M, dataInt.DIV_S, codeList.DIV_L)){
        emit("selected", dataInt)
        dialog.value = false
      }
      
    }

    if (TypeL.value === "E") {
      if(gunbn.value.WORK_NO != 'Y251'){
        if (
          !dataIntE.LVL1 ||
          !dataIntE.LVL2 ||
          !dataIntE.LVL3 ||
          !dataIntE.LVL4
        ) {        
          return Message.warn(t("필수입력조건을 확인해주십시오."))        
        }

        let DIVLM = codeList.LVL1.filter((x) => x.COD === dataIntE.LVL1)
        let DIVMM = codeList.LVL2.filter((x) => x.COD === dataIntE.LVL2)
        let DIVSM = codeList.LVL3.filter((x) => x.COD === dataIntE.LVL3)
        let DIVS2M = codeList.LVL4.filter((x) => x.COD === dataIntE.LVL4)
        if (dataIntE.LVL5) {
          let DIVS3M = codeList.LVL5.filter((x) => x.COD === dataIntE.LVL5)
          dataIntE.DIV_S3_NM = DIVS3M[0].TXT
          dataIntE.DIV_S3 = dataIntE.LVL5
        }

        dataIntE.DIV_L = dataIntE.LVL1
        dataIntE.DIV_L_NM = DIVLM[0].TXT
        dataIntE.DIV_M = dataIntE.LVL2
        dataIntE.DIV_M_NM = DIVMM[0].TXT
        dataIntE.DIV_S = dataIntE.LVL3
        dataIntE.DIV_S_NM = DIVSM[0].TXT
        dataIntE.DIV_S2 = dataIntE.LVL4
        dataIntE.DIV_S2_NM = DIVS2M[0].TXT

        if (check_cross(DANG_DIV.value, dataIntE.DIV_S, dataIntE.DIV_S2, codeList.DIV_L)){
          emit("selected", dataIntE)
          dialog.value = false
        }        

      }else{
        if(!dataIntE.DIV_DESC){
          return Message.warn(t("필수입력조건을 확인해주십시오."))
        } else {
          emit("selected", dataIntE)
          dialog.value = false
        }
      }            
    }
  }
  if (btn.id == "btnClose") {
    dialog.value = false
  }
}
const openBlock = () => {
  if (TypeL.value === "D") {
    blockPopUp.value.openPopup(gunbn.value, dataInt.block, "1")
  }
  if (TypeL.value === "E") {
    blockPopUp.value.openPopup(gunbn.value, dataIntE.block, "2")
  }
}

const selected = (row) => {
  if (TypeL.value === "D") {
    dataInt.DIV_L = row.DIV_L
    dataInt.DIV_M = row.DIV_M
    setTimeout(() => {
      dataInt.DIV_S = row.DIV_S
    }, 100)
  }
  if (TypeL.value === "E") {
    dataIntE.LVL1 = row.DIV_L
    dataIntE.LVL2 = row.DIV_M
    dataIntE.LVL3 = row.DIV_S
    dataIntE.LVL4 = row.DIV_S2
    dataIntE.LVL5 = row.DIV_S3
  }
}

// D타입

// 장소 [대] 변경시
watch(
  () => dataInt.DIV_L,
  (newValue) => {
    if (!intFlag.value) {
      dataInt.DIV_M = ""
    }
    // D타입
    if (TypeL.value === "D") {
      console.log
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_08",
        param: {
          BSNS_CD: gunbn.value.JOB_BSNS_CD,
          SHIP_NO: gunbn.value.WORK_NO,
          L_CD: newValue,
        },
      }).then((res) => {
        codeList.DIV_M = res.ORESULT_CUR
      })
    }
  }
)

// 장소 [중] 변경시
watch(
  () => dataInt.DIV_M,
  (newValue) => {
    if (!intFlag.value) {
      dataInt.DIV_S = ""      
    }
    // D타입
    if (TypeL.value === "D") {
      if (newValue) {
        dataInt.PCS_DIV = ""
        dataInt.FMA_DIV = ""
        codeList.PCS_DIV = [{ COD: "", TXT: "" }]
        codeList.FMA_DIV = [{ COD: "", TXT: "" }]

        let result = ""        
        if (codeList.DIV_M) {
          //console.log("codeList.DIV_M", codeList.DIV_M)
          //console.log("DIV_M newValue", newValue)
          result = codeList.DIV_M.filter((x) => x.COD === newValue)
        }
        console.log("result", result)
        pcsYN.value = false
        fmaYN.value = false        

        //  PCS
        if (result[0].DIV_COD2) {
          if (result[0].DIV_COD2.includes("P")) {            
            codeList.PCS_DIV.unshift({ COD: "P", TXT: "P:Port" })
            pcsYN.value = true
          }
          if (result[0].DIV_COD2.includes("C")) {
            codeList.PCS_DIV.unshift({ COD: "C", TXT: "C:Center" })
            pcsYN.value = true
          }
          if (result[0].DIV_COD2.includes("S")) {
            codeList.PCS_DIV.unshift({ COD: "S", TXT: "S:Starboard" })
            pcsYN.value = true
          }

          // FMA
          if (result[0].DIV_COD2.includes("F")) {
            codeList.FMA_DIV.unshift({ COD: "F", TXT: "F:Forward" })
            fmaYN.value = true
          }
          if (result[0].DIV_COD2.includes("M")) {
            codeList.FMA_DIV.unshift({ COD: "M", TXT: "M:Middle" })
            fmaYN.value = true
          }
          if (result[0].DIV_COD2.includes("A")) {
            codeList.FMA_DIV.unshift({ COD: "A", TXT: "A:After" })
            fmaYN.value = true
          }

          if (DANG_DIV.value === "H00" || DANG_DIV.value === "P00") {
          } else {
            pcsYN.value = false
            fmaYN.value = false
          }
        }
      }

      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_09",
        param: {
          BSNS_CD: gunbn.value.JOB_BSNS_CD,
          SHIP_NO: gunbn.value.WORK_NO,
          L_CD: dataInt.DIV_L,
          M_CD: newValue,
        },
      }).then((res) => {
        codeList.DIV_S = res.ORESULT_CUR
      })
    } else {
      dataInt.PCS_DIV = ""
      dataInt.FMA_DIV = ""
      codeList.PCS_DIV = [{ COD: "", TXT: "" }]
      codeList.FMA_DIV = [{ COD: "", TXT: "" }]
    }
  }  
)

// 장소 [소] 변경시
watch(
  () => dataInt.DIV_S,
  (newValue) => {    
    // D타입
    if (TypeL.value === "D") {
      if (newValue) {
        dataInt.PCS_DIV = ""
        dataInt.FMA_DIV = ""
        codeList.PCS_DIV = [{ COD: "", TXT: "" }]
        codeList.FMA_DIV = [{ COD: "", TXT: "" }]
        let result = ""
        if (codeList.DIV_S) {
          result = codeList.DIV_S.filter((x) => x.TXT === dataInt.DIV_S)
        }
        console.log("result", result)        

        //  PCS
        if (result[0].DIV_COD2) {
          if (result[0].DIV_COD2.includes("P")) {
            codeList.PCS_DIV.unshift({ COD: "P", TXT: "P:Port" })
            pcsYN.value = true
          }
          if (result[0].DIV_COD2.includes("C")) {
            codeList.PCS_DIV.unshift({ COD: "C", TXT: "C:Center" })
            pcsYN.value = true
          }
          if (result[0].DIV_COD2.includes("S")) {
            codeList.PCS_DIV.unshift({ COD: "S", TXT: "S:Starboard" })
            pcsYN.value = true
          }

          // // FMA
          if (result[0].DIV_COD2.includes("F")) {
            codeList.FMA_DIV.unshift({ COD: "F", TXT: "F:Forward" })
            fmaYN.value = true
          }
          if (result[0].DIV_COD2.includes("M")) {
            codeList.FMA_DIV.unshift({ COD: "M", TXT: "M:Middle" })
            fmaYN.value = true
          }
          if (result[0].DIV_COD2.includes("A")) {
            codeList.FMA_DIV.unshift({ COD: "A", TXT: "A:After" })
            fmaYN.value = true
          } 
          
          if (DANG_DIV.value === "H00" || DANG_DIV.value === "P00") {
          } else {
            pcsYN.value = false
            fmaYN.value = false
          }
        }
      }
    } else {
      dataInt.PCS_DIV = ""
      dataInt.FMA_DIV = ""
      codeList.PCS_DIV = [{ COD: "", TXT: "" }]
      codeList.FMA_DIV = [{ COD: "", TXT: "" }]
    }
  }
)

// E타입
watch(
  () => dataIntE.LVL1,
  (newValue) => {
    if (!intFlag.value) {
      dataIntE.LVL2 = ""
      dataIntE.LVL3 = ""
      dataIntE.LVL4 = ""
      dataIntE.LVL5 = ""
    }
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_11",
      param: { SHIP_NO: gunbn.value.WORK_NO, LVL: 3, UP_BLK_SEQ: newValue },
    }).then((res) => {
      codeList.LVL2 = res.ORESULT_CUR
    })
  }
)
watch(
  () => dataIntE.LVL2,
  (newValue) => {
    if (!intFlag.value) {
      dataIntE.LVL3 = ""
      dataIntE.LVL4 = ""
      dataIntE.LVL5 = ""
    }
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_11",
      param: { SHIP_NO: gunbn.value.WORK_NO, LVL: 4, UP_BLK_SEQ: newValue },
    }).then((res) => {
      codeList.LVL3 = res.ORESULT_CUR
    })
  }
)
watch(
  () => dataIntE.LVL3,
  (newValue) => {
    if (!intFlag.value) {
      dataIntE.LVL4 = ""
      dataIntE.LVL5 = ""
    }
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_11",
      param: { SHIP_NO: gunbn.value.WORK_NO, LVL: 5, UP_BLK_SEQ: newValue },
    }).then((res) => {
      codeList.LVL4 = res.ORESULT_CUR
    })
  }
)
watch(
  () => dataIntE.LVL4,
  (newValue) => {
    if (!intFlag.value) {
      dataIntE.LVL5 = ""
    }
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_11",
      param: { SHIP_NO: gunbn.value.WORK_NO, LVL: 6, UP_BLK_SEQ: newValue },
    }).then((res) => {
      codeList.LVL5 = res.ORESULT_CUR
    })
  }
)
defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="540"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move mb-0"
      @mousedown="startDragging"
    >
      <span>작업위치 선택</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnChk', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- Type D  해야할일 :  위험작업분류가 화기 일경우만 P/C/S ,F/A/S 활성화-->
      <div class="pa-5" v-if="TypeL === 'D'">
        <i-select
          v-if = "codeList.DIV_L.length > 0"
          :label="t('대분류')"
          top-label
          :items="codeList.DIV_L"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          v-model="dataInt.DIV_L"
          @click="intFlag = false"
          required
        />
        <i-select
          v-else
          :label="t('대분류')"
          top-label
          :items="codeList.DIV_L"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          v-model="dataInt.DIV_L"
          @click="intFlag = false"
        />
        <i-select
          v-if = "codeList.DIV_L.length > 0"
          top-label
          :label="t('중분류')"
          :items="codeList.DIV_M"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          v-model="dataInt.DIV_M"
          @click="intFlag = false"
          required
        />
        <i-select
          v-else
          top-label
          :label="t('중분류')"
          :items="codeList.DIV_M"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          v-model="dataInt.DIV_M"
          @click="intFlag = false"
        />

        <div class="d-flex align-end">
          <i-select
            top-label
            width="350px"
            :label="t('블록')"
            :items="codeList.DIV_S"
            item-title="TXT"
            item-value="COD"
            margin="4px"
            v-model="dataInt.DIV_S"
            @click="intFlag = false"
          />
          <!-- required -->
          <i-input
            :label="t('')"
            append-inner-icon="mdi-magnify"
            width="150px"
            @keydown.enter="
              (e) => {
                openBlock()
              }
            "
            @click:appendInner="openBlock()"
            @click="intFlag = true"
            v-model="dataInt.block"
          />
        </div>
        <i-input top-label :label="t('상세위치')" v-model="dataInt.DIV_DESC" 
          :required="ae00YN"
        />
        <i-select
          top-label
          :label="t('P/C/S 구분')"
          :items="codeList.PCS_DIV"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          :disabled="hwa"
          v-model="dataInt.PCS_DIV"
          :required="pcsYN"
        />
        <i-select
          top-label
          :label="t('F/M/A 구분')"
          :items="codeList.FMA_DIV"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          :disabled="hwa"
          v-model="dataInt.FMA_DIV"
          :required="fmaYN"
        />
      </div>
      <!-- Location Type - E -->
      <div class="pa-5" v-else>
        <i-select
          v-if = "codeList.LVL1.length > 0"
          :label="t('구조물')"
          top-label
          :items="codeList.LVL1"
          v-model="dataIntE.LVL1"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          @click="intFlag = false"
          required
        />
        <i-select
          v-else
          :label="t('구조물')"
          top-label
          :items="codeList.LVL1"
          v-model="dataIntE.LVL1"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          @click="intFlag = false"
          :disabled="gunbn.WORK_NO==='Y251'"
        />


        <i-select
          v-if = "codeList.LVL1.length > 0"
          top-label
          :label="t('대분류')"
          :items="codeList.LVL2"
          v-model="dataIntE.LVL2"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          @click="intFlag = false"
          required
        />
        <i-select
          v-else
          top-label
          :label="t('대분류')"
          :items="codeList.LVL2"
          v-model="dataIntE.LVL2"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          @click="intFlag = false"
          :disabled="gunbn.WORK_NO==='Y251'"
        />
        <i-select
          v-if = "codeList.LVL1.length > 0"
          top-label
          :label="t('중분류')"
          :items="codeList.LVL3"
          v-model="dataIntE.LVL3"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          @click="intFlag = false"
          required
        />
        <i-select
          v-else
          top-label
          :label="t('중분류')"
          :items="codeList.LVL3"
          v-model="dataIntE.LVL3"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          @click="intFlag = false"
          :disabled="gunbn.WORK_NO==='Y251'"
        />


        <div class="d-flex align-end">
          <i-select
            top-label
            width="350px"
            :label="t('소분류')"
            :items="codeList.LVL4"
            v-model="dataIntE.LVL4"
            item-title="TXT"
            item-value="COD"
            margin="4px"
            @click="intFlag = false"
            :required="gunbn.WORK_NO != 'Y251'"
            :disabled="gunbn.WORK_NO==='Y251'"
          />
          <i-input
            :label="t('')"
            append-inner-icon="mdi-magnify"
            width="150px"
            @keydown.enter="
              (e) => {
                openBlock()
              }
            "
            @click:appendInner="openBlock()"
            @click="intFlag = true"
            v-model="dataIntE.block"
            required
            :disabled="gunbn.WORK_NO==='Y251'"
          />
        </div>
        <i-select
          top-label
          :label="t('세분류')"
          :items="codeList.LVL5"
          v-model="dataIntE.LVL5"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          @click="intFlag = false"
          :disabled="gunbn.WORK_NO==='Y251'"
        />
        <i-input top-label :label="t('상세위치')" v-model="dataIntE.DIV_DESC" :required="gunbn.WORK_NO === 'Y251'"/>
      </div>
    </v-card>
    <block ref="blockPopUp" @selected="selected($event)" />
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
div {
  margin-bottom: 8px;
}
</style>
