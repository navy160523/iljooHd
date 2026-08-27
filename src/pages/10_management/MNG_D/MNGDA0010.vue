<script setup>
import { ref, reactive, onMounted, getCurrentInstance, onBeforeUpdate } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import { required } from "@hiway/utils/validation"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import MNGDA0010Popup from "./MNGDA0010Popup.vue"

/*
화면명 : 인증심사 계획 및 현황 (MNGDA0010)
화면개요 : 부서별 심사 계획 및 현황을 조회하는 화면
*/

defineOptions({
  name: "10_management-MNG_D-MNGDA0010",
})
//변수 선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const mNGDA0010Popup = ref(null)
//변수선언부 끝

//조회조건
let searchParams = reactive({
  CMPNY_DIV: "HHI",
  BSNS_CD: "",
  BUMUN_CD: "",
  ASGN_CD: "",
  YEAR: "",
})

//팝업열때 넘겨주는 값
let searchPopupParam = reactive({
  ASGN_CD: "",
  BSNS_CD: "",
})

// 년도
let getNowYear = new Date().toJSON().slice(0, 4).replace(/-/g, "/")
searchParams.YEAR = getNowYear

//저장조건
let saveParams = []

//코드리스트 선언
const codeList = reactive({
  company: [], //회사
  bsnsCd: [], //사업부
  asgnCd: [], //부서
  bumun: [], //부문
})

//내부,외부 셀에 1~12월 바인딩변수
const cellDate = [
  { label: "1월", value: "1" },
  { label: "2월", value: "2" },
  { label: "3월", value: "3" },
  { label: "4월", value: "4" },
  { label: "5월", value: "5" },
  { label: "6월", value: "6" },
  { label: "7월", value: "7" },
  { label: "8월", value: "8" },
  { label: "9월", value: "9" },
  { label: "10월", value: "10" },
  { label: "11월", value: "11" },
  { label: "12월", value: "12" },
]

// 검색조건 (사업부, 부문)
const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: "searchCommonCode",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: "HHIAF18",
        USE_FLAG: "Y",
      },
    }),
  ]).then((res) => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bumun = res[1].ORESULT_CUR

    grdMain.value.setBindingColumn("COL01", codeList.bsnsCd, "BSNS_CD", "BSNS_NM")
    grdMain.value.setBindingColumn("COL03", codeList.bumun, "COD", "TXT")
    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.bumun.unshift({ TXT: "전체", COD: "" })
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    header: { height: 60 },
  },
  keys: ["COL01"],
  fields: [
    { fieldName: "BSNS_NM", dataType: "text" },
    { fieldName: "ASGN_NM", dataType: "text" },
    { fieldName: "BUMUN_NM", dataType: "text" },
    { fieldName: "LAST_YEAR", dataType: "text" },
    { fieldName: "IN_YN", dataType: "text" },
    { fieldName: "OT_YN", dataType: "text" },
    { fieldName: "IN_MM", dataType: "text" },
    { fieldName: "OT_MM", dataType: "text" },
    { fieldName: "BSNS_CD", dataType: "text" },
    { fieldName: "ASGN_CD", dataType: "text" },
  ],
  columns: [
    {
      name: "COL01",
      fieldName: "BSNS_NM",
      width: "50",
      lookupDisplay: true,
      header: { text: t("사업부") },
      mergeRule: { criteria: "value" },
      editor: { domainOnly: true, partialMatch: true },
      editable: false,
    },
    {
      name: "COL02",
      fieldName: "ASGN_NM",
      width: "60",
      lookupDisplay: true,
      header: { text: t("부서") },
      mergeRule: { criteria: "value" },
      editable: false,
      editor: {
        type: "dropdown",
        dropDownCount: 5,
        domainOnly: true,
        partialMatch: true,
      },
    },
    {
      name: "COL03",
      fieldName: "BUMUN_NM",
      width: "60",
      lookupDisplay: true,
      header: { text: t("구분") },
      editable: false,
      editor: {
        type: "dropdown",
        dropDownCount: 5,
        domainOnly: true,
        partialMatch: true,
      },
    },
    {
      name: "COL04",
      fieldName: "LAST_YEAR",
      width: "50",
      editable: false,
      header: { text: t("최종심사년도") },
    },
    {
      name: "COL05",
      fieldName: "IN_YN",
      width: "20",
      header: { text: t("내부") },
      lookupDisplay: true,
      lookupData: cellDate,
      editor: {
        type: "dropdown",
        dropDownCount: 5,
        domainOnly: true,
        partialMatch: true,
      },
    },
    {
      name: "COL06",
      fieldName: "OT_YN",
      width: "20",
      header: { text: t("외부") },
      lookupDisplay: true,
      lookupData: cellDate,
      editor: {
        type: "dropdown",
        dropDownCount: 5,
        domainOnly: true,
        partialMatch: true,
      },
    },

    {
      name: "COL07",
      fieldName: "IN_MM",
      width: "20",
      editable: false,
      header: { text: t("내부") },
    },
    {
      name: "COL08",
      fieldName: "OT_MM",
      width: "20",
      editable: false,
      header: { text: t("외부") },
    },
    {
      name: "COL09",
      fieldName: "BSNS_CD",
      width: "120",
      lookupDisplay: true,
      header: { text: t("사업부 코드") },

      editor: {
        type: "dropdown",
        dropDownCount: 5,
        domainOnly: true,
        partialMatch: true,
      },
    },
    {
      name: "COL10",
      fieldName: "ASGN_CD",
      width: "120",
      lookupDisplay: true,
      header: { text: t("부서 코드") },
      editor: {
        type: "dropdown",
        dropDownCount: 5,
        domainOnly: true,
        partialMatch: true,
      },
    },
  ],
  columnLayout: [
    "COL01",
    "COL02",
    "COL03",
    "COL04",
    {
      name: "그룹COL1",
      direction: "horizontal",
      items: ["COL05", "COL06"],
      header: { text: searchParams.YEAR },
    },
    {
      name: "그룹COL2",
      direction: "horizontal",
      items: ["COL07", "COL08"],
      header: { text: "내,외부 부적합 현황" },
    },
  ],
})

