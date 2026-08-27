<!--
  화면명 : 화학물질 식별 상세
  화면개요 : 화학물질 식별 상세
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import AddPopup from '@/pages/100_health/HLT_D/HLTDA0060Popup03Popup01.vue'
 
const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const addPopup = ref(null)
const isAdmin = ref(false)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  SEARCH_TXT: '',
  TMP_DATE_FROM: dayjs().subtract(1,'year').format('YYYY-MM-DD'),
  TMP_DATE_TO: dayjs().format('YYYY-MM-DD'),
  DATE_FROM: '',
  DATE_TO: ''
})

const codeList = reactive({
  BSNS_CD: []
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: false }},
  keys: [],
  fields: [
    { fieldName: 'REGDTE', width: '60', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('식별일자') }, },
    { fieldName: 'BSNS_CD', width: '60', dataType: 'text', header: { text: t('사업부') }, lookupDisplay: true },
    { fieldName: 'MATNO', width: '80', dataType: 'text', header: { text: t('자재번호')} },
    { fieldName: 'MATNME', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('품명') } },
    { fieldName: 'DEPT_NM', width: '60', dataType: 'text', header: { text: t('청구부서') } },
    { fieldName: 'EMP_NM', width: '60', dataType: 'text', header: { text: t('청구자') } },
    { fieldName: 'CHEMIYN', width: '60', dataType: 'text', header: { text: t('식별 값')} },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('순번') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('청구부서') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
  ],
  columns: [],
})
 
grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  // admin 부여

  grdMain.value.getGridView().filterPanel.visible = true
  searchParams.SEARCH_TXT = ''
  Promise.all([
    // 사업부
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV } }), // 부서
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('BSNS_CD', codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')
    onButtonsClick({ id: 'btnSearch' })
  })
  
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

// 그리드 데이터 조회
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  searchParams.DATE_FROM = dayjs(searchParams.TMP_DATE_FROM).format('YYYYMMDD')
  searchParams.DATE_TO = dayjs(searchParams.TMP_DATE_TO).format('YYYYMMDD')

  return commonSearchApi({ queryId: 'HLTDA0060_SEARCH_05', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  grdMain.value.getDataProvider().setRows([])

  searchParams.TMP_DATE_FROM = dayjs().subtract(1,'year').format('YYYY-MM-DD')
  searchParams.TMP_DATE_TO = dayjs().format('YYYY-MM-DD')
  searchParams.SEARCH_TXT = ''
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1400"
    height="890"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>화학물질 식별 상세 내역</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-input
              v-model="searchParams.TMP_DATE_FROM"
              label-width="50px"
              :label="$t('기간')"
              type="date"
              width="200px"
              class="mr-2"
            />
            <i-input
              v-model="searchParams.TMP_DATE_TO"
              label-width="20px"
              :label="$t('~')"
              type="date"
              width="180px"
            />
            <i-input
              v-model="searchParams.SEARCH_TXT"
              :label="$t('검색')"
              label-width="50px"
              type="text"
              width="500px"
              @keydown.enter="getData"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <IGridTitle
              :title="$t('화학물질 식별 상세 내역')"
            ></IGridTitle>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 580px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
    <AddPopup ref="addPopup" @after-search="getData"/>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
