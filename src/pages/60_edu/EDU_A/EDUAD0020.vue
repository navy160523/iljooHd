<!--
  화면명 : 협력사 안전교육 기성지급 상세
  화면개요 : 협력사의 안전교육 기성지급 내역을 볼 수 있는 화면.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from "@hiway/stores/logs"
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2 } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import dayjs from 'dayjs'

defineOptions({
  name:'60_edu-EDU_A-EDUAD0020',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const menuTitle = ref(null)
const gridTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const searchArea = ref(null)
const eDUAB0030Tab01Pop02Pop01 = ref(null)
// GRP00414(교육모듈관리자) 또는 admin 그룹은 부서 변경가능
const isAdmin = ref(null)

//콤보모델 리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS: [],
  DEPT: [],
  ASGN: [],
  DIVISION: [],
  CLOSE_YN: [{ TXT: '전체', COD: '' }, { TXT: '마감 완료', COD: 'Y' }, { TXT: '마감 미완료', COD: 'N' }],
  CURR_ID: [],
  BASE_COST: [],
})

//조회 저장등 v-model 리스트
const paramList = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: userStore.userDiv === 'A' ? '' : userStore.asgnCd,
  DIVISION: '',
  CURR_ID: '',
  CLOSE_YN: '',
  CLOSE_DTE: dayjs().format("YYYY-MM"),
  DATE_FR: dayjs().add(1 - dayjs().day(), 'day').format("YYYY-MM-DD"),
  DATE_TO: dayjs().add(-1, 'day').format("YYYY-MM-DD"),
  BASE_COST: '',
  BTN_CLOSE_YN: 'N',
  USE_DIV: 'Y',
})

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }  },
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, editable: false, width: '100' },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, styleName: 'left-column', editable: false, width: '100' },
    { fieldName: 'COMP_NM', dataType: 'text', header: { text: t('회사명') }, styleName: 'left-column', editable: false, width: '100' },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육명') }, styleName: 'left-column', editable: false, width: '160' },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('일자') }, editable: false, width: '140' },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사번') }, styleName: 'left-column', editable: false, width: '60' },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('성명') }, editable: false, width: '40' },
    { fieldName: 'EDU_HOUR', dataType: 'number', header: { text: t('이수시간') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '40' },
    { fieldName: 'LUNCH_CNT', dataType: 'number', header: { text: t('중식횟수') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '40' },
    { fieldName: 'TOT_COST', dataType: 'number', header: { text: t('금액') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '80' },
    { fieldName: 'VEND_CLOSE_KEY', dataType: 'text', header: { text: t('마감') }, editable: false, width: '40' },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//콤보박스 설정
const initCombo = () => {
  //담당 가능 과목, 강의 이력 데이터 바인딩
  Promise.all([
    getCodeList('HHID140','HHI','N','0',null,'Y'),
    getCodeList('HHIZ000'),
    getCodeList('HHID010'),
  ]).then(res => { 
    codeList.BASE_COST = res[0].ORESULT_CUR
    paramList.BASE_COST = codeList.BASE_COST[0].CODE_DESC1
    codeList.CMPNY_DIV = res[1].ORESULT_CUR
    codeList.DIVISION = res[2].ORESULT_CUR
    codeList.DIVISION.unshift({ COD: '', TXT: '전체' })
  })
  //사업부 설정
  setBsnsCombo()

  //부서 설정
  setDeptCombo('init')

  //협력사 설정
  setAsgnCombo()

  codeList.CURR_ID.push({ COD: '', TXT: '전체' })
}

//사업부 설정
const setBsnsCombo = () =>{
  codeList.BSNS = []
  codeList.DEPT = []
  codeList.ASGN = []
  codeList.BSNS.push({ BSNS_CD: '', BSNS_NM: '전체'  })
  commonSearchApi({ queryId : 'searchBSNS', param: paramList }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.BSNS.push(element)
    })
  })
}

//부서 설정
const setDeptCombo = gubn =>{ 
  let initTotal = { DEPT_CD: '', DEPT_NM: '전체'  }
  let paramDept = {
    CMPNY_DIV : paramList.CMPNY_DIV,
    BSNS_CD : '',
    USE_DIV : paramList.USE_DIV,
  }
  
  codeList.DEPT = []
  codeList.DEPT.push(initTotal)    
  paramDept.BSNS_CD = paramList.BSNS_CD

  commonSearchApi({ queryId : 'searchDept3', param: paramDept }).then(res => {
    res.ORESULT_CUR.forEach(element => {      
      codeList.DEPT.push(element)
    })
  })
}

//협력사 설정
const setAsgnCombo = () =>{
  codeList.ASGN = [{ ASGN_CD : '', ASGN_NM : '전체' }]
  commonSearchApi({ queryId : 'searchTeam', param: paramList }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.ASGN.push(element)
    })
  })
}

//회사구분 변경 이벤트
const updateCmpnyDiv = () =>{
  paramList.BSNS_CD = ''
  paramList.DEPT_CD = ''
  paramList.ASGN_CD = ''
  setBsnsCombo()
  gridRefresh()
}

//사업부 변경 이벤트
const updateBsns = () =>{
  paramList.DEPT_CD = ''
  paramList.ASGN_CD = ''
  setDeptCombo('main')
  gridRefresh()
}

//부서 변경 이벤트
const updateDept = () =>{
  paramList.ASGN_CD = ''
  setAsgnCombo()
  gridRefresh()
}

//분류 변경 이벤트
const updateDivision = () =>{
  codeList.CURR_ID = []
  paramList.CURR_ID = ''
  commonSearchApi({ queryId : 'EDUAD0010_SEARCH_05', param: paramList }).then(res => {
    codeList.CURR_ID.push({ COD: '', TXT: '전체' })
    res.ORESULT_CUR.forEach(element => {
      codeList.CURR_ID.push(element)
    })
  })
  gridRefresh()
}

