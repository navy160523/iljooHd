<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonSendApi, getCodeList,} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import CompPopup from './MNGAC0020Popup.vue'
import OZReport from '@/components/OZReport.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'

defineOptions({
  name:'10_management-MNG_A-MNGAC0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const logsStore = useLogsStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const compPopup = ref(null)
const approvalPopup = ref(null)
const appData = reactive({})
const flag = ref(null)

let korean = /[^.0-9]/g

const btnAuthParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.deptCd,
  // ASGN_CD: userStore.asgnCd,
  EMP_NO: userStore.userId,
})

const btnAuth = ref(false)
const SAVEDYN = ref(null)
const autoSaveList= ref({})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),  
  REV: '',
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm,
  DEPT_CD: userStore.deptCd,
  YN_OUT: userStore.userDiv === 'A' ? 'N' : 'Y',
  ADD_YN: '',
  EMIAD_DOC_NO: ''
})

const confirmSaveParam = reactive({
  CMPNY_DIV: null,
  ASGN_CD: null,
  BSNS_CD: null,
  REV: null,
  CNFM_YN: null,
  YEAR: null,
  YN_OUT: null,
  USER_ID: userStore.userId,
})

const COMPList = reactive([
  { value: '', label: '' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
])

const EM_GRD_LIST = reactive([])

const state = reactive({
  WRITE_DATE: null,         // 작성일
  EDTR_NAME: null,          // 작성자
  CNFM_DATE: null,          // 확정일
  ZZ_APP_STATUS_DES: null,  // 결재진행상태
  YN_OUT: userStore.userDiv === 'A' ? 'N' : 'Y',  
  ESG_CHK_STAT: null,       // 환경직책과장 승인 상태
  REQ_EMP_EMAIL: null,      // 검토 요청자 메일
  APP_EMP_EMAIL: null,      // 검토 승인자 메일
})

const mailParams = reactive({
  EMAIL: [],
  REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})

// Grid SelectCheckBox
const wrkList = reactive([])
const occrList = reactive([])
const impctList = reactive([])
const dtrList = reactive([])
const evalList = reactive([])
const saveParam = ref(null)

// 그리드 리스트
const gridData = reactive([])

const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

const reportName = ref('/manage/hse/MNGAC0020.ozr')

// Grid SelectCheckBox 값 조회
const initCodeList = () => {
  Promise.all([    
    // 작업조건
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF13', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),
    
    // 발생시점
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF14', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),
    
    // 영향범위
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF15', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),
    
    // 직/간접영향
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF16', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),

    // 평가불유사유
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF17', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),

    commonSearchApi({ queryId : 'MNGAC0020_SEARCH_04', param: { CMPNY_DIV: userStore.cmpnyDiv } }),
    // 환경직책 과장 Email
    getCodeList('HHIAF24'),
  ]).then(res => {
    wrkList.value = res[0].ORESULT_CUR
    occrList.value = res[1].ORESULT_CUR
    impctList.value = res[2].ORESULT_CUR
    dtrList.value = res[3].ORESULT_CUR
    evalList.value = res[4].ORESULT_CUR

    EM_GRD_LIST.value = res[5].ORESULT_CUR

    grdMain.value.setBindingColumn("WRK_COND_CD", wrkList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("OCCR_CD", occrList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("EM_IMPCT_CD", impctList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("DRT_DIV", dtrList.value, "COD", "TXT")

    onButtonsClick({ id: 'btnSearch' })
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: {  visible: true }, header: { height: 68 }, stateBar: { visible: false } },
  keys : ['PRCS_CD','DET_PRCS_CD','EM_PART_CD'],
  fields : [ 
    { fieldName: 'PRCS_CD', dataType: 'text', width: '60', header: { text: t('순번') }, editable: false, mergeRule: { "criteria": "value" } },
    { fieldName: 'PRCS_DESC', dataType: 'text', header: { text: t('명칭') }, styleName: 'left-column', editable: false, mergeRule: { "criteria": "value" } },
    //{ fieldName: 'INPUT', dataType: 'text', header: { text: t('투입') }, styleName: 'left-column', editable: false }, // 2025.01.23 김민기 선임 요청으로 삭제 처리
    { fieldName: 'DET_PRCS_CD', dataType: 'text', width: '60', header: { text: t('순번') }, editable: false, mergeRule: { criteria: "value['PRCS_CD'] + value['PRCS_DESC']+ value" } },
    { fieldName: 'DET_PRCS_DESC', dataType: 'text', header: { text: t('명칭') }, styleName: 'left-column', editable: false, mergeRule: { "criteria": "value" }  },
    //{ fieldName: 'DISPOSE', dataType: 'text', header: { text: t('배출') }, styleName: 'left-column', editable: false }, // 2025.01.23 김민기 선임 요청으로 삭제 처리
    { fieldName: 'EM_PART_CD', dataType: 'text', width: '60', header: { text: t('순번') }, editable: false },
    { fieldName: 'EM_PART_DESC', dataType: 'text', width: '200', header: { text: t('명칭') }, styleName: 'left-column', editable: false },
    { fieldName: 'WRK_COND_CD', dataType: 'text', width: '100', header: { text: t('작업조건') }, editable: false ,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'OCCR_CD', dataType: 'text', header: { text: t('발생시점') }, editable: false,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'DRT_DIV', dataType: 'text', header: { text: t('직/간접영향') }, editable: false,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'EM_IMPCT_CD', dataType: 'text', header: { text: t('영향범위') }, editable: false,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'COMP_FREQ', dataType: 'text', width: '80', header: { text: t('빈도'), styleName: 'header_validit' },lookupDisplay: true, lookupData: COMPList,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true }, styleName: 'editable_column' },
    { fieldName: 'COMP_INTEN', dataType: 'text', width: '80', header: { text: t('강도'), styleName: 'header_validit' },lookupDisplay: true, lookupData: COMPList,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true }, styleName: 'editable_column' },
    { fieldName: 'COMP_GRD', dataType: 'text', width: '80', header: { text: t('등급') }, editable: false  },
    { fieldName: 'ADD_YN', dataType: 'text', width: '100', header: { text: t('중대환경 영향 대상') },
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N'}, editable: true, styleName: 'left-column, editable_column'},
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false  },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible: false  },
    { fieldName: 'REV', dataType: 'text', header: { text: t('차수') } , visible: true },    
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부') } , visible: false },
    { fieldName: 'rowGbn', dataType: 'text', header: { text: t('원본 데이터 구분') } , visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') } , visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') } , visible: false },
    { fieldName: 'ADD_YN1', dataType: 'text', header: { text: t('ADD_YN1') } , visible: false },
    { fieldName: 'EM_EVAL_YN', dataType: 'text', header: { text: t('EM_EVAL_YN') } , visible: false },
  ],
  columns : [],
  columnLayout: [
    {
      name: '구분',
      direction: 'horizontal',
      items: [ 'PRCS_CD', 'PRCS_DESC' ],
      header: { text: t('구분') },
    },
    //'INPUT',
    {
      name: '활동공정',
      direction: 'horizontal',
      items: [ 'DET_PRCS_CD', 'DET_PRCS_DESC' ],
      header: { text: t('활동공정') },
    },
    //'DISPOSE',
    {
      name: '환경영향 측면',
      direction: 'horizontal',
      items: [ 'EM_PART_CD', 'EM_PART_DESC' ],
      header: { text: t('환경영향 측면') },
    },
    'WRK_COND_CD',
    'OCCR_CD',
    'DRT_DIV',
    'EM_IMPCT_CD',
    {
      name: 'popupBtn',
      direction: 'horizontal',
      items: [ 'COMP_FREQ', 'COMP_INTEN', 'COMP_GRD' ],
      header: { text: '환경영향 평가 기준',
        template: "<div style='width: 100%; height: 30px;'><input type='button' value='환경영향 평가 기준 보기' style='width: 100%; height: 95%;' class='v-btn v-theme--light bg-primary titleBtn' /> </div>",
      },
    },
    'ADD_YN',
  ],
})

