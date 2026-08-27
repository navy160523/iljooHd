<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 허가서 작성 팝업   날짜 설정  -->


<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest, commonSearchApi } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { useUserStore } from "@hiway/stores/user"
import Message from "@hiway/utils/notify"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import {commonExecuteApi, commonSendApi, commonSendSMS } from "@hiway/api/commonApi"
import WrkChkPopUp from "@/pages/30_safety/SAF_B/SAFBA0010WrkChkPopUp.vue"


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const emit = defineEmits(["upData"])
const empPopup = ref(null)
const dialogWidth  = ref(''); // 기본 크기
const dialogHeight = ref(''); // 기본 크기
const wrkChk = ref(null)
const menuTitle = ref(null)
const saveParams = reactive({
  safetyEmpNo: "",
  safetyEmpNm: "",
  safetyDeptCd: "",
  safetyDeptNm: "",
  Reason: "",
  safetyEmail: "",
})


const CmpnyDiv = ref("")
const RcvNo = ref("")

const UrgentYN = ref("")
const CrossYN = ref("")

const Page = ref('1')

//  팝업 관련

const openPopup = async (cross_yn, urgent_yn, cmpny_Div, rcv_no) => {

  CrossYN.value  = cross_yn
  UrgentYN.value = urgent_yn
  CmpnyDiv.value = cmpny_Div
  RcvNo.value  = rcv_no


  console.log('openPopup param', CrossYN.value, UrgentYN.value )
  dialogWidth.value  = '800px'
  dialogHeight.value = (UrgentYN.value ==='Y')&&(CrossYN.value ==='Y') ?  '600px' : '400px' ;

  dialog.value = true


}


