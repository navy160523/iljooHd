<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 허가서 작성 팝업    -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import IMenuTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import {
  commonSearchApi, 
  commonExecuteApi,
  commonSendApi, 
  commonSendSMS,
} from "@hiway/api/commonApi"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import _ from "lodash"
const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const emit = defineEmits(["upData"])
const grdMain1 = ref(null)
const grdMain2 = ref(null)

const grdshow = ref(false) // 병행체크된 건이 있으면 true

// 재조회를 위한 변수 저장
const tmp_cmpny_div = ref('')
const tmp_rcv_no =  ref('')

const CrossYN = ref('')

const openPopup = async (cmpny_div, rcv_no, cross_yn) => {
  console.log("cmpny_div", cmpny_div)
  console.log("rcv_no", rcv_no)
  dialog.value = true
  tmp_cmpny_div.value = cmpny_div
  tmp_rcv_no.value = rcv_no
  CrossYN.value = cross_yn
  console.log('CrossYN', CrossYN.value)
  await initData(cmpny_div, rcv_no)



}


const initData = async (cmpny_div, rcv_no) => {

  await commonSearchApi({
      queryId: "SAFBB0010_SEARCH_02",
      param: {CMPNY_DIV: cmpny_div,  RCV_NO: rcv_no},
    }).then((res) => {
      grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR)

    })

  await commonSearchApi({
      queryId: "SAFBB0010_SEARCH_03",
      param: {CMPNY_DIV: cmpny_div,  RCV_NO: rcv_no},
    }).then((res) => {
      grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)

      if (res.ORESULT_CUR.length === 0) {
        grdshow.value = false
      }else{
        grdshow.value = true
      }

    })


}




const close = () => {
  dialog.value = false
  emit("upData")
}



// 버튼이벤트
const onButtonsClick = (btn) => {


    if (btn.id  == "btnClose") {
      console.log('닫기')
      close()
    }


 }


