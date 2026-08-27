<!-- HLTLA0020 부서 감염병 관리 -->
<!-- SI2팀 손상규 2025-03-31 -->

<script setup>
import { ref } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import IMenuTitle from '@/components/IMenuTitle.vue'
import hltla0020tab01 from './HLTLA0020Tab01.vue'
import hltla0020tab02 from './HLTLA0020Tab02.vue'
import hltla0020tab03 from './HLTLA0020Tab03.vue'

defineOptions({
  name:'100_health-HLT_L-HLTLA0020',
}) 

const tab = ref('')

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle ref="menuTitle" :title="`${$t(useLogsStore().menuId)}`" />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet>
          <!-- 텝 -->
          <VTabs v-model="tab">
            <VTab value="CONFIRM">확진자 현황</VTab>
            <VTab value="CONTACT">접촉자 현황</VTab>
            <VTab value="MANAGER">관리자 지정</VTab>
            
          </VTabs>
          <!-- 텝아이템 -->
          <VWindow v-model="tab">
            <VWindowItem value="CONFIRM">
              <hltla0020tab01 />
            </VWindowItem>
            <VWindowItem value="CONTACT">
              <hltla0020tab02 />
            </VWindowItem>
            <VWindowItem value="MANAGER">
              <hltla0020tab03 />
            </VWindowItem>
          </VWindow>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
