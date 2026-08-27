<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, onBeforeMount, nextTick, watch } from "vue"
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
} from "@hiway/api/commonApi"
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js";
import RealGrid from "@/components/RealGrid.vue"
import IGridTitle from '@/components/IGridTitle.vue'
import Message from "@hiway/utils/notify"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@hiway/stores/user"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { isEmpty, isEmptyArray } from "@/@core/utils"

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(["Saved"])
const saveYn = ref('Y')
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const grdMain3 = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,         // 사업장 구분
  // YEAR: dayjs(new Date).format('YYYY'),  // 년도
  FACTORY: '',
  REQ_CHA: 1
})

const codeList = reactive({
  IO_GUBN: [
    {COD: 'I',   TXT: '입고'},
    {COD: 'O',   TXT: '지급'},
  ],
  FACTORY: [
    {COD: 'MAIN',   TXT: '본공장'},
    {COD: 'MARINE', TXT: '해양공장'},
    {COD: 'GUNSAN', TXT: '군산공장'},
  ],
  REQ_CHA: [
    {COD: 1, TXT: '상반기'},
    {COD: 2, TXT: '하반기'}
  ]
})

const grdMainProps1 = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    headerHeight: 60,
    edit: { editable: false },
    rowIndicator: { visible: false },
    footer: { visible: true },
  },
  fields: [
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "FACTORY", dataType: "text", visible: false },
    { fieldName: "YEAR", dataType: "text", visible: false },
    { fieldName: "REQ_CHA", dataType: "text", visible: false },
    { fieldName: "SHOES_GUBN", width: "130", dataType: "text", header: { text: t("안전화 종류") }, lookupDisplay: true, styleName: 'left-column', footer: { text: '합계', styleName: 'center-column' } },
    { fieldName: "CNT", width: "50", dataType: "number", numberFormat: '#,###', header: { text: t("수량(족)") }, styleName: 'right-column',
      footer: {
        numberFormat: "#,###",
        valueCallback: (grid, column, footerIndex, columnFooter, value) => {
          var sum = 0;
          var prod = grid.getDataSource()
          var cnt = prod.getRowCount()
          for (var i=0 ; i<cnt ; i++) {
            sum += grid.getValue(i, 'CNT')
          }
          return sum
        }
      }
    },
  ],
  columns: [],
});

grdMainProps1.columns = grdMainProps1.fields;

const grdMainProps2 = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    headerHeight: 60,
    edit: { editable: false },
    rowIndicator: { visible: false },
    footer: { visible: true },
  },
  fields: [
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "FACTORY", dataType: "text", visible: false },
    { fieldName: "YEAR", dataType: "text", visible: false },
    { fieldName: "REQ_CHA", dataType: "text", visible: false },
    { fieldName: "SHOES_GUBN", width: "130", dataType: "text", header: { text: t("안전화 종류") }, lookupDisplay: true, styleName: 'left-column', footer: { text: '합계', styleName: 'center-column' }},
    { fieldName: "CNT", width: "50", dataType: "number", numberFormat: '#,###', header: { text: t("수량(족)") }, styleName: 'right-column', 
      footer: {
        numberFormat: "#,###",
        valueCallback: (grid, column, footerIndex, columnFooter, value) => {
          var sum = 0;
          var prod = grid.getDataSource()
          var cnt = prod.getRowCount()
          for (var i=0 ; i<cnt ; i++) {
            sum += grid.getValue(i, 'CNT')
          }
          return sum
        }
      }
    },
    // { fieldName: "INBOUND_DATE", dataType: "text", width: "100", header: { text: t("일자") }, lookupDisplay: true, styleName: 'center-column' },
  ],
  columns: [],
});

grdMainProps2.columns = grdMainProps2.fields;

const grdMainProps3 = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    headerHeight: 60,
    edit: { editable: false },
    rowIndicator: { visible: false },
    footer: { visible: true },
  },
  fields: [
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "FACTORY", dataType: "text", visible: false },
    { fieldName: "YEAR", dataType: "text", visible: false },
    { fieldName: "REQ_CHA", dataType: "text", visible: false },
    { fieldName: "SHOES_GUBN", width: "130", dataType: "text", header: { text: t("안전화 종류") }, lookupDisplay: true, styleName: 'left-column', footer: { text: '합계', styleName: 'center-column' } },
    { fieldName: "CNT", width: "50", dataType: "number", numberFormat: '#,###', header: { text: t("수량(족)") }, styleName: 'right-column', 
      footer: {
        numberFormat: "#,###",
        valueCallback: (grid, column, footerIndex, columnFooter, value) => {
          var sum = 0;
          var prod = grid.getDataSource()
          var cnt = prod.getRowCount()
          for (var i=0 ; i<cnt ; i++) {
            sum += grid.getValue(i, 'CNT')
          }
          return sum
        }
      }
    },
  ],
  columns: [],
});

grdMainProps3.columns = grdMainProps3.fields;

