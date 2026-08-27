<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import HLTIA0010Popup02 from './HLTIA0010Popup02.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' // 결재팝업
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { isEmpty } from '@/@core/utils'


defineOptions({
  name:'100_health-HLT_I-HLTIA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const menuTitle2 = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const deptPopup = ref(null)
const userId = ref(userStore.userId)
// const userId2 = ref('A341533')
// const grdSubVisible = ref(false)
// const grdMainVisible = ref(false)
const tab = ref('tab1')
const selectedRowIndex = ref(null)
const Popup = ref(null)
const Popup2 = ref(null)
const Popup3 = ref(null)
const selectedRow = ref([])
const approvalPopup = ref(null) // 결재
const isAdmin = ref(false)
const isRes = ref(false)
let upDa = ref([])
// const emits = defineEmits(['approvalAppkey'])
// 부서장, 직책과장
const noGRP = ref(false);
// 조직원
const noGRP2 = ref(false);
let mess = false;

// 부서장, 직책과장 여부 테스트 ( 맞으면 사업부, 부서 disable )
// userStore.authGrpCd = ['GRP00372'];
// admin그룹 테스트
// userStore.authGrpCd = ['HIWAYGRP00001'];


//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서,협력사
  BSNS_NM: '',
  PARTNER_CD: '' // 협력사 코드
  // ASGN_NM: '',
  //


  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  // ASGN_CD: true? userStore.deptCd : userStore.asgnCd,
  // ASGN_NM: true? userStore.deptNm : userStore.deptNm,
  // YEAR: dayjs().get("year"),
})
// let STATUS = ref('')

//grdMain
const searchParams2 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',//searchParams.BSNS_CD, //사업부
  DEPT_CD: '',//searchParams.DEPT_CD, //부서,협력사
  BSNS_NM: '',//searchParams.BSNS_NM,
  DEPT_NM: '',//searchParams.DEPT_NM,
  ASGN_CD: '',
  ASGN_FULL_NM: ''
})

// 조직원 
const searchParams4 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv
})

// 결재데이터
const searchParams3 = reactive({
  groupedData: {}
})

const codeList = reactive({
  BSNS: [], //사업부
  DEPT: [], //부서/협력사
  DIV_CD: [],
  DATA2: [],
  STATUS: [],
  PARTNER_CD: []
  // DIV_CD: [{TXT:'부서장',COD:'1'},{TXT:'간사(정)',COD:'2'},{TXT:'간사(부)',COD:'3'},{TXT:'대의원',COD:'4'},{TXT:'대의원 추천인',COD:'5'},{TXT:'추진위원',COD:'6'}]
    
  
})

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: searchParams2.BSNS_CD,
  DEPT_CD: searchParams2.DEPT_CD,
  // DEPT_NM: '',
  DIV_CD: '',
  EMP_NO: '',
  // JOB_TIT_NM: '',
  TEL_NO: '',
  // ORG_DT: '',
  USER_ID: userStore.userId,
  COOR_YN: '',
  ASGN_CD: '',
  // ASGN_FULL_NM: ''
})

const states = reactive({
  ASGN_CD: "" 
})

const message = ref('');

