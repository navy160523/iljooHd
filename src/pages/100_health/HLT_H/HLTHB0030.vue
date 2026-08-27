<!--
  화면명 : 개인별 안전장화 지급 이력
  화면개요 : 개인별 안전장화 지급 이력
  작성자 : 박재형
  작성일자 : 2025-05-21
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import queryFlowHelper from "@/utils/searchFlowHelper";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from "@hiway/api/commonApi";
import EmpPopup from "@/components/popup/EmpPopup.vue";

defineOptions({
  name: "100_health-HLT_H-HLTHB0030",
});

const props = defineProps({
  isPopup: Boolean
})

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
const userLogStore = useLogsStore();
const menuTitle = ref(null)
const grdMain = ref(null);
const empPopup = ref(null);

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EMP_NM: "", // 성명
  EMP_NO: "", // 사번
  ASGN_FULL_NM: "", // 부서/협력사
  JOB_ROW_CD: "", // 직군
  STD_DUTY_CD: "", // 직렬
  UNT_DUTY_CD: "", // 직무
  SHOES_COUNT: "", // 지급기준
});

const codeList = reactive({
  REASON: [], //신청사유
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    {
      fieldName: "YEAR",
      dataType: "text",
      width: "40",
      editable: false,
      header: { text: t("년도") },
      lookupDisplay: true,
      styleName: "center-column",
    },
    {
      fieldName: "REQ_DIV",
      dataType: "text",
      width: "40",
      editable: false,
      header: { text: t("구분") },
      lookupDisplay: true,
      styleName: "center-column",
    },
    {
      fieldName: "REQ_CHA_DT",
      dataType: "text",
      width: "100",
      editable: false,
      styleName: "center-column",
      header: {
        text: t("신청시기\n(신청일자)"),
        styleName: "multiline-editor",
      },
    },
    {
      fieldName: "SHOES_NM",
      dataType: "text",
      width: "100",
      editable: false,
      styleName: "left-column",
      header: { text: t("안전장화 종류") },
    },
    {
      fieldName: "SHOES_SIZE",
      dataType: "text",
      width: "60",
      editable: false,
      styleName: "center-column",
      header: { text: t("사이즈") },
    },
    {
      fieldName: "SHOES_COUNT",
      dataType: "text",
      width: "60",
      editable: false,
      styleName: "right-column",
      header: { text: t("신청수량") },
    },
    {
      fieldName: "REASON",
      dataType: "text",
      width: "60",
      editable: false,
      lookupDisplay: true,
      styleName: "left-column",
      header: { text: t("신청사유") },
    },
    {
      fieldName: "RECEIVE_YN",
      dataType: "text",
      width: "60",
      editable: false,
      styleName: "center-column",
      header: { text: t("지급여부") },
    },
    {
      fieldName: "RECEIVE_DT",
      dataType: "text",
      width: "100",
      editable: false,
      styleName: "center-column",
      header: { text: t("지급일자") },
    },
    {
      fieldName: "RECEIVE_REASON",
      dataType: "text",
      width: "100",
      editable: false,
      styleName: "left-column",
      header: { text: t("미지급사유") },
    },
    {
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      width: "200",
      editable: false,
      styleName: "left-column",
      header: { text: t("소속부서") },
    },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const initCodeList = async () => {
    const res = await Promise.all([
        //getCodeList("HHII740"), // 지급수량
        getCodeList("HHII730"), // 신청사유
    ]);
    //codeList.SHOES_COUNT = [...res[0].ORESULT_CUR];

    // console.log('resINIT : ', res)
    codeList.REASON = [...res[0].ORESULT_CUR];
    // const tempList = [...res[0].ORESULT_CUR];

    // codeList.REASON = tempList.filter(
    //   (item) => item.CODE_DESC1?.includes("C")
    // );

    // console.log("codeList.REASON", codeList.REASON)

    grdMain.value.setBindingColumn('REASON', codeList.REASON, 'COD', 'TXT') // 신청사유
}

onMounted(async() => {
  await initCodeList()

  grdMain.value.getGridView().resetSize();

  grdMain.value.getGridView().filterPanel.visible = true;
});

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
  }
};


