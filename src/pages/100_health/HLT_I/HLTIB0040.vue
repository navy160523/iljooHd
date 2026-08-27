<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import HLTIB0040Popup01 from './HLTIB0040Popup01.vue'
defineOptions({
  name: '100_health-HLT_I-HLTIB0040',
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const hLTIB0040Popup01 = ref(null)
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DATE_FROM: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
  DATE_TO: dayjs().format('YYYY-MM-DD'),
  SOSOG_DIV: 'A',
})

const codeList = reactive({
  ORGN_DIV: [
    { TXT: '직영', COD: 'A' },
    { TXT: '사내협력사', COD: 'B' },
  ],
  BSNS_CD: [],
  ES_DIV: [],
})

const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: '' },
    }),
    //조사구분(평가분류)
    getCodeList('HHII620'),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.ES_DIV = res[1].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.ES_DIV.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('BSNS_CD', codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('ES_DIV', codeList.ES_DIV, 'COD', 'TXT')
  })
}

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'SHOW_HISTORY',
      dataType: 'text',
      width: '100S',
      editable: false,
      header: { text: t('조사이력보기') },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        const iconSize = 15

        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function (grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }

        return ret
      },
    },
    {
      fieldName: 'ES_DIV',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('분류') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('사업부') },
      lookupDisplay: true,
      styleName: 'left-column',
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '200',
      editable: false,
      styleName: 'left-column',
      header: { text: t('부서명') },
    },
    {
      fieldName: 'ASGN_SHRT_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      styleName: 'left-column',
      header: { text: t('소속') },
    },
    {
      fieldName: 'ES_EMP_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('유해요인조사자') },
    },
    {
      fieldName: 'SAGO_EMP_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('업무상질병발생자') },
    },
    {
      fieldName: 'STD_WORK_NO',
      width: '150',
      editable: false,
      header: { text: t('지도서No.') },
    },
    {
      fieldName: 'WRK_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('작업명') },
    },
    {
      fieldName: 'WKR_DUTY_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직종') },
    },
    {
      fieldName: 'HO_NO',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('부담작업(호)') },
    },
    {
      fieldName: 'ES_DATE2',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('평가일자') },
    },
    {
      fieldName: 'JOSA_CNT',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('증사조사등록(건)') },
    },
    {
      fieldName: 'ES_STUS_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('조사결과진행상태') },
    },
    {
      fieldName: 'IMP_CNT',
      dataType: 'text',
      width: '140',
      editable: false,
      header: { text: t('개선가능단위작업수') },
    },
    {
      fieldName: 'IMP_PLAN_CNT',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('개선계획등록건수') },
    },
    {
      fieldName: 'CLOSE_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('완료처리일') },
    },
    {
      fieldName: 'APP_UP_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('결재상신일') },
    },
    {
      fieldName: 'APP_RST_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('결재완료일') },
    },
    {
      fieldName: 'SEQ_NUM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('조사ID') },
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
      fieldName: 'SOSOG_DIV',
      visible: false,
    },
    {
      fieldName: 'WRK_CNT',
      visible: false,
    },
    {
      fieldName: 'CONFIRM_CHK_CNT',
      visible: false,
    },
    {
      fieldName: 'UNTWRK_SEQ',
      visible: false,
    },
    {
      fieldName: 'IMP_RST_CNT',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
  onButtonsClick({ id: 'btnSearch' })
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTIB0040_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellClicked = (grid, clickData) => {
  if (clickData.column === 'SHOW_HISTORY') {
    let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    hLTIB0040Popup01.value.openPopup(rowData)
  }
}
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
            <i-input :label="$t('기간')" type="date" width="200px" label-width="50px" v-model="searchParam.DATE_FROM">
            </i-input>
            <span class="mt-2 mr-2">~</span>
            <i-input type="date" width="150px" v-model="searchParam.DATE_TO"> </i-input>
            <i-select
              :label="$t('조직구분')"
              width="150px"
              v-model="searchParam.SOSOG_DIV"
              :items="codeList.ORGN_DIV"
              item-title="TXT"
              item-value="COD"
            >
            </i-select>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellClicked="onCellClicked"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
    <HLTIB0040Popup01 ref="hLTIB0040Popup01"></HLTIB0040Popup01>
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
    min-height: 400px;
  }
}
</style>
