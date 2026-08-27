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
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(["selected"])
const dialog = ref(false)
const grdMain = ref(null)


let openParams = reactive({
  title: '',
  dataRow: null,
  fieldIndex: null,
  checkBar: false
})

let options = reactive({
  disabled: {
    CMPNY_DIV: false, // 회사구분
    USER_DIV: false, // 직영, 사내협력사
    BSNS_CD: false, // 사업부
    DEPT_CD: false, // HSESY적용제외
  },
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    USER_DIV: 'A',
    BSNS_CD: '',
    DEPT_CD: '',
    EMP_NM: '',
    EMP_NO: '',
    FLAG: 'N', //퇴직자 포함 여부 플래그값
  },
  multi: false,
})

//코드리스트 선언
const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
  USER_DIV: [
    { COD: "", TXT: "전체", DISABLE: false },
    { COD: "A", TXT: "직영", DISABLE: false },
    { COD: "B", TXT: "사내협력사", DISABLE: false },
    { COD: "D", TXT: "단기공사", DISABLE: false },
    { COD: "Z", TXT: "기타", DISABLE: false },
  ],
  accdntType: [],
  proc: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: ["CMPNY_DIV"],
  field: [
    {
      fieldName: "USER_DIV",
      dataType: "text",
      width: "90",
      header: { text: t("소속구분") },
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.USER_DIV },
    },
    { fieldName: "ASGN_NM", dataType: "text", width: "300", styleName: "left-column", header: { text: t("소속") } },
    { fieldName: "EMP_NO", dataType: "text", width: "90", header: { text: t("사번") } },
    { fieldName: "JOB_TIT_NM", dataType: "text", width: "90", header: { text: t("직급") } },
    { fieldName: "EMP_NM", dataType: "text", width: "90", header: { text: t("성명") } },
    { fieldName: "TEL_NO", dataType: "text", width: "150", header: { text: t("사내번호") } },
    { fieldName: "HLD_OFFI_GBN", dataType: "text", header: { text: t("재직여부") } },
    { fieldName: "BIRTH_DAY", dataType: "text", width: "100", header: { text: t("생년월일") }, visible: false },
    
    // 숨기는 필드 visible:'false'
    { fieldName: "ADDR", dataType: "text", visible: false },
    { fieldName: "ADDR1", dataType: "text", visible: false },
    { fieldName: "AGE", dataType: "text", visible: false },
    { fieldName: "AGE_KOR", dataType: "text", visible: false },
    { fieldName: "ASGN_CD", dataType: "text", visible: false },
    { fieldName: "ASGN_SHRT_NM", dataType: "text", visible: false },
    { fieldName: "BSNS_CD", dataType: "text", visible: false },
    { fieldName: "BSNS_NM", dataType: "text", visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "COMPANY", dataType: "text", visible: false },
    { fieldName: "COM_ENT_DATE", dataType: "text", visible: false },
    { fieldName: "DEPT_CD", dataType: "text", visible: false },
    { fieldName: "DEPT_NM", dataType: "text", visible: false },
    { fieldName: "EMAIL", dataType: "text", visible: false },
    { fieldName: "ENG_NM", dataType: "text", visible: false },
    { fieldName: "GRD_CD", dataType: "text", visible: false },
    { fieldName: "GRD_NM", dataType: "text", visible: false },
    { fieldName: "JIKJONG_CD", dataType: "text", visible: false },
    { fieldName: "JOB_DEPT_CD", dataType: "text", visible: false },
    { fieldName: "JOB_DEPT_NM", dataType: "text", visible: false },
    { fieldName: "JOB_GRP_CD", dataType: "text", visible: false },
    { fieldName: "JOB_ROW_CD", dataType: "text", visible: false },
    { fieldName: "JOB_ROW_NM", dataType: "text", visible: false },
    { fieldName: "JOB_TIT_CD", dataType: "text", visible: false },
    { fieldName: "MARR_YN", dataType: "text", visible: false },
    { fieldName: "OFFI_RES_CD", dataType: "text", visible: false },
    { fieldName: "OFFI_RES_NM", dataType: "text", visible: false },
    { fieldName: "RESM_DATE", dataType: "text", visible: false },
    { fieldName: "RETI_TMP_DATE", dataType: "text", visible: false },
    { fieldName: "SEX", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_NM", dataType: "text", visible: false },
    { fieldName: "TMP_RST_DATE", dataType: "text", visible: false },
    { fieldName: "TMP_RST_RSN", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_NM", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

// 팝업 오픈 시
const openPopup = popupParam => {
  console.log('popupParam', popupParam)
  dialog.value = true

  codeList.deptCd = []
  openParams.title = popupParam.title
  openParams.dataRow = popupParam.dataRow
  openParams.fieldIndex = popupParam.fieldIndex
  openParams.checkBar = popupParam.checkBar
  options.values.BSNS_CD = popupParam.BSNS_CD ? popupParam.BSNS_CD : codeList.bsnsCd[0].BSNS_CD
  options.values.DEPT_CD = popupParam.DEPT_CD ? popupParam.DEPT_CD : ''

  // 기본 조회조건
  Promise.all([
    // 회사구분
    getCompanyList(),
    // 사업부
    commonSearchApi({ 
      queryId: "searchBSNS",
      param: { 
      CMPNY_DIV: userStore.cmpnyDiv, 
      USE_DIV: "N" 
      } 
    }),
    // 부서
    commonSearchApi({
      queryId: "searchDept3",
      param: { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        BSNS_CD: popupParam.BSNS_CD, 
        USE_DIV: "Y" 
      },
    }),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.deptCd = res[2].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  })

  //그리드, 선택 상태 초기화
  grdMain.value.getGridView().setAllCheck(false)
  grdMain.value.getDataProvider().setRows([])

  options.values.EMP_NM = ''
  options.values.EMP_NO = ''
  options.values.USER_DIV = "A"

  /**************** popupParam Object로 넘겨주기 *****************/
  for (const [key, value] of Object.entries(popupParam)) {
    options.values[key] = value

    if (options.disabled.hasOwnProperty(key)) {
      options.disabled[key] = true
    }
  }
  
  // checkBar가 ture이면 checkBar 활성화
  if (popupParam.checkBar === true) {
    grdMain.value.getGridView().setCheckBar({ visible: true })
  } 

  // 팝업오픈 시 바로 조회
  onButtonsClick({ id :'btnSearch' })
}

/* ------------- 팝업 ------------- */
// 팝업 닫기
const onClose = () => {
  dialog.value = false
}

// 데이터 선택 후
const onSelect = () => {
  let newArr = []

  // checkBar가 없을 경우
  if (openParams.checkBar === false) {
      let rowIdx = grdMain.value.getGridView().getCurrent().dataRow

      let rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      rtnData.dataRow = openParams.dataRow
      rtnData.fieldIndex = openParams.fieldIndex
      
      emit("selected", rtnData)
      onClose()

  } else {
    // checkBar가 있을 경우
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      newArr.push(data)
    }

    emit("selected", newArr)
    onClose()

  }
}

//초기 데이터셋팅
onMounted(() => {})

/* ------------- 클릭 이벤트 ------------- */
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === "btnSelect") {
    onSelect()
  } else if (btn.id === "btnClose") {
    grdMain.value.getDataProvider().setRows([])
    dialog.value = false
  }
}

