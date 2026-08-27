<script setup>
//HLTCA0020 지표별 DATA 집계

import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  chatbotTranslateLn,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useCommonStore } from '@hiway/stores/common'
import { isEmpty } from '@/@core/utils'
import dayjs from 'dayjs'
import HLTCA0020Popup from '@/pages/100_health/HLT_C/HLTCA0020Popup.vue'
// 탭1
// 비만율
import TAB01 from '@/pages/100_health/HLT_C/HLTCA0020Tab1_01.vue'
//운동실천율
import TAB06 from '@/pages/100_health/HLT_C/HLTCA0020Tab1_06.vue'
// 음주율
import TAB05 from '@/pages/100_health/HLT_C/HLTCA0020Tab1_05.vue'
// 흡연율
import TAB03 from '@/pages/100_health/HLT_C/HLTCA0020Tab1_03.vue'
// 고강도 운동실천율
import TAB02 from '@/pages/100_health/HLT_C/HLTCA0020Tab1_02.vue'
// 고위험 음주율
import TAB04 from '@/pages/100_health/HLT_C/HLTCA0020Tab1_04.vue'

// 탭2
// 보건의료서비스
// 건강진단 실시율
import TAB2_01 from '@/pages/100_health/HLT_C/HLTCA0020Tab2_01.vue'
// 사후관리실시율
import TAB2_02 from '@/pages/100_health/HLT_C/HLTCA0020Tab2_02.vue'
// 의료시설 이용횟수
import TAB2_03 from '@/pages/100_health/HLT_C/HLTCA0020Tab2_03.vue'
// 건강관리위험대상자 비율
import TAB2_04 from '@/pages/100_health/HLT_C/HLTCA0020Tab2_04.vue'
// 건강관리위험대상자 개선 비율
import TAB2_05 from '@/pages/100_health/HLT_C/HLTCA0020Tab2_05.vue'
// 보호구 및 안전소모품 비용
import TAB3_01 from '@/pages/100_health/HLT_C/HLTCA0020Tab3_01.vue'
import TAB3_02 from '@/pages/100_health/HLT_C/HLTCA0020Tab3_02.vue'
// 뇌심 고위험군 비율
import TAB4_01 from '@/pages/100_health/HLT_C/HLTCA0020Tab4_01.vue'
import TAB4_02 from '@/pages/100_health/HLT_C/HLTCA0020Tab4_02.vue'
import TAB4_03 from '@/pages/100_health/HLT_C/HLTCA0020Tab4_03.vue'
import TAB4_04 from '@/pages/100_health/HLT_C/HLTCA0020Tab4_04.vue'
// 작업환경측정조과율(유해인자별)
import TAB5_01 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_01.vue'
import TAB5_02 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_02.vue'
import TAB5_03 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_03.vue'
// 노출기준 초과배수
import TAB5_04 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_04.vue'
import TAB5_05 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_05.vue'
import TAB5_06 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_06.vue'
import TAB5_07 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_07.vue'
import TAB5_08 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_08.vue'
import TAB5_09 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_09.vue'
import TAB5_10 from '@/pages/100_health/HLT_C/HLTCA0020Tab5_10.vue'

defineOptions({
  name: '100_health-HLT_C-HLTCA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY') - 1,
})

// 변수 선언
const mainTab = ref('tab_1')
const subTab = reactive({
  // 건강행태
  tab_1: 'tab01',
  // 보건의료서비스
  tab_2: 'tab02',
  // 보건 자원 및 기타
  tab_3: 'tab03',
  // 건강상태
  tab_4: 'tab04',
  // 산업보건
  tab_5: 'tab05',
})
// 안에 있는 탭들
const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
const tab04 = ref(null)
const tab05 = ref(null)
const tab06 = ref(null)
// 사후관리실시율
const tab2_01 = ref(null)
const tab2_02 = ref(null)
const tab2_03 = ref(null)
const tab2_04 = ref(null)
const tab2_05 = ref(null)
// 직원당 안전보호구 안전소모품 비용
const tab3_01 = ref(null)
const tab3_02 = ref(null)
// 건강상태
// 뇌심 고위험군 비율
const tab4_01 = ref(null)
const tab4_02 = ref(null)
const tab4_03 = ref(null)
const tab4_04 = ref(null)
// 산업보건
const tab5_01 = ref(null)
const tab5_02 = ref(null)
const tab5_03 = ref(null)
// 노출기준 초과배수
const tab5_04 = ref(null)
const tab5_05 = ref(null)
const tab5_06 = ref(null)
const tab5_07 = ref(null)
const tab5_08 = ref(null)
const tab5_09 = ref(null)
const tab5_10 = ref(null)
const tab = ref('tab01')
const popupRef = ref(null)
const isAdmin = ref(false)

