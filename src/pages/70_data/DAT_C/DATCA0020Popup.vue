<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import { commonDownloadFilesApi, commonDeletFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import { useLogsStore } from "@hiway/stores/logs"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IUpload from "@/components/IUpload.vue"
import { isFinite, toUpper } from "lodash-es"
import IGridTitle from "@/components/IGridTitle.vue"
import _ from "lodash"

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const route = useRoute()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const emit = defineEmits(["after-search"])
const isCreate = ref(false)
const fileVisible = ref(false) //파일업로드 visible 플래그
const isAdmin = ref(false)
const uploadFiles = ref([])

const props = defineProps({
  NOTICE_DIV_LIST: {
    Type: Array,
    default: [],
  },
  id: {
    Type: String,
    default: "",
  },
  btnList: {
    Type: Array,
    default: ['btnDelete', 'btnUpdate', 'btnClose']
  },
  fileBtnList: {
    Type: Array,
    default: ['btnDownLoad', 'btnDelete']
  },
  isReadonly: {
    Type: Boolean,
    default: false
  },
  title: {
    Type: String,
    default: '영상안전교육 등록/상세'
  },
  fileDan: {
    Type: Boolean,
    default: true
  },
  isPoint: {
    Type: Boolean,
    default: true
  }
})

const fileTypes = 'jpg,gif,bmp,png,jpeg'

const searchParam = reactive({
  CMPNY_DIV: "",
  NOTICE_DIV: "",
  NOTICE_NO: "",
  THUMBNAIL_FILE_ID: "",
  NOTICE_EXPOSURE: "N",
  POINT: "",
  PAYMENT_DATE: ""
})

/* ***** 종류 리스트 ***** */
const DIV_LIST = ref([])

/* ***** 메일 전송 ***** */
const mailParams = reactive({
  EMAIL: [],
  SUBJECT: "Q&A가 등록되었습니다.",
  CONTENT: "Q&A가 등록되었습니다.",
})

const thumbnailFile = ref(null)

const saveParam = reactive([
  {
    CMPNY_DIV: "",
    FILE_CNT: "",
    INSERT_DATE: "",
    KOR_NM: "",
    NOTICE_CNT: "",
    NOTICE_FILEID: "",
    NOTICE_NO: "",
    NOTICE_NOTE: "",
    NOTICE_POPUP: "",
    NOTICE_REG_EMPNO: "", //실제로 DB에 넘어가는 유저 코드
    NOTICE_TAG: "",
    NOTICE_TITLE: "",
    USER_ID: "",
    NOTICE_DIV: "",
    THUMBNAIL_FILE_ID: "",
    NOTICE_EXPOSURE: "",
    YOUTUBE_LINK: "",
    POINT: "",
    PAYMENT_DATE: ""
  },
])

const openPopup = gbn => {
  if(props.NOTICE_DIV_LIST.length > 0){
    saveParam[0].NOTICE_DIV = props.NOTICE_DIV_LIST[0].COD
    DIV_LIST.value = props.NOTICE_DIV_LIST.slice(1)
  }
  
  if(userLogStore.isMenuAdmin === 'Y'){
    menuTitle.value.setBtnProperty('btnDelete', 'visible', true)
    menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)
    isAdmin.value = true
  }else {
    menuTitle.value.setBtnProperty('btnDelete', 'visible', false)
    menuTitle.value.setBtnProperty('btnUpdate', 'visible', false)
    isAdmin.value = false
  }

  if (gbn) {
    /* ********************* 기존 저장 데이터 ******************* */
    for (let i in searchParam) {
      for (let j in gbn) {
        if (i === j) {
          searchParam[i] = gbn[j]
        }
      }
    }
    // setDisableButton(gbn.NOTICE_REG_EMPNO)
    if (userStore.userId === gbn.NOTICE_REG_EMPNO) {
      fileVisible.value = true
    } else {
      fileUpload.value.diableFileUploadButton(["btnDelete"])
    }
  } else {
    /* ********************* 신규 등록 ******************* */
    saveParam[0].INSERT_DATE = dayjs(new Date()).format("YYYY-MM-DD")
    saveParam[0].KOR_NM = userStore.userName
    saveParam[0].CMPNY_DIV = userStore.cmpnyDiv
    saveParam[0].USER_ID = userStore.userId
    isCreate.value = true
    fileVisible.value = true
  }

  dialog.value = true
  onButtonsClick({ id: "btnSearch" })
}

const checkFileId = () => {
  if (saveParam[0].NOTICE_FILEID === null || saveParam[0].NOTICE_FILEID === undefined) {
    fileUpload.value.setGuid()
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(saveParam[0].NOTICE_FILEID)
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
}



const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    search()
  } else if (btn.id === "btnUpdate") {

    saveParam[0].NOTICE_NOTE = ckEditor.value.getContent() //ck에디터에 입력한 내용을 html태그로 변환해서 넣어줌
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(closePopup).run()
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(closePopup).run()
  } else {
    closePopup()
  }
}

