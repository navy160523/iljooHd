<script setup>
import { ref, reactive } from 'vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import HLTIB0010Popup02_Tab01 from './HLTIB0010Popup02_Tab01.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { useUserStore } from '@hiway/stores/user'
const dialog = ref(null)
const menuTitle = ref(null)
const tab = ref('work_1')
const unitWorkData1 = reactive({}) //단위작업1
const unitWorkData2 = reactive({}) //단위작업2
const unitWorkData3 = reactive({}) //단위작업3
const unitWork1CheckData = reactive({}) //단위작업1 체크박스 비활성화 플래그값
const unitWork2CheckData = reactive({}) //단위작업2 체크박스 비활성화 플래그값
const unitWork3CheckData = reactive({}) //단위작업3 체크박스 비활성화 플래그값
const saveUnitWork1Data = reactive({}) //단위작업1 저장데이터
const saveUnitWork2Data = reactive({}) //단위작업2 저장데이터
const saveUnitWork3Data = reactive({}) //단위작업3 저장데이터
let rowData = reactive({})
const unitWork1 = ref(null)
const unitWork2 = ref(null)
const unitWork3 = ref(null)
const unitWork1Nm = ref(null)
const unitWork2Nm = ref(null)
const unitWork3Nm = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['closed'])
//각 단위작업별로 분리해서 개선가능여부,현행유지사유에 따른 탭 비활성화 및 데이터 세팅
//단위작업 1
let unitWork1Array = []
//단위작업 2
let unitWork2Array = []
//단위작업 3
let unitWork3Array = []
//개선가능 여부에 따른 탭 비활성화 플래그값
const disableTabValue = reactive({
  TAB01: false,
  TAB02: false,
  TAB03: false,
})

const improvementResultRegistrationField = reactive({
  ES_DEPT_NM: '', //소속 부서
  WORK_STANDARD_NM: '', //작업표준명
  WORK_STANDARD_NO: '', //작업표준번호
  ES_DATE: '', //조사일자
  ES_DIV: '', //조사구분
  ES_EMP_NM: '', //조사자 성명
  ES_SEQ: '', //순번
  WORK_STANDARD_ID: '', //작업표준 ID
})

const codeList = reactive({
  ES_DIV: [], //조사구분
})

