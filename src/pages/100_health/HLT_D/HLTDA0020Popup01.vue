<!--
  화면명 : 부서 화학물질 상세
  화면개요 : 화학물질 상세 정보를 관리한다.
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import ILabel from "@/components/ILabel.vue"
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import HLTDA0020Popup02 from '@/pages/100_health/HLT_D/HLTDA0020Popup02.vue'
import HLTDA0020Popup05 from '@/pages/100_health/HLT_D/HLTDA0020Popup05.vue'
import HLTDA0050Popup01 from '@/pages/100_health/HLT_D/HLTDA0050Popup01.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const visibleGubun = ref(false)
const hltda0020Popup02 = ref(null) // 경보표지
const hltda0020Popup05 = ref(null) // 사용팀 관리
const hltda0050Popup01 = ref(null) // 유해성 평가 결과
const changeYn = ref('N')
const isAdmin = ref(0)

const extinfoColor = ref({
  '관리': '#DAA520',
  '허용': '#DAA520',
  '특별': '#800080',
  '유독': '#800080',
  '제한': '#800080',
  '사고': '#800080',
  '금지': '#FF0000'
})

// 코드리스트
const codeList = reactive({
  TEAM_CD: []
})

/* 복사 조건 */
const searchParams = reactive({
  CMPNY_DIV: '',
  SAUPBU: '',
  DEPT_CD: '',
  DEPT_NM: '',
  TEAM_CD: '',
  TYPE_ID: '',
  MSDS_NM: '',
  MATNO: '',
  VNDCOD: '',
  VNDNME: '',
  RECDATE: '',
  EXPENSE: '',
  REMARK: '',
  MATDSC: '',
  TEL: '',
  EDT_STUS: '',
  EXTINFO: ''
})

const openPopup = (param, pIsAdmin) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.SAUPBU = param.SAUPBU
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.DEPT_NM = param.DEPT_NM
  searchParams.TEAM_CD = param.TEAM_CD
  searchParams.MATNO = param.MATNO
  searchParams.MATDSC = param.MATDSC
  searchParams.MSDS_NM = param.MSDS_NM
  searchParams.VNDCOD = param.VNDCOD
  searchParams.VNDNME = param.VNDNME
  searchParams.RECDATE = dayjs(param.RECDATE).format('YYYY-MM-DD')
  searchParams.EXPENSE = param.EXPENSE
  searchParams.REMARK = param.REMARK
  searchParams.EXTINFO = param.EXTINFO ? param.EXTINFO.split(',').map(s => s.trim()) : [];
  searchParams.TEL = param.TEL
  searchParams.EDT_STUS = param.EDT_STUS

  changeYn.value = 'N'
  isAdmin.value = pIsAdmin

  Promise.all([
    commonSearchApi({ queryId: 'HLTDA0020_SEARCH_TEAM', param: searchParams }),
  ]).then((res) => {
    codeList.TEAM_CD = res[0].ORESULT_CUR
  })

  dialog.value = true
}


// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnHazardEvaluation') {
    hltda0050Popup01.value.openPopup(searchParams)
  } else if (btn.id === 'btnTeamUpdate') {
    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }

    changeYn.value = 'Y'
    hltda0020Popup05.value.openPopup(searchParams)
  } else if (btn.id === 'btnAlarmSignUpdate') {
    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }

    if(searchParams.EDT_STUS == '9') {
      vm.$swal({ 
        title: t('경고 표지를 수정하시겠습니까?'), 
        showCancelButton: true,
        }).then(ck => {
          if (ck.isConfirmed === true) {
            changeYn.value = 'Y'
            hltda0020Popup02.value.openPopup(searchParams)
          }
      })
    } else {
      vm.$swal({ 
        title: t('경고 표지를 작성하시겠습니까?'), 
        showCancelButton: true,
        }).then(ck => {
          if (ck.isConfirmed === true) {
            changeYn.value = 'Y'
            hltda0020Popup02.value.openPopup(searchParams)
          }
      })
    }
  } else if (btn.id === 'btnUpdate') {
    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }
    
    // 사용팀을 변경하지 않았다면 바로 저장
    if(searchParams.OLD_TEAM_CD == searchParams.TEAM_CD) {
      new saveFlowHelper(vm, t) 
        .setQuery(saveData)
        .setAfter(afterSaveData)
        .run()
    } else { // 사용팀을 변경했으면 해당 사용팀이 중복인지 확인하고 저장
      new saveFlowHelper(vm, t) 
        .setQuery(saveData)
        .setAfter(afterSaveData)
        .run()
    }
   
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

/* ********** 저장 ********** */
const saveData = () => {
  return commonExecuteApi({ queryId : 'HLTDA0020_SAVE_02', list: [searchParams] })
}

// 저장 후 작업
const afterSaveData = () => { 
  Message.success(t('성공적으로 저장되었습니다'))
  changeYn.value = 'Y'
  closePopup()
}

// 사용팀 수정 
const onTeamSelected = teamList => {
  let saveParams = []
  for(let team of teamList) {
    let saveDt = {
      ...searchParams,
      ...team,
      NEW_YN: ''
    }
    saveParams.push(saveDt)
  }
  commonExecuteApi({ queryId : 'HLTDA0020_SAVE_02', list: saveParams }).then(() => {
    Message.success(t('성공적으로 수정되었습니다'))
    changeYn.value = 'Y'
  })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search', changeYn.value)
  visibleGubun.value = false
  dialog.value = false 
}

const setExtColor = (str) => {
  if(str in extinfoColor.value) {
    return extinfoColor.value[str]
  } else {
    return '#222'
  }
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="600"
    height="500"
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
      <span>화학물질 상세</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnHazardEvaluation', 'btnTeamUpdate', 'btnAlarmSignUpdate', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex mb-2">
            <i-input
              v-model="searchParams.MATNO"
              label-width="80px"
              :label="$t('자재번호')"
              :readonly="true"
              width="520px"
              class="mr-2"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input
              v-model="searchParams.MATDSC"
              :label="$t('제품명')"
              label-width="80px"
              :readonly="true"
              width="520px"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input
              v-model="searchParams.MSDS_NM"
              :label="$t('MSDS명')"
              label-width="80px"
              :readonly="true"
              width="520px"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input
              v-model="searchParams.RECDATE"
              label-width="80px"
              :label="$t('최근입고일자')"
              type="date"
              :readonly="true"
              width="250px"
              class="mr-2"
            />
            <i-input
              v-model="searchParams.EXPENSE"
              :label="$t('용도')"
              label-width="50px"
              width="250px"
              class="ml-3"
            /> 
          </div> 
          <div class="d-flex mb-2">
            <ILabel class="pl-0" :label="$t('규제 정보')"></ILabel>
            <div class="d-flex show-text">
              <div v-for="(s, i) in searchParams.EXTINFO" :key="i"
                v-html="s + '&nbsp;'"
                :style="{color: setExtColor(s)}"
              >
              </div>
            </div>
            <!-- <i-input
              v-model="searchParams.EXTINFO"
              :label="$t('규제 정보')"
              label-width="80px"
              width="520px"
            /> -->
          </div>
        </v-sheet>
      </div>
      <!-- 팝업 -->
      <HLTDA0020Popup02 ref="hltda0020Popup02"/>
      <HLTDA0020Popup05 ref="hltda0020Popup05" @select-team="onTeamSelected"/>
      <HLTDA0050Popup01 ref="hltda0050Popup01" />
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.show-text {
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #fff;
  padding: 5px;
  font-size: 15px;
  padding-left: 10px;
  padding-right: 10px;
  height: 32px;
  width: 432px;
}
</style>
