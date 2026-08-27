<!--
  화면명 : 부서 교육자료
  화면개요 : 부서 교육자료 등록/상세 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import IUpload from '@/components/IUpload.vue'
import { toUpper } from 'lodash-es'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"

const props = defineProps({
  id: {
    Type: String,
    default: '',
  },
})

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const isCreate = ref(false)
const fileVisible = ref(false) //파일업로드 visible 플래그
const fileUploadButton = reactive(['btnDownLoad', 'btnDelete'])

const searchParam = reactive({
  CMPNY_DIV: '',
  NOTICE_DIV: 'DATCA0060',
  NOTICE_NO: '',
})

const codeList = reactive({
  DEPT : [],
})

/* ***** 메일 전송 ***** */
const mailParams = reactive({
  EMAIL: [],
  SUBJECT: 'Q&A가 등록되었습니다.',
  CONTENT: 'Q&A가 등록되었습니다.',
})

const saveParam = reactive([
  {
    CMPNY_DIV: '',
    FILE_CNT: '',
    INSERT_DATE: '',
    KOR_NM: '',
    NOTICE_CNT: '',
    NOTICE_FILEID: '',
    NOTICE_NO: '',
    NOTICE_NOTE: '',
    NOTICE_POPUP: '',
    NOTICE_REG_EMPNO: '', //실제로 DB에 넘어가는 유저 코드
    NOTICE_TAG: '',
    NOTICE_TITLE: '',
    USER_ID: '',
    NOTICE_DIV: 'DATCA0060',
    DEPT_CD: '',
    CATEGORY1: userStore.deptCd,
  },
])

const initCodeList = () => {
  Promise.all([
       commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV:'Y' } }), // 부서
    ]).then(res => {
      codeList.DEPT = res[0].ORESULT_CUR
      codeList.DEPT.unshift({ DEPT_CD: '', DEPT_NM: '전체' })
  })
} 

const openPopup = (gbn) => {
  searchParam.NOTICE_DIV = 'DATCA0060'
  saveParam[0].NOTICE_DIV = 'DATCA0060'
  if(codeList.DEPT.length === 0) {
    initCodeList()
  }
  if (gbn) {
    searchParam.NOTICE_NO = gbn.NOTICE_NO
    saveParam[0].CATEGORY1 = gbn.DEPT_CD
    saveParam[0].DEPT_CD = gbn.DEPT_CD
    setDisableButton()
    onButtonsClick({ id: 'btnSearch' })
  } else {
    /* ********************* 신규 등록 ******************* */
    saveParam[0].INSERT_DATE = dayjs(new Date()).format('YYYY-MM-DD')
    saveParam[0].KOR_NM = userStore.userName
    saveParam[0].CMPNY_DIV = userStore.cmpnyDiv
    saveParam[0].USER_ID = userStore.userId
    saveParam[0].DEPT_CD = userStore.deptCd
    saveParam[0].CATEGORY1 = userStore.deptCd
    isCreate.value = true
    fileVisible.value = true
    checkFileId()
  }
  dialog.value = true
}

const checkFileId = () => {
  if (saveParam[0].NOTICE_FILEID === null || saveParam[0].NOTICE_FILEID === undefined) {
    fileUpload.value.setGuid()
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(saveParam[0].NOTICE_FILEID)
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
} 

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    search()
  } else if (btn.id === 'btnUpdate') {
    saveParam[0].NOTICE_NOTE = ckEditor.value.getContent() //ck에디터에 입력한 내용을 html태그로 변환해서 넣어줌

    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(closePopup)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(closePopup)
      .run()
  } else {
    closePopup()
  }
}

