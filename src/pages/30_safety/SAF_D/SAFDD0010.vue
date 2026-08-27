<!--
화면명 : 안전수칙위반 승인
화면개요 : 안전수칙위반 수정(구분, 내용), 반려, 승인(승인, 메일발송), 승인취소
-->
<script setup>
import { commonSearchApi, commonExecuteApi, getCodeList, commonSendApi, nullToEmpty } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import SAFDD0010Popup from '@/pages/30_safety/SAF_D/SAFDD0010Popup.vue'
import SafeRuleGbnPopup from '@/components/popup/SafeRuleGbnPopup.vue'

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const logsStore = useLogsStore()
const menuTitle = ref(null)
const gridTitle = ref(null)
const grdMain = ref(null)
const grdMain2 = ref(null)
const t = useI18n().t
const iUploadPopup = ref(null)
const exPanVal = ref(0)
const exPanVal2 = ref(0)
const selectGbn = ref(null)
const isDev = process.env.NODE_ENV !== 'prod'
const isMounted = ref(false)
const tab = ref('0')
const showAsgn = ref(true)
const refSAFDD0010Popup = ref(null)

// console.log('isDev', isDev)

defineOptions({
  name: '30_safety-SAF_D-SAFDD0010',
})

const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['CMPNY_DIV', 'VIO_NO', 'COMPANY'],
  fields : [
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('진행상태') }, editable: false, lookupDisplay: true },
    { fieldName: 'VIO_TIME_DS', dataType: 'text', header: { text: t('위반일시') }, width: 150, editable: false },
    { fieldName: 'IO_DIV_NM', dataType: 'text', header: { text: t('소속구분') }, editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('위반조직') }, width: 250, styleName: 'left-column', editable: false },
    { fieldName: 'VEND_NAME', dataType: 'text', header: { text: t('협력사') }, width: 175, styleName: 'left-column', editable: false },
    { fieldName: 'VIOLATOR', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'VIO_GDIV_NM', dataType: 'text', header: { text: t('구분(대)') }, editable: false },
    { fieldName: 'VIO_MDIV_NM', dataType: 'text', header: { text: t('구분(소)') }, editable: false },
    { fieldName: 'VIO_SPLC_NM', dataType: 'text', header: { text: t('장소') }, editable: false },
    { fieldName: 'VIO_DESC', dataType: 'text', header: { text: t('내용') }, width: 300, styleName: 'left-column', editable: false },
    { fieldName: 'DANSOK_EMP_NM', dataType: 'text', header: { text: t('단속자') }, editable: false },
    { fieldName: 'FILE_ID1', dataType: 'text', header: { text: t('위반첨부') }, editable: false, visible: false },
    { fieldName: 'FILE_ATTACH1', dataType: 'text', header: { text: t('위반첨부') }, isFile: { value: true }, editable: false },
    { fieldName: 'FILE_ID2', dataType: 'text', header: { text: t('조치첨부') }, editable: false, visible: false },
    { fieldName: 'FILE_ATTACH2', dataType: 'text', header: { text: t('조치첨부') }, isFile: { value: true }, editable: false },
    { fieldName: 'SHIP_NO', dataType: 'text', header: { text: t('호선No.') }, styleName: 'left-column', editable: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_NO', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'TEAM_NM', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_EMP_NO', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'IO_DIV', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_GDIV', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_MDIV', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_LPLC', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_MPLC', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_SPLC', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_PLC_DESC', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'DANSOK_ASGN_CD', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'DANSOK_ASGN_NM', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'DANSOK_EMP_NO', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_TIME', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_DT1', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_TIME2', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'APP_EMP_NO', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'APP_EMP_NM', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VEND_CD', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'COMPANY', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_EMP_ASGN', dataType: 'text', header: { text: t('') }, visible: false },
    { fieldName: 'VIO_MDIV_TYPE', dataType: 'text', header: { text: t('') }, visible: false },
  ],
})

const grdMain2Props = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['CMPNY_DIV', 'VIO_NO', 'COMPANY'],
  fields : [
    { fieldName: 'CFM_DIV', dataType: 'text', header: { text: t('진행상태') }, editable: false, width: 75, },
    { fieldName: 'VIO_TIME_DS', dataType: 'text', header: { text: t('위반일시') }, editable: false, width: 150, },
    { fieldName: 'IO_DIV_NM', dataType: 'text', header: { text: t('소속구분') }, editable: false, width: 65, },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('위반조직') }, editable: false, width: 325, styleName: 'left-column', },
    { fieldName: 'VEND_NAME', dataType: 'text', header: { text: t('협력사') }, editable: false, width: 175, styleName: 'left-column', },
    { fieldName: 'VIO_EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false, width: 85, },
    { fieldName: 'VIOLATOR', dataType: 'text', header: { text: t('성명') }, editable: false, width: 85, },
    { fieldName: 'VIO_DIV_NM', dataType: 'text', header: { text: t('차량구분') }, editable: false, width: 75, },
    { fieldName: 'VIO_SPLC_NM', dataType: 'text', header: { text: t('위반장소') }, editable: false, width: 150, styleName: 'left-column', },
    { fieldName: 'VIO_ITEM1_NM', dataType: 'text', header: { text: t('위반항목') }, editable: false, width: 175, styleName: 'left-column', },
    { fieldName: 'STOP_OBJ', dataType: 'text', header: { text: t('자격중지') }, editable: false, width: 65, },
    { fieldName: 'CRADN_EMP_NM', dataType: 'text', header: { text: t('단속자') }, editable: false, width: 65, },
    { fieldName: 'FILE_ID1', dataType: 'text', header: { text: t('위반첨부') }, editable: false, visible: false, },
    { fieldName: 'FILE_ATTACH1', dataType: 'text', header: { text: t('위반첨부') }, editable: false, isFile: { value: true }, width: 65, },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_NO', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_DIV', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'HP_NO', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'IO_DIV', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_TIME', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_TIME1', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_TIME2', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_LPLC', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_MPLC', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_SPLC', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_PLC_DESC', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_ITEM1', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_ITEM2', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_ITEM2_NM', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_ITEM3', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_ITEM3_NM', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'SPEED', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_DESC', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'BIKE_REG_NO', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'CAR_NO', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VEND_CD', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'REG_YN', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'REG_NO_YN', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'CRADN_EMP_NO', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'HVIO_YN', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'CFM_YN', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'SIGN_YN', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'SIGN_ID', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'CFM_ID', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'CFM_DT', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIOCNT', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_ITEM_NM', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'COMPANY', dataType: 'text', header: { text: t('') }, visible: false, },
    { fieldName: 'VIO_EMP_ASGN', dataType: 'text', header: { text: t('') }, visible: false, },
  ],
})

grdMainProps.columns = grdMainProps.fields
grdMain2Props.columns = grdMain2Props.fields

const searchParams = reactive({
  CHK_VIO_DATE: '',
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  VIO_GDIV: '',
  VIO_DATE_FR: '',
  VIO_DATE_TO: '',
  DANSOK_BSNS_CD: '',
  DANSOK_ASGN_CD: '',
  APP_EMP_NO: '',
  STATUS: '',
})

const gridDatas = reactive({
  VIO_NO: '',
  VIO_DT1: '',
  VIO_TIME2: '',
  VIOLATOR: '',
  VIO_EMP_NO: '',
  JOB_TIT_NM: '',
  VIO_EMP_ASGN: '',
  ASGN_NM: '',
  IO_DIV: '',
  VEND_CD: '',
  VEND_NAME: '',
  VIO_GDIV_NM: '',
  VIO_MDIV_NM: '',
  VIO_DESC: '',
  VIO_SPLC_NM: '',
  VIO_PLC_DESC: '',
  SHIP_NO: '',
  DANSOK_EMP_NM: '',
  DANSOK_EMP_NO: '',
  DANSOK_ASGN_NM: '',
  APP_EMP_NM: '',
  FILE_ID1: '',
})

const grid2Datas = reactive({
  VIO_DIV: '',
  VIOLATOR: '',
  VIO_EMP_NO: '',
  VIO_EMP_ASGN: '',
  ASGN_NM: '',
  VEND_CD: '',
  VEND_NAME: '',
  TEL_NO: '',
  HP_NO: '',
  IO_DIV: '',
  IO_DIV_NM: '',
  BIKE_REG_NO: '',
  VIOCNT: '',
  CAR_NO: '',
  REG_NO_YN: 'N',
  REG_YN: 'N',
  VIO_TIME1: '',
  VIO_TIME2: '',
  HVIO_YN: 'N',
  CRADN_EMP_NM: '',
  VIO_LPLC: '',
  VIO_MPLC: '',
  VIO_SPLC_NM: '',
  VIO_PLC_DESC: '',
  VIO_ITEM_NM: '',
  SPEED: '',
  VIO_DESC: '',
  FILE_ID1: '',
})

const cdList = reactive({
  BSNS_CD: [], // 사업부
  DEPT_CD:[], // 부서
  DANSOK_BSNS_CD: [], // 단속사업부
  DANSOK_ASGN_CD: [], // 단속조직
  VIO_GDIV: [], // 구분
  STATUS: [], // 진행상태
  IO_DIV: [], // 대상구분
})

