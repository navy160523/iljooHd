<!-- 
  화면명 : 공정안전관리 감독/평가 결과
  화면개요 : 공정안전관리 감독/평가 결과
  작성자 : 황재욱
  작성일자 : 2025-06-26
-->
<script setup>
  import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
  import { useLogsStore } from '@hiway/stores/logs'
  import { useUserStore } from '@hiway/stores/user'
  import { isEmpty } from '@/@core/utils'
  import { useI18n } from 'vue-i18n'
  import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, getCompanyList } from '@hiway/api/commonApi'
  import ILabel from "@/components/ILabel.vue"
  import IMenuTitle from '@/components/IMenuTitle.vue'
  import { useRoute, useRouter } from 'vue-router'
  import RealGrid from '@/components/RealGrid.vue'
  import queryFlowHelper from '@/utils/searchFlowHelper'
  import saveFlowHelper from '@/utils/saveFlowHelper'
  import deleteFlowHelper from "@/utils/deleteFlowHelper"
  import dayjs from 'dayjs'
  import Message from '@hiway/utils/notify'
  import IUploadPopup from '@/components/popup/IUploadPopup.vue'
  import { useCommonStore } from '@hiway/stores/common'

  defineOptions({
  name:'50_safety-support-SPP_F-SPPFN0010',
})
  
  const vm = getCurrentInstance().proxy //다이얼로그관련
  const t = useI18n().t //다국어
  const userStore = useUserStore()
  const commonStore = useCommonStore()
  const isAdmin = ref(false)
  const router = useRouter()
  const menuTitle = ref(null)
  const fileUploadPopup = ref(null)
  const grdMain = ref(null)
  const saveParams = reactive([])
  const deleteParams = reactive([])
  let selectedRow = ref([])
  let selectedRow2 = ref([])
  let fileCheck = null
  let upFlag = false

  const searchParams = reactive({
    YEAR_FROM: Number(dayjs().get('year')) - 5,
    YEAR_TO: dayjs().get('year'),
  })
  
  const codeList = reactive({
    CONTENT: [
      { COD: 'A', TXT: '고용노동부 안전보건감독' },
      { COD: 'B', TXT: '공정안전보고서 이행상태 평가' },
      { COD: 'C', TXT: '등급평가' },
      { COD: 'D', TXT: '기술지도' },
      { COD: 'Z', TXT: '' }, 
    ],
  })


  const grd1Props = reactive({
    gridViewOption : { checkBar: { visible: true }, display: { selectionStyle: 'rows', useFocusClass: true} , rowIndicator: { visible: true },},
    keys : [],
    fields: [
  { 
    fieldName: 'YEAR',
    editable: false,
    dataType: 'text',
    width:'40',
    styleName: 'center-column',
    editor: { type: 'text', maxLength: 4,},
    header: { text: t('연도') },
    styleCallback(grid, dataCell) {
      const rowIdx = dataCell.index.itemIndex
      const isNew  = grid.getValue(rowIdx, 'NEW') === 'Y'
      const ret = {
        editable : isNew,
        styleName: isNew ? 'editable_column center-column'
                          : 'center-column'
      }
      return ret
    },
  },
  {
    fieldName: 'CONTENT_CD',
    dataType: 'text',
    styleName: 'editable_column left-column',
    width:'150',
    header: { text: t('내용') },

    values: codeList.CONTENT.filter(c => c.COD !== 'Z').map(c => c.COD),
    labels: codeList.CONTENT.filter(c => c.COD !== 'Z').map(c => c.TXT), 
    lookupDisplay: true,

    editor: {
      type : 'dropdown',
      maxLength: 100,
      textReadOnly: false,
      domainOnly       : true,
      dropDownWhenClick: true,
      partialMatch     : true,
    },
    styleCallback(grid, dataCell) {
      const ret    = { editable: true, styleName: 'editable_column left-column' }
      const rowIdx = dataCell.index.itemIndex
      const file1  = grid.getValue(rowIdx, 'FILE1')

      if (file1 === 'Y') {
        ret.editable  = false
        ret.styleName = 'left-column'
      }

      return ret
    },
  },

  { fieldName: 'EXEC_ST_DT',width:'40',  dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column center-column', header: { text: t('시작') },  
    editor: { type: 'date', showCalendarButton: true, commitOnSelect: true, textReadOnly: true } },
  { fieldName: 'EXEC_ED_DT',width:'40',  dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column center-column', header: { text: t('완료') }, 
    editor: { type: 'date', showCalendarButton: true, commitOnSelect: true, textReadOnly: true } },
  {
    fieldName: 'WRITE',
    dataType: 'text',
    styleName: 'editable_column center-column',
    width:'40',
    header: { text: t('결과') },
    editable: false,
    renderer: {
  type: "html",
  callback: function (grid, cell, w, h) {
    const row       = grid.getValues(cell.index.itemIndex)
    const file1    = row.FILE1
    const contentCd = row.CONTENT_CD
    let buttonHtml = ""
    if (row.NEW !== "Y") {
      if (contentCd === "B") {
        buttonHtml = `
          <button
            class="v-btn"
            style="color:#fff; background:#8e8b8b; padding:4px 12px; min-width:80px;"
          >
            자체감사 링크
          </button>
        `
      }
      else {
        const btnLabel = file1 === 'Y' ? "첨부 완료" : "첨부"
        const btnColor = file1 === 'Y' ? "#008000" : "#1a40c7"
        buttonHtml = `
          <button
            class="v-btn"
            style="color:#fff; background:${btnColor}; padding:4px 12px; min-width:80px;"
          >
            ${btnLabel}
          </button>
        `
      }
    }
    return `
      <div style="display:flex; align-items:center; justify-content:center;">
        ${buttonHtml}
      </div>
    `
  },
}
  },
  { fieldName: 'REMARKS', width:'150', styleName: 'editable_column left-column', dataType: 'text',  editor: { type: 'text',maxLength: 100,}, header: { text: t('비고') }, },
  // 안보이는거
  { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('파일아이디') }, visible: false,},
  { fieldName: 'CONTENT_NM', dataType: 'text', header: { text: t('내용명') },visible: false, },
  { fieldName: 'INSERT_USER_ID', dataType: 'text', header: { text: t('작성자') },visible: false, },
  { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('작성일') },visible: false, },
  { fieldName: 'UPDATE_USER_ID', dataType: 'text', header: { text: t('수정자') },visible: false, },
  { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일') },visible: false, },
  { fieldName: 'SEQ_NO', dataType : 'text', header: { text: t('SEQ_NO') },visible: false, },
  { fieldName: 'NEW', dataType: 'text', header: { text: t('NEW') }, visible: false, },
  { fieldName: 'FILE1', dataType: 'text', header: { text: t('파일여부') }, visible: false, },
    ],

    columnLayout: [
    { 
      name: '구분', 
      styleName: 'multiline-editor-pre', 
      direction: 'horizontal', 
      items: ['YEAR', 'CONTENT_CD'], header: { text: t('구분') } 
    },
    {
      name: '실시', 
      styleName: 'multiline-editor-pre', 
      direction: 'horizontal', 
      items: ['EXEC_ST_DT', 'EXEC_ED_DT'], header: { text: t('실시') } 
    },
      'WRITE',
      'REMARKS'
    ],
    columns : [],
  })
  
  grd1Props.columns = grd1Props.fields
  

  const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
  }else if (btn.id === "btnCreate") {
    addData()
  }else if (btn.id === "btnUpdate") {
    if(upFlag){
      new saveFlowHelper(vm, t)
      .showMessage(false)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterUpdate)
      .run()
  }else{
      new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterUpdate)
      .run()
  }
}else if (btn.id === "btnDelete") {
  const gridView     = grdMain.value.getGridView();
  const dataProvider = grdMain.value.getDataProvider();

  const checkedRows = gridView.getCheckedRows(true);

  checkedRows.forEach(rowIdx => {
    const row = dataProvider.getJsonRow(rowIdx);
    // console.log(`rowIdx=${rowIdx}, FILE1=${row.FILE1}`);
  });

  const hasAttachedFile = checkedRows.some(rowIdx => {
    const row = dataProvider.getJsonRow(rowIdx);
    return row.FILE1 === 'Y';
  });
  // console.log(`hasAttachedFile=${hasAttachedFile}`);

  const helper = new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(afterDelete);

  if (hasAttachedFile) {
    helper.setConfirmMessage(
      '<span style="color:red">첨부된 파일이 전부 삭제될 수 있습니다.</span><br>정말 삭제하시겠습니까?'
    );
  }

  // 6) 실행
  helper.run();
}

}

