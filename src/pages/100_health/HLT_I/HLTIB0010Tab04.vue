<script setup>
import { ref, reactive } from 'vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import HLTIB0010Tab04_Tab01 from './HLTIB0010Tab04_Tab01.vue'
import HLTIB0010Tab04_Tab02 from './HLTIB0010Tab04_Tab02.vue'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import saveFlowHelper from '@/utils/saveFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import HLTIB0010Tab04Popup02 from './HLTIB0010Tab04Popup02.vue'
import Message from '@hiway/utils/notify'
import { useUserStore } from '@hiway/stores/user'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
const menuTitle = ref(null)
const userStore = useUserStore()
const emit = defineEmits(['btnCloseClick', 'preChangeStep'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const tab = ref('page_1')
const tab01 = ref(null)
const tab02 = ref(null)
const empPopup = ref(null)
const selectedEmpData = reactive({}) //인원팝업에서 선택한 데이터를 증상조사표 컴포넌트에 props로 내려준다.
const popup02 = ref(null)
let tabData = reactive({})

const props = defineProps({
  tab01Data: {
    type: Object,
  },
})

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID,
  ES_SEQ: props.tab01Data.ES_SEQ,
  P2_QA0_C1: '',
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnCreate') {
    let grdData = grdMain.value.getDataProvider().getJsonRows(0, -1)
    if (grdData.length > 0) {
      let saveYn = grdData.some((x) => !x.ES_SEQ)
      if (saveYn) {
        Message.warn(t('인원을 저장후 추가 해주세요.'))
        return false
      }
    }
    empPopup.value.openPopup({})
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  } else if (btn.id === 'btnPrevStep') {
    emit('preChangeStep')
  } else if (btn.id === 'btnInvComplete') {
    saveTab05()
  } else if (btn.id === 'btnTemporaryStorage') {
    saveTab04()
  } else if (btn.id === 'btnInvCompleteCancel') {
    new saveFlowHelper(vm, t)
      .setQuery(saveData03)
      .setAfter(afterSave03)
      .setConfirmMessage('조사등록취소 하시겠습니까?')
      .setResultMessage('조사등록 취소되었습니다.')
      .run()
  } else if (btn.id === 'btnImport') {
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID,
      DEPT_CD: props.tab01Data.DEPT_CD,
      BSNS_CD: props.tab01Data.BSNS_CD,
      USER_DIV: userStore.userDiv,
    }
    popup02.value.openPopup(param)
  } else {
    emit('btnCloseClick')
  }
}

const saveData03 = () => {
  let saveParam = []
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    ES_SEQ: props.tab01Data.ES_SEQ,
    WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID,
    USER_ID: userStore.userId,
  }
  saveParam.push(param)
  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_18',
    list: saveParam,
  })
}

