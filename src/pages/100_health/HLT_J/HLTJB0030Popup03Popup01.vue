<!--
  화면명 : 난청 보험가입자 의견서
  화면개요 : 난청 보험가입자 의견서
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { useRoute } from "vue-router"
import { useCommonStore } from "@hiway/stores/common"
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest2, commonSendApi } from '@hiway/api/commonApi'
import { commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const content = ref(null)
const route = useRoute()
const commonStore = useCommonStore()

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  BIRTH_DAY: '', // 생일
  HLD_OFFI_GBN: '', // 재직구분
  BSNS_NM: '', // 사업부
  DEPT_NM: '', // 부서
  ASGN_NM: '', // 과
  STD_DUTY_NM: '', // 직종(상세분류중 중간)
  UNT_DUTY_NM: '', // 직종(상세분류중 마지막)
  COM_ENT_DATE: '', // 입사일자
  RETI_DATE: '', // 휴,퇴직일
  APPLI_GUBUN: '', // 신청구분
  APPLI_GUBUN_NM: '', // 신청구분명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  BODY1_CODE: '', // 신체부위1
  BODY1_NM: '', //신체부위1 명
  BODY2_CODE: '', // 신체부위2
  BODY2_NM: '', //신체부위2 명
  DIAGNOSIS_DATE: '', // 진단일
  DISEASE_CODE: '', // 상병코드 (PK)
  DISEASE_NM: '', // 상병명
  APPLI_DATE: '', // 진정일(pk)
  INCIDENT_CODE: '', // 발생경위 코드
  INCIDENT_NM: '', // 발생경위
  NOTIFY_FILE_ID: '', // 사실통지서
  WORK_STANDARD_NM: '', // 작업표준(담당업무)
  SEX: '', // 성별
  WORK_EVAL: '',
  WORK_YEAR: '',
  SAVE_YN: '',
  NATION: '',
  START_TIME: '', // 출근
  FINISH_TIME: '', // 퇴근
  WORK_START_TIME: '', // 작업개시시간
  EMP_STATUS: '0',  // 종사상 지위
  EMP_DIV: '0',    // 고용형태
  IS_BUSINESS: '0', // 사업주 여부
  IS_FAMILY: '0', // 친인척 여부
  MONEY: '',
  WORK_HISTORY: '',
  BUSINESS: '',
  INDUSTRIAL: '',
  ADMIT_YN: '',
  ADMIT_NO_WHY: '',
  FILE_ID: '',
})

