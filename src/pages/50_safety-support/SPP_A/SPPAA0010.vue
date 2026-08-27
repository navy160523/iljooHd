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
import { commonSearchApi, commonExecuteApi, getCodeList,} from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import DeptPopup from "@/components/popup/DeptPopup.vue"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"

defineOptions({
  name:'50_safety-support-SPP_A-SPPAA0010',
})

const userStore =  useUserStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어

const deptPopup = ref(null)
const iUploadPopup = ref(null);
const menuTitle = ref(null)
const grdMain = ref(null)
const fieldName = ref(null)
const fieldIndex = ref([])
const saveList = ref([])

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY'),
  ORGN_DIV: '',
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: userStore.asgnCd,
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
    //grdMain.value.setBindingColumn("PROPEL", res[2].ORESULT_CUR, "COD", "TXT")
    
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
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.INJR_DEPT_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_FULL_NM
}

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : {stateBar: { visible: false }, checkBar: { visible : true } },
  keys : ['BSNS_CD', 'DEPT_CD', 'YEAR', 'DRILL', 'PROPEL'],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, mergeRule: { criteria: "value" }, editable:false},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, mergeRule: { criteria: "value['DEPT_NM'] + value['DEPT_CD']+ value" },  editable:false},
    { fieldName: 'TRAINING_GBN', dataType: 'text', width:'80', header: { text: t('훈련종류') }, editable:false,
        lookupDisplay:true, editor: { type: 'dropdown', dropDownCount: 6, domainOnly: true, partialMatch: true }},
    // { fieldName: 'PLAN_YN', dataType: 'text', header: { text: t('계획자료') },  editable:false, mergeRule: { "criteria": "value['DEPT_NM'] + value['DEPT_CD']+ value" }, isFile: { value: true, align: 'right', showAlways: true }},
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

    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('등록일') }, visible:false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible:false},
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible:false},
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, visible:false},
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible:false},
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible:false },
    { fieldName: 'TRAINING_DATE', dataType: 'text', header: { text: t('훈련계획일') }, visible:false },
    
    { fieldName: 'PLAN_ATTACH_KEY', dataType: 'text', header: { text: t('계획자료') }, visible:false},
    
  ],
  columns : [],
  columnLayout: [   
    'BSNS_NM',
    'DEPT_NM',
    'TRAINING_GBN',
    // 'PLAN_YN',
    'PLAN_M01',
    'PLAN_M02',
    'PLAN_M03',
    'PLAN_M04',
    'PLAN_M05',
    'PLAN_M06',
    'PLAN_M07',
    'PLAN_M08',
    'PLAN_M09',
    'PLAN_M10',
    'PLAN_M11',
    'PLAN_M12',    
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
      .setAfter(afterSearch)
      .showMessage(true)
      .run();
  }
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}