const setDataField = async (rowData) => {
  for (const [key, value] of Object.entries(rowData)) {
    if (improvementResultRegistrationField.hasOwnProperty(key)) {
      improvementResultRegistrationField[key] = value
    }
  }
  try {
    let param = {
      WORK_STANDARD_ID: improvementResultRegistrationField.WORK_STANDARD_ID,
      ES_SEQ: improvementResultRegistrationField.ES_SEQ,
    }
    //단위작업 데이터 조회
    let res = await commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_08',
      param: param,
    })

    if (res) {
      res.ORESULT_CUR.forEach((x) => {
        if (x.UNIT_GUBUN === 1) {
          unitWork1Array.push(x)
        }
      })

      res.ORESULT_CUR.forEach((x) => {
        if (x.UNIT_GUBUN === 2) {
          unitWork2Array.push(x)
        }
      })

      res.ORESULT_CUR.forEach((x) => {
        if (x.UNIT_GUBUN === 3) {
          unitWork3Array.push(x)
        }
      })

      if (unitWork1Array.length > 0) {
        unitWork1Nm.value = unitWork1Array[0].UNIT_NM //단위작업1탭 이름
      }
      if (unitWork2Array.length > 0) {
        unitWork2Nm.value = unitWork2Array[0].UNIT_NM //단위작업2탭 이름
      }

      if (unitWork3Array.length > 0) {
        unitWork3Nm.value = unitWork3Array[0].UNIT_NM //단위작업3탭 이름
      }

      //등록된 개선가능 여부에 개선가능이 하나라도 등록 되어 있으면 탭 활성화 개선가능이 없고 모두 현행유지 사유로 등록되어 있으면 탭 비활성화
      let disableUnitWorkTab01Flag = unitWork1Array.some((x) => x.IMP_YN === 'A')
      let disableUnitWorkTab02Flag = unitWork2Array.some((x) => x.IMP_YN === 'A')
      let disableUnitWorkTab03Flag = unitWork3Array.some((x) => x.IMP_YN === 'A')
      if (disableUnitWorkTab01Flag === false) {
        disableTabValue.TAB01 = true
      } else {
        let obj = {
          IMP_ITM_MTHD: unitWork1Array.some((x) => x.IMP_ITM_MTHD === 'Y') ? 'Y' : 'N', //개선항목 작업방법 개선
          IMP_ITM_PLC: unitWork1Array.some((x) => x.IMP_ITM_PLC === 'Y') ? 'Y' : 'N', //개선항목 작업장 개선
          IMP_ITM_TOOL: unitWork1Array.some((x) => x.IMP_ITM_TOOL === 'Y') ? 'Y' : 'N', //개선항목 치공구 개선
          IMP_ITM_EQP: unitWork1Array.some((x) => x.IMP_ITM_EQP === 'Y') ? 'Y' : 'N', //개선항목 치공구 개선
          IMP_ITM_MGT: unitWork1Array.some((x) => x.IMP_ITM_MGT === 'Y') ? 'Y' : 'N', //개선항목 관리적개선
          UNIT_ID_1: unitWork1Array[0].UNIT_ID, //단위작업 ID
          UNIT_SEQ_1: unitWork1Array[0].UNIT_SEQ, //단위작업 SEQ
          UNIT_GUBUN_1: unitWork1Array[0].UNIT_GUBUN, //단위작업 구분
          FILE_ID_BFR: unitWork1Array[0].FILE_ID_BFR, //개선전 FILE_ID
          FILE_ID_AFT: unitWork1Array[0].FILE_ID_AFT, //개선후 FILE_ID
          IMP_DSC_BFR: unitWork1Array[0].IMP_DSC_BFR, //변경내용 개선전
          IMP_DSC_AFT: unitWork1Array[0].IMP_DSC_AFT, //변경내용 개선후
          IMP_EFFC: unitWork1Array[0].IMP_EFFC, //개선효과
          IMP_COST: unitWork1Array[0].IMP_COST, //투자비용
        }
        let disableObj = {
          IMP_ITM_MTHD: unitWork1Array.some((x) => x.IMPLN_DSC === 'A') ? true : false,
          IMP_ITM_PLC: unitWork1Array.some((x) => x.IMPLN_DSC === 'B') ? true : false,
          IMP_ITM_TOOL: unitWork1Array.some((x) => x.IMPLN_DSC === 'C') ? true : false,
          IMP_ITM_EQP: unitWork1Array.some((x) => x.IMPLN_DSC === 'D') ? true : false,
          IMP_ITM_MGT: unitWork1Array.some((x) => x.IMPLN_DSC === 'E') ? true : false,
        }
        await Object.assign(unitWorkData1, obj)
        await Object.assign(unitWork1CheckData, disableObj)
      }

      if (disableUnitWorkTab02Flag === false) {
        disableTabValue.TAB02 = true
      } else {
        let obj = {
          IMP_ITM_MTHD: unitWork2Array.some((x) => x.IMP_ITM_MTHD === 'Y') ? 'Y' : 'N', //개선항목 작업방법 개선
          IMP_ITM_PLC: unitWork2Array.some((x) => x.IMP_ITM_PLC === 'Y') ? 'Y' : 'N', //개선항목 작업장 개선
          IMP_ITM_TOOL: unitWork2Array.some((x) => x.IMP_ITM_TOOL === 'Y') ? 'Y' : 'N', //개선항목 치공구 개선
          IMP_ITM_EQP: unitWork2Array.some((x) => x.IMP_ITM_EQP === 'Y') ? 'Y' : 'N', //개선항목 치공구 개선
          IMP_ITM_MGT: unitWork2Array.some((x) => x.IMP_ITM_MGT === 'Y') ? 'Y' : 'N', //개선항목 관리적개선
          UNIT_ID_2: unitWork2Array[0].UNIT_ID, //단위작업 ID
          UNIT_SEQ_2: unitWork2Array[0].UNIT_SEQ, //단위작업 SEQ
          UNIT_GUBUN_2: unitWork2Array[0].UNIT_GUBUN, //단위작업 구분
          FILE_ID_BFR: unitWork2Array[0].FILE_ID_BFR, //개선전 FILE_ID
          FILE_ID_AFT: unitWork2Array[0].FILE_ID_AFT, //개선후 FILE_ID
          IMP_DSC_BFR: unitWork2Array[0].IMP_DSC_BFR, //변경내용 개선전
          IMP_DSC_AFT: unitWork2Array[0].IMP_DSC_AFT, //변경내용 개선후
          IMP_EFFC: unitWork2Array[0].IMP_EFFC, //개선효과
          IMP_COST: unitWork2Array[0].IMP_COST, //투자비용
        }

        let disableObj = {
          IMP_ITM_MTHD: unitWork2Array.some((x) => x.IMPLN_DSC === 'A') ? true : false,
          IMP_ITM_PLC: unitWork2Array.some((x) => x.IMPLN_DSC === 'B') ? true : false,
          IMP_ITM_TOOL: unitWork2Array.some((x) => x.IMPLN_DSC === 'C') ? true : false,
          IMP_ITM_EQP: unitWork2Array.some((x) => x.IMPLN_DSC === 'D') ? true : false,
          IMP_ITM_MGT: unitWork2Array.some((x) => x.IMPLN_DSC === 'E') ? true : false,
        }
        await Object.assign(unitWorkData2, obj)
        await Object.assign(unitWork2CheckData, disableObj)
      }
      if (disableUnitWorkTab03Flag === false) {
        disableTabValue.TAB03 = true
      } else {
        let obj = {
          IMP_ITM_MTHD: unitWork3Array.some((x) => x.IMP_ITM_MTHD === 'Y') ? 'Y' : 'N', //개선항목 작업방법 개선
          IMP_ITM_PLC: unitWork3Array.some((x) => x.IMP_ITM_PLC === 'Y') ? 'Y' : 'N', //개선항목 작업장 개선
          IMP_ITM_TOOL: unitWork3Array.some((x) => x.IMP_ITM_TOOL === 'Y') ? 'Y' : 'N', //개선항목 치공구 개선
          IMP_ITM_EQP: unitWork3Array.some((x) => x.IMP_ITM_EQP === 'Y') ? 'Y' : 'N', //개선항목 치공구 개선
          IMP_ITM_MGT: unitWork3Array.some((x) => x.IMP_ITM_MGT === 'Y') ? 'Y' : 'N', //개선항목 관리적개선
          UNIT_ID_3: unitWork3Array[0].UNIT_ID, //단위작업 ID
          UNIT_SEQ_3: unitWork3Array[0].UNIT_SEQ, //단위작업 SEQ
          UNIT_GUBUN_3: unitWork3Array[0].UNIT_GUBUN, //단위작업 구분
          FILE_ID_BFR: unitWork3Array[0].FILE_ID_BFR, //개선전 FILE_ID
          FILE_ID_AFT: unitWork3Array[0].FILE_ID_AFT, //개선후 FILE_ID
          IMP_DSC_BFR: unitWork3Array[0].IMP_DSC_BFR, //변경내용 개선전
          IMP_DSC_AFT: unitWork3Array[0].IMP_DSC_AFT, //변경내용 개선후
          IMP_EFFC: unitWork3Array[0].IMP_EFFC, //개선효과
          IMP_COST: unitWork3Array[0].IMP_COST, //투자비용
        }

        let disableObj = {
          IMP_ITM_MTHD: unitWork3Array.some((x) => x.IMPLN_DSC === 'A') ? true : false,
          IMP_ITM_PLC: unitWork3Array.some((x) => x.IMPLN_DSC === 'B') ? true : false,
          IMP_ITM_TOOL: unitWork3Array.some((x) => x.IMPLN_DSC === 'C') ? true : false,
          IMP_ITM_EQP: unitWork3Array.some((x) => x.IMPLN_DSC === 'D') ? true : false,
          IMP_ITM_MGT: unitWork3Array.some((x) => x.IMPLN_DSC === 'E') ? true : false,
        }
        await Object.assign(unitWorkData3, obj)
        await Object.assign(unitWork3CheckData, disableObj)
      }
    }
  } catch (error) {
    Message.warn(t(error))
  }

  //이전조사일 팝업에서 호출시 임시저장,등록버튼 비활성화
  if (rowData.BEFORE_DATA) {
    menuTitle.value.disableBtn('btnTemporaryStorage', true)
    menuTitle.value.disableBtn('btnRegist', true)
    unitWork1.value.disableImageButton()
    unitWork2.value.disableImageButton()
    unitWork3.value.disableImageButton()
  }
  //결재상신,결제완료시 이미지 버튼 비활성화
  if (rowData.ES_STUS_COD === '5' || rowData.ES_STUS_COD === '7') {
    unitWork1.value.disableImageButton()
    unitWork2.value.disableImageButton()
    unitWork3.value.disableImageButton()
  }
  //개선등록시 임시저장,등록 비활성화
  if (rowData.IMP_RESIST_YN === 'Y') {
    menuTitle.value.disableBtn('btnTemporaryStorage', true)
    menuTitle.value.disableBtn('btnRegist', true)
    unitWork1.value.disableImageButton()
    unitWork2.value.disableImageButton()
    unitWork3.value.disableImageButton()
  }
  await unitWork1.value.setField()
  await unitWork2.value.setField()
  await unitWork3.value.setField()

  if(!disableTabValue.TAB01) {
    tab.value = 'work_1'
  } else if(!disableTabValue.TAB02) {
    tab.value = 'work_2'
  } else if(!disableTabValue.TAB03) {
    tab.value = 'work_3'
  }
}

