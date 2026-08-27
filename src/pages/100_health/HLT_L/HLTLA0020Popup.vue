<!-- HLTLA0010 감염병 관리기준 -->
<!-- SI2팀 손상규 2025-03-27 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'

let dialog = ref(false)
const emit = defineEmits(['upData'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const infecEmpPopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const selectedData = ref(null)

//권한
const isAdmin = ref(false)

const popupInfecNm = ref('')
const popupContactNm = ref('')
const popupInfecSeq = ref('')
const popupContactSeq = ref('')
// 조회조건
const searchParams = reactive({
  CONTACT_EMP_NO : '',
  INFEC_SEQ: '',
  CONTACT_SEQ: '',
  INFEC_NM: ''
})

const selectParams = reactive({
  column: '',
  columnValue: ''
})
const codeList = reactive({
  conStat: [
    { COD: 'A', TXT: '검사대기' },
    { COD: 'B', TXT: '검사중' },
    { COD: 'C', TXT: '격리중' },
    { COD: 'D', TXT: '종결' }
  ],
  resultList: [
    { COD: 'A', TXT: '검사 중' },
    { COD: 'B', TXT: '확진(양성)' },
    { COD: 'C', TXT: '음성' }
  ],
  columnList: [
    { COD: 'LAST_CNT_DT', TXT: '마지막 접촉일' },
    { COD: 'FST_DT', TXT: '검사일자(1차)' },
    { COD: 'FST_RESULT', TXT: '검사결과(1차)' },
    { COD: 'SND_DT', TXT: '검사일자(2차)' },
    { COD: 'SND_RESULT', TXT: '검사결과(2차)' },
    { COD: 'QUAR_DT', TXT: '격리종료일' },
    { COD: 'CON_DESC', TXT: '접촉내용' },
  ]
})

const selectedEmp = val => {
  grdMain.value.getDataProvider().setValue(selectedData.value, 'CMPNY_DIV', val.CMPNY_DIV)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'BSNS_CD', val.BSNS_CD)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'DEPT_CD', val.DEPT_CD)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'ASGN_CD', val.ASGN_CD)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'EMP_NO', val.EMP_NO)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'KOR_NM', val.EMP_NM)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'JOB_TIT_NM', val.JOB_TIT_NM)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'BIRTH_DAY', val.BIRTH_DAY)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'HND_PHN', val.HND_PHN)
  grdMain.value.getGridView().checkItem(selectedData.value, true)
}

