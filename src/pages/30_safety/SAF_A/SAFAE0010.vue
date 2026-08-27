<!--
화면명 : 안전사고통계
화면개요 : 유형별, 항목별 안전사고통계 조회
-->
<script setup>
import { commonSearchApi, commonExecuteApi, getCodeList, commonSendApi } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const logsStore = useLogsStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)
const grdMain2 = ref(null)
// const grdMain3 = ref(null)
const grdMain4 = ref(null)
const grdMain5 = ref(null)
const t = useI18n().t
const tabValue = ref('0')

defineOptions({
  name: '30_safety-SAF_A-SAFAE0010',
})

const grdMainProps1 = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible: false }, header: { height: 80 } },
  keys: [],
  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      header: { text: t('사업부') },
      editable: false,
      width: 150,
      styleName: 'left-column',
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      header: { text: t('구분') },
      editable: false,
      width: 150,
      styleName: 'left-column',
      mergeRule: { criteria: "value['BSNS_NM'] + value" },
    },
    { fieldName: 'SAGO_CNT', dataType: 'text', header: { text: t('건수') }, editable: false, styleName: 'right-column', width: 65, },
    {
      fieldName: 'SAGO_RATE',
      dataType: 'text',
      header: { text: t('점유율') },
      editable: false,
      styleName: 'right-column',
      width: 65,
    },
    { fieldName: 'SAGO_A_CNT', dataType: 'text', header: { text: t('떨어짐') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_B_CNT', dataType: 'text', header: { text: t('넘어짐') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_C_CNT', dataType: 'text', header: { text: t('깔림') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_D_CNT', dataType: 'text', header: { text: t('부딪힘') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_E_CNT', dataType: 'text', header: { text: t('맞음') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_F_CNT', dataType: 'text', header: { text: t('끼임,감김') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_G_CNT', dataType: 'text', header: { text: t('절단,베임,\n찔림'), styleName: 'multiline-editor-pre' },
      editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_H_CNT', dataType: 'text', header: { text: t('감전') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_J_CNT', dataType: 'text', header: { text: t('폭발') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_K_CNT', dataType: 'text', header: { text: t('이상온도\n접촉'), styleName: 'multiline-editor-pre' },
      editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_L_CNT', dataType: 'text', header: { text: t('화학물질\n접촉'), styleName: 'multiline-editor-pre' },
      editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_M_CNT', dataType: 'text', header: { text: t('산소결핍') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_N_CNT', dataType: 'text', header: { text: t('빠짐,익사') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_O_CNT', dataType: 'text', header: { text: t('무리한 동작\n(근골격계)'), styleName: 'multiline-editor-pre' },
      editable: false, styleName: 'right-column', width: 75, },
    { fieldName: 'SAGO_P_CNT', dataType: 'text', header: { text: t('교통사고') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_Q_CNT', dataType: 'text', header: { text: t('폭력행위') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_R_CNT', dataType: 'text', header: { text: t('질환성') }, editable: false, styleName: 'right-column', width: 65, },
    { fieldName: 'SAGO_Z_CNT', dataType: 'text', header: { text: t('기타') }, editable: false, styleName: 'right-column', width: 65, },
  ],
  columns: [],
  columnLayout: [
    'BSNS_NM',
    'ASGN_NM',
    {
      name: '계',
      direction: 'horizontal',
      items: ['SAGO_CNT', 'SAGO_RATE'],
      header: { text: t('계') },
    },
    {
      name: '작업성 사고',
      direction: 'horizontal',
      items: [],
      header: { text: t('작업성 사고') },
    },
    'SAGO_A_CNT',
    'SAGO_B_CNT',
    'SAGO_C_CNT',
    'SAGO_D_CNT',
    'SAGO_E_CNT',
    'SAGO_F_CNT',
    'SAGO_G_CNT',
    'SAGO_H_CNT',
    'SAGO_J_CNT',
    'SAGO_K_CNT',
    'SAGO_L_CNT',
    'SAGO_M_CNT',
    'SAGO_N_CNT',
    'SAGO_O_CNT',
    'SAGO_P_CNT',
    'SAGO_Q_CNT',
    'SAGO_R_CNT',
    'SAGO_Z_CNT'
  ],
})

const grdMainProps2 = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'GBN_NM', dataType: 'text', header: { text: t('공정') }, editable: false },
    { fieldName: 'CNT', dataType: 'text', header: { text: t('사고건수') }, editable: false },
    { fieldName: 'MAX_CNT', dataType: 'text', header: { text: t('사고건수Max') }, visible: false },
  ],
})