/* ******************************* 조회 ***************************** */
const search = () => {
  commonRequest('/hse/data/DATCA0060_SEARCH_02', { queryId: 'DATCA0060_SEARCH_02', param: searchParam })
    .then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        Object.keys(res.ORESULT_CUR[0]).forEach(key => {
          if (saveParam[0].hasOwnProperty(key)) {
            saveParam[0][key] = res.ORESULT_CUR[0][key];
          }
        })
        ckEditor.value.setContent(saveParam[0]['NOTICE_NOTE'])
      }
    })
    .finally(() => {
      /* ****************** 조회건수 저장 ****************** */
      commonExecuteApi({ queryId: 'DATCA0060_SAVE_02', list: saveParam })
      checkFileId()
    })
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  // if(calculateImageSize(ckEditor.value.getContent()) > 100000) {
  //   return Message.warn('크기가 100kb 이상의 사진파일은 파일첨부해주십시오.')
  // } else 
  if (!saveParam[0].NOTICE_TITLE) {
    return Message.warn('제목을 입력 해주세요.')
  } else if (!saveParam[0].NOTICE_NOTE) {
    return Message.warn('내용을 입력 해주세요.')
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
  // mailParams.EMAIL = []
  // saveParam[0].INSERT_DATE = saveParam[0].INSERT_DATE.replaceAll('-', '')
  // let result = commonRequest('/hse/data/DATCA0030_SAVE_01', { queryId: 'DATCA0030_SAVE_01', list: saveParam })
  // result.then((res) => {
  //   /* **************************** 신규 등록일때 담당자한테 메일 발송 **************************** */
  //   if (isCreate.value && toUpper(saveParam[0].NOTICE_DIV) === 'MNQ00010' && res.NOTICE_NO) {
  //     commonSearchApi({ queryId: 'DATCA0030_SEARCH_04', param: { CMPNY_DIV: userStore.cmpnyDiv } }).then((res2) => {
  //       if (res2.ORESULT_CUR.length > 0) {
  //         mailParams.EMAIL.push(res2.ORESULT_CUR[0].EMAIL)

  //         commonSendApi(mailParams)
  //       }
  //     })
  //   }
  // })

  // return result
  return commonRequest('/hse/data/DATCA0060_SAVE_01', { queryId: 'DATCA0060_SAVE_01', list: saveParam })
}

/* ********** 삭제전 체크 ********** */
const beforeDelete = () => {
  let result = true

  if (!saveParam[0].NOTICE_NO) {
    Message.warn('신규 등록은 삭제가 불가능 합니다.')
    result = false
  }

  return result
}

/* ********** 삭제 ********** */
const deleteData = () => {
  return commonExecuteApi({ queryId: 'DATCA0060_DELETE_01', list: saveParam })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  for (let i in saveParam[0]) {
    saveParam[0][i] = ''
    if (i === 'NOTICE_NOTE') {
      saveParam[0][i] = ckEditor.value.setContent('')
    }
  }

  for (let j in searchParam) {
    searchParam[j] = ''
  }

  /* 팝업 닫을때 파일첨부 그리드 초기화 */
  fileUpload.value.clearGrid()

  emit('after-search')
  dialog.value = false
  fileVisible.value = false
  fileUpload.value.enableFileUploadButton(['btnDelete'])
  setEnableButton()
}

const setDisableButton = () => {
  if (saveParam[0].DEPT_CD != userStore.deptCd) {
    menuTitle.value.disableBtn('btnDelete', true)
    menuTitle.value.disableBtn('btnUpdate', true)
    fileVisible.value = false
    fileUpload.value.diableFileUploadButton(['btnDelete'])
  } else {
    menuTitle.value.disableBtn('btnDelete', false)
    menuTitle.value.disableBtn('btnUpdate', false)
    fileVisible.value = true
    fileUpload.value.enableFileUploadButton(['btnDelete'])
  }
}

const setEnableButton = () => {
  menuTitle.value.disableBtn('btnDelete', false)
  menuTitle.value.disableBtn('btnUpdate', false)
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
      <span>부서 안전교육자료 등록/상세</span>
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
                v-model="saveParam[0].NOTICE_TITLE"
                :label="$t('제목')"
                label-width="80px"
                width="850px"
                required
                top-label
              />
            </div>
            <div class="d-flex mt-4">
              <i-input
                v-model="saveParam[0].KOR_NM"
                top-label
                :label="$t('작성자')"
                width="200px"
                label-width="80px"
                readonly
              />
              <i-input
                v-model="saveParam[0].INSERT_DATE"
                :label="$t('작성일')"
                width="200px"
                label-width="80px"
                readonly
                top-label
              />
              <i-select
                v-model="saveParam[0].CATEGORY1"
                :label="$t('부서')"
                label-width="50px"
                append-inner-icon="mdi-magnify"
                :items="codeList.DEPT"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                width="200px"
                readonly
                top-label
              />
            </div>
          </v-sheet>
          <v-sheet height="50%" class="mb-2">
            <CKEditor :id="props.id" ref="ckEditor" v-model="saveParam[0].NOTICE_NOTE" class="mt-2" @change="onChange"/>
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              :max-file-size="300"
              :button-list="fileUploadButton"
              :is-visibled="fileVisible"
              auto-upload
              style="height: 370px"
              :isCmpnyDiv="false"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