const popup = (grid, clickData) => {
  if(clickData.column === 'popupBtn' && clickData.cellType === 'header' ){
    compPopup.value.openPopup()
  }
}

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch')
  {
    await stateSearch()
  }else if (btn.id === 'btnCreate') {
    addRowData()
  }else if (btn.id === 'btnUpdate') {    
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('목록이 전체삭제 됩니다. 삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }else if(btn.id === 'btnCopy'){
    let path = useLogsStore().path.split('/')
    let menuId = path[path.length -1] 

    copyPopup.value.openCopyPopup(menuId, searchParams)
  }else if(btn.id === 'btnConfirm'){
    confirmSaveParam.CNFM_YN = 'Y'

    new saveFlowHelper(vm, t)
      .setConfirmMessage('환경경영 영향평가를 확정 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(confirmSave)
      .setQuery(confirmData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if(btn.id === 'btnCancelConfirm'){
    confirmSaveParam.CNFM_YN = 'N'

    new saveFlowHelper(vm, t)
      .setConfirmMessage('환경경영 영향평가를 확정취소 하시겠습니까?')
      .setGridList([grdMain])
      .setBefore(confirmSave)
      .setQuery(confirmData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }else if(btn.id === 'btnPrint') {
    if(params.value.length === 0){
      Message.warn(t('조회 후 진행 하십시오.'))

      return
    }
    showOz.value = true
  } else if(btn.id === 'btnTargetAutoCreate'){

    new saveFlowHelper(vm, t)
      .setConfirmMessage('평가대상 측면목록을 자동생성 하시겠습니까?')
      .setQuery(autoSaveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if(btn.id === 'btnReqApply') {
    // 중대환경 영향 대상 체크 확인
    chkADD_YN()
    if (!flag.value && state.ESG_CHK_STAT !== 'Y'){
      //let title1 = ' 중대환경영향 대상이 없는 부서인 경우,\r\n ISO 환경 담당자(김민기 선임) 검토가 필요합니다. \r\n 검토 요청 하시겠습니까? '
      let title1 = ' 중대환경영향 대상이 없는 부서인 경우,\r\n ISO 환경 담당자(임정현 책임) 검토가 필요합니다. \r\n 검토 요청 하시겠습니까? '
      let title2 = ' 중대환경영향 대상이 없는 부서인 경우,\r\n 환경 담당 부서의 검토가 필요합니다. \r\n 검토 요청 하시겠습니까? '          
      let ck = await vm.$swal({
        title: userStore.cmpnyDiv === 'HHI' ? title1 : title2,
        showCancelButton: true,
      })

      if (!ck.isConfirmed)
        return

        new saveFlowHelper(vm, t)
        .showMessage(false)
        .setQuery(setESG_STAT('B'))
        .setAfter(stateSearch('REQ'))
        .run()
      
      // vm.$nextTick(()=>{
      //   // 메일 발송
      //   //mailParams.EMAIL = ['BP21926@bp.hhi.co.kr']
      //   mailParams.SUBJECT = searchParams.ASGN_NM + '환경영향평가 검토'
      //   mailParams.CONTENT = searchParams.ASGN_NM + ' 환경영향 평가 검토 요청 드립니다.' + state.APP_EMP_EMAIL
      // })
      
      // if (state.APP_EMP_EMAIL){        
      //   commonSendApi(mailParams).then((res) => {      
      //   }).catch((err) => {
      //     console.log(err, 'err')
      //   }).finally((err) => {
      //   })
      // }

      onButtonsClick({ id :'btnSearch' })
      
    } else {
      // 결재 상신
      reqApply()

      // 재조회
      stateSearch()
    }

  // 승인 버튼
  } else if (btn.id === 'btnApprove') {
    let ck = await vm.$swal({
      title: t(
        '승인 하시겠습니까?'
      ),
      showCancelButton: true,
    })

    if (!ck.isConfirmed)
      return
        
    new saveFlowHelper(vm, t)
      .showMessage(false)
      .setQuery(setESG_STAT('Y'))
      .setAfter(stateSearch('APP'))
      .run()

    // // 메일 발송
    // mailParams.EMAIL = [state.REQ_EMP_EMAIL]
    // mailParams.SUBJECT = searchParams.ASGN_NM + '환경영향평가 승인'
    // mailParams.CONTENT = searchParams.ASGN_NM + ' 환경영향 평가 승인 완료 되었습니다. 결재를 진행해 주세요.'
    
    // commonSendApi(mailParams).then((res) => {      
    // }).catch((err) => {
    //   console.log(err, 'err')
    // }).finally((err) => {
    // })

  // 반려 버튼
  } else if (btn.id === 'btnReject') {
    let ck = await vm.$swal({
      title: t(
        '반려 하시겠습니까?'
      ),
      showCancelButton: true,
    })

    if (!ck.isConfirmed)
      return

    new saveFlowHelper(vm, t)
      .showMessage(false)
      .setQuery(setESG_STAT('C'))
      .setAfter(stateSearch('REJ'))
      .run()

    // // 메일 발송
    // mailParams.EMAIL = [state.REQ_EMP_EMAIL]
    // mailParams.SUBJECT = searchParams.ASGN_NM + '환경영향평가 반려'
    // mailParams.CONTENT = searchParams.ASGN_NM + ' 환경영향 평가가 반려 되었습니다. 재작성 요청드립니다.'
    
    // commonSendApi(mailParams).then((res) => {      
    // }).catch((err) => {
    //   console.log(err, 'err')
    // }).finally((err) => {
    // })
  }
}

// 작성일, 작성자, 결재완료일, 진행상태
const stateSearch = async (gbn) => {

  // HSE 추진자 확인 조회
  searchHseAuth()
  
  state.EDTR_NAME = null
  state.WRITE_DATE = null
  state.CNFM_DATE = null
  state.ZZ_APP_STATUS_DES = null
  //state.YN_OUT = null
  state.ESG_CHK_STAT = null
  state.REQ_EMP_EMAIL = null
  state.APP_EMP_EMAIL = null

  //searchParams.REV = null
  SAVEDYN.value = null

  params.value = []
  for(let i in autoSaveList.value){
    autoSaveList.value[i] = null
  }
  // autoSaveList.value = []

  // 2025년 데이터는 복사 버튼 숨김
  menuTitle.value.setBtnProperty('btnCopy', 'visible', false)

  // 직영
  if (state.YN_OUT === 'N'){
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', true)       // 결재
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', false)       // 확정
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false) // 확정취소
  }
  // 협력사
  else{
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', false)     // 결재 - 협력사는 오피스 결재X
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', true)       // 확정
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', true) // 확정취소
  }

  menuTitle.value.disableBtn('btnUpdate', true)               // 저장
  menuTitle.value.disableBtn('btnDelete', true)               // 삭제
  menuTitle.value.disableBtn('btnConfirm', true)              // 확정
  menuTitle.value.disableBtn('btnCancelConfirm', true)        // 확정취소
  menuTitle.value.disableBtn('btnTargetAutoCreate', true)     // 평가대상 측면목록 자동생성
  menuTitle.value.disableBtn('btnReqApply', true)             // 결재상신

  commonSearchApi({ queryId: "MNGAC0020_SEARCH_01", param: searchParams }).then(res => {
    if(res.ORESULT_CUR.length > 0){
      state.EDTR_NAME         = res.ORESULT_CUR[0].EDTR_NAME ? res.ORESULT_CUR[0].EDTR_NAME : userStore.empNm
      state.WRITE_DATE        = res.ORESULT_CUR[0].WRITE_DATE ? dayjs(res.ORESULT_CUR[0].WRITE_DATE).format('YYYY-MM-DD') : dayjs(new Date).format('YYYY-MM-DD')
      state.CNFM_DATE         = res.ORESULT_CUR[0].CNFM_DATE ? dayjs(res.ORESULT_CUR[0].CNFM_DATE).format('YYYY-MM-DD') : null
      state.ZZ_APP_STATUS_DES = res.ORESULT_CUR[0].ZZ_APP_STATUS_DES
      //state.YN_OUT            = res.ORESULT_CUR[0].YN_OUT
      state.ESG_CHK_STAT      = res.ORESULT_CUR[0].ESG_CHK_STAT
      state.REQ_EMP_EMAIL     = res.ORESULT_CUR[0].REQ_EMP_EMAIL
      state.APP_EMP_EMAIL     = res.ORESULT_CUR[0].APP_EMP_EMAIL

      searchParams.REV          = res.ORESULT_CUR[0].REV
      searchParams.ADD_YN       = res.ORESULT_CUR[0].ADD_YN
      searchParams.EMIAD_DOC_NO = res.ORESULT_CUR[0].EMIAD_DOC_NO

      SAVEDYN.value = res.ORESULT_CUR[0].SAVEDYN
      // autoSaveList.value.push(res.ORESULT_CUR[0])
      for(let i in res.ORESULT_CUR[0]){
        autoSaveList.value[i] = res.ORESULT_CUR[0][i]
      }

      // 환경 직책과장 검토 여부
      if (res.ORESULT_CUR[0].ESG_CHK_STAT === 'B'){
        menuTitle.value.disableBtn('btnApprove', false)  // 승인
        menuTitle.value.disableBtn('btnReject', false)   // 거절
      } else {
        menuTitle.value.disableBtn('btnApprove', true)  // 승인
        menuTitle.value.disableBtn('btnReject', true)   // 거절
      }
      
      
      if (btnAuth.value){

        // 직영 일때
        if (state.YN_OUT === 'N'){
          // 결재 키 존재
          if(res.ORESULT_CUR[0].ZZ_APP_STATUS !== null){
            if (res.ORESULT_CUR[0].ZZ_APP_STATUS === 'Y'){
              menuTitle.value.disableBtn('btnConfirm', false)
            } 
            // 반려/취소 상태이면 결재 상신, 저장, 삭제, 자동생성 활성화
            else if (res.ORESULT_CUR[0].ZZ_APP_STATUS === 'C' || res.ORESULT_CUR[0].ZZ_APP_STATUS === 'Z'){
              menuTitle.value.disableBtn('btnReqApply', false)
              menuTitle.value.disableBtn('btnUpdate', false)
              menuTitle.value.disableBtn('btnDelete', false)
              menuTitle.value.disableBtn('btnTargetAutoCreate', false)
            }
          } else {
            menuTitle.value.disableBtn('btnUpdate', false)
            menuTitle.value.disableBtn('btnDelete', false)
            menuTitle.value.disableBtn('btnTargetAutoCreate', false)

            if (res.ORESULT_CUR[0].ESG_CHK_STAT === 'B' || res.ORESULT_CUR[0].ESG_CHK_STAT === 'Y'){
                menuTitle.value.disableBtn('btnUpdate', true)
                menuTitle.value.disableBtn('btnDelete', true)
                menuTitle.value.disableBtn('btnTargetAutoCreate', true)
            }

            menuTitle.value.disableBtn('btnReqApply', false)
          }
        
        // 협력사 일때
        } else {
          if(res.ORESULT_CUR[0].CNFM_DATE){
            menuTitle.value.disableBtn('btnCancelConfirm', false)     // 확정취소
          } else {
            menuTitle.value.disableBtn('btnConfirm', false)
            menuTitle.value.disableBtn('btnUpdate', false)
            menuTitle.value.disableBtn('btnDelete', false)
            menuTitle.value.disableBtn('btnTargetAutoCreate', false)
          }
        }

      }
      /*▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ PSJ 수정 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼*/
      // // 첫번째 ROW의 확정일(CNFM_DATE) 값이 있을경우 활성화 
      // if(res.ORESULT_CUR[0].CNFM_DATE && btnAuth.value){
      //   menuTitle.value.disableBtn('btnCancelConfirm', false)     // 확정취소
      //   //menuTitle.value.disableBtn('btnTargetAutoCreate', false)  // 평가대상측면 목록 자동생성
      // } else {
      //   // 미확정 결재 키 존재
      //   if(res.ORESULT_CUR[0].ZZ_APP_STATUS !== null){
        
      //     // 직영인 경우
      //     if (btnAuth.value && res.ORESULT_CUR[0].YN_OUT === 'N'){
      //       // 결재 상신인 경우 -> 확정버튼 활성화
      //       if (res.ORESULT_CUR[0].ZZ_APP_STATUS === 'Y'){
      //         menuTitle.value.disableBtn('btnConfirm', false)
      //       } 
      //       // 반려/취소 상태이면 결재 상신, 저장, 삭제, 자동생성 활성화
      //       else if (res.ORESULT_CUR[0].ZZ_APP_STATUS === 'C' || res.ORESULT_CUR[0].ZZ_APP_STATUS === 'Z'){
      //         menuTitle.value.disableBtn('btnReqApply', false)
      //         menuTitle.value.disableBtn('btnUpdate', false)
      //         menuTitle.value.disableBtn('btnDelete', false)
      //         menuTitle.value.disableBtn('btnTargetAutoCreate', false)
      //       }
      //     }
      //   } 
      //   // 미확정 결재 키 값 X
      //   else 
      //   {
      //     if(btnAuth.value){
      //       menuTitle.value.disableBtn('btnUpdate', false)
      //       menuTitle.value.disableBtn('btnDelete', false)
      //       menuTitle.value.disableBtn('btnTargetAutoCreate', false)

      //       // 직영 - 결재
      //       if (state.YN_OUT === 'N'){
      //         if (res.ORESULT_CUR[0].ESG_CHK_STAT === 'B' || res.ORESULT_CUR[0].ESG_CHK_STAT === 'Y'){
      //           menuTitle.value.disableBtn('btnUpdate', true)
      //           menuTitle.value.disableBtn('btnDelete', true)
      //           menuTitle.value.disableBtn('btnTargetAutoCreate', true)
      //         }

      //         menuTitle.value.disableBtn('btnReqApply', false)
      //       }
      //       // 협력사 - 확정
      //       else{
      //         menuTitle.value.disableBtn('btnConfirm', false)
      //       }
      //     }
      //   }
      // }

      /*▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ PSJ 수정 ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲*/


      // if(!res.ORESULT_CUR[0].CNFM_DATE && ((res.ORESULT_CUR[0].YN_OUT === 'Y' && btnAuth.value) ||
      //   (res.ORESULT_CUR[0].YN_OUT === 'N' && btnAuth.value && res.ORESULT_CUR[0].ZZ_APP_STATUS_DES === '결재완료'))){
      //   // CNFM_DATE_PLAN 값이 없을경우
      //   vm.$swal({ 
      //     title: t('미확정 상태입니다. 작성이 완료되었으면 확정처리 하시기 바랍니다. '), 
      //     showCancelButton: false,
      //   })
      // }
      setPrint(res.ORESULT_CUR[0])
      
      if (gbn === 'REQ'){
        // 검토 요청 메일 발송
        mailParams.EMAIL = [state.APP_EMP_EMAIL]
        mailParams.SUBJECT = searchParams.ASGN_NM + '환경영향평가 검토'
        mailParams.CONTENT = searchParams.ASGN_NM + ' 환경영향 평가 검토 요청 드립니다.'

        if (state.APP_EMP_EMAIL){
          commonSendApi(mailParams).then((res) => {      
          }).catch((err) => {
            console.log(err, 'err')
          }).finally((err) => {
          })
        }

      }else if(gbn === 'APP'){

        // 검토 승인 메일 발송
        mailParams.EMAIL = [state.REQ_EMP_EMAIL]
        mailParams.SUBJECT = searchParams.ASGN_NM + '환경영향평가 승인'
        mailParams.CONTENT = searchParams.ASGN_NM + ' 환경영향 평가 승인 완료 되었습니다. 결재를 진행해 주세요.'
    

        if (state.REQ_EMP_EMAIL){
          commonSendApi(mailParams).then((res) => {      
          }).catch((err) => {
            console.log(err, 'err')
          }).finally((err) => {
          })
        }

      }else if(gbn === 'REJ'){
        // 검토 반려 메일 발송
        mailParams.EMAIL = [state.REQ_EMP_EMAIL]
        mailParams.SUBJECT = searchParams.ASGN_NM + '환경영향평가 반려'
        mailParams.CONTENT = searchParams.ASGN_NM + ' 환경영향 평가가 반려 되었습니다. 재작성 요청드립니다.'
        
        if (state.REQ_EMP_EMAIL){
          commonSendApi(mailParams).then((res) => {      
          }).catch((err) => {
            console.log(err, 'err')
          }).finally((err) => {
          })  
        }
      }

    }
    // 환경영향 평가 조회 결과가 없는 경우
    else {
      state.EDTR_NAME = ''
      state.WRITE_DATE = ''
      menuTitle.value.disableBtn('btnUpdate', false)               // 저장
      menuTitle.value.disableBtn('btnDelete', false)               // 삭제
      menuTitle.value.disableBtn('btnTargetAutoCreate', false)     // 자동생성
    }
    
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData02) 
      .setAfter(afterSearch)
      .run()

  }).finally(() => {
    // new queryFlowHelper(vm, t)
    //   .setGridList([grdMain])
    //   .setQuery(searchData02) 
    //   .setAfter(afterSearch)
    //   .run()
  })

  return true
}

// 메인그리드
const searchData02 = () => {
  searchParams.REV = searchParams.REV === null ? searchParams.YEAR + '-01' : searchParams.REV

  return commonSearchApi({ queryId : 'MNGAC0020_SEARCH_02', param: searchParams })
}

const afterSearch = async res => {
  if(res.ORESULT_CUR.length > 0 ){
    if(!state.CNFM_DATE && ((state.YN_OUT === 'Y' && btnAuth.value) ||
      (state.YN_OUT === 'N' && btnAuth.value && state.ZZ_APP_STATUS_DES === '결재완료'))){
    // CNFM_DATE_PLAN 값이 없을경우
    // vm.$swal({ 
    //   title: t('미확정 상태입니다. 작성이 완료되었으면 확정처리 하시기 바랍니다. '), 
    //   showCancelButton: false,
    // })
  }
  }

  let cnt = 0
  res.ORESULT_CUR.forEach(element => {
    element.rowGbn = cnt++
  })
  gridData.values = await res.ORESULT_CUR
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getGridView().setFocus(0)
}

const beforeSave = async () => {
  saveParam.value = []

  let result = true
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  } else {
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchParams.CMPNY_DIV
      data.ASGN_CD = searchParams.ASGN_CD
      data.BSNS_CD = searchParams.BSNS_CD
      data.REV = searchParams.REV
      data.USER_ID = userStore.userId

      saveParam.value.push(data)
    })
  }

  return result
}

const beforeDelete = async () => {

  saveParam.value = [{
    CMPNY_DIV: searchParams.CMPNY_DIV,
    ASGN_CD: searchParams.ASGN_CD,
    BSNS_CD: searchParams.BSNS_CD,
    YEAR: searchParams.YEAR,
  }]

  return true
}

/* ******************* 저장 ******************** */
const saveData = () => {
  return commonExecuteApi({ queryId: "MNGAC0020_SAVE_02", list: saveParam.value })
}

/* ******************* 삭제 ******************** */
const deleteData = () => {  
  return commonExecuteApi({ queryId : 'MNGAC0020_DELETE_01', list: saveParam.value })
}

/* ******************* 확정 ******************* */
const confirmSave = async () => {
  let result = true

  let chekedRow = await grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length > 0){
    Message.warn(t('저장 후 진행 하십시오.'))

    result = false
  }

  confirmSaveParam.CMPNY_DIV = searchParams.CMPNY_DIV,
  confirmSaveParam.ASGN_CD = searchParams.ASGN_CD,
  confirmSaveParam.BSNS_CD = searchParams.BSNS_CD,
  confirmSaveParam.REV = searchParams.REV,
  confirmSaveParam.YEAR = searchParams.YEAR,
  confirmSaveParam.YN_OUT = searchParams.YN_OUT

  if(searchParams.ADD_YN !== 'Y'){
    Message.warn(t('환경영향측면 파악을 등록/저장 하신 후 진행 하십시오.'))

    result = false
  }

  // if(searchParams.YN_OUT !== 'Y'){
  //   Message.warn(t('결재 완료 후 진행 하십시오.'))

  //   result = false
  // }

  return result
}

