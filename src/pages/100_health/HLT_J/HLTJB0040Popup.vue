<script setup>
import { ref, reactive, getCurrentInstance, onMounted, defineEmits  } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi, getCompanyList } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import ILabel from "@/components/ILabel.vue"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IUpload from "@/components/IUpload.vue"
import { toUpper } from "lodash-es"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
// const emit = defineEmits(["after-search"])
const isCreate = ref(false)
const tab = ref('tab1')
const grdMain = ref(null)
const autoClose = ref(true);
const emit = defineEmits(["selectRowData"]);
const selectedRow = ref([]);

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서,협력사
  USER_DIV: '', //사용자 구분 (A: 직영, B: 협력사, D: 단기공사)
  EMP_NO: '', //사번
  EMP_NM: '', //성명
  ASGN_CD: '', //부서명 
  INCLUDE_RETIREE: false, // 퇴직자 포함 여부 체크박스
})

const codeList = reactive({
  CMPNY: [],
  BSNS: [], //사업부
  DEPT: [], //부서/협력사
})

// const saveParam = reactive([
//   {
//     CMPNY_DIV: "",
//     USER_DIV: "", // A:직영, B:협력사 소속구분
//     BSNS_CD: "", // 소속, BSNS_NM 이름으로 가져와야함
//     // DEPT_CD: "", 
//     // DEPT_NM: "",
//     EMP_NO: "", // 사번
//     JOB_TIT_NM: "", // 직급
//     KOR_NM: "", // 성명
//     TEL_NO: "", // 번호
//     //재직여부?
//   },
// ])

const initCodeList = () => {
  Promise.all([
    getCompanyList(),
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv } }),
    commonSearchApi({ queryId: "searchDept", param: { CMPNY_DIV: userStore.cmpnyDiv, ORGN_DIV: 'A', BSNS_CD: '', ASGN_NM: '', DEPT_CD: '', HSE_ONLY: '', USE_ONLY: 'Y' } })
  ]).then(([companyRes, bsnsRes, deptRes]) => {
    console.log(" 회사 리스트 응답 (initCodeList):", companyRes);
    codeList.CMPNY.splice(0);
    codeList.CMPNY.push({ CMPNY_NM: "전체", CMPNY_DIV: "" });

    //  응답 데이터에서 회사 목록 추가
    companyRes.ORESULT_CUR.forEach(item => {
      codeList.CMPNY.push({
        CMPNY_NM: item.TXT,   // 회사 이름
        CMPNY_DIV: item.COD   // 회사 코드
      });
    });

    // 사업부 리스트 초기화 및 추가
    codeList.BSNS.splice(0);
    codeList.BSNS.push({ BSNS_NM: "전체", BSNS_CD: "" });
    bsnsRes.ORESULT_CUR.forEach(e => {
      codeList.BSNS.push(e);
    });

    // 부서 리스트 초기화 및 추가 (처음 실행 시)
    updateDeptList('');
  }).catch(error => {
    console.error("코드 리스트 조회 중 오류 발생:", error);
  });
};

// 사업부가 변경될 때 자동으로 부서 리스트 업데이트
watch(() => searchParam.BSNS_CD, (newBSNS) => {
  // console.log("사업부 변경됨:", newBSNS);
  updateDeptList(newBSNS);
});

// 부서 리스트 업데이트 함수
const updateDeptList = (BSNS_CD) => {
  commonSearchApi({ 
    queryId: "searchDept", 
    param: { CMPNY_DIV: userStore.cmpnyDiv, ORGN_DIV: 'A', BSNS_CD: BSNS_CD, ASGN_NM: '', DEPT_CD: '', HSE_ONLY: '', USE_ONLY: 'Y' } 
  })
  .then((res) => {
    // console.log("부서 응답 (변경 후):", res);

    // 기존 리스트 초기화 후 새 데이터 추가
    codeList.DEPT.splice(0);
    codeList.DEPT.push({ DEPT_NM: "전체", DEPT_CD: "" });

    res.ORESULT_CUR.forEach(e => {
      codeList.DEPT.push({
        DEPT_CD: e.DEPT_CD, // 부서 코드
        DEPT_NM: e.ASGN_SHRT_NM, // 부서명
      });
    });

    // console.log(" 최종 부서 리스트:", JSON.stringify(codeList.DEPT));
  })
  .catch(error => {
    console.error(" 부서 리스트 조회 오류:", error);
  });
};