const afterSave03 = () => {
  menuTitle.value.visibleBtn('btnInvCompleteCancel', false) //등록취소버튼 안보이기
  menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장버튼 활성화
  menuTitle.value.disableBtn('btnCreate', false) //추가버튼 활성화
  menuTitle.value.disableBtn('btnDelete', false) //삭제버튼 활성화
  menuTitle.value.disableBtn('btnInvComplete', false) //조사완료버튼 활성화
  menuTitle.value.disableBtn('btnImport', false) //불러오기버튼 활성화
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('부서명/협력사명') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'DUTY_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직무') },
    },
    {
      fieldName: 'AGE',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('연령(만)') },
    },
    {
      fieldName: 'SEX',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('성별') },
    },
    {
      fieldName: 'MRY_YN',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('결혼여부') },
    },
    {
      fieldName: 'WRK_DESC',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('현 작업내용') },
    },
    {
      fieldName: 'WRK_MNTH',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('작업기간(년-개월)') },
    },
    {
      fieldName: 'WRK_TM_HH',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('1일근무시간(HR)') },
    },
    {
      fieldName: 'WORK_STANDARD_ID',
      visible: false,
    },
    {
      fieldName: 'ES_DATE',
      visible: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
    },
    {
      fieldName: 'ES_SEQ',
      visible: false,
    },
    {
      fieldName: 'IMPORT_YN',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  if (props.tab01Data.MODIFY) {
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_07',
      param: searchParam,
    }).then((res) => {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      grdMain.value.getGridView().setCurrent(0)
    })
  }
  nextTick(() => {
    //조사완료 되었을때
    if (props.tab01Data.CLOSE_DATE) {
      menuTitle.value.disableBtn('btnTemporaryStorage', true) //임시저장버튼 비활성화
      menuTitle.value.disableBtn('btnCreate', true) //추가버튼 비활성화
      menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화
      menuTitle.value.disableBtn('btnInvComplete', true) //조사완료 버튼 비활성화
      menuTitle.value.disableBtn('btnImport', true) //불러오기 버튼 비활성화

      if (props.tab01Data.IMP_RESIST_YN === 'Y') {
        //조사완료되고,개선등록까지 완료되면 등록취소 안보이기
        menuTitle.value.visibleBtn('btnInvCompleteCancel', false) //조사완료취소버튼 안보이기
      } else {
        //조사완료지만 개선등록이 완료되지 않으면 보이기
        menuTitle.value.visibleBtn('btnInvCompleteCancel', true) //조사완료취소버튼 보이기
      }
    } else {
      //조사완료 아니면 안보이기
      menuTitle.value.visibleBtn('btnInvCompleteCancel', false) //등록취소버튼 안보이기
      menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장버튼 비활성화
      menuTitle.value.disableBtn('btnCreate', false) //추가버튼 비활성화
      menuTitle.value.disableBtn('btnDelete', false) //삭제버튼 비활성화
    }
  })
})

//임시저장 관련 로직 시작
const saveTab04 = async () => {
  let flag01Data = tab01.value.getModifyFlag()
  let flag02Data = tab02.value.getModifyFlag()
  if (flag01Data || flag02Data) {
    let result = await vm.$swal({
      title: `변경된 내용이 있습니다.
                저장 하시겠습니까?`,
      showCancelButton: true,
    })
    if (result.isConfirmed) {
      const tab01Data = tab01.value.saveTab01()
      const tab02Data = tab02.value.saveTab02()
      tabData = Object.assign({}, tab01Data, tab02Data) //탭1,2데이터 합치기
      //저장할때 필요한 데이터 넣어줌
      tabData.WORK_STANDARD_ID = props.tab01Data.WORK_STANDARD_ID
      tabData.ES_DATE = props.tab01Data.ES_DATE
      tabData.ES_SEQ = props.tab01Data.ES_SEQ
      new saveFlowHelper(vm, t)
        .setBefore(beforeSave01)
        .setQuery(saveData01)
        .showMessage(false)
        .setAfter(afterSave01)
        .run()
    }
  }
  //변경사항 없이 조사완료 할때
  else {
    const tab01Data = tab01.value.saveTab01()
    const tab02Data = tab02.value.saveTab02()
    tabData = Object.assign({}, tab01Data, tab02Data) //탭1,2데이터 합치기
    //저장할때 필요한 데이터 넣어줌
    tabData.WORK_STANDARD_ID = props.tab01Data.WORK_STANDARD_ID
    tabData.ES_DATE = props.tab01Data.ES_DATE
    tabData.ES_SEQ = props.tab01Data.ES_SEQ
    new saveFlowHelper(vm, t).setBefore(beforeSave01).setQuery(saveData01).setAfter(afterSave01).run()
  }
}