const confirmData = () => {
  return commonExecuteApi({ queryId: "MNGAC0020_SAVE_05", list: [confirmSaveParam] })
}

const autoSaveData = () => {
  
  commonSearchApi({ queryId : 'MNGAC0010_SEARCH_02', param: searchParams }).then(res => {
    if (res.ORESULT_CUR.length > 0){
      autoSaveList.value.USER_ID = userStore.userId
      commonExecuteApi({ queryId: "MNGAC0020_SAVE_03", list: [autoSaveList.value] })

      confirmSaveParam.CMPNY_DIV = searchParams.CMPNY_DIV,
      confirmSaveParam.ASGN_CD = searchParams.ASGN_CD,
      confirmSaveParam.BSNS_CD = searchParams.BSNS_CD,
      confirmSaveParam.REV = searchParams.REV,
      confirmSaveParam.YEAR = searchParams.YEAR,
      confirmSaveParam.YN_OUT = searchParams.YN_OUT
      confirmSaveParam.EMIAD_DOC_NO = searchParams.EMIAD_DOC_NO
      confirmSaveParam.WRITE_DATE = state.WRITE_DATE ? state.WRITE_DATE : dayjs().format('YYYYMMDD')
      confirmSaveParam.EDTR_NAME = state.EDTR_NAME ? state.EDTR_NAME : userStore.userName

      return commonExecuteApi({ queryId: "MNGAC0020_SAVE_01", list: [confirmSaveParam] })
    }
    else {
      Message.warn(t('환경영향측면 파악을 등록/저장 하신 후 진행 하십시오.'))
      return
    }
  })

  // if(SAVEDYN.value === 'Y') {
  //   return commonExecuteApi({ queryId: "MNGAC0020_SAVE_03", list: [autoSaveList.value] })
  // }else {
  //   confirmSaveParam.CMPNY_DIV = searchParams.CMPNY_DIV,
  //   confirmSaveParam.ASGN_CD = searchParams.ASGN_CD,
  //   confirmSaveParam.BSNS_CD = searchParams.BSNS_CD,
  //   confirmSaveParam.REV = searchParams.REV,
  //   confirmSaveParam.YEAR = searchParams.YEAR,
  //   confirmSaveParam.YN_OUT = searchParams.YN_OUT
  //   confirmSaveParam.EMIAD_DOC_NO = searchParams.EMIAD_DOC_NO
  //   confirmSaveParam.WRITE_DATE = dayjs().format('YYYYMMDD')
  //   confirmSaveParam.EDTR_NAME = userStore.empNm

  //   return commonExecuteApi({ queryId: "MNGAC0020_SAVE_01", list: [confirmSaveParam] })
  // }
}

