<!--
  화면명 : 공사 신청 서브 화면4
  화면개요 : 공사 신청 서브 화면 기타 신청서류  
-->

<script setup>
import { ref, onMounted } from 'vue'
import IUploadPopup from '@/pages/30_safety/SAF_J/IUploadPopup.vue'
import { useI18n } from "vue-i18n"
import { selectFile, setFileUpload, create_UUID } from "@/utils/sWorkFileTool"

const emit = defineEmits(['close'])

const isVisible = ref(false)
const filePosition = ref(0)

const { t } = useI18n();

//팝업 관련
const dialog = ref(false)
const popupButtons = ref(null) 
const params = ref({
  CMPNY_DIV : '',
  BIZ_REG_NO : '',
  WRK_STD_CD : '',
  WRK_STD_NM : '',
  WRK_STD_CON : '',
  FILE_ID : ''
})

const fileBtnList = ref(['btnDelete', 'btnClose'])

const fileUpload = ref(null)
const fileButton = reactive(['btnDownLoad'])

onMounted(() => {
})

//업로드 파일 보기
const fileUploadPopup = ref(null)

//download - 안전보건 관리책임자
const managerDownload = (id) => {
  // uploaded()
  console.log(id)

  fileUploadPopup.value.changeCmpny('VENDER')
  // let fileID = 'OUTAA0030'
  fileUploadPopup.value.openPopup(id)
}

//단기공사 정보 저장
//페이지 입력값
const page4 = reactive(
  { 
    STATUS: '',
    CMPNY_DIV: '',
    BIZ_REG_NO: '',
    VEND_CD: '',
    WORK_NO: '',
    REV_NO: '',
    GROUP_INSR_NO: '',
    INJR_INSR_NO: '',
    FILE_SECURITY: '',      //보안서약서
    FILE_SAFETY: '',        //안전작업이행각서
    FILE_INSURANCE: '',     //보험증권
    FILE_CONTRACT: '',      //공사도급계약서
    FILE_VEHICLES: '',      //차량출입서류
    FILE_ETC: '',           //기타서류
    FILE_SIGN: '',          //서명명단

    FILE_NM1: '',
    FILE_NM2: '',
    FILE_NM3: '',
    FILE_NM4: '',
    FILE_NM5: '',
    FILE_NM6: '',
    FILE_NM7: '',
  }
)

const setFileList = ref([{},{},{},{},{},{},{}])

//입력데이터 부모로 전달.
const getListData = () => {
  let resultData = ''
  resultData = setFileList.value
  return resultData
}
//입력데이터 부모로 전달.
const getData = () => {
  let resultData = ''
  resultData = page4
  return resultData
}

//부모로 부터 받은 데이터 전달
const setData = (data) => {
  console.log('data ', data)

  page4.STATUS = data.STATUS
  page4.CMPNY_DIV = data.CMPNY_DIV
  page4.BIZ_REG_NO = data.BIZ_REG_NO
  page4.VEND_CD = data.VEND_CD
  page4.WORK_NO = data.WORK_NO
  page4.REV_NO = data.REV_NO
  page4.GROUP_INSR_NO = data.GROUP_INSR_NO
  page4.INJR_INSR_NO = data.INJR_INSR_NO
  page4.FILE_SECURITY = data.FILE_SECURITY
  page4.FILE_SAFETY = data.FILE_SAFETY
  page4.FILE_INSURANCE = data.FILE_INSURANCE
  page4.FILE_CONTRACT = data.FILE_CONTRACT
  page4.FILE_VEHICLES = data.FILE_VEHICLES
  page4.FILE_ETC = data.FILE_ETC
  page4.FILE_SIGN = data.FILE_SIGN
  page4.FILE_NM1 = data.FILE_SECURITY_NAME
  page4.FILE_NM2 = data.FILE_SAFETY_NAME
  page4.FILE_NM3 = data.FILE_INSURANCE_NAME
  page4.FILE_NM4 = data.FILE_CONTRACT_NAME
  page4.FILE_NM5 = data.FILE_SIGN_NAME
  page4.FILE_NM6 = data.FILE_VEHICLES_NAME
  page4.FILE_NM7 = data.FILE_ETC_NAME
}
//파일 첨부 하는 기능 외부 단기공사랑 동일하게 처리하도록 변경 해야함.
//**처리해야할 항목
//fileUpload - 안전보건 관리책임자
const managerDialog = (child, idName) => {

let fileUploadManager = document.getElementById(idName)
fileUploadManager.click()
fileUploadManager.addEventListener('change', function (e) {

  //선택된 파일 없을시 리턴 처리
  if(e.target.files.length === 0){
    return;
  }

  // setFileList.push(selectFile(e.target.files, false, 20)[0])

  // console.log('setFileList.value ', selectFile(e.target.files, false, 20))

  let file = selectFile(e.target.files, false, 20)

  console.log('file ', file)
  if (file === undefined) {
    return
  }

  // console.log(file, ' file ' , file[0] , ' child ', child)

  // console.log('e.target ', e.target.files[0].name)
  //보안서약서
  if (child === 0) {
    page4.FILE_SECURITY = create_UUID()
    setFileList.value[child] = file[0]
    setFileList.value[child].UUID = page4.FILE_SECURITY
    // console.log('setFileList.value ', setFileList.value)
    page4.FILE_NM1 = e.target.files[0].name
      
    //안전작업이행각서
  } else if (child === 1) {
    page4.FILE_SAFETY = create_UUID()
    setFileList.value[child] = file[0]
    setFileList.value[child].UUID = page4.FILE_SAFETY
    
    page4.FILE_NM2 = e.target.files[0].name

    //보험증권
  } else if (child === 2) {
    page4.FILE_INSURANCE = create_UUID()
    setFileList.value[child] = file[0]
    setFileList.value[child].UUID = page4.FILE_INSURANCE

    
    page4.FILE_NM3 = e.target.files[0].name

    //공사도급계약서
  } else if (child === 3) {

    page4.FILE_CONTRACT = create_UUID()
    setFileList.value[child] = file[0]
    setFileList.value[child].UUID = page4.FILE_CONTRACT


    page4.FILE_NM4 = e.target.files[0].name

    //자필서명명단
  } else if (child === 4) {
    page4.FILE_SIGN = create_UUID()
    setFileList.value[child] = file[0]
    setFileList.value[child].UUID = page4.FILE_SIGN

    page4.FILE_NM5 = e.target.files[0].name

    //차량출입서류
  } else if (child === 5) {
    page4.FILE_VEHICLES = create_UUID()
    setFileList.value[child] = file[0]
    setFileList.value[child].UUID = page4.FILE_VEHICLES

    page4.FILE_NM6 = e.target.files[0].name

    //기타서류
  } else if (child === 6) {
    page4.FILE_ETC = create_UUID()
    setFileList.value[child] = file[0]
    setFileList.value[child].UUID = page4.FILE_ETC

    page4.FILE_NM7 = e.target.files[0].name
  }

})
}


