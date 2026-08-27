<!--
  화면명 : 개인별 교육일정 및 교육현황
  화면개요 : 개인별 교육일정 및 교육현황 조회 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

defineOptions({
  name: '60_edu-EDU_A-EDUAB0080',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const empPopup = ref(null)
//const searchArea = ref(null)
const MainGrd = ref(null)


const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  DIVISION : '',             //분류
  CURR_ID : '',              //교육명
  EDU_DATE_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), //기간 시작
  EDU_DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), //기간 종료
})


//자격종류별 보유자 현황
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('분류') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'CURR_NM', dataType: 'text',  header: { text: t('교육명') }, width: '250', styleName: 'left-column', editable: false },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육일자') }, editable: false , renderer: {
        type: "html",
        callback: function (grid, cell) {
          var date = cell.value
          var result = ''
          if(date !== null && date !== ''){
            result = date.slice(0,4) + '-' + date.slice(4,6)+ '-' + date.slice(6)
          }
          return result
        }
      }},
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('교육시작 시간') }, editable: false },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', header: { text: t('교육종료 시간') }, editable: false },
    { fieldName: 'EPLACE_NM', dataType: 'text', header: { text: t('교육장소') }, width: '250',styleName: 'left-column', editable: false },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('대상자 현재소속') },  styleName:'left-column', editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('대상자 직위') }, editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('이수자사번') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이수자') }, editable: false },
    { fieldName: 'NATN_NM', dataType: 'text', header: { text: t('국적') }, editable: false },
    { fieldName: 'COM_ENT_DATE', dataType: 'text', header: { text: t('입사일') }, editable: false },
    { fieldName: 'HLD_OFFI_NM', dataType: 'text', header: { text: t('재직여부') }, editable: false },
  ],
  columns: [],
  columnLayout: [
    'DIVISION',
    'CURR_NM',
    'EDU_DATE',
    'EDU_TIME',
    'EDU_TIME_FN',
    'EPLACE_NM',
    'ASGN_FULL_NM',
    'JOB_TIT_NM',
    'TARGET_ID',
    'TARGET_NM',
    'NATN_NM',
    'COM_ENT_DATE',
    'HLD_OFFI_NM',
  ],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields

const codeList = reactive({
  division : [],//구분
  currId : [],  //교육명
  asgnCd : [],  //부서
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //구분
    getCodeList('HHID220'), //교육명
    // commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서

  ]).then(res => {
    console.log("레스 확인",res)
    //분류 콤보박스
    codeList.division = res[0].ORESULT_CUR
    codeList.division.unshift({ TXT:"전체", COD:"" })
    searchParams.DIVISION = codeList.division[0].COD

    //교육명 콤보박스
    codeList.currId.unshift({ TXT: "전체", COD: "" })
    searchParams.CURR_ID = codeList.currId[0].COD
    
    //onButtonsClick({ id : 'btnSearch' })

    //진행상태 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn("DIVISION", res[0].ORESULT_CUR, "COD", "TXT")
  })
}

const dateDiffInMonths = (date1, date2) => {
  return (
    (new Date(date2).getFullYear() - new Date(date1).getFullYear()) * 12 +
    (new Date(date2).getMonth() - new Date(date1).getMonth())
  );
}

// 구분이 바뀌면 구분에 따른 교육명 데이터 가져옴
watch(() => searchParams.DIVISION, (newValue, oldValue) => {
  console.log("뉴밸류!",newValue)
  if(newValue === ''){
    codeList.currId = []
    codeList.currId.unshift({ TXT:"전체", COD:"" })
    searchParams.CURR_ID = codeList.currId[0].COD
    return
  }
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue } })
    .then(res => {
      codeList.currId = res.ORESULT_CUR
      codeList.currId.unshift({ TXT:"전체", COD:"" })
      searchParams.CURR_ID =codeList.currId[0].COD
    })
})


watch(
  () => searchParams.EDU_DATE_FROM,
  (newValue) => {
    if (newValue) {
      const fromDate = newValue;
      const toDate = searchParams.EDU_DATE_TO;

      const division = searchParams.DIVISION;
      const currId = searchParams.CURR_ID;

      // 조건에 따라 기간 제한 설정
      const isSpecialCase = division === 'A' && ['C998', 'C999', 'C277', 'C082'].includes(currId);
      const maxGap = isSpecialCase ? 6 : 24; // 개월 수 기준

      const maxToDate = addMonths(fromDate, maxGap);

      if (toDate > maxToDate) {
        const warnMsg = isSpecialCase
          ? '해당 과정은 최대 6개월까지만 선택 가능합니다.'
          : '최대 2년까지만 선택 가능합니다.';

        Message.warn(warnMsg);

        const changeFromDate = addMonths(toDate, -maxGap);

        vm.$nextTick(() => {
          searchParams.EDU_DATE_FROM = changeFromDate;
        });

        return false;
      }

    }
  }
)

watch(
  () => searchParams.EDU_DATE_TO,
  (newValue) => {
    if (newValue) {
      const toDate = newValue;
      const fromDate = searchParams.EDU_DATE_FROM;

      const division = searchParams.DIVISION;
      const currId = searchParams.CURR_ID;

      const isSpecialCase = division === 'A' && ['C998', 'C999', 'C277', 'C082'].includes(currId);
      const maxGap = isSpecialCase ? 6 : 24; // 개월 수 기준

      const maxFromDate = addMonths(toDate, -maxGap);

      if (fromDate < maxFromDate) {
        const warnMsg = isSpecialCase
          ? '해당 과정은 최대 6개월까지만 선택 가능합니다.'
          : '최대 2년까지만 선택 가능합니다.';

        Message.warn(warnMsg);

        const changeToDate = addMonths(fromDate, maxGap);

        vm.$nextTick(() => {
          searchParams.EDU_DATE_TO = changeToDate;
        });

        return false;
      }
    }
  }
)

