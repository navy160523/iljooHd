<!--
  화면명 : 단기공사 현황 팝업
  화면개요 : 단기공사 상세 팝업
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from '@hiway/stores/common'
import { useRouter,useRoute } from "vue-router";
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
// import RealGrid from "@/components/RealGrid.vue";
import {
  commonSearchApi,
  getCodeList,
  getCompanyList,
  commonRequest,
  commonExecuteApi,
  commonSendApi,
  commonSendSMS,
  commonSearchMySqlApi
} from '@hiway/api/commonApi'
// import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'
import SAFJA0040Popup02 from '@/pages/30_safety/SAF_J/SAFJA0040Popup02.vue'
import SAFJA0040Popup03 from '@/pages/30_safety/SAF_J/SAFJA0040Popup03.vue'
import SAFJA0040Popup05 from '@/pages/30_safety/SAF_J/SAFJA0040Popup05.vue'

import SendMailPopup from '@/pages/30_safety/SAF_J/SendMailPopup.vue'
import Sub01 from '@/pages/30_safety/SAF_J/SAFJA0010Popup01_Sub01.vue'
import Sub02 from '@/pages/30_safety/SAF_J/SAFJA0010Popup01_Sub02.vue' 
import Sub03 from '@/pages/30_safety/SAF_J/SAFJA0010Popup01_Sub03.vue'
import Sub04 from '@/pages/30_safety/SAF_J/SAFJA0010Popup01_Sub04.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
// import DATAPopup from "@/pages/99_indexPopUp/DATAPopup.vue"
import dayjs from 'dayjs'
import { isEmpty } from 'lodash-es'
import { setFileUpload2 } from "@/utils/sWorkFileTool"
const emit = defineEmits(['selected'])
// import Sub05 from '@/pages/30_safety/SAF_J/SAFJA0040Popup01_Sub05.vue'
// import Sub06 from '@/pages/30_safety/SAF_J/SAFJA0040Popup01_Sub06.vue'
const props = defineProps({
  btnGubun: {
    type: String,
    default: '1',
  },
})

const commonStore = useCommonStore()
const route = useRoute()

const dialog = ref(false)

const WRK_DIV =ref('S')

const vm = getCurrentInstance().proxy //다이얼로그관련
const SAFJA0040Pop02 = ref(null)
const SAFJA0040Pop03 = ref(null)
const SAFJA0040Pop05 = ref(null)

const sendMailPop = ref(null)
const userStore = useUserStore()
const t = useI18n().t //다국어
const gridTitle = ref(null)
const grd1 = ref(null)
const exPanel = ref(null)


const showCancleRemark = ref(false) // 모달창 flag


// tab 정보
const tab = ref(0)
const refSub01 = ref(null)
const refSub02 = ref(null)
const refSub03 = ref(null)
const refSub04 = ref(null)
const refSub05 = ref(null)
const refSub06 = ref(null)

let gridData = reactive({})
let setPopupParam = reactive({})

const resultData = reactive({})

const codeList = reactive({
  dataList1: [], //회사구분
  dataList2: [], //출입용도
  dataList3: [], //부문
  dataList4: [], //위험작업여부
  dataList5: [], //진행상태
  dataList6: [], //안전팀(승인)
  dataList7: [], //안전팀(확인)
})

// 공사정보
let dtAppro = reactive([])
// 공사인원정보
let dtApproPerson = reactive([])

// 공사담당부서 담당자
const dept_pic_emp_no = ref('')

const m_dialog = ref(false)
const radioVal = reactive({
  val1: 'N',
  val2: 'N',
  val3: 'N',
})
const appYN = ref(true)


const noticeArray = reactive([]) //보여줘야할 공지사항을 저장하고 있는 배열
const noticeDialog = ref(false) //공지사항 dialog vmodel

//결재팝업
const approvalPopup = ref(null)

// 메일수신자 리스트
let dtMailSend = reactive([])

// 단기공사 업체 연간 공사 List
let dtYearList = reactive([])


// 날짜 차이 계산
const getDateDiff = (d1, d2) => {
  const date1 = new Date(d1)
  const date2 = new Date(d2)
  
  const diffDate = date1.getTime() - date2.getTime()
  
  return Math.abs(diffDate / (1000 * 60 * 60 * 24)) // 밀리세컨 * 초 * 분 * 시 = 일
}




const closeModal = ()  => {
  showCancleRemark.value = false;
}


//해당 페이지에 데이터 전달
const setData = async () => {

  await commonSearchApi({ queryId: 'OUTBA0020_SEARCH_05', param: setPopupParam }).then(
    async (res) => {
      if (res.ORESULT_CUR.length > 0) {
        console.log('res.ORESULT_CUR ', res.ORESULT_CUR)
        WRK_DIV.value = res.ORESULT_CUR[0].WRK_DIV
        setPopupParam.STATUS = res.ORESULT_CUR[0].STATUS
        // 공사담당부서 담당자 
        dept_pic_emp_no.value = res.ORESULT_CUR[0].DEPT_PIC_EMPNO
        // setPopupParam.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
        // setPopupParam.BIZ_REG_NO = res.ORESULT_CUR[0].BIZ_REG_NO
        // setPopupParam.VEND_CD = res.ORESULT_CUR[0].VEND_CD
        // setPopupParam.WORK_NO = res.ORESULT_CUR[0].WORK_NO
        // setPopupParam.REV_NO = res.ORESULT_CUR[0].REV_NO
        // setPopupParam.USER_ID = userStore.userId

        resultData.value = res.ORESULT_CUR[0]
        //접수반려 버튼
        if (res.ORESULT_CUR[0].STATUS == '20' || res.ORESULT_CUR[0].STATUS == '25') {
          gridTitle.value.disableBtn('btnReqReturn', false)
        } else {
          gridTitle.value.disableBtn('btnReqReturn', true)
        }

        // 2025.07.10 결재 반려(12) 상태도 다시 결재 할수 있도록 활성화
        if (res.ORESULT_CUR[0].REQ_PIC_EMPNO === res.ORESULT_CUR[0].DEPT_PIC_EMPNO) {
          if (res.ORESULT_CUR[0].STATUS == '20' || res.ORESULT_CUR[0].STATUS == '25' || res.ORESULT_CUR[0].STATUS == '12') {
            gridTitle.value.disableBtn('btnReqApply', false)
            gridTitle.value.disableBtn('btnFinishReview', true)
          } else {
            gridTitle.value.disableBtn('btnReqApply', true)
            gridTitle.value.disableBtn('btnFinishReview', true)
          }

        } else {
          if (res.ORESULT_CUR[0].STATUS == '20') {
            gridTitle.value.disableBtn('btnReqApply', true)
            gridTitle.value.disableBtn('btnFinishReview', false)
            
          } else if (res.ORESULT_CUR[0].STATUS == '25' || res.ORESULT_CUR[0].STATUS == '12') {
            console.log('userStore userId ', userStore.userId)
            if (userStore.userId === res.ORESULT_CUR[0].DEPT_PIC_EMPNO) {
              gridTitle.value.disableBtn('btnReqApply', false)
            } else {
              gridTitle.value.disableBtn('btnReqApply', false) // 로그인자와 달라도 일단은 살려둠 -> 오류메세지로 안내  한민규 241115
            }
            gridTitle.value.disableBtn('btnFinishReview', true)
          } else {
            gridTitle.value.disableBtn('btnReqApply', true)
            gridTitle.value.disableBtn('btnFinishReview', true)
          }
        }
        // tab.value = 0
        //결재상신

      }
    })
  nextTick(() => {
    if (tab.value === 0) {
      refSub01.value.setData(resultData.value)
    } else if (tab.value === 1) {
      refSub02.value.setData(resultData.value)
    } else if (tab.value === 2) {
      refSub03.value.setData(resultData.value, props.btnGubun)
    } else if (tab.value === 3) {
      refSub04.value.setData(resultData.value)
    } else if (tab.value === 4) {
      refSub05.value.setData(resultData.value)
    } else if (tab.value === 5) {
      console.log('getJsonData.value ', resultData.value)
      refSub06.value.setData(resultData.value)
    }
  })
}

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    //회사구분
    getCompanyList(),
    //출입용도
    getCodeList('HHIE270'),
  ]).then((res) => {
    // console.log("레스 확인", res)

    //회사구분 콤보박스
    codeList.dataList1 = res[0].ORESULT_CUR

    //출입용도
    codeList.dataList2 = res[1].ORESULT_CUR
  })
}

const saveStatus = async (data,gubun) => {
  
  await commonExecuteApi({
    queryId:"OUTBA0020_UPDATE_02",
      list:data,
  }).then(async res => {
    console.log('우리 상태코드 저장이 잘됐는지 확인해볼까요? :::  ', res)
    console.log('resultData.value ', resultData.value)

    if (gubun === 'btnReqReturn') {
      //접수 반려
      await alarmSendSMS(resultData.value, 'reqReturn')
     
    } else if (gubun === 'btnFinishReview') {
      //검토완료
      await alarmSendSMS(resultData.value, 'DEPT')
      await alarmSendEmail(resultData.value, 'DEPT') 
    }
  })
}

const alarmSendSMS = async (data, gubun) => {
  
  if (gubun === 'REQ') {
    //출입부서 담당자 문자

    await commonSearchApi({
      queryId: "OUTBA0020_SEARCH_04",
      param: {
        CMPNY_DIV: '',
        EMPNM: data.REQ_PIC_NAME,
        TELNO: data.REQ_PIC_TEL,
      },
    }).then(async res => { 
      console.log('REQ ', res)

      let sendSMSParams = {}

      if (res.ORESULT_CUR.length > 0) {

        sendSMSParams.SYSCODE = "000";
        sendSMSParams.FROM_P_NO = data.INSERT_USER_TEL.replace(/-/g, ""); //작성자 번호
        sendSMSParams.TO_P_NO =  res.ORESULT_CUR[0].HND_PHN
        sendSMSParams.TITLE = `[HiSEs] 단기공사 출입신청이 접수되었습니다. 메일 확인 부탁드립니다`;
        sendSMSParams.GUBUN = "0";

        commonSendSMS(sendSMSParams).then((res) => {
          console.log('DEPT ', res)
        });
      }
    })  

  } else if (gubun === 'DEPT') {
    //공사담당부서 문자
    await commonSearchApi({
      queryId: "OUTBA0020_SEARCH_04",
      param: {
        CMPNY_DIV: '',
        EMPNM: data.DEPT_PIC_NAME,
        TELNO: data.DEPT_PIC_TEL,
      },
    }).then(async res => { 
      console.log('DEPT ', res)

      let sendSMSParams = {}

      if (res.ORESULT_CUR.length > 0) {

        sendSMSParams.SYSCODE = "000";
        sendSMSParams.FROM_P_NO = data.INSERT_USER_TEL.replace(/-/g, ""); //작성자 번호
        sendSMSParams.TO_P_NO = res.ORESULT_CUR[0].HND_PHN
        sendSMSParams.TITLE = `[HiSEs] 단기공사 출입신청 접수가 완료되었습니다. 메일 확인 부탁드립니다`;
        sendSMSParams.GUBUN = "0";

        commonSendSMS(sendSMSParams).then((res) => {
          console.log('DEPT ', res)
        });
      }
    })  
    
  } else if (gubun === 'WRK') {
    //공사관리부서 문자
    await commonSearchApi({
      queryId: "OUTBA0020_SEARCH_04",
      param: {
        CMPNY_DIV: '',
        EMPNM: data.WRK_MNG_EMPNM,
        TELNO: data.WRK_MNG_EMPTEL,
      },
    }).then(async res => { 
      console.log('WRK ', res)

      let sendSMSParams = {}

      if (res.ORESULT_CUR.length > 0) {

        sendSMSParams.SYSCODE = "000";
        sendSMSParams.FROM_P_NO = data.INSERT_USER_TEL.replace(/-/g, ""); //작성자 번호
        sendSMSParams.TO_P_NO = res.ORESULT_CUR[0].HND_PHN
        sendSMSParams.TITLE = `[HiSEs] 단기공사 출입신청이 접수되었습니다. 메일 확인 부탁드립니다`;
        sendSMSParams.GUBUN = "0";

        commonSendSMS(sendSMSParams).then((res) => {
          console.log('DEPT ', res)
        });
      }
      
    })  
  } else if (gubun === 'reqReturn') {
    console.log('data :: ', data)

    let sendSMSParams = {} 

    sendSMSParams.SYSCODE = "000";
    sendSMSParams.FROM_P_NO = data.INSERT_USER_TEL.replace(/-/g, ""); //작성자 번호
    sendSMSParams.TO_P_NO = data.INSERT_USER_TEL.replace(/-/g, "");
    sendSMSParams.TITLE = `[HiSEs] 단기공사 출입신청이 접수반려되었습니다. \r`
                        // + `-공사번호 : `+ data.WORK_NO_NAME+`\r`
                        + `-공사명 : `+ data.WORK_DESC+`\r`
                        + `-공사기간 : `+ data.WORK_FROM_DT+`~`+ data.WORK_TO_DT+`\r`;
    sendSMSParams.GUBUN = "0";

    commonSendSMS(sendSMSParams).then((res) => {
      console.log('reqReturn ', res)
    });
  }
};

