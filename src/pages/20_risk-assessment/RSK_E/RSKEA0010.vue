<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

defineOptions({
  name:'20_risk_assessment-RSK_E-RSKEA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const grdMain = ref(null)

//조회조건
let searchParams = reactive({    
  USER_KEYWORD: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : ['KEYWORD_ID'],
  fields : [ 
    { fieldName: 'USER_KEYWORD', dataType: 'text', styleName: "left-column", header: { text:'키워드명' }, editable: true, required, requiredMessage: '키워드를 입력하세요.' },
    
    // 숨기는 필드 visible:'false'
    { fieldName: 'KEYWORD_ID', dataType: 'text', visible: false },
    { fieldName: 'INS_USR', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 메뉴버튼
const onButtonsClick = btn => {

  if (btn.id === 'btnSearch') {  // 조회
    // 그리드 조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  } 
  else if (btn.id === 'btnCreate') { // 추가
    addData()
  } 
  else if (btn.id === 'btnUpdate') { // 저장
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {  // 삭제
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

/* ---------- 형태소 관리 조회 ---------- */
const searchData = () => {
  if (searchParams.USER_KEYWORD.length > 200) {
    return Message.warn(t('글자 수 200자를 넘길 수 없습니다.'))
  }

  return commonSearchApi({
    queryId : 'RSKEF0010_search01', param: searchParams,
  })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const enterSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(false)
    .run()
}

/* ---------- 그리드 셀 추가 ---------- */
const addData = () => {
  if (grdMain.value.getDataProvider().getRows().length === 0) {
    Message.warn('데이터를 조회해주세요')
  } else {
    grdMain.value.addRow({
      KEYWORD_ID: '',
      USER_KEYWORD: '',
      INS_USR : userStore.userId,
    })
  }
}


/* ------------------------ 유효성 검사 ------------------------ */
const validationCheck = () => {
  let checkRows = grdMain.value.getGridView().getCheckedRows()

  for (let rowIdx of checkRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(data.length === 0){
      Message.warn(t('선택한 데이터가 없습니다.'))

      return false
    } else {
      if (data.USER_KEYWORD.length > 200) {
        Message.warn(t('글자 수 200자를 넘길 수 없습니다.'))

        return false
      } else {
        return true
      }
    }
  }
}

/* ---------- 형태소 관리 저장 ---------- */
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(data)

  }
  
  return commonExecuteApi({ queryId : 'RSKEF0010_save01', list: saveParams })
}

/* ---------- 형태소 관리 저장 ---------- */
const deleteData = () => {

  let delParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    delParams.push(data)
  }

  return commonExecuteApi({ queryId : 'RSKEF0010_delete01', list: delParams })
}

onMounted(() => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(false)
    .run()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        title="형태소 관리"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <!-- 조회조건 -->
          <i-input
            v-model="searchParams.USER_KEYWORD"
            @keydown.enter="enterSearch"
            width="300px"
          />
        </v-sheet>
        <v-sheet>
          <IGridTitle title="형태소 사용자 키워드 관리">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: calc(100vh - 410px);"
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
  
