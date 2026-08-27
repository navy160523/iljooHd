<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'

defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_MNTH: dayjs().format('YYYY') + '-01',
  TO_MNTH: dayjs().format('YYYY-MM'),
})

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
  },
  fields: [
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, mergeRule: { criteria: "values['BSNS_NM']" }, width: '145', },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, mergeRule: { criteria: "values['BSNS_NM'] + values['YEAR']" }, width: '65', },
    { fieldName: 'MNTH', dataType: 'text', header: { text: t('월') }, width: '65', },
    { fieldName: 'CNT_ALL', dataType: 'number', numberFormat: '#,##0', header: { text: t('고위험작업\n계획(건)'),  styleName: 'multiline-editor', }, styleName: 'right-column', },
    { fieldName: 'RATE_B', dataType: 'text', header: { text: t('점검이행률') }, styleName: 'right-column', }, // 관리감독자
    { fieldName: 'RATE_C', dataType: 'text', header: { text: t('점검이행률') }, styleName: 'right-column', }, // 세잎클로버
    { fieldName: 'RATE_A', dataType: 'text', header: { text: t('점검이행률') }, styleName: 'right-column', }, // 안전요원
    { fieldName: 'CNT_B', dataType: 'number', numberFormat: '#,##0', header: { text: t('점검건수') }, styleName: 'right-column', },
    { fieldName: 'CNT_C', dataType: 'number', numberFormat: '#,##0', header: { text: t('점검건수') }, styleName: 'right-column', },
    { fieldName: 'CNT_A', dataType: 'number', numberFormat: '#,##0', header: { text: t('점검건수') }, styleName: 'right-column', },

    { fieldName: 'GRP_ID', dataType: 'number', header: { text: t('GRP_ID') }, visible: false, }
  ],
  columns: [],
  columnLayout: [
    {
      name: '구분',
      direction: 'horizontal',
      items: ['BSNS_NM', 'YEAR', 'MNTH'],
    },
    'CNT_ALL',
    {
      name: '점검이행현황',
      direction: 'horizontal',
      items: [
        {
          name: '관리감독자',
          direction: 'horizontal',
          items: ['RATE_B', 'CNT_B'],
        },
        {
          name: '세잎클로버',
          direction: 'horizontal',
          items: ['RATE_C', 'CNT_C'],
        },
        {
          name: '안전요원',
          direction: 'horizontal',
          items: ['RATE_A', 'CNT_A'],
        }
      ],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId: 'MNGBA0010_SEARCH_POPUP04_TAB03', param: searchParams, })
}

const afterSearch = async (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const setGrdMainStyle = () => {
  grdMain.value.getGridView().layoutByColumn('YEAR').spanCallback =
    function (grid, layout, itemIndex) {
      var value = grid.getValue(itemIndex, 'GRP_ID')
      if (value != null) {
        if (value === 1 || value === 7) {
          return 2
        }
      }
    }
}

onMounted(() => {
  vm.$nextTick(() => {
    grdMain.value.getGridView().setDisplayOptions({
      fitStyle: 'none',
    })

    setGrdMainStyle()
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.FROM_MNTH"
            type="month"
            width="180px"
            margin="10px"
            :label="$t('년월')"
          />
          <i-input
            v-model="searchParams.TO_MNTH"
            type="month"
            width="165px"
            :label="$t('~')"
            label-width="10px"
          />
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            class="rg-fixed-body"
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
  height: calc(100vh - 288px);
}

::v-deep(.rg-grid) {
  .rg-data-row {
    td:last-child {
      border-right: 1px solid #DFE3EF !important;
    }
  }

  .rg-header-cell:last-child {
    border-right: 1px solid #DFE3EF !important;
  }
}
</style>
