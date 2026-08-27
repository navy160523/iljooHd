<!-- SAFGA0020 나의 안전다짐 실천서약 -->
<!-- 
  화면명 : 나의 안전다짐 실천서약
  화면개요 : 나의 안전다짐 실천서약 조회, 추가, 삭제, 출력 하는화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import OZReport from '@/components/OZReport.vue'
import SAFGA0020Popup from '@/pages/30_safety/SAF_G/SAFGA0020Popup.vue'

defineOptions({
  name:'30_safety-SAF_G-SAFGA0020',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const grdMain2 = ref(null)
const sAFGA0020Popup = ref(null)
const saveParams = ref([])

// OzReport 팝업 여부
const showOz = ref(false)
const params = ref([])
const reportName = ref('/manage/hse/SAFGA0020.ozr')

const searchParams = reactive({
  YEAR: dayjs(new Date).format('YYYY'),
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: '',
  ORGN_DIV: '',
  SEQ: '',
  EMPNO: '',
  CHECK: 'N',
  OATH_DIV:'Z',
})

const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
  asgnCd: [],
  orgnDiv: [
    { name: '전체', code: '' },
    { name: '직영', code: 'A' },
    { name: '사내협력사', code: 'B' },
  ],
  oathDiv: [
    {name:'나의 안전다짐 (나와 내 동료를 챙기기 위한 다짐)', code:'Z'},
    {name:'나의 안전다짐 실천서약', code:'A'}
  ],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false } },
  keys : ['COL01'],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column' },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, styleName: 'left-column' },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사명') }, styleName: 'left-column' },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, width: '50', },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, width: '50', styleName: 'left-column' },
    { fieldName: 'TYPE_NM', dataType: 'text', header: { text: t('서약서종류') }, width: '80', styleName: 'left-column' },
    { fieldName: 'DESC1', dataType: 'text', header: { text: t('내용1') }, styleName: 'data_wrap left-column' },
    { fieldName: 'DESC2', dataType: 'text', header: { text: t('내용2') }, styleName: 'data_wrap left-column' },
    { fieldName: 'DESC3', dataType: 'text', header: { text: t('내용3') }, styleName: 'data_wrap left-column'},
    { fieldName: 'INSERT_DATE_GRID', dataType: "text", 
      header: { text: t('등록일시') }, styleName: 'data_wrap'},
    { fieldName: 'UPDATE_DATE_GRID', dataType: "text", 
      header: { text: t('수정일시') }, styleName: 'data_wrap'},

    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'SEQ', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
  ],
  columns : [],
})
grdMainProps.columns = grdMainProps.fields

const grdMainProps2 = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false } },
  keys : ['COL01'],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName: 'left-column' },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, styleName: 'left-column' },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사명') }, styleName: 'left-column' },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, width: '50', },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, width: '50', styleName: 'left-column' },    
    { fieldName: 'DESC1', dataType: 'text', header: { text: t('나의 안전이 중요한 이유') }, styleName: 'data_wrap left-column' },
    { fieldName: 'DESC2', dataType: 'text', header: { text: t('1') }, styleName: 'data_wrap left-column' },
    { fieldName: 'DESC3', dataType: 'text', header: { text: t('2') }, styleName: 'data_wrap left-column'},
    { fieldName: 'DESC4', dataType: 'text', header: { text: t('3') }, styleName: 'data_wrap left-column'},
    { fieldName: 'DESC5', dataType: 'text', header: { text: t('4') }, styleName: 'data_wrap left-column'},
    { fieldName: 'DESC6', dataType: 'text', header: { text: t('5') }, styleName: 'data_wrap left-column'},
    { fieldName: 'DESC7', dataType: 'text', header: { text: t('1') }, styleName: 'data_wrap left-column'},
    { fieldName: 'DESC8', dataType: 'text', header: { text: t('2') }, styleName: 'data_wrap left-column'},
    { fieldName: 'DESC9', dataType: 'text', header: { text: t('3') }, styleName: 'data_wrap left-column'},
    { fieldName: 'DESC10', dataType: 'text', header: { text: t('4') }, styleName: 'data_wrap left-column'},
    { fieldName: 'DESC11', dataType: 'text', header: { text: t('5') }, styleName: 'data_wrap left-column'},
    { fieldName: 'INSERT_DATE_GRID', dataType: "text", 
      header: { text: t('등록일시') }, styleName: 'data_wrap'},
    { fieldName: 'UPDATE_DATE_GRID', dataType: "text", 
      header: { text: t('수정일시') }, styleName: 'data_wrap'},

    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'SEQ', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM',
    'DEPT_NM',
    'ASGN_NM',
    'EMP_NO',
    'KOR_NM',
    'DESC1',
    {
      name: '하겠습니다',
      direction: 'horizontal',
      items: ['DESC2', 'DESC3', 'DESC4', 'DESC5', 'DESC6'],
      header: {
        text: t('하겠습니다'),
      },
    },
    {
      name: '하지 않겠습니다',
      direction: 'horizontal',
      items: ['DESC7', 'DESC8', 'DESC9', 'DESC10', 'DESC11'],
      header: {
        text: t('하지 않겠습니다'),
      },
    },
    'INSERT_DATE_GRID',
    'UPDATE_DATE_GRID',
   ],
})
grdMainProps2.columns = grdMainProps2.fields

