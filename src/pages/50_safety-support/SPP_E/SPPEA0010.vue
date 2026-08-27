<!-- 
  화면명 : 오토바이 등록
  화면개요 : 3개탭(등록, 현황, 강제등록) 으로 구성 조회, 추가, 수정, 삭제(말소), 등록 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import TAB01 from "@/pages/50_safety-support/SPP_E/SPPEA0010_TAB01.vue"
import TAB02 from "@/pages/50_safety-support/SPP_E/SPPEA0010_TAB02.vue"
import TAB03 from "@/pages/50_safety-support/SPP_E/SPPEA0010_TAB03.vue"
import TAB04 from "@/pages/50_safety-support/SPP_E/SPPEA0010_TAB04.vue"

defineOptions({
  name:'50_safety-support-SPP_E-SPPEA0010',
})

const t = useI18n().t //다국어
const tab = ref('TAB_01')
const userLogStore = useLogsStore()

const isAdmin = ref(userLogStore.isMenuAdmin) 

onMounted(() => {
  
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mt-1 mb-2">
          <v-tabs v-model="tab">
            <v-tab value="TAB_01">오토바이 현황</v-tab>
            <v-tab value="TAB_02">오토바이 등록</v-tab>
            <v-tab value="TAB_03" v-if="isAdmin === 'Y'">오토바이 강제등록(관리자 권한)</v-tab>
            <v-tab value="TAB_04" v-if="isAdmin === 'Y'">오토바이 등록번호 발급</v-tab>
          </v-tabs>
        </v-sheet>
        <v-window v-model="tab" class="h-window">
          <v-window-item value="TAB_01"><TAB01 /></v-window-item>
          <v-window-item value="TAB_02"><TAB02 /></v-window-item>
          <v-window-item value="TAB_03" v-if="isAdmin === 'Y'"><TAB03 /></v-window-item>
          <v-window-item value="TAB_04" v-if="isAdmin === 'Y'"><TAB04 /></v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px + 52px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
