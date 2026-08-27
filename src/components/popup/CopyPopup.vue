<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js"
import _ from "lodash"

const emit = defineEmits(['selected', 'closeCopy'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const copyDialog = ref(false)
const deptPopup2 = ref(null)
const readonly = ref(false)
const deptReadonly = ref(false)
const icon = ref('mdi-magnify')

let queryId = ''

let korean = /[^.0-9]/g

const copyParams = reactive({
  FROM_CMPNY_DIV: '',
  FROM_YEAR: '',
  FROM_BSNS_CD: '',
  FROM_DEPT_CD: '',
  FROM_ASGN_CD: '',
  FROM_ASGN_FULL_NAME: '',
  FROM_ASGN_NM: '',
  FROM_ORGN_DIV: '',
  TO_CMPNY_DIV: '',
  TO_YEAR: '',
  TO_BSNS_CD: '',
  TO_DEPT_CD: '',
  TO_ASGN_CD: '',
  TO_ASGN_FULL_NAME: '',
  TO_ASGN_NM: '',
  TO_ORGN_DIV: '',
  DEL_YN: 'N',
  USER_ID: userStore.userId,
})

let menuId = ''

// 팝업 오픈 함수
const openCopyPopup =  (getMenuId, popupParam) => {
  copyDialog.value = true

  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  window.addEventListener("mousemove", mouseUpdate)

  menuId = getMenuId

  copyParams.FROM_CMPNY_DIV = copyParams.TO_CMPNY_DIV = popupParam.CMPNY_DIV
  copyParams.FROM_BSNS_CD = copyParams.TO_BSNS_CD = popupParam.BSNS_CD
  copyParams.FROM_DEPT_CD = copyParams.TO_DEPT_CD = popupParam.DEPT_CD
  copyParams.FROM_ASGN_CD = copyParams.TO_ASGN_CD = popupParam.ASGN_CD
  copyParams.FROM_ASGN_NM = copyParams.TO_ASGN_NM = popupParam.ASGN_NM
  copyParams.FROM_ASGN_FULL_NAME = copyParams.TO_ASGN_FULL_NAME = popupParam.ASGN_FULL_NAME

  copyParams.FROM_YEAR = menuId === 'MNGAD0010' ? popupParam.YEAR-1 : popupParam.YEAR
  copyParams.TO_YEAR = popupParam.YEAR

  yearReadonly()
  deptReaonlyChange()
}

// 년도 변경 방지 함수
const yearReadonly = () => {
  if( menuId === 'MNGAA0040'){ 
    // HSE 중점추진사항 분석 페이지는 연도 선택 금지
    readonly.value = true
    copyParams.FROM_YEAR = copyParams.TO_YEAR = dayjs().get("year")
  }
}


// 부서 / 협력사 변경 방지 함수
const deptReaonlyChange = () => {
  // if(menuId === 'MNGAA0030' || menuId === 'MNGAA0040'){ 
    // HSE 중점추진사항 실적, HSE 중점추진사항 분석 페이지는 연도 선택 금지
    // deptReadonly.value = true
    // icon.value = ''
    // copyParams.FROM_YEAR = copyParams.TO_YEAR = dayjs().get("year")
  // }
}


// 유효성 검사
const validation = gbn => {
  // if(copyParams.FROM_YEAR > copyParams.TO_YEAR){
  //   Message.err("FROM 년도가 TO 년도보다 클 수 없습니다.")
  //   copyParams.FROM_YEAR = copyParams.TO_YEAR
    
  //   return false
  // }
  
  // 소속 조직 단위로 변경
  if(gbn === 'btnCopy' && copyParams.FROM_YEAR === copyParams.TO_YEAR && copyParams.FROM_DEPT_CD === copyParams.TO_DEPT_CD && copyParams.FROM_ASGN_CD === copyParams.TO_ASGN_CD) {
    Message.err("복사하려는 년도와 조직이 동일합니다. \r\n복사대상From 또는 복사대상To 를 변경해주세요.")
    
    return false
  }
  // 주기 공통코드가 다른 이유(F40, f41)로 2024년 이후 데이터 처리 (2024년 -x-> 2023년) 
  if(gbn === 'btnCopy' && (menuId === 'MNGAA0020' || menuId === 'MNGAA0030' || menuId === 'MNGAA0040') && copyParams.FROM_YEAR >= '2024' && copyParams.TO_YEAR < 2024){
    Message.err("2024년 이후 데이터를 2024년 이전으로 복사할 수 없습니다.")
    return false
  }
  // 주기 공통코드가 다른 이유(F40, f41)로 2024년 이전 데이터 처리 (2023년 -x-> 2024년)
  if(gbn === 'btnCopy' && (menuId === 'MNGAA0020' || menuId === 'MNGAA0030' || menuId === 'MNGAA0040') && copyParams.FROM_YEAR < '2024' && copyParams.TO_YEAR >= 2024){
    Message.err("2024년 이전 데이터를 2024년 이후로 복사할 수 없습니다.")
    return false
  }

  return true
}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === "btnCopy" && validation('btnCopy')) {
    copyStart()
  }
  if (btn.id === "btnClose") {
    onClose()
  }
}

