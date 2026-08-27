<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import dayjs from "dayjs"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
} from "@hiway/api/commonApi"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'

import saveFlowHelper from '@/utils/saveFlowHelper'
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import EmpPopup from "@/components/popup/EmpPopup.vue";
import { getJsonFromExcel } from "@/utils/excel"


// 안전칭찬쿠폰 실적
defineOptions({
  name: "60_edu-EDU_D-EDUDC0020",
})

const empPopup = ref(null)
const empPopup_batch = ref(null)
const empPopup_create = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const gridTitle = ref(null)

const grdMain01_01 = ref(null)
const grdMain02_01 = ref(null)
let showMessageYN = true


const smsParam = reactive({
  EMPNO_FROM: '',
  EMPNO_TO: '',
  SYSCODE: "156", //이부분은 000으로 고정
  FROM_P_NO: '', //보내는사람 폰번호
  TO_P_NO: '', //받는사람 폰번호
  TITLE: '', //제목,내용

})


const searchParams01_01 = reactive({ 
    CMPNY_DIV: userStore.cmpnyDiv, 
    YYYYMM: dayjs(new Date()).format('YYYY-MM'),  // 한달 전    
    IDV_DPT_DIV: 'I',                             // 부서(D) 개인(I)
    ISUR_EMP_NM: userStore.userName,              // 발급인 이름
    ISUR_EMP_NO: userStore.empNo,                 // 발급인 사번
    ISUR_EMP_ASGN_NM: userStore.asgnNm,           // 발급인 소속명
    CPN_COUNT: '',
    BSNS_CD_ISUR: userStore.bsnsCd ,              // 발급인 사업부 
    DEPT_CD_ISUR: userStore.deptCd ,              // 발급인 부서
    ASGN_CD_ISUR: userStore.asgnCd,               // 발급인 소속
    
  })

  const searchParams02_01 = reactive({ 
    CMPNY_DIV: userStore.cmpnyDiv, 
    YYYYMM: dayjs(new Date()).format('YYYY-MM'),  // 한달 전    
    // YEAR: dayjs(new Date()).format('YYYY'),
    // MNTH: (dayjs().get("month") - (dayjs().get("month") - 1) % 3).toString().padStart(2, '0'),  // 분기,
    IDV_DPT_DIV: 'D',                             // 부서(D) 개인(I)
    ISUR_EMP_NM: userStore.userName,              // 발급인 이름
    ISUR_EMP_NO: userStore.empNo,                 // 발급인 사번
    ISUR_EMP_ASGN_NM: userStore.asgnNm,           // 발급인 소속명
    CPN_COUNT: '',
    BSNS_CD_ISUR: userStore.bsnsCd ,              // 발급인 사업부 
    DEPT_CD_ISUR: userStore.deptCd ,              // 발급인 부서
    ASGN_CD_ISUR: userStore.asgnCd,               // 발급인 소속

    ARY_BSNS_DEPT_CD: ''  // 발급인 '사업부코드,부서코드'   - 구분자: ,
    
  })

const batchParams01_01 = reactive({ 

    chk_01: "N", // 장소 체크박스
    chk_02: "N", // 주요활동 체크박스 
    // chk_03: "N",  // 발급인 체크박스
    PLACE: '',
    MAIN_ACTIVITY: '',
    // IDV_DPT_DIV: '',              // 전체?부서?개인?
    // ISUR_EMP_NM: '',              // 발급인 이름
    // ISUR_EMP_NO: '',              // 발급인 사번
    // ISUR_EMP_ASGN_NM: '',         // 발급인 소속
    // BSNS_CD_ISUR: '',             // 발급인 사업부 
    // DEPT_CD_ISUR: '',             // 발급인 부서
    // ASGN_CD_ISUR: '',               // 발급인 소속
    // CPN_COUNT: '',
  })


  const batchParams02_01 = reactive({ 

    chk_01: "N", // 장소 체크박스
    chk_02: "N", // 주요활동 체크박스 
    PLACE: '',
    MAIN_ACTIVITY: '',
    })




  const saveParams_01 = ref([])
  const saveParams_02 = ref([])

/* 분기 */
const QTCODE = reactive([
  { COD: "01", TXT: "1분기" },
  { COD: "04", TXT: "2분기" },
  { COD: "07", TXT: "3분기" },
  { COD: "10", TXT: "4분기" },
])






// const searchParams02_01 = reactive({ 
//   CMPNY_DIV: userStore.cmpnyDiv, 
//   START_DATE: dayjs(new Date()).subtract(1, 'month').format('YYYY-MM-DD'), // 한달 전          
//   END_DATE: dayjs(new Date()).format('YYYY-MM-DD'), // 오늘
//   USER_DIV: '',
// })




const tab = ref('tab1')
const codeList1 = reactive({
  cmpnyDiv : [], // 회사구분
  bsns_cd : [],
  main_activity : [], //지급중단구분
  gift_kind : [],

})

const codeList2 = reactive({
  cmpnyDiv : [], // 회사구분
  bsns_cd : [],
  main_activity : [], //지급중단구분
  gift_kind : [],
  target_dept_nm : [], // 안전칭찬쿠폰 발급 부서 목록
})




