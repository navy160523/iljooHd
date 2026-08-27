<!-- SAFHA0010 승선자(POB) 현황 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import SAFHA0010Popup from '@/pages/30_safety/SAF_H/Popup/SAFHA0010Popup01.vue'

defineOptions({
  name: "30_safety-SAF_H-SAFHA0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const deptPopup = ref(null)
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const grdSub1 = ref(null)

const sAFHA0010Popup = ref(null)

//코드리스트
const codeList = reactive({
  statusList : [
    { COD : '',   TXT : '전체'},
    { COD : '10', TXT : '제·개정 내역 입수'},
    { COD : '20', TXT : '조치 담당자 지정'},
    { COD : '30', TXT : '법규 조치 (업무반영 및 공지)'},
    { COD : '40', TXT : '완료'},
  ], //진행상태 콤보
  PART_GUBN : [],
  NOTICE_GUBN : [],

  WORK_CD : [],
  DKQUAY_CD : []
})

const searchParams = reactive({

  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  ASGN_NM: '',
  ASGN_FULL_NM: '',
  ORGN_DIV: '',
  
  WORKDATE_FROM : dayjs().format("YYYY-MM-DD"), 
  WORKDATE_TO : dayjs().format("YYYY-MM-DD"),

  WORK_CD : '',
  DKQUAY_CD : '',
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId: "SAFHA0010_SEARCH_01", param: { ALL_YN : 'N' }, }),
    commonSearchApi({
      queryId: "searchCommonCode",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: userStore.cmpnyDiv+"Z010BA",
        USE_FLAG: "Y",
        CODE_NAME_TYPE: "0",
      },
    }),
    commonSearchApi({
      queryId: "searchCommonCode",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: userStore.cmpnyDiv+"Z010BB",
        USE_FLAG: "Y",
        CODE_NAME_TYPE: "0",
      },
    }),
  ]).then((res) => {
    res[1].ORESULT_CUR.forEach(e => {
      e.COD = 'HHIZ010BA'+e.COD
    })
    res[2].ORESULT_CUR.forEach(e => {
      e.COD = 'HHIZ010BB'+e.COD 
    })
    codeList.WORK_CD = [{TXT: '전체', LOCOD: '', COD: ''}].concat(res[0].ORESULT_CUR)
    codeList.DKQUAY_CD = [{TXT : '전체', CODE_DESC1 : '', COD: ''}].concat(res[1].ORESULT_CUR.concat(res[2].ORESULT_CUR))
  })
}

const openPopup = gbn => {
  if(gbn === '부서조회'){
    deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.ASGN_NM })
  } 
}

const onDeptSelected = val => {
  if(val.ORGN_DIV === 'A'){
    searchParams.DEPT_CD = val.DEPT_CD
    searchParams.ASGN_CD = val.ASGN_CD
    searchParams.ASGN_NM = val.ASGN_SHRT_NM
  }
  else{
    searchParams.DEPT_CD = val.DEPT_CD
    searchParams.ASGN_CD = val.ASGN_CD
    searchParams.ASGN_NM = val.ASGN_SHRT_NM
  }
// searchParams.ASGN_FULL_NM = val.ASGN_FULL_NM
// onButtonsClick({ id: 'btnSearch' })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height:60 }, edit: { editable: false }, footer: { visible: true }  },
  keys : [],
  fields : [ 
    
    { fieldName: 'SHIP', dataType: 'text', width: '60', header: { text: t('호선') } , mergeRule: { "criteria": "value" }, },
    { fieldName: 'DIV_L_NM', dataType: 'text', width: '80', header: { text: t('대구역') } , mergeRule: { "criteria": "prevvalues + value" }, },
    { fieldName: 'DIV_M_NM', dataType: 'text', width: '120', header: { text: t('중구역') } , },
    { fieldName: 'NM_NUMBER', dataType: 'number', width: '50', header: { text: t('실시간\n승선인원'), styleName: 'multiline-editor' }, numberFormat: "#,###", footer: { numberFormat: "#,###", expression: "sum" }, },
    
    { fieldName: 'RISK_DIV_L', dataType: 'text', visible : true , },
    { fieldName: 'RISK_DIV_M', dataType: 'text', visible : true , },
  ],
  columns : [],
  columnLayout: [
    'SHIP', 
    'DIV_L_NM', 
    'DIV_M_NM', 
    'NM_NUMBER', 
  ],
})
grdMainProps.columns = grdMainProps.fields

