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
import SPPAA0010Reg from '@/pages/50_safety-support/SPP_A/SPPAA0010PopUp.vue';
import Message from '@hiway/utils/notify'

defineOptions({
  name:'50_safety-support-SPP_A-SPPAB0010',
})

const userStore =  useUserStore()
const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const deptPopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const ResultRegPopUp = ref(null)

const planList = reactive([
  {Text:'훈련 계획',Color:'royalblue'},
  {Text:'훈련 미계획',Color:'lightgray'},
  {Text:'훈련 실적 입력',Color:'forestgreen'},
])

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY'),
  ORGN_DIV: '',
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_CD: userStore.deptCd,
  INJR_DEPT_CD: userStore.deptCd,
  ASGN_NM: userStore.deptNm
})

const codeList = reactive({
  BSNS_CD:[],
  DATE_LIST: [],
  ORGN_DIVList: [
    { TXT: '전체', COD: '' },
    { TXT: '직영', COD: 'A' },
    { TXT: '협력사', COD: 'B' },
  ]
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
  let endDate = dayjs(new Date).add(1,'year').format('YYYY')

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
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, mergeRule: { criteria: "value" } },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, mergeRule: { criteria: "value['DEPT_NM'] + value['DEPT_CD']+ value" } },
    { fieldName: 'TRAINING_GBN', dataType: 'text', width:'80', header: { text: t('훈련종류') },
        lookupDisplay:true, editor: { type: 'dropdown', dropDownCount: 6, domainOnly: true, partialMatch: true }},
    { fieldName: 'PLAN_YN', width:'50', dataType: 'text', header: { text: t('계획여부') }},    
    { fieldName: 'TRAINING_CNT', width:'50', dataType: 'text', header: { text: t('훈련실적') }},      
    { fieldName: 'REG_POPUP', width:'50', dataType: 'text', header: { text: t('결과등록') }, renderer: { type: 'button'} },
    { fieldName: 'PLAN_M01', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '0101' }, header: { text: t('1월') }},
    { fieldName: 'PLAN_M02', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '0201'}, header: { text: t('2월') }},
    { fieldName: 'PLAN_M03', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '0301'}, header: { text: t('3월') }},
    { fieldName: 'PLAN_M04', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '0401'}, header: { text: t('4월') }},
    { fieldName: 'PLAN_M05', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '0501'}, header: { text: t('5월') }},
    { fieldName: 'PLAN_M06', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '0601'}, header: { text: t('6월') }},
    { fieldName: 'PLAN_M07', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '0701'}, header: { text: t('7월') }},
    { fieldName: 'PLAN_M08', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '0801'}, header: { text: t('8월') }},
    { fieldName: 'PLAN_M09', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '0901'}, header: { text: t('9월') }},
    { fieldName: 'PLAN_M10', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '1001'}, header: { text: t('10월') }},
    { fieldName: 'PLAN_M11', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '1101'}, header: { text: t('11월') }},
    { fieldName: 'PLAN_M12', dataType: 'data', width:'50', 
      renderer: {type:'check', falseValues:'N', trueValues: searchParams.YEAR + '1201'}, header: { text: t('12월') }},

    
    { fieldName: 'REMARK', dataType: 'text', width:'200', header: { text: t('비고') }, styleName:'left-column' },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible:false},
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible:false},
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, visible:false},
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible:false},
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible:false },
    { fieldName: 'TRAINING_DATE', dataType: 'text', header: { text: t('훈련계획일') }, visible:false },
    { fieldName: 'PLAN_KOR_NM', dataType: 'text', header: { text: t('계획등록자') }, visible:false },
    { fieldName: 'TRAINING_M01', dataType: 'data', visible:false, header: { text: t('1월') }},
    { fieldName: 'TRAINING_M02', dataType: 'data', visible:false, header: { text: t('2월') }},
    { fieldName: 'TRAINING_M03', dataType: 'data', visible:false, header: { text: t('3월') }},
    { fieldName: 'TRAINING_M04', dataType: 'data', visible:false, header: { text: t('4월') }},
    { fieldName: 'TRAINING_M05', dataType: 'data', visible:false, header: { text: t('5월') }},
    { fieldName: 'TRAINING_M06', dataType: 'data', visible:false, header: { text: t('6월') }},
    { fieldName: 'TRAINING_M07', dataType: 'data', visible:false, header: { text: t('7월') }},
    { fieldName: 'TRAINING_M08', dataType: 'data', visible:false, header: { text: t('8월') }},
    { fieldName: 'TRAINING_M09', dataType: 'data', visible:false, header: { text: t('9월') }},
    { fieldName: 'TRAINING_M10', dataType: 'data', visible:false, header: { text: t('10월') }},
    { fieldName: 'TRAINING_M11', dataType: 'data', visible:false, header: { text: t('11월') }},
    { fieldName: 'TRAINING_M12', dataType: 'data', visible:false, header: { text: t('12월') }},
    { fieldName: 'TRAINING_ATTACH_KEY', dataType: 'data', visible:false, header: { text: t('TRAINING_ATTACH_KEY') }},
    
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields

//그리드 데이터 입력

