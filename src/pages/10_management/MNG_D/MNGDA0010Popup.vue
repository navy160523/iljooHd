<script setup>
import { ref, reactive, onMounted, watch, toRef } from "vue"
import IMenuTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { commonSearchApi, commonExecuteApi } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { notify } from "@kyvg/vue3-notification"
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"

defineOptions({
  name: "MNGDA0010Popup",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const grdPopMain = ref(null)
const searchArea = ref(null)
let dialog = ref(false)

const codeList = reactive({
  company: [], //회사
  bsnsCd: [], //사업부
  asgnCd: [], //부서
  bumun: [], //부문
})

let searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: "", //사업부
  ASGN_CD: "", //부서
})

let saveParams = reactive([])

let bumunParam = ref("") //그리드 위 룩업 바인딩 변수

let selectedRow = reactive([])

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
    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    grdPopMain.value.setBindingColumn("BUMUN_CD", codeList.bumun, "COD", "TXT")
  })
}

const grdPopMainProps = reactive({
  gridViewOption: { header: { height: 60 }, checkBar: { visible: true } },
  fields: [
    {
      fieldName: "BSNS_NM",
      dataType: "text",
      width: "150",
      header: { text: t("사업부") },
      mergeRule: { criteria: "value" },
      editable: false,
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "150",
      header: { text: t("부서") },
      editable: false,
    },
    {
      fieldName: "BUMUN_CD",
      dataType: "text",
      width: "150",
      header: { text: t("부문") },
      lookupDisplay: true,
      editor: {
        type: "dropdown",
        dropDownCount: 5,
        domainOnly: true,
        partialMatch: true,
      },
    },
    {
      fieldName: "ASGN_CD",
      dataType: "text",
      width: "150",
      header: { text: t(" ") },
      visible: false,
      editable: false,
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      width: "150",
      header: { text: t(" ") },
      visible: false,
      editable: false,
    },
    {
      fieldName: "BSNS_CD",
      dataType: "text",
      width: "150",
      header: { text: t(" ") },
      visible: false,
      editable: false,
    },
  ],
  columns: [],
})

grdPopMainProps.columns = grdPopMainProps.fields

const openPopup = (param) => {
  dialog.value = true
  initCodeList()
  searchParams.BSNS_CD = param.BSNS_CD
  searchParams.ASGN_CD = param.ASGN_CD
  onButtonsClick({ id: "btnSearch" })
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdPopMain])
      .setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setGridList([grdPopMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })
      })
      .run()
  } else if (btn.id === "btnClose") {
    closePopup()
  } else {
    allAccept()
  }
}

const closePopup = () => {
  grdPopMain.value.getDataProvider().setRows("")
  searchParams.BSNS_CD = ""
  searchParams.ASGN_CD = ""
  bumunParam.value = ""
  dialog.value = false
}

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
      //searchParams.ASGN_CD = "" //사업부가 바뀌면 부서에 코드값이 남아 있어서 추가함
      codeList.asgnCd = res.ORESULT_CUR
      codeList.asgnCd.unshift({ ASGN_SHRT_NM: "전체", ASGN_CD: "" })
    })
  },
  {
    immediate: true,
  }
)

defineExpose({
  openPopup,
})

//조회관련 로직 시작
const beforeSearch = async () => {
  return true
}

const searchData = () => {
  return commonSearchApi({
    queryId: "MNGDA00010_POP_search01",
    param: searchParams,
  })
}

const afterSearch = (res) => {
  grdPopMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//저장관련 로직 시작
const beforeSave = () => {
  let data = grdPopMain.value.getGridView().getCheckedRows(true)
  if (data.length === 0) {
    Message.warn("저장할 데이터를 선택해주세요")
    return false
  }
  return true
}

const saveData = () => {
  saveParams = []
  let data = grdPopMain.value.getGridView().getCheckedRows(true)
  if (data.length === 0) {
    Message.warn("저장할 데이터를 선택해주세요")
    return false
  }
  for (let i = 0; i < data.length; i++) {
    let saveRow = grdPopMain.value.getDataProvider().getJsonRow(data[i])
    saveRow.REMARKS = ""
    saveRow.SAVE_YN = ""
    saveRow.USER_ID = userStore.userId
    saveParams.push(saveRow)
  }
  return commonExecuteApi({ queryId: "MNGDA0010_POP_save01", list: saveParams })
}
//저장관련 로직 끝

//일괄적용 버튼 눌렀을때 실행되는 함수
const allAccept = () => {
  if (bumunParam.value === "") {
    Message.warn("부문을 선택해주세요")
  }
  let data = grdPopMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < data.length; i++) {
    let grdJsonRow = grdPopMain.value.getDataProvider().getJsonRow(data[i])
    grdJsonRow.BUMUN_CD = bumunParam.value
    grdPopMain.value.getGridView().setValue(data[i], "BUMUN_CD", bumunParam.value)
  }
}
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="900"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">인증심사 계획 및 현황</div>
    <VContainer style="background-color: white">
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            :button-list="['btnSearch', 'btnUpdate', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <!-- 조회조건 -->
      <VRow>
        <VCol>
          <VForm ref="searchArea" style="background-color: #fafafa" class="searchArea">
            <VRow>
              <!-- 회사구분 -->
              <VCol cols="12" md="6">
                <ILabel :label="$t('사업부')" label-width="100">
                  <template #editor="{ editorProps }">
                    <VAutocomplete
                      v-model="searchParams.BSNS_CD"
                      :items="codeList.bsnsCd"
                      item-value="BSNS_CD"
                      item-title="BSNS_NM"
                    />
                  </template>
                </ILabel>
              </VCol>
              <!-- 사업부 -->
              <VCol cols="12" md="6">
                <ILabel :label="$t('부서')" label-width="100">
                  <template #editor="editorProps">
                    <VAutocomplete
                      v-model="searchParams.ASGN_CD"
                      :items="codeList.asgnCd"
                      item-value="ASGN_CD"
                      item-title="ASGN_SHRT_NM"
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
          <IGridTitle :title="$t('부서별 부문관리')" :button-list="['btnCollectiveApp']" @click-button="onButtonsClick">
            <template #editors="editors">
              <span>선택한 부서를</span>
              <VAutocomplete
                v-model="bumunParam"
                :items="codeList.bumun"
                item-value="COD"
                item-title="TXT"
                class="mx-2"
                style="width: 200px"
              />
              <span>부문으로</span>
            </template>
          </IGridTitle>
        </VCol>
      </VRow>
      <VRow>
        <VCol>
          <RealGrid
            ref="grdPopMain"
            class="mt-2"
            style="height: 500px"
            :grid-view-option="grdPopMainProps.gridViewOption"
            :keys="grdPopMainProps.keys"
            :fields="grdPopMainProps.fields"
            :columns="grdPopMainProps.columns"
            @onItemChecked="onItemChecked"
          />
        </VCol>
      </VRow>
    </VContainer>
  </VDialog>
</template>
