<!-- HLTLA0020 부서 감염병 관리 -->
<!-- SI2팀 손상규 2025-03-27 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IGridTitle from '@/components/IGridTitle.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import HLTLA0020Popup from './HLTLA0020Popup.vue'
import HLTLA0020Popup02 from './HLTLA0020Popup02.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)
const selectedRow = ref(null)

const infecEmpPopup = ref(null) //인원 팝업
const selectedData = ref('')
const fileUploadPopup = ref(null) //파일업로드 팝업
const fileTitle = ref('')
const hltla0020Popup = ref(null) // 접촉자정보 팝업
const hltla0020Popup02 = ref(null) // 감염병종류 팝업

//권한
const isAdmin = ref(false)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd || '',
  DEPT_CD: userStore.deptCd || '',
  ASGN_CD: userStore.orgnDiv == 'B' ? userStore.asgnCd || '' : '',
  INFEC_NM: '',
  ST_INSERT_DATE: '',
  ED_INSERT_DATE: '',
  KOR_NM: ''
})

const selectParams = reactive({
  column: '',
  columnValue: ''
})

const codeList = reactive({
  proStat: [
    { COD: 'A', TXT: '격리(치료중)' },
    { COD: 'B', TXT: '격리해제(종결)' },
  ],
  columnList: [
    { COD: 'INSPEC_DT', TXT: '검사일자' },
    { COD: 'INSPEC_RN', TXT: '검사사유' },
    { COD: 'SYMP_DT', TXT: '증상 시작일' },
    { COD: 'LAST_DT', TXT: '마지막 출근일' },
    { COD: 'CNFM_DT', TXT: '확진일자' },
    { COD: 'QUAR_DT', TXT: '격리종료일' },
    { COD: 'PRO_STAT', TXT: '진행상태' },
    { COD: 'REMARK', TXT: '비고' },
  ] 
})

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true

  const today = new Date();
  const end = today.toISOString().slice(0, 10); // yyyy-MM-dd
  const start = new Date(today);
  start.setDate(today.getDate() - 14);
  const startStr = start.toISOString().slice(0, 10);

  searchParams.ED_INSERT_DATE = end;
  searchParams.ST_INSERT_DATE = startStr;

  // 인원팝업 
  document.addEventListener("click", (event) => {
    if (event.target.closest(".infec-search-icon")) {
      const index = event.target.closest(".infec-search-icon").dataset.index;
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
})

const selectedEmp = val => {
  grdMain.value.getDataProvider().setValue(selectedData.value, 'CMPNY_DIV', val.CMPNY_DIV)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'BSNS_CD', val.BSNS_CD)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'DEPT_CD', val.DEPT_CD)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'ASGN_CD', val.ASGN_CD)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'EMP_NO', val.EMP_NO)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'KOR_NM', val.EMP_NM)
  grdMain.value.getDataProvider().setValue(selectedData.value, 'JOB_TIT_NM', val.JOB_TIT_NM)
  grdMain.value.getGridView().checkItem(selectedData.value, true)
}

