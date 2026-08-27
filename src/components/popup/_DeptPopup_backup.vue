<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import _ from "lodash"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)

let hseLabel = "HSESYS 적용조직"

let options = reactive({
  disabled: {
    CMPNY_DIV: false, // 회사구분
    ORGN_DIV: false, // 직영, 사내협력사
    BSNS_CD: false, // 사업부
    HSE_ONLY: false, // HSESY적용제외
    USE_OLNY: false, // 과거조직포함
  },
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    ORGN_DIV: "",
    BSNS_CD: "",
    ASGN_NM: "",
    DEPT_CD: "", //부서코드
    HSE_ONLY: "Y",
    USE_ONLY: "Y",
  },
})

//코드리스트
const codeList = reactive({
  company: [],
  orgnDiv: [],
  bsnsCd: [],
  orgnDiv: [],
})

// 팝업 오픈 시 넘어오는 그리드 DataRow
// 작성자 : 이희원(2024-02-01)
const popParam = reactive({
  dataRow: "",
  fieldIndex: "",
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 사업부
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR

    codeList.orgnDiv = [
      { name: "전체", code: "" },
      { name: "직영", code: "A" },
      { name: "사내협력사", code: "B" },
    ]
    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    grdMain.value.setBindingColumn("CMPNY_DIV", codeList.company, "COD", "TXT") // 회사구분
    grdMain.value.setBindingColumn("BSNS_CD", codeList.bsnsCd, "BSNS_CD", "BSNS_NM") // 사업부
    grdMain.value.setBindingColumn("ORGN_DIV", codeList.orgnDiv, "code", "name") // 구분

    if (!userStore.company) {
      codeList.company = null
    }
  })
}

const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  field: [
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      width: "150",
      styleName: "left-column",
      lookupDisplay: true,
      header: { text: t("회사") },
    },
    {
      fieldName: "BSNS_CD",
      dataType: "text",
      width: "150",
      styleName: "left-column",
      lookupDisplay: true,
      header: { text: t("사업부") },
    },
    { fieldName: "PART_CD", dataType: "text", visible: false },
    { fieldName: "DEPT_CD", dataType: "text", visible: false },
    {
      fieldName: "ASGN_CD",
      dataType: "text",
      width: "150",
      header: { text: t("부서코드") },
    },
    {
      fieldName: "ASGN_SHRT_NM",
      dataType: "text",
      width: "200",
      styleName: "left-column",
      header: { text: t("부서명") },
    },
    {
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      visible: false,
    },

    {
      fieldName: "ORGN_DIV",
      dataType: "text",
      styleName: "left-column",
      lookupDisplay: true,
      header: { text: t("구분") },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = async (popupParam) => {
  console.log("???", popupParam)
  /**************** popupParam Object로 넘겨주기 *****************/
  if (!popupParam) {
    dialog.value = true

    return
  }

  if (popupParam.pageGbn === "MNG") {
    hseLabel = "HSE 경영시스템"
  }

  //팝업 오픈시HSESYS적용조직을 비활성화 시킴
  if (popupParam.HSE_SYS === "N") {
    options.values.HSE_ONLY = "N"
  } else {
    options.values.HSE_ONLY = "Y"
  }

  for (const [key, value] of Object.entries(popupParam)) {
    options.values[key] = value

    if (options.disabled.hasOwnProperty(key)) {
      options.disabled[key] = true
    }
  }

  commonSearchApi({
    queryId: "searchDept",
    param: options.values,
  }).then((res) => {
    afterSearch(res)
    dialog.value = true
    //2024-01-17 김현재 수정(현중측 요청으로 조회값이 단건일시 emit자동으로 올리는 기능 삭제)
    // if (res.ORESULT_CUR.length === 1) {
    //   emit("selected", res.ORESULT_CUR[0])
    // } else {
    //   //팝업 visible
    //   afterSearch(res)
    //   dialog.value = true
    // }
  })

  // 팝업 오픈 시 넘어오는 그리드 DataRow(그리드에 적용시킬려면 "dataRow"가 필요)
  // 작성자 : 이희원(2024-02-01)
  popParam.dataRow = popupParam.dataRow
  popParam.fieldIndex = popupParam.fieldIndex

  /*
  let func = commonSearchApi({ queryId : 'searchDept', param : options.values })

  var res = await func.then(res => {
    if (res.length === 1) {
      emit('selected', res)
    } else {
      //팝업 visible
      afterSearch(res)
      dialog.value = true
    }
  })
  */
}

//초기 데이터셋팅
onMounted(() => {
  initCodeList()
  window.addEventListener("mousemove", mouseUpdate)

  // options.values.COL1 = "2"                    //key : TEXT
  /*
  options.values.COL2 = userStore.company     //autocomplates
  options.values.COL3 = dayjs().get("year")   //spinrealgrid-lic
  options.values.COL4 = ""                    //multi autocomplates
  options.values.COL5 = dayjs().format("YYYY-MM-DD")  //date
  options.values.COL6 = ""                    //Popup
  options.values.COL7 = ""                    //radio  
  */

  //setGridEvents()
})

const onRgMainLoaded = () => {
  grdMain.value.gridView = rgMain.value.getGridView()
  grdMain.value.dataProvider = rgMain.value.getDataProvider()
}

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
  } else if (btn.id === "btnSelect") {
    onSelect()
  } else if (btn.id === "btnClose") {
    onClose()
  }
}

