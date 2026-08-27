<!--
  화면명 : 공정안전자료 - 변경이력팝업
  화면개요 : 메인 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonSearchnoAuthApi
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
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
// const fileUploadButton = reactive(["btnDelete"])
const titleButton = reactive(['btnClose'])
const uploadBtn = reactive(['btnDownLoad'])
const isAdmin = ref(0)
const dialog = ref(false)

const titleInfo = reactive({
  bsns : '',
  dept : '',
  process: '',
})
const userNM= ref(null)
const revDate = ref(null)
const revSeq = ref(null)
const revDiv = ref([
  { DISPLAY_TEXT: '정기', CODE: 'A' },
  { DISPLAY_TEXT: '수시', CODE: 'B' },
])
const rev_Div=ref(null)
const revContent = ref(null)
const remarks = ref(null)
const fileID =ref(null)
const write =ref(null)
const visibleFile = ref(true)
const fileLength =ref(true);

const saveParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : '',
  DEPT_CD : '',
  PROCESS_CD : '',
  REV_SEQ : 0,
  REV_DIV : '',
  REV_DATE : '',
  REV_CONTENT : '',
  FILE_ID : '',
  REMARKS : '',
  USER_ID : userStore.userId,
  
})

const searchParam=reactive({})

const initParams = async (data) => {




  
  saveParams.BSNS_CD = data.BSNS_CD;
  saveParams.DEPT_CD = data.DEPT_CD
  saveParams.PROCESS_CD = data.PROCESS_CD
  saveParams.CHG_NO = data.CHG_NO

  searchParam.CMPNY_DIV = data.CMPNY_DIV
  searchParam.BSNS_CD = data.BSNS_CD;
  searchParam.DEPT_CD = data.DEPT_CD
  searchParam.PROCESS_CD = data.PROCESS_CD
  searchParam.CHG_NO = data.CHG_NO

  const res= await commonSearchnoAuthApi({ queryId: 'SPPFJ0010_SEARCH_18', param: searchParam })

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

  if(div=='C')
  {
    
    userNM.value=userStore.userName + ' ' + userStore.deptNm
  }
  else
  {
    if(resData.USER_ID == userStore.userId)
    {
      userNM.value=userStore.userName + ' ' + userStore.deptNm
    }
    else
    {
      userNM.value=resData.KOR_NM
    }
  }
  
  
  titleInfo.bsns = resData.BSNS_NM
  titleInfo.dept = resData.DEPT_NM
  titleInfo.process = resData.PROCESS_NM

  write.value = div=="C" || div=="M" ? true : false
  revSeq.value = div=="C" ? 0 : resData.REV_SEQ
  revDate.value = div=="C" ? dayjs().format("YYYY-MM-DD") : dayjs(resData.REV_DATE).format("YYYY-MM-DD")
  rev_Div.value= div=="C" ? 'A' : resData.REV_DIV
  revContent.value= div=="C" ? null : resData.REV_CONTENT
  remarks.value = div=="C" ? null : resData.REMARKS
  fileID.value = div=="C" || isEmpty(resData.FILE_ID) ? create_UUID() : resData.FILE_ID
  

  fileUpload.value.setGuid(fileID.value);
  fileUpload.value.onButtonsClick({ id: "btnSearch" });
}

// // 파일 아이디 체크
// const checkFileId = () => {
//   if (saveParam[0].NOTICE_FILEID === null || saveParam[0].NOTICE_FILEID === undefined) {
//     fileUpload.value.setGuid()
//   } else {
//     //파일아이디 있을때
//     fileUpload.value.setGuid(saveParam[0].NOTICE_FILEID)
//   }
//   saveParam[0].NOTICE_FILEID = fileUpload.value.guid
//   fileUpload.value.onButtonsClick({ id: "btnSearch" })
// }


// 팝업 초기세팅
const openPopup = async (data) => {
  
  // 변수 초기화 작업
  
  await initParams(data)

  if(write.value)
  {
    menuTitle.value.visibleBtn('btnUpdate', true);
    // fileUpload.value.enableFileUploadButton(['btnDelete'])  
  }
  else
  {
    menuTitle.value.visibleBtn('btnUpdate', false);
    // fileUpload.value.diableFileUploadButton(['btnDelete'])  
  }

  // 버튼 활성화 여부
  //menuTitle.value.disableBtn(['btnUpdate'], isDisabled)
  
  buttonHide();
  dialog.value =true

}

