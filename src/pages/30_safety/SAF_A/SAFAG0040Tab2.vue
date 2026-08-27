<!--
  화면명: 평균임금산정내역서(상세정보 탭)
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, commonExecuteApi, commonRequest, commonLogExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import _ from 'lodash'
import Message from '@hiway/utils/notify'
import OZReport from '@/components/OZReport.vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'

defineOptions({
  name:'30_safety-SAF_A-SAFAG0040Tab2',
})

const props = defineProps({
  params: {
    type: Object,
    default() {
      return {}
    }
  }
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const gridTitle = ref(null)
const userStore = useUserStore()
const logsStore = useLogsStore()
const revList = ref([])
const payList = reactive({
  EXCLD: [],
  PAY: [],
  SANG: [],
  MSANG: [],
})
const title_ER_H066 = ref(null)
const showOz = ref(false)
const reportName = ref('')
const ozParams = ref([])
const birthDay = ref('')

const isReadOnly = computed(() => {
  return searchParams.REV == 0
})

// 소계1
const sum1 = computed(() => {
  let result = 0

  if(_.filter(payList.PAY, { SEQ: 1 }).length > 0) {
    const data = _.filter(payList.PAY, { SEQ: 1 })
    
    data.forEach(row => {
      result += Number(row.VALUE02)
    })
  }

  return result.toLocaleString('en-US')
})

// 소계2
const sum2 = computed(() => {
  let result = 0

  if(_.filter(payList.PAY, { SEQ: 2 }).length > 0) {
    const data = _.filter(payList.PAY, { SEQ: 2 })
    
    data.forEach(row => {
      result += Number(row.VALUE02)
    })
  }

  return result.toLocaleString('en-US')
})

// 소계3
const sum3 = computed(() => {
  let result = 0

  if(_.filter(payList.PAY, { SEQ: 3 }).length > 0) {
    const data = _.filter(payList.PAY, { SEQ: 3 })
    
    data.forEach(row => {
      result += Number(row.VALUE02)
    })
  }

  return result.toLocaleString('en-US')
})

// 소계4
const sum4 = computed(() => {
  let result = 0

  if(_.filter(payList.PAY, { SEQ: 4 }).length > 0) {
    const data = _.filter(payList.PAY, { SEQ: 4 })
    
    data.forEach(row => {
      result += Number(row.VALUE02)
    })
  }

  return result.toLocaleString('en-US')
})

// 제외일수
const excldDays = computed(() => {
  let result = 0

  result = (getExcld(1).EXCLD_CNT ? getExcld(1).EXCLD_CNT : 0)
         + (getExcld(2).EXCLD_CNT ? getExcld(2).EXCLD_CNT : 0)
         + (getExcld(3).EXCLD_CNT ? getExcld(3).EXCLD_CNT : 0)
         + (getExcld(4).EXCLD_CNT ? getExcld(4).EXCLD_CNT : 0)

  return result
})

// 산정일수
const sanDays = computed(() => {
  let result = 0

  result = (getExcld(1).WORK_DAYS ? getExcld(1).WORK_DAYS : 0)
         + (getExcld(2).WORK_DAYS ? getExcld(2).WORK_DAYS : 0)
         + (getExcld(3).WORK_DAYS ? getExcld(3).WORK_DAYS : 0)
         + (getExcld(4).WORK_DAYS ? getExcld(4).WORK_DAYS : 0)

  return result
})

// 급여
const sumAll = computed(() => {
  let result = 0

  result = Number(sum1.value.replace(/,/gi, ''))
         + Number(sum2.value.replace(/,/gi, ''))
         + Number(sum3.value.replace(/,/gi, ''))
         + Number(sum4.value.replace(/,/gi, ''))

  return result.toLocaleString('en-US')
})

const sumAvg = computed(() => {
  let result = 0

  if(payList.EXCLD.length > 0) {
    if(sanDays.value > 0) {
      // console.log('sumAll.value', sumAll.value)
      // console.log('getSang(ER_I039).VALUE02', getSang('ER_I039').VALUE02)

      result = (((sumAll.value.replace(/,/gi, '') * 1)
                  + (getSang('ER_I039').VALUE02 === undefined ? 0 : (getSang('ER_I039').VALUE02 * 1))
                  + (getSang('ER_H013').VALUE02 === undefined ? 0 : (getSang('ER_H013').VALUE02 * 1))
                  + (getSang('ER_B020').VALUE02 === undefined ? 0 : (getSang('ER_B020').VALUE02 * 1))
                  + (getSang('300_E').VALUE02 === undefined ? 0 : (getSang('300_E').VALUE02 * 1))
                  + (getSang('300_B').VALUE02 === undefined ? 0 : (getSang('300_B').VALUE02 * 1)))
                /
                sanDays.value).toFixed(2) * 1
    }
  }

  return result.toLocaleString('en-US')
})

const sumAvg2 = computed(() => {
  let result = 0

  result = (sumAvg.value.replace(/,/gi, '') * 0.7).toFixed(2) * 1

  return result.toLocaleString('en-US')
})

// 시운전승선 존재여부
const hasB027 = computed(() => {
  let result = 'N'

  if(_.find(payList.PAY, { PAY_DIV: 'ER_B027' })) {
    result = 'Y'
  }

  return result
})

// 포괄수당 존재여부
const hasB029 = computed(() => {
  let result = 'N'

  if(_.find(payList.PAY, { PAY_DIV: 'ER_B029' })) {
    result = 'Y'
  }

  return result
})

const searchParams = reactive({
  CMPNY_DIV: '',
  SANNO: '',
  REV: '',
  EMP_NO: '',
  FN_YN: 'N',
})

// Revision List 가져오기
const getRevList = async () => {
  // console.log('props.params', props.params)

  await commonSearchApi({
    queryId: 'SAFAG0040_SEARCH_02',
    param: props.params
  }).then(res => {
    // console.log('res', res)

    searchParams.REV = ''
    searchParams.FN_YN = 'N'
    revList.value = res.ORESULT_CUR

    if(revList.value.length > 0) {
      searchParams.REV = revList.value[0].REV
      // searchParams.FN_YN = revList.value[0].FN_YN
    }

    setFn()
  })
}

const setFn = () => {
  // console.log('searchParams.REV', searchParams.REV)
  // console.log('revList.value', revList.value)

  if(revList.value.length > 0) {
    searchParams.FN_YN = _.find(revList.value, { REV: searchParams.REV }).FN_YN

    vm.$nextTick(() => {
      if(searchParams.FN_YN === 'Y') {
        gridTitle.value.setBtnProperty('btnConfirm', 'text', '최종취소')
      } else {
        gridTitle.value.setBtnProperty('btnConfirm', 'text', '최종확정')
      }
    })
  }
}

const searchMain = () => {
  searchParams.CMPNY_DIV = props.params.CMPNY_DIV
  searchParams.SANNO = props.params.SANNO

  // console.log('searchParams', searchParams)

  return commonSearchApi({
    queryId : 'SAFAG0040_SEARCH_03',
    param: searchParams
  })
}

const afterSearchMain = res => {
  // console.log('res', res)

  payList.EXCLD = res.ORESULT_CUR
  payList.PAY = res.ORESULT_CUR2
  payList.SANG = res.ORESULT_CUR3
  payList.MSANG = res.ORESULT_CUR4

  if(payList.EXCLD.length > 0) {
    if(payList.EXCLD[0].BF2017 === 'Y') {
      title_ER_H066.value = '고정연장<br/>자기계발수당'
    } else {
      title_ER_H066.value = '자기계발비'
    }

    const param = {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      SANNO: searchParams.SANNO,
      REV: searchParams.REV,
    }

    const logParam = {
      userStore: userStore,
      params: param,
      mgs: '개인정보관련 조회했습니다.',
      crudGbn: 'U',
      logDesc: '상세정보 조회',
      menuId: logsStore.menuId,
      menuNm: t(logsStore.menuId),
    }

    // console.log('logParam', logParam)

    commonLogExecuteApi(logParam)
  } else {
    title_ER_H066.value = '자기계발비'
  }
}

const btnSearch = (showMsg = true) => {
  // console.log('btnSearch')
  
  new queryFlowHelper(vm, t)
    .setQuery(searchMain)
    .setAfter(afterSearchMain)
    .showMessage(showMsg)
    .run()
}

const btnImport = () => {
  const param = {
    CMPNY_DIV: props.params.CMPNY_DIV,
    SANNO: props.params.SANNO,
    EMP_NO: props.params.EMP_NO,
    SALARYDTE: props.params.SALARYDTE.replace(/-/gi, ''),
  }

  // console.log('param', param)

  commonExecuteApi({
    queryId: 'SAFAG0040_SAVE_02',
    list: [param]
  }).then(async res => {
    await getRevList()
    btnSearch()

    const param = {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      SANNO: searchParams.SANNO,
      REV: 0,
    }

    const logParam = {
      userStore: userStore,
      params: param,
      mgs: '개인정보관련 저장했습니다.',
      crudGbn: 'C',
      logDesc: '상세정보 불러오기',
      menuId: logsStore.menuId,
      menuNm: t(logsStore.menuId),
    }

    // console.log('logParam', logParam)

    commonLogExecuteApi(logParam)
  })
}

const newRev = () => {
  const param = {
    CMPNY_DIV: props.params.CMPNY_DIV,
    SANNO: props.params.SANNO,
    REV: searchParams.REV,
  }

  return commonExecuteApi({ queryId: 'SAFAG0040_SAVE_03', list: [param] })
}

const newRevision = async () => {
  if(payList.EXCLD.length < 1) {
    Message.warn('현재 Revision으로 조회된 데이터가 없습니다.')
    return
  }

  new saveFlowHelper(vm, t)
    .setQuery(newRev)
    .setConfirmMessage(`Rev.${searchParams.REV}의 데이터로 신규 Revision을 생성하시겠습니까?`)
    .setResultMessage('생성되었습니다.')
    .setAfter(async () => {
      await getRevList()
      btnSearch(false)

      const param = {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      SANNO: searchParams.SANNO,
      REV: searchParams.REV,
    }

    const logParam = {
      userStore: userStore,
      params: param,
      mgs: '개인정보관련 저장했습니다.',
      crudGbn: 'C',
      logDesc: '상세정보 개정',
      menuId: logsStore.menuId,
      menuNm: t(logsStore.menuId),
    }

    // console.log('logParam', logParam)

    commonLogExecuteApi(logParam)
    })
    .run()
}

const btnModify = () => {
  if(revList.value.length < 1) {
    Message.warn('적용할 Revision이 없습니다.')
    return
  }

  if(searchParams.REV == 0) {
    Message.warn('원본은 소급적용 할 수 없습니다.')
    return
  }

  if(props.params.IS_TIME_OVER === 'Y') {
    Message.warn('임금데이터 제공기간이 지났습니다.')
    return
  }

  const param = {
    CMPNY_DIV: props.params.CMPNY_DIV,
    SANNO: props.params.SANNO,
    REV: searchParams.REV,
    EMP_NO: props.params.EMP_NO,
    SALARYDTE: props.params.SALARYDTE.replace(/-/gi, ''),
  }

  // console.log('param', param)

  commonSearchApi({
    queryId: 'SAFAG0040_SEARCH_04',
    param: param
  }).then(res => {
    // 임금
    const payData = res.ORESULT_CUR
    // 상여
    const sangData = res.ORESULT_CUR2
    // 월상여
    const monthData = res.ORESULT_CUR3
    // 휴가/귀향비, 7월 약정
    const month07 = res.ORESULT_CUR4
    // 통상임금
    const secChiefGamt = res.ORESULT_CUR5

    // console.log('payData', payData)
    // console.log('sangData', sangData)
    // console.log('monthData', monthData)
    // console.log('month07', month07)
    // console.log('secChiefGamt', secChiefGamt)

    for(let i = 0; i < secChiefGamt.length; i++) {
      const currRow = secChiefGamt[i]

      if(_.find(payList.EXCLD, { SEQ: currRow.SEQ })) {
        const el = _.find(payList.EXCLD, { SEQ: currRow.SEQ })
        el.ZZ_SEC_CHIEF_GAMT = currRow.ZZ_SEC_CHIEF_GAMT
      }
    }
    
    for(let i = 0; i < payData.length; i++) {
      const currRow = payData[i]

      if(_.find(payList.PAY, { PAY_DIV: currRow.PAY_DIV, SEQ: currRow.SEQ })) {
        const el = _.find(payList.PAY, { PAY_DIV: currRow.PAY_DIV, SEQ: currRow.SEQ })
        
        if(currRow.PAY_DIV === 'ER_B007') {
          el.VALUE01 = currRow.VALUE01_B007
        } else if(currRow.PAY_DIV === 'ER_B012'
           || currRow.PAY_DIV === 'ER_B027'
           || currRow.PAY_DIV === 'ER_B029') {
          el.VALUE02 = currRow.VALUE02
        } else {
          el.VALUE01 = currRow.VALUE01
        }
      }
    }

    for(let i = 0; i < sangData.length; i++) {
      const currRow = sangData[i]

      if(_.find(payList.SANG, { PAY_DIV: currRow.PAY_DIV })) {
        const el = _.find(payList.SANG, { PAY_DIV: currRow.PAY_DIV })
        el.VALUE01 = currRow.VALUE01
      }
    }

    // // console.log('month07', month07)
    if(payList.MSANG.length > 0 && month07.length > 0) {
      // 7월 약정
      payList.MSANG[0].ZZ_GENERAL_PAY = month07[0].ZZ_GENERAL_PAY
      
      // 휴가/귀향비
      if(_.find(payList.SANG, { PAY_DIV: 'ER_H013' })) {
        const el = _.find(payList.SANG, { PAY_DIV: 'ER_H013' })
        el.VALUE01 = month07[0].VACATION_PAY
      }
    }

    // 월상여
    if(payList.MSANG.length > 0 && monthData.length > 0) {
      payList.MSANG[0].VALUE01 = monthData[0].VALUE01
      payList.MSANG[0].VALUE02 = monthData[0].VALUE02
      payList.MSANG[0].VALUE03 = monthData[0].VALUE03
      payList.MSANG[0].VALUE04 = monthData[0].VALUE04
      payList.MSANG[0].VALUE05 = monthData[0].VALUE05
      payList.MSANG[0].VALUE06 = monthData[0].VALUE06
      payList.MSANG[0].VALUE07 = monthData[0].VALUE07
      payList.MSANG[0].VALUE08 = monthData[0].VALUE08
      payList.MSANG[0].VALUE09 = monthData[0].VALUE09
      payList.MSANG[0].VALUE10 = monthData[0].VALUE10
      payList.MSANG[0].VALUE11 = monthData[0].VALUE11
      payList.MSANG[0].VALUE12 = monthData[0].VALUE12
      payList.MSANG[0].VALUE03_QT = monthData[0].VALUE03_QT
      payList.MSANG[0].VALUE06_QT = monthData[0].VALUE06_QT
      payList.MSANG[0].VALUE09_QT = monthData[0].VALUE09_QT
      payList.MSANG[0].VALUE12_QT = monthData[0].VALUE12_QT

      if(_.find(payList.SANG, { PAY_DIV: '300_B' })) {
        const el = _.find(payList.SANG, { PAY_DIV: '300_B' })
        el.VALUE01 = monthData[0].VALUE_SUM
      }
    }

    // 계산
    for(let i = 0; i < payList.EXCLD.length; i++) {
      calcPay2(payList.EXCLD[i].SEQ)
    }

    calcSang()
  })
}

const fnConfirm = () => {
  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    SANNO: searchParams.SANNO,
    REV: searchParams.REV,
    SALARY: sumAvg.value.replace(/,/gi, ''),
    FN_YN: 'Y'
  }

  return commonExecuteApi({ queryId: 'SAFAG0040_SAVE_08', list: [param] })
}

const fnCancel = () => {
  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    SANNO: searchParams.SANNO,
    REV: searchParams.REV,
    SALARY: sumAvg.value.replace(/,/gi, ''),
    FN_YN: 'N'
  }

  return commonExecuteApi({ queryId: 'SAFAG0040_SAVE_08', list: [param] })
}

