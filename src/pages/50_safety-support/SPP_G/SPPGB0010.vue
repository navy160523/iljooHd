<!-- SPPGB0020 통합관제센터 업무 일지 -->
<!-- SI2팀 마환구 2025.04.16 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import IButtonList from '@/components/IButtonList.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from "@/components/popup/EmpPopup.vue"
import LocationPopup from "@/components/popup/LocationPopup.vue"
import { useRoute } from 'vue-router'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' //결재
import dayjs from 'dayjs';
import 'dayjs/locale/ko'
import SPPGB0010Popup01 from './SPPGB0010Popup01.vue'
import SPPGB0010Popup02 from './SPPGB0010Popup02.vue'

dayjs.locale('ko')

defineOptions({
  name: '50_safety-support-SPP_G-SPPGB0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)

const approvalPopup=ref(null);

const SPPGB0010_Popup=ref(null)
const SPPGB0010_Popup02=ref(null)

const selectYear=ref(null)
const selectMonth=ref(null)
const today = ref(null)
const todayNm=ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.empNo,
})
const searchParamsSub = reactive({});

const isAdmin = ref(0)

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  process: [],
  item: []
})

const initCodeList = async () => {

  Promise.all([ 
    getCodeList('HHIWA'),
    getCodeList('HHIWB'),
    getCodeList('HHIWC'),
    commonSearchApi({ queryId: 'SPPGB0010_CAMERA_COMBO_01', param: {CMPNY_DIV : userStore.cmpnyDiv} }),
  ]).then(res =>{
    codeList.logCmpny = res[0].ORESULT_CUR;
    codeList.accidnetType = res[1].ORESULT_CUR;
    codeList.hospital = res[2].ORESULT_CUR;
    codeList.camera = res[3].ORESULT_CUR;

    //console.log("v1")
    grdMain06.value.setBindingColumn("LOG_CMPNY",codeList.logCmpny,'COD','TXT')
    grdMain06.value.setBindingColumn("ACCIDENT_TYPE",codeList.accidnetType,'COD','TXT')
    grdMain06.value.setBindingColumn("HOSPITAL",codeList.hospital,'COD','TXT')
    grdMain02.value.setBindingColumn("CAMERA_NM",codeList.camera,'CAMERA_NM','CAMERA_NM')
    grdMain03.value.setBindingColumn("CAMERA_NM",codeList.camera,'CAMERA_NM','CAMERA_NM')
  })
  //console.log("v2")
  selectYear.value=dayjs().format('YYYY');
  selectMonth.value=dayjs().format('MM');
  today.value = dayjs().format('YYYY-MM-DD');
  todayNm.value = dayjs().format('ddd');
  //console.log("v3")
}

// 등록/수정 구분자
const isNew = ref(false)

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    getData()
  }
  else if(btn.id == 'btnReqApply') {
    approval()
  }
  else if(btn.id == 'btnNew')
  {
    writeDiv.value = 'C'
    clearGrid();
  }
  else if(btn.id=='btnUpdate')
  {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id=='btnDispatchStatus')
  {
    openPopup()
  }

}

