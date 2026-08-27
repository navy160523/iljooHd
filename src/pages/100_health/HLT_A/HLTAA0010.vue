<!-- 
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import IMenuTitle from '@/components/IMenuTitle.vue'
import TAB01 from "@/pages/100_health/HLT_A/HLTAA0010Tab01.vue" // 평가 대상 조직 관리
import TAB02 from "@/pages/100_health/HLT_A/HLTAA0010Tab02.vue" // 위험도 산출 기준 (정량)
import TAB03 from "@/pages/100_health/HLT_A/HLTAA0010Tab03.vue" // 위험도 산출 기준 (정성)
import TAB04 from "@/pages/100_health/HLT_A/HLTAA0010Tab04.vue" // 위험성 결정 Matric
import TAB05 from "@/pages/100_health/HLT_A/HLTAA0010Tab05.vue" // 위험성 보정 기준 관리
import TAB06 from "@/pages/100_health/HLT_A/HLTAA0010Tab06.vue" // 특수건강진단 결과 업로드
import TAB07 from "@/pages/100_health/HLT_A/HLTAA0010Tab07.vue" // 감소대책 가이드 관리

defineOptions({
  name:'100_health-HLT_A-HLTAA0010', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const isAdmin = ref(false)
const tab = ref('TAB_01')
const TAB_01 = ref(null) 
const TAB_02 = ref(null) 
const TAB_03 = ref(null) 
const TAB_04 = ref(null)
const TAB_05 = ref(null) 
const TAB_06 = ref(null) 
const TAB_07 = ref(null) 

// const buttonList = computed(() => {
//   const base = ['btnCalculationOfRisk', 'btnSearch', 'btnUpdate', 'btnCreate', 'btnDelete']
//   if (tab.value === 'TAB_01') {
//     return base.filter(btn => btn !== 'btnCreate')
//   } else {
//     return base.filter(btn => btn !== 'btnUpdate')
//   }
// })

const onButtonsClick = btn => {
  // console.log(btn.id)
  if(tab.value === 'TAB_01' && TAB_01.value) {
    TAB_01.value.onButtonsClick({id: btn.id})
  } else if (tab.value === 'TAB_02' && TAB_02.value) {
    TAB_02.value.onButtonsClick({id: btn.id})
  } else if (tab.value === 'TAB_03' && TAB_03.value) {
    TAB_03.value.onButtonsClick({id: btn.id})
  } else if (tab.value === 'TAB_04' && TAB_04.value) {
    TAB_04.value.onButtonsClick({id: btn.id})
  } else if (tab.value === 'TAB_05' && TAB_05.value) {
    TAB_05.value.onButtonsClick({id: btn.id})
  } else if (tab.value === 'TAB_06' && TAB_06.value) {
    TAB_06.value.onButtonsClick({id: btn.id})
  } else if (tab.value === 'TAB_07' && TAB_07.value) {
    TAB_07.value.onButtonsClick({id: btn.id})
  } 
}

defineExpose({
  onButtonsClick,
})

</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pb-1">
          <v-tabs v-model="tab">
            <v-tab value="TAB_01">평가대상 조직관리</v-tab>
            <v-tab value="TAB_02">위험도 산출기준(정량)</v-tab>
            <v-tab value="TAB_03">위험도 산출기준(정성)</v-tab>
            <v-tab value="TAB_04">위험성 결정 Matrix</v-tab>
            <v-tab value="TAB_05">위험성 보정기준 관리</v-tab>
            <v-tab value="TAB_07">감소대책 가이드 관리</v-tab>
            <v-tab value="TAB_06">특수건강진단결과 업로드</v-tab>
          </v-tabs>
        </v-sheet>
        <v-window v-model="tab" class="h-window">
          <v-window-item value="TAB_01"> <TAB01 ref="TAB_01" /></v-window-item>
          <v-window-item value="TAB_02"> <TAB02 ref="TAB_02" /></v-window-item>
          <v-window-item value="TAB_03"> <TAB03 ref="TAB_03" /></v-window-item>
          <v-window-item value="TAB_04"> <TAB04 ref="TAB_04" /></v-window-item>
          <v-window-item value="TAB_05"> <TAB05 ref="TAB_05" /></v-window-item>
          <v-window-item value="TAB_06"> <TAB06 ref="TAB_06" /></v-window-item>
          <v-window-item value="TAB_07"> <TAB07 ref="TAB_07" /></v-window-item>
        </v-window>
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
    min-height: 400px;
  }
}
</style>