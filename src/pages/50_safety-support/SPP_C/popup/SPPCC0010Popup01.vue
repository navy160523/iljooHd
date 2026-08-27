
<!--
  화면명 : SPPCC0010Popup01
  화면개요 : 노동조합 작업중지 등록 팝업
  작성자 : 김홍규
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, readonly } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
} from "@hiway/api/commonApi"
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import IUpload from "@/components/IUpload.vue"
import Message from "@hiway/utils/notify"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import OZReport from "@/components/OZReport.vue"            // 오즈 리포트
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' // 결재팝업
import EmpPopup from '@/components/popup/EmpPopup.vue'// 인원 검색 팝업
import LocationPopup from "@/components/popup/LocationPopup.vue"; // 장소 선택 팝업
import DeptPopup from '@/components/popup/DeptPopup.vue'
import ShipPopup from '@/components/popup/ShipPopup.vue'
import notify from '@/@hiway/utils/notify'

import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js";

//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(["closed","upDataRow"])
const userStore = useUserStore()

const menuTitle = ref(null)

let path = useLogsStore().path.split('/')

const dialog = ref(null)

// 파일 업로드 팝업
const fileUploadPopup = ref(null)
const empPopup = ref(null)
const locationPopup = ref(null);
const deptPopup = ref(null)
const shipPopup = ref(null)

let empState = ''
const title = reactive({
  subTitle : ''
})
/* 팝업 데이터 */
let searchParams = reactive({
  CMPNY_DIV: '',
  JSTOP_NO: '',
})

/* 팝업 데이터 */
let popupParams = reactive({
  MAIN: 
    {
      ASGN_NM: '',
      JOB_PLC_DESC: '',
      JOB_LPLC_NM: '',
      BSNS_CD: '',
      JSTOP_NO: '',
      SHIP_NO: '',
      JSTOP_DIV: '',
      JSTOP_DIV_OPTION: '',
      RESTART_DESC: '',
      JSTOP_CMPNY_DIV: '',
      JSTOP_ASGN_CD: '',
      JSTOP_TIME_DS2: dayjs(new Date()).format("YYYY-MM-DD"),
      JSTOP_TIME_DS3: '',
      JOB_SPLC: '',
      JSTOP_TIME_DS: '',
      LOSS_MH: '',
      JOB_SPLC_NM: '',
      JSTOP_DT1: '',
      RESTART_TIME_DS: '',
      JSTOP_DESC: '',
      RESTART_DT1: '',
      REASON: '',
      WORKER_CNT: '',
      JOB_MPLC: '',
      JSTOP_TIME: '',
      CMPNY_DIV: '',
      ASGN_CD: '',
      TEAM_NM: '',
      RESTART_TIME_DS2: dayjs(new Date()).format("YYYY-MM-DD"),
      RESTART_TIME_DS3: '',
      CHG_EMP_NO: '',
      FILE_ID: '',
      RESTART_DIV: '',
      JSTOP_EMP_NO: '',
      DEPT_CD: '',
      JOB_MPLC_NM: '',
      RESTART_TIME: '',
      CHG_EMP_NM: '',
      JSTOP_EMP_NM: '',
      COMPANY: '',
      RESTART_TIME2: '',
      JSTOP_ASGN_NM: '',
      SAVE_YN: '',
      JOB_LPLC: '',
      JSTOP_DEPT_CD: '',
      JSTOP_TIME2: ''
    }

  
})



/* 코드 리스트 */
const codeList = reactive({
  JSTOP_DIV:[
    {COD:'10', TXT:'민원 점검관련'}
    ,{COD:'20', TXT:'사고 관련'}
  ],  // 중지 구분
  JSTOP_DIV_OPTION:[ // 중지 구분 추가 옵션
    {COD:'', TXT:'전체'}
    ,{COD:'1', TXT:'합의'}
    ,{COD:'2', TXT:'일방'}
  ],
  RESTART_DIV:[ // 중지 구분 추가 옵션
    {COD:'A', TXT:'즉시'}
    ,{COD:'B', TXT:'작업취소'}
    ,{COD:'C', TXT:'작업대체'}
  ],
})


