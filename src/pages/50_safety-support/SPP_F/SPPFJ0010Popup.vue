<script setup>
import { ref, reactive, getCurrentInstance, onMounted, computed } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonRequest3,
  commonSendApi
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IButtonList from '@/components/IButtonList.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { isEmpty } from '@/@core/utils'
import dayjs from 'dayjs'
import _ from 'lodash'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from "@/components/popup/EmpPopup.vue"
import SPPFJ0010Popup02 from './SPPFJ0010Popup02.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import SPPFJ0010Popup06 from './SPPFJ0010Popup06.vue'
import SPPFJ0010Popup07 from './SPPFJ0010Popup07.vue'
import SPPFJ0010Popup08 from './SPPFJ0010Popup08.vue'
import SPPFJ0010Popup09 from './SPPFJ0010Popup09.vue'
import SPPFJ0010Popup10 from './SPPFJ0010Popup10.vue'

let dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const emit = defineEmits(['upData'])
const menuTitle = ref(null)

const expansions = ref([[0], [], []]);
const selectedTab = ref(0)
const tabs = reactive([
  'STEP1. 변경요소제안서',
  'STEP2. 변경관리위원회 검토서',
  'STEP3. 변경시행/완료확인서'
]);
const tabEnabled = ref([true, false, false]);

const deptPopup = ref(null)
const deptIndex = ref(null)

const empPopup = ref(null)
const empSeq = ref(0)
const empIndex = ref(null)

const sppfj0010Popup02 = ref(null)

const iUploadPopup = ref(null)

const sppfj0010Popup06 = ref(null)
const sppfj0010Popup07 = ref(null)
const sppfj0010Popup08 = ref(null)
const sppfj0010Popup09 = ref(null)
const sppfj0010Popup10 = ref(null)

const iUploadPopup5 = ref(null)
const iUploadPopup7 = ref(null)
const iUploadPopup8 = ref(null)
const iUploadPopup9 = ref(null)

const fileTitle5 = ref('')
const fileTitle7 = ref('')
const fileTitle8 = ref('')
const fileTitle9 = ref('')

const tab1Read=ref(false);
const tab2Read=ref(false);
const tab3Read=ref(false);

// 탭별로 메뉴버튼 다르게 함
const buttonList = computed(() => {
  if (selectedTab.value === 0) {
    console.log(tab1Params.DRAFT_YN);
    if(tab1Params.DRAFT_YN === 'Y')
    {
      return ["btnClose"];
    }
    else
    {
      return ["btnTemporaryStorage", "btnSaveDraft", "btnClose"];
    }
    
  } else if (selectedTab.value === 1) {
    if(tab2ConfirmParams.CONFIRM_YN == 'Y')
    {
      return ["btnClose"];
    }
    else
    {
      return ["btnTemporaryStorage", "btnSaveReview", "btnReqApprove", "btnClose"];
    }
    
  } else {
    if(tab3Params.CHK_DT)
    {
      return ["btnClose"];
    }
    else
    {
      return ["btnTemporaryStorage", "btnReqApprove", "btnClose"];
    }
    
  }
});

// 탭 완료 후 다음 탭 활성화
const completeTab1 = () => {
  tabEnabled.value[1] = true;
};

const completeTab2 = () => {
  tabEnabled.value[2] = true;
};

const searchParams = reactive({
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS: '',
  CHG_NO: ''
})

const REVIEW_ITEM = [
  {key: 'A' , text: '인허가 관련 여부'},
  {key: 'B' , text: '공정안전자료'},
  {key: 'C' , text: '폭발위험장소선정'},
  {key: 'D' , text: '공정위험성평가'},
  {key: 'E' , text: '작업위험성평가'},
  {key: 'F' , text: '안전운전절차서'},
  {key: 'G' , text: '설비유지관리'},
  {key: 'H' , text: '안전작업계획\n안전작업허가'},
  {key: 'I' , text: '가동전 점검'},
  {key: 'J' , text: '근로자 교육'},
  {key: 'K' , text: 'PSM 규정 개정'},
]

// 탭1 변경요소제안서 파라미터 ------------------------------------------------------------------
const initTab1 = reactive({
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS: '',
  CHG_NO: '',
  PRO_DT: '',
  PRO_EMP_NO: '',
  PRO_EMP_NM: '',
  PRO_DEPT_CD: '',
  PRO_DEPT_NM: '',
  PRO_CPT_NO: '',
  PRO_CPT_NM: '',
  CHG_DIV: '',
  CHG_REASON: '',
  CHG_GRADE: '',
  CHG_TARGET: '',
  CHG_ATC: '',
  CHG_ITEM: '',
  CHG_DESC:
    '1. 변경 목적: \n2. 변경 내용 \n   1) 가솔린 탱크(2㎥) 1기를 기존 탱크 주변에 추가 설치\n   2) 관련 배관 및 펌프 2기를 추가 설치함.\n   3) \n   4) \n3. 변경 일정(공사 또는 작업 일정) \n   1) 년 월 ~ 월(약 XX개월 예상) \n \n4. 변경작업(공사) R&R',
  CHG1: 'N',
  CHG2: 'N',
  CHG3: 'N',
  CHG4: 'N',
  CHG5: 'N',
  CHG6: 'N',
  CHG7: 'N',
  CHG8: 'N',
  CHG9: 'N',
  ECHG_ALLOW_DT: '',
  ECHG_DT: '',	
  ECHG_TIME: '',
  MNG_PLAN: '',   
  EQUIP_DEPT_CD: '',
  EQUIP_DEPT_NM: '',
  EQUIP_CPT_NO: '', 
  EQUIP_CPT_NM: '', 
  EQUIP_DT: '',
  EQUIP_CMT: '',
  SAFE_DEPT_CD: '',
  SAFE_DEPT_NM: '',
  SAFE_CPT_NO: '',
  SAFE_CPT_NM: '',
  SAFE_DT: '',
  SAFE_CMT: '',
  DRAFT_YN: 'N',
  SAVE_YN: 'N'
})
const tab1Params = reactive({...initTab1})


// 탭2 검토서 파라미터 ------------------------------------------------------------------
const initTab2 = ref(REVIEW_ITEM.map(item => ({
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS: '',
  CHG_NO: '',
  CHG_NM: '',
  KEY: item.key,
  text: item.text,
  REVIEW_YN: 'N',
  REVIEW_EMP: [
    { EMP_NO: '', EMP_NM: '', REVIEW_DESC: '', REVIEW_RESULT: '', REVIEW_DT: '', FILE_ID: '', SAVE_YN: 'N' }
  ],
  SAVE_YN: 'N'
})))
const tab2Params = ref(_.cloneDeep(initTab2.value));

const initTab2Confirm = reactive({
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS: '',
  CHG_NO: '',
  CONFIRM_YN: 'N',
  CONFIRM_DESC: '',
  CONFIRM_DT: '',
  CONFIRM_EMP_NO: '',
  CONFIRM_EMP_NM: '',
  EMAIL: '',
  SAVE_YN: 'N'
})
const tab2ConfirmParams = reactive({ ...initTab2Confirm })

// 탭3 확인서 파라미터 ------------------------------------------------------------------
const initTab3 = reactive({
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS: '',
  CHG_NO: '',
  EFFECT_EMP_NO: '', 
  EFFECT_EMP_NM: '', 
  EFFECT_MNG_NO: '', 
  EFFECT_MNG_NM: '', 
  EMP_DEPT_CD: '', 
  EMP_DEPT_NM: '', 
  MNG_DEPT_CD: '', 
  MNG_DEPT_NM: '', 
  EFFECT_DT: '', 
  COMPLETE_DT: '', 
  CHK1: 'N',
  CHK2: 'N',
  CHK3: 'N',
  CHK4: 'N',
  CHK5: 'N',
  CHK6: 'N',
  CHK7: 'N',
  CHK8: 'N',
  CHK9: 'N',
  CHK10: 'N',
  ADD_CHK_DESC: '', 
  FINAL_OPN: '',
  CONFIRM_EMP_NO: '', 
  CONFIRM_EMP_NM: '', 
  CHK_DT: '',
  CONFIRM_FILE_ID: '',
  CHGEDU_FILE_ID: '',
  ACCIDENT_FILE_ID: '',
  CHGCHK_FILE_ID: '',
  CONFIRM_CNT: 0,
  CHGEDU_CNT: 0,
  ACCIDENT_CNT: 0,
  CHGCHK_CNT: 0,
  SAVE_YN: 'N'
})
const tab3Params = reactive({ ...initTab3 })



const codeList = reactive({
  // 제안서
  CHG_DIV: [
    {COD: 'A', TXT: '정상변경'},
    {COD: 'B', TXT: '비상변경'}
  ],
  CHG_REASON: [
    {COD: 'A', TXT: '안전성 향상 / 위험성 감소'},
    {COD: 'B', TXT: '운전/작업생산성/신뢰성 향상'},
    {COD: 'C', TXT: '환경측면 개선'},
    {COD: 'D', TXT: '기타'}
  ],
  CHG_GRADE: [
    {COD: 'A', TXT: '등급 1'},
    {COD: 'B', TXT: '등급 2'},
    {COD: 'C', TXT: '등급 3'}
  ],
  CHG_TARGET: [
    {COD: 'A', TXT: '공정/설비'},
    {COD: 'B', TXT: '규정/절차'}
  ],
  CHG_ATC: [
    {COD: 'A', TXT: '물질 변경'},
    {COD: 'B', TXT: '절차서 개정'},
    {COD: 'C', TXT: '설비의 철거'}
  ],

  //검토서
  REVIEW_YN: [
    {COD: 'Y', TXT: '대상'},
    {COD: 'N', TXT: '비대상'}
  ],
  REVIEW_RESULT: [
    {COD: 'A', TXT: '적정'},
    {COD: 'B', TXT: '부적정'},
    {COD: 'C', TXT: '조건부 적정'},
    {COD: 'Z', TXT: '해당없음'},
  ],
}) 