// 조회로직
const searchData = () => {
  return commonSearchApi({
    queryId: "searchDept",
    param: options.values,
  })
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const beforeSearch = async () => {
  grdMain.value.getDataProvider().setRows([])

  return true
}

const afterSearch = (res) => {
  let dataProvider = grdMain.value.getDataProvider()
  dataProvider.setRows(res.ORESULT_CUR)
}

const onClose = () => {
  clearField()
  dialog.value = false
}

const onSelect = () => {
  var rowIdx = grdMain.value.getGridView().getCurrent().dataRow

  var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  // 팝업 오픈 시 넘어오는 그리드 DataRow(그리드에 적용시킬려면 "dataRow"가 필요)
  // 작성자 : 이희원(2024-02-01)
  rtnData.dataRow = popParam.dataRow
  rtnData.fieldIndex = popParam.fieldIndex
  // console.log(rtnData)

  emit("selected", rtnData)
  onClose()
}

defineExpose({
  openPopup,
})

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}
//2024-01-18 김현재 추가
const clearField = () => {
  grdMain.value.getDataProvider().setRows(null)
  options.values.BSNS_CD = ""
  options.values.ASGN_NM = ""
}
/*2024-02-06 김현재 추가
한민규 매니저 요청으로
사업부 변경시 부서명,그리드 초기화 기능 추가
*/
watch(
  () => options.values.BSNS_CD,
  () => {
    options.values.ASGN_NM = ""
    options.values.DEPT_CD = ""
    grdMain.value.getDataProvider().setRows(null)
  }
)

//라디오박스 변경시 자동조회
watch(
  () => options.values.ORGN_DIV,
  () => {
    onButtonsClick({ id: "btnSearch" })
  }
)

const deptValidation = (value) => {
  options.values.DEPT_CD = options.values.DEPT_CD.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, "")
}
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    width="900"
    class="draggable-dialog bg-white"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">부서조회</div>
    <v-sheet class="rounded-t-0 pa-2" color="white">
      <IGridTitle
        :use-permission="false"
        :button-list="['btnSearch', 'btnSelect', 'btnClose']"
        @click-button="onButtonsClick"
          />
      <!-- 조회조건 -->
          <VForm ref="searchArea" class="searchArea">
            <div class=" d-flex">
              <i-select 
                  topLabel
                  :label="$t('회사구분')" 
                  labelWidth="70px"
                  width="270px"
                  required
                  v-model="options.values.CMPNY_DIV"
                  :items="codeList.company"
                  item-value="COD"
                  item-title="TXT"
                  disabled/>
                <VRadioGroup
                  v-model="options.values.ORGN_DIV"
                  style="margin: auto"
                  :disabled="options.disabled.ORGN_DIV"
                  inline
                >
                  <VRadio v-for="(item, i) in codeList.orgnDiv" :key="i" :value="item.code" :label="item.name" />
                </VRadioGroup>
                <!-- 사업부 -->
              </div>
            <div class=" d-flex mt-2">

              <i-select 
              topLabel
              :label="$t('사업부')"
                labelWidth="70px"
                width="270px"
                v-model="options.values.BSNS_CD"
                :items="codeList.bsnsCd"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                />
                <i-input
                topLabel
                width="250px"
                :label="$t('부서명')"
                v-model="options.values.ASGN_NM"
                @keydown.enter="
                  (e) => {
                    onButtonsClick({ id: 'btnSearch' })
                  }
                  "
              />
              <i-input
              topLabel
                width="250px"
                :label="$t('부서코드')"
                v-model="options.values.DEPT_CD"
                :rules="[deptValidation]"
                @keydown.enter="
                  (e) => {
                    onButtonsClick({ id: 'btnSearch' })
                  }
                  "
              />
              <!-- 부서명 -->
              </div>
              <!-- HSESYS 제외 -->
              <div class=" d-flex mt-2">
                <VCheckbox
                  v-model="options.values.HSE_ONLY"
                  :label="$t(hseLabel)"
                  :disabled="options.disabled.HSE_ONLY"
                  class="mr-5"
                  />
              <!-- 과거조직포함 -->
                <VCheckbox
                  v-model="options.values.USE_ONLY"
                  :label="$t('과거조직포함')"
                  true-value="N"
                  false-value="Y"
                  :disabled="options.disabled.USE_OLNY"
                  />
                </div>
              </VForm>
              <!-- /조회조건 -->
              
              <!-- 메인그리드 -->
              <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 500px"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onSelect"
              />
      <!-- /메인그리드 -->
    </v-sheet>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.v-sheet{
  background-color: white;
}
</style>
