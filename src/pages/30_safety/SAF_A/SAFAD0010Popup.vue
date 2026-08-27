<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IGridTitle from '@/components/IGridTitle.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'

defineOptions({
  name: '30_safety-SAF_A-SAFAD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const grdMain = ref(null)
const grdSub = ref(null)
const dialog = ref(false)
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().$y, //년도
  BSNS_CD: '', //사업부
})

//노무비 단가 조회 파라미터
const searchParam02 = reactive({
  CMPNY_DIV: '',
  YEAR: '',
})

const codeList = reactive({
  bsnscd: [],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
  ]).then((res) => {
    codeList.bsnscd = res[0].ORESULT_CUR
    codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('사업부코드') },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '100',
      mergeRule: { criteria: 'value' },
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'PART_CD',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('부문코드') },
    },
    {
      fieldName: 'PART_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      mergeRule: { criteria: 'value' },
      header: { text: t('부문') },
    },
    {
      fieldName: 'DAMD_CD',
      dataType: 'text',
      width: '65',
      visible: false,
      header: { text: t('담당코드') },
    },
    {
      fieldName: 'DAMD_NM',
      dataType: 'text',
      width: '65',
      editable: false,
      mergeRule: { criteria: "values['BSNS_NM'] + values['PART_NM'] + value" },
      header: { text: t('담당') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('부서코드') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('부서') },
    },
    {
      fieldName: 'ACC_RATE_PLN',
      dataType: 'text',
      width: '100',
      styleName: 'right-column editable_column',
      editor: {
        type: 'line',
        maxLength: 5,
        inputCharacters: '0-9.',
      },
      header: { text: t('년 기준 재해율 목표') },
    },
    {
      fieldName: 'ACC_CNT',
      dataType: 'number',
      width: '100',
      numberFormat: '#,###',
      styleName: 'right-column editable_column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      header: { text: t('건수') },
    },
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('년도') },
    },
    {
      fieldName: 'PRC_PER_MH',
      dataType: 'number',
      width: '100',
      numberFormat: '#,###',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      header: { text: t('단가(원/MH)') },
      styleName: 'right-column editable_column',
    },
    {
      fieldName: 'MH_PER_DAY',
      dataType: 'text',
      width: '100',
      header: { text: t('1일 기준 근무시간(HR)') },
      styleName: 'right-column editable_column',
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      width: '100',
      styleName: 'editable_column',
      header: { text: t('비고') },
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      visible: false,
      header: { text: t('비고') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    if (!searchParam.YEAR) {
      Message.warn(t('년도를 입력해주세요.'))
      return
    } else if(searchParam.YEAR * 1 < 2024) {
      Message.warn(t('2024년도부터 검색가능합니다.'))
      return
    }

    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
    new queryFlowHelper(vm, t)
      .setGridList([grdSub])
      .setQuery(searchData02)
      .setAfter(afterSearch02)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else {
    closePopup()
  }
}
//노무비 단가 버튼
const onButtonsClick2 = (btn) => {
  if (btn.id === 'btnCreate') {
    addRow()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete02)
      .setQuery(deleteData02)
      .setAfter(afterDelete02)
      .run()
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFAD0010_SEARCH03',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  setStyleGrid()
}
//조회관련 로직 끝

//저장관련 로직 시작
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedRows.length === 0) {
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      BSNS_CD: data.BSNS_CD,
      PART_CD: data.PART_CD,
      DAMD_CD: data.DAMD_CD,
      DEPT_CD: data.DEPT_CD,
      YEAR: searchParam.YEAR,
      ACC_RATE_PLN: data.ACC_RATE_PLN,
      ACC_CNT: data.ACC_CNT,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFAD0010_SAVE01',
    list: saveParam,
  })
}

const afterSave = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//저장관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedRows.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV,
      BSNS_CD: data.BSNS_CD,
      PART_CD: data.PART_CD,
      DAMD_CD: data.DAMD_CD,
      DEPT_CD: data.DEPT_CD,
      YEAR: searchParam.YEAR,
      ACC_RATE_PLN: data.ACC_RATE_PLN,
      ACC_CNT: data.ACC_CNT,
      USER_ID: userStore.userId,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFAD0010_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//노무비 단가 조회 관련 로직 시작
const searchData02 = () => {
  searchParam02.CMPNY_DIV = searchParam.CMPNY_DIV
  searchParam02.YEAR = searchParam.YEAR
  return commonSearchApi({
    queryId: 'SAFAD0010_SEARCH06',
    param: searchParam02,
  })
}

const afterSearch02 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//노무비 단가 조회 관련 로직 끝

//노무비 단가 추가 버튼 관련 로직 시작
const addRow = () => {
  grdSub.value
    .getDataProvider()
    .addRow({ CMPNY_DIV: userStore.cmpnyDiv, YEAR: searchParam.YEAR })
}
//노무비 단가 추가 버튼 관련 로직 끝

//노무비 단가 저장 버튼 관련 로직 시작
const beforeSave02 = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if (checkedRows.length === 0) {
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    return false
  }
  return true
}

const saveData02 = () => {
  let saveParam = []
  let checkedData = grdSub.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdSub.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      YEAR: data.YEAR,
      PRC_PER_MH: data.PRC_PER_MH,
      MH_PER_DAY: data.MH_PER_DAY,
      REMARK: data.REMARK,
      SAVE_YN: data.SAVE_YN,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFAD0010_SAVE02',
    list: saveParam,
  })
}

const afterSave02 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//노무비 단가 저장버튼 관련 로직 끝

//노무비 단가 삭제버튼 관련 로직 시작
const beforeDelete02 = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if (checkedRows.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))
    return false
  }
  return true
}

const deleteData02 = () => {
  let deleteParam = []
  let checkedData = grdSub.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdSub.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV,
      YEAR: data.YEAR,
      SAVE_YN: data.SAVE_YN,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFAD0010_DELETE02',
    list: deleteParam,
  })
}

const afterDelete02 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//노무비 단가 삭제버튼 관련 로직 끝

const openPopup = () => {
  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
}

const setStyleGrid = () => {
  grdMain.value.getGridView().layoutByColumn('BSNS_NM').spanCallback =
    function (grid, layout, itemIndex) {
      var value = grid.getValue(itemIndex, 'BSNS_NM')
      if (value == '총계') {
        return 4 //가로 병합 수
      }
      return 1
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
    width="950"
    class="draggable-dialog"
    eager
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">재해율목표관리</div>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        >
        </IGridTitle>
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-input
              width="200px"
              :label="$t('년도')"
              type="number"
              :min="2000"
              :max="3000"
              v-model="searchParam.YEAR"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
              required
            ></i-input>
            <i-select
              width="200px"
              :items="codeList.bsnscd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :label="$t('사업부')"
              v-model="searchParam.BSNS_CD"
            ></i-select>
          </v-sheet>
          <v-sheet v-show="false">
            <IGridTitle
              :title="$t('년도별 노무비 단가 현황 : M/H 당 단가')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
              @click-button="onButtonsClick2"
            >
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              style="height: calc(100vh - 850px)"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
          <v-sheet class="mt-2">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: calc(100vh - 360px)"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
            <!-- @onCellDblClicked="onCellDblClicked" -->
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
