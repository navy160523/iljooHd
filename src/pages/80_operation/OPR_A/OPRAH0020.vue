<!-- 
  * Vue 내 용 : 설문지 항목 관리
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/02/23
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/02/23 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { isEmpty } from "@/@core/utils"
import Message from '@hiway/utils/notify'

import OPRAH0020Popup01 from "./OPRAH0020Popup01.vue"

defineOptions({
  name:'80_operation-OPR_A-OPRAH0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const oPRAH0020Popup01 = ref(null)
const remainReply = ref(false)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  SUVY_DIV: '',
  QSTN_CATEGORY: '',
  QSTN_TITLE: '',
  USE_YN: 'Y',
})

const mainParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  QSTN_ID: '',
  SUVY_DIV: '',
  MAPPING: '',
  QSTN_TITLE : '',
  QSTN_DESC : '',
  QSTN_TYPE : '',
  QSTN_CONTENTS : '',
  QSTN_CATEGORY : '',
  DISP_YN : 'N',
  USE_YN : 'Y',
  ESNTL_YN : 'N',
  FILE_ID : '',
  HIDDEN_VALUE: '',
  SAVE_GBN : '',
})

//코드리스트
const codeList = reactive({
  SUVY_DIV : [],
  QSTN_CATEGORY : [],
})

// 메인그리드 선택 행 설문 문항 ID 저장
const selectMainParam = reactive({
  CMPNY_DIV : '',
  QSTN_ID : '',
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

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : 
  { 
    stateBar: { visible: false }, 
    checkBar: { visible: false },
    edit: { editable: false },
  },
  keys : ['CMPNY_DIV','QSTN_ID'],
  fields : [ 
    { fieldName: 'SUVY_DIV_NM', dataType: 'text', width: '150', header: { text: t('설문지 구분') } },
    { 
      fieldName: 'QSTN_TITLE', 
      dataType: 'text', 
      width: '200',
      styleName: "left-column",
      header: { text: t('문항 제목') },
    },
    { 
      fieldName: 'QSTN_DESC',
      dataType: 'text', 
      width: '250', 
      styleName: "left-column",
      header: { text: t('문항 설명') },
    },
    { fieldName: 'QSTN_TYPE_NM', dataType: 'text', width: '100', header: { text: t('문항 유형') } },
    { fieldName: 'QSTN_CATEGORY_NM', dataType: 'text', width: '100', header: { text: t('카테고리') } },
    { fieldName: 'DISP_YN_NM', dataType: 'text', width: '70', type: 'data', header: { text: t('화면표시') } },
    { fieldName: 'ESNTL_YN_NM', dataType: 'text', width: '70', type: 'data', header: { text: t('필수') } },

    // 출력 안함
    { fieldName: 'QSTN_TYPE', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_CATEGORY', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_CONTENTS', dataType: 'text' , visible: false },
    { fieldName: 'HIDDEN_VALUE', dataType: 'text' , visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_ID', dataType: 'text' , visible: false },
    { fieldName: 'SUVY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'MAPPING', dataType: 'text' , visible: false },
    { fieldName: 'FILE_ID', dataType: 'text' , visible: false },
    { fieldName: 'USE_YN', dataType: 'text' , visible: false },
    { fieldName: 'DISP_YN', dataType: 'text' , visible: false },
    { fieldName: 'ESNTL_YN', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  vm.$nextTick(() => {
    initCombo()
  })  
})

//콤보박스 셋팅
const initCombo = () => {
  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'ZS10'), //설문지 구분
  ]).then(res => {
    codeList.SUVY_DIV = res[0].ORESULT_CUR
    searchParams.SUVY_DIV = 'A'

    onButtonsClick({ id :'btnSearch' })
  })
}

watch(() => searchParams.SUVY_DIV, (newValue, oldValue) => {
  resetCode(newValue)
})

const resetCode = val =>{
  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'ZS20'), //카테고리
  ]).then(res => {
    codeList.QSTN_CATEGORY = res[0].ORESULT_CUR.filter(data => data.CODE_DESC1 === val)

    codeList.QSTN_CATEGORY.unshift({ TXT: "전체", COD: "0" })
    searchParams.QSTN_CATEGORY = '0'

    onButtonsClick({ id :'btnSearch' })
  })
}

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearchData)
      .run()
  } 
  else if (btn.id === 'btnCreate') {
    openPopup('NEW')
  }
  else if (btn.id === 'btnModify') {
    openPopup('UPDATE')
  }
  else if (btn.id === 'btnCopy') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeCopyData)
      .setQuery(copyData)
      .setConfirmMessage('복사 하시겠습니까?')
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  }
}

