<!-- SAFIG0020 합동안전보건점검 이행 모니터링 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from "@hiway/utils/notify";
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const dialog = ref(false)

const menuTitle = ref(null)
const grdMain = ref(null)
/* 코드 리스트 */
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  DATE_LIST: [],
  HALF_YEAR: [
    {COD: 'A', TXT: '상반기'}
    ,{COD: 'B', TXT: '하반기'}],
  CURRENT_ROW: '',
  COMP_TYPE: [
    {COD: '', TXT: ''}
    ,{COD: 'A', TXT: '프로젝트'}
    ,{COD: 'B', TXT: '사내'}
  ],
})

const inspector = [
    {COD: 'A', TXT: '조선'}
    ,{COD: 'B', TXT: '해양에너지'}
    ,{COD: 'C', TXT: '특수선'}
    ,{COD: 'D', TXT: '엔진기계'}
    ,{COD: 'E', TXT: '경영지원/기타'}
    ,{COD: 'F', TXT: '자산'}
    ,{COD: 'G', TXT: '냉천/문산'}
    ,{COD: 'H', TXT: '군산'}
]



//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: '',
  ASGN_CD: '',
  DEPT_NM: '',
  HALF_YEAR: 'A',
  YEAR_DATE: dayjs(new Date()).format("YYYY"),
})

// 초기 조회 코드 생성
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ 
      commonSearchApi({ queryId : 'MNG_searchCommonCode',
        param: { CMPNY_DIV: userStore.cmpnyDiv,
          ALL_UP_CD: 'HHIZ000', USE_FLAG: 'Y' } }),
      // SAVE_FLAG[2]
      commonSearchApi(
      { queryId : 'searchBSNS',
        param:{
          CMPNY_DIV: userStore.cmpnyDiv,
          USE_DIV: 'Y',
        }
      })
      ]).then(res => {
    // 회사
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    // 진행상태
    let startDate = dayjs(new Date).format('YYYY') - 40
    let endDate = dayjs(new Date).format('YYYY')

    for(let i = endDate; i > startDate; i--){
      codeList.DATE_LIST.push({COD:i.toString() ,TXT: i.toString()})
    }
    // codeList.HALF_YEAR.unshift({ TXT:'전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false },checkBar: { visible: true } },
  fields : [ 
    { fieldName: 'INSPECTOR', dataType: 'text', width: '100', header: { text: t('부문') }, editable: false},
    { fieldName: 'COMP_CNT', dataType: 'text', width: '100', header: { text: t('대상 협력사 수') }, editable: false,styleName:'right-column'},
    { fieldName: 'COUNT_0', dataType: 'text', width: '100', header: { text: t('0회') }, editable: false,styleName:'right-column'},
    { fieldName: 'COUNT_1', dataType: 'text', width: '100', header: { text: t('1회') }, editable: false,styleName:'right-column'},
    { fieldName: 'COUNT_2', dataType: 'text', width: '100', header: { text: t('2회') }, editable: false,styleName:'right-column'},
    { fieldName: 'COUNT_3', dataType: 'text', width: '100', header: { text: t('3회') }, editable: false,styleName:'right-column'},
    { fieldName: 'COUNT_4', dataType: 'text', width: '100', header: { text: t('4회') }, editable: false,styleName:'right-column'},
    { fieldName: 'COUNT_5', dataType: 'text', width: '100', header: { text: t('5회이상') }, editable: false,styleName:'right-column'},
    { fieldName: 'SUM', dataType: 'text', width: '100', header: { text: t('합계') }, editable: false,styleName:'right-column'},
    { fieldName: 'REMARK', dataType: 'text', width: '100', header: { text: t('비고') }, editable: false },
    
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'DIV_CD', dataType: 'text', visible: false },
    { fieldName: 'YEAR_DATE', dataType: 'text', visible: false },
    { fieldName: 'HALF_YEAR', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    "INSPECTOR",
    "COMP_CNT",
    {
      name: "안전보건점검 이행 횟수",
      direction: "horizontal",
      items: [
        "COUNT_0",
        "COUNT_1",
        "COUNT_2",
        "COUNT_3",
        "COUNT_4",
        "COUNT_5",
        "SUM",
      ],
      header: {
        text: t("안전보건점검 이행 횟수"),
      },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

// 메인 버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch')
  {
    Promise.all([ 
      // 메인 데이터 조회 (하단 그리드)
      commonSearchApi({ 
        queryId : 'SAFIG0020_SEARCH_01',
        param: searchParams }),
    ]).then(res => {
      const data = res[0].ORESULT_CUR
      console.log('data',data)
      data.forEach((e)=>{
        e.SUM = parseInt(e.COUNT_0) 
        + parseInt(e.COUNT_1)
        + parseInt(e.COUNT_2)
        + parseInt(e.COUNT_3)
        + parseInt(e.COUNT_4)
        + parseInt(e.COUNT_5)
      })
      data.forEach((e)=>{
        inspector.forEach((i)=>{
          if(e.INSPECTOR === i.COD){
            e.INSPECTOR = i.TXT
          }
        })
      })
      
      grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      // console.log('res',res[0].ORESULT_CUR)
  })
  } else if(btn.id === "btnPrint"){
    const excelFileNM = '합동안전보건점검 모니터링'
    const now = dayjs(new Date).format('YYYYMMDDHHmm')
    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }
    
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: now+'_'+excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.', 
      showProgress: true, 
      indicator: 'visible', 
      header: 'visible', 
      footer: 'hidden', 
      showColumns: [],
      hideColumns: [],
      allColumns: false,
    })
  } else if(btn.id === "btnClose"){
    onClose()
  }
}

/* -------------- 조회 -------------- */
// 메인 그리드
/* -------------- 추가 -------------- */
/* -------------- 저장 -------------- */
// 그리드 데이터 저장 전


/* -------------- 삭제 -------------- */

/* -------------- 팝업 오픈 -------------- */

// 협력사 그리드 팝업 버튼 이벤트
//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {  
  initCodeList()
  onButtonsClick({id: 'btnSearch'})
  //팝업 오픈
  dialog.value = true 
}
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
      <span>{{'협력사 합동안전 보건점검 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <!-- 타이틀 영역 
              타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
        <IMenuTitle
          ref="menuTitle"
          :title="$t('협력사 합동안전 보건점검')"
          :button-list="[ 'btnSearch' ,'btnPrint','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- content-area 해당 클래스의 이름은 필수 입니다. 
            다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
      <v-card-text class="pa-3 pt-0 content-area">
        <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('년도')"
              label-width="30px"
              width="150px"
              v-model="searchParams.YEAR_DATE"
              :items="codeList.DATE_LIST"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('반기')"
              label-width="40px"
              width="200px"
              v-model="searchParams.HALF_YEAR"
              :items="codeList.HALF_YEAR"
              item-value="COD"
              item-title="TXT"
            />
            <!-- <i-select
              :label="$t('사업부')"
              label-width="40px"
              width="200px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            /> -->
          </v-sheet>
          <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                        만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
          <v-sheet height="100%" class="mb-3">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>
      <!-- 부서검색 팝업 -->
      <!-- 협력사검색 팝업 -->
      <!-- pdf파일 UPLOAD 팝업 -->
    </v-card>
  </VDialog>
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
    min-height: 635px;
  }
}
</style>