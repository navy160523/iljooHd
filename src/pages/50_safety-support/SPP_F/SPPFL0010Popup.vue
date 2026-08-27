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
const titleButton = reactive(['btnTemporaryStorage','btnUpdate','btnPrint','btnClose']);
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

const search=ref(false)//저장시 조회
//각 항목에 들어갈 변수
const cmpnyDiv = ref('');//회사
const bsnsCd = ref('');//사업부
const deptCd = ref('')//부서
const processCd = ref('');//공정/설비
const psiSeq = ref('');//순번
const psiDate = ref('');//사고일자
const psiTime = ref('');//사고일자
const psiDept = ref('');//사고부서
const psiProcess=ref('');//사고공정
const psiInvDt = ref('');//사고 조사일자
const psiInvDt1 = ref('');//사고 조사일자
const psiInvDt2 = ref('');//사고 조사일자
const psiInvTeam=ref('');//사고 조사팀장
const psiInvTeam1=ref('');//사고 조사 팀원1
const psiInvTeam2=ref('');//사고 조사 팀원2
const psiInvTeam3=ref('');//사고 조사 팀원3
const psiInvTeamEmpNo=ref('');//사고 조사팀장
const psiInvTeam1EmpNo=ref('');//사고 조사 팀원1
const psiInvTeam2EmpNo=ref('');//사고 조사 팀원2
const psiInvTeam3EmpNo=ref('');//사고 조사 팀원3
const psiType = ref('');//사고형태
const psiTypeInput = ref('');//사고형태 기타입력
const psiMat = ref('');//사고물질
const psiDesc = ref('');//사고개요
const psiCause = ref('');//사고 발생 원인
const humDmgIn = ref('');//사내 인적피해
const humDmgOut = ref('');//사외 진적피해
const matDmgIn = ref('');//사내 물적피해
const matDmgOut = ref('');//사외 물적피해
const etcDmg = ref('');//기타영향
const emrDesc = ref('');//비상조치사항
const prvMeasSt=ref('');//단기적 재발방지 대책
const prvMeasStDt=ref('');//단기적 재발방지 대책 일자
const prvMeasStDept=ref('');//단기적 재발방지 대책 책임부서
const prvMeasLt=ref('');//장기적 재발방지 대책
const prvMeasLtDt=ref('');//장기적 재발방지 대책 일자
const prvMeasLtDept=ref('');//장기적 재발방지 대책 책임부서
const prvMeasTech=ref('');//기술적 재발방지 대책
const prvMeasTechDt=ref('');//기술적 재발방지 대책 일자
const prvMeasTechDept=ref('');//기술적 재발방지 대책 책임부서
const prvMeasMgmt=ref('');//관리적 재발방지 대책
const prvMeasMgmtDt=ref('');//관리적 재발방지 대책 일자
const prvMeasMgmtDept=ref('');//관리적 재발방지 대책 책임부서
const emrDescEval =ref('');//비상 조치사항 평가
const saveStat=ref('');//저장상태
const remarks = ref('');//비고
const psiDeptCd = ref('');
const prvMeasStDeptCd = ref('');//단기적 재발방지 대책 책임부서
const prvMeasLtDeptCd = ref('');//장기적 재발방지 대책 책임부서
const prvMeasTechDeptCd = ref('');//기술적 재발방지 대책 책임부서
const prvMeasMgmtDeptCd = ref('');//관리적 재발방지 대책 책임부서
const app = ref('');

const showDatePerPicker1 = ref(false)
const showDatePerPicker2 = ref(false)
const datePerInput1=ref(null)
const datePerInput2=ref(null)
const showDatePicker = ref(false);
const dateInput =ref(null);
const showTimePicker = ref(false);
const timeInput =ref(null);
const allDay = ref(false);


// const displayDate=ref('')//날짜 보이

const saveParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : '',
  DEPT_CD : '',
  PROCESS_CD : '',
  PSI_SEQ : '',
  PSI_DATE : '',
  PSI_DEPT : '',
  PSI_PROCESS : '',
  PSI_INV_DT : '',
  PSI_INV_TEAM : '',
  PSI_INV_TEAM_1 : '',
  PSI_INV_TEAM_2 : '',
  PSI_INV_TEAM_3 : '',
  PSI_TYPE : '',
  PSI_TYPE_INPUT : '',
  PSI_MAT : '',
  PSI_DESC : '',
  PSI_CAUSE : '',
  HUM_DMG_IN : '',
  HUM_DMG_OUT : '',
  MAT_DMG_IN : '',
  MAT_DMG_OUT : '',
  ETC_DMG : '',
  EMR_DESC : '',
  PRV_MEAS_ST : '',
  PRV_MEAS_ST_DT : '',
  PRV_MEAS_ST_DEPT : '',
  PRV_MEAS_LT : '',
  PRV_MEAS_LT_DT : '',
  PRV_MEAS_LT_DEPT : '',
  PRV_MEAS_TECH : '',
  PRV_MEAS_TECH_DT : '',
  PRV_MEAS_TECH_DEPT : '',
  PRV_MEAS_MGMT : '',
  PRV_MEAS_MGMT_DT : '',
  PRV_MEAS_MGMT_DEPT : '',
  EMR_DESC_EVAL : '',
  REMARKS : '',
  USER_ID : userStore.userId,
  SAVE_STAT : '',
  PSI_INV_TEAM_EMP_NO : '',
  PSI_INV_TEAM_1_EMP_NO : '',
  PSI_INV_TEAM_2_EMP_NO : '',
  PSI_INV_TEAM_3_EMP_NO : '',
  PSI_DEPT_CD : '',
  PRV_MEAS_ST_DEPT_CD : '',
  PRV_MEAS_LT_DEPT_CD : '',
  PRV_MEAS_TECH_DEPT_CD : '',
  PRV_MEAS_MGMT_DEPT_CD : '',
  PSI_TIME : '',
})



const initParams = (data) => {

  app.value=data.APP
  if(data.DIV=='C' && (!data.BSNS_CD || data.PROCESS_CD=='ZZ'))
  {
    bsnsCd.value=''  
  }
  else
  {
    bsnsCd.value = data.BSNS_CD  
  }
  if(data.DIV=='C' && (!data.DEPT_CD || data.PROCESS_CD=='ZZ'))
  {
    deptCd.value=''  
  }
  else
  {
    deptCd.value = data.DEPT_CD  
  }
  if(data.DIV=='C' && (!data.PROCESS_CD || data.PROCESS_CD=='ZZ'))
  {
    processCd.value=''  
  }
  else
  {
    processCd.value = data.PROCESS_CD  
  }

  if(data.DIV=="M")
  {
    Promise.all([
    getCodeList('HHIV010')
    ]).then(res=>{
      // console.log("res:",res)
      codeList.processCd=res[0].ORESULT_CUR;
      codeList.processCd.unshift({ TXT: 'PSM공정설비 외', COD: 'ZZ' })
    })

    if(data.PSI_SEQ)
    {
      psiSearch(data)
    }    
  }
  else
  {
    codeList.processCd.unshift({ TXT: '', COD: '' })
    psiDate.value = dayjs().format("YYYY-MM-DD")
    psiTime.value=dayjs().format("HH:mm")
    
  }
  
  // write.value = data.DIV=="C" || (data.DIV=="M" && data.WRITE=="Y") ? false : true
  write.value = (data.DIV=="M" && data.WRITE=="Y") ? false : true
  psiSeq.value = data.DIV=="C" ? 0 : data.PSI_SEQ
  sSelect.value= (data.DIV=="M" && data.WRITE=="Y") ? false : true;
  sDept.value=(data.DIV=="M" && data.WRITE=="Y") ? false : true;
  search.value=false
}



