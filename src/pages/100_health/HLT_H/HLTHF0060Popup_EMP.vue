<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import RealGridFactory from '@/utils/realgrid2'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
//const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(['selected'])
const dialog = ref(false)
const grdMain = ref(null)
const readonly = ref(true)
const isAdmin = ref(0)
const isUpdate = ref(false)

const props = defineProps({
  //2025.01.22 김현재 작성
  //인원팝업의 조회값이 1개일때 바로 emit을 올리는데, 바로 emit을 올리지 않도록 하는 props값
  //기본값은 true이고, false를 주면 바로 emit을 올리지 않는다.
  autoEmit: {
    type: Boolean,
    default: true,
  },
})

const openPopup = async(popupParam, empNO, admin, managerYn, updateYn) => {

  isAdmin.value = admin
  isUpdate.value = updateYn

  options.values.EMP_NM = ''
  options.values.BSNS_CD = ''
  options.values.DEPT_CD = ''
  options.values.EMP_NO = ''
  options.values.FLAG = 'N'
  options.values.AUTO_CLOSE = 'Y'
  

   //그리드, 선택 상태 초기화
  grdMain.value.getGridView().setAllCheck(false)
  grdMain.value.getDataProvider().setRows([])


  if(isAdmin.value > 0){

    if(popupParam){
    options.values.EMP_NO = empNO

    /**************** popupParam Object로 넘겨주기 *****************/
    for (const [key, value] of Object.entries(popupParam)) {
      options.values[key] = value
    }
    options.values.ASGN_CD = popupParam.ASGN_DISPLAY  
    options.values.USER_DIV = ''
    options.values.EMP_NO = ''

    if(isUpdate.value){
      options.onlyDisabled.BSNS_CD_D = true
      options.onlyDisabled.DEPT_CD_D = true
      options.onlyDisabled.ASGN_CD_D = true  
    }else{
      options.onlyDisabled.BSNS_CD_D = false
      options.onlyDisabled.DEPT_CD_D = false
      options.onlyDisabled.ASGN_CD_D = false
      
      if(managerYn){
        options.values.BSNS_CD = ''
        options.values.DEPT_CD = ''
        options.values.ASGN_CD = ''
      }
    }

    if (popupParam.DISABLE != undefined && popupParam.DISABLE.length > 0) {
      let defaultRadio = []
      codeList.USER_DIV.forEach((item) => {
        if (popupParam.DISABLE.includes(item.TXT)) {
          item.DISABLE = true
        } else {
          defaultRadio.push(item.COD)
        }
      })
      options.values.USER_DIV = defaultRadio[0]
    }

    await initCodeList()
    await setDept()
    await setAsgn()
  }
  }else{
    options.onlyDisabled.BSNS_CD_D = true
    options.onlyDisabled.DEPT_CD_D = true
    options.onlyDisabled.ASGN_CD_D = true

    if(popupParam){
      // options.values.BSNS_CD = popupParam.BSNS_CD
      // options.values.DEPT_CD = popupParam.DEPT_CD
      options.values.EMP_NO = empNO

      /**************** popupParam Object로 넘겨주기 *****************/
      for (const [key, value] of Object.entries(popupParam)) {
        options.values[key] = value
      }
      options.values.ASGN_CD = popupParam.ASGN_DISPLAY  
      options.values.USER_DIV = ''
      options.values.EMP_NO = ''

      if (popupParam.DISABLE != undefined && popupParam.DISABLE.length > 0) {
      let defaultRadio = []
      codeList.USER_DIV.forEach((item) => {
        if (popupParam.DISABLE.includes(item.TXT)) {
          item.DISABLE = true
        } else {
          defaultRadio.push(item.COD)
        }
      })
      options.values.USER_DIV = defaultRadio[0]
    }

      await initCodeList()
      await setDept()
      await setAsgn()
    }
  }
  dialog.value = true
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


let options = reactive({
  disabled: {
    CMPNY_DIV: false, // 회사구분
    USER_DIV: false, // 직영, 사내협력사
    BSNS_CD: false, // 사업부
    DEPT_CD: false, // HSESY적용제외
  },
  // disabled용으로만 사용(기존꺼는 애매해서 추가)
  onlyDisabled: {
    CMPNY_DIV_D: false, // 회사구분
    USER_DIV_D: false, // 직영, 사내협력사
    BSNS_CD_D: false, // 사업부
    DEPT_CD_D: false, // 부서
    ASGN_CD_D: false,
    FLAG_D: false, // 퇴직자여부
    AUTO_CLOSE_D: false, // 인원선택 후 자동종료
  },
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: '',
    DEPT_CD: '',
    ASGN_CD: '',
    USER_DIV: 'A',
    EMP_NM: '',
    EMP_NO: '',
    AUTO_CLOSE: 'Y', //인원 선택 후 팝업 종료 여부
    IS_SEARCH: true,
  },
  ALL_SEARCH: false, // 조회조건없이 전부 조회하고싶을때
  multi: false,
})

