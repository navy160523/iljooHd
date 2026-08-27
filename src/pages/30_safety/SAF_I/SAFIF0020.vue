<!-- SAFIF0020 협력사 협의회 이행 모니터링 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import SAFIF0020Popup from '@/pages/30_safety/SAF_I/SAFIF0020Popup.vue'
import OZReport from '@/components/OZReport.vue'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'30_safety-SAF_I-SAFIF0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null) 
const grdSub = ref(null)
const sAFIF0020Popup = ref(null) // 상세 팝업

// OzReport 팝업 여부
const showOz = ref(false)
const params = ref([])
const reportName = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.company,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  ASGN_NM: '',
  YEAR: dayjs().get("year"),
  HARF: 'A',
  GBN: 'A',
})

// 코드리스트 선언
const codeList = reactive({
  BSNSList: [], //사업부
  DEPTList: [], //부서
  GBNList: [
    {TXT: '담당별 부서', COD: 'A'},
    {TXT: '안전보건관리책임자별 부서', COD: 'B'},
  ], //부서
  BSNSList2: [
    {BSNS_NM: '전체' , BSNS_CD: ''}, 
    {BSNS_NM: '조선' , BSNS_CD: 'A'},
    {BSNS_NM: '해양에너지' , BSNS_CD: 'B'},
    {BSNS_NM: '특수선' , BSNS_CD: 'C'},
    {BSNS_NM: '엔진기계' , BSNS_CD: 'D'},
    {BSNS_NM: '경영지원/기타' , BSNS_CD: 'E'},
    {BSNS_NM: '자산' , BSNS_CD: 'F'},
    {BSNS_NM: '냉천/문산' , BSNS_CD: 'G'},
    {BSNS_NM: '군산' , BSNS_CD: 'H'},
  ],
  list: []
})

const halfList = reactive([
  {COD: 'A', TXT: '상반기'},
  {COD: 'B', TXT: '하반기'},
])

//그리드 속성셋팅(상반기)
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, header: { height: 60 }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', width: '100', header: { text: t('사업부'), styleName: 'multiline-editor' } },   
    { fieldName: 'M12', dataType: 'text', width: '120', header: { text: t('12월') } },
    { fieldName: 'M01', dataType: 'text', width: '120', header: { text: t('1월') } },
    { fieldName: 'M02', dataType: 'text', width: '120', header: { text: t('2월') } },
    { fieldName: 'M03', dataType: 'text', width: '120', header: { text: t('3월') } },
    { fieldName: 'M04', dataType: 'text', width: '120', header: { text: t('4월') } },
    { fieldName: 'M05', dataType: 'text', width: '120', header: { text: t('5월') } }, 
    { fieldName: 'DESC', dataType: 'text', width: '120', header: { text: t('비고') } },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false }
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM', 
    {
      name: '협의회 운영 실적',
      direction: 'horizontal',
      items: [ 'M12', 'M01', 'M02', 'M03', 'M04', 'M05' ],
    },
    'DESC',
  ],
  fields2 : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', width: '100', header: { text: t('사업부'), styleName: 'multiline-editor' } },   
    { fieldName: 'M06', dataType: 'text', width: '120', header: { text: t('6월') } },
    { fieldName: 'M07', dataType: 'text', width: '120', header: { text: t('7월') } },
    { fieldName: 'M08', dataType: 'text', width: '120', header: { text: t('8월') } },
    { fieldName: 'M09', dataType: 'text', width: '120', header: { text: t('9월') } },
    { fieldName: 'M10', dataType: 'text', width: '120', header: { text: t('10월') } },
    { fieldName: 'M11', dataType: 'text', width: '120', header: { text: t('11월') } }, 
    { fieldName: 'DESC', dataType: 'text', width: '120', header: { text: t('비고') } },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false }
  ],
  columnLayout2: [
    'BSNS_NM', 
    {
      name: '협의회 운영 실적',
      direction: 'horizontal',
      items: [ 'M06', 'M07', 'M08', 'M09', 'M10', 'M11' ],
    },
    'DESC',
  ],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { header: { height: 90 }, stateBar: { visible: false } },
  keys : ['COL01'],
  fields : [             
    { fieldName: 'BSNS_NM', dataType: 'text', width: '130', editable: false, header: { text: t('사업부') },mergeRule: { "criteria": "value" } },
    // { fieldName: 'COL02', dataType: 'text', width: '130', editable: false, header: { text: t('부문') } }, 
    { fieldName: 'ASGN_SHRT_NM', dataType: 'text', width: '130', editable: false, header: { text: t('담당') },mergeRule: { "criteria": "value" } },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '130', editable: false, header: { text: t('관리 부서') },mergeRule: { "criteria": "value" }},
    { fieldName: 'idx', dataType: 'text', width: '50', editable: false, header: { text: t('순') } },
    { fieldName: 'ACTION_TARGET_CNT', dataType: 'text', width: '110', editable: false, header: { text: t('종사자 의견\n(조치대상 건수)'), styleName: 'multiline-editor' } },
    { fieldName: 'COMPLETION_STATUS', dataType: 'text', width: '130', editable: false, header: { text: t('조치완료') } }, 
    { fieldName: 'DANGI', dataType: 'text', width: '130', editable: false, header: { text: t('단기') } },
    { fieldName: 'JUNGGI', dataType: 'text', width: '130', editable: false, header: { text: t('중기') } },
    { fieldName: 'JANGGI', dataType: 'text', width: '130', editable: false, header: { text: t('장기') } },
    { fieldName: 'REV_CNT', dataType: 'text', width: '200', editable: false, header: { text: t('검토중') } },
    { fieldName: 'COL12', dataType: 'text', width: '200', editable: false, header: { text: t('비고') } },
  ],
  columns : [],
  columnLayout: [
    {
      name: '구분',
      direction: 'horizontal',
      items: [ 'BSNS_NM', 'ASGN_SHRT_NM', 'DEPT_NM' ],
      header: {
        text: t('구분'),
      },
    },
    'idx', 'ACTION_TARGET_CNT',    
    {
      name: "조치이행현황",
      direction: "horizontal",
      items: [
        "COMPLETION_STATUS",  
        {
          name: "조치계획수립",
          direction: "horizontal",
          items: ["DANGI", "JUNGGI", "JANGGI"],
        },
      ],
    },
    'REV_CNT', 'COL12', 
  ],
})

