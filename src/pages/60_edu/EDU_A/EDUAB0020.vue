<!--
  화면명 : 부서별 안전교육 현황
  화면개요 : 부서별 안전교육 현황 조회 발행 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi,commonLogExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'

defineOptions({
  name:'60_edu-EDU_A-EDUAB0020',
})

//*******************************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const eDUAB0030Tab01Pop02Pop01 = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const empPopup = ref(null)
const userId = ref(userStore.userId)
const searchArea = ref(null)
const deptPopup = ref(null)

//조회조건(교육 실적 현황 리스트)
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EDU_DATE_FROM1 : dayjs(new Date().setMonth(new Date().getMonth() - 1)).format('YYYY-MM-DD'),
  EDU_DATE_TO1 : dayjs(new Date()).format('YYYY-MM-DD'),
  EDU_DATE_FROM : '',
  EDU_DATE_TO : '',
  BSNS_CD : userStore.bsnsCd,
  ASGN_CD :userStore.asgnCd,
  ASGN_CD_NM : userStore.asgnNm,
  CURR_ID : '',
  MORGN_ID : '',
  MORGN_EMP_NO : '',
})

//코드리스트 세팅 
const codeList = reactive({
  bsnsCd: [], //사업부
})

//콤보박스 및 그리드 데이터 바인딩
const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
  ]).then(res => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    let findIndex = res[0].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
    searchParams.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD
  })
}

// 교육실적 현황 리스트 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible:false } }, 
  fields : 
  [ 
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육명') }, styleName: 'left-column', editable: false },
    { fieldName: 'MORGN_NM', dataType: 'text', header: { text: t('주관부서') }, styleName: 'left-column', editable: false },
    { fieldName: 'MORGN_EMP_NM', dataType: 'text', header: { text: t('담당자') }, editable: false },
    { fieldName: 'TARGET_CNT_A', dataType: 'text', header: { text: t('직영') }, editable: false },
    { fieldName: 'TARGET_CNT_B', dataType: 'text', header: { text: t('협력사') }, editable: false },
    { fieldName: 'TARGET_CNT', dataType: 'text', header: { text: t('총합') }, editable: false },
    { fieldName: 'EDU_CNT_A', dataType: 'text', header: { text: t('직영') }, editable: false },
    { fieldName: 'EDU_CNT_B', dataType: 'text', header: { text: t('협력사') }, editable: false },
    { fieldName: 'EDU_CNT', dataType: 'text', header: { text: t('총합') }, editable: false },
    { fieldName: 'AVG_PASS', dataType: 'text', header: { text: t('이수율') }, styleName: 'right-column', editable: false },
    { fieldName: 'SUM_ATTACH_KEY', dataType: 'text', header: { text: t('증빙서류') }, editable: false },

    //출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', visible: false },
    { fieldName: 'MORGN_ID', dataType: 'text', visible: false },
    { fieldName: 'MORGN_EMP_NO', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout : [
    'CURR_NM',
    'MORGN_NM',
    'MORGN_EMP_NM',
    {
      name: '대상인원',
      direction: 'horizontal',
      items: [ 'TARGET_CNT_A', 'TARGET_CNT_B', 'TARGET_CNT' ],
      header: { text: t('대상인원') },
    },
    {
      name: '이수인원',
      direction: 'horizontal',
      items: [ 'EDU_CNT_A', 'EDU_CNT_B', 'EDU_CNT' ],
      header: { text: t('이수인원') },
    },
    'AVG_PASS',
    'SUM_ATTACH_KEY',
  ],
})

grdMainProps.columns = grdMainProps.fields

