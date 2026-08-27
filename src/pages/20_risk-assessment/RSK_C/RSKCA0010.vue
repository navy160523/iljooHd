<!--
  화면명 : 수시 위험성평가 등록/현황
  화면개요 : 메인 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import SelectAddEmpPopup from '@/pages/20_risk-assessment/RSK_C/Popup/RSKCA0010Popup01.vue'
import FileUpload from '@/pages/20_risk-assessment/RSK_C/Popup/RSKCA0010Popup02.vue'
import Discript from '@/pages/20_risk-assessment/RSK_C/Popup/RSKCA0010Popup03.vue'
import RskAddPopup from '@/pages/20_risk-assessment/RSK_C/Popup/RSKCA0010Popup04.vue'
import SelectDeptPopup from '@/components/popup/DeptPopup.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'

// 리포트 팝업
import OZReport from "@/components/OZReport.vue"
import draggable from 'vuedraggable'
import _ from 'lodash'
import { watch } from 'vue'

defineOptions({
  name:'20_risk-assessment-RSK_C-RSKCA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const t = useI18n().t                 //다국어
const menuTitle = ref(null)
const searchArea = ref(null)
const emit = defineEmits(["selected"])
const { sliRSKCA0010 } = history.state
const imgUploadPopup = ref(null)
const isMounted = ref(
  sliRSKCA0010 === undefined ? true : false
)
const sItem = ref(null)

const currentGrdData = ref({})      // 그리드에서 선택한 행의 데이터
const currentClickData = ref(null)  // 선택한 단위작업 데이터
const currentRiskData = ref(null)   // 선택한 위험요인 데이터

// 팝업
const selectAddEmpPopup = ref(null)  // 참석자 선택
const fileUpload = ref(null)         // 파일 업로드
const selectDeptPopup = ref(null)    // 부서 선택
const discript = ref(null)
const locationPopup = ref(null)
const rskAddPopup = ref(null)

// 리포트
const reportName = ref("/manage/hse/RSKCA0010_v2.ozr")
const params = ref([])
const showOz = ref(false)

// 그리드
const grdMain = ref(null)
const grdClickIndex = ref(null)

// 결재
const refApprovalPopup = ref(null)
const dataAprvl = ref([]) // 결재용 데이터 복사본

//조회조건
let searchParams = reactive({    
  COMPANY_CD: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  BSNS_CD: '',
  DEPT_CD: '',
  PARTNER_CD: '',
  HALF: (dayjs().get("month") + 1) <= 6 ? '1' : '2',
  USR_ID: userStore.userId,
  NROUTINE_WORK_ID: '',
})

// 코드리스트
const codeList = reactive({
  COMPANY_CD: [],
  BSNS_CD: [],
  DEPT_CD: [],
  PARTNER_CD: [],
  HALF: [
    { COD: '1', TXT: '상반기' },
    { COD: '2', TXT: '하반기' },
  ],
  RISK_LEVEL: [],
  APP_STATUS: [],
  APP_EMP_NO: [],
  CHANGE_MNG_CHK_LIST: [
    { COD: 'A', TXT: '기술 변화' },
    { COD: 'B', TXT: '설비 변화' },
    { COD: 'C', TXT: '조직 변화' },
    { COD: 'D', TXT: '환경 변화' },
    { COD: 'E', TXT: '사고 발생' },
  ],
  MAIN_RISK_LEVEL: [
    { COD: 'A', TXT: '상' },
    { COD: 'B', TXT: '중' },
    { COD: 'C', TXT: '하' },
  ],
  WORK_PERIOD: [
    { COD: 'A', TXT: '주간' },
    { COD: 'B', TXT: '야간' },
  ]
})

// 수시 위험성평가 상세항목 데이터
const rskDetail = ref([])

// 신규제정 화면에서 팝업을 오픈할 때 가져오는 데이터
const popupParmas = ref([])

const props = defineProps({
  menuId: {
    type: String
  }
})

//코드리스트 셋팅
const initCodeList = async () => {
  await Promise.all([
    // 회사 [0]
    getCompanyList(),
    
    // 사업부 [1]
    commonSearchApi({ 
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv
        , USE_DIV: 'N',
      }, 
    }),
    getCodeList("HHIORISK_LEVEL"), // 평가항목
    getCodeList("HHIORSKCA_STATUS"), //결재상태
    commonSearchApi({
      queryId: 'RSKCA0010_SEARCH_05',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ASGN_CD: userStore.asgnCd,
      }
    }),
  ]).then(res => {
    codeList.COMPANY_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.RISK_LEVEL = res[2].ORESULT_CUR
    codeList.APP_STATUS = res[3].ORESULT_CUR
    codeList.APP_EMP_NO = res[4].ORESULT_CUR
  })
  codeList.BSNS_CD.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
}

//그리드1 속성셋팅
/// !!!!!!!!!! 그리드 칼럼추가 시 주의 onCellButtonClicked, onFileSelected 인덱스 확인 !!!!!!!!!!!!!!!!!!
const grdProps1 = reactive({
  gridViewOption : { checkBar: true },
  keys : ['NROUTINE_WORK_ID'],
  fields : [ 
    { fieldName: 'WORK_NM', 
      dataType: 'text', 
      width: '135', 
      header: { text: t('작업명'), styleName: 'header_validit' }, 
      styleName: 'left-column multiline-editor',
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x        
        enterKeyBehavior: 'multiline',
      }, 
      editable: false
    },
    { fieldName: 'WORK_CONTENT', 
      width: '160', 
      dataType: 'text', 
      header: { text: t('작업내용'), styleName: 'header_validit' }, 
      styleName: 'left-column multiline-editor',      
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 150,
        enterKeyBehavior: 'multiline',
      },
      editable: false
    },
    { fieldName: 'DEPT_NM', width: '110', dataType: 'text', header: { text: t('부서') },
      //button:'action',
      //buttonVisibility: 'always',
      //buttonStyle: 'rg-button-renderer-button',
      editable: false
    },
    { fieldName: 'WORK_ASGN_NM',  dataType: 'text', header: { text: t('작업조직') }, editable: false },
    { fieldName: 'WORK_LOCATION', dataType: 'text', header: { text: t('작업장소'), styleName: 'header_validit' }, editable: false },
    { fieldName: 'INS_DT',        dataType: 'text', header: { text: t('등록일자') }, editable: false,
      displayCallback: function (grd, idx, val) {
        if (val) {
          return val.substring(0, 10) 
        }
      },
    },
    { fieldName: 'EXPECTED_ST_DT', dataType: 'text', header: { text: t('시작일'), styleName: 'header_validit' },
      editButtonVisibility: 'always',
      editor: {
        type: 'date', 
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99', 
          placeHolder: 'yyyy-MM-dd', 
          includedFormat: true 
        }
      },
      displayCallback: function(grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      editable: false
    },
    { fieldName: 'EXPECTED_ED_DT', dataType: 'text', header: { text: t('종료일'), styleName: 'header_validit' }, 
      editButtonVisibility: 'always',
      editor: {
        type: 'date', 
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99', 
          placeHolder: 'yyyy-MM-dd', 
          includedFormat: true 
        }
      },
      displayCallback: function(grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      editable: false
    },
    { fieldName: 'WORK_PERIOD', dataType: 'text', header: { text: t('작업기간') }, 
      lookupDisplay: true, 
      lookupData: { value: "COD", label: "TXT", list: codeList.WORK_PERIOD },
      editor: { type: "dropdown" }, 
      editButtonVisibility: "always",
      editable: false
    },
    { fieldName: 'MEMBERS', dataType: 'text', width: '110', editable: false, header: { text: t('참석자'), styleName: 'header_validit' },
      //button:'action', 
      //buttonVisibility: 'always', 
      //buttonStyle: 'rg-button-renderer-button',
      
      // displayCallback: function (grd, idx, val) {
      //   let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)

      //   if (data.SHOW_MEMBERS === null || data.SHOW_MEMBERS === undefined) {
      //     return ''
      //   } else {
      //     return data.SHOW_MEMBERS + (data.MEMBERS <= 0 ? '' : ' 외 ' + data.MEMBERS + '명')
      //   }
      // },
    },

    // TODO: 이정현 책임 요청으로 주석처리(2024.05.29)
    // { fieldName: 'NON_ROUTINE_WROK_REASON', dataType: 'text',styleName: 'left-column', header: { text: t('비일상작업 발생사유') } },
    // 비일상 발생사유 컬럼은 제거 후 변화관리 체크리스트, 위험성 수준, 수시 위험성평가 방법 신규 추가
    { fieldName: 'CHANGE_MNG_CHK_LIST', dataType: 'text', width: '150', sortable: false,
      header: {
        template: "<div class='align-center d-flex justify-space-around'><div class='align-center'><p class='text-center'>변화관리 체크리스트</p></div><div><button><span class='mdi mdi-help-circle text-light-blue-darken-1' /></button></div></div>",
      },
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.CHANGE_MNG_CHK_LIST },
      editor: { type: "dropdown" },
      editable: false
    },
    { fieldName: 'RISK_LEVEL', dataType: 'text', width: '100', sortable: false,
      header: {
        template: "<div class='align-center d-flex justify-space-around'><div class='align-center'><p class='text-center'>위험성 수준</p></div><div><button><span class='mdi mdi-help-circle text-light-blue-darken-1' /></button></div></div>",
      },
      editor: { type: "dropdown" },
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.MAIN_RISK_LEVEL },
      editable: false
    },
    { fieldName: 'REGULAR_RSK_METHOD', dataType: 'text', width: '170', editable: false, header: { text: t('수시 위험성평가 방법') },
      // displayCallback: function (grd, idx, val) {
      //   // 수시 위험성평가 방법은 DB에 컬럼이 없음. 위험성 수준이 변경되는 값에 따라 출력됨.
      //   let result = ''
      //   let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex) 
        
      //   if (data.RISK_LEVEL === 'A') {
      //     result = 'Table Meeting(안전 포함)'
      //   } else if (data.RISK_LEVEL === 'B') {
      //     result = 'Table Meeting(자체 수행)'
      //   } else if (data.RISK_LEVEL === 'C') {
      //     result = 'Standing Meeting' 
      //   }

      //   return result
      // },
    },

    { fieldName: 'SITE_CHECK_RESULT', 
      dataType: 'text',
      width: '160', 
      styleName: 'left-column', 
      header: { text: t('점검결과') },
      styleName: 'left-column multiline-editor',      
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 150,
        enterKeyBehavior: 'multiline',
      },
      editable: false       
    },
    { fieldName: 'FILE_COUNT', dataType: 'text', editable: false, header: { text: t('첨부파일') },
      // isFile: { value: true, align: 'right', showAlways: true }, 
      //button:'action', 
      //buttonVisibility: 'always', 
      //buttonStyle: 'rg-button-renderer-button',
      
      // displayCallback: function (grd, idx, val) {
      //   let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)

      //   return data.FILE_COUNT > 0 ? Number(data.FILE_COUNT) + '건' : ''
      // },
    },
    { fieldName: 'SAFE_INFO_WORK_TOOLS', dataType: 'text', header: { text: t('작업도구') }, editable: false },
    { fieldName: 'SAFE_INFO_WORK_EQUIPS', dataType: 'text', header: { text: t('장비 및 설비') }, editable: false },
    { fieldName: 'SAFE_INFO_WORK_CHEMI', dataType: 'text', header: { text: t('사용화학\n물질정보'), styleName: "multiline-editor" }, editable: false },
    { fieldName: 'SAFE_INFO_CONTRACOTR_REVIEWER', dataType: 'text', header: { text: t('직영부서 담당자') }, editable: false
      // button:'action', 
      // buttonVisibility: 'always', 
      // buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'EDU_FILE_COUNT', dataType: 'text', editable: false, header: { text: t('교육이수\n자료첨부'), styleName: "multiline-editor" },      
      button:'action', 
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',      
    },
    {
      fieldName: 'APP_EMP_NO', dataType: 'text', header: { text: t('결재자') },
      lookupDisplay: true, 
      lookupData: { value: 'EMP_NO', label: 'FULL_DESC', list: codeList.APP_EMP_NO },
      editor: { type: 'dropdown' }, 
      editButtonVisibility: 'always'
    },
    { fieldName: 'APP_STATUS_NM', dataType: 'text', editable: false, header: { text: t('결재상태') } },

    // 숨기는 필드 visible:'false'
    { fieldName: 'COMPANY_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'WORK_ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'NROUTINE_WORK_ID', dataType: 'text', visible: false },
    // { fieldName: 'PARYT_MEMBERS', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'EDU_FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'FILE_TITLE', dataType: 'text', visible: false },
    { fieldName: 'PARYT_MEMBERS', dataType: 'text', visible: false },
    { fieldName: 'SHOW_MEMBERS', dataType: 'text', visible: false },
    { fieldName: 'IS_SAVE', dataType: 'text', visible: false },
    { fieldName: 'INS_USR', dataType: 'text', visible: false },
    { fieldName: 'APP_KEY', dataType: 'text', visible: false },
    { fieldName: 'APP_STATUS', dataType: 'text', visible: false },
    { fieldName: 'USER_NM', dataType: 'text', visible: false },
    { fieldName: 'INS_DT2', dataType: 'text', visible: false },
  ],
  columnLayout: [
    'WORK_NM',
    'WORK_CONTENT',
    'DEPT_NM',
    'WORK_ASGN_NM',
    'WORK_LOCATION',
    'INS_DT',
    {
      name: '예상작업시간',
      direction: 'horizontal',
      items: [ 'EXPECTED_ST_DT', 'EXPECTED_ED_DT' ],
      header: { text: t('예상작업기간') },
    },
    'WORK_PERIOD',
    'MEMBERS',
    // TODO: 이정현 책임 요청으로 주석 처리
    // 'NON_ROUTINE_WROK_REASON',
    {
      name: '수시 위험성평가 대상 선정',
      direction: 'horizontal',
      items: [ 'CHANGE_MNG_CHK_LIST', 'RISK_LEVEL', 'REGULAR_RSK_METHOD' ],
      header: { text: t('수시 위험성평가 대상 선정') },
    },
    {
      name: '예상작업시간',
      direction: 'horizontal',
      items: [ 'SITE_CHECK_RESULT', 'FILE_COUNT' ],
      header: { text: t('현장점검') },
    },
    'SAFE_INFO_WORK_TOOLS',
    'SAFE_INFO_WORK_EQUIPS',
    'SAFE_INFO_WORK_CHEMI',
    'SAFE_INFO_CONTRACOTR_REVIEWER',
    'EDU_FILE_COUNT',
    'APP_EMP_NO',
    'APP_STATUS_NM',
  ],
  columns : [],
})
/// !!!!!!!!!! 그리드 칼럼추가 시 주의 onCellButtonClicked, onFileSelected 인덱스 확인 !!!!!!!!!!!!!!!!!!

