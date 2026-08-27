<!--
  화면명 : 교육설문 결과
  화면개요 : 교육별 설문 결과 조회 및 차트로 표시
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'


defineOptions({
  name: '60_edu-EDU_A-EDUAA0070',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const deptPopup = ref(null)
let pieCharts = reactive({
  QUESTION_LIST:[{},{},{},{},{},{},{},{},]
})

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : userStore.bsnsCd,
  DEPT_CD :userStore.deptCd, //부서코드
  DEPT_NM :userStore.deptNm, //부서명
  ASGN_CD : userStore.asgnCd,
  DATE_FROM : dayjs().add(-2, 'month').format('YYYY-MM-DD'), //기간(시작)
  DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'),          //기간(종료)
  REQ_YN : '',                    //교육구분
  DIVISION : null,                //분류
  CURR_ID : '',                   //교육명
})

const codeList = reactive({
  division : [],    //분류
  currId : [],      //교육
  reqYn : [],       //교육구분
})

//상관관계 리스트 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false }, stateBar: { visible:false } },
  fields : [   
    { fieldName: "DIVISION_NM",width: "50" ,dataType: "text", header: { text: t("분류") } },
    { fieldName: "CURR_NM", styleName: 'left-column', width: "230",dataType: "text", header: { text: t("교육명") } },
    { fieldName: "EDU_DATE", width: "190", dataType: "text", header: { text: t("교육기간") } },
    // { fieldName: "EDU_TIME", width: "130", dataType: "text", header: { text: t("교육시간") } },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', visible: false },
    { fieldName: 'SUVY_ID', dataType: 'text', visible: false },
  ],
  columns: [],
  
})
// 그리드 세팅

grdMainProps.columns = grdMainProps.fields

// 주관식 질문 그리드 세팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar : { visible:false }, edit: { editable: false }, }, 
  fields : [ 
    { fieldName: 'QSTN_TITLE', dataType: 'text', width:'350', header: { text: t('질문') }, visible: false , styleName: 'left-column' },
    { fieldName: 'ANSWER_CONTENT', dataType: 'text', width:'450', header: { text: t('답변') }, styleName: 'left-column' },
    { fieldName: 'ANSWER_CNT', dataType: 'text', width:'40', header: { text: t('답변 수') }},
    
    // 숨김처리
    { fieldName: 'QSTN_ID', dataType: 'text', width:'40', header: { text: t('질문 ID') }, visible: false },
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //분류
    commonSearchApi({ queryId : 'EDUAB0060_SEARCH_01', param : {CMPNY_DIV : userStore.cmpnyDiv} }),//교육명
  ]).then(res => {
    console.log("레스 확인",res)


    //분류 데이터 바인딩
    codeList.division = res[0].ORESULT_CUR
    codeList.division.unshift({ COD : '', TXT : '전체'})
    searchParams.DIVISION = res[0].ORESULT_CUR[0].COD

    //주관부서 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn("DIVISION", res[0].ORESULT_CUR, "COD", "TXT")

    codeList.reqYn.push({COD : '', TXT : '전체'}, {TXT : '일반교육', COD : 'N'}, {TXT : '신청교육', COD : 'Y'})
    searchParams.REQ_YN = codeList.reqYn[0].COD

    // grdMain.value.setBindingColumn("REQ_YN", codeList.reqYn, "COD", "TXT")
  })
}


//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  //console.log('tab.value : ',tab.value)
  if(btn.id === 'btnSearch'){ //조회
    new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
  }
}
 

// //그룹 목록 로우 변경 이벤트
// const onCurrentRowChanged = async (grid, oldIdx, newIdx) => {
//   if(newIdx === -1){
//     return
//   }
//   let rowData = await grdMain.value.getDataProvider().getJsonRow(newIdx)
//   searchParams2.SCORING_CRITERIA_SEQ = rowData.SCORING_CRITERIA_SEQ
//   onButtonsSubClick({ id:'btnSearch' })
// }



