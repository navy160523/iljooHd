<script setup>
import RealGrid from '@/components/RealGrid.vue'
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@hiway/stores/user'
import Echart from 'vue-echarts'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, commonExecuteApi, chatbotTranslateLn, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import { useRoute, useRouter } from 'vue-router'
import HLTAB0010Tab01Popup01 from '@/pages/100_health/HLT_A/HLTAB0010Tab01_Popup01.vue'
import HLTAB0010Tab01Popup02 from '@/pages/100_health/HLT_A/HLTAB0010Tab01_Popup02.vue'
import HLTAB0010Tab01Popup03 from '@/pages/100_health/HLT_A/HLTAB0010Tab01_Popup03.vue'
import HLTAB0010Tab01Popup04 from '@/pages/100_health/HLT_A/HLTAB0010Tab01_Popup04.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopupSTAN.vue' // 결재 팝업

const emit = defineEmits(['btnSetting', 'subData', 'isCreateView:update'])
const t = useI18n().t //다국어 
const vm = getCurrentInstance().proxy //다이얼로그관련
const echart1 = ref(null)
const router = useRouter()
const userStore = useUserStore()
const popup01 = ref(null)
const popup02 = ref(null)
const popup03 = ref(null)
const popup04 = ref(null)
const approvalPopup = ref(null)
const grdMain = ref(null)
const maxSeq = ref(0)

const props = defineProps({ 
  searchParams: Object,
}) // props 객체를 직접 사용

const searchParams = reactive({
  // 작성자
  USER_DATA: `${userStore.deptNm} / ${userStore.userName} / ${userStore.jobTitNm}`,
  // 위험성 산출일자
  RISK_DATE: dayjs().format('YYYY-MM-DD'),
  CHECK_USER: '',
  // 결재일자
  CHECK_DATE: dayjs().format('YYYY-MM-DD'),
  EVAL_TYPE: 'A',
  EVAL_DATE: '',
  EVAL_REASON: '',
  SEQ: '',
  PLAN_PRC_CNT: '',
  PLAN_CNT: '',
  PLAN_FINISH_CNT: '',
  PLAN_FINISH_RATE: '',
  MSDS_CNT: '',
  MSDS_MANAGE_CNT: '',
  MSDS_SPECIAL_CNT: '',
  WORK_DATE: '',
  WORK_OVER: '',
  DISEASE_CNT: '',
  BONE_CNT: '',
  ES_DATE: '',
  NEW: 'N',
  MSDS_AVG_POINT: '',
  MSDS_AVG_COLOR: '#FFFFFF',
  MSDS_PROCESS_CNT: '',
  MSDS_MAX_POINT: '',
  MSDS_MIN_POINT: '',
  NOISE_AVG_POINT: '',
  NOISE_AVG_COLOR: '#FFFFFF',
  NOISE_PROCESS_CNT: '',
  NOISE_MAX_POINT: '',
  NOISE_MIN_POINT: '',
  BONE_AVG_POINT: '',
  BONE_AVG_COLOR: '#FFFFFF',
  BONE_PROCESS_CNT: '',
  BONE_MAX_POINT: '',
  BONE_MIN_POINT: '',
})

const codeList = reactive({
  EVAL_GUBUN: [
    {COD: 'A', TXT: '정기'},
    {COD: 'B', TXT: '수시'},
  ],
  STATUS: [
    {COD: 'A', TXT: '작성중'},
    {COD: 'B', TXT: '결재중'},
    {COD: 'C', TXT: '반려'},
    {COD: 'N', TXT: '미결'},
    {COD: 'Y', TXT: '결재완료'},
    {COD: 'Z', TXT: '취소'},
  ]
})