//코드리스트 선언
const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
  asgnCd: [],
  USER_DIV: [
    { COD: '', TXT: '전체', DISABLE: false },
    { COD: 'A', TXT: '직영', DISABLE: false },
    { COD: 'B', TXT: '사내협력사', DISABLE: false },
  ],
  accdntType: [],
  proc: [],
})

//코드리스트 셋팅
const initCodeList = async() => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
    }), // 사업부
    // commonSearchApi({
    //   queryId: 'searchDept3',
    //   // 2024.06.07 박용훈 기본적으로 전체 검색시 성능 저하이므로 기본 세팅값 추가
    //   //param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: 'Y' },
    //   param: {
    //     CMPNY_DIV: userStore.cmpnyDiv,
    //     BSNS_CD: options.values.BSNS_CD,
    //     USE_DIV: 'Y',
    //   },
    // }), // 부서
    // commonSearchApi({
    //   queryId: 'searchVend',
    //   param: { 
    //     CMPNY_DIV : userStore.cmpnyDiv, 
    //     BSNS_CD   : options.values.BSNS_CD,
    //     DEPT_CD   : options.values.DEPT_CD,
    //     USE_DIV   : "Y" 
    //   },
    // }), // 협력사
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    // codeList.deptCd = res[2].ORESULT_CUR
    // codeList.asgnCd = res[3].ORESULT_CUR

    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    // codeList.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    // codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
  })
}

const setDept = async (codeReset) => {
  codeList.deptCd = [];

  if(codeReset) options.values.DEPT_CD = ''
  commonSearchApi({
    queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: options.values.BSNS_CD,
        USE_DIV: 'Y',
      },
  }).then((res) => {
    codeList.deptCd = res.ORESULT_CUR
    if(!codeList.deptCd.some(item => item.DEPT_NM === "전체")){
      codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" });
    }   
  })
}

const setAsgn = async (codeReset) => {
  codeList.asgnCd = [];
  if(codeReset)  options.values.ASGN_CD = ''
  commonSearchApi({
    queryId: 'searchVend',
    param: { 
      CMPNY_DIV : userStore.cmpnyDiv, 
      BSNS_CD   : options.values.BSNS_CD,
      DEPT_CD   : options.values.DEPT_CD,
      USE_DIV   : "Y" 
    },
  }).then((res) => {
    codeList.asgnCd = res.ORESULT_CUR
    if(!codeList.asgnCd.some(item => item.ASGN_NM === "전체")){
      codeList.asgnCd.unshift({ ASGN_NM: "전체", ASGN_CD: "" });
    }
  })
}