watch(() => searchParams.BSNS_CD, newValue => {
  if(newValue) {
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
      },
    }).then(res => {
      searchParams.DEPT_CD = ''
      cdList.DEPT_CD = res.ORESULT_CUR
      cdList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    }) 
  } else {
    searchParams.DEPT_CD = ''
    cdList.DEPT_CD = []
    cdList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  }
})

watch(() => searchParams.DANSOK_BSNS_CD, newValue => {
  if(isMounted.value) {
    commonSearchApi({
      queryId: 'SAFDD0010_SEARCH_00',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        DANSOK_BSNS_CD: newValue,
      },
    }).then(res => {
      searchParams.DANSOK_ASGN_CD = ''
      cdList.DANSOK_ASGN_CD = res.ORESULT_CUR
      cdList.DANSOK_ASGN_CD.unshift({ DANSOK_ASGN_NM: '전체', DANSOK_ASGN_CD: '' })
    })
  }
})

const setInit = () => {
  searchParams.CHK_VIO_DATE = 'Y'
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  searchParams.VIO_DATE_FR = dayjs().add(-7, 'day').format('YYYY-MM-DD')
  searchParams.VIO_DATE_TO = dayjs().format('YYYY-MM-DD')
  searchParams.APP_EMP_NO = logsStore.isMenuAdmin === 'Y' ? '' : userStore.userId
}

const searchMain = () => {
  const param = _.cloneDeep(searchParams)

  if(param.CHK_VIO_DATE !== 'Y') {
    param.VIO_DATE_FR = ''
    param.VIO_DATE_TO = ''
  } else {
    param.VIO_DATE_FR = param.VIO_DATE_FR.replaceAll('-', '')
    param.VIO_DATE_TO = param.VIO_DATE_TO.replaceAll('-', '')
  }

  // console.log('param', param)

  return commonSearchApi({ queryId : 'SAFDD0010_SEARCH_01', param: param })
}

const searchMain2 = () => {
  const param = _.cloneDeep(searchParams)

  if(param.CHK_VIO_DATE !== 'Y') {
    param.VIO_DATE_FR = ''
    param.VIO_DATE_TO = ''
  } else {
    param.VIO_DATE_FR = param.VIO_DATE_FR.replaceAll('-', '')
    param.VIO_DATE_TO = param.VIO_DATE_TO.replaceAll('-', '')
  }

  // console.log('param', param)

  return commonSearchApi({ queryId : 'SAFDD0010_SEARCH_02', param: param })
}

const afterSearchMain = res => {
  const data = res.ORESULT_CUR

  grdMain.value.getDataProvider().setRows(data)
}

const afterSearchMain2 = res => {
  const data = res.ORESULT_CUR

  grdMain2.value.getDataProvider().setRows(data)
}

const mainCheck = () => {
  const checkedRow = grdMain.value.getGridView().getCheckedRows()

  if(checkedRow.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  }

  return true
}

const mainCheck2 = () => {
  const checkedRow = grdMain2.value.getGridView().getCheckedRows()

  if(checkedRow.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  }

  return true
}

const saveData1 = async () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    data.OUT_RES_PARAMS = ''
    data.SAVE_YN = 'Y'
    saveParams.push(data)
  }

  let resultSave01 = null

  await commonExecuteApi({
    queryId: 'SAFDD0010_SAVE_01',
    list: saveParams,
  }).then(async res => {
    // console.log('saveData1 res', res)

    const saveParams2 = []

    saveParams.forEach(async p => {
      saveParams2.push({
        CMPNY_DIV: p.CMPNY_DIV,
        VIO_NO: p.VIO_NO,
        COMPANY: p.COMPANY,
        GUBUN: 'A',
        SAVEYN: 'N',
      })
    })

    await commonExecuteApi({
      queryId: 'SAFDD0010_SAVE_06',
      list: saveParams2,
    })
    
    resultSave01 = res
  })
  
  return resultSave01
}

const saveData2 = async () => {
  let saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    saveParams.push(data)
  }

  let result = null

  await commonExecuteApi({
    queryId : 'SAFDD0010_SAVE_02',
    list: saveParams,
  }).then(async res => {
    //if(isDev) {
    // 개발환경이 아닐 때만 메일전송
    if(!isDev) {
      sendMailR(saveParams)

      /* saveParams = _.sortBy(saveParams, 'ASGN_CD').reverse()

      const subject = `${t('안전수칙 위반통지')}(${userStore.asgnNm})`      
      let msg = ''

      for(let i = 0; i < saveParams.length; i++) {
        const param = saveParams[i]       

        // 발송 대상이 1건만 있을 경우
        if(saveParams.length === 1) {
          msg = getMailMsgHeader(userStore.telNo)
          msg += getMailMsgBody(
            param.VIO_TIME_DS,
            param.ASGN_NM,
            param.VIOLATOR,
            param.VIO_MDIV_NM,
            param.VIO_SPLC_NM,
            param.VIO_DESC,
            '',
            param.VEND_NAME,
          )

          const mailList1 = await commonSearchApi({
            queryId : 'SAFDD0010_SEARCH_04',
            param: {
              CMPNY_DIV: param.CMPNY_DIV,
              DEPT_CD: param.DEPT_CD,
              ASGN_CD: param.ASGN_CD,
            },
          })

          const mails1 = []

          mailList1.ORESULT_CUR.forEach(mail => {
            if(mail.EMAIL) {
              mails1.push(mail.EMAIL)
            }
          })

          // 메일전송
          await commonSendApi({
            EMAIL: mails1,
            SUBJECT: subject,
            CONTENT: msg,
          })

          // 2020.08.18 김영우기사 요청
          // 단기공사이면서, 현대중공업 설비기획팀일 경우
          // MOS 보전부, U/T지원부에도 같이 메일 발송
          if(param.IO_DIV === 'D' && param.COMPANY === 'HHI' && param.DEPT_CD === 'X2D0') {
            const mailList2 = await commonSearchApi({
              queryId : 'SAFDD0010_SEARCH_04',
              param: {
                CMPNY_DIV: '230',
                DEPT_CD: 'Y1J0',
                ASGN_CD: 'Y1J0',
              },
            })

            const mails2 = []

            mailList2.ORESULT_CUR.forEach(mail => {
              if(mail.EMAIL) {
                mails2.push(mail.EMAIL)
              }
            })

            // 메일전송
            await commonSendApi({
              EMAIL: mails2,
              SUBJECT: subject,
              CONTENT: msg,
            })

            const mailList3 = await commonSearchApi({
              queryId : 'SAFDD0010_SEARCH_04',
              param: {
                CMPNY_DIV: '230',
                DEPT_CD: 'YD20',
                ASGN_CD: 'YD20',
              },
            })

            const mails3 = []

            mailList3.ORESULT_CUR.forEach(mail => {
              if(mail.EMAIL) {
                mails3.push(mail.EMAIL)
              }
            })
            
            // 메일전송
            await commonSendApi({
              EMAIL: mails3,
              SUBJECT: subject,
              CONTENT: msg,
            })
          }
        } else {
          // 발송대상이 1건 이상일 때
          if(i === 0) {
            // 첫번째 행은 발송 메세지 내용에 담음
            msg = getMailMsgHeader(userStore.telNo)
            msg += getMailMsgBody(
              param.VIO_TIME_DS,
              param.ASGN_NM,
              param.VIOLATOR,
              param.VIO_MDIV_NM,
              param.VIO_SPLC_NM,
              param.VIO_DESC,
              '',
              param.VEND_NAME,
            )
          } else {
            // 이전행 조직과 현재행 조직이 다를 경우 이전 행 조직 메일 발송
            const paramBf = saveParams[i - 1]

            if(param.ASGN_CD !== paramBf.ASGN_CD) {
              const mailList1 = await commonSearchApi({
                queryId : 'SAFDD0010_SEARCH_04',
                param: {
                  CMPNY_DIV: paramBf.CMPNY_DIV,
                  DEPT_CD: paramBf.DEPT_CD,
                  ASGN_CD: paramBf.ASGN_CD,
                },
              })

              const mails1 = []

              mailList1.ORESULT_CUR.forEach(mail => {
                if(mail.EMAIL) {
                  mails1.push(mail.EMAIL)
                }
              })

              // 메일전송
              await commonSendApi({
                EMAIL: mails1,
                SUBJECT: subject,
                CONTENT: msg,
              })

              // 2020.08.18 김영우기사 요청
              // 단기공사이면서, 현대중공업 설비기획팀일 경우
              // MOS 보전부, U/T지원부에도 같이 메일 발송
              if(paramBf.IO_DIV === 'D' && paramBf.COMPANY === 'HHI' && paramBf.DEPT_CD === 'X2D0') {
                const mailList2 = await commonSearchApi({
                  queryId : 'SAFDD0010_SEARCH_04',
                  param: {
                    CMPNY_DIV: '230',
                    DEPT_CD: 'Y1J0',
                    ASGN_CD: 'Y1J0',
                  },
                })

                const mails2 = []

                mailList2.ORESULT_CUR.forEach(mail => {
                  if(mail.EMAIL) {
                    mails2.push(mail.EMAIL)
                  }
                })

                // 메일전송
                await commonSendApi({
                  EMAIL: mails2,
                  SUBJECT: subject,
                  CONTENT: msg,
                })

                const mailList3 = await commonSearchApi({
                  queryId : 'SAFDD0010_SEARCH_04',
                  param: {
                    CMPNY_DIV: '230',
                    DEPT_CD: 'YD20',
                    ASGN_CD: 'YD20',
                  },
                })

                const mails3 = []

                mailList3.ORESULT_CUR.forEach(mail => {
                  if(mail.EMAIL) {
                    mails3.push(mail.EMAIL)
                  }
                })

                // 메일전송
                await commonSendApi({
                  EMAIL: mails3,
                  SUBJECT: subject,
                  CONTENT: msg,
                })
              }

              msg = getMailMsgHeader(userStore.telNo)
              msg += getMailMsgBody(
                param.VIO_TIME_DS,
                param.ASGN_NM,
                param.VIOLATOR,
                param.VIO_MDIV_NM,
                param.VIO_SPLC_NM,
                param.VIO_DESC,
                '',
                param.VEND_NAME,
              )
            } else {
              msg += getMailMsgBody(
                param.VIO_TIME_DS,
                param.ASGN_NM,
                param.VIOLATOR,
                param.VIO_MDIV_NM,
                param.VIO_SPLC_NM,
                param.VIO_DESC,
                '',
                param.VEND_NAME,
              )
            }

            if(saveParams.length - 1 === i) {
              const mailList1 = await commonSearchApi({
                queryId : 'SAFDD0010_SEARCH_04',
                param: {
                  CMPNY_DIV: paramBf.CMPNY_DIV,
                  DEPT_CD: paramBf.DEPT_CD,
                  ASGN_CD: paramBf.ASGN_CD,
                },
              })

              const mails1 = []

              mailList1.ORESULT_CUR.forEach(mail => {
                if(mail.EMAIL) {
                  mails1.push(mail.EMAIL)
                }
              })

              // 메일전송
              await commonSendApi({
                EMAIL: mails1,
                SUBJECT: subject,
                CONTENT: msg,
              })

              // 2020.08.18 김영우기사 요청
              // 단기공사이면서, 현대중공업 설비기획팀일 경우
              // MOS 보전부, U/T지원부에도 같이 메일 발송
              if(param.IO_DIV === 'D' && param.COMPANY === 'HHI' && param.DEPT_CD === 'X2D0') {
                const mailList2 = await commonSearchApi({
                  queryId : 'SAFDD0010_SEARCH_04',
                  param: {
                    CMPNY_DIV: '230',
                    DEPT_CD: 'Y1J0',
                    ASGN_CD: 'Y1J0',
                  },
                })

                const mails2 = []

                mailList2.ORESULT_CUR.forEach(mail => {
                  if(mail.EMAIL) {
                    mails2.push(mail.EMAIL)
                  }
                })

                // 메일전송
                await commonSendApi({
                  EMAIL: mails2,
                  SUBJECT: subject,
                  CONTENT: msg,
                })

                const mailList3 = await commonSearchApi({
                  queryId : 'SAFDD0010_SEARCH_04',
                  param: {
                    CMPNY_DIV: '230',
                    DEPT_CD: 'YD20',
                    ASGN_CD: 'YD20',
                  },
                })

                const mails3 = []

                mailList3.ORESULT_CUR.forEach(mail => {
                  if(mail.EMAIL) {
                    mails3.push(mail.EMAIL)
                  }
                })

                // 메일전송
                await commonSendApi({
                  EMAIL: mails3,
                  SUBJECT: subject,
                  CONTENT: msg,
                })
              }
            }
          }
        }
      } */
    }

    result = res
  })

  // console.log('saveParams', saveParams)
  
  return result
}