const beforeSave = () => {

  let rows1=grdMain01.value.getDataProvider().getJsonRows();
  let rows2=grdMain02.value.getDataProvider().getJsonRows();  
  let rows3=grdMain03.value.getDataProvider().getJsonRows();
  let rows4=grdMain04.value.getDataProvider().getJsonRows();  
  let rows5=grdMain05.value.getDataProvider().getJsonRows();
  let rows6=grdMain06.value.getDataProvider().getJsonRows();  
  let rows7=grdMain07.value.getDataProvider().getJsonRows();
  let rows8=grdMain08.value.getDataProvider().getJsonRows();  
  let rows9=grdMain09.value.getDataProvider().getJsonRows();
  let rows10=grdMain10.value.getDataProvider().getJsonRows();  
  let rows11=grdMain11.value.getDataProvider().getJsonRows();

  if(rows1.length>0)
    {
      for(let i=0; i<rows1.length;i++)
      {
        const row=rows1[i];

        if(row.MAIN_CONTENT =='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('근무현황에서 근무자를 입력해 주세요'));
        }
        } 
    }
    else
    {
      return Message.warn(t('근무현황은 필수로 추가를 해주셔야합니다.'));
    }

    if(rows2.length>0)
    {
      for(let i=0; i<rows2.length;i++)
      {
        const row=rows2[i];

        if(row.CAMERA_NM=='' || !row.CAMERA_NM)
        {
          return Message.warn(t('CCTV 관제에서 카메라 명칭을 선택해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('CCTV 관제에서 시간을 입력해주세요'));
        }

        if(row.MAIN_CONTENT=='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('CCTV 관제에서 주요내용을 입력해주세요'));
        }

        if(row.ACTION_CONTENT=='' || !row.ACTION_CONTENT)
        {
          return Message.warn(t('CCTV 관제에서 조치사항을 입력해주세요'));
        }
      }
    }

    if(rows3.length>0)
    {
      for(let i=0; i<rows3.length;i++)
      {

        const row=rows3[i];

        if(row.CAMERA_NM=='' || !row.CAMERA_NM)
        {
          return Message.warn(t('HiCAMs 관제에서 카메라 명칭을 선택해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('HiCAMs 관제에서 시간을 입력해주세요'));
        }

        if(row.MAIN_CONTENT=='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('HiCAMs 관제에서 주요내용을 입력해주세요'));
        }

        if(row.ACTION_CONTENT=='' || !row.ACTION_CONTENT)
        {
          return Message.warn(t('HiCAMs 관제에서 조치사항을 입력해주세요'));
        }
      }
    }

    if(rows4.length>0)
    {
      for(let i=0; i<rows4.length;i++)
      {
  
        const row=rows4[i];

        if(row.LOCATION=='' || !row.LOCATION)
        {
          return Message.warn(t('소방 관제에서 장소를 선택해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('소방 관제에서 시간을 입력해주세요'));
        }

        if(row.MAIN_CONTENT=='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('소방 관제에서 주요내용을 입력해주세요'));
        }

        if(row.ACTION_CONTENT=='' || !row.ACTION_CONTENT)
        {
          return Message.warn(t('소방 관제에서 조치사항을 입력해주세요'));
        }
      }
    }

    if(rows5.length>0)
      {
        for(let i=0; i<rows5.length;i++)
        {

          const row=rows5[i];

        if(row.DERONE_PATH=='' || !row.DERONE_PATH)
        {
          return Message.warn(t('드론관제에서 드론경로를 입력해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('드론관제에서 시간을 입력해주세요'));
        }

        if(row.MAIN_CONTENT=='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('드론관제에서 주요내용을 입력해주세요'));
        }
        }
      }

    if(rows6.length>0)
    {
      for(let i=0; i<rows6.length;i++)
      {
        const row=rows6[i];

        if(row.LOG_CMPNY=='' || !row.LOG_CMPNY)
        {
          return Message.warn(t('사고에서 사업부(그룹사)를 선택해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('사고에서 시간을 입력해주세요'));
        }

        if(row.LOCATION=='' || !row.LOCATION)
        {
          return Message.warn(t('사고에서 장소를 입력해주세요'));
        }
        
        if(row.CASUALTY_NM=='' || !row.CASUALTY_NM)
        {
          return Message.warn(t('사고에서 재해자를 입력해주세요'));
        }

        if(row.ACCIDENT_DESC=='' || !row.ACCIDENT_DESC)
        {
          return Message.warn(t('사고에서 사고내용을 입력해주세요'));
        }

        if(row.ACCIDENT_TYPE=='' || !row.ACCIDENT_TYPE)
        {
          return Message.warn(t('사고에서 사고유형을 선택해주세요'));
        }

        if(row.HOSPITAL=='' || !row.HOSPITAL)
        {
          return Message.warn(t('사고에서 병원을 선택해주세요'));
        } 
      }
    }

    if(rows7.length>0)
    {
      for(let i=0; i<rows7.length;i++)
      {
        const row=rows7[i];

        if(row.DISASTER_TYPE=='' || !row.DISASTER_TYPE)
        {
          return Message.warn(t('재난에서 재난 구분은 입력해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('재난에서 시간을 입력해주세요'));
        }

        if(row.MAIN_CONTENT=='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('재난에서 주요내용을 입력해주세요'));
        }
        
        if(row.ACTION_CONTENT=='' || !row.ACTION_CONTENT)
        {
          return Message.warn(t('재난에서 조치내용을 입력해주세요'));
        }
      }
    }

    if(rows8.length>0)
    {
      for(let i=0; i<rows8.length;i++)
      {
        const row=rows8[i];

        if(row.TRAINING=='' || !row.TRAINING)
        {
          return Message.warn(t('교육/훈련에서 훈련/교육명을 입력해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('교육/훈련에서 시간을 입력해주세요'));
        }

        if(row.MAIN_CONTENT=='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('교육/훈련에서 주요내용을 입력해주세요'));
        }
        
        if(row.ACTION_CONTENT=='' || !row.ACTION_CONTENT)
        {
          return Message.warn(t('교육/훈련에서 조치내용을 입력해주세요'));
        }
      }
    }

    if(rows9.length>0)
    {
      for(let i=0; i<rows9.length;i++)
      {

        const row=rows9[i];

        if(row.PARTS_NM=='' || !row.PARTS_NM)
        {
          return Message.warn(t('장비점검에서 장비명을 입력해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('장비점검에서 시간을 입력해주세요'));
        }

        if(row.MAIN_CONTENT=='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('장비점검에서 주요내용을 입력해주세요'));
        }
      }
    }

    if(rows10.length>0)
    {
      for(let i=0; i<rows10.length;i++)
      {

        const row=rows10[i];

        if(row.LOCATION=='' || !row.LOCATION)
        {
          return Message.warn(t('현장점검에서 장소를 입력해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('현장점검에서 시간을 입력해주세요'));
        }

        if(row.MAIN_CONTENT=='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('현장점검에서 주요내용을 입력해주세요'));
        }

        if(row.ACTION_CONTENT=='' || !row.ACTION_CONTENT)
        {
          return Message.warn(t('현장점검에서 조치내용을 입력해주세요'));
        }
    
      }
    }

    if(rows11.length>0)
    {
      for(let i=0; i<rows11.length;i++)
      {

        const row=rows11[i];

        if(row.ACTION_CONTENT=='' || !row.ACTION_CONTENT)
        {
          return Message.warn(t('기타사항에서 조치사항 입력해주세요'));
        }

        if(row.LOG_TIME=='' || !row.LOG_TIME)
        {
          return Message.warn(t('기타사항에서 시간을 입력해주세요'));
        }

        if(row.LOCATION=='' || !row.LOCATION)
        {
          return Message.warn(t('기타사항에서 장소를 입력해주세요'));
        }

        if(row.MAIN_CONTENT=='' || !row.MAIN_CONTENT)
        {
          return Message.warn(t('기타사항에서 주요내용을 입력해주세요'));
        }
      }
    }
saveParams.CMPNY_DIV= userStore.cmpnyDiv
// saveParams.WRITE_DT = dayjs().format('YYYY-MM-DD')
saveParams.WRITE_DT = today.value
saveParams.DT_DIV = dateDiv.value
saveParams.WORK_SHIFT = workShift.value
saveParams.USER_ID= userStore.userId
saveParams.WORK_LOG_ID = workLogId.value

return true
}

const saveData = async () => {

//console.log("saveParams:",saveParams);
const res= await commonExecuteApi({ queryId: 'SPPGB0010_SAVE_01', list: [saveParams] })
//console.log("res:",res.list[0])
//console.log("res:",res.list[0].OUT_RES_SEQ)
//console.log("res length:",res.list.length)
if(res.list.length>0)
{
  let saveData=[];
  const masterkey = res.list[0].OUT_RES_SEQ
  //console.log("detail start")  
  let rows1=grdMain01.value.getDataProvider().getJsonRows();
  let rows2=grdMain02.value.getDataProvider().getJsonRows();  
  let rows3=grdMain03.value.getDataProvider().getJsonRows();
  let rows4=grdMain04.value.getDataProvider().getJsonRows();  
  let rows5=grdMain05.value.getDataProvider().getJsonRows();
  let rows6=grdMain06.value.getDataProvider().getJsonRows();  
  let rows7=grdMain07.value.getDataProvider().getJsonRows();
  let rows8=grdMain08.value.getDataProvider().getJsonRows();  
  let rows9=grdMain09.value.getDataProvider().getJsonRows();
  let rows10=grdMain10.value.getDataProvider().getJsonRows();  
  let rows11=grdMain11.value.getDataProvider().getJsonRows();
  //console.log("rows1.length:",rows1.length)  
  if(rows1.length>0)
    {
      for(let i=0; i<rows1.length;i++)
      {
        if(grdMain01.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows1[i];

        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'A',
          MAIN_CONTENT : row.MAIN_CONTENT,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ
          }
        saveData.push(saveObj)   
        } 
      }
    }
    // console.log("saveData1:",saveData);
    //console.log("rows2.length:",rows2.length)  
    if(rows2.length>0)
    {
      for(let i=0; i<rows2.length;i++)
      {
        if(grdMain02.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows2[i];

        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'B',
          CAMERA_NM : row.CAMERA_NM,
          LOG_TIME : row.LOG_TIME,
          MAIN_CONTENT : row.MAIN_CONTENT,
          ACTION_CONTENT : row.ACTION_CONTENT,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ,
          FILE_ID : row.FILE_ID
          }
        saveData.push(saveObj)    
        }
      }
    }
    //console.log("saveData2:",saveData);
    //console.log("rows3.length:",rows3.length)  
    if(rows3.length>0)
    {
      for(let i=0; i<rows3.length;i++)
      {
        if(grdMain03.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows3[i];

        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'C',
          CAMERA_NM : row.CAMERA_NM,
          LOG_TIME : row.LOG_TIME,
          MAIN_CONTENT : row.MAIN_CONTENT,
          ACTION_CONTENT : row.ACTION_CONTENT,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ,
          FILE_ID : row.FILE_ID
          }
        saveData.push(saveObj)  
        }  
      }
    }
    //console.log("saveData3:",saveData);
    //console.log("rows4.length:",rows4.length)  
    if(rows4.length>0)
    {
      for(let i=0; i<rows4.length;i++)
      {
        if(grdMain04.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows4[i];

        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'D',
          LOCATION : row.LOCATION,
          LOG_TIME : row.LOG_TIME,
          MAIN_CONTENT : row.MAIN_CONTENT,
          ACTION_CONTENT : row.ACTION_CONTENT,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ,
          FILE_ID : row.FILE_ID
        }
        saveData.push(saveObj)
        }    
      }
    }
    //console.log("saveData4:",saveData);
      //console.log("rows5.length:",rows5.length)  
      if(rows5.length>0)
      {
        for(let i=0; i<rows5.length;i++)
        {
          if(grdMain05.value.getDataProvider().getRowState(i) != 'deleted')
          { 
          const row=rows5[i];

          const saveObj={
            CMPNY_DIV:userStore.cmpnyDiv,
            WORK_LOG_ID : masterkey,
            CONTENT_TYPE : 'E',
            DERONE_PATH : row.DERONE_PATH,
            LOG_TIME : row.LOG_TIME,
            MAIN_CONTENT : row.MAIN_CONTENT,
            REMARKS : row.REMARKS,
            USER_ID : userStore.userId,
            DETAIL_SEQ : row.DETAIL_SEQ,
            FILE_ID : row.FILE_ID
           }
          saveData.push(saveObj)
          }    
        }
      }
      //console.log("saveData5:",saveData);
    //console.log("rows6.length:",rows6.length)  
    if(rows6.length>0)
    {
      for(let i=0; i<rows6.length;i++)
      {
        if(grdMain06.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows6[i];

        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'F',
          LOG_CMPNY : row.LOG_CMPNY,
          LOG_TIME : row.LOG_TIME,
          LOCATION : row.LOCATION,
          CASUALTY_NM : row.CASUALTY_NM,
          ACCIDENT_DESC : row.ACCIDENT_DESC,
          ACCIDENT_TYPE : row.ACCIDENT_TYPE,
          HOSPITAL : row.HOSPITAL,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ
          }
        saveData.push(saveObj) 
        }   
      }
    }
    //console.log("saveData6:",saveData);
    //console.log("rows7.length:",rows7.length)  
    if(rows7.length>0)
    {
      for(let i=0; i<rows7.length;i++)
      {
        if(grdMain07.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows7[i];

        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'G',
          DISASTER_TYPE : row.DISASTER_TYPE,
          LOG_TIME : row.LOG_TIME,
          MAIN_CONTENT : row.MAIN_CONTENT,
          ACTION_CONTENT : row.ACTION_CONTENT,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ,
          FILE_ID : row.FILE_ID
         }
        saveData.push(saveObj)    
        }
      }
    }
    //console.log("saveData7:",saveData);
    //console.log("rows8.length:",rows8.length)  
    if(rows8.length>0)
    {
      for(let i=0; i<rows8.length;i++)
      {
        if(grdMain08.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows8[i];
        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'H',
          TRAINING : row.TRAINING,
          LOG_TIME : row.LOG_TIME,
          MAIN_CONTENT : row.MAIN_CONTENT,
          ACTION_CONTENT : row.ACTION_CONTENT,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ,
          FILE_ID : row.FILE_ID
          }
        saveData.push(saveObj)  
        }   
      }
    }
    //console.log("saveData8:",saveData);
    //console.log("rows9.length:",rows9.length)  
    if(rows9.length>0)
    {
      for(let i=0; i<rows9.length;i++)
      {
        if(grdMain09.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows9[i];
        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'I',
          PARTS_NM : row.PARTS_NM,
          LOG_TIME : row.LOG_TIME,
          MAIN_CONTENT : row.MAIN_CONTENT,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ,
          FILE_ID : row.FILE_ID
          }
        saveData.push(saveObj)    
        }
      }
    }
    //console.log("saveData9:",saveData);
    //console.log("rows10.length:",rows10.length)  
    if(rows10.length>0)
    {
      for(let i=0; i<rows10.length;i++)
      {
        if(grdMain10.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows10[i];
        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'J',
          LOCATION : row.LOCATION,
          LOG_TIME : row.LOG_TIME,
          MAIN_CONTENT : row.MAIN_CONTENT,
          ACTION_CONTENT : row.ACTION_CONTENT,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ,
          FILE_ID : row.FILE_ID
          }
        saveData.push(saveObj)    
        }
      }
    }
    //console.log("saveData10:",saveData);
    //console.log("rows11.length:",rows11.length)  
    if(rows11.length>0)
    {
      for(let i=0; i<rows11.length;i++)
      {
        if(grdMain11.value.getDataProvider().getRowState(i) != 'deleted')
        {
        const row=rows11[i];
        const saveObj={
          CMPNY_DIV:userStore.cmpnyDiv,
          WORK_LOG_ID : masterkey,
          CONTENT_TYPE : 'K',
          ACTION_CONTENT : row.ACTION_CONTENT,
          LOG_TIME : row.LOG_TIME,
          LOCATION : row.LOCATION,
          MAIN_CONTENT : row.MAIN_CONTENT,
          REMARKS : row.REMARKS,
          USER_ID : userStore.userId,
          DETAIL_SEQ : row.DETAIL_SEQ,
          FILE_ID : row.FILE_ID
        }
        saveData.push(saveObj)    
        }
      }
    }
    //console.log("saveData11:",saveData);
    const res2=await commonExecuteApi({ queryId: 'SPPGB0010_SAVE_02', list: saveData })
    
}
}

const afterSave = () => {

  onButtonsClick({ id: 'btnSearch' })

}

const openPopup = (value) => {
  // let row= grdMain1.value.getGridView().getSelectedRows()
  // let rowData = grdMain1.value.getDataProvider().getJsonRow(row)

  // if(rowData.FILE_YN !='Y' && rowData.REV_SEQ && data=="C")
  // {
  //   return Message.warn(t('이전 내용에 파일이 첨부되지 않았습니다.'))
  // }


  // if(rowData.REV_APP_STATUS != 'Y' && rowData.REV_SEQ && data=="C")
  // {
  //   return Message.warn(t('이전 개정의 결재가 완료되지 않았습니다.'))
  // }
  // popupParam.DIV=value
  // // selectrow.value=grdMain1.value.getGridView().getSelectedRows();

  SPPGB0010_Popup.value.openPopup()
}

const getData = async () => {

  new queryFlowHelper(vm, t)
    .setGridList([grdMain1])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}



//  조회
const searchData = () => {
  
  return commonSearchApi({ queryId: 'SPPGB0010_SEARCH_01', param: {CMPNY_DIV:userStore.cmpnyDiv, YEAR : selectYear.value, MONTH : selectMonth.value} })  
}

// 조회 후
const afterSearch = (res) => {

  // initFileSearchData()
  //console.log(res);

  grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);

  // gridSelect()

  // const sessionProcess = window.sessionStorage.getItem('PROCESS_CD');

  // if (sessionProcess) {

  //   const gridView = grdMain1.value.getGridView();
  //   const rowCount = grdMain1.value.getDataProvider().getRowCount();
 
  //   for (let i = 0; i < rowCount; i++) {

  //     const rowData = grdMain1.value.getDataProvider().getJsonRow(i);

  //     if (rowData.PROCESS_CD === sessionProcess) {
  //       gridView.setCurrent({ dataRow: i });
  //       gridView.setFocus(true);

  //       onCellClicked(gridView, {
  //         dataRow: i,
  //         column: 'PROCESS_CD', // 또는 클릭으로 가정할 컬럼명
  //         itemIndex: gridView.getCurrent().itemIndex
  //       }, 'grdMain1');
        
  //       // sessionStorage 값 삭제 (한번만 실행되도록)
  //       window.sessionStorage.removeItem('PROCESS_CD');

  //       break;  
  //     }
  //   }
  // }
}

const gridSelect =()=>{
  grdMain1.value.getGridView().clearCurrent();
  grdMain1.value.getGridView().setCurrent({itemIndex : selectrow.value});
}

//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    checkBar: { visible: true, exclusive: true}
  },
  fields : [
    { 
      fieldName: 'WRITE_DT', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('일자'),} ,
      mergeRule: {
        criteria: "value"  // 값이 같으면 세로로 병합
      },
    },
    {
      fieldName: 'REPORT_DESC', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('근무형태') }, 
    },
    { 
      fieldName: 'EMP_NM', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('근무자') },
    },
    // { 
    //   fieldName: 'ACCIDENT_COUNT', dataType: 'text', width: '80', styleName: 'right-column',
    //   header: { text: t('구조/구급 출동현황(건/일)') }, 
    //   mergeRule: {
    //     criteria: "value"  // 값이 같으면 세로로 병합
    //   },
    // },
    { 
      fieldName: 'APP', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('결재') }, 
    },
    { 
      fieldName: 'APP_YN', dataType: 'text', width: '80', styleName: 'left-column',visible:false,
      header: { text: t('결재') }, 
    },
    { fieldName: 'DT_DIV', dataType: 'text', header: { text: t('업무일지 코드') },visible: false, },
    { fieldName: 'WORK_SHIFT', dataType: 'text', header: { text: t('업무일지 코드') },visible: false, },
    { fieldName: 'APP_ID', dataType: 'text', header: { text: t('업무일지 코드') },visible: false, },
    { fieldName: 'WORK_LOG_ID', dataType: 'text', header: { text: t('업무일지 코드') },visible: false, },
  ],
  columns : []
})

grdMain1Props.columns = grdMain1Props.fields


onMounted( async () => {

  // PSM 관리자 확인
  // 2: PSM 모듈 관리자, 1: PSM 부서 담당자, 0: 일반 사용자
  if(
    useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes("SPPG001")
  ) {
    isAdmin.value = 2
  }else if(userStore.authGrpCd.includes("SPPG002")) {
    isAdmin.value = 1
  }
  // if(isAdmin.value === 0) {
  //   return
  // }

  // "['btnSearch','btnCreate','btnApply']"
  if(isAdmin.value==0)
  {
    menuTitle.value.visibleBtn('btnCreate',false);
    menuTitle.value.visibleBtn('btnReqApply',false);
  }
  else
  {
    menuTitle.value.visibleBtn('btnCreate',true);
    menuTitle.value.visibleBtn('btnReqApply',true);
  }
  

  await initCodeList()
  // await getData()

  writeDiv.value='C'

  grdMain1.value.getGridView().filterPanel.visible = true
  grdMain01.value.getGridView().filterPanel.visible = true
  grdMain02.value.getGridView().filterPanel.visible = true
  grdMain03.value.getGridView().filterPanel.visible = true
  grdMain04.value.getGridView().filterPanel.visible = true
  grdMain05.value.getGridView().filterPanel.visible = true
  grdMain06.value.getGridView().filterPanel.visible = true
  grdMain07.value.getGridView().filterPanel.visible = true
  grdMain08.value.getGridView().filterPanel.visible = true
  grdMain09.value.getGridView().filterPanel.visible = true
  grdMain10.value.getGridView().filterPanel.visible = true
  grdMain11.value.getGridView().filterPanel.visible = true
  grdMain12.value.getGridView().filterPanel.visible = true


  // try {
  //   const res = await commonGetRowKey();
  //   const rowKey = parseInt(res.data.rowKey);
  //   const gv = grdMain1.value.getGridView();
  //   gv.clearCurrent();
  //   gv.setCurrent({ itemIndex: rowKey });
  //   gv.setFocus(true);
  // } catch (e) {
  //   // 세션에 rowKey 없으면 무시
  // }
})

// 셀 클릭 이벤트
const rowChanged = (grid, index, col) => {

    if(col >= 0)
    {
      let rowData = grdMain1.value.getDataProvider().getJsonRow(col)
      
      // grdMain1.value.getGridView().checkItem(col,true);

      grid.beginUpdate();
      try {
        grid.checkAll(false);          // ← 기존 체크 전부 해제
        grid.checkItem(col, true); // ← 현재 행만 체크
      } finally {
        grid.endUpdate();
      }

      searchParamsSub.CMPNY_DIV = userStore.cmpnyDiv
      searchParamsSub.WORK_LOG_ID=rowData.WORK_LOG_ID
      searchParamsSub.WRITE_DT=rowData.WRITE_DT
      searchParamsSub.DATE_DIV = rowData.DT_DIV
      searchParamsSub.WORK_SHIFT = rowData.WORK_SHIFT
      
      writeDiv.value='M'

      searchDetailData()

    }
  // if (col.fieldName === 'FILE_YN') {    
  //   let fileId=grdMain1.value.getGridView().getValues(col.dataRow)['FILE_ID']
  //   FIUploadPopup.value.openPopup(fileId);
  // }
}

  const tab=ref(null)
  const tabValue=ref(null);
  const workLogId=ref(null);

  const grdMain01=ref(null);
  const grdMain02=ref(null);
  const grdMain03=ref(null);
  const grdMain04=ref(null);
  const grdMain05=ref(null);
  const grdMain06=ref(null);
  const grdMain07=ref(null);
  const grdMain08=ref(null);
  const grdMain09=ref(null);
  const grdMain10=ref(null);
  const grdMain11=ref(null);
  const grdMain12=ref(null);

  const divCode=ref(null)
  const shiftCode=ref('')
  const empPopup = ref(null)
  const locPopup = ref(null)
  const grd=ref(null)
  const grdRow=ref(null)
  const dateDiv = ref(null)
  const workShift = ref(null)
  const writeDiv = ref(null);
  const saveParams = reactive({});
  const enAble=ref(true)

  // 근무현황 그리드 속성셋팅
const grdMain01Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'DIV_NM', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('구분'),} ,
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'center-column',
      header: { text: t('내용') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'right',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('비고') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
    { 
      fieldName: 'EMP_NO', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('구분'),} ,
    },
  ],
  columns : [],

})

