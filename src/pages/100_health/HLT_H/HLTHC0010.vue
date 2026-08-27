<!--
    화면명 : 부서별 도수보안경 신청
    화면개요 : 부서별 도수보안경 신청 관리
    작성자 : 김동건
    작성일자 : 2025-05-26
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, nextTick } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import DeptPopup from "@/components/popup/DeptPopup.vue";
import HLTHC0010_Tab01 from "./HLTHC0010_Tab01.vue";
import HLTHC0010_Tab02 from "./HLTHC0010_Tab02.vue";
import HLTHC0010_Tab03 from "./HLTHC0010_Tab03.vue";
import HLTHC0010_Tab04 from "./HLTHC0010_Tab04.vue";
import HLTHC0010Popup from "./HLTHC0010Popup.vue";
import { commonSearchApi } from '@hiway/api/commonApi'

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
const userLogStore = useLogsStore();
const isAdmin = ref(0);
const ready = ref(false);
const deptPopup = ref(null);
const tab = ref("tab02");
const tab01 = ref();
const tab02 = ref();
const tab03 = ref();
const tab04 = ref();
const checkPriod = ref(true);
const menuTitle = ref(null);
const visitedTab = ref(["tab02"]);
const hLTHC0010Popup = ref(null);
const isExtendedPermissions = ref(null);
const logStore = useLogsStore()
const div = ref();

defineOptions({
  name: "100_health-HLT_H-HLTHC0010",
});

const getAdmin = async () => {
  if(userStore.authGrpCd.includes("HLTH001A")){ // 안전보호구 모듈 관리자(전체권한)
    return 3;
  }else if (
    userStore.authGrpCd.includes("HLTH001") || // 안전보호구 모듈 관리자
    userStore.authGrpCd.includes("GRP00391") || // 서무
    userStore.authGrpCd.includes("GRP00389") || // 직책과장
    userStore.authGrpCd.includes("GRP00387") || // 부서장
    userStore.authGrpCd.includes("GRP00392") || // HES추진자
    userStore.authGrpCd.includes("GRP00390") || // 생산팀장
    userStore.authGrpCd.includes("GRP00372") // 보건 총괄관리자
  ) {
    return 2;
  }
  else {
    return 0;
  }
};

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장코드
  ASGN_FULL_NM: userStore.userDiv === "A" ? userStore.bsnsNm+'-'+userStore.deptNm : userStore.asgnFullNm,//asgnFullNm,
  BSNS_CD: userStore.bsnsCd,
  BSNS_NM: userStore.bsnsNm,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  ASGN_CD: userStore.userDiv === "A" ? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: userStore.userDiv === "A" ? userStore.deptNm : userStore.asgnNm,
  OUT_YN: userStore.userDiv === "A" ? "N" : "Y",
  USER_DIV: userStore.userDiv,
  DUTY_YN: "N",
});

const codeList = reactive({
  isSearchAdmin: [],
});

const getExtendedPermissions = async() => {
  const logMenuId = logStore.menuId
  const adminUserList = userStore.buttonPermission.filter(item => item.menu_id == logMenuId)
  const permissionList = adminUserList[0].actions
  return permissionList;
}

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

  codeList.isSearchAdmin = [...res[0].ORESULT_CUR];

  // if (codeList.isSearchAdmin.length) {
  //   isAdmin.value = 1;
  // }
};