const getChgDivLabel = computed(() => {
  const match = codeList.CHG_DIV.find(item => item.COD === tab1Params.CHG_DIV);
  return match ? match.TXT : '';
});
const getChgReasonLabel = computed(() => {
  const match = codeList.CHG_REASON.find(item => item.COD === tab1Params.CHG_REASON);
  return match ? match.TXT : '';
});
const getChgGradeLabel = computed(() => {
  const match = codeList.CHG_GRADE.find(item => item.COD === tab1Params.CHG_GRADE);
  return match ? match.TXT : '';
});
const getChgTargetLabel = computed(() => {
  const match = codeList.CHG_TARGET.find(item => item.COD === tab1Params.CHG_TARGET);
  return match ? match.TXT : '';
});
const getChgAtcLabel = computed(() => {
  const match = codeList.CHG_ATC.find(item => item.COD === tab1Params.CHG_ATC);
  return match ? match.TXT : '';
});


// watch타기 전 initcodelist 탔는지 확인
const deptListReady = ref(false);
const initCodeList = async () => { 
  Promise.all([
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    })
  ]).then((res) => {
    codeList.deptCd = res[0].ORESULT_CUR
    deptListReady.value = true;
  })
  tab1Params.DRAFT_YN=='N'
}

// 등록자 부서/부서장 조회
const search01 = async () => {
  const data = {
    queryId: "RSKAA0010_SEARCH_01",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      DEPT_CD: userStore.deptCd,
    },
  };

  const meta = { useProgress: false };

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {
    tab1Params.PRO_EMP_NO = userStore.empNo
    tab1Params.PRO_EMP_NM = userStore.empNm
    
    if (res.ORESULT_CUR.length > 0) { 
      tab1Params.PRO_DEPT_CD = res.DEPT_CD
      tab1Params.PRO_DEPT_NM = res.ORESULT_CUR[0].DEPT_NM;
      tab1Params.PRO_CPT_NM = res.ORESULT_CUR[0].DEPT_HEAD_NM;
    }
  });
};
// 안전지원 부서장 조회
const equipCptSearch = async(val) => {
  const data = {
    queryId: "RSKAA0010_SEARCH_01",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      DEPT_CD: val,
    },
  };

  const meta = { useProgress: false };

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {

    if (res.ORESULT_CUR.length > 0) { 
      tab1Params.EQUIP_CPT_NM = res.ORESULT_CUR[0].DEPT_HEAD_NM;
    }
  });
};
// 부서/부서장 조회
const safeCptSearch = async (val) => {
  const data = {
    queryId: "RSKAA0010_SEARCH_01",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      DEPT_CD: val,
    },
  };

  const meta = { useProgress: false };

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {
    console.log(res)
    if (res.ORESULT_CUR.length > 0) { 
      tab1Params.SAFE_CPT_NM = res.ORESULT_CUR[0].DEPT_HEAD_NM;
    }
  });
};

// 변경근거 '기타'아닐때 그밑에꺼 초기화
watch(
  () => tab1Params.CHG_REASON,
  (newVal) => {
    if (newVal !== 'D') {
      tab1Params.CHG_ATC = '';
    }
  }
);

// 비상변경 활성/비활성화
const emergencyReadOnly = computed(() => {
  return tab1Params.CHG_DIV !== 'B'
});
// 다시 활성화 되면 초기화
watch(() => tab1Params.CHG_DIV, (newVal, oldVal) => {
  if (newVal) { 
    tab1Params.SAFE_DEPT_CD = 'N1K0'
    tab1Params.SAFE_DEPT_NM = '안전보건지원부'
    tab1Params.SAFE_CPT_NM = '김성중'
  } else if (oldVal === 'B' && newVal !== 'B') {
    tab1Params.ECHG_ALLOW_DT = '';
    tab1Params.ECHG_DT = '';
    tab1Params.ECHG_TIME = '';
    tab1Params.MNG_PLAN = '';
    tab1Params.EQUIP_DEPT_CD = '';
    tab1Params.EQUIP_DEPT_NM = '';
    tab1Params.EQUIP_CPT_NM = '';
    tab1Params.EQUIP_DT = '';
    tab1Params.EQUIP_CMT = '';
    tab1Params.SAFE_DEPT_CD = '';
    tab1Params.SAFE_DEPT_NM = '';
    tab1Params.SAFE_CPT_NM = '';
    tab1Params.SAFE_DT = '';
    tab1Params.SAFE_CMT = '';
  }
})

// 인원 팝업
const clickEmpPopup = (seq, index) => { 
  
  empSeq.value = seq
  empIndex.value = index //검토항목
  
  // 0: 검토자, 1: 변경검토결과 위원장
  if (seq === 0) {
    empPopup.value.openPopup({})
  } else if (seq === 1) {   
    empPopup.value.openPopup({})
  } else if (seq === 2) {  
    empPopup.value.openPopup({})
  } else if (seq === 3) {   
    empPopup.value.openPopup({})
  }
}

// 팝업에서 인원선택
const onEmpSelected = (val) => {
  const idx = empIndex.value; 

  // 0: 검토자, 1: 변경검토결과 위원장
  if (empSeq.value === 0) {
    const target = tab2Params.value.find(item => item.KEY === idx);

    if (target) {
      target.REVIEW_EMP.push({
        EMP_NO: val.EMP_NO,
        EMP_NM: val.EMP_NM,
        REVIEW_DESC: val.EMP_NM + ':' + '',
        SAVE_YN: 'N'
      });
    }
  } else if (empSeq.value === 1) { 
    console.log(val)
    tab2ConfirmParams.CONFIRM_EMP_NO = val.EMP_NO,
    tab2ConfirmParams.CONFIRM_EMP_NM = val.EMP_NM
    tab2ConfirmParams.EMAIL = val.EMAIL
  } else if (empSeq.value === 2) { 
    tab3Params.EFFECT_EMP_NO = val.EMP_NO
    tab3Params.EFFECT_EMP_NM = val.JOB_TIT_NM?val.EMP_NM + ' ' + val.JOB_TIT_NM : val.EMP_NM
    tab3Params.EMP_DEPT_CD = val.DEPT_CD
    tab3Params.EMP_DEPT_NM = val.DEPT_NM
  } else if (empSeq.value === 3) { 
    tab3Params.EFFECT_MNG_NO = val.EMP_NO
    tab3Params.EFFECT_MNG_NM = val.JOB_TIT_NM?val.EMP_NM + ' ' + val.JOB_TIT_NM : val.EMP_NM
    tab3Params.MNG_DEPT_CD = val.DEPT_CD
    tab3Params.MNG_DEPT_NM = val.DEPT_NM
  } 
};


// 부서선택 팝업
const deptOpen = (index) => {

  deptIndex.value = index

  if (index === 0) { 
    deptPopup.value.openPopup({ORGN_DIV: 'A', CMP_DISABLE: true, HSE_ONLY: 'Y'})
  } else if (index === 1) {
    deptPopup.value.openPopup({ORGN_DIV: 'A', CMP_DISABLE: true, HSE_ONLY: 'Y'})
  }
}

// 팝업에서 부서선택
const onDeptSelected = (val) => { 
  console.log(val)
  if (deptIndex.value === 0) {
    tab1Params.EQUIP_DEPT_CD = val.DEPT_CD
    tab1Params.EQUIP_DEPT_NM = val.ASGN_SHRT_NM
    equipCptSearch(val.DEPT_CD)
  } else if (deptIndex.value === 1) { 
    tab1Params.SAFE_DEPT_CD = val.DEPT_CD
    tab1Params.SAFE_DEPT_NM = val.ASGN_SHRT_NM
    safeCptSearch(val.DEPT_CD)
  }
}

// 검토자 인원선택 팝업
const openReviewerPopup = (item) => { 

  sppfj0010Popup02.value.openPopup({
    CHG_NO: item.CHG_NO,
    KEY: item.KEY,
    BSNS_CD: item.BSNS_CD,
    DEPT_CD: item.DEPT_CD,
    PROCESS: item.PROCESS
  });
}

