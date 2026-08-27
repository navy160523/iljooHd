<!--
    화면명 : 도수보안경 신청 접수/마감
    화면개요 : 도수보안경 신청 접수/마감
    작성자 : 김동건
    작성일자 : 2025-06-10 
-->
<script setup>
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
} from "@hiway/api/commonApi";
import { ref, reactive, onMounted, getCurrentInstance, computed, nextTick } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import DeptPopup from "@/components/popup/DeptPopup.vue";
import HLTHC0020_Tab01 from "./HLTHC0020_Tab01.vue";
import HLTHC0020_Tab02 from "./HLTHC0020_Tab02.vue";
// import HLTHC0020_Tab03 from "./HLTHC0020_Tab03.vue";
// import HLTHC0020_Tab04 from "./HLTHC0020_Tab04.vue";
// import HLTHC0020Popup from "./HLTHC0020Popup.vue";

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
// const userLogStore = useLogsStore();
const isAdmin = ref(0);
const ready = ref(false);
const deptPopup = ref(null);
const tab = ref("tab01");
const tab01 = ref();
const tab02 = ref();
const tab03 = ref();
// const checkPriod = ref(true);
const menuTitle = ref(null);
const visitedTab = ref(["tab01"]);
// const hLTHC0020Popup = ref(null);
// const isExtendedPermissions = ref(null);
// const logStore = useLogsStore()

defineOptions({
  name: "100_health-HLT_H-HLTHC0020",
});

// 조회조건
const searchParams = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear(),
  REQ_DIV: 'A',
  REQ_CHA: (new Date().getMonth()+1).toString(),
});

const codeList = reactive({
  REQ_CHA: [],
  isSearchAdmin: [],
})

const initCodeList = async () => {
  const res = await Promise.all([
    getCodeList('HHII806'), // 도수보안경
  ])
  codeList.REQ_CHA = res[0].ORESULT_CUR;
};

const getAdmin = async () => {
  if (
    userStore.authGrpCd.includes("HLTH001") || // 안전보호구 모듈 관리자
    userStore.authGrpCd.includes("GRP00372") // 보건 총괄관리자
  ) {
    return 2;
  } else {
    return 0;
  }
};

const getSearchAdmin = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHF0070_SEARCH_02",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        EMP_NO: userStore.empNo,
      },
    }),
  ]);

  codeList.isSearchAdmin =  [...res[0].ORESULT_CUR];
}

const getReqestPriod = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_03",
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
      },
    }),
  ]);

  return res[0].ORESULT_CUR;
};

const setReqestPriod = async (res) => {
  searchParams.REQ_CHA = res[0].REQ_CHA;
};

onMounted(async () => {
  isAdmin.value = await getAdmin();
  await getSearchAdmin();
  await initCodeList();
  const res = await getReqestPriod();
  if (res != null && res.length > 0) {
    await setReqestPriod(res);
  }
  await nextTick()
  ready.value = true;
  
})

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    if (tab.value === "tab01") {
      const userData = {
        CMPNY_DIV : searchParams.CMPNY_DIV,
        YEAR      : searchParams.YEAR,
        REQ_DIV   : searchParams.REQ_DIV,
        REQ_CHA   : searchParams.REQ_CHA
      };
      await tab01.value.searchData(userData);
    } else if(tab.value === 'tab02'){
      // const userData = {
      //   CMPNY_DIV : searchParams.CMPNY_DIV,
      //   YEAR      : searchParams.YEAR,
      //   REQ_DIV   : searchParams.REQ_DIV,
      //   REQ_CHA   : searchParams.REQ_CHA
      // };
      tab02.value.searchData(); //userData
    }
  }else if (btn.id === "setGrid"){
    if(tab.value === 'tab02'){
      await tab02.value.setLoad();
    }
  }
}

const onTabChange = async (newTab) => {
  if (!visitedTab.value.includes(newTab)) {
    visitedTab.value.push(newTab);
    await nextTick();  
    await onButtonsClick({ id: "setGrid" });
  }
  await nextTick();
};

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
        :usePermission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area" v-if="ready">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex flex-gap">
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('해당년도')"
              label-width="50px"
              type="YEAR"
              width="200px"
            />
            <i-select
                v-model="searchParams.REQ_CHA"
                :label="$t('신청시기')"
                label-width="50px"
                :items="codeList.REQ_CHA"
                item-value="COD"
                item-title="TXT"
                width="200px"
              />
          </div>
        </v-sheet>
        <v-sheet>
          <v-card class="pa-0 fill-height">
            <v-tabs v-model="tab" @update:modelValue="onTabChange">
              <v-tab value="tab01">신청내역</v-tab>
              <v-tab value="tab02">시력검사일정</v-tab>
              <!-- <v-tab value="tab03">수시신청</v-tab> -->
              <!-- <v-tab value="tab04">직영외 신청</v-tab> -->
            </v-tabs>
            <v-window
              v-model="tab"
              class="h-window"
              style="overflow-y: auto; max-height: calc(100vh - 150px)"
            >
              <v-window-item value="tab01">
                <HLTHC0020_Tab01
                  ref="tab01"
                />
              </v-window-item>
              <v-window-item value="tab02">
                <HLTHC0020_Tab02
                  ref="tab02"
                  :isAdmin="isAdmin"
                  :cmpnyDiv="searchParams.CMPNY_DIV"
                  :year="searchParams.YEAR"
                  :reqDiv="searchParams.REQ_DIV"
                  :reqCha="searchParams.REQ_CHA"
                />
                
              </v-window-item>
            </v-window>
          </v-card>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
  <HLTHC0020Popup ref="hLTHC0020Popup" />
</template>
<style scoped lang="scss">
.deptInput {
  margin-right: 5px !important;
}
</style>