//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//조회 실행
const searchMainData = id => {
  
  let params = {
    CMPNY_DIV   : paramList.CMPNY_DIV,
    BSNS_CD 	  : paramList.BSNS_CD,
    DEPT_CD 	  : paramList.DEPT_CD,
    ASGN_CD 	  : paramList.ASGN_CD,
    DATE_FR 	  : paramList.DATE_FR.replaceAll('-', ''),
    DATE_TO  	  : paramList.DATE_TO.replaceAll('-', ''),
    DIVISION    : paramList.DIVISION,
    CURR_ID 	  : paramList.CURR_ID,
    CLOSE_YN    : paramList.CLOSE_YN,
    CLOSE_DTE   : paramList.CLOSE_DTE.replaceAll('-', ''),
  }
  
  return commonSearchApi({ queryId : 'EDUAD0020_SEARCH_01', param: params })
}

//조회 후
const afterMainSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//조회 버튼 클릭
const onButtonsClick = async btn => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setBefore(beforeSearch)
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

//로우 더블 클릭시 발생하는 이벤트
const cellDbClick = (grid, data) => {
  let row =  grdMain.value.getDataProvider().getJsonRow(data.dataRow)
  if(row === null) return
  eDUAB0030Tab01Pop02Pop01.value.openPopup({
    CREATE_YN : 'N',
    EDU_DATE : row.EDU_DATE, 
    CON_DIV : '',   
    EDUTIME_SERIAL : '',    
    CMPNY_DIV  : paramList.CMPNY_DIV,  
    YEAR : row.YEAR,  
    SCHEDULE_ID : row.SCHEDULE_ID,    
    CURR_ID : '',  
    SAVE_YN : 'N',
    ONLY_SEARCH : 'Y'
  })
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
}

onMounted(() => {
  vm.$nextTick(() => {
    isAdmin.value = userStore.authGrpCd.includes("GRP00414") || userStore.authGrpCd.includes("HIWAYGRP00001") ? false : true
    initCombo() 
    grdMain.value.getGridView().footer.visible = true
  })  
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title>
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('회사구분')"
              labelWidth="52px"
              width="300px"
              v-model="paramList.CMPNY_DIV"
              :items="codeList.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              @update:modelValue="updateCmpnyDiv"
            />
            <i-select
              :label="$t('사업부')"
              labelWidth="39px"
              width="300px"
              v-model="paramList.BSNS_CD"
              :items="codeList.BSNS"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              :disabled= "isAdmin"
              @update:modelValue="updateBsns"
            />
            <i-select
              :label="$t('부서')" 
              labelWidth="39px"
              width="300px"
              v-model="paramList.DEPT_CD"
              :items="codeList.DEPT"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :disabled= "isAdmin"
              @update:modelValue="updateDept"
            />
            <i-select
              :label="$t('협력사')"
              labelWidth="52px"
              width="300px"
              v-model="paramList.ASGN_CD"
              :items="codeList.ASGN"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              :disabled= "isAdmin"
              @update:model-value="gridRefresh"
            />
          </div>
          <div class="d-flex">
            <i-input
              :label="$t('교육기간')"
              labelWidth="52px"
              width="210px"
              class="ma-0 mr-3"
              v-model="paramList.DATE_FR"
              type="Date"
              @update:model-value="gridRefresh"
            />
            <i-input
              :label="$t('~')"
              labelWidth="13px"
              width="171px"
              v-model="paramList.DATE_TO"
              type="Date"
              @update:model-value="gridRefresh"
            />
            <i-select
              :label="$t('분류')"
              labelWidth="26px"
              width="207px"
              v-model="paramList.DIVISION"
              :items="codeList.DIVISION"
              item-value="COD"
              item-title="TXT"
              @update:modelValue="updateDivision"
            />
            <i-select
              :label="$t('교육명')"
              labelWidth="39px"
              width="300px"
              v-model="paramList.CURR_ID"
              :items="codeList.CURR_ID"
              item-value="COD"
              item-title="TXT"
              @update:modelValue="gridRefresh"
            />
            <i-select
              :label="$t('마감종류')"
              labelWidth="52px"
              width="300px"
              v-model="paramList.CLOSE_YN"
              :items="codeList.CLOSE_YN"
              item-value="COD"
              item-title="TXT"
              @update:modelValue="gridRefresh"
            />
            <i-input
              width="200px"
              v-model="paramList.CLOSE_DTE"
              type="month"
              :readonly="paramList.CLOSE_YN != 'Y'"
              @update:modelValue="gridRefresh"
            />
          </div>
        </v-sheet>
        <v-sheet class="flex-column" height="90%">
          <div class="d-flex" style="justify-content: space-between;">
            <div>
              <IGridTitle :title="$t('■ 협력사 리스트')" class="ma-0">
                <template #editors />
              </IGridTitle>
            </div>
            <div>
              <VLabel 
                :text="$t('수당기준 :' + paramList.BASE_COST.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',') + '원')"
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
            @onCellDblClicked ="cellDbClick"
          />
        </v-sheet>
      </div>
    </v-card-text>
        <!-- 조회조건 -->
        
        <!-- 메인그리드 -->
        <VRow>
          <VCol cols="12" md="12">
            <VRow>
              <VCol cols="12" md="10">

              </VCol>
              <VCol cols="12" md="2">
              </VCol>
            </VRow>
            <VRow>
              <VCol>
              </VCol>
            </VRow>
          </VCol>          
        </VRow>
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