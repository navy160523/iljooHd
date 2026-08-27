<script setup>
import { ref, reactive, onMounted, getCurrentInstance, onBeforeMount , watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi,commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
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
  name: '50_safety-support-SPP_B-TAB-SPPBA0010_Tab03',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea1 = ref(null)
const searchRightArea = ref(null)
const grdMain1 = ref(null)
const grdSub1 = ref(null)
const grdMain2 = ref(null)
const grdSub2 = ref(null)
const deptPopup = ref(null)
const isReadonly = ref(true)
const fileUploadPopup = ref(null)
const fileUploadPopupMain = ref(null)
const props = defineProps(['transfer']) 

const tab = ref('tab1')
const tempParams = reactive(props.transfer ? props.transfer : {})

let type = '' // 팝업 좌,우측 구분
let addState1 = false // 좌측 데이터 추가 가능 여부
let addState2 = false// 우측 데이터 추가 가능 여부

/* 좌측 조회 데이터 */
const searchParams1 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.asgnNm,
  YEAR_DATE: dayjs(new Date()).format("YYYY"),
})


/* 우측 조회 데이터 */
const searchParams2 = reactive({
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
  TRAINING_TYPE: [],
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
      commonSearchApi({ 
        queryId : 'searchBSNS',
        param:{
          CMPNY_DIV: userStore.cmpnyDiv,
          USE_DIV: 'Y',
        }}),
      commonSearchApi({ 
        queryId : 'SPPBA0010_SEARCH_00',
        param:{
          CMPNY_DIV: userStore.cmpnyDiv,
          COD: userStore.cmpnyDiv + 'K100',
        }}),
      ]).then(res => {
    // 회사
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.TRAINING_TYPE = res[2].ORESULT_CUR
    // 진행상태
    let startDate = dayjs(new Date).format('YYYY') - 40
    let endDate = dayjs(new Date).format('YYYY')

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
    { fieldName: 'TRAINING_TYPE', readonly: true
    , dataType: 'text'
    , header: { text:'소방훈련종류' }
    , lookupDisplay: true,
      editor: {
        type: "dropdown",
        dropDownWhenClick: true,
        partialMatch: true,
        domainOnly: true,
        textReadOnly: true
      },
    },
    { fieldName: 'FILE_NAME_ORIGINAL', dataType: 'text', readonly: true
    , header: { text:'소방훈련기록표' }, editable: false ,
    styleName: "left-column",
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
          return str
        },
      },
    },
    { fieldName: 'TRAINING_DATE', header: { text:'훈련일자' }
    , dataType: 'text', editable: false
    , renderer: {
        type: "html",
        callback: function (grid, cell) {
          var date = cell.value
          var result = ''
          if(date !== null && date !== ''){
            result = date.slice(0,4) + '-' + date.slice(4,6)+ '-' + date.slice(6)
          }
          return result
        }
      } 
    },
    { fieldName: 'TRAINING_PLACE', dataType: 'text', header: { text:'훈련장소' } },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text:'작성자' }, editable: false },  
    { fieldName: 'REV_NO', dataType: 'text', header: { text:'Ver No.' }, editable: false },
  
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
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
    { fieldName: 'TRAINING_TYPE'
    , dataType: 'text'
    , header: { text:'소방훈련종류' }
    , lookupDisplay: true,
      editor: {
        type: "dropdown",
        dropDownWhenClick: true,
        partialMatch: true,
        domainOnly: true,
        textReadOnly: true
      }
    , editable: false
    },
    { fieldName: 'FILE_NAME_ORIGINAL', dataType: 'text', readonly: true
    , header: { text:'소방훈련기록표' }, editable: false ,
    styleName: "left-column",
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
          return str
        },
      },
    },
    { fieldName: 'TRAINING_DATE', header: { text:'훈련일자' }
    , dataType: 'text', editable: false
    , renderer: {
        type: "html",
        callback: function (grid, cell) {
          var date = cell.value
          var result = ''
          if(date !== null && date !== ''){
            result = date.slice(0,4) + '-' + date.slice(4,6)+ '-' + date.slice(6)
          }
          return result
        }
      }
    },
    { fieldName: 'TRAINING_PLACE', dataType: 'text', header: { text:'훈련장소' }},
    { fieldName: 'KOR_NM', dataType: 'text', header: { text:'작성자' }, editable: false },  
  
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'TRAINING_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})
    
grdSubProps1.columns = grdSubProps1.fields


