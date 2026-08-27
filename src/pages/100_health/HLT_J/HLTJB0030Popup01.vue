<!--
  화면명 : 난청 신청 추가 팝업
  화면개요 : 난청 신청 추가 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IUpload from "@/components/IUpload.vue"
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import _ from 'lodash'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const diagnosisTitle = ref(null)
const empPopup = ref(null)
const grdMain = ref(null)
const fileUpload = ref(null)
const fileUploadButton = reactive(["btnDownLoad", "btnDelete"])

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  BIRTH_DAY: '', // 생일
  HLD_OFFI_GBN: '', // 재직구분
  BSNS_NM: '', // 사업부
  DEPT_NM: '', // 부서
  GWA_NM: '', // 과
  STD_DUTY_NM: '', // 직종(상세분류중 중간)
  UNT_DUTY_NM: '', // 직종(상세분류중 마지막)
  COM_ENT_DATE: '', // 입사일자
  RETI_DATE: '', // 휴,퇴직일
  CMPNY_RCPT_DATE: '', // 회사접수일
  APPLI_GUBUN: '', // 신청구분
  APPLI_GUBUN_NM: '', // 신청구분명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  DIAGNOSIS_DATE: '', // 진단일
  DISEASE_NM: '난청', // 상병명
  APPLI_DATE: '', // 진정일(pk)
  INCIDENT_CODE: '', // 발생경위 코드
  INCIDENT_NM: '', // 발생경위
  NOTIFY_FILE_ID: '', // 사실통지서
  WORK_YEAR: '',
  WORK_EVAL: '', // 자체 작업력 평가
  EXPIRATION_DATE: '', // 유효기간
  IND_MANAGE: '',
  EAR_LEFT: '',
  EAR_RIGHT: '',
  FINAL_DATE: '',
  EVAL_RESULT: '',
  EVAL_DATE: '',
  CLASS_NUM: '',
  REMARK: '',
  SAVE_YN: '',
  ONLY_VIEW: false // 읽기 전용 구분
})

const codeList = reactive({
  APPLI_GUBUN: [],
  INCIDENT: [],
  HOSPITAL: [],
  IND_MANAGE: [], // 조직별담당자 화면에서 공단 담당자 목록들을 불러온다.
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴사' },
    { COD: '4', TXT: '군입영' },
  ],
  EVAL_RESULT: []
})

const getCode = (param) => {
  Promise.all([
    // 신청구분
    getCodeList('HHII820A'),
    // 발생경위
    getCodeList('HHII820B'),
    // 진단기관
    getCodeList('HHII820C'),
    // 판정결과
    getCodeList('HHII820I'),
  ]).then((res) => {
    codeList.APPLI_GUBUN = res[0].ORESULT_CUR
    codeList.INCIDENT = res[1].ORESULT_CUR
    codeList.HOSPITAL = res[2].ORESULT_CUR
    codeList.EVAL_RESULT = res[3].ORESULT_CUR

    insertName()
    if(!isEmpty(param)) {
      for (let key in param) {
        if (searchParams.hasOwnProperty(key)) {
          if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
            searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYY-MM-DD')
          } else if (key === 'APPLI_DATE' && !isEmpty(param.APPLI_DATE)) {
            searchParams.APPLI_DATE = dayjs(param.APPLI_DATE).format('YYYY-MM-DD')
          } else if (key === 'BIRTH_DAY' && !isEmpty(param.BIRTH_DAY)) {
            searchParams.BIRTH_DAY = dayjs(param.BIRTH_DAY).format('YYYY-MM-DD')
          } else if (key === 'COM_ENT_DATE' && !isEmpty(param.COM_ENT_DATE)) {
            searchParams.COM_ENT_DATE = dayjs(param.COM_ENT_DATE).format('YYYY-MM-DD')
          } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
            searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD')
          } else if (key === 'FINAL_DATE' && !isEmpty(param.FINAL_DATE)) {
            searchParams.FINAL_DATE = dayjs(param.FINAL_DATE).format('YYYY-MM-DD')
          } else if (key === 'EVAL_DATE' && !isEmpty(param.EVAL_DATE)) {
            searchParams.EVAL_DATE = dayjs(param.EVAL_DATE).format('YYYY-MM-DD')
          } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
            searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD') 
          } else if (key === 'CMPNY_RCPT_DATE' && !isEmpty(param.CMPNY_RCPT_DATE)) {
            searchParams.CMPNY_RCPT_DATE = dayjs(param.CMPNY_RCPT_DATE).format('YYYY-MM-DD')          
          } else if (key === 'HLD_OFFI_GBN') {
            let hldOffiGbn = codeList.HLD_OFFI_GBN.filter(item => item.COD === param.HLD_OFFI_GBN)
            searchParams.HLD_OFFI_GBN = !isEmpty(hldOffiGbn) ? hldOffiGbn[0].TXT : ''
          } else {
            searchParams[key] = param[key]
          }
        }
      }
      searchParams.EMP_NM = param.KOR_NM
      searchParams.SAVE_YN = 'Y'
    } else {
      searchParams.SAVE_YN = 'N'
      searchParams.CMPNY_DIV = userStore.cmpnyDiv
      // menuTitle.value.disableBtn('btnDelete', true)
    }

    searchParams.DISEASE_NM = '난청'
    checkFileId()
  })
}

