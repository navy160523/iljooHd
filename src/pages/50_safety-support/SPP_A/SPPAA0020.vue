<!-- SPPDB0010 안전검사 수수료정보 -->
<!-- SI2팀 김성근 2024-04-04 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";
import { commonSearchApi, getCodeList, } from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import DeptPopup from "@/components/popup/DeptPopup.vue"
import SPPAA0010Reg from '@/pages/50_safety-support/SPP_A/SPPAA0010PopUp.vue';

defineOptions({
  name:'50_safety-support-SPP_A-SPPAA0010',
})

const userStore =  useUserStore()
const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const deptPopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const ResultRegPopUp = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY'),
})

const codeList = reactive({
  BSNS_CD:[],
  DATE_LIST: [],
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
    //grdMain.value.setBindingColumn("PROPEL", res[2].ORESULT_CUR, "COD", "TXT")
    
    codeList.BSNS_CD.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
  })
  
  let startDate = dayjs(new Date).format('YYYY') - 30
  let endDate = dayjs(new Date).format('YYYY')

  for(let i = endDate; i > startDate; i--){
      codeList.DATE_LIST.push({COD:i.toString() ,TXT: i.toString(),})
  }
 
}
//부서 팝업
const openPopup = () => {
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
  keys : ['BSNS_CD', 'DEPT_CD', 'YEAR', 'TRAINING_GBN'],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') },  },
    { fieldName: 'TRAINING_GBN', dataType: 'text', width:'80', header: { text: t('훈련종류') },
        lookupDisplay:true, editor: { type: 'dropdown', dropDownCount: 6, domainOnly: true, partialMatch: true }},  
    { fieldName: '01', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('1월') }},
    { fieldName: '02', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('2월') }},
    { fieldName: '03', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('3월') }},
    { fieldName: '04', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('4월') }},
    { fieldName: '05', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('5월') }},
    { fieldName: '06', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('6월') }},
    { fieldName: '07', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('7월') }},
    { fieldName: '08', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('8월') }},
    { fieldName: '09', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('9월') }},
    { fieldName: '10', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('10월') }},
    { fieldName: '11', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('11월') }},
    { fieldName: '12', dataType: 'data', width:'50', renderer: {type:'check', falseValues:'N', trueValues:'Y'}, header: { text: t('12월') }},
    { fieldName: 'REMARK', dataType: 'text', width:'200', header: { text: t('비고') }, styleName:'left-column' },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible:false},
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible:false},
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, visible:false},
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible:false },
    { fieldName: 'TRAINING_DATE', dataType: 'text', header: { text: t('훈련계획일') }, visible:false },
    { fieldName: 'REV_NO', dataType: 'text', header: { text: t('버전') }, visible:false },
    
  ],
  columns : [],
  columnLayout: [   
    'BSNS_NM',
    'DEPT_NM',
    'TRAINING_GBN',    
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',    
    'REMARK',
    'YEAR',
  ],
})

grdProps1.columns = grdProps1.fields

//그리드 데이터 입력

onMounted(() => {
  initCodeList()
})

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(()=>{
        return commonSearchApi({
          queryId: "SPPAA0010_SEARCH_01",
          param: searchParams,
        })
      })
      .setAfter(afterSearch01)
      .showMessage(true)
      .run();
  }else if(btn.id === 'btnResultRegistraion'){
    let chkRow = grdMain.value.getFocusedRowData()

    console.log(chkRow,'chkRow')
    
    ResultRegPopUp.value.openPopup(chkRow)
  }
}

const afterSearch01 = (res) => {
  
  res.ORESULT_CUR.forEach( x => {

    //gbn 월래 없던것이라 sys_cd로 대체하는 로직
    x.TRAINING_GBN = !x.TRAINING_GBN ? x.SYS_CD : x.TRAINING_GBN
    // 조회한 년도로 넣기
    x.YEAR = !x.YEAR ? searchParams.YEAR : x.YEAR
    //월만 뽑아서 체크하기
    let month = x.TRAINING_DATE ? String(dayjs(x.TRAINING_DATE).get('month') + 1).padStart(2,'0') : null 
    if(month){      
      x[month] = 'Y'
    }

  })

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  cellStyle()
}

/* ******************* 셀 체크된부분 색상 변경 ******************* */
const cellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {

    var ret = {}

    if(dataCell.dataColumn.index > 2 && dataCell.dataColumn.index < 15){
      if(dataCell.value === 'Y'){
        ret.style = { background: 'royalblue', color: 'white' }       
      }else{
        ret.style = { background: 'white', color: 'white' }       
      }
    }

    return ret
  })
}

const cellDbClick = () => {
  
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnResultRegistraion']"
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
            @keydown.enter=" (e) => { openPopup() } "
            @update:modelValue=" (e) => { searchParams.DEPT_CD = null } "
            @click:appendInner="openPopup()"
          />
          <i-input
            :label="$t('')"
            v-model="searchParams.INJR_DEPT_CD"
            width="80px"
            readonly
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('')" >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onCellDblClicked ="cellDbClick"                       
          />
        </v-sheet>
        <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
        <SPPAA0010Reg ref ='ResultRegPopUp'  @reSearch="onButtonsClick({id: 'btnSearch'} )" />          
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