const openPopup = (data) => {
  dialog.value = true
  Object.assign(rowData, data)
  nextTick(async () => {
    await setDataField(rowData)
    //일반사용자일때
    if (data.nomalUser) {
      menuTitle.value.visibleBtn('btnRegist', false) //등록버튼 안보이기
      menuTitle.value.visibleBtn('btnRegistCancel', false) //등록취소 버튼 안보이기
    } else {
      //일반사용자가 아닐때
      //개선등록 완료시 등록취소 버튼 보이기
      if (data.IMP_RESIST_YN === 'Y') {
        menuTitle.value.visibleBtn('btnRegistCancel', true)
      } else {
        //개선등록 완료가 되지 않으면 등록취소 버튼 보이지 않기
        menuTitle.value.visibleBtn('btnRegistCancel', false)
      }
    }
  })
}

const closePopup = () => {
  dialog.value = false
  tab.value = 'work_1'
  menuTitle.value.disableBtn('btnTemporaryStorage', false)
  menuTitle.value.disableBtn('btnRegist', false)
  for (let i in unitWorkData1) {
    unitWorkData1[i] = ''
  }
  for (let i in unitWorkData2) {
    unitWorkData2[i] = ''
  }
  for (let i in unitWorkData3) {
    unitWorkData3[i] = ''
  }
  unitWork1Array = []
  unitWork2Array = []
  unitWork3Array = []

  emit('closed')
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnTemporaryStorage') {
    new saveFlowHelper(vm, t).setBefore(beforeSave01).setQuery(saveData01).setAfter(afterSave01).run()
  } else if (btn.id === 'btnRegist') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setConfirmMessage('등록하시겠습니까?')
      .setAfter(afterSave02)
      .run()
  } else if (btn.id === 'btnRegistCancel') {
    new saveFlowHelper(vm, t)
      .setQuery(saveData03)
      .setAfter(afterSave03)
      .setConfirmMessage('등록취소 하시겠습니까?')
      .setResultMessage('등록취소 되었습니다.')
      .run()
  }
}

//등록취소 관련 로직 시작
const saveData03 = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    WORK_STANDARD_ID: rowData.WORK_STANDARD_ID,
    ES_SEQ: rowData.ES_SEQ,
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_17',
    list: saveParam,
  })
}

