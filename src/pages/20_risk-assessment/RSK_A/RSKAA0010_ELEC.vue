<!-- 
  화면명  : 부서별 위험성평가 대시보드 (일렉용)
  설명    : 선택한 해당년도, 반기, 부서에 대한 위험성평가 내용을 집계하여 표시
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useCommonStore } from "@hiway/stores/common";
import { isUseAPI } from "@hiway/utils/check"
import request from "@/utils/request"
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import IGridTitle from "@/components/IGridTitle.vue";
import { commonSearchApi, commonRequest3 } from "@hiway/api/commonApi";
// import { elecMobileRequest } from "@hiway/api/commonApiElec";
import { useRoute, useRouter } from "vue-router";
import {getToken} from "@hiway/utils/token"
import dayjs from "dayjs";
import Message from "@hiway/utils/notify";

// POPUP
import DeptPopup from "@/components/popup/DeptPopup.vue";

// Echart
import Echart from "vue-echarts";
import { CanvasRenderer } from "echarts/renderers";
import { use } from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
} from "echarts/components";
import { forEach } from "lodash-es";

use([
  CanvasRenderer,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  BarChart,
]);

defineOptions({
  name: "20_risk-assessment-RSK_A-RSKAA0010",
});

const t = useI18n().t; //다국어
const commonStore = useCommonStore();
const menuTitle = ref(null);
const userStore = useUserStore(); //유저정보
const route = useRoute();
const router = useRouter();

const deptPopup = ref(null);

// 관리자
const isAdmin = ref(false);

const chartRefresh01 = ref(0);
const chartRefresh02 = ref(0);
const chart1 = ref(null);
const chart2 = ref(null);

const searchParams = reactive({
  YEAR: dayjs().get("year"),
  HALF: dayjs().get("month") + 1 <= 6 ? "1" : "2",
  DEPT_CD: userStore.userDiv === "A" ? userStore.deptCd : userStore.asgnCd, // 부서코드
  DEPT_NM: "", // 부서명
  DEPT_HEAD_NM: "", // 부서장
  WORK_STANDARD_CNT: "", // 작업표준
  WORK_STANDARD_AVG_RISK: "", // 평균위험성
  RISK_CNT: "", // 위험요인
  NEW_WRITTEN_EVALUATED: "", // 작성/평가중(신규)
  REV_WRITTEN_EVALUATED: "", // 작성/평가중(개정)
  NEW_APPROVAL_PROGRESS: "", // 결재진행중(신규)
  REV_APPROVAL_PROGRESS: "", // 결재진행중(제정)
  NEW_APPROVED: "", // 결재완료(신규)
  REV_APPROVED: "", // 결재완료(제정)
  ABOLITION: "", // 폐지
  ALL_IMP_RISK_CNT: "", // 중요위험
  ALL_SP_CNT: "", // 특별감소대책
  COMPLETE_RATIO: "", // 개선조치이행률
  DELAY_CNT: "", // 기간경과 감소대책
  SAFETY_ACC_CNT: "", // 안전사고
  WORK_STANDARD_CNT2: "", // 작업표준(수시 위험성)
  NROUTINE_WORK_CNT: "", // 비일상 작업
  AFTER_RISK: "", // 개선후 위험성
  CURRENT_RISK: "", // 현재 위험성
  AFTER_PERCENT: "", // 개선후 위험성(퍼센트)

  PROCESS_WORK_CNT: "", // 공정변경
  MAT_WORK_CNT: "", // 물질변경
  TOP3: [], // TOP3 위험유형
});

const codeList = reactive({
  HALF: [
    { COD: "1", TXT: "상반기" },
    { COD: "2", TXT: "하반기" },
  ],
});

// Chart(위험분류별 위험성평가 현황)
const chartsOptions1 = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  grid: {
    top: "15%",
    width: "95%",
    height: "85%",
    left: "2%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: [],
    axisLabel: {
      rotate: 30,
      interval: 0,
    },
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      type: "bar",
      data: [],
      label: {
        show: true,
        position: "top",
      },
      barWidth: "20%",
    },
  ],
});

