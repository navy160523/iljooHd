<!--
  화면명 : 통합안전 장소관리
  화면개요 : 장소에 따른 위/경도 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonRequest, getCodeList } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'

const userStore = useUserStore()
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const grdMain = ref(null)
// COMBOBOX DATA
// CODE : SYS_CD, VAL : SYS_CDNM

const searchParams = reactive({
  CMPNY_DIV: 'HHI',
  BIZ_DEPT_CD: '',
  BIZ_BSBN_CD: '',
  BIZ_ZONE_CD: '',
  BIZ_ZONE_NM: '',
  AREA_CD: '',
})

const codeList = reactive({
  DEPT_CD: [],
  GWA_CD: [],
  TEAM_CD: [],
})

// combobox 리스트 조회
const getCode = () => { 
  Promise.all([
      //commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: 'AN00', USE_DIV:'Y' } }), // 부서
      commonSearchApi({ queryId : 'SEARCH_DEPT_SAFE', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV:'Y' } }), // 부서
      commonSearchApi({ queryId : 'OPRAC0010_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
      commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
    ]).then(res => {
      var tempCodeList = []

      for(var j = 0; j < res[0].ORESULT_CUR.length; j++) {      
        tempCodeList.push({ DEPT_CD: res[0].ORESULT_CUR[j].DEPT_CD, DEPT_NM: res[0].ORESULT_CUR[j].DEPT_NM })      
      }
      
      /* for(var i = 0; i < res[0].ORESULT_CUR.length; i++) {
        if(res[0].ORESULT_CUR[i].DEPT_NM.indexOf('안전') !== -1
        && res[0].ORESULT_CUR[i].BSNS_NM === '안전통합경영실') {
          codeList.DEPT_CD.push(res[0].ORESULT_CUR[i])
          tempCodeList.push({DEPT_CD: res[0].ORESULT_CUR[i].DEPT_CD, DEPT_NM: res[0].ORESULT_CUR[i].DEPT_NM})
        }
      } */
            
      codeList.DEPT_CD = res[0].ORESULT_CUR
      codeList.GWA_CD = res[1].ORESULT_CUR
      codeList.TEAM_CD = res[2].ORESULT_CUR

      grdMain.value.setBindingColumn('DEPT_CD', tempCodeList, 'DEPT_CD', 'DEPT_NM')
      grdMain.value.setBindingColumn('GWA_CD', codeList.GWA_CD, 'ASGN_CD', 'ASGN_NM')
      grdMain.value.setBindingColumn('TEAM_CD', codeList.TEAM_CD, 'ASGN_CD', 'ASGN_NM')
      
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true }, edit: { editable: true } },
  keys : ['ALL_SYS_CD', 'SYS_CD'],
  fields: [
   
    { fieldName: 'SYS_CD', dataType: 'text', header: { text: t('시스템 코드'), }, styleName: 'left-column', width : '100' },
    { fieldName: 'SYS_CDNM', dataType: 'text', header: { text: t('장소명'), }, styleName: 'left-column', width : '130', editable: false } ,
    { fieldName: 'LAT', dataType: 'text', header: { text: t('위/경도') }, editable: true, styleName: 'editable_column', width : '150',
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'left-column', enabled: false}
        var data = grid.getValue(dataCell.index.itemIndex, 'WRITE_YN')
        if(data == null) return ret
        if(data == 'Y') {
          ret.editable = true
          ret.styleName = 'editable_column'
          ret.enabled = true
        } 
        return ret 
      }
    },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '100', header: { text: t('안전부') }, editable: false, styleName: '', visible: true,
      editor: { type: 'dropdown' }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'left-column', enabled: false}
        var data = grid.getValue(dataCell.index.itemIndex, 'WRITE_YN')
        if(data == null) return ret
        if(data == 'Y') {
          ret.editable = true
          ret.styleName = 'editable_column'
          ret.enabled = true
        } 
        return ret 
      }
    },
    { fieldName: 'GWA_CD', dataType: 'text', width: '100', header: { text: t('안전과') }, editable: false, styleName: '', lookupDisplay: true, visible: true,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var dropList = { GWA_CD: [], GWA_NM: [] }
        var deptCd = grid.getValue(dataCell.index.itemIndex, 'DEPT_CD')
        for(let cd of codeList.GWA_CD) {
          if((deptCd == null || deptCd == '') || deptCd == cd.DEPT_CD) {
            dropList.GWA_CD.push(cd.ASGN_CD)
            dropList.GWA_NM.push(cd.ASGN_NM)
          }
        }
        ret.editor = {
          type: 'dropdown',
          values: dropList.GWA_CD,
          labels: dropList.GWA_NM,
          editable : false, 
          styleName : 'middle_column', 
          enabled: false
        }
        if(grid.getValue(dataCell.index.itemIndex, 'WRITE_YN') == 'Y') {
          ret.editable = true
          ret.styleName = 'editable_column'
          ret.enabled = true
        } 
        return ret
      },
    },
    { fieldName: 'TEAM_CD', dataType: 'text', header: { text: t('안전팀'), }, styleName: 'left-column', width : '100', editable: true,
      editor: { type: 'dropdown' }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'left-column', enabled: false}
        var dropList = { TEAM_CD: [], TEAM_NM: [] }
        var data = grid.getValue(dataCell.index.itemIndex, 'WRITE_YN')
        var gwaCd = grid.getValue(dataCell.index.itemIndex, 'GWA_CD')
        for(let cd of codeList.TEAM_CD) {
          if((gwaCd == null || gwaCd == '') || cd.PRNT_CD == gwaCd) {
            dropList.TEAM_CD.push(cd.ASGN_CD)
            dropList.TEAM_NM.push(cd.ASGN_NM)
          } 
        }
        ret.editor = { 
          type: 'dropdown',
          values: dropList.TEAM_CD,
          labels: dropList.TEAM_NM,
          editable : false, 
          styleName : 'left-column', 
          enabled: false
        }

        if(data == null) return ret
        if(data == 'Y') {
          ret.editable = true
          ret.styleName = 'editable_column'
          ret.enabled = true
        } 
        return ret 
      }
    },
    { fieldName: 'EXCLUDE_WORK', dataType: 'boolean', renderer: { type: "check" }, width: '60', header: { text: t('안전요원 배치제외'), }, editable: false,  
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : '', enabled: false}
        var data = grid.getValue(dataCell.index.itemIndex, 'WRITE_YN')
        if(data == null) {
          ret.renderer = {
            type: 'text',
            enabled: false,
            editable: false,
          }
          return ret
        }
        if(data == 'Y') {
          ret.editable = false
          ret.styleName = 'editable_column change_back_check'
          ret.enabled = true
        } 
        return ret 
      },
      'displayCallback': function (grid, index, value) {
        var data = grid.getValue(index.itemIndex, 'WRITE_YN')
        if(data == null) return ''
      }
    },
    { fieldName: 'ORDER_NUM', dataType: 'number', "numberFormat": "#,##0", header: { text: t('정렬순서'), }, styleName: 'right-column', width : '60', editable: true,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : '', enabled: false}
        var data = grid.getValue(dataCell.index.itemIndex, 'WRITE_YN')
        if(data == null) {
          ret.renderer = {
            type: 'text',
            enabled: false,
            editable: false,
          }
          return ret
        }
        if(data == 'Y') {
          ret.editable = true
          ret.styleName = 'editable_column right-column'
          ret.enabled = true
        } 
        return ret 
      },
    },

    { fieldName: 'ALL_SYS_CD', dataType: 'text', header: { text: t('시스템 전체코드') }, styleName: 'right-column', visible:false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업부') }, styleName: 'right-column', visible:false },
    { fieldName: 'BIZ_DEPT_CD', dataType: 'text', header: { text: t('사업부문') }, styleName: 'right-column', visible:false },
    { fieldName: 'BIZ_BSBN_CD', dataType: 'text', header: { text: t('사업구역') }, styleName: 'right-column', visible:false },
    { fieldName: 'BIZ_ZONE_CD', dataType: 'text', header: { text: t('장소') }, styleName: 'right-column', visible:false },
    { fieldName: 'AREA_CD', dataType: 'text', header: { text: t('사업장구분') }, styleName: 'right-column', visible:false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', header: { text: t('작성자') }, visible: false },
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('작성일자') }, visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', header: { text: t('수정자') }, visible: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일자') }, visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USERID') }, visible: false },
    { fieldName: 'WRITE_YN', dataType: 'text', header: { text: t('수정가능여부') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 상단 버튼 클릭
const onButtonsClick = (btn) => {
  if(btn.id === 'btnExpand'){
    grdMain.value.getGridView().expandAll()
  } else if(btn.id === 'btnCollapse'){
    grdMain.value.getGridView().collapseAll()
  } else if (btn.id === 'btnSearch') {
    grdMain.value.getDataProvider().setRows([])
    searchData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setConfirmMessage('삭제시 데이터 베이스에서도 바로 삭제됩니다. 진행하시겠습니까?')
    .setQuery(deleteMainData)
    .setAfter(afterCloseDelete)
    .run()
  }
}

//DB 삭제
const deleteMainData = () =>{
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return

  let deleteList = []
  for(let i = 0; i < deleteRows.length; i++){
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(deleteRows[i])
    grdJsonRow.CMPNY_DIV = userStore.cmpnyDiv
    deleteList.push(grdJsonRow)
  }  
  return commonExecuteApi({ queryId : 'OPRAG0020_DELETE_01', list: deleteList })
}

//삭제 후 그리드 삭제
const afterCloseDelete = res => {
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return

  grdMain.value.getDataProvider().removeRows(deleteRows)
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }
  return true
}
 
// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let allSysCd = data.ALL_SYS_CD.replaceAll('HHIZ012','').replaceAll(data.SYS_CD,'')

    if(data.WRITE_YN != 'Y') continue
    data.USER_ID = userStore.userId // USER_ID
    data.BIZ_DEPT_CD = allSysCd.substring(0,1)
    data.BIZ_BSBN_CD = allSysCd.substring(1,2)
    data.BIZ_ZONE_CD = allSysCd.substring(2,5)
    data.AREA_CD = data.SYS_CD
    saveParams.push(data) 
  }
  
  return commonRequest('/hse/operation/OPRAG0020_save01', { queryId : 'OPRAG0020_SAVE_01', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => {
  // check된 행 체크 해제
  grdMain.value.getGridView().getCheckedRows(true).forEach(element => {
    grdMain.value.getGridView().checkRow(element, false, false, false)
  })

  Message.success(t('성공적으로 저장되었습니다'))
}

//조회 함수
const searchData = () =>{
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run() 
}

//DB 조회
const searchMainData = () => {  
  return commonSearchApi({ queryId : 'OPRAG0020_SEARCH_06', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, 'ALL_SYS_CD')
  grdMain.value.getGridView().expandAll()
}

onMounted(() => {
  getCode()
  onButtonsClick({ id:'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t('안전야드맵 장소매핑')"
        :button-list="['btnExpand', 'btnCollapse','btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
        hiddenManuel
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">          
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            is-tree
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"            
            @on-edit-row-changed="editRowChanged"
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
  height: calc(100vh - 180px - 110px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
