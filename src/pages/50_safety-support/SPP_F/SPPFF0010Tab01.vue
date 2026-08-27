<!-- SPPFF0010 장비점검 및 유지관리 -->
<!-- SI1팀 마환구 2025.07.03 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonSearchApi3,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
  commonRequest2
} from '@hiway/api/commonApi'
import {
  commonDeletFilesApi,
  commonDeleteAllFilesApi,
  commonSampleDownFilesApi
} from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import Message from '@hiway/utils/notify'
import { useCommonStore } from '@/@hiway/stores/common'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { useRoute } from 'vue-router'
import SPPFF0010Popup01 from './SPPFF0010Popup01.vue'
import SPPFF0010Popup02 from './SPPFF0010Popup02.vue'
import dayjs from "dayjs"
import { getJsonFromExcel } from "@/utils/excel"
import _ from 'lodash'

const today = ref(null)
const SPPFF0010_Popup01 = ref(null)
const SPPFF0010_Popup02 = ref(null)
const FIUploadPopup = ref(null)
const MIUploadPopup = ref(null)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const useLogStore = useLogsStore()
const commonStore = useCommonStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)

const selectrow = ref(null)
const uploadInput = ref(null)

const bsnsCd =ref(null);
const deptCd =ref(null);
const processCd =ref(null);
const bsnsNm =ref(null);
const deptNm =ref(null);
const processNm =ref(null);
const processDetail =ref(null);
const processDetailSeq =ref(null);
const processHisSeq = ref(null);

// const psiSeq =ref(null);


const popupParam=reactive({});

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.empNo,
})

const saveParams = reactive({});

const isAdmin = ref(0)

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  process: []
})


const grade = reactive([
  {TXT: '1등급', COD: 1 },
  {TXT: '2등급', COD: 2 },
  {TXT: '3등급', COD: 3 },
  {TXT: '4등급', COD: 4 },
  {TXT: '5등급', COD: 5 },
])

const cycle = reactive([
  {TXT: '일일', COD: 'A' },
  {TXT: '주간', COD: 'B' },
  {TXT: '월간', COD: 'C' },
  {TXT: '분기', COD: 'D' },
  {TXT: '반기', COD: 'E1' },
  {TXT: '연간', COD: 'E2' },
])

