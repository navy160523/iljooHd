<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from "@/components/RealGrid.vue"
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from "dayjs"
import { commonSearchApi, commonExecuteApi, commonLogExecuteApi, getCodeList, commonSendSMS } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import AsgnPopup from "@/pages/50_safety-support/SPP_E/AsgnPopup.vue"
import PdfViewPopup from "@/pages/50_safety-support/SPP_E/PdfViewPopup.vue"
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)
const asgnPopup = ref(null)
const empPopup = ref(null)
const rowIndex = ref(null)
const pdfViewPopup = ref(null)
 
/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: '',
  ASGN_NM: '',
  DEPT_CD: '',
  IO_DIV: 'I',
  DATE_YN: 'Y',
  ISS_DATE_FR: dayjs(new Date).startOf('M').format('YYYY-MM-DD'),
  ISS_DATE_TO: dayjs(new Date).format('YYYY-MM-DD'),
  EMP_NO: '',
  EMP_NM: '',
  BIKE_NO: '',
  ERASE: 'Y',
  ISS_YN: 'N',
  STATUS: '',
  USER_ID: userStore.userId
})

/* 반려 데이터 */
const saveParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  BIKE_REG_NO: '',
  EMP_NM: '',
  EMP_NO: '',
  JOB_TIT_NM: '',
  HP_NO: '',
  TEL_NO: '',
  ASGN_NM: '',
  EDU_DATE: '',
  BIKE_NO: '',
  CAPA: '',
  SCAN_NM: '',
  VND_NAME: '',
  EDU_FILE_NM: '',
  ERASE_DESC: '',
  USE_DIV: '',
  IO_DIV: '',
  EDU_FILE_ID: '',
  SCAN_ID: '',
  VIOCNT: '',
  OLD_REG_NO: '',
  USER_ID: userStore.userId,
  SCAN_ID_YN: '',
  EDU_FILE_ID_YN: '',
  MENH_ID: '',
  BOHM_ID: '',
  DUNGRK_ID: '',
  VIO_CNT: null,
  REJECT_DESC: '',
  SCHEDULE_ID: '',
  STATE: '',
  STATUS: ''
})

const saveParams2 = ref([])

/* 초기화 데이터 */
const initParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  BSNS_NM: '',
  ASGN_CD: '',
  ASGN_NM: '',
  EMP_NO: '',
  EMP_NM: '',
})

