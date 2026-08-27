<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, onBeforeMount, nextTick } from "vue";
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
} from "@hiway/api/commonApi";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@hiway/stores/user";
import queryFlowHelper from '@/utils/searchFlowHelper'

const grdMain = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어

const codeList = reactive({
  USER_DIV: [
    { COD: '%', TXT: '전체', DISABLE: false },
    { COD: 'A', TXT: '직영', DISABLE: false },
    { COD: 'B', TXT: '사내협력사', DISABLE: false },
  ],
  BSNS_CD: [],
  DEPT_CD: [],
  GLASSES_KIND: [],
  EYESIGHT_PLACE: [],
  SUPPLIES:[],
  STATUS: [
    { COD: "%", TXT: "전체" },
    { COD: " ", TXT: "미신청" },
    { COD: "2", TXT: "결재중" },
    { COD: "3", TXT: "신청완료" },
    { COD: "4", TXT: "확정완료" },
    { COD: "5", TXT: "반려" },
    { COD: "9", TXT: "지급완료" },
  ],
  REASON: [],
})

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: "",
  REQ_DIV: "A",
  DEPT_CD: "",
  USER_DIV: '%',
})

const grdMainProps = reactive({
  gridViewOption: { 
    checkBar: { visible: false },
  },
  fields: [
    {
      fieldName: "USER_DIV",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("구분") },
      styleName: "center-column",
    },
    {
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("구분") },
      styleName: "left-column",
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("사번") },
      styleName: "center-column",
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("이름") },
      styleName: "center-column",
    },
    {
      fieldName: "JOB_TIT_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직위") },
      styleName: "left-column",
    },
    {
      fieldName: "UNT_DUTY_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직무") },
      styleName: "left-column",
    },
    {
      fieldName: "STATUS",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("신청상태") },
      styleName: "left-column",
    },
    {
      fieldName: "GLASSES_KIND",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("보안경 종류") },
      styleName: "left-column",
    },
    {
      fieldName: "EYESIGHT_PLACE",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("시력검사장소") },
      styleName: "left-column",
    },
    {
      fieldName: "SUPPLIES",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("추가지급") },
      styleName: "left-column",
    },
    {
      fieldName: "REASON",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("신청사유") },
      styleName: "left-column",
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("비고") },
      styleName: "left-column",
    },
  ],
  columns: [],
  columnLayout: [],
});

grdMainProps.columns = grdMainProps.fields;

const initCodeList = async () => {
  const res = await Promise.all([
    getCodeList('HHII710B'), // 도수보안경
    commonSearchApi({
        queryId: "searchBSNS",
        param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
    }), // 사업부
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_PLACE",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv
      },
    }),
    getCodeList('HHIIG30A'), // 추가지급
    getCodeList("HHIIG30C"),
  ])

  codeList.GLASSES_KIND = res[0].ORESULT_CUR;
  codeList.BSNS_CD = res[1].ORESULT_CUR;
  codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: ''})
  codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
  codeList.EYESIGHT_PLACE = res[2].ORESULT_CUR;
  codeList.SUPPLIES = res[3].ORESULT_CUR;
  codeList.REASON = res[4].ORESULT_CUR;

  grdMain.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
  grdMain.value.setBindingColumn("STATUS", codeList.STATUS, "COD", "TXT");
  grdMain.value.setBindingColumn("GLASSES_KIND", codeList.GLASSES_KIND, "COD", "TXT");
  grdMain.value.setBindingColumn("EYESIGHT_PLACE", codeList.EYESIGHT_PLACE, "COD", "TXT");
  grdMain.value.setBindingColumn("SUPPLIES", codeList.SUPPLIES, "COD", "TXT");
  grdMain.value.setBindingColumn("REASON", codeList.REASON, "COD", "TXT");
};

const setDeptList = async() =>{
    codeList.DEPT_CD = [];
    searchParam.DEPT_CD = ''
    Promise.all([
        commonSearchApi({
            queryId: "searchDept3",
            param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: "Y" },
        }), // 부서
    ]).then((res) =>{
        codeList.DEPT_CD = res[0].ORESULT_CUR;
        codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
    })
}

