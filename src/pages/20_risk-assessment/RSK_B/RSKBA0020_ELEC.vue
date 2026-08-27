
<!-- 
  화면명   : 작업표준/위험성평가 현황 (일렉용)
  화면개요 : 위험성평가 현황 조회 및 개정
-->

<script setup>
import { commonSearchApi, commonRequest3, commonExecuteApi, getCodeList, getCompanyList,commonExecuteApi2, commonExcelWrkDetailApi, commonRskApi } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance, onActivated } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n }      from 'vue-i18n'
import { useRouter }    from 'vue-router'
import queryFlowHelper  from '@/utils/searchFlowHelper'
import RSKBA0020Popup1  from '../RSK_B/RSKBA0020Popup1.vue'
import RSKBA0020Popup2  from '../RSK_B/RSKBA0020Popup2.vue'
import RSKBA0020Popup3  from '../RSK_B/RSKBA0020Popup3.vue'
import RSKBA0020popup  from '../RSK_B/RSKBA0020popup.vue'
import OZReport   from '@/components/OZReport.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel     from '@/components/ILabel.vue'
import RealGrid   from '@/components/RealGrid.vue'
import Message    from '@hiway/utils/notify'
import dayjs      from 'dayjs'
import _          from 'lodash'
import { useCommonStore } from '@hiway/stores/common'


defineOptions({
  name:'20_risk-assessment-RSK_B-RSKBA0020',
})

// ------------------------- Variable ------------------------- //

const router = useRouter()
const commonStore = useCommonStore()

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const t = useI18n().t                 //다국어
const menuTitle = ref(null)
const searchArea = ref(null)

// 안전사고 팝업
const rRSKBA0020Popup1 = ref(null)
// 교육이수자 확인 팝업
const rRSKBA0020Popup2 = ref(null)
// 위험성평가 수준평가 팝업
const rRSKBA0020Popup3 = ref(null)
// 위험성 평가 설명 팝업
const rRSKBA0020popup = ref(null)

const grdMain = ref(null)
const grdSub = ref(null)

let useRevision = ref(false)

let flag       = ref(1)
let mainData   = ref(null)
let filterData = ref(null)

let d = new Date()

//조회조건
let searchParams = reactive({    
  COMPANY_CD:  userStore.cmpnyDiv, // 회사명
  BSNS_CD:    userStore.bsnsCd,                 // 사업부
  DEPT_CD:    userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,                 // 부서
  PARTNER_CD: '',                 // 협력사
  PROGRESS_STATUS: '5',           // 진행상태
  RISK_TYPE:  '',                 // 평가유형
  TEXT:       '',                 // 검색
  YEAR : dayjs().year(),
  HALF : (dayjs().get("month") + 1) <= 6 ? '1' : '2',
  USR_ID: userStore.userId,
})

// 코드리스트
const codeList = reactive({
  COMPANY_CD:  [],
  BSNS_CD:     [],
  DEPT_CD:     [],
  PARTNER_CD:  [],
  PROGRESS_STATUS: [],
  RISK_TYPE:   [],
  WORK_STANDARD_EVAL_LIST:   [],
  /* 반기 */
  harfList: [
    {COD: '1' , TXT: '상반기'},
    {COD: '2' , TXT: '하반기'},
  ]
})

// 오즈리포트
const reportName = ref(null)
// IN Parameters [ "PARAM1='AA'", "PARAM2='BB'"]
const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)


