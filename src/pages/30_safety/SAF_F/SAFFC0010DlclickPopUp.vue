
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList , commonUploadFilesApi ,commonSendSMS} from '@hiway/api/commonApi'
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
import IUpload from "@/components/IUpload.vue"


import OZReport from '@/components/OZReport.vue'


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['upDataRow'])
const dialog = ref(false)
const tab = ref(null)
const dataCheck =ref({})
const PopDataProp = reactive({
})
const MailPopup = ref(null)
const grdDetail = ref(null)
const menuTitle = ref(null)
const btnCol = ref('')
const codeList = reactive({})
const intCode=()=>{  
let SAFE_APPROVE ={
  CMPNY_DIV:'HHI',
  ALL_UP_CD:'HHIS080',
  USE_FLAG:'Y'
}


  Promise.all([
  getCodeList("HHIS070"),
  commonSearchApi({ queryId : 'searchCommonCodeF', param : SAFE_APPROVE }), //14
  ])
  .then((res)=>{
    console.log(res[1],'님들 ㅎㅇ')
    grdDetail.value.setBindingColumn("EXCEPT_REASON", res[0].ORESULT_CUR, "COD", "TXT")
    codeList.SAFE_APPROVE = res[1].ORESULT_CUR
  })




}



//  팝업 관련


const openPopup = async popupParam =>
{
  intCode()
  for(let i in popupParam){
    PopDataProp[i] = popupParam [i]
  }

  console.log(PopDataProp,'PopDataProp')
  searchPopUp(PopDataProp)
   dialog.value = true
}

//  버튼관련
const onButtonsClick = btn => {
 
  // 'btnUploadedAfterRevision','btnCancellationOfApplication','btnApprove','btnReject','btnClose'

if(btn.id == 'btnUploadedAfterRevision'){

  btnCol.value='btnUploadedAfterRevision'

  new saveFlowHelper(vm, t)
    
      .setQuery(saveGrdData)
      .setAfter(() => { 
        onButtonsClick({id :'btnClose' })
        upDataRow()
       })
      .run()
}

else if(btn.id == 'btnCancellationOfApplication'){

  btnCol.value='btnCancellationOfApplication'

  new saveFlowHelper(vm, t)

      .setQuery(saveGrdData)
      .setAfter(() => { 
        onButtonsClick({id :'btnClose' })
        upDataRow()
       })
      .run()
}

else if(btn.id == 'btnApprove'){
  btnCol.value='btnApprove'

  new saveFlowHelper(vm, t)
 
      .setQuery(saveGrdData)
      .setAfter(() => { 
        onButtonsClick({id :'btnClose' })
        upDataRow()
       })
      .run()
}

else if(btn.id == 'btnReject'){
  btnCol.value='btnReject'

  new saveFlowHelper(vm, t)
      .setBefore(Check)
      .setQuery(saveGrdData)
      .setAfter(() => { 
        onButtonsClick({id :'btnClose' })
        upDataRow()
       })
      .run()
}


else if (btn.id == 'btnClose'){
  console.log('hihi')
   dialog.value = false
 }

}

const upDataRow = () => {
  emit('upDataRow','upDataRow')
}

const searchPopUp = (PopDataProp) =>{
  let param = {
    CMPNY_DIV:PopDataProp.CMPNY_DIV,
    APPLY_DATE:PopDataProp.APPLY_DATE,
    SEQ:PopDataProp.SEQ
  }
// 인원
  commonSearchApi({ queryId: "SAFFC0010_PopUp2_SEARCH_01", param: param })
          .then((res) =>{
            console.log(res,'res')
            PopDataProp.APPLY_EMP_NM = res.ORESULT_CUR[0].APPLY_EMP_NM
            PopDataProp.APPLY_EMP = res.ORESULT_CUR[0].APPLY_EMP
            PopDataProp.APPROVE_DATE_DISP = res.ORESULT_CUR[0].APPROVE_DATE_DISP
            PopDataProp.REJECT_REASON = res.ORESULT_CUR[0].REJECT_REASON
            PopDataProp.SAFE_APPROVE_EMP_NM = res.ORESULT_CUR[0].SAFE_APPROVE_EMP_NM
            PopDataProp.SAFE_APPROVE_DATE_DISP = res.ORESULT_CUR[0].SAFE_APPROVE_DATE_DISP
            PopDataProp.SAFE_REJECT_REASON = res.ORESULT_CUR[0].SAFE_REJECT_REASON
          })

// 그리드
   commonSearchApi({ queryId: "SAFFC0010_PopUp_SEARCH_02", param: param })
          .then((res) =>{
            grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR)
            btnContorll()
          })
}


