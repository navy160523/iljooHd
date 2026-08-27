<!-- SPPHA0010 공통코드 관리 -->
<!-- SI2팀 손상규 2025-02-06 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
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
import Message from '@hiway/utils/notify'

defineOptions({
  name:'50_safety-support-SPP_H-SPPHA0020', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  MAIN_CODE: '',
  SUB_CODE: ''
})

const codeList = reactive({
  MAINCDLIST: [],
  SUBCDLIST: [],
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
  commonSearchApi({ queryId: 'SPPHA0020_COMBO_01', param: param })
    .then(res1 => {
      // console.log(res1)
      codeList.MAINCDLIST = res1.ORESULT_CUR
      codeList.MAINCDLIST.unshift({ CODE: '', DISPLAY_TEXT: '메인코드 전체' })
      if (codeList.MAINCDLIST.length > 0) {
        // 첫 번째 값 설정
        searchParams.MAIN_CODE = codeList.MAINCDLIST[0].CODE
      }

      // 두 번째 API 호출 (SPPHA0010_COMBO_02)
      return commonSearchApi({
        queryId: 'SPPHA0020_COMBO_02',
        param: { 
          CMPNY_DIV: userStore.cmpnyDiv, 
          MAIN_CODE: searchParams.MAIN_CODE 
        }
      })
    })
    .then(res2 => {
      codeList.SUBCDLIST = res2.ORESULT_CUR
      codeList.SUBCDLIST.unshift({ CODE: '', DISPLAY_TEXT: 'ALL' })
    })
}
// 대분류 선택시 중분류 조회
const subCodeChange = async e => { 
  codeList.SUBCDLIST = []

  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    MAIN_CODE: searchParams.MAIN_CODE
  }
  Promise.all([
    await commonSearchApi({ queryId: 'SPPHA0020_COMBO_02', param: param })
  ]).then(res => {
    codeList.SUBCDLIST = res[0].ORESULT_CUR
    codeList.SUBCDLIST.unshift({ CODE: '', DISPLAY_TEXT: 'ALL' });
    searchParams.SUB_CODE = ''
  })
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'PRNT_COD', width: '100', editable: false, dataType: 'text', header: { text: t('상위코드') }},
    {
      fieldName: 'CRNT_COD',
      width: '80',
      editable: false, // 기본적으로 수정 불가
      dataType: 'text',
      header: { text: t('코드') },

      styleCallback: (grid, dataCell) => {
        var ret = {}

        if(dataCell.item.rowState == 'created' || dataCell.item.itemState == 'appending' || dataCell.item.itemState == 'inserting'){
          ret.editable = true;
          ret.styleName = 'editable_column';
        } else {
          ret.editable = false;
        }

        return ret;
      }
    },
    { fieldName: 'COD_DESC_SHRT', width: '120', editable: true, styleName: 'editable_column', dataType: 'text', header: { text: t('Code설명') }},
    { fieldName: 'COD_DESC_FULL', width: '500', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('상세') }},
    { fieldName: 'COD_LEV', width: '80', editable: false, dataType: 'number', numberFormat: '0', header: { text: t('코드레벨') } },
    {
      fieldName: 'SORT_SEQ', width: '60', editable: true, styleName: 'editable_column', dataType: 'text', numberFormat: '###', header: { text: t('순서') },
      editor: { type: 'number', integerOnly: true, maxLength: 3 },
      displayCallback: (grid, index, value) => {
        if (value !== null && value !== undefined) {
          return value.toString().padStart(3, '0'); // '1' → '001' 변환
        }
        return value;
      }
    },
    { fieldName: 'REG_DTE', width: '120', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('등록일자') } },
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
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    let parentCode = ''
    let level = 1

    if (searchParams.SUB_CODE) {
      // SUB_CODE가 존재하면 레벨 3
      parentCode = searchParams.SUB_CODE
      level = 3
    } else if (searchParams.MAIN_CODE) {
      // MAIN_CODE만 존재하면 레벨 2
      parentCode = searchParams.MAIN_CODE
      level = 2
    }
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      PRNT_COD: parentCode,
      CRNT_COD: '',
      COD_DESC_SHRT: '',
      COD_DESC_FULL: '',
      COD_LEV: level,
      SORT_SEQ: '',
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
      .setConfirmMessage('하위코드가 존재할 경우 함께 삭제됩니다. 계속하시겠습니까?')
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

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

//  조회
const searchData = () => {
  // console.log(searchParams)
  return commonSearchApi({ queryId: 'SPPHA0020_SEARCH_01', param: searchParams })
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
    if(isEmpty(data.CRNT_COD)) {
      return Message.warn(t('코드는 필수 입력입니다.'))
    } else if (isEmpty(data.COD_DESC_SHRT)) {
      return Message.warn(t('Code설명은 필수 입력입니다.'))
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
  return commonExecuteApi({ queryId : 'SPPHA0020_SAVE_01', list: saveParams })
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
  
  return commonExecuteApi({ queryId : 'SPPHA0020_DELETE_01', list: saveParams })
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
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.MAIN_CODE"
            :label="$t('Main Code')"
            :items="codeList.MAINCDLIST"
            item-value="CODE"
            item-title="DISPLAY_TEXT" 
            label-width="80px"
            width="250px"
            @update:modelValue="subCodeChange"
          />
          <i-select
            v-model="searchParams.SUB_CODE"
            :label="$t('Sub Code')"
            :items="codeList.SUBCDLIST"
            item-value="CODE"
            item-title="DISPLAY_TEXT" 
            label-width="80px"
            width="250px"
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