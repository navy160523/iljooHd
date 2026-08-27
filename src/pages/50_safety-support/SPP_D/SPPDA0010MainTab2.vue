<!-- SPPDB0010 위험기계기구 안전검사 -->
<!-- SI2팀 김성근 2024-04-09 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";
import { commonSearchApi, getCodeList } from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import SPPDA0010Add from '@/pages/50_safety-support/SPP_D/SPPDA0010PopUp1.vue'
import SPPDA0010Reg from '@/pages/50_safety-support/SPP_D/SPPDA0010PopUp3.vue'

defineOptions({
  name:'50_safety-support-SPP_D-SPPDA0010',
})
const unitCost = ref(null)
const userStore =  useUserStore()
const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  PLAN_DT_TO:dayjs().format('YYYY-MM-DD'),
  PLAN_DT_FR:dayjs().format('YYYY-01-01'),
  TEST_CMPNY_DIV:userStore.cmpnyDiv  
})
const codeList =reactive([])
const NewTestPopUp = ref(null)
const TestResultPopUp = ref(null)

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : ['TEST_ID'],
  fields : [ 
    { fieldName: 'PLAN_DT', dataType: 'text', width: '150', header: { text: t('검사일정') } },
    { fieldName: 'STATUS_NM', dataType: 'text', width: '80', header: { text: t('상태명') } },
    { fieldName: 'REMARK', dataType: 'text', width: '150', type: 'data', header: { text: t('비고') }, styleName:'left-column' },

     // 출력 안함
    { fieldName: 'TEST_ID', dataType: 'text' , visible: false },
    { fieldName: 'STATUS', dataType: 'text' , visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'PLAN_DT_FROM', dataType:'text', visible:false },
    { fieldName: 'PLAN_DT_TO', dataType:'text', visible:false },
    { fieldName: 'ATTACH_ID', dataType:'text', visible:false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { stateBar: { visible: false } , edit: { editable:false } },
  keys : ['PLAN_DT'],
  fields : [ 
    { fieldName: 'EQUIP_KIND', dataType: 'text', width: '100', header: { text: t('장비군') }, lookupDisplay:true },
    { fieldName: 'MANAGE_DEPT_NM', dataType: 'text', width: '120', header: { text: t('관리부서') }, styleName:'left-column' },
    { fieldName: 'CHARGE_EMP_NM', dataType: 'text', width: '120', type: 'data', header: { text: t('담당자') } },
    { fieldName: 'ITMANAGER_EMPNM', dataType: 'text', width: '120', type: 'data', header: { text: t('사용부서 담당자') } },
    { fieldName: 'EQUIP_NO', dataType: 'text', width: '120', type: 'data', header: { text: t('장비번호') } },
    { fieldName: 'TRMS_NO', dataType: 'text', width: '120', type: 'data', header: { text: t('설비번호') } },
    { fieldName: 'STATUS', dataType: 'text', width: '120', type: 'data', header: { text: t('장비상태') } , lookupDisplay:true },
    { fieldName: 'INSTALL_PLACE', dataType: 'text', width: '120', type: 'data', header: { text: t('설치위치') }, styleName:'left-column' },
    { fieldName: 'INSTALL_DT', dataType: 'date', datetimeFormat: 'yyyy-MM-dd', width: '120', type: 'data', header: { text: t('설치일자') } },
    { fieldName: 'MAKER', dataType: 'text', width: '120', type: 'data', header: { text: t('제조사') }, styleName:'left-column' },
    { fieldName: 'USE_DEPT_NM', dataType: 'text', width: '120', type: 'data', header: { text: t('사용부서') }, styleName:'left-column' },
    { fieldName: 'TEST_DIV', dataType: 'text', width: '120', type: 'data', header: { text: t('검사구분') }, lookupDisplay:true },
    { fieldName: 'TEST_DT', dataType: 'date', datetimeFormat: 'yyyy-MM-dd', width: '120', type: 'data', header: { text: t('인증/검사일자') } },
    { fieldName: 'TEST_RESULT', dataType: 'text', width: '100', header: { text: t('검사결과') } },
    { fieldName: 'PASS_NO', dataType: 'text', width: '100', header: { text: t('합격번호') } },
    { fieldName: 'EXPIRATION', dataType: 'text', width: '100', header: { text: t('검사유효기간') } },
    { fieldName: 'RETEST_DT', dataType: 'text', width: '100', header: { text: t('차기검사년도') } },
    { fieldName: 'TEST_AGENCY', dataType: 'text', width: '100', header: { text: t('검사기관') }, lookupDisplay:true, styleName:'left-column'},
    { fieldName: 'INSPECTOR', dataType: 'text', width: '100', header: { text: t('검사원') },lookupDisplay:true },
    { fieldName: 'EXCEPT_YN', dataType: 'text', width: '100', header: { text: t('검사제외') } },
    { fieldName: 'EXCEPT_REASON', dataType: 'text', width: '100', header: { text: t('제외사유') } },
    { fieldName: 'CFM_EMP_NM', dataType: 'text', width: '100', header: { text: t('확인자') } },
    { fieldName: 'CFM_DATE', dataType: 'text', width: '100', header: { text: t('확인일자') } },
    { fieldName: 'REMARK', dataType: 'text', width: '100', header: { text: t('비고') }, styleName:'left-column' },
    { fieldName: 'EQUIP_KIND2', dataType: 'text', width: '100', header: { text: t('장비ID') }, lookupDisplay:true},
    { fieldName: 'EQUIP_SEQ', dataType: 'text', width: '100', header: { text: t('장비ID') }},
    {
      fieldName: "EQUIP_SIZE_DETAIL",
      styleName: "right-column",
      dataType: "text",
      header: { text: t("용량(TON)") },
    },
    {
      fieldName: "EQUIP_SIZE",
      styleName: "right-column",
      dataType: "text",
      header: { text: t("전체용량") },
    },
    { fieldName: 'UNIT_COST', dataType: 'number', numberFormat: '#,###', width: '100', header: { text: t('수수료') }},





     // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'CFM_YN', dataType: 'text' , visible: false, header: { text: t('부서확인') } },
    { fieldName: 'TEST_ID', dataType: 'text' , visible: false },
  ],
  columns : [],
  columnLayout: [
    'EQUIP_KIND',
    'MANAGE_DEPT_NM',
    'CHARGE_EMP_NM',
    'ITMANAGER_EMPNM',
    'EQUIP_NO',
    'TRMS_NO',
    'STATUS',
    {
      name: '설치사양',
      direction: 'horizontal',
      items: [
      'INSTALL_PLACE',
      'INSTALL_DT',
      'MAKER',
      ],
      header: {
        text: t('설치사양'),
      },
    },
    'USE_DEPT_NM',
    {
      name: '안전검사/인증',
      direction: 'horizontal',
      items: [
      'TEST_DIV',
      'TEST_DT',
      'TEST_RESULT',
      'PASS_NO',
      'EXPIRATION',
      'RETEST_DT',
      'TEST_AGENCY',
      'INSPECTOR',
      'EXCEPT_YN',
      'EXCEPT_REASON',
      ],
      header: {
        text: t('안전검사/인증'),
      },
    },
    {
      name: '부서확인',
      direction: 'horizontal',
      items: [
        'CFM_EMP_NM',
        'CFM_DATE'
      ],
      header: {
        text: t('부서확인'),
      },
    },
    'REMARK',
    {
      name: '장비ID',
      direction: 'horizontal',
      hideChildHeaders: true,
      items: [
      'EQUIP_KIND2',
      'EQUIP_SEQ',
      ],
      header: {
        text: t('장비ID'),
      },
    },
    "EQUIP_SIZE_DETAIL",
    "EQUIP_SIZE",
    'UNIT_COST',
    
  ]
})

