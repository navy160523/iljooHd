<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from "@/components/ILabel.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import Message from "@hiway/utils/notify"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"

const emit = defineEmits(["reSearch"])
const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const fileUploadPopup = ref(null)

const saveParam = reactive({
  ASGN_FULL_NM: null,         // 조직
  VIOLATOR: null,             // 이름
  VIO_EMP_NO: null,           // 사번
  STUS_CD: null,              // 상태
  WIBAN_CNT: null,            // 최근1년 위반건수
  USER_DIV_NM: null,          // 소속구분
  VIO_TIME: null,             // 위반일시
  VIO_PLC_NM: null,           // 위반장소
  RELIF_CAUSE: null,          // 경감사유
  RELIF_FILE_ID: null,        // 경감 첨부
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  RELIF_FILE_ID_YN: null,
})

const onButtonsClick = async btn => {
  let param = [{
    CMPNY_DIV: saveParam.CMPNY_DIV,
    VIO_NO: saveParam.VIO_NO,
    COMPANY: saveParam.COMPANY,
    GUBUN: saveParam.WIBAN_DIV,
    SAVEYN: 'Y',
  }]
  if(btn.id === 'btnCancelConfirm'){
    /* ********************************* 확정취소 ********************************* */
    let cancelConfirmYn = await vm.$swal({
      title: t('확정취소 하시겠습니까?'),
      showCancelButton: true,
    })
    if(!cancelConfirmYn.isConfirmed){
      return 
    } else {
      commonExecuteApi({ queryId: "EDUAC0010_CONFIRM_CANCEL_01", list: [saveParam] }).then(res => {
        if(res){
          /* *********** 일반수칙위반으로전환 후 SCMS 수칙위반 건 연동삭제 ************ */
          commonExecuteApi({ queryId: "EDUAC0010_POP_DELETE_01", list: param })

          Message.success(t('확정취소 되었습니다.'))
          dialog.value = false
          emit('reSearch')
        }
      })
    }
  }else if(btn.id === 'btnReduConfirme'){
    let reduConfirmeYn = await vm.$swal({
      title: t('경감확정 하시겠습니까?'),
      showCancelButton: true,
    })
    if(!reduConfirmeYn.isConfirmed){
      return 
    } else {
      if(saveParam.STUS_CD === '0' || saveParam.STUS_CD === '등록'){
        return Message.err(t('등록 상태에서는 경감할 수 없습니다.'))
      }
      /* ********************************* 경감확정 ********************************* */
      commonExecuteApi({ queryId: "EDUAC0010_SAFE_01", list: [saveParam] }).then(res => {
        if(res){ 
          Message.success(t('경감확정 되었습니다.')) 
          dialog.value = false
          emit('reSearch')
        }
      })
    }
  }else if(btn.id === 'btnGeneralRules'){
    /* ********************************* 일반수칙위반으로전환 ********************************* */
    let generalRulesYn = await vm.$swal({
      title: t('일반수칙위반으로전환 하시겠습니까?'),
      showCancelButton: true,
    })
    if(!generalRulesYn.isConfirmed){
      return 
    } else {
      commonExecuteApi({ queryId: "EDUAC0010_DELETE_01", list: [saveParam] }).then(res => {
        if(res){
          if(res.list[0].WIBAN_DIV === 'B'){
            /* *********** 일반수칙위반으로전환 후 SCMS 수칙위반 건 연동저장 ************ */
            commonExecuteApi({ queryId: "EDUAC0010_POP_SAVE_01", list: param })
          }

          Message.success(t('경감확정 되었습니다.')) 
          dialog.value = false
          emit('reSearch')
        }
      })
    }
  }else {
    dialog.value = false
  }
  
}

const uploadPopup = () => {
  fileUploadPopup.value.openPopup(saveParam.RELIF_FILE_ID)
}

/* ****************** 파일첨부 선택 ******************* */
const uploaded = val => {
  if(val){
    saveParam.RELIF_FILE_ID = val.fileId
    saveParam.RELIF_FILE_ID_YN = val ? 'Y' : null
  }
}

const openPopup = data => {
  dialog.value = true
  menuTitle.value.setBtnProperty('btnReduConfirme', 'visible', true) 
  menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', true)
  menuTitle.value.setBtnProperty('btnGeneralRules', 'visible', true)

  if(data.STUS_CD === '0' || data.STUS_CD === '등록'){
    menuTitle.value.setBtnProperty('btnReduConfirme', 'visible', false) 
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false)
  }else {
    menuTitle.value.setBtnProperty('btnGeneralRules', 'visible', false)
  }
  for(let i in data){
    saveParam[i] = data[i]
  }
  saveParam.RELIF_FILE_ID_YN = saveParam.RELIF_FILE_ID ? 'Y' : null
}

defineExpose({
  openPopup,
})

onMounted(() => {
  
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    width="650"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
  <v-sheet
    color="primarySub"
    height="50"
    class="px-4 d-flex align-center rounded-t-5 cursor-move"
    @mousedown="startDragging"
  >
    <span>경감 사유</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <v-card-title class="pa-4 pb-2">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnCancelConfirm','btnReduConfirme','btnGeneralRules','btnClose']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-0 pt-0 content-area">
      <v-sheet class="d-flex flex-column">
        <div class="d-flex">
          <ILabel
            :label="$t('조직')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <i-input 
                v-model="saveParam.ASGN_FULL_NM"
                width="620px"
              />
            </template>
          </ILabel>
        </div>
        <div class="d-flex">
          <ILabel
            :label="$t('이름')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <i-input 
                v-model="saveParam.VIOLATOR"
                width="285px"
              />
            </template>
          </ILabel>
          <ILabel
            :label="$t('사번')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <i-input 
                v-model="saveParam.VIO_EMP_NO"
                width="285px"
              />
            </template>
          </ILabel>
        </div>
        <div class="d-flex">
          <ILabel
            :label="$t('상태')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <i-input 
                v-model="saveParam.STUS_CD"
                width="285px"
              />
            </template>
          </ILabel>
          <ILabel
            :label="$t('최근1년 위반건수')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <i-input 
                v-model="saveParam.WIBAN_CNT"
                width="285px"
              />
            </template>
          </ILabel>
        </div>
        <div class="d-flex">
          <ILabel
            :label="$t('소속구분')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <i-input 
                v-model="saveParam.USER_DIV_NM"
                width="285px"
              />
            </template>
          </ILabel>
          <ILabel
            :label="$t('위반일시')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <i-input 
                v-model="saveParam.VIO_TIME"
                width="285px"
              />
            </template>
          </ILabel>
        </div>
        <div class="d-flex">
          <ILabel
            :label="$t('위반장소')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <i-input 
                v-model="saveParam.VIO_PLC_NM"
                width="285px"
              />
            </template>
          </ILabel>
          <ILabel
            :label="$t('첨부')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <div class="d-flex">
                <i-input 
                    v-model="saveParam.RELIF_FILE_ID_YN"
                    readonly
                    width="185px"
                  />
                  <v-btn @click="uploadPopup">파일첨부</v-btn>
              </div>
            </template>
          </ILabel>
        </div>
        <div class="d-flex">
          <ILabel
            :label="$t('경감사유')"
            labelLoc="top"
          >
            <template #editor="editorProps">
              <i-textarea 
                v-model="saveParam.RELIF_CAUSE"
                :row="8"
                width="620px"
              />
            </template>
          </ILabel>
        </div>
      </v-sheet>
    </v-card-text>
  </v-card>
    <!-- 첨부파일 관리 -->
    <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded" />
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (440px - 12px));
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 460px;
  }
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>