const managerDialog2 = (child, id) => {

filePosition.value = child

console.log('id ', id)
isVisible.value = true
fileBtnList.value = ['btnDelete', 'btnClose']
// uploaded()
// let fileID = 'OUTAA0030'
fileUploadPopup.value.openPopup2(id,'VENDER')
}

//fileUpload - 안전보건 관리책임자
const managerDialog3 = (child, id) => {
filePosition.value = child

console.log('id ', id)
isVisible.value = false
fileBtnList.value = ['btnClose']
// uploaded()
// let fileID = 'OUTAA0030'
fileUploadPopup.value.openPopup2(id,'VENDER')

}

//전달받은 파일정보.
const uploaded = param => {
  
  // grdMain.value.getDataProvider().setValue(getRowIndexVal.value, "MSDS_FILE",param.fileId)
  console.log('uploaded param', param)

  if (param.fileId === 'a7dab046-402a-46ff-8cff-8ac33fc31964')
  {
    return
  }

  if (filePosition.value === 0) {
    page4.FILE_SECURITY = param.fileId
    page4.FILE_NM1 = param.fileNm
    
  } else if (filePosition.value === 1) {

    page4.FILE_SAFETY = param.fileId
    page4.FILE_NM2 = param.fileNm
    
  } else if (filePosition.value === 2) {

    page4.FILE_INSURANCE = param.fileId
    page4.FILE_NM3 = param.fileNm
    
  } else if (filePosition.value === 3) {

    page4.FILE_CONTRACT = param.fileId
    page4.FILE_NM4 = param.fileNm
    
  } else if (filePosition.value === 4) {

    page4.FILE_SIGN = param.fileId
    page4.FILE_NM5 = param.fileNm
    
  } else if (filePosition.value === 5) {

    page4.FILE_VEHICLES = param.fileId
    page4.FILE_NM6 = param.fileNm
    
  } else if (filePosition.value === 6) {

    page4.FILE_ETC = param.fileId
    page4.FILE_NM7 = param.fileNm
    
  }
}


defineExpose({ getData, getListData, setData })
</script>