const afterSave03 = () => {
  menuTitle.value.disableBtn('btnTemporaryStorage', false) //임시저장 버튼 활성화
  menuTitle.value.disableBtn('btnRegist', false) //등록버튼 활성화
  menuTitle.value.visibleBtn('btnRegistCancel', false) //등록취소버튼 안보이기
  unitWork1.value.enableImageButton()
  unitWork2.value.enableImageButton()
  unitWork3.value.enableImageButton()
}
//등록취소 관련 로직 끝

//저장관련 로직 시작
const beforeSave01 = () => {
  //2025.06.05 임은희책임 요청으로 임시저장일때는 필수값체크 하지 않도록 변경
  //단위작업1 탭이 활성화 되었을때만 (개선가능이 1개라도 저장되었을때)
  // if (disableTabValue.TAB01 === false) {
  Object.assign(saveUnitWork1Data, unitWork1.value.getUnitWorkField())
  //   //단위작업1 개선결과등록 필수값 체크
  //   if (
  //     (!saveUnitWork1Data.IMP_ITM_MTHD || saveUnitWork1Data.IMP_ITM_MTHD === 'N') &&
  //     (!saveUnitWork1Data.IMP_ITM_PLC || saveUnitWork1Data.IMP_ITM_PLC === 'N') &&
  //     (!saveUnitWork1Data.IMP_ITM_TOOL || saveUnitWork1Data.IMP_ITM_TOOL === 'N') &&
  //     (!saveUnitWork1Data.IMP_ITM_EQP || saveUnitWork1Data.IMP_ITM_EQP === 'N') &&
  //     (!saveUnitWork1Data.IMP_ITM_MGT || saveUnitWork1Data.IMP_ITM_MGT === 'N')
  //   ) {
  //     Message.warn(t('단위작업 1 단위개선항목은 필수 입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork1Data.FILE_ID_BFR) {
  //     Message.warn(t('단위작업 1 개선前 사진은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork1Data.FILE_ID_BFR) {
  //     Message.warn(t('단위작업 1 개선後 사진은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork1Data.IMP_DSC_BFR) {
  //     Message.warn(t('단위작업 1 개선前 변경 내용은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork1Data.IMP_DSC_AFT) {
  //     Message.warn(t('단위작업 1 개선後 변경 내용은 필수입력입니다'))
  //     return false
  //   } else if (!saveUnitWork1Data.IMP_EFFC) {
  //     Message.warn(t('단위작업 1 개선효과는 필수입력입니다.'))
  //     return false
  //   }
  // }
  // if (disableTabValue.TAB02 === false) {
  Object.assign(saveUnitWork2Data, unitWork2.value.getUnitWorkField())
  //   //단위작업2 개선결과등록 필수값 체크
  //   if (
  //     (!saveUnitWork2Data.IMP_ITM_MTHD || saveUnitWork2Data.IMP_ITM_MTHD === 'N') &&
  //     (!saveUnitWork2Data.IMP_ITM_PLC || saveUnitWork2Data.IMP_ITM_PLC === 'N') &&
  //     (!saveUnitWork2Data.IMP_ITM_TOOL || saveUnitWork2Data.IMP_ITM_TOOL === 'N') &&
  //     (!saveUnitWork2Data.IMP_ITM_EQP || saveUnitWork2Data.IMP_ITM_EQP === 'N') &&
  //     (!saveUnitWork2Data.IMP_ITM_MGT || saveUnitWork2Data.IMP_ITM_MGT === 'N')
  //   ) {
  //     Message.warn(t('단위작업 2 단위개선항목은 필수 입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork2Data.FILE_ID_BFR) {
  //     Message.warn(t('단위작업 2 개선前 사진은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork2Data.FILE_ID_BFR) {
  //     Message.warn(t('단위작업 2 개선後 사진은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork2Data.IMP_DSC_BFR) {
  //     Message.warn(t('단위작업 2 개선前 변경 내용은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork2Data.IMP_DSC_AFT) {
  //     Message.warn(t('단위작업 2 개선後 변경 내용은 필수입력입니다'))
  //     return false
  //   } else if (!saveUnitWork2Data.IMP_EFFC) {
  //     Message.warn(t('단위작업 2 개선효과는 필수입력입니다.'))
  //     return false
  //   }
  // }
  // if (disableTabValue.TAB03 === false) {
  Object.assign(saveUnitWork3Data, unitWork3.value.getUnitWorkField())
  //   //단위작업3 개선결과등록 필수값 체크
  //   if (
  //     (!saveUnitWork3Data.IMP_ITM_MTHD || saveUnitWork3Data.IMP_ITM_MTHD === 'N') &&
  //     (!saveUnitWork3Data.IMP_ITM_PLC || saveUnitWork3Data.IMP_ITM_PLC === 'N') &&
  //     (!saveUnitWork3Data.IMP_ITM_TOOL || saveUnitWork3Data.IMP_ITM_TOOL === 'N') &&
  //     (!saveUnitWork3Data.IMP_ITM_EQP || saveUnitWork3Data.IMP_ITM_EQP === 'N') &&
  //     (!saveUnitWork3Data.IMP_ITM_MGT || saveUnitWork3Data.IMP_ITM_MGT === 'N')
  //   ) {
  //     Message.warn(t('단위작업 3 단위개선항목은 필수 입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork3Data.FILE_ID_BFR) {
  //     Message.warn(t('단위작업 3 개선前 사진은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork3Data.FILE_ID_BFR) {
  //     Message.warn(t('단위작업 3 개선後 사진은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork3Data.IMP_DSC_BFR) {
  //     Message.warn(t('단위작업 3 개선前 변경 내용은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork3Data.IMP_DSC_AFT) {
  //     Message.warn(t('단위작업 3 개선後 변경 내용은 필수입력입니다.'))
  //     return false
  //   } else if (!saveUnitWork3Data.IMP_EFFC) {
  //     Message.warn(t('단위작업 3 개선효과는 필수입력입니다.'))
  //     return false
  //   }
  // }
  return true
}