grdMain01Props.columns = grdMain01Props.fields

// CCTV 관제 그리드 속성셋팅
const grdMain02Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'CAMERA_NM', dataType: 'text', width: '200', styleName: 'center-column',
      header: { text: t('카메라 명칭'),} ,
      lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('주요내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'ACTION_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('조치내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('비고') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_ID')
          if (value) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible:false,
      header: { text: t('FILE_ID') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
  ],
  columns : [],

})

grdMain02Props.columns = grdMain02Props.fields

// HiCAMs 관제 그리드 속성셋팅
const grdMain03Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'CAMERA_NM', dataType: 'text', width: '200', styleName: 'center-column',
      header: { text: t('카메라 명칭'),} ,
      lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('주요내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'ACTION_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('조치내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('비고') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_ID')
          if (value) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible:false,
      header: { text: t('FILE_ID') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
  ],
  columns : [],

})

grdMain03Props.columns = grdMain03Props.fields

// 소방 관제 그리드 속성셋팅
const grdMain04Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'LOCATION', dataType: 'text', width: '200', styleName: 'center-column',
      header: { text: t('위치'),} ,
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'right',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('주요내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'ACTION_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('조치내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('비고') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_ID')
          if (value) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible:false,
      header: { text: t('FILE_ID') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
  ],
  columns : [],

})

