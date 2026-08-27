<script setup>
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import { reactive, ref } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

const props = defineProps({
  data: {
    type: Object,
  },
})

const tab01Field = reactive({
  WRK_STUS_VOL_DESC: '',
  STD_WORK_NO: '',
  BSNS_CD: '',
  WRK_STUS_EQP_DESC: '',
  ES_DEPT_CD: '',
  SAGO_EMP_NM: '',
  DEPT_NM: '',
  WRK_STUS_SPD_DESC: '',
  ES_SEQ: '',
  WRK_NM: '',
  WRK_PROCESS: '',
  WRK_STUS_EQP: '',
  ES_DATE: '',
  ES_ASGN_CD: '',
  ES_DIV: '',
  ES_TEL_NO: '',
  CMPNY_DIV: '',
  WRK_STUS_VOL: '',
  ES_EMP_NM: '',
  SEQ_NUM: '',
  SAGO_EMP_CMPNY_DIV: '',
  ES_EMP_NO: '',
  WRK_STUS_INC: '',
  ES_STUS_NM: '',
  SOSOG_DIV: '',
  SAGO_EMP_NO: '',
  WRK_STUS_SPD: '',
  ASGN_SHRT_NM: '',
  JOB_TIT_NM: '',
  ES_DATE2: '',
  WRK_STUS_INC_DESC: '',
})

const codeList = reactive({
  ES_DIV: [], //평가분류
  WRK_STUS_EQP: [], //설비
  WRK_STUS_VOL: [], //작업량
  WRK_STUS_SPD: [], //작업속도
  WRK_STUS_INC: [], //업무변화
  WRK_LOAD: [], //작업부하
  WRK_FREQ: [], //작업빈도
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'UNTWRK_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      styleName: 'left-column',
      header: { text: t('단위작업명') },
    },
    {
      fieldName: 'HO_NO',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('부담작업(호)') },
    },
    {
      fieldName: 'WRK_LOAD',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('작업부하(A)') },
      lookupDisplay: true,
      styleName: 'left-column',
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'WRK_FREQ',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('작업빈도(B)') },
      lookupDisplay: true,
      styleName: 'left-column',
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'TOT_PNT',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('총점수(A*B)') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
    },
    {
      fieldName: 'ES_DATE',
      visible: false,
    },
    {
      fieldName: 'ES_SEQ',
      visible: false,
    },
    {
      fieldName: 'UNTWRK_SEQ',
      visible: false,
    },
    {
      fieldName: 'UNT_WRK_SEQ_ORG',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const initCodeList = () => {
  Promise.all([
    getCodeList('HHII620'),
    getCodeList('HHII622A'),
    getCodeList('HHII622B'),
    getCodeList('HHII622C'),
    getCodeList('HHII622D'),
    getCodeList('HHII623'),
    getCodeList('HHII624'),
  ]).then((res) => {
    codeList.ES_DIV = res[0].ORESULT_CUR
    codeList.WRK_STUS_EQP = res[1].ORESULT_CUR
    codeList.WRK_STUS_VOL = res[2].ORESULT_CUR
    codeList.WRK_STUS_SPD = res[3].ORESULT_CUR
    codeList.WRK_STUS_INC = res[4].ORESULT_CUR
    codeList.WRK_LOAD = res[5].ORESULT_CUR
    codeList.WRK_FREQ = res[6].ORESULT_CUR
    grdMain.value.setBindingColumn('WRK_LOAD', codeList.WRK_LOAD, 'COD', 'TXT')
    grdMain.value.setBindingColumn('WRK_FREQ', codeList.WRK_FREQ, 'COD', 'TXT')
  })
}

onMounted(() => {
  initCodeList()
  searchData()
})

const searchData = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'HLTIB0040_SEARCH_02',
      param: {
        CMPNY_DIV: props.data.CMPNY_DIV,
        ES_DATE: props.data.ES_DATE,
        ES_SEQ: props.data.ES_SEQ,
      },
    }),
    commonSearchApi({
      queryId: 'HLTIB0040_SEARCH_03',
      param: {
        CMPNY_DIV: props.data.CMPNY_DIV,
        ES_DATE: props.data.ES_DATE,
        ES_SEQ: props.data.ES_SEQ,
      },
    }),
  ]).then((res) => {
    for (const [key, value] of Object.entries(res[0].ORESULT_CUR[0])) {
      if (tab01Field.hasOwnProperty(key)) {
        tab01Field[key] = value
      }
    }
    grdMain.value.getDataProvider().setRows(res[1].ORESULT_CUR)
  })
}
</script>