const alarmSendEmail = async (data,gubun) => {
  if (gubun === 'REQ') {
    //출입부서 담당자 문자

    await commonSearchApi({
      queryId: "OUTBA0020_SEARCH_04",
      param: {
        CMPNY_DIV: '',
        EMPNM: data.REQ_PIC_NAME,
        TELNO: data.REQ_PIC_TEL,
      },
    }).then(async res => { 
      console.log('REQ ', res)

      let mailParams = {}

      if (res.ORESULT_CUR.length > 0) {

        mailParams.EMAIL = [res.ORESULT_CUR[0].EMAIL];
        mailParams.SUBJECT = "[HiSEs] 단기공사 출입신청 접수 요청"
        mailParams.CONTENT = ` 
        </br>
        단기공사 출입신청이 접수되었습니다. 아래 경로로 접속하시어 신청 접수를 해 주시기 바랍니다.
        </br> 경로: HiSEs 접속 - 안전 - 단기공사 관리 - 단기공사 승인(부서용)
        </br>
        <table class="" style="border-collapse: collapse;">
          <tbody>
            <tr>
              <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:250px; text-align: center;">업체명 </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:400px; text-align: center;">공사명</td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:150px; text-align: center;"> 공사기간 </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px; text-align: center;"> 작성자 </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px; text-align: center;"> 연락처 </td>
            </tr>
            <tr>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">${data.VND_NAME ? data.VND_NAME : ''}</td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${data.WORK_DESC ? data.WORK_DESC : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${data.WORK_FROM_DT} ~ ${data.WORK_TO_DT} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${data.INSERT_USER_NM ? data.INSERT_USER_NM : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${data.INSERT_USER_TEL ? data.INSERT_USER_TEL : ''} </td>
            </tr>
          </tbody>
        </table>

      </br> <담당자별 역할 설명>
      <table class="" style="border-collapse: collapse;">
        <thead>
          <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; text-align: center;"> 담당자</td>
          <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; text-align: center;"> 소속</td>
          <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; text-align: center;"> 역할</td>
        </thead>

        <tbody>
          <tr>
            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 출입신청부서 담당자</td>
            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 출입에만 관여하는 부서</td>
            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사접수: 출입관련정보 작성/검토 (결재상신X)</td>
          </tr>
          <tr>
            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사담당부서 담당자</td>
            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사를 요청한 부서</td>
            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사접수: 최종 결재 </td>
          </tr>
          <tr>
            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사관리부서 담당자</td>
            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> PTW 관리 부서</td>
            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 위험작업허가서 접수 및 신청: 해당 부서인원은 누구나 작성중인 허가서를 열어서 신청 올릴 수 있음</td>
          </tr>
        </tbody>
      </table>
        `

        commonSendApi(mailParams).then(() => {
          Message.success('메일이 전송 되었습니다.')
        })
      }
    })  

  } else if (gubun === 'DEPT') {
    //공사담당부서 문자
    await commonSearchApi({
      queryId: "OUTBA0020_SEARCH_04",
      param: {
        CMPNY_DIV: '',
        EMPNM: data.DEPT_PIC_NAME,
        TELNO: data.DEPT_PIC_TEL,
      },
    }).then(async res => { 
      console.log('DEPT ', res)

      let mailParams = {}

      if (res.ORESULT_CUR.length > 0) {

        mailParams.EMAIL = [res.ORESULT_CUR[0].EMAIL];
        mailParams.SUBJECT = "[HiSEs] 단기공사 출입신청 검토/결재상신 요청"
        mailParams.CONTENT = `
        </br>단기공사 출입신청이 접수가 완료되었습니다. 아래 경로로 접속하시어 내용 검토 및 결재상신 바랍니다.
        </br> 경로: HiSEs 접속 - 안전 - 단기공사 관리 - 단기공사 승인(부서용)
        </br>
            <table class="" style="border-collapse: collapse;">
              <tbody>
                <tr>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:250px; text-align: center;">업체명 </td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:400px; text-align: center;">공사명</td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:150px; text-align: center;"> 공사기간 </td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px; text-align: center;"> 작성자 </td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px; text-align: center;"> 연락처 </td>
                </tr>
                <tr>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;">${data.VND_NAME ? data.VND_NAME : ''}</td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${data.WORK_DESC ? data.WORK_DESC : ''} </td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${data.WORK_FROM_DT} ~ ${data.WORK_TO_DT} </td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${data.INSERT_USER_NM ? data.INSERT_USER_NM : ''} </td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${data.INSERT_USER_TEL ? data.INSERT_USER_TEL : ''} </td>
                </tr>
              </tbody>
            </table>

            </br>
            </br> <담당자별 역할 설명>
            <table class="" style="border-collapse: collapse;">
              <thead>
                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; text-align: center;"> 담당자</td>
                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; text-align: center;"> 소속</td>
                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; text-align: center;"> 역할</td>
              </thead>

              <tbody>
                <tr>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 출입신청부서 담당자</td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 출입에만 관여하는 부서</td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사접수: 출입관련정보 작성/검토 (결재상신X)</td>
                </tr>
                <tr>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사담당부서 담당자</td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사를 요청한 부서</td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사접수: 최종 결재 </td>
                </tr>
                <tr>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사관리부서 담당자</td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> PTW 관리 부서</td>
                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 위험작업허가서 접수 및 신청: 해당 부서인원은 누구나 작성중인 허가서를 열어서 신청 올릴 수 있음</td>
                </tr>
              </tbody>
            </table>
          `

        commonSendApi(mailParams).then(() => {
          Message.success('메일이 전송 되었습니다.')
        })
      }
    })  
    
  } else if (gubun === 'WRK') {
    //공사관리부서 문자
    await commonSearchApi({
      queryId: "OUTBA0020_SEARCH_04",
      param: {
        CMPNY_DIV: '',
        EMPNM: data.WRK_MNG_EMPNM,
        TELNO: data.WRK_MNG_EMPTEL,
      },
    }).then(async res => { 
      console.log('WRK ', res)

      let mailParams = {}

      if (res.ORESULT_CUR.length > 0) {

        mailParams.EMAIL = [res.ORESULT_CUR[0].EMAIL]
        mailParams.SUBJECT = "[HiSEs] 단기공사 출입신청 접수 요청"
        mailParams.CONTENT = `
        </br>단기공사 출입신청이 접수되었습니다. 아래 경로로 접속하시어 신청 접수를 해 주시기 바랍니다.
        </br> 경로: HiSEs 접속 - 안전 - 단기공사 관리 - 단기공사 승인(부서용)
        </br>
                        <table class="" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px;">업체명 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px;">공사명</td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px;"> 공사기간 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:250px;"> 작성자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:250px;"> 연락처 </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">${data.VND_NAME}</td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${data.WORK_DESC} </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${data.WORK_FROM_DT} ~ ${data.WORK_TO_DT} </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${data.INSERT_USER_NM} </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${data.INSERT_USER_TEL} </td>
                            </tr>
                          </tbody>
                        </table>

                      </br>
                      </br> <담당자별 역할 설명>
                      <table class="" style="border-collapse: collapse;">
                        <thead>
                          <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; text-align: center;"> 담당자</td>
                          <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; text-align: center;"> 소속</td>
                          <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; text-align: center;"> 역할</td>
                        </thead>

                        <tbody>
                          <tr>
                            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 출입신청부서 담당자</td>
                            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 출입에만 관여하는 부서</td>
                            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사접수: 출입관련정보 작성/검토 (결재상신X)</td>
                          </tr>
                          <tr>
                            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사담당부서 담당자</td>
                            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사를 요청한 부서</td>
                            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사접수: 최종 결재 </td>
                          </tr>
                          <tr>
                            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 공사관리부서 담당자</td>
                            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> PTW 관리 부서</td>
                            <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> 위험작업허가서 접수 및 신청: 해당 부서인원은 누구나 작성중인 허가서를 열어서 신청 올릴 수 있음</td>
                          </tr>
                        </tbody>
                      </table>
                        `

        commonSendApi(mailParams).then(() => {
          Message.success('메일이 전송 되었습니다.')
        })
      }
      
    })  
  }

}