grdMain04Props.columns = grdMain04Props.fields

// 드론 관제 그리드 속성셋팅
const grdMain05Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'DERONE_PATH', dataType: 'text', width: '200', styleName: 'multiline-editor center-column',
      header: { text: t('경로'),} ,
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('주요내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('비고') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_ID')
          if (value) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible:false,
      header: { text: t('FILE_ID') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
  ],
  columns : [],

})

grdMain05Props.columns = grdMain05Props.fields

// 사고 비상대응 그리드 속성셋팅
const grdMain06Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'LOG_CMPNY', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('사업부(그룹사)'),} , lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'LOCATION', dataType: 'text', width: '200', styleName: 'left-column',
      header: { text: t('장소') }, 
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'right',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      },
    },
    { 
      fieldName: 'CASUALTY_NM', dataType: 'text', width: '200', styleName: 'left-column',
      header: { text: t('재해자') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'right',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      }, 
    },
    { 
      fieldName: 'ACCIDENT_DESC', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('사고내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'ACCIDENT_TYPE', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('사고유형') }, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    { 
      fieldName: 'HOSPITAL', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('병원') }, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
    
  ],
  columns : [],

})

grdMain06Props.columns = grdMain06Props.fields

// 재난 대응 그리드 속성셋팅
const grdMain07Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'DISASTER_TYPE', dataType: 'text', width: '200', styleName: 'multiline-editor center-column',
      header: { text: t('재난 구분'),} ,
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('주요내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'ACTION_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('조치내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('비고') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_ID')
          if (value) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible:false,
      header: { text: t('FILE_ID') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
  ],
  columns : [],

})

grdMain07Props.columns = grdMain07Props.fields

// 교육/훈련 그리드 속성셋팅
const grdMain08Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'TRAINING', dataType: 'text', width: '200', styleName: 'multiline-editor center-column',
      header: { text: t('훈련명/교육'),} ,
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('주요내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'ACTION_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('조치내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('비고') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_ID')
          if (value) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible:false,
      header: { text: t('FILE_ID') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
  ],
  columns : [],

})

grdMain08Props.columns = grdMain08Props.fields

// 장비 그리드 속성셋팅
const grdMain09Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'PARTS_NM', dataType: 'text', width: '200', styleName: 'multiline-editor center-column',
      header: { text: t('장비명'),} ,
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('주요내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('비고') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_ID')
          if (value) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible:false,
      header: { text: t('FILE_ID') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
  ],
  columns : [],

})

grdMain09Props.columns = grdMain09Props.fields

// 현장점검 그리드 속성셋팅
const grdMain10Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'LOCATION', dataType: 'text', width: '200', styleName: 'center-column',
      header: { text: t('위치'),} ,
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'right',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('주요내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'ACTION_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('조치내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('비고') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_ID')
          if (value) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible:false,
      header: { text: t('FILE_ID') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
  ],
  columns : [],

})

grdMain10Props.columns = grdMain10Props.fields

// 기타사항 그리드 속성셋팅
const grdMain11Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
  { 
      fieldName: 'ACTION_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('조치사항') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'LOG_TIME', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('시간(HH:mm)') },
      editor:{
      mask:{
          definitions: {"b":"[0-2]","c":"[0-9]","d":"[0-5]","e":"[0-9]"},
          editMask:"bc:de",
          placeHolder:"00:00",
          includedFormat:true,
          overWrite: true
            }
          }
    },
    { 
      fieldName: 'LOCATION', dataType: 'text', width: '200', styleName: 'center-column',
      header: { text: t('위치'),} ,
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'right',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      },
    },
    { 
      fieldName: 'MAIN_CONTENT', dataType: 'text', width: '200', styleName: 'multiline-editor left-column',
      header: { text: t('주요내용') }, 
      editor: {
            type: "multiline"
        },
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('비고') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_ID')
          if (value) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible:false,
      header: { text: t('FILE_ID') }, 
    },
    { 
      fieldName: 'DETAIL_SEQ', dataType: 'text', width: '100', styleName: 'center-column', visible:false,
      header: { text: t('순번'),} ,
    },
  ],
  columns : [],

})

grdMain11Props.columns = grdMain11Props.fields

// 구조/구급 출동현황 그리드 속성셋팅
const grdMain12Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    checkBar: { visible: false}
  },
  fields : [
    { 
      fieldName: 'WRITE_KEY', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('구분'),} ,
    },
    { 
      fieldName: '001', dataType: 'text', width: '80', styleName: 'right-column',
      header: { text: t('조선') },
    },
    { 
      fieldName: '002', dataType: 'text', width: '80', styleName: 'right-column',
      header: { text: t('해양') },
    },
    { 
      fieldName: '003', dataType: 'text', width: '80', styleName: 'right-column',
      header: { text: t('특수선') },
    },
    { 
      fieldName: '004', dataType: 'text', width: '80', styleName: 'right-column',
      header: { text: t('엔진') },
    },
    { 
      fieldName: 'SUM', dataType: 'text', width: '80', styleName: 'right-column',
      header: { text: t('소계') },
    },
    { 
      fieldName: '005', dataType: 'text', width: '80', styleName: 'right-column',
      header: { text: t('건설기계') },
    },
    { 
      fieldName: '006', dataType: 'text', width: '80', styleName: 'right-column',
      header: { text: t('일렉트릭') },
    },
    { 
      fieldName: '999', dataType: 'text', width: '80', styleName: 'right-column',
      header: { text: t('기타') },
    },
    { 
      fieldName: 'TOT_SUM', dataType: 'text', width: '80', styleName: 'right-column',
      header: { text: t('출동건수/건') },
    },
  ],
  columns : [],
  columnLayout :[
    'WRITE_KEY',
    {
      name:'HD현대중공업',
      direction: 'horizontal',
      items:['001', '002','003','004','SUM']
    },
    {
      name:'그룹사',
      direction: 'horizontal',
      items:['005','006', '999']
    },
    'TOT_SUM'
  ]
})

grdMain12Props.columns = grdMain12Props.fields
//추가
function addRows(row)
{
  if(row==1)
  { let item
    if(tab.value=='tab01')
    {
      item='주간'
    }
    else if(tab.value=='tab02')
    {
      item='주간 당직'
    }
    else if(tab.value=='tab03')
    {
      item='휴일 주간'
    }
    else if(tab.value=='tab04')
    {
      item='야간 당직'
    }

    grdMain01.value.getDataProvider().addRow({
      DIV_NM: item,
      MAIN_CONTENT: '',
      REMARKS: '',
      DIV: shiftCode.value,
      EMP_NO : '',
      DETAIL_SEQ : 0
    });

  }
  else if(row==2)
  {
    grdMain02.value.getDataProvider().addRow({
      CAMERA_NM: '',
      LOG_TIME: '',
      MAIN_CONTENT: '',
      ACTION_CONTENT: '',
      REMARKS : '',
      FILE_ID : '',
      DETAIL_SEQ : 0
    });
  }
  else if(row==3)
  {
    grdMain03.value.getDataProvider().addRow({
      CAMERA_NM: '',
      LOG_TIME: '',
      MAIN_CONTENT: '',
      ACTION_CONTENT: '',
      REMARKS :'',
      FILE_ID : '',
      DETAIL_SEQ : 0
    });
  }
  else if(row==4)
  {
    grdMain04.value.getDataProvider().addRow({
      FILE_ID: '',
      LOG_TIME: '',
      MAIN_CONTENT: '',
      ACTION_CONTENT: '',
      REMARKS : '',
      FILE_ID : '',
      DETAIL_SEQ : 0
    });
  }
  else if(row==5)
  {
    grdMain05.value.getDataProvider().addRow({
      FLIGHT_PATH: '',
      LOG_TIME: '',
      MAIN_CONTENT: '',
      REMARKS: '',
      FILE_ID:'',
      DETAIL_SEQ : 0
    });
  }
  else if(row==6)
  {
    grdMain06.value.getDataProvider().addRow({
      CMPNY_DIV: '',
      LOG_TIME: '',
      LOCATION: '',
      CASUALTY_NM: '',
      ACCIDENT_DESC :'',
      ACCIDENT_TYPE : '',
      HOSPITAL:'',
      DETAIL_SEQ : 0
    });
  }
  else if(row==7)
  {
    grdMain07.value.getDataProvider().addRow({
      DISASTER_TYPE: '',
      LOG_TIME: '',
      MAIN_CONTENT: '',
      ACTION_CONTENT: '',
      REMARKS :'',
      FILE_ID : '',
      DETAIL_SEQ : 0
    });
  }
  else if(row==8)
  {
    grdMain08.value.getDataProvider().addRow({
      TRAINING: '',
      LOG_TIME: '',
      MAIN_CONTENT: '',
      ACTION_CONTENT: '',
      REMARKS : '',
      FILE_ID : '',
      DETAIL_SEQ : 0
    });
  }
  else if(row==9)
  {
    grdMain09.value.getDataProvider().addRow({
      PARTS_NM: '',
      LOG_TIME: '',
      MAIN_CONTENT: '',
      REMARKS: '',
      FILE_ID : '',
      DETAIL_SEQ : 0
    });
  }
  else if(row==10)
  {
    grdMain10.value.getDataProvider().addRow({
      LOCATION: '',
      LOG_TIME: '',
      MAIN_CONTENT: '',
      ACTION_CONTENT: '',
      REMARKS : '',
      FILE_ID : '',
      DETAIL_SEQ : 0
    });
  }
  else if(row==11)
  {
    grdMain11.value.getDataProvider().addRow({
      ACTION_CONTENT: '',
      LOG_TIME: '',
      LOCATION: '',
      MAIN_CONTENT: '',
      REMARKS: '',
      FILE_ID : '',
      DETAIL_SEQ : 0
    });
  }
  else if(row==12)
  {
    grdMain12.value.getDataProvider().addRow({
      ACTION_CONTENT: '',
      LOG_TIME: '',
      LOCATION: '',
      MAIN_CONTENT: '',
      REMARKS : '',
      FILE_ID : '',
      DETAIL_SEQ : 0
    });
  }
}
//행삭제
function removeRows(rows)
{
  let checkedIndexes
  if(rows==1)
  {
  checkedIndexes = grdMain01.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain01.value.getDataProvider().removeRow(idx);
    }
  }
  else if(rows==2)
  {
  checkedIndexes = grdMain02.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain02.value.getDataProvider().removeRow(idx);
    }
  }
  else if(rows==3)
  {
  checkedIndexes = grdMain03.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain03.value.getDataProvider().removeRow(idx);
    }
  }
  else if(rows==4)
  {
  checkedIndexes = grdMain04.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain04.value.getDataProvider().removeRow(idx);
    }
  }
  if(rows==5)
  {
  checkedIndexes = grdMain05.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain05.value.getDataProvider().removeRow(idx);
    }
  }
  else if(rows==6)
  {
  checkedIndexes = grdMain06.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain06.value.getDataProvider().removeRow(idx);
    }
  }
  else if(rows==7)
  {
  checkedIndexes = grdMain07.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain07.value.getDataProvider().removeRow(idx);
    }
  }  
  else if(rows==8)
  {
  checkedIndexes = grdMain08.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain08.value.getDataProvider().removeRow(idx);
    }
  }
  else if(rows==9)
  {
  checkedIndexes = grdMain09.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain09.value.getDataProvider().removeRow(idx);
    }
  }
  if(rows==10)
  {
  checkedIndexes = grdMain10.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain10.value.getDataProvider().removeRow(idx);
    }
  }
  if(rows==11)
  {
  checkedIndexes = grdMain11.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain11.value.getDataProvider().removeRow(idx);
    }
  }
  if(rows==12)
  {
  checkedIndexes = grdMain12.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 행이 없습니다.'));
  }

  for (let idx of checkedIndexes) {
    grdMain12.value.getDataProvider().removeRow(idx);
    }
  }

}

