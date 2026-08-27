<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import ILabel from "@/components/ILabel.vue"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IUpload from "@/components/IUpload.vue"
import { toUpper } from "lodash-es"
import IGridTitle from "@/components/IGridTitle.vue"

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const emit = defineEmits(["after-search"])
const isCreate = ref(false)
const fileUploadButton = reactive(["btnDownLoad", "btnDelete"])
const fileVisible = ref(false) //파일업로드 visible 플래그
const searchParam = reactive({
  MEMID: "",
})

/* ***** 종류 리스트 ***** */
const DIV_LIST = ref([])

/* ***** 메일 전송 ***** */
const mailParams = reactive({
  EMAIL: [],
  SUBJECT: "Q&A가 등록되었습니다.",
  CONTENT: "Q&A가 등록되었습니다.",
})

const saveParam = reactive([
  {
    MEMID: "",
    LASTNAME: "",
    FIRSTNAME: "",
    TEAM: "",
  },
])

const openPopup = (gbn) => {
  if (gbn) {
    saveParam[0].NOTICE_DIV = gbn.NOTICE_DIV
    /* ********************* 기존 저장 데이터 ******************* */
    for (let i in searchParam) {
      for (let j in gbn) {
        if (i === j) {
          searchParam[i] = gbn[j]
        }
      }
    }
    setDisableButton(gbn.NOTICE_REG_EMPNO)
    if (userStore.userId === gbn.NOTICE_REG_EMPNO) {
      fileVisible.value = true
    } else {
      fileUpload.value.diableFileUploadButton(["btnDelete"])
    }
  } else {
    /* ********************* 신규 등록 ******************* */

    saveParam[0].MEMID = saveParam.MEMID
    saveParam[0].LASTNAME = saveParam.LASTNAME
    saveParam[0].FIRSTNAME = saveParam.FIRSTNAME
    saveParam[0].TEAM = saveParam.TEAM
    isCreate.value === true
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
  commonRequest("/hse/data/DATCA0030_SEARCH_02", { queryId: "SY_SEARCH2", param: searchParam })
    .then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        for (let i in saveParam[0]) {
          for (let j in res.ORESULT_CUR[0]) {
            if (i === j) {
              saveParam[0][i] = res.ORESULT_CUR[0][j]

              if (i === "NOTICE_NOTE") {
                saveParam[0][i] = ckEditor.value.setContent(res.ORESULT_CUR[0][j])
              }
            }
          }
        }
      }
    })
    .finally(() => {
      /* ****************** 조회건수 저장 ****************** */
      commonExecuteApi({ queryId: "DATCA0010_SAVE_02", list: saveParam })

      checkFileId()
    })
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

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  // if(calculateImageSize(ckEditor.value.getContent()) > 100000) {
  //   return Message.warn('크기가 100kb 이상의 사진파일은 파일첨부해주십시오.')
  // }
  if (!saveParam[0].MEMID) {
    Message.warn("등번호를 입력 해주세요.")
    return false
  }

  return true
}

/* ********** 저장 ********** */
const saveData = () => {
  return commonExecuteApi({ queryId: "SY_SAVE", list: saveParam })
}

/* ********** 삭제전 체크 ********** */
const beforeDelete = () => {
  let result = true

  if (!saveParam[0].MEMID) {
    Message.warn("신규 등록은 삭제가 불가능 합니다.")
    result = false
  }

  return result
}

/* ********** 삭제 ********** */
const deleteData = () => {
  return commonExecuteApi({ queryId: "SY_DELETE", list: saveParam })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  for (let i in saveParam[0]) {
    if (i === "NOTICE_DIV") {
      continue
    }
    if (i === "NOTICE_NOTE") {
      saveParam[0][i] = ckEditor.value.setContent("")
    }
    saveParam[0][i] = ""
  }

  for (let j in searchParam) {
    searchParam[j] = ""
  }

  /* 팝업 닫을때 파일첨부 그리드 초기화 */
  fileUpload.value.clearGrid()

  emit("after-search")
  isCreate.value === false
  dialog.value = false
  fileVisible.value = false
  fileUpload.value.enableFileUploadButton(["btnDelete"])
  setEnableButton()
}

const setDisableButton = (userId) => {
  if (userId != userStore.userId) {
    menuTitle.value.disableBtn("btnDelete", false)
    menuTitle.value.disableBtn("btnUpdate", false)
  }
}

const setEnableButton = () => {
  menuTitle.value.disableBtn("btnDelete", true)
  menuTitle.value.disableBtn("btnUpdate", true)
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

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="940"
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
      <span>선수 등록/상세</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnDelete', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="saveParam[0].MEMID"
                :label="$t('등번호')"
                label-width="80px"
                width="850px"
                required
                top-label
              />
            </div>
            <div class="d-flex mt-4">
              <i-input
                v-model="saveParam[0].LASTNAME"
                top-label
                :label="$t('성')"
                width="270px"
                label-width="80px"
              />
              <i-input
                v-model="saveParam[0].FIRSTNAME"
                :label="$t('이름')"
                width="270px"
                label-width="80px"
                top-label
              />
              <i-input
                v-model="saveParam[0].TEAM"
                :label="$t('팀')"
                width="270px"
                top-label
                label-width="80px"
              />
            </div>
          </v-sheet>
          <v-sheet height="50%" class="mb-2">
            <CKEditor :id="saveParam[0].NOTICE_DIV" ref="ckEditor" v-model="saveParam[0].NOTICE_NOTE" class="mt-2" change="onChange"/>
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              :max-file-size="300"
              :button-list="fileUploadButton"
              auto-upload
              :is-visibled="fileVisible"
              style="height: 370px"
              :isCmpnyDiv="false"
            />
              <!-- :isCmpnyDiv="false" -->
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
