<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 허가서 작성 팝업  병행작업목록 -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { useUserStore } from "@hiway/stores/user"
import Message from "@hiway/utils/notify"
import { commonSearchApi ,   commonSearchTransaction, commonExecuteApi} from "@hiway/api/commonApi"
import SAFBA0010PopUp1 from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1.vue"
const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const emit = defineEmits(["upData"])
const datainer = reactive([])
const grdTitle = ref(null)
const grdMain = ref(null)
const safba00101 = ref(null)
const intCode = () => {
  Promise.all([]).then((res) => {})
}
const menuTitle = ref(null)

const refresh = () => {
  commonSearchApi({
      queryId: "EDUDB0040_TAB03_SEARCH_02",
      param: {CMPNY_DIV : 'HHI'},
    }).then(async(res) => {

      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

      for(let i = 0 ;  i < res.ORESULT_CUR.length ; i++){
        let param = {}
        param.request_id  = res.ORESULT_CUR[i].REQUEST_ID
        console.log("param: ", param)

        let res2  = await commonSearchTransaction(param)
        console.log("res2.status: ", res2.status)

        if(res2.status === 'SUCCESS'){
          console.log("SUCCESS")
          grdMain.value
                .getDataProvider()
                .setValue(i, 'STATUS_KAKAO', 'Y')
        }
        else{
          grdMain.value
                .getDataProvider()
                .setValue(i, 'STATUS_KAKAO', 'N')
        }
      }
    })

}


const openPopup = async () => {
  dialog.value = true
  console.log("OPEND")


  
  vm.$nextTick(() => {
    commonSearchApi({
      queryId: "EDUDB0040_TAB03_SEARCH_02",
      param: {CMPNY_DIV : 'HHI'},
    }).then(async(res) => {

      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

      for(let i = 0 ;  i < res.ORESULT_CUR.length ; i++){
        let param = {}
        param.request_id  = res.ORESULT_CUR[i].REQUEST_ID
        console.log("param: ", param)

        let res2  = await commonSearchTransaction(param)
        console.log("res2.status: ", res2.status)

        if(res2.status === 'SUCCESS'){
          grdMain.value
                .getDataProvider()
                .setValue(i, 'STATUS_KAKAO', 'Y')
        }
        else{
          console.log("FAIL ")
          grdMain.value
                .getDataProvider()
                .setValue(i, 'STATUS_KAKAO', 'N')
        }

      }

    })
  })




}

const onButtonsClick = (e) => {
  if (e.id === "btnClose") {
    close()
  }
}

const close = () => {
  dialog.value = false
}

// 그리드
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    
    {
      fieldName: "YEAR",
      dataType: "text",
      width: "50",
      header: { text: t("년") },
    },
    {
      fieldName: "MNTH",
      dataType: "text",
      width: "50",
      header: { text: t("월") },
    },

    {
      fieldName: "EMP_NAME",
      dataType: "text",
      width: "80",
      header: { text: t("이름") },
      editable: false,
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "80",
      header: { text: t("사번") },
    },
    {
      fieldName: "POINT_SEQ",
      dataType: "text",
      width: "70",
      header: { text: t("SEQ") },
    },
    {
      fieldName: "CHANGE_POINT",
      dataType: "text",
      width: "80",
      header: { text: t("금액") },
    },
    
    {
      fieldName: "CHANGE_DATE",
      dataType: "text",
      width: "140",
      header: { text: t("전환날짜") },
    },

    {
      fieldName: "REQUEST_ID",
      dataType: "text",
      width: "170",
      header: { text: t("REQUEST_ID") },
    },
    
    {
      fieldName: "STATUS_HHI",
      dataType: "text",
      width: "90",
      header: { text: t("HHI") },
    },

    {
      fieldName: "STATUS_KAKAO",
      dataType: "text",
      width: "90",
      header: { text: t("KAKAOPAY") },
    },
    {
      fieldName: "ACT1",
      dataType: "text",
      width: "100",
      header: { text: t("ACT1") },
      renderer:{ type:"button" },
    },
    {
      fieldName: "ACT2",
      dataType: "text",
      width: "100",
      header: { text: t("ACT2") },
      renderer:{ type:"button" },
    },
    {
      fieldName: "TARGET_DATE",
      dataType: "text",
      visible: false,
      header: { text: t('') },
    },

    { fieldName: "BSNS_CD", dataType: "text", visible: false, header: { text: t('') }, },
    { fieldName: "DEPT_CD", dataType: "text", visible: false, header: { text: t('') }, },
    { fieldName: "ASGN_CD", dataType: "text", visible: false, header: { text: t('') }, },
    { fieldName: "ASGN_NAME", dataType: "text", visible: false, header: { text: t('') }, },
    { fieldName: "ORGN_DIV", dataType: "text", visible: false, header: { text: t('') }, },




  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields



