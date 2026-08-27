<!-- 
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 평가대상 조직관리(탭) > 데이터 일괄 연결(팝업)
-->

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import IMenuTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const menuTitle = ref(null);
const dialog = ref(false);

const paramList = reactive({
  SaveData: {},
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(new Date().getFullYear()),
  WORKYEAR:'',
  SPECIALYEAR:'',
  BONEYEARF:'',
  BONEYEART:'',
  HALF:'' // 반기 구분
})

const codeList = reactive({
  harfList: [
    {COD: '' , TXT: '선택'},
    {COD: 'HI' , TXT: '상반기'},
    {COD: 'LO' , TXT: '하반기'},
  ]
})

const openPopup = (param) => {
  console.log('param : ',param)
  paramList.SaveData = param  
  dialog.value = true
}

const onButtonsClick = (btn) => {
  if(btn.id === 'btnUpdate') {
    // console.log('데이터 일괄 연결 저장')
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(afterSaveData)
    .run()  
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const beforeSave = () => {
  if (!searchParams.WORKYEAR) {
    Message.warn(t('작업환경측정 기준년도를 입력 하십시요.'))
    return false
  } else if (!searchParams.HALF) {
    Message.warn(t('작업환경측정 반기구분을 선택 하십시요.'))
    return false
  } else if (!searchParams.SPECIALYEAR) {
    Message.warn(t('특수건강진당 기준년도를 입력 하십시요.'))
    return false
  } else if (!searchParams.BONEYEARF) {
    Message.warn(t('근골부담작업유해요인조사 기준년도(From)를 입력 하십시요.'))
    return false
  } else if (!searchParams.BONEYEART) {
    Message.warn(t('근골부담작업유해요인조사 기준년도(To) 입력 하십시요.'))
    return false
  } 

  if(searchParams.BONEYEARF > searchParams.BONEYEART) {
    Message.warn(t('근골부담작업유해요인조사 기준년도를 정상적으로 입력 하여 주십시요.'))
    return false
  }
  return true
}


// 저장
const saveData = () => {
  const saveParams = paramList.SaveData.map(item => ({
    ...item,
    WORKYEAR: searchParams.WORKYEAR,
    SPECIALYEAR: searchParams.SPECIALYEAR,
    BONEYEARF: searchParams.BONEYEARF,
    BONEYEART: searchParams.BONEYEART,
    HALF: searchParams.HALF,
    YEAR: searchParams.YEAR 
  }))
  // console.log('saveParams : ', saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_BATCH_01', list: saveParams })
}

// 저장 후
const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

const closePopup = () => {
  emit("closed")
  dialog.value = false
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
  >
    <div class="title-bar">
      <span> 데이터 일괄 연결 </span>
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 인적사항 -->
      <v-card-text class="overflowY">
        <v-card class="mb-3 mr-1 popUp-input-Form">
          <v-card-text class="pa-0">
              <div class="d-flex my-0">
                <i-select
                  :label="$t('적용년도')"  
                  v-model="searchParams.YEAR"
                  width="180px"
                  type="YEAR"
                  margin="10px"
                />
              </div>
          </v-card-text>    
        </v-card>
        <!-- <v-card-text class="my-2" height="250px"> -->
        <v-card-text class="my-0">
          <IMenuTitle
            ref="menuTitle"
            :title="$t('작업환경측정')"
          />
        </v-card-text>
        <v-card class="mb-0 mr-0 popUp-input-Form">
          <v-card-text class="pa-0">
              <div class="d-flex my-0">
                <i-input
                  :label="$t('기준년도')"  
                  v-model="searchParams.WORKYEAR"
                  width="150px"
                  type="YEAR"
                  margin="10px"
                  maxlength="4"
                />
                <i-select
                  :label="$t('반기구분')"
                  class="mt-2"
                  label-width="50px"
                  item-value="COD"
                  item-title="TXT" 
                  width="180px"
                  :items="codeList.harfList"
                  v-model="searchParams.HALF"
                />
              </div>
          </v-card-text>
        </v-card>
        <v-card-text class="my-0">
          <IMenuTitle
            ref="menuTitle"
            :title="$t('특수건강진단')"
          />
        </v-card-text>
        <v-card class="mb-0 mr-0 popUp-input-Form">
          <v-card-text class="pa-0">
              <div class="d-flex my-0">
                <i-input
                  :label="$t('기준년도')"  
                  v-model="searchParams.SPECIALYEAR"
                  width="150px"
                  type="YEAR"
                  margin="10px"
                  maxlength="4"
                />
              </div>
          </v-card-text>
        </v-card>
        <v-card-text class="my-0">
          <IMenuTitle
            ref="menuTitle"
            :title="$t('근골부담작업 유해요인조사 (정기)')"
          />
        </v-card-text>
        <v-card class="mb-0 mr-0 popUp-input-Form">
          <v-card-text class="pa-0">
              <div class="d-flex my-0">
                <i-input
                  :label="$t('기준년도')"  
                  v-model="searchParams.BONEYEARF"
                  width="150px"
                  type="YEAR"
                  margin="10px"
                  maxlength="4"
                />
                <i-input
                  :label="$t('~')"  
                  v-model="searchParams.BONEYEART"
                  width="150px"
                  type="YEAR"
                  margin="10px"
                  maxlength="4"
                />
              </div>
          </v-card-text>
        </v-card>
        <!-- 팝업 -->
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.fileDiv {
  width: 100%;
  padding: 12px;
  background: #fff;
}

.radio-box {
  background-color: #fff;
  padding: 3px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
  width: 250px;
}
.box {
  background: #fff;
  padding: 8px;
  border-radius: 12px;
}
</style>