const saveData01 = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    ES_SEQ: improvementResultRegistrationField.ES_SEQ, //순번
    WORK_STANDARD_ID: improvementResultRegistrationField.WORK_STANDARD_ID, //작업표준ID
    UNIT_ID_1: unitWork1Array[0].UNIT_ID, //단위작업1 ID
    UNIT_ID_2: unitWork2Array[0].UNIT_ID, //단위작업2 ID
    UNIT_ID_3: unitWork3Array[0].UNIT_ID, //단위작업3 ID
    UNIT_SEQ_1: unitWork1Array[0].UNIT_SEQ, //단위작업1 SEQ
    UNIT_SEQ_2: unitWork2Array[0].UNIT_SEQ, //단위작업2 SEQ
    UNIT_SEQ_3: unitWork3Array[0].UNIT_SEQ, //단위작업3 SEQ
    UNIT_GUBUN_1: unitWork1Array[0].UNIT_GUBUN, //단위작업1 구분
    UNIT_GUBUN_2: unitWork2Array[0].UNIT_GUBUN, //단위작업2 구분
    UNIT_GUBUN_3: unitWork3Array[0].UNIT_GUBUN, //단위작업3 구분
    IMP_ITM_MTHD_1: saveUnitWork1Data.IMP_ITM_MTHD, //단위작업1 작업방법개선
    IMP_ITM_PLC_1: saveUnitWork1Data.IMP_ITM_PLC, //단위작업1 작업장개선
    IMP_ITM_TOOL_1: saveUnitWork1Data.IMP_ITM_TOOL, //단위작업1 치공구개선
    IMP_ITM_EQP_1: saveUnitWork1Data.IMP_ITM_EQP, //단위작업1 장비개선
    IMP_ITM_MGT_1: saveUnitWork1Data.IMP_ITM_MGT, //단위작업1 관리적개선
    IMP_ITM_MTHD_2: saveUnitWork2Data.IMP_ITM_MTHD, //단위작업2 작업방법개선
    IMP_ITM_PLC_2: saveUnitWork2Data.IMP_ITM_PLC, //단위작업2 작업장개선
    IMP_ITM_TOOL_2: saveUnitWork2Data.IMP_ITM_TOOL, //단위작업2 치공구개선
    IMP_ITM_EQP_2: saveUnitWork2Data.IMP_ITM_EQP, //단위작업2 장비개선
    IMP_ITM_MGT_2: saveUnitWork2Data.IMP_ITM_MGT, //단위작업2 관리적개선
    IMP_ITM_MTHD_3: saveUnitWork3Data.IMP_ITM_MTHD, //단위작업3 작업방법개선
    IMP_ITM_PLC_3: saveUnitWork3Data.IMP_ITM_PLC, //단위작업3 작업장개선
    IMP_ITM_TOOL_3: saveUnitWork3Data.IMP_ITM_TOOL, //단위작업3 치공구개선
    IMP_ITM_EQP_3: saveUnitWork3Data.IMP_ITM_EQP, //단위작업3 장비개선
    IMP_ITM_MGT_3: saveUnitWork3Data.IMP_ITM_MGT, //단위작업3 관리적개선
    FILE_ID_BFR_1: saveUnitWork1Data.FILE_ID_BFR, //단위작업1 개선전 사진
    FILE_ID_AFT_1: saveUnitWork1Data.FILE_ID_AFT, //단위작업1 개선후 사진
    FILE_ID_BFR_2: saveUnitWork2Data.FILE_ID_BFR, //단위작업2 개선전 사진
    FILE_ID_AFT_2: saveUnitWork2Data.FILE_ID_AFT, //단위작업2 개선후 사진
    FILE_ID_BFR_3: saveUnitWork3Data.FILE_ID_BFR, //단위작업3 개선전 사진
    FILE_ID_AFT_3: saveUnitWork3Data.FILE_ID_AFT, //단위작업3 개선후 사진
    IMP_DSC_BFR_1: saveUnitWork1Data.IMP_DSC_BFR, //단위작업1 개선전 변경내용
    IMP_DSC_AFT_1: saveUnitWork1Data.IMP_DSC_AFT, //단위작업1 개선후 변경내용
    IMP_DSC_BFR_2: saveUnitWork2Data.IMP_DSC_BFR, //단위작업2 개선전 변경내용
    IMP_DSC_AFT_2: saveUnitWork2Data.IMP_DSC_AFT, //단위작업2 개선후 변경내용
    IMP_DSC_BFR_3: saveUnitWork3Data.IMP_DSC_BFR, //단위작업3 개선전 변경내용
    IMP_DSC_AFT_3: saveUnitWork3Data.IMP_DSC_AFT, //단위작업3 개선후 변경내용
    IMP_EFFC_1: saveUnitWork1Data.IMP_EFFC, //단위작업1 개선효과
    IMP_COST_1: saveUnitWork1Data.IMP_COST, //단위작업1 투자비용
    IMP_EFFC_2: saveUnitWork2Data.IMP_EFFC, //단위작업2 개선효과
    IMP_COST_2: saveUnitWork2Data.IMP_COST, //단위작업2 투자비용
    IMP_EFFC_3: saveUnitWork3Data.IMP_EFFC, //단위작업3 개선효과
    IMP_COST_3: saveUnitWork3Data.IMP_COST, //단위작업3 투자비용
    USER_ID: userStore.userId,
  }

  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_06',
    list: saveParam,
  })
}

