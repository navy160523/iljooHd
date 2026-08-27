<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IButtonList from '@/components/IButtonList.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

let dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const emit = defineEmits(['upData'])

// 첨부파일 버튼 리스트
const buttonList = reactive(['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose'])

const menuTitle = ref(null)
const grdMain = ref(null)
const isReadonly = ref(null)
const empPopup = ref(null)
const fileUploadPopup = ref(null)
const fileTitle = ref('')
const selectedRow = ref(null)

const searchParams = reactive({
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS: ''
})
const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  process: [], //설비공정,
  processCell: [], //값선택시 사업부,부서 바인딩용
  bsnscdSearch: [],
  deptcdSearch: [],
  processSearch: [],
  divisionList: [
    { COD: 'A', TXT: '신규' },
    { COD: 'B', TXT: '변경' }
  ],
  auditResultList: [
    { COD: 'A', TXT: '적정' },
    { COD: 'C', TXT: '조건부 적정' },
    { COD: 'I', TXT: '부적정' }
  ],
  chkResultList: [
  { COD: 'A', TXT: '적합' },
    { COD: 'C', TXT: '조건부 적합' },
    { COD: 'I', TXT: '부적합' }
  ]
})

const initCodeList = () => {
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
    getCodeList('HHIV010'),
    commonSearchApi({
      queryId: 'SPPFB0010_SEARCH_01',
      param: {
        USER_ID: userStore.empNo
      }
    })
  ]).then((res) => {
    codeList.bsnscd = res[0].ORESULT_CUR
    codeList.deptcd = res[1].ORESULT_CUR
    codeList.process = res[2].ORESULT_CUR
    codeList.processCell = res[3].ORESULT_CUR

    codeList.bsnscdSearch = [{ BSNS_CD: '', BSNS_NM: '전체' }, ...res[0].ORESULT_CUR];
    codeList.deptcdSearch = [{ CODE: '', DISPLAY_TEXT: '전체' }, ...res[1].ORESULT_CUR];
    codeList.processSearch = [{ COD: '', TXT: '전체' }, ...res[2].ORESULT_CUR];

    grdMain.value.setBindingColumn('DIVISION', codeList.divisionList, 'COD', 'TXT')
    grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnscd, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.deptcd, 'CODE', 'DISPLAY_TEXT')
    grdMain.value.setBindingColumn('PROCESS', codeList.process, 'COD', 'TXT')
    grdMain.value.setBindingColumn('AUDIT_RESULT', codeList.auditResultList, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CHK_RESULT', codeList.chkResultList, 'COD', 'TXT')
  })
}

//사업부변경 감지
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    if (newValue === '') {
      searchParams.DEPT_CD = ''
      codeList.deptcdSearch = []
      codeList.deptcdSearch.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
      return false
    }
    commonSearchApi({
      queryId: 'SPPHD0010_COMBO_03',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
      },
    }).then((res) => {
      searchParams.DEPT_CD = ''
      codeList.deptcdSearch = res.ORESULT_CUR
      codeList.deptcdSearch.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
    })
  }
)