const initCodeList = () => {
  // console.log("searchParams:",searchParams)
  Promise.all([ 
    commonSearchApi({ queryId: 'SPPFF0010_COMBO_01', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFF0010_COMBO_02', param: {CMPNY_DIV : userStore.cmpnyDiv, BSNS_CD : ''} }),
    commonSearchApi({ queryId: 'SPPFF0010_COMBO_03', param: {CMPNY_DIV : userStore.cmpnyDiv, BSNS_CD : '', DEPT_CD:''} }),

  ]).then(res => {    
    
    codeList.bsnscd = res[0].ORESULT_CUR
    // if(searchParams.BSNS_CD !== '') {
      codeList.deptcd = res[1].ORESULT_CUR
      codeList.process = res[2].ORESULT_CUR
    // }


    if(codeList.bsnscd.length>0)
    {
      grdMain1.value.setBindingColumn("BSNS_CD",codeList.bsnscd,'BSNS_CD','BSNS_NM')
      codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    }
    else
    {
      codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    }
    
    if(codeList.deptcd.length>0)
    {
      grdMain1.value.setBindingColumn("DEPT_CD",codeList.deptcd,'DEPT_CD','DEPT_NM')
      codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    }
    else
    {
      codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    }
    
    if(codeList.process.length>0)
    {
      grdMain1.value.setBindingColumn("PROCESS_CD",codeList.process,'COD','TXT')
      codeList.process.unshift({ TXT: '전체', COD: '' })
    }
    else
    {
      codeList.process.unshift({ TXT: '전체', COD: '' })
    }
    grdMain1.value.setBindingColumn("PROCESS_GRD",grade,'COD','TXT')
    grdMain1.value.setBindingColumn("INSP_CYCLE",cycle,'COD','TXT')
    today.value=dayjs().format("YYYY-MM-DD")
  })
  
}

// 등록/수정 구분자
const isNew = ref(false)

const onButtonsClick = (btn) => {
  if(btn.id === 'btnCreate') {
    // openPopup("C")
    addData();
  }
  else if(btn.id === 'btnSearch') {
    // getData()
    new queryFlowHelper(vm, t)  
    .setGridList([grdMain1])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
  }
  else if(btn.id=='btnUpdate')
  {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain1])
      .setBefore(beforeSave)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id=='btnProcessHistory')
  {
    hisReportPrint();
  }
  else if(btn.id=='btnProcessGrade')
  {
    gradeReportPrint();
  }
  else if(btn.id=='btnDelete')
  {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
  else if(btn.id === 'btnExcelUpload') {
    uploadInput.value.click()
  }
  else if(btn.id === 'btnSampleDown') {
    const sampleParam = {
      FILE_PATH: 'SPP_F',
      FILE_NAME: '장비점검 및 유지관리 업로드 양식.xlsx',
    }

    commonSampleDownFilesApi(sampleParam)
  }
}

const uploadData = async e => {
  // console.log('uploadData', e.target.files)

  let bsnsList = []
  let deptList = []
  let prcsList = []

  await commonSearchApi({ queryId: 'SPPFF0010_COMBO_01', param: { CMPNY_DIV: userStore.cmpnyDiv } }).then(res => { bsnsList = res.ORESULT_CUR })
  await commonSearchApi({ queryId: 'SPPFF0010_COMBO_02', param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '' } }).then(res => { deptList = res.ORESULT_CUR })
  await commonSearchApi({ queryId: 'SPPFF0010_COMBO_03', param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD:'' } }).then(res => { prcsList = res.ORESULT_CUR })

  grdMain1.value.getDataProvider().setRows([]);

  getJsonFromExcel(
    e.target.files[0],
    async data => {
      // console.log('data', data)

      uploadInput.value.value = null

      for(let i = 0; i < data.length; i++) {
        const currData = data[i]

        const rowIdx = grdMain1.value.getDataProvider().addRow({
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: currData['사업부'],
          DEPT_CD: currData['부서'],
          PROCESS_CD: currData['PSM 대상설비'],
          PROCESS_DETAIL: currData['설비명(Tag 번호)'],
          RUN_YN: 'true',
          PROCESS_DETAIL_SEQ: 0,
          PROCESS_GRADE_SEQ: 0,
        })

        const currRow = grdMain1.value.getDataProvider().getJsonRow(rowIdx)
        let hasErr = 0

        if(!_.some(bsnsList, { BSNS_CD: currRow.BSNS_CD })) {
          grdMain1.value.getDataProvider().setValue(rowIdx, 'ERR_BSNS_CD', '잘못된 사업부 코드입니다.')
          hasErr++
        }
        
        if(!_.some(deptList, { BSNS_CD: currRow.BSNS_CD, DEPT_CD: currRow.DEPT_CD })) {
          grdMain1.value.getDataProvider().setValue(rowIdx, 'ERR_DEPT_CD', '잘못된 부서 코드입니다.')
          hasErr++
        }
        
        if(!_.some(prcsList, { BSNS_CD: currRow.BSNS_CD, DEPT_CD: currRow.DEPT_CD, COD: currRow.PROCESS_CD })) {
          grdMain1.value.getDataProvider().setValue(rowIdx, 'ERR_PROCESS_CD', '잘못된 PSM 대상설비 코드입니다.')
          hasErr++
        }
        
        if(currRow.PROCESS_DETAIL.indexOf('(') < 0 || currRow.PROCESS_DETAIL.indexOf(')') < 1 ) {
          grdMain1.value.getDataProvider().setValue(rowIdx, 'ERR_PROCESS_DETAIL', 'Tag 번호를 입력하지 않았습니다.')
          hasErr++
        } 
        
        if(hasErr > 0) {
          grdMain1.value.getDataProvider().setValue(rowIdx, 'HAS_ERR', 'Y')
        } else {
          grdMain1.value.getGridView().checkRow(rowIdx)
        }
      }

      // const grdData = grdMain1.value.getDataProvider().getJsonRows()
      // const sortedData =  _.orderBy(grdData, ['HAS_ERR', 'BSNS_CD', 'DEPT_CD', 'PROCESS_CD', 'PROCESS_DETAIL'])
      
      // grdMain1.value.getDataProvider().setRows(sortedData)
    }
  )
}

const fileIdList = [];

const beforeDelete = async () =>{
  let row = grdMain1.value.getGridView().getCheckedRows(true);

  if(row.length == 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요'))
    return false
  }
  else
  {
    return true
  }
  // let param=[];
  // for(const d of row)
  // {
  //   let data=grdMain1.value.getDataProvider().getJsonRow(d);
  //   data.CMPNY_DIV=userStore.cmpnyDiv
  //   param.push(data);
  // }

  // console.log(param);

  // const res= await commonSearchApi3({ queryId: 'SPPFF0010_FILE_ID_SEARCH_01', list: param })

  // console.log(res);
  
}

