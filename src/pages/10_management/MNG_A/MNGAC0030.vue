<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import OZReport from '@/components/OZReport.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'

defineOptions({
  name:'10_management-MNG_A-MNGAC0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const logsStore = useLogsStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const approvalPopup = ref(null)
const appData = reactive({})


let korean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/

const btnAuthParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  EMP_NO: userStore.userId,
})

const btnAuth = ref(false)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),  
  REV: null,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm,
  DEPT_CD: userStore.deptCd,
  YN_OUT: userStore.userDiv === 'A' ? 'N' : 'Y',
  ADD_YN: null,
})

const saveParamMain = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),  
  REV: null,
  SEMIR_DOC_NO: '',
  BSNS_CD: '',
  ASGN_CD: '',
  DEPT_CD: '',
  YN_OUT: '',
  WRITE_DATE: '',
  EDTR_NAME: '',
  USER_ID: userStore.userId,
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
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
])

const EM_GRD_LIST = reactive([])

const state = reactive({
  WRITE_DATE: null,     // 작성일
  EDTR_NAME: null,      // 작성자
  CNFM_DATE: null,      // 확정일
  ZZ_APP_STATUS_DES: null,  // 결재진행상태
  YN_OUT: userStore.userDiv === 'A' ? 'N' : 'Y'
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

const reportName = ref('/manage/hse/MNGAC0030.ozr')

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

    commonSearchApi({ queryId : 'MNGAC0020_SEARCH_04', param: { CMPNY_DIV: userStore.cmpnyDiv } }),
    
  ]).then(res => {
    wrkList.value = res[0].ORESULT_CUR
    occrList.value = res[1].ORESULT_CUR
    impctList.value = res[2].ORESULT_CUR
    dtrList.value = res[3].ORESULT_CUR

    EM_GRD_LIST.value = res[4].ORESULT_CUR

    grdMain.value.setBindingColumn("WRK_COND_CD", wrkList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("OCCR_CD", occrList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("EM_IMPCT_CD", impctList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("DRT_DIV", dtrList.value, "COD", "TXT")

    onButtonsClick({ id: 'btnSearch' })
  })
}

const searchHseAuth = () => {
  Promise.all([    
    // 버튼 disable (해당부서의 HSE경영시스템 담당자)
    commonSearchApi({ queryId : 'searchHseAuth', param: {CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, ASGN_CD:searchParams.ASGN_CD, EMP_NO: userStore.empNo} }),
  ]).then(res => {
    // menuTitle.value.disableBtn('btnConfirm', true)
    // menuTitle.value.disableBtn('btnCancelConfirm', true)
    // menuTitle.value.disableBtn('btnReqApply', true)
    // menuTitle.value.disableBtn('btnUpdate', true)

    // 해당부서의 HSE경영시스템 담당자면 true
    btnAuth.value = res[0].ORESULT_CUR[0].AUTH === 'Y' ? true : false

    // 조회한 부서의 HSE추진담당자 일때만 버튼 활성화
    // if(btnAuth.value){
    //   menuTitle.value.disableBtn('btnConfirm', false)
    //   menuTitle.value.disableBtn('btnCancelConfirm', false)
    //   menuTitle.value.disableBtn('btnReqApply', false)
    //   menuTitle.value.disableBtn('btnUpdate', false)
    // }
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
    { fieldName: 'DET_PRCS_CD', dataType: 'text', width: '60', header: { text: t('순번') }, editable: false, mergeRule: { "criteria": "value" } },
    { fieldName: 'DET_PRCS_DESC', dataType: 'text', header: { text: t('명칭') }, styleName: 'left-column', editable: false, mergeRule: { "criteria": "value" }  },
    //{ fieldName: 'DISPOSE', dataType: 'text', header: { text: t('배출') }, styleName: 'left-column', editable: false }, // 2025.01.23 김민기 선임 요청으로 삭제 처리
    { fieldName: 'EM_PART_CD', dataType: 'text', width: '60', header: { text: t('순번') }, editable: false },
    { fieldName: 'EM_PART_DESC', dataType: 'text', width: '200', header: { text: t('명칭') }, styleName: 'left-column', editable: false },
    { fieldName: 'WRK_COND_CD', dataType: 'text', width: '100', header: { text: t('작업조건') }, editable: false ,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'OCCR_CD', dataType: 'text', header: { text: t('발생시점') }, editable: false,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'EM_IMPCT_CD', dataType: 'text', header: { text: t('영향범위') }, editable: false,lookupDisplay: true,
      styleName: 'left-column' },
    { fieldName: 'COMP_GRD', dataType: 'text', width: '80', header: { text: t('등급') }, editable: false  },
    { fieldName: 'DRT_DIV', dataType: 'text', header: { text: t('직/간접영향') }, editable: false,lookupDisplay: true  },
    { fieldName: 'IMPR_PLAN', dataType: 'text', width: '200', header: { text: t('개선계획'), styleName: 'header_validit' }, styleName: 'left-column , editable_column' },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false  },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible: false  },
    { fieldName: 'REV', dataType: 'text', header: { text: t('차수') } , visible: true },    
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부') } , visible: false },
    { fieldName: 'rowGbn', dataType: 'text', header: { text: t('원본 데이터 구분') } , visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') } , visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') } , visible: false },
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
    'EM_IMPCT_CD',
    'COMP_GRD' ,
    // {
    //   name: 'popupBtn',
    //   direction: 'horizontal',
    //   items: [ 'COMP_FREQ', 'COMP_INTEN', ],
    //   header: { text: '환경영향 평가 기준' },
    // },
    'DRT_DIV',
    'IMPR_PLAN',
  ],
})

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
  }else if(btn.id === 'btnConfirm'){
    confirmSaveParam.CNFM_YN = 'Y'

    new saveFlowHelper(vm, t)
      .setConfirmMessage('중대환경영향 개선계획을 확정 하시겠습니까?')
      .setGridList([grdMain])
      .setBefore(confirmSave)
      .setQuery(confirmData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if(btn.id === 'btnCancelConfirm'){
    confirmSaveParam.CNFM_YN = 'N'

    new saveFlowHelper(vm, t)
      .setConfirmMessage('중대환경영향 개선계획을 확정취소 하시겠습니까?')
      .setGridList([grdMain])
      .setBefore(confirmSave)
      .setQuery(confirmData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }else if(btn.id === 'btnReqApply') {
    reqApply()
  }else {
    if(params.value.length === 0){
      Message.warn(t('조회 후 진행 하십시오.'))

      return
    }

    showOz.value = true
  }
}

// 작성일, 작성자, 결재완료일, 진행상태
const stateSearch = () => {

  // HSE 추진자 확인 조회
  searchHseAuth()

  state.EDTR_NAME = null
  state.WRITE_DATE = null
  state.CNFM_DATE = null
  state.ZZ_APP_STATUS_DES = null

  searchParams.REV = null

  params.value = []

  // 직영
  if (userStore.userDiv === 'A'){
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

  menuTitle.value.disableBtn('btnConfirm', true)
  menuTitle.value.disableBtn('btnCancelConfirm', true)
  menuTitle.value.disableBtn('btnReqApply', true)
  menuTitle.value.disableBtn('btnUpdate', true)

  commonSearchApi({ queryId: "MNGAC0030_SEARCH_01", param: searchParams }).then(res => {
    if(res.ORESULT_CUR.length > 0){

      state.EDTR_NAME = res.ORESULT_CUR[0].EDTR_NAME ? res.ORESULT_CUR[0].EDTR_NAME : userStore.empNm
      state.WRITE_DATE = res.ORESULT_CUR[0].WRITE_DATE ? dayjs(res.ORESULT_CUR[0].WRITE_DATE).format('YYYY-MM-DD') : dayjs(new Date).format('YYYY-MM-DD')
      state.CNFM_DATE = res.ORESULT_CUR[0].CNFM_DATE ? dayjs(res.ORESULT_CUR[0].CNFM_DATE).format('YYYY-MM-DD') : null
      state.ZZ_APP_STATUS_DES = res.ORESULT_CUR[0].ZZ_APP_STATUS_DES

      searchParams.REV = res.ORESULT_CUR[0].REV
      searchParams.ADD_YN = res.ORESULT_CUR[0].ADD_YN

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
            menuTitle.value.disableBtn('btnUpdate', false)            // 저장
            menuTitle.value.disableBtn('btnConfirm', false)           // 확정
          }
        }

      // // 첫번째 ROW의 CNFM_DATE 값이 있을경우 활성화
      // if(res.ORESULT_CUR[0].CNFM_DATE && btnAuth.value){
      //   menuTitle.value.disableBtn('btnCancelConfirm', false)
      // } else {
        
      //   // 미확정 결재 키 존재
      //   if(res.ORESULT_CUR[0].ZZ_APP_STATUS !== null){
      //     if (btnAuth.value && res.ORESULT_CUR[0].YN_OUT === 'N'){
      //       // 결재 상신인 경우 -> 확정버튼 활성화
      //       if (res.ORESULT_CUR[0].ZZ_APP_STATUS === 'Y'){
      //         menuTitle.value.disableBtn('btnConfirm', false)
      //       } 
      //       // 반려/취소 상태이면 결재 상신, 저장, 삭제, 자동생성 활성화
      //       else if (res.ORESULT_CUR[0].ZZ_APP_STATUS === 'C' || res.ORESULT_CUR[0].ZZ_APP_STATUS === 'Z'){
      //         menuTitle.value.disableBtn('btnReqApply', false)
      //         menuTitle.value.disableBtn('btnUpdate', false)              
      //       }
      //     }
      //   } else {
      //     if(btnAuth.value){
      //       menuTitle.value.disableBtn('btnUpdate', false)

      //       // 직영 - 결재
      //       if (userStore.userDiv === 'A'){
      //         menuTitle.value.disableBtn('btnReqApply', false)
      //       }
      //       // 협력사 - 확정
      //       else{
      //         menuTitle.value.disableBtn('btnConfirm', false)
      //       }
      //     }
      //   }


        // // 미확정 일때 확정 버튼 활성화
        // if(res.ORESULT_CUR[0].ZZ_APP_STATUS && btnAuth.value && res.ORESULT_CUR[0].YN_OUT === 'Y' || (res.ORESULT_CUR[0].YN_OUT === 'N' && res.ORESULT_CUR[0].ZZ_APP_STATUS === 'Y')){
        //   // 결재 상신일때 버튼 활성화, 직영이 아니거나, 직영이면서 결재완료 인경우 활성화
        //   menuTitle.value.disableBtn('btnConfirm', false)
        // }

        // if(res.ORESULT_CUR[0].ZZ_APP_STATUS && btnAuth.value && res.ORESULT_CUR[0].YN_OUT === 'N' && (res.ORESULT_CUR[0].ZZ_APP_STATUS === 'C' || res.ORESULT_CUR[0].ZZ_APP_STATUS === 'Z') ){
        //   if(res.ORESULT_CUR[0].SAVEDYN === 'Y'){
        //     menuTitle.value.disableBtn('btnReqApply', false)
        //   }
        // }

        // // 저장은 확정일이 있을때만   비활성화 !!!
        // menuTitle.value.disableBtn('btnUpdate', false)
      //}

      if(!res.ORESULT_CUR[0].CNFM_DATE && ((res.ORESULT_CUR[0].YN_OUT === 'Y' && btnAuth.value) || 
        (res.ORESULT_CUR[0].YN_OUT === 'N' && btnAuth.value && res.ORESULT_CUR[0].ZZ_APP_STATUS_DES === '결재완료'))){

        // CNFM_DATE_PLAN 값이 없을경우
        // vm.$swal({ 
        //   title: t('미확정 상태입니다. 작성이 완료되었으면 확정처리 하시기 바랍니다. '), 
        //   showCancelButton: false,
        // })
      }
      setPrint(res.ORESULT_CUR[0])
    } else{
      
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

  return commonSearchApi({ queryId : 'MNGAC0030_SEARCH_02', param: searchParams })
}

const afterSearch = async res => {
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
  saveParamMain.BSNS_CD = searchParams.CMPNY_DIV
  saveParamMain.ASGN_CD = searchParams.ASGN_CD
  saveParamMain.YEAR    = searchParams.YEAR
  saveParamMain.REV     = searchParams.YEAR + '-01'
  saveParamMain.YN_OUT  = searchParams.YN_OUT
  saveParamMain.SEMIR_DOC_NO = 'SEMIR-' + searchParams.ASGN_CD + '-001'
  saveParamMain.WRITE_DATE   = state.WRITE_DATE
  saveParamMain.EDTR_NAME    = state.EDTR_NAME

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

/* ******************* 저장 ******************** */
const saveData = () => {
  //commonExecuteApi({ queryId: "MNGAC0030_SAVE_01", list: saveParamMain.value })

  return commonExecuteApi({ queryId: "MNGAC0030_SAVE_02", list: saveParam.value })
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
  confirmSaveParam.USER_ID = userStore.userId

  if(searchParams.ADD_YN !== 'Y'){
    Message.warn(t('환경영향측면 파악을 등록/저장 하신 후 진행 하십시오.'))

    result = false
  }

  if(searchParams.YN_OUT !== 'Y'){
    Message.warn(t('결재 완료 후 진행 하십시오.'))

    result = false
  }

  return result
}

const confirmData = () => {
  return commonExecuteApi({ queryId: "MNGAC0030_SAVE_04", list: [confirmSaveParam] })
}

/* ******************** 결재상신 ******************** */
const reqApply = async () => {
  let rowCount = await grdMain.value.getDataProvider().getRowCount()
  let result = await vm.$swal({ 
    title: t('결재상신 하시겠습니까? '), 
    showCancelButton: true,
  })
  if(!result.isConfirmed){
    return 
  }

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
      <table class="tbl" id="tableList">
        <thead>
          <tr>
            <th class="title2" style="width:5%">No.</th>
            <th class="title2" style="width:5%">구분</th>
            <th class="title2" style="width:10%">활동공정</th>
            <th class="title2" style="width:5%">직/간접 영향</th>
            <th class="title2" style="width:5%">작업 조건</th>
            <th class="title2" style="width:5%">발생 시점</th>
            <th class="title2" style="width:25%">환경경영측면</th>
            <th class="title2" style="width:10%">영향범위</th>
            <th class="title2" style="width:5%">등급</th>
            <th class="title2" style="width:25%">개선계획</th>                                        
          </tr>
        </thead>
        <tbody class="grdTbody">
  `

  commonSearchApi({ queryId : 'MNGAC0030_SEARCH_03', param: searchParams }).then(res => {
    let height = 26
    let top = 108
    let index = 35

    res.ORESULT_CUR.forEach(item => {
      setGrid += `
      <tr>
        <td class="item">${item.NO}</td>
        <td class="item" style="text-align:left">${isNullCheck(item.PRCS_DESC)}</td>
        <td class="item" style="text-align:left">${isNullCheck(item.DET_PRCS_DESC)}</td>
        <td class="item">${isNullCheck(item.DRT_DIV_DESC)}</td>
        <td class="item">${isNullCheck(item.WRK_COND_DESC)}</td>
        <td class="item">${isNullCheck(item.OCCR_DESC)}</td>
        <td class="item" style="text-align:left">${isNullCheck(item.EM_PART_DESC)}</td>
        <td class="item" style="text-align:left">${isNullCheck(item.EM_IMPCT_DESC)}</td>
        <td class="item" style="text-align:right">${isNullCheck(item.COMP_GRD)}</td>
        <td class="item" style="text-align:left">${isNullCheck(item.IMPR_PLAN)}</td>
      </tr>
      `
      top = top + height - 1
    })
  }).finally(() => {
    setGrid += `
      </tbody>                    
      </table>
      </body>
      </html>
    `

    approvalPopup.value.openPopup({
      CLSS_ID: logsStore.vueId,
      TITLE: '중대환경영향 개선계획',
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
  commonExecuteApi({ queryId: 'MNGAC0030_SAVE_03', list: [appData] })
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

/* ******************** 출력 ***********************  */
const setPrint = val => {
  let WRITE_DATE = val.WRITE_DATE ? dayjs(val.WRITE_DATE).format('YYYY년 MM월 DD일') : dayjs(new Date).format('YYYY년 MM월 DD일')
  params.value = [
    "IN_CMPNY_DIV="+searchParams.CMPNY_DIV,
    "IN_BSNS_CD="+searchParams.BSNS_CD,
    "IN_ASGN_CD="+searchParams.ASGN_CD,
    "IN_YEAR="+searchParams.YEAR,
    "IN_REV="+searchParams.REV,

    'IN_SEMIR_DOC_NO=' + val.SEMIR_DOC_NO,
    'IN_SPAGE=' + '총  Page',
    'IN_WRITE_DATE=' + WRITE_DATE ,
    'IN_ASGN_NM=' + searchParams.ASGN_NM,
    'IN_EDTR_NAME=' + val.EDTR_NAME,
  ]
}

const yearChange = async e => {
  searchParams.YEAR = await searchParams.YEAR.replace(korean, '')
  if(searchParams.YEAR.length > 4){
    searchParams.YEAR = await searchParams.YEAR.slice(0, 4)
  }
}

// null값인지 아닌지 확인
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? '' : val
}

const onEditRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grid.commit()
  let rowData = grdMain.value.getDataProvider().getJsonRow(dataRow)
  let comp_point = rowData.COMP_FREQ * rowData.COMP_INTEN
  let EM_GRD = null

  EM_GRD_LIST.value.forEach(item => {
    if(item.PNT_FROM <= comp_point && item.PNT_TO >= comp_point){
      EM_GRD = item.EM_GRD
    }
  })

  // 등급 변경
  grdMain.value.getDataProvider().setValue(dataRow, 'COMP_GRD', EM_GRD )

  grdMain.value.getGridView().checkRow(dataRow, true)
}

onMounted(() => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnPrint', 'btnReqApply', 'btnConfirm', 'btnCancelConfirm']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex justify-space-between pt-2 pb-2" >
          <div class="d-flex">
            <i-input
              :label="$t('년도')"
              labelWidth="35px"
              v-model="searchParams.YEAR"
              @update:modelValue="yearChange"
              type="Number"
              width="150px"
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
              @update:modelValue="e => { searchParams.DEPT_CD = null }"
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
          />
        </v-sheet>
      </div>
    </v-card-text>
    
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />

    <!-- 복사 팝업 -->
    <CopyPopup ref="copyPopup" />

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