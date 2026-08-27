<!-- 
  화면명 : 건강진단 채용검진자 관리
  화면개요 : 채용검진자 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonLogExecuteApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from '@/utils/excel'
import Message from '@hiway/utils/notify'
import HLTGA0040Popup01 from '@/pages/100_health/HLT_G/HLTGA0040Popup01.vue'

defineOptions({
  name:'100_health-HLT_G-HLTGA0040', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const hltga0040Popup01 = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FR_REGDTE: `${dayjs().year()}-01-01`,
  TO_REGDTE: `${dayjs().year()}-12-31`,
  FR_TSTDTE: '',
  TO_TSTDTE: '',
})

const codeList = reactive({
  TYPE_GUBUN: [
    { COD: '01', TXT: '일반' },
    { COD: '02', TXT: '특수' },
  ],
  GUBUN: []
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }

  Promise.all([
    // 신청구분
    getCodeList('HHII800'),
  ]).then((res) => {
    codeList.GUBUN = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('MM_KIND_CD', codeList.TYPE_GUBUN, 'COD', 'TXT')
    grdMain.value.setBindingColumn('TEST_IN_HALF_DIV', codeList.GUBUN, 'COD', 'TXT')
  })

  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'REQ_DATE', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName:'editable_column', header: { text: t('의뢰일자'), styleName: 'header_validit' },
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
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        if(grid.getValue(dataCell.index.itemIndex, 'SAVE_YN') == 'Y') {
          ret.editable = false
          ret.enabled = false
          ret.style = { background:'#FFFFFF' }
        } else {
          ret.editable = true
          ret.enabled = true
          ret.style = { background:'#eff8fd' }
        }
        return ret
      }
    },
    { fieldName: 'NO', width: '60', dataType: 'text', styleName: 'editable_column', header: { text: t('NO') }, editor: { type: 'line', inputCharacters: '0-9', maxLength: 3 }, },
    { fieldName: 'DIV', width: '80', styleName: 'editable_column', dataType: 'text', header: { text: t('구분') }, editor: { type: 'line', maxLength: 10 }, },
    { fieldName: 'CHARG_EMP_NM', width: '80', styleName: 'editable_column', dataType: 'text', header: { text: t('담당자') }, editor: { type: 'line', maxLength: 10 }, },
    { fieldName: 'KOR_NM', width: '80', styleName: 'editable_column', dataType: 'text', header: { text: t('성명'), styleName: 'header_validit' },
      editor: { type: 'line', maxLength: 20 },
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        if(grid.getValue(dataCell.index.itemIndex, 'SAVE_YN') == 'Y') {
          ret.editable = false
          ret.enabled = false
          ret.style = { background:'#FFFFFF' }
        } else {
          ret.editable = true
          ret.enabled = true
          ret.style = { background:'#eff8fd' }
        }
        return ret
      }
    },
    { fieldName: 'EMP_NO', width: '100', styleName: 'editable_column', dataType: 'text', header: { text: t('사번') },
      editor: { type: 'line', maxLength: 10 },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          return `
            <div class="d-flex justify-space-between" style="align-items: center;">
              <p style="max-width: 80%; text-align:left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cell.value ?? ''}</p>
              <i class="mdi mdi-magnify"
                data-index="${cell.index.itemIndex}"
                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); color: #1a40c7; font-size: 18px; cursor: pointer;">
              </i>
            </div>
          `;
        }
      },
    },
    { fieldName: 'EMP_NO_CNT', width: '40', dataType: 'text', editable: false, header: { text: t('사번2') } },
    { fieldName: 'UNT_DUTY_NM', width: '100', dataType: 'text', styleName: 'editable_column', header: { text: t('직무') }, editor: { type: 'line', maxLength: 20 } },
    { fieldName: 'UNT_DUTY_NM_HR', width: '100', dataType: 'text', editable: false, header: { text: t('인사직무') } },
    { fieldName: 'BIRTH', width: '100', dataType: 'text', styleName: 'editable_column', header: { text: t('생년월일'), styleName: 'header_validit' },
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        if(grid.getValue(dataCell.index.itemIndex, 'SAVE_YN') == 'Y') {
          ret.editable = false
          ret.enabled = false
          ret.style = { background:'#FFFFFF' }
        } else {
          ret.editable = true
          ret.enabled = true
          ret.style = { background:'#eff8fd' }
        }
        return ret
      }
    },
    { fieldName: 'MM_KIND_CD', width: '100', dataType: 'text', styleName: 'editable_column', header: { text: t('검진구분') }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'BD_INSP_CD', width: '100', dataType: 'text', styleName: 'editable_column', header: { text: t('검진코드') }, editor: { type: 'line', ignoreCharacters: 'ㄱ-힣', maxLength: 5 }, },
    { fieldName: 'EMP_TEST_DATE', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('채용검진일') },
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
    { fieldName: 'TEST_DATE_LIMIT', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', editable: false, header: { text: t('검진기한') } },
    { fieldName: 'JUDGMENT', width: '80', dataType: 'text', styleName: 'editable_column', header: { text: t('판정') }, editor: { type: 'line', maxLength: 10 }, },
    { fieldName: 'HSPT_NM', width: '120', dataType: 'text', styleName: 'editable_column left-column', header: { text: t('검진병원') }, editor: { type: 'line', maxLength: 20 }, },
    { fieldName: 'DEPLOY_AFT_DATE', width: '100', dataType: 'text', styleName: 'editable_column', header: { text: t('배치후 검진일') }, editor: { type: 'line', inputCharacters: '0-9', maxLength: 8 }, },
    { fieldName: 'DUTY_CHG_YN', width: '100', dataType: 'text', editable: false, header: { text: t('직무 변경자') } },
    { fieldName: 'TEST_IN_YEAR', width: '80', dataType: 'text', editable: false, header: { text: t('년도') } },
    { fieldName: 'TEST_IN_HALF_DIV', width: '80', dataType: 'text', styleName: 'left-column', editable: false, header: { text: t('구분') }, lookupDisplay: true }, 
    { fieldName: 'REMARK', width: '200', dataType: 'text', styleName: 'editable_column left-column', header: { text: t('비고') }, editor: { type: 'line', maxLength: 100 }, },
    { fieldName: 'INSERT_DATE', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', editable: false, header: { text: t('등록일') } },
    { fieldName: 'INSERT_USER_ID', width: '80', dataType: 'text', editable: false, header: { text: t('등록자') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columnLayout: [
    'REQ_DATE',
    'NO',
    'DIV',
    'CHARG_EMP_NM',
    'KOR_NM',
    {
          name: '사번',
          direction: 'horizontal',
          hideChildHeaders: true, 
          items: [ 'EMP_NO', 'EMP_NO_CNT' ],
          header: { text: t('사번') },
    },
    'UNT_DUTY_NM',
    'UNT_DUTY_NM_HR',
    'BIRTH',
    'MM_KIND_CD',
    'BD_INSP_CD',
    'EMP_TEST_DATE',
    'TEST_DATE_LIMIT',
    'JUDGMENT',
    'HSPT_NM',
    'DEPLOY_AFT_DATE',
    'DUTY_CHG_YN',
    {
          name: '검진포함',
          direction: 'horizontal',
          items: [ 'TEST_IN_YEAR', 'TEST_IN_HALF_DIV' ],
          header: { text: t('검진포함') },
    },
    'REMARK',
    'INSERT_DATE',
    'INSERT_USER_ID'
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   Message.warn(t('관리자만 사용가능합니다.'))
  //   return
  // }

  if (btn.id === 'btnSearch') {
    getData(true)
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      REQ_DATE: dayjs().format('YYYY-MM-DD'),
      KOR_NM: '',
      BIRTH: '',
      EMP_TEST_DATE: '',
      NO: '',
      DIV: '',
      CHARG_EMP_NM: '',
      EMP_NO: '',
      EMP_NO_CNT: '',
      MM_KIND_CD: '',
      UNT_DUTY_NM: '',
      UNT_DUTY_NM_HR: '',
      BD_INSP_CD: '',
      TEST_DATE_LIMIT: '',
      JUDGMENT: '',
      HSPT_NM: '',
      DEPLOY_AFT_DATE: '',
      TEST_IN_YEAR: '',
      TEST_IN_HALF_DIV: '',
      REMARK: '',
      SAVE_YN: '',
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
      FILE_PATH: 'HLTG',
      FILE_NAME: '채용검진자 관리 업로드 샘플.xlsx',
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
  } else if (btn.id === 'btnGetEmpno') {
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    let saveList = []
    if(isEmpty(checkRow)) {
      return Message.warn('선택된 데이터가 없습니다.')
    }
    
    for (let rowIdx of checkRow) {
      let dt = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      dt.REQ_DATE = dayjs(dt.REQ_DATE).format('YYYYMMDD')
      saveList.push(dt)
    }

    commonExecuteApi({ queryId : 'HLTGA0040_SAVE_03', list: saveList }).then(res => {
      let completeCnt = res.list.filter(item => item.OUT_RES_COD == '0').length
      getData(false)
      Message.success(t(`채용검진자 ${saveList.length}건 중 ${completeCnt} 건 사번 저장 완료`))
    })//940909 890705
  }
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {  
  let saveList = []
  excelData.map(item => {
    if(isEmpty(item.성명) || isEmpty(item.생년월일) || isEmpty(item.의뢰일자)) return
    saveList.push({
      CMPNY_DIV: searchParams.CMPNY_DIV,
      SAVE_YM: 'Y',
      REQ_DATE: item.의뢰일자,
      NO: item.NO,
      DIV: item.구분,
      CHARG_EMP_NM: item.담당자,
      KOR_NM: item.성명,
      BIRTH: item.생년월일,
      MM_KIND_CD: item.검진구분,
      UNT_DUTY_NM: item.직무,
      BD_INSP_CD: item.검진코드,
      EMP_TEST_DATE: item.검진일,
      JUDGMENT: item.판정,
      HSPT_NM: item.검진병원,
      DEPLOY_AFT_DATE: item['배치후 검진일'],
      REMARK: item.비고,
    })
  })

  if(saveList.length == 0) return
  commonExecuteApi({ queryId : 'HLTGA0040_SAVE_02', list: saveList }).then(res => {
    getData(false)
    Message.success(t('성공적으로 저장되었습니다.'))
  })
}

const getData = (showMsg) => {
  // if(!isAdmin.value) {
  //   Message.warn(t('관리자만 사용가능합니다.'))
  //   return
  // }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(showMsg)
    .run()
}

//  조회
const searchData = () => {
  let param = _.cloneDeep(searchParams)
  param.FR_REGDTE = dayjs(param.FR_REGDTE).format('YYYYMMDD')
  param.TO_REGDTE = dayjs(param.TO_REGDTE).format('YYYYMMDD')
  if(dayjs(param.FR_TSTDTE).isValid()) {
    param.FR_TSTDTE = dayjs(param.FR_TSTDTE).format('YYYYMMDD')
  } else {
    param.FR_TSTDTE = ''
  }

  if(dayjs(param.TO_TSTDTE).isValid()) {
    param.TO_TSTDTE = dayjs(param.TO_TSTDTE).format('YYYYMMDD')
  } else {
    param.TO_TSTDTE = ''
  }
  return commonSearchApi({ queryId: 'HLTGA0040_SEARCH_01', param: param })
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
    if(isEmpty(data.CMPNY_DIV)) {
      return Message.warn(t('사업부코드는 필수 입력입니다.'))
    } else if (isEmpty(data.KOR_NM)) {
      return Message.warn(t('이름은 필수 입력입니다.'))
    } else if (isEmpty(data.BIRTH)) {
      return Message.warn(t('생년월일은 필수 입력입니다.'))
    } else if (isEmpty(data.REQ_DATE)) {
      return Message.warn(t('의뢰날짜는 필수 입력입니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.REQ_DATE = dayjs(data.REQ_DATE).format('YYYYMMDD')
    if(!isEmpty(data.EMP_TEST_DATE)) {
      data.EMP_TEST_DATE = dayjs(data.EMP_TEST_DATE).format('YYYYMMDD')
    }
    
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTGA0040_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData(false)
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
    data.REQ_DATE = dayjs(data.REQ_DATE).format('YYYYMMDD')
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTGA0040_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData(false)
  Message.success(t('성공적으로 삭제되었습니다'))
}

// 사번찾기 팝업 실행
const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if(isEmpty(data)) {
    return
  }
  if(isEmpty(data.EMP_NO_CNT) || data.EMP_NO_CNT <= 1) {
    return Message.warn(t('사번이 다수일 경우에만 사번찾기가 가능합니다.'))
  }
  
  hltga0040Popup01.value.openPopup(data)
}

const selectEmpno = (data) => {
  grdMain.value.getDataProvider().setValue(grdMain.value.getGridView().getCurrent().dataRow, 'EMP_NO', data.EMP_NO)
  grdMain.value.getGridView().checkRow(grdMain.value.getGridView().getCurrent().dataRow, true, false, false)
}

watch(() => searchParams.FR_REGDTE, async (newValue, oldValue) => {
  if(!dayjs(searchParams.TO_REGDTE).isValid() || !dayjs(newValue).isValid()) {
    return
  }

  if(dayjs(searchParams.TO_REGDTE).isBefore(newValue)) {
    await nextTick()
    searchParams.FR_REGDTE = oldValue
    return Message.warn('시작날짜는 종료날짜보다 미래일 수 없습니다.')
  }
})

watch(() => searchParams.TO_REGDTE, async (newValue, oldValue) => {
  if(!dayjs(searchParams.FR_REGDTE).isValid() || !dayjs(newValue).isValid()) {
    return
  }

  if(dayjs(newValue).isBefore(searchParams.FR_REGDTE)) {
    await nextTick()
    searchParams.TO_REGDTE = oldValue
    return Message.warn('종료날짜는 시작날짜보다 과거일 수 없습니다.')
  }
})

watch(() => searchParams.FR_TSTDTE, async (newValue, oldValue) => {
  if(!dayjs(searchParams.TO_TSTDTE).isValid() || !dayjs(newValue).isValid()) {
    return
  }

  if(dayjs(searchParams.TO_TSTDTE).isBefore(newValue)) {
    await nextTick()
    searchParams.FR_TSTDTE = oldValue
    return Message.warn('시작날짜는 종료날짜보다 미래일 수 없습니다.')
  }
})

watch(() => searchParams.TO_TSTDTE, async (newValue, oldValue) => {
  if(!dayjs(searchParams.FR_TSTDTE).isValid() || !dayjs(newValue).isValid()) {
    return
  }

  if(dayjs(newValue).isBefore(searchParams.FR_TSTDTE)) {
    await nextTick()
    searchParams.TO_TSTDTE = oldValue
    return Message.warn('종료날짜는 시작날짜보다 과거일 수 없습니다.')
  }
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnFormDownload', 'btnExcelUpload','btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnGetEmpno']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.FR_REGDTE"
            label-width="50px"
            :label="$t('의뢰일자')"
            type="date"
            width="200px"
            class="mr-2"
            :max="searchParams.TO_REGDTE"
          />
          <i-input
            v-model="searchParams.TO_REGDTE"
            label-width="20px"
            :label="$t('~')"
            type="date"
            width="180px"
            :min="searchParams.FR_REGDTE"
          />
          <i-input
            v-model="searchParams.FR_TSTDTE"
            label-width="50px"
            :label="$t('검진기한')"
            type="date"
            width="200px"
            class="mr-2"
            :max="searchParams.TO_TSTDTE"
          />
          <i-input
            v-model="searchParams.TO_TSTDTE"
            label-width="20px"
            :label="$t('~')"
            type="date"
            width="180px"
            :min="searchParams.FR_TSTDTE"
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
            :column-layout="grd1Props.columnLayout"
            @onCellItemClicked="onCellItemClicked"
          /> 
        </v-sheet>
      </div>
    </v-card-text>
    <HLTGA0040Popup01 ref="hltga0040Popup01" @selected="selectEmpno"/>
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