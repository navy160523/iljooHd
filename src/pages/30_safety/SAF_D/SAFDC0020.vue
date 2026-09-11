<script setup>

import { ref } from "vue";

import { useLogsStore } from "@hiway/stores/logs";

import IMenuTitle from "@/components/IMenuTitle.vue";

import SAFDC0020_01 from "./SAFDC0020_01.vue";

import SAFDC0020_02 from "./SAFDC0020_02.vue";

defineOptions({

  name: "30_safety-SAF_D-SAFDC0020",

});

const menuTitle = ref(null);

const tab = ref("muniReg");

</script>

<template>

  <v-card class="pa-0 fill-height">

    <v-card-title class="pa-3 pb-0">

      <IMenuTitle ref="menuTitle" :title="`${$t(useLogsStore().menuId)}`" />

    </v-card-title>

    <div class="d-flex align-center justify-space-between border-b bg-white">

      <v-tabs v-model="tab" color="primary" class="tabs-area">

        <v-tab value="muniReg" class="font-weight-bold">시정통보 등록/현황</v-tab>

        <v-tab value="muniClose" class="font-weight-bold">시정통보 승인</v-tab>

      </v-tabs>

    </div>

    <v-card-text class="pa-0 content-area">

      <SAFDC0020_01 v-if="tab === 'muniReg'" />

      <SAFDC0020_02 v-else-if="tab === 'muniClose'" />

    </v-card-text>

  </v-card>

</template>
