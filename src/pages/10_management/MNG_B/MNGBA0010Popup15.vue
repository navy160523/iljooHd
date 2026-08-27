<!--
  화면명 : MNGAA0060.vue
  화면개요 : 부문별 HSE 중점추진사항 수립
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const logsStore = useLogsStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const mNGAA0060Popup = ref(null)
const detailParam = ref(null)
const userId = ref(userStore.userId)
const focusRow = ref(0)
const approvalPopup = ref(null)
const dialog = ref(false)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  BUMUN_CD: '',
  YEAR: dayjs().get("year"),
})

// const confirmParam = reactive({
//   CMPNY_DIV : null,
//   BSNS_CD : null,
//   DEPT_CD : null,
//   ASGN_CD : null,
//   YEAR : null,
//   QUARTER : null,
//   STATUS : null,
//   USER_ID : null,
// })

// 코드리스트 선언
const codeList = reactive({
  BSNS: [], //사업부
  BUMUN: [], //부문
  HSE_DIV: [ // 구분
    { value: '1', label: '안전' },
    { value: '2', label: '보건' },
    { value: '3', label: '환경' }
  ]
})

const codeList_orgin = reactive({
  BSNS: [], //사업부
  BUMUN: [], //부문
  PLAN_CYCLE: [] //주기
})


