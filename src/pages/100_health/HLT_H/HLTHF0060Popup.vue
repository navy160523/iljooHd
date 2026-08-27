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
import saveFlowHelper from "@/utils/saveFlowHelper";
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";
import EmpPopup from "./HLTHF0060Popup_EMP.vue";

const dialog = ref(null);
const empPopup = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const emit = defineEmits(["Saved"]);
const oriDivision = ref("");
const empDiv = ref("");
const updateYn = ref(false);
const placeName = ref("");
const isAdmin = ref(0);

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  ASGN_CD: [],
  PLACE_CD: [],
});

const itemField = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장코드
  BSNS_CD: "", //사업부
  DEPT_CD: "", //부서
  USER_DIV: "", //직영구분
  ASGN_CD: "", //협력사
  ASGN_DISPLAY: "", //협력사 표시
  EMP_NO_MANAGER: "", //사번-담당자
  EMP_NM_MANAGER: "", //성명-담당자
  HND_PHN_MANAGER: "", //연락처-담당자
  EMP_NO_RECEIVER: "", //사번-수령자
  EMP_NM_RECEIVER: "", //성명-수령자
  HND_PHN_RECEIVER: "", //연락처-수령자
  PLACE_CD: "", //수령장소
  USER_ID: userStore.userId,
  REMARKS: "", //비고
  UPDATE_YN: "N", //수정 여부
  DISABLE: ['전체', '사내협력사'],
});

const readOnlyValue = reactive({
  BSNS_CD: false,
  DEPT_CD: true,
  VEND_CD: true,
  PLACE_CD: true,
});

const bsnsSearchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
});

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
    }), // 사업부
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR;
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" });
    codeList.DEPT_CD.unshift({ DEPT_NM: "선택", DEPT_CD: "" });
    codeList.ASGN_CD.unshift({ ASGN_NM: "미선택", ASGN_CD: "" });
    codeList.PLACE_CD.unshift({ TXT: "선택", COD: "" });
  });
};

const setDeptList = async () => {
  itemField.DEPT_CD = "";
  itemField.ASGN_CD = "";
  itemField.ASGN_DISPLAY = "";
  itemField.PLACE_CD = "";
  if (itemField.BSNS_CD === "") {
    readOnlyValue.DEPT_CD = true;
    readOnlyValue.ASGN_CD = true;
    readOnlyValue.PLACE_CD = true;
  } else {
    readOnlyValue.DEPT_CD = false;
    readOnlyValue.PLACE_CD = false;
  }

  codeList.DEPT_CD = [];
  codeList.PLACE_CD = [];

  Promise.all([
    commonSearchApi({
      queryId: "searchDept3",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: itemField.BSNS_CD,
        USE_DIV: "Y",
      },
    }),
    commonSearchApi({
      queryId: "HLTHF0060_SEARCH_PLACE",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: itemField.BSNS_CD,
      },
    }),
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR;
    codeList.DEPT_CD.unshift({ DEPT_NM: "선택", DEPT_CD: "" });

    codeList.PLACE_CD = res[1].ORESULT_CUR;
    codeList.PLACE_CD.unshift({ TXT: "선택", COD: "" });
  });
};

const clearEmp = async () => {
  itemField.EMP_NO_MANAGER = "";
  itemField.EMP_NM_MANAGER = "";
  itemField.HND_PHN_MANAGER = "";
  itemField.EMP_NO_RECEIVER = "";
  itemField.EMP_NM_RECEIVER = "";
  itemField.HND_PHN_RECEIVER = "";
};

const setVendList = async () => {
  await clearEmp();

  itemField.ASGN_CD = "";
  itemField.ASGN_DISPLAY = "";

  if (itemField.DEPT_CD === "") {
    readOnlyValue.VEND_CD = true;
  } else {
    readOnlyValue.VEND_CD = false;
  }

  codeList.ASGN_CD = [];

  await Promise.all([
    commonSearchApi({
      queryId: "searchVend",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: itemField.BSNS_CD,
        DEPT_CD: itemField.DEPT_CD,
        USE_DIV: "Y",
      },
    }),
  ]).then((res) => {
    codeList.ASGN_CD = res[0].ORESULT_CUR;
    codeList.ASGN_CD.unshift({ ASGN_NM: "미선택", ASGN_CD: "" });
  });
};

