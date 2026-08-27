<!--
화면명 : 아차사고/위험제보 등록/현황
화면개요 : 제보/조치 관리, 조회
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { commonDeleteAllFilesApi } from '@hiway/api/commonFileApi'
import _ from 'lodash'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUpload from '@/components/IUpload.vue'
import SAFEB0010Popup from '@/pages/30_safety/SAF_E/SAFEB0010Popup.vue'
import SAFEB0010Popup02 from '@/pages/30_safety/SAF_E/SAFEB0010Popup02.vue'

defineOptions({
  name: '30_safety-SAF_E-SAFEB0010',
})

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const logsStore = useLogsStore()
const t = useI18n().t
const menuTitle = ref(null)
const grdMain = ref(null)
const dateReadonly = ref(true)
const empPopup = ref(null)
const refIUpload = ref(null)
const refSAFEB0010Popup = ref(null)
const refSAFEB0010Popup02 = ref(null)
const imgSrc = ref('')
const isPdf = ref(false)

const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['CMPNY_DIV', 'REPORT_DT', 'REPORT_NO'],
  fields : [
    { fieldName: 'REPORT_DT', dataType: 'text', header: { text: t('제보일자') }, editable: false, width: 90 },
    { fieldName: 'USER_DIV_NM', dataType: 'text', header: { text: t('소속구분') }, editable: false, width: 65 },
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, editable: false, styleName: 'left-column' },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, editable: false, styleName: 'left-column' },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('상세소속') }, editable: false, styleName: 'left-column', width: 150 },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false, width: 75 },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false, width: 65 },
    { fieldName: 'CONTENT', dataType: 'text', header: { text: t('내용') }, editable: false, styleName: 'left-column', width: 250 },
    { fieldName: 'FILE_YN', dataType: 'text', header: { text: t('파일유무') }, editable: false, width: 65 },
    { fieldName: 'JOB_PLC_NM', dataType: 'text', header: { text: t('장소') }, editable: false, styleName: 'left-column', width: 150 },
    { fieldName: 'REPORT_TYPE_NM', dataType: 'text', header: { text: t('구분') }, editable: false, width: 65 },
    { fieldName: 'REL_ASGN_CD', dataType: 'text', header: { text: t('담당 안전팀') }, editable: false, lookupDisplay: true, styleName: 'left-column', width: 185 },
    { fieldName: 'JOCHI_YN', dataType: 'text', header: { text: t('조치유무') }, editable: false, width: 65 },
    { fieldName: 'CONTENT2', dataType: 'text', header: { text: t('조치내용') }, editable: false, styleName: 'left-column', width: 250 },
    { fieldName: 'ACT_DESC', dataType: 'text', header: { text: t('안전개입활동ID') }, editable: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false },
    { fieldName: 'REPORT_NO', dataType: 'text', header: { text: t('REPORT_NO') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('FILE_ID') }, visible: false },
    { fieldName: 'ACT_DATE', dataType: 'text', header: { text: t('ACT_DATE') }, visible: false },
    { fieldName: 'ACT_SER', dataType: 'text', header: { text: t('ACT_SER') }, visible: false },
    { fieldName: 'REPORT_TYPE', dataType: 'text', header: { text: t('REPORT_TYPE') }, visible: false },
    { fieldName: 'JOB_LPLC', dataType: 'text', header: { text: t('JOB_LPLC') }, visible: false },
    { fieldName: 'JOB_MPLC', dataType: 'text', header: { text: t('JOB_MPLC') }, visible: false },
    { fieldName: 'JOB_SPLC', dataType: 'text', header: { text: t('JOB_SPLC') }, visible: false },
    { fieldName: 'JOB_PLC_DETAIL', dataType: 'text', header: { text: t('JOB_PLC_DETAIL') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DATE_GBN: '',
  FROM: '',
  TO: '',
  REL_ASGN_CD: '',
  EMP_NO: '',
  EMP_NM: '',
})

const cntList = reactive({
  TOTAL_CNT: 0,
  WAIT_CNT: 0,
  JOCHI_CNT: 0,
})

const cdList = reactive({
  DATES: [
    { value: 'A', text: '전체기간' },
    { value: 'B', text: '최근 1주' },
    { value: 'C', text: '최근 1개월' },
    { value: 'D', text: '기간선택' }
  ],
  REL_ASGN_CD: []
})

