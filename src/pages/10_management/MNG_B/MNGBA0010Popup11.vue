 <!-- MNGEE0020 반기별 이행점검 현황/분석 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import TAB01 from '@/pages/10_management/MNG_E/MNGEE0020_TAB01.vue'
import TAB02 from '@/pages/10_management/MNG_E/MNGEE0020_TAB02.vue'
import TAB03 from '@/pages/10_management/MNG_E/MNGEE0020_TAB03.vue'
import TAB04 from '@/pages/10_management/MNG_E/MNGEE0020_TAB04.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import { number } from 'echarts/core'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'


defineOptions({
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const logsStore = useLogsStore() 
const t = useI18n().t //다국어

const menuTitle = ref(null)
const tab = ref('tab_01')
const dialog = ref(false)

const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
const tab04 = ref(null)

const approvalPopup = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  DEPT_CD: userStore.deptCd,
  YEAR: dayjs(new Date).get('year'),
  gbn: '',
  STATUS: '',
  INS_DATE_FROM: dayjs(dayjs(new Date).get('year') + '01' , '01').format('YYYY-MM-DD'),
  INS_DATE_TO: dayjs(new Date(dayjs(new Date).get('year') , 12 - 1 , '31')).format('YYYY-MM-DD'),
})

const gbnList = reactive([
  {COD: '', TXT: '전체'},
  {COD: 'A', TXT: '상반기'},
  {COD: 'B', TXT: '하반기'},
])

const HHIAF30 = ref([])    // 결재상태코드

const gbnChange = e => {
  if(e === 'A'){
    searchParams.INS_DATE_FROM = dayjs(searchParams.YEAR + '01' , '01').format('YYYY-MM-DD')
    searchParams.INS_DATE_TO = dayjs(new Date(searchParams.YEAR , 6 - 1 , '30')).format('YYYY-MM-DD')
  }else if(e === 'B') {
    searchParams.INS_DATE_FROM = dayjs(searchParams.YEAR + '07' , '01').format('YYYY-MM-DD')
    searchParams.INS_DATE_TO = dayjs(new Date(searchParams.YEAR , 12 - 1 , '31')).format('YYYY-MM-DD')
  }else {
    searchParams.INS_DATE_FROM = dayjs(searchParams.YEAR + '01' , '01').format('YYYY-MM-DD')
    searchParams.INS_DATE_TO = dayjs(new Date(searchParams.YEAR , 12 - 1 , '31')).format('YYYY-MM-DD')
  }
  
  onButtonsClick({ id: 'btnSearch' })
}

const onButtonsClick = btn => {
  try {
    if(btn.id === 'btnClose'){
      onClose()
    }

    if(tab.value === 'tab_01'){
      tab01.value.onButtonsClick({id: btn.id})
    }else if(tab.value === 'tab_02') {
      tab02.value.onButtonsClick({id: btn.id})
    }else if(tab.value === 'tab_03'){
      tab03.value.onButtonsClick({id: btn.id})
    }else {
      tab04.value.onButtonsClick({id: btn.id})
    }
  }catch (err) {
  }
  
}

const reSet = () => {
  searchParams.gbn = ''
  searchParams.INS_DATE_FROM = dayjs(searchParams.YEAR + '01' , '01').format('YYYY-MM-DD')
  searchParams.INS_DATE_TO = dayjs(new Date(searchParams.YEAR , 12 - 1 , '31')).format('YYYY-MM-DD')
}

const tabChange = e => {
  onButtonsClick({ id: 'btnSearch' })
}

const initCodeList = () => {
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {  
  await initCodeList()
  await onButtonsClick({ id: 'btnSearch' })
  //팝업 오픈
  dialog.value = true 
}

defineExpose({
  openPopup,
})

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1600"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{'관계법령 이행 점검 결과 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('관계법령 이행 점검 결과')"
          :button-list="['btnSearch','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area p-relative">
        <v-sheet class="content-body flex-nowrap" min-height="700">
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('년도')"
              labelWidth="30px"
              v-model="searchParams.YEAR"
              type="Number"
              width="300px"
              @update:modelValue="reSet"
            />
            <i-select
              :label="$t('상/하반기')"
              labelWidth="70px"
              v-model="searchParams.gbn"
              :items="gbnList"
              item-title="TXT"
              item-value="COD"
              width="300px"
              @update:modelValue="gbnChange"
            />
            <i-input
              :label="$t('점검일자')"
              labelWidth="70px"
              v-model="searchParams.INS_DATE_FROM"
              type="date"
              width="370px"
              margin="4px"
            />
            <i-input
              v-model="searchParams.INS_DATE_TO"
              type="date"
              width="300px"
            />
          </v-sheet>
          <v-sheet class="flex-column">
            <VTabs v-model="tab" @update:model-value="tabChange">
              <VTab value="tab_01">법조항별 지적 현황</VTab>
              <VTab value="tab_02">지적 내용 통계</VTab>
              <VTab value="tab_03">부서별 시정조치 현황</VTab>
              <VTab value="tab_04">조치 진행중인 사항</VTab>
            </VTabs>
            <VWindow v-model="tab">
              <VWindowItem value="tab_01"><TAB01 ref="tab01" :searchParams="searchParams" /></VWindowItem> 
              <VWindowItem value="tab_02"><TAB02 ref="tab02" :searchParams="searchParams" /></VWindowItem> 
              <VWindowItem value="tab_03"><TAB03 ref="tab03" :searchParams="searchParams" /></VWindowItem> 
              <VWindowItem value="tab_04"><TAB04 ref="tab04" :searchParams="searchParams" /></VWindowItem> 
            </VWindow>
          </v-sheet>
        </v-sheet>
      </v-card-text> 
    </v-card>
    <ApprovalPopup ref="approvalPopup" />
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
}
</style>