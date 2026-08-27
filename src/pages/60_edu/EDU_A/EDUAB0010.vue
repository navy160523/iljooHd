<script setup>
import { ref, onBeforeMount, onMounted, watch, nextTick } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import queryFlowHelper from "@/utils/searchFlowHelper";
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import { useUserStore } from '@hiway/stores/user'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

defineOptions({
  name:'EDUAB0010',
})
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const dialog = ref(null)
const popupData = reactive({
  EXCEPT_DESC : '',//제외사유
})

//그리드1 속성셋팅
const grdMainProps1 = reactive({
  gridViewOption : { checkBar: { visible: false } },
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('소속') } },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'GOAL_TIME', dataType: 'text', header: { text: t('법적요구시간(분)') }, editable: false },
    { fieldName: 'LEAD_TIME', dataType: 'text', header: { text: t('이수시간(분)') }, editable: false },
    { fieldName: 'LEFT_TIME', dataType: 'text', header: { text: t('잔여시간(분)') }, editable: false },
    { fieldName: 'TARGET_YN', dataType: 'text', header: { text: t('사무직 교육대상') }, editable: false },
  ],
  columns : [],
})

//그리드2 속성셋팅
const grdMainProps2 = reactive({
  gridViewOption : { checkBar: { visible: false } },
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('소속') } },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'GOAL_TIME', dataType: 'text', header: { text: t('법적요구시간(분)') }, editable: false },
    { fieldName: 'LEAD_TIME', dataType: 'text', header: { text: t('이수시간(분)') }, editable: false },
    { fieldName: 'LEFT_TIME', dataType: 'text', header: { text: t('잔여시간(분)') }, editable: false },
    { fieldName: 'TARGET_YN', dataType: 'text', header: { text: t('사무직 교육대상') }, editable: false },
  ],
  columns : [],
})

grdMainProps1.columns = grdMainProps1.fields
grdMainProps2.columns = grdMainProps2.fields

const date = ref({
  start: null,
  end: null
})
const searchParams = reactive({
  YYYYMM : dayjs(new Date()).format('YYYY-MM'),
  BSNS_CD : ''
})
const codeList = reactive({
  bsnsCd : [], //사업부
  userDiv : [] //소속구분
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
  ]).then(res => {
    codeList.bsnsCd = []
    codeList.userDiv = []
    console.log("인잇코드 레스 : ",res)
    codeList.bsnsCd = res[0].ORESULT_CUR
    let findIndex = res[0].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
    searchParams.BSNS_CD = codeList.bsnsCd[findIndex].BSNS_CD

    codeList.userDiv.push({COD : '', TXT : '전체'}, {COD : 'A', TXT : '사내'}, {COD : 'B', TXT : '협력사'})
    searchParams.USER_DIV = codeList.userDiv[0].COD
  }).then(() => {
    onDashboardSearch()
  })
}


const stateId = ref(null)
const stateList = ref([
])
const stateCountList = ref([
  { id: 'target', text: '교육대상' },
  { id: 'complete', text: '이수' },
  { id: 'notComplete', text: '미이수' },
  { id: 'rate', text: '이수율' },
])
const handleCount = (id, param) => {
  if(param.target !== 0) {
    if(id !== 'rate') {
      return param[id]
    } else {
      const percent = ((param.complete / param.target) * 100)
      return Number.isInteger(percent) ? parseInt(percent) : percent.toFixed(1)
    }
  } else {
    return '-'
  }
}
const tab = ref('tab01')
// watch(tab, (e) => {
//   setGridRows(e)
// })
// const setGridRows = (key) => {
//   let setData = []
//   switch (key) {
//     case 'tab1':
//       setData = data1
//       break;
//     case 'tab2':
//       setData = data2
//       break;
//   }
//   setData.forEach(el => {
//     el.COL9 = '제외신청'
//   })
//   nextTick(grdMain1.value.getDataProvider().setRows(setData))
// }


// 타이틀 버튼 클릭 이벤트
const onButtonsClick = () => {
  onDashboardSearch()
}


// 교육 카드 클릭 이벤트
const onState = (param) => {
  stateId.value = param.id

  let searchData = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YYYYMM : searchParams.YYYYMM,
    BSNS_CD : searchParams.BSNS_CD,
    CURR_ID : stateId.value,
    USER_DIV : tab.value === 'tab01' ? 'A' : 'B'
  }

  commonSearchApi({ queryId : 'EDUAB0010_SEARCH_04', param: searchData }).then(res => {
    console.log("미이수자 현황 조회 결과 :::: >>>> ",res)
    if(tab.value === 'tab01'){
      grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR)
    }else if(tab.value === 'tab02'){
      grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
    if(res.ORESULT_CUR.length > 0){
      Message.success(t('조회되었습니다.'))
    }else{
      Message.warn(t('데이터가 없습니다.'))
    }
  })
}


