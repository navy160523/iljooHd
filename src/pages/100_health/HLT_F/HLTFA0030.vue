<!-- 
  화면명 : 작업환경측정 일정관리
  화면개요 : 일정관리
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
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'

defineOptions({
  name:'100_health-HLT_F-HLTFA0030', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: Number(dayjs().get('month')) > 6 ? 'LO' : 'HI',
  YEAR: String(dayjs().get('year')),
  REG_DIV: 'A',
  ORGN_DIV: '',
  TAGET_DIV: 'Y',
})

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  ORGN_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '협력사' },
  ],
  CHK_PERI_YN: [
    { COD: 'Y', TXT: '적합' },
    { COD: 'N', TXT: '부적합' },
  ],
  STATUS: [],
  BSNS_CD: [],
  DEPT_CD: []
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
  grdMain.value.getGridView().filterPanel.visible = true

  Promise.all([
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV } }),
    // 부서
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_DEPT', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
    // 상하반기
    getCodeList('HHII800'),
    // 진행상태
    getCodeList('HHII804'),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.HALF_DIV = res[2].ORESULT_CUR
    codeList.STATUS = res[3].ORESULT_CUR
    grdMain.value.setBindingColumn('BSNS_CD', codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_NM', codeList.DEPT_CD, 'DEPT_CD', 'DEPT_NM')
    grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
    grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
  })
  grdMain.value.setBindingColumn('REG_DIV', codeList.REG_DIV, 'COD', 'TXT')
  grdMain.value.setBindingColumn('CHK_PERI_YN', codeList.CHK_PERI_YN, 'COD', 'TXT')
})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_CD', width: '60', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('사업부') }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'DEPT_NM', width: '60', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('부서명') }, editor: { type: 'dropdown' }, lookupDisplay: true, 
      'styleCallback': function(grid, dataCell){
        var ret = { style: { background:undefined } }
        if(grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'C') {
          ret.style.background = '#E13030'
        } else if(grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'B') {
          ret.style.background = '#FFFF00'
        }
        return ret
      }
    },
    { fieldName: 'DEPT_CD', width: '40', editable: false, dataType: 'text', header: { text: t('부서코드') } },
    { fieldName: 'LAST_WRK_CHK_DATE', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('이전측정일') },
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
    },
    { fieldName: 'PRE_SUR_DATE', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('예비조사 예정일') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#5AC6D0' } }
      }
    },
    { fieldName: 'SCH_CHK_DATE', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('측정예정일') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#00A6A9' } }
      }
    },
    { fieldName: 'PRE_SUR_DATE2', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('예비조사일') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#5DC19B' } }
      }
    },
    { fieldName: 'WRK_CHK_DATE1', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('1차') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#E4E1DF' } }
      }
    },
    { fieldName: 'WRK_CHK_DATE2', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('2차') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#BFC4A4' } }
      }
    },
    { fieldName: 'WRK_CHK_DATE3', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('3차') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#98AA7C' } }
      }
    },
    { fieldName: 'WRK_CHK_DATE4', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('4차') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#768B5E' } }
      }
    },
    { fieldName: 'WRK_CHK_DATE5', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('5차') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#667E63' } }
      }
    },
    { fieldName: 'WRK_CHK_DATE6', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('6차') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#56705E' } }
      }
    },
    { fieldName: 'WRK_CHK_DATE7', width: '55', editable: true, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('7차') }, 
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return { style: { background:'#CDD7CC' } }
      }
    },
    { fieldName: 'CHK_PERI_YN', width: '40', editable: false, dataType: 'text', header: { text: t('측정주기준수') }, lookupDisplay: true },
    { fieldName: 'STATUS', width: '50', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t('진행상태') }, editor: { type: 'dropdown' }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        var ret = { style: { background:undefined } }
        if(grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'C') {
          ret.style.background = '#E13030'
        } else if(grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'B') {
          ret.style.background = '#FFFF00'
        }
        return ret
      }
    },
    { fieldName: 'REMARK', width: '100', styleName: 'editable_column', dataType: 'text', header: { text: t('비고') } },
    // { fieldName: 'PROCESS_NM', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('공정명') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') },visible: false, },
    { fieldName: 'REG_DIV', dataType: 'text', header: { text: t('구분') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
  ],
  columnLayout: [
    'BSNS_CD',
    'DEPT_NM',
    'DEPT_CD',
    'LAST_WRK_CHK_DATE',
    'PRE_SUR_DATE',
    'SCH_CHK_DATE',
    'PRE_SUR_DATE2',
    {
          name: '작업환경측정일',
          direction: 'horizontal',
          items: [ 'WRK_CHK_DATE1', 'WRK_CHK_DATE2', 'WRK_CHK_DATE3', 'WRK_CHK_DATE4', 'WRK_CHK_DATE5', 'WRK_CHK_DATE6', 'WRK_CHK_DATE7' ],
          header: { text: t('작업환경측정일') },
    },
    'CHK_PERI_YN',
    'STATUS',
    'REMARK',
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }
  
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
  } else if (btn.id === 'btnFormDownload') {
    let params = {
      FILE_PATH: 'HLTF',
      FILE_NAME: '작업환경측정 일정관리 샘플.xlsx',
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

// 그리드 데이터 조회
const getData = () => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
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
  return commonSearchApi({ queryId: 'HLTFA0030_SEARCH_01', param: searchParams })
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
    if(isEmpty(data.YEAR)) {
      Message.warn(t('년도는 필수 입력 사항입니다.'))
      return false
    } else if(isEmpty(data.HALF_DIV)) {
      Message.warn(t('반기는 필수 입력 사항입니다.'))
      return false
    } else if(isEmpty(data.REG_DIV)) {
      Message.warn(t('구분은 필수 입력 사항입니다.'))
      return false
    } else if(isEmpty(data.BSNS_CD)) {
      Message.warn(t('사업부는 필수 입력 사항입니다.'))
      return false
    } else if(isEmpty(data.DEPT_CD)) {
      Message.warn(t('부서는 필수 입력 사항입니다.'))
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
    data.LAST_WRK_CHK_DATE = parsingDate(data.LAST_WRK_CHK_DATE)
    data.PRE_SUR_DATE = parsingDate(data.PRE_SUR_DATE)
    data.SCH_CHK_DATE = parsingDate(data.SCH_CHK_DATE)
    data.PRE_SUR_DATE2 = parsingDate(data.PRE_SUR_DATE2)
    data.WRK_CHK_DATE1 = parsingDate(data.WRK_CHK_DATE1)
    data.WRK_CHK_DATE2 = parsingDate(data.WRK_CHK_DATE2)
    data.WRK_CHK_DATE3 = parsingDate(data.WRK_CHK_DATE3)
    data.WRK_CHK_DATE4 = parsingDate(data.WRK_CHK_DATE4)
    data.WRK_CHK_DATE5 = parsingDate(data.WRK_CHK_DATE5)
    data.WRK_CHK_DATE6 = parsingDate(data.WRK_CHK_DATE6)
    data.WRK_CHK_DATE7 = parsingDate(data.WRK_CHK_DATE7)
    
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTFA0030_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {  
  grdMain.value.getGridView().filterPanel.clearInput()
  excelData.map(item => {
    var dupe = -1
    var gridData = grdMain.value.getDataProvider().getJsonRows(0,-1)
    for(var i = 0; i < gridData.length; i++) {      
      if(item.부서코드 ==  gridData[i].DEPT_CD) {
        dupe = i
        break
      }
    }    
    if(dupe >= 0) {
      grdMain.value.getGridView().setValue(dupe, 'PRE_SUR_DATE', isEmpty(item.예비조사예정일) ? '' : dayjs(item.예비조사예정일).add(1,'day').format('YYYY-MM-DD'))
      grdMain.value.getGridView().setValue(dupe, 'SCH_CHK_DATE', isEmpty(item.측정예정일) ? '' : dayjs(item.측정예정일).add(1,'day').format('YYYY-MM-DD'))
      grdMain.value.getGridView().setValue(dupe, 'PRE_SUR_DATE2', isEmpty(item.예비조사일) ? '' : dayjs(item.예비조사일).add(1,'day').format('YYYY-MM-DD'))
      grdMain.value.getGridView().checkRow(dupe, true, false, false)
    } else {
      // 기초정보 관리에 등록되어있는 부서만 데이터를 넣어야 하는 것으로 보임
      grdMain.value.addRow({
        BSNS_NM: item.사업부코드,
        BSNS_CD: item.사업부코드,
        DEPT_NM: item.부서코드,
        DEPT_CD: item.부서코드,
        LAST_WRK_CHK_DATE: '',
        PRE_SUR_DATE: isEmpty(item.예비조사예정일) ? '' : dayjs(item.예비조사예정일).add(1,'day').format('YYYY-MM-DD'),
        SCH_CHK_DATE: isEmpty(item.측정예정일) ? '' : dayjs(item.측정예정일).add(1,'day').format('YYYY-MM-DD'),
        PRE_SUR_DATE2: isEmpty(item.예비조사일) ? '' : dayjs(item.예비조사일).add(1,'day').format('YYYY-MM-DD'),
        WRK_CHK_DATE1: '',
        WRK_CHK_DATE2: '',
        WRK_CHK_DATE3: '',
        WRK_CHK_DATE4: '',
        WRK_CHK_DATE5: '',
        WRK_CHK_DATE6: '',
        WRK_CHK_DATE7: '',
        CHK_PERI_YN: 'N',
        STATUS: '',
        REMARK: '',
        YEAR: searchParams.YEAR,
        CMPNY_DIV: searchParams.CMPNY_DIV,
        HALF_DIV: searchParams.HALF_DIV,
        REG_DIV: searchParams.REG_DIV,
        SAVE_YM: 'N'
      },false)
    }
  })
}

// 날짜파싱 ('2024-01-01' >> '20240101')
const parsingDate = (date) => {
  if(date == null) return ''
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2) // 월은 0부터 시작하므로 1을 더하고, 두 자리로 표현하기 위해 slice 사용
  var day = ('0' + date.getDate()).slice(-2) // 일도 두 자리로 표현하기 위해 slice 사용

  return '' + year + month + day
}

// ('20240101' >> '2024-01-01')
const formatDate = (date) => {
  if(isEmpty(date)) return ''
  // 숫자를 문자열로 변환
  let dateStr = date.toString()
  
  // 연도, 월, 일을 추출
  let year = dateStr.substring(0, 4)
  let month = dateStr.substring(4, 6)
  let day = dateStr.substring(6, 8)
  
  // 원하는 형식으로 반환
  return `${year}-${month}-${day}`
}

watch(() => searchParams.YEAR, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.HALF_DIV, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.REG_DIV, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.ORGN_DIV, (newValue, oldValue) => {
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
        :button-list="['btnFormDownload', 'btnExcelUpload', 'btnSearch', 'btnUpdate']"
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
          <i-select
            v-model="searchParams.REG_DIV"
            :label="$t('구분')"
            label-width="50px"
            :items="codeList.REG_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle
            :title="$t('작업환경측정 일정 목록')"
          />
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