onMounted(async () => {
  isAdmin.value = await getAdmin();
  
  if(isAdmin.value === 3){
    isExtendedPermissions.value = await getExtendedPermissions();
    div.value = true;
    ready.value = true;

    await nextTick();

    checkPriod.value = await tab02.value.setLoad();
  
    await btnSet(checkPriod.value);

    if (!checkPriod.value) {
      Message.warn(t("정기신청 기간이 아닙니다."));
    } else {
      await tab02.value.setRecevieData(searchParam.USER_DIV);
      await tab02.value.searchData();
    }
  }else if(userStore.userDiv === 'A'){
    
    isExtendedPermissions.value = await getExtendedPermissions();
    await getSearchAdmin();
    // if (isAdmin.value == 2) {
    //   await getSearchAdmin();
    // }

    div.value = true;
    ready.value = true;

    await nextTick();

    checkPriod.value = await tab02.value.setLoad();
  
    await btnSet(checkPriod.value);

    if (isAdmin.value <= 0) {
      //isAdmin.value != 2
      return Message.warn(
        t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
      );
    }

    if (!checkPriod.value) {
      Message.warn(t("정기신청 기간이 아닙니다."));
    } else {
      const isIncluded = codeList.isSearchAdmin.some(
        (item) => item.DEPT_CD === searchParam.ASGN_CD
      );

      if (isIncluded || isAdmin.value == 2) {
        await tab02.value.setRecevieData(searchParam.USER_DIV);
        await tab02.value.searchData();
      } else {
        return Message.warn(
          t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
        );
      }
    }

  }else{
    isExtendedPermissions.value = await getExtendedPermissions();
    div.value = false;
    ready.value = true;

    await nextTick();

    checkPriod.value = await tab02.value.setLoad();

    await btnSet(checkPriod.value);

    if (!checkPriod.value) {
      Message.warn(t("정기신청 기간이 아닙니다."));
    } else {
      await tab02.value.setRecevieData(searchParam.USER_DIV);
      await tab02.value.searchData();
    }
  }
});

const buttonList = computed(() => {
  return ["btnGlassesInfo", "btnSearch"]; //"btnShoesInfo", ///, "btnReqApply", , "btnApplication"
});

const btnSet = async (val) => {
  if (tab.value === "tab01") {
    menuTitle.value.visibleBtn("btnApplication", false);
    menuTitle.value.visibleBtn("btnReqApply", false);
  } else if (tab.value === "tab02") {
    menuTitle.value.visibleBtn("btnReqApply", true);
    menuTitle.value.visibleBtn("btnApplication", true);

    if(isExtendedPermissions.value.includes('ADMIN')){
      menuTitle.value.disableBtn("btnReqApply", false);  
    }else{
      menuTitle.value.disableBtn("btnReqApply", true); //true
    }

    if (val) {
      menuTitle.value.disableBtn("btnApplication", false);
    } else {
      menuTitle.value.disableBtn("btnApplication", true);
    }
  } else if (tab.value === "tab03") {
    menuTitle.value.visibleBtn("btnApplication", true);
    menuTitle.value.disableBtn("btnApplication", false);
    if(isExtendedPermissions.value.includes('ADMIN')){
      menuTitle.value.disableBtn("btnReqApply", false);  
    }else{
      menuTitle.value.disableBtn("btnReqApply", false); //true
    }
    // menuTitle.value.visibleBtn("btnReqApply", true);
    // menuTitle.value.disableBtn("btnReqApply", false);
  } else if (tab.value === "tab04") {
    menuTitle.value.visibleBtn("btnApplication", true);
    menuTitle.value.disableBtn("btnApplication", false);
    menuTitle.value.visibleBtn("btnReqApply", true);
    menuTitle.value.disableBtn("btnReqApply", false);
  }
};