/* ******************************* 조회 ***************************** */
const search = () => {
  //DATCA0030이랑 같은 API사용함
  commonRequest("/hse/data/DATCA0030_SEARCH_02", { queryId: "DATCA0030_SEARCH_02", param: searchParam })
    .then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        for (let i in saveParam[0]) {
          for (let j in res.ORESULT_CUR[0]) {
            if (i === j) {
              saveParam[0][i] = res.ORESULT_CUR[0][j]

              if (i === "NOTICE_NOTE") {
                saveParam[0][i] = ckEditor.value.setContent(res.ORESULT_CUR[0][j])
              }

              if (i === 'PAYMENT_DATE'){
                saveParam[0][i] = res.ORESULT_CUR[0][j] ? dayjs(res.ORESULT_CUR[0][j]).format('YYYY-MM-DD') : null
              }
            }
          }
        }
      }
    })
    .finally(() => {
      /* ****************** 조회건수 저장 ****************** */
      commonExecuteApi({ queryId: "DATCA0020_SAVE_02", list: saveParam })
      checkFileId()
    })
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {

  if ((checksize() === false) & (saveParam[0].NOTICE_EXPOSURE === 'Y') ) {
    console.log('checksize', checksize(), saveParam[0].NOTICE_EXPOSURE )
    Message.warn("30,000KB이상의 영상은 모바일 노출이 불가능합니다.")
    return false
  }



  // if(calculateImageSize(ckEditor.value.getContent()) > 100000) {
  //   return Message.warn('크기가 100kb 이상의 사진파일은 파일첨부해주십시오.')
  // }
  if (!saveParam[0].NOTICE_TITLE) {
    Message.warn("제목을 입력 해주세요.")
    return false
  }
  if (!saveParam[0].NOTICE_NOTE) {
    Message.warn("내용을 입력 해주세요.")
    return false
  }
  return true
}


const calculateImageSize = (content) => {
  // Create a DOM parser to parse the HTML string
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  
  // Find the img element
  const imgElements = doc.querySelectorAll('img')
  let fileMax = 0
  if(imgElements.length === 0) {
    return 0
  }

  imgElements.forEach((imgElement) => {
    const src = imgElement.src
    if(src.startsWith('data:image/')) {
      const base64String = src.split(',')[1];
      if (base64String) {
        const size = calculateBase64Size(base64String)
        if(size > fileMax) fileMax = size
      } 
    }
  })

  return fileMax
}

const calculateBase64Size = (base64String) => {
  let padding
  if (base64String.endsWith("==")) padding = 2
  else if (base64String.endsWith("=")) padding = 1
  else padding = 0

  const sizeInBytes = (base64String.length * 3) / 4 - padding
  return sizeInBytes
}

/* ********** 저장 ********** */
const saveData = () => {
  mailParams.EMAIL = []
  saveParam[0].INSERT_DATE = saveParam[0].INSERT_DATE.replaceAll("-", "")
  saveParam[0].PAYMENT_DATE = saveParam[0].PAYMENT_DATE ? saveParam[0].PAYMENT_DATE.replaceAll("-", "") : null
  let result = commonRequest("/hse/data/DATCA0020_SAVE_01", { queryId: "DATCA0020_SAVE_01", list: saveParam })
  result.then((res) => {
    /* **************************** 신규 등록일때 담당자한테 메일 발송 (사용안함) **************************** */
    // if (isCreate.value && toUpper(saveParam[0].NOTICE_DIV) === "MNQ00010" && res.NOTICE_NO) {
    //   commonSearchApi({ queryId: "DATCA0020_SEARCH_04", param: { CMPNY_DIV: userStore.cmpnyDiv } }).then((res2) => {
    //     if (res2.ORESULT_CUR.length > 0) {
    //       mailParams.EMAIL.push(res2.ORESULT_CUR[0].EMAIL)

    //       commonSendApi(mailParams)
    //     }
    //   })
    // }
  })

  return result
}

/* ********** 삭제전 체크 ********** */
const beforeDelete = () => {
  let result = true

  if (!saveParam[0].NOTICE_NO) {
    Message.warn("신규 등록은 삭제가 불가능 합니다.")
    result = false
  }

  return result
}

/* ********** 삭제 ********** */
const deleteData = () => {
  return commonExecuteApi({ queryId: "DATCA0020_DELETE_01", list: saveParam })
}

