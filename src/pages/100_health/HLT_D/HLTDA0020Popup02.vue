<!--
  화면명 : 경고 표지 작성
  화면개요 : 경고 표지를 작성 및 수정합니다.
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from "@/components/ILabel.vue"
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import HLTDA0020Popup04 from '@/pages/100_health/HLT_D/HLTDA0020Popup04.vue'

const emit = defineEmits(['after-search'])
const changeYn = ref('N')

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const dummy = ref(null)
const hltda0020Popup04 = ref(null)
const isAdmin = ref(0)

// 그림문자 리스트
const imgList = ref([])

const codeList = reactive({
  DAN_TXT: [],
  SUB_COD1: [],
  SUB_COD2: [],
  SUB_COD3: [],
  SUB_COD4: [],
  SUB_GUBUN: [
    { COD: 'A', TXT: '예방'},
    { COD: 'B', TXT: '대응'},
    { COD: 'C', TXT: '저장'},
    { COD: 'D', TXT: '폐기'},
  ]
})

/* 복사 조건 */
const searchParams = reactive({
  CMPNY_DIV: '',
  SAUPBU: '',
  DEPT_CD: '',
  MATNO: '',
  VNDCOD: '',
  VNDNME: '',
  MATDSC: '',
  VND_TEL: '',
  SIGN_MRK: '경고',
  TRT_MSG_YN: 'N',
  EDT_STUS: '',
  MSDS_NM: '',
})

