<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useMenuStore } from '@hiway/stores/menu'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import { isEmpty } from '@/@core/utils'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import OPRAE0010Popup01 from './OPRAE0010Popup01.vue'
defineOptions({
  name: '80_operation-OPR_A-OPRAE0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const oPRAE0010Popup01 = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const empPopup = ref(null)

const saveParams = ref([])
const subSaveParams = ref([])

// 메인 그리드 focus 데이터
const focusedRow = ref(null)

const addRowIndex = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  PGM_ID: '',
  EMP_NO: '',
})

let korean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  keys: ['EMP_NO', 'IP_ADD'],
  fields: [
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '60',
      header: { text: t('사번'), styleName: 'header_validit' },
      editable: false,
      editor: { textCase: 'upper', type: 'line', ignoreCharacters: 'ㄱ-힣', maxLength: 7 },
      required: true,
      requiredMessage: '[사번]은 필수입니다.',
      styleCallback: function (grid, dataCell) {
        const ret = { editable: false, styleName: 'center-column' }
        // let rowData = grid.getJsonRow(dataCell.index.dataRow)
        let newRow = grdMain.value.getDataProvider().getRowState(dataCell.index.dataRow)

        /* ******************** 새로 추가한 row만 수정 가능 **********************/
        if (newRow === 'created') {
          ret.editable = true
          ret.styleName = 'center-column editable_column'
        }
        return ret
      },
    },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    {
      fieldName: 'IP_ADD',
      dataType: 'text',
      header: { text: t('IP주소'), styleName: 'header_validit' },
      editable: false,
      required: true,
      requiredMessage: '[IP주소]는 필수입니다.',
      editor: { type: 'line', ignoreCharacters: 'ㄱ-힣A-Za-z', maxLength: 15 },
      styleCallback: function (grid, dataCell) {
        const ret = { editable: false, styleName: 'center-column' }
        let newRow = grdMain.value.getDataProvider().getRowState(dataCell.index.dataRow)

        /* ******************** 새로 추가한 row만 수정 가능 **********************/
        if (newRow === 'created') {
          ret.editable = true
          ret.styleName = 'center-column editable_column'
        }
        return ret
      },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '130',
      header: { text: t('소속') },
      editable: false,
      styleName: 'left-column',
    },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, styleName: 'left-column editable_column' },

    // 저장, 삭제시 필요 데이터
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false },
    { fieldName: 'CHK', dataType: 'text', header: { text: t('CHK') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') }, visible: false },
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  keys: ['PGM_ID'],
  fields: [
    {
      fieldName: 'PGM_ID',
      dataType: 'text',
      width: '50',
      header: { text: t('화면ID'), styleName: 'header_validit' },
      editable: false,
      styleName: 'left-column',
      editor: { textCase: 'upper', type: 'line', ignoreCharacters: 'ㄱ-힣', maxLength: 9 },
      required: true,
      requiredMessage: '[화면ID]는 필수입니다.',
      styleCallback: function (grid, dataCell) {
        const ret = { editable: false, styleName: 'center-column' }
        let newRow = grdSub.value.getDataProvider().getRowState(dataCell.index.dataRow)

        /* ******************** 새로 추가한 row만 수정 가능 **********************/
        if (newRow === 'created') {
          ret.editable = true
          ret.styleName = 'center-column editable_column'
        }
        return ret
      },
    },
    {
      fieldName: 'PGM_NM',
      dataType: 'text',
      header: { text: t('화면명') },
      editable: false,
      styleName: 'left-column',
      lookupDisplay: true,
    },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, styleName: 'left-column editable_column' },

    // 저장, 삭제시 필요 데이터
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('EMP_NO') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

/* ********* 전체조회 ********** */
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
  }
}

