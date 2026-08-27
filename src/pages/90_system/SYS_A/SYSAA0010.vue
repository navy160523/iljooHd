<!-- 
  * Vue 내 용 : 시스템코드 관리
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/29
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/29 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

defineOptions({
  name: '90_system-SYS_A-SYSAA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)

const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  keys: ['ALL_SYS_CD', 'SYS_CD'],
  fields: [
    {
      fieldName: 'SYS_CD',
      dataType: 'text',
      width: '120',
      requiredMessage: '[시스템 코드]은 필수입니다.',
      header: { text: t('시스템 코드'), styleName: 'header_validit' },
      styleName: 'left-column',
      width: '100',
    },
    {
      fieldName: 'SYS_CDNM',
      dataType: 'text',
      width: '120',
      requiredMessage: '[코드명]은 필수입니다.',
      header: { text: t('코드명'), styleName: 'header_validit' },
      styleName: 'left-column',
      width: '170',
    },
    {
      fieldName: 'CODE_CNT',
      dataType: 'text',
      width: '30',
      header: { text: t('단축 카운트') },
      styleName: 'right-column',
      width: '40',
    },
    {
      fieldName: 'CODE_SHORTNM',
      dataType: 'text',
      width: '103',
      header: { text: t('단축 코드명') },
      styleName: 'left-column',
      width: '60',
    },
    {
      fieldName: 'CODE_DESC1',
      dataType: 'text',
      width: '120',
      header: { text: t('코드설명1') },
      styleName: 'left-column',
      width: '100',
    },
    {
      fieldName: 'CODE_DESC2',
      dataType: 'text',
      width: '120',
      header: { text: t('코드설명2') },
      styleName: 'left-column',
      width: '100',
    },
    {
      fieldName: 'CODE_DESC3',
      dataType: 'text',
      width: '120',
      header: { text: t('코드설명3') },
      styleName: 'left-column',
      width: '100',
    },
    {
      fieldName: 'CODE_DESC4',
      dataType: 'text',
      width: '120',
      header: { text: t('코드설명4') },
      styleName: 'left-column',
      width: '100',
    },
    {
      fieldName: 'CODE_DESC5',
      dataType: 'text',
      width: '120',
      header: { text: t('코드설명5') },
      styleName: 'left-column',
      width: '100',
    },
    {
      fieldName: 'CODE_DESC6',
      dataType: 'text',
      width: '120',
      header: { text: t('코드설명6') },
      styleName: 'left-column',
      width: '100',
    },
    {
      fieldName: 'USE_FLAG',
      dataType: 'text',
      width: '50',
      header: { text: t('사용여부') },
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      width: '50',
    },
    {
      fieldName: 'ORDER_NUM',
      dataType: 'number',
      width: '50',
      numberFormat: '####',
      styleName: 'right-column',
      header: { text: t('정렬순서') },
      width: '50',
    },
    {
      fieldName: 'DEFAULT_FLAG',
      dataType: 'text',
      width: '120',
      header: { text: t('기본값') },
      width: '40',
    },

    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      width: '120',
      header: { text: t('SAVE_YN') },
      visible: false,
    },
    {
      fieldName: 'CHK',
      dataType: 'text',
      width: '120',
      header: { text: t('CHK') },
      visible: false,
    },
    {
      fieldName: 'VIEW_INDEX',
      dataType: 'text',
      width: '120',
      header: { text: t('VIEW_INDEX') },
      visible: false,
    },
    {
      fieldName: 'ALL_SYS_CD',
      dataType: 'text',
      width: '120',
      header: { text: t('ALL_SYS_CD') },
      visible: false,
    },
    {
      fieldName: 'ALL_UP_CD',
      dataType: 'text',
      width: '120',
      header: { text: t('ALL_UP_CD') },
      visible: false,
    },
    {
      fieldName: 'UP_CD',
      dataType: 'text',
      width: '120',
      header: { text: t('UP_CD') },
      visible: false,
    },
    {
      fieldName: 'TREE_SRT',
      dataType: 'text',
      width: '120',
      header: { text: t('TREE_SRT') },
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  vm.$nextTick(() => {
    grdMain.value.getGridView().filterPanel.visible = true
    // onButtonsClick({ id :'btnSearch' })
  })
})

//버튼 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === 'btnExpand') {
    grdMain.value.getGridView().expandAll()
  } else if (btn.id === 'btnCollapse') {
    grdMain.value.getGridView().collapseAll()
  } else if (btn.id === 'btnSearch') {
    searchData()
  } else if (btn.id === 'btnCreate') {
    addCode()
  } else if (btn.id === 'btnAddChild') {
    addChildCode()
  } else if (btn.id === 'btnUpdate') {
    saveData()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  }
}

