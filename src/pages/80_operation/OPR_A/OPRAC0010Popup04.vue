<!--
  화면명 : 안전요원 일괄추가
  화면개요 : 한 명의 안전요원을 여러 장소에 배치하기 위한 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { isEmpty } from 'lodash-es'
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from "@hiway/utils/notify"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import RealGrid from '@/components/RealGrid.vue'

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
const empPopup = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const getEmp = ref(false)

const selectList = reactive({
  nm: [],
})

const codeList = reactive({
  DEPT_CD: [],
  GWA_CD: [],
  TEAM_CD: [],
})

const allCodeList =  reactive({
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
      /* for(var i = 0; i < res[0].ORESULT_CUR.length; i++) {
        if(res[0].ORESULT_CUR[i].DEPT_NM.indexOf("안전") !== -1
        && codeList.DEPT_CD.findIndex(obj => obj.DEPT_NM === res[0].ORESULT_CUR[i].DEPT_NM) === -1) 
          codeList.DEPT_CD.push(res[0].ORESULT_CUR[i])
      }  */
      
      allCodeList.GWA_CD = res[1].ORESULT_CUR
      allCodeList.TEAM_CD = res[2].ORESULT_CUR
      codeList.DEPT_CD = res[0].ORESULT_CUR
      codeList.GWA_CD = res[1].ORESULT_CUR
      codeList.TEAM_CD = res[2].ORESULT_CUR
      if(codeList.DEPT_CD.findIndex(obj => obj.DEPT_NM === "선택안함") === -1) codeList.DEPT_CD.unshift({ DEPT_NM:"선택안함", DEPT_CD:"" })
      if(codeList.GWA_CD.findIndex(obj => obj.ASGN_NM === "선택안함") === -1)  codeList.GWA_CD.unshift({ ASGN_NM:"선택안함", ASGN_CD:"" })
      if(codeList.TEAM_CD.findIndex(obj => obj.ASGN_NM === "선택안함") === -1)  codeList.TEAM_CD.unshift({ ASGN_NM:"선택안함", ASGN_CD:"" })

      setDept()
  })  
}

// 로그인 계정이 안전요원부서가 아닐 시에 안전부,안전과,안전팀을 전체로 한다.
const setDept = () => {
  for(var dept of codeList.DEPT_CD) {
    if(dept.DEPT_CD == userStore.deptCd){
      for(var gwa of codeList.GWA_CD) {
        if(gwa.ASGN_CD == userStore.asgnCd.substring(0,4)) {
          return
        }
      }
    }
  }
  searchParams[0].REL_DEPT_CD = ''
  searchParams[0].REL_GWA_CD = ''
  searchParams[0].REL_TEAM_CD = ''
}

