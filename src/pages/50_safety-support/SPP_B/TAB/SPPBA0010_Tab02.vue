<script setup>
import { ref, reactive, onMounted, getCurrentInstance, onBeforeMount , watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import { commonSampleDownFilesApi } from "@hiway/api/commonFileApi"

import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IButtonList from '@/components/IButtonList.vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import IUploadPopupMain from "@/components/popup/IUploadPopup.vue"


defineOptions({
  name: '50_safety-support-SPP_B-TAB-SPPBA0010_Tab02',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const grdMain1 = ref(null)
const grdSub1 = ref(null)
const deptPopup = ref(null)
const isReadonly = ref(true)
const fileUploadPopup = ref(null)
const fileUploadPopupMain = ref(null)
const tab = ref('tab2')
const props = defineProps(['transfer']) 

let type = '' // 팝업 좌,우측 구분
let addState1 = false // 좌측 데이터 추가 가능 여부
const tempParams = reactive(props.transfer ? props.transfer : {})

/* 좌측 조회 데이터 */
const searchParams1 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.asgnNm,
  YEAR_DATE: dayjs(new Date()).format("YYYY"),
})

/* 코드 리스트 */
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  DATE_LIST: [],
})

// 초기 조회 코드 생성
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ 
      commonSearchApi({ queryId : 'MNG_searchCommonCode',
        param: { CMPNY_DIV: userStore.cmpnyDiv,
          ALL_UP_CD: 'HHIZ000', USE_FLAG: 'Y' } }),
      // SAVE_FLAG[2]
      commonSearchApi(
      { queryId : 'searchBSNS',
        param:{
          CMPNY_DIV: userStore.cmpnyDiv,
          USE_DIV: 'Y',
        }
      })
      ]).then(res => {
    // 회사
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    // 진행상태
    let startDate = dayjs(new Date).format('YYYY') - 40
    let endDate = dayjs(new Date).add(1,'year').format('YYYY')
    for(let i = endDate; i > startDate; i--){
      codeList.DATE_LIST.push({COD:i.toString() ,TXT: i.toString()})
    }
    // codeList.DATE_LIST.unshift({ TXT:'전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
  })
}

//좌측 디테일(상단) 그리드
const grdMainProps1 = reactive({
  gridViewOption: {  checkBar: { visible: true } },
  keys: ["BSNS_CD", "DEPT_CD"],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text:'사업부' }, editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text:'부서명' }, editable: false },
    { fieldName: 'YEAR_DATE', dataType: 'text', header: { text:'개정년도' } , editable: false},
    { fieldName: 'REV_REASON', dataType: 'text', header: { text:'개정사유' } },
    { fieldName: 'C_FILE_NAME_ORIGINAL', dataType: 'text', readonly: true
    , header: { text:'자위소방대 조직도' }, editable: false ,
    styleName: "left-column",
    width: "150",
    renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var file_name = cell.value
          if(file_name === null){
            file_name = ''
          }
          var str = 
          `<div style="display: flex; justify-content: space-between;">
            <p style="display: flex; align-items: center; width: -webkit-fill-available; overflow-x: hidden;">
              ${file_name}
            </p>
            <button id="cellButton" style="height: 30px;">
              <span class="mdi mdi-file-edit-outline text-light-blue-darken-1"
               style="font-size: 22px ;display: flex; align-items: center;"/>
            </button>
          </div>`
          return str;
        },
      },
    },
    { fieldName: 'D_FILE_NAME_ORIGINAL', dataType: 'text', readonly: true
    , header: { text:'자위소방대 임무숙지 훈련결과' }, editable: false ,
    styleName: "left-column",
    width: "200",
    renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var file_name = cell.value
          if(file_name === null){
            file_name = ''
          }
          var str = 
          `<div style="display: flex; justify-content: space-between;">
            <p style="display: flex; align-items: center; width: -webkit-fill-available; overflow-x: hidden;">
              ${file_name}
            </p>
            <button id="cellButton" style="height: 30px;">
              <span class="mdi mdi-file-edit-outline text-light-blue-darken-1"
               style="font-size: 22px ;display: flex; align-items: center;"/>
            </button>
          </div>`
          return str;
        },
      },
    },
    { fieldName: 'REV_NO', dataType: 'text', header: { text:'개정NO' }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text:'작성자' }, editable: false },
    { fieldName: 'LOCATION', dataType: 'text', header: { text:'위치' } },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ORGN_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'TRAINING_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})
    
