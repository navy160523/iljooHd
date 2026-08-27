<!-- SAFGA0010 안전 PASSPORT -->
<!-- SI2팀 김성근 2024-04-03 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonLogExecuteApi,
} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import Message from "@hiway/utils/notify"
import { useUserStore } from "@hiway/stores/user"

import img1 from "@images/pages/pose-fs-9.png"
import Tab1 from "@/pages/30_safety/SAF_G/SAFGA0010Tab1.vue"
import Tab2 from "@/pages/30_safety/SAF_G/SAFGA0010Tab2.vue"
import Tab3 from "@/pages/30_safety/SAF_G/SAFGA0010Tab3.vue"
import Tab4 from "@/pages/30_safety/SAF_G/SAFGA0010Tab4.vue"
import Tab5 from "@/pages/30_safety/SAF_G/SAFGA0010Tab5.vue"
import Tab6 from "@/pages/30_safety/SAF_G/SAFGA0010Tab6.vue"
import Tab7 from "@/pages/30_safety/SAF_G/SAFGA0010Tab7.vue"

defineOptions({
  name: "30_safety-SAF_G-SAFGA0010",
})
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)

const grdMain = ref(null)
const radios = ref("")
const tab = ref("")
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  HLD_OFFI_GBN: "N",
  EMP_NO: '',
  EMP_NM: '',
  // EMP_NO: userStore.empNo,
  // EMP_NM: userStore.empNm,
  USER_DIV: "",
  SEARCH_GBN: "A",
})
const searchGbn = ref("A")
const IntDataSub = reactive({
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
})

const img = ref("")
const inJu = reactive({
  name: "",
  EMP_NO: "",
  dept: "",
  asgn: "",
  telNo: "",
  url: img1,
})

const reRander = ref(0)
const noGRP = ref(['GRP00381', 'GRP00386', 'GRP00387', 'GRP00374'].some(code => userStore.authGrpCd.includes(code)))
const NOBSNS = ref(false)
const NOCMP = ref(false)
// 직영:A,사내협력사:B,단기공사=D,기타=Z, 전제=''
const codeList = reactive({
  orgnDiv: [
    { name: "전체", code: "" },
    { name: "직영", code: "A" },
    { name: "사내협력사", code: "B" },
    { name: "단기공사", code: "D" },
    { name: "기타", code: "Z" },
  ],
  GBN: [
    { name: "주민/인증번호", code: "A" },
    { name: "사번", code: "B" },
  ],
})

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: [""],
  fields: [
    {
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      header: { text: t("소속조직/협력사") },
      styleName: "left-column",
    },
    { fieldName: "DEPT_CD", dataType: "text", header: { text: t("부서코드") } },
    { fieldName: "ASGN_CD", dataType: "text", header: { text: t("소속코드") }, visible: false},
    {
      fieldName: "USER_DIVNM",
      dataType: "text",
      header: { text: t("소속구분") },
    },
    { fieldName: "JOB_TIT_NM", dataType: "text", header: { text: t("직위") } },
    { fieldName: "EMP_NO", dataType: "text", header: { text: t("사번") } },
    { fieldName: "KOR_NM", dataType: "text", header: { text: t("성명") } },
    {
      fieldName: "GRP_ENT_DATE",
      dataType: "text",
      header: { text: t("그룹 입사일") },
    },
    {
      fieldName: "COM_ENT_DATE",
      dataType: "text",
      header: { text: t("입사일") },
    },
    {
      fieldName: "HLD_OFFI_GBN",
      dataType: "text",
      header: { text: t("재직구분") },
    },
    { fieldName: "HND_PHN", dataType: "text", header: { text: t("연락처") } },
    {
      fieldName: "BIRTH_DAY",
      dataType: "text",
      header: { text: t("생년월일") },
    },
    { fieldName: "UNT_DUTY_NM", dataType: "text", header: { text: t("직무") } },

    { fieldName: "USER_DIV", visible: false },
    { fieldName: "EMP_NO_ENC", visible: false },
    { fieldName: "DEPT_NM", visible: false },
    { fieldName: "ASGN_SHRT_NM", visible: false },
    { fieldName: "CMPNY_DIV", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//  이벤트 시작

// 초기값 세팅
onMounted(() => {
  console.log(userStore, "userStore")
  console.log(noGRP.value,'noGRP')
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: "N" },
    }),
    commonSearchApi({
      queryId: "searchDept3",
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        BSNS_CD: searchParams.BSNS_CD,
      },
    }),
    getCompanyList(),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })

    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
    codeList.CMPNY_DIV = res[2].ORESULT_CUR
    codeList.CMPNY_DIV.unshift({ TXT: "전체", COD: "" })
    console.log(res[2].ORESULT_CUR, "res[2].ORESULT_CUR")
  })







  onButtonsClick({ id: "btnSearch" })
})

