<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import dayjs from "dayjs"
import { commonSearchApi, commonExecuteApi } from "@hiway/api/commonApi"
import AsgnPopup from "@/pages/50_safety-support/SPP_E/AsgnPopup.vue"
import TAB01 from "@/pages/50_safety-support/SPP_E/SPPEA0010_TAB02_TAB01.vue"
import TAB02 from "@/pages/50_safety-support/SPP_E/SPPEA0010_TAB02_TAB02.vue"
import TAB03 from "@/pages/50_safety-support/SPP_E/SPPEA0010_TAB02_TAB03.vue"
import OZReport from '@/components/OZReport.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const tab = ref('TAB_01')
const menuTitle = ref(null)
const asgnPopup = ref(null)
const TAB_01 = ref(null)
const TAB_02 = ref(null)
const TAB_03 = ref(null)
const dialog = ref(false)

const reportName = ref('/manage/hse/SPPEA0010.ozr')

// OzReport 팝업 여부
const showOz = ref(false)

const params = ref([])
 
/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.asgnFullNm,
  DEPT_NM: userStore.deptNm,
  DEPT_CD: userStore.deptCd,
  IO_DIV: '',
  DATE_YN: 'Y',
  ISS_DATE_FR: dayjs(new Date).startOf('M').format('YYYY-MM-DD'),
  ISS_DATE_TO: dayjs(new Date).format('YYYY-MM-DD'),
  EMP_NO: '',
  EMP_NM: '',
  BIKE_NO: '',
  ERASE: 'Y',
  STATUS: '',
  REG_NO: '',
  OUT_YN: userStore.userDiv === 'A' ? 'N' : 'Y'       // 직영이면 A , 협력사면 B
})

/* 코드 리스트 */
const codeList = reactive({
  CMPNY_List: [],      // 회사구분
  BSNSList: [],        // 사업부
  DEPTList: [{ ASGN_SHRT_NM:'전체', DEPT_CD: '' }],      // 부서
  IO_DIVList: [                                      // 소속구분
    { label: 'ALL', value: '' }, 
    { label: '직영', value: 'A' }, 
    { label: '사내협력사', value: 'B' }, 
    { label: '사외협력사', value: 'C' }, 
  ],
  IO_DIVList2: [                                      // 그리드내 소속구분
    { label: 'ALL', value: '' }, 
    { label: '직영', value: 'A' }, 
    { label: '협력사', value: 'B' }, 
    { label: '사외', value: 'C' }, 
  ],
  USE_DIVList: [
    { label: '개인', value: 'P' }, 
    { label: '업무용', value: '2' }, 
  ],
  ERASE_DIVList: [
    { label: '퇴사', value: 'A' }, 
    { label: '누적위반', value: 'B' }, 
    { label: '중대위반', value: 'C' }, 
    { label: '삭제', value: 'D' }, 
  ],
  STATUS_LIST: []
})

const onButtonsClick = async btn => {
  if(btn.id === 'btnMotorcycleRegFAQ'){
    dialog.value = true
  }else if(btn.id === 'btnPrint'){
    params.value = [
      "IN_CMPNY_DIV="+searchParams.CMPNY_DIV,
      "IN_BSNS_CD="+searchParams.BSNS_CD,
      "IN_DEPT_CD="+searchParams.DEPT_CD,
      "IN_REG_NO="+searchParams.REG_NO,
    ]

    showOz.value = true
  }

  if(tab.value === 'TAB_01'){
    TAB_01.value.onButtonsClick(btn)
  }else if(tab.value === 'TAB_02'){
    TAB_02.value.onButtonsClick(btn)
  }else {
    TAB_03.value.onButtonsClick(btn)
  }
}

const setBtn = e => {
  if(e === 'TAB_01'){
    menuTitle.value.disableBtn('btnPrint', false)
  }else if(e === 'TAB_02'){
    menuTitle.value.disableBtn('btnPrint', true)
  }else {
    menuTitle.value.disableBtn('btnPrint', true)
  }
}

const initCodeList = () => {
  Promise.all([ commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIG250', USE_FLAG: 'Y' }}),
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIG240', USE_FLAG: 'Y' }}) ]).then(res => {
    // codeList.STATUS_LIST = res[0].ORESULT_CUR
    res[0].ORESULT_CUR.forEach(e => {
      codeList.STATUS_LIST.push({
        value: e.COD, label: e.TXT
      })
    })

    res[1].ORESULT_CUR.forEach(e => {
      codeList.ERASE_DIVList.push({
        value: e.COD, label: e.TXT
      })
    })

    codeList.STATUS_LIST.unshift({ label:'전체', value: '' })
  })
}

/* -------------- 팝업 오픈 -------------- */
const openPopup = gbn => {
  asgnPopup.value.openPopup({})
}

/* ***** 부서/협력사 선택 ***** */
const onDeptSelected = val => {
  searchParams.ASGN_NM = val.ASGN_FULL_NM
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  onButtonsClick({ id: 'btnSearch' })
}

