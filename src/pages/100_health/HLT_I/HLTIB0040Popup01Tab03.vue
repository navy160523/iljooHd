<script setup>
import { ref, reactive } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import HLTIB0040Popup01Tab03Tab01 from './HLTIB0040Popup01Tab03Tab01.vue'
import HLTIB0040Popup01Tab03Tab02 from './HLTIB0040Popup01Tab03Tab02.vue'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { useUserStore } from '@hiway/stores/user'

const menuTitle = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const tab = ref('page_1')
const tab01 = ref(null)
const tab02 = ref(null)
const selectedEmpData = reactive({}) //인원팝업에서 선택한 데이터를 증상조사표 컴포넌트에 props로 내려준다.
let tabData = reactive({})

const props = defineProps({
  data: {
    type: Object,
  },
})

const codeList = reactive({
  DUTY_CD: [],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'HLTIB0040_SEARCH_07',
      param: {
        CMPNY_DIV: props.data.CMPNY_DIV,
      },
    }),
  ]).then((res) => {
    codeList.DUTY_CD = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('DUTY_CD', codeList.DUTY_CD, 'COD', 'TXT')
  })
}

onMounted(() => {
  let param = {
    CMPNY_DIV: props.data.CMPNY_DIV,
    ES_DATE: props.data.ES_DATE,
    ES_SEQ: props.data.ES_SEQ,
  }
  commonSearchApi({
    queryId: 'HLTIB0040_SEARCH_06',
    param: param,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.getGridView().setCurrent(0)
  })
  initCodeList()
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('부서명/협력사명') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'DUTY_CD',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직무') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'AGE',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('연령(만)') },
    },
    {
      fieldName: 'SEX',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('성별') },
    },
    {
      fieldName: 'MRY_YN',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('결혼여부') },
    },
    {
      fieldName: 'WRK_DESC',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('현 작업내용') },
    },
    {
      fieldName: 'WRK_YEARS_MNTH',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('작업기간(년-개월)') },
    },
    {
      fieldName: 'WRK_TM_HH',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('1일근무시간(HR)') },
    },
    {
      fieldName: 'WORK_STANDARD_ID',
      visible: false,
    },
    {
      fieldName: 'ES_DATE',
      visible: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
    },
    {
      fieldName: 'ES_SEQ',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//행변경 이벤트
const rowChanged = async (grid, oldRow, newRow) => {
  if (newRow === -1) {
    return false
  }
  let rowData = await grdMain.value.getDataProvider().getJsonRow(newRow)
  let param = {
    CMPNY_DIV: props.data.CMPNY_DIV,
    ES_DATE: props.data.ES_DATE,
    ES_SEQ: props.data.ES_SEQ,
    EMP_NO: rowData.EMP_NO,
  }
  commonSearchApi({
    queryId: 'HLTIB0040_SEARCH_08',
    param: param,
  }).then((res) => {
    tab01.value.setFieldTab01(res.ORESULT_CUR[0])
    tab02.value.setFieldTab02(res.ORESULT_CUR[0])
  })
}
</script>

<template>
  <v-card class="pa-0 fill-height rounded-b-5">
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet>
          <v-sheet class="pa-0" style="height: 300px">
            <RealGrid
              ref="grdMain"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCurrentRowChanged="rowChanged"
            />
          </v-sheet>
          <div class="gridTitle mt-3 ml-3">
            <!-- 근골격계 부담작업 증상 조사표 :{{ selectedEmpData.EMP_NM }}({{ selectedEmpData.EMP_NO }}) -->
          </div>
          <v-tabs v-model="tab">
            <v-tab value="page_1">증상 조사표 1/2 페이지</v-tab>
            <v-tab value="page_2">증상 조사표 2/2 페이지</v-tab>
          </v-tabs>
          <v-window v-model="tab">
            <v-window-item eager value="page_1">
              <HLTIB0040Popup01Tab03Tab01 ref="tab01" :tab01-data="props.data"></HLTIB0040Popup01Tab03Tab01>
            </v-window-item>
            <v-window-item eager value="page_2">
              <HLTIB0040Popup01Tab03Tab02 ref="tab02"></HLTIB0040Popup01Tab03Tab02>
            </v-window-item>
          </v-window>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
