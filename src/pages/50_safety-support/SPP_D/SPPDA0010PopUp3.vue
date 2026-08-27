<!-- SPPDB0010 위험기계기구 안전검사 / 위험기계 정보 일괄변경 -->
<!-- SI2팀 이민규 2024-04-29 -->

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from "@hiway/stores/user";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper";
import {commonExecuteApi, commonExecuteApi2, getCodeList, commonSearchApi} from '@hiway/api/commonApi'
import { commonSampleDownFilesApi} from "@hiway/api/commonFileApi"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import dayjs from "dayjs"
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
defineOptions({
  name:'50_safety-support-SPP_D-SPPDA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore =  useUserStore()
const grdMain = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false);
const iUploadPopup = ref(null);
const emit = defineEmits(["reSearch"])
const menuTitle = ref(null)
const topMenuTitle = ref(null)
const isDsabled = ref(false)
const masterData = reactive({
  CMPNY_DIV:userStore.cmpnyDiv,
  TEST_ID:'',
  STATUS:'',
  PLAN_DT_FROM:'',
  PLAN_DT_TO:'',
  REMARK:'',
  ATTACH_ID:'',
  ATTACH_YN:'N',
  USER_ID: userStore.userId,
})

//일괄적용
const inputApply = reactive({
  TEST_DIV:'10',
  TEST_DT:'',
  TEST_AGENCY:'A001',
  INSPECTOR:'',
  EXPIRATION_FROM:'',
  EXPIRATION_TO:'',
  NEXT_TEST_DT:'',
  TEST_RESULT:'Y'
})

const chkApply = reactive({
  TEST_DIV:'Y',
  TEST_DT:'Y',
  TEST_AGENCY:'Y',
  INSPECTOR:'N',
  EXPIRATION:'N',
  NEXT_TEST_DT:'N',
  TEST_RESULT:'Y'
})

const chkForm = reactive({
  TEST_DT: 'N',
  TEST_RESULT: 'N',
  PASS_NO:'N',
  EXPIRATION_DT:'N',
  NEXT_TEST_DT:'N',
  TEST_AGENCY:'N',
  INSPECTOR:'N',
  REMARK:'N'
})

const codeList =reactive({
  TEST_RESULT : [],
})

const openPopup = (param) => {

  dialog.value = true
  isDsabled.value = false
  
  masterData.CMPNY_DIV = param.CMPNY_DIV
  masterData.TEST_ID = param.TEST_ID
  masterData.STATUS = param.STATUS
  masterData.PLAN_DT_FROM = dayjs(param.PLAN_DT_FROM).format('YYYY-MM-DD')
  masterData.PLAN_DT_TO = dayjs(param.PLAN_DT_TO).format('YYYY-MM-DD')
  masterData.REMARK = param.REMARK
  masterData.ATTACH_ID = param.ATTACH_ID
  masterData.USER_ID = userStore.userId

  if(masterData.ATTACH_ID){
    masterData.ATTACH_YN = 'Y'
  }

  searchGrdData()
  
  initCodeList()

  nextTick(() => {
    
    if(masterData.STATUS === '40'){      
      isDsabled.value = true
      // menuTitle.value.disableBtn("btnUpdate", true)
      topMenuTitle.value.disableBtn("btnFormDown", true)
      topMenuTitle.value.disableBtn("btnFromUpload", true)      
    }
  })
}

const onButtonsClick = async(btn)=>{
  if(btn.id == 'btnFormDown'){
    let params = {
      PATH : 'Excel',
      FILE_PATH: 'SPP_D',
      FILE_NAME: 'FB4013.xlsx',
    };
    commonSampleDownFilesApi(params);
  
  }else if(btn.id == 'btnFromUpload'){
    const input = document.createElement('input')

    if (grdMain.value.getDataProvider().rowCount === 0) {
      return Message.err("데이터가 없습니다.")
    }

    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]
      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
    
  }else if(btn.id ==='btnClose'){
    dialog.value = false
    emit('reSearch')
  }else if(btn.id ==='btnInspectionEquip'){
    new saveFlowHelper(vm, t)
      // .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveDataGrid)
      .setAfter()
      .run()
  }
  else if(btn.id ==='btnDelete'){
      new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(deleteCheck)
      .setQuery(deleteData)
      .setAfter(() => { 
        searchGrdData()
      })
      .run()
  }
}