const beforeSave = () => {
  const gv = grdMain.value.getGridView()
  const dp = grdMain.value.getDataProvider()
  const checkedRows = gv.getCheckedRows()

  if (checkedRows.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }

  gv.commit()
  saveParams.length = 0

  for (const rowIdx of checkedRows) { // 아래 로직은 realGrid renderer가 먹지 않아 수정한 내용입니다
    const rowData  = dp.getJsonRow(rowIdx)
    const rawInput = (rowData.CONTENT_CD || '').trim()

    const byCd   = codeList.CONTENT.find(c => c.COD === rawInput)
    const byText = codeList.CONTENT.find(c => c.TXT === rawInput)

    if (byCd) {                            // 코드(A‥D) 그대로 입력
      rowData.CONTENT_CD = byCd.COD
      rowData.CONTENT_NM = null
    } else if (byText) {                   // 라벨(한글) 입력 → 코드로 치환
      rowData.CONTENT_CD = byText.COD
      rowData.CONTENT_NM = null
    } else {                               // 표에 없는 아무 값 → Z 처리
      rowData.CONTENT_CD = 'Z'
      rowData.CONTENT_NM = rawInput
    }
    if (!rowData.YEAR) {
      gv.setCurrent({ itemIndex: rowIdx, column: 'YEAR' })
      Message.warn(t('연도를 입력하세요.'))
      return false
    }
    if (!/^\d+$/.test(rowData.YEAR)) {
      gv.setCurrent({ itemIndex: rowIdx, column: 'YEAR' })
      Message.warn(t('연도를 올바르게 적어주세요.'))
      return false
    }
    if (!rawInput) {
      gv.setCurrent({ itemIndex: rowIdx, column: 'CONTENT_CD' })
      Message.warn(t('내용을 입력하세요.'))
      return false
    }
    if (!rowData.EXEC_ST_DT) {
      gv.setCurrent({ itemIndex: rowIdx, column: 'EXEC_ST_DT' })
      Message.warn(t('실시 시작일을 입력하세요.'))
      return false
    }
    if (!rowData.EXEC_ED_DT) {
      gv.setCurrent({ itemIndex: rowIdx, column: 'EXEC_ED_DT' })
      Message.warn(t('실시 완료일을 입력하세요.'))
      return false
    }
    if (new Date(rowData.EXEC_ED_DT) < new Date(rowData.EXEC_ST_DT)) {
      gv.setCurrent({ itemIndex: rowIdx, column: 'EXEC_ED_DT' })
      Message.warn(t('실시 완료일이 실시 시작일보다 빠를 수 없습니다'))
      return false
    }
    saveParams.push({
      SEQ_NO     : rowData.SEQ_NO,
      YEAR       : rowData.YEAR,
      CONTENT_CD : rowData.CONTENT_CD,
      CONTENT_NM : rowData.CONTENT_CD === 'Z' ? rowData.CONTENT_NM : null,
      EXEC_ST_DT : dayjs(rowData.EXEC_ST_DT).format('YYYYMMDD'),
      EXEC_ED_DT : dayjs(rowData.EXEC_ED_DT).format('YYYYMMDD'),
      FILE_ID    : rowData.FILE_ID,
      USER_ID    : userStore.userId,
      REMARKS    : rowData.REMARKS,
    })
  }
  return true
}


