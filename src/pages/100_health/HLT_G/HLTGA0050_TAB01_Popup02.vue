<!--
  화면명 : 특수검진 유해인자 상세보기
  화면개요 : 특수검진 유해인자 상세보기
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

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  YEAR: '',
  HALF_DIV: '',
  DEPT_CD: '',
  JOB_GRP_ID: '',
  DUTY_CD: '',
})

const codeList = reactive({
  GUBUN: [
    {COD: 'A', TXT: '작업환경측정 예비조사'},
    {COD: 'B', TXT: '작업환경측정 결과'},
    {COD: 'C', TXT: '부서 규제물질'},
    {COD: 'D', TXT: '기타'},
  ]
})


const dataList = ref([])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'GUBUN', width: '60', dataType: 'text', styleName: 'left-column', header: { text: t('구분') }, lookupDisplay: true },
    { fieldName: 'FROM_DEPT_NM', width: '60', dataType: 'text', styleName: 'left-column', header: { text: t('부서') } },
    { fieldName: 'PROCESS_NM', width: '60', dataType: 'text', styleName: 'left-column', header: { text: t('취급공정') } },
    { fieldName: 'CASNM_KOR', width: '100', dataType: 'text', styleName: 'left-column multiline-editor', header: { text: t('특검 유해인자') }, },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'PRC_MAT_CD', dataType: 'text', header: { text: t('취급공정') }, visible: false },
    { fieldName: 'FROM_DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.YEAR = param.YEAR
  searchParams.HALF_DIV = param.HALF_DIV
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.JOB_GRP_ID = param.JOB_GRP_ID
  searchParams.DUTY_CD = param.DUTY_CD
  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.setBindingColumn('GUBUN', codeList.GUBUN, 'COD', 'TXT')
  onButtonsClick({id: 'btnSearch'})
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
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
  return commonSearchApi({ queryId: 'HLTGA0050_SEARCH_06', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  // 중복 제거
  for(let i = 0; i < res.ORESULT_CUR.length; i++) {
    let korNm = res.ORESULT_CUR[i].CASNM_KOR
    // null 이면 다음으로
    if(isEmpty(korNm)) {
      continue
    }
    const uniqueItems = [...new Set(
      korNm.split(',').map(item => item.trim())
    )]
    res.ORESULT_CUR[i].CASNM_KOR = uniqueItems.join(', ')
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.HALF_DIV = searchParams.HALF_DIV
    data.DEPT_CD = searchParams.DEPT_CD
    data.JOB_GRP_ID = searchParams.JOB_GRP_ID
    data.DUTY_CD = searchParams.DUTY_CD
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTGA0050_DELETE_02', list: saveParams })
} 

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
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
    width="1200"
    height="750"
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
      <span>유해인자 상세보기</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="$t('유해인자목록')"
          :button-list="['btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
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
</template>

<style scoped lang="scss">
</style>
