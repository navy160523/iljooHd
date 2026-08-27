<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from "dayjs"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, commonExecuteApi, commonLogExecuteApi } from "@hiway/api/commonApi"
import AsgnPopup from "@/pages/50_safety-support/SPP_E/AsgnPopup.vue"
import PdfViewPopup from "@/pages/50_safety-support/SPP_E/PdfViewPopup.vue"
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)
const detailMenu = ref(null)
const asgnPopup = ref(null)
const pdfViewPopup = ref(null)
 
/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  DEPT_CD: '',
  IO_DIV: '',
  DATE_YN: 'Y',
  ISS_DATE_FR: dayjs(new Date).startOf('M').format('YYYY-MM-DD'),
  ISS_DATE_TO: dayjs(new Date).format('YYYY-MM-DD'),
  EMP_NO: '',
  EMP_NM: '',
  BIKE_NO: '',
  ERASE: 'Y',
})

/* 저장, 삭제 데이터 */
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
  ASGN_CD: '',
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
  USER_ID: userStore.userId
})



/* 코드 리스트 */
const codeList = reactive({
  CMPNY_List: [],      // 회사구분
  BSNSList: [],        // 사업부
  DEPTList: [{ ASGN_SHRT_NM:'전체', DEPT_CD: '' }],      // 부서
  IO_DIVList: [                                      // 소속구분
    { label: 'ALL', value: '' }, 
    { label: '직영', value: 'A' }, 
    { label: '사내협력사', value: 'B' }, 
    { label: '사외협력사', value: 'C' }, 
  ],
  IO_DIVList2: [                                      // 그리드내 소속구분
    { label: 'ALL', value: '' }, 
    { label: '직영', value: 'A' }, 
    { label: '협력사', value: 'B' }, 
    { label: '사외', value: 'C' }, 
  ],
  USE_DIVList: [
    { label: '개인', value: 'P' }, 
    { label: '업무용', value: 'B' }, 
  ],
  ERASE_DIVList: [
    { label: '퇴사', value: 'A' }, 
    { label: '누적위반', value: 'B' }, 
    { label: '중대위반', value: 'C' }, 
    { label: '삭제', value: 'D' }, 
  ]
})

const txtReadOnly = ref(false) 

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable:false }  },
  keys : ['PRCS_CD','DET_PRCS_CD','EM_PART_CD'],
  fields : [ 
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, width: '300', styleName: 'left-column'},
    { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('사외협력사명') }, width: '180', styleName: 'left-column'},
    { fieldName: 'IO_DIV', dataType: 'text', header: { text: t('소속구분') },lookupDisplay: true, lookupData: codeList.IO_DIVList2},
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }},
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }},
    { fieldName: 'USE_DIV_NM', dataType: 'text', header: { text: t('용도') }, styleName: 'left-column'},
    { fieldName: 'BIKE_REG_NO', dataType: 'text', header: { text: t('등록번호') }, width: '150'},
    { fieldName: 'ISS_DATE', dataType: 'text', header: { text: t('발급일자') }, width: '150',displayCallback: function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null}},
    { fieldName: 'BIKE_NO', dataType: 'text', header: { text: t('차량번호') }, width: '150', styleName: 'left-column'},
    { fieldName: 'CAPA', dataType: 'text', header: { text: t('배기량') } },
    { fieldName: 'ERASE_DIV', dataType: 'text', header: { text: t('말소사유') }, width: '150',lookupDisplay: true, lookupData: codeList.ERASE_DIVList},
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('입력일시') }, width: '150'},
    { fieldName: 'INSERT_USER_NM', dataType: 'text', header: { text: t('입력자') }},
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일시') }, width: '150'},
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자') }},
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
    { fieldName: 'HP_NO', dataType: 'text', header: { text: t('HP_NO') }, visible: false },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('TEL_NO') }, visible: false },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('EDU_DATE') }, visible: false },
    { fieldName: 'SCAN_NM', dataType: 'text', header: { text: t('SCAN_NM') }, visible: false },
    { fieldName: 'EDU_FILE_NM', dataType: 'text', header: { text: t('EDU_FILE_NM') }, visible: false },
    { fieldName: 'ERASE_DESC', dataType: 'text', header: { text: t('ERASE_DESC') }, visible: false },
    { fieldName: 'ERASE_DATE', dataType: 'text', header: { text: t('ERASE_DATE') }, visible: false },
    { fieldName: 'USE_DIV', dataType: 'text', header: { text: t('USE_DIV') }, visible: false },
    { fieldName: 'EDU_FILE_ID', dataType: 'text', header: { text: t('EDU_FILE_ID') }, visible: false },         // 교육이수자료
    { fieldName: 'SCAN_ID', dataType: 'text', header: { text: t('SCAN_ID') }, visible: false },                 // 책임보험서류
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
  }else if(btn.id === 'btnUpdate'){
    let result = await vm.$swal({ 
      title: t('저장 하시겠습니까?'), 
      showCancelButton: true,
    })

    if(!result.isConfirmed){
      return
    }else {
      commonExecuteApi({ queryId : 'SPPEA0010_TAB01_SAVE_01', list: [saveParams] }).then(res => {
        Message.success(t('저장 되었습니다.'))
        onButtonsClick({id: 'btnSearch'})
      })
    }
  }else if(btn.id === 'btnCancelLeave'){
    cancelLeave()
  }else if(btn.id === 'btnCancelDelete'){
    cancelDelete()
  }else {
    cancelCancel()
  }
}