const saveData3 = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    saveParams.push(data)
  }

  // console.log('saveParams', saveParams)
  
  return commonExecuteApi({ queryId : 'SAFDD0010_SAVE_03', list: saveParams })
}

const saveData4 = () => {
  const saveParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    saveParams.push(data)
  }

  // console.log('saveParams', saveParams)
  
  return commonExecuteApi({ queryId : 'SAFDD0010_SAVE_04', list: saveParams })
}

const saveData5 = async () => {
  let saveParams = []
  const checkedRows = grdMain2.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain2.value.getDataProvider().getJsonRow(rowIdx)

    data.SAVE_YN = 'Y'

    saveParams.push(data)
  }

  let result = null

  await commonExecuteApi({
    queryId : 'SAFDD0010_SAVE_10',
    list: saveParams,
  }).then(async res => {
    const saveParams2 = []

    for(let i = 0; i < saveParams.length; i++) {
      const param = saveParams[i]

      if(param.CFM_YN === 'Y') {
        saveParams2.push({
          CMPNY_DIV: param.CMPNY_DIV,
          VIO_NO: param.VIO_NO,
          COMPANY: param.COMPANY,
          GUBUN: 'B',
          SAVEYN: 'N',
        })
      }
    }

    await commonExecuteApi({
      queryId : 'SAFDD0010_SAVE_06',
      list: saveParams2,
    }).then(async res2 => {
      if(!isDev) {
      //if(isDev) {
        sendMailT(saveParams)

        /* saveParams = _.sortBy(saveParams, 'ASGN_CD').reverse()

        const subject = `${t('교통 위반통지')}(${userStore.asgnNm})`
        let msg = ''

        for(let i = 0; i < saveParams.length; i++) {
          const param = saveParams[i]

          // 발송 대상이 1건만 있을 경우
          if(saveParams.length === 1) {
            msg = getMailMsgHeader(userStore.telNo)
            msg += getMailMsgBody(
              param.VIO_TIME_DS,
              param.ASGN_NM,
              param.VIOLATOR,
              `${param.VIO_ITEM1_NM} ${param.VIO_ITEM2_NM} ${param.VIO_ITEM3_NM}`,
              `${param.VIO_SPLC_NM} ${param.VIO_PLC_DESC}`,
              param.VIO_DESC,
              param.SPEED,
              param.VEND_NAME
            )

            const mailList1 = await commonSearchApi({
              queryId : 'SAFDD0010_SEARCH_04',
              param: {
                CMPNY_DIV: param.CMPNY_DIV,
                DEPT_CD: param.DEPT_CD,
                ASGN_CD: param.ASGN_CD,
              },
            })

            const mails1 = []

            mailList1.ORESULT_CUR.forEach(mail => {
              if(mail.EMAIL) {
                mails1.push(mail.EMAIL)
              }
            })

            // 메일전송
            await commonSendApi({
              EMAIL: mails1,
              SUBJECT: subject,
              CONTENT: msg,
            })
          } else {
            if(i === 0) {
              msg = getMailMsgHeader(userStore.telNo)
              msg += getMailMsgBody(
                param.VIO_TIME_DS,
                param.ASGN_NM,
                param.VIOLATOR,
                `${param.VIO_ITEM1_NM} ${param.VIO_ITEM2_NM} ${param.VIO_ITEM3_NM}`,
                `${param.VIO_SPLC_NM} ${param.VIO_PLC_DESC}`,
                param.VIO_DESC,
                param.SPEED,
                param.VEND_NAME
              )
            } else {
              // 이전행 조직과 현재행 조직이 다를 경우 이전 행 조직 메일 발송
              const paramBf = saveParams[i - 1]

              if(param.ASGN_CD !== paramBf.ASGN_CD) {
                const mailList1 = await commonSearchApi({
                  queryId : 'SAFDD0010_SEARCH_04',
                  param: {
                    CMPNY_DIV: paramBf.CMPNY_DIV,
                    DEPT_CD: paramBf.DEPT_CD,
                    ASGN_CD: paramBf.ASGN_CD,
                  },
                })

                const mails1 = []

                mailList1.ORESULT_CUR.forEach(mail => {
                  if(mail.EMAIL) {
                    mails1.push(mail.EMAIL)
                  }
                })

                // 메일전송
                await commonSendApi({
                  EMAIL: mails1,
                  SUBJECT: subject,
                  CONTENT: msg,
                })

                msg = getMailMsgHeader(userStore.telNo)
                msg += getMailMsgBody(
                  param.VIO_TIME_DS,
                  param.ASGN_NM,
                  param.VIOLATOR,
                  `${param.VIO_ITEM1_NM} ${param.VIO_ITEM2_NM} ${param.VIO_ITEM3_NM}`,
                  `${param.VIO_SPLC_NM} ${param.VIO_PLC_DESC}`,
                  param.VIO_DESC,
                  param.SPEED,
                  param.VEND_NAME
                )
              } else {
                msg += getMailMsgBody(
                  param.VIO_TIME_DS,
                  param.ASGN_NM,
                  param.VIOLATOR,
                  `${param.VIO_ITEM1_NM} ${param.VIO_ITEM2_NM} ${param.VIO_ITEM3_NM}`,
                  `${param.VIO_SPLC_NM} ${param.VIO_PLC_DESC}`,
                  param.VIO_DESC,
                  param.SPEED,
                  param.VEND_NAME
                )
              }

              if(i === saveParams.length - 1) {
                const mailList1 = await commonSearchApi({
                  queryId : 'SAFDD0010_SEARCH_04',
                  param: {
                    CMPNY_DIV: param.CMPNY_DIV,
                    DEPT_CD: param.DEPT_CD,
                    ASGN_CD: param.ASGN_CD,
                  },
                })

                const mails1 = []

                mailList1.ORESULT_CUR.forEach(mail => {
                  if(mail.EMAIL) {
                    mails1.push(mail.EMAIL)
                  }
                })

                // 메일전송
                await commonSendApi({
                  EMAIL: mails1,
                  SUBJECT: subject,
                  CONTENT: msg,
                })
              }
            }
          }
        } */
      }
    })

    result = res
  })

  return result
}

