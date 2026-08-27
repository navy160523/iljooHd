
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
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
const initCode=()=>{  
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
    grdDetail.value.setBindingColumn("EXCEPT_REASON", res[0].ORESULT_CUR, "COD", "TXT")
    codeList.SAFE_APPROVE = res[1].ORESULT_CUR
  })
}
//팝업 관련
const openPopup = async popupParam =>
{
  console.log("팝업파랍2 확인 :::: >>>> ",popupParam)
  initCode()
  for(let i in popupParam){
    PopDataProp[i] = popupParam [i]
  }

  console.log(PopDataProp,'PopDataProp')
  searchPopUp(PopDataProp)
  dialog.value = true
}

//  버튼관련
const onButtonsClick = async btn => {
  btnCol.value= btn.id
  console.log('체크1111111111', btnCol)
  if(btn.id === 'btnUploadedAfterRevision'){


    await saveGrdData().then(async () =>{
      await onClose()
    })
  }

  else if(btn.id === 'btnCancellationOfApplication'){

    await saveGrdData().then(async () =>{
      await onClose()
    })
  }

  else if(btn.id === 'btnApprove'){
    await saveGrdData().then(async () =>{
      await onClose()
    })
  }

  else if(btn.id === 'btnReject'){
    await Check
    await saveGrdData().then(async () =>{
      await onClose()
    })
  }else if (btn.id === 'btnClose'){
    onClose()
  }
}

const upDataRow = async () => {
  await emit('upDataRow')
}

const onClose = async () =>{
  dialog.value = false
  await upDataRow()
}

const searchPopUp = (PopDataProp) =>{
  let param = {
    CMPNY_DIV:PopDataProp.CMPNY_DIV,
    APPLY_DATE:PopDataProp.APPLY_DATE,
    SEQ:PopDataProp.SEQ
  }
// 인원
  commonSearchApi({ queryId: "EDUAC0030_POP02_SEARCH_01", param: param })
    .then((res) =>{
      PopDataProp.APPLY_EMP_NM = res.ORESULT_CUR[0].APPLY_EMP_NM
      PopDataProp.APPLY_EMP = res.ORESULT_CUR[0].APPLY_EMP
      PopDataProp.APPROVE_DATE_DISP = res.ORESULT_CUR[0].APPROVE_DATE_DISP
      PopDataProp.REJECT_REASON = res.ORESULT_CUR[0].REJECT_REASON
      PopDataProp.SAFE_APPROVE_EMP_NM = res.ORESULT_CUR[0].SAFE_APPROVE_EMP_NM
      PopDataProp.SAFE_APPROVE_DATE_DISP = res.ORESULT_CUR[0].SAFE_APPROVE_DATE_DISP
      PopDataProp.SAFE_REJECT_REASON = res.ORESULT_CUR[0].SAFE_REJECT_REASON
    })

// 그리드
  commonSearchApi({ queryId: "EDUAC0030_POP01_SEARCH_02", param: param })
    .then((res) =>{
      grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR)
      btnControl()
    })
}


