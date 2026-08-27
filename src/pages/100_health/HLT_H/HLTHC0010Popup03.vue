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
const emit = defineEmits(["selected"]);
const suppliesDuty = ref(true);


const codeList = reactive({
  EYESIGHT_PLACE: [],
  REASON: [],
  SUPPLIES: [],
});

const inputParam = reactive({
  EYESIGHT_PLACE: '',
  REASON: '',
  SUPPLIES: ''
});

const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_PLACE",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
    getCodeList("HHIIG30A"),
    getCodeList("HHIIG30C"),
  ]);

  codeList.EYESIGHT_PLACE = res[0].ORESULT_CUR;
  codeList.SUPPLIES = res[1].ORESULT_CUR;
  codeList.REASON = res[2].ORESULT_CUR;
  
};

const openPopup = () => {
  dialog.value = true;
  initCodeList();
};

const closePopup = () => {
  dialog.value = false;
};

const onButtonsClick = (btn) => {
  if (btn.id === "btnRskCopyApp") {
    emit('selected', inputParam)
    closePopup();
  } else if (btn.id === "btnClose") {
    closePopup();
  }
};

const changeReason = async (val) => {
  if (val === "09") {
    suppliesDuty.value = false;
  } else {
    suppliesDuty.value = true;
    inputParam.SUPPLIES = "";
  }
};

const getsuppliesDuty = computed(() => {
  return suppliesDuty.value;
});

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
      <span>도수보안경 신청정보 일괄적용</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="true"
          :button-list="[
            'btnRskCopyApp', //적용
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="d-flex flex-gap">
              <i-select
                :label="$t('시력검사장소')"
                :items="codeList.EYESIGHT_PLACE"
                item-title="TXT"
                item-value="COD"
                labelWidth="80px"
                v-model="inputParam.EYESIGHT_PLACE"
                class="custom-flex-2"
              />
              <i-select
                :label="$t('신청사유')"
                :items="codeList.REASON"
                item-title="TXT"
                item-value="COD"
                labelWidth="60px"
                v-model="inputParam.REASON"
                class="custom-flex-1"
                @update:model-value="changeReason"
              />
              <i-select
                :label="$t('추가지급')"
                :items="codeList.SUPPLIES"
                item-title="TXT"
                item-value="COD"
                labelWidth="60px"
                v-model="inputParam.SUPPLIES"
                class="custom-flex-1"
                :disabled="getsuppliesDuty"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped>
.form-row {
  display: flex;
  flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
  gap: 10px; /* 요소 간격 */
}

.flex-gap {
  gap: 20px;
  flex-wrap: wrap;
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}
</style>