//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: ['CMPNY_DIV'],
  field: [
    {
      fieldName: 'USER_DIV',
      dataType: 'text',
      width: '90',
      header: { text: t('소속구분') },
      lookupDisplay: true,
      lookupData: { value: 'COD', label: 'TXT', list: codeList.USER_DIV },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '300',
      styleName: 'left-column',
      header: { text: t('소속') },
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '90',
      header: { text: t('사번') },
    },
    {
      fieldName: 'JOB_TIT_NM', 
      dataType: 'text',
      width: '90',
      header: { text: t('직급') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '90',
      header: { text: t('성명') },
    },
    {
      fieldName: 'TEL_NO',
      dataType: 'text',
      width: '150',
      header: { text: t('사내번호') },
    },
    {
      fieldName: 'HLD_OFFI_GBN',
      dataType: 'text',
      header: { text: t('재직여부') },
    },
    // 출력 안함
    {
      fieldName: 'BIRTH_DAY',
      dataType: 'text',
      width: '100',
      header: { text: t('생년월일') },
      visible: false,
    },
    //2024.08.20 김현재 작성
    //산재모듈에서 출력하는 생년월일 (퇴직자의 생년월일까지 같이 나온다.)
    {
      fieldName: 'SANJE_BIRTH_DAY',
      dataType: 'text',
      visible: false,
      header: { text: t('생년월일') },
    },
    { fieldName: 'ADDR', dataType: 'text', visible: false },
    { fieldName: 'ADDR1', dataType: 'text', visible: false },
    { fieldName: 'AGE', dataType: 'text', visible: false },
    { fieldName: 'AGE_KOR', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_SHRT_NM', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'COMPANY', dataType: 'text', visible: false },
    { fieldName: 'COM_ENT_DATE', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_NM', dataType: 'text', visible: false },
    { fieldName: 'EMAIL', dataType: 'text', visible: false },
    { fieldName: 'ENG_NM', dataType: 'text', visible: false },
    { fieldName: 'GRD_CD', dataType: 'text', visible: false },
    { fieldName: 'GRD_NM', dataType: 'text', visible: false },
    { fieldName: 'JIKJONG_CD', dataType: 'text', visible: false },
    { fieldName: 'JOB_DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'JOB_DEPT_NM', dataType: 'text', visible: false },
    { fieldName: 'JOB_GRP_CD', dataType: 'text', visible: false },
    { fieldName: 'JOB_ROW_CD', dataType: 'text', visible: false },
    { fieldName: 'JOB_ROW_NM', dataType: 'text', visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', visible: false },
    { fieldName: 'MARR_YN', dataType: 'text', visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', visible: false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', visible: false },
    { fieldName: 'RESM_DATE', dataType: 'text', visible: false },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', visible: false },
    { fieldName: 'SEX', dataType: 'text', visible: false },
    { fieldName: 'STD_DUTY_CD', dataType: 'text', visible: false },
    { fieldName: 'STD_DUTY_NM', dataType: 'text', visible: false },
    { fieldName: 'HND_PHN', dataType: 'text', visible: false },
    { fieldName: 'TMP_RST_DATE', dataType: 'text', visible: false },
    { fieldName: 'TMP_RST_RSN', dataType: 'text', visible: false },
    { fieldName: 'UNT_DUTY_CD', dataType: 'text', visible: false },
    { fieldName: 'UNT_DUTY_NM', dataType: 'text', visible: false },
    { fieldName: 'COMP_CD', dataType: 'text', visible: false },
    { fieldName: 'GWA_CD', dataType: 'text', visible: false },
    { fieldName: 'OFFI_RES_DATE', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field


/* ------------- 팝업 ------------- */
// 팝업 닫기
const onClose = () => {
  for (let i in options.onlyDisabled) {
    options.onlyDisabled[i] = false
  }

  codeList.bsnsCd = []
  codeList.deptCd = []
  codeList.asgnCd = []

  dialog.value = false
}

// 데이터 선택 후
const onSelect = (clickData) => {
  if (grdMain.value.getGridView().getCurrent().dataRow === -1) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  }
  if (options.multi && clickData === undefined) {
    let newArr = []
    let checkedItem = grdMain.value.getGridView().getCheckedRows()
    if (checkedItem.length === 0) {
      Message.warn(t('선택한 데이터가 없습니다.'))
      return
    }

    for (let i of checkedItem) {
      let pushArr = grdMain.value.getDataProvider().getJsonRow(i)
      newArr.push(pushArr)
    }
    emit('selected', newArr)
    if (options.values.AUTO_CLOSE !== 'N') {
      onClose()
    }
  } else {
    var rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    if (options.multi) {
      let newArr = []
      var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      newArr.push(rtnData)
      emit('selected', newArr)
      if (options.values.AUTO_CLOSE !== 'N') {
        onClose()
      }
    }
    var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (!options.multi) {
      emit('selected', rtnData)
      if (options.values.AUTO_CLOSE !== 'N') {
        onClose()
      }
    }
  }
}

//초기 데이터셋팅
onMounted(() => {
  //테스트
  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  //initCodeList()
})

/* ------------- 클릭 이벤트 ------------- */
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnSelect') {
    onSelect()
  } else if (btn.id === 'btnClose') {
    grdMain.value.getDataProvider().setRows([])
    dialog.value = false
  }
}

/* ------------- 조회 ------------- */
const beforeSearch = async () => {
  if (!options.ALL_SEARCH) {
    if (
      !options.values.DEPT_CD &&
      !options.values.EMP_NM &&
      !options.values.EMP_NO &&
      !options.values.ASGN_CD
    ) {
      return Message.err('부서 및 협력사를 선택하거나 사번 및 성명을 입력해주세요.')
    }
  }

  return true
}

const searchData = () => {
  return commonSearchApi({ queryId: 'HLTHF0060_SEARCH_EMP', param: options.values })
}



// Enter 이벤트
const enterSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    //.setSearchArea(searchArea)
    .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

// gird 더블 클릭 시 조회
const onCellDblClicked = (grid, clickData) => {
  //onButtonsClick({ id: "btnSelect" })

  onSelect(clickData)
}

//라디오박스 변경시 자동조회
//2024-02-15 김현재 추가
watch(
  () => options.values.USER_DIV,
  () => {
    if (
      !options.values.DEPT_CD &&
      !options.values.EMP_NM &&
      !options.values.EMP_NO
    ) {
      return false
    } else {
      onButtonsClick({ id: 'btnSearch' })
    }
  }
)

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1150"
    height="780"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>인원 검색</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="true"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex flex-gap">
              <i-select
                :label="$t('회사구분')"
                labelWidth="60px"
                v-model="options.values.CMPNY_DIV"
                :items="codeList.company"
                item-value="COD"
                item-title="TXT"
                :disabled="true"
                class="custom-flex-1"
              />
              <div class="custom-flex-2 d-flex align-center">
                <i-label class="flex-grow-1" label-loc="none" required>
                  <template #editor>
                  <v-radio-group
                    v-model="options.values.USER_DIV"
                    inline
                    :disabled="options.onlyDisabled.USER_DIV_D"
                  >
                    <v-radio
                      v-for="item in codeList.USER_DIV"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                      :disabled="item.DISABLE"
                    />
                  </v-radio-group>
                </template>
                </i-label>
                
              </div>
              <div class="custom-flex-1">
                <i-label>
                  <template #editor>
                    <v-checkbox
                      :label="$t('인원선택 후 자동종료')"
                      v-model="options.values.AUTO_CLOSE"
                      class="ml-5"
                      :disabled="options.onlyDisabled.AUTO_CLOSE_D"
                    ></v-checkbox>
                  </template>
                </i-label>
              </div>
            </div>
            <div class="mt-2 d-flex flex-gap">
              <i-select
                :label="$t('사업부')"
                labelWidth="60px"
                v-model="options.values.BSNS_CD"
                :items="codeList.bsnsCd"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                class="custom-flex-1"
                :disabled="options.onlyDisabled.BSNS_CD_D"
                @update:modelValue="setDept(true)"
              />
              <i-select
                :label="$t('부서')"
                labelWidth="60px"
                v-model="options.values.DEPT_CD"
                :items="codeList.deptCd"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
                class="custom-flex-1"
                :disabled="options.onlyDisabled.DEPT_CD_D"
                @update:modelValue="setAsgn(true)"
              />
              <i-select
                :label="$t('협력사')"
                labelWidth="60px"
                v-model="options.values.ASGN_CD"
                :items="codeList.asgnCd"
                item-value="ASGN_CD"
                item-title="ASGN_NM"
                class="custom-flex-1"
                :disabled="options.onlyDisabled.ASGN_CD_D"
              />
              <span class="custom-flex-1"></span>
            </div>
            <div class="mt-2 d-flex flex-gap">
              <i-input
                :label="$t('사번')"
                label-width="60px"
                v-model="options.values.EMP_NO"
                @keydown.enter="(e) => enterSearch(e)"
                class="custom-flex-1"
              />
              <!-- oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' );" -->
              <i-input
                :label="$t('성명')"
                label-width="60px"
                v-model="options.values.EMP_NM"
                @keydown.enter="(e) => enterSearch(e)"
                class="custom-flex-1"
              />
              <span class="custom-flex-2"></span>
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped>
.flex-gap {
  gap: 10px;
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  flex-basis: calc(0% + 10px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
}
</style>