//그리드 속성셋팅
const grdProps = reactive({
  gridViewOption : { checkBar: { visible: true }, display: { selectionStyle: 'rows', useFocusClass: true}, header: { height: 50 } },
  keys: ['WORK_STANDARD_ID'],
  fields: [ 
    { fieldName: 'GUBUN_NM', dataType: 'text', width: '180', styleName: 'left-column', header: { text: t('분류') }, editable : false },
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', width: '200', styleName: 'left-column', header: { text: t('작업표준명') }, editable : false },
    { fieldName: 'DEPT_NM',  dataType: 'text', width: '120', styleName: 'left-column', header: { text: t('소속') }, editable : false },
    { fieldName: 'DEPT_CD',  dataType: 'text', width: '120', styleName: 'left-column', header: { text: t('소속코드') }, visible : false },
    { fieldName: 'USER_NM',  dataType: 'text', width: '80', header: { text: t('작성자') }, editable : false },
    { fieldName: 'PRODUCTION_MANAGER',  dataType: 'text', width: '80', header: { text: t('담당자'), styleName: 'multiline-editor-pre' }, editable : false },
    { fieldName: 'POSITION_MANAGER',    dataType: 'text', width: '80', header: { text: t('직책과장') }, editable : false },
    { fieldName: 'MIN_DT',   dataType: 'text', width: '100', header: { text: t('제정일자') }, editable : false },
    { fieldName: 'MAX_DT',   dataType: 'text', width: '100', header: { text: t('개정일자') }, editable : false },
    { fieldName: 'WORK_STANDARD_KIND_NM',    dataType: 'text', width: '100', header: { text: t('구분') }, editable : false },
    { fieldName: 'APPR_STATUS',  dataType: 'text', width: '100', header: { text: t('진행상태') }, editable : false },
    { fieldName: 'RISK_TYPE_NM', dataType: 'text', width: '130', header: { text: t('평가유형') }, button: 'action',
      // styleCallback: function (grid, dataCell) {
      //   let ret = {}        
      //   var rnm = grid.getValue(dataCell.index.itemIndex, "RISK_TYPE_NM");
        
      //   ret.renderer = rnm == '수시(안전사고)' ? {type:"button"} : {};
      //   return ret
      // },
      buttonVisibleCallback : function(grid, index, focused, mouseEntered) {
        return grid.getValue(index.itemIndex, "RISK_TYPE_NM") === "수시(안전사고)"
      },
      editable: false },
    { fieldName: 'WORK_STANDARD_ACT_COUNT',  dataType: 'text', width: '70', styleName: 'right-column', header: { text: t('작업행동') }, editable : false },
    { fieldName: 'WORK_STANDARD_RISK_COUNT', dataType: 'text', width: '70', styleName: 'right-column', header: { text: t('위험요인') }, editable : false },
    { fieldName: 'WORK_STANDARD_RISK_OVER_COUNT', dataType: 'text', width: '70', styleName: 'right-column', header: { text: t('중요위험') }, editable : false },
    { fieldName: 'WORK_STANDARD_AVG_RISK',   dataType: 'text', width: '70', styleName: 'right-column ', header: { text: t('평균\n위험성'), styleName: 'multiline-editor-pre' }, editable : false },
    { fieldName: 'WORK_STANDARD_IMG_COUNT',  dataType: 'text', width: '70', styleName: 'right-column', header: { text: t('사진등록') }, editable : false },
    { fieldName: 'WORK_STANDARD_EVAL_NM', dataType: 'text', width: '120', 
      editable: false,
      // header: { text: t('위험성평가 \n 수준평가'), 
      header: { 
          text: t('위험성평가 \n 수준평가'),
          template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
          values: { headerText: t('위험성평가 \n 수준평가')}
      }, 
      styleCallback: function(grid,dataCell){
        let ret = {}
        let targetData = grid.getValue(dataCell.index.itemIndex, "WORK_STANDARD_EVAL_CD")

        if(targetData == 'X'){
          // 위험성평가 미실시
          ret.styleName = "button-grey"
        }
        else if (targetData == 'H') {
          // 
          ret.styleName = "button-blue"
        }
        else if (targetData == 'M') {
          ret.styleName = "button-orange"
        }
        else if (targetData == 'L') {
          ret.styleName = "button-red"
        }
        else {
          ret.styleName = "button-pink"
        }

        ret.renderer = {
          type:'button',
        }

        return ret
      },
    },
    { fieldName: 'WORK_STANDARD_ID',         dataType: 'text', width: '200', header: { text: t('문서번호') }, editable : false },
    { fieldName: 'EDU',                      dataType: 'text', width: '100', header: { text: t('교육이수자 확인(명)') }, button : 'action', buttonVisibility : 'always', editable : false },
    { fieldName: 'WORK_STANDARD_NO',         dataType: 'text', width: '200', header: { text: t('') }, visible : false },
    // 숨기는 필드    
    { fieldName: 'PROGRESS_STATUS', dataType: 'text', width: '100', header: { text: t('진행상태') }, visible : false },
    { fieldName: 'ORGN_DIV', dataType: 'text', width: '100', header: { text: t('직영/협력사 구분') }, visible : false },
    { fieldName: 'WORK_STANDARD_EVAL_CD', dataType: 'text', width: '100', header: { text: t('수준평가 결과 코드') }, visible : false },
  ],
  columns : [],
})

grdProps.columns = grdProps.fields



// ------------------------- Method ------------------------- //

// 그리드 셀 버튼 클릭시
const onCellButtonClicked = (grid, index, column) => {
  
  // console.log('index =' + index.itemIndex + ' fieldName =' + column.fieldName)

  //let value = grid.getValue(index.itemIndex, column.fieldName)
  //console.log('value = ', value)
  
  let focusedRow = grdMain.value.getFocusedRowData()

  if(column.fieldName == 'RISK_TYPE_NM')
  {
    openPopup('SAGO', focusedRow.WORK_STANDARD_ID)
  }
  else if(column.fieldName == 'EDU')
  {
    openPopup('EDU', focusedRow.WORK_STANDARD_ID)
  }

  //return true
}

let _clickData
// 셀 클릭 이벤트
const onCellClicked = (grid, clickData) => {

  // 폐지된 작업표준 복사할 때, 선택된 row 찾기 위해서 처리
  _clickData = clickData

  // 직영인 경우 DEPT_CD, 협력사인 경우 ASGN_CD
  let deptCode = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd
  let rowData = grdMain.value.getFocusedRowData()

  // 진행상태가 결재완료인 경우에만 개정(위험성평가) 버튼 활성화
  if(clickData.column === 'WORK_STANDARD_EVAL_NM' && clickData.cellType === 'header' ){
    console.log('hahahah click')
    openPopup('EVAL', '')
  }
  else if(rowData.PROGRESS_STATUS == 'CC_AC' || rowData.PROGRESS_STATUS == 'UC_AC' || rowData.PROGRESS_STATUS == 'DC_AC')
  {
    //menuTitle.value.setBtnProperty('btnAssessment', 'text', '안전사고 위험성평가 : ' + filterData.length + '건')
    if(searchParams.DEPT_CD === deptCode || searchParams.PARTNER_CD === deptCode)
    {
      menuTitle.value.disableBtn('btnRevision', false)
    }
  }
  else
  {
    menuTitle.value.disableBtn('btnRevision', true)
  }
}