const onAllFl = () => {

  
  vm.$swal({
    title: t('KAKAOPAY 컬럼이 N인 값들은 모두 적립실패(FL) 처리가 되고, <br> 운영자 지급 탭에 반환 건이 추가되며, 지급확정을 누르면 반환처리가 됩니다. <br> 실패 처리하시겠습니까? '),
    showCancelButton: true,
    }).then(res => {
    if(res.isConfirmed) {

      for(let i=0; i < grdMain.value.getGridView().getItemCount();i++){
        let innerData = grdMain.value.getGridView().getValues(i)
        console.log('innerData', innerData)
        if (innerData.KAKAOPAY_OK === 'N'){
          let saveParams1 = []
          let data1 = {}
          data1.CMPNY_DIV = 'HHI'
          data1.YEAR = dayjs().format('YYYY')
          data1.MNTH = dayjs().format('MM')
          data1.EMP_NO = innerData.EMP_NO
          data1.PAYMENT_POINT_SEQ  =  '0'
          data1.BSNS_CD  = innerData.BSNS_CD
          data1.DEPT_CD  = innerData.DEPT_CD
          data1.ASGN_CD  = innerData.ASGN_CD
          data1.ASGN_NAME  =  innerData.ASGN_NAME
          data1.EMP_NAME  =   innerData.EMP_NAME
          data1.ORGN_DIV  =  innerData.ORGN_DIV
          data1.PAYMENT_REASON = '안전페이 전환 실패분 재적립'
          data1.PAYMENT_DATE =  dayjs(new Date).format('YYYY-MM-DD')	// 지급일시
          data1.PAYMENT_POINT =  innerData.CHANGE_POINT
          data1.PAYMENT_USER_ID =  userStore.empNo
          data1.PAYMENT_USER_IP =  userStore.clientIp
          data1.PAYMENT_CONFIRM_YN =  'N'
          data1.RECOVERY_YN =  'N'
          data1.RECOVERY_REASON =  ''
          data1.RECOVERY_DATE = ''
          data1.RECOVERY_USER_ID =  ''
          data1.RECOVERY_USER_IP = ''
          data1.RECOVERY_CONFIRM_YN = ''
          data1.REMARK =  ''
          data1.INSERT_USER_ID =  userStore.empNo
          data1.INSERT_DATE = ''
          data1.UPDATE_USER_ID = ''
          data1.UPDATE_DATE  =  ''

          let saveParams2 = []
          let data2 = {}
          data2.CMPNY_DIV = 'HHI'
          data2.YEAR = dayjs().format('YYYY')
          data2.MNTH = dayjs().format('MM')
          data2.EMP_NO = innerData.EMP_NO
          data2.POINT_SEQ = innerData.POINT_SEQ
          data2.KAKAOPAY_OK = 'FL'
          data2.KAKAOPAY_FL_COD = '운영자확인' +'('+ userStore.empNo+')'

          saveParams1.push(data1)
          saveParams2.push(data2)

          commonExecuteApi({ queryId : 'EDUDB0040_TAB03_SAVE_01', list: saveParams1 }).then(res => {
            if(res.result.status ==='200'){
              commonExecuteApi({ queryId : 'EDUDB0040_TAB03_SAVE_03', list: saveParams2 }).then(res2 => {
                
                Message.success('일괄 적립실패(FL) 처리되었습니다.')
              
              })
            }
          })

        }
      }

      
      refresh()



    }
  })






}