//우측 디테일(상단) 그리드
const grdMainProps2 = reactive({
  gridViewOption: {  checkBar: { visible: true } },
  keys: ["BSNS_CD", "DEPT_CD"],
  fields : [ 
  { fieldName: 'BSNS_NM', dataType: 'text', header: { text:'사업부' }, editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text:'부서명' }, editable: false },
    { fieldName: 'TRAINING_TYPE', readonly: true
    , dataType: 'text'
    , header: { text:'소방훈련종류' }
    , lookupDisplay: true,
      editor: {
        type: "dropdown",
        dropDownWhenClick: true,
        partialMatch: true,
        domainOnly: true,
        textReadOnly: true
      },
    },
    { fieldName: 'FILE_NAME_ORIGINAL', dataType: 'text', readonly: true
    , header: { text:'소방훈련기록표' }, editable: false ,
    styleName: "left-column",
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
    { fieldName: 'TRAINING_DATE', header: { text:'훈련일자' }
    , dataType: 'text', editable: false
    , renderer: {
        type: "html",
        callback: function (grid, cell) {
          var date = cell.value
          var result = ''
          if(date !== null && date !== ''){
            result = date.slice(0,4) + '-' + date.slice(4,6)+ '-' + date.slice(6)
          }
          return result
        }
      }
    },
    { fieldName: 'TRAINING_PLACE', dataType: 'text', header: { text:'훈련장소' }},
    { fieldName: 'KOR_NM', dataType: 'text', header: { text:'작성자' }, editable: false },  
    { fieldName: 'REV_NO', dataType: 'text', header: { text:'Ver No.' }, editable: false },
  
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'TRAINING_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})
    
grdMainProps2.columns = grdMainProps2.fields


//우측 메인(하단) 그리드
const grdSubProps2 = reactive({
  gridViewOption: {},
  keys: ["BSNS_CD", "DEPT_CD"],
  fields : [ 
  { fieldName: 'BSNS_NM', dataType: 'text', header: { text:'사업부' }, editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text:'부서명' }, editable: false },
    { fieldName: 'TRAINING_TYPE'
    , dataType: 'text'
    , header: { text:'소방훈련종류' }
    , lookupDisplay: true,
      editor: {
        type: "dropdown",
        dropDownWhenClick: true,
        partialMatch: true,
        domainOnly: true,
        textReadOnly: true
      }
    , editable: false
    },
    { fieldName: 'FILE_NAME_ORIGINAL', dataType: 'text', readonly: true
    , header: { text:'소방훈련기록표' } ,
    styleName: "left-column",
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
    { fieldName: 'TRAINING_DATE', header: { text:'훈련일자' }
    , dataType: 'text'
    , renderer: {
        type: "html",
        callback: function (grid, cell) {
          var date = cell.value
          var result = ''
          if(date !== null && date !== ''){
            result = date.slice(0,4) + '-' + date.slice(4,6)+ '-' + date.slice(6)
          }
          return result
        }
      }
    }, 
    { fieldName: 'TRAINING_PLACE', dataType: 'text', header: { text:'훈련장소' }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text:'작성자' }, editable: false },  
  
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'TRAINING_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})
    
grdSubProps2.columns = grdSubProps2.fields

//////////////////////////////////////////////메인 버튼 클릭이벤트
// 양식 다운로드 버튼
const onSampleButtonsClick = btn =>{
  if(btn.id === 'btnSampleDown'){
    let params = {
    PATH: "docx",
    FILE_PATH: "SPPB",
    FILE_NAME: "소방훈련교육실기결과기록부.docx",
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
        queryId : 'SPPBA0010_SEARCH_05',
        param: searchParams1 }),
    ]).then(res => {
      // console.log('searchData',res[0].ORESULT_CUR)
      grdSub1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      onSubCellClicked1({},{dataRow: 0, mainButton:true})
      grdSub1.value.getGridView().setFocus(0)
      // console.log('training_type',codeList.TRAINING_TYPE)
      grdMain1.value.setBindingColumn("TRAINING_TYPE", codeList.TRAINING_TYPE, "COD", "TXT") 
      grdSub1.value.setBindingColumn("TRAINING_TYPE", codeList.TRAINING_TYPE, "COD", "TXT") 

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


// 우측 메인 버튼 클릭 이벤트
const onButtonsClick2 = async btn => {
  if(btn.id === 'btnSearch'){ //대상 조회
    Promise.all([ 
      // 메인 데이터 조회 (하단 그리드)
      commonSearchApi({ 
        queryId : 'SPPBA0010_SEARCH_05',
        param: searchParams2 }),
    ]).then(res => {
      grdSub2.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      onSubCellClicked2({},{dataRow: 0, mainButton:true})
      grdMain2.value.setBindingColumn("TRAINING_TYPE", codeList.TRAINING_TYPE, "COD", "TXT") 
      grdSub2.value.setBindingColumn("TRAINING_TYPE", codeList.TRAINING_TYPE, "COD", "TXT") 

  })
  }else if(btn.id === 'btnUpdate'){ //저장
    new saveFlowHelper(vm, t)
    .setGridList([grdMain2])
    .setBefore(saveCheck2)
    .setQuery(saveData2)
    .setAfter(() => onButtonsClick2({ id: "btnSearch" }))
    .run()
  }
  else if(btn.id === 'btnDelete'){ //삭제
    new deleteFlowHelper(vm, t)
      .setBefore(delCheck2)
      .setQuery(delData2)
      .setAfter(() => onButtonsClick2({ id: "btnSearch" }))
      .run();
  }
  else if(btn.id === 'btnCreate'){ // 추가
    if(addState2 && searchParams1.DEPT_CD !== ''){
      const saveParams = []
      saveParams.push({
      CMPNY_DIV: searchParams2.CMPNY_DIV,
      BSNS_CD: searchParams2.BSNS_CD,
      DEPT_CD: searchParams2.DEPT_CD,
      YEAR_DATE: searchParams2.YEAR_DATE,
      REV_REASON: '',
      TRAINING_ATTACH_KEY: '',
      LOCATION: '',
      USER_ID: userStore.userId,
      })
      afterAdd(saveParams)
      onButtonsClick2({id:'btnSearch'})
    }else{
      return Message.warn(t('부서를 선택해주세요.'))
    }
  }
  
}

const afterAdd = async (saveParams) => {
  return commonExecuteApi({ queryId : 'SPPBA0010_SAVE_05', list: saveParams })
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
// 우측 디테일(상단) 그리드 데이터 저장 전
const saveCheck2 = async () => {
  let saveCheck = grdMain2.value.getGridView().getCheckedRows()

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
    queryId: "SPPBA0010_SAVE_06",
    list: saveParams,
  });
};


// 우측 디테일(상단) 그리드 데이터 저장 
const saveData2 = async () => {
  let saveParams = []
  let saveCheck = grdMain2.value.getGridView().getCheckedRows()
  // console.log('saveCheck',saveCheck)
  saveCheck.forEach(element => {
    const data = grdMain2.value.getRowData(element)
    saveParams.push(data)
  });

  // console.log('삭제 파라미터 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SPPBA0010_SAVE_06",
    list: saveParams,
  })
}
// 좌측 디테일(상단) 그리드 데이터 삭제 전
const delCheck1 = async () => {
  let delCheck = grdMain1.value.getGridView().getCheckedRows()

  if(!delCheck.length>0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false
  }
  
  // console.log(delCheck, "delCheck")
  return true
}

// 우측 디테일(상단) 그리드 데이터 삭제 전
const delCheck2 = async () => {
  let delCheck = grdMain2.value.getGridView().getCheckedRows()

  if(!delCheck.length>0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false
  }
  
  // console.log(delCheck, "delCheck")
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
  })
  

  // console.log('삭제 파라미터 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SPPBA0010_DELETE_03",
    list: delParams,
  })
}