const onCellItemClicked = (grid, index, col) => {
  console.log('clickData = ', col)
  //_clickData = clickData
  // console.log(clickData.value + "버튼 클릭")  

  if(col.fieldName === 'WORK_STANDARD_EVAL_NM') {
    let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)

    if(data.WORK_STANDARD_EVAL_CD === 'X') {
      return Message.err("위험성평가 실시 후 결재 완료 건만 평가 가능합니다.")  
    } else {
      openPopup('EVAL_ACT', data)
    }
  }

  return true
}

// 로우 더블 클릭시, 해당 위험성평가의 세부내용을 작업표준 신규제정에서 열람
const onCellDblClicked = (grid, clickData) => {
  const focusedRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  // let status = focusedRow.PROGRESS_STATUS

  commonStore.loading = true
  
  window.sessionStorage.setItem('WORK_TYPE', 'E')
  window.sessionStorage.setItem('PROGRESS_STATUS', focusedRow.PROGRESS_STATUS)
  window.sessionStorage.setItem('WORK_STANDARD_ID', focusedRow.WORK_STANDARD_ID)
  router.push('/20_risk-assessment/RSK_B/RSKBA0010_ELEC')

  return true
}

const openPopup = (gubun, param) => {

  if(gubun == 'SAGO')
  {
    rRSKBA0020Popup1.value.openPopup({
      WORK_STANDARD_ID : param
    })
  }
  else if(gubun == 'EDU')
  {
    rRSKBA0020Popup2.value.openPopup({
      WORK_STANDARD_ID : param
    })
  }
  else if(gubun == 'EVAL')
  {
    rRSKBA0020popup.value.openPopup()
  }
  else if(gubun == 'EVAL_ACT')
  {
    rRSKBA0020Popup3.value.openPopup({
      data : param
    })
  }

  //rRSKBA0020Popup1.value.dialog = true
  //console.log('dialog = ', rRSKBA0020Popup1.value.dialog)
}

//코드리스트 셋팅
const initCodeList = async () => {
  
  await Promise.all([
    // 회사
    getCompanyList(),
    
    // 사업부
    commonSearchApi({ 
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv,
        USE_DIV: 'N',
      }, 
    }),
    
    getCodeList('HHIORISK_TYPE', 'HHI', 'Y', '0', null, 'N')

  ]).then(async res => {
    
    // console.log('res[2]::', res[2].ORESULT_CUR)
    codeList.COMPANY_CD = res[0].ORESULT_CUR  // 회사
    codeList.BSNS_CD    = res[1].ORESULT_CUR  // 사업부
    
    await setDeptList(userStore.bsnsCd)
    await setPartnerList(userStore.deptCd)
    codeList.PROGRESS_STATUS = [{ COD : '1', TXT : '결재완료'},
                                { COD : '2', TXT : '결재중'},
                                { COD : '3', TXT : '작성/평가중'},
                                { COD : '4', TXT : '폐지'},
                                { COD : '5', TXT : '반기전체'},]
    codeList.RISK_TYPE  = res[2].ORESULT_CUR
  
    // 평가유형에 전체 항목 추가
    codeList.RISK_TYPE.unshift({ COD : '', TXT : '전체' })

    if(window.history.state.data){
      let data = await window.history.state.data

      searchParams.COMPANY_CD = data.COMP_CD
      searchParams.BSNS_CD = data.BSNS_CD
      searchParams.DEPT_CD = data.DEPT_CD

      commonStore.loading = false
      onButtonsClick({id: 'btnSearch'})
    }
  })
}