//그리드 초기화 이벤트
const gridRefresh = val => {
  if(val === 'grdMain'){
    grdMain.value.getDataProvider().setRows([])
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  // 조회조건 부서 확인
  let status = true
  if (searchParams.DEPT_CD === ''){
    Message.warn(t('부서를 선택해주세요.'))
    status = false
  }
  grdMain.value.getDataProvider().setRows([])
  return status
}

//상관관계 리스트 조회
const searchData = idx => {
  gridRefresh('grdMain')
  return commonSearchApi({ queryId : 'EDUAA0070_SEARCH_01', param: searchParams })
}


//상관관계 리스트 조회 후
const afterSearch = res => {
  console.log("상관관계 리스트 조회",res )
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


//*****************************************조회 영역(종료)***********************************************************/




const deptPopupOpen = (val) =>{
  console.log('val',val.target._value)
  console.log('DEPT_NM',searchParams.DEPT_NM)
  searchParams.DEPT_NM=val.target._value
  deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_NM: searchParams.DEPT_NM,
    })
}

const onDeptSelected = val =>{
  console.log('select Dept',val)
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
}

const resetSearch = () =>{
  searchParams.BSNS_CD = ''
  searchParams.DEPT_CD = ''
  searchParams.ASGN_CD = ''
  searchParams.DEPT_NM = ''
}

const onCellDblClicked = (grid, clickData) =>{
  const selectData = grdMain.value.getRowData(clickData.dataRow)
  console.log('selectData',selectData)
  commonSearchApi({ 
    queryId : 'EDUAA0070_SEARCH_02'
  , param: {
    CMPNY_DIV: searchParams.CMPNY_DIV
    , SCHEDULE_ID: selectData.SCHEDULE_ID
    , SUVY_ID: selectData.SUVY_ID
  } })
  .then(res =>{
    if(res.ORESULT_CUR.length>0){
      console.log('res',res)
      const QUESTION_LIST = res.ORESULT_CUR2
      const SUBJECT_QUESTION_LIST = res.ORESULT_CUR3
      const QUESTION_DATA = res.ORESULT_CUR
      
      QUESTION_LIST.forEach((e)=>{
        const result = QUESTION_DATA.map(item => item.QSTN_ID === e.QSTN_ID ? { value: item.ANSWER_CNT, name: item.ANSWER_CONTENT } : null)
        .filter(item => item !== null)
        
        // console.log('result',result)
        
        e.chartOption={
          tooltip: {
            trigger: "item",
          },
          series: [
            { 
              type: "pie",
              radius: ['70%', '40%'],
              startAngle: 0,
              label: {
                show: true,
                position: "inner",
                
              },
              labelLine: {
                show: true,
              },
              data: result,
            }, 
          ],
        }
        // pieCharts.push(e)
      })

      const tempList = []
      SUBJECT_QUESTION_LIST.forEach((e)=>{
        const result = QUESTION_DATA.map(item => item.QSTN_ID === e.QSTN_ID ?
         { 
          QSTN_TITLE: e.QSTN_TITLE
          , QSTN_ID: e.QSTN_ID
          , ANSWER_CNT: item.ANSWER_CNT
          , ANSWER_CONTENT: item.ANSWER_CONTENT } : null)
        .filter(item => item !== null)
        
        console.log('result',result)
        // pieCharts.push(e)
        result.forEach((e)=>{
          tempList.push(e)
        })
      })
      console.log('tempList',tempList)


      grdSub.value.getDataProvider().setRows(tempList)
      grdSub.value.getGridView().groupBy(["QSTN_TITLE"])
      grdSub.value.getGridView().rowGroup.headerStatement = undefined;
      grdSub.value.getGridView().rowGroup.headerCallback = function(grid, group) {
        const groupName = grid.getDataSource().getOrgFieldName(group.groupField) 
        // console.log('group',group.groupValue)
        if(groupName==="QSTN_TITLE"){
          return group.groupValue
        }
  	  }
      // grdSub.value.getGridView().setRowGroup
      // ({ 
      //   headerStatement: undefined
      //   ,expandedAdornments: "footer"  //그룹을 펼쳤을때 FOOTER만 보이기
      //   //, collapsedAdornments: "footer" //그룹을 접었을때 FOOTER만 보이기
      //   , mergeMode: true // 행 병합 그룹핑 활성화
      //   //, indentVisible: false // 행 병합 그룹핑 비활성화일대 사용하면 그룹핑 바 표시 안함.
      // })
      grdSub.value.getGridView().getGroupFieldNames(false)


      pieCharts.QUESTION_LIST = QUESTION_LIST
      console.log('QUESTION_LIST',QUESTION_LIST)
      console.log('pieCharts',pieCharts)
      
      // x = QUESTION_LIST
    }
  })
} 