const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){    
    if(searchParams.OATH_DIV === 'Z'){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain2])
        .setQuery(searchData) 
        .setAfter(afterSearch)
        .run()  
    }else{
      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchData) 
        .setAfter(afterSearch)
        .run()
    }    
  }else if (btn.id === 'btnDelete') {
    if(searchParams.OATH_DIV === 'Z'){
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid:grdMain2, row: null }])
        .setGridList([grdMain2])
        .setBefore(beforedelete)
        .setQuery(deleteData)
        .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
        .run()
    }else{
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid:grdMain, row: null }])
        .setGridList([grdMain])
        .setBefore(beforedelete)
        .setQuery(deleteData)
        .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
        .run()
    }
  }else if(btn.id === 'btnCreate'){
    sAFGA0020Popup.value.openPopup()
  }else {
    printSet()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'SAFGA0020_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  if(searchParams.OATH_DIV === 'Z'){
    grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)
  } else{
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  }
}

const beforedelete = async () => {
  let result = false
  saveParams.value = []

  if(searchParams.OATH_DIV === 'Z'){
    let chekedRow = await grdMain2.value.getGridView().getCheckedRows()

    if(chekedRow.length === 0){
      Message.warn(t('선택한 데이터가 없습니다.'))
      return 
    }else {
      await chekedRow.forEach(async e => {        
        let data = await grdMain2.value.getDataProvider().getJsonRow(e)        
        saveParams.value.push(data)
        result = true
      })
    }    
  }else{
    let chekedRow = await grdMain.value.getGridView().getCheckedRows()

    if(chekedRow.length === 0){
      Message.warn(t('선택한 데이터가 없습니다.'))
      return 
    }else {
      await chekedRow.forEach(async e => {        
        let data = await grdMain.value.getDataProvider().getJsonRow(e)        
        saveParams.value.push(data)
        result = true
      })
    }    
  }
  
  return result
}

const deleteData = () => {
  return commonExecuteApi({ queryId : 'SAFGA0020_DELETE_01', list: saveParams.value })
}

const printSet = async () => {
  searchParams.SEQ = []
  searchParams.EMPNO = []
  if(searchParams.OATH_DIV === 'Z'){
    let chekedRow = await grdMain2.value.getGridView().getCheckedRows()

    if(chekedRow.length === 0){
      Message.warn(t('선택한 데이터가 없습니다.'))
      return 
    } 

    await chekedRow.forEach(async e => {
      let data = await grdMain2.value.getDataProvider().getJsonRow(e)
      searchParams.SEQ += data.SEQ + ','
      searchParams.EMPNO += data.EMP_NO + ','
    })

    reportName.value = '/manage/hse/SAFGA0020_2.ozr'
  }else{
    let chekedRow = await grdMain.value.getGridView().getCheckedRows()

    if(chekedRow.length === 0){
      Message.warn(t('선택한 데이터가 없습니다.'))
      return 
    } 

    await chekedRow.forEach(async e => {
      let data = await grdMain.value.getDataProvider().getJsonRow(e)
      searchParams.SEQ += data.SEQ + ','
      searchParams.EMPNO += data.EMP_NO + ','
    })

    reportName.value = '/manage/hse/SAFGA0020.ozr'
  }  

  let result = await vm.$swal({ 
    title: t('선택한 대상을 출력 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!result.isConfirmed){
    return 
  }

  params.value = []
  params.value = [
    "IN_CMPNY_DIV="+searchParams.CMPNY_DIV,
    "IN_BSNS_CD="+searchParams.BSNS_CD,
    "IN_DEPT_CD="+searchParams.DEPT_CD,
    "IN_ASGN_CD="+searchParams.ASGN_CD,
    "IN_YEAR="+searchParams.YEAR,
    "IN_SEQ="+searchParams.SEQ,
    "IN_EMPNO="+searchParams.EMPNO,
  ]

  showOz.value = true

}

const oathDivChange = () => {
  grdMain.value.getDataProvider().setRows([])
  grdMain2.value.getDataProvider().setRows([])
}

const companyChange = () => {
  Promise.all([
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'N' }}), // 사업부
  ]).then(res => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })

    searchParams.BSNS_CD = ''
  })
  grdMain.value.getDataProvider().setRows([])
}

const bsnsCdChange = () => {
  Promise.all([
  commonSearchApi({ queryId : 'searchDept', param: { CMPNY_DIV: searchParams.CMPNY_DIV, ORGN_DIV: 'A', BSNS_CD: searchParams.BSNS_CD, USE_ONLY: 'Y' } })
  ]).then(res => {
    codeList.deptCd = res[0].ORESULT_CUR
    codeList.deptCd.unshift({ ASGN_SHRT_NM:'전체', DEPT_CD: '' })

    searchParams.DEPT_CD = ''
  })
  grdMain.value.getDataProvider().setRows([])
}

