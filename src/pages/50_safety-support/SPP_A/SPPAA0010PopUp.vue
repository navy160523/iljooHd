<!-- SPPAB0010 훈련결과 등록 -->
<!-- SI2팀 이민규 2024-04-29 -->

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useUserStore } from "@hiway/stores/user";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper";
import {commonExecuteApi, commonExecuteApi2, getCodeList, commonSearchApi} from '@hiway/api/commonApi'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import dayjs from "dayjs"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IUpload from "@/components/IUpload.vue"
import Message from '@hiway/utils/notify'

defineOptions({
  name:'50_safety-support-SPP_D-SPPAB0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore =  useUserStore()
const grdMain = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false);
const iUploadPopup = ref(null);
const emit = defineEmits(["reSearch"])
const menuTitle = ref(null)
const iUpload = ref(null)
const flag = ref(null)


const infoDetail = reactive({
  CMPNY_DIV:userStore.cmpnyDiv,
  BSNS_CD:'',
  BSNS_NM:'',
  DEPT_CD: '',
  ASGN_CD: '',
  DEPT_NM: '',
  YEAR:'',
  TRAINING_GBN:'',
  REMARK:'',
  REV_NO: '',
  TRAINING_DATE:'',
  FILES_NAME:'',
  TRAINING_ATTACH_KEY:'',
  TRAINING_FILE_NAMES:'',
  USER_ID: userStore.userId,
  UPDATE_USER_ID:'',
  PLAN_KOR_NM:'',  
  USER_NM:userStore.userName,
  TRAINING_TYPE: '',
  TRAINING_PLACE: '',
  MONTH: ''
})

const codeList = reactive({})

const openPopup = param => {
  dialog.value = true

  for(let i in infoDetail){
    if(param[i]){
      infoDetail[i] = param[i]
    }
  }
  initCodeList()
  searchGrdData()
}

const onButtonsClick = async(btn)=>{
  if(btn.id == 'btnUpdate'){
    new saveFlowHelper(vm, t)      
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        for(let i in infoDetail){
          infoDetail[i] = ''
        }
        emit('reSearch')
        dialog.value = false
      })
      .run()
  
  }else if(btn.id == 'btnDelete'){
    new deleteFlowHelper(vm, t)      
      .setQuery(() => {
        return commonExecuteApi({ queryId : 'SPPAA0010_POPUP_DELETE_01', list: [infoDetail] })
      })
      .setAfter(() => {
        for(let i in infoDetail){
          infoDetail[i] = ''
        }
        emit('reSearch')
        dialog.value = false
      })
      .run()

  }else if(btn.id ==='btnClose'){
    for(let i in infoDetail){
      infoDetail[i] = ''
    }
    dialog.value = false
  }
}

defineExpose({
  openPopup,
});

const searchGrdData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(false)
    .run()
}

const searchData = () => {

  let search = {}

   search.CMPNY_DIV = infoDetail.CMPNY_DIV
   search.BSNS_CD = infoDetail.BSNS_CD
   search.DEPT_CD = infoDetail.DEPT_CD
   search.YEAR = infoDetail.YEAR   
   search.TRAINING_GBN = infoDetail.TRAINING_GBN

  return commonSearchApi({queryId: "SPPAA0010_POPUP_SEARCH_01", param: infoDetail })
}

const afterSearch = (res) => {
  vm.$nextTick(()=> {
    menuTitle.value.disableBtn('btnDelete', flag.value)
  })

  if(res.ORESULT_CUR.length > 0){
    flag.value = false
    for(let i in infoDetail){
      if(i === 'TRAINING_DATE'){
        infoDetail[i] = dayjs(res.ORESULT_CUR[0][i]).format('YYYY-MM-DD')
        
      }else{
        infoDetail[i] = res.ORESULT_CUR[0][i]
      }
    }
  }else{
    flag.value = true
    if(infoDetail.MONTH){
      infoDetail.TRAINING_DATE = infoDetail.YEAR + '-' + infoDetail.MONTH + '-01'
      
    }
  }
  infoDetail.USER_NM = userStore.userName
  checkFileId()
}

const checkFileId = () => {
  if(!infoDetail.TRAINING_ATTACH_KEY){
    iUpload.value.setGuid()
    infoDetail.TRAINING_ATTACH_KEY = iUpload.value.guid
    iUpload.value.onButtonsClick({ id: "btnSearch" })
  }else {
    iUpload.value.setGuid(infoDetail.TRAINING_ATTACH_KEY)
    // infoDetail.TRAINING_ATTACH_KEY = iUpload.value.guid
    iUpload.value.onButtonsClick({ id: "btnSearch" })
  }
}