const selectFile = e => {
  for (let file of e) {
    const fType = file.name.split(".").pop().toUpperCase()

    const fUseType = fileTypes.split(",").map((item) => {
      return item.toUpperCase()
    })

    if (file.size >= props.maxFileSize * 1024 * 1024) {
      Message.err(props.maxFileSize + t("MB 이상 첨부파일은 등록 불가능 합니다.") + "<br>" + file.name)

      return
    } else if (!_.includes(fUseType, fType)) {
      const msg = props.imgOnly ? t("이미지만 업로드 가능합니다.") : t("사용할 수 없는 파일입니다.")

      Message.err(msg + "<br>" + file.name)

      return
    }
    autoFileUpload(file)
  }

}

const autoFileUpload = async file => {

  let hasErr = false

  // 자르는 사이즈
  const chunkSize = 1024 * 1024 // 1MB
  // total size 계산
  const totalChunks = Math.ceil(file.size / chunkSize)

  let currentChunk = 0

  const sendNextFile = async () => {
    if(!searchParam.THUMBNAIL_FILE_ID){
      searchParam.THUMBNAIL_FILE_ID = create_UUID()
    }

    // chunk size 만큼 데이터 분할
    const start = currentChunk * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    // form data 형식으로 전송
    const formData = new FormData()

    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: searchParam.THUMBNAIL_FILE_ID,
      FILE_NO: "1",
      FILE_TITLE: file.name,
      FILE_NAME_ORIGINAL: file.name,
      FILE_NAME: file.name,
      FILE_PATH: `${commonStore.systemCode}${route.path}/`,
      FILE_TYPE: file.name.split(".").pop(),
      FILE_SIZE: Math.round(file.size / 1024.0),
      USER_ID: userStore.userId,
      CHUNK_NUMBER: currentChunk,
      TOTAL_CHUNKS: totalChunks,
    }

    formData.append("file", chunk, file.name)
    formData.append("param", new Blob([JSON.stringify(param)], { type: "application/json" }))

    await commonBigUploadFilesApi(formData)
      .then(async (res) => {
        // 전송 결과가 207이면 다음 파일 조각 전송
        if (res.result.status === "207") {
          currentChunk++
          if (currentChunk < totalChunks) {
            await sendNextFile()
          }
        } else if (res.result.status === "200") {
          // console.log('commonBigUploadFilesApi res', res)

          // 마지막 파일까지 전송 되면
          // Message.success(t("업로드 되었습니다."))
        }
      })
      .catch((e) => {
        // console.log('e', e)
        hasErr = true
      })
  }

  await sendNextFile()

}


const checksize = () => {

  // 파일 사이즈 크롤링
  
  let path = '//*[@id="XX08"]/div[2]/div[2]/div[2]/div[2]/div[3]/div/div[4]/div/div[3]/div/div/div/div[1]/div/div[1]/div[1]/div[4]/table/tbody'
  let tbody = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  let MainAvailable = true

  // tbody가 유효한지 확인
  if (!tbody) {
    console.error("tbody element not found");
    return;
  }

  // tbody의 모든 tr 요소 선택
  let rows = tbody.getElementsByTagName('tr');

  // 각 행을 순차적으로 탐색
  for (let row of rows) {
    // 파일 크기를 포함하는 두 번째 td 태그에서 div의 텍스트를 추출
    const sizeElement = row.querySelector('td:nth-child(2) div.rg-renderer');
    
    if (sizeElement) {
      // 텍스트를 가져와 쉼표 제거 후 숫자로 변환
      const fileSizeText = sizeElement.textContent.trim().replace(/,/g, '');
      const fileSize = Number(fileSizeText);

      // 파일 크기가 100000을 넘는지 확인
      if (fileSize > 100000) {
        console.log(`File size ${fileSize} exceeds 20000`);
        MainAvailable = false
      } else {
        console.log(`File size ${fileSize} is within the limit`);
      }
    }
  }


  return  MainAvailable 

};

  