const saveData = () => {
  return commonExecuteApi({ queryId : 'SPPFN0010_SAVE_01', list: saveParams })
}

const afterUpdate = ()=>{
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
  upFlag = false
  NEW = 'N'
}

const beforeDelete = () => {
  const gv = grdMain.value.getGridView()
  const dp = grdMain.value.getDataProvider()
  const checkedRows = gv.getCheckedRows()
  if (checkedRows.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  gv.commit()
  deleteParams.length = 0
  for (const rowIdx of checkedRows) {
    const rowData = dp.getJsonRow(rowIdx)
    if (!rowData.SEQ_NO) { 
      gv.setCurrent({ itemIndex: rowIdx, column: 'YEAR' })
      Message.warn(t('저장되지 않은 행은 삭제할 수 없습니다.'))
      return false
    }
  }

  return true
}
const deleteData = () => {
  const gv = grdMain.value.getGridView()
  const dp = grdMain.value.getDataProvider()
  const checkedRows = gv.getCheckedRows(true)

  const deleteParams = checkedRows.map(rowIdx => {
    const row = dp.getJsonRow(rowIdx)

    const input = (row.CONTENT_CD || '').trim()
    const byCd   = codeList.CONTENT.find(c => c.COD === input)
    const byText = codeList.CONTENT.find(c => c.TXT === input)

    let cd, nm
    if (byCd) {
      cd = byCd.COD
      nm = null
    } else if (byText) {
      cd = byText.COD
      nm = null
    } else {
      cd = 'Z'
      nm = input
    }

    return {
      YEAR      : row.YEAR,
      CONTENT_CD: cd,
      CONTENT_NM: nm,
      SEQ_NO    : row.SEQ_NO,
    }
  })

  return commonExecuteApi({
    queryId: 'SPPFN0010_DELETE_01',
    list   : deleteParams,
  })
}

const afterDelete = () => {
  afterUpdate()
}


const searchData = () => {
  return commonSearchApi({
    queryId: 'SPPFN0010_SEARCH_01',
    param: searchParams,
  })
}
const afterSearch = (res) => {
  const processed = res.ORESULT_CUR.map(row => {
    if (row.CONTENT_CD === 'Z') {
      return {
        ...row,
        CONTENT_CD: row.CONTENT_NM || '',
      }
    }
    return row
  })
  grdMain.value.getDataProvider().setRows(processed)
}



const addData = () => {

const today = new Date()
const yyyy  = today.getFullYear()
const mm    = String(today.getMonth() + 1).padStart(2, '0')
const dd    = String(today.getDate()).padStart(2, '0')

const defaultValues = {
  INSERT_USER_ID: userStore.userId,
  YEAR: yyyy.toString(),
  CONTENT_NM: '',
  EXEC_ST_DT: '',
  EXEC_ED_DT: `${yyyy}-${mm}-${dd}`,
  FILE_ID: '',
  REMARKS: '',
  NEW: 'Y'
}

grdMain.value.getDataProvider().insertRow(0, defaultValues)
grdMain.value.getGridView().checkItem(0, true)
}

const uploaded = async (val) => { 
  fileCheck = val.fileId
    upFlag = true
    grdMain.value.getDataProvider().setValue(
      selectedRow2.value,
      'FILE_ID',
      fileCheck 
      )
      const rowIdx = selectedRow2.value
      grdMain.value.getGridView().checkItem(rowIdx, true)
      
    onButtonsClick({ id: 'btnUpdate' })
  }



onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  // 안전 PSM 담당자
  if(useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes('SPPF001') || 
    userStore.authGrpCd.includes('SPPF002') || 
    userStore.authGrpCd.includes('HIWAYGRP00001')) {
      isAdmin.value = true
  }

  nextTick(() => { 
  grdMain.value.getGridView().onCellItemClicked = function (grid, itemIndex, column) {
    if(column.fieldName === 'WRITE'){  
      const rowData = grdMain.value.getDataProvider().getJsonRow(itemIndex.dataRow)
      selectedRow2.value = itemIndex.dataRow
      if (rowData.CONTENT_CD === 'B') {
        router.push({ path: '/50_safety-support/SPP_F/SPPFK0010' })
      }
      else if (rowData.NEW !== 'Y' && rowData.YEAR && rowData.CONTENT_CD) {
        fileUploadPopup.value.openPopup(rowData.FILE_ID)
      }
      else {
        Message.warn(t('데이터 저장 후 파일 업로드 해야합니다.'))
      }
    }
  }
})
})  

watch(() => searchParams.YEAR_FROM, (newValue, oldValue) => {
  if(searchParams.YEAR_FROM > searchParams.YEAR_TO) {
    nextTick(() => {
      searchParams.YEAR_FROM = searchParams.YEAR_TO
    })
  }
})

watch(() => searchParams.YEAR_TO, (newValue, oldValue) => {
  if(searchParams.YEAR_TO < searchParams.YEAR_FROM) {
    nextTick(() => {
      searchParams.YEAR_TO = searchParams.YEAR_FROM
    })
  }
})
</script>

<template>
  <v-card class="pa-0 fill-height">  
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
      ref="menuTitle"
      :button-list="['btnSearch','btnCreate','btnUpdate','btnDelete']"
      @click-button="onButtonsClick"
      :title="$t(useLogsStore().menuId)"
    />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <div class="d-flex">
            <i-select
              v-model="searchParams.YEAR_FROM"
              :label="$t('년도')"
              type="YEAR"
              width="250px"
            />
            <i-select
              v-model="searchParams.YEAR_TO"
              :label="$t('~')"
              type="YEAR"
              width="250px"
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
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
  <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded" />
</template>
  
<style scoped lang="scss">
  
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 50px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>