//버튼 Event
const onButtonsClick = async (btn) => {
  
  //접수 반려
  if (btn.id === 'btnReqReturn') {

    await vm.$swal.fire({
      title: "접수 반려 처리 하시겠습니까?",
      showCancelButton: true,
    //   input: 'text',
    //  inputPlaceholder: '반려 내역'
    }).then(async res2 => {
      console.log('res2 ', res2)

      if (res2.isConfirmed) {
        //기본 상태값 : 담당  
        const statusParm = [{
          CMPNY_DIV: resultData.value.CMPNY_DIV,
          BIZ_REG_NO: resultData.value.BIZ_REG_NO,
          SHORT_WORK_NO: resultData.value.VEND_CD + '-' + resultData.value.WORK_NO + '-' + resultData.value.REV_NO,
          USER_ID: resultData.value.BIZ_REG_NO,
          RCV_NO: '',     //단기공사 진행코드값면 변경하기에 필요없음.
          STATUS: '11',
          GUBUN: '2'
        
          }]

        await saveStatus(statusParm,'btnReqReturn')

        await onButtonsClick({id : 'btnClose'})
        
      }

    })
    
  } else if (btn.id === 'btnFinishReview') {

    console.log('resultData.value ', resultData.value)
    
    await vm.$swal({
    title: "검토완료 처리 하시겠습니까?", showCancelButton: true
    }).then(async res2 => {

      if (res2.isConfirmed) {
        //기본 상태값 : 담당  
        const statusParm = [{
          CMPNY_DIV: resultData.value.CMPNY_DIV,
          BIZ_REG_NO: resultData.value.BIZ_REG_NO,
          SHORT_WORK_NO: resultData.value.VEND_CD + '-' + resultData.value.WORK_NO + '-' + resultData.value.REV_NO,
          USER_ID: resultData.value.BIZ_REG_NO,
          RCV_NO: '',     //단기공사 진행코드값면 변경하기에 필요없음.
          STATUS: '25',
          GUBUN: '2'
        
          }]

        await saveStatus(statusParm,'btnFinishReview')

        await onButtonsClick({id : 'btnClose'})
        
      }

    })


  

  } else if (btn.id === 'btnReqApply') {



    /** 결재 상신 버튼 시작 */
    
    //**처리해야할 항목
    //결재 처리전에 검토 처리 출입 불가한 인원 및 데이터 유효성 검토.
    //5:58 현재 기능 여기서 부터 구현해야함
    //결재팝업 생성 전에 출입문, 출입시간 입력 되어있는지 확인필요.
    //해당 프로시저 돌면서 유효성 체크해야함.
    //기능 자체는 안에서 체크하는 부분이 있음 내용확인하면서 기능 구현해야함.
//     const data =  refSub03.value.getListData()

    console.log("dept_pic_emp_no.value, ", dept_pic_emp_no.value)

    if (userStore.userId != dept_pic_emp_no.value){
      Message.warn('공사담당부서 담당자만 결재 상신이 가능합니다. ')
      return
    }

    /* const data4 = refSub04.value.getData()
    //console.log('data4.FILE_NM3 ', data4.FILE_NM3)

    if(data4.FILE_NM3 === "첨부(0)"){

    } else {
      let ck = await vm.$swal({
        title: t('보험증서 확인'),
        html: t('<div style="text-align: left">당사 출입 협력사(단기공사 및 기자재 설치 협력사 포함) 근로자 재해 보상 기준에 따라 제출된 보험증서를 확인하셨습니까? <br>&nbsp;&nbsp;&nbsp;- 가입 필요 보험 : 근재보험 (단, 수익자가 사업주인 경우 단체보상보험(상해보험)도 가능)<br>&nbsp;&nbsp;&nbsp;- 보상 한도 : 인당 5억원/사고당<br>&nbsp;&nbsp;&nbsp;※ 현장 작업이 있는 협력사限, 단순 기자재 납품사는 제외</div>'),
        showCancelButton: true,
        width: '850px',
      })

      if (!ck.isConfirmed) {
        Message.warn('결재상신이 취소되었습니다.')
        return
      }      
    } */

    //console.log('setPopupParam ', setPopupParam)

    let chkList = []
    //출입자 정보 체크
    await  commonSearchApi({
      queryId: "OUTBA0020_SEARCH_09",
      param: {
        CMPNY_DIV: setPopupParam.CMPNY_DIV,
        BIZ_REG_NO: setPopupParam.BIZ_REG_NO,
        VEND_CD: setPopupParam.VEND_CD,
        WORK_NO: setPopupParam.WORK_NO,
        REV_NO: setPopupParam.REV_NO,
        GUBUN: 'B',
        NAME:  '',

        PAGE_GBN: 'false',
        PAGE_NUM: '',
        PAGE_IDX: '',
      },
    }).then(res => { 
      console.log(' :: ', res)    

      if (res.ORESULT_CUR.length > 0) {
        //저장된 인원 정보 가져옴
        chkList =  res.ORESULT_CUR
      }
    })  

    if(chkList.length <= 0){
      return Message.warn('출입 인원 정보가 없습니다, 확인 바랍니다.')
      }
    //출입문 , 출입시간 체크
      let chkListFlag = false 
      let chkPicYn = true
      let rejectUser = ''

    for (let i = 0; i < chkList.length; i++){
      console.log('chkList[i] ', chkList[i])

      //await commonSearchMySqlApi({ queryId : 'SAFJA0010_REJECT_USER', param : { USER_NM: '홍길동', USER_BIRTH: '880808' } })      
      await commonSearchMySqlApi({ queryId : 'SAFJA0010_REJECT_USER', param : { USER_NM: chkList[i].NAME, USER_BIRTH: chkList[i].BIR_DAY.slice(2) } })      
      .then(res => {
        //console.log("🟢 응답:", res);
        //console.log("🟢 응답CNT:", res[0].CNT)      
        if(res[0].CNT > 0){
          rejectUser += ',' + chkList[i].NAME       
        }
      }).catch(err => {
        console.error("🔴 에러:", err)
      }).finally(() => {
        console.log("🔵 요청 완료")
      })

      if (isEmpty(chkList[i].GATE_CD)) {
        chkListFlag = true
      }

      if (isEmpty(chkList[i].INOUT_FROM)) {
        chkListFlag = true
      }

      if (isEmpty(chkList[i].INOUT_TIME)) {
        chkListFlag = true
      }

      if (chkList[i].PIC_YN === 'Y') {
        chkPicYn = false
      }
    }

    if(rejectUser != '') {
      await vm.$swal({
          title: t("<br/><h2>" + rejectUser.slice(1) + "</h2>" +
            "<br/>상기 인원은 현재 출입신청이 제한되어 있는 출입자이거나," +
            "<br/>제한된 출입자와 동일한 생년월일의 동명이인입니다." +
            "<br/>출입신청을 위해서는 윤리경영팀으로 출입요청 하시기 바랍니다." +
            "<br/><br/>윤리경영팀 : 052-202-1234"
          )        
        })
        
      return
    }

    //출입인원 정보 확인
    if (chkListFlag) {
    return Message.err('출입인원 정보에서 출입문, 출입시간 정보가 입력되지 않았습니다, 확인 바랍니다.')   
    }

    //공사 책임자 정보 확인
    if (chkPicYn) {
    return Message.err('출입인원 중 공사 책임자가 선택되지 않았습니다, 확인 바랍니다.')   
    }

    //체크 처리
    let chk = false

    // 결재상신 처리 하기전에 결격 사유 정보 처리
    let chkApply = {
      RES_COD: '',
      RES_COL: '',
      RES_KEY: '',
      RES_MSG: '',
    }

    let dateDiff = '0'
    let carChk = false
    let DateChk = false
    await commonSearchApi({ queryId: 'OUTBA0020_SEARCH_05', param: setPopupParam }).then(
    async (res) => {
      if (res.ORESULT_CUR.length > 0) {
        console.log('res.ORESULT_CUR ', res.ORESULT_CUR)
        dateDiff = getDateDiff(res.ORESULT_CUR[0].WORK_FROM_DT , res.ORESULT_CUR[0].WORK_TO_DT)+1


        if (res.ORESULT_CUR.length > 0) {

          await commonExecuteApi({ queryId: 'OUTBA0020_UPDATE_01', list: res.ORESULT_CUR}).then((res) => {
            console.log('OUTBA0020_UPDATE_01 ', res)

            if (res.list.length > 0) {
              chkApply.RES_COD = res.list[0].RES_COD
              chkApply.RES_COL = res.list[0].RES_COL
              chkApply.RES_KEY = res.list[0].RES_KEY
              chkApply.RES_MSG = res.list[0].RES_MSG
            }

          })
        }
        
      }
    })

    console.log('dateDiff ', dateDiff)

    if ( 15 <= dateDiff ) {
      DateChk = true // 15일 이상 여부

      for (let i = 0; i < chkList.length; i++){
        console.log(' chkList ', chkList[i])
        if (!isEmpty(chkList[i].CAR_KIND) || !isEmpty(chkList[i].CAR_NO)) {
          carChk = true
        }
      }
    }

    console.log('DateChk ', DateChk)

    if (carChk) {
      return Message.err('공사 기간이 15일 이상입니다. 차량정보가 입력되어 있습니다 제거 후 결재 상신 바랍니다.')   
    }

    
    //결재 처리중 결격 사유 있을시 메세지 표출
    if (chkApply.RES_COD !== '0') {
      Message.err(chkApply.OUT_RES_MSG)
      return
    }



    let param = {
      BIZ_REG_NO: setPopupParam.BIZ_REG_NO,
      VEND_CD: setPopupParam.VEND_CD,
      WORK_NO: setPopupParam.WORK_NO,
      REV_NO: setPopupParam.REV_NO,
      CMPNY_DIV: setPopupParam.CMPNY_DIV,
      NOTICE_NO: '77',
      USER_ID: setPopupParam.USER_ID,
    }

   if (DateChk){
    let ck = await vm.$swal({
      title: t('결재상신하시겠습니까?'),
      showCancelButton: true,
    })


      if (!ck.isConfirmed) {
        Message.warn('취소되었습니다.')
        return
      }
      else{
        SAFJA0040Pop05.value.openPopup()

        // 결재 전 확인사항 초기화 및 팝업 open
        // radioVal.val1 = ''
        // radioVal.val2 = ''
        // radioVal.val3 = ''
        // appYN.value = true
        // m_dialog.value = true
      } 
  }



    //증명사진
    await commonSearchApi({
      queryId: 'SAFJA0010_SEARCH_04',
      param: param,
    }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        if (res.ORESULT_CUR[0].PHOTO_ERR_CNT != '0') {
          Message.warn(
            t(
              '증명사진 미등록 인원이 ' +
                res.ORESULT_CUR[0].PHOTO_ERR_CNT +
                '명 존재하여 결재상신이 불가능 합니다. <br/>단기공사 홈페이지에서 출입인원에 대한 증명사진 등록여부를 체크하시기 바랍니다.'
            )
          )
          chk = true
        }
      }
    })

    //증명사진 미등록 건 결재 미처리
    if (chk) {
      return
    }

    dtAppro = []
    dtApproPerson = []
    let reportHtml = ''

    //단기공사 상세 조회
    await commonSearchApi({
      queryId: 'SAFJA0010_SEARCH_08',
      param: param,
    }).then((res) => {
      console.log('SAFJA0010_SEARCH_08 ', res.ORESULT_CUR)
      if (res.ORESULT_CUR.length > 0) {
        dtAppro = res.ORESULT_CUR

        reportHtml = setHtml('1', reportHtml, dtAppro)
      }
    })

    if (userStore.bsnsCd === 'AE00') {
      //특수선 사업부 공지사항 호출
      await commonRequest('/hse/safety/SAFJA0010/search01', {
        queryId: 'SAFJA0010_SEARCH_05',
        param: param,
      }).then((res) => {
        console.log('res.SAFJA0010_SEARCH_05 ', res.ORESULT_CUR)
        // SAFJA0040Pop02.value.openPopup(res.ORESULT_CUR)
      })
    }

    //단기공사 출입인원 조회
    await commonSearchApi({
      queryId: 'SAFJA0010_SEARCH_09',
      param: param,
    }).then((res) => {
      console.log('SAFJA0010_SEARCH_09 ', res.ORESULT_CUR)
      if (res.ORESULT_CUR.length > 0) {
        dtApproPerson = res.ORESULT_CUR
        reportHtml = setHtml('2', reportHtml, dtApproPerson)
      }
    })

    let fixRine = ''

    // //결재 라인 정보 조회
    await commonSearchApi({
      queryId: 'SAFJA0010_SEARCH_07',
      param: param,
    }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        console.log('SAFJA0010_SEARCH_07 ', res)

        if (res.ORESULT_CUR.length > 0) {
          if (res.ORESULT_CUR[0] != null) {
            fixRine = res.ORESULT_CUR[0].CLRLINE
          } else {
            fixRine = ''
          }  
        }
      }
    })

    let today = dayjs(new Date()).format('YYYYMMDD')

    console.log('reportHtml ', reportHtml)

    console.log('fixRine ', fixRine)
    await approvalPopup.value.openPopup({
      CLSS_ID: 'SAFJA0010',
      TITLE:
        '단기공사출입신청_' +
        dtAppro[0].REQ_PIC_DEPTNM2 +
        '_' +
        userStore.userName +
        '_' +
        today,
      CMPNY_DIV: userStore.cmpnyDiv,
      DATA_KEY:
        userStore.cmpnyDiv +
        ';' +
        param.BIZ_REG_NO +
        ';' +
        param.VEND_CD +
        ';' +
        param.WORK_NO +
        ';' +
        param.REV_NO, //  // "HHI;AX00;X0Q0;X0Q0;2023", // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      REPORT: reportHtml, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE: '2', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      FIX_YN: 'Y',
      FIX_CLRLINE: fixRine,//fixRine,
      CLRLINE: 'CLR_100',//'CLR_100', //결재라인
      CCLINE: '', //참조라인
      PARAM424: '', //사고보고서용 결재라인no,사번
    })

    param.NOTICE_NO = '1'
    //안전대면 팝업
    await commonRequest('/hse/safety/SAFJA0010/search01', {
      queryId: 'SAFJA0010_SEARCH_06',
      param: param,
    }).then((res) => {
      console.log('res.SAFJA0010_SEARCH_06 ', res.ORESULT_CUR)
      if (res.ORESULT_CUR.length > 0) {
        SAFJA0040Pop02.value.openPopup(res.ORESULT_CUR)
      }
    })

  } else if (btn.id === 'btnShortApply') {
    // SAFJA0040Pop03.value.openPopup(setPopupParam)
    const setpara = {
      CMPNY_DIV: setPopupParam.CMPNY_DIV,
      BIZ_REG_NO: setPopupParam.BIZ_REG_NO,
      VEND_CD: setPopupParam.VEND_CD,
      WORK_NO: setPopupParam.WORK_NO,
      REV_NO: setPopupParam.REV_NO,
    }

    commonSearchApi({
      queryId: 'SAFJA0040_SEARCH_06',
      param: setpara,
    }).then((res) => {
      if (res.ORESULT_CUR.length <= 0) {
        return Message.warn(t('결재이력이 존재하지 않습니다.'))
      }
      SAFJA0040Pop03.value.openPopup(res.ORESULT_CUR)
    })
  } else if (btn.id === 'btnShortEmail') {
    const mailForm = reactive({
      TO_EMP_NO: '',
      TO_EMP_NM: '',
      paraData: '',
      personData: '',
    })

    console.log('setPopupParam ', setPopupParam)

    commonSearchApi({
      queryId: 'SAFJA0040_SEARCH_07',
      param: setPopupParam,
    }).then(async (res) => {
      console.log('SAFJA0040_SEARCH_07 :::  ', res)
      mailForm.personData = res.ORESULT_CUR
    })

    commonSearchApi({
      queryId: 'SAFJA0040_SEARCH_08',
      param: setPopupParam,
    }).then(async (res) => {
      console.log('SAFJA0040_SEARCH_08 ', res)
      mailForm.paraData = res.ORESULT_CUR[0]
      sendMailPop.value.openPopup(mailForm, 'SAFJA0040', 'EMAILDTE')
    })
  } else if (btn.id === 'btnClose') {
    
    onClose()
  }
}

