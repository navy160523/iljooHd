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
//const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(["selected"])
const dialog = ref(false)
const grdMain = ref(null)
const readonly = ref(true)

let options = reactive({
  disabled: {
    CMPNY_DIV: false, // 회사구분
    BSNS_CD: false, // 사업부
    DEPT_CD: false, // HSESY적용제외
    ASGN_NM: false, // 부서
  },
  // disabled용으로만 사용(기존꺼는 애매해서 추가)
  onlyDisabled: {
    CMPNY_DIV_D: false, // 회사구분
    BSNS_CD_D: false, // 사업부
    DEPT_CD_D: false, // 부서
    ASGN_NM_: false, // 부서
  },
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: "",
    DEPT_CD: "",
    ASGN_NM: "", // 조회용 파라미터 (ASGN_NM = '%'+ TEMP_NM +'%')
    TEMP_NM: "", // 입력용 파라미터
  },
  multi: false,
})

//코드리스트 선언
const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
})
let deptTemp = []
//코드리스트 셋팅
const initCodeList = async() => {
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
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.deptCd = res[2].ORESULT_CUR
    // console.log(codeList.company)
    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
    codeList.deptCd.forEach((e)=>{
      deptTemp.push({
        COD: e.DEPT_CD,
        TXT: e.DEPT_NM,
      })
    })
    // var col = grdMain.value.getGridView().getColumns().find(x => x._name == 'DEPT_CD')
    // console.log('getcol',col)
    // col.lookupData.list = deptTemp 
    // console.log('deptList',codeList.deptCd)
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
    // {
    //   fieldName: "COMPANY",
    //   dataType: "text",
    //   lookupDisplay: true,
    //   lookupData: { value: "COD", label: "TXT", list: codeList.company },
    //   header: { text: t("회사") },
    // },
    {
      fieldName: "BSNS_NM",
      dataType: "text",
      styleName: "center-column",
      header: { text: t("사업부") },
    },
    {
      fieldName: "DEPT_NM",
      dataType: "text",
      styleName: "center-column",
      header: { text: t("부서") },
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "250",
      styleName: "center-column",
      header: { text: t("업체명") },
    },
    // 출력 안함
    { fieldName: "ASGN_CD", dataType: "text", visible: false },
    { fieldName: "DEPT_CD", dataType: "text", visible: false },
    { fieldName: "BSNS_CD", dataType: "text", visible: false },
    { fieldName: "OWNER_NM", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = (popupParam) => {
  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  initCodeList()

  //그리드, 선택 상태 초기화
  grdMain.value.getGridView().setAllCheck(false)
  grdMain.value.getDataProvider().setRows([])

  options.values.BSNS_CD = ""
  options.values.DEPT_CD = ""
  options.values.ASGN_NM = ""
  options.values.TEMP_NM = ""
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

  // 김성근 추가 readonly
  if (popupParam.readonly) {
    readonly.value = false
  } else if (!popupParam.readonly) {
    readonly.value = true
  }


  //조회 코드
  if ( options.values.BSNS_CD || options.values.DEPT_CD || options.values.TEMP_NM) {
    options.values.ASGN_NM = '%' + options.values.TEMP_NM + '%'
    // var col = grdMain.value.getGridView().getColumns().find(x => x._name == 'COMPANY')
    // console.log(col)
    // col.lookupData.list = codeList.company 

    commonSearchApi({ queryId: "searchVendNm", param: options.values }).then((res) => {
      if (res.ORESULT_CUR.length === 1) {
        // console.log('res',res.ORESULT_CUR)
        // res.ORESULT_CUR.forEach((e)=>{
        //   codeList.company.forEach((c)=>{
        //     if(e.company)
        //   })
        // })
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
        emit("selected", res.ORESULT_CUR[0])
      } else {
        //팝업 visible
        afterSearch(res)
        dialog.value = true
      }
    })
  }
  //2024-01-15김현재 수정
  //popupParam.multi === 'Mail'인 부분을 popupParam.MULTI === true로 변경
  if (popupParam.MULTI === true) {
    options.multi = true

    dialog.value = true
    grdMain.value.getGridView().setCheckBar({ visible: true })
  } else {
    dialog.value = true
  }
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(
  () => options.values.BSNS_CD,
  (newValue, oldValue) => {
    // 사업부가 비활성화가 아닐때
    if(!options.onlyDisabled.BSNS_CD_D){
      options.values.DEPT_CD = ""
      options.values.ASGN_NM = ""
      options.values.TEMP_NM = ""

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
          codeList.deptCd = res.ORESULT_CUR
          codeList.deptCd.forEach((e)=>{
            deptTemp.push({
              COD: e.DEPT_CD,
              TXT: e.DEPT_NM,
            })
          })
          
          // col.lookupData.list = deptTemp 
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
  for(let i in options.onlyDisabled){
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
  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  //initCodeList()
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
  // if (!options.values.DEPT_CD && !options.values.TEMP_NM) {
  //   return Message.err("부서를 선택하거나 업체명을 입력해주세요.")
  // }

  return true
}

const searchData = () => {
  // var col = grdMain.value.getGridView().getColumns().find(x => x._name == 'COMPANY')
  // console.log(col)
  // col.lookupData.list = codeList.company
  options.values.ASGN_NM = '%' + options.values.TEMP_NM + '%'
  return commonSearchApi({ queryId: "searchVendNm", param: options.values })
}

// 조회 후
const afterSearch = (res) => {
  // console.log(res, "res")
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


defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="800"
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
      <span>업체 검색</span>
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
            <div class="d-flex">
              <i-select
                :label="$t('회사구분')"
                labelWidth="60px"
                v-model="options.values.CMPNY_DIV"
                :items="codeList.company"
                item-value="COD"
                item-title="TXT"
                :readonly="readonly"
                width="240px"
              />
            </div>
            <div class="mt-2 d-flex">
              <i-select
                :label="$t('사업부')"
                labelWidth="60px"
                v-model="options.values.BSNS_CD"
                :items="codeList.bsnsCd"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                width="240px"
                :disabled="options.onlyDisabled.BSNS_CD_D"
              />
              <i-select
                :label="$t('부서')"
                labelWidth="40px"
                v-model="options.values.DEPT_CD"
                :items="codeList.deptCd"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
                width="200px"
                :disabled="options.onlyDisabled.DEPT_CD_D"
              />
              <i-input 
                :label="$t('업체명')"
                label-width="60px"
                v-model="options.values.TEMP_NM" 
                @keydown.enter="(e) => enterSearch(e)"
                width="200px"
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
