<!-- 
  화면명 : 감염병 발생 통계
  작성자: 일주지앤에스 SI1팀 박재형 선임
-->
<script setup>
import { reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import { forEach } from 'lodash-es'
import dayjs from "dayjs"
import _ from 'lodash'
defineOptions({
  name: '100_health-HLT_L-HLTLA0040',
})
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { getJsonFromExcel } from "@/utils/excel"
import { useCommonStore } from '@hiway/stores/common'
import { isEmpty } from '@/@core/utils'
import Echart from 'vue-echarts'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const menuTitle2 = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const logsStore = useLogsStore()
const fileUploadPopup = ref(null)
const Popup = ref(null)
const Popup2 = ref(null)
const saveParams = reactive([]);
let selectedRow = ref([]);
let selectedRow2 = ref([]);
let fileCheck = null;
const commonStore = useCommonStore()
const isAdmin = ref(false)
const isAdmin2 = ref(false)
const tab = ref("tab1")
const chart1 = ref(null)
const sweek = ref(null)
const eweek = ref(null)
// const smonth = ref(null)
// const emonth = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  INFEC_NM: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  TARGET_TYPE: '',
  DATE_TYPE: '',
  DATE_FROM: "",
  DATE_TO: "",
  START_WEEK: '',
  END_WEEK: '',
  START_MONTH: '',
  END_MONTH: '',
  YEAR: dayjs(new Date()).format('YYYY'),
})

const searchParam1 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  INFEC_NM: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  DATE_TYPE: '',
  DATE_FROM: "",
  DATE_TO: "",
  START_WEEK: '',
  END_WEEK: '',
  START_MONTH: '',
  END_MONTH: '',
  YEAR: dayjs(new Date()).format('YYYY'),
})


const codeList = reactive({ 
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  INFEC_NM: [],
  DATE_TYPE: [
    { COD: 'D', TXT: '일별' },
    { COD: 'W', TXT: '주별' },
    { COD: 'M', TXT: '월별' },
  ],
  TARGET_TYPE: [
    { COD: 'A', TXT: '확진자' },
    { COD: 'B', TXT: '접촉자' },
    { COD: 'C', TXT: '격리자' },
  ]
})

const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' },
    }),
    commonSearchApi({
      queryId: 'HLTLA0040_SEARCH_01',
      param: { },
    }),
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, DEPT_CD: searchParam.DEPT_CD, USE_DIV: 'Y' }
    }), // 협력사
  ]).then((res) => {

    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR

    // 감염병 종류 중복제거
    codeList.INFEC_NM = res[2].ORESULT_CUR

    codeList.ASGN_CD = res[3].ORESULT_CUR

    // 전체 추가
    codeList.INFEC_NM.unshift({ TXT: '전체', COD: '' })

    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    searchParam.INFEC_NM = '전체'
    searchParam.DATE_TYPE = 'D'
    searchParam1.INFEC_NM = '전체'
    searchParam1.DATE_TYPE = 'D'
    searchParam.TARGET_TYPE = 'A'

    // 감염병관리 모듈 관리자, 보건 총괄관리자, admin그룹
    if (userStore.authGrpCd.includes('HLTL001') 
    || userStore.authGrpCd.includes('HIWAYGRP00001') 
    || userStore.authGrpCd.includes('GRP00372')
    ) {
      isAdmin.value = true // 관리자
      isAdmin2.value = false;
    } else if (userStore.authGrpCd.includes('HLTL002')) {
      isAdmin.value = false
      isAdmin2.value = true // 부서관리자
    } else {
      isAdmin.value = false // 일반 사용자
      isAdmin2.value = false;
    }

    if(!isAdmin.value && !isAdmin2.value) {
      menuTitle.value.setBtnProperty('btnSearch', 'visible', false);
      vm.$swal({
        title: t(`부서관리자가 아닙니다.\n안전보건지원부 담당자에게 문의하십시오.`),
        showCancelButton: false,
      });
      return false
    }

    if (!isAdmin.value && isAdmin2.value) {
      searchParam.BSNS_CD = userStore.bsnsCd;
      searchParam.DEPT_CD = userStore.deptCd;
      searchParam.ASGN_CD = userStore.orgnDiv == 'B' ? userStore.asgnCd || '' : '';
      searchParam1.BSNS_CD = userStore.bsnsCd;
      searchParam1.DEPT_CD = userStore.deptCd;
      searchParam1.ASGN_CD = userStore.orgnDiv == 'B' ? userStore.asgnCd || '' : '';
      
    }

    onButtonsClick1({ id: 'btnSearch' })
  })
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setBefore(searchBefore).setQuery(searchData).setAfter(afterSearch).run()
  }
}
const onButtonsClick1 = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setBefore(searchBefore1).setQuery(searchData1).setAfter(afterSearch1).run()
  }
}

