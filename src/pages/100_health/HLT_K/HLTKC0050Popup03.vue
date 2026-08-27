<!--
  화면명 : 고령근로자 사후관리 건강정보 등록
  화면개요 : 고령근로자 사후관리 건강정보 등록
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useLogsStore } from '@hiway/stores/logs'
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest2, commonLogExecuteApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from "@hiway/utils/notify"

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const title = ref('  ')
const tab = ref('')
const unfitDirectInput = ref(false)
const complete = ref(false)
const content1 = ref('')
const content2 = ref('')
const search = ref('N');

/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  VEND_CD: '',
  EMP_NO: '',
  VEND_NAME: '',
  IDX_SEQ: '',
  YEAR: '',
  VEND_CD: '',
  VEND_NM: '',
  EMP_NO: '',
  KOR_NM: '',
  PRE_JOB: '',
  BIRTH_DAY: '',
  SEX: '',
  JOIN_DT: '',
  STATURE: '',
  WEIGHT: '',
  BMI: '',
  SMOKE_YN: '',
  SMOKE_FRE: '',
  SMOKE_AMT: '',
  SMOKE_DESC: '',
  DRUNK_YN: '',
  DRUNK_FRE: '',
  DRUNK_AMT: '',
  DRUNK_TYPE: '',
  DRUNK_DESC: '',
  EXRC_YN: '',
  EXRC_FRE: '',
  EXRC_AMT: '',
  EXRC_TYPE: '',
  EXRC_DESC: '',
  MEAL_FRE: '',
  MEAL_AMT: '',
  MEAL_DESC: '',
  SLEEP_AMT: '',
  SLEEP_DESC: '',
  FAMILY_YN: '',
  FAMILY_REL: '',
  FAMILY_NM: '',
  FAMILY_OCC: '',
  FAMILY_DESC: '',
  ALE_YN: '',
  ALE_NM: '',
  ALE_OCC: '',
  ALE_DESC: '',
  PAST_YN: '',
  PAST_DT: '',
  PAST_NM: '',
  PAST_RESULT: '',
  SURG_YN: '',
  SURG_DT: '',
  SURG_NM: '',
  SURG_RESULT: '',
  UNDER_YN: '',
  UNDER_DT: '',
  UNDER_DESC: '',
  UNDER_RESULT: '',
  SICK_YN: '',
  SICK_DT: '',
  SICK_DESC: '',
  SICK_RESULT: '',
  PILL_YN: '',
  PILL_DT: '',
  PILL_DESC: '',
  PILL_RESULT: '',
  STRESS_YN: '',
  STRESS_DT: '',
  STRESS_RESULT: '',
  PWORK_YN: '',
  PWORK_DESC: '',
  UNFIT_RES_NAME: '',
  WORK_SWITCH_YN: '',
  SWITCH_WORK: '',
  SWITCH_DESC: '',
  WORK_TIME: '',
  WORK_MNG: '',
  MEDI_TRM: '',
  MEDI_CYCLE: '',
  HEALTH_CARE: '',
  PROTECT: '',
  ATC: '',
  STD_CONFIRM_YN: '',
  AFT_CONFIRM_YN: '',
  TIME_ETC: '',
  MNG_ETC: '',
  TRM_ETC: '',
  CYCLE_ETC: '',
  CARE_ETC: '',
  PROTECT_ETC: '',
  YYYYMMDD: '',
  HHMM: '',
  SAVE_YN:'N'
})

const codeList = reactive({
  WORK_TIME: [],
  WORK_MNG: [],
  MEDI_TRM: [],
  MEDI_CYCLE: [],
  HEALTH_CARE: [],
  PROTECT: [],
})

const workTimeModel = ref(searchParams.WORK_TIME)
const workMngModel = ref(searchParams.WORK_MNG ? searchParams.WORK_MNG.split(',') : [])
const mediTrmModel = ref(searchParams.MEDI_TRM ? searchParams.MEDI_TRM.split(',') : [])
const mediCycleModel = ref(searchParams.MEDI_CYCLE)
const healthCareModel = ref(searchParams.HEALTH_CARE ? searchParams.HEALTH_CARE.split(',') : [])
const protectModel = ref(searchParams.PROTECT ? searchParams.PROTECT.split(',') : [])

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIR020'),
    getCodeList('HHIR030'),
    getCodeList('HHIR040'),
    getCodeList('HHIR050'),
    getCodeList('HHIR060'),
    getCodeList('HHIR070')
  ]).then((res) => {

    codeList.WORK_TIME = res[0].ORESULT_CUR
    codeList.WORK_MNG = res[1].ORESULT_CUR
    codeList.MEDI_TRM = res[2].ORESULT_CUR
    codeList.MEDI_CYCLE = res[3].ORESULT_CUR
    codeList.HEALTH_CARE = res[4].ORESULT_CUR
    codeList.PROTECT = res[5].ORESULT_CUR
  })
}