/* ******************* 팝업 오픈 ******************* */
const openPopup = gbn => {
  if (gbn === '부서조회') {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv, 
      HSE_ONLY : 'Y', 
      ASGN_NM : searchParams.ASGN_NM,
    })
  } else {
    deptPopup.value.openPopup({})
  }
}

/* ******************** 출력 ***********************  */
const setPrint = val => {
  let WRITE_DATE = val.WRITE_DATE ? dayjs(val.WRITE_DATE).format('YYYY년 MM월 DD일') : dayjs(new Date).format('YYYY년 MM월 DD일')
  params.value = [
    "IN_CMPNY_DIV="+searchParams.CMPNY_DIV,
    "IN_BSNS_CD="+searchParams.BSNS_CD,
    "IN_ASGN_CD="+searchParams.ASGN_CD,
    "IN_YEAR="+searchParams.YEAR,
    "IN_REV="+searchParams.REV,

    'IN_EM_DOC_NO=' + val.EMIAD_DOC_NO,
    'IN_SPAGE=' + '총  Page',
    'IN_WRITE_DATE=' + WRITE_DATE ,
    'IN_ASGN_NM=' + searchParams.ASGN_NM,
    'IN_EDTR_NAME=' + val.EDTR_NAME,
  ]
}

const chkADD_YN = async () => {
  flag.value = true
  let chk_cnt = grdMain.value.getDataProvider().getJsonRows().filter((x) => x.ADD_YN === "Y") .length
  
  // 중대환경 영향 대상이 있는 경우 결재 / 중대환경 영향이 없으면 환경직책과장 검토 요청
  if (chk_cnt > 0){
    flag.value = true
  } else {
    flag.value = false
  }
}

