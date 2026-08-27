<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const emit = defineEmits(['saved'])
const dialog = ref(false)
const grdMain = ref(null)
const readonlyValue = reactive({
  COUNT: false, //회 readonly value
  CYCLE: false, //점검주기 readonly value
  PERIOD: false, //점검기간 readonly value
})

const codeList = reactive({
  USE_YN: [
    { TXT: '사용', COD: 'Y' },
    { TXT: '미사용', COD: 'N' },
  ],
  CHECK_CYCLE: [], //점검주기
})
//const radioValue = ref('L')

const title = ref('점검계획등록')

const popupField = reactive({
  BSNS_NM: '', //사업부코드
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서코드
  DEPT_NM: '', //부서
  CHECK_TARGET: '', //점검대상
  CHECK_CYCLE: '', //점검주기
  CHECK_NUMBER: '', //점검횟수
  FROM_DATE: '', //시작일
  TO_DATE: '', //종료일
  USE_YN: 'Y', //사용여부
  CHECK_PLAN_SEQ: '', //점검계획 ID
  radioValue: 'L', //주기,기간 설정 라디오버튼 value
  FROM_DATE_MIN: '', //점검 기간 FROM VALIDATION 값
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else {
    closePopup()
  }
}

//저장관련 로직 시작
const beforeSave = () => {
  if (!popupField.CHECK_TARGET) {
    Message.warn(t('점검대상은 필수입력 입니다.'))
    return false
  } else if (!popupField.CHECK_CYCLE && popupField.radioValue === 'L') {
    Message.warn(t('점검 주기는 필수입력 입니다.'))
    return false
  } else if (!popupField.CHECK_NUMBER) {
    Message.warn(t('점검 횟수는 필수입력 입니다.'))
    return false
  } else if (!popupField.FROM_DATE || !popupField.TO_DATE) {
    Message.warn(t('점검기간은 필수 입력 입니다.'))
    return false
  } else if (!popupField.USE_YN) {
    Message.warn(t('사용 여부는 필수입력 입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: popupField.BSNS_CD,
    DEPT_CD: popupField.DEPT_CD,
    CHECK_PLAN_SEQ: popupField.CHECK_PLAN_SEQ,
    CHECK_TARGET: popupField.CHECK_TARGET,
    CHECK_CYCLE:
      popupField.CHECK_CYCLE === '기간' || !popupField.CHECK_CYCLE
        ? '60'
        : popupField.CHECK_CYCLE,
    CHECK_NUMBER: popupField.CHECK_NUMBER,
    FROM_DATE: popupField.FROM_DATE,
    TO_DATE: popupField.TO_DATE,
    USE_YN: popupField.USE_YN,
    INSERT_USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFCC0010_SAVE01',
    list: saveParam,
  })
}

const afterSave = () => {
  closePopup()
  emit('saved')
}
//저장관련 로직 끝

const initCodeList = () => {
  getCodeList('HHIP010').then((res) => {
    codeList.CHECK_CYCLE = res.ORESULT_CUR.filter((x) => x.COD !== '60')
  })
}

const openPopup = () => {
  dialog.value = true
  popupField.BSNS_NM = userStore.bsnsNm
  popupField.BSNS_CD = userStore.bsnsCd
  popupField.DEPT_NM = userStore.deptNm
  popupField.DEPT_CD = userStore.deptCd
  popupField.radioValue = 'L'
  readonlyValue.CYCLE = false //점검주기 활성화
  readonlyValue.PERIOD = true //점검기간 비활성화
}

const openPopup2 = (rowData) => {
  dialog.value = true
  title.value = '점검계획수정'
  if (rowData.CHECK_CYCLE_NM === '기간') {
    popupField.CHECK_CYCLE = '기간'
    readonlyValue.PERIOD = false
    readonlyValue.CYCLE = true
    popupField.radioValue = 'S'
  } else {
    popupField.radioValue = 'L'
    popupField.CHECK_CYCLE = rowData.CHECK_CYCLE
    readonlyValue.PERIOD = true
    readonlyValue.CYCLE = false
  }
  popupField.BSNS_CD = rowData.BSNS_CD
  popupField.BSNS_NM = rowData.BSNS_NM
  popupField.DEPT_CD = rowData.DEPT_CD
  popupField.DEPT_NM = rowData.DEPT_NM
  popupField.CHECK_TARGET = rowData.CHECK_TARGET
  popupField.CHECK_PLAN_SEQ = rowData.CHECK_PLAN_SEQ
  popupField.CHECK_NUMBER = rowData.CHECK_NUMBER
  popupField.FROM_DATE = rowData.FROM_DATE
  popupField.TO_DATE = rowData.TO_DATE
  popupField.USE_YN = rowData.USE_YN
}

const closePopup = () => {
  //팝업 내부 데이터 초기화
  for (let i in popupField) {
    popupField[i] = ''
  }
  for (let i in readonlyValue) {
    readonlyValue[i] = ''
  }

  //초기화후 데이터 다시 넣어줌
  title.value = '점검계획등록'

  dialog.value = false
}

//주기설정,기간설정 변경 감지
watch(
  () => popupField.radioValue,
  (newValue, oldValue) => {
    //기간설정일경우 점검주기 입력란 disable
    if (newValue === 'S') {
      //기간설정이 단기일경우
      // 2024.07.06 윤찬양책임 요청으로 단기변경시 '회' 디폴트 1
      popupField.CHECK_NUMBER = 1 //단기일때는 점검회 디폴트 1
      let date = dayjs()
      //점검기간 FROM 오늘날짜
      popupField.FROM_DATE =
        date.get('year') +
        '-' +
        (date.get('month') + 1).toString().padStart(2, '0') +
        '-' +
        date.get('date').toString().padStart(2, '0')
      //점검기간은 오늘이전의 날짜는 입력하지 못하도록
      popupField.FROM_DATE_MIN =
        date.get('year') +
        '-' +
        (date.get('month') + 1).toString().padStart(2, '0') +
        '-' +
        date.get('date').toString().padStart(2, '0')
      readonlyValue.COUNT = true //회 비활성화
      readonlyValue.PERIOD = false //점검기간 활성화
      readonlyValue.CYCLE = true //점검주기 비활성화
    } else {
      //주기설정일경우 점검기간 입력란 disable
      //popupField.CHECK_NUMBER = '' //주기설정이면 '회' 빈값
      readonlyValue.CYCLE = false //점검주기 활성화
      readonlyValue.PERIOD = true //점검기간 비활성화
      readonlyValue.COUNT = false //회 비활성화
    }
  },
  {
    immediate: true,
  }
)

watch(
  () => popupField.CHECK_CYCLE,
  (newValue, oldValue) => {
    let day = dayjs()
    //점검주기가 '주'일경우
    if (newValue === '10') {
      let toDay = dayjs(day.format('YYYY-MM-DD').toString())
      let endFlag = 6 - toDay.get('d')
      let weekStart = toDay.subtract(toDay.get('d'), 'day')
      let weekEnd = toDay.add(endFlag, 'day')
      popupField.FROM_DATE =
        weekStart.$y +
        '-' +
        (weekStart.$M + 1).toString().padStart(2, '0') +
        '-' +
        weekStart.$D.toString().padStart(2, '0')
      popupField.TO_DATE =
        weekEnd.$y +
        '-' +
        (weekEnd.$M + 1).toString().padStart(2, '0') +
        '-' +
        weekEnd.$D.toString().padStart(2, '0')
    }
    //점검주기가 '월'일경우
    else if (newValue === '20') {
      popupField.FROM_DATE =
        day.$y + '-' + (day.$M + 1).toString().padStart(2, '0') + '-' + '01'
      popupField.TO_DATE =
        day.$y +
        '-' +
        (day.$M + 1).toString().padStart(2, '0') +
        '-' +
        day.daysInMonth()
    }
    //점검주기가 '분기'일경우
    else if (newValue === '30') {
      let toDayMonth = day.get('M') + 1
      //오늘월이 1~3일경우 1분기 yyyy-01-01 ~ yyyy-03-마지막날
      if (toDayMonth >= 1 && toDayMonth <= 3) {
        let lastDay = dayjs(`${day.$y}-03-01`).daysInMonth()
        popupField.FROM_DATE = day.$y + '-' + '01' + '-' + '01'
        popupField.TO_DATE = day.$y + '-' + '03' + '-' + lastDay.toString()
      }
      //4~6
      else if (toDayMonth >= 4 && toDayMonth <= 6) {
        let lastDay = dayjs(`${day.$y}-06-01`).daysInMonth()
        popupField.FROM_DATE = day.$y + '-' + '04' + '-' + '01'
        popupField.TO_DATE = day.$y + '-' + '06' + '-' + lastDay.toString()
      }
      //7~9
      else if (toDayMonth >= 7 && toDayMonth <= 9) {
        let lastDay = dayjs(`${day.$y}-09-01`).daysInMonth()
        popupField.FROM_DATE = day.$y + '-' + '07' + '-' + '01'
        popupField.TO_DATE = day.$y + '-' + '09' + '-' + lastDay.toString()
      } else {
        //10~12
        let lastDay = dayjs(`${day.$y}-12-01`).daysInMonth()
        popupField.FROM_DATE = day.$y + '-' + '10' + '-' + '01'
        popupField.TO_DATE = day.$y + '-' + '12' + '-' + lastDay.toString()
      }
    }
    //점검주기가 '반기'일경우
    else if (newValue === '40') {
      //오늘월이 7~12월이면 yyyy-07-01 ~ yyyy-12-31까지 설정
      if (day.get('M') + 1 > 6) {
        popupField.FROM_DATE = day.$y + '-' + '07' + '-' + '01'
        popupField.TO_DATE = day.$y + '-' + '12' + '-' + '31'
      } else {
        let lastDay = dayjs(`${day.$y}-06-01`).daysInMonth()
        //오늘월이 1~6월이면 yyyy-01-01 ~ yyyy-06월 말일까지 설정
        popupField.FROM_DATE = day.$y + '-' + '01' + '-' + '01'
        popupField.TO_DATE = day.$y + '-' + '06' + '-' + lastDay.toString()
      }
    }
    //점검주기가 '년'일경우
    else if (newValue === '50') {
      popupField.FROM_DATE = day.$y + '-' + '01' + '-' + '01'
      popupField.TO_DATE = day.$y + '-' + '12' + '-' + '31'
    }
    //점검주기가 기간일경우
    else {
      readonlyValue.PERIOD = false
    }
  }
)

onMounted(() => {
  initCodeList()
})

defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <!-- 2024.07.06 윤찬양책임 요청으로 계획점검등록 팝업 크기 확장 -->
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ title }}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 searchArea">
        <v-sheet>
          <div class="d-flex">
            <i-input
              width="200px"
              :label="$t('사업부')"
              top-label
              required
              readonly
              v-model="popupField.BSNS_NM"
            ></i-input>
            <i-input
              width="200px"
              :label="$t('부서')"
              top-label
              required
              readonly
              v-model="popupField.DEPT_NM"
            ></i-input>
            <i-input
              width="100px"
              class="mt-5"
              readonly
              v-model="popupField.DEPT_CD"
            ></i-input>
            <i-select
              width="100px"
              :items="codeList.USE_YN"
              item-title="TXT"
              item-value="COD"
              :label="$t('사용 여부')"
              top-label
              required
              v-model="popupField.USE_YN"
            ></i-select>
          </div>
          <div class="d-flex mt-2">
            <i-input
              width="540px"
              :label="$t('점검 대상')"
              :placeholder = "$t('※ REPORT 출력시 입력한 내용으로 표지 제목 사용')"
              top-label
              required
              v-model="popupField.CHECK_TARGET"
            ></i-input>
            <span
              style="font-size: 13px; color: blue"
              class="mt-7"
            >※ REPORT 출력시 입력한 내용으로 표지 제목 사용
            </span>
          </div>
          <div class="mt-2">            
            <div>
              <span
                class="form-label pr-2 pt-2"
                :style="{
                  display: 'block',
                  width: '80px',
                  margin: '0 8px 0 0',
                }"
              >
                {{ $t("점검 방식 ") }}
              </span>
              <v-radio-group inline v-model="popupField.radioValue">
                <v-radio label="주기설정(장기)" value="L"></v-radio>
                <v-radio label="기간설정(단기)" value="S"></v-radio>
              </v-radio-group>
            </div>
          </div>
          <div class="d-flex mt-2">
            <i-select
              width="200px"
              :label="$t('점검 주기')"
              top-label
              required
              :items="codeList.CHECK_CYCLE"
              item-title="TXT"
              item-value="COD"
              v-model="popupField.CHECK_CYCLE"
              :disabled="readonlyValue.CYCLE"
            ></i-select>
            <i-input
              :label="$t('회')"
              top-label
              width="100px"
              number
              required
              v-model="popupField.CHECK_NUMBER"
              :disabled="readonlyValue.COUNT"
            ></i-input>
            <i-input
              :label="$t('점검 기간')"
              top-label
              required
              type="date"
              width="150px"
              v-model="popupField.FROM_DATE"
              :disabled="readonlyValue.PERIOD"
              :min="popupField.FROM_DATE_MIN"
            ></i-input>
            <i-input
              width="150px"
              type="date"
              class="mt-5"
              v-model="popupField.TO_DATE"
              :disabled="readonlyValue.PERIOD"
              :min="popupField.FROM_DATE_MIN"
            ></i-input>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
