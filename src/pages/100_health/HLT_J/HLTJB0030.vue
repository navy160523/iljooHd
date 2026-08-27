<!-- 
  화면명 : 난청 신청, 결과 관리
  화면개요 : 난청 신청, 결과 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonLogExecuteApi, getCompanyList } from '@hiway/api/commonApi'
import { useRoute, useRouter } from 'vue-router'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import HLTJB0030Popup01 from '@/pages/100_health/HLT_J/HLTJB0030Popup01.vue'
import HLTJB0030Popup02 from '@/pages/100_health/HLT_J/HLTJB0030Popup02.vue'
import HLTJB0030Popup03 from '@/pages/100_health/HLT_J/HLTJB0030Popup03.vue'
import HLTJB0030Popup04 from '@/pages/100_health/HLT_J/HLTJB0030Popup04.vue'
import HLTJB0030Popup05 from '@/pages/100_health/HLT_J/HLTJB0030Popup05.vue'

defineOptions({
  name:'100_health-HLT_J-HLTJB0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const router = useRouter() 

// 첨부파일 버튼 리스트
const buttonList = reactive(['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose'])

const isAdmin = ref(0)
const empPopup = ref(null)
const fileUploadPopup = ref(null)
const hltjb0030Popup01 = ref(null) // 추가,변경
const hltjb0030Popup02 = ref(null) // 사실통지
const hltjb0030Popup03 = ref(null) // 자로등록
const hltjb0030Popup04 = ref(null) // 최종제출
const hltjb0030Popup05 = ref(null) // 판정결과
const menuTitle = ref(null)
const grdMain = ref(null)
const selectedRow = ref(null)
const fileTitle = ref('')

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  EMP_NO: '',
  EMP_NM: '',
  APPLI_GUBUN: '',
  DATE_GUBUN: 'A',
  TMP_DIAGNOSIS_DATE_FROM: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
  DIAGNOSIS_DATE_FROM: '',
  TMP_DIAGNOSIS_DATE_TO: dayjs().format('YYYY-MM-DD'),
  DIAGNOSIS_DATE_TO: '',
  RETI_YN: 'N'
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  APPLI_GUBUN: [],
  HOSPITAL: [],
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴사' },
    { COD: '4', TXT: '군입영' },
  ],
  EVAL_RESULT: [],
  DATE_GUBUN: [
    { COD: 'A', TXT: '진단일'},
    { COD: 'B', TXT: '판정일'},
  ]
})

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
  // 0: 일반 사용자, 1: 직엽병관리 모듈 담당자
  if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTJ001') || userStore.authGrpCd.includes('GRP00372')) isAdmin.value = 2
  else if (userStore.authGrpCd.includes('GRP00387') || userStore.authGrpCd.includes('GRP00389') || userStore.authGrpCd.includes('HLTJ002')) isAdmin.value = 1
  else isAdmin.value = 0

  searchParams.DATE_GUBUN = 'A'
  onButtonsClick({ id: 'btnSearch' })

  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 1,
    })
  })  
  grdMain.value.getGridView().filterPanel.visible = true

  Promise.all([
    // 회사구분
    getCompanyList(),
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y'} }),
    // 신청구분
    getCodeList('HHII820A'),
    // 판정결과
    getCodeList('HHII820I'),
  ]).then((res) => {
    codeList.COMPANY = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.APPLI_GUBUN = res[3].ORESULT_CUR
    codeList.EVAL_RESULT = res[4].ORESULT_CUR

    codeList.APPLI_GUBUN = codeList.APPLI_GUBUN.filter(item => item.TXT.replaceAll(' ', '') != '직접입력')
    codeList.APPLI_GUBUN.unshift({ TXT : '전체', COD : '' })
    grdMain.value.setBindingColumn('HLD_OFFI_GBN', codeList.HLD_OFFI_GBN, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EVAL_RESULT', codeList.EVAL_RESULT, 'COD', 'TXT')

    codeList.COMPANY.unshift({ TXT: '전체', COD: ''})
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: ''})
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
  })
})