const btnControl = ()=>{
  console.log("팝 데이터 프롭 :::: >>>> ",PopDataProp)
  console.log("유저스토어.empNo :::: >>>> ",userStore.empNo)
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
const Check =async ()=>{
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

const saveGrdData = async () =>{
  let STATE = ''
  let REJECT_REASON = ''
  console.log('여기 옴???', btnCol.value, PopDataProp.STATE)
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
  console.log('여기 옴222222222222???', btnCol.value, saveParam)
  return await commonExecuteApi({ queryId : 'EDUAC0030_POP02_SAVE_01', list: saveParam })
    .then(async (res)=>{
      let mailParams = {
        M_EMail : [],
        M_TITLE : '',
        M_CONTENT:''
      }
      //  승인
      if(btnCol.value == 'btnApprove'){
        if(saveParam[0].STATE =='30'){
          for(let i of codeList.SAFE_APPROVE){            
            mailParams.M_EMail.push({ TO_EMP_EMAIL : i.CODE_SHORTNM, TO_EMP_NM : i.TXT})              
          }
          mailParams.M_TITLE = '아카데미 참석 제외요청 승인(안전) 요청 건'
          mailParams.M_CONTENT = `
            <p style='line-height: 30px;'><span class='text'>아카데미 참석 제외 승인 완료 건이 있습니다. 내용 검토 후 최종승인 진행 바랍니다.
                          <br/><br/>신청자 : ${PopDataProp.ASGN_NM} ${PopDataProp.APPLY_EMP_NM} 
                          </span></p>`
          MailPopup.value.openPopup(mailParams,'EDUAC0030Popup02')
        }
        else if (saveParam[0].STATE =='40'){
          if(PopDataProp.APPR_USER_DIV == 'A'){
          
            let Email = PopDataProp.APPLY_EMP_EMAIL
            mailParams.M_EMail = [Email]
            mailParams.M_TITLE = '아카데미 참석 제외요청 승인(안전) 완료 건'
            mailParams.M_CONTENT =`<p style='line-height: 30px;'><span class='text'>요청하신 아카데미 참석 제외요청이 승인(안전) 완료되었습니다.<br/> " 
                          "<br/><br/>안전승인자 : ${userStore.empNm}
                          "</span></p>`

            MailPopup.value.openPopup(mailParams,'EDUAC0030Popup02')
          }
          else if(PopDataProp.APPR_USER_DIV == 'B'){
            let sendSMSParams = {
              EMPNO_TO: userStore.empNo ,
              SYSCODE: '156',
              EMPNO_FROM  :PopDataProp.APPLY_EMP,
              FROM_P_NO:PopDataProp.APPLY_EMP_PHONE.replace(/-/g, ''),
              TITLE:'[HiSEs] 아카데미 참석 제외요청 승인(안전) 완료',
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
            mailParams.M_TITLE = '아카데미 참석 제외요청 승인(안전) 요청 건'
            mailParams.M_CONTENT = `
            <p style='line-height: 30px;'><span class='text'>요청하신 아카데미 참석 제외요청이 반려되었습니다. 내용 수정 후 승인 (재)요청 바랍니다. 
                  <br/><br/>승인자 : ${PopDataProp.APPROVE_EMP_NM} 
                          </span></p>`
            
          MailPopup.value.openPopup(mailParams,'EDUAC0030Popup02')
        }
        else {
          let sendSMSParams = {
              EMPNO_TO: userStore.empNo ,
              SYSCODE: '156',
              EMPNO_FROM  :PopDataProp.APPLY_EMP,
              FROM_P_NO:PopDataProp.APPLY_EMP_PHONE.replace(/-/g, ''),
              TITLE:'[HiSEs] 아카데미 참석 제외요청이 반려되었습니다. 수정 후 승인 요청 바랍니다.',
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
            mailParams.M_TITLE = '아카데미 참석 제외요청 반려(안전) 건'
            mailParams.M_CONTENT =`<p style='line-height: 30px;'><span class='text'>요청하신 아카데미 참석 제외요청이 반려(안전)되었습니다. 내용 수정 후 승인 (재)요청 바랍니다. " 
                          "<br/><br/>안전승인자 : ${userStore.empNm}
                          "</span></p>`

            MailPopup.value.openPopup(mailParams,'EDUAC0030Popup02')
          }
          else {
            let sendSMSParams = {
              EMPNO_TO: userStore.empNo ,
              SYSCODE: '156',
              EMPNO_FROM  :PopDataProp.APPLY_EMP,
              FROM_P_NO:PopDataProp.APPLY_EMP_PHONE.replace(/-/g, ''),
              TITLE:'[HiSEs] 아카데미 참석 제외요청이 반려(안전)되었습니다. 승인 (재)요청 바랍니다.',
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
  <v-dialog 
    v-model="dialog"  
    eager
    persistent 
    width="900"   
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
      <span>아카데미 참석 제외신청 결재</span>
    </v-sheet> 
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2"> 
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnUploadedAfterRevision','btnCancellationOfApplication','btnApprove','btnReject','btnClose']"
          @click-button="onButtonsClick"
        />   
      </v-card-title>
      <v-card-text  class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="d-flex searchArea">
            <i-input 
              :label="$t('신청자')"
              labelWidth="39px"
              width="350px"
              readonly
              v-model="PopDataProp.ASGN_NM" 
              class="mx-2"
            />
            <i-input 
              width="150px"
              readonly   
              v-model="PopDataProp.APPLY_EMP_NM"
            />
            <i-input
              :label="$t('진행상태')"
              labelWidth="52px"
              width="270px"
              v-model="PopDataProp.STATE_NM" 
              readonly
            />
          </v-sheet>
          <v-sheet height="70%">
            <RealGrid
              ref="grdDetail"
              class="mt-2"
              :gridViewOption="grdDetailProps.gridViewOption"
              :fields="grdDetailProps.field"
              :columns="grdDetailProps.columns"
              :column-layout="grdDetailProps.columnLayout"
            /> 
          </v-sheet>
          <v-divider
            :thickness="1"
            class="mt-3 d-block"
          />
          <v-sheet class="d-flex">
            <div class="flex-column" style="width:49%">
              <v-card-title>
                내부결재
              </v-card-title>
              <i-input
                :label="$t('승인자')"
                labelWidth="52px"
                width="400px"
                style="display = 'left'"
                readonly
                v-model="PopDataProp.APPROVE_EMP_NM" 
              />
              <i-input 
                :label="$t('결재일시')"
                labelWidth="52px"
                width="400px"
                readonly
                v-model="PopDataProp.APPROVE_DATE_DISP" 
                class="mt-2"
              />
              <i-textarea
                rows="2"
                :title="$t('비고 및 반려사유')" 
                titleWidth="104px"
                width="400px"
                :readonly="PopDataProp.STATE !='20'"
                v-model="PopDataProp.REJECT_REASON" 
                class="mt-2"
              />     
            </div>
            <v-divider
              :thickness="1"
              vertical
              class="ml-2 mr-7 d-block float-right"
            />
            <div class="flex-column" style="width:49%">
              <v-card-title>
                안전결재
              </v-card-title>
              <i-input
                :label="$t('승인자')"
                labelWidth="52px"
                width="400px"
                readonly
                v-model="PopDataProp.SAFE_APPROVE_EMP_NM" 
              />
              <i-input
                :label="$t('결재일시')"
                labelWidth="52px"
                width="400px"
                readonly
                v-model="PopDataProp.SAFE_APPROVE_DATE_DISP" 
                class="mt-2"
              />
              <i-textarea
                rows="2"
                :title="$t('비고 및 반려사유')"
                titleWidth="104px"
                width="400px"
                :readonly="PopDataProp.STATE !='30'"
                v-model="PopDataProp.SAFE_REJECT_REASON" 
                class="mt-2"
              /> 
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <SendMailPopup ref="MailPopup"/>
  </v-dialog>

</template>

<style scoped lang="scss">
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>