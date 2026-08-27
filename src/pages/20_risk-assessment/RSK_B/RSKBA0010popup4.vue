
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList , commonUploadFilesApi } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { value } from 'lodash-es'
import Message from '@hiway/utils/notify'
import AcdtPopup from '@/components/popup/AcdtPopup.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'

import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'

import OZReport from '@/components/OZReport.vue'


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected','upDataRow'])
const menuTitle = ref(null)




const dialog = ref(false)

const popEmp =ref()
const fileUpload = ref(null)
const sagoContent = 'HiSes  사고 정보 연계'



const popupParam = reactive({
  SaveData:{}
})
const codeList = reactive({
  HLD_OFFI_GBN:[
    {COD:'1' ,TXT:'재직'},
    {COD:'2' ,TXT:'휴직'},
    {COD:'3' ,TXT:'퇴직'},
    {COD:'4' ,TXT:'입대'},
  ]
})

// 공통팝업
const locationPopup = ref(null) 
const acdtPopupRef = ref(null)
const SendMailPopupRef = ref(null)
const deptPopup = ref(null)

// 데이터 바인딩
const ED0010PopUpData = ref({})
const ResData = reactive({})
const saveForms =ref(null)
const SaveData =reactive({})
const DoSave = ref(true)





//  날짜 변환기
const DayFormat = (date)=>{
  if(date){
  const originalDate = new Date(date)
  const year = originalDate.getFullYear()
  const month = String(originalDate.getMonth() + 1).padStart(2, '0')
  const day = String(originalDate.getDate()).padStart(2, '0')
  let Result = `${year}-${month}-${day}`

  return Result
  }
  return null
}


//팝업 오픈
const openPopEmp = ()=>{
  popEmp.value.openPopup('openPop from parent')
}




const intCode=()=>{  
  Promise.all([
  getCodeList('HHIB320'), //0
  commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 사업부
  ])
  .then((res)=>{
    codeList.GUGUP_USE=res[0].ORESULT_CUR
    codeList.BSNS = res[1].ORESULT_CUR
    if(!popupParam.SaveData.SAGO_SN){
      fileUpload.value.disableBtnUpLoad(DoSave.value)
    }

    if(popupParam.SaveData.OCCUR_TIME){
    const hours = popupParam.SaveData.OCCUR_TIME.substring(0, 2)
    const minutes = popupParam.SaveData.OCCUR_TIME.substring(2)
    return popupParam.SaveData.OCCUR_TIME = `${hours}:${minutes}`
    }
  })



}

//  팝업 관련


const openPopup = (param )=>
{ 
 
  if(param){
    popupParam.SaveData  = param
    console.log(popupParam.SaveData,'ddddd')
    
   
    popupParam.SaveData.OCCUR_DT = popupParam.SaveData.OCCUR_DT ? popupParam.SaveData.OCCUR_DT.substring(0, 10).replace('T', '') : ''
    switch( popupParam.GUGUP_USE){
      
      case "O" :
      popupParam.SaveData.GUGUP_USE = 'Y'
          break

      case "X":
      popupParam.SaveData.GUGUP_USE = 'N'
          break
      

    }
    
  }
  else{

    popupParam.SaveData = []
  }

  intCode()
  dialog.value = true
 
}


const acdtOpen = () => {


  acdtPopupRef.value.openPopup(userStore.cmpnyDiv)
 
}

const locationPopupOpen = () => {

  locationPopup.value.openPopup(userStore.cmpnyDiv)

}
const deptPopupOpen = () =>{

    deptPopup.value.openPopup()

  }

const selectedArr = row =>{

    popupParam.SaveData.SAGO_DIV_L_NM = row[0].TXT
    popupParam.SaveData.SAGO_DIV_M_NM = row[1].TXT
    popupParam.SaveData.SAGO_DIV_S_NM = row[2].TXT 


    popupParam.SaveData.SAGO_DIV_L = row[0].COD
    popupParam.SaveData.SAGO_DIV_M = row[1].COD
    popupParam.SaveData.SAGO_DIV_S = row[2].COD
}