//팝업 오픈 함수
const openPopup = (selectParams) => {  
  // console.log('selectParams',selectParams)
  searchParams.NEW_YN = selectParams.NEW_YN
  if(selectParams.NEW_YN === 'N'){
    searchParams.CMPNY_DIV = selectParams.CMPNY_DIV
    searchParams.JSTOP_NO = selectParams.JSTOP_NO

    commonSearchApi({
          queryId: "SPPCC0010_SEARCH_03",
          param: searchParams,
        }).then(res => {
          // console.log('openpopup res',res)
          // popupParams = res.ORESULT_CUR[0]
          popupParams.MAIN = res.ORESULT_CUR[0]
          // console.log('popupParams res',popupParams)
      })

  }else {
    popupParams.MAIN.JSTOP_TIME_DS2 = dayjs(new Date()).format("YYYY-MM-DD")
    popupParams.MAIN.RESTART_TIME_DS2 = dayjs(new Date()).format("YYYY-MM-DD")
  }
  

  dialog.value = true
  // console.log('popupParams',popupParams)

}


//팝업닫을때 팝업내부 변수 초기화
const closePopup = () => {
  emit('closed')
  clear()
  dialog.value = false
}

const clear = () => {
  popupParams.MAIN = {}
  // ASGN_NM= ''
  // JOB_PLC_DESC= ''
  // JOB_LPLC_NM= ''
  // BSNS_CD= ''
  // JSTOP_NO= ''
  // SHIP_NO= ''
  // JSTOP_DIV= ''
  // JSTOP_DIV_OPTION= ''
  // RESTART_DESC= ''
  // JSTOP_CMPNY_DIV= ''
  // JSTOP_ASGN_CD= ''
  // JSTOP_TIME_DS2= ''
  // JSTOP_TIME_DS3= ''
  // JOB_SPLC= ''
  // JSTOP_TIME_DS= ''
  // LOSS_MH= ''
  // JOB_SPLC_NM= ''
  // JSTOP_DT1= ''
  // RESTART_TIME_DS= ''
  // JSTOP_DESC= ''
  // RESTART_DT1= ''
  // REASON= ''
  // WORKER_CNT= ''
  // JOB_MPLC= ''
  // JSTOP_TIME= ''
  // CMPNY_DIV= ''
  // ASGN_CD= ''
  // TEAM_NM= ''
  // RESTART_TIME_DS2= ''
  // RESTART_TIME_DS3= ''
  // CHG_EMP_NO= ''
  // FILE_ID= ''
  // RESTART_DIV= ''
  // JSTOP_EMP_NO= ''
  // DEPT_CD= ''
  // JOB_MPLC_NM= ''
  // RESTART_TIME= ''
  // CHG_EMP_NM= ''
  // JSTOP_EMP_NM= ''
  // COMPANY= ''
  // RESTART_TIME2= ''
  // JSTOP_ASGN_NM= ''
  // SAVE_YN= ''
  // JOB_LPLC= ''
  // JSTOP_DEPT_CD= ''
  // JSTOP_TIME2= ''
}

