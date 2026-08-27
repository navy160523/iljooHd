<!--
  화면명 : 유소견 명단  대상자추가 팝업
  화면개요 : 유소견 명단  대상자추가 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
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

// 조회조건
const searchParams = reactive({
  // 대상자정보
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  BIRTH_DAY: '', // 생일
  HLD_OFFI_GBN: '', // 재직구분
  BSNS_NM: '', // 사업부
  DEPT_NM: '', // 부서
  STD_DUTY_NM: '', // 직종
  COM_ENT_DATE: '', // 입사일자
  RETI_DATE: '', // 휴,퇴직일

  // 진단정보
  DISEASE_CODE: '', // 상병명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  EVAL_YEAR: '', // 판정년도
  EVAL_DATE: '', // 판정일
  EVAL_DIV: '', // 판정구분
  REMARK: '',

  SAVE_YN: ''
})

const codeList = reactive({
  HOSPITAL: [],
  EVALDIV: [],
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴사' },
    { COD: '4', TXT: '군입영' },
  ]
})

const getCode = (param) => {
  Promise.all([
    // 진단기관
    getCodeList('HHII820C'),
    // 판정구분
    getCodeList('HHII820J'),
    // 상병명
    getCodeList('HHII820FB'),
    getCodeList('HHII820FC'),
    getCodeList('HHII820FD'),
    getCodeList('HHII820FE'),
    getCodeList('HHII820FF'),
    getCodeList('HHII820FG'),
    getCodeList('HHII820FH'),
    getCodeList('HHII820FI'),
    getCodeList('HHII820FJ'),
  ]).then((res) => {
    codeList.HOSPITAL = res[0].ORESULT_CUR
    codeList.EVALDIV = res[1].ORESULT_CUR
    codeList.DISEASE1 = res[2].ORESULT_CUR
    codeList.DISEASE2 = res[3].ORESULT_CUR
    codeList.DISEASE3 = res[4].ORESULT_CUR
    codeList.DISEASE4 = res[5].ORESULT_CUR
    codeList.DISEASE5 = res[6].ORESULT_CUR
    codeList.DISEASE6 = res[7].ORESULT_CUR
    codeList.DISEASE7 = res[8].ORESULT_CUR
    codeList.DISEASE8 = res[9].ORESULT_CUR
    codeList.DISEASE9 = res[10].ORESULT_CUR

    codeList.DISEASE = [
      ...codeList.DISEASE1,
      ...codeList.DISEASE2,
      ...codeList.DISEASE3,
      ...codeList.DISEASE4,
      ...codeList.DISEASE5,
      ...codeList.DISEASE6,
      ...codeList.DISEASE7,
      ...codeList.DISEASE8,
      ...codeList.DISEASE9,
    ]

    insertName()
    if(!isEmpty(param)) {
      for (let key in param) {
        if (searchParams.hasOwnProperty(key)) {
          if(key === 'BIRTH_DAY' && !isEmpty(param.BIRTH_DAY)) {
            searchParams.BIRTH_DAY = dayjs(param.BIRTH_DAY).format('YYYY-MM-DD')
          } else if (key === 'COM_ENT_DATE' && !isEmpty(param.COM_ENT_DATE)) {
            searchParams.COM_ENT_DATE = dayjs(param.COM_ENT_DATE).format('YYYY-MM-DD')
          } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
            searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD')
          } else if (key === 'EVAL_DATE' && !isEmpty(param.EVAL_DATE)) {
            searchParams.EVAL_DATE = dayjs(param.EVAL_DATE).format('YYYY-MM-DD')
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
  })
}

// 팝업 OPEN
const openPopup = (param) => {
  getCode(param)
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') { 
    // 저장
    // if(!isEmpty(searchParams.NOTIFY_DATE)) {
    //   return Message.warn(t('사실통지가 된 건에 대해서는 수정이 불가능 합니다.')) 
    // }
    new saveFlowHelper(vm, t)
      .showToast(false)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopupNoSearch()
  } 
}

// 저장 전
const beforeSave = () => {
  // validation 체크
  if (isEmpty(searchParams.EMP_NO)) {
    return Message.warn(t('신청인 정보가 없습니다.'))
  } else if (isEmpty(searchParams.DISEASE_CODE)) {
    return Message.warn(t('상병명은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.HOSPITAL_CODE)) {
    return Message.warn(t('진단기관은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.EVAL_DATE)) {
    return Message.warn(t('판정일은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.EVAL_DIV)) {
    return Message.warn(t('판정구분은 필수 입력입니다.'))
  } 

  return true
}

// 저장
const saveData = async () => {
  let saveParam = _.cloneDeep(searchParams)
  saveParam.EVAL_DATE = searchParams.EVAL_DATE.replaceAll('-', '')  

  return commonExecuteApi({ queryId : 'HLTJC0010_SAVE_01', list: [saveParam] })
}

const afterSaveData = (res) => {
  if(!isEmpty(res)) {
    Message.success(t('성공적으로 저장되었습니다'))
    closePopup()
    searchParams.SAVE_YN = 'Y'
  }
}

const clearParam = () => {
  for (let key in searchParams) {
    if (searchParams.hasOwnProperty(key)) {
      searchParams[key] = ''
    }
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')

  clearParam()

  dialog.value = false
}
// 닫기후 재조회 안함
const closePopupNoSearch = () => {
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
  searchParams.STD_DUTY_NM = val.STD_DUTY_NM
  searchParams.COM_ENT_DATE = val.COM_ENT_DATE
  // searchParams.RETI_DATE = val.RETI_DATE
  if (searchParams.HLD_OFFI_GBN == '퇴사') {
    searchParams.RETI_DATE = dayjs(val.RETI_TMP_DATE).format('YYYY-MM-DD')
  } else {
    searchParams.RETI_DATE = dayjs(val.TMP_RST_DATE).format('YYYY-MM-DD')
  }
}

// 인원 검색
const openEmpPopup = () => {
  empPopup.value.openPopup({ EMP_NM: searchParams.EMP_NM })
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
  searchParams.HOSPITAL_NM = findName(codeList.HOSPITAL, searchParams.HOSPITAL_CODE, searchParams.HOSPITAL_NM)
}

watch(() => searchParams.HOSPITAL_CODE, (newValue, oldValue) => {
  insertName()
})

watch(() => searchParams.EVAL_DATE,
  (newValue, oldValue) => {
    if (newValue) {
      const year = newValue.split('-')[0];
      searchParams.EVAL_YEAR = year;
    } else {
      searchParams.EVAL_YEAR = null;
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
    width="1200"
    height="600"
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
      <span>유소견자 등록</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="t('신청자 정보')"
          :use-permission="false"
          :button-list="['btnUpdate','btnClose']"
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
              :readonly="true"
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
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.STD_DUTY_NM"
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
              :readonly="true"
            />
            <i-input
              v-model="searchParams.RETI_DATE"
              :label="$t('휴/퇴직일')"
              label-width="70px"
              type="date"
              width="220px"
              :readonly="true"
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
                v-model="searchParams.DISEASE_CODE"
                :label="$t('상병명')"
                label-width="70px"
                :items="codeList.DISEASE"
                item-value="COD"
                item-title="TXT"
                :readonly="searchParams.SAVE_YN === 'Y'"
                width="220px"
                required
              /><i-select
                v-model="searchParams.HOSPITAL_CODE"
                :label="$t('진단기관')"
                label-width="70px"
                :items="codeList.HOSPITAL"
                item-value="COD"
                item-title="TXT"
                :readonly="searchParams.SAVE_YN === 'Y'"
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
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="searchParams.EVAL_YEAR"
                :label="$t('판정년도')"
                label-width="70px"
                type="text"
                width="220px"
                readonly
              />
              <i-input
                v-model="searchParams.EVAL_DATE"
                :label="$t('판정일')"
                label-width="70px"
                type="date"
                width="220px"
                :readonly="searchParams.SAVE_YN === 'Y'"
                required
              />
              <i-select
                v-model="searchParams.EVAL_DIV"
                :label="$t('판정구분')"
                label-width="70px"
                :items="codeList.EVALDIV"
                item-value="COD"
                item-title="TXT"
                :readonly="searchParams.SAVE_YN === 'Y'"
                width="220px"
                required
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="searchParams.REMARK"
                :label="$t('비고')"
                label-width="70px"
                type="text"
                width="700px"
                maxlength="500"
                :readonly="searchParams.SAVE_YN === 'Y'"
              />
            </div>
          </v-sheet>
        </div>
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