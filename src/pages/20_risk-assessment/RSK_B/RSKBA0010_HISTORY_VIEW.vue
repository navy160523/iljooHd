<!--
  화면명 : RSKBA0010 / 작업표준 신규제정
  화면개요 : 
-->

<script setup>
import { ref, reactive, onMounted, onActivated, onBeforeUnmount, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExcelWrkDetailApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { useCommonStore } from '@hiway/stores/common'
import RSKBA0010popup1 from './RSKBA0010popup1.vue'
import RSKBA0010popup2 from './RSKBA0010popup2.vue'
import RSKBA0010popup3 from './RSKBA0010popup3.vue'
import RSKBA0010popup4 from './RSKBA0010popup4.vue'
import RSKBA0010popup5 from './RSKBA0010popup5.vue'
import RSKBA0010popup6 from './RSKBA0010popup6.vue'
import RSKCA0010       from '../RSK_C/RSKCA0010.vue'
import SAFAB0020       from '@/pages/30_safety/SAF_A/SAFAB0020.vue'
import SAFCA0010       from '@/pages/30_safety/SAF_C/SAFCA0010.vue'
import SAFEA0010       from '@/pages/30_safety/SAF_E/SAFEA0010.vue'
import SRMAA0030       from '@/pages/40_safety-risk/SRM_A/SRMAA0030.vue'
import {
  commonDownloadFilesApi,  
} from "@hiway/api/commonFileApi"
import draggable from 'vuedraggable'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import IUploadPopupEdu from "@/components/popup/IUploadPopup.vue"
import IUpload from '@/components/IUpload.vue'
import OZReport from '@/components/OZReport.vue'  // 리포트 팝업
import _ from 'lodash'
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js"
import { isEmpty } from "@/@core/utils"

const screenWidth = ref(window.innerWidth)

const handleResize = () => {
  screenWidth.value = window.innerWidth
}

defineOptions({
  name: '20_risk-assessment-RSK_B-RSKBA0010_HISTORY_VIEW',
})

const router = useRouter()
const commonStore = useCommonStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
// const $vuetify = vuetify.framework

const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const grdHistory = ref(null)
const rSKBA0010popup1 = ref(null) // 구분
const rSKBA0010popup2 = ref(null) // 위험요인
const rSKBA0010popup3 = ref(null) // 감소대책
const rSKBA0010popup4 = ref(null) // 사고정보
const rSKBA0010popup5 = ref(null) // 표준복사
const rSKBA0010popup6 = ref(null) // 회의이력(전체)
const rSKCA0010popup7 = ref(null) // 비일상작업
const rSAFEA0010 = ref(null) // 안전작업 요구권 등록/조회
const fileUploadPopup = ref(null) // 파일
const fileUploadEduPopup = ref(null) // 파일
const reportName = ref('/manage/hse/RSKBA0010.ozr') // 요약출력
const showOz = ref(false) // 요약출력
const showOzDetail = ref(false) // 요약출력
const params = ref([])
let partsArray = reactive([])
const ArrayList = ref([])
const sItem = ref(null)
const sItemLevel = ref(null)
const readonlyYn = ref(true)
const tab = ref('tab1')
let d = new Date()
let workType = ref(null)
let workId = ref(null)
const imgUrlTemp = ref([])
const logsStore = useLogsStore()  //2024.2.15 차동운 화면ID
let textReadOnly = reactive(true)
let  isRevision = ref(false) 
let  isAbolition = ref(false)  // 저장 시 사용(현황화면에서 받아오는 값)
let  isReviewer = ref(false)
let bRevision = ref(false)
let sagoInform = ref(false)
let srBtnDisabled = ref(true)
let isApproval = ref(false)
const dialog = ref(false)
const dialogSAFAB0020 = ref(false)
const dialogSAFCA0010 = ref(false)
const dialogSAFEA0010 = ref(false)
const dialogSRMAA0030 = ref(false)

const cmbTrans = ref([{TRANS_CD : 'ko', TRANS_NM : '한국어'}])

let WORK_STANDARD_MASTER = reactive({ 
  WORK_STANDARD_ID: '',
  WORK_STANDARD_ID_VIEW: '',
  WORK_ID:'',
  SAVE_TYPE: 'C',
  SAVE_STATUS: 'C',
  COMPANY_CD: userStore.cmpnyDiv, 
  CORP_ASGN_CD: userStore.corpAsgnCd, 
  CORP_ASGN_NM: userStore.corpAsgnNm,   
  BSNS_CD: userStore.bsnsCd,
  BSNS_CD_ORIGIN: '', // 실제 작업표준 작성한 부서의 사업부 세팅용
  USR_ID : userStore.userId,     
  DEPT_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,     
  DEPT_NM: userStore.deptNm, 
  USER_INFO:
    userStore.deptNm 
    +"/"+
    userStore.userName,
  GUBUN_NM: '',
  GUBUN_CD: '',
  WORK_STANDARD_NO: '',
  WORK_STANDARD_REVISION: '',
  WORK_STANDARD_NM: '',
  WORK_TOOLS: '',
  EQUIPMENT_TYPE: '',
  USE_CHEMICAL: '',
  REVIEWER: '',
  // PROGRESS_STATUS: 'CP_AW',
  PROGRESS_STATUS: 'CC_AC',
  WORK_STANDARD_KIND: 'C',
  RISK_TYPE: '',
  RISK_TYPE_NM: '',
  C_DATE: dayjs().format('YYYY-MM-DD'),
  U_DATE: '',
  // WORK_DATE: toDayDateTime(),
  WORK_STANDARD_DESC: '',
  APPR_DT: '',
  IS_SAVE: '',
  WORK_STANDARD_RISK_COUNT: 0,
  WORK_STANDARD_RISK_OVER_COUNT: '0건',
  WORK_STANDARD_AVG_RISK: 0,
  SRSRM_ALL: 0,
  SRSRM_COMPLETE: 0,
  RATE: 0,
  A_SAGO_COUNT: '',
  B_SAGO_COUNT: '',
  C_SAGO_COUNT: '',
  D_SAGO_COUNT: '',
  TRANS_CD: 'ko',
  CHK_REQUIRED : '',
  USER_DIV : '',
  MANAGER_CD: '',  // 담당자(생산팀장)
  PRODUCTION_MANAGER : '',
  POSITION_MANAGER : '',
  PRODUCTION_MANAGER_NM: '',
  PM_CD: '',       // 직책과장
  POSITION_MANAGER_NM: '', 
  EDU_FILE_ID: '',
  EDU_FILE_COUNT: '', 
})

let WORK_STANDARD_UNIT = reactive([])
let WORK_STANDARD_ACT = reactive([])
let WORK_STANDARD_RISK = reactive([])

const tree = ref([])
// 현재의 위험성
const befor1 = ref(false); 
const befor2 = ref(false); 
const befor3 = ref(false); 
const befor4 = ref(false); 

//개선 후 위험성
const after1 = ref(false); 
const after2 = ref(false); 
const after3 = ref(false); 
const after4 = ref(false); 

//재해발생현황
const SAGO = reactive({
  SAN_CNT : 0,
  HUE_CNT : 0,
  IL_CNT : 0,
  COME_SERIOUS_CNT : 0
})

const rptList = reactive({
  unitList: [],
  actList: [],
  riskList: [],
})


//조회조건
let searchParams = reactive({  
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,   
  DEPT_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  userId: userStore.userId,
})

//코드리스트 선언
const codeList = reactive({
  company: [],  
  riskType: [],
  USER_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '사내협력사' },
    { COD: 'D', TXT: '단기공사' },
    { COD: 'Z', TXT: '기타' },
  ],
  proc: [],
  gubun: [],
  BEFOR_TYPE: [
    { COD: 1, TXT: '1(최하)' },
    { COD: 2, TXT: '2(하)' },
    { COD: 3, TXT: '3(중)' },
    { COD: 4, TXT: '4(상)' },
    { COD: 5, TXT: '5(최상)' },
  ],
  BEFOR_TYPE2: [
    { COD: '', TXT: '' },
    { COD: 1, TXT: '1(최하)' },
    { COD: 2, TXT: '2(하)' },
    { COD: 3, TXT: '3(중)' },
    { COD: 4, TXT: '4(상)' },
    { COD: 5, TXT: '5(최상)' },
  ],
  committee: { 
    COMMITTEE_OPS: '',
    COMMITTEE_DEPT: '',
    COMMITTEE_ASSOC: '',
  },
  TRANS: [
    { TRANS_CD: 'ko', TRANS_NM: '한국어' }
  ],
  REQUIRED: {
    CHK1: '',
    CHK2: '',
    CHK3: '',
  }
})

//코드리스트 셋팅
const initCodeList = () => {
  
  Promise.all([    
    // PKG_RSKBA0010.COMMON_CODE_COMBO_S
    commonSearchApi({ queryId : 'RSKBA0010_SEARCH_02', param : { TYPE: 'DETAIL', COMM_CD: 'RISK_TYPE' } }), // 평가유형
  ]).then(res => { 
    //console.log('코드 가져오는데?', res[0].ORESULT_CUR)
    codeList.riskType = res[0].ORESULT_CUR   
  })
}


let arrExpand = []

const grdSub_onCellClicked = (grid, clickData) => {
  //console.log('grid', grid)
  //console.log('clickData', clickData)

  if(clickData.fieldName == 'KOR_NM') { 

    if(arrExpand[clickData.itemIndex] == null) {
      arrExpand[clickData.itemIndex] = 'expand'
      grdSub.value.getGridView().expand(clickData.itemIndex)
    }
    else {
      arrExpand[clickData.itemIndex] = null
      grdSub.value.getGridView().collapse(clickData.itemIndex)
    }
  }
}

