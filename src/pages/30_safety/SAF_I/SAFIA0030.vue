 <!-- SAFIA0030 사내 협력사 현황 -->
 <!-- SI2팀 김성근 작업 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import Tab1 from '@/pages/30_safety/SAF_I/SAFIA0030tab1.vue'
import Tab2 from '@/pages/30_safety/SAF_I/SAFIA0030tab2.vue'
import Tab3 from '@/pages/30_safety/SAF_I/SAFIA0030tab3.vue'


defineOptions({
  name: "30_safety-SAF_I-SAFIA0030",
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grd1 = ref(null)
const deptPopup = ref(null)
const tab = ref(null)


const Saved =()=>{
  tab.value = 'tab3'
}


</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pb-0 mb-3 content-area">
      <v-sheet class="d-flex flex-column fill-height">
        <v-sheet>
          <VTabs v-model="tab">
            <VTab value="tab1">사내 협력사 현황</VTab>
            <VTab value="tab2">협력사 통합</VTab>
            <VTab value="tab3">협력사 통합 이력</VTab>
          </VTabs>
        </v-sheet>
        <v-window v-model="tab">
        <v-window-item value="tab1">
        <Tab1 />
        </v-window-item>

        <v-window-item value="tab2">
          <Tab2 @Saved="Saved" />
        </v-window-item>

        <v-window-item value="tab3">
          <Tab3 :tab="tab" />
      </v-window-item>
        </v-window>
      </v-sheet>
      <!-- 조회조건 -->

      <!-- 메인그리드 -->
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px + 13px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>