//초기 데이터셋팅
onMounted(() => {
  initCodeList()
  searchParams.ASGN_CD = userStore.asgnCd
  searchParams.BSNS_CD = userStore.bsnsCd
  onButtonsClick({ id: "btnSearch" })
})

// 사업부가 바뀌면 부서 데이터 가져옴
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: "searchDept",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ORGN_DIV: "A",
        BSNS_CD: newValue,
        ASGN_NM: "",
        HSE_ONLY: " ",
        USE_ONLY: "Y",
      },
    }).then((res) => {
      searchParams.ASGN_CD = "" //사업부가 바뀌면 부서에 코드값이 남아 있어서 추가함
      codeList.asgnCd = res.ORESULT_CUR
      codeList.asgnCd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
    })
  },
  {
    immediate: true,
  }
)

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === "btnCreate") {
    addData()
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  } else if (btn.id === "btnDelete") {
    deleteData()
  } else {
    openPopup()
  }
}

//조회관련 로직 시작
const beforeSearch = async () => {
  return true
}

// 조회로직
const searchData = () => {
  return commonSearchApi({
    queryId: "MNGDA0010_search01",
    param: searchParams,
  })
}

const afterSearch = (res) => {
  grdMain.value.getGridView().layoutByName("그룹COL1").header.text = searchParams.YEAR //입력한 조회조건 연도로 그리드 컬럼 헤더 변경
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//저장관련 로직 시작
const beforeSave = () => {
  // 체크된 컬럼 확인 작업
  let rowNum = grdMain.value.getGridView().getCheckedRows(true)
  if (rowNum.length === 0) {
    Message.warn(t("저장할 데이터를 선택해 주세요."))
    return false
  }
  // 선택한 row 데이터 가져와 saveParams에 넣어줌
  let saveParamArr = []
  for (var i in rowNum) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowNum[i])

    saveParamArr.push({
      CMPNY_DIV: userStore.cmpnyDiv, // 회사 코드
      YEAR: searchParams.YEAR, // 해당 년도
      BSNS_CD: data.BSNS_CD, // 사업부 코드
      ASGN_CD: data.ASGN_CD, // 부서 코드
      IN_MM: data.IN_YN, // 내부 예정월
      OT_MM: data.OT_YN, // 외부 예정월
      IN_YN: data.IN_YN ? "Y" : "N", // 내부 예정월 사용 여부
      OT_YN: data.OT_YN ? "Y" : "N", // 외부 예정월 사용 여부
      REMARKS: "", // 비고 (사용X)
      SAVE_YN: "", // 저장여부? (쿼리문에 포함 안되어있음?)
      USER_ID: userStore.userId, // 로그인 사용자 정보
      RES_COD: "", // return 값
      RES_MSG: "", // return 값
      RES_COL: "", // return 값
    })
  }
  saveParams = saveParamArr

  return saveParams
}