const searchBefore = () => {
  // if (searchParam.BSNS_CD && !searchParam.DEPT_CD) {   
  //     return Message.warn('부서를 선택해주세요.')
  // }

  if (searchParam.DATE_TYPE === 'W') {
    if (!searchParam.START_WEEK && !searchParam.END_WEEK) {
      Message.warn('기간을 선택해주세요.')
      return;
    }
    sweek.value = searchParam.START_WEEK
    eweek.value = searchParam.END_WEEK
    searchParam.START_WEEK = String(searchParam.START_WEEK ?? '')
      .replace(/[^0-9]/g, '')
      .padStart(2, '0');
    searchParam.END_WEEK = String(searchParam.END_WEEK ?? '')
      .replace(/[^0-9]/g, '')
      .padStart(2, '0');
  }

  if (searchParam.DATE_TYPE === 'M') {
    if (!searchParam.START_MONTH && !searchParam.END_MONTH) {
      Message.warn('기간을 선택해주세요.')
      return;
    }
    sweek.value = searchParam.START_MONTH
    eweek.value = searchParam.END_MONTH
    searchParam.START_MONTH = String(searchParam.START_MONTH ?? '')
      .replace(/[^0-9]/g, '')
      .padStart(2, '0');
    searchParam.END_MONTH = String(searchParam.END_MONTH ?? '')
      .replace(/[^0-9]/g, '')
      .padStart(2, '0');
  }

  return true
}


const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTLA0040_SEARCH_02',
    param: searchParam,
  })
}
const afterSearch = (res) => { 

  if (searchParam.DATE_TYPE === 'W') {
    searchParam.START_WEEK = sweek.value
    searchParam.END_WEEK = eweek.value
  }

  if (searchParam.DATE_TYPE === 'M') {
    searchParam.START_MONTH = sweek.value
    searchParam.END_MONTH = eweek.value
  }

  updateChartOptions1(res.ORESULT_CUR)
  chartsOptions1.value.resize()
}

const searchBefore1 = () => {
  // debugger
  // 사업부만 선택했을 때
  // if (searchParam1.BSNS_CD && !searchParam1.DEPT_CD) {
  //   Message.warn(t('부서를 선택해주세요.'))
  //   return false
  // }

  if (searchParam1.DATE_TYPE === 'W') {
  if (!searchParam1.START_WEEK || !searchParam1.END_WEEK) {
    Message.warn(t('기간을 선택해주세요.'))
    // vm.$swal({ title: t('기간을 선택해주세요.'), showCancelButton: false });
    return false
  }
} else if (searchParam1.DATE_TYPE === 'M') {
  if (!searchParam1.START_MONTH || !searchParam1.END_MONTH) {
    Message.warn(t('기간을 선택해주세요.'))
    // vm.$swal({ title: t('주차를 선택해주세요.'), showCancelButton: false });
    return false
  }
}
  
  return true
}