//그리드 속성셋팅(tab1-Main)
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    stateBar: { visible: false },
    edit: { editable: false },
  },

  fields: [
    { fieldName: 'EVAL_TYPE', dataType: 'text', width: '30', header: { text: '평가구분' }, lookupDisplay: true },
    { fieldName: 'STATUS', dataType: 'text', width: '30', header: { text: '진행상태' }, lookupDisplay: true },
    { fieldName: 'EVAL_DATE', dataType: 'text', width: '50', header: { text: '평가일자' } },
    { fieldName: 'EVAL_REASON', dataType: 'text', width: '70', styleName:'left-column', header: { text: '평가 사유' } },
    { fieldName: 'USER_DATA', dataType: 'text', width: '70', header: { text: '작성자' } },

    { fieldName: 'SEQ', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const pieChartOption = ref({
  tooltip: {
    trigger: 'item',
  },
  graphic: {
    type: 'text',
    left: 'center',
    top: 'center',
    style: {
      text: '위험성 단계\n분포', // ← 줄바꿈을 \n으로
      textAlign: 'center',
      fill: '#333',
      fontSize: 12,
      fontWeight: 'bold',
      lineHeight: 20, // (선택) 줄 간격 조정
    },
  },
  legend: {
    orient: 'horizontal',
    left: 'center',
    bottom: 0,              // 하단 배치
    itemWidth: 10,          // 작게
    itemHeight: 8,
    itemGap: 8,
    textStyle: { fontSize: 10 } // 글씨 작게
  },
  series: [
    {
      name: '위험상 단계 분포',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      padAngle: 5,
      itemStyle: {
        borderRadius: 10,
      },
      label: {
        show: true,
        formatter: '{c}',
        position: 'inside'
      },
      labelLine: {
        show: true,
      },
      color: [
        '#4472C4',
        '#78C292',
        '#FBAC00',
        '#F68322',
        '#EE4A32'
      ],
      data: [],
    },
  ],
})

// 그리드 데이터 조회
const getData = (p) => {
  let param = _.cloneDeep(p)
  grdMain.value.getDataProvider().setRows([])
  maxSeq.value = param.MAX_SEQ
  commonSearchApi({ queryId: 'HLTAB0010_SEARCH_03', param: param }).then(res => {
    if(res.ORESULT_CUR.length >= 1) { // 왼쪽 하단 화학물질, 작업환경측정, 유소견, 근골
      // searchParams.MSDS_CNT = res.ORESULT_CUR[0].MSDS_CNT
      // searchParams.MSDS_MANAGE_CNT = res.ORESULT_CUR[0].MSDS_MANAGE_CNT
      // searchParams.MSDS_SPECIAL_CNT = res.ORESULT_CUR[0].MSDS_SPECIAL_CNT
      searchParams.WORK_DATE = res.ORESULT_CUR[0].WORK_DATE
      searchParams.WORK_OVER = res.ORESULT_CUR[0].WORK_OVER
      searchParams.DISEASE_CNT = res.ORESULT_CUR[0].DISEASE_CNT
      searchParams.ES_DATE = res.ORESULT_CUR[0].ES_DATE
      searchParams.BONE_CNT = res.ORESULT_CUR[0].BONE_CNT
    }

    // 오른쪽 공정 직무 별 평균 위험성 초기화 작업
    // _화학물질 노출 수준
    searchParams.MSDS_AVG_POINT = ''
    searchParams.MSDS_AVG_COLOR = '#FFFFFF'
    searchParams.MSDS_PROCESS_CNT = ''
    searchParams.MSDS_MAX_POINT = ''
    searchParams.MSDS_MIN_POINT = ''
    // _소음 노출 수준
    searchParams.NOISE_AVG_POINT = ''
    searchParams.NOISE_AVG_COLOR = '#FFFFFF'
    searchParams.NOISE_PROCESS_CNT = ''
    searchParams.NOISE_MAX_POINT = ''
    searchParams.NOISE_MIN_POINT = ''
    // _근골격계 부담 수준
    searchParams.BONE_AVG_POINT = ''
    searchParams.BONE_AVG_COLOR = '#FFFFFF'
    searchParams.BONE_PROCESS_CNT = ''
    searchParams.BONE_MAX_POINT = ''
    searchParams.BONE_MIN_POINT = ''

    for(let dt2 of res.ORESULT_CUR2) { // 오른쪽 공정 직무 별 평균 위험성
      if(dt2.GBN_NO == 'A') {
        searchParams.MSDS_AVG_POINT = dt2.AVG_POINT
        searchParams.MSDS_AVG_COLOR = dt2.AVG_COLOR
        searchParams.MSDS_PROCESS_CNT = dt2.CNT
        searchParams.MSDS_MAX_POINT = dt2.MAX_POINT
        searchParams.MSDS_MIN_POINT = dt2.MIN_POINT
      } else if (dt2.GBN_NO == 'B') {
        searchParams.NOISE_AVG_POINT = dt2.AVG_POINT
        searchParams.NOISE_AVG_COLOR = dt2.AVG_COLOR
        searchParams.NOISE_PROCESS_CNT = dt2.CNT
        searchParams.NOISE_MAX_POINT = dt2.MAX_POINT
        searchParams.NOISE_MIN_POINT = dt2.MIN_POINT
      } else if (dt2.GBN_NO == 'C') {
        searchParams.BONE_AVG_POINT = dt2.AVG_POINT
        searchParams.BONE_AVG_COLOR = dt2.AVG_COLOR
        searchParams.BONE_PROCESS_CNT = dt2.CNT
        searchParams.BONE_MAX_POINT = dt2.MAX_POINT
        searchParams.BONE_MIN_POINT = dt2.MIN_POINT
      }
    }
    echart1.value.clear()
    if(res.ORESULT_CUR3.length == 1) { // 차트
      pieChartOption.value.series[0].data = [
        { value: Number(res.ORESULT_CUR3[0]['1']) > 0 ? res.ORESULT_CUR3[0]['1'] : '', name: '1단계'},
        { value: Number(res.ORESULT_CUR3[0]['2']) > 0 ? res.ORESULT_CUR3[0]['2'] : '', name: '2단계'},
        { value: Number(res.ORESULT_CUR3[0]['3']) > 0 ? res.ORESULT_CUR3[0]['3'] : '', name: '3단계'},
        { value: Number(res.ORESULT_CUR3[0]['4']) > 0 ? res.ORESULT_CUR3[0]['4'] : '', name: '4단계'},
        { value: Number(res.ORESULT_CUR3[0]['5']) > 0 ? res.ORESULT_CUR3[0]['5'] : '', name: '5단계'},
      ]
    }
    
    if(res.ORESULT_CUR4.length > 0) { // 평가 기본정보
      // searchParams.USER_DATA = res.ORESULT_CUR4[0].USER_DATA
      // searchParams.RISK_DATE = res.ORESULT_CUR4[0].RISK_DATE
      // searchParams.CHECK_USER = res.ORESULT_CUR4[0].CHECK_USER
      // searchParams.CHECK_DATE = res.ORESULT_CUR4[0].CHECK_DATE
      // searchParams.EVAL_TYPE = res.ORESULT_CUR4[0].EVAL_TYPE
      // searchParams.EVAL_DATE = res.ORESULT_CUR4[0].EVAL_DATE
      // searchParams.EVAL_REASON = res.ORESULT_CUR4[0].EVAL_REASON 
      // param.SEQ = res.ORESULT_CUR4[0].SEQ
      searchParams.NEW = 'N'
      // props.searchParams.SEQ = res.ORESULT_CUR4[0].SEQ
      // maxSeq.value = res.ORESULT_CUR4[0].SEQ
      getMainData(param)
    } else {
      searchParams.USER_DATA = `${userStore.deptNm} / ${userStore.userName} / ${userStore.jobTitNm}`
      searchParams.RISK_DATE = dayjs().format('YYYY-MM-DD')
      searchParams.CHECK_USER = ''
      searchParams.CHECK_DATE = dayjs().format('YYYY-MM-DD')
      searchParams.EVAL_TYPE = 'A'
      searchParams.EVAL_DATE = ''
      searchParams.EVAL_REASON = ''
      props.searchParams.SEQ = '1'
    } 
    emit('subData')

    if (res.ORESULT_CUR5.length > 0) {
      searchParams.PLAN_PRC_CNT = res.ORESULT_CUR5[0].PRC_CNT
      searchParams.PLAN_CNT = res.ORESULT_CUR5[0].PLAN_CNT
      searchParams.PLAN_FINISH_CNT = res.ORESULT_CUR5[0].FINISH_CNT
      searchParams.PLAN_FINISH_RATE = res.ORESULT_CUR5[0].FINISH_RATE
    }

    param.RISK_DATE = searchParams.RISK_DATE
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_10', param: param }).then(res2 => {
      searchParams.MSDS_CNT = res2.ORESULT_CUR[0].MSDS_CNT
      searchParams.MSDS_MANAGE_CNT = res2.ORESULT_CUR[0].MSDS_PRC_CNT
    })

    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR4)
    grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EVAL_TYPE', codeList.EVAL_GUBUN, 'COD', 'TXT')
    echart1.value.resize()
  })
  emit('btnSetting')
}

