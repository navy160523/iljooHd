<!-- SAFIE0030 협력사 안전관리자 지원금 기성지급 상세현황 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { stubString } from 'lodash-es'

defineOptions({
  name:'SAFIE0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CLOSE_DT: dayjs().format('YYYY-MM'),
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  PARTNER_CD: '',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  PARTNER_CD: [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),
    // 사업부 [1]
    commonSearchApi({
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      },
    }),
    // 부서[2]
    commonSearchApi({
      queryId : 'searchDept3',
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        BSNS_CD: searchParams.BSNS_CD, 
        USE_DIV:'Y' 
      } 
    }),
    // 협력사[3]
    commonSearchApi({ 
      queryId : 'searchVend',
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        BSNS_CD: searchParams.BSNS_CD, 
        DEPT_CD: searchParams.DEPT_CD 
      } 
    })
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.PARTNER_CD = res[3].ORESULT_CUR
    
    codeList.BSNS_CD.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    codeList.PARTNER_CD.unshift({ ASGN_NM:"전체", ASGN_CD:"" })

    grdMain.value.setBindingColumn("BSNS_CD", codeList.BSNS_CD, "BSNS_CD", "BSNS_NM") // 출처 LookUp
  })
}

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, footer: { visible:true } },
  fields : [ 
    { 
      fieldName: 'BSNS_CD',
      dataType: 'text',
      width: '104',
      editable: false,
      header: { text: t('사업부') },
      lookupDisplay: true
    },
    { 
      fieldName: 'ASGN_CD',
      dataType: 'text',
      width: '85',
      editable: false,
      header: { text: t('업체코드') }
    },
    { 
      fieldName: 'REG_NO',
      dataType: 'text',
      width: '108',
      editable: false,
      styleName: 'left-column', 
      header: { text: t('사업자등록번호') }
    },
    { 
      fieldName: 'COMP_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'left-column', 
      header: { text: t('업체명') }
    },
    { 
      fieldName: 'WORKER_CNT',
      dataType: 'text',
      width: '47',
      editable: false,
      styleName: 'right-column', 
      header: { text: t('인원수') }
    },
    { 
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '52',
      editable: false,
      header: { text: t('코드') }
    },
    { 
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '127',
      editable: false,
      styleName: 'left-column', 
      header: { text: t('부서명') }
    },
    { 
      fieldName: 'KOR_NM',
      dataType: 'text',
      width: '71',
      editable: false,
      header: { text: t('안전관리자') }
    },
    { 
      fieldName: 'GRADE',
      dataType: 'text',
      width: '58',
      editable: false,
      header: { text: t('자격요건') },
      displayCallback: function(grid, index, value) {
        return value.substring(1,2) + '순위'
      },
    },
    { 
      fieldName: 'CAREER_GBN',
      dataType: 'text',
      width: '66',
      editable: false,
      styleName: 'left-column', 
      header: { text: t('경력범위') }
    },
    { 
      fieldName: 'PRIORITY',
      dataType: 'text',
      width: '59',
      editable: false,
      styleName: 'right-column', 
      header: { text: t('지원금 우선순위') }
    },
    { 
      fieldName: 'PAY_RATIO',
      dataType: 'text',
      width: '59',
      editable: false,
      styleName: 'right-column', 
      header: { text: t('지급비중') }
    },
    { 
      fieldName: 'WORK_FROM_DT',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('시작일') }
    },
    { 
      fieldName: 'WORK_TO_DT',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('종료일') }
    },
    { 
      fieldName: 'REAL_WORK_DAYS',
      dataType: 'text',
      width: '80',
      editable: false,
      styleName: 'right-column', 
      header: { text: t('실근무일수') },
      footer: {
        text: '합계',
        styleName: 'footer-font',
      }
    },
    { 
      fieldName: 'SUPPORT_FUND',
      dataType: 'number',
      numberFormat: "#,##0.###",
      width: '109',
      editable: false,
      styleName: 'right-column',
      header: { text: t('지원금(원)') },
      //displayCallback: function(grid, index, value) {
      //  return value.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
      //}, 2025.02.05 엑셀 export 문제로 인하여 주석처리
      footer: {
        expression: 'sum',
        styleName: 'footer-font',
        numberFormat: "#,##0"
      }
    },
    { 
      fieldName: 'START_DATE',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('선임일자') }
    },
    { 
      fieldName: 'RETI_TMP_DATE',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('퇴사일자') } 
    }, 
    { 
      fieldName: 'REMARK',
      dataType: 'text',
      styleName: 'left-column',
      editable: false,
      header: { text: t('비고') }
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'YYYY', dataType: 'text', visible: false },
    { fieldName: 'MM', dataType: 'text', visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false },
    { fieldName: 'CLOSE_YYYYMM', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    'BSNS_CD',
    {
      name: '사내협력사',
      direction: 'horizontal',
      items: [ 'ASGN_CD', 'REG_NO', 'COMP_NM'],
      header: { text: t('사내협력사') },
    },
    'WORKER_CNT',
    {
      name: '부서',
      direction: 'horizontal',
      items: [ 'DEPT_CD', 'DEPT_NM'],
      header: { text: t('부서') },
    },
    'KOR_NM',
    {
      name: '인센티브',
      direction: 'horizontal',
      items: [ 'GRADE', 'CAREER_GBN'],
      header: { text: t('인센티브') },
    },
    'PRIORITY',
    'PAY_RATIO',
    {
      name: '근무기간',
      direction: 'horizontal',
      items: [ 'WORK_FROM_DT', 'WORK_TO_DT'],
      header: { text: t('근무기간') },
    },
    'REAL_WORK_DAYS',
    'SUPPORT_FUND',
    'START_DATE',
    'RETI_TMP_DATE',
    'REMARK',
  ]
})