//그리드 속성셋팅 
const grd1Props = reactive({ 
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }, header: { height: 75 }},
  keys : [], 
  fields : [ 
    { fieldName: 'EMP_NO', width: '80', editable: false, dataType: 'text', header: { text: t('사번') },  mergeRule: { criteria: 'values["EMP_NO"] + value' }},
    { fieldName: 'BSNS_NM', width: '80', editable: false, dataType: 'text', header: { text: t('사업부') },  mergeRule: { criteria: 'values["EMP_NO"] + value' }, lookupDisplay: true },
    { fieldName: 'DEPT_NM', width: '120', editable: false, dataType: 'text', header: { text: t('부서') },  mergeRule: { criteria: 'values["EMP_NO"] + value' }, lookupDisplay: true},
    { fieldName: 'GWA_NM', width: '80', editable: false, dataType: 'text', header: { text: t('과') },  mergeRule: { criteria: 'values["EMP_NO"] + value' }, lookupDisplay: true },
    { fieldName: 'KOR_NM', width: '80', editable: false, dataType: 'text', header: { text: t('성명') },  mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'JOB_TIT_NM', width: '80', editable: false, dataType: 'text', header: { text: t('직위') },  mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'HLD_OFFI_GBN', width: '80', editable: false, dataType: 'text', header: { text: t('재직구분') },  mergeRule: { criteria: 'values["EMP_NO"] + value' }, lookupDisplay: true },
    { fieldName: 'BIRTH_DAY', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('생년월일') },  mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'COM_ENT_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('입사일') },  mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'RETI_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('휴•퇴직일') },  mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'WORK_YEAR', width: '100', editable: false, dataType: 'text', header: { text: t('근속연수') },  mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'UNT_DUTY_NM', width: '100', editable: false, dataType: 'text', header: { text: t('직종') },  mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'APPLI_GUBUN_NM', width: '100', editable: false, dataType: 'text', header: { text: t('신청구분') }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'APPLI_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('진정일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'DIAGNOSIS_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('진단일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'CMPNY_RCPT_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('회사접수일') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'HOSPITAL_NM', width: '150', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('진단기관') }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'EAR_LEFT', width: '60', editable: false, dataType: 'text', header: { text: t('좌이') }, },
    { fieldName: 'EAR_RIGHT', width: '60', editable: false, dataType: 'text', header: { text: t('우이') }, },
    { fieldName: 'DISEASE_NM', width: '80', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('상병명') }, lookupDisplay: true },
    { fieldName: 'EXPIRATION_DATE', width: '100', editable: false, dataType: 'text', header: { text: t('유효기간') }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'WRITE', width: '80', editable: false, dataType: 'text', header: { text: t('자료등록'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"]' },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let btnValue = cell.value == 'Y' ? '완료' : '등록'
          let btnBackColor = cell.value == 'Y' ? '#1eaf1e' : '#e52b2b'
          var str = 
          `<button 
              class="v-btn" 
              style="color: #fff; background: ${btnBackColor}; padding: 4px;"
            >${btnValue}</button>`;
          return str;
        },
      }
    },
    { fieldName: 'FINAL_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('최종제출일'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'EVAL_RESULT', width: '150', editable: false, dataType: 'text', header: { text: t('판정결과'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' }, editor: { type: 'dropdown' }, lookupDisplay: true,
      renderer: {
          type: "html",
          callback: function (grid, cell, w, h) {
            let row = codeList.EVAL_RESULT.find(x => String(x.COD) === String(cell.value))
            let cellText = ''
            if(!isEmpty(row)) {
              cellText = row.TXT
            }
            let btnValue = cell.value ? '완료' : '등록'
            let btnBackColor = cell.value ? '#1eaf1e' : '#e52b2b'
            var str = 
            `${cellText}<button 
                class="v-btn ml-2" 
                style="color: #fff; background: ${btnBackColor}; padding: 4px;"
              >${btnValue}</button>`;
            return str;
          },
        }
    },
    { fieldName: 'EVAL_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('판정일'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'CLASS_NUM', width: '100', editable: false, dataType: 'text', header: { text: t('장해급수'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'REMARK', width: '150', editable: false, dataType: 'text', styleName:'left-column', header: { text: t('비고'), styleName: 'multiline-editor-pre' }, mergeRule: { criteria: 'values["EMP_NO"] + values["DIAGNOSIS_DATE"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
   
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'NOTIFY_FILE_ID', dataType: 'text', header: { text: t('통지 첨부파일ID') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') },visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('과') },visible: false, },
    { fieldName: 'STD_DUTY_NM', dataType: 'text', header: { text: t('직무') },visible: false, },
    { fieldName: 'HOSPITAL_CODE', dataType: 'text', header: { text: t('진단기관') },visible: false, },
    { fieldName: 'APPLI_GUBUN', dataType: 'text', header: { text: t('신청구분') },visible: false, },
    { fieldName: 'ADD_FILE_ID', dataType: 'text', header: { text: t('추가 첨부파일ID') },visible: false, },
    { fieldName: 'INCIDENT_CODE', dataType: 'text', header: { text: t('발생경위 코드') },visible: false, },
    { fieldName: 'INCIDENT_NM', dataType: 'text', header: { text: t('발생경위') },visible: false, },
    { fieldName: 'IDX', dataType: 'text', header: { text: t('상병IDX') },visible: false, },
    { fieldName: 'APPROVAL_STATUS', dataType: 'text', header: { text: t('결재상태') },visible: false, },
    { fieldName: 'HR_MEMO_FILE_ID', dataType: 'text', header: { text: t('인사기록부') },visible: false, },
    { fieldName: 'HR_REMARK_FILE_ID', dataType: 'text', header: { text: t('인사부서용 기타자료') },visible: false, },
    { fieldName: 'IND_MANAGE', dataType: 'text', header: { text: t('작업력평가') },visible: false, },
    { fieldName: 'AGE', dataType: 'text', header: { text: t('나이') },visible: false, },
    { fieldName: 'SEX', dataType: 'text', header: { text: t('성별') },visible: false, },
  ],
  columnLayout: [
    {
      name: '대상자 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'EMP_NO', 'BSNS_NM', 'DEPT_NM', 'GWA_NM', 'KOR_NM', 'JOB_TIT_NM', 'HLD_OFFI_GBN'],
      header: { text: t('대상자 정보') },
    },
    {
      name: '대상자 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'BIRTH_DAY', 'COM_ENT_DATE', 'RETI_DATE', 'WORK_YEAR', 'UNT_DUTY_NM' ],
      header: { text: t('대상자 정보') },
    },
    { 
      name: '신청 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 'APPLI_GUBUN_NM', 'APPLI_DATE', 'DIAGNOSIS_DATE', 'CMPNY_RCPT_DATE', 'HOSPITAL_NM', 'EAR_LEFT', 'EAR_RIGHT', 'DISEASE_NM', 'EXPIRATION_DATE'],
      header: { text: t('신청 정보') },
    },
    {
      name: '자료 제출',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 
        'WRITE',
        'FINAL_DATE' 
      ],
      header: { text: t('자료 제출') },
    },
    {
      name: '결과 정보',
      styleName: 'multiline-editor-pre',
      direction: 'horizontal',
      items: [ 
        'EVAL_RESULT',
        'EVAL_DATE',
        'CLASS_NUM',
        'REMARK'
      ],
      header: { text: t('결과 정보') },
    }
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(isAdmin.value == 0) {
    return Message.warn(t('권한이 없습니다.'))
  }

  if (btn.id === 'btnSearch') {
    // 조회
    getData()
  } else if (btn.id === 'btnCreate') {
    // 추가
    if(isAdmin.value < 2) {
      return Message.warn('관리자만 사용가능합니다.')
    }
    hltjb0030Popup01.value.openPopup(null)
  } else if (btn.id === 'btnDelete') { 
    // 삭제
    if(isAdmin.value < 2) {
      return Message.warn('관리자만 사용가능합니다.')
    }
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    for (let rowIdx of checkRow) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      if(!isEmpty(data.FINAL_DATE)) {
        return Message.warn('최종제출한 항목은 삭제할 수 없습니다.')
      }
    }    

    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()

  // 2025.10.01 사실통지 삭제요청(임은희 책임님)
  //
  // } else if (btn.id === 'btnNoticeFact') {
  //   if(isAdmin.value < 2) {
  //     return Message.warn('관리자만 사용가능합니다.')
  //   }
  //   // 사실통지
  //   let checkRow = grdMain.value.getGridView().getCheckedRows(true)
  //   let rowList = []
  //   let diseaseList = []

  //   for (let rowIdx of checkRow) {
  //     let dt = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  //     let sameList = rowList.filter(item => item.CMPNY_DIV == dt.CMPNY_DIV && 
  //       item.EMP_NO == dt.EMP_NO && 
  //       dayjs(item.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') &&
  //       item.HOSPITAL_CODE == dt.HOSPITAL_CODE && 
  //       item.HOSPITAL_NM == dt.HOSPITAL_NM)
  //     if(isEmpty(sameList)) {
  //       rowList.push(dt)
  //     } 
  //     diseaseList.push(dt.DISEASE_NM)
  //   }

  //   if(isEmpty(rowList)) {
  //     return Message.warn(t('하나의 데이터를 클릭하셔야 합니다.'))
  //   } else if(rowList.length > 1) {
  //     return Message.warn(t('한개의 데이터만 클릭하셔야 합니다.'))
  //   } else if(!isEmpty(rowList[0].FINAL_DATE)) {
  //     return Message.warn(t('이미 최종제출이 완료되었습니다.'))
  //   }
  //   rowList[0].DISEASE_NM = [...new Set(diseaseList)].join(", ")
  //   hltjb0030Popup02.value.openPopup(rowList[0])


  } else if (btn.id === 'btnFinalSubmit') {
    if(isAdmin.value < 2) {
      return Message.warn('관리자만 사용가능합니다.')
    }
    // 최종제출
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    let rowList = []

    for (let rowIdx of checkRow) {
      let dt = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      let sameList = rowList.filter(item => item.CMPNY_DIV == dt.CMPNY_DIV && 
        item.EMP_NO == dt.EMP_NO && 
        dayjs(item.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') &&
        item.HOSPITAL_CODE == dt.HOSPITAL_CODE && 
        item.HOSPITAL_NM == dt.HOSPITAL_NM)
      if(isEmpty(sameList)) {
        rowList.push(dt)
      }  
    }
    if (isEmpty(rowList)) {
      return Message.warn(t('하나의 데이터를 클릭하셔야 합니다.'))
    } else if (rowList.length > 1) {
      return Message.warn(t('한개의 데이터만 클릭하셔야 합니다.'))
    }

    hltjb0030Popup04.value.openPopup(rowList[0])
  }
}

// 그리드 데이터 조회
const getData = () => {
  if(isAdmin.value == 0) {
    return Message.warn(t('권한이 없습니다.'))
  }

  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  searchParams.DIAGNOSIS_DATE_FROM = searchParams.TMP_DIAGNOSIS_DATE_FROM.replaceAll('-','')
  searchParams.DIAGNOSIS_DATE_TO = searchParams.TMP_DIAGNOSIS_DATE_TO.replaceAll('-','')
  return commonSearchApi({ queryId: 'HLTJB0030_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 개인정보 조회 로그 남기기
  let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '[난청 신청/결과 관리] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}


const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    data.DIAGNOSIS_DATE = dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD')
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTJB0030_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

//팝업 선택 이벤트
const onEmpSelected = val => {
  searchParams.EMP_NO = val.EMP_NO
  searchParams.EMP_NM = val.EMP_NM
  onButtonsClick({ id: 'btnSearch'})
}

const openEmpPopup = () => {
  if(isAdmin.value < 2) {
    return Message.warn(t('권한이 없습니다. 보건관리팀 담당자에게 문의하세요.'))
  }

  empPopup.value.openPopup({MENU_ID: 'HLTJB0030', USER_DIV: 'A', FLAG: 'Y', readonly: true})
}

const clearEmp = () => {
  if(isAdmin.value < 2) {
    return Message.warn(t('권한이 없습니다. 보건관리팀 담당자에게 문의하세요.'))
  }

  searchParams.EMP_NO = ''
  searchParams.EMP_NM = ''
  onButtonsClick({ id: 'btnSearch'})
}

const onCellItemClicked = (grid, index, col) => {
  // 관리자 아닐 시 return
  if(isAdmin.value == 0) {
    return Message.warn(t('권한이 없습니다. 보건관리팀 담당자에게 문의하세요.'))
  }
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if (col.target.className.includes('v-btn') && col.column === 'WRITE') {
    selectedRow.value = index.dataRow
    hltjb0030Popup03.value.openPopup(data)
  }
  if (col.target.className.includes('v-btn') && col.column === 'EVAL_RESULT') {
    hltjb0030Popup05.value.openPopup(data)
  } 
}

// 체크박스 클릭
const onItemChecked = (grid, itemIndex, checked) => {
  let data = grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getDataRow(itemIndex))
  for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0,-1).length; i++) {
    let dt = grdMain.value.getDataProvider().getJsonRow(i)
    if(i == grdMain.value.getGridView().getDataRow(itemIndex)) {
      continue
    }
    if(data.CMPNY_DIV == dt.CMPNY_DIV && data.EMP_NO == dt.EMP_NO && dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') && data.HOSPITAL_CODE == dt.HOSPITAL_CODE && data.HOSPITAL_NM == dt.HOSPITAL_NM) {
      grdMain.value.getGridView().checkRow(i, checked, false, false)
    }
  }
}

// 자료등록, 인사부서 모든 파일 업로드 시
const allRegister = () => {
  let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // 같은 사건은 모두 다같이 업데이트
  for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0,-1).length; i++) {
    let dt = grdMain.value.getDataProvider().getJsonRow(i)
    if(data.CMPNY_DIV == dt.CMPNY_DIV && data.EMP_NO == dt.EMP_NO && dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') && data.HOSPITAL_CODE == dt.HOSPITAL_CODE && data.HOSPITAL_NM == dt.HOSPITAL_NM) {
      grdMain.value.getDataProvider().setValue(i, 'WRITE', 'Y')
    }
  }
}

