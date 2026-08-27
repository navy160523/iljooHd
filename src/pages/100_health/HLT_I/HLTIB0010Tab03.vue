<script setup>
import { ref } from 'vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import HLTIB0010Tab03_Tab01 from './HLTIB0010Tab03_Tab01.vue'
import { commonExecuteApi, commonSearchApi } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
const menuTitle = ref(null)
const userStore = useUserStore()
const emit = defineEmits(['btnCloseClick', 'saved', 'nextChangeStep', 'preChangeStep', 'impResistY'])

const tab = ref('work_1')
const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const isAlreadySaved = ref(false)
const props = defineProps({
  tab01Data: {
    type: Object,
  },
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    emit('btnCloseClick')
  } else if (btn.id === 'btnPrevStep') {
    emit('preChangeStep')
  } else if (btn.id === 'btnTemporaryStorage') {
    tempSaveTab03()
  } else if (btn.id === 'btnNextStep') {
    if (props.tab01Data.IMP_RESIST_YN === 'Y') {
      emit('impResistY')
    } else {
      saveTab03()
    }
  }
}

const checkModifyMessage = async () => {
  let resultArray = await checkModify()
  let resultString = resultArray.join(',')
  let message = `단위작업 ${resultString}에 수정사항이 있습니다.
                 저장하시겠습니까?`
  let result = await vm.$swal({
    title: message,
    showCancelButton: true,
  })
  return result.isConfirmed
}

const checkModify = async () => {
  let resultArray = []
  let tab01Flag = await tab01.value.getUpdatedFlag()
  let tab02Flag = await tab02.value.getUpdatedFlag()
  let tab03Flag = await tab03.value.getUpdatedFlag()

  if (Object.values(tab01Flag).some((x) => x === false)) {
    resultArray.push('1')
  }
  if (Object.values(tab02Flag).some((x) => x === false)) {
    resultArray.push('2')
  }
  if (Object.values(tab03Flag).some((x) => x === false)) {
    resultArray.push('3')
  }
  return resultArray
}

const checkSaveYn = async () => {
  let saveYnArray = []

  let data1 = await tab01.value.saveTab03_Tab01()
  let data2 = await tab02.value.saveTab03_Tab01()
  let data3 = await tab03.value.saveTab03_Tab01()

  const res = await Promise.all([
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_18',
      param: {
        ES_SEQ: data1[1].ES_SEQ,
        WORK_STANDARD_ID: data1[1].WORK_STANDARD_ID,
        UNIT_SEQ: data1[1].UNIT_SEQ,
        UNIT_GUBUN: data1[1].UNIT_GUBUN,
      },
    }),
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_18',
      param: {
        ES_SEQ: data2[1].ES_SEQ,
        WORK_STANDARD_ID: data2[1].WORK_STANDARD_ID,
        UNIT_SEQ: data2[1].UNIT_SEQ,
        UNIT_GUBUN: data2[1].UNIT_GUBUN,
      },
    }),
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_18',
      param: {
        ES_SEQ: data3[1].ES_SEQ,
        WORK_STANDARD_ID: data3[1].WORK_STANDARD_ID,
        UNIT_SEQ: data3[1].UNIT_SEQ,
        UNIT_GUBUN: data3[1].UNIT_GUBUN,
      },
    }),
  ])

  if (res[0].ORESULT_CUR[0].SAVE_YN === 'N' && data1[1].HO_NO !== '0') {
    saveYnArray.push('1')
  }
  if (res[1].ORESULT_CUR[0].SAVE_YN === 'N' && data2[1].HO_NO !== '0') {
    saveYnArray.push('2')
  }
  if (res[2].ORESULT_CUR[0].SAVE_YN === 'N' && data3[1].HO_NO !== '0') {
    saveYnArray.push('3')
  }

  return saveYnArray
}

const checkSaveYnMessage = async () => {
  let resultArray = await checkSaveYn()

  let resultString = resultArray.join(',')
  let message = `단위작업 ${resultString}이 저장된 데이터가 없습니다.
                 저장할 데이터를 체크후 진행해주세요.`
  let result = await vm.$swal({
    title: message,
  })
  return result.isConfirmed
}

