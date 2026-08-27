<!-- SI2팀 김성근  위험작업 허가서 현황 / 작업표준서 선택팝업 -->
<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest ,
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"

import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { update, value } from "lodash-es"

import Message from "@hiway/utils/notify"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"

const emit = defineEmits(["selected"]) ;const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const dialog = ref(false)
const grdMain = ref(null)
const grdDetail = ref(null)

const noBsnsCd = ref(true)
const Apply = ref(false)
const isData = ref(false)
let rowData = reactive({})


//  인원검색
const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
})

let options = reactive({
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    DEPT_CD: "",
    ASGN_CD: "",
    STD_TYPE: ""
  },
  multi: false,
})

const detailData = reactive({
  CMPNY_DIV: "HHI",
  DEPT_CD: "C740",
  WS_IDS: "",
})

const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 사업부    
  ]).then(res => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR    
  })
}

const openPopup = popupParam => {
  //   초기화
  console.log(popupParam, "popupParam")
  options.values.CMPNY_DIV = popupParam.CMPNY_DIV
  options.values.BSNS_CD = popupParam.BSNS_CD
  options.values.DEPT_CD = userStore.deptCd ? userStore.deptCd : popupParam.DEPT_CD
  options.values.ASGN_CD = userStore.userDiv  === 'B' ? userStore.asgnCd : userStore.deptCd
  options.values.USER_ID = userStore.userId
  let str = popupParam.DEPT_NM.split("-")
  console.log(str, "str")
  console.log(str.length, "str")

  // console.log(str.length ==  ? str[3] : str[2], "str")
  options.values.DEPT_NM = popupParam.ORGN_DIV  === 'B' ? str[2] : str[1]
  console.log(options.values.DEPT_NM,'options.values.DEPT_NM')
  isData.value = true
  Apply.value = false
  initCodeList()
  dialog.value = true
  onButtonsClick({ id: "btnSearch" })
}

//  사업부 바뀌면
watch(
  () => options.values.BSNS_CD,
  newValue => {
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: options.values.CMPNY_DIV, BSNS_CD: newValue },
    }).then(res => {
      if (newValue == "") {
        return (noBsnsCd.value = true)
      }
      codeList.deptCd = res.ORESULT_CUR
      if (!isData.value) {
        options.values.DEPT_CD = ""
      }
      noBsnsCd.value = false
    })
  },
)

const onButtonsClick = btn => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  } else if (btn.id === "btnSelect") {
    let checkRows = grdMain.value.getGridView().getCheckedRows()
    let row = []
    for (let rowIdx of checkRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      row.push(data)
    }

    emit("selected", row)
    onButtonsClick({ id: "btnClose" })
  } else if (btn.id === "btnDelete") {
  } else if (btn.id == "btnClose") {
    dialog.value = false
  }
}


//  조회
const searchData01 = idx => {
  if (options.values.BSNS_CD == "") {
    return Message.warn(t("사업부는 필수 입력입니다."))
  } else if (options.values.DEPT_CD == "") {
    return Message.warn(t("부서는 필수 입력입니다."))
  }
  
  return commonSearchApi({
    queryId: "SAFAB0020_search04",
    param: options.values,
  })
}

const afterSearch01 = res => {
  console.log(res, "resMains")
  console.log(options.values.DEPT_NM, "options.values.DEPT_NM")
  let filterArr = res.ORESULT_CUR.filter(

    //(x) => x.DEPT_NM === options.values.DEPT_NM
    x => (x.DEPT_CODE === options.values.DEPT_CD) || (x.DEPT_NM === options.values.DEPT_NM),
  )

  console.log(filterArr, "filterArr")
  grdMain.value.getDataProvider().setRows(filterArr)
}

// 단건저장건으로 삭제처리

// const searchDetail = (popupParam) => {
//   let param = {
//     CMPNY_DIV: "HHI",
//     DEPT_CD: "",
//     WS_IDS: popupParam,
//   }
//   commonSearchApi({
//     queryId: "SAFAB0020_search05",
//     param: param,
//   }).then((res) => {
//     console.log(res, "res")
//     grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR)
//   })
// }

// 저장

//  삭제