// 설문지 목록 조회
const searchData = () =>{
  return commonSearchApi({ queryId : 'OPRAH0020_SEARCH_01', param: searchParams })
}

// 설문지 목록 조회 후 데이터 처리
const afterSearchData = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  clearRegion()
  onCellClicked(grdMain, grdMain.value.getGridView().getCurrent())
}

// 복사전 체크
const beforeCopyData = () =>{
  if (grdMain.value.getDataProvider().rowCount === 0) {
    return Message.err("설문 문항 목록에 데이터가 없습니다.")
  }

  if (isEmpty(selectMainParam.QSTN_ID)) {
    return Message.err("복사할 설문 문항 선택해주세요.")
  }

  return true
}

// 설문 문항 복사
const copyData = () =>{
  let copyParams = []
  copyParams.push({
    CMPNY_DIV: selectMainParam.CMPNY_DIV, // 회사 코드
    QSTN_ID: selectMainParam.QSTN_ID,
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })  
  return commonExecuteApi({
    queryId: "OPRAH0020_SAVE_02", list: copyParams,
  })
}

// 설문 문항 목록에서 설문 문항 선택
const onCellClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  console.log('select row',row)
  mainParams.CMPNY_DIV = row.CMPNY_DIV
  mainParams.QSTN_ID = row.QSTN_ID
  mainParams.SUVY_DIV = row.SUVY_DIV
  if(row.MAPPING !== null){
    mainParams.MAPPING = row.MAPPING 
  } else { 
    mainParams.MAPPING = ''
  }
  mainParams.QSTN_TITLE = row.QSTN_TITLE
  mainParams.QSTN_DESC = row.QSTN_DESC
  mainParams.QSTN_TYPE = row.QSTN_TYPE
  mainParams.QSTN_CONTENTS = row.QSTN_CONTENTS
  mainParams.QSTN_CATEGORY = row.QSTN_CATEGORY
  mainParams.DISP_YN = row.DISP_YN
  mainParams.USE_YN = row.USE_YN
  mainParams.ESNTL_YN = row.ESNTL_YN
  mainParams.FILE_ID = row.FILE_ID
  mainParams.HIDDEN_VALUE = row.HIDDEN_VALUE

  selectMainParam.QSTN_ID = row.QSTN_ID
  selectMainParam.CMPNY_DIV = row.CMPNY_DIV
  searchImgParams.QSTN_TYPE = row.QSTN_TYPE
  searchImgParams.CMPNY_DIV = row.CMPNY_DIV
  console.log('mainParams',mainParams)

  clearRegion()
  makeData(row)

  // 해당 문항에 대한 답변이 하나라도 있으면 수정 불가
  commonSearchApi({ queryId: "OPRAH0020_SEARCH_02", param: {QSTN_ID: row.QSTN_ID }
  }).then(res => {
    if(res.ORESULT_CUR.length > 0) {
      if(res.ORESULT_CUR[0].CNT > 0) {
        menuTitle.value.disableBtn('btnModify', true)
        remainReply.value = true
        return
      }
    }
    menuTitle.value.disableBtn('btnModify', false)
    remainReply.value = false
  })
}

