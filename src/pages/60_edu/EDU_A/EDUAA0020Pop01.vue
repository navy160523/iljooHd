<!--
  화면명 : 주관 부서 등록 팝업창
  화면개요 : 주관 부서 등록 및 확인 하는 화면
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import ILabel from "@/components/ILabel.vue"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'

//******************************세팅 영역***************************************************/
const emit = defineEmits(['selected', 'modified']) 

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
let CREATE_YN = ''

//코드 리스트 세팅
const codeList = reactive({
  MNG_ORGN: [],           //주관부서
  EDU_CYCLE: [],          //교육주기
  EDU_TIME: [],           //교육시간
})

//******************************세팅 영역(종료)***************************************************/

//********************************교육 상세정보 데이터***************************************//
const popupData = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  CURR_NM: '',  //교육명
  TARGET: '',     //대상
  MNG_ORGN: '',         //주관부서
  EDU_CYCLE: '',       //주기
  EDU_TIME: '',   //시간
  REQ_YN: 'N',     //신청교육
  EDU_CAPA : '',     //교육정원
  EDU_CONTENT: '',    //교육내용
  EVAL_STD: '',    //평가기준
  EDU_INTRO: '',     //과정소개
  EDU_DESC: '',       //교육내용상세
  REMARK: '',        //비고
})

//********************************/주관부서 상세정보 데이터(종료)***********************************//
const clearData = () => {
  popupData.CMPNY_DIV = userStore.cmpnyDiv,
  popupData.USER_ID = userStore.userId,
  popupData.CURR_NM = '',     //교육명
  popupData.TARGET = '',      //대상
  popupData.MNG_ORGN = '',    //주관부서
  popupData.EDU_CYCLE = '',   //주기
  popupData.EDU_TIME = '',    //시간
  popupData.REQ_YN = 'N',     //신청교육
  popupData.EDU_CAPA  = '',   //교육정원
  popupData.EDU_CONTENT = '', //교육내용
  popupData.EVAL_STD = '',    //평가기준
  popupData.EDU_INTRO = '',   //과정소개
  popupData.EDU_DESC = '',    //교육내용상세
  popupData.REMARK = ''       //비고
}

//*****************************************오픈 팝업********************************************/
const openPopup =  data => {
  clearData()

  //주관부서, 교육주기, 교육시간 데이터 바인딩
  Promise.all([
    getCodeList('HHID200'),
    getCodeList('HHID180'),
    getCodeList('HHID190'),
  ]).then(res => {
    codeList.MNG_ORGN = res[0].ORESULT_CUR
    codeList.EDU_CYCLE = res[1].ORESULT_CUR
    codeList.EDU_TIME = res[2].ORESULT_CUR
  })

  //CREATE_YN = 'Y' : 추가버튼 클릭
  //CREATE_YN = 'N' : 주관부서 리스트 그리드 row 더블클릭
  if(data.CREATE_YN === 'Y'){
    CREATE_YN = data.CREATE_YN    
    popupData.CMPNY_DIV = userStore.cmpnyDiv
    popupData.USER_ID = userStore.userId
    popupData.CURR_NM = data.CURR_NM,  //교육명
    popupData.TARGET = data.TARGET     //대상
  } else {
    popupData.CURR_NM = data.CURR_NM,  //교육명
    popupData.TARGET = data.TARGET,     //대상
    popupData.MNG_ORGN = data.MNG_ORGN,         //주관부서
    popupData.EDU_CYCLE = data.EDU_CYCLE,       //주기
    popupData.EDU_TIME = data.EDU_TIME,   //시간
    popupData.REQ_YN = data.REQ_YN,     //신청교육
    popupData.EDU_CAPA  = data.EDU_CAPA,     //교육정원
    popupData.EDU_CONTENT = data.EDU_CONTENT,    //교육내용
    popupData.EVAL_STD = data.EVAL_STD,    //평가기준
    popupData.EDU_INTRO = data.EDU_INTRO,     //과정소개
    popupData.EDU_DESC = data.EDU_DESC,       //교육내용상세
    popupData.REMARK = data.REMARK,        //비고
    CREATE_YN = 'N'
  }

  //팝업 오픈
  dialog.value = true 
}

//****************************************오픈 팝업(종료)************************************************/

//창 닫음
const onClose = () => {
  dialog.value = false
}

//추가 버튼 이벤트
const onAddButtonClick = () => {
  if(popupData.MNG_ORGN === '')
  {
    Message.err(t('주관부서를 입력해 주세요.'))

    return
  }
  if(CREATE_YN === 'Y'){
    emit("selected", popupData)
  }
  else{
    emit("modified", popupData)
  }
  onClose()
}

const onButtonsClick = async btn => {
  if(btn.id === 'btnSelect'){
    onAddButtonClick()
  } else {
    onClose()
  }
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="900"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
  <v-sheet
    color="primarySub"
    height="50"
    class="px-4 d-flex align-center rounded-t-5 cursor-move"
    @mousedown="startDragging"
  >
    <span>주관부서 상세정보 관리 팝업</span>
  </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :title="$t('상세정보')"
          :button-list="['btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 상세 -->
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex mb-2">
              <i-input
                :label="$t('교육명')"
                topLabel
                v-model="popupData.CURR_NM"
                width="250px"
                readonly
              />
              <!-- 대상 -->
              <i-input
                :label="$t('대상')"
                topLabel
                v-model="popupData.TARGET"
                width="250px"
                readonly
              />
              <!-- 주관부서 -->
              <i-select
                :label="$t('주관부서')"
                topLabel
                v-model="popupData.MNG_ORGN"
                :items="codeList.MNG_ORGN"
                item-title="TXT"
                item-value="COD"
                width="250px"
              />
            </div>
            <div class="d-flex mb-2">
              <!-- 주기 -->
              <i-select
                :label="$t('주기')"
                topLabel
                v-model="popupData.EDU_CYCLE"
                :items="codeList.EDU_CYCLE"
                item-title="TXT"
                item-value="COD"
                width="250px"
              />
              <!-- 시간 -->
              <i-select
                :label="$t('시간')"
                topLabel
                v-model="popupData.EDU_TIME"
                :items="codeList.EDU_TIME"
                item-title="TXT"
                item-value="COD"
                width="250px"
              />
              <!-- 교육정원 -->
              <i-input
                :label="$t('교육정원')" 
                topLabel
                v-model="popupData.EDU_CAPA"
                width="250px"
              />
            </div>
            <div class="d-flex mb-2">
              <!-- 교육내용 -->
              <i-input
                :label="$t('교육내용')" 
                topLabel
                v-model="popupData.EDU_CONTENT"
                width="790px"
              />
            </div>
            <div class="d-flex mb-2">
              <!-- 평가기준 -->
              <i-textarea
                :label="$t('평가기준')"
                v-model="popupData.EVAL_STD"
                rows="3"
                width="790px"
              />
            </div>
            <div class="d-flex mb-2">
              <!-- 과정소개 -->
              <i-textarea
                :label="$t('과정소개')"
                v-model="popupData.EDU_INTRO"
                rows="3"
                width="790px"
              />
            </div>
            <div class="d-flex mb-2">
              <!-- 교육내용상세 -->
              <i-textarea
                :label="$t('교육내용상세')"
                v-model="popupData.EDU_DESC"
                rows="3"
                width="790px"
              />
            </div>
            <div class="d-flex mb-2">
              <!-- 비고 -->
              <i-input
                :label="$t('비고')"
                topLabel
                v-model="popupData.REMARK"
                width="790px"
              />
            </div>         
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>    
  </v-dialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