const openPopup = params => {
  searchParams.YEAR = params.YEAR
  onButtonsClick({ id: 'btnSearch' })

  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if(btn.id === 'btnClose') {
    closePopup()
  }else if(btn.id === 'btnPayProcess') {
    const year = searchParams.YEAR
    const reqCha = codeList.REQ_CHA.find(item => item.COD === searchParams.REQ_CHA).TXT
    new saveFlowHelper(vm, t)
      .setConfirmMessage(`${year}년도 ${reqCha} 지급 내역입니다.\n지급 처리 하시겠습니까?`)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }else if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

const searchData = () => {
  const mainParams = {...searchParams, FACTORY: 'MAIN' }
  const marineParams = {...searchParams, FACTORY: 'MARINE' }
  const gunsanParams = {...searchParams, FACTORY: 'GUNSAN' }

  return Promise.all([
    commonSearchApi({ queryId: 'HLTHA0050_SEARCH_02', param: mainParams}),
    commonSearchApi({ queryId: 'HLTHA0050_SEARCH_02', param: marineParams}),
    commonSearchApi({ queryId: 'HLTHA0050_SEARCH_02', param: gunsanParams}),
    commonSearchApi({ queryId: 'HLTHA0050_SEARCH_03', param: gunsanParams}),
  ])
}

const afterSearch = (res) => {
  grdMain1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
  grdMain2.value.getDataProvider().setRows(res[1].ORESULT_CUR)
  grdMain3.value.getDataProvider().setRows(res[2].ORESULT_CUR)
  saveYn.value = res[3].ORESULT_CUR[0].SAVE_YN
}

const saveParams = reactive([])

const beforeSave = () => {

  if(saveYn.value === 'N') {
    return Message.warn(t('이미 처리된 지급 내역 입니다.'))
  }

  saveParams.splice(0, saveParams.length)

  const mainData = grdMain1.value.getGridView().getJsonRows().filter(item => item.CNT !== 0)
  const marineData = grdMain2.value.getGridView().getJsonRows().filter(item => item.CNT !== 0)
  const gunsanData = grdMain3.value.getGridView().getJsonRows().filter(item => item.CNT !== 0)
  saveParams.push(...mainData, ...marineData, ...gunsanData)

  if(isEmptyArray(saveParams)) {
    return Message.warn(t('처리할 내역이 없습니다.'))
  }

  return true
}

const saveData = () => {
  return commonExecuteApi({ queryId: 'HLTHA0050_SAVE_02', list: saveParams })
}

const afterSave = () => {
  emit("Saved", searchParams)
  closePopup()
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHII710A')
  ]).then(res => {
    codeList.SHOES_GUBN = res[0].ORESULT_CUR
    grdMain1.value.setBindingColumn('SHOES_GUBN', codeList.SHOES_GUBN, 'COD', 'TXT')
    grdMain2.value.setBindingColumn('SHOES_GUBN', codeList.SHOES_GUBN, 'COD', 'TXT')
    grdMain3.value.setBindingColumn('SHOES_GUBN', codeList.SHOES_GUBN, 'COD', 'TXT')
  })
}

onMounted(() => {
  initCodeList()
})

const onUpdateYear = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const onUpdateReqCha = () => {
  onButtonsClick({ id: 'btnSearch' })
}


defineExpose({
  openPopup,
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>일괄 지급 처리</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0" >
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnPayProcess', 'btnClose']"
          :use-permission="false" 
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <div class="searchArea flex-column">
            <div class="d-flex flex-gap">
              <i-select 
                :label="$t('기준년도')" 
                label-width="50px" 
                width="160px" 
                v-model="searchParams.YEAR" 
                type="YEAR"
                @update:modelValue="onUpdateYear"
              />
              <i-select 
                :label="$t('반기구분')" 
                label-width="50px" 
                width="160px" 
                v-model="searchParams.REQ_CHA" 
                :items="codeList.REQ_CHA" 
                item-title="TXT" 
                item-value="COD" 
                @update:modelValue="onUpdateReqCha"
              />
            </div>
          </div>
          <div class="h-grow d-flex flex-area-gap">
            <v-sheet class="px-2 h-auto custom-flex-1">
              <IGridTitle 
                :title="$t('본공장')"      
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain1"
                style="height: 325px;"
                :grid-view-option="grdMainProps1.gridViewOption"
                :fields="grdMainProps1.fields"
                :columns="grdMainProps1.columns"
              />
            </v-sheet>
            <v-sheet class="px-2 h-auto custom-flex-1">
              <IGridTitle 
                :title="$t('해양공장')"      
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain2"
                style="height: 325px;"
                :grid-view-option="grdMainProps2.gridViewOption"
                :fields="grdMainProps2.fields"
                :columns="grdMainProps2.columns"
              />
            </v-sheet>
            <v-sheet class="px-2 h-auto custom-flex-1">
              <IGridTitle 
                :title="$t('군산공장')"      
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain3"
                style="height: 325px;"
                :grid-view-option="grdMainProps3.gridViewOption"
                :fields="grdMainProps3.fields"
                :columns="grdMainProps3.columns"
              />
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>

</style>
