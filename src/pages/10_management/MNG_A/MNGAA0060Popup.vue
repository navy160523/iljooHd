<!--
  화면명 : MNGAA0060Popup.vue
  화면개요 : 부문별 HSE 중점추진사항 수립 -> HSE 부문별 주요 KPI 등록/수정 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { commonSearchApi, commonExecuteApi, getCodeList,getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import MNGAA0060Popup2 from './MNGAA0060Popup2.vue'
import dayjs from 'dayjs'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const mNGAA0060Popup2 = ref(null)
const emit = defineEmits(["popupExit"])
const readonly = ref(null)
const type = ref('')
// let dashboard = ref('__가/이 전월대비 OO% 감소/증가 했습니다.')
let dashboard = ref('__가/이 전월대비 OO% 감소/증가 했습니다.')

const saveParams = reactive({
  USER_ID: userStore.userId,
  BSNS_CD: '',
  HSE_DIV: '',
  PART_CD: '',
  PLAN_CYCLE: '',
  PLAN_CYCLE_NUM : '', // 주기 몇 회
  PLAN_CYCLE_MONTH : 'A', // KPI는 월 만 사용 원하여 박아둠
  PLAN_CYCLE_MONTH_KR : '월', // KPI는 월 만 사용 원하여 박아둠
  IDX: '',
  YEAR: '',
  PERSON: '-',
  AHEAD_ITEM: '',
  AHEAD_ITEM_CD: '',
  PLAN_ITEM: '',
  PLAN_DOCU: '',
  ASGN_ITEM: '',
  ASGN_ITEM_CD: '',
})

// 코드리스트 선언
const codeList_popup = reactive({
  BSNS: [], //사업부
  BUMUN: [], //부문
  HSE_DIV: [ //구분
    { value: '1', label: '안전' },
    { value: '2', label: '보건' },
    { value: '3', label: '환경' }
  ],
  PLAN_CYCLE: [], //주기
  PLAN_CYCLE_NUM : [
    {CYCLE : '1'},
    {CYCLE : '2'},
    {CYCLE : '3'},
    {CYCLE : '4'},
    {CYCLE : '5'},
    {CYCLE : '6'},
    {CYCLE : '7'},
    {CYCLE : '8'},
    {CYCLE : '9'},
    {CYCLE : '10'},
  ], // 주기 몇 회
  PLAN_CYCLE_MONTH : [] // 주기 몇 월, 몇 주
})

// 코드리스트 오리지날 선언
const codeList_popup_orign = reactive({
  BSNS: [], //사업부
  BUMUN: [], //부문
  PLAN_CYCLE: [], //주기
  PLAN_CYCLE_NUM : [], // 주기 몇 회
  PLAN_CYCLE_MONTH : [] // 주기 몇 월, 몇 주
})

// 추가 시 팝업 오픈
const openPopup = (codeListParam, param, typeParam) => {

  codeList_popup.BSNS = codeListParam.BSNS
  codeList_popup.BUMUN = codeListParam.BUMUN
  codeList_popup_orign.BSNS = codeListParam.BSNS
  codeList_popup_orign.BUMUN = codeListParam.BUMUN
  codeList_popup_orign.PLAN_CYCLE = codeListParam.PLAN_CYCLE
  codeList_popup.PLAN_CYCLE = codeListParam.PLAN_CYCLE

  // for (const item of codeList_popup_orign.PLAN_CYCLE) {
  //   if (item.SYS_CDNM.includes('/')) {
  //     // codeList_popup_orign.PLAN_CYCLE_NUM.push(item.SYS_CDNM.split('회/')[0])
  //     codeList_popup_orign.PLAN_CYCLE_MONTH.push(item.SYS_CDNM.split('회/')[1])
  //   }
  // }

  const setMonth = new Set(codeList_popup_orign.PLAN_CYCLE_MONTH);

  codeList_popup.PLAN_CYCLE_MONTH = [...setMonth]


  // 주기 월 만 선택
  // for (const item of codeList_popup_orign.PLAN_CYCLE) {
  //   if (item.SYS_CDNM.includes('/월')) {
  //     codeList_popup.PLAN_CYCLE.push(item)
  //   }
  // }

  type.value = typeParam

  if(typeParam === 'CREATE'){
    saveParams.YEAR = param.YEAR ? param.YEAR : dayjs().get("year")
    //saveParams.BSNS_CD = param.BSNS_CD ? param.BSNS_CD : ''
    //saveParams.PART_CD = param.BUMUN_CD ? param.BUMUN_CD : ''

    readonly.value = false
  }
  else if(typeParam === 'EDIT'){
    saveParams.IDX = param.IDX ? param.IDX : '' // IDX
    saveParams.YEAR = param.YEAR ? param.YEAR : dayjs().get("year") // 년도
    saveParams.BSNS_CD = param.KPI_BSNS_CD ? param.KPI_BSNS_CD : '' // 사업부
    saveParams.PART_CD = param.KPI_PART_CD ? param.KPI_PART_CD : '' // 부문
    saveParams.HSE_DIV = param.KPI_HSE_DIV ? param.KPI_HSE_DIV : '' // 구분
    saveParams.PLAN_CYCLE_MONTH = param.KPI_PLAN_CYCLE_COD ? param.KPI_PLAN_CYCLE_COD.substr(0,1) : '' // 주기 기준
    saveParams.PLAN_CYCLE_NUM = param.KPI_PLAN_CYCLE_COD ? param.KPI_PLAN_CYCLE_COD.substr(1) : '' // 주기 횟수
    saveParams.PERSON = param.KPI_PERSON_NAME ? param.KPI_PERSON_NAME : '-'// 담당자
    saveParams.ASGN_ITEM = param.KPI_ASGN_ITEM ? param.KPI_ASGN_ITEM : ''// 부서목록
    saveParams.ASGN_ITEM_CD = param.KPI_ASGN_ITEM_CD ? param.KPI_ASGN_ITEM_CD : '' // 부문 주요 KPI_CD
    saveParams.AHEAD_ITEM = param.KPI_AHEAD_ITEM ? param.KPI_AHEAD_ITEM : '' // 부문 주요 KPI
    saveParams.PLAN_ITEM = param.KPI_PLAN_ITEM ? param.KPI_PLAN_ITEM : '' // 실행방안
    saveParams.PLAN_DOCU = param.KPI_PLAN_DOCU ? param.KPI_PLAN_DOCU : '' // 실적 관리 방법(기록)

    readonly.value = true
  }
  initCodeList(param.KPI_PLAN_CYCLE)
  
  dialog.value = true
}

const initCodeList = (cycle) => {

  Promise.all([
    // commonSearchApi({ queryId: "MNGAA0060_SEARCH_02", param: { }, }),
    getCodeList('HHIAF41')
  ]).then((res) => {

    codeList_popup.PLAN_CYCLE_MONTH = res[0].ORESULT_CUR



    // codeList_popup_orign.PLAN_CYCLE = res[0].ORESULT_CUR
    // codeList_popup.PLAN_CYCLE_NUM = []
    // res[0].ORESULT_CUR.forEach((e) => {
    //   if(e.SYS_CD === cycle){
    //     saveParams.PLAN_CYCLE_MONTH = e.SYS_CDNM.split('회/')[1]
        
    //     codeList_popup_orign.PLAN_CYCLE.forEach(ele => {
    //       if(ele.SYS_CDNM.split('회/')[1] === saveParams.PLAN_CYCLE_MONTH){
    //         codeList_popup.PLAN_CYCLE_NUM.push(ele.SYS_CDNM.split('회/')[0])
    //       }
    //     })
    //     saveParams.PLAN_CYCLE_NUM = e.SYS_CDNM.split('회/')[0]
    //   }
    // })
    // grdMain.value.setBindingColumn('KPI_PLAN_CYCLE', res[0].ORESULT_CUR, 'SYS_CD', 'SYS_CDNM')
  })
}

const onButtonsClick = btn => {
  if(btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        emit("popupExit") 
        onButtonsClick({ id :'btnClose' }) 
      })
      .run()
  }
  else if(btn.id === 'btnClose'){
    onClose()
  }
}