// 저장 데이터들
const saveParam = reactive({
  IMG: [],
  DANGER: [],
  TRT: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'DAN_CODE', width: '30', dataType: 'text', styleName: 'editable_column', header: { text: t('코드') }, },
    { fieldName: 'DAN_TXT', width: '150', dataType: 'text', styleName: 'editable_column', 
      header: { text: t('유해•위험 문구') }, lookupDisplay: true, editable: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
      'styleCallback': function(){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        var dropList = { COD: [], TXT: [] }
        // 중복 삭제
        let grdData = new Set(grdMain.value.getDataProvider().getJsonRows(0,-1).map(item => item.DAN_TXT))
        let reCodeList = codeList.DAN_TXT.filter(item => !grdData.has(item.COD))
        dropList.COD = reCodeList.map(item => item.COD)
        dropList.TXT = reCodeList.map(item => item.TXT)
        ret.editor = {
          type: 'dropdown',
          values: dropList.COD,
          labels: dropList.TXT,
          textReadOnly: false, 
          dropDownCount: 5, 
          partialMatch: true, 
          domainOnly: true, 
          dropDownWhenClick: true 
        }
        return ret
      },
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사') }, visible: false },
    { fieldName: 'MATNO', dataType: 'text', header: { text: t('자재번호') }, visible: false },
    { fieldName: 'DAN_TXT_SEQ', dataType: 'text', header: { text: t('유해위험순번') }, visible: false },
    { fieldName: 'SORT_SEQ', dataType: 'text', header: { text: t('정렬순번') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장유무') }, visible: false },
  ],
  columns: [],
})

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'TRT_DIV', width: '20', dataType: 'text', editable: false, header: { text: t('구분1') }, editor: { type: 'dropdown' }, lookupDisplay: true,mergeRule: { criteria: 'value' }, },
    { fieldName: 'TRT_TXT_SEQ', width: '10', dataType: 'text', editable: false, header: { text: t('구분2') }, },
    { fieldName: 'TRT_TXT', width: '150', dataType: 'text', styleName: 'editable_column', header: { text: t('예방조치문구') }, editor: { type: 'dropdown' }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        var dropList = { COD: [], TXT: [] }
        let reCodeList = []
        // 중복 삭제
        let grdData = new Set(grdSub.value.getDataProvider().getJsonRows(0,-1)
          .filter(item => item.TRT_DIV == grid.getValue(dataCell.index.itemIndex, 'TRT_DIV'))
          .map(item => item.TRT_TXT))
        if(grid.getValue(dataCell.index.itemIndex, 'TRT_DIV') == 'A') {
          reCodeList = codeList.SUB_COD1.filter(item => !grdData.has(item.COD))
        } else if(grid.getValue(dataCell.index.itemIndex, 'TRT_DIV') == 'B') {
          reCodeList = codeList.SUB_COD2.filter(item => !grdData.has(item.COD))
        } else if(grid.getValue(dataCell.index.itemIndex, 'TRT_DIV') == 'C') {
          reCodeList = codeList.SUB_COD3.filter(item => !grdData.has(item.COD))
        } else if(grid.getValue(dataCell.index.itemIndex, 'TRT_DIV') == 'D') {
          reCodeList = codeList.SUB_COD4.filter(item => !grdData.has(item.COD))
        }
        dropList.COD = reCodeList.map(item => item.COD)
        dropList.TXT = reCodeList.map(item => item.TXT)
        ret.editor = {
          type: 'dropdown',
          values: dropList.COD,
          labels: dropList.TXT,
          editable : true, 
          styleName : 'editable_column', 
          enabled: true
        }

        return ret
      }
    },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사') }, visible: false },
    { fieldName: 'MATNO', dataType: 'text', header: { text: t('자재번호') }, visible: false },
    { fieldName: 'TRT_MSG_YN', dataType: 'text', header: { text: t('유해위험순번') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장유무') }, visible: false },
  ],
  columnLayout: [
    {
      name: '구분',
      direction: 'horizontal',
      hideChildHeaders: true, 
      items: [ 'TRT_DIV', 'TRT_TXT_SEQ' ],
      header: { text: t('구분') },
    },
    'TRT_TXT',
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

// 팝업 오픈 시 실행
const openPopup = (param, pIsAdmin) => {
  imgList.value = []
  changeYn.value = 'N'
  isAdmin.value = pIsAdmin

  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.SAUPBU = param.SAUPBU
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.MATNO = param.MATNO
  searchParams.MATDSC = param.MATDSC
  searchParams.VNDCOD = param.VNDCOD
  searchParams.VNDNME = param.VNDNME
  searchParams.VND_TEL = param.VND_TEL
  searchParams.EDT_STUS = param.EDT_STUS
  searchParams.MSDS_NM = param.MSDS_NM

  grdSub.value.getGridView().setRowGroup({
    mergeMode: true 
  })
  getData()
  dialog.value = true
}

const getData = () => {
  Promise.all([
    commonSearchApi({ queryId: 'HLTDA0020_SEARCH_06', param: searchParams }), // 그림문자 리스트 조회
    getCodeList('HHII070'), // 유해위험문구 콤보박스 조회
    getCodeList('HHII081'), // 예방조치문구 - 예방
    getCodeList('HHII082'), // 예방조치문구 - 대응
    getCodeList('HHII083'), // 예방조치문구 - 저장
    getCodeList('HHII084'), // 예방조치문구 - 폐기
    commonSearchApi({ queryId: 'HLTDA0020_SEARCH_03', param: searchParams }), // 유해위험문구
    commonSearchApi({ queryId: 'HLTDA0020_SEARCH_04', param: searchParams }), // 예방조치문구
    commonSearchApi({ queryId: 'HLTDA0020_SEARCH_07', param: searchParams }), // 그림문자, 신호어 지정 조회
  ]).then(async (res) => {
    // imgList.value = res[0].ORESULT_CUR.map(item => item.FILE_ID)
    codeList.DAN_TXT = res[1].ORESULT_CUR
    codeList.SUB_COD1 = res[2].ORESULT_CUR
    codeList.SUB_COD2 = res[3].ORESULT_CUR
    codeList.SUB_COD3 = res[4].ORESULT_CUR
    codeList.SUB_COD4 = res[5].ORESULT_CUR
    grdMain.value.setBindingColumn('DAN_TXT', codeList.DAN_TXT, 'COD', 'TXT')
    grdSub.value.setBindingColumn('TRT_DIV', codeList.SUB_GUBUN, 'COD', 'TXT')
    grdSub.value.setBindingColumn('TRT_TXT', [...codeList.SUB_COD1, ...codeList.SUB_COD2, ...codeList.SUB_COD3, ...codeList.SUB_COD4] , 'COD', 'TXT')
    grdMain.value.getDataProvider().setRows(res[6].ORESULT_CUR)
    grdSub.value.getDataProvider().setRows(res[7].ORESULT_CUR) 
    await imgSet(res[0].ORESULT_CUR.map(item => item.FILE_ID))
    dataSet(res[8].ORESULT_CUR)
    // 공급업체 연락처 설정
    searchParams.VND_TEL = res[8].ORESULT_CUR[0].VND_TEL
  })
}

const imgSet = async(imgs) => { 
  imgList.value = []

  for(let img of imgs) {
    let result = await commonSearchApi({ queryId: 'searchFile', param: { 
        CMPNY_DIV: searchParams.CMPNY_DIV,
        FILE_ID: img,
      },
    })

    await result.ORESULT_CUR.forEach((e) => {
      if (e.FILE_TYPE.toUpperCase() === 'PNG' || e.FILE_TYPE.toUpperCase() === 'JPG' || e.FILE_TYPE.toUpperCase() === 'JPEG' || e.FILE_TYPE.toUpperCase() === 'GIF') {
        // imgList.fileName.push(e)
        imgList.value.push({ fileName: e, chk: 'N', src: '' })
      }
    })
  }

  /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
  await imgList.value.forEach((e, idx) => {
    let fileName = null
    let blob = null
    let imageURL = null
    let img = new Image() // 이미지 요소 생성

    commonDownloadFilesApi(e.fileName)
      .then((res2) => {
        fileName = res2.contentDisposition.match(/fileName="([^"]+)"/)[1]
        blob = new Blob([res2])
        imageURL = URL.createObjectURL(blob)
        img = new Image() // 이미지 요소 생성
        img.src = imageURL // 이미지 URL 설정
        img.alt = fileName
        dummy.value = imageURL
      })
      .finally(() => {
        imgList.value[idx].src = imageURL
      })
  })
}

// 그림문자, 신호어 조회 바인딩
const dataSet = (data) => {
  for(let dt of data) {
    if(!isEmpty(dt.PICT_ID)) {
      if(imgList.value.length >= dt.PICT_ID) {
        imgList.value[dt.PICT_ID - 1].chk = 'Y'
      }
    }
    if(isEmpty(dt.SIGN_MRK)) {
      searchParams.SIGN_MRK = '경고'
    } else { 
      searchParams.SIGN_MRK = dt.SIGN_MRK
    }
    searchParams.TRT_MSG_YN = dt.TRT_MSG_YN
  }
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }

    new saveFlowHelper(vm, t)
      .setConfirmMessage('저장 하시겠습니까?')
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData) 
      .run()
  } else if(btn.id === 'btnPrint') {
    if(searchParams.EDT_STUS != '9') {
      return Message.err(t('저장을 하셔야 출력이 가능합니다.'))
    }
    hltda0020Popup04.value.openPopup(searchParams)
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const onButtonsMain = (btn) => {
  if(btn.id === 'btnDelete') {
    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }

    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteMainData)
      .setAfter(afterMainDelete)
      .run()
  } else if(btn.id === 'btnCreate') {
    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }

    const grid = grdMain.value.getDataProvider()
    const gridView = grdMain.value.getGridView()
    const newRow = grid.addRow({
      CMPNY_DIV: searchParams.CMPNY_DIV, 
      DEPT_CD: searchParams.DEPT_CD,
      VNDCOD: searchParams.VNDCOD,
      MATNO: searchParams.MATNO,
    })
    gridView.setCurrent({ itemIndex: newRow, column: gridView.getColumn(0).DAN_CODE })
    
  }
}