// 우측 디테일(상단) 그리드 데이터 삭제 
const delData2 = async () => {
  let delParams = []
  let delCheck = grdMain2.value.getGridView().getCheckedRows()
  // console.log('delCheck',delCheck)
  delCheck.forEach(element => {
    const data = grdMain2.value.getRowData(element)
    delParams.push(data)
  })
  
  

  // console.log('삭제 파라미터 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SPPBA0010_DELETE_03",
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

// 부서 우측 팝업 오픈
const deptOpenPopup2 = () => {
  // console.log('작동')
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', BSNS_CD : searchParams2.BSNS_CD })
  type = 'right'
}

// 부서 선택 시 작동
const onDeptSelected = val =>{

  if(type === 'left'){
    searchParams1.BSNS_CD = val.BSNS_CD
    searchParams1.DEPT_CD = val.ASGN_CD
    searchParams1.DEPT_NM = val.ASGN_SHRT_NM
    addState1 = true
  }else if(type === 'right'){
    searchParams2.BSNS_CD = val.BSNS_CD
    searchParams2.DEPT_CD = val.ASGN_CD
    searchParams2.DEPT_NM = val.ASGN_SHRT_NM
    addState2 = true
  }
  
}
const uploaded = data => {
  // console.log('fileUPload popup output',data)
  if(type === 'left'){
    onButtonsClick1({ id: "btnSearch" })
  }else if(type === 'right'){
    onButtonsClick2({ id: "btnSearch" })
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
        queryId : 'SPPBA0010_SEARCH_06',
        param: searchParam }),
    ]).then(res => {
      // console.log('detailResult',res[0].ORESULT_CUR)
      grdMain1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
  })
  // 셀 클릭으로 부서 선택 시 추가 기능 활성화
  addState1 = true
}