// 그리드 클릭시 이벤트
const onCellItemClicked = async (grdNm, grid, index, col) => {

  if(enAble.value)
  {
    if(grdNm=='grdMain01')
    {
      grd.value=grdNm
      grdRow.value=index.dataRow
      empPopup.value.openPopup({ORGN_DIV:'A',CMP_DISABLE:true,HSE_ONLY : 'Y'});
    }
    else if(grdNm=='grdMain02')
    {
      grd.value=grdNm
      grdRow.value=index.dataRow
      let rowData = grdMain02.value.getDataProvider().getJsonRow(grdRow.value)
      rowData.WORK_LOG_ID=searchParamsSub.WORK_LOG_ID;
      SPPGB0010_Popup02.value.openPopup(rowData);
    }
    else if(grdNm=='grdMain03')
    {
      grd.value=grdNm
      grdRow.value=index.dataRow
      let rowData = grdMain03.value.getDataProvider().getJsonRow(grdRow.value)
      rowData.WORK_LOG_ID=searchParamsSub.WORK_LOG_ID;
      SPPGB0010_Popup02.value.openPopup(rowData);
    }
    else if(grdNm=='grdMain04')
    {
      grd.value=grdNm
      grdRow.value=index.dataRow
      if(col.fieldName=='REMARKS')
      {
        let rowData = grdMain04.value.getDataProvider().getJsonRow(grdRow.value)
        rowData.WORK_LOG_ID=searchParamsSub.WORK_LOG_ID;
        SPPGB0010_Popup02.value.openPopup(rowData);
      }
      else
      {
        locPopup.value.openPopup();
      }
      
    }
    else if(grdNm=='grdMain05')
    {
      grd.value=grdNm
      grdRow.value=index.dataRow
      let rowData = grdMain05.value.getDataProvider().getJsonRow(grdRow.value)
      rowData.WORK_LOG_ID=searchParamsSub.WORK_LOG_ID;
      SPPGB0010_Popup02.value.openPopup(rowData);
    }
    else if(grdNm=='grdMain06')
    {
      grd.value=grdNm
      if(col.fieldName === 'LOCATION')
      {
        grdRow.value=index.dataRow
        locPopup.value.openPopup();
      }
      else if(col.fieldName === 'CASUALTY_NM')
      {
        grdRow.value=index.dataRow
        empPopup.value.openPopup({ORGN_DIV:'A',CMP_DISABLE:true,HSE_ONLY : 'Y'});
      }
    }
    else if(grdNm=='grdMain07')
    {
      grd.value=grdNm
      grdRow.value=index.dataRow
      let rowData = grdMain07.value.getDataProvider().getJsonRow(grdRow.value)
      rowData.WORK_LOG_ID=searchParamsSub.WORK_LOG_ID;
      SPPGB0010_Popup02.value.openPopup(rowData);
    }
    else if(grdNm=='grdMain08')
    {
      grd.value=grdNm
      grdRow.value=index.dataRow
      let rowData = grdMain08.value.getDataProvider().getJsonRow(grdRow.value)
      rowData.WORK_LOG_ID=searchParamsSub.WORK_LOG_ID;
      SPPGB0010_Popup02.value.openPopup(rowData);
    }
    else if(grdNm=='grdMain09')
    {
      grd.value=grdNm
      grdRow.value=index.dataRow
      let rowData = grdMain09.value.getDataProvider().getJsonRow(grdRow.value)
      rowData.WORK_LOG_ID=searchParamsSub.WORK_LOG_ID;
      SPPGB0010_Popup02.value.openPopup(rowData);
    }
    else if(grdNm=='grdMain10')
    {
      grd.value=grdNm
      grdRow.value=index.dataRow
      if(col.fieldName=='REMARKS')
      {
        let rowData = grdMain10.value.getDataProvider().getJsonRow(grdRow.value)
        rowData.WORK_LOG_ID=searchParamsSub.WORK_LOG_ID;
        SPPGB0010_Popup02.value.openPopup(rowData);
      }
      else
      {
        locPopup.value.openPopup();
      }
    }
    else if(grdNm=='grdMain11')
    {
      
      grd.value=grdNm
      grdRow.value=index.dataRow
      if(col.fieldName=='REMARKS')
      {
        let rowData = grdMain11.value.getDataProvider().getJsonRow(grdRow.value)
        rowData.WORK_LOG_ID=searchParamsSub.WORK_LOG_ID;
        SPPGB0010_Popup02.value.openPopup(rowData);
      }
      else
      {
        locPopup.value.openPopup();
      }
    }
  }
}

//탭 클릭시 이벤트
const onTabChange = async(newTab)=>{


if (newTab=='tab01')
{
  dateDiv.value='D'
  workShift.value='D1'

}
else if (newTab=='tab02')
{
  dateDiv.value='D'
  workShift.value='D2'
}
else if (newTab=='tab03')
{
  dateDiv.value='H'
  workShift.value='D'
}
else if (newTab=='tab04')
{
  dateDiv.value='N'
  workShift.value='N'
}

searchParamsSub.DATE_DIV = dateDiv.value
searchParamsSub.WORK_SHIFT = workShift.value
searchParamsSub.WORK_LOG_ID = workLogId.value

if(writeDiv.value=='M')
{
  searchDetailData();
}
// clearPopup();

}

//시간입력
const onEditCommit = (grid, index, oldValue, newValue) => {
// 1) 필드명 안전 추출 (wrapper별 차이 대비)
const fieldName =
  index?.fieldName ??
  grid.getColumn?.(index?.column)?.fieldName ??
  grid.getDataProvider?.().getFieldName?.(index?.field);
if (fieldName !== 'LOG_TIME') return;

// 2) 값 정규화 (언더스코어/공백 제거, 4자리면 HH:mm로 변환)
const raw = String(newValue ?? '').replace(/[\s_]/g, '');
const v = raw.includes(':')
  ? raw
  : (raw.length === 4 ? `${raw.slice(0,2)}:${raw.slice(2)}` : raw);

// 3) 최종 검증 (00:00~23:59)
if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(v)) {
  grid.cancel();                // 커밋 취소
  // alert('시간은 00:00 ~ 23:59 형식으로 입력하세요.');
  return Message.warn(t('시간은 00:00 ~ 23:59 형식으로 입력하세요.'));
}

// 4) 정상값은 통일 포맷으로 반영
grid.setEditValue?.(v);
};

