<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from "@hiway/stores/logs";
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import dayjs from 'dayjs'
import queryFlowHelper from "@/utils/searchFlowHelper"
import {
  commonSearchApi,
  getCodeList,
} from "@hiway/api/commonApi"
import SAFJA0030Popup01 from "@/pages/30_safety/SAF_J/SAFJA0030Popup01.vue"



defineOptions({
  name: "30_safety-SAF_J-SAFJA0030",
});


const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const userStore = useUserStore()
const SAFJA0030Pop01 = ref(null)
const isReadOnly = ref(false)
const logsStore = useLogsStore()

const openPopupEx = ref(false)

//조회조건 v-model 
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  A_STATUS: '',               //사업부
  B_STATUS: '',               //부문

  // USER_ID : 'BP23091',//유저 ID
  USER_ID : userStore.userId,//유저 ID
  // BSNS_CD: null,
  // DEPT_CD: null,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  GBN: 'C'
})

const grdProps1 = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false } },
  keys : [],
  fields: [
    { fieldName: "BIZ_REG_NM", dataType: "text", header: { text: t("사업자 등록번호") }, editable: false,width: 80 },
    { fieldName: "REV", dataType: "text", header: { text: t("Rev.") }, editable: false,width: 50 },
    { fieldName: "VND_NAME", dataType: "text", header: { text: t("업체명") },editable: false },
    { fieldName: "BIZ_KIND", dataType: "text", header: { text: t("주업종") },editable: false },
    // { fieldName: "WRK_DIV", dataType: "text", header: { text: t("공사구분") },editable: false,width: 50 },
    { fieldName: "REP_NAME", dataType: "text", header: { text: t("대표성명") },editable: false },
    { fieldName: "REP_MOBILE_NO", dataType: "text", header: { text: t("대표연락처") },editable: false,width: 70 },
    { fieldName: "REP_EMAIL", dataType: "text", header: { text: t("대표 E-Mail") },editable: false },

    { fieldName: "EVAL_BSNS_NM", dataType: "text", header: { text: t("부서") }, editable: false },
    { fieldName: "USER_NM", dataType: "text", header: { text: t("평가자") }, editable: false },
    { fieldName: "EVAL_STATUS1", dataType: "text", header: { text: t("진행상태") }, editable: false,lookupDisplay: true,editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: "EVAL_VAL_STATUS1", dataType: "text", header: { text: t("적격구분") }, editable: false,lookupDisplay: true,editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },

    { fieldName: "EVAL_BSNS_NM2", dataType: "text", header: { text: t("부서") }, editable: false },
    { fieldName: "USER_NM2", dataType: "text", header: { text: t("평가자") }, editable: false },
    { fieldName: "EVAL_STATUS2", dataType: "text", header: { text: t("진행상태") }, editable: false,lookupDisplay: true },
    { fieldName: "EVAL_VAL_STATUS2", dataType: "text", header: { text: t("적격구분") }, editable: false,lookupDisplay: true },

    { fieldName: "BIZ_REG_NO", dataType: "text", header: { text: t("BIZ_REG_NO") }, editable: false, visible: false },
    { fieldName: "REP_MOBILE", dataType: "text", header: { text: t("REP_MOBILE") }, editable: false, visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("CMPNY_DIV") }, editable: false, visible: false },
    { fieldName: "EVAL_BSNS_CD", dataType: "text", header: { text: t("EVAL_BSNS_CD") }, editable: false, visible: false },
    { fieldName: "EVAL_DEPT_CD", dataType: "text", header: { text: t("EVAL_DEPT_CD") }, editable: false, visible: false },
    { fieldName: "EVAL_BSNS_CD2", dataType: "text", header: { text: t("EVAL_BSNS_CD2") }, editable: false, visible: false },
    { fieldName: "EVAL_DEPT_CD2", dataType: "text", header: { text: t("EVAL_DEPT_CD2") }, editable: false, visible: false },
    { fieldName: "EVAL_USER_ID", dataType: "text", header: { text: t("EVAL_USER_ID") }, editable: false, visible: false },
    { fieldName: "EVAL_USER_ID2", dataType: "text", header: { text: t("EVAL_USER_ID2") }, editable: false, visible: false },
  ],
  columns: [],
  columnLayout: [
    'BIZ_REG_NM',
    'REV',
    'VND_NAME',
    'BIZ_KIND',
    'REP_NAME',
    'REP_MOBILE_NO',
    'REP_EMAIL',
    {
      name: '1차 평가',
      direction: 'horizontal',
      items: [ 'EVAL_BSNS_NM', 'USER_NM','EVAL_STATUS1','EVAL_VAL_STATUS1' ],
      header: { text: t('1차 평가') },
    },
    {
      name: '2차 평가',
      direction: 'horizontal',
      items: [ 'EVAL_BSNS_NM2', 'USER_NM2','EVAL_STATUS2','EVAL_VAL_STATUS2' ],
      header: { text: t('2차 평가') },
    }
  ],
});

