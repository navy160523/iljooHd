<!-- 보건관리계획서 주기(2024년도 하반기) 팝업 -->
<!-- SI2팀 손상규 2025-04-27 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IMenuTitle from '@/components/IMenuTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'

let dialog = ref(false)
const emit = defineEmits(['upData'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const tab = ref('')

// 조회조건
const searchParams = reactive({
  CMPNY_DIV : '',
  YEAR: '',
  REQ_CHA: '',
  VEND_CD: ''
})

const dataParams = reactive({
  DETAIL_PLAN_A: '',
  DETAIL_PLAN_B: '',
  DETAIL_PLAN_C: '',
  DETAIL_PLAN_D: '',
  DETAIL_PLAN_E: '',
  DETAIL_PLAN_Z: '',
})
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .showMessage(true)
    .run()
}

const searchData = () => {
  console.log(searchParams);
  commonSearchApi({ queryId: 'HLTKB0020_SEARCH_04', param: searchParams }).then(res => {
    if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
      console.log(res.ORESULT_CUR[0])
      Object.assign(dataParams, res.ORESULT_CUR[0]);
    } else {
      // 결과가 없을 경우 초기화
      Object.keys(dataParams).forEach(key => dataParams[key] = '');
    }
  })
};

// 팝업
const openPopup = (popupParam) => {
  console.log("popupParam", popupParam)
  dialog.value = true

  searchParams.CMPNY_DIV = popupParam.searchParams.CMPNY_DIV
  searchParams.YEAR = popupParam.searchParams.YEAR
  searchParams.REQ_CHA = popupParam.searchParams.REQ_CHA
  searchParams.VEND_CD = popupParam.searchParams.VEND_CD

  getData()
}

const closePopup = () => {
  dialog.value = false
}

defineExpose({
  openPopup
})


</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    class="p-absolute user-select-none"
    width="700"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>보건관리계획서 기본정보</span>
    </v-sheet>
    <v-card class="pa-3 fill-height" style="background-color: white">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnClose']"
        @click-button="onButtonsClick"
        :hiddenManuel="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pa-0 h-auto">
          <v-tabs v-model="tab">
            <v-tab>이상지질</v-tab>
            <v-tab>간기능</v-tab>
            <v-tab>뇌심혈관</v-tab>
            <v-tab>폐기능</v-tab>
            <v-tab>난청</v-tab>
            <v-tab>기타</v-tab>
          </v-tabs>
          <!-- 텝아이템 -->
          <v-window v-model="tab">

            <!-- 이상지질 -->
            <v-window-item :key="'A'">
              <div class="pa-4 flex-grow-1 d-flex flex-column overflow-hidden">
                <v-textarea 
                  v-model="dataParams.DETAIL_PLAN_A"
                  variant="outlined"
                  rows="21"
                  readonly
                />
              </div>
            </v-window-item>

            <!-- 간기능 -->
            <v-window-item :key="'B'">
              <div class="pa-4 flex-grow-1 d-flex flex-column overflow-hidden">
                <v-textarea 
                  v-model="dataParams.DETAIL_PLAN_B"
                  variant="outlined"
                  rows="21"
                  readonly
                />
              </div>
            </v-window-item>

            <!-- 뇌심혈관 -->
            <v-window-item :key="'C'">
              <div class="pa-4 flex-grow-1 d-flex flex-column overflow-hidden">
                <v-textarea 
                  v-model="dataParams.DETAIL_PLAN_C"
                  variant="outlined"
                  rows="21"
                  readonly
                />
              </div>
            </v-window-item>

            <!-- 폐기능 -->
            <v-window-item :key="'D'">
              <div class="pa-4 flex-grow-1 d-flex flex-column overflow-hidden">
                <v-textarea 
                  v-model="dataParams.DETAIL_PLAN_D"
                  variant="outlined"
                  rows="21"
                  readonly
                />
              </div>
            </v-window-item>

            <!-- 난청 -->
            <v-window-item :key="'E'">
              <div class="pa-4 flex-grow-1 d-flex flex-column overflow-hidden">
                <v-textarea 
                  v-model="dataParams.DETAIL_PLAN_E"
                  variant="outlined"
                  rows="21"
                  readonly
                />
              </div>
            </v-window-item>

            <!-- 기타 -->
            <v-window-item :key="'Z'">
              <div class="pa-4 flex-grow-1 d-flex flex-column overflow-hidden">
                <v-textarea 
                  v-model="dataParams.DETAIL_PLAN_Z"
                  variant="outlined"
                  rows="21"
                  readonly
                />
              </div>
            </v-window-item>
          </v-window>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  </v-dialog>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (405px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    // min-height: 700px;
  }
}

</style>