const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnNew') {
    grdMain.value.addRow({
      DIVISION: '',
      BSNS_CD: '',
      DEPT_CD: '',
      PROCESS: '',
      LOC_PROCESS: '',
      TAR_PROCESS: '',
      PROCESS_DESC: '',
      PSM_DT: '',
      AUDIT_PROG: '',
      AUDIT_DT: '',
      AUDIT_RESULT: '',
      CHK_PROG: '',
      CHK_DT: '',
      CHK_DRIVE: '',
      CHK_RESULT: '',
      REMARK: '',
      SAVE_YN: 'N'
    }, false)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : ['DEPT_CD','BSNS_CD','PROCESS','PSM_DT'],
  fields : [ 
    {
      fieldName: 'DIVISION', dataType: 'text', header: { text: t('구분') },
      styleName: 'editable_column', lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 2, partialMatch: true, domainOnly: true, dropDownWhenClick: true }
    },
    {
      fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },width: '120', lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 6, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
      editable: false
    },
    { 
      fieldName: 'DEPT_CD', 
      dataType: 'text', 
      header: { text: t('부서') }, 
      width: '100', 
      editable: false,
      editor: { type: 'dropdown' }, 
      lookupDisplay: true,
      // styleCallback: function(grid, dataCell) {
      //   var ret = { editable: true, styleName: 'center-column editable_column', enabled: true };
      //   var dropList = { CODE: [], DISPLAY_TEXT: [] };
      //   var bsnsCd = grid.getValue(dataCell.index.itemIndex, 'BSNS_CD'); // 부서 코드 가져오기

      //   for (let cd of codeList.deptcd) {
      //     if (bsnsCd == null || bsnsCd == '' || cd.BSNS_CD === bsnsCd) {
      //       dropList.CODE.push(cd.CODE);
      //       dropList.DISPLAY_TEXT.push(cd.DISPLAY_TEXT);
      //     }
      //   }
      //   ret.editor = { 
      //     type: 'dropdown',
      //     values: dropList.CODE,
      //     labels: dropList.DISPLAY_TEXT
      //   };

      //   return ret;
      // }
    },
    { fieldName: 'PROCESS', width: '180', dataType: 'text', header: { text: t('공정설비'), styleName: 'center-column editable_column' }, lookupDisplay: true,
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

          return `<pre style="white-space: pre-line; text-align: left;">${txtValue}</pre>`; 
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
      },
    },
    { fieldName: 'LOC_PROCESS', dataType: 'text', width: '150',header: { text: t('설비위치') }, editable: true, visible: true, styleName: 'editable_column left-column',},
    { fieldName: 'TAR_PROCESS', dataType: 'text', width: '150',header: { text: t('대상설비') }, editable: true, visible: true, styleName: 'editable_column left-column',},
    { fieldName: 'PROCESS_DESC', dataType: 'text', width: '150',header: { text: t('설비내용') }, editable: true, visible: true, styleName: 'editable_column left-column',},
    {
      fieldName: 'PSM_DT', header: { text: t('공정안전보고서 제출') }, editable: true, visible: true,
      dataType: 'text',
      'editor': {
        type:'date', 
        datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} 
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
      },
    },
    { fieldName: 'AUDIT_PROG', dataType: 'text', header: { text: t('진행사항') }, editable: true, visible: true,  styleName: 'editable_column center-column',},
    {
      fieldName: 'AUDIT_DT', header: { text: t('심사일자') }, editable: true, visible: true, styleName: 'editable_column center-column',
      dataType: 'text',
      'editor': {
        type:'date', 
        datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} 
      }
    },
    {
      fieldName: 'AUDIT_RESULT', dataType: 'text', header: { text: t('결과') }, editable: true, visible: true, styleName: 'editable_column center-column',
      lookupDisplay: true,
      editor: {
        type: 'dropdown'
      }
    },
    { fieldName: 'CHK_PROG', dataType: 'text', header: { text: t('진행사항') }, editable: true, visible: true, styleName: 'editable_column center-column',},
    {
      fieldName: 'CHK_DT', header: { text: t('설치과정 중') }, editable: true, visible: true, styleName: 'editable_column center-column',
      dataType: 'text',
      'editor': {
        type:'date', 
        datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} 
      }
    },
    {
      fieldName: 'CHK_DRIVE', header: { text: t('시운전 확인') }, editable: true, visible: true, styleName: 'editable_column center-column',
      dataType: 'text',
      'editor': {
        type:'date', 
        datetimeFormat:'yyyy-MM-dd', 
        mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} 
      }
    },
    {
      fieldName: 'CHK_RESULT', dataType: 'text', header: { text: t('결과') }, editable: true, visible: true, styleName: 'editable_column center-column',
      lookupDisplay: true,
      editor: {
        type: 'dropdown'
      }
    },
    {
      fieldName: 'FILE_CNT', width: '80', editable: false, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('첨부자료[건]') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_CNT');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);

          // 신규 행이면 버튼을 숨김
          if (rowState === 'created') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span>${value || 0}</span></div>`;
          }

          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
              <span>${value || 0}</span> 
              <button 
                class="v-btn" 
                style="color: #fff; background: #1a40c7; padding: 4px;"
              >첨부</button>
            </div>
          `;
        }
      }
    },
    { fieldName: 'REMARK', width: '300', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('비고') } },

    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('인원코드') },visible: false, },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('파일ID') },visible: false, },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('파일ID') },visible: false, },
  ],
  columnLayout: [
    'DIVISION',
    'BSNS_CD',
    'DEPT_CD',
    'PROCESS',
    'LOC_PROCESS',
    'TAR_PROCESS',
    'PROCESS_DESC',
    'PSM_DT',
    {
      name: '진행 현황',
      direction: 'horizontal',
      items: [
        {
          name: '심사(서류)',
          direction: 'horizontal',
          items: [  'AUDIT_PROG', 'AUDIT_DT', 'AUDIT_RESULT'  ],
          header: { text: t('심사(서류)')}
        },
        {
          name: '확인(현장)',
          direction: 'horizontal',
          items: [  'CHK_PROG', 'CHK_DT', 'CHK_DRIVE', 'CHK_RESULT'  ],
          header: { text: t('확인(현장)')}
        }
      ],
      header: { text: t('진행 현황') }
    },
    'FILE_CNT',
    'REMARK'
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

const onCellEdited = (grid, itemIndex, rowIndex, field) => {
  const columnName = grid.getColumn(field).fieldName; // 인덱스를 컬럼명으로 변환

  if (columnName !== 'PROCESS') return;

  const dataProvider = grdMain.value.getDataProvider();
  const newProcess = dataProvider.getValue(rowIndex, 'PROCESS'); // 변경된 PROCESS 값

  if (!newProcess) return;

  const matchedProcess = codeList.processCell.find(item => item.PROCESS === newProcess);

  if (matchedProcess) {
    dataProvider.setValue(rowIndex, 'BSNS_CD', matchedProcess.BSNS_CD);
    dataProvider.setValue(rowIndex, 'DEPT_CD', matchedProcess.DEPT_CD);
  } else {
    dataProvider.setValue(rowIndex, 'BSNS_CD', '');
    dataProvider.setValue(rowIndex, 'DEPT_CD', '');
  }
};

const onCellItemClicked = (grid, index, col) => {
  const data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if (col.target.className === 'v-btn' && col.column === 'FILE_CNT') { 
    fileTitle.value = '공정설비별 인허가 파일첨부'
    selectedRow.value = index.dataRow
    fileUploadPopup.value.openPopup(data.FILE_ID)
  }
}

const uploaded = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return
  
  Promise.all([
      commonSearchApi({ queryId : 'DATCA0070_SEARCH_03', param : { CMPNY_DIV: userStore.cmpnyDiv, FILE_ID: val.fileId } }), // 부서
  ]).then(res => {
    if(res[0].ORESULT_CUR[0].CNT_FILE > 0) {
      grdMain.value.getDataProvider().setValue(selectedRow.value, 'FILE_CNT', res[0].ORESULT_CUR[0].CNT_FILE)
    }
    grdMain.value.getDataProvider().setValue(selectedRow.value, 'FILE_ID', val.fileId)


    // DB에 파일정보 저장
    let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
    // 파일 업로드 후 저장
    if(data.CMPNY_DIV == null) data.CMPNY_DIV = userStore.cmpnyDiv
    saveParams.push(data)
    
    // 재 렌더링을 해주기 위한 코드(렌더링이 되지 않으면 데이터가 변하지 않은 거처럼 보임)
    grdMain.value.getGridView().displayOptions.rowHeight = grdMain.value.getGridView().displayOptions.rowHeight + 1
    grdMain.value.getGridView().displayOptions.rowHeight = grdMain.value.getGridView().displayOptions.rowHeight - 1
    
    commonExecuteApi({ queryId : 'SPPFB0010_SAVE_04', list: saveParams })
  })
}

