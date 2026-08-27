<!--
  화면명 : 업무상질병 사업주조사서
  화면개요 : 업무상질병 사업주 조사서
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted, nextTick } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
// import Tab01 from '@/pages/100_health/HLT_J/HLTJB0010Popup03Popup02_Tab01.vue'
import Tab02 from '@/pages/100_health/HLT_J/HLTJB0010Popup03Popup02_Tab02.vue'
import Tab03 from '@/pages/100_health/HLT_J/HLTJB0010Popup03Popup02_Tab03.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
// const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
const carouselSlide = ref(0)
const searchTab2 = ref(false)
const searchTab3 = ref(false)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  BIRTH_DAY: '', // 생일
  HLD_OFFI_GBN: '', // 재직구분
  BSNS_NM: '', // 사업부
  DEPT_NM: '', // 부서
  ASGN_NM: '', // 과
  STD_DUTY_NM: '', // 직종
  JOB_TIT_NM: '', // 직위
  COM_ENT_DATE: '', // 입사일자
  RETI_DATE: '', // 휴,퇴직일
  APPLI_GUBUN: '', // 신청구분
  APPLI_GUBUN_NM: '', // 신청구분명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  BODY1_CODE: '', // 신체부위1
  BODY1_NM: '', //신체부위1 명
  BODY2_CODE: '', // 신체부위2
  BODY2_NM: '', //신체부위2 명
  DIAGNOSIS_DATE: '', // 진단일
  DISEASE_CODE: '', // 상병코드 (PK)
  DISEASE_NM: '', // 상병명
  APPLI_DATE: '', // 진정일(pk)
  INCIDENT_CODE: '', // 발생경위 코드
  INCIDENT_NM: '', // 발생경위
  NOTIFY_FILE_ID: '', // 사실통지서
  WORK_YEAR: '',
  REMARK: '',
  OVERTIME_CNT: '',
  OVERTIME: '',
  OVERTIME_CLOCK: '',
  SPECIAL_CNT: '',
  SPECIAL: '',
  SPECIAL_CLOCK: '',
  DAY_WORK_TIME: '',
  NIGHT_WORKTIME: '',
  DAY_WORK_CNT: '',
  WORK_SHIFT: '',
  SAVE_YN: '',
  FILE_ID: '',
})

// 팝업 OPEN
const openPopup = (param) => {
  for (let key in param) {
    if (searchParams.hasOwnProperty(key)) {
      if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
        searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYYMMDD')
      } else if (key === 'APPLI_DATE' && !isEmpty(param.APPLI_DATE)) {
        searchParams.APPLI_DATE = dayjs(param.APPLI_DATE).format('YYYYMMDD')
      } else if (key === 'BIRTH_DAY' && !isEmpty(param.BIRTH_DAY)) {
        searchParams.BIRTH_DAY = dayjs(param.BIRTH_DAY).format('YYYY-MM-DD')
      } else if (key === 'COM_ENT_DATE' && !isEmpty(param.COM_ENT_DATE)) {
        searchParams.COM_ENT_DATE = dayjs(param.COM_ENT_DATE).format('YYYY-MM-DD')
      } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
        searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD')
      } else {
        searchParams[key] = param[key]
      }
    }
  }
  searchParams.SAVE_YN = 'Y'

  if(isEmpty(searchParams.FILE_ID)) {
    searchParams.FILE_ID = create_UUID()
  }

  carouselSlide.value = 0
  
  // 저장된 사업주 조사서2, 직력확인서 비고 조회
  commonSearchApi({ queryId : 'HLTJB0010_SEARCH_07', param: searchParams }).then(res => {
    if(isEmpty(res.ORESULT_CUR)) {
      searchParams.REMARK = ''
      searchParams.OVERTIME_CNT = ''
      searchParams.OVERTIME = ''
      searchParams.OVERTIME_CLOCK = ''
      searchParams.SPECIAL_CNT = ''
      searchParams.SPECIAL = ''
      searchParams.SPECIAL_CLOCK = ''
      searchParams.DAY_WORK_TIME = ''
      searchParams.NIGHT_WORKTIME = ''
      searchParams.DAY_WORK_CNT = ''
      searchParams.WORK_SHIFT = ''
    } else {
      searchParams.REMARK = res.ORESULT_CUR[0].REMARK
      searchParams.OVERTIME_CNT = res.ORESULT_CUR[0].OVERTIME_CNT
      searchParams.OVERTIME = res.ORESULT_CUR[0].OVERTIME
      searchParams.OVERTIME_CLOCK = res.ORESULT_CUR[0].OVERTIME_CLOCK
      searchParams.SPECIAL_CNT = res.ORESULT_CUR[0].SPECIAL_CNT
      searchParams.SPECIAL = res.ORESULT_CUR[0].SPECIAL
      searchParams.SPECIAL_CLOCK = res.ORESULT_CUR[0].SPECIAL_CLOCK
      searchParams.DAY_WORK_TIME = res.ORESULT_CUR[0].DAY_WORK_TIME
      searchParams.NIGHT_WORKTIME = res.ORESULT_CUR[0].NIGHT_WORKTIME
      searchParams.DAY_WORK_CNT = res.ORESULT_CUR[0].DAY_WORK_CNT
      searchParams.WORK_SHIFT = res.ORESULT_CUR[0].WORK_SHIFT
    }
  })

  getGridData()
  // 해당 값이 false면 탭3를 조회시킨다.
  searchTab3.value = false
  dialog.value = true
}

