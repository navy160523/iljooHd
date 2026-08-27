<!-- 
  * Vue 내 용 : 설문지 문항 등록/수정 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/02/23
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/02/23 
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import saveFlowHelper from '@/utils/saveFlowHelper'
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi, commonExecuteApi, getCodeList } from "@hiway/api/commonApi"
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import queryFlowHelper from '@/utils/searchFlowHelper'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { isEmpty } from "@/@core/utils"
import Message from '@hiway/utils/notify'
import ImageViewerPopup from '@/components/popup/ImageViewerPopup.vue'

const emit = defineEmits(["closed"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)

const isHiddenS = ref(true)
const isHiddenM = ref(true)

const imageViewerPopup_Desc = ref(null)
const descFile = ref('')
const imageViewerPopup = ref(null)
const imageViewerPopup_Multi = ref(null)
const imageViewerPopup_Single = ref(null)

let singleSelectIndex = ''
let multiSelectIndex = ''


// 팝업 설문지 문항 정보
const popupParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  QSTN_ID : '',
  SUVY_DIV : '',
  QSTN_TITLE : '',
  QSTN_DESC : '',
  QSTN_TYPE : '',
  QSTN_CONTENTS : '',
  QSTN_CATEGORY : '',
  DISP_YN : 'N',
  USE_YN : 'Y',
  ESNTL_YN : 'N',
  FILE_ID : '',
  SAVE_GBN : '',
  MAPPING : '',
  HIDDEN_VALUE : 'N',
})

// 코드리스트
const codeList = reactive({
  QSTN_TYPE : [],
  QSTN_CATEGORY : [],
  SUVY_DIV : [],
  MAPPING : [],
})

// 주간식 단답 
const inputParam = reactive({
  elements : [],
})

// 주간식 서술 
const textParam = reactive({
  elements : [],
})

// 파일첨부
const fileParam = reactive({
  elements : [],
})

// 단일 선택
const singleSelParam = reactive({
  elements : [],
})

// 복수 선택
const multiSelParam = reactive({
  elements : [],
})

// 선호도
const preferenceParam = reactive({
  elements : [],
})

//이미지조회조건
let searchImgParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DESC1: "",
  DESC2: "",
  QSTN_TYPE: "",
  FILE_ID: "",
})

const openPopup = async val => {
  console.log('open val', val)
  popupParams.CMPNY_DIV = val.CMPNY_DIV
  popupParams.QSTN_ID = val.QSTN_ID 
  popupParams.MAPPING = val.MAPPING
  popupParams.SUVY_DIV = val.SUVY_DIV
  popupParams.QSTN_TITLE = val.QSTN_TITLE
  popupParams.QSTN_DESC = val.QSTN_DESC
  popupParams.QSTN_TYPE = val.QSTN_TYPE
  popupParams.QSTN_CONTENTS = val.QSTN_CONTENTS
  popupParams.QSTN_CATEGORY = val.QSTN_CATEGORY
  popupParams.DISP_YN = val.DISP_YN
  popupParams.USE_YN = val.USE_YN
  popupParams.ESNTL_YN = val.ESNTL_YN
  popupParams.HIDDEN_VALUE = val.HIDDEN_VALUE
  popupParams.FILE_ID = val.FILE_ID
  popupParams.SAVE_GBN = val.SAVE_GBN

  searchImgParams.QSTN_TYPE = val.QSTN_TYPE
  searchImgParams.CMPNY_DIV = val.CMPNY_DIV

  // 문항설명 사진 출력
  uploaded_desc({ fileId: val.FILE_ID })

  singleSelectIndex = 0
  multiSelectIndex = 0
  initCombo()

  resetCode(popupParams.SUVY_DIV)
  dialog.value = true
}

//콤보박스 셋팅
const initCombo = () => {

  Promise.all([
    getCodeList(popupParams.CMPNY_DIV + 'ZS10'),     // 설문지 구분
    getCodeList(popupParams.CMPNY_DIV + 'ZS40'),     // 질문 사항 코드
  ]).then(res => {
    codeList.SUVY_DIV = res[0].ORESULT_CUR
    codeList.MAPPING = res[1].ORESULT_CUR
    console.log(res[1].ORESULT_CUR)
    codeList.MAPPING.unshift({COD: '',TXT: '전체'})
    if (isEmpty(popupParams.SUVY_DIV)) {
      popupParams.SUVY_DIV = 'A'
    }
  })
}