/* 코드 리스트 */
const codeList = reactive({
  CMPNY_List: [],      // 회사구분
  BSNSList: [],        // 사업부
  DEPTList: [{ ASGN_SHRT_NM:'전체', DEPT_CD: '' }],      // 부서
  IO_DIVList: [                                      // 소속구분
    { label: '직영/사내협력사', value: 'I' }, 
    { label: '상주/사외협력사', value: 'O' }, 
  ],
  USE_DIVList: [
    { label: '개인', value: 'P' }, 
    { label: '업무용', value: 'B' }, 
  ],
  ISS_YNList: [
    { label: '미발급', value: 'N' },
    { label: '발급', value: 'Y' }, 
  ],
  STATUS_LIST: []
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable:false } },
  keys : [],
  fields : [ 
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('진행상태') },lookupDisplay: true, lookupData: codeList.STATUS_LIST},
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, width: '250', styleName: 'left-column'},
    { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('사외협력사명') }, width: '180', styleName: 'left-column'},
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직급') }},
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') }},

    { fieldName: 'APP_NO', dataType: 'text', header: { text: t('신청번호')},styleName: 'left-column'},
    { fieldName: 'USE_DIV_NM', dataType: 'text', header: { text: t('용도구분') }, styleName: 'left-column'},
    { fieldName: 'EDU_DATE', dataType: "datetime", datetimeFormat: "yyyy-MM-dd", header: { text: t('교육이수일')},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true}}},
    { fieldName: 'BIKE_REG_NO', dataType: 'text', header: { text: t('등록번호') }, styleName: 'left-column'},

    { fieldName: 'ISS_DATE', dataType: 'text', header: { text: t('발급일자')},
      editor: { type: 'datetime', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true}}},
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
    { fieldName: 'IO_DIV', dataType: 'text', header: { text: t('IO_DIV') }, visible: false },
    { fieldName: 'OUTVEND_YN', dataType: 'text', header: { text: t('OUTVEND_YN') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, visible: false },
    { fieldName: 'HP_NO', dataType: 'text', header: { text: t('HP_NO') }, visible: false },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('TEL_NO') }, visible: false },
    { fieldName: 'USE_DIV', dataType: 'text', header: { text: t('USE_DIV') }, visible: false },
    { fieldName: 'BIKE_NO', dataType: 'text', header: { text: t('BIKE_NO') }, visible: false },
    { fieldName: 'CAPA', dataType: 'text', header: { text: t('CAPA') }, visible: false },
    { fieldName: 'SCAN_ID', dataType: 'text', header: { text: t('SCAN_ID') }, visible: false },
    { fieldName: 'SCAN_NM', dataType: 'text', header: { text: t('SCAN_NM') }, visible: false },
    { fieldName: 'EDU_FILE_ID', dataType: 'text', header: { text: t('EDU_FILE_ID') }, visible: false },
    { fieldName: 'EDU_FILE_NM', dataType: 'text', header: { text: t('EDU_FILE_NM') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'APP_DATE', dataType: 'text', header: { text: t('APP_DATE') }, visible: false },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnReset'){
    init()
  }else if(btn.id === 'btnCreateRegNumber'){
    beforeSave()
  }else if(btn.id === 'btnTurnBack'){
    turnBack()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'SPPEA0010_TAB04_SEARCH_01', param: searchParams })
}