// 조회
const searchData = () => {
  // console.log('searchParams', searchParams)
  return commonSearchApi({ queryId : 'RSKBA0020_SEARCH01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  mainData = res.ORESULT_CUR
  filterData = res.ORESULT_CUR.filter(row => row.RISK_TYPE == 'RISK_TYPE-02')

  // 수시(안전사고)의 데이터 갯수만큼 처리
  menuTitle.value.setBtnProperty('btnAssessment', 'text', '안전사고 위험성평가 : ' + (filterData.length == undefined ? '0' : filterData.length + '건'))
}

// 출력 버튼 클릭시
const onOzPrint = () => {

  let rowData = grdMain.value.getFocusedRowData()

  reportName.value = '/manage/hse/RSKBA0010.ozr'
  params.value = ['IN_WORK_STANDARD_ID=' + rowData.WORK_STANDARD_ID]

  //console.log('pValue = ', params.value)

  showOz.value = true
}

const excelDownload = () => {
  grdMain.value.getGridView().exportGrid({
    // type: 'csv',

    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '위험성평가 현황.xlsx', // 저장될 파일 name
    documentTitle: { //제목
      message: "위험성평가 현황",
      visible: true,
      spaceTop: 1,
      spaceBottom: 0,
      height: 50,
      styleName: "excelTitle",
    },
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
    indicator: 'visible', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'hidden', // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    //showColumns: 'WORK_STANDARD_NM',
    //hideColumns: ['WORK_STANDARD_ID' ],
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })
}
//위험성평가 조회
const standardsearch = async ()=>{
  grdMain.value.getGridView().filterPanel.clearInput()
    
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()

      let deptCode = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd

      //console.log('PROGRESS_STATUS = ', codeList.PROGRESS_STATUS)
      // 1: 결재완료 2: 결재중 3: 작성/평가중 4: 폐지
      // 직영인 경우 DEPT_CD와 비교, 협력사인 경우 PARTNER_CD와 비교
      if(searchParams.PROGRESS_STATUS == '1' && (searchParams.DEPT_CD == deptCode || searchParams.PARTNER_CD == deptCode))
      {
        menuTitle.value.disableBtn('btnRevision', false)
        //menuTitle.value.disableBtn('btnStandardEval', false)
        menuTitle.value.disableBtn('btnDelete', true)
      }
      else if(searchParams.PROGRESS_STATUS == '2' && (searchParams.DEPT_CD == deptCode || searchParams.PARTNER_CD == deptCode))
      {
        menuTitle.value.disableBtn('btnDelete', true)
      }
      else
      {
        menuTitle.value.disableBtn('btnRevision', true)
        //menuTitle.value.disableBtn('btnStandardEval', true)
        menuTitle.value.disableBtn('btnDelete', false)
      }

      if(searchParams.PROGRESS_STATUS == '4')
        // 작업표준복사 버튼 숨기기
        menuTitle.value.setBtnProperty('btnWorkStandardCopy', 'visible', true)
      else
        menuTitle.value.setBtnProperty('btnWorkStandardCopy', 'visible', false)
}
//평가 저장
const standardDelete = async () => {

  let checkedRows = grdMain.value.getGridView().getCheckedRows();
  let saveParams = [];

  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 항목이 없습니다.'));
  }
  // else if(checkedRows.length > 1){
  //   return Message.warn(t('삭제는 한개만 선택해 주십시오.'));
  // }

  // 선택된 로우 데이터를 수집
  for (let i of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(i);
    saveParams.push({
      WORK_STANDARD_ID: data.WORK_STANDARD_ID,
    });
  }

  // 사용자에게 확인 메시지 표시
  vm.$swal({
    title: t('선택된 항목을 삭제 하시겠습니까?'),
    showCancelButton: true,
  }).then(async ck => {
    if (ck.isConfirmed) {
      try {
        // 선택된 항목을 저장
        for (let param of saveParams) {
          let res = await commonExecuteApi2({
            queryId: 'RSKBA0010_DELETE_WORK_STANDARD',
            list: [{  // "param"으로 데이터 전달
              WORK_STANDARD_ID:  String(param.WORK_STANDARD_ID),
            }]
          });
        }

        //check 해제
        uncheckGridRows()
        // 성공 메시지 표시 및 후속 처리
        Message.success(t('삭제 되었습니다.'));
        standardsearch()

      } catch (err) {
        Message.warn(err.message || t('삭제 중 오류가 발생했습니다.'));
      }
    }
  });
};

//평가 저장
const standardEval = async () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows();
  let saveParams = [];

  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 항목이 없습니다.'));
  }

  // 선택된 로우 데이터를 수집
  for (let i of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(i);
    saveParams.push({
      WORK_STANDARD_ID: data.WORK_STANDARD_ID,
      WORK_STANDARD_EVAL: data.WORK_STANDARD_EVAL
    });
  }

  // 사용자에게 확인 메시지 표시
  vm.$swal({
    title: t('선택된 항목에 대해서 위험성 평가 수준평가를 완료 하시겠습니까?'),
    showCancelButton: true,
  }).then(async ck => {
    if (ck.isConfirmed) {
      try {
        // 선택된 항목을 저장
        for (let param of saveParams) {
          let res = await commonExecuteApi2({
            queryId: 'RSKBA0020_WORK_STANDARD_MASTER_EVAL_U',
            list: [{  // "param"으로 데이터 전달
              WORK_STANDARD_ID:  String(param.WORK_STANDARD_ID),
              WORK_STANDARD_EVAL:  String(param.WORK_STANDARD_EVAL)
            }]
          });
        }

        //check 해제
        uncheckGridRows()
        // 성공 메시지 표시 및 후속 처리
        Message.success(t('저장 되었습니다.'));

      } catch (err) {
        Message.warn(err.message || t('저장 중 오류가 발생했습니다.'));
      }
    }
  });
};

//check 해제 기능
const uncheckGridRows = () => {
  let gridView = grdMain.value.getGridView();
  let dataProvider = grdMain.value.getDataProvider();

  // 체크된 모든 행을 가져오기
  let checkedRows = gridView.getCheckedRows();

  // 체크된 행이 없으면 메시지 표시
  if (checkedRows.length === 0) {
  }

  // 모든 체크를 해제
  for (let row of checkedRows) {
    gridView.checkRow(row, false);  // 특정 행의 체크 해제
  }

  // 메시지 표시
};

// ------------------------- Event ------------------------- //

// 사업부 변경 시 부서 변경 이벤트

// watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
//   const data = {
//     queryId: 'searchDept3',
//     param: { CMPNY_DIV : userStore.cmpnyDiv, BSNS_CD : newValue, USE_DIV : 'Y' }
//   }

//   const meta = {
//     useProgress: false
//   }

//   commonRequest3("/hse/common/selectList", data, meta).then(res => {
      
//     codeList.DEPT_CD = res.ORESULT_CUR
      
