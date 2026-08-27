<!--
  화면명 : 단기공사 현황
  화면개요 : 단기공사 현황
  최종수정일자: 2024-04-20
  작성자: 김우빈
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import dayjs from 'dayjs'
import queryFlowHelper from "@/utils/searchFlowHelper";

import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi,getCompanyList } from '@hiway/api/commonApi'

import DeptPopup from '@/components/popup/DeptPopup.vue'
import SAFJA0040Popup04 from '@/pages/30_safety/SAF_J/SAFJA0040Popup04.vue'
import SAFCE0040Popup01 from "./SAFJA0040Popup01.vue"
import SAFCE0040Popup06 from "./SAFJA0040Popup06.vue"

defineOptions({
  name: "30_safety-SAF_J-SAFJA0040",
});

onMounted(() => {
  // grd1.value.getDataProvider().setRows(data);
  initCodeList()

  vm.$nextTick(() => {
    grd1.value.getGridView().setFixedOptions({
      colCount: 4,
    })
    grd1.value.getGridView().header.height = 70;
  })

});

const vm = getCurrentInstance().proxy //다이얼로그관련

const deptPopup = ref(null)
const deptPopup2 = ref(null)
const SAFCE0040Pop01 = ref(null)
const SAFCE0040Pop06 = ref(null)
const userStore = useUserStore()
const t = useI18n().t; //다국어
const menuTitle = ref(null) 
const grd1 = ref(null)

//조회조건 v-model 
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  PART_CD: '',               //부문
  ASGN_CD : '',              //출입신청부서 코드
  ASGN_NM: '',               //출입신청부서 명
  //공사기간
  WRK_DATE_FROM : dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD'), //기간 시작
  WRK_DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), //기간 종료
  VND_CD: '',               // 협력회사코드
  VND_NM: '',               // 협력회사명
  // DANGER_CD: '',         // 위험작업여부
  STATUS: '',               // 진행상태
  // SAFEDEPT_CD: '',       // 안전팀(승인)
  // REF_ASGN_CD: '',       // 안전팀(확인)
  CHK_YN01: 'N',            // 미확인건조회
  CHK_YN02: 'N',            // 공사기간 1개월 이상
  CHK_YN03: 'N',            // 연간 총 공사일수 60일 이상
  DEPT_GBN: 'A',            // 조회조건 부서 구분

  USER_ID : userStore.userId,//유저 ID
})