//메인
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },

  keys: ["WS_NM"],
  field: [

    { 
      fieldName: 'FAVORITE_CHK', dataType: 'text', width: '30', editable: false, header: { text: t('즐겨찾기') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20

        if (dataCell.value === '0') {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/favorite_off.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        else {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/favorite_on.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }

        return ret
      },
    },
    {
      fieldName: "DEPT_NM",
      dataType: "text",
      width: "100",
      styleName: "left-column",
      header: { text: t("소속") },
    },
    {
      fieldName: "STD_TYPE_NM",
      dataType: "text",
      width: "50",      
      header: { text: t("표준구분") },
    },
    {
      fieldName: "S_DIV_NM",
      dataType: "text",
      width: "60",
      styleName: "left-column",
      header: { text: t("구분") },
    },
    {
      fieldName: "WS_NM",
      dataType: "text",
      styleName: "left-column",
      header: { text: t("작업표준") },
    },
    {
      fieldName: "WS_ID",
      dataType: "text",
      styleName: "left-column",
      header: { text: t("작업표준번호") },
    },
    // 출력 안함

    { fieldName: "T_DIV_NM", dataType: "text", visible: false },
    { fieldName: "M_DIV_NM", dataType: "text", visible: false },
    //{ fieldName: "WS_ID", dataType: "text", visible: false },
    { fieldName: "COMP_CODE", dataType: "text", visible: false },
    { fieldName: "DEPT_CODE", dataType: "text", visible: false },
    { fieldName: "TDIV_CODE", dataType: "text", visible: false },
    { fieldName: "MDIV_CODE", dataType: "text", visible: false },
    { fieldName: "SDIV_CODE", dataType: "text", visible: false },
    { fieldName: "WS_NO", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

// const onCellDblClicked = (grd, data) => {
//   console.log(data);
//   if (data.cellType === "data") {
//     let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow);
//     emit("selected", innerData);
//     onButtonsClick({ id: "btnClose" });
//   }
// };

// 서브
// const grdDetailProps = reactive({
//   gridViewOption: {
//     stateBar: { visible: false },
//     checkBar: { visible: true },
//   },
//   keys: ["CMPNY_DIV"],
//   field: [
//     {
//       fieldName: "WS_NM",
//       dataType: "text",
//       styleName: "left-column",
//       header: { text: t("작업표준") },
//       editable: false,
//     },

//     { fieldName: "WS_ID", dataType: "text", visible: false },
//   ],
//   columns: [],
// })

// grdDetailProps.columns = grdDetailProps.field

// 단건 저장건으로 주석처리

// const AddData = () => {
//   let param = {}
//   let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
//   let arr = grdDetail.value.getDataProvider().getJsonRows()
//   if (checkedRows.length == 0) {
//     return Message.warn(t("선택된 행이없습니다."))
//   }
//   for (let i of checkedRows) {
//     param = grdMain.value.getDataProvider().getJsonRow(i)
//     let checkItem = arr.some((row) => row.EXCEPT_EMP === param.EMP_NO)

//     if (!checkItem) {
//       grdDetail.value.addRow({
//         EXCEPT_BSNS_CD: param.BSNS_CD,
//         CMPNY_DIV: param.CMPNY_DIV,
//         WS_NM: param.WS_NM,
//         WS_ID: param.WS_ID,
//       })
//     }
//   }
// }

// const RemoveData = () => {
//   let checkedRows = grdDetail.value.getGridView().getCheckedRows(true)
//   if (checkedRows.length == 0) {
//     return Message.warn(t("선택된 행이없습니다."))
//   }
//   grdDetail.value.getDataProvider().removeRows(checkedRows)
// }





const onCellDblClicked = (grd, data) => {
  // console.log(data)
  let row = []
  if (data.cellType === "data" && data.fieldName !=='FAVORITE_CHK') {
    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    row.push(innerData)
    console.log(innerData,'innerData')
    emit("selected", row)
    dialog.value = false
  }
}

const onCellItemClicked = (grid, index, col)  =>{
  console.log(grid, index, col,'grid, index, col')
  let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)
  if(col.fieldName === 'FAVORITE_CHK'){
    console.log(data,'data')

    // console.log('zllfkjk',data.FAVORITE_CHK)
    if(data.FAVORITE_CHK === '0'){
      data.FAVORITE_CHK = '1'
      let param = [
        { CMPNY_DIV :userStore.cmpnyDiv ,
          WS_ID : data.WS_ID            ,
          USER_ID : userStore.userId    ,
          DEPT_CODE : data.DEPT_CODE,    
        },
      ]
      commonExecuteApi({ queryId: "SAFBA0010_SAVE_07", list:param })
        .then(res=>{
          Message.info(t('즐겨찾기가 추가 되었습니다.'))
          onButtonsClick({ id : 'btnSearch' })
        })
    } 
    else{
      data.FAVORITE_CHK = '0'
      let param = [
        { CMPNY_DIV :userStore.cmpnyDiv ,
          WS_ID : data.WS_ID            ,
          USER_ID : userStore.userId    ,
          DEPT_CODE : data.DEPT_CODE,    
        },
      ]
      commonExecuteApi({ queryId: "SAFBA0010_DELETE_06", list:param })
        .then(res=>{
          Message.info(t('즐겨찾기가 삭제 되었습니다.'))
          onButtonsClick({ id : 'btnSearch' })
        })
    
    }
  }
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="960"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      작업 표준서
    </div>

    <VContainer style="background-color: white">
      <IMenuTitle
        :button-list="['btnSearch', 'btnSelect', 'btnClose']"
        @click-button="onButtonsClick"
      />

      <v-row>
        <v-col
          class="d-flex"
          cols="12"
        >
          <!-- 인원검색 -->
          <v-col cols="12">
            <VRow>
              <VCol>
                <VForm
                  ref="searchArea"
                  class="searchArea"
                  @submit.prevent="onButtonsClick({ id: 'btnSearch' })"
                >
                  <div class="d-flex">
                    <!--
                      <i-select
                      :label="$t('사업부')"
                      label-width="50px"
                      width="250px"
                      margin="10px"
                      v-model="options.values.BSNS_CD"
                      :items="codeList.bsnsCd"
                      item-value="BSNS_CD"
                      item-title="BSNS_NM"
                      @click="isData = false"
                      required
                      />
                      <i-select
                      :label="$t('부서')"
                      label-width="50px"
                      width="250px"
                      margin="10px"
                      :disabled="noBsnsCd"
                      v-model="options.values.DEPT_CD"
                      :items="codeList.deptCd"
                      item-value="DEPT_CD"
                      item-title="DEPT_NM"
                      required
                      /> 
                    -->

                    <p class="ml-4 mr-4 mt-2" style="color: #222;font-size: 14px;">{{ t('작업표준구분') }}</p>
                    <v-radio-group
                      inline
                      style="margin-top: 4px"
                      v-model="options.values.STD_TYPE"                      
                    >
                      <v-radio label="전체" value=""></v-radio>
                      <v-radio label="정기" value="CW"></v-radio>
                      <v-radio label="수시(비일상)" value="CN"></v-radio>
                    </v-radio-group>

                    <i-input
                      v-model="options.values.WS_NM"
                      :label="$t('작업표준명')"
                      label-width="80px"
                      width="350px"
                      margin="10px"
                    />

                    <div
                      class="d-flex align-center"
                      style="width: 120px; margin-right: 10px"
                    >
                      <v-checkbox
                        v-model="options.values.CHECK"
                        true-value="Y"
                        false-value="N"
                        :label="t('즐겨찾기 조회')"
                      />
                    </div>
                  </div>
                </VForm>
              </VCol>
            </VRow>
            <!-- /조회조건 -->

            <!-- 메인그리드 -->
            <VRow>
              <VCol>
                <RealGrid
                  ref="grdMain"
                  class="mt-2"
                  style="height: 500px"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :fields="grdMainProps.field"
                  :columns="grdMainProps.columns"
                  @onCellDblClicked="onCellDblClicked"
                  @onCellItemClicked="onCellItemClicked"
                />
              </VCol>
            </VRow>
          </v-col>

          <!-- 단건 저장건으로 주석처리 -->

          <!--  등록 / 삭제 -->
          <!-- <v-col cols="1" align-self="center" class="mx-2"> -->
          <!-- <v-btn -->
          <!--
            @click="AddData"
            append-icon="mdi-chevron-right"
            class="mb-6"
            width="120"
            >
            등록
            </v-btn>

            <v-btn
            @click="RemoveData"
            append-icon="mdi-chevron-left"
            width="120"
            >
            삭제
            </v-btn>
            </v-col> 
          -->
          <!-- 등록/삭제 종료 -->
          <!-- 
            <v-col cols="3">
            <VRow>
            <VCol>
            <RealGrid
            ref="grdDetail"
            class="mt-2"
            style="height: 500px"
            :gridViewOption="grdDetailProps.gridViewOption"
            :fields="grdDetailProps.field"
            :columns="grdDetailProps.columns"
            />
            </VCol>
            </VRow>
            </v-col> 
          -->
        </v-col>
      </v-row>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