//     if (!oldValue) {
//       return searchParams.DEPT_CD = userStore.deptCd
//     }
//     if (newValue !== oldValue) {
//       // searchParams.DEPT_CD = ''
//       if(!window.history.state.data){
//         searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD
//       }
//     }
//   })
// },
// {
//   immediate: true,
// }
// )

// let acnt = 0
// let callCnt = 0
// // 부서가 바뀌면 협력사 데이터 가져옴
// watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {

//   console.log('call = ', ++callCnt)
//   console.log(callCnt + ' searchParams.DEPT_CD = ', searchParams.DEPT_CD)
//   console.log(callCnt + ' searchParams.ASGN_CD = ', searchParams.PARTNER_CD)

//   console.log(callCnt + ' newValue = ', newValue)
//   console.log(callCnt + ' oldValue = ', oldValue)

//   const data = {
//     queryId: 'searchVend'
//     , param: { CMPNY_DIV : userStore.cmpnyDiv, BSNS_CD : searchParams.BSNS_CD, DEPT_CD : newValue }
//   }

//   const meta = {
//     useProgress: false
//   }

//   commonRequest3("/hse/common/selectList", data, meta).then(res => {
      
//       codeList.PARTNER_CD = res.ORESULT_CUR
//       codeList.PARTNER_CD.unshift({ ASGN_CD: '', ASGN_NM: '선택안함' })
      
//       if (codeList.PARTNER_CD.length !== 0) {
//         searchParams.PARTNER_CD = ''
        
//         /*
//         if(userStore.userDiv == 'B' && acnt == 0)
//         {
//           searchParams.PARTNER_CD = userStore.asgnCd
//           acnt++
//         }
//         */
//       }

//       if(window.history.state.data){
//         codeList.PARTNER_CD.forEach(e => {
//           if(window.history.state.data.CORP_NM && window.history.state.data.CORP_NM === e.ASGN_NM){
//             searchParams.PARTNER_CD = e.ASGN_CD
//           }
//         })
//       }
//     })
// },
// {
//   immediate: true,
// })

// 검색 컴포넌트 내용 삭제
const clearSearch = () => {
  searchParams.TEXT = ''
}

