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
  commonExecuteApi
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IButtonList from '@/components/IButtonList.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { isEmpty, isNullOrUndefined } from "@/@core/utils"
import { useLogsStore } from '@/@hiway/stores/logs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import { commonBigUploadFilesApi, commonDeletFilesApi, commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import { useCommonStore } from '@/@hiway/stores/common'
import { useRoute } from 'vue-router'
import { cloneDeep } from 'lodash-es'

const emit = defineEmits(['upData'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const commonStore = useCommonStore()
const route = useRoute()
const userStore = useUserStore()
const fileUpload = ref(null)
const menuTitle = ref(null)
// const fileUploadButton = reactive(["btnDelete"])
const titleButton = reactive(['btnUpdate', 'btnClose'])
const isAdmin = ref(0)

const dialog = ref(false)
const titleInfo = reactive({
  process: '',
  item: ''
})

const saveParams = reactive({})
const initSaveParams = () => {
  const temp = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: '', //사업부
    DEPT_CD: '', //부서
    PROCESS_CD: '', //공정설비
    ITEM_CD: '',

    LAST_INSERT_USER_ID: userStore.userId,
    LAST_INSERT_USER_NM: `${userStore.userName} (${userStore.deptNm})`,
    LAST_INSERT_DATE: dayjs().format('YYYY-MM-DD'),
    LATEST_INSERT_SEQ: '',
    UPDATE_REASON: '',
    UPDATE_DETAIL: '',

    ITEM_SEQ: '',
    SAVE_YN: ''
  }
  Object.keys(temp).forEach(key => {
    saveParams[key] = temp[key]
  })
}

const saveFiles = reactive({})
const initSaveFiles = () => {
  const fileTemp = {
    FILE_LIST: Array(5).fill().map((_, index) => ({
      FILE_ID: '',
      FILE_NM: '',
      PREV_FILE_NM: '',
      FILE_SEQ: index + 1
    })),
  }
  saveFiles['FILE_LIST'] = fileTemp.FILE_LIST
}

// 팝업 초기세팅
const openPopup = (isNew, data) => {
  // console.log("isNew", isNew)
  // console.log("data", data)
  // 변수 초기화 작업
  initSaveFiles()
  initSaveParams()
  uploadFile.value = []

  // 변경등록 데이터 세팅
  setInfo(isNew, data)
  isFileDisabled.value = isDisabled.value
  // 파일 조회(등록/수정)
  if(isNew) {
    searchRegisterData(data)
    isFileDisabled.value = !isDisabled.value
  }else {
    searchModifyData(data)
  }
  

  // 버튼 활성화 여부
  menuTitle.value.disableBtn(['btnUpdate'], isDisabled.value)
  fileUpload.value.disableBtn(['btnFileAdd'], isFileDisabled.value)

  dialog.value = true
}

// 등록 시 파일 조회
const searchRegisterData = param => {
  commonSearchApi({ queryId: 'SPPFC0010_SEARCH_02', param: param }).then(res => {

    
    res.ORESULT_CUR.forEach((item, index) => {
      const data = {
        FILE_ID: item.FILE_ID,
        FILE_NM: '',
        PREV_FILE_NM: item.PREV_FILE_NM,
        FILE_SEQ: item.FILE_SEQ
      }
      if(saveFiles.FILE_LIST.length < index) {
        saveFiles.FILE_LIST.push(data)
      }else {
        saveFiles.FILE_LIST[data.FILE_SEQ - 1] = data
      }
    })

  })
}

// 수정 시 파일 조회
const searchModifyData = param => {
  Promise.all([
    commonSearchApi({ queryId: 'SPPFC0010_SEARCH_07', param: param }),
    commonSearchApi({ queryId: 'SPPFC0010_SEARCH_08', param: param })
  ]).then(res => {
    const listLen = res[0].ORESULT_CUR.length > res[1].ORESULT_CUR.length ? res[0].ORESULT_CUR.length : res[1].ORESULT_CUR.length 
    
    // 현재 파일 세팅
    res[0].ORESULT_CUR.forEach((item) => {
      saveFiles.FILE_LIST[item.FILE_SEQ - 1].FILE_NM = item.PREV_FILE_NM
      saveFiles.FILE_LIST[item.FILE_SEQ - 1].FILE_ID = item.FILE_ID
      saveFiles.FILE_LIST[item.FILE_SEQ - 1].FILE_SEQ = item.FILE_SEQ
      searchFile(item.FILE_ID, item.FILE_SEQ - 1)
    })
    // 이전 파일 세팅
    res[1].ORESULT_CUR.forEach((item) => {
      saveFiles.FILE_LIST[item.FILE_SEQ - 1].PREV_FILE_NM = item.PREV_FILE_NM
    })
  })
}

// 바인딩 데이터 세팅
const setInfo = (isNew, data) => {
  // 권한 세팅
  isAdmin.value = data.isAdmin

  // 팝업 제목 세팅
  titleInfo.item = data.ITEM_NM
  titleInfo.process = data.PROCESS_NM

  // 등록/수정 분기 세팅
  saveParams.SAVE_YN = isNew ? 'Y' : 'N'

  // 변경등록 세팅
  saveParams.BSNS_CD = data.BSNS_CD
  saveParams.DEPT_CD = data.DEPT_CD
  saveParams.PROCESS_CD = data.PROCESS_CD
  saveParams.ITEM_CD = data.ITEM_CD

  // 변경등록 세팅 (수정)
  if(!isNew) {
    saveParams.ITEM_SEQ = data.ITEM_SEQ
    saveParams.LATEST_INSERT_SEQ = data.LATEST_INSERT_SEQ
    saveParams.LAST_INSERT_USER_ID = data.LAST_INSERT_USER_ID
    saveParams.LAST_INSERT_USER_NM = data.LAST_INSERT_USER_NM
    saveParams.LAST_INSERT_DATE = data.LAST_INSERT_DATE
    saveParams.UPDATE_REASON = data.UPDATE_REASON
    saveParams.UPDATE_DETAIL = data.UPDATE_DETAIL
  }

}

/* 추가 버튼 클릭시 파일업로드 기능 실행 */
const uploadFile = ref([])
const fileInput = ref(null)
const openFileInput = index => {
  fileInput.value[index].click()
}

const handleFileInputChange = (e, index) => {
  let file = e.target.files[0]

  if(isEmpty(file)) {
    return
  }

  saveFiles.FILE_LIST[index].FILE_NM = file.name
  autoFileUpload(file, index, 'SCAN_ID_YN')
}

const create_UUID = () => {
  let dt = new Date().getTime();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const autoFileUpload = async (file, index, yn) => {
  let guid = create_UUID()

  // 자르는 사이즈
  let chunkSize = 1024 * 1024 // 1MB
  // total size 계산
  let totalChunks = Math.ceil(file.size / chunkSize)

  let currentChunk = 0
  let hasErr = false

  const sendNextFile = async () => {

    // chunk size 만큼 데이터 분할
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // form data 형식으로 전송
    const formData = new FormData();

    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: saveFiles.FILE_LIST[index].FILE_ID ? saveFiles.FILE_LIST[index].FILE_ID : guid,
      FILE_NO: '',
      FILE_TITLE: file.name,
      FILE_NAME_ORIGINAL: file.name,
      FILE_NAME: file.name,
      FILE_PATH: `${commonStore.systemCode}${route.path}/`,
      FILE_TYPE: file.name.split(".").pop(),
      FILE_SIZE: Math.round(file.size / 1024.0),
      USER_ID: userStore.userId,
      CHUNK_NUMBER: currentChunk,
      TOTAL_CHUNKS: totalChunks
    }

    formData.append("file", chunk, file.name)
    formData.append(
      "param",
      new Blob([JSON.stringify(param)], { type: "application/json" })
    );
    commonBigUploadFilesApi(formData).then(async res => {
      uploadFile.value[index] = res

      saveFiles.FILE_LIST[index].FILE_ID = res.FILE_ID ? res.FILE_ID : ''

      if (res.result.status === "207") {
        currentChunk++
        if (currentChunk < totalChunks) {
          await sendNextFile()
        }
      }else if (res.result.status === "200") {
        
      }

      saveFile(index)
    }).catch((e) => {
      hasErr = true
    })
  }
  await sendNextFile()
}

const saveFile = (index) => {
  const arr = []
  const temp = Object.assign({}, saveFiles.FILE_LIST[index], saveParams)

  arr.push(temp)

  commonExecuteApi({ queryId: 'SPPFC0010_SAVE_02', list: arr }).then(res => {
    Message.success(t('파일이 저장되었습니다.'))
  })
}

// const saveFileData = index => {

//   const arr = []
//   const temp = Object.assign({}, saveFiles.FILE_LIST[index], saveParams)

//   arr.push(temp)

//   // for(let i = 0; i < saveFiles.FILE_LIST.length; i++) { 
//   //   if(!isEmpty(saveFiles.FILE_LIST[i].FILE_NM)) {
//   //     const temp = Object.assign({}, saveFiles.FILE_LIST[i], saveParams)
//   //     arr.push(temp)
//   //   }
//   // }
//   return commonExecuteApi({ queryId: 'SPPFC0010_SAVE_02', list: arr })
// }

// const afterFileSave = () => {
//   Message.success(t('파일이 저장되었습니다.'))
// }

// 조회로직
const searchFile = (fileId, index) => {
  
  const param = { FILE_ID: fileId }
  commonSearchApi({ queryId: 'searchFile', param: param }).then(res => {
    console.log(res.ORESULT_CUR[0])
    uploadFile.value[index] = res.ORESULT_CUR[0]
    saveFiles.FILE_LIST[index].FILE_ID = res.FILE_ID ? res.FILE_ID : ''
  })
}

const clearFile = (index) => {
  const param = {
    CMPNY_DIV: uploadFile.value[index].CMPNY_DIV,
    FILE_ID: uploadFile.value[index].FILE_ID,
    FILE_NO: uploadFile.value[index].FILE_NO,
    FILE_NAME_ORIGINAL: uploadFile.value[index].FILE_NAME_ORIGINAL,
    FILE_NAME: uploadFile.value[index].FILE_NAME,
    FILE_PATH: uploadFile.value[index].FILE_PATH,
    USER_ID: userStore.userId,
  }

  vm.$swal({ 
    title: t('삭제하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      saveParams.FILE_SEQ = index + 1
      console.log(saveParams)
      commonExecuteApi({ queryId: 'SPPFC0010_DELETE_01', list: [saveParams] }).then(res => { 
        if (res) { 
          commonDeletFilesApi([param]).then(res => {
            if (res.result.status === '200') {
              Message.success(t('삭제 되었습니다.'))
              
              saveFiles.FILE_LIST[index].FILE_NM = ''
              if(isEmpty(saveFiles.FILE_LIST[index].PREV_FILE_NM)) {
                saveFiles.FILE_LIST[index].FILE_ID = ''
              }
              delete uploadFile.value[index]
            }
          }).catch(err => {
            return Message.success(err)
          }).finally(() => {
            // fileSet()
          })
        }
      })
    }
  })
}

const downloadFile = (index) => {
  const param = {
    CMPNY_DIV: uploadFile.value[index].CMPNY_DIV,
    FILE_ID: uploadFile.value[index].FILE_ID,
    FILE_NO: uploadFile.value[index].FILE_NO,
    FILE_NAME_ORIGINAL: uploadFile.value[index].FILE_NAME_ORIGINAL,
    FILE_NAME: uploadFile.value[index].FILE_NAME,
    FILE_PATH: uploadFile.value[index].FILE_PATH,
    USER_ID: userStore.userId,
  }

  commonSearchApi({ queryId: 'searchFile', param: param }).then( res => {
    commonDownloadFilesApi(res.ORESULT_CUR.at(-1)).then((res) => {
      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)

      link.download = decodeURI(file[1].replace('";', ''))
      link.click()
      URL.revokeObjectURL(link.href)
    })
    .catch((e) => {
      return Message.success(e)
    })
  })
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

const isFileDisabled = ref(null)

const onButtonsClick = btn => {
  if(btn.id === 'btnClose') {
    closePopup()
  }else if(btn.id === 'btnFileAdd') {
    saveFiles.FILE_LIST.push({
      FILE_ID: '',
      FILE_NM: '',
      PREV_FILE_NM: '',
      FILE_SEQ: ''
    })
  }else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
}

const beforeSave = () => {

  const files = saveFiles.FILE_LIST.filter(item => item.FILE_NM.trim() !== '')

  if(isEmpty(saveParams.UPDATE_REASON)) {
    return Message.err("변경사유를 입력해 주십시오.")
  }
  if(isEmpty(saveParams.UPDATE_DETAIL)) {
    return Message.err("변경상세를 입력해 주십시오.")
  }
  // if(files.length === 0) {
  //   return Message.err("파일을 첨부해 주십시오.")
  // }

  return true
}



const saveData = () => {
  saveParams.LAST_INSERT_USER_ID = userStore.userId
  // const res = await 
  return commonExecuteApi({ queryId: 'SPPFC0010_SAVE_01', list: [saveParams] })

  // saveParams.ITEM_SEQ = res.list[0].OUT_RES_COL

  // const arr = []
  // const params = {
  //   CMPNY_DIV: userStore.cmpnyDiv,
  //   BSNS_CD: saveParams.BSNS_CD, //사업부
  //   DEPT_CD: saveParams.DEPT_CD, //부서
  //   PROCESS_CD: saveParams.PROCESS_CD, //공정설비
  //   ITEM_CD: saveParams.ITEM_CD,
  //   ITEM_SEQ: res.list[0].OUT_RES_COL
  // }

  // for(let i = 0; i < saveFiles.FILE_LIST.length; i++) { 
  //   if(!isEmpty(saveFiles.FILE_LIST[i].FILE_NM)) {
  //     const temp = Object.assign({}, saveFiles.FILE_LIST[i], params)
  //     arr.push(temp)
  //   }
  // }

  // return await commonExecuteApi({ queryId: 'SPPFC0010_SAVE_02', list: arr })
}

const afterSave = res => {
  saveParams.ITEM_SEQ = res.list[0].OUT_RES_COL
  isFileDisabled.value = false
  fileUpload.value.disableBtn(['btnFileAdd'], isFileDisabled.value)
  // emit('upData')
  // closePopup()
}

const closePopup = () => {
  // 새롭게 등록하는가? isNew
  // 저장 할건가? save_yn
  // 변경 등록을 눌렀지만, 저장은 하지 않았을때 isNew = true, SAVE_YN = 'Y'
  emit('upData')
  dialog.value = false
}

defineExpose({
  openPopup
})

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="700"
    height="800"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">{{ titleInfo.process }} - {{ titleInfo.item }}</div>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="titleButton"
          :hiddenManuel="true"
          @click-button="onButtonsClick"
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
                      v-model="saveParams.LAST_INSERT_USER_NM"
                      label-width="55px"
                      width="100%"
                      :label="$t('등록자')"
                      disabled
                    />
                  </VCol>
                  <VCol cols="6">
                    <i-input
                      v-model="saveParams.LAST_INSERT_DATE"
                      label-width="70px"
                      width="100%"
                      :label="$t('최종등록일')"
                      disabled
                    />
                  </VCol>
                </VRow>
              </div>
              <!-- <div class="mb-2">
                <i-input
                  v-model="saveParams.UPDATE_REASON"
                  label-width="55px"
                  width="100%"
                  :label="$t('변경사유')"
                  :disabled="isDisabled"
                  required
                />
              </div>
              <div>
                <i-input
                  v-model="saveParams.UPDATE_DETAIL"
                  label-width="55px"
                  width="100%"
                  :label="$t('변경상세')"
                  :disabled="isDisabled"
                  required
                />
              </div> -->
              <div class="mb-2">
                <i-textarea
                  v-model="saveParams.UPDATE_REASON"
                  label-width="55px"
                  width="100%"
                  :label="$t('변경사유')"
                  :disabled="isDisabled"
                  :row=2
                  required
                />
              </div>
              <div>
                <i-textarea
                  v-model="saveParams.UPDATE_DETAIL"
                  label-width="55px"
                  width="100%"
                  :label="$t('변경상세')"
                  :disabled="isDisabled"
                  :row=2
                  required
                />
              </div>
            </VCol>
            <VCol class="pa-0" style="height: 70%;">
              <IMenuTitle
                ref="fileUpload"
                :use-permission="false"
                :button-list="['btnFileAdd']"
                :hiddenManuel="true"
                @click-button="onButtonsClick"
              />
              <p v-if="saveParams.SAVE_YN === 'Y'" class="text-red">※ 내용 저장 후 파일을 업로드 하실 수 있습니다.</p>
              <p v-if="saveParams.SAVE_YN === 'N'" class="text-red">※ 신규첨부 파일은 이전파일과 맞게 업로드해주세요.</p>
              <template v-for="(item, index) in saveFiles.FILE_LIST" :key="index">
                <VRow class="d-flex" >
                  <VCol cols="5" style="margin-right: 20px;">
                    <div>
                      <i-input
                        :model-value="item.PREV_FILE_NM"
                        :label="$t('이전파일')"
                        width="100%"
                        disabled
                      />
                    </div>
                  </VCol>
                  <VCol cols="5" style="display: flex;">
                    <i-input
                      v-model="item.FILE_NM"
                      :label="$t(`첨부파일 ${index + 1}`)"
                      width="100%"
                      :clearable="!isDisabled"
                      @click:clearable="clearFile(index)"
                      readonly
                    />
                    <div class="d-flex align-center" v-if="!isDisabled">
                      <v-file-input 
                        style="display: none;" 
                        @change="handleFileInputChange($event, index)" 
                        ref="fileInput" 
                      />            
                      <v-btn @click="openFileInput(index)" :disabled="isFileDisabled">업로드</v-btn>
                    </div>
                    <div class="d-flex align-center" v-if="isDisabled">           
                      <v-btn @click="downloadFile(index)" :disabled="!item.FILE_NM">다운로드</v-btn>
                    </div>
                  </VCol>
                </VRow>
              </template>
            </VCol>
          </VCol>
        </v-container>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>

</style>