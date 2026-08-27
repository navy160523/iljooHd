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
import { commonSampleDownFilesApi } from "@hiway/api/commonFileApi";

import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import IButtonList from '@/components/IButtonList.vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import RegisterPopup from "@/pages/50_safety-support/SPP_C/popup/SPPCC0010Popup01.vue"



defineOptions({
  name: '50_safety-support-SPP_C-TAB-SPPCC0010_Tab01',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea1 = ref(null)
// const searchRightArea = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const registerPopup = ref(null)
const isReadonly = ref(true)
const fileUploadPopup = ref(null)

let type = '' // 팝업 좌,우측 구분
let addState1 = false // 좌측 데이터 추가 가능 여부
let saveParams = []

/* 좌측 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: '', // 부서 코드
  ASGN_CD: '', // 협력사 코드
  DATE_YN: 'Y', // 중지일자 사용 여부
  JSTOP_DATE_FR: dayjs().startOf('month').format("YYYY-MM-DD"), // 중지일자 조회 시작일
  JSTOP_DATE_TO: dayjs(new Date()).format("YYYY-MM-DD"), // 중지일자 조회 종료일
  JSTOP_DIV: '',
  JSTOP_DIV_OPTION: '', // 전체, 합의, 일방
  JSTOP_EMP_NO: '', // 작업중지자
  OLD_ASGN: 'Y', // 과거 조직포함 여부
  ADMIN: 'Y', // 권한 확인에 따른 조회 조건 차이 (현재는 고정 코드로 사용)
  JSTOP_NO: '',// 중지 고유번호
})



/* 코드 리스트 */
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [], // 사업부 목록
  DEPT_CD: [], // 부서 목록
  ASGN_CD: [], // 협력사 목록
  JSTOP_DIV:[
    {COD:'', TXT:'전체'}
    ,{COD:'10', TXT:'민원 점검관련'}
    ,{COD:'20', TXT:'사고 관련'}
  ],  // 중지 구분
  JSTOP_DIV_OPTION:[ // 중지 구분 추가 옵션
    {COD:'', TXT:'전체'}
    ,{COD:'1', TXT:'합의'}
    ,{COD:'2', TXT:'일방'}
  ],
  JSTOP_EMP_NO: []
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
          USE_DIV: searchParams.OLD_ASGN,
        }
      }),
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, USE_ONLY: searchParams.OLD_ASGN },
      }), // 부서
      commonSearchApi(// 작업중지자 목록
      { queryId : 'SPPCC0010_SEARCH_02',
        param:{
          CMPNY_DIV: userStore.cmpnyDiv,
        }
      }),
      commonSearchApi({ queryId : 'searchVend', param : { 
        CMPNY_DIV: userStore.cmpnyDiv
        , BSNS_CD: searchParams.BSNS_CD
        , DEPT_CD: ''
        , USE_DIV: searchParams.OLD_ASGN  } }),
      ]).then(res => {
    // 회사
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.JSTOP_EMP_NO = res[3].ORESULT_CUR
    // codeList.ASGN_CD = res[4].ORESULT_CUR

    // codeList.DATE_LIST.unshift({ TXT:'전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD: '' })
    codeList.JSTOP_EMP_NO.unshift({ EMP_NM:'전체', EMP_NO: '' })
    codeList.ASGN_CD.unshift({ ASGN_NM:'전체', ASGN_CD: '' })

    grdMain.value.setBindingColumn(
        "JSTOP_DIV",
        codeList.JSTOP_DIV,
        "COD",
        "TXT"
      ); // 회사구분
  })
}