const reqApp = async () => {

  //체크 처리
  let chk = false

  let param = {
      BIZ_REG_NO: setPopupParam.BIZ_REG_NO,
      VEND_CD: setPopupParam.VEND_CD,
      WORK_NO: setPopupParam.WORK_NO,
      REV_NO: setPopupParam.REV_NO,
      CMPNY_DIV: setPopupParam.CMPNY_DIV,
      NOTICE_NO: '77',
      USER_ID: setPopupParam.USER_ID,
    }

  //증명사진
    await commonSearchApi({
      queryId: 'SAFJA0010_SEARCH_04',
      param: param,
    }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        if (res.ORESULT_CUR[0].PHOTO_ERR_CNT != '0') {
          Message.warn(
            t(
              '증명사진 미등록 인원이 ' +
                res.ORESULT_CUR[0].PHOTO_ERR_CNT +
                '명 존재하여 결재상신이 불가능 합니다. <br/>단기공사 홈페이지에서 출입인원에 대한 증명사진 등록여부를 체크하시기 바랍니다.'
            )
          )
          chk = true
        }
      }
    })

    //증명사진 미등록 건 결재 미처리
    if (chk) {
      return
    }

    dtAppro = []
    dtApproPerson = []
    let reportHtml = ''

    //단기공사 상세 조회
    await commonSearchApi({
      queryId: 'SAFJA0010_SEARCH_08',
      param: param,
    }).then((res) => {
      console.log('SAFJA0010_SEARCH_08 ', res.ORESULT_CUR)
      if (res.ORESULT_CUR.length > 0) {
        dtAppro = res.ORESULT_CUR

        reportHtml = setHtml('1', reportHtml, dtAppro)
      }
    })

    if (userStore.bsnsCd === 'AE00') {
      //특수선 사업부 공지사항 호출
      await commonRequest('/hse/safety/SAFJA0010/search01', {
        queryId: 'SAFJA0010_SEARCH_05',
        param: param,
      }).then((res) => {
        console.log('res.SAFJA0010_SEARCH_05 ', res.ORESULT_CUR)
        // SAFJA0040Pop02.value.openPopup(res.ORESULT_CUR)
      })
    }

    //단기공사 출입인원 조회
    await commonSearchApi({
      queryId: 'SAFJA0010_SEARCH_09',
      param: param,
    }).then((res) => {
      console.log('SAFJA0010_SEARCH_09 ', res.ORESULT_CUR)
      if (res.ORESULT_CUR.length > 0) {
        dtApproPerson = res.ORESULT_CUR
        reportHtml = setHtml('2', reportHtml, dtApproPerson)
      }
    })

    let fixRine = ''

    // //결재 라인 정보 조회
    await commonSearchApi({
      queryId: 'SAFJA0010_SEARCH_07',
      param: param,
    }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        console.log('SAFJA0010_SEARCH_07 ', res)

        if (res.ORESULT_CUR.length > 0) {
          if (res.ORESULT_CUR[0] != null) {
            fixRine = res.ORESULT_CUR[0].CLRLINE
          } else {
            fixRine = ''
          }  
        }
      }
    })

    let today = dayjs(new Date()).format('YYYYMMDD')

    console.log('reportHtml ', reportHtml)

    console.log('fixRine ', fixRine)
    
    await approvalPopup.value.openPopup({
      CLSS_ID: 'SAFJA0010',
      TITLE:
        '단기공사출입신청_' +
        dtAppro[0].REQ_PIC_DEPTNM2 +
        '_' +
        userStore.userName +
        '_' +
        today,
      CMPNY_DIV: userStore.cmpnyDiv,
      DATA_KEY:
        userStore.cmpnyDiv +
        ';' +
        param.BIZ_REG_NO +
        ';' +
        param.VEND_CD +
        ';' +
        param.WORK_NO +
        ';' +
        param.REV_NO, //  // "HHI;AX00;X0Q0;X0Q0;2023", // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      REPORT: reportHtml, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE: '2', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      FIX_YN: 'Y',
      FIX_CLRLINE: fixRine,//fixRine,
      CLRLINE: 'CLR_100',//'CLR_100', //결재라인
      CCLINE: '', //참조라인
      PARAM424: '', //사고보고서용 결재라인no,사번
    })

    param.NOTICE_NO = '1'
    //안전대면 팝업
    await commonRequest('/hse/safety/SAFJA0010/search01', {
      queryId: 'SAFJA0010_SEARCH_06',
      param: param,
    }).then((res) => {
      console.log('res.SAFJA0010_SEARCH_06 ', res.ORESULT_CUR)
      if (res.ORESULT_CUR.length > 0) {
        SAFJA0040Pop02.value.openPopup(res.ORESULT_CUR)
      }
    })
}