const beforeSave01 = () => {
  if (grdMain.value.getDataProvider().rowCount === 0) {
    Message.warn(t('인원을 추가 해주세요.'))
    return false
  }
  if (grdMain.value.getDataProvider().rowCount > 0) {
    if (!tabData.EMP_NM) {
      Message.warn(t('성명은 필수값입니다.'))
      return false
    } else if (tabData.CMPNY_YEARS === null || tabData.CMPNY_YEARS === undefined || tabData.CMPNY_YEARS === '') {
      Message.warn(t('현 직장경력_년은 필수값입니다.'))
      return false
    } else if (tabData.CMPNY_MNTH === null || tabData.CMPNY_MNTH === undefined || tabData.CMPNY_MNTH === '') {
      Message.warn(t('현 직장경력_개월은 필수값입니다.'))
      return false
    } else if (!tabData.AGE) {
      Message.warn(t('연령(만_세)는 필수값입니다.'))
      return false
    } else if (!tabData.WRK_DESC) {
      Message.warn(t('작업내용(구체적으로)는 필수값입니다.'))
      return false
    } else if (tabData.WRK_YEARS === null || tabData.WRK_YEARS === undefined || tabData.WRK_YEARS === '') {
      Message.warn(t('현 작업기간 년 은 필수값입니다.'))
      return false
    } else if (tabData.WRK_MNTH === null || tabData.WRK_MNTH === undefined || tabData.WRK_MNTH === '') {
      Message.warn(t('현 작업기간 개월째 는 필수값입니다.'))
      return false
    } else if (!tabData.WRK_TM_HH) {
      Message.warn(t('1일 근무시간은 필수값입니다.'))
      return false
    } else if (!tabData.BRK_TM_MM) {
      Message.warn(t('1일휴게시간 (분씩)은 필수값입니다.'))
      return false
    } else if (!tabData.BRK_TM_CNT) {
      Message.warn(t('1일휴게시간 회 는 필수값입니다.'))
      return false
    }
  }
  return true
}

const saveData01 = () => {
  let saveParam = []
  //과거병력유무 완치,유무에 컬럼값이 2개인데 라디오버튼이라 이렇게 처리함
  //완치에 체크시 치료나관찰중에 N
  if (tabData.P1_Q3_C7 === 'Y1') {
    tabData.P1_Q3_C8 = 'N'
    tabData.P1_Q3_C7 = 'Y'
  } else if (tabData.P1_Q3_C7 === 'Y2') {
    //치료나 관찰중에 체크시 완치에 N
    tabData.P1_Q3_C8 = 'Y'
    tabData.P1_Q3_C7 = 'N'
  } else if (tabData.P1_Q3_C8 === 'Y2') {
    tabData.P1_Q3_C8 = 'Y'
    tabData.P1_Q3_C7 = 'N'
  }
  saveParam.push(tabData)
  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_05',
    list: saveParam,
  })
}

const afterSave01 = (res) => {
  let param = {
    CMPNY_DIV: res.list[0].CMPNY_DIV,
    WORK_STANDARD_ID: res.list[0].WORK_STANDARD_ID,
    ES_SEQ: res.list[0].ES_SEQ,
  }
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_07',
    param: param,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}
//저장 관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV, //회사구분
      WORK_STANDARD_ID: data.WORK_STANDARD_ID, //작업표준ID
      ES_SEQ: data.ES_SEQ,
      ES_DATE: data.ES_DATE,
      EMP_NO: data.EMP_NO,
    }
    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'HLTIB0010_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_13',
    param: searchParam,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    if (res.ORESULT_CUR.length === 0) {
      tab01.value.initEmpData()
      tab02.value.setEmpData()
    }
    grdMain.value.getGridView().setCurrent(0)
  })
}
//삭제관련 로직 끝

//조사완료 관련 로직 시작
const saveTab05 = async () => {
  let flag01Data = tab01.value.getModifyFlag()
  let flag02Data = tab02.value.getModifyFlag()
  if (flag01Data || flag02Data) {
    let result = await vm.$swal({
      title: `변경된 내용이 있습니다.
                조사완료 하시겠습니까?`,
      showCancelButton: true,
    })
    if (result.isConfirmed) {
      const tab01Data = tab01.value.saveTab01()
      const tab02Data = tab02.value.saveTab02()
      tabData = Object.assign({}, tab01Data, tab02Data) //탭1,2데이터 합치기
      //저장할때 필요한 데이터 넣어줌
      tabData.WORK_STANDARD_ID = props.tab01Data.WORK_STANDARD_ID
      tabData.ES_DATE = props.tab01Data.ES_DATE
      tabData.ES_SEQ = props.tab01Data.ES_SEQ
      tabData.CORP_ASGN_CD = props.tab01Data.CORP_ASGN_CD
      new saveFlowHelper(vm, t)
        .setBefore(beforeSave02)
        .setQuery(saveData02)
        .showMessage(false)
        .setAfter(afterSave02)
        .run()
    }
  }
  //변경사항 없이 조사완료 할때
  else {
    const tab01Data = tab01.value.saveTab01()
    const tab02Data = tab02.value.saveTab02()
    tabData = Object.assign({}, tab01Data, tab02Data) //탭1,2데이터 합치기
    //저장할때 필요한 데이터 넣어줌
    tabData.WORK_STANDARD_ID = props.tab01Data.WORK_STANDARD_ID
    tabData.ES_DATE = props.tab01Data.ES_DATE
    tabData.ES_SEQ = props.tab01Data.ES_SEQ
    tabData.CORP_ASGN_CD = props.tab01Data.CORP_ASGN_CD
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setConfirmMessage('조사완료 하시겠습니까?')
      .setAfter(afterSave02)
      .run()
  }
}