const btnConfirm = () => {
  // if(payList.EXCLD.length < 1) {
  //   Message.warn('현재 Revision으로 조회된 데이터가 없습니다.')
  //   return
  // }

  if(searchParams.FN_YN === 'Y') {
    if(revList.value.length < 1) {
      Message.warn('취소할 Revision이 없습니다.')
      return
    }
    
    new saveFlowHelper(vm, t)
    .setQuery(fnCancel)
    .setConfirmMessage(`최종취소 하시겠습니까?`)
    .setResultMessage('취소되었습니다.')
    .setAfter(async () => {
      await getRevList()
      btnSearch(false)
    })
    .run()
  } else {
    if(revList.value.length < 1) {
      Message.warn('확정할 Revision이 없습니다.')
      return
    }

    new saveFlowHelper(vm, t)
    .setQuery(fnConfirm)
    .setConfirmMessage(`최종확정 하시겠습니까?`)
    .setResultMessage('확정되었습니다.')
    .setAfter(async () => {
      await getRevList()
      btnSearch(false)
    })
    .run()
  }
}

const saveData = () => {
  const data = {
    EXCLD: payList.EXCLD,
    PAY: payList.PAY,
    SANG: payList.SANG,
    MSANG: payList.MSANG
  }

  console.log('saveDatas', data)

  return commonRequest('/hse/safety/SAFAG0040/saveData', {
    param: data,
  })
}