const openPopup = async (admin, data) => {
  itemField.CMPNY_DIV = userStore.cmpnyDiv;
  itemField.USER_ID = userStore.userId;

  dialog.value = true;

  isAdmin.value = admin;

  initCodeList();

  if (isAdmin.value === 0) {
    // 일반
    itemField.BSNS_CD = userStore.bsnsCd;
    await setDeptList();
    itemField.DEPT_CD = userStore.deptCd;
    await setVendList();
    if (userStore.userDiv === "A") {
      itemField.ASGN_DISPLAY = "";
      itemField.ASGN_CD = userStore.asgnCd;
    } else {
      itemField.ASGN_DISPLAY = userStore.asgnCd;
      itemField.ASGN_CD = userStore.asgnCd;
    }

    readOnlyValue.BSNS_CD = true;
    readOnlyValue.DEPT_CD = true;
    readOnlyValue.VEND_CD = true;
    updateYn.value = false;

    

    if (data) {
      updateYn.value = true;
      itemField.UPDATE_YN = "Y";
      if (codeList.ASGN_CD.some((item) => item.ASGN_CD === data.ASGN_CD)) {
        itemField.ASGN_DISPLAY = data.ASGN_CD;
      }

      for (const [key, value] of Object.entries(data)) {
        if (itemField.hasOwnProperty(key)) {
          itemField[key] = value;
        }
      }
    }

  } else {
    //보건관리과
    updateYn.value = false;
    if (data) {
      updateYn.value = true;
      itemField.UPDATE_YN = "Y";

      itemField.BSNS_CD = data.BSNS_CD;
      setDeptList();
      itemField.DEPT_CD = data.DEPT_CD;
      itemField.PLACE_CD = data.PLACE_CD;
      await setVendList();

      if (codeList.ASGN_CD.some((item) => item.ASGN_CD === data.ASGN_CD)) {
        itemField.ASGN_DISPLAY = data.ASGN_CD;
      }

      for (const [key, value] of Object.entries(data)) {
        if (itemField.hasOwnProperty(key)) {
          itemField[key] = value;
        }
      }
      readOnlyValue.BSNS_CD = true;
      readOnlyValue.DEPT_CD = true;
      readOnlyValue.VEND_CD = true;
    }
  }
};

const closePopup = () => {
  dialog.value = false;
  //초기화
  readOnlyValue.BSNS_CD = false; //년도 readonly 해제
  for (let i in itemField) {
    itemField[i] = "";
  }
};

// 인원검색 팝업
const empPopupOpen = (who) => {
  if (who === "R" && itemField.EMP_NO_MANAGER === "") {
    Message.warn(t("담당자를 선택해주세요."));
    return false;
  }

  let empNO =
    who === "M" ? itemField.EMP_NO_MANAGER : itemField.EMP_NO_RECEIVER;
  let managerYn = who === "M" ? true : false;

  empDiv.value = who;
  empPopup.value.openPopup(
    itemField,
    empNO,
    isAdmin.value,
    managerYn,
    updateYn.value,
  );
};

const selectedemp = (row) => {
  console.log("11111 : ", row);
  if (empDiv.value === "M") {
    itemField.BSNS_CD = row.BSNS_CD;
    itemField.DEPT_CD = row.DEPT_CD;
    itemField.ASGN_CD = row.ASGN_CD;

    itemField.EMP_NO_MANAGER = row.EMP_NO;
    itemField.EMP_NM_MANAGER = row.EMP_NM;
    itemField.HND_PHN_MANAGER = row.TEL_NO; //HND_PHN

    itemField.EMP_NO_RECEIVER = row.EMP_NO;
    itemField.EMP_NM_RECEIVER = row.EMP_NM;
    itemField.HND_PHN_RECEIVER = row.TEL_NO; //HND_PHN
  } else {
    if (!itemField.DEPT_CD === "" && !itemField.DEPT_CD === row.DEPT_CD) {
      Message.warn(t("담당자/수령자의 부서가 일치하지 않습니다."));
      return false;
    } else if (
      !itemField.ASGN_CD === "" &&
      !itemField.ASGN_CD === row.ASGN_CD
    ) {
      Message.warn(t("담당자/수령자의 조직이 일치하지 않습니다."));
      return false;
    } else {
      itemField.EMP_NO_RECEIVER = row.EMP_NO;
      itemField.EMP_NM_RECEIVER = row.EMP_NM;
      itemField.HND_PHN_RECEIVER = row.TEL_NO; //HND_PHN
    }
  }
  itemField.USER_DIV = row.USER_DIV;

  if (row.USER_DIV === "A") {
    itemField.ASGN_CD = row.ASGN_CD;
    itemField.ASGN_DISPLAY = "";
  } else {
    itemField.ASGN_CD = row.ASGN_CD;
    itemField.ASGN_DISPLAY = row.ASGN_CD;
    // if(itemField.ASGN_CD === '' || codeList.ASGN_CD.some(item => item.ASGN_CD === row.ASGN_CD)){
    //   itemField.ASGN_DISPLAY = row.ASGN_CD
    // }
  }

  readOnlyValue.BSNS_CD = true;
  readOnlyValue.DEPT_CD = true;
  readOnlyValue.VEND_CD = true;
};

