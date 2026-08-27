<!--
  화면명 : 협력사 보건관리 평가 협력사별 재검대상자 및 미실시 인원 현황
  화면개요 : 협력사 보건관리 평가 협력사별 재검대상자 및 미실시 인원 현황
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
// import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grd1Title = ref(null)
const grd2Title = ref(null)
const title = ref('  ')
const grdMain1 = ref(null)
const grdMain2 = ref(null)


const codeList = reactive({
  DEPT_CD: [],
  PROCESS_CD: [],
})
/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  COMP_CD: '',
  COMP_NM: '',
  CAL_DATE: ''
})

//재검대상자 명단 셋팅
const grdMain1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'EMP_NO', width: '80', dataType: 'text', editable: false, header: { text: t('등록번호') } },
    { fieldName: 'EMP_NM', width: '80', dataType: 'text', editable: false, header: { text: t('성명') } },
    { fieldName: 'JBJOB_NM', width: '80', dataType: 'text', editable: false, header: { text: t('직위') } },
    { fieldName: 'JOB_NM', width: '100', dataType: 'text', editable: false, header: { text: t('직군') } },
    { fieldName: 'ROW_COLOR', width: '100', dataType: 'text', editable: false, visible: false },
  ],
  columnLayout: [],
  columns : [],
})

//재검 미실시대상자 명단
const grdMain2Props = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'EMP_NO', width: '80', dataType: 'text', editable: false, header: { text: t('등록번호') } },
    { fieldName: 'EMP_NM', width: '80', dataType: 'text', editable: false, header: { text: t('성명') } },
    { fieldName: 'JBJOB_NM', width: '80', dataType: 'text', editable: false, header: { text: t('직위') } },
    { fieldName: 'JOB_NM', width: '100', dataType: 'text', editable: false, header: { text: t('직군') } },
  ],
  columnLayout: [],
  columns : [],
})



grdMain1Props.columns = grdMain1Props.fields
grdMain2Props.columns = grdMain2Props.fields


const openPopup = (param) => {
  grdMain1.value.getDataProvider().setRows([])
  grdMain2.value.getDataProvider().setRows([])
  

  grdMain1.value.getGridView().filterPanel.visible = true
  grdMain2.value.getGridView().filterPanel.visible = true
  

  // searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.CMPNY_DIV=param.CMPNY_DIV
  searchParams.COMP_CD=param.COMP_CD
  searchParams.COMP_NM=param.COMP_NM
  searchParams.CAL_DATE=param.CAL_DATE.replace(/-/g,"");

  title.value=param.COMP_NM;
  
  getMainData()
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  
  if (btn.id === "btnClose") {
    closePopup()
  } 
}

// 메인 데이터 조회
const getMainData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain1])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .showMessage(true)
    .run()
}

//DB 조회
const searchMainData = () => { 
  return Promise.all([
    //구분
    commonSearchApi({ queryId : 'HLTKD0010_SEARCH_03', param: searchParams }),
    commonSearchApi({ queryId : 'HLTKD0010_SEARCH_04', param: searchParams })
  ])
  
}

//조회 후 반영
const afterMainSearch = res =>{
  // grdMain1.value.getDataProvider().setRows([])
  grdMain1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
  grdMain2.value.getDataProvider().setRows(res[1].ORESULT_CUR)

  
  // 행마다 색깔 바꾸기
  grdMain1.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = { style:{ background: '#FFFFFF' } }
    if(!isEmpty(grid.getValue(item.index, 'ROW_COLOR'))) {
      ret.style = { background: grid.getValue(item.index, 'ROW_COLOR') }
    }
    return ret
  })
}


/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  
  dialog.value = false
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
    width="1500"
    height="905"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
    <!-- <span>관리 대상자 추가</span> -->
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="$t(title)"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area" style="height:750px;">
        <div class="h-grow">
          <VRow style="height:710px">
          <VCol cols="12" md="6">
            <IGridTitle
              ref="grd1Title"
              :title="$t('재검대상자')"/>
            <RealGrid 
              ref="grdMain1"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys"
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
              :column-layout="grdMain1Props.columnLayout"
              
            />
          </VCol>
          <VCol cols="12" md="6">
            <IGridTitle
              ref="grd2Title"
              :title="$t('재검 미실시자')"/>
            <RealGrid 
              ref="grdMain2"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain2Props.keys"
              :fields="grdMain2Props.fields"
              :columns="grdMain2Props.columns"
              :column-layout="grdMain2Props.columnLayout"
              
            />
          </VCol>
        </VRow>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