// 상단 버튼 클릭시
const onButtonsClick = async btn => {
  
  // 안전사고 위험성평가
  if (btn.id === 'btnAssessment') {
    let data = grdMain.value.getDataProvider().getJsonRows()
    //console.log('data = ', data)

    // let filtered = _.filter(data, item => {
    //   return item.WORK_STANDARD_RISK_OVER_COUNT > 0
    // })

    // grdMain.value.getDataProvider().setRows(filtered)

    if(flag.value == 1){
      grdMain.value.getDataProvider().setRows(filterData)
      flag.value = 2
      menuTitle.value.setBtnProperty('btnAssessment', 'text', '원래대로')
    }
    else if (flag.value == 2){
      grdMain.value.getDataProvider().setRows(mainData)
      flag.value = 1
      
      if(filterData.length == undefined)
        console.log('0건')
      else
        console.log('asdasdasd')
      menuTitle.value.setBtnProperty('btnAssessment', 'text', '안전사고 위험성평가 : ' + (filterData.length == undefined ? '0' : filterData.length) + '건')
    }
  }
  // 조회
  else if (btn.id === 'btnSearch') {
    standardsearch()
    // grdMain.value.getGridView().filterPanel.clearInput()
    
    // new queryFlowHelper(vm, t)
    //   .setGridList([grdMain])
    //   .setQuery(searchData)
    //   .setAfter(afterSearch)
    //   .run()

    //   let deptCode = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd

    //   //console.log('PROGRESS_STATUS = ', codeList.PROGRESS_STATUS)
    //   // 1: 결재완료 2: 결재중 3: 작성/평가중 4: 폐지
    //   // 직영인 경우 DEPT_CD와 비교, 협력사인 경우 PARTNER_CD와 비교
    //   if(searchParams.PROGRESS_STATUS == '1' && (searchParams.DEPT_CD == deptCode || searchParams.PARTNER_CD == deptCode))
    //   {
    //     menuTitle.value.disableBtn('btnRevision', false)
    //     menuTitle.value.disableBtn('btnStandardEval', false)
    //     menuTitle.value.disableBtn('btnDelete', true)
    //   }
    //   else
    //   {
    //     menuTitle.value.disableBtn('btnRevision', true)
    //     menuTitle.value.disableBtn('btnStandardEval', true)
    //     menuTitle.value.disableBtn('btnDelete', false)
    //   }

    //   if(searchParams.PROGRESS_STATUS == '4')
    //     // 작업표준복사 버튼 숨기기
    //     menuTitle.value.setBtnProperty('btnWorkStandardCopy', 'visible', true)
    //   else
    //     menuTitle.value.setBtnProperty('btnWorkStandardCopy', 'visible', false)
      
  }
  // 작업표준복사
  else if(btn.id === 'btnWorkStandardCopy') {

    let dialogResult = await vm.$swal({ 
      title: t('선택한 작업표준을 복사(복구) 하시겠습니까?'), 
      showCancelButton: true,
    })
      
    if(!dialogResult.isConfirmed)
      return
    console.log('_clickData2 = ', _clickData)
    //let focusedRow = grdMain.value.getFocusedRowData()
    // const focusedRow = grdMain.value.getDataProvider().getJsonRow(_clickData.dataRow)
    let focusedRow = grdMain.value.getGridView().getCheckedRows();

    if (focusedRow.length === 0) {
      return Message.warn(t('개정할 row를 선택해 주세요'));
     }else if (focusedRow.length>1){
      return Message.warn(t('한개만 체크 하거나 선택해 주세요'));
    }

    let listParam = [{
      WORK_STANDARD_ID: focusedRow.WORK_STANDARD_ID,
      WORK_STANDARD_NM: '(복구)' + focusedRow.WORK_STANDARD_NM,
      DEPT_CD: focusedRow.DEPT_CD,
      USR_ID: userStore.userId
    }]
    
    // 직영인 경우 DEPT_CD, 협력사인 경우 ASGN_CD
    let deptCode = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd
    let upDeptCd = userStore.userDiv === 'B' ? userStore.deptCd : ''
    commonRskApi({ 
      queryId: "RSKBA0010_SAVE_05",
      UP_DEPT_CD: upDeptCd,
      DEPT_CD: deptCode,
      USR_ID: userStore.userId,
      list: listParam,
    }).then(res =>{
      Message.success(t('작업표준 복사(복구) 완료 되었습니다.'))
    })

    /*
    commonExecuteApi({
      queryId: 'RSKBA0010_SAVE_05',
      list: listParam
    }).then(res => {
      console.log('res = ', res)
      
      Message.success(t('###########################.')) 
    })*/
  }
  // 신규
  else if (btn.id === 'btnNew') {
    
    commonStore.loading = true

    window.sessionStorage.setItem('WORK_TYPE', 'C')
    // 일렉 작업표준 제정으로 변경함 (2024.12.07)
    router.push('/20_risk-assessment/RSK_B/RSKBA0010_ELEC')
  }

  // 개정(위험성평가)
  else if (btn.id === 'btnRevision') {

    commonStore.loading = true
    let gridView2 = grdMain.value.getGridView();
    let checkedrow = gridView2.getCheckedRows();
    let rowData=grdMain.value.getDataProvider().getJsonRow(checkedrow);

    if (rowData.length === 0) {
      return Message.warn(t('개정할 row를 선택해 주세요'));
     }else if (rowData.length>1){
      return Message.warn(t('한개만 체크 하거나 선택해 주세요'));
    }
      

    window.sessionStorage.setItem('WORK_TYPE', 'U')
    window.sessionStorage.setItem('WORK_STANDARD_ID', rowData.WORK_STANDARD_ID)
    window.sessionStorage.setItem('WORK_STANDARD_NO', rowData.WORK_STANDARD_NO)
    
    // T_CSX02_WORK_STANDARD_MASTER의 DEPT_CD는 직영인 경우 DEPT_CD, 협력사인 경우 ASGN_CD 들어가고 있음
    window.sessionStorage.setItem('DEPT_CD', rowData.DEPT_CD)
    router.push('/20_risk-assessment/RSK_B/RSKBA0010')
    
  }
  else if (btn.id === 'btnDelete'){
    standardDelete()
  }
  else if (btn.id === 'btnSimplePrint') {
    let gridView2 = grdMain.value.getGridView();
    let checkedrow = gridView2.getCheckedRows();
    let rowData=grdMain.value.getDataProvider().getJsonRow(checkedrow);
    // let rowData = grdMain.value.getGridView().getCheckedRows();

    if (rowData.length === 0) {
      return Message.warn(t('개정할 row를 선택해 주세요'));
     }else if (rowData.length>1){
      return Message.warn(t('한개만 체크 하거나 선택해 주세요'));
    }

    if (rowData == null || rowData == undefined) {
      return Message.warn(t('출력할 데이터가 없습니다.'))
    }

    commonExcelWrkDetailApi({ 
      mappingName: 'work_detail',
      IN_EXCEL_TYPE: 'SIMPLE',

      IN_TRANS: 'ko',
      IN_WORK_STANDARD_ID: rowData.WORK_STANDARD_ID,
      IN_USER_DIV: rowData.ORGN_DIV === 'A'?'A':'B',
      // IN_TRANS: WORK_STANDARD_MASTER.IN_TRANS,
    }).then(res => {

      //console.log('res : ', res)

      const fileURL = URL.createObjectURL(
        new Blob([res], {
          type: 'application/octet-stream',
        }),
      )

      let title =
        '[위험성평가]' +
        rowData.WORK_STANDARD_NM +
        '(' +
        rowData.DEPT_NM +
        ')_' +
        d.getFullYear() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d
          .getDate()
          .toString()
          .padStart(2, '0') +
        '_' +
        '요약본'

      var fileLink = document.createElement('a')

      fileLink.href = fileURL
      fileLink.setAttribute('download', title + '.xlsx')
      document.body.appendChild(fileLink)
      fileLink.click()
    })
  }

  else if (btn.id === 'btnDetailPrint') {
    
    let gridView2 = grdMain.value.getGridView();
    let checkedrow = gridView2.getCheckedRows();
    let rowData=grdMain.value.getDataProvider().getJsonRow(checkedrow);

    if (rowData.length === 0) {
      return Message.warn(t('개정할 row를 선택해 주세요'));
     }else if (rowData.length>1){
      return Message.warn(t('한개만 체크 하거나 선택해 주세요'));
    }

    if (rowData == null || rowData == undefined) {
      return Message.warn(t('출력할 데이터가 없습니다.'))
    }

    commonExcelWrkDetailApi({ 
      mappingName: 'work_detail',
      IN_EXCEL_TYPE: 'STD',

      IN_TRANS: 'ko',
      IN_WORK_STANDARD_ID: rowData.WORK_STANDARD_ID,
      IN_USER_DIV: rowData.ORGN_DIV === 'A'?'A':'B',
      // IN_TRANS: WORK_STANDARD_MASTER.IN_TRANS,
    }).then(res => {


      const fileURL = URL.createObjectURL(
        new Blob([res], {
          type: 'application/octet-stream',
        }),
      )

      let title =
        '[위험성평가]' +
        rowData.WORK_STANDARD_NM +
        '(' +
        rowData.DEPT_NM +
        ')_' +
        d.getFullYear() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d
          .getDate()
          .toString()
          .padStart(2, '0') +
        '_' +
        '상세본'

      var fileLink = document.createElement('a')

      fileLink.href = fileURL
      fileLink.setAttribute('download', title + '.xlsx')
      document.body.appendChild(fileLink) 
      fileLink.click()
    })

  }

  // 출력 (오즈리포트)
  //else if (btn.id === 'btnPrint') {
  //  onOzPrint()    
  //}

  // 엑셀 다운로드
  else if (btn.id === 'btnListPrint') {
    excelDownload()
  }
  /*else if (btn.id === 'btnStandardEval') {
    standardEval()
  }*/
}

