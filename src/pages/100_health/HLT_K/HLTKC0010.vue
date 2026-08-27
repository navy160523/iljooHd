<!-- 
  화면명 : 건강관리대상자 현황
  화면개요 : 건강관리대상자 현황
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonLogExecuteApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import VendTreePopup from '@/components/popup/VendTreePopup.vue'
import PdfView from '@/pages/99_indexPopUp/PdfViewPopup.vue'
import HLTKC0010Popup01 from '@/pages/100_health/HLT_K/HLTKC0010Popup01.vue'
import HLTKC0010Popup02 from '@/pages/100_health/HLT_K/HLTKC0010Popup02.vue'
import HLTKC0010Popup03 from '@/pages/100_health/HLT_K/HLTKC0010Popup03.vue'

defineOptions({
  name:'100_health-HLT_K-HLTKC0010', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isIp = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const vendTreePopup = ref(null)
const pdfPopup = ref(null)
const hltkc0010Popup01 = ref(null)
const hltkc0010Popup02 = ref(null)
const hltkc0010Popup03 = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(dayjs().get('year')),
  VEND_CD: userStore.asgnCd,
  VEND_NAME: userStore.asgnNm,
})

const codeList = reactive({
  YEAR: []
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }

  // ip, login id 비교하여 인가된 계정, ip인지 확인
  userStore.getAuthIpMenus().then(res => {
    if(res.filter(item => item.EMP_NO == userStore.empNo && 
      item.PGM_ID == useLogsStore().menuId &&
      item.IP_ADD == userStore.clientIp).length > 0) {
      isIp.value = true
    }
    codeList.YEAR = []
    for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
      codeList.YEAR.push({COD: String(i), TXT: String(i)})
    }

    onButtonsClick({ id: 'btnSearch' })
    grdMain.value.getGridView().filterPanel.visible = true
  })
  
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }, header: { height: 75 } },
  keys : [],
  fields : [ 
    { fieldName: 'EMP_NO', width: '80', dataType: 'text', editable: false, header: { text: t('등록번호') } },
    { fieldName: 'EMP_NM', width: '80', dataType: 'text', editable: false, header: { text: t('성명') } },
    { fieldName: 'JOB_TIT_NM', width: '80', dataType: 'text', editable: false, header: { text: t('직위') } },
    { fieldName: 'BIRTH_DAY', width: '100', dataType: 'text', editable: false, header: { text: t('생년월일') } },
    { fieldName: 'AGE_INT', width: '80', dataType: 'text', editable: false, header: { text: t('나이(만)') },
      'styleCallback': function(grid, dataCell){
        if(grid.getValue(dataCell.index.itemIndex, 'AGE') >= 70) {
          return { style: { background:'#FF8989' } }
        } else if(grid.getValue(dataCell.index.itemIndex, 'AGE') >= 65) {
          return { style: { background:'#FFDC6D' } }
        } else {
          return { style: { background:'#FFFFFF' } }
        }
      }
    },
    { fieldName: 'CHK_A', width: '60', dataType: 'text', editable: false, header: { text: t('건강관리위험대상') } },
    { fieldName: 'CHK_B', width: '60', dataType: 'text', editable: false, header: { text: t('유소견/요관찰') } },
    { fieldName: 'CHK_C', width: '60', dataType: 'text', editable: false, header: { text: t('일반 고령자') } },
    { fieldName: 'CHK_Z', width: '60', dataType: 'text', editable: false, header: { text: t('기타') } },
    { fieldName: 'MANAGE_ITEM', width: '250', dataType: 'text', styleName:'left-column', editable: false, header: { text: t('건강관리항목') } },
    { fieldName: 'CHECK_DT_BEF_NEW', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('이전검진일') },
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
    { fieldName: 'CHECK_DT_EXP', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', editable: false, header: { text: t('검진기한일') } },
    { fieldName: 'REMAINING_PERIOD', width: '80', dataType: 'text', editable: false, header: { text: t('잔여기간') },
      'styleCallback': function(grid, dataCell){
        const remainingPeriod = grid.getValue(dataCell.index.itemIndex, 'REMAINING_PERIOD')
        if(!isEmpty(remainingPeriod)) {
          if(remainingPeriod < 0) {
            return { style: { color:'#FF0000' } }
          } else {
            return { style: { color:'#000000' } }
          }
        } else {
          return { style: { color:'#000000' } }
        }
      }
    },
    { fieldName: 'CHECK_DT', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName:'editable_column', header: { text: t('검진일자') },
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
        if(!isEmpty(grid.getValue(dataCell.index.itemIndex, 'CHECK_DT_BEF_NEW'))) {
          ret.editable = true
          ret.enabled = true
          ret.style = { background:'#eff8fd' }
        } else {
          ret.editable = false
          ret.enabled = false
          ret.style = { background:'#FFFFFF' }
        }
        return ret
      }
    },
    { fieldName: 'STATUS', width: '120', dataType: 'text', editable: false, header: { text: t('진행상태') },
      'styleCallback': function(grid, dataCell){
        const status = grid.getValue(dataCell.index.itemIndex, 'STATUS')
        if(status == '미완료(주기초과)') {
          return { style: { color:'#FF0000' } }
        } else {
          return { style: { color:'#000000' } }
        }
      }
    },
    { fieldName: 'CHECK_ADD_YN', width: '60', dataType: 'text', styleName: 'editable_column change_back_check', editable: false, header: { text: t('대상여부') }, renderer: { type: "check", trueValues: 'Y', falseValues: 'N', editable: false, enable: false },
      'styleCallback': function(grid, dataCell){
        var ret = { editable : false, styleName : 'editable_column', enabled: true }
        if(!isEmpty(grid.getValue(dataCell.index.itemIndex, 'CHECK_DT'))) {
          ret.editable = false
          ret.enabled = true
          ret.styleName = 'editable_column change_back_check'
          ret.style = { background:'#eff8fd' }
          ret.renderer = { type: "check", trueValues: 'Y', falseValues: 'N', editable: true, enable: true }
        } else {
          ret.editable = false
          ret.enabled = false 
          ret.style = { background:'#FFFFFF' }
          ret.renderer = { type: "check", trueValues: 'Y', falseValues: 'N', editable: false, enable: false }
        }
        return ret
      }
     },
    { fieldName: 'CHECK_DT_BEF_ADD', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', editable: false, header: { text: t('이전검진일') } },
    { fieldName: 'CHECK_DT_EXP_ADD', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', editable: false, header: { text: t('검진기한일') } },
    { fieldName: 'REMAINING_PERIOD_ADD', width: '80', dataType: 'text', editable: false, header: { text: t('잔여기간') },
      'styleCallback': function(grid, dataCell){
        const remainingPeriod = grid.getValue(dataCell.index.itemIndex, 'REMAINING_PERIOD_ADD')
        if(!isEmpty(remainingPeriod)) {
          if(remainingPeriod < 0) {
            return { style: { color:'#FF0000' } }
          } else {
            return { style: { color:'#000000' } }
          }
        } else {
          return { style: { color:'#000000' } }
        }
      }
    },
    { fieldName: 'CHECK_DT_ADD', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName: 'editable_column', header: { text: t('검진일자') },
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
        if(grid.getValue(dataCell.index.itemIndex, 'CHECK_ADD_YN') === 'Y') {
          ret.editable = true
          ret.enabled = true
          ret.style = { background:'#eff8fd' }
        } else {
          ret.editable = false
          ret.enabled = false
          ret.style = { background:'#FFFFFF' }
        }
        return ret
      }
    }, 
    { fieldName: 'STATUS_ADD', width: '120', dataType: 'text', editable: false, header: { text: t('진행상태') },
      'styleCallback': function(grid, dataCell){
        const status = grid.getValue(dataCell.index.itemIndex, 'STATUS_ADD')
        if(status == '미완료(주기초과)') {
          return { style: { color:'#FF0000' } }
        } else {
          return { style: { color:'#000000' } }
        }
      }
    },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
    { fieldName: 'AGE', dataType: 'text', header: { text: t('나이') },visible: false, },
    { fieldName: 'MEDC_TEST_DT', dataType: 'text', header: { text: t('나이') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columnLayout: [
    'EMP_NO',
    'EMP_NM',
    'JOB_TIT_NM',
    'BIRTH_DAY',
    'AGE_INT',
    {
          name: '구분',
          direction: 'horizontal',
          items: [ 'CHK_A', 'CHK_B', 'CHK_C', 'CHK_Z'],
          header: { text: t('구분') },
    },
    'MANAGE_ITEM',
    {
          name: '정기 검진[배치 후 검진 포함]',
          direction: 'horizontal',
          items: [ 'CHECK_DT_BEF_NEW', 'CHECK_DT_EXP', 'REMAINING_PERIOD', 'CHECK_DT', 'STATUS' ],
          header: { text: t('정기 검진[배치 후 검진 포함]') },
    },
    {
          name: '추가 검진[측정 초과공정 근무자]',
          direction: 'horizontal',
          items: [ 'CHECK_ADD_YN', 'CHECK_DT_BEF_ADD', 'CHECK_DT_EXP_ADD', 'REMAINING_PERIOD_ADD', 'CHECK_DT_ADD', 'STATUS_ADD' ],
          header: { text: t('추가 검진[측정 초과공정 근무자]') },
    },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isIp.value) {
    return showNoIp()
  }

  if (btn.id === 'btnSearch') {
    getData(true)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnSystemManual') {
    pdfPopup.value.openPopupUrl('https://hises.hd.com/HiSEsFiles/Manual/UIIH2010C.pdf')
  } else if (btn.id === 'btnRiskEmpGuide') {
    pdfPopup.value.openPopupUrl('https://hises.hd.com/HiSEsFiles/Manual/UIIH2010C_2.pdf')
  } else if (btn.id === 'btnAddManage') {
    hltkc0010Popup01.value.openPopup(searchParams)
  } else if (btn.id === 'btnErrorRequest') {
    hltkc0010Popup02.value.openPopup(searchParams)
  }
}

const getData = (showMsg) => {
  if(!isIp.value) {
    return showNoIp()
  }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(showMsg)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTKC0010_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 개인정보 조회 로그 남기기
  let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '[건강관리대상자] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
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
    } else if (isEmpty(data.EMP_NO)) {
      return Message.warn(t('등록번호는 필수 입력입니다.'))
    } else if (isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수 입력입니다.'))
    } 
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(!isEmpty(data.CHECK_DT_BEF_NEW)) {
      data.CHECK_DT_BEF_NEW = dayjs(data.CHECK_DT_BEF_NEW).format('YYYYMMDD')
    }

    if(!isEmpty(data.CHECK_DT)) {
      data.CHECK_DT = dayjs(data.CHECK_DT).format('YYYYMMDD')
    }

    if(!isEmpty(data.CHECK_DT_ADD)) {
      data.CHECK_DT_ADD = dayjs(data.CHECK_DT_ADD).format('YYYYMMDD')
    }
  
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTKC0010_SAVE_01', list: saveParams })
}

const showNoIp = () => {
  vm.$swal({ title: t('메뉴 사용 권한이 없습니다. 메뉴 사용을 희망하시는 경우\r\n시스템 관리자에게 IP 권한 등록을 요청하시기 바랍니다.\r\n\n☎ 문의처 : 안전보건지원부 보건관리과 T. 2-5407') }).then(res=> {
  })
  return false
}
const onEditCommit = (grid, index, oldValue, newValue) => {
  let checkDt = grid.getValue(index.itemIndex, 'CHECK_DT')
  // 정기검진 이전일 수정 시
  if(index.fieldName == 'CHECK_DT_BEF_NEW' ) {
    let medcTestDt = grid.getValue(index.itemIndex, 'MEDC_TEST_DT')
    let checkDtExp = dayjs()
    if(dayjs(medcTestDt) == dayjs(newValue)) {
      checkDtExp = dayjs(medcTestDt).add(179, 'day').format('YYYY-MM-DD')
    } else {
      checkDtExp = dayjs(newValue).add(364, 'day').format('YYYY-MM-DD')
    }
    grid.setValue(index.itemIndex, 'CHECK_DT_EXP', checkDtExp)
    
    if(!isEmpty(checkDt)) {
      grid.setValue(index.itemIndex, 'REMAINING_PERIOD', '')
      if(dayjs(checkDtExp).diff(dayjs(checkDt), 'day') >= 0) {
        grid.setValue(index.itemIndex, 'STATUS', '완료')
      } else {
        grid.setValue(index.itemIndex, 'STATUS', '완료(주기초과)')
      }
    } else {
      let checkSubtractToday = dayjs(checkDtExp).startOf('day').diff(dayjs().startOf('day'), 'day')
      grid.setValue(index.itemIndex, 'REMAINING_PERIOD', checkSubtractToday)
      if(checkSubtractToday >= 0) {
        grid.setValue(index.itemIndex, 'STATUS', '미완료')
      } else {
        grid.setValue(index.itemIndex, 'STATUS', '미완료(주기초과)')
      }
    }
  } else if (index.fieldName == 'CHECK_DT') {
    let checkDtExp = grid.getValue(index.itemIndex, 'CHECK_DT_EXP')
    if(!isEmpty(checkDtExp)) {
      if(!isEmpty(newValue)) {
        grid.setValue(index.itemIndex, 'REMAINING_PERIOD', '')
        if(dayjs(checkDtExp).diff(dayjs(newValue), 'day') >= 0 ) {
          grid.setValue(index.itemIndex, 'STATUS', '완료')
        } else {
          grid.setValue(index.itemIndex, 'STATUS', '완료(주기초과)')
        }
      } else {
        let checkSubtractToday = dayjs(checkDtExp).startOf('day').diff(dayjs().startOf('day'), 'day')
        grid.setValue(index.itemIndex, 'REMAINING_PERIOD', checkSubtractToday)
        if(checkSubtractToday >= 0) {
          grid.setValue(index.itemIndex, 'STATUS', '미완료')
        } else {
          grid.setValue(index.itemIndex, 'STATUS', '미완료(주기초과)')
        }
      }
    }
  } else if (index.fieldName == 'CHECK_ADD_YN') {
    let checkDt = grid.getValue(index.itemIndex, 'CHECK_DT')
    if(!isEmpty(checkDt)) {
      let checkDtExpAdd = dayjs(checkDt).add(179, 'day')
      let ts = dayjs(checkDtExpAdd).startOf('day').diff(dayjs().startOf('day'), 'day')
      if(newValue == 'Y') {
        grid.setValue(index.itemIndex, 'CHECK_DT_BEF_ADD', checkDt)
        grid.setValue(index.itemIndex, 'CHECK_DT_EXP_ADD', checkDtExpAdd.format('YYYY-MM-DD'))
        if(isEmpty(grid.getValue(index.itemIndex, 'CHECK_DT_ADD'))) {
          grid.setValue(index.itemIndex, 'REMAINING_PERIOD_ADD', ts)
          if(ts >= 0) {
            grid.setValue(index.itemIndex, 'STATUS_ADD', '미완료')
          } else {
            grid.setValue(index.itemIndex, 'STATUS_ADD', '미완료(주기초과)')
          }
        } else {
          let ts2 = checkDtExpAdd.diff(dayjs(grid.getValue(index.itemIndex, 'CHECK_DT_ADD')), 'day')
          if(ts2 >= 0) {
            grid.setValue(index.itemIndex, 'STATUS_ADD', '완료')
          } else {
            grid.setValue(index.itemIndex, 'STATUS_ADD', '완료(주기초과)')
          }
        }
      } else {
        grid.setValue(index.itemIndex, 'CHECK_DT_BEF_ADD', '')
        grid.setValue(index.itemIndex, 'CHECK_DT_EXP_ADD', '')
        grid.setValue(index.itemIndex, 'REMAINING_PERIOD_ADD', '')
        grid.setValue(index.itemIndex, 'CHECK_DT_ADD', '')
        grid.setValue(index.itemIndex, 'STATUS_ADD', '')
      }
    } else {
      grid.setValue(index.itemIndex, 'CHECK_ADD_YN', oldValue)
    }
  } else if (index.fieldName == 'CHECK_DT_ADD') {
    let checkDtExpAdd = grid.getValue(index.itemIndex, 'CHECK_DT_EXP_ADD')
    if(!isEmpty(checkDtExpAdd)) {
      if(!isEmpty(newValue)) {
        grid.setValue(index.itemIndex, 'REMAINING_PERIOD_ADD', '')
        let ts2 = dayjs(checkDtExpAdd).diff(dayjs(newValue), 'day')

        if(ts2 >= 0) {
          grid.setValue(index.itemIndex, 'STATUS_ADD', '완료')
        } else {
          grid.setValue(index.itemIndex, 'STATUS_ADD', '완료(주기초과)')
        }
      } else {
        let ts = dayjs(checkDtExpAdd).startOf('day').diff(dayjs().startOf('day'), 'day')
        grid.setValue(index.itemIndex, 'REMAINING_PERIOD_ADD', '')
        if(ts >= 0) {
          grid.setValue(index.itemIndex, 'STATUS_ADD', '미완료')
        } else {
          grid.setValue(index.itemIndex, 'STATUS_ADD', '미완료(주기초과)')
        }
      }
    }
  }
}

const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === 'data') {
    if(clickData.fieldName === 'MANAGE_ITEM'){ 
      const rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      hltkc0010Popup03.value.openPopup(rowData)
    }
  }
}

