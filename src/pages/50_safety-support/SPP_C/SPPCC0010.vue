<!-- 
  화면명   : 노동조합 작업중지 등록, 현황
  화면개요 : 노동조합 작업중지와 관련된 데이터 입력 및 조회 현황
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n"

import { createRouter, createWebHistory } from 'vue-router'
// 피난 계획서 등록
import StopRegister from '@/pages/50_safety-support/SPP_C/TAB/SPPCC0010_Tab01.vue'

// 자위 소방대 조직 등록
import StopSearch from '@/pages/50_safety-support/SPP_C/TAB/SPPCC0010_Tab02.vue'

import { useRouter, useRoute,useLink } from "vue-router";
// 소방훈련 실시현황 등록
import { isNull } from "lodash-es"

// defineOptions({
//   name: "50_safety-support-SPP_B-SPPBA0010",
// })
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const router = useRouter() 
const tab = ref(null)



onMounted(() => {
  tab.value = window.sessionStorage.getItem('TAB_ID')
  // console.log('tab id', tab.value)
  
  if(tab.value === null){
    tab.value = 'StopRegister'
  }
  // console.log('transfer DATA',transfer)
})

</script>

<template>
  <v-card class="pa-2 pt-0 fill-height">
    <v-card-title></v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pb-1">
          <v-tabs v-model="tab">
          <v-tab value="StopRegister">작업중지 등록</v-tab>
          <v-tab value="StopSearch">작업중지 현황</v-tab>
        </v-tabs>
      </v-sheet>
    <v-window v-model="tab" class="h-window">
      <!-- 작업중지 등록 화면 -->
      <v-window-item value="StopRegister">
        <StopRegister
        />
      </v-window-item>
      <!-- 작업중지 현황 화면 -->
      <v-window-item value="StopSearch">
        <StopSearch
        />
      </v-window-item>
    </v-window>
    </div>
    </v-card-text>
  </v-card>
</template>