// 3. 페이지가 처음 로드될 때 실행
onMounted(() => {
  initCodeList()
  console.log(" grdMain 마운트됨:", grdMain.value);
})

const closePopup = () => {
  dialog.value = false;
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData01)
    .setAfter(afterSearch01)
    .run()
  } else if (btn.id === 'btnSelect') {
    selectRowData();  
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}


// watch(() => searchParam.INCLUDE_RETIREE, (newValue) => {
//   console.log("퇴직자 포함 여부 변경됨:", newValue);
//   searchData01().then(afterSearch01);
// });

const searchData01 = () => {
  console.log(" API 요청 데이터:", JSON.stringify(searchParam));
  return commonSearchApi({ queryId : 'HLTIA0010_SEARCH_03', param: {
      CMPNY_DIV: searchParam.CMPNY_DIV,
      BSNS_CD: searchParam.BSNS_CD,
      DEPT_CD: searchParam.DEPT_CD,
      USER_DIV: searchParam.USER_DIV,
      EMP_NO: searchParam.EMP_NO,
      KOR_NM: searchParam.EMP_NM,
      ASGN_CD: searchParam.ASGN_CD,
      INCLUDE_RETIREE: searchParam.INCLUDE_RETIREE ? 'Y' : 'N'
      // INCLUDE_RETIREE: searchParam.INCLUDE_RETIREE,
      // RETI_TMP_DATE: searchParam.INCLUDE_RETIREE ? null : "IS NULL"
    } 
    })
}

const afterSearch01 = (res) => {
  console.log("조회된 데이터:", res.ORESULT_CUR);
  const transformedData = res.ORESULT_CUR.map(item => ({
    ...item,
    USER_DIV: getUserDivName(item.USER_DIV), // USER_DIV 변환 값 추가
    BSNS_NM: getBusinessName(item.BSNS_CD)
  }));
  console.log("변환된 데이터:", transformedData);
  grdMain.value.getDataProvider().setRows(transformedData);
}

const onCellClicked = (grid, clickData) => {
  //  클릭한 행의 데이터 가져오기
  selectedRow.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow);

  console.log(" 선택한 행 데이터:", selectedRow.value);
}

const selectRowData = () => {
  if (!selectedRow.value) {
    alert(" 선택된 인원이 없습니다.");
    return;
  }

  console.log(" 부모에게 전달할 데이터:", selectedRow.value);

  //  부모에게 선택된 데이터 전달
  emit("selectRowData", selectedRow.value);

  selectedRow.value = null;
  grdMain.value.getDataProvider().clearRows();
  
  if (autoClose.value) {
    dialog.value = false; // 체크박스가 체크된 상태면 팝업 닫기
  }
};

const getUserDivName = (code) => {
  const mapping = {
    A: "직영",
    B: "사내협력사",
    D: "단기공사",
    Z: "기타사용자관리"
  };
  return mapping[code] || ""; // 기본값 설정
};
const getBusinessName = (code) => {
  const bsns = codeList.BSNS.find(item => item.BSNS_CD === code);
  return bsns ? bsns.BSNS_NM : "";
};


