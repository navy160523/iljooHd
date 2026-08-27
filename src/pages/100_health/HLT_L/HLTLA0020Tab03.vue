<!-- HLTLA0010 감염병 관리기준 -->
<!-- SI2팀 손상규 2025-03-27 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonRequest, getCompanyList } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IGridTitle from '@/components/IGridTitle.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const managerEmpPopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const selectedData = ref(null)

const isAdmin = ref(false)
// 조회조건
const searchParams = reactive({
  BSNS_CD: ''
})

const codeList = reactive({
  deptCd: []
})

const initCodeList = () => {
  console.log(searchParams)
  Promise.all([
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '',  USE_DIV: 'Y' },
    }),
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV: 'Y' }
    }), // 협력사
  ]).then((res) => {
    codeList.deptCd = res[0].ORESULT_CUR 
    codeList.bsnsCd = res[1].ORESULT_CUR 
    codeList.asgnCd = res[2].ORESULT_CUR 
    grdMain.value.setBindingColumn('DEPT_CD', codeList.deptCd, 'DEPT_CD', 'DEPT_NM')
    grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnsCd, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('ASGN_CD', codeList.asgnCd, 'ASGN_CD', 'ASGN_NM')

    if( useLogsStore().isMenuAdmin === 'Y' ) {
      isAdmin.value = true
    }
    else {
      isAdmin.value = false
    }
  })
  
}

const selectedEmp = val => {
  grdMain.value.getDataProvider().setValue(selectedData.value, 'BSNS_CD', val.BSNS_CD)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'DEPT_CD', val.DEPT_CD)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'ASGN_CD', val.ASGN_CD)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'EMP_NO', val.EMP_NO)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'KOR_NM', val.EMP_NM)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'JOB_TIT_NM', val.JOB_TIT_NM)
  grdMain.value.getGridView().checkItem(selectedData.value, true)
}

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true

  // 인원팝업 
  document.addEventListener("click", (event) => {
    if (event.target.closest(".manager-search-icon")) {
      const index = event.target.closest(".manager-search-icon").dataset.index;
      selectedData.value = index  // 인덱스를 이용하여 데이터 가져오기
      if (selectedData.value && !isAdmin.value) {
        managerEmpPopup.value.openPopup({
          CMPNY_DIV_D: true,
          USER_DIV_D: true,
          BSNS_CD_D: true,
          DEPT_CD_D: true,
          BSNS_CD: userStore.bsnsCd,
          DEPT_CD: userStore.deptCd
        })
      } else if (selectedData.value && isAdmin.value) { 
        managerEmpPopup.value.openPopup({})
      }
    }
  });
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }, stateBar: { visible: false }},
  keys : [],
  fields: [ 
    { fieldName: 'BSNS_CD', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('사업부') }, editable: false, lookupDisplay: true },
    { fieldName: 'DEPT_CD', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('부서') }, editable: false, lookupDisplay: true },
    { fieldName: 'ASGN_CD', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('협력사') }, editable: false, lookupDisplay: true },
    {
      fieldName: 'KOR_NM', width: '80', styleName: 'editable_column center-column', dataType: 'text', header: { text: t('관리자 이름') }, editable: false,
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
                <i class="mdi mdi-magnify manager-search-icon" data-index="${cell.index.itemIndex}"></i>
              </div>
            `;
          }
        }
      }
    },
    { fieldName: 'JOB_TIT_NM', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'INSERT_USER_ID', width: '150', styleName: 'left-column', dataType: 'text', header: { text: t('등록자') }, editable: false },
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
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false, }, 
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('시퀀스') }, visible: false, }, 
  ],
  columns: [],
})

grd1Props.columns = grd1Props.fields

//메뉴버튼
const onButtonsClick = btn => {
  
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      DEPT_CD: '',
      MANAGER_DIV: '대응관리자',
      EMP_NO: '',
      KOR_NM: '',
      JOB_TIT_NM: '',
      SAVE_YN: 'N',
    }, false)
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('제외 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
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
  console.log(searchParams)
  return commonSearchApi({ queryId: 'HLTLA0020_SEARCH_04', param: searchParams })
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
      return Message.warn(t('관리자 이름은 필수 입력입니다.'))
    } 
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.IP_ADDRESS = userStore.clientIp
    data.CMPNY_DIV = userStore.cmpnyDiv
    saveParams.push(data)
  }
  
  return commonRequest("/hse/health/HLTLA0020_SAVE_01", { queryId: "HLTLA0020_SAVE_04", list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  console.log(checkedRows)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.IP_ADDRESS = userStore.clientIp
    data.CMPNY_DIV = userStore.cmpnyDiv
    saveParams.push(data) 
  }

  return commonRequest("/hse/health/HLTLA0020_DELETE_01", { queryId: "HLTLA0020_DELETE_03", list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 제외되었습니다'))
  initCodeList()
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pa-0 h-auto">
          <IGridTitle :title="$t('관리자 현황')" />
          <span>{{ $t("부서 감염병 대응 관리자를 지정하는 메뉴입니다.") }}</span>
          <span>{{ $t("등록된 부서 관리자는 각 메뉴별 데이터 입력/저장이 가능하며, 신규 관리자 등록/삭제가 가능합니다.") }}</span>
          <span style="color: orange;">{{ $t("* 개인정보 및 민감정보(진단명 등)을 포함하므로 부서별 최소한의 인력만 등록 바랍니다.") }}</span>
            <RealGrid
              ref="grdMain"
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
    ref="managerEmpPopup"    @selected="selectedEmp"
  />
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 280px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

</style>