/* ********* 메인 그리드 조회 ********** */
const mainBtnClick = (btn) => {
  if (btn.id === 'btnCreate') {
    addRow('main')
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(mainSaveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(mainDeleteData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }
}

/* ********* 서브 그리드 조회 ********** */
const subBtnClick = (btn) => {
  if (btn.id === 'btnCreate') {
    addRow('sub')
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(subCheck)
      .setQuery(subSaveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(subCheck)
      .setQuery(subDeleteData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }
}

const rowChanged = async (grid, oldIdx, newIdx) => {
  if (newIdx === -1) {
    return
  }
  let rowData = await grdMain.value.getDataProvider().getJsonRow(newIdx)
  let newRow = await grdMain.value.getDataProvider().getRowState(newIdx)

  // /* ******************** 새로 추가한 row만 수정 가능 **********************/
  // let EMP_NO = { name: 'EMP_NO' }
  // let IP_ADD = { name: 'IP_ADD' }
  // if(newRow === 'created'){
  //   EMP_NO.editable = true
  //   IP_ADD.editable = true
  // } else {
  //   EMP_NO.editable = false
  //   IP_ADD.editable = false
  // }
  // grdMain.value.getGridView().setColumn(EMP_NO)
  // grdMain.value.getGridView().setColumn(IP_ADD)

  /* ****************************** subGrid 조회 *******************************/
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(() => {
      return commonSearchApi({ queryId: 'OPRAE0010_SEARCH_02', param: rowData })
    })
    .setAfter((res) => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
    .run()

  focusedRow.value = rowData
}

const rowChangedSub = async (grid, oldIdx, newIdx) => {
  if (newIdx === -1) {
    return
  }
  let newRow = await grdSub.value.getDataProvider().getRowState(newIdx)

  /* ******************** 새로 추가한 row만 수정 가능 **********************/
  let PGM_ID = { name: 'PGM_ID' }
  if (newRow === 'created') {
    PGM_ID.editable = true
  } else {
    PGM_ID.editable = false
  }
  grdSub.value.getGridView().setColumn(PGM_ID)
}

const onEditRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  let fieldName = grid.getColumn(field).fieldName
  if (field === 0) {
    grid.commit()
    let newRow = grdMain.value.getDataProvider().getRowState(dataRow)
    let rowData = grdMain.value.getDataProvider().getJsonRow(dataRow)

    if (newRow === 'created' && rowData.EMP_NO) {
      // addRowIndex.value = dataRow
      // empPopup.value.openPopup(rowData)
      const param = {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        EMP_NO: newValue,
      }

      /* ******************************** 사원검색 *********************************/
      commonSearchApi({ queryId: 'searchUserInfo', param: param }).then((res) => {
        if (res.ORESULT_CUR.length === 0) {
          Message.warn(t('일치하는 사원이 없습니다.'))

          /* ******************** cell data 초기화 및 focus **********************/
          grdMain.value.getDataProvider().setValue(dataRow, fieldName, null)
          grdMain.value.getDataProvider().setValue(dataRow, 'EMP_NM', null)
          grdMain.value.getDataProvider().setValue(dataRow, 'ASGN_NM', null)
          grdMain.value.getGridView().showEditor()

          return false
        }
        grdMain.value.getDataProvider().setValue(dataRow, 'CMPNY_DIV', res.ORESULT_CUR[0].CMPNY_DIV)
        grdMain.value.getDataProvider().setValue(dataRow, 'EMP_NM', res.ORESULT_CUR[0].EMP_NM)
        grdMain.value.getDataProvider().setValue(dataRow, 'ASGN_NM', res.ORESULT_CUR[0].ASGN_FULL_NM)
      })
    }
  }

  if (fieldName === 'PGM_ID') {
    const pgmNm = codeList.menu.find((item) => item.COD === newValue)?.TXT
    grid.setValue(dataRow, 'PGM_NM', isEmpty(pgmNm) ? newValue : pgmNm)
  }
}

// 인원 조회 팝업 선택
const onEmpSelected = (val) => {
  grdMain.value.getDataProvider().setValue(addRowIndex.value, 'EMP_NM', val.EMP_NM)
  grdMain.value.getDataProvider().setValue(addRowIndex.value, 'CMPNY_DIV', val.CMPNY_DIV)
  grdMain.value.getDataProvider().setValue(addRowIndex.value, 'ASGN_NM', val.ASGN_NM)
}

const searchData = () => {
  return commonSearchApi({ queryId: 'OPRAE0010_SEARCH_01', param: searchParams }) // 메인그리드 조회
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const addRow = async (gbn) => {
  if (gbn === 'main') {
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
    })
  } else {
    /* ************************ 저장된 메인그리드 row만 화면ID 등록가능 ************************* */
    let mainFocusRowIdx = await grdMain.value.getGridView().getSelectedRows()
    let mainRow = await grdMain.value.getDataProvider().getJsonRow(mainFocusRowIdx)

    if (mainRow.SAVE_YN !== 'Y') {
      Message.warn(t('등록대상을 저장 후 추가 해 주세요.'))

      return false
    }
    oPRAE0010Popup01.value.openPopup()
    //grdSub.value.addRow({})
  }
}

// 메인 저장,삭제전 사용자 정의 validation
const mainCheck = async () => {
  saveParams.value = []
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  } else {
    chekedRow.forEach((val) => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      if (!data.ASGN_NM) {
        Message.warn(t('소속된 사원이 아닙니다.'))

        return false
      }
      data.USER_ID = userStore.userId
      saveParams.value.push(data)
    })

    return true
  }
}

// 메인 저장
const mainSaveData = () => {
  return commonExecuteApi({ queryId: 'OPRAE0010_SAVE_01', list: saveParams.value })
}

// 메인 삭제
const mainDeleteData = () => {
  return commonExecuteApi({ queryId: 'OPRAE0010_DELETE_01', list: saveParams.value })
}

// 서브 저장,삭제전 사용자 정의 validation
const subCheck = async () => {
  subSaveParams.value = []
  let chekedRow = await grdSub.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  } else {
    chekedRow.forEach((val) => {
      let data = grdSub.value.getDataProvider().getJsonRow(val)
      data.USER_ID = userStore.userId
      data.EMP_NO = focusedRow.value.EMP_NO
      data.CMPNY_DIV = focusedRow.value.CMPNY_DIV
      subSaveParams.value.push(data)
    })

    return true
  }
}