const searchData1 = () => {

  return commonSearchApi({
    queryId: 'HLTLA0040_SEARCH_03',
    param: searchParam1,
  })
}
const afterSearch1 = (res) => { 
  
  const dateLabel = res.DATE_TYPE === 'W'
    ? '전주'
    : res.DATE_TYPE === 'M'
    ? '전월'
    : '전일';

  const categoryList = [
    { label: '확진자 수', key: 'CNT' },
    { label: '일평균 확진자', key: 'AVG_CNT' },
    { label: `${dateLabel} 대비 확진자 발생 증가비`, key: 'INCREASE_RATIO' },
    { label: '검사자 수', key: 'INSPECT_CNT' },
    { label: '격리자 수', key: 'QUAR_CNT' },
  ];
  const rawData = res.ORESULT_CUR;
  const cnfmDates = [...new Set(rawData.map(item => item.CNFM_DATE))];
  
  // 3. 행 생성 (카테고리 기준)
  const rows = categoryList.map(cat => {
    const row = { CATEGORY: cat.label };
    rawData.forEach(item => {
      row[`COL_${item.CNFM_DATE}`] = item[cat.key];
    });
    row._DATA_KEY = cat.key; // key 정보도 저장
    return row;
  });

  // 4. 컬럼 정의
  const columns = [
    { fieldName: 'CATEGORY', header: { text: '구분' }, width: 180 },
    ...cnfmDates.map(date => {
      let label = date;
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(date); // YYYY-MM-DD
      if (!isDate) {
        const numeric = String(Number(date)); // 01 → 1
        if (res.DATE_TYPE === 'W') {
          label = `${numeric}주차`;
        } else if (res.DATE_TYPE === 'M') {
          label = `${numeric}월`;
        }
      } 
      // else {
      //   label = `${date}일`;
      // }
      return {
        fieldName: `COL_${date}`,
        header: { text: label },
        width: 80,
        dataType: 'text',
        // dataType: 'number',
        numberFormat: '#,##0.##',
      };
    })
    // ...cnfmDates.map(date => ({
    //   fieldName: `COL_${date}`,
    //   header: { text: date },
    //   width: 100,
    //   dataType: 'number',
    //   numberFormat: '#,##0.##'
    // }))
  ];

  // 5. RealGrid 바인딩
  grdMain.value.getDataProvider().setFields(columns);
  grdMain.value.getDataProvider().setRows(rows);
  grdMain.value.getGridView().setColumns(columns);

  // 컬럼 고정
  grdMain.value.getGridView().setFixedOptions({
    colCount: 1,
  })
  
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  keys : [], 
  fields: [
  {
    fieldName: 'CATEGORY',
    dataType: 'text',
    width: '160',
    header: { text: '구분' },
    editable: false,
  },
  ],
  columns : [],
  columnLayout: []
})
grdMainProps.columns = grdMainProps.fields


onMounted(() => {
  // grdMain.value.getGridView().filterPanel.visible = true;
  initCodeList()

  // 기간입력
  const today = dayjs().format('YYYY-MM-DD');
  // 한 달 전 날짜
  const monthAgo = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

  searchParam.DATE_FROM = monthAgo;
  searchParam.DATE_TO = today;
  searchParam1.DATE_FROM = monthAgo;
  searchParam1.DATE_TO = today;

})
const weekList = Array.from({ length: 52 }, (_, i) => ({
label: `${i + 1}주차`, value: i + 1
}))
const weekList1 = Array.from({ length: 52 }, (_, i) => ({
label: `${i + 1}주차`, value: i + 1
}))

const monthList = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1}월`, value: i + 1
}))
const monthList1 = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1}월`, value: i + 1
}))

//사업부 변경시 부서 조회
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

      // 부서관리자인 경우엔 본인 부서
      if (!isAdmin.value && isAdmin2.value) {
        // searchParam.DEPT_CD = 'C620'
        searchParam.DEPT_CD = userStore.deptCd;
      }
    })
  }
)

//사업부 변경시 부서 조회
watch(
  () => searchParam1.BSNS_CD,
  (newValue, oldValue) => {
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam1.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

      // 부서관리자인 경우엔 본인 부서
      if (!isAdmin.value && isAdmin2.value) {
        // searchParam1.DEPT_CD = 'C620'
        searchParam1.DEPT_CD = userStore.deptCd;
      }
    })
  }
)