const onEmpSelected =(val)=>{
  if(grd.value=='grdMain01')
  {
    grdMain01.value.getGridView().checkItem(grdRow.value,true)
    grdMain01.value.getGridView().commit()
    grdMain01.value.getDataProvider().setValue(grdRow.value,'MAIN_CONTENT',val.EMP_NM + ' ' + val.JOB_TIT_NM)
    grdMain01.value.getDataProvider().setValue(grdRow.value,'EMP_NO',val.EMP_NO)
  }
  else if(grd.value=='grdMain06')
  {
    grdMain06.value.getGridView().checkItem(grdRow.value,true)
    grdMain06.value.getGridView().commit()
    grdMain06.value.getDataProvider().setValue(grdRow.value,'CASUALTY_NM',val.EMP_NM + ' ' + val.JOB_TIT_NM)
    // grdMain06.value.getDataProvider().setValue(grdRow.value,'EMP_NO',val.EMP_NO)
  }
}

const onLocSelected = (val)=>{

  if(grd.value=='grdMain04')
  {
    grdMain04.value.getGridView().checkItem(grdRow.value,true)
    grdMain04.value.getGridView().commit()
    grdMain04.value.getDataProvider().setValue(grdRow.value,'LOCATION',val[2].TXT)
  }
  else if(grd.value=='grdMain06')
  {
    grdMain06.value.getGridView().checkItem(grdRow.value,true)
    grdMain06.value.getGridView().commit()
    grdMain06.value.getDataProvider().setValue(grdRow.value,'LOCATION',val[2].TXT)
    // grdMain06.value.getDataProvider().setValue(grdRow.value,'EMP_NO',val.EMP_NO)
  }
  else if(grd.value=='grdMain10')
  {
    grdMain10.value.getGridView().checkItem(grdRow.value,true)
    grdMain10.value.getGridView().commit()
    grdMain10.value.getDataProvider().setValue(grdRow.value,'LOCATION',val[2].TXT)
    // grdMain06.value.getDataProvider().setValue(grdRow.value,'EMP_NO',val.EMP_NO)
  }
  else if(grd.value=='grdMain11')
  {
    grdMain11.value.getGridView().checkItem(grdRow.value,true)
    grdMain11.value.getGridView().commit()
    grdMain11.value.getDataProvider().setValue(grdRow.value,'LOCATION',val[2].TXT)
    // grdMain06.value.getDataProvider().setValue(grdRow.value,'EMP_NO',val.EMP_NO)
  }
}

const searchDetailData = async () =>
{
  //console.log("wirteDiv:",writeDiv.value);
  //console.log("searchParams:",searchParamsSub)
  let app
  const res= await commonSearchApi({ queryId: 'SPPGB0010_SEARCH_02', param: searchParamsSub})
    //console.log(res)
    if(res.ORESULT_CUR.length>0)
    {
      let value=res.ORESULT_CUR[0]
      //console.log(value)
      today.value = value.WRITE_DT; 
      todayNm.value=dayjs(value.WRITE_DT).format('ddd')
      workLogId.value=value.WORK_LOG_ID;
      dateDiv.value = value.DT_DIV;
      workShift.value = value.WORK_SHIFT;
      app=value.APP_YN

      if(dateDiv.value=='D' && workShift.value=='D1')
      {
        tab.value='tab01'
      }
      if(dateDiv.value=='D' && workShift.value=='D2')
      {
        tab.value='tab02'
      }
      if(dateDiv.value=='H' && workShift.value=='D')
      {
        tab.value='tab03'
      }
      if(dateDiv.value=='N' && workShift.value=='N')
      {
        tab.value='tab04'
      }
    }
    else
    {
      clearGrid();
      return;
    }

    if(app=='Y' || app=='B')
    {
      enAble.value=false
      grdMain01.value.getGridView().setEditOptions({editable : false});
      grdMain02.value.getGridView().setEditOptions({editable : false});
      grdMain03.value.getGridView().setEditOptions({editable : false});
      grdMain04.value.getGridView().setEditOptions({editable : false});
      grdMain05.value.getGridView().setEditOptions({editable : false});
      grdMain06.value.getGridView().setEditOptions({editable : false});
      grdMain07.value.getGridView().setEditOptions({editable : false});
      grdMain08.value.getGridView().setEditOptions({editable : false});
      grdMain09.value.getGridView().setEditOptions({editable : false});
      grdMain10.value.getGridView().setEditOptions({editable : false});
      grdMain11.value.getGridView().setEditOptions({editable : false});
      grdMain12.value.getGridView().setEditOptions({editable : false});
    }
    else
    {
      enAble.value=true
      grdMain01.value.getGridView().setEditOptions({editable : true});
      grdMain02.value.getGridView().setEditOptions({editable : true});
      grdMain03.value.getGridView().setEditOptions({editable : true});
      grdMain04.value.getGridView().setEditOptions({editable : true});
      grdMain05.value.getGridView().setEditOptions({editable : true});
      grdMain06.value.getGridView().setEditOptions({editable : true});
      grdMain07.value.getGridView().setEditOptions({editable : true});
      grdMain08.value.getGridView().setEditOptions({editable : true});
      grdMain09.value.getGridView().setEditOptions({editable : true});
      grdMain10.value.getGridView().setEditOptions({editable : true});
      grdMain11.value.getGridView().setEditOptions({editable : true});
      grdMain12.value.getGridView().setEditOptions({editable : true});
    }

    if(res.ORESULT_CUR_A.length>0)
    {
      grdMain01.value.getDataProvider().setRows(res.ORESULT_CUR_A);
    }
    else
    {
      grdMain01.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_B.length>0)
    {
      grdMain02.value.getDataProvider().setRows(res.ORESULT_CUR_B);
    }
    else
    {
      grdMain02.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_C.length>0)
    {
      grdMain03.value.getDataProvider().setRows(res.ORESULT_CUR_C);
    }
    else
    {
      grdMain03.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_D.length>0)
    {
      grdMain04.value.getDataProvider().setRows(res.ORESULT_CUR_D);
    }
    else
    {
      grdMain04.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_E.length>0)
    {
      grdMain05.value.getDataProvider().setRows(res.ORESULT_CUR_E);
    }
    else
    {
      grdMain05.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_F.length>0)
    {
      grdMain06.value.getDataProvider().setRows(res.ORESULT_CUR_F);
    }
    else
    {
      grdMain06.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_G.length>0)
    {
      grdMain07.value.getDataProvider().setRows(res.ORESULT_CUR_G);
    }
    else
    {
      grdMain07.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_H.length>0)
    {
      grdMain08.value.getDataProvider().setRows(res.ORESULT_CUR_H);
    }
    else
    {
      grdMain08.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_I.length>0)
    {
      grdMain09.value.getDataProvider().setRows(res.ORESULT_CUR_I);
    }
    else
    {
      grdMain09.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_J.length>0)
    {
      grdMain10.value.getDataProvider().setRows(res.ORESULT_CUR_J);
    }
    else
    {
      grdMain10.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_K.length>0)
    {
      grdMain11.value.getDataProvider().setRows(res.ORESULT_CUR_K);
    }    else
    {
      grdMain11.value.getDataProvider().clearRows();
    }

    if(res.ORESULT_CUR_L.length>0)
    {
      grdMain12.value.getDataProvider().setRows(res.ORESULT_CUR_L);
    }    else
    {
      grdMain12.value.getDataProvider().clearRows();
    }
}

const clearGrid =()=>
{
  enAble.value=true
  if(writeDiv.value == 'C')
  {
    today.value=dayjs().format('YYYY-MM-DD');
    todayNm.value=dayjs(today.value).format('ddd')
  }
  workLogId.value=null;
  grdMain01.value.getDataProvider().clearRows();
  grdMain02.value.getDataProvider().clearRows();
  grdMain03.value.getDataProvider().clearRows();
  grdMain04.value.getDataProvider().clearRows();
  grdMain05.value.getDataProvider().clearRows();
  grdMain06.value.getDataProvider().clearRows();
  grdMain07.value.getDataProvider().clearRows();
  grdMain08.value.getDataProvider().clearRows();
  grdMain09.value.getDataProvider().clearRows();
  grdMain10.value.getDataProvider().clearRows();
  grdMain11.value.getDataProvider().clearRows();
  grdMain12.value.getDataProvider().clearRows();
}

const appData = reactive({})
const approvalAppkey = (appKey) => {
  appData.APPROVE_ID = appKey

  //console.log("appData:",appData)
  // onButtonsClick({ id: 'btnSearch' })
  commonExecuteApi({ queryId: 'SPPGB0010_SAVE_03', list: [appData] })
  onButtonsClick({ id: 'btnSearch' })
}

const approval = async () => {
  // let row= grdMain1.value.getGridView().getSelectedRows()
  let row= grdMain1.value.getGridView().getCheckedRows(true)
  let rowData = grdMain1.value.getDataProvider().getJsonRow(row)
  
  // console.log(rowData.APP_YN);
  if(rowData.APP_YN=='Y')
  {
    return Message.warn(t('결재가 완료된 건입니다.'))
  }
  else if(rowData.APP_YN=='B')
  {
    return Message.warn(t('결재가 진행 중인 건입니다.'))
  }

  let line

  line='CLR_15'


  appData.CMPNY_DIV = userStore.cmpnyDiv
  appData.WRITE_DT = rowData.WRITE_DT
  
  

  const res= await commonSearchApi({ queryId: 'SPPGB0010_SEARCH_03', param: appData})
  //console.log("appres:",res);
  let param=
  {
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD : rowData.BSNS_CD,
    DEPT_CD : rowData.DEPT_CD,
    PROCESS_CD : rowData.PROCESS_CD,
    REV_SEQ : rowData.REV_SEQ,
  }

  // let result= await this.vm.$swal({
  //       title: this.t(today.value + ' 업무일지를 결재상신 하시겠습니까?'),
  //       showCancelButton: true,
  //       focusConfirm: true,
  //       didOpen: () => {
  //         const confirmButton = this.vm.$swal.getConfirmButton?.();
  //         if (confirmButton) confirmButton.focus(); // ✅ 수동 포커스
  //       }
  //     })

  //     if (!result.isConfirmed) {
  //       return
  //     }

    approvalPopup.value.openPopup({
      CLSS_ID: 'SPPGB0010',
      TITLE: rowData.WRITE_DT + ' 통합 관제 센터 업무일지',
      CMPNY_DIV: userStore.cmpnyDiv,
      DATA_KEY:
        userStore.cmpnyDiv + ';' + rowData.WRITE_DT,
      REPORT: setReport(res), // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      CLRLINE: line, //결재라인
      // PARAM424 : '',  //사고보고서용 결재라인no,사번
    })
  // })

  // onButtonsClick({ id: 'btnSearch' })
}