const deleteData = async() =>{

  let row = grdMain1.value.getGridView().getCheckedRows(true);
  let param=[];
  for(const d of row)
  {
    let data=grdMain1.value.getDataProvider().getJsonRow(d);
    data.CMPNY_DIV=userStore.cmpnyDiv
    param.push(data);
  }

  // console.log(param);

  return commonExecuteApi({ queryId: 'SPPFF0010_DELETE_02', list: param })

  // console.log(res);

}

const afterDelete = (res) =>{
  // console.log(res);
  onButtonsClick({ id: 'btnSearch' })
}

const hisReportPrint = () =>{
  let printData=[]
  let checkedData = grdMain1.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("출력할 데이터를 선택해주세요."));

    return false;
  }
  for (let rowIdx of checkedData) {
  let data = grdMain1.value.getDataProvider().getJsonRow(rowIdx);
  // console.log("seq:",data.PROCESS_GRADE_SEQ)
  // console.log("run:",data.RUN_YN)
  if(data.PROCESS_HIS_SEQ>0 && data.RUN_YN=='true')
    {
    data.CMPNY_DIV=userStore.cmpnyDiv
    printData.push(data)
    // let Printdata={
    //     CMPNY_DIV : userStore.cmpnyDiv,
    //     BSNS_CD : data.BSNS_CD,
    //     DEPT_CD : data.DEPT_CD,
    //     PROCESS_CD : data.PROCESS_CD,
    //     PROCESS_DETAIL: data.PROCESS_DETAIL,
    //     PROCESS_DETAIL_SEQ: data.PROCESS_DETAIL_SEQ
    //   }
    }
  }
  
  if(printData.length > 0)
  {
    commonStore.loading = true
    commonRequest2('hse/excel/SPPFF0010_PRINT_05', printData).then((res) => {
    commonStore.loading = false

    const blob = new Blob([res], { type: res.type })
    
    const link = document.createElement('a')
    
    const fileName = `유해ㆍ위험설비 이력카드 리스트`.trim()

    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
    })
  }
  else
  {
    Message.warn(t("출력이 가능한 데이터가 없습니다."));

    return false;
  }
}
  const gradeReportPrint = () =>{
  let printData=[]
  let checkedData = grdMain1.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("출력할 데이터를 선택해주세요."));

    return false;
  }
  for (let rowIdx of checkedData) {
  let data = grdMain1.value.getDataProvider().getJsonRow(rowIdx);
  // console.log("seq:",data.PROCESS_GRADE_SEQ)
  // console.log("run:",data.RUN_YN)
  if(data.PROCESS_GRADE_SEQ>0 && data.RUN_YN=='true')
    {
    data.CMPNY_DIV=userStore.cmpnyDiv
    printData.push(data)
    // let Printdata={
    //     CMPNY_DIV : userStore.cmpnyDiv,
    //     BSNS_CD : data.BSNS_CD,
    //     DEPT_CD : data.DEPT_CD,
    //     PROCESS_CD : data.PROCESS_CD,
    //     PROCESS_DETAIL: data.PROCESS_DETAIL,
    //     PROCESS_DETAIL_SEQ: data.PROCESS_DETAIL_SEQ
    //   }
    }
  }
  // console.log("printData:", printData)
  if(printData.length > 0)
  {
      commonStore.loading = true
      commonRequest2('hse/excel/SPPFF0010_PRINT_04', printData).then((res) => {
      commonStore.loading = false

      const blob = new Blob([res], { type: res.type })
      
      const link = document.createElement('a')
      
      const fileName = `설비등급 평가표 리스트`.trim()

      link.href = URL.createObjectURL(blob)

      link.download = fileName
      link.click()
      URL.revokeObjectURL(link.href)
    })
  }
  else
  {
    Message.warn(t("출력이 가능한 데이터가 없습니다."));

    return false;
  }
}


const beforeSave = async () => {
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true)
  
  if(checkedRows.length==0)
  {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for(let idx of checkedRows)
  {
    let data =grdMain1.value.getDataProvider().getJsonRow(idx)
    
    if(!data.BSNS_CD)
    {
      return Message.warn(t('사업부를 선택해주세요'))
    }
    if(!data.DEPT_CD)
    {
      return Message.warn(t('부서를 선택해주세요'))
    }
    if(!data.PROCESS_CD)
    {
      return Message.warn(t('사업부를 선택해주세요'))
    }
    if(!data.PROCESS_DETAIL)
    {
      return Message.warn(t('세부설비명을 입력해주세요'))
    }
  }

  return true;
  
}

const saveData = async () => {
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true)
  
  let saveData=[]
  for(let idx of checkedRows)
  {
    let data =grdMain1.value.getDataProvider().getJsonRow(idx)
    data.CMPNY_DIV = userStore.cmpnyDiv
    data.USER_ID = userStore.userId;
    saveData.push(data)
  }
  console.log(saveData);
  return commonExecuteApi({ queryId: 'SPPFF0010_SAVE_01', list: saveData })
}