watch(() => searchParams.DATE_GBN, newValue => {
  switch(newValue) {
    case 'A':
      searchParams.FROM = ''
      searchParams.TO = ''
      dateReadonly.value = true
      break
    case 'B':
      searchParams.FROM = dayjs().add(-7, 'day').format('YYYY-MM-DD')
      searchParams.TO = dayjs().format('YYYY-MM-DD')
      dateReadonly.value = true
      break
    case 'C':
      searchParams.FROM = dayjs().add(-1, 'month').format('YYYY-MM-DD')
      searchParams.TO = dayjs().format('YYYY-MM-DD')
      dateReadonly.value = true
      break
    default:
      dateReadonly.value = false
      break
  }
})

const setInit = () => {
  searchParams.DATE_GBN = 'C'
  // searchParams.EMP_NO = userStore.userId
  // searchParams.EMP_NM = userStore.userName

  // console.log('userStore.userId', userStore.userId)
  // console.log('userStore.userName', userStore.userName)
  // console.log('userStore.empNo', userStore.empNo)
  // console.log('userStore.empNm', userStore.empNm)
}

const setCdList = async () => {
  await commonSearchApi({
    queryId: 'SAFEB0010_SEARCH_01',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
    },
  }).then(res => {
    // console.log('SAFEB0010_SEARCH_01 res', res)

    cdList.REL_ASGN_CD = _.cloneDeep(res.ORESULT_CUR)
    cdList.REL_ASGN_CD.unshift({
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_CD: '',
      ASGN_NM: '',
      ASGN_FULL_NM: '전체',
      BSNS_CD: '',
      DEPT_CD: ''
    })

    grdMain.value.setBindingColumn('REL_ASGN_CD', res.ORESULT_CUR, 'ASGN_CD', 'ASGN_FULL_NM')
  })
}

const openEmpPopup = async () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NO: searchParams.EMP_NO,
    EMP_NM: searchParams.EMP_NM,
  })
}

const onEmpSelected = param => {
  // console.log('onEmpSelected param', param)

  searchParams.EMP_NO = param.EMP_NO
  searchParams.EMP_NM = param.EMP_NM
}

const searchMain = async () => {
  const sParam = _.cloneDeep(searchParams)
  sParam.FROM = sParam.FROM.replace(/-/g, '')
  sParam.TO = sParam.TO.replace(/-/g, '')

  // console.log('sParam', sParam)
  await commonSearchApi({ queryId : 'SAFEB0010_SEARCH_03', param: sParam }).then(res => {
    cntList.TOTAL_CNT = res.ORESULT_CUR[0].TOTAL_CNT
    cntList.WAIT_CNT = res.ORESULT_CUR[0].WAIT_CNT
    cntList.JOCHI_CNT = res.ORESULT_CUR[0].JOCHI_CNT
  })

  return commonSearchApi({ queryId : 'SAFEB0010_SEARCH_02', param: sParam })
}

const afterSearchMain = res => {
  const data = res.ORESULT_CUR

  // console.log('afterSearchMain res', data)

  grdMain.value.getDataProvider().setRows(data)
}

const mainCheck = () => {
  const checkedRow = grdMain.value.getGridView().getCheckedRows()

  if(checkedRow.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  }

  return true
}

const deleteData = async () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    data.REPORT_DT = data.REPORT_DT.replace(/-/g, '')
    
    saveParams.push(data)
  }

  // console.log('deleteData saveParams', saveParams)
  await commonDeleteAllFilesApi(saveParams)
  
  return commonExecuteApi({ queryId : 'SAFEB0010_DELETE_01', list: saveParams })
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchMain)
      .setAfter(afterSearchMain)
      .run()
  } else if(btn.id === 'btnAddJebo') {
    refSAFEB0010Popup.value.openPopup()
  } else if(btn.id === 'btnAddJochi') {
    const clickData = grdMain.value.getGridView().getCurrent()

    // console.log('clickData', clickData)

    if(clickData.itemIndex > -1) {
      const currRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      refSAFEB0010Popup02.value.openPopup(currRow)
    } else {
      Message.warn(t('선택한 데이터가 없습니다.'))
      return
    }
  } else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

const popupSaved = param => {
  // console.log('popupSaved param', param)

  searchMain().then(res => {
    const dt = param.OUT_RES_REPORT_DT ? param.OUT_RES_REPORT_DT : param.REPORT_DT
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.goRow({
      CMPNY_DIV: param.CMPNY_DIV,
      REPORT_DT: `${dt.substring(0, 4)}-${dt.substring(4, 6)}-${dt.substring(6, 8)}`,
      REPORT_NO: param.OUT_RES_REPORT_NO,
    })
  })
}

const onCellDblClicked = (grid, clickData) => {
  // console.log('clickData', clickData)
  if (clickData.cellType === 'data') {
    const currRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    // console.log('currRow', currRow)
    refSAFEB0010Popup.value.openPopup(currRow)
  }
}