const selectedLocation = row =>{

    popupParam.SaveData.SAGO_LOC_LM =  row[0].TXT
    popupParam.SaveData.SAGO_LOC_MM = row[1].TXT
    popupParam.SaveData.SAGO_LOC_SM = row[2].TXT
    
    popupParam.SaveData.SAGO_LOC_L = row[0].COD
    popupParam.SaveData.SAGO_LOC_M = row[1].COD
    popupParam.SaveData.SAGO_LOC_S = row[2].COD

}

const onDeptSelected = row => {
  popupParam.SaveData.RESP_DEPT_NM = row.ASGN_SHRT_NM
  popupParam.SaveData.CMPNY_DIV = row.CMPNY_DIV
  popupParam.SaveData.BSNS_CD = row.BSNS_CD
  popupParam.SaveData.DEPT_CD = row.DEPT_CD
  popupParam.SaveData.ASGN_CD = row.ASGN_CD
  popupParam.SaveData.RESP_DEPT_CD =  row.DEPT_CD
  popupParam.SaveData.RESP_DEPT_NM =  row.ASGN_SHRT_NM

}





watch(() => fileUpload.value,newValue => {
  if(newValue !== null && newValue !== '' && newValue !== undefined){
  checkFileId()
  }

})
  







//  시간 유효성검사

const formatTimeFromInput = (inputTime) => {
  const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/
  if (!timePattern.test(inputTime)) {
    return ''
  }


  const hours = inputTime.substring(0, 2)
  const minutes = inputTime.substring(2)
  return `${hours}:${minutes}`
}

const formatAndDisplayTime = () => {

  popupParam.SaveData.OCCUR_TIME = formatTimeFromInput(popupParam.SaveData.OCCUR_TIME);

}


//그리드 셋팅
const grdPopUpProps = reactive({
  gridViewOption : {edit: { editable:false }},
  keys : [],
  fields : [ 
    { fieldName: 'STATUS',  dataType: 'text', header: { text: t('진행상태') } ,lookupDisplay: true, },
    { fieldName: 'INPUTDTE', dataType: 'datetime',  datetimeFormat: 'yyyy-MM-dd', header: { text: t('접수일') ,editor: { datetimeFormat: 'yyyy-MM-dd' } } },
    { fieldName: 'FINISHDTE', dataType: 'datetime',  datetimeFormat: 'yyyy-MM-dd', header: { text: t('완료일') ,editor: { datetimeFormat: 'yyyy-MM-dd' } } },
    { fieldName: 'ADESC',  dataType: 'text', header: { text: t('진료비내용') } },
    { fieldName: 'AMT',  dataType: 'text', header: { text: t('금액') } },
    { fieldName: 'HOSPITAL',  dataType: 'text', header: { text: t('병원') } },
    { fieldName: 'BANK',  dataType: 'text', header: { text: t('은행') } },
  ],
  columns : [],
})

grdPopUpProps.columns = grdPopUpProps.fields



const grdPop1prop = reactive({
  gridViewOption : {edit: { editable:false }},
  keys : ['COMPANY_NM'],
  fields : [ 
    { fieldName: 'COMPANY_NM',  dataType: 'text', header: { text: t('회사구분') } },
    { fieldName: 'HLD_OFFI_NM',  dataType: 'text', header: { text: t('재직상태') } },
    { fieldName: 'RETI_TMP_DATE',  dataType: 'datetime',  datetimeFormat: 'yyyy-MM-dd', header: { text: t('퇴직일') ,editor: { datetimeFormat: 'yyyy-MM-dd' }}  },
    
  ],
  columns : [],
})

grdPop1prop.columns = grdPop1prop.fields




//  저장관련