const beforeSave02 = () => {
  if (grdMain.value.getDataProvider().rowCount > 0) {
    if (!tabData.EMP_NM) {
      Message.warn(t('성명은 필수값입니다.'))
      return false
    } else if (tabData.CMPNY_YEARS === null || tabData.CMPNY_YEARS === undefined || tabData.CMPNY_YEARS === '') {
      Message.warn(t('현 직장경력_년은 필수값입니다.'))
      return false
    } else if (tabData.CMPNY_MNTH === null || tabData.CMPNY_MNTH === undefined || tabData.CMPNY_MNTH === '') {
      Message.warn(t('현 직장경력_개월은 필수값입니다.'))
      return false
    } else if (!tabData.AGE) {
      Message.warn(t('연령(만_세)는 필수값입니다.'))
      return false
    } else if (!tabData.WRK_DESC) {
      Message.warn(t('작업내용(구체적으로)는 필수값입니다.'))
      return false
    } else if (tabData.WRK_YEARS === null || tabData.WRK_YEARS === undefined || tabData.WRK_YEARS === '') {
      Message.warn(t('현 작업기간 년 은 필수값입니다.'))
      return false
    } else if (tabData.WRK_MNTH === null || tabData.WRK_MNTH === undefined || tabData.WRK_MNTH === '') {
      Message.warn(t('현 작업기간 개월째 는 필수값입니다.'))
      return false
    } else if (!tabData.WRK_TM_HH) {
      Message.warn(t('1일 근무시간은 필수값입니다.'))
      return false
    } else if (!tabData.BRK_TM_MM) {
      Message.warn(t('1일휴게시간 (분씩)은 필수값입니다.'))
      return false
    } else if (!tabData.BRK_TM_CNT) {
      Message.warn(t('1일휴게시간 회 는 필수값입니다.'))
      return false
    }
  }
  return true
}

const saveData02 = () => {
  let saveParam = []
  //과거병력유무 완치,유무에 컬럼값이 2개인데 라디오버튼이라 이렇게 처리함
  //완치에 체크시 치료나관찰중에 N
  if (tabData.P1_Q3_C7 === 'Y1') {
    tabData.P1_Q3_C8 = 'N'
    tabData.P1_Q3_C7 = 'Y'
  } else if (tabData.P1_Q3_C7 === 'Y2') {
    //치료나 관찰중에 체크시 완치에 N
    tabData.P1_Q3_C8 = 'Y'
    tabData.P1_Q3_C7 = 'N'
  } else if (tabData.P1_Q3_C8 === 'Y2') {
    //치료나 관찰중에 체크시 완치에 N
    tabData.P1_Q3_C8 = 'Y'
    tabData.P1_Q3_C7 = 'N'
  }
  saveParam.push(tabData)
  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_08',
    list: saveParam,
  })
}

const afterSave02 = (res) => {
  let param = {
    CMPNY_DIV: res.list[0].CMPNY_DIV,
    WORK_STANDARD_ID: res.list[0].WORK_STANDARD_ID,
    ES_SEQ: res.list[0].ES_SEQ,
  }
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_07',
    param: param,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    if (props.tab01Data.MODIFY) {
      Message.success(t('저장되었습니다.'))
    }
    emit('btnCloseClick')
  })
}
//조사완료 관련 로직 끝