const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, header: { height: 60 }, checkBar: {  visible: true } },
  keys : [],
  fields : [ 
      { fieldName: 'USER_DIV', dataType: 'text', width: '70',
      header: { text: t('소속구분') } },
      { fieldName: 'BSNS_CD', dataType: 'text', width: '50',
      header: { text: t('소속') }, visible: false },
      { fieldName: 'BSNS_NM', dataType: 'text', width: '50',
      header: { text: t('소속') } },
      { fieldName: 'DEPT_CD', dataType: 'text', width: '50',
      header: { text: t('과/팀') }, visible: false },
      { fieldName: 'EMP_NO', dataType: 'text', width: '100',
      header: { text: t('사번') } },
      { fieldName: 'JOB_TIT_NM', dataType: 'text', width: '120',
      header: { text: t('직급') } },
      { fieldName: 'EMP_NM', dataType: 'text', width: '120', 
      header: { text: t('성명') } },
      { fieldName: 'TEL_NO', dataType: 'text', width: '120',
      header: { text: t('사내번호') } },
      { fieldName: 'RETIRED_STATUS', dataType: 'text', width: '120', editable: false, 
      header: { text: t('재직여부') }, renderer: { type: "text" } },
      { fieldName: 'ASGN_CD', dataType: 'text', width: '120',
      header: { text: t('부서명') }, visible: false },
      { fieldName: 'OFFI_RES_NM', dataType: 'text', width: '120',
      header: { text: t('직책') }, visible: false },
      { fieldName: 'EMAIL', dataType: 'text', width: '120',
      header: { text: t('이메일') }, visible: false },
      // { fieldName: '', dataType: 'text', width: '120',
      // header: { text: t('사내번호') }, visible: false },
  ],
  columns: []
})
grdMainProps.columns = grdMainProps.fields

const openPopup = () => {
  selectedRow.value = null;
  grdMain.value.getDataProvider().clearRows();
  dialog.value = true;
}

defineExpose({
  openPopup,
})
</script>

<template>
<v-dialog
    v-model="dialog"
    eager
    persistent
    width="940"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>인원 검색</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select 
                :label="$t('회사구분')"
                labelWidth="50px"
                width="200px"
                v-model="searchParam.CMPNY_DIV"
                :items="codeList.CMPNY"
                item-value="CMPNY_DIV"
                item-title="CMPNY_NM"
              />
              <div class="vRadio">
                <v-radio-group v-model="searchParam.USER_DIV" inline>
                  <v-radio label="전체" value="" />
                  <v-radio label="직영" value="A" />
                  <v-radio label="사내협력사" value="B" />
                  <v-radio label="단기공사" value="D" />
                </v-radio-group>
              </div>
              <div class="vCheck">
                <v-checkbox
                  v-model="searchParam.INCLUDE_RETIREE"
                  label="퇴직자포함"
                  color="primary"
                  hide-details
                  density="compact"
                />
                <v-checkbox
                  v-model="autoClose"
                  :true-value="true"
                  label="인원선택 후 자동종료"
                  color="primary"
                  hide-details
                  density="compact"
                />
              </div>
            </div>
            <div class="d-flex mt-4 flex-wrap">
              <i-select 
                :label="$t('사업부')"
                labelWidth="50px"
                width="200px"
                v-model="searchParam.BSNS_CD"
                :items="codeList.BSNS"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
              />
              <i-select 
                :label="$t('부서')"
                labelWidth="50px"
                width="200px"
                v-model="searchParam.DEPT_CD"
                :items="codeList.DEPT"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
                required
              />
              <i-input
                v-model="searchParam.EMP_NO"
                top-label
                :label="$t('사번')"
                width="200px"
                labelWidth="50px"
                required
                class="input_flex"
              />
              <i-input
                v-model="searchParam.EMP_NM"
                top-label
                :label="$t('성명')"
                width="200px"
                labelWidth="50px"
                required
                class="input_flex"
              />
            </div>
          </v-sheet>
          <v-window v-model="tab" class="h-window">
            <v-window-item value="tab1">
              <div class="h-grow">
              <v-sheet width="30%" class="pa-0 h-auto mr-3">
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  style="height: 300px;"
                  @onCellClicked="onCellClicked"
                />
                </v-sheet>
              </div>
            </v-window-item>
          </v-window>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  .input_flex {
    display: flex;
  }

  .vRadio {
    display: flex;
    align-items: center;
  }
  .vCheck {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-left: 20px;
  }
</style>
