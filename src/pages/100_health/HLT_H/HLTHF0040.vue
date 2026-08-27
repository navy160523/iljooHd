<!--
    화면명 : 지급기준관리
    화면개요 : 시력검사 및 안전보호구 지급 기준 관리
    작성자 : 김동건
    작성일자 : 2024-03-06
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import Message from '@hiway/utils/notify'
import HLTHF0040_Tab01 from './HLTHF0040_Tab01.vue'
import HLTHF0040_Tab02 from './HLTHF0040_Tab02.vue'

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
const userLogStore = useLogsStore();
const tab = ref("tab01");
const menuTitle = ref(null);
const tab01 = ref();
const tab02 = ref();

defineOptions({
  name: '100_health-HLT_H-HLTHF0040',
})

onMounted(() => {
  menuTitle.value.visibleBtn("btnNewDeptSearch", false);
});

const onTabChange = async (newTab) => {
  if (newTab === "tab01") {
    menuTitle.value.visibleBtn("btnNewJobSearch", true);
    menuTitle.value.visibleBtn("btnNewDeptSearch", false);
  }else{
    menuTitle.value.visibleBtn("btnNewJobSearch", false);
    menuTitle.value.visibleBtn("btnNewDeptSearch", true);
  }
};

const onButtonsClick = async (btn) => {
  if(tab.value === 'tab01'){
    if(btn.id === 'btnSearch'){
      tab01.value.btnSearch();
    }else if(btn.id === 'btnUpdate'){
      tab01.value.btnUpdate();
    }else if(btn.id === 'btnNewJobSearch'){
      tab01.value.btnNewJobSearch();
    }else if(btn.id === 'btnTotalStatusSearch'){
      tab01.value.btnTotalStatusSearch();
    }
  }else if(tab.value === 'tab02'){
    if(btn.id === 'btnSearch'){
      tab02.value.btnSearch();
    }else if(btn.id === 'btnUpdate'){
      tab02.value.btnUpdate();
    }else if(btn.id === 'btnNewDeptSearch'){
      tab02.value.btnNewDeptSearch();
    }else if(btn.id === 'btnTotalStatusSearch'){
      tab02.value.btnTotalStatusSearch();
    }
  }
}

// btnSearch,
//   btnUpdate,
//   btnNewJobSearch,
//   btnTotalStatusSearch

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0" style="justify-content: space-between">
      <IMenuTitle
        ref="menuTitle"
        :title="$t('지급기준관리')"
        :button-list="[
          'btnSearch',
          'btnUpdate',
          'btnNewJobSearch',
          'btnNewDeptSearch',
          'btnTotalStatusSearch',
        ]"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>
    <v-tabs v-model="tab" @update:modelValue="onTabChange">
      <v-tab value="tab01">직무관리</v-tab>
      <v-tab value="tab02">부서관리</v-tab>
    </v-tabs>
    <v-window v-model="tab" class="h-window">
      <v-window-item value="tab01">
        <HLTHF0040_Tab01 ref="tab01"/>
      </v-window-item>
      <v-window-item value="tab02">
        <HLTHF0040_Tab02 ref="tab02"/>
      </v-window-item>
    </v-window>
  </v-card>
</template>
<style scoped lang="scss">
</style>