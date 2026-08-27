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
const emit = defineEmits([])
const isCreate = ref(false)
const tab = ref('tab1')
const grdMain = ref(null)
const autoClose = ref(true);
const selectedRow = ref([]);
// 숫자 + 소수점 정규식
const numericRegex = /^-?\d+(\.\d+)?$/;

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR : dayjs().format("YYYY")
})

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: searchParam.YEAR,
  WORKER: '',
  NO_NEW_CNT: '',
  NO_RET_CNT: '',
  NO_TOT_CNT: '',
  MUS_NEW_CNT: '',
  MUS_RET_CNT: '',
  MUS_TOT_CNT: '',
  BR_NEW_CNT: '',
  BR_RET_CNT: '',
  BR_TOT_CNT: '',
  HEM_NEW_CNT: '',
  HEM_RET_CNT: '',
  HEM_TOT_CNT: '',
  CAR_NEW_CNT: '',
  CAR_RET_CNT: '',
  CAR_TOT_CNT: '',
  SKIN_NEW_CNT: '',
  SKIN_RET_CNT: '',
  SKIN_TOT_CNT: '',
  VIB_NEW_CNT: '',
  VIB_RET_CNT: '',
  VIB_TOT_CNT: '',
  ETC_NEW_CNT: '',
  ETC_RET_CNT: '',
  ETC_TOT_CNT: '',
  NO_NEW_RATE: '',
  NO_RET_RATE: '',
  NO_TOT_RATE: '',
  MUS_NEW_RATE: '',
  MUS_RET_RATE: '',
  MUS_TOT_RATE: '',
  BR_NEW_RATE: '',
  BR_RET_RATE: '',
  BR_TOT_RATE: '',
  HEM_NEW_RATE: '',
  HEM_RET_RATE: '',
  HEM_TOT_RATE: '',
  CAR_NEW_RATE: '',
  CAR_RET_RATE: '',
  CAR_TOT_RATE: '',
  SKIN_NEW_RATE: '',
  SKIN_RET_RATE: '',
  SKIN_TOT_RATE: '',
  VIB_NEW_RATE: '',
  VIB_RET_RATE: '',
  VIB_TOT_RATE: '',
  ETC_NEW_RATE: '',
  ETC_RET_RATE: '',
  ETC_TOT_RATE: '',
  USER_ID: userStore.userId
})

// 3. 페이지가 처음 로드될 때 실행
onMounted(() => {
  // grdSub.value.getGridView().filterPanel.visible = true;
  // grdMain.value.getGridView().filterPanel.visible = true;
  if (!searchParam.YEAR) {
    searchParam.YEAR = dayjs().format("YYYY");
  }
})

const closePopup = () => {
  emit("closed")
  dialog.value = false;
}