grdMainProps1.columns = grdMainProps1.fields


//좌측 메인(하단) 그리드
const grdSubProps1 = reactive({
  gridViewOption: {},
  keys: ["BSNS_CD", "DEPT_CD"],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text:'사업부' }, editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text:'부서명' }, editable: false },
    { fieldName: 'C_FILE_NAME_ORIGINAL', dataType: 'text', header: { text:'자위소방대 조직도' } , readonly: true,
    styleName: "left-column", editable: false,
    width: "150",
    renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var file_name = cell.value
          if(file_name === null){
            file_name = ''
          }
          var str = 
          `<div style="display: flex; justify-content: space-between;">
            <p style="display: flex; align-items: center; width: -webkit-fill-available; overflow-x: hidden;">
              ${file_name}
            </p>
            <button id="cellButton" style="height: 30px;">
              <span class="mdi mdi-file-edit-outline text-light-blue-darken-1"
               style="font-size: 22px ;display: flex; align-items: center;"/>
            </button>
          </div>`
          return str;
        },
      },
    },
    { fieldName: 'D_FILE_NAME_ORIGINAL', dataType: 'text', header: { text:'자위소방대 임무숙지 훈련결과' } , readonly: true,
    styleName: "left-column", editable: false,
    width: "200",
    renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var file_name = cell.value
          if(file_name === null){
            file_name = ''
          }
          var str = 
          `<div style="display: flex; justify-content: space-between;">
            <p style="display: flex; align-items: center; width: -webkit-fill-available; overflow-x: hidden;">
              ${file_name}
            </p>
            <button id="cellButton" style="height: 30px;">
              <span class="mdi mdi-file-edit-outline text-light-blue-darken-1"
               style="font-size: 22px ;display: flex; align-items: center;"/>
            </button>
          </div>`
          return str;
        },
      },
    },
    { fieldName: 'REV_NO', dataType: 'text', header: { text:'개정NO' }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text:'작성자' }, editable: false },
    { fieldName: 'LOCATION', dataType: 'text', header: { text:'위치' }, editable: false },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ORGN_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'TRAINING_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})
    
grdSubProps1.columns = grdSubProps1.fields

