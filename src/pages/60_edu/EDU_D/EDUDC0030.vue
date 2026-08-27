<!--
  화면명 : 안전칭찬쿠폰 현황
  화면개요 : 안전칭찬쿠폰 현황을 확인할 수 있는 화면.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import { commonEncrypt } from "@hiway/api/commonApi"
import dayjs from "dayjs"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"





// 안전칭찬쿠폰 현황
defineOptions({
  name: "60_edu-EDU_D-EDUDC0030",
})


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const gridTitle = ref(null)

const grdMain01_01 = ref(null)
const grdMain02_01 = ref(null)
let showMessageYN = true



const searchParams01_01 = reactive({ 
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD : userStore.bsnsCd,            // 사업부
    DEPT_CD : userStore.deptCd,            // 부서코드
    ASGN_CD : '',            // 협력사
    IDV_DPT_DIV: '',         // 전체?부서?개인?
    DATE_FR: dayjs(new Date()).subtract(1, 'month').format('YYYY-MM-DD'), // 한달 전    
    DATE_TO: dayjs(new Date()).format('YYYY-MM-DD')     // 오늘
  })



const searchParams02 = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv, 
  START_DATE: dayjs(new Date()).subtract(1, 'month').format('YYYY-MM-DD'), // 한달 전          
  END_DATE: dayjs(new Date()).format('YYYY-MM-DD'), // 오늘
  USER_DIV: '',
})


const tab = ref('tab1')
const codeList1 = reactive({
  cmpnyDiv : [], // 회사구분
  bsnsCd : [],
  deptCd : [],
  asgnCd: [],
  idv_dpt_div: [
  { code: '', text: '전체' },
  { code: 'I', text: '개인' },
  { code: 'D', text: '부서' }
  ],
  main_activity: [],
})
const codeList2 = reactive({
  cmpnyDiv : [], // 회사구분
  userDiv : [], //소속구분
})



//코드리스트 셋팅
const initCodeList = () => {
  
  Promise.all([
    getCodeList('HHIZ000'), // 회사구분
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
    getCodeList('HHID210'), // 소속구분
    getCodeList('HHIC210'), // 주요활동
  ]).then(res => {
    console.log("레스 확인",res)
    // 회사구분
    codeList1.cmpnyDiv = res[0].ORESULT_CUR
    codeList2.cmpnyDiv = res[0].ORESULT_CUR

    // 사업부 설정 
    codeList1.bsnsCd = res[1].ORESULT_CUR
    console.log("codeList1.bsnsCd: ", codeList1.bsnsCd )
    codeList1.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    // searchParams01_01.BSNS_CD = userStore.bsnsCd

    // 부서 설정 
    // codeList1.deptCd = res[2].ORESULT_CUR
    // codeList1.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    // searchParams01_01.DEPT_CD = codeList1.deptCd[0].DEPT_CD

    // 협력사 설정 
    codeList1.asgnCd.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
    searchParams01_01.ASGN_CD = codeList1.asgnCd[0].ASGN_CD



    //소속구분 데이터 세팅
    codeList2.userDiv = res[3].ORESULT_CUR
    codeList2.userDiv.unshift({ TXT: "전체", COD: "" })
    searchParams02.USER_DIV = codeList2.userDiv[0].COD

    if (userStore.userDiv !== 'A'){
      console.log('직영아님:',  userStore)
      searchParams01_01.ASGN_CD = userStore.asgnCd
    }

    // 주요활동 lookup set
    res[4].ORESULT_CUR.forEach(value => 
    {
      codeList1.main_activity.push({TXT : value.TXT, COD : value.COD})
    })


  }).finally(() => {
    // 그리드 세팅
    // TAB01
    grdMain01_01.value.setBindingColumn("AWD_CD", codeList1.main_activity, "COD", "TXT")   // 주요활동 lookup set
    // TAB02

    // TAB03
  
  })
}