const afterSearch = async res => {
  for(let i in saveParams){
    saveParams[i] = ''
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if(res.ORESULT_CUR.length > 0){ 
    onCellClicked(null, {cellType: 'data' , dataRow: '0'})
  }

  let afterparams = {
    userStore: userStore,
    params: searchParams,
    mgs: '[오토바이 등록증 발급] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', //사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  // 로그기록
  commonLogExecuteApi(afterparams)
}

const init = async () => {
  if(!initParams.EMP_NM){
    Message.warn(t('대상자가 존재 하지 않습니다.'))

    return
  }
  let confirm = await vm.$swal({
    title: t('수칙위반이력을 초기화(삭제) 하시겠습니까? \n 초기화된 데이터는 복구 불가합니다.'),
    showCancelButton: true,
  })

  if(confirm){
    commonExecuteApi({ queryId : 'SPPEA0010_TAB04_DELETE_01', list: [initParams] }).then(()=> {
      Message.success(t('삭제 완료하였습니다.'))
    })
  }
}

const beforeSave = async () => {
  saveParams2.value = []
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  } else {
    chekedRow.forEach(async e => {
      let data = await grdMain.value.getDataProvider().getJsonRow(e)

      data.EDU_DATE = dayjs(data.EDU_DATE).format('YYYYMMDD')
      data.IN_ISS_DATE = dayjs(data.IN_ISS_DATE).format('YYYYMMDD')
      data.SAVE_YN = 'Y'

      saveParams2.value.push(data)
    })

    let confirm = await vm.$swal({
      title: t('저장 하시겠습니까?'),
      showCancelButton: true,
    })
    
    if(!confirm){ return }

    afterSave()
  }
}

const afterSave = async () => {
  await commonExecuteApi({ queryId : 'SPPEA0010_TAB04_SAVE_01', list: saveParams2.value }).then(rs => {

    let HP_NO = ''

    commonSearchApi({ queryId : 'SPPEA0010_TAB04_SEARCH_02', param: searchParams }).then(rs2 => {
      if(rs2.ORESULT_CUR.length > 0){
        HP_NO = rs2.ORESULT_CUR[0].HND_PHN
      }
    })

    rs.list.forEach(e => {
      // e.HP_NO

      let smsParam = {
        EMPNO_FROM: searchParams.USER_ID, //보내는사람 사번
        EMPNO_TO: e.EMP_NO, //받는사람 사번
        SYSCODE: '156', //000고정
        FROM_P_NO: HP_NO, //보내는사람 폰번호
        TO_P_NO: e.HP_NO, //받는사람 폰번호
        TITLE: '[오토바이 전산등록 완료 알림]전산등록 신청이 처리완료 되었습니다. -안전경영실-', //제목,내용
      }
      commonSendSMS(smsParam)

    })

    Message.success(t('저장되었습니다.'))

    let afterparams = {
      userStore: userStore,
      params: saveParams2.value,
      mgs: '[오토바이강제등록] 화면 - 저장 시, 개인정보관련 저장했습니다.',
      crudGbn: 'U', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', //사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }

    // 로그기록 
    commonLogExecuteApi(afterparams)

    onButtonsClick({id: 'btnSearch'})

  })
}

const turnBack = async () => {
  if(!saveParams.REJECT_DESC) {
    Message.warn(t('반려사유를 입력하세요.'))
    return
  }

  let confirm = await vm.$swal({
    title: t('반려 하시겠습니까?'),
    showCancelButton: true,
  })
  
  if(!confirm){ return }

  let params = [
    {
      CMPNY_DIV: saveParams.CMPNY_DIV,
      APP_DATE: dayjs(saveParams.APP_DATE).format('YYYYMMDD'),
      SEQ: saveParams.SEQ,
      STATUS: '11',
      REJECT_DESC: saveParams.REJECT_DESC,
      USER_ID: userStore.userId,
    }
  ]

  commonExecuteApi({ queryId : 'SPPEA0010_TAB04_SAVE_02', list: params }).then(res => {
    Message.success(t('저장되었습니다.'))

    onButtonsClick({id: 'btnSearch'})
  })

}

/* PDF파일 뷰어 팝업 */
const viewPopup = e => {
  if(e){
    let param = {
      CMPNY_DIV: saveParams.CMPNY_DIV,
      FILE_ID: saveParams.SCAN_ID
    }
    pdfViewPopup.value.openPopup(param)
  }
}

const onCellClicked = async (grid, clickData) => {
  if(clickData.cellType === 'data'){
    let data = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    for(let i in data){
      if(i === 'EDU_DATE' || i === 'APP_DATE'){
        saveParams[i] = await data[i] ? dayjs(data[i]).format('YYYY-MM-DD') : null
      }else {
        saveParams[i] = data[i] ? data[i] : ''
      }
    }
    
  }
}

const openPopup = () => {
  empPopup.value.openPopup({CMPNY_DIV: userStore.cmpnyDiv})
}

const onEmpSelected = val => {
  initParams.CMPNY_DIV = val.CMPNY_DIV
  initParams.BSNS_CD = val.BSNS_CD
  initParams.ASGN_CD = val.ASGN_CD
  initParams.EMP_NO = val.EMP_NO
  initParams.EMP_NM = val.EMP_NM
  initParams.ASGN_NM = val.ASGN_NM
}

const reset = () => {
  grdMain.value.getDataProvider().setRows([])
}

const cmpnyChange = e => {
  codeList.BSNSList = []
  codeList.DEPTList = []
  Promise.all([commonSearchApi({ queryId : 'searchBSNS', param: { CMPNY_DIV: userStore.cmpnyDiv, ORGN_DIV: 'A', BSNS_CD: e, USE_ONLY: 'Y' } })]).then(res => {
    codeList.BSNSList = res[0].ORESULT_CUR
    codeList.BSNSList.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    codeList.DEPTList.unshift({ ASGN_SHRT_NM:'전체', DEPT_CD: '' })
    searchParams.BSNS_CD = ''
    searchParams.DEPT_CD = ''
  })
}

const bsnsCdChange = e => { 
  codeList.DEPTList = []
  Promise.all([commonSearchApi({ queryId : 'searchDept', param: { CMPNY_DIV: userStore.cmpnyDiv, ORGN_DIV: 'A', BSNS_CD: e, USE_ONLY: 'Y' } })]).then(res => {
    codeList.DEPTList = res[0].ORESULT_CUR
    codeList.DEPTList.unshift({ ASGN_SHRT_NM:'전체', DEPT_CD: '' })
    searchParams.DEPT_CD = ''
  }) 
  reset()
}

const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    USE_DIV: 'N',
    ORGN_DIV: 'A',
    USE_ONLY: 'Y'
  }

  // 사업부 리스트 조회
  Promise.all([ commonSearchApi({ queryId : 'searchBSNS', param }),
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIZ000', USE_FLAG: 'Y' } }),
    commonSearchApi({ queryId : 'searchDept', param: param }),
    getCodeList('HHIG250')
  ]).then(res => {
    codeList.BSNSList = res[0].ORESULT_CUR
    codeList.CMPNY_List = res[1].ORESULT_CUR
    codeList.DEPTList = res[2].ORESULT_CUR
    codeList.STATUS_LIST = res[3].ORESULT_CUR

    codeList.BSNSList.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    codeList.CMPNY_List.unshift({ TXT:'전체', COD: '' })
    codeList.DEPTList.unshift({ ASGN_SHRT_NM:'전체', DEPT_CD: '' })
    codeList.STATUS_LIST.unshift({ TXT:'전체', COD: '' })

    grdMain.value.setBindingColumn("STATUS", codeList.STATUS_LIST, "COD", "TXT")
    
  })
}