const psiSearch = (data) =>
{
  commonSearchApi({ queryId: 'SPPFL0010_SEARCH_02', 
                    param: {CMPNY_DIV:userStore.cmpnyDiv, BSNS_CD : data.BSNS_CD, DEPT_CD : data.DEPT_CD, PROCESS_CD : data.PROCESS_CD, PSI_SEQ : data.PSI_SEQ} })
  .then(res=>{
    let sData = res.ORESULT_CUR[0];
    if(res.ORESULT_CUR.length>0)
    {
      // console.log(sData);
      bsnsCd.value=data.BSNS_CD
      deptCd.value=data.DEPT_CD
      psiSeq.value = data.PSI_SEQ
      psiDate.value = sData.PSI_DATE
      psiTime.value = sData.PSI_TIME
      psiDept.value = sData.PSI_DEPT
      psiProcess.value = sData.PSI_PROCESS
      psiInvDt1.value = sData.PSI_INV_DT.split('~')[0]
      psiInvDt2.value = sData.PSI_INV_DT.split('~')[0]
      psiInvTeam.value = sData.PSI_INV_TEAM
      psiInvTeam1.value = sData.PSI_INV_TEAM_1
      psiInvTeam2.value = sData.PSI_INV_TEAM_2
      psiInvTeam3.value = sData.PSI_INV_TEAM_3
      psiInvTeamEmpNo.value = sData.PSI_INV_TEAM_EMP_NO
      psiType.value = sData.PSI_TYPE
      psiTypeInput.value = sData.PSI_TYPE_INPUT
      psiMat.value = sData.PSI_MAT
      psiDesc.value = sData.PSI_DESC
      psiCause.value = sData.PSI_CAUSE
      humDmgIn.value = sData.HUM_DMG_IN
      humDmgOut.value = sData.HUM_DMG_OUT
      matDmgIn.value = sData.MAT_DMG_IN
      matDmgOut.value = sData.MAT_DMG_OUT
      etcDmg.value = sData.ETC_DMG
      emrDesc.value = sData.EMR_DESC
      prvMeasSt.value = sData.PRV_MEAS_ST
      prvMeasStDt.value = sData.PRV_MEAS_ST_DT
      prvMeasStDept.value = sData.PRV_MEAS_ST_DEPT
      prvMeasLt.value = sData.PRV_MEAS_LT
      prvMeasLtDt.value = sData.PRV_MEAS_LT_DT
      prvMeasLtDept.value = sData.PRV_MEAS_LT_DEPT
      prvMeasTech.value = sData.PRV_MEAS_TECH
      prvMeasTechDt.value = sData.PRV_MEAS_TECH_DT
      prvMeasTechDept.value = sData.PRV_MEAS_TECH_DEPT
      prvMeasMgmt.value = sData.PRV_MEAS_MGMT
      prvMeasMgmtDt.value = sData.PRV_MEAS_MGMT_DT
      prvMeasMgmtDept.value = sData.PRV_MEAS_MGMT_DEPT
      emrDescEval.value = sData.EMR_DESC_EVAL
      saveStat.value = sData.SAVE_STAT
      remarks.value = sData.REMARKS
      psiDeptCd.value = sData.PSI_DEPT_CD
      prvMeasStDeptCd.value = sData.PRV_MEAS_ST_DEPT_CD
      prvMeasLtDeptCd.value = sData.PRV_MEAS_LT_DEPT_CD
      prvMeasTechDeptCd.value = sData.PRV_MEAS_TECH_DEPT_CD
      prvMeasMgmtDeptCd.value = sData.PRV_MEAS_MGMT_DEPT_CD


      commonSearchApi({ queryId: 'SPPFL0010_SEARCH_03', 
                    param: {CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD:bsnsCd.value, DEPT_CD: deptCd.value, PROCESS_CD: processCd.value, PSI_SEQ: psiSeq.value} })
                    .then(res=>{
                      grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);
                    })
    }
  })
}