const chartsOptions2 = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  legend: {},
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: [
    {
      type: "category",
      data: [],
    },
  ],
  yAxis: [
    {
      type: "value",
    },
  ],
  series: [
    {
      name: "본작업",
      type: "bar",
      stack: "Ad",
      emphasis: {
        focus: "series",
      },
      itemStyle: {
        color: "#1F4078",
      },
      data: [],
    },
    {
      name: "별도작업",
      type: "bar",
      stack: "Ad",
      emphasis: {
        focus: "series",
      },
      itemStyle: {
        color: "#3F7AB5",
      },
      data: [],
    },
    {
      name: "현장 위험성평가",
      type: "line",
      stack: "Total",
      itemStyle: {
        color: "#A13E97",
      },
      data: [],
    },
  ],
});

// 버튼 클릭 이벤트
const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    await searchData();
  }
};

// 조회
const searchData = async () => {
  try {
    commonStore.loading = true;

    console.log("01")
    await search01();
    console.log("02")
    await search02();
    console.log("03")
    await search03();
    console.log("04")
    await search04();
    console.log("05")
    await search05();
    console.log("06")
    await search06();
    console.log("07")
    await search07();
    
    
  } catch (err) {
    Message.err(err);
    return;
  } finally {
    commonStore.loading = false;
    //Message.success(t("조회 되었습니다."));
  }
};

// 부서/부서장 조회
const search01 = async () => {
  const data = {
    queryId: "RSKAA0010_SEARCH_01",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      DEPT_CD: searchParams.DEPT_CD,
    },
  };

  const meta = { useProgress: false }

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {
    searchParams.DEPT_NM = res.ORESULT_CUR[0].DEPT_NM
    searchParams.DEPT_HEAD_NM = res.ORESULT_CUR[0].DEPT_HEAD_NM
  })
}

// 정기 위험성평가 - 작업표준
const search02 = async () => {
  const data = {
    queryId: "RSKAA0010_SEARCH_02",
    param: searchParams,
  };

  const meta = { useProgress: false };

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {
    searchParams.WORK_STANDARD_CNT = res.ORESULT_CUR[0].WORK_STANDARD_CNT;
    searchParams.WORK_STANDARD_AVG_RISK =
      res.ORESULT_CUR[0].WORK_STANDARD_AVG_RISK;
    searchParams.RISK_CNT = res.ORESULT_CUR[0].RISK_CNT;
  });
};

// 정기 위험성평가 - 작업표준
const search03 = async () => {
  const data = {
    queryId: "RSKAA0010_SEARCH_03",
    param: searchParams,
  };

  const meta = { useProgress: false };

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {
    console.log("res=" + res.ORESULT_CUR)    
    let exist = res.ORESULT_CUR > 0 ? 'Y' : 'N'

    if (exist == 'Y') {
      // 에러가 발생해서 주석 처리함. (2024.12.20)
      searchParams.NEW_WRITTEN_EVALUATED =       res.ORESULT_CUR[0].NEW_WRITTEN_EVALUATED 
      searchParams.REV_WRITTEN_EVALUATED =      res.ORESULT_CUR[0].REV_WRITTEN_EVALUATED
      searchParams.NEW_APPROVAL_PROGRESS =      res.ORESULT_CUR[0].NEW_APPROVAL_PROGRESS
      searchParams.REV_APPROVAL_PROGRESS =      res.ORESULT_CUR[0].REV_APPROVAL_PROGRESS
      searchParams.NEW_APPROVED = res.ORESULT_CUR[0].NEW_APPROVED
      searchParams.REV_APPROVED = res.ORESULT_CUR[0].REV_APPROVED
      searchParams.ABOLITION = res.ORESULT_CUR[0].ABOLITION
    }
    
  })
}

// 정기 위험성평가 - 중요위험
const search04 = async () => {
  const data = {
    queryId: "RSKAA0010_SEARCH_04",
    param: searchParams,
  };

  const meta = { useProgress: false };

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {
    searchParams.ALL_IMP_RISK_CNT = res.ORESULT_CUR1[0].ALL_IMP_RISK_CNT;
    searchParams.ALL_SP_CNT = res.ORESULT_CUR1[0].ALL_SP_CNT;
    searchParams.COMPLETE_RATIO = res.ORESULT_CUR2[0].COMPLETE_RATIO;
    searchParams.DELAY_CNT = res.ORESULT_CUR2[0].DELAY_CNT;
    searchParams.CURRENT_RISK = res.ORESULT_CUR3[0].CURRENT_RISK;
    searchParams.AFTER_RISK = res.ORESULT_CUR3[0].AFTER_RISK;
    searchParams.AFTER_PERCENT = res.ORESULT_CUR3[0].AFTER_PERCENT;
  });
};

