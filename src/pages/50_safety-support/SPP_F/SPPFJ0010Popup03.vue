<script setup>
import { ref, reactive, getCurrentInstance, onMounted, computed } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonExecuteApi,
  commonRequest3,
  commonSendApi,
  commonSearchnoAuthApi,
  commonExecutenoAuthApi
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import IButtonList from '@/components/IButtonList.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from "@/components/popup/EmpPopup.vue"
import IUploadPopup from '@/pages/30_safety/SAF_J/IUploadPopup.vue'
import { useRoute } from "vue-router"

const route = useRoute();
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const emit = defineEmits(['upData'])
const gridTitle = ref(null)

const expansions = ref([[0], [], []]);
const selectedTab = ref(0)
const tabs = reactive([
  'STEP1. 변경요소제안서',
  'STEP2. 변경관리위원회 검토서',
  // 'STEP3. 변경시행/완료확인서'
]);
const tabEnabled = ref([true, false, false]);

const deptPopup = ref(null)
const deptIndex = ref(null)

const empPopup = ref(null)
const empSeq = ref(0)
const empIndex = ref(null)

const iUploadPopup = ref(null)

// 탭별로 메뉴버튼 다르게 함
const buttonList = computed(() => {
  if (selectedTab.value === 0) {
    return [];
  } else if (selectedTab.value === 1) {
    return ["btnFinishReview"];
  }
});

const searchParams = reactive({
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS: '',
  CHG_NO: '',
  EMP_NO: '',
  CHG_NM: ''
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

const getReviewItemText = (key) => {
  const found = REVIEW_ITEM.find(i => i.key === key);
  return found ? found.text : '';
}

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
const initTab2 = reactive({
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS: '',
  CHG_NO: '',
  CHG_NM: '',
  KEY: '',
  text: '',
  REVIEW_YN: '',
  REVIEW_DT: '',
  EMP_NO: '',
  EMP_NM: '',
  REVIEW_DESC: '',
  REVIEW_RESULT: '',
  REVIEW_FLAG: 'N',
  SAVE_YN: 'N' 
})
const tab2Params = reactive([])

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


onMounted(()=>{
  const params = new URLSearchParams(userStore.url);
  searchParams.BSNS_CD = params.get('BSNS_CD');
  searchParams.DEPT_CD = params.get('DEPT_CD');
  searchParams.PROCESS = params.get('PROCESS');
  searchParams.CHG_NO = params.get('CHG_NO');
  searchParams.EMP_NO = params.get('EMP_NO');
  searchParams.CHG_NM = params.get('CHG_NM');

  // search01()

  searchTab1(); // 초기 탭은 watch를 못 타므로 수동 호출
  expansions.value[0] = [0]

  initCodeList()
})

// watch타기 전 initcodelist 탔는지 확인
const deptListReady = ref(false);
const initCodeList = () => { 
  Promise.all([
    //부서조회
    commonSearchnoAuthApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    })
  ]).then((res) => {
    codeList.deptCd = res[0].ORESULT_CUR
    deptListReady.value = true;
  })

  resetPopupState();
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

// 버튼 이벤트
const onButtonsClick = (btn) => {
  switch (btn.id) {
    case 'btnTemporaryStorage':
      handleTemporarySave();
      break;
    case 'btnFinishReview':
      handleSaveReview()
      break;
  }
};

// -------------------------------------------------- 임시저장 탭별 분리 ------------------------------------------------------
const handleTemporarySave = () => {
  if (selectedTab.value === 0) {

  } else if (selectedTab.value === 1) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('임시저장 하시겠습니까?')
      .setBefore(beforeTab2Save)
      .setQuery(saveTab2Data)
      .setAfter(afterTab2SaveData)
      .run()
  }
};

// -------------------------------------------------- 검토요청 탭별 분리 ------------------------------------------------------
const handleSaveReview = () => {
  // 탭2 저장 및 검토요청
  if (selectedTab.value === 1) {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('검토완료 하시겠습니까? 이후 수정이 불가능합니다.')
      .setBefore(beforeReview)
      .setQuery(saveReview)
      .setAfter(afterReview)
      .run()
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
const searchTab1 = () => {
  console.log("조회조건: ",searchParams)
  commonSearchnoAuthApi({ queryId: 'SPPFJ0010_SEARCH_01', param: searchParams }).then(res => { 
    if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
      const data = res.ORESULT_CUR[0];
      console.log("tab1 data:", data)
      Object.assign(tab1Params, data);

      if (data.DRAFT_YN === 'Y') {
        tabEnabled.value[1] = true;

        tab2Params.CHG_NO = data.CHG_NO
        tab2Params.CHG_DT = data.CHG_DT
      }
    }
  })
};

// 탭2(변경관리위원회 검토서) 조회
const searchTab2 = async () => {
  
  console.log("조회조건: ",searchParams)
  // 1. 항목 정보 조회
  await commonSearchnoAuthApi({ queryId: 'SPPFJ0010_SEARCH_04', param: searchParams }).then(res => {
    if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
      const data = res.ORESULT_CUR;
      console.log("tab2 data:", data)
      tab2Params.length = 0;
      tab2Params.push(...data);
    }
  });
};

