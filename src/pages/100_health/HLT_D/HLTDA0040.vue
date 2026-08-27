<!-- 
  화면명 : 화학물질 규제정보
  화면개요 : 화학물질 규제정보
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'100_health-HLT_D-HLTDA0040', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const gridData = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  CASNO: '',
  CASNM_KOR: '',
  CASNM_ENG: '',
  FILTER: ''
})

const codeList = reactive({
  DTX0: [
    { COD: '', TXT: ''},
    { COD: 'Y', TXT: 'O'},
    { COD: 'N', TXT: 'X'},
  ],
  DT13: [
    { COD: '', TXT: ''},
    { COD: '2', TXT: '2'},
  ],
  DTMAT: [],
  DT_FILTER: [],
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTD001') || userStore.authGrpCd.includes('GRP00372')) isAdmin.value = true

  onButtonsClick({ id: 'btnSearch' })

  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 3,
    })
  })

  Promise.all([
    // 분류
    getCodeList('HHII060'),    
  ]).then((res) => {
    codeList.DTMAT = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('EXTINFO_05', codeList.DTMAT, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_06', codeList.DTMAT, 'COD', 'TXT')
    
    grdMain.value.setBindingColumn('EXTINFO_01', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_02', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_03', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_07', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_08', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_16', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_17', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_18', codeList.DTX0, 'COD', 'TXT')

    grdMain.value.setBindingColumn('EXTINFO_13', codeList.DT13, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_14', codeList.DT13, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_15', codeList.DT13, 'COD', 'TXT')
  })


  if(searchParams.CMPNY_DIV == '200') {
    grdMain.value.getGridView().setColumnProperty('EXTINFO_12', 'header', { text: t('HE\n관리') })
  } else {
    grdMain.value.getGridView().setColumnProperty('EXTINFO_12', 'header', { text: t('HHI\n관리') })
  } 
  grdMain.value.getGridView().filterPanel.visible = true

  setFilter()
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }, header: { height: 75 }},
  keys : ['SEQNO'],
  fields : [ 

    { fieldName: 'CASNM_KOR', width: '300', dataType: 'text', header: { text: t('국문표기') } },
    { fieldName: 'CASNM_ENG', width: '300', dataType: 'text', header: { text: t('영문표기') } },
    { fieldName: 'CASNO', width: '180', dataType: 'text', header: { text: t('CAS번호') } },
    { fieldName: 'EXTINFO_01', width: '60', dataType: 'text', header: { text: t('제조\n등 금지'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_02', width: '60', dataType: 'text', header: { text: t('허가\n물질'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_03', width: '60', dataType: 'text', header: { text: t('취급\n금지'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_04', width: '60', dataType: 'text', header: { text: t('발암성1') } },
    { fieldName: 'EXTINFO_05', width: '60', dataType: 'text', header: { text: t('생식\n독성1'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_06', width: '60', dataType: 'text', header: { text: t('변이\n원성1'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_07', width: '60', dataType: 'text', header: { text: t('특별\n관리'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_08', width: '60', dataType: 'text', header: { text: t('허용\n기준'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_09', width: '60', dataType: 'text', header: { text: t('유독\n물질'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_10', width: '60', dataType: 'text', header: { text: t('사고\n대비'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_11', width: '60', dataType: 'text', header: { text: t('제한\n물질'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_12', width: '60', dataType: 'text', header: { text: t('HHI\n관리'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_13', width: '60', dataType: 'text', header: { text: t('발암성2') }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_14', width: '60', dataType: 'text', header: { text: t('생식\n독성2'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_15', width: '60', dataType: 'text', header: { text: t('변이\n원성2'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_16', width: '60', dataType: 'text', header: { text: t('측정\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_17', width: '60', dataType: 'text', header: { text: t('관리\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_18', width: '60', dataType: 'text', header: { text: t('특검\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_19', width: '60', dataType: 'text', header: { text: t('배출량\n조사'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_20', width: '150', dataType: 'text', header: { text: t('기존\n물질'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_21', width: '150', dataType: 'text', header: { text: t('위험물') } },
    
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SEQNO', dataType: 'text', header: { text: t('SQNO') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columnLayout: [
    'CASNM_KOR',
    'CASNM_ENG',
    'CASNO',
    {
          name: '금지 그룹',
          direction: 'horizontal',
          items: [ 'EXTINFO_01', 'EXTINFO_02', 'EXTINFO_03' ],
          header: { text: t('금지 그룹') },
    },
    {
          name: '제한 그룹',
          direction: 'horizontal',
          items: [ 'EXTINFO_04','EXTINFO_05', 'EXTINFO_06', 'EXTINFO_07', 'EXTINFO_08', 'EXTINFO_09', 'EXTINFO_10', 'EXTINFO_11', 'EXTINFO_12' ],
          header: { text: t('제한 그룹') },
    },
    {
          name: '관찰 그룹',
          direction: 'horizontal',
          items: [ 'EXTINFO_13', 'EXTINFO_14', 'EXTINFO_15', 'EXTINFO_16', 'EXTINFO_17', 'EXTINFO_18'],
          header: { text: t('관찰 그룹') },
    },
    {
          name: '기타 그룹',
          direction: 'horizontal',
          items: [ 'EXTINFO_19'],
          header: { text: t('기타 그룹') },
    },
    'EXTINFO_20',
    'EXTINFO_21',
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
    searchParams.FILTER = ''
    getData()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      CASNM_KOR: '',
      CASNM_ENG: '',
      CASNO: '',
      SEQNO: '',
      EXTINFO_01: '',
      EXTINFO_02: '',
      EXTINFO_03: '',
      EXTINFO_04: '',
      EXTINFO_05: '',
      EXTINFO_06: '',
      EXTINFO_07: '',
      EXTINFO_08: '',
      EXTINFO_09: '',
      EXTINFO_10: '',
      EXTINFO_11: '',
      EXTINFO_12: '',
      EXTINFO_13: '',
      EXTINFO_14: '',
      EXTINFO_15: '',
      EXTINFO_16: '',
      EXTINFO_17: '',
      EXTINFO_18: '',
      EXTINFO_19: '',
      EXTINFO_20: '',
      EXTINFO_21: '',
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

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTDA0040_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  gridData.value = res.ORESULT_CUR
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 행마다 색깔 바꾸기
  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = { style:{ background: '#eff8fd' } }

    if((!isEmpty(grid.getValue(item.index, 'EXTINFO_01')) && grid.getValue(item.index, 'EXTINFO_01') != 'N') ||
      (!isEmpty(grid.getValue(item.index, 'EXTINFO_02')) && grid.getValue(item.index, 'EXTINFO_02') != 'N') ||
      (!isEmpty(grid.getValue(item.index, 'EXTINFO_03')) && grid.getValue(item.index, 'EXTINFO_03') != 'N')) {
      // 금지그룹
      ret.style = { background: '#E6B8B7' }
      return ret
    } else if(!isEmpty(grid.getValue(item.index, 'EXTINFO_04')) ||
      !isEmpty(grid.getValue(item.index, 'EXTINFO_05')) ||
      !isEmpty(grid.getValue(item.index, 'EXTINFO_06')) ||
      (!isEmpty(grid.getValue(item.index, 'EXTINFO_07')) && grid.getValue(item.index, 'EXTINFO_07') != 'N') ||
      (!isEmpty(grid.getValue(item.index, 'EXTINFO_08')) && grid.getValue(item.index, 'EXTINFO_08') != 'N') ||
      !isEmpty(grid.getValue(item.index, 'EXTINFO_09')) ||
      !isEmpty(grid.getValue(item.index, 'EXTINFO_10')) ||
      !isEmpty(grid.getValue(item.index, 'EXTINFO_11')) ||
      !isEmpty(grid.getValue(item.index, 'EXTINFO_12'))) {
      // 제한그룹
      ret.style = { background: '#FCD5B4' }
      return ret
    } else if(!isEmpty(grid.getValue(item.index, 'EXTINFO_13')) ||
      !isEmpty(grid.getValue(item.index, 'EXTINFO_14')) ||
      !isEmpty(grid.getValue(item.index, 'EXTINFO_15')) ||
      (!isEmpty(grid.getValue(item.index, 'EXTINFO_16')) && grid.getValue(item.index, 'EXTINFO_16') != 'N') ||
      (!isEmpty(grid.getValue(item.index, 'EXTINFO_17')) && grid.getValue(item.index, 'EXTINFO_17') != 'N') ||
      (!isEmpty(grid.getValue(item.index, 'EXTINFO_18')) && grid.getValue(item.index, 'EXTINFO_18') != 'N')) {
      // 관찰그룹
      ret.style = { background: '#8DB4E2' }
      return ret
    } else if(!isEmpty(grid.getValue(item.index, 'EXTINFO_19'))) {
      // 기타그룹
      ret.style = { background: '#D8E4BC' }
      return ret
    }
    return ret
  })
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
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
  return commonExecuteApi({ queryId : 'HLTDA0040_SAVE_01', list: saveParams })
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

    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTDA0040_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

const onEditCommit = (grid, index, oldValue, newValue) => {
  if(index.fieldName == 'CASNO' ) {
    let param = {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      SEQNO: grid.getValue(index.itemIndex, 'SEQNO'),
      CASNO: newValue
    } 
    let casnoList = grdMain.value.getDataProvider().getJsonRows(0,-1)
    let dupe = false
    // 빈값일때는 return
    if(isEmpty(newValue)) {
      return
    } else if(isEmpty(newValue.trim())) {
      return
    }

    for(let i = 0; i < casnoList.length; i++) {
      let data = casnoList[i]
      // null이면 conitnue
      if(isEmpty(data.CASNO)) continue
      // null인데 trim쓰면 에러난다. ' ' 이런 데이터도 continue
      if(isEmpty(data.CASNO.trim())) continue
      // 본인 데이터면 continue
      if(index.itemIndex === i) continue

      if(newValue.trim() == data.CASNO.trim()) {
        dupe = true
        break
      }
    }
    if(!dupe) {
      Promise.all([
        // casno 중복 확인
        commonSearchApi({ queryId: 'HLTDA0040_SEARCH_02', param: param }),
      ]).then((res) => {
        // 중복 없으면 return, 있으면 해당 casno으로는 안됨.
        if(isEmpty(res[0].ORESULT_CUR)) {
          return
        } else if(res[0].ORESULT_CUR[0].CNT > 0) {
          grid.setValue(index.itemIndex, 'CASNO', oldValue)
          return Message.err(t('중복된 CAS번호입니다.'))
        }
      })
    } else {
      // nextTick없으면 setValue가 제대로 동작하지 않는다.
      vm.$nextTick(() => {
        grid.setValue(index.itemIndex, 'CASNO', oldValue)
        return Message.err(t('중복된 CAS번호입니다.'))
      })
    }
  } 
}

const setFilter = () => {
  codeList.DT_FILTER.push({ COD: '', TXT: '전체' })
  codeList.DT_FILTER.push({ COD: 'GROUP_A', TXT: '금지그룹' })
  codeList.DT_FILTER.push({ COD: 'GROUP_B', TXT: '제한그룹' })
  codeList.DT_FILTER.push({ COD: 'GROUP_C', TXT: '관찰그룹' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_01', TXT: '금지그룹(제조등금지)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_02', TXT: '금지그룹(허가물질)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_03', TXT: '금지그룹(취급금지)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_04', TXT: '제한그룹(발암성1)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_05', TXT: '제한그룹(생식독성1)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_06', TXT: '제한그룹(변이원성1)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_07', TXT: '제한그룹(특별관리)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_08', TXT: '제한그룹(허용기준)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_09', TXT: '제한그룹(유독물질)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_10', TXT: '제한그룹(사고대비)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_11', TXT: '제한그룹(제한물질)' })

  if(searchParams.CMPNY_DIV == '200') {
    codeList.DT_FILTER.push({ COD: 'EXTINFO_12', TXT: '제한그룹(HE관리)' })
  } else {
    codeList.DT_FILTER.push({ COD: 'EXTINFO_12', TXT: '제한그룹(HHI관리)' })
  }

  codeList.DT_FILTER.push({ COD: 'EXTINFO_13', TXT: '관찰그룹(발암성2)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_14', TXT: '관찰그룹(생식독성2)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_15', TXT: '관찰그룹(변이원성2)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_16', TXT: '관찰그룹(측정대상)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_17', TXT: '관찰그룹(관리대상)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_18', TXT: '관찰그룹(특검대상)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_19', TXT: '기타그룹(배출량조사)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_20', TXT: '기존물질' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_21', TXT: '위험물' }) 
}

watch(() => searchParams.FILTER, (newValue, oldValue) => {
  if (isEmpty(newValue)) {
    grdMain.value.getDataProvider().setRows(gridData.value)
  } else if (newValue === 'GROUP_A') {
    grdMain.value.getDataProvider().setRows(gridData.value.filter(item => !isEmpty(item.EXTINFO_01) || !isEmpty(item.EXTINFO_02) || !isEmpty(item.EXTINFO_03)))
  } else if (newValue === 'GROUP_B') {
    grdMain.value.getDataProvider().setRows(gridData.value.filter(item => !isEmpty(item.EXTINFO_04) || !isEmpty(item.EXTINFO_05) || !isEmpty(item.EXTINFO_06) || !isEmpty(item.EXTINFO_07) || !isEmpty(item.EXTINFO_08) || !isEmpty(item.EXTINFO_09) || !isEmpty(item.EXTINFO_10) || !isEmpty(item.EXTINFO_11) || !isEmpty(item.EXTINFO_12)))
  } else if (newValue === 'GROUP_C') {
    grdMain.value.getDataProvider().setRows(gridData.value.filter(item => !isEmpty(item.EXTINFO_13) || !isEmpty(item.EXTINFO_14) || !isEmpty(item.EXTINFO_15) || !isEmpty(item.EXTINFO_16) || !isEmpty(item.EXTINFO_17) || !isEmpty(item.EXTINFO_18)))
  } else {
    grdMain.value.getDataProvider().setRows(gridData.value.filter(item => !isEmpty(item[newValue])))
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
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('CAS 번호')"
            v-model="searchParams.CASNO"
            label-width="60px"
            type="text"
            width="300px"
            @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
          />
          <i-input
            :label="$t('국문명')"
            v-model="searchParams.CASNM_KOR"
            label-width="60px"
            type="text" 
            width="300px"
            @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
          />
          <i-input
            :label="$t('영문명')"
            v-model="searchParams.CASNM_ENG"
            label-width="60px"
            type="text" 
            width="300px"
            @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
          />
          <i-select
            v-model="searchParams.FILTER"
            :label="$t('데이터 필터')"
            label-width="80px"
            :items="codeList.DT_FILTER"
            item-value="COD"
            item-title="TXT"
            width="300px"
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
            @onEditCommit="onEditCommit"
          />
        </v-sheet>
      </div>
      <!-- 팝업존 -->
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