const afterSave = () => {
  //  getData()
  onButtonsClick({ id: 'btnSearch' })

}

const openPopup = (data) => {

  popupParam.BSNS_CD = bsnsCd.value
  popupParam.DEPT_CD = deptCd.value
  popupParam.PROCESS_CD = processCd.value
  popupParam.BSNS_NM = bsnsNm.value
  popupParam.DEPT_NM = deptNm.value
  popupParam.PROCESS_NM = processNm.value
  popupParam.PROCESS_DETAIL = processDetail.value
  popupParam.PROCESS_DETAIL_SEQ = processDetailSeq.value
  popupParam.ISNEW = isNew.value

  if(data=='PROCESS_HIS')
  {
    SPPFF0010_Popup01.value.openPopup(popupParam);
  }
  else if(data=='GRD_REV')
  {
    SPPFF0010_Popup02.value.openPopup(popupParam);
  }

    

}

const addData=()=>{

  grdMain1.value.addRow({
    BSNS_NM             : "",
    DEPT_NM             : "",
    PROCESS_NM          : "",
    PROCESS_DETAIL      : "",
    RUN_YN              : "true",
    PROCESS_HIS         : "",
    PROCESS_GRD         : "",
    INSP_CYCLE          : "",
    GRD_REV             : "",
    GRD_REV_DATE        : "",
    INSP_DATE           : "",
    FILE_YN             : "",
    NXT_INSP_DATE       : "",
    REMARKS             : "",
    BSNS_CD             : "",
    DEPT_CD             : "",
    PROCESS_CD          : "",
    PROCESS_DETAIL_SEQ  : 0,
    PROCESS_HIS_SEQ     : "",
    PROCESS_GRADE_SEQ     : 0,
    FILE_ID             : "",
    }, false)
}


const getData = () => {

  // if(val=="B")
  // {
  //   selectrow.value=0
  // }
  // else
  // {
  //   selectrow.value=selectrow.value;
  // }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain1])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

// 공정안전 자료와 관계없는 관리자가 왔을때 콤보박스 바인딩
const selectedBsnsCd = computed({
  get: () => {
    return codeList.bsnscd.some(item => item.BSNS_CD === searchParams.BSNS_CD)
      ? searchParams.BSNS_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.BSNS_CD = value;
  }
});

const selectedDeptCd = computed({
  get: () => {
    return codeList.deptcd.some(item => item.DEPT_CD === searchParams.DEPT_CD)
      ? searchParams.DEPT_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.DEPT_CD = value;
  }
})


//  조회
const searchData = () => {
  
  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: codeList.bsnscd.some(item => item.BSNS_CD === searchParams.BSNS_CD) ? searchParams.BSNS_CD : '', //사업부
    DEPT_CD: codeList.deptcd.some(item => item.DEPT_CD === searchParams.DEPT_CD) ? searchParams.DEPT_CD : '', //부서
    PROCESS_CD: searchParams.PROCESS_CD, //공정설비
  }
  // console.log("param:",param);
  
  return commonSearchApi({ queryId: 'SPPFF0010_SEARCH_01', param: param })  
}

// 조회 후
const afterSearch = (res) => {

  grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);

}

//사업부변경 감지
watch(

  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    const param = {CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue,}
    if(newValue !== '') {
      Promise.all([ 
        commonSearchApi({ queryId: 'SPPFF0010_COMBO_02', param: searchParams }),
        commonSearchApi({ queryId: 'SPPFF0010_COMBO_03', param: searchParams }),
      ]).then((res) => {
        searchParams.DEPT_CD = ''
        searchParams.PROCESS_CD = ''
        codeList.deptcd = res[0].ORESULT_CUR
        codeList.process = []
        // codeList.process = res[1].ORESULT_CUR
        codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        codeList.process.unshift({ TXT: '전체', COD: '' })
  
      })
    }else {
      searchParams.DEPT_CD = ''
      searchParams.PROCESS_CD = ''
      codeList.deptcd = []
      codeList.process = []
      codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      codeList.process.unshift({ TXT: '전체', COD: '' })

    }
  }
)

// 부서변경 감지
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    if(newValue !== '') {
      commonSearchApi({ 
        queryId: 'SPPFF0010_COMBO_03', 
        param: { 
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: newValue
        } 
      }).then((res) => {
        searchParams.PROCESS_CD = ''
        codeList.process = res.ORESULT_CUR
        codeList.process.unshift({ TXT: '전체', COD: '' })
      })
    }else {
      // console.log('dept and process Empty!')
      searchParams.PROCESS_CD = ''
      codeList.process = []
      codeList.process.unshift({ TXT: '전체', COD: '' })
    }
  }
)