// 메일 발송
const SendMail = async (CmpnyDiv, RcvNo,  MNGR_EMAIL, RESULT, user_nm, user_phn) => {

  console.log(user_nm, user_phn)
  // 2. 대상작업 관리감독자/작성자


  let mailParam2 = {
    EMAIL: [MNGR_EMAIL],
    SUBJECT: `[Hi-SEs] 병행작업 ${RESULT} 처리 결과 알림`, //메일제목
    CONTENT: ` : 아래의 신청하신 PTW의 ${RESULT}  처리 결과를 안내 드립니다. 
              <br> 실제 병행작업이 발생되지 않도록 안전에 각별히 유의해 주시기 바랍니다. (모든 병행작업 정보 제공)
              <br> ${RESULT} 처리자: ${user_nm} [ ${user_phn} ]
              <br> 
              <table style="border-collapse : collapse;">
                <tr style="background-color:wheat;">
                  <th style="border: 1px solid #000000;" scope="col">작업일/작업시간</td>
                  <th style="border: 1px solid #000000;" scope="col">사업부/부서/조직</td>
                  <th style="border: 1px solid #000000;" scope="col">장소(기본/상세)</td>
                  <th style="border: 1px solid #000000;" scope="col">호선</td>
                  <th style="border: 1px solid #000000;" scope="col">관리감독자(승인자)</td>
                  <th style="border: 1px solid #000000;" scope="col">작업 분류</td>
                  <th style="border: 1px solid #000000;" scope="col">작업 내용</td>
                  <th style="border: 1px solid #000000;" scope="col">작업 상세</td>
                </tr>
              ` //메일내용
  }



  let rcv = await commonSearchApi({
          queryId: "SAFBB0010_SEARCH_02",
          param:{CMPNY_DIV: CmpnyDiv, RCV_NO: RcvNo},
        })

      

  for (let i = 0; i < rcv.ORESULT_CUR.length; i++){

    mailParam2.EMAIL.push(rcv.ORESULT_CUR[i].MNGR_EMAIL)
    mailParam2.EMAIL.push(rcv.ORESULT_CUR[i].MNGR_EMAIL)

    let newrow = `   
              <tr>
                <td style="border: 1px solid #000000;">${rcv.ORESULT_CUR[i].WORK_DT}</td>
                <td style="border: 1px solid #000000;">${rcv.ORESULT_CUR[i].ASGN_NM}</td>
                <td style="border: 1px solid #000000;">${rcv.ORESULT_CUR[i].JOB_SPLC} - ${rcv.ORESULT_CUR[i].DIV_M}</td>
                <td style="border: 1px solid #000000;">${rcv.ORESULT_CUR[i].WORK_NO}</td>
                <td style="border: 1px solid #000000;">${rcv.ORESULT_CUR[i].MNGR_EMP_NM}</td>
                <td style="border: 1px solid #000000;">${rcv.ORESULT_CUR[i].DANG_DIV}</td>
                <td style="border: 1px solid #000000;">${rcv.ORESULT_CUR[i].WRK_DIST}</td>
                <td style="border: 1px solid #000000;">${rcv.ORESULT_CUR[i].WORK_DETAIL}</td>
              </tr>
            ` //메일내용
    mailParam2.CONTENT += newrow



  }

  mailParam2.CONTENT += `</table>  ` 



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
  for (let i = 0; i < rcv.ORESULT_CUR.length; i++){

    if (rcv.ORESULT_CUR[i].MNGR_HP_NO){

        let sendSMSParams = {}
        sendSMSParams.EMPNO_FROM = userStore.empNo
        sendSMSParams.EMPNO_TO   = rcv.ORESULT_CUR[i].MNGR_EMP_NO,
        sendSMSParams.SYSCODE    = '156'
        sendSMSParams.FROM_P_NO  = '0522039999' 
        sendSMSParams.TO_P_NO    =  rcv.ORESULT_CUR[i].MNGR_HP_NO.replaceAll('-', '')


        if (rcv.ORESULT_CUR[i].WORK_NO) {
          sendSMSParams.TITLE  =  "[HiSEs] 병행작업 " + RESULT + "처리 결과 알림 / ("  + rcv.ORESULT_CUR[i].WORK_NO + "호선) " + "\r" 
          rcv.ORESULT_CUR[i].WRK_DIST
        }
        else{
          sendSMSParams.TITLE  =  "[HiSEs] 병행작업 " + RESULT + "처리 결과 알림 / (" + rcv.ORESULT_CUR[i].JOB_SPLC + ")" + "\r" 
          rcv.ORESULT_CUR[i].WRK_DIST
        }
        sendSMSParams.TITLE = sendSMSParams.TITLE.substr(0,40) + '..'// 80byte 제한(40자)
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

}






const onCellClicked01 = async (grid, clickData) => {

  let selectRow = grdMain1.value.getDataProvider().getJsonRow(clickData.dataRow)

  let saveParam = [{}]
  saveParam[0].CMPNY_DIV = selectRow.CMPNY_DIV
  saveParam[0].RCV_NO = selectRow.RCV_NO
  saveParam[0].REL_COMMENT =  '' //searchParams.REL_COMMENT   // 추후개발
  saveParam[0].USER_ID = userStore.empNo


  // 안전 승인 
  if(clickData.fieldName === 'CHANGE1'){
    saveParam[0].STATUS = '50'

    vm.$swal({ 
        title: t('승인하시겠습니까?'), 
        showCancelButton: true,
      }).then(ck => {
        if (ck.isConfirmed === true) {
          commonExecuteApi({ queryId: 'SAFBB0010_SAVE_01',  list: saveParam,}).then(res => {
            if (res.result.status === '200') {
              Message.success(t('승인되었습니다.'))
            }

            if (selectRow.PARA_YN === 'Y'){
              SendMail(selectRow.CMPNY_DIV, selectRow.RCV_NO,  selectRow.MNGR_EMAIL , '승인확정', userStore.empNm, userStore.hndPhn)
            }
            initData(tmp_cmpny_div.value, tmp_rcv_no.value)


          }).catch(err => {
            return Message.success(err)
          }).finally(() => {

          })
        }
      })
  }

  // 안전 반려
  else if (clickData.fieldName === 'CHANGE2'){
    saveParam[0].STATUS = '31'

    vm.$swal({ 
        title: t('반려하시겠습니까?'), 
        showCancelButton: true,
      }).then(ck => {
        if (ck.isConfirmed === true) {
          commonExecuteApi({ queryId: 'SAFBB0010_SAVE_01',  list: saveParam,}).then(res => {
            if (res.result.status === '200') {
              Message.success(t('반려되었습니다.'))
            }
            if (selectRow.PARA_YN === 'Y'){
              SendMail(selectRow.CMPNY_DIV, selectRow.RCV_NO,  selectRow.MNGR_EMAIL , '반려', userStore.empNm, userStore.hndPhn)
            }
            initData(tmp_cmpny_div.value, tmp_rcv_no.value)
          }).catch(err => {
            return Message.success(err)
          }).finally(() => {

          })
        }
      })
  }
}

const onCellClicked02 = async (grid, clickData) => {

let selectRow = grdMain2.value.getDataProvider().getJsonRow(clickData.dataRow)

let saveParam = [{}]
saveParam[0].CMPNY_DIV = selectRow.CMPNY_DIV
saveParam[0].RCV_NO = selectRow.RCV_NO
saveParam[0].REL_COMMENT =  '' //searchParams.REL_COMMENT   // 추후개발
saveParam[0].USER_ID = userStore.empNo


// 안전 승인 
if(clickData.fieldName === 'CHANGE1'){
  saveParam[0].STATUS = '50'

  vm.$swal({ 
      title: t('승인하시겠습니까?'), 
      showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        commonExecuteApi({ queryId: 'SAFBB0010_SAVE_01',  list: saveParam,}).then(res => {
          if (res.result.status === '200') {
            Message.success(t('승인되었습니다.'))
          }
          initData(tmp_cmpny_div.value, tmp_rcv_no.value)
        }).catch(err => {
          return Message.success(err)
        }).finally(() => {

        })
      }
    })
}

// 안전 반려
else if (clickData.fieldName === 'CHANGE2'){
  saveParam[0].STATUS = '31'

  vm.$swal({ 
      title: t('반려하시겠습니까?'), 
      showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        commonExecuteApi({ queryId: 'SAFBB0010_SAVE_01',  list: saveParam,}).then(res => {
          if (res.result.status === '200') {
            Message.success(t('반려되었습니다.'))
          }
          SendMail(selectRow.CMPNY_DIV, selectRow.RCV_NO,  selectRow.MNGR_EMAIL , '반려', userStore.empNm, userStore.hndPhn)
          initData(tmp_cmpny_div.value, tmp_rcv_no.value)
        }).catch(err => {
          return Message.success(err)
        }).finally(() => {

        })
      }
    })
}
}