const getMainData = (param) => {
  commonSearchApi({ queryId: 'HLTAB0010_SEARCH_11', param: param }).then(res => {
    if(res.ORESULT_CUR.length >= 1) {
      searchParams.USER_DATA = res.ORESULT_CUR[0].USER_DATA
      searchParams.RISK_DATE = res.ORESULT_CUR[0].RISK_DATE
      searchParams.EVAL_TYPE = res.ORESULT_CUR[0].EVAL_TYPE
      searchParams.EVAL_DATE = res.ORESULT_CUR[0].EVAL_DATE
      searchParams.EVAL_REASON = res.ORESULT_CUR[0].EVAL_REASON 
      props.searchParams.STATUS = res.ORESULT_CUR[0].APPROVAL_STATUS

      emit('btnSetting')
    }
  })
}

const initData = () => {
  searchParams.USER_DATA = `${userStore.deptNm} / ${userStore.userName} / ${userStore.jobTitNm}`
  searchParams.RISK_DATE = dayjs().format('YYYY-MM-DD') 
  if(getGridCount() > 0) {
    searchParams.EVAL_TYPE = 'B'
  }else {
    searchParams.EVAL_TYPE = 'A'
  }
  searchParams.EVAL_DATE = ''
  searchParams.EVAL_REASON = ''
  searchParams.NEW = 'Y'
  props.searchParams.SEQ = Number(maxSeq.value) + 1
  emit('btnSetting')
}