watch(
  () => [searchParams.DIVISION, searchParams.CURR_ID],
  ([newDivision, newCurrId]) => {
    const isSpecialCase = newDivision === 'A' && ['C998', 'C999', 'C277', 'C082'].includes(newCurrId);
    const fromDate = searchParams.EDU_DATE_FROM;
    const toDate = searchParams.EDU_DATE_TO;

    if (isSpecialCase && dateDiffInMonths(fromDate, toDate) > 6) {
      Message.warn('선택한 과정은 최대 6개월까지만 조회 가능합니다.');
      vm.$nextTick(() => {
        searchParams.EDU_DATE_FROM = addMonths(toDate, -3);
      });
    }
  }
);

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/

//날짜 선택 시 날짜 변환 기능
const addMonths = (dateStr, months) => {
  let date = new Date(dateStr);
  let day = date.getDate(); // 기존 일(day) 값 저장
  date.setMonth(date.getMonth() + months);

  // 오버플로우 방지 (예: 2월 30일 → 2월 마지막 날)
  if (date.getDate() !== day) {
    date.setDate(0); // 해당 월의 마지막 날로 조정
  }

  return date.toISOString().split("T")[0]; // YYYY-MM-DD 형식 변환
}

//버튼 이벤트
const onButtonsClick = btn => {//조회
  gridRefresh()
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
  }
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().setAllCheck(false)
}

// 기간(FR)이 TO보다 높을 경우 TO와 FR값을 같게 함
const dateFrChanged = data => {

  let fromDate = data.target.value;
  let toDate = searchParams.EDU_DATE_TO;
  
  // 3개월 초과 시 경고 메시지 (값 변경 없음)
  let maxToDate = addMonths(fromDate, 6);
  if (toDate > maxToDate) {
    alert("최대 6개월까지만 선택 가능합니다. EDU_DATE_TO를 확인하세요.");
  }

  if(data.target.value > searchParams.EDU_DATE_TO){
    searchParams.EDU_DATE_TO = searchParams.EDU_DATE_FROM
  }
}

// 기간(TO)이 FR보다 낮을 경우 TO와 FR값을 같게 함
const dateToChanged = data => {
  if(data.target.value < searchParams.EDU_DATE_FROM){
    searchParams.EDU_DATE_FROM = searchParams.EDU_DATE_TO
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
// 조회 전 유효성 검사
const beforeSearch = () => {
  // console.log("조회전 파람 검사",searchParams)
  // if(isNullCheck(searchParams.ASGN_CD)){
  //   Message.warn(t('부서는 필수입력입니다.'))
  //   return
  // }
  // if(searchParams.CHK_YN !== 'Y' && isNullCheck(searchParams.TARGET_ID)){
  //   Message.warn(t('소속인원전체 조회를 체크하지 않았을 경우에는 이수자가 필수입니다.'))
  //   return false
  // }
  return true
}

// 리스트 조회
const searchData = () => {

  const searchParamsCopy = {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    DIVISION : searchParams.DIVISION,
    //DIVISION : 'D',
    //CURR_ID : 'C079',
    CURR_ID	 : searchParams.CURR_ID,		
    DATE_FR : dayjs(searchParams.EDU_DATE_FROM).format('YYYYMMDD'),
    DATE_TO	: dayjs(searchParams.EDU_DATE_TO).format('YYYYMMDD'),
  }
  //console.log("조회 파라미터 ::::::: ",searchParamsCopy)
  return commonSearchApi({ queryId : 'EDUAB0080_SEARCH_01', param: searchParamsCopy })
}


// 리스트 조회 후
const afterSearch = res => {
  //console.log("조회된 데이터 확인",res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

onMounted( () => {
  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.getGridView().setFocus(0) //행 0으로
  initCodeList()
})


</script>

<template>
  <v-card class="pa-0 fill-height">
    
    <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <!-- 조회조건 -->
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-input labelWidth="35px" width="205px" 
              :label="$t('기간')" type="date"
              v-model="searchParams.EDU_DATE_FROM"
              @blur="dateFrChanged"
              margin="10px"
            />
            <i-input width="190px"
              :label="$t('-')" type="date"
              v-model="searchParams.EDU_DATE_TO"
              @blur="dateToChanged"
            />
            <i-select
              :label="$t('구분')"
              v-model="searchParams.DIVISION"
              :items="codeList.division"
              item-title="TXT"
              item-value="COD"
              width="200px"
            />
            <i-select
              :label="$t('교육명')"
              v-model="searchParams.CURR_ID"
              :items="codeList.currId"
              item-title="TXT"
              item-value="COD"
              width="400px"
            />
          </div>
        </v-sheet>
        <!-- 메인그리드 -->
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
            <IGridTitle 
              ref="MainGrd"
              :button-list="['btnCertPrint']"
              @click-button="btnMainGrd"
            >
              <template #editors />
            </IGridTitle> 
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellItemClicked = cellBtnClick
          />
        </v-sheet>
      </div>
    </v-card-text>
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
  