//1 공사정보 , 2 인원 정보
const setHtml = (gubun, htmlData, getData) => {
  let result = htmlData
  if (gubun === '1') {
    console.log('getData 1 ', getData)
    result = `
    <html>
    <head>
    <title>OZ HTML</title>
    <style type="text/css">
    <!--
    div.offset{
    position:absolute;
    background-color:transparent;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    left:0px;
    top:0px;
    width:0px;
    height:0px;
    }
    div{
    position:relative;
    }
    table.one{
    width:100%;
    height:100%;
    border:0;
    }
    table.two{
    width:100%;
    height:100%;
    border:0;
    line-height:80%;
    }
    table.three{
    width:100%;
    height:100%;
    border:0;
    line-height:60%;
    }
    table.four{
    width:100%;
    height:100%;
    border:0;
    line-height:40%;
    }
    table.five{
    width:100%;
    height:100%;
    border:0;
    line-height:20%;
    }
    br{letter-spacing:0;}
    #center{
    text-align:center;
    }
    div.b_0{
    border-width:1px;
    border-color:#000000;
    border-style:solid;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    }
    #f_008w011P000s000P000{
    font-size:8pt;
    line-height:11.0pt;
    letter-spacing:0.0pt;
    }
    font.굴림{
    font-family:굴림;
    }
    #left{
    text-align:left;
    }
    #f_010w013P000s000P000{
    font-size:10pt;
    line-height:13.0pt;
    letter-spacing:0.0pt;
    }
    -->
    </style>
    </head>
    <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
    <div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:688px;height:972px">
    <div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:87px;width:77px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>출입신청부서</font></td></tr></table></div></div>
    <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:110px;top:87px;width:208px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].REQ_PIC_DEPTNM === null ? '' : getData[0].REQ_PIC_DEPTNM
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:87px;width:92px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>담당자</font></td></tr></table></div></div>
    <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:87px;width:246px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].REQ_PIC_EMPNM === null ? '' : getData[0].REQ_PIC_EMPNM
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:111px;width:77px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사발주부서</font></td></tr></table></div></div>
    <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:110px;top:111px;width:208px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].DEPT_PIC_DEPTNM === null ? '' : getData[0].DEPT_PIC_DEPTNM
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:111px;width:92px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>담당자</font></td></tr></table></div></div>
    <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:111px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].DEPT_PIC_EMPNM === null ? '' : getData[0].DEPT_PIC_EMPNM
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:136px;width:77px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사감독부서</font></td></tr></table></div></div>
    <div class=offset style="z-index:10"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:110px;top:136px;width:208px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].WRK_MNG_DEPTNM === null ? '' : getData[0].WRK_MNG_DEPTNM
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:11"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:136px;width:92px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>담당자</font></td></tr></table></div></div>
    <div class=offset style="z-index:12"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:136px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].WRK_MNG_EMPNM === null ? '' : getData[0].WRK_MNG_EMPNM
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:13"><div style=";padding-left:3px;padding-right:3px;left:34px;top:59px;width:139px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_010w013P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>1.&nbsp;관련부서&nbsp;정보</font></td></tr></table></div></div>

    <div class=offset style="z-index:14"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:200px;width:75px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>협력회사명</font></td></tr></table></div></div>
    <div class=offset style="z-index:15"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:108px;top:200px;width:210px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].VND_NAME === null ? '' : getData[0].VND_NAME
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:16"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:200px;width:92px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>사업자번호</font></td></tr></table></div></div>
    <div class=offset style="z-index:17"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:200px;width:246px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].BIZ_REG_NO_DISP === null ? '' : getData[0].BIZ_REG_NO_DISP
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:18"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:224px;width:75px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>대표자</font></td></tr></table></div></div>
    <div class=offset style="z-index:19"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:108px;top:224px;width:210px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].REP_NAME === null ? '' : getData[0].REP_NAME
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:20"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:224px;width:92px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>전화번호</font></td></tr></table></div></div>
    <div class=offset style="z-index:21"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:224px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].VEND_TELNO === null ? '' : getData[0].VEND_TELNO
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:22"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:249px;width:75px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>산재보험&nbsp;No</font></td></tr></table></div></div>
    <div class=offset style="z-index:23"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:108px;top:249px;width:210px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].INJR_INSR_NO === null ? '' : getData[0].INJR_INSR_NO
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:24"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:249px;width:92px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>단체보상보험No</font></td></tr></table></div></div>
    <div class=offset style="z-index:25"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:249px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].GROUP_INSR_NO === null ? '' : getData[0].GROUP_INSR_NO
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:26"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:274px;width:75px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>주소</font></td></tr></table></div></div>
    <div class=offset style="z-index:27"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:108px;top:274px;width:546px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].VEND_ADDR === null ? '' : getData[0].VEND_ADDR
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:28"><div style=";padding-left:3px;padding-right:3px;left:34px;top:172px;width:139px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_010w013P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>2.&nbsp;협력회사&nbsp;정보</font></td></tr></table></div></div>

    <div class=offset style="z-index:29"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:339px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사명</font></td></tr></table></div></div>
    <div class=offset style="z-index:30"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:339px;width:539px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].WORK_DESC === null ? '' : getData[0].WORK_DESC
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:31"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:363px;width:82px;height:50px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사내용</font></td></tr></table></div></div>
    <div class=offset style="z-index:32"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:363px;width:539px;height:50px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].DTL_WORK_DESC === null ? '' : getData[0].DTL_WORK_DESC
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:33"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:412px;width:82px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>출입용도</font></td></tr></table></div></div>
    <div class=offset style="z-index:34"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:412px;width:539px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].ENTRANCE_NM === null ? '' : getData[0].ENTRANCE_NM
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:35"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:437px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사장소</font></td></tr></table></div></div>
    <div class=offset style="z-index:36"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:437px;width:204px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].WORK_AREA_NM === null ? '' : getData[0].WORK_AREA_NM
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:37"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:318px;top:437px;width:336px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].WORK_AREA_DESC === null ? '' : getData[0].WORK_AREA_DESC
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:38"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:461px;width:82px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사책임자</font></td></tr></table></div></div>
    <div class=offset style="z-index:39"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:461px;width:204px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].NAME === null ? '' : getData[0].NAME
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:40"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:318px;top:461px;width:91px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사기간</font></td></tr></table></div></div>
    <div class=offset style="z-index:41"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:461px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].WORK_DT === null ? '' : getData[0].WORK_DT
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:42"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:486px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>휴대폰</font></td></tr></table></div></div>
    <div class=offset style="z-index:43"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:486px;width:204px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].MOBILE === null ? '' : getData[0].MOBILE
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:44"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:318px;top:486px;width:91px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>현장전화</font></td></tr></table></div></div>
    <div class=offset style="z-index:45"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:486px;width:246px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].WORK_OFFI_TEL === null ? '' : getData[0].WORK_OFFI_TEL
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:46"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:510px;width:82px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>출입인원</font></td></tr></table></div></div>
    <div class=offset style="z-index:47"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:510px;width:539px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].PERSON_CNT === null ? '' : getData[0].PERSON_CNT
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:48"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:535px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>유해화학물질</font></td></tr></table></div></div>
    <div class=offset style="z-index:49"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:535px;width:539px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].HARM_CMCAL === null ? '' : getData[0].HARM_CMCAL
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:50"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:559px;width:82px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>사용장비</font></td></tr></table></div></div>
    <div class=offset style="z-index:51"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:559px;width:539px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].USE_EQUIP === null ? '' : getData[0].USE_EQUIP
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:52"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:584px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>장비운전자</font></td></tr></table></div></div>
    <div class=offset style="z-index:53"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:115px;top:584px;width:62px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>성명</font></td></tr></table></div></div>
    <div class=offset style="z-index:54"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:176px;top:584px;width:143px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].EQUIP_DRIVER === null ? '' : getData[0].EQUIP_DRIVER
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:55"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:318px;top:584px;width:91px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>관련자격</font></td></tr></table></div></div>
    <div class=offset style="z-index:56"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:584px;width:246px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${
      getData[0].RELE_LICENSE === null ? '' : getData[0].RELE_LICENSE
    }</font></td></tr></table></div></div>
    <div class=offset style="z-index:57"><div style=";padding-left:3px;padding-right:3px;left:34px;top:310px;width:139px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_010w013P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>3.&nbsp;공사내역&nbsp;정보</font></td></tr></table></div></div>
`
  } else if (gubun === '2') {
    console.log('getData 2 ', getData)

    result =
      result +
      `
    <div class=offset style="z-index:58">
      <div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:653px;width:83px;height:25px;overflow:hidden;background-color:#e9e9ff">
        <table class=one cellPadding=0 cellSpacing=0>
          <tr>
            <td id=center>
              <font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold">
                <nobr/>성명
              </font>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <div class=offset style="z-index:59"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:116px;top:653px;width:61px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>생년월일</font></td></tr></table></div></div>
    <div class=offset style="z-index:60"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:176px;top:653px;width:180px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>출입기간</font></td></tr></table></div></div>
    <div class=offset style="z-index:61"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:355px;top:653px;width:97px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>출입문</font></td></tr></table></div></div>
    <div class=offset style="z-index:62"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:451px;top:653px;width:101px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>차종</font></td></tr></table></div></div>
    <div class=offset style="z-index:63"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:551px;top:653px;width:103px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>차량번호</font></td></tr></table></div></div>
    `
    let text = ``

    console.log(' ', getData.length, getData)

    let height = 25
    let top = 677
    let index = 64

    for (let i = 0; i < getData.length; i++) {
      text =
        text +
        `
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:${top}px;width:83px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${
          getData[i].NAME === null ? '' : getData[i].NAME
        }</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:116px;top:${top}px;width:61px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${
          getData[i].BIR_DAY === null ? '' : getData[i].BIR_DAY
        }</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:176px;top:${top}px;width:180px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${
          getData[i].WORK_DT === null ? '' : getData[i].WORK_DT
        }</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:355px;top:${top}px;width:97px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${
          getData[i].GATE_NM === null ? '' : getData[i].GATE_NM
        }</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:451px;top:${top}px;width:101px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${
          getData[i].CAR_KIND === null ? '' : getData[i].CAR_KIND
        }</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:551px;top:${top}px;width:103px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${
          getData[i].CAR_NO === null ? '' : getData[i].CAR_NO
        }</font></td></tr></table></div></div>
      `
      top = top + height
    }

    text =
      text +
      `
    <div class=offset style="z-index:76"><div style=";padding-left:3px;padding-right:3px;left:33px;top:621px;width:139px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_010w013P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>4.&nbsp;인원/차량&nbsp;정보</font></td></tr></table></div></div>
    </div>
    </body>
    </html>
    `
    result = result + text
  } else if (gubun === '3') {
    console.log('getData 3 ', getData)
    result = `
    <p style="line-height:30px;">
                            <span class="text">안녕하십니까?</span>
                        </p>
                        <p style="line-height:30px;">
                            <br>
                            <span class="text">아래와 같이 단기공사 출입정보를 전달 드리오니 참조바랍니다.&nbsp;</span>&nbsp;&nbsp;&nbsp;
                            <br>
                        </p>
                        <p style="line-height:30px;">
                            <span class="text"><strong>1. 관련부서 정보</strong></span>
                        </p>
                        <table class="" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px;">출입신청부서 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:130px;"> ${
                                getData[0].REQ_PIC_DEPTNM === null
                                  ? ''
                                  : getData[0].REQ_PIC_DEPTNM
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px;"> 담당자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:250px;"> ${
                                getData[0].REQ_PIC_EMPNM === null
                                  ? ''
                                  : getData[0].REQ_PIC_EMPNM
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;">${
                                getData[0].WRK_DIV === 'B'
                                  ? '공사발주부서'
                                  : '공사관리부서'
                              }</td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; "> ${
                                getData[0].DEPT_PIC_DEPTNM === null
                                  ? ''
                                  : getData[0].DEPT_PIC_DEPTNM
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 담당자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                getData[0].DEPT_PIC_EMPNM === null
                                  ? ''
                                  : getData[0].DEPT_PIC_EMPNM
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;">${
                                getData[0].WRK_DIV === 'B'
                                  ? '공사감독부서'
                                  : '공사담당부서'
                              }</td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; "> ${
                                getData[0].WRK_MNG_DEPTNM === null
                                  ? ''
                                  : getData[0].WRK_MNG_DEPTNM
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 담당자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                getData[0].WRK_MNG_EMPNM === null
                                  ? ''
                                  : getData[0].WRK_MNG_EMPNM
                              } </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style="line-height:30px;">
                            <span class="text"><strong>2.협력회사 정보</strong></span>
                        </p>
                          <table class="" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px;"> 협력회사명 </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:250px;"> ${
                                  getData[0].VND_NAME === null
                                    ? ''
                                    : getData[0].VND_NAME
                                } </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px;"> 사업자번호 </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:250px;"> ${
                                  getData[0].BIZ_REG_NO_DISP === null
                                    ? ''
                                    : getData[0].BIZ_REG_NO_DISP
                                } </td>
                              </tr>
                              <tr>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 대표자 </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                    getData[0].REP_NAME === null
                                      ? ''
                                      : getData[0].REP_NAME
                                  } </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 전화번호 </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                    getData[0].VEND_TELNO === null
                                      ? ''
                                      : getData[0].VEND_TELNO
                                  } </td>
                              </tr>
                              <tr>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 산재보험 No </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                    getData[0].INJR_INSR_NO === null
                                      ? ''
                                      : getData[0].INJR_INSR_NO
                                  } </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 단체보상보험No </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                    getData[0].GROUP_INSR_NO === null
                                      ? ''
                                      : getData[0].GROUP_INSR_NO
                                  } </td>
                              </tr>
                              <tr>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 주소 </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;" colSpan="3"> ${
                                    getData[0].VEND_ADDR === null
                                      ? ''
                                      : getData[0].VEND_ADDR
                                  } </td>
                              </tr>
                            </tbody>
                          </table>

                        <p style="line-height:30px;">
                            <span class="text"><strong>3. 공사내역 정보</strong></span>
                        </p>
                        <table class="" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:130px;"> 공사명 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:650px;"> ${
                                  getData[0].WORK_DESC === null
                                    ? ''
                                    : getData[0].WORK_DESC
                                } </td>
                            </tr>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 공사내용 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                  getData[0].DTL_WORK_DESC === null
                                    ? ''
                                    : getData[0].DTL_WORK_DESC
                                } </td>
                            </tr>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 출입용도 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                  getData[0].ENTRANCE_NM === null
                                    ? ''
                                    : getData[0].ENTRANCE_NM
                                } </td>
                            </tr>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 공사장소 </td>
                                <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                  getData[0].WORK_AREA_NM === null
                                    ? ''
                                    : getData[0].WORK_AREA_NM
                                } </td>
                                <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                  getData[0].WORK_AREA_DESC === null
                                    ? ''
                                    : getData[0].WORK_AREA_DESC
                                } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 공사책임자 </td>
                              <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                getData[0].NAME === null ? '' : getData[0].NAME
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:110px;"> 공사기간 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                getData[0].WORK_DT === null
                                  ? ''
                                  : getData[0].WORK_DT
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 휴대폰 </td>
                              <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                getData[0].MOBILE === null
                                  ? ''
                                  : getData[0].MOBILE
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 현장전화 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                getData[0].WORK_OFFI_TEL === null
                                  ? ''
                                  : getData[0].WORK_OFFI_TEL
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 출입인원 </td>
                              <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                getData[0].PERSON_CNT === null
                                  ? ''
                                  : getData[0].PERSON_CNT
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 유해화학물질 </td>
                              <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                getData[0].HARM_CMCAL === null
                                  ? ''
                                  : getData[0].HARM_CMCAL
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 사용장비 </td>
                              <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${
                                getData[0].USE_EQUIP === null
                                  ? ''
                                  : getData[0].USE_EQUIP
                              } </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA;"> 장비운전자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:80px;"> 성명 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:100px;"> ${
                                getData[0].EQUIP_DRIVER === null
                                  ? ''
                                  : getData[0].EQUIP_DRIVER
                              } </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#E6F0FA; width:100px;"> 관련자격 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:220px;"> ${
                                getData[0].RELE_LICENSE === null
                                  ? ''
                                  : getData[0].RELE_LICENSE
                              } </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style="line-height:30px;">
                            <span class="text"><strong>4. 인원/차량 정보</strong></span>
                        </p>
`
  } else if (gubun === '4') {
    console.log('getData 4 ', getData)

    result =
      result +
      `
            <table class="ck-table-resized" style="border-collapse: collapse;">
              <thead>
                <tr>
                    <th style="background-color:#E6F0FA; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:120px;">
                        성명
                    </th>
                    <th style="background-color:#E6F0FA; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:80px;">
                        생년월일
                    </th>
                    <th style="background-color:#E6F0FA; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:220px;">
                        출입기간
                    </th>
                    <th style="background-color:#E6F0FA; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:150px;">
                        출입문
                    </th>
                    <th style="background-color:#E6F0FA; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:120px;">
                        차종
                    </th>
                    <th style="background-color:#E6F0FA; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:120px;">
                        차량번호
                    </th>
                </tr>
              </thead>
            <tbody>
    `
    let text = ``

    // let height = 25
    // let top = 677
    // let index = 64

    for (let i = 0; i < getData.length; i++) {
      text =
        text +
        `
      <tr>
        <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
          ${getData[i].NAME === null ? '' : getData[i].NAME}
        </td>
        <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
          ${getData[i].BIR_DAY === null ? '' : getData[i].BIR_DAY}
        </td>
        <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
          ${getData[i].WORK_DT === null ? '' : getData[i].WORK_DT}
        </td>
        <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
          ${getData[i].GATE_NM === null ? '' : getData[i].GATE_NM}
        </td>
        <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
          ${getData[i].CAR_KIND === null ? '' : getData[i].CAR_KIND}
        </td>
        <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;">
          ${getData[i].CAR_NO === null ? '' : getData[i].CAR_NO}
        </td>
      </tr>
      `
      // top = top +height
    }

    // text = text + `
    //       <div class=offset style="z-index:76"><div style=";padding-left:3px;padding-right:3px;left:33px;top:621px;width:139px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_010w013P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>4.&nbsp;인원/차량&nbsp;정보</font></td></tr></table></div></div>
    //     </div>
    // `
    result = result + text
  }

  return result
}