const initCodeList = () => {
  console.log(searchParams)
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: '',
        USE_DIV: 'Y',
      },
    }),
    getCodeList('HHII840B'),
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV: 'Y' }
    }), // 협력사
    getCodeList('HHII840A1'),
    getCodeList('HHII840A2'),
    getCodeList('HHII840A3'),
    getCodeList('HHII840A4'),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR  
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.deptCd = res[2].ORESULT_CUR
    codeList.contactCls = res[3].ORESULT_CUR
    codeList.asgnCd = res[4].ORESULT_CUR

    codeList.INFEC1 = res[5].ORESULT_CUR  
    codeList.INFEC2 = res[6].ORESULT_CUR  
    codeList.INFEC3 = res[7].ORESULT_CUR  
    codeList.INFEC4 = res[8].ORESULT_CUR 

    codeList.allInfec = [
      ...codeList.INFEC1,
      ...codeList.INFEC2,
      ...codeList.INFEC3,
      ...codeList.INFEC4
    ];
    grdMain.value.setBindingColumn('INFEC_NM', codeList.allInfec, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CMPNY_DIV', codeList.company, 'COD', 'TXT')
    grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnsCd, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.deptCd, 'DEPT_CD', 'DEPT_NM')
    grdMain.value.setBindingColumn('ASGN_CD', codeList.asgnCd, 'ASGN_CD', 'ASGN_NM')
    grdMain.value.setBindingColumn('CONTACT_CLS', codeList.contactCls, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CON_STAT', codeList.conStat, 'COD', 'TXT')
    grdMain.value.setBindingColumn('FST_RESULT', codeList.resultList, 'COD', 'TXT')
    grdMain.value.setBindingColumn('SND_RESULT', codeList.resultList, 'COD', 'TXT')

    if( useLogsStore().isMenuAdmin === 'Y' ) {
      isAdmin.value = true
    }
    else {
      isAdmin.value = false
    }

    grdMain.value.getGridView().setColumnProperty('CONTACT_CLS', 'editable', isAdmin.value);
    grdMain.value.getGridView().setColumnProperty('CON_STAT', 'editable', isAdmin.value);
    grdMain.value.getGridView().setColumnProperty('ACT_GUIDE', 'editable', isAdmin.value);
    grdMain.value.getGridView().setColumnProperty('CONTACT_CLS', 'styleName', isAdmin.value ? 'editable_column center-column' : 'center-column');
    grdMain.value.getGridView().setColumnProperty('CON_STAT', 'styleName', isAdmin.value ? 'editable_column center-column' : 'center-column');
    grdMain.value.getGridView().setColumnProperty('ACT_GUIDE', 'styleName', isAdmin.value ? 'editable_column center-column' : 'center-column');
  })

  
  // 인원팝업 
  document.addEventListener("click", (event) => {
    if (event.target.closest(".popup-search-icon")) {
      const index = event.target.closest(".popup-search-icon").dataset.index;
      selectedData.value = index  // 인덱스를 이용하여 데이터 가져오기
      if (selectedData.value && isAdmin.value) {
        infecEmpPopup.value.openPopup({})
      } else if (selectedData.value && !isAdmin.value) { 
        infecEmpPopup.value.openPopup({
          CMPNY_DIV_D: true,
          USER_DIV_D: true,
          BSNS_CD_D: true,
          DEPT_CD_D: true,
          BSNS_CD: userStore.bsnsCd,
          DEPT_CD: userStore.deptCd
        })
      }
    }
  });
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields: [ 
    { fieldName: 'CMPNY_DIV', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('회사') }, editable: false, lookupDisplay: true },
    { fieldName: 'BSNS_CD', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('회사') }, editable: false, lookupDisplay: true },
    { fieldName: 'DEPT_CD', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('부서') }, editable: false, lookupDisplay: true },
    { fieldName: 'ASGN_CD', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('협력사') }, editable: false, lookupDisplay: true },
    { fieldName: 'EMP_NO', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('사번') }, editable: false },
    {
      fieldName: 'KOR_NM', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('이름'), styleName: 'header_validit' }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'SAVE_YN')
          if (value == 'Y') {
            return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
              <pre>${cell.value ?? ''}</pre>
            </div>
          `;
          } else { 
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;"> 
                <pre>${cell.value ?? ''}</pre>
                <i class="mdi mdi-magnify popup-search-icon" data-index="${cell.index.itemIndex}"></i>
              </div>
            `;
          }
        }
      }
    },
    { fieldName: 'JOB_TIT_NM', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('직급') }, editable: false },
    { fieldName: 'BIRTH_DAY', width: '100', styleName: ' center-column', dataType: 'text', header: { text: t('생년월일') }, editable: false },
    { fieldName: 'HND_PHN', width: '120', styleName: 'center-column', dataType: 'text', header: { text: t('연락처') }, editable: false },
    { fieldName: 'INFEC_NM', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('감염병 종류') }, editable: false, lookupDisplay: true },
    { fieldName: 'CONTACT_NM', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('접촉 확진자') }, editable: false },
    {
      fieldName: 'LAST_CNT_DT', width: '120', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('마지막 접촉일'), styleName: 'header_validit' },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'CONTACT_CLS', width: '150', styleName: 'center-column', dataType: 'text', header: { text: t('접촉 분류'), styleName: 'header_validit' }, lookupDisplay: true, editable: false,
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      }
    },
    {
      fieldName: 'FST_DT', width: '100', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('검사일자') },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'FST_RESULT', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('검사결과') }, lookupDisplay: true,
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 3, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      }
    },
    {
      fieldName: 'SND_DT', width: '100', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('검사일자') },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'SND_RESULT', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('검사결과') }, lookupDisplay: true,
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 3, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      }
    },
    { fieldName: 'CON_STAT', width: '120', styleName: 'center-column', dataType: 'text', header: { text: t('진행상태') }, lookupDisplay: true, editable: false,
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 4, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      }
    },  
    {
      fieldName: 'QUAR_DT', width: '120', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('격리 종료일') },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },
    { fieldName: 'CON_DESC', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('접촉내용') } },
    { fieldName: 'ACT_GUIDE', width: '150', styleName: 'left-column', dataType: 'text', header: { text: t('조치안내') }, editable: false, },
    { fieldName: 'INSERT_USER_ID', width: '150', styleName: 'center-column', dataType: 'text', header: { text: t('등록자') }, editable: false },
    {
      fieldName: 'INSERT_DATE', width: '100', styleName: 'center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('등록일') }, editable: false,
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },

    // 안보이는거
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('SEQ') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false, }, 
    { fieldName: 'INFEC_SEQ', dataType: 'text', header: { text: t('감염병 종류 SEQ') },visible: false, },
    { fieldName: 'CONTACT_SEQ', dataType: 'text', header: { text: t('확진자 SEQ') },visible: false, }
  ],
  columns: [],
  columnLayout: [
    'CMPNY_DIV',
    'BSNS_CD',
    'DEPT_CD',
    'ASGN_CD',
    'KOR_NM',
    'JOB_TIT_NM',
    'BIRTH_DAY',
    'HND_PHN',
    'INFEC_NM',
    'CONTACT_NM',
    'LAST_CNT_DT',
    'CONTACT_CLS',
    {
      name: '1차 검사',
      direction: 'horizontal',
      items: [ 'FST_DT', 'FST_RESULT' ],
      header: { text: t('1차 검사') },
    },
    {
      name: '2차 검사',
      direction: 'horizontal',
      items: [ 'SND_DT', 'SND_RESULT' ],
      header: { text: t('2차 검사') },
    },
    'CON_STAT',
    'QUAR_DT',
    'CON_DESC',
    'ACT_GUIDE',
    'INSERT_USER_ID',
    'INSERT_DATE'
  ],
})