// 팝업 OPEN
const openPopup = (param) => {
  searchParams.ONLY_VIEW = false
  getCode(param)
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') { 
    // 저장
    new saveFlowHelper(vm, t)
      .showToast(false)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

// 저장 전
const beforeSave = () => {
  // validation 체크
  if (isEmpty(searchParams.EMP_NO)) {
    return Message.warn(t('신청인 정보가 없습니다.'))
  } else if (isEmpty(searchParams.CMPNY_DIV)) {
    return Message.warn(t('회사구분은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.APPLI_GUBUN) || isEmpty(searchParams.APPLI_GUBUN_NM)) {
    return Message.warn(t('신청구분은 필수 입력입니다.')) 
  } else if (isEmpty(searchParams.HOSPITAL_CODE) || isEmpty(searchParams.HOSPITAL_NM)) {
    return Message.warn(t('진단기관은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.DIAGNOSIS_DATE)) {
    return Message.warn(t('진단일은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.APPLI_DATE)) {
    return Message.warn(t('진정일은 필수 입력입니다.'))
  } 

  return true
}

// 저장
const saveData = async () => {
  let saveParam = _.cloneDeep(searchParams)
  saveParam.APPLI_DATE = searchParams.APPLI_DATE.replaceAll('-', '')
  saveParam.DIAGNOSIS_DATE = searchParams.DIAGNOSIS_DATE.replaceAll('-', '')  
  if(!isEmpty(searchParams.FINAL_DATE)) {
    saveParam.FINAL_DATE = searchParams.FINAL_DATE.replaceAll('-', '')
  }
  if(!isEmpty(searchParams.EVAL_DATE)) {
    saveParam.EVAL_DATE = searchParams.EVAL_DATE.replaceAll('-', '')
  }
  if(!isEmpty(searchParams.RETI_DATE)) {
    saveParam.RETI_DATE = searchParams.RETI_DATE.replaceAll('-', '')
  }
  if(!isEmpty(saveParam.BIRTH_DAY)) {
    saveParam.BIRTH_DAY = searchParams.BIRTH_DAY.replaceAll('-', '')
  }
  if(!isEmpty(saveParam.COM_ENT_DATE)) {
    saveParam.COM_ENT_DATE = searchParams.COM_ENT_DATE.replaceAll('-', '')
  }
  if(!isEmpty(saveParam.CMPNY_RCPT_DATE)) {
    saveParam.CMPNY_RCPT_DATE = searchParams.CMPNY_RCPT_DATE.replaceAll('-', '')
  }
  
  // 중복 체크 
  let cnt = await commonSearchApi({ queryId : 'HLTJB0030_SEARCH_02', param: {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    EMP_NO: searchParams.EMP_NO,
    DIAGNOSIS_DATE: dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD'),
    HOSPITAL_CODE: searchParams.HOSPITAL_CODE,
    HOSPITAL_NM: searchParams.HOSPITAL_NM
  }})
  if(!isEmpty(cnt) && searchParams.SAVE_YN !== 'Y') {
    if(cnt.ORESULT_CUR[0].CNT > 0) {
      return Message.warn(t('이미 동일한 사건이 등록되어 있습니다.'))
    }
  }

  return commonExecuteApi({ queryId : 'HLTJB0030_SAVE_01', list: [saveParam] })
}

const afterSaveData = (res) => {
  if(!isEmpty(res)) {
    Message.success(t('성공적으로 저장되었습니다'))
    searchParams.SAVE_YN = 'Y'
  }
}

const clearParam = () => {
  for (let key in searchParams) {
    if (searchParams.hasOwnProperty(key)) {
      if(typeof(searchParams[key]) == 'boolean') {
        searchParams[key] = false
      }else {
        searchParams[key] = ''
      }
    } 
  }
  searchParams.DISEASE_NM = '난청'
  checkFileId()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')

  clearParam()

  dialog.value = false
}

// 인원 선택 이벤트
const onEmpSelected = val => {
  clearParam()
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.EMP_NO = val.EMP_NO
  searchParams.EMP_NM = val.EMP_NM
  searchParams.BIRTH_DAY = val.BIRTH_DAY
  searchParams.HLD_OFFI_GBN = val.HLD_OFFI_GBN
  searchParams.BSNS_NM = val.BSNS_NM
  searchParams.DEPT_NM = val.DEPT_NM
  searchParams.GWA_NM = val.GWA_NM
  searchParams.STD_DUTY_NM = val.STD_DUTY_NM
  searchParams.UNT_DUTY_NM = val.UNT_DUTY_NM ? val.UNT_DUTY_NM : val.STD_DUTY_NM
  searchParams.COM_ENT_DATE = val.GRP_ENT_DATE
  // searchParams.RETI_DATE = val.RETI_DATE
  if (searchParams.HLD_OFFI_GBN == '퇴사') {
    searchParams.RETI_DATE = dayjs(val.RETI_TMP_DATE).format('YYYY-MM-DD')
  } else {
    if(dayjs(val.TMP_RST_DATE).isValid()) {
      searchParams.RETI_DATE = dayjs(val.TMP_RST_DATE).format('YYYY-MM-DD')
    } else {
      searchParams.RETI_DATE = ''
    }
  }
}

// 사실통지 파일 세팅
const checkFileId = () => {
  if (isEmpty(searchParams.NOTIFY_FILE_ID)) {
    fileUpload.value.setGuid()
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(searchParams.NOTIFY_FILE_ID)
  }
  searchParams.NOTIFY_FILE_ID = fileUpload.value.guid
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
  
}

// 인원 검색
const openEmpPopup = () => {
  if(searchParams.SAVE_YN === 'Y') {
    return
  }
  empPopup.value.openPopup({MENU_ID: 'HLTJB0030', USER_DIV: 'A', FLAG: 'Y', readonly: true})
}

// 신청인 clear
const clearEmp = () => {
  if(searchParams.SAVE_YN === 'Y') {
    return
  }
  clearParam()
}

const findName = (array, target, name) => {
  let result = array.filter(item => item.COD === target)
  if(isEmpty(result)) return '' 

  if(result[0].TXT.replaceAll(' ', '') == '직접입력') {
    if(!isEmpty(array.filter(item => item.TXT === name))) {
      return ''
    } else {
      return name
    }
  } else {
    return result[0].TXT
  }
}

// 각 이름에 값을 넣어준다
const insertName = () => {
  searchParams.APPLI_GUBUN_NM = findName(codeList.APPLI_GUBUN, searchParams.APPLI_GUBUN, searchParams.APPLI_GUBUN_NM)
  searchParams.HOSPITAL_NM = findName(codeList.HOSPITAL, searchParams.HOSPITAL_CODE, searchParams.HOSPITAL_NM)
  searchParams.INCIDENT_NM = findName(codeList.INCIDENT, searchParams.INCIDENT_CODE, searchParams.INCIDENT_NM)
}

watch(() => [searchParams.APPLI_GUBUN
  , searchParams.HOSPITAL_CODE
  , searchParams.INCIDENT_CODE
  , searchParams.DIAGNOSIS_DATE], (newValue, oldValue) => {
  insertName()
})

watch(() => searchParams.WORK_EVAL, (newValue, oldValue) => {
  if(newValue == 'Y' && newValue != oldValue) {
    vm.$swal({ title: t('신청인은 당사 자체 근골격계질환 작업력 평가 기준에 의거\n 신청상병과 해당 업무 사이에 상당인과관계가 있음이 확인되어\n 보험가입자의견서에 재해사실 "인정"으로 제출 예정이오니,\n 이견이 있을 경우, "불인정"선택 후 사유 기술 바랍니다. \n\n -안전보건지원부-') })
  }
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    height="800"
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
      <span>업무상질병 신청 등록</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="t('신청자 정보')"
          :use-permission="false"
          :button-list="searchParams.ONLY_VIEW ? ['btnClose'] : ['btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <div class="d-flex">
            <i-input
              v-model="searchParams.EMP_NO"
              :label="$t('사번/성명')"
              label-width="70px"
              type="text"
              maxlength="20"
              width="180px"
              readonly
              required
            />
            <i-input
              v-model="searchParams.EMP_NM"
              type="text"
              append-inner-icon="mdi-magnify"
              width="130px"
              :readonly="searchParams.SAVE_YN === 'Y'"
              @click:appendInner="openEmpPopup"
              @keydown.enter="openEmpPopup"
            >
              <template #append-inner>
                <v-icon 
                  icon="mdi-window-close"
                  @click="clearEmp"
                />
              </template>
            </i-input>
            <i-input
              v-model="searchParams.BIRTH_DAY"
              :label="$t('생년월일')"
              label-width="70px"
              type="date"
              width="220px"
              :readonly="searchParams.ONLY_VIEW"
            />
            <i-input
              v-model="searchParams.HLD_OFFI_GBN"
              :label="$t('재직구분')"
              label-width="70px"
              type="text"
              width="220px"
              :readonly="true"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.BSNS_NM"
              :label="$t('사업부')"
              label-width="70px"
              type="text"
              width="250px"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.DEPT_NM"
              :label="$t('부서')"
              label-width="70px"
              class="mt-2"
              type="text"
              width="220px"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.GWA_NM"
              :label="$t('과')"
              label-width="70px"
              class="mt-2"
              type="text"
              width="220px"
              :readonly="searchParams.ONLY_VIEW"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.UNT_DUTY_NM"
              :label="$t('직종')"
              label-width="70px"
              type="text"
              width="250px"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.COM_ENT_DATE"
              :label="$t('입사일')"
              label-width="70px"
              type="date"
              width="220px"
              :readonly="searchParams.ONLY_VIEW"
            />
            <i-input
              v-model="searchParams.RETI_DATE"
              :label="$t('휴/퇴직일')"
              label-width="70px"
              type="date"
              width="220px"       
              :readonly="searchParams.ONLY_VIEW"
            />
          </div>
        </v-sheet>
      </div>
      <div style="max-height:800px; overflow-y: auto;">
        <div class="pa-4 pt-0">
          <IGridTitle
            ref="diagnosisTitle"
            :title="t('진단 정보')"
            
          />
          <v-sheet class="searchArea flex-column mb-2">
            <div class="d-flex">
              <i-select
                v-model="searchParams.APPLI_GUBUN"
                :label="$t('신청구분')"
                label-width="70px"
                :items="codeList.APPLI_GUBUN"
                item-value="COD"
                item-title="TXT" 
                width="220px"
                :readonly="searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
                required
              />
              <i-input
                v-model="searchParams.APPLI_GUBUN_NM"
                :label="$t('')"
                label-width="10px"
                type="text"
                width="220px"
                maxlength="50"
                :readonly="searchParams.APPLI_GUBUN != '999' || searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
              />
              <i-select
                v-model="searchParams.HOSPITAL_CODE"
                :label="$t('진단기관')"
                label-width="70px"
                :items="codeList.HOSPITAL"
                item-value="COD"
                item-title="TXT"
                :readonly="searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
                width="220px"
                required
              />
              <i-input
                v-model="searchParams.HOSPITAL_NM"
                :label="$t('')"
                label-width="10px"
                type="text"
                width="220px"
                maxlength="20"
                :readonly="searchParams.HOSPITAL_CODE != '999' || searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="searchParams.DIAGNOSIS_DATE"
                :label="$t('진단일')"
                label-width="70px"
                type="date"
                width="220px"
                :readonly="searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
                required
              />
              <i-input
                v-model="searchParams.APPLI_DATE"
                :label="$t('진정일')"
                label-width="70px"
                type="date"
                width="220px"
                :readonly="searchParams.SAVE_YN === 'Y' || searchParams.ONLY_VIEW"
                required
              />
              <i-input
                v-model="searchParams.CMPNY_RCPT_DATE"
                :label="$t('회사접수일')"
                label-width="70px"
                type="date"
                width="220px"
                :readonly="searchParams.ONLY_VIEW"
              />
              <i-input
                v-model="searchParams.IND_MANAGE"
                :label="$t('공단담당자')"
                label-width="70px"
                type="text"
                width="220px"
                maxlength="20"
                :readonly="searchParams.ONLY_VIEW"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="searchParams.DISEASE_NM"
                :label="$t('상병명')"
                label-width="70px"
                class="mr-4"
                type="text"
                width="220px"
                readonly
              />
              <v-checkbox
                v-model="searchParams.EAR_LEFT"
                :label="$t('좌이')"
                true-value="Y" 
                false-value="N"
                class="mt-1 mr-4"
                :disabled="searchParams.ONLY_VIEW"
              />
              <v-checkbox
                v-model="searchParams.EAR_RIGHT"
                :label="$t('우이')"
                true-value="Y" 
                false-value="N"
                class="mt-1 mr-4"
                :disabled="searchParams.ONLY_VIEW"
              />
              
            </div>
            <div class="d-flex mt-2">
              <i-select
                v-model="searchParams.INCIDENT_CODE"
                :label="$t('발생경위')"
                label-width="70px"
                :items="codeList.INCIDENT"
                item-value="COD"
                item-title="TXT"
                width="220px"
                :readonly="searchParams.ONLY_VIEW"
              />
              <i-input
                v-model="searchParams.INCIDENT_NM"
                :label="$t('')"
                label-width="10px"
                type="text"
                width="700px"
                maxlength="500"
                :readonly="searchParams.INCIDENT_CODE != '999' || searchParams.ONLY_VIEW"
              />
            </div>
          </v-sheet>
        </div>
        <v-sheet class="pa-4 pt-0 h-auto">
          <IUpload
            ref="fileUpload"
            :max-file-size="300"
            :button-list="searchParams.ONLY_VIEW ? [] : fileUploadButton"
            auto-upload
            :gridTitle="t('사실 통지서')"
            :is-visibled="!isEmpty(searchParams.EMP_NO)"
            style="height: 200px"
            :isCmpnyDiv="false"
          />
        </v-sheet>     
      </div>
    </v-card>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
  </v-dialog>
</template>

<style scoped lang="scss">
th {
  padding: 6px;
  border: 1px solid #ccc;
  background-color: #f4f5f9;
}

td {
  padding: 6px;
  font-weight: 400;
  border: 1px solid #ccc;
  text-align: center;
}

.no-click {
  pointer-events: none;
}
</style>