// 팝업 OPEN
const openPopup = (param) => {
  for (let key in param) {
    if (searchParams.hasOwnProperty(key)) {
      if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
        searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYY-MM-DD')
      } else if (key === 'APPLI_DATE' && !isEmpty(param.APPLI_DATE)) {
        searchParams.APPLI_DATE = dayjs(param.APPLI_DATE).format('YYYYMMDD')
      } else if (key === 'BIRTH_DAY' && !isEmpty(param.BIRTH_DAY)) {
        searchParams.BIRTH_DAY = dayjs(param.BIRTH_DAY).format('YYYY-MM-DD')
      } else if (key === 'COM_ENT_DATE' && !isEmpty(param.COM_ENT_DATE)) {
        searchParams.COM_ENT_DATE = dayjs(param.COM_ENT_DATE).format('YYYY-MM-DD')
      } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
        searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD')
      } else if (key === 'WORK_STANDARD_NM' && !isEmpty(param.WORK_STANDARD_NM)) {
        searchParams.WORK_STANDARD_NM = param.WORK_STANDARD_NM.replaceAll('<br>', '\n')
      } else {
        searchParams[key] = param[key]
      }
    }
  } 
  searchParams.SAVE_YN = 'Y'

  // 작업력 평가가 해당이면 재해사실 인정 
  if(searchParams.WORK_EVAL == '해당') {
    searchParams.ADMIT_YN = 'Y'
  } else {
    searchParams.ADMIT_YN = null
  }

  let search = _.cloneDeep(searchParams)
  search.DIAGNOSIS_DATE = dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD')
  commonSearchApi({ queryId : 'HLTJB0030_SEARCH_04', param: search }).then(res => {
    
    if(isEmpty(res.ORESULT_CUR)) {
      searchParams.NATION = '대한민국'
      searchParams.START_TIME = '오전 8시'
      searchParams.FINISH_TIME = '오후 5시'
      searchParams.WORK_START_TIME = '오전 8시'
      searchParams.EMP_STATUS = '0'
      searchParams.EMP_DIV = '0'
      searchParams.IS_BUSINESS = '0'
      searchParams.IS_FAMILY = '0'
      searchParams.MONEY = '별도제출'
      searchParams.BUSINESS = '에이치디현대중공업 주식회사 대표이사'
      searchParams.INDUSTRIAL = '울산남부'
      searchParams.ADMIT_NO_WHY = ''

      if(searchParams.HLD_OFFI_GBN == '재직') {
        searchParams.WORK_HISTORY = '계속 근무'
      } else if(searchParams.HLD_OFFI_GBN == '휴직') {
        searchParams.WORK_HISTORY = searchParams.RETI_DATE + ' 이후 휴직'
      } else {
        searchParams.WORK_HISTORY = searchParams.RETI_DATE + ' 퇴직'
      }
    } else {
      searchParams.NATION = res.ORESULT_CUR[0].NATION
      searchParams.START_TIME = res.ORESULT_CUR[0].START_TIME
      searchParams.FINISH_TIME = res.ORESULT_CUR[0].FINISH_TIME
      searchParams.WORK_START_TIME = res.ORESULT_CUR[0].WORK_START_TIME
      searchParams.IS_BUSINESS = res.ORESULT_CUR[0].IS_BUSINESS
      searchParams.IS_FAMILY = res.ORESULT_CUR[0].IS_FAMILY
      searchParams.EMP_STATUS = res.ORESULT_CUR[0].EMP_STATUS
      searchParams.EMP_DIV = res.ORESULT_CUR[0].EMP_DIV
      searchParams.MONEY = res.ORESULT_CUR[0].MONEY
      searchParams.BUSINESS = res.ORESULT_CUR[0].BUSINESS
      searchParams.INDUSTRIAL = res.ORESULT_CUR[0].INDUSTRIAL
      searchParams.ADMIT_YN = res.ORESULT_CUR[0].ADMIT_YN
      searchParams.ADMIT_NO_WHY = res.ORESULT_CUR[0].ADMIT_NO_WHY
      searchParams.WORK_HISTORY = res.ORESULT_CUR[0].WORK_HISTORY
    }

    // 재해사실 인정 여부 '예'일 시 알림창
    if(searchParams.ADMIT_YN == 'Y') {
      vm.$swal({ title: t('신청인은 당사 자체 근골격계질환 작업력 평가 기준에 의거\n 신청상병과 해당 업무 사이에 상당인과관계가 있음이 확인되어\n 보험가입자의견서에 재해사실 "인정"으로 제출 예정이오니,\n 이견이 있을 경우, "불인정"선택 후 사유 기술 바랍니다. \n\n -안전보건지원부-') })
    }
  })
  
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    vm.$swal({ title: t('저장하시겠습니까?'), showCancelButton: true }).then(res => {

      if(isEmpty(searchParams.EMP_STATUS)) {
        Message.warn(t('종사상 지위는 필수 선택사항입니다.'))
        return
      }
      if(isEmpty(searchParams.EMP_DIV)) {
        Message.warn(t('고용형태는 필수 선택사항입니다.'))
        return
      }
      if(isEmpty(searchParams.IS_BUSINESS)) {
        Message.warn(t('사업주 여부는 필수 선택사항입니다.'))
        return
      }
      if(isEmpty(searchParams.IS_FAMILY)) {
        Message.warn(t('친인척 여부는 필수 선택사항입니다.'))
        return
      }

      if (res.isConfirmed) {
        searchParams.DIAGNOSIS_DATE = dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD')
        commonExecuteApi({ queryId : 'HLTJB0030_SAVE_03', list: [ searchParams ] }).then(res => {
          Message.info(t('저장되었습니다.'))
          closePopup()
        })
      }
    })
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')

  dialog.value = false
}

