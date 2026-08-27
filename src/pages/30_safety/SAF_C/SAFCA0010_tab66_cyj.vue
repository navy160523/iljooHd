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
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from 'dayjs'
//차트 옵션
import Echart from 'vue-echarts';

defineOptions({
  name: '30_safety-SAF_C-SAFCA0010_tab',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const menuTitle = ref(null)
const userStore = useUserStore()
const searchArea = ref(null)
const tab = ref('tab')
const deptPopup = ref(null)
const grdMain = ref(null)
let firstLock = reactive(0)



//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN20: "",
  ASGN40: "",
  DEPT_CD: userStore.deptCd,
  WORK_FROM: dayjs(new Date().setMonth(new Date().getMonth() - 1)).format('YYYY-MM-DD'),
  WORK_TO:  dayjs(new Date()).format('YYYY-MM-DD'),
})

//메인 그리드 세팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false } },
  keys : ['CMPNY_DIV', 'SANGBN', 'EMP_NO'],
  fields : [
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') } , mergeRule: { "criteria": "prevvalues + value" } },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('조직') }, editable: false },
    { fieldName: 'RESP_EMP_NM', dataType: 'text', header: { text: t('작업책임자') }, editable: false },
    { fieldName: 'WORK_NO', dataType: 'text', header: { text: t('호선') }, editable: false },
    { fieldName: 'JOB_SPLCNM', dataType: 'text', header: { text: t('기본') } },
    { fieldName: 'DIV_M', dataType: 'text', header: { text: t('상세') } },
    { fieldName: 'WRK_DIST', dataType: 'text', header: { text: t('작업내용') } },
    { fieldName: 'DANG_DIVNM', dataType: 'text', header: { text: t('위험작업 분류') } },
    { fieldName: 'CF_DIVNM', dataType: 'text', header: { text: t('현장/전산/대면') } },
    { fieldName: 'CHECK_A_YN', dataType: 'text', header: { text: t('관리 감독자') } },
    { fieldName: 'CHECK_B_YN', dataType: 'text', header: { text: t('Safe 클로버') } },
    { fieldName: 'CHECK_C_YN', dataType: 'text', header: { text: t('안전요원') } },
    
  ],
  columns : [
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') } },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }  },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('조직') }, editable: false },
    { fieldName: 'RESP_EMP_NM', dataType: 'text', header: { text: t('작업책임자') }, editable: false },
    { fieldName: 'WORK_NO', dataType: 'text', header: { text: t('호선') }, editable: false },
    { fieldName: 'JOB_SPLCNM', dataType: 'text', header: { text: t('기본') } },
    { fieldName: 'DIV_M', dataType: 'text', header: { text: t('상세') } },
    { fieldName: 'WRK_DIST', dataType: 'text', header: { text: t('작업내용') } },
    { fieldName: 'DANG_DIVNM', dataType: 'text', header: { text: t('위험작업 분류') } },
    { fieldName: 'CF_DIVNM', dataType: 'text', header: { text: t('현장/전산/대면') } },
    { fieldName: 'CHECK_A_YN', dataType: 'text', header: { text: t('관리 감독자') } },
    { fieldName: 'CHECK_B_YN', dataType: 'text', header: { text: t('Safe 클로버') } },
    { fieldName: 'CHECK_C_YN', dataType: 'text', header: { text: t('안전요원') } },
  ],
  columnLayout: [
    'BSNS_NM', 
    'DEPT_NM',
    'ASGN_NM',
    'RESP_EMP_NM',
    'WORK_NO',
    {
      name: '장소',
      direction: 'horizontal',
      items: [
        'JOB_SPLCNM',
        'DIV_M',
      ],
    },
    'WRK_DIST',
    'DANG_DIVNM',
    'CF_DIVNM',
    {
      name: '점검여부',
      direction: 'horizontal',
      items: [
        'CHECK_A_YN',
        'CHECK_B_YN',
        'CHECK_C_YN',
      ],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

// 드롭다운 코드 리스트
const codeList = reactive({
  bsnsCd : [],
  sectorCd : [],
  asgn50Cd : [],
  asgn20Cd : [],
  asgn40Cd : [],
  dutyCd : [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchASGN20', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: '', USE_DIV: 'Y' } }), // 부문
    commonSearchApi({ queryId : 'searchASGN40', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: '',PART_CD:'', USE_DIV: 'Y' } }), // 담당임원
    commonSearchApi({ queryId : 'searchASGN50', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: '',PART_CD:'',REL_CD:'', USE_DIV:'Y' } }), // 부서
  ]).then(res => {
    console.log(res)
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.asgn20Cd = res[1].ORESULT_CUR
    codeList.asgn40Cd = res[2].ORESULT_CUR
    codeList.asgn50Cd = res[3].ORESULT_CUR
    searchParams.USER_DIV = ""
  })
}

