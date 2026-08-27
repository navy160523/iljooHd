<!--
  화면명 : MNGAA0010.vue
  화면개요 :HSE 경영시스템 모니터링
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
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import Message from '@hiway/utils/notify'
import MNGAA0010Popup1 from './MNGAA0010Popup1.vue'
import MNGAA0010Popup2 from './MNGAA0010Popup2.vue'
import MNGAA0010Popup3 from './MNGAA0010Popup3.vue'
import MNGAA0010Popup4 from './MNGAA0010Popup4.vue'
import MNGAA0010Popup5 from './MNGAA0010Popup5.vue'

defineOptions({
  name:'10_management-MNG_A-MNGAA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const logsStore = useLogsStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const detailParam = ref(null)
const userId = ref(userStore.userId)
const focusRow = ref(0)
const approvalPopup = ref(null)
const mNGAA0010Popup1 = ref(null)
const mNGAA0010Popup2 = ref(null)
const mNGAA0010Popup3 = ref(null)
const mNGAA0010Popup4 = ref(null)
const mNGAA0010Popup5 = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  YEAR: dayjs().get("year"),
  ORGN_DIV: 'A',
  PROD_DIV: '',
})

// 코드리스트 선언
const codeList = reactive({
  BSNS: [], //사업부
  HSE_DIV: [ // 구분
    { value: '1', label: '안전' },
    { value: '2', label: '보건' },
    { value: '3', label: '환경' }
  ],
  orgnDiv: [
    { name: "전체", code: "" },
    { name: "직영", code: "A" },
    { name: "협력사", code: "B" },
  ],
  PRODList: [
    { TXT: '전체', COD: '' },
    { TXT: '생산', COD: 'Y' },
    { TXT: '비생산', COD: 'N' },
  ],
})

const codeList_orgin = reactive({
  BSNS: [], //사업부
})


const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" }, }),
    // commonSearchApi({ queryId: "searchDept", param: { CMPNY_DIV: userStore.cmpnyDiv, ASGN_NM : '',BSNS_CD : '', DEPT_CD : '', ORGN_DIV : '', USE_ONLY: "N" } })
  ]).then((res) => {
    codeList.BSNS.push({ BSNS_NM: "전체", BSNS_CD: "" })
    res[0].ORESULT_CUR.forEach(e => {
      codeList.BSNS.push(e)
    })
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL01'],
  fields : [
    { fieldName: 'BSNS_NM', dataType: 'text', width: '70', 
      mergeRule: { "criteria": "value" },
      header: { text: t('사업부') }, editable : false
    },
    { fieldName: 'ASGN_NM', dataType: 'text', width: '70', 
      lookupDisplay: true,
      header: { text: t('부서명') }, editable : false ,styleName: "left-column"
    },
    { fieldName: 'ASGN_NM2', dataType: 'text', width: '70', 
      lookupDisplay: true,
      header: { text: t('협력사명') }, editable : false ,styleName: "left-column"
    },
    { fieldName: 'B2', dataType: 'text', width: '60', header: { text: t('HSE 목표 (20)') }, editable : false },
    { fieldName: 'B3', dataType: 'text', width: '60', header: { text: t('HSE 실적 (20)') }, editable : false },
    { fieldName: 'B4', dataType: 'text', width: '60', header: { text: t('위험성 평가 (20)') }, editable : false, visible: false},
    { fieldName: 'B5', dataType: 'text', width: '60', header: { text: t('환경영향 평가 (20)') }, editable : false  },
    { fieldName: 'B6', dataType: 'text', width: '60', header: { text: t('업무 분장표 (20)') }, editable : false  },
    { fieldName: 'B7', dataType: 'text', width: '60', header: { text: t('HSE 추진자 지정 (20)') }, editable : false  },
    { fieldName: 'BT', dataType: 'text', width: '60', header: { text: t('총점 (100)') }, editable : false  },
    
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false  },
  ],
  columns : [],
  columnLayout: [
  'BSNS_NM',
  'ASGN_NM',
  'ASGN_NM2',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'BT'
  ],
})