//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'BSNS_CD', dataType: 'text', width: '100', styleName: 'center-column',editable:true, renderer: { showTooltip: true, },
      header: { text: t('사업부'),}, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
      'styleCallback': function(grid, dataCell){
        var ret = {editable : true, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var detailSeq = grid.getValue(dataCell.index.itemIndex, 'PROCESS_DETAIL_SEQ');

        if (detailSeq > 0) {
          ret.editable = false;
        }
        else
        {
          ret.editable = true;
        }

        ret.editor = {
          type: 'dropdown',
          editable : ret.editable, 
          styleName : 'middle_column', 
          enabled: false
        }
        return ret
      }
    },
    { 
      fieldName: 'DEPT_CD', dataType: 'text', width: '100', styleName: 'center-column',editable:true, renderer: { showTooltip: true, },
      header: { text: t('부서') }, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
      'styleCallback': function(grid, dataCell){
        var ret = {editable : true, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var dropList = { DEPT_CD: [], DEPT_NM: [] }
        var bsnsCd = grid.getValue(dataCell.index.itemIndex, 'BSNS_CD')
        var detailSeq = grid.getValue(dataCell.index.itemIndex, 'PROCESS_DETAIL_SEQ');

        if (detailSeq > 0) {
          ret.editable = false;
        }
        else
        {
          ret.editable = true;
        }
        for(let cd of codeList.deptcd) {
          if((bsnsCd == null || bsnsCd == '') || bsnsCd == cd.BSNS_CD) {
            dropList.DEPT_CD.push(cd.DEPT_CD)
            dropList.DEPT_NM.push(cd.DEPT_NM)
          }
        }
        ret.editor = {
          type: 'dropdown',
          values: dropList.DEPT_CD,
          labels: dropList.DEPT_NM,
          editable : ret.editable, 
          styleName : 'middle_column', 
          enabled: false
        }
        return ret
      },
    },
    { 
      fieldName: 'PROCESS_CD', dataType: 'text', width: '150', styleName: 'left-column',editable:true, renderer: { showTooltip: true, },
      header: { text: t('PSM 대상설비') }, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true }, 
      'styleCallback': function(grid, dataCell){
        var ret = {editable : true, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var dropList = { COD: [], TXT: [] }
        var bsnsCd = grid.getValue(dataCell.index.itemIndex, 'BSNS_CD')
        var deptCd = grid.getValue(dataCell.index.itemIndex, 'DEPT_CD')
        var detailSeq = grid.getValue(dataCell.index.itemIndex, 'PROCESS_DETAIL_SEQ');

        if (detailSeq > 0) {
          ret.editable = false;
        }
        else
        {
          ret.editable = true;
        }

        for(let cd of codeList.process) {
          if((deptCd == null || deptCd == '') || deptCd == cd.DEPT_CD && bsnsCd == cd.BSNS_CD) {
            dropList.COD.push(cd.COD)
            dropList.TXT.push(cd.TXT)
          }
        }
        ret.editor = {
          type: 'dropdown',
          values: dropList.COD,
          labels: dropList.TXT,
          editable : ret.editable, 
          styleName : 'middle_column', 
          enabled: false
        }
        return ret
      },
    },
    { 
      fieldName: 'PROCESS_DETAIL', dataType: 'text', width: '150', styleName: 'left-column',editable:true, renderer: { showTooltip: true, },
      header: { text: t('설비명(Tag 번호)') },
      // header: { text: t('세부 설비명') },
      // 'styleCallback': function(grid, dataCell){
      //   var ret = {editable : true, styleName : 'left-column', enabled: false, style: {background:undefined, textAlignment: 'near'}}
      //   var detailSeq = grid.getValue(dataCell.index.itemIndex, 'PROCESS_DETAIL_SEQ');

      //   if (detailSeq > 0) {
      //     ret.editable = false;
      //   }
      //   else
      //   {
      //     ret.editable = true;
      //   }

      //   ret.editor = {
      //     editable : ret.editable, 
      //     styleName : 'left-column', 
      //     enabled: false
      //   }
      //   return ret
      // }
    },
    {
      fieldName: 'TAG_NO', dataType: 'text', width: '75', editable: false,
      header: { text: t('Tag 번호') },
      displayCallback: function (grd, idx, val) {
        let result = ''

        const temp = grd.getValue(idx.itemIndex, 'PROCESS_DETAIL')
        if(temp.indexOf('(') > -1 && temp.indexOf(')') > 0) {
          result = temp.substring(temp.indexOf('(') + 1, temp.indexOf(')'))
        }

        return result
      },
    },
    {
      fieldName: 'RUN_YN', dataType: 'text', width: '100', styleName: 'center-column',editable:true,
      header: { text: t('운영여부') },
      renderer: { type: 'check', trueValues: 'true', falseValues: 'false' }
    },
    {
      fieldName: 'PROCESS_HIS', dataType: 'text', width: '100', styleName: 'center-column', editable:false,
      header: { text: t('설비이력') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'PROCESS_HIS_SEQ')
          if (value == 0) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >미등록</button>
              </div>
            `;
          } else { 
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >등록/조회</button>
              </div>
            `;
          }
        }
      }
    },
    {
      fieldName: 'PROCESS_GRD', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('설비등급') }, lookupDisplay: true, editable : false,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: 'INSP_CYCLE', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('주기') }, lookupDisplay: true, editable : false,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 6, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: 'GRD_REV', dataType: 'text', width: '100', styleName: 'center-column', editable:false,
      header: { text: t('검토') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'PROCESS_GRADE_SEQ')
          if (value == 0) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >미등록</button>
              </div>
            `;
          } else { 
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >등록/조회</button>
              </div>
            `;
          }
        }
      }
    },
    {
      fieldName: 'GRD_REV_DATE', dataType: 'text', width: '120', styleName: 'center-column', editable:false,
      header: { text: t('검토일자') }, 
    },
    {
      fieldName: 'INSP_DT', dataType: 'text', width: '120', styleName: 'center-column', editable:true,
      header: { text: t('점검일자') },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        }, 
      },
      styleCallback: function (grid, dataCell) {
        const itemIndex = dataCell.index.itemIndex;
        const rowValue = grid.getValue(itemIndex, 'PROCESS_GRADE_SEQ');
        
        if (rowValue === 0 || rowValue === '0') {
          return {
            editable: false,
            styleName: 'disabled-column'  // 시각적으로 구분하고 싶으면 별도 스타일 지정
          };
        }
        return { editable: true };
      }
    },
    {
      fieldName: 'FILE_YN', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('결과입력\n(첨부업로드)')}, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_YN')
          if (value == 'Y') {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부 완료</button>
              </div>
            `;
          // } else if(value == 'N'){ 
          }else{ 
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
              </div>
            `;
          }
        }
      }
    },
    {
      fieldName: 'NXT_INSP_DT', dataType: 'text', width: '120', styleName: 'center-column', editable:false,
      header: { text: t('차기점검일자') }, 
      'styleCallback': function(grid, dataCell){
        var ret = { editable : false, styleName : 'editable_column', enabled: true }
        const value = dataCell.value;
          
        if (!value) return null;
          
        if(value < today.value)
        {
          ret.style = {background:'#FFCCCC'}
        }
        else if(value == today.value)
        {
          ret.style = {background:'#FFF8B3'}
        }
        else
        {
          ret.style = {background:'#CCFFCC'}
        }
        return ret
      }
    },
    {
      fieldName: 'REMARKS', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('비고') }, 
    },
    // { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    // { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    // { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'PROCESS_DETAIL_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'PROCESS_HIS_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'PROCESS_GRADE_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'PROCESS_HISTORY_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false, },
    { fieldName: 'OLD_DETAIL', dataType: 'text', visible: false, },
    { fieldName: 'OLD_DETAIL_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'IS_EXCEL', dataType: 'text', visible: false, },
    { fieldName: 'HAS_ERR', dataType: 'text', visible: false, },
    { fieldName: 'ERR_BSNS_CD', dataType: 'text', visible: false, },
    { fieldName: 'ERR_DEPT_CD', dataType: 'text', visible: false, },
    { fieldName: 'ERR_PROCESS_CD', dataType: 'text', visible: false, },
    { fieldName: 'ERR_PROCESS_DETAIL', dataType: 'text', visible: false, },
  ],
  columns : [],
  columnLayout :[
    'BSNS_CD','DEPT_CD',
    {
      name:'설비 관리 현황',
      direction: 'horizontal',
      items:['PROCESS_CD', 'PROCESS_DETAIL', 'TAG_NO', 'RUN_YN', 'PROCESS_HIS']
    },
    {
      name:'설비 등급 분류',
      direction: 'horizontal',
      items:['PROCESS_GRD','INSP_CYCLE', 'GRD_REV','GRD_REV_DATE']
    },
    {
      name:'설비 점검 결과',
      direction: 'horizontal',
      items:['INSP_DT','FILE_YN', 'NXT_INSP_DT']
    },
    // 'REMARKS','BSNS_CD','DEPT_CD','PROCESS_CD','PROCESS_HIS_SEQ','PROCESS_GRD_SEQ','FILE_ID'
    'REMARKS','PROCESS_HIS_SEQ','PROCESS_GRADE_SEQ','FILE_ID','PROCESS_HISTORY_SEQ','PROCESS_DETAIL_SEQ','OLD_DETAIL','OLD_DETAIL_SEQ'
  ]
})

