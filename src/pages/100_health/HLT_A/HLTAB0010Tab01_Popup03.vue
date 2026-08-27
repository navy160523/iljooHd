<!--
  화면명 : 보건위험성 평가 유소견 명단
  화면개요 : 보건위험성 평가 유소견 명단
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

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  YEAR: '',
  PROCESS_CD: ''
})

const codeList = reactive({
  LANGUAGE: [
    {COD: 'KO', TXT: '한국어'},
    {COD: 'EN', TXT: '영어'},
  ],
  BSNS_CD: [],
  DEPT_CD: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'STD_DUTY_NM', width: '50', dataType: 'text', header: { text: t('직무') }, },
    { fieldName: 'DISEASE_NM', width: '80', dataType: 'text', header: { text: t('질환명') }, },
    { fieldName: 'DIAGNOSIS_CD', width: '40', dataType: 'text', header: { text: t('유소견(D1)') }, },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'GBN_NO', dataType: 'text', header: { text: t('위험구분') }, visible: false },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (params) => {
  
  searchParams.BSNS_CD = params.BSNS_CD
  searchParams.DEPT_CD = params.DEPT_CD
  searchParams.YEAR = params.YEAR
  Promise.all([
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
    // 부서
    // 협력사
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_ASGN', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: '', ORGN_DIV: '', USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'A')
    onButtonsClick({ id: 'btnSearch' })
  })
  dialog.value = true
}

const closePopup = () => {
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnSearch') {
    getData()
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
  return commonSearchApi({ queryId: 'HLTAB0010_SEARCH_04', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
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
    width="900"
    height="650"
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
      <span>직업병유소견자 정보</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-input 
              v-model="searchParams.YEAR"
              :label="$t('기준년도')" 
              label-width="50px" 
              width="200px"
              type="number"
              readonly
            />
            <i-select 
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')" 
              label-width="50px" 
              width="200px" 
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM" 
              readonly
            />
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서')"
              label-width="50px"
              :items="codeList.DEPT_CD"
              :readonly="true"
              item-value="DEPT_CD"
              item-title="ASGN_NM" 
              width="200px"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 350px;"
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