/* 안전요원 조회 조건 */
const searchParams = reactive([
  {
    CMPNY_DIV: userStore.cmpnyDiv,
    WK_DT: '',
    USER_ID: userStore.userId,
    REL_DEPT_CD: userStore.deptCd,
    REL_GWA_CD: userStore.asgnCd.substring(0,4),
    REL_TEAM_CD: userStore.asgnCd,
    REL_EMP_NM: '',
    REL_EMP_NO: '',
    TRS: '',
    SHIP_HEADER_NO: '',
  }
])

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'SHIP_NO', dataType: 'text', width: '120', header: { text: t('호선 코드') }, styleName: 'left-column', width : '100' },
    { fieldName: 'SHIP_NM', dataType: 'text', width: '120', header: { text: t('호선명') }, styleName: 'left-column', width : '170'},    

    { fieldName: 'ALL_SYS_CD', dataType: 'text', width: '120', header: { text: t('ALL_SYS_CD') }, visible : false },
    { fieldName: 'ALL_UP_CD', dataType: 'text', width: '120', header: { text: t('ALL_UP_CD') }, visible : false },
    { fieldName: 'UP_CD', dataType: 'text', width: '120', header: { text: t('UP_CD') }, visible : false  },
    // { fieldName: 'SELECT', dataType: 'text', header: { text: t('SELECT') }, visible: false },
  ],
  columns : [],
})

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
  keys: [],
  fields: [
    { fieldName: 'SHIP_NO', dataType: 'text', width: '80', header: { text: t('호선 코드') }, editable: false },
    { fieldName: 'SHIP_NM', dataType: 'text', width: '120', header: { text: t('호선명') }, styleName: 'left-column', width : '170', editable: false },    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'REL_DEPT_CD', dataType: 'text', header: { text: t('안전부') }, visible: false },
    { fieldName: 'REL_GWA_CD', dataType: 'text', header: { text: t('안전과') }, visible: false },
    { fieldName: 'REL_TEAM_CD', dataType: 'text', header: { text: t('안전팀') }, visible: false },
    { fieldName: 'REL_EMP_NO', dataType: 'text', header: { text: t('사번') }, visible: false },
    { fieldName: 'REL_EMP_NM', dataType: 'text', header: { text: t('안전요원') }, visible: false },
    { fieldName: 'TRS', dataType: 'text', header: { text: t('무전기코드') }, visible: false },
    { fieldName: 'SHIP_HEADER_NO', dataType: 'text', header: { text: t('지역장') }, visible: false },
    { fieldName: 'WK_DT', dataType: 'text', header: { text: t('근무일자') }, visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const openPopup = (param) => {
  grdSub.value.getDataProvider().setRows([])
  searchParams[0].REL_DEPT_CD = userStore.deptCd
  searchParams[0].REL_GWA_CD = userStore.asgnCd.substring(0,4)
  searchParams[0].REL_TEAM_CD = userStore.asgnCd
  searchParams[0].REL_EMP_NM = ''
  searchParams[0].REL_EMP_NO = ''
  searchParams[0].TRS = ''
  searchParams[0].SHIP_HEADER_NO = ''
  searchParams[0].WK_DT = param.TMP_WK_DT
  new queryFlowHelper(vm, t)
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
  getCode()
  dialog.value = true
}

//DB 조회
const searchMainData = () => {  
  let searchParam = { CMPNY_DIV: userStore.cmpnyDiv, REL_TEAM_CD: ''}

  if(!isEmpty(searchParams[0].REL_TEAM_CD)) {
    searchParam.REL_TEAM_CD = searchParams[0].REL_TEAM_CD
  } else if(!isEmpty(searchParams[0].REL_GWA_CD)) {
    searchParam.REL_TEAM_CD = searchParams[0].REL_GWA_CD
  } else if(!isEmpty(searchParams[0].REL_DEPT_CD)) {
    searchParam.REL_TEAM_CD = searchParams[0].REL_DEPT_CD
  }
  return commonSearchApi({ queryId : 'OPRAC0010_SEARCH_11', param: searchParam })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 장소 클릭시 추가
const onCellClicked = (grid, clickData) => {
  
  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  const index = selectList.nm.indexOf(data.SHIP_NO + '||' + data.SHIP_NM)

  if(index !== -1) {
    grdMain.value.getGridView().checkRow(clickData.dataRow, false, false, false)
    onItemChecked(grid, clickData.dataRow-1, false)
  } else {

    grdMain.value.getGridView().checkRow(clickData.dataRow, true, false, false)
    onItemChecked(grid, clickData.dataRow-1, true)
  }
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub}])
      .setGridList([grdSub])
      .setBefore(beforeSave)
      .setConfirmMessage('장소리스트에 있는 모든 장소에 데이터를 저장합니다.')
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
    
  } else if (btn.id === "btnClose") {
    closePopup()
  } else if (btn.id === 'btnPrev') {
    if (currentMonth.value === 1) {
      currentYear.value--;
      currentMonth.value = 12;
    } else {
      currentMonth.value--;
    }
    setCalendar()
  } else if (btn.id === 'btnNext') {
    if (currentMonth.value === 12) {
      currentYear.value++;
      currentMonth.value = 1;
    } else {
      currentMonth.value++;
    }
    setCalendar()
  }
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  let rows = grdSub.value.getDataProvider().getRowCount()
  if(rows === 0) return Message.warn(t('저장할 장소가 없습니다.'))
  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    if (data.REL_EMP_NM == '') {
      return Message.warn(t('안전요원을 입력하세요'))
    } else if (data.REL_EMP_NO == '') {
      return Message.warn(t('사번 입력하세요'))
    } else if (data.WK_DT == '') {
      return Message.warn(t('근무일자를 입력해주세요.'))
    } 
  }
  return true
}

