<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'

let dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const emit = defineEmits(['upData'])

const menuTitle = ref(null)
const grdMain = ref(null)
const isReadonly = ref(null)

const popupBsnsCd = ref()
const popupDeptCd = ref()
const popupAsgnCd = ref()
const popupTeamCd = ref()

const searchParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_NM: ''
})
const codeList = reactive({})

const initCodeList = () => {
  console.log(userStore)
  commonSearchApi({
      queryId: "SPPHD0010_COMBO_02",
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV
      },
  }).then(res => {
      console.log(res)
      codeList.bsns = res.ORESULT_CUR
    })
}

const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const grd1Props = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false },
  },
  keys : ['CMPNY_DIV'],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, editable: false, visible: true, },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('과/협력사') }, editable: false, visible: true, },
    { fieldName: 'TEAM_NM', dataType: 'text', header: { text: t('팀') }, editable: false, visible: true, },
    { fieldName: 'CNT', dataType: 'text', header: { text: t('항목수') }, editable: false, visible: true, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') },visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('과/협력사') },visible: false, },
    { fieldName: 'TEAM_CD', dataType: 'text', header: { text: t('팀') },visible: false, },
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
  return commonSearchApi({ queryId: 'SPPHD0010_SEARCH_02', param: searchParams })
}

// 저장 전
const beforeSave = () => {
  let focusedRow = grdMain.value.getGridView().getCurrent().dataRow // 현재 포커스된 행 index
  let data = grdMain.value.getDataProvider().getJsonRow(focusedRow) // 포커스된 행 데이터 가져오기 

  const selectedDeptCd = data.DEPT_CD

  if (selectedDeptCd == popupDeptCd.value) {
    return Message.warn(t('복사 대상 부서와 복사 부서가 같을 수 없습니다.'))
  }
  return true
}

// 저장
const saveData = () => {
  let focusedRow = grdMain.value.getGridView().getCurrent().dataRow // 현재 포커스된 행 index
  let data = grdMain.value.getDataProvider().getJsonRow(focusedRow) // 포커스된 행 데이터 가져오기
  
  let saveParams = [{
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    ASGN_CD: data.ASGN_CD,
    TEAM_CD: data.TEAM_CD,
    BSNS_TO: popupBsnsCd.value,
    DEPT_TO: popupDeptCd.value,
    ASGN_TO: popupAsgnCd.value,
    TEAM_TO: popupTeamCd.value
  }]
  console.log("saveParams",saveParams)
  return commonExecuteApi({ queryId: 'SPPHD0010_SAVE_02', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
  closePopup()
}

// 셀 더블클릭
const onCellDblClicked = () => { 
  new saveFlowHelper(vm, t)
      .setConfirmMessage('선택된 시트정보를 복사하시겠습니까 ?')
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
}

// 팝업
const openPopup = (popupParam) => {
  console.log("popupParam", popupParam)
  dialog.value = true

  // 회사 받기
  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  popupBsnsCd.value = popupParam.BSNS_CD
  popupDeptCd.value = popupParam.DEPT_CD
  popupAsgnCd.value = popupParam.ASGN_CD
  popupTeamCd.value = popupParam.TEAM_CD
  // 사업부 받기
  if (popupParam.BSNS_CD != null || popupParam.BSNS_CD != '') { 
    searchParams.BSNS_CD = popupParam.BSNS_CD
    isReadonly.value = false
  }
  if (searchParams.BSNS_CD == '' || searchParams.BSNS_CD == null) { 
    isReadonly.value = false
  }
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
    width="600"
  >
    <div class="title-bar">부서 검색</div>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnSearch','btnClose']"
          @click-button="onButtonsClick"
          :hiddenManuel="true"
        />
      </v-card-title>

      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
                :label="$t('사업부')"
                labelWidth="40px"
                v-model="searchParams.BSNS_CD"
                :items="codeList.bsns"
                item-value="CODE"
                item-title="DISPLAY_TEXT"
                :readonly="isReadonly"
                width="200px"
              />
            <i-input
              :label="$t('부서명칭')"
              label-width="50px"
              width="200px"
              v-model="searchParams.DEPT_NM"
              class="mr-0"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
          </v-sheet>

          <v-sheet height="100%">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grd1Props.gridViewOption"
              :keys="grd1Props.keys"
              :fields="grd1Props.fields"
              :columns="grd1Props.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
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