const setReport = (data) => {
  let htmlReport
  let hDay
  //console.log(data)

  hDay=data.ORESULT_CUR.some(v => v.DT_DIV === 'H')
  //console.log("hDay:",hDay);

  if(hDay)
  {  
    htmlReport =
    `<html>
  <div>
    <div style="text-align:left;">
    <h3>1.근무현황</h3>
    </div>
    <table class="table">
      <tr>
        <th class="table_head_cell">근무형태</th>
        <th class="table_head_cell">근 무 자</th>
        <th class="table_head_cell">비고</th>
      </tr>`;

      for(const d of data.ORESULT_CUR)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.EMP_NM}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };
htmlReport+=
    `</table>
  </div>

  <div>
    <div style="text-align:left;">
    <h3>2.일일 업무 수행 현황</h3>
    <h4> 1)CCTV-관제</h4>
    </div>
    <table class="table">
      <tr>
        <th class="table_head_cell">근무형태</th>
        <th class="table_head_cell">카메라명칭</th>
        <th class="table_head_cell">시    간</th>
        <th class="table_head_cell">주요내용</th>
        <th class="table_head_cell">조치내용</th>
        <th class="table_head_cell">비    고</th>
      </tr>`;

      for(const d of data.ORESULT_CUR_B)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.CAMERA_NM}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };
      
      htmlReport+= `</table>

      <div style="text-align:left;">
      <h4> 2)Hi-CAMs</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">카메라명칭</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_C)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.CAMERA_NM}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>
      <div style="text-align:left;">
      <h4> 3)소방관제</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">위    치</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_D)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.LOCATION}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>

      <div style="text-align:left;">
      <h4> 4)사고</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">사 업 부</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">장    소</th>
          <th class="table_head_cell">재 해 자</th>
          <th class="table_head_cell">사고내용</th>
          <th class="table_head_cell">사고유형</th>
          <th class="table_head_cell">병    원</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_F)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.LOG_CMPNY}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_center">${d.LOCATION}</td>
          <td class="table_content_cell_center">${d.CASUALTY_NM}</td>
          <td class="table_content_cell_left">${d.ACCIDENT_DESC}</td>
          <td class="table_content_cell_center">${d.ACCIDENT_TYPE}</td>
          <td class="table_content_cell_center">${d.HOSPITAL}</td>
        </tr>`
      };

      htmlReport+= `
      </table>

      <div style="text-align:left;">
      <h4> 5)재난</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">재난구분</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_G)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.DISASTER_TYPE}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>

      <div style="text-align:left;">
      <h4> 6)교육/훈련</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">훈 련 명</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_H)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.TRAINING}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>

      <div style="text-align:left;">
      <h4> 7)장비점검</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">장 비 명</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_I)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.PARTS_NM}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>
      
      <div style="text-align:left;">
      <h4> 8)현장점검</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">위    치</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_J)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.LOCATION}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>
      <div style="text-align:left;">
      <h4> 9)기타</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">조치사항</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">위    치</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

    for(const d of data.ORESULT_CUR_K)
    {
      htmlReport+=
      `<tr>
        <td class="table_content_cell_center">${d.REPORT_DESC}</td>
        <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
        <td class="table_content_cell_center">${d.LOG_TIME}</td>
        <td class="table_content_cell_center">${d.LOCATION}</td>
        <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
        <td class="table_content_cell_center">${d.REMARKS}</td>
      </tr>`
    };

    htmlReport+= `
      </table>

  </div>

  <style>
    .table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
        }

    .table_head_cell {
        text-align: center; /* 가로 가운데 정렬 */
        font-weight: bold;
        vertical-align: middle; /* 세로 가운데 정렬 */
        border-collapse: collapse;
        width: 100%;
        height: 50px;
        border-top : 1px solid black;
        border-bottom : 2px solid black;
        border-left : 1px solid black;
        border-right : 1px solid black;
        table-layout: fixed;
      }

    .table_content_cell_center {
        text-align: center; /* 가로 가운데 정렬 */
        vertical-align: middle; /* 세로 가운데 정렬 */
        border-collapse: collapse;
        width: 100%;
        height: 50px;
        border-top : 1px solid black;
        border-bottom : 1px solid black;
        border-left : 1px solid black;
        border-right : 1px solid black;
        table-layout: fixed;
      }

      .table_content_cell_left {
        text-align: left; /* 가로 왼쪽 정렬 */
        vertical-align: middle; /* 세로 가운데 정렬 */
        border-collapse: collapse;
        width: 100%;
        height: 50px;
        border-top : 1px solid black;
        border-bottom : 1px solid black;
        border-left : 1px solid black;
        border-right : 1px solid black;
        table-layout: fixed;
      }
  </style>

</html>`
  }
else
  {
  htmlReport =
    `<html>
  <div>
    <div style="text-align:left;">
    <h3>1.근무현황</h3>
    </div>
    <table class="table">
      <tr>
        <th class="table_head_cell">근무형태</th>
        <th class="table_head_cell">근 무 자</th>
        <th class="table_head_cell">비고</th>
      </tr>`;

      for(const d of data.ORESULT_CUR)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.EMP_NM}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };
htmlReport+=
    `</table>
  </div>

  <div>
    <div style="text-align:left;">
    <h3>2.일일 업무 수행 현황</h3>
    <h4> 1)CCTV-관제</h4>
    </div>
    <table class="table">
      <tr>
        <th class="table_head_cell">근무형태</th>
        <th class="table_head_cell">카메라명칭</th>
        <th class="table_head_cell">시    간</th>
        <th class="table_head_cell">주요내용</th>
        <th class="table_head_cell">조치내용</th>
        <th class="table_head_cell">비    고</th>
      </tr>`;

      for(const d of data.ORESULT_CUR_B)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.CAMERA_NM}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };
      
      htmlReport+= `</table>

      <div style="text-align:left;">
      <h4> 2)Hi-CAMs</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">카메라명칭</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_C)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.CAMERA_NM}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>
      <div style="text-align:left;">
      <h4> 3)소방관제</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">위    치</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_D)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.LOCATION}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>

      <div style="text-align:left;">
      <h4> 4)드론관제</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">경    로</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

    for(const d of data.ORESULT_CUR_E)
    {
      htmlReport+=
      `<tr>
        <td class="table_content_cell_center">${d.DERONE_PATH}</td>
        <td class="table_content_cell_center">${d.LOG_TIME}</td>
        <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
        <td class="table_content_cell_center">${d.REMARKS}</td>
      </tr>`
    };

    htmlReport+= `
      </table>

      <div style="text-align:left;">
      <h4> 5)사고</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">사 업 부</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">장    소</th>
          <th class="table_head_cell">재 해 자</th>
          <th class="table_head_cell">사고내용</th>
          <th class="table_head_cell">사고유형</th>
          <th class="table_head_cell">병    원</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_F)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.LOG_CMPNY}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_center">${d.LOCATION}</td>
          <td class="table_content_cell_center">${d.CASUALTY_NM}</td>
          <td class="table_content_cell_left">${d.ACCIDENT_DESC}</td>
          <td class="table_content_cell_center">${d.ACCIDENT_TYPE}</td>
          <td class="table_content_cell_center">${d.HOSPITAL}</td>
        </tr>`
      };

      htmlReport+= `
      </table>

      <div style="text-align:left;">
      <h4> 6)재난</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">재난구분</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_G)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.DISASTER_TYPE}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>

      <div style="text-align:left;">
      <h4> 7)교육/훈련</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">훈 련 명</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_H)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.TRAINING}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>

      <div style="text-align:left;">
      <h4> 8)장비점검</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">장 비 명</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_I)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.PARTS_NM}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>
      
      <div style="text-align:left;">
      <h4> 9)현장점검</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">위    치</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">조치내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

      for(const d of data.ORESULT_CUR_J)
      {
        htmlReport+=
        `<tr>
          <td class="table_content_cell_center">${d.REPORT_DESC}</td>
          <td class="table_content_cell_center">${d.LOCATION}</td>
          <td class="table_content_cell_center">${d.LOG_TIME}</td>
          <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
          <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
          <td class="table_content_cell_center">${d.REMARKS}</td>
        </tr>`
      };

      htmlReport+= `
      </table>
      <div style="text-align:left;">
      <h4> 10)기타</h4>
      </div>
      <table class="table">
        <tr>
          <th class="table_head_cell">근무형태</th>
          <th class="table_head_cell">조치사항</th>
          <th class="table_head_cell">시    간</th>
          <th class="table_head_cell">위    치</th>
          <th class="table_head_cell">주요내용</th>
          <th class="table_head_cell">비    고</th>
        </tr>`;

    for(const d of data.ORESULT_CUR_K)
    {
      htmlReport+=
      `<tr>
        <td class="table_content_cell_center">${d.REPORT_DESC}</td>
        <td class="table_content_cell_left">${d.ACTION_CONTENT}</td>
        <td class="table_content_cell_center">${d.LOG_TIME}</td>
        <td class="table_content_cell_center">${d.LOCATION}</td>
        <td class="table_content_cell_left">${d.MAIN_CONTENT}</td>
        <td class="table_content_cell_center">${d.REMARKS}</td>
      </tr>`
    };

    htmlReport+= `
      </table>

  </div>

  <style>
    .table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
        }

    .table_head_cell {
        text-align: center; /* 가로 가운데 정렬 */
        font-weight: bold;
        vertical-align: middle; /* 세로 가운데 정렬 */
        border-collapse: collapse;
        width: 100%;
        height: 50px;
        border-top : 1px solid black;
        border-bottom : 2px solid black;
        border-left : 1px solid black;
        border-right : 1px solid black;
        table-layout: fixed;
      }

    .table_content_cell_center {
        text-align: center; /* 가로 가운데 정렬 */
        vertical-align: middle; /* 세로 가운데 정렬 */
        border-collapse: collapse;
        width: 100%;
        height: 50px;
        border-top : 1px solid black;
        border-bottom : 1px solid black;
        border-left : 1px solid black;
        border-right : 1px solid black;
        table-layout: fixed;
      }

      .table_content_cell_left {
        text-align: left; /* 가로 왼쪽 정렬 */
        vertical-align: middle; /* 세로 가운데 정렬 */
        border-collapse: collapse;
        width: 100%;
        height: 50px;
        border-top : 1px solid black;
        border-bottom : 1px solid black;
        border-left : 1px solid black;
        border-right : 1px solid black;
        table-layout: fixed;
      }
  </style>

