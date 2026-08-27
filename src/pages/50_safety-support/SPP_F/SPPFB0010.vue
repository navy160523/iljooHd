<!-- SPPFJ0010 PSM 변경관리 -->
<!-- SI2팀 손상규 2025-02-25 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import SPPFB0010Popup01 from './SPPFB0010Popup01.vue'
import SPPFB0010Popup02 from './SPPFB0010Popup02.vue'
import { useRouter, useRoute } from "vue-router";

defineOptions({
  name: '50_safety-support-SPP_F-SPPFB0010',
})

const emit = defineEmits(['close'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const selectedData = reactive({})
const sppfb0010Popup01 = ref(null)
const sppfb0010Popup02 = ref(null)
const router = useRouter();

const searchParam = reactive({
  USER_ID: userStore.empNo,
})

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  eq3: [], //공정설비
  runList: [
    {COD: 'Y', TXT: '가동중'},
    {COD: 'N', TXT: '비활성'}
  ]
})

const initCodeList = async () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      //부서조회
      queryId: 'SPPHD0010_COMBO_03',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: '',
      },
    }),
    getCodeList('HHIV010')
  ]).then((res) => {
    codeList.bsnscd = res[0].ORESULT_CUR
    codeList.deptcd = res[1].ORESULT_CUR
    codeList.process = res[2].ORESULT_CUR

    grdMain.value.setBindingColumn('RUN_YN', codeList.runList, 'COD', 'TXT')
    grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnscd, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.deptcd, 'CODE', 'DISPLAY_TEXT')
    grdMain.value.setBindingColumn('PROCESS', codeList.process, 'COD', 'TXT')
  })
}