grdProps1.columns = grdProps1.fields

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    // 메인 그리드 (수시 위험성평가 목록(비일상작업)) 조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
    // 수시 위험성평가 상세항목 데이터 초기화
    rskDetail.value = []
  } else if (btn.id === 'btnCreate') {
    addData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      //.setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run() 
  } else if(btn.id === 'btnReqApply') {
    reqApply()
  } else if(btn.id === 'btnApprove') {
    approve()
  } else if(btn.id === 'btnReject') {
    reject()
  }else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if (btn.id === 'btnPrint') {

    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

    if (checkedRows.length === 0) {
      return Message.warn(t('출력할 데이터를 선택해 주세요.'))
    } else if (checkedRows.length > 1) {
      return Message.warn(t('출력할 데이터는 하나만 선택해 주세요.'))
    }

    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      
      let isYear = data.INS_DT.substring(0, 4)
      let isMonth = Number(data.INS_DT.substring(5, 7))

      if (!data.NROUTINE_WORK_ID) {
        return Message.warn(t('저장 후 출력해주세요.'))
      } else {
        showOz.value = true

        params.value = [
          "IN_COMPANY_CD=" + (!data.COMPANY_CD ? '' : data.COMPANY_CD),
          "IN_DEPT_CD=" + (!data.DEPT_CD ? '' : data.DEPT_CD),
          "IN_PARTNER_CD=" + (!data.WORK_ASGN_CD ? '' : data.WORK_ASGN_CD),
          "IN_HALF=" + (isMonth >= 7 ? '2' : '1'),
          "IN_NROUTINE_WORK_ID=" + (!data.NROUTINE_WORK_ID ? '' : data.NROUTINE_WORK_ID),
          "IN_YEAR=" + (!isYear ? '' : isYear)
        ]

        console.log('params = ', params.value)
      }
    }
  } else if (btn.id === 'btnClose') {
    emit("selected", 'close') 
  }
}

const reqApply = async () => {
  //const focusedRow = grdMain.value.getFocusedRowData()

  let focusData = grdMain.value.getGridView().getCurrent().dataRow
  let focusedRow = grdMain.value.getDataProvider().getJsonRow(focusData)
  
  let asgnCdOk = ''

  if(focusedRow == null) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return
  }

  if(focusedRow.IS_SAVE !== 'Y') {
    Message.warn(t('저장 후 결재상신 가능합니다.'))
    return
  }

  if(isApproving(focusedRow)) {
    Message.warn(t(`${focusedRow.APP_STATUS_NM} 상태입니다.`))
    return
  }

  await commonSearchApi({ queryId: 'RSKCA0010_SEARCH_06', param: focusedRow }).then(res => {
    if(res.ORESULT_CUR.length > 0) {
      if(userStore.userDiv === 'A') {
        asgnCdOk = userStore.deptCd === res.ORESULT_CUR[0].DEPT_CD ? '' : '결재상신자의 부서와 저장된 비일상작업 작업부서가 다릅니다.'
      } else {
        asgnCdOk = userStore.asgnCd === res.ORESULT_CUR[0].WORK_ASGN_CD ? '' : '결재상신자의 조직과 저장된 비일상작업 작업조직이 다릅니다.'
      }
    }
  })

  if(asgnCdOk !== '') {
    Message.warn(asgnCdOk)
    return
  }

  if(userStore.userDiv === 'A') { // 직영
    const htmlForm = await infoSet(focusedRow)

    refApprovalPopup.value.openPopup({
      CLSS_ID: useLogsStore().vueId,
      TITLE: `[비일상작업 위험성평가] ${focusedRow.WORK_NM}`,
      CMPNY_DIV: userStore.cmpnyDiv,
      DATA_KEY: `${userStore.cmpnyDiv};${userStore.bsnsCd};${userStore.deptCd};${userStore.asgnCd};${new Date().getFullYear()}`,
      REPORT: htmlForm,
      MODE: '3',
      FORM_ID: '421',
      CLRLINE: 'CLR_16',
    })
  } else { // 협력사
    // console.log('focusedRow.APP_EMP_NO', focusedRow.APP_EMP_NO)

    if(nullToSpace(focusedRow.APP_EMP_NO) === ' ') {
      Message.warn(t('결재자를 지정해 주세요.'))
      return
    }

    vm.$swal({
      title: t('결재상신 하시겠습니까?'),
      showCancelButton: true,
    }).then(swalRes => {
      if (swalRes.isConfirmed === true) {
        const appParam = {
          CMPNY_DIV: userStore.cmpnyDiv,
          YEAR: dayjs().$y,
          APPROVE_ID:
            useLogsStore().vueId +
            '_' +
            userStore.userId +
            '_' +
            dayjs().$y +
            (dayjs().$M + 1).toString().padStart(2, '0') +
            dayjs().$D.toString().padStart(2, '0') +
            dayjs().$H.toString().padStart(2, '0') +
            dayjs().$m.toString().padStart(2, '0') +
            dayjs().$s.toString().padStart(2, '0'), 
          FORM_ID: useLogsStore().vueId,
          APP_EMP_NO: focusedRow.APP_EMP_NO,
          APPROVE_GBN: 'I',
          APP_REQ_EMP_NO: userStore.userId,
          APP_STATUS: 'N',
          PATH: '/20_risk-assessment/RSK_C/RSKCA0010',
          USER_ID: userStore.userId,
          NROUTINE_WORK_ID: focusedRow.NROUTINE_WORK_ID, 
        }

        commonExecuteApi({ queryId: 'RSKCA0010_APPROVE_01', list: [appParam] }).then(res => {
          commonSearchApi({ queryId: 'RSKCA0010_SEARCH_01', param: searchParams }).then(res3 => {
            afterSearch(res3)
            
            grdMain.value.goRow({
              NROUTINE_WORK_ID: focusedRow.NROUTINE_WORK_ID
            })

            Message.success(t('결재상신 되었습니다.'))
          })
        })
      }
    })
  }
}