const grdSub1Props = reactive({
  gridViewOption : { header: { height:60 }, edit: { editable: false }, footer: { visible: true }  },
  keys : [],
  fields : [ 
    
    { fieldName: 'WORK_DATE', dataType: 'text', width: '70', header: { text: t('작업일') } , },
    { fieldName: 'WORK_TITLE', dataType: 'text', width: '120', header: { text: t('작업명') } , },
    { fieldName: 'WORK_TIME', dataType: 'text', width: '60', header: { text: t('작업시작시간') } , },
    { fieldName: 'WORK_END_TIME', dataType: 'text', width: '60', header: { text: t('작업종료시간') } , },
    { fieldName: 'ORGN_DIV', dataType: 'text', width: '60', header: { text: t('구분') } , },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', width: '100', header: { text: t('작업조직') } , },
    { fieldName: 'RESP_EMP_INFO', dataType: 'text', width: '100', header: { text: t('작업지시자') } , },
    { fieldName: 'IN_SUM', dataType: 'number', width: '40', header: { text: t('승선인원') }, numberFormat: "#,###", footer: { numberFormat: "#,###", expression: "sum" } , },
    { fieldName: 'OUT_SUM', dataType: 'number', width: '40', header: { text: t('하선인원') }, numberFormat: "#,###", footer: { numberFormat: "#,###", expression: "sum" } , },
    { fieldName: 'DKQUAY_NM', dataType: 'text', width: '60', header: { text: t('작업장소') } , },
    
    // { fieldName: 'SOL_DATE', dataType: 'text', visible : false , },
  ],
  columns : [],
  columnLayout: [
    'WORK_DATE', 
    'WORK_TITLE',
    'WORK_TIME', 
    'WORK_END_TIME', 
    'ORGN_DIV', 
    'ASGN_FULL_NM', 
    'RESP_EMP_INFO',
    'IN_SUM', 
    'OUT_SUM', 
    'DKQUAY_NM', 
  ],
})
grdSub1Props.columns = grdSub1Props.fields


//메인 버튼 실행
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    numberSearch()

    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnQrCodePrint') {
    sAFHA0010Popup.value.openPopup()
  }
}

const IN_NUMBER = ref('')
const OUT_NUMBER = ref('')


const numberSearch = async() => {
  commonSearchApi({ queryId : 'SAFHA0010_SEARCH_02', param: searchParams }).then(res => {
    IN_NUMBER.value = res.ORESULT_CUR[0].IN_NUMBER
    OUT_NUMBER.value = res.ORESULT_CUR[0].OUT_NUMBER
  })
}