const updateSuvy = e => {
  resetCode(popupParams.SUVY_DIV)
}

const updateType = e => {
  popupParams.QSTN_CONTENTS = ''

  if(popupParams.QSTN_TYPE == 'D' || popupParams.QSTN_TYPE == 'E') {
    popupParams.QSTN_CONTENTS = '&&'
  }
  
  searchImgParams.QSTN_TYPE = popupParams.QSTN_TYPE

  updateRegion(popupParams.QSTN_TYPE)
}

const resetCode = val =>{
  Promise.all([
    getCodeList(popupParams.CMPNY_DIV + 'ZS20'),  // 카테고리
    getCodeList(popupParams.CMPNY_DIV + 'ZS30'),  // 문항유형
  ]).then(res => {
    codeList.QSTN_CATEGORY = res[0].ORESULT_CUR.filter(data => data.CODE_DESC1 === val)
    codeList.QSTN_TYPE = res[1].ORESULT_CUR

    if (isEmpty(popupParams.QSTN_TYPE)) {
      popupParams.QSTN_TYPE = 'A'
    }
    updateRegion(popupParams.QSTN_TYPE)
  })
}

const onClose = () => {  
  clearRegion('ALL')
  dialog.value = false
  descFile.value = ''
  emit("closed")
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if (btn.id === 'btnClose') {
    onClose()
  }
}

//유효성 검사
const beforeSave = () => {
  if (isEmpty(popupParams.QSTN_TITLE)) {
    return Message.err("문항 제목을 입력해 주세요.")
  }

  if (isEmpty(popupParams.QSTN_TYPE)) {
    return Message.err("문항 유형을 선택해 주세요.")
  }

  if (isEmpty(popupParams.QSTN_CATEGORY)) {
    return Message.err("문항 카테고리를 선택해 주세요.")
  }

  return true
}

// 자동 배점 계산
const autoValue = () => {
  if(popupParams.QSTN_TYPE != 'D' && popupParams.QSTN_TYPE != 'E') return
  if(popupParams.QSTN_CONTENTS == null || popupParams.QSTN_CONTENTS == '') return
  let contents = popupParams.QSTN_CONTENTS.split('|')
  let maxValue = 1
  popupParams.QSTN_CONTENTS = ''


  // 가장 높은 배점 구하기
  for(let content of contents) {
    if(content == '' || content == null) continue
    let c = content.split('&')
    if(c.length < 2) continue
    else if(c[1] == '' || c[1] == null) continue
    if(maxValue <= Number(c[1])) maxValue = Number(c[1]) + 1
  }

  // 배점 배치
  for(let content of contents) {
    let rslt = ''
    if(content == '' || content == null) {
      rslt = '&' + maxValue
      maxValue = Number(maxValue) + 1
    } else {
      let c = content.split('&')
      if(c.length == 1) { // 문항에만 있을 값이 있을 경우
        rslt = c[0] + '&' + maxValue
        maxValue += 1
      } else if(c.length == 2) { // 문항, 배점에만 값이 있을 경우
        if(c[1] == '' || c[1] == null) {
          rslt = c[0] + '&' + maxValue
          maxValue = Number(maxValue) + 1 
        } else {
          rslt = c[0] + '&' + c[1] 
        }
      } else { // 모두 값이 있을 경우
        if(c[1] == '' || c[1] == null) { // 근데 배점엔 값이 없네?
          rslt = c[0] + '&' + maxValue + '&' + c[2]
          maxValue = Number(maxValue) + 1
        } else {
          rslt = c[0] + '&' + c[1] + '&' + c[2]
        }
      }
    }
    popupParams.QSTN_CONTENTS += rslt + '|'
  }

  popupParams.QSTN_CONTENTS = popupParams.QSTN_CONTENTS.slice(0,-1)
}

