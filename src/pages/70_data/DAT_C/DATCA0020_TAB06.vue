<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import DATCA0020Popup from './DATCA0020Popup.vue'

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t

const grdMain = ref(null)
const Popup = ref(null)

const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
  keys: [],
  fields: [
    { fieldName: 'NOTICE_DIV', visible: false, dataType: 'text', header: { text: t('구분') }, lookupDisplay: true },
    { fieldName: 'NOTICE_TITLE', dataType: 'text', width: '300', header: { text: t('제목') }, styleName: 'left-column', },
    { fieldName: 'FILE_CNT', dataType: 'text', header: { text: t('첨부자료[건]') }, styleName: 'right-column' },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('작성자') } },
    { fieldName: 'INSERT_DATE', dataType: 'text', width: '200', header: { text: t('작성일시') } },
    { fieldName: 'NOTICE_CNT', dataType: 'text', header: { text: t('조회[건]') }, styleName: 'right-column' },
    { fieldName: 'NOTICE_EXPOSURE', dataType: 'text', header: { text: t('메인노출 여부') }, width: '80', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'NOTICE_FILEID', dataType: 'text', header: { text: t('첨부파일ID') }, visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text', header: { text: t('NOTICE_NO') }, visible: false },
    { fieldName: 'NOTICE_RANGE', dataType: 'text', header: { text: t('NOTICE_RANGE') }, visible: false },
    { fieldName: 'NOTICE_REG_EMPNO', dataType: 'text', header: { text: t('NOTICE_REG_EMPNO') }, visible: false },
    { fieldName: 'THUMBNAIL_FILE_ID', dataType: 'text', header: { text: t('THUMBNAIL_FILE_ID') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  DEPT_CD: userStore.deptCd,
  DATE_FROM: '',
  DATE_TO: '',
  GUBUN: 'T',
  SEARCH: '',
  NOTICE_DIV: '',
  dtDate: 'A',
  ALL_UP_CD: 'HHIZ090FF',
})

const codeList = reactive({
  NOTICE_DIV: [],
  DT_DATE: [
    { COD: 'A', TXT: '전체기간' },
    { COD: 'W', TXT: '최근 1주' },
    { COD: 'M', TXT: '최근 1개월' },
    { COD: 'C', TXT: '기간 선택' },
  ],
  DT_GBN: [
    { COD: 'T', TXT: '제목' },
    { COD: 'N', TXT: '내용' },
    { COD: 'TN', TXT: '제목 + 내용' },
  ],
})

const getCodeLists = () => {
  getCodeList(searchParams.ALL_UP_CD).then(res => { codeList.NOTICE_DIV = res.ORESULT_CUR })
}

const dateChange = (e) => {
  if (e === 'A' || e === 'C') {
    searchParams.DATE_FROM = ''
    searchParams.DATE_TO = ''
  } else if (e === 'W') {
    searchParams.DATE_FROM = dayjs(new Date().setDate(new Date().getDate() - 7)).format('YYYY-MM-DD')
    searchParams.DATE_TO = dayjs(new Date()).format('YYYY-MM-DD')
  } else if (e === 'M') {
    searchParams.DATE_FROM = dayjs(new Date().setDate(new Date().getDate() + 1))
      .subtract(1, 'month')
      .format('YYYY-MM-DD')
    searchParams.DATE_TO = dayjs(new Date()).format('YYYY-MM-DD')
  }

  reset()
}

const searchData = () => {
  return commonSearchApi({ queryId: 'DATCA0020_SEARCH_01', param: searchParams })
}

const afterSearch = async (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
  } else {
    Popup.value.openPopup()
  }
}

const reset = () => {
  grdMain.value.getDataProvider().setRows([])
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  Popup.value.openPopup(data)
}

onMounted(() => {
  getCodeLists()

  nextTick(() => {
    onButtonsClick({ id: 'btnSearch' })
  })
})

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <v-card>
    <v-card-text class="pa-2 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select

            v-model="searchParams.dtDate"
            :items="codeList.DT_DATE"
            item-title="TXT"
            item-value="COD"
            margin="10px"
            :label="$t('기간')"
            width="175px"
            @update:modelValue="dateChange"
          />
          <i-input
            width="150px"
            type="date"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            v-model="searchParams.DATE_FROM"
            margin="10px"
          />
          <i-input
            width="160px"
            :label="$t('~')"
            type="date"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            v-model="searchParams.DATE_TO"
          />
          <i-select
            :items="codeList.DT_GBN"
            item-title="TXT"
            item-value="COD"
            v-model="searchParams.GUBUN"
            :label="$t('조회 구분')"
            width="200px"
            margin="10px"
          />
          <i-input v-model="searchParams.SEARCH" width="200px" />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>

    <DATCA0020Popup
      @after-search="() => onButtonsClick({ id: 'btnSearch' })"
      ref="Popup"
      :NOTICE_DIV_LIST="codeList.NOTICE_DIV"
      :id="searchParams.ALL_UP_CD"
    />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 250px);
  overflow-y: auto;
  > div {
    min-height: 600px;
  }
}
</style>
