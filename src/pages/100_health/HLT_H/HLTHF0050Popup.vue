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
import EmpPopup from "@/components/popup/EmpPopup.vue";

const vm = getCurrentInstance().proxy; //다이얼로그관련
const userStore = useUserStore(); //유저정보
//const searchArea = ref(null)
const t = useI18n().t; //다국어
const emit = defineEmits(["selected"]);
const dialog = ref(false);
const grdMain = ref(null);
const readonly = ref(true);
const empPopup = ref(null);
const dataRes = ref();

const updateYn = ref(false);

const itemField = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: "",
  REQ_DIV: "",
  REQ_CHA: "",
  EMP_NO: "",
  EMP_NM: "", // 신청자 한글명
  BSNS_CD: "",
  DEPT_CD: "",
  ASGN_CD: "",
  ASGN_NM: "",
  DUTY_YN: "Y",
  USER_DIV: "",
  REMARKS: "",
  UPDATE_YN: "N", //수정 여부
});

const itemReadOnly = reactive({
  REQ_DIV: false,
  YEAR: false,
  REQ_CHA: false,
  EMP_NM: false,
});

const initItemField = async () => {
  itemField.CMPNY_DIV = userStore.cmpnyDiv;
  itemField.YEAR = "";
  itemField.REQ_DIV = "";
  itemField.REQ_CHA = "";
  itemField.EMP_NO = "";
  itemField.EMP_NM = ""; // 신청자 한글명
  itemField.BSNS_CD = "";
  itemField.DEPT_CD = "";
  itemField.ASGN_CD = "";
  itemField.DUTY_YN = "Y";
  itemField.USER_DIV = "";
  itemField.REMARKS = "";
  itemField.ASGN_NM = "";

  codeList.REQ_CHA = [];
  itemField.REQ_CHA = "";
  if (!codeList.REQ_CHA.some((item) => item.TXT === "선택")) {
    codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
  }

  itemReadOnly.YEAR = false;
  itemReadOnly.REQ_DIV = false;
  itemReadOnly.REQ_CHA = false;
  itemReadOnly.EMP_NM = false;
};

//코드리스트 선언
const codeList = reactive({
  //등록 정보
  REQ_DIV: [], // 신청구분
  YEAR: [], // 년도
  REQ_CHA: [], // 신청시기
  DUTY_YN: [
    { TXT: "대상", COD: "Y" },
    { TXT: "비대상", COD: "N" },
  ], // 대상여부(Y/N)
});

