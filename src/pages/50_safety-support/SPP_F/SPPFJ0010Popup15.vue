<!--
  화면명 : 가동 전 점검 변경 이력 추가/수정
  화면개요 : 추가 및 수정
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonSearchnoAuthApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import _ from 'lodash'
import { isEmpty, isNullOrUndefined } from "@/@core/utils"
import { useLogsStore } from '@/@hiway/stores/logs'
import { commonDeletFilesApi } from "@hiway/api/commonFileApi"
import { useCommonStore } from '@/@hiway/stores/common'
import { useRoute } from 'vue-router'
import IUpload from '@/components/IUpload.vue'
import IUpload_NoAuth from '@/components/IUpload_NoAuth.vue'

const emit = defineEmits(['upDate'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const commonStore = useCommonStore()
const route = useRoute()
const userStore = useUserStore()
const fileUpload = ref(null)
const menuTitle = ref(null)
const uploadBtn = reactive(['btnDownLoad'])
const isAdmin = ref(0)
const dialog = ref(false)

const write =ref(null)
const visibleFile = ref(true)
const fileLength =ref(true);

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  PROCESS_CD: [],
  GUBUN: [
    { COD: 'A', TXT: '신규 설비 설치'},
    { COD: 'B', TXT: '주요 구조 변경'},
    { COD: 'C', TXT: '1개월 이상 운휴'}
  ]
})

const saveParams = reactive({
  CMPNY_DIV : 'HHI',
  USER_NM: '',
  BSNS_CD : '',
  DEPT_CD : '',
  PROCESS_CD : '',
  REV_SEQ : 0,
  GUBUN : '',
  INSPECT_DATE : '',
  CONTENT : '',
  FILE_ID : '',
  REMARKS : '',
  USER_ID : userStore.userId,
  CHG_NO : ''
})

// 데이터 초기화
const initParams = async (data) => {
  saveParams.BSNS_CD = data.BSNS_CD
  saveParams.DEPT_CD = data.DEPT_CD
  saveParams.PROCESS_CD = data.PROCESS_CD

  saveParams.CHG_NO = data.CHG_NO

  const res= await commonSearchnoAuthApi({ queryId: 'SPPFJ0010_SEARCH_21', param: saveParams })  

  

  let div
  console.log(res);
  let resData=res.ORESULT_CUR[0]
  if(res.ORESULT_CUR.length>0)
  {
    div='M'
  }
  else
  {
    div='C'
  }

  // 신규 등록일 시, 기존의 데이터를 수정할 시
  if(div == 'C') {
    saveParams.USER_NM = userStore.userName
  } else {
    saveParams.USER_NM = data.KOR_NM
  }
  
  write.value = div == 'C' || div == 'M' ? true : false
  saveParams.REV_SEQ = div == 'C' ? 0 : resData.REV_SEQ
  saveParams.INSPECT_DATE = div == 'C' ? dayjs().format('YYYY-MM-DD') : dayjs(resData.INSPECT_DATE).format('YYYY-MM-DD')
  saveParams.FILE_ID = div == 'C' || isEmpty(resData.FILE_ID) ? create_UUID() : resData.FILE_ID
  saveParams.GUBUN = div == 'C' ? 'A' : resData.GUBUN
  saveParams.CONTENT = div == 'C' ? '' : resData.CONTENT
  saveParams.REMARKS = div == 'C' ? '' :resData.REMARKS
 
  console.log(write.value);

  fileUpload.value.setGuid(saveParams.FILE_ID)
  fileUpload.value.onButtonsClick({ id: 'btnSearch' })
}

// 코드 값 조회
const initCodeList = async () => {
  Promise.all([ 
    commonSearchnoAuthApi({ queryId: 'SPPFE0010_COMBO_01', param: saveParams }),
    commonSearchnoAuthApi({ queryId: 'SPPFE0010_COMBO_02', param: saveParams }),
    commonSearchnoAuthApi({ queryId: 'SPPFE0010_COMBO_03', param: saveParams }),
  ]).then(res => {    
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.PROCESS_CD = res[2].ORESULT_CUR
  })
}

// 팝업 초기세팅
const openPopup = async (data) => {
  // 변수 초기화 작업
  await initParams(data)
  await initCodeList()

  if (write.value) {
    menuTitle.value.visibleBtn('btnUpdate', true);
    // fileUpload.value.enableFileUploadButton(['btnDelete'])  
  } else {
    menuTitle.value.visibleBtn('btnUpdate', false);
    // fileUpload.value.diableFileUploadButton(['btnDelete'])  
  }

  // 버튼 활성화 여부
  //menuTitle.value.disableBtn(['btnUpdate'], isDisabled)
  
  buttonHide()
  dialog.value = true
}

// 활성화 여부(권한)
const isDisabled = computed(() => {
  let isUser = false
  let isFirst = false
  let isRegi = false
  // 1. 관리자 or 본인 (isAdmin.value > 1 || userStore.userId === saveParams.LAST_INSERT_USER_ID) 
  if(isAdmin.value > 1 || userStore.userId === saveParams.LAST_INSERT_USER_ID) {
    isUser = true
  }
  // 2. 가장 최근 등록의 수정만(SAVE_YN === 'N' && LATEST_INSERT_SEQ === 1)
  if(saveParams.SAVE_YN === 'N' && saveParams.LATEST_INSERT_SEQ === '1') {
    isFirst = true
  }
  // 3. 등록일 때(SAVE_YN === 'Y')
  if(saveParams.SAVE_YN === 'Y') {
    isRegi = true
  }
  
  return !((isUser && isFirst) || isRegi)
})