// 메일 발송
const SendMail = async () => {

    // // 1. 안전요원 
    // console.log('안전요원: ', saveParams.safetyEmail)

    // let mailParam1 = {
    //   EMAIL:  [saveParams.safetyEmail], //받는사람 이메일주소
    //   // SUBJECT: `안녕하세요. ${data.EMP_NM}님 '${currentGrdData.value.MEET_ORG_NM}'의 회의 참석 요청.`, //메일제목
    //   SUBJECT: `[HiSEs] 병행작업 승인확정 요청 알림`, //메일제목
    //   CONTENT: ` 아래의 PTW와 병행되는 작업의 승인 확정 요청이 발생되었습니다.
    //             <br> ■ 담당 안전요원 : ${saveParams.safetyEmpNm}
    //             <br> 
    //             <table style="border-collapse : collapse;">
    //               <tr>
    //                 <th style="border: 1px solid #000000;" scope="col">작업일/작업시간</td>
    //                 <th style="border: 1px solid #000000;" scope="col">사업부/부서/조직</td>
    //                 <th style="border: 1px solid #000000;" scope="col">장소(기본/상세)</td>
    //                 <th style="border: 1px solid #000000;" scope="col">호선</td>
    //                 <th style="border: 1px solid #000000;" scope="col">관리감독자(승인자)</td>
    //                 <th style="border: 1px solid #000000;" scope="col">작업(분류/내용)</td>
    //               </tr> 
    //             ` //메일내용
    // }
    


    let my_rcv = await commonSearchApi({
        queryId: "SAFBB0010_SEARCH_02",
        param:{CMPNY_DIV: CmpnyDiv.value, RCV_NO: RcvNo.value},
      })

    let crossed_rcv = await commonSearchApi({
        queryId: "SAFBB0010_SEARCH_03",
        param:{CMPNY_DIV: CmpnyDiv.value, RCV_NO: RcvNo.value},
      })

    


    // 2. 병행작업 관리감독자/작성자
    let mailParam2 = {

      EMAIL: [],
      // SUBJECT: `안녕하세요. ${data.EMP_NM}님 '${currentGrdData.value.MEET_ORG_NM}'의 회의 참석 요청.`, //메일제목
      SUBJECT: `[HiSEs] 병행작업 알림`, //메일제목
      CONTENT: ` 신청(승인)하신 PTW와 병행되는 작업을 다른 조직에서 신청하였습니다.
                <br> 병행조직간 병행여부 확인 및 작업 세부사항(시간, 위치 등) 조율 후 담당 안전요원과 3자 대면하여 승인확정 요청을 해 주시기 바랍니다.
                <br> 
                <br> ■  담당 안전요원 : ${saveParams.safetyEmpNm}
                <br> 
                <br> ■ 신규 허가서 정보 (<strong>${my_rcv.ORESULT_CUR[0].DANG_DIV}</strong>)
                <table style="border-collapse : collapse;">
                  <tr style="background-color:wheat;">
                    <th style="border: 1px solid #000000;" scope="col">작업일/작업시간</td>
                    <th style="border: 1px solid #000000;" scope="col">사업부/부서/조직</td>
                    <th style="border: 1px solid #000000;" scope="col">장소(기본/상세)</td>
                    <th style="border: 1px solid #000000;" scope="col">호선</td>
                    <th style="border: 1px solid #000000;" scope="col">관리감독자(승인자)</td>
                    <th style="border: 1px solid #000000;" scope="col">작업(분류/내용)</td>
                    <th style="border: 1px solid #000000;" scope="col">허가서번호</td>            
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000000;">${my_rcv.ORESULT_CUR[0].WORK_DT}</td>
                    <td style="border: 1px solid #000000;">${my_rcv.ORESULT_CUR[0].ASGN_NM}</td>
                    <td style="border: 1px solid #000000;">${my_rcv.ORESULT_CUR[0].JOB_SPLC} - ${my_rcv.ORESULT_CUR[0].DIV_M}</td>
                    <td style="border: 1px solid #000000;">${my_rcv.ORESULT_CUR[0].WORK_NO}</td>
                    <td style="border: 1px solid #000000;">${my_rcv.ORESULT_CUR[0].MNGR_EMP_NM}</td>
                    <td style="border: 1px solid #000000;">${my_rcv.ORESULT_CUR[0].WRK_DIST}/ ${my_rcv.ORESULT_CUR[0].DANG_DIV}</td>
                    <td style="border: 1px solid #000000;">${my_rcv.ORESULT_CUR[0].RCV_NO}</td>
                  </tr>
                </table>
                <br>
                ■ 병행(충돌)되는 허가서 정보 (<strong> ${my_rcv.ORESULT_CUR[0].DANG_DIV === '화기작업' ? '도장세척작업' : '화기작업' }</strong>)
                <table style="border-collapse : collapse;">
                  <tr style="background-color:wheat;">
                    <th style="border: 1px solid #000000;" scope="col">작업일/작업시간</td>
                    <th style="border: 1px solid #000000;" scope="col">사업부/부서/조직</td>
                    <th style="border: 1px solid #000000;" scope="col">장소(기본/상세)</td>
                    <th style="border: 1px solid #000000;" scope="col">호선</td>
                    <th style="border: 1px solid #000000;" scope="col">관리감독자(승인자)</td>
                    <th style="border: 1px solid #000000;" scope="col">작업(분류/내용)</td>
                  </tr>

                ` //메일내용
    }



    for (let i = 0; i < crossed_rcv.ORESULT_CUR.length; i++){
      
      mailParam2.EMAIL.push(crossed_rcv.ORESULT_CUR[i].MNGR_EMAIL)
      //mailParam2.EMAIL.push('hminq@hd.com')

      let newrow = `   
                <tr>
                  <td style="border: 1px solid #000000;">${crossed_rcv.ORESULT_CUR[i].WORK_DT}</td>
                  <td style="border: 1px solid #000000;">${crossed_rcv.ORESULT_CUR[i].ASGN_NM}</td>
                  <td style="border: 1px solid #000000;">${crossed_rcv.ORESULT_CUR[i].JOB_SPLC} - ${crossed_rcv.ORESULT_CUR[i].DIV_M}</td>
                  <td style="border: 1px solid #000000;">${crossed_rcv.ORESULT_CUR[i].WORK_NO}</td>
                  <td style="border: 1px solid #000000;">${crossed_rcv.ORESULT_CUR[i].MNGR_EMP_NM}</td>
                  <td style="border: 1px solid #000000;">${crossed_rcv.ORESULT_CUR[i].WRK_DIST}/ ${crossed_rcv.ORESULT_CUR[i].DANG_DIV}</td>
                </tr>
              ` //메일내용
      mailParam2.CONTENT += newrow
      // mailParam1.CONTENT += newrow


    }
    
    mailParam2.CONTENT += `</table>  ` 
    // mailParam1.CONTENT += `</table>  ` 


    


    // await commonSendApi(mailParam1).then(res => {
    //     if(res.result.status === "200"){
    //       Message.success('메일을 발송하였습니다.')
    //     }else{
    //       Message.err('메일 발송에 실패했습니다.')
    //     }
    //   }) //메일전송
  

    try {
        await commonSendApi(mailParam2).then(res => {
            if(res.result.status === "200"){
            }else{
              Message.err('메일 발송에 실패했습니다.')
            }
          }) //메일전송

    }catch (error) {
      console.error("메일발송에러:", error)

      return
    }





    // 문자전송
    for (let i = 0; i < crossed_rcv.ORESULT_CUR.length; i++){
      let sendSMSParams = {}
      sendSMSParams.EMPNO_FROM = userStore.empNo
      sendSMSParams.EMPNO_TO   = crossed_rcv.ORESULT_CUR[i].MNGR_EMP_NO,
      sendSMSParams.SYSCODE    = '156'
      sendSMSParams.FROM_P_NO  = '0522039999' 
      sendSMSParams.TO_P_NO    = crossed_rcv.ORESULT_CUR[i].MNGR_HP_NO.replaceAll('-', '')
      sendSMSParams.TITLE  =  "[HiSEs]" + crossed_rcv.ORESULT_CUR[i].WORK_DT + " 작업 예정의 PTW 병행작업 알림 (자세한 내용은 메일 확인 바랍니다.)"

      console.log("sendSMSParams", sendSMSParams)

      if (sendSMSParams.FROM_P_NO &&  sendSMSParams.TO_P_NO ){
        try {
          await commonSendSMS(sendSMSParams)
        }catch (error) {
          console.error("문자발송에러:", error)
          return
        }
      }

    } 


  }
  




