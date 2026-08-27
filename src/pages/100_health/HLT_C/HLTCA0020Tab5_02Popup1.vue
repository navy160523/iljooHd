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
  GAS_HI: '',
  GAS_LO: '',
  GAS_LOW_HI: '',
  GAS_LOW_LO: '',
  GAS_OVER_HI: '',
  GAS_OVER_LO: '',
  HEAT_HI: '',
  HEAT_LO: '',
  HEAT_LOW_HI: '',
  HEAT_LOW_LO: '',
  HEAT_OVER_HI: '',
  HEAT_OVER_LO: '',
  OIL_HI: '',
  OIL_LO: '',
  OIL_LOW_HI: '',
  OIL_LOW_LO: '',
  OIL_OVER_HI: '',
  OIL_OVER_LO: '',
  ACID_HI: '',
  ACID_LO: '',
  ACID_LOW_HI: '',
  ACID_LOW_LO: '',
  ACID_OVER_HI: '',
  ACID_OVER_LO: '',
  NO_HI: '',
  NO_LO: '',
  NO_LOW_HI: '',
  NO_LOW_LO: '',
  NO_OVER_HI: '',
  NO_OVER_LO: '',
  ORG_HI: '',
  ORG_LO: '',
  ORG_LOW_HI: '',
  ORG_LOW_LO: '',
  ORG_OVER_HI: '',
  ORG_OVER_LO: '',
  WEL_HI: '',
  WEL_LO: '',
  WEL_LOW_HI: '',
  WEL_LOW_LO: '',
  WEL_OVER_HI: '',
  WEL_OVER_LO: '',
  MET_HI: '',
  MET_LO: '',
  MET_LOW_HI: '',
  MET_LOW_LO: '',
  MET_OVER_HI: '',
  MET_OVER_LO: '',
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
    queryId: 'HLTCA0020_SEARCH5_02_POPUP',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  // console.log('조회', res.ORESULT_CUR)

  const row = (res?.ORESULT_CUR && res.ORESULT_CUR[0]) || {}

  // 숫자로 들어온 값을 그대로 매핑
  saveParams.GAS_HI = row.GAS_HI ?? null
  saveParams.GAS_LO = row.GAS_LO ?? null
  saveParams.GAS_LOW_HI = row.GAS_LOW_HI ?? null
  saveParams.GAS_LOW_LO = row.GAS_LOW_LO ?? null
  saveParams.GAS_OVER_HI = row.GAS_OVER_HI ?? null
  saveParams.GAS_OVER_LO = row.GAS_OVER_LO ?? null

  saveParams.HEAT_HI = row.HEAT_HI ?? null
  saveParams.HEAT_LO = row.HEAT_LO ?? null
  saveParams.HEAT_LOW_HI = row.HEAT_LOW_HI ?? null
  saveParams.HEAT_LOW_LO = row.HEAT_LOW_LO ?? null
  saveParams.HEAT_OVER_HI = row.HEAT_OVER_HI ?? null
  saveParams.HEAT_OVER_LO = row.HEAT_OVER_LO ?? null

  saveParams.OIL_HI = row.OIL_HI ?? null
  saveParams.OIL_LO = row.OIL_LO ?? null
  saveParams.OIL_LOW_HI = row.OIL_LOW_HI ?? null
  saveParams.OIL_LOW_LO = row.OIL_LOW_LO ?? null
  saveParams.OIL_OVER_HI = row.OIL_OVER_HI ?? null
  saveParams.OIL_OVER_LO = row.OIL_OVER_LO ?? null

  saveParams.ACID_HI = row.ACID_HI ?? null
  saveParams.ACID_LO = row.ACID_LO ?? null
  saveParams.ACID_LOW_HI = row.ACID_LOW_HI ?? null
  saveParams.ACID_LOW_LO = row.ACID_LOW_LO ?? null
  saveParams.ACID_OVER_HI = row.ACID_OVER_HI ?? null
  saveParams.ACID_OVER_LO = row.ACID_OVER_LO ?? null

  saveParams.NO_HI = row.NO_HI ?? null
  saveParams.NO_LO = row.NO_LO ?? null
  saveParams.NO_LOW_HI = row.NO_LOW_HI ?? null
  saveParams.NO_LOW_LO = row.NO_LOW_LO ?? null
  saveParams.NO_OVER_HI = row.NO_OVER_HI ?? null
  saveParams.NO_OVER_LO = row.NO_OVER_LO ?? null

  saveParams.ORG_HI = row.ORG_HI ?? null
  saveParams.ORG_LO = row.ORG_LO ?? null
  saveParams.ORG_LOW_HI = row.ORG_LOW_HI ?? null
  saveParams.ORG_LOW_LO = row.ORG_LOW_LO ?? null
  saveParams.ORG_OVER_HI = row.ORG_OVER_HI ?? null
  saveParams.ORG_OVER_LO = row.ORG_OVER_LO ?? null

  saveParams.WEL_HI = row.WEL_HI ?? null
  saveParams.WEL_LO = row.WEL_LO ?? null
  saveParams.WEL_LOW_HI = row.WEL_LOW_HI ?? null
  saveParams.WEL_LOW_LO = row.WEL_LOW_LO ?? null
  saveParams.WEL_OVER_HI = row.WEL_OVER_HI ?? null
  saveParams.WEL_OVER_LO = row.WEL_OVER_LO ?? null

  saveParams.MET_HI = row.MET_HI ?? null
  saveParams.MET_LO = row.MET_LO ?? null
  saveParams.MET_LOW_HI = row.MET_LOW_HI ?? null
  saveParams.MET_LOW_LO = row.MET_LOW_LO ?? null
  saveParams.MET_OVER_HI = row.MET_OVER_HI ?? null
  saveParams.MET_OVER_LO = row.MET_OVER_LO ?? null
}