// 상단 버튼 클릭
const onButtonsClick = btn => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
}

// 저장 전 validation 체크
const beforeSave = () => {
  if(isEmpty(saveParams.INSPECT_DATE)) {
    return Message.warn('가동 전 점검일자를 입력하세요.')
  } else if (isEmpty(saveParams.GUBUN)) {
    return Message.warn('구분을 입력하세요.')
  } else if (isEmpty(saveParams.CONTENT)) {
    return Message.warn('내용을 입력하세요.')
  }
  return true
}

//  저장
const saveData = () => {
  let params = _.cloneDeep(saveParams)
  // 날짜 데이터를 yyyy-mm-dd 에서 yyyymmdd로 변경
  params.INSPECT_DATE = saveParams.INSPECT_DATE.replaceAll('-','')
  return commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_21', list: [params] })
}

// 저장 후
const afterSave = (res) => {
  let resdata = res.list
  if(resdata.length > 0) {
    if(!saveParams.REV_SEQ) {
      saveParams.REV_SEQ = resdata[0].OUT_SEQ;
    }
  }

  emit('upDate')
  buttonHide();
}

// 팝업 닫기
const closePopup = () => {
  // 2025.07.07 파일 여부 체크 없이 그냥 닫힘
  // if (fileLength.value > 0) {
  //   fileUpload.value.clearGrid()
  //   dialog.value = false
  // } else if(saveParams.REV_SEQ && !write.value) {
  //   fileUpload.value.clearGrid()
  //   dialog.value = false
  // } else if(!saveParams.REV_SEQ && write.value) {
  //   fileUpload.value.clearGrid()
  //   dialog.value = false
  // } else {
  //   // 첨부 파일이 없을 경우 필수 입력 표시
  //   return Message.warn("첨부파일은 필수입니다.")
  // }  

  fileUpload.value.clearGrid()
  dialog.value = false
}

// 파일 업로드 시 메인 화면 업데이트
const file_Upload = (val) =>{
  saveParams.FILE_ID = val.fileId;
  emit('upDate')
}

// file Id 생성
const create_UUID = () => {
  let dt = new Date().getTime()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

defineExpose({
  openPopup
})

// 이미 결재중인 데이터는 수정 불가
const buttonHide = () => {
  if (write.value) {
    if (!saveParams.REV_SEQ) {
      visibleFile.value = false
      fileUpload.value.diableFileUploadButton(['btnDownLoad','btnDelete']);
    } else {
      visibleFile.value = true
      fileUpload.value.enableFileUploadButton(['btnDownLoad','btnDelete']);
    }
  } else {
      visibleFile.value=false
      fileUpload.value.enableFileUploadButton(['btnDownLoad'])
      fileUpload.value.diableFileUploadButton(['btnDelete'])
  }
}

const dataLength = (val)=>{
  fileLength.value = val
}

</script>

<template>
  <v-dialog 
    v-model="dialog"
    eager
    persistent
    class="p-absolute user-select-none"
    width="700"
    height="800"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>가동 전 점검 변경이력 추가 및 수정</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area" style="height:700px;">
        <v-sheet class="searchArea flex-column mb-2">
          <div class="d-flex">
            <i-select
              v-model="saveParams.BSNS_CD"
              label-width="70px"
              width="250px"
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              disabled
              top-label
            />
            <i-select
              v-model="saveParams.DEPT_CD"
              label-width="70px"
              width="250px"
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              disabled
              top-label
            />
          </div>
          <div class="d-flex mt-2">
            <i-select
              v-model="saveParams.PROCESS_CD"
              label-width="70px"
              width="250px"
              :label="$t('공정설비')"
              :items="codeList.PROCESS_CD"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              disabled
              top-label
            />
            <i-input
              v-model="saveParams.USER_NM"
              label-width="70px"
              width="250px"
              :label="$t('등록자')"
              disabled
              top-label
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              type="date"
              v-model="saveParams.INSPECT_DATE"
              label-width="70px"
              width="250px"
              :label="$t('개정일자')"
              :disabled ="true"
              top-label
              required
              readonly
            />
            <i-select
              v-model="saveParams.GUBUN"
              label-width="70px"
              width="250px"
              :label="$t('구분')"
              :items="codeList.GUBUN"
              item-value="COD"
              item-title="TXT" 
              :disabled ="true"
              top-label
              required
              readonly
            />
          </div>
          <i-textarea
            class="mt-2"
            v-model="saveParams.CONTENT"
            label-width="70px"
            width="100%"
            :label="$t('내용')"
            :disabled ="true"
            :row=2
            required
            readonly
          />
          <i-textarea
            class="mt-2"
            v-model="saveParams.REMARKS"
            label-width="70px"
            width="100%"
            :label="$t('비고')"
            :row=2
            :disabled ="true"
            readonly
          />
        </v-sheet>
        <div v-if="!visibleFile && !saveParams.REV_SEQ" style="color: red;margin: 5px;">※ 내용 저장 후 파일을 업로드 하실 수 있습니다. </div>
        <IUpload_NoAuth
          ref="fileUpload"
          class="mr-2"
          file-grid-width="100%"
          :buttonList="uploadBtn"
          @uploaded="file_Upload"
          @dataLength="dataLength"
          :guid2="fileID"
          style="height: 250px"
          :isVisibled="false">
        </IUpload_NoAuth>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>

</style>