// 서브 저장
const subSaveData = () => {
  return commonExecuteApi({ queryId: 'OPRAE0010_SAVE_02', list: subSaveParams.value })
}

// 서브 삭제
const subDeleteData = () => {
  return commonExecuteApi({ queryId: 'OPRAE0010_DELETE_02', list: subSaveParams.value })
}

const pgmIdChange = async (e) => {
  searchParams.PGM_ID = await e.toUpperCase()
  searchParams.PGM_ID = await searchParams.PGM_ID.replace(korean, '')
  if (korean.test(e)) {
    Message.warn(t('영어와 숫자만 입력 가능합니다.'))
  }
}

const empNoChange = async (e) => {
  searchParams.EMP_NO = await e.toUpperCase()
  searchParams.EMP_NO = await searchParams.EMP_NO.replace(korean, '')
  if (korean.test(e)) {
    Message.warn(t('영어와 숫자만 입력 가능합니다.'))
  }
}

const menuStore = useMenuStore()

const codeList = reactive({
  menu: [],
})

const initCodeList = () => {
  codeList.menu = menuStore.menus.map(({ menu_id: COD, mnu_nm: TXT }) => ({ COD, TXT }))

  grdSub.value.setBindingColumn('PGM_NM', codeList.menu, 'COD', 'TXT')
}

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
  onButtonsClick({ id: 'btnSearch' })
})

const upperCase = (e) => {
  // console.log(' E : ', e)
}

const selectedMenu = (val) => {
  val.forEach((x) => {
    let addRowData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      PGM_ID: x.menu_id,
      PGM_NM: x.mnu_nm,
    }
    grdSub.value.addRow(addRowData)
  })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('화면ID')"
            labelWidth="50px"
            v-model="searchParams.PGM_ID"
            hide-details
            @update:modelValue="pgmIdChange"
            @keydown.enter="
              () => {
                onButtonsClick({ id: 'btnSearch' })
              }
            "
            width="250px"
          />

          <i-input
            :label="$t('사번')"
            labelWidth="50px"
            v-model="searchParams.EMP_NO"
            hide-details
            maxlength="7"
            @update:modelValue="empNoChange"
            @keydown.enter="
              () => {
                onButtonsClick({ id: 'btnSearch' })
              }
            "
            width="250px"
          />
        </v-sheet>

        <div class="h-grow">
          <v-sheet class="h-auto mr-2" width="60%">
            <IGridTitle
              :title="$t('화면별 사용자 IP 권한 목록')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
              @click-button="mainBtnClick"
            />
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCurrentRowChanged="rowChanged"
              @onEditRowChanged="onEditRowChanged"
            />
          </v-sheet>
          <v-sheet class="h-auto" width="40%">
            <IGridTitle
              :title="$t('')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
              @click-button="subBtnClick"
            />
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              @onCurrentRowChanged="rowChangedSub"
              @onEditRowChanged="onEditRowChanged"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <!-- 인원조회팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    <OPRAE0010Popup01 ref="oPRAE0010Popup01" @selected="selectedMenu"></OPRAE0010Popup01>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