// 바인딩 데이터 세팅
const setInfo = (isNew, data) => {
  // 권한 세팅
  isAdmin.value = data.isAdmin

  // 팝업 제목 세팅


  // 등록/수정 분기 세팅
  saveParams.SAVE_YN = isNew ? 'Y' : 'N'

  // 변경등록 세팅
  saveParams.BSNS_CD = data.BSNS_CD
  saveParams.DEPT_CD = data.DEPT_CD
  saveParams.PROCESS_CD = data.PROCESS_CD
  saveParams.ITEM_CD = data.ITEM_CD


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

const onButtonsClick = btn => {
  if(btn.id === 'btnClose') {
    closePopup()
  }
  else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
}

const beforeSave = () => {


  if(!revContent.value) {
    return Message.warn("개정사유를 입력해 주십시오.")
  }

  saveParams.BSNS_CD 
  saveParams.DEPT_CD 
  saveParams.PROCESS_CD 
  saveParams.REV_SEQ = revSeq.value
  saveParams.REV_DIV = rev_Div.value
  saveParams.REV_DATE = revDate.value.replace(/-/g,"")
  saveParams.REV_CONTENT = revContent.value
  saveParams.FILE_ID = fileID.value
  saveParams.REMARKS = remarks.value
  
  return true
}

const saveData = async () => {

  return commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_19', list: [saveParams] })
}

const afterSave = (res) => {

  let resdata
  resdata=res.list
    if(resdata.length>0)
    {
      if(!revSeq.value)
      {
        revSeq.value=resdata[0].OUT_SEQ;
      }
    }
  emit('upDate')
  // closePopup()

  buttonHide();
}

const closePopup = () => {
  
  // 파일을 첨부해야지 닫히는거 없이 조건없이 닫힘
  // if(fileLength.value > 0)
  // {
  //   fileUpload.value.clearGrid();
  //   dialog.value = false
  // }
  // if(revSeq.value && !write.value)
  // {
  //   fileUpload.value.clearGrid();
  //   dialog.value = false
  // }
  // else if(!revSeq.value && write.value)
  // {
  //   fileUpload.value.clearGrid();
  //   dialog.value = false
  // }

  fileUpload.value.clearGrid();
  dialog.value = false
  
}
const file_Upload = (val) =>{
  
  fileID.value=val.fileId;

  emit('upDate')
}

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

const buttonHide =()=>{

if(write.value)
{
  if(!revSeq.value)
  {
    visibleFile.value=false
    fileUpload.value.diableFileUploadButton(['btnDownLoad','btnDelete']);
  }
  else
  {
    visibleFile.value=true
    fileUpload.value.enableFileUploadButton(['btnDownLoad','btnDelete']);
    
  }
}
else
{
    visibleFile.value=false
    fileUpload.value.enableFileUploadButton(['btnDownLoad'])
    fileUpload.value.diableFileUploadButton(['btnDelete'])
}
}

const dataLength = (val)=>{

  fileLength.value=val

}

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="700"
    height="870"

  >
    <div class="title-bar">{{ titleInfo.bsns }} - {{ titleInfo.dept }} - {{ titleInfo.process }}</div>
    <v-card class="pa-3 fill-height rounded-b-5" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="titleButton"
          :hiddenManuel="true"
          @click-button="onButtonsClick"
          usePermission
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <v-container fluid class="searchArea fill-height pa-0">
          <VCol style="height: 100%;">
            <VCol class="pa-0 mb-8">
              <div class="mb-2">
                <VRow>
                  <VCol cols="6">
                    <i-input
                      v-model="userNM"
                      label-width="70px"
                      width="100%"
                      :label="$t('등록자')"
                      disabled
                      top-label
                    />
                  </VCol>
                  <VCol cols="6">
                    <i-input
                      v-model="revDate"
                      label-width="70px"
                      width="100%"
                      :label="$t('개정일자')"
                      disabled
                      top-label
                    />
                  </VCol>
                </VRow>
              </div>
              <div class="mb-2">
                <i-select
                  v-model="rev_Div"
                  label-width="70px"
                  width="30%"
                  :label="$t('구분')"
                  :items="revDiv"
                  item-value="CODE"
                  item-title="DISPLAY_TEXT" 
                  :disabled ="true"
                  top-label
                  readonly
                />
              </div>
              <div class="mb-2">
                <i-textarea
                  v-model="revContent"
                  label-width="70px"
                  width="100%"
                  :label="$t('개정사유')"
                  :disabled ="true"
                  :row=2
                  required
                  readonly
                />
              </div>
              <div>
                <i-textarea
                  v-model="remarks"
                  label-width="70px"
                  width="100%"
                  :label="$t('비고')"
                  :row=2
                  :disabled ="true"
                  readonly
                />
              </div>
              <div v-if="!visibleFile && !revSeq " style="color: red;margin: 5px;padding: 5px;">※ 내용 저장 후 파일을 업로드 하실 수 있습니다. </div>
            </VCol>
            <VCol class="pa-0" :style="{height: revSeq ? '56%' : '50%'}">
              <IUpload_NoAuth
              ref="fileUpload"
              class="mr-2"
              file-grid-width="100%"
              :buttonList="uploadBtn"
              @uploaded="file_Upload"
              @dataLength="dataLength"
              :guid2="fileID"
              :isVisibled="false"
              >
              </IUpload_NoAuth>
            </VCol>
          </VCol>
        </v-container>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>

</style>