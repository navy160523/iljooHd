<!-- 
  화면명 : 작업환경측정 기초정보관리
  화면개요 : 기초정보관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'
import CopyPopup from '@/pages/100_health/HLT_F/HLTFA0010Popup01.vue'
import HLTFA0020Popup01 from '@/pages/100_health/HLT_F/HLTFA0020Popup01.vue'
import HLTFA0020Popup02 from '@/pages/100_health/HLT_F/HLTFA0020Popup02.vue'
import HLTFA0020Popup03 from '@/pages/100_health/HLT_F/HLTFA0020Popup03.vue'

defineOptions({
  name:'100_health-HLT_F-HLTFA0020', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const copyPopup = ref(null)
const targetArgPopup = ref(null)
const targetDeptPopup = ref(null)
const processPopup = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: Number(dayjs().get('month')) > 6 ? 'LO' : 'HI',
  YEAR: String(dayjs().get('year')),
  REG_DIV: 'A',
  TAGET_DIV: 'Y',
  ORGN_DIV: '',
})

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  TAGET_DIV: [
    { COD: 'Y', TXT: '대상' },
    { COD: 'N', TXT: '비대상' },
  ],
  ORGN_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '협력사' },
  ],
  ORGN_DIV_GRID: [
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '협력사' },
  ],
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
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.HALF_DIV = res[2].ORESULT_CUR
    grdMain.value.setBindingColumn('BSNS_NM', codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_NM', codeList.DEPT_CD, 'DEPT_CD', 'DEPT_NM')
    grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
  })

  grdMain.value.setBindingColumn('REG_DIV', codeList.REG_DIV, 'COD', 'TXT')
  grdMain.value.setBindingColumn('TAGET_DIV', codeList.TAGET_DIV, 'COD', 'TXT')
  grdMain.value.setBindingColumn('ORGN_DIV', codeList.ORGN_DIV_GRID, 'COD', 'TXT')
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 

    { fieldName: 'YEAR', width: '40', dataType: 'text', editable: false, header: { text: t('년도') } },
    { fieldName: 'HALF_DIV', width: '40', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t('반기') }, editor: { type: 'dropdown' }, lookupDisplay: true,
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
    { fieldName: 'REG_DIV', width: '40', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t('구분') }, editor: { type: 'dropdown' }, lookupDisplay: true,
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
    { fieldName: 'BSNS_NM', width: '100', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t('사업부') }, editor: { type: 'dropdown' }, lookupDisplay: true,
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
    { fieldName: 'BSNS_CD', width: '40', editable: false, dataType: 'text', header: { text: t('사업부코드') },
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
    { fieldName: 'DEPT_NM', width: '100', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t('부서명') }, editor: { type: 'dropdown' }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        var dropList = { DEPT_CD: [], DEPT_NM: [] }
        var bsnsCd = grid.getValue(dataCell.index.itemIndex, 'BSNS_CD')
        var orgnDiv = grid.getValue(dataCell.index.itemIndex, 'ORGN_DIV')
        var deptList = []

        // 모든 DEPT_CD를 담는다.
        for(var data of grdMain.value.getDataProvider().getJsonRows(0,-1)) {
          deptList.push(data.DEPT_CD)
        }

        // 해당 사업부에 해당되는 부서만 가져온다.
        for(let cd of codeList.DEPT_CD) {
          if((isEmpty(bsnsCd) || bsnsCd == cd.BSNS_CD) && !deptList.includes(cd.DEPT_CD) && orgnDiv == cd.ORGN_DIV) {
            dropList.DEPT_CD.push(cd.DEPT_CD)
            dropList.DEPT_NM.push(cd.DEPT_NM)
          } 
        }

        // drop리스트가 없으면 모든 부서, 협력사가 나오는 것을 방지
        if(isEmpty(dropList.DEPT_CD)) {
          dropList.DEPT_CD.push('')
          dropList.DEPT_NM.push('')
        }

        ret.editor = {
          type: 'dropdown',
          values: dropList.DEPT_CD,
          labels: dropList.DEPT_NM,
          editable : true, 
          styleName : 'editable_column', 
          enabled: true
        }

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
    { fieldName: 'DEPT_CD', width: '40', editable: false, dataType: 'text', header: { text: t('부서코드') },
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
    { fieldName: 'PROCESS_CNT', width: '40', editable: false, dataType: 'text', header: { text: t('공정정보') },
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'TAGET_DIV', width: '50', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t('대상구분') }, editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'REMARK', width: '150', styleName: 'editable_column', dataType: 'text', header: { text: t('비고') } },
    // { fieldName: 'PROCESS_NM', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('공정명') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'ORGN_DIV', width: '40', editable: true, dataType: 'text', styleName: 'editable_column', header: { text: t('조직구분') }, editor: { type: 'dropdown' }, lookupDisplay: true, visible: false,
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
      REG_DIV: searchParams.REG_DIV,
      BSNS_CD: '',
      BSNS_NM: '',
      DEPT_CD: '',
      DEPT_NM: '',
      PROCESS_CNT: 0,
      ORGN_DIV: 'A',
      TAGET_DIV: 'Y',
      REMARK: '',
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
  } else if (btn.id === 'btnCopy') {
    copyPopup.value.openPopup(searchParams, 'HLTFA0020_SEARCH_03', 'HLTFA0020_SAVE_02')
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnTargetArg') {
    targetArgPopup.value.openPopup(searchParams)
  } else if (btn.id === 'btnTargetDept') {
    targetDeptPopup.value.openPopup(searchParams)
  }
}