// 변경완료확인 팝업
const btnChk = (seq) => { 
  // 공정안전자료
  if (seq === 1) {
    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: tab1Params.BSNS_CD,
      DEPT_CD: tab1Params.DEPT_CD,
      PROCESS_CD: tab1Params.PROCESS,
      OPEN_FLAG: true,
      isAdmin: 2,
      CHG_NO : tab1Params.CHG_NO,
      READONLY : tab3Read.value
    }
    console.log('공정안전자료 조회파람: ', param)
    sppfj0010Popup06.value.openPopup(true, param)
  }
  // 공정위험성평가
  else if (seq === 2) { 
    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: tab1Params.BSNS_CD,
      DEPT_CD: tab1Params.DEPT_CD,
      PROCESS_CD: tab1Params.PROCESS,
      CHG_NO : tab1Params.CHG_NO,
      READONLY : tab3Read.value
    }
    console.log('공정위험성평가 조회파람: ', param)
    sppfj0010Popup07.value.openPopup(param)
  }
  // 안전운전절차
  else if (seq === 3) { 
    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: tab1Params.BSNS_CD,
      DEPT_CD: tab1Params.DEPT_CD,
      PROCESS_CD: tab1Params.PROCESS,
      REV_DIV: 'A',
      DIV: 'C',
      CHG_NO : tab1Params.CHG_NO,
      READONLY : tab3Read.value
    }
    console.log('안전운전절차 조회파람: ', param)
    sppfj0010Popup08.value.openPopup(param)
  }
  // 설비유지관리
  else if (seq === 4) { 
    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: tab1Params.BSNS_CD,
      DEPT_CD: tab1Params.DEPT_CD,
      PROCESS_CD: tab1Params.PROCESS,
      CHG_NO : tab1Params.CHG_NO,
      READONLY : tab3Read.value
    }
    console.log('설비유지관리 조회파람: ', param)
    sppfj0010Popup09.value.openPopup(param)
  }
  // 안전작업허가 준수
  else if (seq === 5) { 
    fileTitle5.value = '안전작업허가 준수 파일등록'
    iUploadPopup5.value.openPopup(tab3Params.CONFIRM_FILE_ID)
  }
  // 가동전점검
  else if (seq === 6) { 
    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: tab1Params.BSNS_CD,
      DEPT_CD: tab1Params.DEPT_CD,
      PROCESS_CD: tab1Params.PROCESS,
      GUBUN: 'A',
      DIV: 'C',
      CHG_NO : tab1Params.CHG_NO,
      READONLY : tab3Read.value
    }
    console.log('가동전점검 조회파람: ', param)
    sppfj0010Popup10.value.openPopup(param)
  }
  // 변경교육 실시
  else if (seq === 7) { 
    fileTitle7.value = '변경교육 실시 파일등록'
    iUploadPopup7.value.openPopup(tab3Params.CHGEDU_FILE_ID)
  }
  // 안전사고발생 여부
  else if (seq === 8) { 
    fileTitle8.value = '안전사고발생 여부 파일등록'
    iUploadPopup8.value.openPopup(tab3Params.ACCIDENT_FILE_ID)
  }
  // 변경검토 보완사항
  else if (seq === 9) { 
    fileTitle9.value = '변경검토 보완사항 파일등록'
    iUploadPopup9.value.openPopup(tab3Params.CHGCHK_FILE_ID)
  }
}

// -------------------------------------------------------- 완료확인서 변경관리 파일등록 --------------------------------------------------------

const uploaded5 = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  // DB에 파일정보 저장
  let param = {
    BSNS_CD: tab1Params.BSNS_CD,
    DEPT_CD: tab1Params.DEPT_CD,
    PROCESS: tab1Params.PROCESS,
    CHG_NO: tab1Params.CHG_NO,
    FILE_ID: val.fileId
  }
  saveParams.push(param)
  console.log(saveParams)
  commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_11', list: saveParams }).then((res) => { 
    searchTab3();
  })
}

const uploaded7 = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  // DB에 파일정보 저장
  let param = {
    BSNS_CD: tab1Params.BSNS_CD,
    DEPT_CD: tab1Params.DEPT_CD,
    PROCESS: tab1Params.PROCESS,
    CHG_NO: tab1Params.CHG_NO,
    FILE_ID: val.fileId
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_12', list: saveParams }).then((res) => { 
    searchTab3();
  })
}

const uploaded8 = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  // DB에 파일정보 저장
  let param = {
    BSNS_CD: tab1Params.BSNS_CD,
    DEPT_CD: tab1Params.DEPT_CD,
    PROCESS: tab1Params.PROCESS,
    CHG_NO: tab1Params.CHG_NO,
    FILE_ID: val.fileId
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_13', list: saveParams }).then((res) => { 
    searchTab3();
  })
}

const uploaded9 = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return

  // DB에 파일정보 저장
  let param = {
    BSNS_CD: tab1Params.BSNS_CD,
    DEPT_CD: tab1Params.DEPT_CD,
    PROCESS: tab1Params.PROCESS,
    CHG_NO: tab1Params.CHG_NO,
    FILE_ID: val.fileId
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_14', list: saveParams }).then((res) => { 
    searchTab3();
  })
}


// 버튼 이벤트
const onButtonsClick = (btn) => {
  switch (btn.id) {
    case 'btnTemporaryStorage':
      handleTemporarySave();
      break;
    case 'btnSaveDraft':
      new saveFlowHelper(vm, t)
        .setConfirmMessage('저장 및 기안 하시겠습니까?')
        .setBefore(beforeTab1Draft)
        .setQuery(tab1Draft)
        .setAfter(afterTab1DraftData)
        .run()
      break;
    case 'btnSaveReview':
      handleSaveReview()
      break;
    case 'btnReqApprove':
      new saveFlowHelper(vm, t)
        .setConfirmMessage('승인요청을 보내시겠습니까?')
        .setQuery(tab2ReqSendMail)
        .run()
      break;
    case 'btnClose':
      closePopup();
      break;
  }
};

// -------------------------------------------------- 임시저장 탭별 분리 ------------------------------------------------------
const handleTemporarySave = () => {
  if (selectedTab.value === 0) {
    // 탭1 임시저장
    new saveFlowHelper(vm, t)
      .setConfirmMessage('임시저장 하시겠습니까?')
      .setBefore(beforeTab1Save)
      .setQuery(saveTab1Data)
      .setAfter(afterTab1SaveData)
      .run()
  } else if (selectedTab.value === 1) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('임시저장 하시겠습니까?')
      .setBefore(beforeTab2Save)
      .setQuery(saveTab2Data)
      .setAfter(afterTab2SaveData)
      .run()
  } else if (selectedTab.value === 2) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('임시저장 하시겠습니까?')
      .setBefore(beforeTab3Save)
      .setQuery(saveTab3Data)
      .setAfter(afterTab3SaveData)
      .run()
  }
};



// -------------------------------------------------- 검토요청 탭별 분리 ------------------------------------------------------
const handleSaveReview = () => {
  // 탭2 저장 및 검토요청
  if (selectedTab.value === 1) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('검토요청을 보내시겠습니까?')
      .setQuery(tab2SendMail)
      .run()
  } else if (selectedTab.value === 2) {
    saveTab3AsTemp();
  }
};


// -------------------------------------------------- 탭별 조회 --------------------------------------------------
watch(
  () => selectedTab.value,
  (newVal) => {
    expansions.value[newVal] = [0]; // 클릭 시 해당 탭 Expansion 열기

    // 탭별 조회 로직
    if (newVal === 0) searchTab1();
    else if (newVal === 1) searchTab2();
    else if (newVal === 2) searchTab3();
  }
);

// 탭1(변경요소제안서) 조회
const searchTab1 = async () => {
  console.log("조회조건: ",searchParams)
  await commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_01', param: searchParams }).then(res => { 
    console.log("res1:",res)
    if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
      const data = res.ORESULT_CUR[0];
      console.log("tab1 data:", data)
      Object.assign(tab1Params, data);

      if (data.DRAFT_YN === 'Y') {
        tabEnabled.value[1] = true;

        tab2Params.value.CHG_NO = data.CHG_NO
        tab2Params.value.CHG_DT = data.CHG_DT
        tab2Params.value.forEach(item => {
          item.BSNS_CD = data.BSNS_CD;
          item.DEPT_CD = data.DEPT_CD;
          item.PROCESS = data.PROCESS;
          item.CHG_NO = data.CHG_NO;
          item.CHG_DT = data.CHG_DT;
        });
        tab2ConfirmParams.BSNS_CD = data.BSNS_CD;
        tab2ConfirmParams.DEPT_CD = data.DEPT_CD;
        tab2ConfirmParams.PROCESS = data.PROCESS;
        tab2ConfirmParams.CHG_NO = data.CHG_NO;

        tab1Read.value=true;
      }
    }
  })
};

// 탭2에서 접수코드 앞에 부서코드 한글명으로 바꿈 
watch(
  () => [deptListReady.value, tab2Params.value?.CHG_NO],
  ([ready, chgNo]) => {
    if (!ready || !chgNo) return; // 아직 준비 안 됨

    const prefix = chgNo.split('_')[0]; // 부서코드 자름
    const matched = codeList.deptCd.find(x => x.DEPT_CD === prefix);
    
    if (matched) {
      tab2Params.value.CHG_NM = `${matched.DEPT_NM}_${chgNo.split('_')[1]}`
    }
  },
  { immediate: true }
);

// 탭2(변경관리위원회 검토서) 조회
const searchTab2 = async () => {
  if (tab1Params.CHG_NO) { 
    searchParams.CHG_NO = tab1Params.CHG_NO
  }
  console.log("조회조건: ",searchParams)
  let itemList = [];
  let reviewerList = [];

  // 1. 항목 정보 조회
  await commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_02', param: searchParams }).then(res => {
    if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
      itemList = res.ORESULT_CUR;
    }
    else
    {
      const saveParams = tab2Params.value.map(item => {
      const { REVIEW_EMP, ...rest } = item; // REVIEW_EMP는 제외
        return { ...rest };
      });

      console.log("111:",tab2Params.value)
      console.log("222:",saveParams)

      commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_03', list: saveParams });
    }
  });

  // 2. 검토자 정보 조회
  await commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_03', param: searchParams }).then(res => {
    if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
      reviewerList = res.ORESULT_CUR;
    } 
  });
  if (itemList.length > 0) { 
    // 3. 병합 
    const mergedList = itemList.map(item => { 
      const empList = reviewerList.filter(emp => emp.KEY === item.KEY);
      const matched = REVIEW_ITEM.find(t => t.key === item.KEY);
  
      return {
        ...item,
        text: matched ? matched.text : '',
        SAVE_YN: item.SAVE_YN,
        REVIEW_EMP: empList.length > 0
          ? empList
          : [{ EMP_NO: '', EMP_NM: '', REVIEW_DESC: '', REVIEW_RESULT: '', FILE_ID: '', SAVE_YN: 'N' }]
      };
    });
    tab2Params.value = mergedList;
    console.log(tab2Params.value)
  }

  // 4. 반영
  tab2Params.value.CHG_NO = tab1Params.CHG_NO
  tab2Params.value.CHG_DT = tab1Params.CHG_DT
  console.log("tab2:",searchParams)
  // 5. 변경관리위원회 조회
  await commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_05', param: searchParams }).then(res => { 
    if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
      const data = res.ORESULT_CUR[0];
      console.log("tab2Confirm data:", data)
      Object.assign(tab2ConfirmParams, data);

      if (data.CONFIRM_YN === 'Y') {
        tabEnabled.value[2] = true;
      }
    }
  })
};

