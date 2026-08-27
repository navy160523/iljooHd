<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IButtonList from '@/components/IButtonList.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'

let dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const emit = defineEmits(['upData'])

const menuTitle = ref(null)
const grdMain = ref(null)
const isReadonly = ref(null)
const empPopup = ref(null)

const searchParams = reactive({
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS: '',
  CHG_NO: '',
  KEY: '',
})
const codeList = reactive({})

const initCodeList = () => {}


const onButtonsClick = async (btn) => {
  if (btn.id === 'btnPersonCreate') {
    empPopup.value.openPopup({
      USER_DIV: 'A'
    })
  } else if (btn.id === 'btnPersonUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnPersonDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('해당 검토자를 삭제 하시겠습니까?')
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const onEmpSelected = async (val) => {
  console.log('empPopup Val',val)

  let rows = grdMain.value.getDataProvider().getJsonRows();

  let isDuplicated = rows.some(row => row.EMP_NO === val.EMP_NO.trim());
  
  console.log(isDuplicated);
  if (isDuplicated) {
    return Message.warn(t('이미 등록된 사번입니다.'));
  }

  const newRow = {
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    PROCESS: searchParams.PROCESS,
    CHG_NO: searchParams.CHG_NO,
    KEY: searchParams.KEY,
    EMP_NM: val.EMP_NM,
    EMP_NO: val.EMP_NO,
    EMAIL: val.EMAIL,
    REVIEW_DESC: val.EMP_NM +':' ,
    SAVE_YN: 'N'
  };

  const gridView = grdMain.value.getGridView();
  const dataProvider = grdMain.value.getDataProvider();

  const newIndex = dataProvider.addRow(newRow);

  gridView.commit(true); // 확정
  gridView.setCheckable(0, true);  // 첫 번째 컬럼
  gridView.checkRows([newIndex], true);  // 새로운행 체크
  gridView.setCurrent({ dataRow: newIndex });
}

const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : ['EMP_NO'],
  fields : [ 
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false, visible: true, width: '100'},
    { fieldName: 'EMAIL', dataType: 'text', header: { text: t('메일') }, editable: true, visible: true, width: '250' },

    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('인원코드') },visible: false, },
    { fieldName: 'PROCESS', dataType: 'text', header: { text: t('공정설비') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') },visible: false, },
    { fieldName: 'CHG_NO', dataType: 'text', header: { text: t('접수번호') },visible: false, },
    { fieldName: 'KEY', dataType: 'text', header: { text: t('항목') },visible: false, },
    { fieldName: 'REVIEW_DESC', dataType: 'text', header: { text: t('검토내용') },visible: false, },
    { fieldName: 'REVIEW_RESULT', dataType: 'text', header: { text: t('검토결과') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

// 조회
const searchData = () => {
  console.log(searchParams)
  return commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_04', param: searchParams })
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  console.log("saveParams",saveParams)
  return commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_04', list: saveParams })
    .then(res => { 
      console.log(res)
    })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
  closePopup()
}

const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    // if(data.SAVE_YN != 'Y') {
    //   continue
    // }
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'SPPFB0010_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
  initCodeList()
}

// 팝업
const openPopup = (popupParam) => {
  console.log("popupParam", popupParam)
  dialog.value = true
  grdMain.value.getGridView().filterPanel.visible = true

  searchParams.BSNS_CD = popupParam.BSNS_CD
  searchParams.DEPT_CD = popupParam.DEPT_CD
  searchParams.PROCESS = popupParam.PROCESS
  searchParams.CHG_NO = popupParam.CHG_NO
  searchParams.KEY = popupParam.KEY

  initCodeList()
  getData()
}

const closePopup = () => {
  emit('upData')
  dialog.value = false
}

defineExpose({
  openPopup
})

</script>
<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="500"
  >
    <div class="title-bar" @mousedown="startDragging">검토자 검색</div>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnPersonCreate', 'btnPersonUpdate', 'btnPersonDelete', 'btnClose']"
          @click-button="onButtonsClick"
          :use-permission="false"
          :hiddenManuel="true"
        />
      </v-card-title>

      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet height="100%">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grd1Props.gridViewOption"
              :keys="grd1Props.keys"
              :fields="grd1Props.fields"
              :columns="grd1Props.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (405px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    // min-height: 700px;
  }
}
</style>