//그리드 속성셋
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : ['IDX_SEQ'],
  fields : [ 
    {
      fieldName: 'RUN_YN', dataType: 'text', header: { text: t('가동중'), styleName: 'center-column editable_column' },
      styleName: 'editable_column', lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 2, partialMatch: true, domainOnly: true, dropDownWhenClick: true }
    },
    {
      fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, width: '120', lookupDisplay: true, mergeRule: { "criteria": "value" },
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 6, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      },
      styleCallback: (grid, dataCell) => {
        var ret = {}

        if(dataCell.item.rowState == 'created' || dataCell.item.itemState == 'appending' || dataCell.item.itemState == 'inserting'){
          ret.editable = true;
          ret.styleName = 'editable_column';
        } else {
          ret.editable = false;
        }

        return ret;
      }
    },
    { 
      fieldName: 'DEPT_CD', 
      dataType: 'text', 
      header: { text: t('부서') }, 
      width: '100', 
      editable: true,
      editor: { type: 'dropdown' }, 
      lookupDisplay: true,
      styleCallback: function(grid, dataCell) {
        var ret = { editable: true, enabled: true };
        var dropList = { CODE: [], DISPLAY_TEXT: [] };
        var bsnsCd = grid.getValue(dataCell.index.itemIndex, 'BSNS_CD'); // 부서 코드 가져오기

        for (let cd of codeList.deptcd) {
          if (bsnsCd == null || bsnsCd == '' || cd.BSNS_CD === bsnsCd) {
            dropList.CODE.push(cd.CODE);
            dropList.DISPLAY_TEXT.push(cd.DISPLAY_TEXT);
          }
        }
        if(dataCell.item.rowState == 'created' || dataCell.item.itemState == 'appending' || dataCell.item.itemState == 'inserting'){
          ret.editable = true;
          ret.styleName = 'editable_column';
        } else {
          ret.editable = false;
        }
        ret.editor = { 
          type: 'dropdown',
          values: dropList.CODE,
          labels: dropList.DISPLAY_TEXT
        };

        return ret;
      }
    },
    { fieldName: 'PROCESS', width: '180', dataType: 'text', header: { text: t('공정설비')}, lookupDisplay: true,
      editor: {
        type: 'dropdown'
      },
      renderer: {
        type: 'html',
        callback: function (grid, cell) {
          const codValue = grid.getValue(cell.index.itemIndex, 'PROCESS'); // COD 값
          const processList = codeList.process; // CODE 리스트
          
          // COD 값에 해당하는 TXT 값
          const txtValue = processList.find(item => item.COD === codValue)?.TXT || '';

          return `<pre style="white-space: pre-line; text-align: left; font-weight: normal; font-family: 'Roboto', sans-serif;">${txtValue}</pre>`; 
        }
      },
      styleCallback: (grid, dataCell) => {
        var ret = {}

        if(dataCell.item.rowState == 'created' || dataCell.item.itemState == 'appending' || dataCell.item.itemState == 'inserting'){
          ret.editable = true;
          ret.styleName = 'editable_column';
        } else {
          ret.editable = false;
        }

        return ret;
      }
    },
    { fieldName: 'TAR_PROCESS', width: '180', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('주요 공정') } },
    {
      fieldName: 'USE_DIL', width: '100', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('사용물질') },
      mergeRule: { criteria: "values['BSNS_CD'] + values['USE_DIL'] + value" },
    },
    {
      fieldName: 'PSM_FT_DT',
      styleName: 'center-column editable_column',
      width: '100',
      header: { text: t('공정안전 보고서 최초제출') },
      editable: true,
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM'
      },
      mergeRule: { criteria: "values['BSNS_CD'] + values['PSM_FT_DT'] + value" },
    },
    {
      fieldName: 'MANAGER',
      width: 230,
      editable: false, // 조회 시 값이 안 나오는 문제 해결
      styleName: 'editable_column left-column',
      dataType: 'text',
      header: { text: t('담당자') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'SAVE_YN')
          console.log(value)
          if (value == 'N') return '';
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
              <pre style="white-space: pre-line; text-align: left; font-weight: normal; font-family: 'Roboto', sans-serif;">${cell.value ?? ''}</pre>
              <i class="mdi mdi-magnify search-icon" data-index="${cell.index.itemIndex}"></i>
            </div>
          `;
        }
      }
    },
    { fieldName: 'DP_DT', width: '120', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('공정안전자료') }},
    { fieldName: 'PSD_DT', width: '120', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('운전절차서') }},
    { fieldName: 'INSPEC', width: '100', editable: false, dataType: 'text', header: { text: t('설비점검') } },
    { fieldName: 'CM_DT', width: '120', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('변경관리') }},
    { fieldName: 'EAP_DT', width: '120', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('비상조치계획') } },
    {
      fieldName: 'REMARK', width: '500', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('비고') },
      mergeRule: { criteria: "values['BSNS_CD'] + values['PSM_FT_DT'] + value" }
    },
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'IDX_SEQ', dataType: 'number', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})
grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true

  document.addEventListener("click", (event) => {
    if (event.target.closest(".search-icon")) {
      const index = event.target.closest(".search-icon").dataset.index;
      selectedData.value = grdMain.value.getDataProvider().getJsonRow(index);  // 인덱스를 이용하여 데이터 가져오기
      if (selectedData.value) {
        sppfb0010Popup01.value.openPopup({
          BSNS_CD: selectedData.value.BSNS_CD,
          DEPT_CD: selectedData.value.DEPT_CD,
          PROCESS: selectedData.value.PROCESS,
          PRT_SEQ: selectedData.value.IDX_SEQ
        });  // 데이터를 이용해 팝업 호출
      }
    }
  });
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnProcessSearch') {
    sppfb0010Popup02.value.openPopup();
  } else if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnNew') {
    grdMain.value.addRow({
      RUN_YN: '',
      BSNS_CD: '',
      DEPT_CD: '',
      PROCESS: '',
      TAR_PROCESS: '',
      USE_DIL: '',
      PSM_FT_DT: '',
      DP_DT: '',
      PSD_DT: '',
      INSPEC: '',
      CM_DT: '',
      EAP_DT: '',
      REMARK: '',
      IDX_SEQ: '',
      SAVE_YN: 'N'
    }, false)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
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
  return commonSearchApi({ queryId: 'SPPFB0010_SEARCH_01', param: searchParam })
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
    if (isEmpty(data.BSNS_CD)) {
      return Message.warn(t('사업부는 필수 입력입니다.'))
    } else if (isEmpty(data.DEPT_CD)) {
      return Message.warn(t('부서는 필수 입력입니다.'))
    } else if (isEmpty(data.PROCESS)) {
      return Message.warn(t('공정설비는 필수 입력입니다.')) 
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
  console.log("saveParams", saveParams)
  return commonExecuteApi({ queryId: 'SPPFB0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

// 로우 더블클릭 시 상세정보 팝업 출력
const onCellDblClicked = (grid, clickData) => {
  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow);
  const { column } = clickData;

  const popupColumns = ['PROCESS', 'BSNS_CD', 'DEPT_CD'];
  const routeMap = {
    DP_DT: '/50_safety-support/SPP_F/SPPFC0010',
    PSD_DT: '/50_safety-support/SPP_F/SPPFE0010',
    INSPEC: '/50_safety-support/SPP_F/SPPFF0010',
    CM_DT: '/50_safety-support/SPP_F/SPPFJ0010',
    EAP_DT: '/50_safety-support/SPP_F/SPPFM0010'
  };

  if (popupColumns.includes(column)) {
    sppfb0010Popup02.value.openPopup(data);
  } else if (routeMap[column] && data[column]) {

    window.sessionStorage.setItem('PROCESS_CD', data.PROCESS || '');

    router.push(routeMap[column]);
  }
}

//로우클릭시 해당로우 정보 get
const onCellClicked = (grid, clickData) => {
  let rowData = grdMain.value.getFocusedRowData()
  selectedData.value = rowData
}

const onCellEdited = (grid, itemIndex, dataRow, field) => {
  let fieldName = grdMain.value.getGridView().getColumn(field)
  if (fieldName.name === 'BSNS_CD') {
    grid.setValue(dataRow, 'DEPT_CD', ''); // 부서 코드 초기화
  }
}

//팝업 닫혔을때 조회
const upData = () => {
  onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="false"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnProcessSearch', 'btnSearch', 'btnNew', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-1"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
            @onCellClicked="onCellClicked"
            @onCellEdited="onCellEdited"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SPPFB0010Popup01 ref="sppfb0010Popup01" @upData="upData"/>
  <SPPFB0010Popup02 ref="sppfb0010Popup02" @upData="upData"/>
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