// 우측 메인(하단) 그리드 셀 클릭 이벤트
const onSubCellClicked2 = (grid, clickData) => {
  // console.log("클릭 데이터",clickData)
  const data = grdSub2.value.getRowData(clickData.dataRow)
  const searchParam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    YEAR_DATE: searchParams2.YEAR_DATE,
  }

  // 메인 버튼으로 조회 시 부서값 배치 비활성화
  if(!clickData.mainButton){
    searchParams2.DEPT_CD=data.DEPT_CD
    searchParams2.DEPT_NM=data.DEPT_NM
  }
  Promise.all([ 
      // 디테일 데이터 조회 (상단 그리드)
      commonSearchApi({ 
        queryId : 'SPPBA0010_SEARCH_06',
        param: searchParam }),
    ]).then(res => {
      grdMain2.value.getDataProvider().setRows(res[0].ORESULT_CUR)
  })
  // 셀 클릭으로 부서 선택 시 추가 기능 활성화
  addState2 = true
}

// 좌측 디테일(상단) 그리드 팝업 버튼 이벤트
const onMainCellItemClicked1 = (grid, index, col) => {
  // 아이콘 선택
  if(col.target.classList[0]==="mdi"){ 
    //선택 행 데이터

    const selectRow = grdMain1.value.getRowData(index.dataRow)
    let fileID = ''
    fileUploadPopup.value.setGuid()
    // 선택 행의 파일 id
    fileID = selectRow.TRAINING_ATTACH_KEY
    fileUploadPopup.value.openPopup(fileID)
    type = 'left'
  }
}
// 좌측 메인(하단) 그리드 팝업 버튼 이벤트
const onSubCellItemClicked1 = (grid, index, col) => {

  // 아이콘 선택
  if(col.target.classList[0]==="mdi"){ 
    //선택 행 데이터

    const selectRow = grdSub1.value.getRowData(index.dataRow)
    let fileID = ''
    // fileUploadPopup.value.setGuid()
    // fileID = selectRow.TRAINING_ATTACH_KEY
    // fileUploadPopup.value.openPopup(fileID)
    // 메인쪽 데이터 추가 비활성화 
    fileUploadPopupMain.value.setGuid()
    // 선택 행의 파일 id
    fileID = selectRow.TRAINING_ATTACH_KEY
    fileUploadPopupMain.value.openPopup(fileID)
    type = 'left'
  }
}

// 우측 디테일(상단) 그리드 팝업 버튼 이벤트
const onMainCellItemClicked2 = (grid, index, col) => {
  // 아이콘 선택
  if(col.target.classList[0]==="mdi"){ 
    //선택 행 데이터

    const selectRow = grdMain2.value.getRowData(index.dataRow)
    let fileID = ''
    fileUploadPopup.value.setGuid()
    // 선택 행의 파일 id
    fileID = selectRow.TRAINING_ATTACH_KEY
    fileUploadPopup.value.openPopup(fileID)
    type = 'right'
  }
}

