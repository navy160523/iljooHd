<!--
  화면명 : 안전보호구 개인별 지급 이력
  화면개요 : 안전보호구 개인별 지급 이력
  작성자 : 김동건
  작성일자 : 2025-07-31
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
// import RealGrid from "@/components/RealGrid.vue";
// import Message from "@hiway/utils/notify";
// import queryFlowHelper from "@/utils/searchFlowHelper";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from "@hiway/api/commonApi";
import dayjs from "dayjs";
import EmpPopup from "@/components/popup/EmpPopup.vue";
import HLTHF0080_Tab01 from "./HLTHF0080_Tab01.vue";
import HLTHF0080_Tab02 from "./HLTHF0080_Tab02.vue";

defineOptions({
  name: "100_health-HLT_H-HLTHF0080",
});

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
const userLogStore = useLogsStore();
const menuTitle = ref(null);
const grdMain = ref(null);
const empPopup = ref(null);
const tab = ref("tab01");
const tab01 = ref();
const tab02 = ref();

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DEPT_CD: "",
  EMP_NM: "", // 성명
  EMP_NO: "", // 사번
  ASGN_FULL_NM: "", // 부서/협력사
  JOB_ROW_CD: "", // 직군
  STD_DUTY_CD: "", // 직렬
  UNT_DUTY_CD: "", // 직무
  SHOES_COUNT: "", // 지급기준
  START_YEAR: dayjs().subtract(2, "year").format("YYYY"),
  END_YEAR: dayjs().format("YYYY"),
});

const codeList = reactive({
  REASON: [], //신청사유
  DEPT_CD: [],
});

const initCodeList = async () => {
  const res = await Promise.all([
    // getCodeList("HHII730"), // 신청사유
    commonSearchApi({
      queryId: "searchDept3",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParam.BSNS_CD,
        USE_DIV: "Y",
      },
    }), // 부서
  ]);

  // codeList.REASON = res[0].ORESULT_CUR;
  codeList.DEPT_CD = res[0].ORESULT_CUR;
  codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" });
  //grdMain.value.setBindingColumn('DEPT_CD', codeList.DEPT_CD, 'COD', 'TXT') // 신청사유
  // grdMain.value.setBindingColumn('REASON', codeList.REASON, 'COD', 'TXT') // 신청사유
};

onMounted(async () => {
  await initCodeList();
});

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    if (tab.value === "tab01") {
      await tab01.value.searchDatas();
    } else if (tab.value === "tab02") {
      await tab02.value.searchDatas();
    }

    //new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
  }
};

//인원팝업 오픈 이벤트
const openEmpPopup = () => {
  let dept = searchParam.DEPT_CD != "" ? true : false;

  if (dept) {
    empPopup.value.openPopup({
      readonly: false,
      CMPNY_DIV_D: true,
      BSNS_CD_D: true,
      DEPT_CD_D: true,
      FLAG_D: true,
      DEPT_CD: searchParam.DEPT_CD,
    });
  } else {
    empPopup.value.openPopup({
      readonly: false,
      CMPNY_DIV_D: true,
      FLAG_D: true,
      DEPT_CD: searchParam.DEPT_CD,
    });
  }
};

const onEmpSelected = async (row) => {
  searchParam.EMP_NM = row.EMP_NM
  searchParam.EMP_NO = row.EMP_NO;
  searchParam.ASGN_FULL_NM = row.ASGN_NM;
  await onButtonsClick({ id: "btnSearch" });

  // const res = await Promise.all([
  //   commonSearchApi({
  //     queryId: "HLTHA0040_EMP_SEARCH",
  //     param: { CMPNY_DIV: userStore.cmpnyDiv, EMP_NO: row.EMP_NO },
  //   }),
  // ]);

  // if (res[0].ORESULT_CUR.length > 0) {
  //   searchParam.EMP_NM = res[0].ORESULT_CUR[0].EMP_NM;
  //   searchParam.EMP_NO = row.EMP_NO;
  //   searchParam.ASGN_FULL_NM = res[0].ORESULT_CUR[0].ASGN_FULL_NM;
  //   searchParam.JOB_ROW_CD = res[0].ORESULT_CUR[0].JOB_ROW_NM;
  //   searchParam.STD_DUTY_CD = res[0].ORESULT_CUR[0].STD_DUTY_NM;
  //   searchParam.UNT_DUTY_CD = res[0].ORESULT_CUR[0].UNT_DUTY_NM;
  //   searchParam.SHOES_COUNT = res[0].ORESULT_CUR[0].SHOES_COUNT_NM;
  // } else {
  //   Message.warn(t("조회된 데이터가 없습니다."));
  // }
};

