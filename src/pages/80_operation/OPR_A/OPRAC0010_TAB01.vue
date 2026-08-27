<!-- 
  화면명 : 안전요원 등록/관리
  화면개요 : 장소, 호선/프로젝트별 안전요원 등록/관리 화면
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import IMenuTitle from '@/components/IMenuTitle.vue'
import TAB01 from '@/pages/80_operation/OPR_A/OPRAC0010_TAB01_01.vue'
import TAB02 from '@/pages/80_operation/OPR_A/OPRAC0010_TAB01_02.vue'

defineOptions({ 
  name:'80_operation-OPR_A-OPRAC0010',
})

const emit = defineEmits(['switch-tab'])
// 변수 선언
const tab = ref('site')
const site = ref(null)
const boat = ref(null)

// 상단 버튼 클릭
const onButtonsClick = (btn) => {
  site.value.onButtonsClick({ id: btn.id })
  // if (tab.value === 'site') {
  //   if(btn.id === 'btnSetTeam') {
  //     emit('switch-tab')
  //     return
  //   }
  //   site.value.onButtonsClick({ id: btn.id })
  // } else if (tab.value === 'boat') {
  //   boat.value.onButtonsClick({ id: btn.id })
  // } 
}
</script>

<template>
  
  <v-card class="pa-0 fill-height">
    <!-- 상단 제목 및 버튼-->
    <v-card-title class="pa-0 pb-0 pr-2">
      <IMenuTitle
        ref="menuTitle"
        :title="$t('조회정보')"
        :button-list="['btnSearch','btnCreate', 'btnBulkCreate', 'btnUpdate', 'btnDelete', 'btnReset', 'btnToDateCopy', 'btnSetTeam']"
        @click-button="onButtonsClick"
        hiddenManuel
      />
    </v-card-title>
  <!-- 윤찬양책임님의 요구사항(가운데 상단에 주의사항 개념으로 적어주세요.)-->
  <!-- <div class="notice">
      ※ 반드시 장소와 호선/프로젝트 모두 등록해주시길 바랍니다.
  </div> -->
  <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <TAB01 ref="site"></TAB01>


        <!-- 탭 -->
        <!-- <v-sheet class="mb-2">
          <VTabs v-model="tab">
            <VTab value="site"> 장소 </VTab>
            <VTab value="boat"> 호선/프로젝트 </VTab>
          </VTabs>
        </v-sheet> -->
        <!-- 탭 화면-->
        <!-- <VWindow v-model="tab" class="pa-0">
          <VWindowItem value="site">
            <TAB01 ref="site"/>
          </VWindowItem>
          <VWindowItem value="boat">
            <TAB02 ref="boat"/>
          </VWindowItem>
        </VWindow> -->
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.notice {
  position: fixed;
  z-index: 9999;
  color: red;
  font-size: 1.1rem;
  left: 383px; 
  top: 262px;
  font-weight: bold;
}
</style>