grdSubProps.columns = grdSubProps.fields

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch')
  {
    // 상단 그리드
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()

    // 하단 그리드
    new queryFlowHelper(vm, t)
      .setGridList([grdSub])
      .setQuery(searchData02)
      .setAfter(afterSearch02)
      .showMessage(false)
      .run()
  } 
  else if (btn.id === 'btnDetail') {  // 상세
    sAFIF0020Popup.value.openPopup({
      YEAR: searchParams.YEAR,
      HARF: searchParams.HARF,
      BSNS_CD: '',
      GBN: searchParams.GBN,
    })
  } 
  else if (btn.id === 'btnPrint') {
    if(grdMain.value.getDataProvider().getRowCount() === 0){
      return Message.warn(t('조회된 데이터가 없습니다. 조회후 눌러주세요.'))
    }
    params.value = []
    params.value = [
      "IN_YEAR="+searchParams.YEAR,
      "IN_BSNS_CD="+searchParams.BSNS_CD,
      "IN_HARF="+searchParams.HARF,
    ]
    if(searchParams.HARF === 'A'){
      reportName.value = '/manage/hse/SAFIF0020_01.ozr'
    }else {
      reportName.value = '/manage/hse/SAFIF0020_02.ozr'
    }
    showOz.value = true
  } 
}

const print2 = () => {
  if(grdSub.value.getDataProvider().getRowCount() === 0){
      return Message.warn(t('조회된 데이터가 없습니다. 조회후 눌러주세요.'))
    }
  params.value = []
  params.value = [
    "IN_YEAR="+searchParams.YEAR,
    "IN_BSNS_CD="+searchParams.BSNS_CD,
    "IN_HARF="+searchParams.HARF,
  ]
  reportName.value = '/manage/hse/SAFIF0020_03.ozr'
  showOz.value = true
}