const beforeSave = () => {
  // check validation
  if(!saveParams.YEAR) {
    Message.warn(t('년도를 입력하세요.'))
    return false
  }
  else if(!saveParams.HSE_DIV) {
    Message.warn(t('구분를 선택하세요.'))
    return false  
  }
  else if(!saveParams.BSNS_CD){
    Message.warn(t('사업부를 선택하세요.'))
    return false
  } 
  else if(!saveParams.PLAN_CYCLE_MONTH) {
    Message.warn(t('주기를 선택하세요.'))
    return false
  }
  else if(!saveParams.PLAN_CYCLE_NUM) {
    Message.warn(t('주기를 선택하세요.'))
    return false
  }
  else if(!saveParams.PART_CD) {
    Message.warn(t('부문를 선택하세요.'))
    return false
  }
  else if(!saveParams.ASGN_ITEM) {
    Message.warn(t('부서목록을 선택하세요.'))
    return false
  }
  else if(!saveParams.AHEAD_ITEM) {
    Message.warn(t('부문 주요 KPI를 입력하세요.'))
    return false
  }
  else if(!saveParams.PLAN_ITEM) {
    Message.warn(t('실행방안을 입력하세요.'))
    return false
  }
  else if(!saveParams.PLAN_DOCU) {
    Message.warn(t('실적 관리 방법(기록)을 입력하세요.'))
    return false
  }
  return true
}