grdMainProps.columns = grdMainProps.fields

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

// 조회
const searchData = () => {
  return commonSearchApi({ 
    queryId : 'SAFIE0030_search01',
    param: {
      CLOSE_DT: searchParams.CLOSE_DT.replace('-', ''),
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD,
      PARTNER_CD: searchParams.PARTNER_CD,
    }
  })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 사업부 변경 시 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    searchParams.DEPT_CD = ''
  }
  if (newValue !== '') {
    commonSearchApi({ queryId : 'searchDept3',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV:'Y'
      } 
    }).then(res => {
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
      if (newValue !== oldValue) {
        // 사업부가 변경 시 "전체" 출력
        searchParams.DEPT_CD = ''
      }
    })
  } else {
    codeList.DEPT_CD = []
    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
  }
})

// 부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  if (newValue !== '') {
    commonSearchApi({ 
      queryId : 'searchVend',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        DEPT_CD: newValue 
      } 
    }).then(res => {
      codeList.PARTNER_CD = res.ORESULT_CUR
      codeList.PARTNER_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
      if (codeList.PARTNER_CD.length !== 0) {
        searchParams.PARTNER_CD = ''
      }
    })
  } else {
    codeList.PARTNER_CD = []
    codeList.PARTNER_CD.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
    searchParams.PARTNER_CD = ''
  }
})

onMounted(() => {
  initCodeList()
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
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.CLOSE_DT"
            :label="$t('마감기준일')"
            type="month"
            width="220px"
          />
          <i-select
            v-model="searchParams.CMPNY_DIV"
            :label="$t('회사')"
            width="300px"
            :items="codeList.CMPNY_DIV"
            item-value="COD"
            item-title="TXT"
            readonly
          />
          <i-select
            v-model="searchParams.BSNS_CD"
            :label="$t('사업부')"
            width="300px"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
          />
          <i-select
            v-model="searchParams.DEPT_CD"
            :label="$t('부서')"
            width="300px"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
          />
          <i-select
            v-model="searchParams.PARTNER_CD"
            :label="$t('협력사')"
            width="300px"
            :items="codeList.PARTNER_CD"
            item-value="ASGN_CD"
            item-title="ASGN_NM"
          />
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
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
  