const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y' },
    }),
    commonSearchApi({
      queryId: 'HLTLA0020_SEARCH_03',
      param: {INFEC_NM: searchParams.INFEC_NM},
    }),
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD, USE_DIV: 'Y' }
    }), // 협력사
    
    // 그리드용
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    }),
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV: 'Y' }
    }),
    getCodeList('HHII840A1'),
    getCodeList('HHII840A2'),
    getCodeList('HHII840A3'),
    getCodeList('HHII840A4'),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR  
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.deptCd = res[2].ORESULT_CUR
    const rawContactList = res[3].ORESULT_CUR;
    codeList.contactCls = rawContactList;
    // 협력사
    codeList.asgnCd = res[4].ORESULT_CUR

    // 그리드바인딩
    codeList.deptGridList = res[5].ORESULT_CUR
    codeList.asgnGridList = res[6].ORESULT_CUR
    codeList.INFEC1 = res[7].ORESULT_CUR  
    codeList.INFEC2 = res[8].ORESULT_CUR  
    codeList.INFEC3 = res[9].ORESULT_CUR  
    codeList.INFEC4 = res[10].ORESULT_CUR 
  
    codeList.allInfec = [
      ...codeList.INFEC1,
      ...codeList.INFEC2,
      ...codeList.INFEC3,
      ...codeList.INFEC4
    ];
    grdMain.value.setBindingColumn('INFEC_NM', codeList.allInfec, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CMPNY_DIV', codeList.company, 'COD', 'TXT')
    grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnsCd, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.deptGridList, 'DEPT_CD', 'DEPT_NM')
    grdMain.value.setBindingColumn('ASGN_CD', codeList.asgnGridList, 'ASGN_CD', 'ASGN_NM')
    grdMain.value.setBindingColumn('PRO_STAT', codeList.proStat, 'COD', 'TXT')
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.asgnCd.unshift({ ASGN_NM :'전체', ASGN_CD : ''})
    codeList.allInfecList = [ { TXT: '전체', COD: '' }, ...codeList.allInfec ]
    
    if( useLogsStore().isMenuAdmin === 'Y' ) {
      isAdmin.value = true
    }
    else {
      isAdmin.value = false
    }
  })

  //사업부 변경시 부서 조회
  watch(
    () => searchParams.BSNS_CD,
    (newValue) => {
      commonSearchApi({
        queryId: 'searchDept3',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: newValue,
          USE_DIV: 'Y'
        }
      }).then((res) => {
        searchParams.DEPT_CD = ''
        codeList.deptCd = res.ORESULT_CUR
        codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      })
    }
  )

  //부서 변경시 협력사 조회
  watch(
    () => searchParams.DEPT_CD,
    (newValue) => {
      commonSearchApi({
        queryId: 'searchVend',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: newValue,
          USE_DIV: 'Y'
        }
      }).then((res) => {
        searchParams.ASGN_CD = ''
        codeList.asgnCd = res.ORESULT_CUR
        codeList.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      })
    }
  )
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields: [ 
    { fieldName: 'CMPNY_DIV', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('회사') }, editable: false, lookupDisplay: true },
    { fieldName: 'BSNS_CD', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('사업부') }, editable: false, lookupDisplay: true },
    { fieldName: 'DEPT_CD', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('부서') }, editable: false, lookupDisplay: true },
    { fieldName: 'ASGN_CD', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('협력사') }, editable: false, lookupDisplay: true },
    { fieldName: 'EMP_NO', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('사번') }, editable: false },
    {
      fieldName: 'KOR_NM', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('이름'), styleName: 'header_validit' }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          const value = grid.getValue(cell.index.itemIndex, 'CNFM_PRF')
          const value2 = grid.getValue(cell.index.itemIndex, 'CONTACT_INF')
          if (rowState == 'created') {
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;"> 
                <pre>${cell.value ?? ''}</pre>
                <i class="mdi mdi-magnify infec-search-icon" data-index="${cell.index.itemIndex}"></i>
              </div>
            `;
          } else { 
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
                <pre>${cell.value ?? ''}</pre>
              </div>
            `;
          }
        }
      }
    },
    { fieldName: 'JOB_TIT_NM', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('직급') }, editable: false },
    {
      fieldName: 'INFEC_NM', width: '150', styleName: 'center-column', dataType: 'text', header: { text: t('감염병 종류'), styleName: 'header_validit' }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'INFEC_NM')

          const matched = codeList.allInfec.find(item => item.COD === value);
          const displayValue = matched ? matched.TXT : value;
  
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState == 'created') {
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;"> 
                <pre>${displayValue}</pre>
                <i class="mdi mdi-magnify infec-search-icon"></i>
              </div>
            `;
          } else { 
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
                <pre>${displayValue}</pre>
              </div>
            `;
          }
        }
      }
    },
    {
      fieldName: 'INSPEC_DT', width: '100', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('검사일자'), styleName: 'header_validit' },
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
    { fieldName: 'INSPEC_RN', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('검사 사유') } },
    {
      fieldName: 'SYMP_DT', width: '100', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('증상 시작일') },
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
      fieldName: 'LAST_DT', width: '120', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('마지막 출근일'), styleName: 'header_validit' },
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
      fieldName: 'CNFM_DT', width: '100', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('확진일자'), styleName: 'header_validit' },
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
      fieldName: 'QUAR_DT', width: '100', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('날짜') },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      }
    },
    { fieldName: 'QUAR_TIME', dataType: 'text',  width:'50', header: { text: t('시간') }, styleName: 'editable_column',
      editor: {
        mask: { 
          definitions: {
            "b" : '[0-2]', 
            "c" : '[0-9]', 
            "d": '[0-5]', 
            "e": "[0-9]"
          },
        editMask: 'bc:de',
        includedFormat: true,
        overWrite: true,
        allowEmpty: true 
        }
      }, 
      textFormat: "([0-9]{2})([0-9]{2});$1:$2"
    },
    {
      fieldName: 'QUAR_YN', width: '80', dataType: 'text', header: { text: t('해당없음') }, styleName: 'change_back_check',
      renderer: { type: "check", trueValues: 'Y', falseValues: 'N' },
    },
    { fieldName: 'PRO_STAT', width: '120', styleName: 'editable_column center-column', dataType: 'text', header: { text: t('진행상태') }, lookupDisplay: true,
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 2, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      }, },
    {
      fieldName: 'CNFM_PRF', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('확진증빙') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'CNFM_PRF');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);

          // 신규 행이면 버튼을 숨김
          if (rowState === 'created') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else {  
            const a = '등록'
            const b = '미등록'
            if (value >= 1) {
              return `
                <div style="display: flex; align-items: left; justify-content: space-between; padding: 0 5px;">
                  <span style="color: green; font-weight: bold;">${a}</span> 
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >첨부</button>
                </div>
              `;
            } else { 
              return `
                <div style="display: flex; align-items: left; justify-content: space-between; padding: 0 5px;">
                  <span style="color: red; font-weight: bold;">${b}</span> 
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >첨부</button>
                </div>
              `;
            }

          }

        }
      }
    },
    { fieldName: 'CONTACT_INF', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('접촉자 정보') }, renderer:{ type:"button" }, editable: false },
    { fieldName: 'REMARK', width: '300', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('비고') } },
    // 안보이는거
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('SEQ') },visible: false, },
    { fieldName: 'INFEC_SEQ', dataType: 'text', header: { text: t('감염병 종류 SEQ') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false, }, 
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('파일ID') },visible: false, },
  ],
  columns: [],
  columnLayout: [
    'CMPNY_DIV',
    'BSNS_CD',
    'DEPT_CD',
    'ASGN_CD',
    'EMP_NO',
    'KOR_NM',
    'JOB_TIT_NM',
    'INFEC_NM',
    'INSPEC_DT',
    'INSPEC_RN',
    'SYMP_DT',
    'LAST_DT',
    'CNFM_DT',
    {
      name:'격리 종료일',
      direction: 'horizontal',
      items: ['QUAR_DT', 'QUAR_TIME', 'QUAR_YN'],
      header: {text : t('격리 종료일')}
    },
    'PRO_STAT',
    'CNFM_PRF',
    'CONTACT_INF',
    'REMARK'
  ],
})

