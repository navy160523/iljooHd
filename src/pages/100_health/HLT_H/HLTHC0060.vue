<!--
  화면명 : 도수보안경 신청 지급 실적
  화면개요 : 도수보안경 신청 지급 실적
  작성자 : 김동건
  작성일자 : 2025-07-14
-->

<script setup>
import {
  ref,
  reactive,
  onMounted,
  onBeforeMount,
  getCurrentInstance,
  computed,
} from "vue";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from "@hiway/api/commonApi";
import { useI18n } from "vue-i18n";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import dayjs from "dayjs";
import HLTHC0060_Tab01 from "./HLTHC0060_Tab01.vue";
import HLTHC0060_Tab02 from "./HLTHC0060_Tab02.vue";

defineOptions({
  name: "100_health-HLT_H-HLTHC0060",
});

const vm = getCurrentInstance().proxy;
const t = useI18n().t; //다국어
const userStore = useUserStore();
const userLogStore = useLogsStore();
const tab = ref("tab01");
const tab01 = ref();
const tab02 = ref();
const isAdmin = ref(0);
const ready = ref(false);

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format("YYYY"),
  // START_YEAR: dayjs().subtract(4, "year").format("YYYY"),
  // END_YEAR: dayjs().format("YYYY"),
});

// const yearChange = () =>{
//   searchParams.START_YEAR = dayjs(`${searchParams.END_YEAR}-01-01`).subtract(4,'year').format("YYYY")
// }

onMounted(async () => {
  ready.value = true;

  await nextTick();

  //await tab01.value.setGrid();
});

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    if(tab.value === 'tab01'){
      tab01.value.searchDatas();
    }else{
      tab02.value.searchDatas();
    }
  }
}


</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area" v-if="ready">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex flex-gap">
            <div class="custom-flex-1 d-flex">
              <!-- <span
                class="form-label pr-2 custom-flex-1"
                :style="{
                  display: 'block',
                  textAlign: 'center',
                }"
              >
                {{ $t("년도") }}
              </span> -->
              <!-- <i-input
                type="YEAR"
                class="custom-flex-3 no-edit"
                v-model="searchParams.START_YEAR"
              />
              <span
                class="form-label pr-2 pl-2 custom-flex-1"
                :style="{
                  display: 'block',
                  textAlign: 'center',
                }"
                >~</span
              > -->
              <i-select
                :label="$t('년도')"
                labelWidth="60px"
                type="YEAR"
                v-model="searchParams.YEAR"
                class="custom-flex-1"
              />
            </div>
            <span class="custom-flex-3" />
            <span class="custom-flex-3" />
          </div>
        </v-sheet>
        <v-sheet>
          <v-card class="pa-0 fill-height">
            <v-tabs v-model="tab" @update:modelValue="onTabChange">
              <v-tab value="tab01">전체</v-tab>
              <v-tab value="tab02">사업부</v-tab>
            </v-tabs>
            <v-window
              v-model="tab"
              class="h-window"
              style="overflow-y: auto; max-height: calc(100vh - 150px)"
            >
              <v-window-item value="tab01">
                <HLTHC0060_Tab01
                  ref="tab01"
                  :cmpnyDiv="searchParams.CMPNY_DIV"
                  :year="searchParams.YEAR"
                />
              </v-window-item>
              <v-window-item value="tab02">
                <HLTHC0060_Tab02
                  ref="tab02"
                  :cmpnyDiv="searchParams.CMPNY_DIV"
                  :year="searchParams.YEAR"
                />
              </v-window-item>
            </v-window>
          </v-card>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 170px);
  overflow-y: auto;
}

.flex-gap {
  gap: 20px;
  flex-wrap: wrap;
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 20px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}
.custom-flex-3 {
  /* width: calc(25% - 0px) !important; */
  flex: 3 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 40px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.no-edit {
  pointer-events: none;
}
</style>