const onCellClicked = (grd, clickData) => {

  let innerData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    // 실패처리 
  if(clickData.fieldName === 'ACT1'){

    if(innerData.STATUS_KAKAO === 'Y'){
      Message.err('거래가 성공된 건입니다. 실패처리가 불가능합니다.')
      return
    }


    console.log("ACT1")
    let saveParams1 = []
    let data1 = {}
    data1.CMPNY_DIV = 'HHI'
    data1.YEAR = dayjs().format('YYYY')
    data1.MNTH = dayjs().format('MM')
    data1.EMP_NO = innerData.EMP_NO
    data1.PAYMENT_POINT_SEQ  =  '0'
    data1.BSNS_CD  = innerData.BSNS_CD
    data1.DEPT_CD  = innerData.DEPT_CD
    data1.ASGN_CD  = innerData.ASGN_CD
    data1.ASGN_NAME  =  innerData.ASGN_NAME
    data1.EMP_NAME  =   innerData.EMP_NAME
    data1.ORGN_DIV  =  innerData.ORGN_DIV
    data1.PAYMENT_REASON = '안전페이 전환 실패분 재적립'
    data1.PAYMENT_DATE =  dayjs(new Date).format('YYYY-MM-DD')	// 지급일시
    data1.PAYMENT_POINT =  innerData.CHANGE_POINT
    data1.PAYMENT_USER_ID =  userStore.empNo
    data1.PAYMENT_USER_IP =  userStore.clientIp
    data1.PAYMENT_CONFIRM_YN =  'N'
    data1.RECOVERY_YN =  'N'
    data1.RECOVERY_REASON =  ''
    data1.RECOVERY_DATE = ''
    data1.RECOVERY_USER_ID =  ''
    data1.RECOVERY_USER_IP = ''
    data1.RECOVERY_CONFIRM_YN = ''
    data1.REMARK =  ''
    data1.INSERT_USER_ID =  userStore.empNo
    data1.INSERT_DATE = ''
    data1.UPDATE_USER_ID = ''
    data1.UPDATE_DATE  =  ''

    saveParams1.push(data1)


    let saveParams2 = []
    let data2 = {}
    data2.CMPNY_DIV = 'HHI'
    data2.YEAR = dayjs().format('YYYY')
    data2.MNTH = dayjs().format('MM')
    data2.EMP_NO = innerData.EMP_NO
    data2.POINT_SEQ = innerData.POINT_SEQ
    data2.KAKAOPAY_OK = 'FL'
    data2.KAKAOPAY_FL_COD = '운영자확인' +'('+ userStore.empNo+')'

    saveParams2.push(data2)


    vm.$swal({
    title: t('해당건은 적립실패(FL) 처리가 되고, <br> 운영자 지급 탭에 반환 건이 추가되며, 지급확정을 누르면 반환처리가 됩니다. <br> 실패 처리하시겠습니까? '),
    showCancelButton: true,
    }).then(res => {
    if(res.isConfirmed) {
      commonExecuteApi({ queryId : 'EDUDB0040_TAB03_SAVE_01', list: saveParams1 }).then(res => {
        if(res.result.status ==='200'){
          commonExecuteApi({ queryId : 'EDUDB0040_TAB03_SAVE_03', list: saveParams2 }).then(res2 => {
            refresh()
            Message.success('적립실패(FL) 처리되었습니다.')
           
          })
        }
      })
    }
  })




  }
  else if(clickData.fieldName === 'ACT2'){

    if(innerData.STATUS_KAKAO === 'N'){
      Message.err('거래가 실패된 건입니다. 성공처리가 불가능합니다.')
      return
    }

    vm.$swal({
    title: t('적립성공(SU) 처리하시겠습니까? '),
    showCancelButton: true,
    }).then(res => {
      if(res.isConfirmed) {
        let saveParams2 = []
        let data2 = {}
        data2.CMPNY_DIV = 'HHI'
        data2.YEAR = dayjs().format('YYYY')
        data2.MNTH = dayjs().format('MM')
        data2.EMP_NO = innerData.EMP_NO
        data2.POINT_SEQ = innerData.POINT_SEQ
        data2.KAKAOPAY_OK = 'SU'
        data2.KAKAOPAY_FL_COD = '운영자확인' +'('+ userStore.empNo+')'

        saveParams2.push(data2)


        commonExecuteApi({ queryId : 'EDUDB0040_TAB03_SAVE_03', list: saveParams2 }).then(res2 => {
          refresh()
          Message.success('적립성공(SU) 처리되었습니다.')
          
        })
    }



    })



   





    console.log("ACT2")

  }





}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1200"
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
      <span>HD안전페이 미확인 거래 목록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
        <v-btn
          @click="onAllFl">
          일괄실패(FL)처리
        </v-btn>

      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <v-card class="mt-3">
          <v-card-text class="pa-0">
            <RealGrid
              class="mt-1"
              ref="grdMain"
              style="height: 300px"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              @onCellClicked="onCellClicked"
            />
          </v-card-text>
        </v-card>


      </v-card-text>
    </v-card>
    <SAFBA0010PopUp1 ref="safba00101" @upData="upData" />
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (615px - 12px));
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