//저장
const saveData = () => {
  if (popupParams.SAVE_GBN === 'NEW') { //설문지 문항 추가
    popupParams.QSTN_ID = 'NEW'
  }
  let saveParams = []

  // 문항 유형 내용 파싱
  CreateParseContents()
  // 자동 배점 계산(배점이 키값이기 때문)
  autoValue()

  if(!isEmpty(popupParams.QSTN_TITLE)) {
    popupParams.QSTN_TITLE = popupParams.QSTN_TITLE.trim()
  }
  if(!isEmpty(popupParams.QSTN_DESC)) {
    popupParams.QSTN_DESC = popupParams.QSTN_DESC.trim()
  }
  if(!isEmpty(popupParams.QSTN_CONTENTS)) {
    popupParams.QSTN_CONTENTS = popupParams.QSTN_CONTENTS.trim()
  }

  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV, // 회사 코드
    QSTN_ID: popupParams.QSTN_ID, // 설문지 문항 코드
    SUVY_DIV: popupParams.SUVY_DIV, // 설문지 구분
    MAPPING: popupParams.MAPPING, // 문항 구분
    QSTN_TITLE: popupParams.QSTN_TITLE, // 문항 제목
    QSTN_DESC: popupParams.QSTN_DESC, // 문항 설명
    QSTN_TYPE: popupParams.QSTN_TYPE, // 문항 유형
    QSTN_CONTENTS: popupParams.QSTN_CONTENTS, // 문항 내용
    QSTN_CATEGORY: popupParams.QSTN_CATEGORY, // 문항 카테고리
    DISP_YN: popupParams.DISP_YN,  // 화면표시 여부
    USE_YN: popupParams.USE_YN,   // 삭제 여부
    ESNTL_YN: popupParams.ESNTL_YN, // 필수 여부
    FILE_ID: popupParams.FILE_ID, // 첨부파일 ID(문항설명)
    HIDDEN_VALUE: popupParams.HIDDEN_VALUE, // 배점 숨기기
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  // return true;
  return commonExecuteApi({
    queryId: "OPRAH0020_SAVE_01", list: saveParams,
  })
}

//저장 후
const afterSave = () => {
  onClose()
}

const CreateParseContents = () => {
  if (popupParams.QSTN_TYPE === 'A') {
    popupParams.QSTN_CONTENTS = inputParam.elements[0].description
  }
  else if (popupParams.QSTN_TYPE === 'B') {
    popupParams.QSTN_CONTENTS = textParam.elements[0].description
  }
  else if (popupParams.QSTN_TYPE === 'C') {
    popupParams.QSTN_CONTENTS = fileParam.elements[0].fileId
  }
  else if (popupParams.QSTN_TYPE === 'D') {
    var sb = []
    let paramLength = singleSelParam.elements.length

    for (let i=0; i < paramLength; i++) {
      sb.push(singleSelParam.elements[i].description1)
      if (isEmpty(singleSelParam.elements[i].description2)) {
        sb.push('&')
      }
      else {
        sb.push('&')
        sb.push(singleSelParam.elements[i].description2)
      }
      if (isEmpty(singleSelParam.elements[i].fileId)) {
        sb.push('')
      }
      else {
        sb.push('&')
        sb.push(singleSelParam.elements[i].fileId)
      }
      sb.push('|')
    }
    let parseSrc = sb.join("")
    popupParams.QSTN_CONTENTS = parseSrc.substring(0, parseSrc.length - 1)
  }
  else if (popupParams.QSTN_TYPE === 'E') {
    var sb = []
    let paramLength = multiSelParam.elements.length

    for (let i=0; i < paramLength; i++) {
      sb.push(multiSelParam.elements[i].description1)
      if (isEmpty(multiSelParam.elements[i].description2)) {
        sb.push('&')
      }
      else {
        sb.push('&')
        sb.push(multiSelParam.elements[i].description2)
      }
      if (isEmpty(multiSelParam.elements[i].fileId)) {
        sb.push('')
      }
      else {
        sb.push('&')
        sb.push(multiSelParam.elements[i].fileId)
      }
      sb.push('|')
    }
    let parseSrc = sb.join("")
    popupParams.QSTN_CONTENTS = parseSrc.substring(0, parseSrc.length - 1)
  }
  else if (popupParams.QSTN_TYPE === 'F') {
    var sb = []
    let paramLength = preferenceParam.elements.length

    for (let i=0; i < paramLength; i++) {
      sb.push(preferenceParam.elements[i].preferenceLow)
      if (isEmpty(preferenceParam.elements[i].preferenceHigh)) {
        sb.push('')
      }
      else {
        sb.push('&')
        sb.push(preferenceParam.elements[i].preferenceHigh)
      }
      sb.push('|')
    }
    let parseSrc = sb.join("")
    popupParams.QSTN_CONTENTS = parseSrc.substring(0, parseSrc.length - 1)
  }
}


