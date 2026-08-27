<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)

const grd1 = ref(null)    // 중점항목
const grd2 = ref(null)    // 세부내용
const grd3 = ref(null)    // 세부계획


let options = reactive({
  disabled : {
    CMPNY_DIV : false,   // 회사구분
    ORGN_DIV : false,   // 직영, 사내협력사
  },
  values : {
    YEAR: 0,
    CMPNY_DIV : '',
    BSNS_CD : '',
    DEPT_CD : '',
    ASGN_CD : '',
    HSE_DIV : '1',
    GOAL_TITLE: '',
  },
})

const codeList = reactive({
  cycle: [],
})

//코드리스트 셋팅
const initCodeList = () => {

  Promise.all([
    getCodeList('HHIAF40'),
  ]).then(res => {
    codeList.cycle = res[0].ORESULT_CUR    
    grd3.value.setBindingColumn("PLAN_CYCLE", codeList.cycle, "COD", "TXT")
  })
}

// onMounted(() => {
//   initCodeList()
// })

const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, header: { height: 60 }, rowIndicator: { visible: false } },
  keys : ['AHEAD_ITEM'],
  field : [
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false, header: { text: t('회사') } },
    { fieldName: 'YEAR', dataType: 'text', visible: false, header: { text: t('년도') } },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false, header: { text: t('사업부') } },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false, header: { text: t('부서') } },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false, header: { text: t('조직') } },
    { fieldName: 'HSE_DIV', dataType: 'text', visible: false, header: { text: t('구분') } },
    { fieldName: 'AHEAD_NO', dataType: 'text', visible: false, header: { text: t('중점항목순번') } },
    { fieldName: 'AHEAD_ORD', dataType: 'text', width: '20', header: { text: t('No.') } },
    { fieldName: 'AHEAD_ITEM', dataType: 'text', header: { text: t('중점항목') }, styleName: "left-column" },
  ],
  columns : [],
  columnLayout: [],
})

const grd2Props = reactive({
  gridViewOption : { checkBar: { visible: true }, header: { height: 60 }, rowIndicator: { visible: false } },
  keys : ['DETAIL_ITEM'],
  field : [
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false, header: { text: t('회사') } },
    { fieldName: 'YEAR', dataType: 'text', visible: false, header: { text: t('년도') } },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false, header: { text: t('사업부') } },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false, header: { text: t('부서') } },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false, header: { text: t('조직') } },
    { fieldName: 'HSE_DIV', dataType: 'text', visible: false, header: { text: t('구분') } },
    { fieldName: 'AHEAD_NO', dataType: 'text', visible: false, header: { text: t('중점항목순번') } },
    { fieldName: 'DETAIL_NO', dataType: 'text', visible: false, header: { text: t('세부내용순번') } },
    { fieldName: 'DETAIL_ORD', dataType: 'text', width: '20', header: { text: t('No.') } },
    { fieldName: 'DETAIL_ITEM', dataType: 'text', header: { text: t('세부내용') }, styleName: "left-column" },
  ],
  columns : [],
  columnLayout: [],
})

const grd3Props = reactive({
  gridViewOption : { checkBar: { visible: true }, header: { height: 60 }, rowIndicator: { visible: false } },
  keys : ['PLAN_NO'],
  field : [
    { fieldName: 'PLAN_NO', dataType: 'text', visible: false, header: { text: t('실행방안순번') } },
    { fieldName: 'PLAN_ITEM', dataType: 'text', header: { text: t('실행방안') }, styleName: "left-column" },
    { fieldName: 'PLAN_CYCLE', dataType: 'text', width: '45', lookupDisplay: true, header: { text: t('주기') } },
    { fieldName: 'PLAN_CYCLE_DESC', dataType: 'text', width: '45', header: { text: t('별도기준') } },
    { fieldName: 'RESULT_MEASUREMENT', dataType: 'text', width: '80', header: { text: t('성과측정기준') } },
    { fieldName: 'PLAN_DOCU', dataType: 'text', width: '45', header: { text: t('기록관리') } },
    { fieldName: 'PERSON_NAME', dataType: 'text', width: '45', header: { text: t('담당자') } },
  ],
  columns : [],
  columnLayout: [
    'PLAN_ITEM',
    {
      name: '관리기준',
      direction: 'horizontal',
      header: {
        text: t('관리 기준'),
      },
      items: [
        'PLAN_CYCLE',
        'PLAN_CYCLE_DESC',
      ],
    },
    'RESULT_MEASUREMENT',
    'PLAN_DOCU',
    'PERSON_NAME',
  ],
})

