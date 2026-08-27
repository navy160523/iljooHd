<!-- SAFIG0020 합동안전보건점검 결과 등록/현황 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import Message from "@hiway/utils/notify";
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import VendPopup from '@/components/popup/VendPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RegisterPopup from '@/pages/30_safety/SAF_I/POPUP/SAFIG0010Popup01.vue'
import IUploadPopup from '@/pages/30_safety/SAF_I/POPUP/SAFIG0010Popup02.vue'

import dayjs from 'dayjs'

defineOptions({
  name:'30_safety-SAF_I-SAFIG0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

/* 팝업 */
// 협력사 조회 팝업
const vendPopup = ref(null)
// 부서 조회 팝업
const deptPopup = ref(null)
// 파일 업로드 팝업
const fileUploadPopup = ref(null)
// 점검 등록 팝업
const registerPopup = ref(null)

const menuTitle = ref(null)
const grdMain = ref(null)
const userId = ref(userStore.userId)
let maxDate = ''
let minDate = ''
/* 코드 리스트 */
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  DATE_LIST: [],
  HALF_YEAR: [
    {COD: 'A', TXT: '상반기'}
    ,{COD: 'B', TXT: '하반기'}],
  CURRENT_ROW: '',
  COMP_TYPE: [
    {COD: '', TXT: ''}
    ,{COD: 'A', TXT: '프로젝트'}
    ,{COD: 'B', TXT: '사내'}
  ],
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,//'',
  ASGN_CD: '',
  DEPT_NM: '',
  HALF_YEAR: '',
  YEAR_DATE: dayjs(new Date()).format("YYYY"),
})