const approve = () => {
  const focusedRow = grdMain.value.getFocusedRowData()

  if(focusedRow == null) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return
  }

  if(focusedRow.APP_STATUS !== '20') {
    Message.warn(t('승인대기 상태가 아닙니다.'))
    return
  }

  vm.$swal({
    title: t('승인 하시겠습니까?'),
    showCancelButton: true,
  }).then(swalRes => {
    if (swalRes.isConfirmed === true) {
      const appParam = {
        NROUTINE_WORK_ID: focusedRow.NROUTINE_WORK_ID,
        CMPNY_DIV: userStore.cmpnyDiv,
        YEAR: dayjs().$y,
        APP_KEY: focusedRow.APP_KEY,
        DIV: '',
        MENU_ID: useLogsStore().vueId,
        USER_ID: userStore.userId,
      }

      commonExecuteApi({ queryId: 'RSKCA0010_APPROVE_02', list: [appParam] }).then(res => {
        commonSearchApi({ queryId: 'RSKCA0010_SEARCH_01', param: searchParams }).then(res3 => {
          afterSearch(res3)
          
          grdMain.value.goRow({
            NROUTINE_WORK_ID: focusedRow.NROUTINE_WORK_ID
          })

          Message.success(t('승인 되었습니다.'))
        })
      })
    }
  })
}

const reject = () => {
  const focusedRow = grdMain.value.getFocusedRowData()

  if(focusedRow == null) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return
  }

  if(focusedRow.APP_STATUS !== '20') {
    Message.warn(t('승인대기 상태가 아닙니다.'))
    return
  }

  vm.$swal({
    title: t('반려 하시겠습니까?'),
    showCancelButton: true,
  }).then(swalRes => {
    if (swalRes.isConfirmed === true) {
      const appParam = {
        NROUTINE_WORK_ID: focusedRow.NROUTINE_WORK_ID,
        CMPNY_DIV: userStore.cmpnyDiv,
        YEAR: dayjs().$y,
        APP_KEY: focusedRow.APP_KEY,
        DIV: '',
        APP_DESC: '',
        MENU_ID: useLogsStore().vueId,
        USER_ID: userStore.userId,
      }

      commonExecuteApi({ queryId: 'RSKCA0010_APPROVE_03', list: [appParam] }).then(res => {
        commonSearchApi({ queryId: 'RSKCA0010_SEARCH_01', param: searchParams }).then(res3 => {
          afterSearch(res3)
          
          grdMain.value.goRow({
            NROUTINE_WORK_ID: focusedRow.NROUTINE_WORK_ID
          })

          Message.success(t('승인 되었습니다.'))
        })
      })
    }
  })
}

const afterApproval = async appKey => {
  const param = {
    NROUTINE_WORK_ID: currentGrdData.value.NROUTINE_WORK_ID,
    APP_KEY: appKey,
    APP_EMP_NO: '',
  }

  await commonExecuteApi({ queryId: 'RSKCA0010_SAVE_05', list: [param] }).then(async res => {
    await commonSearchApi({ queryId: 'RSKCA0010_SEARCH_01', param: searchParams }).then(res2 => {
      afterSearch(res2)
      
      grdMain.value.goRow({
        NROUTINE_WORK_ID: param.NROUTINE_WORK_ID
      })
    })
  })
}

const infoSet = async param => {
  const currDt = _.find(dataAprvl.value, { NROUTINE_WORK_ID: param.NROUTINE_WORK_ID })
  const unitParam = { NROUTINE_WORK_ID: param.NROUTINE_WORK_ID }

  let checkResult = {}
  await commonSearchApi({ queryId: 'RSKCA0010_REPORT_SEARCH_03', param: unitParam }).then(res => {
    // console.log('checkResult res', res)
    checkResult = res.ORESULT_CUR[0]
  })
  
  let unitDt = []
  await commonSearchApi({ queryId: 'RSKCA0010_SEARCH_04', param: unitParam }).then(res => {
    unitDt = res.ORESULT_CUR
  })
  
  let html = ''

  html += `<div style="width: 790px;">`
  html += `    <table style="width: 100%; border: 0 solid black; border-width: 2px 0px 2px 0px; border-collapse: collapse;">`
  html += `        <colgroup>`
  html += `            <col style="width: 45%;" />`
  html += `            <col style="width: 15%;" />`
  html += `            <col style="width: 40%;" />`
  html += `        </colgroup>`
  html += `        <tr height="45px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center;" rowspan="2">`
  html += `                <div style="font-size: 24px;">비일상작업 위험성평가</div>`
  html += `                <div>(Risk assessment of unusual works)</div>`
  html += `            </td>`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">작 성 일</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center;">${currDt.INS_DT2}</td>`
  html += `        </tr>`
  html += `        <tr height="45px">`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">작 성 자<br/>(소속/성명)</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center; word-break: break-all;">${currDt.USER_INFO}</td>`
  html += `        </tr>`
  html += `    </table>`
  html += `    `
  html += `    <table style="width: 100%; border: 0 solid black; border-width: 2px 0px 2px 0px; border-collapse: collapse; margin-top: 24px;">`
  html += `        <colgroup>`
  html += `            <col style="width: 13%;" />`
  html += `            <col style="width: 47%;" />`
  html += `            <col style="width: 20%;" />`
  html += `            <col style="width: 20%;" />`
  html += `        </colgroup>`
  html += `        <tr height="30px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;" rowspan="2">작업 장소</td>`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: left; padding: 0 4px; word-break: break-all;" rowspan="2">${nullToSpace(currDt.WORK_LOCATION)}</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;" colspan="2">작업 기간</td>`
  html += `        </tr>`
  html += `        <tr height="30px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center;" colspan="2">${currDt.REPORT_WORK_PERIOD}</td>`
  html += `        </tr>`
  html += `        <tr height="30px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;" rowspan="2">작업 내용</td>`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: left; padding: 0 4px; word-break: break-all;" rowspan="2">${nullToSpace(currDt.WORK_CONTENT)}</td>`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">예상 시작일</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">예상 종료일</td>`
  html += `        </tr>`
  html += `        <tr height="30px">`
  html += `            <td  style="border: 1px solid black; border-collapse: collapse; text-align: center;">${nullToSpace(currDt.EXPECTED_ST_DT)}</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center;">${nullToSpace(currDt.EXPECTED_ED_DT)}</td>`
  html += `        </tr>`
  html += `        <tr height="30px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">작업 조직</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: left; padding: 0 4px; word-break: break-all;" colspan="3">${nullToSpace(currDt.WORK_ASGN_NM)}</td>`
  html += `        </tr>`
  html += `        <tr height="30px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">참 석 자</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: left; padding: 0 4px; word-break: break-all;" colspan="3">${nullToSpace(currDt.MEMBERS)}</td>`
  html += `        </tr>`
  html += `    </table>`
  html += `    `
  html += `    <table style="width: 100%; border: 0 solid black; border-width: 2px 0px 2px 0px; border-collapse: collapse; margin-top: 12px;">`
  html += `        <colgroup>`
  html += `            <col style="width: 40%;" />`
  html += `            <col style="width: 30%;" />`
  html += `            <col style="width: 30%;" />`
  html += `        </colgroup>`
  html += `        <tr height="35px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 0px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;" colspan="3">수시 위험성평가 대상 선정 및 방법</td>`
  html += `        </tr>`
  html += `        <tr height="30px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">변화관리(MOC)</td>`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">위험성 수준</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">수시 위험성평가 방법</td>`
  html += `        </tr>`
  html += `        <tr height="50px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center;">${currDt.CHANGE_MNG_CHK_LIST_NM}</td>`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">${currDt.RISK_LEVEL_NM}</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center;">${currDt.REGULAR_RSK_METHOD_OZ}</td>`
  html += `        </tr>`
  html += `    </table>`
  html += `    `
  html += `    <table style="width: 100%; border: 0 solid black; border-width: 2px 0px 1px 0px; border-collapse: collapse; margin-top: 12px;  margin-bottom: 1px;"">`
  html += `        <colgroup>`
  html += `            <col style="width: 100%;" />`
  html += `        </colgroup>`
  html += `        <tr height="50px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 0px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">현장 점검 결과<br/>[※ 위험성평가를 실시하기 전에 현장 점검을 통해 유해·위험요인을 확인합니다.]</td>`
  html += `        </tr>`
  html += `    </table>`
  html += `    `
  html += `    <table style="width: 100%; border: 0 solid black; border-width: 1px 0px 2px 0px; border-collapse: collapse;>`
  html += `        <colgroup>`
  html += `            <col style="width: 50%;" />`
  html += `            <col style="width: 50%;" />`
  html += `        </colgroup>`
  html += `        <tr>`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center; padding: 12px;" height="230px">`
  
  if(checkResult.FILE_URL1 != null) {
    html += `                <img width="100%" src="${checkResult.FILE_URL1}"/>`
  }

  html += `            </td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center; padding: 12px;" height="230px">`
  
  if(checkResult.FILE_URL2 != null) {
    html += `                <img width="100%" src="${checkResult.FILE_URL2}"/>`
  }

  html += `            </td>`
  html += `        </tr>`
  html += `        <tr>`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center; padding: 12px;" height="230px">`
  
  if(checkResult.FILE_URL3 != null) {
    html += `                <img width="100%" src="${checkResult.FILE_URL3}"/>`
  }

  html += `            </td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center; padding: 12px;" height="230px">`
  
  if(checkResult.FILE_URL4 != null) {
    html += `                <img width="100%" src="${checkResult.FILE_URL4}"/>`
  }

  html += `            </td>`
  html += `        </tr>`
  html += `    </table>`
  html += `    `
  html += `    <table style="width: 100%; border: 0 solid black; border-width: 2px 0px 1px 0px; border-collapse: collapse; margin-top: 36px;  margin-bottom: 1px;"">`
  html += `        <colgroup>`
  html += `            <col style="width: 6%;" />`
  html += `            <col style="width: 22%;" />`
  html += `            <col style="width: 20%;" />`
  html += `            <col style="width: 20%;" />`
  html += `            <col style="width: 22%;" />`
  html += `        </colgroup>`
  html += `        <tr height="50px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 0px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;" colspan="5">비일상작업 위험성평가<br/>(Risk assessment of unusual works)</td>`
  html += `        </tr>`
  html += `        <tr height="30px">`
  html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">순 서</td>`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">작 업 명</td>`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">위험 요인</td>`
  html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">위험요인 감소대책</td>`
  html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse; text-align: center; font-weight: bold; background-color: #D9E4F0;">기 타</td>`
  html += `        </tr>`
  html += `    </table>`
  html += `    `
  html += `    <table style="width: 100%; border: 0 solid black; border-width: 1px 0px 2px 0px; border-collapse: collapse; margin-bottom: 1px;"">`
  html += `        <colgroup>`
  html += `            <col style="width: 6%;" />`
  html += `            <col style="width: 22%;" />`
  html += `            <col style="width: 20%;" />`
  html += `            <col style="width: 20%;" />`
  html += `            <col style="width: 22%;" />`
  html += `        </colgroup>`

  for(let i = 0; i < unitDt.length; i++) {
    let bfUnit

    if(i > 0) {
      bfUnit = unitDt[i - 1]
    }

    const currUnit = unitDt[i]
    const currUnitCnt = _.filter(unitDt, { UNIT_SORT: currUnit.UNIT_SORT }).length

    html += `        <tr height="30px">`
    
    if((i === 0 && currUnitCnt > 1)
       || (i > 0 && bfUnit.UNIT_SORT !== currUnit.UNIT_SORT && currUnitCnt > 1)) {
      html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center;"${'rowspan="' + currUnitCnt + '"'}>${currUnit.UNIT_SORT}</td>`
      html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: left; padding: 0 4px; word-break: break-all;"${'rowspan="' + currUnitCnt + '"'}>${currUnit.UNIT_NM}</td>`
    } else if(bfUnit?.UNIT_SORT !== currUnit.UNIT_SORT) {
      html += `            <td style="border: 0 solid black; border-width: 1px 1px 1px 0px; border-collapse: collapse; text-align: center;">${currUnit.UNIT_SORT}</td>`
      html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: left; padding: 0 4px; word-break: break-all;">${currUnit.UNIT_NM}</td>`
    }

    html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: left; padding: 0 4px; word-break: break-all;">${currUnit.RISK_NM}</td>`
    html += `            <td style="border: 1px solid black; border-collapse: collapse; text-align: left; padding: 0 4px; word-break: break-all;">${currUnit.RM_NM}</td>`
    html += `            <td style="border: 0 solid black; border-width: 1px 0px 1px 1px; border-collapse: collapse;">`
    html += `                <div style="text-align: left; padding: 0 4px; word-break: break-all;">${currUnit.REMARK}</div>`
    
    if(currUnit.FILE_URL != null) {
      html += `                <div style="padding: 4px;">`
      html += `                    <img width="100%" src="${currUnit.FILE_URL}"/>`
      html += `                </div>`
    }

    html += `            </td>`
    html += `        </tr>`
  }
  
  html += `    </table>`
  html += `</div>`

  return html
}