const searchData = () => {
  let param = {}

  for(let i in searchParams){
    if(i === 'ISS_DATE_FR'){
      param[i] = searchParams.DATE_YN === 'Y' ? dayjs(searchParams[i]).format('YYYYMMDD') : ''
    }else if(i === 'ISS_DATE_TO'){
      param[i] = searchParams.DATE_YN === 'Y' ? dayjs(searchParams[i]).format('YYYYMMDD') : ''
    }else {
      param[i] = searchParams[i]
    }

  }

  return commonSearchApi({ queryId : 'SPPEA0010_TAB01_SEARCH_01', param: param })
}

const afterSearch = async res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if(res.ORESULT_CUR.length > 0){
    onCellClicked(null, {cellType: 'data' , dataRow: '0'})
  }

  let afterparams = {
    userStore: userStore,
    params: searchParams,
    mgs: '[오토바이 등록현황] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', //사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }

  // 로그기록
  commonLogExecuteApi(afterparams).then(res => {
  })

}

/* ************ 말소(퇴사) *************** */
const cancelLeave = async () => {
  let result = await vm.$swal({ 
    title: t('말소(퇴사) 처리 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!result.isConfirmed){
    return
  }else {
    let params = [
      {CMPNY_DIV: saveParams.CMPNY_DIV, BIKE_REG_NO: saveParams.BIKE_REG_NO, ERASE_DIV: 'A', ERASE_DESC: saveParams.ERASE_DESC }
    ]
    commonExecuteApi({ queryId : 'SPPEA0010_TAB01_SAVE_02', list: params }).then(res => {
      Message.success(t('말소(퇴사) 되었습니다.'))
      onButtonsClick({id: 'btnSearch'})
    })
  }
}

/* ************ 말소(삭제) *************** */
const cancelDelete = async () => {
  let result = await vm.$swal({ 
    title: t('말소(퇴사) 처리 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!result.isConfirmed){
    return
  }else {
    if(!saveParams.ERASE_DESC){
      return Message.warn(t('말소사유를 입력해 주세요.'))
    }
    let params = [
      {CMPNY_DIV: saveParams.CMPNY_DIV, BIKE_REG_NO: saveParams.BIKE_REG_NO, ERASE_DIV: 'D', ERASE_DESC: saveParams.ERASE_DESC }
    ]
    commonExecuteApi({ queryId : 'SPPEA0010_TAB01_SAVE_02', list: params }).then(res => {
      Message.success(t('말소(삭제) 되었습니다.'))
      onButtonsClick({id: 'btnSearch'})
    })
  }
}

/* ************ 말소취소 *************** */
const cancelCancel = async () => {
  let result = await vm.$swal({ 
    title: t('말소취소 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!result.isConfirmed){
    return
  }else {
    commonExecuteApi({ queryId : 'SPPEA0010_TAB01_SAVE_03', list: [saveParams] }).then(res => {
      Message.success(t('말소취소 되었습니다.'))
      onButtonsClick({id: 'btnSearch'})
    })
  }
}



const onCellClicked = async (grid, clickData) => {
  setBtn()

  if(clickData.cellType === 'data'){
    let data = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    console.log('data: ', data)
    if(data.IO_DIV === 'C'){
      txtReadOnly.value = false
      detailMenu.value.disableBtn('btnUpdate', userLogStore.isMenuAdmin === 'Y' ? false : true)
    }

    if(data.ERASE_DATE !== null){
      detailMenu.value.disableBtn('btnCancelLeave', true)
      detailMenu.value.disableBtn('btnCancelDelete', true)
      detailMenu.value.disableBtn('btnCancelCancel', userLogStore.isMenuAdmin === 'Y' ? false : true)
    }else if(data.ERASE_DATE === null){
      detailMenu.value.disableBtn('btnCancelLeave', userLogStore.isMenuAdmin === 'Y' ? false : true)
      detailMenu.value.disableBtn('btnCancelDelete', userLogStore.isMenuAdmin === 'Y' ? false : true)
      detailMenu.value.disableBtn('btnCancelCancel', true)
    }

    for(let i in data){
      if(i === 'EDU_DATE'){
        saveParams[i] = await data[i] ? dayjs(data[i]).format('YYYY-MM-DD') : null
      }else {
        saveParams[i] = data[i] ? data[i] : ''
      }
    }
  }
}

const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ commonSearchApi({ queryId : 'searchBSNS', param }),
      commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIZ000', USE_FLAG: 'Y' } }) ]).then(res => {
    codeList.BSNSList = res[0].ORESULT_CUR
    codeList.CMPNY_List = res[1].ORESULT_CUR
    codeList.BSNSList.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    codeList.CMPNY_List.unshift({ TXT:'전체', COD: '' })

    bsnsCdChange(searchParams.BSNS_CD)

    
  })
}

const cmpnyDivChange = e => {
  console.log("E", e)
  codeList.BSNSList = []
  Promise.all([commonSearchApi({ queryId : 'searchBSNS', param: { CMPNY_DIV: e, USE_ONLY: 'Y' } })]).then(res => {
    codeList.BSNSList = res[0].ORESULT_CUR
    codeList.BSNSList.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    searchParams.BSNS_CD = ''
  }) 
  reset()
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

/* 그리드 및 상세정보 초기화 */
const reset = () => {
  grdMain.value.getDataProvider().setRows([])
  for(let i in saveParams){
    saveParams[i] = ''
  }
  setBtn()
}

/* ***** 부서/협력사 조회 팝업 ***** */
const openPopup = () => {
  asgnPopup.value.openPopup({})
}

/* ***** 부서/협력사 선택 ***** */
const onDeptSelected = val => {
  saveParams.ASGN_NM = val.ASGN_FULL_NM
  saveParams.ASGN_CD = val.ASGN_CD
}

/* PDF파일 뷰어 팝업 */
const viewPopup = e => {
  if(e){
    let param = {
      CMPNY_DIV: saveParams.CMPNY_DIV,
      FILE_ID: e
    }
    pdfViewPopup.value.openPopup(param)
  }
}

const setBtn = () => {
  detailMenu.value.disableBtn('btnUpdate', true)
  detailMenu.value.disableBtn('btnCancelLeave', true)
  detailMenu.value.disableBtn('btnCancelDelete', true)
  detailMenu.value.disableBtn('btnCancelCancel', true)
}

onMounted(() => {
  setBtn()
  initCodeList()
  onButtonsClick({id: 'btnSearch'})
})
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <IMenuTitle
      ref="menuTitle"
      :title="t('오토바이 등록관리')"
      :button-list="['btnSearch']"
      @click-button="onButtonsClick"
      :showManuel="true"
    />
    <v-sheet class="searchArea flex-column">
      <div class="d-flex">
        <i-select 
          :label="$t('회사구분')"
          label-width="60px"
          width="300px"
          :items="codeList.CMPNY_List"
          item-title="TXT"
          item-value="COD"
          v-model="searchParams.CMPNY_DIV"
          @update:modelValue="cmpnyDivChange"
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
            {{ $t('소속구분') }}
          </div>
          <VRadioGroup
            v-model="searchParams.IO_DIV"
            inline
            @update:modelValue="reset"
          >
            <VRadio
              v-for="(item , i) in codeList.IO_DIVList"
              :key="i"
              :value="item.value"
              :label="item.label"
            />
          </VRadioGroup>
        </div>
      </div>
      <div class="d-flex mt-1">
        <div class="d-flex align-center mr-2">
          <VCheckbox 
            v-model="searchParams.DATE_YN"
            true-value="Y" false-value="N"
          />
        </div>
        <i-input 
          v-model="searchParams.ISS_DATE_FR"
          :label="$t('발급일자')"
          label-width="60px" 
          width="230px"
          type="date"
          class="mr-2"
        />
        <i-input 
          v-model="searchParams.ISS_DATE_TO"
          width="170px" 
          :label="$t('-')" 
          type="date"
        />
        <i-input 
          v-model="searchParams.EMP_NO"
          :label="$t('사번')"
          label-width="35px" 
          width="200px"
          maxlength="20"
          oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~!@#$%^&*()_+|<>?:{}]/, '' );"
        />
        <i-input 
          v-model="searchParams.EMP_NM"
          :label="$t('성명')"
          label-width="35px" 
          width="200px"
          oninput="javascript: this.value = this.value.replace(/[0-9~!@#$%^&*()_+|<>?:{}]/, '' );"
          maxlength="20"
        />
        <i-input 
          v-model="searchParams.BIKE_NO"
          :label="$t('차량번호')"
          label-width="65px" 
          width="250px"
          oninput="javascript: this.value = this.value.replace(/[~!@#$%^&*()_+|<>?:{}]/, '' );"
          maxlength="10"
        />
        <div class="d-flex align-center">
          <VCheckbox 
            v-model="searchParams.ERASE"
            :true-value="null" false-value="Y"
            @update:modelValue="reset"
          />
          <div class="formLabelText ml-2">
            {{ $t('말소포함') }}
          </div>
        </div>
      </div>
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
        ref="detailMenu"
        :title="$t('상세정보')"
        :button-list="['btnUpdate', 'btnCancelLeave', 'btnCancelDelete', 'btnCancelCancel']"
        @click-button="onButtonsClick"
      />
      <div class="searchArea flex-column fill-height mb-1 pa-3">
        <div class="d-flex">
          <i-input 
            v-model="saveParams.BIKE_REG_NO"
            :label="$t('등록번호')"
            label-width="80px" 
            width="400px"
            :disabled="true"
          />
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
          <div class="d-flex align-center ml-6">
            <VCheckbox 
              v-model="saveParams.IO_DIV"
              true-value="C" false-value="N"
              :disabled="true"
            />
            <div class="formLabelText ml-2">
              {{ $t('사외협력사') }}
            </div>
          </div>
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.EMP_NM"
            :label="$t('운전자')"
            label-width="80px" 
            width="370px"
            :disabled="true"
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
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.TEL_NO"
            :label="$t('사내연락처')"
            label-width="80px" 
            width="250px"
            :disabled="true"
          />
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.ASGN_NM"
            :label="$t('소속조직')"
            label-width="80px" 
            width="620px"
            class="mr-0"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.ASGN_CD"
            append-inner-icon="mdi-magnify" 
            @click:appendInner="openPopup"
            width="320px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.EDU_DATE"
            :label="$t('교육이수일')"
            label-width="80px" 
            width="350px"
            type="date"
            :disabled="true"
          />
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.BIKE_NO"
            :label="$t('차량번호')"
            label-width="80px" 
            width="400px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.CAPA"
            :label="$t('배기량')"
            label-width="50px" 
            width="200px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.SCAN_NM"
            :label="$t('책임보험서류')"
            label-width="80px" 
            width="755px"
            :disabled="true"
            class="mr-0"
          />
          <div class="d-flex align-center">
            <v-btn @click="viewPopup(saveParams.SCAN_ID)">보기</v-btn>
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
            width="755px"
            :disabled="true"
            class="mr-0"
          />
          <div class="d-flex align-center">
            <v-btn @click="viewPopup(saveParams.EDU_FILE_ID)">보기</v-btn>
          </div>
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.ERASE_DESC"
            :label="$t('말소사유')"
            label-width="80px" 
            width="1450px"
          />
        </div>
      </div>
    </v-sheet>
    <!-- 부서/ 협력사 팝업 -->
    <AsgnPopup ref="asgnPopup" @selected="onDeptSelected" />

    <!-- PDF VIEW 팝업 -->
    <PdfViewPopup ref="pdfViewPopup" />
  </div>
</template>
<style scoped lang="scss">
</style>
