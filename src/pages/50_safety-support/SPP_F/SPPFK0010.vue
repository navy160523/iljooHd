<!-- SPPFK0010 자체감사  -->
<!-- SI2팀 손상규 2025-06-16 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import { useUserStore } from "@hiway/stores/user";
import {
  commonSearchApi
} from "@hiway/api/commonApi";
import sppfk0010tab01 from './SPPFK0010Tab01.vue'
import sppfk0010tab02 from './SPPFK0010Tab02.vue'

defineOptions({
  name:'50_safety-support-SPP_F-SPPFK0010',
}) 
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const isAdmin = ref(false)
const userStore =  useUserStore()
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
            <VTab value="STATE">현황</VTab>
            <VTab value="CORRECTIVE">시정조치</VTab>
            
          </VTabs>
          <!-- 텝아이템 -->
          <VWindow v-model="tab">
            <VWindowItem value="STATE">
              <sppfk0010tab01 />
            </VWindowItem>
            <VWindowItem value="CORRECTIVE">
              <sppfk0010tab02 />
            </VWindowItem>
          </VWindow>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