const afterSave01 = () => {
  closePopup()
}

//조회관련 로직 끝

//등록관련 로직 시작
const beforeSave02 = () => {
  if (disableTabValue.TAB01 === false) {
    Object.assign(saveUnitWork1Data, unitWork1.value.getUnitWorkField())
    //단위작업1 개선결과등록 필수값 체크
    if (
      (!saveUnitWork1Data.IMP_ITM_MTHD || saveUnitWork1Data.IMP_ITM_MTHD === 'N') &&
      (!saveUnitWork1Data.IMP_ITM_PLC || saveUnitWork1Data.IMP_ITM_PLC === 'N') &&
      (!saveUnitWork1Data.IMP_ITM_TOOL || saveUnitWork1Data.IMP_ITM_TOOL === 'N') &&
      (!saveUnitWork1Data.IMP_ITM_EQP || saveUnitWork1Data.IMP_ITM_EQP === 'N') &&
      (!saveUnitWork1Data.IMP_ITM_MGT || saveUnitWork1Data.IMP_ITM_MGT === 'N')
    ) {
      Message.warn(t('단위작업 1 단위개선항목은 필수 입력입니다.'))
      return false
    }
    // else if (!saveUnitWork1Data.FILE_ID_BFR) {
    //   Message.warn(t('단위작업 1 개선前 사진은 필수입력입니다.'))
    //   return false
    // } else if (!saveUnitWork1Data.FILE_ID_BFR) {
    //   Message.warn(t('단위작업 1 개선後 사진은 필수입력입니다.'))
    //   return false
    // }
    else if (!saveUnitWork1Data.IMP_DSC_BFR) {
      Message.warn(t('단위작업 1 개선前 변경 내용은 필수입력입니다.'))
      return false
    } else if (!saveUnitWork1Data.IMP_DSC_AFT) {
      Message.warn(t('단위작업 1 개선後 변경 내용은 필수입력입니다.'))
      return false
    } else if (!saveUnitWork1Data.IMP_EFFC) {
      Message.warn(t('단위작업 1 개선효과는 필수입력입니다.'))
      return false
    } else if (!saveUnitWork1Data.IMP_COST) {
      Message.warn(t('단위작업 1 투자비용은 필수입력입니다.'))
      return false
    }
  }
  if (disableTabValue.TAB02 === false) {
    Object.assign(saveUnitWork2Data, unitWork2.value.getUnitWorkField())
    //단위작업2 개선결과등록 필수값 체크
    if (
      (!saveUnitWork2Data.IMP_ITM_MTHD || saveUnitWork2Data.IMP_ITM_MTHD === 'N') &&
      (!saveUnitWork2Data.IMP_ITM_PLC || saveUnitWork2Data.IMP_ITM_PLC === 'N') &&
      (!saveUnitWork2Data.IMP_ITM_TOOL || saveUnitWork2Data.IMP_ITM_TOOL === 'N') &&
      (!saveUnitWork2Data.IMP_ITM_EQP || saveUnitWork2Data.IMP_ITM_EQP === 'N') &&
      (!saveUnitWork2Data.IMP_ITM_MGT || saveUnitWork2Data.IMP_ITM_MGT === 'N')
    ) {
      Message.warn(t('단위작업 2 단위개선항목은 필수 입력입니다.'))
      return false
    }
    // else if (!saveUnitWork2Data.FILE_ID_BFR) {
    //   Message.warn(t('단위작업 2 개선前 사진은 필수입력입니다.'))
    //   return false
    // }
    // else if (!saveUnitWork2Data.FILE_ID_BFR) {
    //   Message.warn(t('단위작업 2 개선後 사진은 필수입력입니다.'))
    //   return false
    // }
    else if (!saveUnitWork2Data.IMP_DSC_BFR) {
      Message.warn(t('단위작업 2 개선前 변경 내용은 필수입력입니다.'))
      return false
    } else if (!saveUnitWork2Data.IMP_DSC_AFT) {
      Message.warn(t('단위작업 2 개선後 변경 내용은 필수입력입니다'))
      return false
    } else if (!saveUnitWork2Data.IMP_EFFC) {
      Message.warn(t('단위작업 2 개선효과는 필수입력입니다.'))
      return false
    } else if (!saveUnitWork2Data.IMP_COST) {
      Message.warn(t('단위작업 2 투자비용은 필수입력입니다.'))
      return false
    }
  }
  if (disableTabValue.TAB03 === false) {
    Object.assign(saveUnitWork3Data, unitWork3.value.getUnitWorkField())
    //단위작업3 개선결과등록 필수값 체크
    if (
      (!saveUnitWork3Data.IMP_ITM_MTHD || saveUnitWork3Data.IMP_ITM_MTHD === 'N') &&
      (!saveUnitWork3Data.IMP_ITM_PLC || saveUnitWork3Data.IMP_ITM_PLC === 'N') &&
      (!saveUnitWork3Data.IMP_ITM_TOOL || saveUnitWork3Data.IMP_ITM_TOOL === 'N') &&
      (!saveUnitWork3Data.IMP_ITM_EQP || saveUnitWork3Data.IMP_ITM_EQP === 'N') &&
      (!saveUnitWork3Data.IMP_ITM_MGT || saveUnitWork3Data.IMP_ITM_MGT === 'N')
    ) {
      Message.warn(t('단위작업 3 단위개선항목은 필수 입력입니다.'))
      return false
    }
    // else if (!saveUnitWork3Data.FILE_ID_BFR) {
    //   Message.warn(t('단위작업 3 개선前 사진은 필수입력입니다.'))
    //   return false
    // }
    // else if (!saveUnitWork3Data.FILE_ID_BFR) {
    //   Message.warn(t('단위작업 3 개선後 사진은 필수입력입니다.'))
    //   return false
    // }
    else if (!saveUnitWork3Data.IMP_DSC_BFR) {
      Message.warn(t('단위작업 3 개선前 변경 내용은 필수입력입니다.'))
      return false
    } else if (!saveUnitWork3Data.IMP_DSC_AFT) {
      Message.warn(t('단위작업 3 개선後 변경 내용은 필수입력입니다.'))
      return false
    } else if (!saveUnitWork3Data.IMP_EFFC) {
      Message.warn(t('단위작업 3 개선효과는 필수입력입니다.'))
      return false
    } else if (!saveUnitWork3Data.IMP_COST) {
      Message.warn(t('단위작업 3 투자비용은 필수입력입니다.'))
      return false
    }
  }
  return true
}

