<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import EDUGA0010Popup01 from '@/pages/60_edu/EDU_G/Popup/EDUGA0010Popup01.vue'
import _ from 'lodash'

defineOptions({
  name: '60_edu-EDU_G-EDUGA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t
const menuTitle = ref(null)
const userLogStore = useLogsStore()
const userStore = useUserStore()
let { rpEDUGA0020 } = history.state
const grdMain = ref(null)
const detailPop = ref(null)

const grdProps1 = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  fields: [
    { fieldName: 'BD_ID', dataType: 'text', header: { text: t('간판번호'), }, width: '70', },
    { fieldName: 'BD_TYPE_NM', dataType: 'text', header: { text: t('구분'), }, width: '80', },
    { fieldName: 'BD_CMPNY_DIV_NM', dataType: 'text', header: { text: t('회사'), }, width: '130', },
    { fieldName: 'BD_BSNS_NM', dataType: 'text', header: { text: t('사업부'), }, width: '130', },
    { fieldName: 'PLACE_NM', dataType: 'text', header: { text: t('장소'), }, styleName: 'left-column', width: '220', },
    { fieldName: 'PLACE_DETAIL', dataType: 'text', header: { text: t('상세장소'), }, styleName: 'left-column', width: '190' },
    { fieldName: 'INSTALL_COMP', dataType: 'text', header: { text: t('설치업체'), }, styleName: 'left-column', width: '160', },
    { fieldName: 'INSTALL_DT', dataType: 'text', header: { text: t('설치일자'), }, width: '100', },
    { fieldName: 'FIX_PLAN_DT', dataType: 'text', header: { text: t('보수예정일'), }, width: '100', },
    { fieldName: 'ALARM_DT', dataType: 'text', header: { text: t('알람기준일'), }, width: '100', },
    { fieldName: 'ALARM_PLAN', dataType: 'text', header: { text: t('재알림예정(개월 후)'), styleName: 'multiline-editor' }, width: '80', },
    { fieldName: 'REMARKS', dataType: 'text', header: { text: t('상세내용'), }, styleName: 'left-column', width: '215', },
    { fieldName: 'BD_SIZE', dataType: 'text', header: { text: t('사이즈'), }, width: '100', },
    { fieldName: 'DEL_YN', dataType: 'text', header: { text: t('삭제여부'), },  width: '70', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사'), }, visible: false, },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('간판ID'), }, visible: false, },
    { fieldName: 'IS_ALARM', dataType: 'text', header: { text: t('알람'), }, visible: false, },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

const searchParams = reactive({
  SEQ: '',
  CMPNY_DIV: userStore.cmpnyDiv,
  BD_CMPNY_DIV: rpEDUGA0020 != undefined ? rpEDUGA0020.BD_CMPNY_DIV : '',
  BD_BSNS_CD: rpEDUGA0020 != undefined ? rpEDUGA0020.BD_BSNS_CD : '',
  BD_TYPE: rpEDUGA0020 != undefined ? rpEDUGA0020.BD_TYPE : '',
  DEL_YN: 'N',
})

const codeList = reactive({
  BD_CMPNY_DIV: [],
  BD_BSNS_CD: [],
  BD_TYPE: [],
})

const getSystemCode = () => {
  Promise.all([
    getCompanyList(),
    getCodeList('HHID250A'),
  ]).then(res => {
    codeList.BD_CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BD_CMPNY_DIV.splice(0, 0, { COD: '', TXT: '전체', })

    codeList.BD_TYPE = res[1].ORESULT_CUR
    codeList.BD_TYPE.splice(0, 0, { COD: '', TXT: '전체', })
  })
}

watch(() => searchParams.BD_CMPNY_DIV, (newValue, oldValue) => {
  commonSearchApi({
    queryId: 'searchBSNS',
    param: {
      CMPNY_DIV: searchParams.BD_CMPNY_DIV,
      USE_DIV: 'N',
    },
  }).then(res => {
    codeList.BD_BSNS_CD = res.ORESULT_CUR
    codeList.BD_BSNS_CD.splice(0, 0, { BSNS_CD: '', BSNS_NM: '전체', })

    if(!_.some(codeList.BD_BSNS_CD, { BSNS_CD: searchParams.BD_BSNS_CD })) {
      searchParams.BD_BSNS_CD = ''
    }
  })
}, { immediate: true, })

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btnId === 'btnCreate') {
    detailPop.value.openPopup({ SEQ: null })
  } else if(btnId === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(deleteData)
      .setAfter(res => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId: 'EDUGA0010_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const mainCheck = () => {
  const checkedRow = grdMain.value.getGridView().getCheckedRows()

  if(checkedRow.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  }

  return true
}

const deleteData = () => {
  const deleteParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    deleteParams.push(data)
  }

  // console.log('deleteParams', deleteParams)

  return commonExecuteApi({ queryId: 'EDUGA0010_DELETE_01', list: deleteParams })
}

const onCellDblClicked = (grid, clickData) => {
  if(clickData.cellType === 'data') {
    // console.log('onCellDblClicked', clickData)

    const currData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    detailPop.value.openPopup({
      CMPNY_DIV: currData.CMPNY_DIV,
      SEQ: currData.SEQ,
    })
  }
}

const setGridRowStyle = () => {
  grdMain.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    let ret = {}

    let alarmYn = grid.getValue(item.index, 'IS_ALARM')

    if(alarmYn === 'Y') {               
      ret.style = { 'background-color': '#ffbbbb' }
    }

    return ret
  })
}

const closeDetail = param => {
  if(param) {
    onButtonsClick({ id: 'btnSearch' })
  }
}

onMounted(() => {
  nextTick(() => {
    getSystemCode()
    setGridRowStyle()

    if(rpEDUGA0020 != undefined) {
      onButtonsClick({ id: 'btnSearch' })

      history.state.rpEDUGA0020 = undefined
    }
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnDelete']" 
        @click-button="onButtonsClick"
      >
      </IMenuTitle>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
            <div class="d-flex align-center">
              <i-select
                :label="$t('회사')"
                v-model="searchParams.BD_CMPNY_DIV"
                :items="codeList.BD_CMPNY_DIV"
                item-value="COD"
                item-title="TXT"
                width="250px"
              />
              <i-select
                :label="$t('사업부')"
                v-model="searchParams.BD_BSNS_CD"
                :items="codeList.BD_BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                width="250px"
              />
              <i-select
                :label="$t('구분')"
                v-model="searchParams.BD_TYPE"
                :items="codeList.BD_TYPE"
                item-value="COD"
                item-title="TXT"
                width="175px"
              />
              <v-checkbox v-model="searchParams.DEL_YN" label="삭제 항목 포함" true-value="Y" false-value="N" />
            </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys" 
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div> 
    </v-card-text>

    <EDUGA0010Popup01 ref="detailPop" @close="closeDetail" />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>