const saveData6 = async () => {
  let result = null
  const saveParams = []
  const saveParams2 = []
  const checkedRows = grdMain2.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain2.value.getDataProvider().getJsonRow(rowIdx)

    data.SAVE_YN = 'Y'
    saveParams.push(data)
  }

  // console.log('saveData6 saveParams', saveParams)
  await commonExecuteApi({
    queryId : 'SAFDD0010_SAVE_11',
    list: saveParams
  }).then(async res => {
    for(let i = 0; i < saveParams.length; i++) {
      if(saveParams[i].CFM_YN === 'N') {
        const param = saveParams[i]

        saveParams2.push({
          CMPNY_DIV: param.CMPNY_DIV,
          VIO_NO: param.VIO_NO,
          COMPANY: param.COMPANY,
          GUBUN: 'B',
        })
      }
    }

    // console.log('saveData6 saveParams2', saveParams2)
    await commonExecuteApi({
      queryId : 'SAFDD0010_DELETE_03',
      list: saveParams2
    })

    result = res
  })
  
  return result
}

// 일반수칙
const sendMailR = (mailList) => {
  //console.log('mailList', mailList)

  mailList = _.sortBy(mailList, ['ASGN_CD','VIO_MDIV_TYPE']).reverse()
  
  let subject = '[HiSEs] 안전수칙위반 안내'
  let msg = ''

  for(let i = 0; i < mailList.length; i++) {
    //console.log('i', i)
    const param = mailList[i]    

    if(i == 0){
      msg = getMailMsgHeaderR(userStore.telNo, param.VIO_MDIV_TYPE)
      msg += '<tr>'
      msg += '<td>' + nullToEmpty(param.VIO_TIME_DS) + '</td>'
      msg += '<td>' + nullToEmpty(param.ASGN_NM) + '</td>'
      msg += '<td>' + nullToEmpty(param.VEND_NAME) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIOLATOR) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIO_GDIV_NM) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIO_MDIV_NM) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIO_SPLC_NM) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIO_PLC_DESC) + '</td>'
      msg += '<td>' + nullToEmpty(param.SHIP_NO) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIO_DESC) + '</td>'
      msg += '<td>' + nullToEmpty(param.DANSOK_EMP_NM) + '</td>'
      msg += '<td>' + nullToEmpty(param.DANSOK_ASGN_NM) + '</td>'
      msg += '</tr>'
    } else {
      const param_bef = mailList[i-1]
      if(param.ASGN_CD !== param_bef.ASGN_CD || param.VIO_MDIV_TYPE !== param_bef.VIO_MDIV_TYPE){
        msg += getMailMsgFooter()
        //console.log('msg ' + param_bef.ASGN_CD + ' ' + param_bef.VIO_MDIV_TYPE, msg)

        if(param_bef.VIO_MDIV_TYPE === '1'){
          subject = '[HiSEs] 안전수칙위반(절대수칙) 안내'
        } else {
          subject = '[HiSEs] 안전수칙위반 안내'
        }
        sendMailDetail(param_bef.COMPANY, param_bef.DEPT_CD, param_bef.ASGN_CD, subject, msg)
        
        msg = getMailMsgHeaderR(userStore.telNo, param.VIO_MDIV_TYPE)
        msg += '<tr>'
        msg += '<td>' + nullToEmpty(param.VIO_TIME_DS) + '</td>'
        msg += '<td>' + nullToEmpty(param.ASGN_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.VEND_NAME) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIOLATOR) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_GDIV_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_MDIV_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_SPLC_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_PLC_DESC) + '</td>'
        msg += '<td>' + nullToEmpty(param.SHIP_NO) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_DESC) + '</td>'
        msg += '<td>' + nullToEmpty(param.DANSOK_EMP_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.DANSOK_ASGN_NM) + '</td>'
        msg += '</tr>'
      } else {
        msg += '<tr>'
        msg += '<td>' + nullToEmpty(param.VIO_TIME_DS) + '</td>'
        msg += '<td>' + nullToEmpty(param.ASGN_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.VEND_NAME) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIOLATOR) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_GDIV_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_MDIV_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_SPLC_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_PLC_DESC) + '</td>'
        msg += '<td>' + nullToEmpty(param.SHIP_NO) + '</td>'
        msg += '<td>' + nullToEmpty(param.VIO_DESC) + '</td>'
        msg += '<td>' + nullToEmpty(param.DANSOK_EMP_NM) + '</td>'
        msg += '<td>' + nullToEmpty(param.DANSOK_ASGN_NM) + '</td>'
        msg += '</tr>'
      }
    }

    if(i == mailList.length-1){
      msg += getMailMsgFooter()
      //console.log('msg end', msg)

      if(param.VIO_MDIV_TYPE === '1'){
        subject = '[HiSEs] 안전수칙위반(절대수칙) 안내'
      } else {
        subject = '[HiSEs] 안전수칙위반 안내'
      }
      sendMailDetail(param.COMPANY, param.DEPT_CD, param.ASGN_CD, subject, msg)
    }
  }
}

// 교통위반
const sendMailT = (mailList) => {
  //console.log('mailList', mailList)

  mailList = _.sortBy(mailList, ['ASGN_CD']).reverse()
  
  let subject = '[HiSEs] 안전수칙위반 안내'
  let msg = ''

  for(let i = 0; i < mailList.length; i++) {
    //console.log('i', i)
    const param = mailList[i]    

    if(i == 0){
      msg = getMailMsgHeaderT(userStore.telNo)
      msg += '<tr>'
      msg += '<td>' + nullToEmpty(param.VIO_TIME_DS) + '</td>'
      msg += '<td>' + nullToEmpty(param.ASGN_NM) + '</td>'
      msg += '<td>' + nullToEmpty(param.VEND_NAME) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIOLATOR) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIO_DIV_NM) + '</td>'      
      msg += '<td>' + nullToEmpty(param.CAR_NO) + '</td>'      
      msg += '<td>' + nullToEmpty(param.VIO_SPLC_NM) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIO_PLC_DESC) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIO_ITEM1_NM) + '</td>'
      msg += '<td>' + nullToEmpty(param.SPEED) + '</td>'
      msg += '<td>' + nullToEmpty(param.VIO_DESC) + '</td>'
      msg += '<td>' + nullToEmpty(param.CRADN_EMP_NM) + '</td>'      
      msg += '</tr>'
    } else {
      const param_bef = mailList[i-1]
      if(param.ASGN_CD !== param_bef.ASGN_CD){
        msg += getMailMsgFooter()
        //console.log('msg ' + param_bef.ASGN_CD + ' ' + param_bef.VIO_MDIV_TYPE, msg)
        
        sendMailDetail(param_bef.COMPANY, param_bef.DEPT_CD, param_bef.ASGN_CD, subject, msg)
        
        msg = getMailMsgHeaderT(userStore.telNo)
        msg += '<tr>'
          msg += '<td>' + nullToEmpty(param.VIO_TIME_DS) + '</td>'
          msg += '<td>' + nullToEmpty(param.ASGN_NM) + '</td>'
          msg += '<td>' + nullToEmpty(param.VEND_NAME) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIOLATOR) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIO_DIV_NM) + '</td>'      
          msg += '<td>' + nullToEmpty(param.VIO_SPLC_NM) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIO_PLC_DESC) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIO_ITEM1_NM) + '</td>'
          msg += '<td>' + nullToEmpty(param.SPEED) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIO_DESC) + '</td>'
          msg += '<td>' + nullToEmpty(param.CRADN_EMP_NM) + '</td>'
        msg += '</tr>'
      } else {
        msg += '<tr>'
          msg += '<td>' + nullToEmpty(param.VIO_TIME_DS) + '</td>'
          msg += '<td>' + nullToEmpty(param.ASGN_NM) + '</td>'
          msg += '<td>' + nullToEmpty(param.VEND_NAME) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIOLATOR) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIO_DIV_NM) + '</td>'      
          msg += '<td>' + nullToEmpty(param.VIO_SPLC_NM) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIO_PLC_DESC) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIO_ITEM1_NM) + '</td>'
          msg += '<td>' + nullToEmpty(param.SPEED) + '</td>'
          msg += '<td>' + nullToEmpty(param.VIO_DESC) + '</td>'
          msg += '<td>' + nullToEmpty(param.CRADN_EMP_NM) + '</td>'
        msg += '</tr>'
      }
    }

    if(i == mailList.length-1){
      msg += getMailMsgFooter()
      //console.log('msg end', msg)
      
      sendMailDetail(param.COMPANY, param.DEPT_CD, param.ASGN_CD, subject, msg)
    }
  }
}