const grdMainProps3 = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'GBN_NM', dataType: 'text', header: { text: t('직종') }, editable: false },
    { fieldName: 'CNT', dataType: 'text', header: { text: t('사고건수') }, editable: false },
    { fieldName: 'MAX_CNT', dataType: 'text', header: { text: t('사고건수Max') }, visible: false },
  ],
})

const grdMainProps4 = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'GBN_NM', dataType: 'text', header: { text: t('요일') }, editable: false },
    { fieldName: 'CNT', dataType: 'text', header: { text: t('사고건수') }, editable: false },
    { fieldName: 'MAX_CNT', dataType: 'text', header: { text: t('사고건수Max') }, visible: false },
  ],
})

const grdMainProps5 = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'GBN_NM', dataType: 'text', header: { text: t('시간대') }, editable: false },
    { fieldName: 'CNT', dataType: 'text', header: { text: t('사고건수') }, editable: false },
    { fieldName: 'MAX_CNT', dataType: 'text', header: { text: t('사고건수Max') }, visible: false },
  ],
})

grdMainProps1.columns = grdMainProps1.fields
grdMainProps2.columns = grdMainProps2.fields
grdMainProps3.columns = grdMainProps3.fields
grdMainProps4.columns = grdMainProps4.fields
grdMainProps5.columns = grdMainProps5.fields

const cdList = reactive({
  BSNS_CD: [], // 사업부
  DEPT_CD: [], // 부서
})

const searchParams = reactive({
  CMPNY_DIV: '',
  YYMM: '',
  BSNS_CD: '',
  DEPT_CD: '',
})

watch(
  () => searchParams.BSNS_CD,
  (newValue) => {
    if (newValue) {
      commonSearchApi({
        queryId: 'searchDept3',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: newValue,
        },
      }).then((res) => {
        searchParams.DEPT_CD = ''
        cdList.DEPT_CD = res.ORESULT_CUR
        cdList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      })
    } else {
      searchParams.DEPT_CD = ''
      cdList.DEPT_CD = []
      cdList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    }
  }
)

const setCdList = async () => {
  await commonSearchApi({
    queryId: 'searchBSNS',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      USE_DIV: 'N',
    },
  }).then(async (res) => {
    // console.log('searchBSNS res', res)

    cdList.BSNS_CD = _.cloneDeep(res.ORESULT_CUR)
    cdList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    cdList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  })
}

const setInit = () => {
  grdMain2.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {
      style: {
        'background-color': undefined,
      },
    }

    if (dataCell && dataCell.index) {
      if (grid.getValue(dataCell.index.itemIndex, 'GBN_NM') === '합계') {
        ret.style['background-color'] = '#00cc00'
      } else {
        ret.renderer = {
          type: 'bar',
          absoluteValue: true,
          maximum: grid.getValue(dataCell.index.itemIndex, 'MAX_CNT'),
        }
      }
    }

    return ret
  })

  grdMain4.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {
      style: {
        'background-color': undefined,
      },
    }

    if (dataCell && dataCell.index) {
      if (grid.getValue(dataCell.index.itemIndex, 'GBN_NM') === '합계') {
        ret.style['background-color'] = '#00cc00'
      } else {
        ret.renderer = {
          type: 'bar',
          absoluteValue: true,
          maximum: grid.getValue(dataCell.index.itemIndex, 'MAX_CNT'),
        }
      }
    }

    return ret
  })

  grdMain5.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {
      style: {
        'background-color': undefined,
      },
    }

    if (dataCell && dataCell.index) {
      if (grid.getValue(dataCell.index.itemIndex, 'GBN_NM') === '합계') {
        ret.style['background-color'] = '#00cc00'
      } else {
        ret.renderer = {
          type: 'bar',
          absoluteValue: true,
          maximum: grid.getValue(dataCell.index.itemIndex, 'MAX_CNT'),
        }
      }
    }

    return ret
  })

  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  searchParams.YYMM = dayjs().format('YYYY-MM')
}

const beforeSearchMain = () => {
  if (!searchParams.YYMM) {
    Message.warn(t('발생년월을 선택해주세요.'))
    return false
  }

  return true
}

const searchMain = () => {
  const param = _.cloneDeep(searchParams)

  // console.log('param', param)

  param.YYMM = param.YYMM.replaceAll('-', '')

  return Promise.all([
    commonSearchApi({ queryId: 'SAFAE0010_SEARCH_01', param: param }),
    commonSearchApi({ queryId: 'SAFAE0010_SEARCH_02', param: param }),
    // commonSearchApi({ queryId : 'SAFAE0010_SEARCH_03', param: param }),
    commonSearchApi({ queryId: 'SAFAE0010_SEARCH_04', param: param }),
    commonSearchApi({ queryId: 'SAFAE0010_SEARCH_05', param: param }),
  ])
}