grd1Props.columns = grd1Props.fields

const onCellEdited = (grid, itemIndex, dataRow, field) => {
  const dataProvider = grdMain.value.getDataProvider();
  const fieldName = grid.getColumn(field).fieldName
  // 수정된 필드가 'QUAR_YN'일 때만 처리
  if (fieldName === 'QUAR_YN') {
    const value = dataProvider.getValue(dataRow, 'QUAR_YN'); // 새 값 직접 조회
    const isNone = value === 'Y';


    updateReadonlyState(dataRow, isNone);

    if (isNone) {
      dataProvider.setValue(dataRow, 'QUAR_DT', '');
      dataProvider.setValue(dataRow, 'QUAR_TIME', '');
    }
  }
}

// 수정불가처리
const updateReadonlyState = (rowIndex, isEditable) => {
  console.log(rowIndex)
  grdMain.value.getGridView().setColumnProperty('QUAR_DT', 'editable', !isEditable)
  grdMain.value.getGridView().setColumnProperty('QUAR_TIME', 'editable', !isEditable)
}

// 파일첨부, 접촉자정보 팝업
const onCellItemClicked = (grid, index, col) => {
  const data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  const rowState = grdMain.value.getDataProvider().getRowState(index.dataRow);
  if (col.column === 'CNFM_PRF') {
    if (col.target.className === 'v-btn') {
      fileTitle.value = '확진증빙 파일첨부'
      selectedRow.value = index.dataRow
      fileUploadPopup.value.openPopup(data.FILE_ID)
    }
  } else if (col.column === 'CONTACT_INF') {
    if (rowState === "created") {
      Message.warn(t('신규 등록 행에서는 사용할 수 없습니다.'))
      return;
    }
    selectedRow.value = index.dataRow;
    hltla0020Popup.value.openPopup({ data })
  } else if (col.column === 'INFEC_NM' && rowState == 'created') { 
    selectedRow.value = index.dataRow; 
    console.log("Selected Row Index Set:", selectedRow.value);
    hltla0020Popup02.value.openPopup({ data })
  }
}

