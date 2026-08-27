<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'80_operation-OPR_A-OPRAD0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)

const saveParams= ref([])

const codeList = reactive({
  BSNSList: [
    { BSNS_CD: '' ,BSNS_NM: '전체' },
  ],
  JBGBNList: [],

  // RadioGroup set
  OUT_YNList: [
    { TXT: '전체', COD: '' },
    { TXT: '직영', COD: 'N' },
    { TXT: '협력사', COD: 'Y' },
  ],
  PROD_DIVList: [
    { TXT: '전체', COD: '' },
    { TXT: '생산', COD: 'Y' },
    { TXT: '비생산', COD: 'N' },
  ],
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  USER_DIV : 'A',                 // 협력사 구분 ( '': 전체, 'N': 직영, 'Y': 협력사 )
  PROD_DIV : '',                  // 생산/비생산 구분 ( '': 전체, 'Y': 생산, 'N': 비생산 )
  OUT_YN: 'N',
  ASGN_CD: userStore.asgnCd,
  JB_GUBUN: '%',                       // 구분
})

//안전권한 이외 사업부 선택 불가
const readOnlyValue = reactive({
  BSNS_NO : true // 사업부 구분

})

//코드리스트 셋팅
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ commonSearchApi({ queryId : 'searchBSNS', param }) , getCodeList('HHIZJB_GUBUN')]).then(res => {
    res[0].ORESULT_CUR.forEach( value => {
      codeList.BSNSList.push(value) 
    })
    codeList.JBGBNList = res[1].ORESULT_CUR

  }).finally(() => {
    grdMain.value.setBindingColumn("BSNS_CD", codeList.BSNSList, "BSNS_CD", "BSNS_NM")   // 사업부 lookup set
    grdMain.value.setBindingColumn("JB_GUBUN", codeList.JBGBNList, "COD", "TXT")   // 구분 lookup set
    codeList.JBGBNList.unshift({ TXT:"전체", COD:"%" })
  })

}

//2024-09-26 사업부 조회조건 추가(안전직원만 사업부 변경 가능)
const checkGroup = () => {
  if (userStore.authGrpCd.includes('GRP00381') || userStore.authGrpCd.includes('HIWAYGRP00001')) {
    readOnlyValue.BSNS_NO = false
  }
}