// 메뉴버튼
const onButtonsClick = async btn => {
  
  if (btn.id === 'btnSearch') {  // 조회          
    search(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
    searchUnit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
  }
  else if (btn.id === 'btnSimplePrint') {  // 요약출력    
    
    //console.log('요약출력 : ', WORK_STANDARD_MASTER)

    if (isEmpty(WORK_STANDARD_MASTER.WORK_STANDARD_ID)) {
      return Message.warn(t('출력할 데이터가 없습니다.'))
    }

    commonExcelWrkDetailApi({ 
      mappingName: 'work_detail',
      IN_EXCEL_TYPE: 'SIMPLE',

      IN_TRANS: WORK_STANDARD_MASTER.TRANS_CD,
      IN_WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      IN_USER_DIV: WORK_STANDARD_MASTER.USER_DIV === 'A'?'A':'B',
      // IN_TRANS: WORK_STANDARD_MASTER.IN_TRANS,
    }).then(res => {

      //console.log('res : ', res)

      const fileURL = URL.createObjectURL(
        new Blob([res], {
          type: 'application/octet-stream',
        }),
      )

      let title =
        '[위험성평가]' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NM +
        '(' +
        WORK_STANDARD_MASTER.DEPT_NM +
        ')_' +
        d.getFullYear() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d
          .getDate()
          .toString()
          .padStart(2, '0') +
        '_' +
        '요약본'

      var fileLink = document.createElement('a')
      //console.log('fileLink : ', fileLink)  

      fileLink.href = fileURL
      fileLink.setAttribute('download', title + '.xlsx')
      document.body.appendChild(fileLink)
      fileLink.click()
    })
  }
  else if (btn.id === 'btnDetailPrint') {  // 상세출력        

    if (isEmpty(WORK_STANDARD_MASTER.WORK_STANDARD_ID)) {
      return Message.warn(t('출력할 데이터가 없습니다.'))
    }

    commonExcelWrkDetailApi({ 
      mappingName: 'work_detail',
      IN_EXCEL_TYPE: 'STD',

      IN_TRANS: WORK_STANDARD_MASTER.TRANS_CD,
      IN_WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
      IN_USER_DIV: WORK_STANDARD_MASTER.USER_DIV === 'A'?'A':'B',
      // IN_TRANS: WORK_STANDARD_MASTER.IN_TRANS,
    }).then(res => {

      //console.log('res : ', res)

      const fileURL = URL.createObjectURL(
        new Blob([res], {
          type: 'application/octet-stream',
        }),
      )

      let title =
        '[위험성평가]' +
        WORK_STANDARD_MASTER.WORK_STANDARD_NM +
        '(' +
        WORK_STANDARD_MASTER.DEPT_NM +
        ')_' +
        d.getFullYear() +
        (d.getMonth() + 1).toString().padStart(2, '0') +
        d
          .getDate()
          .toString()
          .padStart(2, '0') +
        '_' +
        '상세본'

      var fileLink = document.createElement('a')

      fileLink.href = fileURL
      fileLink.setAttribute('download', title + '.xlsx')
      document.body.appendChild(fileLink) 
      fileLink.click()
    })
  }
  
}


const openPopup2 = (gbn, id) => {    
  
  if (gbn === '사고정보') {
    rSKBA0010popup4.value.openPopup()    
  }
  else if(gbn === '사고') {
    dialogSAFAB0020.value = true
    isApproval.value = true
  }
  else if(gbn === '현장위험성평가') {
    
    dialogSAFCA0010.value = true
    isApproval.value = true
  }
  else if(gbn === '안전작업요구권') {
    dialogSAFEA0010.value = true
    isApproval.value = true
    //rSAFEA0010.value.openPopup()
  }
  else if(gbn === '안전리스크') {
    //console.log('WORK_STANDARD_MASTER', WORK_STANDARD_MASTER)
    dialogSRMAA0030.value = true
    isApproval.value = true
  }
  else if (gbn === '표준복사') {
    rSKBA0010popup5.value.openPopup()    
  }
  else if (gbn === '회의이력') {
    rSKBA0010popup6.value.openPopup()    
  }
  else if (gbn === '비일상작업') {    
    dialog.value = true
  }else if (gbn === 'addFile') {
    
    console.log('AAAAAAAA')
    console.log('sItemlevel = ', sItemLevel.value)

    if(sItemLevel.value == null)
    {
      Message.err(t("선택된 행이 없습니다."))
      
      return
    }
    
    if(sItemLevel.value != '2')
    {
      Message.err(t("파일 확인할 [작업행동]을 선택해주세요."))
      
      return
    }

    console.log('WORK_STANDARD_ACT = ', WORK_STANDARD_ACT)

    let dd = WORK_STANDARD_ACT.find(x => x.id == sItem)

    fileSave()    
  }
  
}

// 위험성평가위원회 조회
const committeeSearch = async () => {
  // todo : 위원회
  const params = {    
    CMPNY_DIV: WORK_STANDARD_MASTER.COMPANY_CD,
    BSNS_CD : WORK_STANDARD_MASTER.BSNS_CD,
    //BSNS_CD를 로그인자 BSNSCD를 가져와서 작업표준 제정 팝업 시 휘험성평가 위원회가 조회가 되지않아서 변경
    BSNS_CD : WORK_STANDARD_MASTER.BSNS_CD_ORIGIN,
    //BSNS_CD: 'AE00',
    DEPT_CD: WORK_STANDARD_MASTER.DEPT_CD,
    //WORK_STANDARD_NO: 'HHIS-CW-C710-088-01',
  }
  //console.log('위원회 조회 파라미터 = ', params)
  // PKG_RSKBA0010.GET_WORK_COMMITTEE_S
  await commonSearchApi({ queryId: "RSKBA0010_SEARCH_23", param: params  }).then( res => {          
    let data = res.ORESULT_CUR[0]

    if(data == null)
      return
    
    codeList.committee.COMMITTEE_OPS   = data.OPS_COMMITTEE_NM + " " +
                                         data.OPS_COMMITTEE_PO + " (" +
                                         data.OPS_COMMITTEE + ")"
    codeList.committee.COMMITTEE_DEPT  = data.EXEC_COMMITTEE_DEPT_EMP_NM + " " +
                                         data.EXEC_COMMITTEE_DEPT_POSI + " (" +
                                         data.EXEC_COMMITTEE_DEPT + ")"
    codeList.committee.COMMITTEE_ASSOC = data.EXEC_COMMITTEE_ASSOC_EMP_NM + " " +
                                         data.EXEC_COMMITTEE_ASSOC_POSI + " (" +
                                         data.EXEC_COMMITTEE_ASSOC + ")"

    
  })

}


// 작업표준서 개정이력 조회
const revisionHistory = async () => {
  //PKG_RSKBA0010.REVISION_HISTORY_S
  await commonSearchApi({ queryId: "RSKBA0010_SEARCH_24", param: { WORK_STANDARD_NO : WORK_STANDARD_MASTER.WORK_STANDARD_NO }  }).then( res => {    
    
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    
  })

}

const transInit = async id => {  
  
  cmbTrans.value = []

  let ko = cmbTrans.value.find(x => x.TRANS_CD == 'ko')
  
  if(ko == undefined)
    cmbTrans.value.push({ TRANS_CD: 'ko', TRANS_NM: '한국어' })

  // 언어 목록 조회
  await commonSearchApi({ queryId : 'RSKBA0010_SEARCH_32', param: { WORK_STANDARD_ID : id }}).then(res => {

    res.ORESULT_CUR.forEach(el => {
      if (el.EN_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'en', TRANS_NM: '영어' })
      }

      if (el.VI_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'vi', TRANS_NM: '베트남어' })
      }

      if (el.UZ_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'uz', TRANS_NM: '우즈베크어' })
      }

      if (el.MN_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'mn', TRANS_NM: '몽골어' })
      }

      if (el.SI_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'si', TRANS_NM: '신할라어' })
      }

      if (el.TH_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'th', TRANS_NM: '태국어' })
      }

      if (el.RU_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ru', TRANS_NM: '러시아어' })
      }

      if (el.JA_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ja', TRANS_NM: '일본어' })
      }

      if (el.ZH_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'zh', TRANS_NM: '중국어간체' })
      }

      if (el.ZH_TW_TRANS === 'Y') {
        cmbTrans.value.push({
          TRANS_CD: 'zh-TW',
          TRANS_NM: '중국어번체'
        })
      }

      if (el.DE_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'de', TRANS_NM: '독일어' })
      }

      if (el.FR_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'fr', TRANS_NM: '프랑스어' })
      }

      if (el.AR_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ar', TRANS_NM: '아랍어' })
      }

      if (el.ID_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'id', TRANS_NM: '인도네시아어' })
      }

      if (el.NE_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ne', TRANS_NM: '네팔어' })
      }

      if (el.BN_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'bn', TRANS_NM: '벵골어' })
      }

      if (el.FIL_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'fil', TRANS_NM: '필리핀어' })
      }

      if (el.HI_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'hi', TRANS_NM: '힌디어' })
      }

      if (el.KK_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'kk', TRANS_NM: '카자흐어' })
      }

      if (el.KM_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'km', TRANS_NM: '크메르어' })
      }

      if (el.KY_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ky', TRANS_NM: '키르기스어' })
      }

      if (el.MY_TRANS === 'Y') {
        cmbTrans.value.push({
          TRANS_CD: 'my',
          TRANS_NM: '미얀마(버마)어'
        })
      }

      if (el.TR_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'tr', TRANS_NM: '터키어' })
      }

      if (el.TK_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'tk', TRANS_NM: '투르크멘어' })
      }

      if (el.UK_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'uk', TRANS_NM: '우크라이나어' })
      }

      if (el.UR_TRANS === 'Y') {
        cmbTrans.value.push({ TRANS_CD: 'ur', TRANS_NM: '우르드어' })
      }
    })
  })
}



watch( () => WORK_STANDARD_MASTER.WORK_STANDARD_ID, (oldValue, newValue) => {
  //console.log('work_standard_id = ', newValue)
  
  if(WORK_STANDARD_MASTER.WORK_STANDARD_ID == '')
    srBtnDisabled.value = true
  else
    srBtnDisabled.value = false
    

  //console.log('srbtn = ', srBtnDisabled)
})

// 표준서 정보 조회
const search = async id => {
 
  if (id !== '' && id !== undefined) {
    //console.log('개정으로 넘어왔을 때, search() id = ', id)
    // PKG_RSKBA0010.WORK_STANDARD_MASTER_S
    console.log('id = ', id)

    await commonSearchApi({ queryId: "RSKBA0010_SEARCH_04", param: { WORK_STANDARD_ID : id, TRANS : WORK_STANDARD_MASTER.TRANS_CD }  }).then( async res => {    
      
      let data = res.ORESULT_CUR[0]
      console.log('data:', data)
      if(data != null)
      {
        // 재해 발생 현황 조회조건
        let params_31 = {
          CMPNY_DIV : data.CMPNY_DIV,
          BSNS_CD   : data.BSNS_CD,
          DEPT_CD   : data.DEPT_CD
        }
      
        // 실제 작업표준 작성한 부서의 사업부 세팅용
        WORK_STANDARD_MASTER.BSNS_CD_ORIGIN = data.BSNS_CD

        // 재해 발생 현황
        await commonSearchApi({ queryId: "RSKBA0010_SEARCH_31", param: params_31  }).then( async res2 => {
          let data2 = res2.ORESULT_CUR[0]
      
          SAGO.SAN_CNT = data2.SAN_CNT
          SAGO.HUE_CNT = data2.HUE_CNT
          SAGO.IL_CNT = data2.IL_CNT
          SAGO.COME_SERIOUS_CNT = data2.COME_SERIOUS_CNT
        })
      }
      
      WORK_STANDARD_MASTER.WORK_STANDARD_ID = data.WORK_STANDARD_ID
      WORK_STANDARD_MASTER.WORK_STANDARD_ID_VIEW = isRevision.value ? '' : data.WORK_STANDARD_ID
      WORK_STANDARD_MASTER.SAVE_TYPE = isRevision.value ? 'U' : 'C'
      WORK_STANDARD_MASTER.SAVE_STATUS = isRevision.value ? 'C' : 'U'
      WORK_STANDARD_MASTER.COMPANY_CD = data.COMPANY_CD
      WORK_STANDARD_MASTER.DEPT_CD = data.DEPT_CD
      WORK_STANDARD_MASTER.DEPT_NM = data.DEPT_NM
      WORK_STANDARD_MASTER.CORP_ASGN_CD = data.CORP_ASGN_CD
      WORK_STANDARD_MASTER.CORP_ASGN_NM = data.CORP_ASGN_NM
      WORK_STANDARD_MASTER.GUBUN_NM = data.GUBUN_NM
      WORK_STANDARD_MASTER.GUBUN_CD = data.GUBUN_CD
      WORK_STANDARD_MASTER.WORK_STANDARD_NO = data.WORK_STANDARD_NO      
      WORK_STANDARD_MASTER.WORK_STANDARD_REVISION = data.WORK_STANDARD_REVISION
      WORK_STANDARD_MASTER.WORK_STANDARD_NM = WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? data.WORK_STANDARD_NM : data.TRANS_WORK_STANDARD_NM
      WORK_STANDARD_MASTER.PRODUCTION_MANAGER = data.PRODUCTION_MANAGER
      WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM = data.PRODUCTION_MANAGER_NM
      WORK_STANDARD_MASTER.POSITION_MANAGER = data.POSITION_MANAGER
      WORK_STANDARD_MASTER.POSITION_MANAGER_NM = data.POSITION_MANAGER_NM

      WORK_STANDARD_MASTER.WORK_TOOLS = data.WORK_TOOLS
      WORK_STANDARD_MASTER.EQUIPMENT_TYPE = data.EQUIPMENT_TYPE
      WORK_STANDARD_MASTER.USE_CHEMICAL = data.USE_CHEMICAL
      WORK_STANDARD_MASTER.REVIEWER = data.REVIEWER
      WORK_STANDARD_MASTER.CHK_REQUIRED = data.CHK_REQUIRED
      WORK_STANDARD_MASTER.USER_DIV     = data.USER_DIV
      WORK_STANDARD_MASTER.PROGRESS_STATUS = isRevision.value ? 'UP_AW' : data.PROGRESS_STATUS
      WORK_STANDARD_MASTER.WORK_STANDARD_KIND = isRevision.value ? 'U' : data.WORK_STANDARD_KIND
      WORK_STANDARD_MASTER.RISK_TYPE = isRevision.value ? '' : data.RISK_TYPE
      WORK_STANDARD_MASTER.RISK_TYPE_NM = isRevision.value ? '' : data.RISK_TYPE_NM    
      WORK_STANDARD_MASTER.C_DATE = data.C_DATE
      WORK_STANDARD_MASTER.U_DATE = isRevision.value ? dayjs().format('YYYY-MM-DD') : data.U_DATE
      WORK_STANDARD_MASTER.APPROVAL_DATE = data.APPROVAL_DATE
      if (data.U_DATE === null && data.C_DATE === null) {
        WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
      }
      else {
        if (['CC_AC', 'UC_AC'].includes(data.PROGRESS_STATUS)) {
          
          WORK_STANDARD_MASTER.WORK_DATE = data.U_DATE === null ? data.C_DATE : data.U_DATE
          
          if (isRevision.value) {
            WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
          }
        } else {
          if (isRevision.value) {
            WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
          } else {
            WORK_STANDARD_MASTER.WORK_DATE = data.U_DATE
          }
        }
      }
      
      WORK_STANDARD_MASTER.APPR_DT = isRevision.value ? '' : data.APPR_DT
      WORK_STANDARD_MASTER.WORK_STANDARD_RISK_COUNT = data.WORK_STANDARD_RISK_COUNT
      WORK_STANDARD_MASTER.WORK_STANDARD_RISK_OVER_COUNT = data.WORK_STANDARD_RISK_OVER_COUNT + '건'
      WORK_STANDARD_MASTER.WORK_STANDARD_AVG_RISK = data.WORK_STANDARD_AVG_RISK
      WORK_STANDARD_MASTER.SRSRM_ALL = data.SRSRM_ALL
      WORK_STANDARD_MASTER.SRSRM_COMPLETE = data.SRSRM_COMPLETE
      WORK_STANDARD_MASTER.RATE = data.RATE

      WORK_STANDARD_MASTER.WORK_STANDARD_DESC = isRevision.value || isAbolition.value ? '' : data.WORK_STANDARD_DESC
      WORK_STANDARD_MASTER.USER_INFO = data.USER_INFO      
      WORK_STANDARD_MASTER.IS_SAVE = isRevision.value ? '' : data.IS_SAVE
      WORK_STANDARD_MASTER.EDU_FILE_ID = data.EDU_FILE_ID
      WORK_STANDARD_MASTER.EDU_FILE_COUNT = data.EDU_FILE_COUNT

      
      if (['CC_AC', 'UC_AC'].includes(data.PROGRESS_STATUS)) {        
        if (data.DEPT_CD === searchParams.DEPT_CD) {
          
          //console.log('isRevision = ', irRevision.value)
          if (!isRevision.value) {
            await getCheckRevision()
          }
        }
      }
      
      // 직영/협력사 여부로 직영부서 담당자 검토자 보여주기
      showReviewer()
    })
  }
  else {
    Message.warn('데이터가 없습니다.')
    
  }
 
}