const setESG_STAT = (stat) => {
  
  let statParam = ({
    YEAR: searchParams.YEAR,
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    ASGN_CD: searchParams.ASGN_CD,
    REV: searchParams.REV,
    ESG_CHK_STAT: stat,
    USER_ID: userStore.empNo,
  })

  return commonExecuteApi({ queryId: "MNGAC0020_SAVE_08", list: [statParam] })
}

/* ******************** 결재상신 ******************** */
const reqApply = async () => {
  let rowCount = await grdMain.value.getDataProvider().getRowCount()
  // let result = await vm.$swal({ 
  //   title: t('결재상신 하시겠습니까? '), 
  //   showCancelButton: true,
  // })
  // if(!result.isConfirmed){
  //   return 
  // }

  appData.CMPNY_DIV = searchParams.CMPNY_DIV
  appData.BSNS_CD = searchParams.BSNS_CD
  appData.ASGN_CD = searchParams.ASGN_CD
  appData.YEAR = searchParams.YEAR
  appData.REV = searchParams.REV
  appData.USER_ID = userStore.userId

  let setGrid = `
  <html>
    <head>      
      <style>
        .tbl {                        
          border: 1px solid #444444;
          border-collapse: collapse;
          font-family:조선일보명조;
          width:100%;
        }                              
        .title2{
          background-color:lightsteelblue;
          font-weight: bold;
          text-align: center;  
          border: 1px solid #444444;
          padding: 5px;
          font-size: 14px;                             
        }
        .item{
          border: 1px solid #444444;
          padding: 5px;
          font-size: 14px;    
          text-align: center;                   
        }        
        .span_25 {
          font-size: 25px; 						
        }
        .span_15 {
          font-size: 15px; 						
        }
      </style>
    </head>
    <body>
      <body>
        <table class="tbl" id="tableList"> 
          <thead>
            <tr>
              <th class="title2" style="width:10%" rowspan = "3">구분</th>
              <th class="title2" style="width:10%" rowspan = "3">활동공정</th>
              <th class="title2" style="width:5%"  rowspan = "3">작업 조건</th>
              <th class="title2" style="width:5%"  rowspan = "3">발생시점</th>
              <th class="title2" style="width:25%" rowspan = "3">환경영향측면</th>
              <th class="title2" style="width:10%" rowspan = "3">영향범위</th>
              <th class="title2" style="width:10%" rowspan = "3">직접/간접 영향</th>
              <th class="title2" style="width:25%" colspan="4" >종합평가</th>
            </tr>
            <tr>
              <th class="title2" colspan = "2">환경위험성</th>
              <th class="title2" rowspan = "2">점수</th>
              <th class="title2" rowspan = "2">등급</th>
            </tr>
            <tr>
              <th class="title2">빈도</th>
              <th class="title2">강도</th>
            </tr>
          </thead>
          <tbody class="grdTbody">
  `
    
  commonSearchApi({ queryId : 'MNGAC0020_SEARCH_03', param: searchParams }).then(res => {
    let height = 24
    let top = 132
    let index = 40
    res.ORESULT_CUR.forEach(item => {
      setGrid += `
        <tr>
					<td class="item">${isNullCheck(item.PRCS_DESC)}</td>
          <td class="item">${isNullCheck(item.DET_PRCS_DESC)}</td>
				  <td class="item">${isNullCheck(item.WRK_COND_DESC)}</td>
          <td class="item">${isNullCheck(item.OCCR_DESC)}</td>
          <td class="item" style="text-align:left">${isNullCheck(item.EM_PART_DESC)}</td>
          <td class="item">${isNullCheck(item.EM_IMPCT_DESC)}</td>
          <td class="item">${isNullCheck(item.DRT_DIV_DESC)}</td>
          <td class="item" style="text-align:right">${isNullCheck(item.COMP_FREQ)}</td>
          <td class="item" style="text-align:right">${isNullCheck(item.COMP_INTEN)}</td>
          <td class="item" style="text-align:right">${isNullCheck(item.COMP_POINT)}</td>
          <td class="item" style="text-align:right">${isNullCheck(item.COMP_GRD)}</td>
          
				</tr>
      `
    })

    setGrid += `
      </tbody>                    
      </table>
      </body>
      </html>
    `
    
  }).finally(() => {
    approvalPopup.value.openPopup({
      CLSS_ID: logsStore.vueId,
      TITLE: '환경영향평가',
      CMPNY_DIV : userStore.cmpnyDiv,
      DATA_KEY:
        searchParams.CMPNY_DIV +
        ";" +
        searchParams.BSNS_CD +
        ";" +
        searchParams.BSNS_CD +
        ";" +
        new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      REPORT : setGrid, 
      MODE : '3', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      CLRLINE : 'CLR_15', //결재라인
    })
  })
  
}

