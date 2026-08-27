<!--
  화면명 : 장비점검 및 유지보수 설비등급평가 입력팝업
  화면개요 : 메인 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted, computed, nextTick } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonRequest2,
  getCodeList,
  commonSearchnoAuthApi
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import RealGrid from '@/components/RealGrid.vue'
import { isEmpty, isNullOrUndefined } from "@/@core/utils"
import { useLogsStore } from '@/@hiway/stores/logs'
import { commonDeletFilesApi } from "@hiway/api/commonFileApi"
import { useCommonStore } from '@/@hiway/stores/common'
import { useRoute } from 'vue-router'
import IUpload from '@/components/IUpload.vue'
import EmpPopup from "@/components/popup/EmpPopup.vue"
import DeptPopup from "@/components/popup/DeptPopup.vue"

const emit = defineEmits(['closed'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const commonStore = useCommonStore()
const route = useRoute()
const userStore = useUserStore()
const fileUpload = ref(null)
const menuTitle = ref(null)
// const fileUploadButton = reactive(["btnDelete"])
// const titleButton = reactive(['btnUpdate','btnPrint','btnClose']);
const titleButton = reactive(['btnClose']);
const isAdmin = ref(0)
const dialog = ref(false)

dayjs.locale('ko')


const userNM= ref(null)

const codeList=reactive({
  processCd:[]
})

const write =ref(null)


const inv = ref(null)
const dept = ref(null)
const content = ref(null)
const sDept = ref(true);
const sSelect = ref(true);
const menu = ref(false)
const grdMain1=ref(false);

const search=ref(false)//저장시 조회
//각 항목에 들어갈 변수
const cmpnyDiv = ref('');//회사
const bsnsCd = ref('');//사업부
const deptCd = ref('')//부서
const processCd = ref('');//공정/설비
const processDetail=ref('')
const processDetailSeq=ref('')
const deptNm = ref('')//부서
const processNm = ref('');//공정/설비
const capacity=ref('');
const instDt=ref('');

const grade = reactive([
  {TXT: '1등급', COD: 1 },
  {TXT: '2등급', COD: 2 },
  {TXT: '3등급', COD: 3 },
  {TXT: '4등급', COD: 4 },
  {TXT: '5등급', COD: 5 },
])

const clyce1 = reactive([
  {TXT: '일일', COD: 'A' },
  {TXT: '주간', COD: 'B' },
  {TXT: '월간', COD: 'C' },
  {TXT: '분기', COD: 'D' },
  {TXT: '반기 또는 연간', COD: 'E' },
])

const clyce2 = [
  { TXT: '반기', COD: 'E1' },
  { TXT: '연간', COD: 'E2' }
];

// const displayDate=ref('')//날짜 보이

const saveParams = reactive({
})

const searchParam = reactive({
})

const detailProcess=reactive({
  processDetailArr:[]
})



const initParams = async (data) => {

  cmpnyDiv.value=data.CMPNY_DIV
  bsnsCd.value=data.BSNS_CD
  deptCd.value=data.DEPT_CD
  processCd.value=data.PROCESS_CD

  const res= await commonSearchnoAuthApi({ queryId: 'SPPFJ0010_SEARCH_19', param: 
  {CMPNY_DIV:cmpnyDiv.value, BSNS_CD:bsnsCd.value, DEPT_CD:deptCd.value, PROCESS_CD:processCd.value} })

  console.log("res:",res);

  detailProcess.processDetailArr=res.ORESULT_CUR

  // processDetail.value=data.PROCESS_DETAIL
  // processDetailSeq.value=data.PROCESS_DETAIL_SEQ
  // deptNm.value = data.DEPT_NM
  // processNm.value = data.PROCESS_NM
  

  grdMain1.value.setBindingColumn("EQP_EVAL_GRADE",grade,'COD','TXT')
  grdMain1.value.setBindingColumn("INSP_CYCLE_1",clyce1,'COD','TXT')
  grdMain1.value.setBindingColumn("INSP_CYCLE_2",clyce2,'COD','TXT')

  // if(data.ISNEW=="N")
  // {    
  //     psiSearch(data)
  // }    
}



const psiSearch = (data) =>
{
  console.log(searchParam)
  commonSearchnoAuthApi({ queryId: 'SPPFJ0010_SEARCH_20', param: searchParam})
  .then(res=>{
    let sData = res.ORESULT_CUR[0];
    console.log("ori Sdata:",sData);
    if(sData)
    { 
      if(sData.EQP_EVAL_GRADE==5)
      {
        sData.INSP_CYCLE_2=sData.INSP_CYCLE
        grdMain1.value.getGridView().columnByName('INSP_CYCLE_1').visible=false;
        grdMain1.value.getGridView().columnByName('INSP_CYCLE_2').visible=true;
      }
      else
      {
        sData.INSP_CYCLE_1=sData.INSP_CYCLE
        grdMain1.value.getGridView().columnByName('INSP_CYCLE_1').visible=true;
        grdMain1.value.getGridView().columnByName('INSP_CYCLE_2').visible=false;
      }
      bsnsCd.value=sData.BSNS_CD
      deptCd.value=sData.DEPT_CD
      processCd.value=sData.PROCESS_CD
      processDetail.value= !sData.PROCESS_DETAIL?sData.INSERT_PROCESS_DETAIL : sData.PROCESS_DETAIL
      processDetailSeq.value=!sData.PROCESS_DETAIL_SEQ?sData.INSERT_PROCESS_DETAIL_SEQ : sData.PROCESS_DETAIL_SEQ
      deptNm.value=sData.DEPT_NM
      processNm.value = !sData.PROCESS_LOC?sData.PROCESS_NM : sData.PROCESS_LOC
      capacity.value=sData.CAPACITY
      instDt.value=sData.INST_DT
      grdMain1.value.getDataProvider().setRows([sData]);

    }
  })
}

// 팝업 초기세팅
const openPopup = async (data) => {
  
  // 변수 초기화 작업
  console.log(data);
  initParams(data)

  // // console.log(data);
  // if(data.DIV=='C' || (data.DIV=='M' && data.WRITE=="Y"))
  // {
  //   menuTitle.value.visibleBtn('btnUpdate', true);
  //   menuTitle.value.visibleBtn('btnTemporaryStorage', true);
  // }
  // else
  // {
  //   menuTitle.value.visibleBtn('btnUpdate', false);
  //   menuTitle.value.visibleBtn('btnTemporaryStorage', false);
  // }

  // if(data.SAVE_STAT=='C')
  // {
  //   menuTitle.value.visibleBtn('btnPrint', true);
  //   menuTitle.value.visibleBtn('btnTemporaryStorage', false);
  // }
  // else
  // {
  //   menuTitle.value.visibleBtn('btnPrint', false);
  // }

  // // 버튼 활성화 여부
  // //menuTitle.value.disableBtn(['btnUpdate'], isDisabled)

  grdMain1.value.getGridView().filterPanel.visible = true
  grdMain1.value.getGridView().header.height = 160;
  grdMain1.value.getGridView().header.textWrap = true;
  grdMain1.value.getDataProvider().setRows([{}]);


  dialog.value =true

}

// 바인딩 데이터 세팅
const setInfo = (isNew, data) => {
  // 권한 세팅
  isAdmin.value = data.isAdmin

  // 팝업 제목 세팅


  // 등록/수정 분기 세팅
  saveParams.SAVE_YN = isNew ? 'Y' : 'N'

  // 변경등록 세팅
  saveParams.BSNS_CD = data.BSNS_CD
  saveParams.DEPT_CD = data.DEPT_CD
  saveParams.PROCESS_CD = data.PROCESS_CD
  saveParams.ITEM_CD = data.ITEM_CD


}

// 활성화 여부(권한)
const isDisabled = computed(() => {
  let isUser = false
  let isFirst = false
  let isRegi = false
  // 1. 관리자 or 본인 (isAdmin.value > 1 || userStore.userId === saveParams.LAST_INSERT_USER_ID) 
  if(isAdmin.value > 1 || userStore.userId === saveParams.LAST_INSERT_USER_ID) {
    isUser = true
  }
  // 2. 가장 최근 등록의 수정만(SAVE_YN === 'N' && LATEST_INSERT_SEQ === 1)
  if(saveParams.SAVE_YN === 'N' && saveParams.LATEST_INSERT_SEQ === '1') {
    isFirst = true
  }
  // 3. 등록일 때(SAVE_YN === 'Y')
  if(saveParams.SAVE_YN === 'Y') {
    isRegi = true
  }
  
  return !((isUser && isFirst) || isRegi)
})

const onButtonsClick = btn => {
  if(btn.id === 'btnClose') {
    closePopup()
  }
  else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id=='btnPrint')
  {
    reportPrint();
  }
}

const beforeSave = () => {

  let checkRow = grdMain1.value.getGridView().getCheckedRows(true)

  if(checkRow.length==0)
  {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }
  
  return true
}

const saveData = async () => {
  
  let checkRow = grdMain1.value.getGridView().getCheckedRows(true)
  let saveData = []

  for(let idx of checkRow)
  {
    let data =grdMain1.value.getDataProvider().getJsonRow(idx)
    data.CMPNY_DIV = userStore.cmpnyDiv
    data.BSNS_CD = bsnsCd.value;
    data.DEPT_CD = deptCd.value;
    data.PROCESS_CD = processCd.value;
    data.PROCESS_DETAIL = processDetail.value;
    data.PROCESS_DETAIL_SEQ = processDetailSeq.value;
    data.DEPT_NM = deptNm.value;
    data.PROCESS_LOC = processNm.value;
    data.CAPACITY = capacity.value;
    data.INST_DT = instDt.value;
    data.USER_ID = userStore.userId;
    
    if(data.EQP_EVAL_GRADE==5)
    {
      data.INSP_CYCLE = data.INSP_CYCLE_2
    }
    else
    {
      data.INSP_CYCLE = data.INSP_CYCLE_1
    }
    saveData.push(data)
  }
  return commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_20', list: saveData })

}

const afterSave = (res) => {
  
  let resdata
  resdata=res.list
          
    let data={
      BSNS_CD : bsnsCd.value,
      DEPT_CD : deptCd.value,
      PROCESS_CD : processCd.value,
      PROCESS_DETAIL: processDetail.value,
      PROCESS_DETAIL_SEQ: processDetailSeq.value
    }
    psiSearch(data)
    search.value=true
  // if(saveStat.value=='C')
  // {
  //   closePopup()
  // }
  
  buttonHide();
}

const closePopup = () => {

  clearPopup();
  dialog.value = false
  emit('closed',search.value)
}
const clearPopup =()=>
{

  grdMain1.value.getDataProvider().clearRows();
}

defineExpose({
  openPopup
})

//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'LCLS', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('대분류'),} ,
    },
    { 
      fieldName: 'SCLS', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('소분류') },
    },
    { 
      fieldName: 'OPI', dataType: 'number', width: '80', styleName: 'right-column',
      header: { text: t('조업영향도\n(20)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 20 && value >= 0",   // 원하는 조건
          message: "0 ~ 20 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'RUN_TIME', dataType: 'number', width: '80', styleName: 'right-column',
      header: { text: t('가동시간\n(10)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 10 && value >= 0",   // 원하는 조건
          message: "0 ~ 10 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'FAIL_OCCUR', dataType: 'number', width: '80', styleName: 'right-column',
      header: { text: t('고장발생도\n(10)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 10 && value >= 0",   // 원하는 조건
          message: "0 ~ 10 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'PROCESS_STAT', dataType: 'number', width: '80', styleName: 'right-column',
      header: { text: t('설비상태\n(10)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 10 && value >= 0",   // 원하는 조건
          message: "0 ~ 10 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'RUN_COND', dataType: 'number', width: '80', styleName: 'right-column',
      header: { text: t('가동조건\n(5)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 5 && value >= 0",   // 원하는 조건
          message: "0 ~ 5 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'PROCESS_YEAR', dataType: 'number', width: '80', styleName: 'right-column',
      header: { text: t('설비연령\n(5)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 5 && value >= 0",   // 원하는 조건
          message: "0 ~ 5 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'PROCESS_MAT_POINT', dataType: 'number', width: '85', styleName: 'right-column',
      header: { text: t('설비유지점검\nPOINT\n(10)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 10 && value >= 0",   // 원하는 조건
          message: "0 ~ 10 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'REPAIR_DIV', dataType: 'number', width: '80', styleName: 'right-column',
      header: { text: t('수선유형\n(5)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 5 && value >= 0",   // 원하는 조건
          message: "0 ~ 5 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'MAT_SUPPLY_FACTOR', dataType: 'number', width: '85', styleName: 'right-column',
      header: { text: t('자재 수급\n요소\n(5)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 5 && value >= 0",   // 원하는 조건
          message: "0 ~ 5 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'DAMAGE', dataType: 'number', width: '100', styleName: 'right-column',
      header: { text: t('인적피해 및\n물적피해\n(20)') }, 
      editor:{
        type:'number'
      },
      validations: [
        {
          criteria: "value <= 20 && value >= 0",   // 원하는 조건
          message: "0 ~ 20 사이의 값만 입력 가능합니다."
        }
      ]
    },
    { 
      fieldName: 'SUM', dataType: 'number', width: '120', styleName: 'right-column', editable: false,
      header: { text: t('합계') }, 
      
    },
    { 
      fieldName: 'EQP_EVAL_GRADE', dataType: 'text', width: '80', styleName: 'center-column',lookupDisplay: true,editable:false,
      header: { text: t('평가등급') }, 
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    { 
      fieldName: 'INSP_MTHD', dataType: 'text', width: '160', styleName: 'center-column',
      header: { text: t('점검방법') }, 
    },
    { 
      fieldName: 'INSP_CYCLE_1', dataType: 'text', width: '80', styleName: 'center-column',lookupDisplay: true, editable:false, visible:true,
      header: { text: t('점검주기') }, 
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    { 
      fieldName: 'INSP_CYCLE_2', dataType: 'text', width: '80', styleName: 'center-column',lookupDisplay: true,visible:false,
      header: { text: t('점검주기\n(반기 또는 연간 선택)') }, 
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    { 
      fieldName: 'INSP', dataType: 'text', width: '160', styleName: 'center-column',
      header: { text: t('정비') }, 
    },
  ],
  columns : [],
  columnLayout :[
    'LCLS','SCLS',
    {
      name:'평가항목',
      direction: 'horizontal',
      items:[
      {name:'공정중요성(30점)',
      direction: 'horizontal',
      items:['OPI','RUN_TIME']},
      {name:'유지보전 및 설비상태(30점)',
      direction: 'horizontal',
      items:['FAIL_OCCUR','PROCESS_STAT','RUN_COND','PROCESS_YEAR','PROCESS_MAT_POINT']},
      {name:'수선유형&자재관련(10점)',
      direction: 'horizontal',
      items:['REPAIR_DIV','MAT_SUPPLY_FACTOR']},
      {name:'위험성(20점)',
      direction: 'horizontal',
      items:['DAMAGE']},
      {name:'평가결과',
      direction: 'horizontal',
      items:['SUM']},
      ]
    },
    {
      name:'설비관리',
      direction: 'horizontal',
      items:['EQP_EVAL_GRADE','INSP_MTHD', 'INSP_CYCLE_1','INSP_CYCLE_2','INSP']
    },
  ]
})

grdMain1Props.columns = grdMain1Props.fields


const reportPrint = () =>{

  let data={
      CMPNY_DIV : userStore.cmpnyDiv,
      BSNS_CD : bsnsCd.value,
      DEPT_CD : deptCd.value,
      PROCESS_CD : processCd.value,
      PROCESS_DETAIL: processDetail.value,
      PROCESS_DETAIL_SEQ: processDetailSeq.value
    }
   
    commonStore.loading = true
    commonRequest2('hse/excel/SPPFF0010_PRINT_01', data).then((res) => {
    commonStore.loading = false

    const blob = new Blob([res], { type: res.type })
    let date=dayjs().format("YYYYMMDDhhmmss")
    
    
    const link = document.createElement('a')
    
    //const fileName = `현황 - ${bsnsNm} ${searchParam.YEAR}년도 ${reqDivNm.trim()} ${reqChaNm} 최종산출`.trim()
    const fileName = `${processDetail.value}_설비 등급 평가표`.trim()

    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
}


const onEditRowChange=( grid, itemIndex, dataRow, field, oldValue, newValue )=>{
  grid.checkItem(dataRow,true)
  grid.commit()
  
  let fieldname=grdMain1.value.getDataProvider().getFieldName(field)
  let OPI = grdMain1.value.getGridView().getValues(dataRow)['OPI']?grdMain1.value.getGridView().getValues(dataRow)['OPI']:0;
  let RUN_TIME = grdMain1.value.getGridView().getValues(dataRow)['RUN_TIME']?grdMain1.value.getGridView().getValues(dataRow)['RUN_TIME']:0;
  let FAIL_OCCUR = grdMain1.value.getGridView().getValues(dataRow)['FAIL_OCCUR']?grdMain1.value.getGridView().getValues(dataRow)['FAIL_OCCUR']:0;
  let PROCESS_STAT = grdMain1.value.getGridView().getValues(dataRow)['PROCESS_STAT']?grdMain1.value.getGridView().getValues(dataRow)['PROCESS_STAT']:0;
  let RUN_COND = grdMain1.value.getGridView().getValues(dataRow)['RUN_COND']?grdMain1.value.getGridView().getValues(dataRow)['RUN_COND']:0;
  let PROCESS_YEAR = grdMain1.value.getGridView().getValues(dataRow)['PROCESS_YEAR']?grdMain1.value.getGridView().getValues(dataRow)['PROCESS_YEAR']:0;
  let PROCESS_MAT_POINT = grdMain1.value.getGridView().getValues(dataRow)['PROCESS_MAT_POINT']?grdMain1.value.getGridView().getValues(dataRow)['PROCESS_MAT_POINT']:0;
  let REPAIR_DIV = grdMain1.value.getGridView().getValues(dataRow)['REPAIR_DIV']?grdMain1.value.getGridView().getValues(dataRow)['REPAIR_DIV']:0;
  let MAT_SUPPLY_FACTOR = grdMain1.value.getGridView().getValues(dataRow)['MAT_SUPPLY_FACTOR']?grdMain1.value.getGridView().getValues(dataRow)['MAT_SUPPLY_FACTOR']:0;
  let DAMAGE = grdMain1.value.getGridView().getValues(dataRow)['DAMAGE']?grdMain1.value.getGridView().getValues(dataRow)['DAMAGE']:0;
  let SUM = 0
  let GRADE, Cycle
  if(fieldname == "OPI" || fieldname == "RUN_TIME" || fieldname == "FAIL_OCCUR" || fieldname == "PROCESS_STAT" || fieldname == "RUN_COND" || 
     fieldname == "PROCESS_YEAR" || fieldname == "PROCESS_MAT_POINT" || fieldname == "REPAIR_DIV" || fieldname == "MAT_SUPPLY_FACTOR" || fieldname == "DAMAGE")
     {
        if(fieldname == "OPI")
        {
          if (newValue < 0 || newValue > 20) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'OPI', null);
            return;
          }
          OPI=newValue
        }
        if(fieldname == "RUN_TIME")
        {
          if (newValue < 0 || newValue > 10) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'RUN_TIME', null);
            return;
          }
          RUN_TIME=newValue
        }
        if(fieldname == "FAIL_OCCUR")
        {
          if (newValue < 0 || newValue > 10) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'FAIL_OCCUR', null);
            return;
          }
          FAIL_OCCUR=newValue
        }
        if(fieldname == "PROCESS_STAT")
        {
          if (newValue < 0 || newValue > 10) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'PROCESS_STAT', null);
            return;
          }
          PROCESS_STAT=newValue
        }
        if(fieldname == "RUN_COND")
        {
          if (newValue < 0 || newValue > 5) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'RUN_COND', null);
            return;
          }
          RUN_COND=newValue
        }
        if(fieldname == "PROCESS_YEAR")
        {
          if (newValue < 0 || newValue > 5) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'PROCESS_YEAR', null);
            return;
          }
          PROCESS_YEAR=newValue
        }
        if(fieldname == "PROCESS_MAT_POINT")
        {
          if (newValue < 0 || newValue > 10) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'PROCESS_MAT_POINT', null);
            return;
          }
          PROCESS_MAT_POINT=newValue
        }
        if(fieldname == "REPAIR_DIV")
        {
          if (newValue < 0 || newValue > 5) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'REPAIR_DIV', null);
            return;
          }
          REPAIR_DIV=newValue
        }
        if(fieldname == "MAT_SUPPLY_FACTOR")
        {
          if (newValue < 0 || newValue > 5) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'MAT_SUPPLY_FACTOR', null);
            return;
          }
          MAT_SUPPLY_FACTOR=newValue
        }
        if(fieldname == "DAMAGE")
        {
          if (newValue < 0 || newValue > 20) {
            grdMain1.value.getDataProvider().setValue(dataRow, 'DAMAGE', null);
            return;
          }
          DAMAGE=newValue
        }
     

     if(OPI >=0 && RUN_TIME >=0 && FAIL_OCCUR >=0 && PROCESS_STAT >=0 && RUN_COND >=0 && PROCESS_YEAR >=0 && PROCESS_MAT_POINT >=0 && 
        REPAIR_DIV >=0 && MAT_SUPPLY_FACTOR >=0 && DAMAGE >=0)
        {
          SUM=OPI + RUN_TIME + FAIL_OCCUR + PROCESS_STAT + RUN_COND + PROCESS_YEAR + PROCESS_MAT_POINT + REPAIR_DIV + MAT_SUPPLY_FACTOR + DAMAGE
        }
    // console.log("SUM:",SUM)
    grdMain1.value.getDataProvider().setValue(dataRow,'SUM',SUM);

    if(SUM!=0)
    {
      if(SUM >= 90)
      {
        // console.log("1")
        GRADE = 1
      }
      else if(SUM >= 80)
      {
        // console.log("2")
        GRADE = 2
      }
      else if(SUM >= 70)
      {
        // console.log("3")
        GRADE = 3
      }
      else if(SUM >= 60)
      {
        // console.log("4")
        GRADE = 4
      }
      else
      {
        // console.log("5")
        GRADE = 5
      }
    }
    // console.log("GRADE:",GRADE)
    grdMain1.value.getDataProvider().setValue(dataRow,'EQP_EVAL_GRADE',GRADE);

    if(GRADE!=0)
    {

      const gridView = grdMain1.value.getGridView();
      const col1 = gridView.columnByField('INSP_CYCLE_1');
      const col2 = gridView.columnByField('INSP_CYCLE_2');
      if(GRADE == 1)
      {
        col1.visible = true;
        col2.visible = false;
        Cycle = 'A'
        grdMain1.value.getDataProvider().setValue(dataRow,'INSP_CYCLE_1',Cycle);
      }
      else if(GRADE == 2)
      {
        col1.visible = true;
        col2.visible = false;
        Cycle = 'B'
        grdMain1.value.getDataProvider().setValue(dataRow,'INSP_CYCLE_1',Cycle);
      }
      else if(GRADE == 3)
      {
        col1.visible = true;
        col2.visible = false;
        Cycle = 'C'
        grdMain1.value.getDataProvider().setValue(dataRow,'INSP_CYCLE_1',Cycle);
      }
      else if(GRADE == 4)
      {
        col1.visible = true;
        col2.visible = false;
        Cycle = 'D'
        grdMain1.value.getDataProvider().setValue(dataRow,'INSP_CYCLE_1',Cycle);
      }
      else
      {
        col1.visible = false;
        col2.visible = true;
        Cycle = 'E1'
        grdMain1.value.getDataProvider().setValue(dataRow,'INSP_CYCLE_2',Cycle);
      }
    }
  }
    
}

const selectChange = () =>{

  console.log("1")
  searchParam.CMPNY_DIV=cmpnyDiv.value
  searchParam.BSNS_CD=bsnsCd.value
  searchParam.DEPT_CD=deptCd.value
  searchParam.PROCESS_CD=processCd.value
  searchParam.PROCESS_DETAIL=processDetail.value
  searchParam.PROCESS_DETAIL_SEQ=1

  psiSearch()
}

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1800"
    height="500"

  >
    <div class="title-bar">설비등급평가표</div>
    <v-card class="pa-3 fill-height rounded-b-5" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="titleButton"
          :hiddenManuel="true"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <div style="margin:5px">
          <div>
            <i-select
              :label="$t('상세설비')"
              width="30%"
              abel-width="100px"
              placeholder="상세설비"
              v-model="processDetail"
              :items="detailProcess.processDetailArr"
              item-value="PROCESS_DETAIL"
              item-title="PROCESS_DETAIL"
              @update:model-value = "selectChange"
            />
          </div>
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr>
              <th class="table_header">부서명</th>
              <td class="table_data">
                <input class="input_readonly_data" type="text"
                      v-model="deptNm"
                      disabled/>
              </td>
              <th class="table_header">설치장소</th>
              <td class="table_data">
                <input class="input_readonly_data" type="text"
                      v-model="processNm"
                      disabled/>
              </td>
            </tr>
            <tr>
              <th class="table_header">용량</th>
              <td class="table_data">
                <input class="input_data" type="text"
                      v-model="capacity" disabled/>
              </td>
              <th class="table_header">최초 도입일자</th>
              <td class="table_data">
                <input class="input_data" type="date"
                      v-model="instDt" disabled/>
              </td>
            </tr>
          </table>
        </div>
        <div>
          <RealGrid
                      style="height:300px; width:100%;"
                      ref="grdMain1"
                      :grid-view-option="grdMain1Props.gridViewOption"
                      :keys="grdMain1Props.keys" 
                      :fields="grdMain1Props.fields"
                      :columns="grdMain1Props.columns"
                      :column-layout="grdMain1Props.columnLayout"
                      @onEditRowChanged = "onEditRowChange"/>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>

input[readonly],
textarea[readonly] {
  background-color: #f6f6f6 !important;
  color: #888 !important;
  border: 1px solid #dcdcdc !important;
  border-radius: 4px;
  opacity: 1 !important;
  margin : 1px;
}

.table_header{
  text-align: center;
  align-items: start;
  border: 2px solid gray;
  background-color: whitesmoke;
  width : 200px
}

.table_data{
  text-align: left;
  align-items: start;
  border: 2px solid gray;
  padding-left: 5px;
  width : 400px
}

.input_data{
  text-align: left;
  align-items: start;
  border: 2px solid gray;
  padding-left: 5px;
  width : 50%
}

.input_readonly_data{
  text-align: left;
  align-items: start;
  // border: 2px solid gray;
  padding-left: 5px;
  width : 100%
}

::v-deep(.rg-header .rg-table tr td) {
  white-space: pre-line !important;
}
</style>