// 자료등록, 인사부서 하나라도 삭제 시
const fileDelete = () => {
  let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // 같은 사건은 모두 다같이 업데이트
  for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows(0,-1).length; i++) {
    let dt = grdMain.value.getDataProvider().getJsonRow(i)
    if(data.CMPNY_DIV == dt.CMPNY_DIV && data.EMP_NO == dt.EMP_NO && dayjs(data.DIAGNOSIS_DATE).format('YYYYMMDD') == dayjs(dt.DIAGNOSIS_DATE).format('YYYYMMDD') && data.HOSPITAL_CODE == dt.HOSPITAL_CODE && data.HOSPITAL_NM == dt.HOSPITAL_NM) {
      grdMain.value.getDataProvider().setValue(i, 'WRITE', '')
    }
  }
}

// 해당 직원 정보 및 상병명 상세 보기
const onCellDblClicked = (grid, clickData) => {
  // 관리자 아닐 시 return
  if(isAdmin.value < 2) {
    return Message.warn(t('권한이 없습니다. 보건관리팀 담당자에게 문의하세요.'))
  }

  const rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  // 결재상신 했을시 읽기 전용으로 보여주기
  // 2025.09.17 최종제출일때만 읽기전용으로
  if(!isEmpty(rowData.FINAL_DATE)) {
    rowData.ONLY_VIEW = true
  }
  
  hltjb0030Popup01.value.openPopup(rowData)
}