<template>
  <div class="fill-height">
  <!-- <v-row no-gutters class="pa-0" style="height: 550px; overflow-y: scroll;"> -->
    <i-card title="파일첨부" min-width="1200" class="fill-height">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row no-gutters class="align-center pb-5">
          <i-input
            :label="t('산재보험No.')"
            v-model="page4.INJR_INSR_NO"
            class=""
            width="344px"
            labelWidth="120px"
            readonly/>
          <i-input
            :label="t('근재보험/단체보상보험(상해보험)No.')"
            v-model="page4.GROUP_INSR_NO"
            class=""
            width="510px"
            labelWidth="220px"
            readonly/>
        </v-row>
        <v-row no-gutters class="align-center pB-10">
          <i-input
          v-model='page4.FILE_NM1'
            width="344px"
            labelWidth="120px"
            :label="t('보안서약서')"
            readonly/>
          <!-- <v-file-input id="fileSecurity"  v-show="false" /> -->
          <v-btn
          v-if="page4.STATUS === '10' ||  page4.STATUS === '20' || page4.STATUS === '25'"
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog2(0, page4.FILE_SECURITY)">
            첨부
          </v-btn>
          <v-btn
          v-else
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog3(0, page4.FILE_SECURITY)">
            보기
          </v-btn>
          <i-input
          v-model='page4.FILE_NM2'
          class="pl-5"
            width="380px"
            labelWidth="120px"
            :label="t('안전작업이행각서')"
            readonly/>
          <!-- <v-file-input id="fileSafety"  v-show="false" /> -->
          <v-btn
          v-if="page4.STATUS === '10' ||  page4.STATUS === '20' || page4.STATUS === '25'"
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog2(1, page4.FILE_SAFETY)">
            첨부
          </v-btn>
          <v-btn
          v-else
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog3(1,page4.FILE_SAFETY)">
            보기
          </v-btn>
        </v-row>
        <v-row no-gutters class="align-center pB-10">
          <i-input
          
          v-model='page4.FILE_NM5'
            width="344px"
            labelWidth="120px"
            :label="t('자필서명명단')"
            readonly/>
          <!-- <v-file-input id="fileSign" v-show="false" /> -->
          <v-btn
          v-if="page4.STATUS === '10' ||  page4.STATUS === '20' || page4.STATUS === '25'"
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog2(4, page4.FILE_SIGN)">
            첨부
          </v-btn>
          <v-btn
          v-else
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog3(4, page4.FILE_SIGN)">
            보기
          </v-btn>
          <i-input
          v-model='page4.FILE_NM3'
            class="pl-5"
            width="380px"
            labelWidth="120px"
            :label="t('보험증권')"
            readonly/>
          <!-- <v-file-input id="fileInsurance"  v-show="false" /> -->
          <v-btn
          v-if="page4.STATUS === '10' ||  page4.STATUS === '20' || page4.STATUS === '25'"
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog2(2, page4.FILE_INSURANCE)">
            첨부
          </v-btn>
          <v-btn
          v-else
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog3(2, page4.FILE_INSURANCE)">
            보기
          </v-btn> 
          
          <!--<span class="pl-5" style="color: #8565f8;">
            ex) 근재보험 가입증명서 또는 단체보상보험(상해보험) 가입증명원 등
          </span>-->
        </v-row>
        <v-row no-gutters class="align-center pB-10">
          <i-input
            v-model='page4.FILE_NM4'          
            width="344px"
            labelWidth="120px"
            :label="t('공사도급계약서')"
            readonly/>
          <!-- <v-file-input id="fileContract"  v-show="false" /> -->
          <v-btn
          v-if="page4.STATUS === '10' ||  page4.STATUS === '20' || page4.STATUS === '25'"
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog2(3, page4.FILE_CONTRACT)">
            첨부
          </v-btn>
          <v-btn
          v-else
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog3(3, page4.FILE_CONTRACT)">
            보기
          </v-btn>
          <i-input
          v-model='page4.FILE_NM6'
          class="pl-5"
            width="380px"
            labelWidth="120px"
            :label="t('차량출입서류')"
            readonly/>
          <!-- <v-file-input id="fileVehicles"  v-show="false" /> -->
          <v-btn
          v-if="page4.STATUS === '10' ||  page4.STATUS === '20' || page4.STATUS === '25'"
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog2(5, page4.FILE_VEHICLES)">
            첨부
          </v-btn>
          <v-btn
          v-else
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog3(5, page4.FILE_VEHICLES)">
            보기
          </v-btn>

          <span class="pl-5" style="color: #8565f8;">
            ex) 차량등록증, 자동차보험가입증명서
          </span>

        </v-row>
        <v-row no-gutters class="align-center pB-10">
          <i-input
          v-model='page4.FILE_NM7'
            width="344px"
            labelWidth="120px"
            :label="t('기타서류')"
            readonly/>
          <!-- <v-file-input id="fileEtc"  v-show="false" /> -->
          <v-btn
          v-if="page4.STATUS === '10' ||  page4.STATUS === '20' || page4.STATUS === '25'"
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog2(6, page4.FILE_ETC)">
            첨부
          </v-btn>
          <v-btn
          v-else
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDialog3(6, page4.FILE_ETC)">
            보기
          </v-btn>
        </v-row>
      </v-col>
    </i-card>
  </div>
  <IUploadPopup
    :isVisibled="isVisible"
    ref="fileUploadPopup"
    :button-list="fileBtnList"
    @uploaded="uploaded"
    :autoUpload="true"
  />
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (405px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}

.setSubTitle {
  position: relative;

  &::after {
    position: absolute;
    color: rgb(var(--v-theme-textEmphasis));
    content: "※ 출입시간,출입문은 의뢰부서 담당자가 입력이 가능합니다. 의뢰부서 담당자에게 입력요청 하시기 바랍니다.";
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.03em;
    transform: translate(20px, -479px);
    white-space: nowrap;
  }
}

</style>


<route lang="yaml">
  meta:
    noAuth: true
  </route>