/* ------------ 결재 후 결재ID 저장 ------------ */
const approvalAppkey = (appKey) => {
  appData.APPROVE_ID = appKey
  commonExecuteApi({ queryId: 'MNGAC0020_SAVE_04', list: [appData] })
}

/* ******************* 팝업 선택 이벤트(부서/협력사) ******************* */
const onDeptSelected = val => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
  searchParams.YN_OUT = val.ORGN_DIV === 'A' ? 'N' : 'Y'
  state.YN_OUT = val.ORGN_DIV === 'A' ? 'N' : 'Y'
  
  onButtonsClick({ id: 'btnSearch' })
}

const yearChange = async e => {
  searchParams.YEAR = await searchParams.YEAR.replace(korean, '')
  searchParams.REV = ''
  // let today = Number(dayjs(new Date).format('YYYY'))

  if(searchParams.YEAR.length > 4){
    searchParams.YEAR = await searchParams.YEAR.slice(0, 4)
  }
  // if(searchParams.YEAR >  today){
  //   searchParams.YEAR = today
  // }
}

const onEditRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grid.commit()
  let fieldName = grdMain.value.getDataProvider().getFieldName(field)
  let rowData = grdMain.value.getDataProvider().getJsonRow(dataRow)
  let comp_point = rowData.COMP_FREQ * rowData.COMP_INTEN
  let EM_GRD = null

  EM_GRD_LIST.value.forEach(item => {
    if(item.PNT_FROM <= comp_point && item.PNT_TO >= comp_point){
      EM_GRD = item.EM_GRD
    }
  })
  

  // 등급이 3이하 체크 해제 / 등급 4이상 체크
  // ADD_YN1
  // 빈도 / 강도 변경에 따른 중대환경 영향 대상 체크 여부
  if (fieldName === 'COMP_FREQ' || fieldName === 'COMP_INTEN' ){
    if (EM_GRD >= 4){
      grdMain.value.getDataProvider().setValue(dataRow, 'ADD_YN', 'Y' )
      grdMain.value.getDataProvider().setValue(dataRow, 'ADD_YN1', 'Y' )  
    }else{
      grdMain.value.getDataProvider().setValue(dataRow, 'ADD_YN', 'N' )
      grdMain.value.getDataProvider().setValue(dataRow, 'ADD_YN1', 'N' )  
    }

  // 중대환경 영향 대상 - 4, 5등급은 체크 해제 불가
  } else if (fieldName === 'ADD_YN'){
    if (EM_GRD < 4){
      grdMain.value.getDataProvider().setValue(dataRow, 'ADD_YN', newValue )
      grdMain.value.getDataProvider().setValue(dataRow, 'ADD_YN1', newValue )
    }else{
      grdMain.value.getDataProvider().setValue(dataRow, 'ADD_YN', oldValue )
      grdMain.value.getDataProvider().setValue(dataRow, 'ADD_YN1', oldValue )
    }    
  }

  // 등급 변경
  grdMain.value.getDataProvider().setValue(dataRow, 'COMP_GRD', EM_GRD )

  grdMain.value.getGridView().checkRow(dataRow, true)
}