// 1. 초기 실행 시 사업부 리스트 가져옴
const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y' },
    }),
    getCodeList('HHII611'),
    //간사현황 조직원
    commonSearchApi({ queryId : 'HLTIA0010_SEARCH_02', param: searchParams4 }),
    //결재 진행상태
    getCodeList('HHIZ030')
  ])
  .then((res) => {
    // debugger
    // console.log("res", res);
    codeList.BSNS = res[0].ORESULT_CUR
    codeList.DEPT = res[1].ORESULT_CUR
    codeList.DIV_CD = res[2].ORESULT_CUR
    codeList.DATA2 = res[3].ORESULT_CUR
    codeList.STATUS = res[4].ORESULT_CUR
    codeList.BSNS.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    grdMain.value.setBindingColumn('DIV_CD', codeList.DIV_CD, 'COD', 'TXT')
    grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
    codeList.PARTNER_CD.unshift({ ASGN_NM:"전체", ASGN_CD:"1" })
    codeList.PARTNER_CD.unshift({ ASGN_NM:"선택안함", ASGN_CD:"" })

    // 근골격계질환 예방 모듈 관리자 여부 확인 ( 모듈관리자, admin그룹, 보건총괄관리자 ) 
    if (userStore.authGrpCd.includes('HLTI001') 
        || userStore.authGrpCd.includes('HIWAYGRP00001')
        || userStore.authGrpCd.includes('GRP00372')
        ) {
        isAdmin.value = true // 관리자
        // console.log("isAdmin.value", true)
    } else {
        isAdmin.value = false // 일반 사용자
        // console.log("isAdmin.value", false)
    }
    
    // console.log("isAdmin.value", isAdmin.value)
    // // 조직원 확인
    // const matchedRow = codeList.DATA2.find(
    //   row => row.EMP_NO === userStore.userId
    // );

    // // DIV_CD가 0,1,2인 부서장, 간사 정/부 확인
    // if (matchedRow && ['0', '1', '2'].some(code => code === matchedRow.DIV_CD)) {
    //   noGRP.value = true
    // } else {
    //   noGRP.value = false
    // }
    // // console.log('noGRP', noGRP.value)
    // // console.log("userStore.bsnsCd", userStore.bsnsCd)
    // // console.log("userStore.deptCd", userStore.deptCd)
    // // 부서장, 간사 정/부일 때 사업부, 부서 가져오기
    // if (noGRP.value) {
    //   // 테스트
    //   // searchParams.BSNS_CD = 'AC00';
    //   // searchParams.DEPT_CD = 'C620';
    //   searchParams.BSNS_CD = userStore.bsnsCd;
    //   searchParams.DEPT_CD = userStore.deptCd;
    // }


  //   // 조직원 확인
  //   // 찾았으면 사업부/부서 자동 세팅
  //   // &&는 matchedRow가 있을때만 실행하기 위해
  //   if (matchedRow && ['3', '5'].includes(matchedRow.DIV_CD)) {
  //     searchParams.BSNS_CD = matchedRow.BSNS_CD;
  //     searchParams.DEPT_CD = matchedRow.DEPT_CD;
  //     noGRP2.value = true;
  //   }else {
  //   noGRP2.value = false;

  //   // 관리자, 부서장/간사정,부, 조직원 아닐때 경고 띄움
  //   if (!isAdmin.value && !noGRP.value && !noGRP2.value) {
  //     vm.$swal({
  //       title: t(`조직원이 아닙니다.\n안전보건지원부 담당자에게 문의하십시오.`),
  //       showCancelButton: false,
  //     });
  //   }
  // }
  // console.log("noGRP2", noGRP2.value)
  // if (isAdmin.value && noGRP.value) {
  //     // 관리자면서 부서장
  //     searchParams.BSNS_CD = ''
  //     searchParams.DEPT_CD = ''
  //     menuTitle.value.setBtnProperty('btnSearch', 'visible', true);
  //     menuTitle.value.setBtnProperty('btnOrgPrint', 'visible', true);
  //     menuTitle.value.setBtnProperty('btnReqApply', 'visible', true);
  //     menuTitle2.value.setBtnProperty('btnCreate', 'visible', true);
  //     menuTitle2.value.setBtnProperty('btnUpdate', 'visible', true);
  //     menuTitle2.value.setBtnProperty('btnDelete', 'visible', true);
  //   } else if (isAdmin.value && noGRP2.value) {
  //     // 관리자면서 조직원
  //     searchParams.BSNS_CD = ''
  //     searchParams.DEPT_CD = ''
  //     menuTitle.value.setBtnProperty('btnSearch', 'visible', true);
  //     menuTitle.value.setBtnProperty('btnOrgPrint', 'visible', true);
  //     menuTitle.value.setBtnProperty('btnReqApply', 'visible', true);
  //     menuTitle2.value.setBtnProperty('btnCreate', 'visible', true);
  //     menuTitle2.value.setBtnProperty('btnUpdate', 'visible', true);
  //     menuTitle2.value.setBtnProperty('btnDelete', 'visible', true);
  //   }
  //   else if (noGRP.value && noGRP2.value) {
  //     // 부서장이면서 조직원
  //     menuTitle.value.setBtnProperty('btnSearch', 'visible', true);
  //     menuTitle.value.setBtnProperty('btnOrgPrint', 'visible', true);
  //     menuTitle.value.setBtnProperty('btnReqApply', 'visible', true);
  //     menuTitle2.value.setBtnProperty('btnCreate', 'visible', true);
  //     // menuTitle2.value.disableBtn('btnCreate', true);
  //     menuTitle2.value.setBtnProperty('btnUpdate', 'visible', true);
  //     menuTitle2.value.setBtnProperty('btnDelete', 'visible', true);
  //   }
  //  else if (!isAdmin.value && !noGRP.value && noGRP2.value) {
  //   // 조직원이긴 한데 관리자, 부서장 아님 → 조회 버튼만 살림
  //   menuTitle.value.setBtnProperty('btnSearch', 'visible', true);
  //   menuTitle.value.setBtnProperty('btnOrgPrint', 'visible', true);
  //   menuTitle.value.setBtnProperty('btnReqApply', 'visible', false);
  //   menuTitle2.value.setBtnProperty('btnCreate', 'visible', false);
  //   menuTitle2.value.setBtnProperty('btnUpdate', 'visible', false);
  //   menuTitle2.value.setBtnProperty('btnDelete', 'visible', false);
  // }else if ((isAdmin.value || noGRP.value) && noGRP2.value) {
  //   // 관리자거나 부서장인데 조직원일때
  //   // 조직원인데 관리자 or 부서장일때
  //   menuTitle.value.setBtnProperty('btnSearch', 'visible', true);
  //   menuTitle.value.setBtnProperty('btnOrgPrint', 'visible', true);
  //   menuTitle.value.setBtnProperty('btnReqApply', 'visible', true);
  //   menuTitle2.value.setBtnProperty('btnCreate', 'visible', true);
  //   menuTitle2.value.setBtnProperty('btnUpdate', 'visible', true);
  //   menuTitle2.value.setBtnProperty('btnDelete', 'visible', true);
  // } else if (!noGRP2.value && !isAdmin.value && !noGRP.value) {
  //   // 조직원, 관리자, 부서장 아니라면 모든 버튼 불가
  //   menuTitle.value.setBtnProperty('btnSearch', 'visible', false);
  //   menuTitle.value.setBtnProperty('btnOrgPrint', 'visible', false);
  //   menuTitle.value.setBtnProperty('btnReqApply', 'visible', false);
  //   menuTitle2.value.setBtnProperty('btnCreate', 'visible', false);
  //   menuTitle2.value.setBtnProperty('btnUpdate', 'visible', false);
  //   menuTitle2.value.setBtnProperty('btnDelete', 'visible', false);
  // }

  if (isAdmin.value) {
      searchParams.BSNS_CD = ''
      searchParams.DEPT_CD = ''
      searchParams.PARTNER_CD = ''
  }else {
    searchParams.BSNS_CD = userStore.bsnsCd
    searchParams.DEPT_CD = userStore.deptCd
    searchParams.PARTNER_CD = userStore.asgnCd
  }

  })
}

//사업부 변경시 부서 조회
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    // 관리자가 아니면서 부서장/간사정,부, 조직원일 경우 조회 안함
    // if ((noGRP.value || noGRP2.value) && !isAdmin.value) return;
    if (!isAdmin.value) return;
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParams.DEPT_CD = ''
      codeList.DEPT = res.ORESULT_CUR
      codeList.DEPT.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)

// 부서가 바뀌면 협력사 데이터 가져옴
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    // 관리자가 아니면서 부서장/간사정,부, 조직원일 경우 조회 안함
    // if ((noGRP.value || noGRP2.value) && !isAdmin.value) return;
    // if (!isAdmin.value) return;
    //부서조회
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: newValue },
    }).then((res) => {
      searchParams.PARTNER_CD = ''
      codeList.PARTNER_CD = res.ORESULT_CUR
      codeList.PARTNER_CD.unshift({ ASGN_NM:"전체", ASGN_CD:"1" })
      codeList.PARTNER_CD.unshift({ ASGN_NM:"선택안함", ASGN_CD:"" })

      // if (isAdmin.value) {
      // searchParams.BSNS_CD = ''
      // searchParams.DEPT_CD = ''
      // searchParams.PARTNER_CD = ''
      // }else 
      if (!isAdmin.value) {
        searchParams.BSNS_CD = userStore.bsnsCd
        searchParams.DEPT_CD = userStore.deptCd
        // searchParams.PARTNER_CD = userStore.asgnCd
        // console.log("userStore.asgnCd", userStore.asgnCd)
        // console.log("userStore.asgnCd2", res.ORESULT_CUR)

        const exists = res.ORESULT_CUR.some(item => item.ASGN_CD === userStore.asgnCd);

        searchParams.PARTNER_CD = exists ? userStore.asgnCd : '';
      }
    })
  }
)

// watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
//   if(isMounted.value) {
//     commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: newValue } })
//       .then(res => {
//         codeList.PARTNER_CD = res.ORESULT_CUR
//         codeList.PARTNER_CD.unshift({ ASGN_NM:"선택안함", ASGN_CD:"" })
//         if (codeList.PARTNER_CD.length !== 0) {
//           searchParams.PARTNER_CD = ''
//         }
//       })
//   }
// })

