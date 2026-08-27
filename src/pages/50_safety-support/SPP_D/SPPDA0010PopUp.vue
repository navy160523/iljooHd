<!-- SPPDB0010 위험기계기구 안전검사 / 위험기계 정보 일괄변경 -->
<!-- SI2팀 김성근 2024-04-09 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { before } from 'lodash-es'

defineOptions({
  name:'50_safety-support-SPP_D-SPPDA0010',
})

const userStore =  useUserStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const dialog = ref(false);
const empPopup = ref(null)
const deptPopUp = ref(null)
const gustar = ref('')
const DataInput = reactive({
  CMPNY_DIV:userStore.cmpnyDiv,
  DIV:'A'
})


const openPopup = (param) => {
  dialog.value = true;
}

const onButtonsClick = (btn)=>{
  if(btn.id ==='btnClose'){
    dialog.value = false;
  }
}
const onEmpSelected = (row)=>{
  if(gustar.value == 'Dbefore'){
    DataInput.EMP_NM_FR = row.EMP_NM 
    DataInput.EMP_NO_FR = row.EMP_NO 
    DataInput.CMPNY_DIV = row.CMPNY_DIV 
  }
  if(gustar.value == 'Dafter'){
    DataInput.EMP_NM_TO = row.EMP_NM 
    DataInput.EMP_NO_TO = row.EMP_NO 
    DataInput.CMPNY_DIV_TO = row.CMPNY_DIV 
  }
  
  console.log(row,'row')
}
const onDeptSelected =(row)=>{
  console.log(row)
  if(gustar.value == 'Gbefore'){
    DataInput.beforeASGN_FULL_NM = row.ASGN_FULL_NM 
    DataInput.CMPNY_DIV_FR = row.CMPNY_DIV 
    DataInput.DEPT_CD_FR = row.DEPT_CD 
    DataInput.ASGN_CD_FR = row.ASGN_CD 
    DataInput.ASGN_NM_FR = row.ASGN_SHRT_NM 

  }
  if(gustar.value == 'Gafter'){
    DataInput.afterASGN_FULL_NM = row.ASGN_FULL_NM 
    DataInput.CMPNY_DIV_TO = row.CMPNY_DIV 
    DataInput.DEPT_CD_TO = row.DEPT_CD 
    DataInput.ASGN_CD_TO = row.ASGN_CD 
    DataInput.ASGN_NM_TO = row.ASGN_SHRT_NM 
  }

  if(gustar.value == 'usebefore'){
    DataInput.usebeforeASGN_FULL_NM = row.ASGN_FULL_NM 
    DataInput.CMPNY_DIV_FR = row.CMPNY_DIV 
    DataInput.DEPT_CD_FR = row.DEPT_CD 
    DataInput.ASGN_CD_FR = row.ASGN_CD 
    DataInput.ASGN_NM_FR = row.ASGN_SHRT_NM 

  }
  if(gustar.value == 'useafter'){
    DataInput.useafterASGN_FULL_NM = row.ASGN_FULL_NM 
    DataInput.CMPNY_DIV_TO = row.CMPNY_DIV 
    DataInput.DEPT_CD_TO = row.DEPT_CD 
    DataInput.ASGN_CD_TO = row.ASGN_CD 
    DataInput.ASGN_NM_TO = row.ASGN_SHRT_NM 
  }
}
const open = (gubun,ab) =>{
  if(gubun === '관리부서'){
    deptPopUp.value.openPopup()
    if(ab ==='before'){
      gustar.value = 'Gbefore'
    }
    else{
      gustar.value = 'Gafter'
    }
  }
  if(gubun === '사용부서'){
    deptPopUp.value.openPopup()
    if(ab ==='before'){
      gustar.value = 'usebefore'
    }
    else{
      gustar.value = 'useafter'
    }
  }
  if(gubun === '담당자'){
    if(ab ==='Dbefore'){
      gustar.value = 'Dbefore'
      empPopup.value.openPopup({EMP_NM: DataInput.EMP_NM_FR})
    }
    else{
      gustar.value = 'Dafter'
      empPopup.value.openPopup({EMP_NM: DataInput.EMP_NM_TO})
    }
  }
}