// 팝업 초기세팅
const openPopup = async (data) => {
  
  // 변수 초기화 작업
  // console.log(data);
  initParams(data)

  // console.log(data);
  if(data.DIV=='C' || (data.DIV=='M' && data.WRITE=="Y"))
  {
    menuTitle.value.visibleBtn('btnUpdate', true);
    menuTitle.value.visibleBtn('btnTemporaryStorage', true);
  }
  else
  {
    menuTitle.value.visibleBtn('btnUpdate', false);
    menuTitle.value.visibleBtn('btnTemporaryStorage', false);
  }

  if(data.SAVE_STAT=='C')
  {
    menuTitle.value.visibleBtn('btnPrint', true);
    menuTitle.value.visibleBtn('btnTemporaryStorage', false);
  }
  else
  {
    menuTitle.value.visibleBtn('btnPrint', false);
  }

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
    saveStat.value='C'
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id=='btnTemporaryStorage')
  {
    saveStat.value='T'
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

  if(saveStat.value=='C')
  {
    if(!psiDate.value)
    {
      return Message.warn(t('사고 발생일시는 필수 입력입니다.'))
    }
    if(!psiDept.value)
    {
      return Message.warn(t('사고 발생부서는 필수 입력입니다.'))
    }
    if(!psiProcess.value)
    {
      return Message.warn(t('사고 공정설비는 필수 입력입니다.'))
    }
    if(!psiInvDt1.value || !psiInvDt2.value)
    {
      return Message.warn(t('사고 조사일자는 필수 입력입니다.'))
    }
    if(!psiInvTeam.value || !psiInvTeamEmpNo.value)
    {
      return Message.warn(t('사고 조사팀장은 필수 입력입니다.'))
    }
    let count=0;
    let Provide=grdMain1.value.getDataProvider()
    for (let i = 0; i<Provide.getRowCount(); i++)
    {
      if(Provide.getRowState(i) != 'deleted')
      {
        count++;
      }
    }
    
    if(count < 3)
    {
      return Message.warn(t('사고조사 팀원은 최소 3명입니다.'))
    }
    if(!psiType.value)
    {
      return Message.warn(t('사고형태는 필수 선택입니다.'))
    }
    else if(psiType.value=='E' && !psiTypeInput.value)
    {
      return Message.warn(t('기타선택이 내용은 필수 입력입니다.'))
    }
    if(!psiMat.value)
    {
      return Message.warn(t('사고물질은 필수 입력입니다.'))
    }
    if(!psiDesc.value)
    {
      return Message.warn(t('사고 개요는 필수 입력입니다.'))
    }
    if(!psiCause.value)
    {
      return Message.warn(t('발생 원인은 필수 입력입니다.'))
    }
    if(!humDmgIn.value)
    {
      return Message.warn(t('사내 인적피해는 필수 입력입니다.'))
    }
    if(!humDmgOut.value)
    {
      return Message.warn(t('사외 인적피해는 필수 입력입니다.'))
    }
    if(!matDmgIn.value)
    {
      return Message.warn(t('사내 물적피해는 필수 입력입니다.'))
    }
    if(!matDmgOut.value)
    {
      return Message.warn(t('사외 물적피해는 필수 입력입니다.'))
    }
    if(!etcDmg.value)
    {
      return Message.warn(t('기타영향은 필수 입력입니다.'))
    }
    if(!emrDesc.value)
    {
      return Message.warn(t('비상조치사항은 필수 입력입니다.'))
    }
    if(!prvMeasSt.value)
    {
      return Message.warn(t('단기적 대책 내용은 필수 입력입니다.'))
    }
    if(!prvMeasStDt.value)
    {
      return Message.warn(t('단기적 대책 일정은 필수 입력입니다.'))
    }
    if(!prvMeasStDept.value)
    {
      return Message.warn(t('단기적 대책 책임부서는 필수입력입니다.'))
    }
    if(!prvMeasLt.value)
    {
      return Message.warn(t('장기적 대책 내용은 필수 입력입니다.'))
    }
    if(!prvMeasLtDt.value)
    {
      return Message.warn(t('장기적 대책 일정은 필수 입력입니다.'))
    }
    if(!prvMeasLtDept.value)
    {
      return Message.warn(t('장기적 대책 책임부서는 필수 입력입니다.'))
    }
    if(!prvMeasTech.value)
    {
      return Message.warn(t('기술적 대책 내용은 필수 입력입니다.'))
    }
    if(!prvMeasTechDt.value)
    {
      return Message.warn(t('기술적 대책 일정은 필수 입력입니다.'))
    }
    if(!prvMeasTechDept.value)
    {
      return Message.warn(t('기술적 대책 책임부서는 필수 입력입니다.'))
    }
    if(!prvMeasMgmt.value)
    {
      return Message.warn(t('관리적 대책 내용은 필수 입력입니다.'))
    }
    if(!prvMeasMgmtDt.value)
    {
      return Message.warn(t('관리적 대책 일정은 필수 입력입니다.'))
    }
    if(!prvMeasMgmtDept.value)
    {
      return Message.warn(t('관리적 대책 책임부서는 필수 입력입니다.'))
    }
    if(!emrDescEval.value)
    {
      return Message.warn(t('비상조치 내용평가는 필수 입력입니다.'))
    }
  }
   
      // psiInvTeam1EmpNo.value = sData.PSI_INV_TEAM_1_EMP_NO
      // psiInvTeam2EmpNo.value = sData.PSI_INV_TEAM_2_EMP_NO
      // psiInvTeam3EmpNo.value = sData.PSI_INV_TEAM_3_EMP_NO
      // psiTypeInput.value = sData.PSI_TYPE_INPUT
  // console.log(processCd.value)
  saveParams.BSNS_CD = bsnsCd.value
  saveParams.DEPT_CD = deptCd.value
  saveParams.PROCESS_CD = processCd.value
  saveParams.PSI_SEQ = psiSeq.value
  saveParams.PSI_DATE = psiDate.value
  saveParams.PSI_DEPT = psiDept.value
  saveParams.PSI_PROCESS = psiProcess.value
  saveParams.PSI_INV_DT = psiInvDt1.value + '~' + psiInvDt2.value
  saveParams.PSI_INV_TEAM = psiInvTeam.value
  saveParams.PSI_INV_TEAM_1 = psiInvTeam1.value
  saveParams.PSI_INV_TEAM_2 = psiInvTeam2.value
  saveParams.PSI_INV_TEAM_3 = psiInvTeam3.value
  saveParams.PSI_TYPE = psiType.value
  saveParams.PSI_TYPE_INPUT = psiTypeInput.value
  saveParams.PSI_MAT = psiMat.value
  saveParams.PSI_DESC = psiDesc.value
  saveParams.PSI_CAUSE = psiCause.value
  saveParams.HUM_DMG_IN = humDmgIn.value
  saveParams.HUM_DMG_OUT = humDmgOut.value
  saveParams.MAT_DMG_IN = matDmgIn.value
  saveParams.MAT_DMG_OUT = matDmgOut.value
  saveParams.ETC_DMG = etcDmg.value
  saveParams.EMR_DESC = emrDesc.value
  saveParams.PRV_MEAS_ST = prvMeasSt.value
  saveParams.PRV_MEAS_ST_DT = prvMeasStDt.value
  saveParams.PRV_MEAS_ST_DEPT = prvMeasStDept.value
  saveParams.PRV_MEAS_LT = prvMeasLt.value
  saveParams.PRV_MEAS_LT_DT = prvMeasLtDt.value
  saveParams.PRV_MEAS_LT_DEPT = prvMeasLtDept.value
  saveParams.PRV_MEAS_TECH = prvMeasTech.value
  saveParams.PRV_MEAS_TECH_DT = prvMeasTechDt.value
  saveParams.PRV_MEAS_TECH_DEPT = prvMeasTechDept.value
  saveParams.PRV_MEAS_MGMT = prvMeasMgmt.value
  saveParams.PRV_MEAS_MGMT_DT = prvMeasMgmtDt.value
  saveParams.PRV_MEAS_MGMT_DEPT = prvMeasMgmtDept.value
  saveParams.EMR_DESC_EVAL = emrDescEval.value
  saveParams.REMARKS = remarks.value
  saveParams.SAVE_STAT = saveStat.value
  saveParams.PSI_INV_TEAM_EMP_NO = psiInvTeamEmpNo.value
  saveParams.PSI_INV_TEAM_1_EMP_NO = psiInvTeam1EmpNo.value
  saveParams.PSI_INV_TEAM_2_EMP_NO = psiInvTeam2EmpNo.value
  saveParams.PSI_INV_TEAM_3_EMP_NO = psiInvTeam3EmpNo.value
  saveParams.PSI_TIME = psiTime.value
  saveParams.PSI_DEPT_CD = psiDeptCd.value
  saveParams.PRV_MEAS_ST_DEPT_CD = prvMeasStDeptCd.value
  saveParams.PRV_MEAS_LT_DEPT_CD = prvMeasLtDeptCd.value
  saveParams.PRV_MEAS_TECH_DEPT_CD = prvMeasTechDeptCd.value
  saveParams.PRV_MEAS_MGMT_DEPT_CD = prvMeasMgmtDeptCd.value
  
  return true
}

