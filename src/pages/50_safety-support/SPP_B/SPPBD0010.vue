<!-- 
  화면명   : 소방관리 자료 등록/관리
  화면개요 : 피난계획서, 소방대 조직, 소방훈련 실시 등록 자료 사업부별, 부서별 모니터링 페이지
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n"

// 피난 계획서 등록(부서별) 모니터링
import PlanMonitoring from '@/pages/50_safety-support/SPP_B/TAB/SPPBD0010_Tab01.vue'

// 자위 소방대 조직 등록(부서별) 모니터링
import FireBridgeMonitoring from '@/pages/50_safety-support/SPP_B/TAB/SPPBD0010_Tab02.vue'

// 소방훈련 실시현황 등록(부서별) 모니터링
import FireTrainingMonitoring from '@/pages/50_safety-support/SPP_B/TAB/SPPBD0010_Tab03.vue'

// defineOptions({
//   name: "50_safety-support-SPP_B-SPPBD0010",
// })

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const tab = ref(null)

onMounted(() => {})

</script>

<template>
  <v-card class="pa-2 pt-0 fill-height">
    <v-card-title></v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pb-1">
          <v-tabs v-model="tab">
            <v-tab value="PlanMonitoring">피난계획서 등록(부서별) 모니터링</v-tab>
            <v-tab value="FireBridgeMonitoring">자위소방대 조직등록(부서별) 모니터링</v-tab>
            <!-- <v-tab value="FireTrainingMonitoring">소방훈련 실시현황 등록(부서별) 모니터링</v-tab> -->
          </v-tabs>
        </v-sheet>
      <v-window v-model="tab" 
          class="h-window">
        <!-- 피난계획서 등록 화면 -->
        <v-window-item value="PlanMonitoring">
          <PlanMonitoring />
        </v-window-item>
        <!-- 소방대 조직등록 화면 -->
        <v-window-item value="FireBridgeMonitoring">
          <FireBridgeMonitoring />
        </v-window-item>
        <!-- 소방훈련 실시현황 등록 -->
        <!-- <v-window-item value="FireTrainingMonitoring">
          <FireTrainingMonitoring />
        </v-window-item> -->
      </v-window>
    </div>
    </v-card-text>
  </v-card>
</template>


<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (150px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