// 3. 페이지가 처음 로드될 때 실행
onMounted(() => {
    initCodeList()

    // 체크박스 disabled 인데
    const f = function (dataSource, item) {
    const rowIndex = item.dataRow;
    const boss = dataSource.getValue(rowIndex, 'BOSS');
    const divCd = dataSource.getValue(rowIndex, 'DIV_CD');

    // BOSS === 'Y' && DIV_CD === '0'이면 체크바 비활성
    return !(boss === 'Y' && divCd === '부서장');
  };

  grdMain.value.getGridView().setCheckBar({
  checkableCallback: f,
});

    // console.log("authGrpCd", userStore.authGrpCd)

    // 버튼별 관리자, 부서장, 직책과장 확인 ( 관리자, 부서장, 직책과장이 아니면 버튼 안보임 )
    // if (!isAdmin.value && !noGRP.value) {
    // menuTitle.value.setBtnProperty('btnSearch', 'visible', false);
    // menuTitle.value.setBtnProperty('btnOrgPrint', 'visible', false);
    // menuTitle.value.setBtnProperty('btnReqApply', 'visible', false);
    // menuTitle2.value.setBtnProperty('btnCreate', 'visible', false);
    // menuTitle2.value.setBtnProperty('btnUpdate', 'visible', false);
    // menuTitle2.value.setBtnProperty('btnDelete', 'visible', false);
    // }
})

//상단 버튼 클릭 시
const onButtonsClick1 = (btn) => {
  if (btn.id === "btnSearch") {
    //console.log("searchParams:", JSON.stringify(searchParams))
    // grdSub를 보이게 설정
    // grdSubVisible.value = true
    grdMain.value.getDataProvider().clearRows()  // 기존 데이터 제거
    grdMain.value.getGridView().refresh()

    grdSub.value.getGridView().filterPanel.visible = true
    new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData01)
    .setAfter(afterSearch01)
    .run()
  } else if (btn.id === "btnOrgPrint"){
    if(!searchParams2.BSNS_CD || !searchParams2.DEPT_CD){
      Message.warn("부서를 조회해주세요")
    }

    const allData = grdMain.value.getDataProvider().getJsonRows();
    if(!allData || allData.length === 0) {
      Message.warn("조회된 데이터가 없습니다.")
    } else {
      Popup2.value.openPopup2(allData)
    }

    // const orgData = grdMain.value.getDataProvider().getRows()
    // // console.log("orgData", orgData)
    // if(!orgData || orgData.length === 0) {
    //   Message.warn("조회된 데이터가 없습니다.")
    // } else {
    //   Popup2.value.openPopup2(searchParams2.BSNS_CD, searchParams2.DEPT_CD, searchParams2.ASGN_CD, searchParams2.ASGN_FULL_NM)
    // }

  } else if (btn.id === "btnReqApply") {
    // Popup3.value.openPopup3(searchParams2.BSNS_CD, searchParams2.DEPT_CD)
    setApply()
  }
}

const onButtonsClick2 = (btn) => { 
  if (btn.id === "btnCreate") {

    // 부서 선택 안하면 메세지
    // || !searchParams2.ASGN_CD
    if (!searchParams2.BSNS_CD || !searchParams2.DEPT_CD ) {
    Message.warn('사업부와 부서를 선택하세요.');
    return;
    }

    
    // console.log("넘기는데이터", searchParams2)
      Popup.value.openPopup({ 
        CMPNY_DIV: searchParams2.CMPNY_DIV,
        BSNS_CD: searchParams2.BSNS_CD,
        DEPT_CD: searchParams2.DEPT_CD,
        ASGN_CD: searchParams.PARTNER_CD === '' ? '' : searchParams2.ASGN_CD,
        // BSNS_NM: searchParams2.BSNS_NM,
        // DEPT_NM: searchParams2.DEPT_NM,
        MULTI: true,
        CMPNY_DIV_D: false, // 회사구분
        USER_DIV_D: false, // 직영, 사내협력사
        BSNS_CD_D: false, // 사업부
        DEPT_CD_D: false, // 부서
        USER_DIV: !searchParams.PARTNER_CD || searchParams.PARTNER_CD === '' ? 'A' : 'B' // 직영 'A'(선택안함), 협력사 'B'
       })  // ref가 존재할 때만 실행
    
  } else if (btn.id === "btnUpdate") { 

    // 부서 선택 안하면 메세지
    if(grdMain.value.getDataProvider().getRows().length === 0) {
      Message.warn('인원을 추가하세요')
      return;
    }

    // 조건 분기해서 저장 메세지 따로 띄우기
    let chekedRows = ref([])
    chekedRows = grdMain.value.getGridView().getCheckedRows() 
    const hasApp = chekedRows.some(rowIndex => {
    const rowData = grdMain.value.getDataProvider().getJsonRow(rowIndex);
    return ((rowData.ORG_DT || '').trim() !== '');
    });

    let mess = '';
    // console.log("searchParams.PARTNER_CD", searchParams.PARTNER_CD)
    if (searchParams.PARTNER_CD) {
      mess = '저장하시겠습니까?';  // 협력사는 그냥 저장 메시지
    } else {
      mess = hasApp
      ? '결재완료된 인원을 수정하면, 결재를 다시 진행해야 합니다.'
      : '저장 하시겠습니까?';
    }

/*     const mess = hasApp
    ? '결재완료된 인원을 수정하면, 결재를 다시 진행해야 합니다.'
    : '저장 하시겠습니까?'; */


    new saveFlowHelper(vm, t)
    .setConfirmMessage(mess)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(()=>{
      searchData02(searchParams2.BSNS_CD, searchParams2.DEPT_CD, searchParams2.ASGN_CD, searchParams2.ASGN_FULL_NM)
      // .then(afterSearch02)
    })
    .run() 
    // selectRowData()
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(afterDelete)
    .run()
  }
}

const onCellDblClicked = (grid, clickData) => {
  if (!clickData || clickData.dataRow === -1) return
  grdMain.value.getGridView().setVisible(true)

  // 더블 클릭한 행의 데이터 가져오기
  let data = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)
  // console.log("클릭한 데이터:", data)

  if (data) {
    // 검색 조건 업데이트
    searchParams2.BSNS_CD = data.BSNS_CD
    searchParams2.DEPT_CD = data.DEPT_CD
    searchParams2.BSNS_NM = data.BSNS_NM
    searchParams2.DEPT_NM = data.DEPT_NM
    searchParams2.ASGN_CD = data.ASGN_CD
    searchParams2.ASGN_FULL_NM = data.ASGN_FULL_NM

      // 검색 함수 실행 (검색 API 실행 전 데이터 확인)
      // console.log("검색 API 실행:", data.BSNS_CD, data.DEPT_CD)

    // grdMainVisible.value = true
    // RealGrid 필터 패널 활성화
    grdMain.value.getGridView().filterPanel.visible = true
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(() => searchData02(data.BSNS_CD, data.DEPT_CD, data.ASGN_CD, data.ASGN_FULL_NM)) // 함수 형태로 전달
      .setAfter(afterSearch02) // 검색 결과를 적용하는 함수 지정
      .run()

  }
  }
  watchEffect(() => {
  saveParams.BSNS_CD = searchParams2.BSNS_CD
  saveParams.DEPT_CD = searchParams2.DEPT_CD
})

  //grdMain 데이터 클릭
  const onCellClicked = async (grid, clickData) => {
    const rowIndex = clickData.dataRow;
    if (rowIndex == null || rowIndex < 0) return;
    selectedRowIndex.value = rowIndex // 선택된 행 저장
    selectedRow.value = grdMain.value.getDataProvider().getJsonRow(rowIndex)
    // checkedData = grdMain.value.getGridView().getCheckedRows(true)
    // console.log("선택 행데이터 1 : ", selectedRowIndex.value)
    // console.log(" 선택한 행 데이터:", selectedRow.value)
  }

  const formatDateYYYYMMDD = (dateString) => {
  if (!dateString) return "" // 값이 없으면 빈 문자열 반환

    // YY/MM/DD 형식인지 확인 (정규식)
    const yyMmDdRegex = /^\d{2}\/\d{2}\/\d{2}$/
  if (yyMmDdRegex.test(dateString)) {
    // YY/MM/DD 형식이면 직접 파싱
    const [yy, mm, dd] = dateString.split("/")

    // 2000년대 기준으로 변환 (00~99 -> 2000~2099)
    const year = parseInt(yy, 10) >= 50 ? `19${yy}` : `20${yy}`

    return `${year}${mm}${dd}` // YYYYMMDD 형식으로 반환
  }

  // 날짜 변환 시도
  const dateObj = new Date(dateString)
  if (isNaN(dateObj)) return "" // 유효한 날짜가 아니면 빈 문자열 반환

  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, "0") // 월 (0부터 시작하므로 +1)
  const day = String(dateObj.getDate()).padStart(2, "0") // 일

  return `${year}${month}${day}` // YYYYMMDD 형식으로 반환
}

