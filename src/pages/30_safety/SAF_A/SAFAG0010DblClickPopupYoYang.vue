<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 산재정보 등록/현황  더블클릭/ 요양관리 팝업 -->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { value } from 'lodash-es'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { useLogsStore } from '@hiway/stores/logs'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'saved'])
const dialog = ref(false)
const grdMain = ref(null)
const innerData = reactive({})
const userStore = useUserStore()
const codeList = reactive({})
const RowData = ref(null)

const openPopup = (popupParam) => {
  console.log('요양관리 받은데이터', popupParam)
  dialog.value = true
  innerData.data = popupParam
  Promise.all([getCodeList('HHIB250070')]).then((res) => {
    codeList.GBN = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('GBN', codeList.GBN, 'COD', 'TXT')
  })
  onButtonsClick({ id: 'btnSearch' })
}

//그리드 셋팅
const grdPopUpProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: 'GBN',
      dataType: 'text',
      header: { text: t('요양관리 구분') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
        dropDownCount: 5,
        partialMatch: true,
        domainOnly: true,
        dropDownWhenClick: true,
      },
    },

    {
      fieldName: 'FROMDTE1',
      header: { text: t('시작일') },
      dataType: 'text',
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      styleName: 'editable_column',
    },

    {
      fieldName: 'TODTE1',
      header: { text: t('종료일') },
      dataType: 'text',
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      styleName: 'editable_column',
    },

    {
      fieldName: 'FROMDTE2',
      header: { text: t('시작일') },
      dataType: 'text',
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      styleName: 'editable_column',
    },

    {
      fieldName: 'TODTE2',
      header: { text: t('종료일') },
      dataType: 'text',
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      styleName: 'editable_column',
    },

    { fieldName: 'HOSPITAL', dataType: 'text', header: { text: t('병원') } },
    { fieldName: 'BIGO', dataType: 'text', header: { text: t('비고') } },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SANNO', dataType: 'text', visible: false },
    { fieldName: 'SERNO', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    'GBN',
    {
      name: '입원',
      direction: 'horizontal',
      items: ['FROMDTE1', 'TODTE1'],
      header: {
        text: t('입원'),
      },
    },
    {
      name: '통원',
      direction: 'horizontal',
      items: ['FROMDTE2', 'TODTE2'],
      header: {
        text: t('통원'),
      },
    },
    'HOSPITAL',
    'BIGO',
    'SERNO',
    'SANNO',
    'CMPNY_DIV',
  ],
})

grdPopUpProps.columns = grdPopUpProps.fields

// 그리드 데이터입력

const searchData01 = (idx) => {
  return commonSearchApi({
    queryId: 'SAFAG0010_SEARCH12',
    param: { CMPNY_DIV: innerData.data.CMPNY_DIV, SANNO: innerData.data.SANNO },
  })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  let grdCount = grdMain.value.getGridView().getItemCount()
  //포커스 마지막 행으로
  if (grdCount !== 0) {
    grdMain.value
      .getGridView()
      .setCurrent({ itemIndex: grdCount - 1, column: 'GBN' })
    grdMain.value.getGridView().setFocus()
  }
  let params = {
    userStore: userStore,
    params: innerData.data,
    mgs: '산재정보등록현황/요양관리 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

// 추가
const addRowData = () => {
  let focusData = grdMain.value.getGridView().getCurrent().dataRow
  if (focusData === -1) {
    //첫행추가시 요양관리구분은 최초진료로 생성
    grdMain.value.addRow({
      GBN: '1',
      SANNO: innerData.data.SANNO,
      CMPNY_DIV: innerData.data.CMPNY_DIV,
    })
    return false
  } else {
    let rowData = grdMain.value.getDataProvider().getJsonRow(focusData)

    if (rowData.FROMDTE2) {
      if (!rowData.TODTE2) {
        return Message.warn(t('통원 종료일을 입력해주십시오.'))
      }
    }
    grdMain.value.addRow(
      {
        SANNO: innerData.data.SANNO,
        GBN: rowData.GBN,
        CMPNY_DIV: innerData.data.CMPNY_DIV,
        FROMDTE2: rowData.TODTE2
          ? dayjs(rowData.TODTE2).add(1, 'day').format('YYYY-MM-DD')
          : '',
        HOSPITAL: rowData.HOSPITAL,
      },
      false
    )
  }
}
//  저장

const mainCheck = async () => {
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  } else {
    return true
  }
}

const mainSaveData = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  let param = []
  chekedRow.forEach((val) => {
    let data = grdMain.value.getDataProvider().getJsonRow(val)
    data.USER_ID = userStore.userId

    param.push(data)
    let params = {
      userStore: userStore,
      params: data,
      mgs: '산재정보등록현황/요양관리 저장했습니다.',
      crudGbn: 'C', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
  })

  return commonExecuteApi({ queryId: 'SAFAG0010_SAVE_08', list: param })
}

const mainDelData = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  let param = []
  chekedRow.forEach((val) => {
    let data = grdMain.value.getDataProvider().getJsonRow(val)
    data.USER_ID = userStore.userId
    param.push(data)
  })
  let params = {
    userStore: userStore,
    params: innerData.data,
    mgs: '산재정보등록현황/요양관리 삭제했습니다.',
    crudGbn: 'D', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)

  return commonExecuteApi({ queryId: 'SAFAG0010_DELETE_02', list: param })
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(mainSaveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(mainDelData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnClose') {
    dialog.value = false
  } else if (btn.id === 'btnCreate') {
    addRowData()
  }
}

const afterSave = (res) => {
  //firstData = 요양시작일(첫번째행)
  //lastData = 요양기간(마지막행)
  onButtonsClick({ id: 'btnSearch' })
  console.log('요양관리 저장후 받은 데이터', res)
  let allData = grdMain.value.getDataProvider().getJsonRows()
  if (allData.length === 0) {
    return false
  }
  let firstData = allData[0] //첫번째데이터
  let lastData = allData[allData.length - 1] //마지막데이터
  console.log('firstData', firstData)
  console.log('lastData', lastData)

  //요양관리 구분이 병행이면 emit 실행 하지 않음
  if (lastData.GBN !== '3') {
    emit('saved', lastData, firstData)
  }
}

const onSelect = () => {
  emit('selected', 'selected')
}

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
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <div class="title-bar" @mousedown="startDragging">요양관리</div>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          :use-permission="false"
          :button-list="[
            'btnSearch',
            'btnCreate',
            'btnUpdate',
            'btnDelete',
            'btnClose',
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('산재자')"
              v-model="innerData.data.EMPLNO"
              readonly
              placeholder="사번"
              class="mx-2"
              width="200px"
            >
            </i-input>
            <i-input
              v-model="innerData.data.KOR_NM"
              readonly
              placeholder="이름"
              width="200px"
            >
            </i-input>
          </v-sheet>
          <v-sheet>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 400px"
              :grid-view-option="grdPopUpProps.gridViewOption"
              :keys="grdPopUpProps.keys"
              :fields="grdPopUpProps.fields"
              :columns="grdPopUpProps.columns"
              :column-layout="grdPopUpProps.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