const afterSaveData = () => {
  getData(false)
  Message.success(t('성공적으로 저장되었습니다'))
}

const openVendPopup = () => {
  vendTreePopup.value.openPopup({ ORGN_DIV: 'B' })
}

const selectedVend = (data) => {
  searchParams.VEND_CD = data.ASGN_CD
  searchParams.VEND_NAME = data.ASGN_NM
  getData()
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnRiskEmpGuide', 'btnAddManage', 'btnSearch', 'btnUpdate', 'btnErrorRequest']"
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
          <i-input
            v-model="searchParams.VEND_NAME"
            label-width="50px"
            :label="$t('소속')"
            width="180px"
            :readonly="true"
          />
          <i-input
            v-model="searchParams.VEND_CD"
            width="150px"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openVendPopup"
            @keydown.enter="openVendPopup"
            :readonly="true"
          >
          </i-input>
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
            @onEditCommit="onEditCommit"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <VendTreePopup ref="vendTreePopup" @selected="selectedVend"/>
    <PdfView ref="pdfPopup"/>
    <HLTKC0010Popup01 ref="hltkc0010Popup01" @after-search="getData"/>
    <HLTKC0010Popup02 ref="hltkc0010Popup02"/>
    <HLTKC0010Popup03 ref="hltkc0010Popup03"/>
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