// 팝업 버튼
const onButtonsClick =async (btn) => {
  
  if (btn.id === "btnUpdate" ) {
    if(popupParams.MAIN.JSTOP_TIME_DS2 === null 
    || popupParams.MAIN.JSTOP_TIME_DS2 === ''
    || popupParams.MAIN.JSTOP_TIME_DS2 === undefined
    || popupParams.MAIN.JSTOP_TIME_DS3 === null 
    || popupParams.MAIN.JSTOP_TIME_DS3 === ''
    || popupParams.MAIN.JSTOP_TIME_DS3 === undefined
    || popupParams.MAIN.JSTOP_DIV === null 
    || popupParams.MAIN.JSTOP_DIV === ''
    || popupParams.MAIN.JSTOP_DIV === undefined
    || popupParams.MAIN.JSTOP_DIV_OPTION === null 
    || popupParams.MAIN.JSTOP_DIV_OPTION === ''  
    || popupParams.MAIN.JSTOP_DIV_OPTION === undefined
    || popupParams.MAIN.JSTOP_DESC === null 
    || popupParams.MAIN.JSTOP_DESC === ''
    || popupParams.MAIN.JSTOP_DESC === undefined
    || popupParams.MAIN.CHG_EMP_NO === null 
    || popupParams.MAIN.CHG_EMP_NO === ''
    || popupParams.MAIN.CHG_EMP_NO === undefined
    || popupParams.MAIN.ASGN_CD === null 
    || popupParams.MAIN.ASGN_CD === ''
    || popupParams.MAIN.ASGN_CD === undefined){
        Message.err(t("필수값을 입력해주세요."))
      return
    }

    let result = await vm.$swal({ 
      title: t('저장 하시겠습니까? '), 
      showCancelButton: true,
    })
    if(!result.isConfirmed){
      return 
    }
    saveData()
   
  } else if (btn.id === "btnDelete") {
    // console.log('팝업 종료 ')
    closePopup()
  } else if (btn.id === "btnClose") {
    // console.log('팝업 종료 ')
    closePopup()
  } else if (btn.id === 'btnSearch') {
    commonSearchApi({
          queryId: "SPPCC0010_SEARCH_03",
          param: searchParams,
        }).then(res => {
          // popupParams = res.ORESULT_CUR[0]
          popupParams.MAIN = res.ORESULT_CUR[0]
      })
  }
}




/* -------------- 저장 -------------- */
const saveData = () => {
  const saveParam = []
    saveParam.push(popupParams.MAIN)
  // console.group('saveParam',saveParam)
  saveParam[0].JSTOP_DT1 = popupParams.MAIN.JSTOP_TIME_DS2.replaceAll('-','')
  saveParam[0].JSTOP_TIME2 = popupParams.MAIN.JSTOP_TIME_DS3.replaceAll(':','')

  // saveParam[0].RESTART_DT1 = popupParams.MAIN.RESTART_TIME_DS2.replaceAll('-','')
  // saveParam[0].RESTART_TIME2 = popupParams.MAIN.RESTART_TIME_DS3.replaceAll(':','')

  if(popupParams.MAIN.RESTART_TIME_DS2 !== null 
  && popupParams.MAIN.RESTART_TIME_DS2 !== ''
  && popupParams.MAIN.RESTART_TIME_DS2 !== undefined
 ){     
    saveParam[0].RESTART_DT1 = popupParams.MAIN.RESTART_TIME_DS2.replaceAll('-','')

  }

  if(
  popupParams.MAIN.RESTART_TIME_DS3 !== null 
  && popupParams.MAIN.RESTART_TIME_DS3 !== ''
  && popupParams.MAIN.RESTART_TIME_DS3 !== undefined){     
    saveParam[0].RESTART_TIME2 = popupParams.MAIN.RESTART_TIME_DS3.replaceAll(':','')

  }

  if(searchParams.NEW_YN === 'Y'){
    saveParam[0].CMPNY_DIV = userStore.cmpnyDiv
    saveParam[0].COMPANY = userStore.company
  }
  console.log('saveParam',saveParam)
  Promise.all([commonExecuteApi
    ({ 
        queryId : 'SPPCC0010_SAVE_01'
      , list: saveParam
    })
  ]).then(res => {
    console.log('res',res)
    const COD = res[0].list[0].RES_COD
    const TXT = res[0].list[0].RES_COL
    if(COD == -1){
      return Message.err(t(TXT))
    }else{
      notify.success('저장이 완료 되었습니다.')   
    }
  })
}

const saveFile = (fileId) => {
  const saveParam = []
  const temp = {
    CMPNY_DIV: popupParams.MAIN.CMPNY_DIV,
    JSTOP_NO: popupParams.MAIN.JSTOP_NO,
    FILE_ID: fileId,
    USER_ID: userStore.userId,
  }
    saveParam.push(temp)
    
  return commonExecuteApi
  ({ 
      queryId : 'SPPCC0010_SAVE_02'
    , list: saveParam
  })
}


/* -------------- 삭제 -------------- */