// 상세리포트 조회
const searchReportList = async () => { 
  // todo: 상세리포트 조회
  //임시 하드코딩
  //WORK_STANDARD_MASTER.WORK_STANDARD_ID = 'HHIS-CW-A0000032-031-01'
  await commonSearchApi({ queryId: "RSKBA0010_SEARCH_08", param: { WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID } }).then(async res => {
    
    rptList.unitList.param = ''
    rptList.actList.param = ''
    rptList.riskList.param = ''
    
    await bindUnitList(res.ORESULT_CUR)
    await bindActList(res.ORESULT_CUR)
    await bindRiskList(res.ORESULT_CUR)
  
  })  
}

const searchReportTree = () => { 
  // todo: 레포트
  // 임시 하드코딩
  //WORK_STANDARD_MASTER.WORK_STANDARD_ID = 'HHIS-CW-A0000032-031-01'

  return commonSearchApi({ queryId : 'RSKBA0010_SEARCH_09', param : { WORK_STANDARD_ID : WORK_STANDARD_MASTER.WORK_STANDARD_ID } })
  
}

// 위험성평가 회의이력 조회
const meetingSearch = () =>{

  let date = new Date()

  // 연도
  let year = date.getFullYear()
  // 1 : 상반기, 2 : 하반기
  let half = (date.getMonth() +1) < 7 ? 1 : 2
  // 부서코드
  let dept = userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd;
  // 작업표준ID
  let wsid = WORK_STANDARD_MASTER.WORK_STANDARD_ID

  console.log('year = ', year)
  console.log('half = ', half)
  console.log('dept = ', dept)
  console.log('wsid = ', wsid)
  const params = {
    YEAR: year,
    HALF: half,
    DEPT_CD: dept,
    WORK_STANDARD_ID: wsid,
  }

  //PKG_RSKBA0010.WORK_STANDARD_HISTORY_S
  return commonSearchApi({ queryId : 'RSKBA0010_SEARCH_21', param: params })  
}



// 조회로직
const afterSearchTree = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR, 'CHLD_ID')
 
}

const afterSearch2 = res => {
  grdHistory.value.getDataProvider().setRows(res.ORESULT_CUR)
}


const replaceText = (type, data) => { 
  if (type === 'rm') {
    return '[감소대책] ' + data.replaceAll('\n', '<br />')
  } else if (type === 'chk') {    

    if(data !== '[NULL]'){
      return '[체크정보] ' + data.replaceAll('\n', '<br />')
    }    

  }  
}


const bindUnitList = async (data) =>{  
  rptList.unitList = data.filter(x => x.GUBUN === 'UNIT')
}

//
const bindActList = async (data) =>{  
    
  let actlist = data.filter(x => x.GUBUN === 'ACT')
  rptList.actList = actlist
  imgUrlTemp.value = [] 

  let cmpnyDiv = userStore.cmpnyDiv
  let wsid = WORK_STANDARD_MASTER.WORK_STANDARD_ID

  // commonSearchApi({ queryId: "RSKBA0010_SEARCH_11", param: { COMPANY_CD:'HHI', WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID } }).then(async res => {      
  await commonSearchApi({ queryId: "RSKBA0010_SEARCH_10", param: { COMPANY_CD: cmpnyDiv, WORK_STANDARD_ID: wsid } })
  .then(async res => {
    
    let j = 0
    //console.log('res = ', res.ORESULT_CUR)

    let imgList = res.ORESULT_CUR.filter(x => ['jpg', 'JPG', 'png', 'PNG', 'jpeg', 'JPEG'].includes(x.FILE_TYPE)) 
        
    console.log('actlist', actlist)
    console.log('imgList', imgList)
    
    for(let img of imgList) {
      
      await commonDownloadFilesApi(img).then((res)=>{

        const blob = new Blob([res])
        const imageURL = URL.createObjectURL(blob)
        
        //console.log('imageURL = ', imageURL)
        //console.log('imgList[j].FILE_TITLE = ', imgList[j].FILE_TITLE)

        imgUrlTemp.value.push({
          src : imageURL,   // 이미지 URL 설정
          TITLE : imgList[j].FILE_TITLE,
          FILE_ID : imgList[j].FILE_ID,
        })

        //console.log('imgUrlTemp = ', imgUrlTemp.value)
        j++
        
      })
    }      

  })  
  
  // console.log('rptList.actList', rptList.actList)
}


const bindRiskList = async (data) =>{  
  rptList.riskList = data.filter(x => x.GUBUN === 'RISK')
}
const OnSelectedGubun = row =>{  
  if(row){
    WORK_STANDARD_MASTER.GUBUN_CD = row.COMMID
    WORK_STANDARD_MASTER.GUBUN_NM = row.NAMEPATH 
  }
}

const OnSelectedCopy = row =>{  
  if(row){
    WORK_STANDARD_MASTER.GUBUN_CD = row.COMMID
    WORK_STANDARD_MASTER.GUBUN_NM = row.NAMEPATH  
  }
}

const OnSelectedSago = row =>{  
  if(row){
    WORK_STANDARD_MASTER.GUBUN_CD = row.COMMID
    WORK_STANDARD_MASTER.GUBUN_NM = row.NAMEPATH  
  }
}

// 비일상작업 적용 시
const OnSelectedSusi = row =>{  
  
  if(row){

    dialog.value = false
    //console.log('susi row : ', row)
    let isUnitId = []
    let isActId = []

    row.forEach(item => {
      // 단위작업 생성 
      let unitMaxId = ((ArrayList.value.reduce((max, obj) => Math.max(max, obj['id']), 0))+1).toString()    
      let unitMaxIdx = ArrayList.value.reduce((max, obj) => Math.max(max, obj['idx']), 0)

      for (let el of ArrayList.value) {
        isUnitId.push(el.UNIT_ID.slice(-3))
      }
      let autoUnitId = isUnitId.length === 0 ? '001' : (Math.max(...isUnitId) + 1).toString().padStart(3, '0')
      let NEW_UNIT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-U' + autoUnitId
      
      ArrayList.value.push({ level: 1, id: unitMaxId, idx : (unitMaxIdx + 1), text: '' + unitMaxId, child: [],
        UNIT_ID: NEW_UNIT_ID,
        UNIT_ACT_ID: '-U' + autoUnitId, 
        WORK_STANDARD_ID : WORK_STANDARD_MASTER.WORK_STANDARD_ID,      
        DATA_STATUS: 'N',
        STATUS: 'C',
        IS_CHECK: 'N',
        IS_SAVE: 'N',
        IS_SELECT: false,
        IS_SUCCESS: '',
        UNIT_NM: item.UNIT_NM,
        NROUTINE_WORK_ID: item.NROUTINE_WORK_ID,
      })    

      // 작업행동 생성
      tempA = _.find(ArrayList.value, { UNIT_ID: NEW_UNIT_ID })     
      let actMaxId = tempA.child.reduce((max, obj) => Math.max(max, obj['id'].split('_')[1]), 0)
      let actMaxIdx = tempA.child.reduce((max, obj) => Math.max(max, obj['idx']), 0)      
      let actNewId = tempA.id + '_' + (actMaxId + 1)
      let lastDashIndex = tempA.UNIT_ID.lastIndexOf('-')
      let unitActId = '-' +  tempA.UNIT_ID.substring(lastDashIndex + 1)


      for (let el of tempA.child) {
        isActId.push(el.ACT_ID.slice(-3))
      }
      
      let autoActId = isActId.length === 0 ? '001' : (Math.max(...isActId) + 1).toString().padStart(3, '0')
      let NEW_ACT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + unitActId + '-A' + autoActId  
      // let NEW_ACT_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-A' + d.getTime()    
      tempA.child.push( { level: 2, id : actNewId, pid : tempA.id, idx : (actMaxIdx + 1), text: '' + actMaxId, child: [], 
        ACT_ID: NEW_ACT_ID,
        WORK_STANDARD_ID : WORK_STANDARD_MASTER.WORK_STANDARD_ID,      
        // WORK_STANDARD_ID : 'HHIS-CW-G2P0-001-01',
        UNIT_ID: NEW_UNIT_ID,
        DATA_STATUS: 'N',
        STATUS: 'C',
        IS_SELECT: false,
        IS_CHECK: 'N',
        IS_SAVE: 'N',
        IS_SUCCESS: '',
        ACT_NM: '',
        CHK_NM: '',
      })
   
      if (item.child) {
        let A = _.find(ArrayList.value, { UNIT_ID : NEW_UNIT_ID })

        console.log('A ====== ', A)

        tempB = _.find(A.child, { ACT_ID : NEW_ACT_ID })
        item.child.forEach(childItem => {
          let riskMaxId = tempB.child.reduce((max, obj) => Math.max(max, obj['id'].substr(obj['id'].indexOf('_')+1)), 1)
          let riskMaxIdx = tempB.child.reduce((max, obj) => Math.max(max, obj['idx']), 1)
          let riskNewId = tempB.id + '_' + (riskMaxId + 1)
          let NEW_RISK_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-R' + d.getTime()
          // let NEW_RISK_ID = WORK_STANDARD_MASTER.WORK_STANDARD_ID + '-R' + d.getTime()

          tempB.child.push( { level: 3, id : riskNewId, pid : tempB.id, idx : (riskMaxIdx + 1), text: '' + riskMaxId,
            RISK_ID: NEW_RISK_ID,
            WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
            // WORK_STANDARD_ID: 'HHIS-CW-G2P0-001-01',
            UNIT_ID: NEW_UNIT_ID,
            ACT_ID: NEW_ACT_ID,
            DATA_STATUS: 'N',
            STATUS: 'C',
            IS_SELECT: false,
            IS_CHECK: 'N',
            IS_SAVE: 'N',
            IS_SUCCESS: '',
            BEFOR_FRE: '', 
            BEFOR_MAT: '', 
            BEFOR_TOTAL: '',
            AFTER_FRE: '', 
            AFTER_MAT: '', 
            AFTER_TOTAL: '',
            RISK_CD_P_NM: '', 
            RISK_CD_D_NM: '', 
            RISK_NM: childItem.RISK_NM, 
            RM_CD_P_NM: '', 
            RM_CD_D_NM: '', 
            RM_NM: childItem.RM_NM, 
          })

        })
      }

    })
    // 작업행동
    //console.log("ArrayList.value unit & act : ", ArrayList.value)    
  }
  
}

const getCheckRevision =  () => {  
  
  // GET_CHECK_REVISION
  commonSearchApi({ queryId: "RSKBA0010_SEARCH_01", param : { WORK_STANDARD_NO: WORK_STANDARD_MASTER.WORK_STANDARD_NO }  }).then( res => {   
    
    if(res.ORESULT_CUR[0].WORK_STANDARD_REVISION > parseInt(WORK_STANDARD_MASTER.WORK_STANDARD_REVISION) ){
      
      
      bRevision.value = true
      //console.log('bRevision = true')
    }
    else {
      
      bRevision.value = false
      //console.log('bRevision = false')
    }
  })
}


//그리드 속성셋팅(tab1-Main)
const grdMainProps = reactive({
  gridViewOption : { 
    checkBar: { visible: false },
    stateBar: { visible: false },
    rowIndicator: { visible: false },
    edit: { editable:false },     
  },

  keys : ['WORK_STANDARD_NO'],
  fields : [ 
    { fieldName: 'WORK_STANDARD_REVISION', dataType: 'text', width: '30', header: { text:'개정번호' } },
    { fieldName: 'INS_DT',                 dataType: 'text', width: '50', header: { text:'제/개정일자' } },
    { fieldName: 'WORK_STANDARD_DESC',     dataType: 'text', width: '70', header: { text:'제/개정사유' } },
    { fieldName: 'USER_NM',                dataType: 'text', width: '70', header: { text:'작성자' } },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 상세리포트 그리드
const grdSubProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false }, 
    header: { visible: false },
    footer: { visible: false }, 
    rowIndicator: { visible: false } },
  keys : ['CHLD_ID'],
  field : [
    { fieldName: 'CHLD_ID', dataType: 'text', visible: false },
    { fieldName: 'PRNT_ID', dataType: 'text', visible: false },
    { fieldName: 'GUBUN', dataType: 'text', visible: false },
    { fieldName: 'KOR_NM', dataType: 'text', style: { fontSize: '20px' } },
  ],
  columns : [],
})

