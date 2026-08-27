<script setup>
import { ref, reactive, onMounted, watch, toRef } from 'vue'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import {
  commonSearchApi,
  commonExecuteApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { notify } from '@kyvg/vue3-notification'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUpload from '@/components/IUpload.vue'
//변수선언부 시작
let dialog = ref(false)
const grdMain = ref(null)
const userStore = useUserStore()
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const empPopup = ref(null)
const fileUpload = ref(null)
const emit = defineEmits(["popupExit"])
const STATUS = ref('')
const menuTitle = ref(null)

let popupField = reactive({
  CERT_DT: '', //심사일정
  CERT_EMP_NM: '', //추진자
  CERT_EMP_TEL: '', //추진자옆
  IN_OUT: '', //내/외부
  IN_OUT_CD: '', // 내/외부 코드
  SEQ: '', //순번
  CERT_NM: '', //규격
  CERT_ITEM: '', //심사항목
  RESULT_CD: '', //부적합등급
  RECEIVE_DT: '', //회신요구일
  RESULT_CONTENTS: '', //부적합내용
  SOLUTION_PLAN: '', //개선조치방안
  ACTION_CD: '', //조치상태
  ACTION_DT: '', //조치일자
  ACTION_DT_DIV: '', //조치일자옆
  ACTION_EMP_NM: '', //조치자
  ACTION_EMP: '', //조치자 코드
  ACTION_CONTENTS1: '', //조치결과
  ACTION_CONTENTS2: '', //발생원인
  ACTION_CONTENTS3: '', //재발방지대책
  SA_COMMENT: '', //심사위원 검토의견
  ACTION_ATT_ID: '',
})

const saveParam = reactive([
  {
    CMPNY_DIV: '',
    YEAR: '',
    BSNS_CD: '',
    ASGN_CD: '',
    IN_OUT: '',
    SEQ: '',
    SOLUTION_PLAN: '',
    ACTION_CONTENTS1: '',
    ACTION_CONTENTS2: '',
    ACTION_CONTENTS3: '',
    ACTION_DT: '',
    ACTION_DT_DIV: '',
    ACTION_EMP: '',
    ACTION_ATT_ID: '',
    ACTION_CD: '',
    SA_COMMENT: '',
    USER_ID: '',
  },
])

let isReadOnly = ref('')  // 진행상태 값에 따른 수정가능 여부 (20 : 조치결과 등록대기)
let isReadOnly2 = ref('') // 진행상태 값에 따른 수정가능 여부 (30 : 심사원 검토 중)
let searchParams = reactive({}) // 부적합 목록 조회 파라미터
let searchParams2 = reactive({}) //파일첨부 내역 조회 파라미터

const actionStatus = reactive([
  { COD: ' ', TXT: '미조치' },
  { COD: '1', TXT: '조치중' },
  { COD: '3', TXT: '조치완료' },
])

const actionDtDiv = reactive([
  { COD: 'A', TXT: '완료예정일' },
  { COD: 'B', TXT: '완료일' },
])

const resultDiv = reactive([
  { COD: 'Y', TXT: '적합' },
  { COD: 'N1', TXT: '작업중지' },
  { COD: 'N2', TXT: '중대부적합' },
  { COD: 'N3', TXT: '경미부적합' },
  { COD: 'N4', TXT: '관찰사항' },
  { COD: 'N5', TXT: '권고사항' },
  { COD: 'N', TXT: '부적합' },
])

const inOut = reactive([
  { COD: 'IN', TXT: '내부' },
  { COD: 'OT', TXT: '외부' },
])
//변수 선언부 끝
const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'FILE_TITLE',
      dataType: 'text',
      width: '300',
      header: { text: t('파일제목') },
      editable: false,
    },
    {
      fieldName: 'FILE_SIZE',
      dataType: 'text',
      header: { text: t('크기(KB)') },
      editable: false,
    },
    {
      fieldName: 'COL03',
      dataType: 'text',
      header: { text: t('보기') },
    },
    {
      fieldName: 'COL04',
      dataType: 'text',
      header: { text: t('삭제') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = async (param) => {
  dialog.value = true
  console.log('여기', param)
  searchParams = {
    CMPNY_DIV : param.CMPNY_DIV,
    YEAR : param.YEAR,
    BSNS_CD : param.BSNS_CD,
    ASGN_CD : param.ASGN_CD,
    IN_OUT : param.IN_OUT,
    SEQ : param.SEQ, //String(isNullAndZero(param.SEQ) + 1).padStart(3, '0'),
    ASGN_FULL_NM : param.ASGN_FULL_NM,
    ACTION_ATT_ID : param.ACTION_ATT_ID,
    STATUS : param.STATUS,
  }

  searchParams2.CMPNY_DIV = searchParams.CMPNY_DIV
  searchParams2.FILE_ID = searchParams.ACTION_ATT_ID
  onButtonsClick({ id: 'btnSearch' })

  
}

const isNullAndZero = data =>{
  return isNullCheck(data) ? 0 : parseFloat(data)
}

const isNullCheck = data => {
  return (data === undefined || data === null || data === '') ? true : false
}

defineExpose({
  openPopup,
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).run()
  } else {
    closePopup()
  }
}

const closePopup = () => {
  for (let i in popupField) {
    popupField[i] = '' //팝업 닫을때 컴포넌트값 초기화
  }
  isReadOnly.value = '' //팝업 닫을때 결제여부값 초기화
  fileUpload.value.clearGrid() //팝업 닫을때 파일업로드 그리드 초기화
  dialog.value = false

  emit("popupExit")
}
//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'MNGDA0030_POP01_search01',
    param: searchParams,
  })
}

