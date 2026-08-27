<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi, commonExecuteApi2  } from '@hiway/api/commonApi'
import ILabel from "@/components/ILabel.vue"
import dayjs from "dayjs"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import CurriculumPopup from '@/components/popup/CurriculumPopup.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import { useLogsStore } from "@hiway/stores/logs"

//******************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const deleteYnDialog = ref(false)
const grdDetail = ref(null)   //담당 가능 과목 그리드
const grdDetail2 = ref(null)  //강의 이력 그리드
const empPopup = ref(null) // 강사 조회 POP
const curriculumPopup = ref(null) // 강의 조회 POP
const currBtnTitle = ref(null)
const scrollDirection = ref(0)
const waiting = ref(false)
const scrollTrace = ref(0)
let CREATE_YN = ''
let checkedMobile = 'Y'
let checkedEmail = 'Y'
const emit = defineEmits(['saved'])
var saveDataList = []


//******************************세팅 영역(종료)***************************************************/

let myText=''

//*****************************************오픈 팝업********************************************/
const openPopup =  (data) => {
  dialog.value = true 
  console.log(data.divPrint)

  let buttons = data.divPrint.getElementsByTagName('button')
  
  console.log(buttons)

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].style.display = 'none'
  }
  
  myText = data.divPrint.innerHTML
}

//****************************************오픈 팝업(종료)************************************************/

//###########################################이벤트 영역##################################################/
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnClose') {

    dialog.value = false
  }
}

//########################################이벤트 영역(종료)################################################/


//*****************************************조회 영역 *****************************************//
//*****************************************조회 영역(종료)*****************************************//

//*****************************************저장 영역********************************************//
//*****************************************저장 영역(종료)********************************************//

//*****************************************삭제 영역************************************************//
//*****************************************삭제 영역(종료)************************************************//

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="100%"
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <VContainer style="background-color: white;">
      <VRow>
        <VCol>
          <IGridTitle
            :use-permission="false"
            :button-list="['btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <VRow>
        <div v-html='myText' style="width:100%"></div>
        <!-- <div v-html='myText'></div>
        <div class="app-html"></div> -->
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