//<TAB1> 그리드 1_1 속성셋팅 
const grdProps01_01 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' },  stateBar: { visible: false } ,footer: {visible: true} },
  keys: [],
  fields: [
    {
      fieldName: "BSNS_NM",
      header: { text: t("수상자 사업부") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_DT",
      header: { text: t("지급일") },
      width: '60',
      dataType: "date",
      datetimeFormat: 'yyyy-MM-dd',
      type: 'data',
      editable: false,
    },

    {
      fieldName: "AWD_EMP_NAME",
      header: { text: t("수상자 성명") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NO",
      header: { text: t("수상자 사번") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_ASGN_NAME",
      header: { text: t("수상자 소속/협력사") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_LOC",
      header: { text: t("장소") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_CD",
      header: { text: t("주요활동") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
      lookupDisplay: true,
    },
    {
      fieldName: "AWD_DTL",
      header: { text: t("활동상세내역") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ISUR_NAME",
      header: { text: t("발급인") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ISUR_ASGN_NM",
      header: { text: t("발급인 소속") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ISUR_DATE",
      header: { text: t("발급일자") },
      width: '60',
      dataType: "text",
      editable: false,
      footer: { styleName: 'right-column', text: '소계 : ' },
    },
    {
      fieldName: "IDV_DPT_DIV_NM",
      header: { text: t("지급구분") },
      width: '60',
      //styleName:  'left-column', 
      dataType: "text",
      editable: false,
      footer: { numberFormat: "#,###",expression: "count" },
    },
    {
      fieldName: "POINT",
      header: { text: t("HD안전페이적립") },
      width: '60',
      styleName: 'right-column',
      dataType: "number",
      editable: false,
      numberFormat: "#,###",
      footer: { numberFormat: "#,###",expression: "sum" },
    }
  ],
  columns: [],

})
grdProps01_01.columns = grdProps01_01.fields


//<TAB2> 그리드 2_1 속성셋팅
const grdProps02_01 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' },  stateBar: { visible: false }, footer: { visible:true }  },
  keys: [],
  fields: [
    {
      fieldName: "USER_DIVNM",
      header: { text: t("소속구분") },
      width: '70',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NAME",
      header: { text: t("이름") },
      width: '80',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NO",
      header: { text: t("사번") },
      width: '80',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "HLD_OFFI_GBNNM",
      header: { text: t("재직여부") },
      width: '80',
      dataType: "text",
      footer: { styleName: 'right-column', text: '소계 : ' },
      editable: false,
    },
    {
      fieldName: "AWD_POINT",
      header: { text: t("배정금액") },
      styleName: 'right-column',
      dataType: "number",
      numberFormat: "#,###",
      footer: { numberFormat: "#,###",expression: "sum" },
      editable: false,
    },

    {
      fieldName: "POINT_CODE",
      header: { text: t("안전포인트 배정") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_MEMO",
      header: { text: t("HD안전페이 컨텐츠") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_DT",
      header: { text: t("발급일자") },
      width: '80',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "REMARK",
      header: { text: t("비고") },
      width: '200',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },

    //    안보임
    { fieldName: "GIFT_KIND", header: { text: t("상품종류") }, dataType: "text",  visible: false },
    { fieldName: 'YEAR',   dataType: 'text' , visible: false },
    { fieldName: 'MNTH',   dataType: 'text' , visible: false },
    { fieldName: 'IDV_DPT_DIV',   dataType: 'text' , visible: false },
    { fieldName: 'AWD_SEQ',   dataType: 'number' , visible: false },
    

  ],
  columns: [],

})
grdProps02_01.columns = grdProps02_01.fields


const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    if (tab.value === "tab1"){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain01_01])
        .setBefore(validationChk01)
        .setQuery(searchData01_01)
        .setAfter(afterSearch01_01)
        .showMessage(showMessageYN)
        .run()
    }

  else if (tab.value === "tab2"){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain02_01])
        .setBefore(validationChk02)
        .setQuery(searchData02)
        .setAfter(afterSearch02)
        .showMessage(showMessageYN)
        .run()
    }

  }

}




//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ TAB1 함수■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

const searchData01_01 = () => {
  const paramsCopy = JSON.parse(JSON.stringify(searchParams01_01))
  paramsCopy.DATE_FR = searchParams01_01.DATE_FR.replace(/-/gi,"")
  paramsCopy.DATE_TO = searchParams01_01.DATE_TO.replace(/-/gi,"")

  console.log("searchParams01_01(paramsCopy):", paramsCopy )
  return commonSearchApi({ queryId: "EDUDC0030_TAB01_SEARCH_01" , param: paramsCopy })
}


const afterSearch01_01 = res => {
  console.log("afterSearch01_01:", res.ORESULT_CUR )
  grdMain01_01.value.getDataProvider().setRows(res.ORESULT_CUR)
  let count = grdMain01_01.value.getGridView().getItemCount()
    for (let i = 0; i < count; i++) {
  grdMain01_01.value.getDataProvider().setValue(i, 'POINT', '2000')}
}



//널 체크 이벤트
const isNullCheck = data => {
  return (data === undefined || data === null || data === '') ? true : false
}


// 사업부가 바뀌면 부서 데이터 가져오고 협력사는 초기화
watch(
  () => searchParams01_01.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y'
      },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParams01_01.DEPT_CD = ''
        codeList1.deptCd = res.ORESULT_CUR
        codeList1.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      } else {
        codeList1.deptCd = res.ORESULT_CUR
        codeList1.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
    })
  },
  {
    immediate: true,
  }
)
// watch(() => searchParams01_01.BSNS_CD, (newValue, oldValue) => {
//   searchParams01_01.DEPT_CD = ''
//   codeList1.asgnCd = []
//   codeList1.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
//   searchParams01_01.ASGN_CD = ''