const saveData = async () => {
  
  //console.log("saveParams:",saveParams);
  return commonExecuteApi({ queryId: 'SPPFL0010_SAVE_01', list: [saveParams] })

}

const afterSave = (res) => {
  
  let resdata
  resdata=res.list
  
    if(resdata.length>0)
    {
  
      if(!psiSeq.value)
      {
        psiSeq.value=resdata[0].OUT_SEQ;
      }
      const saveData=[];
      
      let rows=grdMain1.value.getDataProvider().getJsonRows();
      for(let i=0; i<rows.length;i++)
      {
        if(grdMain1.value.getDataProvider().getRowState(i) != 'deleted')
        {
          const row=rows[i];
          const saveObj={
            CMPNY_DIV:userStore.cmpnyDiv,
            BSNS_CD : bsnsCd.value,
            DEPT_CD : deptCd.value,
            PROCESS_CD : processCd.value,
            PSI_SEQ : psiSeq.value,
            PSI_INV_SEQ : i+1,
            PSI_INV_DEPT : row.DEPT_NM,
            PSI_INV_DEPT_CD : row.DEPT_CD,
            PSI_INV_EMP_NM : row.EMP_NM,
            PSI_INV_EMP_NO : row.EMP_NO,
            PSI_INV_JOB_TIT_NM : row.JOB_TIT_NM
          }
          saveData.push(saveObj)
        }
      }
      
      commonExecuteApi({ queryId: 'SPPFL0010_SAVE_03', list: saveData })

    }
    let data={
      BSNS_CD : bsnsCd.value,
      DEPT_CD : deptCd.value,
      PROCESS_CD : processCd.value,
      PSI_SEQ : psiSeq.value
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
  
  // if(grdMain1.value.getDataProvider().getRowCount() < 3)
  // {
  //   saveStat.value='T'
  //   new saveFlowHelper(vm, t)
  //     .setBefore(beforeSave)
  //     .setQuery(saveData)
  //     .run()
  // }

  clearPopup();
  dialog.value = false
  emit('closed',search.value)
}
const clearPopup =()=>
{
  psiSeq.value = '';//순번
  psiDate.value = '';//사고일자
  psiTime.value = '';//사고시간
  psiDept.value = '';//사고부서
  psiProcess.value='';//사고공정
  psiInvDt.value = '';//사고 조사일자
  psiInvDt1.value = '';//사고 조사일자
  psiInvDt2.value = '';//사고 조사일자
  psiInvTeam.value='';//사고 조사팀장
  psiInvTeam1.value='';//사고 조사 팀원1
  psiInvTeam2.value='';//사고 조사 팀원2
  psiInvTeam3.value='';//사고 조사 팀원3
  psiInvTeamEmpNo.value='';//사고 조사팀장
  psiInvTeam1EmpNo.value='';//사고 조사 팀원1
  psiInvTeam2EmpNo.value='';//사고 조사 팀원2
  psiInvTeam3EmpNo.value='';//사고 조사 팀원3
  psiType.value = '';//사고형태
  psiTypeInput.value = '';//사고형태 기타입력
  psiMat.value = '';//사고물질
  psiDesc.value = '';//사고개요
  psiCause.value = '';//사고 발생 원인
  humDmgIn.value = '';//사내 인적피해
  humDmgOut.value = '';//사외 진적피해
  matDmgIn.value = '';//사내 물적피해
  matDmgOut.value = '';//사외 물적피해
  etcDmg.value = '';//기타영향
  emrDesc.value = '';//비상조치사항
  prvMeasSt.value='';//단기적 재발방지 대책
  prvMeasStDt.value='';//단기적 재발방지 대책 일자
  prvMeasStDept.value='';//단기적 재발방지 대책 책임부서
  prvMeasLt.value='';//장기적 재발방지 대책
  prvMeasLtDt.value='';//장기적 재발방지 대책 일자
  prvMeasLtDept.value='';//장기적 재발방지 대책 책임부서
  prvMeasTech.value='';//기술적 재발방지 대책
  prvMeasTechDt.value='';//기술적 재발방지 대책 일자
  prvMeasTechDept.value='';//기술적 재발방지 대책 책임부서
  prvMeasMgmt.value='';//관리적 재발방지 대책
  prvMeasMgmtDt.value='';//관리적 재발방지 대책 일자
  prvMeasMgmtDept.value='';//관리적 재발방지 대책 책임부서
  emrDescEval.value ='';//비상 조치사항 평가
  saveStat.value='';//저장상태
  remarks.value = '';//비고		
  psiDeptCd.value = '';
  prvMeasStDeptCd.value = '';
  prvMeasLtDeptCd.value = '';
  prvMeasTechDeptCd.value = '';
  prvMeasMgmtDeptCd.value = '';	 
  processCd.value = '';  	 	
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
      fieldName: 'DEPT_NM', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('부서'),} ,
    },
    { 
      fieldName: 'EMP_NM', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('이름') },
    },
    { 
      fieldName: 'JOB_TIT_NM', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('직책') }, 
    },
    { 
      fieldName: 'EMP_NO', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('사번') }, 
    },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'PSI_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'PSI_INV_SEQ', dataType: 'text', visible: false, },
    
  ],
  columns : [],

})

grdMain1Props.columns = grdMain1Props.fields


const empopen=(val)=>{
  if(write.value==false)
  {
    inv.value=val;
    empPopup.value.openPopup({
      readonly: false,
      CMPNY_DIV_D: true,
      FLAG_D: true,
      DISABLE: ["전체", "사내협력사", "단기공사"]
    });
  }
}