const onButtonsClick = async (btn) => {
  if(userStore.userDiv === 'A'){
    if (isAdmin.value <= 0) {
      return Message.warn(
        t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
      );
    }

    const isIncluded = codeList.isSearchAdmin.some(
      (item) => item.DEPT_CD === searchParam.ASGN_CD
    );
    
    if (isIncluded || isAdmin.value >= 2) {
      if (btn.id === "btnSearch") {
        if (searchParam.ASGN_NM === "") {
          Message.warn(t("부서/협력사를 선택해주세요."));
          return;
        }

        if (tab.value === "tab01") {
          const userData = {
            CMPNY_DIV: searchParam.CMPNY_DIV,
            DEPT_CD: searchParam.DEPT_CD,
            ASGN_CD: searchParam.ASGN_CD,
            OUT_YN: searchParam.OUT_YN,
          };
          await tab01.value.searchData(userData);
        } else if (tab.value === "tab02") {
          if (checkPriod.value) {
            await tab02.value.searchData();
          } else {
            Message.warn(t("정기신청 기간이 아닙니다."));
          }
        }
      } else if (btn.id === "setLoad") {
        if (tab.value === 'tab02') {
          await nextTick();
          await tab02.value.setLoad();
        }
      } else if (btn.id === "btnGlassesInfo") {
        await openPopupGlasses();
      }
    }else{
      return Message.warn(
        t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
      );
    }
  }else{
    if (btn.id === "btnSearch") {
      if (searchParam.ASGN_NM === "") {
        Message.warn(t("부서/협력사를 선택해주세요."));
        return;
      }

      if (tab.value === "tab01") {
        const userData = {
          CMPNY_DIV: searchParam.CMPNY_DIV,
          DEPT_CD: searchParam.DEPT_CD,
          ASGN_CD: searchParam.ASGN_CD,
          OUT_YN: searchParam.OUT_YN,
        };
        await tab01.value.searchData(userData);
      } else if (tab.value === "tab02") {
        if (checkPriod.value) {
          await tab02.value.searchData();
        } else {
          Message.warn(t("정기신청 기간이 아닙니다."));
        }
      }
    } else if (btn.id === "setLoad") {
      if (tab.value === 'tab02') {
        await nextTick();
        await tab02.value.setLoad();
      }
    } else if (btn.id === "btnGlassesInfo") {
      await openPopupGlasses();
    }
  }



  // if (isAdmin.value != 2) {
  //   return Message.warn(
  //     t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
  //   );
  // }

  
};

const showYn = computed(() => {
  if (tab.value === "tab02") {
    return true;
  }

  return false;
});

const deptPopupOpen = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: searchParam.CMPNY_DIV,
    HSE_ONLY: "Y",
    ASGN_NM: searchParam.ASGN_NM,
    ORGN_DIV: 'A',
    USE_OLNY: 'N',
    USE_TEAM: '',
  });
};

const onDeptSelected = async (val) => {
  console.log('isAdmin.value', isAdmin.value)
  if (isAdmin.value === 3) {
    searchParam.ASGN_FULL_NM = val.ASGN_FULL_NM;
    searchParam.DEPT_CD = val.DEPT_CD;
    searchParam.ASGN_CD = val.ASGN_CD;
    searchParam.ASGN_NM = val.ASGN_SHRT_NM;
    searchParam.BSNS_CD = val.BSNS_CD;
    searchParam.OUT_YN = val.ORGN_DIV = "A" ? "N" : "Y";

    if (tab.value === "tab02") {
      await tab02.value.initCodeList();
    }
  }else{
    const isIncluded = codeList.isSearchAdmin.some(
      (item) => item.DEPT_CD === val.DEPT_CD
    );

    const myDept = userStore.deptCd === val.DEPT_CD;

    if (isIncluded || myDept) {
      searchParam.ASGN_FULL_NM = val.ASGN_FULL_NM;
      searchParam.DEPT_CD = val.DEPT_CD;
      searchParam.ASGN_CD = val.ASGN_CD;
      searchParam.ASGN_NM = val.ASGN_SHRT_NM;
      searchParam.BSNS_CD = val.BSNS_CD;
      searchParam.OUT_YN = val.ORGN_DIV = "A" ? "N" : "Y";

      if (tab.value === "tab02") {
        await tab02.value.initCodeList();
      }
    } else {
      Message.warn(
        t(
          "해당 조직으로 변경할 권한이 없습니다. 보건팀 담당자에게 권한요청하시기 바랍니다."
        )
      );
    }
  }
};

const onTabChange = async (newTab) => {
  if (!visitedTab.value.includes(newTab)) {
    visitedTab.value.push(newTab);
    await onButtonsClick({ id: "setLoad" });
  }

  await nextTick();
  await btnSet(checkPriod.value);
  await onButtonsClick({ id: "btnSearch" });
};

const openPopupGlasses = async () => {
  hLTHC0010Popup.value.openPopup();
};