// 회사 변경감지
watch(
  () => searchParams.CMPNY_DIV,
  (newValue) => {
    if (!newValue) {
      NOCMP.value = true
      searchParams.BSNS_CD = ""
    } else {
      commonSearchApi({
        queryId: "searchBSNS",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: "N" },
      }).then((res) => {
        searchParams.BSNS_CD = ""
        codeList.BSNS_CD = res.ORESULT_CUR
        codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
        NOCMP.value = false
      })
    }
  }
)

// 사업부 변경감지
watch(
  () => searchParams.BSNS_CD,
  (newValue) => {
    if (!newValue) {
      NOBSNS.value = true
      searchParams.DEPT_CD = ""
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        searchParams.DEPT_CD = ""
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        NOBSNS.value = false
      })
    }
  }
)

// 버튼이벤트
const onButtonsClick = (btn) => {
  if ((btn.id = "btnSearch")) {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  }
}

// 메인 조회
const beforeSearch = () => {
  // 초기화
  for (let i in inJu) {
    inJu[i] = ""
  }

  img.value = ""
  searchGbn.value = "A"

  if (!searchParams.BSNS_CD && !searchParams.DEPT_CD) {
    if (!searchParams.EMP_NM && !searchParams.EMP_NO) {
      Message.warn(
        t("사업부와 부서를 전체로 하면 성명 혹은 사번 입력은 필수입니다.")
      )
      return false
    }
  }
  return true
}

const searchData01 = (idx) => {
  return commonSearchApi({
    queryId: "SAFGA0010_search00",
    param: searchParams,
  })
}

const afterSearch01 = (res) => {
  logSave()
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  tab.value = "one"
}

const set_gbn = async () => {
  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  let rowData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  
  await commonSearchApi({
    queryId: searchGbn.value === 'A' ?  `SAFGA0010_search02` : `SAFGA0010_search02_2`,
    param: rowData,
  }).then((res) => {
    IntDataSub[2] = []
    if (res.ORESULT_CUR[0]) {
      for (let i in res.ORESULT_CUR) {
        IntDataSub[2][i] = res.ORESULT_CUR[i]
      }
    }
  })
  reRander.value++
}

// 서브조회
const subSearch = async (param) => {
  param.GBN = searchGbn.value
  
  for (let index = 1; index <= 7; index++) {
    await commonSearchApi({
      queryId: `SAFGA0010_search0${index}`,
      param: param,
    }).then((res) => {
      IntDataSub[index] = []
      if (res.ORESULT_CUR[0]) {
        for (let i in res.ORESULT_CUR) {
          IntDataSub[index][i] = res.ORESULT_CUR[i]
        }
      } else {
        IntDataSub[index] = []
      }
    })
  }
  reRander.value++
}

// 개인정보 조회
const logSave = () => {
  let afterparams = {
    userStore: userStore,
    params: searchParams,
    mgs: "[SafetyPassport] 화면 - 개인정보관련 조회했습니다",
    crudGbn: "R", //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: "", //사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }

  // 로그기록
  commonLogExecuteApi(afterparams)
}

// 로우챌린지
const rowChanged = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    for (let i in IntDataSub) {
      IntDataSub[i] = []
    }
    console.log(IntDataSub)
    return reRander.value++
  }
  let rowData = grdMain.value.getDataProvider().getJsonRow(newRow)
  inJu.name = `${rowData.KOR_NM}(${rowData.EMP_NO}) ${
    rowData.JOB_TIT_NM ? rowData.JOB_TIT_NM : ""
  }`
  inJu.dept = `${rowData.DEPT_NM ? rowData.DEPT_NM : ""}`
  inJu.asgn = `${rowData.ASGN_SHRT_NM ? rowData.ASGN_SHRT_NM : ""}`
  inJu.telNo = `${rowData.HND_PHN ? rowData.HND_PHN : ""}`

  // console.log(imgRef,'imgRef')

  if (rowData.USER_DIV == "A") {
    img.value = rowData.EMP_NO_ENC
    inJu.url = `http://hihr.hhi.co.kr/EHR/PHOTO/searchPhoto_dec/searchPhoto_dec/?_params=[EMPLID=${img.value}]`
    console.log(inJu.url)
  } else {
    img.value = rowData.EMP_NO
    inJu.url = `http://SCMS.HHIGROUP.KR/services/Common/LoadResources.aspx?EID=${img.value}`
    console.log(inJu.url)
  }
  // sub1Search(rowData)
  // sub2Search(rowData)
  subSearch(rowData)
}

