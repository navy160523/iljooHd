<!--
  화면명 : 공사 신청 서브 화면4
  화면개요 : 공사 신청 서브 화면 기타 신청서류  
-->

<script setup>
import { ref, onMounted } from 'vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import { useI18n } from "vue-i18n"

const emit = defineEmits(['close'])

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

const fileUpload = ref(null)
const isvisible = ref(false)
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

defineExpose({ getData, getListData, setData })
</script>

<template>
  <div class="fill-height">
  <!-- <v-row no-gutters class="pa-0" style="height: 550px; overflow-y: scroll;"> -->
    <i-card title="파일첨부" min-width="1200" class="fill-height">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row no-gutters class="align-center pb-5">
          <i-input
            :label="t('산재보험No')"
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
          <v-file-input id="fileSecurity"  v-show="false" />
          <v-btn
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDownload(page4.FILE_SECURITY)">
            보기
          </v-btn>
          <i-input
          v-model='page4.FILE_NM2'
          class="pl-5"
            width="380px"
            labelWidth="120px"
            :label="t('안전작업이행각서')"
            readonly/>
          <v-file-input id="fileSafety"  v-show="false" />
          <v-btn
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDownload(page4.FILE_SAFETY)">
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
          <v-file-input id="fileSign" v-show="false" />
          <v-btn
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDownload(page4.FILE_SIGN)">
            보기
          </v-btn>
          <i-input
          v-model='page4.FILE_NM3'
            class="pl-5"
            width="380px"
            labelWidth="120px"
            :label="t('보험증권')"
            readonly/>
          <v-file-input id="fileInsurance"  v-show="false" />
          <v-btn
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDownload(page4.FILE_INSURANCE)">
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
          <v-file-input id="fileContract"  v-show="false" />
          <v-btn
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDownload(page4.FILE_CONTRACT)">
            보기
          </v-btn>
          <i-input
          v-model='page4.FILE_NM6'
          class="pl-5"
            width="380px"
            labelWidth="120px"
            :label="t('차량출입서류')"
            readonly/>
          <v-file-input id="fileVehicles"  v-show="false" />
          <v-btn
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDownload(page4.FILE_VEHICLES)">
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
          <v-file-input id="fileEtc"  v-show="false" />
          <v-btn
            elevation="0"
            class="mL-5"
            color="btnSecondary"
            @click="managerDownload(page4.FILE_ETC)">
            보기
          </v-btn>
        </v-row>
      </v-col>
    </i-card>
  </div>
  <IUploadPopup
    :isVisibled="false"
    ref="fileUploadPopup"
    :button-list="['btnClose']"
    @uploaded="uploaded"
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