const filePopupClosed = () => {
  onButtonsClick({ id : 'btnSearch' })
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

// 조회
const searchData = () => {
  console.log(searchParams)
  return commonSearchApi({ queryId: 'SPPFB0010_SEARCH_03', param: searchParams })
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }
  console.log(checkedRows)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (isEmpty(data.DIVISION)) {
      return Message.warn(t('구분은 필수 입력입니다.'))
    } else if (isEmpty(data.PROCESS)) {
      return Message.warn(t('공정설비는 필수 입력입니다.'))
    } else if (isEmpty(data.PSM_DT)) {
      return Message.warn(t('공정안전보고서 제출은 필수 입력입니다.')) 
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
    saveParams.push(data)
  }
  console.log("saveParams", saveParams)
  return commonExecuteApi({ queryId: 'SPPFB0010_SAVE_03', list: saveParams })
    .then(res => { 
      console.log(res)
    })
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
  searchParams.BSNS_CD = ''
  searchParams.DEPT_CD = ''
  searchParams.PROCESS = ''
  // searchParams.BSNS_CD = popupParam.BSNS_CD
  // searchParams.DEPT_CD = popupParam.DEPT_CD
  // searchParams.PROCESS = popupParam.PROCESS

  initCodeList()
  getData()
}

const closePopup = () => {
  emit('upData')
  dialog.value = false
}

defineExpose({
  openPopup
})

</script>
<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1500"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">공정설비별 인허가(신규/변동) 상세</div>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnNew', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
          :use-permission="false"
          :hiddenManuel="true"
        />
      </v-card-title>

      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')"
              :items="codeList.bsnscdSearch"
              item-value="BSNS_CD"
              item-title="BSNS_NM" 
              label-width="40px"
              width="180px"
            />
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서')"
              :items="codeList.deptcdSearch"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="40px"
              width="180px"
            />
            <i-select
              v-model="searchParams.PROCESS"
              :label="$t('공정설비')"
              :items="codeList.processSearch"
              item-value="COD"
              item-title="TXT" 
              label-width="50px"
              width="250px"
            />
          </v-sheet>  
          <v-sheet height="100%">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grd1Props.gridViewOption"
              :keys="grd1Props.keys"
              :fields="grd1Props.fields"
              :columns="grd1Props.columns"
              :column-layout="grd1Props.columnLayout"
              @onCellEdited="onCellEdited"
              @onCellItemClicked="onCellItemClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
    <IUploadPopup ref="fileUploadPopup" :gridTitle="fileTitle" @uploaded="uploaded" :buttonList="buttonList" @closed="filePopupClosed"/>
  </VDialog>
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