<!--
  화면명 : SAFBB0010 / 병행작업/긴급작업 승인(안전)
  개발자: 한민규 
-->

<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  registerRuntimeCompiler,
} from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import SAFBB0010PopUp1 from "@/pages/30_safety/SAF_B/SAFBB0010PopUp1.vue"


defineOptions({
  name: "30_safety-SAF_B-SAFBC0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)
const safbB0010 = ref(null)



const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  WORK_FROM: dayjs().format("YYYY-MM-DD"),
  WORK_TO: dayjs().add(1, "day").format("YYYY-MM-DD"),
  STATUS: "35", 
  SAF_EMP_NM: userStore.empNm,
  SAF_EMP_NO: userStore.empNo,
  SAF_BSNS_CD: userStore.bsnsCd ,  // 사업부
  SAF_DEPT_CD: userStore.deptCd ,  // 부서
  //WORK_NO : ''
})

const itemProps = (item) => {
  return {
    title: item.WORK_NO,
    subtitle: item.SHIP_KIND_NM,
  }
}

const codeList = reactive({
  DEPT_CD: [],
  BSNS_CD: [],
  STATUS : [],
})
 


// 사업부 변경감지
watch(
  () => searchParams.SAF_BSNS_CD,
  (newValue) => {
    if (!newValue) {
      searchParams.SAF_DEPT_CD = ""
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        // console.log(res, "res")
        searchParams.SAF_DEPT_CD = ""
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        NOBSNS.value = false
      })
    }
  }
)

onMounted(() => {
  Promise.all([


  commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: "N" },
    }),
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: userStore.bsnsCd },
    }),

    getCodeList("HHIE100CODE000"), // 진행상태

    commonSearchApi({
      queryId: "SAFBC0010_search02",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      }, 
    }), // 호선 프로젝트

  ]).then((res) => {

      codeList.BSNS_CD = res[0].ORESULT_CUR
      codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })


      codeList.DEPT_CD = res[1].ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
      codeList.STATUS  = res[2].ORESULT_CUR
      codeList.STATUS.unshift({ TXT: "전체", COD: "" })

      codeList.WorkNo = res[3].ORESULT_CUR
      codeList.WorkNo.unshift({ SHIP_KIND_NM: "", WORK_NO: "전체" })


  })

  onButtonsClick({ id: "btnSearch" })

})


//  이벤트 종료

//그리드 속성셋팅
//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false } },

  keys: ["CMPNY_DIV"],
  fields: [
  {
      header: { text: t(" ") },
      fieldName: "CHANGE",
      dataType: "text",
      width: "60",
      renderer:{ type:"button" }
    },  

    {
      header: { text: t("병행여부") },
      fieldName: "PARA_YN",
      dataType: "text",
      width: "50",
    },    
    {
      header: { text: t("긴급여부") },
      fieldName: "URGENT_YN",
      dataType: "text",
      width: "50",
    },

    {
      fieldName: "STATUS_NM",
      width: "100",
      header: { text: t("진행상태") },
      dataType: "text",
    },
    {
      fieldName: "REL_EMP_NM",
      width: "100",
      header: { text: t("안전요원") },
      dataType: "text",
    },

    {
      header: { text: t("신청일") },
      fieldName: "REQ_DT",
      dataType: "text",
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM-DD") : null
      },
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM",
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM",
          includedFormat: true,
        },
      },
    },



    {
      fieldName: "WORK_DT",
      dataType: "text",
      width: "130",
      header: { text: t("작업기간") },
    },
    {
      fieldName: "DEPT_NM",
      dataType: "text",
      width: "100",
      header: { text: t("부서") },
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "100",
      header: { text: t("조직") },

    },
    // {
    //   fieldName: "RESP_EMP_NM",
    //   dataType: "text",
    //   width: "100",
    //   header: { text: t("책임자") },
    // },
    {
      fieldName: "WORK_NO",
      dataType: "text",
      width: "60",
      header: { text: t("호선") },

    },
    // {
    //   fieldName: "RESP_HP_NO",
    //   dataType: "text",
    //   width: "100",
    //   header: { text: t("책임자 전화번호") },
    // },

    // 장소
    {
      fieldName: "JOB_SPLC",
      dataType: "text",
      width: "50",
      header: { text: t("기본") },

    },
    {
      fieldName: "DIV_M",
      dataType: "text",
      width: "150",
      header: { text: t("상세") },
    },

    // 작업
    {
      fieldName: "WRK_DIST",
      dataType: "text",
      width: "150",
      header: { text: t("분류") },

    },
    {
      fieldName: "DANG_DIV",
      dataType: "text",
      width: "100",
      header: { text: t("내용") },
      styleName: "left-column",

    },
    {
      header: { text: t("허가번호") },
      fieldName: "RCV_NO",
      dataType: "text",
      width: "130",
      mergeRule: { criteria: "value" },
    },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
  

  ],
  columns: [],
  columnLayout: [
    "CHANGE",
    "PARA_YN",
    "URGENT_YN",
    "STATUS_NM",
    "REL_EMP_NM",
    "REQ_DT",
    "WORK_DT",
    {
      name: "작업",
      direction: "horizontal",
      items: ["WRK_DIST", "DANG_DIV"],
      header: {
        text: t("작업"),
      },
    },
    "DEPT_NM",
    "ASGN_NM",
    //"RESP_EMP_NM",
    //"RESP_HP_NO",
    "WORK_NO",
    {
      name: "장소",
      direction: "horizontal",
      items: ["JOB_SPLC", "DIV_M"],
      header: {
        text: t("장소"),
      },
    },

    "RCV_NO",
  ],
})