const sendMailDetail = async (pCmpnyDiv, pDeptCd, pAsgnCd, pSubject, pMsg) => {
  const mailList1 = await commonSearchApi({
    queryId : 'SAFDD0010_SEARCH_04',
    param: {
      CMPNY_DIV: pCmpnyDiv,
      DEPT_CD: pDeptCd,
      ASGN_CD: pAsgnCd,
    },
  })

  const mails1 = []

  mailList1.ORESULT_CUR.forEach(mail => {
    if(mail.EMAIL) {
      mails1.push(mail.EMAIL)
    }
  })

  // 메일전송
  await commonSendApi({
    EMAIL: mails1,
    SUBJECT: pSubject,
    CONTENT: pMsg,
  })
}

const btnSearch = () => {
  // console.log('btnSearch')

  if(tab.value === '0') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchMain)
      .setAfter(afterSearchMain)
      .run()
  } else {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain2])
      .setQuery(searchMain2)
      .setAfter(afterSearchMain2)
      .run()
  }
}

const btnUpdate = () => {
  // console.log('btnUpdate')

  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setBefore(mainCheck)
    .setQuery(saveData1)
    .setAfter(res => {
      onButtonsClick({ id :'btnSearch' })
    })
    .run()
}

const btnReject = () => {
  // console.log('btnReject')

  if(tab.value === '0') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage(t('반려 하시겠습니까?'))
      .setResultMessage(t('반려 되었습니다.'))
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(saveData3)
      .setAfter(res => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  } else {

  }
}

const btnApprove = () => {
  // console.log('btnApprove')

  if(tab.value === '0') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage(t('승인 하시겠습니까?'))
      .setResultMessage(t('승인 되었습니다.'))
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(saveData2)
      .setAfter(res => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  } else {
    new saveFlowHelper(vm, t)
      .setConfirmMessage(t('승인 하시겠습니까?'))
      .setResultMessage(t('승인 되었습니다.'))
      .setTargetGridRow([{ grid:grdMain2, row: 'check' }])
      .setGridList([grdMain2])
      .setBefore(mainCheck2)
      .setQuery(saveData5)
      .setAfter(res => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  }
}

const btnApproveCancel = () => {
  // console.log('btnApproveCancel')

  if(tab.value === '0') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage(t('승인취소 하시겠습니까?'))
      .setResultMessage(t('승인취소 되었습니다.'))
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(saveData4)
      .setAfter(res => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  } else {
    new saveFlowHelper(vm, t)
      .setConfirmMessage(t('승인취소 하시겠습니까?'))
      .setResultMessage(t('승인취소 되었습니다.'))
      .setTargetGridRow([{ grid:grdMain2, row: 'check' }])
      .setGridList([grdMain2])
      .setBefore(mainCheck2)
      .setQuery(saveData6)
      .setAfter(res => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  }
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    btnSearch()
  } else if(btn.id === 'btnFILE_ID1') {
    // console.log('fileId', gridDatas.FILE_ID1)

    if(tab.value === '0') {
      iUploadPopup.value.openPopup(gridDatas.FILE_ID1)
    } else {
      iUploadPopup.value.openPopup(grid2Datas.FILE_ID1)
    }
  } else if(btn.id === 'btnUpdate') {
    btnUpdate()
  } else if(btn.id === 'btnReject') {
    btnReject()
  } else if(btn.id === 'btnApprove') {
    btnApprove()
  } else if(btn.id === 'btnApproveCancel') {
    btnApproveCancel()
  }
}

const setCdList = async () => {
  await commonSearchApi({
    queryId: 'searchBSNS',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      USE_DIV: 'N',
    },
  }).then(async res => {
    // console.log('searchBSNS res', res)

    cdList.BSNS_CD = _.cloneDeep(res.ORESULT_CUR)
    cdList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    cdList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

    cdList.DANSOK_BSNS_CD = _.cloneDeep(res.ORESULT_CUR)
    cdList.DANSOK_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    cdList.DANSOK_ASGN_CD.unshift({ DANSOK_ASGN_NM: '전체', DANSOK_ASGN_CD: '' })

    if(_.some(cdList.DANSOK_BSNS_CD, { BSNS_CD: userStore.bsnsCd })) {
      searchParams.DANSOK_BSNS_CD = userStore.bsnsCd

      const res2 = await commonSearchApi({
        queryId: 'SAFDD0010_SEARCH_00',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          DANSOK_BSNS_CD: searchParams.DANSOK_BSNS_CD,
        },
      })
      
      searchParams.DANSOK_ASGN_CD = ''
      cdList.DANSOK_ASGN_CD = res2.ORESULT_CUR

      // console.log('cdList.DANSOK_ASGN_CD', cdList.DANSOK_ASGN_CD)
      cdList.DANSOK_ASGN_CD.unshift({ DANSOK_ASGN_NM: '전체', DANSOK_ASGN_CD: '' })

      if(_.some(cdList.DANSOK_ASGN_CD, { DANSOK_ASGN_CD: userStore.asgnCd })) {
        searchParams.DANSOK_ASGN_CD = userStore.asgnCd
      }
    }
  })

  await getCodeList('HHIF110').then(res => {
    const temp = res.ORESULT_CUR

    temp.unshift({ TXT: '전체', COD: '' })
    for(let i = temp.length - 1; i >= 0; i--) {
      // console.log('temp[i].COD.substring(0, 1)', temp[i].COD.substring(0, 1))

      if(temp[i].COD.substring(0, 1) === 'S') {
        temp.splice(i, 1)
      }
    }

    // console.log('HHIF110 temp', temp)

    cdList.VIO_GDIV = temp
  })

  await getCodeList('HHIF180').then(res => {
    const temp = _.cloneDeep(res.ORESULT_CUR)
    const temp1 = _.cloneDeep(res.ORESULT_CUR)

    temp.unshift({ TXT: '전체', COD: '' })
    for(let i = temp.length - 1; i >= 0; i--) {
      // console.log('temp[i].COD.substring(0, 1)', temp[i].COD.substring(0, 1))

      if(temp[i].COD === '10' || temp[i].COD === '11') {
        temp.splice(i, 1)
      }
    }

    // console.log('HHIF110 temp', temp)

    cdList.STATUS = temp
    grdMain.value.setBindingColumn('STATUS', temp1, 'COD', 'TXT')
  })

  await getCodeList('HHIZ020').then(res => {
    // console.log('HHIF110 res.ORESULT_CUR', res.ORESULT_CUR)

    cdList.IO_DIV = res.ORESULT_CUR
  })
}

const onCellItemClicked = (grid, index, clickData) => {
  // console.log('onCellItemClicked grid', grid)
  // console.log('onCellItemClicked index', index)
  // console.log('onCellItemClicked clickData', clickData)

  if(index.itemIndex > -1) {
    if(index.fieldName === 'FILE_ATTACH1') {
      const currRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      iUploadPopup.value.openPopup(currRow.FILE_ID1)
    } else if(index.fieldName === 'FILE_ATTACH2') {
      const currRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      iUploadPopup.value.openPopup(currRow.FILE_ID2)
    }
  }
}

const onCellItemClicked2 = (grid, index, clickData) => {
  // console.log('onCellItemClicked grid', grid)
  // console.log('onCellItemClicked index', index)
  // console.log('onCellItemClicked clickData', clickData)

  if(index.itemIndex > -1) {
    if(index.fieldName === 'FILE_ATTACH1') {
      const currRow = grdMain2.value.getDataProvider().getJsonRow(clickData.dataRow)
      iUploadPopup.value.openPopup(currRow.FILE_ID1)
    }
  }
}

const openGbn = () => {
  // console.log('openGbn', grdMain.value.getGridView().getCurrent())

  if(grdMain.value.getGridView().getCurrent().itemIndex > -1) {
    selectGbn.value.openPopup()
  }
}

const selectedGbn = param => {
  // console.log('param', param)

  gridDatas.VIO_GDIV = param[0].COD
  gridDatas.VIO_MDIV = param[1].COD
  gridDatas.VIO_GDIV_NM = param[0].TXT
  gridDatas.VIO_MDIV_NM = param[1].TXT

  changeGrdVal('VIO_GDIV,VIO_MDIV,VIO_GDIV_NM,VIO_MDIV_NM')
}

// 상세보기 값 변경시 그리드 값 변경
// param : 변경할 field list, 여러개일때는 콤마로 구분
const changeGrdVal = param => {
  const params = param.split(',')

  // console.log('param', param)

  params.forEach(key => {
    const idx = grdMain.value.getGridView().getCurrent().dataRow

    if(idx < 0) {
      return
    }
    
    grdMain.value.getDataProvider().setValue(idx, key, gridDatas[key])
    grdMain.value.getGridView().checkRow(idx)
  })
}

