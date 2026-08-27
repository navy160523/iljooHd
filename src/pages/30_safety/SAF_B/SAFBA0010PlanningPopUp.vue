<!--    한민규    -->
<!--  프로그램명 : 허가서 일정제외팝업 -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest , commonSearchApi, commonExecuteApi } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { useUserStore } from "@hiway/stores/user"
import Message from "@hiway/utils/notify"

import SAFBA0010PopUp1 from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1.vue"

const emit = defineEmits(["upData"]) ;const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const datainer = reactive([])
const grdTitle = ref(null)
const grdMain = ref(null)
const safba00101 = ref(null)

const intCode = () => {
  Promise.all([]).then(res => {})
}

const menuTitle = ref(null)
const CmpnyDiv  = ref('')
const RcvNo  = ref('')
const MngrEmpNo = ref('')
const CancelRemark = ref('')


const showCancleRemark = ref(false) // 모달창 flag
const TmpWorkDate = ref(false)     // 선택된 workDate


const Auth = ref(false) 



const initdata = () => {
  console.log("initdata: ",CmpnyDiv.value ,  RcvNo.value  )

  commonSearchApi({
    queryId: "SAFBA0010_SEARCH_23",
    param: { CMPNY_DIV : CmpnyDiv.value ,  RCV_NO: RcvNo.value },
  }).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
      var retVal = {}
      var val = grid.getValue(item.index, "CANCELED_YN")
      if (val === 'Y') {
        retVal.style = { background: "#dbdbdb" }
      }
      
      return retVal
    })

    grdMain.value.getGridView().setDisplayOptions({ useFocusClass: false })
  })


}



const openPopup = async popupParam => {
  dialog.value = true
  console.log(popupParam, "popupParam")
  console.log(popupParam.DEPT_CD, "popupParam.DEPT_CD")
  CmpnyDiv.value = popupParam.CMPNY_DIV
  RcvNo.value = popupParam.RCV_NO
  MngrEmpNo.value = popupParam.MNGR_EMP_NO

  await initdata()

  let SAFCLVR = await commonSearchApi({ queryId : 'SAFBA0010_SEARCH_25', param: { EMP_NO: userStore.empNo } })
  let SAFCLVR_YN = SAFCLVR.ORESULT_CUR[0].SAFCLVR_YN

  // 작업제외 권한
  Auth.value = 
   (MngrEmpNo.value === userStore.empNo)  
  || (userStore.authGrpCd.includes('HIWAYGRP00001'))  // 관리자
  || (userStore.authGrpCd.includes('GRP00431'))       // PTW 작업제외 그룹
  || (userStore.authGrpCd.includes('GRP00392') && popupParam.DEPT_CD === userStore.deptCd) // HSE추진자  본인부서
  || (SAFCLVR_YN === 'Y' && popupParam.DEPT_CD === userStore.deptCd) // 세잎클로버  본인부서
  || (userStore.authGrpCd.includes('GRP00380')) //PTW모듈 관리자그룹

  console.log("Auth.value", Auth.value )
}

const onButtonsClick = e => {
  if (e.id === "btnClose") {
    close()
  }
}


const saveData = async(WorkDate, CancelRemark) => {
  let saveParam = {
    CMPNY_DIV : CmpnyDiv.value,
    RCV_NO : RcvNo.value,
    WORK_DATE : WorkDate,
    CANCELED_YN : 'Y' ,
    CANCELED_REMARK : CancelRemark,
    USER_ID : userStore.authGrpCd.includes('GRP00380') ? 'PTW_MANAGER': userStore.empNo,
  }

  let ck = await vm.$swal({
    title: t(`${WorkDate}에 예정된 작업을 일정에서 제외 하시겠습니까? <br>( 복구는 불가능합니다. )`),
    showCancelButton: true,
  })

  if (ck.isConfirmed) {
    
    commonExecuteApi({ queryId: 'SAFBA0010_SAVE_10',  list: [saveParam] }).then(res => {

      console.log("res[0].list[0].OUT_RES_COD:", res.list[0].RES_COD)
      console.log("res[0].list[0].OUT_RES_COD:", res.list[0].RES_COD === '-100')
      console.log("res[0].list[0].OUT_RES_COD:", res.list[0].RES_COD === -100)
      if ( res.list[0].RES_COD === '-100') {
        console.log("1111:")
        Message.err('안전요원이 점검한 기록이 있으면, 일정 제외가 불가능합니다.')
        return
      }
      else  { 
        console.log("222:")
        Message.info('일정이 제외되었습니다.')
        initdata()
      }

          
    })

  }





  else {
    Message.warn('취소되었습니다.')
    
    return
  }


}




const close = () => {
  dialog.value = false
  emit("upData")
}