// 사업부가 바뀌면 부문 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  commonSearchApi({ queryId : 'searchASGN20', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: newValue, USE_DIV: 'Y' } })
    .then(res => {
      codeList.asgn20Cd = res.ORESULT_CUR
  })
  commonSearchApi({ queryId : 'searchASGN40', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: searchParams.BSNS_CD,PART_CD:newValue, USE_DIV: 'Y' } })
  .then(res => {
      codeList.asgn40Cd = res.ORESULT_CUR
  })
  commonSearchApi({ queryId : 'searchASGN50', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: searchParams.BSNS_CD,PART_CD:searchParams.asgn20Cd,REL_CD:newValue, USE_DIV: 'Y' } })
  .then(res => {
      codeList.asgn50Cd = res.ORESULT_CUR
  })
  searchParams.ASGN20=""
  searchParams.ASGN40=""
  searchParams.DEPT_CD=""
})
watch(() => searchParams.ASGN20, (newValue, oldValue) => {
  commonSearchApi({ queryId : 'searchASGN40', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: searchParams.BSNS_CD,PART_CD:newValue, USE_DIV: 'Y' } })
  .then(res => {
      codeList.asgn40Cd = res.ORESULT_CUR
  })
  commonSearchApi({ queryId : 'searchASGN50', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: searchParams.BSNS_CD,PART_CD:newValue,REL_CD:"", USE_DIV: 'Y' } })
  .then(res => {
      codeList.asgn50Cd = res.ORESULT_CUR
  })
  searchParams.ASGN40=""
  searchParams.DEPT_CD=""
})
watch(() => searchParams.ASGN40, (newValue, oldValue) => {
  commonSearchApi({ queryId : 'searchASGN50', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: searchParams.BSNS_CD,PART_CD:searchParams.asgn20Cd,REL_CD:newValue, USE_DIV: 'Y' } })
  .then(res => {
      codeList.asgn50Cd = res.ORESULT_CUR
  })
  searchParams.DEPT_CD=""
})

watch(tab, (newTabValue) => {
  if (newTabValue === 'six') { 
    initCodeList();
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchMain)
      .setAfter(afterSearchMain)
      .run();
    
    
  }
});

//button click event 관련 function
const searchMain = () => {

  // return commonSearchApi({ queryId : 'SAFCA0010_TAB66_SEARCH_01', param: { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: searchParams.BSNS_CD, ASGN20:searchParams.asgn20Cd, ASGN40:searchParams.ASGN40, DEPT_CD:searchParams.DEPT_CD,WORK_FROM:searchParams.WORK_FROM,WORK_TO:searchParams.WORK_TO } })

  return commonSearchApi({ queryId : 'SAFCA0010_TAB66_SEARCH_01', param: searchParams})
}

const afterSearchMain = res => {
  const data = res.ORESULT_CUR

  grdMain.value.getDataProvider().setRows(data)
}


//버튼 기능 정의
const onButtonsClick = btn => {
  console.log("searchParams")
  console.log(searchParams)
  console.log(grdMain)
  if(btn.id ==='btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchMain)
      .setAfter(afterSearchMain)
      .run()
  }
}

//기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const dateFrChanged = data => {
  if(data.target.value > searchParams.To_date){
    searchParams.To_date = searchParams.From_date
  }
}

//기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const dateToChanged = data => {
  if(data.target.value < searchParams.From_date){
    searchParams.From_date = searchParams.To_date
  }
}

// //마운트 시 실행
// onMounted(() => {
  
// })
</script>