const onButtonsClick = (e) => {

if (e.id === "btnClose") {
  close()
}

if (e.id === "btnSettingF") {
  SafeApply()
}

if (e.id === "btnShowCross") {

  if(CrossYN.value === 'N'){
   Message.warn('병행작업이 아닙니다.')
   return
  }

  ShowCross()
}

}

const ShowCross = () => {

  let data = {
    CMPNY_DIV : CmpnyDiv.value,
    RCV_NO : RcvNo.value
  }
  wrkChk.value.openPopup(data)

}




const openEmpPopup = (nm) => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: nm})
} 

const onEmpSelected = (row) => {
  console.log("row", row)
  // if (gbnEmp.value === "job") {
  //   datainer.value.RESP_EMP_NM = row.EMP_NM
  //   datainer.value.RESP_EMP_NO = row.EMP_NO
  //   datainer.value.RESP_HP_NO = row.HND_PHN
  // }

  saveParams.safetyEmpNo  = row.EMP_NO
  saveParams.safetyEmpNm  = row.EMP_NM
  saveParams.safetyDeptNm = row.ASGN_NM
  saveParams.safetyEmail = row.EMAIL


}


const close = () => {
  dialog.value = false
  Page.value = '1'
  dialogWidth.value = '800px';
  dialogHeight.value = (UrgentYN.value ==='Y')&&(CrossYN.value ==='Y') ?  '600px' : '400px' ;

}





const ToNext = () => {
  Page.value = '2'
  dialogWidth.value = '630px';
  dialogHeight.value = '350px';
  console.log('ToNext',Page.value )
}


const SafeApply = async() => {

  if (!saveParams.safetyEmpNo ){
    Message.warn('안전요원을 지정해주세요')
    return
  }

  if (!saveParams.Reason ){
    Message.warn('사유를 입력해 주세요')
    return
  }


  let param = [{
             CMPNY_DIV  : CmpnyDiv.value,        
             RCV_NO     : RcvNo.value,   
             REL_EMP_NO : saveParams.safetyEmpNo,   
             REASON     : saveParams.Reason,   
             USER_ID    : userStore.empNo,
             URGENT_YN   : UrgentYN.value,    
             PARA_YN     : CrossYN.value,
            }]

  console.log('SafeApply param', param)

  await commonExecuteApi({
            queryId: "SAFBA0010_SAVE_09",
            list: param
          })
  
  if (CrossYN.value === 'Y'){
     await SendMail() 
  }

  close() 
  emit("upData")

}


