<!--
  화면명 : 안전요원(호선) 안전팀배정
  화면개요 : 호선 별로 안전팀을 배정하기 위한 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'
import deleteFlowHelper from '@/utils/deleteFlowHelper'

const props = defineProps({
  NOTICE_DIV_LIST: {
    Type: Array,
    default: [],
  },
  id: {
    Type: String,
    default: "",
  },
})

const emit = defineEmits(["after-search"])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const gwa_cd = ref(null)

const codeList = reactive({
  DEPT_CD: [],
  GWA_CD: [],
  TEAM_CD: [],
  WORK_NO: [],
})
// combobox 리스트 조회
const getCode = (param) => {
  Promise.all([
      //commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: 'AN00', USE_DIV:'Y' } }), // 부서
      commonSearchApi({ queryId : 'SEARCH_DEPT_SAFE', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV:'Y' } }), // 부서
      commonSearchApi({ queryId : 'OPRAC0010_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV:'Y' } }), // 과
      commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV:'Y' } }), // 팀
      commonSearchApi({ queryId : 'OPRAC0010_SEARCH_16', param : {  } }), // 호선 콤보 조회 
    ]).then(res => {
      var tempCodeList = []

      for(var j = 0; j < res[0].ORESULT_CUR.length; j++) {      
        tempCodeList.push({ DEPT_CD: res[0].ORESULT_CUR[j].DEPT_CD, DEPT_NM: res[0].ORESULT_CUR[j].DEPT_NM })      
      }

      /* var orderList = ['조선안전부', '해양안전부', '엔진기계안전부', '특수선안전과', '자산안전/기획과', '안전경영부', '안전보건지원부' ]
      for(var i = 0; i < res[0].ORESULT_CUR.length; i++) {
        if(res[0].ORESULT_CUR[i].DEPT_NM.indexOf('안전') !== -1
        && res[0].ORESULT_CUR[i].BSNS_NM === '안전통합경영실') {
          codeList.DEPT_CD.push(res[0].ORESULT_CUR[i])
          tempCodeList.push({DEPT_CD: res[0].ORESULT_CUR[i].DEPT_CD, DEPT_NM: res[0].ORESULT_CUR[i].DEPT_NM})
        }
      }  */     
      codeList.DEPT_CD = res[0].ORESULT_CUR
      codeList.GWA_CD = res[1].ORESULT_CUR
      codeList.TEAM_CD = res[2].ORESULT_CUR
      codeList.WORK_NO = res[3].ORESULT_CUR
      setDept(param)
      //setDept(res[1].ORESULT_CUR[0].GWA_CD)

      grdMain.value.setBindingColumn('WORK_NO', codeList.WORK_NO, 'WORK_NO', 'WORK_NM')
      // grdMain.value.setBindingColumn('DEPT_CD', tempCodeList, 'DEPT_CD', 'DEPT_NM')
      // grdMain.value.setBindingColumn('GWA_CD', codeList.GWA_CD, 'ASGN_CD', 'ASGN_NM')
      // grdMain.value.setBindingColumn('REL_TEAM_CD', codeList.TEAM_CD, 'ASGN_CD', 'ASGN_NM')
  })
}

// 로그인 유저 조직 Default Set
const setDept = (param) => {
  
  //let gwaCd = code
  if(codeList.DEPT_CD.filter((x) => x.DEPT_CD === param.REL_DEPT_CD).length > 0){
    searchParams.REL_DEPT_CD = param.REL_DEPT_CD
  }else{
    searchParams.REL_DEPT_CD = 'CX80'
  }

  if(codeList.GWA_CD.filter((x) => x.ASGN_CD === param.REL_GWA_CD).length > 0){
    searchParams.REL_GWA_CD = param.REL_GWA_CD
  }else{
    searchParams.REL_GWA_CD = ''
  }

  if(codeList.TEAM_CD.filter((x) => x.ASGN_CD === param.REL_TEAM_CD).length > 0){
    searchParams.REL_TEAM_CD = param.REL_TEAM_CD
  }else{
    searchParams.REL_TEAM_CD = ''
  }

  // if(codeList.DEPT_CD.filter((x) => x.DEPT_CD === userStore.deptCd).length > 0){
  //   searchParams.REL_DEPT_CD = userStore.deptCd
  // }else{
  //   searchParams.REL_DEPT_CD = 'N1E0'
  // }

  // if(codeList.GWA_CD.filter((x) => x.ASGN_CD === gwaCd).length > 0){
  //   searchParams.REL_GWA_CD = gwaCd
  // }else{
  //   searchParams.REL_GWA_CD = ''
  // }

  // if(codeList.TEAM_CD.filter((x) => x.ASGN_CD === userStore.asgnCd).length > 0){
  //   searchParams.REL_TEAM_CD = userStore.asgnCd
  // }else{
  //   searchParams.REL_TEAM_CD = ''
  // }

  onButtonsClick({ id:'btnSearch' })
  console.log('params', searchParams)
}

/* 안전요원 조회 조건 */
const searchParams = reactive({
    CMPNY_DIV: userStore.cmpnyDiv,
    USER_ID: userStore.userId,
    REL_DEPT_CD: userStore.deptCd,  // 안전부
    REL_GWA_CD:  gwa_cd.value,      // 안전과
    REL_TEAM_CD: userStore.asgnCd,  // 안전 팀
  })
 