<template>
  <div class="page-wrap">
    <VContainer>
      <!-- 타이틀 -->
      <div class="contentPanel"> 
        <VRow>
          <VCol cols="12">
            <IMenuTitle
              ref="menuTitle"
              :title="$t(useLogsStore().menuId)"
              :button-list="['btnSearch']"
              @click-button="onButtonsClick"
            />
          </VCol>
        </VRow>
        <!-- 조회조건 -->
        <VCol>
          <VTabs v-model="tab">
            <VTab value="one">안전정검 Dashboard</VTab>
            <VTab value="five">계획점검 현황 및 결과분석</VTab>
            <VTab value="six">PTW 대상 점검결과/현황</VTab>
          </VTabs>
          <VCardText>
            <VWindow v-model="tab">
              <VWindowItem value="one">
                test test
              </VWindowItem>
              <VWindowItem value="five">
                <VRow no-gutters>
                  <VCol>
                    <VForm ref="searchArea" class="searchArea">
                      <VRow no-gutters>
                        <!-- 날짜 구간 조회 조건 -->
                        <VCol cols="2">
                          <ILabel
                            :label="$t('점검일자')"
                            label-width="100"
                          >
                            <template #editor="editorProps">
                              <VTextField
                                v-model="searchParams.WORK_FROM"
                                type="date"
                                @blur="dateFrChanged"
                              />
                            </template>      
                          </ILabel>
                        </VCol>
                        <VCol cols="2">  
                          <ILabel
                            :label="$t('~')"
                            label-width="45"
                          >
                            <template #editor="editorProps">
                              <VTextField
                                v-model="searchParams.WORK_TO"
                                type="date"
                                @blur="dateToChanged"
                              />
                            </template>      
                          </ILabel>
                        </VCol>
                        <!-- 부서 조회 조건 -->
                        <VCol cols="2">
                          <ILabel
                            :label="$t('사업부')"
                            label-width="100"
                          >
                            <template #editor="editorProps">
                              <VCol>
                                <VAutocomplete
                                  v-model="searchParams.BSNS_CD"
                                  :items="codeList.bsnsCd"
                                  item-title="BSNS_NM"
                                  item-value="BSNS_CD"
                                />
                              </VCol>
                            </template>
                          </ILabel>
                        </VCol>
                        <VCol cols="2">  
                          <ILabel
                            :label="$t('부서')"
                            label-width="100"
                          >
                            <template #editor="editorProps">
                              <VCol>
                                <VAutocomplete
                                  v-model="searchParams.DEPT_CD"
                                  :items="codeList.asgn50Cd"
                                  item-title="ASGN_SHRT_NM"
                                  item-value="ASGN_CD"
                                />
                              </VCol>
                            </template>
                          </ILabel>
                        </VCol>
                      </VRow>
                    </VForm>
                  </VCol>
                </VRow>
                
              </VWindowItem>
              <VWindowItem value="six">
                <VRow no-gutters>
                  <VCol>
                    <VForm ref="searchArea" class="searchArea">
                      <VRow no-gutters>
                        <!-- 날짜 구간 조회 조건 -->
                        <VCol cols="2">
                          <ILabel
                            :label="$t('점검일자')"
                            label-width="100"
                          >
                            <template #editor="editorProps">
                              <VTextField
                                v-model="searchParams.WORK_FROM"
                                type="date"
                                @blur="dateFrChanged"
                              />
                            </template>      
                          </ILabel>
                        </VCol>
                        <VCol cols="2">  
                          <ILabel
                            :label="$t('~')"
                            label-width="45"
                          >
                            <template #editor="editorProps">
                              <VTextField
                                v-model="searchParams.WORK_TO"
                                type="date"
                                @blur="dateToChanged"
                              />
                            </template>      
                          </ILabel>
                        </VCol>
                        <!-- 사업부 조회 조건 -->
                        <VCol cols="2">
                          <ILabel
                            :label="$t('사업부')"
                            label-width="100"
                          >
                            <template #editor="editorProps">
                              <VCol>
                                <VAutocomplete
                                  v-model="searchParams.BSNS_CD"
                                  :items="codeList.bsnsCd"
                                  item-title="BSNS_NM"
                                  item-value="BSNS_CD"
                                />
                              </VCol>
                            </template>
                          </ILabel>
                        </VCol>
                        <!-- 부문 조회 조건 -->
                        <VCol cols="2">
                          <ILabel
                            :label="$t('부문')"
                            label-width="100"
                          >
                            <template #editor="editorProps">
                              <VCol>
                                <VAutocomplete
                                  v-model="searchParams.ASGN20"
                                  :items="codeList.asgn20Cd"
                                  item-title="ASGN_SHRT_NM"
                                  item-value="ASGN_CD"
                                />
                              </VCol>
                            </template>
                          </ILabel>
                        </VCol>
                        <!-- 담당임원 조회 조건 -->
                        <VCol cols="2">
                          <ILabel
                            :label="$t('담당')"
                            label-width="100"
                          >
                            <template #editor="editorProps">
                              <VCol>
                                <VAutocomplete
                                  v-model="searchParams.ASGN40"
                                  :items="codeList.asgn40Cd"
                                  item-title="ASGN_SHRT_NM"
                                  item-value="REL_CD"
                                />
                              </VCol>
                            </template>
                          </ILabel>
                        </VCol>
                        <!-- 부서 조회 조건 -->
                        <VCol cols="2">  
                          <ILabel
                            :label="$t('부서')"
                            label-width="100"
                          >
                            <template #editor="editorProps">
                              <VCol>
                                <VAutocomplete
                                  v-model="searchParams.DEPT_CD"
                                  :items="codeList.asgn50Cd"
                                  item-title="ASGN_SHRT_NM"
                                  item-value="ASGN_CD"
                                />
                              </VCol>
                            </template>
                          </ILabel>
                        </VCol>
                      </VRow>
                    </VForm>
                  </VCol>
                </VRow>
                <!-- 메인그리드 -->
                <VRow>
                  <VCol  cols="12"  class="pa-1">
                    <RealGrid 
                      ref="grdMain" 
                      style="height: calc(100vh - 322px);"
                      :grid-view-option="grdMainProps.gridViewOption" 
                      :fields="grdMainProps.fields"
                      :columns="grdMainProps.columns"
                      :column-layout="grdMainProps.columnLayout"
                    />
                  </VCol>
                </VRow>
              </VWindowItem>
            </VWindow>
          </VCardText>
        </VCol>
        
      </div>
    </VContainer>
  </div>
</template>