//그리드 속성셋팅
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false } },

  keys: ["CMPNY_DIV"],
  fields: [
    {
      header: { text: t(" ") },
      fieldName: "CHANGE1",
      dataType: "text",
      width: "50",
      renderer:{ type:"button" }
    },  
    {
      header: { text: t(" ") },
      fieldName: "CHANGE2",
      dataType: "text",
      width: "50",
      renderer:{ type:"button" }
    }, 
    {
      header: { text: t("신청사유") },
      fieldName: "REASON_U_P",
      dataType: "text",
      width: "200",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "STATUS_NM",
      width: "80",
      header: { text: t("진행상태") },
      dataType: "text",
    },
    {
      header: { text: t("신청일") },
      fieldName: "REQ_DT",
      dataType: "text",
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM-DD") : null
      },
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM",
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM",
          includedFormat: true,
        },
      },
    },
    {
      fieldName: "WORK_DT",
      dataType: "text",
      width: "140",
      header: { text: t("작업기간") },
    },
    // 작업
    {
      fieldName: "WRK_DIST",
      dataType: "text",
      width: "100",
      header: { text: t("분류") },

    },
    {
      fieldName: "DANG_DIV",
      dataType: "text",
      width: "100",
      header: { text: t("내용") },
      styleName: "left-column",
    },
    {
      fieldName: "PLACE",
      dataType: "text",
      width: "200",
      header: { text: t("장소") },
    },
    {
      fieldName: "DEPT_NM",
      dataType: "text",
      width: "100",
      header: { text: t("부서") },
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "100",
      header: { text: t("조직") },

    },
    {
      fieldName: "RESP_EMP_NM",
      dataType: "text",
      width: "120",
      header: { text: t("책임자") },
    },
    {
      fieldName: "MNGR_EMP_NM",
      dataType: "text",
      width: "120",
      header: { text: t("관리감독자") },
    },
    {
      header: { text: t("허가번호") },
      fieldName: "RCV_NO",
      dataType: "text",
      width: "130",
      mergeRule: { criteria: "value" },
    },

    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "MNGR_EMAIL", dataType: "text", visible: false },
    { fieldName: "PARA_YN", dataType: "text", visible: false },
    { fieldName: "URGENT_YN", dataType: "text", visible: false },
  ],
  columns: [],
  columnLayout: [
    "CHANGE1",
    "CHANGE2",
    "REASON_U_P",
    "STATUS_NM",
    "REQ_DT",
    "WORK_DT",
    "WRK_DIST", 
    "DANG_DIV",
    "PLACE",
    "DEPT_NM",
    "ASGN_NM",
    "RESP_EMP_NM",
    "MNGR_EMP_NM",
    "RCV_NO",

  ],
})

grdProps1.columns = grdProps1.fields







