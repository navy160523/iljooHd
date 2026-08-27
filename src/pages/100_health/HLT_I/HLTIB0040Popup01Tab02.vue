<script setup>
import ImageViewerSingle from '@/components/popup/ImageViewerSingle.vue'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { ref, reactive } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
const grd1 = ref(null)
const grd2 = ref(null)
const grd3 = ref(null)
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const image1 = ref(null)
const image2 = ref(null)
const image3 = ref(null)

const props = defineProps({
  data: {
    type: Object,
  },
})

const tab02Field = reactive({
  IMP_NO_RESN_1: '',
  HO_NO_2: '',
  STD_WORK_NO: '',
  HO_NO_3: '',
  IMPLN_DSC_1: '',
  HO_NO_1: '',
  IMP_NO_RESN_3: '',
  IMPLN_DSC_3: '',
  IMP_NO_RESN_2: '',
  IMPLN_DSC_2: '',
  WKR_EMP_NNM: '',
  ES_SEQ: '',
  WRK_NM: '',
  IMPLN_DATE_2: '',
  ES_DATE: '',
  IMPLN_DATE_3: '',
  IMPLN_DATE_1: '',
  UNTWRK_SEQ_1: '',
  CMPNY_DIV: '',
  IMP_YN_3: '',
  SEQ_NUM: '',
  IMP_YN_2: '',
  IMP_YN_1: '',
  WKR_EMP_NO: '',
  UNTWRK_SEQ_3: '',
  UNTWRK_SEQ_2: '',
  IMPLN_EMP_NM_1: '',
  WKR_DUTY_NM: '',
  ES_STUS_NM: '',
  IMPLN_EMP_NO_1: '',
  IMPLN_EMP_NM_3: '',
  IMPLN_EMP_NM_2: '',
  IMPLN_EMP_NO_3: '',
  IMPLN_EMP_NO_2: '',
  UNTWRK_NM_2: '',
  HRMF_FILEID_1: '',
  UNTWRK_NM_3: '',
  HRMF_FILEID_2: '',
  HRMF_FILEID_3: '',
  UNTWRK_NM_1: '',
})

const codeList = reactive({
  HRMF_FCTR: [],
})

const initCodeList = () => {
  Promise.all([getCodeList('HHII629')]).then((res) => {
    codeList.HRMF_FCTR = res[0].ORESULT_CUR
    grd1.value.setBindingColumn('HRMF_FCTR', codeList.HRMF_FCTR, 'COD', 'TXT')
    grd2.value.setBindingColumn('HRMF_FCTR', codeList.HRMF_FCTR, 'COD', 'TXT')
    grd3.value.setBindingColumn('HRMF_FCTR', codeList.HRMF_FCTR, 'COD', 'TXT')
  })
}

onMounted(() => {
  Promise.all([
    commonSearchApi({
      queryId: 'HLTIB0040_SEARCH_04',
      param: {
        CMPNY_DIV: props.data.CMPNY_DIV,
        ES_DATE: props.data.ES_DATE,
        ES_SEQ: props.data.ES_SEQ,
      },
    }),
  ]).then((res) => {
    for (const [key, value] of Object.entries(res[0].ORESULT_CUR[0])) {
      if (tab02Field.hasOwnProperty(key)) {
        tab02Field[key] = value
      }
    }
    if (tab02Field.HRMF_FILEID_1) {
      image1.value.setGuid(tab02Field.HRMF_FILEID_1)
      image1.value.onButtonsClick({ id: 'btnSearch' })
    }
    if (tab02Field.HRMF_FILEID_2) {
      image2.value.setGuid(tab02Field.HRMF_FILEID_2)
      image2.value.onButtonsClick({ id: 'btnSearch' })
    }
    if (tab02Field.HRMF_FILEID_3) {
      image3.value.setGuid(tab02Field.HRMF_FILEID_3)
      image3.value.onButtonsClick({ id: 'btnSearch' })
    }
    let param1 = {
      CMPNY_DIV: props.data.CMPNY_DIV,
      ES_DATE: props.data.ES_DATE,
      ES_SEQ: props.data.ES_SEQ,
      UNTWRK_SEQ: tab02Field.UNTWRK_SEQ_1,
    }
    let param2 = {
      CMPNY_DIV: props.data.CMPNY_DIV,
      ES_DATE: props.data.ES_DATE,
      ES_SEQ: props.data.ES_SEQ,
      UNTWRK_SEQ: tab02Field.UNTWRK_SEQ_2,
    }
    let param3 = {
      CMPNY_DIV: props.data.CMPNY_DIV,
      ES_DATE: props.data.ES_DATE,
      ES_SEQ: props.data.ES_SEQ,
      UNTWRK_SEQ: tab02Field.UNTWRK_SEQ_3,
    }
    Promise.all([
      commonSearchApi({
        queryId: 'HLTIB0040_SEARCH_05',
        param: param1,
      }),
      commonSearchApi({
        queryId: 'HLTIB0040_SEARCH_05',
        param: param2,
      }),
      commonSearchApi({
        queryId: 'HLTIB0040_SEARCH_05',
        param: param3,
      }),
    ]).then((res) => {
      grd1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      grd2.value.getDataProvider().setRows(res[1].ORESULT_CUR)
      grd3.value.getDataProvider().setRows(res[2].ORESULT_CUR)
    })
  })
  image1.value.unVisibleButton('btnFileUpload', false)
  image1.value.unVisibleButton('btnDelete', false)
  image2.value.unVisibleButton('btnFileUpload', false)
  image2.value.unVisibleButton('btnDelete', false)
  image3.value.unVisibleButton('btnFileUpload', false)
  image3.value.unVisibleButton('btnDelete', false)
  initCodeList()
})