// 문항 유형 콤보 박스 변경시 문항 유형 생성
const updateRegion = async (val) => {
  await clearRegion('ALL')

  // 주간식 단답 
  if(val === 'A') {
    isHiddenS.value = true  
    isHiddenM.value = true

    const newElement = {
      description: popupParams.QSTN_CONTENTS,
    }

    inputParam.elements.push(newElement)
  } else if (val === 'B') { // 주간식 서술 
    isHiddenS.value = true  
    isHiddenM.value = true

    const newElement = {
      description: popupParams.QSTN_CONTENTS,
    }

    textParam.elements.push(newElement)
  } else if (val === 'C') { // 파일첨부
    isHiddenS.value = true  
    isHiddenM.value = true
    
    if(fileParam.elements.length == 0) {
      const newElement = {
        addfile : '',
        fileId : '',
      }
      fileParam.elements.push(newElement)
    }

    let rslt = []
    await Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
      CMPNY_DIV: searchImgParams.CMPNY_DIV, FILE_ID: popupParams.QSTN_CONTENTS } })]).then(res => {
        rslt = res
    })
    await showImg(rslt[0].ORESULT_CUR, popupParams.QSTN_CONTENTS)
  } else if (val === 'D') { // 단일 선택 
    isHiddenS.value = false
    isHiddenM.value = true

    const content1 = popupParams.QSTN_CONTENTS.split('|')
    let strDescription1 = ''
    let strDescription2 = ''
    let strAddFile = '' 
    // 저장된 문항 값이 여러 개 있을 경우
    if (content1.length > 0) {
      for (let i=0; i < content1.length; i++) {
        const content2 = content1[i].split('&')
        strDescription1 = ''
        strDescription2 = ''
        strAddFile = ''
 
        for (let j=0; j < content2.length; j++) {
          if (j === 0) {
            strDescription1 = content2[j]
          } else if (j === 1) {
            strDescription2 = content2[j]
          } else if (j === 2) {
            strAddFile = content2[j]
          }
        }

        if (isEmpty(strAddFile)) {
          const newParam = {
            description1: strDescription1,
            description2: strDescription2,
          }
          singleSelParam.elements.push(newParam)
        } else {
          let rslt = []
          await Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
            CMPNY_DIV: searchImgParams.CMPNY_DIV, FILE_ID: strAddFile, DESC1: strDescription1, DESC2: strDescription2 } })]).then(res => {
              rslt = res
          })
          await showImg(rslt[0].ORESULT_CUR, strAddFile)
        } 
      }
    }
    else {
      const content = popupParams.QSTN_CONTENTS.split('&')

      // 저장된 문항 값이 1개 있을 경우
      if (content.length > 0) {
        for (let i=0; i < content.length; i++) {
          if (i === 0) {
            strDescription1 = content[i]
          } else if (i === 1) {
            strDescription2 = content[i]
          } else if (i === 2) {
            strAddFile = content[i]
          }
        }
      } else {
        strDescription1 = ''
        strDescription2 = ''
        addFile = ''
      }

      if (isEmpty(strAddFile)) {
        const newParam = {
          description1: strDescription1,
          description2: strDescription2,
        }
        singleSelParam.elements.push(newParam)
      } else {
        let rslt = []
        await Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
          CMPNY_DIV: searchImgParams.CMPNY_DIV, FILE_ID: strAddFile, DESC1: strDescription1, DESC2: strDescription2 } })]).then(res => {
            rslt = res
        })
        await showImg(rslt[0].ORESULT_CUR, strAddFile)
      } 
    }
    
  }
  else if (val === 'E') {  // 복수 선택
    isHiddenM.value = false
    isHiddenS.value = true

    const content1 = popupParams.QSTN_CONTENTS.split('|')
    let strDescription1 = ''
    let strDescription2 = ''
    let strAddFile = ''

    // 저장된 문항 값이 여러 개 있을 경우
    if (content1.length > 0) {
      for (let i=0; i < content1.length; i++) {
        const content2 = content1[i].split('&')

        strDescription1 = ''
        strDescription2 = ''
        strAddFile = ''
        for (let j=0; j < content2.length; j++) {
          if (j === 0) {
            strDescription1 = content2[j]
          } else if (j === 1) {
            strDescription2 = content2[j]
          } else if (j === 2) {
            strAddFile = content2[j]
          }
        }

        if (isEmpty(strAddFile)) {
          const newParam = {
            description1: strDescription1,
            description2: strDescription2,
          }
          multiSelParam.elements.push(newParam)
        } else {
          let rslt = []
          await Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
            CMPNY_DIV: searchImgParams.CMPNY_DIV, FILE_ID: strAddFile, DESC1: strDescription1, DESC2: strDescription2 } })]).then(res => {
              rslt = res
          })
          await showImg(rslt[0].ORESULT_CUR, strAddFile)
        } 
      }
    }
    else {
      const content = popupParams.QSTN_CONTENTS.split('&')

      // 저장된 문항 값이 1개 있을 경우
      if (content.length > 0) {
        for (let i=0; i < content.length; i++) {
          if (i === 0) {
            strDescription1 = content[i]
          } else if (i === 1) {
            strDescription2 = content[i]
          } else if (i === 2) {
            strAddFile = content[i]
          }
        }
      } else {
        strDescription1 = ''
        strDescription2 = ''
        addFile = ''
      }

      if (isEmpty(strAddFile)) {
        const newParam = {
          description1: strDescription1,
          description2: strDescription2,
        }
        multiSelParam.elements.push(newParam)
      } else {
        let rslt = []
        await Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
          CMPNY_DIV: searchImgParams.CMPNY_DIV, FILE_ID: strAddFile, DESC1: strDescription1, DESC2: strDescription2 } })]).then(res => {
            rslt = res
        })
        await showImg(rslt[0].ORESULT_CUR, strAddFile)
      } 
    }
  } else if (val === 'F') { // 선호도
    isHiddenS.value = true  
    isHiddenM.value = true

    const content = popupParams.QSTN_CONTENTS.split('&')

    let strLow = ''
    let strHigh = ''

    // 저장된 문항 값이 있을 경우
    if (content.length > 0) {
      for (let i=0; i < content.length; i++) {
        if (i === 0) {
          strLow = content[i]
        } else if (i === 1) {
          strHigh = content[i]
        }
      }

      const newElement = {
        preferenceLow: strLow,
        preferenceHigh: strHigh,
      }

      preferenceParam.elements.push(newElement)
    }
    else {
      const newElement = {
        preferenceLow: strLow,
        preferenceHigh: strHigh,
      }

      preferenceParam.elements.push(newElement)
    }
  }
}