const makeData = async (row) => {
  
  if (row.QSTN_TYPE === 'A') { // 주관식 단답
    const newElement = {
      description: row.QSTN_CONTENTS,
    }

    inputParam.elements.push(newElement)
  } else if (row.QSTN_TYPE === 'B') { // 주관식 서술
    const newElement = {
      description: row.QSTN_CONTENTS,
    }

    textParam.elements.push(newElement)
  } else if (row.QSTN_TYPE === 'C') { // 파일 첨부

    searchImgParams.FILE_ID = row.QSTN_CONTENTS

    new queryFlowHelper(vm, t)
      .setQuery(searchImageData)
      .showMessage(false)
      .setAfter(afterSearchImage)
      .run()
  } else if (row.QSTN_TYPE === 'D') { // 단일 선택
    if(row.QSTN_CONTENTS == '' || row.QSTN_CONTENTS == null) {
      row.QSTN_CONTENTS = '&&'
    }
    const content1 = row.QSTN_CONTENTS.split('|')

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

        if (isEmpty(strAddFile))
        {
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
          await test(rslt[0].ORESULT_CUR)
        }
      }
    }
    else {
      const content = row.QSTN_CONTENTS.split('&')

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

      if (isEmpty(strAddFile))
      {
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
        await test(rslt[0].ORESULT_CUR)
      }
    }
  }
  else if (row.QSTN_TYPE === 'E') { // 복수 선택
    if(row.QSTN_CONTENTS == '' || row.QSTN_CONTENTS == null) {
      row.QSTN_CONTENTS = '&&'
    }
    const content1 = row.QSTN_CONTENTS.split('|')

    let strDescription1 = ''
    let strDescription2 = ''
    let strAddFile = ''

    // 저장된 문항 값이 여러 개 있을 경우
    if (content1.length > 0) {
      for (let i=0; i < content1.length; i++) {
        strDescription1 = ''
        strDescription2 = ''
        strAddFile = ''
        const content2 = content1[i].split('&')
        for (let j=0; j < content2.length; j++) {
          if (j === 0) {
            strDescription1 = content2[j]
          } else if (j === 1) {
            strDescription2 = content2[j]
          } else if (j === 2) {
            strAddFile = content2[j]
          }
        }

        if (isEmpty(strAddFile))
        {
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
          await test(rslt[0].ORESULT_CUR)
        }
      }
    }
    else { //선호도
      const content = row.QSTN_CONTENTS.split('&')

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

      if (isEmpty(strAddFile))
      {
        const newParam = {
          description1: strDescription1,
          description2: strDescription2,
        }

        multiSelParam.elements.push(newParam)
      } else {
        Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
          CMPNY_DIV: searchImgParams.CMPNY_DIV, FILE_ID: strAddFile, DESC1: strDescription1, DESC2: strDescription2 } })]).then(res => {
          test(res[0].ORESULT_CUR)
        })
      }
    }
  } else if (row.QSTN_TYPE === 'F') {
    const content = row.QSTN_CONTENTS.split('&')
    let strLow = ''
    let strHigh = ''
    let sbPoint = []
    let strPoint = ''
    
    if (content.length > 0) {
      for (let i=0; i < content.length; i++) {
        if (i === 0) {
          strLow = content[i]
        } else if (i === 1) {
          strHigh = content[i]
        }
      }

      for (let i=strLow; i < strHigh; i++) {
        sbPoint.push(i)
        sbPoint.push("     ")
      }
      sbPoint.push(strHigh)
      strPoint = sbPoint.join("")
    }

    const newElement = {
      point: strPoint,
    }

    preferenceParam.elements.push(newElement)
  }
}

// 이미지조회로직
const searchImageData = () => {
  return commonSearchApi({ queryId : 'searchFile', param: searchImgParams })
}

const afterSearchImage = res => {
  test(res.ORESULT_CUR)
}

// 문항 유형 콤보 박스 변경시 이전 항목 Clear
const clearRegion = () => {
  if (inputParam.elements.length > 0) {
    inputParam.elements = []
  }
  if (textParam.elements.length > 0) {
    textParam.elements = []
  }
  if (fileParam.elements.length > 0) {
    fileParam.elements = []
  }
  if (singleSelParam.elements.length > 0) {
    singleSelParam.elements = []
  }
  if (multiSelParam.elements.length > 0) {
    multiSelParam.elements = []
  }
  if (preferenceParam.elements.length > 0) {
    preferenceParam.elements = []
  }
}