grdSubProps.columns = grdSubProps.fields


onMounted(() => {
  Promise.all([ 
  getCodeList("HHIZ000"), //회사구분 조회
  getCodeList("HHIFB120"), //상태 조회
  getCodeList("HHIF810"), //장비군
  getCodeList("HHIFB110"), //장비상태
  getCodeList("HHIFB130"), //검사구분
  getCodeList("HHIF816"), //검사기관
  
  ])
  .then((res)=>{
      codeList.company = res[0].ORESULT_CUR;
      codeList.STATUS = res[1].ORESULT_CUR.filter(x => x.TXT != '부서확인' && x.TXT != '안전확인/검사중');
      codeList.STATUS.unshift({ TXT: "전체", COD: ""  });
   
      grdSub.value.setBindingColumn("EQUIP_KIND",res[2].ORESULT_CUR,"COD","TXT");
      grdSub.value.setBindingColumn("EQUIP_KIND2",res[2].ORESULT_CUR,"COD","TXT");
      grdSub.value.setBindingColumn("STATUS",res[3].ORESULT_CUR,"COD","TXT");
      grdSub.value.setBindingColumn("TEST_DIV", res[4].ORESULT_CUR, "COD","TXT");
      grdSub.value.setBindingColumn("TEST_AGENCY", res[5].ORESULT_CUR, "COD","TXT");
    })

  grdMain.value.getGridView().setSortingOptions({
    enabled: false
  })

})

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run();
  }
  if(btn.id==='btnModPlan'){
    let chkRow = grdMain.value.getFocusedRowData()
    NewTestPopUp.value.openPopup(chkRow)
  }
  if(btn.id==='btnResultRegistraion'){
    let chkRow = grdMain.value.getFocusedRowData()
    TestResultPopUp.value.openPopup(chkRow)
  }
}