// 평균위험성이 8이상인 경우 로우 색상 처리
const customGridStyle = () => {

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}
    let value = grid.getValue(item.index, "WORK_STANDARD_AVG_RISK")

    //console.log('value = ', value)

    if(value >= 8){
      ret.style = { background: "rgb(255,167,167)" }
      //console.log('a')
      //grdMain.value.getGridView().setDisplayOptions({ useFocusClass: false })
    }
    else {
      //grdMain.value.getGridView().setDisplayOptions({ useFocusClass: false })
      // ret.style = { background: "rgb(255,193,158)" }
      //ret = 'orange-color'
      //console.log('b')
    }

    return ret
  })
}

router.afterEach(async (to, from, next) => {
  if(from.path === '/20_risk-assessment/RSK_A/RSKAB0010'){
    
    let data = await window.history.state.data
    searchParams.COMPANY_CD = data.COMP_CD
    searchParams.BSNS_CD = data.BSNS_CD
    searchParams.DEPT_CD = data.DEPT_CD
    searchParams.YEAR = data.YEAR
    searchParams.HALF = data.HALF

    commonStore.loading = false
    onButtonsClick({id: 'btnSearch'})
  }
})

// 로그인한 유저의 정보 세팅
const setSearchParam = async () => {
  
  searchParams.DEPT_CD = userStore.deptCd

  // 협력사인 경우에만 협력사 코드 세팅 
  if(userStore.userDiv == 'B')
    searchParams.PARTNER_CD = userStore.asgnCd
}

// 부서 세팅
const setDeptList = async (bsnsCd) => {

  await commonSearchApi({ 
      queryId : 'searchDept3', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: bsnsCd,
        USE_DIV: 'Y',
      }
    },
    {
      useProgress: false
    }
  ).then(async res => {
      codeList.DEPT_CD = res.ORESULT_CUR
      searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD

      // 부서 리스트 바뀔 때, 최상단으로 선택된 부서를 협력사 조회조건으로 전달
      await setPartnerList(searchParams.DEPT_CD)
    }
  )
}

// 협력사 세팅
const setPartnerList = async (deptCd) => {  
  await commonSearchApi({ 
      queryId : 'searchVend', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        DEPT_CD: deptCd,
        USE_DIV: 'Y',
      } 
    },
    {
         useProgress: false
    }
  ).then(async res => {
      // 협력사 바인딩, 최상단에 선택안함 추가하기
      codeList.PARTNER_CD = res.ORESULT_CUR
      codeList.PARTNER_CD.unshift({ ASGN_CD: '', ASGN_NM: '선택안함' })
      searchParams.PARTNER_CD = ''
    }
  )
}

//팝업 닫혔을때 재조회
const closedPopup = () => {
  console.log('closedPopup?')  
  onButtonsClick({ id: 'btnSearch' })
}

const onLoad = async () => {
  console.log('userStore = ', userStore)
  // 조회조건 세팅
  await initCodeList()  
  
  // 로그인한 유저 정보 세팅
  await setSearchParam()

  grdMain.value.getGridView().filterPanel.visible = true
  //grd1.value.getGridView().filterPanel.clearInput()
}

