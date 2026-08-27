<!--
  화면명 : 보건위험성 보정
  화면개요 : 보건위험성 보정 > 협력사
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

const emit = defineEmits(['after-search'])

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  YEAR: '',
  SEQ: '',
  GBN_NO: '',
  PROCESS_CD: '',
  COMBO_LIST: [],
  NO_ADJUST: '',
  ADJUST_YN: 'Y',
  STATUS_DESC: '',
  STATUS: ''
})

const codeList = reactive({
  GBN_NO: [
    { COD: 'A', TXT: '화학물질 노출'},
    { COD: 'B', TXT: '소음 노출'},
    { COD: 'C', TXT: '근골격계 부담 수준'},
  ],
  PROCESS_CD: [
  ],
  STATUS: [ 
    { COD: '0', TXT: '보정 필요' },
    { COD: '1', TXT: '보정 진행 중' },
    { COD: '2', TXT: '보정 완료' }
  ] 
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'GBN_NO', width: '60', editable: false, dataType: 'text', header: { text: t('위험구분') }, lookupDisplay: true },
    { fieldName: 'PROCESS_NM', width: '80', editable: false, dataType: 'text', header: { text: t('공정명') }, },
    { fieldName: 'ADJUST_NM', width: '60', editable: false, dataType: 'text', header: { text: t('보정 상태') }, },
    { fieldName: 'DISEASE_CNT', width: '60', editable: true, 'numberFormat': '0', dataType: 'number', styleName: 'editable_column right-column', header: { text: t('신규 직업병 유소견자(D1) 발생 건수') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
    { fieldName: 'DISEASE_NM', width: '80', editable: true, dataType: 'text', styleName: 'editable_column left-column', header: { text: t('발생 직업병 명칭(소견)') }, },
    { fieldName: 'RESULT', width: '50', editable: false, dataType: 'text', header: { text: t('보정 결과') }, },
    { fieldName: 'ADJUST_USER', width: '50', editable: false, dataType: 'text', header: { text: t('보정자') }, },
    { fieldName: 'ADJUST_DATE', width: '80', editable: false, dataType: 'text', header: { text: t('보정날짜') }, },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('협력사코드') }, visible: false },  
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('협력사코드') }, visible: false },  
    { fieldName: 'ADJUST_YN', dataType: 'text', header: { text: t('보정 상태') }, visible: false},
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (params) => {
  searchParams.BSNS_CD = params.BSNS_CD
  searchParams.DEPT_CD = params.DEPT_CD
  searchParams.ASGN_CD = params.ASGN_CD
  searchParams.YEAR = params.YEAR
  searchParams.GBN_NO = params.GBN_NO
  searchParams.STATUS = params.STATUS
  searchParams.SEQ = params.REV_NO

  // if(searchParams.STATUS == '2') {
  //   menuTitle.value.disableBtn('btnConfirm', true)
  //   menuTitle.value.disableBtn('btnCancelConfirm', false)
  //   searchParams.ADJUST_YN = 'N'
  // } else {
  //   menuTitle.value.disableBtn('btnConfirm', false)
  //   menuTitle.value.disableBtn('btnCancelConfirm', true)
  //   searchParams.ADJUST_YN = 'Y'
  // }

  grdMain.value.setBindingColumn('GBN_NO', codeList.GBN_NO, 'COD', 'TXT') 

  grdMain.value.getDataProvider().setRows([])
  onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}

const closePopup = () => {
  emit('after-search')
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnConfirm') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage(t('확정 하시겠습니까?'))
      .setBefore(beforeConfirm)
      .setQuery(confirmData)
      .setAfter(afterConfirmData)
      .run()
  } else if (btn.id === 'btnCancelConfirm') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage(t('확정취소 하시겠습니까?'))
      .setBefore(beforeCancel)
      .setQuery(cancelData)
      .setAfter(afterCancelData)
      .run()
  }
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAB0010_SEARCH_07', param: searchParams })
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
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.DISEASE_CNT)){
      return Message.warn(t('신규 직업병 유소견자 발생건을 입력하십시오.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
 
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.ADJUST_USER = userStore.userName
    data.SEQ = searchParams.SEQ
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTAB0010_SAVE_04', list: saveParams })
}

const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  getData()
}

const beforeConfirm = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }
  return true
}

const confirmData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.ADJUST_YN = 'Y'
    data.ADJUST_USER = userStore.userName
    data.SEQ = searchParams.SEQ
    saveParams.push(data)
  }
  return Promise.all([
    commonExecuteApi({ queryId : 'HLTAB0010_SAVE_04', list: saveParams }),
    commonExecuteApi({ queryId : 'HLTAB0010_SAVE_05', list: saveParams })
  ])
}

const afterConfirmData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  // menuTitle.value.disableBtn('btnConfirm', true)
  // menuTitle.value.disableBtn('btnCancelConfirm', false)
  // searchParams.ADJUST_YN = 'N'
  getData()
}

const beforeCancel = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }
  return true
}

const cancelData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.ADJUST_YN = 'N'
    data.ADJUST_USER = userStore.userName
    data.SEQ = searchParams.SEQ
    saveParams.push(data)
  }
  return Promise.all([
    commonExecuteApi({ queryId : 'HLTAB0010_SAVE_04', list: saveParams }),
    commonExecuteApi({ queryId : 'HLTAB0010_SAVE_05', list: saveParams })
  ])
}

const afterCancelData = () => {
  Message.success(t('성공적으로 취소되었습니다'))
  // menuTitle.value.disableBtn('btnConfirm', false)
  // menuTitle.value.disableBtn('btnCancelConfirm', true)
  // serachParams.ADJUST_YN = 'Y'
  getData()
}

const onEditCommit = (grid, index, oldValue, newValue) => {
  if(index.fieldName == 'DISEASE_CNT') {
    if(newValue >= 3) {
      grid.setValue(index.itemIndex, 'RESULT', '+2단계')
    } else if (newValue >= 1) {
      grid.setValue(index.itemIndex, 'RESULT', '+1단계')
    } else {
      grid.setValue(index.itemIndex, 'RESULT', '단계 유지')
    }
  }
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
    width="1300"
    height="500"
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
      <span>보건 위험성 보정 [화학물질/소음 노출]</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="$t('세부 보정 - 직업병 유소견자 주 작업 공정 선택')"
          :button-list="['btnConfirm', 'btnCancelConfirm', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 320px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onEditCommit="onEditCommit"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>