const saveData = () => {
  // 결재상신 상태 체크
  if(searchParams.NEW != 'Y') {
    if(props.searchParams.STATUS == 'Y' || props.searchParams.STATUS == 'B') {
      return Message.warn('결재상신 후에는 데이터 수정이 불가능합니다.')
    }
  }

  if(isEmpty(searchParams.USER_DATA)) {
    return Message.warn(t('작성자를 입력하십시오.'))
  } else if (isEmpty(searchParams.RISK_DATE)) {
    return Message.warn(t('위험성 산출일자를 입력하십시오.'))
  } else if (isEmpty(searchParams.EVAL_TYPE)) {
    return Message.warn(t('평가유형을 선택하십시오.'))
  } else if (isEmpty(searchParams.EVAL_REASON)) {
    return Message.warn(t('평가사유를 입력하십시오.'))
  }
   
  let saveParams = _.cloneDeep(searchParams)
  saveParams.RISK_DATE = dayjs(searchParams.RISK_DATE).isValid() ? dayjs(searchParams.RISK_DATE).format('YYYYMMDD') : ''
  saveParams.EVAL_DATE = dayjs(searchParams.EVAL_DATE).isValid() ? dayjs(searchParams.EVAL_DATE).format('YYYYMMDD') : ''
  saveParams.CMPNY_DIV = props.searchParams.CMPNY_DIV
  saveParams.YEAR = props.searchParams.YEAR
  saveParams.BSNS_CD = props.searchParams.BSNS_CD
  saveParams.DEPT_CD = props.searchParams.DEPT_CD
  saveParams.ASGN_CD = props.searchParams.ASGN_CD
  saveParams.SEQ = props.searchParams.SEQ
  saveParams.NEW = searchParams.NEW
  
  vm.$swal({
    title: t('저장하시겠습니까?'), //\r\n
    showCancelButton: true,
  }).then((res) => {
    if (res.isConfirmed === true){
      commonExecuteApi({ queryId : 'HLTAB0010_SAVE_01', list: [saveParams] }).then(res => {
        Message.success(t('성공적으로 저장되었습니다.'))
      }).then(r => {
        // 최근데이터를 방금 등록한걸로 변경
        props.searchParams.MAX_SEQ = saveParams.SEQ
        getData(props.searchParams)
      })
    }
  })
}

// 작업환경측정 결과 관리
const showWork = () => {
  popup02.value.openPopup(props.searchParams)
}

// 유소견 정보
const showDisease = () => {
  popup03.value.openPopup(props.searchParams)
}

// 부서 msds 팝업
const popMsds = () => {
  let param = {
    ...props.searchParams
  }

  if(dayjs(searchParams.RISK_DATE).month() < 6) {
    param.HALF_DIV = 'HI'
  } else {
    param.HALF_DIV = 'LO'
  }
  param.REG_DIV = 'A'
  popup01.value.openPopup(param)
}