const getMailMsgHeaderR = (tel, type) => {
  let mailMsg = ''

  mailMsg += '<head><style>table { width: 98%; border: 1px solid #444444; border-collapse: collapse; } th, td { border: 1px solid #444444; padding: 5px; font-size: 14px; } .title{ background-color:lightsteelblue; font-weight: bold; text-align: center; } </style> </head> <body>'
  
  if(type === '1'){
    //mailMsg += '<br/>업무에 노고가 많으십니다.'
    mailMsg += '안전수칙 위반 사항을 아래와 같이 안내 드립니다. 재발방지대책 수립 및 활동 결과를 ‘위반일+7일’ 이내에 담당 사업부 안전부에 제출해 주시기 바랍니다. '
    mailMsg += '<br/>안전부에 재발방지대책 제출 후 전산 시스템에도 결과를 등록해 주시기 바랍니다. (조치결과 등록 시 SLI 감점 50% 복구)'
    mailMsg += '<br/>&nbsp;&nbsp; * 재발방지대책 포함 내용 : 특별안전교육, 부문장 주관 안전활동 결과 등 (부문장 결재 必)'
    mailMsg += '<br/>&nbsp;&nbsp; * 절대수칙 위반 내용 확인 : HiSEs [안전]–[안전수칙]–[안전수칙위반 현황/등록] 화면에서 확인'    
  } else {
    //mailMsg += '<br/>업무에 노고가 많으십니다.'
    mailMsg += '안전수칙 위반 사항을 아래와 같이 안내 드립니다. 확인 후 조치결과를 전산 시스템에 등록 바랍니다.'
    mailMsg += '<br/>&nbsp;&nbsp; * HiSEs [안전]–[안전수칙]–[안전수칙위반 현황/등록] 화면에서 해당 내용을 더블 클릭 후 조치사항 자료 첨부'
  }

  //mailMsg += '<br/><br/><center>== 아 래 ==</center>'
  
  mailMsg += '<br/><br/>'
  mailMsg += '◎ 안전수칙위반 내용'
  mailMsg += '<br/>'  
  mailMsg += '<table><tr class="title">'  
  mailMsg += '<th>위반일시</th>'
  mailMsg += '<th>위반조직</th>'
  mailMsg += '<th>협력사</th>'
  mailMsg += '<th>성명</th>'
  mailMsg += '<th>위반구분(대)</th>'
  mailMsg += '<th>위반구분(소)</th>'
  mailMsg += '<th>위반장소</th>'
  mailMsg += '<th>위반장소상세</th>'
  mailMsg += '<th>호선No.</th>'
  mailMsg += '<th>위반내용</th>'
  mailMsg += '<th>단속자</th>'
  mailMsg += '<th>단속자조직</th>' 
  mailMsg += '</tr>'  
 
  return mailMsg
}

const getMailMsgHeaderT = (tel) => {
  let mailMsg = ''

  mailMsg += '<head><style>table { width: 98%; border: 1px solid #444444; border-collapse: collapse; } th, td { border: 1px solid #444444; padding: 5px; font-size: 14px; } .title{ background-color:lightsteelblue; font-weight: bold; text-align: center; } </style> </head> <body>'
    
  mailMsg += '안전수칙 위반 사항을 아래와 같이 안내 드립니다. 확인 후 조치결과를 전산 시스템에 등록 바랍니다.'
  mailMsg += '<br/>&nbsp;&nbsp; * HiSEs [안전]–[안전수칙]–[안전수칙위반 현황/등록] 화면에서 해당 내용을 더블 클릭 후 조치사항 자료 첨부'
  
  //mailMsg += '<br/><br/><center>== 아 래 ==</center>'
  
  mailMsg += '<br/><br/>'
  mailMsg += '◎ 안전수칙위반 내용'
  mailMsg += '<br/>'  
  mailMsg += '<table><tr class="title">'  
  mailMsg += '<th>위반일시</th>'
  mailMsg += '<th>위반조직</th>'
  mailMsg += '<th>협력사</th>'
  mailMsg += '<th>성명</th>'
  mailMsg += '<th>차량구분</th>'    
  mailMsg += '<th>차량번호</th>'    
  mailMsg += '<th>위반장소</th>'
  mailMsg += '<th>위반장소상세</th>'
  mailMsg += '<th>위반항목</th>'
  mailMsg += '<th>주행속도(Km/h)</th>'
  mailMsg += '<th>위반내용</th>'
  mailMsg += '<th>단속자</th>'
  mailMsg += '</tr>'  
 
  return mailMsg
}

const getMailMsgFooter = () => {
  let mailMsg = ''
  mailMsg += '</table></body>'

  return mailMsg
}

const getMailMsgHeader = tel => {
  let mailMsg = ''

  mailMsg = '<br/>업무에 노고가 많으십니다.'
  mailMsg += '<br/><br/>아래와 같이 안전수칙 위반관련 내용을 송부드리니 참조하시기 바랍니다.'
  mailMsg += '<br/><br/>관련 문의사항은 ' + tel + '로 연락바랍니다.'
  mailMsg += '<br/><br/>감사합니다.'
  mailMsg += '<br/><br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;== 아 래 =='
  mailMsg += '<br/><br/>'

  return mailMsg
}

const getMailMsgBody = (vioTimeDS, asgnNM, violator, vioItemNM, vioSplcNM, vioDesc, speed, vendName) => {
  let mailMsg = ''
  let vioItemNMRe = ''
  let violatorRe = ''

  // 박재환 기감님 요청으로 주행속도가 없으면 위반항목이 보여지지 않는 내용 수정 - 2023.10.31 박상진
  if(speed != '') {
    vioItemNMRe = vioItemNM + '(주행속도 : ' + speed + 'Km/h)'
  } else {
    vioItemNMRe = vioItemNM
  }

  violatorRe = violator

  if(vendName) {
    violatorRe = violator + ' (' + vendName + ')'
  }

  mailMsg = `- 위반일시(${vioTimeDS}) <br/>- 조직 : ${asgnNM}<br/>- 성명 : ${violatorRe}<br/>- 위반항목 : ${vioItemNMRe}<br/>- 장소 : ${vioSplcNM}`

  if(!vioDesc) {
    mailMsg += `<br/>- 위반상세 : ${vioDesc}`
  }

  return mailMsg
}

// 그리드 값 위반상세에 반영
const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
  if(newIdx > -1) {
    const row = grdMain.value.getDataProvider().getJsonRow(newIdx)

    // console.log('row', row)

    Object.keys(gridDatas).forEach(key => {
      gridDatas[key] = row[key]
    })

    // console.log('gridDatas', gridDatas)
  } else {
    Object.keys(gridDatas).forEach(key => {
      gridDatas[key] = ''
    })
  }
}

// 그리드 값 교통위반상세에 반영
const onCurrentRowChanged2 = (grid, oldIdx, newIdx) => {
  if(newIdx > -1) {
    const row = grdMain2.value.getDataProvider().getJsonRow(newIdx)

    // console.log('row', row)
    
    Object.keys(grid2Datas).forEach(key => {
      grid2Datas[key] = row[key]
    })

    // console.log('grid2Datas.VIO_DIV', grid2Datas.VIO_DIV)
    
    if(row.VIO_EMP_ASGN === '' || (row.ASGN_NM !== '' && row.VIO_EMP_ASGN === row.ASGN_NM)) {
      showAsgn.value = false
    } else {
      showAsgn.value = true
    }

    // console.log('row.VIO_EMP_ASGN', row.VIO_EMP_ASGN)
    // console.log('row.ASGN_NM', row.ASGN_NM)
    // console.log('showAsgn.value', showAsgn.value)

    // console.log('grid2Datas', grid2Datas)
  } else {
    Object.keys(grid2Datas).forEach(key => {
      grid2Datas[key] = ''
    })
  }
}

const openCnt = () => {
  refSAFDD0010Popup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NO: grid2Datas.VIO_EMP_NO
  })
}

const tabChange = val => {
  if(val === '1') {
    gridTitle.value.visibleBtn('btnReject', false)
  } else {
    gridTitle.value.visibleBtn('btnReject', true)
  }
}