// 탭3(완료확인서) 조회
const searchTab3 = async () => {
  await commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_06', param: searchParams }).then(res => { 
    if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
      const data = res.ORESULT_CUR[0];
      console.log("tab3Params data:", data)
      Object.assign(tab3Params, data);
    }
  })
  tab3Params.BSNS_CD = tab1Params.BSNS_CD
  tab3Params.DEPT_CD = tab1Params.DEPT_CD
  tab3Params.PROCESS = tab1Params.PROCESS
  tab3Params.CHG_NO = tab1Params.CHG_NO
  console.log(tab3Params.CHK_DT)
  if(tab3Params.CHK_DT)
  {
    tab3Read.value=true;
  }
  else
  {
    tab3Read.value=false;
  }
};



// -------------------------------------------------- 변경요소제안서 임시저장 --------------------------------------------------
const beforeTab1Save = () => { 
  const proDtParams = [
    { key: 'PRO_DT', message: '제안일자를 입력하세요.' },
  ];

  // const requiredDataParams = [
  //   { key: 'EMP_NO', message: '건강관리위험 대상자를 선택하세요.' },
  // ];

  // 필수 항목 체크 (담당자 없을때)
  for (const field of proDtParams) {
    if (isEmpty(tab1Params[field.key])) {
      Message.warn(t(field.message));
      return false;
    }
  }
  // // 필수 항목 체크 (대상자 없을때)
  // for (const field of requiredDataParams) {
  //   if (isEmpty(dataParams[field.key])) {
  //     Message.warn(t(field.message));
  //     return false;
  //   }
  // }
  return true
}

const saveTab1Data = () => {
  let saveParams = []
  let data = { ...tab1Params }
  saveParams.push(data)
  
  console.log(saveParams)
  return commonExecuteApi({ queryId : 'SPPFJ0010_SAVE_01', list: saveParams })
}

const afterTab1SaveData = async (res) => {
  searchParams.CHG_NO=res.list[0].OUT_RES_SEQ
  
  searchTab1()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()


}
// ------------------------------------------- 변경요소제안서 기안 ------------------------------------------------------

const beforeTab1Draft = () => { 
  // const requiredManageParams = [
  //   { key: 'EMP_NM', message: '담당자 정보를 먼저 저장하세요.' },
  // ];

  // const requiredDataParams = [
  //   { key: 'EMP_NO', message: '건강관리위험 대상자를 선택하세요.' },
  // ];

  // // 필수 항목 체크 (담당자 없을때)
  // for (const field of requiredManageParams) {
  //   if (isEmpty(manageParams[field.key])) {
  //     Message.warn(t(field.message));
  //     return false;
  //   }
  // }
  // // 필수 항목 체크 (대상자 없을때)
  // for (const field of requiredDataParams) {
  //   if (isEmpty(dataParams[field.key])) {
  //     Message.warn(t(field.message));
  //     return false;
  //   }
  // }
  return true
}

const tab1Draft = () => {
  let saveParams = []
  let data = { ...tab1Params }
  saveParams.push(data)
  
  console.log(saveParams)
  return commonExecuteApi({ queryId : 'SPPFJ0010_SAVE_02', list: saveParams })
}

const afterTab1DraftData = async () => {
  await searchTab1()
  Message.success(t('성공적으로 저장되었습니다'))
  await initCodeList()

}

// -------------------------------------------------- 변경관리위원회 검토서 임시저장 --------------------------------------------------
const beforeTab2Save = () => { 
  const saveConfirmParams = []
  const data = { ...tab2ConfirmParams }
  saveConfirmParams.push(data)
  
  if(!saveConfirmParams[0].CONFIRM_EMP_NO)
  {
    return Message.warn(t('변경관리위원장을 선택해주세요'));
  }
  else
  {
    return true
  }
}

const saveTab2Data = async () => {
  // 1. 항목 데이터 저장 (11줄)
  const saveParams = tab2Params.value.map(item => {
    const { REVIEW_EMP, ...rest } = item; // REVIEW_EMP는 제외
    return { ...rest };
  });

  // 2. 검토자 데이터 저장 (검토자 수만큼 줄 생성)
  const reviewerParams = [];
  console.log(tab2Params.value)
  tab2Params.value.forEach(item => {
    item.REVIEW_EMP
      .filter(emp => emp.EMP_NO) // EMP_NO가 있는 경우만 저장
      .forEach(emp => {
        reviewerParams.push({
          CHG_NO: item.CHG_NO,
          KEY: item.KEY,
          EMP_NO: emp.EMP_NO,
          EMP_NM: emp.EMP_NM,
          REVIEW_DESC: emp.REVIEW_DESC || '',
          REVIEW_RESULT: emp.REVIEW_RESULT || '',
          REVIEW_DT: item.REVIEW_DT || '',
          BSNS_CD: item.BSNS_CD,
          DEPT_CD: item.DEPT_CD,
          PROCESS: item.PROCESS,
          SAVE_YN: emp.SAVE_YN,
          EMAIL : emp.EMAIL
        });
      });
  });

  // 3. 위원장 데이터 저장
  const saveConfirmParams = []
  const data = { ...tab2ConfirmParams }
  saveConfirmParams.push(data)

  console.log({ 항목: saveParams, 검토자: reviewerParams, 위원장: saveConfirmParams });

  // 항목 테이블 저장
  await commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_03', list: saveParams });

  // 검토자 테이블 저장
  await commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_04', list: reviewerParams });

  // 위원장 테이블 저장
  await commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_09', list: saveConfirmParams });
};