// 초기 조회 코드 생성
const initCodeList = async () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  await Promise.all([ 
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
      }),
      commonSearchApi({
        queryId : 'searchDept3',
        param : {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          USE_DIV:'Y'
        }
      })
      ]).then(res => {
    // 회사
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR // 부서
    // 진행상태
    let startDate = dayjs(new Date).format('YYYY') - 40
    let endDate = dayjs(new Date()).add(1, 'year').format('YYYY')

    for(let i = endDate; i > startDate; i--){
      codeList.DATE_LIST.push({COD:i.toString() ,TXT: i.toString()})
    }
    // codeList.HALF_YEAR.unshift({ TXT:'전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD: '' })

    // console.log('금월', parseInt(dayjs(new Date).format('MM')))

  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false },checkBar: { visible: true } },
  fields : [ 
    { fieldName: 'BSNS_CD', dataType: 'text', width: '100', header: { text: t('사업부') }, editable: false,
    renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          const BSNS_CD = cell.value
          let BSNS_NM = ''
          codeList.BSNS_CD.forEach((e) => {
            if(e.BSNS_CD === BSNS_CD){
              BSNS_NM = e.BSNS_NM
            }
          });
          return BSNS_NM
        },
      }, 
    },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '180', header: { text: t('등록부서') }, editable: false,},
    { fieldName: 'COMP_NM', dataType: 'text', width: '300', header: { text: t('협력사명') }, editable: false, styleName: 'left-column'},
    { fieldName: 'OWNER_NM', dataType: 'text', width: '140', header: { text: t('대표명') }, editable: false },
    { fieldName: 'COMP_TYPE',lookupDisplay: true, dataType: 'text', width: '80', header: { text: t('구분') } , editable: false},
    { fieldName: 'RESIDENCE_PERIOD', dataType: 'text', width: '80', header: { text: t('상주기간') } 
      ,renderer: {
        type: "html",
          callback: function (grid, cell, w, h) {
            if(cell.value >= 1){

            }
            var str = 
            `<div style="display: flex; justify-content: center;
            padding-left: 10px; padding-right: 10px">
              <p>${cell.value}&nbsp 개월</p>
            </div>`
            return str
          },
        },
      editable: false,
    },
    // { fieldName: 'FROM_DATE', dataType: 'text', width: '100', header: { text: t('시작일') },
    //   lookupDisplay: true,  
    //   editButtonVisibility: 'always',
    //   editor:{
    //     type: 'date',
    //     datetimeFormat: 'yyyy-MM-dd',
    //   },
    // },
    // { fieldName: 'TO_DATE', dataType: 'text', width: '100', header: { text: t('종료일') },
    //   lookupDisplay: true,
    //   editButtonVisibility: 'always',
    //   editor:{
    //     type: 'date',
    //     datetimeFormat: 'yyyy-MM-dd',
    //   },
    // },
    { fieldName: 'M12_CNT', dataType: 'text', width: '60', header: { text: t('12월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M01_CNT', dataType: 'text', width: '60', header: { text: t('1월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M02_CNT', dataType: 'text', width: '60', header: { text: t('2월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M03_CNT', dataType: 'text', width: '60', header: { text: t('3월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M04_CNT', dataType: 'text', width: '60', header: { text: t('4월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M05_CNT', dataType: 'text', width: '60', header: { text: t('5월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M06_CNT', dataType: 'text', width: '60', header: { text: t('6월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M07_CNT', dataType: 'text', width: '60', header: { text: t('7월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M08_CNT', dataType: 'text', width: '60', header: { text: t('8월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M09_CNT', dataType: 'text', width: '60', header: { text: t('9월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M10_CNT', dataType: 'text', width: '60', header: { text: t('10월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'M11_CNT', dataType: 'text', width: '60', header: { text: t('11월') }, editable: false, styleName: 'font-weight-bold cursor-pointer', },
    { fieldName: 'INSPECTION_CNT', dataType: 'text', width: '100', header: { text: t('점검건수') }, editable: false, styleName: 'right-column', },
    { fieldName: 'REMARKS', dataType: 'text', width: '250', header: { text: t('비고') }, styleName: 'editable_column left-column', },
    // { fieldName: 'INSPECTION_REGI', dataType: 'text', width: '60', header: { text: t('점검등록') }, editable: false,
    // renderer: {
    //   type: "html",
    //     callback: function (grid, cell, w, h) {
    //       var str = 
    //       `<div style="display: flex; justify-content: center;
    //       padding-left: 10px; padding-right: 10px">
    //         <button id="inputPopup" class="v-btn" 
    //         style="color: #fff; background: #1a40c7; padding: 4px;">
    //           직접 입력
    //         </button>
    //       </div>`
    //       return str;
    //     },
    //   }, 
    // },
    // { fieldName: 'INSPECTION_PDF', dataType: 'text', width: '60', header: { text: t('파일첨부') }, editable: false,
    // renderer: {
    //   type: "html",
    //     callback: function (grid, cell, w, h) {
    //       var str = 
    //       `<div style="display: flex; justify-content: center;
    //       padding-left: 10px; padding-right: 10px">
    //         <button id="pdfUpload" class="v-btn" 
    //         style="color: #fff; background: #1a40c7; padding: 4px;">
    //           PDF 첨부
    //         </button>
    //       </div>`
    //       return str;
    //     },
    //   }, 
    // },
    // { fieldName: 'REMARKS', dataType: 'text', width: '100', header: { text: t('비고') } },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', visible: false },
    { fieldName: 'SEQ', dataType: 'text', visible: false },
    { fieldName: 'FILE_ATTACH_KEY', dataType: 'text', visible: false },
    { fieldName: 'COMP_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_HEAD_NM', dataType: 'text', visible: false },
    { fieldName: 'YEAR_DATE', dataType: 'text', visible: false },
    { fieldName: 'HALF_YEAR', dataType: 'text', visible: false },
    { fieldName: 'SUGGESTION', dataType: 'text', visible: false },
    { fieldName: 'PDF_KEY', dataType: 'text', visible: false },
    { fieldName: 'PDF_CNT', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [],
})

grdMainProps.columns = grdMainProps.fields

// 메인 버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch')
  {
    Promise.all([ 
      // 메인 데이터 조회 (하단 그리드)
      commonSearchApi({ 
        queryId : 'SAFIG0010_SEARCH_00',
        param: searchParams }),
    ]).then(res => {
      const arrA = ['M12_CNT', 'M01_CNT', 'M02_CNT', 'M03_CNT', 'M04_CNT', 'M05_CNT']
      const arrB = ['M06_CNT', 'M07_CNT', 'M08_CNT', 'M09_CNT', 'M10_CNT', 'M11_CNT']
      const columnLayout = [
        'BSNS_CD',
        'DEPT_NM',
        'COMP_NM',
        'OWNER_NM',
        'COMP_TYPE',
        'RESIDENCE_PERIOD',
        {
          name: '결과등록',
          direction: 'horizontal',
          items: searchParams.HALF_YEAR === 'A' ? arrA : arrB,
          header: { text: t('결과등록') },
        },
        'INSPECTION_CNT',
        'REMARKS',
        // 'INSPECTION_REGI',
        // 'INSPECTION_PDF',
      ]
      console.log('columnLayout', columnLayout)
      grdMainProps.columnLayout = columnLayout
      grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)

      updateDate()
      const result = res[0].ORESULT_CUR
      result.forEach((e)=>{
        if(e.ENT_DATE){
          
          // console.log('elemental',dayjs(e.ENT_DATE))
          let startDate = dayjs(e.ENT_DATE)
          let endDate = dayjs(new Date())
          const tempMinDate = dayjs(minDate)
          const tempMaxDate = dayjs(maxDate)
          

          if(tempMinDate>startDate){
            startDate = tempMinDate
          }
          if(tempMaxDate<endDate){
            endDate = tempMaxDate
          }

          // console.log('startDate',startDate.format('YYYY-MM-DD'))
          // console.log('endDate',endDate.format('YYYY-MM-DD'))
          let duration = endDate.diff(startDate, 'month')

          if(startDate === tempMinDate && endDate === tempMaxDate){
            duration = 6
          }
          if(duration < 0){
            duration = 0
          }
          
          // console.log('duration', duration)
          e.RESIDENCE_PERIOD = duration
        }else{
          e.RESIDENCE_PERIOD = 0
        }
      })
      grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      setCellStyle()
      console.log('res',res[0].ORESULT_CUR)
  })
  } 
  else if (btn.id === 'btnCreate') { // 행추가
    if(searchParams.HALF_YEAR !== ''){
      addData()
    }else {
      return Message.warn(t('반기를 선택해주세요.'))
    }
  } 
  else if (btn.id === 'btnUpdate') { // 저장
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(saveCheck)
      .setQuery(saveData)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run();
  }
  else if (btn.id === 'btnDelete') { // 삭제
    new deleteFlowHelper(vm, t)
      .setBefore(delCheck)
      .setQuery(delData)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run();
  } else if(btn.id === "btnPrint"){
    const excelFileNM = '합동안전보건점검 결과 등록/현황'
    const now = dayjs(new Date).format('YYYYMMDDHHmm')
    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }
    
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: now+'_'+excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.', 
      showProgress: true, 
      indicator: 'visible', 
      header: 'visible', 
      footer: 'hidden', 
      showColumns: [],
      hideColumns: ['INSPECTION_REGI'],
      allColumns: false,
    })
  }
}

/* -------------- 조회 -------------- */
// 메인 그리드
/* -------------- 추가 -------------- */

// 행 추가
const addData = () => {

  if(searchParams.BSNS_CD === ''){
    return Message.warn(t('사업부를 선택해주세요.'))
  }else{
    // 협력사 검색 팝업 오픈
    vendPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: searchParams.BSNS_CD,
      HSE_ONLY: "Y",
    })
    
  }
}


const afterAdd = (saveParams) => {
  return commonExecuteApi
  (
    { 
      queryId : 'SAFIG0010_SAVE_01'
    , list: saveParams 
    }
  )
}

/* -------------- 저장 -------------- */
// 그리드 데이터 저장 전
const saveCheck = async () => {
  let saveCheck = grdMain.value.getGridView().getCheckedRows()

  if(!saveCheck.length>0){
    Message.warn("저장할 데이터를 선택해주세요.")
    return false;
  }
  
  // console.log(delCheck, "delCheck");
  return true;
};


//  그리드 데이터 저장 
const saveData = async () => {
  let saveParams = []
  let saveCheck = grdMain.value.getGridView().getCheckedRows()
  // console.log('saveCheck',saveCheck)
  saveCheck.forEach(element => {
    const data = grdMain.value.getRowData(element)
    saveParams.push(data)
  });

  // console.log('삭제 파라미터 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SAFIG0010_SAVE_02",
    list: saveParams,
  });
};
/* -------------- 삭제 -------------- */

// 우측 디테일(상단) 그리드 데이터 삭제 전
const delCheck = async () => {
  let delCheck = grdMain.value.getGridView().getCheckedRows()

  if(!delCheck.length>0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false
  }
  
  // console.log(delCheck, "delCheck");
  return true
}


// 우측 디테일(상단) 그리드 데이터 삭제 
const delData = async () => {
  let delParams = []
  let delCheck = grdMain.value.getGridView().getCheckedRows()
  // console.log('delCheck',delCheck)
  delCheck.forEach(element => {
    const data = grdMain.value.getRowData(element)
    delParams.push(data)
  });
  // console.log('삭제 파라미터 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SAFIG0010_DELETE_01",
    list: delParams,
  })
}
/* -------------- 팝업 오픈 -------------- */

// 협력사 그리드 팝업 버튼 이벤트
const onVendCellItemClicked = (grid, index, col) => {
// 아이콘 선택
// console.log('index',index.target)
//선택 행 데이터
const selectRow = grdMain.value.getRowData(index.dataRow)
selectRow.HALF_YEAR = searchParams.HALF_YEAR
codeList.CURRENT_ROW = index.dataRow
    
  // console.log('minDate',minDate)
  // console.log('maxDate',maxDate)

   if(col.target.classList[0] === 'v-btn' && col.column === 'INSPECTION_PDF'
  && col.target.id === 'pdfUpload' ){ 
    // console.log(selectRow.FILE_ATTACH_KEY)
    fileUploadPopup.value.setGuid()
    fileUploadPopup.value.openPopup(selectRow.FILE_ATTACH_KEY)

  }  // 점검등록 열의 직접등록 버튼 클릭 시
  else if(col.target.classList[0] === 'v-btn' && col.column === 'INSPECTION_REGI'
  && col.target.id === 'inputPopup' ){ 
    // console.log('selectRow',selectRow)

    registerPopup.value.openPopup(selectRow)
    
    
  }  
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType !== 'data') {
    return
  }

  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  data.MONTH_DATE = clickData.fieldName.substr(1, 2)
  // console.log('data', data)

  if(clickData.fieldName.substr(0, 1) === 'M' && clickData.fieldName.indexOf('_CNT') > 0) {
    registerPopup.value.openPopup(data)
  }
}

const setCellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback( (grid, dataCell) => {
    let ret = {}
    if(dataCell.dataColumn.fieldName === 'RESIDENCE_PERIOD'){
      if(dataCell.value > 0 ){
        ret.style = { background: "rgb(3 186 252 / 25%)"} 
      }
    }
    return  ret
  })
}

/* -------------- 팝업 선택 이벤트 -------------- */
// const onDeptSelected = val => {
//   // console.log('dept val',val)
//   grdMain.value.getDataProvider().setValue(codeList.CURRENT_ROW, "DEPT_NM" ,val.ASGN_SHRT_NM)
//   grdMain.value.getDataProvider().setValue(codeList.CURRENT_ROW, "DEPT_CD" ,val.ASGN_CD)
// }
/* -------------- 팝업 선택 이벤트 -------------- */
const onVendSelected = val => {
  updateDate()
  const saveParams = []
  // console.log('vend val',val)
  saveParams.push({
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: val.BSNS_CD,
      DEPT_CD: val.DEPT_CD,
      COMP_CD: val.ASGN_CD,
      OWNER_NM: val.OWNER_NM,
      FROM_DATE: minDate,
      TO_DATE: maxDate,
      YEAR_DATE: searchParams.YEAR_DATE,
      HALF_YEAR: searchParams.HALF_YEAR,
      USER_ID: userStore.userId,
    })
    // 그리드 날짜 범위 지정
  // console.log('saveParams',saveParams)
  
  new saveFlowHelper(vm, t)
      .setQuery(afterAdd,saveParams)
      .setAfter(() => onButtonsClick({ id :'btnSearch' }))
      .showMessage(false)
      .run()
}

const updateDate = () => {
  // 상반기 선택 작년 12 ~ 금년 5월
  if(searchParams.HALF_YEAR==='A'){
      
      minDate = (searchParams.YEAR_DATE - 1).toString() + '-12-01'
      maxDate = searchParams.YEAR_DATE.toString() + '-05-31'
    }// 하반기 선택
    else if(searchParams.HALF_YEAR==='B'){
      minDate = searchParams.YEAR_DATE.toString() + '-06-01'
      maxDate = searchParams.YEAR_DATE.toString() + '-11-30'
    }
    console.log('minDate FUNC', new Date(minDate))
    console.log('maxDate FUNC', new Date(maxDate))
  grdMain.value.getGridView().setColumnProperty('FROM_DATE','editor',{
    type: "date",
    datetimeFormat: "yyyy-MM-dd",
    minDate: new Date(minDate),
    maxDate: new Date(maxDate)
  })
  grdMain.value.getGridView().setColumnProperty('TO_DATE','editor',{
    type: "date",
    datetimeFormat: "yyyy-MM-dd",
    minDate: new Date(minDate),
    maxDate: new Date(maxDate)
  })
}

const uploaded = val => {
  onButtonsClick({id:'btnSearch'})
}
const closed = val => {
  // console.log('점검등록 화면이 닫혀써용')
  onButtonsClick({id:'btnSearch'})
}

const bsnsCdChange = e => {
  codeList.DEPT_CD = []
  Promise.all([commonSearchApi({ queryId : 'searchDept3',
   param: { CMPNY_DIV: userStore.cmpnyDiv,
     BSNS_CD: e, 
     USE_DIV: 'Y' } 
    })
  ]).then(res => {
    console.log(res)
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD: '' })
    searchParams.DEPT_CD = ''
  }) 
  // reset()
}

// // 반기 수정
// watch(
//   () => searchParams.HALF_YEAR,
//   (newValue, oldValue) => {
//     // console.log('newval',newValue)
//     if(newValue === ''){
//       grdMain.value.getGridView().columnByName("FROM_DATE").editable = false
//       grdMain.value.getGridView().columnByName("TO_DATE").editable = false
//       grdMain.value.getGridView().columnByName("COMP_TYPE").editable = false
//       grdMain.value.getGridView().columnByName("REMARKS").editable = false
//     }else{
//       grdMain.value.getGridView().columnByName("FROM_DATE").editable = true
//       grdMain.value.getGridView().columnByName("TO_DATE").editable = true
//       grdMain.value.getGridView().columnByName("COMP_TYPE").editable = true
//       grdMain.value.getGridView().columnByName("REMARKS").editable = true
//     }
//   }
// )

onMounted(async () => {
  // 그리드 데이터 바인딩
  const thisMonth = parseInt(dayjs(new Date()).format("MM"))
  if(thisMonth >= 6 && thisMonth <= 11){
    // 하반기
    searchParams.HALF_YEAR = 'B'
  } else{
    // 상반기
    searchParams.HALF_YEAR = 'A'
  }
  await initCodeList()
  onButtonsClick({id:'btnSearch'})
  // console.log('userStore',userStore)
  // console.log('searchParams',searchParams)
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[ 'btnSearch', 'btnUpdate', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <v-sheet style="display: flex; flex-direction: row;">
            <i-select
              :label="$t('년도')"
              label-width="30px"
              width="150px"
              v-model="searchParams.YEAR_DATE"
              :items="codeList.DATE_LIST"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('반기')"
              label-width="40px"
              width="200px"
              v-model="searchParams.HALF_YEAR"
              :items="codeList.HALF_YEAR"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('사업부')"
              label-width="40px"
              width="200px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              @update:modelValue="bsnsCdChange"
            />
            
            <i-select
              :label="$t('부서')"
              label-width="40px"
              width="250px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
            />
          </v-sheet>
          <!-- <v-sheet style="width: -webkit-fill-available; display: flex; align-items: center; flex-direction: row-reverse;
          padding-right: 10px;">
            <h3> &nbsp;파일 첨부 또는 직접 입력 1택</h3>
            <v-icon icon="mdi-alert-rhombus-outline" size="28"></v-icon>
          </v-sheet> -->
          
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet height="100%" class="mb-3">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellItemClicked="onVendCellItemClicked"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서검색 팝업 -->
    <!-- <DeptPopup ref="deptPopup" @selected="onDeptSelected" /> -->
    <!-- 협력사검색 팝업 -->
    <!-- pdf파일 UPLOAD 팝업 -->
    <IUploadPopup
      ref="fileUploadPopup"
      @uploaded="uploaded"
      :buttonList="['btnFileUpload','btnDownLoad', 'btnDelete', 'btnClose']"
      :autoUpload="true"
      :img-only=true
      />
    <RegisterPopup ref="registerPopup" @closed="closed"/>
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
    min-height: 635px;
  }
}
</style>