onMounted(async () => {
  await setCdList()
  setInit()
  onButtonsClick({ id: 'btnSearch' })
  isMounted.value = true
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(logsStore.menuId)"
        @click-button="onButtonsClick"
      />
      <!-- :button-list="['btnSearch', 'btnUpdate', 'btnReject', 'btnApprove', 'btnApproveCancel']" -->
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <v-radio-group v-model="tab" inline @update:model-value="tabChange">
            <v-radio label="수칙위반" value="0"></v-radio>
            <v-radio label="교통위반" value="1"></v-radio>
          </v-radio-group>
        </v-sheet>
        <IGridTitle
          ref="gridTitle"
          :button-list="['btnSearch', 'btnReject', 'btnApprove', 'btnApproveCancel']"
          @click-button="onButtonsClick"
        >
        </IGridTitle>
        <v-sheet class="searchArea d-flex flex-column mb-1">
          <div class="d-flex">
            <i-input
              v-model="searchParams.VIO_DATE_FR"
              :label="$t('위반일자')"
              type="date"
              margin="10px"
              required
              width="255px"
              label-width="55px"
            >
              <template v-slot:between-inner>
                <v-checkbox v-model="searchParams.CHK_VIO_DATE" />
              </template>
            </i-input>
            <i-input
              v-model="searchParams.VIO_DATE_TO"
              width="190px"
              :label="$t('~')"
              type="date"/>
            <i-select
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')"
              :items="cdList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              width="250px"
              label-width="65px"
            />
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서')"
              :items="cdList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              width="500px"
              label-width="50px"
            />
            <i-select
              v-model="searchParams.STATUS"
              :label="$t('진행상태')"
              :items="cdList.STATUS"
              item-value="COD"
              item-title="TXT"
              width="175px"
            />
          </div>
          
          <div class="d-flex mt-2">
            <i-select
              :label="$t('구분')"
              v-model="searchParams.VIO_GDIV" 
              :items="cdList.VIO_GDIV"
              item-value="COD"
              item-title="TXT"
              width="455px"
              label-width="55px"
            />
            <i-select
              :label="$t('단속사업부')"
              v-model="searchParams.DANSOK_BSNS_CD" 
              :items="cdList.DANSOK_BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              width="250px"
              label-width="65px"
              :disabled="logsStore.isMenuAdmin !== 'Y'"
            />
            <i-select
              :label="$t('단속조직')"
              v-model="searchParams.DANSOK_ASGN_CD" 
              :items="cdList.DANSOK_ASGN_CD"
              item-value="DANSOK_ASGN_CD"
              item-title="DANSOK_ASGN_NM"
              width="500px"
              label-width="50px"
              :disabled="logsStore.isMenuAdmin !== 'Y'"
            />
          </div>
        </v-sheet>

        <!-- 수칙위반 -->
        <v-window v-model="tab" class="h-window">
          <v-window-item value="0" class="h-full overflow-y-auto">
            <div class="h-grow">
              <v-sheet class="h-auto">
                <RealGrid
                  ref="grdMain"
                  :style="{ height: exPanVal === 0 ? '250px' : '100%' }"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys"
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  @on-cell-item-clicked="onCellItemClicked"
                  @on-current-row-changed="onCurrentRowChanged"
                />

                <VExpansionPanels
                  v-model="exPanVal"
                  class="mt-2"
                >
                  <VExpansionPanel elevation="0">
                    <VExpansionPanelTitle
                    class="font-weight-bold"
                    color="base"
                    >
                      {{ t('위반상세') }}
                    </VExpansionPanelTitle>
                    <VExpansionPanelText>
                      <div class="d-flex flex-column fill-height">
                        <v-sheet height="50%" style="display: flex; flex-direction: row;">
                          <v-sheet width="60%" style="padding-right: 5px;">
                            <div class="pa-3 traffic-col">
                              <div class="d-flex panel--row subtitle font-weight-bold">
                                {{ ` ${t('위반정보')} &nbsp;&nbsp; : ${gridDatas.VIO_NO}` }}
                              </div>
                              <div class="d-flex panel--row">
                                <i-input
                                  v-model="gridDatas.VIO_DT1"
                                  :label="$t('위반일시')"
                                  readonly
                                  top-label
                                  margin="10px"
                                  width="210px"
                                />
                                <i-input
                                  v-model="gridDatas.VIO_TIME2"
                                  readonly
                                  top-label
                                  width="100px"
                                />
                              </div>
                              <div class="d-flex panel--row">
                                <i-input
                                  v-model="gridDatas.VIOLATOR"
                                  :label="$t('성명')"
                                  readonly
                                  top-label
                                  width="150px"
                                />
                                <i-input
                                  v-model="gridDatas.VIO_EMP_NO"
                                  :label="$t('사번')"
                                  readonly
                                  top-label
                                  width="150px"
                                />
                                <i-input
                                  v-model="gridDatas.JOB_TIT_NM"
                                  :label="$t('직위')"
                                  readonly
                                  top-label
                                  width="150px"
                                />
                                <i-input
                                  v-model="gridDatas.VIO_EMP_ASGN"
                                  :label="$t('소속조직')"
                                  readonly
                                  top-label
                                  width="350px"
                                />
                              </div>
                              <div class="d-flex panel--row">
                                <i-input
                                  v-model="gridDatas.ASGN_NM"
                                  :label="$t('위반조직')"
                                  readonly
                                  top-label
                                  width="320px"
                                />
                                <i-select
                                  v-model="gridDatas.IO_DIV"
                                  :items="cdList.IO_DIV"
                                  item-value="COD"
                                  item-title="TXT"
                                  :label="$t('대상구분')"
                                  readonly
                                  top-label
                                  width="150px"
                                />
                                <i-input
                                  v-model="gridDatas.VEND_CD"
                                  :label="$t('사외협력사')"
                                  readonly
                                  top-label
                                  margin="10px"
                                  width="175px"
                                />
                                <i-input
                                  v-model="gridDatas.VEND_NAME"
                                  readonly
                                  top-label
                                  width="250px"
                                />
                              </div>
                              <div class="d-flex panel--row">
                                <i-input
                                  v-model="gridDatas.VIO_GDIV_NM"
                                  :label="$t('구분')"
                                  top-label
                                  margin="10px"
                                  width="200px"
                                  readonly
                                />
                                <i-input
                                  v-model="gridDatas.VIO_MDIV_NM"
                                  readonly
                                  top-label
                                  margin="6px"
                                  width="280px"
                                />
                                <!-- append-inner-icon="mdi-magnify"
                                @click:append-inner="openGbn" -->
                                <div class="d-flex align-center pt-5">
                                  <v-btn
                                    class="titleBtn"
                                    @click="onButtonsClick({ id: 'btnFILE_ID1' })"
                                  >
                                    {{ t('위반사항 첨부보기') }}
                                  </v-btn>
                                </div>
                              </div>
                              <div class="d-flex panel--row">
                                <i-textarea
                                  v-model="gridDatas.VIO_DESC"
                                  :label="$t('내용')"
                                  top-label
                                  margin="0"
                                  width="60%"
                                  :row="7"
                                  maxlength="200"
                                  readonly
                                  @update:model-value="changeGrdVal('VIO_DESC')"
                                />
                              </div>
                              <div class="d-flex panel--row">
                                <i-input
                                  v-model="gridDatas.VIO_SPLC_NM"
                                  :label="$t('장소')"
                                  readonly
                                  top-label
                                  width="200px"
                                />
                                <i-input
                                  v-model="gridDatas.VIO_PLC_DESC"
                                  :label="$t('장소상세')"
                                  readonly
                                  top-label
                                  width="410px"
                                />
                                <i-input
                                  v-model="gridDatas.SHIP_NO"
                                  :label="$t('호선No.')"
                                  readonly
                                  top-label
                                  width="200px"
                                />
                              </div>
                            </div>
                          </v-sheet>
                          <v-sheet width="40%" style="padding-right: 5px;" class="pb-2">
                            <div class="pa-3 traffic-col">
                              <div class="d-flex panel--row subtitle font-weight-bold">
                                {{ `${t('단속자정보')}` }}
                              </div>
                              <div class="d-flex panel--row">
                                <i-input
                                  v-model="gridDatas.DANSOK_EMP_NM"
                                  :label="$t('단속자성명')"
                                  readonly
                                  top-label
                                  width="200px"
                                />
                                <i-input
                                  v-model="gridDatas.DANSOK_EMP_NM"
                                  :label="$t('단속자사번')"
                                  readonly
                                  top-label
                                  width="200px"
                                />
                              </div>
                              <div class="d-flex panel--row">
                                <i-input
                                  v-model="gridDatas.DANSOK_ASGN_NM"
                                  :label="$t('단속자소속')"
                                  readonly
                                  top-label
                                  width="420px"
                                />
                                <i-input
                                  v-model="gridDatas.APP_EMP_NM"
                                  :label="$t('승인자')"
                                  readonly
                                  top-label
                                  width="200px"
                                />
                              </div>
                            </div>
                          </v-sheet>
                        </v-sheet>
                      </div>
                    </VExpansionPanelText>
                  </VExpansionPanel>
                </VExpansionPanels>
              </v-sheet>
            </div>
          </v-window-item>
          <v-window-item value="1" class="h-full overflow-y-auto">
            <div class="h-grow">
              <v-sheet class="h-auto">
                <RealGrid
                  ref="grdMain2"
                  :style="{ height: exPanVal2 === 0 ? '250px' : '100%' }"
                  :grid-view-option="grdMain2Props.gridViewOption"
                  :keys="grdMain2Props.keys"
                  :fields="grdMain2Props.fields"
                  :columns="grdMain2Props.columns"
                  @on-cell-item-clicked="onCellItemClicked2"
                  @on-current-row-changed="onCurrentRowChanged2"
                />

                <VExpansionPanels
                  v-model="exPanVal2"
                  class="mt-2"
                >
                  <VExpansionPanel elevation="0">
                    <VExpansionPanelTitle
                    class="font-weight-bold"
                    color="base"
                    >
                      {{ t('교통위반상세') }}
                    </VExpansionPanelTitle>
                    <VExpansionPanelText>
                      <div class="d-flex mt-2">
                        <div class="d-flex flex-column pa-3 mr-2 traffic-col">
                          <div class="d-flex panel--row">
                            <div>
                              <!-- <div style="font-size: 14px; color: #222222;"> -->
                              <div class="d-flex mb-2 panel--row subtitle2 font-weight-bold" style="margin-top: 3px;">
                                차량구분
                              </div>
                              <div class="div-radio radio-car">
                                <v-radio-group v-model="grid2Datas.VIO_DIV" inline>
                                  <v-radio label="오토바이" value="A" />
                                  <v-radio label="차랑" value="C" />
                                  <v-radio label="자전거" value="B" />
                                  <v-radio label="보행자" value="D" />
                                  <v-radio label="기타" value="Z" />
                                </v-radio-group>
                              </div>
                            </div>
                          </div>
                          <div class="d-flex panel--row subtitle font-weight-bold">
                            {{ '위반자정보' }}
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VIOLATOR"
                              :label="$t('위반자성명')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <i-input
                              v-model="grid2Datas.VIO_EMP_NO"
                              :label="$t('위반자사번')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <i-input
                              v-model="grid2Datas.TEL_NO"
                              :label="$t('사내전화')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <i-input
                              v-model="grid2Datas.HP_NO"
                              :label="$t('핸드폰번호')"
                              readonly
                              top-label
                              width="190px"
                              margin="0"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VIO_EMP_ASGN"
                              :label="$t('소속조직')"
                              readonly
                              top-label
                              width="400px"
                            />
                            <i-input
                              v-model="grid2Datas.ASGN_NM"
                              :label="$t('위반조직')"
                              readonly
                              top-label
                              width="400px"
                              margin="0"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VEND_CD"
                              :label="$t('협력사')"
                              readonly
                              top-label
                              width="125px"
                              margin="5px"
                            />
                            <i-input
                              v-model="grid2Datas.VEND_NAME"
                              readonly
                              top-label
                              width="270px"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.IO_DIV_NM"
                              :label="$t('소속구분')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <i-input
                              v-model="grid2Datas.BIKE_REG_NO"
                              :label="$t('등록번호')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <i-input
                              v-model="grid2Datas.VIOCNT"
                              :label="$t('년누적위반')"
                              readonly
                              reverse
                              top-label
                              width="190px"
                              append-inner-icon="mdi-magnify"
                              @click:appendInner="openCnt"
                            />
                            <i-input
                              v-model="grid2Datas.CAR_NO"
                              :label="$t('차량번호')"
                              readonly
                              top-label
                              width="190px"
                              margin="0"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VEND_CD"
                              :label="$t('업체코드')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <v-checkbox
                              class="mt-5 mr-4"
                              label="등록번호 불일치"
                              v-model="grid2Datas.REG_NO_YN"
                              true-value="Y"
                              false-value="N"
                              disabled
                            />
                            <v-checkbox
                              class="mt-5"
                              label="등록증 미부착"
                              v-model="grid2Datas.REG_YN"
                              true-value="Y"
                              false-value="N"
                              disabled
                            />
                          </div>
                          <!-- 
                          <div class="d-flex panel--row">
                            <div>
                              <div style="font-size: 14px; color: #222222;">
                                차량구분
                              </div>
                              <div class="div-radio radio-car">
                                <v-radio-group v-model="grid2Datas.VIO_DIV" inline>
                                  <v-radio label="오토바이" value="A" />
                                  <v-radio label="차랑" value="C" />
                                  <v-radio label="자전거" value="B" />
                                  <v-radio label="보행자" value="D" />
                                  <v-radio label="기타" value="Z" />
                                </v-radio-group>
                              </div>
                            </div>
                          </div>
                          <div class="d-flex panel--row subtitle font-weight-bold">
                            {{ '<위반자정보>' }}
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VIOLATOR"
                              :label="$t('위반자성명')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <i-input
                              v-model="grid2Datas.VIO_EMP_NO"
                              :label="$t('위반자사번')"
                              readonly
                              top-label
                              width="190px"
                              margin="0"
                            />
                          </div>
                          <div v-if="showAsgn" class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VIO_EMP_ASGN"
                              :label="$t('소속조직')"
                              readonly
                              top-label
                              width="400px"
                              margin="0"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.ASGN_NM"
                              :label="$t('위반조직')"
                              readonly
                              top-label
                              width="400px"
                              margin="0"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VEND_CD"
                              :label="$t('협력사')"
                              readonly
                              top-label
                              width="125px"
                              margin="5px"
                            />
                            <i-input
                              v-model="grid2Datas.VEND_NAME"
                              readonly
                              top-label
                              width="270px"
                              margin="0"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.TEL_NO"
                              :label="$t('사내전화')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <i-input
                              v-model="grid2Datas.HP_NO"
                              :label="$t('핸드폰번호')"
                              readonly
                              top-label
                              width="190px"
                              margin="0"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.IO_DIV_NM"
                              :label="$t('소속구분')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <i-input
                              v-model="grid2Datas.BIKE_REG_NO"
                              :label="$t('등록번호')"
                              readonly
                              top-label
                              width="190px"
                              margin="0"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VIOCNT"
                              :label="$t('년누적위반')"
                              readonly
                              reverse
                              top-label
                              width="190px"
                            />
                            <i-input
                              v-model="grid2Datas.CAR_NO"
                              :label="$t('차량번호')"
                              readonly
                              top-label
                              width="190px"
                              margin="0"
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VEND_CD"
                              :label="$t('업체코드')"
                              readonly
                              top-label
                              width="190px"
                            />
                            <v-checkbox
                              class="mt-5 mr-4"
                              label="등록번호 불일치"
                              v-model="grid2Datas.REG_NO_YN"
                              true-value="Y"
                              false-value="N"
                              disabled
                            />
                            <v-checkbox
                              class="mt-5"
                              label="등록증 미부착"
                              v-model="grid2Datas.REG_YN"
                              true-value="Y"
                              false-value="N"
                              disabled
                            />
                          </div>
                           -->
                        </div>
                        <div class="d-flex flex-column pa-3 traffic-col">
                          <div class="d-flex panel--row subtitle2 font-weight-bold" style="margin-top: 3px;">
                            {{ '위반내역' }}
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VIO_TIME1"
                              :label="$t('위반일시')"
                              readonly
                              top-label
                              width="155px"
                              margin="5px"
                            />
                            <i-input
                              v-model="grid2Datas.VIO_TIME2"
                              readonly
                              top-label
                              width="80px"
                            />
                            <i-input
                              v-model="grid2Datas.CRADN_EMP_NM"
                              :label="$t('단속자')"
                              readonly
                              top-label
                              width="150px"
                            />
                            <v-checkbox
                              class="mt-5"
                              label="절대수칙위반"
                              v-model="grid2Datas.HVIO_YN"
                              true-value="Y"
                              false-value="N"
                              disabled
                            />
                          </div>
                          <div class="d-flex panel--row">
                            <div>
                              <div style="font-size: 14px; color: #222222;">
                                위반장소
                              </div>
                              <div class="d-flex">
                                <div class="div-radio radio-place1">
                                  <v-radio-group v-model="grid2Datas.VIO_LPLC" inline>
                                    <v-radio label="본공장" value="C" />
                                    <v-radio label="해양" value="Q" />
                                  </v-radio-group>
                                </div>
                                <div class="div-radio radio-place2">
                                  <v-radio-group v-model="grid2Datas.VIO_MPLC" inline>
                                    <v-radio label="출입문" value="A" />
                                    <v-radio label="교차로" value="B" />
                                    <v-radio label="도로" value="C" />
                                  </v-radio-group>
                                </div>
                                <i-input
                                  v-model="grid2Datas.VIO_SPLC_NM"
                                  readonly
                                  width="250px"
                                  margin="0"
                                />
                              </div>
                            </div>
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VIO_PLC_DESC"
                              :label="$t('위반장소상세')"
                              readonly
                              top-label
                              width="410px"
                            />
                            <v-btn
                              class="titleBtn mt-5"
                              @click="onButtonsClick({ id: 'btnFILE_ID1' })"
                            >
                              {{ t('위반사항 첨부보기') }}
                            </v-btn>
                          </div>
                          <div class="d-flex panel--row">
                            <i-input
                              v-model="grid2Datas.VIO_ITEM_NM"
                              :label="$t('위반항목')"
                              readonly
                              top-label
                              width="410px"
                            />
                            <i-input
                              v-model="grid2Datas.SPEED"
                              :label="$t('주행속도')"
                              readonly
                              reverse
                              top-label
                              width="65px"
                              margin="5px"
                            />
                            <div class="mt-8">
                              Km/h
                            </div>
                          </div>
                          <div class="d-flex panel--row">
                            <i-textarea
                              :label="$t('위반내용 상세')"
                              v-model="grid2Datas.VIO_DESC"
                              topLabel
                              :row="4"
                              width="665px"
                              readonly
                              margin="0"
                            />
                          </div>
                        </div>
                      </div>
                    </VExpansionPanelText>
                  </VExpansionPanel>
                </VExpansionPanels>
              </v-sheet>
            </div>
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>

    <IUploadPopup
      ref="iUploadPopup"
      :is-visibled="false"
      grid-title="첨부파일 관리"
      :button-list="['btnDownLoad', 'btnClose']"
    />

    <SafeRuleGbnPopup
      ref="selectGbn"
      @selected="selectedGbn"
    />

    <SAFDD0010Popup
      ref="refSAFDD0010Popup"
    />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 176px);
  // overflow-y: auto;
  > div {
    min-height: 700px;
  }

  .panel--row:not(:first-child) {
    margin-top: 8px;
  }

  .panel--row.subtitle {
    font-size: 16px;
    margin-top: 12px;
  }

  .panel--row.subtitle2 {
    font-size: 16px;
  }

  .div-radio {
    border: 1px solid #dddddd;
    border-radius: 4px;
    padding: 4px 8px;
  }

  .div-radio.radio-car {
    width: 400px;
  }

  .div-radio.radio-place1 {
    width: 155px;
    margin-right: 5px;
  }

  .div-radio.radio-place2 {
    width: 250px;
    margin-right: 5px;
  }

  .traffic-col {
    border: 1px solid #dddddd;
    border-radius: 4px;
  }
}
</style>