const nullToSpace = param => {
  if(param == undefined || param == null) {
    return ' '
  } else {
    return param
  }
}

// 조회
const searchData = () => {
  return commonSearchApi({ queryId: 'RSKCA0010_SEARCH_01', param: searchParams })
}

// 데이터 저장/조회시, 이전 포커스 찾아가기
const afterSave = res => {
  
  commonSearchApi({ queryId: 'RSKCA0010_SEARCH_01', param: searchParams }).then(res2 => {
    // grdMain.value.getDataProvider().setRows(res2.ORESULT_CUR)

    afterSearch(res2)
    
    grdMain.value.goRow({
      NROUTINE_WORK_ID: res.list[0].OUT_NROUTINE_WORK_ID
    })
  })
}

const afterSearch = res => {
  dataAprvl.value = _.cloneDeep(res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // TXT 길이에 너비 자동맞춤
  // grdMain.value.getGridView().fitLayoutWidth('WORK_NM', 180, 175, true)                         // 작업명
  // grdMain.value.getGridView().fitLayoutWidth('WORK_CONTENT', 400, 350, true)                    // 작업내용
  // grdMain.value.getGridView().fitLayoutWidth('DEPT_NM', 130, 110, true)                         // 부서
  // grdMain.value.getGridView().fitLayoutWidth('WORK_ASGN_NM', 130, 110, true)                    // 작업조직
  // grdMain.value.getGridView().fitLayoutWidth('WORK_LOCATION', 150, 130, true)                   // 작업장소
  // grdMain.value.getGridView().fitLayoutWidth('EXPECTED_ST_DT', 130, 110, true)                  // 시작일
  // grdMain.value.getGridView().fitLayoutWidth('EXPECTED_ED_DT', 130, 110, true)                  // 종료일
  // grdMain.value.getGridView().fitLayoutWidth('MEMBERS', 165, 135, true)                         // 참석자

  // // TODO: 이정현 책임 요청으로 주석 처리
  // // grdMain.value.getGridView().fitLayoutWidth('NON_ROUTINE_WROK_REASON', 300, 280, true)         // 비일상작업 발생사유
  
  // grdMain.value.getGridView().fitLayoutWidth('SITE_CHECK_RESULT', 290, 270, true)               // 점검결과
  // grdMain.value.getGridView().fitLayoutWidth('FILE_ID', 190, 190, true)                         // 첨부파일
  // grdMain.value.getGridView().fitLayoutWidth('SAFE_INFO_WORK_TOOLS', 120, 100, true)            // 작업도구
  // grdMain.value.getGridView().fitLayoutWidth('SAFE_INFO_WORK_EQUIPS', 120, 100, true)           // 장비 및 설비
  // grdMain.value.getGridView().fitLayoutWidth('SAFE_INFO_WORK_CHEMI', 180, 160, true)            // 사용화학 물질정보
  // grdMain.value.getGridView().fitLayoutWidth('SAFE_INFO_CONTRACOTR_REVIEWER', 120, 100, true)   // 직영부서 담당자

  // 수정 불가능
  // grdMain.value.getGridView().columnByName("WORK_NM").editable = false
  // grdMain.value.getGridView().setFocus(2)
}

// 행 추가
const addData = () => {
  //if (userStore.userId === 'BP16992' || userStore.userId === 'A512801' || userStore.userId === 'A526166'){
    rskAddPopup.value.openPopup({ isNew: true })
  /*} else {
    grdMain.value.addRow({
      COMPANY_CD: userStore.cmpnyDiv,
      DEPT_CD: userStore.deptCd,
      DEPT_NM: userStore.deptNm,
      WORK_ASGN_CD: userStore.asgnCd,
      WORK_ASGN_NM: userStore.asgnNm,
      INS_DT: dayjs().format('YYYY-MM-DD'),
      EXPECTED_ST_DT: dayjs().format('YYYY-MM-DD'),
      EXPECTED_ED_DT: dayjs().format('YYYY-MM-DD'),
    })
  }*/
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (!data.WORK_NM) {
      return Message.warn(t('작업명을 입력해주세요.'))
    } else if (!data.WORK_CONTENT) {
      return Message.warn(t('작업내용을 입력해주세요.'))
    } else if (!data.EXPECTED_ST_DT) {
      return Message.warn(t('시작일을 입력해주세요.'))
    } else if (!data.EXPECTED_ED_DT) {
      return Message.warn(t('종료일을 입력해주세요.'))
    }

    if (data.EXPECTED_ED_DT < data.EXPECTED_ST_DT) {
      return Message.warn('종료일이 시작일보다 작습니다. 다시 설정해주세요.')
    }
  }

  return true
}

// 저장
const saveData = () => {
  let saveParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    // 날짜 형식 수정
    let ST_DT = data.EXPECTED_ST_DT.replace(/-/g, '')
    let ED_DT = data.EXPECTED_ED_DT.replace(/-/g, '')

    data.EXPECTED_ST_DT = ST_DT 
    data.EXPECTED_ED_DT = ED_DT

    data.USER_ID = userStore.userId // USER_ID

    // 컬럼명이 길어 SAFE_INFO_CONTRACOTR_REVIEWER에서 CONTRACOTR_REVIEWER로 수정
    data.CONTRACOTR_REVIEWER = data.SAFE_INFO_CONTRACOTR_REVIEWER

    saveParams.push(data)
  }

  //console.log('saveParams', saveParams)
  return commonExecuteApi({ queryId : 'RSKCA0010_SAVE_01', list: saveParams })
}

const beforeDelete = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if (userStore.authGrpCd.includes('GRP00377')){
    // 삭제가능
    return true
  }

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (data.APP_STATUS === '20') {
      Message.warn(t('승인대기인 건이 있습니다.'))
      return false
    } else if (data.APP_STATUS === '30') {
      Message.warn(t('승인완료인 건이 있습니다.'))
      return false
    }
  }

  return true
}

// 삭제
const deleteData = () => {
  let deleteParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    deleteParams.push(data)
  }

  return commonExecuteApi({ queryId : 'RSKCA0010_DELETE_01', list: deleteParams })
}