grdMain1Props.columns = grdMain1Props.fields

onMounted(() => {
  
  // PSM 관리자 확인
  // 2: PSM 모듈 관리자, 1: PSM 부서 담당자, 0: 일반 사용자
  if(
    useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes("SPPF001")
  ) {
    isAdmin.value = 2
  }else if(userStore.authGrpCd.includes("SPPF002")) {
    isAdmin.value = 1
  }
  // if(isAdmin.value === 0) {
  //   return
  // }
  if(isAdmin.value==0)
  {
    menuTitle.value.visibleBtn('btnCreate',false);
  }
  else
  {
    menuTitle.value.visibleBtn('btnCreate',true);
  }
  
  initCodeList()
  // getData()

  grdMain1.value.getGridView().header.height = 80
  grdMain1.value.getGridView().header.textWrap = true
  grdMain1.value.getGridView().filterPanel.visible = true

  grdMain1.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    let ret = { style: {} }
    
    if (grid.getValue(item.index, 'HAS_ERR') === 'Y') {
      ret.style = { 'background-color': '#FF8888' }
    }

    return ret
  })

  grdMain1.value.getGridView().onShowTooltip = function(grid, index, value) {
    const column = index.column
    const itemIndex = index.itemIndex
    let tooltip = ''

    if (grid.getValue(itemIndex, 'HAS_ERR') === 'Y') {
      tooltip = grid.getValue(itemIndex, `ERR_${column}`)
    }

    return tooltip
  }
})