const openPopup = (param, type) => {
  initCodeList()
  if(!isEmpty(param)) {
    searchParams.CMPNY_DIV = param.CMPNY_DIV
    searchParams.VEND_CD = param.VEND_CD
    searchParams.VEND_NM = param.VEND_NM
    searchParams.IDX_SEQ = param.IDX_SEQ
    searchParams.EMP_NO = param.EMP_NO
    searchParams.KOR_NM = param.EMP_NM
    searchParams.YEAR = param.YEAR
    searchParams.JOIN_DT = param.COM_ENT_DATE
    searchParams.SEX = param.PLAN_SEX
    searchParams.SAVE_YN = 'N'
    
      // commonSearchApi({ queryId: 'HLTKC0020_SEARCH_05', param: searchParams }).then(r => {
      //   if (r.ORESULT_CUR.length !== 0) {
      //     searchParams.IDX_SEQ = r.ORESULT_CUR[0].IDX_SEQ
      //     getData(param)
      //   } else { 
      //     if(r.ORESULT_CUR2.length !== 0) {
      //       for (let key in r.ORESULT_CUR2[0]) {
      //         if (searchParams.hasOwnProperty(key)) {
      //           searchParams[key] = r.ORESULT_CUR2[0][key]
      //         }
      //       }
      //     } 
    searchParams.IDX_SEQ = isEmpty(searchParams.IDX_SEQ) ? 1 : searchParams.IDX_SEQ + 1
    searchParams.YYYYMMDD = dayjs().format('YYYY-MM-DD')
    searchParams.HHMM = dayjs().format('HH:mm')
    searchParams.UNFIT_RES_NAME = param.UNFIT_RES_NAME
    searchParams.BIRTH_DAY = param.BIRTH_DAY + ' 만(' + param.AGE_INT + ')세'

    workTimeModel.value = searchParams.WORK_TIME
    workMngModel.value = searchParams.WORK_MNG ? searchParams.WORK_MNG.split(',') : []
    mediTrmModel.value = searchParams.MEDI_TRM ? searchParams.MEDI_TRM.split(',') : []
    mediCycleModel.value = searchParams.MEDI_CYCLE
    healthCareModel.value = searchParams.HEALTH_CARE ? searchParams.HEALTH_CARE.split(',') : []
    protectModel.value = searchParams.PROTECT ? searchParams.PROTECT.split(',') : []

      //   }
      // })
  } else { 
    searchParams.VEND_CD = ''
    searchParams.VEND_NM = ''
    searchParams.IDX_SEQ = ''
    searchParams.EMP_NO  = ''
    searchParams.YEAR = '' 
  }
  unfitDirectInput.value = false
  // getMainData()
  dialog.value = true
}

// const getData = (param) => {
//   commonSearchApi({ queryId: 'HLTKC0020_SEARCH_03', param: searchParams }).then(res => {
//     if(res.ORESULT_CUR.length !== 0) {
//       if(res.ORESULT_CUR[0].STD_CONFIRM_YN != 'Y') {
//         res.ORESULT_CUR[0].BIRTH_DAY = param.BIRTH_DAY 
//         res.ORESULT_CUR[0].UNFIT_RES_NAME = param.UNFIT_RES_NAME
//       }
//       for (let key in res.ORESULT_CUR[0]) {
//         if (searchParams.hasOwnProperty(key)) {
//           searchParams[key] = res.ORESULT_CUR[0][key]
//         }
//       }

//       if(searchParams.STD_CONFIRM_YN == 'Y' && searchParams.AFT_CONFIRM_YN == 'Y') {
//         // menuTitle.value.disableBtn('btnTemporaryStorage', true)
//         menuTitle.value.disableBtn('btnCompleteSAF', true)
//         complete.value = true
//       } 

