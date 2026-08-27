<!-- SPPDB0010 안전검사 수수료정보 -->
<!-- SI2팀 김성근 2024-04-04 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";
import { commonSearchApi, getCodeList, } from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import DeptPopup from "@/components/popup/DeptPopup.vue"
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
  name:'50_safety-support-SPP_A-SPPAB0010',
})

const userStore =  useUserStore()
const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const deptPopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const dialog = ref(false)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  YEAR: dayjs().format('YYYY'),
  PROD_DIV: '',
  HALF: '',
  ORGN_DIV: '',
})

const codeList = reactive({
  BSNS_CD:[],
  DATE_LIST: [],
  PROD_DIV: [
    { COD: '' , TXT: '전체' },
    { COD: 'P' , TXT: '생산' },
    { COD: 'N' , TXT: '비생산' },
    { COD: 'S' , TXT: '지원' },
  ],
  HALF: [
    { COD: '' , TXT: '전체' },
    { COD: '1' , TXT: '상반기' },
    { COD: '2' , TXT: '하반기 '},
  ],
  ORGN_DIV: [
    { COD: '' , TXT: '전체' },
    { COD: 'A' , TXT: '직영' },
    { COD: 'B' , TXT: '협력사'},
  ],
})

const initCodeList = () => {
  Promise.all([
  commonSearchApi({ 
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      }, 
    }),
    getCodeList('HHIK101'),
  ]).then(res => {
    codeList.BSNS_CD = res[0].ORESULT_CUR    
    grdMain.value.setBindingColumn("TRAINING_GBN", res[1].ORESULT_CUR, "COD", "TXT")    
    
    codeList.BSNS_CD.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
  })
  
  let startDate = dayjs(new Date).format('YYYY') - 30
  let endDate = dayjs(new Date).format('YYYY')

  for(let i = endDate; i > startDate; i--){
      codeList.DATE_LIST.push({COD:i.toString() ,TXT: i.toString(),})
  }
 
}
//부서 팝업
const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: "Y",
    BSNS_CD: searchParams.BSNS_CD,
  })
}

const onDeptSelected = (val) => {
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.INJR_DEPT_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_FULL_NM
}

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : {stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, mergeRule: { criteria: "values['BSNS_CD']" }, width: '150', },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('부서') }, mergeRule: { criteria: "values['BSNS_CD'] + values['ASGN_CD']" }, width: '200', },
    { fieldName: 'TRAINING_GBN', dataType: 'text', header: { text: t('훈련종류') }, width: '150', },
    { fieldName: 'PLAN_YN', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('계획여부') },  width: '80', },
    { fieldName: 'TRAINING_YN', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('등록여부') },  width: '80', },
    { fieldName: 'TRAINING_DATES', dataType: 'text', header: { text: t('훈련일자') }, styleName: 'multiline-editor', width: '120',
      editor: { type: 'multiline' }, },

    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드'), }, visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직코드'), }, visible: false, },
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(()=>{
        return commonSearchApi({
          queryId: "MNGBA0010_SEARCH_POPUP09",
          param: searchParams,
        })
      })
      .setAfter(afterSearch)
      .showMessage(true)
      .run();
  }else if(btn.id === 'btnClose'){
    onClose()
  }
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {  
  initCodeList()
  //팝업 오픈
  dialog.value = true 
}

onMounted(() => {
  vm.$nextTick(() => {
    grdMain.value.getGridView().setDisplayOptions({
      fitStyle: 'none',
    })
  })
})

defineExpose({
  openPopup,
})

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1600"
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
      <span>{{'비상조치계획 수립 및 훈련 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('비상조치계획 수립 및 훈련')"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">         
            <i-select
              :label="$t('년도')"
              width="130px"
              v-model="searchParams.YEAR"
              :items="codeList.DATE_LIST"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('사업부')"
              width="200px"
              margin="12px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />
            <i-input
              :label="$t('부서')"
              v-model="searchParams.ASGN_NM"
              width="300px"
              margin="4px"
              readonly
              append-inner-icon="mdi-magnify"
              @keydown.enter=" (e) => { openDeptPopup() } "
              @update:modelValue=" (e) => { searchParams.DEPT_CD = null } "
              @click:appendInner="openDeptPopup()"
            />
            <i-input
              :label="$t('')"
              v-model="searchParams.INJR_DEPT_CD"
              width="80px"
              readonly
            />
            <i-select 
              :label="$t('반기')"
              width="160px"
              :items="codeList.HALF"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.HALF"
            />
            <i-select 
              :label="$t('생산/비생산')"
              width="190px"
              :items="codeList.PROD_DIV"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.PROD_DIV"
            />
            <i-select 
              :label="$t('직영/협력사')"
              width="190px"
              :items="codeList.ORGN_DIV"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.ORGN_DIV"
            />
          </v-sheet>
          <v-sheet class="h-auto">          
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              :column-layout="grdProps1.columnLayout"            
            />
          </v-sheet>
          <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}

::v-deep(.rg-grid) {
  .rg-data-row {
    td:last-child {
      border-right: 1px solid #DFE3EF !important;
    }
  }

  .rg-header-cell:last-child {
    border-right: 1px solid #DFE3EF !important;
  }
}
</style>