const rowNum = ref(null);
const inspDt = ref(null);

// 셀 클릭 이벤트
const onCellItemClicked = (grid, index, col) => {
  let openPage
  let FILE_ID
  if (col.fieldName === 'PROCESS_HIS') {  
    let rowData = grdMain1.value.getDataProvider().getJsonRow(col.dataRow)
    let GRD_SEQ=rowData.PROCESS_GRADE_SEQ
    let HIS_SEQ=rowData.PROCESS_HIS_SEQ
    
    if(GRD_SEQ==0)
    {
      return Message.warn(t('설비 등급 분류의 검토를 먼저 작성 후 이력등록을 해주세요'))
    }

    if(HIS_SEQ==0)
    {
      isNew.value='Y'
    }
    else
    {
      isNew.value='N'
    }
    openPage = col.fieldName
    
  }
  else if(col.fieldName=='GRD_REV')
  {
    let rowData = grdMain1.value.getDataProvider().getJsonRow(col.dataRow)
    let GRD_SEQ=rowData.PROCESS_GRADE_SEQ
    
    if(GRD_SEQ==0)
    {
      isNew.value='Y'
    }
    else
    {
      isNew.value='N'
    }
    openPage = col.fieldName
  }
  else if(col.fieldName=='FILE_YN')
  {
    let rowData = grdMain1.value.getDataProvider().getJsonRow(col.dataRow)
    FILE_ID=rowData.FILE_ID
  }

  
  if(col.fieldName === 'PROCESS_HIS' || col.fieldName=='GRD_REV'){
    let rowData = grdMain1.value.getDataProvider().getJsonRow(col.dataRow)
    bsnsCd.value = rowData.BSNS_CD
    deptCd.value = rowData.DEPT_CD
    processCd.value = rowData.PROCESS_CD
    
    bsnsNm.value = codeList.bsnscd.find(o=>o.BSNS_CD==rowData.BSNS_CD)?.BSNS_NM||''
    deptNm.value = codeList.deptcd.find(o=>o.DEPT_CD==rowData.DEPT_CD)?.DEPT_NM||''
    processNm.value = codeList.process.find(o=>o.COD==rowData.PROCESS_CD)?.TXT||''
    processDetail.value = rowData.PROCESS_DETAIL
    processDetailSeq.value = rowData.PROCESS_DETAIL_SEQ

    // console.log(bsnsCd.value)
    // console.log(codeList.bsnscd)
    // console.log(codeList.bsnscd.find(o=>o.BSNS_CD==rowData.BSNS_CD)?.BSNS_NM)
    // console.log(deptCd.value)
    // console.log(codeList.deptcd)
    // console.log(codeList.deptcd.find(o=>o.DEPT_CD==rowData.DEPT_CD)?.DEPT_NM)
    // console.log(processCd.value)
    // console.log(codeList.process)
    // console.log(codeList.process.find(o=>o.COD==rowData.PROCESS_CD)?.TXT)

    openPopup(openPage);
  }
  else if(col.fieldName=='FILE_YN')
  {
    let rowData = grdMain1.value.getDataProvider().getJsonRow(col.dataRow)
    if(rowData.PROCESS_GRADE_SEQ==0)
    {
      return Message.warn(t('설비 등급 분류의 검토를 먼저 작성 후 첨부업로드가 가능합니다.'))
    } 

    bsnsCd.value = rowData.BSNS_CD
    deptCd.value = rowData.DEPT_CD
    processCd.value = rowData.PROCESS_CD
    processDetail.value = rowData.PROCESS_DETAIL
    processDetailSeq.value = rowData.PROCESS_DETAIL_SEQ
    processHisSeq.value = rowData.PROCESS_HISTORY_SEQ
    inspDt.value = rowData.INSP_DT

    rowNum.value=col.dataRow
    MIUploadPopup.value.openPopup(FILE_ID);
  }
}