onMounted(async () => {
  await onLoad()
  
  // 사업부 전체 추가
  //codeList.BSNS_CD.unshift({ BSNS_NM : '전체', BSNS_CD : '' })

  // searchParams.BSNS_CD = userStore.bsnsCd
  // searchParams.DEPT_CD = userStore.asgnCd

  // 안전사고 위험성평가 버튼 텍스트 변경
  menuTitle.value.setBtnProperty('btnAssessment', 'text', '안전사고 위험성평가 : 0건 ')
  // 작업표준복사 버튼 숨기기
  menuTitle.value.setBtnProperty('btnWorkStandardCopy', 'visible', false)
  
  

  // 개정(위험성평가) 버튼 비활성화
  menuTitle.value.disableBtn('btnRevision', true)
  //위험성평가 최종평가 버튼 비 활성화
  //menuTitle.value.disableBtn('btnStandardEval', true)
  //위험성평가 삭제 버튼 비 활성화
  menuTitle.value.disableBtn('btnDelete', true)

  // 조건에 따라 그리드 색상 변경
  customGridStyle()
  // focus 기능 제거
  grdMain.value.getGridView().setDisplayOptions({ useFocusClass: false })

  // 그리드 콤보박스 추가
  /*codeList.WORK_STANDARD_EVAL_LIST = [{ COD : null, TXT : '미평가'},
    { COD : '1', TXT : '상'},
    { COD : '2', TXT : '중'},
    { COD : '3', TXT : '하'},]
  */
  //grdMain.value.setBindingColumn('WORK_STANDARD_EVAL', codeList.WORK_STANDARD_EVAL_LIST, 'COD', 'TXT')

  // 부서별 위험성평가 대시보드에서 작업표준 클릭 시 넘어오는 데이터
  if (window.history.state.data) {
    for (let i in window.history.state.data) {
      searchParams[i] = window.history.state.data[i]
    }
    onButtonsClick({id: 'btnSearch'})
  }
})

onActivated(() => {
  let sRSKBA0020_RELOAD = window.sessionStorage.getItem('RSKBA0020_RELOAD')
  if(sRSKBA0020_RELOAD === 'Y') {
    window.sessionStorage.removeItem('RSKBA0020_RELOAD')
    onButtonsClick({id: 'btnSearch'})
  }
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
  
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnAssessment', 'btnSearch', 'btnWorkStandardCopy', 'btnNew', 'btnRevision', 'btnDelete', 'btnSimplePrint', 'btnDetailPrint', 'btnListPrint']"
        @click-button="onButtonsClick"
      />  
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <!-- 회사 -->
          <i-select
            :label="$t('회사')"
            v-model="searchParams.COMPANY_CD"
            :items="codeList.COMPANY_CD"
            item-value="COD"
            item-title="TXT"
            readonly
            label-width="55px"
            width="250px"
          />
          <!-- 사업부 -->
          <i-select
            :label="$t('사업부')"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            label-width="45px"
            width="250px"
            @update:modelValue="e => setDeptList(e)"
          />
          <!-- 부서 -->
          <i-select
            :label="$t('부서')"
            v-model="searchParams.DEPT_CD"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
            label-width="30px"
            width="250px"
            @update:modelValue="e => setPartnerList(e)"
          />
          <!-- 진행상태 -->
          <i-select
            :label="$t('진행상태')"
            v-model="searchParams.PROGRESS_STATUS"
            :items="codeList.PROGRESS_STATUS"
            item-value="COD"
            item-title="TXT"
            width="200px"
          />
          <!-- 협력사 -->
          <i-select
            :label="$t('협력사')"
            v-model="searchParams.PARTNER_CD"
            :items="codeList.PARTNER_CD"
            item-value="ASGN_CD"
            item-title="ASGN_NM"
            label-width="40px"
            width="300px"
          />
          <!-- 평가유형 -->
          <i-select
            :label="$t('평가유형')"
            v-model="searchParams.RISK_TYPE"
            :items="codeList.RISK_TYPE"
            item-value="COD"
            item-title="TXT"
            label-width="50px"
            width="200px"
          />
          </div>
          <div class="d-flex mt-2">
            <i-select 
              :label="$t('기준년도')"
              labelWidth="55px"
              width="250px"
              type="YEAR"
              v-model="searchParams.YEAR"
            />
            <i-select 
              :label="$t('반기')"
              labelWidth="45px"
              width="250px"
              :items="codeList.harfList"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.HALF"
            />
            <i-input
            :label="$t('검색')"
            labelWidth="35px"
            v-model="searchParams.TEXT"
            clearable
            label-width="30px"
            width="470px"
            @keydown.enter="e=>{ onButtonsClick({id : 'btnSearch'}) }"
            @click:clearable="clearSearch"
          /> 
          </div>
        </v-sheet>
        <v-sheet height="50%">
          <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: calc(100vh - 300px);"
              :grid-view-option="grdProps.gridViewOption"
              :keys="grdProps.keys" 
              :fields="grdProps.fields"
              :columns="grdProps.columns"
              :column-layout="grdProps.columnLayout"
              @onCellClicked="onCellClicked"
              @onCellButtonClicked="onCellButtonClicked"
              @onCellItemClicked="onCellItemClicked"
              @onCellDblClicked="onCellDblClicked"
            />
        </v-sheet>
      </div>
    </v-card-text>
    
  </v-card>
  <RSKBA0020Popup1 ref="rRSKBA0020Popup1"/>
  <RSKBA0020Popup2 eager
    persistent ref="rRSKBA0020Popup2"/>
  <RSKBA0020Popup3 
    ref="rRSKBA0020Popup3"
    @closePopup="closedPopup"
  />
  <RSKBA0020popup ref="rRSKBA0020popup"/>
  <!-- 출력물 -->
  <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
</template>

<style scoped>
/* div.v-col-md-12.v-col-12 {
  text-align: center;
  background-color: #cdd2d9;
  border-radius: 6px;
  font-size: large;
} */
input#input-33.v-field_input {
  background-color: black;
}
</style>