const grdTop = reactive({
  fields: [
    {
      fieldName: 'HRMF_FCTR',
      dataType: 'text',
      width: '30',
      editable: false,
      styleName: 'left-column',
      header: { text: t('유해요인') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'OCCR_CUSE',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('발생원인') },
    },
    {
      fieldName: 'RMK',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('비고') },
    },
  ],
  columns: [],
})

const grdMiddle = reactive({
  fields: [
    {
      fieldName: 'HRMF_FCTR',
      dataType: 'text',
      width: '30',
      editable: false,
      styleName: 'left-column',
      header: { text: t('유해요인') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'OCCR_CUSE',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('발생원인') },
    },
    {
      fieldName: 'RMK',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('비고') },
    },
  ],
  columns: [],
})

const grdBottom = reactive({
  fields: [
    {
      fieldName: 'HRMF_FCTR',
      dataType: 'text',
      width: '30',
      editable: false,
      styleName: 'left-column',
      header: { text: t('유해요인') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'OCCR_CUSE',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('발생원인') },
    },
    {
      fieldName: 'RMK',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('비고') },
    },
  ],
  columns: [],
})

grdTop.columns = grdTop.fields
grdMiddle.columns = grdMiddle.fields
grdBottom.columns = grdBottom.fields
</script>

<template>
  <div class="searchArea">
    <div>작업조건조사 (인간공학적인 측면을 고려한 조사)</div>
    <div style="display: flex; align-items: center">
      <div>3단계 : 유해요인 평가</div>
      <div style="margin-left: auto; display: flex; gap: 10px">
        <i-input width="200px" :label="$t('진행상태')" v-model="tab02Field.ES_STUS_NM" readonly></i-input>
        <i-input width="200px" :label="$t('조사ID')" v-model="tab02Field.SEQ_NUM" readonly></i-input>
      </div>
    </div>
    <div class="d-flex mt-1">
      <i-input width="350px" :label="$t('표준작업지도서No.')" v-model="tab02Field.STD_WORK_NO" readonly></i-input>
      <i-input width="150px" :label="$t('근로자명')" v-model="tab02Field.WKR_EMP_NO" readonly></i-input>
      <i-input width="100px" v-model="tab02Field.WKR_EMP_NNM" readonly></i-input>
      <i-input width="350px" :label="$t('작업명')" v-model="tab02Field.WRK_NM" readonly></i-input>
    </div>
    <div class="d-flex mt-2 justify-space-between">
      <div style="width: 30%"><ImageViewerSingle ref="image1"></ImageViewerSingle></div>
      <span class="mx-2"></span>
      <div style="width: 30%"><ImageViewerSingle ref="image2"></ImageViewerSingle></div>
      <span class="mx-2"></span>
      <div style="width: 30%"><ImageViewerSingle ref="image3"></ImageViewerSingle></div>
    </div>
    <div class="mt-1 d-flex justify-space-between">
      <div style="width: 30%">
        <i-input width="90%" :label="$t('단위작업명')" v-model="tab02Field.UNTWRK_NM_1" readonly></i-input>
      </div>
      <div style="width: 30%">
        <i-input width="90%" :label="$t('단위작업명')" v-model="tab02Field.UNTWRK_NM_2" readonly></i-input>
      </div>
      <div style="width: 30%">
        <i-input width="90%" :label="$t('단위작업명')" v-model="tab02Field.UNTWRK_NM_3" readonly></i-input>
      </div>
    </div>
    <div class="mt-2">작업별로 관찰 된 유해요인에 대한 원인 분석</div>
    <div class="d-flex">
      <i-input width="400px" :label="$t('단위작업명')" v-model="tab02Field.UNTWRK_NM_1" readonly></i-input>
      <i-input width="200px" :label="$t('부담작업(호)')" v-model="tab02Field.HO_NO_1" readonly></i-input>
    </div>
    <div class="mt-2 d-flex">
      <div style="width: 50%; height: 135px">
        <RealGrid ref="grd1" :fields="grdTop.fields" :columns="grdTop.columns" style="heigth: 100%"></RealGrid>
      </div>
      <span class="mx-1"></span>
      <div style="width: 30%">
        <i-textarea width="100%" :label="$t('개선계획')" top-label v-model="tab02Field.IMPLN_DSC_1"></i-textarea>
      </div>
      <span class="mx-1"></span>
      <div style="width: 20%">
        <i-input :label="$t('작성자')" top-label width="100%" v-model="tab02Field.IMPLN_EMP_NM_1" readonly></i-input>
        <span class="my-2"></span>
        <i-input
          :label="$t('개선완료예정일')"
          top-label
          width="100%"
          v-model="tab02Field.IMPLN_DATE_1"
          readonly
        ></i-input>
      </div>
    </div>
    <div class="mt-1 d-flex">
      <div class="mt-1 mr-4">
        <v-radio-group inline v-model="tab02Field.IMP_YN_1" readonly>
          <v-radio label="개선가능" value="Y"></v-radio>
          <v-radio label="현행유지" value="N"></v-radio>
        </v-radio-group>
      </div>
      <div>
        <i-input :label="$t('현행유지 사유')" width="500px" v-model="tab02Field.IMP_NO_RESN_1" readonly></i-input>
      </div>
    </div>
    <div class="d-flex mt-1">
      <i-input width="400px" :label="$t('단위작업명')" v-model="tab02Field.UNTWRK_NM_2" readonly></i-input>
      <i-input width="200px" :label="$t('부담작업(호)')" v-model="tab02Field.HO_NO_2" readonly></i-input>
    </div>
    <div class="mt-2 d-flex">
      <div style="width: 50%; height: 135px">
        <RealGrid ref="grd2" :fields="grdMiddle.fields" :columns="grdMiddle.columns" style="heigth: 100%"></RealGrid>
      </div>
      <span class="mx-1"></span>
      <div style="width: 30%">
        <i-textarea width="100%" :label="$t('개선계획')" top-label v-model="tab02Field.IMPLN_DSC_2"></i-textarea>
      </div>
      <span class="mx-1"></span>
      <div style="width: 20%">
        <i-input :label="$t('작성자')" top-label width="100%" readonly v-model="tab02Field.IMPLN_EMP_NM_2"></i-input>
        <span class="my-2"></span>
        <i-input
          :label="$t('개선완료예정일')"
          top-label
          width="100%"
          readonly
          v-model="tab02Field.IMPLN_DATE_2"
        ></i-input>
      </div>
    </div>
    <div class="mt-1 d-flex">
      <div class="mt-1 mr-4">
        <v-radio-group inline readonly v-model="tab02Field.IMP_YN_2">
          <v-radio label="개선가능" value="Y"></v-radio>
          <v-radio label="현행유지" value="N"></v-radio>
        </v-radio-group>
      </div>
      <div>
        <i-input :label="$t('현행유지 사유')" width="500px" readonly v-model="tab02Field.IMP_NO_RESN_2"></i-input>
      </div>
    </div>
    <div class="d-flex mt-1">
      <i-input width="400px" :label="$t('단위작업명')" readonly v-model="tab02Field.UNTWRK_NM_3"></i-input>
      <i-input width="200px" :label="$t('부담작업(호)')" readonly v-model="tab02Field.HO_NO_3"></i-input>
    </div>
    <div class="mt-2 d-flex">
      <div style="width: 50%; height: 135px">
        <RealGrid ref="grd3" :fields="grdBottom.fields" :columns="grdBottom.columns" style="heigth: 100%"></RealGrid>
      </div>
      <span class="mx-1"></span>
      <div style="width: 30%">
        <i-textarea width="100%" :label="$t('개선계획')" top-label v-model="tab02Field.IMPLN_DSC_3"></i-textarea>
      </div>
      <span class="mx-1"></span>
      <div style="width: 20%">
        <i-input :label="$t('작성자')" top-label width="100%" readonly v-model="tab02Field.IMPLN_EMP_NM_3"></i-input>
        <span class="my-2"></span>
        <i-input
          :label="$t('개선완료예정일')"
          top-label
          width="100%"
          readonly
          v-model="tab02Field.IMPLN_DATE_3"
        ></i-input>
      </div>
    </div>
    <div class="mt-1 d-flex">
      <div class="mt-1 mr-4">
        <v-radio-group inline v-model="tab02Field.IMP_YN_3" readonly>
          <v-radio label="개선가능" value="Y"></v-radio>
          <v-radio label="현행유지" value="N"></v-radio>
        </v-radio-group>
      </div>
      <div>
        <i-input :label="$t('현행유지 사유')" width="500px" v-model="tab02Field.IMP_NO_RESN_3" readonly></i-input>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