const onEmpSelected =(val)=>{

  if(inv.value==0)
  {
    let rows = grdMain1.value.getDataProvider().getJsonRows();

    // 2. EMP_NO가 이미 존재하는지 체크
    let isDuplicated = rows.some(row => row.EMP_NO === val.EMP_NO.trim());
    if(isDuplicated)
    {
      return Message.warn(t('조사팀장과 조사팀원이 같을 수 없습니다.'))
    }
    else
    {
      psiInvTeam.value= `${val.DEPT_NM || ''} ${val.EMP_NM || ''} ${val.JOB_TIT_NM || ''}`.trim()
      psiInvTeamEmpNo.value=val.EMP_NO.trim();
    }
  }
  else 
  {

    let rows = grdMain1.value.getDataProvider().getJsonRows();

    // 2. EMP_NO가 이미 존재하는지 체크
    let isDuplicated = rows.some(row => row.EMP_NO === val.EMP_NO.trim());

    let isDuplicatedWithTeamLeader = (psiInvTeamEmpNo.value === val.EMP_NO.trim());
    
    // console.log(psiInvTeamEmpNo.value);
    if (isDuplicatedWithTeamLeader) {
      return Message.warn(t('이미 팀장으로 등록된 사번입니다.'));
    }
    
    if (isDuplicated) {
      return Message.warn(t('이미 등록된 사번입니다.'));
    }
    
    

    // 3. 중복 없으면 추가
    grdMain1.value.getDataProvider().addRow({
      DEPT_NM: val.DEPT_NM,
      EMP_NM: val.EMP_NM,
      JOB_TIT_NM: val.JOB_TIT_NM,
      EMP_NO: val.EMP_NO.trim()
    });

    // grdMain1.value.addRow({ DEPT_NM: val.DEPT_NM, EMP_NM: val.EMP_NM,  JOB_TIT_NM: val.JOB_TIT_NM, EMP_NO: val.EMP_NO});
  }
 
}
const removeEmp =()=>{
  let checkedIndexes = grdMain1.value.getGridView().getCheckedRows(true);

  if(checkedIndexes.length==0)
  {
    return Message.warn(t('선택된 인원이 없습니다.'));
  }

for (let idx of checkedIndexes) {
  let data = grdMain1.value.getDataProvider().getJsonRow(idx);
  grdMain1.value.getDataProvider().removeRow(idx);
  
  // let deleteParam = [
  //     {
  //       CMPNY_DIV: userStore.cmpnyDiv,
  //       BSNS_CD: data.BSNS_CD,
  //       DEPT_CD: data.DEPT_CD,
  //       PROCESS_CD : data.PROCESS_CD,
  //       PSI_SEQ: data.PSI_SEQ,
  //       PSI_INV_SEQ : data.PSI_INV_SEQ
  //     },
      
  //   ];
    
  //   commonExecuteApi({
  //     queryId: "SPPFL0010_DELETE_02",
  //     list: deleteParam,
  //   }).then(res=>{
  //     if(res.list[0].OUT_RES_COD=='0')
  //     {
  //     commonSearchApi({ queryId: 'SPPFL0010_SEARCH_03', 
  //                   param: {CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD:bsnsCd.value, DEPT_CD: deptCd.value, PROCESS_CD: processCd.value, PSI_SEQ: psiSeq.value} })
  //                   .then(res=>{
  //                     grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);
  //                   })
  //     }
  //   });
  }
}

const deptopen=(val)=>{

  dept.value=val;
  if(val == 0 || sDept.value == false)
  {
    deptPopup.value.openPopup({ORGN_DIV:'A',CMP_DISABLE:true,HSE_ONLY : 'Y'});
  }
}

const onDeptSelected =(val)=>{
// console.log(val);
if(dept.value==0)
{
  psiDept.value= val.ASGN_FULL_NM
  psiDeptCd.value=val.DEPT_CD
  if(bsnsCd.value && bsnsCd.value != val.BSNS_CD)
  {
    bsnsCd.value=val.BSNS_CD
    processCd.value='ZZ'
  }
  else
  {
    bsnsCd.value=val.BSNS_CD
  }
  if(deptCd.value && deptCd.value != val.DEPT_CD)
  {
    deptCd.value=val.DEPT_CD
    processCd.value='ZZ'
  }
  else
  {
    deptCd.value=val.DEPT_CD
  }

  sSelect.value=false;

  Promise.all([
    commonSearchApi({ queryId: 'SPPFL0010_COMBO_01', param: {CMPNY_DIV:userStore.cmpnyDiv, BSNS_CD: bsnsCd.value, DEPT_CD: deptCd.value} }),
  ]).then(res=>{
    // console.log("res:",res)
    codeList.processCd=res[0].ORESULT_CUR;
    codeList.processCd.unshift({ TXT: 'PSM공정 외 설비', COD: 'ZZ' })
    processCd.value=codeList.processCd[0].CODE
    checked();
  })
  // bsnsCd.value = saveParams.BSNS_CD=='' ? val.BSNS_CD : saveParams.BSNS_CD
  // deptCd.value = saveParams.DEPT_CD=='' ? val.DEPT_CD : saveParams.DEPT_CD

}
else if(dept.value==1)
{
  prvMeasStDept.value= val.ASGN_SHRT_NM
  prvMeasStDeptCd.value=val.DEPT_CD
}
else if(dept.value==2)
{
  prvMeasLtDept.value= val.ASGN_SHRT_NM
  prvMeasLtDeptCd.value=val.DEPT_CD
}
else if(dept.value==3)
{
  prvMeasTechDept.value= val.ASGN_SHRT_NM
  prvMeasTechDeptCd.value=val.DEPT_CD
}
else if(dept.value==4)
{
  prvMeasMgmtDept.value= val.ASGN_SHRT_NM
  prvMeasMgmtDeptCd.value=val.DEPT_CD
}
}

const appTable= `
<table style="border-collapse: collapse; padding : 2px; margin-bottom: 15px; float: right;">
    <tr>
      <td style="text-align: center; border: 2px solid gray; width: 120px;">부서장</td>
      <td style="text-align: center; border: 2px solid gray; width: 120px">담당임원</td>
      <td style="text-align: center; border: 2px solid gray; width: 120px">부문장</td>
    </tr>
    <tr>
      <td style="border: 2px solid gray; height: 30px"></td>
      <td style="border: 2px solid gray; height: 30px"></td>
      <td style="border: 2px solid gray; height: 30px"></td>
    </tr>
    <tr>
      <td style="height: 80px; border: 2px solid gray;"></td>
      <td style="height: 80px; border: 2px solid gray;"></td>
      <td style="height: 80px; border: 2px solid gray;"></td>
    </tr>
    <tr>
      <td class="appdate" style="text-align: right; border: 2px solid gray;"><span style="margin-right: 30px;">月</span><span>日</span></td>
      <td class="appdate" style="text-align: right; border: 2px solid gray;"><span style="margin-right: 30px;">月</span><span>日</span></td>
      <td class="appdate" style="text-align: right; border: 2px solid gray;"><span style="margin-right: 30px;">月</span><span>日</span></td>
    </tr>
  </table>`

const reportPrint = () =>{

  if(saveStat.value=='C')
  {
    const tableClone = content.value.cloneNode(true)
    commonTable(tableClone)

    let htmlContent = [
      {code: appTable+tableClone.outerHTML, name: '공정사고조사 보고서'}, 
    ]

    // let htmlContent = [
    //   {code: tableClone.outerHTML, name: '공정사고조사 보고서'}, 
    // ]
    commonRequest2('hse/excel/SPPFL0010_PRINT01', {
      data: {
        htmlCode: htmlContent
      }
    }).then(async (res) => {
      // 헤더에서 파일명 추출
      const contentDisposition = res.contentDisposition;
      let fileName = `공정사고조사 보고서_`+ psiDept.value +`(` + psiDate.value.replaceAll(/-/g,'') + `).xlsx`  // 기본 파일명
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = decodeURIComponent(fileNameMatch[1])
        }
      }
      // 파일 다운로드
      const blob = new Blob([res], { type: res.type })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(link.href)
      // console.log(link)
      // console.log(blob)
      document.body.removeChild(link)
    })
  }
}

