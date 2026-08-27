<!-- 
  화면명 : 엑셀 업로드 테이블 저장
  화면개요 : 엑셀에 있는 데이터들을 db에 저장한다.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'

defineOptions({
  name:'00_sample-ExcelDBUpload', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)
const grdField = ref([])

// 조회조건
const searchParams = reactive({
  TABLE_NAME: ''
})

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [],
  
})

/*  공통코드 세팅 */
onMounted(() => {

  grdMain.value.getGridView().filterPanel.visible = true

})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }, },
  keys : [], 
  columns : [],
})

grd1Props.columns = grd1Props.fields
 
// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {

  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      
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
    grdMain.value.getDataProvider().removeRows(grdMain.value.getGridView().getCheckedRows(true))
  } else if (btn.id === 'btnExcelDownload') {
    let params = {
      FILE_PATH: 'SAMPLE',
      FILE_NAME: 'excleUploadTest.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelUpload') {
    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  }
}

// 그리드 헤더 설정
const setGrdHeader = (col) => {
  grdField.value.push({ fieldName: col, width: '80', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t(col) } },)

  grdMain.value.getDataProvider().setFields(grdField.value)
  grdMain.value.getGridView().setColumns(grdField.value)
}

// 저장 전
const beforeSave = async () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let columns = ''
  for(var field of grdField.value) {
    columns += '\'' + field.fieldName + '\','
  }
  columns = columns.slice(0,-1)
  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  } else if (isEmpty(searchParams.TABLE_NAME)) {
    return Message.warn(t('테이블 명이 없습니다.'))
  }

  let tableData = await Promise.all([commonSearchApi({ queryId: 'EXCELINSERT_SEARCH_01', param: { TABLE_NAME: searchParams.TABLE_NAME, COLUMNS: columns} }),])
  if(isEmpty(tableData[0].ORESULT_CUR)) {
    return Message.warn(t('테이블 명을 확인해주십시오.'))
  } else if (grdField.value.length != tableData[0].ORESULT_CUR.length) {
    return Message.warn(t('컬럼명을 확인해주십시오.'))
  }
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let columns = ''
  for(var field of grdField.value) {
    columns += field.fieldName + ','
  }
  columns = columns.slice(0,-1)
  for (let rowIdx of checkedRows) {
    let saveData = {
      TABLE_NAME: searchParams.TABLE_NAME,
      TABLE_COLUMNS: columns,
      VALUE_LIST: ''
    }

    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    for(var dt in data) {
      saveData.VALUE_LIST += '\'' + data[dt] + '\','
    }
    saveData.VALUE_LIST = saveData.VALUE_LIST.slice(0,-1)
    saveParams.push(saveData)
  }
  return commonExecuteApi({ queryId : 'EXCELINSERT_SAVE_01', list: saveParams })
}

// 저장 후
const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {  
  grdMain.value.getGridView().filterPanel.clearInput()
  grdField.value = []
  excelData.map(item => {
    for(var key in item) {
      if(isEmpty(grdField.value.find(field => field.fieldName == key))) {
        setGrdHeader(key)
      }
    }
    grdMain.value.addRow(item)
  })
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
        :button-list="['btnCreate', 'btnUpdate', 'btnDelete', 'btnExcelDownload', 'btnExcelUpload']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.TABLE_NAME"
            label-width="70px"
            :label="$t('테이블 명')"
            width="200px"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grdField"
            :columns="grd1Props.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
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