// 우측 디테일(상단) 그리드 데이터 삭제 전
const delSubCheck = async () => {
  let delCheck = grdSub.value.getGridView().getCheckedRows()

  if(!delCheck.length>0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false
  }
  
  // console.log(delCheck, "delCheck");
  return true
}


// 우측 디테일(상단) 그리드 데이터 삭제 
const delSubData = async () => {
  let delParams = []
  let delCheck = grdSub.value.getGridView().getCheckedRows()
  delCheck.forEach(element => {
    const data = grdSub.value.getRowData(element)
    delParams.push(data)
  });
  

  return commonExecuteApi({
    queryId: "SAFIG0010_DELETE_01",
    list: delParams,
  })
}



// 파일 업로드 시 그리드 재조회
const uploaded = (val) =>{
  // console.log('uploaded val', val)
  saveFile(val.fileId)
}


// 사진 업로드
const onCellItemClicked = (grid, index, col) =>{
const selectRow = grdMain.value.getRowData(col.dataRow)
let fileID = ''

// console.log(selectRow)
  if(col.column === 'FILE_NAME'){ 
    fileID = selectRow.FILE_ATTACH_KEY
    fileUploadPopup.value.setGuid()
    fileUploadPopup.value.openPopup(fileID)
  } else if(col.column === 'FIX_FILE_NAME'){
    fileID = selectRow.FIX_ATTACH_KEY
    fileUploadPopup.value.setGuid()
    fileUploadPopup.value.openPopup(fileID)
  }
}


/*-------------------- 사원 검색 팝업 --------------------*/
const openEmpPopup = (type) => {
  let param = {
    BSNS_CD: popupParams.MAIN.BSNS_CD
    ,DEPT_CD: popupParams.MAIN.DEPT_CD}
  if(type === 'JSTOP'){
    param.EMP_NM = popupParams.MAIN.JSTOP_EMP_NM
  } else if(type === 'CHG'){
    param.EMP_NM = popupParams.MAIN.CHG_EMP_NM
  } 
  empState = type

  empPopup.value.openPopup(param)
}

const onEmpSelected = val => {
  // console.log('select val',val)
  popupParams.MAIN[empState] = val.EMP_NM
  if(empState === 'JSTOP'){
    popupParams.MAIN.JSTOP_EMP_NM = val.EMP_NM
    popupParams.MAIN.JSTOP_EMP_NO = val.EMP_NO
    popupParams.MAIN.JSTOP_CMPNY_DIV = val.CMPNY_DIV
    
    popupParams.MAIN.JSTOP_DEPT_CD = val.DEPT_CD
    popupParams.MAIN.JSTOP_ASGN_CD = val.ASGN_CD
    popupParams.MAIN.JSTOP_ASGN_NM = val.ASGN_NM

  } else if(empState === 'CHG'){
    popupParams.MAIN.CHG_EMP_NM = val.EMP_NM
    popupParams.MAIN.CHG_EMP_NO = val.EMP_NO
    popupParams.MAIN.CMPNY_DIV = val.CMPNY_DIV
    popupParams.MAIN.COMPANY = val.COMPANY
    popupParams.MAIN.BSNS_CD = val.BSNS_CD
    popupParams.MAIN.DEPT_CD = val.DEPT_CD
    popupParams.MAIN.ASGN_CD = val.ASGN_CD
    popupParams.MAIN.ASGN_NM = val.ASGN_NM
  } 

  // console.log('select type',popupParams[empState])
}

// 부서 팝업
const deptPopupOpen = () => {
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', pageGbn : 'MNG'})

}
const onDeptSelected = val => {
  // console.log('dept val',val)
  popupParams.MAIN.CMPNY_DIV = val.CMPNY_DIV
  popupParams.MAIN.BSNS_CD = val.BSNS_CD
  popupParams.MAIN.DEPT_CD = val.DEPT_CD
  popupParams.MAIN.ASGN_CD = val.ASGN_CD
  popupParams.MAIN.ASGN_NM = val.ASGN_FULL_NM
}

// 호선 팝업
const openShipPopup = () => {
  shipPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', pageGbn : 'MNG'})

}
const onShipSelected = val => {
  console.log('ship val',val)
  popupParams.MAIN.SHIP_NO = val.WORK_NO
}