//       workTimeModel.value = searchParams.WORK_TIME
//       workMngModel.value = searchParams.WORK_MNG ? searchParams.WORK_MNG.split(',') : []
//       mediTrmModel.value = searchParams.MEDI_TRM ? searchParams.MEDI_TRM.split(',') : []
//       mediCycleModel.value = searchParams.MEDI_CYCLE
//       healthCareModel.value = searchParams.HEALTH_CARE ? searchParams.HEALTH_CARE.split(',') : []
//       protectModel.value = searchParams.PROTECT ? searchParams.PROTECT.split(',') : []
//     } 
//   })
// }
// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {

    if(isEmpty(searchParams.EMP_NO)) {
      return Message.warn(t('저장할 인원을 선택하여 주십시오.'))
    }
    saveData()
  } 
  // else if (btn.id === 'btnTemporaryStorage') {
  //   searchParams.STD_CONFIRM_YN = 'N'
  //   searchParams.AFT_CONFIRM_YN = 'N'
  //   new saveFlowHelper(vm, t)
  //     .setConfirmMessage('임시저장 하시겠습니까?')
  //     .setBefore(beforeSave)
  //     .setQuery(saveData)
  //     .setAfter(afterSaveData)
  //     .run()
  // } 
  else if (btn.id === 'btnCompleteSAF') {
    searchParams.STD_CONFIRM_YN = 'Y'
    searchParams.AFT_CONFIRM_YN = 'Y'
    new saveFlowHelper(vm, t)
      .setConfirmMessage('작성완료 하시겠습니까? 이후 수정이 불가능합니다.')
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
  // else if (btn.id === 'btnPrint') {
  //   const tableClone1 = content1.value.cloneNode(true)
  //   const tableClone2 = content2.value.cloneNode(true)
    
  //   const commonTable = (table) => {
  //     table.querySelectorAll('.non-excel').forEach(el => el.remove())
  //     const inputs = table.querySelectorAll('input')
  //     inputs.forEach((input) => {
  //       input.setAttribute('value', input.value) // 최신 입력값을 value 속성에 설정
  //     })

  //     // 라디오버튼
  //     const radioGroups = {}
  //     const radios = table.querySelectorAll('input[type="radio"]')
  //     radios.forEach((radio) => {
  //       const name = radio.name
  //       if (!radioGroups[name]) radioGroups[name] = []

  //       radioGroups[name].push(radio)
  //     })

  //     Object.values(radioGroups).forEach((group) => {
  //       const checked = group.find(radio => radio.checked)
  //       const td = checked?.closest('td')
  //       if (checked && td) {
  //         const label = td.querySelector(`label[for="${checked.id}"]`)
  //         const labelText = label ? label.textContent.trim() : checked.value
  //         td.textContent = labelText // 라디오 텍스트만 표시
  //       }
  //     })

  //     //체크박스
  //     const checkBox = table.querySelectorAll('.checkbox-group')
  //     checkBox.forEach(group => {
  //       const codeListName = group.dataset.codeList  // 예: 'list2'
  //       const codeListData = codeList[codeListName]  // 예: codeList.list2

  //       const checkedBoxes = group.querySelectorAll('input[type="checkbox"]:checked');
  //       const selectedCodes = Array.from(checkedBoxes).map(input => input.value);

  //       const selectedLabels = codeListData
  //         .filter(item => selectedCodes.includes(item.COD))
  //         .map(item => item.TXT);

  //       const td = group.closest('td')
  //       if (td) td.textContent = selectedLabels.join(', ')
  //     })
  //   }

  //   commonTable(tableClone1)
  //   commonTable(tableClone2)

  //   // 3. 반영된 HTML 가져오기
  //   let htmlContent = [
  //     {code: tableClone1.outerHTML, name: '기초 건강상담'}, 
  //     {code: tableClone2.outerHTML, name: '사후관리 계획'}
  //   ]

  //   commonRequest2('hse/excel/HLTJB0010_PRINT01', { 
  //       data: { 
  //         htmlCode: htmlContent,
  //         fileId: searchParams.FILE_ID 
  //       }
  //     }).then( async (res) => {
  //     // 헤더에서 파일명 추출
  //     const contentDisposition = res.contentDisposition;
  //     let fileName = `건강관리대상자 사후관리현황 계획등록 ${searchParams.KOR_NM}.xlsx`  // 기본 파일명
  //     if (contentDisposition) {
  //       const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
  //       if (fileNameMatch && fileNameMatch.length === 2) {
  //         fileName = decodeURIComponent(fileNameMatch[1])
  //       }
  //     }
  //     // 파일 다운로드
  //     const blob = new Blob([res], { type: res.type })
  //     const link = document.createElement('a')
  //     link.href = URL.createObjectURL(blob)
  //     link.download = fileName
  //     document.body.appendChild(link)
  //     link.click()
  //     URL.revokeObjectURL(link.href)
  //     document.body.removeChild(link)
  //   })
  // }
}