// //버튼 Event
// const onSubButtonsClick = btn => {
//   if (btn.id === 'btnShortDetail') {
//     SAFJA0040Pop02.value.openPopup(gridData,setPopupParam);
//   }
// }

//다음, 이전 버튼 클릭
const tabMove = async (tabGubun,GUBN) => {
  if (tabGubun === 0) {
    
    tab.value = Number(tab.value) - 1
    setData()
  } else if (tabGubun === 1) {

    if (GUBN === 'N') {
      await tempSave().then(async res => {
        console.log('tempSave ', res)
        if (res) {
          if (tab.value === 3) {
            return
          }
          tab.value = Number(tab.value) + 1
          setData()
        }

      })
    } else { 
      if (tab.value === 3) {
            return
          }
      tab.value = Number(tab.value) + 1
      setData()  
    }
    
    
  }
}


const save = async (data) => {
  console.log(' param ', data)
  await commonExecuteApi({
    queryId: "OUTBA0020_UPDATE_04",
    list: [data],
  }).then(async res => {
    console.log('우리 저장이 잘됐는지 확인해볼까요? :::  ', res)
  })
}


async function tempSave() {
  // return new Promise((resolve) => {
    //화면 추가시 저장 데이터 

    //첫번째 페이지
  if (tab.value === 0) {
    //저장시 입력데이터 가져옴
    const data1 = refSub01.value.getData()
    data1.SAVE_GUBUN = tab.value
    console.log('data1 ', data1)
    //필수값 입력 체크
    if (isEmpty(data1.WORK_DESC)) {
      return Message.err(t('공사명은 필수 값입니다.'))
    } else if (isEmpty(data1.WORK_PIC_EMPNM)) {
      return Message.err(t('공사책임자 성명은 필수 값입니다.'))
    } else if (isEmpty(data1.WORK_PIC_MOBILE)) {
      return Message.err(t('책임자 휴대폰은 필수 값입니다.'))
    } else if (isEmpty(data1.INSERT_USER_NM)) {
      return Message.err(t('작성자성명은 필수 값입니다.'))
    } else if (isEmpty(data1.INSERT_USER_TEL)) {
      return Message.err(t('공사책임자 성명은 필수 값입니다.'))
    }
    
    let chkReturn = false
    if (data1.REQ_CHECK) {
      console.log('data1 ', data1)
      //가져온데이터 기존 데이터에 집어넣음

      await vm.$swal({
        title: "1.기본정보가 저장됩니다. 저장하시겠습니까?", showCancelButton: true
      }).then(async res2 => {

        if (res2.isConfirmed) {
          await save(data1)
          chkReturn = true;
        } else {
          chkReturn = false;
        }

      })

      return chkReturn
    } else {
      Message.warn("담당자정보를 확인바랍니다.")
        return false;
    }

      //두번째 페이지
    } else if (tab.value === 1) {
    //저장시 입력데이터 가져옴
    const data2 = refSub02.value.getData()
    data2.SAVE_GUBUN = tab.value

    let chkReturn = false

    console.log('data2 ', data2)
    //가져온데이터 기존 데이터에 집어넣음

      await vm.$swal({
      title: "2.공사정보가 저장됩니다. 저장하시겠습니까?", showCancelButton: true
      }).then(async res2 => { 

        if (res2.isConfirmed) {

          console.log('data2 ', data2)

          //단기공사 정보 저장
          await save(data2)
          //msds 정보 저장
          if (data2.MSDS.length > 0) {
            await saveMSDS(data2.MSDS)
          }
          chkReturn = true;
        } else {
          chkReturn = false;
        }
        
      })
      return chkReturn;

      //세번째 페이지
    } else if (tab.value === 2) {
    let chkReturn = false
    //가져온데이터 기존 데이터에 집어넣음

      await vm.$swal({ 
        title: "3.작업자 출입정보가 저장됩니다. 저장하시겠습니까?", showCancelButton: true
        }).then(async res2 => { 

          console.log('refSub03.value.getListData() ', refSub03.value.getListData())

          if (refSub03.value.getListData().length > 0) {           
          

            if (res2.isConfirmed) {
              commonExecuteApi({
                queryId: 'SAFJA0010_SAVE_03',
                list: refSub03.value.getListData(),
              }).then((res) => {
                console.log('save02 ', res)
                let resultCod = res.OUT_RES_COD
                let resultMsg = res.OUT_RES_MSG
              })
              chkReturn = true;
            } else {
              chkReturn = false;
            }
          }
        
      })

      //저장시 입력데이터 가져옴
      // const data2 = refSub03.value.getData()
      // //가져온데이터 기존 데이터에 집어넣음
      // getJsonData.value = _.merge({}, getJsonData.value, data2)
      // // N 이면 화면 이동 처리 저장, 아닐시 현재 화면에서 저장
      // getJsonData.value.SAVE_STEP = btnDiv === 'N' ? Number(tab.value) + 1 : tab.value
      // console.log('getJsonData.value ', getJsonData.value)

      
      // if (btnDiv === 'N') {
      //   //법정 안전교육 이수 여부 확인 체크
      //   // if (getJsonData.value.EDU01_YN === 'N') {
      //   //   Message.err(t('채용시 교육 여부가 No입니다..'))
      //   //   return false
      //   // } else if (getJsonData.value.EDU02_YN === 'N') {
      //   //   Message.err(t('특별안전교육 여부가 No입니다..'))
      //   //   return false
      //   // }
      // }
      
      
      // const listData = refSub03.value.getListData()

      // if (listData.length > 0) {
      //   let page3ValChk = false
      //   //공사책임자 선택 
      //   for (let i = 0; i < listData.length; i++){
      //     if (listData[i].PIC_YN === 'Y') {
      //       page3ValChk = true
      //     }
      //   }

      //   //공사 책임자 필수 체크
      //   if (!page3ValChk && btnDiv === 'N') {
      //     Message.err(t('공사책임자가 선택되지않았습니다.'))
      //     return false
      //   }
        
      //   listData[0].DEL_FLAG = 'Y'
      //   await commonExecuteApi({
      //     queryId:"OUTBA0020_INSERT_03",
      //     list: listData,
      //   }).then(res => {
      //     console.log('우리 리스트 저장이 잘됐나 볼까요? :::  ', res)
      //   })

      //   //저장
      // await save2(getJsonData.value)
      // } else {
      //   Message.warn(t('출입인원이 선택되지 않았습니다.'))
      //   return false;

      // }

      return chkReturn;

      
    } else if (tab.value === 3) {

      
    //저장시 입력데이터 가져옴
    const data4 = refSub04.value.getData()
    data4.SAVE_GUBUN = tab.value

    let chkReturn = false

    console.log('data4 ', data4)
    //가져온데이터 기존 데이터에 집어넣음

    // if (data4.FILE_SECURITY === null) {
    //     Message.warn(t('보안서약서는 필수 첨부 파일입니다.'));
    //     return false;
    //   } else if (data4.FILE_SAFETY === null) {
    //     Message.warn(t('안전작업이행각서는 필수 첨부 파일입니다.'));
    //     return false;
    //   }else if (data4.FILE_SIGN === null) {
    //     Message.warn(t('자필서명명단은 필수 첨부 파일입니다.'));
    //     return false;
    //   }

       await vm.$swal({
        title: "4.기타 신청서류가 저장됩니다. 저장하시겠습니까?", showCancelButton: true
        }).then(async res2 => { 

          if (res2.isConfirmed) {
            // const listData4 = refSub04.value.getListData()
            await save(data4)
            // await setFileUpload2(listData4, route.path, commonStore.systemCode, data4.BIZ_REG_NO, true)
            chkReturn = true;
          } else {
            chkReturn = false;
          }      
        
      })
      //네번째 페이지    

      // //저장시 입력데이터 가져옴
      // const data4 = refSub04.value.getData()

      // console.log('data4 : :: ', data4)
      // //가져온데이터 기존 데이터에 집어넣음
      // getJsonData.value = _.merge({}, getJsonData.value, data4)
      // console.log('페이지 4번에서의 데이터 ', getJsonData.value)
      // // N 이면 화면 이동 처리 저장, 아닐시 현재 화면에서 저장
      // getJsonData.value.SAVE_STEP = btnDiv === 'N' ? Number(tab.value) + 1 : tab.value


      // if (data4.FILE_SECURITY === null) {
      //   Message.warn(t('보안서약서는 필수 첨부 파일입니다.'));
      //   return false;
      // } else if (data4.FILE_SAFETY === null) {
      //   Message.warn(t('안전작업이행각서는 필수 첨부 파일입니다.'));
      //   return false;
      // }else if (data4.FILE_SIGN === null) {
      //   Message.warn(t('자필서명명단은 필수 첨부 파일입니다.'));
      //   return false;
      // }

      //  //신청 처리시 status 변경.
      // if (btnDiv != 'N') {
      //   // await save6(data6)
      //   await save(getJsonData.value)
      //   //저장
      //   const listData4 = refSub04.value.getListData()
      //   await setFileUpload2(listData4, route.path, commonStore.systemCode, userStore.bizRegNo, true)
      //   return;
      // }

      // if (getJsonData.value.DEPT_COMPANY != 'HHI') {
      //     vm.$swal({
      //     title: "공사 신청 처리됩니다. 신청 하시겠습니까?", showCancelButton: true
      //   }).then(async res2 => { 
      //     if (res2.isConfirmed) { 
      //       // N 이면 화면 이동 처리 저장, 아닐시 현재 화면에서 저장
      //       getJsonData.value.SAVE_STEP = btnDiv === 'N' ? Number(tab.value) + 1 : tab.value
      //       await save(getJsonData.value)

      //       const listData4 = refSub04.value.getListData()
      //       await setFileUpload2(listData4, route.path, commonStore.systemCode, userStore.bizRegNo, true)

      //       console.log('getJsonData.value ', getJsonData.value)

      //       //기본 상태값 : 25 , 
      //       const statusParm = [{
      //         CMPNY_DIV: getJsonData.value.CMPNY_DIV,
      //         BIZ_REG_NO: getJsonData.value.BIZ_REG_NO,
      //         SHORT_WORK_NO: getJsonData.value.VEND_CD + '-' + getJsonData.value.WORK_NO + '-' + getJsonData.value.REV_NO,
      //         USER_ID: userStore.bizRegNo,
      //         RCV_NO: '',     //단기공사 진행코드값면 변경하기에 필요없음.
      //         STATUS: '25',
      //         GUBUN: '2'
            
      //       }]
      //       //출입신청담당자, 공사발주담당자 다를경우 20
      //       if (getJsonData.value.REQ_PIC_EMPNO != getJsonData.value.DEPT_PIC_EMPNO) {
            
      //         statusParm[0].STATUS = '20'
      //       }
      //       //상태값 update
      //       await saveStatus(statusParm)

      //       await alarmSendSMS(getJsonData.value, 'REQ')
      //       await alarmSendEmail(getJsonData.value, 'REQ')

      //     if (getJsonData.value.REQ_PIC_EMPNO != getJsonData.value.DEPT_PIC_EMPNO) {
      //       await alarmSendSMS(getJsonData.value, 'DEPT')
      //       await alarmSendEmail(getJsonData.value, 'DEPT')
      //     }
      //       emit('close')
      //     }
      //   })
      // } else {
      //   await save(getJsonData.value)
      //   //저장
      //   const listData4 = refSub04.value.getListData()
      //   await setFileUpload2(listData4, route.path, commonStore.systemCode, userStore.bizRegNo, true)
      // }


      return true;
      
    } 
}


