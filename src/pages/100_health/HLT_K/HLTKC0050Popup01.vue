<!-- HLTKC0050Popup01 고령근로자 사후관리 현황-->
<!-- SI1팀 마환구 2025-05-22 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from "@/utils/saveFlowHelper"
import { commonSearchApi, commonExecuteApi, commonSendSMS,getCodeList,commonLogExecuteApi } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import dayjs from "dayjs"
import { isEmpty, isNullOrUndefined } from "@/@core/utils"
import { useCommonStore } from '@/@hiway/stores/common'
import { useRoute } from 'vue-router'
import { commonBigUploadFilesApi, commonDeletFilesApi, commonDownloadFilesApi,} from "@hiway/api/commonFileApi"


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const commonStore = useCommonStore()
const route = useRoute()
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMainProps1 = ref(null)
const button = ['btnFileUpload',"btnDelete"]
const title=ref('');
const read=ref('');
const search = ref('N');

const BSNS_CD = ref('');
const BSNS_NM = ref('');
const ASGN_CD = ref('');
const ASGN_NM = ref('');
const VEND_CD = ref('');
const VEND_NM = ref('');
const EMP_NO = ref('');
const EMP_NM = ref('');
const IDX_SEQ = ref('');
const YEAR = ref('');
const QUARTER = ref('');
const LBP = ref('');
const HBP = ref('');
const BG= ref('');
const HBA1C= ref('');
const LDL= ref('');
const TG= ref('');
const TC= ref('');
const GS= ref('');
const MS= ref('');
const EC= ref('');
const MT_YN= ref('N');
const AGE_INT= ref('');
const BIRTH_DAY=ref('');
const NATION=ref('');
const NATN_CD=ref('');
const SEX=ref('');

const FILE_ID_1= ref('');
const FILE_ID_2= ref('');

const fileTitle=ref([t('개인정보 동의서'), t('건강상담지')])
const grdTitle=ref('');


const saveParams=ref([]);
const fileUpload = ref(null)        
const btnVisible=ref(false)     

const emit = defineEmits(['closed'])


const MT = reactive([
  {TXT: '대상', COD: 'Y' },
  {TXT: '비대상', COD: 'N' }
])

const searchParams = reactive({
  VEND_CD :'', 
  EMP_NO:'',
  IDX_SEQ : ''
})



// let searchParams1 = reactive({
//   RECEIVE_CMPNY : SEND_COM.value,
//   HHI_BSNS_STR : chkHHI.value,
//   ETC_COMPANY_STR : chkETC.value,
//   HHI_OFFI_STR : chkADMIN.value,
//   ETC_DUTY_STR :chkADMINETC.value,
//   HHI_ALL_CHK : chkEMP1.value,
//   ETC_ALL_CHK : chkEMP2.value
// })

const openPopup = async (param) => {
  // if(param.DIV=='C')
  // {
  //   title.value='건강상태 신규등록'
  //   read.value=false
    
  // }
  // else if(param.DIV=='M')
  // {
  //   title.value='건강상태 수정'
  //   read.value=false
  //   menuTitle.value.disableBtn('btnUpdate',false)
  // }
  // else
  // {
  //   title.value='이전 건강상태'
  //   read.value=true
  //   menuTitle.value.disableBtn('btnUpdate',true)
  // }
  search.value='N';
  searchParams.VEND_CD = param.VEND_CD
  searchParams.EMP_NO = param.EMP_NO
  searchParams.IDX_SEQ = param.IDX_SEQ
  

  BSNS_CD.value = param.BSNS_CD
  BSNS_NM.value = param.BSNS_NM
  ASGN_CD.value = param.ASGN_CD
  ASGN_NM.value = param.ASGN_NM
  VEND_CD.value = param.VEND_CD
  VEND_NM.value = param.VEND_NM
  EMP_NO.value = param.EMP_NO
  EMP_NM.value = param.EMP_NM
  IDX_SEQ.value = param.IDX_SEQ
  YEAR.value = param.YEAR
  QUARTER.value = param.QUARTER
  AGE_INT.value = param.AGE_INT
  BIRTH_DAY.value = param.BIRTH_DAY
  NATN_CD.value = param.NATN_CD
  NATION.value = param.NATION
  SEX.value = param.SEX

  // await initSaveFiles();
  if(param.DIV=='C')
  {
    title.value='건강상태 신규등록'
    read.value=false
    grdTitle.value.disableBtn('btnUpdate',false)
    FILE_ID_1.value=param.FILE_ID_1
    FILE_ID_2.value=param.FILE_ID_2
  }
  else if(param.DIV=='M')
  {
    // console.log("param:",param)
    title.value='건강상태 수정'
    read.value=false
    grdTitle.value.disableBtn('btnUpdate',false)

    HBP.value = param.BP.split("/")[0];
    LBP.value = param.BP.split("/")[1];
    BG.value = param.BG
    HBA1C.value = param.HBA1C
    LDL.value = param.LDL
    TG.value = param.TG
    TC.value = param.TC
    GS.value = param.GS
    MS.value = param.MS
    EC.value = param.EC
    MT_YN.value = param.MT_YN
    FILE_ID_1.value=param.FILE_ID_1
    FILE_ID_2.value=param.FILE_ID_2
    
  }
  else
  {
    title.value='이전 건강상태'
    read.value=true
    grdTitle.value.disableBtn('btnUpdate',true)
    await select_DATA()
    
  }
  
  await initSaveFiles();
  await file_Search()
  await buttonHide();
  dialog.value = true;

}

