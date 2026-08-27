<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import SAFCE0020Popup from './SAFCE0020Popup.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
defineOptions({
  name: '30_safety-SAF_C-SAFCE0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const sAFCE0020Popup = ref(null)
// const clickRowNumber = ref(null)
const searchParam01 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().$y + '', //년도
  WEEK_FROM: 1,
  WEEK_TO: '', //주차
})

const searchParam02 = reactive({
  CMPNY_DIV: '',
  CLSS_SEQ: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'YEAR',
      dataType: 'text',
      editable: false,
      header: { text: t('년도') },
      width: '50',
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'WEEK',
      dataType: 'text',
      editable: false,
      width: '50',
      header: { text: t('주차') },
    },
    {
      fieldName: 'WEEK_DESC',
      dataType: 'text',
      visible: false,
      width: '100',
      header: { text: t('') },
    },
    {
      fieldName: 'WEEK_START',
      dataType: 'text',
      editable: false,
      width: '70',
      header: { text: t('주 시작일') },
    },
    {
      fieldName: 'WEEK_END',
      dataType: 'text',
      editable: false,
      width: '70',
      header: { text: t('주 종료일') },
    },
    {
      fieldName: 'CLSS_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CLSS_TITLE',
      dataType: 'text',
      editable: false,
      width: '150',
      styleName: 'left-column',
      header: { text: t('점검대상') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'OPEN',
      editable: false,
      width: '50',
      header: { text: t('') },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        const iconSize = 15

        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function (grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }

        return ret
      },
    },
  ],
  columns: [],
  columnLayout: [
    'YEAR',
    'WEEK',
    'WEEK_START',
    'WEEK_END',
    {
      name: '점검대상',
      direction: 'horizontal',
      hideChildHeaders: true,
      items: ['CLSS_TITLE', 'OPEN'],
    },
  ],
})