grdSubProps.columns = grdSubProps.field


//그리드 속성셋팅(History)
const grdHistoryProps = reactive({
  gridViewOption : { checkBar: { visible: false }, rowIndicator: { visible: false } },

  keys : ['WORK_STANDARD_NM'],
  fields : [ 
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', header: { text:'주요 작업 표준' }, width: '80', editable : false },
    { fieldName: 'LO_RESULT',        dataType: 'text', header: { text:'검토결과' }, width: '200', editable : false  },
    { fieldName: 'MEETING_DATE',     dataType: 'text', header: { text:'회의일시' }, width:'70', editable : false },
    { fieldName: 'MEMBERS',          dataType: 'text', header: { text:'회의참석자' }, editable : false },
    
  ],
  columns: [],
})

// 그리드 세팅
grdHistoryProps.columns = grdHistoryProps.fields

// 위험요인
const OnSelectedFactors = row =>{  
  if(row){
    //console.log('row = ', row)
    const A = partsArray[0]
    const B = partsArray[1] 
    const C = partsArray[2] 
    
    let t1 = _.find(ArrayList.value, { id : A})    
    let t2 = _.find(t1.child, { id : A + '_' + B})
    let t3 = _.find(t2.child, { id : A + '_' + B + '_' + C})

    t3.RISK_CD_P_NM = row.PARENT_ID == 'RISK_CD-01' ? '사고' : '비사고'
    t3.RISK_CD_D_NM = row.SYS_CDNM
    t3.RISK_CD = row.CODE_ID

    //console.log('risk cd : ', ArrayList.value[A-1].child[B-1].child[C-2].RISK_CD)
  }
}

// 감소대책
const OnSelectedReduction = row =>{  
  if(row){

    const A = partsArray[0]
    const B = partsArray[1] 
    const C = partsArray[2]
    
    let t1 = _.find(ArrayList.value, { id : A})    
    let t2 = _.find(t1.child, { id : A + '_' + B})
    let t3 = _.find(t2.child, { id : A + '_' + B + '_' + C})

    t3.RM_CD_P_NM = row.PARENT_CODE_NM
    t3.RM_CD_D_NM = row.CODE_NM
    t3.RM_CD = row.CODE_ID

    
  }
}



const dataStatusStyle = (tp, data) => {  
  if (tp === 'unit') {
    if (data.DATA_STATUS === 'C' || data.DATA_STATUS === 'I') {
      return 'text_underline'
    } else {
      return 'text_none'
    }
  } else if (tp === 'act') {
    if (data.DATA_STATUS === 'C' || data.DATA_STATUS === 'I') {
      return 'text_underline'
    } else { 
      return 'text_none'
    }
  } else if (tp === 'risk') {
    if (data.RISK_DATA_STATUS === 'C' || data.RISK_DATA_STATUS === 'I') {
      return 'text_underline'
    } else {
      return 'text_none'
    }
  } else if (tp === 'rm') {
    if (data.RM_DATA_STATUS === 'C' || data.RM_DATA_STATUS === 'I') {
      return 'text_underline'
    } else {
      return 'text_none'
    }
  }
}

const treeNodeSelected = (node) => {      
  
  $('html #reportlistScroll').scrollTop(0)

  let offset = $('#' + node[0].id + 'SCR').offset()

  // $refs['reportlistScroll'].scrollTo({
  //   top: offset.top - 500,
  //   behavior: 'smooth'
  // })
  
  $refs.reportTree.value.scrollTo({
    top: offset - 500,
    behavior: 'smooth',
  })
}  

const getchildList = (type, PRNT_ID) => {  
  if (type === 'ACT') {
    return rptList.actList.filter(x => x.PRNT_ID === PRNT_ID)
  } else if (type === 'RISK') {
    return rptList.riskList.filter(x => x.PRNT_ID === PRNT_ID)
  }
}

const getClass = (type) => {
  if (type === 'unit') {
    if (window.innerWidth <= 1280) {
      return 'unitItem1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'unitItem1920'
    } else {
      return 'unitItem1920'
    }
  } else if (type === 'act') {
    if (window.innerWidth <= 1280) {
      return 'actItem1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'actItem1920'
    } else {
      return 'actItem1920'
    }
  } else if (type === 'chk') {
    if (window.innerWidth <= 1280) {
      return 'chkItem1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'chkItem1920'
    } else {
      return 'chkItem1920'
    }
  } else if (type === 'hzContainer') {
    if (window.innerWidth <= 1280) {
      return 'hzContainer1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'hzContainer1920'
    } else {
      return 'hzContainer1920'
    }
  } else if (type === 'scroll') {
    if (window.innerWidth <= 1280) {
      return 'scroll1280'
    } else if (window.innerWidth <= 1920 && window.innerWidth > 1280) {
      return 'scroll1920'
    } else {
      return 'scroll1920'
    }
  }
}


// 상세리포트 탭 클릭 시 조회
const reportTabClick = async () => {
  
  await new queryFlowHelper(vm, t)
            .setGridList([grdSub])
            .setQuery(searchReportTree)
            .setAfter(afterSearchTree)
            .showMessage(false)
            .run()

  await searchReportList()

}

const meetingHistory = async () =>{
  new queryFlowHelper(vm, t)
    .setGridList([grdHistory])
    .setQuery(meetingSearch)
    .setAfter(afterSearch2)
    .showMessage(false)
    .run()     
}





const child = computed(id => {
  return _.filter(todos, { id: id })
})

const selectRow = ele => {
  //console.log('ele', ele)

  const docOther = document.getElementsByClassName('selected-draggable')

  docOther.forEach(item => {
    item.classList.remove('selected-draggable')
  })

  const classss = `${'row1_'}${ele.id}`
  const doc = document.getElementById(classss)

  doc.classList.add('selected-draggable')
}

var tempA = null
var tempB = null
var tempC = null

const selectedItem = item => {
  if(item.level == 1)
  {
    // 선택된 대분류 찾기
    tempA = _.find(ArrayList.value, { id: item.id })
    tempB = null
    tempC = null

    console.log('대분류 = ', tempA)
  }
  else if(item.level == 2)
  {
    // 선택된 중분류 찾기
    let idA = item.id.split('_')[0]

    tempA = _.find(ArrayList.value, { id : idA })
    let A = _.find(ArrayList.value, { id : idA })
    tempB = _.find(A.child, { id : item.id })
    tempC = null
    //tempB = item
    console.log('(tempB)중분류 = ', tempB)
  }
  else if(item.level == 3)
  {
    // 선택된 소분류 찾기
    
    let idA = item.id.split('_')[0]
    let idB = item.pid

    let A = _.find(ArrayList.value, { id : idA })
    let B = _.find(A.child, { id : idB })

    tempA = _.find(ArrayList.value, { id : idA })
    tempB = _.find(A.child, { id : idB })
    tempC = _.find(B.child, { id : item.id })
    
    //tempC = item

    // console.log('소분류 = ', tempC)
    
  }  
}

// ele = element
const selectCard = ele => {
  
  console.log('selectCard', ele)

  sItem.value = ele.id
  sItemLevel.value = ele.level

  // 선택된 아이템의 정보를 넘겨서 내부 id찾기
  selectedItem(ele)
  console.log('selectedItem = ', ele)

  const docOther = document.getElementsByClassName('selected-card')

  docOther.forEach(item => {
    item.classList.remove('selected-card')
  })

  let cid = ''

  if(ele.level == 1)
  {
    cid = `${'card1_'}${ele.id}`
  }
  else if(ele.level == 2)
  {
    cid = `${'card2_'}${ele.id}`
  }
  else if(ele.level == 3)
  {
    cid = `${'card3_'}${ele.id}`
  }
  
  const doc = document.getElementById(cid)

  doc.classList.add('selected-card')
}

const selectCheck = ele => {
  console.log('selectCheck', ele)
  ArrayList.value.forEach(list => {
    list.IS_CHECK = 'N'
  })

  ArrayList.value.forEach(item => {
    if (item.child) {
      item.child.forEach(childItem => {
        childItem.IS_CHECK = 'N'
      })
    }      
  })

  ArrayList.value.forEach(item => {
    item.child.forEach(childItem => {
      if (childItem.child) {
        childItem.child.forEach(innerChildItem => {
            innerChildItem.IS_CHECK = 'N'
        })
      }
    })
  })

  if (ele.level == '1') { // 대분류
    ArrayList.value.find(unit => unit.id === ele.id).IS_CHECK = 'Y'
    ele.IS_CHECK = 'Y'
  }
  else if (ele.level == '2') { // 중분류
    const checkArray = ele.id.split('_')
    ArrayList.value.find(act => act.id === checkArray[0]).IS_CHECK = 'Y'
    ele.IS_CHECK = 'Y'
  } else if (ele.level == '3') { // 소분류
    const checkArray = ele.id.split('_')
    ArrayList.value.find(act => act.id === checkArray[0]).IS_CHECK = 'Y'
    let riskId = checkArray[0]+'_'+checkArray[1]
    ArrayList.value.find(act => act.id === checkArray[0]).child.find(risk => risk.id === riskId).IS_CHECK = 'Y'
    ele.IS_CHECK = 'Y'
  }





}

const dragOptions = {
  animation: 200,
}

const onDragStart = () => {
  //console.log('Drag Start')
}


const onDragEnd = e => {  
  // 객체 배열의 idx를 1부터 재생성
  sortArray()
}

const sortArray = () => {
  
  let cntX = 1
  let cntY = 1
  let cntZ = 1

  ArrayList.value.forEach( x => {
    
    cntY = 1
    x.idx = cntX++ 

    x.child.forEach( y => {
      cntZ = 1      
      y.idx = cntY++

      y.child.forEach( z => {
        z.idx = cntZ++
      })
    })
  })

}



const changeDataEvent = ( type, data, change ) => {
  if (type === 'unit') {
    data.UNIT_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'act') {
    data.ACT_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'chk') {
    data.CHK_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'risk') {
    data.RISK_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'rm') {
    data.RM_NM = change

    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  }
}

const checkedEvent = (type, data, value) => {
  //console.log('Check : ', data)
  if (type === 'unit') {
    WORK_STANDARD_UNIT.find(
      t => t.UNIT_ID === data.UNIT_ID
    ).IS_CHECK = value
  } else if (type === 'act') {
    WORK_STANDARD_ACT.find(
      t => t.ACT_ID === data.ACT_ID
    ).IS_CHECK = value
  } else if (type === 'risk') {
    WORK_STANDARD_RISK.find(
      t => t.RISK_ID === data.RISK_ID
    ).IS_CHECK = value
  }
}

const childList = (tp, data, data2) => {
  if (tp === 'act') {
    return WORK_STANDARD_ACT.filter(
      x => x.STATUS !== 'D' && x.UNIT_ID === data
    )
  } else if (tp === 'risk') {
    return WORK_STANDARD_RISK.filter(
      x =>
        x.STATUS !== 'D' &&
        x.WORK_STANDARD_ID === data &&
        x.ACT_ID === data2
    )
  }
} 

// 단위작업 조회
const searchUnit = async id => {
  console.log('ArrayList1 = ', ArrayList.value)
  // PKG_RSKBA0010.WORK_STANDARD_UNIT_S
  await commonSearchApi({ queryId: "RSKBA0010_SEARCH_05", param: { WORK_STANDARD_ID : id, TRANS : WORK_STANDARD_MASTER.TRANS_CD }  }).then(async res => {   
    let maxId 
    let maxIdx 
    let SAVE_STATUS 
    WORK_STANDARD_UNIT = res.ORESULT_CUR 
    console.log('searchUnit = ',WORK_STANDARD_UNIT)     
    ArrayList.value = []    
      
    
    if(workType.value == 'U'){
      SAVE_STATUS = 'U'
    }else{
      SAVE_STATUS = 'C'
    }

    if(isRevision.value)
      WORK_STANDARD_UNIT.map(row => (row.STATUS = 'C'))

    for(let i=0; i < res.ORESULT_CUR.length; i++){
      maxId = (ArrayList.value.length + 1).toString()
      maxIdx = ArrayList.value.reduce((max, obj) => Math.max(max, obj['idx']), 0)
      
      ArrayList.value.push({ 
        level: 1, id: maxId, text: '' + maxId, child: [],
        WORK_STANDARD_ID : id,
        UNIT_ID : res.ORESULT_CUR[i].UNIT_ID,
        UNIT_NM : WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].UNIT_NM : res.ORESULT_CUR[i].TRANS_UNIT_NM,
        STATUS: isRevision.value ? 'C' : SAVE_STATUS,
      })         
    }
    console.log("ArrayList: ", ArrayList)
    //console.log('(UNIT)단위작업 조회 결과 = ', res)
    await searchAct(id)
  })

}

