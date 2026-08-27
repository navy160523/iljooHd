<!--
  화면명 : 단기공사 현황 팝업
  화면개요 : 단기공사 상세 팝업
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IGridTitle from "@/components/IGridTitle.vue";
// import RealGrid from "@/components/RealGrid.vue";
import { commonSearchApi, getCodeList, getCompanyList,commonRequest, commonExecuteApi,commonSendApi } from '@hiway/api/commonApi'
// import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'
import SAFJA0040Popup02 from "@/pages/30_safety/SAF_J/SAFJA0040Popup02.vue"
import SAFJA0040Popup03 from "@/pages/30_safety/SAF_J/SAFJA0040Popup03.vue"
import SendMailPopup from '@/pages/30_safety/SAF_J/SendMailPopup.vue'
import Sub01 from '@/pages/30_safety/SAF_J/SAFJA0040Popup01_Sub01.vue'
import Sub02 from '@/pages/30_safety/SAF_J/SAFJA0040Popup01_Sub02.vue'
import Sub03 from '@/pages/30_safety/SAF_J/SAFJA0040Popup01_Sub03.vue'
import Sub04 from '@/pages/30_safety/SAF_J/SAFJA0040Popup01_Sub04.vue'
import ApprovalPopup from "@/components/popup/ApprovalPopup.vue"
// import DATAPopup from "@/pages/99_indexPopUp/DATAPopup.vue"
import dayjs from 'dayjs'
import { isEmpty } from "lodash-es";
// import Sub05 from '@/pages/30_safety/SAF_J/SAFJA0040Popup01_Sub05.vue'
// import Sub06 from '@/pages/30_safety/SAF_J/SAFJA0040Popup01_Sub06.vue'
const props = defineProps({
  btnGubun: {
    type: String,
    default: "1",
  },
})


const dialog = ref(false)

const vm = getCurrentInstance().proxy //다이얼로그관련
const SAFJA0040Pop02 = ref(null)
const SAFJA0040Pop03 = ref(null)
const sendMailPop = ref(null)
const userStore = useUserStore()
const t = useI18n().t; //다국어
const gridTitle = ref(null)
const grd1 = ref(null);
const exPanel = ref(null)

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
  dataList1: [],  //회사구분
  dataList2: [],  //출입용도
  dataList3: [],  //부문
  dataList4: [],  //위험작업여부
  dataList5: [],  //진행상태
  dataList6: [],  //안전팀(승인)
  dataList7: [],  //안전팀(확인)
})

//공사정보
let dtAppro = reactive([])
//공사인원정보
let dtApproPerson = reactive([])

const noticeArray = reactive([]) //보여줘야할 공지사항을 저장하고 있는 배열
const noticeDialog = ref(false) //공지사항 dialog vmodel

//결재팝업
const approvalPopup =ref(null)

//해당 페이지에 데이터 전달
const setData = () => {
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

  ]).then(res => {
    // console.log("레스 확인", res)

    //회사구분 콤보박스
    codeList.dataList1 = res[0].ORESULT_CUR

    //출입용도
    codeList.dataList2 = res[1].ORESULT_CUR

  })
}