/* -------------- 조회 -------------- */
// grdSub 그리드
const searchData01 = () => {
  // console.log(" API 요청 데이터:", JSON.stringify(searchParams))
  return commonSearchApi({ queryId : 'HLTIA0010_SEARCH_01', param: searchParams })
}

// grdMain 그리드
const searchData02 = async (bsnsCd, deptCd, asgnCd, fullNm) => {
  const res1 = await commonSearchApi({ 
    queryId: 'HLTIA0010_SEARCH_02', 
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: bsnsCd,
      DEPT_CD: deptCd,
      ASGN_CD: asgnCd
    }
  });

  // res1.forEach(row => {
  //   row.DEPT_NM = fullNm;
  // });

  const res2 = await commonSearchApi({
    queryId: 'HLTIA0010_SEARCH_04',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: bsnsCd,
      DEPT_CD: deptCd,
      ASGN_CD: asgnCd,
      USER_DIV: 'A',
    }
  });
  // console.log("full", fullNm)

  afterSearch02(res1, res2, fullNm);
}

const afterSearch01 = res => {
  // console.log("1111", res)
  // console.log("searchParams.PARTNER_CD", searchParams.PARTNER_CD)
  // // 협력사로 조회됐을땐 결재상신 비활성화
  // // 직영일때만 결재상신 버튼 활성화
  // if(searchParams.PARTNER_CD) {
  //   menuTitle.value.setBtnProperty('btnReqApply', 'visible', false);
  // }else{
  //   menuTitle.value.setBtnProperty('btnReqApply', 'visible', true);
  // }

  // 서치파람2 초기화
  Object.assign(searchParams2, {
  BSNS_CD: '',
  DEPT_CD: '',
  BSNS_NM: '',
  DEPT_NM: '',
  ASGN_CD: '',
  ASGN_FULL_NM: ''
});

    // 데이터에 BSNS_NM 추가 (전체 리스트와 매칭)
    res.ORESULT_CUR = res.ORESULT_CUR
    // .sort((a, b) => a.BSNS_CD.localeCompare(b.BSNS_CD))
    .map(item => {
    return {
      ...item,
      BSNS_NM: codeList.BSNS.find(e => e.BSNS_CD === item.BSNS_CD)?.BSNS_NM || "",
    }
  })
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const afterSearch02 = (res1, res2, fullNm) => {
  // console.log("1", res1.ORESULT_CUR)
  // console.log("2", res2.ORESULT_CUR)

  //  개별 EMP_NO로 ASGN_CD 조회하여 데이터에 반영
  const updatedData1 = res1.ORESULT_CUR.map(item => {
    item.ORG_DT = item.ORG_DT
      ? formatYYYYMMDDD(item.ORG_DT) // YYYYMMDD → YYYY-MM-DD 변환
      : ""

    item.DEPT_NM = fullNm
    // console.log("dept", item.DEPT_NM)
    // console.log("dept", fullNm)
    return item
  })

  const updatedData2 = res2.ORESULT_CUR.map(item => {
    return {
      ...item,
      DIV_CD: '부서장',
      DEPT_NM: item.ASGN_FULL_NM,
      EMP_NM: item.KOR_NM,
      BOSS: 'Y',
      checkblock: true
    };
  });

  const mergedData = [...updatedData1, ...updatedData2];
  mergedData.sort((a, b) => {
  const isADirector = a.DIV_CD === '부서장';
  const isBDirector = b.DIV_CD === '부서장';

  if (isADirector && !isBDirector) return -1;
  if (!isADirector && isBDirector) return 1;

  const aDiv = Number(a.DIV_CD);
  const bDiv = Number(b.DIV_CD);

  return aDiv - bDiv;
  // const aDiv = a.DIV_CD;
  // const bDiv = b.DIV_CD;

  // if (aDiv === 0 && bDiv !== 0) return -1;
  // if (aDiv !== 0 && bDiv === 0) return 1;
  // return aDiv - bDiv;
});

  upDa.value = []  // 기존 데이터 초기화
  mergedData.forEach(item => upDa.value.push(item))
  grdMain.value.getDataProvider().setRows(upDa.value)

  // 행마다 색깔 바꾸기
  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
  let ret = { }
  let DIV_CD = grid.getValue(item.index, 'DIV_CD')
  let BOSS = grid.getValue(item.index, 'BOSS')
  if(DIV_CD === '부서장' && BOSS === 'Y'){
    ret.style ={ background: '#D6EBFF' } 
    ret.editable= false
  }
  return ret
  })

  // const f = function (dataSource, item) {
  //   const rowIndex = item.dataRow;
  //   const boss = dataSource.getValue(rowIndex, 'BOSS');
  //   const divCd = dataSource.getValue(rowIndex, 'DIV_CD');

  //   // BOSS === 'Y' && DIV_CD === '0'이면 체크바 비활성
  //   return !(boss === 'Y' && divCd === '0');
  // };

  // grdMain.value.getGridView().setCheckBar({
  //   checkableCallback: f
  // });

  // 부서장 행 개별체크 막기
//   grdMain.value.getGridView().onItemChecked = (grid, itemIndex, checked) => { 
//   const ds = grdMain.value.getDataProvider();
//   const flag = ds.getValue(itemIndex, 'checkblock');
//   // console.log("111 : ", flag)
//   if (flag) {
//     grid.checkRow(itemIndex, false); // 강제로 해제
//   }
// }
 
//   // 전체 체크박스 선택 시 부서장 체크 막기
//   grdMain.value.getGridView().onItemAllChecked = (grid, checked) => {
//   const ds = grdMain.value.getDataProvider();
//   const rowCount = ds.getRowCount();