const deleteCheck = () =>{
  let checkedRow =  grdMain.value.getGridView().getCheckedRows()
  if(checkedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  return true
}

const deleteData = () =>{

  let delParam = []
  let checkedRow =  grdMain.value.getGridView().getCheckedRows()
  for(let i of checkedRow){
    let data =  grdMain.value.getDataProvider().getJsonRow(i)
    delParam.push(data)
  }
  console.log(delParam)

  return commonExecuteApi({ queryId : 'SPPDA0010_DELETE_02', list: delParam })

}

//일괄적용 클릭
const btnApplyClick = async () =>{
  
  grdMain.value.getGridView().checkAll(true)  
  

  let rowData = await grdMain.value.getDataProvider().getJsonRows()

  rowData.forEach((item, idx) => {

    if(chkApply.TEST_DIV === 'Y') grdMain.value.getGridView().setValue(idx, "TEST_DIV", inputApply.TEST_DIV)
    if(chkApply.TEST_AGENCY === 'Y') grdMain.value.getGridView().setValue(idx, "TEST_AGENCY", inputApply.TEST_AGENCY)
    if(chkApply.INSPECTOR === 'Y') grdMain.value.getGridView().setValue(idx, "INSPECTOR", inputApply.INSPECTOR)
    if(chkApply.TEST_RESULT === 'Y') grdMain.value.getGridView().setValue(idx, "TEST_RESULT", inputApply.TEST_RESULT)
    
    if(chkApply.TEST_DT === 'Y'){
      grdMain.value.getGridView().setValue(idx, "TEST_DT", inputApply.TEST_DT)
      
      if(inputApply.TEST_DIV === '20'){
        console.log('20',inputApply.TEST_DIV )
        grdMain.value.getGridView().setValue(idx, "EXPIRATION_TO", dayjs(inputApply.TEST_DT).add(2,"year").add(-1,"day").format('YYYY-MM-DD'))
        grdMain.value.getGridView().setValue(idx, "NEXT_TEST_DT",  dayjs(inputApply.TEST_DT).add(2,"year").format('YYYY-MM'))
      }else if(inputApply.TEST_DIV === '30'){
        console.log('30',inputApply.TEST_DIV )
        grdMain.value.getGridView().setValue(idx, "EXPIRATION_TO", dayjs(inputApply.TEST_DT).add(3,"year").add(-1,"day").format('YYYY-MM-DD'))
        grdMain.value.getGridView().setValue(idx, "NEXT_TEST_DT",  dayjs(inputApply.TEST_DT).add(3,"year").format('YYYY-MM'))
      }

    } 

    // if(chkApply.EXPIRATION === 'Y' && inputApply.EXPIRATION_FROM && inputApply.EXPIRATION_TO) {    
    //   grdMain.value.getGridView().setValue(idx, "EXPIRATION_FROM", inputApply.EXPIRATION_FROM)
    //   grdMain.value.getGridView().setValue(idx, "EXPIRATION_TO", inputApply.EXPIRATION_TO)
    // }
    //if(chkApply.NEXT_TEST_DT === 'Y' && inputApply.NEXT_TEST_DT) grdMain.value.getGridView().setValue(idx, "NEXT_TEST_DT", inputApply.NEXT_TEST_DT)

    // 유효기간from 숨김, 차기검사년도 숨김
    // [검사 일자] 일괄적용시
    // [구분]이 검사 + 2년, 인증 + 3년
    // [유효기간TO] : 검사일자 + 2 or 3년 - 1일 자동입력
    // [차기검사년도] : 검사일자 + 2 or 3년 자동입력
  })
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {
  console.log('[excelUploadCallback] excelData : ', excelData)

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  let mappedData = []

  excelData.forEach((i,idx) => {
    if(idx < 6) return
    
    let items = {
      EQUIP_KIND: i['위험기계검사 결과 일괄업로드 양식'],
      EQUIP_SEQ: String(i['__EMPTY']),
      TEST_DT: String(i['__EMPTY_1']),
      TEST_RESULT: i['__EMPTY_2'],
      PASS_NO: i['__EMPTY_3'],
      EXPIRATION_FROM: String(i['__EMPTY_4']),
      EXPIRATION_TO: String(i['__EMPTY_5']),
      NEXT_TEST_DT: String(i['__EMPTY_6']),    // 차기검사년도 YYYYMM
      TEST_AGENCY: i['__EMPTY_7'],                //검사기관코드
      INSPECTOR: i['__EMPTY_8'],                  //검사원
      REMARK: i['__EMPTY_9'],                     //비고
    }
    mappedData.push(items)
  })

  console.log('[excelUploadCallback] mappedData : ', mappedData)

  // grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  if(mappedData.length > 0){
    mappedData.forEach(item => {

      for(let i=0; i <grdMainData.length;i++)
      {
        let val = grdMainData[i]

        if((val.EQUIP_KIND === item.EQUIP_KIND) && (val.EQUIP_SEQ === item.EQUIP_SEQ)) {
          if(chkForm.TEST_DT === 'Y') grdMain.value.getDataProvider().setValue(i, 'TEST_DT', dayjs(item.TEST_DT).format('YYYY-MM-DD'))
          if(chkForm.TEST_RESULT === 'Y') grdMain.value.getDataProvider().setValue(i, 'TEST_RESULT', item.TEST_RESULT )
          if(chkForm.PASS_NO === 'Y') grdMain.value.getDataProvider().setValue(i, 'PASS_NO', item.PASS_NO )
          if(chkForm.EXPIRATION_DT === 'Y') grdMain.value.getDataProvider().setValue(i, 'EXPIRATION_FROM', dayjs(item.EXPIRATION_FROM).format('YYYY-MM-DD') )
          if(chkForm.EXPIRATION_DT === 'Y') grdMain.value.getDataProvider().setValue(i, 'EXPIRATION_TO', dayjs(item.EXPIRATION_TO).format('YYYY-MM-DD') )
          if(chkForm.NEXT_TEST_DT === 'Y') grdMain.value.getDataProvider().setValue(i, 'NEXT_TEST_DT', dayjs(item.NEXT_TEST_DT).format('YYYY-MM') )
          if(chkForm.TEST_AGENCY === 'Y') grdMain.value.getDataProvider().setValue(i, 'TEST_AGENCY', item.TEST_AGENCY )
          if(chkForm.INSPECTOR === 'Y') grdMain.value.getDataProvider().setValue(i, 'INSPECTOR', item.INSPECTOR )
          if(chkForm.REMARK === 'Y') grdMain.value.getDataProvider().setValue(i, 'REMARK', item.REMARK )
          grdMain.value.getGridView().checkItem(i,true)
        }
      }
    })
  }
}

const cellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {

    var ret = {}    

   if(dataCell.dataColumn.index > 5 && dataCell.dataColumn.index < 13){
      // if(masterData.STATUS === '40'){
      //   ret.editable = false;
      //   ret.styleName = "";
      // }else{
        ret.editable = true;
        ret.styleName = "editable_column";
      // }
   }
    return ret
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar:{visible: true}},
  keys : ['EQUIP_KIND','EQUIP_SEQ'],
  fields : [ 
    { fieldName: 'EQUIP_KIND', dataType: 'text', width: '100', header: { text: t('장비군') }, lookupDisplay:true, editable:false },
    { fieldName: 'MANAGE_DEPT_NM', dataType: 'text', width: '120', header: { text: t('관리부서') }, styleName:'left-column' , editable:false},
    { fieldName: 'CHARGE_EMP_NM', dataType: 'text', width: '120', type: 'data', header: { text: t('관리담당자') }, editable:false },
    { fieldName: 'ITMANAGER_EMPNM', dataType: 'text', width: '120', type: 'data', header: { text: t('사용부서 담당자') }, editable:false },
    { fieldName: 'EQUIP_NO', dataType: 'text', width: '120', type: 'data', header: { text: t('장비번호') }, editable:false },
    { fieldName: 'STATUS', dataType: 'text', width: '120', type: 'data', header: { text: t('장비상태') }, lookupDisplay:true , editable:false },
    { fieldName: 'TEST_DIV', dataType: 'text', width: '120', type: 'data', header: { text: t('구분') }, lookupDisplay: true , 
      editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true }, required: true, requiredMessage: '[구분]는 필수입니다.', },
    { fieldName: 'TEST_DT', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '120', header: { text: t('검사일자') }, 
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true },}, 
      required: true, requiredMessage: '[검사일자]는 필수입니다.' , },
    { fieldName: 'TEST_RESULT', dataType: 'text', width: '120', type: 'data', header: { text: t('검사결과') }, lookupDisplay: true ,
      editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true }, required: true, requiredMessage: '[검사결과]는 필수입니다.', },
    { fieldName: 'PASS_NO', dataType: 'text', width: '120', type: 'data', header: { text: t('합격번호') }, required: true, requiredMessage: '[합격번호]는 필수입니다.', },
    { fieldName: 'EXPIRATION_FROM', dataType: 'datetime', width: '120', type: 'data', header: { text: t('유효기간FROM') }, visible: false, 
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true },}, },
    { fieldName: 'EXPIRATION_TO', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '120', type: 'data', header: { text: t('유효기간TO') }, required: true, requiredMessage: '[유효기간]는 필수입니다.',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true },}, },
    { fieldName: 'NEXT_TEST_DT', dataType: 'datetime',  datetimeFormat: 'yyyy-MM', width: '120', type: 'data', header: { text: t('차기검사년도') }, required: true, requiredMessage: '[차기검사년도]는 필수입니다.',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM', mask: { editMask: '9999-99', placeHolder: 'yyyy-MM', includedFormat: true },}, },    
    { fieldName: 'TEST_AGENCY', dataType: 'text', width: '100', header: { text: t('검사기관') } , lookupDisplay: true, styleName:'left_column' , required: true, requiredMessage: '[검사기관]는 필수입니다.',
      editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true } , },
    { fieldName: 'INSPECTOR', dataType: 'text', width: '100', header: { text: t('검사원') }, },
    { fieldName: 'USE_DEPT_NM', dataType: 'text', width: '120', type: 'data', header: { text: t('사용부서') }, styleName:'left-column', editable:false }, 
    { fieldName: 'INSTALL_PLACE', dataType: 'text', width: '120', type: 'data', header: { text: t('설치위치') }, styleName:'left-column', editable:false},
    { fieldName: 'INSTALL_DT', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '120', header: { text: t('설치일자') },
    editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true },}, },
    { fieldName: 'MAKER', dataType: 'text', width: '120', type: 'data', header: { text: t('제조사') }, styleName:'left-column', editable:false },
    { fieldName: 'TRMS_NO', dataType: 'text', width: '120', type: 'data', header: { text: t('설비번호(TRMS)') }, editable:false },
    { fieldName: 'REMARK', dataType: 'text', width: '200', header: { text: t('비고') }, styleName:'left-column' },
    
    { fieldName: 'EQUIP_KIND2', dataType: 'text', width: '100' },
    { fieldName: 'EQUIP_SEQ', dataType: 'text', width: '100',  header: { text: t('장비ID') }, editable:false },
    
    // 출력 안함
    { fieldName: 'CFM_YN', dataType: 'text', width: '100', header: { text: t('부서확인') } , editable:false, visible:false},
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'TEST_ID', dataType: 'text' , visible: false },
    { fieldName: 'EQUIP_COMPANY', visible:false },
    
  ],
  columns : [],
  columnLayout:[
    'EQUIP_KIND',
    "EQUIP_SEQ",
    'MANAGE_DEPT_NM',
    'CHARGE_EMP_NM',
    'EQUIP_NO',
    'STATUS',
    {
      name: '안전검사/인증',
      direction: 'horizontal',
      items: [
        'TEST_DIV',
        'TEST_DT',
        'TEST_RESULT',
        'PASS_NO',
        'EXPIRATION_FROM',
        'EXPIRATION_TO',
        'NEXT_TEST_DT',                         
        'TEST_AGENCY',                          
        'INSPECTOR'                                              
      ],
      header: {
        text: t('안전검사/인증'),
      },
    },
    'CFM_YN',
    {
      name: '설치사양',
      direction: 'horizontal',
      items: [
        'INSTALL_PLACE',
        'INSTALL_DT',                          
        'MAKER',                          
      ],
      header: {
        text: t('설치사양'),
      },
    },
    'USE_DEPT_NM',
    'TRMS_NO',
    'REMARK'
  ],
})