const searchTab3 = () => {
  console.log('탭3 데이터 조회');
};


// -------------------------------------------------- 변경관리위원회 검토서 임시저장 --------------------------------------------------
const beforeTab2Save = () => { 
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

const saveTab2Data = async() => {
  const saveParams = tab2Params.slice(0, tab2Params.length);

  console.log(saveParams)

  await commonExecutenoAuthApi({ queryId: 'SPPFJ0010_SAVE_05', list: saveParams });
};

const afterTab2SaveData = () => {
  searchTab2()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

// -------------------------------------------------- 변경관리위원회 검토서 임시저장 --------------------------------------------------
const beforeReview = () => { 
  const requiredReviewResultParams = [
    { key: 'REVIEW_RESULT', message: '검토결과를 지정해주세요.' },
  ];

  for (const field of requiredReviewResultParams) {
    for (const arr of tab2Params) {
      if (isEmpty(arr[field.key])) {
        Message.warn(t(field.message));
        return false;
      }
    }
  }
  return true
}

const saveReview = async() => {
  const saveParams = tab2Params.slice(0, tab2Params.length);

  console.log(saveParams)

  await commonExecutenoAuthApi({ queryId: 'SPPFJ0010_SAVE_06', list: saveParams });
};

const afterReview = () => {
  searchTab2()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

// ---------------------------------------------------- 파일 업로드 ----------------------------------------------------------
let currentItem = null;

const openFileUpload = (item) => { 
  
  currentItem = item;
  console.log(currentItem);

  // 팝업 열기
  iUploadPopup.value.openPopup2(item.FILE_ID,'HHI');
}

const uploaded = (val) => { 
  if (!val.fileId || val.fileNm === '첨부(0)') return; // 파일 없는 경우 저장 안 함
  
  let saveParams = [{
    FILE_ID: val.fileId,
    BSNS_CD: currentItem?.BSNS_CD,
    DEPT_CD: currentItem?.DEPT_CD,
    PROCESS: currentItem?.PROCESS,
    CHG_NO: currentItem?.CHG_NO,
    KEY: currentItem?.KEY,
    EMP_NO: currentItem?.EMP_NO,
  }];

  commonExecutenoAuthApi({ queryId: 'SPPFJ0010_SAVE_07', list: saveParams }).then((res) => { 
    currentItem.FILE_ID = val.fileId; // 해당 행만 갱신
    currentItem = null;
  });
}

const resetPopupState = () => {
  selectedTab.value = 0
  expansions.value = [[0], [], []]
  tabEnabled.value = [true, false, false]

  Object.assign(tab1Params, initTab1)
  tab2Params.value = _.cloneDeep(initTab2.value);
}


</script>
<template>
  <div class="draggable-dialog">
    <div class="title-bar" @mousedown="startDragging">변경요소 등록</div>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IGridTitle
          :key="selectedTab"
          ref="gridTitle"
          :use-permission="false"
          :button-list="buttonList"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <v-container fluid class="fill-height" style="width:90%">
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
              <v-expansion-panels style="width:80%" v-if="selectedTab === 0" v-model="expansions[0]" multiple>
                <v-expansion-panel>
                  <v-expansion-panel-title> {{ tabs[0] }} </v-expansion-panel-title>
                  <v-expansion-panel-text class="panel-wide">
                    <div class="custom-table-wrapper">
                      <table class="custom-table">
                        <tr>
                          <th class="rotate" rowspan="10">변경 제안</th>
                        </tr>
                        <tr>
                          <th colspan="2">제안일자</th>
                          <td colspan="2">
                            <input
                              type="date"
                              v-model="tab1Params.PRO_DT"
                              style="width: 100%"
                              readonly
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
                              readonly
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
                              readonly
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
                              readonly
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
                              readonly
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
                              readonly
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="8" style="text-align: center;">변경설비명 또는 변경요소</th>
                        </tr>
                        <tr>
                          <td colspan="8" style="height:115px;" class="pa-0">
                            <v-textarea
                              v-model="tab1Params.CHG_ITEM"
                              dense
                              outlined
                              style="height: 100%; width: 100%;"
                              readonly
                            />
                          </td>
                        </tr>
                        <tr>
                          <th colspan="8">변경내용 요약</th>
                        </tr>
                        <tr>
                          <td colspan="8" style="height: 250px;" class="pa-0">
                            <v-textarea
                              v-model="tab1Params.CHG_DESC"
                              dense
                              outlined
                              rows="15"
                              style="height: 100%; width: 100%;"
                              readonly
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
                                readonly
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG2"
                                :label="$t('설비발주 시방서')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                readonly
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG3"
                                :label="$t('설비 사양서')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                readonly
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG4"
                                :label="$t('P&ID/PFD')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                readonly
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG5"
                                :label="$t('설비 배치도')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                readonly
                              />
                            </div>
                            <div class="d-flex mt-2 justify-space-between">
                              <v-checkbox
                                v-model="tab1Params.CHG6"
                                :label="$t('위험성평가서')"
                                true-value="Y"
                                false-value="N"
                                class="ml-3 mr-3"
                                readonly
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG7"
                                :label="$t('공사.작업 계획서')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                readonly
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG8"
                                :label="$t('운전절차서/메뉴얼(기존설비)')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                readonly
                              />
                              <v-checkbox
                                v-model="tab1Params.CHG9"
                                :label="$t('기타 참고자료')"
                                true-value="Y"
                                false-value="N"
                                class="mr-3"
                                readonly
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
                              :disabled="emergencyReadOnly"
                              readonly
                            />
                          </td>
                          <th colspan="1" class="th2">변경시 예정일시</th>
                          <td colspan="3">
                            <div class="d-flex">
                              <input
                                type="date"
                                v-model="tab1Params.ECHG_DT"
                                style="width: 50%"
                                :disabled="emergencyReadOnly"
                                readonly
                              />
                              <input
                                type="time"
                                v-model="tab1Params.ECHG_TIME"
                                style="width: 50%"
                                class="ml-2"
                                :disabled="emergencyReadOnly"
                                readonly
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
                              :disabled="emergencyReadOnly"
                              readonly
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
                              readonly
                            />
                          </td>
                          <td colspan="2" style="height: 35px;" class="pa-0">
                            <v-textarea
                              v-model="tab1Params.EQUIP_CMT"
                              dense
                              outlined
                              rows="1"
                              style="height: 100%; width: 100%;"
                              :disabled="emergencyReadOnly"
                              readonly
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
                              readonly
                            />
                          </td>
                          <td colspan="2" style="height: 35px;" class="pa-0">
                            <v-textarea
                              v-model="tab1Params.SAFE_CMT"
                              dense
                              outlined
                              rows="1"
                              style="height: 100%; width: 100%;"
                              :disabled="emergencyReadOnly"
                              readonly
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
              <v-expansion-panels style="width:80%" v-if="selectedTab === 1" v-model="expansions[1]" multiple>
                <v-expansion-panel>
                  <v-expansion-panel-title> {{ tabs[1] }} </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="custom-table-wrapper">
                      <table class="custom-table">
                        <!-- 1행 -->
                        <tr>
                          <th colspan="3">변경관리 접수번호</th>
                          <td colspan="3">
                            <input
                              type="text"
                              v-model="searchParams.CHG_NM"
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
                          <th colspan="12">1. 변경 검토(변경관리위원회)</th>
                        </tr>

                        <!-- 3행: 헤더 -->
                        <tr style="background-color: #f0f8ff;">
                          <th :rowspan="tab2Params.length + 2" class="rotate">검토사항</th>
                        </tr>
                        <tr style="background-color: #f0f8ff;">
                          <th colspan="2">검토항목</th>
                          <th colspan="2">검토여부</th>
                          <th colspan="3">검토내용 및 의견</th>
                          <th colspan="2">검토결과</th>
                          <th colspan="2">검토자</th>
                        </tr>

                        <tr v-for="item in tab2Params" :key="item.KEY">
                          <td colspan="2" style="text-align: center; font-weight: bold;">{{ getReviewItemText(item.KEY) }}</td>
                          <td colspan="2" class="pa-1">
                            <i-select
                              v-model="item.REVIEW_YN"
                              :items="codeList.REVIEW_YN"
                              item-value="COD"
                              item-title="TXT"
                              width="152px"
                              margin="5px"
                              class="i-select-icon2"
                              readonly
                            />
                          </td>
                          <td colspan="3" style="text-align: left;" class="pa-0">
                            <div class="d-flex" style="width: 100%">
                              <v-textarea
                                v-model="item.REVIEW_DESC"
                                dense
                                outlined
                                rows="3"
                                style="height: 100%; width: 80%;"
                              />
                              <div
                                  style="width: 20%"
                                  class="d-flex align-center justify-left"
                                >
                                <v-btn
                                  :color="item.FILE_ID ? 'green' : 'primary'"
                                  @click="openFileUpload(item)"
                                  style="width: 40px; height: 40px; display: flex; flex-direction: column; justify-content: center; line-height: 1.1;"
                                >
                                  <span v-if="item.FILE_ID">
                                    첨부<br>완료
                                  </span>
                                  <span v-else>
                                    첨부
                                  </span>
                                </v-btn>
                              </div>
                            </div>
                          </td>
                          <td colspan="2" class="pa-1">
                            <i-select
                              v-model="item.REVIEW_RESULT"
                              :items="codeList.REVIEW_RESULT"
                              item-value="COD"
                              item-title="TXT"
                              class="i-select-icon2"
                              width="100%"
                            />
                          </td>
                          <td colspan="2">
                            <input
                              type="text"
                              v-model="item.EMP_NM"
                              readonly
                              style="width: 100%"
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
  </div>
  <!-- 부서 팝업 -->
  <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
  <EmpPopup ref="empPopup" @selected="onEmpSelected" />
  <IUploadPopup ref="iUploadPopup" @uploaded="uploaded"/>
</template>
<style scoped>
.page-wrapper {
  width: 1300px;
  height: 800px;
  margin: 0 auto; /* 가운데 정렬 */
}

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

<route lang="yaml">
  meta: { noAuth: true }
</route>