/* -------------- 팝업 오픈 -------------- */
const openPopup = gbn => {
  if(gbn === 'NEW'){
    oPRAH0020Popup01.value.openPopup({ 
      CMPNY_DIV: mainParams.CMPNY_DIV,
      QSTN_ID: '',
      SUVY_DIV: searchParams.SUVY_DIV,
      MAPPING: '',
      QSTN_TITLE: '',
      QSTN_DESC: '',
      QSTN_TYPE : 'A',
      QSTN_CONTENTS : '',
      QSTN_CATEGORY : '',
      DISP_YN : 'N',
      USE_YN : 'Y',
      ESNTL_YN : 'N',
      FILE_ID : '',
      HIDDEN_VALUE : 'N',
      SAVE_GBN : gbn,
    })
  }
  else if (gbn === 'UPDATE') {
    oPRAH0020Popup01.value.openPopup({ 
      CMPNY_DIV: mainParams.CMPNY_DIV,
      QSTN_ID: mainParams.QSTN_ID,
      SUVY_DIV: mainParams.SUVY_DIV,
      MAPPING: mainParams.MAPPING,
      QSTN_TITLE: mainParams.QSTN_TITLE,
      QSTN_TYPE : mainParams.QSTN_TYPE,
      QSTN_DESC: mainParams.QSTN_DESC,
      QSTN_CONTENTS : mainParams.QSTN_CONTENTS,
      QSTN_CATEGORY : mainParams.QSTN_CATEGORY,
      DISP_YN : mainParams.DISP_YN,
      USE_YN : mainParams.USE_YN,
      ESNTL_YN : mainParams.ESNTL_YN,
      FILE_ID : mainParams.FILE_ID,
      HIDDEN_VALUE : mainParams.HIDDEN_VALUE,
      SAVE_GBN : gbn,
    })
  }
}

// 설문 문항 목록 더블 클릭 시 수정팝업 생성
const onCellDblClicked = (grid, clickData) => {
  if(remainReply.value) return
  openPopup('UPDATE') 
}

// 팝업에서 저장 종료 후 재조회
const afterSaveData = () => {
  onButtonsClick({ id :'btnSearch' })
}