//좌측 디테일(상단) 그리드
const grdMainProps = reactive({
  gridViewOption: {  edit: { editable: false }, checkBar: { visible: true } },
  fields : [ 
    { fieldName: 'JSTOP_TIME_DS',width:'130', dataType: 'text', header: { text:'중지일시' }, editable: false },
    { fieldName: 'ASGN_NM',width:'200', styleName: 'left-column', dataType: 'text', header: { text:'작업조직' }, editable: false },
    { fieldName: 'CHG_EMP_NM',width:'60', dataType: 'text', header: { text:'담당자' } },
    { fieldName: 'JSTOP_DIV', dataType: 'text',width:'100', header: { text:'중지구분' }, editable: false,lookupDisplay: true, },
    { fieldName: 'JSTOP_DIV_OPTION', dataType: 'text', width:'125' ,header: { text: t('합의/일방') }, editable: false, renderer: { type: 'html', 
    callback: (grid, model, field) =>{ return GBNCallback(grid, model, field) } }, readonly: true},
    { fieldName: 'JOB_SPLC_NM',width: '150', dataType: 'text', header: { text:'작업장소' }, editable: false, styleName: 'left-column'},
    { fieldName: 'JSTOP_DESC',width: '350', styleName: 'left-column',dataType: 'text', header: { text:'중지사유' }, editable: false },
    { fieldName: 'WORKER_CNT',width:'60', dataType: 'text', header: { text:'작업인원' }, editable: false, styleName: 'right-column' },
    { fieldName: 'JSTOP_EMP_NM',width:'80', dataType: 'text', header: { text:'작업중지자' }, editable: false },
    { fieldName: 'LOSS_MH',width:'60', dataType: 'text', header: { text:'손실M/H' }, editable: false, styleName: 'right-column' },
    { fieldName: 'FILE_ID', dataType: 'text', isFile: { value: true, showAlways: true }, header: { text:'첨부파일' }, editable: false },
    
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'JSTOP_NO', dataType: 'text', visible: false },
    { fieldName: 'JSTOP_TIME2', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'CHG_EMP_NO', dataType: 'text', visible: false },
    { fieldName: 'JOB_PLC_DESC', dataType: 'text', visible: false },
    { fieldName: 'SHIP_NO', dataType: 'text', visible: false },
    { fieldName: 'RESTART_DT1', dataType: 'text', visible: false },
    { fieldName: 'RESTART_TIME2', dataType: 'text', visible: false },
    { fieldName: 'RESTART_DIV', dataType: 'text', visible: false },
    { fieldName: 'RESTART_DESC', dataType: 'text', visible: false },
    { fieldName: 'JSTOP_CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'JSTOP_EMP_NO', dataType: 'text', visible: false },
    { fieldName: 'JSTOP_ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'JSTOP_DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', visible: false },
    // { fieldName: 'FILE_ID', dataType: 'text', visible: false },

  ],
  columns: [],
})
    
grdMainProps.columns = grdMainProps.fields


//////////////////////////////////////////////메인 버튼 클릭이벤트
//좌측
const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){ //대상 조회
    Promise.all([ 
      // 메인 데이터 조회 (하단 그리드)
      commonSearchApi({ 
        queryId : 'SPPCC0010_SEARCH_01',
        param: searchParams }),
    ]).then(res => {
      // console.log('res[0].ORESULT_CUR',res[0].ORESULT_CUR)
      grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      
      //grdMain.value.getGridView().setFocus(0)
      
  })
  }else if(btn.id === 'btnRegist'){ //추가 (팝업 오픈)
    registerPopup.value.openPopup({NEW_YN: 'Y'})
  }
  else if(btn.id === 'btnDelete'){ //삭제
    new deleteFlowHelper(vm, t)
      .setBefore(delCheck1)
      .setQuery(delData1)
      .setAfter(() => onButtonsClick({ id: "btnSearch" }))
      .run();
  }
  else if(btn.id === 'btnExcelUpload'){ // 추가
    // const input = document.createElement('input')
    
    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]
      console.log('selectedFile',selectedFile)
      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    // input.click()
  }
  else if(btn.id === 'btnSampleDown'){ // 추가
    let params = {
      FILE_PATH: 'SPPC',
      FILE_NAME: '작업중지업로드양식.xlsx',
    }
    commonSampleDownFilesApi(params)
  }
}
const searchEMP = (searchData) => {
  return commonSearchApi({ queryId : 'searchEMP', list: searchData })
}

