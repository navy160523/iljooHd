<!--
  화면명 : 특수검진 유해인자 기타추가
  화면개요 : 특수검진 유해인자 기타추가
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
const saveYn = ref(false)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
})
const dataList = ref([])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'GUBUN', width: '60', dataType: 'text', header: { text: t('구분자') }, },
    { fieldName: 'CASNO', width: '60', dataType: 'text', header: { text: t('CASNO') }, },
    { fieldName: 'EXAM_FACTOR', width: '80', dataType: 'text', styleName: 'left-column', header: { text: t('검진 유해인자') } },
    { fieldName: 'CASNM_KOR', width: '80', dataType: 'text', styleName: 'left-column', header: { text: t('한글명') }, },
    { fieldName: 'CASNM_ENG', width: '80', dataType: 'text', styleName: 'left-column', header: { text: t('영문명') }, },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'PRC_MAT_CD', dataType: 'text', header: { text: t('공정 또는 MAT번호') }, visible: false }, // 기타 삭제시에는 뭉치는게 아니라 따로 떨어뜨리기 위함 
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  grdMain.value.getGridView().filterPanel.visible = true
  dataList.value = param
  onButtonsClick({id: 'btnSearch'})
  saveYn.value = false
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
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
  return commonSearchApi({ queryId: 'HLTGA0050_SEARCH_05', param: searchParams })
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

  return true
}

const saveData = () => {
  let chk = []
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    chk.push(data)
  }
  saveParams = chk.flatMap(chk1 =>
    dataList.value.map(chk2 => ({
      ...chk1,
      ...chk2
    }))
  )

  return commonExecuteApi({ queryId : 'HLTGA0050_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  saveYn.value = true
  Message.success(t('성공적으로 저장되었습니다'))
}

/* ********** 닫기 ********** */
const closePopup = () => { 
  grdMain.value.getDataProvider().setRows([])
  if(saveYn.value) {
    emit('after-search')
  }
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
      <span>유해인자 기타추가</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="$t('유해인자 기타목록')"
          :button-list="['btnCreate', 'btnClose']"
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