const grdProps1 = reactive({
  fields: [
    { fieldName: "CMPNY_DIV",         dataType: "text", width: '0',   header: { text: t("CMPNY_DIV") },         editable: false,visible:false },
    { fieldName: "DEPT_NM",           dataType: "text", width: '200', header: { text: t("의뢰부서") },           editable: false,styleName: "left-column" },
    { fieldName: "KOR_NM",            dataType: "text", width: '60',  header: { text: t("의뢰담당자") },         editable: false },
    { fieldName: "DEPT_PIC_DEPT_NM",  dataType: "text", width: '200', header: { text: t("DEPT_PIC_DEPT_NM") },  editable: false,styleName: "left-column" },
    { fieldName: "DEPT_PIC_EMPNM",    dataType: "text", width: '60',  header: { text: t("DEPT_PIC_EMPNM") },    editable: false },
    { fieldName: "WRK_MNG_DEPT_NM",   dataType: "text", width: '200', header: { text: t("WRK_MNG_DEPT_NM") },   editable: false,styleName: "left-column" },
    { fieldName: "WRK_MNG_EMPNM",     dataType: "text", width: '60',  header: { text: t("WRK_MNG_EMPNM") },     editable: false },
    { fieldName: "VND_NAME",          dataType: "text", width: '250', header: { text: t("업체명") },            editable: false,styleName: "left-column" },
    // { fieldName: "WORK_DIVNM", dataType: "text", header: { text: t("작업분류") },editable: false },
    { fieldName: "WORK_NO",           dataType: "text", width: '160', header: { text: t("공사번호") },          editable: false },
    { fieldName: "WORK_DESC",         dataType: "text", width: '200', header: { text: t("공사명") },            editable: false,styleName: "left-column" },
    { fieldName: "REQ_DATE",          dataType: "text", width: '90',  header: { text: t("신청일") },            editable: false },
    { fieldName: "WORK_DT",           dataType: "text", width: '170', header: { text: t("공사기간") },          editable: false },
    { fieldName: "PERIOD",            dataType: "text", width: '60',  header: { text: t("일수") },              editable: false },
    { fieldName: "TOT_PERIOD_YEAR1",  dataType: "text", width: '80',  header: {text: t('연간 총\n공사일수\n(누적)'), styleName: "multiline-editor"},editable: false },
    { fieldName: "TOT_PERIOD_YEAR2",  dataType: "text", width: '80',  header: {text: t('연간 총\n공사일수\n(중복제외)'), styleName: "multiline-editor"},editable: false },
    { fieldName: "WORK_AREA",         dataType: "text", width: '250', header: { text: t("공사장소") },    editable: false,styleName: "left-column" },
    { fieldName: "DANGER_S",          dataType: "text", width: '60',  header: { text: t("신고대상") },    editable: false },
    { fieldName: "IN_PERSON",         dataType: "text", width: '60',  header: { text: t("출입인원") },    editable: false },
    { fieldName: "DANGER_H",          dataType: "text", header: { text: t("위험작업 허가대상") },          editable: false,visible:false },
    { fieldName: "STATUS_NAME",       dataType: "text", width: '100', header: { text: t("진행상태") },    editable: false },
    { fieldName: "REL_ASGN_NM",       dataType: "text", header: { text: t("안전부(승인)") },              editable: false,visible:false },
    { fieldName: "GATE_NM",           dataType: "text", width: '100', header: { text: t("출입문") },     editable: false },
    { fieldName: "UNQUI_DESC",        dataType: "text", width: '100', header: { text: t("반려사유") },    editable: false,styleName: "left-column" },
    { fieldName: "BIZ_KIND",          dataType: "text", width: '80',  header: { text: t("주업종") },      editable: false,styleName: "left-column" },
    { fieldName: "REP_NAME",          dataType: "text", width: '80',  header: { text: t("대표자명") },    editable: false },
    { fieldName: "VEND_TELNO",        dataType: "text", width: '100', header: { text: t("회사전화번호") }, editable: false },
    { fieldName: "WORK_PIC_EMPNM",    dataType: "text", width: '80',  header: { text: t("공사책임자") },  editable: false },
    { fieldName: "WORK_PIC_MOBILE",   dataType: "text", width: '100', header: { text: t("연락처") },     editable: false,visible:false },
    { fieldName: "VEND_ADDR",         dataType: "text", width: '100', header: { text: t("회사주소") },   editable: false,styleName: "left-column" },
    { fieldName: "BIZ_REG_NO",        dataType: "text", width: '100', header: { text: t("사업자등록번호") },editable: false },    
    { fieldName: "INJR_INSR_NO",      dataType: "text", width: '100', header: { text: t("산재보험번호") },editable: false },
    { fieldName: "GROUP_INSR_NO",     dataType: "text", header: { text: t("단체보상보험") },              editable: false,visible:false },
    { fieldName: "REF_ASGN_NM",       dataType: "text", header: { text: t("안전팀") },                   editable: false,visible:false },
    { fieldName: "REF_CFM_EMPNM",     dataType: "text", header: { text: t("확인자") },                   editable: false,visible:false },
    { fieldName: "REF_CFM_DATE",      dataType: "text", header: { text: t("확인일시") },                 editable: false,visible:false },
    { fieldName: "PERSON_CNT",        dataType: "text", width: '110', header: { text: t("출입인원기간전체") }, editable: false },

    { fieldName: "VEND_CD",           dataType: "text", header: { text: t("VEND_CD") },          editable: false },
    { fieldName: "WORK_NO_ORI",       dataType: "text", header: { text: t("WORK_NO_ORI") },      editable: false },
    { fieldName: "REV_NO",            dataType: "text", header: { text: t("REV_NO") },           editable: false },
    { fieldName: "WORK_DIV",          dataType: "text", header: { text: t("WORK_DIV") },         editable: false },
    { fieldName: "WRK_MNG_COMPANY",   dataType: "text", header: { text: t("WRK_MNG_COMPANY") },  editable: false },
    { fieldName: "WRK_MNG_DEPT_CD",   dataType: "text", header: { text: t("WRK_MNG_DEPT_CD") },  editable: false },
    { fieldName: "DEPT_COMPANY",      dataType: "text", header: { text: t("DEPT_COMPANY") },     editable: false },
    { fieldName: "DEPT_PIC_DEPT_CD",  dataType: "text", header: { text: t("DEPT_PIC_DEPT_CD") }, editable: false },
    { fieldName: "YEAR",              dataType: "text", header: { text: t("YEAR") },             editable: false },
  ],
  columns: [],
  columnLayout: [
    'CMPNY_DIV',
    {
      name: "공사업체 정보",
      direction: "horizontal",
      hideChildHeaders: true,
      items: ["DEPT_NM", "KOR_NM"],
      header: { text: t("출입신청부서") },
    },
    {
      name: "공사담당부서",
      direction: "horizontal",
      hideChildHeaders: true,
      items: ["DEPT_PIC_DEPT_NM", "DEPT_PIC_EMPNM"],
      header: { text: t("공사담당부서") },
    },
    {
      name: "공사관리부서",
      direction: "horizontal",
      hideChildHeaders: true,
      items: ["WRK_MNG_DEPT_NM", "WRK_MNG_EMPNM"],
      header: { text: t("공사관리부서") },
    },
    "VND_NAME",
    // "WORK_DIVNM", 
    "WORK_NO",
    "WORK_DESC", "REQ_DATE",
    "WORK_DT", "PERIOD", "TOT_PERIOD_YEAR1", "TOT_PERIOD_YEAR2", "WORK_AREA",
    "IN_PERSON", "DANGER_H", "STATUS_NAME",
    "REL_ASGN_NM", "GATE_NM", "UNQUI_DESC", 
    {
      name: "공사업체 정보",
      direction: "horizontal",
      items: ["BIZ_KIND", "VEND_TELNO", "WORK_PIC_EMPNM", "WORK_PIC_MOBILE"
            , "VEND_ADDR", "BIZ_REG_NO", "INJR_INSR_NO", "GROUP_INSR_NO"],
      header: { text: t("공사업체정보") },
    },
    {
      name: "안전팀(확인)",
      direction: "horizontal",
      items: [ "REF_ASGN_NM", "REF_CFM_EMPNM", "REF_CFM_DATE",],
      header: { text: t("안전팀(확인)") },
    },
    "PERSON_CNT",
  ],
});