const btnContorll = ()=>{
 

    if(PopDataProp.STATE == '11'){
      if(userStore.empNo ==  PopDataProp.APPLY_EMP){
        menuTitle.value.setBtnProperty('btnUploadedAfterRevision', 'visible', true)  
        }
      menuTitle.value.setBtnProperty('btnUploadedAfterRevision', 'visible', false) 
      menuTitle.value.setBtnProperty('btnCancellationOfApplication', 'visible', false)
      menuTitle.value.setBtnProperty('btnApprove', 'visible', false)  
      menuTitle.value.setBtnProperty('btnReject', 'visible', false)   
    }

      else if(PopDataProp.STATE =='12'){
        if(userStore.empNo ==  PopDataProp.APPLY_EMP){
        menuTitle.value.setBtnProperty('btnUploadedAfterRevision', 'visible', true)  
        }
      menuTitle.value.setBtnProperty('btnUploadedAfterRevision', 'visible', false)  
      menuTitle.value.setBtnProperty('btnCancellationOfApplication', 'visible', false)
      menuTitle.value.setBtnProperty('btnApprove', 'visible', false)  
      menuTitle.value.setBtnProperty('btnReject', 'visible', false)  
      }
      else if(PopDataProp.STATE =='20'){
        if(userStore.empNo ==  PopDataProp.APPLY_EMP){
         menuTitle.value.setBtnProperty('btnCancellationOfApplication', 'visible', true)  
         menuTitle.value.setBtnProperty('btnUploadedAfterRevision', 'visible', false)  
         menuTitle.value.setBtnProperty('btnApprove', 'visible', false) 
         menuTitle.value.setBtnProperty('btnReject', 'visible', false) 
        }
        if(userStore.empNo ==  PopDataProp.APPROVE_EMP){
         menuTitle.value.setBtnProperty('btnUploadedAfterRevision', 'visible', false)  
          menuTitle.value.setBtnProperty('btnApprove', 'visible', true) 
         menuTitle.value.setBtnProperty('btnReject', 'visible', true) 
        }
    

      }
      else if(PopDataProp.STATE =='30'){
        let auth = false
        for(let i of codeList.SAFE_APPROVE){
          if(userStore.empNo == i.COD )
            auth = true
        }

        // 공통코드 S080 SLI 승인 권한이 있으면 승인 거절 버튼 visible
        if(auth){
          menuTitle.value.setBtnProperty('btnApprove', 'visible', true)  
          menuTitle.value.setBtnProperty('btnReject', 'visible', true)  
        }
        else {
          menuTitle.value.setBtnProperty('btnApprove', 'visible', false) 
          menuTitle.value.setBtnProperty('btnReject', 'visible', false)   
        }  
      menuTitle.value.setBtnProperty('btnUploadedAfterRevision', 'visible', false)  
      menuTitle.value.setBtnProperty('btnCancellationOfApplication', 'visible', false)
 
      }
      else if(PopDataProp.STATE =='40'){
      menuTitle.value.setBtnProperty('btnUploadedAfterRevision', 'visible', false)  
      menuTitle.value.setBtnProperty('btnCancellationOfApplication', 'visible', false)
      menuTitle.value.setBtnProperty('btnApprove', 'visible', false)  
      menuTitle.value.setBtnProperty('btnReject', 'visible', false)   
      }
}





