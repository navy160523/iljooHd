<!-- SPPDB0010 위험기계기구 안전검사 -->
<!-- SI2팀 김성근 2024-04-09 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import SPPDA0010Change from '@/pages/50_safety-support/SPP_D/SPPDA0010PopUp.vue'
import MTab1 from '@/pages/50_safety-support/SPP_D/SPPDA0010MainTab1.vue'
import MTab2 from '@/pages/50_safety-support/SPP_D/SPPDA0010MainTab2.vue'

defineOptions({
  name:'50_safety-support-SPP_D-SPPDA0010',
})

const userStore =  useUserStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const NOCMPNY = ref(true);
const NOBSNS = ref(true);
const NOGUACD = ref(true)
const tab = ref('')
const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)
const ChangePopUp = ref(null)
const intData = ref([])

const searchParams = reactive({})
const addRun = ref(false)
const codeList =reactive([])


const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){

}
}

</script>

<template>
  <v-card class="pa-0 fill-height">
          <!-- 텝 -->
          <VTabs v-model="tab">
                <VTab value="one">위험기계기구 안전검사</VTab>
                <VTab value="two" >검사계획 및 결과등록</VTab>
                
              </VTabs>
              <!-- 텝아이템 -->
              <VWindow v-model="tab">
                <VWindowItem value="one">
                  <MTab1 />
                </VWindowItem>
                <VWindowItem value="two">
                  <MTab2 />
                </VWindowItem>
              </VWindow>
  </v-card>
</template>