// 이미지 첨부 파일 미리보기용
const test = async imgpreview =>{
  if(imgpreview){
    for(let i of imgpreview){
      await commonDownloadFilesApi(i).then(res => {

        const contentDisposition = res.contentDisposition
        const fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

        const blob = new Blob([res])
        const imageURL = URL.createObjectURL(blob)
        const img = new Image() // 이미지 요소 생성

        img.src = imageURL // 이미지 URL 설정
        img.alt = fileName // 이미지의 대체 텍스트 설정 (파일 이름 등)

        if(searchImgParams.QSTN_TYPE === 'C') {
          const newElement = {
            addfile : imageURL,
          }
          fileParam.elements.push(newElement)
        } else if(searchImgParams.QSTN_TYPE === 'D') {
          const newElement = {
            description1: i.DESC1,
            description2: i.DESC2,
            addfile: imageURL,
          }
          singleSelParam.elements.push(newElement)
        } else if(searchImgParams.QSTN_TYPE === 'E') {
          const newElement = {
            description1: i.DESC1,
            description2: i.DESC2,
            addfile: imageURL,
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
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnModify','btnCopy']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select 
            v-model="searchParams.SUVY_DIV"
            :label="$t('설문지구분')"
            label-width="100px"
            append-inner-icon="mdi-magnify"
            :items="codeList.SUVY_DIV"
            item-value="COD"
            item-title="TXT"
            width="300px"
            required
          />
          <i-select 
            v-model="searchParams.QSTN_CATEGORY" 
            :label="$t('카테고리')"
            label-width="100px"
            append-inner-icon="mdi-magnify"
            :items="codeList.QSTN_CATEGORY"
            item-value="COD"
            item-title="TXT"
            width="300px"
          />
          <i-input
            v-model="searchParams.QSTN_TITLE"
            :label="$t('문항 제목 검색')"
            label-width="100px"
          />
          <VCheckbox
            v-model="searchParams.USE_YN"
            :label="$t('설문지 사용 여부')"
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet 
            width="60%" 
            class="pa-0 h-auto mr-2"
          >
            <!-- 메인그리드 -->
            <IGridTitle :title="$t('설문 문항 목록')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @on-cell-clicked="onCellClicked"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
          <v-sheet 
            width="40%" 
            class="d-flex flex-column"
          >
            <v-sheet>
              <IGridTitle :title="$t('상세화면')">
                <template #editors />
              </IGridTitle>
              <div
                v-for="(element, index) in inputParam.elements" 
                :key="index"
                class="mb-2"
              >
                <v-card 
                  color="#e2e3e5" 
                  class="pa-3"
                >
                  <v-text-field 
                    v-model="element.description"
                    class="mt-2"
                  />
                </v-card>
              </div>
              <div 
                v-for="(element, index) in textParam.elements" 
                :key="index"
                class="mb-2"
              >
                <v-card 
                  color="#e2e3e5" 
                  class="pa-3"
                >
                  <v-textarea
                    v-model="element.description"
                    class="mt-2"
                  />
                </v-card>
              </div>
              <div 
                v-for="(element, index) in fileParam.elements" 
                :key="index"
                class="mb-2"
              >
                <v-card 
                  color="#e2e3e5" 
                  class="pa-3"
                >
                  <v-card
                    theme="dark"
                    class="ma-2"
                    max-width="300"
                  >
                    <div class="d-flex fill-height align-center justify-center">
                      <v-scale-transition> 
                        <v-img :src="element.addfile" />
                      </v-scale-transition>
                    </div>
                  </v-card>
                </v-card>
              </div>
              <div 
                v-for="(element, index) in singleSelParam.elements" 
                :key="index"
                class="mb-2"
              >
                <v-card 
                  color="#e2e3e5" 
                  class="pa-3"
                >
                  <div class="d-flex mt-2">
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
                      v-if="mainParams.HIDDEN_VALUE != 'Y'"
                      v-model="element.description2" 
                      label="배점"
                      class="mr-2" 
                    />
                  </div>
                  <v-card
                    theme="dark"
                    class="ma-2 ml-5"
                    max-width="200"
                    v-if="element.addfile"
                  >
                    <div class="d-flex fill-height align-center justify-center">
                      <v-scale-transition> 
                        <v-img :src="element.addfile" />
                      </v-scale-transition>
                    </div>
                  </v-card>
                </v-card>
              </div>
              <div 
                v-for="(element, index) in multiSelParam.elements" 
                :key="index"
                class="mb-2"
              >
                <v-card 
                  color="#e2e3e5" 
                  class="pa-3"
                >
                  <div class="d-flex mt-2">
                    <input
                      v-model="element.radio"
                      class="mr-2"
                      type="checkbox"
                      disabled="true"
                    />
                    <v-text-field 
                      v-model="element.description1"
                      label="문항"
                      class="mr-2"
                    />
                    <v-text-field
                      v-if="mainParams.HIDDEN_VALUE != 'Y'"
                      v-model="element.description2" 
                      label="배첨"
                      class="mr-2" 
                    />
                  </div>
                  <v-card
                    theme="dark"
                    class="ma-2 ml-5"
                    max-width="200"
                    v-if="element.addfile"
                  >
                    <div class="d-flex fill-height align-center justify-center">
                      <v-scale-transition> 
                        <v-img :src="element.addfile" />
                      </v-scale-transition>
                    </div>
                  </v-card>
                </v-card>
              </div>
              <div 
                v-for="(element, index) in preferenceParam.elements" 
                :key="index"
                class="mb-2"
              >
                <v-card 
                  color="#e2e3e5" 
                  class="pa-3"
                >
                  <div class="d-flex mt-2">
                    <span class="mr-2 formLabelText">
                      낮음
                    </span>
                    <span 
                      class="mr-2 formLabelText" 
                      style="letter-spacing:10px"
                    >
                      {{ element.point }}
                    </span>
                    <span class="mr-2 formLabelText">
                      높음
                    </span>
                  </div>
                </v-card>
              </div>
            </v-sheet>
          </v-sheet>
        </div>
        <!-- 설문지 등록/수정 팝업 -->
        <OPRAH0020Popup01 
          ref="oPRAH0020Popup01"
          @closed="afterSaveData"
        /> 
      </div>
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>