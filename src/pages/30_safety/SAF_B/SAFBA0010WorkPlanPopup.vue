<!-- SI2팀 김성근  위험작업 허가서 현황 / 작업표준서 선택팝업 -->
<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest ,
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { update, value, isEmpty } from "lodash-es"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import OZReport from "@/components/OZReport.vue"


const emit = defineEmits(["selected"]) ;
const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)

const menuTitle = ref(null)
const showOz = ref(false)
const reportName = ref('')
const ozParams = ref([])
const isMulti = ref()
const params = ref([])

const codeList = reactive({
  
})

let searchParam = reactive({
  CMPNY_DIV: "",
  RCV_NO: "",
  SHORT_WORK_NO: "",
})

const detailData = reactive({
  CMPNY_DIV: "",
  RCV_NO: "",
  BIZ_REG_NO: "",
  SHORT_WORK_NO: "",
  VND_NAME: "",
  WORK_DT: "",
  WRK_DIST: "",
  JOB_SPLC_NM: "",
  WORK_DESC: "",
  OVERWGT_TYPE: "",
  OVERWGT_WGT: "",
  HEAVY_EQUIP_TYPE: "",
  DANG_DESC: "",
  DRIVE_DESC: "",
  RESP_EMP_NM: "",
  RESP_HP_NO: "",
  RESP_EMP_NM2: "",
  WORK_START_TIME: "",    
  WORK_END_TIME: "",    
  JOB_LPLC: "",    
  JOB_MPLC: "",    
  JOB_SPLC: "",    
  WRK_STG: "",    
  WRK_TYP: "",    
  WRK_CD: "",    
  STATUS: "",    
  DANG_DIV: "",    
  P_WRK_ID: "",    
  CF_DIV: "",
  WRK_PLAN_YN:"",
  PTW_STATUS:"",
})

const initCodeList = () => {
 
}

const openPopup = popupParam => {
  //   초기화
  console.log(popupParam, "popupParam")
  searchParam.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParam.RCV_NO = popupParam.RCV_NO
  searchParam.BIZ_REG_NO = ""
  searchParam.SHORT_WORK_NO = popupParam.SHORT_WORK_NO

  detailData.CMPNY_DIV = popupParam.CMPNY_DIV
  detailData.BIZ_REG_NO = "" 
  detailData.RCV_NO = popupParam.RCV_NO 
  detailData.WORK_START_TIME = popupParam.WORK_START_TIME
  detailData.WORK_END_TIME = popupParam.WORK_END_TIME
  detailData.JOB_LPLC = popupParam.JOB_LPLC
  detailData.JOB_MPLC = popupParam.JOB_MPLC
  detailData.JOB_SPLC = popupParam.JOB_SPLC
  detailData.WRK_STG = popupParam.WRK_STG
  detailData.WRK_TYP = popupParam.WRK_TYP
  detailData.WRK_CD = popupParam.WRK_CD
  detailData.STATUS = "10"
  detailData.DANG_DIV = popupParam.DANG_DIV
  detailData.P_WRK_ID = popupParam.P_WRK_ID
  detailData.CF_DIV = popupParam.CF_DIV
  detailData.WRK_PLAN_YN = popupParam.WRK_PLAN_YN
  detailData.PTW_STATUS = popupParam.STATUS

  initCodeList()
  dialog.value = true
  onButtonsClick({ id: "btnSearch" }) 
}

const onButtonsClick = btn => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)      
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)      
      .run()
  } else if (btn.id === "btnPrint") {

    if(detailData.WRK_PLAN_YN === 'N') {
      Message.warn(t("저장 후 출력하시기 바랍니다."))
      return
    }

    let dataReport = []
    reportName.value = "/manage/hse/OUTCA0010.ozr"
    dataReport = [
      'IN_CMPNY_DIV=' + detailData.CMPNY_DIV,
      'IN_BIZ_REG_NO=' + detailData.BIZ_REG_NO,
      'IN_RCV_NO=' + detailData.RCV_NO,
    ]

    params.value.push({ reportName: reportName.value, args: dataReport })

    isMulti.value = false
    showOz.value = true

  } else if (btn.id === "btnDelete") {
  } else if (btn.id == "btnClose") {
    dialog.value = false
  }
}