// 저장


const Check =()=>{
    if(PopDataProp.STATE =='20'){
        if(!PopDataProp.REJECT_REASON){
          Message.warn('반려사유를 입력해주십시오.')
          return  false
        }
    }
    if(PopDataProp.STATE =='30'){
        if(!PopDataProp.SAFE_REJECT_REASON){
          Message.warn('반려사유를 입력해주십시오.')
          return false
        }
    }

  return true
}

const saveGrdData = () =>{
  let STATE = ''
  let REJECT_REASON = ''

  switch (btnCol.value) {
    // 수정 후 재상신
      case 'btnUploadedAfterRevision':
        STATE = '10'
        REJECT_REASON  = ''
        break

    // 상신 취소
    case 'btnCancellationOfApplication':
      STATE = '10'
      REJECT_REASON  = ''
      break

    // 승인
    case 'btnApprove':
      
      if(PopDataProp.STATE == '20'){
        STATE = '30'
        REJECT_REASON  = PopDataProp.REJECT_REASON
      }
      if(PopDataProp.STATE == '30'){
        STATE = '40'
        REJECT_REASON  = PopDataProp.SAFE_REJECT_REASON
      }
      break
    
    // 반려
      case 'btnReject':
      if(PopDataProp.STATE == '20'){
        STATE = '11'
        REJECT_REASON  = PopDataProp.REJECT_REASON
      }
      if(PopDataProp.STATE == '30'){
        STATE = '12'
        REJECT_REASON  = PopDataProp.SAFE_REJECT_REASON
      }

      break

}

let saveParam  = [{
      CMPNY_DIV:PopDataProp.CMPNY_DIV, 	
			APPLY_DATE:PopDataProp.APPLY_DATE, 		
			SEQ: PopDataProp.SEQ, 			
			STATE:STATE , 			
			REJECT_REASON:REJECT_REASON , 			
			USER_ID:userStore.userId, 			

  }]


  return commonExecuteApi({ queryId : 'SAFFC0010_POPUP2_SAVE_01', list: saveParam })
          .then((res)=>{
            let mailParams =
            {
              M_EMail : [],
               M_TITLE : '',
               M_CONTENT:''}

              //  승인

            if(btnCol.value == 'btnApprove'){
              if(saveParam[0].STATE =='30'){
                for(let i of codeList.SAFE_APPROVE){
                  if(i.CODE_SHORTNM != null && i.CODE_SHORTNM != undefined) {
                    mailParams.M_EMail.push(i.CODE_SHORTNM)
                  }
                }
                mailParams.M_TITLE = 'SLI 점수 집계 제외요청 승인(안전) 요청 건'
                mailParams.M_CONTENT = `
                  <p style='line-height: 30px;'><span class='text'>SLI 점수 집계 제외 승인 완료 건이 있습니다. 내용 검토 후 최종승인 진행 바랍니다.
                                <br/><br/>신청자 : ${PopDataProp.ASGN_NM} ${PopDataProp.APPLY_EMP_NM} 
                                </span></p>`
                console.log(mailParams,'mailParams')
                MailPopup.value.openPopup(mailParams,'SAFFC0010POPUP')
              }
              else if (saveParam[0].STATE =='40'){
                if(PopDataProp.APPR_USER_DIV == 'A'){
                
                  let Email = PopDataProp.APPLY_EMP_EMAIL
                  mailParams.M_EMail = [Email]
                  mailParams.M_TITLE = 'SLI 점수 집계 제외요청 승인(안전) 완료 건'
                  mailParams.M_CONTENT =`<p style='line-height: 30px;'><span class='text'>요청하신 SLI 점수 집계 제외요청이 승인(안전) 완료되었습니다.<br/> SLI 점수 집계 제외와 관계 없이 해당 인원(생산직/생산기술직)은 산업안전보건법에 따라 매분기 6시간 근로자 안전보건교육을 이수해야 하며, 이에 매월 2시간 정기 안전보건교육을 누락 없이 실시/보완해 주시기 바랍니다. " 
                                "<br/><br/>안전승인자 : ${userStore.empNm}
                                "</span></p>`

                  MailPopup.value.openPopup(mailParams,'SAFFC0010POPUP')
                }
                else if(PopDataProp.APPR_USER_DIV == 'B'){
                  let sendSMSParams = {
                    EMPNO_TO:  PopDataProp.APPLY_EMP,
                    SYSCODE: '156',
                    EMPNO_FROM  : userStore.empNo,
                    FROM_P_NO:PopDataProp.APPLY_EMP_PHONE.replace(/-/g, ''),
                    TITLE:'[HiSEs] SLI 점수 집계 제외요청 승인(안전) 완료',
                  }
                    commonSendSMS(sendSMSParams).finally( () => {
                    Message.success('SMS 발송완료')
                  })
                }
         
              }
            }

            // 반려

            if(btnCol.value == 'btnReject'){
              if(saveParam[0].STATE =='11'){
                if(PopDataProp.APPR_USER_DIV == 'A'){
                  let Email = PopDataProp.APPLY_EMP_EMAIL
                  mailParams.M_EMail = [Email]
                  mailParams.M_TITLE = 'SLI 점수 집계 제외요청 승인(안전) 요청 건'
                  mailParams.M_CONTENT = `
                 <p style='line-height: 30px;'><span class='text'>요청하신 SLI 점수 집계 제외요청이 반려되었습니다. 내용 수정 후 승인 (재)요청 바랍니다. 
                        <br/><br/>승인자 : ${PopDataProp.APPROVE_EMP_NM} 
                                </span></p>`
                  
                MailPopup.value.openPopup(mailParams,'SAFFC0010POPUP')
              }
              else {
                let sendSMSParams = {
                    EMPNO_TO: userStore.empNo ,
                    SYSCODE: '156',
                    EMPNO_FROM  :PopDataProp.APPLY_EMP,
                    FROM_P_NO:PopDataProp.APPLY_EMP_PHONE.replace(/-/g, ''),
                    TITLE:'[HiSEs] SLI 점수 집계 제외요청이 반려되었습니다. 수정 후 승인 요청 바랍니다.',
                  }
                    commonSendSMS(sendSMSParams).finally( () => {
                    Message.success('SMS 발송완료')
                  })
                }
              }



              else if (saveParam[0].STATE =='12'){
                if(PopDataProp.APPR_USER_DIV == 'A'){
                
                  let Email = PopDataProp.APPLY_EMP_EMAIL
                  mailParams.M_EMail = [Email]
                  mailParams.M_TITLE = 'SLI 점수 집계 제외요청 반려(안전) 건'
                  mailParams.M_CONTENT =`<p style='line-height: 30px;'><span class='text'>요청하신 SLI 점수 집계 제외요청이 반려(안전)되었습니다. 내용 수정 후 승인 (재)요청 바랍니다. " 
                                "<br/><br/>안전승인자 : ${userStore.empNm}
                                "</span></p>`

                 MailPopup.value.openPopup(mailParams,'SAFFC0010POPUP')
                }
                else {
                  let sendSMSParams = {
                    EMPNO_TO: userStore.empNo ,
                    SYSCODE: '156',
                    EMPNO_FROM  :PopDataProp.APPLY_EMP,
                    FROM_P_NO:PopDataProp.APPLY_EMP_PHONE.replace(/-/g, ''),
                    TITLE:'[HiSEs] SLI 점수 집계 제외요청이 반려(안전)되었습니다. 승인 (재)요청 바랍니다.',
                  }
                    commonSendSMS(sendSMSParams).finally( () => {
                    Message.success('SMS 발송완료')
                  })
                }
               
              }
            }
         
          })

}






