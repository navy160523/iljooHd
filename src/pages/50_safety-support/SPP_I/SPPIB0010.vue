<!-- SPPIB0010  폭발위험관리 -->
<!-- SI2팀 손상규 2025-02-13 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import SPPIB0010Popup from '@/pages/50_safety-support/SPP_I/SPPIB0010Popup.vue'
import SPPIB0020Popup from '@/pages/50_safety-support/SPP_I/SPPIB0020Popup.vue'

defineOptions({
  name: '50_safety-support-SPP_I-SPPIB0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)

//팝업
const sppib0010Popup = ref(null)
const sppib0020Popup = ref(null)

//날짜조회조건 disabled
const dtDisabled = ref(false)

// 조회조건
const today = new Date()
const formatDate = (date) => date.toISOString().slice(0, 10)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NEW_DT: formatDate(new Date(today.setFullYear(today.getFullYear() - 1))), // 1년 전
  CHG_DT: formatDate(new Date()), // 오늘
  CONFIRM_YN: '',
  EXP_RESULT: ''
})

const codeList = reactive({
  bsnsCd: [],
  confirmYn: [
    {CODE: '', NAME: '전체'},
    {CODE: 'Y', NAME: '확정'},
    {CODE: 'N', NAME: '미확정'}
  ],
  expResult: [
    {CODE: 'Y' , NAME: '대상'},
    {CODE: 'N' , NAME: '비대상'},
  ],
  expResultList: [
    {CODE: '' , NAME: '전체'},
    {CODE: 'Y' , NAME: '대상'},
    {CODE: 'N' , NAME: '비대상'},
  ],
  confirmDiv: [
    {CODE: '', NAME: '전체'},
    {CODE: 'B' , NAME: '미산출'},
    {CODE: 'A' , NAME: '산출중'},
    {CODE: 'C' , NAME: '산출완료'},
  ]
})

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
})

const initCodeList = () => {
  commonSearchApi({
    queryId: 'searchBSNS',
    param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y' },
  })
    .then(res => {
      codeList.bsnsCd = res.ORESULT_CUR
      codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' });

      grdMain.value.setBindingColumn('EXP_RESULT', codeList.expResult, 'CODE', 'NAME')
      grdMain.value.setBindingColumn('CONFIRM_DIV', codeList.confirmDiv, 'CODE', 'NAME')
    }
  )
}

