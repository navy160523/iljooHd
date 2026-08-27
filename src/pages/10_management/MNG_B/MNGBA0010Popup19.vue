<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
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
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const dialog = ref(false)
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().$y + '',
  WEEK_FROM: 1,
  WEEK_TO: "",
  CLSS_TITLE: "",
  BSNS_CD: "",
  DEPT_CD: "",
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
      fieldName: "BSNS_NM",
      dataType: "text",
      editable: false,
      header: { text: t("사업부") },
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "DEPT_NM",
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
      fieldName: "CHK_CNT",
      dataType: "number",
      editable: false,
      styleName: "right-column",
      numberFormat: "#,###",
      header: { text: t("점검건수") },
    },
    {
      fieldName: "OK_CNT",
      dataType: "number",
      editable: false,
      width: "80",
      styleName: "right-column",
      numberFormat: "#,###",
      header: { text: t("양호건수") },
    },
    {
      fieldName: "BAD_CNT",
      dataType: "number",
      editable: false,
      width: "80",
      styleName: "right-column",
      numberFormat: "#,###",
      header: { text: t("부적합건수") },
    },
    {
      fieldName: "OK_RATE",
      dataType: "text",
      editable: false,
      width: "80",
      styleName: "right-column",
      header: { text: t("양호율(%)") },
    },
    {
      fieldName: "FIX_CNT",
      dataType: "number",
      editable: false,
      styleName: "right-column",
      numberFormat: "#,###",
      header: { text: t("조치건수") },
    },
    {
      fieldName: "FIX_RATE",
      dataType: "text",
      editable: false,
      width: "80",
      styleName: "right-column",
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
  ],
  columns: [],
  columnLayout: [
    "YEAR",
    "CLSS_TITLE",
    "BSNS_NM",
    "DEPT_NM",
    "WEEK",
    {
      name: "점검결과",
      direction: "horizontal",
      items: ["CHK_CNT", "OK_CNT", "BAD_CNT", "OK_RATE"],
    },
    {
      name: "조치결과",
      direction: "horizontal",
      items: ["FIX_CNT", "FIX_RATE"],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }
  else if (btn.id === "btnClose") {
    onClose()
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

//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {  
  initCodeList()
  searchParam.WEEK_TO = getWeek()
  //팝업 오픈
  dialog.value = true 
}

defineExpose({
  openPopup,
})
//조회관련 로직 끝
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1600"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{'중대성사고 대책 이행점검 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('중대성사고 대책 이행점검')"
          :button-list="['btnSearch', 'btnClose']"
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
            <i-select
              :label="$t('사업부')"
              width="200px"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              v-model="searchParam.BSNS_CD"
            >
            </i-select>
            <i-select
              :label="$t('부서')"
              width="200px"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              v-model="searchParam.DEPT_CD"
            >
            </i-select>
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
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
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