const saveMSDS = async (data) => {

if (data.length > 0) {
  //처음 부분 삭제
  data[0].DEL_FLAG = 'Y'
} else {
  data.push(
    {
      DEL_FLAG: 'A',
      BIZ_REG_NO: getJsonData.value.BIZ_REG_NO,
      WORK_NO: getJsonData.value.WORK_NO,
      CMPNY_DIV: getJsonData.value.CMPNY_DIV,
      REV_NO: getJsonData.value.REV_NO,
    }
  )
}
console.log(' param ', data)
console.log(' data ::  ', data[0])

commonExecuteApi({
  queryId: "OUTBA0020_INSERT_05",
  list: data,
}).then(res => {
  console.log('우리 저장이 잘됐는지 확인해볼까요? :::  ', res)
})
}

//컨트롤 초기화
const clearField = () => {
  // grdMain.value.getDataProvider().setRows(null)
  // options.values.BSNS_CD = ""
  // options.values.ASGN_NM = ""
}

const onClose = () => {
  clearField()
  emit('selected')
  dialog.value = false
}

const openPopup = async (popupParam) => {
  console.log('popupParam ', popupParam)
  setPopupParam.CMPNY_DIV = popupParam.CMPNY_DIV
  setPopupParam.BIZ_REG_NO = popupParam.BIZ_REG_NO
  setPopupParam.VEND_CD = popupParam.VEND_CD
  setPopupParam.WORK_NO = popupParam.WORK_NO
  setPopupParam.REV_NO = popupParam.REV_NO
  setPopupParam.STATUS = popupParam.STATUS
  setPopupParam.USER_ID = userStore.userId 


  // // 전산테스트 메일
  // commonSearchApi({ queryId: 'OUTBA0020_SEARCH_05', param: setPopupParam }).then(
  //     async(res) => {
  //       if (res.ORESULT_CUR.length > 0) {
  //         console.log('res.ORESULT_CUR ', res.ORESULT_CUR)
  //         WRK_DIV.value = res.ORESULT_CUR[0].WRK_DIV
  //         setPopupParam.STATUS = res.ORESULT_CUR[0].STATUS
  //         // 공사담당부서 담당자 
  //         dept_pic_emp_no.value = res.ORESULT_CUR[0].DEPT_PIC_EMPNO
  //         // setPopupParam.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
  //         // setPopupParam.BIZ_REG_NO = res.ORESULT_CUR[0].BIZ_REG_NO
  //         // setPopupParam.VEND_CD = res.ORESULT_CUR[0].VEND_CD
  //         // setPopupParam.WORK_NO = res.ORESULT_CUR[0].WORK_NO
  //         // setPopupParam.REV_NO = res.ORESULT_CUR[0].REV_NO
  //         // setPopupParam.USER_ID = userStore.userId


  //         resultData.value = res.ORESULT_CUR[0]
  //         console.log('alarmSendEmail', resultData.value)
  //         await alarmSendEmail(resultData.value, 'REQ') 
  //       }


  //     }
  //   )
  // //




    await setData()
  dialog.value = true
}

/*/기타**************************************************/
// 결재 상신 팝업창이 닫혔을때 리로드.
const onApprovalClosed = async (appKey) => {
  
  console.log('[ApprovalPopup] onApprovalClosed: ', appKey)

  // alert('결재상신 완료 RES ID: ', appKey)

  let resultCod = ''
  let resultMsg = ''
  if (!isEmpty(appKey)) {
    await commonExecuteApi({
      queryId: 'SAFJA0010_SAVE_02',
      list: [
        {
          CMPNY_DIV: setPopupParam.CMPNY_DIV,
          BIZ_REG_NO: setPopupParam.BIZ_REG_NO,
          VEND_CD: setPopupParam.VEND_CD,
          WORK_NO: setPopupParam.WORK_NO,
          REV_NO: setPopupParam.REV_NO,
          APP_KEY: appKey,
          USER_ID: setPopupParam.USER_ID,
        },
      ],
    }).then((res) => {
      console.log('save02 ', res)
      resultCod = res.list[0].RES_COD
      resultMsg = res.list[0].RES_MSG
    })
  }

  //결재가 제대로 처리안됨.
  if (resultCod != '0') {
    return Message.err(resultMsg)
  } else if (resultCod === '0') {
    await setData()
    // if (dtAppro.length < 0) {
    //   return
    // }
  }

  // 연간 공사 일수가 60일을 초과하면 해당 공사 담당부서 운영과장, HSE추진자, 공사담당부서 담당자에게 메일 발송
  if(resultData.value.TOT_PERIOD_YEAR > 60){
    console.log('60일 이상 단기공사')

    // 메일 수신인 조회
    await SearchMailList()

    // 연간 총 공사 목록
    await YearList()

    let mailParams = {}
    
    dtMailSend.forEach(item => {
      mailParams.EMAIL = [item.EMP_NO];
      mailParams.SUBJECT = "[HiSEs] 단기공사 대상 안전보건협의체 운영 등 도급인의 안전보건조치 의무 대상 안내"
      mailParams.CONTENT = ` 
      </br>
      </br>
      <p>1. 귀 부서에서 담당하는 단기공사 업체는 연간 총 작업일수가 60일을 초과하여 도급에 따른 산업재해 예방조치를 필수적으로 수행해야 합니다. (근거: 산업안전보건법 제64)</p>
      <p>2. 해당 업체의 공사 현황은 [HiSEs - 안전 - 단기공사 관리 - 단기공사 현황]에서 확인해 주시기 바라며, 안전보건협의체 운영 등 도급에 따른 산업재해 예방조치를 필수적으로 이행해 주시기 바랍니다.</p>
      </br>
      </br>
      ◎ 연간 단기공사 현황
      협력회사명 : ${resultData.value.VND_NAME ? resultData.value.VND_NAME : ''}, 연간 총 공사일수 (${resultData.value.TOT_PERIOD_YEAR ? resultData.value.TOT_PERIOD_YEAR : '0'} 일)
      </br>
      </br>
      <table class="" style="border-collapse: collapse; width: 4000px;">
        <tbody>
          <tr>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:50px;  text-align: center;">No.</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:100px; text-align: center;">출입신청부서</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:100px; text-align: center;">공사담당부서</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:100px; text-align: center;">공사관리부서</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:150px; text-align: center;">공사명</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:250px; text-align: center;">공사번호</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:150px; text-align: center;">신청일</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:220px; text-align: center;">공사기간</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:100px; text-align: center;">공사 일수</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:150px; text-align: center;">공사장소</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:100px; text-align: center;">출입인원</td>
            <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color: #E6F0FA; width:150px; text-align: center;">진행상태</td>
          </tr>
          `
          dtYearList.forEach(gridItem => {
            mailParams.CONTENT += `
            <tr>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.ROWNUM ? gridItem.ROWNUM : ''}</td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.REQ_DEPT_NM ? gridItem.REQ_DEPT_NM : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.DEPT_NM ? gridItem.DEPT_NM : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.WRK_MNG_DEPT_NM ? gridItem.WRK_MNG_DEPT_NM : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.WORK_DESC ? gridItem.WORK_DESC : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.WORK_NO_INFO ? gridItem.WORK_NO_INFO : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.REQ_DATE ? gridItem.REQ_DATE : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.WORK_DT ? gridItem.WORK_DT : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.TOT_PERIOD_YEAR ? gridItem.TOT_PERIOD_YEAR : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.WORK_AREA ? gridItem.WORK_AREA : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.IN_PERSON_CNT ? gridItem.IN_PERSON_CNT : ''} </td>
              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${gridItem.STATUS_NAME ? gridItem.STATUS_NAME : ''} </td>
            </tr>
            `
          })
          
          mailParams.CONTENT += `
        </tbody>
      </table>
      `
      commonSendApi(mailParams).then(() => {
        Message.success('메일이 전송 되었습니다.')
      })
    })
  }
  

  if (dtAppro.length < 0) {
    return
  }

  
  console.log('dtAppro ', dtAppro)

  let mailSend = []

  reportHtml = setHtml('3', reportHtml, dtAppro)
  reportHtml = setHtml('4', reportHtml, dtApproPerson)

  if (dtAppro.length > 0) {
    //출입신청 부서 담당자와 공사담당부서 담당자가 다를 경우 메일 발송
    if (dtAppro[0].REQ_PIC_EMPNO != dtAppro[0].DEPT_PIC_EMPNO) {
      await commonSearchApi({
        queryId: 'searchUserInfo',
        param: {
          CMPNY_DIV: dtAppro[0].DEPT_COMPANY,
          EMP_NO: dtAppro[0].DEPT_PIC_EMPNO,
        },
      }).then((res) => {
        mailSend.push(res.ORESULT_CUR[0].EMAIL)

        console.log('res 11 ', res.ORESULT_CUR)

        // grdParams.push(res.ORESULT_CUR[0])
      })
    }

    //공사담당부서 담당자와 공사관리부서 담당자가 다를 경우 메일 발송
    if (dtAppro[0].DEPT_PIC_EMPNO != dtAppro[0].WRK_MNG_EMPNO) {
      await commonSearchApi({
        queryId: 'searchUserInfo',
        param: {
          CMPNY_DIV: dtAppro[0].WRK_MNG_COMPANY,
          EMP_NO: dtAppro[0].WRK_MNG_EMPNO,
        },
      }).then((res) => {
        mailSend.push(res.ORESULT_CUR[0].EMAIL)

        console.log('res 22 ', res.ORESULT_CUR)
        // grdParams.push(res.ORESULT_CUR[0])
      })
    }

    console.log('reportHtml ', reportHtml)

    // mailSend.push('BP23091@bp.hd.com')

    let mailParams = {
      SUBJECT: '단기공사 출입신청 알림',
      CONTENT: reportHtml,
      EMAIL: mailSend,
    }

    console.log('mailParams ', mailParams)
    await commonSendApi(mailParams).then((res) => {
      if (res.result.status === '200') {
        Message.success(t('메일이 전송되었습니다.'))
      }
    })
  }
}