// 저장 전
const beforeSave = () => {
  // 임시저장일 경우에는 그냥 저장해버린다
  if (isEmpty(searchParams.STATURE)) {
    return Message.warn(t('키를 입력하세요'))
  } else if (isEmpty(searchParams.WEIGHT)) {
    return Message.warn(t('몸무게를 입력하세요.'))
  } else if (isEmpty(searchParams.SMOKE_YN)) {
    return Message.warn(t('흡연 여부를 입력하세요.'))
  } else if (isEmpty(searchParams.DRUNK_YN)) {
    return Message.warn(t('음주 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.EXRC_YN)) {
    return Message.warn(t('운동 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.MEAL_FRE) || isEmpty(searchParams.MEAL_AMT)) {
    return Message.warn(t('식사빈도와 식사시간을 선택하세요.'))
  } else if (isEmpty(searchParams.SLEEP_AMT)) {
    return Message.warn(t('하루 수면 시간을 입력하세요.'))
  } else if (isEmpty(searchParams.FAMILY_YN)) {
    return Message.warn(t('가족력 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.ALE_YN)) {
    return Message.warn(t('알레르기 및 특이질환 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.PAST_YN)) {
    return Message.warn(t('과거질환 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.SURG_YN)) {
    return Message.warn(t('수술력 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.UNDER_YN)) {
    return Message.warn(t('기저질환 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.SICK_YN)) {
    return Message.warn(t('아프거나 불편한 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.PILL_YN)) {
    return Message.warn(t('복용중인 약 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.STRESS_YN)) {
    return Message.warn(t('심리적으로 힘든 요인 여부를 선택하세요.'))
  } else if (isEmpty(searchParams.PWORK_YN)) {
    return Message.warn(t('현 작업 지장 여부를 선택하세요.'))
  } 
  // else if (isEmpty(searchParams.WORK_SWITCH_YN)) {
  //   return Message.warn(t('작업전환 여부를 선택하세요.'))
  // } else if (isEmpty(searchParams.WORK_TIME)) {
  //   return Message.warn(t('작업시간 조정 항목을 선택하세요.'))
  // } else if (isEmpty(searchParams.WORK_MNG)) {
  //   return Message.warn(t('작업관리 강화 항목을 선택하세요.'))
  // } else if (isEmpty(searchParams.MEDI_TRM)) {
  //   return Message.warn(t('의학적조치 (치료) 항목을 선택하세요.'))
  // } else if (isEmpty(searchParams.MEDI_CYCLE)) {
  //   return Message.warn(t('의학적조치 (주기) 항목을 선택하세요.'))
  // } else if (isEmpty(searchParams.HEALTH_CARE)) {
  //   return Message.warn(t('건강증진활동 항목을 선택하세요.'))
  // } else if (isEmpty(searchParams.PROTECT)) {
  //   return Message.warn(t('보호구 지급 항목을 선택하세요.'))
  // } 
  return true
}

/* ********** 저장 ********** */
const saveData = () => {  
  return commonExecuteApi({ queryId: 'HLTKC0050_SAVE_04', list: [searchParams] })
}

const afterSaveData = (res) => {
  if(!isEmpty(res)) {
    Message.success(t('성공적으로 저장되었습니다'))
    search.value='Y';

    let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '개인 건강정보관련 생성했습니다.',
    crudGbn: 'C', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)

    closePopup()
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search',search.value)
  for (let key in searchParams) {
    searchParams[key] = ''
  }

  // menuTitle.value.disableBtn('btnTemporaryStorage', false)
  menuTitle.value.disableBtn('btnCompleteSAF', false)
  complete.value = false
  tab.value = '0'
  workTimeModel.value = ''
  workMngModel.value = []
  mediTrmModel.value = []
  mediCycleModel.value = ''
  healthCareModel.value = []
  protectModel.value = []
  dialog.value = false
}

const isNullSpace = (value) => {
  return isEmpty(value) ? ' ' : value
}

// 라디오 버튼 변경 시 값 초기화 
const initValue = (valList) => {
  if(complete.value) return
  for(let val of valList) {
    searchParams[val] = ''
  }
}

defineExpose({
  openPopup
})

// BMI 계산
watch(() => [searchParams.STATURE, searchParams.WEIGHT], (newValue, oldValue) => {
  if(isEmpty(searchParams.STATURE) || isEmpty(searchParams.WEIGHT)) {
    return
  }
  searchParams.BMI = Math.trunc(searchParams.WEIGHT / Math.pow(searchParams.STATURE / 100, 2) * 100) / 100
})

// 체크박스 단일, 복수선택 
watch(workTimeModel, (newVal) => {
  searchParams.WORK_TIME = newVal
})

watch(workMngModel, (val) => {
  searchParams.WORK_MNG = val.join(',')
})

watch(mediTrmModel, (val) => {
  searchParams.MEDI_TRM = val.join(',')
})

watch(mediCycleModel, (newVal) => {
  searchParams.MEDI_CYCLE = newVal
})

watch(healthCareModel, (val) => {
  searchParams.HEALTH_CARE = val.join(',')
})

watch(protectModel, (val) => {
  searchParams.PROTECT = val.join(',')
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1300"
    height="950"
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
      <span>고령근로자 기초건강정보 입력</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-text class="pa-4 pt-0 content-area" style="height:852px;">
        <v-sheet class="pa-0 h-auto mt-2">
          <v-row align="center" justify="space-between" class="mb-2">
            <v-tabs v-model="tab">
              <v-tab>기초 건강상담</v-tab>
              <v-tab v-if="false">사후관리 계획</v-tab>
            </v-tabs>

            <!-- 오른쪽 정렬 버튼 -->
            <!-- :button-list="['btnTemporaryStorage', 'btnCompleteSAF', 'btnPrint', 'btnClose']" -->
            <IGridTitle
              ref="menuTitle"
              :button-list="['btnCompleteSAF', 'btnClose']"
              @click-button="onButtonsClick"
              :use-permission="false"
            />
            
          </v-row>

          <v-window v-model="tab" style="max-height:800px; overflow-y: auto;">
            <v-window-item eager>
              <div class="pa-4">
                <table ref="content1" border="1" cellspacing="1" cellpadding="5" style="width: 100%; text-align: center;">
                  <thead>
                    <tr>
                      <th class="title1" style="width:150px;">협력사명</th>
                      <th class="title1" style="width:300px;" colspan="2">
                        <div>{{ searchParams.VEND_NM }}</div>
                      </th>
                      <th class="title1" style="width:120px;">일자</th>
                      <th class="title1" style="width:200px;" colspan="2">
                        <div>{{ searchParams.YYYYMMDD }}</div>
                      </th>
                      <th class="title1" style="width:80px;">시간</th>
                      <th class="title1" style="width:200px;" colspan="1">
                        <div>{{ searchParams.HHMM }}</div>
                      </th>
                    </tr>
                    <tr>
                      <td class="title2" colspan="8">인적사항</td>
                    </tr>
                    <tr>
                      <td class="title1">성 명</td>
                      <td colspan="2">
                         <div>{{ searchParams.KOR_NM }}</div>
                      </td>
                      <td class="title1">사번</td>
                      <td colspan="2">
                        <div>{{ searchParams.EMP_NO }}</div>
                      </td>
                      <td class="title1">현재 직무</td>
                      <td colspan="1">
                        <input type="text" v-model="searchParams.PRE_JOB" :readonly="complete" />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="title1">생년월일(나이)</td>
                      <td colspan="2">
                        <input type="text" v-model="searchParams.BIRTH_DAY" readonly/>
                      </td>
                      <td class="title1">성 별</td>
                      <td colspan="2">
                        <v-radio-group inline v-model="searchParams.SEX" :readonly="complete" class="ml-3">
                          <v-radio label="남" value="M"></v-radio>
                          <v-radio label="여" value="W"></v-radio>
                        </v-radio-group>
                      </td>
                      <td class="title1">입사일</td>
                      <td colspan="1">
                        <input type="date" v-model="searchParams.JOIN_DT" :readonly="complete"/>
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">키</td>
                      <td colspan="2">
                        <input type="text" v-model="searchParams.STATURE" :readonly="complete"/>
                      </td>
                      <td class="title1">몸무게</td>
                      <td colspan="2">
                        <input type="text" v-model="searchParams.WEIGHT" :readonly="complete"/>
                      </td>
                      <td class="title1">BMI</td>
                      <td colspan="1">
                        <!-- bmi자동계산 -->
                        <input type="text" v-model="searchParams.BMI" readonly/>
                      </td>
                    </tr>
                    <tr>
                      <td class="title2" colspan="8">상담 내용</td>
                    </tr>
                    <tr>
                      <td class="title2">생활 습관</td>
                      <td class="title1">여부</td>
                      <td class="title1">빈도</td>
                      <td class="title1">양</td>
                      <td class="title1">종류</td>
                      <td class="title1" colspan="3">비고</td>
                    </tr>
                    <tr>
                      <td class="title1">흡연</td>
                      <td>
                        <v-radio-group inline @change="initValue(['SMOKE_FRE', 'SMOKE_AMT', 'SMOKE_DESC'])" :readonly="complete" v-model="searchParams.SMOKE_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>( <input type="number" v-model="searchParams.SMOKE_FRE" min="0" max="99" style="width: 30px" :readonly="searchParams.SMOKE_YN != 'Y' || complete"/> )회/일</td>
                      <td>( <input type="number" v-model="searchParams.SMOKE_AMT" min="0" max="99" style="width: 40px" :readonly="searchParams.SMOKE_YN != 'Y' || complete"/> )개피/일</td>
                      <td>-</td>
                      <td colspan="3">
                        <v-text-field
                          v-model="searchParams.SMOKE_DESC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.SMOKE_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">음주</td>
                      <td>
                        <v-radio-group inline @change="initValue(['DRUNK_FRE', 'DRUNK_AMT', 'DRUNK_DESC', 'DRUNK_TYPE'])" :readonly="complete" v-model="searchParams.DRUNK_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>( <input type="number" v-model="searchParams.DRUNK_FRE" min="0" max="99" style="width: 30px" :readonly="searchParams.DRUNK_YN != 'Y' || complete"/> )회/주</td>
                      <td>( <input type="number" v-model="searchParams.DRUNK_AMT" min="0" max="99" style="width: 40px" :readonly="searchParams.DRUNK_YN != 'Y' || complete"/> )잔/회</td>
                      <td>
                        <v-radio-group inline v-model="searchParams.DRUNK_TYPE" class="d-flex justify-center" :readonly="searchParams.DRUNK_YN != 'Y' || complete">
                          <v-radio label="소주" value="A"></v-radio>
                          <v-radio label="맥주" value="B"></v-radio>
                          <v-radio label="기타" value="C"></v-radio>
                        </v-radio-group>
                      </td>
                      <td colspan="3">
                        <v-text-field
                          v-model="searchParams.DRUNK_DESC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.DRUNK_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">운동</td>
                      <td>
                        <v-radio-group inline @change="initValue(['EXRC_FRE', 'EXRC_AMT', 'EXRC_DESC', 'EXRC_TYPE'])" :readonly="complete" v-model="searchParams.EXRC_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>( <input type="number" v-model="searchParams.EXRC_FRE" min="0" maxlenth="3" style="width: 30px" :readonly="searchParams.EXRC_YN != 'Y' || complete"/> )회/주</td>
                      <td>( <input type="number" v-model="searchParams.EXRC_AMT" min="0" max="60" style="width: 40px" :readonly="searchParams.EXRC_YN != 'Y' || complete"/> )분/회</td>
                      <td>
                        <v-text-field
                          v-model="searchParams.EXRC_TYPE"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.EXRC_YN != 'Y' || complete"
                        />
                      </td>
                      <td colspan="3">
                        <v-text-field
                          v-model="searchParams.EXRC_DESC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.EXRC_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">식사</td>
                      <td>-</td>
                      <td>( <input type="number" v-model="searchParams.MEAL_FRE" :readonly="complete" min="0" maxlength="2" style="width: 30px"/> )회/일</td>
                      <td class="title1">식사 시간</td>
                      <td>( <input type="number" v-model="searchParams.MEAL_AMT" :readonly="complete" min="0" max="60" style="width: 50px"/> )분/회</td>
                      <td colspan="3">
                        <v-text-field
                          v-model="searchParams.MEAL_DESC"
                          dense
                          outlined
                          width="100%"
                          :readonly="complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">수면</td>
                      <td>-</td>
                      <td>-</td>
                      <td class="title1">하루 수면 시간</td>
                      <td>( <input type="number" v-model="searchParams.SLEEP_AMT" :readonly="complete" min="0" max="24" style="width: 50px"/> )시간/일</td>
                      <td colspan="3">
                        <v-text-field
                          v-model="searchParams.SLEEP_DESC"
                          :readonly="complete"
                          dense
                          outlined
                          width="100%"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title2">가족력 및 특이질환</td>
                      <td class="title1">유무</td>
                      <td class="title1">관계</td>
                      <td class="title1">질환명</td>
                      <td class="title1">발생시점</td>
                      <td class="title1" colspan="3">비고</td>
                    </tr>
                    <tr>
                      <td class="title1">가족력<br>(고혈압, 당뇨, 뇌심혈관 질환, 기타)</td>
                      <td>
                        <v-radio-group inline @change="initValue(['FAMILY_FRE', 'FAMILY_AMT', 'FAMILY_DESC', 'FAMILY_OCC'])" :readonly="complete" v-model="searchParams.FAMILY_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>
                        <v-text-field
                          v-model="searchParams.FAMILY_REL"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.FAMILY_YN != 'Y' || complete"
                        />
                      </td>
                      <td>
                        <v-text-field
                          v-model="searchParams.FAMILY_NM"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.FAMILY_YN != 'Y' || complete"
                        />
                      </td>
                      <td>
                        <v-text-field
                          v-model="searchParams.FAMILY_OCC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.FAMILY_YN != 'Y' || complete"
                        />
                      </td>
                      <td colspan="3">
                        <v-text-field
                          v-model="searchParams.FAMILY_DESC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.FAMILY_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">알레르기 및 특이 질환</td>
                      <td>
                        <v-radio-group inline @change="initValue(['ALE_NM', 'ALE_OCC', 'ALE_DESC'])" :readonly="complete" v-model="searchParams.ALE_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>-</td>
                      <td>
                        <v-text-field
                          v-model="searchParams.ALE_NM"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.ALE_YN != 'Y' || complete"
                        />
                      </td>
                      <td>
                        <v-text-field
                          v-model="searchParams.ALE_OCC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.ALE_YN != 'Y' || complete"
                        />
                      </td>
                      <td colspan="3">
                        <v-text-field
                          v-model="searchParams.ALE_DESC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.ALE_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title2">과거</td>
                      <td class="title1">유무</td>
                      <td class="title1">발생시점</td>
                      <td class="title1">질환/수술명</td>
                      <td class="title1" colspan="4">경과</td>
                    </tr>
                    <tr>
                      <td class="title1">과거 질환</td>
                      <td>
                        <v-radio-group inline @change="initValue(['PAST_DT', 'PAST_NM', 'PAST_RESULT'])" :readonly="complete" v-model="searchParams.PAST_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>
                        <input type="date" v-model="searchParams.PAST_DT" :readonly="searchParams.PAST_YN != 'Y' || complete"/>
                      </td>
                      <td>
                        <v-text-field
                          v-model="searchParams.PAST_NM"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.PAST_YN != 'Y' || complete"
                        />
                      </td>
                      <td colspan="4">
                        <v-text-field
                          v-model="searchParams.PAST_RESULT"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.PAST_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">수술력</td>
                      <td>
                        <v-radio-group inline @change="initValue(['SURG_DT', 'SURG_NM', 'SURG_RESULT'])" :readonly="complete" v-model="searchParams.SURG_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>
                        <input type="date" v-model="searchParams.SURG_DT" :readonly="searchParams.SURG_YN != 'Y' || complete"/>
                      </td>
                      <td>
                        <v-text-field
                          v-model="searchParams.SURG_NM"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.SURG_YN != 'Y' || complete"
                        />
                      </td>
                      <td colspan="4">
                        <v-text-field
                          v-model="searchParams.SURG_RESULT"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.SURG_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title2">현재</td>
                      <td class="title1">유무</td>
                      <td class="title1">발생시점</td>
                      <td class="title1">내용</td>
                      <td class="title1" colspan="4">경과</td>
                    </tr>
                    <tr>
                      <td class="title1">기저 질환<br>(고혈압, 당뇨, 뇌심혈관 질환, 기타)</td>
                      <td>
                        <v-radio-group inline @change="initValue(['UNDER_DT', 'UNDER_NM', 'UNDER_RESULT'])" :readonly="complete" v-model="searchParams.UNDER_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>
                        <input type="date" v-model="searchParams.UNDER_DT" :readonly="searchParams.UNDER_YN != 'Y' || complete"/>
                      </td>
                      <td>
                        <v-text-field
                          v-model="searchParams.UNDER_DESC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.UNDER_YN != 'Y' || complete"
                        />
                      </td>
                      <td colspan="4">
                        <v-text-field
                          v-model="searchParams.UNDER_RESULT"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.UNDER_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">주로 아프거나<br> 불편한 부위</td>
                      <td>
                        <v-radio-group inline @change="initValue(['SICK_DT', 'SICK_DESC', 'SICK_RESULT'])" :readonly="complete" v-model="searchParams.SICK_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>
                        <input type="date" v-model="searchParams.SICK_DT" :readonly="searchParams.SICK_YN != 'Y' || complete"/>
                      </td>
                      <td>
                        <v-text-field
                          v-model="searchParams.SICK_DESC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.SICK_YN != 'Y' || complete"
                        />
                      </td>
                      <td colspan="4">
                        <v-text-field
                          v-model="searchParams.SICK_RESULT"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.SICK_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">복용 중인 약</td>
                      <td>
                        <v-radio-group inline @change="initValue(['PILL_DT', 'PILL_DESC', 'PILL_RESULT'])" :readonly="complete" v-model="searchParams.PILL_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>
                        <input type="date" v-model="searchParams.PILL_DT" :readonly="searchParams.PILL_YN != 'Y' || complete"/>
                      </td>
                      <td>
                        <v-text-field
                          v-model="searchParams.PILL_DESC"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.PILL_YN != 'Y' || complete"
                        />
                      </td>
                      <td colspan="4">
                        <v-text-field
                          v-model="searchParams.PILL_RESULT"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.PILL_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title1">심리적으로 힘든 요인<br>(스트레스)</td>
                      <td>
                        <v-radio-group inline @change="initValue(['STRESS_DT', 'STRESS_RESULT'])" :readonly="complete" v-model="searchParams.STRESS_YN" class="d-flex justify-center">
                          <v-radio label="예" value="Y"></v-radio>
                          <v-radio label="아니오" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>
                        <input type="date" v-model="searchParams.STRESS_DT" :readonly="searchParams.STRESS_YN != 'Y' || complete"/>
                      </td>
                      <td colspan="5">
                        <v-text-field
                          v-model="searchParams.STRESS_RESULT"
                          dense
                          outlined
                          width="100%"
                          :readonly="searchParams.STRESS_YN != 'Y' || complete"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td class="title2">현 작업 지장 여부<br>(본인 주관적 판단)</td>
                      <td colspan="7" >
                        <div>
                          <v-radio-group inline @change="initValue(['PWORK_DESC'])" :readonly="complete" v-model="searchParams.PWORK_YN" class="d-flex justify-center">
                            <v-radio label="예" value="Y"></v-radio>
                            <v-radio label="아니오" value="N"></v-radio>
                          </v-radio-group>
                        </div>
                        <div>
                          <v-text-field
                            v-model="searchParams.PWORK_DESC"
                            dense
                            outlined
                            label="직접 입력"
                            :readonly="searchParams.PWORK_YN != 'Y' || complete"
                            width="100%"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </v-window-item>
            <v-window-item eager>
              <div class="pa-4">
                <table ref="content2" border="1" cellspacing="1" cellpadding="5" style="width: 100%; text-align: center;">
                  <thead>
                    <tr style="background-color: #d9d9d9;">
                      <th>협력사명</th>
                      <th colspan="2">
                        {{ searchParams.VEND_NM }}
                      </th>
                      <th>일자</th>
                      <th colspan="2">
                        {{ searchParams.YYYYMMDD }}
                      </th>
                      <th>시간</th>
                      <th colspan="1">
                        {{ searchParams.HHMM }}
                      </th>
                    </tr>
                    <tr style="background-color: #d9d9d9;">
                      <td colspan="8">인적사항</td>
                    </tr>
                    <tr>
                      <td>성 명</td>
                      <td colspan="2">
                        {{ searchParams.KOR_NM }}
                      </td>
                      <td>사번</td>
                      <td colspan="2">
                        {{ searchParams.EMP_NO }}
                      </td>
                      <td>현재 직무</td>
                      <td colspan="1">
                        <input type="text" v-model="searchParams.PRE_JOB" :readonly="complete" />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>생년월일(나이)</td>
                      <td colspan="2">
                        {{ searchParams.BIRTH_DAY }}
                      </td>
                      <td>성 별</td>
                      <td colspan="2">
                        <v-radio-group inline v-model="searchParams.SEX" :readonly="complete"  class="ml-3">
                          <v-radio label="남" value="M"></v-radio>
                          <v-radio label="여" value="F"></v-radio>
                        </v-radio-group>
                      </td>
                      <td>입사일</td>
                      <td colspan="1">
                        <input type="date" v-model="searchParams.JOIN_DT" :readonly="complete" />
                      </td>
                    </tr>
                    <tr>
                      <td>키</td>
                      <td colspan="2">
                        <input type="text" v-model="searchParams.STATURE" :readonly="complete" />
                      </td>
                      <td>몸무게</td>
                      <td colspan="2">
                        <input type="text" v-model="searchParams.WEIGHT" :readonly="complete" />
                      </td>
                      <td>BMI</td>
                      <td colspan="1">
                        <!-- bmi자동계산 -->
                        <input type="text" v-model="searchParams.BMI" readonly/>
                      </td>
                    </tr>
                    <tr style="background-color: #d9d9d9;">
                      <td colspan="8">건강관리 항목</td>
                    </tr>
                    <tr>
                      <td colspan="8">
                        <div style="display: flex; gap: 12px; padding-left: 10px; align-items: center;">
                          <v-checkbox
                            class="non-excel"
                            v-model="unfitDirectInput"
                            label="직접입력"
                            :true-value="true"
                            :false-value="false"
                            hide-details
                            density="compact"
                          />
                          <v-text-field
                            v-model="searchParams.UNFIT_RES_NAME"
                            :readonly="!unfitDirectInput || complete"
                            dense
                            outlined
                            style="flex: 1;"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr style="background-color: #d9d9d9;">
                      <td colspan="8">사후관리 계획</td>
                    </tr>

                    <tr>
                      <td rowspan="2">작업 전환</td>
                      <td colspan="7" class="left-align">
                        <v-radio-group inline @change="initValue(['SWITCH_WORK', 'SWITCH_DESC'])" :readonly="complete" v-model="searchParams.WORK_SWITCH_YN" class="d-flex">
                          <v-radio label="있음" value="Y"></v-radio>
                          <v-radio label="없음" value="N"></v-radio>
                        </v-radio-group>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="7" class="left-align">
                        <div>
                          변경된 작업 ( <input type="text" v-model="searchParams.SWITCH_WORK" :readonly="searchParams.WORK_SWITCH_YN != 'Y' || complete"/> )
                        </div>
                        <div>
                          변경 사유 ( <input type="text" v-model="searchParams.SWITCH_DESC" :readonly="searchParams.WORK_SWITCH_YN != 'Y' || complete"/> )
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>작업 시간 조정</td>
                      <td colspan="7" class="left-align">
                        <div class="checkbox-group" data-code-list="WORK_TIME">
                          <v-checkbox
                            v-for="(item, idx) in codeList.WORK_TIME"
                            :key="idx"
                            :disabled="complete"
                            v-model="workTimeModel"
                            :label="item.TXT"
                            :value="item.COD"
                            :true-value="item.COD"
                            :false-value="null"
                            hide-details
                            density="compact"
                          />
                        </div>
                        <div v-if="searchParams.WORK_TIME === 'E'" class="d-flex items-center gap-1" style="padding-left: 10px;">
                          <span>기타입력: (</span>
                            <input
                              type="text"
                              v-model="searchParams.TIME_ETC"
                              style="width:300px;"
                              class="etc-input"
                              data-code-list="list1"
                              :readonly="complete"
                            />
                          <span>)</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>작업 관리 강화<br><div style="color: red;">(고령자 필수)</div></td>
                      <td colspan="7" class="left-align">
                        <div class="checkbox-group" data-code-list="WORK_MNG">
                          <v-checkbox
                            v-for="(item, idx) in codeList.WORK_MNG"
                            :key="idx"
                            :disabled="complete"
                            v-model="workMngModel"
                            :label="item.TXT"
                            :value="item.COD"
                            :true-value="item.COD"
                            :false-value="null"
                            hide-details
                            density="compact"
                          />
                        </div>
                        <div v-if="searchParams.WORK_MNG === 'F' || workMngModel.includes('F')" class="d-flex items-center gap-1" style="padding-left: 10px;">
                          <span>기타입력: (</span>
                          <input
                            type="text"
                            v-model="searchParams.MNG_ETC"
                            style="width:300px;"
                            class="etc-input"
                            data-code-list="list2"
                            :readonly="complete"
                          />
                          <span>)</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td rowspan="2">의학적 조치</td>
                      <td colspan="7" class="left-align">
                        <div class="checkbox-group" data-code-list="MEDI_TRM">
                          <v-checkbox
                            v-for="(item, idx) in codeList.MEDI_TRM"
                            :key="idx"
                            :disabled="complete"
                            v-model="mediTrmModel"
                            :label="item.TXT"
                            :value="item.COD"
                            :true-value="item.COD"
                            :false-value="null"
                            hide-details
                            density="compact"
                          />
                        </div>
                        <div v-if="searchParams.MEDI_TRM === 'G' || mediTrmModel.includes('G')" class="d-flex items-center gap-1" style="padding-left: 10px;">
                          <span>기타입력: (</span>
                          <input
                            type="text"
                            v-model="searchParams.TRM_ETC"
                            style="width:300px;"
                            class="etc-input"
                            data-code-list="list3"
                            :readonly="complete"
                          />
                          <span>)</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="7" class="left-align">
                        <div class="checkbox-group" data-code-list="MEDI_CYCLE">
                          <v-checkbox
                            v-for="(item, idx) in codeList.MEDI_CYCLE"
                            :key="idx"
                            :disabled="complete"
                            v-model="mediCycleModel"
                            :label="item.TXT"
                            :value="item.COD"
                            :true-value="item.COD"
                            :false-value="null"
                            hide-details
                            density="compact"
                          />
                        </div>
                        <div v-if="searchParams.MEDI_CYCLE === 'E'" class="d-flex items-center gap-1" style="padding-left: 10px;">
                          <span>기타입력: (</span>
                          <input
                            type="text"
                            v-model="searchParams.CYCLE_ETC"
                            style="width:300px;"
                            class="etc-input"
                            data-code-list="list4"
                            :readonly="complete"
                          />
                          <span>)</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>건강증진활동</td>
                      <td colspan="7" class="left-align">
                        <div class="checkbox-group" data-code-list="HEALTH_CARE">
                          <v-checkbox
                            v-for="(item, idx) in codeList.HEALTH_CARE"
                            :key="idx"
                            :disabled="complete"
                            v-model="healthCareModel"
                            :label="item.TXT"
                            :value="item.COD"
                            :true-value="item.COD"
                            :false-value="null"
                            hide-details
                            density="compact"
                          />
                        </div>
                        <div v-if="searchParams.HEALTH_CARE === 'F' || healthCareModel.includes('F')" class="d-flex items-center gap-1" style="padding-left: 10px;">
                          <span>기타입력: (</span>
                          <input
                            type="text"
                            v-model="searchParams.CARE_ETC"
                            style="width:300px;"
                            class="etc-input"
                            data-code-list="list5"
                            :readonly="complete"
                          />
                          <span>)</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>보호구 지급</td>
                      <td colspan="7" class="left-align">
                        <div class="checkbox-group" data-code-list="PROTECT">
                          <v-checkbox
                            v-for="(item, idx) in codeList.PROTECT"
                            :key="idx"
                            :disabled="complete"
                            v-model="protectModel"
                            :label="item.TXT"
                            :value="item.COD"
                            :true-value="item.COD"
                            :false-value="null"
                            hide-details
                            density="compact"
                          />
                        </div>
                        <div v-if="searchParams.PROTECT === 'J' || protectModel.includes('J')" class="d-flex items-center gap-1" style="padding-left: 10px;">
                          <span>기타입력: (</span>
                          <input
                            type="text"
                            v-model="searchParams.PROTECT_ETC"
                            style="width:300px;"
                            class="etc-input"
                            data-code-list="list6"
                            :readonly="complete"
                          />
                          <span>)</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>기타</td>
                      <td colspan="7" class="left-align">
                        <v-text-field
                          v-model="searchParams.ATC"
                          :readonly="complete"
                          dense
                          outlined
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </v-window-item>
          </v-window>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.checkbox-group {
  --v-disabled-opacity: 1;
  display: flex;
  justify-content: left;
  align-items: left;
  gap: 12px;
  height: 100%;
}

th {
  padding: 6px;
  border: 1px solid #ccc;
  background-color: #f4f5f9;
}

.left-align {
  text-align: left;
}

td {
  padding: 6px;
  font-weight: 400;
  border: 1px solid #ccc;
  text-align: center;
  font-size: 13px;
}

.title1 {
  background-color: #f4f5f9;
  font-weight: 500;
  font-size: 14px;
}

.title2 {
  background-color: #d9d9d9;
  font-weight: bold;
  font-size: 14px;
}
</style>