const afterSearchMain = (res) => {
  // console.log('res', res)

  setTab1(_.cloneDeep(res[0]))
  setTab2(
    _.cloneDeep(res[1].ORESULT_CUR),
    // _.cloneDeep(res[2].ORESULT_CUR),
    _.cloneDeep(res[2].ORESULT_CUR),
    _.cloneDeep(res[3].ORESULT_CUR)
  )
}

const setTab1 = (result) => {
  // console.log('result', result)

  grdMain1.value.getDataProvider().setRows(result.ORESULT_CUR2)
}

const setTab2 = (result1, result2, result3) => {
  const max1 = _.max(
    result1.map((item) => {
      return item.GBN_NM !== '합계' ? item.CNT : 0
    })
  )

  const max2 = _.max(
    result2.map((item) => {
      return item.GBN_NM !== '합계' ? item.CNT : 0
    })
  )

  const max3 = _.max(
    result3.map((item) => {
      return item.GBN_NM !== '합계' ? item.CNT : 0
    })
  )

  result1.forEach((item) => {
    item.MAX_CNT = max1
  })

  result2.forEach((item) => {
    item.MAX_CNT = max2
  })

  result3.forEach((item) => {
    item.MAX_CNT = max3
  })

  grdMain2.value.getDataProvider().setRows(result1)
  // grdMain3.value.getDataProvider().setRows(result2)
  grdMain4.value.getDataProvider().setRows(result2)
  grdMain5.value.getDataProvider().setRows(result3)
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setBefore(beforeSearchMain).setQuery(searchMain).setAfter(afterSearchMain).run()
  } else {
    //
  }
}

onMounted(async () => {
  await setCdList()
  setInit()
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(logsStore.menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.YYMM"
            :label="$t('발생년월')"
            type="month"
            required
            width="235px"
          />
          <i-select
            :label="$t('사업부')"
            v-model="searchParams.BSNS_CD"
            :items="cdList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            width="250px"
          />
          <i-select
            :label="$t('부서')"
            v-model="searchParams.DEPT_CD"
            :items="cdList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
            width="375px"
          />
        </v-sheet>
        <v-sheet class="mb-2">
          <v-tabs v-model="tabValue">
            <v-tab value="0">
              유형별 통계
            </v-tab>
            <v-tab value="1">
              항목별 통계
            </v-tab>
          </v-tabs>
        </v-sheet>
        <v-window v-model="tabValue" class="h-window">
          <v-window-item value="0" eager>
            <v-sheet class="h-auto">
              <RealGrid
                class="grdMain1"
                ref="grdMain1"
                :grid-view-option="grdMainProps1.gridViewOption"
                :keys="grdMainProps1.keys"
                :fields="grdMainProps1.fields"
                :columns="grdMainProps1.columns"
                :column-layout="grdMainProps1.columnLayout"
              />
            </v-sheet>
          </v-window-item>
          <v-window-item value="1" eager>
            <div class="h-grow">
              <v-sheet width="calc(100% / 3)" class="h-auto mr-2">
                <RealGrid
                  ref="grdMain2"
                  :grid-view-option="grdMainProps2.gridViewOption"
                  :keys="grdMainProps2.keys"
                  :fields="grdMainProps2.fields"
                  :columns="grdMainProps2.columns"
                  :column-layout="grdMainProps2.columnLayout"
                />
              </v-sheet>
              <!-- <RealGrid
                ref="grdMain3"
                :grid-view-option="grdMainProps3.gridViewOption"
                :keys="grdMainProps3.keys"
                :fields="grdMainProps3.fields"
                :columns="grdMainProps3.columns"
                :column-layout="grdMainProps3.columnLayout"
              /> -->
              <v-sheet width="calc(100% / 3)" class="h-auto mr-2">
                <RealGrid
                  ref="grdMain4"
                  :grid-view-option="grdMainProps4.gridViewOption"
                  :keys="grdMainProps4.keys"
                  :fields="grdMainProps4.fields"
                  :columns="grdMainProps4.columns"
                  :column-layout="grdMainProps4.columnLayout"
                />
              </v-sheet>
              <v-sheet width="calc(100% / 3)" class="h-auto">
                <RealGrid
                  ref="grdMain5"
                  :grid-view-option="grdMainProps5.gridViewOption"
                  :keys="grdMainProps5.keys"
                  :fields="grdMainProps5.fields"
                  :columns="grdMainProps5.columns"
                  :column-layout="grdMainProps5.columnLayout"
                />
              </v-sheet>
            </div>
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
// ::v-deep(.set-style-cell) {
//   background-color: #00ff00;
// }

::v-deep(.rg-bar-renderer-bar) {
  background: #aaccff;
}

.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}

.multi-line-css {
  white-space: pre;
}
</style>