grdProps1.columns = grdProps1.fields;

const codeList = reactive({
  dataList1: [],  //회사구분
  dataList2: [],  //사업부
  dataList3: [],  //부문
  dataList4: [],  //위험작업여부
  dataList5: [],  //진행상태
  dataList6: [],  //안전팀(승인)
  dataList7: [],  //안전팀(확인)
  deptGbn: [
    {TXT: '출입신청부서', COD: 'A'},
    {TXT: '공사담당부서', COD: 'B'},
    {TXT: '공사관리부서', COD: 'C'},
  ], // 1,2차 진행상태
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    //회사구분
    getCompanyList(),
    //사업부 
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: userStore.cmpnyDiv } }),
    //부문
    getCodeList('HHIS040'),
    //진행상태
    commonSearchApi({ queryId: 'SAFJA0040_SEARCH_01', param: { DIV: 2, CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '' } }),
    // //위험작업여부
    // commonSearchApi({ queryId: 'SAFJA0040_SEARCH_01', param: { DIV: 1, CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '' } }),
    // //안전팀(승인)
    // commonSearchApi({ queryId: 'SAFJA0040_SEARCH_01', param: { DIV: 3, CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '' } }),
    // //안전팀(확인)
    // commonSearchApi({ queryId: 'SAFJA0040_SEARCH_01', param: { DIV: 3, CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '' } }),

  ]).then(res => {
    console.log("레스 확인", res)

    //회사구분 콤보박스
    codeList.dataList1 = res[0].ORESULT_CUR

    //사업부 콤보박스
    codeList.dataList2 = res[1].ORESULT_CUR
    codeList.dataList2.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    console.log('res[2].ORESULT_CUR ', res[2].ORESULT_CUR)
    //부문 콤보박스
    codeList.dataList3 = res[2].ORESULT_CUR
    codeList.dataList3.unshift({ TXT: "전체", COD: "" })
    // //위험작업여부
    // codeList.dataList4 = res[3].ORESULT_CUR
    //진행상태
    codeList.dataList5 = res[3].ORESULT_CUR
    codeList.dataList5.unshift({ TXT: "전체", COD: "" })

    // //안전팀(승인)
    // codeList.dataList6 = res[5].ORESULT_CUR
    // codeList.dataList6.unshift({ DISP_NM: "전체", ASGN_CD: "" })

    // //안전팀(확인)
    // codeList.dataList7 = res[6].ORESULT_CUR
    // codeList.dataList7.unshift({ CMPNY_DISPNM: "", ASGN_CD: "" })

    searchParams.ASGN_CD = ''
  })
}