const saveData = () => {
  saveParams.PLAN_CYCLE = saveParams.PLAN_CYCLE_MONTH+saveParams.PLAN_CYCLE_NUM
  return commonExecuteApi({ queryId : 'MNGAA0060_SAVE_01', list: [saveParams] })
  
}

// 부문 선택 시 사업부 자동으로 변경
const changedBumun = e => {
  let bsnsCd = ''
  if(e){
    codeList_popup.BUMUN.forEach((list,idx) => {
      if(list.PART_CD === e){
        bsnsCd = codeList_popup.BUMUN[idx].BSNS_CD
      } 
    })
    saveParams.BSNS_CD = bsnsCd
  }
  changedBsns(saveParams.BSNS_CD, true)
  //POPUP OPEN
  mNGAA0060Popup2.value.openPopup(codeList_popup, codeList_popup_orign, saveParams, type.value)
}

// 사업부 선택시 부문리스트 자동으로 정리
const changedBsns = (e, ckBumun) => {
  let arr = []
  if(e){
    codeList_popup_orign.BUMUN.forEach((list, idx) => {
      if(list.BSNS_CD === e){
        arr.push({
          BSNS_CD : codeList_popup_orign.BUMUN[idx].BSNS_CD,
          PART_CD : codeList_popup_orign.BUMUN[idx].PART_CD,
          ASGN_SHRT_NM : codeList_popup_orign.BUMUN[idx].ASGN_SHRT_NM
        })
      }
    })
    codeList_popup.BUMUN = arr
    if(!ckBumun){
      saveParams.PART_CD = ''
    }
  }
}

// const changeCycleMonth = (e) => {
//   codeList_popup.PLAN_CYCLE_NUM = []
//   codeList_popup_orign.PLAN_CYCLE.forEach(ele => {
//     if(ele.SYS_CDNM.includes(e)){
//       codeList_popup.PLAN_CYCLE_NUM.push(ele.SYS_CDNM.split('회/')[0])
//     }
//   })

//   const setNum = new Set(codeList_popup.PLAN_CYCLE_NUM);

