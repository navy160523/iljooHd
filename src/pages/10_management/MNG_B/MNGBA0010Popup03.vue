
<!-- 
  화면명   : 작업표준/위험성평가 현황
  화면개요 : 위험성평가 현황 조회 및 개정
-->

<script setup>
import { commonSearchApi, commonRequest3, commonExecuteApi, getCodeList, getCompanyList, commonExcelWrkDetailApi } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from '@hiway/stores/common'
import { useTagsStore } from '@hiway/stores/tags'
import { useI18n }      from 'vue-i18n'
import { useRouter }    from 'vue-router'
import queryFlowHelper  from '@/utils/searchFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid   from '@/components/RealGrid.vue'
import dayjs      from 'dayjs'
import _          from 'lodash'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import SAGOPOPUP from '@/pages/30_safety/SAF_A/SAFAB0020PopUp.vue'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const router = useRouter()
const commonStore = useCommonStore()
const tagsStore = useTagsStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const dialog = ref(false)
const sagoPopup = ref(null)

const searchParams = reactive({    
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_DT: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
  TO_DT: dayjs().format('YYYY-MM-DD'),
  DEPT_GBN: 'A',
  BSNS_CD: '',
  PART_CD: '',
  DEPT_CD: '',
})

const codeList = reactive({
  DEPT_GBN: [
    { TEXT: '재해조직', TEXT2: '재해', VALUE: 'A' },
    { TEXT: '책임조직', TEXT2: '책임', VALUE: 'B' },
    { TEXT: '재해+책임', TEXT2: '', VALUE: 'C' },
  ],
  BSNS_CD: [],
  PART_CD: [],
  DEPT_CD: [],
})

watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  if(searchParams.BSNS_CD === '') {
    codeList.PART_CD = []
    codeList.PART_CD.unshift({ ASGN_SHRT_NM: '전체', ASGN_CD: '' })
    searchParams.PART_CD = ''

    codeList.DEPT_CD = []
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    searchParams.DEPT_CD = ''
  } else {
    commonSearchApi({
      queryId: 'searchASGN20',
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV: 'Y',
      },
    }).then(res => {
      codeList.PART_CD = res.ORESULT_CUR
      codeList.PART_CD.unshift({ ASGN_SHRT_NM: '전체', ASGN_CD: '' })

      if(!_.some(codeList.PART_CD, { ASGN_CD: searchParams.PART_CD })) {
        searchParams.PART_CD = ''
      }
    })

    commonSearchApi({
        queryId: 'searchDept3',
        param: {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD
        },
      }).then(res => {
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

        if(!_.some(codeList.DEPT_CD, { DEPT_CD: searchParams.DEPT_CD })) {
          searchParams.DEPT_CD = ''
        }
      })
  }
}, { immediate: true, })

const grdProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    header: { height: 70 },
    edit: { editable: false },
  },
  keys: [],
  fields: [
    { fieldName: 'OCCUR_DT', dataType: 'text', header: { text: t('사고발생일시'), }, width: '125', },
    { fieldName: 'INJR_DEPT_NM', dataType: 'text', header: { text: t('재해부서/협력사'), }, styleName: 'left-column', width: '250', },
    { fieldName: 'SAGO_DIV_L_NM', dataType: 'text', header: { text: t('사고구분'), }, width: '75', },
    { fieldName: 'SAGO_DIV_M_NM', dataType: 'text', header: { text: t('사고유형'), }, width: '105', },
    { fieldName: 'SAGO_TYPE_NM', dataType: 'text', header: { text: t('사고처리구분'), }, width: '135', },
    { fieldName: 'SAGO_GAEYO', dataType: 'text', header: { text: t('사고개요'), }, styleName: 'left-column', width: '310', },
    { fieldName: 'WIHEOM_YN', dataType: 'text', header: { text: t('위험성평가\n재작성\n필요 여부'), styleName: 'multiline-editor', }, width: '85', },
    { fieldName: 'WRK_STD_NO', dataType: 'text', header: { text: t('작업표준ID'), }, styleName: 'left-column rg_blue', width: '180', },
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', header: { text: t('작업표준명'), }, styleName: 'left-column', width: '155', },
    { fieldName: 'WRK_STD_YN', dataType: 'text', header: { text: t('위험성평가\n이행 여부'), styleName: 'multiline-editor', }, width: '85', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사'), }, visible: false, },
    { fieldName: 'SAGO_SN', dataType: 'text', header: { text: t('사고번호'), }, visible: false, },
    { fieldName: 'PROGRESS_STATUS', dataType: 'text', header: { text: t('작업표준 진행상태'), }, visible: false, },
  ],
  columns : [],
})

