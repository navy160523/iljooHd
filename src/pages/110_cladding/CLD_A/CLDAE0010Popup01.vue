<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import saveFlowHelper from '@/utils/saveFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const menuTitle = ref(null)
const userStore = useUserStore()
const userLogStore = useLogsStore()
const empPopup = ref(null)
const dialog = ref(null)
const emit = defineEmits(['Saved'])

const compulsoryTargetManagementField = reactive({
  CMPNY_DIV: '', //사업장구분
  EMP_NM: '', //성명
  YEAR: '', //년도
  REQ_CHA: '', //신청시기
  DUTY_YN: 'Y', //대상여부
  CLOTHE_GUBUN: '', //피복종류
  ASGN_NM: '', //소속
  EMP_NO: '', //사번
  OFFI_RES_NM: '', //직책
  OFFI_RES_DATE: '', //직책보임일
  REMARKS: '', //비고
  USER_DIV: '', //조직구분(직영,협력사)
  BSNS_CD: '', //사업부코드
  DEPT_CD: '', //부서코드
  ASGN_CD: '', //조직코드
  INITIAL_YN: '', //초도지급여부
  SAVE_YN: '', //수정플래그값
})

const codeList = reactive({
  REQ_CHA: [], //신청시기
  CLOTHE_GUBUN: [], //피복종류
  DUTY_YN: [
    {
      TXT: 'Y',
      COD: 'Y',
    },
    { TXT: 'N', COD: 'N' },
  ], //대상여부
})

const readOnlyValue = reactive({
  EMP_NM: false,
  YEAR: false,
  REQ_CHA: false,
  CLOTHE_GUBUN: false,
})

const initCodeList = () => {
  Promise.all([getCodeList('HHIT050'), getCodeList('HHIT010')]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR
    codeList.CLOTHE_GUBUN = res[1].ORESULT_CUR.filter((x) => !['4'].includes(x.COD))
  })
}

const openPopup = () => {
  dialog.value = true
}

const openPopup2 = (data) => {
  dialog.value = true
  compulsoryTargetManagementField.SAVE_YN = 'Y'
  for (const [key, value] of Object.entries(data)) {
    if (compulsoryTargetManagementField.hasOwnProperty(key)) {
      compulsoryTargetManagementField[key] = value
    }
  }
  //수정시 컴포넌트 readonly true로 변경
  for (let i in readOnlyValue) {
    readOnlyValue[i] = true
  }
}

const closePopup = () => {
  dialog.value = false
  for (let i in compulsoryTargetManagementField) {
    compulsoryTargetManagementField[i] = ''
  }
  //컴포넌트 readonly false 로 변경
  for (let i in readOnlyValue) {
    readOnlyValue[i] = false
  }
  emit('Saved')
}

onMounted(() => {
  initCodeList()
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  } else {
    closePopup()
  }
}