// 그리드 버튼 이벤트(참석자 팝업)
const onCellButtonClicked = (grid, index, col) => {
  console.log('buttonClicked')
  console.log('grid = ', grid)
  console.log('index = ', index)
  console.log('col = ', col)
  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  let rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  // dataRow, fieldInex 추가
  rtnData.dataRow = index.dataRow
  rtnData.fieldIndex = index.fieldIndex

  // if (!rtnData.NROUTINE_WORK_ID) {
  //   return Message.warn(t('저장 후 버튼을 클릭해주세요.'))
  // }

  grdClickIndex.value = index.fieldIndex

  // 참석자 팝업 오픈
  if (index.fieldIndex === 9) {
    selectAddEmpPopup.value.openPopup({
      title: rtnData.WORK_NM,
      dataRow: rtnData.dataRow,
      fieldIndex: rtnData.fieldIndex,
      PARYT_MEMBERS: rtnData.PARYT_MEMBERS ? rtnData.PARYT_MEMBERS.split(',') : '',
      NROUTINE_WORK_ID: rtnData.NROUTINE_WORK_ID,
      BSNS_CD: rtnData.BSNS_CD,
      DEPT_CD: rtnData.DEPT_CD
    })
  } else if (index.fieldIndex === 2) {
    selectDeptPopup.value.openPopup({
      dataRow: rtnData.dataRow,
      fieldIndex: rtnData.fieldIndex,
      CMPNY_DIV: rtnData.COMPANY_CD,
      BSNS_CD: rtnData.BSNS_CD,
      DEPT_CD: rtnData.DEPT_CD
    })
  } else if(index.fieldIndex === 14) {
    // 현장점검 첨부파일
    let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
    data.gridOnly = isApproving(data)
    //console.log('data = ', data)
    fileUpload.value.openPopup(data, 'FILE_ID')
  } else if(index.fieldIndex === 19) {
    //교육이수 첨부파일
    let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
    data.gridOnly = isApproving(data)
    //console.log('data = ', data)
    fileUpload.value.openPopup(data, 'EDU_FILE_ID')
  }
}

const isApproving = param => {
  return param?.APP_STATUS === '20' || param?.APP_STATUS === '30'
}

// 그리드 헤더버튼 클릭 테스트
const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === 'header') {
    if (clickData.fieldIndex === 10 || clickData.fieldIndex === 11) {
      discript.value.openPopup(clickData.fieldName)
    } 
  } else {
    if(clickData.cellType !== 'gridEmpty') {
      const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

      /*if (clickData.fieldIndex === 4
          && data.APP_STATUS !== '20' && data.APP_STATUS !== '30') {
        locationPopup.value.openPopup({ 
          dataRow: clickData.dataRow,
          fieldIndex: clickData.fieldIndex
        }) 
      }*/
    }
  }
}

// 그리드 이벤트
const onCellDblClicked = (grd, data) => {
  if (data.cellType === 'data') {
    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)    
    //if (userStore.userId === 'BP16992' || userStore.userId === 'A512801' || userStore.userId === 'A526166'){
      rskAddPopup.value.openPopup(innerData)
    //}
    // console.log(innerData, "innerData")
  }
}


// 셀 아이콘 클릭 이벤트
const onCellItemClicked = (grid, index, col) => {
  console.log('AAAAAAAAAAA')
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if (!data.NROUTINE_WORK_ID) {
    return Message.warn(t('저장 후 버튼을 클릭해주세요.'))
  }

  // 파일 업로드
  if (index.fieldName === 'FILE_ID') {
    console.log('BBBBBBBBBB')
    fileUpload.value.openPopup(data)
  }

  // 양식 적용
  if (index.fieldName === 'applyForm') {
    alert('2차 고도화 진행시 개발 예정')
  }
}

// 참석자 선택 후
const onSelectEmp = async val => {
  //console.log('val = ', val)

  let cnt = val.SHOW_MEMBERS.length
  let first = val.SHOW_MEMBERS[0]
  let member

  if(cnt <= 0)
    return

  if(cnt == 1)
    member = first
  else
    member = first + ' 외 ' + (cnt-1) + '명'

  if(typeof val === 'String') {

    // onButtonsClick({ id :'btnSearch' })
    grdMain.value.getDataProvider().setValue(val.dataRow, 'PARYT_MEMBERS', result)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'MEMBERS', member)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'SHOW_MEMBERS', val.SHOW_MEMBERS[0])
  } else if (typeof val === 'object') {
    let result = val.PARYT_MEMBERS.join(', ')
    grdMain.value.getDataProvider().setValue(val.dataRow, 'PARYT_MEMBERS', result)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'MEMBERS', member)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'SHOW_MEMBERS', val.SHOW_MEMBERS[0])
  }
}

// 참석자 팝업 닫기
const closeSelectEmp = val => {
  //onButtonsClick({ id: 'btnSearch' })
}

// 파일 업로드 후
const onFileSelected = val => {
  if(val) {
    //console.log('file val = ', val)

    let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(grdClickIndex.value === 19){
      grdMain.value.getDataProvider().setValue(rowIdx, 'EDU_FILE_ID', val.FILE_ID)
    } else {
      grdMain.value.getDataProvider().setValue(rowIdx, 'FILE_ID', val.FILE_ID)
    }

    grdMain.value.getGridView().checkItem(rowIdx, true)

    //onButtonsClick({ id :'btnSearch' })
  }
}

// 부서 선택 후
const onSelectDept = val => {
  // console.log('onSelectDept val', val)
  grdMain.value.getDataProvider().setValue(val.dataRow, 'DEPT_NM', val.ASGN_SHRT_NM)
  grdMain.value.getDataProvider().setValue(val.dataRow, 'DEPT_CD', val.ORGN_DIV === 'A' ? val.DEPT_CD : val.ASGN_CD)
  grdMain.value.getDataProvider().setValue(val.dataRow, 'WORK_ASGN_NM', val.ASGN_SHRT_NM)
  grdMain.value.getDataProvider().setValue(val.dataRow, 'WORK_ASGN_CD', val.ASGN_CD)
  grdMain.value.getGridView().checkRow(val.dataRow)
  setBtns(grdMain.value.getFocusedRowData())
}

// 장소 선택 후
const selectedLocation = val => {
  grdMain.value.getDataProvider().setValue(val[val.length - 1].dataRow, 'WORK_LOCATION', val[val.length - 1].TXT)
  grdMain.value.getGridView().checkRow(val[val.length - 1].dataRow)
}

// 수시 위험성평가 상세항목
const riskDetailBtnClick = btn => {
  const noRoutine = currentGrdData.NROUTINE_WORK_ID
  let saveUnitParams = [] // UNIT
  let saveRiskParams = [] // RISK

  if (btn.id === 'btnUpdate') { 
    for (let i of rskDetail.value) {
      // 단위작업명의 CHECKBOX가 선택되어 있는 데이터를 넘김
      if (i.UNIT_CHECK === 'Y') {
        if (!i.UNIT_NM) {
          return Message.warn(t('단위작업명을 입력해주세요.'))
        }
        i.USER_ID = userStore.userId
        saveUnitParams.push(i)
      }
      for (let j of i.child) {
        // 위험요인의 CHECKBOX가 선택되어 있는 데이터를 넘김
        if (j.RISK_CHECK === 'Y') {
          if (!j.RISK_NM) {
            return Message.warn(t('위험요인을 입력해주세요.'))
          }

          if (j.RISK_LEVEL === 'RISK_LEVEL-01' || j.RISK_LEVEL === 'RISK_LEVEL-02') {
            if (!j.RM_NM) {
              return Message.warn(t('위험요인 감소대책을 입력해주세요.'))
            }
          }
          j.USER_ID = userStore.userId
          saveRiskParams.push(j)
        }
      }
    }
    
    if (saveUnitParams.length < 1 && saveRiskParams.length < 1) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    }

    vm.$swal({
      title: t("저장 하시겠습니까?"),
      showCancelButton: true,
    }).then(swalRes => {
      if(swalRes.isConfirmed === true) {
        Promise.all([
          // 단위작업(UNIT)
          commonExecuteApi({
            queryId: 'RSKCA0010_SAVE_02',
            list: saveUnitParams,
          }),
          // 위험요인(RISK)
          commonExecuteApi({
            queryId: 'RSKCA0010_SAVE_03',
            list: saveRiskParams,
          })
        ]).then(res => {
          if (res[0].result.status === res[1].result.status) {
            Message.success(t('저장 되었습니다.'))
          }
        }).catch(err => {
          // return Message.err(err)
        }).finally(() => {
          commonSearchApi({ queryId: 'RSKCA0010_SEARCH_01', param: searchParams }).then(res2 => {            
            // grdMain.value.getDataProvider().setRows(res2.ORESULT_CUR)
            afterSearch(res2)
            grdMain.value.goRow({
              NROUTINE_WORK_ID: noRoutine
            })
          })
        })
      }
    })
  } else if (btn.id === 'btnRskCopyApp') { // 작업표준 신규제정의 세부내용 화면으로 데이터를 넘기는 이벤트
    let rskCopy = []
    for (let i of rskDetail.value) {
      if (i.UNIT_CHECK === 'Y') {
        rskCopy.push(i) 
      }
    } 
    
    if (rskCopy.length < 1) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    }

    emit("selected", rskCopy)

  }
}

