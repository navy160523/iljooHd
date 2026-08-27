 <!-- SAFIA0010 협력사 안전관리 DashBoard -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"

const quarterList = ref({
  id: "ALL",
  list: [{ id: "ALL", text: "전체" }],
})

const cards = ref([
  { name: "전체", score: "97" },
  { name: "조선해양", score: "97" },
  { name: "특수선", score: "97" },
  { name: "엔진기계", score: "97" },
])

const chartsOptions = ref({
  series: [
    {
      type: "gauge",
      center: ["50%", "52%"],

      // 게이지 크기, 컬러
      axisLine: {
        lineStyle: {
          width: 30,
          color: [
            [0.1, "#FF5252"],
            [0.2, "#FF7637"],
            [0.3, "#FF983B"],
            [0.4, "#FEBF32"],
            [0.5, "#94C81B"],
            [0.6, "#0BB69C"],
            [0.7, "#08B9C8"],
            [0.8, "#16C3F4"],
            [0.9, "#0581FD"],
            [1, "#1A40C7"],
          ],
        },
      },

      // 게이지 화살표
      pointer: {
        icon: "path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z",
        width: 11,
        itemStyle: {
          color: "#4A4D56",
        },
      },

      // 게이지 바깥 원
      axisTick: {
        distance: -45,
        length: 5,
        lineStyle: {
          color: "#f3f3f3",
          width: 24,
        },
      },

      // 게이지 사이 간격
      splitLine: {
        distance: -30,
        length: 30,
        lineStyle: {
          color: "#fff",
          width: 2,
        },
      },

      // 게이지 숫자
      axisLabel: {
        color: "inherit",
        distance: 40,
        fontSize: 14,
      },

      // data:name
      title: {
        color: "inherit",
        fontSize: 20,
        fontWeight: "bold",
        fontFamily: "Pretendard",
      },

      // data:value
      detail: {
        valueAnimation: true,
        formatter: "{value}",
        color: "#4A4D56",
        fontSize: 14,
        fontWeight: "normal",
        fontFamily: "Pretendard",
      },

      // data 예시
      data: [
        {
          value: 83,
          name: "주의",
          fontFamily: "Pretendard",
        },
      ],
    },
  ],
})

const chartsOptions1 = ref({
  radar: {
    indicator: [
      { name: "안전리더십", max: 40, value: 38 },
      { name: "안전시스템", max: 20, value: 20 },
      { name: "현장안전관리", max: 40, value: 40 },
      { name: "보건", max: 10, value: 5 },
      { name: "안전문화", max: 20, value: 15 },
    ],
    axisName: {
      color: "#051537",
      fontFamily: "Pretendard",
      fontSize: 14,
      formatter: (value, param) => {
        return `{default|${value}\n} {${param.value == param.max ? 'max' : 'normal' }|${param.value}/${param.max}}`
      },
      rich: {
        default: {
          align: 'center',
          lineHeight: 16.71,
        },
        normal: {
          align: 'center',
          padding: [6, 0, 0, 0],
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 19.09,
        },
        max: {
          color: '#FF5252',
          align: 'center',
          padding: [6, 0, 0, 0],
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 19.09,
        },
      },
    },
    center: ["50%", "52%"],
  },
  series: [
    {
      type: "radar",
      label: {
        show: true,
        position: "bottom",
      },
      data: [
        {
          value: [38, 20, 40, 5, 15],
          areaStyle: {
            color: "rgba(26, 64, 199, 0.10)",
          },
          symbol: "none",
        },
      ],
    },
  ],
})
</script>

<template>
  <div class="pa-0 SAFIA0010_dashboard d-flex flex-column fill-height">
    <v-sheet 
      ref="searchArea" 
      class="searchArea d-flex"
    >
      <i-input
        :label="$t('년도')"
        label-width="50px"
        required
        type="Number"
        width="180px"
      />
      <i-select
        v-model="quarterList.id"
        :label="$t('분기')"
        label-width="50px"
        required
        width="180px"
        :items="quarterList.list"
        item-value="id"
        item-title="text"
      />
    </v-sheet>
    <!-- /조회조건 -->
    <v-sheet class="dashboard-contents">
      <div class="d-flex">
        <v-hover 
          v-for="(item, i) in cards" 
          :key="i"
        >
          <template v-slot:default="{ isHovering, props }">
            <v-spacer 
              v-if="i !== 0" 
              style="width: 16px;"
            />
            <VCard
              hover
              v-bind="props"
              :color="isHovering ? 'primary' : 'inputDisabled'"
              :elevation="isHovering ? '3' : '0'"
              variant="outlined"
              height="116"
              width="25%"
              class="scoreCard pY-20 pX-24 f-16 w-400 d-flex flex-column justify-space-between"
              :class="isHovering ? 'cardHover' : ''"
            >
              <p class="text-left">
                {{ item.name }}
              </p>
              <v-spacer />
              <p class="f-40 w-700 text-right">
                {{ item.score }} <span class="f-16 w-400">점</span>
              </p>
            </VCard>
          </template>
        </v-hover>
      </div>
    </v-sheet>
    <v-sheet class="h-auto mt-3">
      <div class="h-grow">
        <v-sheet 
          width="50%" 
          class="h-auto pe-2"
        >
          <VCard
            color="inputDisabled"
            variant="outlined"
            width="100%"
            height="95%"
            min-height="300"
          >
            <e-chart :option="chartsOptions" />
          </VCard>
        </v-sheet>
        <v-sheet 
          width="50%" 
          class="h-auto ps-2"
        >
          <VCard
            color="inputDisabled"
            variant="outlined"
            width="100%"
            height="95%"
            min-height="300"
          >
            <e-chart :option="chartsOptions1" />
          </VCard>
        </v-sheet>
      </div>
    </v-sheet>
  </div>
</template>

<style lang="scss" scoped>
.scoreCard p {
  color: #051537;
}
.cardHover {
  box-shadow: 0px 2px 4px 0px rgba(26, 64, 199, 0.15) !important;
  p {
    color: #1a40c7 !important;
  }
}

.SAFIA0010_dashboard {
  .dashboard-contents {
    position: relative;
  }
}
</style>