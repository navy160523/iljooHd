<!--
  화면명 : 화학물질 CAS 선택 팝업
  화면개요 : 화학물질 CAS 선택 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['selectCas'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  CASNO: '',
  KOR_NAME:'',
  ENG_NAME:'',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
  keys: [],
  fields: [
    { fieldName: 'CASNO', width: '40', dataType: 'text', header: { text: t('CAS 번호') }, },
    { fieldName: 'CASNM_KOR', width: '50', dataType: 'text', header: { text: t('물질명(국문)') }, },
    { fieldName: 'CASNM_ENG', width: '80', dataType: 'text', header: { text: t('물질명(영문)') }, },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (parm) => {
  // console.log(parm)
  searchParams.CASNO = parm.CASNO
  grdMain.value.getGridView().filterPanel.visible = true
  
  // onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnSelect') {
    let data = grdMain.value.getGridView().getSelectionData()[0]
    emit('selectCas', data)
    closePopup()
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
  return commonSearchApi({ queryId: 'HLTDA0010_CAS_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ********** 닫기 ********** */
const closePopup = () => {
  searchParams.CASNO = ''
  searchParams.KOR_NAME =''
  searchParams.ENG_NAME =''
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getGridView().getSelectionData()[0]
  emit('selectCas', data)
  closePopup()
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
    width="700"
    height="890"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>화학 물질 조회</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-0">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4 pb-2">
        <v-sheet class="searchArea d-flex flex-column">
          <div class="d-flex">
            <i-input
              v-model="searchParams.CASNO"
              :label="$t('CAS 번호')"
              label-width="70px" 
              width="270px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.KOR_NAME"
              :label="$t('물질명(국문)')"
              label-width="100px" 
              width="350px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.ENG_NAME"
              :label="$t('물질명(영문)')"
              label-width="100px" 
              width="350px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <IGridTitle
              :title="$t('CAS 목록')"
            ></IGridTitle>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 519px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellDblClicked="onCellDblClicked"
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