grd1Props.columns = grd1Props.fields

//적용
const apply = () => {

  const chkRows = grdMain.value.getGridView().getCheckedRows()

  console.log('chkRows ', chkRows)

  if(chkRows.length == 0) {
    Message.warn(t('체크된 행이 없습니다.'))
    return false
  }

  for (let i of chkRows) {
    if (selectParams.column == 'LAST_CNT_DT') {
      grdMain.value.getDataProvider().setValue(i, 'LAST_CNT_DT', selectParams.columnValue)
    } else if (selectParams.column == 'FST_DT') { 
      grdMain.value.getDataProvider().setValue(i, 'FST_DT', selectParams.columnValue)
    } else if (selectParams.column == 'SND_DT') { 
      grdMain.value.getDataProvider().setValue(i, 'SND_DT', selectParams.columnValue)
    } else if (selectParams.column == 'FST_RESULT') { 
      grdMain.value.getDataProvider().setValue(i, 'FST_RESULT', selectParams.columnValue)
    } else if (selectParams.column == 'SND_RESULT') { 
      grdMain.value.getDataProvider().setValue(i, 'SND_RESULT', selectParams.columnValue)
    } else if (selectParams.column == 'QUAR_DT') { 
      grdMain.value.getDataProvider().setValue(i, 'QUAR_DT', selectParams.columnValue)
    } else if (selectParams.column == 'CON_DESC') { 
      grdMain.value.getDataProvider().setValue(i, 'CON_DESC', selectParams.columnValue)
    }
  }
}

// 일괄적용 초기화
watch(() => selectParams.column, (newVal, oldVal) => {
  selectParams.columnValue = ''; // 선택 컬럼이 바뀌면 값 초기화
});