grdMainProps.columns = grdMainProps.fields


onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

watch(() => [searchParams.YEAR, searchParams.BSNS_CD, searchParams.ORGN_DIV, searchParams.PROD_DIV],([newValueYEAR, newValueBSNS_CD, newValueORGN_DIV, newValuePROD_DIV]) => {
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
  else if(btn.id === 'btnSendNormal'){
    let chekedRow = grdMain.value.getGridView().getCheckedRows()

    let gMainData = []
    for (let rowIdx of chekedRow) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      gMainData.push(data)
    }
    if(gMainData.length === 0){
      Message.err('부서를 선택 해 주세요.')
      return
    }
    mNGAA0010Popup5.value.openPopup(gMainData, searchParams)
  }
  else if(btn.id === 'btnGoal'){
    mNGAA0010Popup1.value.openPopup(searchParams)
  }
  else if(btn.id === 'btnPerform'){
    mNGAA0010Popup2.value.openPopup(searchParams)
  }
  else if(btn.id === 'btnEnv'){
    mNGAA0010Popup3.value.openPopup(searchParams)
  }
  else if(btn.id === 'btnWork'){
    mNGAA0010Popup4.value.openPopup(searchParams)
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'MNGAA0010_SEARCH_01', param: searchParams }) 
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// grid 더블 클릭 시 조회
const onCellDblClicked = (grid, clickData) => {
  let gMainData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  mNGAA0010Popup5.value.openPopup(gMainData, searchParams)
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnSendNormal']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

      <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex justify-space-between">
            <div class="d-flex">

              <i-select
                width="180px"
                :label="$t('목표 년도')"
                v-model="searchParams.YEAR"
                label-width="60px"
                type="YEAR"
              />
            
              <i-select 
                :label="$t('사업부')"
                labelWidth="55px"
                width="300px"
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
              />

              <div class="d-flex">
                <VRadioGroup
                  v-model="searchParams.ORGN_DIV"
                  class="mt-auto pl-3 pr-3 radio"
                  inline
                >
                  <VRadio v-for="(item, i) in codeList.orgnDiv" :key="i" :value="item.code" :label="item.name" />
                </VRadioGroup>
              </div>
              
              <div class="d-flex ml-3">
                <VRadioGroup
                  v-model="searchParams.PROD_DIV"
                  class="mt-auto pl-3 pr-3 radio"
                  inline
                >
                  <VRadio v-for="(item, i) in codeList.PRODList" :key="i" :value="item.COD" :label="item.TXT" />
                </VRadioGroup>
              </div>
            </div>

            <div class="d-flex">
              <v-btn @click="onButtonsClick({ id : 'btnGoal'})">목표</v-btn>
              <v-btn @click="onButtonsClick({ id : 'btnPerform'})">실적</v-btn>
              <v-btn @click="onButtonsClick({ id : 'btnEnv'})">환경영향평가</v-btn>
              <v-btn @click="onButtonsClick({ id : 'btnWork'})">업무분장표</v-btn>
            </div>
          </v-sheet>
        
          <v-sheet class="h-auto">
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
        </div>
      </v-card-text>

    <!-- MNGAA0010Popup1 (목표 팝업) -->
    <MNGAA0010Popup1 ref="mNGAA0010Popup1" /> 
    <!-- MNGAA0010Popup2 (실적 팝업) -->
    <MNGAA0010Popup2 ref="mNGAA0010Popup2" /> 
    <!-- MNGAA0010Popup3 (환경영향평가 팝업) -->
    <MNGAA0010Popup3 ref="mNGAA0010Popup3" />
    <!-- MNGAA0010Popup4 (업무분장표 팝업) -->
    <MNGAA0010Popup4 ref="mNGAA0010Popup4" />
    <!-- MNGAA0010Popup5 (메일 전송 팝업) -->
    <MNGAA0010Popup5 ref="mNGAA0010Popup5" />

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
.radio {
  border-radius: 3px;
  padding-top: 2px;
  padding-bottom: 2px;
  border: 1px solid #E4E4E4;
  background-color: white;
}
</style>

