<!-- 
  화면명 : 교육 자료
  화면개요 : 교육 자료 조회및 추가, 수정, 삭제, 등록 화면
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { getCodeList } from "@hiway/api/commonApi"
import { useLogsStore } from "@hiway/stores/logs"
import IMenuTitle from "@/components/IMenuTitle.vue"
import TAB01 from "@/pages/70_data/DAT_C/DATCA0030_TAB01.vue"
import TAB02 from "@/pages/70_data/DAT_C/DATCA0030_TAB02.vue"
import TAB03 from "@/pages/70_data/DAT_C/DATCA0030_TAB03.vue"

defineOptions({
  name: "70_data-DAT_C-DATCA0030",
})

const tab = ref("safety")

const safety = ref(null)
const health = ref(null)
const environment = ref(null)

const NOTICE_DIV_LIST = reactive({
  /* ***** 안전 NOTICE_DIV LIST ***** */
  A: [],

  /* ***** 보건 NOTICE_DIV LIST ***** */
  B: [],

  /* ***** 환경 NOTICE_DIV LIST ***** */
  C: [],
})

const initCodeList = () => {
  Promise.all([getCodeList("HHIZ090EA"), getCodeList("HHIZ090EB"), getCodeList("HHIZ090EC")]).then((res) => {
    NOTICE_DIV_LIST.A = res[0].ORESULT_CUR
    NOTICE_DIV_LIST.B = res[1].ORESULT_CUR
    NOTICE_DIV_LIST.C = res[2].ORESULT_CUR

    NOTICE_DIV_LIST.A.unshift({ TXT: "전체", COD: "" })
    NOTICE_DIV_LIST.B.unshift({ TXT: "전체", COD: "" })
    NOTICE_DIV_LIST.C.unshift({ TXT: "전체", COD: "" })
  })
}

const onButtonsClick = (btn) => {
  if (tab.value === "safety") {
    safety.value.onButtonsClick({ id: btn.id })
  } else if (tab.value === "health") {
    health.value.onButtonsClick({ id: btn.id })
  } else {
    environment.value.onButtonsClick({ id: btn.id })
  }
}

onMounted(() => {
  initCodeList()

  // onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mb-2">
          <VTabs v-model="tab">
            <VTab value="safety"> 안전 </VTab>
            <VTab value="health"> 보건 </VTab>
            <VTab value="environment"> 환경 </VTab>
          </VTabs>
        </v-sheet>
        <VWindow v-model="tab" class="pa-0">
          <VWindowItem value="safety">
            <TAB01 ref="safety" :NOTICE_DIV_LIST="NOTICE_DIV_LIST.A" />
          </VWindowItem>
          <VWindowItem value="health">
            <TAB02 ref="health" :NOTICE_DIV_LIST="NOTICE_DIV_LIST.B" />
          </VWindowItem>
          <VWindowItem value="environment">
            <TAB03 ref="environment" :NOTICE_DIV_LIST="NOTICE_DIV_LIST.C" />
          </VWindowItem>
        </VWindow>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
