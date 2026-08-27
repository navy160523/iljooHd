<script setup>
import { ref, reactive, onMounted } from "vue";
import { useUserStore } from "@hiway/stores/user";
import { commonRequest } from "@hiway/api/commonApi";
import RealGridFactory from "@/utils/realgrid2";
import IGridTitle from "@/components/IGridTitle.vue";
import ILabel from "@/components/ILabel.vue";
import RealGrid from "@/components/RealGrid.vue";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi";
import { useI18n } from "vue-i18n";
import Message from "@hiway/utils/notify";
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag";

const vm = getCurrentInstance().proxy; //다이얼로그관련
const userStore = useUserStore(); //유저정보
//const searchArea = ref(null)
const t = useI18n().t; //다국어
const emit = defineEmits(["selected"]);
const dialog = ref(false);
const grdMain = ref(null);
const readonly = ref(true);
const dataRes = ref();

const updateYn = ref(false);

let options = reactive({
  disabled: {
    CMPNY_DIV: false, // 회사구분
    USER_DIV: false, // 직영, 사내협력사
    BSNS_CD: false, // 사업부
    DEPT_CD: false, // HSESY적용제외
  },
  // disabled용으로만 사용(기존꺼는 애매해서 추가)
  onlyDisabled: {
    CMPNY_DIV_D: false, // 회사구분
    USER_DIV_D: false, // 직영, 사내협력사
    BSNS_CD_D: false, // 사업부
    DEPT_CD_D: false, // 부서
    FLAG_D: false, // 퇴직자여부
    AUTO_CLOSE_D: false, // 인원선택 후 자동종료
  },
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    USER_DIV: "",
    BSNS_CD: "",
    DEPT_CD: "",
    EMP_NM: "",
    EMP_NO: "",
    FLAG: "N", //퇴직자 포함 여부 플래그값
    AUTO_CLOSE: "Y", //인원 선택 후 팝업 종료 여부
    IS_SEARCH: true,
  },
  ALL_SEARCH: false, // 조회조건없이 전부 조회하고싶을때
  multi: false,
});

const itemField = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR      : '',
  REQ_DIV   : '',
  REQ_CHA   : '',
  EMP_NO    : '',
  EMP_NM    : '', // 신청자 한글명
  BSNS_CD   : '',
  DEPT_CD   : '',
  ASGN_CD   : '',
  DUTY_YN   : 'Y',
  USER_DIV  : '',
  REMARKS   : '',
  UPDATE_YN: 'N', //수정 여부
})

const itemReadOnly = reactive({
  REQ_DIV   : false,
  YEAR      : false,
  REQ_CHA   : false,
  EMP_NM    : true
}) 

const initItemField = async() => {

    itemField.CMPNY_DIV = userStore.cmpnyDiv
    itemField.YEAR      = ''
    itemField.REQ_DIV   = ''
    itemField.REQ_CHA   = ''
    itemField.EMP_NO    = ''
    itemField.EMP_NM    = '' // 신청자 한글명
    itemField.BSNS_CD   = ''
    itemField.DEPT_CD   = ''
    itemField.ASGN_CD   = ''
    itemField.DUTY_YN   = 'Y'
    itemField.USER_DIV  = ''
    itemField.REMARKS   = ''
}