//대시보드 초기화 이벤트
const dashboardRefresh = () => {
  stateList.value.forEach(val => {
    val.target = 0
    val.complete = 0
    val.notComplete
  })
  // await commonSearchApi({ queryId : 'EDUAB0010_SEARCH_01', param: {CMPNY_DIV : userStore.cmpnyDiv} }).then( res => {
  //   if(res.ORESULT_CUR.length > 0){
  //     console.log("모니터링 조회 :::: >>>> ", res)
  //     dashboardData = res.ORESULT_CUR
  //     for(let i = 0; i <dashboardData.length; i++){
  //       dashboardData[i].PASS_COUNT = 0
  //       dashboardData[i].EXAM_PASS_COUNT = 0
  //       dashboardData[i].EXAM_FAIL_COUNT = 0
  //     }
  //   }
  // })
  // console.log("대시보드 초기화 이벤트 데이터 확인",dashboardData)
  // dashboardData.forEach(val => {
  //   stateList.value.push({
  //     id : val.CURR_ID,
  //     title : val.CURR_NM,
  //     target : val.PASS_COUNT,
  //     complete : val.EXAM_PASS_COUNT,
  //     notComplete : val.EXAM_FAIL_COUNT
  //   })
  // })
}

//##########################################################################################################################
//##################################################조회 이벤트#############################################################
//##########################################################################################################################

//탭 변경 시 자동 조회
const tabChanged = () => {
  let searchData = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YYYYMM : searchParams.YYYYMM,
    BSNS_CD : searchParams.BSNS_CD,
    CURR_ID : stateId.value,
    USER_DIV : tab.value === 'tab01' ? 'A' : 'B'
  }
  if(!isNullCheck(stateId.value)){
    commonSearchApi({ queryId : 'EDUAB0010_SEARCH_04', param: searchData }).then(res => {
      console.log("미이수자 현황 조회 결과 :::: >>>> ",res)
      if(tab.value === 'tab01'){
        grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR)
      }else if(tab.value === 'tab02'){
        grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)
      }
      if(res.ORESULT_CUR.length > 0){
        Message.success(t('조회되었습니다.'))
      }else{
        Message.warn(t('데이터가 없습니다.'))
      }
    })
  }
}

//대시보드 조회
const onDashboardSearch = async () => {
  let searchData = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YYYYMM : searchParams.YYYYMM,
    BSNS_CD : searchParams.BSNS_CD,
    USER_DIV : searchParams.USER_DIV
  }

  let dataChk = 0

  let dashboardData = []
  console.log("조회 데이터 확인", searchData)
  await commonSearchApi({ queryId : 'EDUAB0010_SEARCH_01', param: {CMPNY_DIV : userStore.cmpnyDiv} }).then( res => {
    if(res.ORESULT_CUR.length > 0){
      console.log("모니터링 조회 :::: >>>> ", res)
      dashboardData = res.ORESULT_CUR
      for(let i = 0; i <dashboardData.length; i++){
        dashboardData[i].PASS_COUNT = 0
        dashboardData[i].EXAM_PASS_COUNT = 0
        dashboardData[i].EXAM_FAIL_COUNT = 0
      }
    }
  })
  console.log('대시보드 데이터 1차 조회',dashboardData)
  await commonSearchApi({ queryId : 'EDUAB0010_SEARCH_02', param: searchData }).then(res => {
    console.log("교육대상자 조회 :::: >>>> ", res)
    if(res.ORESULT_CUR.length > 0){
      for(let i = 0; i < res.ORESULT_CUR.length; i++){
        for(let j = 0; j < dashboardData.length; j++){
          if(res.ORESULT_CUR[i].CURR_ID === dashboardData[j].CURR_ID){
            dashboardData[j].PASS_COUNT = res.ORESULT_CUR[i].PASS_COUNT
            dataChk += res.ORESULT_CUR[i].PASS_COUNT
          }
        }
      }
    }
  })
  console.log('대시보드 데이터 2차 조회',dashboardData)
  await commonSearchApi({ queryId : 'EDUAB0010_SEARCH_03', param: searchData }).then(res => {
    console.log("이수자 조회 :::: >>>> ",res)
    for(let i = 0; i < res.ORESULT_CUR.length; i++){
      for(let j = 0; j < dashboardData.length; j++){
        if(res.ORESULT_CUR[i].CURR_ID === dashboardData[j].CURR_ID){
          dashboardData[j].EXAM_PASS_COUNT = res.ORESULT_CUR[i].EXAM_PASS_COUNT
          dashboardData[j].EXAM_FAIL_COUNT = dashboardData[j].PASS_COUNT - dashboardData[j].EXAM_PASS_COUNT
        }
      }
    }
  })
  console.log('대시보드 데이터 3차 조회',dashboardData)
  stateList.value = []
  dashboardData.forEach(val => {
    stateList.value.push({
      id : val.CURR_ID,
      title : val.CURR_NM,
      target : val.PASS_COUNT,
      complete : val.EXAM_PASS_COUNT,
      notComplete : val.EXAM_FAIL_COUNT
    })
  })
  if(dataChk <= 0){
    Message.warn(t('데이터가 없습니다.'))
  }else{
    Message.success(t('조회되었습니다.'))
  }
}