//임시저장 관련 로직 시작
const tempSaveTab03 = async () => {
  let data1 = await tab01.value.saveTab03_Tab01() //이 코드 없으면 수정사항 변경 여부 확인못함
  let data2 = await tab02.value.saveTab03_Tab01() //이 코드 없으면 수정사항 변경 여부 확인못함
  let data3 = await tab03.value.saveTab03_Tab01() //이 코드 없으면 수정사항 변경 여부 확인못함
  let requiredFlag = await tempBeforeSaveTab03() //필수값 체크 후 수정사항 여부 체크
  //단위작업에 수정사항이 있는지 확인
  if (requiredFlag) {
    let modifyArray = await checkModify()
    //수정사항이 있을때
    if (modifyArray.length > 0) {
      let result = await checkModifyMessage()
      if (result) {
        new saveFlowHelper(vm, t).setQuery(tempSaveDataTab03).showMessage(false).setAfter(tempAfterSaveTab03).run()
      } else {
        return false
      }
    }
    //수정사항이 없을때
    else {
      new saveFlowHelper(vm, t)
        .setQuery(tempSaveDataTab03)
        .setConfirmMessage('임시저장 하시겠습니까?')
        .setAfter(tempAfterSaveTab03)
        .run()
    }
  }
}

const tempBeforeSaveTab03 = async () => {
  let data1 = await tab01.value.saveTab03_Tab01()
  let data2 = await tab02.value.saveTab03_Tab01()
  let data3 = await tab03.value.saveTab03_Tab01()

  //부담작업이 미해당
  if (data1[1].HO_NO !== '0') {
    if (!data1[1].WRK_LOAD) {
      Message.warn(t('단위작업1 작업부하를 입력해주세요.'))
      return false
    }
    if (!data1[1].WRK_FREQ) {
      Message.warn(t('단위작업1 작업빈도를 입력해주세요.'))
      return false
    }
    for (let i = 0; i < data1[0].length; i++) {
      if (!data1[0][i].HRMF_FCTR) {
        Message.warn(t('단위작업1 유해요인분석 유해요인코드를 입력해주세요.'))
        return false
      } else if (!data1[0][i].OCCR_CUSE) {
        Message.warn(t('단위작업1 유해요인분석 발생원인을 입력해주세요.'))
        return false
      } else if (!data1[0][i].IMP_YN) {
        Message.warn(t('단위작업1 유해요인분석 개선가능여부를 입력해주세요.'))
        return false
      } else if (data1[0][i].IMP_YN === 'A' && !data1[0][i].IMPLN_DSC) {
        Message.warn(t('단위작업1 개선가능여부가 개선가능일때는 개선계획은 필수값 입니다.'))
        return false
      } else if (data1[0][i].IMP_YN === 'B' && !data1[0][i].IMP_NO_RESN) {
        Message.warn(t('단위작업1 개선가능여부가 현행유지일때는 현행 유지 사유는 필수값 입니다.'))
        return false
      }
    }
  }
  if (data2[1].HO_NO !== '0') {
    if (!data2[1].WRK_LOAD) {
      Message.warn(t('단위작업2 작업부하를 입력해주세요.'))
      return false
    }
    if (!data2[1].WRK_FREQ) {
      Message.warn(t('단위작업2 작업빈도를 입력해주세요.'))
      return false
    }
    for (let i = 0; i < data2[0].length; i++) {
      if (!data2[0][i].HRMF_FCTR) {
        Message.warn(t('단위작업2 유해요인분석 유해요인코드를 입력해주세요.'))
        return false
      } else if (!data2[0][i].OCCR_CUSE) {
        Message.warn(t('단위작업2 유해요인분석 발생원인을 입력해주세요.'))
        return false
      } else if (!data2[0][i].IMP_YN) {
        Message.warn(t('단위작업2 유해요인분석 개선가능여부를 입력해주세요.'))
        return false
      } else if (data2[0][i].IMP_YN === 'A' && !data2[0][i].IMPLN_DSC) {
        Message.warn(t('단위작업2 개선가능여부가 개선가능일때는 개선계획은 필수값 입니다.'))
        return false
      } else if (data2[0][i].IMP_YN === 'B' && !data2[0][i].IMP_NO_RESN) {
        Message.warn(t('단위작업2 개선가능여부가 현행유지일때는 현행 유지 사유는 필수값 입니다.'))
        return false
      }
    }
  }

  if (data3[1].HO_NO !== '0') {
    if (!data3[1].WRK_LOAD) {
      Message.warn(t('단위작업3 작업부하를 입력해주세요.'))
      return false
    }
    if (!data3[1].WRK_FREQ) {
      Message.warn(t('단위작업3 작업빈도를 입력해주세요.'))
      return false
    }
    for (let i = 0; i < data3[0].length; i++) {
      if (!data3[0][i].HRMF_FCTR) {
        Message.warn(t('단위작업3 유해요인분석 유해요인코드를 입력해주세요.'))
        return false
      } else if (!data3[0][i].OCCR_CUSE) {
        Message.warn(t('단위작업3 유해요인분석 발생원인을 입력해주세요.'))
        return false
      } else if (!data3[0][i].IMP_YN) {
        Message.warn(t('단위작업3 유해요인분석 개선가능여부를 입력해주세요.'))
        return false
      } else if (data3[0][i].IMP_YN === 'A' && !data3[0][i].IMPLN_DSC) {
        Message.warn(t('단위작업3 개선가능여부가 개선가능일때는 개선계획은 필수값 입니다.'))
        return false
      } else if (data3[0][i].IMP_YN === 'B' && !data3[0][i].IMP_NO_RESN) {
        Message.warn(t('단위작업3 개선가능여부가 현행유지일때는 현행 유지 사유는 필수값 입니다.'))
        return false
      }
    }
  }

  return true
}

