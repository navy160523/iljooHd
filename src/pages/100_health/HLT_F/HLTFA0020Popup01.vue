<!--
  화면명 : 작업환경측정 측정대상인자 관리
  화면개요 : 작업환경측정 측정대상인자 관리
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import { getJsonFromExcel } from "@/utils/excel"
import CopyPopup from '@/pages/100_health/HLT_F/HLTFA0010Popup01.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const copyPopup = ref(null)

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [
    { COD: 'HI', TXT: '상반기' },
    { COD: 'LO', TXT: '하반기' },
  ],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  TAGET_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'Y', TXT: '대상' },
    { COD: 'N', TXT: '비대상' },
  ],
  UNIT: [],
  CLASSIFI: []
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: 'HI',
  YEAR: String(dayjs().get('year')),
  REG_DIV: 'A',
  EXTINFO_16: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'HARM_CD', width: '40', dataType: 'text', styleName: 'editable_column', header: { text: t('코드') }, },
    { fieldName: 'CASNO', width: '50', dataType: 'text', styleName: 'editable_column', header: { text: t('CASNO') }, },
    { fieldName: 'HARM_NM', width: '80', dataType: 'text', styleName: 'editable_column', header: { text: t('유해물질명') }, },
    { fieldName: 'EXPO_CRIT', width: '40', dataType: 'number', styleName: 'editable_column', header: { text: t('노출기준') }, },
    { fieldName: 'UNIT', width: '40', dataType: 'text', styleName: 'editable_column', header: { text: t('단위') }, editor: { type: 'dropdown' }, lookupDisplay: true  },
    { fieldName: 'CLASSIFI', width: '60', dataType: 'text', styleName: 'editable_column', header: { text: t('분류') }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'EXTINFO_16', editable: false, width: '35', dataType: 'text', header: { text: t('작업환경\n측정대상'), styleName: 'multiline-editor-pre' }, renderer: { type: "check", trueValues: 'Y', falseValues: 'N', editable: false, enable: false } },
    { fieldName: 'EXTINFO_18', editable: false, width: '35', dataType: 'text', header: { text: t('특수검진\n대상'), styleName: 'multiline-editor-pre' }, renderer: { type: "check", trueValues: 'Y', falseValues: 'N', editable: false, enable: false } },
    { fieldName: 'EXTINFO_07', editable: false, width: '35', dataType: 'text', header: { text: t('특별관리\n물질'), styleName: 'multiline-editor-pre' }, renderer: { type: "check", trueValues: 'Y', falseValues: 'N', editable: false, enable: false }},
    { fieldName: 'SAFT_CHK_DIV', editable: false, width: '35', dataType: 'text', styleName: 'editable_column change_back_check', header: { text: t('국소베기\n안전검사'), styleName: 'multiline-editor-pre' }, renderer: { type: "check", trueValues: 'Y', falseValues: 'N' }},
    { fieldName: 'ACPT_CRT_DIV', editable: false, width: '35', dataType: 'text', styleName: 'editable_column change_back_check', header: { text: t('허용기준\n설정물질'), styleName: 'multiline-editor-pre' }, renderer: { type: "check", trueValues: 'Y', falseValues: 'N' }},
    { fieldName: 'EXTINFO_04', editable: false, width: '40', dataType: 'text', header: { text: t('발암성') }, },
    { fieldName: 'EXTINFO_06', editable: false, width: '40', dataType: 'text', header: { text: t('생식세포\n변이현상'), styleName: 'multiline-editor-pre' }, },
    { fieldName: 'EXTINFO_05', editable: false, width: '40', dataType: 'text', header: { text: t('생식독성') }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기') }, visible: false },
    { fieldName: 'REG_DIV', dataType: 'text', header: { text: t('구분') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  getCode()
  grdMain.value.getGridView().filterPanel.visible = true
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.YEAR = param.YEAR
  searchParams.HALF_DIV = param.HALF_DIV
  searchParams.REG_DIV = param.REG_DIV
  searchParams.TAGET_DIV = param.TAGET_DIV
  
  onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}

const getCode = () => {
  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }

  Promise.all([
    getCodeList('HHII802'),
    getCodeList('HHII803')
  ]).then((res) => {
    codeList.UNIT = res[0].ORESULT_CUR
    codeList.CLASSIFI = res[1].ORESULT_CUR
    grdMain.value.setBindingColumn('UNIT', codeList.UNIT, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CLASSIFI', codeList.CLASSIFI, 'COD', 'TXT')
  })
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCopy') {
    copyPopup.value.openPopup(searchParams, 'HLTFA0020_SEARCH_05', 'HLTFA0020_SAVE_04')
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: searchParams.YEAR,
      HALF_DIV: searchParams.HALF_DIV,
      REG_DIV: searchParams.REG_DIV,
      HARM_CD: '',
      CASNO: '',
      HARM_NM: '',
      EXPO_CRIT: '',
      UNIT: '',
      CLASSIFI: '',
      EXTINFO_16: 'N',
      EXTINFO_18: 'N',
      EXTINFO_07: 'N',
      SAFI_CHK_DIV: 'N',
      ACPT_CRT_DIV: 'N',
      EXTINFO_04: '',
      EXTINFO_06: '',
      EXTINFO_05: '',
      TAGET_DIV: 'Y',
      SAVE_YN: 'N',
    }, false)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnFormDownload') {
    let params = {
      FILE_PATH: 'HLTF',
      FILE_NAME: '작업환경측정 측정대상 인자관리 샘플.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelUpload') {
    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  }
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTFA0020_SEARCH_04', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.YEAR)) {
      Message.warn(t('년도는 필수 입력 사항입니다.'))
      return false
    } else if(isEmpty(data.HALF_DIV)) {
      Message.warn(t('반기는 필수 입력 사항입니다.'))
      return false
    } else if(isEmpty(data.REG_DIV)) {
      Message.warn(t('구분은 필수 입력 사항입니다.'))
      return false
    } else if(isEmpty(data.HARM_CD)) {
      Message.warn(t('유해인자코드는 필수 입력 사항입니다.'))
      return false
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTFA0020_SAVE_03', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    // DB에 저장되있는 것만 넣는다.
    if(data.SAVE_YN != 'Y') {
      continue
    }
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTFA0020_DELETE_02', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {  
  grdMain.value.getGridView().filterPanel.clearInput()
  excelData.map(item => {
    if(!isEmpty(item.코드) || !isEmpty(item['CAS.NO']) || !isEmpty(item.유해물질명) ||
    !isEmpty(item.노출기준) || !isEmpty(item.단위) || !isEmpty(item.분류) ||
    !isEmpty(item.국소베기안전검사) || !isEmpty(item.허용기준설정물질)) {
      grdMain.value.addRow({
        HARM_CD: item.코드,
        CASNO: item['CAS.NO'],
        HARM_NM: item.유해물질명,
        EXPO_CRIT: item.노출기준,
        UNIT: item.단위코드,
        UNIT_NM: item.단위,
        CLASSIFI: item.분류코드,
        CLASSIFI_NM: item.분류,
        SAFT_CHK_DIV: item.국소베기안전검사,
        ACPT_CRT_DIV: item.허용기준설정물질,
        YEAR: searchParams.YEAR,
        HALF_DIV: searchParams.HALF_DIV,
        REG_DIV: searchParams.REG_DIV,
        TAGET_DIV: searchParams.TAGET_DIV,
        CMPNY_DIV: searchParams.CMPNY_DIV,
      }, false)
    }
  })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  //searchSubData.value()
  emit('after-search')
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

watch(() => searchParams.YEAR, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.HALF_DIV, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.REG_DIV, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.EXTINFO_16, (newValue, oldValue) => {
  getData()
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1400"
    height="890"
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
      <span>측정대상인자 관리</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnFormDownload', 'btnExcelUpload', 'btnCopy', 'btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete' , 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('해당년도')"
              label-width="50px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
            <i-select
              v-model="searchParams.HALF_DIV"
              :label="$t('반기구분')"
              label-width="50px"
              :items="codeList.HALF_DIV"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
            <i-select
              v-model="searchParams.REG_DIV"
              :label="$t('구분')"
              label-width="50px"
              :items="codeList.REG_DIV"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />      
            <i-select
              v-model="searchParams.EXTINFO_16"
              :label="$t('대상')"
              label-width="50px"
              :items="codeList.TAGET_DIV"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <IGridTitle
              :title="$t('측정대상 인자 목록')"
            ></IGridTitle>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 519px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
  <CopyPopup ref="copyPopup" @after-search="() => onButtonsClick({ id:'btnSearch' })"/>
</template>

<style scoped lang="scss">
</style>
