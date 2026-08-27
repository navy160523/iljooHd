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

const props = defineProps({
  cmpnyDiv: String,
  deptCd: String,
  empNo: String,
  startYear: String,
  endYear: String,
});

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const grdMain = ref(null);

const searchParam = reactive({
  CMPNY_DIV: props.cmpnyDiv,
  DEPT_CD: props.deptCd,
  EMP_NO: props.empNo, // 사번
  START_YEAR: props.startYear,
  END_YEAR: props.endYear,
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
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      width: "200",
      editable: false,
      styleName: "left-column",
      header: { text: t("소속부서") },
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "80",
      editable: false,
      styleName: "left-column",
      header: { text: t("사번") },
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "80",
      editable: false,
      styleName: "left-column",
      header: { text: t("성명") },
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
      header: { text: t("안전화 종류") },
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
      fieldName: "COUPON_YN",
      dataType: "text",
      width: "60",
      editable: false,
      styleName: "center-column",
      header: { text: t("쿠폰여부") },
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
      fieldName: "INSORE_YN",
      dataType: "text",
      width: "60",
      editable: false,
      styleName: "center-column",
      header: { text: t("보온 깔창여부") },
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
    
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const initCodeList = async () => {
    const res = await Promise.all([
        getCodeList("HHII730"), // 신청사유
    ]);

    codeList.REASON = [...res[0].ORESULT_CUR];
    grdMain.value.setBindingColumn('REASON', codeList.REASON, 'COD', 'TXT') // 신청사유
}

onMounted(async () => {
  await initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true;
});

const searchDatas = async() =>{
  new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
}

const searchData = () => {
  searchParam.DEPT_CD = props.deptCd
  searchParam.EMP_NO = props.empNo
  return commonSearchApi({
    queryId: "HLTHF0080_SEARCH_01",
    param: searchParam,
  });
};

const afterSearch = (res) => {
  const gridView = grdMain.value.getGridView();

  gridView.setAllCheck(false);
  gridView.checkAll(false);

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

defineExpose({
  searchDatas
})
</script>
<template>
  <v-card class="pa-0 fill-height">
    <!-- content-area -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <div
          :class="props.isPopup ? '' : 'h-grow'"
          :style="{
            height: props.isPopup ? '480px' : 'auto',
          }"
        >
          <v-sheet :class="['pa-0', isPopup ? 'fill-height' : 'h-auto']">
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
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 330px);
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