// 기타 이벤트
const errorImg = () => {
  inJu.url = img1
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
            :label="$t('회사')"
            width="200px"
            margin="10px"
            placeholder="회사"
            v-model="searchParams.CMPNY_DIV"
            :items="codeList.CMPNY_DIV"
            item-value="COD"
            item-title="TXT"
            required
          />

          <div class="d-flex align-center">
            소속
            <v-radio-group
              v-model="searchParams.USER_DIV"
              class="radio-box mx-3"
              inline
            >
              <v-radio
                v-for="(item, i) in codeList.orgnDiv"
                :key="i"
                :value="item.code"
                :label="item.name"
              />
            </v-radio-group>
          </div>

          <i-select
            :label="$t('사업부')"
            width="200px"
            margin="10px"
            placeholder="사업부"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            required
            :disabled="NOCMP || !noGRP"
          />
          <i-select
            :label="$t('부서')"
            width="240px"
            margin="10px"
            placeholder="부서"
            v-model="searchParams.DEPT_CD"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
            :disabled="NOBSNS || !noGRP"
          />
          <i-input
            :label="$t('성명')"
            width="140px"
            margin="10px"
            v-model="searchParams.EMP_NM"
            @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
          />
          <i-input
            :label="$t('사번')"
            width="140px"
            margin="10px"
            v-model="searchParams.EMP_NO"
            @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
          />
          <v-checkbox
            style="margin-top: 3px"
            top-label
            v-model="searchParams.HLD_OFFI_GBN"
            true-value="Y"
            false-value="N"
            :label="$t('퇴직자포함')"
          />
        </v-sheet>

        <v-sheet height="50%" class="mb-3">
          <IGridTitle :title="$t('작성정보')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCurrentRowChanged="rowChanged"
          />
        </v-sheet>

        <v-sheet class="h-auto">
          <IGridTitle :title="$t('SAFETY PASSPORT')">
            <template #editors />
          </IGridTitle>

          <div class="h-grow">
            <v-sheet width="300px" class="pa-0 h-auto mr-3">
              <v-card-title>{{ inJu.name }}</v-card-title>
              <VImg @error="errorImg" height="150" :src="inJu.url" />
              <v-divider class="mt-3"></v-divider>
              <v-card-item class="item-Box">{{ inJu.dept }}</v-card-item>
              <v-divider></v-divider>
              <v-card-item class="item-Box">{{ inJu.asgn }}</v-card-item>
              <v-divider></v-divider>
              <v-card-item class="item-Box">{{ inJu.telNo }}</v-card-item>
            </v-sheet>
            <v-sheet width="90%" class="pa-0 h-auto">
              <VTabs v-model="tab">
                <VTab value="one">안전포상</VTab>
                <VTab value="two">장비자격</VTab>
                <VTab value="three">안전교육</VTab>
                <VTab value="four">수칙위반</VTab>
                <VTab value="five">작업제한</VTab>
                <VTab value="six">재해이력</VTab>
                <VTab value="seven">단기공사</VTab>
              </VTabs>
              <!--  v-if="userStore.userDiv === 'D'" // 나중에 권한 통재로 준다고해서 주석처리 -->

              <VWindow v-model="tab">
                <VWindowItem value="one">
                  <Tab1 :IntData="IntDataSub[1]" :key="reRander"/>
                </VWindowItem>
                <VWindowItem value="two">

                  <div class="d-flex align-center" style="width: 240px; margin: 10px;">
                    <v-radio-group
                      v-model="searchGbn"
                      class="radio-box mx-3"
                      inline
                      @change="set_gbn"
                    >
                      <v-radio
                        v-for="(item, i) in codeList.GBN"
                        :key="i"
                        :value="item.code"
                        :label="item.name"
                      />
                    </v-radio-group>
                  </div>

                  <Tab2 :IntData="IntDataSub[2]" :key="reRander"/>
                </VWindowItem>
                <VWindowItem value="three">
                  <Tab3 :IntData="IntDataSub[3]" :key="reRander" />
                </VWindowItem>
                <VWindowItem value="four">
                  <Tab4 :IntData="IntDataSub[4]" :key="reRander" />
                </VWindowItem>
                <VWindowItem value="five">
                  <Tab5 :IntData="IntDataSub[5]" :key="reRander" />
                </VWindowItem>
                <VWindowItem value="six">
                  <Tab6 :IntData="IntDataSub[6]" :key="reRander" />
                </VWindowItem>
                <VWindowItem value="seven">
                  <Tab7 :IntData="IntDataSub[7]" :key="reRander" />
                </VWindowItem>
              </VWindow>
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}

.radio-box {
  background-color: #fff;
  padding: 3px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
}
.item-Box {
  text-align: center;
  height: 20px;
  padding: 4px 0 !important;
}
</style>
