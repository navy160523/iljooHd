<script setup>
import { defineComponent } from "vue";
import IGridTitle from "@/components/IGridTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import queryFlowHelper from "@/utils/searchFlowHelper";
import { commonSearchApi, getCodeList } from "@hiway/api/commonApi";
import { useUserStore } from "@hiway/stores/user";
import dayjs from "dayjs";
import Message from "@hiway/utils/notify";

const menuTitle = ref(null);
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const grdMain = ref(null);
const userStore = useUserStore();
const glassesSizeArray = ref([]);
const ready = ref(false);

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear(),
  REQ_CHA: (new Date().getMonth() + 1).toString(),
  BSNS_CD: "",
  REQ_DIV: "A",
  DEPT_CD: "",
  USER_DIV: "",
  RECEIVE_YN: "",
});

const codeList = reactive({
  REQ_CHA: [], //신청시기
  USER_DIV: [
    { COD: "", TXT: "전체", DISABLE: false },
    { COD: "A", TXT: "직영", DISABLE: false },
    { COD: "B", TXT: "사내협력사", DISABLE: false },
  ],
  BSNS_CD: [],
  DEPT_CD: [],
  GLASSES: [],
  RECEIVE_YN: [
    { COD: "", TXT: "전체", DISABLE: false },
    { COD: "Y", TXT: "지급", DISABLE: false },
    { COD: "N", TXT: "미지급", DISABLE: false },
  ],
  ADD: [],
  REASON: [],
});

const initCodeList = async () => {
  const res = await Promise.all([
    getCodeList("HHII806"),
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
    }), // 사업부
    getCodeList("HHIIG30A"),
    getCodeList("HHIIG30C"),
    commonSearchApi({
      queryId: "HLTHC0050_SEARCH_GLASSES",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }), // 도수보안경
  ]);

  codeList.REQ_CHA = res[0].ORESULT_CUR;
  codeList.BSNS_CD = res[1].ORESULT_CUR;
  codeList.ADD = res[2].ORESULT_CUR;
  codeList.REASON = res[3].ORESULT_CUR;
  codeList.GLASSES = res[4].ORESULT_CUR;
  codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" });
  codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" });

  grdMain.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
  grdMain.value.setBindingColumn("REASON", codeList.REASON, "COD", "TXT");
  grdMain.value.setBindingColumn("SUPPLIES", codeList.ADD, "COD", "TXT");
};

const setDeptList = async () => {
  codeList.DEPT_CD = [];
  searchParams.DEPT_CD = "";
  Promise.all([
    commonSearchApi({
      queryId: "searchDept3",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV: "Y",
      },
    }), // 부서
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR;
    codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" });
  });
};

const updateBsnsCd = async () => {
  await setDeptList();
  onButtonsClick({ id: "btnSearch" });
};

const grdMainProps = reactive({
  gridViewOption: {
    header: { height: 45 },
  },
  fields: [],
  fields_dept: [
    {
      name: "DEPT_NM",
      fieldName: "DEPT_NM",
      dataType: "text",
      width: "80",
      editable: false,
      header: { text: t("부서") },
      styleName: "left-column",
    },
    {
      name: "ASGN_NM",
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "80",
      editable: false,
      header: { text: t("협력사") },
      styleName: "left-column",
    },
  ],
  fields_glasses: [],
  fields_receiver: [
    {
      name: "TOTAL_CNT",
      fieldName: "TOTAL_CNT",
      dataType: "number",
      numberFormat: "#,###",
      width: "80",
      editable: false,
      header: { text: t("총합계") },
      styleName: "right-column",
    },
    {
      name: "EMP_NM_RECEIVER",
      fieldName: "EMP_NM_RECEIVER",
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("수령자") },
      styleName: "left-column",
    },
    {
      name: "PLACE_NAME",
      fieldName: "PLACE_NAME",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("수령장소") },
      styleName: "left-column",
    },
    {
      name: "TEL_NO_RECEIVER",
      fieldName: "TEL_NO_RECEIVER",
      dataType: "text",
      width: "100",
      editable: false,
      header: {
        text: t("수령자\n연락처"),
        styleName: "multiline-editor",
      },
      styleName: "left-column",
    },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const setGlassesColumn = async () => {
  //let sizeArray = [];
  codeList.GLASSES.forEach((item) => {
    glassesSizeArray.value.push(t(item.MODEL));
    //sizeArray.push(t(item.TXT));
    grdMainProps.fields_glasses.push({
      name: item.MODEL,
      fieldName: item.MODEL,
      dataType: "number",
      numberFormat: "#,###",
      width: "80",
      editable: false,
      header: {
        text: t(item.MODEL.replace("(", "\n(")),
        styleName: "multiline-editor",
      },
      styleName: "right-column",
      zeroText: "",
    });
  });
};

onMounted(async () => {
  await initCodeList();
  await setDeptList();
  await setGlassesColumn();

  const cols = [
    ...grdMainProps.fields_dept,
    ...grdMainProps.fields_glasses,
    ...grdMainProps.fields_receiver,
  ];
  grdMainProps.columns = grdMainProps.fields = cols;
  grdMain.value.getDataProvider().setFields(grdMainProps.fields);
  grdMain.value.getGridView().setColumns(grdMainProps.columns);
  grdMain.value.getGridView().filterPanel.visible = true;

  await nextTick();
  ready.value = true;
});

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
  } else if (btn.id === "btnPrint") {
    onExceldown();
  }
};