//  조회
const searchData01 = idx => {  
  if(detailData.PTW_STATUS === '20') {    
    menuTitle.value.setBtnProperty("btnUpdate", "visible", true)
  } else {
    menuTitle.value.setBtnProperty("btnUpdate", "visible", false)
  }

  return commonSearchApi({
    queryId: "SAFBA0010_SEARCH_26",
    param: searchParam,
  })
}

const afterSearch01 = res => {
  console.log(res, "resMains")

  if(res.ORESULT_CUR.length > 0){
    detailData.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
    detailData.RCV_NO = res.ORESULT_CUR[0].RCV_NO
    detailData.BIZ_REG_NO = res.ORESULT_CUR[0].BIZ_REG_NO
    detailData.SHORT_WORK_NO = res.ORESULT_CUR[0].SHORT_WORK_NO
    detailData.VND_NAME = res.ORESULT_CUR[0].VND_NAME
    detailData.WORK_DT = res.ORESULT_CUR[0].WORK_DT
    detailData.WRK_DIST = res.ORESULT_CUR[0].WRK_DIST
    detailData.JOB_SPLC_NM = res.ORESULT_CUR[0].JOB_SPLC_NM
    detailData.WORK_DESC = res.ORESULT_CUR[0].WORK_DESC
    detailData.OVERWGT_TYPE = res.ORESULT_CUR[0].OVERWGT_TYPE
    detailData.OVERWGT_WGT = res.ORESULT_CUR[0].OVERWGT_WGT
    detailData.HEAVY_EQUIP_TYPE = res.ORESULT_CUR[0].HEAVY_EQUIP_TYPE
    detailData.DANG_DESC = res.ORESULT_CUR[0].DANG_DESC
    detailData.DRIVE_DESC = res.ORESULT_CUR[0].DRIVE_DESC
    detailData.RESP_EMP_NM = res.ORESULT_CUR[0].RESP_EMP_NM
    detailData.RESP_HP_NO = res.ORESULT_CUR[0].RESP_HP_NO
    detailData.RESP_EMP_NM2 = res.ORESULT_CUR[0].RESP_EMP_NM2
    detailData.RESP_HP_NO2 = res.ORESULT_CUR[0].RESP_HP_NO2

    if(res.ORESULT_CUR[0].WORK_START_TIME){
      detailData.WORK_START_TIME = res.ORESULT_CUR[0].WORK_START_TIME  
    }

    if(res.ORESULT_CUR[0].WORK_END_TIME){
      detailData.WORK_END_TIME = res.ORESULT_CUR[0].WORK_END_TIME  
    }

    if(res.ORESULT_CUR[0].JOB_LPLC){
      detailData.JOB_LPLC = res.ORESULT_CUR[0].JOB_LPLC  
    }

    if(res.ORESULT_CUR[0].JOB_MPLC){
      detailData.JOB_MPLC = res.ORESULT_CUR[0].JOB_MPLC  
    }

    if(res.ORESULT_CUR[0].JOB_SPLC){
      detailData.JOB_SPLC = res.ORESULT_CUR[0].JOB_SPLC  
    }

    if(res.ORESULT_CUR[0].WRK_STG){
      detailData.WRK_STG = res.ORESULT_CUR[0].WRK_STG  
    }

    if(res.ORESULT_CUR[0].WRK_TYP){
      detailData.WRK_TYP = res.ORESULT_CUR[0].WRK_TYP  
    }

    if(res.ORESULT_CUR[0].WRK_CD){
      detailData.WRK_CD = res.ORESULT_CUR[0].WRK_CD  
    }

    if(res.ORESULT_CUR[0].STATUS){
      detailData.STATUS = res.ORESULT_CUR[0].STATUS  
    }

    if(res.ORESULT_CUR[0].DANG_DIV){
      detailData.DANG_DIV = res.ORESULT_CUR[0].DANG_DIV  
    }

    if(res.ORESULT_CUR[0].P_WRK_ID){
      detailData.P_WRK_ID = res.ORESULT_CUR[0].P_WRK_ID  
    }

    if(res.ORESULT_CUR[0].CF_DIV){
      detailData.CF_DIV = res.ORESULT_CUR[0].CF_DIV  
    }
  }
}