// 수시 위험성평가 - 안전사고
const search05 = async () => {
  const data = {
    queryId: "RSKAA0010_ELEC_SEARCH_05",
    param: searchParams,
  };

  const meta = { useProgress: false };

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {
    searchParams.SAFETY_ACC_CNT = res.ORESULT_CUR1[0].SAFETY_ACC_CNT;
    searchParams.WORK_STANDARD_CNT2 = res.ORESULT_CUR1[0].WORK_STANDARD_CNT;
    searchParams.NROUTINE_WORK_CNT = res.ORESULT_CUR2[0].NROUTINE_WORK_CNT;

    // 일렉용으로 공정변경, 물질변경 추가함. (2024.11.21)
    //searchParams.PROCESS_WORK_CNT = 0;
    //console.log(res.ORESULT_CUR3[0])
    searchParams.PROCESS_WORK_CNT = res.ORESULT_CUR3[0].PROCESS_WORK_CNT;
    searchParams.MAT_WORK_CNT = res.ORESULT_CUR4[0].MAT_WORK_CNT;
  });
};

// 위험분류별 위험성평가 현황(차트)
const search06 = async () => {
  chartsOptions1.value.xAxis.data = [];
  chartsOptions1.value.series[0].data = [];

  const data = {
    queryId: "RSKAA0010_SEARCH_06",
    param: searchParams,
  };

  const meta = { useProgress: false };

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {
    res.ORESULT_CUR.forEach((el) => {
      chartsOptions1.value.xAxis.data.push(el.TXT);
      chartsOptions1.value.series[0].data.push(el.CNT);

      chart1.value.setOption(chartsOptions1);
      chartRefresh01.value++;
    });
  });
};

// 현장위험성평가(1.차트 2.TOP3 위험유형)
const search07_mobileSaftyWork = async () => {  

  // 2024, WX50, 1로 했을때 데이터 조회됨.
  const data = {
    year: searchParams.YEAR,     
    deptCode: userStore.deptCd,
    halfYearType: searchParams.HALF, 

    
  }

  console.log("searchParams.HALF=" + searchParams.HALF)

  const meta = { useProgress: false };

  console.log("search07 start")
  await elecMobileRequest(data, meta).then((res) => {
    console.log("res2=", res) 
    if (res.result.status == '200') {
      console.log("res.result=", res.result)       
      console.log("res.data=", res.data.length)       

      res.data.forEach((el) => {

        console.log("mon=" + el.work_mon)
         let xAxis = el.work_mon + "월"

         chartsOptions2.value.xAxis[0].data.push(xAxis)
         chartsOptions2.value.series[0].data.push(el.etc_work) // 별도작업
         chartsOptions2.value.series[1].data.push(el.bon_work) // 본작업
         chartsOptions2.value.series[2].data.push(el.risk_cnt) // 위험건수

      })

      // 2월까지 일 경우 나머지 3월부터 12월까지의 데이터를 채운다.
      if (res.data.length > 0 && res.data.length < 12) {
        for (let inx = res.data.length; inx < 13; inx++) {
          chartsOptions2.value.xAxis[0].data.push(inx.toString().padStart(2, '0') + "월")
        }
      }
      
      //chartsOptions2.value.xAxis[0].data.push("3월")
      // chartsOptions2.value.series[0].data.push(0) // 별도작업
      // chartsOptions2.value.series[1].data.push(0) // 본작업
      // chartsOptions2.value.series[2].data.push(0) // 위험건수


      chart2.value.setOption(chartsOptions2)
      chartRefresh02.value++     

      console.log("search07 end")
    }
    
  })

};

/**
 * 일렉 안전작업지시 데이터를 조회함. 원칙적으로 request API파일을 따로 분리할려고 했으나, 추후 일렉용으로 개발시 빼기로 함.
 */
const elecMobileRequest = (data) => {
  // let isProd = true
  var hostname = window.location.hostname
  console.log("hostname", hostname)
  console.log("data", data)

  // 토큰
  data.token = getToken()

  if (isUseAPI()) {
    return request({

      url: "/hse/fileElec/elecMobileHazard",      
      method: 'post',
      headers: {
        'Content-Type': 'application/json',        
      },
      meta: {        
        // 'X-Auth-Token': getToken(),
      },      
      data,
    })
  }

}