const mainCheck =  () => {
  if(!popupParam.SaveData.OCCUR_DT || !popupParam.SaveData.OCCUR_TIME){
    Message.warn(t(' 발생일시를 입력해주세요.'))
    return false
  }
  if(!popupParam.SaveData.CMPNY_DIV){
    Message.warn(t('책임조직을 선택해주세요.'))
    return false
  }
  if(!popupParam.SaveData.SAGO_DIV_L_NM ||!popupParam.SaveData.SAGO_DIV_M_NM|| !popupParam.SaveData.SAGO_DIV_S_NM ){
    Message.warn(t(' 사고형태를  선택해주세요.'))
    return false
  }
  if(!popupParam.SaveData.SAGO_LOC_LM ||!popupParam.SaveData.SAGO_LOC_MM|| !popupParam.SaveData.SAGO_LOC_SM ){
    Message.warn(t(' 발생장소를 선택해주세요.'))
    return false
  }
    return true
}


const mainSaveData = () => {
 
 let param = [{
              
         SAGO_GAEYO:popupParam.SaveData.SAGO_GAEYO     
                   	
  }]

  console.log(param ,'SaveTheParam')

  return commonExecuteApi({ queryId : 'SAFAB0010_save02', list: param })
}




const uploaded = item=>{

  
  let param = [{
          CMPNY_DIV:popupParam.SaveData.CMPNY_DIV, 
          SAGO_SN:popupParam.SaveData.SAGO_SN, 	
          PIC_FILE_ID:item.fileId,
          PIC_DESC:'', 		
          SEQ:'1',
          SAVE_YN:popupParam.SaveData.SAVE_YN,
          USER_ID:userStore.userId
        }]
   
  commonExecuteApi({ queryId : 'SAFAB0010_save04', list: param })
}


//버튼
const onButtonsClick = btn => {


  if (btn.id === 'btnUpdate') {
    
  
    new saveFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(mainSaveData)
      .setAfter(() => { onButtonsClick({ id :'btnClose' })
                        upDataRow()})
      .run()
  } 


  else if (btn.id === 'btnClose') {
    dialog.value = false
  }

  

  else {
    return  Message.warn(t('개발중입니다.'))
    //  btnApplicationForMedicalCareOutput 요양신청서 출력 , btnIndustrialAccidentCompensationCardOutput 산재자카드 출력,btnOfficialPaperOutput 보고서출력
  }
}



const onSelect = () => {
  emit('selected', 'selected')
}

const upDataRow = () => {
  emit('upDataRow','upDataRow')
}



const searchData01 = idx => {
  let param = 
    {
    CMPNY_DIV:popupParam.SaveData.CMPNY_DIV,
    SANGBN:popupParam.SaveData.SANGBN
    }
  
  return commonSearchApi({ queryId : 'SAF_AG0010_search13', param: param })
}

const afterSearch01 = res => {

  popupParam.SaveData.FILENUM = res.ORESULT_CUR[0].FILENUM
  popupParam.SaveData.OKDTE = dayjs().format('YYYY-MM-DD')
  popupParam.SaveData.SANOK = 'Y'
}


watch(() => popupParam.SaveData.STATUS, newValue => {
if(popupParam.SaveData.STATUS){
  if(newValue=='A'){
      popupParam.SaveData.FILENUM = ''
      popupParam.SaveData.OKDTE = ''
      popupParam.SaveData.SANOK = ''
  } 
   else if(newValue =='D' ){
      popupParam.SaveData.FILENUM = ''
      popupParam.SaveData.OKDTE = dayjs().format('YYYY-MM-DD')
      popupParam.SaveData.SANOK = 'N'

    }
    else if(newValue=='C'){
      new queryFlowHelper(vm, t)
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
    }
  }
})
  