//////////////////////////////////////////////메인 버튼 클릭이벤트
// 양식 다운로드 버튼
const onSampleButtonsClick = btn =>{
  
  if(btn.id === 'btnGroup'){ //조직도 다운로드
    let params = {
    FILE_PATH: "SPPB",
    FILE_NAME: "자위소방대_조직도.xlsx",//자위소방대 조직도 (빈양식).xlsx
  };
  commonSampleDownFilesApi(params);
  } else if(btn.id === 'btnMissionRecode'){//임무숙지훈련 기록부 다운로드
    let params = {
    PATH: "docx",
    FILE_PATH: "SPPB",
    FILE_NAME: "임무숙지훈련_기록부.docx",
  };
  commonSampleDownFilesApi(params);
  }

}
//좌측
const onButtonsClick1 = async btn => {
  if(btn.id === 'btnSearch'){ //대상 조회
    Promise.all([ 
      // 메인 데이터 조회 (하단 그리드)
      commonSearchApi({ 
        queryId : 'SPPBA0010_SEARCH_03',
        param: searchParams1 }),
    ]).then(res => {
      // console.log('res[0].ORESULT_CUR',res[0].ORESULT_CUR)
      grdSub1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      onSubCellClicked1({},{dataRow: 0, mainButton:true})
      grdSub1.value.getGridView().setFocus(0)
  })
  }else if(btn.id === 'btnUpdate'){ //저장
    new saveFlowHelper(vm, t)
    .setGridList([grdMain1])
    .setBefore(saveCheck1)
    .setQuery(saveData1)
    .setAfter(() => onButtonsClick1({ id: "btnSearch" }))
    .run()
  }
  else if(btn.id === 'btnDelete'){ //삭제
    new deleteFlowHelper(vm, t)
      .setBefore(delCheck1)
      .setQuery(delData1)
      .setAfter(() => onButtonsClick1({ id: "btnSearch" }))
      .run();
  }
  else if(btn.id === 'btnCreate'){ // 추가
    // console.log('addState1',addState1)
    // console.log(' searchParams1.DEPT_CD', searchParams1.DEPT_CD)
    if(addState1 && searchParams1.DEPT_CD !== ''){
      
      // console.log('addState1',addState1)
      const saveParams = []
      saveParams.push({
        CMPNY_DIV: searchParams1.CMPNY_DIV,
        BSNS_CD: searchParams1.BSNS_CD,
        DEPT_CD: searchParams1.DEPT_CD,
        YEAR_DATE: searchParams1.YEAR_DATE,
        REV_REASON: '',
        ORGN_ATTACH_KEY: '',
        TRAINING_ATTACH_KEY: '',
        LOCATION: '',
        USER_ID: userStore.userId,
      })
      afterAdd(saveParams)
      onButtonsClick1({id:'btnSearch'})
    }else{
      return Message.warn(t('부서를 선택해주세요.'))
    }
  }
}

const afterAdd = async (saveParams) => {
  return commonExecuteApi({ queryId : 'SPPBA0010_SAVE_03', list: saveParams })
}

// 좌측 디테일(상단) 그리드 데이터 저장 전
const saveCheck1 = async () => {
  let saveCheck = grdMain1.value.getGridView().getCheckedRows()

  if(!saveCheck.length>0){
    Message.warn("저장할 데이터를 선택해주세요.")
    return false;
  }
  
  // console.log(delCheck, "delCheck");
  return true;
};

// 좌측 디테일(상단) 그리드 데이터 저장 
const saveData1 = async () => {
  let saveParams = []
  let saveCheck = grdMain1.value.getGridView().getCheckedRows()
  // console.log('saveCheck',saveCheck)
  saveCheck.forEach(element => {
    const data = grdMain1.value.getRowData(element)
    saveParams.push(data)
  });

  // console.log('삭제 파라미터 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SPPBA0010_SAVE_04",
    list: saveParams,
  });
};

// 좌측 디테일(상단) 그리드 데이터 삭제 전
const delCheck1 = async () => {
  let delCheck = grdMain1.value.getGridView().getCheckedRows()

  if(!delCheck.length>0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false
  }
  
  // console.log(delCheck, "delCheck");
  return true
}

// 좌측 디테일(상단) 그리드 데이터 삭제 
const delData1 = async () => {
  let delParams = []
  let delCheck = grdMain1.value.getGridView().getCheckedRows()
  // console.log('delCheck',delCheck)
  delCheck.forEach(element => {
    const data = grdMain1.value.getRowData(element)
    delParams.push(data)
  });
  

  // console.log('삭제 파라미터 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SPPBA0010_DELETE_02",
    list: delParams,
  })
}


//////////////////////////////////////////////메인 버튼 클릭이벤트


//////////////////////////////////////////////팝업 관련
// 부서 좌측 팝업 오픈
const deptOpenPopup1 = () => {
  // console.log('작동')
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', BSNS_CD : searchParams1.BSNS_CD })
  type = 'left'
}

// 부서 선택 시 작동
const onDeptSelected = val =>{

  if(type === 'left'){
    searchParams1.BSNS_CD = val.BSNS_CD
    searchParams1.DEPT_CD = val.ASGN_CD
    searchParams1.DEPT_NM = val.ASGN_SHRT_NM
    addState1 = true
  }  
}

