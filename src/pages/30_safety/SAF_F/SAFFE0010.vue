<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from "@/utils/searchFlowHelper"
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'

defineOptions({
  name:'30_safety-SAF_F-SAFFE0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)
const changeCombo = ref(false)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DT_YYYYMM: dayjs().format('YYYY-MM'),
  YYYYMM: '',
})
const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'ASGN_NM_ORI', width: '250', dataType: 'text', header: { text: t('등록당시소속') }, editable: false, styleName: 'left-column' },
    { fieldName: 'ASGN_NM', width: '250', dataType: 'text', header: { text: t('현재소속') }, editable: false, styleName: 'left-column' },
    { fieldName: 'EMP_NO', width: '60', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', width: '60',dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'DT_FROM', width: '80', dataType: 'text', header: { text: t('제외시작월') }, styleName: 'editable_column',
      'editor': {
        type:'date', 
        datetimeFormat:'yyyy-MM', 
        mask: { editMask: '9999-99', placeHolder:'yyyy-MM', includedFormat:true} 
      }},
    { fieldName: 'DT_TO', width: '80', dataType: 'text', header: { text: t('제외종료월') }, styleName: 'editable_column',
      'editor': {
        type:'date', 
        datetimeFormat:'yyyy-MM', 
        mask: { editMask: '9999-99', placeHolder:'yyyy-MM', includedFormat:true} 
      }
    },
    { fieldName: 'EXCEPT_REASON', width: '80', dataType: 'text', header: { text: t('제외사유') }, styleName: 'editable_column', 
      editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'REMARK', width: '200', dataType: 'text', header: { text: t('제외사유(상세)') }, styleName: 'editable_column left-column' },
    { fieldName: 'APPLY_EMP_NM', width: '80', dataType: 'text', header: { text: t('신청자') }, editable: false },
    { fieldName: 'APPLY_DATE', width: '80', dataType: 'text', header: { text: t('신청일') }, editable: false },
    { fieldName: 'UPDATE_USER_NM', width: '80', dataType: 'text', header: { text: t('입력/승인자') }, editable: false },
    { fieldName: 'UPDATE_DATE', width: '100', dataType: 'text', header: { text: t('입력/승인일') }, editable: false },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') },visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('소속') },visible: false, },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('신청일') },visible: false, },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

// 인원추가
const selectedemp = (row) => {
  grdMain.value.addRow({
    ASGN_NM_ORI: row.ASGN_NM,
    ASGN_NM: row.ASGN_NM,
    EMP_NO: row.EMP_NO,
    KOR_NM: row.EMP_NM,
    DT_FROM: dayjs().format('YYYY-MM'),
    DT_TO: dayjs().format('YYYY-MM'),
    CMPNY_DIV: row.CMPNY_DIV,
    BSNS_CD: row.BSNS_CD,
    DEPT_CD: row.DEPT_CD,
    ASGN_CD: row.ASGN_CD,
  }, false)
}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(true)
      .run()
  } else if (btn.id === 'btnCreate') {
    empPopup.value.openPopup({})
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
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setConfirmMessage('삭제시 데이터 베이스에서도 바로 삭제됩니다. 진행하시겠습니까?')
      .setQuery(deleteData)
      .setAfter(afterCloseDelete)
      .run()
  }
  
}

//DB 삭제
const deleteData = () =>{
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return

  let deleteList = []
  for(let i = 0; i < deleteRows.length; i++){
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(deleteRows[i])
    deleteList.push(grdJsonRow)
  }  
  return commonExecuteApi({ queryId : 'SAFFE0010_DELETE_01', list: deleteList })
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
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.DT_FROM == '' || data.DT_FROM == null) {
      return Message.warn(t('제외시작월은 반드시 입력되어야 합니다.'))
    } else if(data.DT_TO == '' || data.DT_TO == null) {
      return Message.warn(t('제외종료월은 반드시 입력되어야 합니다.'))
    } 
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.DT_FROM = data.DT_FROM.replaceAll('-','')
    data.DT_TO = data.DT_TO.replaceAll('-','')
    saveParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'SAFFE0010_SAVE_01', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => {
  onButtonsClick({ id: 'btnSearch' })
  Message.success(t('성공적으로 저장되었습니다'))
}

//조회 함수
const searchData = () =>{
  searchParams.YYYYMM = searchParams.DT_YYYYMM.replaceAll('-','')
  return commonSearchApi({ queryId : 'SAFFE0010_SEARCH_01', param: searchParams })
}

//조회 후 반영
const afterSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/*  공통코드 세팅 */
onMounted(() => {
  Promise.all([
    commonSearchApi({ queryId: "searchBSNS",param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: "Y" }}),
    commonSearchApi({ queryId: "searchDept3",param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV: "Y" }}),
    getCodeList("HHIS070"),
    commonSearchApi({ queryId : 'searchCommonCodeF', param : { CMPNY_DIV: 'HHI', ALL_UP_CD: 'HHIS080', USE_FLAG:'Y'}}),
  ])
  .then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({BSNS_NM:'전체',BSNS_CD:''})    
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD.unshift({DEPT_NM:'전체',DEPT_CD:''})    
    grdMain.value.setBindingColumn('EXCEPT_REASON', res[2].ORESULT_CUR, 'COD', 'TXT')

    let sliAuth = res[3].ORESULT_CUR.filter((data) => data.COD === userStore.userId).length > 0 ? true : false

    if(useLogsStore().isMenuAdmin === 'Y' || userStore.bsnsCd == 'AC00' || sliAuth) {
      changeCombo.value = true
    } else {
      changeCombo.value = false
    }

    onButtonsClick({ id:'btnSearch' })
  })
  .catch((err) => {
    
  })
})

// 사업부 바뀌면
watch(() => searchParams.BSNS_CD, newValue => {
  commonSearchApi({ queryId: "searchDept3",param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue, USE_DIV: "Y" }})
  .then((res)=>{
    if(newValue ==''){
      searchParams.DEPT_CD = ''
      return 
    }
    searchParams.DEPT_CD = ''
    codeList.DEPT_CD = res.ORESULT_CUR
    codeList.DEPT_CD.unshift({DEPT_CD:'', DEPT_NM:'전체'})
  }) 
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
    <div class="notice">
      ※ 직영과 사내협력사만 추가 가능, 단기공사는 [안전]->[단기공사]->[단기공사 안전교육 대상자 현황/관리]에서 제외처리 요망.
    </div>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.DT_YYYYMM"
            :label="$t('신청년월')"
            type="month"
            width="250px"
          />
          <i-select
            :label="$t('사업부')"
            v-model="searchParams.BSNS_CD"
            :disabled="!changeCombo"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM" 
            width="250px"  
          />
          <i-select
            :label="$t('부서')"
            v-model="searchParams.DEPT_CD"
            :disabled="searchParams.BSNS_CD === '' || !changeCombo"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM" 
            width="250px"  
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid 
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
      <EmpPopup ref="empPopup" @selected="selectedemp" />
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

.notice {
  position: fixed;
  z-index: 9999;
  color: red;
  font-size: 1.1rem;
  left: 278px; 
  top: 120px;
  font-weight: bold;
}
</style>