//엑셀 업로드 이벤트
const excelUploadCallback = async excelData => {
  saveParams = []
 
  let permission = true
  console.log('excelData',excelData)
  excelData.map((item,idx) => {
    permission = true
      const dataList = {}
      let manager = {}
      let jstop = {}

      if(item.작업담당자사번){
          commonSearchApi({ queryId : 'searchEMP', param : {
          CMPNY_DIV: userStore.cmpnyDiv,
          EMP_NO: item.작업담당자사번,
          FLAG: 'N',}})
          .then(res => {
            manager = res.ORESULT_CUR[0]
          })
        
        }else{
          Message.err(idx+2 +'번 행의 작업담당자 사번 칼럼 값이 누락되었습니다.')
          permission = false
          return
        }

      if(item.작업중지자사번){  
        commonSearchApi({ queryId : 'searchEMP', param : {
          CMPNY_DIV: userStore.cmpnyDiv,
          EMP_NO: item.작업중지자사번,
          FLAG: 'N',}}).then(res => {
            // console.log('res',res)
          jstop = res.ORESULT_CUR[0]
        })
      }
      if(item.중지상세){
          dataList.JSTOP_DESC= item.중지상세
        }else{
          permission = false
          Message.err(idx+2+'번 행의 중지상세 칼럼 값이 누락되었습니다.')
          return
      }
      if(item.중지일자){
        dataList.JSTOP_DT1= item.중지일자.toString()
      }else{
        Message.err(idx+2+'번 행의 중지일자 칼럼 값이 누락되었습니다.')
        permission = false
        return
      }
      if(item.중지시간){
        dataList.JSTOP_TIME2= item.중지시간.toString()
      }else{
        Message.err(idx+2+'번 행의 중지시간 칼럼 값이 누락되었습니다.')
        permission = false
        return
      }
      if(item.민원점검관련 === 'Y' && item.사고관련 === 'Y'){
        Message.err(idx+2+'번 행의 민원점검 관련, 사고 관련 값이 중복 입력되었습니다.')
        permission = false
        return
      }else if(item.민원점검관련 === 'Y'){
        dataList.JSTOP_DIV = '10'
      }else if(item.사고관련 === 'Y'){
        dataList.JSTOP_DIV = '20'
      }else{
        Message.err(idx+2+'번 행의 중지구분 칼럼 값이 누락되었습니다.')
        permission = false
        return
      }
      setTimeout(() => {
        
        dataList.JSTOP_TIME_DS = 
          item.중지일자.toString().slice(0,4) 
          + '.' + item.중지일자.toString().slice(4, 6) 
          + '.' + item.중지일자.toString().slice(6,8)
          + ' ' + item.중지시간.toString().slice(0,2)
          + ':' + item.중지시간.toString().slice(2,4)
        if(item.호선){
          dataList.SHIP_NO= item.호선.toString()
        }
        if(item.작업인원){
          dataList.WORKER_CNT= item.작업인원.toString()
        }
        if(item.손실공수){
          dataList.LOSS_MH= item.손실공수.toString()
        }
        
        dataList.BSNS_CD= manager.BSNS_CD
        dataList.DEPT_CD= manager.DEPT_CD
        dataList.ASGN_CD= manager.ASGN_CD
        dataList.CMPNY_DIV= manager.CMPNY_DIV
        // dataList.ASGN_NM= manager.ASGN_NM
        dataList.CHG_EMP_NM= manager.EMP_NM
        dataList.CHG_EMP_NO= manager.EMP_NO
        if(item.작업재개일자){
          dataList.RESTART_DT1= item.작업재개일자.toString()
        }
        if(item.작업재개시간){
          dataList.RESTART_TIME2= item.작업재개시간.toString()
        }
        dataList.RESTART_DESC= item.조치내용
        dataList.JSTOP_CMPNY_DIV= jstop.CMPNY_DIV
        dataList.JSTOP_EMP_NO= jstop.EMP_NO
        dataList.JSTOP_EMP_NM= jstop.EMP_NM
        dataList.JSTOP_ASGN_CD= jstop.ASGN_CD
        dataList.JSTOP_DEPT_CD= jstop.DEPT_CD
        dataList.COMPANY= manager.COMPANY


        

        if(item.합의 === 'Y' && item.일방 === 'Y'){
          Message.err(idx+2+'번 행의 합의,일방 값이 중복 입력되었습니다.')
          permission = false
          return
        }else if(item.합의 === 'Y'){
          dataList.JSTOP_DIV_OPTION = '1'
        }else if(item.일방 === 'Y'){
          dataList.JSTOP_DIV_OPTION = '2'
        }

        
        let temp = []
        temp.push(item.즉시)
        temp.push(item.작업취소)
        temp.push(item.작업대체)

        console.log('temp',temp)
        let count = temp.filter(element => 'Y' === element).length;
        console.log(count)
        if(count > 1){
          Message.err(idx+2+'번 행의 작업재개 구분 값이 중복 입력되었습니다.')
          permission = false
          return
        }

        if(item.즉시 === 'Y'){
          dataList.RESTART_DIV = 'A'
        }else if(item.작업취소 === 'Y'){
          dataList.RESTART_DIV = 'B'
        }else if(item.작업대체 === 'Y'){
          dataList.RESTART_DIV = 'C'
        }
        console.log('dataList',dataList)
        saveParams.push(dataList)
      }, 2000)
      
  })

  console.log('saveParams',saveParams)
  // 필수값이 없을 때 중지
  if(!permission) {
    console.log('엑셀 업로드가 중단')
    return
  }
  let ck = await vm.$swal({ 
    title: t('저장 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!ck.isConfirmed){
    Message.warn('취소되었습니다.')
    return 
  } else{
    if(saveParams.length>0){
      new saveFlowHelper(vm, t)
      .setQuery(confirmData)
      .setAfter(()=>{onButtonsClick({id:'btnSearch'})})
      .showMessage(false)
      .run()
    }else{
      Message.err('저장할 데이터가 없습니다.')
    }
  }
}
const confirmData = () => {
  return commonExecuteApi({ queryId : 'SPPCC0010_SAVE_01', list: saveParams })
}
// 좌측 디테일(상단) 그리드 데이터 삭제 전
const delCheck1 = async () => {
  let delCheck = grdMain.value.getGridView().getCheckedRows()

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
  let delCheck = grdMain.value.getGridView().getCheckedRows()
  // console.log('delCheck',delCheck)
  delCheck.forEach(element => {
    const data = grdMain.value.getRowData(element)
    data.USER_ID = userStore.userId
    delParams.push(data)
  });
  

  // console.log('삭제 파라미터 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SPPCC0010_DELETE_01",
    list: delParams,
  })
}