// 장소 팝업
const locationPopupOpen = () => {
  locationPopup.value.openPopup(userStore.cmpnyDiv);
};
// 장소선택
const selectedLocation = (row) => {
  // console.log('location', row)
  if(row[1].UP_COD === 'J'){
    popupParams.MAIN.JOB_LPLC = row[0].COD
    popupParams.MAIN.JOB_MPLC = row[1].COD
    popupParams.MAIN.JOB_SPLC = ''
    popupParams.MAIN.JOB_LPLC_NM = row[0].TXT
    popupParams.MAIN.JOB_MPLC_NM = row[1].TXT
    popupParams.MAIN.JOB_SPLC_NM = ''
  } else{
    popupParams.MAIN.JOB_LPLC = row[0].COD
    popupParams.MAIN.JOB_MPLC = row[1].COD
    popupParams.MAIN.JOB_SPLC = row[2].COD
    popupParams.MAIN.JOB_LPLC_NM = row[0].TXT
    popupParams.MAIN.JOB_MPLC_NM = row[1].TXT
    popupParams.MAIN.JOB_SPLC_NM = row[2].TXT
  }
};
// 스티커 업로드
const stickerUpload = () => {
  
  const fileID = popupParams.MAIN.FILE_ID
  fileUploadPopup.value.setGuid()
  fileUploadPopup.value.openPopup(fileID)
}

//  시간 유효성검사

const formatTimeFromInput = (inputTime) => {
  const time = inputTime.replace(':','')
  const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/;
  if (!timePattern.test(time)) {
    return ""
  }

  const hours = time.substring(0, 2)
  const minutes = time.substring(2)
  return `${hours}:${minutes}`
};

const formatAndDisplayTime = () => {
  popupParams.MAIN.JSTOP_TIME_DS3 = formatTimeFromInput(popupParams.MAIN.JSTOP_TIME_DS3)
  popupParams.MAIN.RESTART_TIME_DS3 = formatTimeFromInput(popupParams.MAIN.RESTART_TIME_DS3)
};


