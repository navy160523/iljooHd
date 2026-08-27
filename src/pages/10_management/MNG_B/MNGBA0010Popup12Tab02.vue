<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { useTagsStore } from '@hiway/stores/tags'

defineOptions({
  name:'60_edu-EDU_A-EDUAB0020',
})

//*******************************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const router = useRouter()
const tagsStore = useTagsStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const emit = defineEmits([
  'cellClick',
  'close',
])

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_DT: dayjs().format('YYYY-MM') + '-01',
  TO_DT: dayjs().format('YYYY-MM-DD'),
})

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible:false },
    edit: { editable: false },
  }, 
  fields: [
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('구분') }, width: '330', },
    { fieldName: 'TARGET_ALL',  dataType: 'text', header: { text: t('대상(명)'), }, width: '85', },
    { fieldName: 'TARGET_AC00', dataType: 'text', header: { text: t('대상(명)'), }, width: '85', },
    { fieldName: 'TARGET_AQ00', dataType: 'text', header: { text: t('대상(명)'), }, width: '85', },
    { fieldName: 'TARGET_AE00', dataType: 'text', header: { text: t('대상(명)'), }, width: '85', },
    { fieldName: 'TARGET_AK00', dataType: 'text', header: { text: t('대상(명)'), }, width: '85', },
    { fieldName: 'TARGET_AX00', dataType: 'text', header: { text: t('대상(명)'), }, width: '85', },
    { fieldName: 'TARGET_AN00', dataType: 'text', header: { text: t('대상(명)'), }, width: '85', },
    { fieldName: 'TARGET_AZZZ', dataType: 'text', header: { text: t('대상(명)'), }, width: '85', },
    { fieldName: 'EDU_ALL',  dataType: 'text', header: { text: t('실시(명)'), }, width: '85', },
    { fieldName: 'EDU_AC00', dataType: 'text', header: { text: t('실시(명)'), }, width: '85', },
    { fieldName: 'EDU_AQ00', dataType: 'text', header: { text: t('실시(명)'), }, width: '85', },
    { fieldName: 'EDU_AE00', dataType: 'text', header: { text: t('실시(명)'), }, width: '85', },
    { fieldName: 'EDU_AK00', dataType: 'text', header: { text: t('실시(명)'), }, width: '85', },
    { fieldName: 'EDU_AX00', dataType: 'text', header: { text: t('실시(명)'), }, width: '85', },
    { fieldName: 'EDU_AN00', dataType: 'text', header: { text: t('실시(명)'), }, width: '85', },
    { fieldName: 'EDU_AZZZ', dataType: 'text', header: { text: t('실시(명)'), }, width: '85', },
    { fieldName: 'RATE_ALL',  dataType: 'text', header: { text: t('참석률\n(%)'), styleName: 'multiline-editor', }, width: '70', },
    { fieldName: 'RATE_AC00', dataType: 'text', header: { text: t('참석률\n(%)'), styleName: 'multiline-editor', }, width: '70', },
    { fieldName: 'RATE_AQ00', dataType: 'text', header: { text: t('참석률\n(%)'), styleName: 'multiline-editor', }, width: '70', },
    { fieldName: 'RATE_AE00', dataType: 'text', header: { text: t('참석률\n(%)'), styleName: 'multiline-editor', }, width: '70', },
    { fieldName: 'RATE_AK00', dataType: 'text', header: { text: t('참석률\n(%)'), styleName: 'multiline-editor', }, width: '70', },
    { fieldName: 'RATE_AX00', dataType: 'text', header: { text: t('참석률\n(%)'), styleName: 'multiline-editor', }, width: '70', },
    { fieldName: 'RATE_AN00', dataType: 'text', header: { text: t('참석률\n(%)'), styleName: 'multiline-editor', }, width: '70', },
    { fieldName: 'RATE_AZZZ', dataType: 'text', header: { text: t('참석률\n(%)'), styleName: 'multiline-editor', }, width: '70', },

    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('교육ID') }, visible: false, },
  ],
  columns: [],
  columnLayout: [
    'CURR_NM',
    {
      name: '전체',
      direction: 'horizontal',
      items: [
        {
          direction: 'vertical',
          items: [
            { column: 'TARGET_ALL', },
            { column: 'EDU_ALL', },
          ],
          header: { visible: false, },
        },
        'RATE_ALL',
      ],
      header: { text: t('전체') },
    },
    {
      name: '조선',
      direction: 'horizontal',
      items: [
        {
          direction: 'vertical',
          items: [
            { column: 'TARGET_AC00', },
            { column: 'EDU_AC00', },
          ],
          header: { visible: false, },
        },
        'RATE_AC00',
      ],
      header: { text: t('조선') },
    },
    {
      name: '해양',
      direction: 'horizontal',
      items: [
        {
          direction: 'vertical',
          items: [
            { column: 'TARGET_AQ00', },
            { column: 'EDU_AQ00', },
          ],
          header: { visible: false, },
        },
        'RATE_AQ00',
      ],
      header: { text: t('해양') },
    },
    {
      name: '특수선',
      direction: 'horizontal',
      items: [
        {
          direction: 'vertical',
          items: [
            { column: 'TARGET_AE00', },
            { column: 'EDU_AE00', },
          ],
          header: { visible: false, },
        },
        'RATE_AE00',
      ],
      header: { text: t('특수선') },
    },
    {
      name: '엔진기계',
      direction: 'horizontal',
      items: [
        {
          direction: 'vertical',
          items: [
            { column: 'TARGET_AK00', },
            { column: 'EDU_AK00', },
          ],
          header: { visible: false, },
        },
        'RATE_AK00',
      ],
      header: { text: t('엔진기계') },
    },
    {
      name: '경영지원/기타',
      direction: 'horizontal',
      items: [
        {
          direction: 'vertical',
          items: [
            { column: 'TARGET_AX00', },
            { column: 'EDU_AX00', },
          ],
          header: { visible: false, },
        },
        'RATE_AX00',
      ],
      header: { text: t('경영지원/기타') },
    },
    {
      name: '안전/자산',
      direction: 'horizontal',
      items: [
        {
          direction: 'vertical',
          items: [
            { column: 'TARGET_AN00', },
            { column: 'EDU_AN00', },
          ],
          header: { visible: false, },
        },
        'RATE_AN00',
      ],
      header: { text: t('안전/자산') },
    },
    {
      name: '군산조선소',
      direction: 'horizontal',
      items: [
        {
          direction: 'vertical',
          items: [
            { column: 'TARGET_AZZZ', },
            { column: 'EDU_AZZZ', },
          ],
          header: { visible: false, },
        },
        'RATE_AZZZ',
      ],
      header: { text: t('군산조선소') },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//버튼 이벤트
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    grdMain.value.getDataProvider().setRows([])
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'MNGBA0010_SEARCH_POPUP12_TAB02', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const openPopup = () => {
  dialog.value = true 
}

const closePage = pageName => {
  tagsStore.deleteVisitedView({ name: pageName })
  tagsStore.deleteCachedView({ name: pageName })
}

const onCellDblClicked = (grid, clickData) => {
  if(clickData.cellType === 'data') {
    if(clickData.fieldName !== 'CURR_NM') {
      const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      const param = {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        FROM_DT: searchParams.FROM_DT,
        TO_DT: searchParams.TO_DT,
        BSNS_CD: clickData.fieldName.replace('TARGET_', '').replace('EDU_', '').replace('RATE_', '').replace('ALL', '').replace('AZZZ', 'AC00'),
        CURR_NM: data.CURR_NM.replace('전체', '')
      }

      if(data.CURR_ID === 'C114') {
        closePage('60_edu-EDU_A-EDUAB0050')
        router.push({ path: '/60_edu/EDU_A/EDUAB0050', state: { stateC114: param } })
        emit('close')
      } else {
        emit('cellClick', param)
      }
    }
  }
}

onMounted(() => {
  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({ colCount: 1 })
  })
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t('안전보건교육 실시 현황')"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input labelWidth="35px" width="185px" 
            :label="$t('기간')" type="date"
            v-model="searchParams.FROM_DT"
            margin="10px"
          />
          <i-input width="160px"
            :label="$t('~')" type="date"
            v-model="searchParams.TO_DT"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @on-cell-dbl-clicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 284px);
  overflow-y: auto;
  > div {
    min-height: 400px;
  }
}
</style>
  