// 저장
const beforeSave = () => {
  console.log('beforeSave')
  return true
}

const saveData = () => {
  console.log('saveData')

  const saveParams = []

  saveParams.push({
    CMPNY_DIV: detailData.CMPNY_DIV,                              //사업장구분
    RCV_NO: detailData.RCV_NO,                                      //허가서NO
    BIZ_REG_NO: detailData.BIZ_REG_NO,                              //사업자번호
    SHORT_WORK_NO: detailData.SHORT_WORK_NO,                      //단기공사 Key
    WORK_FIRST_TIME: detailData.WORK_START_TIME,
    WORK_LAST_TIME: detailData.WORK_END_TIME,

    JOB_LPLC: detailData.JOB_LPLC,                    //작업장소 대구분   //작업정보 등록 내용
    JOB_MPLC: detailData.JOB_MPLC,                    //작업장소 중구분   //작업정보 등록 내용
    JOB_SPLC: detailData.JOB_SPLC,                    //작업장소 소구분   //작업정보 등록 내용

    WRK_STGTYP: "",                                   //작업상세 - 작업공정   //작업정보 등록 내용 // 데이터 없음
    WRK_CD: detailData.WRK_CD,                        //
    WORK_DESC: detailData.WORK_DESC,                  //작업내용
    OVERWGT_TYPE: detailData.OVERWGT_TYPE, 
    OVERWGT_WGT: detailData.OVERWGT_WGT, 
    HEAVY_EQUIP_TYPE: detailData.HEAVY_EQUIP_TYPE, 
    DANG_DESC: detailData.DANG_DESC, 
    DRIVE_DESC: detailData.DRIVE_DESC, 

    RESP_EMP_NM: detailData.RESP_EMP_NM,              //책임자 명칭
    RESP_HP_NO: detailData.RESP_HP_NO,                //책임자 전화번호
    RESP_EMP_NM2: detailData.RESP_EMP_NM2,              //차선임자 명칭
    RESP_HP_NO2: detailData.RESP_HP_NO2,                //차선임자 전화번호
    DANG_DIV: detailData.DANG_DIV,                
    P_WRK_ID: detailData.P_WRK_ID,                
    CF_DIV: detailData.CF_DIV,                
    STATUS: detailData.STATUS,                
    USER_ID: userStore.userId, 
  })

  console.log('saveParams', saveParams)

  commonExecuteApi({
    queryId: "OUTBA0020_INSERT_06",
    list: saveParams,
  }).then((res) => {
    console.log(res, "OUTBA0020_INSERT_06")
    //console.log(res.list.length, "res.list.length")
    if(res.list.length > 0) {
      //console.log(res.list[0].RES_COD, "res.list[0].RES_COD")
      if(res.list[0].RES_COD === '0'){
        emit("selected", res)
        onButtonsClick({ id: "btnClose" }) 
      } else {
        Message.warn(t("저장 시 오류가 발생하였습니다."))
      }
    }
  })
}

//  삭제