const saveData = () => {
  return commonExecuteApi({
    queryId: "MNGDA0010_save01",
    list: saveParams,
  })
}
//저장관련 로직 끝

//팝업 오픈
const openPopup = () => {
  //팝업열때 선택한 로우 데이터에 해당하는 사업부,부서값을 넘겨주고
  //팝업에서는 받은 값에대한 데이터를 조회함
  //선택한 로우 데이터가 없으면 전체조회
  mNGDA0010Popup.value.openPopup(searchPopupParam)
}

//셀클릭 이벤트
const onCellClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex)
  searchPopupParam.BSNS_CD = data.BSNS_CD //사업부코드
  searchPopupParam.ASGN_CD = data.ASGN_CD //부서코드
}
</script>

<template>
  <div>
    <VContainer class="pt-0">
      <div class="contentPanel">
        <VRow>
          <VCol>
            <IMenuTitle
              ref="menuTitle"
              :title="$t(useLogsStore().menuId)"
              :button-list="['btnSearch', 'btnUpdate', 'btnReviewManagement']"
              @click-button="onButtonsClick"
            />
          </VCol>
        </VRow>

        <!-- 조회조건 -->
        <VRow>
          <VCol>
            <VForm ref="searchArea" class="searchArea">
              <VRow>
                <VCol cols="12" md="3">
                  <ILabel :label="$t('년도')" label-width="150" required>
                    <template #editor="editorProps">
                      <VTextField
                        v-model="searchParams.YEAR"
                        type="number"
                        :min="2000"
                        :max="3000"
                        oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
                      />
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="3">
                  <ILabel :label="$t('사업부')" label-width="150">
                    <template #editor="editorProps">
                      <VAutocomplete
                        v-model="searchParams.BSNS_CD"
                        :items="codeList.bsnsCd"
                        item-value="BSNS_CD"
                        item-title="BSNS_NM"
                      />
                    </template>
                  </ILabel>
                </VCol>
                <VCol cols="12" md="3">
                  <ILabel :label="$t('부서')" label-width="150">
                    <template #editor="editorProps">
                      <VAutocomplete
                        v-model="searchParams.ASGN_CD"
                        :items="codeList.asgnCd"
                        item-title="ASGN_SHRT_NM"
                        item-value="ASGN_CD"
                      />
                    </template>
                  </ILabel>
                </VCol>
                <VCol cols="12" md="3">
                  <ILabel :label="$t('부문')" label-width="150">
                    <template #editor="editorProps">
                      <VAutocomplete
                        v-model="searchParams.BUMUN_CD"
                        :items="codeList.bumun"
                        item-value="COD"
                        item-title="TXT"
                      />
                    </template>
                  </ILabel>
                </VCol>
              </VRow>
            </VForm>
          </VCol>
        </VRow>
        <!-- /조회조건 -->

        <!-- 메인그리드 -->
        <VRow>
          <VCol>
            <IGridTitle :title="$t('부서별 심사대상 관리')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 650px"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onCellClicked"
            />
          </VCol>
          <!-- @loaded="loaded" -->
        </VRow>
        <!-- /메인그리드 -->
        <MNGDA0010Popup ref="mNGDA0010Popup"></MNGDA0010Popup>
      </div>
    </VContainer>
  </div>
</template>