/* -------------- 조회 -------------- */
const searchData01 = () => {
  return commonSearchApi({ queryId : 'SAFIF0020_SEARCH_01', param: searchParams })
}
const afterSearch01 = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 서브 그리드
const searchData02 = () => {
  return commonSearchApi({ queryId : 'SAFIF0020_SEARCH_02', param: searchParams })
}
const afterSearch02 = res => {
  let cnt = 1
  res.ORESULT_CUR.forEach(e => {
    e.idx = cnt++
  });
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellDblClicked = async (grid, clickData) => {
  if(clickData.cellType === 'data' && clickData.fieldName === 'BSNS_NM'){
    let rowData = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    sAFIF0020Popup.value.openPopup({
      YEAR: searchParams.YEAR,
      HARF: searchParams.HARF,
      BSNS_CD: searchParams.GBN === 'A' ? rowData.BSNS_CD : searchParams.BSNS_CD,
      GBN: searchParams.GBN,
    })

  }
}

const halfChange = e => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
  if(e === 'A'){
    grdMain.value.getDataProvider().setFields(grdMainProps.fields)
    grdMain.value.getGridView().setColumns(grdMainProps.fields)
    grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)
  }else {
    grdMain.value.getDataProvider().setFields(grdMainProps.fields2)
    grdMain.value.getGridView().setColumns(grdMainProps.fields2)
    grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout2)
  }
}

const gbnChange = e => {
  searchParams.BSNS_CD = ''
  codeList.list = []
  if(e === 'A'){
    codeList.list = codeList.BSNSList
  }else {
    codeList.list = codeList.BSNSList2
  }
  grdMain.value.getDataProvider().setRows([])
}

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' }, }),
    // commonSearchApi({ queryId : 'searchDept', param: { CMPNY_DIV: userStore.cmpnyDiv, ORGN_DIV: 'A', BSNS_CD: '', USE_ONLY: 'Y' } })
  ]).then((res) => {
    codeList.BSNSList = res[0].ORESULT_CUR
    // codeList.DEPTList = res[1].ORESULT_CUR
    codeList.BSNSList.unshift({ BSNS_NM:'전체', BSNS_CD: '' })

    codeList.list = codeList.BSNSList

    // grdMain.value.setBindingColumn("DEPT_NM", DEPTList, "DEPT_CD", "ASGN_SHRT_NM")
  })
}

onMounted(() => {
  initCodeList()
  if(dayjs().format("MM") > 6) searchParams.HARF = 'B'
  else searchParams.HARF = 'A'
}) 

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t('협력사 안전보건 협의회 이행 실적(상세화면)')"
        :button-list="['btnSearch', 'btnDetail', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('년도')"
            labelWidth="40px"
            v-model="searchParams.YEAR"
            type="Number"
            width="180px"
          />
          <i-select
            :label="$t('반기')"
            labelWidth="40px"
            v-model="searchParams.HARF"
            :items="halfList"
            item-title="TXT"
            item-value="COD"
            width="180px"
            @update:modelValue="halfChange"
          />
          <div class="d-flex align-center mr-3">
            <div class="formLabelText mr-5">
              {{ $t('구분') }}
            </div>
            <VRadioGroup
              v-model="searchParams.GBN"
              inline
              @change="gbnChange"
            >
              <VRadio
                v-for="(item , i) in codeList.GBNList"
                :key="i"
                :value="item.COD"
                :label="item.TXT"
              />
            </VRadioGroup>
          </div>
          <!-- <i-select 
            :label="$t('사업부')"
            labelWidth="50px"
            width="270px"
            :items="codeList.GBNList"
            item-title="TXT"
            item-value="COD"
            v-model="searchParams.GBN"
            class="mr-0"
            @update:modelValue="gbnChange"
          /> -->
          <i-select 
            :label="$t('')"
            width="200px"
            :items="codeList.list"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            v-model="searchParams.BSNS_CD"
          />
        </v-sheet>
        <v-sheet height="45%" class="mb-3">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          />          
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle
            :title="$t('협력사 종사자 의견청취 실적')"
            :button-list="['btnPrint']"
            @click-button="print2"
          />
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <SAFIF0020Popup 
      ref="sAFIF0020Popup" 
      :codeList="codeList"
    />
    <!-- OZReport -->
    <OZReport 
      :showPop="showOz" 
      :reportName="reportName" 
      :params="params" 
      @close="showOz = $event" />
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