<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import { useUserStore } from '@hiway/stores/user'

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['Saved'])
const oriDivision = ref('')

const placeName = ref('')

const codeList = reactive({
  BSNS_CD : [],
  USE_YN: [
    { TXT: "사용", COD: "Y" },
    { TXT: "미사용", COD: "N" },
  ],
})

const itemField = reactive({
  DIVISION  : '', //장소 구분
  PLACE_SEQ : '', //장소순번
  BSNS_CD   : '', //사업부
  PLACE_NAME: '', //장소
  USE_YN    : 'Y', //사용여부
  USER_ID: userStore.userId,
  REMARK   : '', //비고

})

const readOnlyValue = reactive({
  BSNS_CD : false,
})

const bsnsSearchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv
})

const initCodeList = (division) => {

  if(division ==='B'){
    Promise.all([
      //사업부
      commonSearchApi({
        queryId: 'HLTHF0030_BSNS_SEARCH',
        param: bsnsSearchParam
      }),
     
    ]).then((res)=>{

      codeList.BSNS_CD = [...res[0].ORESULT_CUR]
      if(!codeList.BSNS_CD.some(item => item.TXT === "선택")){
      codeList.BSNS_CD.unshift({ TXT: "선택", COD: "" });
      }
    })
  }
}


const openPopup = (division, bsns, data) => {
  oriDivision.value = division
  dialog.value = true
  itemField.DIVISION = division
  if(division === 'A'){
    placeName.value = '검사장소'
  }else if(division === 'B'){
    placeName.value = '수령장소'
  }

  initCodeList(division);

  itemField.BSNS_CD = bsns ? bsns : ''
  itemField.USE_YN = 'Y'

  if(data){
    //.net 화면에서는 수정가능해서 비활성화
    //readOnlyValue.BSNS_CD = true

    for(const [key, value] of Object.entries(data)){
      if(itemField.hasOwnProperty(key)){
        itemField[key] = value;
      }
    }
  }
}

const closePopup = () => {
  dialog.value = false
  //초기화
  readOnlyValue.BSNS_CD = false //년도 readonly 해제
  for (let i in itemField) {
    itemField[i] = ''
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

//저장관련 로직 시작
const beforeSave = () => {


  if (itemField.DIVISION==='B' && !itemField.BSNS_CD){
    Message.warn(t('사업부는 필수값 입니다.'))
    return false
  } else if (!itemField.PLACE_NAME) {
    Message.warn(t(placeName.value +'는 필수값 입니다.'))
    return false
  } else if (!itemField.USE_YN) {
    Message.warn(t('사용여부는 필수값 입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV : userStore.cmpnyDiv,
    DIVISION  : itemField.DIVISION,
    PLACE_SEQ : itemField.PLACE_SEQ,
    BSNS_CD   : itemField.BSNS_CD,
    PLACE_NAME: itemField.PLACE_NAME,
    USE_YN    : itemField.USE_YN,
    USER_ID: userStore.userId,
    REMARK: itemField.REMARK,
  }

  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'HLTHF0030_SAVE_01',
    list: saveParam,
  })
}

const afterSave = (res) => {
  emit('Saved')
  closePopup()
}

onMounted(() => {
  placeName.value = ''
})

const displayName = computed(() => placeName.value || '');



defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ displayName }} 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="true"
          :button-list="[
            'btnUpdate', //저장
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="d-flex flex-gap">
              <i-select
                v-show="itemField.DIVISION==='B'"
                :label="$t('사업부')"
                :items="codeList.BSNS_CD"
                width="100px"
                item-title="TXT"
                item-value="COD"
                top-label
                required
                v-model="itemField.BSNS_CD"
                :disabled="readOnlyValue.BSNS_CD"
                class="custom-flex-1"
              />
              <i-input
                :label="$t(displayName)"
                width="150px"
                top-label
                required
                type="text"
                v-model="itemField.PLACE_NAME"
                class="custom-flex-2"
              />
              <i-select
                :label="$t('사용여부')"
                :items="codeList.USE_YN"
                width="60px"
                item-title="TXT"
                item-value="COD"
                top-label
                required
                v-model="itemField.USE_YN"
                class="custom-flex-1"
              />
              <span class="custom-flex-1"/>
            </div>
            <div class="d-flex flex-gap mb-2">
              <i-textarea
                :label="$t('비고')"
                top-label
                width="100%"
                v-model="itemField.REMARK"
                class="custom-flex-1"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped>
  .form-row {
    display: flex;
    flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
    gap: 10px; /* 요소 간격 */
  }

  .custom-flex-1 {
    /* width: calc(25% - 0px) !important; */
    flex: 1 !important;
    min-width: 0px !important;
    max-width: none !important;
    margin: 0 !important;
  }

  .custom-flex-2 {
    /* width: calc(25% - 0px) !important; */
    flex: 2 !important;
    min-width: 0px !important;
    max-width: none !important;
    margin: 0 !important;
  }

  .flex-gap {
    gap: 10px;
  }
</style>