//그리드 속성셋팅
//그리드 속성셋팅
const grdProps2 = reactive({
  gridViewOption: { edit: { editable: false } },

  keys: ["CMPNY_DIV"],
  fields: [
    {
      header: { text: t(" ") },
      fieldName: "CHANGE1",
      dataType: "text",
      width: "50",
      renderer:{ type:"button" }
    },  
    {
      header: { text: t(" ") },
      fieldName: "CHANGE2",
      dataType: "text",
      width: "50",
      renderer:{ type:"button" }
    }, 
    // {
    //   header: { text: t("병행여부") },
    //   fieldName: "PARA_YN",
    //   dataType: "text",
    //   width: "60",
    // },    
    // {
    //   header: { text: t("긴급여부") },
    //   fieldName: "URGENT_YN",
    //   dataType: "text",
    //   width: "60",
    // },
    {
      fieldName: "STATUS_NM",
      width: "80",
      header: { text: t("진행상태") },
      dataType: "text",
    },

    {
      header: { text: t("신청일") },
      fieldName: "REQ_DT",
      dataType: "text",
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format("YYYY-MM-DD") : null
      },
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM",
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM",
          includedFormat: true,
        },
      },
    },
    {
      fieldName: "WORK_DT",
      dataType: "text",
      width: "140",
      header: { text: t("작업기간") },
    },
    // 작업
    {
      fieldName: "WRK_DIST",
      dataType: "text",
      width: "100",
      header: { text: t("분류") },

    },
    {
      fieldName: "DANG_DIV",
      dataType: "text",
      width: "100",
      header: { text: t("내용") },
      styleName: "left-column",
    },
    {
      fieldName: "PLACE",
      dataType: "text",
      width: "200",
      header: { text: t("장소") },
    },
    {
      fieldName: "DEPT_NM",
      dataType: "text",
      width: "100",
      header: { text: t("부서") },
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "100",
      header: { text: t("조직") },

    },
    {
      fieldName: "RESP_EMP_NM",
      dataType: "text",
      width: "120",
      header: { text: t("책임자") },
    },
    {
      fieldName: "MNGR_EMP_NM",
      dataType: "text",
      width: "120",
      header: { text: t("관리감독자") },
    },
 
    {
      header: { text: t("허가번호") },
      fieldName: "RCV_NO",
      dataType: "text",
      width: "130",
      mergeRule: { criteria: "value" },
    },

    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },

  ],
  columns: [],
  columnLayout: [
    "CHANGE1",
    "CHANGE2",
    "STATUS_NM",
    "REQ_DT",
    "WORK_DT",
    "WRK_DIST", 
    "DANG_DIV",
    "PLACE",
    "DEPT_NM",
    "ASGN_NM",
    "RESP_EMP_NM",
    "MNGR_EMP_NM",
    "RCV_NO",

  ],
})

grdProps2.columns = grdProps2.fields


defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    transition="dialog-bottom-transition"
    fullscreen
  >
    <div class="title-bar" @mousedown="startDragging">위험작업 허가서작성</div>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2 d-flex align-center justify-end">
        <IMenuTitle
          ref="menuTitle"
          :button-list="[
            'btnClose'
          ]"
         @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card class="content-area">
        <!-- 기본정보 --> 
        <v-card class="mb-3 mx-3 popUp-input-Form">
          <v-card-title class="pa-0">
            <IGridTitle
              ref="grdTitle"
              :title="$t('대상 허가서 정보')"
            >
              <template #editors />
            </IGridTitle>
          </v-card-title>
          
          <v-card-text class="pa-0">
            <RealGrid
              class="mt-1"
              ref="grdMain1"
              style="height: 80px"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              @onCellClicked="onCellClicked01"
            />
          </v-card-text>


        </v-card>
        <!-- 허가서 목록 -->
        <v-card class="mb-3 mx-3 popUp-input-Form" v-if = "CrossYN === 'Y'">
          <v-card-title class="pa-0">
            <IGridTitle
              ref="grdTitle"
              :title="$t('병행 허가서 목록')"
            >
              <template #editors />
            </IGridTitle>
          </v-card-title>
          <v-card-text class="pa-0" v-show = "grdshow">
            <RealGrid
              class="mt-1"
              ref="grdMain2"
              style="height: 300px"
              :grid-view-option="grdProps2.gridViewOption"
              :keys="grdProps2.keys"
              :fields="grdProps2.fields"
              :columns="grdProps2.columns"
              @onCellClicked="onCellClicked02"
            />
          </v-card-text>

          <v-card-text class="pa-4 pt-0 content-area" v-show = "!grdshow">
            <v-card class="mt-3">
              <v-card-text class="pa-10 d-flex align-center justify-center" style="font-size: large;">
                기존 병행되었던 작업이 취소 되었습니다. 
              </v-card-text>
            </v-card>
          </v-card-text>




        </v-card>





      </v-card>
    </v-card>
    
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 139px);
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
h4 {
  font-size: 18px;
  font-weight: 700;
  color: #222;
}

.addInfo {
  margin-right: 30px;
  height: 71px;
}
</style>