// 작업행동 조회
const searchAct = async id => {
  
  // PKG_RSKBA0010.WORK_STANDARD_ACT_S
  await commonSearchApi({ queryId: "RSKBA0010_SEARCH_06", param: { WORK_STANDARD_ID : id, TRANS : WORK_STANDARD_MASTER.TRANS_CD }  }).then(async res => {    
    let maxId 
    let maxIdx 
    let newId
    let SAVE_STATUS
    WORK_STANDARD_ACT = res.ORESULT_CUR
    console.log('searchAct = ', WORK_STANDARD_ACT)
    
    if(workType.value == 'U'){
      SAVE_STATUS = 'U'
    }else{
      SAVE_STATUS = 'C'
    }

    if(isRevision.value)
      WORK_STANDARD_ACT.map(row => (row.STATUS = 'C'))

    for(let i=0; i < res.ORESULT_CUR.length; i++){
      
      tempA = _.find(ArrayList.value, { UNIT_ID: res.ORESULT_CUR[i].UNIT_ID })
      if(tempA) {
        console.log("tempA: ", tempA)
        maxId = tempA.child.reduce((max, obj) => Math.max(max, obj['id'].split('_')[1]), 0)            
        maxIdx = tempA.child.reduce((max, obj) => Math.max(max, obj['idx']), 0)
        newId = tempA.id + '_' + (maxId + 1)
        console.log("maxId maxIdx  newId: ", maxId, maxIdx,  newId)
        tempA.child.push({ 
          level: 2,
          id : newId,
          pid : tempA.id,
          idx : (maxIdx + 1),
          text: '' + maxId,
          child: [],
          WORK_STANDARD_ID : id,
          UNIT_ID : res.ORESULT_CUR[i].UNIT_ID,
          ACT_ID : res.ORESULT_CUR[i].ACT_ID,
          ACT_NM : WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].ACT_NM : res.ORESULT_CUR[i].TRANS_ACT_NM,
          CHK_NM : WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].CHK_NM : res.ORESULT_CUR[i].TRANS_CHK_NM,
          STATUS: isRevision == true ? 'C' : SAVE_STATUS
        })  
      }
          
    }
    //console.log('(ACT)작업행동 조회 결과 = ', res)
    await searchRisk(id, res)
  })

}

// 위험요인 조회
const searchRisk = async (id, data) => {
  // PKG_RSKBA0010.WORK_STANDARD_RISK_S
  await commonSearchApi({ queryId: "RSKBA0010_SEARCH_07", param: { WORK_STANDARD_ID : id, TRANS : WORK_STANDARD_MASTER.TRANS_CD }  }).then(async res => {    
    // 선택된 소분류 찾기
    let maxId 
    let maxIdx 
    let newId 
    let A 
    let SAVE_STATUS
    WORK_STANDARD_RISK = res.ORESULT_CUR
    console.log('searchRISK = ', WORK_STANDARD_RISK)

    
    if(workType.value == 'U'){
      SAVE_STATUS = 'U'
    }else{
      SAVE_STATUS = 'C'
    }
    
    if(isRevision.value)
      WORK_STANDARD_RISK.map(row => (row.STATUS = 'C'))

    for(let i=0; i < res.ORESULT_CUR.length; i++){     
      
      console.log('data.ORESULT_CUR = ', data.ORESULT_CUR)
      console.log('res ORESULT_CUR = ', res.ORESULT_CUR)

      let getUnit = _.find(data.ORESULT_CUR, { ACT_ID : res.ORESULT_CUR[i].ACT_ID })      

      console.log('getUnit = ', getUnit)

      if(getUnit) {
        console.log('ArrayList = ', ArrayList.value)
        A = _.find(ArrayList.value, { UNIT_ID : getUnit.UNIT_ID })

        console.log('A = ', A)
        console.log('res.ORESULT_CUR[i].ACT_ID = ', res.ORESULT_CUR[i].ACT_ID)

        if(A) {

          tempB = _.find(A.child, { ACT_ID : res.ORESULT_CUR[i].ACT_ID })
          maxId = tempB.child.reduce((max, obj) => Math.max(max, obj['id'].split('_')[2]), 1)
          maxIdx = tempB.child.reduce((max, obj) => Math.max(max, obj['idx']), 1)
          newId = tempB.id + '_' + (maxId + 1)
          
          tempB.child.push( { 
            level: 3, id : newId, pid : tempB.id, idx : (maxIdx + 1), text: '' + maxId, child: [], 
            WORK_STANDARD_ID : id,
            ACT_ID : res.ORESULT_CUR[i].ACT_ID,
            RISK_ID : res.ORESULT_CUR[i].RISK_ID,
            RISK_CD : res.ORESULT_CUR[i].RISK_CD,
            RISK_CD_P_NM : res.ORESULT_CUR[i].RISK_CD_P_NM,
            RISK_CD_D_NM : res.ORESULT_CUR[i].RISK_CD_D_NM,
            RISK_NM : WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].RISK_NM : res.ORESULT_CUR[i].TRANS_RISK_NM,
            RM_CD : res.ORESULT_CUR[i].RM_CD,
            RM_CD_P_NM : res.ORESULT_CUR[i].RM_CD_P_NM,
            RM_CD_D_NM : res.ORESULT_CUR[i].RM_CD_D_NM,    
            RM_NM : WORK_STANDARD_MASTER.TRANS_CD === 'ko' ? res.ORESULT_CUR[i].RM_NM : res.ORESULT_CUR[i].TRANS_RM_NM,
            BEFOR_FRE : res.ORESULT_CUR[i].BEFOR_FRE,       // 빈도
            BEFOR_MAT : res.ORESULT_CUR[i].BEFOR_MAT,       // 강도    
            AFTER_FRE : res.ORESULT_CUR[i].AFTER_FRE,       // 빈도
            AFTER_MAT : res.ORESULT_CUR[i].AFTER_MAT,       // 강도
            BEFOR_TOTAL : res.ORESULT_CUR[i].BEFOR_TOTAL,   // 개선전 위험성
            AFTER_TOTAL : res.ORESULT_CUR[i].AFTER_TOTAL,   // 개선후 위험성
            STATUS: isRevision.value ? 'C' : SAVE_STATUS,
          })
        }
      }
    }  
    //console.log('tempB Child = ', tempB.child)
  })
}

const fileSave = () => {
  
  let actId 
  let fileId
  ArrayList.value.forEach(item => {
    if(item.child){
      item.child.forEach(childItem => {
        if(childItem.id === sItem.value){
          actId = childItem.ACT_ID
          fileId = childItem.FILE_ID
          console.log('childItem.fileId = ', childItem.FILE_ID)
        }        
      })      
    }
  })


  if(fileId == null || fileId == '') {
    let params = {
    WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
    ACT_ID: actId,
  }
  
    // let id = 'HHIS-CW-G2P0-001-01'
    // let act_id = 'HHIS-CW-G2P0-001-01-A1707894996976'  
      
    commonSearchApi({ queryId : 'RSKBA0010_SEARCH_20', param: params }).then( res => {          
      
      if(res.ORESULT_CUR.length > 0)
      {
      
        // 기존 Hi-Standard는 File_ID없고, ACT_ID로 관리하기 때문에 분기 처리
        let fid = res.ORESULT_CUR[0].FILE_ID != null ? res.ORESULT_CUR[0].FILE_ID : res.ORESULT_CUR[0].ACT_ID

        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
        fileUploadPopup.value.setGuid(fid)
        //fileUploadPopup.value.setGuid(res.ORESULT_CUR[0].FILE_ID)
      }else
      {
        fileUploadPopup.value.setGuid()
      } 
      
      fileId = fileUploadPopup.value.guid
      fileUploadPopup.value.setGuid(fileId)
      fileUploadPopup.value.openPopup(fileId)
    })   
  } else {
      fileUploadPopup.value.setGuid(fileId)
      fileUploadPopup.value.openPopup(fileId)
  }

  //console.log('sItem = ', sItem.value)
  //console.log('file save : ',actId)
  //console.log('file work id : ',WORK_STANDARD_MASTER.WORK_STANDARD_ID)
   
}

// 교육이수파일첨부 호출
const popupFile = () => {
  fileUploadEduPopup.value.openPopup(WORK_STANDARD_MASTER.EDU_FILE_ID)
}

// 위험성 문구
const changeFreMatEvent = (gbn, type, data, change) => {

  if (type === 'FRE') {    
    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  } else if (type === 'MAT') {    
    if (data.IS_SAVE === 'Y') {
      data.STATUS = 'U'
    }
  }

  if (gbn === 'BEFOR') {

    befor1.value = false
    befor2.value = false
    befor3.value = false
    befor4.value = false

    if (data.BEFOR_FRE === '' || data.BEFOR_MAT === '') {
      return false
    }

    let total = parseInt(data.BEFOR_FRE) * parseInt(data.BEFOR_MAT)
    //console.log('BEFOR total : ', total)
    if ([1, 2, 3].includes(total)) {
      data.BEFOR_TOTAL = total + '(매우낮음)'
      befor1.value = true
    } else if ([4, 5, 6].includes(total)) {
      data.BEFOR_TOTAL = total + '(낮음)'
      befor2.value = true
    } else if ([8, 9, 10, 12].includes(total)) {
      data.BEFOR_TOTAL = total + '(위험)'
      befor3.value = true
    } else if ([15, 16, 20, 25].includes(total)) {
      data.BEFOR_TOTAL = total + '(매우위험)'
      befor4.value = true
    }
  } else if (gbn === 'AFTER') {

    after1.value = false
    after2.value = false
    after3.value = false
    after4.value = false
    
    if (data.AFTER_FRE === '' || data.AFTER_MAT === '') {
      return false
    }

    let total = parseInt(data.AFTER_FRE) * parseInt(data.AFTER_MAT)
    //console.log('AFTER total : ', total)
    if ([1, 2, 3].includes(total)) {
      data.AFTER_TOTAL = total + '(매우낮음)'      
      after1.value = true
    } else if ([4, 5, 6].includes(total)) {
      data.AFTER_TOTAL = total + '(낮음)'      
      after2.value = true
    } else if ([8, 9, 10, 12].includes(total)) {
      data.AFTER_TOTAL = total + '(위험)'
      after3.value = true
    } else if ([15, 16, 20, 25].includes(total)) {
      data.AFTER_TOTAL = total + '(매우위험)'
      after4.value = true
    } else {
      data.AFTER_TOTAL = ''
    }
    
  }
}

const getColor = (gbn, data) => {
  if(gbn == 'BEFOR')
  {
    if(data.BEFOR_FRE == '' || data.BEFOR_MAT == '')
    return ''

    let total = parseInt(data.BEFOR_FRE) * parseInt(data.BEFOR_MAT)

    if(total > 6)
      return 'risk-color-white'
    else
      return 'risk-color-black'
  }
  else if(gbn == 'AFTER')
  {
    if(data.AFTER_FRE == '' || data.AFTER_MAT == '')
    return ''

    let total = parseInt(data.AFTER_FRE) * parseInt(data.AFTER_MAT)

    if(total > 6)
      return 'risk-color-white'
    else
      return 'risk-color-black'
  }
}

// 현재의 위험성 색상 처리
const riskColor = (gbn, data) => {
  if (gbn == 'BEFOR') {
    if (data.BEFOR_FRE === '' || data.BEFOR_MAT === '') {
      return ''
    }

    let total = parseInt(data.BEFOR_FRE) * parseInt(data.BEFOR_MAT)

    if ([1, 2, 3].includes(total)) {
      return 'green'
    } else if ([4, 5, 6].includes(total)) {
      return '#FFF9C4'
    } else if ([8, 9, 10, 12].includes(total)) {
      return '#FFA726'
    } else if ([15, 16, 20, 25].includes(total)) {
      return 'red'
    }
  }
  else if (gbn == 'AFTER') {
    if (data.AFTER_FRE === '' || data.AFTER_MAT === '') {
      return ''
    }

    let total = parseInt(data.AFTER_FRE) * parseInt(data.AFTER_MAT)

    if ([1, 2, 3].includes(total)) {
      return 'green'
    } else if ([4, 5, 6].includes(total)) {
      return '#FFF9C4'
    } else if ([8, 9, 10, 12].includes(total)) {
      return '#FFA726'
    } else if ([15, 16, 20, 25].includes(total)) {
      return 'red'
    }
  } 
  
  
}

