<script setup>
//HLTAC0010 보건 위험성평가 모니터링

import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  chatbotTranslateLn,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useCommonStore } from '@hiway/stores/common'
import { isEmpty } from '@/@core/utils'
import dayjs from 'dayjs'

defineOptions({
  name: '100_health-HLT_A-HLTAC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보 
const menuTitle = ref(null)
const grdMain = ref(null)
const isAdmin = ref(false)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  // BSNS_CD: userStore.bsnsCd,
  // ASGN_20_CD : '',
  // ASGN_40_CD : '',
  // ASGN_40_REL : '',
  DEPT_CD: '',
  // DEPT_CD: userStore.deptCd,
  // DEPT_NM: userStore.deptNm,
  ASGN_CD: '',
  // ASGN_CD: userStore.asgnCd,
  // YEAR : new Date().getFullYear(),
  YEAR : dayjs().format('YYYY'),
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  ASGN_20 : [],
  ASGN_40 : [],
  DEPT_CD: [],
  ASGN_CD: []
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),

    // 사업부 [1]
    commonSearchApi({
      queryId: 'searchBSNS',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        USE_DIV: 'N',
      },
    }),
    // 부문 [2]
    // commonSearchApi({ queryId : 'searchASGN20', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y' } }), // 부문
    // 담당 [3]
    // commonSearchApi({ queryId : 'searchASGN40', param : { CMPNY_DIV: searchParams.CMPNY_DIV,BSNS_CD: searchParams.BSNS_CD,PART_CD:'', USE_DIV: 'Y' } }), // 담당임원
    // 부서[4]
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV: 'Y',
      },
    }),
    commonSearchApi({
      queryId: 'searchVend',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        DEPT_CD: searchParams.DEPT_CD,
      },
    })
    // commonSearchApi({ queryId : 'searchASGN50', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD,PART_CD:'',REL_CD:'', USE_DIV:'Y' } }), // 부서
  ]).then((res) => {
    
    codeList.CMPNY_DIV = res[0].ORESULT_CUR

    codeList.BSNS_CD = res[1].ORESULT_CUR

    // codeList.ASGN_20 = res[2].ORESULT_CUR
    
    // codeList.ASGN_40 = res[3].ORESULT_CUR
    
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.ASGN_CD = res[3].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })

    // 보건위험성평가 모듈관리자, admin, 보건총괄관리자
    if (userStore.authGrpCd.includes('HLTA001') 
        || userStore.authGrpCd.includes('HIWAYGRP00001')
        || userStore.authGrpCd.includes('GRP00372')
        ) {
        isAdmin.value = true // 관리자
        // console.log("isAdmin.value", true)
    } else {
        isAdmin.value = false // 일반 사용자
        // console.log("isAdmin.value", false)
        searchParams.BSNS_CD = userStore.bsnsCd;
        searchParams.DEPT_CD = userStore.deptCd;
        searchParams.ASGN_CD = userStore.asgnCd;
    }

    // 유저 협력사코드가 코드리스트에 있으면 그대로, 없으면 ''로
    const exists = codeList.ASGN_CD.some(item => item.ASGN_CD === userStore.asgnCd);
    searchParams.ASGN_CD = exists ? userStore.asgnCd : '';

  })
}
const test =''

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, footer: { visible:true } },
  keys: [],
  fields: [
    // {
    //   fieldName: 'YEAR',
    //   dataType: 'text',
    //   width: '100',
    //   styleName: 'left-column',
    //   editable: false,
    //   header: { text: t('연도') },
    // },
    // {
    //   fieldName: 'ASGN_20_CD',
    //   dataType: 'text',
    //   width: '100',
    //   styleName: 'left-column',
    //   editable: false,
    //   header: { text: t('부문') },
    // },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '150',
      styleName: 'left-column',
      editable: false,
      header: { text: t('부서명') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '170',
      styleName: 'left-column',
      editable: false,
      header: { text: t('협력사명') },
    },
    {
      fieldName: 'ASGN_DIV',
      dataType: 'text',
      width: '80',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('구분\n(직영/협력)') },
    },
    {
      fieldName: 'EVAL_TYPE',
      dataType: 'text',
      width: '80',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('평가구분\n(정기/수시)') },
      values: ['A', 'B'],
      labels: ['정기', '수시'],
      lookupDisplay: true,
    },
    {
      fieldName: 'EVAL_DATE',
      dataType: 'text',
      width: '100',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('평가일자')},
    },
    {
      fieldName: 'APPROVAL_STATUS',
      dataType: 'text',
      width: '70',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('진행상태') },
    },
    // 보건위험성평가 결과
    // 화학물질 노출 위험성
    {
      fieldName: 'A_SUM',
      dataType: 'number',
      width: '80',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('대상 공정 수') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'A_1',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('1단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'A_2',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('2단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'A_3',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('3단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'A_4',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('4단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'A_5',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('5단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'A_REV',
      dataType: 'number',
      width: '90',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('평균위험성') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    // 소음 노출 위험성
    {
      fieldName: 'B_SUM',
      dataType: 'number',
      width: '80',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('대상 공정 수') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'B_1',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('1단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'B_2',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('2단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'B_3',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('3단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'B_4',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('4단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'B_5',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('5단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'B_REV',
      dataType: 'number',
      width: '90',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('평균위험성') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    // 근골격계부담작업 위험성
    {
      fieldName: 'C_SUM',
      dataType: 'number',
      width: '80',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('대상 공정 수') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'C_1',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('1단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'C_2',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('2단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'C_3',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('3단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'C_4',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('4단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'C_5',
      dataType: 'number',
      width: '50',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('5단계') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'C_REV',
      dataType: 'number',
      width: '90',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('평균위험성') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'TARGET_PLAN',
      dataType: 'number',
      width: '100',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('계획수립대상') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'NO_REG',
      dataType: 'number',
      width: '70',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('미등록') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'ONPRO',
      dataType: 'number',
      width: '70',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('진행중') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'DONE',
      dataType: 'number',
      width: '70',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('결재완료') },
      numberFormat: "#,##0",
      footer: {
      expression: "sum",
      numberFormat: "#,##0"
    }
    },
    {
      fieldName: 'IM_RATE',
      dataType: 'number',
      width: '70',
      // styleName: 'left-column',
      editable: false,
      header: { text: t('개선율(%)') },
      footer: {
      expression: "sum",
      numberFormat: "#,##0.0",
      suffix: ' %'
    }
    },
    ],
    columnLayout :[
    // 'ASGN_20_CD', 
    'DEPT_NM', 'ASGN_NM', 'ASGN_DIV', 
    'EVAL_TYPE',
    'EVAL_DATE',
    'APPROVAL_STATUS',
    {
      name:'보건 위험성 평가 결과',
      direction: 'horizontal',
      items:[
        {
          name:'화학물질 노출 위험성',
          direction: 'horizontal',
          items:['A_SUM', 'A_1', 'A_2','A_3', 'A_4', 'A_5', 'A_REV']
        },
        {
          name:'소음 노출 위험성',
          direction: 'horizontal',
          items:['B_SUM', 'B_1', 'B_2','B_3', 'B_4', 'B_5', 'B_REV']
        },
        {
          name:'근골격계부담작업 위험성',
          direction: 'horizontal',
          items:['C_SUM', 'C_1', 'C_2','C_3', 'C_4', 'C_5', 'C_REV']
        },
        {
          name:'작업환경 개선계획',
          direction: 'horizontal',
          items:['TARGET_PLAN', 'NO_REG', 'ONPRO', 'DONE', 'IM_RATE']
        },
      ]
    },
    
  ], 
    
    // 출력 안함
    // { fieldName: 'WORK_STANDARD_ID', dataType: 'text', visible: false },
    // { fieldName: 'RPA_WORK', dataType: 'text', visible: false },
    // { fieldName: 'PROGRESS_STATUS', dataType: 'text', visible: false },
  
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      // .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
}

/* ----------------- 조회 ----------------- */
const beforeSearch = () => {}

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTAC0010_SEARCH_01',
    param: searchParams,
  })
}

const afterSearch = (res) => {
  // console.log("조회", res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getGridView().setFixedOptions({
    colCount: 6,
  })
}

const saveData = () => {}

//사업부 변경시 부서 조회
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    if (!isAdmin.value) return;
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParams.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)

// 부서가 바뀌면 협력사 데이터 가져옴
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    if (!isAdmin.value) return;
    commonSearchApi({
      queryId: 'searchVend',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        DEPT_CD: newValue,
      },
    }).then((res) => {
      codeList.ASGN_CD = res.ORESULT_CUR
      // codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '1' })
      codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })

      if (codeList.ASGN_CD.length !== 0) {
        searchParams.ASGN_CD = ''
      }
    })
  }
)