// 조회
const searchData01 = (idx) => {  
  let search = {}

  search = {...searchParams}

  if(search.PLAN_DT_TO){
    search.PLAN_DT_TO = dayjs(search.PLAN_DT_TO).format('YYYYMMDD')
  }

  return commonSearchApi({
    queryId: "SPPDA0010_SEARCH_05",
    param: search,
  })
};

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getGridView().setCurrent(0) 
  onSelected()
};

// 메인 그리드 셀 클릭 시 서브 그리드 데이터 조회
const onSelected = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData02)
    .setAfter(afterSearch02)
    .run()

    let row = grdMain.value.getFocusedRowData()

    //버튼 비활성화
     if(row.STATUS > 10 ){
       menuTitle.value.disableBtn("btnModPlan", false)
     }else{
       menuTitle.value.disableBtn("btnModPlan", false)
     }

}

const searchData02 = (idx) => {  
  unitCost.value = null
  let search = {}
  let row = grdMain.value.getFocusedRowData()
  search = {
    CMPNY_DIV	: row.CMPNY_DIV,
    TEST_ID		: row.TEST_ID,
    CHARGE_EMP_NO	: '',
  }

  return commonSearchApi({
    queryId: "SPPDA0010_SEARCH_06",
    param: search,
  })
};

const afterSearch02 = (res) => {
  unitCost.value = 0
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)

  res.ORESULT_CUR.forEach(x => {
    unitCost.value += x.UNIT_COST ? x.UNIT_COST : 0
  });
  unitCost.value = unitCost.value.toLocaleString('ko-KR')
};

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnModPlan','btnResultRegistraion']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
        <div class="d-flex mb-3">
          <i-select
            width="220px"
            :label="$t('회사')"
            label-width="49px"
            margin="10px"
            placeholder="회사"
            v-model="searchParams.CMPNY_DIV"
            :items="codeList.company"
            item-value="COD"
            item-title="TXT"
            required
          />
          <i-input
            width="210px"
            :label="$t('검사계획일')"
            v-model="searchParams.PLAN_DT_FR"
            type="date"
            margin="4px"
          />
          <i-input
            width="160px"
            :label="$t('-')"
            type="date"
            v-model="searchParams.PLAN_DT_TO"
            margin="10px"
            />
            <i-select
            :label="$t('진행상태')"
            width="180px"
            margin="10px"
            v-model="searchParams.STATUS"
            :items="codeList.STATUS"
            item-value="COD"
            item-title="TXT"
          />

        </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <div class="d-flex fill-height">
            <v-sheet width="25%" class="mb-3">
            <IGridTitle :title="$t('검사일정')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onSelected"
            />
          </v-sheet>
          <v-sheet class="h-auto ml-3">
            <IGridTitle :title="$t('검사대상')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"
            />
            <div>수수료 합계: {{ unitCost }}</div>
          </v-sheet>          
        </div>
        
        </v-sheet>
      </div>
    </v-card-text>
    <SPPDA0010Add ref ='NewTestPopUp' @reSearch="onButtonsClick({id: 'btnSearch'} )"/>
    <SPPDA0010Reg ref ='TestResultPopUp'  @reSearch="onButtonsClick({id: 'btnSearch'} )" />    
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 219px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
