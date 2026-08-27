<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import SAFAB0010PopUp from "@/pages/30_safety/SAF_A/SAFAB0010AddPopUp.vue"
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(["selected"])
const dialog = ref(false)
const grdMain = ref(null)
const readonly = ref(true)

let options = reactive({
  disabled: {
    CMPNY_DIV: false, // 회사구분
    USER_DIV: false, // 직영, 사내협력사
    BSNS_CD: false, // 사업부
    DEPT_CD: false, // HSESY적용제외
  },
  // disabled용으로만 사용(기존꺼는 애매해서 추가)
  onlyDisabled: {
    CMPNY_DIV_D: false, // 회사구분
    USER_DIV_D: false, // 직영, 사내협력사
    BSNS_CD_D: false, // 사업부
    DEPT_CD_D: false, // 부서
    FLAG_D: false, // 부서
  },
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    USER_DIV: "",
    BSNS_CD: "",
    DEPT_CD: "",
    EMP_NM: "",
    EMP_NO: "",
    FLAG: "N", //퇴직자 포함 여부 플래그값
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
    //{ COD: "Z", TXT: "기타", DISABLE: false, VISIBLE: false },
  ],
  accdntType: [],
  proc: [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 사업부
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: "Y" },
    }), // 부서
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR.filter(x=>x.BSNS_CD == 'AC00' || x.BSNS_CD == 'AQ00' || x.BSNS_CD == 'AE00' || x.BSNS_CD == 'AK00' || x.BSNS_CD == 'AX00' || x.BSNS_CD == 'AN00')
    codeList.deptCd = res[2].ORESULT_CUR.filter(x=>x.DEPT_CD === 'CX80' || x.DEPT_CD === 'QA80' || x.DEPT_CD === 'E2Y0' || x.DEPT_CD === 'K3N0' || x.DEPT_CD === 'X6R0' || x.DEPT_CD === 'N090' || x.DEPT_CD === 'N1K0')

    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    options.values.BSNS_CD = ""
    //codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
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
      visible: false,
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "300",
      styleName: "left-column",
      header: { text: t("소속") },
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "90",
      header: { text: t("사번") },
      visible: false,
    },
    {
      fieldName: "JOB_TIT_NM",
      dataType: "text",
      width: "90",
      header: { text: t("직급") },
    },

    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "90",
      header: { text: t("성명") },
    },
    {
      fieldName: "OFFI_RES_NM",
      dataType: "text",
      width: "90",
      header: { text: t("직책") },
    },
    {
      fieldName: "TEL_NO",
      dataType: "text",
      width: "150",
      header: { text: t("사내번호") },
      visible: false,
    },
    {
      fieldName: "HLD_OFFI_GBN",
      dataType: "text",
      header: { text: t("재직여부") },
      visible: false,
    },
    // 출력 안함
    {
      fieldName: "BIRTH_DAY",
      dataType: "text",
      width: "100",
      header: { text: t("생년월일") },
      visible: false,
    },
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
    // { fieldName: "OFFI_RES_NM", dataType: "text", visible: false },
    { fieldName: "RESM_DATE", dataType: "text", visible: false },
    { fieldName: "RETI_TMP_DATE", dataType: "text", visible: false },
    { fieldName: "SEX", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_NM", dataType: "text", visible: false },
    { fieldName: "HND_PHN", dataType: "text", visible: false },
    { fieldName: "TMP_RST_DATE", dataType: "text", visible: false },
    { fieldName: "TMP_RST_RSN", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_NM", dataType: "text", visible: false },
    { fieldName: "COMP_CD", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = (popupParam) => {
  console.log('popupParam', popupParam)
  //그리드, 선택 상태 초기화
  grdMain.value.getGridView().setAllCheck(false)
  grdMain.value.getDataProvider().setRows([])

  options.values.EMP_NM = ""
  options.values.BSNS_CD = ""
  options.values.DEPT_CD = ""
  options.values.EMP_NO = ""
  options.values.USER_DIV = ""

  /**************** popupParam Object로 넘겨주기 *****************/
  for (const [key, value] of Object.entries(popupParam)) {
    options.values[key] = value

    if (options.disabled.hasOwnProperty(key)) {
      options.disabled[key] = true
    }

    // 2024-03-14 사업부, 부서 Disabled 새로 추가
    if (options.onlyDisabled.hasOwnProperty(key)) {
      options.onlyDisabled[key] = true
    }
  }

  console.log('options.values.EMP_NM1',options.values.EMP_NM)

  //2024-01-09 김현재 추가
  //라디오버튼 비활성화 하는 로직
  //팝업 호출할때 DISABLE:["비활성화할 라디오버튼이름"] 넘기면됨
  //EX) DISABLE:["전체","직영"] -> 이렇게 넘기면 전체,직영 라디오 버튼이 비활성화됨
  if (popupParam.DISABLE != undefined && popupParam.DISABLE.length > 0) {
    let defaultRadio = []
    codeList.USER_DIV.forEach((item) => {
      if (popupParam.DISABLE.includes(item.TXT)) {
        item.DISABLE = true
      } else {
        defaultRadio.push(item.COD)
      }
    })
    options.values.USER_DIV = defaultRadio[0]
  }

  // // 김성근 추가 readonly
  // if (popupParam.readonly) {
  //   readonly.value = false
  // } else if (!popupParam.readonly) {
  //   readonly.value = true
  // }

  // if (
  //   options.values.EMP_NM ||
  //   options.values.BSNS_CD ||
  //   options.values.DEPT_CD ||
  //   options.values.EMP_NO
  // ) {
  //   commonSearchApi({ queryId: "searchEMP", param: options.values }).then(
  //     (res) => {
  //       if (res.ORESULT_CUR.length === 1) {
  //         grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  //         emit("selected", res.ORESULT_CUR[0])
  //       } else {
  //         //팝업 visible
  //         afterSearch(res)
  //         dialog.value = true
  //       }
  //     }
  //   )
  // }
  //2024-01-15김현재 수정
  //popupParam.multi === 'Mail'인 부분을 popupParam.MULTI === true로 변경
  if (popupParam.MULTI === true) {
    options.multi = true

    dialog.value = true
    grdMain.value.getGridView().setCheckBar({ visible: true })
  } else {
    dialog.value = true
  }
  //2024-06-04 김현재 추가
  //산재모듈에서 인원 팝업 오픈시 사내번호 -> 생년월일로 변경
  if (popupParam.SANJE === true) {
    grdMainProps.field[7].visible = true //생년월일 visible true
    grdMainProps.field[5].visible = false //사내번호 visible false
    grdMainProps.columns = grdMainProps.field
    grdMain.value.getGridView().setColumns(grdMainProps.columns)
  }

  if(options.values.EMP_NM !== '' && options.values.EMP_NM != undefined){
    onButtonsClick({ id: "btnSearch" })
  }
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(
  () => options.values.BSNS_CD,
  (newValue, oldValue) => {
    // 사업부가 비활성화가 아닐때
    if (!options.onlyDisabled.BSNS_CD_D) {
      //console.log('options.values.EMP_NM2',options.values.EMP_NM)
      options.values.DEPT_CD = ""
      //options.values.EMP_NM = "" //2025.09.29 팝업열릴 때 이름 초기화 되어서 주석처리
      //options.values.EMP_NO = "" //2025.09.29 팝업열릴 때 이름 초기화 되어서 주석처리
      grdMain.value.getDataProvider().setRows(null)
      // oldValue(변경전 데이터)가 있으면 options.values.DEPT_CD(부서)를 전체로 변경
      if (oldValue !== newValue) {
        commonSearchApi({
          queryId: "searchDept3",
          param: {
            CMPNY_DIV: userStore.cmpnyDiv,
            BSNS_CD: newValue,
            USE_DIV: "Y",
          },
        }).then((res) => {

            if (options.values.BSNS_CD === 'AC00'){
              codeList.deptCd = res.ORESULT_CUR.filter(x=>x.DEPT_CD === 'CX80')  
            } else if (options.values.BSNS_CD === 'AQ00'){
              codeList.deptCd = res.ORESULT_CUR.filter(x=>x.DEPT_CD === 'QA80')
            } else if (options.values.BSNS_CD === 'AE00'){
              codeList.deptCd = res.ORESULT_CUR.filter(x=>x.DEPT_CD === 'E2Y0')
            } else if (options.values.BSNS_CD === 'AK00'){
              codeList.deptCd = res.ORESULT_CUR.filter(x=>x.DEPT_CD === 'K3N0')  
            } else if (options.values.BSNS_CD === 'AX00'){
              codeList.deptCd = res.ORESULT_CUR.filter(x=>x.DEPT_CD === 'X6R0')  
            } else if (options.values.BSNS_CD === 'AN00'){
              codeList.deptCd = res.ORESULT_CUR.filter(x=>x.DEPT_CD === 'N090' || x.DEPT_CD === 'N1K0')  
            } else {
              codeList.deptCd = res.ORESULT_CUR.filter(x=>x.DEPT_CD === 'CX80' || x.DEPT_CD === 'QA80' || x.DEPT_CD === 'E2Y0'
                                || x.DEPT_CD === 'K3N0' || x.DEPT_CD === 'X6R0' || x.DEPT_CD === 'N090' || x.DEPT_CD === 'N1K0')
            }


          // 2025.09.16 김성일 매니저 요청으로 군산안전보건지원부 추가 (C8K0)
          /* if (options.values.BSNS_CD === 'AC00'){
            codeList.deptCd = res.ORESULT_CUR.filter(x=>x.DEPT_CD === 'C8K0')
          } else { */
            //codeList.deptCd = res.ORESULT_CUR
          /* } */


          //codeList.deptCd = res.ORESULT_CUR
          //codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        })
      }

      // if (oldValue && oldValue !== "") {
      //   options.values.DEPT_CD = ""
      // }
    }
  }
)

/* ------------- 팝업 ------------- */
// 팝업 닫기
const onClose = () => {
  for (let i in options.onlyDisabled) {
    options.onlyDisabled[i] = false
  }
  dialog.value = false
}

// 데이터 선택 후
const onSelect = (clickData) => {
  if (grdMain.value.getGridView().getCurrent().dataRow === -1) {
    Message.warn(t("선택한 데이터가 없습니다."))
    return
  }

  if (options.multi && clickData === undefined) {
    let newArr = []
    let checkedItem = grdMain.value.getGridView().getCheckedRows()
    if (checkedItem.length === 0) {
      Message.warn(t("선택한 데이터가 없습니다."))
      return
    }

    for (let i of checkedItem) {
      let pushArr = grdMain.value.getDataProvider().getJsonRow(i)
      newArr.push(pushArr)
    }
    emit("selected", newArr)
    onClose()
  } else {
    var rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    if (options.multi) {
      let newArr = []
      var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      newArr.push(rtnData)
      emit("selected", newArr)
      onClose()
    }
    var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (!options.multi) {
      emit("selected", rtnData)
      onClose()
    }
  }
}

//초기 데이터셋팅
onMounted(() => {
  initCodeList()
})

/* ------------- 클릭 이벤트 ------------- */
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
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
  if (
    !options.values.DEPT_CD &&
    !options.values.EMP_NM &&
    !options.values.EMP_NO
  ) {
    return Message.err("부서를 선택하거나 사번 및 성명을 입력해주세요.")
  }

  return true
}

const searchData = () => {
  return commonSearchApi({ queryId: "searchEMP", param: options.values })
}

// 조회 후
const afterSearch = (res) => {
  console.log(res, "res")
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// Enter 이벤트
const enterSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    //.setSearchArea(searchArea)
    .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

// gird 더블 클릭 시 조회
const onCellDblClicked = (grid, clickData) => {
  //onButtonsClick({ id: "btnSelect" })

  onSelect(clickData)
}

//라디오박스 변경시 자동조회
//2024-02-15 김현재 추가
watch(
  () => options.values.USER_DIV,
  () => {
    if (
      !options.values.DEPT_CD &&
      !options.values.EMP_NM &&
      !options.values.EMP_NO
    ) {
      return false
    } else {
      onButtonsClick({ id: "btnSearch" })
    }
  }
)

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
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
      <span>인원 검색</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="mt-2 d-flex">
              <i-select
                :label="$t('사업부')"
                labelWidth="60px"
                v-model="options.values.BSNS_CD"
                :items="codeList.bsnsCd"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                width="240px"
                required
                :disabled="options.onlyDisabled.BSNS_CD_D"
              />
              <i-select
                :label="$t('부서')"
                labelWidth="40px"
                v-model="options.values.DEPT_CD"
                :items="codeList.deptCd"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
                width="240px"
                required
                :disabled="options.onlyDisabled.DEPT_CD_D"
              />
              <i-input
                :label="$t('사번')"
                label-width="40px"
                v-model="options.values.EMP_NO"
                @keydown.enter="(e) => enterSearch(e)"
                width="240px"
                required
              />
              <!-- oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' );" -->
              <i-input
                :label="$t('성명')"
                label-width="40px"
                v-model="options.values.EMP_NM"
                @keydown.enter="(e) => enterSearch(e)"
                width="240px"
                required
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
  </v-dialog>
</template>