const file_Search = async ()=>
{
  // console.log("FILE_ID_1.value:",FILE_ID_1.value)
  // console.log("FILE_ID_2.value:",FILE_ID_2.value)
  if(FILE_ID_1.value)
  {
    searchFile(FILE_ID_1.value,0)
  }

  if(FILE_ID_2.value)
  {
    searchFile(FILE_ID_2.value,1)
  }

}

const searchFile = (fileId, index) => {

  const param = { FILE_ID: fileId }
  commonSearchApi({ queryId: 'searchFile', param: param }).then(res => {
    uploadFile.value[index] = res.ORESULT_CUR[0]
    saveFiles.FILE_LIST[index].FILE_ID = res.FILE_ID ? res.FILE_ID : ''
    if(res.ORESULT_CUR.length>0)
    {
      saveFiles.FILE_LIST[index].FILE_NM = res.ORESULT_CUR[0].FILE_TITLE ? res.ORESULT_CUR[0].FILE_TITLE : ''
    }
  })
}

const select_DATA= async ()=>{
  let resData;
  // console.log("pop_searchParams:",searchParams)
  await commonSearchApi({
          queryId: "HLTKC0050_SEARCH_03",
          param: searchParams,
        }).then(res=>{
          resData=res.ORESULT_CUR;

          if(resData.length>0)
          {
            LBP.value = resData[0].LBP
            HBP.value = resData[0].HBP
            BG.value = resData[0].BG
            HBA1C.value = resData[0].HBA1C
            LDL.value = resData[0].LDL
            TG.value = resData[0].TG
            TC.value = resData[0].TC
            GS.value = resData[0].GS
            MS.value = resData[0].MS
            EC.value = resData[0].EC
            MT_YN.value = resData[0].MT_YN
            FILE_ID_1.value=resData[0].FILE_ID_1
            FILE_ID_2.value=resData[0].FILE_ID_2
          }
          else
          {
            LBP.value = ''
            HBP.value = ''
            BG.value = ''
            HBA1C.value = ''
            LDL.value = ''
            TG.value = ''
            TC.value = ''
            GS.value = ''
            MS.value = ''
            EC.value = ''
            MT_YN.value = ''
            FILE_ID_1.value=''
            FILE_ID_2.value=''
          }

        })

    let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '개인 건강정보 관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

const initi= async ()=>{
  saveParams.value=[];
  LBP.value = ''
  HBP.value = ''
  BG.value = ''
  HBA1C.value = ''
  LDL.value = ''
  TG.value = ''
  TC.value = ''
  GS.value = ''
  MS.value = ''
  EC.value = ''
  MT_YN.value = ''
  FILE_ID_1.value=''
  FILE_ID_2.value=''
}

const uploadFile = ref([])
const fileInput = ref(null)
const openFileInput = index => {
  fileInput.value[index].click()
}

const handleFileInputChange = (e, index) => {

  if(FILE_ID_1.value || FILE_ID_2.value)
  {
      Promise[clearFile(index)];
  }
  let file = e.target.files[0]
  // console.log("file:",file)
  // if(isEmpty(file)) {
  //   return
  // }

  saveFiles.FILE_LIST[index].FILE_NM = file.name
  autoFileUpload(file, index, 'SCAN_ID_YN')
}

const create_UUID = () => {
  let dt = new Date().getTime()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const autoFileUpload = async (file, index, yn) => {
  let guid = create_UUID()

  // 자르는 사이즈
  let chunkSize = 1024 * 1024 // 1MB
  // total size 계산
  let totalChunks = Math.ceil(file.size / chunkSize)

  let currentChunk = 0
  let hasErr = false

  const sendNextFile = async () => {

    // chunk size 만큼 데이터 분할
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // form data 형식으로 전송
    const formData = new FormData();

    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: saveFiles.FILE_LIST[index].FILE_ID ? saveFiles.FILE_LIST[index].FILE_ID : guid,
      FILE_NO: '',
      FILE_TITLE: file.name,
      FILE_NAME_ORIGINAL: file.name,
      FILE_NAME: file.name,
      FILE_PATH: `${commonStore.systemCode}${route.path}/`,
      FILE_TYPE: file.name.split(".").pop(),
      FILE_SIZE: Math.round(file.size / 1024.0),
      USER_ID: userStore.userId,
      CHUNK_NUMBER: currentChunk,
      TOTAL_CHUNKS: totalChunks
    }
    

    formData.append("file", chunk, file.name)
    formData.append(
      "param",
      new Blob([JSON.stringify(param)], { type: "application/json" })
    );
    commonBigUploadFilesApi(formData).then(async res => {
      uploadFile.value[index] = res

      saveFiles.FILE_LIST[index].FILE_ID = res.FILE_ID ? res.FILE_ID : ''

      if (res.result.status === "207") {
        currentChunk++
        if (currentChunk < totalChunks) {
          await sendNextFile()
        }
      }else if (res.result.status === "200") {
        
      }
      
      saveFile(index)
    }).catch((e) => {
      hasErr = true
    })
  }
  await sendNextFile()
}

const saveFile = (index) => {
  try{

  saveParams.value = []
  let data=[]

  if(index==0)
  {
    FILE_ID_1.value=saveFiles.FILE_LIST[index].FILE_ID
  }
  else
  {
    FILE_ID_2.value=saveFiles.FILE_LIST[index].FILE_ID
  }
  
  const arr = []
  data.IDX_SEQ = IDX_SEQ.value
  data.VEND_CD = VEND_CD.value
  data.EMP_NO = EMP_NO.value
  data.YEAR = YEAR.value

  // saveParams.value.push(data);

  // const temp = Object.assign({}, saveFiles.FILE_LIST[index], saveParams)
  const temp = Object.assign({}, saveFiles.FILE_LIST[index], data)

  arr.push(temp)

  commonExecuteApi({ queryId: 'HLTKC0050_SAVE_02', list: arr }).then(res => {
    Message.success(t('파일이 저장되었습니다.'))
    file_Search();
  })
  }
  catch(e){
    // console.log("error:",e);
    // console.log("error:",e.message);
    // console.log("error:",e.stack);
  }
}

const saveFiles=reactive({})
const initSaveFiles = async () => {
   
  const fileTemp = {
    FILE_LIST: Array(2).fill().map((_, index) => ({
      FILE_ID: '',
      FILE_NM: '',
      PREV_FILE_NM: '',
      FILE_SEQ: index + 1
    })),
  }
  saveFiles['FILE_LIST'] = fileTemp.FILE_LIST
}

const onClose = () => {
  // detailData.TYPE = ''
  // detailData.ROWS = ''
  // if(!FILE_ID_2.value && IDX_SEQ.value)
  // {
  //   Message.warn(t("건강상담지는 필수 첨부입니다."))
  //   return false; 
  // }
  initi();
  dialog.value = false
  emit('closed',search.value)
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    //내용이 있는 POPUP 띄우기
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSAVE)
      .run()
  }
  else if (btn.id === 'btnClose') {
    onClose()
  }
}
const beforeSave =()=>{
  saveParams.value = []
  let data=ref([])

  data.IDX_SEQ = IDX_SEQ.value
  data.BSNS_CD = BSNS_CD.value
  data.BSNS_NM = BSNS_NM.value
  data.DEPT_CD = ASGN_CD.value
  data.DEPT_NM = ASGN_NM.value
  data.VEND_CD = VEND_CD.value
  data.VEND_NM = VEND_NM.value
  data.EMP_NO = EMP_NO .value
  data.EMP_NM = EMP_NM .value
  data.YEAR = YEAR.value
  data.QUARTER = QUARTER.value
  data.AGE_INT = AGE_INT.value
  data.LBP = LBP.value     
  data.HBP = HBP.value     
  data.BG = BG.value     
  data.HBA1C = HBA1C.value  
  data.LDL = LDL.value    
  data.TG = TG.value     
  data.TC = TC.value     
  data.GS = GS.value     
  data.MS = MS.value     
  data.EC = EC.value     
  data.MT_YN = MT_YN.value  
  data.USER_ID = userStore.userId
  data.BIRTH_DAY = BIRTH_DAY.value
  data.NATN_CD = NATN_CD.value
  data.NATION = NATION.value
  data.SEX = SEX.value
  // data.FILE_ID_1 = FILE_ID_1.value
  // data.FILE_ID_2 = FILE_ID_2.value

  
    // saveParams.value.push(data)
    saveParams.value.push(data)
    return true
  
}