const btnUpdate = () => {
  // if(searchParams.REV == 0) {
  //   Message.warn('원본은 변경할 수 없습니다.')
  //   return
  // }

  if(revList.value.length < 1) {
    Message.warn('저장할 Revision이 없습니다.')
    return
  }

  new saveFlowHelper(vm, t)
    .setQuery(saveData)
    .setAfter(() => {
      const param = {
        CMPNY_DIV: payList.EXCLD[0].CMPNY_DIV,
        SANNO: payList.EXCLD[0].SANNO,
        REV: payList.EXCLD[0].REV,
      }

      const logParam = {
        userStore: userStore,
        params: param,
        mgs: '개인정보관련 저장했습니다.',
        crudGbn: 'U',
        logDesc: '상세정보 저장',
        menuId: logsStore.menuId,
        menuNm: t(logsStore.menuId),
      }

      // console.log('logParam', logParam)

      commonLogExecuteApi(logParam)

      btnSearch()
    })
    .run()
}

const deleteData = () => {
  return commonExecuteApi({ queryId: 'SAFAG0040_DELETE_02', list: [searchParams] })
}

const btnDelete = () => {
  if(payList.EXCLD.length < 1) {
    Message.warn('삭제할 데이터가 없습니다.')
    return
  }

  if(searchParams.REV == 0) {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('원본을 삭제하시겠습니까?')
      .setQuery(deleteData)
      .setAfter(async () => {
        await getRevList()
        btnSearch()
      })
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setQuery(deleteData)
      .setAfter(async () => {
        await getRevList()
        btnSearch()
      })
      .run()
  }
}

const btnPrint = () => {
  // console.log('props.params', props.params)

  if(payList.EXCLD.length < 1) {
    Message.warn('출력할 데이터가 없습니다.')
    return
  }

  let isFrnr = ''
  reportName.value = '/manage/hse/SAFAG0040.ozr'

  if(props.params.FORM_NM.indexOf('기본') > -1) {
    isFrnr = 'N'
  } else {
    isFrnr = 'Y'
  }

  ozParams.value = []
  ozParams.value = [
    'IN_CMPNY_DIV=' + props.params.CMPNY_DIV,
    'IN_SANNO=' + props.params.SANNO,
    'IN_REV=' + searchParams.REV,
    'IN_SALARYDTE=' + props.params.SALARYDTE.replace(/-/gi, ''),
    'IN_IS_FRNR=' + isFrnr,
  ]

  // console.log('ozParams.value', ozParams.value)

  showOz.value = true

  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    SANNO: searchParams.SANNO,
    REV: searchParams.REV,
  }

  const logParam = {
    userStore: userStore,
    params: param,
    mgs: '개인정보관련 출력했습니다.',
    crudGbn: 'P',
    logDesc: '상세정보 출력',
    menuId: logsStore.menuId,
    menuNm: t(logsStore.menuId),
  }

  // console.log('logParam', logParam)

  commonLogExecuteApi(logParam)
}

const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch') {
    // 조회
    btnSearch()
  } else if(btn.id === 'btnImport') {
    // 불러오기
    btnImport()
  } else if(btn.id === 'btnRevision') {
    // 개정
    newRevision()
  } else if(btn.id === 'btnModify') {
    // 소급적용
    btnModify()
  } else if(btn.id === 'btnConfirm') {
    // 최종확정
    btnConfirm()
  } else if(btn.id === 'btnUpdate') {
    // 저장
    btnUpdate()
  } else if(btn.id === 'btnDelete') {
    // 삭제
    btnDelete()
  } else if(btn.id === 'btnPrint') {
    // 출력
    btnPrint()
  }
}

// 상세정보 탭으로 변경 시 자동조회
const changeTab = () => {
  setTimeout(async () => {
    // console.log('params', props.params)
    birthDay.value = props.params.REG_NO ? props.params.REG_NO.split('-')[0] : ''
    await getRevList()
    btnSearch()
  }, 1000)
}

// Seq별 해당월 일수 ~ 산정 일수 찾기
const getExcld = seq => {
  if(_.find(payList.EXCLD, { SEQ: seq })) {
    return _.find(payList.EXCLD, { SEQ: seq })
  } else {
    return {}
  }
}

// Seq별 임금내역 찾기
const getPay = (seq, div) => {
  if(_.find(payList.PAY, { SEQ: seq, PAY_DIV: div })) {
    return _.find(payList.PAY, { SEQ: seq, PAY_DIV: div })
  } else {
    return {}
  }
}

// Seq별 상여 찾기
const getSang = div => {
  if(_.find(payList.SANG, { PAY_DIV: div })) {
    return _.find(payList.SANG, { PAY_DIV: div })
  } else {
    return { }
  }
}

const getMSang = () => {
  if(payList.MSANG.length > 0) {
    return payList.MSANG[0]
  } else {
    return {}
  }
}

// 제외 일수 변경시 자동계산
const calcPay = (seq, payDiv) => {
  // console.log('calcPay')

  if(payList.EXCLD.length > 0) {
    // console.log('payList.PAY', payList.PAY)

    const excldItem = _.find(payList.EXCLD, { SEQ: seq })
    const payItem = _.filter(payList.PAY, { SEQ: seq })

    // 산정일수 = 임금계산기간일수 - 제외 일수
    excldItem.WORK_DAYS = (excldItem.WORK_DAYS2 * 1) - (excldItem.EXCLD_CNT * 1)

    // 임금 계산
    if(payDiv) {
      payItem.forEach(item => {
        if(item.PAY_DIV === payDiv) {
          if(payDiv === 'ER_B007') {
            item.VALUE02 = (excldItem.ZZ_SEC_CHIEF_GAMT * item.VALUE01 / 240).toFixed(0) * 1
          } else if(payDiv === 'ER_B012') {
            item.VALUE02 = (_.find(payItem, { PAY_DIV: 'ER_A001' }).VALUE01 * item.VALUE01 / 240).toFixed(0) * 1
          } else {
            item.VALUE02 = !excldItem.DAYS * 1 || excldItem.DAYS * 1 == 0 ? 0 : ((item.VALUE01 * 1) * (excldItem.WORK_DAYS * 1) / (excldItem.DAYS * 1)).toFixed(0) * 1

            if(payDiv === 'ER_A001') {
              if(_.find(payItem, { PAY_DIV: 'ER_B012' })) {
                const elB012 = _.find(payItem, { PAY_DIV: 'ER_B012' })
                elB012.VALUE02 = (item.VALUE01 * elB012.VALUE01 / 240).toFixed(0) * 1
              }
            }
          }
        }
      })
    } else {
      payItem.forEach(item => {
        // 시운전(ER_B027), 포괄수당(ER_B029) 계산안함
        if(item.PAY_DIV !== 'ER_B027' && item.PAY_DIV !== 'ER_B029') {
          if(item.PAY_DIV === 'ER_B007') {
            item.VALUE02 = (excldItem.ZZ_SEC_CHIEF_GAMT * item.VALUE01 / 240).toFixed(0) * 1
          } else if(item.PAY_DIV === 'ER_B012') {
            item.VALUE02 = (_.find(payItem, { PAY_DIV: 'ER_A001' }).VALUE01 * item.VALUE01 / 240).toFixed(0) * 1
          } else {
            item.VALUE02 = !excldItem.DAYS * 1 || excldItem.DAYS * 1 == 0 ? 0 : ((item.VALUE01 * 1) * (excldItem.WORK_DAYS * 1) / (excldItem.DAYS * 1)).toFixed(0) * 1
          }
        }
      })
    }
    
    if(!payDiv) {
      calcSang()
    }
  }
}