const grdSubProps = reactive({
  fields: [
    {
      fieldName: 'CLSS_TITLE',
      dataType: 'text',
      header: { text: t('점검 대상') },
      width: '60',
      editable: false,
      styleName: 'left-column',
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'CHK_TITLE',
      dataType: 'text',
      width: '200',
      styleName: 'left-column',
      editable: false,
      header: { text: t('점검항목') },
    },
    {
      fieldName: 'CHK_RESULT',
      dataType: 'text',
      width: '40',
      editable: false,
      styleName: 'left-column',
      header: { text: t('점검결과') },
      visible: false,
    },
    {
      fieldName: 'REMARKS',
      dataType: 'text',
      styleName: 'left-column',
      editable: false,
      width: '80',
      header: { text: t('비고') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

onMounted(() => {
  searchParam01.WEEK_TO = getWeek()
  onButtonsClick({ id: 'btnSearch' })
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch01)
      .setQuery(searchData01)
      .setAfter(afterSerach01)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

//점검계획 조회관련 로직 시작
const beforeSearch01 = () => {
  if (searchParam01.YEAR.length < 4) {
    Message.warn(t('올바른 년도를 입력해주세요.'))
    return false
  }
  return true
}

const searchData01 = () => {
  return commonSearchApi({
    queryId: 'SAFCE0020_SEARCH01',
    param: searchParam01,
  })
}

const afterSerach01 = (res) => {
  if (res.ORESULT_CUR.length === 0) {
    grdSub.value.getDataProvider().setRows(null) //점검계획에 조회된값이 없을때 점검항목 그리드 비우기
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  if(res.ORESULT_CUR.length > 0) {
    grdMain.value.getGridView().setCurrent(0)
    const dataRowIdx = grdMain.value.getGridView().getCurrent().dataRow
    const row = grdMain.value.getDataProvider().getJsonRow(dataRowIdx)

    searchParam02.CMPNY_DIV = row.CMPNY_DIV
    searchParam02.CLSS_SEQ = row.CLSS_SEQ
    new queryFlowHelper(vm, t)
      .setGridList([grdSub])
      .setQuery(searchData02)
      .setAfter(afterSearch02)
      .run()
  }
}
//점검계획조회관련 로직 끝

//점검항목 조회관련 로직 시작
// const onCurrRowChanged = (grid, oldIndex, newIndex) => {
//   const row = grdMain.value.getDataProvider().getJsonRow(newIndex)
//   searchParam02.CMPNY_DIV = row.CMPNY_DIV
//   searchParam02.CLSS_SEQ = row.CLSS_SEQ
//   new queryFlowHelper(vm, t)
//     .setGridList([grdSub])
//     .setQuery(searchData02)
//     .setAfter(afterSearch02)
//     .run()
// }

const searchData02 = () => {
  return commonSearchApi({
    queryId: 'SAFCE0020_SEARCH02',
    param: searchParam02,
  })
}

const afterSearch02 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//점검항목 조회관련 로직 끝

//저장관련 로직 시작
const beforeSave = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      YEAR: data.YEAR,
      WEEK: data.WEEK,
      CLSS_SEQ: data.CLSS_SEQ,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFCE0020_SAVE01',
    list: saveParam,
  })
}

const afterSave = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//저장관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV,
      YEAR: data.YEAR,
      WEEK: data.WEEK,
      CLSS_SEQ: data.CLSS_SEQ,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFCE0020_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//점검계획 돋보기 셀 클릭 이벤트
const onCellClicked = (grid, clickData) => {
  // console.log('clickData', clickData)

  if(clickData.cellType === 'data') {
    if (clickData.fieldName === 'OPEN') {
      // clickRowNumber.value = clickData.itemIndex //클릭한 로우의 행번호를 저장함
      sAFCE0020Popup.value.openPopup(grdMain.value.getDataProvider().getJsonRow(clickData.dataRow))
    }

    const row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    searchParam02.CMPNY_DIV = row.CMPNY_DIV
    searchParam02.CLSS_SEQ = row.CLSS_SEQ
    new queryFlowHelper(vm, t)
      .setGridList([grdSub])
      .setQuery(searchData02)
      .setAfter(afterSearch02)
      .run()
  }
}
const selectedData = (val) => {
  let CLSS_TITLE = ''
  let CLSS_SEQ = ''
  for (let i = 0; i < val.length; i++) {
    CLSS_TITLE += val[i].CLSS_TITLE
    CLSS_SEQ += val[i].CLSS_SEQ
  }

  // console.log('val', val)
  // console.log('CLSS_TITLE', CLSS_TITLE)
  // console.log('CLSS_SEQ', CLSS_SEQ)
  // console.log('grdMain.value.getGridView()', grdMain.value.getGridView().getCurrent())

  const dataRowIdx = grdMain.value.getGridView().getCurrent().dataRow
  const itemIdx = grdMain.value.getGridView().getCurrent().itemIndex

  grdMain.value.getDataProvider().setValue(dataRowIdx, 'CLSS_TITLE', CLSS_TITLE)
  grdMain.value.getDataProvider().setValue(dataRowIdx, 'CLSS_SEQ', CLSS_SEQ)
  grdMain.value.getGridView().checkItem(itemIdx) //자식행 체크

  const row = grdMain.value.getDataProvider().getJsonRow(dataRowIdx)
  searchParam02.CMPNY_DIV = row.CMPNY_DIV
  searchParam02.CLSS_SEQ = row.CLSS_SEQ
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData02)
    .setAfter(afterSearch02)
    .run()
}

//주차가져오는 함수
const getWeek = () => {
  const toDay = new Date()
  const yearStart = new Date(toDay.getFullYear(), 0, 1)
  const diff = toDay - yearStart
  const weekNumber = Math.ceil(diff / (1000 * 60 * 60 * 24) / 7)
  return weekNumber //현재년도의 1월1일을 기준으로 오늘이 몇주차인지 반환
}

watch(
  () => searchParam01.WEEK_FROM,
  (newValue, oldValue) => {
    if (Number(newValue) > Number(searchParam01.WEEK_TO)) {
      Message.warn(t('주차의 끝보다 큰 값은 입력할 수 없습니다.'))
      searchParam01.WEEK_FROM = ''
      return false
    }
    if (Number(newValue) > 53) {
      Message.warn(t('53주차보다 큰값은 입력 할 수 없습니다.'))
      searchParam01.WEEK_FROM = ''
      return false
    }
  }
)

watch(
  () => searchParam01.WEEK_TO,
  (newValue, oldValue) => {
    if (Number(newValue) > 53) {
      Message.warn(t('53주차보다 큰값은 입력 할 수 없습니다.'))
      searchParam01.WEEK_TO = ''
      return false
    }
  }
)

watch(
  () => searchParam01.YEAR,
  (newValue, oldValue) => {
    let newValueLength = newValue.length
    if (newValueLength > 4) {
      Message.warn(t('올바른 년도을 입력해주세요'))
      searchParam01.YEAR = ''
      return false
    }
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :use-permission="false"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParam01.YEAR"
            :label="$t('년도')"
            width="200px"
            required
            label-width="30px"
            type="YEAR"
          ></i-select>
          <i-input
            v-model="searchParam01.WEEK_FROM"
            class="mr-1"
            :label="$t('주차')"
            width="150px"
            required
          ></i-input>
          <span class="mt-2">~</span>
          <i-input v-model="searchParam01.WEEK_TO" class="ml-1" width="120px"></i-input>
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="50%" class="pa-0 h-auto mr-3">
            <IGridTitle :title="$t('점검계획')" />
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onCellClicked"
              >
              <!-- @onCurrentRowChanged="onCurrRowChanged" -->
            </RealGrid>
          </v-sheet>
          <v-sheet width="50%" class="pa-0 h-auto">
            <IGridTitle :title="$t('점검항목')"> </IGridTitle>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <SAFCE0020Popup ref="sAFCE0020Popup" @selectedData="selectedData"></SAFCE0020Popup>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
