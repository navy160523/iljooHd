<!-- 
  화면명 : 작업환경측정 공정관리
  화면개요 : 공정관리
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
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'
import CopyPopup from '@/pages/100_health/HLT_F/HLTFA0010Popup01.vue'

defineOptions({
  name:'100_health-HLT_F-HLTFA0010', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const copyPopup = ref(null)

// 조회조건
const searchParams =reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: Number(dayjs().get('month')) > 6 ? 'LO' : 'HI',
  YEAR: String(dayjs().get('year')),
  PROCESS_NM: '',
  PROCESS_CONT: '',
})

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [],
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  if(useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes('HLTF001') || 
    userStore.authGrpCd.includes('HIWAYGRP00001') ||
    userStore.authGrpCd.includes('GRP00372')) {
      isAdmin.value = true
  }

  onButtonsClick({ id: 'btnSearch' })

  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }
  Promise.all([
    // 상하반기
    getCodeList('HHII800')
  ]).then((res) => {
    codeList.HALF_DIV = res[0].ORESULT_CUR
  })
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 

    { fieldName: 'YEAR', width: '40', dataType: 'text', editable: false, header: { text: t('년도') } },
    { fieldName: 'HALF_DIV', width: '50', editable: false, dataType: 'text', header: { text: t('상하반기 구분') }, lookupDisplay: true },
    { fieldName: 'PROCESS_CD', width: '100', styleName: 'editable_column', dataType: 'text', header: { text: t('공정코드') } },
    { fieldName: 'PROCESS_NM', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('공정명') } },
    { fieldName: 'PROCESS_CONT', width: '250', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('공정설명') } },
    { fieldName: 'USE_YN', width: '40', editable: false, dataType: 'text', header: { text: t('사용유무') }, styleName: 'change_back_check', renderer: { type: "check", trueValues: 'Y', falseValues: 'N' } },
    { fieldName: 'INSERT_DATE', width: '60', dataType: 'text', editable: false, header: { text: t('등록일자') } },
    { fieldName: 'UPDATE_DATE', width: '60', dataType: 'text', editable: false, header: { text: t('변경일자') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isAdmin.value) {
    Message.warn(t('관리자만 사용가능합니다.'))
    return
  }

  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: searchParams.YEAR,
      HALF_DIV: searchParams.HALF_DIV,
      PROCESS_CD: '',
      PROCESS_NM: '',
      PROCESS_CONT: '',
      USE_YN: 'Y',
    }, false)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnCopy') {
    copyPopup.value.openPopup(searchParams, 'HLTFA0010_SEARCH_02', 'HLTFA0010_SAVE_02')
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnFormDownload') {
    let params = {
      FILE_PATH: 'HLTF',
      FILE_NAME: '작업환경측정 공정관리 샘플.xlsx',
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
const getData = () => {
  if(!isAdmin.value) {
    Message.warn(t('관리자만 사용가능합니다.'))
    return
  }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTFA0010_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
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
    if(isEmpty(data.PROCESS_CD)) {
      Message.warn(t('공정코드는 필수 입력입니다.'))
      return false
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
  return commonExecuteApi({ queryId : 'HLTFA0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    let deletePossible = await commonSearchApi({ queryId : 'HLTFA0010_SEARCH_03', param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        YEAR: searchParams.YEAR,
        HALF_DIV: searchParams.HALF_DIV,
        PROCESS_CD: data.PROCESS_CD
    } })
    if(isEmpty(deletePossible) || isEmpty(deletePossible.ORESULT_CUR) || deletePossible.ORESULT_CUR[0].DELETE_POSSIBLE == 'Y') {
      Message.err(t('기초정보관리에서 사용중인 공정코드 입니다. 삭제불가. 공정명: ' + data.PROCESS_NM))
      continue
    }

    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTFA0010_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {  
  grdMain.value.getGridView().filterPanel.clearInput()
  excelData.map(item => {
    grdMain.value.addRow({
      PROCESS_CD: item.공정코드,
      PROCESS_NM: item.공정명,
      PROCESS_CONT: item.공정설명,
      YEAR: searchParams.YEAR,
      HALF_DIV: searchParams.HALF_DIV,
      CMPNY_DIV: searchParams.CMPNY_DIV,
      USE_YN: 'Y'
    },false)
  })
}

watch(() => searchParams.YEAR, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.HALF_DIV, (newValue, oldValue) => {
  getData()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnCopy', 'btnFormDownload', 'btnExcelUpload']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('해당년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.HALF_DIV"
            :label="$t('반기구분')"
            label-width="50px"
            :items="codeList.HALF_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-input
            :label="$t('공정명')"
            v-model="searchParams.PROCESS_NM"
            label-width="40px"
            type="text"
            width="200px"
            @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
          />
          <i-input
            :label="$t('공정설명')"
            v-model="searchParams.PROCESS_CONT"
            label-width="50px"
            type="text" 
            width="200px"
            @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
          />
          
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
          />
        </v-sheet>
      </div>
      <!-- 팝업존 -->
      <CopyPopup ref="copyPopup" @after-search="onButtonsClick({ id:'btnSearch' })"/>
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