const afterSearch = (res) => {
  console.log('체크222', res)
  
  popupField.CERT_DT = res.ORESULT_CUR[0].CERT_DT
  popupField.CERT_EMP_NM = res.ORESULT_CUR[0].CERT_EMP_NM
  popupField.CERT_EMP_TEL = res.ORESULT_CUR[0].CERT_EMP_TEL
  popupField.IN_OUT = res.ORESULT_CUR[0].IN_OUT
  popupField.IN_OUT_CD = res.IN_OUT
  popupField.SEQ = res.ORESULT_CUR[0].SEQ
  popupField.CERT_NM = res.ORESULT_CUR[0].CERT_NM
  popupField.CERT_ITEM = res.ORESULT_CUR[0].CERT_ITEM
  popupField.RESULT_CD = res.ORESULT_CUR[0].RESULT_CD
  popupField.RECEIVE_DT = res.ORESULT_CUR[0].RECEIVE_DT ? res.ORESULT_CUR[0].RECEIVE_DT.substr(0, 10) : ''
  popupField.RESULT_CONTENTS = res.ORESULT_CUR[0].RESULT_CONTENTS
  popupField.SOLUTION_PLAN = res.ORESULT_CUR[0].SOLUTION_PLAN
  popupField.ACTION_CD = res.ORESULT_CUR[0].ACTION_CD
  popupField.ACTION_DT = res.ORESULT_CUR[0].ACTION_DT ? res.ORESULT_CUR[0].ACTION_DT.substr(0, 10) : ''
  popupField.ACTION_DT_DIV = res.ORESULT_CUR[0].ACTION_DT_DIV
  popupField.ACTION_EMP_NM = res.ORESULT_CUR[0].ACTION_EMP_NM
  popupField.ACTION_EMP = res.ORESULT_CUR[0].ACTION_EMP
  popupField.ACTION_CONTENTS1 = res.ORESULT_CUR[0].ACTION_CONTENTS1
  popupField.ACTION_CONTENTS2 = res.ORESULT_CUR[0].ACTION_CONTENTS2
  popupField.ACTION_CONTENTS3 = res.ORESULT_CUR[0].ACTION_CONTENTS3
  popupField.SA_COMMENT = res.ORESULT_CUR[0].SA_COMMENT
  popupField.ACTION_ATT_ID = res.ORESULT_CUR[0].ACTION_ATT_ID
  checkFileId()

  STATUS.value = res.STATUS
  menuTitle.value.setBtnProperty('btnUpdate', 'visible', false)

  // 조치결과 등록대기 상태에서는 조치 결과 입력 가능 (STATUS = '20')
  if (res.STATUS === '20'){
    isReadOnly.value  = false
    isReadOnly2.value = true
    menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)
    
  // 심사원 검토중 상태에서는 검토 의견 입력 가능 (STATUS = '30')
  } else if (res.STATUS === '30'){
    isReadOnly.value  = true
    isReadOnly2.value = false
    menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)

  } else{
    isReadOnly.value  = true
    isReadOnly2.value = true
  }
  console.log ('isReadOnly', isReadOnly.value)
  console.log ('isReadOnly2', isReadOnly2.value)
}