// 그리드 이벤트

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    :width="dialogWidth"
    :height="dialogHeight"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
 
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span v-show = "Page === '1'">안전 승인확정 요청</span>
      <span v-show = "Page === '2'">안전요원/안전팀 설정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5"  v-show = "Page === '1'">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          :button-list="['btnClose']" 
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <v-sheet v-show = "CrossYN === 'Y'">
          <p style = "font-size: 18px; font-weight:bold; margin-bottom: 4px;">병행작업 승인확정 절차 </p>
          <hr style="margin-bottom: 5px;">
              1. 병행조직간 병행여부 확인 및 작업 세부사항(시간, 위치 등) 조율 <br>
              2. 병행조직의 관리감독자는 담당 안전요원과 3자 대면 후 조율 내용 설명 및 승인확정 요청 <br>
              3. 안전요원은 검토 후 승인확정 처리 (승인완료, 승인취소, 반려) <br>
          <hr style="margin-top: 5px;">
        </v-sheet>
        <v-sheet  v-show = "UrgentYN === 'Y'" class="my-6">
          <p style = "font-size: 18px; font-weight:bold; margin-bottom: 4px;">긴급신청 승인확정 절차 </p>
          <hr style="margin-bottom: 5px;">
              1. 담당 안전요원 대면 후 긴급작업 내용(사유) 설명 및 승인확정 요청 <br>
              2. 안전요원은 검토 후 승인확정 처리 (승인완료, 반려) <br>
          <hr style="margin-top: 5px;">
        </v-sheet>
        <v-sheet >
          <div class="py-2 d-flex  flex-column align-center justify-center">
            <span  style = "font-size: 18px; font-weight:bold; margin-bottom: 5px;"> 위 절차에 대해 인지하였고, 안전 승인확정 요청을 계속 진행하시겠습니까? </span>
            <div>   
              <v-btn 
              style="width: 110px; height: 40px;"
              @click="ToNext"> 예 (진행) </v-btn>

              <v-btn 
              style="width: 110px; height: 40px;"
              @click="close"> 아니오 (닫기) </v-btn>        

          </div>

        </div>
        </v-sheet>
      </v-card-text>
    </v-card>

    <v-card class="pa-0 fill-height rounded-b-5"  v-show = "Page === '2'">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnShowCross', 'btnSettingF','btnClose']" 
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">


        <v-sheet  class="mb-2">
          <i-input
              :label="$t('안전요원')"
              label-width="60px"
              width="200px"
              margin="10px"
              placeholder="안전요원"
              v-model="saveParams.safetyEmpNm"
              @click:appendInner="openEmpPopup()"
              append-inner-icon="mdi-magnify"
              @keydown.enter="
              (e) => {
                openEmpPopup(saveParams.safetyEmpNm);
              }
            "
            />
        </v-sheet>

        <v-sheet class="mb-2"> 
          <i-input
          :label="$t('안전팀')"
          label-width="60px"
          width="400px"
          v-model="saveParams.safetyDeptNm"
          disabled
          
          />
        </v-sheet>
        
        <v-sheet class="mb-2"> 
          <i-input
          :label="$t('신청 사유')"
          label-width="60px"
          width="400px"
          v-model="saveParams.Reason"
          />
        </v-sheet>


        <v-sheet class="mb-2 mt-1" style="font-size: 13px; color: red"> 
          ※ 긴급작업의 목적에 부합하지 않는 단순 지연 신청은 반려될 수 있습니다. 사유를 상세히 기술해 주시기 바랍니다.
          <br>
          ※ 긴급/병행작업 신청 후 '안전확정 대기' 상태에서도 허가서를 출력할 수 있습니다. 안전확정 이전에 임시로 출력한 허가서를 무단으로 사용해 작업을 진행할 경우 불이익이 발생할 수 있으니 유의하시기 바랍니다.
        </v-sheet>




      </v-card-text>
    </v-card>
  </VDialog>


  <EmpPopup ref="empPopup" @selected="onEmpSelected" />
  <WrkChkPopUp ref="wrkChk" />

</template>

<style scoped lang="scss">
.content-area {
  position: relative;

  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
