<!--
  화면명 : MSDS 교육대상 대상제외
  화면개요 : 대상제외
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { isEmpty } from '@/@core/utils'
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(["after-search"])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const deptPopup = ref(null)
const grdMain = ref(null)

const codeList = reactive({
  DEPT_CD: [],
})
/* 조회 조건 */
const searchParams = reactive({
  TRS_DEL_REASON: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true } },
  keys: [],
  fields: [
    { fieldName: 'MATNO', dataType: 'text', width: '80', styleName: 'left-column', header: { text: t('자재번호') }, editable: false },
    { fieldName: 'MATDSC', dataType: 'text', width: '100', header: { text: t('제품명') }, editable: false },
    { fieldName: 'VNDNME', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('납품사') }, editable: false },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('부서') }, editable: false },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'SAUPBU', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('상태') }, visible: false },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사코드') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  grdMain.value.getDataProvider().setRows(param)

  grdMain.value.getGridView().filterPanel.visible = true
  
  for(let i = 0; i <= grdMain.value.getDataProvider().getRowCount(); i++) { 
    grdMain.value.getGridView().checkRow(i, true, false, false)
  }
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnExcept') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setConfirmMessage(t('제외하시겠습니까?'))
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if('B' == data.STATUS) {
      return Message.warn(t('교육완료이므로 대상제외할 수 없습니다.'))
    } else if(isEmpty(data.DEPT_CD)) {
      return Message.warn(t('구분은 필수 입력 사항입니다.'))
    } else if(isEmpty(data.VNDCOD)) {
      return Message.warn(t('납품사는 필수 입력 사항입니다.'))      
    } else if(isEmpty(data.SAUPBU)) {
      return Message.warn(t('사업부코드는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.MATNO)) {
      return Message.warn(t('자재번호는 필수 입력 사항입니다.'))
    }
  }
  return true
}

/* ********** 저장 ********** */
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = {  
      ...grdMain.value.getDataProvider().getJsonRow(rowIdx),
      ...searchParams
    }
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTDA0030_SAVE_04', list: saveParams })}

// 저장 후 작업
const afterSaveData = () => { 
  Message.success(t('성공적으로 제외되었습니다'))
  emit('after-search')
  closePopup()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
  searchParams.TRS_DEL_REASON = ''
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
    height="600"
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
      <span>MSDS 교육대상 대상제외</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnExcept', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4 pt-0">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <i-input
            v-model="searchParams.TRS_DEL_REASON"
            label-width="70px"
            :label="$t('제외사유')"            
            width="300px"
            class="mt-2"
          />
        </v-sheet>
      </div>
      <v-card-text class="pa-4 pt-0 content-area" style="height:200px;">
        <v-sheet class="searchArea flex-column">
          <RealGrid 
            ref="grdMain"
            style="height: 150px;"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
  
</template>

<style scoped lang="scss">
</style>