<template>
  <div class="searchArea">
    <div class="mt-2">
      <div>조사개요</div>
      <div class="d-flex">
        <i-select
          width="150px"
          :label="$t('분류')"
          readonly
          v-model="tab01Field.ES_DIV"
          :items="codeList.ES_DIV"
          item-title="TXT"
          item-value="COD"
        >
        </i-select>
        <i-input width="180px" :label="$t('조사일자')" readonly v-model="tab01Field.ES_DATE2"> </i-input>
        <i-input width="150px" :label="$t('조사자')" class="mr-1" readonly v-model="tab01Field.ES_EMP_NO"> </i-input>
        <i-input width="100px" class="ml-0" readonly v-model="tab01Field.ES_EMP_NM"> </i-input>
        <i-input width="150px" :label="$t('진행상태')" readonly v-model="tab01Field.ES_STUS_NM"> </i-input>
        <i-input width="200px" :label="$t('조사ID')" readonly v-model="tab01Field.SEQ_NUM"> </i-input>
      </div>
      <div class="d-flex mt-2">
        <i-input width="250px" :label="$t('소속')" readonly v-model="tab01Field.DEPT_NM"> </i-input>
        <i-input width="300px" :label="$t('표준작업지도서No.')" readonly v-model="tab01Field.STD_WORK_NO"> </i-input>
        <i-input width="450px" :label="$t('작업명')" readonly v-model="tab01Field.WRK_NM"> </i-input>
      </div>
      <div class="d-flex mt-2">
        <i-input
          label-width="200px"
          width="300px"
          :label="$t('업무상 질병(근골격계질환) 발생자')"
          readonly
          class="mr-0"
          v-model="tab01Field.SAGO_EMP_NO"
        >
        </i-input>
        <i-input width="100px" readonly class="ml-1" v-model="tab01Field.SAGO_EMP_NM"> </i-input>
      </div>
    </div>
    <div class="mt-2">
      <div>작업장 상황조사</div>
      <div class="d-flex">
        <div class="mr-2" style="margin-top: 24px">상황종류</div>
        <div style="margin-top: 24px" class="d-flex">
          <div style="width: 200px; margin-left: 65px">설비</div>
          <div style="width: 200px; margin-left: 35px">작업량</div>
          <div style="width: 200px; margin-left: 10px">작업 속도</div>
          <div style="width: 200px; margin-left: 15px">업무 변화</div>
        </div>
      </div>
      <div class="d-flex">
        <div class="mr-2" style="margin-top: 24px">작업상황</div>
        <i-select
          width="200px"
          top-label
          readonly
          :items="codeList.WRK_STUS_EQP"
          item-title="TXT"
          item-value="COD"
          v-model="tab01Field.WRK_STUS_EQP"
        ></i-select>
        <i-select
          width="200px"
          top-label
          readonly
          :items="codeList.WRK_STUS_VOL"
          item-title="TXT"
          item-value="COD"
          v-model="tab01Field.WRK_STUS_VOL"
        ></i-select>
        <i-select
          width="200px"
          top-label
          readonly
          :items="codeList.WRK_STUS_SPD"
          item-title="TXT"
          item-value="COD"
          v-model="tab01Field.WRK_STUS_SPD"
        ></i-select>
        <i-select
          width="200px"
          top-label
          readonly
          :items="codeList.WRK_STUS_INC"
          item-title="TXT"
          item-value="COD"
          v-model="tab01Field.WRK_STUS_INC"
        ></i-select>
      </div>
      <div class="mt-2 d-flex">
        <span class="mt-2 mr-2">변화내용</span>
        <i-input width="200px" readonly v-model="tab01Field.WRK_STUS_EQP_DESC"></i-input>
        <i-input width="200px" readonly v-model="tab01Field.WRK_STUS_VOL_DESC"></i-input>
        <i-input width="200px" readonly v-model="tab01Field.WRK_STUS_SPD_DESC"></i-input>
        <i-input width="200px" readonly v-model="tab01Field.WRK_STUS_INC_DESC"></i-input>
      </div>
    </div>
    <div class="mt-2">
      <div>작업조건조사(인간공학적인 측면을 고려한 조사)</div>
      <div class="mt-2 d-flex">
        <div>1단계 : 작업별 주요 작업내용(유해요인 조사자)</div>
        <span class="mx-3"></span>
        <div>2단계 : 작업별 작업부하 및 작업빈도 (근로자 면담)</div>
      </div>
      <div class="d-flex mt-2">
        <div><i-input :label="$t('작업명')" width="400px" readonly v-model="tab01Field.WRK_NM"></i-input></div>
      </div>
      <div style="height: 250px" class="mt-2">
        <IGridTitle ref="gridTitle" :title="$t('작업내용')"></IGridTitle>
        <RealGrid
          ref="grdMain"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          style="heigth: 100%"
        ></RealGrid>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