const copyStart = () => {
  
  switch(menuId)
  {
  case 'MNGAA0020' : // HSE 방침/목표/중점추진사항 (cs에서는 A)
    queryId = '_01'
    copyCheck() 
    break
  case 'MNGAA0030' : // HSE 중점추진사항 실적 (cs에서는 B1)
    queryId = '_05'
    copyCheck()
    break
  case 'MNGAA0040' : // HSE 중점추진사항 분석 (cs에서는 B2)
    queryId = '_06'
    copyCheck()
    break
  case 'MNGAC0010' : // 환경영향측면 파악 (cs에서는 F1)
    queryId = '_03'
    copyCheck()
    break
  case 'MNGAC0020' : // 환경영향평가 (cs에서는 F2)
    queryId = '_04'
    copyCheck()
    break
  case 'MNGAD0010' : // 업무분장표 (cs에서는 I)
    queryId = '_07'
    copyCheck()
    break
  case 'MNGAB0010' : // 내외부 이슈 및 리스크/기회 평가 (cs에서는 J)
    queryId = '_02'
    copyCheck()
    break

    // cs에서는 위험성 평가도 포함인데 web에서는 메뉴가 분리되어 화면이 어떻게 바뀌는지 모름, 일단 제외하고 만듬
    // CS에서 UIAZ2010C 참고
  }
}

const copyCheck = () => {
  Promise.all([ 
    commonSearchApi({ queryId : 'COPYPOPUP_CHECK'+queryId, param: copyParams }) ,
  ]).then(res => { 
    afterCheck(res)
  })
}

let m = ''

const afterCheck = async res => {
  if(res[0].ORESULT_CUR1.length<1){
    Message.err('복사해올 데이터가 존재하지 않습니다.')
    
    return 
  }

  if(res[0].ORESULT_CUR2.length >0){
    let ck = await vm.$swal({
      title: t('저장할 곳에 데이터가 이미 있습니다. 삭제하고 복사할까요?'),
      showCancelButton: true,
    })
    if(!ck.isConfirmed){
      Message.warn('취소되었습니다.')

      return 
    }
    else if(ck.isConfirmed){
      copyParams.DEL_YN = 'Y'
      if(res[0].ORESULT_CUR3 && (queryId === '_06' || queryId === '_05' )){
        m = '복사된 데이터는 HSE 방침/목표/중점추진사항페이지에서 \r\n선행 자료를 입력 후 조회 가능합니다.\r\n'
      }
    }
  }

  copyActive()
}

const copyActive = () => {
  new saveFlowHelper(vm, t)
    .setQuery(saveData)
    .setConfirmMessage(m+'복사 하시겠습니까?')
    .setResultMessage('복사되었습니다.')
    .run()
}


const saveData = () => {
  const saveParam = [Object.assign({}, copyParams)]

  return commonExecuteApi({ queryId : 'COPYPOPUP_SAVE'+queryId, list:  saveParam })
}


const onClose = () => {
  emit("closeCopy")
  copyDialog.value = false
}


let clickGbn = '' // DeptPopup에서 가져올 때 from 인지 to 인지 구분하기 위함

// 부서조회 
const openDeptPopup = gbn => {
  if(gbn === 'from부서조회'){
    clickGbn = 'from'
    deptPopup2.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : copyParams.FROM_ASGN_NM })
  } 
  else if(gbn === 'to부서조회'){
    clickGbn = 'to'
    deptPopup2.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : copyParams.TO_ASGN_NM })
  } 
}