const create_UUID = () => {
  let dt = new Date().getTime()

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/* ********** 썸네일 등록 및 저장 ********** */
const thumbnailSave = val => {
  if(isCreate.value){
    Message.err(t('신규 데이터는 저장후 썸네일 지정이 가능합니다'))
    return
  }
  if(!searchParam.THUMBNAIL_FILE_ID || !thumbnailFile.value){
    Message.err(t('이미지 파일을 먼저 선택 해주세요.'))
    return
  }

  commonExecuteApi({ queryId: "DATCA0020_FILE_SAVE_01", list: [searchParam] }).then(() => {
    Message.success(t('썸네일이 등록 되었습니다.'))
  })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  for (let i in saveParam[0]) {
    saveParam[0][i] = ""
    if (i === "NOTICE_NOTE") {
      saveParam[0][i] = ckEditor.value.setContent("")
    }
  }

  for (let j in searchParam) {
    searchParam[j] = ""
  }

  thumbnailFile.value = null

  /* 팝업 닫을때 파일첨부 그리드 초기화 */
  fileUpload.value.clearGrid()

  emit("after-search")
  isCreate.value = false
  dialog.value = false
  fileVisible.value = false
  fileUpload.value.enableFileUploadButton(["btnDelete"])
  // setEnableButton()
}

const setDisableButton = (userId) => {
  if (userId != userStore.userId) {
    menuTitle.value.disableBtn("btnDelete", true)
    menuTitle.value.disableBtn("btnUpdate", true)
  }
}

const setEnableButton = () => {
  menuTitle.value.disableBtn("btnDelete", false)
  menuTitle.value.disableBtn("btnUpdate", false)
}


const onChange = () => {
  setTimeout(checkContent, 1000)
}

const checkContent = () => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(ckEditor.value.getContent(), 'text/html')

  // Find all img elements
  const imgElements = doc.querySelectorAll('img')
  if (imgElements.length === 0) {
    return
  }

  imgElements.forEach((imgElement) => {
    const src = imgElement.src
    if (src.startsWith('data:image/')) {
      const base64String = src.split(',')[1]
      if (base64String) {
        const size = calculateBase64Size(base64String)
        if (size > 100 * 1024) { // 100 KB = 100 * 1024 bytes
          Message.warn(t('100kb이상의 사진은 아래 파일첨부를 이용해주십시오.'))
          imgElement.remove()
          ckEditor.value.setContent(new XMLSerializer().serializeToString(doc))
        }
      }
    }
  })
}






defineExpose({
  openPopup,
})

onMounted(() => {
  fileUpload.value.setGuid() //guid설정
})
</script>
<!-- class="p-absolute user-select-none" -->
<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="940"
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
      <span>{{props.title}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="props.btnList"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="saveParam[0].NOTICE_TITLE"
                :label="$t('제목')"
                label-width="80px"
                width="850px"
                required
                top-label
                :readonly="!isAdmin"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="saveParam[0].KOR_NM"
                top-label
                :label="$t('작성자')"
                width="160px"
                readonly
              />
              <i-input
                v-model="saveParam[0].INSERT_DATE"
                :label="$t('작성일')"
                width="160px"
                top-label
                readonly
              />
              <template v-if="props.id !== 'HHIZ090FF'">
                <i-input
                  v-model="saveParam[0].POINT"
                  :label="$t('지급 포인트')"
                  width="160px"
                  type="number"
                  top-label
                  :readonly="!isAdmin"
                  v-if="props.isPoint"
                />
                <i-input
                  v-model="saveParam[0].PAYMENT_DATE"
                  :label="$t('지급 기한')"
                  width="160px"
                  type="date"
                  top-label
                  :readonly="!isAdmin"
                  v-if="props.isPoint"
                />
                <v-checkbox 
                  class="mt-5 pa-1" 
                  label="메인 노출여부" 
                  :disabled="!isAdmin"
                  v-model = "saveParam[0].NOTICE_EXPOSURE"
                />
              </template>
              <!-- <i-input
                v-model="saveParam[0].SORT_NO"
                :label="$t('일련번호')"
                width="270px"
                top-label
                label-width="80px"
                number="true"
              /> -->
            </div>
          </v-sheet>
          <v-sheet height="50%" class="mb-2">
            <CKEditor 
              :id="props.id" 
              ref="ckEditor" 
              v-model="saveParam[0].NOTICE_NOTE" 
              class="mt-2"
              :isReadOnly="!isAdmin ? 'true' : 'false'"
              @change="onChange"
            />
          </v-sheet>
          <v-sheet class="flex-column" v-if="!props.isReadonly && props.id !== 'HHIZ090FF'">
            <div class="d-flex mt-2">
              <v-file-input
                :label="t('여기에 파일을 끌어다 놓으세요.')"
                accept="image/*"
                v-model="thumbnailFile"
                @update:modelValue="selectFile"
                clearable
                :disabled="!isAdmin"
              />
              <v-btn 
                class="mt-1 ml-2" 
                @click="e => {if(isAdmin) {thumbnailSave()} }">
                썸네일 등록
              </v-btn>
            </div>
            <div class="pl-6">
              <span class="ml-4 text-red">※ 썸네일 등록 이미지는 500(W) * 350(H) 이상의 크기만 등록 해주세요.</span>
            </div>
          </v-sheet>
          <v-sheet class="h-auto mt-4">
            <IUpload
              ref="fileUpload"
              :max-file-size="props.id === 'HHIZ090FF' ? 0 : 300"
              :button-list="props.fileBtnList"
              auto-upload
              :is-visibled="fileVisible"
              style="height: 350px"
              :isCmpnyDiv="false"
            />
            <!-- :fileDan="props.fileDan" -->
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
