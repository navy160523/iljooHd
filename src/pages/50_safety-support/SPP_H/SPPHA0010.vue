<!-- SPPHA0010 건물/구축물 좌표 관리 -->
<!-- SI2팀 손상규 2025-02-03 -->

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
import Message from '@hiway/utils/notify'

defineOptions({
  name:'50_safety-support-SPP_H-SPPHA0010', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  CODENME1: '',
  CODENME2: '',
  EQ3: '',
  EQUIPNME: ''
})

const codeList = reactive({
  CODENME1LIST: [],
  CODENME2LIST: [],
})

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
})

const initCodeList = () => {
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv
  }
  // 첫 번째 API 호출 (SPPHA0010_COMBO_01)
  commonSearchApi({ queryId: 'SPPHA0010_COMBO_01', param: param })
    .then(res1 => {
      // console.log(res1)
      codeList.CODENME1LIST = res1.ORESULT_CUR
      if (codeList.CODENME1LIST.length > 0) {
        // 첫 번째 값 설정
        searchParams.CODENME1 = codeList.CODENME1LIST[0].CODE
      }

      // 두 번째 API 호출 (SPPHA0010_COMBO_02)
      return commonSearchApi({
        queryId: 'SPPHA0010_COMBO_02',
        param: { 
          CMPNY_DIV: userStore.cmpnyDiv, 
          GUBN1: searchParams.CODENME1 
        }
      })
    })
    .then(res2 => {
      codeList.CODENME2LIST = res2.ORESULT_CUR
      codeList.CODENME2LIST.unshift({ CODE: '', DISPLAY_TEXT: '전체' })
    })
}

// 대분류 선택시 중분류 조회
const codenme2Change = async e => { 
  codeList.CODENME2LIST = []

  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    GUBN1: searchParams.CODENME1
  }
  Promise.all([
    await commonSearchApi({ queryId: 'SPPHA0010_COMBO_02', param: param })
  ]).then(res => {
    codeList.CODENME2LIST = res[0].ORESULT_CUR
    codeList.CODENME2LIST.unshift({ CODE: '', DISPLAY_TEXT: '전체' });
    searchParams.CODENME2 = ''
  })
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 

    {
      fieldName: 'CODENME1', width: '100', editable: true, dataType: 'text', header: { text: t('대분류') },
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
    {
      fieldName: 'CODENME2', width: '100', editable: true, dataType: 'text', header: { text: t('중분류') },
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
    {
      fieldName: 'CODENME3', width: '100', editable: true, styleName: 'editable_column', dataType: 'text', header: { text: t('소분류') },
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
    {
      fieldName: 'EQ3', width: '120', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('설비코드') },
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
    { fieldName: 'EQUIPNME', width: '250', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('설비명') } },
    { fieldName: 'USE_YN', width: '40', editable: false, dataType: 'text', header: { text: t('사용유무') }, styleName: 'change_back_check', renderer: { type: "check", trueValues: 'Y', falseValues: 'N' } },
    { fieldName: 'SPOT_X', width: '150', styleName: 'editable_column right-column', dataType: 'text', header: { text: t('경도') }, editor: { type: 'number' } },
    { fieldName: 'SPOT_Y', width: '150', styleName: 'editable_column right-column', dataType: 'text', header: { text: t('위도') }, editor: { type: 'number' } },
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
  if (btn.id === 'btnDataDownload') {
    new saveFlowHelper(vm, t)
      .setQuery(saveDownloadData)
      .setAfter(afterSaveDownload)
      .run()
  } else if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      CODENME1: searchParams.CODENME1,
      CODENME2: searchParams.CODENME2 ? searchParams.CODENME2: ' ',
      CODENME3: ' ',
      EQ3: '',
      EQUIPNME: ' ',
      USE_YN: 'Y',
      SPOT_X: '',
      SPOT_Y: '',
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

//데이터 받기 버튼
const saveDownloadData = () => { 
  let saveParams = [{CMPNY_DIV: 'HHI', USER_ID: userStore.userId }];

  return commonExecuteApi({ queryId: 'SPPHA0010_CHECK_NEW_DATA', list: saveParams })
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

//  조회
const searchData = () => {
  // console.log(searchParams)
  return commonSearchApi({ queryId: 'SPPHA0010_SEARCH_01', param: searchParams })
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
    if(isEmpty(data.EQ3)) {
      return Message.warn(t('설비코드는 필수 입력입니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (data.USE_YN == 'true') {
      data.USE_YN = 'Y'
    } else if (data.USE_YN == 'false') { 
      data.USE_YN = 'N'
    }
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPHA0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const afterSaveDownload = () => {
  getData()
  Message.success(t('데이터 받기를 완료했습니다.'))
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
  
  return commonExecuteApi({ queryId : 'SPPHA0010_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="true"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnDataDownload', 'btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.CODENME1"
            :label="$t('대분류')"
            :items="codeList.CODENME1LIST"
            item-value="CODE"
            item-title="DISPLAY_TEXT" 
            label-width="40px"
            width="180px"
            @update:modelValue="codenme2Change"
          />
          <i-select
            v-model="searchParams.CODENME2"
            :label="$t('중분류')"
            :items="codeList.CODENME2LIST"
            item-value="CODE"
            item-title="DISPLAY_TEXT" 
            label-width="40px"
            width="180px"
          />
          <i-input
            :label="$t('설비코드')"
            v-model="searchParams.EQ3"
            type="text"
            label-width="50px"
            width="200px"
            @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
          />
          <i-input
            :label="$t('설비명')"
            v-model="searchParams.EQUIPNME"
            type="text" 
            label-width="40px"
            width="250px"
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