const upDate =()=>{

  getData()
  // onButtonsClick({id:"btnSearch"});

}

const uploaded =(val)=>{
  
  let fId=val.fileId;
  if(!inspDt.value)
  {
    inspDt.value=dayjs().format("YYYY-MM-DD");
  }
  
  
    commonExecuteApi({ queryId: 'SPPFF0010_SAVE_06', 
                  list: [{
                    CMPNY_DIV:userStore.cmpnyDiv,
                    BSNS_CD : bsnsCd.value,
                    DEPT_CD : deptCd.value,
                    PROCESS_CD : processCd.value,
                    PROCESS_DETAIL : processDetail.value,
                    PROCESS_DETAIL_SEQ : processDetailSeq.value,
                    INSP_DT : !inspDt.value ? '' : inspDt.value,
                    FILE_ID : fId,
                    USER_ID : userStore.userId,
                        }] }).then((res)=>{
                  onButtonsClick({id:"btnSearch"});
                  })
}

const closed = (val) =>
{
  if(val)
  {
    getData()
  }
}


// let editingOldValue = null;

// const onEditChange = (grid, index, value) =>{
//   // 최초 편집 시작할 때 이전 값 저장
//   let a = grdMain1.value.getDataProvider().getJsonRow(index.itemIndex)
//   if (editingOldValue === null) {
//     editingOldValue = a.PROCESS_DETAIL;
//   }
// };

// const onCellEdited = (grid, itemIndex, dataRow, field) =>{
//   const provider = grdMain1.value.getDataProvider();
//   const fieldName = provider.getFieldName(field);

//   const newValue = provider.getValue(dataRow, field);

//   console.log("필드:", fieldName, "이전 값:", editingOldValue, "현재 값:", newValue);

//   // 다음 편집 대비 초기화
//   editingOldValue = null;
// };

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnSearch','btnCreate','btnUpdate','btnDelete','btnProcessGrade','btnProcessHistory', 'btnExcelUpload', 'btnSampleDown']"
        @click-button="onButtonsClick"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('사업부')"
              v-model="selectedBsnsCd"
              :items="codeList.bsnscd"
              item-title="BSNS_NM"
              item-value="BSNS_CD" 
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('부서')"
              v-model="selectedDeptCd"
              :items="codeList.deptcd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="100px"
              width="300px"
              :label="$t('PSM 대상 설비')"
              v-model="searchParams.PROCESS_CD"
              :items="codeList.process"
              item-title="TXT"
              item-value="COD"
            />
          </div>
        </v-sheet>
        <VRow no-gutters style="height 50%">
          <VCol class="pa-2 pt-0 pb-0" style="height:93%">
            <RealGrid
              ref="grdMain1"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys" 
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
              :column-layout="grdMain1Props.columnLayout"
              @onCellItemClicked="onCellItemClicked" 
            />
              <!-- @onEditChange="onEditChange"
              @onCellEdited="onCellEdited" -->
          </VCol>
        </VRow>
      </div>

      <IUploadPopup ref="MIUploadPopup" 
      gridTitle="첨부파일"
      width="1200" 
      height="800" 
      @uploaded = "uploaded"></IUploadPopup>
      <SPPFF0010Popup01 ref="SPPFF0010_Popup01" @closed="closed"/>
      <SPPFF0010Popup02 ref="SPPFF0010_Popup02" @closed="closed"/>
      <input ref="uploadInput" type="file" hidden @input="uploadData" accept=".xlsx,.xls" />
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

::v-deep(.rg-header .rg-table tr td) {
  white-space: pre-line !important;
}
</style>
