<!-- 
  * Vue 내 용 : 협력사 안전관리 담당자 관리
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/04
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/04 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'30_safety-SAF_I-SAFIH0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)

const saveParams= ref([])

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})

const codeList = reactive({
  PSGBNList: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    header: { height: 60 } , 
    checkBar: { visible: true }, 
    stateBar: { visible: false },
  },
  keys : ['BSNS_CD', 'ASGN_CD' , 'ASGN_DESC'],
  fields : [ 
    { 
      fieldName: 'BSNS_NM',
      dataType: 'text', 
      header: { text: t('사업부') }, 
      width: '200', 
      styleName: 'left-column',
      lookupDisplay: true, 
      mergeRule: { "criteria": "value" }, 
      editable: false,
    },
    { 
      fieldName: 'ASGN_CD', 
      dataType: 'text', 
      header: { text: t('코드') }, 
      mergeRule: { "criteria": "value" }, 
      editable: false, 
      width: '150',
    },
    { 
      fieldName: 'ASGN_DESC', 
      dataType: 'text', 
      width: '250', 
      header: { text: t('부서명/협력사명') },
      editable: false, 
      styleName: 'left-column', 
      mergeRule: { "criteria": "value" },
    },
    { 
      fieldName: 'PS_GUBUN', 
      dataType: 'text', 
      header: { 
        text: t('구분'), 
        styleName: 'header_validit',
      }, 
      lookupDisplay: true, 
      width: '200', 
      required: true, 
      requiredMessage: '[구분]은 필수입니다.',
      styleName: 'editable_column', 
      editor: { 
        type: 'dropdown', 
        dropDownCount: 5, 
        partialMatch: true, 
        domainOnly: true, 
        dropDownWhenClick: true,
      },
    },
    { 
      fieldName: 'EMP_NO', 
      dataType: 'text', 
      header: { text: t('사번') }, 
      width: '150', 
      editable: false,
    },
    { 
      fieldName: 'EMP_NM', 
      dataType: 'text', 
      width: '100', 
      header: { text: t('성명') }, 
      editable: false, 
    },
    { 
      fieldName: 'JOB_TIT_NM', 
      dataType: 'text', 
      header: { text: t('직위') }, 
      width: '150', 
      editable: false, 
      styleName: 'left-column',
    },
    { 
      fieldName: 'TEL_NO', 
      dataType: 'text', 
      header: { text: t('사내전화번호') }, 
      width: '150', 
      editable: false, 
      styleName: 'left-column',
    },
    { 
      fieldName: 'UPDATE_DT', 
      dataType: 'text', 
      header: { text: t('등록(변경)일') }, 
      width: '150', 
      editable: false,
    },
    { 
      fieldName: 'REMARK', 
      dataType: 'text', 
      header: { text: t('비고') }, 
      width: '250', 
      styleName: 'left-column', 
      editor: 
      { 
        type: "text", 
        maxLength: 300,
      },
    },
    { 
      fieldName: 'ORI_ASGN_NM', 
      dataType: 'text', 
      header: { text: t('원소속부서') }, 
      width: '250', 
      editable: false, 
      styleName: 'left-column',
    },

    // 저장, 삭제시 필요 데이터
    { fieldName: 'ORI_ASGN_CD', dataType: 'text', header: { text: t('원소속부서코드') }, visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, visible: false },
    { fieldName: 'SEQ_NO', dataType: 'text', header: { text: t('SEQ_NO') }, visible: false },
    { fieldName: 'YN_OUT', dataType: 'text', header: { text: t('YN_OUT') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') }, visible: false },
    { fieldName: 'IP_ADDRESS', dataType: 'text', header: { text: t('IP_ADDRESS') }, visible: false },
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM',
    {
      name: '부서/협력사',
      direction: 'horizontal',
      items: [ 'ASGN_CD', 'ASGN_DESC' ],
      header: { text: t('부서/협력사') },
    },
    {
      name: '담당자',
      direction: 'horizontal',
      items: [ 'PS_GUBUN', 'EMP_NO' , 'EMP_NM', 'JOB_TIT_NM', 'TEL_NO', 'UPDATE_DT', 'REMARK', 'ORI_ASGN_NM' ],
      header: { text: t('담당자') },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  // 사업부 리스트 조회
  Promise.all([ 
    getCodeList(userStore.cmpnyDiv + 'ZPS_GUBUN'),
  ]).then(res => {
    codeList.PSGBNList = res[0].ORESULT_CUR

  }).finally(() => {
    grdMain.value.setBindingColumn("PS_GUBUN", codeList.PSGBNList, "COD", "TXT")   // 구분 lookup set
  })
}


//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    console.log('조회')
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnCreate') {
    console.log('추가')
    addRow()
  } 
  else if (btn.id === 'btnUpdate') {
    console.log('저장')
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {
    console.log('삭제')
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(validationCheck)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

const searchData = () => {
  console.log('searchData : ', searchParams)

  return commonSearchApi({ queryId : 'SAFIH0010_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const addRow = () => {
  // 추가시 필터중인 컬럼 클리어
  grdMainProps.fields.forEach(async item => {
    await grdMain.value.getGridView().clearColumnFilters(item.fieldName)
  })

  let popupParam = {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : '',
    DEPT_CD : '',
    EMP_NO : '',
    EMP_NM : '',
    MULTI: true,
  }

  empPopup.value.openPopup(popupParam)
}

// 저장, 삭제전 사용자 정의 validation
const validationCheck = () => {
  saveParams.value = []
  let checkedRow = grdMain.value.getGridView().getCheckedRows()
  if(checkedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  } else {
    checkedRow.forEach(val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.USER_ID = userStore.userId
      saveParams.value.push(data)
    })

    return true
  }
}

// 저장
const saveData = () => {
  console.log('saveData : ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIH0010_SAVE_01', list: saveParams.value })
}

const deleteData = () => {
  console.log('deleteData : ', saveParams)

  return commonExecuteApi({ queryId : 'SAFIH0010_DELETE_01', list: saveParams.value })
}

// 인원 조회 팝업 선택
const onEmpSelected = val => {
  if(!val){
    return
  }

  let selectData = null
  grdMain.value.getGridView().filterPanel.clearInput()
  for (let item of val) {
    selectData = {
      CMPNY_DIV: item.CMPNY_DIV,
      BSNS_CD: item.BSNS_CD,
      BSNS_NM: item.BSNS_NM,
      ASGN_CD: item.ASGN_CD,
      ASGN_DESC: item.ASGN_NM,
      PS_GUBUN: null,
      EMP_NO: item.EMP_NO,
      EMP_NM: item.EMP_NM,
      JOB_TIT_NM: item.JOB_TIT_NM,
      TEL_NO: item.TEL_NO,
      UPDATE_DT: null,
      REMARK: null,
      ORI_ASGN_NM: item.USER_DIV === 'A' ? item.DEPT_NM : item.ASGN_NM ,
      ORI_ASGN_CD: item.USER_DIV === 'A' ? item.DEPT_CD : item.ASGN_CD ,
      YN_OUT: item.USER_DIV === 'A' ? 'Y' : 'N' ,
    }
    grdMain.value.addRow(selectData)
  }
}

onMounted(() => {
  initCodeList()
  console.log('[onMounted] isMenuAdmin : ', userLogStore.isMenuAdmin)
  grdMain.value.getGridView().filterPanel.visible = true
  if(userLogStore.isMenuAdmin === 'Y') {
    setDisableBtns('N')
  }
  else {
    setDisableBtns('Y')
  }

  onButtonsClick({ id: 'btnSearch' })
})

const setDisableBtns = disabled => {

  console.log('[setDisableBtns] disabled = ', disabled)

  if(disabled === 'Y') {
    menuTitle.value.disableBtn("btnUpdate", true)
    menuTitle.value.disableBtn("btnDelete", true)
    menuTitle.value.disableBtn("btnCreate", true)
  }
  else {
    menuTitle.value.disableBtn("btnUpdate", false)
    menuTitle.value.disableBtn("btnDelete", false)
    menuTitle.value.disableBtn("btnCreate", false)
  }
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet 
          height="100%" 
          class="mb-2"
        >
          <!-- 메인그리드 -->
          <IGridTitle :title="$t('담당자정보')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 인원조회팝업 -->
    <EmpPopup
      ref="empPopup" 
      @selected="onEmpSelected" 
    />
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>