// 근골격계 부담작업 팝업
const popHoWork = () => {
  popup04.value.openPopup(props.searchParams)
}

//부서 MSDS 화면 이동
const goMsds = () => {
  router.push({ path: '/100_health/HLT_D/HLTDA0020' })
}

//작업환경측정 화면 이동
const goWork = () => {
  router.push({ path: '/100_health/HLT_F/HLTFB0010' })
}

//근골격계 부담작업 화면 이동
const goHoWork = () => {
  router.push({ path: '/100_health/HLT_I/HLTIB0010' })
}

const transData = () => {
  for(let data in searchParams) {
    let param = {
      sLang: props.searchParams.LANGUAGE, //번역할언어
      sText: searchParams[data], //번역할말
    }

    // 빈값이면 continue
    if(isEmpty(param.sText)) continue

    chatbotTranslateLn(param).then((res) => {
      searchParams[data] = res.TRANSATED_WORD
    })
  }
}

// 셀 클릭 이벤트(이미지 변경)
const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === 'data') {
    let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    props.searchParams.SEQ = rowData.SEQ
    getData(props.searchParams)
    emit('subData')
  }
}

// 셀 전체 ROW 갯수 주기
const getGridCount = () => {
  return grdMain.value.getDataProvider().getRowCount()
}

// 개정이력 선택시 세부내용 disable 변경 작용해야함
watch(() => searchParams.NEW, (newValue, oldValue) => {
  emit('isCreateView:update', false)
  if(newValue === 'Y') {
    emit('isCreateView:update', true)
  }
})

defineExpose({
  getData,
  saveData,
  transData,
  initData,
  getGridCount,
})
</script>