//부서 변경시 협력사 조회
watch(
  () => searchParam1.DEPT_CD,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchVend',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParam1.BSNS_CD,
        DEPT_CD: newValue,
        USE_DIV: 'Y'
      }
    }).then((res) => {
      searchParam1.ASGN_CD = ''
      codeList.ASGN_CD = res.ORESULT_CUR
      codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    })
  }
)
  
//탭2 선택
// watch(tab, (newTab) => {
//   if (newTab === "tab2") {
//     nextTick(() => {
//     if (!isAdmin.value && !isAdmin2.value) {
//       menuTitle2.value.setBtnProperty('btnSearch', 'visible', false);
//     } else {
//       new queryFlowHelper(vm, t).setBefore(searchBefore).setQuery(searchData).setAfter(afterSearch).run()
//     }

//     // 부서관리자인 경우엔 본인 부서
//     if (!isAdmin.value && isAdmin2.value) {
//         // searchParam1.BSNS_CD = 'AC00'
//         // searchParam1.DEPT_CD = 'C620'
//         searchParam1.BSNS_CD = userStore.bsnsCd;
//         searchParam1.DEPT_CD = userStore.deptCd;
//       }
//   })
//   }
// });

watch(tab, async (newTab) => {
  if (newTab === "tab2") {
    await nextTick(() => {
      if (!isAdmin.value && !isAdmin2.value) {
        menuTitle2.value.setBtnProperty("btnSearch", "visible", false);
      } else {
        new queryFlowHelper(vm, t)
          .setBefore(searchBefore)
          .setQuery(searchData)
          .setAfter(afterSearch)
          .run();
      }

      // 부서관리자인 경우엔 본인 부서
      if (!isAdmin.value && isAdmin2.value) {
        searchParam1.BSNS_CD = userStore.bsnsCd;
        searchParam1.DEPT_CD = userStore.deptCd;
      }
    });

    // 탭 위치 변경후 차트 깨져서 추가함 250901 손상규
    if (chart1.value) {
      chart1.value.resize();
    } else {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    }
  }
});

//ECHART
const chartsOptions1 = ref({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: [] // ['확진자 수'] ← 바인딩 시에 채워짐
  },
  grid: {
    left: '10%',
    right: '10%',
    bottom: '10%',
  },
  xAxis: {
    type: 'category',
    name: '확진일',
    data: [],
    axisLabel: {
      rotate: 25,
      interval: 0
    }
  },
  yAxis: {
    type: 'value',
    name: '단위 : (명)'
  },
  series: []
});
function updateChartOptions1(data) {

  chartsOptions1.value.legend.data = [];
  chartsOptions1.value.xAxis.data = [];
  chartsOptions1.value.series = [];  
  // 1. 날짜 추출 및 정렬 (x축 기준)
//   chartsOptions1.value.xAxis.data = data.map(item => item.CNFM_DATE)
//   // const dateList = [...new Set(data.map(item => item.CNFM_DATE))].sort();

//   // 2. 감염병 목록 추출
//   chartsOptions1.value.legend.data = [...new Set(data
//     .map(item => item.INFEC_NM)
//     .filter(name => name !== null && name !== undefined)
// )];

  // 1. x축 날짜 리스트 추출 및 정렬
  const xList = [...new Set(data.map(item => item.CNFM_DATE))].sort();

  // 2. 감염병명 중복 제거 (null/undefined 방지)
  const legendList = [...new Set(
    data
      .map(item => item.INFEC_NM)
      .filter(name => !!name) // null, undefined 제거
  )];

  // 4. ECharts 바인딩
  chartsOptions1.value.legend.data = legendList;
  chartsOptions1.value.xAxis.data = xList;

  // 3. 시리즈 데이터 구성
  const seriesList = legendList.map(name => ({
    name: codeList.INFEC_NM.find(item => item.COD == name).TXT,
    type: 'line',
    data: xList.map(date => {
      const match = data.find(d => d.CNFM_DATE === date && d.INFEC_NM === name);
      return match ? match.CNT : 0;
    }),
    label: {
      show: true,
      position: 'top'
    }
  }));
  chartsOptions1.value.series = seriesList;


  chartsOptions1.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: legendList.name },
    xAxis: {
      type: 'category',
      name: '확진일',
      data: xList,
      axisLabel: { rotate: 25, interval: 0 }
    },
    yAxis: {
      type: 'value',
      name: '단위 : (명)'
    },
    series: seriesList
  };

}
// function updateChartOptions1(data) {
//   chartsOptions1.value.legend.data = ['확진자 수'];

