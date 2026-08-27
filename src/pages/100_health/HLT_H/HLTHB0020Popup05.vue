<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import { isEmpty } from "@/@core/utils";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  commonRequest,
  commonSendApi,
} from "@hiway/api/commonApi";
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js";
import IGridTitle from "@/components/IGridTitle.vue";
import ILabel from "@/components/ILabel.vue";
import dayjs from "dayjs";
import Message from "@hiway/utils/notify";
import _ from "lodash";
import EmpPopup from "@/components/popup/EmpPopup.vue";

const emit = defineEmits(["after-search", "send-notify"]);

const dialog = ref(false);
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
const menuTitle = ref(null);
const empPopup = ref(null);
const content = ref(null);
const sendType = ref("");
const textMain = ref("");
const approvalYn = ref('Y');
const empList = ref({});

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: "", // 사번(pk)
  EMP_NM: "", // 이름
  BIRTH_DAY: "", // 생일
  HLD_OFFI_GBN: "", // 재직구분
  BSNS_NM: "", // 사업부
  BSNS_CD: "",
  DEPT_NM: "", // 부서
  DEPT_CD: "",
  ASGN_NM: "", // 과
  ASGN_CD: "",
  STD_DUTY_NM: "", // 직종
  JOB_TIT_NM: "", //직급
  COM_ENT_DATE: "", // 입사일자
  RETI_DATE: "", // 휴,퇴직일
  APPLI_GUBUN: "", // 신청구분
  APPLI_GUBUN_NM: "", // 신청구분명
  HOSPITAL_CODE: "", // 진단기관
  HOSPITAL_NM: "", // 진단기관명
  BODY1_CODE: "", // 신체부위1
  BODY1_NM: "", //신체부위1 명
  BODY2_CODE: "", // 신체부위2
  BODY2_NM: "", //신체부위2 명
  DIAGNOSIS_DATE: "", // 진단일
  DISEASE_CODE: "", // 상병코드 (PK)
  DISEASE_NM: "", // 상병명
  APPLI_DATE: "", // 진정일(pk)
  INCIDENT_CODE: "", // 발생경위 코드
  INCIDENT_NM: "", // 발생경위
  NOTIFY_FILE_ID: "", // 사실통지서
  WORK_YEAR: "",
  SAVE_YN: "",
});

const chipArr = reactive({
  TO_EMP: [],
  TO_SAVE:[],
  SENDER: [],
  REFERER: [],
});

const chipArrTemp = reactive({
  TO_EMP: [],
  SENDER: [],
  REFERER: [],
});

// 메일전송
const mailParams = reactive({
  EMAIL: [],
  SENDER: [],
  REFERER: [],
  SUBJECT: "",
  CONTENT: "",
});

const codeList = reactive({
  HLD_OFFI_GBN: [
    { COD: "1", TXT: "재직" },
    { COD: "2", TXT: "휴직" },
    { COD: "3", TXT: "퇴사" },
    { COD: "4", TXT: "군입영" },
  ],
});

