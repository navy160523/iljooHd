<!--
  화면명 : 변화요인 및 위험성 수준 설명 팝업
  화면개요 : 변화요인 및 위험성 수준 설명
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from '@/components/IMenuTitle.vue'
import { useI18n } from "vue-i18n"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
// import SelectEmpPopup from '@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0020Popup01.vue'
import FileUpload from '@/pages/20_risk-assessment/RSK_C/Popup/RSKCA0010Popup02.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(["selected"])
const dialog = ref(false)

const type = ref('')

// 팝업 오픈
const openPopup = popupParam => {
  dialog.value = true

  type.value = popupParam
}

// 버튼 클릭 이벤트 (팝업 닫기)
const onButtonsClick = btn => {
  if (btn.id === 'btnClose') {
    dialog.value = false
  }
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog 
    v-model="dialog" 
    eager 
    persistent 
    width="800"
    :height="type === 'CHANGE_MNG_CHK_LIST' ? '470' : '350'"
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
      <span v-if="type === 'CHANGE_MNG_CHK_LIST'">변화관리 체크리스트 설명</span>
      <span v-else>위험성 수준 설명</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-text class="pt-3 pb-0 content-area">
        <!-- 변화관리 체크리스트 -->
        <v-sheet class="flex-column h-auto" v-if="type === 'CHANGE_MNG_CHK_LIST'">
          <v-table width="100%">
            <thead>
              <tr>
                <th width="25%" class="text-center text-textMain thBg head_line">변화 요인</th>
                <th width="75%" class="text-center text-textMain thBg head_line">판단 기준</th>
              </tr>
              <tr>
                <th class="text-center thBg head_line">기술 변화</th>
                <td class="head_line">
                  <p>• 작업변경 또는 작업절차의 신규 도입 또는 변경</p>
                  <p>• 신선종 개발, 설계도 개정, 구매품목의 변경 등 연구 개발</p>
                </td>
              </tr>
              <tr>
                <th class="text-center thBg head_line">설비 변화</th>
                <td class="head_line">
                  <p>• 기계/기구/설비/원재료 등의 신규 도입 또는 변경</p>
                  <p>• 기계/기구/설비 등의 정비 또는 보수</p>
                </td>
              </tr>
              <tr>
                <th class="text-center thBg head_line">조직 변화</th>
                <td class="head_line">
                  <p>• 단기공사 및 건설공사 등 당사 현장에 익숙하지 않은 조직에서 수행하는 작업</p>
                </td>
              </tr>
              <tr>
                <th class="text-center thBg head_line">환경 변화</th>
                <td class="head_line">
                  <p>• 돌관 작업(작업표준 미존재)</p>
                  <p>• 작업 장소 변경(작업표준 미존재)이 발생한 작업</p> 
                </td>
              </tr>
              <tr>
                <th class="text-center thBg head_line">사고 발생</th>
                <td class="head_line">
                  <p>• 중대산업사고 또는 산업재해가 발생한 작업</p>
                </td>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
        <!-- 위험성 수준 -->
        <v-sheet class="flex-column h-auto" v-if="type === 'RISK_LEVEL'">
          <v-table width="100%">
            <thead>
              <tr>
                <th width="25%" class="text-center text-textMain thBg head_line" colspan='2'>위험성 수준</th>
                <th width="75%" class="text-center text-textMain thBg head_line">판단 기준</th>
              </tr>
              <tr>
                <th class="text-center thBg head_line">상</th>
                <th class="text-center thBg head_line">매우 높음</th>
                <td class="head_line">
                  <p>• 사고 발생 시 사망 또는 장애가 남을 수 있는 위험</p>
                </td>
              </tr>
              <tr>
                <th class="text-center thBg head_line">중</th>
                <th class="text-center thBg head_line">보통</th>
                <td class="head_line">
                  <p>• 사고 발생 시 요양이 필요한 위험 또는 사고 발생 시 3일의 휴업이 필요한 경우</p>
                  <p>• 아차사고 사례가 있는 경우</p>
                </td>
              </tr>
              <tr>
                <th class="text-center thBg head_line">하</th>
                <th class="text-center thBg head_line">매우 낮음</th>
                <td class="head_line">
                  <p>• 3일 미만의 휴업 또는 작업 수행에 영향을 미치지 않는 경미한 부상 또는 질병이 예상되는 경우</p>
                </td>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
        <v-sheet class="mt-3">
          <IMenuTitle
            :button-list="['btnClose']"
            @click-button="onButtonsClick"
          /> 
        </v-sheet>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}

.thBg{
  background-color: #e8eaf2;
}
div.v-table__wrapper.v-table .v-table__wrapper > table > thead > tr > th, td {
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); // 가로선
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));  // 세로선
}
.head_line {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));  // 세로선
}
</style>