//   for (let i = 0; i < rowCount; i++) {
//     const flag = String(ds.getValue(i, 'checkblock'));
//     if (flag === 'true') {
//       grid.checkRow(i, false); // 강제로 해제
//     }
//   }
// }
}

// 저장
const existingData = computed(() => upDa.value || [])
  //grdMain 데이터 저장
  const beforeSave = async () => {
    // debugger
  let chekedRow = ref([])
  // let bCheck = true
  chekedRow = grdMain.value.getGridView().getCheckedRows() 

  const hasCd = chekedRow.some(rowIndex => {
    const rowData = grdMain.value.getDataProvider().getJsonRow(rowIndex);
    return !rowData.DIV_CD || rowData.DIV_CD.trim() === '';
  });

  if (hasCd) {
    Message.warn('선택된 행 중에 구분이 없는 항목이 있습니다.');
    return;
  }

  //grdMain 전체데이터
  const allRows = grdMain.value.getDataProvider().getJsonRows();
  // console.log("allRows", allRows)


  // 체크된 행 중에 결재완료가 있는지 확인
  // const hasApp = 
  chekedRow.some(rowIndex => {
  const rowData = grdMain.value.getDataProvider().getJsonRow(rowIndex);
  // 기존 데이터, 새로 넣은 데이터 둘다 지정일이 있으면 결재가 된 데이터기 때문에
  // 지정일이 있으면 결재를 다시 진행해야 합니다 라는 메세지 띄움
  return ((rowData.ORG_DT || '').trim() !== '');
  // return rowData.STATUS === 'Y';
  });
  // console.log("hasApp", hasApp)
  // mess = hasApp

  if(isEmpty(chekedRow)){
    Message.warn('저장할 데이터를 선택해주세요') 
    return;
  }

  // if(hasApp === true) {
  //   Message.warn('결재완료된 인원을 수정하면, 결재를 다시 진행해야 합니다.') 
  // }

  // const confirmMsg = hasApp
  //   ? `저장 하시겠습니까?\n결재완료된 인원을 수정하면, 결재를 다시 진행해야 합니다.`
  //   : `저장 하시겠습니까?`
  //   const result = await vm.$swal({
  //   title: confirmMsg,
  //   showCancelButton: true,
  //   confirmButtonText: '예',
  //   cancelButtonText: '아니요'
  // });

  // if(confirmMsg) {
  //   return result.isConfirmed
  // }


  // 중복 검증 시작
  // allRows 복사
  const mergedRows = [...allRows];

  // 수정된 row를 allRows에 반영
  chekedRow.forEach(rowIndex => {
    const updatedRow = grdMain.value.getDataProvider().getJsonRow(rowIndex);
    // console.log("업데이트된 행:", updatedRow);
    mergedRows[rowIndex] = updatedRow; // A에 B를 반영
    // console.log("반영된 전체 데이터:", mergedRows);
  });
  
  // 개수 카운팅
  const roleCount = {};
  const Allow = '5';

  mergedRows.forEach(row => {
    const divCd = row.DIV_CD;

    // 추진위원은 중복 허용 + 카운트 제외
    if (divCd !== Allow) {
      roleCount[divCd] = (roleCount[divCd] || 0) + 1;
    }
  });

  // 2개 이상인 항목만 필터링
  const duplic = Object.entries(roleCount).filter(([_, count]) => count > 1);

  // 중복된 항목이 하나라도 있으면 메세지 출력 후 저장 중단
  if (duplic.length > 0) { 
    duplic.map(([code]) => code).join(', ');
    Message.warn(`구분은 중복될 수 없습니다(추진위원 제외)`);
    return;
  }

  // 저장 파라미터
  saveParams.value = [] 
  let data = ref([])

  // 협력사 구분자
  let asgnFlag = ''

  if(searchParams.PARTNER_CD){
    asgnFlag = 'Y'
  }

  // console.log("asgnFlag", asgnFlag)
  
  chekedRow.forEach(val => {
    data = grdMain.value.getDataProvider().getJsonRow(val)
    data.CMPNY_DIV = userStore.cmpnyDiv

    if (asgnFlag === 'Y') {
    data.IS_ASGN = 'Y'
    }

    saveParams.value.push(data)
  })
  // console.log("저장 파라메트", saveParams.value)
  return true
}

const saveData = () => {
  // const payload = { ...saveParams.value }

  // console.log("최종 저장 데이터:", saveParams.value)
  return commonExecuteApi({ queryId: 'HLTIA0010_SAVE_02', list: saveParams.value })
}

// 삭제
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

const deleteData = () => {
  let deleteParams = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  checkedData.forEach(val => {
    let rowData = grdMain.value.getDataProvider().getJsonRow(val) //  체크된 행 데이터 가져오기
    deleteParams.push({
      CMPNY_DIV: userStore.cmpnyDiv,
      DEPT_CD: searchParams2.DEPT_CD,
      EMP_NO: rowData.EMP_NO,
      USER_ID: userStore.userId
    })
  })
  return commonExecuteApi({ queryId: "HLTIA0010_DELETE_02", list: deleteParams })
}

const afterDelete = () => {
  // Message.success(t('성공적으로 삭제되었습니다'))

  //삭제 후 조회
  searchData02(searchParams2.BSNS_CD, searchParams2.DEPT_CD, searchParams2.ASGN_CD, searchParams2.ASGN_FULL_NM)
      // .then(afterSearch02)
}