const afterSearch = (res) => {
  res.ORESULT_CUR.forEach( x => {

    x.TRAINING_GBN = !x.TRAINING_GBN ? x.SYS_CD : x.TRAINING_GBN 
  })

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

// 저장
const beforeSave = () =>{


  let chekedRow =  grdMain.value.getGridView().getCheckedRows();

  console.log("chekedRow ", chekedRow )
  let chekedValues =   []
  
  for(let c = 0; c < chekedRow.length; c++){
    chekedValues.push(grdMain.value.getDataProvider().getJsonRow(chekedRow[c]))
  }
  console.log("chekedValues ", chekedValues )



  saveList.value = []
  let allData = grdMain.value.getDataProvider().getJsonRows()
  let uniqueValuesSet = new Set(chekedValues.map(item => item["DEPT_NM"]));
  let uniqueValues = [...uniqueValuesSet]

  console.log("uniqueValues ", uniqueValues)
  let flag = true

  for(let i = 0; i < uniqueValues.length; i++){
    let tmp_dept_nm = uniqueValues[i]
    console.log("검색 부서:", tmp_dept_nm)

    let cnt = 0
    // 부서별로 두개 이상  체크 했는지 확인
    for(let j = 0; j < allData.length; j++){
      console.log("j:", j)
      let data = grdMain.value.getDataProvider().getJsonRow(j)
  
      if(data.DEPT_NM === tmp_dept_nm ){
        console.log("catched")
        for(let x = 1; x <= 12; x++){  
          console.log()
          let colNm = 'PLAN_M' + String(x).padStart(2,'0')
          if(data[colNm] && data[colNm] != 'N'){ 
            console.log("colNm", colNm)
            cnt++ 
          }
        }
      }
    }
    console.log("검색부서의 cnt:", cnt)
    if (cnt < 2) {flag = false}


  }

  if(!flag){
        Message.warn(t('소방훈련, 비상조치훈련을 합쳐 2개 이상이 되어야 합니다. (비상조치훈련은 건물동 소방훈련으로 1회 대체 가능)'))

        return false
      }



  for(let i = 0; i < allData.length; i++){
    let data = allData[i]
    data.YEAR = searchParams.YEAR
    saveList.value.push(data)
  }


  console.log(saveList)

  return true

}


const saveData =() =>{

  return commonExecuteApi({ queryId : 'SPPAA0010_SAVE_02', list: saveList.value })
}

// 삭제
const beforeDelete= ()=>{
  // let chekedRow =  grdMain.value.getGridView().getCheckedRows();

  //   if (chekedRow.length === 0) {
  //     Message.warn(t("선택한 데이터가 없습니다."));
  //     return false;
  //   }
    return true;
}
const deleteData =() =>{
  let chekedRow =  grdMain.value.getGridView().getCheckedRows();
  let delList = []

  chekedRow.forEach((val) => {
    delList.push(grdMain.value.getDataProvider().getJsonRow(val))
  })

  return commonExecuteApi({ queryId : 'SPPAA0010_DELETE_01', list: delList })
}

//셀변경 이벤트 시작
const onCellEdited = async (grid, itemIndex, row, field) => {
  let fieldNm = await grdMain.value.getGridView().getColumn(field).name
  let rowData = await grdMain.value.getDataProvider().getJsonRow(itemIndex)
  let JsonRows = await grdMain.value.getDataProvider().getJsonRows()

  
  if(field > 15) return

  if(grdMain.value.getDataProvider().getValue(row, fieldNm) === 'Y'){
    // if(rowData.TRAINING_GBN === '10'){
    //     JsonRows.forEach(item => {
    //       if(item.BSNS_CD === rowData.BSNS_CD && item.DEPT_CD === rowData.DEPT_CD && item.TRAINING_GBN === '20'){
    //         console.log(' item ' , item)
    //         for(let i = 1; i<=12; i++){
    //           let colNm = String(i).padStart(2,'0')

    //           if(item[colNm])
    //           console.log(' item[colNm] ' , item[colNm])
    //         }
            
    //       }
    //     })
    // }

    // for(let i = 1; i<=12; i++){
    //   let colNm = String(i).padStart(2,'0')
  
    //   if(colNm == fieldNm){
    //     grdMain.value.getDataProvider().setValue(row, colNm,'Y')
    //   }else{
    //     grdMain.value.getDataProvider().setValue(row, colNm,'N')  
    //   }
    // }
  }
}

const reset = () => {
  searchParams.INJR_DEPT_CD = ''
  searchParams.DEPT_CD = ''
  searchParams.ASGN_CD = ''
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
        :button-list="['btnSearch','btnUpdate','btnDelete']"
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
          <span>※ 상/하반기 각 1회 체크 후 저장(비상조치훈련 + 소방훈련 또는 소방훈련 + 비상조치훈련) </span>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onCellEdited="onCellEdited"
          />
            <!-- @onCellItemClicked="onCellItemClicked" -->
        </v-sheet>
        <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
      </div>
    </v-card-text>
    <!-- <IUploadPopup @uploaded="UpLoaded($event)" ref ='iUploadPopup' />   -->
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