const autoInput = (seq, payDiv) => {
  if(payDiv === 'ZZ_SEC_CHIEF_GAMT') {
    for(let i = seq + 1; i <= payList.EXCLD.length; i++) {
      if(getExcld(i).ZZ_SEC_CHIEF_GAMT === 0) {
        getExcld(i).ZZ_SEC_CHIEF_GAMT = getExcld(seq).ZZ_SEC_CHIEF_GAMT
        calcPay(i, 'ER_B007')
      }
    }
  } else {
    for(let i = seq + 1; i <= payList.EXCLD.length; i++) {
      if(getPay(i, payDiv).VALUE01 === 0) {
        getPay(i, payDiv).VALUE01 = getPay(seq, payDiv).VALUE01
        calcPay(i, payDiv)
      }
    }
  }
}

// 제외 일수 변경시 자동계산
const calcPay2 = (seq) => {
  // console.log('calcPay')

  if(payList.EXCLD.length > 0) {
    // console.log('payList.PAY', payList.PAY)

    const excldItem = _.find(payList.EXCLD, { SEQ: seq })
    const payItem = _.filter(payList.PAY, { SEQ: seq })

    // 산정일수 = 임금계산기간일수 - 제외 일수
    excldItem.WORK_DAYS = (excldItem.WORK_DAYS2 * 1) - (excldItem.EXCLD_CNT * 1)

    // 임금 계산
    payItem.forEach(item => {
      // 시운전(ER_B027), 포괄수당(ER_B029) 계산안함
      if(item.PAY_DIV !== 'ER_B027' && item.PAY_DIV !== 'ER_B029') {
        if(item.PAY_DIV === 'ER_B007') {
          // item.VALUE01 = (item.VALUE02 * 240 / excldItem.ZZ_SEC_CHIEF_GAMT).toFixed(2) * 1
          item.VALUE02 = (item.VALUE01 * excldItem.ZZ_SEC_CHIEF_GAMT / 240).toFixed(0)
        } else if(item.PAY_DIV === 'ER_B012') {
          item.VALUE01 = (item.VALUE02 * 240 / _.find(payItem, { PAY_DIV: 'ER_A001' }).VALUE01).toFixed(2) * 1
        } else {
          item.VALUE02 = !excldItem.DAYS * 1 || excldItem.DAYS * 1 == 0 ? 0 : ((item.VALUE01 * 1) * (excldItem.WORK_DAYS * 1) / (excldItem.DAYS * 1)).toFixed(0) * 1
        }
      }
    })
  }
}

const calcSang = () => {
  const hueCnt = getMSang() && getMSang().HUE_CNT ? getMSang().HUE_CNT : 0

  // 상여 계산(생일축하금 ~ 상여금)
  payList.SANG.forEach(item => {
    // console.log('item', item)

    if(excldDays.value === 0 && hueCnt === 0) {
      item.CALC_DAYS = 3
      item.ALL_DAYS = 12
    } else if(excldDays.value === 0 && hueCnt > 0) {
      if(item.PAY_DIV !== '300_E' && item.PAY_DIV !== '300_B') {
        item.CALC_DAYS = 3
        item.ALL_DAYS = 12
      } else {
        item.CALC_DAYS = sanDays.value
        item.ALL_DAYS = (payList.EXCLD.length > 0 ? payList.EXCLD[0].YEAR_DAYS : 0) - (excldDays.value + hueCnt)
      }
    } else {
      item.CALC_DAYS = sanDays.value
      item.ALL_DAYS = (payList.EXCLD.length > 0 ? payList.EXCLD[0].YEAR_DAYS : 0)
                      - (item.PAY_DIV === '300_E' || item.PAY_DIV === '300_B' ? excldDays.value + hueCnt : 0)
    }

    // if(excldDays.value > 0 || hueCnt > 0) {
    //   item.CALC_DAYS = sanDays.value
    //   item.ALL_DAYS = payList.EXCLD.length > 0 ? payList.EXCLD[0].YEAR_DAYS : 0

    //   if(item.PAY_DIV === '300_E' || item.PAY_DIV === '300_B') {
    //     item.ALL_DAYS = item.ALL_DAYS - excldDays.value - hueCnt
    //   }
    // } else {
    //   item.CALC_DAYS = 3
    //   item.ALL_DAYS = 12
    // }

    item.VALUE02 = !item.ALL_DAYS || item.ALL_DAYS == 0 ? 0 : ((item.VALUE01 * 1) * (item.CALC_DAYS * 1) / (item.ALL_DAYS * 1)).toFixed(0) * 1
  })
}

const calcSangByDiv = payDiv => {
  // 상여 계산(생일축하금 ~ 상여금)
  payList.SANG.forEach(item => {
    if(item.PAY_DIV === payDiv) {
      item.VALUE02 = !item.ALL_DAYS || item.ALL_DAYS == 0 ? 0 : ((item.VALUE01 * 1) * (item.CALC_DAYS * 1) / (item.ALL_DAYS * 1)).toFixed(0) * 1
    }
  })
}

const calcMSang = () => {
  getSang('300_B').VALUE01 = getMSang().VALUE01
                           + getMSang().VALUE02
                           + getMSang().VALUE03
                           + getMSang().VALUE04
                           + getMSang().VALUE05
                           + getMSang().VALUE06
                           + getMSang().VALUE07
                           + getMSang().VALUE08
                           + getMSang().VALUE09
                           + getMSang().VALUE10
                           + getMSang().VALUE11
                           + getMSang().VALUE12
                           + getMSang().VALUE03_QT
                           + getMSang().VALUE06_QT
                           + getMSang().VALUE09_QT
                           + getMSang().VALUE12_QT
  
   calcSangByDiv('300_B')
}

const calcVaction = () => {
  // getSang('ER_H013').VALUE01 = Math.round(getMSang().ZZ_GENERAL_PAY / 2 + 1000000)
  // console.log('props.params', props.params)
  getSang('ER_H013').VALUE01 = Math.round(getMSang().ZZ_GENERAL_PAY / 2 + (props.params.VAC_MONEY * 1))
  calcSangByDiv('ER_H013')
}

onMounted(() => {
  vm.$nextTick(() => {
    gridTitle.value.setBtnProperty('btnModify', 'text', '소급적용')
    gridTitle.value.setBtnProperty('btnConfirm', 'text', '최종확정')
  })
})

defineExpose({
  changeTab,
})
</script>