const codeList = reactive({
  dataList1: [],  //진행상태
  dataList2: [],  //사업부
  dataList3: [],  //부서
  statusList: [
    {TXT: '전체', COD: 'C'},
    {TXT: '1차', COD: 'A'},
    {TXT: '2차', COD: 'B'},
  ], // 1,2차 진행상태
  dataList4: []
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    //진행상태
    getCodeList("HHIQ020"), //0
    //적격구분
    getCodeList("HHIQ030"), //0
    //사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV } }),
    //부서
    commonSearchApi({ queryId: "searchDept3", param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV: "Y", } }),

  ]).then(res => {

    //회사구분 콤보박스
    codeList.dataList1 = res[0].ORESULT_CUR
    codeList.dataList1.unshift({ TXT: "전체", COD: "" })
    // //사업부 콤보박스
    codeList.dataList4 = res[1].ORESULT_CUR
    codeList.dataList4.unshift({ TXT: "전체", COD: "" })

    //사업부 콤보박스
    codeList.dataList2 = res[2].ORESULT_CUR
    codeList.dataList2.unshift({ BSNS_NM: "전체", BSNS_CD: "" })

    //부문 콤보박스
    codeList.dataList3 = res[3].ORESULT_CUR
    codeList.dataList3.unshift({ DEPT_NM: "전체", DEPT_CD: "" })

    grd1.value.setBindingColumn("EVAL_STATUS1", res[0].ORESULT_CUR, "COD", "TXT")
    grd1.value.setBindingColumn("EVAL_STATUS2", res[0].ORESULT_CUR, "COD", "TXT")
    grd1.value.setBindingColumn("EVAL_VAL_STATUS1", res[1].ORESULT_CUR, "COD", "TXT")
    grd1.value.setBindingColumn("EVAL_VAL_STATUS2", res[1].ORESULT_CUR, "COD", "TXT")

    searchParams.BSNS_CD = userStore.bsnsCd
    searchParams.DEPT_CD = userStore.deptCd
  })
}

grdProps1.columns = grdProps1.fields;

onMounted(() => {
  // grd1.value.getDataProvider().setRows(data);
  initCodeList()
  console.log('logsStore.isMenuAdmin ', logsStore.isMenuAdmin)
  console.log('logsStore ', logsStore)

  /* ***** 통합안전경영실 만 버튼 활성화 및 조회조건 변경 가능 ***** */
  if(logsStore.isMenuAdmin === 'Y'){
    isReadOnly.value = false
  }else {
    isReadOnly.value = true
  }

  onButtonsClick({id: 'btnSearch'})
})

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grd1])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnChk') {
    openPopupEx.value = true
  }
}

// 조회로직
const searchData = () => {

  return commonSearchApi({
    queryId: 'SAFJA0030_SEARCH_01',
    param: searchParams
  })

}

const afterSearch = res => {
grd1.value.getDataProvider().setRows(res.ORESULT_CUR);

// grd1.value.getDataProvider().setRows(res.ORESULT_CUR, "ALL_SYS_CD")
}

//부서 조회
const comboList3 = () => {
  //중분류
  commonSearchApi({
    queryId: "searchDept3",
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD,
      USE_DIV: "Y",
    },
  }).then((res) => {
    codeList.dataList3 = res.ORESULT_CUR
    codeList.dataList3.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
    searchParams.DEPT_CD = ''

  })
}

//그리드 dblClick Event
const onCellDblClicked = (grid, data) => {
  if (data.cellType === 'data') {
    const rowData = grd1.value.getRowData(data.dataRow)
    
    const getData = {
      CMPNY_DIV: rowData.CMPNY_DIV,
      BIZ_REG_NO: rowData.BIZ_REG_NO,
      REV: rowData.REV,
      BSNS_CD: userStore.bsnsCd,
      DEPT_CD: userStore.deptCd,
      EVAL_STATUS1: rowData.EVAL_STATUS1,
      EVAL_STATUS2: rowData.EVAL_STATUS2,
      EVAL_VAL_STATUS1: rowData.EVAL_VAL_STATUS1,
      EVAL_VAL_STATUS2: rowData.EVAL_VAL_STATUS2,
      EVAL_USER_ID: rowData.EVAL_USER_ID,
      EVAL_USER_ID2: rowData.EVAL_USER_ID2,
    }

    SAFJA0030Pop01.value.openPopup(getData)
  }
}

</script>

<template>
  <v-card>
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle ref="menuTitle" 
          title="단기공사 적격성평가"
          :button-list="['btnSearch']"
          @click-button="onButtonsClick"
        />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex pb-2">
            <i-select
              :label="$t('진행상태')" 
              :items="codeList.statusList"
              v-model="searchParams.GBN"
              item-value="COD"
              item-title="TXT"
              width="160px"
              label-width="60px" 
              class="mr-0"
            />
            <i-select
              :items="codeList.dataList1"
              v-model="searchParams.A_STATUS"
              item-value="COD" 
              item-title="TXT"
              width="160px"
            />


            <i-select
              :label="$t('사업부')" 
              :items="codeList.dataList2"
              v-model="searchParams.BSNS_CD"
              :readonly="isReadOnly"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              label-width="50px" 
              width="230px"
              @update:model-value="comboList3()"
            />

            <i-select
              :label="$t('부서')" 
              :items="codeList.dataList3"
              v-model="searchParams.DEPT_CD"
              :readonly="isReadOnly"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              label-width="40px"
              width="300px"
            />
           <!-- 
            <i-select
              :label="$t('적격구분')" 
              :items="codeList.dataList2"
              v-model="searchParams.B_STATUS"
              item-value="COD"
              item-title="TXT"
              width="175px"
            /> -->
          </div>
          
        </v-sheet>
        <!-- 메인그리드 -->
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
          <RealGrid
            ref="grd1"
            class="mt-2"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>


    </v-card-text>

  </v-card>
  <SAFJA0030Popup01 ref="SAFJA0030Pop01" />
  <v-dialog
  v-model="openPopupEx" 
  eager
  persistent
  width="850px"
  height="100%"
  >

    <div style="width: 100%">
      <iframe
        src="http://localhost:5174/#/outaa0030ex?bizRegNo=1112223333&vendNm=test"
        ref="ifr"
        id="ifr"
        width="100%"
        height="900px"
        frameborder="0"
        
      ></iframe>
    </div>
  </v-dialog>
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

</style>