grdMainProps.columns = grdMainProps.fields

defineExpose({
  openPopup,
});

const searchGrdData = () => {
  new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(true)
      .run()
}

const searchData = () => {

  let search = {}

   search.CMPNY_DIV = masterData.CMPNY_DIV
   search.TEST_ID = masterData.TEST_ID
   search.CHARGE_EMP_NO = masterData.CHARGE_EMP_NO

  return commonSearchApi({queryId: "SPPDA0010_SEARCH_06", param: search })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  cellStyle()
  console.log('res', res)
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIFB120'), //상태
    getCodeList('HHIFB130'), //검사구분
    getCodeList('HHIF816'), //검사기관
    getCodeList("HHIF810"), //장비군
    //getCodeList("HHIFB110"), //장비상태
  ]).then(res => {
    codeList.STATUS = res[0].ORESULT_CUR
    codeList.TEST_DIV = res[1].ORESULT_CUR
    codeList.TEST_AGENCY = res[2].ORESULT_CUR
    codeList.TEST_RESULT = [{ TXT: "합격", COD: "Y"  },{ TXT: "불합격", COD: "N" }]

    grdMain.value.setBindingColumn("STATUS",res[0].ORESULT_CUR,"COD","TXT");
    grdMain.value.setBindingColumn("TEST_DIV", res[1].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("TEST_AGENCY", res[2].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("EQUIP_KIND",res[3].ORESULT_CUR,"COD","TXT")
    grdMain.value.setBindingColumn("TEST_RESULT", codeList.TEST_RESULT,"COD","TXT")
  })
}

const btnSaveClick = () => {
  if(masterData.STATUS === '40'){      
    new saveFlowHelper(vm, t)          
          .setBefore(mainValidationCheck)
          .setQuery(saveData2)
          .setAfter(() => {
            emit('reSearch')
            dialog.value = false
          })
          .run()
    }else{
      grdMain.value.getGridView().checkAll(true)

      new saveFlowHelper(vm, t)
          .setTargetGridRow([{ grid:grdMain, row: 'check' }])
          .setBefore(mainValidationCheck)
          .setQuery(saveData)
          .setAfter(() => {
            emit('reSearch')
            dialog.value = false
          })
          .run()
    }
}

// 유효성 검사
const mainValidationCheck = async () => {
  // 검사 ID 유무 체크
  if (!masterData.TEST_ID) {
    Message.warn(t('검사ID가 없습니다.'));
    return false;
  }

  return true;
}

const saveData = async() => {  
    
grdMain.value.getGridView().checkAll(true)

let chkRow = grdMain.value.getGridView().getCheckedRows()

  let params = []
  chkRow.forEach(async fe => {
    let row = grdMain.value.getDataProvider().getJsonRow(fe)

    row.TEST_DT = dayjs(row.TEST_DT).format("YYYYMMDD")

    if(row.EXPIRATION_FROM) row.EXPIRATION_FROM = dayjs(row.EXPIRATION_FROM).format("YYYYMMDD")
    if(row.EXPIRATION_TO) row.EXPIRATION_TO = dayjs(row.EXPIRATION_TO).format("YYYYMMDD")
    if(row.NEXT_TEST_DT) row.NEXT_TEST_DT = dayjs(row.NEXT_TEST_DT).format("YYYYMM")

    params.push(row)

})

 let result = commonExecuteApi({ queryId : 'SPPDA0010_POPUP_SAVE_05', list: params }).then((rs) => {
    let saveData = {
      CMPNY_DIV:masterData.CMPNY_DIV,
      TEST_ID: masterData.TEST_ID,
      PLAN_DT_FROM:masterData.PLAN_DT_FROM.replaceAll('-',''),
      PLAN_DT_TO:masterData.PLAN_DT_TO.replaceAll('-',''),
      REMARK:masterData.REMARK,
      ATTACH_ID:masterData.ATTACH_ID,
      STATUS:'40',
      USER_ID: userStore.userId,
    }

    return commonExecuteApi2({ queryId : 'SPPDA0010_POPUP_SAVE_04', list: [saveData] })
 })

  return result
}

const saveData2 = async() => {

  let saveData = {
    CMPNY_DIV:masterData.CMPNY_DIV,
    TEST_ID: masterData.TEST_ID,
    PLAN_DT_FROM:masterData.PLAN_DT_FROM.replaceAll('-',''),
    PLAN_DT_TO:masterData.PLAN_DT_TO.replaceAll('-',''),
    REMARK:masterData.REMARK,
    ATTACH_ID:masterData.ATTACH_ID,
    STATUS:'40',
    USER_ID: userStore.userId,
  }

  let result = commonExecuteApi2({ queryId : 'SPPDA0010_POPUP_SAVE_04', list: [saveData] })
  
  return result
}

const beforeSave = async () => {
  let chkRow = grdMain.value.getGridView().getCheckedRows()

  if(chkRow.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  }else {
    let params = []
    // chkRow.forEach(async fe => {
    //   let row = grdMain.value.getDataProvider().getJsonRow(fe)

    //   row.TEST_DT = dayjs(row.TEST_DT).format("YYYYMMDD")

    //   if(row.EXPIRATION_FROM) row.EXPIRATION_FROM = dayjs(row.EXPIRATION_FROM).format("YYYYMMDD")
    //   if(row.EXPIRATION_TO) row.EXPIRATION_TO = dayjs(row.EXPIRATION_TO).format("YYYYMMDD")
    //   if(row.NEXT_TEST_DT) row.NEXT_TEST_DT = dayjs(row.NEXT_TEST_DT).format("YYYYMM")

    //   params.push(row)

    // })

    // return false

    for(let i = 0; i < chkRow.length; i++){
      let row = await grdMain.value.getDataProvider().getJsonRow(chkRow[i]) 
      // console.log("row " , row)

      if(!row.TEST_DIV){
        Message.warn(t('[구분]는 필수입니다.'))
        return 
      }else if(!row.TEST_DT){
        Message.warn(t('[검사일자]는 필수입니다.'))
        return 
      }else if(!row.TEST_RESULT){
        Message.warn(t('[검사결과]는 필수입니다.'))
        return 
      }else if(!row.PASS_NO){
        Message.warn(t('[합격번호]는 필수입니다.'))
        return 
      }else if(!row.EXPIRATION_TO){
        Message.warn(t('[유효기간TO]는 필수입니다.'))
        return 
      }else if(!row.NEXT_TEST_DT){
        Message.warn(t('[차기검사년도]는 필수입니다.'))
        return 
      }

      row.EXPIRATION_FROM = dayjs(row.EXPIRATION_FROM).format("YYYYMMDD")
      row.EXPIRATION_TO = dayjs(row.EXPIRATION_TO).format("YYYYMMDD")
      row.NEXT_TEST_DT = dayjs(row.NEXT_TEST_DT).format("YYYYMMDD")

      params.push(row)
    }

    return true
  }

  
}

const saveDataGrid = () => {
  
  let chkRow = grdMain.value.getGridView().getCheckedRows()

  let params = []
  chkRow.forEach(async fe => {
    let row = grdMain.value.getDataProvider().getJsonRow(fe)

    row.TEST_DT = dayjs(row.TEST_DT).format("YYYYMMDD")

    if(row.EXPIRATION_FROM) row.EXPIRATION_FROM = dayjs(row.EXPIRATION_FROM).format("YYYYMMDD")
    if(row.EXPIRATION_TO) row.EXPIRATION_TO = dayjs(row.EXPIRATION_TO).format("YYYYMMDD")
    if(row.NEXT_TEST_DT) row.NEXT_TEST_DT = dayjs(row.NEXT_TEST_DT).format("YYYYMM")

    params.push(row)

})

return commonExecuteApi({ queryId : 'SPPDA0010_POPUP_SAVE_05', list: params })
}


const fileUploadPopup=()=>{
  if(masterData.ATTACH_ID){
    iUploadPopup.value.openPopup(masterData.ATTACH_ID)
  }else{
    iUploadPopup.value.openPopup()
  }
}

const UpLoaded = (e) => {

 masterData.ATTACH_ID = e.fileId

 if(masterData.ATTACH_ID){
  masterData.ATTACH_YN = 'Y'
 }else{
  'N'
 }
}

const onEditChange = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grid.commit()
  let fieldName = grdMain.value.getDataProvider().getFieldName(field)
  let rowData = grdMain.value.getDataProvider().getJsonRow(dataRow)

  if(fieldName === 'EXPIRATION_TO'){
    grdMain.value.getDataProvider().setValue(dataRow, 'NEXT_TEST_DT', rowData.EXPIRATION_TO )
  }
}


