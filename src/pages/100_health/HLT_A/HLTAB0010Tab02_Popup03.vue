<!--
  화면명 : 보건위험성 보정
  화면개요 : 보건위험성 보정 > 근골
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  YEAR: '',
  GBN_NO: '',
  PROCESS_CD: '',
  COMBO_LIST: [],
  NO_ADJUST: '',
  ADJUST_YN: 'Y',
  STATUS_DESC: '',
  STATUS: ''
})

const codeList = reactive({
  ES_DIV: [
    { COD : 'A1', TXT: '정기'},
    { COD : 'A2', TXT: '수시'},
  ],
  BODY_CD: [],
  PROCESS_CD: [
  ],
  STATUS: [ 
    { COD: '0', TXT: '보정 필요', DESC: '공정별 위험성 보정이 필요합니다. "세부 보정"을 클릭해 주세요.'},
    { COD: '1', TXT: '보정 진행 중', DESC: '공정별 위험성 보정이 진행 중입니다. "세부 보정"을 클릭해 계속 진행해주세요. '},
    { COD: '2', TXT: '보정 완료', DESC: '공정별 위험성 보정이 완료되었습니다.'}
  ] 
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'ES_DATE', width: '80', editable: false, dataType: 'text', header: { text: t('조사일자') }, },
    { fieldName: 'ES_DIV', width: '80', editable: false, dataType: 'text', header: { text: t('조사 구분') }, lookupDisplay: true },
    { fieldName: 'ASGN_NM', width: '80', editable: false, dataType: 'text', header: { text: t('부서/협력사명') }, },
    { fieldName: 'SAGO_EMP_NM', width: '50', editable: false, dataType: 'text', header: { text: t('대상자') }, },
    { fieldName: 'JOB_TIT_NM', width: '50', editable: false, dataType: 'text', header: { text: t('직위') }, },
    { fieldName: 'SAGO_DUTY_NM', width: '60', editable: false, dataType: 'text', header: { text: t('직종') }, },
    { fieldName: 'SAGO_BODY_CD', width: '60', editable: false, dataType: 'text', header: { text: t('신체부위') }, lookupDisplay: true },
    { fieldName: 'ES_STUS', width: '60', editable: false, dataType: 'text', header: { text: t('조사등록') }, },
    { fieldName: 'WORK_STANDARD_NO', width: '80', editable: false, dataType: 'text', header: { text: t('작업표준번호') }, },
    { fieldName: 'WORK_STANDARD_NM', width: '80', editable: false, dataType: 'text', header: { text: t('작업표준명') },},
    { fieldName: 'ES_EMP_NM', width: '50', editable: false, dataType: 'text', header: { text: t('조사자') },  },
    { fieldName: 'PROCESS_CD', width: '80', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t('보정대상 직무선택') }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXCLUDED', width: '40', editable: false, dataType: 'boolean', renderer: { type: "check" }, styleName: 'editable_column change_back_check', header: { text: t('보정 제외') }, },
    { fieldName: 'EXCLUDED_REASON', width: '100', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t('제외 사유') }, },
    { fieldName: 'ADJUST_USER', width: '80', editable: false, dataType: 'text', header: { text: t('보정자') },
      mergeRule: { criteria: 'value' },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<p style="text-align:center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${isEmpty(cell.value) ? ' ': cell.value.replaceAll('&lt;br&gt;', '<br>')}</p>`
          return str
        },
      }
    },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, visible: false },
    { fieldName: 'DISEASE_CD', dataType: 'text', header: { text: t('상병코드') }, visible: false },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('상태') }, visible: false },
    { fieldName: 'GBN_NO', dataType: 'text', header: { text: t('상태') }, visible: false },
  
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (params) => {
  searchParams.BSNS_CD = params.BSNS_CD
  searchParams.DEPT_CD = params.DEPT_CD
  searchParams.ASGN_CD = params.ASGN_CD
  searchParams.YEAR = params.YEAR
  searchParams.COMBO_LIST = params.COMBO_LIST
  searchParams.GBN_NO = params.GBN_NO
  searchParams.STATUS = params.STATUS
  codeList.PROCESS_CD = []

  if(searchParams.STATUS == '2') {
    menuTitle.value.disableBtn('btnConfirm', true)
    menuTitle.value.disableBtn('btnCancelConfirm', false)
    searchParams.ADJUST_YN = 'N'
  } else {
    menuTitle.value.disableBtn('btnConfirm', false)
    menuTitle.value.disableBtn('btnCancelConfirm', true)
    searchParams.ADJUST_YN = 'Y'
  }
  for(let c in searchParams.COMBO_LIST) {
    for(let cd of searchParams.COMBO_LIST[c]) {
      if(!codeList.PROCESS_CD.includes(cd)) {
        codeList.PROCESS_CD.push(cd)
      }
    }
  }
  grdMain.value.getDataProvider().setRows([])
  Promise.all([
    // 신체부위
    getCodeList('HHII820D'),
  ]).then(res => {
    codeList.BODY_CD = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('PROCESS_CD', codeList.PROCESS_CD, 'COD', 'TXT') 
    grdMain.value.setBindingColumn('SAGO_BODY_CD', codeList.BODY_CD, 'COD', 'TXT') 
    grdMain.value.setBindingColumn('ES_DIV', codeList.ES_DIV, 'COD', 'TXT')
    onButtonsClick({ id: 'btnSearch' })
  })
  
  dialog.value = true
}

