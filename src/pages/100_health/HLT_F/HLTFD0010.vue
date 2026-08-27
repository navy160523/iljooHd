<!-- 
  화면명 : 작업환경측정 개선실적 제출 일정 관리
  화면개요 : 개선실적 제출 일정 관리
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
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'

defineOptions({
  name:'100_health-HLT_F-HLTFD0010', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const grdField = ref([])

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(dayjs().get('year')),
  HALF_DIV: Number(dayjs().get('month')) > 6 ? 'LO' : 'HI',
  REG_DIV: 'A',
  ORGN_DIV: '',
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
  DEPT_CD: [],
  IMPR_YN: [
    { COD: 'Y', TXT: '대상' },
    { COD: 'N', TXT: '비대상' },
  ],
  EDU_YN: [
    { COD: 'Y', TXT: 'Y' },
    { COD: 'N', TXT: 'N' },
  ],
})

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
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
    // 상하반기
    getCodeList('HHII800'),
    // 부서
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_DEPT', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.HALF_DIV = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR

    grdMain.value.setBindingColumn('DEPT_NM', codeList.DEPT_CD, 'DEPT_CD', 'DEPT_NM')
  }) 
  grdMain.value.setBindingColumn('IMPR_YN', codeList.IMPR_YN, 'COD', 'TXT')
  grdMain.value.setBindingColumn('HEAR_PROTECT_YN', codeList.IMPR_YN, 'COD', 'TXT')
  grdMain.value.setBindingColumn('RESP_PROTECT_YN', codeList.IMPR_YN, 'COD', 'TXT')
  grdMain.value.setBindingColumn('EDU_YN', codeList.EDU_YN, 'COD', 'TXT')
})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }, header: { height: 75 }},
  keys : [], 
  fields : [ 
    { fieldName: 'IMPR_YN', width: '60', dataType: 'text', styleName: 'editable_column', header: { text: t('개선실적\n제출대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'HEAR_PROTECT_YN', width: '60', dataType: 'text', styleName: 'editable_column', header: { text: t('청력보존\n프로그램\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'RESP_PROTECT_YN', width: '60', dataType: 'text', styleName: 'editable_column', header: { text: t('호흡기보호\n프로그램\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'BSNS_NM', width: '100', dataType: 'text', editable: false, styleName: 'left-column', header: { text: t('사업부명') } },
    { fieldName: 'DEPT_CD', width: '80', dataType: 'text', editable: false, header: { text: t('부서코드') } },
    { fieldName: 'DEPT_NM', width: '120', dataType: 'text', styleName: 'editable_column left-column', header: { text: t('부서명') }, editor: { type: 'dropdown' }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column left-column', enabled: true }
        var dropList = { DEPT_CD: [], DEPT_NM: [] }
        var deptList = []

        if(grid.getValue(dataCell.index.itemIndex, 'SAVE_YN') == 'Y') {
          ret.editable = false 
          ret.enabled = false 
          ret.styleName = 'left-column'
        } else {
           // 모든 DEPT_CD를 담는다.
          for(var data of grdMain.value.getDataProvider().getJsonRows(0,-1)) {
            deptList.push(data.DEPT_CD)
          }

          for(var dept of codeList.DEPT_CD) {
            if(!deptList.includes(dept.DEPT_CD)) {
              dropList.DEPT_CD.push(dept.DEPT_CD)
              dropList.DEPT_NM.push(dept.DEPT_NM)
            }
          }
          ret.editor = {
            type: 'dropdown',
            values: dropList.DEPT_CD,
            labels: dropList.DEPT_NM,
            editable : true, 
            styleName : 'editable_column left-column', 
            enabled: true
          }
        }
        return ret
      }
    },
    { fieldName: 'WRK_CHK_DATE_FR', width: '80', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('측정시작일') }, },
    { fieldName: 'WRK_CHK_DATE_TO', width: '80', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('측정종료일') },
      'styleCallback': function(grid, dataCell){
        if(grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'C') {
          return { style: { background:'#FF0000' } }
        } else {
          return { style: { background:'#FFFFFF' } }
        }
      }
    },
    { fieldName: 'WRK_CHK_DATE_CNT', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('측정일수') } },
    { fieldName: 'K2B_DATE_LIMIT', width: '80', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('K2B\n전산 보고\n기한일'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'K2B_DATE', width: '80', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('K2B\n전산 보고일'), styleName: 'multiline-editor-pre' },
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
        if(grid.getValue(dataCell.index.itemIndex, 'K2B_DIV') == 'Y') {
          return { style: { background:'#FF0000' } }
        } else {
          return { style: { background:'#eff8fd' } }
        }
      }
    },
    { fieldName: 'RST_DATE', width: '80', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('결과보고서\n수령일'), styleName: 'multiline-editor-pre' },
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
    { fieldName: 'RST_DEPT_DATE', width: '80', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('결과보고서\n 부서 통보일'), styleName: 'multiline-editor-pre' },
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
    { fieldName: 'IMPR_DATE', width: '80', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('결과보고서\n수정예정일'), styleName: 'multiline-editor-pre' },
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
    { fieldName: 'IMPR_ACT_DATE', width: '80', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('개선조치\n수정일'), styleName: 'multiline-editor-pre' },
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
    { fieldName: 'EDU_YN', width: '60', dataType: 'text', styleName: 'editable_column', header: { text: t('교육자료\n수령유무'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'SEND_DATE_LIMIT', width: '80', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('개선계획\n제출만료일'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'SEND_DATE', width: '80', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('고용노동부\n제출일'), styleName: 'multiline-editor-pre' },
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
        if(grid.getValue(dataCell.index.itemIndex, 'IMPR_YN') == 'Y') {
          return { style: { background:'#FF0000' } }
        } else {
          return { style: { background:'#eff8fd' } }
        }
      }
    },
    { fieldName: 'REMARK', width: '120', editable: false, dataType: 'text', header: { text: t('비고') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') },visible: false, },
    { fieldName: 'REG_DIV', dataType: 'text', header: { text: t('구분') },visible: false, },
    { fieldName: 'K2B_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('상태') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields
 
// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }

  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnDeptLoad') {    
    vm.$swal({
      title: t("측정 부서 가져오기 하시겠습니까?\n(작업측정 기초정보 기준으로 부서를 저장합니다.)"),
      showCancelButton: true,
    }).then(async(swalRes) => {
      if (swalRes.isConfirmed === true) {
        commonExecuteApi({ queryId: "HLTFD0010_SAVE_02", list: [searchParams] }).then((res) => {
          getData()
        })
      }
    })
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: searchParams.YEAR,
      HALF_DIV: searchParams.HALF_DIV,
      REG_DIV: searchParams.REG_DIV,
      IMPR_YN: 'N',
      DEPT_CD: '',
      DEPT_NM: '',
      WRK_CHK_DATE_FR: '',
      WRK_CHK_DATE_TO: '',
      WRK_CHK_DATE_CNT: '',
      K2B_DATE_LIMIT: '',
      K2B_DATE: '',
      RST_DATE: '',
      RST_DEPT_DATE: '',
      IMPR_DATE: '',
      EDU_YN: '',
      IMPR_ACT_DATE: '',
      SEND_DATE: '',
      REMARK: '',
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
      FILE_NAME: '작업환경측정 개선실적 제출 일정 관리 샘플.xlsx',
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
  return commonSearchApi({ queryId: 'HLTFD0010_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수 입력입니다.'))
    } else if (isEmpty(data.HALF_DIV)) {
      return Message.warn(t('반기구분은 필수 입력입니다.'))
    } else if (isEmpty(data.REG_DIV)) {
      return Message.warn(t('구분은 필수 입력입니다.'))
    } else if (isEmpty(data.DEPT_CD)) {
      return Message.warn(t('부서는 필수 입력입니다.'))
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
    data.WRK_CHK_DATE_FR = parsingDate(data.WRK_CHK_DATE_FR)
    data.WRK_CHK_DATE_TO = parsingDate(data.WRK_CHK_DATE_TO)
    data.K2B_DATE = parsingDate(data.K2B_DATE)
    data.RST_DATE = parsingDate(data.RST_DATE)
    data.RST_DEPT_DATE = parsingDate(data.RST_DEPT_DATE)
    data.IMPR_DATE = parsingDate(data.IMPR_DATE)
    data.IMPR_ACT_DATE = parsingDate(data.IMPR_ACT_DATE)
    data.SEND_DATE = parsingDate(data.SEND_DATE)
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTFD0010_SAVE_01', list: saveParams })
}

// 저장 후
const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

// 삭제
const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTFD0010_DELETE_01', list: saveParams })
}

// 삭제 후
const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {  
  grdMain.value.getGridView().filterPanel.clearInput()
  
  excelData.map(item => {
    let dept = codeList.DEPT_CD.find(dept => dept.DEPT_NM == item.부서명)
    if(!isEmpty(dept)) {
      let grdData = grdMain.value.getDataProvider().getJsonRows(0,-1).findIndex(data => data.DEPT_CD == dept.DEPT_CD)
      if(grdData < 0) {
        grdMain.value.addRow({
          CMPNY_DIV: userStore.cmpnyDiv,
          YEAR: searchParams.YEAR,
          HALF_DIV: searchParams.HALF_DIV,
          REG_DIV: searchParams.REG_DIV,
          IMPR_YN: item['개선실적 제출대상'],
          HEAR_PROTECT_YN: item['청력보존 프로그램 대상'],
          RESP_PROTECT_YN: item['호흡기보호 프로그램 대상'],
          DEPT_CD: dept.DEPT_CD,
          DEPT_NM: item['부서명'],
          WRK_CHK_DATE_FR: '',
          WRK_CHK_DATE_TO: '',
          WRK_CHK_DATE_CNT: '',
          K2B_DATE_LIMIT: '',
          K2B_DATE: formatDate(item['K2B 전산 보고일']),
          RST_DATE: formatDate(item['결과보고서 수령일']),
          RST_DEPT_DATE: formatDate(item['결과보고서 부서 통보일']),
          IMPR_DATE: formatDate(item['결과보고서 수정예정일']),
          IMPR_ACT_DATE: formatDate(item['개선조치 수정일']),
          EDU_YN: item['교육자료 수령유무'],
          SEND_DATE_LIMIT: '',
          SEND_DATE: formatDate(item['고용노동부 제출일']),
          REMARK: '',
          SAVE_YN: 'N'
        },false)
      } else {
        grdMain.value.getDataProvider().setValue(grdData, 'IMPR_YN', item['교육자료 수령유무'])
        grdMain.value.getDataProvider().setValue(grdData, 'DEPT_CD', dept.DEPT_CD)
        grdMain.value.getDataProvider().setValue(grdData, 'DEPT_NM', item['부서명'])
        grdMain.value.getDataProvider().setValue(grdData, 'K2B_DATE', formatDate(item['K2B 전산 보고일']))
        grdMain.value.getDataProvider().setValue(grdData, 'RST_DATE', formatDate(item['결과보고서 수령일']))
        grdMain.value.getDataProvider().setValue(grdData, 'RST_DEPT_DATE', formatDate(item['결과보고서 부서 통보일']))
        grdMain.value.getDataProvider().setValue(grdData, 'IMPR_DATE', formatDate(item['결과보고서 수정예정일']))
        grdMain.value.getDataProvider().setValue(grdData, 'IMPR_ACT_DATE', formatDate(item['개선조치 수정일']))
        grdMain.value.getDataProvider().setValue(grdData, 'EDU_YN', item['교육자료 수령유무'])
        grdMain.value.getDataProvider().setValue(grdData, 'SEND_DATE', formatDate(item['고용노동부 제출일']))
        grdMain.value.getGridView().checkRow(grdData, true, false, false)
      }
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

// 그리드 데이터 변경 시
const onEditChange = (grid, index, value) => {
  if(index.fieldName == 'DEPT_NM') {
    if(codeList.DEPT_CD.map(item => item.DEPT_CD).includes(value)) {
      // 부서명 변경 시 코드 변경
      grid.setValue(index.itemIndex, 'DEPT_CD', value)
    }
  }
}

watch(() => searchParams.YEAR, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.REG_DIV, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.HALF_DIV, (newValue, oldValue) => {
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
        :button-list="['btnDeptLoad', 'btnSearch', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('년도')"
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
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onEditChange="onEditChange"
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