onMounted(() => {
  initCodeList()
})

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(()=>{
        return commonSearchApi({
          queryId: "SPPAA0010_SEARCH_02",
          param: searchParams,
        })
      })
      .setAfter(afterSearch)
      .showMessage(true)
      .run();
  }else if(btn.id === 'btnResultRegistraion'){
    let focusRow = grdMain.value.getFocusedRowData()

    ResultRegPopUp.value.openPopup(focusRow)
    // if(focusRow.PLAN_YN === 'Y'){
    // }else{
    //   Message.warn(t('계획이 등록되지 않았습니다.'))
    // }
  }
}

const afterSearch = (res) => {
  res.ORESULT_CUR.forEach( x => {

    //gbn 월래 없던것이라 sys_cd로 대체하는 로직
    x.TRAINING_GBN = !x.TRAINING_GBN ? x.SYS_CD : x.TRAINING_GBN
    // 등록안된 데이터가 있으므로 조회한 년도로 넣기
    x.YEAR = !x.YEAR ? searchParams.YEAR : x.YEAR
    
  })

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  cellStyle()
}

/* ******************* 셀 체크된부분 색상 변경 ******************* */
const cellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {

    var ret = {}
    let fieldName = dataCell.dataColumn.fieldName
    let dataRow = dataCell.index.dataRow

    let data = grdMain.value.getDataProvider().getJsonRow(dataRow)

    if(fieldName === 'TRAINING_CNT'){
      if(dataCell.value === '0'){
        ret.style = { background: 'red', color: 'white' }
      }else if(dataCell.value === '1'){
        ret.style = { background: 'darkorange', color: 'white' }
      }else {
        ret.style = { background: 'forestgreen', color: 'white' }
      }
    }

    if(fieldName === 'PLAN_M01' || fieldName === 'PLAN_M02' || fieldName === 'PLAN_M03' || fieldName === 'PLAN_M04' 
        || fieldName === 'PLAN_M05' || fieldName === 'PLAN_M06' || fieldName === 'PLAN_M07' || fieldName === 'PLAN_M08' 
        || fieldName === 'PLAN_M09' || fieldName === 'PLAN_M10' || fieldName === 'PLAN_M11' || fieldName === 'PLAN_M12'){

      let training = fieldName.split('_')

      if(data['TRAINING_' + training[1]]){
        ret.style = { background: 'forestgreen', color: 'white' }
        grdMain.value.getDataProvider().setValue(dataCell.index.dataRow, fieldName, 'Y')
      }

      if(dataCell.value){
        
        if(data['TRAINING_' + training[1]]){
          ret.style = { background: 'forestgreen', color: 'white' }
        }else {
          ret.style = { background: 'royalblue', color: 'white' }
        }
        
      }else if(!dataCell.value && !data['TRAINING_' + training[1]]){
        ret.style = { background: 'lightgray', color: 'white' }
      }
    }
    
    return ret
  })
}

const onCellItemClicked = async (grid, index, col) => {
  let rowData = await grdMain.value.getDataProvider().getJsonRow(col.dataRow)

  ResultRegPopUp.value.openPopup(rowData)
  // if(rowData.PLAN_YN === 'Y'){
  // }else{
  //   Message.warn(t('계획이 등록되지 않았습니다.'))
  // }
}

const onCellClicked = async (grid, clickData) => {
  if(clickData.cellType === 'data'){
    let fieldName = clickData.fieldName
    if(fieldName === 'PLAN_M01' || fieldName === 'PLAN_M02' || fieldName === 'PLAN_M03' || fieldName === 'PLAN_M04' 
        || fieldName === 'PLAN_M05' || fieldName === 'PLAN_M06' || fieldName === 'PLAN_M07' || fieldName === 'PLAN_M08' 
        || fieldName === 'PLAN_M09' || fieldName === 'PLAN_M10' || fieldName === 'PLAN_M11' || fieldName === 'PLAN_M12'){

      let rowData = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      let MONTH = fieldName.split('_M')
      rowData.MONTH = MONTH[1]
      ResultRegPopUp.value.openPopup(rowData)
    }
  }
}

const reset = () => {
  searchParams.INJR_DEPT_CD = ''
  searchParams.DEPT_CD = ''
  searchParams.ASGN_NM = ''

  grdMain.value.getDataProvider().setRows()
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">         
          <i-select
            :label="$t('년도')"
            width="150px"
            labelWidth="35px"
            v-model="searchParams.YEAR"
            :items="codeList.DATE_LIST"
            item-value="COD"
            item-title="TXT"
          />
          <i-select
            :label="$t('사업부')"
            width="250px"
            labelWidth="45px"
            placeholder="사업부"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            @update:modelValue="reset"
          />
          <i-input
            :label="$t('부서')"
            v-model="searchParams.ASGN_NM"
            width="300px"
            labelWidth="35px"
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
          <div class="d-flex align-center">
            <div class="formLabelText mr-5">
              {{ $t('조직구분') }}
            </div>
            <VRadioGroup
              v-model="searchParams.ORGN_DIV"
              inline
            >
              <VRadio
                v-for="(item , i) in codeList.ORGN_DIVList"
                :key="i"
                :value="item.COD"
                :label="item.TXT"
              />
            </VRadioGroup>
          </div>
        </v-sheet>
        <v-sheet class="h-auto">          
          <div class="d-flex align-self-end">
            <div v-for="item in planList" :key="item" class="d-flex align-center mb-1 ml-2">
              <div class="pr-1">{{ item.Text }}</div>
              <div class="border pa-2" :style="'width:40px; height:25px; background-color: ' + item.Color"></div>
            </div>
          </div>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            @onCellItemClicked="onCellItemClicked"
            @onCellClicked="onCellClicked"
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