//  파일관련 메소드
const checkFileId = () => {
  console.log(popupParam.SaveData.PIC_FILE_ID1)
  if (popupParam.SaveData.PIC_FILE_ID1 === null || popupParam.SaveData.PIC_FILE_ID1 === undefined) {
    fileUpload.value.setGuid()
    popupParam.SaveData.PIC_FILE_ID1 = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(popupParam.SaveData.PIC_FILE_ID1)
    popupParam.SaveData.PIC_FILE_ID1 = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
  
}


//  출력
const btnPrint = GuBun =>{

  if(GuBun === '즉보'){
    return  Message.warn(t('아직 개발중입니다.'))
  }

  if(GuBun === '보고서'){
    onButtonsClick({id:'btnOfficialPaperOutput'})
  }
}

// 유효성검사 숫자
const numberRequed = gubun =>{

if(gubun === '합의금'){
  popupParam.SaveData.HAPAMT = popupParam.SaveData.HAPAMT.replace(/[^0-9-]/g, '')
}

if(gubun === '평균임금'){
  console.log(popupParam.SaveData.SALARY)
  popupParam.SaveData.SALARY = popupParam.SaveData.SALARY.replace(/[^0-9-]/g, '')
}

}



defineExpose({
  openPopup
})

</script>

<template>
    
  <VDialog v-model="dialog"  persistent width="880"  height="780"   
    class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >    
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
    사고정보
    </div>
    <VContainer style="background-color: white;">
      <VForm ref="saveForms">
      <!-- 최상단 -->
        <VRow class="my-1">
          <VCol>
            <IMenuTitle
              ref="menuTitle"
              :use-permission="false"
              :button-list="[ 'btnClose']"
              @click-button="onButtonsClick"
            />
          </VCol>
        </VRow>
        <v-row style="overflow-x: hidden; overflow-y: auto; height: 450px;">
  
        <!--  신청 / 요양정보 -->
          <VRow class="popUp-input-Form">
          <!-- 첫번째 -->
            <v-col cols="12">
              <v-row style="align-items: flex-end;">
                <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('사업부')" 
                    labelLoc="top"
                    >
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-text-field  v-model="popupParam.SaveData.OCCUR_DT" readonly variant="solo"  flat class="mr-2"  />
                        </v-col>                        
                      </v-row>
                    </template>      
                  </ILabel>
                </VCol>

                <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('부서')"
                    labelLoc="top"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-text-field  v-model="popupParam.SaveData.OCCUR_DT" readonly variant="solo"  flat class="mr-2"  />
                        </v-col>                        
                      </v-row>
                    </template>      
                  </ILabel>
                </VCol>   
                <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('업체명')"
                    labelLoc="top"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-text-field  v-model="popupParam.SaveData.OCCUR_DT" readonly variant="solo"  flat class="mr-2"  />
                        </v-col>                                                
                      </v-row>
                    </template>      
                  </ILabel>
                </VCol>         
              </v-row>
            </v-col>

            <!-- 두번째 -->
            <v-col cols="12">
              <v-row>
                <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('발생일')"
                    labelLoc="top"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-text-field readonly type="date" v-model="popupParam.SaveData.SAGO_LOC_LM"  variant="solo"  flat class="mr-2"  />
                        </v-col>                       
                      </v-row>
                    </template>      
                  </ILabel>
                </VCol>
                <VCol cols="12" md="8">
                  <ILabel
                    :label="$t('유형')"
                    labelLoc="top"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-text-field readonly v-model="popupParam.SaveData.SAGO_LOC_LM"  variant="solo"  flat class="mr-2"  />
                        </v-col>                        
                      </v-row>
                    </template>      
                  </ILabel>
                </VCol>
              </v-row> 
            </v-col>          
              
            <v-col cols="12">
              <v-row>
                <VCol cols="12" md="12">              
                  <ILabel
                    :label="$t('사고내용 요약')"
                    labelLoc="top"
                  >
                    <template #editor="editorProps">
                      <v-row>                    
                        <v-textarea readonly v-model="sagoContent"  variant="solo" flat class="mt-2" />                  
                      </v-row>
                    </template>      
                  </ILabel>              
                </VCol>
              </v-row> 
            </v-col>     
          </VRow>

        <!-- 팝업 -->
         <AcdtPopup ref="acdtPopupRef" @selectedArr="selectedArr"/>
          <LocationPopup @selectedArr="selectedLocation" ref="locationPopup"/>
         <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
      </v-row>
    </VForm>
    </VContainer>
  </VDialog>

</template>


<style scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }

</style>