//   codeList_popup.PLAN_CYCLE_NUM = [...setNum]
  
//   saveParams.PLAN_CYCLE_NUM = ''
// }

const clickAsgn = () => {
  mNGAA0060Popup2.value.openPopup(codeList_popup, codeList_popup_orign, saveParams, type.value)
}

const onClose = () => {
  // 파라미터 초기화
  saveParams.BSNS_CD = ''
  saveParams.HSE_DIV = ''
  saveParams.PART_CD = ''
  saveParams.PLAN_CYCLE = ''
  // saveParams.PLAN_CYCLE_MONTH = ''
  saveParams.PLAN_CYCLE_NUM = ''
  saveParams.YEAR = ''
  saveParams.PERSON = '-'
  saveParams.AHEAD_ITEM = ''
  saveParams.PLAN_ITEM = ''
  saveParams.PLAN_DOCU = ''
  saveParams.ASGN_ITEM = ''
  saveParams.ASGN_ITEM_CD = ''
  
  codeList_popup.BSNS = []
  codeList_popup.BUMUN = []
  codeList_popup.PLAN_CYCLE = []

  dialog.value = false
}

const onDeptSelected = (val, val2) => {
  saveParams.ASGN_ITEM = ''
  saveParams.ASGN_ITEM_CD = ''
  val.forEach((list,idx) => {
    saveParams.ASGN_ITEM += list.ASGN_SHRT_NM 
    saveParams.ASGN_ITEM_CD += list.ASGN_CD
    if(idx < val.length-1){
      saveParams.ASGN_ITEM += ', '
      saveParams.ASGN_ITEM_CD += ', '
    }
  })

  saveParams.BSNS_CD = val2.BSNS_CD
  saveParams.PART_CD = val2.PART_CD
  changedBsns(saveParams.BSNS_CD, true)
}

const RESET_ASGN_ITEM = () => {
  saveParams.ASGN_ITEM = ''
  saveParams.ASGN_ITEM_CD = ''
}

defineExpose({
  openPopup,
})

//초기 데이터셋팅
// onMounted(() => {
//   window.addEventListener("mousemove", mouseUpdate)
// })

