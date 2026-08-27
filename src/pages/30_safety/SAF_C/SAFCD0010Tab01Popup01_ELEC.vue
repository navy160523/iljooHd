<!-- 일상점검 등록 및 수정-->


<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFCD0010Tab01Popup01Tab01 from './SAFCD0010Tab01Popup01Tab01_ELEC.vue'
import SAFCD0010Tab01Popup01Tab02 from './SAFCD0010Tab01Popup01Tab02_ELEC.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const tab = ref(null)
const dialog = ref(false)
const sAFCD0010Tab01Popup01Tab01 = ref(null)
const sAFCD0010Tab01Popup01Tab02 = ref(null)
const tabReadOnlyValue = ref(true) //계획점검 결과등록 비활성화 플래그값
const tab1Name = ref('일상점검 결과 등록')
const tab2Name = ref('계획점검 결과 등록')
const receivedRowData = ref('')
const emit = defineEmits(['closePopup'])
const userStore = useUserStore()

const openPopup = () => {
  //일상점검결과 초기값 세팅
  sAFCD0010Tab01Popup01Tab01.value.setField()
  dialog.value = true
}

//일상점검 결과 등록 수정시 실행(점검내역 그리드 더블클릭했을때 실행)
const openPopup2 = (rowData) => {
  rowData.MODIFY = true
  receivedRowData.value = rowData

  vm.$nextTick(() => {
    dialog.value = true
    // //점검계획No가 있으면 계획점검대상을 저장했다는 뜻이므로 계획점검 결과등록 탭 활성화
    if (rowData.CHECK_PLAN_SEQ) {
      tabReadOnlyValue.value = false
    }
    tab1Name.value = '일상점검 결과 수정'
    tab2Name.value = '계획점검 결과 수정'
    sAFCD0010Tab01Popup01Tab01.value.dailyModify(receivedRowData.value)
  })
}

//팝업 닫을때 이벤트
const closePopup = () => {
  dialog.value = false
  sAFCD0010Tab01Popup01Tab01.value.initField() //일상점검 탭 초기화
  sAFCD0010Tab01Popup01Tab02.value.initField() //계획점검 탭 초기화
  tab.value = 'DAILY_REGIST' //일상점검 결과탭으로 이동하도록
  tabReadOnlyValue.value = true //계획점검 결과등록 비활성화
  //탭이름 원상복구
  tab1Name.value = '일상점검 결과 등록'
  tab2Name.value = '계획점검 결과 등록'
  //데이터비워줌
  receivedRowData.value = ''
  emit('closePopup')
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

//일상점검 결과등록에서 계획점검 대상을 선택하고 저장시 계획점검 결과등록 탭 활성화
const dailySaved = (data) => {
  //일상점검 최초등록시 계획점검을 선택하고 저장을했을때
  if (data.CHECK_PLAN_SEQ) {
    tabReadOnlyValue.value = false //계획점검 결과등록탭 활성화
    tab.value = 'PLAN_REGIST'
  }
  //일상점검 최초등록시 계획점검을 선택하고 저장하지 않았지만 수정에서 계획점검을 선택하고 저장 했을때
  if (receivedRowData.value && data.CHECK_PLAN_SEQ) {
    receivedRowData.value.CHECK_PLAN_SEQ = data.CHECK_PLAN_SEQ //저장하고나서 수정데이터에 CHECK_PLAN_SEQ를 넘겨줌 안넘겨주면 계획점검 조회할때 에러남
  }

  //일상점검 최초 등록시 실행하도록(사용자가 일상점검을 등록할때 계획점검을 선택하지 않고 등록하는 경우도 있기 때문에)
  if (!receivedRowData.value) {
    sAFCD0010Tab01Popup01Tab02.value.receivedPlanCheckedData(data) //계획점검 결과등록 탭에 데이터 넘겨줌
  }
}

// //일상점검 결과등록 화면이 마운트가 되면 데이터를 넘겨줌
// const mounted1 = () => {
//   sAFCD0010Tab01Popup01Tab01.value.dailyModify(receivedRowData.value)
// }

//계획점검 결과 수정 화면이 마운트가 되면 데이터를 넘겨줌
// const mounted2 = () => {
//   //탭이 활성화상태일때
//   if (tabReadOnlyValue.value === false) {
//     sAFCD0010Tab01Popup01Tab02.value.receivedPlanCheckedData(receivedRowData.value)
//   }
// }

//탭변경 감지
watch(
  () => tab.value,
  (newValue, oldValue) => {
    //계획점검 결과 수정탭이 클릭되면 데이터 넘겨줌
    //수정시에만 동작하도록(최초 등록시 계획점검을 등록한경우, 또는 계획점검을 등록하지않고 나중에 등록한경우)
    if (
      newValue === 'PLAN_REGIST' &&
      tabReadOnlyValue.value === false &&
      receivedRowData.value &&
      receivedRowData.value.MODIFY === true
    ) {
      sAFCD0010Tab01Popup01Tab02.value.receivedPlanCheckedData(
        receivedRowData.value
      )
    }
  }
)

defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1600"
    eager
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ tab1Name }}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="mt-2">
            <v-tabs v-model="tab">
              <v-tab value="DAILY_REGIST">{{ tab1Name }}</v-tab>
              <v-tab value="PLAN_REGIST" :disabled="tabReadOnlyValue">{{
                tab2Name
              }}</v-tab>
            </v-tabs>
            <v-window v-model="tab" class="h-window">
              <v-window-item value="DAILY_REGIST" eager>
                <SAFCD0010Tab01Popup01Tab01
                  ref="sAFCD0010Tab01Popup01Tab01"
                  @dailySaved="dailySaved"
                  @close="closePopup"
                ></SAFCD0010Tab01Popup01Tab01>
              </v-window-item>
              <v-window-item value="PLAN_REGIST" eager>
                <SAFCD0010Tab01Popup01Tab02
                  ref="sAFCD0010Tab01Popup01Tab02"
                ></SAFCD0010Tab01Popup01Tab02>
              </v-window-item>
            </v-window>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