const tempSaveDataTab03 = () => {
  let data1 = tab01.value.saveTab03_Tab01()
  let data2 = tab02.value.saveTab03_Tab01()
  let data3 = tab03.value.saveTab03_Tab01()
  let saveParam1 = [] //유해요인평가 및 개선계획 유지 저장 데이터
  let saveParam2 = [] //단위작업등록 작업부하,총점수 저장 데이터
  saveParam2.push(data1[1])
  saveParam2.push(data2[1])
  saveParam2.push(data3[1])
  //단위작업1
  for (let i = 0; i < data1[0].length; i++) {
    let saveData = {
      ES_SEQ: data1[1].ES_SEQ, //순번
      WORK_STANDARD_ID: data1[1].WORK_STANDARD_ID, //작업표준 ID
      UNIT_SEQ: data1[1].UNIT_SEQ, //단위작업SEQ
      IMP_SEQ: data1[0][i].IMP_SEQ, //원인분석 SEQ
      ES_DATE: data1[1].ES_DATE, //조사일자
      HRMF_FCTR: data1[0][i].HRMF_FCTR, //유해요인코드
      OCCR_CUSE: data1[0][i].OCCR_CUSE, //발생원인
      IMP_YN: data1[0][i].IMP_YN, //개선가부
      IMP_NO_RESN: data1[0][i].IMP_NO_RESN, //현행유지사유
      IMPLN_DSC: data1[0][i].IMPLN_DSC, //개선계획
      UNIT_GUBUN: 1,
      USER_ID: userStore.userId, //유저아이디
    }
    saveParam1.push(saveData)
  }
  //단위작업2
  for (let i = 0; i < data2[0].length; i++) {
    let saveData = {
      ES_SEQ: data2[1].ES_SEQ, //순번
      WORK_STANDARD_ID: data2[1].WORK_STANDARD_ID, //작업표준 ID
      UNIT_SEQ: data2[1].UNIT_SEQ, //단위작업SEQ
      IMP_SEQ: data2[0][i].IMP_SEQ, //원인분석 SEQ
      ES_DATE: data2[1].ES_DATE, //조사일자
      HRMF_FCTR: data2[0][i].HRMF_FCTR, //유해요인코드
      OCCR_CUSE: data2[0][i].OCCR_CUSE, //발생원인
      IMP_YN: data2[0][i].IMP_YN, //개선가부
      IMP_NO_RESN: data2[0][i].IMP_NO_RESN, //현행유지사유
      IMPLN_DSC: data2[0][i].IMPLN_DSC, //개선계획
      UNIT_GUBUN: 2,
      USER_ID: userStore.userId, //유저아이디
    }
    saveParam1.push(saveData)
  }
  //단위작업3
  for (let i = 0; i < data3[0].length; i++) {
    let saveData = {
      ES_SEQ: data3[1].ES_SEQ, //순번
      WORK_STANDARD_ID: data3[1].WORK_STANDARD_ID, //작업표준 ID
      UNIT_SEQ: data3[1].UNIT_SEQ, //단위작업SEQ
      IMP_SEQ: data3[0][i].IMP_SEQ, //원인분석 SEQ
      ES_DATE: data3[1].ES_DATE, //조사일자
      HRMF_FCTR: data3[0][i].HRMF_FCTR, //유해요인코드
      OCCR_CUSE: data3[0][i].OCCR_CUSE, //발생원인
      IMP_YN: data3[0][i].IMP_YN, //개선가부
      IMP_NO_RESN: data3[0][i].IMP_NO_RESN, //현행유지사유
      IMPLN_DSC: data3[0][i].IMPLN_DSC, //개선계획
      UNIT_GUBUN: 3,
      USER_ID: userStore.userId, //유저아이디
    }
    saveParam1.push(saveData)
  }

  //개선계획 저장
  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_03',
    list: saveParam1,
  }).then(() => {
    //단위작업 작업부하,빈도저장
    return commonExecuteApi({
      queryId: 'HLTIB0010_SAVE_04',
      list: saveParam2,
    })
  })
}