<template>
  <div class="h-grow">
    <v-sheet class="h-auto">
      <IGridTitle
        ref="gridTitle"
        :button-list="['btnSearch', 'btnImport', 'btnRevision', 'btnModify', 'btnConfirm', 'btnUpdate', 'btnDelete', 'btnPrint']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="searchArea d-flex">
        <i-select
          v-model="searchParams.REV"
          :label="$t('Rev.')"
          :items="revList"
          item-value="REV"
          item-title="REV"
          width="135px"
          @update:modelValue="setFn(), btnSearch()"
          margin="15px"
        />
        <i-input
          v-model="searchParams.FN_YN"
          :label="$t('최종여부')"
          width="125px"
          margin="15px"
          readonly
        />
        <i-input
          v-model="props.params.FORM_NM"
          :label="$t('양식구분')"
          width="130px"
          margin="15px"
          readonly
        />
        <i-input
          v-model="props.params.CMPNY_NM"
          :label="$t('회사')"
          width="170px"
          margin="15px"
          readonly
        />
        <i-input
          v-model="props.params.BSNS_NM"
          :label="$t('사업부')"
          width="180px"
          margin="15px"
          readonly
        />
        <i-input
          v-model="props.params.DEPT_NM"
          :label="$t('부서')"
          width="190px"
          margin="15px"
          readonly
        />
        <i-input
          v-model="props.params.EMP_NO"
          :label="$t('재해자')"
          width="140px"
          margin="5px"
          readonly

        />
        <i-input
          v-model="props.params.EMP_NM"
          width="95px"
          margin="15px"
          readonly
        />
        <i-input
          v-model="props.params.OCCURDATE"
          :label="$t('재해일')"
          width="150px"
          margin="15px"
          readonly
        />
        <i-input
          v-model="props.params.SALARYDTE"
          :label="$t('산정기준일')"
          width="175px"
          margin="15px"
          readonly
        />
        <i-input
          v-model="birthDay"
          :label="$t('생년월일')"
          width="140px"
          margin="0"
          readonly
        />
      </v-sheet>
      <v-sheet class="content-area-tab">
        <div class="d-flex align-start">
          <template v-if="props.params.FORM_NM">
            <!-- 기본 -->
            <template v-if="props.params.FORM_NM.indexOf('기본') > -1">
              <table>
                <tr>
                  <th colspan="2">통상임금</th>
                  <td class="table-col text-end"><i-number v-model="getExcld(1).ZZ_SEC_CHIEF_GAMT" :readonly="isReadOnly" @input="calcPay(1, 'ER_B007')" @keyup.enter="autoInput(1, 'ZZ_SEC_CHIEF_GAMT')" /></td>
                  <td class="table-col text-end"><i-number v-model="getExcld(2).ZZ_SEC_CHIEF_GAMT" :readonly="isReadOnly" @input="calcPay(2, 'ER_B007')" @keyup.enter="autoInput(2, 'ZZ_SEC_CHIEF_GAMT')" /></td>
                  <td class="table-col text-end"><i-number v-model="getExcld(3).ZZ_SEC_CHIEF_GAMT" :readonly="isReadOnly" @input="calcPay(3, 'ER_B007')" @keyup.enter="autoInput(3, 'ZZ_SEC_CHIEF_GAMT')" /></td>
                  <td class="table-col text-end"><i-number v-model="getExcld(4).ZZ_SEC_CHIEF_GAMT" :readonly="isReadOnly" @input="calcPay(4, 'ER_B007')" /></td>
                  <!-- <td class="table-col text-end">{{ getExcld(1).ZZ_SEC_CHIEF_GAMT ? getExcld(1).ZZ_SEC_CHIEF_GAMT.toLocaleString('en-US') : '-' }}</td>
                  <td class="table-col text-end">{{ getExcld(2).ZZ_SEC_CHIEF_GAMT ? getExcld(2).ZZ_SEC_CHIEF_GAMT.toLocaleString('en-US') : '-' }}</td>
                  <td class="table-col text-end">{{ getExcld(3).ZZ_SEC_CHIEF_GAMT ? getExcld(3).ZZ_SEC_CHIEF_GAMT.toLocaleString('en-US') : '-' }}</td>
                  <td class="table-col text-end">{{ getExcld(4).ZZ_SEC_CHIEF_GAMT ? getExcld(4).ZZ_SEC_CHIEF_GAMT.toLocaleString('en-US') : '-' }}</td> -->
                </tr>
                <tr>
                  <th rowspan="2" colspan="2">임금계산기간</th>
                  <th class="table-col">{{ getExcld(1).FROM_DTE }}</th>
                  <th class="table-col">{{ getExcld(2).FROM_DTE }}</th>
                  <th class="table-col">{{ getExcld(3).FROM_DTE }}</th>
                  <th class="table-col">{{ getExcld(4).FROM_DTE }}</th>
                </tr>
                <tr>
                  <th>{{ getExcld(1).TO_DTE }}</th>
                  <th>{{ getExcld(2).TO_DTE }}</th>
                  <th>{{ getExcld(3).TO_DTE }}</th>
                  <th>{{ getExcld(4).TO_DTE }}</th>
                </tr>
                <tr>
                  <th colspan="2">해당월 일수</th>
                  <td class="text-center">{{ getExcld(1).DAYS }}</td>
                  <td class="text-center">{{ getExcld(2).DAYS }}</td>
                  <td class="text-center">{{ getExcld(3).DAYS }}</td>
                  <td class="text-center">{{ getExcld(4).DAYS }}</td>
                </tr>
                <tr>
                  <th colspan="2">
                    <div class="d-flex align-center h-full">
                      <div class="all-work-days" />
                      <div class="flex-grow-1">제외 일수</div>
                      <div class="all-work-days aw-data h-full d-flex justify-center align-center">
                        {{ excldDays }}
                      </div>
                    </div>
                  </th>
                  <td class="td-excld text-center">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt">
                        <i-number v-model="getExcld(1).EXCLD_CNT" :readonly="isReadOnly" @input="calcPay(1)" />
                      </div>
                      <div class="div-remark flex-grow-1">
                        <v-text-field v-model="getExcld(1).REMARK" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld text-center">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt">
                        <i-number v-model="getExcld(2).EXCLD_CNT" :readonly="isReadOnly" @input="calcPay(2)" />
                      </div>
                      <div class="div-remark flex-grow-1">
                        <v-text-field v-model="getExcld(2).REMARK" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld text-center">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt">
                        <i-number v-model="getExcld(3).EXCLD_CNT" :readonly="isReadOnly" @input="calcPay(3)" />
                      </div>
                      <div class="div-remark flex-grow-1">
                        <v-text-field v-model="getExcld(3).REMARK" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld text-center">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt">
                        <i-number v-model="getExcld(4).EXCLD_CNT" :readonly="isReadOnly" @input="calcPay(4)" />
                      </div>
                      <div class="div-remark flex-grow-1">
                        <v-text-field v-model="getExcld(4).REMARK" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th colspan="2">
                    <div class="d-flex align-center h-full">
                      <div class="all-work-days" />
                      <div class="flex-grow-1">산정 일수</div>
                      <div class="all-work-days aw-data h-full d-flex justify-center align-center">
                        {{ sanDays }}
                      </div>
                    </div>
                  </th>
                  <td class="text-center">{{ getExcld(1).WORK_DAYS }}</td>
                  <td class="text-center">{{ getExcld(2).WORK_DAYS }}</td>
                  <td class="text-center">{{ getExcld(3).WORK_DAYS }}</td>
                  <td class="text-center">{{ getExcld(4).WORK_DAYS }}</td>
                </tr>
                <tr>
                  <th :rowspan="22 + (hasB027 === 'Y' ? 2 : 0) + (hasB029 === 'Y' ? 2 : 0)" class="table-th1">임<br/><br/>금<br/><br/>내<br/><br/>역</th>
                  <th rowspan="2" class="table-th2">기본급</th>
                  <td><i-number v-model="getPay(1, 'ER_A001').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_A001')" @keyup.enter="autoInput(1, 'ER_A001')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_A001').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_A001')" @keyup.enter="autoInput(2, 'ER_A001')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_A001').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_A001')" @keyup.enter="autoInput(3, 'ER_A001')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_A001').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_A001')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_A001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_A001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_A001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_A001').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2" v-html="title_ER_H066" />
                  <td><i-number v-model="getPay(1, 'ER_H066').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_H066')" @keyup.enter="autoInput(1, 'ER_H066')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_H066').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_H066')" @keyup.enter="autoInput(2, 'ER_H066')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_H066').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_H066')" @keyup.enter="autoInput(3, 'ER_H066')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_H066').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_H066')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_H066').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_H066').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_H066').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_H066').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">지역복지</th>
                  <td><i-number v-model="getPay(1, 'ER_C002').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_C002')" @keyup.enter="autoInput(1, 'ER_C002')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_C002').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_C002')" @keyup.enter="autoInput(2, 'ER_C002')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_C002').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_C002')" @keyup.enter="autoInput(3, 'ER_C002')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_C002').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_C002')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_C002').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_C002').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_C002').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_C002').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">근속수당</th>
                  <td><i-number v-model="getPay(1, 'ER_C003').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_C003')" @keyup.enter="autoInput(1, 'ER_C003')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_C003').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_C003')" @keyup.enter="autoInput(2, 'ER_C003')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_C003').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_C003')" @keyup.enter="autoInput(3, 'ER_C003')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_C003').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_C003')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_C003').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_C003').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_C003').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_C003').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">가족수당</th>
                  <td><i-number v-model="getPay(1, 'ER_C004').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_C004')" @keyup.enter="autoInput(1, 'ER_C004')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_C004').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_C004')" @keyup.enter="autoInput(2, 'ER_C004')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_C004').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_C004')" @keyup.enter="autoInput(3, 'ER_C004')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_C004').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_C004')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_C004').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_C004').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_C004').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_C004').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">직무환경수당</th>
                  <td><i-number v-model="getPay(1, 'ER_D027').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_D027')" @keyup.enter="autoInput(1, 'ER_D027')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_D027').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_D027')" @keyup.enter="autoInput(2, 'ER_D027')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_D027').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_D027')" @keyup.enter="autoInput(3, 'ER_D027')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_D027').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_D027')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_D027').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_D027').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_D027').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_D027').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">직책/생산수당</th>
                  <td><i-number v-model="getPay(1, 'ER_E001').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_E001')" @keyup.enter="autoInput(1, 'ER_E001')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_E001').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_E001')" @keyup.enter="autoInput(2, 'ER_E001')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_E001').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_E001')" @keyup.enter="autoInput(3, 'ER_E001')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_E001').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_E001')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_E001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_E001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_E001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_E001').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">기술/자격수당</th>
                  <td><i-number v-model="getPay(1, 'ER_F001').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_F001')" @keyup.enter="autoInput(1, 'ER_F001')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_F001').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_F001')" @keyup.enter="autoInput(2, 'ER_F001')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_F001').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_F001')" @keyup.enter="autoInput(3, 'ER_F001')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_F001').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_F001')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_F001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_F001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_F001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_F001').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">개인연금</th>
                  <td><i-number v-model="getPay(1, 'ER_I002').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_I002')" @keyup.enter="autoInput(1, 'ER_I002')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_I002').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_I002')" @keyup.enter="autoInput(2, 'ER_I002')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_I002').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_I002')" @keyup.enter="autoInput(3, 'ER_I002')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_I002').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_I002')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_I002').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_I002').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_I002').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_I002').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">연장근로<br/>(2시급적용)</th>
                  <td><i-number v-model="getPay(1, 'ER_B007').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_B007')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_B007').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_B007')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_B007').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_B007')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_B007').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_B007')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_B007').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_B007').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_B007').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_B007').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">연장근로<br/>(1시급적용)</th>
                  <td><i-number v-model="getPay(1, 'ER_B012').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_B012')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_B012').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_B012')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_B012').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_B012')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_B012').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_B012')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_B012').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_B012').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_B012').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_B012').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <template v-if="hasB027 === 'Y'">
                  <tr>
                    <th rowspan="2">시운전승선</th>
                    <td><i-number v-model="getPay(1, 'ER_B027').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(2, 'ER_B027').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(3, 'ER_B027').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(4, 'ER_B027').VALUE01" :readonly="isReadOnly" /></td>
                  </tr>
                  <tr>
                    <td><i-number v-model="getPay(1, 'ER_B027').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(2, 'ER_B027').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(3, 'ER_B027').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(4, 'ER_B027').VALUE02" :readonly="isReadOnly" /></td>
                  </tr>
                </template>
                <template v-if="hasB029 === 'Y'">
                  <tr>
                    <th rowspan="2">포괄수당</th>
                    <td><i-number v-model="getPay(1, 'ER_B029').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(2, 'ER_B029').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(3, 'ER_B029').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(4, 'ER_B029').VALUE01" :readonly="isReadOnly" /></td>
                  </tr>
                  <tr>
                    <td><i-number v-model="getPay(1, 'ER_B029').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(2, 'ER_B029').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(3, 'ER_B029').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(4, 'ER_B029').VALUE02" :readonly="isReadOnly" /></td>
                  </tr>
                </template>
                <tr>
                  <th colspan="2">소계</th>
                  <td class="text-end">{{ sum1 }}</td>
                  <td class="text-end">{{ sum2 }}</td>
                  <td class="text-end">{{ sum3 }}</td>
                  <td class="text-end">{{ sum4 }}</td>
                </tr>
                <tr>
                  <th colspan="2">급여</th>
                  <td colspan="3" class="text-end no-border">=</td>
                  <td class="text-end no-border">{{ sumAll }}</td>
                </tr>
                <tr>
                  <th rowspan="5">상<br/><br/>여</th>
                  <th>생일축하금</th>
                  <td class="no-border">
                    <i-number v-model="getSang('ER_I039').VALUE01" :readonly="isReadOnly" @input="calcSangByDiv('ER_I039')" />
                  </td>
                  <td colspan="2" class="no-border">
                    <div class="d-flex align-center">
                      <div class="div-calc text-center pr-2">X</div>
                      <i-number v-model="getSang('ER_I039').CALC_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('ER_I039')" />
                      <div class="div-calc text-center mx-1">/</div>
                      <i-number v-model="getSang('ER_I039').ALL_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('ER_I039')" />
                      <div class="div-calc text-end pl-1">=</div>
                    </div>
                  </td>
                  <td class="no-border"><i-number v-model="getSang('ER_I039').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th>휴가/귀향비</th>
                  <td class="no-border">
                    <i-number v-model="getSang('ER_H013').VALUE01" :readonly="isReadOnly" @input="calcSangByDiv('ER_H013')" />
                  </td>
                  <td colspan="2" class="no-border">
                    <div class="d-flex align-center">
                      <div class="div-calc text-center pr-2">X</div>
                      <i-number v-model="getSang('ER_H013').CALC_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('ER_H013')" />
                      <div class="div-calc text-center mx-1">/</div>
                      <i-number v-model="getSang('ER_H013').ALL_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('ER_H013')" />
                      <div class="div-calc text-end pl-1">=</div>
                    </div>
                  </td>
                  <td class="no-border"><i-number v-model="getSang('ER_H013').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th>연월차수당</th>
                  <td class="no-border">
                    <i-number v-model="getSang('ER_B020').VALUE01" :readonly="isReadOnly" @input="calcSangByDiv('ER_B020')" />
                  </td>
                  <td colspan="2" class="no-border">
                    <div class="d-flex align-center">
                      <div class="div-calc text-center pr-2">X</div>
                      <i-number v-model="getSang('ER_B020').CALC_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('ER_B020')" />
                      <div class="div-calc text-center mx-1">/</div>
                      <i-number v-model="getSang('ER_B020').ALL_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('ER_B020')" />
                      <div class="div-calc text-end pl-1">=</div>
                    </div>
                  </td>
                  <td class="no-border"><i-number v-model="getSang('ER_B020').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th>명절상여</th>
                  <td class="no-border">
                    <i-number v-model="getSang('300_E').VALUE01" :readonly="isReadOnly" @input="calcSangByDiv('300_E')" />
                  </td>
                  <td colspan="2" class="no-border">
                    <div class="d-flex align-center">
                      <div class="div-calc text-center pr-2">X</div>
                      <i-number v-model="getSang('300_E').CALC_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('300_E')" />
                      <div class="div-calc text-center mx-1">/</div>
                      <i-number v-model="getSang('300_E').ALL_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('300_E')" />
                      <div class="div-calc text-end pl-1">=</div>
                    </div>
                  </td>
                  <td class="no-border"><i-number v-model="getSang('300_E').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th>상여금</th>
                  <td class="no-border">
                    <i-number v-model="getSang('300_B').VALUE01" :readonly="isReadOnly" @input="calcSangByDiv('300_B')" />
                  </td>
                  <td colspan="2" class="no-border">
                    <div class="d-flex align-center">
                      <div class="div-calc text-center pr-2">X</div>
                      <i-number v-model="getSang('300_B').CALC_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('300_B')" />
                      <div class="div-calc text-center mx-1">/</div>
                      <i-number v-model="getSang('300_B').ALL_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('300_B')" />
                      <div class="div-calc text-end pl-1">=</div>
                    </div>
                  </td>
                  <td class="no-border"><i-number v-model="getSang('300_B').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th colspan="2">7월 약정</th>
                  <td colspan="4" class="table-col text-end pr-2">
                    <i-number v-model="getMSang().ZZ_GENERAL_PAY" :readonly="isReadOnly" @input="calcVaction" />
                  </td>
                </tr>
                <tr>
                  <th rowspan="4" colspan="2">월 상여금 내역</th>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        1월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE01" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        4월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE04" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        7월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE07" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        10월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE10" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        2월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE02" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        5월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE05" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        8월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE08" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        11월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE11" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        3월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE03" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        6월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE06" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        9월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE09" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        12월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE12" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        3월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE03_QT" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        6월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE06_QT" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        9월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE09_QT" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        12월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE12_QT" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th colspan="2">휴직일수</th>
                  <td><i-number v-model="getMSang().HUE_CNT" :readonly="isReadOnly" @input="calcSang()" /></td>
                  <td colspan="3"><v-text-field v-model="getMSang().HUE_DESC" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th colspan="2">평균임금(日)</th>
                  <td colspan="2" class="text-center">￦{{ sumAvg }}</td>
                  <td colspan="2" class="text-center">{{ sumAvg2 }}</td>
                </tr>
              </table>
            </template>
            <!--  외국인 -->
            <template v-else>
              <table>
                <tr>
                  <th colspan="2">통상임금</th>
                  <td class="table-col text-end"><i-number v-model="getExcld(1).ZZ_SEC_CHIEF_GAMT" :readonly="isReadOnly" @input="calcPay(1, 'ER_B007')" @keyup.enter="autoInput(1, 'ZZ_SEC_CHIEF_GAMT')" /></td>
                  <td class="table-col text-end"><i-number v-model="getExcld(2).ZZ_SEC_CHIEF_GAMT" :readonly="isReadOnly" @input="calcPay(2, 'ER_B007')" @keyup.enter="autoInput(2, 'ZZ_SEC_CHIEF_GAMT')" /></td>
                  <td class="table-col text-end"><i-number v-model="getExcld(3).ZZ_SEC_CHIEF_GAMT" :readonly="isReadOnly" @input="calcPay(3, 'ER_B007')" @keyup.enter="autoInput(3, 'ZZ_SEC_CHIEF_GAMT')" /></td>
                  <td class="table-col text-end"><i-number v-model="getExcld(4).ZZ_SEC_CHIEF_GAMT" :readonly="isReadOnly" @input="calcPay(4, 'ER_B007')" /></td>
                  <!-- <td class="table-col text-end">{{ getExcld(1).ZZ_SEC_CHIEF_GAMT ? getExcld(1).ZZ_SEC_CHIEF_GAMT.toLocaleString('en-US') : '-' }}</td>
                  <td class="table-col text-end">{{ getExcld(2).ZZ_SEC_CHIEF_GAMT ? getExcld(2).ZZ_SEC_CHIEF_GAMT.toLocaleString('en-US') : '-' }}</td>
                  <td class="table-col text-end">{{ getExcld(3).ZZ_SEC_CHIEF_GAMT ? getExcld(3).ZZ_SEC_CHIEF_GAMT.toLocaleString('en-US') : '-' }}</td>
                  <td class="table-col text-end">{{ getExcld(4).ZZ_SEC_CHIEF_GAMT ? getExcld(4).ZZ_SEC_CHIEF_GAMT.toLocaleString('en-US') : '-' }}</td> -->
                </tr>
                <tr>
                  <th rowspan="2" colspan="2">임금계산기간</th>
                  <th class="table-col">{{ getExcld(1).FROM_DTE }}</th>
                  <th class="table-col">{{ getExcld(2).FROM_DTE }}</th>
                  <th class="table-col">{{ getExcld(3).FROM_DTE }}</th>
                  <th class="table-col">{{ getExcld(4).FROM_DTE }}</th>
                </tr>
                <tr>
                  <th>{{ getExcld(1).TO_DTE }}</th>
                  <th>{{ getExcld(2).TO_DTE }}</th>
                  <th>{{ getExcld(3).TO_DTE }}</th>
                  <th>{{ getExcld(4).TO_DTE }}</th>
                </tr>
                <tr>
                  <th colspan="2">해당월 일수</th>
                  <td class="text-center">{{ getExcld(1).DAYS }}</td>
                  <td class="text-center">{{ getExcld(2).DAYS }}</td>
                  <td class="text-center">{{ getExcld(3).DAYS }}</td>
                  <td class="text-center">{{ getExcld(4).DAYS }}</td>
                </tr>
                <tr>
                  <th colspan="2">
                    <div class="d-flex align-center h-full">
                      <div class="all-work-days" />
                      <div class="flex-grow-1">제외 일수</div>
                      <div class="all-work-days aw-data h-full d-flex justify-center align-center">
                        {{ excldDays }}
                      </div>
                    </div>
                  </th>
                  <td class="td-excld text-center">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt">
                        <i-number v-model="getExcld(1).EXCLD_CNT" :readonly="isReadOnly" @input="calcPay(1)" />
                      </div>
                      <div class="div-remark flex-grow-1">
                        <v-text-field v-model="getExcld(1).REMARK" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld text-center">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt">
                        <i-number v-model="getExcld(2).EXCLD_CNT" :readonly="isReadOnly" @input="calcPay(2)" />
                      </div>
                      <div class="div-remark flex-grow-1">
                        <v-text-field v-model="getExcld(2).REMARK" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld text-center">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt">
                        <i-number v-model="getExcld(3).EXCLD_CNT" :readonly="isReadOnly" @input="calcPay(3)" />
                      </div>
                      <div class="div-remark flex-grow-1">
                        <v-text-field v-model="getExcld(3).REMARK" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld text-center">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt">
                        <i-number v-model="getExcld(4).EXCLD_CNT" :readonly="isReadOnly" @input="calcPay(4)" />
                      </div>
                      <div class="div-remark flex-grow-1">
                        <v-text-field v-model="getExcld(4).REMARK" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th colspan="2">
                    <div class="d-flex align-center h-full">
                      <div class="all-work-days" />
                      <div class="flex-grow-1">산정 일수</div>
                      <div class="all-work-days aw-data h-full d-flex justify-center align-center">
                        {{ sanDays }}
                      </div>
                    </div>
                  </th>
                  <td class="text-center">{{ getExcld(1).WORK_DAYS }}</td>
                  <td class="text-center">{{ getExcld(2).WORK_DAYS }}</td>
                  <td class="text-center">{{ getExcld(3).WORK_DAYS }}</td>
                  <td class="text-center">{{ getExcld(4).WORK_DAYS }}</td>
                </tr>
                <tr>
                  <th :rowspan="12 + (hasB027 === 'Y' ? 2 : 0) + (hasB029 === 'Y' ? 2 : 0)" class="table-th1">임<br/><br/>금<br/><br/>내<br/><br/>역</th>
                  <th rowspan="2" class="table-th2">기본급</th>
                  <td><i-number v-model="getPay(1, 'ER_A001').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_A001')" @keyup.enter="autoInput(1, 'ER_A001')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_A001').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_A001')" @keyup.enter="autoInput(2, 'ER_A001')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_A001').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_A001')" @keyup.enter="autoInput(3, 'ER_A001')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_A001').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_A001')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_A001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_A001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_A001').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_A001').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2" v-html="title_ER_H066" />
                  <td><i-number v-model="getPay(1, 'ER_H066').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_H066')" @keyup.enter="autoInput(1, 'ER_H066')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_H066').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_H066')" @keyup.enter="autoInput(2, 'ER_H066')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_H066').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_H066')" @keyup.enter="autoInput(3, 'ER_H066')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_H066').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_H066')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_H066').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_H066').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_H066').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_H066').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">정착지원수당</th>
                  <td><i-number v-model="getPay(1, 'ER_G018').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_G018')" @keyup.enter="autoInput(1, 'ER_G018')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_G018').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_G018')" @keyup.enter="autoInput(2, 'ER_G018')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_G018').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_G018')" @keyup.enter="autoInput(3, 'ER_G018')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_G018').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_G018')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_G018').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_G018').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_G018').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_G018').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">직무환경수당</th>
                  <td><i-number v-model="getPay(1, 'ER_D027').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_D027')" @keyup.enter="autoInput(1, 'ER_D027')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_D027').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_D027')" @keyup.enter="autoInput(2, 'ER_D027')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_D027').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_D027')" @keyup.enter="autoInput(3, 'ER_D027')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_D027').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_D027')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_D027').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_D027').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_D027').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_D027').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">연장근로<br/>(2시급적용)</th>
                  <td><i-number v-model="getPay(1, 'ER_B007').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_B007')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_B007').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_B007')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_B007').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_B007')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_B007').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_B007')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_B007').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_B007').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_B007').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_B007').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th rowspan="2">연장근로<br/>(1시급적용)</th>
                  <td><i-number v-model="getPay(1, 'ER_B012').VALUE01" :readonly="isReadOnly" @input="calcPay(1, 'ER_B012')" /></td>
                  <td><i-number v-model="getPay(2, 'ER_B012').VALUE01" :readonly="isReadOnly" @input="calcPay(2, 'ER_B012')" /></td>
                  <td><i-number v-model="getPay(3, 'ER_B012').VALUE01" :readonly="isReadOnly" @input="calcPay(3, 'ER_B012')" /></td>
                  <td><i-number v-model="getPay(4, 'ER_B012').VALUE01" :readonly="isReadOnly" @input="calcPay(4, 'ER_B012')" /></td>
                </tr>
                <tr>
                  <td><i-number v-model="getPay(1, 'ER_B012').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(2, 'ER_B012').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(3, 'ER_B012').VALUE02" :readonly="isReadOnly" /></td>
                  <td><i-number v-model="getPay(4, 'ER_B012').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <template v-if="hasB027 === 'Y'">
                  <tr>
                    <th rowspan="2">시운전승선</th>
                    <td><i-number v-model="getPay(1, 'ER_B027').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(2, 'ER_B027').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(3, 'ER_B027').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(4, 'ER_B027').VALUE01" :readonly="isReadOnly" /></td>
                  </tr>
                  <tr>
                    <td><i-number v-model="getPay(1, 'ER_B027').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(2, 'ER_B027').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(3, 'ER_B027').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(4, 'ER_B027').VALUE02" :readonly="isReadOnly" /></td>
                  </tr>
                </template>
                <template v-if="hasB029 === 'Y'">
                  <tr>
                    <th rowspan="2">포괄수당</th>
                    <td><i-number v-model="getPay(1, 'ER_B029').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(2, 'ER_B029').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(3, 'ER_B029').VALUE01" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(4, 'ER_B029').VALUE01" :readonly="isReadOnly" /></td>
                  </tr>
                  <tr>
                    <td><i-number v-model="getPay(1, 'ER_B029').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(2, 'ER_B029').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(3, 'ER_B029').VALUE02" :readonly="isReadOnly" /></td>
                    <td><i-number v-model="getPay(4, 'ER_B029').VALUE02" :readonly="isReadOnly" /></td>
                  </tr>
                </template>
                <tr>
                  <th colspan="2">소계</th>
                  <td class="text-end">{{ sum1 }}</td>
                  <td class="text-end">{{ sum2 }}</td>
                  <td class="text-end">{{ sum3 }}</td>
                  <td class="text-end">{{ sum4 }}</td>
                </tr>
                <tr>
                  <th colspan="2">급여</th>
                  <td colspan="3" class="text-end no-border">=</td>
                  <td class="text-end no-border">{{ sumAll }}</td>
                </tr>
                <tr>
                  <th colspan="2">상여금/휴가/귀향비</th>
                  <td class="no-border">
                    <i-number v-model="getSang('300_B').VALUE01" :readonly="isReadOnly" @input="calcSangByDiv('300_B')" />
                  </td>
                  <td colspan="2" class="no-border">
                    <div class="d-flex align-center">
                      <div class="div-calc text-center pr-2">X</div>
                      <i-number v-model="getSang('300_B').CALC_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('300_B')" />
                      <div class="div-calc text-center mx-1">/</div>
                      <i-number v-model="getSang('300_B').ALL_DAYS" :readonly="isReadOnly" @input="calcSangByDiv('300_B')" />
                      <div class="div-calc text-end pl-1">=</div>
                    </div>
                  </td>
                  <td class="no-border"><i-number v-model="getSang('300_B').VALUE02" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th colspan="2">7월 약정</th>
                  <td colspan="4" class="table-col text-end pr-2">
                    <i-number v-model="getMSang().ZZ_GENERAL_PAY" :readonly="isReadOnly" @input="calcVaction" />
                  </td>
                </tr>
                <tr>
                  <th rowspan="4" colspan="2">월 상여금 내역</th>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        1월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE01" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        4월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE04" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        7월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE07" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        10월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE10" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        2월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE02" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        5월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE05" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        8월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE08" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        11월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE11" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        3월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE03" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        6월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE06" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        9월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE09" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        12월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE12" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        3월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE03_QT" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        6월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE06_QT" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        9월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE09_QT" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                  <td class="td-excld">
                    <div class="div-excld d-flex">
                      <div class="div-excld-cnt d-flex justify-center align-center">
                        12월
                      </div>
                      <div class="div-remark flex-grow-1 d-flex justify-center align-center">
                        <i-number v-model="getMSang().VALUE12_QT" :readonly="isReadOnly" @input="calcMSang()" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th colspan="2">휴직일수</th>
                  <td><i-number v-model="getMSang().HUE_CNT" :readonly="isReadOnly" @input="calcSang()" /></td>
                  <td colspan="3"><v-text-field v-model="getMSang().HUE_DESC" :readonly="isReadOnly" /></td>
                </tr>
                <tr>
                  <th colspan="2">평균임금(日)</th>
                  <td colspan="2" class="text-center">￦{{ sumAvg }}</td>
                  <td colspan="2" class="text-center">{{ sumAvg2 }}</td>
                </tr>
              </table>
            </template>
          </template>

          <table class="ml-3" style="width: 350px;">
            <tr>
              <th>비고</th>
            </tr>
            <tr>
              <td>
                <v-textarea
                  v-model="getMSang().REMARK"
                  rows="7"
                />
              </td>
            </tr>
          </table>
        </div>
      </v-sheet>
    </v-sheet>

    <OZReport :showPop="showOz" :reportName="reportName" :params="ozParams" @close="showOz = $event" />
  </div>
</template>

<style scoped lang="scss">
.content-area-tab {
  height: calc(100vh - 351px);
  overflow-y: auto;
}

table {
  // width: 750px;
  border-collapse: collapse;
  border: 1px solid #cccccc;

  th, td {
    height: 30px;
    // width: 125px;
  }

  td {
    padding: 4px;
  }

  th:not(.no-border), td:not(.no-border) {
    border: 1px solid #cccccc;
  }

  th {
    background-color: #eeeeee;
  }

  td.no-border {
    border-bottom: 1px solid #cccccc;
  }

  .all-work-days {
    width: 45px;
  }

  .aw-data {
    border-left: 1px solid #cccccc;
    background-color: #ffffff;
  }

  .div-calc {
    width: 35px;
  }
  
  .td-excld {
    position: relative;
    height: 44px;

    .div-excld {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      
      .div-excld-cnt {
        min-width: 45px;
        max-width: 45px;
        padding: 4px;
      }

      .div-remark {
        padding: 4px;
        border-left: 1px solid #cccccc;
      }
    }
  }

  .table-th1 {
    width: 60px;
  }

  .table-th2 {
    width: 125px;
  }

  .table-col {
    width: 160px;
  }
}
</style>