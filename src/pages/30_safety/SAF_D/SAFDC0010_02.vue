<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi";
import {
  commonDownloadFilesApi,
  commonBigUploadFilesApi,
} from "@hiway/api/commonFileApi";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import saveFlowHelper from "@/utils/saveFlowHelper";
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import queryFlowHelper from "@/utils/searchFlowHelper";
import dayjs from "dayjs";
import Message from "@hiway/utils/notify";
import IUpload from "@/components/IUpload.vue";
import { lowerCase } from "lodash-es";
import SAFDC0010_02Tab01 from "./SAFDC0010_02Tab01.vue";
import SAFDC0010_02Tab02 from "./SAFDC0010_02Tab02.vue";
import SAFDC0010_02Tab03 from "./SAFDC0010_02Tab03.vue";

defineOptions({
  name: "30_safety-SAF_D-SAFDC0010",
});

const userStore = useUserStore();
const sAFDC0010_02 = ref(null);
const tab = ref("municipal");
</script>

<template>
  <v-sheet>
    <v-tabs v-model="tab">
      <v-tab value="municipal"> 시정통보등록 </v-tab>
      <v-tab value="municipalResist"> 시정조치결과 등록 </v-tab>
      <v-tab v-show="userStore.authGrpCd.includes('GRP00381') || userStore.authGrpCd.includes('GRP00369')"  value="municipalSearch"> 시정조치결과 확인 </v-tab>
    </v-tabs>
  </v-sheet>
  <v-window v-model="tab">
    <v-window-item value="municipal">
      <SAFDC0010_02Tab01></SAFDC0010_02Tab01
    ></v-window-item>
    <v-window-item value="municipalResist"
      ><SAFDC0010_02Tab02></SAFDC0010_02Tab02>
    </v-window-item>
    <v-window-item value="municipalSearch"
      ><SAFDC0010_02Tab03></SAFDC0010_02Tab03>
    </v-window-item>
  </v-window>
</template>