const commonTable = (table) => {
  
  const inputs = table.querySelectorAll('input');
  inputs.forEach((input) => {
    if(input.type=='date' || input.type=='time')
    {
      return;
    }
    input.setAttribute('value', input.value); // 최신 입력값을 value 속성에 설정
  });

  // readonly 처리된 input
  const vuetifyTextFields = table.querySelectorAll('.v-text-field');
  vuetifyTextFields.forEach((fieldWrapper) => {
    const inputElement = fieldWrapper.querySelector('input');
    if (inputElement && inputElement.value) {
      const value = inputElement.value.trim();
      const parentTd = fieldWrapper.closest('td');
      if (parentTd) {
        parentTd.innerHTML = value;
      }
    }
  });

  const vuetifyTextAreas = table.querySelectorAll('.v-textarea');
  vuetifyTextAreas.forEach((fieldWrapper) => {
  const textareaElement = fieldWrapper.querySelector('textarea');
  if (textareaElement && textareaElement.value) {
    const value = textareaElement.value.trim();
    const parentTd = fieldWrapper.closest('td');
    if (parentTd) {
      // 줄바꿈을 <br> 태그로 변환하여 출력
      parentTd.innerHTML = value.replace(/\n/g, '<br/>');
    }
  }
});

const allDayDiv = table.querySelector('div#allDay');
if (allDayDiv) {
  // allDay 상태(Vuetify 등에서 v-model=allDay로 관리되는 변수)
  const allDays = allDay.value
  const date1 = displayDate1.value; // 예: "2025년 05월 20일 (화요일)"
  const date2 = displayDate2.value; // 예: "2025년 05월 21일 (수요일)"

  let html = '';
  if (allDays) {
    html = `<input type="text" value="${date1}(종일)">`;
  } else {
    html = `<input type="text" value="${date1}"> ~ <input type="text" value="${date2}">`;
  }
  allDayDiv.innerHTML = html;
}

const tds = table.querySelectorAll('td');
tds.forEach((td) => {
  const checkboxes = td.querySelectorAll('.v-checkbox');
  if (checkboxes.length > 0) {
    let html = '';
    checkboxes.forEach((checkbox, idx) => {
      const input = checkbox.querySelector('input[type="checkbox"]');
      let label = '';
      const labelElem = checkbox.querySelector('.v-label');
      if (labelElem) {
        label = labelElem.textContent.trim();
      } else {
        label = checkbox.textContent.trim();
      }
      const isChecked = input && input.checked;
      html += `${isChecked ? '■' : '□'} ${label}`;
      if (idx < checkboxes.length - 1) html += ' ';
    });

    // td 내에 v-checkbox 외에 input[type="text"]가 있을 때, value 추가
    const extraInput = td.querySelector('input[type="text"]');
    if (extraInput) {
      html += ` : ${extraInput.value}`;
    }

    td.innerHTML = html;
  }
});

const rg=table.querySelector('#team-member')
if(rg)
{
  const teamList = grdMain1.value.getDataProvider().getJsonRows(); // 또는 저장된 teamList 배열
  
  // 조사팀원 HTML 생성
  let html = '<span>조사팀원:</span><br>';
  html += teamList.map(row =>
  `<input type="text" value="${row.DEPT_NM} ${row.EMP_NM} ${row.JOB_TIT_NM}"> <span>(인)</span><br>`
  ).join('');
  rg.innerHTML = html;
}

}



// 사용자에게 보여질 포맷
const displayDate = computed(() =>
  psiDate.value ? dayjs(psiDate.value).format('YYYY년 MM월 DD일 (dddd)') : ''
)

function handleDateChange() {
  showDatePicker.value = false
}

function openDatePicker() {
  if(app.value == 'N')
  {
    showDatePicker.value = true
    nextTick(() => {
    // showDatePicker가 true가 된 뒤, 실제로 input이 렌더된 다음
      if (dateInput.value) dateInput.value.focus()
    })
  }
}

const displayTime = computed(() =>
psiTime.value
)

function handleTimeChange() {
  showTimePicker.value = false
}

function openTimePicker() {
  if(app.value == 'N')
  {
    showTimePicker.value = true
    nextTick(() => {
      // showDatePicker가 true가 된 뒤, 실제로 input이 렌더된 다음
      if (timeInput.value) timeInput.value.focus()
    })
  }
}

const checked = () =>
{
  write.value=false;
  sDept.value=false;

}

// 사용자에게 보여질 포맷
const displayDate1 = computed(() =>
  psiInvDt1.value ? dayjs(psiInvDt1.value).format('YYYY년 MM월 DD일 (dddd)') : ''
)

function handleDatePerChange1() {
  
  showDatePerPicker1.value = false
}

function openDatePerPicker1() {
  if(app.value == 'N')
  {
    showDatePerPicker1.value = true
    nextTick(() => {
    // showDatePicker가 true가 된 뒤, 실제로 input이 렌더된 다음
      if (datePerInput1.value) datePerInput1.value.focus()
    })
  }
}

// 사용자에게 보여질 포맷
const displayDate2 = computed(() =>
  psiInvDt2.value ? dayjs(psiInvDt2.value).format('YYYY년 MM월 DD일 (dddd)') : ''
)

function handleDatePerChange2() {
  
  showDatePerPicker2.value = false
}

