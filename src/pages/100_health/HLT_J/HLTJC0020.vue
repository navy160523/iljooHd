<!-- 
  화면명 : 유소견 통계
  화면개요 : 유소견 통계
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import IMenuTitle from '@/components/IMenuTitle.vue'
import TAB01 from '@/pages/100_health/HLT_J/HLTJC0020_Tab01.vue'
import TAB02 from '@/pages/100_health/HLT_J/HLTJC0020_Tab02.vue'

defineOptions({
  name:'100_health-HLT_J-HLTJC0020',
})

// 변수 선언
const tab = ref('tab01')
const tab01 = ref(null)
const tab02 = ref(null)

</script>

<template>
  
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="mb-2">
            <!-- 탭 -->
            <VTabs v-model="tab">
              <VTab value="tab01"> 유소견 발생건수 </VTab>
              <VTab value="tab02"> 유소견 발생건수/ 발생률 </VTab>
            </VTabs>
          </v-sheet>
          <!-- 탭 화면-->
          <VWindow v-model="tab">
            <VWindowItem value="tab01">
              <TAB01 ref="tab01"/>
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