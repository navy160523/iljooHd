<!--
  화면명 : 공정사고조사 입력팝업
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
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
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
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import ImgDragDrop from '@/components/IUploadImageDragDrop.vue'
import IButtonList from '@/components/IButtonList.vue'

const emit = defineEmits(['closed'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const commonStore = useCommonStore()
const route = useRoute()
const userStore = useUserStore()
const fileUpload = ref(null)
const menuTitle = ref(null)
// const fileUploadButton = reactive(["btnDelete"])
const titleButton = reactive(['btnUpdate','btnPrint','btnClose']);
const isAdmin = ref(0)
const dialog = ref(false)

dayjs.locale('ko')

const datePickerMenu = ref(false)

const titleInfo = reactive({
  bsns : '',
  dept : '',
  process: '',
})
const userNM= ref(null)
const cPsiType = reactive([
  {TXT: '폭발', COD: 'A' },
  {TXT: '화재', COD: 'B' },
  {TXT: '위험물질 누출', COD: 'C' },
  {TXT: '기타', COD: 'E' },
])
const codeList=reactive({
  processCd:[]
})

const write =ref(null)

const empPopup = ref(null)
const deptPopup = ref(null)
const inv = ref(null)
const dept = ref(null)
const content = ref(null)
const sDept = ref(true);
const sSelect = ref(true);
const menu = ref(false)
const grdMain1=ref(false);
const imgDragDrop1 = ref(null)
const imgDragDrop2 = ref(null)
const iUploadPopup = ref(null)



const search=ref(false)//저장시 조회
//각 항목에 들어갈 변수
const bsnsCd = ref('');//사업부
const deptCd = ref('')//부서
const processCd = ref('');//공정/설비
const processDetail = ref('')
const processDetailSeq = ref('')
const deptNm = ref('')
const processLoc = ref('');
const grade = ref('')
const eqpEvalGrade = ref('')
const cycle = ref('')
const inspCycle = ref('')
const capacity = ref('')
const instDt = ref('')
const manufacturer = ref('')
const processSpec_1 = ref('')
const processSpec_2 = ref('')
const processSpec_3 = ref('')
const processSpec_4 = ref('')
const processMgtNo = ref('')
const fileId_1 =ref('')
const fileId_2 =ref('')


// const displayDate=ref('')//날짜 보이

const saveParams = reactive({
  
})



const initParams = (data) => {

  bsnsCd.value=data.BSNS_CD
  deptCd.value=data.DEPT_CD
  processCd.value=data.PROCESS_CD
  processDetail.value=data.PROCESS_DETAIL
  processDetailSeq.value=data.PROCESS_DETAIL_SEQ
  deptNm.value = data.DEPT_NM
  processLoc.value = data.PROCESS_NM

  if(data.ISNEW=='Y')
  {
    imgDragDrop1.value.setGuid();
    imgDragDrop2.value.setGuid();
    fileId_1.value=imgDragDrop1.value.guid
    fileId_2.value=imgDragDrop2.value.guid
  }
  
  psiSearch(data) 
  
}



const psiSearch = async (data) =>
{
  // console.log("data:",data)
  await commonSearchApi({ queryId: 'SPPFF0010_SEARCH_03', 
                    param: {CMPNY_DIV:userStore.cmpnyDiv, 
                      BSNS_CD : data.BSNS_CD, 
                      DEPT_CD : data.DEPT_CD, 
                      PROCESS_CD : data.PROCESS_CD, 
                      PROCESS_DETAIL : data.PROCESS_DETAIL,
                      PROCESS_DETAIL_SEQ : data.PROCESS_DETAIL_SEQ,
                      IS_NEW  : data.ISNEW} })
  .then(res=>{
    let sData = res.ORESULT_CUR[0];
    if(res.ORESULT_CUR.length>0)
    {
      console.log("sData:",sData);
      if(data.ISNEW=='Y')
      {
        grade.value = sData.GRADE;
        eqpEvalGrade.value = sData.EQP_EVAL_GRADE;
        cycle.value = sData.CYCLE;
        inspCycle.value = sData.INSP_CYCLE;
        capacity.value = sData.CAPACITY;
        instDt.value = sData.INST_DT;
        manufacturer.value = ''
        processSpec_1.value = ''
        processSpec_2.value = ''
        processSpec_3.value = ''
        processSpec_4.value = ''
        processMgtNo.value = ''
      }
      else
      {
        grade.value = sData.GRADE;
        eqpEvalGrade.value = sData.EQP_EVAL_GRADE;
        cycle.value = sData.CYCLE;
        inspCycle.value = sData.INSP_CYCLE;
        capacity.value = sData.CAPACITY;
        instDt.value = sData.INST_DT;
        manufacturer.value = sData.MANUFACTURER
        processSpec_1.value = sData.PROCESS_SPEC_1
        processSpec_2.value = sData.PROCESS_SPEC_2
        processSpec_3.value = sData.PROCESS_SPEC_3
        processSpec_4.value = sData.PROCESS_SPEC_4
        processMgtNo.value = sData.PROCESS_MGT_NO
        fileId_1.value = sData.FILE_ID_1
        fileId_2.value = sData.FILE_ID_2

        if(fileId_1.value)
        {
          imgDragDrop1.value.setGuid(sData.FILE_ID_1);
          imgDragDrop1.value.searchImg()
        }
        if(fileId_2.value)
        {
          imgDragDrop2.value.setGuid(sData.FILE_ID_2);
          imgDragDrop2.value.searchImg()
        }
      } 
    }
  })

  await commonSearchApi({ queryId: 'SPPFF0010_SEARCH_04', 
                    param: {CMPNY_DIV:userStore.cmpnyDiv, 
                      BSNS_CD : data.BSNS_CD, 
                      DEPT_CD : data.DEPT_CD, 
                      PROCESS_CD : data.PROCESS_CD, 
                      PROCESS_DETAIL : data.PROCESS_DETAIL,
                      PROCESS_DETAIL_SEQ : data.PROCESS_DETAIL_SEQ} })
  .then(res=>{
    if(res.ORESULT_CUR.length>0)
    {
      grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

// 팝업 초기세팅
const openPopup = async (data) => {
  
  // 변수 초기화 작업
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
  else if(btn.id=='btnCreate')
  {
    addRows()
  }
  else if(btn.id=='btnDelete')
  {
    removeRows()
  }
}

const beforeSave = () => {

  saveParams.CMPNY_DIV = userStore.cmpnyDiv;
  saveParams.BSNS_CD = bsnsCd.value;
  saveParams.DEPT_CD = deptCd.value;
  saveParams.PROCESS_CD = processCd.value
  saveParams.PROCESS_DETAIL = processDetail.value
  saveParams.PROCESS_DETAIL_SEQ = processDetailSeq.value;
  saveParams.DEPT_NM = deptNm.value;
  saveParams.PROCESS_LOC = processLoc.value;
  saveParams.EQP_EVAL_GRADE = eqpEvalGrade.value;
  saveParams.INSP_CYCLE = inspCycle.value;
  saveParams.CAPACITY = capacity.value;
  saveParams.INST_DT = instDt.value;
  saveParams.MANUFACTURER = manufacturer.value;
  saveParams.PROCESS_SPEC_1 = processSpec_1.value;
  saveParams.PROCESS_SPEC_2 = processSpec_2.value;
  saveParams.PROCESS_SPEC_3 = processSpec_3.value;
  saveParams.PROCESS_SPEC_4 = processSpec_4.value;
  saveParams.PROCESS_MGT_NO = processMgtNo.value;
  saveParams.FILE_ID_1 = fileId_1.value
  saveParams.FILE_ID_2 = fileId_2.value
  saveParams.REMARKS=''
  saveParams.USER_ID = userStore.userId;
  

  return true
}

const saveData = async () => {
  
  // console.log("saveParams:",saveParams);
  return commonExecuteApi({ queryId: 'SPPFF0010_SAVE_03', list: [saveParams] })

}

const afterSave = (res) => {
  try{
  let resdata
  resdata=res.list
    
    if(resdata.length>0)
    {
      const saveData=[];
      
      let rows=grdMain1.value.getDataProvider().getJsonRows();
      
      for(let i=0; i<rows.length;i++)
      {
        const rState=grdMain1.value.getDataProvider().getRowState(i)
        
        const row=rows[i];
        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          BSNS_CD : bsnsCd.value,
          DEPT_CD : deptCd.value,
          PROCESS_CD : processCd.value,
          PROCESS_DETAIL : processDetail.value,
          PROCESS_DETAIL_SEQ : processDetailSeq.value,
          PROCESS_HIS_SEQ : row.PROCESS_HIS_SEQ,
          INSP_DT : row.INSP_DT,
          INSP_DESC : row.INSP_DESC,
          FILE_ID : row.FILE_ID,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          ROW_STATE : rState
        }
        // console.log("saveObj:",saveObj)
        saveData.push(saveObj)
        // console.log("saveData1:",saveData)
      }
      
      
      commonExecuteApi({ queryId: 'SPPFF0010_SAVE_04', list: saveData })

    }
  }
  catch(e)
  {
    console.log(e);
  }
    let data={
      BSNS_CD : bsnsCd.value,
      DEPT_CD : deptCd.value,
      PROCESS_CD : processCd.value,
      PROCESS_DETAIL : processDetail.value,
      PROCESS_DETAIL_SEQ : processDetailSeq.value,
      IS_NEW : 'N'
    }
    psiSearch(data)
    search.value=true
  
  buttonHide();
}

const closePopup = () => {
  
  clearPopup();
  dialog.value = false
  emit('closed',search.value)
}
const clearPopup =()=>
{
  bsnsCd.value = ''
  deptCd.value = ''
  processCd.value = ''
  processDetail.value = ''
  processDetailSeq.value = ''
  deptNm.value = ''
  processLoc.value = ''
  grade.value = ''
  eqpEvalGrade.value = ''
  cycle.value = ''
  inspCycle.value = ''
  capacity.value = ''
  instDt.value = ''
  manufacturer.value = ''
  processSpec_1.value = ''
  processSpec_2.value = ''
  processSpec_3.value = ''
  processSpec_4.value = ''
  processMgtNo.value = ''
  fileId_1.value = ''
  fileId_2.value = ''

  imgDragDrop1.value.clearImg();
  imgDragDrop2.value.clearImg();

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
      fieldName: 'INSP_DT', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('일자')}
      ,editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      }
      , datetimeFormat: 'yyyy-MM-dd',
      styleCallback: function(grid, dataCell) {
        const val = grid.getValue(dataCell.index.itemIndex, 'PROCESS_HIS_SEQ');

        if (val === 0 || val === '') {
          return {
            editable: true,
            styleName: 'editable-style' // 선택적으로 스타일도 다르게
          };
        } else {
          return {
            editable: false,
            styleName: 'readonly-style'
          };
        }
      }
    },
    { 
      fieldName: 'INSP_DESC', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('정비내용') },
      styleCallback: function(grid, dataCell) {
        const val = grid.getValue(dataCell.index.itemIndex, 'PROCESS_HIS_SEQ');

        if (val === 0 || val === '') {
          return {
            editable: true,
            styleName: 'editable-style' // 선택적으로 스타일도 다르게
          };
        } else {
          return {
            editable: false,
            styleName: 'readonly-style'
          };
        }
      }
    },
    { 
      fieldName: 'FILE_YN', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('파일') }, 
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
          } else if(value == 'N'){ 
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
              </div>
            `;
          }
          else
          {
            return '';
          }
        }
      },
      styleCallback: function(grid, dataCell) {
        const val = grid.getValue(dataCell.index.itemIndex, 'PROCESS_HIS_SEQ');

        if (val === 0 || val === '') {
          return {
            editable: true,
            styleName: 'editable-style' // 선택적으로 스타일도 다르게
          };
        } else {
          return {
            editable: false,
            styleName: 'readonly-style'
          };
        }
      }
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('비고') },
      styleCallback: function(grid, dataCell) {
        const val = grid.getValue(dataCell.index.itemIndex, 'PROCESS_HIS_SEQ');

        if (val === 0 || val === '') {
          return {
            editable: true,
            styleName: 'editable-style', // 선택적으로 스타일도 다르게
            background: '#eff8fd'
          };
        } else {
          return {
            editable: false,
            styleName: 'readonly-style',
            background: '#FFFFFF'
          };
        }
      } 
    },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'PROCESS_DETAIL', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'PROCESS_DETAIL_SEQ', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'PROCESS_HIS_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false, },
  ],
  columns : [],

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
    commonRequest2('hse/excel/SPPFF0010_PRINT_02', data).then((res) => {
    commonStore.loading = false

    const blob = new Blob([res], { type: res.type })
    
    const link = document.createElement('a')
    
    const fileName = `${processDetail.value}_유해ㆍ위험설비 이력카드`.trim()

    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

function addRows()
{
  grdMain1.value.getDataProvider().addRow({
    INSP_DATE : '',
    INSP_DESC : '',
    FILE_YN : 'N',
    REMARKS : '',
    FILE_ID : '',
    BSNS_CD : bsnsCd.value,
    DEPT_CD : deptCd.value,
    PROCESS_CD : processCd.value,
    PROCESS_DETAIL : processDetail.value,
    PROCESS_DETAIL_SEQ : processDetailSeq.value,
    PROCESS_HIS_SEQ : ''
  })
}
function removeRows()
{
  let checkedIndexes = grdMain1.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 인원이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    let data = grdMain1.value.getDataProvider().getJsonRow(idx);
    grdMain1.value.getDataProvider().removeRow(idx);
  }
}

const rowNum = ref(null)
function onCellItemClicked (grid, index, col) {
  // if(isAdmin.value)
  // {
  let seq=grdMain1.value.getGridView().getValues(col.dataRow)['PROCESS_HIS_SEQ']
  if(seq=='' || seq==0)
  {
    return Message.warn(t('저장버튼을 눌러 이력내용을 저장 후 첨부가 가능합니다.'));
  }
    
  if (col.fieldName === 'FILE_YN') {
    
      let fileId=grdMain1.value.getGridView().getValues(col.dataRow)['FILE_ID']
      rowNum.value=col.dataRow
      iUploadPopup.value.openPopup(fileId);
    }
  // }
}
function uploaded (val){
    const saveObj={
      CMPNY_DIV:userStore.cmpnyDiv,
      BSNS_CD : bsnsCd.value,
      DEPT_CD : deptCd.value,
      PROCESS_CD : processCd.value,
      PROCESS_DETAIL : processDetail.value,
      PROCESS_DETAIL_SEQ : processDetailSeq.value,
      PROCESS_HIS_SEQ : grdMain1.value.getGridView().getValues(rowNum.value)['PROCESS_HIS_SEQ'],
      INSP_DT : grdMain1.value.getGridView().getValues(rowNum.value)['INSP_DT'],
      INSP_DESC : grdMain1.value.getGridView().getValues(rowNum.value)['INSP_DESC'],
      FILE_ID : val.fileId,
      REMARKS : grdMain1.value.getGridView().getValues(rowNum.value)['REMARKS'],
      USER_ID : userStore.userId,
      ROW_STATE : 'updated'
      }
      commonExecuteApi({ queryId: 'SPPFF0010_SAVE_04', list: [saveObj] }).then((res)=>{
        let data=[]
        data.BSNS_CD = bsnsCd.value
        data.DEPT_CD = deptCd.value
        data.PROCESS_CD = processCd.value
        data.PROCESS_DETAIL = processDetail.value
        data.PROCESS_DETAIL_SEQ = processDetailSeq.value
        data.ISNEW ='N'

        psiSearch(data)

        search.value=true;                  
      })      
}

function close (){
  let data=[]
  data.BSNS_CD = bsnsCd.value
  data.DEPT_CD = deptCd.value
  data.PROCESS_CD = processCd.value
  data.PROCESS_DETAIL = processDetail.value
  data.PROCESS_DETAIL_SEQ = processDetailSeq.value
  data.ISNEW ='N'

  psiSearch(data)
}

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1080"
    height="1000"

  >
    <div class="title-bar">유해·위험설비 이력카드</div>
    <v-card class="pa-3 fill-height rounded-b-5" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="titleButton"
          :hiddenManuel="true"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <div>
          <table ref ="content" border="1" style="border-collapse: collapse; padding : 2px; width: 100%;">
            <tr >
              <td style=" border: 2px solid gray; text-align: center; background-color: whitesmoke;" colspan="6">
                <h1>유해·위험설비 이력카드</h1>
                <p style="text-align:left">부서명 : {{ deptNm }}</p>
              </td>
            </tr>
              <tr style="height:40px;">
                <td class="in_title" style="width:172px">설치장소</td>
                <td style="width:172px"><input class="data-box" v-model="processLoc" disabled/></td>
                <td class="in_title" style="width:172px">설비명</td>
                <td style="width:172px"><input class="data-box" v-model="processDetail" disabled/></td>
                <td class="in_title" rowspan="4" style="width:172px">장비제원</td>
                <td style="width:172px"><input class="data-box" v-model="processSpec_1"/></td>
              </tr>
              <tr style="height:40px;">
                <td class="in_title">설비등급</td>
                <td><input class="data-box" v-model="grade" disabled/></td>
                <td class="in_title">점검주기</td>
                <td><input class="data-box" v-model="cycle" disabled/></td>
                <td><input class="data-box" v-model="processSpec_2"/></td>
              </tr>
              <tr style="height:40px;">
                <td class="in_title">관리번호</td>
                <td><input class="data-box" v-model="processMgtNo"/></td>
                <td class="in_title">용    량</td>
                <td><input class="data-box" v-model="capacity" disabled/></td>
                <td><input class="data-box" v-model="processSpec_3"/></td>
              </tr>
              <tr style="height:40px;">
                <td class="in_title">제 조 사</td>
                <td><input class="data-box" v-model="manufacturer"/></td>
                <td class="in_title">설치일자</td>
                <td><input class="data-box" v-model="instDt" disabled/></td>
                <td><input class="data-box" v-model="processSpec_4"/></td>
              </tr>
              <tr><span>사진/도면</span></tr>
              <tr>
                <td style="width : 50%" colspan="3">
                  <div style="width: 100%; height: 275px;">
                    <ImgDragDrop ref="imgDragDrop1"/>
                  </div>
                </td>
                <td style="width : 50%" colspan="3">
                  <div style="width: 100%; height: 275px;">
                    <ImgDragDrop ref="imgDragDrop2"/>
                  </div>
                </td>
              </tr>
              <tr style="height: 30px;">
                <td colspan="6"></td>
              </tr>
              <tr>
                <td style=" border: 2px solid gray; text-align: center; background-color: whitesmoke;" colspan="6">
                <h2>이  력  내  역</h2>
                <div style="display: flex;  justify-content: flex-end;  gap: 3px;">
                  <IButtonList
                    style="padding:2px"
                    :button-list="['btnCreate','btnDelete']"
                  @click-button="onButtonsClick"
                  />
                  <!-- <v-btn v-if="!write" @click="addRows()" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                  <v-btn v-if="!write" @click="removeRows()" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn>    -->
                </div>
              </td>
              </tr>
              <tr>
                <td colspan="6">
                  <div class="data-box-Team" id="team-member"> 

                     <RealGrid
                      style="height:220px; width:100%;"
                      ref="grdMain1"
                      :grid-view-option="grdMain1Props.gridViewOption"
                      :keys="grdMain1Props.keys" 
                      :fields="grdMain1Props.fields"
                      :columns="grdMain1Props.columns"
                      @onCellItemClicked = "onCellItemClicked"/>
                </div>
                </td>
              </tr>
          </table>
        </div>
        <IUploadPopup ref="iUploadPopup" 
          gridTitle="첨부파일"
          width="1200" 
          height="800" 
          @uploaded = "uploaded"></IUploadPopup>
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

.in_title{
  text-align: center; 
  background-color: whitesmoke;
}

.data-box
{
  font-size: 1rem;
  padding: 5px 8px;
  box-sizing: border-box;
  border: 1px solid #bbb;
  border-radius: 4px;
}

.data-box-Team
{
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 3px;
}

::v-deep(.rg-header .rg-table tr td) {
  white-space: pre-line !important;
}
</style>
