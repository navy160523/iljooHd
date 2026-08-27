<!-- 
  화면명 : 안전요원 등록/관리
  화면개요 : 장소, 호선/프로젝트별 안전요원 등록/관리 화면
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import IMenuTitle from '@/components/IMenuTitle.vue'
import TAB01 from '@/pages/80_operation/OPR_A/OPRAC0010_TAB01.vue'
import TAB02 from '@/pages/80_operation/OPR_A/OPRAC0010_TAB02.vue'

defineOptions({ 
  name:'80_operation-OPR_A-OPRAC0010',
})

// 변수 선언
const tab = ref('tab01')
const tab01 = ref(null)
const tab02 = ref(null)

// 안전팀배정 선택시 통합안전장소관리로 이동
const switchTab = () => {
  tab.value = 'tab02'
}
</script>

<template>
  
  <v-card class="pa-0 fill-height">
    <!-- 상단 제목 및 버튼-->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
  <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mb-2">
          <!-- 탭 -->
          <VTabs v-model="tab">
            <VTab value="tab01"> 안전요원 등록/관리 </VTab>
            <VTab value="tab02"> 안전팀 장소 배정 </VTab>
          </VTabs>
        </v-sheet>
        <!-- 탭 화면-->
        <VWindow v-model="tab">
          <VWindowItem value="tab01">
            <TAB01 ref="tab01" @switch-tab="switchTab"/>
          </VWindowItem>
          <VWindowItem value="tab02">
            <TAB02 ref="tab02"/>
          </VWindowItem>
        </VWindow>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
</style>