const uploaded = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return
  
  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    IDX_SEQ: data.IDX_SEQ,
    FILE_ID: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'HLTLA0020_SAVE_02', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}

//팝업 닫혔을때 조회
const filePopupClosed = () => {
  onButtonsClick({ id : 'btnSearch' })
}
const upData = () => {
  selectedRow.value = null;
  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().commit(); // 변경사항 커밋
}
const upData2 = (val) => {

  grdMain.value.getDataProvider().setValue(selectedRow.value, 'INFEC_SEQ', val.IDX_SEQ)
  grdMain.value.getDataProvider().setValue(selectedRow.value, 'INFEC_NM', val.INFEC_NM)
  grdMain.value.getGridView().commit(); // 변경사항 커밋
  grdMain.value.getGridView().checkItem(selectedRow.value, true)
}

//일괄 적용
const apply = () => {

const chkRows = grdMain.value.getGridView().getCheckedRows()

  console.log('chkRows ', chkRows)

  for (let i of chkRows) {
    if (selectParams.column == 'INSPEC_DT') {
      grdMain.value.getDataProvider().setValue(i, 'INSPEC_DT', selectParams.columnValue)
    } else if (selectParams.column == 'INSPEC_RN') { 
      grdMain.value.getDataProvider().setValue(i, 'INSPEC_RN', selectParams.columnValue)
    } else if (selectParams.column == 'SYMP_DT') { 
      grdMain.value.getDataProvider().setValue(i, 'SYMP_DT', selectParams.columnValue)
    } else if (selectParams.column == 'LAST_DT') { 
      grdMain.value.getDataProvider().setValue(i, 'LAST_DT', selectParams.columnValue)
    } else if (selectParams.column == 'CNFM_DT') { 
      grdMain.value.getDataProvider().setValue(i, 'CNFM_DT', selectParams.columnValue)
    } else if (selectParams.column == 'QUAR_DT') { 
      grdMain.value.getDataProvider().setValue(i, 'QUAR_DT', selectParams.columnValue)
    } else if (selectParams.column == 'PRO_STAT') { 
      grdMain.value.getDataProvider().setValue(i, 'PRO_STAT', selectParams.columnValue)
    } else if (selectParams.column == 'REMARK') { 
      grdMain.value.getDataProvider().setValue(i, 'REMARK', selectParams.columnValue)
    }
  }
}

// 일괄적용 초기화
watch(() => selectParams.column, (newVal, oldVal) => {
  selectParams.columnValue = ''; // 선택 컬럼이 바뀌면 값 초기화
});

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      CMPNY_DIV: '',
      BSNS_CD: '',
      DEPT_CD: '',
      ASGN_CD: '',
      EMP_NO: '',
      KOR_NM: '',
      JOB_TIT_NM: '',
      INFEC_NM: '',
      INSPEC_DT: '',
      INSPEC_RN: '',
      SYMP_DT: '',
      LAST_DT: '',
      CNFM_DT: '',
      QUAR_DT: '',
      QUAR_TIME: '',
      QUAR_YN: '',
      SYMP_DT: '',
      PRO_STAT: '',
      CNFM_PRF: '',
      CONTACT_INF: '등록',
      INFEC_SEQ: '',
      SAVE_YN: 'N',
    }, false)
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
      .setConfirmMessage('삭제할 경우 해당 인원의 접촉자 정보까지 모두 삭제됩니다. \n 삭제 하시겠습니까?')
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
  const dataProvider = grdMain.value.getDataProvider();
  const rowCount = dataProvider.getRowCount();

  for (let i = 0; i < rowCount; i++) {
    const isNone = dataProvider.getValue(i, 'QUAR_YN') === 'Y';
    updateReadonlyState(i, isNone);
  }
}

