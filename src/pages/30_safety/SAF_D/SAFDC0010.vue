<script setup>

import { ref, reactive, onMounted, getCurrentInstance } from "vue";

import { useLogsStore } from "@hiway/stores/logs";

import { useUserStore } from "@hiway/stores/user";

import { useI18n } from "vue-i18n";

import IMenuTitle from "@/components/IMenuTitle.vue";

import RealGrid from "@/components/RealGrid.vue";

import IUpload from "@/components/IUpload.vue";

import { lowerCase } from "lodash-es";

import SAFDC0010_01 from "./SAFDC0010_01.vue";

import SAFDC0010_02 from "./SAFDC0010_02.vue";

defineOptions({

  name: "30_safety-SAF_D-SAFDC0010",

});

const vm = getCurrentInstance().proxy; //다이얼로그관련

const t = useI18n().t; //다국어

const menuTitle = ref(null);

const userStore = useUserStore();

const { sliSAFDC0010 } = history.state;

const value = ref(sliSAFDC0010 === undefined ? "A" : sliSAFDC0010.GUBUN);

const componentMap = {

  A: SAFDC0010_01,

  B: SAFDC0010_02,

};

// const codeList = reactive({

//   VIO_GDIV: [

//     { TXT: '안전수칙위반', COD: 'A' },

//     { TXT: '시정통보', COD: 'B' },

//     { TXT: '작업중지', COD: 'C' },

//   ],

// })

const tab = ref("A");

</script>

<template>

  <v-card class="pa-0 fill-height">

    <v-card-title class="pa-3 pb-0">

      <IMenuTitle ref="menuTitle" :title="`${$t(useLogsStore().menuId)}`" />

    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">

      <div class="d-flex flex-column fill-height">

        <v-tabs v-model="tab">

          <v-tab value="A"> 안전수칙위반 등록/현황 </v-tab>

          <v-tab value="B"> 안전수칙위반 승인 </v-tab>

          <!-- <v-tab v-show="userStore.authGrpCd.includes('GRP00381') || userStore.authGrpCd.includes('GRP00369')"  value="municipalSearch"> 시정조치결과 확인 </v-tab> -->

        </v-tabs>

        <!-- <v-sheet class="searchArea d-flex mt-1">

          <v-radio-group v-model="value" inline>

            <v-radio label="안전수칙위반" value="A"></v-radio>

            <v-radio label="수칙위반 승인" value="B"></v-radio>

            <!-- <v-radio label="시정통보" value="B"></v-radio>

            <v-radio label="작업중지" value="C"></v-radio>

          </v-radio-group>

        </v-sheet>-->

        <!--

        <keep-alive>

          <component :is="componentMap[value]" />

        </keep-alive> -->

        <SAFDC0010_01 v-if="tab === 'A'"></SAFDC0010_01>

        <SAFDC0010_02 v-else-if="tab === 'B'"></SAFDC0010_02>

      </div>

    </v-card-text>

  </v-card>

</template>