const yearChange = () =>{
  searchParam.START_YEAR = dayjs(`${searchParam.END_YEAR}-01-01`).subtract(2,'year').format("YYYY")
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
    <!-- content-area -->
    <!-- v-if="ready" -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex flex-column">
          <!-- <div class="d-flex flex-gap">
            <i-input
              :label="$t('년도')"
              labelWidth="70px"
              type="YEAR"
              class="custom-flex-1 no-edit"
              v-model="searchParam.START_YEAR"
            />
            <span
              class="form-label pr-2 pl-2"
              :style="{
                display: 'block',
                textAlign: 'center',
              }"
              >~</span
            >
            <i-input
              :label="$t('년도')"
              labelWidth="70px"
              type="YEAR"
              class="custom-flex-1 no-edit"
              v-model="searchParam.END_YEAR"
            />
            <span class="custom-flex-2" />
            <span class="custom-flex-2" />
          </div> -->
          <div class="d-flex flex-gap">
            <div class="d-flex">
              <i-select
                :label="$t('년도')"
                labelWidth="70px"
                type="YEAR"
                class="no-edit"
                width="170px"
                v-model="searchParam.START_YEAR"
              />
              <!-- <span
                class="form-label pr-2 pl-2"
                :style="{
                  display: 'block',
                  textAlign: 'cneter',
                }"
                >~</span
              > -->
              <!-- :label="$t('년도')"
              labelWidth="70px" -->
              <i-select
                :label="$t('~')"
                labelWidth="20px"
                type="YEAR"
                width="120px"
                v-model="searchParam.END_YEAR"
                @update:modelValue="yearChange"
              />
            </div>
            <i-select
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              class="custom-flex-1"
              labelWidth="70px"
              v-model="searchParam.DEPT_CD"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
            <i-input
              :label="$t('성명')"
              labelWidth="70px"
              appendInnerIcon="mdi-magnify"
              v-model="searchParam.EMP_NM"
              class="custom-flex-1"
              @click:appendInner="openEmpPopup()"
            />
            <i-input
              :label="$t('사번')"
              labelWidth="70px"
              v-model="searchParam.EMP_NO"
              :disabled="true"
              class="custom-flex-1"
            />
            <i-input
              :label="$t('부서/협력사')"
              labelWidth="70px"
              v-model="searchParam.ASGN_FULL_NM"
              :disabled="true"
              class="custom-flex-1"
            />
            <span class="custom-flex-2" />
          </div>
          <!-- <div class="d-flex flex-gap mt-2">
            <i-input
              :label="$t('직군')"
              labelWidth="70px"
              v-model="searchParam.JOB_ROW_CD"
              :disabled="true"
              class="custom-flex-1"
            />
            <i-input
              :label="$t('직렬')"
              labelWidth="70px"
              v-model="searchParam.STD_DUTY_CD"
              :disabled="true"
              class="custom-flex-1"
            />
            <i-input
              :label="$t('직무')"
              labelWidth="70px"
              v-model="searchParam.UNT_DUTY_CD"
              :disabled="true"
              class="custom-flex-1"
            />
            <i-input
              :label="$t('지급기준')"
              labelWidth="70px"
              v-model="searchParam.SHOES_COUNT"
              :disabled="true"
              class="custom-flex-1"
            />
            <span class="custom-flex-2" />
          </div> -->
        </v-sheet>
        <v-sheet>
          <v-card class="pa-0 fill-height">
            <v-tabs v-model="tab" @update:modelValue="onTabChange">
              <v-tab value="tab01">안전화</v-tab>
              <v-tab value="tab02">안전장화</v-tab>
              <v-tab value="tab03">도수보안경</v-tab>
              <!-- <v-btn @click="openPopupShoes">안전화 정보</v-btn> -->
            </v-tabs>
            <v-window
              v-model="tab"
              class="h-window"
              style="overflow-y: auto; max-height: calc(100vh - 150px)"
            >
              <v-window-item value="tab01">
                <HLTHF0080_Tab01
                  ref="tab01"
                  :cmpnyDiv="searchParam.CMPNY_DIV"
                  :deptCd="searchParam.DEPT_CD"
                  :empNo="searchParam.EMP_NO"
                  :startYear="searchParam.START_YEAR"
                  :endYear="searchParam.END_YEAR"
                />
              </v-window-item>
              <v-window-item value="tab02">
                <HLTHF0080_Tab02
                  ref="tab02"
                  :cmpnyDiv="searchParam.CMPNY_DIV"
                  :deptCd="searchParam.DEPT_CD"
                  :empNo="searchParam.EMP_NO"
                  :startYear="searchParam.START_YEAR"
                  :endYear="searchParam.END_YEAR"
                />
              </v-window-item>

              <!--<v-window-item value="tab03">
                <HLTHA0020_Tab03
                  ref="tab03"
                  :cmpnyCd="searchParam.CMPNY_DIV"
                  :bsnsCd="searchParam.BSNS_CD"
                  :deptCd="searchParam.DEPT_CD"
                  :asgnCd="searchParam.ASGN_CD"
                  :outYn="searchParam.OUT_YN"
                  :dutyYn="searchParam.DUTY_YN"
                  :isAdmin="isAdmin"
                  :codeList="codeList"
                />
              </v-window-item> -->
            </v-window>
          </v-card>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
</template>
<style scoped lang="scss">
// .content-area {
//   position: relative;
//   // 만약 타이틀 영역에 컴포넌트를 추가한다면
//   // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
//   height: calc(100vh - 180px);
//   overflow-y: auto;
//   > div {
//     // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
//     // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
//     min-height: 400px;
//   }
// }

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
  align-items: left;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 20px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: left;
}

.custom-flex-3 {
  /* width: calc(25% - 0px) !important; */
  flex: 3 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 20px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: left;
}

.no-edit {
  pointer-events: none;
}
</style>