grd1Props.columns = grd1Props.field
grd2Props.columns = grd2Props.field
grd3Props.columns = grd3Props.field

const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    
    new saveFlowHelper(vm, t)
      .setGridList([grd1])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()      
  }
  else if (btn.id === 'btnClose')
  {
    onClose()
  }
}

const onGrd1ButtonsClick = btn => {
  if (btn.id === 'btnCreate') {
    addData(grd1)
  }
  else if (btn.id === 'btnUpdate')
  {
  }
  else if (btn.id === 'btnDelete')
  {
  }
}


const onGrd2ButtonsClick = btn => {
  if (btn.id === 'btnCreate') {
    addData(grd2)
  }
  else if (btn.id === 'btnUpdate')
  {
  }
  else if (btn.id === 'btnDelete')
  {
  }
}
const onGrd3ButtonsClick = btn => {
  if (btn.id === 'btnCreate') {
    addData(grd3)
  }
  else if (btn.id === 'btnUpdate')
  {
  }
  else if (btn.id === 'btnDelete')
  {
  }
}


const addData = grid => {

  if (grid === grd1){
    grd1.value.addRow({
      CMPNY_DIV: options.values.CMPNY_DIV,
      YEAR: options.values.YEAR,
      BSNS_CD: options.values.BSNS_CD,
      DEPT_CD: options.values.DEPT_CD,
      ASGN_CD: options.values.ASGN_CD,
      HSE_DIV: options.values.CMPNY_DIV,
      AHEAD_ORD: grd1.value.getDataProvider().getRowCount() + 1,
    })

  } else if (grid === grd2){

    let curr = grd1.value.getGridView().getCurrent()
    if (curr.dataRow < 0 || !grd1.value.getDataProvider().getValue(curr.dataRow, 'AHEAD_NO')) {
      Message.warn(t('중점항목이 저장되지 않았습니다.'))
      return
    }

    let row = grd1.value.getDataProvider().getJsonRow(curr.dataRow)
    row.DETAIL_ORD = grd2.value.getDataProvider().getRowCount() + 1,

    grd2.value.addRow(row)

  } else if (grid === grd3) {

    let curr = grd2.value.getGridView().getCurrent()
    if (curr.dataRow < 0 || !grd2.value.getDataProvider().getValue(curr.dataRow, 'AHEAD_NO')) {
      Message.warn(t('세부계획이 저장되지 않았습니다.'))
      return
    }

    let row = grd2.value.getDataProvider().getJsonRow(curr.dataRow)
    row.DETAIL_ORD = grd3.value.getDataProvider().getRowCount() + 1,

    grd3.value.addRow(row)

  }
}


const openPopup = val => {
  options.values = val
  dialog.value = true
  
  new queryFlowHelper(vm, t)
    .setUseDefaultBefore(false)
    .setQuery(searchData01)
    .setAfter(afterSearch01)
    .showMessage(false)
    .run()
}

const onHseDivValueChanged = () => {
  
  new queryFlowHelper(vm, t)
    .setUseDefaultBefore(false)
    .setQuery(searchData01)
    .setAfter(afterSearch01)
    .showMessage(false)
    .run()
}

const onGrd1CurrRowChanged = (grid, oldIdx, newIdx) => {
  
  new queryFlowHelper(vm, t)
    .setUseDefaultBefore(false)
    .setGridList([grd2])
    .setQuery(searchData03, newIdx)
    .setAfter(afterSearch03)
    .showMessage(false)
    .run()
}


const onGrd2CurrRowChanged = (grid, oldIdx, newIdx) => {
  
  new queryFlowHelper(vm, t)
    .setUseDefaultBefore(false)
    .setGridList([grd3])
    .setQuery(searchData04, newIdx)
    .setAfter(afterSearch04)
    .showMessage(false)
    .run()
}

const searchData01 = () => {
  return commonSearchApi({ queryId : 'MNGAA0020_SEARCH_POPUP_01', param: options.values })
}