// 단일 항목 추가 버튼
const onAddSingleQueClick = () => {
  singleSelParam.elements.push({ description1: '', description2: '' })
  CreateParseContents()
  updateRegion(popupParams.QSTN_TYPE)
}

// 복수 항목 추가 버튼
const onAddMultiQueClick = () => {
  multiSelParam.elements.push({ description1: '', description2: '' })
  CreateParseContents()
  updateRegion(popupParams.QSTN_TYPE)
}

// 문항 유형 콤보 박스 변경시 이전 항목 Clear
const clearRegion = val => {
  if (textParam.elements.length > 0) {  //전부 Clear
    textParam.elements.splice(0, 1)
  }
  if (fileParam.elements.length > 0) {
    fileParam.elements.splice(0, 1)
  }
  if (inputParam.elements.length > 0) {
    inputParam.elements.splice(0, 1)
  }
  if (singleSelParam.elements.length > 0) {
    singleSelParam.elements = []
  }
  if (multiSelParam.elements.length > 0) {
    let paramLength = multiSelParam.elements.length
    for(let i=0; i < paramLength; i++) {
      const index = multiSelParam.elements.indexOf(multiSelParam.elements[i])

      multiSelParam.elements.splice(index, 1)
    }
  }
  if (preferenceParam.elements.length > 0) {
    let paramLength = preferenceParam.elements.length
    for(let i=0; i < paramLength; i++) {
      const index = preferenceParam.elements.indexOf(preferenceParam.elements[i])

      preferenceParam.elements.splice(index, 1)
    }
  }
}

const removeSingleParam  = index => {
  singleSelParam.elements.splice(index, 1)
}

const removeMultiParam  = index => {
  multiSelParam.elements.splice(index, 1)
}