const searchData = () => {
  return commonSearchApi({ queryId : 'SAFHA0010_SEARCH_03', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellClicked = async (grid, clickData) => {
  let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  let paramData = {}
  if(clickData.fieldName === 'SHIP'){
    paramData = {SHPNO : rowData.SHIP, DIV_L : '', DIV_M : '', WORKDATE_FROM: searchParams.WORKDATE_FROM, WORKDATE_TO:searchParams.WORKDATE_TO, DEPT_CD : searchParams.DEPT_CD, ASGN_CD : searchParams.ASGN_CD,   GUBN : 'S', DKQUAY_CD : searchParams.DKQUAY_CD}
  } else if(clickData.fieldName === 'DIV_L_NM'){
    paramData = {SHPNO : rowData.SHIP, DIV_L : rowData.RISK_DIV_L, DIV_M : '', WORKDATE_FROM: searchParams.WORKDATE_FROM, WORKDATE_TO:searchParams.WORKDATE_TO, DEPT_CD : searchParams.DEPT_CD, ASGN_CD : searchParams.ASGN_CD, GUBN : 'L', DKQUAY_CD : searchParams.DKQUAY_CD}
  } else if(clickData.fieldName === 'DIV_M_NM'){
    paramData = {SHPNO : rowData.SHIP, DIV_L : rowData.RISK_DIV_L, DIV_M : rowData.RISK_DIV_M, WORKDATE_FROM: searchParams.WORKDATE_FROM, WORKDATE_TO:searchParams.WORKDATE_TO, DEPT_CD : searchParams.DEPT_CD, ASGN_CD : searchParams.ASGN_CD, GUBN : 'M', DKQUAY_CD : searchParams.DKQUAY_CD}
  }
  await commonSearchApi({ queryId : 'SAFHA0010_SEARCH_04', param: paramData }).then(res => {
    grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
  })

}

watch(() => [searchParams.WORKDATE_FROM, searchParams.WORKDATE_TO, searchParams.WORK_CD, searchParams.DKQUAY_CD, searchParams.DEPT_CD],([newValueWORKDATE_FROM, newValueWORKDATE_TO, newValueWORK_CD, newValueDKQUAY_CD, newValueDEPT_CD], [oldValueWORKDATE_FROM, oldValueWORKDATE_TO, oldValueWORK_CD, oldValueDKQUAY_CD, oldValueDEPT_CD]) => {
  grdMain.value.getDataProvider().setRows()
  grdSub1.value.getDataProvider().setRows()
  IN_NUMBER.value = '0'
  OUT_NUMBER.value = '0'
})

//초기 데이터셋팅
onMounted(() => {
  initCodeList()
  onButtonsClick({ id :'btnSearch' })
  vm.$nextTick(() => {
    // initCombo()
    // onButtonsClick({ id :'btnSearch' })
  })  
})
</script>

<template>
  <v-card class="pa-0 fill-height"> 
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnQrCodePrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">  
          <i-input
            :label="$t('작업일')"
            v-model="searchParams.WORKDATE_FROM"
            width="200px"
            type="date"
            class="mr-0"
            required
          />
          <span class="ma-2">~</span>
          <i-input
            v-model="searchParams.WORKDATE_TO"
            width="150px"
            type="date"
          />

          <i-select
            width="200px"
            :label="$t('장소')"
            v-model="searchParams.DKQUAY_CD"
            :items="codeList.DKQUAY_CD"
            item-value="COD"
            item-title="TXT"
          />

          <i-select
            width="200px"
            :label="$t('호선')"
            v-model="searchParams.WORK_CD"
            :items="codeList.WORK_CD"
            item-value="COD"
            item-title="TXT"
          />

          <i-input 
              :label="$t('부서/ 협력사')"
              label-width="80px"
              width="350px"
              v-model="searchParams.ASGN_NM" 
              append-inner-icon="mdi-magnify" 
              @keydown.enter="e => {
                openPopup('부서조회')
              }"
              @update:modelValue="e => { searchParams.DEPT_CD = null
                                        searchParams.ASGN_CD = null}"
              @click:appendInner="openPopup('부서조회')"
              class="ma-0 mr-1"
            />
            <i-input
              v-model="searchParams.DEPT_CD" 
              readonly 
              width="100px"
            />
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        
        <v-sheet height="95%" class="d-flex">
          <v-sheet class="mr-3" width="30%">
            <div class="d-flex justify-space-between">
              <IGridTitle :title="$t('호선 구역별 승선 현황')"/>
              <div class="d-flex">
                <i-input
                  :label="$t('승선')"
                  v-model="IN_NUMBER"
                  width="120px"
                  readonly
                />
                  <!-- v-model="searchParams.WORKDATE_FROM" -->
                <i-input
                  :label="$t('하선')"
                  v-model="OUT_NUMBER"
                  width="120px"
                  readonly
                />
              </div>
            </div>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
          <v-sheet class="mr-2" width="70%">
            <IGridTitle :title="$t('상세보기')"/>
            <RealGrid
              ref="grdSub1"
              class="mt-2"
              :grid-view-option="grdSub1Props.gridViewOption"
              :keys="grdSub1Props.keys" 
              :fields="grdSub1Props.fields"
              :columns="grdSub1Props.columns"
              :column-layout="grdSub1Props.columnLayout"
            />
          </v-sheet>
        </v-sheet>
      </div>
    </v-card-text>    
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
    <!-- POB QR -->
    <SAFHA0010Popup ref="sAFHA0010Popup" />
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