<!-- 
  화면명   : Hi-SAFE 주제등록/관리
  화면개요 : Hi-SAFE 주제를 신규 등록하거나 내용 수정, 사업부 의견 및 평가 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { VWindow, VWindowItem } from 'vuetify/lib/components/index.mjs'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

// 데이터 비교
import CompareResult from '@/pages/60_edu/EDU_C/EDUCA0010_Tab01.vue'
// Hi-SAFE 주제 관리
import SearchResult from '@/pages/60_edu/EDU_C/EDUCA0010_Tab02.vue'

defineOptions({
  name: "60_edu-EDU_C-EDUCA0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const tab = ref(null)
const reRender = ref(0)



onMounted(() => {})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-tabs v-model="tab">
      <v-tab value="CompareResult">결과 분석</v-tab>
      <v-tab value="SearchResult">항목별 현황</v-tab>
    </v-tabs>
    <v-window v-model="tab">
      <!-- 주제 등록 화면 -->
      <v-window-item value="CompareResult">
        <CompareResult
          :key="reRender"
        />
      </v-window-item>
      <!-- 주제 관리 화면 -->
      <v-window-item value="SearchResult">
        <SearchResult
          :key="reRender"
        />
      </v-window-item>
    </v-window>
  </v-card>
</template>