const popupSet = async(row) => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHB0030_EMP_SEARCH",
      param: { CMPNY_DIV: userStore.cmpnyDiv, EMP_NO: row.EMP_NO },
    }),
  ]);
  // console.log("respop", res)
  if(res[0].ORESULT_CUR.length > 0){

    searchParam.EMP_NM = res[0].ORESULT_CUR[0].EMP_NM;
    searchParam.EMP_NO = row.EMP_NO;
    searchParam.ASGN_FULL_NM = res[0].ORESULT_CUR[0].ASGN_FULL_NM;
    searchParam.JOB_ROW_CD = res[0].ORESULT_CUR[0].JOB_ROW_NM;
    searchParam.STD_DUTY_CD = res[0].ORESULT_CUR[0].STD_DUTY_NM;
    searchParam.UNT_DUTY_CD = res[0].ORESULT_CUR[0].UNT_DUTY_NM;
    searchParam.SHOES_COUNT = res[0].ORESULT_CUR[0].SHOES_COUNT_NM;
  }else{
    Message.warn(t('조회된 데이터가 없습니다.'));
  }
}

const popupSearch = async() => {
  new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
}

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHB0030_SEARCH",
    param: searchParam,
  });
};

const afterSearch = (res) => {
  // console.log("resresr : ", res.ORESULT_CUR);
  const gridView = grdMain.value.getGridView();

  gridView.setAllCheck(false);
  gridView.checkAll(false);

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

//인원팝업 오픈 이벤트
const openEmpPopup = (name) => {
  empPopup.value.openPopup({
    readonly: false,
    CMPNY_DIV_D: true,
    FLAG_D: true,
    EMP_NM: name,
  });
};

const onEmpSelected = async (row) => {

  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHB0030_EMP_SEARCH",
      param: { CMPNY_DIV: userStore.cmpnyDiv, EMP_NO: row.EMP_NO },
    }),
  ]);
  // console.log("resemp", res) 

  if(res[0].ORESULT_CUR.length > 0){

    searchParam.EMP_NM = res[0].ORESULT_CUR[0].EMP_NM;
    searchParam.EMP_NO = row.EMP_NO;
    searchParam.ASGN_FULL_NM = res[0].ORESULT_CUR[0].ASGN_FULL_NM;
    searchParam.JOB_ROW_CD = res[0].ORESULT_CUR[0].JOB_ROW_NM;
    searchParam.STD_DUTY_CD = res[0].ORESULT_CUR[0].STD_DUTY_NM;
    searchParam.UNT_DUTY_CD = res[0].ORESULT_CUR[0].UNT_DUTY_NM;
    searchParam.SHOES_COUNT = res[0].ORESULT_CUR[0].SHOES_COUNT_NM;
    await onButtonsClick({ id: "btnSearch" });
  }else{
    Message.warn(t('조회된 데이터가 없습니다.'));
  }

  
};

defineExpose({
  popupSearch,
  popupSet
})

</script>


<template>
  <v-card class="pa-0 fill-height">
    <v-card-title v-show="props.isPopup ? false : true" class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
        :usePermission="true"
      />
    </v-card-title>
    <!-- content-area -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex flex-column">
          <div class="d-flex flex-gap">
            <i-input
              :label="$t('성명')"
              labelWidth="70px"
              appendInnerIcon="mdi-magnify"
              v-model="searchParam.EMP_NM"
              class="custom-flex-1"
              @click:appendInner="openEmpPopup()"
              @keyup.enter="openEmpPopup(searchParam.EMP_NM)"
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
              class="custom-flex-2"
            />
            <span :class="props.isPopup ? '' : 'custom-flex-2'" />
          </div>
          <div class="d-flex flex-gap mt-2">
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
            <span  :class="props.isPopup ? '' : 'custom-flex-2'" />
          </div>
        </v-sheet>
        <div :class="props.isPopup ? '':'h-grow'" 
          :style="{
            height: props.isPopup ? '480px' : 'auto',
          }">
          <v-sheet 
            :class="[
              'pa-0',
              isPopup ? 'fill-height' : 'h-auto'
            ]"
          > 
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
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
</style>