const onDeptSelected = val => {
  if(val.length){
    if(clickGbn === 'from'){
      copyParams.FROM_CMPNY_DIV = val[0].CMPNY_DIV
      copyParams.FROM_BSNS_CD = val[0].BSNS_CD
      copyParams.FROM_DEPT_CD = val[0].DEPT_CD
      copyParams.FROM_ASGN_CD = val[0].ASGN_CD
      copyParams.FROM_ASGN_NM = val[0].ASGN_SHRT_NM
      copyParams.FROM_ORGN_DIV = val[0].ORGN_DIV
    }
    else if(clickGbn === 'to'){
      copyParams.TO_CMPNY_DIV = val[0].CMPNY_DIV
      copyParams.TO_BSNS_CD = val[0].BSNS_CD
      copyParams.TO_DEPT_CD = val[0].DEPT_CD
      copyParams.TO_ASGN_CD = val[0].ASGN_CD
      copyParams.TO_ASGN_NM = val[0].ASGN_SHRT_NM
      copyParams.TO_ORGN_DIV = val[0].ORGN_DIV
    }
  }
  else{
    if(clickGbn === 'from'){
      copyParams.FROM_CMPNY_DIV = val.CMPNY_DIV
      copyParams.FROM_BSNS_CD = val.BSNS_CD
      copyParams.FROM_DEPT_CD = val.DEPT_CD
      copyParams.FROM_ASGN_CD = val.ASGN_CD
      copyParams.FROM_ASGN_NM = val.ASGN_SHRT_NM
      copyParams.FROM_ORGN_DIV = val.ORGN_DIV
    }
    else if(clickGbn === 'to'){
      copyParams.TO_CMPNY_DIV = val.CMPNY_DIV
      copyParams.TO_BSNS_CD = val.BSNS_CD
      copyParams.TO_DEPT_CD = val.DEPT_CD
      copyParams.TO_ASGN_CD = val.ASGN_CD
      copyParams.TO_ASGN_NM = val.ASGN_SHRT_NM
      copyParams.TO_ORGN_DIV = val.ORGN_DIV
    }
  }
}


onMounted(() => {
  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  //window.addEventListener("mousemove", mouseUpdate)
})

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

const yearChange = async e => {
  let today = Number(dayjs(new Date).format('YYYY'))
  if(e === 'from'){
    copyParams.FROM_YEAR =  copyParams.FROM_YEAR+''.replace(korean, '')

    if(copyParams.FROM_YEAR.length > 4){
      copyParams.FROM_YEAR =  copyParams.FROM_YEAR.slice(0, 4)
    }
    if(copyParams.FROM_YEAR >  today){
      copyParams.FROM_YEAR = today
    }
  } else {
    copyParams.TO_YEAR =  copyParams.TO_YEAR+''.replace(korean, '')

    if(copyParams.TO_YEAR.length > 4){
      copyParams.TO_YEAR =  copyParams.TO_YEAR.slice(0, 4)
    }
    if(copyParams.TO_YEAR >  today){
      copyParams.TO_YEAR = today
    }
  }
  
}

defineExpose({
  openCopyPopup,
})
</script>

<template>

<v-dialog
    v-model="copyDialog"
    eager
    persistent
    width="700"
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
      <span>타 부서 및 전년도 복사</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnCopy', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <IGridTitle
                :title="$t('복사 대상 From')"
              />
              <div class="d-flex">
                <i-select 
                  :label="$t('년도')"
                  type='YEAR'
                  label-width="35px"
                  width="200px"
                  v-model="copyParams.FROM_YEAR"
                  :readonly="readonly"
                  @change="validation"
                  @update:modelValue="yearChange('from')"
                /> 
                <i-input 
                  :label="$t('부서/ 협력사')"
                  label-width="80px"
                  width="400px"
                  class="ml-3"
                  v-model="copyParams.FROM_ASGN_NM" 
                  append-inner-icon="mdi-magnify" 
                  @keydown.enter="e => {
                    openDeptPopup('from부서조회')
                  }"
                  @update:modelValue="e => { copyParams.FROM_DEPT_CD = null }"
                  @click:appendInner="openDeptPopup('from부서조회')"
                />
              </div>
          </v-sheet>
        </div>
      </v-card-text>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <IGridTitle
                :title="$t('복사 대상 To')"
              />
              <div class="d-flex">
                <i-select 
                  :label="$t('년도')"
                  type='YEAR'
                  label-width="35px"
                  width="200px"
                  v-model="copyParams.TO_YEAR"
                  :readonly="readonly"
                  @change="validation"
                  @update:modelValue="yearChange('to')"
                /> 
                <i-input 
                  :label="$t('부서/ 협력사')"
                  label-width="80px"
                  width="400px"
                  class="ml-3"
                  :readonly="deptReadonly"
                  v-model="copyParams.TO_ASGN_NM" 
                  :append-inner-icon="icon" 
                  @keydown.enter="e => {
                    openDeptPopup('to부서조회')
                  }"
                  @update:modelValue="e => { copyParams.TO_DEPT_CD = null }"
                  @click:appendInner="openDeptPopup('to부서조회')"
                />
              </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 부서/ 협력사 팝업 -->
  <DeptPopup ref="deptPopup2" @selected="onDeptSelected"/>

</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