const searchData02 = () => {
  return commonSearchApi({ queryId : 'MNGAA0020_SEARCH_POPUP_02', param: options.values })
}

const searchData03 = idx => {

  // 데이터가 null 일경우 빈 Promise 반환
  if (idx < 0) {
    return new Promise((resolve, reject) => resolve(null))
  }

  let row = grd1.value.getDataProvider().getJsonRow(idx)

  return commonSearchApi({ queryId : 'MNGAA0020_SEARCH_POPUP_03', param: row })
}

const searchData04 = idx => {

  // 데이터가 null 일경우 빈 Promise 반환
  if (idx < 0) {
    return new Promise((resolve, reject) => resolve(null))
  }

  let row = grd2.value.getDataProvider().getJsonRow(idx)

  return commonSearchApi({ queryId : 'MNGAA0020_SEARCH_POPUP_04', param: row })

}

const afterSearch01 = res => {

  if (res.length > 0) {
    options.values.GOAL_TITLE = res[0].ORESULT_CUR['GOAL_TITLE']
    
    new queryFlowHelper(vm, t)
      .setUseDefaultBefore(false)
      .setGridList([grd1])
      .setQuery(searchData02)
      .setAfter(afterSearch02)
      .run()
  }
}

const afterSearch02 = res => {

  grd1.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const afterSearch03 = res => {

  grd2.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const afterSearch04 = res => {

  grd3.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const saveData01 = () => {
  
}


const onClose = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    eager
    width="1700"
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      HSE목표 및 중점 추진사항 작성/수정
    </div>
    <VContainer style="background-color: white; padding: 30px; padding-top: 10px;">
      <VRow>
        <VCol>
          <IGridTitle
            :title="$t('목표작성')"
            :use-permission="false"
            :button-list="['btnUpdate', 'btnClose']"
            @click-button="onButtonsClick"
          >
            <template #editors >
              <ILabel
                :label="$t('구분 :')"
                label-width="60"
              >
                <template #editor="editorProps">
                  <VRadioGroup  
                    v-model="options.values.HSE_DIV"
                    inline
                    @update:modelValue="onHseDivValueChanged"
                  >
                    <VRadio :label="$t('안전')" value="1" />
                    <VRadio :label="$t('보건')" value="2" />
                    <VRadio :label="$t('환경')" value="3" />
                  </VRadioGroup>
                </template>      
              </ILabel>
            </template>
          </IGridTitle>
        </VCol>
      </VRow>
      <VRow>
        <VCol align-self="center" align="center">
          
          <VTextarea
            label="목표"
            v-model="options.values.GOAL_TITLE"
          />
        </VCol>
      </VRow>
      <VRow>
        <VCol>
          <IGridTitle
            :title="$t('중점 항목')"
            :use-permission="false"
            :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
            @click-button="onGrd1ButtonsClick"
          />
          <RealGrid
            ref="grd1"
            class="mt-2"
            style="height: 500px;"
            :gridViewOption="grd1Props.gridViewOption" 
            :fields="grd1Props.field" 
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onCurrentRowChanged="onGrd1CurrRowChanged"
          />
        </VCol>
        <VCol>
          <IGridTitle
            :title="$t('세부 계획')"
            :use-permission="false"
            :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
            @click-button="onGrd2ButtonsClick"
          />
          <RealGrid
            ref="grd2"
            class="mt-2"
            style="height: 500px;"
            :gridViewOption="grd2Props.gridViewOption" 
            :fields="grd2Props.field" 
            :columns="grd2Props.columns"
            :column-layout="grd2Props.columnLayout"
            @onCurrentRowChanged="onGrd2CurrRowChanged"
          />
        </VCol>
        <VCol cols="12" md="6">
          <IGridTitle
            :title="$t('실행 방안')"
            :use-permission="false"
            :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
            @click-button="onGrd3ButtonsClick"
          />
          <RealGrid
            ref="grd3"
            class="mt-2"
            style="height: 500px;"
            :gridViewOption="grd3Props.gridViewOption" 
            :fields="grd3Props.field" 
            :columns="grd3Props.columns"
            :column-layout="grd3Props.columnLayout"
          />
        </VCol>
      </VRow>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