grdProps.columns = grdProps.fields

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'N' },
    })
  ]).then(res => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
  })
}

const setInit = () => {
  initCodeList()
}

// 조회
const searchData = () => {
  return commonSearchApi({ queryId: 'MNGBA0010_SEARCH_POPUP03', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btnId === 'btnClose') {
    onClose()
  }
}

const openPopup = () => {
  setInit()

  dialog.value = true 
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const closePage = pageName => {
  tagsStore.deleteVisitedView({ name: pageName })
  tagsStore.deleteCachedView({ name: pageName })
}

const onCellDblClicked = (grid, clickData) => {
  if(clickData.cellType !== 'data') {
    return
  }

  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  if(clickData.fieldName === 'WRK_STD_NO') {
    if(data.WRK_STD_NO != undefined && data.WRK_STD_NO != null && data.WRK_STD_NO !== '') {
      closePage('20_risk-assessment-RSK_B-RSKBA0010')

      commonStore.loading = true

      window.sessionStorage.setItem('WORK_TYPE', 'E')
      window.sessionStorage.setItem('PROGRESS_STATUS', data.PROGRESS_STATUS)
      window.sessionStorage.setItem('WORK_STANDARD_ID', data.WRK_STD_NO)

      router.push('/20_risk-assessment/RSK_B/RSKBA0010')

      onClose()
    }
  } else {
    sagoPopup.value.openPopup(data)
  }
}

defineExpose({
  openPopup,
})

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1600"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="60"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{'수시 위험성평가 결과 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
    
        <IMenuTitle
          ref="menuTitle"
          :title="'수시 위험성평가 결과'"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />  
      </v-card-title>

      <v-card-text class="pa-3 pt-0 content-area">
        <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="searchParams.FROM_DT"
                :label="$t('발생일자')" 
                width="200px"
                type="date" 
                margin="10px"
              /> 
              <i-input 
                v-model="searchParams.TO_DT"
                :label="$t('~')" 
                label-width="10px"
                width="165px"
                type="date"
              />
              <i-select
                v-model="searchParams.DEPT_GBN"
                :items="codeList.DEPT_GBN"
                item-value="VALUE"
                item-title="TEXT"
                width="120px"
                margin="10px"
              />
              <i-select
                :label="$t(`${_.find(codeList.DEPT_GBN, { VALUE: searchParams.DEPT_GBN }).TEXT2}사업부`)"
                width="250px"
                margin="10px"
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
              />
              <i-select
                :label="$t(`${_.find(codeList.DEPT_GBN, { VALUE: searchParams.DEPT_GBN }).TEXT2}부문`)"
                width="250px"
                margin="10px"
                v-model="searchParams.PART_CD"
                :items="codeList.PART_CD"
                item-title="ASGN_SHRT_NM"
                item-value="ASGN_CD"
              />
              <i-select
                :label="$t(`${_.find(codeList.DEPT_GBN, { VALUE: searchParams.DEPT_GBN }).TEXT2}부서`)"
                width="275px"
                margin="10px"
                v-model="searchParams.DEPT_CD"
                :items="codeList.DEPT_CD"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
              />
            </div>
          </v-sheet>
          <v-sheet>
            <RealGrid
              ref="grdMain"
              style="height: calc(100vh - 300px);"
              :grid-view-option="grdProps.gridViewOption"
              :keys="grdProps.keys" 
              :fields="grdProps.fields"
              :columns="grdProps.columns"
              :column-layout="grdProps.columnLayout"
              @on-cell-dbl-clicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>

      <SAGOPOPUP ref="sagoPopup" />
    </v-card>
  </VDialog>  
</template>

<style scoped lang="scss">
</style>