grdMainProps.columns = grdMainProps.fields





// 병행작업 html
const GBNCallback = (grid, model, field) => {
  let backgroundColor = ""

  if (model._index.value === "Y1") {
    backgroundColor = "#ff8080"
  }
  if (model._index.value === "Y2") {
    backgroundColor = "#ffff7d"
  }
  if (model._index.value === "N") {
    backgroundColor = "#80ff80"
  }
  if (model._index.value === "CN") {
    backgroundColor = "#d3d3d3"
  }

  return `<div style="border-radius: 20px; margin: 0 auto; background-color:${backgroundColor};width: 15px;height: 15px;"></div>`
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  }
}

/* ---------- 조회 ---------- */
const searchData = () => {
  let searchPam = {}

  for (let i in searchParams) {
    searchPam[i] = searchParams[i]
  }
  
  searchPam.WORK_FROM = searchPam.WORK_FROM.replace(/-/g, "")
  searchPam.WORK_TO   = searchPam.WORK_TO.replace(/-/g, "")

  // let searchPam2 = {}
  // searchPam2.CMPNY_DIV = '20241106' //searchPam.WORK_FROM.replace(/-/g, "")
  // searchPam2.WORK_TO   = '20241107' //searchPam.WORK_TO.replace(/-/g, "")

  return commonSearchApi({
    queryId: "SAFBB0010_SEARCH_01",
    param: searchPam,
  })
}

const afterSearch = async (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  // grdMain.value.getGridView().groupBy(["RCV_NO"]) //BSNS_NM 기준으로 그룹핑
  // grdMain.value.getGridView().setRowGroup({
  //   expandedAdornments: "footer",
  //   collapsedAdornments: "footer",
  //   mergeExpanderVisibility: "none",
  //   indentVisible: false,
  // })
}



// // 그리드 이벤트
// const onCellDblClicked = (grd, data) => {
//   if (data.cellType === "data") {
//     let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
//     safba00101.value.openPopup(innerData, "안전")
//   }
// }

const onCellClicked = (grid, clickData) => {

  let selectRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  if(clickData.fieldName === 'CHANGE'){
    console.log("selectRow.RCV_NO", selectRow.RCV_NO)
    safbB0010.value.openPopup(selectRow.CMPNY_DIV, selectRow.RCV_NO, selectRow.PARA_YN )
  }


}





const clearable =()=>{
  searchParams.SAF_EMP_NM = ''
  searchParams.SAF_EMP_NO = ''

}

const openEmpPopup = () => {
  empPopup.value.openPopup({ EMP_NM: searchParams.SAF_EMP_NM })
}

const onEmpSelected = (row) => {

  console.log(row)
  searchParams.SAF_EMP_NM = row.EMP_NM
  searchParams.SAF_EMP_NO = row.EMP_NO

}


const upData = () => {
  onButtonsClick({ id: "btnSearch" })
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
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('작업일')"
              v-model="searchParams.WORK_FROM"
              type="Date"
              width="200px"
              margin="10px"
              required
            />
            <i-input
              :label="$t('-')"
              v-model="searchParams.WORK_TO"
              type="Date"
              width="160px"
              margin="10px"
            />

            <i-select 
              :label="$t('안전조직')"
              v-model="searchParams.SAF_BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM" 
              width="220px" 
            />
            <i-select 
              :label="$t('안전부')"
              v-model="searchParams.SAF_DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM" 
              width="220px" 
            />

            <i-input
              :label="$t('안전요원')"
              width="230px"
              margin="10px"
              placeholder="전체"
              v-model="searchParams.SAF_EMP_NM"
              @keydown.enter="
                  (e) => {
                    openEmpPopup()
                  }
                "
              @click:appendInner="openEmpPopup()"
              append-inner-icon="mdi-magnify"
              clearable
              @click:clearable="clearable()"
            />

            <!-- <i-select
              :label="$t('호선/공사')"
              width="150px"
              margin="10px"
              v-model="searchParams.WORK_NO"
              :items="codeList.WorkNo"
              item-value="WORK_NO"
              :item-props="itemProps"
            /> -->



            <i-select
              :label="$t('진행상태')"
              width="230px"
              margin="10px"
              v-model="searchParams.STATUS"
              :items="codeList.STATUS"
              item-value="COD"
              item-title="TXT"
              :disabled = true
            />

 

            
          </div>
        </v-sheet>

      
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="onEmpSelected" />
  <SAFBB0010PopUp1 ref="safbB0010" @upData="upData" />

</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
.boxBumRel {
  padding: 6px;
  margin: 0px 2px;
  width: 121px;
  text-align: center;
  font-size: 12px;
}
.boxBumRel:first-child {
  margin-left: 10px;
}
</style>