const closePopup = () => {
  emit('after-search')
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnConfirm') {
    if(grdMain.value.getDataProvider().getJsonRows().length == 0) {
      return Message.warn(t('확정할 대상자가 없습니다.'))
    }
    new saveFlowHelper(vm, t)
      .setConfirmMessage(t('확정 하시겠습니까?'))
      .setBefore(beforeConfirm)
      .setQuery(confirmData)
      .setAfter(afterConfirmData)
      .run()
  } else if (btn.id === 'btnCancelConfirm') {
    if(grdMain.value.getDataProvider().getJsonRows().length == 0) {
      return Message.warn(t('확정 취소할 대상자가 없습니다.'))
    }
    new saveFlowHelper(vm, t)
      .setConfirmMessage(t('확정취소 하시겠습니까?'))
      .setQuery(cancelData)
      .setAfter(afterCancelData)
      .run()
  }
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAB0010_SEARCH_06', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if(res.ORESULT_CUR2.length == 1) {
    let val = codeList.STATUS.find(item => item.COD == res.ORESULT_CUR2[0].STATUS)

    searchParams.STATUS = val.TXT
    searchParams.STATUS_DESC = val.DESC
    searchParams.NO_ADJUST = res.ORESULT_CUR2[0].NO_ADJUST + '명'
  }
  searchParams.NO_ADJUST = grdMain.value.getDataProvider().getJsonRows().filter(item => isEmpty(item.PROCESS_CD) && !item.EXCLUDED).length + '명'
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(!data.EXCLUDED && isEmpty(data.PROCESS_CD)){
      return Message.warn(t('공정을 선택하셔야 합니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
 
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let prcNm = searchParams.COMBO_LIST['C'].find(item => item.COD == data.PROCESS_CD) 
    if(!isEmpty(prcNm)) {
      data.PROCESS_NM = prcNm.TXT
    }
    if(isEmpty(data.STATUS)) {
      data.STATUS = '1'
    }
    data.ADJUST_USER = userStore.userName
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTAB0010_SAVE_02', list: saveParams })
}

const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  getData()
}

const beforeConfirm = () => {
  if(searchParams.NO_ADJUST.replaceAll('명','') != '0') {
    return Message.warn(t('미보정 유소견자 수가 존재합니다.'))
  }
  return true
}

const confirmData = () => {
  let saveParams = []
 
  for (let data of grdMain.value.getGridView().getJsonRows()) {
    let prcNm = searchParams.COMBO_LIST['C'].find(item => item.COD == data.PROCESS_CD) 
    if(!isEmpty(prcNm)) {
      data.PROCESS_NM = prcNm.TXT
    }
    data.STATUS = '2'
    data.ADJUST_USER = data.ADJUST_USER = `${userStore.userName} ${userStore.jobTitNm} <br>${dayjs().format('YYYY.MM.DD')}`
    saveParams.push(data)
  }
  return Promise.all([
    commonExecuteApi({ queryId : 'HLTAB0010_SAVE_02', list: saveParams }),
    commonExecuteApi({ queryId : 'HLTAB0010_SAVE_03', list: [searchParams] })
  ]).then(res => {
    getData()
  })
}

const afterConfirmData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  menuTitle.value.disableBtn('btnConfirm', true)
  menuTitle.value.disableBtn('btnCancelConfirm', false)
  searchParams.ADJUST_YN = 'N'
}

const cancelData = () => {
  let saveParams = []
 
  for (let data of grdMain.value.getGridView().getJsonRows()) {
    let prcNm = searchParams.COMBO_LIST['C'].find(item => item.COD == data.PROCESS_CD) 
    if(!isEmpty(prcNm)) {
      data.PROCESS_NM = prcNm.TXT
    }
    data.STATUS = '1'
    data.ADJUST_USER = ''
    saveParams.push(data)
  }
  return Promise.all([
    commonExecuteApi({ queryId : 'HLTAB0010_SAVE_02', list: saveParams }),
    commonExecuteApi({ queryId : 'HLTAB0010_SAVE_03', list: [searchParams] })
  ]).then(res => {
    getData()
  })
}

const afterCancelData = () => {
  Message.success(t('성공적으로 취소되었습니다'))
  menuTitle.value.disableBtn('btnConfirm', false)
  menuTitle.value.disableBtn('btnCancelConfirm', true)
  serachParams.ADJUST_YN = 'Y'
}

const onEditCommit = async (grid, index, oldValue, newValue) => {
  await nextTick()
  searchParams.NO_ADJUST = grdMain.value.getDataProvider().getJsonRows().filter(item => isEmpty(item.PROCESS_CD) && !item.EXCLUDED).length + '명'
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1600"
    height="700"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    > 
      <span>보건 위험성 보정[근골격계 부담수준]</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="$t('수시유해요인조사 보정대상 직무 선택')"
          :button-list="['btnConfirm', 'btnCancelConfirm', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 320px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onEditCommit="onEditCommit"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
      <v-sheet class="ma-4 mt-0 pt-0 searchArea">
        <div class="d-flex mt-2">
          <i-input
            :label="$t('위험성 보정 진행상태')"
            width="350px" 
            label-width="150px"
            v-model="searchParams.STATUS"
            readonly
          ></i-input> 
          <i-input
            width="500px" 
            v-model="searchParams.STATUS_DESC"
            readonly
          ></i-input>
        </div>
        <i-input
          :label="$t('위험성 미보정 유소견자 수')"
          class="mt-2"
          width="350px" 
          label-width="150px"
          v-model="searchParams.NO_ADJUST"
          readonly
        ></i-input>
        <div class="mt-2"> 
          위험성 보정 기준 : 공정 내 직업병 유소견자 미발생 - 단계 유지 / 1명 이상 2명 이하 발생 - 위험성 +1 단계 / 3명 이상 발생 - 위험성 + 2단계
        </div>
      </v-sheet>
    </v-card>
  </v-dialog>
</template>
