<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import queryFlowHelper from "@/utils/searchFlowHelper";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from "@hiway/api/commonApi";
import dayjs from "dayjs";
import HLTHB0040_Tab01 from "./HLTHB0040_Tab01.vue";
import HLTHB0040_Tab02 from "./HLTHB0040_Tab02.vue";
import saveFlowHelper from "@/utils/saveFlowHelper";

defineOptions({
  name: "100_health-HLT_H-HLTHB0040",
});

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
const userLogStore = useLogsStore();
const menuTitle = ref(null)
const tab = ref("tab01");

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,         // 사업장 구분
  YEAR: dayjs(new Date).format('YYYY'),  // 년도
  FACTORY: '',
})

const tab01Ref = ref(null)
const tab02Ref = ref(null)

const onClickTab = (i) => {
  const tabValue = i.target.__vueParentComponent.props.value

  if(tabValue === 'tab01') {
    tab01Ref.value?.onButtonsClick({ id: 'btnSearch' })
  }else {
    tab02Ref.value?.onButtonsClick({ id: 'btnSearch' })
  }
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 본공장, 해양, 군산공장 버튼 추가 -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet>
          <v-card class="pa-0 fill-height">
            <v-tabs v-model="tab">
              <v-tab value="tab01" @click="onClickTab">수불대장</v-tab>
              <v-tab value="tab02" @click="onClickTab">재고현황</v-tab>
            </v-tabs>
            <v-window v-model="tab" class="h-window">
              <v-window-item value="tab01">
                <HLTHB0040_Tab01 
                  ref="tab01Ref" 
                  :searchParams="searchParams"
                />
              </v-window-item>
              <v-window-item value="tab02">
                <HLTHB0040_Tab02 
                  ref="tab02Ref" 
                  :searchParams="searchParams"
                />
              </v-window-item>
            </v-window>
          </v-card>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>

</style>