const afterTab2SaveData = () => {
  searchTab2()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

// =========================================== 탭2 검토자 메일발송 ====================================================
const tab2SendMail = () => { 
  sendMail(0)
  searchTab2()
  Message.success(t('성공적으로 발송되었습니다'))
  initCodeList()
}

const tab2ReqSendMail = () => { 
  if(selectedTab.value==1)
  {
    sendMail(1)
    searchTab2()
    Message.success(t('성공적으로 발송되었습니다'))
    initCodeList()
  }
  else if(selectedTab.value==2)
  {
    if(!tab3Params.EFFECT_DT)
    {
      return Message.warn(t('시행일자가 입력되지 않았습니다.'))
    }

    if(!tab3Params.COMPLETE_DT)
    {
      return Message.warn(t('완료일자가 입력되지 않았습니다.'))
    }

    sendMail(2)
    searchTab3()
    Message.success(t('성공적으로 발송되었습니다'))
    initCodeList()
  }
}

const sendMail = (seq) => { 
  const allReviewers = tab2Params.value.flatMap((item) => {
    if (!item.REVIEW_EMP || !Array.isArray(item.REVIEW_EMP)) return [];

    return item.REVIEW_EMP.map((emp, idx) => ({
      BSNS_CD: emp.BSNS_CD || item.BSNS_CD,
      DEPT_CD: emp.DEPT_CD || item.DEPT_CD,
      PROCESS: emp.PROCESS || item.PROCESS,
      CHG_NO: emp.CHG_NO || item.CHG_NO,
      KEY: emp.KEY || item.KEY,
      EMP_NO: emp.EMP_NO,
      EMP_NM: emp.EMP_NM,
      EMAIL: emp.EMAIL,
      SEQ: idx + 1  // 검토자 배열 내 순서로 부여
    }));
  });

  const empMap = {};

  allReviewers.forEach(({ EMP_NO, EMAIL, KEY, BSNS_CD, DEPT_CD, PROCESS, CHG_NO }) => {
    if (!EMP_NO) return; // EMP_NO 없으면 스킵

    if (!empMap[EMP_NO]) {
      empMap[EMP_NO] = {
        EMAIL,
        KEY: new Set(),
        BSNS_CD,
        DEPT_CD,
        PROCESS,
        CHG_NO
      };
    }
    empMap[EMP_NO].KEY.add(KEY);
  });

  // 2. Set을 배열로 변환
  for (const empNo in empMap) {
    empMap[empNo].KEY = Array.from(empMap[empNo].KEY);
  }
  let reviewerEmails = []
  for (const empNo in empMap) {
    const { EMAIL, KEY, BSNS_CD, DEPT_CD, PROCESS, CHG_NO } = empMap[empNo];

    // KEY 목록을 쿼리 스트링 등으로 조합 (예: key=a,b,c)
    const key = encodeURIComponent(KEY.join(','));
    if (seq === 0) {
      // 링크에 파라미터 넣기
      // const reviewLink0 = `http://localhost:5173/#/50_safety-support/SPP_F/SPPFJ0010Popup03?EMP_NO=${encodeURIComponent(empNo)}&KEY=${key}&BSNS_CD=${BSNS_CD}&DEPT_CD=${DEPT_CD}&PROCESS=${PROCESS}&CHG_NO=${CHG_NO}&CHG_NM=${encodeURIComponent(tab2Params.value.CHG_NM)}`;
      const reviewLink0 = `${window.location.origin}/#/50_safety-support/SPP_F/SPPFJ0010Popup03?EMP_NO=${encodeURIComponent(empNo)}&KEY=${key}&BSNS_CD=${BSNS_CD}&DEPT_CD=${DEPT_CD}&PROCESS=${PROCESS}&CHG_NO=${CHG_NO}&CHG_NM=${encodeURIComponent(tab2Params.value.CHG_NM)}`;

      // 메일 콘텐츠 작성
      const mailContent0 = `
        변경관리위원회 변경검토 요청입니다.<br><br>
        아래 링크로 접속하셔서 검토의견 및 검토결과 작성 바랍니다.<br><br>
        <a href="${reviewLink0}">변경검토 작성 (바로가기, 클릭)</a>
      `;

      const sendMailParam0 = {
        EMAIL: [EMAIL],
        SUBJECT: '검토자 변경검토 요청 메일',
        CONTENT: mailContent0,
      };
      console.log(sendMailParam0);
      commonSendApi(sendMailParam0);
    } 

    reviewerEmails.push(EMAIL);
  }
  if (seq === 1) { 
    // 링크에 파라미터 넣기
    // const reviewLink1 = `http://localhost:5173/#/50_safety-support/SPP_F/SPPFJ0010Popup04?EMP_NO=&KEY=&BSNS_CD=${tab2ConfirmParams.BSNS_CD}&DEPT_CD=${tab2ConfirmParams.DEPT_CD}&PROCESS=${tab2ConfirmParams.PROCESS}&CHG_NO=${tab2ConfirmParams.CHG_NO}&CHG_NM=${encodeURIComponent(tab2Params.value.CHG_NM)}&REVIEWER_EMAILS=${encodeURIComponent(reviewerEmails.join(','))}`
    const reviewLink1 = `${window.location.origin}/#/50_safety-support/SPP_F/SPPFJ0010Popup04?EMP_NO=&KEY=&BSNS_CD=${tab2ConfirmParams.BSNS_CD}&DEPT_CD=${tab2ConfirmParams.DEPT_CD}&PROCESS=${tab2ConfirmParams.PROCESS}&CHG_NO=${tab2ConfirmParams.CHG_NO}&CHG_NM=${encodeURIComponent(tab2Params.value.CHG_NM)}&REVIEWER_EMAILS=${encodeURIComponent(reviewerEmails.join(','))}`

    // 메일 콘텐츠 작성
    const mailContent1 = `
      변경관리위원회 변경검토 결과 승인 요청입니다.<br><br>
      아래 링크로 접속하셔서 승인여부 및 의견 작성 바랍니다.<br><br>
      <a href="${reviewLink1}">변경검토 작성 (바로가기, 클릭)</a>
    `;
    
    const sendMailParam1 = {
      EMAIL: [tab2ConfirmParams.EMAIL],
      SUBJECT: '변경관리위원장 승인 요청 메일',
      CONTENT: mailContent1,
    };
    
    commonSendApi(sendMailParam1);
  }

  if (seq === 2) { 
    // 링크에 파라미터 넣기
    // const reviewLink1 = `http://localhost:5173/#/50_safety-support/SPP_F/SPPFJ0010Popup05?EMP_NO=&KEY=&BSNS_CD=${tab2ConfirmParams.BSNS_CD}&DEPT_CD=${tab2ConfirmParams.DEPT_CD}&PROCESS=${tab2ConfirmParams.PROCESS}&CHG_NO=${tab2ConfirmParams.CHG_NO}&CHG_NM=${encodeURIComponent(tab2Params.value.CHG_NM)}&REVIEWER_EMAILS=${encodeURIComponent(reviewerEmails.join(','))}`
    const reviewLink1 = `${window.location.origin}/#/50_safety-support/SPP_F/SPPFJ0010Popup05?EMP_NO=&KEY=&BSNS_CD=${tab2ConfirmParams.BSNS_CD}&DEPT_CD=${tab2ConfirmParams.DEPT_CD}&PROCESS=${tab2ConfirmParams.PROCESS}&CHG_NO=${tab2ConfirmParams.CHG_NO}&CHG_NM=${encodeURIComponent(tab2Params.value.CHG_NM)}&REVIEWER_EMAILS=${encodeURIComponent(reviewerEmails.join(','))}`

    // 메일 콘텐츠 작성
    const mailContent1 = `
      변경시행/완료확인서 승인 요청입니다.<br><br>
      아래 링크로 접속하셔서 승인여부 및 의견 작성 바랍니다.<br><br>
      <a href="${reviewLink1}">변경검토 작성 (바로가기, 클릭)</a>
    `;
    
    const sendMailParam1 = {
      EMAIL: [tab2ConfirmParams.EMAIL],
      SUBJECT: '변경관리위원장 승인 요청 메일',
      CONTENT: mailContent1,
    };
    
    commonSendApi(sendMailParam1);
  }
} 


// -------------------------------------------------- 완료확인서 임시저장 --------------------------------------------------
const beforeTab3Save = () => { 

  if(!tab3Params.EFFECT_DT)
  {
    return Message.warn(t('시행일자가 입력되지 않았습니다.'))
  }

  if(!tab3Params.COMPLETE_DT)
    {
    return Message.warn(t('완료일자가 입력되지 않았습니다.'))
  }
  return true
}

const saveTab3Data = () => {
  let saveParams = []
  let data = { ...tab3Params }
  saveParams.push(data)
  
  console.log(saveParams)
  return commonExecuteApi({ queryId : 'SPPFJ0010_SAVE_08', list: saveParams })
}

// ---------------------------------------------------- 파일 업로드 ----------------------------------------------------------
const openFileUpload = (item) => { 
  // 팝업 열기
  iUploadPopup.value.openPopup(item.FILE_ID,'HHI');
}

const afterTab3SaveData = () => {
  searchTab3()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}


// ------------------------------------------- 팝업오픈 ------------------------------------------------------
const openPopup = async (popupParam) => {
  dialog.value = true
  const isNew = popupParam.CHG_NO === undefined
  // 공통: 사업부/부서/공정/접수번호 세팅
  searchParams.BSNS_CD  = popupParam.BSNS_CD
  searchParams.DEPT_CD  = popupParam.DEPT_CD
  searchParams.PROCESS  = popupParam.PROCESS
  searchParams.CHG_NO   = popupParam.CHG_NO
  
  if (isNew) {
    // 신규 모드
    tab1Params.BSNS_CD  = searchParams.BSNS_CD
    tab1Params.DEPT_CD  = searchParams.DEPT_CD
    tab1Params.PROCESS  = searchParams.PROCESS
    expansions.value[0] = [0]
    await search01()
    initCodeList()
  } else {
    // 기존 데이터 조회 모드
    // await search01()
    await searchTab1()
    expansions.value[0] = [0]
    await initCodeList()
  }
}

const closePopup = () => {
  emit('upData')
  resetPopupState()
  dialog.value = false
}

const upData = () => { 
  searchTab2()
}

const resetPopupState = () => {
  selectedTab.value = 0
  expansions.value = [[0], [], []]
  tabEnabled.value = [true, false, false]
  tab1Read.value=false;
  tab2Read.value=false;
  tab3Read.value=false;

  Object.assign(searchParams, {
    BSNS_CD: '',
    DEPT_CD: '',
    PROCESS: ''
  })
  Object.assign(tab1Params, initTab1)
  tab2Params.value = _.cloneDeep(initTab2.value);
  Object.assign(tab2ConfirmParams, initTab2Confirm)
  Object.assign(tab3Params, initTab3)
}

defineExpose({
  openPopup
})

</script>
<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1300"
    height="800"
  >
    <div class="title-bar" @mousedown="startDragging">변경요소 등록</div>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          :key="selectedTab"
          ref="menuTitle"
          :use-permission="false"
          :button-list="buttonList"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <v-container fluid class="fill-height">
          <v-row no-gutters class="fill-height">
            <!-- 좌측 탭 메뉴 -->
            <v-col cols="3" class="tab-menu">
              <v-tabs
                v-model="selectedTab"
                direction="vertical"
                class="tab-list"
                hide-slider
              >
                <template v-for="(tab, index) in tabs" :key="`template-${index}`">
                  <v-tab
                    :value="index"
                    class="tab-item"
                    :disabled="!tabEnabled[index]"
                  >
                    {{ tab }}
                  </v-tab>

                  <v-icon
                    v-if="index < tabs.length - 1"
                    class="my-2"
                    color="primary"
                  >
                    mdi-chevron-down
                  </v-icon>
                </template>
              </v-tabs>
            </v-col>
            <!-- 우측 컨텐츠: 선택된 탭에 해당하는 패널만 렌더링 -->
            <v-col cols="10" class="pa-4 d-flex flex-column" style="width: 100%;">
              <!-- 탭 0 -->
              <v-expansion-panels v-if="selectedTab === 0" v-model="expansions[0]" multiple>
                <v-expansion-panel>
                  <v-expansion-panel-title> {{ tabs[0] }} </v-expansion-panel-title>
                  <v-expansion-panel-text class="panel-wide">
                    <div class="custom-table-wrapper">
                      <table class="custom-table">
                        <tr>
                          <th class="rotate" rowspan="10" style="background-color: #cfe4ff;">변경 제안</th>
                        </tr>
                        <tr>
                          <th colspan="2">제안일자</th>
                          <td colspan="2">
                            <input
                              type="date"
                              v-model="tab1Params.PRO_DT"
                              style="width: 100%"
                              :readonly="tab1Read"
                              :disabled="tab1Read"
                            />
                          </td>
                          <th colspan="2">담당자(제안인)</th>
                          <td colspan="2">
                            <input
                              type="text"
                              v-model="tab1Params.PRO_EMP_NM"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="2">제안부서</th>
                          <td colspan="2">
                            <input
                              type="text"
                              v-model="tab1Params.PRO_DEPT_NM"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                          <th colspan="2">제안부서장</th>
                          <td colspan="2">
                            <input
                              type="text"
                              v-model="tab1Params.PRO_CPT_NM"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="1">변경 구분</th>
                          <td colspan="1" class="pa-0">
                            <i-select
                              v-model="tab1Params.CHG_DIV"
                              :items="codeList.CHG_DIV"
                              item-value="COD"
                              item-title="TXT"
                              width="115px"
                              margin="5px"
                              class="i-select-icon"
                              :readonly="tab1Read"
                              :disabled="tab1Read"
                            />
                          </td>
                          <th colspan="1" rowspan="2">변경<br>근거</th>
                          <td colspan="3" class="pa-0">
                            <i-select
                              v-model="tab1Params.CHG_REASON"
                              :items="codeList.CHG_REASON"
                              item-value="COD"
                              item-title="TXT"
                              width="345px"
                              margin="5px"
                              :readonly="tab1Read"
                              :disabled="tab1Read"
                            />
                          </td>
                          <th colspan="1" rowspan="2" style="text-align: center;">변경관리<br>등급</th>
                          <td colspan="1" rowspan="2" class="pa-0">
                            <i-select
                              v-model="tab1Params.CHG_GRADE"
                              :items="codeList.CHG_GRADE"
                              item-value="COD"
                              item-title="TXT"
                              width="114px"
                              margin="5px"
                              class="i-select-icon"
                              :readonly="tab1Read"
                              :disabled="tab1Read"
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="1">변경대상</th>
                          <td colspan="1" class="pa-0">
                            <i-select
                              v-model="tab1Params.CHG_TARGET"
                              :items="codeList.CHG_TARGET"
                              item-value="COD"
                              item-title="TXT"
                              width="115px"
                              margin="5px"
                              class="i-select-icon2"
                              :readonly="tab1Read"
                              :disabled="tab1Read"
                            />
                          </td>
                          <td colspan="3" class="pa-0">
                            <i-select
                              v-model="tab1Params.CHG_ATC"
                              :items="codeList.CHG_ATC"
                              item-value="COD"
                              item-title="TXT"
                              width="345px"
                              margin="5px"
                              :disabled="tab1Params.CHG_REASON == 'D' ? false : true"
                              :readonly="tab1Read"
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="8" style="text-align: center; background-color: #cfe4ff;">변경설비명 또는 변경요소</th>
                        </tr>
                        <tr>
                          <td colspan="8" style="height:115px;" class="pa-0">
                            <v-textarea
                              v-model="tab1Params.CHG_ITEM"
                              dense
                              outlined
                              style="height: 100%; width: 100%;"
                              :readonly="tab1Read"
                              :disabled="tab1Read"
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="8" style="background-color: #cfe4ff;">변경내용 요약</th>
                        </tr>
                        <tr>
                          <td colspan="8" style="height: 250px;" class="pa-0">
                            <v-textarea
                              v-model="tab1Params.CHG_DESC"
                              dense
                              outlined
                              rows="15"
                              style="height: 100%; width: 100%;"
                              :readonly="tab1Read"
                              :disabled="tab1Read"
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="1">첨부 문서</th>
                          <td colspan="7" style="height: 120px;">
                            <div class="d-flex justify-space-between">
                              <v-checkbox
                                v-model="tab1Params.CHG1"
                                :label="$t('기술검토서')"
                                true-value="Y"
                                false-value="N"
                                class="ml-3 mr-3"
                                :readonly="tab1Read"
                                :disabled="tab1Read"
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG2"
                                :label="$t('설비발주 시방서')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                :readonly="tab1Read"
                                :disabled="tab1Read"
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG3"
                                :label="$t('설비 사양서')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                :readonly="tab1Read"
                                :disabled="tab1Read"
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG4"
                                :label="$t('P&ID/PFD')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                :readonly="tab1Read"
                                :disabled="tab1Read"
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG5"
                                :label="$t('설비 배치도')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                :readonly="tab1Read"
                                :disabled="tab1Read"
                              />
                            </div>
                            <div class="d-flex mt-2 justify-space-between">
                              <v-checkbox
                                v-model="tab1Params.CHG6"
                                :label="$t('위험성평가서')"
                                true-value="Y"
                                false-value="N"
                                class="ml-3 mr-3"
                                :readonly="tab1Read"
                                :disabled="tab1Read"
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG7"
                                :label="$t('공사.작업 계획서')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                :readonly="tab1Read"
                                :disabled="tab1Read"
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG8"
                                :label="$t('운전절차서/메뉴얼(기존설비)')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                :readonly="tab1Read"
                                :disabled="tab1Read"
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG9"
                                :label="$t('기타 참고자료')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                :readonly="tab1Read"
                                :disabled="tab1Read"                                
                              />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th class="rotate2" rowspan="8">비상변경</th>
                        </tr>
                        <tr>
                          <th colspan="2" class="th2">비상 변경유지 허용기간</th>
                          <td colspan="2" >
                            <input
                              type="date"
                              v-model="tab1Params.ECHG_ALLOW_DT"
                              style="width: 100%"
                              :disabled="emergencyReadOnly || tab1Read"
                              :readonly="tab1Read"
                            />
                          </td>
                          <th colspan="1" class="th2">변경시 예정일시</th>
                          <td colspan="3">
                            <div class="d-flex">
                              <input
                                type="date"
                                v-model="tab1Params.ECHG_DT"
                                style="width: 50%"
                                :disabled="emergencyReadOnly || tab1Read"
                                :readonly="tab1Read"
                              />
                              <input
                                type="time"
                                v-model="tab1Params.ECHG_TIME"
                                style="width: 50%"
                                class="ml-2"
                                :disabled="emergencyReadOnly || tab1Read"
                                :readonly="tab1Read"
                              />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th colspan="8" class="th2">관리감독 방안</th>
                        </tr>
                        <tr>
                          <td colspan="8" class="pa-0" style="height: 60px;">
                            <v-textarea
                              v-model="tab1Params.MNG_PLAN"
                              dense
                              outlined
                              style="height: 100%; width: 100%;"
                              :disabled="emergencyReadOnly || tab1Read"
                              :readonly="tab1Read"
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="1" class="th2">관련 부서</th>
                          <th colspan="2" class="th2">부서명</th>
                          <th colspan="1" class="th2">부서장</th>
                          <th colspan="2" class="th2">승인일</th>
                          <th colspan="2" class="th2">Comments</th>
                        </tr>
                        <tr>
                          <th colspan="1" style="height: 35px;" class="th2">설비보유부서</th>
                          <td colspan="2" style="height: 35px;" class="pa-0">
                            <v-text-field 
                              type="text" 
                              v-model="tab1Params.EQUIP_DEPT_NM" 
                              dense
                              outlined
                              readonly
                              class="dept-readonly-field"
                              style="height: 100%; width: 100%;"
                              append-inner-icon="mdi-magnify"
                              @click:appendInner="deptOpen(0)"
                              :disabled="emergencyReadOnly || tab1Read"
                            />
                          </td>
                          <td colspan="1" style="height: 35px;">
                            <input
                              type="text"
                              v-model="tab1Params.EQUIP_CPT_NM"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                          <td colspan="2" style="height: 35px;">
                            <input
                              type="date"
                              v-model="tab1Params.EQUIP_DT"
                              style="width: 100%"
                              :disabled="emergencyReadOnly || tab1Read"
                              :readonly="tab1Read"
                            />
                          </td>
                          <td colspan="2" style="height: 35px;" class="pa-0">
                            <v-textarea
                              v-model="tab1Params.EQUIP_CMT"
                              dense
                              outlined
                              rows="1"
                              style="height: 100%; width: 100%;"
                              :disabled="emergencyReadOnly || tab1Read"
                              :readonly="tab1Read"
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="1" style="height: 35px;" class="th2">안전지원부서</th>
                          <td colspan="2" style="height: 35px;" class="pa-0">
                            <v-text-field 
                              type="text" 
                              v-model="tab1Params.SAFE_DEPT_NM" 
                              dense
                              outlined
                              readonly
                              class="dept-readonly-field"
                              style="height: 100%; width: 100%;"
                              append-inner-icon="mdi-magnify"
                              @click:appendInner="deptOpen(1)"
                              :disabled="emergencyReadOnly"
                            />
                          </td>
                          <td colspan="1" style="height: 35px;">
                            <input
                              type="text"
                              v-model="tab1Params.SAFE_CPT_NM"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                          <td colspan="2" style="height: 35px;">
                            <input
                              type="date"
                              v-model="tab1Params.SAFE_DT"
                              style="width: 100%"
                              :disabled="emergencyReadOnly || tab1Read"
                              :readonly="tab1Read"
                            />
                          </td>
                          <td colspan="2" style="height: 35px;" class="pa-0">
                            <v-textarea
                              v-model="tab1Params.SAFE_CMT"
                              dense
                              outlined
                              rows="1"
                              style="height: 100%; width: 100%;"
                              :disabled="emergencyReadOnly || tab1Read"
                              :readonly="tab1Read"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td colspan="8" style="height: 30px;">
                            ※ 관련 부서의 합의를 득하고, 필요시 유선통보하여 승인을 얻고 해당 내용을 기록 후 유선통보 시간을 기재한다.
                          </td>
                        </tr>
                      </table>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <!-- 탭 1 -->
              <v-expansion-panels v-if="selectedTab === 1" v-model="expansions[1]" multiple>
                <v-expansion-panel>
                  <v-expansion-panel-title> {{ tabs[1] }} </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="custom-table-wrapper">
                      <table class="custom-table">
                        <!-- 1행 -->
                        <tr>
                          <th colspan="4">변경관리 접수번호</th>
                          <td colspan="4">
                            <input
                              type="text"
                              v-model="tab2Params.CHG_NM"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                          <th colspan="3">접수일자</th>
                          <td colspan="3">
                            <input
                              type="date"
                              v-model="tab2Params.CHG_DT"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                        </tr>

                        <!-- 2행: 병합 제목 -->
                        <tr>
                          <th colspan="14" style="background-color: #cfe4ff;">1. 변경 검토(변경관리위원회)</th>
                        </tr>

                        <!-- 3행: 헤더 -->
                        <tr style="background-color: #f0f8ff;">
                          <th rowspan="13" class="rotate" style="background-color: #cfe4ff;">검토사항</th>
                        </tr>
                        <tr style="background-color: #f0f8ff;">
                          <th colspan="2">검토항목</th>
                          <th colspan="2">검토여부</th>
                          <th colspan="3">검토내용 및 의견</th>
                          <th colspan="2">검토결과</th>
                          <th colspan="2">검토자</th>
                          <th colspan="2">검토완료일</th>
                        </tr>

                        <tr v-for="item in tab2Params" :key="item.KEY">
                          <td colspan="2" style="text-align: center; font-weight: bold;">{{ item.text }}</td>
                          <td colspan="2" class="pa-1">
                            <i-select
                              v-model="item.REVIEW_YN"
                              :items="codeList.REVIEW_YN"
                              item-value="COD"
                              item-title="TXT"
                              width="130px"
                              margin="5px"
                              class="i-select-icon2"
                              :disabled="tab2ConfirmParams.CONFIRM_YN == 'Y'"
                            />
                          </td>
                          <td colspan="3" style="text-align: left;" class="pa-0">
                            <div v-for="emp in item.REVIEW_EMP.filter(e => e.EMP_NO)" :key="emp.EMP_NO" class="d-flex" style="width: 100%">
                              <v-textarea
                                v-model="emp.REVIEW_DESC"
                                dense
                                outlined
                                rows="3"
                                style="height: 100%; width: 80%;"
                                readonly
                              />
                              <div
                                  style="width: 20%"
                                  class="d-flex align-center justify-left"
                                >
                                <v-btn
                                  :color="emp.FILE_ID ? 'green' : 'primary'"
                                  @click="openFileUpload(emp)"
                                  style="width: 34px; height: 40px; display: flex; flex-direction: column; justify-content: center; line-height: 1.1;"
                                >
                                  <span v-if="emp.FILE_ID">
                                    첨부<br>완료
                                  </span>
                                  <span v-else>
                                    첨부
                                  </span>
                                </v-btn>
                              </div>
                            </div>
                          </td>
                          <td colspan="2" class="pa-0">
                            <div
                              class="d-flex flex-column"
                              :style="{ height: `${item.REVIEW_EMP.filter(e => e.EMP_NO).length * 73}px` }"
                            >
                              <div
                                v-for="emp in item.REVIEW_EMP.filter(e => e.EMP_NO)"
                                :key="emp.EMP_NO"
                                style="flex: 1; display: flex; align-items: center; padding: 0 4px;"
                              >
                                <i-select
                                  v-model="emp.REVIEW_RESULT"
                                  :items="codeList.REVIEW_RESULT"
                                  item-value="COD"
                                  item-title="TXT"
                                  class="i-select-icon2"
                                  width="100%"
                                  readonly
                                />
                              </div>
                            </div>
                          </td>
                          <td colspan="2">
                            <div class="d-flex" style="width: 100%">
                              <!-- 왼쪽: 이름 리스트 -->
                              <div :style="{ height: `${item.REVIEW_EMP.filter(e => e.EMP_NO).length * 73}px`}" class="align-center justify-left d-flex flex-column">
                                <div v-for="(emp, i) in item.REVIEW_EMP" :key="i" style="flex: 1; display: flex; align-items: center; padding: 0 4px;">
                                  <input
                                    type="text"
                                    v-model="emp.EMP_NM"
                                    readonly
                                    style="width: 100%"
                                  />
                                </div>
                              </div>

                              <!-- 오른쪽: 버튼 하나, 세로 가운데 정렬 -->
                              <div
                                style="width: 40%"
                                class="d-flex align-center justify-right"
                              >
                                <v-btn
                                  icon
                                  color="primary"
                                  @click="openReviewerPopup(item)"
                                  :disabled="tab2ConfirmParams.CONFIRM_YN == 'Y'"
                                >
                                  <v-icon>mdi-magnify</v-icon>
                                </v-btn>
                              </div>
                            </div>
                          </td>


                          <td colspan="2"> 
                            <div
                              class="d-flex flex-column"
                              :style="{ height: `${item.REVIEW_EMP.filter(e => e.EMP_NO).length * 73}px` }"
                            >
                              <div
                                v-for="emp in item.REVIEW_EMP.filter(e => e.EMP_NO)"
                                :key="emp.EMP_NO"
                                style="flex: 1; display: flex; align-items: center; padding: 0 4px;"
                              >
                                <input
                                  type="date"
                                  v-model="emp.REVIEW_DT"
                                  style="width: 100%"
                                  readonly
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                        
                        <tr>
                          <th colspan="14" style="background-color: #cfe4ff;">2. 변경 검토 결과(변경관리위원회)</th>
                        </tr>
                        <tr>
                          <th rowspan="3" colspan="1" class="rotate" style="background-color: #cfe4ff;">결과</th>
                        </tr>
                        <tr>
                          <th colspan="2">승인여부</th>
                          <th colspan="6">의견</th>
                          <th colspan="3">위원장 확인</th>
                          <th colspan="2">승인일자</th>
                        </tr>
                        <tr>
                          <td colspan="2" style="height: 80px;">
                            <v-radio-group inline v-model="tab2ConfirmParams.CONFIRM_YN" readonly>
                              <v-radio label="승인" value="Y"></v-radio>
                              <v-radio label="불가" value="N"></v-radio>
                            </v-radio-group>
                          </td>
                          <td colspan="6" style="height: 80px;" class="pa-0">
                            <v-textarea
                              v-model="tab2ConfirmParams.CONFIRM_DESC"
                              dense
                              outlined
                              rows="4"
                              style="height: 100%; width: 100%;"
                              readonly
                            />
                          </td>
                          <td colspan="3" style="height: 80px;">
                            변경관리위원장
                            <input
                              type="text"
                              v-model="tab2ConfirmParams.CONFIRM_EMP_NM"
                              readonly
                              style="width: 70%"
                            />
                            <v-btn 
                              @click="clickEmpPopup(1,null)" 
                              color="primary" 
                              readonly
                              :disabled="tab2ConfirmParams.CONFIRM_YN == 'Y'"
                            >
                              <v-icon>mdi-magnify</v-icon>
                            </v-btn>
                          </td>
                          <td colspan="2" style="height: 80px;">
                            <input
                              type="date"
                              v-model="tab2ConfirmParams.CONFIRM_DT"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                        </tr>
                      </table>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <!-- 탭 2 -->
              <v-expansion-panels v-if="selectedTab === 2" v-model="expansions[2]" multiple>
                <v-expansion-panel>
                  <v-expansion-panel-title> {{ tabs[2] }} </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="custom-table-wrapper">
                      <table class="custom-table">
                        <tr>
                          <th class="rotate" rowspan="4" style="background-color: #cfe4ff;">변경시행대상</th>
                        </tr>
                        <tr>
                          <th colspan="2">접수번호</th>
                          <td colspan="2">
                            <input
                              type="text"
                              v-model="tab2Params.CHG_NM"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                          <th colspan="3">변경승인 일자</th>
                          <td colspan="3">
                            <input
                              type="date"
                              v-model="tab2ConfirmParams.CONFIRM_DT"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="2">변경 구분</th>
                          <td colspan="2">
                            <input
                              type="text"
                              :value="getChgDivLabel"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                          <th colspan="2" rowspan="2">변경근거</th>
                          <td colspan="2">
                            <input
                              type="text"
                              :value="getChgReasonLabel"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                          <th colspan="1" rowspan="2" style="text-align: center;">변경관리<br>등급</th>
                          <td colspan="1" rowspan="2">
                            <input
                              type="text"
                              :value="getChgGradeLabel"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="2">변경대상</th>
                          <td colspan="2">
                            <input
                              type="text"
                              :value="getChgTargetLabel"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                          <td colspan="2">
                            <input
                              type="text"
                              :value="getChgAtcLabel"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="11" style="text-align: center; background-color: #cfe4ff;">변경 시행(변경시행 주관부서)</th>
                        </tr>
                        <tr>
                          <th class="rotate" rowspan="4" style="background-color: #cfe4ff;">변경시행</th>
                        </tr>
                        <tr>
                          <th colspan="1"></th>
                          <th colspan="2">부서</th>
                          <th colspan="2">성명</th>
                          <th colspan="3">시행일자</th>
                          <th colspan="2">완료일자</th>
                        </tr>
                        <tr>
                          <th colspan="1">시행 담당</th>
                          <td colspan="2">
                            <input
                              type="text"
                              v-model="tab3Params.EMP_DEPT_NM"
                              readonly
                              style="width: 100%"
                            />
                          </td>
                          <td colspan="2">
                            <input
                              type="text"
                              v-model="tab3Params.EFFECT_EMP_NM"
                              readonly
                              style="width: 70%"
                            />
                            <v-btn 
                              @click="clickEmpPopup(2,null)"   
                              color="primary" 
                              style="cursor: pointer;"
                              :disabled="tab3Read"
                            >
                              <v-icon>mdi-magnify</v-icon>
                            </v-btn>
                          </td>
                          <td colspan="3" rowspan="2">
                            <input
                              type="date"
                              v-model="tab3Params.EFFECT_DT"
                              :min="tab2ConfirmParams.CONFIRM_DT"
                              style="width: 100%"
                              :readonly="tab3Read"
                            />
                          </td>
                          <td colspan="2" rowspan="2">
                            <input
                              type="date"
                              v-model="tab3Params.COMPLETE_DT"
                              :min="tab3Params.EFFECT_DT"
                              style="width: 100%"
                              :readonly="tab3Read"
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="1">시행 부서장</th>
                          <td colspan="2">
                            <input
                              type="text"
                              v-model="tab3Params.MNG_DEPT_NM"
                              readonly
                              style="width: 100%"
                            />
                          </td>
                          <td colspan="2">
                            <input
                              type="text"
                              v-model="tab3Params.EFFECT_MNG_NM"
                              readonly
                              style="width: 70%"
                            />
                            <v-btn 
                              @click="clickEmpPopup(3,null)"   
                              color="primary" 
                              style="cursor: pointer;"
                              :disabled="tab3Read"
                            >
                              <v-icon>mdi-magnify</v-icon>
                            </v-btn>
                          </td>
                        </tr>
                        <tr>
                          <th colspan="11" style="text-align: center; background-color: #cfe4ff;">변경 완료 확인(변경관리위원회)</th>
                        </tr>
                        <tr>
                          <th class="rotate" rowspan="9" style="background-color: #cfe4ff;">완료확인</th>
                        </tr>
                        <tr>
                          <th colspan="2">구분</th>
                          <th colspan="6">확인 내용</th>
                          <th colspan="2">비고<br>(추가확인내용)</th>
                        </tr>
                        <tr>
                          <th colspan="2" rowspan="5">변경 후<br>확인 사항</th>
                          <td colspan="3"> 
                            <div class="d-flex justify-space-between">
                              <input value="공정안전자료" readonly/>
                              <v-btn
                                @click="btnChk(1)"
                              >
                                첨부
                              </v-btn>
                            </div>
                          </td>
                          <td colspan="3">
                            <div class="d-flex justify-space-between">
                              <input value="위험성평가 결과 및 개선조치" readonly/>
                              <v-btn
                                @click="btnChk(2)"
                              >
                                첨부
                              </v-btn>
                            </div>
                          </td>
                          <td colspan="2" rowspan="5" class="pa-0">
                            <v-textarea
                              v-model="tab3Params.ADD_CHK_DESC"
                              dense
                              outlined
                              rows="9"
                              style="height: 100%; width: 100%;"
                              :readonly="tab3Read"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td colspan="3">
                            <div class="d-flex justify-space-between">
                              <input value="안전운전절차" readonly/>
                              <v-btn
                                @click="btnChk(3)"
                              >
                                첨부
                              </v-btn>
                            </div>
                          </td>
                          <td colspan="3">
                            <div class="d-flex justify-space-between">
                              <input value="설비유지관리 (설비등급평가)" readonly/>
                              <v-btn
                                @click="btnChk(4)"
                              >
                                첨부
                              </v-btn>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="3">
                            <div class="d-flex justify-space-between">
                              <input value="안전작업허가 준수" readonly/>
                              <v-btn
                                :color="tab3Params.CONFIRM_CNT === 0 ? 'primary' : 'green'"
                                @click="btnChk(5)"
                              >
                                <span v-if="tab3Params.CONFIRM_CNT === 0">첨부</span>
                                <span v-else>첨부완료</span>
                              </v-btn>
                            </div>
                          </td>
                          <td colspan="3">
                            <div class="d-flex justify-space-between">
                              <input value="가동전 점검 및 조치" readonly/>
                              <v-btn
                                @click="btnChk(6)"
                              >
                                첨부
                              </v-btn>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="3">
                            <div class="d-flex justify-space-between">
                              <input value="변경교육 실시" readonly/>
                              <v-btn
                                :color="tab3Params.CHGEDU_CNT === 0 ? 'primary' : 'green'"
                                @click="btnChk(7)"
                              >
                                <span v-if="tab3Params.CHGEDU_CNT === 0">첨부</span>
                                <span v-else>첨부완료</span>
                              </v-btn>
                            </div>
                          </td>
                          <td colspan="3">
                            <div class="d-flex justify-space-between">
                              <input value="안전사고발생 여부" readonly/>
                              <v-btn
                                :color="tab3Params.ACCIDENT_CNT === 0 ? 'primary' : 'green'"
                                @click="btnChk(8)"
                              >
                                <span v-if="tab3Params.ACCIDENT_CNT === 0">첨부</span>
                                <span v-else>첨부완료</span>
                              </v-btn>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="3">
                            <div class="d-flex justify-space-between">
                              <input value="변경검토 보완사항" readonly/>
                              <v-btn
                                :color="tab3Params.CHGCHK_CNT === 0 ? 'primary' : 'green'"
                                @click="btnChk(9)"
                              >
                                <span v-if="tab3Params.CHGCHK_CNT === 0">첨부</span>
                                <span v-else>첨부완료</span>
                              </v-btn>
                            </div>
                          </td>
                          <td colspan="3">
                            <div class="d-flex">
                              <!-- <v-checkbox 
                                v-model="tab3Params.CHK10"
                                :label="$t('변경검토 보완사항')"
                                true-value="Y"
                                false-value="N"
                                style="width: 80%"
                              />
                              <v-btn>첨부</v-btn> -->
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th colspan="2">최종의견</th>
                          <td colspan="6" class="pa-0">
                            <v-textarea
                              v-model="tab3Params.FINAL_OPN"
                              dense
                              outlined
                              rows="3"
                              style="height: 100%; width: 100%;"
                              :readonly="tab3Read"
                            />
                          </td>
                          <th colspan="2">확인일자</th>
                        </tr>
                        <tr>
                          <th colspan="2">완료확인<br>(위원장)</th>
                          <td colspan="6">
                            <input
                              type="text"
                              v-model="tab3Params.CONFIRM_EMP_NM"
                              readonly
                              style="width: 70%"
                            />
                          </td>
                          <td colspan="2">
                            <input
                              type="date"
                              v-model="tab3Params.CHK_DT"
                              style="width: 100%"
                              readonly
                            />
                          </td>
                        </tr>
                      </table>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </VDialog>
  <!-- 부서 팝업 -->
  <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
  <EmpPopup ref="empPopup" @selected="onEmpSelected" />
  <SPPFJ0010Popup02 ref="sppfj0010Popup02" @upData="upData"/>
  <IUploadPopup ref="iUploadPopup" :readOnly="true"/>
  <SPPFJ0010Popup06 ref="sppfj0010Popup06" />
  <SPPFJ0010Popup07 ref="sppfj0010Popup07" />
  <SPPFJ0010Popup08 ref="sppfj0010Popup08" />
  <SPPFJ0010Popup09 ref="sppfj0010Popup09" />
  <SPPFJ0010Popup10 ref="sppfj0010Popup10" />
  <IUploadPopup ref="iUploadPopup5" :gridTitle="fileTitle5" :readOnly="tab3Read" @uploaded="uploaded5"/>
  <IUploadPopup ref="iUploadPopup7" :gridTitle="fileTitle7" :readOnly="tab3Read" @uploaded="uploaded7"/>
  <IUploadPopup ref="iUploadPopup8" :gridTitle="fileTitle8" :readOnly="tab3Read" @uploaded="uploaded8"/>
  <IUploadPopup ref="iUploadPopup9" :gridTitle="fileTitle9" :readOnly="tab3Read" @uploaded="uploaded9"/>
</template>
<style scoped>
.tab-menu {
  min-width: 200px;
  max-width: 200px;
}

.tab-list {
  height: 100%;
}

/* 각 탭이 균등한 높이를 가지도록 설정 */
.tab-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 15.2vh; /* 3개의 탭이 균등하게 분배됨 */
  background-color: aliceblue;
  border-radius: 30px !important;
  border: 1px solid #1976D2;
  margin-bottom: 25px;
  margin-top: 25px;
}
.tab-item:last-child {
  margin-bottom: 0; /* 마지막 탭은 간격 제거 */
}