const tempAfterSaveTab03 = async () => {
  let data1 = await tab01.value.saveTab03_Tab01() //변경사항 추적하기위해 저장후에 덮어씌움
  let data2 = await tab02.value.saveTab03_Tab01()
  let data3 = await tab03.value.saveTab03_Tab01()
  Message.success(t('저장되었습니다.'))
  //저장하고 재조회함 (삭제후 재조회하는 로직이랑 똑같아서 afterDelete씀)
  tab01.value.setUpdatedFlag(data1[0])
  tab02.value.setUpdatedFlag(data2[0])
  tab03.value.setUpdatedFlag(data3[0])

  tab01.value.afterDelete()
  tab02.value.afterDelete()
  tab03.value.afterDelete()

  isAlreadySaved.value = true
}
//임시저장 관련 로직 끝

const saveTab03 = async () => {
  let data1 = await tab01.value.saveTab03_Tab01() //이 코드 없으면 수정사항 변경 여부 확인못함
  let data2 = await tab02.value.saveTab03_Tab01() //이 코드 없으면 수정사항 변경 여부 확인못함
  let data3 = await tab03.value.saveTab03_Tab01() //이 코드 없으면 수정사항 변경 여부 확인못함
  let saveYnArray = await checkSaveYn()
  //다음단계진행할때 체크된데이터가 없고, 저장되어 있는 데이터가 없으면
  if (
    (data1[0].length === 0 && saveYnArray.includes('1')) ||
    (data2[0].length === 0 && saveYnArray.includes('2')) ||
    (data3[0].length === 0 && saveYnArray.includes('3'))
  ) {
    if (saveYnArray.length > 0) {
      let result = await checkSaveYnMessage()
      if (result) {
        return false
      }
    }
  } else {
    //체크된 데이터가 있으면 필수값 확인
    let requiredFlag = await beforeSaveTab03() //필수값을 전부 입력했다.
    if (requiredFlag) {
      //단위작업에 수정사항이 있는지 확인
      let modifyArray = await checkModify()
      //수정사항이 존재한다.
      if (modifyArray.length > 0) {
        let result = await checkModifyMessage()
        if (result) {
          new saveFlowHelper(vm, t).setQuery(saveDataTab03).showMessage(false).setAfter(afterSaveDataTab03).run()
        } else {
          return false
        }
      }
      //존재하지 않는다.
      else {
        emit('nextChangeStep')
      }
    }
  }
}