const initCodeList = () => {
  // 보건지표 모듈 관리자 여부 확인 ( 모듈관리자, admin그룹, 보건총괄관리자 )
  if (
    userStore.authGrpCd.includes('HLTC001') ||
    userStore.authGrpCd.includes('HIWAYGRP00001') ||
    userStore.authGrpCd.includes('GRP00372')
  ) {
    isAdmin.value = true // 관리자
    // console.log("isAdmin.value", true)
  } else {
    isAdmin.value = false // 일반 사용자
    // console.log("isAdmin.value", false)
  }

  if (!isAdmin.value) {
    vm.$swal({
      title: t(`관리자가 아닙니다.\n안전보건지원부 담당자에게 문의하십시오.`),
      showCancelButton: false,
    })
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnIndicator') {
    const params = {
      main: mainTab.value,
      sub: subTab[mainTab.value],
    }
    popupRef.value.openPopup(params)
  }
}

onMounted(() => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle ref="menuTitle" :title="$t(useLogsStore().menuId)" />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mb-2">
          <v-sheet class="searchArea">
            <i-select :label="$t('연도')" label-width="50px" width="200px" type="YEAR" v-model="searchParams.YEAR" />
          </v-sheet>

          <!-- 상위 탭 -->
          <VTabs v-model="mainTab">
            <VTab value="tab_1" :disabled="!isAdmin">건강행태</VTab>
            <VTab value="tab_2" :disabled="!isAdmin">보건의료서비스</VTab>
            <VTab value="tab_3" :disabled="!isAdmin">보건 자원 및 기타</VTab>
            <VTab value="tab_4" :disabled="!isAdmin">건강상태</VTab>
            <VTab value="tab_5" :disabled="!isAdmin">산업보건</VTab>
            <!-- 추가 -->
          </VTabs>

          <VWindow v-model="mainTab">
            <!-- 건강행태 -->
            <VWindowItem value="tab_1">
              <!-- 여기서 서브탭 여러 개 -->
              <VTabs v-model="subTab.tab_1" class="mt-2">
                <VTab value="tab01" :disabled="!isAdmin">비만율</VTab>
                <VTab value="tab06" :disabled="!isAdmin">운동실천율</VTab>
                <VTab value="tab05" :disabled="!isAdmin">음주율</VTab>
                <VTab value="tab03" :disabled="!isAdmin">현재 흡연율</VTab>
                <VTab value="tab02" :disabled="!isAdmin">고강도 운동 실천율</VTab>
                <VTab value="tab04" :disabled="!isAdmin">고위험 음주율</VTab>
                <!-- <VTab value="tab05">뇌심 고위험군 비율</VTab> -->
              </VTabs>

              <VWindow v-model="subTab.tab_1">
                <VWindowItem value="tab01">
                  <TAB01 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab06">
                  <TAB06 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab02">
                  <TAB02 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab03">
                  <TAB03 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab05">
                  <TAB05 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab04">
                  <TAB04 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>
              </VWindow>
            </VWindowItem>

            <!-- 보건의료서비스 -->
            <VWindowItem value="tab_2">
              <!-- 여기서 서브탭 여러 개 -->
              <VTabs v-model="subTab.tab_2" class="mt-2">
                <VTab value="tab2_01" :disabled="!isAdmin">건강진단실시율</VTab>
                <VTab value="tab2_02" :disabled="!isAdmin">사후관리실시율</VTab>
                <VTab value="tab2_03" :disabled="!isAdmin">직원당 의료시설 이용횟수</VTab>
                <VTab value="tab2_04" :disabled="!isAdmin">협력사 건강관리위험대상자 비율</VTab>
                <VTab value="tab2_05" :disabled="!isAdmin">협력사 건강관리위험대상자 개선 비율</VTab>
              </VTabs>

              <VWindow v-model="subTab.tab_2">
                <VWindowItem value="tab2_01">
                  <TAB2_01 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab2_02">
                  <TAB2_02 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab2_03">
                  <TAB2_03 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab2_04">
                  <TAB2_04 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab2_05">
                  <TAB2_05 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>
              </VWindow>
            </VWindowItem>

            <!-- 보건 자원 및 기타 -->
            <VWindowItem value="tab_3">
              <!-- 여기서 서브탭 여러 개 -->
              <VTabs v-model="subTab.tab_3" class="mt-2">
                <VTab value="tab3_01" :disabled="!isAdmin">직원당 보호구 및 안전소모품 비용</VTab>
                <VTab value="tab3_02" :disabled="!isAdmin">연령대별 직원 비율</VTab>
              </VTabs>

              <VWindow v-model="subTab.tab_3">
                <VWindowItem value="tab3_01">
                  <TAB3_01 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab3_02">
                  <TAB3_02 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>
              </VWindow>
            </VWindowItem>

            <!-- 건강상태 -->
            <VWindowItem value="tab_4">
              <!-- 여기서 서브탭 여러 개 -->
              <VTabs v-model="subTab.tab_4" class="mt-2">
                <VTab value="tab4_01" :disabled="!isAdmin">고혈압질환자 비율</VTab>
                <VTab value="tab4_02" :disabled="!isAdmin">고혈압전단계 비율</VTab>
                <VTab value="tab4_03" :disabled="!isAdmin">당뇨질환자 비율</VTab>
                <VTab value="tab4_04" :disabled="!isAdmin">뇌심혈관계질환 고위험군 비율</VTab>
              </VTabs>

              <VWindow v-model="subTab.tab_4">
                <VWindowItem value="tab4_01">
                  <TAB4_01 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab4_02">
                  <TAB4_02 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab4_03">
                  <TAB4_03 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab4_04">
                  <TAB4_04 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>
              </VWindow>
            </VWindowItem>

            <!-- 산업보건 -->
            <VWindowItem value="tab_5">
              <!-- 여기서 서브탭 여러 개 -->
              <VTabs v-model="subTab.tab_5" class="mt-2">
                <!-- <VTab value="tab5_01" width="250px" style="justify-content: flex-start;">작업환경측정 초과율</VTab>
                  <VTab value="tab5_02" width="250px" style="justify-content: flex-start;">유해인자별 작업환경측정 초과율</VTab>
                  <VTab value="tab5_03" width="250px" style="justify-content: flex-start;">작업환경측정 노출기준 초과배수</VTab>
                  <VTab value="tab5_04" width="270px" style="justify-content: flex-start;">유해인자별 작업환경측정 노출기준 초과배수</VTab>
                  <VTab value="tab5_05" width="250px" style="justify-content: flex-start;">직업병 요관찰율</VTab> -->
                <VTab value="tab5_01" width="250px" :disabled="!isAdmin">작업환경측정 초과율</VTab>
                <VTab value="tab5_02" width="250px" :disabled="!isAdmin">유해인자별 작업환경측정 초과율</VTab>
                <VTab value="tab5_03" width="250px" :disabled="!isAdmin">작업환경측정 노출기준 초과배수</VTab>
                <VTab value="tab5_04" width="250px" :disabled="!isAdmin"
                  >유해인자별 작업환경측정 노출기준 초과배수</VTab
                >
              </VTabs>
              <VTabs v-model="subTab.tab_5" class="mt-2">
                <!-- <VTab value="tab5_06" width="250px" style="justify-content: flex-start;">질환계통별 직업병 요관찰율</VTab>
                    <VTab value="tab5_07" width="250px" style="justify-content: flex-start;">직업병 유소견율</VTab>
                    <VTab value="tab5_08" width="250px" style="justify-content: flex-start;">질환계통별 직업병 유소견율</VTab>
                    <VTab value="tab5_09" width="270px" style="justify-content: flex-start;">업무상 질병 발생율</VTab>
                    <VTab value="tab5_10" width="250px" style="justify-content: flex-start;">질환계통별 업무상 질병 발생율</VTab> -->
                <VTab value="tab5_05" width="250px" :disabled="!isAdmin">직업병 요관찰율</VTab>
                <VTab value="tab5_06" width="250px" :disabled="!isAdmin">질환계통별 직업병 요관찰율</VTab>
                <VTab value="tab5_07" width="250px" :disabled="!isAdmin">직업병 유소견율</VTab>
                <VTab value="tab5_08" width="250px" :disabled="!isAdmin">질환계통별 직업병 유소견율</VTab>
                <VTab value="tab5_09" width="250px" :disabled="!isAdmin">업무상 질병 발생율</VTab>
                <VTab value="tab5_10" width="250px" :disabled="!isAdmin">질환계통별 업무상 질병 발생율</VTab>
              </VTabs>

              <VWindow v-model="subTab.tab_5">
                <VWindowItem value="tab5_01">
                  <TAB5_01 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab5_02">
                  <TAB5_02 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab5_03">
                  <TAB5_03 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab5_04">
                  <TAB5_04 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>
                <VWindowItem value="tab5_05">
                  <TAB5_05 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>
                <VWindowItem value="tab5_06">
                  <TAB5_06 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab5_07">
                  <TAB5_07 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab5_08">
                  <TAB5_08 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab5_09">
                  <TAB5_09 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>

                <VWindowItem value="tab5_10">
                  <TAB5_10 :searchParams="searchParams" @on-buttons-click="onButtonsClick" />
                </VWindowItem>
              </VWindow>
            </VWindowItem>
          </VWindow>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <HLTCA0020Popup ref="popupRef" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 220px);
  // overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 400px;
  // }
}

.tab-mg1 {
  margin-left: -37px;
  margin-right: 30px;
}
.tab-mg2 {
  margin-right: 25px;
}
.tab-mg3 {
  margin-right: 94px;
}

.tab-mg4 {
  margin-left: 20px;
}
</style>