onMounted(() => {
  initCodeList() 
})
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <div class="d-flex align-self-end mb-1"> 
      <div class="align-center d-flex mr-2">
        <i-input
          :label="$t('수칙위반이력 초기화')"
          v-model="initParams.ASGN_NM"
          width="370px"
          labelWidth="120px"
          readonly
          class="mr-0"
        />
        <i-input
          v-model="initParams.EMP_NM"
          width="130px"
          readonly
          append-inner-icon="mdi-magnify"
          @update:modelValue=" (e) => { searchParams.DEPT_CD = null }"
          @click:appendInner="openPopup()"
          class="mr-0"
        />
        <v-btn @click="onButtonsClick({id: 'btnReset'})">초기화</v-btn>
      </div>
      <div class="align-self-center">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnCreateRegNumber']"
          @click-button="onButtonsClick"
          class="mb-0"
        />
      </div>
    </div>
    
    <v-sheet class="searchArea d-flex">
      <i-select 
        :label="$t('회사구분')"
        label-width="60px"
        width="300px"
        :items="codeList.CMPNY_List"
        item-title="TXT"
        item-value="COD"
        v-model="searchParams.CMPNY_DIV"
        @update:modelValue="cmpnyChange"
      />
      <i-select 
        :label="$t('사업부')"
        label-width="50px"
        width="250px"
        :items="codeList.BSNSList"
        item-title="BSNS_NM"
        item-value="BSNS_CD"
        v-model="searchParams.BSNS_CD"
        @update:modelValue="bsnsCdChange"
      />
      <i-select 
        :label="$t('부서')"
        label-width="35px"
        width="250px"
        :items="codeList.DEPTList"
        item-title="ASGN_SHRT_NM"
        item-value="DEPT_CD"
        v-model="searchParams.DEPT_CD"
        @update:modelValue="reset"
      />
      <div class="d-flex align-center">
        <div class="formLabelText mr-5">
          {{ $t('발급구분') }}
        </div>
        <VRadioGroup
          v-model="searchParams.ISS_YN" 
          inline
        >
          <VRadio
            v-for="(item , i) in codeList.ISS_YNList"
            :key="i"
            :value="item.value"
            :label="item.label"
          />
        </VRadioGroup>
      </div>
      <i-select 
        :label="$t('신청상태')"
        label-width="60px"
        width="300px"
        :items="codeList.STATUS_LIST"
        item-title="TXT"
        item-value="COD"
        v-model="searchParams.STATUS"
        @update:modelValue="reset"
        class="ml-3"
      />
    </v-sheet>
    <v-sheet class="pa-0 h-auto">
      <RealGrid
        ref="grdMain"
        :grid-view-option="grdMainProps.gridViewOption"
        :keys="grdMainProps.keys" 
        :fields="grdMainProps.fields"
        :columns="grdMainProps.columns"
        @onCellClicked="onCellClicked"
      />
    </v-sheet>
    <v-sheet class="mt-4">
      <IGridTitle
        ref="menuTitle"
        :title="$t('등록 상세 내역')"
        :button-list="['btnTurnBack']"
        @click-button="onButtonsClick"
      />
      <div class="searchArea flex-column fill-height mb-1 pa-3">
        <div class="d-flex">
          <div class="d-flex align-center">
            <div class="formLabelText mr-4">
              {{ $t('용도구분') }}
            </div>
            <VRadioGroup
              v-model="saveParams.USE_DIV"
              inline
            >
              <VRadio
                v-for="(item , i) in codeList.USE_DIVList"
                :key="i"
                :value="item.value"
                :label="item.label"
                :disabled="true"
              />
            </VRadioGroup>
          </div>
          <div class="d-flex align-center ml-6 mr-6">
            <VCheckbox
              v-model="saveParams.IO_DIV"
              true-value="C" false-value="N"
              disabled
            />
            <div class="formLabelText ml-2">
              {{ $t('사외협력사(상주협력사/단기공사업체)') }}
            </div>
          </div>
        </div>
        <div class="d-flex pt-1">
          <i-input
            v-model="saveParams.EMP_NM"
            :label="$t('신청자')"
            label-width="80px"
            width="370px"
            disabled
          />
          <i-input
            v-model="saveParams.EMP_NO"
            :label="$t('사번')"
            label-width="35px" 
            width="200px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.JOB_TIT_NM"
            :label="$t('직위')"
            label-width="35px" 
            width="300px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.HP_NO"
            :label="$t('휴대폰')"
            label-width="50px" 
            width="250px"
            disabled
          />
          <i-input 
            v-model="saveParams.TEL_NO"
            :label="$t('사내연락처')"
            label-width="80px" 
            width="250px"
            disabled
          />
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.ASGN_NM"
            :label="$t('소속조직')"
            label-width="80px"
            width="620px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.EDU_DATE"
            :label="$t('교육이수일')"
            label-width="80px"
            width="350px"
            type="date"
            disabled
          />
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.BIKE_NO"
            :label="$t('차량번호')"
            label-width="80px" 
            width="400px"
            disabled
          />
          <i-input 
            v-model="saveParams.CAPA"
            :label="$t('배기량')"
            label-width="50px" 
            width="200px"
            disabled
          />
          <i-input 
            v-model="saveParams.SCAN_NM"
            :label="$t('책임보험서류')"
            label-width="80px"
            width="700px"
            readonly
            class="mr-0"
          />
          <div class="d-flex align-center">
            <v-btn @click="viewPopup(saveParams.SCAN_NM)">보기</v-btn>
          </div>
        </div>
        <div class="d-flex pt-1" v-if="saveParams.IO_DIV === 'C'">
          <i-input 
            v-model="saveParams.VND_NAME"
            :label="$t('사외협력사명')"
            label-width="80px" 
            width="620px"
          />
          <i-input 
            v-model="saveParams.EDU_FILE_NM"
            :label="$t('교육이수자료')"
            label-width="80px" 
            width="700px"
            readonly
            class="mr-0"
          />
          <div class="d-flex align-center">
            <v-btn @click="viewPopup(saveParams.EDU_FILE_ID)">보기</v-btn>
          </div>
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.REJECT_DESC"
            :label="$t('반려사유')"
            label-width="80px" 
            width="1450px"
            class="mr-0"
          />
        </div>
      </div>
    </v-sheet>

    <!-- 인원조회팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />

    <!-- PDF VIEW 팝업 -->
    <PdfViewPopup ref="pdfViewPopup" />
  </div>
</template>
<style scoped lang="scss">
</style>