//   // 직접 빈값 입력할수도 있음
//   if(isNullCheck(newValue)){

//     codeList1.deptCd = []
//     codeList1.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
//     // 협력사 리셋
//     codeList1.asgnCd = []
//     codeList1.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
//     return
//   }
//   commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
//     .then(res => {
//       codeList1.deptCd = res.ORESULT_CUR
//       codeList1.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
//       searchParams01_01.DEPT_CD = codeList1.deptCd[0].DEPT_CD
//     }).finally(() => {
//     })
//  })

// 부서 바뀌면 협력사 가져옴
watch(() => searchParams01_01.DEPT_CD, (newValue, oldValue) => {
  searchParams01_01.ASGN_CD = ''
  if(isNullCheck(newValue)){
    // 협력사 리셋
    codeList1.asgnCd = []
    codeList1.asgnCd.unshift({ ASGN_NM:'전체', ASGN_CD:'' })

    return
  }
  if(searchParams01_01.BSNS_CD != ''){
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams01_01.BSNS_CD, DEPT_CD: searchParams01_01.DEPT_CD } })
    .then(res => {
      codeList1.asgnCd = []
      codeList1.asgnCd = res.ORESULT_CUR
      codeList1.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
      searchParams01_01.ASGN_CD = codeList1.asgnCd[0].ASGN_CD
    })
  }
})


const validationChk01 = (res) => {

let startDate = dayjs(searchParams01_01.DATE_FR);
let endDate   = dayjs(searchParams01_01.DATE_TO);

let diffInDays = endDate.diff(startDate, 'day');

if (diffInDays > 60){
  Message.warn(t('검색 기간은 60일 이상을 초과할 수 없습니다.'))
  return false;
}
else if (diffInDays < 0) {
  Message.warn(t('검색 기간을 확인해주세요.'))
  return false;
}
else if (searchParams01_01.DATE_FR < '2024-08-01'){ 
    Message.warn(t('24년 8월 이후 데이터만 조회가능합니다.'))
    return false;
  }
else {
  return true;
} 
}


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ TAB2 함수■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

const onButtonsClick02 = (btn) => {
  if (btn.id === "btnPrint") {

  }

}


const searchData02 = () => {
  const paramsCopy2 = {}
  paramsCopy2.CMPNY_DIV = searchParams02.CMPNY_DIV
  paramsCopy2.START_DATE = searchParams02.START_DATE.replace(/-/gi,"")
  paramsCopy2.END_DATE = searchParams02.END_DATE.replace(/-/gi,"")
  paramsCopy2.USER_DIV = searchParams02.USER_DIV
  console.log("paramsCopy2: ", paramsCopy2)
  return commonSearchApi({ queryId: "EDUDC0030_TAB02_SEARCH_01" , param: paramsCopy2 })
}


const afterSearch02 = (res) => {
  console.log("afterSearch02: ", res.ORESULT_CUR)
  grdMain02_01.value.getDataProvider().setRows(res.ORESULT_CUR)
}


const validationChk02 = (res) => {

  let startDate = dayjs(searchParams02.START_DATE);
  let endDate = dayjs(searchParams02.END_DATE);

  let diffInDays = endDate.diff(startDate, 'day');
  console.log("startDate", startDate)
  console.log("endDate:", endDate, (searchParams02.START_DATE < new Date('2024-08-01')))
  if (diffInDays > 60){
    Message.warn(t('검색 기간은 60일 이상을 초과할 수 없습니다.'))
    return false;
  }
  else if (diffInDays < 0) {
    Message.warn(t('검색 기간을 확인해주세요.'))
    return false;
  }
  else if (searchParams02.START_DATE < new Date('2024-08-01')){ 
    Message.warn(t('24년 8월 이후 데이터만 조회가능합니다.'))
    return false;
  }
  else {
    return true;
  }
}

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
watch(() => searchParams02.START_DATE, (newValue, oldValue) => {
  console.log("날짜" ,newValue)
  if (newValue < '2024-08-01'){
    Message.warn(t('24년 8월 이후 데이터만 조회가능합니다.'))
    searchParams02.START_DATE = '2024-08-01'
  }

})


