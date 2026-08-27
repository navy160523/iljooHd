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
const dataRes = ref();
const selectDiv = ref("");

const codeList = reactive({
  division: [],
  itemName: [],
  deleteYn: [],
});

const itemField = reactive({
  DIVISION: "", // 안전보호구 구분
  ITEM_SEQ: "", //제품 순번
  ITEM_NAME: "", //품명
  MODEL: "", //모델명
  VEND_SEQ: "", //납품업체
  PASS_NO: "", //합격번호
  MAT_NO: "", //자재번호
  COST: "", //단가
  ORDER_NUM: "", //정렬순서
  DELETE_YN: "", //현재상태
  REMARK: "", //비고
  CAUTION: "", //주의사항
  FILE_ID: "", //사진
  UPDATE_YN: 'N',
});

const readOnlyValue = reactive({
  DIVISION: false,
  ITEM_SEQ: true,
});

const initCodeList = (division) => {
  Promise.all([
    //구분 조회
    getCodeList("HHII710"),
    //품명 조회
    getCodeList("HHII710A"),
    getCodeList("HHII710B"),
    getCodeList("HHII710C"),
  ]).then((res) => {
    dataRes.value = res;
    //구분
    codeList.division = res[0].ORESULT_CUR;
    codeList.division.unshift({ TXT: "선택", COD: "" });

    //품명
    switch (division) {
      case "A":
        codeList.itemName = res[1].ORESULT_CUR;
        break;
      case "B":
        codeList.itemName = res[2].ORESULT_CUR;
        break;
      case "C":
        codeList.itemName = res[3].ORESULT_CUR;
        break;
    }

    codeList.itemName.unshift({ TXT: "선택", COD: "" });
  });
};

const openPopup = (division) => {
  dialog.value = true;
  itemField.DIVISION = division;
  initCodeList(division);
};

const closePopup = () => {
  dialog.value = false;
  //초기화
  readOnlyValue.YEAR = false; //년도 readonly 해제
  readOnlyValue.REQ_CHA = false; //신청시기 readonly 해제
  for (let i in itemField) {
    itemField[i] = "";
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
  if (!itemField.YEAR) {
    Message.warn(t("년도는 필수값 입니다."));
    return false;
  } else if (!itemField.REQ_CHA) {
    Message.warn(t("신청시기는 필수값 입니다."));
    return false;
  } else if (!itemField.ST_DATE) {
    Message.warn(t("시작일은 필수값 입니다."));
    return false;
  } else if (!itemField.EN_DATE) {
    Message.warn(t("마감일은 필수값 입니다."));
    return false;
  } else if (itemField.ST_DATE > itemField.EN_DATE) {
    Message.warn(t("시작일은 마감일보다 클수없습니다."));
    return false;
  }
  return true;
};

const saveData = () => {
  let saveParam = [];
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    DIVISION: itemField.DIVISION,
    YEAR: itemField.YEAR,
    REQ_CHA: itemField.REQ_CHA,
    ST_DATE: itemField.ST_DATE.replaceAll("-", ""),
    EN_DATE: itemField.EN_DATE.replaceAll("-", ""),
    COM_ENT_DATE: itemField.COM_ENT_DATE.replaceAll("-", ""),
    REMARKS: itemField.REMARKS,
    USER_ID: userStore.userId,
    UPDATE_YN: itemField.UPDATE_YN,
  };

  console.log(itemField.ST_DATE.replaceAll("-", ""));

  saveParam.push(saveData);
  return commonExecuteApi({
    queryId: "HLTHF0010_SAVE_01",
    list: saveParam,
  });
};

const afterSave = (res) => {
  emit("Saved");
  closePopup();
};

//저장관련 로직 끝

const openPopup2 = (data, division) => {
  dialog.value = true;
  itemField.SAVE_YN = "Y"; //수정플래그값
  readOnlyValue.YEAR = true; //년도 readonly
  readOnlyValue.REQ_CHA = true; //신청시기 readonly
  itemField.DIVISION = division;
  for (const [key, value] of Object.entries(data)) {
    if (itemField.hasOwnProperty(key)) {
      itemField[key] = value;
    }
  }
  initCodeList(division);
};

onMounted(() => {});

defineExpose({
  openPopup,
  openPopup2,
});

const selectDivision = async () => {
  codeList.itemName = [];

  selectDiv.value = itemField.DIVISION;

  switch (itemField.DIVISION) {
    case "":
      codeList.itemName = [];
      break;
    case "A":
      codeList.itemName = [...dataRes.value[1].ORESULT_CUR];
      break;
    case "B":
      codeList.itemName = [...dataRes.value[2].ORESULT_CUR];
      break;
    case "C":
      codeList.itemName = [...dataRes.value[3].ORESULT_CUR];
      break;
  }

  codeList.itemName.unshift({ TXT: "선택", COD: "" });
  itemField.ITEM_NAME = "";
};

