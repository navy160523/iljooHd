<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useRoute, useRouter } from 'vue-router'
import { useCommonStore } from '@hiway/stores/common'
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"
import queryFlowHelper from "@/utils/searchFlowHelper"
import DeptPopup from "@/components/popup/DeptPopup.vue";
defineOptions({
  name: "30_safety-SAF_C-SAFCE0040",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const router = useRouter()
const commonStore = useCommonStore()
const deptPopup = ref(null)
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().$y,
  WEEK_FROM: 1,
  WEEK_TO: "",
  CLSS_TITLE: "",
  BSNS_CD: "",
  DEPT_CD: "",
  USE_DIV: 'N'
})

const codeList = reactive({
  bsnsCd: [], //사업부
  deptCd: [], //대상부서
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: "Y" },
    }), // 부서
  ]).then((res) => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {},
  fields: [
    {
      fieldName: "YEAR",
      dataType: "text",
      header: { text: t("년도") },
      editable: false,
      width: "50",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "CLSS_TITLE",
      dataType: "text",
      header: { text: t("점검대상") },
      editable: false,
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "TARGET_BSNS_NM",
      dataType: "text",
      editable: false,
      header: { text: t("사업부") },
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "TARGET_DEPT_NM",
      dataType: "text",
      editable: false,
      header: { text: t("부서") },
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "WEEK",
      dataType: "text",
      editable: false,
      width: "80",
      header: { text: t("주차") },
    },
    {
      fieldName: "WEEK_RANGE",
      dataType: "text",
      editable: false,
      header: { text: t("기간") },
      width: 180,
    },
    {
      fieldName: "CHK_CNT",
      dataType: "number",
      editable: false,
      styleName: "right-column cursor_pointer",
      numberFormat: "#,###",
      header: { text: t("점검건수") },
    },
    {
      fieldName: "OK_CNT",
      dataType: "number",
      editable: false,
      width: "80",
      styleName: "right-column cursor_pointer",
      numberFormat: "#,###",
      header: { text: t("양호건수") },
    },
    {
      fieldName: "BAD_CNT",
      dataType: "number",
      editable: false,
      width: "80",
      styleName: "right-column cursor_pointer",
      numberFormat: "#,###",
      header: { text: t("부적합건수") },
    },
    {
      fieldName: "OK_RATE",
      dataType: "text",
      editable: false,
      width: "80",
      styleName: "right-column cursor_pointer",
      header: { text: t("양호율(%)") },
    },
    {
      fieldName: "FIX_CNT",
      dataType: "number",
      editable: false,
      styleName: "right-column cursor_pointer",
      numberFormat: "#,###",
      header: { text: t("조치건수") },
    },
    {
      fieldName: "FIX_RATE",
      dataType: "text",
      editable: false,
      width: "80",
      styleName: "right-column cursor_pointer",
      header: { text: t("조치율(%)") },
    },
    {
      fieldName: "CLSS_SEQ",
      dataType: "text",
      header: { text: t("") },
      editable: false,
      visible: false,
    },

    {
      fieldName: "BSNS_CD",
      dataType: "text",
      editable: false,
      visible: false,
      header: { text: t("") },
    },
    {
      fieldName: "DEPT_CD",
      dataType: "text",
      editable: false,
      visible: false,
      header: { text: t("") },
    },
    { fieldName: "WEEK_FROM", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "WEEK_TO", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "FIX_YN", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "TARGET_BSNS_CD", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "TARGET_DEPT_CD", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "TARGET_ASGN_CD", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "CHK_NO", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "CHK_EMP", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "ASGN_CD", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "ASGN_NM", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "CHK_EMP_NM", dataType: "text", visible: false, header: { text: t("") } },
  ],
  columns: [],
  columnLayout: [
    "YEAR",
    "CLSS_TITLE",
    {
      name: "점검대상부서",
      direction: "horizontal",
      items: ["TARGET_BSNS_NM", "TARGET_DEPT_NM"],
    },
    "WEEK",
    "WEEK_RANGE",
    {
      name: "점검결과",
      direction: "horizontal",
      items: ["CHK_CNT", "BAD_CNT", "OK_CNT", "OK_RATE"],
    },
    {
      name: "조치결과",
      direction: "horizontal",
      items: ["FIX_CNT", "FIX_RATE"],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  searchParam.WEEK_TO = getWeek()
  onButtonsClick({ id: "btnSearch" })
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }
}

//사업부 변경시 부서 조회
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: "searchDept3",
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        ORGN_DIV: "A",
        BSNS_CD: newValue,
        DEPT_CD: "",
        ASGN_NM: "",
        HSE_ONLY: "",
        USE_ONLY: "Y",
      },
    }).then((res) => {
      searchParam.DEPT_CD = ""
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
    })
  }
)