const onCellClicked = async(grid, clickData) => {
  if (clickData.fieldName === "ACT") {
    let innerData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)


    if(innerData.CANCELED_YN === 'Y'){
      return  // 한번 취소된 작업은 복구버튼 비활성화
    }

    // 1. 관리감독자만 일정제외 가능
    if (!Auth.value) {
      Message.warn('관리감독자(승인자)만 일정 제외가 가능합니다.')
      
      return
    }

    // 2. 과거 일자만 일정제외 가능
    if(innerData.WORK_DATE < dayjs().format('YYYY-MM-DD')){
      if(!userStore.authGrpCd.includes('GRP00380')){ // PTW모듈관리자
        Message.info('과거일자는 일정 제외가 불가능합니다.')

        return  // 과거 일자는 작업 취소 불가능
      }
    }


    // 3. 오늘 일자는 사유 작성 필요
    if(innerData.WORK_DATE === dayjs().format('YYYY-MM-DD')){
      TmpWorkDate.value = innerData.WORK_DATE
      showCancleRemark.value = true
    }
    else {
      await saveData(innerData.WORK_DATE, CancelRemark.value)

    }


  
  }

}



const closeModal = ()  => {
  CancelRemark.value = ''
  showCancleRemark.value = false
}
    
const submitReason = async()  => {

  if (CancelRemark.value.trim() === '') {
    Message.warn('사유를 입력해주세요.')
    
    return
  }

  console.log('입력된 사유:', TmpWorkDate.value, CancelRemark.value)

  await saveData(TmpWorkDate.value, CancelRemark.value)
  CancelRemark.value = ''
  showCancleRemark.value = false


}



// 그리드
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      header: { text: t(" ") },
      fieldName: "ACT",
      dataType: "text",
      width: "50",
      renderer: {
        type: "button",
        callback: (grid, model, field) => {
          return GBNCallback(grid, model, field)
        },
      },
    },  
    {
      fieldName: "WORK_DATE",
      dataType: "text",
      width: "60",
      header: { text: t("작업일") },
    },

    {
      fieldName: "START_TIME",
      dataType: "text",
      width: "50",
      header: { text: t("작업시작시간") },
    },
    {
      fieldName: "END_TIME",
      dataType: "text",
      width: "50",
      header: { text: t("작업종료시간") },
    },
    {
      fieldName: "STATUS",
      dataType: "text",
      width: "50",
      header: { text: t("상태") },
    },
    {
      fieldName: "CANCELED_USER",
      dataType: "text",
      width: "50",
      header: { text: t("처리자") },
    },
    {
      fieldName: "CANCELED_REMARK",
      dataType: "text",
      width: "100",
      header: { text: t("일정제외 사유") },
    },
    
    { fieldName: "CMPNY_DIV",  visible: false },
    { fieldName: "RCV_NO   ",  visible: false },
    { fieldName: "CANCELED_YN   ",  visible: false },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields





//  html
const GBNCallback = (grid, model, field) => {
  let backgroundColor = ""

  if (model._index.value === "일정제외") {
    backgroundColor = "#be2e22"
  }
  if (model._index.value === "Y2") {
    backgroundColor = "#8db600"
  }

  return `<div style="border-radius: 20px; margin: 0 auto; background-color:${backgroundColor};width: 15px;height: 15px;">    </div>`
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
      <span> PTW 작업일정 조정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div style="color:red">
          ※ 일정 제외 권한자:  <strong>관리감독자/세잎클로버(협력사 안전관리자)/HSE추진자 </strong> <br>
          ※ 과거 날짜는 일정제외가 불가능하며, 3시 이후 당일 일정제외는 사유 기입이 필요합니다.<br>
          ※ 일정 제외 후에는 복구할 수 없고, 잘못 설정한 경우 PTW 재신청이 필요합니다. <br>
        </div>

        <v-card class="mt-3">
          <v-card-text class="pa-0">
            <RealGrid
              ref="grdMain"
              class="mt-1"
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
    <SAFBA0010PopUp1
      ref="safba00101"
      @upData="upData"
    />


    <!-- 모달 창 -->
    <div
      v-if="showCancleRemark"
      class="modal-overlay"
    >
      <div class="modal">
        <div class="modal-header">
          <h3 style="color: white; font-size: 18px;">
            일정 제외 사유를 입력해주세요.
          </h3>
        </div>
        <div class="modal-body">
          <input
            v-model="CancelRemark"
            placeholder="사유를 입력하세요..."
          >
          <div class="modal-actions">
            <v-btn @click="submitReason">
              제출
            </v-btn>
            <v-btn @click="closeModal">
              취소
            </v-btn>
          </div>
        </div>
      </div>
    </div>
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

/* 간단한 모달 스타일링 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  width: 50%;  /* 모달의 가로 크기를 50%로 설정 */
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  background-color:  rgba(6, 47, 135); /* 파란색 배경 */
  align-items: center;
  height: 50px;
  color: white;
  padding: 15px;
  font-size: 1.2em;
  text-align: left; /* 제목을 좌측 정렬 */
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.modal-body input {
  padding: 10px;
  margin-bottom: 20px;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;


  
}
</style>