// 언어 변경시 조회
const changeTrans = () => {
  
  //console.log('value = ', value)
  search(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
  searchUnit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
}

// 현황에서 불러온 경우 조회 및 버튼 활성/비활성화
const initData = async (wtype, wid, pStatus, revDept) => {
  
  let workNo = wid.slice(0, -3)
  
  WORK_STANDARD_MASTER.WORK_STANDARD_ID = wid
  WORK_STANDARD_MASTER.WORK_STANDARD_NO = workNo

  menuTitle.value.disableBtn('btnSearch',   false) 

  
  // 표준서 정보 조회 (.then을 한 이유는, 메인을 먼저 조회한 뒤 나머지 데이터 조회를 위해)
  await search(wid)
  
  // 언어 목록 조회
  await transInit(wid)
  
  // 작업표준서 개정이력      
  await revisionHistory() 
  
  // 위험성평가 위원회
  await committeeSearch()
  
  // 탭2의 단위작업, 작업행동, 위험요인 조회
  await searchUnit(wid)    
  
  // 회의이력 조회
  await meetingHistory()
  
  // 상세리포트 조회
  await reportTabClick()  
  

  sagoInform.value = false

  // 로딩바 닫기
  commonStore.loading = false
}


const onLoad = async () => {
    
  // 현황 화면에서 호출했는지 확인 (파라미터가 있으면 호출된 것임)  
  let wtype = window.sessionStorage.getItem('WORK_TYPE')
  let pStatus = window.sessionStorage.getItem('PROGRESS_STATUS')
  let wid = window.sessionStorage.getItem('WORK_STANDARD_ID')
  let revDept = window.sessionStorage.getItem('DEPT_CD')  // 협력사인 경우 asgnCd 데이터로 넘어올 것임
  
  
  console.log('wtype = ', wtype)
  console.log('wid = ', wid)
  console.log('pStatus = ', pStatus)

  // 페이지 전환만 이루어진 건지, 다른 화면 호출인지 구분
  // wtype != null 인 경우 다른 화면에서 호출된것임
  if(wtype != null)
  {
    workType.value = wtype
    workId.value = wid
  
    isRevision.value = wtype == 'U' ? true : false
    cnt = 0
  }
  
  // 세션에 부여한 아이템 제거
  window.sessionStorage.removeItem('WORK_TYPE')
  window.sessionStorage.removeItem('PROGRESS_STATUS')
  window.sessionStorage.removeItem('WORK_STANDARD_ID')
  window.sessionStorage.removeItem('DEPT_CD')
  window.sessionStorage.removeItem('RSKBA0020_RELOAD')

  if(cnt == 0)
    initCodeList()

  // 값이 null인 경우, 메뉴에서 선택하여 화면 띄운 것임
  if(wid == null && cnt == 0)
  {
    
    // 버튼 활성화/비활성화 (true: 비활성화, false: 활성화)
    menuTitle.value.disableBtn('btnSearch',   true) // 조회

    // 직영/협력사 유무에 따라 직영부서 담당자 보일지 판단
    showReviewer()
      
  }
  // 다른 화면에서 호출시에만 반응 (메뉴 이동시에는 반응안함)
  else if(wid != null && cnt == 0)
  {
    cnt = 1
    console.log("다른화면 호출")
    await initData(wtype, wid, pStatus, revDept) // 상세 내용 불러오는 함수인 듯 
    
    // 언어 콤보박스 세팅
    await transInit(WORK_STANDARD_MASTER.WORK_STANDARD_ID)
  }

  
}

/**
 * 데이터 조회시 직영/협력사 구분하여 협력사인 경우에만 직영부서 담당자 검토자 보여주기
 * 조회된 데이터가 없는 경우엔 로그인한 유저의 직영/협력사 여부로 결정
 */
const showReviewer = () => {
  
  // 협력사인 경우 직영부서 담당자 보여주기
  if(WORK_STANDARD_MASTER.USER_DIV == 'A')
    isReviewer.value = false
  else if(WORK_STANDARD_MASTER.USER_DIV == 'B')
    isReviewer.value = true
  else
    isReviewer.value = userStore.userDiv == 'A' ? false : true
}

let cnt = 0

onActivated(() => {
  onLoad()
})
onMounted(() => {
  onLoad()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

const tabChange = gbn => {  

  if(gbn === 'tab3') {
    reportTabClick()    
  }
}

// 지난 반기 조회
const getHalfDate = () => {
    
    let half = reactive({
      from : '',
      to   : '',
    })

    let date = new Date()

    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()

    let from
    let to

    let cFrom
    let cTo

    if(month < 7)
    {
      from = new Date(year-1, 6, 1)
      to   = new Date(year-1, 12, 0)

      let cMonth = from.getMonth() + 1
      let cDay = from.getDate()

      let month2 = to.getMonth() + 1
      let day2 = to.getDate()

      cFrom = year -1 + '-' +
                  String(cMonth).padStart(2, '0') + '-' +
                  String(cDay).padStart(2, '0')

      cTo = year -1 + '-' +
                String(month2).padStart(2, '0') + '-' +
                String(day2).padStart(2, '0')
    }
    else
    {
      from = new Date(year, 0, 1)
      to   = new Date(year, 6, 0)

      let cMonth = from.getMonth() + 1
      let cDay = from.getDate()

      let month2 = to.getMonth() + 1
      let day2 = to.getDate()

      cFrom = year + '-' +
                  String(cMonth).padStart(2, '0') + '-' +
                  String(cDay).padStart(2, '0')

      cTo = year + '-' +
                String(month2).padStart(2, '0') + '-' +
                String(day2).padStart(2, '0')
    }

    // 날짜 구하는 함수 제대로 만들기 
    console.log('from =', cFrom)
    console.log('to =', cTo)
   
    half.from = cFrom
    half.to = cTo

    return half
}

let arrMaster = []
let isMaster = ref(false)

const ck = (event) => {

  if(event.shiftKey)
  {
    arrMaster = []
    isMaster.value = false

    return
  }
  
  arrMaster.push(event.ctrlKey == true ? '1' : '0')

  if(arrMaster[0] == '0' && arrMaster[1] == '1')
    isMaster.value = true

  
}

</script>

<template>
  <div v-if="false" style="border: 1px solid darkblue;" @mousedown="ck">
    <H5>전산 점검중입니다. 이용에 불편을 드려 죄송합니다.</H5>
  </div>
  <div v-else>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSimplePrint', 'btnDetailPrint', 'btnWordPrint']"
        @click-button="onButtonsClick"
      >
      <div class="d-flex flex-grow-1 justify-end" @mousedown="ck">
        <i-select
          width="130px"
          v-model="WORK_STANDARD_MASTER.TRANS_CD"
          :items="cmbTrans"
          item-value="TRANS_CD"
          item-title="TRANS_NM"
          @update:modelValue="changeTrans"
        />
      </div>
      </IMenuTitle>  
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mb-2">
          <v-tabs v-model="tab" @update:modelValue="tabChange">
            <v-tab value="tab1">표준서 정보</v-tab>
            <v-tab value="tab2">세부내용</v-tab>
            <v-tab value="tab3">상세리포트</v-tab>
          </v-tabs>
        </v-sheet>
        <v-sheet v-show="tab == 'tab1'" class="h-auto content-area-tab">
          <div class="h-grow">
            <v-sheet width="1090px" class="mr-3">
                <IGridTitle :title="$t('작업표준 기본정보')">
                  <template #editors />
                </IGridTitle>
                <VDivider
                  :thickness="1"
                  class="border-opacity-100 mb-2"
                  color="primary"
                />
                <div class="d-flex mb-2">
                  <i-input
                    required
                    :label="$t('구분')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.GUBUN_NM" 
                    :readonly="readonlyYn"                   
                  />
                  <i-input
                    required
                    :label="$t('표준번호')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_ID_VIEW"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    required
                    :label="$t('표준서명')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_NM"
                    :readonly="readonlyYn"
                  />
                </div>
                <IGridTitle :title="$t('위험성평가 정보')"/>
                <VDivider
                  :thickness="1"
                  class="border-opacity-100 mb-2"
                  color="primary"
                />
                <div class="d-flex align-content-start flex-wrap mb-2">
                  <i-input
                    :label="$t('작성자')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.USER_INFO"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('제정일자')"
                    width="200px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.C_DATE"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('개정일자')"
                    width="200px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.U_DATE"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('개정차수')"
                    width="100px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_REVISION"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    class="mt-2"
                    :required="userStore.userDiv == 'A' ? true : false"
                    :label="$t('담당자(생산팀장)')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM"                    
                    :readonly="readonlyYn"
                    :disabled="userStore.userDiv == 'A' ? false : true"
                  />
                  <i-input
                    class="mt-2"
                    :label="$t('담당과장')"
                    width="350px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.POSITION_MANAGER_NM"
                    readonly
                    :disabled="userStore.userDiv == 'A' ? false : true"
                  />
                  <i-input
                    class="mt-2"
                    :label="$t('직영부서 담당자')"
                    width="350px"
                    topLabel
                    v-if="isReviewer"
                    v-model="WORK_STANDARD_MASTER.REVIEWER"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    class="mt-2 input-border"
                    variant="outlined"
                    :label="$t('중요위험')"
                    :width="isReviewer == true ? '200px' : '350px'"
                    topLabel
                    readonly
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_RISK_OVER_COUNT"
                  />
                  <i-input
                    class="mt-2 input-border"
                    variant="outlined"
                    :label="$t('특별감소대책')"
                    width="200px"
                    topLabel
                    readonly
                    v-model="WORK_STANDARD_MASTER.SRSRM_COMPLETE"
                  />
                  <i-input
                    class="mt-2 input-border"
                    variant="outlined"
                    :label="$t('이행률')"
                    :width="isReviewer == true ? '100px' : '200px'"
                    topLabel
                    readonly
                    v-model="WORK_STANDARD_MASTER.RATE"
                  />
                  <i-input                    
                    class="mt-2"
                    :required="false"
                    :label="$t('교육이수자료첨부')"
                    width="200px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.EDU_FILE_COUNT"
                    @click="popupFile()"
                    append-inner-icon="mdi-file-upload-outline"
                    readonly                    
                  />
                </div>
                
                <IGridTitle :title="$t('제/개정 정보')"/>
                <VDivider
                  :thickness="1"
                  class="border-opacity-100 mb-2"
                  color="primary"
                />
                  <!-- length="470px" -->
                <div class="d-flex mb-2">
                  <i-select
                    required
                    :label="$t('평가유형')"
                    width="250px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.RISK_TYPE"
                    :items="codeList.riskType"
                    item-value="CODE_ID"
                    item-title="CODE_NM"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('결재일자')"
                    width="200px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.APPROVAL_DATE"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    required
                    :label="$t('제/개정 사유')"
                    width="600px"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_STANDARD_DESC"
                    :readonly="readonlyYn"
                  />
                </div>
                
                <IGridTitle :title="$t('작업 정보')"/>
                <VDivider
                  :thickness="1"
                  class="border-opacity-100 mb-2"
                  color="primary"
                />
                <div class="d-flex mb-2">
                  <i-textarea 
                    required
                    :label="$t('작업도구')"
                    width="350px"
                    :row="2"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.WORK_TOOLS"
                    :readonly="readonlyYn"
                  />
                  <i-textarea 
                    required
                    :label="$t('장비 및 설비')"
                    width="350px"
                    :row="2"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.EQUIPMENT_TYPE"
                    :readonly="readonlyYn"
                  />
                  <i-textarea 
                    required
                    :label="$t('사용 화학물질정보')"
                    width="350px"
                    :row="2"
                    topLabel
                    v-model="WORK_STANDARD_MASTER.USE_CHEMICAL"
                    :readonly="readonlyYn"
                  />
                  
                  <VBtn class="mt-5" max-width="80%"
                    v-if="false"
                    :disabled="sagoInform"
                    @click="openPopup2('사고정보')"
                  >                              
                    사고정보
                  </VBtn>
                </div>
                
                <IGridTitle 
                  :title="$t('위험성평가 위원회')"
                  @click-button="onButtonsClick"
                />
                <VDivider
                  :thickness="1"
                  class="border-opacity-100 mb-2"
                  color="primary"
                />
                <div class="d-flex mb-2">
                  
                </div>
                <!-- 위험성평가 위원회 -->
                <div class="d-flex mb-2">
                  <i-input
                    :label="$t('위험성평가위원회 (운영위원)')"
                    width="350px"
                    topLabel
                    v-model="codeList.committee.COMMITTEE_OPS"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('실행위원(부서)')"
                    width="350px"
                    topLabel
                    v-model="codeList.committee.COMMITTEE_DEPT"
                    :readonly="readonlyYn"
                  />
                  <i-input
                    :label="$t('실행위원(조합)')"
                    width="350px"
                    topLabel
                    v-model="codeList.committee.COMMITTEE_ASSOC"
                    :readonly="readonlyYn"
                  />
                </div>
            </v-sheet>
            <v-sheet class="h-auto pr-1">
              <div class="fill-height">
                <IGridTitle :title="$t('사업장 안전보건정보(바로가기)')"/>
                <VDivider
                  :thickness="1"
                  class="border-opacity-100 mb-2"
                  color="primary" 
                />
                <v-sheet class="d-flex justify-space-between" style="height: 63px">
                  <v-btn size="large" variant="outlined" width="170px" @click="openPopup2('사고')">사고</v-btn>
                  <v-btn size="large" variant="outlined" width="170px" disabled="true" @click="openPopup2('현장위험성평가')">현장위험성평가</v-btn>
                  <v-btn size="large" variant="outlined" width="170px" @click="openPopup2('안전작업요구권')">안전작업요구권</v-btn>
                  <v-btn size="large" variant="outlined" width="170px" @click="openPopup2('안전리스크')" :disabled="srBtnDisabled">안전리스크</v-btn>
                </v-sheet>
                <IGridTitle :title="$t('재해발생현황')"/>
                <VDivider
                    :thickness="1"
                    class="border-opacity-100 mb-2"
                    color="primary" 
                  />
                <v-sheet height="116px" class="mb-3">
                  <table class="mb-2">
                    <tr class="tr-data" style="height: 50px; background-color: #e4e4e4;">
                      <td width="33%">{{ SAGO.SAN_CNT }}건<br/>산재사고</td>
                      <td width="34%">{{ SAGO.HUE_CNT }}건<br/>휴업사고</td>
                      <td width="33%">{{ SAGO.IL_CNT }}건<br/>일반사고</td>
                    </tr>
                  </table>
                  <table>
                    <tr class="tr-data" style="height: 50px; background-color: #1A40C7; color: white;">
                      <td>중대(성)사고 {{ SAGO.SAN_CNT }}건</td>
                    </tr>
                  </table>
                </v-sheet>
                <IGridTitle :title="$t('작업표준서 개정이력')" style="margin-top: 75px;"/>
                <VDivider
                    :thickness="1"
                    class="border-opacity-100 mb-2"
                    color="primary" 
                  /> 
                <v-sheet height="180px" class="mb-3">
                  <RealGrid
                    ref="grdMain"
                    :grid-view-option="grdMainProps.gridViewOption"
                    :keys="grdMainProps.keys" 
                    :fields="grdMainProps.fields"
                    :columns="grdMainProps.columns"
                  />
                </v-sheet>
                <!-- 엔진기계 사업부인 경우만 아래 컴포넌트 보여줌 -->
                <div v-if="WORK_STANDARD_MASTER.BSNS_CD_ORIGIN === 'AK00'">
                  <IGridTitle :title="$t('점검 필요 여부')"/>
                  <VDivider
                      :thickness="1"
                      class="border-opacity-100 mb-2"
                      color="primary" 
                    />
                  <v-sheet class="d-flex align-center justify-space-between" height="75px">
                    <!--TODO 2024.07.11 윤찬양 책임 요청으로 명칭 변경-->
                    <v-checkbox label="3중 점검 작업"  v-model="WORK_STANDARD_MASTER.CHK_REQUIRED" true-value="T" false-value=""></v-checkbox>
                    <v-checkbox label="부서자율점검 작업"  v-model="WORK_STANDARD_MASTER.CHK_REQUIRED" true-value="D" false-value=""></v-checkbox>
                    <v-checkbox label="점검 제외" v-model="WORK_STANDARD_MASTER.CHK_REQUIRED" true-value="N" false-value=""></v-checkbox>
                  </v-sheet>
                </div>                
              </div>              
            </v-sheet>
          </div>
        </v-sheet>
        <v-sheet v-show="tab == 'tab2'" class="h-auto content-area-tab">
          <div class="d-flex flex-column fill-height">
            <v-expansion-panels class="mb-3">
              <v-expansion-panel class="exp-panel-border">
                <v-expansion-panel-title v-slot="{ expanded }" style="min-height:50px; max-height: 50px;">
                  <div class="d-flex flex-column">
                    <span style="font-size: 16px; font-weight: bold;">안전보건정보</span>
                    <v-fade-transition leave-absolute>
                      <span v-if="expanded" key="0">
                      </span> 
                      <span v-else key="1">
                        
                      </span>
                    </v-fade-transition>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="pa-3">
                  <div class="d-flex">
                    <div class="d-flex">
                      <i-input
                        :label="$t('작업도구')"
                        width="250px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.WORK_TOOLS"
                        readonly
                      />
                      <i-input
                        :label="$t('장비 및 설비')"
                        width="250px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.EQUIPMENT_TYPE"
                        readonly
                      />
                      <i-input
                        :label="$t('사용 화학물질정보')"
                        width="250px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.USE_CHEMICAL"
                        readonly
                      />
                      <i-input
                        :label="$t('직영부서 담당자')"
                        width="250px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.REVIEWER"
                        v-if="isReviewer"
                        readonly
                      />
                      <i-input
                        :label="$t('담당자(생산팀장)')"
                        width="250px"
                        topLabel
                        v-model="WORK_STANDARD_MASTER.PRODUCTION_MANAGER_NM"
                        v-if="!isReviewer"
                        readonly
                      />                      
                      <VBtn width="250px" @click="openPopup2('회의이력')" class="mt-5">
                        <VIcon>mdi-clipboard-text-clock-outline</VIcon>
                        위험성평가 회의이력(전체)
                      </VBtn>
                      <VBtn width="250px" @click="openPopup2('비일상작업')" class="mt-5">
                        <VIcon>mdi-clipboard-text-clock-outline</VIcon>
                        수시위험성 평가조회(비일상작업)
                      </VBtn>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            <IGridTitle :title="$t('작업표준 세부내용')">
            </IGridTitle>
            <div class="d-flex pr-1 mb-1">
              <v-sheet class="d-flex justify-space-between" width="300px">
                <span>
                  <h4>단위작업명</h4>
                </span>                
              </v-sheet>
              <v-sheet class="d-flex justify-space-between ml-1" width="300px">
                <span>
                  <h4>작업행동/체크정보</h4>
                </span>
                <span>
                  <VIcon color="info" icon="mdi-image" @click="openPopup2('addFile')"/>                  
                </span>                
              </v-sheet>
              <v-sheet class="d-flex justify-space-between ml-1" width="400px">
                <span>
                  <h4>위험요인</h4>
                </span>                
              </v-sheet>
              <v-sheet class="d-flex flex-row ml-1" width="400px"> 
                <span class="ml-2" style="width: 143px;">
                  <h4>현재의 빈도</h4> 
                </span>
                <span style="width: 145px;">
                  <h4>현재의 강도</h4>
                </span>
                <span>
                  <h4>현재의 위험성</h4>
                </span>
              </v-sheet>
              <v-sheet class="d-flex flex-row ml-1" width="400px">
                <span class="ml-2" style="width: 143px;">
                  <h4>개선후 빈도</h4> 
                </span>
                <span style="width: 145px;">
                  <h4>개선후 강도</h4>
                </span>
                <span>
                  <h4>개선후 위험성</h4>
                </span>
              </v-sheet>
            </div>
            <div class="d-flex pr-1">
              <VDivider
                :thickness="1"
                length="300px"
                class="border-opacity-100"
                color="primary"
              />
              <VDivider
                :thickness="1"
                length="300px"
                class="border-opacity-100 ml-1"
                color="primary"
              />
              <VDivider
                :thickness="1"
                length="400px"
                class="border-opacity-100 ml-1"
                color="primary"
              />
              <VDivider
                :thickness="1"
                length="400px"
                class="border-opacity-100 ml-1"
                color="primary"
              />
              <VDivider
                :thickness="1"
                length="400px"
                class="border-opacity-100 ml-1"
                color="primary"
              />
            </div> 
            <!-- Draggable -->
            <div class="d-flex flex-column pr-1 setOverFlow">
              <draggable v-model="ArrayList" :options="dragOptions" @start="onDragStart" @end="onDragEnd" item-key="id" >
                <template #item="{ element }">
                  <div :id="'row1_' + element.id" class="d-flex todo-item" 
                    @mousedown="selectRow(element)" v-if="element.STATUS == 'C' || element.STATUS == 'U'">
                      <v-sheet class="d-flex flex-column" width="300px">
                        <v-sheet :id="'card1_' + element.id" class="d-flex justify-space-between align-center todo-card pa-1" color="white"
                          @mousedown="selectCard(element)" @click="selectCheck(element)" width="300px" height="140px">
                          <VCheckbox true-value="Y" false-value="N" v-model="element.IS_CHECK" />
                          <i-textarea v-model="element.UNIT_NM" :row="6" width="270px" margin="0px" :readonly="readonlyYn"/>
                        </v-sheet>
                      </v-sheet>
                      <v-sheet class="d-flex flex-column ml-1">
                        <!-- 중분류 -->
                        <draggable v-model="element.child" :options="dragOptions" @start="onDragStart" @end="onDragEnd" item-key="id">
                          <template #item="{ element }"> 
                            <div v-if="element.STATUS == 'C' || element.STATUS == 'U'" class="d-flex">
                              <v-sheet class="d-flex flex-column" width="300px">
                                <v-sheet :id="'card2_' + element.id" class="d-flex flex-column todo-card pa-1"
                                  @mousedown="selectCard(element)" @click="selectCheck(element)"
                                  color="white">
                                  <!-- 여기 밑에 중분류 컴포넌트-->
                                  <v-sheet class="d-flex align-center" height="50px">
                                    <VCheckbox label="작업행동" true-value="Y" false-value="N" v-model="element.IS_CHECK"/>
                                  </v-sheet>
                                  <i-textarea v-model="element.ACT_NM" :row="3" width="270px" margin="0px" :readonly="readonlyYn"/>
                                  <i-textarea v-model="element.CHK_NM" :row="3" width="270px" margin="0px" label="체크정보" :readonly="readonlyYn" />
                                  
                                </v-sheet>
                              </v-sheet>
                              <v-sheet class="d-flex flex-column ml-1" width="1210px"> 
                                <!-- 소분류 -->
                                <draggable v-model="element.child" :options="dragOptions" @start="onDragStart" @end="onDragEnd" item-key="id">
                                  <template #item="{ element }">
                                    <div v-if="element.STATUS == 'C' || element.STATUS == 'U'" class="d-flex todo-card"
                                    :class="(element.BEFOR_MAT * element.BEFOR_FRE) > 8 && ((element.BEFOR_MAT * element.BEFOR_FRE) <= (element.AFTER_MAT * element.AFTER_FRE)) ? 'box-highlight' : ''"
                                    :id="'card3_' + element.id" @mousedown="selectCard(element)" @click="selectCheck(element)">
                                        <!-- 여기 밑에 소분류 컴포넌트-->
                                        <!-- {{ element.text }} -->

                                        <v-sheet class="d-flex flex-column pa-1" width="400px" color="white">
                                          <v-sheet class="d-flex align-center" height="50px">
                                            <VCheckbox label="위험요인" true-value="Y" false-value="N" v-model="element.IS_CHECK"/>
                                          </v-sheet>
                                          <v-sheet class="d-flex justify-space-between">
                                            <VTextField 
                                              label="분류"
                                              v-model="element.RISK_CD_P_NM"
                                              variant="underlined"                                              
                                              :readOnly="textReadOnly"                                              
                                            />
                                            <VTextField
                                              class="ml-2"
                                              v-model="element.RISK_CD_D_NM" 
                                              :readOnly="textReadOnly" 
                                              variant="underlined" 
                                            />
                                          </v-sheet>
                                          <i-textarea v-model="element.RISK_NM" :row="3" width="98%" margin="0px" label="위험요인 상세내용" :readOnly="textReadOnly" />
                                        </v-sheet>
                                        <v-sheet class="d-flex flex-column pa-1 ml-1" width="400px" color="white">
                                          <v-sheet class="d-flex justify-space-between align-center" height="50px">
                                            <VAutocomplete
                                              width="125px"
                                              v-model="element.BEFOR_FRE" 
                                              :items="codeList.BEFOR_TYPE"
                                              item-title="TXT"
                                              item-value="COD"
                                              @update:modelValue="v => changeFreMatEvent('BEFOR', 'FRE', element, v)"
                                              :readOnly="textReadOnly"
                                            />
                                            <VAutocomplete
                                              width="125px"
                                              class="ml-2"
                                              v-model="element.BEFOR_MAT"   
                                              :items="codeList.BEFOR_TYPE"
                                              item-title="TXT"
                                              item-value="COD"
                                              @update:modelValue="v => changeFreMatEvent('BEFOR', 'MAT', element, v)"
                                              :readOnly="textReadOnly"
                                            />
                                            <VTextField
                                              width="125px"
                                              class="ml-2"
                                              :class="getColor('BEFOR', element)"
                                              :bg-color="riskColor('BEFOR', element)" 
                                              v-model="element.BEFOR_TOTAL" 
                                              variant="underlined" 
                                              readonly
                                            />
                                          </v-sheet>
                                          <v-sheet class="d-flex justify-space-between align-center">
                                            <VTextField   
                                              label="분류"
                                              v-model="element.RM_CD_P_NM"
                                              variant="underlined"
                                              :readOnly="textReadOnly"                                             
                                            />
                                            <VTextField
                                              class="ml-2"
                                              v-model="element.RM_CD_D_NM" 
                                              :readOnly="textReadOnly" 
                                              variant="underlined" 
                                            />
                                          </v-sheet>
                                          <v-sheet>
                                          </v-sheet>
                                        </v-sheet>
                                        <v-sheet class="d-flex flex-column pa-1 ml-1" width="400px" color="white">
                                          <v-sheet class="d-flex justify-space-between align-center" height="50px">
                                            <VAutocomplete
                                              width="125px"
                                              v-model="element.AFTER_FRE" 
                                              :items="codeList.BEFOR_TYPE2"
                                              item-title="TXT"
                                              item-value="COD"
                                              @update:modelValue="v => changeFreMatEvent('AFTER', 'FRE', element, v)"
                                              :readOnly="textReadOnly"
                                            />
                                            <VAutocomplete
                                              width="125px"
                                              class="ml-2"
                                              v-model="element.AFTER_MAT"   
                                              :items="codeList.BEFOR_TYPE2"
                                              item-title="TXT"
                                              item-value="COD"
                                              @update:modelValue="v => changeFreMatEvent('AFTER', 'MAT', element, v)"
                                              :readOnly="textReadOnly"
                                            />
                                            <VTextField 
                                              width="125px"
                                              class="ml-2"
                                              :class="getColor('AFTER', element)"
                                              :bg-color="riskColor('AFTER', element)" 
                                              v-model="element.AFTER_TOTAL" 
                                              variant="underlined" 
                                              readonly
                                            />
                                          </v-sheet>
                                          <i-textarea v-model="element.RM_NM" :row="3" width="98%" margin="0px" label="감소대책 상세내용" :readOnly="textReadOnly"/>                                          
                                          <v-sheet height="46px">
                                          </v-sheet>
                                        </v-sheet>
                                    </div>
                                  </template>
                                </draggable>
                              </v-sheet>
                            </div>
                          </template>            
                        </draggable>
                      </v-sheet>
                  </div>
                </template>
              </draggable> 
            </div>
            <v-sheet class="d-flex flex-column">
              <IGridTitle :title="$t('위험성평가 위원회 회의 이력')">
              </IGridTitle>
              <v-sheet height="300px">
                <RealGrid
                  ref="grdHistory"
                  :grid-view-option="grdHistoryProps.gridViewOption"
                  :keys="grdHistoryProps.keys" 
                  :fields="grdHistoryProps.fields"
                  :columns="grdHistoryProps.columns" 
                />
              </v-sheet>
            </v-sheet>
          </div>
        </v-sheet>
        <v-sheet v-show="tab == 'tab3'" class="h-auto">
          <div class="h-grow">
            <v-sheet width="50%" class="pa-0 content-area-tab-3 mr-3"
                  ref="reporttreeScroll"
                  id="reporttreeScroll">
              <RealGrid
                ref="grdSub"
                :is-tree="true" 
                :gridViewOption="grdSubProps.gridViewOption"
                :fields="grdSubProps.field"
                :columns="grdSubProps.columns"
                @onCellClicked="grdSub_onCellClicked"
              />
            </v-sheet>
            <v-sheet width="50%" class="pa-0 pr-1 content-area-tab-3"
                  ref="reportlistScroll"
                  id="reportlistScroll">
              <div class="d-flex flex-column fill-height">
                <div class="pa-2 report-card-1"
                        v-for="unit in rptList.unitList" :key="unit.RNUM">
                  <div :id="unit.CHLD_ID + 'SCR'" class="pa-0">
                    <h1
                      v-if="screenWidth > 600" 
                      :class="dataStatusStyle('unit', unit)"
                    >
                      {{ unit.RNUM }}. [단위작업]
                      {{ unit.KOR_NM }}
                    </h1>  
                    <h3
                      v-if="screenWidth < 600" 
                      :class="dataStatusStyle('unit', unit)"
                    >
                      {{ unit.RNUM }}. [단위작업]
                      {{ unit.KOR_NM }}
                    </h3>
                  </div>
                  <div 
                    v-for="act in getchildList('ACT', unit.CHLD_ID)"
                    :key="act.RNUM">
                    <div :id="act.CHLD_ID + 'SCR'" class="pa-2 report-card-2">
                      <h2
                        v-if="screenWidth > 600" 
                        :class="dataStatusStyle('act', act)"
                      >
                        {{ act.RNUM }}) [작업행동]
                        {{ act.KOR_NM }}
                      </h2>
                      <h2
                        v-if="screenWidth > 600 && act.CHK_NM"  
                        :class="dataStatusStyle('act', act)"                                  
                      >
                        <div
                        v-if="act.CHK_NM !== null || act.CHK_NM !== undefined" 
                        v-html="replaceText('chk', act.CHK_NM)"
                        ></div>
                      </h2>
                      <h4
                        v-if="screenWidth < 600"
                        :class="dataStatusStyle('act', act)"
                      >
                        {{ act.RNUM }}) [작업행동]
                        {{ act.KOR_NM }}
                      </h4>
                      <h4
                        v-if="screenWidth < 600 && act.CHK_NM" 
                        :class="dataStatusStyle('act', act)"
                        >
                        <div
                        v-if="act.CHK_NM !== null"
                        v-html="replaceText('chk', act.CHK_NM)"
                        ></div>
                      </h4>
                    </div>                    
                    <div style="display: inline-block;" v-for="(item, idx) in imgUrlTemp" :key="item.FILE_ID">
                      <div v-if="act.FILE_ID === item.FILE_ID" class="pa-2">
                      <VImg width="150px" height="150px" :src="item.src" class="object-fit-cover" />
                      <div>{{ item.TITLE }}</div>    
                      </div>
                    </div> 
                    <div class="pa-2 report-card-3"
                      v-for="risk in getchildList('RISK', act.CHLD_ID)"
                      :key="risk.RNUM">
                      <h2
                        v-if="screenWidth > 600"
                        style="color:red;"
                        :class="dataStatusStyle('risk', risk)"                                         
                      >
                        [위험요인]
                        {{ risk.KOR_NM }}
                      </h2>
                      <h2
                        v-if="screenWidth > 600 && risk.CHK_NM"
                        style="color:green;"
                        :class="dataStatusStyle('risk', risk)"
                      >
                      <div
                        v-if="risk.CHK_NM !== null"
                        v-html="replaceText('rm', risk.CHK_NM)"
                      ></div>
                      </h2>
                      <h4
                        v-if="screenWidth < 600"
                        :class="dataStatusStyle('risk', risk)"
                        style="color:red;"
                      >
                        [위험요인]
                        {{ risk.KOR_NM }}
                      </h4>
                      <h4
                        v-if="screenWidth < 600 && risk.CHK_NM"
                        style="color:green;"
                        :class="dataStatusStyle('risk', risk)"
                      >
                      <div
                        v-if="risk.CHK_NM !== null"
                        v-html="replaceText('rm', risk.CHK_NM)"
                      ></div>
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
    <RSKBA0010popup1 ref="rSKBA0010popup1" @selected="OnSelectedGubun" />    
    <RSKBA0010popup2 ref="rSKBA0010popup2" @selected="OnSelectedFactors" /> 
    <RSKBA0010popup3 ref="rSKBA0010popup3" @selected="OnSelectedReduction" />     
    <RSKBA0010popup4 ref="rSKBA0010popup4" @selected="OnSelectedCopy" />             
    <RSKBA0010popup5 ref="rSKBA0010popup5" @selected="OnSelectedSago" />
    <RSKBA0010popup6 ref="rSKBA0010popup6" />
    <VDialog
      v-model="dialog"
      eager
      persistent
      width="1700"
      height="1000" 
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
      <div class="title-bar" @mousedown="startDragging">수시위험성 평가조회</div>
      <RSKCA0010 ref="rSKCA0010popup7" :menuId="'RSKBA0010'" @selected="OnSelectedSusi" /> 
    </VDialog>
    <VDialog
      v-model="dialogSAFAB0020"
      width="1800"
      height="850"
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
    <div class="title-bar" @mousedown="startDragging">안전사고</div>
      <SAFAB0020 dialog="Y" :val1="WORK_STANDARD_MASTER" :half="getHalfDate()" @close="dialogSAFAB0020 = false"/> 
    </VDialog>
    <VDialog
      v-model="dialogSAFCA0010"
      width="1800"
      height="1000"
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
    <div class="title-bar" @mousedown="startDragging">현장위험성평가</div>
      <SAFCA0010 dialog="Y" :val1="WORK_STANDARD_MASTER" :half="getHalfDate()" @close="dialogSAFCA0010 = false"/> 
    </VDialog>
    <VDialog
      v-model="dialogSAFEA0010"
      width="1800"
      height="800"
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
    <div class="title-bar" @mousedown="startDragging">안전작업 요구권</div>
      <SAFEA0010 ref="rSAFEA0010" dialog="Y" :val1="WORK_STANDARD_MASTER" :half="getHalfDate()" @close="dialogSAFEA0010 = false"/> 
    </VDialog>
    <VDialog
      v-model="dialogSRMAA0030"
      width="1800"
      height="800"
      class="draggable-dialog"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
    >
    <div class="title-bar" @mousedown="startDragging">리스크 통합관리 현황</div>
      <SRMAA0030 dialog="Y" :val1="WORK_STANDARD_MASTER" :half="getHalfDate()" @close="dialogSRMAA0030 = false"/> 
    </VDialog>
    
    <IUploadPopup ref="fileUploadPopup"
      :isVisibled="false"
    />     
    <IUploadPopupEdu ref="fileUploadEduPopup" :isVisibled="false"/>   
    
    <OZReport 
      :showPop="showOz" 
      :reportName="reportName" 
      :params="params" 
      @close="showOz = $event" 
    />
    <OZReport 
      :showPop="showOzDetail" 
      :reportName="reportName" 
      :params="params" 
      @close="showOzDetail = $event" 
    />
  </div>
</template>

<style scoped lang="scss">

.input-border::v-deep(.v-input__control) {
  border: 1px solid darkblue;
}

.content-area {
  position: relative;
  height: calc(100vh - 180px);
  //overflow-y: auto;
  > div {
    min-height: 600px;
  }
}

.content-area-tab {
  position: relative;
  height: calc(100vh - 180px - 40px);
  overflow-y: auto;
  > div {
    min-height: 600px;
  }
}
.content-area-tab-3 {
  position: relative;
  height: calc(100vh - 180px - 47px);
  overflow-y: auto;
  > div {
    min-height: 600px;
  }
}

// .v-text-field {
//   font-size: 13px;
// }

.colorGreen {
  background-color: green;
}
.colorGreenYellow {
  background-color: greenyellow;
}
.colorOrange {
  background-color: orange;
}
.colorRed {
  background-color: red;
}

.scroll1280 {
  max-height: 660px;
  width: 100%;
  height: 660px;
}

.scroll1920 {
  max-height: 835px;
  width: 100%;
  height: 835px;
}

.report-card-1 {
  border-radius: 3px;
  border: 1px solid #D5D5D5; 
}

.report-card-1:not(:first-child) {
  margin-top: 8px;
}

.report-card-2 {
  border-radius: 3px;
  border: 1px solid #D5D5D5;
  margin-top: 8px;
  margin-left: 8px;
}

.report-card-3 {
  border-radius: 3px;
  border: 1px solid #D5D5D5; 
  margin-top: 8px;
  margin-left: 16px;
}


.object-fit-cover {
  object-fit: cover;
}

/***  세부내용  ***/
.todo-item {
  // border-top: 2px solid #ccc;
  // padding: 3px;
  // margin:2px;
  cursor: grab;
}

.todo-card {  
  /* margin-right: 10px;
  margin-bottom: 10px; */
  margin-top:2px;
  margin-bottom:2px;
}

.todo-item button {
  cursor: pointer;
}

.selected-draggable {
  background-color: #F4F5F9;
  border: 1px solid blue;
} 

 .selected-card {
  background-color: #F4F5F9;
  border: 1px solid blue;
} 

table {
  width: 100%;
  // height: 100%;
  border-collapse: collapse;
}

th {
  border: 1px solid #b4b1b1;
  font-size: 15px;
}

td {
  border: 1px solid #b4b1b1;
  text-align: center;
}

tr.tr-header {
  height: 10px;
}

tr.tr-data {
   height: calc(100% - 80px);
}

.exp-panel-border {
  border : 1px solid rgb(88, 88, 175);
  box-shadow: none;
}

.setOverFlow {
  min-height: 500px;
  max-height: 500px;
  overflow: overlay;
}

.text_underline {
  text-decoration: underline;
  line-height: 1.5rem;
}

.text_none {
  text-decoration: none;
  line-height: 1.5rem;
}

h5 {
  text-align: center;
}

h1 {
  line-height: 2rem !important;
}

@keyframes blink {
  0%, 100% {
    background-color: #F7F7F7;
  }
  50% {
    background-color: #abb0ff;
  }
}
.light {
  animation: blink 1s infinite;
  border-radius:50px;
}

.box-highlight.show-color {
  border: 1px solid red;
}

::v-deep(.check-font) {
  .v-label {
    font-size: 20px !important;
  }
}

::v-deep(.risk-color-black) {
  .v-field__field {
    color: black;
  }
}

::v-deep(.risk-color-white) {
  .v-field__field {
    color: white;
  }
}

</style>