const updateBsnsCd = async () => {
  await setDeptList()
  onButtonsClick({ id: 'btnSearch' })
}

onMounted(async() => {
  await initCodeList()
  await setDeptList()
  grdMain.value.getGridView().filterPanel.visible = true
  await nextTick();
})

const searchData = async(userData) =>{
    new queryFlowHelper(vm, t).setQuery(() => searchDatas(userData)).setAfter(afterSearch).run()
}

const searchDatas = (userData) => { 
  return commonSearchApi({
    queryId: 'HLTHC0020_SEARCH_01',
    param: {
        CMPNY_DIV   : userData.CMPNY_DIV,
        YEAR        : userData.YEAR,
        REQ_DIV     : userData.REQ_DIV,
        REQ_CHA     : userData.REQ_CHA,
        BSNS_CD     : searchParam.BSNS_CD,
        DEPT_CD     : searchParam.DEPT_CD,
        USER_DIV    : searchParam.USER_DIV
    }
  })
}

const afterSearch = (res) => {
  console.log('res : ',res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// const onCellDblClicked = async(grid, clickData) =>{
//   let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

//   console.log('data : ', data)

//   const dataParam = {
//     CMPNY_DIV : props.cmpnyCd,
//     YEAR      : data.YEAR,
//     REQ_DIV   : data.REQ_DIV,
//     REQ_CHA   : data.REQ_CHA_DT.replaceAll('-',''),
//     REQ_DT    : data.REQ_CHA_DT.replaceAll('-',''),
//     BSNS_CD   : props.bsnsCd,
//     DEPT_CD   : props.deptCd,
//     ASGN_CD   : props.asgnCd,
//     //OUT_YN    : data.USER_DIV = 'A' ? 'N' : 'Y',
//     ASGN_FULL_NM : data.ASGN_FULL_NM,
//     USER_DIV  : data.USER_DIV
//   }

// }

defineExpose({
  searchData
})
</script>

<template>
  <v-card class="pa-0 fil-height">
    <v-card-text class="pa-3 searchArea">
      <div class="d-flex flex-gap">
        <i-select
          :label="$t('사업부')"
          :items="codeList.BSNS_CD"
          item-title="BSNS_NM"
          item-value="BSNS_CD"
          class="custom-flex-1"
          labelWidth="50px"
          v-model="searchParam.BSNS_CD"
          @update:modelValue="updateBsnsCd"
        />
        <i-select
          :label="$t('부서')"
          :items="codeList.DEPT_CD"
          item-title="DEPT_NM"
          item-value="DEPT_CD"
          class="custom-flex-1"
          labelWidth="50px"
          v-model="searchParam.DEPT_CD"
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
              {{ $t("구분 ") }}
            </span>
            <v-radio-group
              v-model="searchParam.USER_DIV"
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
        <span class="custom-flex-3" />
      </div>
    </v-card-text>
    <v-card-text class="pa-0 pt-3 content-area">
      <div class="d-flex flex-column fill-height">
        <div class="h-grow d-flex flex-area-gap">
          <v-sheet class="pa-0 h-auto custom-flex-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <!-- <HLTHA0020Popup02 ref="hLTHA0020Popup02" /> -->
  <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (370px));
  overflow-y: auto;
}
.tooltip-wrapper {
  position: absolute;
}
.tooltip {
  position: relative; /* 화살표가 툴팁 아래에 위치하도록 */
  background-color: #424242;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1000; /* 툴팁이 다른 요소 위에 보이도록 */
  pointer-events: none; /* 툴팁이 마우스 이벤트를 받지 않도록 */
  white-space: nowrap; /* 내용이 줄바꿈되지 않도록 */
}

.tooltip-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent; /* 화살표의 왼쪽 부분 */
  border-right: 5px solid transparent; /* 화살표의 오른쪽 부분 */
  border-top: 5px solid #424242; /* 화살표의 색상 */
  position: absolute;
  left: 50%; /* 가운데 정렬 */
  transform: translateX(-50%); /* 수평 중심으로 이동 */
  top: 100%; /* 툴팁 아래에 위치 */
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