// 그리드


// 인원추가 
const grdDetailProps = reactive({
  gridViewOption: {
    edit: { editable:false }
  },
  keys: ["CMPNY_DIV","ASGN_SHRT_NM"],
  field: [
  { fieldName: "ASGN_SHRT_NM", dataType: "text",  styleName: "left-column", header: { text: t("제외자 소속") },editable: false},
  { fieldName: "EXCEPT_EMP", dataType: "text",   header: { text: t("제외자 사번") } ,editable: false },
  { fieldName: "EMP_NM", dataType: "text",  header: { text: t("제외자") },editable: false },
  
  { fieldName: 'EXCEPT_DATE_FR',header: { text: t('시작월') },dataType:'text','displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM') :null},
  editor: { type:'date', datetimeFormat:'yyyy-MM', mask: { editMask: '9999-99', placeHolder:'yyyy-MM', includedFormat:true} },   },

  { fieldName: 'EXCEPT_DATE_TO',header: { text: t('종료월') },dataType:'text','displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM') :null},
  editor: { type:'date', datetimeFormat:'yyyy-MM', mask: { editMask: '9999-99', placeHolder:'yyyy-MM', includedFormat:true} },  },



  { 
  fieldName: "EXCEPT_REASON"
   ,dataType: "text"  
   ,header: { text: t("제외사유") }
 
  ,lookupDisplay: true,
  editor: {
        type: "dropdown",
      }
    },

  { fieldName: "EXCEPT_REASON_DESC", dataType: "text",  header: { text: t("제외 세부사유") },styleName: "left-column"  },


  { fieldName: "EXCEPT_ASGN_CD", dataType: "text", width: "300", styleName: "left-column", header: { text: t("제외자 소속") }  ,visible:false},
  { fieldName: "EXCEPT_DEPT_CD", dataType: "text", width: "300", styleName: "left-column", header: { text: t("제외자 부서") }  ,visible:false},
  { fieldName: "CMPNY_DIV", dataType: "text", width: "300", styleName: "left-column", header: { text: t("회사") }  ,visible:false},
  { fieldName: "APPROVE_EMP", dataType: "text", width: "300", styleName: "left-column", header: { text: t("내부승인자 사번") }  ,visible:false},
  { fieldName: "EXCEPT_BSNS_CD", dataType: "text", width: "300", styleName: "left-column", header: { text: t("제외자 사업부") }  ,visible:false},
  { fieldName: "APPLY_DATE", dataType: "text", width: "300",  header: { text: t("신청일자") } ,visible:false },
  { fieldName: "SEQ", dataType: "text", width: "300",  header: { text: t("신청순번") } ,visible:false },
  { fieldName: "ORGNDIV", dataType: "text", visible: false },

  ],
  columns: [],

  columnLayout: [
  'ASGN_SHRT_NM',
  'EXCEPT_EMP',
    'EMP_NM',
    {
      name: '제외기간',
      direction: 'horizontal',
      items: [ 'EXCEPT_DATE_FR', 'EXCEPT_DATE_TO' ],
      header: { text: t('제외기간') },
    },
    'EXCEPT_REASON',
    'EXCEPT_REASON_DESC',
    
  ],
})