const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      // .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    // .setAfter(()=>{
    //   searchData()
    // })
    .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const searchData = () => {
  console.log("searchParams", searchParam)
  // console.log("searchParams", props.searchParams)
  return commonSearchApi({
    queryId: 'HLTCA0020_SEARCH5_10_POPUP',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  // console.log('조회', res.ORESULT_CUR)

  const row = (res?.ORESULT_CUR && res.ORESULT_CUR[0]) || {}

  // 숫자로 들어온 값을 그대로 매핑
  saveParams.WORKER    = row.WORKER    ?? null;
  saveParams.NO_NEW_CNT    = row.NO_NEW_CNT    ?? null;
  saveParams.NO_RET_CNT    = row.NO_RET_CNT    ?? null;
  saveParams.NO_TOT_CNT    = row.NO_TOT_CNT    ?? null;

  saveParams.MUS_NEW_CNT   = row.MUS_NEW_CNT   ?? null;
  saveParams.MUS_RET_CNT   = row.MUS_RET_CNT   ?? null;
  saveParams.MUS_TOT_CNT   = row.MUS_TOT_CNT   ?? null;

  saveParams.BR_NEW_CNT    = row.BR_NEW_CNT    ?? null;
  saveParams.BR_RET_CNT    = row.BR_RET_CNT    ?? null;
  saveParams.BR_TOT_CNT    = row.BR_TOT_CNT    ?? null;

  saveParams.HEM_NEW_CNT   = row.HEM_NEW_CNT   ?? null;
  saveParams.HEM_RET_CNT   = row.HEM_RET_CNT   ?? null;
  saveParams.HEM_TOT_CNT   = row.HEM_TOT_CNT   ?? null;

  saveParams.CAR_NEW_CNT   = row.CAR_NEW_CNT   ?? null;
  saveParams.CAR_RET_CNT   = row.CAR_RET_CNT   ?? null;
  saveParams.CAR_TOT_CNT   = row.CAR_TOT_CNT   ?? null;

  saveParams.SKIN_NEW_CNT  = row.SKIN_NEW_CNT  ?? null;
  saveParams.SKIN_RET_CNT  = row.SKIN_RET_CNT  ?? null;
  saveParams.SKIN_TOT_CNT  = row.SKIN_TOT_CNT  ?? null;

  saveParams.VIB_NEW_CNT   = row.VIB_NEW_CNT   ?? null;
  saveParams.VIB_RET_CNT   = row.VIB_RET_CNT   ?? null;
  saveParams.VIB_TOT_CNT   = row.VIB_TOT_CNT   ?? null;

  saveParams.ETC_NEW_CNT   = row.ETC_NEW_CNT   ?? null;
  saveParams.ETC_RET_CNT   = row.ETC_RET_CNT   ?? null;
  saveParams.ETC_TOT_CNT   = row.ETC_TOT_CNT   ?? null;

  saveParams.NO_NEW_RATE   = row.NO_NEW_RATE   ?? null;
  saveParams.NO_RET_RATE   = row.NO_RET_RATE   ?? null;
  saveParams.NO_TOT_RATE   = row.NO_TOT_RATE   ?? null;

  saveParams.MUS_NEW_RATE  = row.MUS_NEW_RATE  ?? null;
  saveParams.MUS_RET_RATE  = row.MUS_RET_RATE  ?? null;
  saveParams.MUS_TOT_RATE  = row.MUS_TOT_RATE  ?? null;

  saveParams.BR_NEW_RATE   = row.BR_NEW_RATE   ?? null;
  saveParams.BR_RET_RATE   = row.BR_RET_RATE   ?? null;
  saveParams.BR_TOT_RATE   = row.BR_TOT_RATE   ?? null;

  saveParams.HEM_NEW_RATE  = row.HEM_NEW_RATE  ?? null;
  saveParams.HEM_RET_RATE  = row.HEM_RET_RATE  ?? null;
  saveParams.HEM_TOT_RATE  = row.HEM_TOT_RATE  ?? null;

  saveParams.CAR_NEW_RATE  = row.CAR_NEW_RATE  ?? null;
  saveParams.CAR_RET_RATE  = row.CAR_RET_RATE  ?? null;
  saveParams.CAR_TOT_RATE  = row.CAR_TOT_RATE  ?? null;

  saveParams.SKIN_NEW_RATE = row.SKIN_NEW_RATE ?? null;
  saveParams.SKIN_RET_RATE = row.SKIN_RET_RATE ?? null;
  saveParams.SKIN_TOT_RATE = row.SKIN_TOT_RATE ?? null;

  saveParams.VIB_NEW_RATE  = row.VIB_NEW_RATE  ?? null;
  saveParams.VIB_RET_RATE  = row.VIB_RET_RATE  ?? null;
  saveParams.VIB_TOT_RATE  = row.VIB_TOT_RATE  ?? null;

  saveParams.ETC_NEW_RATE  = row.ETC_NEW_RATE  ?? null;
  saveParams.ETC_RET_RATE  = row.ETC_RET_RATE  ?? null;
  saveParams.ETC_TOT_RATE  = row.ETC_TOT_RATE  ?? null;
}

// 저장
const beforeSave = () => {
  // console.log("저장 파라미터:", params); //  디버깅 로그

  const year = Number(saveParams.YEAR);
  // console.log("year", year)
  if (year > 2024) {
    Message.warn("2025년 이전 데이터만 저장할 수 있습니다."); 
    return false;
  }

  return true;
};

const saveData = () => {

  // 변환이 필요한 키 목록
  const numberKeys = [
  "WORKER",
  "NO_NEW_CNT",
  "NO_RET_CNT",
  "NO_TOT_CNT",
  "MUS_NEW_CNT",
  "MUS_RET_CNT",
  "MUS_TOT_CNT",
  "BR_NEW_CNT",
  "BR_RET_CNT",
  "BR_TOT_CNT",
  "HEM_NEW_CNT",
  "HEM_RET_CNT",
  "HEM_TOT_CNT",
  "CAR_NEW_CNT",
  "CAR_RET_CNT",
  "CAR_TOT_CNT",
  "SKIN_NEW_CNT",
  "SKIN_RET_CNT",
  "SKIN_TOT_CNT",
  "VIB_NEW_CNT",
  "VIB_RET_CNT",
  "VIB_TOT_CNT",
  "ETC_NEW_CNT",
  "ETC_RET_CNT",
  "ETC_TOT_CNT",

  "NO_NEW_RATE",
  "NO_RET_RATE",
  "NO_TOT_RATE",
  "MUS_NEW_RATE",
  "MUS_RET_RATE",
  "MUS_TOT_RATE",
  "BR_NEW_RATE",
  "BR_RET_RATE",
  "BR_TOT_RATE",
  "HEM_NEW_RATE",
  "HEM_RET_RATE",
  "HEM_TOT_RATE",
  "CAR_NEW_RATE",
  "CAR_RET_RATE",
  "CAR_TOT_RATE",
  "SKIN_NEW_RATE",
  "SKIN_RET_RATE",
  "SKIN_TOT_RATE",
  "VIB_NEW_RATE",
  "VIB_RET_RATE",
  "VIB_TOT_RATE",
  "ETC_NEW_RATE",
  "ETC_RET_RATE",
  "ETC_TOT_RATE",
];

  // 얕은 복사 후 숫자 변환
  const params = { ...saveParams };

  for (const key of numberKeys) {
  if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
    if (!numericRegex.test(params[key])) {
      Message.warn(t(`${params[key]} 값이 올바른 숫자가 아닙니다`));
      return;   // 유효성 실패
    }
    params[key] = Number(params[key]);
  }
  }

  // console.log("저장전", params);
  return commonExecuteApi({ queryId : 'HLTCA0020_SEARCH5_10_SAVE', list: [params] })
}

// const afterSave = () => {
//   //그리드에 수정중 상태가 남아있어서 초기화
//   // grdSub.value.getDataProvider().clearRowStates(true, false)
//   // grdSub.value.getGridView().filterPanel.visible = true;
//   new queryFlowHelper(vm, t)
//     .setGridList([grdMain])
//     // .setQuery(searchData1)
//     // .setAfter(afterSearch1)
//     .run()
// }

const openPopup = () => {
  dialog.value = true;
}

defineExpose({
  openPopup,
})

const onYearChange = (val) => {
  // console.log("연도 선택 변경:", val)   // 선택된 값
  // console.log("searchParam.YEAR:", searchParam.YEAR) // v-model 값
  saveParams.YEAR = val
}
</script>

<template>
<v-dialog
    v-model="dialog"
    eager
    persistent
    width="300"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>데이터 업로드</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <v-sheet class="mr-3">
          <IGridTitle
            ref="menuTitle"
            :title="$t('데이터 업로드')"
            :button-list="['btnSearch', 'btnUpdate', 'btnClose']"
            @click-button="onButtonsClick"
            />
        </v-sheet>
        <i-select
                :label="$t('연도')"
                label-width="50px"
                width="200px"
                type="YEAR"
                v-model="searchParam.YEAR"
                style="margin-top: 10px"
                @update:model-value="onYearChange"
              />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column">
          <v-window v-model="tab" class="h-window">
            <v-window-item value="tab1">
              <div class="h-grow">
              <v-sheet class="pa-0 mr-3">
                <i-input
                  v-model="saveParams.WORKER"
                  :label="$t('근로자수')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_NEW_CNT"
                  :label="$t('소음성난청 신규')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_RET_CNT"
                  :label="$t('소음성난청 신규 중 퇴직자')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_TOT_CNT"
                  :label="$t('소음성난청 누적')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.MUS_NEW_CNT"
                  :label="$t('근골격계 신규')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.MUS_RET_CNT"
                  :label="$t('근골격계 신규 중 퇴직자')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.MUS_TOT_CNT"
                  :label="$t('근골격계 누적')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.BR_NEW_CNT"
                  :label="$t('호흡기계 신규')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.BR_RET_CNT"
                  :label="$t('호흡기계 신규 중 퇴직자')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.BR_TOT_CNT"
                  :label="$t('호흡기계 누적')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.HEM_NEW_CNT"
                  :label="$t('조혈기계 신규')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEM_RET_CNT"
                  :label="$t('조혈기계 신규 중 퇴직자')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEM_TOT_CNT"
                  :label="$t('조혈기계 누적')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.CAR_NEW_CNT"
                  :label="$t('뇌심혈기계 신규')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.CAR_RET_CNT"
                  :label="$t('뇌심혈기계 신규 중 퇴직자')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.CAR_TOT_CNT"
                  :label="$t('뇌심혈기계 누적')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.SKIN_NEW_CNT"
                  :label="$t('피부계 신규')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.SKIN_RET_CNT"
                  :label="$t('피부계 신규 중 퇴직자')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.SKIN_TOT_CNT"
                  :label="$t('피부계 누적')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.VIB_NEW_CNT"
                  :label="$t('진동 신규')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.VIB_RET_CNT"
                  :label="$t('진동 신규 중 퇴직자')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.VIB_TOT_CNT"
                  :label="$t('진동 누적')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.ETC_NEW_CNT"
                  :label="$t('기타 신규')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ETC_RET_CNT"
                  :label="$t('기타 신규 중 퇴직자')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ETC_TOT_CNT"
                  :label="$t('기타 누적')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <!-- RATE 필드들 -->
                <i-input
                  v-model="saveParams.NO_NEW_RATE"
                  :label="$t('소음성난청 발생율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_RET_RATE"
                  :label="$t('소음성난청 퇴직자비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_TOT_RATE"
                  :label="$t('소음성난청 질환중비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.MUS_NEW_RATE"
                  :label="$t('근골격계 발생율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.MUS_RET_RATE"
                  :label="$t('근골격계 퇴직자비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.MUS_TOT_RATE"
                  :label="$t('근골격계 질환중비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.BR_NEW_RATE"
                  :label="$t('호흡기계 발생율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.BR_RET_RATE"
                  :label="$t('호흡기계 퇴직자비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.BR_TOT_RATE"
                  :label="$t('호흡기계 질환중비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.HEM_NEW_RATE"
                  :label="$t('조혈기계 발생율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEM_RET_RATE"
                  :label="$t('조혈기계 퇴직자비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEM_TOT_RATE"
                  :label="$t('조혈기계 질환중비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.CAR_NEW_RATE"
                  :label="$t('뇌심혈기계 발생율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.CAR_RET_RATE"
                  :label="$t('뇌심혈기계 퇴직자비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.CAR_TOT_RATE"
                  :label="$t('뇌심혈기계 질환중비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.SKIN_NEW_RATE"
                  :label="$t('피부계 발생율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.SKIN_RET_RATE"
                  :label="$t('피부계 퇴직자비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.SKIN_TOT_RATE"
                  :label="$t('피부계 질환중비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.VIB_NEW_RATE"
                  :label="$t('진동 발생율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.VIB_RET_RATE"
                  :label="$t('진동 퇴직자비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.VIB_TOT_RATE"
                  :label="$t('진동 질환중비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.ETC_NEW_RATE"
                  :label="$t('기타 발생율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ETC_RET_RATE"
                  :label="$t('기타 퇴직자비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ETC_TOT_RATE"
                  :label="$t('기타 질환중비율')"
                  label-width="180px"
                  width="260px"
                  style="margin-bottom: 10px"
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
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 580px);
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>