const uploaded = data => {
  // console.log('fileUPload popup output',data)
  if(type === 'left'){
    onButtonsClick1({ id: "btnSearch" })
  }  
}
//////////////////////////////////////////////팝업 관련


//////////////////////////////////////////////그리드 셀 이벤트
// 좌측 메인(하단) 그리드 셀 클릭 이벤트
const onSubCellClicked1 = (grid,clickData) => {
  // console.log("클릭 데이터",clickData)
  const data = grdSub1.value.getRowData(clickData.dataRow)
  const searchParam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    YEAR_DATE: searchParams1.YEAR_DATE,
  }

  // 메인 버튼으로 조회 시 부서값 배치 비활성화
  if(!clickData.mainButton){
    searchParams1.DEPT_CD=data.DEPT_CD
    searchParams1.DEPT_NM=data.DEPT_NM
  }
  Promise.all([ 
      // 디테일 데이터 조회 (상단 그리드)
      commonSearchApi({ 
        queryId : 'SPPBA0010_SEARCH_04',
        param: searchParam }),
    ]).then(res => {
      // console.log(res[0].ORESULT_CUR)
      grdMain1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
  })
  // 셀 클릭으로 부서 선택 시 추가 기능 활성화
  addState1 = true
}

// 좌측 디테일(상단) 그리드 팝업 버튼 이벤트
const onMainCellItemClicked1 = (grid, index, col) => {
  // 아이콘 선택
  if(col.target.classList[0]==="mdi"){
    const selectRow = grdMain1.value.getRowData(index.dataRow)
    let fileID = ''
    if(col.column === 'C_FILE_NAME_ORIGINAL') {//조직대 칼럼

      fileID = selectRow.ORGN_ATTACH_KEY
    }else if(col.column === 'D_FILE_NAME_ORIGINAL'){// 훈련결과 칼럼

      fileID = selectRow.TRAINING_ATTACH_KEY
    }
    //선택 행 데이터
    // console.log('onMainCellItemClicked1 fileID',fileID)
    fileUploadPopup.value.setGuid()
    // 선택 행의 파일 id
    fileUploadPopup.value.openPopup(fileID)
    type = 'left'
  }
}
// 좌측 메인(하단) 그리드 팝업 버튼 이벤트
const onSubCellItemClicked1 = (grid, index, col) => {

  // 아이콘 선택
  if(col.target.classList[0]==="mdi"){ 
    const selectRow = grdSub1.value.getRowData(index.dataRow)
    let fileID = ''
    if(col.column === 'C_FILE_NAME_ORIGINAL') {//조직대 칼럼

      fileID = selectRow.ORGN_ATTACH_KEY
    }else if(col.column === 'D_FILE_NAME_ORIGINAL'){// 훈련결과 칼럼

      fileID = selectRow.TRAINING_ATTACH_KEY
    }
    //선택 행 데이터
    fileUploadPopup.value.setGuid()
    // 선택 행의 파일 id
    fileUploadPopup.value.openPopup(fileID)
    
    // 메인쪽 데이터 추가 비활성화
    // fileUploadPopupMain.value.setGuid()
    // // 선택 행의 파일 id
    // fileUploadPopupMain.value.openPopup(fileID)
    type = 'left'
  }
}

//////////////////////////////////////////////그리드 셀 이벤트
// 부서 조회 정보 초기화
const clear1 = () => {
  searchParams1.DEPT_CD = ''
  searchParams1.DEPT_NM = ''
  isReadonly.value = false
  isReadonly.value = true
  // 선택 부서 초기화 시 초기화 비활성화 
  addState1 = false
}

onMounted(() => {
  // 그리드 데이터 바인딩
  initCodeList()
  if(tempParams.USE_YN === 'Y'){
    // console.log('tempParams',tempParams)
    searchParams1.BSNS_CD = tempParams.BSNS_CD
    searchParams1.DEPT_CD = tempParams.DEPT_CD
    searchParams1.DEPT_NM = tempParams.DEPT_NM
    searchParams1.YEAR_DATE = tempParams.YEAR_DATE

    window.sessionStorage.USE_YN2 = 'N'
    onButtonsClick1({ id: "btnSearch" })    
  }

})