//##########################################################################################################################
//################################################조회 이벤트(종료)#########################################################
//##########################################################################################################################

//널 체크 이벤트
const isNullCheck = data => {
return (data === undefined || data === null || data === '') ? true : false
}

onMounted( () => {
  initCodeList()
})

</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="px-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="px-2 py-0 d-flex flex-column EDUAB0010 content-area">
      <div class="d=flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <!-- 날자선택 예제 추가 -->
          <i-input 
            width="230px" 
            v-model="searchParams.YYYYMM" 
            :label="$t('교육년월')" 
            type="month" 
            labelWidth="60px"
            margin="10px"
            @update:model-value="dashboardRefresh"
          />
          <i-select 
            v-model="searchParams.BSNS_CD"
            :items="codeList.bsnsCd"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            labelWidth="45px"
            width="270px"
            :label="$t('사업부')"
            @update:model-value="dashboardRefresh"
          />
          <i-select 
            v-model="searchParams.USER_DIV"
            :items="codeList.userDiv"
            item-value="COD"
            item-title="TXT"
            labelWidth="52px"
            width="270px"
            :label="$t('소속구분')"
            @update:model-value="dashboardRefresh"
          />
        </v-sheet>
        <v-sheet class="d-flex">
          <template v-for="(state, state_index) in stateList" :key="state.title">
            <v-col cols="3" class="pa-0 px-0 h-100" @click="onState(state)">
              <v-card 
                class="py-5 px-6 p-relative" 
                :class="[state_index !== 0 ? 'ml-4' : 'ml-0', {'selected-card' : stateId == state.id}]"
                height="100%"
              >
                <v-card-title class="pa-0 mb-3 mainCaption2">
                  {{ state.title }}
                </v-card-title>
                <v-card-item class="mt-2 pa-2">
                  <v-row no-gutters>
                    <template v-for="stateCount in stateCountList" :key="stateCount.id">
                      <v-col cols="3" class="px-2 py-5 text-center">
                        <p class="mainCaption6">{{ stateCount.text }}</p>
                        <div class="mt-4 d-flex align-center justify-center">
                          <span>
                            <b
                              class="state-count-text"
                              :class="{'not-complete' : stateCount.id == 'notComplete' && state.target !== 0}"
                            >{{ handleCount(stateCount.id, state) }}
                          </b>{{ ` ${stateCount.id !== 'rate' ? '명' : '%'}` }}</span>
                        </div>
                      </v-col>
                    </template>
                  </v-row>
                </v-card-item>
              </v-card>
            </v-col>
          </template>
        </v-sheet>
        <v-sheet class="mt-4 h-auto">
          <IGridTitle :title="$t('미이수자 현황')">
            <template #editors />
          </IGridTitle>
          <v-sheet>
            <v-tabs v-model="tab" class="mb-2" @update:model-value="tabChanged">
              <v-tab value="tab01">직영</v-tab>
              <v-tab value="tab02">협력사</v-tab>
            </v-tabs>
            <v-window v-model="tab">
              <v-window-item value="tab01">
                <v-sheet>
                  <RealGrid
                    ref="grdMain1"
                    style="height:400px"
                    :grid-view-option="grdMainProps1.gridViewOption"
                    :fields="grdMainProps1.fields"
                    :columns="grdMainProps1.columns"
                    :column-layout="grdMainProps1.columnLayout"
                  />
                </v-sheet>
              </v-window-item>
              <v-window-item value="tab02">
                <v-sheet>
                  <RealGrid
                    ref="grdMain2"
                    style="height:400px"
                    :grid-view-option="grdMainProps2.gridViewOption"
                    :fields="grdMainProps2.fields"
                    :columns="grdMainProps2.columns"
                    :column-layout="grdMainProps2.columnLayout"
                  />
                </v-sheet>

              </v-window-item>
            </v-window>
          </v-sheet>
            <!-- :column-layout="grdMainProps1.columnLayout" -->
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

  
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
.EDUAB0010 {
  .v-card {
    border: 1px solid rgb(var(--v-theme-gridBorder)) !important;
    cursor: pointer;
    &.selected-card{
      border-color: rgb(var(--v-theme-primary)) !important;
      box-shadow: 3px 3px 5px #efefef;
      .v-card-title {
        color: rgb(var(--v-theme-primary)) !important;
        font-weight: 700 !important;
      }
    }
    .v-card-item {
      // padding: 8px 24px !important;
      border-radius: 3px;
      background-color: #F7F7F7;
      .state-count-text {
        font-size: 24px;
        font-weight: 700;
        line-height: 28.64px;
        &.not-complete {
          color: #FF5252
        }
      }
    }
  }
}

</style>