// 그리드 더블 클릭 팝업 오픈 이벤트
const onCellDblClicked = (grid, clickData) => {
  // 아이콘 선택
  console.log('clickData',clickData)
  const selectRow = grdMain.value.getRowData(clickData.dataRow)
  let fileID = ''
  searchParams.JSTOP_NO = selectRow.JSTOP_NO
  if(clickData.fieldName === 'FILE_ID'){
    console.log('selectRow.FILE_ID',selectRow.FILE_ID)
    if(selectRow.FILE_ID !== null){
      fileID = selectRow.FILE_ID
      fileUploadPopup.value.setGuid()
      fileUploadPopup.value.openPopup(fileID)
    }else{
      fileUploadPopup.value.setGuid()
      fileUploadPopup.value.openPopup()
    }
  }else{
    if(selectRow.SAVE_YN === 'Y'){
      selectRow.NEW_YN = 'N'
      registerPopup.value.openPopup(selectRow)
    }
  }
   
}
 

const GBNCallback = (grid, model, field) => {
  let checkedA = '' // 합의
  let checkedB = '' // 일방

  if(model._index.value === '1'){
    checkedA = 'checked'
  } else if(model._index.value === '2'){
    checkedB = 'checked'
  } 

  return "<input type='radio' " + "value='1' onclick='return false;'" + "name=" + "'group" + model._index.dataRow + 'A' + "' " + checkedA + " />" + 
    "<span style='padding: 0 10px 0 10px !important;'>합의</span>" +
    "<input type='radio' " + "value='2' onclick='return false;'" + "name=" + "'group" + model._index.dataRow + 'B' + "'" + checkedB + "  />" +
    "<span style='padding: 0 10px 0 10px !important;'>일방</span>" 
}

