<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import EmpPopup from '@/components/popup/EmpPopup.vue'
const dialog = ref(null)
const empPopup = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['Saved'])
const safeCloverManageField = reactive({
  CMPNY_DIV: '', //사업장구분
  YEAR: '', //년도
  REQ_CHA: '', //신청시기
  EMP_NO: '', //사번
  EMP_NM: '', //성명
  BSNS_CD: '', //사업부코드
  DEPT_CD: '', //부서코드
  ASGN_NM: '', //조직이름
  ASGN_CD: '', //조직코드
  INITIAL_YN: '', //초도지급여부
  REMARKS: '', //비고
  SAVE_YN: '', //저장여부
})

const readOnlyValue = reactive({
  YEAR: '',
  REQ_CHA: '',
  EMP_NM: '',
})

const codeList = reactive({
  REQ_CHA: [], //신청시기
})

const initCodeList = () => {
  Promise.all([getCodeList('HHIT050')]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR
  })
}

const openPopup = () => {
  dialog.value = true
  //추가버튼 클릭시 readonly 해제
  for (let i in readOnlyValue) {
    readOnlyValue[i] = false
  }
}

const closePopup = () => {
  dialog.value = false
  //팝업닫을때 데이터 초기화
  for (let i in safeCloverManageField) {
    safeCloverManageField[i] = ''
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  } else {
    closePopup()
  }
}

const beforeSave = () => {
  if (!safeCloverManageField.YEAR) {
    Message.warn(t('년도는 필수값 입니다.'))
    return false
  } else if (!safeCloverManageField.REQ_CHA) {
    Message.warn(t('신청시기는 필수값 입니다.'))
    return false
  } else if (!safeCloverManageField.EMP_NO) {
    Message.warn(t('인원은 필수값 입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: safeCloverManageField.YEAR,
    REQ_CHA: safeCloverManageField.REQ_CHA,
    BSNS_CD: safeCloverManageField.BSNS_CD,
    DEPT_CD: safeCloverManageField.DEPT_CD,
    ASGN_CD: safeCloverManageField.ASGN_CD,
    EMP_NO: safeCloverManageField.EMP_NO,
    INITIAL_YN: safeCloverManageField.INITIAL_YN,
    REMARKS: safeCloverManageField.REMARKS,
    USER_ID: userStore.userId,
    SAVE_YN: !safeCloverManageField.SAVE_YN ? 'N' : safeCloverManageField.SAVE_YN,
  }
  saveParam.push(saveData)
  // return commonExecuteApi({
  //   queryId: 'CLDAD0010_SAVE_02',
  //   list: saveParam,
  // })
  //SAVE_YN이 없으면 저장 있으면 수정(비고만 수정가능)
  if (!safeCloverManageField.SAVE_YN) {
    return commonExecuteApi({
      queryId: 'CLDAD0010_SAVE_01',
      list: saveParam,
    })
  } else {
    return commonExecuteApi({
      queryId: 'CLDAD0010_SAVE_02',
      list: saveParam,
    })
  }
}

const afterSave = () => {
  emit('Saved')
  closePopup()
}

const openEmpPopup = () => {
  empPopup.value.openPopup({
    EMP_NM: safeCloverManageField.EMP_NM,
    DISABLE: ['전체', '사내협력사', '단기공사'],
  })
}

const onEmpSelected = (val) => {
  safeCloverManageField.BSNS_CD = val.BSNS_CD
  safeCloverManageField.DEPT_CD = val.DEPT_CD
  safeCloverManageField.ASGN_CD = val.ASGN_CD
  safeCloverManageField.ASGN_NM = val.ASGN_NM
  safeCloverManageField.EMP_NO = val.EMP_NO
  safeCloverManageField.EMP_NM = val.EMP_NM
}

onMounted(() => {
  initCodeList()
})

const openPopup2 = (data) => {
  dialog.value = true
  safeCloverManageField.SAVE_YN = 'Y' //수정플래그값
  //행더블클릭시 readonly 설정
  for (let i in readOnlyValue) {
    readOnlyValue[i] = true
  }

  for (const [key, value] of Object.entries(data)) {
    if (safeCloverManageField.hasOwnProperty(key)) {
      safeCloverManageField[key] = value
    }
  }
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
      <span>SAFE클로버 피복관리 등록</span>
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
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="d-flex mt-2">
              <i-select
                :label="$t('년도')"
                width="100px"
                required
                top-label
                type="YEAR"
                v-model="safeCloverManageField.YEAR"
                :readonly="readOnlyValue.YEAR"
              >
              </i-select>
              <i-select
                :label="$t('신청시기')"
                width="150px"
                required
                top-label
                :items="codeList.REQ_CHA"
                item-title="TXT"
                item-value="COD"
                v-model="safeCloverManageField.REQ_CHA"
                :readonly="readOnlyValue.REQ_CHA"
              >
              </i-select>
            </div>
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
                v-model="safeCloverManageField.EMP_NM"
                :disabled="readOnlyValue.EMP_NM"
              >
              </i-input>
              <i-input :label="$t('사번')" width="150px" top-label readonly v-model="safeCloverManageField.EMP_NO">
              </i-input>
              <i-input :label="$t('소속')" width="250px" top-label readonly v-model="safeCloverManageField.ASGN_NM">
              </i-input>
            </div>
            <div class="mt-2">
              <i-textarea :label="$t('비고')" top-label width="100%" v-model="safeCloverManageField.REMARKS">
              </i-textarea>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
  </v-dialog>
</template>