//저장관련 로직 시작
const beforeSave = () => {
  //필수값 체크
  if (!compulsoryTargetManagementField.EMP_NO) {
    Message.warn(t('인원은 필수값 입니다.'))
    return false
  } else if (!compulsoryTargetManagementField.YEAR) {
    Message.warn(t('년도는 필수값 입니다.'))
    return false
  } else if (!compulsoryTargetManagementField.REQ_CHA) {
    Message.warn(t('신청시기는 필수값 입니다.'))
    return false
  } else if (!compulsoryTargetManagementField.CLOTHE_GUBUN) {
    Message.warn(t('피복종류는 필수값 입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
    EMP_NO: compulsoryTargetManagementField.EMP_NO, //사번
    YEAR: compulsoryTargetManagementField.YEAR, //년도
    REQ_CHA: compulsoryTargetManagementField.REQ_CHA, //신청시기
    DUTY_YN: compulsoryTargetManagementField.DUTY_YN, //대상여부
    USER_DIV: compulsoryTargetManagementField.USER_DIV, //조직구분
    BSNS_CD: compulsoryTargetManagementField.BSNS_CD, //사업부코드
    DEPT_CD: compulsoryTargetManagementField.DEPT_CD, //부서코드
    ASGN_CD: compulsoryTargetManagementField.ASGN_CD, //조직코드
    INITIAL_YN: compulsoryTargetManagementField.INITIAL_YN, //초도지급여부
    CLOTHE_GUBUN: compulsoryTargetManagementField.CLOTHE_GUBUN, //피복종류
    REMARKS: compulsoryTargetManagementField.REMARKS, //비고
    USER_ID: userStore.userId, //로그인유저 아이디
    SAVE_YN: !compulsoryTargetManagementField.SAVE_YN ? 'N' : compulsoryTargetManagementField.SAVE_YN,
  }
  saveParam.push(saveData)
  if (!compulsoryTargetManagementField.SAVE_YN) {
    return commonExecuteApi({
      queryId: 'CLDAE0010_SAVE_01',
      list: saveParam,
    })
  } else {
    return commonExecuteApi({
      queryId: 'CLDAE0010_SAVE_02',
      list: saveParam,
    })
  }
}

const afterSave = () => {
  closePopup()
}
//저장관련 로직 끝

//인원팝업 오픈 이벤트
const openEmpPopup = () => {
  empPopup.value.openPopup({
    EMP_NM: compulsoryTargetManagementField.EMP_NM,
  })
}

//인원팝업 선택 이벤트
const onEmpSelected = (val) => {
  compulsoryTargetManagementField.BSNS_CD = val.BSNS_CD //사업부코드
  compulsoryTargetManagementField.DEPT_CD = val.DEPT_CD //부서코드
  compulsoryTargetManagementField.ASGN_CD = val.ASGN_CD //조직코드
  compulsoryTargetManagementField.ASGN_NM = val.ASGN_NM //소속이름
  compulsoryTargetManagementField.EMP_NO = val.EMP_NO //사번
  compulsoryTargetManagementField.EMP_NM = val.EMP_NM //성명
  compulsoryTargetManagementField.USER_DIV = val.USER_DIV //직영,협력사
  compulsoryTargetManagementField.OFFI_RES_NM = val.OFFI_RES_NM //직책
  compulsoryTargetManagementField.OFFI_RES_DATE = val.OFFI_RES_DATE //직책보임일자
}

defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>강제대상 관리 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnUpdate', //저장
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="d-flex mt-2">
              <i-input
                :label="$t('인원검색')"
                @click:appendInner="openEmpPopup('')"
                @keydown.enter="
                  (e) => {
                    openEmpPopup('')
                  }
                "
                append-inner-icon="mdi-magnify"
                width="150px"
                top-label
                required
                v-model="compulsoryTargetManagementField.EMP_NM"
                :disabled="readOnlyValue.EMP_NM"
              >
              </i-input>
            </div>
            <div class="d-flex mt-2">
              <i-select
                :label="$t('년도')"
                width="100px"
                required
                top-label
                type="YEAR"
                v-model="compulsoryTargetManagementField.YEAR"
                :readonly="readOnlyValue.YEAR"
              >
              </i-select>
              <i-select
                :label="$t('신청시기')"
                width="150px"
                required
                top-label
                v-model="compulsoryTargetManagementField.REQ_CHA"
                :items="codeList.REQ_CHA"
                item-title="TXT"
                item-value="COD"
                :readonly="readOnlyValue.REQ_CHA"
              >
              </i-select>
              <i-select
                :label="$t('피복종류')"
                width="200px"
                required
                top-label
                v-model="compulsoryTargetManagementField.CLOTHE_GUBUN"
                :items="codeList.CLOTHE_GUBUN"
                item-title="TXT"
                item-value="COD"
                :readonly="readOnlyValue.CLOTHE_GUBUN"
              >
              </i-select>
              <i-select
                :label="$t('대상여부')"
                width="100px"
                required
                top-label
                v-model="compulsoryTargetManagementField.DUTY_YN"
                :items="codeList.DUTY_YN"
                item-title="TXT"
                item-value="COD"
              >
              </i-select>
            </div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('소속')"
                v-model="compulsoryTargetManagementField.ASGN_NM"
                width="350px"
                top-label
                readonly
              />
              <i-input
                :label="$t('사번')"
                v-model="compulsoryTargetManagementField.EMP_NO"
                width="120px"
                top-label
                readonly
              />
              <i-input
                :label="$t('직책')"
                v-model="compulsoryTargetManagementField.OFFI_RES_NM"
                width="120px"
                top-label
                readonly
              />
              <i-input
                :label="$t('직책보임일자')"
                width="120px"
                top-label
                readonly
                v-model="compulsoryTargetManagementField.OFFI_RES_DATE"
              />
            </div>
            <div class="mt-2">
              <i-textarea :label="$t('비고')" top-label width="100%" v-model="compulsoryTargetManagementField.REMARKS">
              </i-textarea>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
  </v-dialog>
</template>

<style scoped lang="scss"></style>