//좌측 부서 선택 여부
watch(
  () => searchParams1.DEPT_CD,
  (newValue, oldValue) => {
    if(newValue===''){// 부서 선택이 되어있지 않을 때 추가 기능 비활성 화 
      addState1=false
    } else{// 사업부 안전담당자 (Y)선택 시 인원 팝업창 활성화
      addState1=true
    }
  }
)

</script>

<template>

  <v-card class="pa-1 fill-height">
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <IGridTitle
            :button-list="['btnSearch']"
            @click-button="onButtonsClick1">
            <template #editors />
          </IGridTitle>
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('년도')"
              label-width="30px"
              width="150px"
              v-model="searchParams1.YEAR_DATE"
              :items="codeList.DATE_LIST"
              item-value="COD"
              item-title="TXT"
            />        
            <i-select
              :label="$t('사업부')"
              label-width="40px"
              width="200px"
              v-model="searchParams1.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />
            <i-input
              :label="$t('소속')"                
              v-model="searchParams1.DEPT_NM"
              width="350px"
              :readonly=isReadonly
              clearable
              append-inner-icon="mdi-magnify"
              @click:appendInner="deptOpenPopup1()"
              @click:clearable="clear1()"                
            />
            <i-input                           
              v-model="searchParams1.DEPT_CD"
              width="100px"
              readonly                    
            />
          </v-sheet>
          <v-sheet height="100%" style="display: flex; flex-direction: row;">
            <v-sheet width="50%" style="padding-right: 5px;">
              <RealGrid
                ref="grdSub1"
                class="mt-2"
                :grid-view-option="grdSubProps1.gridViewOption"
                :keys="grdSubProps1.keys" 
                :fields="grdSubProps1.fields"
                :columns="grdSubProps1.columns"
                @onCellDblClicked="onSubCellClicked1"
                @onCellItemClicked="onSubCellItemClicked1"
              />
            </v-sheet>
            <v-sheet width="50%">              
                <span style="display: flex; justify-content: space-between; 
                width:-webkit-fill-available;">
                  <IGridTitle
                    :button-list="['btnGroup','btnMissionRecode']"
                    @click-button="onSampleButtonsClick">
                    <template #editors />
                  </IGridTitle>  
                  <IGridTitle
                    :button-list="['btnCreate', 'btnUpdate','btnDelete']"
                    @click-button="onButtonsClick1">
                    <template #editors />
                  </IGridTitle>
                </span>
                <RealGrid
                  ref="grdMain1"
                  class="mt-2"
                  :grid-view-option="grdMainProps1.gridViewOption"
                  :keys="grdMainProps1.keys" 
                  :fields="grdMainProps1.fields"
                  :columns="grdMainProps1.columns"
                  @onCellItemClicked="onMainCellItemClicked1"
                />
            </v-sheet>            
          </v-sheet> 
        </div>
      </v-card-text>
    </v-card> 
    <!-- 부서 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
    <!-- 피난계획서 UPLOAD 팝업 -->
    <IUploadPopup
        ref="fileUploadPopup"
        @uploaded="uploaded"
        :buttonList="['btnFileUpload','btnDownLoad', 'btnDelete', 'btnClose']"
        :autoUpload="true"
        />
        <!-- <IUploadPopupMain
        ref="fileUploadPopupMain"
        :buttonList="['btnDownLoad', 'btnClose']"
        :autoUpload="false"
        :isVisibled="false"
        /> -->
  </template>
    
  <style scoped lang="scss">
  .content-area {
    position: relative;
    // 만약 타이틀 영역에 컴포넌트를 추가한다면
    // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
    height: calc(100vh - 200px);
    overflow-y: auto;
    > div {
      // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
      // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
      min-height: 600px;
    }
  }
  
  </style>