const SaveData =(e)=>{
  let param = []
  if(e==='관리부서'){
    param.push(DataInput)
    if(!DataInput.beforeASGN_FULL_NM || !DataInput.afterASGN_FULL_NM){
      return Message.warn(t('변경전(후) 조직을 선택해주십시오.'))
    }
    if(gustar.value ==='usebefore' || gustar.value==='useafter'){
      return Message.warn(t('현재 사용부서를 수정중입니다 수정후 이용해주시기바랍니다.'))
    }
    vm.$swal({ 
    title: t(`관리부서를 ${DataInput.beforeASGN_FULL_NM}]에서 ${DataInput.afterASGN_FULL_NM}(으)로 
    \n변경합니다. 
    \n변경 된 데이터는 복구 불가능합니다.
    \n변경하시겠습니까?`), 
    showCancelButton: true,
  }).then(swalRes => {
    console.log(swalRes,'swalRes')
    if(swalRes.isConfirmed){
      commonExecuteApi({
      queryId : 'SPPDA0010_POPUP_SAVE_03',
      list:param,
    }).catch(err => {
      return Message.err(err)
    }).finally(() => {
      DataInput.beforeASGN_FULL_NM = ''
      DataInput.afterASGN_FULL_NM = ''
    })
    }
    else{
      return
    }
  })
  }

  if(e==='사용부서'){
    param.push(DataInput)
    if(!DataInput.usebeforeASGN_FULL_NM || !DataInput.useafterASGN_FULL_NM){
      return Message.warn(t('변경전(후) 조직을 선택해주십시오.'))
    }
    if(gustar.value ==='Gbefore' || gustar.value==='Gafter'){
      return Message.warn(t('현재 관리부서를 수정중입니다 수정후 이용해주시기바랍니다.'))
    }
    vm.$swal({ 
    title: t(`사용부서를 ${DataInput.usebeforeASGN_FULL_NM}]에서 ${DataInput.useafterASGN_FULL_NM}(으)로 
    \n변경합니다. 
    \n변경 된 데이터는 복구 불가능합니다.
    \n변경하시겠습니까?`), 
    showCancelButton: true,
  }).then(swalRes => {
    console.log(swalRes,'swalRes')
    if(swalRes.isConfirmed){
      commonExecuteApi({
      queryId : 'SPPDA0010_POPUP_SAVE_01',
      list:param,
    }).catch(err => {
      return Message.err(err)
    }).finally(() => {
      DataInput.usebeforeASGN_FULL_NM = ''
      DataInput.useafterASGN_FULL_NM = ''
    })
    }
    else{
      return
    }
  })
  }

  if(e==='담당자'){
    param.push(DataInput)
    if(!DataInput.EMP_NO_TO || !DataInput.EMP_NO_FR){
      return Message.warn(t('변경전(후) 사번을 선택해주십시오.'))
    }
    vm.$swal({ 
    title: t(`사용부서 담당자를 ${DataInput.EMP_NM_FR}]에서 ${DataInput.EMP_NM_TO}(으)로 
    \n변경합니다. 
    \n변경 된 데이터는 복구 불가능합니다.
    \n변경하시겠습니까?`), 
    showCancelButton: true,
  }).then(swalRes => {
    if(swalRes.isConfirmed){
      commonExecuteApi({
      queryId : 'SPPDA0010_POPUP_SAVE_02',
      list:param,
    }).catch(err => {
      return Message.err(err)
    }).finally(() => {
      DataInput.EMP_NM_TO = ''
      DataInput.EMP_NM_FR = ''
      DataInput.EMP_NO_TO = ''
      DataInput.EMP_NO_FR = ''
      
    })
    }
    else{
      return
    }
  })
  }




}