// 그리드 데이터 조회
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
  return commonSearchApi({ queryId: 'HLTFA0020_SEARCH_01', param: searchParams })
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
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.HALF_DIV)) {
      return Message.warn(t('반기는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.REG_DIV)) {
      return Message.warn(t('구분은 필수 입력 사항입니다.'))
    } else if(isEmpty(data.BSNS_CD)) {
      return Message.warn(t('사업부는 필수 입력 사항입니다.'))
    } else if(isEmpty(data.DEPT_CD)) {
      return Message.warn(t('부서는 필수 입력 사항입니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let bsnsNm = codeList.BSNS_CD.find(item => item.BSNS_CD == data.BSNS_CD) 
    let deptNm = codeList.DEPT_CD.find(item => item.DEPT_CD == data.DEPT_CD) 
    if(!isEmpty(bsnsNm)) {
      data.BSNS_NM = bsnsNm.BSNS_NM
    }
    if(!isEmpty(deptNm)) {
      data.DEPT_NM = deptNm.DEPT_NM
    }
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTFA0020_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    // DB에 저장되있는 것만 넣는다.
    if(data.SAVE_YN != 'Y') {
      continue
    }
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTFA0020_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

// 그리드 데이터 변경 시
const onEditChange = (grid, index, value) => {
  if(index.fieldName == 'BSNS_NM') {
    // 사업부 변경 시 코드 변경
    if(codeList.BSNS_CD.find(item => item.BSNS_CD == value)) {
      grid.setValue(index.itemIndex, 'BSNS_CD', value)
    }
    grid.setValue(index.itemIndex, 'DEPT_CD', '')
    grid.setValue(index.itemIndex, 'DEPT_NM', '')
  } else if(index.fieldName == 'DEPT_NM') {
    // 부서 변경 시 코드 변경
    if(codeList.DEPT_CD.find(item => item.DEPT_CD == value)) {
      grid.setValue(index.itemIndex, 'DEPT_CD', value)
    }
  } else if(index.fieldName == 'ORGN_DIV') {
    grid.setValue(index.itemIndex, 'DEPT_CD', '')
    grid.setValue(index.itemIndex, 'DEPT_NM', '')
  } 
}

const onEditCommit = async (grid, index, oldValue, newValue) => {
  if (index.fieldName == 'DEPT_CD') {
    let dupe = grdMain.value.getDataProvider().getJsonRows().filter(item => item.DEPT_CD == newValue)
    if(dupe.length >= 1) {
      Message.warn(t('부서코드는 중복될 수 없습니다.'))
      await nextTick()
      grid.setValue(index.itemIndex, 'DEPT_CD', '')
    }
  }
}

const addDept = (dept) => {
  // 이미 같은 데이터가 있을 시 return
  if(!isEmpty(grdMain.value.getDataProvider().getJsonRows(0,-1).filter(item => item.DEPT_CD === dept.ASGN_CD))) {
    return targetDeptPopup.value.setErrorMsg(dept.ASGN_NM)
  }
  grdMain.value.getGridView().filterPanel.clearInput()
  grdMain.value.addRow({
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: searchParams.YEAR,
    HALF_DIV: searchParams.HALF_DIV,
    REG_DIV: searchParams.REG_DIV,
    BSNS_CD: dept.BSNS_CD,
    BSNS_NM: dept.BSNS_CD,
    DEPT_CD: dept.ASGN_CD,
    DEPT_NM: dept.ASGN_CD,
    ORGN_DIV: dept.ORGN_DIV,
    PROCESS_CNT: 0,
    TAGET_DIV: 'Y',
    REMARK: '',
    SAVE_YN: 'N',
  }, false)
}

const onCellClicked = (grid, clickData) => {
  if(clickData.fieldName === 'PROCESS_CNT') {
    if(grid.getValue(clickData.itemIndex, 'SAVE_YN') != 'Y') {
      return Message.err(t('작업환경측정 기초정보 신규 생성시 저장 후 상세정보 팝업이 조회됩니다.'))
    }
    processPopup.value.openPopup(grdMain.value.getDataProvider().getJsonRow(clickData.dataRow))
  }
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

watch(() => searchParams.TAGET_DIV, (newValue, oldValue) => {
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
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnCopy']"
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
          <i-select
            v-model="searchParams.TAGET_DIV"
            :label="$t('대상')"
            label-width="50px"
            :items="codeList.TAGET_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle
            ref="gridTitle"
            :usePermission="false"
            :title="$t('작업환경측정 기초정보 목록')"
            :button-list="['btnTargetArg', 'btnTargetDept']"
            @click-button="onButtonsClick"
          />
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onCellClicked="onCellClicked"
            @onEditChange="onEditChange"
            @onEditCommit="onEditCommit"
          />
        </v-sheet>
      </div>
      <!-- 팝업 -->
      <!-- 복사 -->
      <CopyPopup ref="copyPopup" @after-search="() => onButtonsClick({ id:'btnSearch' })"/>
      <!-- 측정대상인자관리 -->
      <HLTFA0020Popup01 ref="targetArgPopup" @after-search="() => onButtonsClick({ id:'btnSearch' })"/>
      <!-- 측정대상부서선정 -->
      <HLTFA0020Popup02 ref="targetDeptPopup" @add-dept="addDept"/>
      <!-- 공정정보 -->
      <HLTFA0020Popup03 ref="processPopup" @after-search="() => onButtonsClick({ id:'btnSearch' })"/>
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