// 우측 메인(하단) 그리드 팝업 버튼 이벤트
const onSubCellItemClicked2 = (grid, index, col) => {
  // 아이콘 선택
  if(col.target.classList[0]==="mdi"){ 
    //선택 행 데이터

    const selectRow = grdSub2.value.getRowData(index.dataRow)
    let fileID = ''
    // fileUploadPopup.value.setGuid()
    // fileID = selectRow.TRAINING_ATTACH_KEY
    // fileUploadPopup.value.openPopup(fileID)
    // type = 'right'
    // 메인쪽 데이터 추가 비활성화 
    fileUploadPopupMain.value.setGuid()
    // 선택 행의 파일 id
    fileID = selectRow.TRAINING_ATTACH_KEY
    fileUploadPopupMain.value.openPopup(fileID)
    type = 'right'
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

// 부서 조회 정보 초기화
const clear2 = () => {
  searchParams2.DEPT_CD = ''
  searchParams2.DEPT_NM = ''
  isReadonly.value = false
  isReadonly.value = true
  // 선택 부서 초기화 시 초기화 비활성화 
  addState2 = false
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
    
    searchParams2.BSNS_CD = tempParams.BSNS_CD
    searchParams2.DEPT_CD = tempParams.DEPT_CD
    searchParams2.DEPT_NM = tempParams.DEPT_NM
    searchParams2.YEAR_DATE = tempParams.YEAR_DATE
    
    window.sessionStorage.USE_YN3 = 'N'
    onButtonsClick1({ id: "btnSearch" })
    onButtonsClick2({ id: "btnSearch" })
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


//우측 부서 선택 여부
watch(
  () => searchParams2.DEPT_CD,
  (newValue, oldValue) => {
    if(newValue===''){// 부서 선택이 되어있지 않을 때 추가 기능 비활성 화 
      addState2=false
    } else{// 사업부 안전담당자 (Y)선택 시 인원 팝업창 활성화
      addState2=true
    }
  }
)


</script>

<template>

  <v-card class="pa-1 fill-height">
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet height="50%" style="display: flex; flex-direction: row;">
            <v-sheet width="50%" style="padding-right: 5px;">
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
              
                <ILabel
                  :label="$t('소속')"
                  label-width="100"
                  style="width: 350px;"
                  >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams1.DEPT_NM"
                      append-inner-icon="mdi-magnify"
                      append-icon="mdi-close-box-outline"
                      @click:appendInner="deptOpenPopup1()"
                      @click:append="clear1()"
                      :readonly=isReadonly
                      bg-color="#FFFFFF"
                    >
                    </VTextField>
                  </template>      
                </ILabel>
              
                <VTextField
                      v-model="searchParams1.DEPT_CD"
                      :readonly=isReadonly
                    />
                </v-sheet>
                <span style="display: flex; justify-content: space-between; 
                width:-webkit-fill-available;">
                  <IGridTitle
                  :button-list="['btnSampleDown']"
                    @click-button="onSampleButtonsClick">
                    <template #editors />
                  </IGridTitle>  
                  <IGridTitle
                  :button-list="['btnSearch','btnCreate', 'btnUpdate','btnDelete']"
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
            <!-- 우측 상단 칸-->
            <v-sheet width="50%" style="padding-right: 5px;">
              <v-sheet class="searchArea d-flex">
                <i-select
                      :label="$t('년도')"
                      label-width="30px"
                      width="150px"
                      v-model="searchParams2.YEAR_DATE"
                      :items="codeList.DATE_LIST"
                      item-value="COD"
                      item-title="TXT"
                    />
      
                    <i-select
                      :label="$t('사업부')"
                      label-width="40px"
                      width="200px"
                      v-model="searchParams2.BSNS_CD"
                      :items="codeList.BSNS_CD"
                      item-value="BSNS_CD"
                      item-title="BSNS_NM"
                    />
                  <ILabel
                      :label="$t('소속')"
                      label-width="100"
                      style="width: 350px;"
                      >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="searchParams2.DEPT_NM"
                          append-inner-icon="mdi-magnify"
                          append-icon="mdi-close-box-outline"
                          @click:appendInner="deptOpenPopup2()"
                          @click:append="clear2()"
                          :readonly=isReadonly
                          bg-color="#FFFFFF"
                        />
                      </template>      
                    </ILabel>
                    <VTextField
                          v-model="searchParams2.DEPT_CD"
                          :readonly=isReadonly
                        />
                  </v-sheet>
                <IGridTitle 
                :button-list="['btnSearch','btnCreate', 'btnUpdate','btnDelete']"
                  @click-button="onButtonsClick2">
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdMain2"
                  class="mt-2"
                  :grid-view-option="grdMainProps2.gridViewOption"
                  :keys="grdMainProps2.keys" 
                  :fields="grdMainProps2.fields"
                  :columns="grdMainProps2.columns"
                  @onCellItemClicked="onMainCellItemClicked2"
                />
            </v-sheet>
          </v-sheet>
          <v-sheet height="50%" style="display: flex; flex-direction: row;">
  
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
            <v-sheet width="50%" style="padding-right: 5px;">
              <RealGrid
                ref="grdSub2"
                class="mt-2"
                :grid-view-option="grdSubProps2.gridViewOption"
                :keys="grdSubProps2.keys" 
                :fields="grdSubProps2.fields"
                :columns="grdSubProps2.columns"
                @onCellDblClicked="onSubCellClicked2"
                @onCellItemClicked="onSubCellItemClicked2"
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
        <IUploadPopupMain
        ref="fileUploadPopupMain"
        :buttonList="['btnDownLoad', 'btnClose']"
        :autoUpload="false"
        :isVisibled="false"
        />
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