/**
 * 일렉 안전작업지시 데이터를 조회함. 원칙적으로 request API파일을 따로 분리할려고 했으나, 추후 일렉용으로 개발시 빼기로 함.
 * 사용안함. 서버에서 호출하는 것으로 변경함.
 */
 const elecMobileRequestOld = (data) => {
  console.log("data.year=" + data.year)
  let isProd = false
  var hostname = window.location.hostname
  console.log("hostname", hostname)
  if(hostname=="hises.hd.com"){  
    isProd = true
  }  
  let callUrl = ''
  if (isProd) {
    // 운영
    callUrl ="http://safety-work.hd-hyundaielectric.com/wsx01/interface/dashboard/hazard/assessment?year=2024&deptCode=WX50&halfYearType=1"
  } else {
    // 개발용
    // callUrl = "http://10.100.45.203:49567/wsx01/interface/dashboard/hazard/assessment?year=2024&deptCode=WX50&halfYearType=1"
    callUrl = "http://10.100.45.203:49567/wsx01/interface/dashboard/hazard/assessment?year=" + data.year + "&deptCode=" + data.deptCode + "&halfYearType=" + data.halfYearType
  }

  if (isUseAPI()) {
    return request({

      url: callUrl,      
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
      meta: {
        useErrorMessage: true,
        apiVersion: '1.0.0',
        'X-Auth-Token': getToken(),
      },      
    })
  }
}


// 현장위험성평가(1.차트 2.TOP3 위험유형)
const search07 = async () => {
  chartsOptions2.value.xAxis[0].data = [];
  chartsOptions2.value.series[0].data = [];
  chartsOptions2.value.series[1].data = [];
  chartsOptions2.value.series[2].data = [];

  const data = {
    queryId: "RSKAA0010_SEARCH_07",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      DEPT_CD: searchParams.DEPT_CD,
      YEAR: searchParams.YEAR,
    },
  };

  const meta = { useProgress: false };

  await commonRequest3("/hse/common/selectList", data, meta).then((res) => {
    // res.ORESULT_CUR1.forEach((el) => {
    //   let xAxis = el.MONTH + "월";

    //   chartsOptions2.value.xAxis[0].data.push(xAxis);
    //   chartsOptions2.value.series[0].data.push(el.SEPARATE_WORK);
    //   chartsOptions2.value.series[1].data.push(el.MAIN_WORK);
    //   chartsOptions2.value.series[2].data.push(el.RISK_CNT);
    // });

    // chart2.value.setOption(chartsOptions2);
    // chartRefresh02.value++;

    // TOP3 위험유형
    searchParams.TOP3 = res.ORESULT_CUR2;

    // 안전작업지시 및 작업자 평가현황
    search07_mobileSaftyWork() // 모바일 안전작업지시 데이터 조회

  });
};


// 작업표준 클릭 시 페이지 이동
const onMoveWorkStandard = (RISK_TYPE) => {
  let params = {
    COMPANY_CD: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    DEPT_CD: searchParams.DEPT_CD,
    PARTNER_CD: "",
    PROGRESS_STATUS: "1",
    RISK_TYPE: RISK_TYPE,
  };

  router.push({
    path: "/20_risk-assessment/RSK_B/RSKBA0020",
    state: { data: params },
  });
};

// 중요위험 클릭 시 페이지 이동
const onMoveCriticalRisk = () => {
  let params = {
    COMPANY_CD: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    DEPT_CD: searchParams.DEPT_CD,
    PARTNER_CD: "",
    YEAR: dayjs().get("year"),
    HALF: dayjs().get("month") < 7 ? "1" : "2",
  };

  router.push({
    path: "/20_risk-assessment/RSK_B/RSKBA0030",
    state: { data: params },
  });
};

// TODO: 차후 현업 요구 시 적용 예정

// // 부서 선택 팝업 오픈
const openDept = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    ASGN_NM: searchParams.DEPT_NM,
    HSE_SYS: "N",
  });
};

// // 부서 선택 후 적용
const onSelectDept = (val) => {
  searchParams.DEPT_CD = val.ASGN_CD;
  searchParams.DEPT_NM = val.ASGN_FULL_NM;

  searchParams.DEPT_HEAD_NM = "";
};