const onButtonsClick = (btn) => {
  if (btn.id === "btnNew") {
    itemField.BSNS_CD = "";
    itemField.DEPT_CD = "";
    itemField.ASGN_CD = "";
    itemField.ASGN_DISPLAY = "";
    itemField.PLACE_CD = "";
    itemField.REMARKS = "";
    readOnlyValue.DEPT_CD = true;
    readOnlyValue.VEND_CD = true;
    readOnlyValue.PLACE_CD = true;
    readOnlyValue.BSNS_CD = false;

    clearEmp();
  } else if (btn.id === "btnUpdate") {
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
const beforeSave = async () => {
  if (!itemField.BSNS_CD) {
    Message.warn(t("사업부는 필수값 입니다."));
    return false;
  }
  if (!itemField.DEPT_CD) {
    Message.warn(t("부서명은 필수값 입니다."));
    return false;
  }
  if (!itemField.EMP_NM_MANAGER) {
    Message.warn(t("사번-담당자는 필수값 입니다."));
    return false;
  }
  if (!itemField.EMP_NM_RECEIVER) {
    Message.warn(t("사번-수령자는 필수값 입니다."));
    return false;
  }
  if (!itemField.PLACE_CD) {
    Message.warn(t("수령장소는 필수값 입니다."));
    return false;
  }

  if (itemField.UPDATE_YN != "Y") {
    let res = await saveCheck();
    if (res.ORESULT_CUR[0].CNT > 0) {
      Message.warn(t("해당 사업부/부서는 이미 등록되어 있습니다."));
      return false;
    }
  }

  // if(!dialog.value){
  //   let res = await saveCheck()
  //   console.log('resres : ',res)

  //   if(res.ORESULT_CUR[0].CNT > 0){
  //     Message.warn(t('해당 사업부/부서는 이미 등록되어 있습니다.'))
  //     return false
  //   }
  // }

  return true;
};

const saveData = () => {
  let saveParam = [];
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: itemField.BSNS_CD,
    DEPT_CD: itemField.DEPT_CD,
    ASGN_CD: itemField.ASGN_CD,
    EMP_NO_MANAGER: itemField.EMP_NO_MANAGER,
    EMP_NO_RECEIVER: itemField.EMP_NO_RECEIVER,
    PLACE_CD: itemField.PLACE_CD,
    REMARKS: itemField.REMARKS,
    USER_ID: userStore.userId,
    UPDATE_YN: itemField.UPDATE_YN,
  };

  saveParam.push(saveData);
  return commonExecuteApi({
    // queryId: 'HLTHF0060_SAVE_01',
    queryId: "HLTHF0060_SAVE_01",
    list: saveParam,
  });
};

const saveCheck = () => {
  let searchData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: itemField.BSNS_CD,
    DEPT_CD: itemField.DEPT_CD,
    ASGN_CD: itemField.ASGN_DISPLAY,
  };

  console.log("1231414 : ", searchData);

  return commonSearchApi({
    queryId: "HLTHF0060_SAVE_CHECK",
    param: searchData,
  });
};

const afterSave = (res) => {
  //emit('Saved')
  emit("End");
  closePopup();
};

// Enter 이벤트
const enterSearch = (who) => {
  empPopupOpen(who);
};