function openDatePerPicker2() {
  if(app.value == 'N')
  {
    showDatePerPicker2.value = true
    nextTick(() => {
    // showDatePicker가 true가 된 뒤, 실제로 input이 렌더된 다음
      if (datePerInput2.value) datePerInput2.value.focus()
    })
  }
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
    <div class="title-bar">공정사고조사보고서 작성</div>
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
                <h1>공정사고조사 보고서</h1>
              </td>
            </tr>
            <tr style="height:40px;">
              <th class="table_header">1. 사고 발생일시</th>
              <td class="data-cell" colspan="5" >
                <div class="date-time-wrapper">
                  <div class="date-box">
                    <!-- 사용자가 보는 날짜 입력창 -->
                    <input
                      v-if="!showDatePicker"
                      type="text"
                      :value="displayDate"
                      @click="openDatePicker"
                      readonly
                    />
                    <!-- 숨겨진 date picker -->
                    <input
                      ref="dateInput"
                      v-if="showDatePicker"
                      type="date"
                      v-model="psiDate"
                      @change="handleDateChange"
                      @blur="showDatePicker = false"
                    />
                  </div> 
                  <span class="date-sep">,</span>
                  <div class="time-box">
                    <!-- 사용자가 보는 시간 입력창 -->
                    <input                      
                      v-if="!showTimePicker"
                      type="text"
                      :value="displayTime"
                      @click="openTimePicker"
                      readonly
                    />
                    <!-- 숨겨진 time picker -->
                    <input
                      ref="timeInput"
                      v-if="showTimePicker"
                      type="time"
                      v-model="psiTime"
                      @change="handleTimeChange"
                      @blur="showTimePicker = false"
                    />
                  </div> 
                  <span class="time-label">경</span>
                </div>
              </td>
            </tr>
            <tr>
              <th class="table_header">2. 사고 발생부서</th>
              <td class="data-cell" colspan="5">
                <!-- <input style="width:50%; padding-left:5px;" type="text" v-model="psiDept" readonly/><v-icon @click="deptopen(0)" style="cursor: pointer;">mdi-magnify</v-icon>  -->
                <div class="date-time-wrapper">
                <v-text-field 
                  class="dept-input"
                  type="text" 
                  v-model="psiDept" 
                  readonly 
                  append-icon="mdi-magnify"
                  @click:append="deptopen(0)"
                  hide-details></v-text-field>
                </div>
              </td>
            </tr>
            <tr>
              <th class="table_header">3. 사고 발생공정/설비</th>
              <!-- <td style="border: 2px solid gray; display:flex; align-items: center;" colspan="5">
                <i-select
                  label-width="50px"
                  width="250px"
                  v-model="processCd"
                  :items="codeList.processCd"
                  item-title="TXT"
                  item-value="COD"
                  style="display:inline-block"
                />
                <input class="content1" type="text" v-model="psiProcess" :readonly="write"/></td> -->
                <td class="data-cell" colspan="5">
                  <div class="date-time-wrapper">
                    <i-select
                      label-width="65px"
                      width="250px"
                      height="35"
                      v-model="processCd"
                      :items="codeList.processCd"
                      :label="$t('공정설비: ')"
                      item-title="TXT"
                      item-value="COD"
                      :readonly="sSelect"
                      @update:modelValue="checked"
                    /><span class="time-label">, 상세공정 : </span>
                    <div class="data-box-sub">
                      <input
                       type="text"
                       v-model="psiProcess"
                       :readonly="write"
                     />
                    </div>
                  </div>
                </td>
            </tr>
            <tr>
              <th class="table_header">4. 사고 조사기간</th>
                <td class="data-cell" colspan="5">
                  <div class="date-time-wrapper" id="allDay">
                  <div class="date-box" >
                    <VCheckbox
                      v-if="saveStat=='C'"
                      v-model="allDay"
                      label="종일"> 
                    </VCheckbox>
                    <!-- 사용자가 보는 날짜 입력창 -->
                    <input
                      v-if="!showDatePerPicker1"
                      type="text"
                      :value="displayDate1"
                      @click="openDatePerPicker1"
                      readonly
                    />
                    <!-- 숨겨진 date picker -->
                    <input
                      ref="datePerInput1"
                      v-if="showDatePerPicker1"
                      type="date"
                      v-model="psiInvDt1"
                      @change="handleDatePerChange1"
                      @blur="showDatePerPicker1 = false"
                    />
                  </div> 
                  <span>~</span>
                  <div class="date-box">
                    <!-- 사용자가 보는 날짜 입력창 -->
                    <input
                      v-if="!showDatePerPicker2"
                      type="text"
                      :value="displayDate2"
                      @click="openDatePerPicker2"
                      readonly
                    />
                    <!-- 숨겨진 date picker -->
                    <input
                      ref="datePerInput2"
                      v-if="showDatePerPicker2"
                      type="date"
                      v-model="psiInvDt2"
                      @change="handleDatePerChange2"
                      @blur="showDatePerPicker2 = false"
                    />
                    </div> 
                  </div>
                </td>
            </tr>
            <tr>
              <th class="table_header" rowspan="2">5. 사고 조사팀<br>(소속/성명)</th>
              <td class="data-cell" colspan="5">
                <div class="data-box-Team">
                  <div class="data-box-sub">
                    <span class="time-label">조사팀장: </span>
                  <input type="text" v-model="psiInvTeam" readonly/> 
                  <v-icon @click="empopen(0)" style="cursor: pointer;">mdi-magnify</v-icon> (인)
                </div>
                </div>
              </td>
            </tr>
            <tr>
              <td class="data-cell" colspan="5">
                <div class="data-box-Team" id="team-member"> 
                  <div style="display: flex;  align-items: center;  gap: 3px;">
                  <p class="time-label">조사팀원: </p><br>
                  <v-btn v-if="!write" @click="empopen()" size="small" variant="outlined" style="min-width:60px; margin:2px">추가</v-btn>
                  <v-btn v-if="!write" @click="removeEmp()" size="small" variant="outlined" style="min-width:60px; margin:2px">제거</v-btn></div>   
                     <RealGrid
                      style="height:220px; width:100%;"
                      ref="grdMain1"
                      :grid-view-option="grdMain1Props.gridViewOption"
                      :keys="grdMain1Props.keys" 
                      :fields="grdMain1Props.fields"
                      :columns="grdMain1Props.columns"/>
                </div>
              </td>
            </tr>
            <tr>
              <th class="table_header" rowspan="2">6. 사고 형태</th>
              <td class="data-cell" colspan="5">
                <div class="checkbox-group" data-code-list="cPsiType">
                  <v-checkbox
                    v-for="(item, idx) in cPsiType"
                    :key="idx"
                    v-model="psiType"
                    :label="item.TXT"
                    :value="item.COD"
                    :true-value="item.COD"
                    :false-value="null"
                    hide-details
                    density="compact"
                    :disabled="write"
                    />
                  <div class="data-box-sub">
                    <span>: </span>
                    <input v-if="psiType=='E'" type="text" v-model="psiTypeInput" :readonly="write"/>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td class="data-cell" colspan="5">
                <div class="data-box-sub">
                  <span>사고물질: </span><input type="text" v-model="psiMat" :readonly="write"/>
                </div>
              </td>
            </tr>
            <tr>
              <th class="table_header">7. 사고 개요</th>
              <td class="data-cell" colspan="5">
                <v-textarea
                  class="v-textarea-box"
                  type="text"
                  v-model="psiDesc" :readonly="write"/>
              </td>
            </tr>
            <tr>
              <th class="table_header">8. 발생 원인</th>
              <td class="data-cell" colspan="5">
                <v-textarea
                  class="v-textarea-box"
                  type="text"
                  v-model="psiCause" :readonly="write"/>
              </td>
            </tr>
            <tr>
              <th class="table_header" rowspan="3">9. 사고 피해정도</th>
                <td class="in_title">인적피해</td>
                <td class="data-cell" colspan="4">
                  
                    <div class="data-box-sub-2">
                    <span class="time-label">사내 : </span>
                    
                    <input type="text" v-model="humDmgIn" :readonly="write">
                    <span class="time-label">사외: </span>
                    
                    <input type="text" v-model="humDmgOut" :readonly="write">
                    </div>
                  
                </td>
            </tr>
            <tr>
              <td class="in_title">물적피해</td>
              <td class="data-cell" colspan="4">
                
                    <div class="data-box-sub-2">
                      <span class="time-label">사내 : </span>
                      <input type="text" v-model="matDmgIn" :readonly="write">
                      <span class="time-label">사외: </span>
                      <input type="text" v-model="matDmgOut" :readonly="write">
                    </div>
                
              </td>
            </tr>
            <tr>
              <td class="in_title">기타영향</td>
              <td class="data-cell" colspan="4">
                <div class="date-box-full">
                  <input type="text" v-model="etcDmg" :readonly="write">
                </div>
              </td>
            </tr>
            <tr>
              <th class="table_header">10. 비상조치사항</th>
              <td class="data-cell" colspan="5">
                <v-textarea
                  class="v-textarea-box"
                  type="text"
                  v-model="emrDesc" :readonly="write"/>
              </td>
            </tr>
            <tr>
              <th class="table_header" width="17%" rowspan="5">11. 재발방지대책</th>
              <td class="in_title" width="20%">대책</td>
              <td class="in_title" width="38%">내용</td>
              <td class="in_title" width="10%">일정</td>
              <td class="in_title" width="15%" colspan="2">책임부서</td>
            </tr>
            <tr>
              <td class="in_title">1)단기적 대책</td>
              <td class="data-cell">
                <v-textarea
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasSt"
                  auto-grow
                  :readonly="write"/></td>
              <td class="data-cell">
                <v-text-field
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasStDt"
                  variant="solo"
                  :readonly="write"/></td>
              <td class="data-cell" colspan="2">
                <v-text-field
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasStDept"
                  variant="solo"
                  readonly
                  append-icon="mdi-magnify"
                  @click:append="deptopen(1)"/>
                </td>
            </tr>
            <tr>
              <td class="in_title">2)장기적 대책</td>
              <td class="data-cell">
                <v-textarea
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasLt"
                  auto-grow
                  :readonly="write"/></td>
              <td class="data-cell">
                <v-text-field
                class="v-textarea-box"
                  type="text"
                  v-model="prvMeasLtDt"
                  variant="solo"
                  :readonly="write"/></td>
              <td class="data-cell" colspan="2">
                <v-text-field
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasLtDept"
                  variant="solo"
                  readonly
                  append-icon="mdi-magnify"
                  @click:append="deptopen(2)"/>                  
                </td>
            </tr>
            <tr>
              <td class="in_title">3)기술적 대책</td>
              <td class="data-cell">
                <v-textarea
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasTech"
                  auto-grow
                  :readonly="write"/></td>
              <td class="data-cell">
                <v-text-field
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasTechDt"
                  variant="solo"
                  :readonly="write"/></td>
              <td class="data-cell" colspan="2">
                <v-text-field
                  class="v-textarea-box"
                  v-model="prvMeasTechDept"
                  variant="solo"
                  readonly
                  append-icon="mdi-magnify"
                  @click:append="deptopen(3)"/></td>
            </tr>
            <tr>
              <td class="in_title">4)관리적 대책</td>
              <td class="data-cell">
                <v-textarea
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasMgmt"
                  auto-grow
                  :readonly="write"/></td>
              <td class="data-cell">
                <v-text-field
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasMgmtDt"
                  variant="solo"
                  :readonly="write"/></td>
              <td class="data-cell" colspan="2">
                <v-text-field
                  class="v-textarea-box"
                  type="text"
                  v-model="prvMeasMgmtDept"
                  variant="solo"
                  readonly
                  append-icon="mdi-magnify"
                  @click:append="deptopen(4)"/></td>
            </tr>
            <tr>
              <th class="table_header">12. 비상조치 내용평가</th>
              <td class="data-cell" colspan="5">
                <v-textarea
                  class="v-textarea-box"
                  type="text"
                  v-model="emrDescEval"
                  variant="solo"
                  :readonly="write"/>
              </td>
            </tr>
            <tr>
              <th class="table_header">13. 비고</th>
              <td class="data-cell" colspan="5">
                <v-text-field
                  class="v-textarea-box"
                  type="text"
                  v-model="remarks"
                  variant="solo"
                  :readonly="write"/>
              </td>
            </tr>
          </table>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
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