onMounted(() =>{
    initCodeList()
    if (searchParams01_01.DATE_FR < '2024-08-01'){ // 어차피 둘다 똑같
      searchParams01_01.DATE_FR = '2024-08-01'
      searchParams02.START_DATE = '2024-08-01'
    }
    
    //console.log(useLogsStore().isMenuAdmin === 'Y' ? true : false ,'isAdmin')

  }  
)

// 부서 탭 렌더링: 포상모듈 담당자(GRP00378), admin (HIWAYGRP00001) 
const IsDeptShow = userStore.authGrpCd.includes('GRP00378') || userStore.authGrpCd.includes('HIWAYGRP00001')



</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-2 py-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="mb-2">
        <v-tabs v-model="tab">
          <v-tab value="tab1">지급 현황</v-tab>
          <v-tab v-if = "IsDeptShow" value="tab2">인원별 지급 금액</v-tab>
        </v-tabs>
      </v-sheet>
    </v-card-title>


    <v-card-text v-show="tab == 'tab1'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('회사구분')"
              width="200px"
              v-model="searchParams01_01.CMPNY_DIV"
              :items="codeList1.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select
              :label="$t('사업부')"
              width="250px"
              v-model="searchParams01_01.BSNS_CD"
              :items="codeList1.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :readonly="useLogsStore().isMenuAdmin === 'Y' ? false : true"
            />
            <i-select
              :label="$t('부서')"
              width="250px"
              v-model="searchParams01_01.DEPT_CD"
              :items="codeList1.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :readonly="useLogsStore().isMenuAdmin === 'Y' ? false : true"
            />
            <!--          
            <i-select
              :label="$t('협력사')"
              width="250px"
              v-model="searchParams01_01.ASGN_CD"
              :items="codeList1.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
            />

            -->
            <i-select
              :label="$t('지급구분')"
              width="250px"
              v-model="searchParams01_01.IDV_DPT_DIV"
              :items="codeList1.idv_dpt_div"
              item-title="text"
              item-value="code"
            />
            <i-input
              :label="$t('기간')" type="date"
              width="200px"
              v-model="searchParams01_01.DATE_FR"
              margin="10px"/>
            <i-input
              :label="$t('-')" type="date"
              width="200px"
              v-model="searchParams01_01.DATE_TO"
              margin="10px"/>

          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <div class="h-grow">
          <!--개인 실적 -->
          <v-sheet width="100%" >
            <!-- 그리드1 search area-->
            <RealGrid
              ref="grdMain01_01"
              class="mt-2"
              style="height: 600px"
              :grid-view-option="grdProps01_01.gridViewOption"
              :keys="grdProps01_01.keys"
              :fields="grdProps01_01.fields"
              :columns="grdProps01_01.columns"
              :column-layout="grdProps01_01.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <v-card-text v-if = "IsDeptShow"  v-show="tab == 'tab2'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('회사구분')"
              width="200px"
              v-model="searchParams02.CMPNY_DIV"
              :items="codeList2.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly/>
            <i-select
              :label="$t('소속구분')"
              v-model="searchParams02.USER_DIV"
              :items="codeList2.userDiv"
              item-title="TXT"
              item-value="COD"
              width="200px"
              />
            <i-input
              :label="$t('기간')" type="date"
              width="200px"
              v-model="searchParams02.START_DATE"
              margin="10px"/>

            <i-input
              :label="$t('-')" type="date"
              width="200px"
              v-model="searchParams02.END_DATE"
              margin="10px"/>
          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <!--개인 실적 -->

        <!-- tab2 메인 영역 -->
        <div class="h-auto ">
          <v-sheet width="100%" class="pa-0 h-auto mr-2">
            <RealGrid
              ref="grdMain02_01"
              class="mt-2"
              style="height: 580px"
              :grid-view-option="grdProps02_01.gridViewOption"
              :keys="grdProps02_01.keys"
              :fields="grdProps02_01.fields"
              :columns="grdProps02_01.columns"
              :column-layout="grdProps02_01.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>

  </v-card>
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
    // min-height: 700px;
  }
}
</style>