// 버튼 이벤트(추가 +)
const addBlock = type => {
  if (type === 'unit') {  // 단위작업명 우측 + 버튼 클릭 이벤트
    if (!currentGrdData.value.NROUTINE_WORK_ID) {
      return Message.warn(t('데이터 저장 후 추가해주세요.'))
    }

    // 1. 자동채번을 할때 MAX를 가져오기위한 변수선언
    let isUnitSort = [] // 작업순서(UNIT_SORT)
    let isUnitId = []   // UNIT_ID

    // 2. 현재 가지고있는 데이터를 push
    for (let el of rskDetail.value) {
      isUnitId.push(el.UNIT_ID.slice(-3))
      isUnitSort.push(el.UNIT_SORT)
    }

    // isUnitId의 데이터가 없으면 001 지정, 있으면 MAX를 가져와 1을 더하고 '0'으로 3자리를 채움.
    let autoUnitId = isUnitId.length === 0 ? '001' : (Math.max(...isUnitId) + 1).toString().padStart(3, '0')

    rskDetail.value.push({
      NROUTINE_WORK_ID: currentGrdData.value.NROUTINE_WORK_ID,
      UNIT_ID: currentGrdData.value.NROUTINE_WORK_ID + '-U' + autoUnitId,
      UNIT_NM: '', 
      UNIT_SORT: isUnitSort.length === 0 ? 1 : Math.max(...isUnitSort) + 1,
      child: [],
      UNIT_CHECK: 'Y',
    })
  } else if (type === 'risk') {  // 위험요인 우측 + 버튼 클릭 이벤트
    const isDate = new Date()

    const year = isDate.getFullYear()
    const month = String(isDate.getMonth() + 1).padStart(2, '0')
    const date = String(isDate.getDate()).padStart(2, '0')
    const hours = String(isDate.getHours()).padStart(2, '0')
    const minutes = String(isDate.getMinutes()).padStart(2, '0')
    const seconds = String(isDate.getSeconds()).padStart(2, '0')
    const milliseconds = String(isDate.getMilliseconds()).padStart(2, '0')

    // RISK_ID 채번시 등록
    let dateAppointed = year + month + date + hours + minutes + seconds + milliseconds

    // 단위작업명 입력 요구
    if (currentClickData.value === null) {
      return Message.warn(t('단위작업명을 선택한 후 추가해주세요.'))
    }

    for (let i of rskDetail.value) {
      let isRiskSort = [] // 위험요인 정렬순서

      for (let j of i.child) {
        isRiskSort.push(j.RISK_SORT)
      }

      if (currentClickData.value.UNIT_ID === i.UNIT_ID) {
        imgUploadPopup.value.setGuid()
        const newFileId = imgUploadPopup.value.guid

        i.child.push({
          NROUTINE_WORK_ID: currentClickData.value.NROUTINE_WORK_ID,
          REMARK: '',
          RISK_ID: currentClickData.value.UNIT_ID + '-S' + dateAppointed,
          RISK_LEVEL: 'RISK_LEVEL-01',
          RISK_NM: '',
          RISK_SORT: isRiskSort.length === 0 ? 1 : Math.max(...isRiskSort) + 1,
          RM_NM: '',
          RM_SORT: '',
          UNIT_ID: currentClickData.value.UNIT_ID,
          RISK_CHECK: 'Y',
          FILE_ID: newFileId,
          FILE_COUNT: 0,
        })

        // console.log('newFileId', newFileId)
      }
    }
  }
}

// 버튼 이벤트(삭제 -)
const delBlock = type => {
  let deleteUnitParams = []
  let deleteRiskParams = []

  if (type === 'unit') {
    for (let i of rskDetail.value) {
      if (i.UNIT_CHECK === 'Y') {
        deleteUnitParams.push(i)
      }
    }

    if (deleteUnitParams.length < 1) {
      return Message.warn('삭제할 데이터를 선택해주세요.') 
    } 
    
    vm.$swal({
      title: t("삭제 하시겠습니까?"),
      showCancelButton: true,
    }).then(swalRes => {
      if (swalRes.isConfirmed === true) {
        commonExecuteApi({
          queryId: 'RSKCA0010_DELETE_02',
          list: deleteUnitParams,
        }).then(res => {
          if (res.result.status ==='200') {
            Message.success(t('삭제 되었습니다.'))
          }
        }).catch(err => {
          return Message.err(err)
        }).finally(() => {
          onButtonsClick({ id :'btnSearch' })
        })
      }
    })
  } else if (type === 'risk') {
    for (let i of rskDetail.value) {
      for (let j of i.child) {
        if (j.RISK_CHECK == 'Y') {
          deleteRiskParams.push(j)
        }
      }
    }
    
    if (deleteRiskParams.length < 1) {
      return Message.warn('삭제할 데이터를 선택해주세요.') 
    }

    vm.$swal({
      title: t("삭제 하시겠습니까?"),
      showCancelButton: true,
    }).then(swalRes => {
      if (swalRes.isConfirmed === true) {
        commonExecuteApi({
          queryId: 'RSKCA0010_DELETE_03',
          list: deleteRiskParams,
        }).then(res => {
          if (res.result.status ==='200') {
            Message.success(t('삭제 되었습니다.'))
          }
        }).catch(err => {
          return Message.err(err)
        }).finally(() => {
          onButtonsClick({ id :'btnSearch' })
        })
      }
    })
  }
}

const setBtns = param => {
  // console.log('param', param)
  // console.log('userStore.userDiv', userStore.userDiv)
  // console.log('param.IS_SAVE', param.IS_SAVE)
  // console.log('param.INS_USR', param.INS_USR)
  // console.log('param.APP_STATUS', param.APP_STATUS)

  if(userStore.userDiv === 'A') {
    if(param.IS_SAVE === 'Y') {
      if(param.DEPT_CD === userStore.deptCd) {
        if(param.APP_STATUS === '10' || param.APP_STATUS === '11') {
          menuTitle.value.disableBtn('btnReqApply', false)
          menuTitle.value.disableBtn('btnUpdate', false)
          menuTitle.value.disableBtn('btnDelete', false)
        } else {
          menuTitle.value.disableBtn('btnReqApply', true)
          menuTitle.value.disableBtn('btnUpdate', true)
          menuTitle.value.disableBtn('btnDelete', true)
        }
      } else {
        menuTitle.value.disableBtn('btnReqApply', true)
        menuTitle.value.disableBtn('btnUpdate', true)
        menuTitle.value.disableBtn('btnDelete', true)
      }
    } else {
      if(param.DEPT_CD === userStore.deptCd) {
        menuTitle.value.disableBtn('btnUpdate', false)
        menuTitle.value.disableBtn('btnDelete', false)
      } else {
        menuTitle.value.disableBtn('btnUpdate', true)
        menuTitle.value.disableBtn('btnDelete', true)
      }
      menuTitle.value.disableBtn('btnReqApply', true)
    }
  } else {
    if(param.IS_SAVE === 'Y') {
      if(param.WORK_ASGN_CD === userStore.asgnCd) {
        if(param.APP_STATUS === '10' || param.APP_STATUS === '11') {
          menuTitle.value.disableBtn('btnReqApply', false)
          menuTitle.value.disableBtn('btnUpdate', false)
          menuTitle.value.disableBtn('btnDelete', false)
        } else {
          menuTitle.value.disableBtn('btnReqApply', true)
          menuTitle.value.disableBtn('btnUpdate', true)
          menuTitle.value.disableBtn('btnDelete', true)
        }
      } else {
        menuTitle.value.disableBtn('btnReqApply', true)
        menuTitle.value.disableBtn('btnUpdate', true)
        menuTitle.value.disableBtn('btnDelete', true)
      }

      if(param.APP_EMP_NO === userStore.userId) {
        if(param.APP_STATUS === '20') {
          menuTitle.value.disableBtn('btnApprove', false)
          menuTitle.value.disableBtn('btnReject', false)
        } else {
          menuTitle.value.disableBtn('btnApprove', true)
          menuTitle.value.disableBtn('btnReject', true)
        }
      } else {
        menuTitle.value.disableBtn('btnApprove', true)
        menuTitle.value.disableBtn('btnReject', true)
      }
    } else {
      if(param.WORK_ASGN_CD === userStore.asgnCd) {
        menuTitle.value.disableBtn('btnUpdate', false)
        menuTitle.value.disableBtn('btnDelete', false)
      } else {
        menuTitle.value.disableBtn('btnUpdate', true)
        menuTitle.value.disableBtn('btnDelete', true)
      }
      menuTitle.value.disableBtn('btnReqApply', true)
      menuTitle.value.disableBtn('btnApprove', true)
      menuTitle.value.disableBtn('btnReject', true)
    }
  }

  if(useLogsStore().isMenuAdmin === "Y"){
    menuTitle.value.disableBtn('btnDelete', false)
  }
}

// 그리드 셀 클릭(포커스) 이벤트
const onCurrentRowChanged = async (grid, oldIdx, newIdx) => {
  // 초기화
  rskDetail.value = []
  currentGrdData.value = {}

  if(newIdx < 0) {
    return
  }

  // 선택한 행의 데이터
  currentGrdData.value = grdMain.value.getDataProvider().getJsonRow(newIdx)
  setBtns(currentGrdData.value)

  // console.log('currentGrdData.value', currentGrdData.value)

  // API 호출
  Promise.all([
    commonSearchApi({
      queryId: 'RSKCA0010_SEARCH_02', 
      param: { 
        NROUTINE_WORK_ID: currentGrdData.value.NROUTINE_WORK_ID
      }
    }),
    commonSearchApi({
      queryId: 'RSKCA0010_SEARCH_03', 
      param: {
        NROUTINE_WORK_ID: currentGrdData.value.NROUTINE_WORK_ID
      }
    })
  ]).then(res => {
    // 단위작업
    let unitObj = res[0].ORESULT_CUR
    let riskObj = res[1].ORESULT_CUR

    for (let i of unitObj) {
      i.UNIT_CHECK = 'N'
      i.child = []
      for (let j of riskObj) {
        if (i.NROUTINE_WORK_ID === j.NROUTINE_WORK_ID && i.UNIT_ID === j.UNIT_ID) {
          i.child.push({
            NROUTINE_WORK_ID: j.NROUTINE_WORK_ID,
            REMARK: j.REMARK,
            RISK_ID: j.RISK_ID,
            RISK_LEVEL: j.RISK_LEVEL,
            RISK_NM: j.RISK_NM,
            RISK_SORT: j.RISK_SORT,
            RM_NM: j.RM_NM,
            RM_SORT: j.RM_SORT,
            UNIT_ID: j.UNIT_ID,
            RISK_CHECK: 'N',
            FILE_ID: j.FILE_ID,
            FILE_COUNT: j.FILE_COUNT,
          })
        }
      }
    }
    rskDetail.value = unitObj
  }) 
}

