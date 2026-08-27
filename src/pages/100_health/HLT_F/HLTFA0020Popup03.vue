<!--
  화면명 : 작업환경측정 측정대상인자 관리 공정정보
  화면개요 : 작업환경측정 측정대상인자 관리 공정정보 상세
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
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
  PROCESS_CD: [],
  DEPT_CD: []
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: 'HI',
  YEAR: dayjs().get('year'),
  REG_DIV: 'A',
  BSNS_CD: '',
  DEPT_CD: '',
  DEPT_NM: ''
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'PROCESS_CD', width: '50', dataType: 'text', styleName: 'editable_column', header: { text: t('공정명') }, editor: { type: 'dropdown' }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        var dropList = { COD: [], TXT: [] }
        var processList = []

        // 모든 DEPT_CD를 담는다.
        for(var data of grdMain.value.getDataProvider().getJsonRows(0,-1)) {
          processList.push(data.PROCESS_CD)
        }

        for(let cd of codeList.PROCESS_CD) {
          if(!processList.includes(cd.COD)) {
            dropList.COD.push(cd.COD)
            dropList.TXT.push(cd.TXT)
          }
        }
        if(grid.getValue(dataCell.index.itemIndex, 'SAVE_YN') == 'Y') {
          ret.editor = {
            type: 'dropdown',
            values: dropList.COD,
            labels: dropList.TXT,
            editable : false, 
            styleName : '', 
            enabled: false
          }
          ret.editable = false
          ret.styleName = ''
        } else { 
          ret.editor = {
            type: 'dropdown',
            values: dropList.COD,
            labels: dropList.TXT,
            editable : true, 
            styleName : 'editable_column', 
            enabled: true
          }
        }
        return ret
      }
    },
    { fieldName: 'OFFI_CONT', width: '80', editable : false, dataType: 'text', styleName: 'left-column', header: { text: t('공정설명') }, },
    { fieldName: 'DISP_SEQ', width: '40', dataType: 'text', styleName: 'editable_column', header: { text: t('Display순서') }, },
    { fieldName: 'INSERT_DATE', width: '40', editable : false, dataType: 'text', styleName: '', header: { text: t('등록일자') }, },
    { fieldName: 'UPDATE_DATE', width: '40', editable : false, dataType: 'text', styleName: '', header: { text: t('변경일자') }, },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기') }, visible: false },
    { fieldName: 'REG_DIV', dataType: 'text', header: { text: t('구분') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'PROCESS_NM', dataType: 'text', header: { text: t('공정') }, visible: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서명') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.YEAR = param.YEAR
  searchParams.HALF_DIV = param.HALF_DIV
  searchParams.REG_DIV = param.REG_DIV
  searchParams.BSNS_CD = param.BSNS_CD
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.DEPT_NM = param.DEPT_NM
  getCode()
  grdMain.value.getGridView().filterPanel.visible = true
  
  dialog.value = true
}

const getCode = () => {
  Promise.all([
    // 공정코드
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_09', param: { 
      CMPNY_DIV: searchParams.CMPNY_DIV, 
      YEAR: searchParams.YEAR,
      HALF_DIV: searchParams.HALF_DIV
    } }),
    // 부서
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_DEPT', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.PROCESS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    onButtonsClick({ id: 'btnSearch' })
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
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD,
      DEPT_NM: searchParams.DEPT_NM,
      PROCESS_CD: '',
      PROCESS_NM: '',
      OFFI_CONT: '',
      DISP_SEQ: '',
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
  return commonSearchApi({ queryId: 'HLTFA0020_SEARCH_08', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.setBindingColumn('PROCESS_CD', codeList.PROCESS_CD, 'COD', 'TXT')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.HALF_DIV)) {
      return Message.warn(t('반기는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.REG_DIV)) {
      return Message.warn(t('구분은 필수 입력 사항입니다.'))
    } else if(isEmpty(data.PROCESS_CD)) {
      return Message.warn(t('공정은 필수 입력 사항입니다.'))
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
  return commonExecuteApi({ queryId : 'HLTFA0020_SAVE_05', list: saveParams })
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
  
  return commonExecuteApi({ queryId : 'HLTFA0020_DELETE_03', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

// 그리드 데이터 변경 시
const onEditChange = (grid, index, value) => {
  if(index.fieldName == 'PROCESS_CD') {
    let prc = codeList.PROCESS_CD.filter(item => item.COD == value)
    if(!isEmpty(prc)) {
      // 공정명 변경 시 공정설명 변경
      grid.setValue(index.itemIndex, 'OFFI_CONT', prc[0].OFFI_CONT)
    }
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  //searchSubData.value()
  emit('after-search')
  grdMain.value.getDataProvider().setRows([])
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
    width="800"
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
      <span>공정정보 상세</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete' , 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서')"
              label-width="50px"
              :items="codeList.DEPT_CD"
              :readonly="true"
              item-value="DEPT_CD"
              item-title="DEPT_NM" 
              width="200px"
            />
            <i-input
              v-model="searchParams.DEPT_CD"
              type="text"
              width="200px"
              :readonly="true"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <IGridTitle
              :title="$t('공정정보')"
            ></IGridTitle>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 519px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onEditChange="onEditChange"
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