defineExpose({
  openPopup,
});
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="750"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">위험기계 정보 일괄변경</div>
    <v-card>
    <v-card-title>
    <IGridTitle
     :use-permission="false"
     :button-list="['btnClose']"
     @click-button="onButtonsClick"
    />
    </v-card-title>
    <v-card-text class="pa-0 px-2">
      <v-sheet  class="mb-3 popUp-input-Form d-flex py-0">
       <div>
        <!-- SPPDA0010_POPUP_SAVE_03 -->
        <v-card-title class="px-0">관리부서</v-card-title>
        <i-input
        class="mb-3"
        :label="t('변경 전 조직')"
        append-inner-icon="mdi-magnify"
        @click:appendInner="open('관리부서' , 'before')"
        @keydown.enter="(e) => {open('관리부서','before')}"
        v-model="DataInput.beforeASGN_FULL_NM"
        readonly
        />
        <i-input
        class="mb-3"
        :label="t('변경 후 조직')"
        append-inner-icon="mdi-magnify"
        @click:appendInner="open('관리부서','after')"
        @keydown.enter="(e) => {open('관리부서','after')}"
        v-model="DataInput.afterASGN_FULL_NM"
        readonly
        />
       </div>
       <div style="width: 180px;padding: 10px; padding-top: 47px;">
          <v-btn 
          width="100%" 
          height="100%"
          @click="SaveData('관리부서')"
          >저장</v-btn>
       </div>
      </v-sheet>

      <v-sheet  class="mb-3 popUp-input-Form d-flex py-0">   
       <div>
        <v-card-title class="px-0">사용부서</v-card-title>
        <i-input
        :label="t('변경 전 조직')"
        append-inner-icon="mdi-magnify"
        @click:appendInner="open('사용부서','before')"
         @keydown.enter="(e) => {open('사용부서','before')}"
        class="mb-3"
        v-model="DataInput.usebeforeASGN_FULL_NM"
        readonly
        />
        <i-input
        class="mb-3"
        :label="t('변경 후 조직')"
        append-inner-icon="mdi-magnify"
        @click:appendInner="open('사용부서','after')"
        @keydown.enter="(e) => {open('사용부서','after')}"
        v-model="DataInput.useafterASGN_FULL_NM"
        readonly
        />
       </div>
       <div style="width: 180px;padding: 10px; padding-top: 47px;">
          <v-btn 
           @click="SaveData('사용부서')"
            width="100%" 
            height="100%">저장</v-btn>
       </div>

      </v-sheet>

      <v-sheet  class="mb-3 popUp-input-Form d-flex py-0">
       <div>
        <v-card-title class="px-0">사용부서 담당자</v-card-title>
        <div class="d-flex">
          <i-input
          :label="t('변경 전 담당자 사번')"
          append-inner-icon="mdi-magnify"
          @click:appendInner="open('담당자','Dbefore')"
          @keydown.enter="(e) => {open('담당자','Dbefore')}"
          class="mb-3"
          v-model="DataInput.EMP_NM_FR"
          width="346px"
          margin="4px"
          />
          <i-input
          :label="t('')"
          readonly
          v-model="DataInput.EMP_NO_FR"
          width="150px"
          class="mb-3"
          />
        </div>

        <div class="d-flex">
        <i-input
        class="mb-3"
        :label="t('변경 후 담당자 사번')"
        append-inner-icon="mdi-magnify"
        @click:appendInner="open('담당자','Dafter')"
        @keydown.enter="(e) => {open('담당자','Dafter')}"
        v-model="DataInput.EMP_NM_TO" 
        width="346px"
        margin="4px"
        />
        <i-input
        :label="t('')"
        readonly
        v-model="DataInput.EMP_NO_TO"
        width="150px"
        class="mb-3"
        />
       </div>
       
       </div>
       <div style="width: 180px;padding: 10px; padding-top: 47px;">
          <v-btn
          width="100%" 
          height="100%"
          @click="SaveData('담당자')"
         >저장</v-btn>
       </div>

      </v-sheet>
    </v-card-text>
    


  </v-card>
        
    <DeptPopup ref="deptPopUp" @selected="onDeptSelected"/>
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
  
  
  </VDialog>

</template>
    
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