const onEditRowChanged = async (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  
  grid.commit()

  /*
  let aa = grdMain.value.getDataProvider().getJsonRow(itemIndex)

  console.log('aa = ', aa)
  console.log('dataRow = ', dataRow)

  console.log('field = ', field)
  console.log('oldValue = ', oldValue)
  console.log('newValue = ', newValue)
  console.log('fidName = ', fidName)
*/

  let fidName = grdMain.value.getDataProvider().getFieldName(field)

  if(fidName == 'RISK_LEVEL')
  { 
    if(newValue == 'A')
      grdMain.value.getDataProvider().setValue(itemIndex, 'REGULAR_RSK_METHOD', 'Table Meeting(안전 포함)')
    else if(newValue == 'B')
      grdMain.value.getDataProvider().setValue(itemIndex, 'REGULAR_RSK_METHOD', 'Table Meeting(자체 수행)')
    else if(newValue == 'C')
      grdMain.value.getDataProvider().setValue(itemIndex, 'REGULAR_RSK_METHOD', 'Standing Meeting')
  }

  grdMain.value.getGridView().checkItem(dataRow, true)
}

/* -------------------------------- Draggable --------------------------------*/
// draggable
const dragOptions = {
  animation: 200,
} 

// 선택한 단위작업에 대한 데이터
const selectRow = el => {
  currentClickData.value = el

  const docOther = document.getElementsByClassName('selected-draggable')

  docOther.forEach(item => {
    item.classList.remove('selected-draggable')
  })

  const classss = `${el.UNIT_ID}`
  const doc = document.getElementById(classss)

  doc.classList.add('selected-draggable')
}

// 위험요인이 선택되었을 때
const selectCard = ele => {
  currentRiskData.value = ele

  sItem.value = ele.UNIT_ID

  // 선택된 아이템의 정보를 넘겨서 내부 id찾기
  // selectedItem(ele)

  const docOther = document.getElementsByClassName('selected-card')

  docOther.forEach(item => {
    item.classList.remove('selected-card')
  })

  let cid = `${ele.RISK_ID}`
  
  const doc = document.getElementById(cid)

  doc.classList.add('selected-card')
}

const onDragStart = () => {
  //console.log('Drag Start')
}

const onDragEnd = el => {
  sortArray()
}

const sortArray = () => {
  let cntX = 1
  let cntY = 1
  let cntZ = 1

  rskDetail.value.forEach( x => {
    cntY = 1
    x.UNIT_SORT = cntX++
    x.UNIT_CHECK = 'Y'

    x.child.forEach( y => {
      cntZ = 1      
      y.RISK_SORT = cntY++
      y.RISK_CHECK = 'Y'
    })
  })
}

// 사업부 변경 시 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  if(isMounted.value) {
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
      .then(res => {
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

        if(newValue === ""){
          searchParams.DEPT_CD = ""
        }

        if(newValue !== userStore.bsnsCd){
          searchParams.DEPT_CD = ""
        }

        /*if (!oldValue) {
          return searchParams.DEPT_CD = userStore.deptCd
        }
        if (newValue !== oldValue) {
          searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD
        }*/
      })
  }
})

// 부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  if(isMounted.value) {
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: newValue } })
      .then(res => {
        codeList.PARTNER_CD = res.ORESULT_CUR
        codeList.PARTNER_CD.unshift({ ASGN_NM:"선택안함", ASGN_CD:"" })
        if (codeList.PARTNER_CD.length !== 0) {
          searchParams.PARTNER_CD = ''
        }
      })
  }
})

// 위험수준 색상 변경 함수
const getColor = val => {
  if (val === 'RISK_LEVEL-01') {
    return '#FF0000'
  } else if (val === 'RISK_LEVEL-02') {
    return '#FFA500'
  } else if (val === 'RISK_LEVEL-03') {
    return '#6ED746'
  }
}

const setSliParams = async () => {
  if(sliRSKCA0010 !== undefined) {
    searchParams.BSNS_CD = sliRSKCA0010.BSNS_CD
    await commonSearchApi({
      queryId : 'searchDept3',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV:'Y' }
    }).then(res => {
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
      searchParams.DEPT_CD = sliRSKCA0010.DEPT_CD
    })

    await commonSearchApi({
      queryId : 'searchVend',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        DEPT_CD: searchParams.DEPT_CD
      }
    }).then(res => {
      codeList.PARTNER_CD = res.ORESULT_CUR
      codeList.PARTNER_CD.unshift({ ASGN_NM:"선택안함", ASGN_CD:"" })
      if (codeList.PARTNER_CD.length !== 0) {
        searchParams.PARTNER_CD = ''
      }
    })

    searchParams.YEAR = sliRSKCA0010.YEAR
    searchParams.HALF = sliRSKCA0010.HALF
    
  }
}

const openFile = async el => {
  if(el.FILE_ID == null) {
    imgUploadPopup.value.setGuid()
    el.FILE_ID = imgUploadPopup.value.guid
    
    // console.log('el', el)

    // update file id
    await commonExecuteApi({ queryId : 'RSKCA0010_SAVE_04', list: [el] })
  }
  
  imgUploadPopup.value.openPopup(el.FILE_ID)
}

const uploaded = async e => {
  for(let i = 0; i < rskDetail.value.length; i++) {
    const currUnit = rskDetail.value[i]
    
    if(currUnit.UNIT_ID === currentClickData.value.UNIT_ID) {
      for(let j = 0; j < currUnit.child.length; j++) {
        const currRisk = currUnit.child[j]

        if(currRisk.RISK_ID === currentRiskData.value.RISK_ID) {
          await imgUploadPopup.value.getFileCount().then(res => { currRisk.FILE_COUNT = res })
          break
        }
      }
    }
  }
}

const setGrdEditable = () => {
  const btnCols = [
    'DEPT_NM',
    'MEMBERS',
    // 'FILE_COUNT',
    // 'EDU_FILE_COUNT',
  ]

  grdMain.value.getGridView().columnByName('WORK_NM').styleCallback = function(grid, dataCell) {
    const data = grdMain.value.getDataProvider().getJsonRow(dataCell.index.dataRow)

    if (!data.NROUTINE_WORK_ID) {
      return { editable: true }
    } else {
      return { editable: false }
    }
  }

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    const data = grdMain.value.getDataProvider().getJsonRow(item.dataRow)

    if(isApproving(data)) {
      return {
        editable: false
      }
    }
  })

  for(let i = 0; i < btnCols.length; i++) {
    grdMain.value.getGridView().columnByName(btnCols[i]).buttonVisibleCallback = function(grid, index, focused, mouseEntered) {
      const data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)

      if(isApproving(data)) {
        return false
      } else {
        return true
      }
    }
  }
}

const onClickORA_YN = ele => {
  ele.UNIT_CHECK='Y'
  
  if(ele.ORA_YN === 'Y'){
    Message.warn("<center>현장 위험성평가는 작업 착수 전, <br/>현장에서 실시한다는 점을 참조하여 대상 선택 시 주의 바랍니다.</center>")
    //alert("현장 위험성평가는 작업 착수 전, 현장에서 실시한다는 점을 참조하여 대상 선택 시 주의 바랍니다.")
  }
}

onMounted(async () => {
  await initCodeList()
  // // 사업부 전체 추가
  // codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD:'' })

  searchParams.BSNS_CD = userStore.bsnsCd
  searchParams.DEPT_CD = userStore.deptCd

  // 작업표준 신규제정 화면에서 팝업을 오픈하면 그리드 체크바 숨김 처리
  if (props.menuId === 'RSKBA0010') {
    grdMain.value.getGridView().setCheckBar({ visible: false })
  }

  await setSliParams()

  vm.$nextTick(() => {
    isMounted.value = true
    setGrdEditable()

    // console.log('userStore.userDiv', userStore.userDiv)

    if(userStore.userDiv === 'A') {
      menuTitle.value.visibleBtn('btnApprove', false)
      menuTitle.value.visibleBtn('btnReject', false)
      grdMain.value.getGridView().columnByName('APP_EMP_NO').visible = false
    } else {
      grdMain.value.setBindingColumn("APP_EMP_NO", codeList.APP_EMP_NO, "EMP_NO", "FULL_DESC")
    }
  })
})
</script>

