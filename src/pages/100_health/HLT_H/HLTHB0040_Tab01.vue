<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, onBeforeMount, nextTick, watch } from "vue"
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
} from "@hiway/api/commonApi"
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
import HLTHB0040Popup01 from "./HLTHB0040Popup01.vue"

const props = defineProps({ searchParams: Object })

const grdMain = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어

const today = ref(dayjs(new Date).format('YYYY-MM-DD'))

const codeList = reactive({
  FACTORY: [
    {COD: 'MAIN',   TXT: '본공장'},
    {COD: 'MARINE', TXT: '해양공장'},
    {COD: 'GUNSAN', TXT: '군산공장'},
  ],
  SHOES_GUBN: [],
  IO_GUBN: [
    {COD: 'I', TXT: '입고'},
    {COD: 'O', TXT: '지급'},
  ]
})

const initCodeList = () => {
  Promise.all([
    getCodeList('HHII710C')
  ]).then(res => {
    codeList.SHOES_GUBN = res[0].ORESULT_CUR

    grdMain.value.setBindingColumn('FACTORY', codeList.FACTORY, 'COD', 'TXT')
    grdMain.value.setBindingColumn('SHOES_GUBN', codeList.SHOES_GUBN, 'COD', 'TXT')
    grdMain.value.setBindingColumn('IO_GUBN', codeList.IO_GUBN, 'COD', 'TXT')

    codeList.FACTORY.unshift({ COD: '', TXT: '전체' })
    codeList.SHOES_GUBN.unshift({ COD: '', TXT: '전체' })
    codeList.IO_GUBN.unshift({ COD: '', TXT: '전체' })
  })
}

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: true },
    checkBar: { visible: true },
  },
  fields: [
    { fieldName: 'SAVE_YN', dataType: 'text' , visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "SEQ", dataType: "text", visible: false },
    { fieldName: "IO_GUBN", width: "50", dataType: "text", header: { text: t("수불구분"), styleName: 'header_validit' }, lookupDisplay: true, editor: { type: 'dropdown', }, requiredMessage: '[수불구분]은 필수입니다.', 
      styleCallback: function(grid, dataCell) {
        const ret = { editable : true, styleName : 'editable_column-center', enabled: true }
        const savedValue = grid.getValue(dataCell.index.itemIndex, 'SAVE_YN')
        if(savedValue !== 'N') {
          ret.editable = false
          ret.styleName = 'center-column'
        }
        return ret
      }
    },
    { fieldName: "FACTORY", width: "70", dataType: "text", header: { text: t("공장구분"), styleName: 'header_validit' }, lookupDisplay: true, editor: { type: 'dropdown', }, requiredMessage: '[공장구분]은 필수입니다.',
      styleCallback: function(grid, dataCell) {
        const ret = { editable : true, styleName : 'editable_column-left', enabled: true }
        const savedValue = grid.getValue(dataCell.index.itemIndex, 'SAVE_YN')
        if(savedValue !== 'N') {
          ret.editable = false
          ret.styleName = 'left-column'
        }
        return ret
      }
    },
    { fieldName: "SHOES_GUBN", width: "100", dataType: "text", header: { text: t("안전장화 종류"), styleName: 'header_validit' }, lookupDisplay: true, requiredMessage: '[안전화 종류]는 필수입니다.', editor: { type: 'dropdown', },
      styleCallback: function(grid, dataCell) {
        const ret = { editable : true, styleName : 'editable_column-left', enabled: true }
        const savedValue = grid.getValue(dataCell.index.itemIndex, 'SAVE_YN')
        if(savedValue !== 'N') {
          ret.editable = false
          ret.styleName = 'left-column'
        }
        return ret
      }
    },
    { fieldName: "CNT", width: "30", dataType: "number", numberFormat: '#,###', header: { text: t("수량(족)"), styleName: 'header_validit' }, requiredMessage: '[수량]은 필수입니다.', styleName: 'editable_column-right' },
    {
      fieldName: "INBOUND_DATE", width: "70", header: { text: t("일자"), styleName: 'header_validit' }, lookupDisplay: true, styleName: 'editable_column-center', requiredMessage: '[일자]는 필수입니다.',
      editor: {
        type: 'date',
        commitOnSelect: true,
        datetimeFormat: 'yyyy-MM-dd',
        maxDate: today.value,
        mask: {
          editMask: '9999-99-99',
          placeHolder:'yyyy-MM-dd', 
          includedFormat: true
        }
      },
    },
    { fieldName: "REMARK", width: "150", dataType: "text", header: { text: t("비고") }, styleName: 'editable_column-left'},
  ],
  columns: []
})

grdMainProps.columns = grdMainProps.fields


const onUpdateYear = () => {
  props.searchParams.IO_GUBN = ''
  props.searchParams.FACTORY = ''
  props.searchParams.SHOES_GUBN = ''
  onButtonsClick({ id: 'btnSearch' })
}

const onUpdateIoGubn = () => {  
  props.searchParams.FACTORY = ''
  props.searchParams.SHOES_GUBN = ''
  onButtonsClick({ id: 'btnSearch' })
}

const onUpdateFactory = () => {
  props.searchParams.SHOES_GUBN = ''
  onButtonsClick({ id: 'btnSearch' })
}

const onUpdateShoesGubn = () => {
  onButtonsClick({ id: 'btnSearch' })
}