const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
  refIUpload.value.clearGrid()
  
  if(newIdx > -1) {
    const row = grdMain.value.getDataProvider().getJsonRow(newIdx)
    refIUpload.value.setGuid(row.FILE_ID)
    refIUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
}

const fileRowChanged = param => {
  // console.log('param', param)

  if(param) {
    isPdf.value = param.FILE_TYPE !== undefined && param.FILE_TYPE.toUpperCase() === 'PDF'
    imgSrc.value = param.IMG_URL
  }
}

const closedPopup = param => {
  if(param) {
    onButtonsClick({ id: 'btnSearch' })
  }
}

onMounted(async () => {
  setInit()
  await setCdList()
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(logsStore.menuId)"
        :button-list="['btnSearch', 'btnAddJebo', 'btnAddJochi', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.FROM"
            :label="$t('기간')"
            type="date"
            margin="10px"
            required
            width="370px"
            :readonly="dateReadonly"
          >
            <template v-slot:between-inner>
              <i-select
                v-model="searchParams.DATE_GBN"
                :items="cdList.DATES"
                item-value="value"
                item-title="text"
                margin="10px"
                width="150px"
              />
            </template>
          </i-input>
          <i-input
            v-model="searchParams.TO"
            width="190px"
            :label="$t('~')"
            type="date"
            :readonly="dateReadonly"
          />
          <i-input
            :label="$t('제보자 사번/성명')"
            v-model="searchParams.EMP_NO"
            append-inner-icon="mdi-magnify"
            @click:append-inner="openEmpPopup"
            @input="searchParams.EMP_NM = ''"
            width="250px"
            margin="10px"
          />
          <i-input
            v-model="searchParams.EMP_NM"
            readonly
            width="150px"
          />
          <i-select
            :label="$t('담당 안전팀')"
            v-model="searchParams.REL_ASGN_CD"
            :items="cdList.REL_ASGN_CD"
            item-value="ASGN_CD"
            item-title="ASGN_FULL_NM"
            width="400px"
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="70%" class="pa-0 mr-3">
            <v-sheet height="40px" class="d-flex panel--cnt font-weight-bold">
              <div class="d-flex align-center px-5 panel--total h-full">
                <div class="mr-6">
                  총 제보
                </div>
                <div>
                  {{ `${cntList.TOTAL_CNT} 건` }}
                </div>
              </div>
              <div class="d-flex align-center px-5 panel--wait h-full">
                <div class="mr-6">
                  조치 대기
                </div>
                <div>
                  {{ `${cntList.WAIT_CNT} 건` }}
                </div>
              </div>
              <div class="d-flex align-center px-5 panel--jochi h-full">
                <div class="mr-6">
                  조치 완료
                </div>
                <div>
                  {{ `${cntList.JOCHI_CNT} 건` }}
                </div>
              </div>
            </v-sheet>
            <v-sheet class="pa-0 h-auto">
              <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @on-cell-dbl-clicked="onCellDblClicked"
              @on-current-row-changed="onCurrentRowChanged"
            />
            </v-sheet>            
          </v-sheet>
          <v-sheet class="pa-0 h-auto">
            <IGridTitle :title="$t('아차사고/위험제보 사진')"></IGridTitle>
            <div class="d-flex flex-column fill-height row--grid">
              <v-sheet height="200px">
                <IUpload
                  ref="refIUpload"
                  grid-only
                  use-img-view
                  @rowChanged="fileRowChanged"
                />
              </v-sheet>
              <v-sheet class="pa-2 h-auto">
                <div class="div--imgwrap h-full pa-2">
                  <template v-if="isPdf">
                    <iframe width="100%" height="100%" :src="imgSrc" style="object-fit: cover;" />
                  </template>
                  <template v-else>
                    <div class="div--img h-full"
                      :style="`background-image: url(${imgSrc});`" />
                  </template>
                </div>
              </v-sheet>
          </div>
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    <SAFEB0010Popup ref="refSAFEB0010Popup" @saved="popupSaved" @closed="closedPopup" />
    <SAFEB0010Popup02 ref="refSAFEB0010Popup02" @saved="popupSaved" />
  </v-card>
</template>

<style scope lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}

.panel--cnt {
  .panel--total {
    background-color: rgb(192, 255, 255);
  }

  .panel--wait {
    background-color: rgb(255, 192, 128);
  }

  .panel--jochi {
    background-color: rgb(0, 255, 128);
  }
}
  
.div--imgwrap {
  border: 1px solid #cccccc;
  border-radius: 7px;
  
  .div--img {
    background-size: contain;
    background-position: 50% 50%;
  }
}

.row--grid {
  background-color: rgba(6, 47, 135, 0.02);
  border-radius: 7px;
}
</style>