const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" }, }),
    commonSearchApi({ queryId: "MNGAA0060_SEARCH_01", param: { }, }),
    // commonSearchApi({ queryId: "MNGAA0060_SEARCH_02", param: { }, }),
    // getCodeList('HHIAF41'),
  ]).then((res) => {
    codeList.BSNS.push({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.BUMUN.push({ ASGN_SHRT_NM: "전체", PART_CD: "" })
    res[0].ORESULT_CUR.forEach(e => {
      codeList.BSNS.push(e)
    })
    res[1].ORESULT_CUR.forEach(e => {
      codeList.BUMUN.push(e)
    })

    codeList_orgin.BSNS = res[0].ORESULT_CUR
    codeList_orgin.BUMUN = res[1].ORESULT_CUR
    // codeList_orgin.PLAN_CYCLE = res[2].ORESULT_CUR

    grdMain.value.setBindingColumn('KPI_BSNS_CD', res[0].ORESULT_CUR, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('KPI_PART_CD', res[1].ORESULT_CUR, 'PART_CD', 'ASGN_SHRT_NM')
    // grdMain.value.setBindingColumn('KPI_PLAN_CYCLE', res[2].ORESULT_CUR, 'SYS_CD', 'SYS_CDNM')

    changedBsns(searchParams.BSNS_CD)
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL01'],
  fields : [
    { fieldName: 'KPI_BSNS_CD', dataType: 'text', width: '70', 
      lookupDisplay: true, mergeRule: { "criteria": "value" },
      header: { text: t('사업부') }, editable : false 
    },
    { fieldName: 'KPI_PART_CD', dataType: 'text', width: '70', 
      lookupDisplay: true,
      header: { text: t('부문') }, editable : false 
    },
    { fieldName: 'KPI_HSE_DIV', dataType: 'text', width: '70', 
      lookupDisplay: true, lookupData: codeList.HSE_DIV, mergeRule: { "criteria": "value" },
      header: { text: t('구분') }, editable : false  
    },
    { fieldName: 'KPI_AHEAD_ITEM', dataType: 'text', width: '70', header: { text: t('부문 주요 KPI') }, editable : false  },
    { fieldName: 'KPI_PLAN_ITEM', dataType: 'text', width: '70', header: { text: t('실행방안') }, editable : false  },
    { fieldName: 'KPI_PLAN_CYCLE', dataType: 'text', width: '70', 
      lookupDisplay: true,
      header: { text: t('주기') }, editable : false  
    },
    // { fieldName: 'KPI_PLAN_CYCLE_DESC', dataType: 'text', width: '70', header: { text: t('주기별도기준') }, editable : false  },
    { fieldName: 'KPI_PLAN_DOCU', dataType: 'text', width: '70', header: { text: t('실적 관리 방법(기록)') }, editable : false  },
    
    { fieldName: 'KPI_PLAN_CYCLE_COD', dataType: 'text', visible: false },
    { fieldName: 'KPI_PERSON_NAME', dataType: 'text', visible: false },
    { fieldName: 'IDX', dataType: 'text', visible: false  },
    { fieldName: 'KPI_ASGN_ITEM', dataType: 'text', visible: false  },
    { fieldName: 'KPI_ASGN_ITEM_CD', dataType: 'text', visible: false  },
    { fieldName: 'KPI_YEAR', dataType: 'text', visible: false  },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false  },
    { fieldName: 'INSERT_DATE', dataType: 'text', visible: false  },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false  },
    { fieldName: 'UPDATE_DATE', dataType: 'text', visible: false  },

  ],
  columns : [],
  columnLayout: [
  'KPI_BSNS_CD',
  'KPI_PART_CD',
  'KPI_HSE_DIV',
  'KPI_AHEAD_ITEM',
  'KPI_PLAN_ITEM',
  'KPI_PLAN_CYCLE',
  // 'KPI_PLAN_CYCLE_DESC',
  'KPI_PLAN_DOCU',
  'KPI_PERSON_NAME'
  ],
})

grdMainProps.columns = grdMainProps.fields


watch(() => [searchParams.YEAR, searchParams.ASGN_NM, searchParams.QUARTER],([newValueYEAR, newValueASGN_NM, newValueQUARTER], [oldValueYEAR, oldValueASGN_NM, oldValueQUARTER]) => {
 
  grdMain.value.getDataProvider().setRows()
})

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if(btn.id === 'btnClose') {
    onClose()
  }
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {  
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
  //팝업 오픈
  dialog.value = true 
}
defineExpose({
  openPopup,
})

const searchData = () => {
  return commonSearchApi({ queryId : 'MNGAA0060_SEARCH_03', param: searchParams }) 
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 부문 선택 시 사업부 자동으로 변경
const changedBumun = e => {
  let bsnsCd = ''
  if(e){
    codeList.BUMUN.forEach((list,idx) => {
      if(list.PART_CD === e){
        bsnsCd = codeList.BUMUN[idx].BSNS_CD
      } 
    })
    
    searchParams.BSNS_CD = bsnsCd
  }
}

// 사업부 선택시 부문리스트 자동으로 정리
const changedBsns = e => {
  let arr = [{
    PART_CD : '',
    ASGN_SHRT_NM : '전체'
  }]
  if(e){ // e가 있으면 (선택한게 전체가 아님)
    codeList_orgin.BUMUN.forEach((list, idx) => {
      if(list.BSNS_CD === e){
        arr.push({
          BSNS_CD : codeList_orgin.BUMUN[idx].BSNS_CD,
          PART_CD : codeList_orgin.BUMUN[idx].PART_CD,
          ASGN_SHRT_NM : codeList_orgin.BUMUN[idx].ASGN_SHRT_NM
        })
      }
    })
    codeList.BUMUN = arr
    searchParams.BUMUN_CD = ''
  }
  else{ // e가 없으면(전체 선택한것)
    codeList_orgin.BUMUN.forEach(e => {
      codeList.BUMUN.push(e)
    })
    searchParams.BUMUN_CD = ''
  }
}

const approvalAppkey = appKey => {
  for(let i=0;i<appData.value.length;i++){
    appData.value[i].BSNS_CD = appData.value[i].KPI_BSNS_CD
    appData.value[i].PART_CD = appData.value[i].KPI_PART_CD
    appData.value[i].YEAR = appData.value[i].KPI_YEAR
    appData.value[i].APPROVAL_ID = appKey
    appData.value[i].USER_ID = userStore.userId
  }
  commonExecuteApi({ queryId : 'MNGAA0060_UPDATE_01', list: appData.value })
}
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
      <span>{{'부문별 HSE 중점추진사항 이행현황 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('부문별 HSE 중점추진사항 이행현황')"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex " >
              <i-select
                width="180px"
                :label="$t('년도')"
                v-model="searchParams.YEAR"
                label-width="40px"
                type="YEAR"
              /> 
            
              <i-select 
                :label="$t('사업부')"
                labelWidth="55px"
                width="300px"
                class="ml-4"
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                @update:modelValue="changedBsns"
              />

              <i-select 
                :label="$t('부문')"
                labelWidth="55px"
                width="300px"
                class="ml-4"
                v-model="searchParams.BUMUN_CD"
                :items="codeList.BUMUN"
                item-value="PART_CD"
                item-title="ASGN_SHRT_NM"
                @update:modelValue="changedBumun"
              />

          </v-sheet>
        
          <v-sheet class="h-auto">
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
    min-height: 700px;
  }
}
</style>