const searchHseAuth = () => {
  Promise.all([    
    // 버튼 disable (해당부서의 HSE경영시스템 담당자)
    commonSearchApi({ queryId : 'searchHseAuth', param: {CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, ASGN_CD:searchParams.ASGN_CD, EMP_NO: userStore.empNo} }),
  ]).then(res => {
    
    // 해당부서의 HSE경영시스템 담당자면 true
    btnAuth.value = res[0].ORESULT_CUR[0].AUTH === 'Y' ? true : false
  })
}

// null값인지 아닌지 확인
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? '' : val
}

onMounted(() => {
  initCodeList()

  // 환경직책과장 검토 요청 상태 - GRPO00373(환경 총괄관리자) 그룹만 버튼 권한 있음
  menuTitle.value.disableBtn('btnApprove', true)  // 승인
  menuTitle.value.disableBtn('btnReject', true)   // 거절
  if (!userStore.authGrpCd.includes('GRP00373') && !userStore.authGrpCd.includes('HIWAYGRP00001')){
    menuTitle.value.setBtnProperty("btnApprove", "visible", false)
    menuTitle.value.setBtnProperty("btnReject", "visible", false)
  }else{
    menuTitle.value.setBtnProperty("btnApprove", "visible", true)
    menuTitle.value.setBtnProperty("btnReject", "visible", true)    
  }
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnDelete', 'btnPrint', 'btnCopy', 'btnConfirm', 'btnCancelConfirm', 'btnReqApply', 'btnTargetAutoCreate', 'btnApprove', 'btnReject']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex justify-space-between">
          <div class="d-flex">
            <i-input
              :label="$t('년도')"
              labelWidth="35px"
              v-model="searchParams.YEAR"
              @update:modelValue="yearChange"
              type="Number"
              width="200px"
            />
            <i-input 
              :label="$t('부서/ 협력사')"
              label-width="80px"
              width="350px"
              v-model="searchParams.ASGN_NM" 
              append-inner-icon="mdi-magnify" 
              @keydown.enter="e => {
                openPopup('부서조회')
              }"
              @update:modelValue="e => { searchParams.DEPT_CD = null 
                                         searchParams.REV = null }"
              @click:appendInner="openPopup('click')"
              class="ma-0"
            />
            <i-input
              v-model="searchParams.ASGN_CD" 
              readonly 
              width="100px"
            />
          </div>
          <div class="d-flex flex-column">
            <div class="d-flex">
              <i-input
                :label="$t('작성일')"
                labelWidth="70px"
                v-model="state.WRITE_DATE"
                readonly
                width="250px"
              />
              <i-input
                :label="$t('작성자')"
                labelWidth="60px"
                v-model="state.EDTR_NAME"
                readonly
                width="250px"
              />
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('결재/확정일')"
                labelWidth="70px"
                v-model="state.CNFM_DATE"
                readonly
                width="250px"
              />
              <i-input
                :label="$t('진행상태')"
                labelWidth="60px"
                v-model="state.ZZ_APP_STATUS_DES"
                readonly
                width="250px"
              />
            </div>
          </div>
        </v-sheet>
        <v-sheet>
          <strong>※ HSE경영시스템 메뉴는 부서 내 HSE추진자만 입력 가능하며, HSE추진자는 부서에서 직접 관리합니다.</strong>
           &nbsp; - HSE추진자 등록 메뉴 : [운영관리 - 담당자 관리 - 부서별 담당자 등록/관리] 
          <br> &nbsp; - HSE추진자 등록 권한:  부서 내 HSE 추진자, 운영과장 
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onEditRowChanged="onEditRowChanged"
            @onCellClicked="popup"
          />
        </v-sheet>
      </div>
    </v-card-text>

    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />

    <!-- 복사 팝업 -->
    <CopyPopup ref="copyPopup" />

    <!-- 환경영향평가 기준 팝업 -->
    <CompPopup ref="compPopup" />

    <!-- OZReport -->
    <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />

    <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey"/>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>