// 주민번호
const getHumanNumber = () => {
  if(isEmpty(searchParams.BIRTH_DAY)) return ''
  if(dayjs(searchParams.BIRTH_DAY).year() < 2000) {
    return dayjs(searchParams.BIRTH_DAY).format('YYYYMMDD').substring(2,8) + '-' + (searchParams.SEX == 'M' ? '1' : '2')
  } else {
    return dayjs(searchParams.BIRTH_DAY).format('YYYYMMDD').substring(2,8) + '-' + (searchParams.SEX == 'M' ? '3' : '4')
  } 
}

watch(() => searchParams.ADMIT_YN, (newValue, oldValue) => {
  if(newValue == 'Y') {
    searchParams.ADMIT_NO_WHY = ''
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
    height="950"
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
      <span>보험가입자 의견서 미리보기</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      
      <table class="pa-4" ref="content">
        <tbody>
            <tr>
                <td class="title-text1" colspan=7>보험가입자 의견서</td>
            </tr>
            <tr>
              <td class="left-cell title-text2">재해자 성명</td>
              <td> {{ searchParams.EMP_NM }} </td>
              <td class="title-text2">주민등록번호</td>
              <td class="text-left pl-2"> {{ getHumanNumber() }} </td>
              <td class="title-text2">재해발생일(최초 진단일)</td>
              <td colspan=2>{{ searchParams.DIAGNOSIS_DATE }} </td>
            </tr>
            <tr>
              <td class="left-cell title-text2" rowspan=11>보험가입자 의견</td>
              <td class="text-left" colspan=6>1. 신청인과 관련하여 아래 사항을 구체적으로 기재해주세요</td>
            </tr>
            <tr>    
              <td class="title-text3">채용일자</td>
              <td>{{ searchParams.COM_ENT_DATE }}</td>
              <td class="title-text3">국적</td>
              <td>
                <i-input
                  v-model="searchParams.NATION"
                  type="text"
                  width="150px"
                  maxlength="10"
                  class="cell-in-input"
                />
              </td>
              <td class="title-text3">직종</td>
              <td>{{ searchParams.STD_DUTY_NM }}</td>      
            </tr>
            <tr>
              <td class="title-text3">출근시간</td>
              <td>
                <i-input
                  v-model="searchParams.START_TIME"
                  type="text"
                  width="150px"
                  maxlength="10"
                  class="cell-in-input"
                />
              </td>
              <td class="title-text3">퇴근시간</td>
              <td>
                <i-input
                  v-model="searchParams.FINISH_TIME"
                  type="text"
                  width="150px"
                  maxlength="10"
                  class="cell-in-input"
                />
              </td>
              <td class="title-text3">작업개시기간</td>
              <td>
                <i-input
                  v-model="searchParams.WORK_START_TIME"
                  type="text"
                  width="150px"
                  maxlength="10"
                  class="cell-in-input"
                />
              </td>
            </tr>
            <tr>
              <td class="title-text3">종사상 지위</td>
              <td class="text-left pl-2">
                <v-radio-group
                  inline
                  style="width: 300px"
                  v-model="searchParams.EMP_STATUS"
                >
                  <v-radio label="상용" value="0" />
                  <v-radio label="임시" value="1" />
                  <v-radio label="일용" value="2" />
                </v-radio-group>                
              </td>
              <td class="title-text3">고용형태</td>
              <td colspan=3>
                <v-radio-group
                  inline
                  style="width: 300px"
                  v-model="searchParams.EMP_DIV"
                >
                  <v-radio label="정규직" value="0" />
                  <v-radio label="비정규직" value="1" />                
                </v-radio-group>
              </td>
            </tr>
            <tr>
              <td class="title-text3" rowspan=4>보험가입자(사업주)와의 관계</td>
              <td class="title-text3" rowspan=2>사업주 여부</td>
              <td colspan=4 class="text-left pl-2">
                <v-radio-group
                  inline
                  style="width: 300px"
                  v-model="searchParams.IS_BUSINESS"
                >
                  <v-radio label="해당없음" value="0" />
                </v-radio-group>
              </td>
            </tr>
            <tr>
              <td colspan=4 class="text-left pl-2">
                <v-radio-group
                  inline
                  style="width: 300px"
                  v-model="searchParams.IS_BUSINESS"
                >
                  <v-radio label="실제사업주(동업자포함)" value="1" />
                  <v-radio label="하수급사업주" value="2" />
                </v-radio-group>
              </td>
            </tr>
            <tr>
              <td class="title-text3" rowspan=2>친인척 여부</td>
              <td colspan=4 class="text-left pl-2">
                <v-radio-group
                  inline
                  style="width: 300px"
                  v-model="searchParams.IS_FAMILY"
                >
                  <v-radio label="해당없음" value="0" />
                </v-radio-group>
              </td>
            </tr>
            <tr>
              <td colspan=4 class="text-left pl-2">
                <v-radio-group
                  inline
                  style="width: 300px"
                  v-model="searchParams.IS_FAMILY"
                >
                  <v-radio label="배우자" value="1" />
                  <v-radio label="부모" value="2" />
                  <v-radio label="자녀" value="3" />
                  <v-radio label="형제자매" value="4" />
                  <v-radio label="기타친인척" value="5" />
                </v-radio-group>
              </td>
            </tr>
            <tr>
              <td class="title-text3">담당업무</td>
              <td colspan=2 class="text-left pl-2 text-box">{{ searchParams.UNT_DUTY_NM }}</td>
              <td class="title-text3">임금(월급,일급,시간급 등)</td>
              <td colspan=2 class="text-left pl-2">
                <i-input
                  v-model="searchParams.MONEY"
                  type="text"
                  width="150px"
                  maxlength="10"
                  class="cell-in-input"
                />
              </td>
            </tr>
            <tr>
              <td class="title-text3">재해발생 이후<br> 근무이력</td>
              <td colspan=5 class="text-left pl-2">
                <i-input
                  v-model="searchParams.WORK_HISTORY"
                  type="text"
                  width="300px"
                  maxlength="40"
                  class="cell-in-input"
                />
              </td>
            </tr>
            <tr>
              <td class="text-left" colspan=6>
                <div class="d-flex">
                  <p>2. 귀 사는 신청인의 재해 사실을 인정합니까? </p>
                  <v-radio-group
                    inline
                    style="width: 300px"
                    v-model="searchParams.ADMIT_YN"
                  >
                    <v-radio label="예" value="Y" />
                    <v-radio label="아니오" :value="null" />
                  </v-radio-group>
                </div>
                3. 위 2번 질문에서 인정하지 않는 경우에는 그 사유를 구체적으로 기재해주세요.<br>
                <i-textarea
                  v-model="searchParams.ADMIT_NO_WHY"
                  :readonly="searchParams.ADMIT_YN == 'Y'"
                  width="100%"
                />
              </td>
            </tr>
            <tr>
              <td colspan=7>
                위 기재한 사실이 틀림없음을 확인합니다.<br>
                {{ dayjs().format('YYYY년 MM월 DD일') }}<br>
                사업의 명칭: 에이치디현대중공업 주식회사<br>
                소재지: 울산광역시 동구 방어진순환도로 1000<br>
                사업주: <i-input
                  v-model="searchParams.BUSINESS"
                  type="text"
                  width="250px"
                  maxlength="40"
                  class="cell-in-input"
                /> (서명 또는 인)<br>
                전화번호: 052-202-5407<br>
                E-mail: 수신 메일 참조
              </td>
            </tr>
            <tr>
              <td colspan=7>근로복지공단 <i-input
                    v-model="searchParams.INDUSTRIAL"
                    type="text"
                    width="150px"
                    maxlength="10"
                    class="cell-in-input"
                  />지역본부(지사)장 귀하</td>
            </tr>
        </tbody>
      </table>  
    </v-card>
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
  width:180px;
}

.left-cell {
  width: 150px;
  font-weight: bold;
}
.title-text1 {
  font-weight: bold;
  font-size: 28px;
  background-color: #e4e4e4;
}
.title-text2 {
  font-weight: bold;
  font-size: 18px;
  background-color: #e4e4e4;
}
.title-text3 {
  font-weight: 500;
  font-size: 16px;
  background-color: #f0f0f0;
}
.cell-in-input {
  display: inline-block;
  vertical-align: middle;
}
.text-box {
  white-space: pre-line; /* 줄바꿈 적용 */
}
</style>