const closed = () => {
  onButtonsClick({id:'btnSearch'})
}

const uploaded = val => {
  console.log('uploaded val',val)
  saveFile(val.fileId)
}


const saveFile = (fileId) => {
  const saveParam = []
  const temp = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    JSTOP_NO: searchParams.JSTOP_NO,
    FILE_ID: fileId,
    USER_ID: userStore.userId,
  }
    saveParam.push(temp)
    
  commonExecuteApi
  ({ 
      queryId : 'SPPCC0010_SAVE_02'
    , list: saveParam
  }).then((res)=>{
    onButtonsClick({id:'btnSearch'})
  })
}

onMounted(() => {
  // 그리드 데이터 바인딩
  initCodeList()
  // console.log('dayjs test', dayjs().startOf('month'))
  onButtonsClick({id:'btnSearch'})
})


//좌측 부서 선택 여부
watch(
  () => searchParams.OLD_ASGN,
  (newValue, oldValue) => {
    if(newValue===null||newValue===''){
    codeList.DEPT_CD = []
    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    searchParams.DEPT_CD = codeList.BSNS_CD[0].COD
    return
  }
    commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, USE_ONLY: searchParams.OLD_ASGN },
      }).then(res => {
        // console.log('dept_cd lsit',res)
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    })
  }
)


//사업부가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  // console.log("부서 데이터",newValue)
  if(newValue===null||newValue===''){
    codeList.DEPT_CD = []
    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    searchParams.DEPT_CD = codeList.BSNS_CD[0].COD
    return
  }
  commonSearchApi({
        queryId: "searchDept",
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, USE_ONLY: searchParams.OLD_ASGN },
      }).then(res => {
        // console.log('dept_cd lsit',res)
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    })

})

//부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  // console.log("협력사 데이터",newValue)
  if(newValue===null||newValue===''){
    codeList.ASGN_CD = []
    codeList.ASGN_CD.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
    searchParams.ASGN_CD = codeList.ASGN_CD[0].COD
    return
  }
  commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: newValue } })
    .then(res => {
      codeList.ASGN_CD = res.ORESULT_CUR
      codeList.ASGN_CD.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
    })

})


watch(
  () => searchParams.JSTOP_DATE_FR,
  (newFrom) => {
    if (newFrom) {
      const fromDate = dayjs(newFrom)
      const toDate = dayjs(searchParams.JSTOP_DATE_TO)

      if (fromDate.isAfter(toDate)) {
        Message.warn(t("올바른 검색기간을 설정해주세요."))
        searchParams.JSTOP_DATE_FR = dayjs().startOf("year").format("YYYY-MM-DD")
      }
    }
  },
  { deep: true }
)
 