//메인
defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      작업계획서
    </div>

    <VContainer style="background-color: white">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnUpdate', 'btnPrint', 'btnClose']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="d-flex flex-row mt-3 mb-1">
        <h4 style="width: 388px;">작업계획서 상세</h4>
      </v-sheet>
      <v-row>        
        <v-col class="d-flex bg-base" cols="12">          
          <v-col cols="12">
            <VRow>
              <VCol>                
                <div class="d-flex">
                  <i-input :label="t('위험작업허가서(PTW) 번호')" width="460px" labelWidth="160px"
                        v-model="detailData.RCV_NO" disabled/>
                </div>
              </VCol>
            </VRow>
            <VRow>
              <VCol>
                <div class="d-flex">
                  <i-input :label="t('작업업체')" width="460px" labelWidth="80px"
                      v-model="detailData.VND_NAME" disabled/>
                  <i-input :label="t('작업일자')" width="460px" labelWidth="80px"
                      v-model="detailData.WORK_DT" disabled/>
                </div>
              </VCol>
            </VRow>
            <VRow>
              <VCol>
                <div class="d-flex">
                  <i-input :label="t('작업유형')" width="460px" labelWidth="80px"
                      v-model="detailData.WRK_DIST" disabled/>
                  <i-input :label="t('작업장소')" width="460px" labelWidth="80px"
                      v-model="detailData.JOB_SPLC_NM" disabled/>
                </div>
              </VCol>
            </VRow>
            <VRow class="pb-2">
              <VCol>
                <div class="d-flex">
                  <i-input :label="t('작업내용')" width="940px" labelWidth="80px"
                      v-model="detailData.WORK_DESC" disabled/>                  
                </div>
              </VCol>
            </VRow>
            <v-divider class="pb-2"/>
            <VRow>
              <VCol>
                <div class="d-flex">
                  <i-input :label="t('중량물 유형')" width="300px" labelWidth="80px"
                      v-model="detailData.OVERWGT_TYPE"/>
                  <i-input :label="t('중량물 무게')" width="300px" labelWidth="80px"
                      v-model="detailData.OVERWGT_WGT"/>
                  <i-input :label="t('중장비 유형')" width="300px" labelWidth="80px"
                      v-model="detailData.HEAVY_EQUIP_TYPE"/>                  
                </div>
              </VCol>
            </VRow>
            <VRow>
              <VCol>
                <div class="d-flex">
                  <i-textarea                    
                    :label="$t('주요 위험사항 대책')"
                    width="460px"
                    topLabel
                    v-model="detailData.DANG_DESC"
                    class="mt-2"
                  />
                  <i-textarea                    
                    :label="$t('운행경로(차량계 하역운반/건설기계)')"
                    width="460px"
                    topLabel
                    v-model="detailData.DRIVE_DESC"
                    class="mt-2"
                  />              
                </div>
              </VCol>
            </VRow>
          </v-col>
        </v-col>
      </v-row>    

      <v-sheet class="d-flex flex-row mt-3 mb-1">
        <h4 style="width: 388px;">작업자 명단</h4>
      </v-sheet>
      <v-row>        
        <v-col class="d-flex bg-base" cols="12">          
          <v-col cols="12">
            <VRow>
              <VCol>                
                <div class="d-flex">
                  <i-input :label="t('작업지휘자(작업책임자)')" width="460px" labelWidth="160px"
                        v-model="detailData.RESP_EMP_NM"/>
                  <i-input :label="t('연락처')" width="460px" labelWidth="80px"
                        v-model="detailData.RESP_HP_NO"/>
                </div>
              </VCol>
            </VRow>
            <VRow>
              <VCol>                
                <div class="d-flex">
                  <i-input :label="t('차선임자')" width="460px" labelWidth="160px"
                        v-model="detailData.RESP_EMP_NM2"/>
                  <i-input :label="t('연락처')" width="460px" labelWidth="80px"
                        v-model="detailData.RESP_HP_NO2"/>
                </div>
              </VCol>
            </VRow>
          </v-col>
        </v-col>
      </v-row>
      
    </VContainer>
    <OZReport
      :showPop="showOz"
      :MultiArr="params"
      :params="ozParams"
      :reportName="reportName"
      :isMulti="(isMulti = true)"
      @close="showOz = $event"
      @falseMulti="isMulti = $event"
    />
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