//메뉴버튼
const onButtonsClick = btn => {
  
  if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      IDX_SEQ: '',
      CMPNY_DIV: '',
      BSNS_CD: '',
      DEPT_CD: '',
      EMP_NO: '',
      KOR_NM: '',
      JOB_TIT_NM: '',
      BIRTH_DAY: '',
      HND_PHN: '',
      INFEC_NM: popupInfecNm.value,
      CONTACT_NM: popupContactNm.value,
      LAST_CNT_DT: '',
      FST_DT: '',
      FST_RESULT: '',
      SND_DT: '',
      SND_RESULT: '',
      CON_STAT: '',
      QUAR_DT: '',
      CON_DESC: '',
      ACT_GUIDE: '',
      SAVE_YN: 'N',
      INFEC_SEQ: popupInfecSeq.value,
      CONTACT_SEQ: popupContactSeq.value
    }, false)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

//  조회
const searchData = () => {
  searchParams.CONTACT_SEQ = popupContactSeq.value
  searchParams.INFEC_SEQ = popupInfecSeq.value
  console.log(searchParams)
  return commonSearchApi({ queryId: 'HLTLA0020_SEARCH_02', param: searchParams })
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (isEmpty(data.KOR_NM)) {
      return Message.warn(t('이름은 필수 입력입니다.'))
    } else if (isEmpty(data.LAST_CNT_DT)) {
      return Message.warn(t('마지막 접촉일은 필수 입력입니다.'))
    } else if (isEmpty(data.CONTACT_CLS)) { 
      return Message.warn(t('접촉 분류는 필수 입력입니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  console.log(saveParams)
  return commonExecuteApi({ queryId : 'HLTLA0020_SAVE_03', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}


// 팝업
const openPopup = (popupParam) => {
  console.log("popupParam", popupParam)
  dialog.value = true
  grdMain.value.getGridView().filterPanel.visible = true

  popupInfecNm.value = popupParam.data.INFEC_NM
  popupContactNm.value = popupParam.data.KOR_NM
  popupInfecSeq.value = popupParam.data.INFEC_SEQ
  popupContactSeq.value = popupParam.data.IDX_SEQ

  searchParams.CONTACT_EMP_NO = popupParam.data.EMP_NO
  searchParams.INFEC_NM = popupParam.data.INFEC_NM

  initCodeList()
  new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
}

const closePopup = () => {
  dialog.value = false
  emit('upData')
}

defineExpose({
  openPopup
})


</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    class="p-absolute user-select-none"
    width="1500"
    height="650"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>확진자 접촉자 등록</span>
    </v-sheet>
    <v-card class="pa-3 fill-height" style="background-color: white">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnCreate', 'btnUpdate', 'btnClose']"
        @click-button="onButtonsClick"
        :hiddenManuel="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="h-auto">
          <v-row no-gutters class="pB-10">
            <i-select
              v-model="selectParams.column"
              :items="codeList.columnList"
              item-value="COD"
              item-title="TXT" 
              label-width="40px"
              width="180px"
              :clearable="true"
            />
            <template v-if="selectParams.column === 'FST_RESULT'">
              <i-select
                v-model="selectParams.columnValue"
                :items="codeList.resultList"
                item-value="COD"
                item-title="TXT"
                label-width="40px"
                width="180px"
              />
            </template>
            <template v-else-if="selectParams.column === 'SND_RESULT'">
              <i-select
                v-model="selectParams.columnValue"
                :items="codeList.resultList"
                item-value="COD"
                item-title="TXT"
                label-width="40px"
                width="180px"
              />
            </template>
            <template v-else-if="selectParams.column === 'LAST_CNT_DT'
                                ||selectParams.column === 'FST_DT'
                                ||selectParams.column === 'SND_DT'
                                ||selectParams.column === 'QUAR_DT'">
              <i-input
                v-model="selectParams.columnValue"
                type="Date"
                width="180px"
              />
            </template>

            <template v-else>
              <i-input
                v-model="selectParams.columnValue"
                type="text" 
                label-width="40px"
                width="180px"
              />
            </template> 
            <v-btn @click="apply" color="primary">
              {{ t('일괄 적용') }}
            </v-btn>
          </v-row>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup
    ref="infecEmpPopup"
    @selected="selectedEmp"
  />
  </v-dialog>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (405px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    // min-height: 700px;
  }
}

</style>