//오늘의 주차 가져오기
const getWeek = () => {
  const toDay = new Date()
  const yearStart = new Date(toDay.getFullYear(), 0, 1)
  const diff = toDay - yearStart
  const weekNumber = Math.ceil(diff / (1000 * 60 * 60 * 24) / 7)
  return weekNumber //현재년도의 1월1일을 기준으로 오늘이 몇주차인지 반환
}
watch(
  () => searchParam.WEEK_FROM,
  (newValue, oldValue) => {
    if (Number(newValue) > Number(searchParam.WEEK_TO)) {
      Message.warn(t("주차의 끝보다 큰 값은 입력할 수 없습니다."))
      searchParam.WEEK_FROM = ""
      return false
    }
    if (Number(newValue) > 53) {
      Message.warn(t("53주차보다 큰값은 입력 할 수 없습니다."))
      searchParam.WEEK_FROM = ""
      return false
    }
  }
)

watch(
  () => searchParam.WEEK_TO,
  (newValue, oldValue) => {
    if (Number(newValue) > 53) {
      Message.warn(t("53주차보다 큰값은 입력 할 수 없습니다."))
      searchParam.WEEK_TO = ""
      return false
    }
  }
)

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: "SAFCE0040_SEARCH01",
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

/* ******************* 점검결과, 조치결과 cell 클릭 시 이행점검 결과 화면으로 이동 ******************* */
const onCellClicked = async (grid, clickData) => {
  if(clickData.cellType === 'data'){
    let fieldName = clickData.fieldName
    let rowData = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    // commonStore.loading = true
    // router.push({path: '/20_risk-assessment/RSK_B/RSKBA0030', state: { data: rowData}})

    if(fieldName === 'CHK_CNT' || fieldName === 'BAD_CNT' || fieldName === 'OK_CNT' || fieldName === 'OK_RATE'
      || fieldName === 'FIX_CNT' || fieldName === 'FIX_RATE'){
      if(rowData.FIX_RATE.replace('%','') === '100'){
        rowData.FIX_YN = 'N'
      }else {
        rowData.FIX_YN = 'Y'
      }
      rowData.BSNS_CD = rowData.TARGET_BSNS_CD
      rowData.DEPT_CD = rowData.TARGET_DEPT_CD
      rowData.ASGN_CD = rowData.TARGET_ASGN_CD
      rowData.ASGN_NM = rowData.TARGET_DEPT_NM
      rowData.WEEK_FROM = searchParam.WEEK_FROM
      rowData.WEEK_TO = searchParam.WEEK_TO

      commonStore.loading = true
      router.push({path: '/30_safety/SAF_C/SAFCE0030', state: { data: rowData}})
    }
  }
}
const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: "Y",
  })
}

const onDeptSelected = (val) => {
  // console.log('val', val)
  searchParam.BSNS_CD = val.BSNS_CD
  searchParam.DEPT_CD = val.DEPT_CD
  searchParam.ASGN_CD = val.ASGN_CD
  searchParam.ASGN_NM = val.ASGN_FULL_NM
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
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('년도')"
            width="200px"
            number
            v-model="searchParam.YEAR"
            type="YEAR"
          >
          </i-select>
          <i-input
            class="mr-1"
            :label="$t('주차')"
            width="200px"
            v-model="searchParam.WEEK_FROM"
            number
          >
          </i-input>
          <span class="mt-2"> ~ </span>
          <i-input
            class="ml-1"
            width="180px"
            v-model="searchParam.WEEK_TO"
            number
          >
          </i-input>
          <i-input
            :label="$t('점검대상')"
            width="200px"
            v-model="searchParam.CLSS_TITLE"
          >
          </i-input>
          <i-input
            readonly
            v-model="searchParam.ASGN_NM"
            :label="$t('점검대상부서')"
            width="320px"
            margin="5px"
            append-inner-icon="mdi-magnify"
            clearable
            @keydown.enter="
              (e) => {
                openDeptPopup()
              }
            "
            @click:appendInner="openDeptPopup()"
          ></i-input>
          <i-input v-model="searchParam.ASGN_CD" width="95px" readonly></i-input>
          <!-- <i-select
            :label="$t('사업부')"
            width="250px" 
            :items="codeList.bsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            v-model="searchParam.BSNS_CD"
          >
          </i-select>
          <i-select
            :label="$t('점검대상 부서')"
            width="250px"
            :items="codeList.deptCd"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            v-model="searchParam.DEPT_CD"
          >
          </i-select> -->
          <span class="mt-2">협력사 제외</span>
          <v-checkbox
            v-model="searchParam.USE_DIV"
            class="ml-2 mt-1"
            true-value="Y"
            false-value="N"
          ></v-checkbox>
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('점검현황')" />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
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
    min-height: 700px;
  }
}
</style>