//DB 조회
const searchMainData = () => {
  let searchParam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    ALL_SYS_CD: '',
  }

  return commonSearchApi({ queryId: 'SYSAA0010_SEARCH_01', param: searchParam })
}

//조회 후 반영
const afterMainSearch = (res) => {
  // console.log('res ', res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, 'TREE_SRT')

  // grdMain.value.getGridView().orderBy(['ORDER_NUM'],['ascending'])

  // grdMain.value.getGridView().expandAll()
}

//조회 함수
const searchData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

//DB 삭제
const deleteMainData = () => {
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if (deleteRows.length === 0) return

  let deleteList = []
  for (let i = 0; i < deleteRows.length; i++) {
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(deleteRows[i])
    if (grdJsonRow.SAVE_YN === 'Y') {
      grdJsonRow.CMPNY_DIV = userStore.cmpnyDiv
      deleteList.push(grdJsonRow)
    }
  }

  return commonExecuteApi({ queryId: 'SYSAA0010_DELETE_01', list: deleteList })
}

//삭제 후 그리드 삭제
const afterCloseDelete = (res) => {
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if (deleteRows.length === 0) return

  grdMain.value.getDataProvider().removeRows(deleteRows)
}

//트리 값 삭제
const deleteData = () => {
  new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setConfirmMessage(
      '삭제시 데이터 베이스에서도 바로 삭제됩니다. 진행하시겠습니까?'
    )
    .setQuery(deleteMainData)
    .setAfter(afterCloseDelete)
    .run()
}

//저장 데이터 확인
const validationChk = () => {
  let saveRows = grdMain.value.getGridView().getCheckedRows(true)
  if (saveRows.length === 0) return false

  let dataRows = grdMain.value.getDataProvider().getJsonRows()
  let checkSys = []
  dataRows.forEach((row) => {
    if (checkSys.includes(row.ALL_SYS_CD)) {
      Message.warn(
        t(row.SYS_CDNM + '의 코드가 중복값입니다. 코드값을 수정해 주세요.')
      )

      return false
    } else {
      checkSys.push(row.ALL_SYS_CD)
    }
  })

  for (let i = 0; i < saveRows.length; i++) {
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(saveRows[i])
    if (grdJsonRow.SYS_CD === '' || grdJsonRow.SYS_CDNM === '') {
      Message.warn(t('필수값(시스템 코드, 코드명)을 입력해 주세요.'))

      return false
    }
  }

  return true
}

//DB 저장
const saveMainData = () => {
  let saveRows = grdMain.value.getGridView().getCheckedRows(true)
  if (saveRows.length === 0) return

  let saveList = []
  for (let i = 0; i < saveRows.length; i++) {
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(saveRows[i])
    grdJsonRow.CMPNY_DIV = userStore.cmpnyDiv
    grdJsonRow.USER_ID = userStore.userId
    saveList.push(grdJsonRow)
  }

  console.log('saveMainData : ', saveList)

  return commonExecuteApi({ queryId: 'SYSAA0010_SAVE_01', list: saveList })
}

//저장 후 처리
const afterSaveMainData = () => {
  let saveRows = grdMain.value.getGridView().getCheckedRows(true)

  saveRows.forEach((element) => {
    grdMain.value.getGridView().checkRow(element, false, false, false)
  })
}

//저장
const saveData = () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setBefore(validationChk)
    .setQuery(saveMainData)
    .setAfter(afterSaveMainData)
    .run()
}