const comboList = () => {
  //사업부
  commonSearchApi({
    queryId: 'searchBSNS', param: {
      CMPNY_DIV: searchParams.CMPNY_DIV
    }
  }).then(res => {
    
    codeList.dataList2 = res.ORESULT_CUR
    codeList.dataList2.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
  })

  //     //안전팀(승인)
  // commonSearchApi({
  //   queryId: 'SAFJA0040_SEARCH_01'
  //   , param: { DIV: 3, CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: '' }
  // }).then(res => {
    
  //   codeList.dataList6 = res.ORESULT_CUR
  //   codeList.dataList6.unshift({ DISP_NM: "전체", ASGN_CD: "" })
  // })

  //   //안전팀(확인)
  // commonSearchApi({
  //   queryId: 'SAFJA0040_SEARCH_01'
  //   , param: { DIV: 3, CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: '' }
  // }).then(res => {
    
  //   codeList.dataList7 = res.ORESULT_CUR
  //   codeList.dataList7.unshift({ CMPNY_DISPNM: "전체", ASGN_CD: "" })
  // })
  //사업부
  searchParams.BSNS_CD = ''
  // //안전팀(승인)
  // searchParams.SAFEDEPT_CD = ''
  // //안전팀(확인)
  // searchParams.REF_ASGN_CD = ''

  searchParams.PART_CD = ''
}

const comboList2 = () => {

  // //부문
  // commonSearchApi({
  //   queryId: 'SAFJA0040_SEARCH_01'
  //   , param: { DIV: 4, CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD }
  // }).then(res => {
    
  //   //부문 콤보박스
  //   codeList.dataList3 = res.ORESULT_CUR
  //   codeList.dataList3.unshift({ ASGN_SHRT_NM: "전체", PART_CD: "" })
  // })

  searchParams.PART_CD = ''

  // //안전팀(승인)
  // searchParams.SAFEDEPT_CD = ''
  // //안전팀(확인)
  // searchParams.REF_ASGN_CD = ''

  searchParams.PART_CD = ''
}

//조회 버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grd1])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  
}


//method

//부서 조회 팝업 오픈
const openDeptPopup = () => {
  console.log('searchParams ', searchParams)
  deptPopup.value.openPopup({
    disabled: {
      ORGN_DIV: true, 
    },
    ORGN_DIV: "A", 
    CMPNY_DIV: searchParams.CMPNY_DIV, 
    BSNS_CD: searchParams.BSNS_CD,
    ASGN_NM : searchParams.ASGN_NM,
    HSE_SYS : 'N',
  })
}

