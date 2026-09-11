<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import IUpload from "@/components/IUpload.vue"
import { lowerCase } from "lodash-es"
import SAFDC0010_01 from "./SAFDC0010_01.vue"
import SAFDC0010_02 from "./SAFDC0010_02.vue"

defineOptions({
  name: "30_safety-SAF_D-SAFDC0010",
})

const vm = getCurrentInstance()?.proxy //다이얼로그관련 //2026.09.11 수정
const t = useI18n().t //다국어
const menuTitle = ref(null)
const userStore = useUserStore()
const { sliSAFDC0010 } = history.state || {} //2026.09.11 수정
const value = ref(sliSAFDC0010 === undefined ? "A" : (sliSAFDC0010?.GUBUN || "A")) //2026.09.11 수정
const componentMap = {
  A: SAFDC0010_01,
  B: SAFDC0010_02,
}
const tab = ref(sliSAFDC0010?.GUBUN || "A") //2026.09.11 수정
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="`${useLogsStore().menuId ? $t(useLogsStore().menuId) : '안전수칙위반'}`"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-tabs v-model="tab">
          <v-tab value="A">
            안전수칙위반 등록/현황
          </v-tab>

          <v-tab value="B">
            안전수칙위반 승인
          </v-tab>
        </v-tabs>

        <SAFDC0010_01 v-if="tab === 'A'" />

        <SAFDC0010_02 v-else-if="tab === 'B'" />
      </div>
    </v-card-text>
  </v-card>
</template>