//버튼 Event
const onButtonsClick = async btn => { 
  if (btn.id === 'btnUpdate') {

    // await commonSearchApi({
    //   queryId: "SAFJA0010_SEARCH_04"
    //   , param: param
    // }).then(res => {
    //   if (res.ORESULT_CUR.length > 0) {

    //     if (res.ORESULT_CUR[0].PHOTO_ERR_CNT != '0') {
    //       Message.warn(t('증명사진 미등록 인원이 ' + res.ORESULT_CUR[0].PHOTO_ERR_CNT + '명 존재하여 결재상신이 불가능 합니다. <br/>단기공사 홈페이지에서 출입인원에 대한 증명사진 등록여부를 체크하시기 바랍니다.'))
    //       chk = true
    //     }
    //   }
    // })

    commonExecuteApi({
      queryId: "SAFJA0010_SAVE_03",
      list: refSub03.value.getListData(),
    }).then((res) => {
      console.log('save02 ', res)
      resultCod = res.OUT_RES_COD
      resultMsg = res.OUT_RES_MSG
    });

  }else if (btn.id === 'btnReqApply') {

    console.log('setPopupParam ', setPopupParam)

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
      queryId: "SAFJA0010_SEARCH_04"
      , param: param
    }).then(res => {
      if (res.ORESULT_CUR.length > 0) {

        if (res.ORESULT_CUR[0].PHOTO_ERR_CNT != '0') {
          Message.warn(t('증명사진 미등록 인원이 ' + res.ORESULT_CUR[0].PHOTO_ERR_CNT + '명 존재하여 결재상신이 불가능 합니다. <br/>단기공사 홈페이지에서 출입인원에 대한 증명사진 등록여부를 체크하시기 바랍니다.'))
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
    await commonSearchApi({queryId: "SAFJA0010_SEARCH_08",
      param: param
    }).then(res => {
      console.log('SAFJA0010_SEARCH_08 ', res.ORESULT_CUR)
      if (res.ORESULT_CUR.length > 0) {
        dtAppro = res.ORESULT_CUR

        reportHtml =  setHtml('1',reportHtml,dtAppro)
      }
    })

    if (userStore.bsnsCd === 'AE00') {
      //특수선 사업부 공지사항 호출
      await commonRequest("/hse/safety/SAFJA0010/search01", {
        queryId: "SAFJA0010_SEARCH_05",
        param: param,
      }).then((res) => {
        console.log('res.SAFJA0010_SEARCH_05 ', res.ORESULT_CUR)
        // SAFJA0040Pop02.value.openPopup(res.ORESULT_CUR)
      })      
    }

    //단기공사 출입인원 조회
    await commonSearchApi({queryId: "SAFJA0010_SEARCH_09",
      param: param
    }).then(res => {
      console.log('SAFJA0010_SEARCH_09 ', res.ORESULT_CUR)
      if (res.ORESULT_CUR.length > 0) {
        dtApproPerson = res.ORESULT_CUR
        reportHtml = setHtml('2',reportHtml,dtApproPerson)
      }
    })

    let fixRine = ''

    // //결재 라인 정보 조회
    await commonSearchApi({
      queryId: "SAFJA0010_SEARCH_07",
      param: param
    }).then(res => {
      if(res.ORESULT_CUR.length > 0) {
        console.log('SAFJA0010_SEARCH_07 ', res)

        if (res.ORESULT_CUR.length > 0) {
          if (res.ORESULT_CUR[0] != null)
          {
            fixRine = res.ORESULT_CUR[0].CLRLINE 
          } else {
            fixRine = ''
          }
        }
      }
    })

    let today = dayjs(new Date).format('YYYYMMDD')
    
    console.log('fixRine ', fixRine)
    await approvalPopup.value.openPopup({
      CLSS_ID: "SAFJA0010",
      TITLE: '단기공사출입신청_' +dtAppro[0].REQ_PIC_DEPTNM2+'_'+userStore.userName+'_'+today,
      CMPNY_DIV: userStore.cmpnyDiv,
      DATA_KEY: userStore.cmpnyDiv+';'+param.BIZ_REG_NO+';'+param.VEND_CD+';'+param.WORK_NO+';'+param.REV_NO,//  // "HHI;AX00;X0Q0;X0Q0;2023", // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      REPORT: reportHtml, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE: "2", //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: "421", //421 일반, 423 단기공사, 424 사고보고서
      FIX_YN: 'Y',
      FIX_CLRLINE: fixRine,
      CLRLINE: "", //결재라인
      CCLINE: "", //참조라인
      PARAM424: "", //사고보고서용 결재라인no,사번
    })

    param.NOTICE_NO = '1'
    //안전대면 팝업
    await commonRequest("/hse/safety/SAFJA0010/search01", {
      queryId: "SAFJA0010_SEARCH_06",
      param: param,
    }).then((res) => {
      console.log('res.SAFJA0010_SEARCH_06 ', res.ORESULT_CUR)
      if (res.ORESULT_CUR.length > 0) {
        SAFJA0040Pop02.value.openPopup(res.ORESULT_CUR)
      }
    })

  }else if (btn.id === 'btnShortApply') {

    // SAFJA0040Pop03.value.openPopup(setPopupParam)
    const setpara = {
      CMPNY_DIV: setPopupParam.CMPNY_DIV,
      BIZ_REG_NO: setPopupParam.BIZ_REG_NO,
      VEND_CD: setPopupParam.VEND_CD,
      WORK_NO: setPopupParam.WORK_NO,
      REV_NO: setPopupParam.REV_NO,
    }

    commonSearchApi({
      queryId: "SAFJA0040_SEARCH_06"
    , param: setpara
    }).then(res => {
      if(res.ORESULT_CUR.length <= 0) {
        return Message.warn(t('결재이력이 존재하지 않습니다.'))
      }
      SAFJA0040Pop03.value.openPopup(res.ORESULT_CUR)
    })

    
  } else if (btn.id === 'btnShortEmail') {
    
    const mailForm = reactive({ 
      TO_EMP_NO: '',
      TO_EMP_NM: '',
      paraData: '',
      personData:''
    })

    console.log('setPopupParam ', setPopupParam)

    commonSearchApi({
      queryId: "SAFJA0040_SEARCH_07"
      , param: setPopupParam
    }).then(async res => {
      console.log('SAFJA0040_SEARCH_07 :::  ', res)
      mailForm.personData = res.ORESULT_CUR
    })

    commonSearchApi({
      queryId: "SAFJA0040_SEARCH_08"
      , param: setPopupParam
    }).then(async res => {
      console.log('SAFJA0040_SEARCH_08 ', res) 
      mailForm.paraData = res.ORESULT_CUR[0]
      sendMailPop.value.openPopup(mailForm,"SAFJA0040","EMAILDTE")  
    })

    
    
  } else if (btn.id === "btnClose") {
    onClose()
  } 
}

//1 공사정보 , 2 인원 정보
const setHtml = (gubun, htmlData,getData) => {
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
    <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:110px;top:87px;width:208px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].REQ_PIC_DEPTNM === null ? '' : getData[0].REQ_PIC_DEPTNM}</font></td></tr></table></div></div>
    <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:87px;width:92px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>담당자</font></td></tr></table></div></div>
    <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:87px;width:246px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].REQ_PIC_EMPNM === null ? '' : getData[0].REQ_PIC_EMPNM}</font></td></tr></table></div></div>
    <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:111px;width:77px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사발주부서</font></td></tr></table></div></div>
    <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:110px;top:111px;width:208px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].DEPT_PIC_DEPTNM === null ? '' : getData[0].DEPT_PIC_DEPTNM}</font></td></tr></table></div></div>
    <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:111px;width:92px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>담당자</font></td></tr></table></div></div>
    <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:111px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].DEPT_PIC_EMPNM === null ? '' : getData[0].DEPT_PIC_EMPNM}</font></td></tr></table></div></div>
    <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:136px;width:77px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사감독부서</font></td></tr></table></div></div>
    <div class=offset style="z-index:10"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:110px;top:136px;width:208px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].WRK_MNG_DEPTNM === null ? '' : getData[0].WRK_MNG_DEPTNM}</font></td></tr></table></div></div>
    <div class=offset style="z-index:11"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:136px;width:92px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>담당자</font></td></tr></table></div></div>
    <div class=offset style="z-index:12"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:136px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].WRK_MNG_EMPNM === null ? '' : getData[0].WRK_MNG_EMPNM}</font></td></tr></table></div></div>
    <div class=offset style="z-index:13"><div style=";padding-left:3px;padding-right:3px;left:34px;top:59px;width:139px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_010w013P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>1.&nbsp;관련부서&nbsp;정보</font></td></tr></table></div></div>

    <div class=offset style="z-index:14"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:200px;width:75px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>협력회사명</font></td></tr></table></div></div>
    <div class=offset style="z-index:15"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:108px;top:200px;width:210px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].VND_NAME === null ? '' : getData[0].VND_NAME}</font></td></tr></table></div></div>
    <div class=offset style="z-index:16"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:200px;width:92px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>사업자번호</font></td></tr></table></div></div>
    <div class=offset style="z-index:17"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:200px;width:246px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].BIZ_REG_NO_DISP === null ? '' : getData[0].BIZ_REG_NO_DISP}</font></td></tr></table></div></div>
    <div class=offset style="z-index:18"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:224px;width:75px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>대표자</font></td></tr></table></div></div>
    <div class=offset style="z-index:19"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:108px;top:224px;width:210px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].REP_NAME === null ? '' : getData[0].REP_NAME}</font></td></tr></table></div></div>
    <div class=offset style="z-index:20"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:224px;width:92px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>전화번호</font></td></tr></table></div></div>
    <div class=offset style="z-index:21"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:224px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].VEND_TELNO === null ? '' : getData[0].VEND_TELNO}</font></td></tr></table></div></div>
    <div class=offset style="z-index:22"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:249px;width:75px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>산재보험&nbsp;No</font></td></tr></table></div></div>
    <div class=offset style="z-index:23"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:108px;top:249px;width:210px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].INJR_INSR_NO === null ? '' : getData[0].INJR_INSR_NO}</font></td></tr></table></div></div>
    <div class=offset style="z-index:24"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:317px;top:249px;width:92px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>단체보상보험No</font></td></tr></table></div></div>
    <div class=offset style="z-index:25"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:249px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].GROUP_INSR_NO === null ? '' : getData[0].GROUP_INSR_NO}</font></td></tr></table></div></div>
    <div class=offset style="z-index:26"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:274px;width:75px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>주소</font></td></tr></table></div></div>
    <div class=offset style="z-index:27"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:108px;top:274px;width:546px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].VEND_ADDR === null ? '' : getData[0].VEND_ADDR}</font></td></tr></table></div></div>
    <div class=offset style="z-index:28"><div style=";padding-left:3px;padding-right:3px;left:34px;top:172px;width:139px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_010w013P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>2.&nbsp;협력회사&nbsp;정보</font></td></tr></table></div></div>

    <div class=offset style="z-index:29"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:339px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사명</font></td></tr></table></div></div>
    <div class=offset style="z-index:30"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:339px;width:539px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].WORK_DESC === null ? '' : getData[0].WORK_DESC}</font></td></tr></table></div></div>
    <div class=offset style="z-index:31"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:363px;width:82px;height:50px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사내용</font></td></tr></table></div></div>
    <div class=offset style="z-index:32"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:363px;width:539px;height:50px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].DTL_WORK_DESC === null ? '' : getData[0].DTL_WORK_DESC}</font></td></tr></table></div></div>
    <div class=offset style="z-index:33"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:412px;width:82px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>출입용도</font></td></tr></table></div></div>
    <div class=offset style="z-index:34"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:412px;width:539px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].ENTRANCE_NM === null ? '' : getData[0].ENTRANCE_NM}</font></td></tr></table></div></div>
    <div class=offset style="z-index:35"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:437px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사장소</font></td></tr></table></div></div>
    <div class=offset style="z-index:36"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:437px;width:204px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].WORK_AREA_NM === null ? '' : getData[0].WORK_AREA_NM}</font></td></tr></table></div></div>
    <div class=offset style="z-index:37"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:318px;top:437px;width:336px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].WORK_AREA_DESC === null ? '' : getData[0].WORK_AREA_DESC}</font></td></tr></table></div></div>
    <div class=offset style="z-index:38"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:461px;width:82px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사책임자</font></td></tr></table></div></div>
    <div class=offset style="z-index:39"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:461px;width:204px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].NAME === null ? '' : getData[0].NAME}</font></td></tr></table></div></div>
    <div class=offset style="z-index:40"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:318px;top:461px;width:91px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>공사기간</font></td></tr></table></div></div>
    <div class=offset style="z-index:41"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:461px;width:246px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].WORK_DT === null ? '' : getData[0].WORK_DT}</font></td></tr></table></div></div>
    <div class=offset style="z-index:42"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:486px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>휴대폰</font></td></tr></table></div></div>
    <div class=offset style="z-index:43"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:486px;width:204px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].MOBILE === null ? '' : getData[0].MOBILE}</font></td></tr></table></div></div>
    <div class=offset style="z-index:44"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:318px;top:486px;width:91px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>현장전화</font></td></tr></table></div></div>
    <div class=offset style="z-index:45"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:486px;width:246px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].WORK_OFFI_TEL === null ? '' : getData[0].WORK_OFFI_TEL}</font></td></tr></table></div></div>
    <div class=offset style="z-index:46"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:510px;width:82px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>출입인원</font></td></tr></table></div></div>
    <div class=offset style="z-index:47"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:510px;width:539px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].PERSON_CNT === null ? '' : getData[0].PERSON_CNT}</font></td></tr></table></div></div>
    <div class=offset style="z-index:48"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:535px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>유해화학물질</font></td></tr></table></div></div>
    <div class=offset style="z-index:49"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:535px;width:539px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].HARM_CMCAL === null ? '' : getData[0].HARM_CMCAL}</font></td></tr></table></div></div>
    <div class=offset style="z-index:50"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:559px;width:82px;height:26px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>사용장비</font></td></tr></table></div></div>
    <div class=offset style="z-index:51"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:115px;top:559px;width:539px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].USE_EQUIP === null ? '' : getData[0].USE_EQUIP}</font></td></tr></table></div></div>
    <div class=offset style="z-index:52"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:584px;width:82px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>장비운전자</font></td></tr></table></div></div>
    <div class=offset style="z-index:53"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:115px;top:584px;width:62px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>성명</font></td></tr></table></div></div>
    <div class=offset style="z-index:54"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:176px;top:584px;width:143px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].EQUIP_DRIVER === null ? '' : getData[0].EQUIP_DRIVER}</font></td></tr></table></div></div>
    <div class=offset style="z-index:55"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:318px;top:584px;width:91px;height:25px;overflow:hidden;background-color:#e9e9ff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>관련자격</font></td></tr></table></div></div>
    <div class=offset style="z-index:56"><div class=b_0 style=";padding-left:4px;padding-right:2px;left:408px;top:584px;width:246px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[0].RELE_LICENSE === null ? '' : getData[0].RELE_LICENSE}</font></td></tr></table></div></div>
    <div class=offset style="z-index:57"><div style=";padding-left:3px;padding-right:3px;left:34px;top:310px;width:139px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_010w013P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>3.&nbsp;공사내역&nbsp;정보</font></td></tr></table></div></div>