watch(
  () => popupParams.MAIN.JSTOP_TIME_DS2,
  (newValue) => {
    console.log('newValue',newValue)
    const today = dayjs();
    const vacationEnd = dayjs(newValue);
    const daysLeft = vacationEnd.diff(today, 'hours');
    // console.log('날짜 초과 비교',daysLeft)
    if(daysLeft > 0){
      popupParams.MAIN.JSTOP_TIME_DS2 = dayjs().format('YYYY-MM-DD')
      Message.err(t("중지일시는 금일보다 늦을 수 없습니다."))
    }
  }
);

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1600"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">노동조합 작업중지 등록</div>
    <VContainer style="background-color: white; height: 810px">
      <v-card class="pa-1 fill-height">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="menuTitle"
            :title="$t('')"
            :button-list="['btnUpdate','btnClose']"
            @click-button="onButtonsClick"
          />
        </v-card-title>
        <v-card-text class="pa-2 pt-0 content-area">
          <div class="fill-height" style="display: flex; flex-direction: column;">
          <!-- 기본 정보 -->
            <v-sheet class="searchArea flex-column" width="100%">
              <IGridTitle
              :title="$t('작업중지')">
              </IGridTitle>
              <div class="d-flex mb-2" style="padding-left: 15px;">
                <i-input
                  v-model="popupParams.MAIN.JSTOP_TIME_DS2"
                  :label="$t('중지일시')" 
                  width="240px"
                  label-width="75px"
                  type="date"
                  marginBetween="19px"
                  required
                />
                <i-input
                  v-model="popupParams.MAIN.JSTOP_TIME_DS3"
                  :label="$t('')"
                  width="auto"
                  type="time"
                />
                <ILabel
                  :label="$t('호선')"
                  :required="true"
                  style="width: 220px;"
                >
                  <template #editor="editorProps">
                    <VTextField 
                      v-model="popupParams.MAIN.SHIP_NO"
                      append-inner-icon="mdi-magnify" 
                      @keydown.enter="e => {
                        openShipPopup('CHG')
                      }"
                      @click:appendInner="openShipPopup('CHG')"
                    />
                  </template>      
                </ILabel>
                <ILabel
                  :label="$t('작업인원')"
                  style="width: 200px;"
                >
                  <template #editor="editorProps">
                    <VTextField
                    type="Number"
                    :min="0"
                    v-model="popupParams.MAIN.WORKER_CNT"
                    />
                    <p class="ml-1">명</p>
                  </template>      
                </ILabel>
                <ILabel
                  :label="$t('손실 M/H')"
                  style="width: 300px;"
                >
                  <template #editor="editorProps">
                    <VTextField
                    v-model="popupParams.MAIN.LOSS_MH"
                    type="Number"
                    :min="0"
                    />
                    <p class="ml-1" style="width: -webkit-fill-available;">시간</p>
                  </template>      
                </ILabel>
              </div>
              <div class="d-flex mb-2" style="align-items: center; padding-left: 15px;">
                <i-select
                  :label="$t('중지구분')"
                  label-width="86px"
                  width="235px"
                  v-model="popupParams.MAIN.JSTOP_DIV"
                  :items="codeList.JSTOP_DIV"
                  item-value="COD"
                  item-title="TXT"
                  required
                />
                <div style="padding-right: 12px;">
                  <v-radio-group inline v-model="popupParams.MAIN.JSTOP_DIV_OPTION" style="width: 122px;">
                      <v-radio label="합의" value="1"></v-radio>
                      <v-radio label="일방" value="2"></v-radio>
                  </v-radio-group>
                </div>
                <v-btn 
                    @click="stickerUpload()"
                    :disabled="popupParams.MAIN.SAVE_YN === 'N' ? true : false"
                    style="margin-left: 12px;"
                  >
                    노동조합작업중지 스티커 사진 첨부
                </v-btn>  
              </div>
              <div class="d-flex mb-2" style="align-items: center;">
                <ILabel
                  :label="$t('작업장소')"
                  label-width="85"
                  style="width: 600px;"
                >
                  <template #editor="editorProps">
                    <VTextField
                    v-model="popupParams.MAIN.JOB_LPLC_NM"
                    :readonly="true"
                    style="padding-left: 25px;"
                    />
                    <VTextField
                    v-model="popupParams.MAIN.JOB_MPLC_NM"
                    style="padding-left: 12px;"
                    :readonly="true"
                    />
                    <VTextField
                    v-model="popupParams.MAIN.JOB_SPLC_NM"
                    style="padding-left: 12px;"
                    append-inner-icon="mdi-magnify"
                    @click:appendInner="locationPopupOpen()"
                    />     
                  </template>  
                </ILabel>
                <ILabel
                  :label="$t('작업장소상세')"
                  label-width="120"
                  style="width: 920px;"
                >
                  <template #editor="editorProps">
                    <VTextField
                    v-model="popupParams.MAIN.JOB_PLC_DESC"
                    type="text"
                    />
                  </template>
                </ILabel>
                
              </div>
              <div class="d-flex mb-2">
                <ILabel
                  :label="$t('중지상세')"
                  label-width="60"
                  style="width: 100%;"
                  :required="true"
                >
                  <template #editor="editorProps">
                    <VTextarea
                    v-model="popupParams.MAIN.JSTOP_DESC"
                    type="text"
                    style="padding-left: 25px;"
                    rows="5"
                    />
                    
                  </template>      
                </ILabel>
              </div>
              
              <div class="d-flex mb-2">
                <ILabel
                  :label="$t('작업담당성명')"
                  :required="true"
                  style="width: 300px;"
                >
                  <template #editor="editorProps">
                    <VTextField 
                      v-model="popupParams.MAIN.CHG_EMP_NM" 
                      append-inner-icon="mdi-magnify" 
                      @keydown.enter="e => {
                        openEmpPopup('CHG')
                      }"
                      @click:appendInner="openEmpPopup('CHG')"
                    />
                  </template>      
                </ILabel>
                <ILabel
                  :label="$t('사번')"
                  style="width: 200px;"
                >
                  <template #editor="editorProps">
                    <VTextField 
                      v-model="popupParams.MAIN.CHG_EMP_NO" 
                      :readonly="true"
                    />
                  </template>      
                </ILabel>
                <ILabel
                  :label="$t('작업담당소속')"
                  style="width: 350px;"
                  :required="true"
                >
                  <template #editor="editorProps">
                    <VTextField 
                      v-model="popupParams.MAIN.ASGN_NM" 
                      append-inner-icon="mdi-magnify" 
                      @click:appendInner="deptPopupOpen()"
                    />
                  </template>      
                </ILabel>
              </div>
              <!-- <div class="d-flex mb-2">
                
              </div> -->
            </v-sheet>
            <v-sheet class="searchArea flex-column" width="100%">
              <IGridTitle
              :title="$t('작업재개')">
              </IGridTitle>
              <div class="d-flex mb-2" style="padding-left: 15px;">
                <i-input
                  v-model="popupParams.MAIN.RESTART_TIME_DS2"
                  :label="$t('작업재개')" 
                  width="220px"
                  label-width="60"
                  type="date"
                  marginBetween="20px"
                />
                <i-input
                  v-model="popupParams.MAIN.RESTART_TIME_DS3"
                  :label="$t('')"
                  width="auto"
                  type="time"
                />
                <i-select
                  :label="$t('작업재개구분')"
                  label-width="80px"
                  width="220px"
                  v-model="popupParams.MAIN.RESTART_DIV"
                  :items="codeList.RESTART_DIV"
                  item-value="COD"
                  item-title="TXT"
                />
              </div>
              <div class="d-flex mb-2" >
                
                <ILabel
                  :label="$t('조치내용')"
                  label-width="60"
                  style="width: 100%;"
                >
                  <template #editor="editorProps">
                    <VTextarea
                    v-model="popupParams.MAIN.RESTART_DESC"
                    type="text"
                    rows="5"
                    />
                    
                  </template>      
                </ILabel>
              </div>
              </v-sheet>
            <v-sheet class="searchArea flex-column" width="100%">  
              <IGridTitle
              :title="$t('작업중지자')">
              </IGridTitle>
              <div class="d-flex mb-2" >
                <ILabel
                  :label="$t('성명')"
                  label-width="120"
                  style="width: 250px;"

                >
                  <template #editor="editorProps">
                    <VTextField 
                      v-model="popupParams.MAIN.JSTOP_EMP_NM" 
                      append-inner-icon="mdi-magnify" 
                      @keydown.enter="e => {
                        openEmpPopup('JSTOP')
                      }"
                      @click:appendInner="openEmpPopup('JSTOP')"
                    />
                  </template>      
                </ILabel>
                <ILabel
                  :label="$t('사번')"
                  label-width="120"
                  style="width: 200px;"
                >
                  <template #editor="editorProps">
                    <VTextField 
                      v-model="popupParams.MAIN.JSTOP_EMP_NO" 
                      :readonly="true"
                    />
                  </template>      
                </ILabel>
                <ILabel
                  :label="$t('소속')"
                  label-width="120"
                  style="width: 300px;"
                >
                  <template #editor="editorProps">
                    <VTextField 
                      v-model="popupParams.MAIN.JSTOP_ASGN_NM" 
                      :readonly="true"
                    />
                  </template>      
                </ILabel>
              </div>
            </v-sheet>    
          </div>
        </v-card-text>
      </v-card>    
      </VContainer>
      <!-- 리포트 -->
  </VDialog>
  <IUploadPopup
      ref="fileUploadPopup"
      @uploaded="uploaded"
      :buttonList="['btnDownLoad', 'btnDelete', 'btnClose']"
      :autoUpload="true"
      :img-only=true
      />
  <EmpPopup
    ref="empPopup"
    @selected="onEmpSelected"
  ></EmpPopup>
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
    <ShipPopup ref="shipPopup" @selected="onShipSelected"/>
  <LocationPopup @selectedArr="selectedLocation" ref="locationPopup" />
  <!-- 리포트 -->
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 320px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 600px;
  }
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>