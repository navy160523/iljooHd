<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { commonDeletFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import _ from 'lodash'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import LocationPopup from '@/components/popup/CommonCodePopUpSAF.vue'
import HLTNA0020Popup01 from '@/pages/100_health/HLT_N/HLTNA0020Popup01.vue'

defineOptions({
  name: '100_health-HLT_N-HLTNA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t
const menuTitle = ref(null)
const userLogStore = useLogsStore()
const userStore = useUserStore()
const grdMain = ref(null)
const deptPopup = ref(null)
const locationPopup = ref(null)
const savePopup = ref(null)

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'CHECK_DATE2', dataType: 'text', header: { text: t('등록일'), }, width: '100', },
    { fieldName: 'CHECK_TIME2', dataType: 'text', header: { text: t('측정 시간'), }, width: '70', },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), }, width: '150', },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사명'), }, width: '150', },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('등록자'), }, width: '70', },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), }, width: '80', },
    { fieldName: 'LOC_NM', dataType: 'text', header: { text: t('작업장'), }, width: '250', },
    { fieldName: 'LOC_DETAIL', dataType: 'text', header: { text: t('작업장(상세)'), }, width: '170', },
    { fieldName: 'TEMP', dataType: 'number', header: { text: t('온도(℃)'), }, width: '70', },
    { fieldName: 'HUMI', dataType: 'number', header: { text: t('습도(%)'), }, width: '70', },
    { fieldName: 'FEEL_TEMP', dataType: 'number', header: { text: t('체감 온도(℃)'), }, width: '75', },
    { fieldName: 'SHOW_DETAIL', dataType: 'text', header: { text: t('상세'), }, styleName: 'rg_blue', width: '70', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'CHECK_DATE', dataType: 'text', header: { text: t('CHECK_DATE'), }, visible: false, },
    { fieldName: 'CHECK_TIME', dataType: 'text', header: { text: t('CHECK_TIME'), }, visible: false, },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('FILE_ID'), }, visible: false, },
    { fieldName: 'LOC_L', dataType: 'text', header: { text: t('LOC_L'), }, visible: false, },
    { fieldName: 'LOC_M', dataType: 'text', header: { text: t('LOC_M'), }, visible: false, },
    { fieldName: 'LOC_S', dataType: 'text', header: { text: t('LOC_S'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DEPT_CD: '',
  FROM_DT: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  TO_DT: dayjs().format('YYYY-MM-DD'),
  LOC_L: '',
  LOC_M: '',
  LOC_S: '',
  LOC_L_NM: '',
  LOC_M_NM: '',
  LOC_S_NM: '',
})

const btnSearch = (showMsg = true) => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(showMsg)
    .run()
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    btnSearch()
  } else if(btnId === 'btnCreate') {
    savePopup.value.openPopup({ CRUD: 'I' })
  } else if(btnId === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(deleteData)
      .setAfter(res => {
        const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

        for (const rowIdx of checkedRows) {
          const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

          commonSearchApi({ queryId: 'searchFile', param: { CMPNY_DIV: data.CMPNY_DIV, FILE_ID: data.FILE_ID } }).then(fileRes => {
            if(fileRes.ORESULT_CUR.length > 0) {
              commonDeletFilesApi(fileRes.ORESULT_CUR)
            }
          })
        }
        
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId: 'HLTNA0020_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  const result = res.ORESULT_CUR

  result.forEach(row => {
    row.SHOW_DETAIL = '보기'
  });

  grdMain.value.getDataProvider().setRows(result)
}

const mainCheck = () => {
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++) {
    const data = grdMain.value.getDataProvider().getJsonRow(checkedRows[i])

    if(data.EMP_NO !== userStore.empNo) {
      Message.warn('본인이 등록한 데이터만 삭제 가능합니다.')
      return false
    }
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

  return commonExecuteApi({ queryId: 'HLTNA0020_DELETE_01', list: deleteParams })
}

const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: searchParams.CMPNY_DIV,
    ORGN_DIV: 'A',
  })
}

const selectedDept = val => {
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
}

const clearDept = () => {
  searchParams.BSNS_CD = ''
  searchParams.DEPT_CD = ''
  searchParams.DEPT_NM = ''
}

const openLocationPopup = () => {
  locationPopup.value.openPopup('장소')
}

const clearLocation = () => {
  searchParams.LOC_L = ''
  searchParams.LOC_M = ''
  searchParams.LOC_S = ''
  searchParams.LOC_L_NM = ''
  searchParams.LOC_M_NM = ''
  searchParams.LOC_S_NM = ''
}

const selectedLocation = (val) => {
  searchParams.LOC_L = val[0].COD
  searchParams.LOC_M = val[1].COD
  searchParams.LOC_S = val[2].COD
  searchParams.LOC_L_NM = val[0].TXT
  searchParams.LOC_M_NM = val[1].TXT
  searchParams.LOC_S_NM = val[2].TXT
}

const closeSavePopup = param => {
  if(param) {
    btnSearch(false)
  }
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType !== 'data') {
    return
  }

  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  data.CRUD = 'U'

  if (clickData.fieldName === 'SHOW_DETAIL') {
    savePopup.value.openPopup(data)
  }
}

onMounted(() => {
  nextTick(() => {
    menuTitle.value.setBtnProperty('btnCreate', 'text', '등록')
    btnSearch()
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
            <i-input
              label-width="30px"
              width="180px" 
              :label="$t('일자')" type="date"
              v-model="searchParams.FROM_DT"
              margin="10px"
            />
            <i-input
              width="160px"
              :label="$t('~')" type="date"
              v-model="searchParams.TO_DT"
            />
            <i-input
              v-model="searchParams.DEPT_NM"
              label-width="30px"
              :label="$t('부서')"
              width="250px"
              margin="5px"
              readonly
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup"
              @keydown.enter="openDeptPopup"
            >
              <template #append-inner>
                <v-icon
                  icon="mdi-window-close"
                  @click="clearDept"
                />
              </template>
            </i-input>
            <i-input
              v-model="searchParams.DEPT_CD"
              width="100px"
              readonly
            />
            <i-input
              label-width="40px"
              width="220px"
              :label="$t('작업장')"
              v-model="searchParams.LOC_L_NM"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openLocationPopup"
              readonly
              margin="5px"
            >
              <template #append-inner>
                <v-icon
                  icon="mdi-window-close"
                  @click="clearLocation"
                />
              </template>
            </i-input>
            <i-input
              width="150px"
              v-model="searchParams.LOC_M_NM"
              readonly
              margin="5px"
            />
            <i-input
              width="150px"
              v-model="searchParams.LOC_S_NM"
              readonly
            />
          </div>
        </v-sheet>
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
    </v-card-text>

    <DeptPopup ref="deptPopup" @selected="selectedDept" />
    <LocationPopup ref="locationPopup" @selected="selectedLocation" />
    <HLTNA0020Popup01 ref="savePopup" @close="closeSavePopup" />
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