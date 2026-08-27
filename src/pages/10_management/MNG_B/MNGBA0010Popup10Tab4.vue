<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const grdMain = ref(null)
const grdSub = ref(null)
const gridTitle = ref(null)

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false }, 
    edit: { editable: false },
    header: { height: 45 },
  },
  keys: [],
  fields: [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('구분') }, width: '135', },
    { fieldName: 'GRADE_A', dataType: 'text', header: { text: t('우수\n(90점 이상)'), styleName: 'multiline-editor', }, width: '105', },
    { fieldName: 'GRADE_B', dataType: 'text', header: { text: t('양호\n(80 ~ 90점)'), styleName: 'multiline-editor', }, width: '105', },
    { fieldName: 'GRADE_C', dataType: 'text', header: { text: t('보통\n(70 ~ 80점)'), styleName: 'multiline-editor', }, width: '105', },
    { fieldName: 'GRADE_D', dataType: 'text', header: { text: t('미흡\n(70점 미만)'), styleName: 'multiline-editor', }, width: '105', },
    { fieldName: 'GRADE_ALL', dataType: 'text', header: { text: t('합계') }, width: '80', },
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption: {
    stateBar: { visible: false }, 
    edit: { editable: false },
    rowIndicator: { visible: false },
    header: { height: 45 },
  },
  keys : [],
  fields : [ 
    { fieldName: 'TOTAL_RANK', dataType: 'text', header: { text: t('순위') }, width: '45', },
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, width: '150', },
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') }, width: '150', },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('소속부서') }, width: '150', },
    { fieldName: 'COMP_NM', dataType: 'text', header: { text: t('협력사') }, width: '150', },
    { fieldName: 'TOTAL', dataType: 'text', header: { text: t('총점') }, width: '90', },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY'),
  QUATER: Math.ceil((new Date().getMonth() + 1) / 3).toString()
})

const codeList = reactive({
  QUATER: [
    { COD: '1', TXT: '1분기' },
    { COD: '2', TXT: '2분기' },
    { COD: '3', TXT: '3분기' },
    { COD: '4', TXT: '4분기' },
  ],
})

const searchData = () => {
  return commonSearchApi({ queryId : 'MNGBA0010_SEARCH_POPUP10_TAB04', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR1)
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR2)
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain, grdSub])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(true)
      .run()
  }
}
</script>

<template>
  <v-card-text class="pa-3 pt-0 content-area">
    <div class="d-flex flex-column fill-height">
      <v-card-title class="pa-2 py-0">
        <IGridTitle
          ref="gridTitle"
          :button-list="['btnSearch']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-sheet class="searchArea d-flex">
        <i-input
          v-model="searchParams.YEAR"
          :label="$t('년도')"
          label-width="25px"
          type="Number"
          width="150px"
        />
        <i-select
          v-model="searchParams.QUATER"
          :label="$t('분기')"
          label-width="25px"
          :items="codeList.QUATER"
          item-title="TXT"
          item-value="COD"
          width="175px"
        />
      </v-sheet>
      <v-sheet height="508px" class="d-flex">
        <v-sheet width="45%" class="mr-2">
          <IGridTitle title="평가결과" class="ma-0" />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>
        <v-sheet width="55%">
          <IGridTitle title="안전 성과 우수 협력사 선정(총 8개사)" class="ma-0" />
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
          />
        </v-sheet>
      </v-sheet>
    </div>
  </v-card-text>
</template>

<style lang="scss" scoped>
</style>