//코드리스트 셋팅
const initCodeList = async () => {
  const res = await Promise.all([
    // 등록 정보
    getCodeList("HHII811"), // 신청 구분
    getCodeList("HHII808A"), // 신청 시기 - 안전화
    getCodeList("HHII808C"), // 신청시기 - 안전장화
  ]);
  dataRes.value = res;

  itemField.YEAR = new Date().getFullYear().toString();
  codeList.REQ_DIV = res[0].ORESULT_CUR;

  console.log('itemField : ',itemField)

  if (itemField.REQ_DIV === "A") {
    codeList.REQ_CHA = dataRes.value[1].ORESULT_CUR;
    console.log('res : ', dataRes.value[1].ORESULT_CUR)
    if (!codeList.REQ_CHA.some((item) => item.TXT === "선택")) {
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  } else if (itemField.REQ_DIV === "B") {
    codeList.REQ_CHA = dataRes.value[2].ORESULT_CUR;
    if (!codeList.REQ_CHA.some((item) => item.TXT === "선택")) {
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  }

  codeList.REQ_DIV.unshift({ TXT: "선택", COD: "" });
  if (!codeList.REQ_CHA.some((item) => item.TXT === "선택")) {
    codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
  }
};

const changeReqDiv = async () => {
  codeList.REQ_CHA = [];
  itemField.REQ_CHA = "";

  if (itemField.REQ_DIV === "A") {
    codeList.REQ_CHA = dataRes.value[1].ORESULT_CUR;
    if (!codeList.REQ_CHA.some((item) => item.TXT === "선택")) {
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  } else if (itemField.REQ_DIV === "B") {
    codeList.REQ_CHA = dataRes.value[2].ORESULT_CUR;
    if (!codeList.REQ_CHA.some((item) => item.TXT === "선택")) {
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  } else {
    if (!codeList.REQ_CHA.some((item) => item.TXT === "선택")) {
      codeList.REQ_CHA.unshift({ TXT: "선택", COD: "" });
    }
  }
};

const openPopup = async (reqDiv, data) => {
  console.log('reqDiv : ', reqDiv)
  itemField.REQ_DIV = reqDiv;

  await initCodeList();

  console.log('codeList.REQ_CHA : ',codeList.REQ_CHA)

  if (data) {
    updateYn.value = true;
    itemField.UPDATE_YN = "Y";

    for (const [key, value] of Object.entries(data)) {
      if (itemField.hasOwnProperty(key)) {
        if (key === "REQ_CHA") {
          itemField[key] = value.substring(1);
        } else {
          itemField[key] = value;
        }
      }
    }
    itemReadOnly.REQ_DIV = true;
    itemReadOnly.YEAR = true;
    itemReadOnly.REQ_CHA = true;
    itemReadOnly.EMP_NM = true;
    // console.log('tyetsdf : ', data.YEAR)
    // itemField.YEAR = data.YEAR
  } else {
    updateYn.value = false;
  }
  await nextTick();
  dialog.value = true;
};

/* ------------- 팝업 ------------- */

//초기 데이터셋팅
onMounted(() => {
  //테스트
  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  //initCodeList()
});

/* ------------- 클릭 이벤트 ------------- */
const onButtonsClick = (btn) => {
  if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run();
    //onSelect();
  } else if (btn.id === "btnClose") {
    //초기화
    initItemField();
    dialog.value = false;
  }
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

const saveData = async () => {
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
    UPDATE_YN: itemField.UPDATE_YN,
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

const closePopup = async () => {
  //초기화
  await initItemField();
  dialog.value = false;
};

// 인원검색 팝업
const empPopupOpen = () => {
  if (!itemReadOnly.EMP_NM) empPopup.value.openPopup(itemField);
};

const selectedemp = (row) => {
  itemField.EMP_NO = row.EMP_NO;
  itemField.EMP_NM = row.EMP_NM;
  itemField.BSNS_CD = row.BSNS_CD;
  itemField.DEPT_CD = row.DEPT_CD;
  itemField.ASGN_CD = row.ASGN_CD;
  itemField.USER_DIV = row.USER_DIV;
  itemField.ASGN_NM = row.ASGN_NM;

  console.log(">????? : ", row);
};

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
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <!-- :height="370"  -->

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
          :use-permission="true"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex flex-gap">
              <i-select
                :label="$t('구분')"
                labelWidth="60px"
                v-model="itemField.REQ_DIV"
                :items="codeList.REQ_DIV"
                item-value="COD"
                item-title="TXT"
                topLabel
                :class="[
                  'custom-flex-1',
                  itemReadOnly.REQ_DIV
                    ? 'read-only' /* readonly일 때 붙일 클래스 */
                    : '' /* editable일 때 붙일 클래스 */,
                ]"
                required
                :readonly="itemReadOnly.REQ_DIV"
                @update:modelValue="changeReqDiv"
              />
              <i-select
                :label="$t('년도')"
                labelWidth="60px"
                v-model="itemField.YEAR"
                type="YEAR"
                topLabel
                :class="[
                  'custom-flex-1',
                  itemReadOnly.REQ_DIV
                    ? 'read-only' /* readonly일 때 붙일 클래스 */
                    : '' /* editable일 때 붙일 클래스 */,
                ]"
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
                topLabel
                :class="[
                  'custom-flex-1',
                  itemReadOnly.REQ_DIV
                    ? 'read-only' /* readonly일 때 붙일 클래스 */
                    : '' /* editable일 때 붙일 클래스 */,
                ]"
                required
                :readonly="itemReadOnly.REQ_CHA"
              />
              <span class="custom-flex-1" />
              <!-- v-model="options.values.EMP_NO" -->
            </div>
            <div class="mt-2 d-flex flex-gap">
              <i-input
                :label="$t('성명')"
                label-width="60px"
                topLabel
                class="custom-flex-1"
                appendInnerIcon="mdi-magnify"
                @click:appendInner="empPopupOpen"
                v-model="itemField.EMP_NM"
                required
                :readonly="itemReadOnly.EMP_NM"
              />
              <!-- inherit; -->
              <!-- :class="[
                  'custom-flex-1',
                  itemReadOnly.EMP_NM
                    ? 'no-edit' /* readonly일 때 붙일 클래스 */
                    : '' /* editable일 때 붙일 클래스 */,
                ]" -->
              <i-input
                :label="$t('부서')"
                label-width="60px"
                topLabel
                class="custom-flex-1"
                v-model="itemField.ASGN_NM"
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
                topLabel
                class="custom-flex-1"
                required
              />
              <span class="custom-flex-1" />
              <!-- v-model="options.values.EMP_NO" -->
            </div>
            <div class="mt-2 d-flex flex-gap">
              <i-textarea
                :label="$t('비고')"
                toplabel
                width="100%"
                v-model="itemField.REMARKS"
                class="custom-flex-1"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <EmpPopup ref="empPopup" @selected="selectedemp" />
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

.no-edit {
  pointer-events: none;
}
/* 
.read-only ::v-deep .v-autocomplete__selection-text {
  color: #999 !important;
}

.read-only ::v-deep .v-text-field__placeholder {
  color: #999 !important;
} */

/* .read-only ::v-deep .v-autocomplete__selection-text {
  color: #999 !important;
}
.read-only ::v-deep .v-input--is-focused .v-autocomplete__selection-text {
  color: #999 !important;
}
.read-only ::v-deep .v-text-field__placeholder {
  color: #999 !important;
}
.read-only ::v-deep .v-input--is-focused .v-text-field__placeholder {
  color: #999 !important;
} */

.read-only ::v-deep input,
.read-only ::v-deep .v-autocomplete__selection-text {
  color: #999 !important;
}

/* placeholder 까지 함께 덮어주고 싶으면 추가 */
.read-only ::v-deep .v-text-field__placeholder {
  color: #999 !important;
}

</style>