/* watch(
  () => searchParams.CONFIRM_YN,
  (newVal) => {
    dtDisabled.value = newVal == 'Y'
    searchParams.NEW_DT = ''
    searchParams.CHG_DT = ''
  }
) */
//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true, exclusive: true }, edit: { editable: true }},
  keys : ['PROJNO'],
  fields : [ 
    { fieldName: 'CONFIRM_DIV', width: '100', editable: false, styleName: 'center-column', dataType: 'text', header: { text: t('산출구분') }, lookupDisplay: true },
    { fieldName: 'NEW_FLAG_DT', width: '100', editable: false, styleName: 'center-column', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('신규/변경일자') }},
    {
      fieldName: 'EXP_RESULT', width: '80', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('방폭 결과') }, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 2, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
      styleCallback: function (grid, dataCell) {
        let newFlagDt = grid.getValue(dataCell.index.itemIndex, 'NEW_FLAG_DT');
        let ret = { editable: true, styleName: 'editable_column center-column' };

        if (!newFlagDt) {
          ret.editable = false; // 편집 불가
        }

        return ret;
      }
    },
    { fieldName: 'REQEMP', width: '100', editable: false, styleName: 'center-column', dataType: 'text', header: { text: t('의뢰자') }},
    { fieldName: 'PROJNO', width: '100', editable: false, styleName: 'center-column', dataType: 'text', header: { text: t('공사번호') }},
    { fieldName: 'PROJNME', width: '300', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('공사명') }},
    { fieldName: 'PROJSUMARY1', width: '150', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('공사개요') }},
    { fieldName: 'PROJSUMARY2', width: '100', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('공사 규모,물량') }},
    { fieldName: 'REQDTE', width: '90', editable: false, styleName: 'center-column', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('의뢰일자') }},
    { fieldName: 'PREQNO', width: '100', editable: false, styleName: 'center-column', dataType: 'text', header: { text: t('의뢰번호') }},
    { fieldName: 'LOCGISNME', width: '250', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('공사위치명') }},
    { fieldName: 'EQUIPCODE', width: '80', editable: false, styleName: 'center-column', dataType: 'text', header: { text: t('대표설비') }},
    { fieldName: 'EQUIPNME', width: '150', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('설비명') }},
    {
      fieldName: 'FILE_URL', width: '150', editable: false, styleName: 'center-column', dataType: 'text', header: { text: t('의뢰정보의 첨부파일') },
      renderer: {
        type: "html",
        callback: function (grid, cell) {
          return `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
              <pre style="display: none;">${cell.value}</pre>
              <i class="mdi mdi-magnify search-icon file-link" data-index="${cell.index.itemIndex}" style="cursor: pointer;"></i>
            </div>
          `;
        }
      }
    },
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'MANAGE_NUM', dataType: 'text', header: { text: t('관리번호') },visible: false, },
    { fieldName: 'TARGET_FAC', dataType: 'text', header: { text: t('설비 및 공정') },visible: false, },
    { fieldName: 'NEW_FLAG', dataType: 'text', header: { text: t('신규/변경') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

// 그리드 이벤트
const onCellDblClicked = (grd, data) => {
  if (data.cellType === "data") {
    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    // console.log("데이터", innerData)
    if (!innerData.NEW_FLAG_DT) {
      Message.warn(t('산출된 데이터가 없습니다.'))
    } else { 
      sppib0010Popup.value.openPopup(innerData)
    }
  }
}

const onCellItemClicked = (grid, itemIndex, column) => {

  if (column.fieldName == "FILE_URL") {
    const fileUrl = column.value
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    } else {
      Message.warn(t('첨부된 파일이 없습니다.'))
    }
  }
};

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnCalculation') {
    const checkedRows = grdMain.value.getGridView().getCheckedRows();

    if (checkedRows.length === 0) {
      Message.warn(t('행을 선택하세요.'));
      return;
    }

    const rowData = grdMain.value.getDataProvider().getJsonRow(checkedRows);

    if (!rowData.NEW_FLAG_DT) {
      // 팝업 열기 (체크된 행의 데이터를 전달)
      sppib0010Popup.value.openPopup(rowData);
    } else {
      Message.warn(t('이미 산출된 데이터가 존재합니다.'));
    }
  }
  else if(btn.id=='btnExpcalctest')
  {
    sppib0020Popup.value.openPopup();
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
  // console.log(searchParams)
  return commonSearchApi({ queryId: 'SPPIB0010_SEARCH_01', param: searchParams })
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
  // for (let rowIdx of checkedRows) {
  //   let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  //   if (isEmpty(data.CHK_GUBN)) {
  //     return Message.warn(t('구분은 필수 입력입니다.'))
  //   } else if (isEmpty(data.CHK_ITEM)) {
  //     return Message.warn(t('점검항목은 필수 입력입니다.'))
  //   }
  // }

  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  // console.log("saveParams",saveParams)
  return commonExecuteApi({ queryId: 'SPPIB0010_SAVE_01', list: saveParams })
    .then(res => { 
      // console.log(res)
    })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

// 팝업
const upData = () => {
  // console.log("upData")
  onButtonsClick({ id: "btnSearch" })
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="false"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnExpcalctest','btnSearch', 'btnUpdate', 'btnCalculation']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">        
          <!-- 신규/변경일자 -->
          <i-input
            v-model="searchParams.NEW_DT"
            label-width="50px" 
            width="220px" 
            :label="$t('의뢰일자')" 
            type="date" 
            margin="10px"
          />
          <i-input 
            v-model="searchParams.CHG_DT"
            label-width="10px"
            width="180px" 
            :label="$t('-')" 
            type="date"
          />
          <!-- 확정 여부 -->
          <i-select
            v-model="searchParams.CONFIRM_YN"
            :label="$t('산출 구분')"
            :items="codeList.confirmDiv"
            item-value="CODE"
            item-title="NAME" 
            label-width="60px"
            width="200px"
          />
          <!-- 확정 여부 -->
          <i-select
            v-model="searchParams.EXP_RESULT"
            :label="$t('대상 여부')"
            :items="codeList.expResultList"
            item-value="CODE"
            item-title="NAME" 
            label-width="60px"
            width="170px"
          />
        </v-sheet>
        <RealGrid
          ref="grdMain"
          class="mt-2"
          :grid-view-option="grd1Props.gridViewOption"
          :keys="grd1Props.keys" 
          :fields="grd1Props.fields"
          :columns="grd1Props.columns"
          @onCellDblClicked="onCellDblClicked"
          @onCellItemClicked="onCellItemClicked"
        />
      </div>
    </v-card-text>
  </v-card>
  <SPPIB0010Popup ref="sppib0010Popup" @upData="upData" />
  <SPPIB0020Popup ref="sppib0020Popup"/>
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
    min-height: 400px;
  }
}
</style>