function formatYYYYMMDDD(dateString) {
    if (!dateString || dateString.length !== 8) return dateString
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`
  }


// 인원검색 후 데이터 추가
const addToMainGrid = async (selectedData) => {
  // console.log("데이터:", selectedData)

  const today = new Date().toISOString().split('T')[0]

  // DEPT_CD(부서 코드)로 DEPT_NM(부서명) 찾기
  // const deptInfo = codeList.DEPT.find(dept => dept.DEPT_CD === selectedData.DEPT_CD)
  // const deptName = deptInfo ? deptInfo.DEPT_NM : "부서 없음" // 만약 코드가 없으면 기본값 설정

  const dataProvider = grdMain.value.getDataProvider()
  const existingRows = dataProvider.getJsonRows()

  const dataList = Array.isArray(selectedData) ? selectedData : [selectedData]
  // console.log("팝업에서받은데이터 : ", dataList)

  dataList.forEach((data) => {
    // 부서 코드로 부서 이름 찾기
    const deptInfo = codeList.DEPT.find(dept => dept.DEPT_CD === data.DEPT_CD)
    const deptName = deptInfo ? deptInfo.DEPT_NM : "부서 없음"
    let coorYnValue = data.USER_DIV === "A" ? "N" : data.USER_DIV === "B" ? "Y" : ""

    // 중복 체크 (EMP_NO가 동일한지 확인)
    const isDuplicate = existingRows.some(row => row.EMP_NO === data.EMP_NO)
    if (isDuplicate) {
      Message.warn(` 이미 추가된 인원입니다: ${data.EMP_NO}`)
      return // 중복이면 추가하지 않음
    }
    // 새로운 행 데이터 생성
    const rowData = {
      ...data, // 기존 데이터 복사
      // DEPT_NM: deptName, // 부서명 추가
      ASGN_CD: searchParams2.ASGN_CD,
      DEPT_NM: searchParams2.ASGN_FULL_NM, // 부서명 추가
      // ORG_DT: today, // 저장일 컬럼에 현재 날짜 추가
      COOR_YN: coorYnValue, // 협조 여부
      // saveYN: "N"
    }

    // console.log("팝업에서받은데이터2 : ", rowData)

    // 새로운 행 추가
    dataProvider.addRow(rowData)
    
  })

  // console.log(" 그리드에 데이터 추가 완료!")
}

//그리드 속성셋팅 ( 운영조직 )
const grdSubProps = reactive({
  gridViewOption : { header: { height: 60 } },
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_CD', dataType: 'text', width: '50', lookupDisplay: true, editable: false , 
      header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', width: '50', lookupDisplay: true, editable: false , 
      header: { text: t('사업부') }, styleName: 'left-column', },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '40', editable: false,
      header: { text: t('부서코드') } },
    { fieldName: 'ASGN_CD', dataType: 'text', width: '45', editable: false, 
      header: { text: t('협력사코드') } },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', width: '165', editable: false, 
      header: { text: t('부서명/협력사명') }, styleName: 'left-column', },
    { fieldName: 'STATUS', dataType: 'text', width: '40', header: { text: t('결재상태') }, editable : false, lookupDisplay: true},
    // { fieldName: 'ASGN_CD', dataType: 'text', width: '70', header: { text: t('소속코드') }, editable : false, visible: false},
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM', 
    {
      name: '부서',
      direction: 'horizontal',
      items: [
        'DEPT_CD',
        'ASGN_CD',
        'ASGN_FULL_NM',
        'STATUS'                       
      ],
      header: {
        text: t('부서'),
      },
    },
  ],
})
grdSubProps.columns = grdSubProps.fields

//그리드 속성셋팅 ( 운영조직 세부사항 )
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, 
  checkBar: {  visible: true }
},
  keys : [],
  fields : [ 
    // styleName: 'header_validit'
    { fieldName: 'DIV_CD', dataType: 'text', width: '90', header: { text: t('구분') }, lookupDisplay: true, editable: true,
      editor: {
        type: 'dropdown',
        textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true
      },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        let DIV_CD = grid.getValue(dataCell.index.itemIndex, 'DIV_CD')
        let BOSS = grid.getValue(dataCell.index.itemIndex, 'BOSS') 
        if(DIV_CD === '부서장' && BOSS === 'Y'){
          ret.editable= false
          ret.styleName = 'testt'
        } 
        return ret
      },
    },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '240', header: { text: t('과/팀') }, editable : false, styleName: 'left-column', },
    { fieldName: 'EMP_NM', dataType: 'text', width: '70', header: { text: t('성명') }, editable : false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', width: '80', header: { text: t('직위') }, editable : false },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '80',  // 입력 필드와 버튼을 함께 표시할 수 있도록 충분한 너비 설정
      header: { text: t('사번') },
      editable : false
    },
    { fieldName: 'TEL_NO', dataType: 'text', width: '80', header: { text: t('사내 전화번호') }, editable : false },
    { fieldName: 'STATUS', dataType: 'text', width: '80', header: { text: t('결재상태') }, editable : false, lookupDisplay: true,
      editor: {
        type: 'dropdown',
        textReadOnly: true, dropDownCount: 6, partialMatch: true, domainOnly: true, dropDownWhenClick: true
      },
    },
    { fieldName: 'ORG_DT', dataType: 'text', width: '80', header: { text: t('지정일') }, editable : false },
    { fieldName: 'ASGN_CD', dataType: 'text', width: '100', header: { text: t('부서명') }, visible : false },
    { fieldName: 'BSNS_CD', dataType: 'text', width: '100', header: { text: t('사업부') }, visible : false },
    { fieldName: 'ACTION_APPROVAL_ID', dataType: 'text', width: '100', header: { text: t('상신ID') }, visible : false },
    { fieldName: 'COOR_YN', dataType: 'text', width: '100', header: { text: t('구분') }, visible : false },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '100', header: { text: t('과/팀명') }, visible : false },
    { fieldName: 'saveYN', dataType: 'text', width: '100', header: { text: t('구분자') }, visible : false },
    { fieldName: 'BOSS', dataType: 'text', width: '100', header: { text: t('BOSS') }, visible : false },
    { fieldName: 'checkblock', dataType: 'text', width: '100', header: { text: t('checkblock') }, visible : false },
  ],
  columns : [],
})
grdMainProps.columns = grdMainProps.fields





//결재 기능

//결재 팝업 실행
const setApply = async () =>{
  // const orgData2 = grdMain.value.getDataProvider().getRows()
  const orgData2 = grdMain.value.getDataProvider().getJsonRows()
  // console.log("테스트1212 : ", orgData2)
  // const hasNewEntry = orgData2.some(row => !row[9] || row[9].trim() === "")
  const hasNewEntry = orgData2.some(row => row.BOSS !== 'Y' && (!row.ORG_DT || row.ORG_DT.trim() === ""))
  // console.log("hasNewEntry", hasNewEntry)

  // console.log("searchParams2.ASGN_CD", searchParams2.ASGN_CD)
  // console.log("hasNewEntry", hasNewEntry)
  if(searchParams2.ASGN_CD) {
    Message.warn(t('협력사는 결재상신 할 수 없습니다.'))
    return
  }

  if(!hasNewEntry){
    Message.err('새로운 인원을 추가해주세요.')
    return
  }


  await openReqApp(orgData2)
  
}

//결재 팝업데이터 생성
const openReqApp = async (orgData2) =>{
  // console.log("business:" , userStore.bsnsCd)

  // let res = await commonSearchApi({
  //     queryId: "HLTIA0010_SEARCH_02",  // DB에서 가져올 쿼리 ID
  //     param: { 
  //       CMPNY_DIV: userStore.cmpnyDiv,  // 필요한 파라미터 전달
  //       USER_ID: userStore.userId,
  //       ...searchParams2
  //     }
  //   })
    
    // console.log("resss", orgData2)

  // let allRows = res.ORESULT_CUR
  let allRows = orgData2.filter(item => item.STATUS == null);

  // let allRows = grdMain.value.getDataProvider().getJsonRows()

  // console.log("결재데이터", allRows)

  if(allRows.length === 0 || (allRows.length === 1 && allRows[0].DIV_CD === '부서장')){
    Message.warn(t('결재할 내용이 없습니다.'))
    return
  } 
  let reqCon = await reqContents(allRows)


  // console.log("팝업전달데이터 :", {REPORT: reqCon})
  //결재상신 데이터 전달
  await approvalPopup.value.openPopup({
    CLSS_ID: useLogsStore().vueId,
    TITLE: "근골격계질환 예방관리프로그램(HEMP)운영조직 보고",
    CMPNY_DIV: userStore.cmpnyDiv,
    DATA_KEY:
      userStore.cmpnyDiv +
      ";" +
      allRows[0].BSNS_CD +
      ";" +
      allRows[0].ASGN_CD +
      ";" +
      allRows[0].ASGN_CD +
      ";" +
      // reqCon.EMP_NM +
      // ";" +
      // reqCon.JOB_TIT_NM +
      // ";" +
      // reqCon.DEPT_NM +
      // ";" +
      new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;YEAR',
    REPORT: reqCon, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE: "3", //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: "421", //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE: "CLR_15", //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })

  // const groupedData = await reqContents(allRows)
  // approvalAppkey(groupedData)
}

const divCdMapping = {
  "0": "부서장",
  "1": "간사(정)",
  "2": "간사(부)",
  "3": "대의원",
  "4": "대의원 추천인",
  "5": "추진위원"
}

//결재 내용 생성
const reqContents = async (allRows) =>{
  // console.log(" 선택한 행 데이터:", allRows)
  
  searchParams3.groupedData = {
    "부서장": [],
    "간사(정)": [],
    "간사(부)": [],
    "대의원": [],
    "대의원 추천인": [],
    "추진위원": []
  };

  allRows.forEach(row => {
    let role = divCdMapping[row.DIV_CD];  // 숫자를 한글로 변환
    if (role) {
      searchParams3.groupedData[role].push(row); // 역할별 데이터 저장
    }
  });
  // console.log("역할별 정리된 결재 데이터:", searchParams3.groupedData)
  

  // const today = new Date().toISOString().split('T')[0]
  let reqCon = ''

    reqCon = `
    <html>
    <head>
    <title>근골격계질환 예방관리프로그램(HEMP) 운영조직 보고</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        h2 {
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .section-title {
            font-weight: bold;
            margin-top: 15px;
            text-align: left;
        }
        .section {
          text-align: left;
        }
    </style>
</head>
<body>
    <h3 class="section-title">1. 근골격계질환 예방관리 프로그램(HHI Ergonomics Management Program, HEMP)</h3>
    <p class="section">1) 정의 및 목적</p>
    <p class="section">
        작업장 유해요인조사 및 개선, 의학적 관리, 교육 등이 포함된 근골격계질환 예방을 위한 종합관리 프로그램으로서,
        주관 부서 및 각 부서별 운영조직을 통해 근골격계질환 예방을 위한 활동을 추진하고 종업원 건강 보호를 도모함을 목적으로 한다.
    </p>

    <p class="section">2) 법적 근거</p>
    <ul class="section">
        <li>산업안전보건법 제 39조(보건조치) 제 1항 제 5호</li>
        <li>산업안전보건기준에 관한 규칙 제 662조(근골격계질환 예방관리 프로그램 시행)</li>
    </ul>

    <h3 class="section-title">2. ${allRows[0].DEPT_NM} 운영조직 구성</h3>

    <table>
        <thead>
            <tr>
                <th style="border: 1px solid black; padding: 8px; text-align: center;">구분</th>
                <th style="border: 1px solid black; padding: 8px; text-align: center;">성명</th>
                <th style="border: 1px solid black; padding: 8px; text-align: center;">직급</th>
                <th style="border: 1px solid black; padding: 8px; text-align: center;">소속(과/팀)</th>
                <th style="border: 1px solid black; padding: 8px; text-align: center;">역할</th>
            </tr>
        </thead>
        <tbody>
            ${allRows
            .filter(row => row.DIV_CD === "1" && row.EMP_NM?.trim()) // 이름 있을 때만 출력
            .map(row => `
            <tr>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">간사(정)</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.EMP_NM}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.JOB_TIT_NM}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.DEPT_NM}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: left;">유해요인조사 주관, 결과 취합 및 전산등록, 작업환경개선 및 교육현황 관리 등 적절한 조치가 취해지고 있는지 관리</td>
            </tr>
            `).join("")}

            ${allRows
            .filter(row => row.DIV_CD === "2" && row.EMP_NM?.trim()) // 이름 있을 때만 출력
            .map(row => `
            <tr>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">간사(부)</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.EMP_NM}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.JOB_TIT_NM}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.DEPT_NM}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: left;">유해요인조사 주관, 결과 취합 및 전산등록, 작업환경개선 및 교육현황 관리 등 적절한 조치가 취해지고 있는지 관리</td>
            </tr>
            `).join("")}
            
            ${allRows
            .filter(row => row.DIV_CD === "3" && row.EMP_NM?.trim()) // 이름 있을 때만 출력
            .map(row => `
            <tr>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">대의원</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.EMP_NM}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.JOB_TIT_NM}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.DEPT_NM}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: left;">유해요인조사의 전반적인 운영 내용을 검토하고 의견 제시</td>
            </tr>
            `).join("")}

            ${
              allRows.filter(row => row.DIV_CD === "5" && row.EMP_NM?.trim()).length > 0
                ? allRows
                    .filter(row => row.DIV_CD === "5" && row.EMP_NM?.trim()) // 이름 있는 애만
                    .map(row => `
            <tr>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">추진위원</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.EMP_NM}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.JOB_TIT_NM || ""}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.DEPT_NM || ""}</td>
              <td style="border: 1px solid black; padding: 8px; text-align: left;">
                근골격계 부담작업 선정(11개 법적 항목 근거), 유해요인조사 수행 및 개선방안 검토, 의학적 관리를 위한 조치 및 교육
              </td>
            </tr>
                    `).join("")
                : ""
            }
            </tbody>
            </table>
            
            </body>
            </html>`

  return reqCon
}
{/* <tr>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">부서장</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${allRows.find(row => row.DIV_CD === "부서장")?.EMP_NM || ""}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${allRows.find(row => row.DIV_CD === "부서장")?.JOB_TIT_NM || ""}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: center;">${allRows.find(row => row.DIV_CD === "부서장")?.DEPT_NM || ""}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: left;">간사 및 추진위원 선임 및 운영 전반 관리</td>
            </tr> */}

// ${
//             allRows.filter(row => row.DIV_CD === "5").length > 0
//             ? allRows
//             .filter(row => row.DIV_CD === "5")
//             .map(row => `
//             <tr>
//               <td style="border: 1px solid black; padding: 8px; text-align: center;">추진위원</td>
//               <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.EMP_NM || ""}</td>
//               <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.JOB_TIT_NM || ""}</td>
//               <td style="border: 1px solid black; padding: 8px; text-align: center;">${row.DEPT_NM || ""}</td>
//               <td style="border: 1px solid black; padding: 8px; text-align: left;">
//                 근골격계 부담작업 선정(11개 법적 항목 근거), 유해요인조사 수행 및 개선방안 검토, 의학적 관리를 위한 조치 및 교육
//                 </td>
//                 </tr>`).join("")
//             : `
//             <tr>
//               <td style="border: 1px solid black; padding: 8px; text-align: center;">추진위원</td>
//               <td style="border: 1px solid black; padding: 8px; text-align: center;"></td>
//               <td style="border: 1px solid black; padding: 8px; text-align: center;"></td>
//               <td style="border: 1px solid black; padding: 8px; text-align: center;"></td>
//               <td style="border: 1px solid black; padding: 8px; text-align: left;">
//                 근골격계 부담작업 선정(11개 법적 항목 근거), 유해요인조사 수행 및 개선방안 검토, 의학적 관리를 위한 조치 및 교육
//                 </td>
//                 </tr>
//                 `
//             }
// <tr>
            //     <td style="border: 1px solid black; padding: 8px; text-align: center;">간사(정)</td>
            //     <td style="border: 1px solid black; padding: 8px; text-align: center;">${allRows.find(row => row.DIV_CD === "1")?.EMP_NM || ""}</td>
            //     <td style="border: 1px solid black; padding: 8px; text-align: center;">${allRows.find(row => row.DIV_CD === "1")?.JOB_TIT_NM || ""}</td>
            //     <td style="border: 1px solid black; padding: 8px; text-align: center;">${allRows.find(row => row.DIV_CD === "1")?.DEPT_NM || ""}</td>
            //     <td style="border: 1px solid black; padding: 8px; text-align: left;">유해요인조사 주관, 결과 취합 및 전산등록, 작업환경개선 및 교육현황 관리 등 적절한 조치가 취해지고 있는지 관리</td>
            // </tr>