onMounted(() => {
  placeName.value = "";
});

const displayName = computed(() => placeName.value || "");

watch(
  () => itemField.DEPT_CD,
  (newValue, oldValue) => {
    if (newValue) {
      codeList.PLACE_CD = [];

      readOnlyValue.PLACE_CD = false;

      if (oldValue !== newValue) {
        commonSearchApi({
          queryId: "HLTHF0060_SEARCH_PLACE",
          param: {
            CMPNY_DIV: userStore.cmpnyDiv,
            BSNS_CD: itemField.BSNS_CD,
          },
        }).then((res) => {
          codeList.PLACE_CD = res.ORESULT_CUR;
          if (!codeList.PLACE_CD.some((item) => item.TXT === "선택")) {
            codeList.PLACE_CD.unshift({ TXT: "선택", COD: "" });
          }
        });
      }
    } else {
      itemField.PLACE_CD = "";
      readOnlyValue.PLACE_CD = true;
    }
  }
);

defineExpose({
  openPopup,
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
      <span>{{ displayName }}수령 정보 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="true"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <!-- <div class="d-flex flex-gap mb-2">
              <i-select
                :label="$t('사업부')"
                :items="codeList.BSNS_CD"
                width="100px"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                required
                top-label
                v-model="itemField.BSNS_CD"
                :disabled="readOnlyValue.BSNS_CD"
                class="custom-flex-1"
                @update:modelValue="setDeptList()"
              />
              <i-select
                :label="$t('부서명')"
                :items="codeList.DEPT_CD"
                width="100px"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                required
                top-label
                v-model="itemField.DEPT_CD"
                :disabled="readOnlyValue.DEPT_CD"
                class="custom-flex-1"
                @update:modelValue="setVendList()"
              />
              <i-select
                :label="$t('협력사')"
                :items="codeList.ASGN_CD"
                width="100px"
                item-title="ASGN_NM"
                item-value="ASGN_CD"
                top-label
                v-model="itemField.ASGN_DISPLAY"
                :disabled="readOnlyValue.VEND_CD"
                class="custom-flex-1"
              />
            </div> -->
            <div class="d-flex flex-gap mb-2">
              <i-input
                :label="$t('사번-담당자')"
                topLabel
                required
                v-model="itemField.EMP_NO_MANAGER"
                class="custom-flex-1"
                appendInnerIcon="mdi-magnify"
                :readonly="true"
                @click:appendInner="empPopupOpen('M')"
              />
              <i-input
                :label="$t('성명-담당자')"
                topLabel
                v-model="itemField.EMP_NM_MANAGER"
                class="custom-flex-1"
                :disabled="true"
              />
              <i-input
                :label="$t('연락처-담당자')"
                topLabel
                v-model="itemField.HND_PHN_MANAGER"
                class="custom-flex-1"
                :disabled="true"
              />
            </div>
            <div class="d-flex flex-gap mb-2">
              <i-input
                :label="$t('사번-수령자')"
                topLabel
                required
                :readonly="true"
                v-model="itemField.EMP_NO_RECEIVER"
                class="custom-flex-1"
                appendInnerIcon="mdi-magnify"
                @click:appendInner="empPopupOpen('R')"
              />
              <i-input
                :label="$t('성명-수령자')"
                topLabel
                v-model="itemField.EMP_NM_RECEIVER"
                class="custom-flex-1"
                :disabled="true"
              />
              <i-input
                :label="$t('연락처-수령자')"
                topLabel
                v-model="itemField.HND_PHN_RECEIVER"
                class="custom-flex-1"
                :disabled="true"
              />
            </div>
            <div class="d-flex flex-gap mb-2">
              <i-select
                :label="$t('수령장소')"
                :items="codeList.PLACE_CD"
                width="100px"
                item-title="TXT"
                item-value="COD"
                required
                top-label
                v-model="itemField.PLACE_CD"
                :disabled="readOnlyValue.PLACE_CD"
                class="custom-flex-1"
              />
              <span class="custom-flex-1" />
              <span class="custom-flex-1" />
            </div>
            <div class="d-flex flex-gap mb-2">
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
.form-row {
  display: flex;
  flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
  gap: 10px; /* 요소 간격 */
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
}

.flex-gap {
  gap: 10px;
}
</style>