watch(
  () => searchParams.JSTOP_DATE_TO,
  (newTo) => {
    if (newTo) {
      const fromDate = dayjs(searchParams.JSTOP_DATE_FR)
      const toDate = dayjs(newTo)
      if (toDate.isBefore(fromDate)) {
        Message.warn(t("올바른 검색기간을 설정해주세요."))
        searchParams.JSTOP_DATE_TO = dayjs().format("YYYY-MM-DD")
      }
    }
  },
  { deep: true }
)
</script>

<template>

<v-card class="pa-1 fill-height">
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet height="100%" style="display: flex; flex-direction: row;">
          <v-sheet width="100%" style="padding-right: 5px;">
            <IMenuTitle
              :button-list="['btnRegist','btnSampleDown','btnExcelUpload','btnSearch','btnDelete']"
              :title="'노동조합 작업중지 등록'"
                @click-button="onButtonsClick">
                <template #editors />
            </IMenuTitle>
            <v-sheet class="searchArea" style="display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center; padding-bottom: 6px;">              
                <v-checkbox
                  label="중지일자"
                  style="width: 85px"
                  true-value="Y"
                  false-value="N"
                  v-model="searchParams.DATE_YN"
                ></v-checkbox>
                <i-input
                  v-model="searchParams.JSTOP_DATE_FR"
                  type="date"
                  margin="10px"
                  width="150px"
                />
                <i-input
                  v-model="searchParams.JSTOP_DATE_TO"
                  width="170px"
                  :label="$t('~')"
                  type="date"
                />
                <i-select
                  :label="$t('작업중지자')"
                  label-width="70px"
                  width="220px"
                  v-model="searchParams.JSTOP_EMP_NO"
                  :items="codeList.JSTOP_EMP_NO"
                  item-value="EMP_NO"
                  item-title="EMP_NM"
                />
                <i-select
                :label="$t('사업부')"
                label-width="40px"
                width="200px"
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                />
                <i-select
                  :label="$t('부서')"
                  label-width="40px"
                  width="200px"
                  v-model="searchParams.DEPT_CD"
                  :items="codeList.DEPT_CD"
                  item-value="DEPT_CD"
                  item-title="DEPT_NM"
                />
                <i-select
                  :label="$t('협력사')"
                  label-width="40px"
                  width="200px"
                  v-model="searchParams.ASGN_CD"
                  :items="codeList.ASGN_CD"
                  item-value="ASGN_CD"
                  item-title="ASGN_NM"
                />
                <v-checkbox
                  label="과거조직 포함"
                  style="width: 120px"
                  true-value="N"
                  false-value="Y"
                  v-model="searchParams.OLD_ASGN"
                />
            </div>
            <div style="display: flex; align-items: center; padding-left: 23px">
              <i-select
                :label="$t('중지구분')"
                label-width="60px"
                width="220px"
                v-model="searchParams.JSTOP_DIV"
                :items="codeList.JSTOP_DIV"
                item-value="COD"
                item-title="TXT"
                marginBetween="2px"
              />
              <div style="padding-right: 12px;">
                <v-radio-group inline v-model="searchParams.JSTOP_DIV_OPTION">
                    <v-radio label="전체" value=""></v-radio>
                    <v-radio label="합의" value="1"></v-radio>
                    <v-radio label="일방" value="2"></v-radio>
                </v-radio-group>
              </div>
            </div>
            </v-sheet>
              <RealGrid
                ref="grdMain"
                class="mt-2"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
              />
          </v-sheet>
          <!-- 우측 상단 칸-->
        </v-sheet>
      </div>
    </v-card-text>
  </v-card> 
  <!-- 부서 팝업 -->
  <!-- 피난계획서 UPLOAD 팝업 -->
      
    <RegisterPopup ref="registerPopup" @closed="closed"/>
    <IUploadPopup
      ref="fileUploadPopup"
      @uploaded="uploaded"
      :buttonList="['btnDownLoad', 'btnDelete', 'btnClose']"
      :autoUpload="true"
      :img-only=true
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