// console.log("포커스로우 : ", focusedRow.BSNS_CD)
            // <tr>
            //     <td style="border: 1px solid black; padding: 8px; text-align: center;">대의원 추천인</td>
            //     <td style="border: 1px solid black; padding: 8px; text-align: center;">${allRows.find(row => row.DIV_CD === "4")?.EMP_NM || ""}</td>
            //     <td style="border: 1px solid black; padding: 8px; text-align: center;">${allRows.find(row => row.DIV_CD === "4")?.JOB_TIT_NM || ""}</td>
            //     <td style="border: 1px solid black; padding: 8px; text-align: center;">${allRows.find(row => row.DIV_CD === "4")?.DEPT_NM || ""}</td>
            //     <td style="border: 1px solid black; padding: 8px; text-align: left;">대의원과 같이 전반적인 운영 내용을 검토하고 의견 제시</td>
            // </tr>

// 결재 상신 후, 처리 결과 리턴
const approvalAppkey = async (res) => {
  if (!searchParams3.groupedData || Object.keys(searchParams3.groupedData).length === 0) {
    // console.error(" 오류: groupedData가 존재하지 않습니다.")
    return
  }
  // if (!rcol) {
  //   console.log("결재승인키가 없습니다.")
  //   return
  // }
  // console.log("결재상신후res :", res)
  // console.log("결재 상신 후 appkey:", rcol)
  // console.log("결재상신후데이터 :", searchParams3.groupedData)
  const updateList = Object.values(searchParams3.groupedData)
    .flatMap(roleList => roleList) // 역할별 배열을 하나의 리스트로 변환
    .map(item => ({
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: item.BSNS_CD,
      EMP_NO: item.EMP_NO,
      APPROVE_ID: res,
      USER_ID: userStore.userId
    }))

    // console.log("업데이트리스트 : ", updateList)

  await commonExecuteApi(
    { queryId : 'HLTIA0010_UPDATE_01',
      list  : updateList
    }
    )  
    // 전역 변수 초기화 (덮어씌움 방지)
  searchParams3.groupedData = {}
}