const deleteMainData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTDA0020_DELETE_02', list: saveParams })
} 

const afterMainDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

const onButtonsSub = (btn) => {
  if(btn.id === 'btnDelete') {
    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }
    
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setQuery(deleteSubData)
      .setAfter(afterSubDelete)
      .run()
  }
}

const deleteSubData = () => { 
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTDA0020_DELETE_03', list: saveParams })
} 

const afterSubDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  saveParam.IMG = []
  saveParam.DANGER = []
  saveParam.TRT = []

  let chkImg = imgList.value.map((obj,i) => (obj.chk === 'Y' ? i + 1 : -1)).filter(item => item !== -1).join(',') // 그림문자 리스트
  let dangerData = grdMain.value.getGridView().getCheckedRows(true) // 유해위험문구
  let trtData = grdSub.value.getGridView().getCheckedRows(true)

  if(isEmpty(searchParams.VND_TEL)) {
    return Message.warn(t('공급업체 연락처는 필수입니다.'))
  }
   
  // 그림문자 지정
  if(imgList.value.filter(item => item.chk === 'Y').length === 0) {
    return Message.warn(t('그림문자는 필수입니다.'))
  }

  if(imgList.value.filter(item => item.chk === 'Y').length > 4) {
    return Message.warn(t('그림문자는 4개까지 선택할 수 있습니다.'))
  }
  saveParam.IMG.push({ ...searchParams, PICT_ID: chkImg })

  // 유해위험문구 저장
  if(isEmpty(grdMain.value.getDataProvider().getJsonRows(0,-1).map(item => item.DAN_TXT).filter(item => !isEmpty(item)))) {
    return Message.warn(t('유해 위험 문구를 입력하세요.'))
  }
  for(let rowIdx of dangerData) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.DAN_TXT)) {
      continue
    }
    // DAN_TXT에도 코드가 들어가야 정상작동
    data.DAN_TXT = data.DAN_CODE
    saveParam.DANGER.push(data)
  }
  

  // 예방조치문구
  if(searchParams.TRT_MSG_YN !== 'Y') {
    let subDataA = grdSub.value.getDataProvider().getJsonRows(0,-1).filter(item => item.TRT_DIV == 'A' && !isEmpty(item.TRT_TXT))
    let subDataB = grdSub.value.getDataProvider().getJsonRows(0,-1).filter(item => item.TRT_DIV == 'B' && !isEmpty(item.TRT_TXT))
    let subDataC = grdSub.value.getDataProvider().getJsonRows(0,-1).filter(item => item.TRT_DIV == 'C' && !isEmpty(item.TRT_TXT))
    let subDataD = grdSub.value.getDataProvider().getJsonRows(0,-1).filter(item => item.TRT_DIV == 'D' && !isEmpty(item.TRT_TXT))
    
    if(isEmpty(grdSub.value.getDataProvider().getJsonRows(0,-1).filter(item => !isEmpty(item.TRT_TXT)))) {
      return Message.err(t('예방조치문구가 필요없을 경우 해당없음을 체크해 주십시오.'))
    } else if(isEmpty(subDataA)) {
      return Message.err(t('예방은 1개 이상 입력해야 합니다.'))
    } else if(isEmpty(subDataB)) {
      return Message.err(t('대응은 1개 이상 입력해야 합니다.'))
    } else if(isEmpty(subDataC)) {
      return Message.err(t('저장은 1개 이상 입력해야 합니다'))
    } else if(isEmpty(subDataD)) {
      return Message.err(t('폐기는 1개 이상 입력해야 합니다.'))
    } 
  }
  for(let rowIdx of trtData) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx) 
    if(isEmpty(data.TRT_TXT)) {
      continue
    }
    saveParam.TRT.push(data) 
  }
  return true
}