//저장관련 로직 시작
const beforeSaveTab03 = async () => {
  let data1 = await tab01.value.saveTab03_Tab01()
  let data2 = await tab02.value.saveTab03_Tab01()
  let data3 = await tab03.value.saveTab03_Tab01()

  // if (data1[0].length === 0) {
  //   Message.warn(t('단위작업1 유해요인분석을 선택 또는 입력해주세요.'))
  //   return false
  // }
  //부담작업이 부담작업없음에 체크되어 있으면 필수값 체크 하지 않도록
  if (data1[1].HO_NO !== '12') {
    //필수값 체크
    if (!data1[1].WRK_LOAD) {
      Message.warn(t('단위작업1 작업부하를 입력해주세요.'))
      return false
    }
    if (!data1[1].WRK_FREQ) {
      Message.warn(t('단위작업1 작업빈도를 입력해주세요.'))
      return false
    }
    for (let i = 0; i < data1[0].length; i++) {
      if (!data1[0][i].HRMF_FCTR) {
        Message.warn(t('단위작업1 유해요인분석 유해요인코드를 입력해주세요.'))
        return false
      } else if (!data1[0][i].OCCR_CUSE) {
        Message.warn(t('단위작업1 유해요인분석 발생원인을 입력해주세요.'))
        return false
      } else if (!data1[0][i].IMP_YN) {
        Message.warn(t('단위작업1 유해요인분석 개선가능여부를 입력해주세요.'))
        return false
      } else if (data1[0][i].IMP_YN === 'A' && !data1[0][i].IMPLN_DSC) {
        Message.warn(t('단위작업1 개선가능여부가 개선가능일때는 개선계획은 필수값 입니다.'))
        return false
      } else if (data1[0][i].IMP_YN === 'B' && !data1[0][i].IMP_NO_RESN) {
        Message.warn(t('단위작업1 개선가능여부가 현행유지일때는 현행 유지 사유는 필수값 입니다.'))
        return false
      }
    }
  }

  if (data2[1].HO_NO !== '12') {
    if (!data2[1].WRK_LOAD) {
      Message.warn(t('단위작업2 작업부하를 입력해주세요.'))
      return false
    }
    if (!data2[1].WRK_FREQ) {
      Message.warn(t('단위작업2 작업빈도를 입력해주세요.'))
      return false
    }
    for (let i = 0; i < data2[0].length; i++) {
      if (!data2[0][i].HRMF_FCTR) {
        Message.warn(t('단위작업2 유해요인분석 유해요인코드를 입력해주세요.'))
        return false
      } else if (!data2[0][i].OCCR_CUSE) {
        Message.warn(t('단위작업2 유해요인분석 발생원인을 입력해주세요.'))
        return false
      } else if (!data2[0][i].IMP_YN) {
        Message.warn(t('단위작업2 유해요인분석 개선가능여부를 입력해주세요.'))
        return false
      } else if (data2[0][i].IMP_YN === 'A' && !data2[0][i].IMPLN_DSC) {
        Message.warn(t('단위작업2 개선가능여부가 개선가능일때는 개선계획은 필수값 입니다.'))
        return false
      } else if (data2[0][i].IMP_YN === 'B' && !data2[0][i].IMP_NO_RESN) {
        Message.warn(t('단위작업2 개선가능여부가 현행유지일때는 현행 유지 사유는 필수값 입니다.'))
        return false
      }
    }
  }

  if (data3[1].HO_NO !== '12') {
    if (!data3[1].WRK_LOAD) {
      Message.warn(t('단위작업3 작업부하를 입력해주세요.'))
      return false
    }
    if (!data3[1].WRK_FREQ) {
      Message.warn(t('단위작업3 작업빈도를 입력해주세요.'))
      return false
    }
    for (let i = 0; i < data3[0].length; i++) {
      if (!data3[0][i].HRMF_FCTR) {
        Message.warn(t('단위작업3 유해요인분석 유해요인코드를 입력해주세요.'))
        return false
      } else if (!data3[0][i].OCCR_CUSE) {
        Message.warn(t('단위작업3 유해요인분석 발생원인을 입력해주세요.'))
        return false
      } else if (!data3[0][i].IMP_YN) {
        Message.warn(t('단위작업3 유해요인분석 개선가능여부를 입력해주세요.'))
        return false
      } else if (data3[0][i].IMP_YN === 'A' && !data3[0][i].IMPLN_DSC) {
        Message.warn(t('단위작업3 개선가능여부가 개선가능일때는 개선계획은 필수값 입니다.'))
        return false
      } else if (data3[0][i].IMP_YN === 'B' && !data3[0][i].IMP_NO_RESN) {
        Message.warn(t('단위작업3 개선가능여부가 현행유지일때는 현행 유지 사유는 필수값 입니다.'))
        return false
      }
    }
  }

  return true
}