/* 문항 설명 파일 첨부 */
const addFileDescClick  = () => {
  imageViewerPopup_Desc.value.openPopup(popupParams.FILE_ID)
}

// 파일 업로드 후 저장 
const uploaded_desc = param => {
  if (param.fileId) {
    popupParams.FILE_ID = param.fileId
  } else {
    popupParams.FILE_ID = ''
    descFile.value = ''
  }

  Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
    CMPNY_DIV: searchImgParams.CMPNY_DIV, FILE_ID: param.fileId, DESC1: popupParams.QSTN_TITLE, DESC2: popupParams.QSTN_DESC} })]).then(res => {
      if(res[0].ORESULT_CUR) {
        for(let i of res[0].ORESULT_CUR){
          commonDownloadFilesApi(i).then(result => {
            const blob = new Blob([result])
            descFile.value = URL.createObjectURL(blob)
          })
        }
      }
  })
}

/* 문항 항목 파일 첨부 */
const addFileClick  = () => {
  CreateParseContents()
  imageViewerPopup.value.openPopup(fileParam.elements[0].fileId)
}

// 파일 업로드 후 저장 
const uploaded = param => {
  if (param.fileId) {
    popupParams.QSTN_CONTENTS = param.fileId
  } else {
    popupParams.QSTN_CONTENTS = ''
  }
  updateRegion(popupParams.QSTN_TYPE)
}

/* 단일 선택 파일 첨부 */
const addFileSingleClick  = index => {
  singleSelectIndex = index
  CreateParseContents()
  imageViewerPopup_Single.value.openPopup(singleSelParam.elements[index].fileId)
}

// 파일 업로드 후 저장 
const uploaded_single = param => {
  let contents = popupParams.QSTN_CONTENTS.split('|')
  let content = contents[singleSelectIndex].split('&')
  
  
  content[2] = param.fileId
  contents[singleSelectIndex] = content[0] + '&' + content[1] + '&' + content[2]
  popupParams.QSTN_CONTENTS = ''
  for(var c of contents) {
    popupParams.QSTN_CONTENTS += c + '|'
  }
  popupParams.QSTN_CONTENTS = popupParams.QSTN_CONTENTS.slice(0, -1)
  updateRegion(popupParams.QSTN_TYPE)
}

/* 복수 선택 파일 첨부 */
const addFileMultiClick  = index => {
  multiSelectIndex = index
  CreateParseContents()
  imageViewerPopup_Multi.value.openPopup(multiSelParam.elements[index].fileId)
}

// 파일 업로드 후 저장 
const uploaded_Multi = param => {
  let contents = popupParams.QSTN_CONTENTS.split('|')
  let content = contents[multiSelectIndex].split('&')
  
  content[2] = param.fileId
  contents[multiSelectIndex] = content[0] + '&' + content[1] + '&' + content[2]
  popupParams.QSTN_CONTENTS = ''
  for(var c of contents) {
    popupParams.QSTN_CONTENTS += c + '|'
  }
  popupParams.QSTN_CONTENTS = popupParams.QSTN_CONTENTS.slice(0, -1)

  updateRegion(popupParams.QSTN_TYPE)
}