<template>
  <v-sheet class="h-auto">
    <div class="h-grow">
      <v-sheet width="1090px" class="mr-3">
        <IGridTitle :title="$t('기본 정보')" />
        <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
        <div class="d-flex mb-2">
          <i-input 
            required 
            :label="$t('작성자')" 
            width="250px" 
            topLabel 
            v-model="searchParams.USER_DATA"
            bgColor="#eff8fd"
          />
          <i-input 
            required 
            :label="$t('위험성 산출일자')" 
            width="200px" 
            topLabel
            type="date"
            v-model="searchParams.RISK_DATE"
            bgColor="#eff8fd"
          />
        </div>
        <div class="d-flex mb-2">
          <i-input 
            :label="$t('작업환경 개선계획 수립 대상 공정')" 
            width="250px" 
            topLabel 
            readonly
            v-model="searchParams.PLAN_PRC_CNT"
          />
          <i-input 
            :label="$t('개선계획 수립 완료')" 
            width="200px" 
            topLabel
            readonly
            v-model="searchParams.PLAN_CNT"
          />
          <i-input 
            :label="$t('개선조치 완료')" 
            width="200px" 
            topLabel
            readonly
            v-model="searchParams.PLAN_FINISH_CNT"
          />
          <i-input 
            :label="$t('이행률')" 
            width="200px" 
            topLabel
            readonly
            v-model="searchParams.PLAN_FINISH_RATE"
          />
        </div>
        <IGridTitle :title="$t('제/개정 정보')" />
        <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
        <div class="d-flex align-content-start flex-wrap mb-2">
          <i-select 
            :label="$t('평가유형')" 
            width="200px" 
            topLabel 
            required 
            :items="codeList.EVAL_GUBUN"
            item-value="COD"
            item-title="TXT" 
            v-model="searchParams.EVAL_TYPE"
            :readonly="true"
          />
          <i-input 
            :label="$t('결재일자')" 
            width="200px" 
            topLabel 
            type="date"
            v-model="searchParams.EVAL_DATE"
            readonly
          />
          <i-input 
            :label="$t('평가 사유')" 
            width="350px" 
            topLabel 
            required 
            v-model="searchParams.EVAL_REASON"
            bgColor="#eff8fd"
          />
        </div>
        <IGridTitle :title="$t('평가 기초 정보')" />
        <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
        <div class="mb-2">
          <div class="d-flex justify-space-around mt-2">
            <v-btn size="large" width="23%" @click="popMsds">화학물질 취급정보</v-btn>
            <v-btn size="large" width="23%" @click="showWork">작업환경측정 정보</v-btn>
            <v-btn size="large" width="23%" @click="showDisease">직업병 유소견자 정보</v-btn>
            <v-btn size="large" width="23%" @click="popHoWork">근골격계부담작업 정보</v-btn>
          </div>
          <div class="d-flex justify-space-around mt-2">
            <i-input 
              class="mt-2" 
              width="200px" 
              :label="$t('취급 화학제품 수')" 
              top-label
              v-model="searchParams.MSDS_CNT"
              readonly
            ></i-input>
            <i-input 
              class="mt-2" 
              width="200px" 
              :label="$t('최근 작업환경측정 실시일')" 
              top-label
              type="date"
              v-model="searchParams.WORK_DATE"
              readonly
            ></i-input>
            <i-input 
              class="mt-2" 
              width="200px" 
              :label="$t('신규 유소견자(D1) 현황')" 
              top-label
              v-model="searchParams.DISEASE_CNT"
              readonly
            ></i-input>
            <i-input 
              class="mt-2" 
              width="200px" 
              :label="$t('근골격계부담작업 정기 조사일')" 
              top-label
              v-model="searchParams.ES_DATE"
              readonly
            ></i-input>
          </div>
          <div class="d-flex justify-space-around mt-2">
            <i-input 
              class="mt-2" 
              width="200px" 
              :label="$t('화학제품 취급 공정 수')" 
              top-label
              v-model="searchParams.MSDS_MANAGE_CNT"
              readonly
            ></i-input>
            <i-input 
              class="mt-2" 
              width="200px" 
              :label="$t('작업환경측정 초과건수/초과율')" 
              top-label
              v-model="searchParams.WORK_OVER"
              readonly
            ></i-input>
            <i-input class="mt-2" width="200px" style="visibility: hidden"></i-input>
            <i-input 
              class="mt-2" 
              width="200px" 
              :label="$t('수시유해요인조사 건 수 (최근3년)')" 
              top-label
              v-model="searchParams.BONE_CNT"
              readonly
            ></i-input>
          </div>
         
        </div>
      </v-sheet>
      <v-sheet class="h-auto pr-1">
        <div class="fill-height">
          <IGridTitle :title="$t('부서 보건정보(바로가기)')" />
          <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
          <v-sheet class="d-flex justify-space-between" style="height: 63px">
            <v-btn size="large" variant="outlined" width="33%" @click="goMsds">부서 MSDS</v-btn>
            <v-btn size="large" variant="outlined" width="33%" @click="goWork">작업환경측정 예비조사</v-btn>
            <v-btn size="large" variant="outlined" width="33%" @click="goHoWork">근골격계 부담작업</v-btn>
          </v-sheet>
          <IGridTitle :title="$t('주요 평가 결과')" />
          <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
          <div style="font-size: 16px" class="mb-2">공정(직무)별 평균 위험성</div>
          <v-sheet height="35%" class="d-flex mb-3">
            <div style="width: 25%" class="box-border d-flex flex-column">
              <div class="titleStyle">화학물질 노출수준</div>
              <div class="gradeStyle" :style="{ background: searchParams.MSDS_AVG_COLOR }">
                {{ searchParams.MSDS_AVG_POINT }}
              </div>
              <div class="d-flex justify-space-between ma-2">
                <div style="font-size: 15px padding:2px">● 평가 공정(직무)</div>
                <div class="box-border" style="width: 40px">
                  {{ isEmpty(searchParams.MSDS_PROCESS_CNT) ? '' : `${searchParams.MSDS_PROCESS_CNT}건` }}
                </div>
              </div>
              <div class="d-flex justify-space-between ma-2">
                <div style="font-size: 15px padding:2px">● 최고 위험성</div>
                <div class="box-border" style="width: 40px">
                  {{ isEmpty(searchParams.MSDS_MAX_POINT) ? '' : `${searchParams.MSDS_MAX_POINT}단계` }}
                </div>
              </div>
              <div class="d-flex justify-space-between ma-2">
                <div style="font-size: 15px padding:2px">● 최저 위험성</div>
                <div class="box-border" style="width: 40px">
                  {{ isEmpty(searchParams.MSDS_MIN_POINT) ? '' : `${searchParams.MSDS_MIN_POINT}단계` }}
                </div>
              </div>
            </div>
            <div style="width: 25%" class="box-border d-flex flex-column">
              <div class="titleStyle">소음 노출수준</div>
              <div class="gradeStyle" :style="{ background: searchParams.NOISE_AVG_COLOR }">
                {{ searchParams.NOISE_AVG_POINT }}
              </div>
              <div class="d-flex justify-space-between ma-2">
                <div style="font-size: 15px padding:2px">● 평가 공정(직무)</div>
                <div class="box-border" style="width: 40px">                  
                  {{ isEmpty(searchParams.NOISE_PROCESS_CNT) ? '' : `${searchParams.MSDS_PROCESS_CNT}건` }}
                </div>
              </div>
              <div class="d-flex justify-space-between ma-2">
                <div style="font-size: 15px padding:2px">● 최고 위험성</div>
                <div class="box-border" style="width: 40px">
                  {{ isEmpty(searchParams.NOISE_MAX_POINT) ? '' : `${searchParams.NOISE_MAX_POINT}단계` }}
                </div>
              </div>
              <div class="d-flex justify-space-between ma-2">
                <div style="font-size: 15px padding:2px">● 최저 위험성</div>
                <div class="box-border" style="width: 40px">
                  {{ isEmpty(searchParams.NOISE_MIN_POINT) ? '' : `${searchParams.NOISE_MIN_POINT}단계` }}
                </div>
              </div>
            </div>
            <div style="width: 25%" class="box-border d-flex flex-column">
              <div class="titleStyle">근골격계 부담수준</div>
              <div class="gradeStyle" :style="{ background: searchParams.BONE_AVG_COLOR }">
                {{ searchParams.BONE_AVG_POINT }}
              </div>
              <div class="d-flex justify-space-between ma-2">
                <div style="font-size: 15px padding:2px">● 평가 공정(직무)</div>
                <div class="box-border" style="width: 40px">
                  {{ isEmpty(searchParams.BONE_PROCESS_CNT) ? '' : `${searchParams.BONE_PROCESS_CNT}건` }}
                </div>
              </div>
              <div class="d-flex justify-space-between ma-2">
                <div style="font-size: 15px padding:2px">● 최고 위험성</div>
                <div class="box-border" style="width: 40px">
                  {{ isEmpty(searchParams.BONE_MAX_POINT) ? '' : `${searchParams.BONE_MAX_POINT}단계` }}
                </div>
              </div>
              <div class="d-flex justify-space-between ma-2">
                <div style="font-size: 15px padding:2px">● 최저 위험성</div>
                <div class="box-border" style="width: 40px">
                  {{ isEmpty(searchParams.BONE_MIN_POINT) ? '' : `${searchParams.BONE_MIN_POINT}단계` }}
                </div>
              </div>
            </div>
            <div style="width: 25%; height: 100%">
              <Echart :option="pieChartOption" ref="echart1" autoresize style="width: 100%; height: 100%"></Echart>
            </div>
          </v-sheet>
          <IGridTitle :title="$t('보건위험성평가 개정이력')" />
          <VDivider :thickness="1" class="border-opacity-100 mb-2" color="primary" />
          <v-sheet height="170px">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
      </v-sheet>
      <HLTAB0010Tab01Popup01 ref="popup01"/>
      <HLTAB0010Tab01Popup02 ref="popup02"/>
      <HLTAB0010Tab01Popup03 ref="popup03"/>
      <HLTAB0010Tab01Popup04 ref="popup04"/>
      <ApprovalPopup ref="approvalPopup"/>
    </div>
  </v-sheet>
</template>
<style scoped>
.box-border {
  border: 1px solid #ccc;
  padding: 1px;
  text-align: center;
}

/* 주요평가결과 밑에 사각형박스3개 제목 클래스 */
.titleStyle {
  padding: 8px;
  font-size: 17px;
  font-weight: bold;
  text-align: center;
}
/* 주요평가결과 밑에 사각형박스3개 등급 클래스 */
.gradeStyle {
  font-size: 17px;
  color: rgb(57, 57, 57);
  font-weight: bold;
  margin: 4px;
  border: double #bcccd1;
  border-radius: 5px;
  height: 20%;
  display: flex;
  align-items: center; /* 세로 가운데 */
  justify-content: center; /* 가로 가운데 */
}
</style>