//   chartsOptions1.value.xAxis.data = data.map(item => item.CNFM_DATE);

//   chartsOptions1.value.series = [
//     {
//       name: '확진자 수',
//       type: 'line',
//       // type: 'bar',
//       data: data.map(item => item.CNT),
//       label: {
//         show: true,
//         position: 'top'
//       }
//     }
//   ];
// }

  // myChart.setOption(option);


</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-sheet class="pa-0">
      <v-tabs v-model="tab">
        <v-tab value="tab1">감염병 종합현황</v-tab>
        <v-tab value="tab2">기간별 발생 추이</v-tab>
      </v-tabs>
    </v-sheet>
    
    <v-window v-model="tab" class="h-window">
      <!-- 탭2 -->
      <v-window-item value="tab1">
        <v-sheet class="pa-0 pa-3">
          <IGridTitle
            ref="menuTitle2"
            :button-list="['btnSearch']"
            @click-button="onButtonsClick1"
            :use-permission="true"
          />
          <v-card-text class="pa-3 pt-0 content-area">
            <div class="d-flex flex-column fill-height">
              <v-sheet class="searchArea">
                <div class="d-flex">
                  <i-select
                    :label="$t('사업부')"
                    :items="codeList.BSNS_CD"
                    item-title="BSNS_NM"
                    item-value="BSNS_CD"
                    width="270px"
                    margin="10px"
                    v-model="searchParam1.BSNS_CD"
                    :disabled="!isAdmin"
                    :readonly="!isAdmin && isEmpty(searchParam1.BSNS_CD)"
                    ></i-select>
                    <i-select
                    :label="$t('부서')"
                    :items="codeList.DEPT_CD"
                    item-title="DEPT_NM"
                    item-value="DEPT_CD"
                    width="270px"
                    margin="10px"
                    v-model="searchParam1.DEPT_CD"
                    :disabled="!isAdmin"
                    :readonly="isEmpty(searchParam1.BSNS_CD)"
                  ></i-select>

                  <i-select
                    :label="$t('협력사')"
                    width="270px"
                    margin="10px"
                    placeholder="협력사"
                    v-model="searchParam1.ASGN_CD"
                    :items="codeList.ASGN_CD"
                    item-value="ASGN_CD"
                    item-title="ASGN_NM"
                    :disabled="!isAdmin"
                    :readonly="isEmpty(searchParam1.DEPT_CD)"
                  />
                </div>
                <div class="d-flex mt-1" />
                <div class="d-flex mt-1">
                  <i-select
                    :label="$t('감염병 전체')"
                    :items="codeList.INFEC_NM"
                    item-title="TXT"
                    item-value="COD"
                    width="300px"
                    margin="10px"
                    v-model="searchParam1.INFEC_NM"
                    :disabled="!isAdmin && !isAdmin2"
                  ></i-select>
                  <!-- 일별, 주별, 월별 -->
                  <i-select
                    :label="$t('기간유형')"
                    :items="codeList.DATE_TYPE"
                    item-title="TXT"
                    item-value="COD"
                    width="200px"
                    label-width="50px"
                    v-model="searchParam1.DATE_TYPE"
                    :disabled="!isAdmin && !isAdmin2"
                  ></i-select>

                  <!-- 기간 선택 -->
                  <div v-if="searchParam1.DATE_TYPE === 'D'" class="d-flex">
                    <i-input
                      :label="$t('기간입력')"
                      type="date"
                      width="200px"
                      v-model="searchParam1.DATE_FROM"
                      :disabled="!isAdmin && !isAdmin2"
                    >
                    </i-input>
                    <span class="mt-2">~</span>
                    <i-input
                      class="ml-3"
                      type="date"
                      width="160px"
                      v-model="searchParam1.DATE_TO"
                      :disabled="!isAdmin && !isAdmin2"
                    >
                    </i-input>
                  </div>

                  <!-- 주별: 주차 콤보박스 -->
                  <div v-else-if="searchParam1.DATE_TYPE === 'W'" class="d-flex">
                    <i-select
                      :label="$t('년도')"  
                      v-model="searchParam1.YEAR"
                      width="200px"
                      type="YEAR"
                      margin="10px"
                    />
                    <i-select
                      :label="$t('기간입력')"
                      :items="weekList1"
                      item-title="label"
                      item-value="value"
                      width="200px"
                      v-model="searchParam1.START_WEEK"
                    />
                    <span class="mt-2">~</span>
                    <i-select
                      class="ml-3"
                      :items="weekList1"
                      item-title="label"
                      item-value="value"
                      width="160px"
                      v-model="searchParam1.END_WEEK"
                    />
                  </div>

                  <!-- 월별: 월 콤보박스 -->
                  <div v-else-if="searchParam1.DATE_TYPE === 'M'" class="d-flex">
                    <i-select
                      :label="$t('년도')"  
                      v-model="searchParam1.YEAR"
                      width="200px"
                      type="YEAR"
                      margin="10px"
                    />
                    <i-select
                      :label="$t('기간입력')"
                      :items="monthList1"
                      item-title="label"
                      item-value="value"
                      width="200px"
                      v-model="searchParam1.START_MONTH"
                    />
                    <span class="mt-2">~</span>
                    <i-select
                      class="ml-3"
                      :items="monthList1"
                      item-title="label"
                      item-value="value"
                      width="160px"
                      v-model="searchParam1.END_MONTH"
                    />
                  </div>
                </div>
             </v-sheet>
             <!-- 스크롤바 --> 
             <div style="width: 100%; height: 220px; overflow: auto;">
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                />
              </div>
            </div>
         </v-card-text>
        </v-sheet>
      </v-window-item>
      <v-window-item value="tab2">
        <v-sheet class="pa-0 pa-3">
          <IGridTitle
            ref="menuTitle"
            :button-list="['btnSearch']"
            @click-button="onButtonsClick"
            :use-permission="true"
          />
          <v-card-text class="pa-3 pt-0 content-area">
            <div class="d-flex flex-column fill-height">
              <v-sheet class="searchArea">
                <div class="d-flex">
                  <i-select
                    :label="$t('사업부')"
                    :items="codeList.BSNS_CD"
                    item-title="BSNS_NM"
                    item-value="BSNS_CD"
                    width="270px"
                    margin="10px"
                    v-model="searchParam.BSNS_CD"
                    :disabled="!isAdmin"
                    :readonly="!isAdmin && isEmpty(searchParam.BSNS_CD)"
                  ></i-select>
                  <i-select
                    :label="$t('부서')"
                    :items="codeList.DEPT_CD"
                    item-title="DEPT_NM"
                    item-value="DEPT_CD"
                    width="270px"
                    margin="10px"
                    v-model="searchParam.DEPT_CD"
                    :readonly="isEmpty(searchParam.BSNS_CD)"
                    :disabled="!isAdmin"
                  ></i-select>
                  <i-select
                    :label="$t('협력사')"
                    width="270px"
                    margin="10px"
                    placeholder="협력사"
                    v-model="searchParam.ASGN_CD"
                    :items="codeList.ASGN_CD"
                    item-value="ASGN_CD"
                    item-title="ASGN_NM"
                    :disabled="!isAdmin"
                    :readonly="isEmpty(searchParam.DEPT_CD)"
                  />
                </div>
                <div class="d-flex mt-1" />
                <div class="d-flex mt-1">
                  <i-select
                    :label="$t('감염병 전체')"
                    :items="codeList.INFEC_NM"
                    item-title="TXT"
                    item-value="COD"
                    width="300px"
                    margin="10px"
                    v-model="searchParam.INFEC_NM"
                    :disabled="!isAdmin && !isAdmin2"
                  ></i-select>
                  <!-- 일별, 주별, 월별 -->
                  <i-select
                    :label="$t('기간유형')"
                    :items="codeList.DATE_TYPE"
                    item-title="TXT"
                    item-value="COD"
                    width="200px"
                    label-width="50px"
                    v-model="searchParam.DATE_TYPE"
                    :disabled="!isAdmin && !isAdmin2"
                  ></i-select>

                  <!-- 기간 선택 -->
                  <div v-if="searchParam.DATE_TYPE === 'D'" class="d-flex">
                    <i-input
                      :label="$t('기간입력')"
                      type="date"
                      width="200px"
                      v-model="searchParam.DATE_FROM"
                      :disabled="!isAdmin && !isAdmin2"
                    >
                    </i-input>
                    <span class="mt-2">~</span>
                    <i-input
                      class="ml-3"
                      type="date"
                      width="160px"
                      v-model="searchParam.DATE_TO"
                      :disabled="!isAdmin && !isAdmin2"
                    >
                    </i-input>
                  </div>

                  <!-- 주별: 주차 콤보박스 -->
                  <div v-else-if="searchParam.DATE_TYPE === 'W'" class="d-flex">
                    <i-select
                      :label="$t('년도')"  
                      v-model="searchParam.YEAR"
                      width="200px"
                      type="YEAR"
                      margin="10px"
                    />
                    <i-select
                      :label="$t('기간입력')"
                      :items="weekList"
                      item-title="label"
                      item-value="value"
                      width="200px"
                      v-model="searchParam.START_WEEK"
                    />
                    <span class="mt-2">~</span>
                    <i-select
                      class="ml-3"
                      :items="weekList"
                      item-title="label"
                      item-value="value"
                      width="160px"
                      v-model="searchParam.END_WEEK"
                    />
                  </div>

                  <!-- 월별: 월 콤보박스 -->
                  <div v-else-if="searchParam.DATE_TYPE === 'M'" class="d-flex">
                    <i-select
                      :label="$t('년도')"  
                      v-model="searchParam.YEAR"
                      width="200px"
                      type="YEAR"
                      margin="10px"
                    />
                    <i-select
                      :label="$t('기간입력')"
                      :items="monthList"
                      item-title="label"
                      item-value="value"
                      width="200px"
                      v-model="searchParam.START_MONTH"
                    />
                    <span class="mt-2">~</span>
                    <i-select
                      class="ml-3"
                      :items="monthList"
                      item-title="label"
                      item-value="value"
                      width="160px"
                      v-model="searchParam.END_MONTH"
                    />
                  </div>

                  <i-select
                    :label="$t('대상 구분')"
                    :items="codeList.TARGET_TYPE"
                    item-title="TXT"
                    item-value="COD"
                    width="200px"
                    label-width="70px"
                    v-model="searchParam.TARGET_TYPE" 
                    :disabled="!isAdmin && !isAdmin2"
                  ></i-select>
                </div>
             </v-sheet>
             <div class="d-flex flex-column justify-center align-center mt-3">
              <v-sheet width="90%" height="500px">
                <Echart
                  ref="chart1" 
                  :option="chartsOptions1"
                  class="pa-0 border rounded-sm echarts_style fill-height"
                />
                <!-- <p>단위 : (명)</p> -->
              </v-sheet>
             </div>
            </div>
         </v-card-text>
        </v-sheet>
      </v-window-item>
    </v-window>
    
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
    min-height: 400px;
  }
}
</style>
