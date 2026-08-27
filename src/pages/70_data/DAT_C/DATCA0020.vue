<!-- 
  화면명 : 교육 자료
  화면개요 : 교육 자료 조회및 추가, 수정, 삭제, 등록 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { getCodeList, commonSendApi } from "@hiway/api/commonApi"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import IMenuTitle from "@/components/IMenuTitle.vue"
import TAB01 from "@/pages/70_data/DAT_C/DATCA0020_TAB01.vue"
import TAB02 from "@/pages/70_data/DAT_C/DATCA0020_TAB02.vue"
import TAB03 from "@/pages/70_data/DAT_C/DATCA0020_TAB03.vue"
import TAB04 from "@/pages/70_data/DAT_C/DATCA0020_TAB04.vue"
import TAB05 from "@/pages/70_data/DAT_C/DATCA0020_TAB05.vue"
import TAB06 from "@/pages/70_data/DAT_C/DATCA0020_TAB06.vue"

defineOptions({
  name: "70_data-DAT_C-DATCA0020",
})

const tab = ref("safety")

const safety = ref(null)
const health = ref(null)
const environment = ref(null)
const hishort = ref(null)
const youtube = ref(null)
const foreigner = ref(null)
const menuTitle = ref(null)
const userStore = useUserStore()
const userLogStore = useLogsStore()
const NOTICE_DIV_LIST = reactive({
  /* ***** 안전 영상교육 NOTICE_DIV LIST ***** */
  A: [],
  /* ***** 보건 영상교육 NOTICE_DIV LIST ***** */
  B: [],
  /* ***** 환경 영상교육 NOTICE_DIV LIST ***** */
  C: [],
  /* ***** Hi-short NOTICE_DIV LIST ***** */
  D: [],
  /* ***** youtube NOTICE_DIV LIST ***** */
  E: [],
})

const initCodeList = () => {
  Promise.all([
    getCodeList("HHIZ090FA"),
    getCodeList("HHIZ090FB"),
    getCodeList("HHIZ090FC"),
    getCodeList("HHIZ090FD"),
    getCodeList("HHIZ090FE"),
  ]).then((res) => {
    NOTICE_DIV_LIST.A = res[0].ORESULT_CUR
    NOTICE_DIV_LIST.B = res[1].ORESULT_CUR
    NOTICE_DIV_LIST.C = res[2].ORESULT_CUR
    NOTICE_DIV_LIST.D = res[3].ORESULT_CUR 
    NOTICE_DIV_LIST.E = res[4].ORESULT_CUR 
  })
}

const onButtonsClick = (btn) => {
  if (tab.value === "safety") {
    safety.value.onButtonsClick({ id: btn.id })
  } else if (tab.value === "health") {
    health.value.onButtonsClick({ id: btn.id })
  } else if (tab.value === "environment") {
    environment.value.onButtonsClick({ id: btn.id })
  } else if(tab.value === 'youtube'){
    youtube.value.onButtonsClick({ id: btn.id })
  } else if(tab.value === 'hishort'){
    hishort.value.onButtonsClick({ id: btn.id })
  } else if(tab.value === 'foreigner'){
    foreigner.value.onButtonsClick({ id: btn.id })
  }
}

onMounted(() => {
  initCodeList()
  onButtonsClick({ id: "btnSearch" })
})
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
          <v-tab value="safety">안전</v-tab>
          <v-tab value="health">보건</v-tab>
          <v-tab value="environment">환경</v-tab>
          <v-tab value="hishort">영상안전보건교육</v-tab>
          <v-tab value="youtube">유튜브 영상</v-tab>
          <v-tab value="foreigner">외국인전용영상</v-tab>
        </v-tabs>
      </v-sheet>
      <TAB01 ref="safety" v-if="tab == 'safety'" :NOTICE_DIV_LIST="NOTICE_DIV_LIST.A" />
      <TAB02 ref="health" v-else-if="tab == 'health'" :NOTICE_DIV_LIST="NOTICE_DIV_LIST.B" />
      <TAB03 ref="environment" v-else-if="tab == 'environment'" :NOTICE_DIV_LIST="NOTICE_DIV_LIST.C" />
      <TAB04 ref="hishort" v-else-if="tab == 'hishort'" :NOTICE_DIV_LIST="NOTICE_DIV_LIST.D" />
      <TAB05 ref="youtube" v-else-if="tab == 'youtube'" :NOTICE_DIV_LIST="NOTICE_DIV_LIST.E" />
      <TAB06 ref="foreigner" v-else />
    </v-card-text>
  </v-card>
</template>
