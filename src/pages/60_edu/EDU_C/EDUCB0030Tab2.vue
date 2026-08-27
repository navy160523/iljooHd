<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import dayjs from 'dayjs'
import { chkEmpty } from '@/utils/common'
import EDUCB0020Popup02 from '@/pages/60_edu/EDU_C/EDUCB0020Popup02.vue'

defineOptions({
  name:'60_edu-EDU_C-EDUCB0030Tab2',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const grdMain = ref(null)
const reviewPopup = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY'),
  QUARTER: Math.ceil(dayjs().format('MM') * 1 / 3) + '',
  BSNS_CD: '',
  DEPT_CD: '',
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  QUARTER: [
    { COD: '1', TXT: '1분기', },
    { COD: '2', TXT: '2분기', },
    { COD: '3', TXT: '3분기', },
    { COD: '4', TXT: '4분기', },
  ]
})

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false, },
    edit: { editable: false },
  },
  fields: [
    { fieldName: 'TEST_ID', dataType: 'text', header: { text: t('응시번호'), }, width: '80', },
    { fieldName: 'YEAR_NM', dataType: 'text', header: { text: t('년도'), }, width: '80', },
    { fieldName: 'QUARTER_NM', dataType: 'text', header: { text: t('분기'), }, width: '80', },
    { fieldName: 'TEST_START_DATE', dataType: 'text', header: { text: t('응시일시'), }, width: '160', },
    { fieldName: 'TEST_TIME', dataType: 'text', header: { text: t('경과시간'), }, width: '80', },
    { fieldName: 'TEST_STATUS', dataType: 'text', header: { text: t('응시상태'), }, width: '80', },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속'), }, width: '250', },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름'), }, width: '80', },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), }, width: '80', },
    { fieldName: 'TEST_POINT', dataType: 'text', header: { text: t('점수'), }, width: '80', },
    { fieldName: 'TEST_REVIEW', dataType: 'text', header: { text: t('결과조회'), },
      styleName: 'rg_blue font-weight-bold cursor-pointer', width: '80', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'USER_DIV', dataType: 'text', header: { text: t('USER_DIV'), }, visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR'), }, visible: false, },
    { fieldName: 'QUARTER', dataType: 'text', header: { text: t('QUARTER'), }, visible: false, },
    { fieldName: 'TEST_SEQ', dataType: 'text', header: { text: t('TEST_SEQ'), }, visible: false, },
    { fieldName: 'TEST_END_DATE', dataType: 'text', header: { text: t('TEST_END_DATE'), }, visible: false, },
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
  
  return commonSearchApi({ queryId: 'EDUCB0030_SEARCH_02', param: searchParams })
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

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType !== 'data') {
    return
  }

  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  if (clickData.fieldName === 'TEST_REVIEW') {
    if(data.TEST_REVIEW === '확인') {
      reviewPopup.value.openPopup(data)
    }
  }
}

onMounted(async () => {
  vm.$nextTick(() => {
    searchBsnsCd()
    searchDeptCd(false)
    onButtonsClick({ id: 'btnSearch' }, false)
  })
})
</script>

<template>
  <div class="h-grow px-2 pt-1 pb-2">
    <v-sheet class="h-auto">
      <IGridTitle
        title="개별응답 결과분석"
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
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-sheet>

    <EDUCB0020Popup02 ref="reviewPopup" />
  </div>
</template>
  
<style scoped lang="scss">
</style>