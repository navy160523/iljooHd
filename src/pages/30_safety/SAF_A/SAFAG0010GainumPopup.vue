<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 산재정보 등록/현황  가입번호 입력팝업-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { value } from 'lodash-es'
import queryFlowHelper from '@/utils/searchFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { useUserStore } from '@hiway/stores/user'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const dialog = ref(false)
const grdPopUp = ref(null)
const popEmp = ref()
const empPopup = ref(null)
const codeList = reactive({
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴직' },
    { COD: '4', TXT: '입대' },
  ],
})
const userStore = useUserStore() //유저정보

// 데이터 바인딩

const MainSearchParams = reactive({})

const SaveData = reactive({})

//팝업 오픈

const intCode = (popupParam) => {
  Promise.all([
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_04',
      param: { CMPNY_DIV: popupParam.CMPNY_DIV },
    }),
  ]).then((res) => {
    console.log(res[0].ORESULT_CUR, 'res[0].ORESULT_CUR')
    codeList.GAINUM = res[0].ORESULT_CUR
  })
}

//오픈팝업

const openPopup = (popupParam) => {
  SaveData.param = popupParam
  SaveData.param.GAINUM = ''
  intCode(popupParam)
  dialog.value = true
}

// 그리드 데이터입력

const mainCheck = () => {
  if (SaveData.param.GAINUM == '') {
    Message.warn(t('가입번호를 입력해주십시오'))

    return false
  } else {
    return true
  }
}

const mainSaveData = () => {
  let param = [
    {
      CMPNY_DIV: SaveData.param.CMPNY_DIV,
      SANNO: SaveData.param.SANNO,
      REQGBN: SaveData.param.REQGBN,
      YOGBN: SaveData.param.YOGBN,
      SANGBN: 'A',
      SAGONO: SaveData.param.SAGONO,
      EMPLNO: SaveData.param.EMP_NO,
      FILENUM: SaveData.param.FILENUM,
      GAINUM: '01',
      OCCURDATE: SaveData.param.OCCURDATE,
      OCCURTIME: SaveData.param.OCCURTIME,
      SAGOTYPE: SaveData.param.SAGOTYPE,
      INJURYTYPE: SaveData.param.INJURYTYPE,
      INJURYPART: SaveData.param.INJURYPART,
      REQDTE: SaveData.param.REQDTE,
      REQEMP: SaveData.param.REQEMP,
      SANOK: SaveData.param.SANOK,
      OKDTE: SaveData.param.OKDTE,
      HUDTE: SaveData.param.HUDTE,
      BOKDTE: SaveData.param.BOKDTE,
      ENDDTE: SaveData.param.ENDDTE,
      GRADE: SaveData.param.GRADE,
      GRADEDTE: SaveData.param.GRADEDTE,
      HAPDTE: SaveData.param.HAPDTE,
      HAPAMT: SaveData.param.HAPAMT,
      SALARY: SaveData.param.SALARY,
      SALARYDTE: SaveData.param.SALARYDTE,
      TARGETDTE: SaveData.param.TARGETDTE,
      TELNO1: SaveData.param.TELNO1,
      TELNO2: SaveData.param.TELNO2,
      TELGBN: SaveData.param.TELGBN,
      ORGBELNR: SaveData.param.ORGBELNR,
      ORGBELNRDTE: SaveData.param.ORGBELNRDTE,
      BANK: SaveData.param.BANK,
      APPROVEDTE: SaveData.param.APPROVEDTE,
      INGAMDTE: SaveData.param.INGAMDTE,
      RECEIPTDTE: SaveData.param.RECEIPTDTE,
      HAP_STATUS: SaveData.param.HAP_STATUS,
      HAPBIGO: SaveData.param.HAPBIGO,
      FILE_ID: SaveData.param.FILE_ID,
      STATUS: 'A',
      SANGBYUNG: SaveData.param.SANGBYUNG,
      SAGOLOC: SaveData.param.SAGOLOC,
      SAGOGAEYO: SaveData.param.SAGOGAEYO,
      BIGO: SaveData.param.BIGO,
      ADD_DESC: SaveData.param.ADD_DESC,
      SJE_TYPE_CD: SaveData.param.SJE_TYPE_CD,
      SEND_YN: SaveData.param.SEND_YN,
      SAVE_YN: SaveData.param.SAVE_YN,
      USER_ID: userStore.userId,
      IP_ADDRESS: SaveData.param.IP_ADDRESS,
      P_SANNO: SaveData.param.P_SANNO,
      SAGO_CMPNY_DIV: SaveData.param.SAGO_CMPNY_DIV,
      SALARY_CORRECT_YN: SaveData.param.SALARY_CORRECT_YN,
    },
  ]

  return commonExecuteApi({ queryId: 'SAFAG0010_SAVE_01', list: param })
}

//

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(mainSaveData)
      .setAfter(() => {
        onButtonsClick('btnClose'), upDataRow()
      })
      .run()
  } else if (btn === 'btnClose') {
    dialog.value = false
  }
}

const upDataRow = () => {
  SaveData.param = []
  emit('upDataRow', 'upDataRow')
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="400"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">가입번호 입력창</div>
    <VContainer style="background-color: white">
      <!-- 최상단 -->
      <VRow class="my-1">
        <VCol cols="12">
          <v-select
            label="가입번호"
            v-model="SaveData.param.GAINUM"
            :items="codeList.GAINUM"
            item-value="COD"
            item-title="TXT"
          />
        </VCol>

        <VCol class="mt-2" style="display: flex; justify-content: flex-end">
          <v-btn class="mr-2" @click="onButtonsClick('btnUpdate')">
            저장
          </v-btn>
          <v-btn @click="onButtonsClick('btnClose')"> 닫기 </v-btn>
        </VCol>
      </VRow>
    </VContainer>
  </VDialog>
</template>
<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