const selectedEmp = (val) => {
  Object.assign(selectedEmpData, val)
  let selectedEmp = {
    ASGN_NM: val.ASGN_NM,
    EMP_NM: val.EMP_NM,
    EMP_NO: val.EMP_NO,
    DUTY_NM: val.JOB_ROW_NM,
    AGE: val.AGE,
    SEX: val.SEX,
    MRY_YN: val.MARR_YN,
    CMPNY_DIV: val.CMPNY_DIV,
  }
  grdMain.value.addRow(selectedEmp, false)
  tab01.value.setEmpData(selectedEmpData)
  tab02.value.setEmpData()
}

//행변경 이벤트
const rowChanged = async (grid, oldRow, newRow) => {
  let rowData = await grdMain.value.getDataProvider().getJsonRow(newRow)
  let grdData = grdMain.value.getDataProvider().getJsonRows(0, -1)
  if (grdData.length > 0) {
    let saveYn = grdData.some((x) => !x.ES_SEQ)
    if (saveYn && !rowData.IMPORT_YN) {
      //불러오기로 인원 추가할때는 안타도록
      Message.warn(t('인원 저장후 행변경을 해주세요.'))
      return false
    }
  }
  if (newRow === -1) {
    return false
  }

  //저장된 인원이다.
  if (rowData.ES_SEQ) {
    let param = {
      CMPNY_DIV: rowData.CMPNY_DIV,
      WORK_STANDARD_ID: rowData.WORK_STANDARD_ID,
      ES_SEQ: rowData.ES_SEQ,
      ES_DATE: rowData.ES_DATE,
      EMP_NO: rowData.EMP_NO,
    }
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_14',
      param: param,
    }).then((res) => {
      tab01.value.setFieldTab01(res.ORESULT_CUR[0])
      tab02.value.setFieldTab02(res.ORESULT_CUR[0])
      Object.keys(selectedEmpData).forEach((key) => {
        delete selectedEmpData[key]
      })
      Object.assign(selectedEmpData, rowData)
    })
  }
}

const importData = (data) => {
  let param = {
    CMPNY_DIV: data.CMPNY_DIV,
    WORK_STANDARD_ID: data.WORK_STANDARD_ID,
    ES_DATE: data.ES_DATE,
    EMP_NO: data.EMP_NO,
    ES_SEQ: data.ES_SEQ,
  }
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_20',
    param: param,
  }).then((res) => {
    res.ORESULT_CUR[0].IMPORT_YN = 'Y'
    grdMain.value.addRow(res.ORESULT_CUR[0], false)
  })
}

// onUnmounted(() => {
//   menuTitle.value.disableBtn('btnInvComplete', false)
// })

defineExpose({
  saveTab04,
  saveTab05,
})
</script>

<template>
  <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move">
    <span>증상조사표 목록</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <IGridTitle
      :button-list="[
        'btnPrevStep',
        'btnTemporaryStorage',
        'btnCreate',
        'btnDelete',
        'btnImport',
        'btnInvComplete',
        'btnInvCompleteCancel',
        'btnClose',
      ]"
      @click-button="onButtonsClick"
      class="mt-2 mr-2"
      ref="menuTitle"
      :use-permission="false"
    ></IGridTitle>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet>
          <v-sheet class="pa-0" style="height: 300px">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCurrentRowChanged="rowChanged"
            />
          </v-sheet>
          <div class="gridTitle mt-3 ml-3">
            근골격계 부담작업 증상 조사표 :{{ selectedEmpData.EMP_NM }}({{ selectedEmpData.EMP_NO }})
          </div>
          <v-tabs v-model="tab">
            <v-tab value="page_1">증상 조사표 1/2 페이지</v-tab>
            <v-tab value="page_2">증상 조사표 2/2 페이지</v-tab>
          </v-tabs>
          <v-window v-model="tab">
            <v-window-item eager value="page_1">
              <HLTIB0010Tab04_Tab01
                ref="tab01"
                :selected-emp-data="selectedEmpData"
                :tab01-data="props.tab01Data"
              ></HLTIB0010Tab04_Tab01>
            </v-window-item>
            <v-window-item eager value="page_2">
              <HLTIB0010Tab04_Tab02 ref="tab02"></HLTIB0010Tab04_Tab02>
            </v-window-item>
          </v-window>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="selectedEmp"></EmpPopup>
  <HLTIB0010Tab04Popup02 @import-data="importData" ref="popup02" />
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