.checkbox-group {
  display: flex;
  justify-content: left;
  align-items: left;
  gap: 12px;
  height: 35px;
  padding-left: 5px;
}

.table_header{
  text-align: left;
  align-items: start;
  border: 2px solid gray;
  background-color: whitesmoke;
  padding-left: 5px;
}

.in_title{
  text-align: center; 
  border: 2px solid gray; 
  height: 35px;
  background-color: whitesmoke;
}

.data-cell {
  height: 40px;
  border: 2px solid gray;
  vertical-align: middle;
  padding: 0;
}

.date-time-wrapper {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 40px;
}

.date-box,
.time-box {
  display: flex;
  align-items: center;
}

.date-box input
{
  width: 200px;
  height: 35px;
  font-size: 1rem;
  padding: 5px 8px;
  box-sizing: border-box;
  border: 1px solid #bbb;
  border-radius: 4px;
}

.date-box input[readonly]
{
  background-color: white !important;
}

.date-box-full
{
  display: flex;
  align-items: center;
}

.date-box-full input
{
  width: 100%;
  height: 35px;
  font-size: 1rem;
  padding: 5px 8px;
  box-sizing: border-box;
  border: 1px solid #bbb;
  border-radius: 4px;
}
.time-box input {
  width: 130px;
  height: 35px;
  font-size: 1rem;
  padding: 0 8px;
  box-sizing: border-box;
  border: 1px solid #bbb;
  border-radius: 4px;
}

.time-box input[readonly]
{
  background-color: white !important;
}

.date-sep {
  margin: 0 4px;
  font-weight: bold;
  font-size: 1.2em;
  color: #333;
}

.time-label {
  margin-left: 8px;
  font-size: 1em;
  color: #444;
}
.dept-input {

  font-size: 1rem;
}
.dept-input.v-text-field,
.dept-input .v-field
{
  width: 300px !important;
  max-width: 400px !important;
  min-width: 100px;
}

.data-box-Team
{
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 3px;
}

.data-box-sub
{
  display: flex;
  align-items: center;
  padding : 1px 3px;
}

.data-box-sub input
{
  width: 300px;
  height: 35px;
  font-size: 1rem;
  padding: 0 8px;
  box-sizing: border-box;
  border: 1px solid #bbb;
  border-radius: 4px;
}

.data-box-sub-2
{
  display: flex;
  align-items: center;
}
.data-box-sub-2 input
{
  width: 250px;
  height: 35px;
  font-size: 1rem;
  margin : 0 5px;
  padding: 0 5px;
  box-sizing: border-box;
  border: 1px solid #bbb;
  border-radius: 4px;
}

.v-textarea-box
{
  font-size: 1rem;
  // padding: 5px 8px;
  margin : 2px 5px;
  box-sizing: border-box;
  border: 1px solid #bbb !important;
  border-radius: 4px !important;
  
}
</style>