// autoFilter: true   <<<< 필터링

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 } , checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['BSNS_CD', 'ASGN_CD' , 'ASGN_DESC'],
  fields : [ 
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, width: '200', styleName: 'left-column',
      lookupDisplay: true, mergeRule: { "criteria": "value" }, editable: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('코드') }, mergeRule: { "criteria": "value" }, editable: false, width: '150' },
    { fieldName: 'ASGN_DESC', dataType: 'text', width: '250', header: { text: t('부서명/협력사명') }, 
      editable: false, styleName: 'left-column', mergeRule: { "criteria": "value" } },
    { fieldName: 'JB_GUBUN', dataType: 'text', header: { text: t('구분'), styleName: 'header_validit' }, lookupDisplay: true, width: '200', required: true, requiredMessage: '[구분]은 필수입니다.',
      editor: { type: 'dropdown', dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, width: '150', editable: false },
    { fieldName: 'EMP_NM', dataType: 'text', width: '100', header: { text: t('성명') }, editable: false, styleName: 'left-column' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, width: '150', editable: false, styleName: 'left-column' },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('사내전화번호') }, width: '150', editable: false, styleName: 'left-column' },
    { fieldName: 'UPDATE_DT', dataType: 'text', header: { text: t('등록(변경)일') }, width: '150', editable: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, width: '250', styleName: 'left-column', editor: { type: "text", maxLength: 300 } },
    { fieldName: 'ORI_ASGN_NM', dataType: 'text', header: { text: t('원소속부서') }, width: '250', editable: false, styleName: 'left-column' },

    // 저장, 삭제시 필요 데이터
    { fieldName: 'ORI_ASGN_CD', dataType: 'text', header: { text: t('원소속부서코드') }, visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false },
    { fieldName: 'SEQ_NO', dataType: 'text', header: { text: t('SEQ_NO') }, visible: false },
    { fieldName: 'YN_OUT', dataType: 'text', header: { text: t('YN_OUT') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') }, visible: false },
    { fieldName: 'IP_ADDRESS', dataType: 'text', header: { text: t('IP_ADDRESS') }, visible: false },
  ],
  columns : [],
  columnLayout: [
    'BSNS_CD',
    {
      name: '부서/협력사',
      direction: 'horizontal',
      items: [ 'ASGN_CD', 'ASGN_DESC' ],
      header: { text: t('부서/협력사') },
    },
    {
      name: '담당자',
      direction: 'horizontal',
      items: [ 'JB_GUBUN', 'EMP_NO' , 'EMP_NM', 'JOB_TIT_NM', 'TEL_NO', 'UPDATE_DT', 'REMARK', 'ORI_ASGN_NM' ],
      header: { text: t('담당자') },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const onCellEdited = (grid, itemIndex, row, field) => {
  let fieldName = grdMain.value.getGridView().getColumn(field).name
  //console.log('fieldName', fieldName)

  // 구분이 변경되었을 때
  if(fieldName === 'JB_GUBUN') {    
    let data = grdMain.value.getDataProvider().getJsonRow(row)
    //console.log('data', data.YN_OUT)
    if(data.YN_OUT === 'Y') {
      // 협력사 조직일 때
      if(data.JB_GUBUN === '4') {
        // 세잎클로버를 선택할 경우
        Message.warn(t('세잎클로버는 직영조직에서만 선택가능합니다.'))
        grdMain.value.getDataProvider().setValue(row, 'JB_GUBUN', '') //빈칸으로 설정
      }
      else if(data.JB_GUBUN === '3') {
        // 서무를 선택할 경우
        Message.warn(t('서무는 직영조직에서만 선택가능합니다.'))
        grdMain.value.getDataProvider().setValue(row, 'JB_GUBUN', '') //빈칸으로 설정
      }
    } else {
      // 직영 조직일 때
      if(data.JB_GUBUN === '5') {
        // 협력사 관리감독자를 선택할 경우
        Message.warn(t('협력사 관리감독자는 협력사조직에서만 선택가능합니다.'))
        grdMain.value.getDataProvider().setValue(row, 'JB_GUBUN', '') //빈칸으로 설정
      }

    }
  }
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btn.id === 'btnCreate'){
    addRow()
  } else if(btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'OPRAD0020_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장, 삭제전 사용자 정의 validation
const validationCheck = async () => {
  saveParams.value = []
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  } else {
    chekedRow.forEach(async val => {
      let data = await grdMain.value.getDataProvider().getJsonRow(val)
      // let state = await grdMain.value.getDataProvider().getRowState(val)
      
      data.USER_ID = userStore.userId
      data.SAVE_YN = 'Y'
      saveParams.value.push(data)
      
    })

    return true
  }
}

// 저장, 삭제전 사용자 정의 validation
const beforeDelete = async () => {
  saveParams.value = []
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  } else {
    chekedRow.forEach(async val => {
      let data = await grdMain.value.getDataProvider().getJsonRow(val)
      let state = await grdMain.value.getDataProvider().getRowState(val)
      
      if(state == 'created'){
        data.SAVE_YN = 'N'
        // data.SEQ_NO = ''
        // data.IP_ADDRESS = ''
      }else {
        data.SAVE_YN = 'Y'
      }

      data.USER_ID = userStore.userId
      saveParams.value.push(data)
      
    })

    return true
  }
}

// 저장
const saveData = () => {
  // commonExecuteApi({ queryId : 'OPRAD0020_SAVE_01', list: saveParams.value })
  return commonRequest("/hse/operation/OPRAD0020_SAVE_01", { queryId: "OPRAD0020_SAVE_01", list: saveParams.value })
}

const deleteData = () => {
  // commonExecuteApi({ queryId : 'OPRAD0020_DELETE_01', list: saveParams.value })
  return commonRequest("/hse/operation/OPRAD0020_DELETE_01", { queryId: "OPRAD0020_DELETE_01", list: saveParams.value })
}

const addRow = e => {
  const rowIdx = grdMain.value.getGridView().getCurrent().dataRow

  /* ********** 포커스가 있을시 인원조회 팝업 호출 ************* */
  if(rowIdx === -1){
    Message.err(t('포커스된 데이터가 없습니다.'))

    return
  }
  const focusData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  // 추가시 필터중인 컬럼 클리어
  grdMainProps.fields.forEach(async item => {
    await grdMain.value.getGridView().clearColumnFilters(item.fieldName)
  })

  /* ********** ADMIN만 전체 사업부, 부서 수정가능, 이외는 접속자의 부서/협력사만 가능 ************* */
  if(!userStore.authGrpCd[0] === 'HIWAYGRP00001' && ( searchParams.CMPNY_DIV !== focusData.CMPNY_DIV ||
      searchParams.BSNS_CD !== focusData.BSNS_CD || searchParams.ASGN_CD !== focusData.ASGN_CD )){
    Message.err(t('접속자의 부서/협력사 정보만 저장/삭제 할 수 있습니다.'))
  }

  let popupParam = {
    CMPNY_DIV : focusData.CMPNY_DIV,
    BSNS_CD : focusData.BSNS_CD,
    DEPT_CD : focusData.YN_OUT === 'Y' ? userStore.deptCd : focusData.ASGN_CD,
    ASGN_CD : focusData.YN_OUT === 'Y' ? focusData.ASGN_CD : '',
    ASGN_DESC: focusData.ASGN_DESC,
    EMP_NO : '',
    EMP_NM : '',
    YN_OUT : focusData.YN_OUT, // 부서/담당자 등록 시 협력사인지 체크
    IS_SEARCH: true,
    IS_OPRAD0020 : true,
    DISABLE: []
  }

  if(focusData.YN_OUT === 'N'){
    popupParam.DISABLE = ['전체','사내협력사','단기공사']
  }else if(focusData.YN_OUT === 'Y'){
    popupParam.DISABLE = ['전체','직영','단기공사']
  }
  empPopup.value.openPopup(popupParam)
}

// 인원 조회 팝업 선택
const onEmpSelected = val => {
  if(!val){
    return
  }

  let addRowData = null
  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  let focusData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  if(focusData.ASGN_CD === null){
    addRowData = {
      BSNS_CD: val.CMPNY_DIV,
      ASGN_CD: val.BSNS_CD,
      ASGN_DESC: ASGN_NM,
      JB_GUBUN: null,
      EMP_NO: val.EMP_NO,
      EMP_NM: val.EMP_NM,
      JOB_TIT_NM: val.JOB_TIT_NM,
      TEL_NO: val.TEL_NO,
      UPDATE_DT: null,
      REMARK: null,
      ORI_ASGN_NM: val.USER_DIV === 'A' ? val.DEPT_NM : val.ASGN_NM ,
      ORI_ASGN_CD: val.USER_DIV === 'A' ? val.DEPT_CD : val.ASGN_CD ,
      YN_OUT: val.USER_DIV === 'A' ? 'N' : 'Y' ,
    }
  } else {
    addRowData = {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: focusData.BSNS_CD,
      ASGN_CD: focusData.ASGN_CD,
      ASGN_DESC: focusData.ASGN_DESC,
      // BSNS_CD: val.BSNS_CD,
      // ASGN_CD: val.ASGN_CD,
      // ASGN_DESC: val.ASGN_DESC,
      JB_GUBUN: null,
      EMP_NO: val.EMP_NO,
      EMP_NM: val.EMP_NM,
      JOB_TIT_NM: val.JOB_TIT_NM,
      TEL_NO: val.TEL_NO,
      UPDATE_DT: null,
      REMARK: null,
      ORI_ASGN_NM: val.USER_DIV === 'A' ? val.DEPT_NM : val.ASGN_NM ,
      ORI_ASGN_CD: val.USER_DIV === 'A' ? val.DEPT_CD : val.ASGN_CD ,
      YN_OUT: val.USER_DIV === 'A' ? 'N' : 'Y' ,
    }
  }
  grdMain.value.addRow(addRowData)
}

const resetGrid = e => {
  onButtonsClick({ id: 'btnSearch' })
}

onMounted(() => {
  initCodeList()
  checkGroup()
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('사업부')"
            labelWidth="60px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNSList"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            @update:modelValue="resetGrid"
            width="300px"
            :disabled="readOnlyValue.BSNS_NO"
          />

          <div class="d-flex align-center">
            <div class="formLabelText mr-5">
              {{ $t('조직구분') }}
            </div>
            <VRadioGroup
              v-model="searchParams.OUT_YN"
              inline
              @change="resetGrid"
            >
              <VRadio
                v-for="(item , i) in codeList.OUT_YNList"
                :key="i"
                :value="item.COD"
                :label="item.TXT"
              />
            </VRadioGroup>
          </div>

          <div class="d-flex align-center pl-8 pr-8">
            <div class="formLabelText mr-5">
              {{ $t('생산/비생산') }}
            </div>
            <VRadioGroup
              v-model="searchParams.PROD_DIV"
              inline
              @change="resetGrid"
            >
              <VRadio
                v-for="(item , i) in codeList.PROD_DIVList"
                :key="i"
                :value="item.COD"
                :label="item.TXT" 
              />
            </VRadioGroup>
          </div>

          <i-select
            :label="$t('구분')"
            labelWidth="60px"
            v-model="searchParams.JB_GUBUN"
            :items="codeList.JBGBNList"
            item-value="COD"
            item-title="TXT"
            @update:modelValue="resetGrid"
            width="300px"
          />

          
          <div class="d-flex align-center">
            <h3 style="color:#1E82FF">※인원 추가 시 추가하실 부서/협력사명을 먼저 선택하여 주시기 바랍니다.</h3> 
          </div>


        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellEdited="onCellEdited"
          />

        </v-sheet>
      </div>
    </v-card-text>
    <!-- 인원조회팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
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