//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIC210'), // 주요활동
    getCodeList('HHIZ000'), // 회사구분
    getCodeList('HHIC220'), // 상품구분
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'EDUDC0020_TAB02_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv} }), // 칭찬쿠폰 발급부서 조회 
  ]).then(res => {

    // 주요활동 세팅
    res[0].ORESULT_CUR.forEach(value => 
    {
      codeList1.main_activity.push({TXT : value.TXT, COD : value.COD})
      codeList2.main_activity.push({TXT : value.TXT, COD : value.COD})
    })

    // 회사 세팅
    codeList1.cmpnyDiv = res[1].ORESULT_CUR
    codeList2.cmpnyDiv = res[1].ORESULT_CUR


    // 상품구분
    res[2].ORESULT_CUR.forEach(value => 
    {
      codeList1.gift_kind.push({TXT : value.TXT, COD : value.COD})
      codeList2.gift_kind.push({TXT : value.TXT, COD : value.COD})
    })

    // 사업부 세팅
    codeList1.bsns_cd = res[3].ORESULT_CUR
    codeList2.bsns_cd = res[3].ORESULT_CUR
    

    console.log('나의 부서는 ', userStore.deptCd, userStore.bsnsCd)

    // 칭찬쿠폰 부서 세팅 
    res[4].ORESULT_CUR.forEach(value => 
    {      
      codeList2.target_dept_nm.push({TXT : value.DEPT_NM, COD : value.BSNS_CD + ',' + value.DEPT_CD})

           if ((value.BSNS_CD === userStore.bsnsCd) && (value.DEPT_CD === userStore.deptCd)){
              searchParams02_01.ARY_BSNS_DEPT_CD = value.BSNS_CD + ',' + value.DEPT_CD
           }
           
    })

    console.log(' res[4] ', codeList2.target_dept_nm) 
    console.log('searchParams02_01.ARY_BSNS_DEPT_CD', searchParams02_01.ARY_BSNS_DEPT_CD)
    
  }).finally(() => {
    // grdMain01_01 lookup set
    grdMain01_01.value.setBindingColumn("AWD_CD", codeList1.main_activity, "COD", "TXT")  
    grdMain01_01.value.setBindingColumn("BSNS_CD", codeList1.bsns_cd, "BSNS_CD", "BSNS_NM")   
    grdMain01_01.value.setBindingColumn("GIFT_KIND", codeList1.gift_kind, "COD", "TXT")   

    // grdMain02_01 lookup set
    grdMain02_01.value.setBindingColumn("AWD_CD", codeList1.main_activity, "COD", "TXT")   
    grdMain02_01.value.setBindingColumn("BSNS_CD", codeList1.bsns_cd, "BSNS_CD", "BSNS_NM")   
    grdMain02_01.value.setBindingColumn("GIFT_KIND", codeList1.gift_kind, "COD", "TXT")   
  })
}

