<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import dayjs from "dayjs"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import SAFAB0010PopUp from "@/pages/30_safety/SAF_A/SAFAB0010AddPopUp.vue"
import SAFAB0010ManPopUp from "@/pages/30_safety/SAF_A/SAFAB0010ManPopUp.vue"
import Message from "@hiway/utils/notify"
import deleteFlowHelper from "@/utils/deleteFlowHelper"

defineOptions({
  name: "30_safety-SAF_A-SAFAB0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdDetail = ref(null)
const safab0010PopUp = ref(null)
const safa0010manpopup = ref(null)
const searchParams = reactive({ 
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: "",
    DEPT_CD: "",
    WORK_FROM: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
    WORK_TO: dayjs().format("YYYY-MM-DD"),
    ASGN_NM: ""
  })
const searchDetailParams = reactive({})
const tab = ref('tab')

const codeList = reactive({})

// 팝업
const deptPopup = ref(null)



//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: [],
  fields: [
    {
      fieldName: "BSNS_NM",
      header: { text: t("사업부") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "DEPT_NM",
      header: { text: t("부서") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ASGN_NM",
      header: { text: t("조직") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "RESP_EMP_NM",
      header: { text: t("작업책임자") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "WORK_NO",
      header: { text: t("호선") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "JOB_SPLCNM",
      header: { text: t("기본") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "DIV_M",
      header: { text: t("상세") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "WRK_DIST",
      header: { text: t("작업내용") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "DANG_DIVNM",
      header: { text: t("위험작업분류") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "CF_DIVNM",
      header: { text: t("현장/전산/대면") },
      dataType: "text",
      editable: false,
    },

    {
      fieldName: "CHECK_A_YN",
      header: { text: t("관리감독자") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    {
      fieldName: "CHECK_B_YN",
      header: { text: t("Safe클로버") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    {
      fieldName: "CHECK_C_YN",
      header: { text: t("안전요원") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    
    //  안보임

  ],
  columns: [],
  columnLayout: [
    "BSNS_NM",  
    "DEPT_NM", 
    "ASGN_NM", 
    "RESP_EMP_NM",
    "WORK_NO",
    {
      name: "장소",
      direction: "horizontal",
      items: [
        'JOB_SPLCNM', 'DIV_M'
      ],
      header: {
        text: t("장소"),
      },
    },
    "WRK_DIST",  
    "DANG_DIVNM", 
    "CF_DIVNM",  
    {
      name: "점검여부",
      direction: "horizontal",
      items: [
        "CHECK_A_YN", 
        "CHECK_B_YN", 
        "CHECK_C_YN"
      ],
      header: {
        text: t("점검여부"),
      },
    }

  ],
})

grdProps1.columns = grdProps1.fields

//
const upDataRow = () => {
  onButtonsClick({ id: "btnSearch" })
}

const upDataRowDetail = () => {
  onButtonsClick({ id: "btnSearch" })
  searchDetail()
}

//  조회
const searchData01 = () => {
  const paramsCopy = JSON.parse(JSON.stringify(searchParams))
  if (paramsCopy.WORK_FROM){
    paramsCopy.WORK_FROM = paramsCopy.WORK_FROM.replace(/-/g, '')  // 쿼리에서 -를 빼고 받음
    paramsCopy.WORK_TO = paramsCopy.WORK_TO.replace(/-/g, '') 
  }

  return commonSearchApi({ queryId: "SAFCA0010_TEST_search01" , param: paramsCopy })
}

// "SAFCA0010_TEST_search01" -> 오류
const afterSearch01 = (res) => {
  console.log(searchParams, "searchParams")
  console.log(res, "res")
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const beforeSearch01 = (res) => {
  const WF = searchParams.WORK_FROM.replace(/-/g, '') 
  const WT = searchParams.WORK_TO.replace(/-/g, '') 
  // 시작일보다 마감일이 클 경우 오류메세지
  if (WF > WT){ 
    Message.warn('점검일자를 확인하세요')
  }
  else{
    return true
  }

}


//       .setBefore(check_workdate)
// 버튼 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setBefore(beforeSearch01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  } 
}

//  팝업
const openPopup = (gbn) => {
  if (gbn === "부서조회") {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: "Y",
      ASGN_NM: searchParams.ASGN_NM,
    })
  }
}

const onDeptSelected = (val) => {
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_NM = val.ASGN_FULL_NM
  console.log(searchParams)
}

watch(
  () => searchParams.ASGN_NM,
  (newValue) => {
    if (newValue === "") {
      searchParams.BSNS_CD = ""
      searchParams.DEPT_CD = ""
    }
  }
)


onMounted(() => {})
</script>


<template>
  <div class="page-wrap">
    <VContainer class="pt-0 contentPanel">
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <VTabs v-model="tab">
        <VTab value="Dashboard">
          Dashboard
        </VTab>
        <VTab value="PTW">
          PTW
        </VTab>
      </VTabs>
      <VWindow v-model="tab">

        <VWindowItem value="PTW"> 
        <!-- 조회조건 -->
        <VRow no-gutters>
          <VCol>
            <VForm ref="searchArea" class="searchArea">
              <VRow>
                <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('점검일자')"
                    label-width="100"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <VCol md="6">
                        <v-text-field
                          v-model="searchParams.WORK_FROM" 
                          type="date"/>
                      </VCol>

                      <span class="px-2"> ~ </span>
                      <VCol md="6">
                        <v-text-field
                          v-model="searchParams.WORK_TO" 
                          type="date"/>
                      </VCol>
                    </template>
                  </ILabel>
                </VCol>
                <VCol cols="12" md="1"/>
                <VCol cols="12" md="3 ">
                  <ILabel :label="$t('부서')" label-width="100">
                    <template #editor="editorProps">
                      <v-col>
                        <VTextField
                          v-model="searchParams.ASGN_NM"
                          append-inner-icon="mdi-magnify"
                          @keydown.enter="
                            (e) => {
                              openPopup('부서조회')
                            }
                          "
                          @update:modelValue="
                            (e) => {
                              searchParams.DEPT_CD = null
                            }
                          "
                          @click:appendInner="openPopup('부서조회')"
                        />
                      </v-col>
                    </template>
                  </ILabel>
                </VCol>     
              </VRow>
            </VForm>
          </VCol>
        </VRow>

        <!-- 메인 그리드 시작 -->
        <VRow>
          <VCol cols="12" md="12">
            <IGridTitle title="PTW 대상 점검결과/현황" @click-button="onButtonsClick">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 600px"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              :column-layout="grdProps1.columnLayout"
            />
          </VCol>
        </VRow>
        <!-- 메인 그리드 끝 -->

        <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
        <SAFAB0010PopUp @upDataRow="upDataRow" ref="safab0010PopUp" />
        <SAFAB0010ManPopUp @upDataRow="upDataRowDetail" ref="safa0010manpopup" />
        </VWindowItem>
        <VWindowItem value="Dashboard">
           Dashboard
          </VWindowItem>
      
      </VWindow>

    </VContainer>
  </div>
</template>