//선택 페이지 이동
const setPage = (page) => {
  tab.value = page
  setData()
}

const closeNoticeInfo = () => {
  noticeDialog.value = false
}

const radioCHK = () => {
  if (radioVal.val1 === "Y" && radioVal.val2 === "Y" && radioVal.val3 === "Y"){
    appYN.value = false
  } else {
    appYN.value = true
  }
}

// 연간 총 60일 이상 공사 메일 수신자
const SearchMailList = async () =>{
  await commonSearchApi({
    queryId: 'SAFJA0010_SEARCH_11',
    param: {
      CMPNY_DIV: resultData.value.CMPNY_DIV,
      WORK_NO: resultData.value.VEND_CD + '-' + resultData.value.WORK_NO + '-' + resultData.value.REV_NO,
    },
  }).then(res => {
    if (res){
      console.log('메일 수신자 리스트', res.ORESULT_CUR)
      dtMailSend = res.ORESULT_CUR
    }
  })
}

// 단기공사 현황 목록
const YearList = async () => {
  await commonSearchApi({
    queryId: 'SAFJA0040_SEARCH_POP_01',
    param: {
      CMPNY_DIV: resultData.value.CMPNY_DIV,
      VND_CD: resultData.value.VEND_CD,
      FROM_DT: dayjs(resultData.value.WORK_FROM_DT.substring(0,4) + "0101").format('YYYY-MM-DD'),
      TO_DT:   dayjs(resultData.value.WORK_FROM_DT.substring(0,4) + "1231").format('YYYY-MM-DD'),
    },
  }).then(res => {
    if (res){
      console.log('단기공사 현황 리스트', res.ORESULT_CUR)
      dtYearList = res.ORESULT_CUR
    }
  })
}


defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1800"
    height="1050"
    class=" user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span> {{WRK_DIV === 'S' ? '단기공사 상세정보' : '건설공사 상세정보' }}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="gridTitle"
          :use-permission="false"
          :button-list="
            props.btnGubun === '0'
              ? [
                  'btnReqReturn',
                  'btnFinishReview',
                  'btnReqApply',
                  'btnShortApply',
                  'btnShortEmail',
                  'btnClose',
                ]
              : ['btnShortApply', 'btnShortEmail', 'btnClose']
          "
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0" style="height: calc(100vh - 163px)">
        <div class="d-flex fill-height">
          <div
            class="fill-height d-flex flex-column align-center leftCard bg-base mr-3 pa-5 border-round-15"
          >

            <div
              @click="setPage(0)"
              :class="tab === 0 ? 'setBackground end' : 'start'"
              class="flowChartTxt mb-2"
            >
              <span> 1. 기본정보 </span>
              <svg-icon name="arrowRight"></svg-icon>
            </div>

            <div
              @click="setPage(1)"
              :class="tab === 1 ? 'setBackground end' : 'start'"
              class="flowChartTxt mb-2"
            >
              <span> 2. 공사정보 </span>
              <svg-icon name="arrowRight"></svg-icon>
            </div>

            <div
              @click="setPage(2)"
              :class="tab === 2 ? 'setBackground end' : 'start'"
              class="flowChartTxt mb-2"
            >
              <span> 3. 작업자 출입정보 </span>
              <svg-icon name="arrowRight"></svg-icon>
            </div>

            <div
              @click="setPage(3)"
              :class="tab === 3 ? 'setBackground end' : 'start'"
              class="flowChartTxt mb-2"
            >
              <span> 4. 기타 신청서류 </span>
              <svg-icon name="arrowRight"></svg-icon>
            </div>

            <!-- <div @click="setPage(4)" :class="tab === 4 ? 'setBackground end' : 'start'" class=" flowChartTxt mb-2 " >
                <span>
                  5. 위험작업허가서
                </span>
                <svg-icon name="arrowRight"></svg-icon>
              </div>

              <div @click="setPage(5)" :class="tab === 5 ? 'setBackground end' : 'start'" class="flowChartTxt " >
                <span>
                  6. 작업계획서
                </span>
                <svg-icon name="arrowRight"></svg-icon>
              </div> -->
          </div>
          <div class="bg-base border-round-15 fill-height" style="width: 100%">
            <div class="pa-5 pb-0 border-round-15" style="height: 90%">
              <v-window
                class="fill-height overflow-y-auto border-round-15"
                style="height: 100%"
                direction="vertical"
                v-model="tab"
              >
                <v-window-item key="card-1" :value="0">
                  <!-- 1.기본정보 -->
                  <sub01 ref="refSub01"></sub01>
                </v-window-item>
                <v-window-item key="card-2" :value="1">
                  <!-- 2.공사정보 -->
                  <sub02 ref="refSub02"></sub02>
                </v-window-item>
                <v-window-item key="card-3" :value="2">
                  <!-- 3.작업자 출입정보 -->
                  <sub03 ref="refSub03"></sub03>
                </v-window-item>
                <v-window-item class="fill-height" key="card-4" :value="3">
                  <!-- 4.기타 신청서류 -->
                  <sub04 ref="refSub04"></sub04>
                </v-window-item>
                <!-- <v-window-item key="card-5" :value="4">
                    5.위험작업허가서
                    <sub05 ref="refSub05"></sub05>
                  </v-window-item>
                  <v-window-item key="card-6" :value="5">
                    6.작업계획서
                    <sub06 ref="refSub06"></sub06>
                  </v-window-item> -->
              </v-window>
            </div>
            <v-divider class="my-4"></v-divider>
            <div
              v-if="setPopupParam.STATUS === '20' || setPopupParam.STATUS === '25'"
              style="
                display: grid;
                width: 100%;
                justify-content: center;
                grid-template-columns: 50px 50px;
              "
            >
              <VBtn
                style="grid-column: 1"
                class="titleBtn"
                color="btnPrimary"
                v-if="tab > 0"
                @click="tabMove(0,'')"
              >
                이전
              </VBtn>
              <VBtn
                style="grid-column: 3"
                class="titleBtn"
                color="btnPrimary"
                v-if="tab < 4"
                @click="tabMove(1,'N')"
              >
              {{tab === 3 ? '저장' : '저장/다음'}}
              </VBtn>
            </div>
            <div
              v-else
              style="
                display: grid;
                width: 100%;
                justify-content: center;
                grid-template-columns: 50px 50px;
              "
            >
              <VBtn
                style="grid-column: 1"
                class="titleBtn"
                color="btnPrimary"
                v-if="tab > 0"
                @click="tabMove(0,'')"
              >
                이전
              </VBtn>
              <VBtn
                style="grid-column: 3"
                class="titleBtn"
                color="btnPrimary"
                v-if="tab < 3"
                @click="tabMove(1,'')"
              >
              {{tab === 3 ? '저장' : '다음'}}
              </VBtn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    

  </v-dialog>


  <SAFJA0040Popup02 id="safja0010Popup" ref="SAFJA0040Pop02" />
  <!-- 결재이력팝업 -->
  <SAFJA0040Popup03 ref="SAFJA0040Pop03" />

  <!-- 15일 이상 공사 연락처 팝업 -->
  <SAFJA0040Popup05 ref="SAFJA0040Pop05" />

  <!-- 메일전달팝업 -->
  <SendMailPopup ref="sendMailPop" :titleReadOnly="false" :isReadOnly="false" />
  <!-- 결재 팝업 -->
  <ApprovalPopup ref="approvalPopup" @approval-appkey="onApprovalClosed" />        
  
  <v-dialog
    v-model="m_dialog"
    width="auto"
  >
    <v-card
      max-width="2000"
      style="padding: 50px;"
      prepend-icon="mdi-information"
      title="결재 상신 전 출입 승인자 확인 사항"
    >
    <br>
    <br>
    <br>
    <div style="display: inline-block;">
      <span>1. 출입 신청자가 생산 현장 작업을 진행하나요?</span>
      <v-radio-group 
        v-model="radioVal.val1" inline
        @change="radioCHK()">
        <v-radio label="예" value="Y"></v-radio>
        <v-radio label="아니오" value="N"></v-radio>
      </v-radio-group>
    </div>
    <br>

    <div>
      <span>2. 보험증권이 첨부 되었나요?</span>
      <v-radio-group 
        v-model="radioVal.val2" inline 
        @change="radioCHK()">
        <v-radio label="예" value="Y"></v-radio>
        <v-radio label="아니오" value="N"></v-radio>
      </v-radio-group>
    </div>
    <br>

    <div>
      <span>3. 보험증권의 보상 한도 [최소 인당 5억원/사고당]를 확인하였나요?</span>
      <v-radio-group 
        v-model="radioVal.val3" inline
        @change="radioCHK()">
        <v-radio label="예" value="Y"></v-radio>
        <v-radio label="아니오" value="N"></v-radio>
      </v-radio-group>
    </div>
      
    <br>
    <br>

      <template v-slot:actions>
        <v-btn
          class="ms-auto"
          text="결재상신"
          :disabled="appYN"
          @click="
          m_dialog = false;
           reqApp()"
        ></v-btn>
        <v-btn
          class="ms-auto"
          text="닫기"
          @click="m_dialog = false"
        ></v-btn>
      </template>
    </v-card>
  </v-dialog>


</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 650px;
    max-height: 650px;
    // overflow-y: auto;
  }

  .expanlDiv {
    // min-height: 650px;
    // max-height: 650px;
    overflow-y: auto;
  }
}

.expanTitle {
  background-color: #e3e3e3;
}

.expanText {
  margin: 15px;
}

.formLabelText {
  inline-size: 110px;
}

.radioGroup {
  max-inline-size: 200px;
}

.leftCard {
  // min-inline-size: 200px !important;
  justify-content: space-between;
  max-inline-size: 285px;
  min-inline-size: 285px;
}

.textareaCol {
  max-inline-size: 515px;
  min-inline-size: 515px;

  &:has(.end) {
    max-inline-size: 535px;
    min-inline-size: 535px;
  }
}

.flowChartTxt {
  display: flex;
  align-items: center;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 19%), 0 0 0 rgba(0, 0, 0, 23%);
  cursor: pointer;
  font-size: 20px;
  inline-size: 100%;
  min-block-size: 23%;
  padding-inline-start: 15px;
  height: 75px;

  span {
    inline-size: 200px;
  }
}

.border-round-15 {
  border-radius: 15px 15px 15px 15px !important;
}

.flowChartTxt:not(.setBackground):hover {
  // color: rgb(var(--v-theme-primary));
  animation-duration: 0.5s;
  animation-fill-mode: forwards;
  animation-iteration-count: 1;
  animation-name: animation-in2;
}

.setBackground {
  animation-duration: 0.5s;
  animation-fill-mode: forwards;
  animation-iteration-count: 1;
  animation-name: animation-in;
  color: #fff;
}

.outBackground:not(.setBackground) {
  animation-duration: 0.5s;
  animation-fill-mode: none;
  animation-iteration-count: 1;
  animation-name: animation-out;
  animation-play-state: paused;
}

@keyframes animation-in2 {
  0% {
    color: #000;
  }

  100% {
    color: rgb(var(--v-theme-primary));
  }
}

@keyframes animation-in {
  0% {
    background-color: #fff;
  }

  100% {
    background-color: rgb(var(--v-theme-primary));
  }
}

@keyframes animation-out {
  0% {
    background-color: rgb(var(--v-theme-primary));
  }

  100% {
    background-color: #fff;
  }
}
</style>

<route lang="yaml">
meta:
  noAuth: true
</route>