watch(() => [saveParams.AHEAD_ITEM],([newAHEAD_ITEM]) => {
  
  dashboard.value = saveParams.AHEAD_ITEM + '가/이 전월대비 OO% 감소/증가 했습니다.'
})

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  // let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1100"
    height="500"
    class="p-absolute user-select-none draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
        @mousedown="startDragging"
    >
      <span>HSE 부문별 주요 KPI 등록/수정 팝업</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="flex-column">

            <div class="d-flex">
              <i-select
                width="150px"
                :label="$t('년도')"
                v-model="saveParams.YEAR"
                top-label
                required
                type="YEAR"
              /> 

              <i-select
                v-model="saveParams.HSE_DIV"
                top-label
                :label="$t('구분')"
                width="150px"
                required
                :items="codeList_popup.HSE_DIV"
                item-value="value"
                item-title="label"
              />

              <i-select
                v-model="saveParams.BSNS_CD"
                top-label
                :label="$t('사업부')"
                width="180px"
                required
                :items="codeList_popup.BSNS"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                @update:modelValue="changedBsns"
                />
                <!-- :readonly="readonly" -->

              <i-select
                v-model="saveParams.PART_CD"
                top-label
                :label="$t('부문')"
                width="180px"
                required
                :items="codeList_popup.BUMUN"
                item-value="PART_CD"
                item-title="ASGN_SHRT_NM"
                @update:modelValue="changedBumun"
                />
                <!-- :readonly="readonly" -->

              <!-- <i-select
                v-model="saveParams.PLAN_CYCLE_MONTH"
                top-label
                :label="$t('주기')"
                width="110px"
                required
                readonly
                :items="codeList_popup.PLAN_CYCLE_MONTH" 
                item-value="COD"
                item-title="TXT"
                /> -->
                <!-- @update:modelValue="changeCycleMonth" -->
              <i-input
                :label="$t('주기')"
                top-label
                labelWidth="70px"
                v-model="saveParams.PLAN_CYCLE_MONTH_KR"
                readonly
                width="110px"
              />
              
              <i-select
                v-model="saveParams.PLAN_CYCLE_NUM"
                top-label
                width="110px"
                :items="codeList_popup.PLAN_CYCLE_NUM" 
                item-value="CYCLE"
                item-title="CYCLE"
              />
                
              <div class="align-self-end ml-0 mb-1" style="width:50px;">회</div>
            </div>

            <div class="mt-5 d-flex">
              <i-textarea
                v-model="saveParams.ASGN_ITEM"
                top-label
                :row="2"
                :label="$t('대상부서')"
                width="1060px"
                required
                readonly
                @click="clickAsgn"
              />
              <v-btn style="height: 22px; top:-5px; left:-70px;  padding: 5px 5px !important; font-size: 14px;" @click="RESET_ASGN_ITEM">초기화</v-btn> 
              <!-- <v-btn style="position: absolute; height: 22px; top: 150px; left:468px; padding: 5px 5px !important; font-size: 14px;" @click="RESET_ASGN_ITEM">초기화</v-btn>   -->
            </div>

            <div class="mt-5 d-flex">
              <i-textarea
                v-model="saveParams.AHEAD_ITEM"
                top-label
                width="320px"
                :row="3"
                :label="$t('부문 주요 KPI')"
                required
              />
              <div>
                <div class="exDashboard">예시(통합안전대시보드에 들어가는 예시입니다.)</div>
                <div class="d-flex topCard">
                  <span class="cardTitle">부문별 안전 KPI 현황</span>
                  <span class="circle">품질</span>
                  <span class="banner" readonly>{{ dashboard }}</span> 
                </div>
              </div>
              <!-- <i-textarea
                v-model="dashboard"
                top-label
                width="520px"
                :row="3"
                :label="$t('예시')"
                readonly
                /> -->
                <!-- :label="$t('통합안전 대시보드 부문별 KPI 예시')" -->
            </div>

            <div class="mt-2">
            </div>

            <div class="mt-2 d-flex">
              <i-textarea
                v-model="saveParams.PLAN_ITEM"
                top-label
                width="520px"
                :row="3"
                :label="$t('실행방안')"
                required
              />

              <i-textarea
                v-model="saveParams.PLAN_DOCU"
                top-label
                width="520px"
                :row="3"
                :label="$t('실적 관리 방법(기록)')"
                required
              />
            </div>
           
          </v-sheet>
         
        </div>
      </v-card-text>
    <!-- MNGAA0060Popup (부서 선택 팝업) -->
    <MNGAA0060Popup2 ref="mNGAA0060Popup2" 
      @selected="onDeptSelected"
      />
      <!-- @popup2Exit="() => { onButtonsClick({ id: 'btnSearch' }) }" -->
    </v-card>
  </v-dialog>
</template>

<style scoped>
  .exDashboard{
    height: 20px;
    color: #222;
    font-size: 14px;
    font-weight: 400;
  }
  .topCard {
    background-color: #1E2E55;
    min-height: 45px;
    padding: 10px 20px;
    /* min-width:720px; */
    max-width:720px;
    border-radius: 12px;
  }
  .cardTitle {
    font-size: 16px !important;
    font-weight: 600;
    color: #FFF !important;
    margin-right:15px;
    min-width:137px;
    max-width:137px;
  }
  .circle{
    background-color: #1A40C7;
    border-radius: 100px;
    height:25px;
    min-width:45px;
    max-width:45px;
    font-size:14px;
    color: #FFF !important;
    margin-top:-1px;
    margin-right:15px;
    padding-top:2px;
    text-align: center;

  }
  .banner{
    font-size: 16px !important;
    font-weight: 600;
    color: #FFF !important;
  }
</style>
