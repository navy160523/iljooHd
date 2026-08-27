<!-- 
  화면명 : 특수검진 유해인자
  화면개요 : 특수검진 유해인자
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import IMenuTitle from '@/components/IMenuTitle.vue'
import TAB01 from '@/pages/100_health/HLT_G/HLTGA0050_TAB01.vue'
import TAB02 from '@/pages/100_health/HLT_G/HLTGA0050_TAB02.vue'
import TAB03 from '@/pages/100_health/HLT_G/HLTGA0050_TAB03.vue'

defineOptions({ 
  name:'100_health-HLT_G-HLTGA0050', 
})

// 변수 선언
const tab = ref('tab01')
const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
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
            <VTab value="tab01"> 부서/직무 특수검진 유해인자 산출</VTab>
            <VTab value="tab03"> 부서/직무 특수검진 유해인자 현황 </VTab>
            <VTab value="tab02"> 유해인자 비교 </VTab>
          </VTabs>
        </v-sheet>
        <!-- 탭 화면-->
        <VWindow v-model="tab">
          <VWindowItem value="tab01" eager>
            <TAB01 ref="tab01"/>
          </VWindowItem>
          <VWindowItem value="tab03" eager>
            <TAB03 ref="tab03"/>
          </VWindowItem>
          <VWindowItem value="tab02" eager>
            <TAB02 ref="tab02"/>
          </VWindowItem>
        </VWindow>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
</style>