<!--
  화면명 : 협력사 안전 관리자 경력조회 tab01
  화면개요 : 협력사 안전 관리자 경력조회 및 수정
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'

defineOptions({
  name: '30_safety-SAF_I-SAFID0010_TAB01',
})

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const menuTitle = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: '',
  EMP_NO: '',
  BSNS_NM: '',
  BSNS_CD: '',
  BIRTH_DAY: '',
  ENT_DATE: '',
  DEPT_NM: '',
  DEPT_CD: '',
  ASGN_NM: '',
  ASGN_CD: '',
  KOR_NM: '',
  TEL_NO: '',
  START_DATE: '',
  END_DATE: '',
}) 

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_NAME', dataType: 'text', width: '120', header: { text: t('사업부') }, styleName: 'left-column editable_column', width : '100' },
    { fieldName: 'DEPT_NAME', dataType: 'text', width: '120', header: { text: t('소속') }, styleName: 'left-column editable_column', width : '150' } ,
    { fieldName: 'VEND_NAME', dataType: 'text', width: '30', header: { text: t('협력사명') }, styleName: 'left-column editable_column', width : '100' },
    { fieldName: 'START_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '30', header: { text: t('시작일') }, styleName: 'editable_column', width : '100', 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      }
    },
    { fieldName: 'END_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '30', header: { text: t('종료일') }, styleName: 'editable_column', width : '100',
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      }
    },
    { fieldName: 'CAREER', dataType: 'text', width: '30', header: { text: t('경력(근무일수)') }, width : '100' },
    { fieldName: 'MOVE_DIV', dataType: 'text', width: '30', header: { text: t('이직구분') }, styleName: 'editable_column', width : '60',
      editor: { type: 'dropdown' }, lookupDisplay: true
    },
    { fieldName: 'REMARK', dataType: 'text', width: '100', header: { text: t('비고') }, styleName: 'editable_column', width : '150' },

    { fieldName: 'CAREER_DAYS', dataType: 'text', width: '120', header: { text: t('CAREER_DAYS') }, visible : false },
    { fieldName: 'CHK', dataType: 'text', width: '120', header: { text: t('CHK') }, visible : false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '120', header: { text: t('회사구분') }, visible : false },
    { fieldName: 'GBN', dataType: 'text', width: '120', header: { text: t('구분') }, visible : false  },
    { fieldName: 'EMP_NO', dataType: 'text', width: '120', header: { text: t('사번') }, visible : false  },
    { fieldName: 'SEQ', dataType: 'text', width: '120', header: { text: t('SEQ') }, visible : false  },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const parsingDate = (date) => {
  if(date == null) return ''
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2) // 월은 0부터 시작하므로 1을 더하고, 두 자리로 표현하기 위해 slice 사용
  var day = ('0' + date.getDate()).slice(-2) // 일도 두 자리로 표현하기 위해 slice 사용

  return '' + year + month + day
}

const getCode = () => {
  Promise.all([
       commonSearchApi({ queryId : 'DATBA0010_SEARCH_COMMONCODE', param : { CMPNY_DIV: userStore.cmpnyDiv, ALL_SYS_CD: 'HHIZH60020', USE_FLAG:'Y' } }), // 부서
    ]).then(res => {
      
      grdMain.value.setBindingColumn('MOVE_DIV', res[0].ORESULT_CUR, 'COD', 'TXT') 
  })
}

// 상단 버튼 클릭
const onButtonsClick = (btn) => {

  if(searchParams.CMPNY_DIV == '' || searchParams.EMP_NO == '') {
    Message.warn(t('안전관리자를 선택하십시오.'))
    return
  }

  if(btn.id === 'btnCreate') {
    grdMain.value.addRow({
      CMPNY_DIV: searchParams.CMPNY_DIV,
      EMP_NO: searchParams.EMP_NO,
      SEQ: '9999',
      BSNS_NAME: searchParams.BSNS_NM,
      DEPT_NAME: searchParams.DEPT_NM,
      VEND_NAME: searchParams.ASGN_NM,
      START_DATE: '',
      END_DATE: '',
      MOVE_DIV: '',
      REMARK: '',
      GBN: 'A',
      USER_ID: userStore.userId,
    })
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.END_DATE != null && data.MOVE_DIV == null) {
      Message.warn(t('종료일은 반드시 이직 구분이 입력되어야 합니다.'))
      return false
    }
  }
  return true
}
 
// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.EMP_NO = searchParams.EMP_NO
    data.START_DATE = parsingDate(data.START_DATE)
    data.END_DATE = parsingDate(data.END_DATE)
    saveParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'SAFID0010_SAVE_02', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => {
  searchGridData()
  Message.success(t('성공적으로 저장되었습니다'))
}

/* ******************* 삭제 ******************** */
const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'SAFID0010_DELETE_02', list: saveParams })
}

const afterDelete = () => {
  searchGridData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

const searchData = (userData) => {
  searchParams.CMPNY_DIV = userData.CMPNY_DIV
  searchParams.EMP_NO = userData.EMP_NO
  searchParams.BSNS_NM = userData.BSNS_NM
  searchParams.BSNS_CD = userData.BSNS_CD
  searchParams.BIRTH_DAY = userData.BIRTH_DAY
  searchParams.ENT_DATE = userData.ENT_DATE
  searchParams.DEPT_NM = userData.DEPT_NM
  searchParams.DEPT_CD = userData.DEPT_CD
  searchParams.ASGN_NM = userData.ASGN_NM
  searchParams.ASGN_CD = userData.ASGN_CD
  searchParams.KOR_NM = userData.KOR_NM
  searchParams.TEL_NO = userData.TEL_NO

  searchGridData()
}

const searchGridData = () => {
  grdMain.value.getDataProvider().setRows([])
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

const searchMainData = () => {
  return commonSearchApi({ queryId : 'SAFID0010_SEARCH_02', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

defineExpose({
  searchData,
})

onMounted(() => {
  getCode()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 상단 제목 및 버튼-->
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :title="$t('경력관리')"
        :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
        hiddenManuel
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="h-grow">
        <v-sheet class="h-auto mr-2" width="100%">
          <RealGrid
            ref="grdMain"
            style="height: 100%;"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
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
  // height: calc(100vh - 180px);
  height: 25vh;
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 100%;
  }
}
</style>