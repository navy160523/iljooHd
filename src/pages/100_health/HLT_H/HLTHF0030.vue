<!--
    화면명 : 지급장소관리
    화면개요 : 시력검사 및 안전보호구 지급 장소 관리
    작성자 : 김동건
    작성일자 : 2024-02-19
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue"
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi, getCompanyList } from '@hiway/api/commonApi'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import Message from '@hiway/utils/notify'
import HLTHF0030_Tab01 from './HLTHF0030_Tab01.vue'
import HLTHF0030_Tab02 from './HLTHF0030_Tab02.vue'

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
const userLogStore = useLogsStore();
const tab = ref("tab01");
const isAdmin = ref(0)
const tab01 = ref();
const tab02 = ref();

defineOptions({
  name: '100_health-HLT_H-HLTHF0030',
})

onMounted(() => {
  if(userStore.authGrpCd.includes('HLTH001')) isAdmin.value = 2
  else if (userStore.authGrpCd.includes('HLTH002')) isAdmin.value = 1
  else isAdmin.value = 0
});

const tabChanged = (data) => {
  if(data === 'tab02'){
    //grdMainTab02.value.getGridView().filterPanel.visible = true;
    //onButtonsClick2({id : 'btnSearch'})
  }else{
  }
}

const onButtonsClick = async (btn) => {
  if(tab.value === 'tab01'){
    if (btn.id === "btnSearch") {
      tab01.value.btnSearch();
    } else if (btn.id === "btnCreate") {
      tab01.value.btnCreate();
    } else if (btn.id === "btnDelete") {
      tab01.value.btnDelete();
    }
  }else if(tab.value === 'tab02'){
    if (btn.id === "btnSearch") {
      tab02.value.btnSearch();
    } else if (btn.id === "btnCreate") {
      tab02.value.btnCreate();
    } else if (btn.id === "btnDelete") {
      tab02.value.btnDelete();
    }
  }
  
};

const buttonList = computed(() => {
  return isAdmin.value > 0 ? ['btnSearch', 'btnCreate', 'btnDelete'] : ['btnSearch', 'btnCreate'];
})

//@update:modelValue="tabChanged"
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0" style="justify-content: space-between">
      <!--2025.07.14 기초정보관리 테스트 미팅 : 타이틀명 변경 요청 지급장소관리 -> 장소관리 -->
      <IMenuTitle
        :title="$t('장소관리')"
        :button-list="buttonList"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>
    <v-tabs v-model="tab" >
      <v-tab value="tab01">시력검사장소</v-tab>
      <v-tab value="tab02">수령장소</v-tab>
    </v-tabs>
    <v-window v-model="tab" class="h-window">
      <v-window-item value="tab01">
        <HLTHF0030_Tab01 ref="tab01"/>
      </v-window-item>
      <v-window-item value="tab02">
        <HLTHF0030_Tab02 ref="tab02"/>
      </v-window-item>
    </v-window>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
.tooltip-wrapper {
  position: absolute;
}
.tooltip {
  position: relative; /* 화살표가 툴팁 아래에 위치하도록 */
  background-color: #424242;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1000; /* 툴팁이 다른 요소 위에 보이도록 */
  pointer-events: none; /* 툴팁이 마우스 이벤트를 받지 않도록 */
  white-space: nowrap; /* 내용이 줄바꿈되지 않도록 */
}

.tooltip-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent; /* 화살표의 왼쪽 부분 */
  border-right: 5px solid transparent; /* 화살표의 오른쪽 부분 */
  border-top: 5px solid #424242; /* 화살표의 색상 */
  position: absolute;
  left: 50%; /* 가운데 정렬 */
  transform: translateX(-50%); /* 수평 중심으로 이동 */
  top: 100%; /* 툴팁 아래에 위치 */
}
</style>