const isNull = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}

const isNullAndEmpty = (data) => {
  return isNull(data) ? '' : data
}

//결재 끝

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <!-- menuId로 title가져옴 -->
      <IMenuTitle
        ref="menuTitle"
        :title="`${$t(useLogsStore().menuId)}`"
        :button-list="['btnSearch', 'btnOrgPrint', 'btnReqApply']"
        :use-permission="false"
        @click-button="onButtonsClick1"
        />
      </v-card-title>
      <!-- :button-list="isAdmin ? ['btnSearch', 'btnOrgPrint', 'btnReqApply'] : ['btnSearch', 'btnOrgPrint']" -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select 
            :label="$t('사업부')"
            labelWidth="50px"
            width="250px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            :disabled="!isAdmin"
            />
            <!-- :disabled="!isAdmin && (noGRP || noGRP2)" -->
          <i-select 
            :label="$t('부서')"
            labelWidth="50px"
            width="250px"
            v-model="searchParams.DEPT_CD"
            :items="codeList.DEPT"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
            :disabled="!isAdmin"
            :readonly="isEmpty(searchParams.BSNS_CD)"
          />
          <!-- 협력사 -->
          <i-select
            :label="$t('협력사')"
            label-width="50px"
            width="250px"
            v-model="searchParams.PARTNER_CD"
            :items="codeList.PARTNER_CD"
            item-value="ASGN_CD"
            item-title="ASGN_NM"
            :disabled="!isAdmin"
            :readonly="isEmpty(searchParams.DEPT_CD)"
          />
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <!-- h-window: 만약 v-window를 사용하고 싶다면 v-window의 클래스에 h-window 클래스를 넣어주고
                      v-window-item 하위에 dom을 넣으시면 됩니다. -->
        <v-window v-model="tab" class="h-window">
          <v-window-item value="tab1">
            <!-- h-grow : 컨텐츠를 가로로 놓고싶다면 v-sheet 아래에 div와 클래스를 지정해주세요 
                바로 <div class="h-grow"> 부터 시작한다면 컨텐츠는 자동으로 지정됩니다.
            -->
            <div class="h-grow">
              <v-sheet width="35%" class="pa-0 h-auto mr-3">
                <!-- :style="{ opacity: grdSubVisible ? 1 : 0, visibility: grdSubVisible ? 'visible' : 'hidden' }"> -->
                <RealGrid
                  ref="grdSub"
                  :grid-view-option="grdSubProps.gridViewOption"
                  :keys="grdSubProps.keys" 
                  :fields="grdSubProps.fields"
                  :columns="grdSubProps.columns"
                  :column-layout="grdSubProps.columnLayout"
                  @onCellClicked="onCellDblClicked"
                  />
              </v-sheet>
                <!-- @onItemAllChecked="onItemAllChecked" -->
                
                <!-- :style="{ opacity: grdMainVisible ? 1 : 0, visibility: grdMainVisible ? 'visible' : 'hidden' }" -->
              <v-sheet width="65%" class="pa-0 h-auto">
                <IGridTitle
                ref="menuTitle2"
                :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                :use-permission="false"
                @click-button="onButtonsClick2"
                >
                <!-- :button-list="isAdmin ? ['btnCreate', 'btnUpdate', 'btnDelete'] : []" -->
                  <template #editors />
                </IGridTitle>
                <!-- 메인그리드 -->
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  @onCellClicked="onCellClicked"
                />
              </v-sheet>
            </div>
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="Popup" @selected="addToMainGrid"></EmpPopup>
  <HLTIA0010Popup02 ref="Popup2"></HLTIA0010Popup02>
      <!-- 결재 팝업-->
      <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey"/>
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
    min-height: 700px
  }
}

.boss-style {
  background-color: #fce4ec;
  // color: #333;
}

.testt {
  background-color: #fce4ec;
}
</style>