const searchData2 = () => {
  return commonSearchApi({
    queryId: 'MNGDA0030_POP01_search02',
    param: searchParams2,
  })
}
//조회관련 로직 끝

//파일첨부 관련 로직 시작

const checkFileId = () => {
  console.log('파일체크')
  if (popupField.ACTION_ATT_ID != null) {
    fileUpload.value.setGuid(popupField.ACTION_ATT_ID)
    popupField.ACTION_ATT_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    fileUpload.value.setGuid()
    popupField.ACTION_ATT_ID = fileUpload.value.guid
    saveFileID(popupField.ACTION_ATT_ID)
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
}

const saveFileID = (fileID) => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: searchParams.YEAR,
    BSNS_CD: searchParams.BSNS_CD,
    ASGN_CD: searchParams.ASGN_CD,
    IN_OUT: popupField.IN_OUT_CD,
    SEQ: popupField.SEQ,
    ACTION_ATT_ID: fileID,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'MNGDA0030_POP01_save01',
    list: saveParam,
  }).then(res => {
    console.log('파일업로드 res : ', res)
    if (res.result.code === '20000000'){
      popupField.ACTION_ATT_ID = fileID
    }
  })
}
//파일첨부 관련 로직 끝

//저장관련 로직 시작
const beforeSave = async () => {

  // 조치결과 등록대기
  if (STATUS.value === '20'){
    if (isReadOnly.value == true) {
    //결제완료된 데이터는 조치결과 등록 팝업에서 수정 불가
      Message.warn(t('결재완료된 데이터는 수정할 수 없습니다.'))
    } else if (popupField.ACTION_CD === '') {
      Message.warn(t('조치상태를 입력해주세요.'))
      return false
    } else if (popupField.ACTION_DT === '') {
      Message.warn(t('조치일자를 입력해주세요.'))
      return false
    } else if (popupField.ACTION_DT_DIV === '') {
      Message.warn(t('조치일자구분을 입력해주세요.'))
      return false
    } else if (popupField.ACTION_EMP === '') {
      Message.warn(t('조치자를 입력해주세요.'))
      return false
    } else if (popupField.ACTION_CONTENTS2 === '') {
      Message.warn(t('발생원인을 입력해주세요.'))
      return false
    } else if (popupField.ACTION_CONTENTS1 === '') {
      Message.warn(t('조치결과를 입력해주세요.'))
      return false
    } else if (popupField.ACTION_CONTENTS3 === '') {
      Message.warn(t('재발방지대책을 입력해주세요.'))
      return false
    } else {
      return true
    }
  
  // 심사원 검토 중
  } else if (STATUS.value === '30'){
    if (isNullCheck(popupField.SA_COMMENT)) {
      Message.warn(t('심사원 검토의견을 입력해주세요.'))
      return false
    } else {
      return true
    }
  }

  
}

const saveData = () => {
  saveParam[0].CMPNY_DIV = userStore.cmpnyDiv
  saveParam[0].YEAR = searchParams.YEAR
  saveParam[0].BSNS_CD = searchParams.BSNS_CD
  saveParam[0].ASGN_CD = searchParams.ASGN_CD
  saveParam[0].IN_OUT = popupField.IN_OUT_CD
  saveParam[0].SEQ = popupField.SEQ
  saveParam[0].SOLUTION_PLAN = popupField.SOLUTION_PLAN
  saveParam[0].ACTION_CONTENTS1 = popupField.ACTION_CONTENTS1
  saveParam[0].ACTION_CONTENTS2 = popupField.ACTION_CONTENTS2
  saveParam[0].ACTION_CONTENTS3 = popupField.ACTION_CONTENTS3
  saveParam[0].ACTION_DT = popupField.ACTION_DT.replaceAll('-', '')
  saveParam[0].ACTION_DT_DIV = popupField.ACTION_DT_DIV
  saveParam[0].ACTION_EMP = popupField.ACTION_EMP
  saveParam[0].ACTION_ATT_ID = popupField.ACTION_ATT_ID
  saveParam[0].ACTION_CD = popupField.ACTION_CD
  saveParam[0].SA_COMMENT = popupField.SA_COMMENT
  saveParam[0].USER_ID = userStore.userId
  return commonExecuteApi({
    queryId: 'MNGDA0030_save01',
    list: saveParam,
  })
}

