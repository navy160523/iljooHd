<!--
  화면명 : 건축물별 소방설비 등록/현황
  화면개요 : 건축물별 소방설비 등록/현황 관리. 
    Tab6(건축물 기본정보, 수계소화설비, 자탐/경보설비, 피난설비/소화활동설비, 가스계 소화설비, 전체 소방설비 현황
    리포트 3건
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonSearchApi3 } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import TAB01 from '@/pages/50_safety-support/SPP_B/TAB/SPPBB0010_Tab01.vue'
import TAB02 from '@/pages/50_safety-support/SPP_B/TAB/SPPBB0010_Tab02.vue'
import TAB03 from '@/pages/50_safety-support/SPP_B/TAB/SPPBB0010_Tab03.vue'
import TAB04 from '@/pages/50_safety-support/SPP_B/TAB/SPPBB0010_Tab04.vue'
import TAB05 from '@/pages/50_safety-support/SPP_B/TAB/SPPBB0010_Tab05.vue'
import TAB06 from '@/pages/50_safety-support/SPP_B/TAB/SPPBB0010_Tab06.vue'

defineOptions({
  name:'50_safety-support-SPP_B-SPPBB0010',
})

// 변수 선언
const tab = ref('BuildingInfo')
const BuildingInfo = ref(null)
const WaterFireSystem = ref(null)
const AutomaticFireAlarm = ref(null)
const EvacuationFacilities = ref(null)
const GasFireSystem = ref(null)
const AllFireSystem = ref(null)

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 상단 제목 및 버튼-->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet class="mb-2">
          <!-- <VTabs v-model="tab"> -->
          <VTabs v-model="tab">
            <VTab value="BuildingInfo">건축물 기본정보</VTab>
            <VTab value="WaterFireSystem">수계 소화설비</VTab>
            <VTab value="AutomaticFireAlarm">자탐, 경보설비</VTab>
            <VTab value="EvacuationFacilities">피난설비, 소화활동 설비</VTab>
            <VTab value="GasFireSystem">가스계 소화설비</VTab>
            <VTab value="AllFireSystem">전체 소화설비</VTab>
          </VTabs>
        </v-sheet>
        <!-- 탭 화면 -->
        <VWindow v-model="tab" class="pa-0">
          <VWindowItem value="BuildingInfo">
            <TAB01 ref="BuildingInfo"/>
          </VWindowItem>
          <VWindowItem value="WaterFireSystem">
            <TAB02 ref="WaterFireSystem"/>
          </VWindowItem>
          <VWindowItem value="AutomaticFireAlarm">
            <TAB03 ref="AutomaticFireAlarm"/>
          </VWindowItem>
          <VWindowItem value="EvacuationFacilities">
            <TAB04 ref="EvacuationFacilities"/>
          </VWindowItem>
          <VWindowItem value="GasFireSystem">
            <TAB05 ref="GasFireSystem"/>
          </VWindowItem>
          <VWindowItem value="AllFireSystem">
            <TAB06 ref="AllFireSystem"/>
          </VWindowItem>
        </VWindow>
      </div>
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">

</style>