`
    
  }else if (gubun === '2') {
    console.log('getData 2 ', getData)

    result = result + `
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

    for (let i = 0; i < getData.length; i++){
      text = text + `
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:34px;top:${top}px;width:83px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[i].NAME === null ? '' : getData[i].NAME}</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:116px;top:${top}px;width:61px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[i].BIR_DAY === null ? '' : getData[i].BIR_DAY}</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:176px;top:${top}px;width:180px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[i].WORK_DT === null ? '' : getData[i].WORK_DT}</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:355px;top:${top}px;width:97px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[i].GATE_NM === null ? '' : getData[i].GATE_NM}</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:451px;top:${top}px;width:101px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[i].CAR_KIND === null ? '' : getData[i].CAR_KIND}</font></td></tr></table></div></div>
      <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:551px;top:${top}px;width:103px;height:26px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_008w011P000s000P000 class=굴림><nobr/>${getData[i].CAR_NO === null ? '' : getData[i].CAR_NO}</font></td></tr></table></div></div>
      `
      top = top +height
    }

    text = text + `
    <div class=offset style="z-index:76"><div style=";padding-left:3px;padding-right:3px;left:33px;top:621px;width:139px;height:25px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=left><font id=f_010w013P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>4.&nbsp;인원/차량&nbsp;정보</font></td></tr></table></div></div>
    </div>
    </body>
    </html>
    `
    result = result + text

  }else if (gubun === '3') {
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
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;">출입신청부서 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:130px;"> ${getData[0].REQ_PIC_DEPTNM === null ? '' : getData[0].REQ_PIC_DEPTNM} </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;"> 담당자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:250px;"> ${getData[0].REQ_PIC_EMPNM === null ? '' : getData[0].REQ_PIC_EMPNM} </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;">${getData[0].WRK_DIV === 'B' ? '공사발주부서' : '공사관리부서' }</td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; "> ${getData[0].DEPT_PIC_DEPTNM === null ? '' : getData[0].DEPT_PIC_DEPTNM} </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 담당자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].DEPT_PIC_EMPNM === null ? '' : getData[0].DEPT_PIC_EMPNM} </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;">${getData[0].WRK_DIV === 'B' ? '공사감독부서' : '공사담당부서' }</td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; "> ${getData[0].WRK_MNG_DEPTNM === null ? '' : getData[0].WRK_MNG_DEPTNM} </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 담당자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].WRK_MNG_EMPNM === null ? '' : getData[0].WRK_MNG_EMPNM} </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style="line-height:30px;">
                            <span class="text"><strong>2.협력회사 정보</strong></span>
                        </p>
                          <table class="" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;"> 협력회사명 </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:250px;"> ${getData[0].VND_NAME === null ? '' : getData[0].VND_NAME} </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;"> 사업자번호 </td>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:250px;"> ${getData[0].BIZ_REG_NO_DISP === null ? '' : getData[0].BIZ_REG_NO_DISP} </td>
                              </tr>
                              <tr>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 대표자 </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].REP_NAME === null ? '' : getData[0].REP_NAME} </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 전화번호 </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].VEND_TELNO === null ? '' : getData[0].VEND_TELNO} </td>
                              </tr>
                              <tr>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 산재보험 No </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].INJR_INSR_NO === null ? '' : getData[0].INJR_INSR_NO} </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 단체보상보험No </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].GROUP_INSR_NO === null ? '' : getData[0].GROUP_INSR_NO} </td>
                              </tr>
                              <tr>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 주소 </td>
                                  <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;" colSpan="3"> ${getData[0].VEND_ADDR === null ? '' : getData[0].VEND_ADDR} </td>
                              </tr>
                            </tbody>
                          </table>

                        <p style="line-height:30px;">
                            <span class="text"><strong>3. 공사내역 정보</strong></span>
                        </p>
                        <table class="" style="border-collapse: collapse;">
                          <tbody>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:130px;"> 공사명 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:650px;"> ${getData[0].WORK_DESC === null ? '' : getData[0].WORK_DESC} </td>
                            </tr>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 공사내용 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].DTL_WORK_DESC === null ? '' : getData[0].DTL_WORK_DESC} </td>
                            </tr>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 출입용도 </td>
                                <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].ENTRANCE_NM === null ? '' : getData[0].ENTRANCE_NM} </td>
                            </tr>
                            <tr>
                                <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 공사장소 </td>
                                <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].WORK_AREA_NM === null ? '' : getData[0].WORK_AREA_NM} </td>
                                <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].WORK_AREA_DESC === null ? '' : getData[0].WORK_AREA_DESC} </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 공사책임자 </td>
                              <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].NAME === null ? '' : getData[0].NAME} </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:110px;"> 공사기간 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].WORK_DT === null ? '' : getData[0].WORK_DT} </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 휴대폰 </td>
                              <td colSpan='2' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].MOBILE === null ? '' : getData[0].MOBILE} </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 현장전화 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].WORK_OFFI_TEL === null ? '' : getData[0].WORK_OFFI_TEL} </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 출입인원 </td>
                              <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].PERSON_CNT === null ? '' : getData[0].PERSON_CNT} </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 유해화학물질 </td>
                              <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].HARM_CMCAL === null ? '' : getData[0].HARM_CMCAL} </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 사용장비 </td>
                              <td colSpan='4' style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid;"> ${getData[0].USE_EQUIP === null ? '' : getData[0].USE_EQUIP} </td>
                            </tr>
                            <tr>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF;"> 장비운전자 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:80px;"> 성명 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:100px;"> ${getData[0].EQUIP_DRIVER === null ? '' : getData[0].EQUIP_DRIVER} </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:100px;"> 관련자격 </td>
                              <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:220px;"> ${getData[0].RELE_LICENSE === null ? '' : getData[0].RELE_LICENSE} </td>
                            </tr>
                          </tbody>
                        </table>
                        <p style="line-height:30px;">
                            <span class="text"><strong>4. 인원/차량 정보</strong></span>
                        </p>
