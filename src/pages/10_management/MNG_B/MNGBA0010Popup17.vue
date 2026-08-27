<!-- 2024.06.21(시작일) 계층별 안전점검 모니터링 -->
<!-- 개발 : 김홍규 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

// 쿼리 작동
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'


defineOptions({
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const dialog = ref(false)


/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_DT: dayjs().startOf('month').format("YYYY-MM-DD"),
  TO_DT: dayjs(new Date()).format("YYYY-MM-DD"),
  TEMP_FROM: dayjs().startOf('month').format("YYYY-MM-DD"),
  TEMP_TO: dayjs(new Date()).format("YYYY-MM-DD"),
  WORK_DAYS: '0 일',
  PROD_DIV: '',
})

const codeList = reactive({
  PROD_DIV: [
    {COD: '', TXT: '전체'},
    {COD: 'P', TXT: '생산'},
    {COD: 'N', TXT: '비생산'},
  ],
})

const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, width: '145', },
    { fieldName: 'STD_CNT1', dataType: 'number', numberFormat: '#,##0', header: { text: t('기준일') }, styleName: 'right-column', },
    { fieldName: 'REG_CNT1', dataType: 'number', numberFormat: '#,##0', header: { text: t('등록일') }, styleName: 'right-column', },
    { fieldName: 'CHK_RATE1', dataType: 'number', header: { text: t('점검율(%)') }, styleName: 'right-column', },
    { fieldName: 'STD_CNT2', dataType: 'number', numberFormat: '#,##0', header: { text: t('기준일') }, styleName: 'right-column', },
    { fieldName: 'REG_CNT2', dataType: 'number', numberFormat: '#,##0', header: { text: t('등록일') }, styleName: 'right-column', },
    { fieldName: 'CHK_RATE2', dataType: 'number', header: { text: t('점검율(%)') }, styleName: 'right-column', },
    { fieldName: 'STD_CNT3', dataType: 'number', numberFormat: '#,##0', header: { text: t('기준일') }, styleName: 'right-column', },
    { fieldName: 'REG_CNT3', dataType: 'number', numberFormat: '#,##0', header: { text: t('등록일') }, styleName: 'right-column', },
    { fieldName: 'CHK_RATE3', dataType: 'number', header: { text: t('점검율(%)') }, styleName: 'right-column', },
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM',
    {
      name: '부서장',
      direction: 'horizontal',
      items: [
        'STD_CNT1',
        'REG_CNT1',                          
        'CHK_RATE1',                          
      ],
    },
    {
      name: '직책과장',
      direction: 'horizontal',
      items: [
        'STD_CNT2',
        'REG_CNT2',                          
        'CHK_RATE2',                          
      ],
    },
    {
      name: '수석/생산팀장',
      direction: 'horizontal',
      items: [
        'STD_CNT3',
        'REG_CNT3',                          
        'CHK_RATE3',                          
      ],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if(btn.id === 'btnClose'){
    onClose()
  }
}

// 조회로직
const searchData = async () => {
  return commonSearchApi({ queryId : 'MNGBA0010_SEARCH_POPUP17', param: searchParams }) 
}

const afterSearch = async res => {
  searchParams.WORK_DAYS = res.ORESULT_CUR1[0].WORK_DAYS + ' 일'
  await grdMain.value.getDataProvider().setRows(res.ORESULT_CUR2)
}

//기간 시작(FR)이 TO보다 높을 경우 경고
const dateFrChanged = data => {
  
  if(data.target.value > searchParams.TO_DT){

    Message.warn(t('시작일이 종료일 보다 클 수 없습니다.'))
    searchParams.FROM_DT = searchParams.TEMP_FROM // 기간 시작
  }else{
    searchParams.TEMP_FROM = searchParams.FROM_DT
  }
}

//기간 끝(TO)이 FR보다 낮을 경우 경고
const dateToChanged = data => {
  if(data.target.value < searchParams.FROM_DT){
    Message.warn(t('종료일이 시작일 보다 작을 수 없습니다.'))
    searchParams.TO_DT = searchParams.TEMP_TO
  }else{
    searchParams.TEMP_TO = searchParams.TO_DT
  }
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {
  onButtonsClick({id: 'btnSearch'})
  //팝업 오픈
  dialog.value = true 
}

onMounted(() => {
  vm.$nextTick(() => {
    grdMain.value.getGridView().setDisplayOptions({
      fitStyle: 'none',
    })
  })
})

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
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{'계층별 안전점검 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-1 fill-height">
      <v-card-title class="pa-3 pb-0">
          <IMenuTitle
            ref="menuTitle"
            :title="$t('계층별 안전점검')"
            :button-list="['btnSearch', 'btnClose']"
            @click-button="onButtonsClick"
          />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet height="100%" style="display: flex; flex-direction: row;">
            <v-sheet width="100%" style="padding-right: 5px;">
              <v-sheet class="searchArea" style="display: flex; flex-direction: row;">
                <v-sheet style="display: flex; flex-direction: row;">
                  <i-input
                    v-model="searchParams.FROM_DT"
                    type="date"
                    :label="$t('기간')"
                    width="180px"
                    labelWidth="30px"
                    @change="dateFrChanged"
                  />
                  <i-input
                    v-model="searchParams.TO_DT"
                    width="170px"
                    labelWidth="20px"
                    :label="$t('~')"
                    type="date"
                    @change="dateToChanged"
                  />
                  <i-select
                    :label="$t('생산/비생산')"
                    width="200px"
                    v-model="searchParams.PROD_DIV"
                    :items="codeList.PROD_DIV"
                    item-value="COD"
                    item-title="TXT"
                  />
                  <i-input
                    v-model="searchParams.WORK_DAYS"
                    width="130px"
                    :label="$t('근무일수')"
                    type="text"
                    reverse
                    readonly
                  />
              </v-sheet>
            </v-sheet>
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
              />
          </v-sheet>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card> 
</VDialog>
</template>
    

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 200px);
  overflow-y: auto;
  > div {
    min-height: 600px;
  }
}

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