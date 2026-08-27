<!-- SPPFK0010 자체감사 시정조치 -->
<!-- SI2팀 손상규 2025-06-16 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest2 } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IGridTitle from '@/components/IGridTitle.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import { getJsonFromExcel } from "@/utils/excel"
import { useCommonStore } from '@hiway/stores/common'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const commonStore = useCommonStore()

const menuTitle = ref(null)
const grdMain = ref(null)
const selectedRow = ref(null)

//파일업로드 팝업
const corrImgPopup = ref(null) 
const corrImgTitle = ref('')
const imprImgPopup = ref(null) 
const imprImgTitle = ref('')

// 조회조건
const searchParams = reactive({
  YEAR: String(dayjs().get('year')),
  BSNS_CD: userStore.bsnsCd || '',
  DEPT_CD: userStore.deptCd || '',
})

const codeList = reactive({
})

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true

  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    })
  ]).then((res) => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    grdMain.value.setBindingColumn('DEPT_CD', codeList.deptCd, 'DEPT_CD', 'DEPT_NM')
  })

  // grdMain.value.getGridView().setColumnProperty('CORR_IMG', 'styleCallback', (grid, cell) => {
  //   const rowData = grid.getValues(cell.index.dataRow);
  //   return rowData.SAVE_YN === 'N' ? 'center-column' : null;
  // });

  // grdMain.value.getGridView().setColumnProperty('IMPR_IMG', 'styleCallback', (grid, cell) => {
  //   const rowData = grid.getValues(cell.index.dataRow);
  //   return rowData.SAVE_YN === 'N' ? 'center-column' : null;
  // });
}
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

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true }, header: { height: 60 } },
  keys : [],
  fields: [ 
    { fieldName: 'DEPT_CD', width: '150', styleName: 'center-column', dataType: 'text', header: { text: t('부서') }, editable: false, lookupDisplay: true },
    { fieldName: 'ITEM', width: '200', styleName: 'editable_column center-column', dataType: 'text', header: { text: t('항목') }, editable: true },
    {
      fieldName: 'CORR_DESC', width: '300', styleName: 'editable_column left-column multiline-editor', dataType: 'text', header: { text: t('내용') }, editable: true,
      editor: {
        type: "multiline"
      }
    },
    {
      fieldName: 'CORR_IMG', width: '200', styleName: 'center-column', dataType: 'text', header: { text: t('사진') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'CORR_COUNT');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else {
            const a = '등록'
            const b = '미등록'
            if (value > 0) {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <span style="color: green; font-weight: bold;">${a}</span> 
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >첨부</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
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
    {
      fieldName: 'IMPR_DESC', width: '300', styleName: 'editable_column left-column multiline-editor', dataType: 'text', header: { text: t('내용') }, editable: true,
      editor: {
        type: "multiline"
      }
    },
    {
      fieldName: 'IMPR_IMG', width: '200', styleName: 'center-column', dataType: 'text', header: { text: t('사진') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'IMPR_COUNT');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          if (rowState === 'created') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else {
            const a = '등록'
            const b = '미등록'
            if (value > 0) {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <span style="color: green; font-weight: bold;">${a}</span> 
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >첨부</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
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
    { fieldName: 'REMARK', width: '300', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('비고') }, editable: true },
    // 안보이는거
    { fieldName: 'SEQ', dataType: 'number', header: { text: t('시퀀스') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장FLAG') }, editable: false, visible: false },
    { fieldName: 'CORR_COUNT', dataType: 'number', visible: false },
    { fieldName: 'IMPR_COUNT', dataType: 'number', visible: false },
  ],
  columns: [],
  columnLayout: [
    'DEPT_CD',
    'ITEM',
    {
      name:'시정항목',
      direction: 'horizontal',
      items: ['CORR_DESC', 'CORR_IMG'],
      header: {text : t('시정항목')}
    },
    {
      name:'개선조치 결과(사진 등)',
      direction: 'horizontal',
      items: ['IMPR_DESC', 'IMPR_IMG'],
      header: {text : t('개선조치 결과(사진 등)')}
    },
    'REMARK'
  ],
})

grd1Props.columns = grd1Props.fields

// 파일첨부 팝업
const onCellItemClicked = (grid, index, col) => {
  const data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if (col.column === 'CORR_IMG') {
    if (col.target.className === 'v-btn') {
      corrImgTitle.value = '시정항목 파일첨부'
      selectedRow.value = index.dataRow
      corrImgPopup.value.openPopup(data.CORR_IMG)
    }
  } else if (col.column === 'IMPR_IMG') {
    if (col.target.className === 'v-btn') {
      imprImgTitle.value = '개선조치 결과 파일첨부'
      selectedRow.value = index.dataRow
      imprImgPopup.value.openPopup(data.IMPR_IMG)
    }
  } 
}

const uploadCorrImg = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return
  
  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    SEQ: data.SEQ,
    YEAR: data.YEAR,
    DEPT_CD: data.DEPT_CD,
    CORR_IMG: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFK0010_SAVE_02', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}
const uploadImprImg = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return
  
  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    SEQ: data.SEQ,
    YEAR: data.YEAR,
    DEPT_CD: data.DEPT_CD,
    IMPR_IMG: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFK0010_SAVE_03', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}

//팝업 닫혔을때 조회
const filePopupClosed = () => {
  onButtonsClick({ id : 'btnSearch' })
}

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnExcelUpload') {
    if (searchParams.BSNS_CD == '') {
      Message.warn(t('사업부를 선택해주세요.'))
      return
    } else if (searchParams.DEPT_CD == '') {
      Message.warn(t('부서를 선택해주세요.'))
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = function(event) {
      commonStore.loading = true
      const selectedFile = event.target.files[0]
      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  } else if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    if (searchParams.BSNS_CD == '') {
      Message.warn(t('사업부를 선택해주세요.'))
      return
    } else if (searchParams.DEPT_CD == '') {
      Message.warn(t('부서를 선택해주세요.'))
      return
    }
    nextTick(() => {
      grdMain.value.getGridView().filterPanel.clearInput()
      grdMain.value.addRow({
        YEAR: searchParams.YEAR,
        BSNS_CD: searchParams.BSNS_CD || '',
        DEPT_CD: searchParams.DEPT_CD || '',
        ITEM: '',
        CORR_DESC: '',
        CORR_IMG: '',
        IMPR_DESC: '',
        IMPR_IMG: '',
        REMARK: '',
        SAVE_YN: 'N',
      }, false)
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
    let saveParams = []
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      saveParams.push(data)
    }
    const hasPhotos = saveParams.some(row => !!row.CORR_IMG || !!row.IMPR_IMG);

    const confirmMessage = hasPhotos
      ? '삭제시 해당 항목의 사진이 모두 삭제됩니다.\n삭제 하시겠습니까?'
      : '삭제 하시겠습니까?';

    new deleteFlowHelper(vm, t)
      .setConfirmMessage(confirmMessage)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnPrint') {
    commonStore.loading = true
    commonRequest2('hse/excel/SPPFK0010_EXCEL', searchParams).then((res) => {
      commonStore.loading = false

      const blob = new Blob([res], { type: res.type })
      
      const link = document.createElement('a')
      
      const fileName =  `${searchParams.YEAR}년도 PSM 자체감사 - 보고완료 -보고`

      link.href = URL.createObjectURL(blob)

      link.download = fileName
      link.click()
      URL.revokeObjectURL(link.href)
    })
  } 
}

const excelUploadCallback = async (excelData) => {
  const selectedDeptCd = searchParams.DEPT_CD
  const deptList = codeList.deptCd
  const selectedDept = deptList.find(d => d.DEPT_CD === selectedDeptCd)
  const selectedDeptNm = selectedDept?.DEPT_NM || ''

  const filteredData = excelData.slice(1) // 첫 줄 제거

  // 모든 행의 부서가 선택된 부서와 같은지 검증
  const invalidRow = filteredData.find(item => {
    const excelDeptNm = (item['부서'] || '').trim()
    return excelDeptNm !== selectedDeptNm
  })

  if (invalidRow) {
    commonStore.loading = false
    Message.warn(t('해당 자료의 부서가 선택하신 부서와 다릅니다.'))
    return
  }

  const dp = grdMain.value.getDataProvider()
  dp.setRows([]) // 기존 데이터 초기화

  const newRows = filteredData.map((item, index) => {
    const excelDeptNm = (item['부서'] || '').trim()
    const matchedDept = deptList.find(item => item.DEPT_NM.trim().toLowerCase() === excelDeptNm.toLowerCase())

    return {
      YEAR: searchParams.YEAR,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: matchedDept ? matchedDept.DEPT_CD : '',
      ITEM: item['항 목'] || '',
      CORR_DESC: item['시정항목'] || '',
      CORR_IMG: null,
      IMPR_DESC: item['개선조치 결과(사진 등)'] || '',
      IMPR_IMG: null,
      REMARK: item['비 고'] || '',
      SAVE_YN: 'N'
    }
  })

  dp.setRows(newRows)

  newRows.forEach((_, index) => {
    dp.setRowState(index, 'created');
    grdMain.value.getGridView().checkRow(index, true);
  });
  commonStore.loading = false
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
  return commonSearchApi({ queryId: 'SPPFK0010_SEARCH_01', param: searchParams })
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
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPFK0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'SPPFK0010_DELETE_01', list: saveParams })
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
        :button-list="['btnExcelUpload', 'btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex"> 
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('년도')"
              label-width="30px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT" 
              width="150px"
            />

            <i-select
              :label="$t('사업부')"
              width="270px"
              margin="10px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
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
              :readonly="isEmpty(searchParams.BSNS_CD)"
            />
          </div>
        </v-sheet>
        <RealGrid
          ref="grdMain"
          :grid-view-option="grd1Props.gridViewOption"
          :keys="grd1Props.keys" 
          :fields="grd1Props.fields"
          :columns="grd1Props.columns"
          :column-layout="grd1Props.columnLayout"
          @onCellItemClicked="onCellItemClicked"
        />
      </div>
    </v-card-text>
  </v-card>
  <IUploadPopup ref="corrImgPopup" :gridTitle="corrImgTitle" @uploaded="uploadCorrImg" @closed="filePopupClosed"/>
  <IUploadPopup ref="imprImgPopup" :gridTitle="imprImgTitle" @uploaded="uploadImprImg" @closed="filePopupClosed"/>
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

.multiline-text {
  white-space: normal !important;    /* 중요: 줄바꿈 문자 없어도 자동 줄바꿈 */
  word-break: break-word;            /* 단어 잘라서 줄바꿈 */
  line-height: 1.4;
}

</style>