//노드 추가(하위 레벨)
const addChildCode = async () => {
  let gridView = grdMain.value.getGridView()
  let currentRowIdx = gridView.getCurrent().dataRow
  let getTreeData = grdMain.value.getDataProvider()
  let currentRow = getTreeData.getJsonRow(currentRowIdx)

  // if(getTreeData.getAncestors(currentRowIdx).length > 2){
  //   Message.warn(t('4레벨을 초과하는 항목은 추가할 수 없습니다.'))

  //   return
  // }

  console.log('[addChildCode] SYS_CD : ', currentRow.SYS_CD)

  let newRow = {
    ALL_SYS_CD: currentRow.ALL_SYS_CD,
    ALL_UP_CD: currentRow.ALL_SYS_CD,
    CODE_DESC1: '',
    CODE_DESC2: '',
    CODE_DESC3: '',
    CODE_DESC4: '',
    CODE_DESC5: '',
    CODE_DESC6: '',
    CODE_SHORTNM: '',
    DEFAULT_FLAG: '',
    ORDER_NUM: '',
    SAVE_YN: '',
    SYS_CD: '',
    SYS_CDNM: '',
    UP_CD: currentRow.SYS_CD,
    USE_FLAG: 'Y',
    VIEW_INDEX: '',
  }

  let addRowIdx = getTreeData.addChildRow(currentRowIdx, newRow, -1, false)
  gridView.expand(gridView.getCurrent().itemIndex, true, true)
  gridView.setCurrent({ dataRow: addRowIdx, column: 'SYS_CD' })
  gridView.checkRow(addRowIdx, true, false, false)
}

//노드 추가(동일 레벨)
const addCode = () => {
  let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow

  if (currentRowIdx < 2) {
    Message.warn(t('해당 레벨의 항목은 추가할 수 없습니다.'))

    return
  }
  let gridView = grdMain.value.getGridView()
  let getTreeData = grdMain.value.getDataProvider()
  let parentRow = getTreeData.getParent(currentRowIdx)
  let currentRow = getTreeData.getJsonRow(currentRowIdx)

  console.log('[addCode] parentRow = ', parentRow)
  console.log('[addCode] currentRow = ', currentRow)

  let newRow = {
    ALL_SYS_CD: currentRow.ALL_UP_CD,
    ALL_UP_CD: currentRow.ALL_UP_CD,
    CODE_DESC1: '',
    CODE_DESC2: '',
    CODE_DESC3: '',
    CODE_DESC4: '',
    CODE_DESC5: '',
    CODE_DESC6: '',
    CODE_SHORTNM: '',
    DEFAULT_FLAG: '',
    ORDER_NUM: '',
    SAVE_YN: '',
    SYS_CD: '',
    SYS_CDNM: '',
    UP_CD: currentRow.UP_CD,
    USE_FLAG: 'Y',
    VIEW_INDEX: '',
  }
  let addRowIdx = getTreeData.addChildRow(parentRow, newRow, null, false)

  console.log('[addCode] newRow = ', newRow)

  grdMain.value
    .getGridView()
    .setCurrent({ dataRow: addRowIdx, column: 'SYS_CD' })
  gridView.checkRow(addRowIdx, true, false, false)
}

//트리 값 변경 이벤트
const editRowChanged = (
  grid,
  itemIndex,
  dataRow,
  field,
  oldValue,
  newValue
) => {
  let changedRow = grdMain.value.getDataProvider().getJsonRow(dataRow)
  if (field === 0 && changedRow.SAVE_YN === 'Y') {
    Message.warn(t('이미 저장된 코드는 수정할 수 없습니다.'))

    grdMain.value.getDataProvider().setValue(dataRow, 'SYS_CD', oldValue)
  } else if (field === 0 && changedRow.SAVE_YN != 'Y') {
    grdMain.value.getGridView().commit()
    grdMain.value
      .getDataProvider()
      .setValue(dataRow, 'ALL_SYS_CD', changedRow.ALL_SYS_CD + newValue)
  }
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnExpand',
          'btnCollapse',
          'btnSearch',
          'btnCreate',
          'btnAddChild',
          'btnUpdate',
          'btnDelete',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet height="100%">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            is-tree
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @on-edit-row-changed="editRowChanged"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
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
