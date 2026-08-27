<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : Tab6팝업 (사고보고서 열람)   -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { commonRequest } from "@hiway/api/commonApi";
import IMenuTitle from "@/components/IGridTitle.vue";
import ILabel from "@/components/ILabel.vue";
import IGridTitle from "@/components/IGridTitle.vue";
import { useI18n } from "vue-i18n";
import RealGrid from "@/components/RealGrid.vue";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi";
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";
import Tab1 from '@/pages/30_safety/SAF_G/SAFGA0010Tab6PopUpTab1.vue'
import Tab2 from '@/pages/30_safety/SAF_G/SAFGA0010Tab6PopUpTab2.vue'

const userStore = useUserStore(); //유저정보
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const dialog = ref(false);
const tab = ref(null);
const dataCheck = reactive([]);






const btnList = reactive([
  { name: "닫기", id: "Close", disabled: false },
]);

const intCode = () => {
  Promise.all([]).then((res) => {});
};

//  팝업 관련

const openPopup = async (popupParam) => {
  
  if(dataCheck[0]){
    dataCheck[0] = []
  }
  dataCheck[0] = popupParam
  dialog.value = true;
};

watch(dataCheck,(newValue)=>{
console.log('dwwwwatttccchhataCheck')
})



const upData = () => {
  searchData();
};

const onButtonsClick = (e) => {
  if (e == "Close") {
    close();
  }

  if (e == "Search") {
    searchData();
  }
};

const close = () => {
  dialog.value = false;
};

defineExpose({
  openPopup,
});
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1440"
    class="draggable-dialog"
  >
    <div class="title-bar" @mousedown="startDragging">사고보고서 ({{ dataCheck[0].SAGO_SN }})</div>

    <VContainer style="background-color: white">
      <v-tabs v-model="tab" class="align">
        <v-tab value="사고보고서-1">{{ t("사고보고서-1") }}</v-tab>
        <v-tab value="사고보고서-2">{{ t("사고보고서-2") }}</v-tab>
        <v-spacer />
        <v-btn
          v-for="(item, i) in btnList"
          :key="i"
          @click="onButtonsClick(item.id)"
          :disabled="item.disabled"
        >
          {{ item.name }}
        </v-btn>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="사고보고서-1">
          <Tab1 :dataCheck="dataCheck" />
        </v-window-item>

        <v-window-item value="사고보고서-2">
        <Tab2 :dataCheck="dataCheck"/>
        </v-window-item>
      </v-window>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