const saveData02 = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    ES_SEQ: improvementResultRegistrationField.ES_SEQ, //순번
    WORK_STANDARD_ID: improvementResultRegistrationField.WORK_STANDARD_ID, //작업표준ID
    UNIT_ID_1: unitWork1Array[0].UNIT_ID, //단위작업1 ID
    UNIT_ID_2: unitWork2Array[0].UNIT_ID, //단위작업2 ID
    UNIT_ID_3: unitWork3Array[0].UNIT_ID, //단위작업3 ID
    UNIT_SEQ_1: unitWork1Array[0].UNIT_SEQ, //단위작업1 SEQ
    UNIT_SEQ_2: unitWork2Array[0].UNIT_SEQ, //단위작업2 SEQ
    UNIT_SEQ_3: unitWork3Array[0].UNIT_SEQ, //단위작업3 SEQ
    UNIT_GUBUN_1: unitWork1Array[0].UNIT_GUBUN, //단위작업1 구분
    UNIT_GUBUN_2: unitWork2Array[0].UNIT_GUBUN, //단위작업2 구분
    UNIT_GUBUN_3: unitWork3Array[0].UNIT_GUBUN, //단위작업3 구분
    IMP_ITM_MTHD_1: saveUnitWork1Data.IMP_ITM_MTHD, //단위작업1 작업방법개선
    IMP_ITM_PLC_1: saveUnitWork1Data.IMP_ITM_PLC, //단위작업1 작업장개선
    IMP_ITM_TOOL_1: saveUnitWork1Data.IMP_ITM_TOOL, //단위작업1 치공구개선
    IMP_ITM_EQP_1: saveUnitWork1Data.IMP_ITM_EQP, //단위작업1 장비개선
    IMP_ITM_MGT_1: saveUnitWork1Data.IMP_ITM_MGT, //단위작업1 관리적개선
    IMP_ITM_MTHD_2: saveUnitWork2Data.IMP_ITM_MTHD, //단위작업2 작업방법개선
    IMP_ITM_PLC_2: saveUnitWork2Data.IMP_ITM_PLC, //단위작업2 작업장개선
    IMP_ITM_TOOL_2: saveUnitWork2Data.IMP_ITM_TOOL, //단위작업2 치공구개선
    IMP_ITM_EQP_2: saveUnitWork2Data.IMP_ITM_EQP, //단위작업2 장비개선
    IMP_ITM_MGT_2: saveUnitWork2Data.IMP_ITM_MGT, //단위작업2 관리적개선
    IMP_ITM_MTHD_3: saveUnitWork3Data.IMP_ITM_MTHD, //단위작업3 작업방법개선
    IMP_ITM_PLC_3: saveUnitWork3Data.IMP_ITM_PLC, //단위작업3 작업장개선
    IMP_ITM_TOOL_3: saveUnitWork3Data.IMP_ITM_TOOL, //단위작업3 치공구개선
    IMP_ITM_EQP_3: saveUnitWork3Data.IMP_ITM_EQP, //단위작업3 장비개선
    IMP_ITM_MGT_3: saveUnitWork3Data.IMP_ITM_MGT, //단위작업3 관리적개선
    FILE_ID_BFR_1: saveUnitWork1Data.FILE_ID_BFR, //단위작업1 개선전 사진
    FILE_ID_AFT_1: saveUnitWork1Data.FILE_ID_AFT, //단위작업1 개선후 사진
    FILE_ID_BFR_2: saveUnitWork2Data.FILE_ID_BFR, //단위작업2 개선전 사진
    FILE_ID_AFT_2: saveUnitWork2Data.FILE_ID_AFT, //단위작업2 개선후 사진
    FILE_ID_BFR_3: saveUnitWork3Data.FILE_ID_BFR, //단위작업3 개선전 사진
    FILE_ID_AFT_3: saveUnitWork3Data.FILE_ID_AFT, //단위작업3 개선후 사진
    IMP_DSC_BFR_1: saveUnitWork1Data.IMP_DSC_BFR, //단위작업1 개선전 변경내용
    IMP_DSC_AFT_1: saveUnitWork1Data.IMP_DSC_AFT, //단위작업1 개선후 변경내용
    IMP_DSC_BFR_2: saveUnitWork2Data.IMP_DSC_BFR, //단위작업2 개선전 변경내용
    IMP_DSC_AFT_2: saveUnitWork2Data.IMP_DSC_AFT, //단위작업2 개선후 변경내용
    IMP_DSC_BFR_3: saveUnitWork3Data.IMP_DSC_BFR, //단위작업3 개선전 변경내용
    IMP_DSC_AFT_3: saveUnitWork3Data.IMP_DSC_AFT, //단위작업3 개선후 변경내용
    IMP_EFFC_1: saveUnitWork1Data.IMP_EFFC, //단위작업1 개선효과
    IMP_COST_1: saveUnitWork1Data.IMP_COST, //단위작업1 투자비용
    IMP_EFFC_2: saveUnitWork2Data.IMP_EFFC, //단위작업2 개선효과
    IMP_COST_2: saveUnitWork2Data.IMP_COST, //단위작업2 투자비용
    IMP_EFFC_3: saveUnitWork3Data.IMP_EFFC, //단위작업3 개선효과
    IMP_COST_3: saveUnitWork3Data.IMP_COST, //단위작업3 투자비용
    ES_STUS: '2', //진행상태(결재대기로 변경)
  }
  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_07',
    list: saveParam,
  })
}