/* ********** 저장 ********** */
const saveData = () => {
  let saveParams = []
  let rows = grdSub.value.getDataProvider().getRowCount()
  
  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId // USER_ID
    data.WK_DT = data.WK_DT.replaceAll('-','')
    saveParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'OPRAC0010_SAVE_05', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => { 
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  selectList.nm = []
  grdSub.value.getDataProvider().setRows([])
  dialog.value = false
}

// 인원검색 팝업
const empPopupOpen = () => {
  getEmp.value = true
  empPopup.value.openPopup({ EMP_NM: searchParams[0].REL_EMP_NM });
}

// 안전요원 검색 팝업에서 선택시
const selectedemp = (row) => {

  searchParams[0].CMPNY_DIV = row.CMPNY_DIV
  searchParams[0].REL_TEAM_CD = row.ASGN_CD
  searchParams[0].REL_GWA_CD = row.ASGN_CD.substring(0,4)
  searchParams[0].REL_DEPT_CD = row.DEPT_CD
  searchParams[0].REL_EMP_NO = row.EMP_NO
  searchParams[0].REL_EMP_NM = row.EMP_NM
  searchParams[0].TRS = row.TEL_NO

  grdSub.value.getDataProvider().setRows([])
  new queryFlowHelper(vm, t) 
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

// 모두체크, 모두체크해제 
const onItemAllChecked = (grid,checked) => {
  let valid = true
  for(var i = 0; i < grdMain.value.getDataProvider().getRowCount(); i++) {
    if(!onItemChecked(grid, i, checked)) {
      valid = false
      break
    }
  }
  if(!valid) {
    for(var i = 0; i < grdMain.value.getDataProvider().getRowCount(); i++) {
      grdMain.value.getGridView().checkRow(i, false, false, false)
    }
  }
}

// 체크박스 체크 시
const onItemChecked = (grid, itemIndex, checked) => {
  const data = grdMain.value.getDataProvider().getJsonRow(itemIndex + 1)
  const index = selectList.nm.indexOf(data.SHIP_NO + '||' + data.SHIP_NM)
  let grdData = []
  if (searchParams[0].REL_EMP_NM == '') {
    grdMain.value.getGridView().checkRow(itemIndex + 1, false, false, false)
    return Message.warn(t('안전요원을 입력하세요'))
  } else if (searchParams[0].REL_EMP_NO == '') {
    grdMain.value.getGridView().checkRow(itemIndex + 1, false, false, false)
    return Message.warn(t('사번 입력하세요'))
  } else if (searchParams[0].WK_DT == '') {
    grdMain.value.getGridView().checkRow(itemIndex + 1, false, false, false)
    return Message.warn(t('근무일자를 입력해주세요.'))
  }

  if(!checked) {
    selectList.nm.splice(index,1)
  } else {
    selectList.nm.push(data.SHIP_NO + '||' + data.SHIP_NM)
  }
  
  grdSub.value.getDataProvider().setRows([])
  for(var d of selectList.nm) {
    const dt = d.split('||')
    grdData.push({
      SHIP_NO: dt[0],
      SHIP_NM: dt[1],
      CMPNY_DIV: userStore.cmpnyDiv,
      WK_DT: searchParams[0].WK_DT,
      REL_DEPT_CD: searchParams[0].REL_DEPT_CD,
      REL_GWA_CD: searchParams[0].REL_GWA_CD,
      REL_TEAM_CD: searchParams[0].REL_TEAM_CD,
      REL_EMP_NO: searchParams[0].REL_EMP_NO,
      REL_EMP_NM: searchParams[0].REL_EMP_NM,
      SHIP_HEADER_NO: searchParams[0].SHIP_HEADER_NO,
      USER_ID: userStore.userId,
    })
  }
  grdSub.value.getDataProvider().setRows(grdData)

  return true
}

// 안전부 변경 시 부서 변경 이벤트
watch(() => searchParams[0].REL_DEPT_CD, (newValue, oldValue) => {

  if(searchParams[0].REL_DEPT_CD == '') {
    searchParams[0].REL_GWA_CD = ''
    searchParams[0].REL_TEAM_CD = ''
  }

  codeList.GWA_CD = [{ ASGN_NM:"선택안함", ASGN_CD:"" }]
  for(var gwa of allCodeList.GWA_CD) {
    if(newValue == gwa.DEPT_CD) {
      codeList.GWA_CD.push({ASGN_CD:gwa.ASGN_CD, ASGN_NM:gwa.ASGN_NM})
    }
  }
  grdSub.value.getDataProvider().setRows([])
  new queryFlowHelper(vm, t) 
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
})

// 안전과 바뀌면 안전팀 데이터 가져옴
watch(() => searchParams[0].REL_GWA_CD, (newValue, oldValue) => {

  if(searchParams[0].REL_GWA_CD == '') {
    searchParams[0].REL_TEAM_CD = ''
  }
  
  codeList.TEAM_CD = [{ ASGN_NM:"선택안함", ASGN_CD:"" }]
  for(var team of allCodeList.TEAM_CD) {
    if(newValue == team.ASGN_CD.substring(0,4)) {
      codeList.TEAM_CD.push({ASGN_CD:team.ASGN_CD, ASGN_NM:team.ASGN_NM})
    }
  }
  grdSub.value.getDataProvider().setRows([])
  new queryFlowHelper(vm, t) 
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}) 

watch(() => searchParams[0].REL_TEAM_CD, (newValue, oldValue) => {
  grdSub.value.getDataProvider().setRows([])
  new queryFlowHelper(vm, t) 
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
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
    width="1200"
    height="800"
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
      <span>안전요원 일괄 추가</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        /> 
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div >
            <div class="d-flex">
              <i-select
                top-label
                v-model="searchParams[0].REL_DEPT_CD"
                :label="$t('안전부')"
                :items="codeList.DEPT_CD"
                label-width="60px"
                width="230px"
                item-value="DEPT_CD"
                item-title="DEPT_NM" 
              />
              <i-select
                top-label
                v-model="searchParams[0].REL_GWA_CD"
                :label="$t('안전과')"
                :items="codeList.GWA_CD"
                :disabled="searchParams[0].REL_DEPT_CD === '' ? true : false"
                label-width="60px"
                width="230px"
                item-value="ASGN_CD"
                item-title="ASGN_NM" 
              />
              <i-select
                top-label
                v-model="searchParams[0].REL_TEAM_CD"
                :label="$t('안전팀')"
                :items="codeList.TEAM_CD"
                :disabled="searchParams[0].REL_GWA_CD === '' ? true : false"
                label-width="60px"
                width="230px"
                item-value="ASGN_CD"
                item-title="ASGN_NM"
              />
              <i-input
                top-label
                :label="$t('근무일자')"
                v-model="searchParams[0].WK_DT"
                label-width="60px"
                type="Date"
                width="230px"
                margin="10px"
                required
              />
              
            </div>
            <div class="d-flex mt-2">
              <i-input
                top-label
                :label="$t('안전요원')"
                type="Text"
                width="230px"
                margin="10px"
                class="mr-5"
                @click:appendInner="empPopupOpen"
                @click="empPopupOpen"
                append-inner-icon="mdi-magnify"
                readonly
                required
                v-model="searchParams[0].REL_EMP_NM"
              />
              <i-input
                top-label
                :label="$t('사번')"
                class="mr-5"
                v-model="searchParams[0].REL_EMP_NO"
                label-width="80px"
                type="text"
                width="230px"
                margin="10px"
                required
              />
              <i-input
                top-label
                :label="$t('무전기코드')"
                class="mr-5"
                v-model="searchParams[0].TRS"
                label-width="80px"
                type="text"
                width="230px"
                margin="10px"
              /> 
              <VCheckbox
                class="mt-5"
                v-model="searchParams[0].SHIP_HEADER_NO"
                :label="$t('호선장')"
              />
            </div>
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area" style="width:50%; height:500px;">
          <div class="d-flex flex-column fill-height">
            <div>
              <IGridTitle 
                ref="menuTitle"
                :title="$t('장소 목록')"
                :use-permission="false"
              />
            </div>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 400px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellClicked="onCellClicked"
                @onItemChecked="onItemChecked"
                @onItemAllChecked="onItemAllChecked"
              />
            </v-sheet>
          </div>
        </v-card-text>
        <v-card-text class="pa-4 pt-0 content-area" style="width:50%">
          <div class="d-flex flex-column fill-height">
            <div>
              <IGridTitle 
                ref="menuTitle"
                :title="$t('배정 장소')"
                :use-permission="false"
              />
            </div>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdSub"
                style="height: 400px;"
                :grid-view-option="grdSubProps.gridViewOption"
                :keys="grdSubProps.keys"
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
      <EmpPopup ref="empPopup" @selected="selectedemp" />
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