const saveDataTab03 = () => {
  let data1 = tab01.value.saveTab03_Tab01()
  let data2 = tab02.value.saveTab03_Tab01()
  let data3 = tab03.value.saveTab03_Tab01()
  let saveParam1 = [] //유해요인평가 및 개선계획 유지 저장 데이터
  let saveParam2 = [] //단위작업등록 작업부하,총점수 저장 데이터
  saveParam2.push(data1[1])
  saveParam2.push(data2[1])
  saveParam2.push(data3[1])
  //단위작업1
  for (let i = 0; i < data1[0].length; i++) {
    let saveData = {
      ES_SEQ: data1[1].ES_SEQ, //순번
      WORK_STANDARD_ID: data1[1].WORK_STANDARD_ID, //작업표준 ID
      UNIT_SEQ: data1[1].UNIT_SEQ, //단위작업SEQ
      IMP_SEQ: data1[0][i].IMP_SEQ, //원인분석 SEQ
      ES_DATE: data1[1].ES_DATE, //조사일자
      HRMF_FCTR: data1[0][i].HRMF_FCTR, //유해요인코드
      OCCR_CUSE: data1[0][i].OCCR_CUSE, //발생원인
      IMP_YN: data1[0][i].IMP_YN, //개선가부
      IMP_NO_RESN: data1[0][i].IMP_NO_RESN, //현행유지사유
      IMPLN_DSC: data1[0][i].IMPLN_DSC, //개선계획
      UNIT_GUBUN: 1,
      USER_ID: userStore.userId, //유저아이디
    }
    saveParam1.push(saveData)
  }
  //단위작업2
  for (let i = 0; i < data2[0].length; i++) {
    let saveData = {
      ES_SEQ: data2[1].ES_SEQ, //순번
      WORK_STANDARD_ID: data2[1].WORK_STANDARD_ID, //작업표준 ID
      UNIT_SEQ: data2[1].UNIT_SEQ, //단위작업SEQ
      IMP_SEQ: data2[0][i].IMP_SEQ, //원인분석 SEQ
      ES_DATE: data2[1].ES_DATE, //조사일자
      HRMF_FCTR: data2[0][i].HRMF_FCTR, //유해요인코드
      OCCR_CUSE: data2[0][i].OCCR_CUSE, //발생원인
      IMP_YN: data2[0][i].IMP_YN, //개선가부
      IMP_NO_RESN: data2[0][i].IMP_NO_RESN, //현행유지사유
      IMPLN_DSC: data2[0][i].IMPLN_DSC, //개선계획
      UNIT_GUBUN: 2,
      USER_ID: userStore.userId, //유저아이디
    }
    saveParam1.push(saveData)
  }
  //단위작업3
  for (let i = 0; i < data3[0].length; i++) {
    let saveData = {
      ES_SEQ: data3[1].ES_SEQ, //순번
      WORK_STANDARD_ID: data3[1].WORK_STANDARD_ID, //작업표준 ID
      UNIT_SEQ: data3[1].UNIT_SEQ, //단위작업SEQ
      IMP_SEQ: data3[0][i].IMP_SEQ, //원인분석 SEQ
      ES_DATE: data3[1].ES_DATE, //조사일자
      HRMF_FCTR: data3[0][i].HRMF_FCTR, //유해요인코드
      OCCR_CUSE: data3[0][i].OCCR_CUSE, //발생원인
      IMP_YN: data3[0][i].IMP_YN, //개선가부
      IMP_NO_RESN: data3[0][i].IMP_NO_RESN, //현행유지사유
      IMPLN_DSC: data3[0][i].IMPLN_DSC, //개선계획
      UNIT_GUBUN: 3,
      USER_ID: userStore.userId, //유저아이디
    }
    saveParam1.push(saveData)
  }

  //개선계획 저장
  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_03',
    list: saveParam1,
  }).then(() => {
    //단위작업 작업부하,빈도저장
    return commonExecuteApi({
      queryId: 'HLTIB0010_SAVE_04',
      list: saveParam2,
    })
  })
}