//  조회
const searchData = () => {
  console.log(searchParams)
  return commonSearchApi({ queryId: 'HLTLA0020_SEARCH_01', param: searchParams })
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
    } else if (isEmpty(data.INFEC_NM)) { 
      return Message.warn(t('감염병 종류는 필수 입력입니다.'))
    } else if (isEmpty(data.INSPEC_DT)) { 
      return Message.warn(t('검사일자는 필수 입력입니다.'))
    } else if (isEmpty(data.LAST_DT)) { 
      return Message.warn(t('마지막 출근일은 필수 입력입니다.'))
    } else if (isEmpty(data.CNFM_DT)) { 
      return Message.warn(t('확진일자는 필수 입력입니다.'))
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
  return commonExecuteApi({ queryId : 'HLTLA0020_SAVE_01', list: saveParams })
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
    console.log(rowIdx)
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    console.log(data)
    if(data.SAVE_YN == 'N') {
      continue
    }
    saveParams.push(data) 
  }
  console.log(saveParams)
  return commonExecuteApi({ queryId : 'HLTLA0020_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
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
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('사업부')"
              width="270px"
              margin="10px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              :readonly="!isAdmin"
            />

            <i-select
              :label="$t('부서')"
              width="300px"
              margin="10px"
              placeholder="부서"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :readonly="isEmpty(searchParams.BSNS_CD) || !isAdmin"
            />

            <i-select
              :label="$t('협력사')"
              width="270px"
              margin="10px"
              placeholder="협력사"
              v-model="searchParams.ASGN_CD"
              :items="codeList.asgnCd"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              :readonly="isEmpty(searchParams.DEPT_CD) || !isAdmin"
            />
          </div>
          <div class="d-flex mt-1" />
          <div class="d-flex mt-1">
            <i-select
              :label="$t('감염병 종류')"
              width="300px"
              margin="10px"
              placeholder="감염병 종류"
              v-model="searchParams.INFEC_NM"
              :items="codeList.allInfecList"
              item-value="COD"
              item-title="TXT"
            />

            <i-input
              :label="$t('확진 일자')"
              v-model="searchParams.ST_INSERT_DATE"
              type="Date"
              width="215px"
              margin="10px"
            />
            <i-input
              :label="$t('-')"
              v-model="searchParams.ED_INSERT_DATE"
              type="Date"
              width="160px"
              margin="10px"
            />

            <i-input
              :label="$t('확진자 이름')"
              v-model="searchParams.KOR_NM"
              type="text"
              label-width="80px"
              width="300px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <v-row no-gutters>
            <IGridTitle :title="$t('확진자 현황')" />
            <i-select
              v-model="selectParams.column"
              :items="codeList.columnList"
              item-value="COD"
              item-title="TXT" 
              label-width="40px"
              width="180px"
              :clearable="true"
              class="mb-2 ml-4"
            />
            <template v-if="selectParams.column === 'PRO_STAT'">
              <i-select
                v-model="selectParams.columnValue"
                :items="codeList.proStat"
                item-value="COD"
                item-title="TXT"
                label-width="40px"
                width="180px"
                class="mb-2"
              />
            </template>

            <template v-else-if="selectParams.column === 'INSPEC_DT'
                                ||selectParams.column === 'SYMP_DT'
                                ||selectParams.column === 'LAST_DT'
                                ||selectParams.column === 'CNFM_DT'
                                ||selectParams.column === 'QUAR_DT'">
              <i-input
                v-model="selectParams.columnValue"
                type="Date"
                width="180px"
                class="mb-2"
              />
            </template>

            <!-- 아닐 때는 일반 인풋박스 -->
            <template v-else>
              <i-input
                v-model="selectParams.columnValue"
                type="text" 
                label-width="40px"
                width="180px"
                class="mb-2"
              />
            </template>
            <v-btn @click="apply" color="primary">
              {{ t('일괄 적용') }}
            </v-btn>
          </v-row>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onCellItemClicked="onCellItemClicked"
            @onCellEdited="onCellEdited"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup
    ref="infecEmpPopup"
    @selected="selectedEmp"
  />
  <IUploadPopup ref="fileUploadPopup" :gridTitle="fileTitle" @uploaded="uploaded" @closed="filePopupClosed"/>
  <HLTLA0020Popup ref="hltla0020Popup" @upData="upData"/>
  <HLTLA0020Popup02 ref="hltla0020Popup02" @upData2="upData2"/>
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