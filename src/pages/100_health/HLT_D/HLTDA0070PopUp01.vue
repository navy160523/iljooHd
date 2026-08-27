<!--
  화면명 : 신규 자재 사전 유해성 확인 (자제 검토 내역 확인) 팝업
  화면개요 : 신규 자재 사전 유해성 확인 (자제 검토 내역 확인) 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi, getCompanyList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from "dayjs";
import EmpPopup from '@/components/popup/EmpPopup.vue'

const emit = defineEmits(['selectCas'])
const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const empPopup = ref(null)
const grdMain = ref(null)

const openPopup = (parm) => {
  grdMain.value.getGridView().filterPanel.visible = true
  // onButtonsClick({ id: 'btnSearch' })
  dialog.value = true

  Promise.all([
  getCompanyList(), // 회사구분
  commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, USE_DIV:'Y' } }), // 부서
  ]).then((res) => {
    codeList.cmpnyDiv = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    codeList.deptCd = res[2].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
  })
}

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  MATDSC: '',
  USER_ID : userStore.userId,
  EMP_NO: '',
  SDATE: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  EDATE: dayjs().format("YYYY-MM-DD"),
})

const codeList = reactive({
  cmpnyDiv: [], // 회사구분
  bsnsCd: [], //사업부
  deptCd : [],  //부서
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
  fields: [
    { fieldName: 'FILE_NM', width: '80', dataType: 'text', header: { text: t('제품명') }, },
    { fieldName: 'ASGN_NM', width: '50', dataType: 'text', header: { text: t('확인 부서') }, },
    { fieldName: 'USER_NM', width: '50', dataType: 'text', header: { text: t('확인 자') }, },
    { fieldName: 'CONTENT_DT', width: '40', dataType: 'text', header: { text: t('발생 일자') }, },
    { fieldName: 'CHACK_DATA', width: '40', dataType: 'text', header: { text: t('확인 일자') }, },
    { fieldName: 'REMARKS', width: '80', dataType: 'text', header: { text: t('검토 결과') }, },
    { fieldName: 'DELYN', width: '50', dataType: 'text', header: { text: t('삭제 여부') }, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
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
  return commonSearchApi({ queryId: 'HLTDA0070_SEARCH_04', param: searchParams })
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

const openEmpPopup = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: searchParams.EMP_NM,
  })
}

const onEmpSelected = (val) => {
  searchParams.EMP_NM = val.EMP_NM
  searchParams.EMP_NO = val.EMP_NO
}

defineExpose({
  openPopup
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="900"
    height="800"
    class="p-absolute user-select-none"
  >
    <!-- <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    > -->
    <div class="title-bar">
      <span>자체 검토 내역 확인</span>
    </div>
    <!-- </v-sheet> -->
    <!-- <v-card class="pa-0  rounded-b-5"> -->
    <v-card>
      <!-- <v-card-title class="pa-4 pb-0"> -->
      <v-card-title>
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4 pb-2">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-select
              :label="$t('회사구분')"
              labelWidth="52px"
              width="200px"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('사업부')"
              width="200px"
              labelWidth="39px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
            />
            <i-select
              :label="$t('부서')"
              width="200px"
              labelWidth="26px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
            />
            </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.MATDSC"
              width="300px"
              :label="$t('제품명')"
              type="Text"
              margin="30px"
            />
            <i-input 
              :label="$t('성명')"
              labelWidth="26px"
              width="200px"
              v-model="searchParams.EMP_NM"
              append-inner-icon="mdi-magnify" 
              @click:appendInner="openEmpPopup"
              korean
              maxlength="500"
            />
             <i-input 
              width="200px"
              v-model="searchParams.EMP_NO"
              readonly
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.SDATE"
              width="200px"
              :label="$t('발생 일자')"
              type="date"
              margin="10px"
            />
            <i-input
              v-model="searchParams.EDATE"
              width="200px"
              :label="$t('~')"
              type="date"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <IGridTitle
              :title="$t('검토 목록')"
            ></IGridTitle>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 400px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
              />
            </v-sheet>
          </div>
          <EmpPopup ref="empPopup" @selected="onEmpSelected" />
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