//로우 추가하는 함수
const addRowData = () => {
  grdMain.value.getDataProvider().insertRow(0, {
    CMPNY_DIV: props.searchParams.CMPNY_DIV,
    FACTORY: props.searchParams.FACTORY,
    SHOES_GUBN: props.searchParams.SHOES_GUBN,
    IO_GUBN: props.searchParams.IO_GUBN,
    SAVE_YN: 'N'
  })
  grdMain.value.getGridView().checkItem(0, true)

  // grdMain.value.addRow({
  //   CMPNY_DIV: props.searchParams.CMPNY_DIV,
  //   FACTORY: props.searchParams.FACTORY,
  //   SHOES_GUBN: props.searchParams.SHOES_GUBN,
  //   IO_GUBN: props.searchParams.IO_GUBN,
  //   SAVE_YN: 'N'
  // })
}

const hLTHB0040Popup01 = ref(null)

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    getData()
  }else if (btn.id === 'btnCreate') {
    addRowData()
  }else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('저장 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }else if(btn.id === 'btnBatchPayment') {
    hLTHB0040Popup01.value.openPopup(props.searchParams)
  }
}

// 삭제
const deleteData = () => { 
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTHB0040_DELETE_01', list: saveParams })
}

// 삭제 후
const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

// 검색
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const searchData = () => {
  return commonSearchApi({ queryId: 'HLTHB0040_SEARCH_01', param: props.searchParams })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장
const beforeSave = () => {
  // check 항목이 없을 시 return
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.IO_GUBN)) {
      return Message.warn(t('수불구분은 필수 입력 사항입니다.'))
    }else if(isEmpty(data.FACTORY)) {
      return Message.warn(t('공장은 필수 입력 사항입니다.'))
    } else if(isEmpty(data.SHOES_GUBN)) {
      return Message.warn(t('안전장화 종류는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.CNT)) {
      return Message.warn(t('수량은 필수 입력 사항입니다.'))
    } else if(isEmpty(data.INBOUND_DATE)) {
      return Message.warn(t('일자는 필수 입력 사항입니다.'))
    }
  }
  return true
}

const saveData = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId : 'HLTHB0040_SAVE_01', list: saveParams })
}

const afterSave = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const savedBatchPayment = searchParams => {
  props.searchParams.YEAR = searchParams.YEAR
  props.searchParams.IO_GUBN = 'O'
  props.searchParams.FACTORY = searchParams.FACTORY
  onButtonsClick({ id: 'btnSearch' })
}


const onEditCommit = (grid, index, oldValue, newValue) => {
  if(new Date(newValue) > new Date(today.value)) {
    setTimeout(() => {
      grid.setValue(index.itemIndex, index.fieldName, today.value);
    }, 0)
  }
}

onMounted(async () => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
  onButtonsClick({ id: 'btnSearch' })
})

defineExpose({
  onButtonsClick
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle 
        ref="menuTitle" 
        :button-list="['btnBatchPayment', 'btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        :use-permission="true" 
        @click-button="onButtonsClick" 
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select 
              :label="$t('기준년도')" 
              label-width="50px" 
              width="160px" 
              v-model="props.searchParams.YEAR" 
              type="YEAR"
              @update:modelValue="onUpdateYear" 
            />
            <i-select 
              :label="$t('수불구분')" 
              label-width="50px" 
              width="160px" 
              v-model="props.searchParams.IO_GUBN"
              :items="codeList.IO_GUBN" 
              item-title="TXT" 
              item-value="COD"
              @update:modelValue="onUpdateIoGubn" 
            />
            <i-select 
              :label="$t('공장구분')" 
              label-width="50px" 
              width="170px"
              v-model="props.searchParams.FACTORY"
              :items="codeList.FACTORY" 
              item-title="TXT" 
              item-value="COD" 
              @update:modelValue="onUpdateFactory" 
            />
            <i-select 
              :label="$t('안전장화 종류')" 
              label-width="80px" 
              width="300px" 
              v-model="props.searchParams.SHOES_GUBN"
              :items="codeList.SHOES_GUBN" 
              item-title="TXT" 
              item-value="COD"
              @update:modelValue="onUpdateShoesGubn" 
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid ref="grdMain" 
            :grid-view-option="grdMainProps.gridViewOption" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns" 
            @onEditCommit="onEditCommit"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <HLTHB0040Popup01 
    @Saved="savedBatchPayment"
    ref="hLTHB0040Popup01" 
  />
</template>

<style lang="scss" scoped>
  .content-area {
    position: relative;
    height: calc(100vh - 300px);
    overflow-y: auto;

    /* >div {
      min-height: 700px;
    } */
  }

  .tooltip-wrapper {
    position: absolute;
  }

  .tooltip {
    position: relative;
    /* 화살표가 툴팁 아래에 위치하도록 */
    background-color: #424242;
    color: #fff;
    padding: 5px 10px;
    border-radius: 4px;
    z-index: 1000;
    /* 툴팁이 다른 요소 위에 보이도록 */
    pointer-events: none;
    /* 툴팁이 마우스 이벤트를 받지 않도록 */
    white-space: nowrap;
    /* 내용이 줄바꿈되지 않도록 */
  }

  .tooltip-arrow {
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    /* 화살표의 왼쪽 부분 */
    border-right: 5px solid transparent;
    /* 화살표의 오른쪽 부분 */
    border-top: 5px solid #424242;
    /* 화살표의 색상 */
    position: absolute;
    left: 50%;
    /* 가운데 정렬 */
    transform: translateX(-50%);
    /* 수평 중심으로 이동 */
    top: 100%;
    /* 툴팁 아래에 위치 */
  }
</style>