//코드리스트 선언
const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
  USER_DIV: [
    { COD: "", TXT: "전체", DISABLE: false },
    { COD: "A", TXT: "직영", DISABLE: false },
    { COD: "B", TXT: "사내협력사", DISABLE: false },
    { COD: "D", TXT: "단기공사", DISABLE: false },
    //{ COD: "Z", TXT: "기타", DISABLE: false, VISIBLE: false },
  ],
  accdntType: [],
  proc: [],
  //등록 정보
  REQ_DIV: [], // 신청구분
  YEAR: [], // 년도
  REQ_CHA: [], // 신청시기
  DUTY_YN : [
    { TXT: "전체", COD: '' },
    { TXT: "대상", COD: "Y" },
    { TXT: "비대상", COD: "N" },
  ], // 대상여부(Y/N)
});

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 사업부
    commonSearchApi({
      queryId: "searchDept3",
      // 2024.06.07 박용훈 기본적으로 전체 검색시 성능 저하이므로 기본 세팅값 추가
      //param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: 'Y' },
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: userStore.bsnsCd,
        USE_DIV: "Y",
      },
    }), // 부서
  // 등록 정보
  getCodeList('HHII811'), // 신청 구분
  getCodeList('HHII808A'), // 신청 시기 - 안전화
  getCodeList('HHII808C'), // 신청시기 - 안전장화
  

  ]).then((res) => {
    
    dataRes.value =res

    codeList.company = res[0].ORESULT_CUR;
    codeList.bsnsCd = res[1].ORESULT_CUR;
    codeList.deptCd = res[2].ORESULT_CUR;

    itemField.YEAR = new Date().getFullYear().toString()
    codeList.REQ_DIV = res[3].ORESULT_CUR
    

    if(itemField.REQ_DIV === 'A'){
    codeList.REQ_CHA = dataRes.value[4].ORESULT_CUR
    if(!codeList.REQ_CHA.some(item => item.TXT === "선택")){
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  }else if (itemField.REQ_DIV === 'B') {
    codeList.REQ_CHA = dataRes.value[5].ORESULT_CUR
    if(!codeList.REQ_CHA.some(item => item.TXT === "선택")){
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  }
    //codeList.REQ_CHA = res[4].ORESULT_CUR

    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" });
    codeList.REQ_DIV.unshift({TXT: '선택', COD: ''})
    codeList.REQ_CHA.unshift({TXT: '선택', COD: ''})

    //codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
  });
};

const changeReqDiv = async () => {

  codeList.REQ_CHA = []
  itemField.REQ_CHA = ''

  if(itemField.REQ_DIV === 'A'){
    codeList.REQ_CHA = dataRes.value[4].ORESULT_CUR
    if(!codeList.REQ_CHA.some(item => item.TXT === "선택")){
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  }else if (itemField.REQ_DIV === 'B') {
    codeList.REQ_CHA = dataRes.value[5].ORESULT_CUR
    if(!codeList.REQ_CHA.some(item => item.TXT === "선택")){
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  }else{
    if(!codeList.REQ_CHA.some(item => item.TXT === "선택")){
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  }
}


//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: ["CMPNY_DIV"],
  field: [
    {
      fieldName: "USER_DIV",
      dataType: "text",
      width: "90",
      header: { text: t("소속구분") },
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.USER_DIV },
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "300",
      styleName: "left-column",
      header: { text: t("소속") },
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "90",
      header: { text: t("사번") },
    },
    {
      fieldName: "JOB_TIT_NM",
      dataType: "text",
      width: "90",
      header: { text: t("직급") },
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "90",
      header: { text: t("성명") },
    },
    {
      fieldName: "TEL_NO",
      dataType: "text",
      width: "150",
      header: { text: t("사내번호") },
    },
    {
      fieldName: "HLD_OFFI_GBN",
      dataType: "text",
      header: { text: t("재직여부") },
    },
    // 출력 안함
    {
      fieldName: "BIRTH_DAY",
      dataType: "text",
      width: "100",
      header: { text: t("생년월일") },
      visible: false,
    },
    //2024.08.20 김현재 작성
    //산재모듈에서 출력하는 생년월일 (퇴직자의 생년월일까지 같이 나온다.)
    {
      fieldName: "SANJE_BIRTH_DAY",
      dataType: "text",
      visible: false,
      header: { text: t("생년월일") },
    },
    { fieldName: "ADDR", dataType: "text", visible: false },
    { fieldName: "ADDR1", dataType: "text", visible: false },
    { fieldName: "AGE", dataType: "text", visible: false },
    { fieldName: "AGE_KOR", dataType: "text", visible: false },
    { fieldName: "ASGN_CD", dataType: "text", visible: false },
    { fieldName: "ASGN_SHRT_NM", dataType: "text", visible: false },
    { fieldName: "BSNS_CD", dataType: "text", visible: false },
    { fieldName: "BSNS_NM", dataType: "text", visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "COMPANY", dataType: "text", visible: false },
    { fieldName: "COM_ENT_DATE", dataType: "text", visible: false },
    { fieldName: "DEPT_CD", dataType: "text", visible: false },
    { fieldName: "DEPT_NM", dataType: "text", visible: false },
    { fieldName: "EMAIL", dataType: "text", visible: false },
    { fieldName: "ENG_NM", dataType: "text", visible: false },
    { fieldName: "GRD_CD", dataType: "text", visible: false },
    { fieldName: "GRD_NM", dataType: "text", visible: false },
    { fieldName: "JIKJONG_CD", dataType: "text", visible: false },
    { fieldName: "JOB_DEPT_CD", dataType: "text", visible: false },
    { fieldName: "JOB_DEPT_NM", dataType: "text", visible: false },
    { fieldName: "JOB_GRP_CD", dataType: "text", visible: false },
    { fieldName: "JOB_ROW_CD", dataType: "text", visible: false },
    { fieldName: "JOB_ROW_NM", dataType: "text", visible: false },
    { fieldName: "JOB_TIT_CD", dataType: "text", visible: false },
    { fieldName: "MARR_YN", dataType: "text", visible: false },
    { fieldName: "OFFI_RES_CD", dataType: "text", visible: false },
    { fieldName: "OFFI_RES_NM", dataType: "text", visible: false },
    { fieldName: "RESM_DATE", dataType: "text", visible: false },
    { fieldName: "RETI_TMP_DATE", dataType: "text", visible: false },
    { fieldName: "SEX", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_NM", dataType: "text", visible: false },
    { fieldName: "HND_PHN", dataType: "text", visible: false },
    { fieldName: "TMP_RST_DATE", dataType: "text", visible: false },
    { fieldName: "TMP_RST_RSN", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_NM", dataType: "text", visible: false },
    { fieldName: "COMP_CD", dataType: "text", visible: false },
    { fieldName: "GWA_CD", dataType: "text", visible: false },
    { fieldName: "OFFI_RES_DATE", dataType: "text", visible: false },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.field;

const openPopup = (reqDiv, data) => {

  itemField.REQ_DIV = reqDiv

  initCodeList();

  if(data){

    updateYn.value = true
    itemField.UPDATE_YN = 'Y'

    itemReadOnly.REQ_DIV = true
    itemReadOnly.YEAR = true
    itemReadOnly.REQ_CHA = true

    for (const [key, value] of Object.entries(data)) {
      if (itemField.hasOwnProperty(key)) {
        if(key === "REQ_CHA"){
          itemField[key] = value.substring(1);
        }else{
          itemField[key] = value;
        }
      }
    }
  }else{
    updateYn.value = false
     
  }

  //그리드, 선택 상태 초기화
  grdMain.value.getGridView().setAllCheck(false);
  grdMain.value.getDataProvider().setRows([]);

  options.values.EMP_NM = "";
  options.values.BSNS_CD = "";
  options.values.DEPT_CD = "";
  options.values.EMP_NO = "";
  options.values.FLAG = "N";
  options.values.AUTO_CLOSE = "Y";
  options.values.USER_DIV = "";
  options.disabled.EMP_NM = true

  dialog.value = true;

};

// 사업부가 바뀌면 부서 데이터 가져옴
watch(
  () => options.values.BSNS_CD,
  (newValue, oldValue) => {
    // 사업부가 비활성화가 아닐때
    if (!options.onlyDisabled.BSNS_CD_D) {
      // options.values.DEPT_CD = ''
      // options.values.EMP_NM = ''
      // options.values.EMP_NO = ''

      // oldValue(변경전 데이터)가 있으면 options.values.DEPT_CD(부서)를 전체로 변경
      if (oldValue !== newValue) {
        commonSearchApi({
          queryId: "searchDept3",
          param: {
            CMPNY_DIV: userStore.cmpnyDiv,
            BSNS_CD: newValue,
            USE_DIV: "Y",
          },
        }).then((res) => {
          codeList.deptCd = res.ORESULT_CUR;
          //codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" })

          // 2024.06.27 팝업 오픈시 사업부,부서 정보를 같이 넘기면 부서코드가 초기화가 되므로 로직추가함
          let gridData = grdMain.value.getDataProvider().getRows();
          if (gridData.length > 0) {
            options.values.DEPT_CD = "";
            options.values.EMP_NM = "";
            options.values.EMP_NO = "";
            grdMain.value.getDataProvider().setRows(null);
          }
        });
      }

      // if (oldValue && oldValue !== "") {
      //   options.values.DEPT_CD = ""
      // }
    }
  }
);

/* ------------- 팝업 ------------- */
// 팝업 닫기
const onClose = () => {
  for (let i in options.onlyDisabled) {
    options.onlyDisabled[i] = false;
  }
  dialog.value = false;
};


//초기 데이터셋팅
onMounted(() => {
  //테스트
  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  //initCodeList()
});

/* ------------- 클릭 이벤트 ------------- */
const onButtonsClick = (btn) => {

  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run();
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run();
    //onSelect();
  } else if (btn.id === "btnClose") {
    //초기화
    initItemField()
    grdMain.value.getDataProvider().setRows([]);
    dialog.value = false;
  }
};

/* ------------- 조회 ------------- */
const beforeSearch = async () => {
  if (!options.ALL_SEARCH) {
    if (
      !options.values.DEPT_CD &&
      !options.values.EMP_NM &&
      !options.values.EMP_NO
    ) {
      return Message.err("부서를 선택하거나 사번 및 성명을 입력해주세요.");
    }
  }

  return true;
};

const searchData = () => {
  return commonSearchApi({ queryId: "searchEMP", param: options.values });
};

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  itemField.EMP_NO = ''
  itemField.EMP_NM = ''
};

// Enter 이벤트
const enterSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    //.setSearchArea(searchArea)
    .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run();
};


const beforeSave = () => {

  if (!itemField.REQ_DIV) {
    Message.warn(t("구분은 필수값 입니다."));
    return false;
  } else if (!itemField.REQ_CHA) {
    Message.warn(t("신청시기는 필수값 입니다."));
    return false;
  } else if (!itemField.EMP_NO) {
    Message.warn(t("성명은 필수값 입니다."));
    return false;
  } else if (!itemField.DUTY_YN) {
    Message.warn(t("대상여부는 필수값 입니다."));
    return false;
  }
  return true;
};

const saveData = async() => {

  let saveParam = [];
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: itemField.YEAR,
    REQ_DIV: itemField.REQ_DIV,
    REQ_CHA: itemField.REQ_CHA,
    EMP_NO: itemField.EMP_NO,
    BSNS_CD: itemField.BSNS_CD,
    DEPT_CD: itemField.DEPT_CD,
    ASGN_CD: itemField.ASGN_CD,
    DUTY_YN: itemField.DUTY_YN,
    USER_DIV: itemField.USER_DIV,
    REMARKS: itemField.REMARKS,
    USER_ID: userStore.userId,
    UPDATE_YN: itemField.UPDATE_YN
  };

  saveParam.push(saveData);
  return commonExecuteApi({
    queryId: "HLTHF0050_SAVE_01",
    list: saveParam,
  });
};

const afterSave = (res) => {
  emit("Saved");
  closePopup();
};

const closePopup = async() => {
  //초기화
  await initItemField()
  dialog.value = false;
  
};

//라디오박스 변경시 자동조회
//2024-02-15 김현재 추가
watch(
  () => options.values.USER_DIV,
  () => {
    if (
      !options.values.DEPT_CD &&
      !options.values.EMP_NM &&
      !options.values.EMP_NO
    ) {
      return false;
    } else {
      onButtonsClick({ id: "btnSearch" });
    }
  }
);

const onCellClicked = (grid, clickData) => {  
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  itemField.EMP_NO = data.EMP_NO
  itemField.EMP_NM = data.EMP_NM
  itemField.BSNS_CD = data.BSNS_CD
  itemField.DEPT_CD = data.DEPT_CD
  itemField.ASGN_CD = data.ASGN_CD
  itemField.USER_DIV = data.USER_DIV
}

defineExpose({
  openPopup,
});
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1150"
    :height="!updateYn ? 780 : 260" 
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>안전화/안전장화 강제 대상여부 등록</span>
    </v-sheet>
    <v-card class="pl-4 pr-4 pt-4 fill-height rounded-b-5">
      <v-card-title class="pa-1">
        <IGridTitle
          :use-permission="false"
          :button-list="!updateYn ? ['btnSearch', 'btnUpdate', 'btnClose'] : ['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <span class="gridTitle mR-10" v-show="!updateYn">인원 검색</span>
          <v-sheet class="searchArea flex-column" v-show="!updateYn">
            <div class="d-flex flex-gap">
              <i-select
                :label="$t('회사구분')"
                labelWidth="60px"
                v-model="options.values.CMPNY_DIV"
                :items="codeList.company"
                item-value="COD"
                item-title="TXT"
                :readonly="readonly"
                class="custom-flex-1"
              />
              <div class="custom-flex-2 d-flex align-center">
                <i-label class="flex-grow-1" label-loc="none" required>
                  <template #editor>
                    <v-radio-group
                      v-model="options.values.USER_DIV"
                      inline
                      :disabled="options.onlyDisabled.USER_DIV_D"
                    >
                      <v-radio
                        v-for="item in codeList.USER_DIV"
                        :key="item"
                        :value="item.COD"
                        :label="item.TXT"
                        :disabled="item.DISABLE"
                      />
                    </v-radio-group>
                  </template>
                </i-label>

                <i-label class="ml-5">
                  <template #editor>
                    <v-checkbox
                      :label="$t('퇴직자 포함')"
                      v-model="options.values.FLAG"
                      :disabled="options.onlyDisabled.FLAG_D"
                    ></v-checkbox>
                  </template>
                </i-label>
              </div>

              <span class="custom-flex-1"></span>

              <!-- <i-label class="custom-flex-1">
                <template #editor>
                  <v-checkbox
                    :label="$t('인원선택 후 자동종료')"
                    v-model="options.values.AUTO_CLOSE"
                    class="ml-5"
                    :disabled="options.onlyDisabled.AUTO_CLOSE_D"
                  ></v-checkbox>
                </template>
              </i-label> -->
            </div>
            <div class="mt-2 d-flex flex-gap">
              <i-select
                :label="$t('사업부')"
                labelWidth="60px"
                v-model="options.values.BSNS_CD"
                :items="codeList.bsnsCd"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                class="custom-flex-1"
                :disabled="options.onlyDisabled.BSNS_CD_D"
              />
              <i-select
                :label="$t('부서')"
                labelWidth="60px"
                v-model="options.values.DEPT_CD"
                :items="codeList.deptCd"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
                class="custom-flex-1"
                required
                :disabled="options.onlyDisabled.DEPT_CD_D"
              />
              <i-input
                :label="$t('사번')"
                label-width="60px"
                v-model="options.values.EMP_NO"
                @keydown.enter="(e) => enterSearch(e)"
                class="custom-flex-1"
                required
              />
              <!-- oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' );" -->
              <i-input
                :label="$t('성명')"
                label-width="60px"
                v-model="options.values.EMP_NM"
                @keydown.enter="(e) => enterSearch(e)"
                class="custom-flex-1"
                required
              />
            </div>
          </v-sheet>
          <span class="gridTitle mR-10">등록 정보</span>
          <v-sheet class="searchArea flex-column">
            <div class="d-flex flex-gap">
              <i-select
                :label="$t('구분')"
                labelWidth="60px"
                v-model="itemField.REQ_DIV"
                :items="codeList.REQ_DIV"
                item-value="COD"
                item-title="TXT"
                class="custom-flex-1"
                required
                :readonly="itemReadOnly.REQ_DIV"
                @update:modelValue="changeReqDiv"
              />
              <i-select
                :label="$t('년도')"
                labelWidth="60px"
                v-model="itemField.YEAR"
                type="YEAR"
                class="custom-flex-1"
                required
                :readonly="itemReadOnly.YEAR"
              />
              <i-select
                :label="$t('신청시기')"
                labelWidth="60px"
                v-model="itemField.REQ_CHA"
                :items="codeList.REQ_CHA"
                item-value="COD"
                item-title="TXT"
                class="custom-flex-1"
                required
                :readonly="itemReadOnly.REQ_CHA"
              />
              <span class="custom-flex-1"/>
              <!-- v-model="options.values.EMP_NO" -->
            </div>
            <div class="mt-2 d-flex flex-gap">
              <i-input
                :label="$t('성명')"
                label-width="60px"
                @keydown.enter="(e) => enterSearch(e)"
                class="custom-flex-1"
                v-model="itemField.EMP_NM"
                required
                :readonly="true"
              />
              <i-select
                :label="$t('대상여부')"
                labelWidth="60px"
                v-model="itemField.DUTY_YN"
                :items="codeList.DUTY_YN"
                item-value="COD"
                item-title="TXT"
                class="custom-flex-1"
                required
                :disabled="options.onlyDisabled.BSNS_CD_D"
              />
              <i-input
                :label="$t('비고')"
                label-width="60px"
                v-model="itemField.REMARKS"
                @keydown.enter="(e) => enterSearch(e)"
                class="custom-flex-2"
              />
              <!-- v-model="options.values.EMP_NO" -->
            </div>
          </v-sheet>
          <v-sheet class="h-auto" v-show="!updateYn">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped>
.flex-gap {
  gap: 10px;
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  flex-basis: calc(0% + 10px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
}
</style>