const allcheck = ref('N')

watch(
  () => allcheck.value,
  (newValue, oldValue) => {
    if (newValue === 'Y'){
      Object.keys(chkForm).forEach(key => {
        chkForm[key] = 'Y'
      })
    }else{
      Object.keys(chkForm).forEach(key => {
        chkForm[key] = 'N'
      })
    }
  }
)



</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1200"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">검사결과등록</div>
    <v-card>
    <v-card-title class="pb-0">
      <IGridTitle
      ref="topMenuTitle" 
      :use-permission="false"
      :button-list="['btnFormDown','btnFromUpload','btnClose']"
      @click-button="onButtonsClick"
      class="ma-0"
      />
    </v-card-title>
    <v-card-text class="pa-0 px-2 content-area">
      <v-sheet class="fill-height">
        <v-card-title class="pa-0">검사계획 기본정보</v-card-title>
        <div class="flex-column mb-0 searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('검사ID')"
              top-label
              width="150px"
              v-model="masterData.TEST_ID"              
              readonly
            />
            <i-select
              :label="$t('진행상태')"
              top-label
              width="130px"
              v-model="masterData.STATUS"
              :items="codeList.STATUS"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-input
              width="150px"
              :label="$t('검사계획일')"
              top-label
              v-model="masterData.PLAN_DT_FROM"
              type="date"
              class="mr-0"
              :readonly="isDsabled"
            />
            <i-input
              width="150px"
              :label="$t('')"
              top-label
              v-model="masterData.PLAN_DT_TO"
              type="date"
              :readonly="isDsabled"
            />
            <i-input
            :label="t('비고')"
            top-label
            width="400px"
            v-model="masterData.REMARK"
            />
            <v-btn class="mt-6" @click="btnSaveClick">검사 계획 저장</v-btn>
          </div>          
            <!-- <i-input class="mr-0"
              :label="t('첨부')"
              width="200px"
              v-model="masterData.ATTACH_YN"
              label-width="40px"              
              >
              <template v-slot:append-inner>
                <v-icon icon="mdi-paperclip" @click="fileUploadPopup()"></v-icon>
              </template>
            </i-input>             -->
       </div>     
        <div class="h-auto mt-3">
            <IGridTitle :title="t('검사대상')"
            ref="menuTitle" 
            :button-list="['btnInspectionEquip','btnDelete']"
            @click-button="onButtonsClick"
            />            
            <div class="flex-column mb-3 searchArea justify-space-between">
              <div class="d-flex">
                <div class="ml-3 mt-5 mr-12">일괄적용 조건</div>
                <div class="flex-column">
                  <div class="d-flex">
                    <v-checkbox v-model="chkApply.TEST_DIV" true-value="Y" false-value="N" /> 
                    <i-select
                      v-model="inputApply.TEST_DIV"
                      :label="$t('검사구분')"
                      labelWidth="50px"
                      :items="codeList.TEST_DIV"
                      item-value="COD"
                      width="150px"
                      item-title="TXT"
                    />
                    <v-checkbox v-model="chkApply.TEST_DT" true-value="Y" false-value="N" />
                    <i-input
                      width="200px"
                      :label="$t('검사일자')"
                      labelWidth="50px"
                      v-model="inputApply.TEST_DT"
                      type="date"
                    />
                    <v-checkbox v-model="chkApply.TEST_AGENCY" true-value="Y" false-value="N" /> 
                    <i-select
                      v-model="inputApply.TEST_AGENCY"
                      :label="$t('검사기관')"
                      width="230px"
                      :items="codeList.TEST_AGENCY"
                      item-value="COD"
                      item-title="TXT"
                    />
                    <v-checkbox v-model="chkApply.INSPECTOR" true-value="Y" false-value="N" />
                    <i-input
                      :label="$t('검사원')"
                      width="150px"
                      v-model="inputApply.INSPECTOR"
                    />
                  </div>
                  <div class="d-flex">
                  
                    <v-checkbox v-model="chkApply.TEST_RESULT" true-value="Y" false-value="N" /> 
                    <i-select
                      v-model="inputApply.TEST_RESULT"
                      :label="$t('검사결과')"
                      labelWidth="50px"
                      :items="codeList.TEST_RESULT"
                      item-value="COD"
                      width="150px"
                      item-title="TXT"
                    />
                  </div> 
                </div>
                <div>
                  <v-btn class="mt-3" height="50px" :disabled="isDsabled" @click="btnApplyClick">일괄적용</v-btn>
                </div>
              </div>
              <div class="d-flex mt-2 pa-2 border">
                <div class="mt-2 mr-6">일괄양식 적용대상</div>
                <div class="d-flex mt-2">
                  <v-checkbox class="mr-3" :label="t('검사일자')" v-model="chkForm.TEST_DT" true-value="Y" false-value="N" /> 
                  <v-checkbox class="mr-3" :label="t('검사결과')" v-model="chkForm.TEST_RESULT" true-value="Y" false-value="N" /> 
                  <v-checkbox class="mr-3" :label="t('합격번호')" v-model="chkForm.PASS_NO" true-value="Y" false-value="N" /> 
                  <v-checkbox class="mr-3" :label="t('검사유효기간')" v-model="chkForm.EXPIRATION_DT" true-value="Y" false-value="N" /> 
                  <v-checkbox class="mr-3" :label="t('차기검사년도')" v-model="chkForm.NEXT_TEST_DT" true-value="Y" false-value="N" /> 
                  <v-checkbox class="mr-3" :label="t('검사기관')" v-model="chkForm.TEST_AGENCY" true-value="Y" false-value="N" /> 
                  <v-checkbox class="mr-3" :label="t('감사원')" v-model="chkForm.INSPECTOR" true-value="Y" false-value="N" /> 
                  <v-checkbox :label="t('비고')" v-model="chkForm.REMARK" true-value="Y" false-value="N" /> 
                </div>
                <div class="mt-2" style="margin-left: 200px;">
                  <v-checkbox class="ml-6" :label="t('전체 선택')" v-model="allcheck" true-value="Y" false-value="N" /> 
                </div>
              </div>            
            </div>
            <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
                @onCellClicked="onSelected"
                @onEditRowChanged="onEditChange"
                />
        </div>
          </v-sheet>
    </v-card-text>
    <IUploadPopup @uploaded="UpLoaded($event)" ref ='iUploadPopup' />
  </v-card>
  </v-dialog>

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
    min-height: 700px;
  }
}
</style>