// 저장
const beforeSave = () => {
  // console.log("저장 파라미터:", params); //  디버깅 로그

  const year = Number(saveParams.YEAR);
  // console.log("year", year)
  // if (year > 2020) {
  //   Message.warn("2021년 이전 데이터만 저장할 수 있습니다."); 
  //   return false;
  // }

  return true;
};

const saveData = () => {

  // 변환이 필요한 키 목록
  const numberKeys = [
  "GAS_HI", "GAS_LO", "GAS_LOW_HI", "GAS_LOW_LO", "GAS_OVER_HI", "GAS_OVER_LO",
  "HEAT_HI", "HEAT_LO", "HEAT_LOW_HI", "HEAT_LOW_LO", "HEAT_OVER_HI", "HEAT_OVER_LO",
  "OIL_HI", "OIL_LO", "OIL_LOW_HI", "OIL_LOW_LO", "OIL_OVER_HI", "OIL_OVER_LO",
  "ACID_HI", "ACID_LO", "ACID_LOW_HI", "ACID_LOW_LO", "ACID_OVER_HI", "ACID_OVER_LO",
  "NO_HI", "NO_LO", "NO_LOW_HI", "NO_LOW_LO", "NO_OVER_HI", "NO_OVER_LO",
  "ORG_HI", "ORG_LO", "ORG_LOW_HI", "ORG_LOW_LO", "ORG_OVER_HI", "ORG_OVER_LO",
  "WEL_HI", "WEL_LO", "WEL_LOW_HI", "WEL_LOW_LO", "WEL_OVER_HI", "WEL_OVER_LO",
  "MET_HI", "MET_LO", "MET_LOW_HI", "MET_LOW_LO", "MET_OVER_HI", "MET_OVER_LO"
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
  return commonExecuteApi({ queryId : 'HLTCA0020_SEARCH5_02_SAVE', list: [params] })
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
    width="350"
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
                  <!-- <RealGrid
                    ref="grdMain"
                    :grid-view-option="grdMainProps.gridViewOption"
                    :keys="grdMainProps.keys" 
                    :fields="grdMainProps.fields"
                    :columns="grdMainProps.columns"
                    style="height: 600px;"
                  /> -->

                  <i-input
                  v-model="saveParams.GAS_HI"
                  :label="$t('가스상태 물질류 측정건수 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.GAS_LO"
                  :label="$t('가스상태 물질류 측정건수 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.GAS_LOW_HI"
                  :label="$t('가스상태 노출기준 미만 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.GAS_LOW_LO"
                  :label="$t('가스상태 노출기준 미만 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.GAS_OVER_HI"
                  :label="$t('가스상태 노출기준 초과 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.GAS_OVER_LO"
                  :label="$t('가스상태 노출기준 초과 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEAT_HI"
                  :label="$t('고열 측정건수 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEAT_LO"
                  :label="$t('고열 측정건수 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEAT_LOW_HI"
                  :label="$t('고열 노출기준 미만 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEAT_LOW_LO"
                  :label="$t('고열 노출기준 미만 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEAT_OVER_HI"
                  :label="$t('고열 노출기준 초과 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.HEAT_OVER_LO"
                  :label="$t('고열 노출기준 초과 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.OIL_HI"
                  :label="$t('금속가공유 측정건수 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.OIL_LO"
                  :label="$t('금속가공유 측정건수 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.OIL_LOW_HI"
                  :label="$t('금속가공유 노출기준 미만 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.OIL_LOW_LO"
                  :label="$t('금속가공유 노출기준 미만 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.OIL_OVER_HI"
                  :label="$t('금속가공유 노출기준 초과 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.OIL_OVER_LO"
                  :label="$t('금속가공유 노출기준 초과 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ACID_HI"
                  :label="$t('산 및 알칼리류 측정건수 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ACID_LO"
                  :label="$t('산 및 알칼리류 측정건수 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ACID_LOW_HI"
                  :label="$t('산 및 알칼리류 노출기준 미만 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ACID_LOW_LO"
                  :label="$t('산 및 알칼리류 노출기준 미만 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ACID_OVER_HI"
                  :label="$t('산 및 알칼리류 노출기준 초과 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.ACID_OVER_LO"
                  :label="$t('산 및 알칼리류 노출기준 초과 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_HI"
                  :label="$t('소음 측정건수 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_LO"
                  :label="$t('소음 측정건수 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_LOW_HI"
                  :label="$t('소음 노출기준 미만 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_LOW_LO"
                  :label="$t('소음 노출기준 미만 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_OVER_HI"
                  :label="$t('소음 노출기준 초과 상반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NO_OVER_LO"
                  :label="$t('소음 노출기준 초과 하반기')"
                  label-width="210px"
                  width="310px"
                  style="margin-bottom: 10px"
                />
                <i-input
                v-model="saveParams.ORG_HI"
                :label="$t('유기화합물 측정건수 상반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.ORG_LO"
                :label="$t('유기화합물 측정건수 하반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.ORG_LOW_HI"
                :label="$t('유기화합물 노출기준 미만 상반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.ORG_LOW_LO"
                :label="$t('유기화합물 노출기준 미만 하반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.ORG_OVER_HI"
                :label="$t('유기화합물 노출기준 초과 상반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.ORG_OVER_LO"
                :label="$t('유기화합물 노출기준 초과 하반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />

              <i-input
                v-model="saveParams.WEL_HI"
                :label="$t('용접흄 측정건수 상반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.WEL_LO"
                :label="$t('용접흄 측정건수 하반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.WEL_LOW_HI"
                :label="$t('용접흄 노출기준 미만 상반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.WEL_LOW_LO"
                :label="$t('용접흄 노출기준 미만 하반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.WEL_OVER_HI"
                :label="$t('용접흄 노출기준 초과 상반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.WEL_OVER_LO"
                :label="$t('용접흄 노출기준 초과 하반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />

              <i-input
                v-model="saveParams.MET_HI"
                :label="$t('금속류 및 기타분진(용접흄 제외) 측정건수 상반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.MET_LO"
                :label="$t('금속류 및 기타분진(용접흄 제외) 측정건수 하반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.MET_LOW_HI"
                :label="$t('금속류 및 기타분진(용접흄 제외) 노출기준 미만 상반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.MET_LOW_LO"
                :label="$t('금속류 및 기타분진(용접흄 제외) 노출기준 미만 하반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.MET_OVER_HI"
                :label="$t('금속류 및 기타분진(용접흄 제외) 노출기준 초과 상반기')"
                label-width="210px"
                  width="310px"
                style="margin-bottom: 10px"
              />
              <i-input
                v-model="saveParams.MET_OVER_LO"
                :label="$t('금속류 및 기타분진(용접흄 제외) 노출기준 초과 하반기')"
                label-width="210px"
                  width="310px"
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