onMounted(() => {
  initCodeList()
})
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <IGridTitle
      ref="menuTitle"
      :button-list="['btnMotorcycleRegFAQ', 'btnSearch', 'btnPrint']"
      @click-button="onButtonsClick"
    />
    <v-sheet class="searchArea flex-column mb-3">
      <div class="d-flex">
        <i-input 
          v-model="searchParams.ASGN_NM"
          :label="$t('소속조직')"
          label-width="60px" 
          width="450px"
          class="mr-0"
          readonly
        />
        <i-input 
          v-model="searchParams.ASGN_CD"
          append-inner-icon="mdi-magnify" 
          @click:appendInner="openPopup"
          width="150px"
          readonly
        />
        <i-select 
          :label="$t('신청상태')"
          label-width="60px"
          width="300px"
          :items="codeList.STATUS_LIST"
          item-title="label"
          item-value="value"
          v-model="searchParams.STATUS"
          @update:modelValue="onButtonsClick({id: 'reset'})"
        />
        <i-input 
          v-model="searchParams.REG_NO"
          :label="$t('등록번호')"
          label-width="60px" 
          width="300px"
          @update:modelValue="onButtonsClick({id: 'reset'})"
          oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}]/, '' );"
          maxlength="20"
        />
      </div>
    </v-sheet>
    <v-sheet class="">
      <v-tabs v-model="tab" @update:modelValue="setBtn">
        <v-tab value="TAB_01">등록현황</v-tab>
        <v-tab value="TAB_02">신청현황</v-tab>
        <v-tab value="TAB_03">말소현황</v-tab>
      </v-tabs>
    </v-sheet>
    <v-window v-model="tab" class="h-window">
      <v-window-item value="TAB_01"><TAB01 ref="TAB_01" :searchParams="searchParams"/></v-window-item>
      <v-window-item value="TAB_02"><TAB02 ref="TAB_02" :searchParams="searchParams" :codeList="codeList"/></v-window-item>
      <v-window-item value="TAB_03"><TAB03 ref="TAB_03" :searchParams="searchParams" :codeList="codeList"/></v-window-item>
    </v-window>

    <!-- 부서/ 협력사 팝업 -->
    <AsgnPopup ref="asgnPopup" @selected="onDeptSelected" />

    <v-dialog
      v-model="dialog"
      eager
      persistent
      width="920"
      height="500"
      class="p-absolute user-select-none"
    >
      <v-sheet
        color="primarySub"
        height="50"
        class="px-4 d-flex align-center rounded-t-5 cursor-move"
      >
        <span>오토바이등록 FAQ</span>
      </v-sheet>
      <v-card class="pa-0 fill-height rounded-b-5">
        <!-- <v-card-title class="pa-4 pb-0">
          <IGridTitle
            :use-permission="false"
            :button-list="['btnClose']"
            @click-button="onButtonsClick"
            class="mb-0"
          />
        </v-card-title> -->
        <v-card-text class="pa-4 content-area">
          <div class="flex-column pt-2">
            <div class="d-flex fill-height">
              <v-sheet>
                <div class="align-center fill-height d-flex pa-4">
                  <v-icon icon="mdi-information-outline" size="75" color="warning"></v-icon>
                </div>
              </v-sheet>
              <v-sheet>
                <div class="align-center fill-height d-flex">
                  1. 직영/사내협력사는 [교육]-[교육계획/신청 및 실적]-[교육계획/실적관리]-[교육일정등록]-[특별->오토바이 교통안전교육] <br/>
                  으로 이수되어야 신청 가능합니다. <br/>
                  &nbsp; (※ 교육 이수처리 시 평가관리탭에 합격처리 필수) <br/>
                  <br/>
                  2. 교육이수 후 [신청현황] 리스트에 조회가 안될 경우 [등록현황] 또는 [말소현황]에서 확인 바랍니다. <br/>
                  <br/>
                  3. 사외/단기 협력사는 아래 신규버튼을 눌러 사외협력사 체크 후 신청바랍니다. <br/>
                  <br/>
                  4. 말소취소의 경우는 안전보건지원부 오토바이 담당자에게 요청바랍니다. <br/>
                  <br/>
                  5. 오토바이는 개인당 1대만 등록이 가능하며, 오토바이 매매 시 반드시 말소 처리 바랍니다.<br/>
                  (안전보건지원부 2-5409로 문의) 
                  <br/><br/>
                  (※ 오토바이 1대를 여러 명에게 등록 불가능하므로, 판매인이 말소처리 안 할 경우 구매자가 등록 시 등록이 안됩니다.)
                </div>
              </v-sheet>
            </div>
            <div class="pa-4 text-center">
              <v-btn height="40px" width="80px" style="font-size: 12pt;" @click="e => { dialog = false}">
                <v-icon icon="mdi-check-circle-outline" size="24" />
                <span class="pl-2">
                  확인
                </span>
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- OZReport -->
    <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
  </div>
</template>
<style scoped lang="scss">
</style>
