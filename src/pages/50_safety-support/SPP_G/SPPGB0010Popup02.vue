<!--
  화면명 : 공정사고조사 입력팝업
  화면개요 : 메인 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted, computed, nextTick } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonRequest2,
  getCodeList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import { isEmpty, isNullOrUndefined } from "@/@core/utils"
import { useLogsStore } from '@/@hiway/stores/logs'
import { commonDeletFilesApi } from "@hiway/api/commonFileApi"
import { useCommonStore } from '@/@hiway/stores/common'
import { useRoute } from 'vue-router'
import IButtonList from '@/components/IButtonList.vue'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'

const emit = defineEmits(['closed'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const commonStore = useCommonStore()
const route = useRoute()
const userStore = useUserStore()
const menuTitle = ref(null)
// const fileUploadButton = reactive(["btnDelete"])
// const titleButton = reactive(['btnClose']);
const button = ['btnFileUpload',"btnDelete",'btnClose']
const isAdmin = ref(0)
const dialog = ref(false)
const fileUpload =ref(null)
const fileId=ref(null)
const isSave=ref('N')


const codeList = reactive({
  logCmpny: [], //사고 사업부(그룹사)
  accidnetType: [], //사고유형
  hospital: [],//병원
  camera:[]
})

const selectYear =ref(null)
const selectFrMonth =ref(null)
const selectToMonth =ref(null)

const grdMain01=ref(null);

const search=ref(false)//저장시 조회
//각 항목에 들어갈 변수

const saveParams = reactive({});



const initParams = () => {
  
  selectYear.value=dayjs().format('YYYY');
  selectFrMonth.value='01'
  selectToMonth.value='12'

  applyRange(selectFrMonth.value, selectToMonth.value);

  SearchData();
}


// 팝업 초기세팅
const openPopup = async (data) => {
  
  // 변수 초기화 작업
  saveParams.CMPNY_DIV=userStore.cmpnyDiv
  saveParams.WORK_LOG_ID=data.WORK_LOG_ID
  saveParams.DETAIL_SEQ=data.DETAIL_SEQ
  saveParams.FILE_ID=data.FILE_ID

  console.log(data.FILE_ID);
  if(data.FILE_ID)
  {
    fileUpload.value.setGuid(data.FILE_ID)
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
  dialog.value =true

}

// 바인딩 데이터 세팅
const setInfo = (isNew, data) => {
  // 권한 세팅
  isAdmin.value = data.isAdmin

  // 팝업 제목 세팅


  // 등록/수정 분기 세팅
  saveParams.SAVE_YN = isNew ? 'Y' : 'N'

  // 변경등록 세팅
  saveParams.BSNS_CD = data.BSNS_CD
  


}
const onButtonsClick = btn => {

  if(btn.id=='btnClose')
  {
    closePopup();
  }

}

const closePopup = () => {
  
  // if(grdMain1.value.getDataProvider().getRowCount() < 3)
  // {
  //   saveStat.value='T'
  //   new saveFlowHelper(vm, t)
  //     .setBefore(beforeSave)
  //     .setQuery(saveData)
  //     .run()
  // }

  clearPopup();
  dialog.value = false
  emit('closed',isSave.value)
}
const clearPopup =()=>
{
  fileId.value = ''
  fileUpload.value.setGuid(fileId.value)
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
}

defineExpose({
  openPopup
})

const uploadCheckPicture = async (val)=>
{
  fileId.value=val.FILE_ID
  saveParams.FILE_ID=fileId.value

  console.log("saveParams:",saveParams)
  const res= await commonExecuteApi({ queryId: 'SPPGB0010_SAVE_05', list: [saveParams] })
  console.log("res:",res)
  isSave.value='Y'
}

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1000"
    height="460"
  >
  <div class="title-bar">사진업로드</div>
    <v-card class="pa-3 fill-height rounded-b-5" style="background-color: white">

      <v-card-text class="pa-2 pt-0 content-area">
        <IUploadImageMulit
            ref="fileUpload"
            height="310"
            class="mr-2"
            @uploaded="uploadCheckPicture"
            :button-list="button"
            image-sheet-width="100%"
            file-grid-width="100%"
            @closed="closePopup"
          ></IUploadImageMulit>
      </v-card-text>
      <!-- @btnCheck="btn_Click" -->
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>

input[readonly],
textarea[readonly] {
  background-color: #f6f6f6 !important;
  color: #888 !important;
  border: 1px solid #dcdcdc !important;
  border-radius: 4px;
  opacity: 1 !important;
  margin : 1px;
}

</style>