const divisionValidation = async (isOpen) => {
  if (itemField.DIVISION == "" && isOpen) {
    Message.warn(t("구분을 선택해주세요."));
  }
};
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="400"
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
      <span>제품 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-text class="pa-3 pt-2 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="d-flex flex-column mt-2 form-row">
              <div class="i-container">
                <div class="color-required"></div>
                <label class="i-label">{{ $t("구분") }}</label>
                <v-select
                  class="i-box"
                  :items="codeList.division"
                  item-title="TXT"
                  item-value="COD"
                  v-model="itemField.DIVISION"
                  :readonly="readOnlyValue.DIVISION"
                  @update:modelValue="selectDivision"
                >
                </v-select>
              </div>
              <div class="i-container">
                <div class="color-required"></div>
                <label class="i-label">{{ $t("순번") }}</label>
                <v-text-field
                  class="i-box"
                  type="text"
                  v-model="itemField.ITEM_SEQ"
                  :readonly="readOnlyValue.ITEM_SEQ"
                >
                </v-text-field>
              </div>
              <div class="i-container">
                <div class="color-required"></div>
                <label class="i-label">{{ $t("품명") }}</label>
                <!-- :label="$t('구분')" -->
                <v-select
                  class="i-box"
                  :items="codeList.itemName"
                  item-title="TXT"
                  item-value="COD"
                  v-model="itemField.ITEM_NAME"
                  @update:menu="divisionValidation"
                >
                </v-select>
              </div>
              <div class="i-container">
                <div class="color-required"></div>
                <label class="i-label">{{ $t("모델명") }}</label>
                <v-text-field
                  class="i-box"
                  type="text"
                  v-model="itemField.MODEL"
                >
                </v-text-field>
              </div>
              <div class="i-container">
                <div class="color-required"></div>
                <label class="i-label">{{ $t("납품업체") }}</label>
                <v-text-field
                  class="i-box"
                  type="text"
                  v-model="itemField.VEND_SEQ"
                >
                </v-text-field>
              </div>
              <div class="i-container">
                <div class="color-required"></div>
                <label class="i-label">{{ $t("합격번호") }}</label>
                <v-text-field
                  class="i-box"
                  type="text"
                  v-model="itemField.PASS_NO"
                >
                </v-text-field>
              </div>
              <div class="i-container">
                <div class="color-required"></div>
                <label class="i-label">{{ $t("자재번호") }}</label>
                <v-text-field
                  class="i-box"
                  type="text"
                  v-model="itemField.MAT_NO"
                >
                </v-text-field>
              </div>
              <div class="i-container">
                <div class="color-required"></div>
                <label class="i-label">{{ $t("단가") }}</label>
                <v-text-field
                  class="i-box"
                  type="text"
                  v-model="itemField.COST"
                >
                </v-text-field>
              </div>
              <div class="i-container">
                <div class="color-normal"></div>
                <label class="i-label">{{ $t("정렬순서") }}</label>
                <v-text-field
                  class="i-box"
                  type="text"
                  v-model="itemField.ORDER_NUM"
                >
                </v-text-field>
              </div>
              <div class="i-container">
                <div class="color-normal"></div>
                <label class="i-label">{{ $t("현재상태") }}</label>
                <!-- :label="$t('구분')" -->
                <v-select
                  class="i-box"
                  :items="codeList.deleteYn"
                  item-title="TXT"
                  item-value="COD"
                  v-model="itemField.DELETE_YN"
                >
                </v-select>
              </div>
              <div class="i-container iclt">
                <div class="color-normal"></div>
                <label class="i-label-textarea">{{ $t("비고") }}</label>
              </div>
              <div class="i-container pb-2">
                <v-textarea width="100%" rows="4" v-model="itemField.REMARK">
                </v-textarea>
              </div>
              <div class="i-container iclt">
                <div class="color-normal"></div>
                <label class="i-label-textarea">{{ $t("주의사항") }}</label>
              </div>
              <div class="i-container pb-2">
                <v-textarea width="100%" rows="1" v-model="itemField.CAUTION">
                </v-textarea>
              </div>
              <div class="i-container iclt">
                <div class="color-normal"></div>
                <label class="i-label-textarea">{{ $t("사진") }}</label>
              </div>
              <div class="i-container">
                <v-textarea width="100%" rows="6" v-model="itemField.FILE_ID">
                </v-textarea>
              </div>
            </div>
          </v-sheet>
        </div>
        <!-- class="pa-2" -->
        <v-card-title>
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
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped>
.form-row {
  display: flex;
  flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
  gap: 5px; /* 요소 간격 */
}

.i-container {
  display: flex;
  align-items: center;
}

.i-label {
  white-space: nowrap; /* 줄바꿈 방지 */
  font-weight: bold;
  flex: 8;
}

.i-label-textarea {
  white-space: nowrap; /* 줄바꿈 방지 */
  font-weight: bold;
  flex: 28;
}

.i-box {
  flex: 20;
}

.iclt {
  height: 35px;
}

.color-required {
  flex: 1;
  width: 8px; /* 원하는 크기로 조절 가능 */
  height: 24px; /* 텍스트 입력 높이에 맞춤 */
  background-color: #ff5733; /* 원하는 색상 */
  border-radius: 4px; /* 모서리 둥글게 */
  margin-right: 6px; /* label과 간격 조정 */
}

.color-normal {
  flex: 1;
  width: 8px; /* 원하는 크기로 조절 가능 */
  height: 24px; /* 텍스트 입력 높이에 맞춤 */
  background-color: #062f87; /* 원하는 색상 */
  border-radius: 4px; /* 모서리 둥글게 */
  margin-right: 6px; /* label과 간격 조정 */
}
</style>