const clearDeptcd = () => {
  searchParam.ASGN_FULL_NM = "";
  searchParam.ASGN_NM = "";
  searchParam.ASGN_CD = "";
};

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="buttonList"
        @click-button="onButtonsClick"
        :usePermission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area" v-if="ready">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex flex-gap">
            <i-input
              :label="$t('부서/협력사')"
              width="600px"
              labelWidth="70px"
              class="deptInput"
              :disabled="true"
              v-model="searchParam.ASGN_FULL_NM"
              @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
            />
            <i-input
              v-if="div === true"
              width="150px"
              appendInnerIcon="mdi-magnify"
              v-model="searchParam.ASGN_CD"
              class="no-click"
              @click:appendInner="deptPopupOpen()"
              readonly
            >
              <template #append-inner v-if="searchParam.ASGN_CD != ''">
                <v-icon icon="mdi-window-close" @click="clearDeptcd" />
              </template>
            </i-input>
            <i-input
              v-else
              width="150px"
              v-model="searchParam.ASGN_CD"
              :disabled="true"
              readonly
            />
            <!-- <i-input
              width="100px"
              appendInnerIcon="mdi-magnify"
              v-model="searchParam.ASGN_CD"
              @click:appendInner="deptPopupOpen()"
            /> -->
            <!-- <v-checkbox
              v-show="showYn"
              true-value="Y"
              false-value="N"
              label="신청대상만 조회"
              v-model="searchParam.DUTY_YN"
            /> -->
          </div>
        </v-sheet>
        <v-sheet>
          <v-card class="pa-0 fill-height">
            <v-tabs v-model="tab" @update:modelValue="onTabChange">
              <v-tab value="tab01">신청내역</v-tab>
              <v-tab value="tab02">정기신청</v-tab>
              <!-- <v-tab value="tab03">수시신청</v-tab> -->
              <!-- <v-tab value="tab04">직영외 신청</v-tab> -->
            </v-tabs>
            <v-window
              v-model="tab"
              class="h-window"
              style="overflow-y: auto; max-height: calc(100vh - 150px)"
            >
              <v-window-item value="tab01">
                <HLTHC0010_Tab01
                  ref="tab01"
                  :cmpnyCd="searchParam.CMPNY_DIV"
                  :bsnsCd="searchParam.BSNS_CD"
                  :deptCd="searchParam.DEPT_CD"
                  :asgnCd="searchParam.ASGN_CD"
                  :outYn="searchParam.OUT_YN"
                  :dutyYn="searchParam.DUTY_YN"
                />
              </v-window-item>
              <v-window-item value="tab02">
                <HLTHC0010_Tab02
                  ref="tab02"
                  :cmpnyCd="searchParam.CMPNY_DIV"
                  :bsnsCd="searchParam.BSNS_CD"
                  :deptCd="searchParam.DEPT_CD"
                  :asgnCd="searchParam.ASGN_CD"
                  :outYn="searchParam.OUT_YN"
                  :dutyYn="searchParam.DUTY_YN"
                  :isAdmin="isAdmin"
                  :userDiv="searchParam.USER_DIV"
                  :codeList="codeList"
                />
              </v-window-item>
              <!-- <v-window-item value="tab03">
                <HLTHC0010_Tab03
                  ref="tab03"
                  :cmpnyCd="searchParam.CMPNY_DIV"
                  :bsnsCd="searchParam.BSNS_CD"
                  :deptCd="searchParam.DEPT_CD"
                  :asgnCd="searchParam.ASGN_CD"
                  :outYn="searchParam.OUT_YN"
                  :dutyYn="searchParam.DUTY_YN"
                />
              </v-window-item> -->
              <!-- <v-window-item value="tab04">
                <HLTHC0010_Tab04
                  ref="tab04"
                  :cmpnyCd="searchParam.CMPNY_DIV"
                  :bsnsCd="searchParam.BSNS_CD"
                  :bsnsNm="searchParam.BSNS_NM"
                  :deptCd="searchParam.DEPT_CD"
                  :deptNm="searchParam.DEPT_Nm"
                  :asgnCd="searchParam.ASGN_CD"
                  :outYn="searchParam.OUT_YN"
                  :dutyYn="searchParam.DUTY_YN"
                  :isAdmin="isAdmin"
                />
              </v-window-item> -->
            </v-window>
          </v-card>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
  <HLTHC0010Popup ref="hLTHC0010Popup" />
</template>
<style scoped lang="scss">
.deptInput {
  margin-right: 5px !important;
}

.no-click {
  color: black !important;
  -webkit-text-fill-color: black !important;
}
</style>