<!--
  화면명 : 조직별 담당자 리스트
  화면개요 : 조직별 담당자 리스트(최종제출 수신, 참조자 선택 위함)
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

const emit = defineEmits(['after-search', 'selected'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const grdMain = ref(null)
const menuTitle = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  BSNS_CD: '',
  DEPT_CD: '',
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: []
})

//그리드 속성셋팅 
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }, },
  keys : [], 
  fields : [
    { fieldName: 'KOR_NM', width: '60', dataType: 'text', header: { text: t('성명') }},
    { fieldName: 'BSNS_CD', width: '60', dataType: 'text', header: { text: t('사업부') }, lookupDisplay: true },
    { fieldName: 'DEPT_CD', width: '60', dataType: 'text', header: { text: t('부서') }, lookupDisplay: true},
    { fieldName: 'JOB_TIT_NM', width: '60', dataType: 'text', header: { text: t('직위') }},
    { fieldName: 'OFFI_RES_NM', width: '60', dataType: 'text', header: { text: t('직책') }},
    { fieldName: 'EMAIL', width: '120', dataType: 'text', styleName:'left-column', header: { text: t('이메일') }},
    
    // 안보이는거
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') },visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

// 팝업 OPEN
const openPopup = (param) => {
  
  Promise.all([
    // 사업부
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV } }), 
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR

    grdMain.value.setBindingColumn('BSNS_CD', codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.DEPT_CD, 'DEPT_CD', 'DEPT_NM')
  })
  grdMain.value.getGridView().filterPanel.visible = true
  getData()
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSelect') {
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    let paramList = []

    for(let chk of checkRow) {
      paramList.push(grdMain.value.getDataProvider().getJsonRow(chk))
    }
    emit('selected', paramList)
    closePopup()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

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
  return commonSearchApi({ queryId: 'HLTJB0010_SEARCH_04', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
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
    width="800"
    height="700"
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
      <span>수신, 참조자 선택</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="t('담당자 목록')"
          :use-permission="false"
          :button-list="['btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="mb-2"> 
        <v-card-text class="content-area" style="height:550px;">
          <v-sheet class="searchArea flex-column">
            <RealGrid 
              ref="grdMain"
              style="height: 500px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
::v-deep(.setWhiteColor > .v-input__control > .v-field) {
  background-color: #ffffff !important;
}
</style>
 