// 교육실적 상세 그리드 셋팅
const grdSubProps1 = reactive({
  gridViewOption: { stateBar: { visible:false }, footer: { visible:true } }, 
  fields : 
  [ 
    { fieldName: 'EDU_DTTM', dataType: 'text', header: { text: t('교육기간') }, footer: { styleName: 'right-column', text: '총 교육실시 횟수 : ' }, editable: false },
    { fieldName: 'EPLACE_NM', dataType: 'text', header: { text: t('장소') }, styleName: 'left-column', footer: { styleName: 'left-column', expression: "count" }, editable: false },
    { fieldName: 'LECTURER_NM', dataType: 'text', header: { text: t('강사') }, styleName: 'left-column', editable: false },
    { fieldName: 'TARGET_CNT_A', dataType: 'text', header: { text: t('직영') }, editable: false },
    { fieldName: 'TARGET_CNT_B', dataType: 'text', header: { text: t('협력사') }, editable: false },
    { fieldName: 'TARGET_CNT', dataType: 'text', header: { text: t('총합') }, editable: false },
    { fieldName: 'EDU_CNT_A', dataType: 'text', header: { text: t('직영') }, editable: false },
    { fieldName: 'EDU_CNT_B', dataType: 'text', header: { text: t('협력사') }, editable: false },
    { fieldName: 'EDU_CNT', dataType: 'text', header: { text: t('총합') }, editable: false },
    { fieldName: 'EDU_RATE', dataType: 'number', header: { text: t('이수율') }, styleName: 'right-column', numberFormat:"0.##", suffix: " %", footer: { numberFormat:"0.##", suffix: " %", expression: "avg" }, editable: false },
    { fieldName: 'ATTACH_KEY', dataType: 'text', header: { text: t('증빙서류') }, editable: false },

    //출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', visible: false },
    { fieldName: 'EDU_DATE', dataType: 'text', visible: false },
    { fieldName: 'EDU_TIME', dataType: 'text', visible: false },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout : [
    'EDU_DTTM',
    'EPLACE_NM',
    'LECTURER_NM',
    {
      name: '대상인원',
      direction: 'horizontal',
      items: [ 'TARGET_CNT_A', 'TARGET_CNT_B', 'TARGET_CNT' ],
      header: { text: t('대상인원') },
    },
    {
      name: '이수인원',
      direction: 'horizontal',
      items: [ 'EDU_CNT_A', 'EDU_CNT_B', 'EDU_CNT' ],
      header: { text: t('이수인원') },
    },
    'EDU_RATE',
    'ATTACH_KEY',
  ],
})

grdSubProps1.columns = grdSubProps1.fields

//*******************************************세팅 영역(종료)***************************************************/


//*******************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {       //조회
    grdMain.value.getDataProvider().setRows([])
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
}

//그룹 목록 로우 변경 이벤트
const rowChanged = async (grid, oldIdx, newIdx) => {

  if(newIdx === -1){
    return
  }
  let rowData = await grdMain.value.getDataProvider().getJsonRow(newIdx)
  searchParams.CURR_ID = rowData.CURR_ID,
  searchParams.MORGN_ID = rowData.MORGN_ID,
  searchParams.MORGN_EMP_NO = rowData.MORGN_EMP_NO,

  grdSubSearch()
}

//그룹 대상자 리스트 조회
const grdSubSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData2)
    .setAfter(afterSearch2)
    .run()
}

//그룹 대상자 리스트 로우 더블 클릭시 발생하는 이벤트
const grdSubCellDbClick = (grid, data) => {
  let row =  grdSub.value.getDataProvider().getJsonRow(data.dataRow)
  if(row === null) return
  eDUAB0030Tab01Pop02Pop01.value.openPopup({
    CREATE_YN : 'N',
    EDU_DATE : '', 
    CON_DIV : '',   
    EDUTIME_SERIAL : row.EDUTIME_SERIAL,
    CMPNY_DIV  : searchParams.CMPNY_DIV,  
    YEAR : row.YEAR,  
    SCHEDULE_ID : row.SCHEDULE_ID,
    CURR_ID : '',
    SAVE_YN : 'N',
    MENU_ID : useLogsStore().menuId,
    EXAM_YN : '',
    ONLY_SEARCH : 'Y'
  })
}