//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true } },
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('안전부') }, styleName: 'left-column', visible: true },
    { fieldName: 'GWA_NM', dataType: 'text', header: { text: t('안전과') }, styleName: 'left-column', visible: true },
    { fieldName: 'TEAM_NM', dataType: 'text', header: { text: t('안전팀') }, styleName: 'left-column', visible: true },
    { fieldName: 'WORK_NO', dataType: 'text', width: '200', header: { text: t('호선 ') }, styleName:'editable_column change_back_check', editable: true, visible: true, 
      editor: { type: 'dropdown' }, lookupDisplay: true},
    { fieldName: 'EXCLUDE_WORK', dataType: 'boolean', width: '80', header: { text: t('요원배치제외') }, editable: false, styleName:'editable_column change_back_check', renderer: { type: "check" } },
    { fieldName: 'USER_ID', dataType: 'text', width: '120', header: { text: t('USER_ID') }, visible : false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('안전부') }, styleName: 'left-column', visible: false },
    { fieldName: 'GWA_CD', dataType: 'text', header: { text: t('안전과') }, styleName: 'left-column', visible: false },
    { fieldName: 'REL_TEAM_CD', dataType: 'text', header: { text: t('안전팀') }, styleName: 'left-column', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  getCode(param)
  dialog.value = true
}

const searchGrid = () =>{
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

//DB 조회
const searchMainData = () => {  
  return commonSearchApi({ queryId : 'OPRAC0010_SEARCH_10', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch'){
    searchGrid()
  } else if (btn.id === 'btnCreate'){
    addRowData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain}])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setConfirmMessage('안전팀별 호선 배치를 저장합니다.')
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
    
  } else if (btn.id === "btnDelete"){
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if (btn.id === "btnClose") {
    closePopup()
  }
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  let rows = grdMain.value.getDataProvider().getRowCount()
  if(rows === 0) return Message.warn(t('선택한 데이터가 없습니다.'))
  return true
}

/* ********** 저장 ********** */
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId // USER_ID
    data.CMPNY_DIV = userStore.cmpnyDiv
    saveParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'OPRAC0010_SAVE_04', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => { 
  Message.success(t('성공적으로 저장되었습니다'))
  new queryFlowHelper(vm, t)
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

/* ********** 삭제 ********** */
const deleteData = () => {

  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  checkedRows.forEach(val => {
    let data = grdMain.value.getDataProvider().getJsonRow(val)
    data.CMPNY_DIV = userStore.cmpnyDiv

    saveParams.push(data)
  })

  return commonExecuteApi({ queryId : 'OPRAC0010_DELETE_05', list: saveParams })
}

//로우 추가하는 함수
const addRowData = () => {

  if (searchParams.REL_TEAM_CD === ''){
    Message.warn(t('안전팀을 선택 후 추가해 주세요.'))
    return
  }

  let newRow = {
    WORK_NO : '',
    EXCLUDE_WORK : '',
    DEPT_CD : searchParams.REL_DEPT_CD,
    GWA_CD : searchParams.REL_GWA_CD,
    REL_TEAM_CD : searchParams.REL_TEAM_CD,
    USER_ID : userStore.empNo,
  }
  grdMain.value.addRow(newRow)
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  dialog.value = false
}

// 안전부 변경 시 부서 변경 이벤트
watch(()  => searchParams.REL_DEPT_CD, (newValue, oldValue) => {
  if(searchParams.REL_DEPT_CD === '') {
    searchParams.REL_GWA_CD = ''
    searchParams.REL_TEAM_CD = ''
  }
  
  commonSearchApi({ queryId : 'OPRAC0010_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: searchParams.REL_DEPT_CD, USE_DIV:'Y' } })
  .then(res => {
    codeList.GWA_CD = res.ORESULT_CUR
    codeList.GWA_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })

    if (newValue !== oldValue) {
      searchParams.REL_GWA_CD = codeList.GWA_CD[0].ASGN_CD
    }
  })

  grdMain.value.getDataProvider().setRows()
})

// 안전과 바뀌면 안전팀 데이터 가져옴
watch(() => searchParams.REL_GWA_CD, (newValue, oldValue) => {
  searchParams.REL_TEAM_CD = ''
  commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', ASGN_CD: searchParams.REL_GWA_CD } })
    .then(res => {
      codeList.TEAM_CD = res.ORESULT_CUR
    
      if(codeList.TEAM_CD.length == 1) {
        searchParams.REL_TEAM_CD = res.ORESULT_CUR[0].ASGN_CD
        codeList.TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
        return
      }

      codeList.TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
      if (codeList.TEAM_CD.length !== 0) {
        searchParams.REL_TEAM_CD = ''
      }
    })

    grdMain.value.getDataProvider().setRows()    
})


defineExpose({
  openPopup
})

onMounted(() => {

})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="900"
    height="1000"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>호선 별 안전팀 배정</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="$t('호선 목록')"
          :use-permission="false"
          :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick">
      </IGridTitle>
      <v-sheet class="searchArea d-flex flex-column mb-0">
        <div class="d-flex">
          <i-select
            :label="$t('안전부')"
            v-model="searchParams.REL_DEPT_CD"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM" 
            width="250px"  
          />
          <i-select 
            :label="$t('안전과')"
            v-model="searchParams.REL_GWA_CD"
            :disabled="searchParams.REL_DEPT_CD === '' ? true : false"
            :items="codeList.GWA_CD"
            item-value="ASGN_CD"
            item-title="ASGN_NM" 
            width="250px" 
          />
          <i-select 
            :label="$t('안전팀')"
            v-model="searchParams.REL_TEAM_CD"
            :disabled="searchParams.REL_GWA_CD === '' ? true : false"
            :items="codeList.TEAM_CD"
            item-value="ASGN_CD"
            item-title="ASGN_NM" 
            width="250px" 
          />
        </div>
      </v-sheet>
      </v-card-title>
      <div class="d-flex">
        
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area" style="width:100%; height:800px;">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 750px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
