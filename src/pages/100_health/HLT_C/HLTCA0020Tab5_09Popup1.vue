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
  NEW_CNT: '',
  NEW_RET_CNT: '',
  TOT_CNT: '',
  OCC_RATE: '',
  RET_RATE: '',
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
    queryId: 'HLTCA0020_SEARCH5_09_POPUP',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  // console.log('조회', res.ORESULT_CUR)

  const row = (res?.ORESULT_CUR && res.ORESULT_CUR[0]) || {}

  // 숫자로 들어온 값을 그대로 매핑
  saveParams.WORKER     = row.WORKER     ?? null
  saveParams.NEW_CNT     = row.NEW_CNT     ?? null
  saveParams.NEW_RET_CNT = row.NEW_RET_CNT ?? null
  saveParams.TOT_CNT     = row.TOT_CNT     ?? null
  saveParams.OCC_RATE    = row.OCC_RATE    ?? null
  saveParams.RET_RATE    = row.RET_RATE    ?? null
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
  "NEW_CNT",
  "NEW_RET_CNT",
  "TOT_CNT",
  "OCC_RATE",
  "RET_RATE"
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
  return commonExecuteApi({ queryId : 'HLTCA0020_SEARCH5_09_SAVE', list: [params] })
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
                  v-model="saveParams.NEW_CNT"
                  :label="$t('발생건수 신규')"
                  label-width="180px" 
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.NEW_RET_CNT"
                  :label="$t('발생건수 신규 중 퇴직자')"
                  label-width="180px" 
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.TOT_CNT"
                  :label="$t('발생건수 누적')"
                  label-width="180px" 
                  width="260px"
                  style="margin-bottom: 10px"
                />

                <i-input
                  v-model="saveParams.OCC_RATE"
                  :label="$t('발생율')"
                  label-width="180px" 
                  width="260px"
                  style="margin-bottom: 10px"
                />
                <i-input
                  v-model="saveParams.RET_RATE"
                  :label="$t('퇴직자 비율')"
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