//단기공사 협력회사 조회 팝업 오픈
const openDeptPopup2 = () => {
  deptPopup2.value.openPopup({
    CMPNY_DIV: searchParams.CMPNY_DIV, 
    VND_NAME : searchParams.VND_NM,
  })
}

// 단기공사 현황 팝업 오픈
const openDetailPopup = (data) => {
  SAFCE0040Pop01.value.openPopup(data)
}

//그리드 dblClick Event
const onCellDblClicked = (grid, data) => {
  
  if (data.cellType === 'data') {
    const rowData = grd1.value.getRowData(data.dataRow)

    if (data.column === 'TOT_PERIOD_YEAR1' || data.column === 'TOT_PERIOD_YEAR2'){
      SAFCE0040Pop06.value.openPopup(rowData)
    } else {
      console.log('data :: ', data, ' rowData ::: ', rowData)
      const getData = {
        CMPNY_DIV: rowData.CMPNY_DIV,
        BIZ_REG_NO: rowData.BIZ_REG_NO,
        VEND_CD: rowData.VEND_CD,
        WORK_NO: rowData.WORK_NO_ORI,
        REV_NO: rowData.REV_NO,
      }
      openDetailPopup(getData)
    }
  }
}

//부서 팝업에서 선택한 데이터 바인딩
const onDeptSelected = item => {
  searchParams.ASGN_NM = item.ASGN_SHRT_NM
  searchParams.ASGN_CD = item.ASGN_CD
}

const onDeptSelected2 = item => {
  searchParams.VND_NM = item.VND_NAME
  searchParams.VND_CD = item.VEND_CD
}

//안전팀(확인)
const getItemText = (item) => {
  let str = ''
  if (item.CMPNY_DIVNM === '') {
    str = `${item.CMPNY_DIVNM} ${item.DISP_NM}` 
  } else {
    str = `${item.CMPNY_DIVNM} - ${item.DISP_NM}`
  }
  return str;
}

// 조직도 부서 조회 파라미터


// 조회로직
const searchData = () => {
  // console.log('acdtParms ', acdtParms)
  const acdtParms = {}
  acdtParms.CMPNY_DIV    = searchParams.CMPNY_DIV
  acdtParms.USER_ID      = ''
  acdtParms.WORK_FROM_DT = searchParams.WRK_DATE_FROM.replaceAll('-','')
  acdtParms.WORK_TO_DT   = searchParams.WRK_DATE_TO.replaceAll('-','')
  acdtParms.VEND_CD      = searchParams.VND_CD
  acdtParms.STATUS       = searchParams.STATUS
  acdtParms.BSNS_CD      = searchParams.BSNS_CD
  acdtParms.DEPT_GBN     = searchParams.DEPT_GBN
  acdtParms.DEPT_CD      = searchParams.ASGN_CD
  // acdtParms.REL_ASGN_CD= searchParams.SAFEDEPT_CD
  // acdtParms.DANGER= searchParams.DANGER_CD
  // acdtParms.REF_ASGN_CD= searchParams.REF_ASGN_CD
  acdtParms.REF_CFM_CHK  = searchParams.CHK_YN01
  acdtParms.DAYS30OVER   = searchParams.CHK_YN02
  acdtParms.YEAR60OVER   = searchParams.CHK_YN03
  acdtParms.PART_CD2     = searchParams.PART_CD
  return commonSearchApi({
    queryId: 'SAFJA0040_SEARCH_02',
    param: acdtParms
  })

}

