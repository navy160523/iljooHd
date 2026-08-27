<!-- 
  화면명 : 정기안전보건교육
  화면개요 : 정기안전보건교육 자료 조회및 추가, 수정, 삭제, 등록 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { getCodeList, commonSendApi } from "@hiway/api/commonApi"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi } from "@hiway/api/commonApi"
import TAB01 from "@/pages/70_data/DAT_C/DATCA0040_TAB01.vue"
import TAB02 from "@/pages/70_data/DAT_C/DATCA0040_TAB02.vue"
import TAB03 from "@/pages/70_data/DAT_C/DATCA0040_TAB03.vue"

defineOptions({
  name: "70_data-DAT_C-DATCA0040",
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const grdMain = ref(null)
const Popup = ref(null)
const tab = ref("criticalcase") //중대재해사례
const criticalcase = ref(null)
const immidiatereport = ref(null) //사고즉보
const statistic = ref(null) //사고통계

const onButtonsClick = (btn) => {
  if (tab.value === "criticalcase") {
    criticalcase.value.onButtonsClick({ id: btn.id })
  } else if (tab.value === "immidiatereport") {
    immidiatereport.value.onButtonsClick({ id: btn.id })
  } else {
    statistic.value.onButtonsClick({ id: btn.id })
  }
}
</script>
<template>
  <v-card>
    <v-card-title>
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text>
      <v-sheet>
        <v-tabs v-model="tab">
          <v-tab value="criticalcase">중대(성)재해 사례</v-tab>
          <v-tab value="immidiatereport">사고즉보</v-tab>
          <v-tab value="statistic">사고통계</v-tab>
        </v-tabs>
      </v-sheet>
    </v-card-text>
    <TAB01 ref="criticalcase" v-if="tab == 'criticalcase'"></TAB01>
    <TAB02 ref="immidiatereport" v-else-if="tab == 'immidiatereport'"></TAB02>
    <TAB03 ref="statistic" v-else></TAB03>
  </v-card>
</template>
