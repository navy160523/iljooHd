<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import QuestionnaireStatus from '@/pages/40_safety-risk/SRM_B/Popup/SRMBA0020_popup01.vue'

defineOptions({
  name: '40_safety-risk-SRM_B-SRMBA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)
const questionnaireStatus = ref(null) // 설문지 현황 관리 팝업

//조회조건
let searchParams = reactive({    
  COMPANY_CD: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  YEAR: dayjs().get('year'),
  SEQ: '1'// 지울거
})

// 코드리스트
const codeList = reactive({
  COMPANY_CD: [],
  BSNS_CD: [],
  DEPT_CD: [],
  YEAR: [],
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
  ]).then(res => {
    codeList.COMPANY_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_CD: '', BSNS_NM: '전체' })
    searchParams.BSNS_CD = userStore.bsnsCd
  })
}

//그리드 속성셋팅
const grdProps1 = reactive({
  fields: [
    { fieldName: 'COL1', dataType: 'text', header: { text: t('설문지 구분') } },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('설문지 종류') } },
    { fieldName: 'COL3', dataType: 'text', header: { text: t('설문지 제목') } },
    { fieldName: 'COL4', dataType: 'text', header: { text: t('사업부') } },
    { fieldName: 'COL5', dataType: 'text', header: { text: t('부서') } },
    { fieldName: 'COL6', dataType: 'text', header: { text: t('작성자') } },
    { fieldName: 'COL7', dataType: 'text', header: { text: t('담당부서') } },
    { fieldName: 'COL8', dataType: 'text', header: { text: t('등록일자') } },
  ], 
  columns: [],
})

grdProps1.columns = grdProps1.fields

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
    // grdMain.value.getDataProvider().setRows(data)
  } else if (btn.id === 'btnQuestionnaireStatus') {
    questionnaireStatus.value.openPopup({})
  }
}

// 조회
const searchData = () => {
  return commonSearchApi({ queryId: 'SRMBA0020_search01', param: searchParams })
}

const afterSearch = res => {
  console.log('조회', res.ORESULT_CUR)
}

// 사업부 변경 시 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  commonSearchApi({
    queryId : 'searchDept3',
    param : {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: newValue,
      USE_DIV:'Y'
    }
  }).then(res => {
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

      if (!oldValue) {
        return searchParams.DEPT_CD = userStore.deptCd
      }
      if (newValue !== oldValue) {
        searchParams.DEPT_CD = ''
      }
    })
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
        :button-list="['btnSearch', 'btnSendIntegratedManagement', 'btnPrintList', 'btnQuestionnaireStatus']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
        <div class="d-flex mt-2">
          <!-- 회사 -->
          <i-select
            :label="$t('회사')"
            label-width="65px"
            width="300px"
            v-model="searchParams.COMPANY_CD"
            :items="codeList.COMPANY_CD"
            item-value="COD"
            item-title="TXT"
            readonly 
          />
          <!-- 사업부 -->
          <i-select
            :label="$t('사업부')"
            label-width="65px"
            width="300px" 
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
          />
          <!-- 담당부서 -->
          <i-select
            :label="$t('담당부서')"
            label-width="65px"
            width="300px"
            v-model="searchParams.DEPT_CD"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
          />
          <!-- 담당 안전부 -->
          <i-select
            :label="$t('담당 안전부')"
            label-width="65px"
            width="300px"
          />
        </div>
        <div class="d-flex mt-2">
          <!-- 년도 -->
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('년도')"
            label-width="65px"
            width="300px"
            type="YEAR"
          />
           <!-- 우수제안 -->
           <i-select
            :label="$t('우수제안')"
            label-width="65px"
            width="300px"
          />
          <!-- 중복제안 -->
          <i-select
            :label="$t('중복제안')"
            label-width="65px"
            width="300px"
          />
          <!-- 키워드검색 -->
          <i-input
            :label="$t('키워드검색')"
            label-width="65px"
            width="300px"
          />
        </div>
        <div class="d-flex mt-2">
          <!-- 설문지 구분 -->
          <i-select
            :label="$t('설문지 구분')"
            label-width="65px"
            width="300px"
          />
          <!-- 설문지 종류 -->
          <i-select
            :label="$t('설문지 종류')"
            label-width="65px"
            width="300px"
          />
          <!-- 설문지 제목 -->
          <i-select
            :label="$t('설문지 제목')"
            label-width="65px"
            width="300px"
          />
        </div>
        </v-sheet>
        <v-sheet>
          <IGridTitle 
            :title="$t('안전RISK공모전 리스트')"
          >
            <template #editors/>
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: calc(100vh - 700px);"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys" 
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <QuestionnaireStatus ref="questionnaireStatus"/>
</template>