const afterSearch = res => {

  console.log('res ', res)
  grd1.value.getDataProvider().setRows(res.ORESULT_CUR);

  // grd1.value.getDataProvider().setRows(res.ORESULT_CUR, "ALL_SYS_CD")
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle ref="menuTitle" title="단기공사 현황" :button-list="['btnSearch']" @click-button="onButtonsClick" />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex pb-2">
            <i-select
              :label="$t('회사구분')" 
              :items="codeList.dataList1"
              v-model="searchParams.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              label-width="60px" 
              width="250px"
              @update:model-value="comboList()"
            />
            
            <i-select
              :label="$t('사업부')" 
              :items="codeList.dataList2"
              v-model="searchParams.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              width="200px"
              label-width="50px" 
              @update:model-value="comboList2()"
            />

            <i-select
              :label="$t('부문')" 
              :items="codeList.dataList3"
              v-model="searchParams.PART_CD"
              item-value="COD"
              item-title="TXT"
              label-width="80px"
              width="250px"
            />

            <i-select
              :label="$t('')" 
              :items="codeList.deptGbn"
              v-model="searchParams.DEPT_GBN"
              item-value="COD"
              item-title="TXT"
              width="150px"
            />

            <i-input
              v-model="searchParams.ASGN_NM"
              @update:modelValue="e => {searchParams.ASGN_CD = null}"
              class="mr-1"
              label-width="80px" 
              width="300px" 
              />

            <i-input
              :label="$t('')" 
              v-model="searchParams.ASGN_CD"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup()"
              @keydown.enter="e => {openDeptPopup()}"
              width="100px"
              readonly              
            />


          </div>

          <div class="d-flex pb-2">
            <i-input
              class="mr-0"
              :label="$t('공사기간')" 
              type="date" 
              v-model="searchParams.WRK_DATE_FROM"
              label-width="60px" 
              width="250px" 
            />
            <span class="d-flex align-center mx-3">~</span>
            <i-input
              :label="$t('')" 
              type="date" 
              v-model="searchParams.WRK_DATE_TO"
              label-width="0px" 
              width="190px" 
            />

            <i-select
              :label="$t('진행상태')"
              v-model="searchParams.STATUS"
              :items="codeList.dataList5"
              item-value="COD"
              item-title="TXT"
              label-width="80px"
              width="250px"
            />

            <i-input
              :label="$t('협력회사')"
              v-model="searchParams.VND_NM"
              @update:modelValue="e => {searchParams.VND_CD = null}"
              class="mr-1"
              label-width="160px" 
              width="467px" 
            />
            <i-input
              :label="$t('')" 
              v-model="searchParams.VND_CD"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup2()"
              @keydown.enter="e => {openDeptPopup2()}"
              label-width="0px" 
              width="100px"
              readonly 
              />

            <!--<i-select
              :label="$t('위험작업여부')"
              v-model="searchParams.DANGER_CD"
              :items="codeList.dataList4"
              item-value="COD"
              item-title="TXT"
              width="200px"
            />-->

            <VCheckbox
              class="ma-0 mt-1"
              :label="$t('공사기간 1개월 이상')"
              v-model="searchParams.CHK_YN02"
              style="padding-right: 10px;"
            />

            <VCheckbox
              class="ma-0 mt-1"
              :label="$t('연간 총 공사일수 60일 이상(중복 제외 기준)')"
              v-model="searchParams.CHK_YN03"
            />

          </div>

          <!--
          <div class="d-flex">

            <i-select
              :label="$t('안전팀(승인)')" 
              :items="codeList.dataList6"
              v-model="searchParams.SAFEDEPT_CD"
              item-value="ASGN_CD"
              item-title="DISP_NM"
              label-width="80px" 
              width="445px" 
            />

            <i-select
              :label="$t('안전팀(확인)')" 
              :items="codeList.dataList7"
              v-model="searchParams.REF_ASGN_CD"
              item-value="ASGN_CD"
              item-title="CMPNY_DISPNM"
              label-width="80px" 
              width="445px" 
            />

            <VCheckbox
              class="mr-2 mt-1"
              :label="$t('미확인건조회')"
              v-model="searchParams.CHK_YN01"
            />            
          </div>
          -->
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
  <DeptPopup
    ref="deptPopup"
    @selected="onDeptSelected"
  />
  <!-- 협력회사 조회 -->
  <SAFJA0040Popup04
    ref="deptPopup2"
    @selected="onDeptSelected2"/>
  <SAFCE0040Popup01 ref="SAFCE0040Pop01" />
  <SAFCE0040Popup06 ref="SAFCE0040Pop06" />
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
