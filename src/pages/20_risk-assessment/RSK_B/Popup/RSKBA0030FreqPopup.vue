<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import CKViewer from "@/components/ckEditor/CKViewer.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IUpload from "@/components/IUpload.vue"

let dialog = ref(false)
const grdMain = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)

let isType = ''

const openPopup = (openParams) => {
  dialog.value = true
  isType = openParams
}

defineExpose({
  openPopup,
})

const divisionCell = {
  frequency: '발생 가능성(빈도)',
  intensity: '결과의 중대성(강도)',
}

const frequencyList = [
  {
    LEVEL: '매우 낮음',
    DISCRIPT_01: '• 사고 발생 가능성이 희박한 경우',
    DISCRIPT_02: '• 최근 3년 이내 사고가 발생한 사실이 없는 경우',
    DISCRIPT_03: '• 최근 3년 이내 아차사고가 1건도 발생되지 않은 경우',
    POINT: '1점',
  },
  {
    LEVEL: '낮음',
    DISCRIPT_01: '• 사고 발생 가능성이 낮은 경우',
    DISCRIPT_02: '• 최근 3년 이내 사고 즉보가 1건 발생한 경우',
    DISCRIPT_03: '• 최근 3년 이내 아차사고가 3건 미만 발생한 경우',
    POINT: '2점',
  },
  {
    LEVEL: '보통',
    DISCRIPT_01: '• 사고 발생 가능성이 있는 경우',
    DISCRIPT_02: '• 최근 3년 이내 사고 즉보가 2건 발생한 경우',
    DISCRIPT_03: '• 최근 3년 이내 이차사고가 3건 ~ 6건 발생한 경우',
    POINT: '3점',
  },
  {
    LEVEL: '높음',
    DISCRIPT_01: '• 사고 발생 가능성이 높은 경우',
    DISCRIPT_02: '• 최근 3년 이내 사고 즉보가 3건 ~ 4건 발생한 경우',
    DISCRIPT_03: '• 최근 3년 이내 이차사고가 7건 ~ 12건도 발생한 경우',
    POINT: '4점',
  },
  {
    LEVEL: '매우 높음',
    DISCRIPT_01: '• 사고 발생 가능성이 매우 높은 경우',
    DISCRIPT_02: '• 최근 3년 사고 즉보가 5건 이상 발생한 경우',
    DISCRIPT_03: '• 최근 3년 이내 이차사고가 13건 이상 발생한 경우',
    POINT: '5점',
  },
]

const intensityList = [
  {
    LEVEL: '비치료(응급처치)',
    DISCRIPT_01: '• 의사의 치료가 필요 없는 경우로 응급처치 후 복귀가 가능한 부상',
    DISCRIPT_02: '• 물적피해 금액이 100 만원 미만일 경우',
    DISCRIPT_03: '',
    POINT: '1점',
  },
  {
    LEVEL: '휴업불필요(경미상)',
    DISCRIPT_01: '• 응급조치 이상의 치료가 필요하지만 산업재해 요양신청 대상이 아닌 경미한 부상',
    DISCRIPT_02: '• 휴업일수가 휴일 포함 3일 미만인 경우(사고 발생일 제외)',
    DISCRIPT_03: '• 물적피해 금액이 100~1000 만원일 경우',
    POINT: '2점',
  },
  {
    LEVEL: '휴업필요(산재)',
    DISCRIPT_01: '• 산업재해 요양신청 대상으로 일정기간 이상 휴업을 요하는 부상',
    DISCRIPT_02: '• 휴업일수가 휴일 포함 3일 이상인 경우(사고 발생일 제외)',
    DISCRIPT_03: '• 물적피해 금액이 1000 만원 ~ 1 억원 일 경우',
    POINT: '3점',
  },
  {
    LEVEL: '중대성',
    DISCRIPT_01: '• 산재 요양 대상으로 휴업일수가 3개월 이상인 경우',
    DISCRIPT_02: '• 회사 기준에 따라 중대성 사고로 분류된 경우',
    DISCRIPT_03: '• 물적피해 금액이 1억원 ~ 10억원일 경우',
    POINT: '4점',
  },
  {
    LEVEL: '사망',
    DISCRIPT_01: '• 사망 또는 다수의 근로불능이 발생하는 경우',
    DISCRIPT_02: '• 물적피해 금액이 10억원을 초과하는 경우',
    POINT: '5점',
  },

]


const closePopup = () => {
  isType = ''
  dialog.value = false
}

onMounted(() => {
  grdMain.value.getDataProvider().setRows(data1)
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1000"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div 
      class="title-bar" 
      style="display: inline-flex; justify-content: space-between;" 
      @mousedown="startDragging"
    >
      <div v-if="isType === 'frequency'">위험성 추정 기준(빈도)</div>
      <div v-if="isType === 'intensity'">위험성 추정 기준(강도)</div>
      <div class="closePoint" @click="closePopup">
        <VIcon size="x-large">mdi-close-circle-outline</VIcon>
      </div>
    </div>
    <VContainer style="background-color: white">
      <VRow>
        <VCol cols="12">
          <VTable 
            density="comfortable" 
            class="text-center border nondrag"
            v-if="isType === 'frequency' ? list = frequencyList : list = intensityList"
          >
            <tbody>
              <tr height="20">
                <td colspan="2" class="border tdBg">
                  구분
                </td>
                <td class="border tdBg">
                  추정기준
                </td>
                <td class="border tdBg">
                  배점
                </td>
              </tr>
              <tr>
                <td
                  v-if="isType === 'frequency' ? cellNm = divisionCell.frequency : cellNm = divisionCell.intensity"
                  rowspan="6"
                  class="border"
                  width="160"
                >
                  {{ cellNm }}
                </td>
              </tr>
              <tr
                v-for="(item, i) in list"
                :key="i"
                width="150"
              >
                <td class="border">
                  {{ item.LEVEL }}
                </td>
                <td align="left" class="border">
                  {{ item.DISCRIPT_01 }}<br/>
                  {{ item.DISCRIPT_02 }}<br/>
                  {{ item.DISCRIPT_03 }}
                </td>
                <td class="border">
                  {{ item.POINT }}
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCol>
      </VRow>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.closePoint {
  align-self: center;
  cursor: pointer;
}

.tdBg{
  background-color: #e8eaf2;
}

.nondrag {
  -webkit-user-select: none;  
  -moz-user-select: none;  
  -ms-user-select: none;  
  -o-user-select: none;  
  user-select: none;
}
</style>