onMounted(() => {

  let token = getToken()
  console.log("token=" + token)

  // 안전경영부
  if (userStore.deptCd === "N090") {
    isAdmin.value = true;
  } else if (userStore.offiResCd.includes("10", "11", "14", "15", "62")) {
    // 임원급
    isAdmin.value = true;
  } else {
    isAdmin.value = false;
  }

  if (userStore.userId === "BP22733" || userStore.authGrpCd.includes('GRP00369')) {
    isAdmin.value = true;
  }

  searchData();
});
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
        <div class="searchArea d-flex">
          <div class="d-flex">
            <i-select
              v-model="searchParams.YEAR"
              :label="t('기준년도')"
              width="200px"
              type="YEAR"
            />
            <i-select
              v-model="searchParams.HALF"
              :label="t('반기')"
              width="200px"
              :items="codeList.HALF"
              item-value="COD"
              item-title="TXT"
            />
            <i-input
              v-model="searchParams.DEPT_NM"
              :label="t('부서')"
              width="350px"
              :append-inner-icon="isAdmin ? 'mdi-magnify' : ''"
              @click:appendInner="openDept"
              @keydown="
                (e) => {
                  if (e.keyCode == 13) openDept();
                }
              "
              :readonly="!isAdmin"
            />
          </div>
          <div style="display: flex; align-items: center;" v-if="searchParams.DEPT_HEAD_NM">
            <p>[부서장] {{ searchParams.DEPT_HEAD_NM }}</p>
          </div>
        </div>
        <div class="h-grow ma-0">
          <v-sheet width="50%" class="pa-0 h-auto mr-3">
            <IGridTitle ref="menuTitle" :title="$t('정기 위험성평가')" />
            <v-sheet class="border rounded-sm pa-3">
              <IGridTitle :title="$t('작업표준')">
                <template #editors />
              </IGridTitle>
              <!-- 1. 작업표준(작업표준, 평균위험성, 위험요인)은 결재완료된 건에 대해서만 집계하여 출력 -->
              <div class="searchArea d-flex pa-6 justify-space-around">
                <v-sheet
                  width="20%"
                  class="d-flex align-center justify-space-between"
                >
                  <p>작업표준</p>
                  <p>
                    <span
                      class="text-h5 hover-effect"
                      @click="onMoveWorkStandard('RISK_TYPE-01')"
                    >
                      {{ searchParams.WORK_STANDARD_CNT }}
                    </span>
                    건
                    <v-tooltip activator="parent" location="top">
                      클릭하면 작업표준/위험성평가 현황 화면으로 이동합니다.
                    </v-tooltip>
                  </p>
                </v-sheet>
                <v-sheet
                  width="20%"
                  class="d-flex align-center justify-space-between"
                >
                  <p>평균위험성</p>
                  <span
                    v-if="searchParams.WORK_STANDARD_CNT > 0"
                    class="text-red font-weight-bold"
                    >위험</span
                  >
                  <p>
                    <span class="text-h5">{{
                      searchParams.WORK_STANDARD_AVG_RISK
                        ? searchParams.WORK_STANDARD_AVG_RISK
                        : "0"
                    }}</span>
                  </p>
                </v-sheet>
                <v-sheet
                  width="20%"
                  class="d-flex align-center justify-space-between"
                >
                  <p>위험요인</p>
                  <p>
                    <span class="text-h5">{{
                      searchParams.RISK_CNT
                        ? Number(searchParams.RISK_CNT).toLocaleString()
                        : "0"
                    }}</span>
                  </p>
                  <!-- <p><span class="text-h5">{{ searchParams.RISK_CNT ? searchParams.RISK_CNT : '0' }}</span></p> -->
                </v-sheet>
              </div>

              <IGridTitle :title="$t('작업표준 결재 현황')">
                <template #editors />
              </IGridTitle>
              <div class="d-flex border rounded-sm">
                <v-sheet width="25%" class="border-e-sm pa-5 align-center">
                  <p>작성/평가중</p>
                  <v-sheet class="d-flex" width="100%">
                    <v-sheet width="50%" class="align-center">
                      <p class="mr-2">신규</p>
                      <p>
                        <span class="text-h4 text-indigo-accent-4">{{
                          searchParams.NEW_WRITTEN_EVALUATED
                            ? searchParams.NEW_WRITTEN_EVALUATED
                            : "0"
                        }}</span>
                        건
                      </p>
                    </v-sheet>
                    <v-divider
                      class="border-opacity-40"
                      :thickness="1"
                      vertical
                    />
                    <v-sheet width="50%" class="align-center">
                      <p class="mr-2">개정</p>
                      <p>
                        <span class="text-h4 text-indigo-accent-4">{{
                          searchParams.REV_WRITTEN_EVALUATED
                            ? searchParams.REV_WRITTEN_EVALUATED
                            : "0"
                        }}</span>
                        건
                      </p>
                    </v-sheet>
                  </v-sheet>
                </v-sheet>
                <v-sheet width="25%" class="border-e-sm pa-5 align-center">
                  <p>결재진행중</p>
                  <!-- <p class="mt-3"><span class="text-h4 text-indigo-accent-4">{{ searchParams.APPROVAL_PROGRESS ? searchParams.APPROVAL_PROGRESS : '0' }}</span> 건</p> -->
                  <v-sheet class="d-flex" width="100%">
                    <v-sheet width="50%" class="align-center">
                      <p class="mr-2">신규</p>
                      <p>
                        <span class="text-h4 text-indigo-accent-4">{{
                          searchParams.NEW_APPROVAL_PROGRESS ?? "0"
                        }}</span>
                        건
                      </p>
                    </v-sheet>
                    <v-divider
                      class="border-opacity-40"
                      :thickness="1"
                      vertical
                    />
                    <v-sheet width="50%" class="align-center">
                      <p class="mr-2">개정</p>
                      <p>
                        <span class="text-h4 text-indigo-accent-4">{{
                          searchParams.REV_APPROVAL_PROGRESS
                            ? searchParams.REV_APPROVAL_PROGRESS
                            : "0"
                        }}</span>
                        건
                      </p>
                    </v-sheet>
                  </v-sheet>
                </v-sheet>
                <v-sheet width="25%" class="border-e-sm pa-5 align-center">
                  <p>결재완료</p>
                  <!-- <p class="mt-3"><span class="text-h4 text-indigo-accent-4">{{ searchParams.APPROVED ? searchParams.APPROVED: '0' }}</span> 건</p> -->
                  <v-sheet class="d-flex" width="100%">
                    <v-sheet width="50%" class="align-center">
                      <p class="mr-2">신규</p>
                      <p>
                        <span class="text-h4 text-indigo-accent-4">{{
                          searchParams.NEW_APPROVED
                            ? searchParams.NEW_APPROVED
                            : "0"
                        }}</span>
                        건
                      </p>
                    </v-sheet>
                    <v-divider
                      class="border-opacity-40"
                      :thickness="1"
                      vertical
                    />
                    <v-sheet width="50%" class="align-center">
                      <p class="mr-2">개정</p>
                      <p>
                        <span class="text-h4 text-indigo-accent-4">{{
                          searchParams.REV_APPROVED
                            ? searchParams.REV_APPROVED
                            : "0"
                        }}</span>
                        건
                      </p>
                    </v-sheet>
                  </v-sheet>
                </v-sheet>
                <v-sheet width="25%" class="pa-5 align-center">
                  <p>폐지</p>
                  <p class="mt-3">
                    <span class="text-h4">{{
                      searchParams.ABOLITION ? searchParams.ABOLITION : "0"
                    }}</span>
                    건
                  </p>
                </v-sheet>
              </div>

              <IGridTitle :title="$t('중요 위험')" class="my-2">
                <template #editors />
              </IGridTitle>
              <div class="d-flex">
                <v-sheet width="100%" class="border rounded-sm">
                  <div class="d-flex border-b-sm">
                    <v-sheet
                      width="50%"
                      class="d-flex justify-space-between align-center border-e-sm pa-5"
                    >
                      <p>중요위험</p>
                      <p>
                        <span
                          class="text-h5 hover-effect"
                          @click="onMoveCriticalRisk"
                        >
                          {{ searchParams.ALL_IMP_RISK_CNT }}
                        </span>
                        건
                        <v-tooltip activator="parent" location="top">
                          클릭하면 중요위험 특별감소대책 화면으로 이동합니다.
                        </v-tooltip>
                      </p>
                    </v-sheet>
                    <v-sheet
                      width="50%"
                      class="d-flex justify-space-between align-center pa-5"
                    >
                      <p>개선조치 이행률</p>
                      <p>
                        <span class="text-h5 text-indigo-accent-4">{{
                          searchParams.COMPLETE_RATIO
                            ? searchParams.COMPLETE_RATIO
                            : "0"
                        }}</span>
                        %
                      </p>
                    </v-sheet>
                  </div>
                  <div class="d-flex">
                    <v-sheet
                      width="50%"
                      class="d-flex justify-space-between align-center border-e-sm pa-5"
                    >
                      <p>특별감소대책</p>
                      <p>
                        <span class="text-h5">{{
                          searchParams.ALL_SP_CNT
                            ? searchParams.ALL_SP_CNT
                            : "0"
                        }}</span>
                        건
                      </p>
                    </v-sheet>
                    <v-sheet
                      width="50%"
                      class="d-flex justify-space-between align-center pa-5"
                    >
                      <p>기간경과 감소대책</p>
                      <p>
                        <span class="text-h5 text-red">{{
                          searchParams.DELAY_CNT ? searchParams.DELAY_CNT : "0"
                        }}</span>
                        건
                      </p>
                    </v-sheet>
                  </div>
                </v-sheet>
                <!-- <v-sheet width="50%" class="pl-5">
                  <div class="d-flex align-center justify-space-between">
                    <v-sheet
                      width="50%"
                      class="fill-height searchArea align-content-center textCenter pa-3 mt-3"
                    >
                      <p>현재위험성(평균)</p>
                      <p>
                        <span class="text-h4">{{
                          searchParams.CURRENT_RISK
                            ? searchParams.CURRENT_RISK
                            : "0"
                        }}</span>
                      </p>
                      <p class="mt-3">
                        <span class="text-red">{{
                          searchParams.CURRENT_RISK ? "위험" : ""
                        }}</span>
                      </p>
                    </v-sheet>
                    <div class="align-center mx-5">〉</div>
                    <v-sheet
                      width="50%"
                      class="fill-height searchArea align-content-center textCenter pa-3 mt-3"
                    >
                      <p>개선후 위험성(평균)</p>
                      <p>
                        <span class="text-h4">{{
                          searchParams.AFTER_RISK
                            ? searchParams.AFTER_RISK
                            : "0"
                        }}</span>
                      </p>
                      <p class="mt-3">
                        <span class="text-indigo-accent-4 font-weight-bold">
                          {{
                            searchParams.AFTER_PERCENT
                              ? searchParams.AFTER_PERCENT.toString().includes(
                                  "-"
                                )
                                ? searchParams.AFTER_PERCENT.toString().substring(
                                    1
                                  ) + "%"
                                : searchParams.AFTER_PERCENT.toString() + "%"
                              : ""
                          }}
                        </span>
                        <span class="text-red font-weight-bold">
                          {{
                            searchParams.AFTER_PERCENT
                              ? searchParams.AFTER_PERCENT.toString().includes(
                                  "-"
                                )
                                ? "↑"
                                : "↓"
                              : " "
                          }}
                        </span>
                      </p>
                    </v-sheet>
                  </div>
                </v-sheet> -->
              </div>

              <div class="h-auto" :key="chartRefresh01">
                <IGridTitle
                  :title="$t('위험분류별 위험성평가 현황')"
                  class="mt-2 mb-0"
                >
                  <template #editors />
                </IGridTitle>
                <Echart
                  ref="chart1"
                  :option="chartsOptions1"
                  class="my-2 pa-0 echarts_style border rounded-sm"
                />
              </div>
            </v-sheet>
          </v-sheet>
          <v-sheet width="50%" class="pa-0 h-auto">
            <IGridTitle ref="menuTitle" :title="$t('수시 위험성평가')" />
            <div class="d-flex border rounded-sm justify-space-around">
              <!-- 분자(좌측)은 수시위험성평가(RISK_TYPE_02)에 대한 내용을 집계 
                  분모(우측)은 안전사고 즉보/보고서 관리(SAFAB0020PopUpTab2)에서 Hi-Standard 등록여부가 필요인 항목을 집계하여 출력
              -->
              <v-sheet width="25%" class="pa-4 align-center">
                <p>안전사고</p>
                <br />
                <p>
                  <span
                    class="text-h4 hover-effect"
                    @click="onMoveWorkStandard('RISK_TYPE-02')"
                  >
                    {{
                      searchParams.WORK_STANDARD_CNT2
                        ? searchParams.WORK_STANDARD_CNT2
                        : "0"
                    }}
                    /
                    {{
                      searchParams.SAFETY_ACC_CNT
                        ? searchParams.SAFETY_ACC_CNT
                        : "0"
                    }}
                  </span>
                  건
                  <v-tooltip activator="parent" location="top">
                    클릭하면 작업표준/위험성평가 현황 화면으로 이동합니다.
                  </v-tooltip>
                </p>
                <p>위험성평가 안전사고</p>
              </v-sheet>
              <v-sheet width="25%" class="pa-4 align-center">
                <p>공정변경</p>
                <br />
                <p>
                  <span class="ma-2 text-h4 text-red">{{
                    searchParams.PROCESS_WORK_CNT
                      ? searchParams.PROCESS_WORK_CNT
                      : "0"
                  }}</span>
                  건
                </p>
                <p><span class="ma-3">전체위험</span></p>
              </v-sheet>
              <v-sheet width="25%" class="pa-4 align-center">
                <p>물질변경</p>
                <br />
                <p>
                  <span class="ma-2 text-h4 text-red">{{
                    searchParams.MAT_WORK_CNT
                      ? searchParams.MAT_WORK_CNT
                      : "0"
                  }}</span>
                  건
                </p>
                <p><span class="ma-3">전체위험</span></p>
              </v-sheet>
              <v-sheet width="25%" class="pa-4 align-center">
                <p>비일상 작업</p>
                <br />
                <p>
                  <span class="ma-2 text-h4 text-red">{{
                    searchParams.NROUTINE_WORK_CNT
                      ? searchParams.NROUTINE_WORK_CNT
                      : "0"
                  }}</span>
                  건
                </p>
                <p><span class="ma-3">전체위험</span></p>
              </v-sheet>
            </div>

            <!-- 
              현장위험성평가는 조회조건(반기) 상관없이 선택한 기준년도에 대해서만 조회
            -->
            <div class="h-auto" :key="chartRefresh02">
              <IGridTitle :title="$t('현장 위험성 평가')" class="mt-2">
                <template #editors />
              </IGridTitle>
              <v-sheet width="100%" height="563px" class="border rounded-sm">
                <v-sheet width="100%" height="55%" class="pa-3">
                  <IGridTitle :title="$t('안전작업지시 및 작업자 평가 현황')">
                    <template #editors />
                  </IGridTitle>
                  <Echart
                    ref="chart2"
                    :option="chartsOptions2"
                    class="pa-0 border rounded-sm"
                    height="100%"
                  />
                </v-sheet>
                <v-sheet width="100%" height="45%" class="pa-3">
                  <IGridTitle :title="$t('TOP3 위험유형')">
                    <template #editors />
                  </IGridTitle>
                  <v-sheet
                    v-if="searchParams.TOP3.length !== 0"
                    height="100%"
                    class="d-flex justify-space-around align-center border rounded-sm"
                  >
                    <div
                      v-for="(item, index) in searchParams.TOP3"
                      :key="index"
                    >
                      <v-sheet width="100%">
                        <v-sheet height="25%" class="pa-3 align-center d-flex">
                          <div>
                            <v-icon
                              :icon="
                                'mdi-numeric-' + (index + 1) + '-box-outline'
                              "
                              size="x-large"
                              color="#000000"
                            />
                          </div>
                          <div class="ml-2 text-center">
                            <p class="text-h6">
                              {{ item.TXT }} ({{ item.PERCENTAGE }}%)
                            </p>
                          </div>
                        </v-sheet>
                      </v-sheet>
                    </div>
                  </v-sheet>
                  <v-sheet
                    v-else
                    height="100%"
                    class="d-flex justify-center align-center border rounded-sm"
                  >
                    <span class="text-h6 text-grey">No Data</span>
                  </v-sheet>
                </v-sheet>
              </v-sheet>
            </div>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- 부서 선택 -->
  <DeptPopup ref="deptPopup" @selected="onSelectDept" />
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
.echarts_style {
  height: 180px;
  width: 100%;
}

.textCenter {
  text-align: center;
}

.hover-effect:hover {
  color: #e0e0e0;
  cursor: grab;
  transition: 1s;
}
</style>