/* ********** 저장 ********** */
const saveData = () => {
  return commonRequest('/hse/health/HLTDA0020_SAVE_DANGER', saveParam )
} 

// 저장 후 작업
const afterSaveData = () => { 
  changeYn.value = 'Y'
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  searchParams.EDT_STUS = '9'
}

const onEditChange = (grid, index, value) => {
  // 유해위험문구 변경시 코드도 입력
  if(index.fieldName === 'DAN_TXT') {
    // 일치하는 데이터가 있을경우에만 자동입력
    if(codeList.DAN_TXT.find(item => item.COD == value)) {
      grid.setValue(index.itemIndex, 'DAN_CODE', value)
    }
  } else if (index.fieldName === 'DAN_CODE') {
    let danTxt = codeList.DAN_TXT.find(item => item.COD == value)
    let dupe = grdMain.value.getDataProvider().getJsonRows().filter(item => item.DAN_CODE == value).length
    if(dupe > 0) {
      grid.setValue(index.itemIndex, 'DAN_CODE', value)
      grid.setValue(index.itemIndex, 'DAN_TXT', '')
      return Message.warn(t('중복된 유해위험 문구가 존재합니다.'))
    }
    if(!isEmpty(danTxt)) {
      grid.setValue(index.itemIndex, 'DAN_TXT', danTxt.TXT)
    } else {
      grid.setValue(index.itemIndex, 'DAN_TXT', '')
    }
  }
}
/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search', changeYn.value);
  dialog.value = false 
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
    height="1000"
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
      <span>경고표지 작성</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnPrint', 'btnClose']"
          @click-button="onButtonsClick"
          :use-permission="false"
        />
      </v-card-title>
      <div class="pa-4" style="max-height:800px; overflow-y: auto;">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <i-input
            v-model="searchParams.MATDSC"
            label-width="100px"
            :label="$t('제품명')"            
            width="720px"
            :readonly="true"
            class="mt-2"
          />
          <i-input
            v-model="searchParams.VNDNME"
            :label="$t('공급업체명')"
            label-width="100px"
            width="720px" 
            :readonly="true"
            class="mt-2" 
          />
          <i-input
            v-model="searchParams.VND_TEL"
            :label="$t('공급업체 연락처')"
            label-width="100px"
            width="720px"
            class="mt-2"
          />
        </v-sheet>
        <div class="d-flex mb-2">
          <v-sheet class="h-auto mr-2" width="70%">
            <IGridTitle
              :title="t('그림문자 지정')"
            />  
            <div class="tooltip">
              1. 공급업체 연락처는 MSDS 1번 항목의 공급자 정보를 참고하여 작성하세요.<br>
              2. 그림문자는 MSDS 2번 항목의 그림문자와 동일하게 선택하세요. (최소 1개 이상, 4개 이하)<br>
              3. 신호어는 MSDS 2번 항목의 신호어를 참고하여 선택하세요.
            </div>
            <div class="d-flex flex-wrap">
              <div :key="i" v-for="(item, i) in imgList" class="mr-2">
                <img
                  :src="item.src"
                  height="120px"
                  class="border"
                />
                <div class="d-flex justify-center align-center">
                  <v-checkbox
                    v-model="item.chk"
                    true-value="Y"
                    false-value="N"
                  />
                </div>
              </div>  
            </div> 
          </v-sheet>
          <v-sheet class="h-auto" width="30%">
            <IGridTitle
              :title="t('신호어 지정')"
            />         
            <v-radio-group class="mt-1" v-model="searchParams.SIGN_MRK">
              <v-radio label="경고" value="경고"></v-radio>
              <v-radio label="위험" value="위험"></v-radio>
              <v-radio label="해당 없음" value="해당 없음"></v-radio>
            </v-radio-group>
          </v-sheet>
        </div>
        <IGridTitle
          :title="$t('유해위험문구')"
          :button-list="['btnCreate', 'btnDelete']"
          @click-button="onButtonsMain"
          :use-permission="false"
        ></IGridTitle>
        <div class="tooltip">
          유해•위험 문구는 MSDS 2번 항목 '나'항의 유해•위험 문구와 동일하게 선택 하세요.<br>
          유해•위험 문구는 직접 선택할 수도 있고, 코드 칸에 유해위험 문구 앞에 적혀있는 코드 입력시 자동으로 선택됩니다.
        </div>
        <div class="d-flex flex-column content-area mb-2">
          <v-sheet class="flex-column">
            <RealGrid 
              ref="grdMain"
              style="height: 200px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onEditChange="onEditChange"
            />
          </v-sheet>
        </div> 
        <IGridTitle
          :title="$t('예방조치문구')"
          :button-list="['btnDelete']"
          @click-button="onButtonsSub"
          style="margin-bottom: 0px;"
          :use-permission="false"
        ></IGridTitle>
        <div class="tooltip mt-2">
          예방조치 문구는 MSDS 2번 항목의 '나'항을 참조하여 각 구분 별로 해당되는 내용을 선택하세요.<br>
          각 구분 별로 최소 1개 이상 선택하여야 합니다.<br>
        </div>
        <div class="d-flex mb-2">
          <v-checkbox
            v-model="searchParams.TRT_MSG_YN"
            :label="$t('')"
            true-value="Y"
            false-value="N"
            class="mt-1"
          />
          <ILabel 
            :label="$t('해당없음(예방조치문구에 해당없음이라고 명시되어 있을 때에만 체크하세요.)')"
            style="width: 600px;" 
            class="mr-0"
          >
          </ILabel>
        </div>
        <div class="d-flex flex-column content-area">
          <v-sheet class="flex-column">
            <RealGrid 
              ref="grdSub"
              style="height: 421px;"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card>
    <HLTDA0020Popup04 ref="hltda0020Popup04"/>
  </v-dialog>
</template>

<style scoped lang="scss">
.tooltip {
  background-color: white;
  color: black;
  border-radius: 5px;
  white-space: nowrap;
  z-index: 10;
  border: 2px solid black;
  font-size: 16px;
  padding: 8px;
  margin-bottom: 8px;
}
</style>