const onExceldown = async () => {
  if (grdMain.value.getGridView().getItemCount() < 1) {
    Message.warn(t("출력할 데이터가 없습니다."));
    return;
  }

  let std = "";

  if (searchParams.REQ_CHA !== "") {
    std =
      codeList.REQ_CHA.find((item) => item.COD === searchParams.REQ_CHA)?.TXT +
      "_";
  }

  grdMain.value.getGridView().exportGrid({
    type: "excel",
    target: "local",
    lookupDisplay: true,
    fileName:
      "안전보호구_도수보안경 지급 현황(팩킹리스트)_" +
      dayjs(new Date()).format("YYYY") +
      "_" +
      std +
      ".xlsx", // 저장될 파일 name
    progressMessage: "엑셀 다운로드중입니다.", // 엑셀 다운로드 하는 동안 progressMessage 표시
    indicator: "hidden", // indidator 영역 표시
    header: "visible", // 헤더 표시
    footer: "visible", // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t("엑셀 다운로드가 완료되었습니다."));
    },
  });
};

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHC0050_SEARCH_02",
    param: searchParams,
  });
};

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnPrint']"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea" v-if="ready">
          <div class="d-flex flex-column">
            <div class="pb-1 d-flex flex-gap">
              <i-select
                v-model="searchParams.YEAR"
                :label="$t('해당년도')"
                label-width="50px"
                type="YEAR"
                class="custom-flex-2"
              />
              <i-select
                v-model="searchParams.REQ_CHA"
                :label="$t('신청시기')"
                label-width="50px"
                :items="codeList.REQ_CHA"
                item-value="COD"
                item-title="TXT"
                class="custom-flex-2"
              />
              <div class="custom-flex-2 d-flex">
                <i-label class="flex-grow-1 d-flex">
                  <span
                    class="form-label pr-2 pt-2"
                    :style="{
                      display: 'block',
                      width: '60px',
                      margin: '0 8px 0 0',
                    }"
                  >
                    {{ $t("구분 ") }}
                  </span>
                  <v-radio-group
                    v-model="searchParams.USER_DIV"
                    inline
                    class="radioStyle"
                  >
                    <v-radio
                      v-for="item in codeList.USER_DIV"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </v-radio-group>
                </i-label>
              </div>
              <span class="custom-flex-3"/>
              <span class="custom-flex-2"/>
            </div>
            <div class="d-flex flex-gap">
              <i-select
                :label="$t('사업부')"
                :items="codeList.BSNS_CD"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                class="custom-flex-2"
                labelWidth="50px"
                v-model="searchParams.BSNS_CD"
                @update:modelValue="updateBsnsCd"
              />
              <i-select
                :label="$t('부서')"
                :items="codeList.DEPT_CD"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                class="custom-flex-2"
                labelWidth="50px"
                v-model="searchParams.DEPT_CD"
                @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
              />
              <div class="custom-flex-2 d-flex">
                <i-label class="flex-grow-1 d-flex">
                  <span
                    class="form-label pr-2 pt-2"
                    :style="{
                      display: 'block',
                      width: '60px',
                      margin: '0 8px 0 0',
                    }"
                  >
                    {{ $t("지급여부 ") }}
                  </span>
                  <v-radio-group
                    v-model="searchParams.RECEIVE_YN"
                    inline
                    class="radioStyle"
                  >
                    <v-radio
                      v-for="item in codeList.RECEIVE_YN"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </v-radio-group>
                </i-label>
              </div>
              <span class="custom-flex-3"/>
              <span class="custom-flex-2"/>
            </div>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 280px);
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
  align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 20px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}
.custom-flex-3 {
  /* width: calc(25% - 0px) !important; */
  flex: 3 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 40px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.radioStyle {
  padding-left: 5px;
  height: 35px;
  background-color: rgb(255, 255, 255);
  border: 1px solid;
  border-radius: 2px;
  border-color: #e0e0e0; //#CCCCCC;
  // width: 80%;
  font-size: x-small;
  display: flex;
  align-items: center;
}
</style>