</html>`
}

  return htmlReport
}

const popClose = (val) => {
  
  if(val=='Y')
  {
    onButtonsClick({ id: 'btnSearch' })
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        usePermission
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <i-select
              label-width="50px"
              width="150px"
              :label="$t('년도')"
              v-model="selectYear"
              type="YEAR"
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="150px"
              :label="$t('월')"
              v-model="selectMonth"
              type="MM"
            />
            <IButtonList
                :button-list="['btnDispatchStatus']"
                @click-button="onButtonsClick"/>
          </div>
        </v-sheet>
        <VRow no-gutters style="height:40%;">
          <VCol cols="5" class="pa-2 pt-0 pb-0" style="height:95%;">
            <v-sheet class="pa-2 d-flex justify-end">
              <IButtonList
                :button-list="['btnSearch','btnReqApply']"
                @click-button="onButtonsClick"/>
            </v-sheet>
            <RealGrid
              ref="grdMain1"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys" 
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
              @onCurrentRowChanged="rowChanged"
            />
          </VCol>
          <VCol cols="7" class="pa-2 d-flex flex-column" style="height:95%;" >
              
              <v-sheet class="pa-2 d-flex justify-end">
                  <IButtonList
                    :button-list="['btnNew','btnUpdate']"
                    @click-button="onButtonsClick"/>
              </v-sheet>
              <div>
                <span><h4>작 성 일 : {{ today }}{{ '('+todayNm+')' }}</h4></span>
              </div>
              <v-sheet>
              <VTabs v-model="tab" @update:modelValue="onTabChange">
                <VTab value="tab01">주간</VTab>
                <VTab value="tab02">주간당직</VTab>
                <VTab value="tab03">휴일주간</VTab>
                <VTab value="tab04">야간</VTab>
              </VTabs>
              <VWindow v-model="tab" >
                <VWindowItem value="tab01">
                  
                </VWindowItem>
                <VWindowItem value="tab02">
                  
                </VWindowItem>
                <VWindowItem value="tab03">
                  
                </VWindowItem>
                <VWindowItem value="tab04">
                  
                </VWindowItem>
              </VWindow>
            </v-sheet>
            <div style="height:100%; overflow:auto" >


              <div style="  display: flex;  justify-content: space-between;  align-items: center;">
                <span>1. 근무 현황</span>
              </div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(1)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(1)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
                <RealGrid
                  style="height:200px; width:100%;"
                  ref="grdMain01"
                  :grid-view-option="grdMain01Props.gridViewOption"
                  :keys="grdMain01Props.keys" 
                  :fields="grdMain01Props.fields"
                  :columns="grdMain01Props.columns"
                  @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain01', grid, index, col)"
                  />
              <div>2. 일일 업무 수행 현황</div>
              <div>
              <div>  2-1 CCTV 관제</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn  v-show="enAble" @click="addRows(2)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn  v-show="enAble" @click="removeRows(2)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain02"
                :grid-view-option="grdMain02Props.gridViewOption"
                :keys="grdMain02Props.keys" 
                :fields="grdMain02Props.fields"
                :columns="grdMain02Props.columns"
                @onEditCommit = "onEditCommit"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain02', grid, index, col)"/>
              </div>
              <div v-if="tab == 'tab01'">2-2 HiCAMs 관제/소방관제/드론관제</div>
              <div v-else>2-2 HiCAMs 관제/소방관제</div>
              <div>
              <div>1) HiCAMs 관제</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(3)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(3)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain03"
                :grid-view-option="grdMain03Props.gridViewOption"
                :keys="grdMain03Props.keys" 
                :fields="grdMain03Props.fields"
                :columns="grdMain03Props.columns"
                @onEditCommit = "onEditCommit"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain03', grid, index, col)"
                />
              </div>
              <div>
              <div>2) 소방관제</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(4)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(4)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain04"
                :grid-view-option="grdMain04Props.gridViewOption"
                :keys="grdMain04Props.keys" 
                :fields="grdMain04Props.fields"
                :columns="grdMain04Props.columns"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain04', grid, index, col)"
                @onEditCommit = "onEditCommit"
                />
              </div>
              <div v-show="tab == 'tab01'">
              <div>3) 드론관제</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(5)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(5)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain05"
                :grid-view-option="grdMain05Props.gridViewOption"
                :keys="grdMain05Props.keys" 
                :fields="grdMain05Props.fields"
                :columns="grdMain05Props.columns"
                @onEditCommit = "onEditCommit"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain05', grid, index, col)"/>
              </div>
              <div>2-3 비상대응</div>
              <div>
              <div>1) 사고</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(6)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(6)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain06"
                :grid-view-option="grdMain06Props.gridViewOption"
                :keys="grdMain06Props.keys" 
                :fields="grdMain06Props.fields"
                :columns="grdMain06Props.columns"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain06', grid, index, col)"
                @onEditCommit = "onEditCommit"
                />
              </div>
              <div>
              <div>2) 재난</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(7)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(7)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain07"
                :grid-view-option="grdMain07Props.gridViewOption"
                :keys="grdMain07Props.keys" 
                :fields="grdMain07Props.fields"
                :columns="grdMain07Props.columns"
                @onEditCommit = "onEditCommit"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain07', grid, index, col)"
                />
              </div>
              <div>
              <div>3) 교육/훈련</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(8)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(8)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain08"
                :grid-view-option="grdMain08Props.gridViewOption"
                :keys="grdMain08Props.keys" 
                :fields="grdMain08Props.fields"
                :columns="grdMain08Props.columns"
                @onEditCommit = "onEditCommit"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain08', grid, index, col)"
                />
              </div>
              <div>2-4 기타사항</div>
              <div>
              <div>1) 장비점검</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(9)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(9)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain09"
                :grid-view-option="grdMain09Props.gridViewOption"
                :keys="grdMain09Props.keys" 
                :fields="grdMain09Props.fields"
                :columns="grdMain09Props.columns"
                @onEditCommit = "onEditCommit"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain09', grid, index, col)"
                />
              </div>
              <div>
              <div>2) 현장 점검</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(10)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(10)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain10"
                :grid-view-option="grdMain10Props.gridViewOption"
                :keys="grdMain10Props.keys" 
                :fields="grdMain10Props.fields"
                :columns="grdMain10Props.columns"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain10', grid, index, col)"
                @onEditCommit = "onEditCommit"/>
              </div>
              <div>
              <div>3) 기타사항</div>
              <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn v-show="enAble" @click="addRows(11)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn v-show="enAble" @click="removeRows(11)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain11"
                :grid-view-option="grdMain11Props.gridViewOption"
                :keys="grdMain11Props.keys" 
                :fields="grdMain11Props.fields"
                :columns="grdMain11Props.columns"
                @onCellItemClicked="(grid, index, col) => onCellItemClicked('grdMain11', grid, index, col)"
                @onEditCommit = "onEditCommit"/>
              </div>
              <div>3. 구조/구급 출동현황</div>
              <!-- <div style="display: flex;  align-items: center;  gap: 3px;">
                <v-btn @click="addRows(12)" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                <v-btn @click="removeRows(12)" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>    -->
              <RealGrid
                style="height:200px; width:100%;"
                ref="grdMain12"
                :grid-view-option="grdMain12Props.gridViewOption"
                :keys="grdMain12Props.keys" 
                :fields="grdMain12Props.fields"
                :columns="grdMain12Props.columns"
                :column-layout="grdMain12Props.columnLayout"/>
            </div>
          </VCol>
        </VRow>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="onEmpSelected" />
  <LocationPopup ref="locPopup" @selectedArr="onLocSelected"/>
  <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
  <SPPGB0010Popup01 ref="SPPGB0010_Popup"/>
  <SPPGB0010Popup02 ref="SPPGB0010_Popup02" @closed="popClose"/>
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
</style>