.v-icon.my-2 {
  font-size: 30px;
  margin: 12px auto;
  display: flex;
  justify-content: center;
  vertical-align: center;
}

.panel-wide {
  width: 120%;
  overflow-x: auto;
}

.custom-table-wrapper {
  padding-left: 12px;
  padding-bottom: 12px;
  width: 975px;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed
}

.custom-table th {
  border: 1px solid #000;
  padding: 6px 8px;
  text-align: center;
  background-color: #e6f1fb;
}
.custom-table td {
  border: 1px solid #000;
  padding: 6px 8px;
  text-align: left;
}

.custom-table th.rotate {
  writing-mode: vertical-rl;
  text-align: center;
  vertical-align: center;
  background-color: #e6f1fb;
  width:40px;
}
.custom-table th.rotate2 {
  writing-mode: vertical-rl;
  text-align: center;
  vertical-align: center;
  background-color: lightyellow;
  width:40px;
}

.custom-table th.th2 {
  border: 1px solid #000;
  padding: 6px 8px;
  text-align: center;
  background-color: lightyellow;
}

::v-deep(.i-select-icon .v-field--appended) {
  padding-inline-end: 0 !important;
}
::v-deep(.i-select-icon .v-field__input) {
  padding-inline-start: 10px !important;
}
::v-deep(.i-select-icon2 .v-field--appended) {
  padding-inline-end: 0 !important;
}
::v-deep(.i-select-icon2 .v-field__input) {
  padding-inline-start: 10px !important;
}

:deep(.dept-readonly-field.v-input--readonly .v-field) {
  background-color: white !important;
}
</style>