const afterSave02 = () => {
  closePopup()
}

//등록관련 로직 끝

const initCodeList = () => {
  Promise.all([getCodeList('HHII620')]).then((res) => {
    codeList.ES_DIV = res[0].ORESULT_CUR
  })
}

onMounted(() => {
  initCodeList()
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    width="1000"
    height="1200"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    persistent
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>개선 결과 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnTemporaryStorage',
            'btnRegist',
            'btnRegistCancel',
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        ></IGridTitle>
        <v-card-text class="pa-2 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea">
              <span class="gridTitle">조사개요</span>
              <div class="d-flex mt-2 justify-space-between">
                <i-input
                  :label="$t('소속 부서')"
                  width="260px"
                  v-model="improvementResultRegistrationField.ES_DEPT_NM"
                  readonly
                ></i-input>
                <i-input
                  :label="$t('작업표준명')"
                  width="260px"
                  v-model="improvementResultRegistrationField.WORK_STANDARD_NM"
                  readonly
                ></i-input>
                <i-input
                  :label="$t('작업표준번호')"
                  width="250px"
                  v-model="improvementResultRegistrationField.WORK_STANDARD_NO"
                  readonly
                ></i-input>
              </div>
              <div class="d-flex mt-2 justify-space-between">
                <i-input
                  :label="$t('조사 일자')"
                  width="200px"
                  v-model="improvementResultRegistrationField.ES_DATE"
                  readonly
                ></i-input>
                <i-select
                  :label="$t('조사 구분')"
                  width="200px"
                  :items="codeList.ES_DIV"
                  item-title="TXT"
                  item-value="COD"
                  v-model="improvementResultRegistrationField.ES_DIV"
                  readonly
                ></i-select>
                <i-input
                  :label="$t('조사자')"
                  width="200px"
                  v-model="improvementResultRegistrationField.ES_EMP_NM"
                  readonly
                ></i-input>
              </div>
            </v-sheet>
            <span class="gridTitle mt-2">단위작업별 개선</span>
            <v-sheet class="mt-3">
              <v-tabs v-model="tab">
                <v-tab value="work_1" :disabled="disableTabValue.TAB01">단위작업1{{ unitWork1Nm }}</v-tab>
                <v-tab value="work_2" :disabled="disableTabValue.TAB02">단위작업2{{ unitWork2Nm }}</v-tab>
                <v-tab value="work_3" :disabled="disableTabValue.TAB03">단위작업3{{ unitWork3Nm }}</v-tab>
              </v-tabs>
              <v-window v-model="tab">
                <v-window-item eager value="work_1">
                  <HLTIB0010Popup02_Tab01
                    ref="unitWork1"
                    :unit-work-data="unitWorkData1"
                    :disable-value="unitWork1CheckData"
                  ></HLTIB0010Popup02_Tab01
                ></v-window-item>
                <v-window-item eager value="work_2"
                  ><HLTIB0010Popup02_Tab01
                    ref="unitWork2"
                    :unit-work-data="unitWorkData2"
                    :disable-value="unitWork2CheckData"
                  ></HLTIB0010Popup02_Tab01>
                </v-window-item>
                <v-window-item eager value="work_3">
                  <HLTIB0010Popup02_Tab01
                    ref="unitWork3"
                    :unit-work-data="unitWorkData3"
                    :disable-value="unitWork3CheckData"
                  ></HLTIB0010Popup02_Tab01
                ></v-window-item>
              </v-window>
            </v-sheet>
          </div>
        </v-card-text>
      </v-card-title>
    </v-card>
  </v-dialog>
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