`
    
  }else if (gubun === '4') {
    console.log('getData 4 ', getData)

    result = result + `
            <table class="ck-table-resized" style="border-collapse: collapse;">
              <thead>
                <tr>
                    <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:120px;">
                        성명
                    </th>
                    <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:80px;">
                        생년월일
                    </th>
                    <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:220px;">
                        출입기간
                    </th>
                    <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:150px;">
                        출입문
                    </th>
                    <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:120px;">
                        차종
                    </th>
                    <th style="background-color:#D9D6FF; border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; width:120px;">
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

    for (let i = 0; i < getData.length; i++){
      text = text + `
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
const tabMove = (tabGubun) => {

  if (tabGubun === 0) {
    // tempSave('B')
    tab.value = Number(tab.value) - 1 
    setData()
  } else if (tabGubun === 1 ) {
    if (tab.value === 3) {
      return;
    }
    tab.value = Number(tab.value) + 1 
    setData()
  }
    
}


//컨트롤 초기화
const clearField = () => {
  // grdMain.value.getDataProvider().setRows(null)
  // options.values.BSNS_CD = ""
  // options.values.ASGN_NM = ""
}

const onClose = () => {
  clearField()
  dialog.value = false
}


const openPopup = async (popupParam) => {
  console.log('popupParam ', popupParam)
  // setPopupParam
  commonSearchApi({ queryId: "OUTBA0020_SEARCH_05", param: popupParam  }).then(async res => {
    if (res.ORESULT_CUR.length > 0) {

      console.log('res.ORESULT_CUR ', res.ORESULT_CUR)
      

      setPopupParam.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
      setPopupParam.BIZ_REG_NO = res.ORESULT_CUR[0].BIZ_REG_NO
      setPopupParam.VEND_CD = res.ORESULT_CUR[0].VEND_CD
      setPopupParam.WORK_NO = res.ORESULT_CUR[0].WORK_NO
      setPopupParam.REV_NO = res.ORESULT_CUR[0].REV_NO
      setPopupParam.USER_ID = userStore.userId

      resultData.value = res.ORESULT_CUR[0]
      tab.value = 0
      if(['30','40','50','60'].includes(res.ORESULT_CUR[0].STATUS)) {
        gridTitle.value.disableBtn("btnReqApply", true)
      } else {
        gridTitle.value.disableBtn("btnReqApply", false)
      }
      setData()
    }
  })
  dialog.value = true
}

/*/기타**************************************************/
// 결재 상신 팝업창이 닫혔을때 리로드.
const onApprovalClosed = async appKey => {
  console.log('[ApprovalPopup] onApprovalClosed: ', appKey)
  // alert('결재상신 완료 RES ID: ', appKey)

  let resultCod = ''
  let resultMsg = ''
  if (!isEmpty(appKey)) {
    await commonExecuteApi({
      queryId: "SAFJA0010_SAVE_02",
      list: [{
        CMPNY_DIV: setPopupParam.CMPNY_DIV,
        BIZ_REG_NO: setPopupParam.BIZ_REG_NO,
        VEND_CD: setPopupParam.VEND_CD,
        WORK_NO: setPopupParam.WORK_NO,
        REV_NO: setPopupParam.REV_NO,
        APP_KEY: appKey,
        USER_ID: setPopupParam.USER_ID,
      }],
    }).then((res) => {
      console.log('save02 ', res)
      resultCod = res.OUT_RES_COD
      resultMsg = res.OUT_RES_MSG
    });

  }

    //결재가 제대로 처리안됨.
    if (resultCod != '0') {
      return Message.err(resultMsg)
    } else if (resultCod === '0') {

      // if (dtAppro.length < 0) {
      //   return
      // }
  }

  if (dtAppro.length < 0) {
        return
  }
  console.log('dtAppro ', dtAppro)

  let mailSend = []

reportHtml = setHtml('3', reportHtml, dtAppro)
reportHtml =  setHtml('4',reportHtml, dtApproPerson)

  if (dtAppro.length > 0) {
    //출입신청 부서 담당자와 공사담당부서 담당자가 다를 경우 메일 발송
    if (dtAppro[0].REQ_PIC_EMPNO != dtAppro[0].DEPT_PIC_EMPNO) {

      await commonSearchApi({ 
        queryId : 'searchUserInfo',
        param : { 
          CMPNY_DIV: dtAppro[0].DEPT_COMPANY, 
          EMP_NO: dtAppro[0].DEPT_PIC_EMPNO,
        },
      }).then(res => {

        mailSend.push(res.ORESULT_CUR[0].EMAIL)

        console.log('res 11 ', res.ORESULT_CUR)


        // grdParams.push(res.ORESULT_CUR[0])
      })
      
    }

    //공사담당부서 담당자와 공사관리부서 담당자가 다를 경우 메일 발송
    if (dtAppro[0].DEPT_PIC_EMPNO != dtAppro[0].WRK_MNG_EMPNO) {
      await commonSearchApi({ 
        queryId : 'searchUserInfo',
        param : { 
          CMPNY_DIV: dtAppro[0].WRK_MNG_COMPANY, 
          EMP_NO: dtAppro[0].WRK_MNG_EMPNO,
        },
      }).then(res => {
        mailSend.push(res.ORESULT_CUR[0].EMAIL)

        console.log('res 22 ', res.ORESULT_CUR)
        // grdParams.push(res.ORESULT_CUR[0])
      })
      
    }

    console.log('reportHtml ',reportHtml)

    // mailSend.push('BP23091@bp.hd.com')

    let mailParams = {
      SUBJECT: '단기공사 출입신청 알림',
      CONTENT: reportHtml,
      EMAIL: mailSend
    }

    console.log('mailParams ', mailParams)


    await commonSendApi(mailParams).then(res => {
      if (res.result.status === '200') {
        console.log('res ', res)
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
    height="980"
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
      <span>단기공사 상세정보</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="gridTitle"
          :use-permission="false"
          :button-list="props.btnGubun === '0' ? ['btnUpdate','btnReqApply','btnShortApply', 'btnShortEmail','btnClose'] : ['btnShortApply', 'btnShortEmail','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0"  style="height: calc(100vh - 163px);">
        
          <div class="d-flex fill-height">
            <div class="fill-height d-flex flex-column align-center leftCard bg-base mr-3 pa-5 border-round-15" >

              <div @click="setPage(0)" :class="tab === 0 ? 'setBackground end' : 'start'" class=" flowChartTxt mb-2 ">
                <span>
                  1. 기본정보  
                </span>
                <svg-icon name="arrowRight"></svg-icon>
              </div>

              <div @click="setPage(1)" :class="tab === 1 ? 'setBackground end' : 'start'" class=" flowChartTxt mb-2 " >
                <span>
                  2. 공사정보
                </span>
                <svg-icon name="arrowRight"></svg-icon>
              </div>

              <div @click="setPage(2)" :class="tab === 2 ? 'setBackground end' : 'start'" class=" flowChartTxt mb-2 " >
                <span>
                  3. 작업자 출입정보
                </span>
                <svg-icon name="arrowRight"></svg-icon>
              </div>

              <div @click="setPage(3)" :class="tab === 3 ? 'setBackground end' : 'start'" class=" flowChartTxt mb-2 " >
                <span>
                  4. 기타 신청서류
                </span>
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
            <div class="bg-base border-round-15 fill-height" style=" width: 100%;">
              <div class="pa-5 pb-0 border-round-15" style="height: 90%;">
                <v-window class="fill-height overflow-y-auto border-round-15" style="height: 100%;" direction="vertical" v-model="tab">
                  <v-window-item  key="card-1" :value="0">
                    <!-- 1.기본정보 -->
                    <sub01 ref="refSub01" ></sub01>
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
              <div style=" display: grid; width: 100%;justify-content: center; grid-template-columns: 50px 50px;">
                <VBtn
                style="grid-column: 1;"
                class="titleBtn"
                color="btnPrimary"
                v-if="tab > 0"
                @click="tabMove(0)">
                  이전
                </VBtn>
                <VBtn
                style="grid-column: 3;"
                class="titleBtn"
                color="btnPrimary"
                v-if="tab < 5"
                @click="tabMove(1)">
                  다음
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
  <!-- 메일전달팝업 -->
  <SendMailPopup ref="sendMailPop" :titleReadOnly="false" :isReadOnly="false"/>
  <!-- 결재 팝업 -->
  <ApprovalPopup ref="approvalPopup" @approval-appkey="onApprovalClosed" />
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

.expanTitle{
  background-color: #e3e3e3;
}

.expanText{
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