//<TAB1> 그리드 1_1 속성셋팅 
const grdProps01_01 = reactive({
  gridViewOption : { checkBar: { visible: true }, display: { selectionStyle : 'singleRow' },  stateBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "BSNS_CD",
      header: { text: t("수상자 사업부") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
      lookupDisplay: true,
    },
    {
      fieldName: "AWD_DT",
      header: { text: t("지급일") },
      width: '60',
      dataType: "date",
      datetimeFormat: 'yyyy-MM-dd',
      type: 'data',
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NAME",
      header: { text: t("수상자 성명") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NO",
      header: { text: t("수상자 사번") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "HND_PHN",
      header: { text: t("휴대폰 번호") },
      width: '60',
      dataType: "text",
      editable: false,
      visible: false, // 2024.07.08 박용훈 화면에서 안보이도록 수정
    },
    {
      fieldName: "AWD_ASGN_NAME",
      header: { text: t("수상자 소속/협력사") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_LOC",
      header: { text: t("장소") },
      width: '60',
      styleName: 'left-column editable_column',
      dataType: "text",
      editable: true,
      editor: {
        type: "text",
        required: true,
      },
    },
    {
      fieldName: "AWD_CD",
      header: { text: t("주요활동") },
      width: '60',
      styleName: 'left-column editable_column',
      dataType: "text",
      editable: true,
      lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true }
    },
    {
      fieldName: "AWD_DTL",
      header: { text: t("활동상세내역") },
      width: '60',
      styleName: 'left-column editable_column',
      dataType: "text",
      editable: true,
    },

    {
      fieldName: "ISUR_NAME",
      header: { text: t("발급인") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "RECOMMENDER",
      header: { text: t("추천인(선택)") },
      width: '60',
      styleName: 'left-column editable_column',
      dataType: "text",
      editable: true,
    },
    {
      fieldName: "ISUR_ASGN_NM",
      header: { text: t("발급인 소속") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    { fieldName: "GIFT_KIND", header: { text: t("상품종류") },width: '60', dataType: "text", editable: false, lookupDisplay: true, visible: false },
    { fieldName: "AWD_SEQ", header: { text: t("AWD_SEQ") }, width: '60', dataType: "text", editable: false,  visible: true  },
    { fieldName: "AWD_CNT", header: { text: t("AWD_CNT") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "AWD_DEPT_CD", header: { text: t("AWD_DEPT_CD") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "AWD_ASGN_CD", header: { text: t("AWD_ASGN_CD") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "OUT_YN", header: { text: t("OUT_YN") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "ISUR_ASGN_CD", header: { text: t("ISUR_ASGN_CD") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "ISUR_EMP_NO", header: { text: t("ISUR_EMP_NO") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "BSNS_CD_ISUR", header: { text: t("BSNS_CD_ISUR") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "DEPT_CD_ISUR", header: { text: t("DEPT_CD_ISUR") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "SAVE_YN", header: { text: t("SAVE_YN") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "CMPNY_DIV", header: { text: t("CMPNY_DIV") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "COMPANY", header: { text: t("COMPANY") }, width: '60', dataType: "text", editable: false,  visible: false  },

  ],
  columns: [],

})
grdProps01_01.columns = grdProps01_01.fields



//<TAB1> 그리드 1_1 속성셋팅 
  const grdProps02_01 = reactive({
  gridViewOption : { checkBar: { visible: true }, display: { selectionStyle : 'singleRow' },  stateBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "BSNS_CD",
      header: { text: t("수상자 사업부") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
      lookupDisplay: true,
    },
    {
      fieldName: "AWD_DT",
      header: { text: t("지급일") },
      width: '60',
      dataType: "date",
      datetimeFormat: 'yyyy-MM-dd',
      type: 'data',
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NAME",
      header: { text: t("수상자 성명") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NO",
      header: { text: t("수상자 사번") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "HND_PHN",
      header: { text: t("휴대폰 번호") },
      width: '60',
      dataType: "text",
      editable: false,
      visible: false, // 2024.07.08 박용훈 화면에서 안보이도록 수정
    },
    {
      fieldName: "AWD_ASGN_NAME",
      header: { text: t("수상자 소속/협력사") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_LOC",
      header: { text: t("장소") },
      width: '60',
      styleName: 'left-column editable_column',
      dataType: "text",
      editable: true,
    },
    {
      fieldName: "AWD_CD",
      header: { text: t("주요활동") },
      width: '60',
      styleName: 'left-column editable_column',
      dataType: "text",
      editable: true,
      lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true }
    },
    {
      fieldName: "AWD_DTL",
      header: { text: t("활동상세내역") },
      width: '60',
      styleName: 'left-column editable_column',
      dataType: "text",
      editable: true,
    },
    {
      fieldName: "GIFT_KIND",
      header: { text: t("상품종류") },
      width: '60',
      dataType: "text",
      editable: false,
      lookupDisplay: true,
    },
    {
      fieldName: "ISUR_NAME",
      header: { text: t("발급인") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "RECOMMENDER",
      header: { text: t("추천인") },
      width: '60',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ISUR_ASGN_NM",
      header: { text: t("발급인 소속") },
      width: '60',
      dataType: "text",
      editable: false,
    },

    { fieldName: "AWD_SEQ", header: { text: t("AWD_SEQ") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "AWD_CNT", header: { text: t("AWD_CNT") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "AWD_DEPT_CD", header: { text: t("AWD_DEPT_CD") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "AWD_ASGN_CD", header: { text: t("AWD_ASGN_CD") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "OUT_YN", header: { text: t("OUT_YN") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "ISUR_ASGN_CD", header: { text: t("ISUR_ASGN_CD") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "ISUR_EMP_NO", header: { text: t("ISUR_EMP_NO") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "BSNS_CD_ISUR", header: { text: t("BSNS_CD_ISUR") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "DEPT_CD_ISUR", header: { text: t("DEPT_CD_ISUR") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "SAVE_YN", header: { text: t("SAVE_YN") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "CMPNY_DIV", header: { text: t("CMPNY_DIV") }, width: '60', dataType: "text", editable: false,  visible: false  },
    { fieldName: "COMPANY", header: { text: t("COMPANY") }, width: '60', dataType: "text", editable: false,  visible: false  },
 
    
  ],
  columns: [],

})
grdProps02_01.columns = grdProps02_01.fields


const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    if (tab.value === "tab1"){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain01_01])
        .setQuery(searchData01_01)
        .setAfter(afterSearch01_01)
        .showMessage(showMessageYN)
        .run()

        Get_CpnStatus('tab1')
    }
    else if (tab.value === "tab2"){
        new queryFlowHelper(vm, t)
          .setGridList([grdMain02_01])
          .setQuery(searchData02_01)
          .setAfter(afterSearch02_01)
          .showMessage(showMessageYN)
          .run()

        Get_CpnStatus('tab2')
    }
  }
  else if (btn.id === "btnCreate"){

    if (tab.value === "tab1"){
      openPopup('포상자추가')
    }
    else if (tab.value === "tab2"){
      openPopup('포상자추가')
    }

  }
  else if (btn.id === "btnUpdate"){
    let  chekedRow = grdMain01_01.value.getGridView().getCheckedRows(); 

    for (const val of chekedRow) {
        let data = ref({});
        if(tab.value === 'tab1'){
          data = grdMain01_01.value.getDataProvider().getJsonRow(val);     
        } else if(tab.value === 'tab2'){
          data = grdMain02_01.value.getDataProvider().getJsonRow(val);
        }
        console.log("chekedRow data", data)
      }



    vm.$swal({ 
    title: t('저장하시겠습니까?'), 
    showCancelButton: true,
    }).then(
      (swalRes) => {
      if (swalRes.isConfirmed === true) {
        SaveCoupon()}
      })
      
   
  }
  else if (btn.id === "btnDelete"){

    if (tab.value === "tab1"){
      // 24.06.03 문령훈 책임님 통화로 삭제기능은 임시 보류  
      Message.warn(t('포상 삭제는 디지털혁신기획부 한민규 매니저(hminq@hd.com)에게 요청 바랍니다.'))
    }

    else if (tab.value === "tab2"){
      Message.warn(t('포상 삭제는 디지털혁신기획부 한민규 매니저(hminq@hd.com)에게 요청 바랍니다. '))

    }
  }
  else if(btn.id === 'btnSampleDown'){
    let params = {
      FILE_PATH: 'EDUD',
      FILE_NAME: 'coupon_sample.xlsx',  
    }
    commonSampleDownFilesApi(params)
  }
  else if (btn.id === 'btnExcelUpload'){

    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]
      console.log('selectedFile',selectedFile)
      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
    }

}


// 24.06.03 문령훈 책임님 통화로 삭제기능은 임시 보류  


const deleteData = () =>{

  let delParams = []
  let checkedRows = grdMain01_01.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    
    let data = grdMain01_01.value.getDataProvider().getJsonRow(rowIdx)
    delParams.push(data)
  }
  
  console.log("checkedRows: ", checkedRows)
  console.log("delParams: ", delParams)

  // commonExecuteApi({ 
  //   queryId : 'EDUDC0020_TAB01_DELETE_01', 
  //   list: delParams 
  // }).then(res => {
  //   for (let i of res.list) {
  //     if (i.RES_COD == '-100'){Message.warn(t(i.RES_MSG))}
  //     else {Message.success(t("삭제되었습니다."))}
  //   }
  // })

}

const batch_input = () => {

  if (tab.value === "tab1"){
    
    let checkedRows = grdMain01_01.value.getGridView().getCheckedRows(true)

    for (let rowIdx of checkedRows) {
      if (batchParams01_01.chk_01 = "Y"){
        grdMain01_01.value.getDataProvider().setValue(rowIdx, 6, batchParams01_01.PLACE)
      }
      if (batchParams01_01.chk_02 = "Y"){
        grdMain01_01.value.getDataProvider().setValue(rowIdx, 7, batchParams01_01.MAIN_ACTIVITY)
      }
    }}
  else if (tab.value === "tab2"){
    
    let checkedRows = grdMain02_01.value.getGridView().getCheckedRows(true)

    for (let rowIdx of checkedRows) {
      if (batchParams02_01.chk_01 = "Y"){
        grdMain02_01.value.getDataProvider().setValue(rowIdx, 6, batchParams02_01.PLACE)
      }
      if (batchParams02_01.chk_02 = "Y"){
        grdMain02_01.value.getDataProvider().setValue(rowIdx, 7, batchParams02_01.MAIN_ACTIVITY)
      }
    }}
}



const onEmpSelected_create = val => {

let OUT_YN = ''
if ( val.USER_DIV === 'A' ){ OUT_YN = 'N' }
else{ OUT_YN = 'Y' }


if ((tab.value === "tab1") &&( val.EMP_NO === userStore.empNo)){
  Message.warn(t('본인은 선택할 수 없습니다.'));
  return
}


console.log("onEmpSelected_create:", val)
if (tab.value === "tab1"){
    addData01(val.CMPNY_DIV, val.BSNS_CD, val.EMP_NM, val.EMP_NO, val.HND_PHN, val.ASGN_NM, OUT_YN, val.USER_DIV, val.DEPT_CD, val.ASGN_CD)
}
else if(tab.value === "tab2"){
    addData02(val.CMPNY_DIV, val.BSNS_CD, val.EMP_NM, val.EMP_NO, val.HND_PHN, val.ASGN_NM, OUT_YN, val.USER_DIV, val.DEPT_CD, val.ASGN_CD)
}


}


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ TAB1 함수■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■



const SaveCoupon = async () => {

  if (userStore.cmpnyDiv !== 'HHI' && userStore.cmpnyDiv !== '300') {
    Message.warn(t('HD현대중공업만 칭찬쿠폰 부여가 가능합니다.'));
    bCheck = false;
    return false;
  }


  let chekedRow = ref([]);
  let bCheck = true;

 
  if(tab.value === 'tab1'){
    chekedRow = grdMain01_01.value.getGridView().getCheckedRows(); 
  } else if(tab.value === 'tab2'){
    chekedRow = grdMain02_01.value.getGridView().getCheckedRows();
  }



  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'));
    bCheck = false;
    return false;
  }


  if(tab.value === 'tab1'){
    if(chekedRow.length > Number(searchParams01_01.CPN_COUNT.split('/')[2])){
      Message.err(t('잔여 쿠폰 매수가 부족합니다.'));
      bCheck = false;
      return false;
    }
  } 
  else if(tab.value === 'tab2'){
    if(chekedRow.length > Number(searchParams02_01.CPN_COUNT.split('/')[2])){
      Message.err(t('잔여 쿠폰 매수가 부족합니다'));
      bCheck = false;
      return false;
    }
  }

  if (!bCheck) {
    return;
  }

  saveParams_01.value = [];
  saveParams_02.value = [];


// tasks1 처리 : 불량한 건 있는지 체크
for (const val of chekedRow) {

    let data = ref({});
    if(tab.value === 'tab1'){
      data = grdMain01_01.value.getDataProvider().getJsonRow(val);     
    } else if(tab.value === 'tab2'){
      data = grdMain02_01.value.getDataProvider().getJsonRow(val);
    }
    console.log('<1>')
    if(data.PLACE ==='' || data.AWD_CD ===''){
      Message.err(t('장소 및 주요활동은 필수입니다.'));
      bCheck = false;
      break;
    }
    console.log('<2>')
    if (data.SAVE_YN  ==='Y') {
      Message.err(t('이미 지급된 건이 선택되었습니다.'));
      bCheck = false;
      break;
    }
    console.log('<3>')
    const res = await commonSearchApi({
      queryId: "EDUDC0020_GET_PAYMENT_INFO_PC", 
      param: { CMPNY_DIV: data.CMPNY_DIV, EMP_NO: data.AWD_EMP_NO, ACCUMULATED_CONTENT_CD: '60', POINT: '2000' }
    });
    console.log('<4>')
    if (res.ORESULT_CUR[0].STOP_YN === 'Y'){
      Message.err(t(`${data.AWD_EMP_NAME}님은 지급 중단대상입니다. \n 사유: ${res.ORESULT_CUR[0].STOP_REASON}`))
      bCheck = false;
      break;
    } 
    console.log('<5>')
    if (res.ORESULT_CUR[0].EARNABLE_POINT === 0){
      Message.err(t(`${data.AWD_EMP_NAME}님은 이번 달 안전칭찬쿠폰 최대포인트(999,999)를 획득 하셨습니다.`))

      bCheck = false;
      break;
    }
  }


  /////////////////////////////////
  if (!bCheck) {
    return;
  }
 //////////////////////////////////



// tasks2 처리 : 적립
  for (const val of chekedRow) {
    let data = ref({});
    
    if(tab.value === 'tab1'){
      data = grdMain01_01.value.getDataProvider().getJsonRow(val);
      data.IDV_DPT_DIV = 'I';
      data.YEAR = dayjs(data.AWD_DT).format('YYYY-MM-DD').split('-')[0];
      data.MNTH = dayjs(data.AWD_DT).format('YYYY-MM-DD').split('-')[1];
      data.ACCUMULATED_CONTENT_DETAIL = '안전칭찬쿠폰(개인지급)';
    } else if(tab.value === 'tab2'){
      data = grdMain02_01.value.getDataProvider().getJsonRow(val);
      data.IDV_DPT_DIV = 'D';
      data.BSNS_CD_ISUR = searchParams02_01.ARY_BSNS_DEPT_CD.split(',')[0];
      data.DEPT_CD_ISUR = searchParams02_01.ARY_BSNS_DEPT_CD.split(',')[1];
      data.YEAR = dayjs(data.AWD_DT).format('YYYY-MM-DD').split('-')[0];
      data.MNTH = dayjs(data.AWD_DT).format('YYYY-MM-DD').split('-')[1];
      data.ACCUMULATED_CONTENT_DETAIL = '안전칭찬쿠폰(부서지급)';
    }

    if(data.PLACE ==='' || data.AWD_CD ===''){
      Message.warn(t('장소 및 주요활동은 필수입니다.'));
      bCheck = false;
      return;
    }
    // data.COMPANY = data.CMPNY_DIV;
    data.USER_ID = userStore.userId;
    data.IN_ADMIN_YN = '';

    data.AWD_DT = dayjs(data.AWD_DT).format('YYYYMMDD');
    data.AWD_CNT = '1';

    let awd_point = 0;


    // 안전페이 적립
    try {
   
      const res = await commonSearchApi({
        queryId: "EDUDC0020_GET_PAYMENT_INFO_PC", 
        param: { CMPNY_DIV: data.CMPNY_DIV, EMP_NO: data.AWD_EMP_NO, ACCUMULATED_CONTENT_CD: '60', POINT: '2000' }
      });

      awd_point = res.ORESULT_CUR[0].EARNABLE_POINT;
      console.log("awd_point:", awd_point);

      const HDPAY_param = {
        CMPNY_DIV: data.CMPNY_DIV,
        YEAR: data.YEAR,
        MNTH: data.MNTH,
        EMP_NO: data.AWD_EMP_NO,
        POINT_SEQ: '0',
        BSNS_CD: data.BSNS_CD,
        DEPT_CD: data.AWD_DEPT_CD,
        ASGN_CD: data.AWD_ASGN_CD,
        ASGN_NAME: data.AWD_ASGN_NAME,
        EMP_NAME: data.AWD_EMP_NAME,
        ORGN_DIV: data.GIFT_KIND,
        ACCUMULATED_CONTENT_KEY: '',
        ACCUMULATED_CONTENT_CD: '60',
        ACCUMULATED_CONTENT_DETAIL: data.ACCUMULATED_CONTENT_DETAIL,
        ACCUMULATED_DATE: '',
        ACCUMULATED_POINT: awd_point,
        CHANGE_POINT: '',
        CHANGE_DATE: '',
        CHANGE_USER_IP: '',
        REMAINING_POINT: '',
        CLOSE_DATE: '',
        REMARK: '',
        INSERT_USER_ID: data.ISUR_EMP_NO,
        INSERT_DATE: ''
      };
      
      await commonSearchApi({ queryId: "EDUDC0020_ADD_HDPAY", param: HDPAY_param });
      

    } catch (error) {
      console.error("Error processing data:", error);
      bCheck = false;
      return;
    }

    // 칭찬쿠폰 부여
    if(tab.value === 'tab1'){
      await commonExecuteApi({ queryId : "EDUDC0020_TAB01_SAVE_01", list: [data] })
      grdMain01_01.value.getDataProvider().setRowState(val, "saved", false);
      onButtonsClick({ id: 'btnSearch' })
      Get_CpnStatus('tab1')


    } else if(tab.value === 'tab2'){
      grdMain02_01.value.getDataProvider().setRowState(val, "saved", false);
      await commonExecuteApi({ queryId : "EDUDC0020_TAB01_SAVE_01", list: [data] })
      onButtonsClick({ id: 'btnSearch' })
      Get_CpnStatus('tab2')
    }
    

    smsParam.EMPNO_FROM = data.ISUR_EMP_NO
    smsParam.EMPNO_TO = data.AWD_EMP_NO 
    smsParam.FROM_P_NO = userStore.hndPhn // 부여자 
    smsParam.TO_P_NO = data.HND_PHN       // 수령자
    smsParam.TITLE = data.RECOMMENDER ?
    (data.AWD_EMP_NAME +"님의 안전활동에 감사드립니다."  + "\r" 
          + "·발급인: " + data.ISUR_NAME + "\r" 
          + ".추천인: " + data.RECOMMENDER + "\r" 
          + "·지급포인트: 2,000P \r"
          + "·HD안전페이 포인트 지급\r"
          + "감사합니다." )
    :(data.AWD_EMP_NAME +"님의 안전활동에 감사드립니다."  + "\r" 
          + "·발급인: " + data.ISUR_NAME + "\r" 
          + "·지급포인트: 2,000P \r"
          + "·HD안전페이 포인트 지급\r"
          + "감사합니다." )



    console.log("smsParam: ", smsParam)

    // 번호 도용 문자 차단 서비스 발행된 사람 목록
    if (smsParam.EMPNO_FROM === 'A504742'){
      smsParam.FROM_P_NO = '052-202-4149'
    }
    if (smsParam.EMPNO_FROM === '7809800'){
      smsParam.FROM_P_NO = '052-203-0359'
    }





    if (smsParam.FROM_P_NO != '' && smsParam.TO_P_NO != ''){
    try {
      await commonSendSMS(smsParam) //문자전송
      }catch (error) {
        console.error("문자발생에러:", error)
        return
      }
    }
    else{
      Message.err(t(`문자 발송에 실패하였습니다.`))
      return bCheck
    }


  }


};











// 행 추가
const addData01 = ( CMPNY_DIV , BSNS_CD, EMP_NM, EMP_NO, HND_PHN, ASGN_NM, OUT_YN, USER_DIV, DEPT_CD, ASGN_CD ) => {
  grdMain01_01.value.addRow({
    CMPNY_DIV: userStore.cmpnyDiv, // 발급자 회사코드
    COMPANY:  CMPNY_DIV, // 수상자 회사코드 
    BSNS_CD: BSNS_CD,
    AWD_DT: dayjs().format('YYYY-MM-DD'), 
    AWD_EMP_NAME: EMP_NM,
    AWD_EMP_NO: EMP_NO,
    HND_PHN: HND_PHN,
    AWD_ASGN_NAME: ASGN_NM,
    AWD_LOC: '',
    AWD_CD: '',
    AWD_DTL: '',
    GIFT_KIND: USER_DIV,
    ISUR_NAME: userStore.userName,
    ISUR_ASGN_NM: userStore.asgnNm,
    AWD_SEQ: '',
    AWD_CNT: '',
    AWD_DEPT_CD: DEPT_CD,
    AWD_ASGN_CD: ASGN_CD,
    OUT_YN: OUT_YN,
    ISUR_ASGN_CD: userStore.asgnCd,
    ISUR_EMP_NO:  userStore.empNo,
    BSNS_CD_ISUR: userStore.bsnsCd,
    DEPT_CD_ISUR: userStore.deptCd,
  })  
}


// 인원검색 팝업
const openPopup = gbn => {
  if(gbn === '인원조회'){
    empPopup.value.openPopup({ EMP_NM: searchParams01_01.ISUR_EMP_NM });
  }
  else if(gbn === '인원조회_일괄'){
    empPopup_batch.value.openPopup({ EMP_NM: batchParams01_01.ISUR_EMP_NM });
  }
  else if(gbn === '포상자추가'){
    empPopup_create.value.openPopup({ IS_EDUDC020: true, USER_DIV: 'A'})
  }


}

//  인원조회 선택 이벤트
const onEmpSelected = val => {
  console.log("onEmpSelected: ", val)
  searchParams01_01.ISUR_EMP_NM = val.EMP_NM
  searchParams01_01.ISUR_EMP_NO = val.EMP_NO
  searchParams01_01.ISUR_EMP_ASGN_NM = val.ASGN_SHRT_NM
  searchParams01_01.BSNS_CD_ISUR = val.BSNS_CD
  searchParams01_01.DEPT_CD_ISUR = val.DEPT_CD
  searchParams01_01.ASGN_CD_ISUR = val.ASGN_CD


  Get_CpnStatus('tab1')

}


const Get_CpnStatus = (val) => {


  if (val === "tab1"){
    const paramsCopy = {}
    paramsCopy.CMPNY_DIV = searchParams01_01.CMPNY_DIV
    paramsCopy.YEAR = searchParams01_01.YYYYMM.split('-')[0]
    paramsCopy.MNTH = searchParams01_01.YYYYMM.split('-')[1]    
    paramsCopy.ISUR_EMP_NO = searchParams01_01.ISUR_EMP_NO

    console.log("Get_CpnStatus tab1 paramsCopy: ", paramsCopy)

    commonSearchApi({ queryId: "EDUDC0020_TAB01_SEARCH_02" , param: paramsCopy })
    .then((res) => 
      {   console.log("res.ORESULT_CUR[0]: ", res.ORESULT_CUR[0])
      searchParams01_01.CPN_COUNT = res.ORESULT_CUR[0].CPN_STATUS })
  }

  else if ( val === "tab2"){

    const paramsCopy = {}
    paramsCopy.CMPNY_DIV = searchParams02_01.CMPNY_DIV
    paramsCopy.YEAR = searchParams02_01.YYYYMM.split('-')[0]
    paramsCopy.MNTH = searchParams02_01.YYYYMM.split('-')[1]   
    paramsCopy.BSNS_CD_ISUR = searchParams02_01.ARY_BSNS_DEPT_CD.split(',')[0]
    paramsCopy.DEPT_CD_ISUR = searchParams02_01.ARY_BSNS_DEPT_CD.split(',')[1]

    console.log("Get_CpnStatus tab2 paramsCopy: ", paramsCopy)

    commonSearchApi({ queryId: "EDUDC0020_TAB02_SEARCH_02" , param: paramsCopy })
    .then((res) => 
      {   console.log("res.ORESULT_CUR[0]: ", res.ORESULT_CUR[0])
      searchParams02_01.CPN_COUNT = res.ORESULT_CUR[0].CPN_STATUS })

  }

}



// const onEmpSelected_batch = val => {

//   batchParams01_01.ISUR_EMP_NM = val.EMP_NM
//   batchParams01_01.ISUR_EMP_NO = val.EMP_NO
//   batchParams01_01.ISUR_EMP_ASGN_NM = val.ASGN_SHRT_NM
//   batchParams01_01.BSNS_CD_ISUR = val.BSNS_CD
//   batchParams01_01.DEPT_CD_ISUR = val.DEPT_CD
//   batchParams01_01.ASGN_CD_ISUR = val.ASGN_CD
// }





const searchData01_01 = () => {
  Get_CpnStatus('tab1')
  const paramsCopy = {}

  paramsCopy.CMPNY_DIV = searchParams01_01.CMPNY_DIV
  paramsCopy.YEAR = searchParams01_01.YYYYMM.split('-')[0]
  paramsCopy.MNTH = searchParams01_01.YYYYMM.split('-')[1]    
  paramsCopy.ISUR_EMP_NO = searchParams01_01.ISUR_EMP_NO
  paramsCopy.IDV_DPT_DIV = searchParams01_01.IDV_DPT_DIV

  console.log("searchParams01_01(paramsCopy):", paramsCopy )

  return commonSearchApi({ queryId: "EDUDC0020_TAB01_SEARCH_01" , param: paramsCopy })
}


const afterSearch01_01 = res => {

  console.log("afterSearch01_01:", res.ORESULT_CUR )
  grdMain01_01.value.getDataProvider().setRows(res.ORESULT_CUR)

  // let count = grdMain01_01.value.getGridView().getItemCount()
  //   for (let i = 0; i < count; i++) {
  // grdMain01_01.value.getDataProvider().setValue(i, 'COMPLETE_YN', 'Y')}


}



// 널 체크 이  벤트
const isNullCheck = data => {
  return (data === undefined || data === null || data === '') ? true : false
}

const excelUploadCallback = excelData => {
  var mappedData = excelData.map(item => {  
    return { 
      COMPANY : item.수상자회사코드,     
      EMP_NO: item.수상자사번,
      AWD_LOC: item.장소,
      AWD_CD: item.주요활동코드,
      AWD_DTL: item.활동상세내역,
    }
  })

  console.log("excelUploadCallback mapped Data:", mappedData)

  for(let i = 0; i < mappedData.length; i++){
    let rowinfo = {}
    
    commonSearchApi({ queryId: "EDUDC0020_TAB01_SEARCH_03" , param: {CMPNY_DIV: mappedData[i].COMPANY, EMP_NO : mappedData[i].EMP_NO}}).then(res=>{

      if ( res.ORESULT_CUR[0].USER_DIV = 'A' ){  rowinfo.OUT_YN = 'Y' }
      else{  rowinfo.OUT_YN = 'N' }
      
      rowinfo.CMPNY_DIV = userStore.cmpnyDiv       // 발급자 회사 
      rowinfo.COMPANY =  mappedData[i].COMPANY    // 수상자 회사
      rowinfo.BSNS_CD =  res.ORESULT_CUR[0].BSNS_CD
      rowinfo.AWD_DT = dayjs().format('YYYY-MM-DD')
      rowinfo.AWD_EMP_NAME= res.ORESULT_CUR[0].EMP_NM
      rowinfo.AWD_EMP_NO= res.ORESULT_CUR[0].EMP_NO
      rowinfo.HND_PHN= res.ORESULT_CUR[0].HND_PHN
      rowinfo.AWD_ASGN_NAME= res.ORESULT_CUR[0].ASGN_FULL_NM
      rowinfo.AWD_LOC= mappedData[i].AWD_LOC
      rowinfo.AWD_CD= mappedData[i].AWD_CD
      rowinfo.AWD_DTL= mappedData[i].AWD_DTL
      rowinfo.GIFT_KIND= res.ORESULT_CUR[0].USER_DIV
      rowinfo.ISUR_NAME= userStore.userName
      rowinfo.ISUR_ASGN_NM= userStore.asgnNm
      rowinfo.AWD_SEQ= ''
      rowinfo.AWD_CNT= ''
      rowinfo.AWD_DEPT_CD=  res.ORESULT_CUR[0].DEPT_CD
      rowinfo.AWD_ASGN_CD=  res.ORESULT_CUR[0].ASGN_CD
      rowinfo.ISUR_ASGN_CD= userStore.asgnCd
      rowinfo.ISUR_EMP_NO=  userStore.empNo
      rowinfo.BSNS_CD_ISUR= userStore.bsnsCd
      rowinfo.DEPT_CD_ISUR= userStore.deptCd

      console.log("rowinfo: ", rowinfo)
      if (tab.value === "tab1"){
        grdMain01_01.value.addRow(rowinfo)

      }
      else{
        grdMain02_01.value.addRow(rowinfo)

      }

    })

   
  }

}


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ TAB2 함수■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

const searchData02_01 = () => {
  Get_CpnStatus('tab2')
  const paramsCopy = {}
  paramsCopy.CMPNY_DIV = searchParams02_01.CMPNY_DIV

  paramsCopy.YEAR = searchParams02_01.YYYYMM.split('-')[0]
  paramsCopy.MNTH = searchParams02_01.YYYYMM.split('-')[1]    

  paramsCopy.BSNS_CD_ISUR = searchParams02_01.ARY_BSNS_DEPT_CD.split(',')[0]
  paramsCopy.DEPT_CD_ISUR = searchParams02_01.ARY_BSNS_DEPT_CD.split(',')[1]

  console.log("searchData02_01(paramsCopy):", paramsCopy )

  return commonSearchApi({ queryId: "EDUDC0020_TAB02_SEARCH_03" , param: paramsCopy })
}


const afterSearch02_01 = (res) => {
  console.log("afterSearch02_01(res.ORESULT_CUR):", res.ORESULT_CUR )
  grdMain02_01.value.getDataProvider().setRows(res.ORESULT_CUR)
}


// 행 추가
const addData02 = ( CMPNY_DIV , BSNS_CD, EMP_NM, EMP_NO, HND_PHN, ASGN_NM, OUT_YN, USER_DIV, DEPT_CD, ASGN_CD ) => {
  grdMain02_01.value.addRow({
    CMPNY_DIV: userStore.cmpnyDiv, // 발급자 회사코드
    COMPANY:  CMPNY_DIV, // 수상자 회사코드 
    BSNS_CD: BSNS_CD,
    AWD_DT: dayjs().format('YYYY-MM-DD'), 
    AWD_EMP_NAME: EMP_NM,
    AWD_EMP_NO: EMP_NO,
    HND_PHN: HND_PHN,
    AWD_ASGN_NAME: ASGN_NM,
    AWD_LOC: '',
    AWD_CD: '',
    AWD_DTL: '',
    GIFT_KIND: USER_DIV,
    ISUR_NAME: userStore.userName,
    ISUR_ASGN_NM: userStore.asgnNm,
    AWD_SEQ: '',
    AWD_CNT: '',
    AWD_DEPT_CD: DEPT_CD,
    AWD_ASGN_CD: ASGN_CD,
    OUT_YN: OUT_YN,
    ISUR_ASGN_CD: userStore.asgnCd,
    ISUR_EMP_NO:  userStore.empNo,
    BSNS_CD_ISUR: userStore.bsnsCd,
    DEPT_CD_ISUR: userStore.deptCd,
  })  
}

const saveData02_01 = () => {
  console.log("saveParams_02:", saveParams_02)

  return commonExecuteApi({ queryId : "EDUDC0020_TAB02_SAVE_01", list: saveParams_02.value })
}



watch(() => searchParams02_01.ARY_BSNS_DEPT_CD, (newValue, oldValue) => {
  Get_CpnStatus('tab2')

})



//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■



watch(() => tab.value , (newValue, oldValue) => {
  onButtonsClick({ id: 'btnSearch' })

})



onMounted(() =>{
  
  Get_CpnStatus('tab1')
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })

})


// 부서 탭 렌더링: 부서장(GRP00387),  운영과장(GRP00388), 직책과장(GRP00389), 포상모듈 담당자(GRP00378), admin (HIWAYGRP00001) 
const IsDeptShow = userStore.authGrpCd.includes('GRP00389') || userStore.authGrpCd.includes('GRP00388') || userStore.authGrpCd.includes('GRP00387') || userStore.authGrpCd.includes('GRP00378') || userStore.authGrpCd.includes('HIWAYGRP00001')


</script>



<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-2 py-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete','btnSampleDown', 'btnExcelUpload']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="mb-2">
        <v-tabs v-model="tab">
          <v-tab value="tab1"> 개인 </v-tab> 
          <v-tab value="tab2" v-if = "IsDeptShow" > 부서 </v-tab> 
        </v-tabs>
      </v-sheet>
    </v-card-title>

    

    <v-card-text v-show="tab == 'tab1'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              v-model="searchParams01_01.CMPNY_DIV"
              :label="$t('회사구분')"
              width="200px"
              :items="codeList1.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-input
            v-model="searchParams01_01.YYYYMM"
            :label="$t('포상년월')"
            width="200px"
            type="month"
            readonly
            />

            <!-- 관리자 레벨만 선택 가능 -->
            <i-input
              v-model="searchParams01_01.ISUR_EMP_NM" 
             :label="$t('발급인')" 
              width="200px"
              margin="10px"
              append-inner-icon="mdi-magnify" 
              readonly
            />
            <i-input
              v-model="searchParams01_01.ISUR_EMP_NO" 
              width="100px"
              margin="10px"
              readonly
            />
            <i-input
              v-model="searchParams01_01.CPN_COUNT" 
              :label="$t('쿠폰매수(확보/지급/잔여)')" 
              width="300px"
              margin="10px"
              readonly
            />
          </div>
        </v-sheet>
          <div style="
              padding-bottom: 9px;
          " >포상 일괄입력 조건</div> 
          <div class="d-flex mb-2">
            <v-checkbox 
                class="mt-1 mr-2"
                label="장소"
                v-model="batchParams01_01.chk_01"
                false-value="N"
                true-value="Y"
              />
            <i-input
              v-model="batchParams01_01.PLACE" 
              width="200px"
            />
            <div style="margin-left: 20px;"></div>
            <v-checkbox 
              class="mt-1 mr-2"
              label="주요활동"
              v-model="batchParams01_01.chk_02"
              false-value="N"
              true-value="Y"
            />
            <i-select
              v-model="batchParams01_01.MAIN_ACTIVITY" 
              :items="codeList1.main_activity"
              item-value="COD"
              item-title="TXT"
              width="200px"
              margin="10px"
              />
            <div style="margin-left: 20px;"></div>
          
            <i-input
              v-model="batchParams01_01.ISUR_EMP_NO" 
              width="100px"
              margin="10px"
              readonly
            />
            <div style="margin-left: 40px;">

            </div>
            <VBtn
             @click = "batch_input"
                 >
                 일괄입력
            </VBtn>
          </div>

        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <div class="h-grow">
          <!--개인 실적 -->
          <v-sheet width="100%" >
            <!-- 그리드1 search area-->
            <RealGrid
              ref="grdMain01_01"
              class="mt-2"
              style="height: 600px"
              :grid-view-option="grdProps01_01.gridViewOption"
              :keys="grdProps01_01.keys"
              :fields="grdProps01_01.fields"
              :columns="grdProps01_01.columns"
              :column-layout="grdProps01_01.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <v-card-text  v-if = "IsDeptShow"  v-show="tab == 'tab2'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('회사구분')"
              width="200px"
              v-model="searchParams02_01.CMPNY_DIV"
              :items="codeList2.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly/>

            <i-input
            v-model="searchParams02_01.YYYYMM"
            :label="$t('포상년월')"
            width="200px"
            type="month"
            readonly
            />
            <!-- <i-select
              width="180px"
              :label="$t('년도')"
              v-model="searchParams02_01.YEAR"
              type="YEAR"
            />

            <i-select
              v-model="searchParams02_01.MNTH"
              :label="$t('분기')"
              append-inner-icon="mdi-magnify"
              :items="QTCODE"
              item-title="TXT"
              item-value="COD"
              width="180px"
            /> -->
      
            <i-select
              :label="$t('발급부서')"
              width="500px"
              v-model="searchParams02_01.ARY_BSNS_DEPT_CD"
              :items="codeList2.target_dept_nm"
              item-title="TXT"
              item-value="COD"
              readonly
            />
            <i-input
              v-model="searchParams02_01.CPN_COUNT" 
              :label="$t('쿠폰매수(확보/지급/잔여)')" 
              width="300px"
              margin="10px"
              readonly
            />
          </div>
        </v-sheet>

        <div style="
              padding-bottom: 9px;
          " >포상 일괄입력 조건</div> 
          <div class="d-flex mb-2">
            <v-checkbox 
                class="mt-1 mr-2"
                label="장소"
                v-model="batchParams02_01.chk_01"
                false-value="N"
                true-value="Y"
              />
            <i-input
              v-model="batchParams02_01.PLACE" 
              width="200px"
            />
            <div style="margin-left: 20px;"></div>
            <v-checkbox 
              class="mt-1 mr-2"
              label="주요활동"
              v-model="batchParams02_01.chk_02"
              false-value="N"
              true-value="Y"
            />
            <i-select
              v-model="batchParams02_01.MAIN_ACTIVITY" 
              :items="codeList2.main_activity"
              item-value="COD"
              item-title="TXT"
              width="200px"
              margin="10px"
              />
            <div style="margin-left: 20px;"></div>
            <v-checkbox 
                class="mt-1 mr-2"
                label="발급인"
                v-model="batchParams02_01.chk_03"
                false-value="N"
                true-value="Y"
            />
            <i-input
              v-model="batchParams02_01.ISUR_EMP_NM" 
              width="200px"
              margin="10px"
              append-inner-icon="mdi-magnify" 
              @keydown.enter="e => {
                    openPopup('인원조회_일괄')
                  }"
              @click:appendInner="openPopup('인원조회_일괄')"
            />
            <i-input
              v-model="batchParams01_01.ISUR_EMP_NO" 
              width="100px"
              margin="10px"
              readonly
            />
            <div style="margin-left: 40px;">

            </div>
            <VBtn
             @click = "batch_input"
                 >
                 일괄입력
            </VBtn>
          </div>

        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <!--부서 실적 -->
        <!-- tab2 메인 영역 -->
        <div class="h-auto ">
          <v-sheet width="100%" class="pa-0 h-auto mr-2">
            <RealGrid
              ref="grdMain02_01"
              class="mt-2"
              style="height: 580px"
              :grid-view-option="grdProps02_01.gridViewOption"
              :keys="grdProps02_01.keys"
              :fields="grdProps02_01.fields"
              :columns="grdProps02_01.columns"
              :column-layout="grdProps02_01.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>





    
  </v-card>

  <EmpPopup 
      ref="empPopup" 
      @selected="onEmpSelected"
    />
  <EmpPopup 
    ref="empPopup_batch" 
    @selected="onEmpSelected_batch"
  />
  <EmpPopup 
    ref="empPopup_create" 
    @selected="onEmpSelected_create"
  />

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
    // min-height: 700px;
  }
}
</style>







