<script setup>
import IMenuTitle from "@/components/IGridTitle.vue";
import { ref, reactive, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from "@hiway/api/commonApi";
import Message from "@hiway/utils/notify";
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js";
import saveFlowHelper from "@/utils/saveFlowHelper";
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";

const dialog = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const emit = defineEmits(["Saved"]);

const codeList = reactive({
  REQ_CHA: [], //신청시기
});

const regularDeadlineField = reactive({
  YEAR: "", //년도
  REQ_CHA: "", //신청시기
  ST_DATE: "", //정기신청기간(FROM)
  EN_DATE: "", //정기신청기간(TO)
  SUSI_ST_DATE: "", //수시신청기간(FROM)
  SUSI_EN_DATE: "", //수시신청기간(TO)
  FOCUS_PRD: "", //집중운영기간
  NORM_PRD: "", //일반운영기간
  REMARKS: "", //비고
  SAVE_YN: "", //저장여부
});

const readOnlyValue = reactive({
  YEAR: false,
  REQ_CHA: false,
});

const initCodeList = () => {
  Promise.all([getCodeList("HHIT050")]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR;
  });
};

const openPopup = () => {
  dialog.value = true;
  regularDeadlineField.YEAR = new Date().getFullYear();
  let day = dayjs().format("MM-DD");
  //오늘 월-일과 비교해서 7월1일 이후면 하반기 아니면 상반기
  if (day >= "07-01") {
    regularDeadlineField.REQ_CHA = "1";
  } else {
    regularDeadlineField.REQ_CHA = "0";
  }
};

const closePopup = () => {
  dialog.value = false;
  //초기화
  readOnlyValue.YEAR = false; //년도 readonly 해제
  readOnlyValue.REQ_CHA = false; //신청시기 readonly 해제
  for (let i in regularDeadlineField) {
    regularDeadlineField[i] = "";
  }
};

const onButtonsClick = (btn) => {
  if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run();
  } else if (btn.id === "btnClose") {
    closePopup();
  }
};

//저장관련 로직 시작
const beforeSave = () => {
  if (!regularDeadlineField.YEAR) {
    Message.warn(t("년도는 필수값 입니다."));
    return false;
  } else if (!regularDeadlineField.REQ_CHA) {
    Message.warn(t("신청시기는 필수값 입니다."));
    return false;
  } else if (
    !regularDeadlineField.ST_DATE &&
    !regularDeadlineField.EN_DATE &&
    !regularDeadlineField.SUSI_ST_DATE &&
    !regularDeadlineField.SUSI_EN_DATE
  ) {
    Message.warn(t("정기 또는 수시신청 기간을 입력 해주세요."));
    return false;
  } else if (regularDeadlineField.ST_DATE > regularDeadlineField.EN_DATE) {
    Message.warn(t("정기신청 시작일은 마감일보다 클수없습니다."));
    return false;
  } else if (
    regularDeadlineField.SUSI_ST_DATE > regularDeadlineField.SUSI_EN_DATE
  ) {
    Message.warn(t("수시신청 시작일은 마감일보다 클수없습니다."));
    return false;
  } else if (
    !regularDeadlineField.FOCUS_PRD ||
    !regularDeadlineField.NORM_PRD
  ) {
    Message.warn(t("집중운영기간과 일반운영기간을 입력해주세요"));
    return false;
  }

  return true;
};

const saveData = () => {
  let saveParam = [];
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: regularDeadlineField.YEAR,
    REQ_CHA: regularDeadlineField.REQ_CHA,
    ST_DATE: regularDeadlineField.ST_DATE + "0800",
    EN_DATE: regularDeadlineField.EN_DATE + "2359",
    SUSI_ST_DATE: regularDeadlineField.SUSI_ST_DATE
      ? regularDeadlineField.SUSI_ST_DATE + "0800"
      : null,
    SUSI_EN_DATE: regularDeadlineField.SUSI_EN_DATE
      ? regularDeadlineField.SUSI_EN_DATE + "2359"
      : null,
    FOCUS_PRD: regularDeadlineField.FOCUS_PRD,
    NORM_PRD: regularDeadlineField.NORM_PRD,
    REMARKS: regularDeadlineField.REMARKS,
    USER_ID: userStore.userId,
  };
  saveParam.push(saveData);
  //SAVE_YN값이 없으면 신규저장
  if (!regularDeadlineField.SAVE_YN) {
    return commonExecuteApi({
      queryId: "CLDAB0010_SAVE_01",
      list: saveParam,
    });
  } else {
    return commonExecuteApi({
      queryId: "CLDAB0010_SAVE_02",
      list: saveParam,
    });
  }
  //SAVE_YN값이 있으면 수정
};

const afterSave = (res) => {
  emit("Saved");
  closePopup();
};

//저장관련 로직 끝

const openPopup2 = (data) => {
  dialog.value = true;
  regularDeadlineField.SAVE_YN = "Y"; //수정플래그값
  readOnlyValue.YEAR = true; //년도 readonly
  readOnlyValue.REQ_CHA = true; //신청시기 readonly
  for (const [key, value] of Object.entries(data)) {
    if (regularDeadlineField.hasOwnProperty(key)) {
      regularDeadlineField[key] = value;
    }
  }
};

onMounted(() => {
  initCodeList();
});

defineExpose({
  openPopup,
  openPopup2,
});
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>정기신청 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnUpdate', //저장
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="d-flex mt-2">
              <i-select
                :label="$t('년도')"
                width="100px"
                required
                top-label
                type="YEAR"
                v-model="regularDeadlineField.YEAR"
                :readonly="readOnlyValue.YEAR"
              >
              </i-select>
              <i-select
                :label="$t('신청시기')"
                width="150px"
                required
                top-label
                :items="codeList.REQ_CHA"
                item-title="TXT"
                item-value="COD"
                v-model="regularDeadlineField.REQ_CHA"
                :readonly="readOnlyValue.REQ_CHA"
              >
              </i-select>
              <i-input
                :label="$t('정기신청 시작일')"
                width="150px"
                required
                top-label
                type="date"
                v-model="regularDeadlineField.ST_DATE"
              >
              </i-input>
              <i-input
                :label="$t('정기신청 마감일')"
                width="150px"
                top-label
                required
                type="date"
                v-model="regularDeadlineField.EN_DATE"
              >
              </i-input>
              <i-input
                :label="$t('수시신청 시작일')"
                width="150px"
                required
                top-label
                type="date"
                v-model="regularDeadlineField.SUSI_ST_DATE"
              >
              </i-input>
              <i-input
                :label="$t('수시신청 마감일')"
                width="150px"
                top-label
                required
                type="date"
                v-model="regularDeadlineField.SUSI_EN_DATE"
              >
              </i-input>
            </div>
            <div class="mt-2 d-flex">
              <i-textarea
                :label="$t('집중운영기간')"
                width="48%"
                top-label
                required
                v-model="regularDeadlineField.FOCUS_PRD"
              >
              </i-textarea>
              <i-textarea
                :label="$t('일반운영기간')"
                width="48%"
                top-label
                required
                v-model="regularDeadlineField.NORM_PRD"
              >
              </i-textarea>
            </div>
            <div class="mt-2">
              <i-textarea
                :label="$t('비고')"
                top-label
                width="100%"
                v-model="regularDeadlineField.REMARKS"
              >
              </i-textarea>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
