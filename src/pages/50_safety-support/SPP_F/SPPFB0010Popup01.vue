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
  PRT_SEQ: '',
})
const codeList = reactive({})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      //부서조회
      queryId: 'SPPHD0010_COMBO_03',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: '',
      },
    }),
  ]).then((res) => {
    codeList.bsnscd = res[0].ORESULT_CUR
    codeList.deptcd = res[1].ORESULT_CUR

    grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnscd, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.deptcd, 'CODE', 'DISPLAY_TEXT')
  })
}


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
      .setConfirmMessage('해당 담당자를 삭제 하시겠습니까?')
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
  const newRow = {
    BSNS_CD: val.BSNS_CD,
    DEPT_CD: val.DEPT_CD,
    JOB_TIT_CD: val.JOB_TIT_CD,
    JOB_TIT_NM: val.JOB_TIT_NM,
    KOR_NM: val.EMP_NM,
    EMP_NO: val.EMP_NO,
    TEL_NO: val.TEL_NO,
    HND_PHN: val.HND_PHN,
    PROCESS: searchParams.PROCESS,
    IDX_SEQ: searchParams.PRT_SEQ
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
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, editable: false, visible: true, lookupDisplay: true},
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, editable: false, visible: true, lookupDisplay: true},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직책') }, editable: false, visible: true, },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, editable: false, visible: true, },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('내선번호') }, editable: false, visible: true, },
    { fieldName: 'HND_PHN', dataType: 'text', header: { text: t('휴대전화번호') }, editable: false, visible: true, },

    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('인원코드') },visible: false, },
    { fieldName: 'PROCESS', dataType: 'text', header: { text: t('공정설비') },visible: false, },
    { fieldName: 'PRT_SEQ', dataType: 'text', header: { text: t('시퀀스') },visible: false, },
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
  return commonSearchApi({ queryId: 'SPPFB0010_SEARCH_02', param: searchParams })
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }
  console.log(checkedRows)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    // if (data.EMP_NO) {
    //   return Message.warn(t('구분은 필수 입력입니다.'))
    // } 
  }
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.IDX_SEQ = searchParams.PRT_SEQ
    saveParams.push(data)
  }
  console.log("saveParams",saveParams)
  return commonExecuteApi({ queryId: 'SPPFB0010_SAVE_02', list: saveParams })
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
  searchParams.PRT_SEQ = popupParam.PRT_SEQ

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
    width="800"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">담당자 검색</div>
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