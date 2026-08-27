<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import dayjs from 'dayjs'
import { chkEmpty } from '@/utils/common'

defineOptions({
  name:'60_edu-EDU_C-EDUCB0030Tab3',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY'),
  QUARTER: Math.ceil(dayjs().format('MM') * 1 / 3) + '',
  BSNS_CD: '',
  DEPT_CD: '',
  TEST_TYPE1: '',
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  TEST_TYPE1: [],
  QUARTER: [
    { COD: '1', TXT: '1분기', },
    { COD: '2', TXT: '2분기', },
    { COD: '3', TXT: '3분기', },
    { COD: '4', TXT: '4분기', },
  ]
})

const getSystemCode = () => {
  Promise.all([
    getCodeList('HHID270A'),
  ]).then(res => {
    codeList.TEST_TYPE1 = _.cloneDeep(res[0].ORESULT_CUR)
    codeList.TEST_TYPE1.splice(0, 0, { COD: '', TXT: '전체', })
  })
}

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false, },
    edit: { editable: false },
  },
  fields: [
    { fieldName: 'TEST_ITEM', dataType: 'text', header: { text: t('문항ID'), }, width: '80', },
    { fieldName: 'TEST_DESC', dataType: 'text', header: { text: t('문항내용'), }, styleName: 'left-column', width: '450', },
    { fieldName: 'CNT_ALL', dataType: 'number', numberFormat: '#,##0', header: { text: t('응답 인원수'), }, styleName: 'right-column', width: '100', },
    { fieldName: 'POINT_Y', dataType: 'number', numberFormat: '#,##0', header: { text: t('정답 인원수'), }, styleName: 'right-column', width: '100', },
    { fieldName: 'POINT_N', dataType: 'number', numberFormat: '#,##0', header: { text: t('오답 인원수'), }, styleName: 'right-column', width: '100', },
    { fieldName: 'POINT_RATE', dataType: 'text', header: { text: t('정답률'), }, styleName: 'right-column', width: '90', },
    { fieldName: 'TEST_TYPE1_NM', dataType: 'text', header: { text: t('문항유형'), }, width: '150', },
    { fieldName: 'TEST_TYPE2_NM', dataType: 'text', header: { text: t('유형항목'), }, width: '150', },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const searchBsnsCd = () => {
  commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'N', }, }).then(res => {
    codeList.BSNS_CD = res.ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_CD: '', BSNS_NM: '전체' })
  })
}

const searchDeptCd = (init = true) => {
  commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y', }, }).then(res => {
    codeList.DEPT_CD = res.ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_CD: '', DEPT_NM: '전체' })

    if(init) {
      searchParams.DEPT_CD = ''
    }
  })
}

const beforeSearchMain = () => {
  if(chkEmpty(searchParams.YEAR)) {
    Message.warn(t('년도를 입력해주세요.'))
    return false
  }

  return true
}

const searchDataMain = () => {
  grdMain.value.getDataProvider().setRows([])
  
  return commonSearchApi({ queryId: 'EDUCB0030_SEARCH_03', param: searchParams })
}

const afterSearchMain = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onButtonsClick = (btn, showMsg = true) => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearchMain)
      .showMessage(showMsg)
      .setQuery(searchDataMain)
      .setAfter(afterSearchMain)
      .run()
  }
}

onMounted(async () => {
  vm.$nextTick(() => {
    grdMain.value.getGridView().setDisplayOptions({
      fitStyle: 'none',
    })

    searchBsnsCd()
    searchDeptCd(false)
    getSystemCode()
    onButtonsClick({ id: 'btnSearch' }, false)
  })
})
</script>

<template>
  <div class="h-grow px-2 pt-1 pb-2">
    <v-sheet class="h-auto">
      <IGridTitle
        title="문항별 결과분석"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="searchArea">
        <div class="d-flex align-center">
          <i-input
            width="160px"
            :label="$t('년도')"
            type="number"
            :min="1900"
            :max="3000"
            v-model="searchParams.YEAR"
            oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
            required
          />
          <i-select
            width="160px"
            :label="$t('분기')"
            :items="codeList.QUARTER"
            item-value="COD"
            item-title="TXT"
            v-model="searchParams.QUARTER"
          />
          <i-select
              :label="$t('사업부')"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              width="250px"
              @update:model-value="searchDeptCd"
              />
            <i-select
              :label="$t('부서')"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              width="250px"
            />
            <i-select
              :label="$t('문항유형')"
              v-model="searchParams.TEST_TYPE1"
              :items="codeList.TEST_TYPE1"
              item-value="COD"
              item-title="TXT"
              width="225px"
            />
        </div>
      </v-sheet>
      <div class="h-grow">
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
    </v-sheet>
  </div>
</template>
  
<style scoped lang="scss">
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