//저장관련 로직 끝

// 인원 조회 팝업 오픈
const openEmpPopup = () => {

  // 심사원 검토 중 일때만 선택 가능
  if (STATUS.value !== '20'){
    return
  }

  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: popupField.ACTION_EMP_NM,
  })
}

// 인원 조회 팝업 선택 이벤트
const onEmpSelected = (val) => {
  popupField.ACTION_EMP_NM = val.EMP_NM
  popupField.ACTION_EMP = val.EMP_NO
}

watch(
  () => popupField.ACTION_CD,
  (newValue, oldValue) => {
    if (newValue === '3'){
      popupField.ACTION_DT_DIV = 'B'
    } else {
      popupField.ACTION_DT_DIV = 'A'
    }
  }
)


</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1500"
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
      <span>조치결과 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-2 pb-2">
          <IMenuTitle
            ref="menuTitle"
            :button-list="['btnSearch', 'btnUpdate', 'btnClose']"
            @click-button="onButtonsClick"
          />
      </v-card-title>
      <VForm ref="searchArea" class="searchArea d-flex">
        <!--  년도  -->
        <i-input
          :label="$t('년도')"
          label-width="35px"
          width="150px"
          v-model="searchParams.YEAR"
          :readonly="true"
          type="Number"
          oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
        />
        <!--사업부/부서-->
        <i-input 
          :label="$t('사업부/부서')"
          label-width="90px"
          width="410px"
          v-model="searchParams.ASGN_FULL_NM" 
          margin="4px"
          :readonly="true"
        />
      </VForm>
      <v-card-title> 심사일정</v-card-title>
      <VForm ref="searchArea" class="searchArea d-flex">
        <!-- 심사일정 -->
        <i-input
          :label="$t('심사일정')"
          v-model="popupField.CERT_DT"
          :readonly="true"
          top-label
          width="255px"
          label-width="90px"
        />
        <!-- HSE 추진자 -->
        <i-input
          :label="$t('HSE 추진자')"
          v-model="popupField.CERT_EMP_NM"
          :readonly="true"
          top-label
          width="255px"
          label-width="90px"
        />
        <i-input
          v-model="popupField.CERT_EMP_TEL"
          :readonly="true"
          top-label
          width="255px"
          label-width="90px"
        />
        <!-- 내외 여부 -->
        <i-select
          :label="$t('내/외부')"
          label-width="70px"
          width="300px"
          top-label
          v-model="popupField.IN_OUT"
          :items="inOut"
          :readonly="true"
          item-value="value"
          item-title="title"
        /> 
      </VForm>
      <div class="d-flex pb-2">
        <div>
          <v-card-title>심사 결과 상세</v-card-title>
          <VForm ref="searchArea" class="searchArea">
            <div class="d-flex">
              <!-- 순번 -->
              <i-input
                :label="$t('순번')"
                v-model="popupField.SEQ"
                :readonly="true"
                top-label
                width="255px"
                label-width="90px"
              />
              <!-- 규격 -->
              <i-input
                :label="$t('규격')"
                v-model="popupField.CERT_NM"
                :readonly="true"
                top-label
                width="255px"
                label-width="90px"
              />
            </div>
            <!-- 심사항목 -->
            <div class="formLabelText">심사항목</div>
            <v-textarea
              placeholder="심사항목"
              v-model="popupField.CERT_ITEM"
              :readonly="true"
              rows="8"
            />
            <!-- 부적합등급 -->
            <i-select
              :label="$t('부적합등급')"
              label-width="70px"
              width="300px"
              v-model="popupField.RESULT_CD"
              top-label
              :items="resultDiv"
              :readonly="true"
              item-value="COD"
              item-title="TXT"
            /> 
            <!-- 회신 요구일 -->
            <i-input
              :label="$t('회신 요구일')"
              v-model="popupField.RECEIVE_DT"
              :readonly="true"
              type="date"
              top-label
              width="255px"
              label-width="90px"
            />
            <!-- 부적합 내용 -->
            <div class="formLabelText">부적합 내용</div>
            <v-textarea
              placeholder="부적합 내용"
              v-model="popupField.RESULT_CONTENTS"
              :readonly="true"
              rows="8"
            />
            <!-- 개선조치방안 -->
            <div class="formLabelText">개선조치방안</div>
            <v-textarea
              placeholder="개선조치방안"
              v-model="popupField.SOLUTION_PLAN"
              :readonly="isReadOnly"
              rows="8"              
            />
          </VForm>
        </div>
        <v-divider vertical />
        <div>
          <v-card-title>개선 조치 내역</v-card-title>
          <VForm ref="searchArea" class="searchArea d-flex">
            <div>
              <!-- 조치상태 -->
              <i-select
                :label="$t('조치상태')"
                label-width="70px"
                width="330px"
                v-model="popupField.ACTION_CD"
                top-label
                :items="actionStatus"
                :readonly="isReadOnly"
                item-value="COD"
                item-title="TXT"
              /> 
              <!-- 조치일자 -->
              <div class="d-flex">
                <i-input 
                  width="200px"
                  :label="$t('조치일자')" 
                  type="date"
                  :readonly="isReadOnly"
                  v-model="popupField.ACTION_DT"
                  top-label
                />
                <i-select
                  label-width="70px"
                  width="200px"
                  v-model="popupField.ACTION_DT_DIV"
                  top-label
                  :items="actionDtDiv"
                  :readonly= true
                  item-value="COD"
                  item-title="TXT"
                /> 
              </div>
              <!-- 조치자 -->
              <i-input 
                :label="$t('조치자')"
                label-width="90px"
                width="410px"
                v-model="popupField.ACTION_EMP_NM" 
                append-inner-icon="mdi-magnify" 
                top-label
                @keydown.enter="e => {
                  openEmpPopup('인원조회')
                }"
                @click:appendInner="openEmpPopup('인원조회')"
                :readonly="isReadOnly"
                margin="4px"
              />
              <!-- 발생원인 -->
              <div class="formLabelText">발생원인 (근본원인)</div>
              <v-textarea
                placeholder="발생원인(근본원인)"
                v-model="popupField.ACTION_CONTENTS2"
                :readonly="isReadOnly"
                rows="8"              
              />
            </div>
            <div class="ml-2" style="width : 450px">
              <!-- 조치결과 -->
              <div class="formLabelText">조치결과 (부적합 사항을 제거하기 위한 시정조치결과)</div>
              <v-textarea 
                placeholder="조치결과(부적합 사항을 제거하기 위한 시정조치결과)"
                v-model="popupField.ACTION_CONTENTS1"
                width="450px"
                :readonly="isReadOnly"
                rows="7"              
              />
              <!-- 재발방지대책 -->
              <div class="formLabelText mt-2">근본원인 제거를 위한 재발방지대책</div>
              <v-textarea
                placeholder="근본원인 제거를 위한 재발방지대책"
                v-model="popupField.ACTION_CONTENTS3"
                width="450px"
                :readonly="isReadOnly"
                rows="7"              
              />
            </div>
          </VForm>
          <IUpload
            class="pa-2"
            ref="fileUpload"
            grid-title="개선조치첨부"
            style="height: 360px"
            :readonly="isReadOnly"
          />
        </div>
      </div>
      <!-- 심사원 검토의견 -->
      <div>
      <!-- <div :style="`display:${item.visible ? '' : 'none'}`"> -->
        <v-card-title>심사원 검토의견</v-card-title>
        <!-- <div class="ml-2 formLabelText">심사원 검토의견</div> -->
        <v-textarea
          class="ma-2"
          placeholder="심사원 검토의견"
          bg-color="#EFF8FD"
          v-model="popupField.SA_COMMENT"
          :readonly="isReadOnly2"
          rows="8"              
        />
      </div>
      
      <!-- 인원조회팝업 -->
      <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    </v-card>
  </v-dialog>
</template>