// 팝업 OPEN
const openPopup = (param) => {
  // console.log("param : ", param);

  empList.value = {};
  approvalYn.value = 'Y'
  textMain.value = '';

  searchParams.EMP_NM = param.EMP_NM;
  searchParams.SAVE_YN = "Y";
  mailParams.EMAIL = [];
  mailParams.REFERER = [];
  chipArr.TO_EMP = [];
  chipArr.SENDER = [];
  chipArr.REFERER = [];
  chipArrTemp.TO_EMP = [];
  chipArrTemp.SENDER = [];
  chipArrTemp.REFERER = [];

  if (!isEmpty(userStore.email)) {
    chipArr.SENDER.push({ EMP_NM: userStore.empNm, EMAIL: userStore.email });
  }

  let rowList = [];

  for (let idx of param) {
    if(!isEmpty(idx.TO_EMAIL)){
      const year =  idx.REQ_DT.getFullYear();
      const month = String(idx.REQ_DT.getMonth() + 1).padStart(2, '0'); // 0~11 이므로 +1
      const day = String(idx.REQ_DT.getDate()).padStart(2, '0');

      const formattedDate = `${year}-${month}-${day}`;

      empList.value[idx.TO_EMAIL] = empList.value[idx.TO_EMAIL] || [];
      empList.value[idx.TO_EMAIL][formattedDate] = empList.value[idx.TO_EMAIL][formattedDate] || [];
      empList.value[idx.TO_EMAIL][formattedDate].push(idx); //.EMP_NM

      let sameList = rowList.filter(
        (item) => item.CMPNY_DIV === idx.CMPNY_DIV && item.TO_EMP_NM === idx.TO_EMP_NM   
      );

      if (isEmpty(sameList) && idx.STATUS === '3' && idx.RECEIVE_APPROVAL_YN != 'Y' && idx.RECEIVE_APPROVAL_YN != 'N') {
        rowList.push(idx);
        
        chipArrTemp.TO_EMP.push({ 
          CMPNY_DIV: idx.CMPNY_DIV,
          YEAR : idx.YEAR,
          REQ_DIV : idx.REQ_DIV,
          REQ_CHA : idx.REQ_CHA,
          EMP_NO  : idx.EMP_NO,
          RECEIVE_APPROVAL_YN : idx.RECEIVE_APPROVAL_YN,
          REMARK  : idx.REMARK,
          USER_ID : userStore.empNo,
          EMP_NM: idx.TO_EMP_NM,
          EMAIL: idx.TO_EMAIL, 
          REQ_DT: formattedDate
        });
      }
    }
    
  }

  const emailKey = Object.keys(empList.value);
  for(let dataA of emailKey){ 
    const innerKeys = Object.keys(empList.value[dataA]);
    for(let dataB of innerKeys){ //날짜
      let sendEMP = ''

      for(let dataC in empList.value[dataA][dataB]){
        const year =  empList.value[dataA][dataB][dataC].REQ_DT.getFullYear();
        const month = String(empList.value[dataA][dataB][dataC].REQ_DT.getMonth() + 1).padStart(2, '0'); // 0~11 이므로 +1
        const day = String(empList.value[dataA][dataB][dataC].REQ_DT.getDate()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;

        chipArr.TO_SAVE.push({ 
            CMPNY_DIV: empList.value[dataA][dataB][dataC].CMPNY_DIV,
            YEAR : empList.value[dataA][dataB][dataC].YEAR,
            REQ_DIV : empList.value[dataA][dataB][dataC].REQ_DIV,
            REQ_CHA : empList.value[dataA][dataB][dataC].REQ_CHA,
            EMP_NO  : empList.value[dataA][dataB][dataC].EMP_NO,
            RECEIVE_APPROVAL_YN : empList.value[dataA][dataB][dataC].RECEIVE_APPROVAL_YN,
            REMARK  : empList.value[dataA][dataB][dataC].REMARK,
            USER_ID : userStore.empNo,
            EMP_NM: empList.value[dataA][dataB][dataC].EMP_NM,
            EMAIL: empList.value[dataA][dataB][dataC].TO_EMAIL, 
            REQ_DT: formattedDate
          });
        
        sendEMP += empList.value[dataA][dataB][dataC].EMP_NM + ','
      }

      sendEMP = sendEMP.replace(/,$/, '');

      chipArr.TO_EMP.push({
        TO_EMP_NM : empList.value[dataA][dataB][0].TO_EMP_NM,
        EMP_NM : sendEMP,
        EMAIL  : dataA,
        REQ_DT : dataB,
      })

      mailParams.EMAIL.push(dataA);
    }
  }

  dialog.value = true;
};

const singleContent = (empValue) =>{
  let content ='';
  if(approvalYn.value === 'Y'){
    content = `<div data-v-24470f18="" class="pa-4 ml-4 mr-4 mb-4 cont"><div data-v-24470f18="" style="margin: 5px; font-size: 13px; font-weight: bold;"> 
      제목: 안전장화 지급 승인 안내 </div><br data-v-24470f18=""><div data-v-24470f18="" style="margin: 5px; font-size: 13px; font-weight: bold;"> 
      본문: ${empValue.TO_EMP_NM} 님께, </div><br data-v-24470f18=""><div data-v-24470f18="" style="margin-left: 16px;"><div data-v-24470f18="" style="font-size: 13px;"> 
      ■ 대상자명: ${empValue.EMP_NM} </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      ■ 신청일자: ${empValue.REQ_DT} </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      ■ 지급 대상 여부: 대상자 </div><br data-v-24470f18=""><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      안전장화는 아래 시간과 장소에서 수령 가능합니다. </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ </div><div data-v-24470f18="" style="font-size: 13px;"> 
      📍 안전장화 창고 운영 안내 </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      1. 운영시간 </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      - 본공장: 화 10:00~11:30, 목 13:30~15:00 </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      - 해양공장: 목 10:00~11:00 </div><br data-v-24470f18=""><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      2. 창고 위치 </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      - 본공장: 생산4관(구.플랜트본관) 지하 1층 </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      - 해양공장: 화암문 입구 좌측 50미터 지점 컨테이너 창고 </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ </div><div data-v-24470f18="" style="font-size: 13px;"> 
      문의처: 안전보건지원부 김병태 책임 (☎ 2-6118) </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      감사합니다. </div><br data-v-24470f18=""></div></div>`
  }else if(approvalYn.value === 'N'){
    content = `<div data-v-24470f18="" class="pa-4 ml-4 mr-4 mb-4 cont"><div data-v-24470f18="" style="margin: 5px; font-size: 13px; font-weight: bold;"> 
      제목: 안전장화 지급 신청 반려 안내 </div><br data-v-24470f18=""><div data-v-24470f18="" style="margin: 5px; font-size: 13px; font-weight: bold;"> 
      본문: ${empValue.EMP_NM} 님께, </div><br data-v-24470f18=""><div data-v-24470f18="" style="margin-left: 16px;"><div data-v-24470f18="" style="font-size: 13px;"> 
      신청하신 대상자의 안전장화 신청이 아래의 사유로 반려되었음을 안내드립니다. </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      ■ 대상자명: ${empValue.EMP_NM} </div><div data-v-24470f18="" style="font-size: 13px;"> 
      ■ 신청일자: ${empValue.REQ_DT} </div><div data-v-24470f18="" style="font-size: 13px;"> 
      ■ 지급 대상 여부: 비대상자 </div><div data-v-24470f18="" style="font-size: 13px;"> 
      ■ 반려사유: </div><div data-v-24470f18=""><p>${textMain.value}</p></div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      문의사항은 안전보건지원부 김병태 책임 (☎ 2-6118)으로 연락 바랍니다. </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      안전장화 관리 및 효율적 운영을 위한 절차이오니, 양해 부탁드립니다. </div><br data-v-24470f18=""><div data-v-24470f18="" style="font-size: 13px;"> 
      감사합니다. </div></div></div>`
  }
  return content
}

const saveApprovalData = async (data) => {
  let saveParam = [];
  let param = data;
    param.REMARK = textMain.value;
    param.RECEIVE_APPROVAL_YN = 'Y'//approvalYn.value
  saveParam.push(param);
  console.log('saveParam : ', saveParam)
  commonExecuteApi({ queryId: "HLTHB0020_SAVE_06", list: saveParam });
};

const sendAllEmails = async () =>{
  const promises = chipArr.TO_EMP.map(async (idx) => {

    let title = approvalYn.value === 'Y' ? '안전장화 지급 승인 안내' : '안전장화 지급 신청 반려 안내'

    let mailParam = {
      EMAIL: [idx.EMAIL],
      SUBJECT: title,
      CONTENT: singleContent(idx),
    }
    return commonSendApi(mailParam);
  })

  const promisesSave = chipArr.TO_SAVE.map(async (idx) => {
    let result = await saveApprovalData(idx)
  })

  try{
    const result = await Promise.all(promises, promisesSave);
    
    emit('send-notify')
    closePopup()
    Message.success(t('메일이 전송되었습니다.'))
  }catch(e){
    console.log('에러 : ',e)
    Message.success(t(`메일 전송중 에러가 발생했습니다. ${e}`))
  }
}

// button click event
const onButtonsClick = async (btn) => {
  if (btn.id === "btnSendMail") {

    // 수신자 없을 시 return
    if (isEmpty(mailParams.EMAIL)) {
      return Message.warn(t("수신자를 지정해주십시오."));
    }

    vm.$swal({
      title: t("메일 전송하시겠습니까?"),
      showCancelButton: true,
    }).then((ck) => {
      if (ck.isConfirmed === true) {
        sendAllEmails();
      }
    });
  } else if (btn.id === "btnClose") {
    closePopup();
  } else if( btn.id === "btnPaymentTarget"){
    approvalYn.value = 'Y'
  } else if( btn.id === "btnPaymentNonTarget"){
    approvalYn.value = 'N'
  }
};

/* ********** 닫기 ********** */
const closePopup = () => {
  emit("after-search");
  textMain.value = "";
  dialog.value = false;
};

// 인원조회 팝업 오픈(받는사람)
const openPopupToEmp = () => {
  sendType.value = "S";
  empPopup.value.openPopup({ MULTI: true });
};

// 인원조회 팝업 오픈(참조자)
const openPopupReferer = () => {
  sendType.value = "R";
  empPopup.value.openPopup({ MULTI: true });
};

// 받는사람 삭제
const chipDel = (item) => {
  chipArr.TO_EMP = chipArr.TO_EMP.filter((x) => x.EMAIL !== item);
  mailParams.EMAIL = mailParams.EMAIL.filter((x) => x !== item);
};

// 참조 삭제
const chipDelRef = (item) => {
  chipArr.REFERER = chipArr.REFERER.filter((x) => x.EMAIL !== item);
  mailParams.REFERER = mailParams.REFERER.filter((x) => x !== item);
};

// 인원조회
const onEmpSelected = (row) => {
  for (let i of row) {
    if (i.EMAIL && i.EMAIL !== "") {
      if (sendType.value === "S") {
        // 보내는 사람을 선택했을 시
        chipArr.TO_EMP.push({ EMP_NM: i.EMP_NM, EMAIL: i.EMAIL });
        const uniqueData = Array.from(
          new Set(chipArr.TO_EMP.map(JSON.stringify))
        ).map(JSON.parse);
        chipArr.TO_EMP = uniqueData;

        // email
        mailParams.EMAIL.push(i.EMAIL);
        let setMail = new Set([...mailParams.EMAIL]);
        mailParams.EMAIL = [...setMail];
      } else if (sendType.value === "R") {
        // 참조를 선택했을 시
        chipArr.REFERER.push({ EMP_NM: i.EMP_NM, EMAIL: i.EMAIL });
        const uniqueData = Array.from(
          new Set(chipArr.REFERER.map(JSON.stringify))
        ).map(JSON.parse);
        chipArr.REFERER = uniqueData;

        // email
        mailParams.REFERER.push(i.EMAIL);
        let setMail = new Set([...mailParams.REFERER]);
        mailParams.REFERER = [...setMail];
      }
    } else {
      Message.warn(t(`${i.EMP_NM} 님이 이메일주소가 없습니다.`));
    }
  }
};

defineExpose({
  openPopup,
});
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="800"
    height="800"
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
      <span>안전장화 지급/비지급 대상자 메일 작성</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnPaymentTarget',
            'btnPaymentNonTarget',
            'btnSendMail',
            'btnClose',
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <ILabel :label="$t('수신')" :required="true">
            <!-- append-inner-icon="mdi-magnify"
                @click:appendInner="openPopupToEmp" -->
            <template #editor="editorProps">
              <VTextField
                readonly
                class="setWhiteColor"
              >
                <v-chip
                  v-for="(item, i) in chipArrTemp.TO_EMP"
                  :key="i"
                  class="ml-2"
                  size="small"
                  @click="chipDel(item.EMAIL)"
                >
                  {{ item.EMP_NM }}
                </v-chip>
              </VTextField>
            </template>
          </ILabel>
          <ILabel :label="$t('발신')" class="mt-2">
            <template #editor="editorProps">
              <VTextField readonly class="setWhiteColor">
                <v-chip
                  v-for="(item, i) in chipArr.SENDER"
                  :key="i"
                  class="ml-2"
                  size="small"
                >
                  {{ item.EMP_NM }}
                </v-chip>
              </VTextField>
            </template>
          </ILabel>
          <!-- <ILabel :label="$t('참조')" class="mt-2">
            <template #editor="editorProps">
              <VTextField
                append-inner-icon="mdi-magnify"
                @click:appendInner="openPopupReferer({ gbn: 'Referer' })"
                readonly
                class="setWhiteColor"
              >
                <v-chip
                  v-for="(item, i) in chipArr.REFERER"
                  :key="i"
                  class="ml-2"
                  size="small"
                  @click="chipDelRef(item.EMAIL)"
                >
                  {{ item.EMP_NM }}
                </v-chip>
              </VTextField>
            </template>
          </ILabel> -->
        </v-sheet>
      </div>
      <div v-if="approvalYn == 'Y'" ref="content" class="pa-4 ml-4 mr-4 mb-4 cont">
        <div style="margin: 5px; font-size: 13px; font-weight: bold">
          제목: 안전장화 지급 승인 안내
        </div>
        <br />
        <div style="margin: 5px; font-size: 13px; font-weight: bold">
          본문: [신청자이름] 님께,
        </div>
        <br />
        <div style="margin-left: 16px">
          <div style="font-size: 13px">
            ■ 대상자명: [안전장화 지급 대상 직원 이름]
          </div>
          <br />
          <div style="font-size: 13px">
            ■ 신청일자: [신청일]
          </div>
          <br />
          <div style="font-size: 13px">
            ■ 지급 대상 여부: 대상자
          </div>
          <br />
          <br />
          <div style="font-size: 13px">
            안전장화는 아래 시간과 장소에서 수령 가능합니다.
          </div>
          <br />
          <div style="font-size: 13px">
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          </div>
          <div style="font-size: 13px">
            📍 안전장화 창고 운영 안내
          </div>
          <br />
          <div style="font-size: 13px">
            1. 운영시간
          </div>
          <br />
          <div style="font-size: 13px">
            - 본공장: 화 10:00~11:30, 목 13:30~15:00
          </div>
          <br />
          <div style="font-size: 13px">
            - 해양공장: 목 10:00~11:00
          </div>
          <br />
          <br />
          <div style="font-size: 13px">
            2. 창고 위치
          </div>
          <br />
          <div style="font-size: 13px">
            - 본공장: 생산4관(구.플랜트본관) 지하 1층  
          </div>
          <br />
          <div style="font-size: 13px">
            - 해양공장: 화암문 입구 좌측 50미터 지점 컨테이너 창고
          </div>
          <br />
          <div style="font-size: 13px">
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          </div>
          <div style="font-size: 13px">
            문의처: 안전보건지원부 김병태 책임 (☎ 2-6118)
          </div>
          <br />
          <div style="font-size: 13px">
            감사합니다.
          </div>
          <br />
        </div>
      </div>
      <div v-else ref="content" class="pa-4 ml-4 mr-4 mb-4 cont">
        <div style="margin: 5px; font-size: 13px; font-weight: bold">
          제목: 안전장화 지급 신청 반려 안내
        </div>
        <br />
        <div style="margin: 5px; font-size: 13px; font-weight: bold">
          본문: [신청자이름] 님께,
        </div>
        <br />
        <div style="margin-left: 16px">
          <div style="font-size: 13px">
            신청하신 대상자의 안전장화 신청이 아래의 사유로 반려되었음을 안내드립니다.
          </div>
          <br />
          <div style="font-size: 13px">
            ■ 대상자명: [안전장화 지급 대상 직원 이름]
          </div>
          <div style="font-size: 13px">
            ■ 신청일자: [신청일]
          </div>
          <div style="font-size: 13px">
            ■ 지급 대상 여부: 비대상자
          </div>
          <div style="font-size: 13px">
            ■ 반려사유: 
          </div>
          <div>
            <textarea
              style="
                font-size: 13px;
                width: 100%;
                height: 150px;
                border: 2px solid #4645b9;
                padding: 6px;
                border-radius: 0.5rem;
              "
              v-model="textMain"
            />
          </div>
          <br />
          <div style="font-size: 13px">
            문의사항은 안전보건지원부 김병태 책임 (☎ 2-6118)으로 연락 바랍니다.
          </div>
          <br />
          <div style="font-size: 13px">
            안전장화 관리 및 효율적 운영을 위한 절차이오니, 양해 부탁드립니다.
          </div>
          <br />
          <div style="font-size: 13px">
            감사합니다.  
          </div>
        </div>
      </div>
      
    </v-card>
  </v-dialog>
  <EmpPopup ref="empPopup" @selected="onEmpSelected" />
</template>

<style scoped lang="scss">
::v-deep(.setWhiteColor > .v-input__control > .v-field) {
  background-color: #ffffff !important;
}

.cont {
  border: 2px solid rgb(117, 121, 208);
  border-radius: 0.5rem;
}
</style>
