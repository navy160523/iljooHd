<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import HLTIB0010Popup02 from './HLTIB0010Popup02.vue'
import HLTIB0010Tab04Popup from './HLTIB0010Tab04Popup.vue'
import Message from '@hiway/utils/notify'
const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const hLTIB0010Tab04Popup = ref(null)
const hLTIB0010Popup02 = ref(null)
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  WORK_STANDARD_ID: '',
})

const codeList = reactive({
  ES_DIV: [], //조사구분
})

const initCodeList = () => {
  Promise.all([getCodeList('HHII620')]).then((res) => {
    codeList.ES_DIV = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('ES_DIV', codeList.ES_DIV, 'COD', 'TXT')
  })
}

const openPopup = (rowData) => {
  dialog.value = true
  searchParam.WORK_STANDARD_ID = rowData.WORK_STANDARD_ID

  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_09',
    param: searchParam,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    //
  })
}

const closePopup = () => {
  dialog.value = false
  grdMain.value.getDataProvider().setRows(null)
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'ES_DATE',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('조사일자') },
    },
    {
      fieldName: 'ES_DIV',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('조사구분') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'HO_NO_1',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('단위작업1') },
    },
    {
      fieldName: 'HO_NO_2',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('단위작업2') },
    },
    {
      fieldName: 'HO_NO_3',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('단위작업3') },
    },
    {
      fieldName: 'TOT_PNT_1',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('단위1') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'TOT_PNT_2',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('단위2') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'TOT_PNT_3',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('단위3') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'YES_SYMTOM',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('유증상자') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        let ret = {}

        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          let iconSize = 15
          ret.renderer = {
            type: 'icon',
            iconLocation: 'right',
            iconCallback: function (grid, cell) {
              return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }

        return ret
      },
    },
    {
      fieldName: 'RESIST_YN',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('개선여부') },
      styleCallback: function (grid, dataCell) {
        let IMP_YN_B_FLAG_1 = grid.getValue(dataCell.index.itemIndex, 'IMP_YN_B_FLAG_1')
        let IMP_YN_B_FLAG_2 = grid.getValue(dataCell.index.itemIndex, 'IMP_YN_B_FLAG_2')
        let IMP_YN_B_FLAG_3 = grid.getValue(dataCell.index.itemIndex, 'IMP_YN_B_FLAG_3')
        if (IMP_YN_B_FLAG_1 === 'Y' && IMP_YN_B_FLAG_2 === 'Y' && IMP_YN_B_FLAG_3 === 'Y') {
          return false
        } else {
          let ret = {}
          const iconSize = 15
          ret.renderer = {
            type: 'icon',
            iconLocation: 'right',
            iconCallback: function (grid, cell) {
              return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }

          return ret
        }
      },
    },
    {
      fieldName: 'ES_EMP_NM',
      dataType: 'text',
      width: '25',
      editable: false,
      header: { text: t('조사자') },
    },
    {
      fieldName: 'REMARKS',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('비고') },
    },
    {
      fieldName: 'ES_SEQ',
      visible: false,
    },
    {
      fieldName: 'WORK_STANDARD_ID',
      visible: false,
    },
    {
      fieldName: 'OMIT_YN',
      visible: false,
    },
    {
      fieldName: 'ES_DEPT_NM',
      visible: false,
    },
    {
      fieldName: 'WORK_STANDARD_NM',
      visible: false,
    },
    {
      fieldName: 'WORK_STANDARD_NO',
      visible: false,
    },
    {
      fieldName: 'IMP_YN_B_FLAG_1',
      visible: false,
    },
    {
      fieldName: 'IMP_YN_B_FLAG_2',
      visible: false,
    },
    {
      fieldName: 'IMP_YN_B_FLAG_3',
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    'ES_DATE',
    'ES_DIV',
    {
      name: '부담작업',
      direction: 'horizontal',
      items: ['HO_NO_1', 'HO_NO_2', 'HO_NO_3'],
    },
    {
      name: '빈도*강도',
      direction: 'horizontal',
      items: ['TOT_PNT_1', 'TOT_PNT_2', 'TOT_PNT_3'],
    },
    'YES_SYMTOM',
    'RESIST_YN',
    'ES_EMP_NM',
    'REMARKS',
  ],
})

grdMainProps.columns = grdMainProps.fields

const onCellClicked = (grid, clickData) => {
  let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  if (clickData.column === 'YES_SYMTOM') {
    if (rowData.OMIT_YN === 'Y') {
      //Message.warn(t('조사 생략된건입니다.'))
      return false
    }
    hLTIB0010Tab04Popup.value.openPopup(rowData)
  } else if (clickData.column === 'RESIST_YN') {
    if (rowData.IMP_YN_B_FLAG_1 === 'Y' && rowData.IMP_YN_B_FLAG_2 === 'Y' && rowData.IMP_YN_B_FLAG_3 === 'Y') {
      return false
    } else if (rowData.OMIT_YN === 'Y') {
      Message.warn(t('조사 생략된건입니다.'))
      return false
    }
    rowData.BEFORE_DATA = true
    hLTIB0010Popup02.value.openPopup(rowData)
  }
}

onMounted(() => {
  initCodeList()
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1200"
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
      <span>조사이력</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onCellClicked"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <HLTIB0010Tab04Popup ref="hLTIB0010Tab04Popup"></HLTIB0010Tab04Popup>
  <HLTIB0010Popup02 ref="hLTIB0010Popup02"></HLTIB0010Popup02>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 650px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 300px;
  }
}
</style>