<template>
  <!-- 변경 -->
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 작업표준 신규제정 -->
      <IMenuTitle
        v-if="props.menuId === 'RSKBA0010'"
        ref="menuTitle"
        :title="props.menuId === 'RSKBA0010' ? '' : $t(useLogsStore().menuId)"
        :hiddenManuel="props.menuId === 'RSKBA0010' ? true : false"
        :button-list="['btnSearch', 'btnClose']"
        @click-button="onButtonsClick"
      />
      <IMenuTitle
        v-else
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnReqApply', 'btnApprove', 'btnReject', 'btnDelete','btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <!-- 조회조건 -->
        <v-sheet class="searchArea d-flex">
          <!-- 회사 -->
          <i-select
            :label="$t('회사')"
            label-width="40px"
            width="300px"
            v-model="searchParams.COMPANY_CD"
            :items="codeList.COMPANY_CD"
            item-value="COD"
            item-title="TXT"
            readonly 
          />
          <!-- 사업부 -->
          <i-select
            :label="$t('사업부')"
            label-width="40px"
            width="220px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
          />
          <!-- 부서 -->
          <i-select
            :label="$t('부서')"
            label-width="40px"
            width="300px"
            v-model="searchParams.DEPT_CD"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
          />
          <!-- 협력사 -->
          <i-select
            :label="$t('협력사')"
            label-width="40px"
            width="300px"
            v-model="searchParams.PARTNER_CD"
            :items="codeList.PARTNER_CD"
            item-value="ASGN_CD"
            item-title="ASGN_NM"
          />
          <!-- 기준년도 -->
          <i-select
            :label="$t('기준년도')"
            label-width="50px"
            width="200px"
            v-model="searchParams.YEAR"
            type="YEAR"
          />
          <!-- 반기 -->
          <i-select
            :label="$t('반기')"
            label-width="40px"
            width="150px"
            v-model="searchParams.HALF"
            :items="codeList.HALF"
            item-value="COD"
            item-title="TXT"
          />
        </v-sheet>
        <v-sheet>
          <IGridTitle
            v-if="!props.menuId"
            :title="$t('수시 위험성평가 목록(비일상작업)')"
          >
            <template #editors />
          </IGridTitle>
          <div><span>※ 결재상태가 승인완료 일 경우 수정 및 첨부 불가</span></div>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: calc(100vh - 700px);"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys" 
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onCellItemClicked="onCellItemClicked"
            @onCellButtonClicked="onCellButtonClicked"
            @onCurrentRowChanged="onCurrentRowChanged"
            @onEditRowChanged="onEditRowChanged"
            @onCellClicked="onCellClicked"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
        <v-sheet class="mt-3">
          <IGridTitle
            v-if="props.menuId === 'RSKBA0010'"
            :title="$t('수시 위험성평가 내용')"
            :button-list="['btnRskCopyApp']"
            @click-button="riskDetailBtnClick"
          >
            <template #editors />
          </IGridTitle>
          <IGridTitle
            v-else
            :title="$t('수시 위험성평가 내용')"
            :button-list="['btnUpdate']"
            @click-button="riskDetailBtnClick"
          >
            <template #editors />
          </IGridTitle>
          <VRow>
            <!-- 단위작업명 -->
            <VCol cols="12" md="2" class="mt-0 ma-2">
              <VRow>
                <VCol cols="12" md="8">
                  <h4>단위작업명</h4>
                </VCol>
                <VCol 
                  cols="12" 
                  md="4" 
                  style="text-align: right;"
                >
                  <VIcon v-if="!props.menuId && !isApproving(currentGrdData)" color="info" icon="mdi-plus" @click="addBlock('unit')"/>
                  <VIcon v-if="!props.menuId && !isApproving(currentGrdData)" color="error" icon="mdi-minus" @click="delBlock('unit')"/>
                </VCol>
              </VRow>
              <VRow>
                <VDivider
                  :thickness="3"
                  class="border-opacity-100"
                  color="primary" 
                />
              </VRow>
            </VCol>
            <!-- 위험요인 -->
            <VCol cols="12" md="8" class="mt-0 ma-2">
              <VRow>
                <VCol cols="12" md="3">
                  <h4>위험요인</h4>
                </VCol>
                <VCol cols="12" md="1" style="text-align: right;">
                  <VIcon v-if="!props.menuId && !isApproving(currentGrdData)" color="info" icon="mdi-plus" @click="addBlock('risk')"/>
                  <VIcon v-if="!props.menuId && !isApproving(currentGrdData)" color="error" icon="mdi-minus" @click="delBlock('risk')"/>
                </VCol>
                <VCol cols="12" md="2">
                  <h4>위험수준</h4> 
                </VCol>
                <VCol cols="12" md="3">
                  <h4>위험요인 감소대책</h4>
                </VCol>
                <VCol cols="12" md="3">
                  <h4>기타(타 조직 요청사항, 특별 체크 사항)</h4>
                </VCol>
              </VRow>
              <VRow>
                <VDivider
                  :thickness="3"
                  class="border-opacity-100"
                  color="primary" 
                />
              </VRow>
            </VCol>
          </VRow>
          <v-sheet class="detail-area">
            <draggable 
              v-model="rskDetail" 
              :options="dragOptions"
              @start="onDragStart" 
              @end="onDragEnd" 
              item-key="id"
              class="pt-1"
            >
              <template #item="{ element }">
                <VRow
                  :id="element.UNIT_ID" 
                  class="todo-item"
                  @mousedown="selectRow(element)"
                >
                  <VCol cols="12" md="2">
                    <VRow>
                      <VCol cols="12" md="1" align-self="center">
                        <VCheckbox
                          v-model="element.UNIT_CHECK"
                          true-value="Y" 
                          false-value="N"
                        />
                      </VCol>                      
                      <VCol cols="12" md="11">
                        <v-sheet class="d-flex flex-column">
                          <i-textarea
                            v-model="element.UNIT_NM"
                            width="100%"
                            @update:modelValue="element.UNIT_CHECK='Y'"
                            :readonly="isApproving(currentGrdData)"
                          />
                          <VCheckbox
                            label="현장위험성평가 대상"
                            true-value="Y"
                            false-value="N"
                            v-model="element.ORA_YN"
                            @update:modelValue="onClickORA_YN(element)"
                          />
                        </v-sheet>
                        <!-- autoCheck() -->
                      </VCol>
                    </VRow>
                  </VCol>
                  <VCol cols="12" md="8" class="ml-5">
                    <draggable 
                      v-model="element.child" 
                      :options="dragOptions"
                      @start="onDragStart" 
                      @end="onDragEnd"
                      item-key="id"
                    >
                      <template #item="{ element }"> 
                        <VRow
                          :id="element.RISK_ID" 
                          class="todo-card" 
                          @mousedown="selectCard(element)" 
                          height="100%"
                        >
                          <VCol cols="12" md="12">
                            <VRow>
                              <VCol cols="12" md="4">
                                <!-- 작업표준 신규제정 - 수시위험성 평가조회(비일상작업) 버튼 클릭 시 -->
                                <VRow v-if="props.menuId === 'RSKBA0010'">
                                  <VCol cols="12" md="12">
                                    <i-textarea
                                      width="100%"
                                      :readonly="isApproving(currentGrdData)"
                                      v-model="element.RISK_NM"
                                    /> 
                                  </VCol>
                                </VRow>
                                <!-- 수시 위험성평가 등록/현황 화면 -->
                                <VRow v-else>
                                  <VCol cols="12" md="1" align-self="center">
                                    <VCheckbox
                                      v-model="element.RISK_CHECK"
                                      true-value="Y"
                                      false-value="N"
                                    />
                                  </VCol>
                                  <VCol cols="12" md="11">
                                    <i-textarea
                                      width="100%"
                                      v-model="element.RISK_NM"
                                      :readonly="isApproving(currentGrdData)"
                                      @update:modelValue="element.RISK_CHECK = 'Y'"
                                    /> 
                                  </VCol>
                                </VRow>
                              </VCol>
                              <VCol cols="12" md="2"> 
                                <i-select
                                  width="100%"
                                  v-model="element.RISK_LEVEL" 
                                  :items="codeList.RISK_LEVEL"
                                  item-value="COD"
                                  item-title="TXT"
                                  @update:modelValue="element.RISK_CHECK = 'Y'"
                                  :bg-color="getColor(element.RISK_LEVEL)"
                                  :readonly="isApproving(currentGrdData)"
                                />
                              </VCol>
                              <VCol cols="12" md="3">
                                <i-textarea
                                  width="100%"
                                  v-model="element.RM_NM"
                                  :readonly="isApproving(currentGrdData)"
                                  @update:modelValue="element.RISK_CHECK = 'Y'"
                                />
                              </VCol>
                              <VCol cols="12" md="3">
                                <div class="d-flex justify-end">
                                  <div>{{ `첨부: ${element.FILE_COUNT}개` }}</div>
                                  <VIcon :size="24" color="info" icon="mdi-image" @click="openFile(element)" style="margin-top: -4px;" />
                                </div>
                                <i-textarea
                                  margin="0"
                                  width="100%"
                                  :row="4"
                                  v-model="element.REMARK"
                                  :readonly="isApproving(currentGrdData)"
                                  @update:modelValue="element.RISK_CHECK = 'Y'"
                                />
                              </VCol>
                            </VRow>
                          </VCol>
                        </VRow>
                      </template>            
                    </draggable>
                  </VCol>
                </VRow>
              </template>
            </draggable>
          </v-sheet>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <!-- 수시위험성평가 추가 팝업 -->
  <RskAddPopup 
    ref="rskAddPopup"
    @selected="searchData"    
  />
  <!-- 참석자 선택 팝업 -->
  <SelectAddEmpPopup 
    ref="selectAddEmpPopup"
    @selected="onSelectEmp"
    @closed="closeSelectEmp"
  />
  <!-- 파일 업로드 -->
  <FileUpload 
    ref="fileUpload"
    @selected="onFileSelected"
  />
  <!-- 부서 선택 팝업 -->
  <SelectDeptPopup
    ref="selectDeptPopup"
    @selected="onSelectDept"
  />
  <!-- 리포트 -->
  <OZReport
    :showPop="showOz"
    :reportName="reportName"
    :params="params"
    @close="showOz = $event"
  />
  <!-- 설명팝업 -->
  <Discript
    ref="discript"
  />
  <!-- 설명팝업 -->
  <LocationPopup
    ref="locationPopup"
    @selectedArr="selectedLocation"
  />
  <IUploadPopup
    ref="imgUploadPopup"
    imgOnly
    fileDan
    :buttonList="isApproving(currentGrdData) ? ['btnDownLoad', 'btnClose'] : ['btnFileUpload', 'btnDownLoad', 'btnDelete', 'btnClose']"
    :readOnly="props.menuId === 'RSKBA0010' || isApproving(currentGrdData)"
    @uploaded="uploaded($event)"
  />
  <ApprovalPopup ref="refApprovalPopup" @approvalAppkey="afterApproval" />
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
    min-height: 700px;
  }
}

// 수시 위험성평가 상세항목 영역 overflow
.detail-area {
  position: relative;
  height: calc(100vh - 470px);
  overflow-y: auto;
  > div {
    min-height: 300px;
  }
}

.selected-draggable {
  background-color: #F5F5F5;
  transition: all 0.3s;
}

.selected-card {
  background-color: #E0E0E0;
  transition: all 0.3s;
}
</style>