const saveData =()=>{
  //  console.log("save:",saveParams.value)
  
  return commonExecuteApi({ queryId : 'HLTKC0050_SAVE_01', list: saveParams.value})
}

const afterSAVE = (res) => {

  let resdata
  resdata=res.list
    if(resdata.length>0)
    {
      if(IDX_SEQ.value==0)
      {
        IDX_SEQ.value=resdata[0].OUT_SEQ
      }
      search.value='Y';
    }
  // select_DATA();
  buttonHide();

    // console.log("res:",res)
    let params = {
    userStore: userStore,
    params: saveParams.value,
    mgs: '개인 건강정보관련 생성/수정했습니다.',
    crudGbn: 'CU', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

const upDisalbe=ref(null);
const downDisalbe=ref(null);
const buttonHide = async ()=>{
  
  if(read.value)
  {
    upDisalbe.value=true
    downDisalbe.value=false
  }
  else
  {
    if(IDX_SEQ.value==0)
    {
      upDisalbe.value=true
      downDisalbe.value=true
    }
    else
    {
      upDisalbe.value=false
      downDisalbe.value=false
    }

  }
}
const downFile =(index)=>{

  if (!uploadFile.value[index].FILE_ID) {
    Message.err(t("다운로드할 파일이 없습니다."))
    return false
  }

  commonDownloadFilesApi(uploadFile.value[index])
    .then((res) => {
      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const link = document.createElement("a")

      link.href = URL.createObjectURL(blob)

      link.download = decodeURI(file[1].replace('";', ""))
      link.click()
      URL.revokeObjectURL(link.href)

      Message.success(t("다운로드 되었습니다."))
      
      let params = {
      userStore: userStore,
      params: uploadFile.value[index],
      mgs: '개인정보관련 다운로드 했습니다.',
      crudGbn: 'P', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
    })
    .catch((e) => {
      Message.err(t("파일을 가져오지 못하였습니다."))
    })
}


const clearFile = (index) => {
  if(uploadFile.value[index])
  {
  const param = {
    CMPNY_DIV: uploadFile.value[index].CMPNY_DIV,
    FILE_ID: uploadFile.value[index].FILE_ID,
    FILE_NO: uploadFile.value[index].FILE_NO,
    FILE_NAME_ORIGINAL: uploadFile.value[index].FILE_NAME_ORIGINAL,
    FILE_NAME: uploadFile.value[index].FILE_NAME,
    FILE_PATH: uploadFile.value[index].FILE_PATH,
    USER_ID: userStore.userId,
  }


  commonDeletFilesApi([param]).then(res => {
    if (res.result.status === '200') {
      // Message.success(t('삭제 되었습니다.'))
      saveFiles.FILE_LIST[index].FILE_NM = ''
      if(isEmpty(saveFiles.FILE_LIST[index].PREV_FILE_NM)) {
        saveFiles.FILE_LIST[index].FILE_ID = ''
      }
      delete uploadFile.value[index]
        }

  // vm.$swal({ 
  //   title: t('삭제하시겠습니까?'), 
  //   showCancelButton: true,
  // }).then(ck => {
  //   if (ck.isConfirmed === true) {
  //     commonDeletFilesApi([param]).then(res => {
  //       if (res.result.status === '200') {
  //         Message.success(t('삭제 되었습니다.'))
  //         saveFiles.FILE_LIST[index].FILE_NM = ''
  //         if(isEmpty(saveFiles.FILE_LIST[index].PREV_FILE_NM)) {
  //           saveFiles.FILE_LIST[index].FILE_ID = ''
  //         }
  //         delete uploadFile.value[index]
  //       }
  //     }).catch(err => {
  //       // return Message.success(err)
  //       console.log(err);
  //     }).finally(() => {
  //       // fileSet()
  //     })
  //   }
  })
  }
}
const MT_YN_UPDATE =()=>{
  // 대상기준
  if(HBP.value >= 160 || LBP.value >= 100 || BG.value >= 140 ||   HBA1C.value > 7 ||
  // LDL.value > 130 || 
  TG.value >= 300 || TC.value >= 250 || (SEX.value=='남' && GS.value < 25) || (SEX.value=='여' && GS.value < 15) //||
  // MS.value < 14 || EC.value < 60
  )
  {
    MT_YN.value='Y'
  }
  else
  {
    MT_YN.value='N'
  }
}
</script>

<template style="margin: 0px">
  <v-dialog v-model="dialog" eager persistent 
  width="850" 
  height="650"
  class="p-absolute user-select-none" 
    >
    <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move"
      >
      <span>{{title}}</span>
    </v-sheet>
    <!-- <v-card class="pa-0 fill-height rounded-b-5"> -->
      <v-card class="pa-0 rounded-b-5 h-full" >
      <v-card-title class="pa-4 pb-2">
        <IGridTitle ref="grdTitle" :use-permission="true" :button-list="['btnUpdate','btnClose']" @click-button="onButtonsClick" />
        <!-- <IButtonList
              :button-list="['btnContent','btnSend','btnDelete','btnSendHis','btnClose']"
              @click-button="onButtonsClick"/> -->
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <VRow class="d-flex flex-column searchArea" style="margin bottom: 5px; padding : 10px">
          <VCol class="d-flex cols-padding pb-5" >
            <i-input 
              :label="$t('사업부')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="BSNS_NM"
              top-label
              readonly
              
            />
            <i-input 
              :label="$t('부서')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="ASGN_NM"
              top-label
              readonly
            />
            <i-input 
              :label="$t('협력사')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="VEND_NM"
              top-label
              readonly
            />
            <i-input 
              :label="$t('성명')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="EMP_NM"
              top-label
              readonly
            />
          </VCol>
          <VCol class="d-flex cols-padding pb-5">
            <i-input 
              :label="$t('수축기 혈압(mmHg)')" type="text"
              width="15%"
              margin="1%"
              labelWidth="200px"
              v-model="HBP"
              top-label
              :readonly="read"
              :reverse=true
              :cost="true"
              maxlength="3"
              @update:modelValue="MT_YN_UPDATE"
            />
            <i-input 
            :label="$t('이완기 혈압(mmHg)')" type="text"
              width="16%"
              margin="1%"
              labelWidth="150px"
              v-model="LBP"
              top-label
              :readonly="read"
              :reverse=true
              :cost="true"
              maxlength="3"
              @update:modelValue="MT_YN_UPDATE"
            />
            <i-input 
              :label="$t('혈당(mg/dL)')" type="text"
              width="32%"
              margin="1.5%"
              labelWidth="150px"
              v-model="BG"
              top-label
              :readonly="read"
              :reverse=true
              :cost="true"
              maxlength="3"
              @update:modelValue="MT_YN_UPDATE"
            />
            <i-input 
              :label="$t('당화혈색소(%)')" type="text"
              width="32%"
              margin="1%"
              labelWidth="150px"
              v-model="HBA1C"
              top-label
              :readonly="read"
              :reverse=true
              maxlength="3"
              @update:modelValue="MT_YN_UPDATE"
            />
            
          </VCol>
          <VCol class="d-flex cols-padding pb-5">
            <i-input
              :label="$t('LDL 콜레스테롤(mg/dL)')" type="text"
              width="32%"
              margin="1.5%"
              labelWidth="150px"
              v-model="LDL"
              top-label
              :readonly="read"
              :reverse=true
              :cost="true"
              maxlength="3"
              @update:modelValue="MT_YN_UPDATE"
            />
            <i-input 
              :label="$t('중성지방(mg/dL)')" type="text"
              width="32%"
              margin="1.5%"
              labelWidth="150px"
              v-model="TG"
              top-label
              :readonly="read"
              :reverse=true
              :cost="true"
              maxlength="3"
              @update:modelValue="MT_YN_UPDATE"
            />
            <i-input 
              :label="$t('총 콜레스테롤(mg/dL)')" type="text"
              width="32%"
              margin="1%"
              labelWidth="150px"
              v-model="TC"
              top-label
              :readonly="read"
              :reverse=true
              :cost="true"
              maxlength="3"
              @update:modelValue="MT_YN_UPDATE"
            />
            
          </VCol>
          <VCol class="d-flex cols-padding pb-5">
            <i-input 
              :label="$t('악력(kg)')" type="text"
              width="32%"
              margin="1.5%"
              labelWidth="150px"
              v-model="GS"
              top-label
              :readonly="read"
              :reverse=true
              :cost="true"
              maxlength="3"
              @update:modelValue="MT_YN_UPDATE"
            />
            <i-input 
              :label="$t('근력')" type="text"
              width="32%"
              margin="1.5%"
              labelWidth="150px"
              v-model="MS"
              top-label
              :readonly="read"
              :reverse=true
              maxlength="33"
              @update:modelValue="MT_YN_UPDATE"
            />
            <i-input 
              :label="$t('운동능력')" type="text"
              margin="1%"
              labelWidth="150px"
              width="32%"
              v-model="EC"
              top-label
              :readonly="read"
              :reverse=true
              maxlength="33"
              @update:modelValue="MT_YN_UPDATE"
            />
          </VCol>
          <VCol class="d-flex cols-padding ">
            <i-select
              :label="$t('관리대상 여부')" type="text"
              width="32%"
              margin="1%"
              labelWidth="80px"
              v-model="MT_YN"
              :items="MT"
              item-value="COD"
              item-title="TXT"
              top-label
              :readonly="read"
            />
          </VCol>
            <div v-if="!IDX_SEQ " style="color: red;margin: 2px;">※ 내용 저장 후 파일을 업로드 하실 수 있습니다. </div>
            <div style="font-weight: bold;">첨부</div>
            <VCol class ="pa-1" cols="12" md="12">
            <template v-for="(item, index) in saveFiles.FILE_LIST" :key="index">
                <VRow class="d-flex justify-space-between">
                  <VCol cols="9" style="display: flex;">
                    <i-input
                      v-model="item.FILE_NM"
                      :label="fileTitle[index]"
                      labelWidth="90px"
                      width="100%"
                      @click:clearable="clearFile(index)"
                      readonly
                    />
                    <div class="d-flex align-center">
                      <v-file-input 
                        style="display: none;" 
                        @change="handleFileInputChange($event, index)" 
                        ref="fileInput" 
                      />            
                      <v-btn @click="openFileInput(index)" :disabled="upDisalbe">업로드</v-btn>
                      <v-btn @click="downFile(index)" :disabled="downDisalbe">다운로드</v-btn>
                    </div>
                  </VCol>
                </VRow>
              </template>
          </VCol>
        </VRow>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 250px);
  //overflow-y: auto;
  > div {
    // min-height: 700px;
  }
}

.cols-padding{
  padding : 0px;
}

</style>