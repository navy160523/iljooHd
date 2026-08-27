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
    TEMP_NM: false, // 부서
  },
  // disabled용으로만 사용(기존꺼는 애매해서 추가)
  onlyDisabled: {
    TEMP_NM: false, // 부서
  },
  values: {
    TEMP_NM: "", // 입력용 파라미터
    VND_NAME: "",
    USE_YN: "N",
  },
})


//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  field: [

    {
      fieldName: "VEND_CD",
      dataType: "text",
      styleName: "center-column",
      header: { text: t("협력회사코드") },
    },
    {
      fieldName: "VND_NAME",
      dataType: "text",
      styleName: "center-column",
      header: { text: t("협력회사명") },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = (popupParam) => {
  //그리드, 선택 상태 초기화
  grdMain.value.getGridView().setAllCheck(false)
  grdMain.value.getDataProvider().setRows([])

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
  if ( options.values.TEMP_NM) {
    options.values.VND_NAME = '%' + options.values.TEMP_NM + '%'
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
  
    dialog.value = true
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

  var rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  if (!options.multi) {
    emit("selected", rtnData)
    onClose()
  }
}

//초기 데이터셋팅
onMounted(() => {
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

  options.values.ASGN_NM = '%' + options.values.TEMP_NM + '%'
  return commonSearchApi({
    queryId: "SEARCH_CONTRACTOR",
    param: options.values
  })
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
            <div class="mt-2 d-flex">
              <i-input 
                :label="$t('협력회사명')"
                label-width="120px"
                v-model="options.values.TEMP_NM" 
                @keydown.enter="(e) => enterSearch(e)"
                width="350px"
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