grdDetailProps.columns = grdDetailProps.field

defineExpose({
  openPopup
})

</script>

<template>
    
  <VDialog v-model="dialog"  persistent width="900" 
  class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >    
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      SLI점수(안전교육) 집계 제외신청 결재
    </div>
    
    <VContainer style="background-color: white;">
      <IMenuTitle
            ref="menuTitle"
            :button-list="['btnUploadedAfterRevision','btnCancellationOfApplication','btnApprove','btnReject','btnClose']"
            @click-button="onButtonsClick"
          />
          <v-row>
            <v-col class="d-flex"  cols="12">

              <v-col>
                
                 <!-- 조회조건 -->
                <VRow>
                  <VCol>
          <VForm ref="searchArea" class="searchArea">
            <VRow>

              <VCol cols="12" md="8">
                <ILabel :label="$t('신청자')" >
                  <template #editor="editorProps">
                    <v-col cols="8">
                  <v-text-field 
                   readonly
                   v-model="PopDataProp.ASGN_NM" 
                   class="mx-2"/>
                      </v-col>
                   <v-col>
                   <v-text-field readonly   v-model="PopDataProp.APPLY_EMP_NM"/>
                  </v-col>
                  </template>
                </ILabel>
              </VCol>


              <VCol cols="12" md="4">
                <ILabel :label="$t('진행상태')" >
                  <template #editor="editorProps">
                    <v-text-field 
                    v-model="PopDataProp.STATE_NM" 
                    readonly
                    />
                  </template>
                </ILabel>
              </VCol>

         
            </VRow>
          </VForm>
                  </VCol>
                </VRow>
     

              <VRow>
                <VCol>
                  <RealGrid
                    ref="grdDetail"
                    class="mt-2"
                    style="height: 300px"
                    :gridViewOption="grdDetailProps.gridViewOption"
                    :fields="grdDetailProps.field"
                    :columns="grdDetailProps.columns"
                    :column-layout="grdDetailProps.columnLayout"
                  />
                </VCol>
              </VRow>


              <!-- 메인그리드 -->
              <VRow>
                <VCol class="d-flex" >
                  <v-col cols="6" style="border-right: 1px solid #CCCCCC;">
                    <v-card-title>
                      내부결재
                    </v-card-title>

              <v-col cols="12" >
                <ILabel label-loc="top"  :label="$t('승인자')" >
                  <template #editor="editorProps">
                   <v-text-field 
                   readonly
                   v-model="PopDataProp.APPROVE_EMP_NM" 
                   class="mx-2"/>
                  </template>
                </ILabel>
              </v-col>

              <v-col cols="12">
                <ILabel label-loc="top" :label="$t('결재일시')" >
                  <template #editor="editorProps">
                   <v-text-field 
                   readonly
                   v-model="PopDataProp.APPROVE_DATE_DISP" 
                   class="mx-2"/>
                  </template>
                </ILabel>
                </v-col>
                
                <v-col cols="12">
                <ILabel  label-loc="top" :label="$t('비고 및 반려사유')" >
                  <template #editor="editorProps">
                   <v-textarea 
                   rows="2"
                   :readonly="PopDataProp.STATE !='20'"
                   v-model="PopDataProp.REJECT_REASON" 
                   class="mx-2"/>
                  </template>
                </ILabel>
                </v-col>

                  </v-col>
                  
                  <v-col cols="6">
                    <v-card-title>
                      안전결재
                    </v-card-title>
                
                    <v-col cols="12">
                <ILabel label-loc="top"  :label="$t('승인자')" >
                  <template #editor="editorProps">
                   <v-text-field 
                   readonly
                   v-model="PopDataProp.SAFE_APPROVE_EMP_NM" 
                   class="mx-2"/>
                  </template>
                </ILabel>
              </v-col>

              <v-col cols="12">
                <ILabel label-loc="top" :label="$t('결재일시')" >
                  <template #editor="editorProps">
                   <v-text-field 
                   readonly
                    
                   v-model="PopDataProp.SAFE_APPROVE_DATE_DISP" 
                   class="mx-2"/>
                  </template>
                </ILabel>
                </v-col>
                
                <v-col cols="12">
                <ILabel  label-loc="top" :label="$t('비고 및 반려사유')" >
                  <template #editor="editorProps">
                   <v-textarea 
                   rows="2"
                   :readonly="PopDataProp.STATE !='30'"
                   v-model="PopDataProp.SAFE_REJECT_REASON" 
                   class="mx-2"/>
                  </template>
                </ILabel>
                </v-col>


                  </v-col>
                </VCol>
              </VRow>



              </v-col>







            </v-col>
          </v-row>
          <SendMailPopup ref="MailPopup"/>
    </VContainer>
  </VDialog>

</template>



<style scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }

</style>