// 기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const dateFrChanged = data => {
  // console.log("데이트 프롬 타겟 밸류",data.target.value)
  if(data.target.value > searchParams.DATE_TO){
    searchParams.DATE_TO = searchParams.DATE_FROM
  }
}

// 기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const dateToChanged = data => {
  // console.log("데이트 투 타겟 밸류",data.target.value)
  if(data.target.value < searchParams.DATE_FROM){
    searchParams.DATE_FROM = searchParams.DATE_TO
  }
}


// 분류가 바뀌면 분류에 따른 교육명 데이터 가져옴
watch(() => searchParams.DIVISION, (newValue, oldValue) => {
  console.log("분류 바뀜")
  if(newValue === ''){
    codeList.currId = []
    codeList.currId.unshift({ TXT:"전체", COD:"" })
    searchParams.CURR_ID =codeList.currId[0].COD
    return
  }
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue } })
    .then(res => {
      codeList.currId = res.ORESULT_CUR
      codeList.currId.unshift({ TXT:"전체", COD:"" })
      searchParams.CURR_ID =codeList.currId[0].COD
    })
})

onMounted(() => {
  initCodeList()
  // onButtonsClick({ id:'btnSearch' })
})


</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
        <v-sheet class="searchArea d-flex">
          <i-input labelWidth="30px" width="213px" 
            :label="$t('기간')" type="date"
            v-model="searchParams.DATE_FROM"
            @focusout="dateFrChanged"
            @update:model-value="gridRefresh"
            margin="10px"
          />
          <i-input width="190px"
            :label="$t('-')" type="date"
            v-model="searchParams.DATE_TO"
            @focusout="dateToChanged"
            @update:model-value="gridRefresh"
          />
          <i-select
            :label="$t('분류')"
            v-model="searchParams.DIVISION"
            :items="codeList.division"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh"
            width="200px"
          />
          <i-select
            :label="$t('교육명')"
            v-model="searchParams.CURR_ID"
            :items="codeList.currId"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh"
            width="420px"
          />
          <i-input 
            :label="$t('소속')"
            v-model="searchParams.DEPT_NM"
            append-inner-icon="mdi-magnify"
            @keydown.enter="e => { deptPopupOpen(e) }"
            @click:appendInner="deptPopupOpen()"
            @update:modelValue="resetSearch()"
            required
            width="250px"
          />
          <i-input
            v-model="searchParams.DEPT_CD"
            width="150px"
            readonly
          />
          <i-select
            :label="$t('교육구분')"
            v-model="searchParams.REQ_YN"
            :items="codeList.reqYn"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh"
            width="250px"
          />
        </v-sheet>
        <div style="display: flex; height: 92%;">
          <v-sheet class="h-auto mr-3" style="width: 40%;">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellDblClicked="onCellDblClicked"
              />
           
          </v-sheet>
          <v-sheet 
            style="width: 60%; 
                  display: flex; 
                  flex-direction: row; 
                  flex-wrap: wrap;
                  overflow-y: scroll;">
            <div style="width: 100%;" >
              <IGridTitle class="mb-0 mr-2 h-grow"
                :title="$t('객관식 문항')"
              >
                <template #editors />
              </IGridTitle>
            </div>
            <div
              class="SPAYDiv"
              v-for="(item, index) in pieCharts.QUESTION_LIST"
              :key="index"
              style="borderBottom: 1px solid #e4e4e4; "
            >
              <div
                :style="{
                  borderRight:
                    (index + 1) % 4 !== 0 ? '1px solid #e4e4e4' : '',
                  height: '95%',
                }"
              >
                <!-- 분류 -->
                <div style="font-size: 18px" class="mb-1 mt-3 pl-1 pr-1 TextOverFlow">
                  {{ item.QSTN_TITLE }}
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                  <p style="font-size: 18px">{{ item.QSTN_TITLE }}</p>
                  </v-tooltip>
                </div>
                
                <!-- 원 차트  -->
                <div style="height: 220px;">
                  <e-chart :option="item.chartOption" />
                </div>
              </div>
            </div>
            <div class="mt-2" style="width: 100%;height: 50%;">
              <IGridTitle class="mb-0 mr-2 h-grow"
                :title="$t('주관식 문항')"
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdSub"
                :grid-view-option="grdSubProps.gridViewOption"
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
                />
            </div>
          </v-sheet>
        </div>
        <!-- 메인그리드 -->
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (200px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
.SPAYDiv {
  box-sizing: border-box;
  width: 25%;
  text-align: center;
}

.TextOverFlow {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