const deptCdChange = () => {
  Promise.all([
  commonSearchApi({ queryId : 'searchVend', param: { CMPNY_DIV: searchParams.CMPNY_DIV, ORGN_DIV: 'A', BSNS_CD: searchParams.BSNS_CD, USE_ONLY: 'Y', DEPT_CD: searchParams.DEPT_CD } })
  ]).then(res => {
    codeList.asgnCd = res[0].ORESULT_CUR
    codeList.asgnCd.unshift({ ASGN_NM:'전체', ASGN_CD: '' })

    searchParams.ASGN_CD = ''
  })
  grdMain.value.getDataProvider().setRows([])
}

const reset = () => {
  grdMain.value.getDataProvider().setRows([])
}

const initCodeList = () => {
  let params = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    DEPT_CD: userStore.deptCd,
    ORGN_DIV: 'A',
    USE_DIV: 'N',
    USE_ONLY: 'Y',
  }
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({ queryId: 'searchBSNS', param: params }), // 사업부
    commonSearchApi({ queryId : 'searchDept', param: { CMPNY_DIV: userStore.cmpnyDiv, ORGN_DIV: 'A', BSNS_CD: userStore.bsnsCd, USE_ONLY: 'Y' } }), // 부서
    commonSearchApi({ queryId : 'searchVend', param: params }), // 협력사
  ]).then(res => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.deptCd = res[2].ORESULT_CUR
    codeList.asgnCd = res[3].ORESULT_CUR

    codeList.company.unshift({ TXT: '전체', COD: '' })
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptCd.unshift({ ASGN_SHRT_NM:'전체', DEPT_CD: '' })
    codeList.asgnCd.unshift({ ASGN_NM:'전체', ASGN_CD: '' })
    // grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnsCd, 'BSNS_CD', 'BSNS_NM') // 사업부
  })
}

//초기 데이터셋팅
onMounted(() => {
  initCodeList()
  onButtonsClick({id: 'btnSearch'})
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnDelete', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <div class="d-flex mb-2 align-center">
              <div class="formLabelText">서약서 구분</div>
              <VRadioGroup
                v-model="searchParams.OATH_DIV"
                class="mt-0 pl-3 pr-3 radio"
                inline
                @update:modelValue="oathDivChange"
              >
                <VRadio v-for="(item, i) in codeList.oathDiv" :key="i" :value="item.code" :label="item.name" />
              </VRadioGroup>
            </div>
          </div>
          <div class="d-flex">
            <i-select
              :label="$t('년도')"
              labelWidth="35px"
              v-model="searchParams.YEAR"
              type="YEAR"
              width="170px"
              @update:modelValue="reset"
            />
            <i-select
              v-model="searchParams.CMPNY_DIV"
              :label="$t('회사구분')"
              width="270px"
              :items="codeList.company"
              item-value="COD"
              item-title="TXT"
              @update:modelValue="companyChange"
            />
            <i-select
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')"
              label-width="50px"
              width="270px"
              :items="codeList.bsnsCd"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              @update:modelValue="bsnsCdChange"
            />
            <i-select 
              :label="$t('부서')"
              label-width="35px"
              width="250px"
              :items="codeList.deptCd"
              item-title="ASGN_SHRT_NM"
              item-value="DEPT_CD"
              v-model="searchParams.DEPT_CD"
              @update:modelValue="deptCdChange"
            />
            <i-select 
              :label="$t('협력사')"
              label-width="50px"
              width="250px"
              :items="codeList.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              v-model="searchParams.ASGN_CD"
              @update:modelValue="reset"
            />
            <div class="d-flex ml-2 align-center">
              <div class="formLabelText">소속구분</div>
              <VRadioGroup
                v-model="searchParams.ORGN_DIV"
                class="mt-0 pl-3 pr-3 radio"
                inline
                @update:modelValue="reset"
              >
                <VRadio v-for="(item, i) in codeList.orgnDiv" :key="i" :value="item.code" :label="item.name" />
              </VRadioGroup>
            </div>

            <v-checkbox 
              label="미작성 인원만 조회" 
              v-model="searchParams.CHECK" 
              true-value="Y" 
              false-value="N"
              class="ml-2"
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            v-if="searchParams.OATH_DIV != 'Z'"
          />
          <RealGrid
            ref="grdMain2"
            :grid-view-option="grdMainProps2.gridViewOption"
            :keys="grdMainProps2.keys" 
            :fields="grdMainProps2.fields"
            :columns="grdMainProps2.columns"
            :column-layout="grdMainProps2.columnLayout"
            v-if="searchParams.OATH_DIV === 'Z'"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <SAFGA0020Popup ref="sAFGA0020Popup" :codeList="codeList" @closed="onButtonsClick({id: 'btnSearch'})"/>
    <!-- OZReport -->
    <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
  </v-card>
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
</style>