const getFileInfo = (e) => {
  infoDetail.TRAINING_ATTACH_KEY = e.fileId
}

const beforeSave = () => {
  if(!infoDetail.TRAINING_TYPE){
    Message.warn(t('훈련내용을 입력 해주세요.'))
    return
  }else if(!infoDetail.TRAINING_DATE){
    Message.warn(t('훈련일자를 입력 해주세요.'))
    return
  }else if(!infoDetail.TRAINING_PLACE){
    Message.warn(t('훈련장소를 입력 해주세요.'))
    return
  } else {
    return true
  }
}

const saveData = async() => {
  infoDetail.USER_ID = userStore.userId
  return commonExecuteApi({ queryId : 'SPPAA0010_POPUP_SAVE_02', list: [infoDetail] })
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIK101'), // 훈련종류
    getCodeList('HHIK100'), // 훈련종류
    
  ]).then(res => {
    
    codeList.TRAINING_GBN = res[0].ORESULT_CUR
    codeList.TRAINING_TYPE = res[1].ORESULT_CUR

    if(infoDetail.TRAINING_GBN === '10'){
      codeList.TRAINING_TYPE = res[1].ORESULT_CUR.filter(item => item.CODE_DESC1.includes('소방') )
    }else if(infoDetail.TRAINING_GBN === '20'){
      codeList.TRAINING_TYPE = res[1].ORESULT_CUR.filter(item => item.CODE_DESC1.includes('비상') )
    }
  })
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000px"
    height="730px"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">훈련결과 등록</div>
    <v-card class="fill-height">
      <v-card-title class="pb-0">
        <IGridTitle
        ref = "menuTitle"
        :use-permission="false"
        :button-list="['btnUpdate','btnDelete','btnClose']"
        @click-button="onButtonsClick"
        class="ma-0"
        />
      </v-card-title>
      <v-card-text class="pa-0 px-2">
        <v-sheet class="fill-height">
          <div class="flex-column">
            <v-sheet class="h-auto">
              <v-card-title class="pa-0 gridTitle">기본정보</v-card-title>
              <div class="flex-column mb-0 searchArea">
                <div class="d-flex">
                  <i-input
                    :label="$t('사업부')"              
                    width="230px"
                    v-model="infoDetail.BSNS_NM"              
                    readonly
                  />
                  <i-input
                    :label="$t('부서')"              
                    width="230px"
                    v-model="infoDetail.DEPT_NM"
                    readonly
                  />
                  <i-select
                    width="230px"
                    :label="$t('훈련종류')"              
                    v-model="infoDetail.TRAINING_GBN"
                    :items="codeList.TRAINING_GBN"
                    item-value="COD"
                    item-title="TXT"                            
                    readonly
                  />
                  <i-input
                    :label="$t('계획 등록자')"              
                    width="170px"
                    v-model="infoDetail.PLAN_KOR_NM"
                    readonly
                  />
                </div>          
              </div>
            </v-sheet>
            <v-sheet class="mt-3">
              <IGridTitle :title="t('상세정보')" ref="GridTitle" />            
              <div class="flex-column mb-3 searchArea justify-space-between">
                <div class="d-flex">
                  <i-select
                    width="280px"
                    label-width="60px"
                    :label="$t('훈련구분')"              
                    v-model="infoDetail.TRAINING_TYPE"
                    :items="codeList.TRAINING_TYPE"
                    item-value="COD"
                    item-title="TXT"
                    required                                              
                  />
                  <i-input
                    width="220px"
                    :label="$t('훈련일자')"
                    label-width="60px"
                    v-model="infoDetail.TRAINING_DATE"
                    type="date"
                    required              
                  />    
                  <i-input
                    :label="t('훈련장소')"            
                    width="380px"
                    label-width="60px"  
                    v-model="infoDetail.TRAINING_PLACE"
                    required
                  />  
                </div>
                <div class="d-flex mt-1">
                  <i-input
                    :label="t('훈련내용(텍스트 기입)')"            
                    width="520px"
                    label-width="135px"
                    v-model="infoDetail.REMARK"
                  />
                  <i-input
                    :label="t('작성자')"
                    label-width="60px"            
                    width="150px"                  
                    v-model="infoDetail.USER_NM"
                    readonly
                  />  
                </div>
              </div>              
              <IUpload ref='iUpload' style="height: 300px" auto-upload @uploaded="getFileInfo"/>  
              <div class="mt-2"><span>※ 비상조치훈련 계획 보고서, 훈련 결과 보고서, 비상조치 훈련 시나리오, 교육훈련 기록표 등</span></div>
            </v-sheet>
          </div>
        </v-sheet>
      </v-card-text>  
    </v-card>
  </v-dialog>
</template>
    
<style scoped lang="scss">

</style>