// 이미지 첨부 파일 미리보기용
const showImg = async (imgpreview, id) =>{
  if(imgpreview){
    for(let i of imgpreview){
      await commonDownloadFilesApi(i).then(res => {
        const blob = new Blob([res])
        const imageURL = URL.createObjectURL(blob)

        if(searchImgParams.QSTN_TYPE === 'C') {
          fileParam.elements[0].addfile = imageURL
          fileParam.elements[0].fileId = id
        } else if(searchImgParams.QSTN_TYPE === 'D') {
          const newElement = {
            description1: i.DESC1,
            description2: i.DESC2,
            addfile: imageURL,
            fileId : id,
          }
          singleSelParam.elements.push(newElement)
        } else if(searchImgParams.QSTN_TYPE === 'E') {
          const newElement = {
            description1: i.DESC1,
            description2: i.DESC2,
            addfile: imageURL,
            fileId : id,
          }
          multiSelParam.elements.push(newElement)
        }
      }).catch(e => {
        if(searchImgParams.QSTN_TYPE === 'C') {
          fileParam.elements.push({addfile: ''})
        } else if(searchImgParams.QSTN_TYPE === 'D') {
          singleSelParam.elements.push({ description1: i.DESC1, description2: i.DESC2, })
        } else if(searchImgParams.QSTN_TYPE === 'E') {
          multiSelParam.elements.push({ description1: i.DESC1, description2: i.DESC2,})
        }
      })
    }
  }
}

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="900"
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
      <span>설문지 문항 등록/수정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select
                v-model="popupParams.SUVY_DIV"
                class="mb-2"
                :label="$t('설문지 구분')"
                label-width="100px"
                top-label
                append-inner-icon="mdi-magnify"
                @update:model-value="updateSuvy"
                width="300px"
                :items="codeList.SUVY_DIV"
                item-value="COD"
                item-title="TXT"
                required
              />
              <i-select 
                v-model="popupParams.QSTN_CATEGORY"
                class="mb-2"
                :label="$t('문항 카테고리')"
                label-width="100px"
                top-label
                append-inner-icon="mdi-magnify"
                width="300px"
                :items="codeList.QSTN_CATEGORY"
                item-value="COD"
                item-title="TXT"
                required
              />
              <VCheckbox 
                v-model="popupParams.ESNTL_YN"
                class="mb-2 mt-3"
                :label="$t('필수')"
              />
            </div>
            <div class=" d-flex mb-2">
            <i-input
              v-model="popupParams.QSTN_TITLE"
              :label="$t('문항 제목')"
              label-width="100px"
              top-label
              required
            /> 
            <i-select 
                v-model="popupParams.MAPPING"
                :label="$t('설문지 맵핑')"
                label-width="60px"
                top-label
                append-inner-icon="mdi-magnify"
                width="200px"
                :items="codeList.MAPPING"
                item-value="COD"
                item-title="TXT"
                required
              />
            </div>
            <div class=" d-flex mb-2">
              <i-input 
                v-model="popupParams.QSTN_DESC"
                :label="$t('문항 설명')"
                top-label
                label-width="100px"
              />
              <v-btn
                v-model="popupParams.FILE_ID"
                class="mt-5"
                @click="addFileDescClick" 
              >
                파일 첨부
              </v-btn>
            </div>
            <v-card
              theme="dark"
              class="ma-2"
              max-width="300"
              v-if="descFile"
            >
              <div class="d-flex fill-height align-center justify-center">
                <v-scale-transition> 
                  <v-img :src="descFile" />
                </v-scale-transition>
              </div>
            </v-card>
            <div class="d-flex mt-2">
              <div class=" d-flex mb-2 mr-5" style="width:300px;" >
                <span 
                  class="mr-4 mt-1 formLabelText"
                >
                  화면표시
                </span>
                <VRadioGroup
                  v-model="popupParams.DISP_YN"
                  style="margin: auto"
                  inline
                >
                  <v-radio 
                    label="표시" 
                    value="Y"
                  />
                  <v-radio 
                    label="미표시" 
                    value="N"
                  />
                </VRadioGroup>
              </div>
              <div class=" d-flex mb-2">
                <span 
                  class="mr-4 mt-1 formLabelText" 
                >
                  설문지
                </span>
                <VRadioGroup
                  v-model="popupParams.USE_YN"
                  style="margin: auto"
                  inline
                >
                  <v-radio 
                    label="사용" 
                    value="Y"
                  />
                  <v-radio 
                    label="미사용" 
                    value="N"
                  />
                </VRadioGroup>
              </div>
            </div>  
          </v-sheet>

          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select 
                v-model="popupParams.QSTN_TYPE"
                class="mb-2"
                :label="$t('문항유형')"
                label-width="100px"
                top-label
                append-inner-icon="mdi-magnify"
                width="340px"
                :items="codeList.QSTN_TYPE"
                @update:model-value="updateType"
                item-value="COD"
                item-title="TXT"
                required
              />
              <VCheckbox 
                v-model="popupParams.HIDDEN_VALUE"
                v-if="popupParams.QSTN_TYPE == 'D' || popupParams.QSTN_TYPE == 'E'"
                class="mb-2 mt-3"
                :label="$t('배점 숨기기')" 
              />
            </div>
            <div 
              v-for="(element, index) in inputParam.elements" 
              :key="index"
              class="mb-2" 
            >
              <v-text-field 
                v-model="element.description" 
                label="답변" 
              />
            </div>
            <div 
              v-for="(element, index) in textParam.elements" 
              :key="index"
              class="mb-2"
            >
              <v-textarea 
                v-model="element.description" 
                label="답변"
              />
            </div>
            <div
              v-for="(element, index) in fileParam.elements" 
              :key="index"
              class="mb-2"
            >
              <v-btn
                v-model="element.addFile"
                @click="addFileClick" 
              >
                파일 첨부
              </v-btn>
              <v-card
                theme="dark"
                class="ma-2 ml-5"
                max-width="200"
              >
                <div class="d-flex fill-height align-center justify-center">
                  <v-scale-transition> 
                    <v-img :src="element.addfile" />
                  </v-scale-transition>
                </div>
              </v-card>
            </div>
            <div 
              v-for="(element, index) in singleSelParam.elements" 
              :key="index"
              class="mb-2"
            >
              <div class="d-flex">
                <input 
                  v-model="element.radio"
                  class="mr-2" 
                  type="radio" 
                />
                <v-text-field 
                  v-model="element.description1" 
                  label="문항"
                  class="mr-2" 
                />
                <v-text-field
                  v-if="popupParams.HIDDEN_VALUE != 'Y'"
                  v-model="element.description2" 
                  label="배점"
                  class="mr-2"
                />
                <v-btn 
                  v-model="element.addFile" 
                  @click="addFileSingleClick(index)"
                >
                  파일 첨부
                </v-btn>
                <v-btn @click="removeSingleParam(index)">
                  문항 삭제
                </v-btn>
              </div>
              <v-card
                theme="dark"
                class="ma-2 ml-5"
                max-width="200"
              >
                <div class="d-flex fill-height align-center justify-center">
                  <v-scale-transition> 
                    <v-img :src="element.addfile" />
                  </v-scale-transition>
                </div>
              </v-card>
            </div>    
            <v-btn 
              v-if="!isHiddenS"
              class="mb-2"
              @click="onAddSingleQueClick"
            >
              항목 추가
            </v-btn>
            <div
              v-for="(element, index) in multiSelParam.elements" 
              :key="index"
              class="mb-2"
            >
              <div class="d-flex">
                <v-checkbox 
                  v-model="element.check" 
                />
                <v-text-field 
                  v-model="element.description1" 
                  label="문항"
                  class="mr-2"
                />
                <v-text-field
                  v-if="popupParams.HIDDEN_VALUE != 'Y'"
                  v-model="element.description2" 
                  label="배점"
                  class="mr-2"
                />
                <v-btn 
                  v-model="element.addFile"
                  @click="addFileMultiClick(index)" 
                >
                  파일 첨부
                </v-btn>
                <v-btn @click="removeMultiParam(index)">
                  문항 삭제
                </v-btn>
              </div>
              <v-card
                theme="dark"
                class="ma-2"
                max-width="200"
              >
                <div class="d-flex fill-height align-center justify-center">
                  <v-scale-transition> 
                    <v-img :src="element.addfile" />
                  </v-scale-transition>
                </div>
              </v-card>
            </div>
            <v-btn 
              v-if="!isHiddenM" 
              class="mb-2"
              @click="onAddMultiQueClick"
            >
              항목 추가
            </v-btn>
            <div 
              v-for="(element, index) in preferenceParam.elements" 
              :key="index"
              class="d-flex mb-2"
            >
              <i-select
                v-model="element.preferenceLow"
                class="mb-2"
                :label="$t('낮음')"
                append-inner-icon="mdi-magnify"
                label-width="50px"
                width="150px"
                :items="['0', '1', '2', '3', '4', '5']"
              />
              <i-select
                v-model="element.preferenceHigh"
                class="mb-2"
                :label="$t('높음')"
                append-inner-icon="mdi-magnify"
                label-width="50px"
                width="150px"
                :items="['0', '1', '2', '3', '4', '5']"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <ImageViewerPopup
    ref="imageViewerPopup_Desc" 
    @uploaded="uploaded_desc($event)"
  />
  <ImageViewerPopup
    ref="imageViewerPopup" 
    @uploaded="uploaded($event)"
  />
  <ImageViewerPopup
    ref="imageViewerPopup_Single" 
    @uploaded="uploaded_single($event)"
  />
  <ImageViewerPopup
    ref="imageViewerPopup_Multi" 
    @uploaded="uploaded_Multi($event)"
  />
</template>