onMounted(() => {
  // searchParams.DEPT_CD = userStore.deptCd
  // searchParams.DEPT_NM = userStore.deptNm
//   grdMain.value.getGridView().setOptions({
//   summaryMode: "aggregate",  // 합계 기능 활성화
// });
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true;
  
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('기준연도')"
              label-width="50px"
              width="200px"
              type="YEAR"
              v-model="searchParams.YEAR"
            />
            <i-select
              :label="$t('회사')"
              label-width="50px"
              width="200px"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              label-width="50px"
              width="200px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              :disabled="!isAdmin"
            />
            <!-- <i-select
              :label="$t('부문')"
              label-width="50px"
              width="200px"
              v-model="searchParams.ASGN_20_CD"
              :items="codeList.ASGN_20"
              item-value="ASGN_CD"
              item-title="ASGN_SHRT_NM"
              :readonly="isEmpty(searchParams.BSNS_CD)"
            />
            <i-select
              :label="$t('담당')"
              label-width="50px"
              width="200px"
              v-model="searchParams.ASGN_40_CD"
              :items="codeList.ASGN_40"
              item-value="ASGN_CD"
              item-title="ASGN_SHRT_NM"
            /> -->
            <i-select
              :label="$t('부서')"
              label-width="50px"
              width="200px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :readonly="isEmpty(searchParams.BSNS_CD)"
              :disabled="!isAdmin"
              />
              <!-- item-value="ASGN_CD"
              item-title="ASGN_SHRT_NM" -->
            <i-select
              :label="$t('직영/협력')"
              label-width="55px"
              width="200px"
              v-model="searchParams.ASGN_CD"
              :items="codeList.ASGN_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              :readonly="isEmpty(searchParams.DEPT_CD)"
              :disabled="!isAdmin"
            />
            
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
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
.v-autocomplete__selection {
  flex-wrap: nowrap;
}
::v-deep(.v-field__input) {
  min-height: 40px !important;
  flex-wrap: nowrap !important;
  color: #000 !important;
  overflow: hidden !important;
}

::v-deep(.rg-header .rg-table tr td) {
  white-space: pre-line !important;
}
</style>