//사업부 변경시 발생 이벤트
const changedBSNS_CD = () => {
  searchParams.ASGN_CD = ''
  searchParams.ASGN_CD_NM = ''
  gridRefresh()
}

//부서 조회 팝업 오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv, 
    ASGN_NM : searchParams.ASGN_CD_NM,
    BSNS_CD : searchParams.BSNS_CD,
    HSE_SYS : 'Y',
  })
}

//부서 팝업에서 선택한 데이터 바인딩
const onDeptSelected = item => {
  searchParams.ASGN_CD_NM = item.ASGN_SHRT_NM
  searchParams.ASGN_CD = item.ASGN_CD
}

//부서 값 입력 시 발생 이벤트
const inputORGN = () => {
  gridRefresh()
  searchParams.ASGN_CD = ''
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
  //gridLock.value = 0
}

//*******************************************이벤트 영역(종료)******************************************************/


//*********************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  // 그리드 초기화
  gridRefresh()
  
  return true
}

//교육 실적 현황 리스트 조회
const searchData = idx => {
  // 화면상에서는 YYYY-MM-DD 로 표시가 되나 실제 쿼리에서는 YYYYMMDD 로 비교를 해야 해서 형변환 추가
  searchParams.EDU_DATE_FROM = dayjs(searchParams.EDU_DATE_FROM1).format('YYYYMMDD')
  searchParams.EDU_DATE_TO = dayjs(searchParams.EDU_DATE_TO1).format('YYYYMMDD')

  console.log(searchParams)

  return commonSearchApi({ queryId : 'EDUAB0020_SEARCH_01', param: searchParams })
}

//조회 후
const afterSearch = res => {
  console.log('EDUAB0020_SEARCH_01 res',res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 교육실적 상세 조회
const searchData2 = idx => {
  return commonSearchApi({ queryId : 'EDUAB0020_SEARCH_02', param: searchParams })
}


// 교육실적 상세 조회
const afterSearch2 = res => {
  //console.log(res.ORESULT_CUR)
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//*********************************************조회 영역(종료)**************************************************************/

//*********************************************삭제 영역**************************************************************/

//*********************************************삭제 영역(종료)**************************************************************/
onMounted(() => {
  initCodeList()
  onButtonsClick({ id:'btnSearch' })
})
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-2 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input labelWidth="35px" width="205px" 
            :label="$t('기간')" type="date"
            v-model="searchParams.EDU_DATE_FROM1"
            margin="10px"
          />
          <i-input width="190px"
            :label="$t('-')" type="date"
            v-model="searchParams.EDU_DATE_TO1"
          />
          <i-select
            :label="$t('사업부')"
            width="200px"
            v-model="searchParams.BSNS_CD" 
            :items="codeList.bsnsCd"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            @update:model-value="changedBSNS_CD"
          />
          <i-input 
            :label="$t('부서')"
            width="330px"
            v-model="searchParams.ASGN_CD_NM" 
            append-inner-icon="mdi-magnify" 
            @keydown.enter="e => {openDeptPopup()}"
            @click:appendInner="openDeptPopup()"
            @input="inputORGN"
            margin="4px"
          />
          <i-input
            v-model="searchParams.ASGN_CD" 
            readonly
            width="200px"
          />
        </v-sheet>
        <v-sheet height="50%" class="mb-2">
          <IGridTitle :title="$t('교육 실적 현황 리스트')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCurrentRowChanged="rowChanged"
          />
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('교육실적 상세')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps1.gridViewOption"
            :keys="grdSubProps1.keys"
            :fields="grdSubProps1.fields"
            :columns="grdSubProps1.columns"
            :column-layout="grdSubProps1.columnLayout"
            @onCellDblClicked ="grdSubCellDbClick"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서 팝업창 -->
    <DeptPopup
      ref="deptPopup"
      @selected="onDeptSelected"
    /> 
    
    <!-- 교육이수 팝업창 -->
    <EDUAB0030Tab01Pop02Pop01
      ref="eDUAB0030Tab01Pop02Pop01"
    />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
  