const afterSaveDataTab03 = async () => {
  let data1 = await tab01.value.saveTab03_Tab01() //변경사항 추적하기위해 저장후에 덮어씌움
  let data2 = await tab02.value.saveTab03_Tab01()
  let data3 = await tab03.value.saveTab03_Tab01()
  Message.success(t('저장되었습니다.'))
  //저장하고 재조회함 (삭제후 재조회하는 로직이랑 똑같아서 afterDelete씀)
  tab01.value.setUpdatedFlag(data1[0])
  tab02.value.setUpdatedFlag(data2[0])
  tab03.value.setUpdatedFlag(data3[0])

  tab01.value.afterDelete()
  tab02.value.afterDelete()
  tab03.value.afterDelete()

  isAlreadySaved.value = true
  emit('saved')
}
//저장관련 로직 끝

onMounted(() => {
  if (props.tab01Data.IMP_RESIST_YN === 'Y') {
    menuTitle.value.visibleBtn('btnTemporaryStorage', false)
  }
})

defineExpose({
  saveTab03,
})
</script>

<template>
  <v-sheet
    color="primarySub"
    height="50"
    class="px-4 d-flex align-center rounded-t-5 cursor-move"
    @mousedown="startDragging"
  >
    <span>유해요인조사등록 3/4</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <IGridTitle
      :button-list="['btnPrevStep', 'btnTemporaryStorage', 'btnNextStep', 'btnClose']"
      @click-button="onButtonsClick"
      class="mt-2 mr-2"
      ref="menuTitle"
      :use-permission="false"
    ></IGridTitle>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="gridTitle">단위작업별 평가</div>
        </v-sheet>
        <v-tabs v-model="tab">
          <v-tab value="work_1">단위작업1 {{ props.tab01Data.UNIT_NM_1 }} </v-tab>
          <v-tab value="work_2">단위작업2 {{ props.tab01Data.UNIT_NM_2 }} </v-tab>
          <v-tab value="work_3">단위작업3 {{ props.tab01Data.UNIT_NM_3 }} </v-tab>
        </v-tabs>
        <v-window v-model="tab">
          <v-window-item eager value="work_1">
            <HLTIB0010Tab03_Tab01 ref="tab01" :tab01-data="props.tab01Data" tab-number="1"></HLTIB0010Tab03_Tab01>
          </v-window-item>
          <v-window-item eager value="work_2">
            <HLTIB0010Tab03_Tab01 ref="tab02" :tab01-data="props.tab01Data" tab-number="2"></HLTIB0010Tab03_Tab01>
          </v-window-item>
          <v-window-item eager value="work_3">
            <HLTIB0010Tab03_Tab01 ref="tab03" :tab01-data="props.tab01Data" tab-number="3"></HLTIB0010Tab03_Tab01>
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