// 최종제출 후 최종제출일에 날짜 투입
const sendFinal = (data) => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(isEmpty(checkedRows)) {
    return 
  }
  // 같은 사건은 모두 다같이 업데이트
  for(let chk of checkedRows) {
    grdMain.value.getDataProvider().setValue(chk, 'FINAL_DATE', dayjs(data.FINAL_DATE).format('YYYY-MM-DD'))
    grdMain.value.getDataProvider().setValue(chk, 'EVAL_RESULT', data.EVAL_RESULT)
    grdMain.value.getDataProvider().setValue(chk, 'EVAL_DATE', dayjs(data.EVAL_DATE).format('YYYY-MM-DD'))
    grdMain.value.getDataProvider().setValue(chk, 'CLASS_NUM', data.CLASS_NUM)
    grdMain.value.getDataProvider().setValue(chk, 'REMARK', data.REMARK)
  }
}

// 회사구분 변경 이벤트
watch(() => searchParams.CMPNY_DIV, (newValue) => {
  searchParams.BSNS_CD = ''
  Promise.all([
    // 부서
    commonSearchApi({ queryId: 'HLTJB0030_SEARCH_BSNS', param: { CMPNY_DIV: newValue, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({BSNS_NM: '전체', BSNS_CD: ''})
  })
})

watch(() => searchParams.BSNS_CD, (newValue) => {
  searchParams.DEPT_CD = ''
  if(isEmpty(newValue)) {
    codeList.DEPT_CD = [
      {DEPT_NM: '전체', DEPT_CD: ''}
    ]
    return
  }
  Promise.all([
    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
  })
})

watch(() => [searchParams.APPLI_GUBUN, searchParams.DATE_GUBUN], (newValue, oldValue) => {
  getData()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnDelete', 'btnFinalSubmit']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.CMPNY_DIV"
            :label="$t('회사구분')"
            label-width="50px"
            :items="codeList.COMPANY"
            item-value="COD"
            item-title="TXT" 
            width="200px"
            :readonly="isAdmin < 2"
          />
          <i-select
            v-model="searchParams.BSNS_CD"
            :label="$t('사업부')"
            label-width="50px"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM" 
            width="200px"
            :readonly="isAdmin < 2 || isEmpty(searchParams.CMPNY_DIV)"
          />
          <i-select
            v-model="searchParams.DEPT_CD"
            :label="$t('부서')"
            label-width="50px"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM" 
            width="200px"
            :readonly="isAdmin < 2 || isEmpty(searchParams.BSNS_CD)"
          />
          <i-input
              v-model="searchParams.EMP_NM"
              :label="$t('신청인')"
              label-width="50px"
              width="200px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openEmpPopup"
              @keydown.enter="openEmpPopup"
              :readonly="isAdmin < 2"
            >
              <template #append-inner>
                <v-icon
                  icon="mdi-window-close"
                  @click="clearEmp"
                />
              </template>
          </i-input>
          <i-select
            v-model="searchParams.APPLI_GUBUN"
            :label="$t('신청구분')"
            label-width="50px"
            :items="codeList.APPLI_GUBUN"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />

          <i-select
            v-model="searchParams.DATE_GUBUN"
            :label="$t('기간구분')"
            label-width="50px"
            :items="codeList.DATE_GUBUN"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-input
            v-model="searchParams.TMP_DIAGNOSIS_DATE_FROM"
            label-width="20px"
            :label="$t('')"
            type="date"
            width="150px"
            class="mr-2"
          />
          <i-input
            v-model="searchParams.TMP_DIAGNOSIS_DATE_TO"
            label-width="20px"
            :label="$t('~')"
            type="date"
            width="180px"
          />
          <v-checkbox
            v-model="searchParams.RETI_YN"
            :label="$t('퇴직포함')"
            true-value="Y" 
            false-value="N"
            class="mt-1"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onItemChecked="onItemChecked"
            @onCellItemClicked="onCellItemClicked"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
    <IUploadPopup ref="fileUploadPopup" :gridTitle="fileTitle" :buttonList="buttonList" />
    <HLTJB0030Popup01 ref="hltjb0030Popup01" @after-search="getData"/>
    <!-- 2025-10-01 사실통지 삭제 요청-->
    <!-- <HLTJB0030Popup02 ref="hltjb0030Popup02" @send-notify="sendNotify"/> -->
    <HLTJB0030Popup03 ref="hltjb0030Popup03" @all-register="allRegister" @delete="fileDelete"/>
    <HLTJB0030Popup04 ref="hltjb0030Popup04" @send-final="sendFinal"/>
    <HLTJB0030Popup05 ref="hltjb0030Popup05" @after-search="getData"/>
  </v-card>
</template>
  
<style scoped lang="scss">

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