// FILEID 생성
const create_UUID = () => {
  let dt = new Date().getTime()

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  tab02.value?.initGrid()
  tab03.value?.initGrid()
  searchTab2.value = false
  searchTab3.value = false
  dialog.value = false
}


//이전단계 버튼 이벤트
const preSlide = () => {
  if (carouselSlide.value <= 1 && carouselSlide.value > 0) {
    carouselSlide.value -= 1
  }
  getGridData()
}

//다음단계 버튼 이벤트
const nextSlide =  () => {
  if (carouselSlide.value < 1 && carouselSlide.value >= 0) {
    carouselSlide.value += 1
  }
  getGridData()
}

// grid 데이터 조회
const getGridData = async () => {
  if(carouselSlide.value === 0) {
    if(!searchTab2.value) {
      await nextTick()
      tab02.value?.getGridData()
      searchTab2.value = true
    }
  } else if(carouselSlide.value === 1) {
    if(!searchTab3.value) {
      await nextTick()
      tab03.value?.getGridData()
      searchTab3.value = true
    }
  }
}

const save = () => {
  // const data1 = tab01.value?.getData() || {}
  const data2 = tab02.value?.getData() || {}
  const data3 = tab03.value?.getData() || {}
  const historyData = tab02.value?.getHistoryData()
  vm.$swal({ title: t('저장하시겠습니까?'), showCancelButton: true }).then(async res => {
    if (res.isConfirmed) {
      try {
        await commonExecuteApi({ queryId : 'HLTJB0010_SAVE_07', list: [ data2 ] })
        await commonExecuteApi({ queryId : 'HLTJB0010_SAVE_08', list: data3.WORK_STANDARD_LIST })
        await commonExecuteApi({ queryId : 'HLTJB0010_SAVE_15', list: historyData.grdData1 })
        await commonExecuteApi({ queryId : 'HLTJB0010_SAVE_16', list: historyData.grdData2 })
        await commonExecuteApi({ queryId : 'HLTJB0010_SAVE_17', list: historyData.grdData3 }) 
        Message.info(t('저장되었습니다.'))
        closePopup()
      } catch(ex) {
        console.error(ex)
      }
    }
  })
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1250"
    height="950"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-carousel :show-arrows="false" v-model="carouselSlide" height="100%" hide-delimiter-background hide-delimiters>
      <!-- <v-carousel-item>
        <Tab01 
          ref="tab01" 
          :searchParams="searchParams" 
          @btnCloseClick="closePopup" 
          @btnPrev="preSlide" 
          @btnNext="nextSlide"
          @btnUpdate="save"
        ></Tab01>
      </v-carousel-item> -->
      <v-carousel-item>
        <Tab02 
          ref="tab02" 
          :searchParams="searchParams"
          @btnCloseClick="closePopup"
          @btnPrev="preSlide" 
          @btnNext="nextSlide"
          @btnUpdate="save"
        ></Tab02>
      </v-carousel-item>
      <v-carousel-item>
        <Tab03 
          ref="tab03"
          :searchParams="searchParams" 
          @btnCloseClick="closePopup"
          @btnPrev="preSlide" 
          @btnNext="nextSlide"
          @btnUpdate="save"
        ></Tab03>
      </v-carousel-item>
    </v-carousel>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