/* ------------- 조회 ------------- */
const beforeSearch = async () => {
  if (!options.values.BSNS_CD) {
    return Message.err("부서를 선택하거나 사번 및 성명을 입력해주세요.")
  }

  return true
}

const searchData = () => {
  return commonSearchApi({ queryId: "searchEMP", param: options.values })
}

// 조회 후
const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// Enter 이벤트
const enterSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

// gird 더블 클릭 시 조회
const onCellDblClicked = (grid, clickData) => {
  if (openParams.checkBar === false) {
    onButtonsClick({ id: "btnSelect" })
  }
}

watch(() => options.values.BSNS_CD, (newValue, oldValue) => {
  if (openParams.checkBar === true) {
    codeList.deptCd = []
    options.values.DEPT_CD = ''

    commonSearchApi({
      queryId: "searchDept3",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV: "Y",
      }, 
    }).then(res => {
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' }) 
    })
  }
})

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog 
    v-model="dialog"
    eager
    persistent
    width="1150"
    height="780"
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
      <span>{{ openParams.title }} 선택</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select
                :label="$t('회사구분')"
                labelWidth="60px"
                v-model="options.values.CMPNY_DIV"
                width="240px"
                :items="codeList.company" 
                item-value="COD" 
                item-title="TXT" 
                readonly
              />
              <i-select
                :label="$t('사업부')"
                width="240px"
                v-model="options.values.BSNS_CD"
                :items="codeList.bsnsCd"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                :readonly="openParams.checkBar === false"
              />
              <i-select
                :label="$t('부서')"
                label-width="40px"
                width="240px"
                v-model="options.values.DEPT_CD"
                :items="codeList.deptCd" 
                item-value="DEPT_CD" 
                item-title="DEPT_NM"
                :readonly="openParams.checkBar === false"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('사번')"
                label-width="60px"
                v-model="options.values.EMP_NO"
                @keydown.enter="(e) => enterSearch(e)"
                width="240px"
              />
              <!-- oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' );" -->
              <i-input
                :label="$t('성명')"
                label-width="40px"
                v-model="options.values.EMP_NM"
                @keydown.enter="(e) => enterSearch(e)"
                width="240px"
              />
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>
<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
