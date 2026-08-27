<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import { commonEncrypt, commonDecrypt } from "@hiway/api/commonApi"
import dayjs from "dayjs"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonGetEarnYN,
} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from "@hiway/utils/notify"
import axios from 'axios'




defineOptions({
  name: "60_edu-EDU_D-EDUDC0040",
})


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const gridTitle = ref(null)

const grdMain01_01 = ref(null)
const grdMain01_02 = ref(null)
const grdMain02 = ref(null)
const grdMain03_01 = ref(null)
const grdMain03_02 = ref(null)


let showMessageYN = true
const plainText = ref('')

const plainText_name = ref('')
const plainText_phone = ref('')



const searchParams01 = reactive({ 
    CMPNY_DIV: userStore.cmpnyDiv,
    YYYYMM : dayjs(new Date()).format('YYYY-MM')
  })



const searchParams02 = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv, 
  START_DATE: dayjs(new Date()).subtract(1, 'month').format('YYYY-MM-DD'), // 한달 전          
  END_DATE: dayjs(new Date()).format('YYYY-MM-DD'), // 오늘
  PRNT_YM:dayjs(new Date()).format('YYYY-MM') 

})

const searchParams03 = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv, 
  BSNS_CD : '',  //사업부 코드
  DEPT_CD : '',  //부서 코드
  ASGN_CD : '',  //협력사 코드
  DATE_FR : dayjs(new Date()).subtract(1, 'month').format('YYYY-MM-DD'), // 한달 전       
  DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'),  // 오늘
})


const tab = ref('tab1')
const codeList1 = reactive({
  cmpnyDiv : [], // 회사구분
})
const codeList2 = reactive({
  cmpnyDiv : [], // 회사구분
})
const codeList3 = reactive({
  cmpnyDiv : [], // 회사구분
  asgnCd : [],
})



//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIZ000'), // 회사구분
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
  ]).then(res => {
    //console.log("레스 확인",res)

    // 회사구분
    codeList1.cmpnyDiv = res[0].ORESULT_CUR
    codeList2.cmpnyDiv = res[0].ORESULT_CUR
    codeList3.cmpnyDiv = res[0].ORESULT_CUR
   
    // 사업부 설정 - 전체 검색은 없앰.
    codeList3.bsnsCd = res[1].ORESULT_CUR
    codeList3.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    searchParams03.BSNS_CD = codeList3.bsnsCd[0].BSNS_CD

    // 부서 설정 - 전체 검색은 없앰.
    codeList3.deptCd = res[2].ORESULT_CUR
    codeList3.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    searchParams03.DEPT_CD = codeList3.deptCd[0].DEPT_CD

    codeList3.asgnCd.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
    searchParams03.ASGN_CD = codeList3.asgnCd[0].ASGN_CD

  }).finally(() => {
    // 그리드 세팅
    // TAB01

    // TAB02

    // TAB03
  
  })
}

//<TAB1> 그리드 1_1 속성셋팅 
const grdProps01_01 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' },  stateBar: { visible: false } ,footer: {visible: true} },
  keys: [],
  fields: [
    {
      fieldName: "BSNS_NM",
      header: { text: t("사업부") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "DEPT_NM",
      header: { text: t("부서") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    { 
      fieldName: 'CPN_RCV_NAME', 
      header: { text: t("성명") },
      dataType: 'text' , 
      styleName: 'left-column',
      editable: false,
      footer: { styleName: 'right-column', text: '소계 : ' },
    },
    {
      fieldName: "CPN_REG_CNT",
      header: { text: t("배부 매수") },
      styleName: "right-column",
      dataType: "number",
      width: '70',
      editable: false,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    
    {
      fieldName: "AWD_CNT",
      header: { text: t("지급 매수") },
      styleName: "right-column",
      dataType: "number",
      width: '70',
      editable: false,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    
    {
      fieldName: "CPN_RES_CNT",
      header: { text: t("미사용 매수") },
      styleName: "right_column",
      dataType: "number",
      width: '70',
      editable: false,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },

    { fieldName: 'CMPNY_DIV',   dataType: 'text' , visible: false },

    

  ],
  columns: [],

})
grdProps01_01.columns = grdProps01_01.fields

//<TAB1> 그리드 1_2 속성셋팅
const grdProps01_02 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' },  stateBar: { visible: false } ,footer: {visible: true} },
  keys: [],
  fields: [
    {
      fieldName: "BSNS_NM",
      header: { text: t("사업부") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "DEPT_NM",
      header: { text: t("부서") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
      footer: { styleName: 'right-column', text: '소계 : ' },
    },


    {
      fieldName: "CPN_REG_CNT",
      header: { text: t("배부 매수") },
      styleName: "column-right",
      dataType: "number",
      width: '70',
      editable: true,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    
    {
      fieldName: "AWD_CNT",
      header: { text: t("지급 매수") },
      styleName: "column-right",
      dataType: "number",
      width: '70',
      editable: true,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    
    {
      fieldName: "CPN_RES_CNT",
      header: { text: t("미사용 매수") },
      styleName: "column-right",
      dataType: "number",
      width: '70',
      editable: true,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    

    //  안보임
    { fieldName: 'BSNS_CD',   dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD',   dataType: 'text' , visible: false },
    { fieldName: 'CMPNY_DIV',   dataType: 'text' , visible: false },
  ],
  columns: [],

})
grdProps01_02.columns = grdProps01_02.fields

//<TAB2> 그리드 2 속성셋팅
const grdProps02 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' },  stateBar: { visible: false }, footer: { visible:true }  },
  keys: [],
  fields: [
    {
      fieldName: "USER_DIVNM",
      header: { text: t("소속구분") },
      width: '70',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "COMPANY_NM",
      header: { text: t("회사명") },
      width: '70',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_ASGN_NAME",
      header: { text: t("소속조직") },
      width: '70',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NAME",
      header: { text: t("이름") },
      width: '80',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NO",
      header: { text: t("사번") },
      width: '80',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "HLD_OFFI_GBNNM",
      header: { text: t("재직여부") },
      width: '80',
      dataType: "text",
      footer: { styleName: 'right-column', text: '소계 : ' },
      editable: false,
    },
    {
      fieldName: "AWD_POINT",
      header: { text: t("배정금액") },
      styleName: 'right-column',
      dataType: "number",
      numberFormat: "#,###", 
      footer: { numberFormat: "#,###",expression: "sum" },
      editable: false,
    },
    {
      fieldName: "AWD_POINT_CNT",
      header: { text: t("배정 매수") },
      styleName: 'right-column',
      dataType: "number",
      numberFormat: "#,###", 
      footer: { numberFormat: "#,###",expression: "sum" },
      editable: false,
    },

    {
      fieldName: "AWD_DT",
      header: { text: t("발급일자") },
      width: '80',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "REMARK",
      header: { text: t("비고") },
      width: '200',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },






    //  안보임
    { fieldName: 'YEAR', dataType: 'text' , visible: false },
    { fieldName: 'MNTH', dataType: 'text' , visible: false },
    { fieldName: 'IDV_DPT_DIV', dataType: 'text' , visible: false },
    { fieldName: 'AWD_SEQ', dataType: 'number' , visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'number' , visible: false },
    { fieldName: "POINT_CODE", dataType: "text", visible: false },
    { fieldName: "AWD_MEMO", dataType: "text", visible: false },
    { fieldName: "GIFT_KIND", dataType: "text", visible: false },


  ],
  columns: [],

})
grdProps02.columns = grdProps02.fields

//<TAB3> 그리드 3_1 속성셋팅
const grdProps03_01 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' },  stateBar: { visible: false }  ,footer: {visible: true}},
  keys: [],
  fields: [
    {
      fieldName: "BSNS_NM",
      header: { text: t("사업부") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "DEPT_NM",
      header: { text: t("부서") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "COMP_NM",
      header: { text: t("협력사명") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },

    {
      fieldName: "REG_NO",
      header: { text: t("사업자번호") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },

    {
      fieldName: "OWNER_NM",
      header: { text: t("대표자") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },


    {
      fieldName: "TERM_YN",
      header: { text: t("계약종료") },
      width: '60',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
      footer: { styleName: 'right-column', text: '소계 : ' },
    },
    
    

    {
      fieldName: "AWD_CNT",
      header: { text: t("지급 인원") },
      styleName: "column-right",
      dataType: "number",
      width: '70',
      editable: true,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    

    {
      fieldName: "TOT_COST",
      header: { text: t("금액") },
      styleName: "column-right",
      dataType: "number",
      width: '70',
      editable: true,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
    


    //  안보임

    { fieldName: 'COMP_CD',   dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD',   dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD',   dataType: 'text' , visible: false },
    { fieldName: 'CMPNY_DIV',   dataType: 'text' , visible: false },
  ],
  columns: [],

})
grdProps03_01.columns = grdProps03_01.fields

//<TAB3> 그리드 3_2 속성셋팅
const grdProps03_02 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' },  stateBar: { visible: false }  ,footer: {visible: true}},
  keys: [],
  fields: [
    {
      fieldName: "AWD_DT",
      header: { text: t("지급일자") },
      width: '50',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NAME",
      header: { text: t("성명") },
      width: '30',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "AWD_EMP_NO",
      header: { text: t("사번") },
      width: '30',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ISUR_NAME",
      header: { text: t("성명") },
      width: '30',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ISUR_EMP_NO",
      header: { text: t("사번") },
      width: '30',
      styleName: 'left-column',
      dataType: "text",
      editable: false,
      footer: { styleName: 'right-column', text: '소계 : ' },
    },

    {
      fieldName: "TOT_COST",
      header: { text: t("금액") },
      styleName: "column-right",
      dataType: "number",
      width: '40',
      editable: true,
      numberFormat: "#,###",
      editor: {
        type: "line",
        inputCharacters: "0-9",
        maxLength: 10,
      },
      footer: { numberFormat: "#,###",expression: "sum" },
    },
  ],
  columns: [],
  columnLayout: [
    "AWD_DT",  
    {
      name: "수상자",
      direction: "horizontal",
      items: [
        'AWD_EMP_NAME', 'AWD_EMP_NO'
      ],
      header: {
        text: t("수상자"),
      },
    },
    {
      name: "수여자",
      direction: "horizontal",
      items: [
        'ISUR_NAME', 'ISUR_EMP_NO'
      ],
      header: {
        text: t("수여자"),
      },
    },
    "TOT_COST",  
  ],

})
grdProps03_02.columns = grdProps03_02.fields

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    if (tab.value === "tab1"){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain01_01])
        .setQuery(searchData01_01)
        .setAfter(afterSearch01_01)
        .showMessage(showMessageYN)
        .run()

      new queryFlowHelper(vm, t)
        .setGridList([grdMain01_02])
        .setQuery(searchData01_02)
        .setAfter(afterSearch01_02)
        .showMessage(showMessageYN)
        .run()
    }

  else if (tab.value === "tab2"){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain02])
        .setQuery(searchData02)
        .setAfter(afterSearch02)
        .showMessage(showMessageYN)
        .run()
    }


    else if (tab.value === "tab3"){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain03_01])
        .setQuery(searchData03)
        .setAfter(afterSearch03)
        .showMessage(showMessageYN)
        .run()
    }

  }

}



//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ TAB1 함수■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

const searchData01_01 = () => {
  // const paramsCopy = JSON.parse(JSON.stringify(searchParams01))
  const paramsCopy = {}
  paramsCopy.CMPNY_DIV = searchParams01.CMPNY_DIV
  paramsCopy.YEAR = searchParams01.YYYYMM.split('-')[0]
  paramsCopy.MNTH = searchParams01.YYYYMM.split('-')[1]    

  return commonSearchApi({ queryId: "EDUDC0040_TAB01_SEARCH_01" , param: paramsCopy })
}

const searchData01_02 = () => {
  const paramsCopy = {}
  paramsCopy.CMPNY_DIV = searchParams01.CMPNY_DIV
  paramsCopy.YEAR = searchParams01.YYYYMM.split('-')[0]
  paramsCopy.MNTH = searchParams01.YYYYMM.split('-')[1]    
  return commonSearchApi({ queryId: "EDUDC0040_TAB01_SEARCH_02" , param: paramsCopy })
}


const afterSearch01_01 = res => {
  grdMain01_01.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const afterSearch01_02 = res => {
  grdMain01_02.value.getDataProvider().setRows(res.ORESULT_CUR)
}



//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ TAB2 함수■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

const onButtonsClick02 = (btn) => {
  if (btn.id === "btnPrint") {

  }

}


const searchData02 = () => {
  const paramsCopy2 = {}
  paramsCopy2.CMPNY_DIV = searchParams02.CMPNY_DIV
  paramsCopy2.START_DATE = searchParams02.START_DATE.replace(/-/gi,"")
  paramsCopy2.END_DATE = searchParams02.END_DATE.replace(/-/gi,"")

  console.log("paramsCopy2: ", paramsCopy2)
  return commonSearchApi({ queryId: "EDUDC0040_TAB02_SEARCH_01" , param: paramsCopy2 })
}


const afterSearch02 = (res) => {
  console.log("afterSearch02: ", res.ORESULT_CUR)
  grdMain02.value.getDataProvider().setRows(res.ORESULT_CUR)
}




const API_test = () => {

  const param= {}
  param.plainText = plainText.value

  // commonEncrypt(plainText.value)
  //   .then(res => {
  //     console.log(res);
  //   })
    
  console.log("API TEST plainText.value: " , plainText.value )
  commonDecrypt(plainText.value)
    .then(res => {
      console.log(res);
      Message
    })
    

  // axios.get(
  //   "https://sandbox-biz-dapi.kakaopay.com/kaffeine-biz/v1/available-to-earn?phone_number=01029361595&name=한민규&birthdate=19990128",{
  //   headers: {
  //       'Authorization': 'PARTNER_KEY ',
  //       'Content-Type': 'application/json'
  //     }}).then((res)=>
  //   console.log(res)

  // )
 }

 const API_test2 = () => {

const param= {}
param.PhoneNumber = '01429361595'
param.BirthDate = '20201101'
param.Name = '한민규'

// commonEncrypt(plainText.value)
//   .then(res => {
//     console.log(res);
//   })
  
console.log("API TEST2 param: " , param )
commonGetEarnYN(param)
  .then(res => {
    console.log(res);
    Message.warn(t(res))
  })
  

// axios.get(
//   "https://sandbox-biz-dapi.kakaopay.com/kaffeine-biz/v1/available-to-earn?phone_number=01029361595&name=한민규&birthdate=19990128",{
//   headers: {
//       'Authorization': 'PARTNER_KEY ',
//       'Content-Type': 'application/json'
//     }}).then((res)=>
//   console.log(res)

// )
}

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ TAB3 함수■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//널 체크 이벤트
const isNullCheck = data => {
  return (data === undefined || data === null || data === '') ? true : false
}

// 사업부가 바뀌면 부서 데이터 가져옴 오고 협력사는 초기화
watch(() => searchParams03.BSNS_CD, (newValue, oldValue) => {
  searchParams03.DEPT_CD = ''

  // 직접 빈값 입력할수도 있음
  if(isNullCheck(newValue)){
    codeList3.deptCd = []
    codeList3.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
    codeList3.asgnCd = []
    codeList3.asgnCd.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList3.deptCd = res.ORESULT_CUR
      codeList3.deptCd.unshift({ DEPT_NM : '전체', DEPT_CD : '' })
      searchParams03.DEPT_CD = codeList3.deptCd[0].DEPT_CD
    }).finally(() => {
    })
    
})

// 부서 바뀌면 협력사 가져옴
watch(() => searchParams03.DEPT_CD, (newValue, oldValue) => {

  searchParams03.ASGN_CD = ''
  if(isNullCheck(newValue)){
    // 협력사 리셋
    searchParams03.ASGN_CD = ''
    codeList3.asgnCd = []
    codeList3.asgnCd.unshift({ ASGN_CD:'전체', ASGN_CD:'' })

    return
  }
  if(newValue != ''&& searchParams03.BSNS_CD != ''){
    commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams03.BSNS_CD, DEPT_CD: searchParams03.DEPT_CD } })
    .then(res => {
      codeList3.asgnCd = []
      codeList3.asgnCd = res.ORESULT_CUR
      codeList3.asgnCd.unshift({ ASGN_NM : '전체', ASGN_CD : '' })
      searchParams03.ASGN_CD = codeList3.asgnCd[0].ASGN_CD
    })
  }
})


const onCellClicked = (grid, clickData) => {

 let row = grdMain03_01.value.getDataProvider().getJsonRow(clickData.dataRow)
 const CellParams = {}
 CellParams.CMPNY_DIV = row.CMPNY_DIV
 CellParams.BSNS_CD = row.BSNS_CD
 CellParams.DEPT_CD = row.DEPT_CD
 CellParams.ASGN_CD = row.COMP_CD
 CellParams.REG_NO = row.REG_NO
 CellParams.DATE_FR = searchParams03.DATE_FR.replace(/-/gi,"")
 CellParams.DATE_TO  = searchParams03.DATE_TO.replace(/-/gi,"")

 console.log("CellParams:" ,CellParams)

 commonSearchApi({ queryId: "EDUDC0040_TAB03_SEARCH_02" , param: CellParams })
 .then( res => {
  console.log("tab03_02 result: ", res.ORESULT_CUR)
  grdMain03_02.value.getDataProvider().setRows(res.ORESULT_CUR)
 })


}

const searchData03 = () => {
  const paramsCopy3 = {}
  paramsCopy3.CMPNY_DIV = searchParams03.CMPNY_DIV
  paramsCopy3.ASGN_CD = searchParams03.ASGN_CD
  paramsCopy3.BSNS_CD = searchParams03.BSNS_CD
  paramsCopy3.DEPT_CD = searchParams03.DEPT_CD 
  paramsCopy3.DATE_FR = searchParams03.DATE_FR.replace(/-/gi,"") 
  paramsCopy3.DATE_TO = searchParams03.DATE_TO.replace(/-/gi,"") 
  console.log("paramsCopy3: ", paramsCopy3)
  return commonSearchApi({ queryId: "EDUDC0040_TAB03_SEARCH_01" , param: paramsCopy3 })
}


const afterSearch03 = (res) => {
  console.log("afterSearch03: ", res.ORESULT_CUR)
  grdMain03_01.value.getDataProvider().setRows(res.ORESULT_CUR)
}


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■



const validationCheck01 = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      return true
    }
  }
}

const validationCheck02 = () => {
  let checkedRows = grdMain2.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    for (let rowIdx of checkedRows) {
      let data = grdMain2.value.getDataProvider().getJsonRow(rowIdx)
      if (data.CPN_REG_CNT === null) return false

    }
  }
  return true
}


const validationChk = async () => {
  return true
}


onMounted(() =>{
  initCodeList()
  console.log("codeList" , codeList1)
  }
)

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-2 py-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="mb-2">
        <v-tabs v-model="tab">
          <v-tab value="tab1">전체쿠폰 실적</v-tab>
          <v-tab value="tab2">직영 실적</v-tab>
          <v-tab value="tab3">협력사 실적</v-tab>
        </v-tabs>
      </v-sheet>
    </v-card-title>


    <v-card-text v-show="tab == 'tab1'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('회사구분')"
              width="200px"
              v-model="searchParams01.CMPNY_DIV"
              :items="codeList1.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-input
              :label="$t('포상년월')" type="month"
              v-model="searchParams01.YYYYMM"
              width="300px"
              margin="10px"
              />
          </div>

        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <div class="h-grow">
          <!--개인 실적 -->
          <v-sheet width="49%" >
            <IGridTitle
              :title="$t('개인 실적')"
            >
              <template #editors />
            </IGridTitle>
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

          <v-sheet width="2%">
          </v-sheet>

          <!--부서 실적 -->
          <v-sheet width="49%">
            <IGridTitle 
            :title="$t('부서 실적')">
              <template #editors />
            </IGridTitle>
            <!-- 메인그리드 -->
            <RealGrid
              ref="grdMain01_02"
              class="mt-2"
              style="height: 600px"
              :grid-view-option="grdProps01_02.gridViewOption"
              :keys="grdProps01_02.keys"
              :fields="grdProps01_02.fields"
              :columns="grdProps01_02.columns"
              :column-layout="grdProps01_02.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <v-card-text v-show="tab == 'tab2'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('회사구분')"
              width="200px"
              v-model="searchParams02.CMPNY_DIV"
              :items="codeList2.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly/>

            <i-input
              :label="$t('기간')" type="date"
              width="200px"
              v-model="searchParams02.START_DATE"
              margin="10px"/>

            <i-input
              :label="$t('-')" type="date"
              width="200px"
              v-model="searchParams02.END_DATE"
              margin="10px"/>
          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <!--개인 실적 -->

        <!-- tab2 메인 영역 -->
        <div class="h-auto ">
          <v-sheet width="100%" class="pa-0 h-auto mr-2">
            <!-- 메인그리드 제목  -->
            <div
              class="d-flex mB-10 justify-space-between align-center"
              style="min-height: 30px">
              <div class="d-flex align-center">
                <span class="gridTitle mR-10">
                  {{ '직영 실적' }}
                </span>
              </div>

            </div>      
            <!-- 메인그리드 내용  -->
            <RealGrid
              ref="grdMain02"
              class="mt-2"
              style="height: 580px"
              :grid-view-option="grdProps02.gridViewOption"
              :keys="grdProps02.keys"
              :fields="grdProps02.fields"
              :columns="grdProps02.columns"
              :column-layout="grdProps02.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <v-card-text v-show="tab == 'tab3'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('회사구분')"
              width="200px"
              v-model="searchParams03.CMPNY_DIV"
              :items="codeList3.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              readonly/>
              <i-select
              :label="$t('사업부')"
              width="200px"
              v-model="searchParams03.BSNS_CD"
              :items="codeList3.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
            />
            <i-select
              :label="$t('부서')"
              width="250px"
              v-model="searchParams03.DEPT_CD"
              :items="codeList3.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
            />
            <i-select
              :label="$t('협력사')"
              width="250px"
              v-model="searchParams03.ASGN_CD"
              :items="codeList3.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
            />
            <i-input
              :label="$t('기간')" type="date"
              width="200px"
              v-model="searchParams03.DATE_FR"
              margin="10px"/>

            <i-input
              :label="$t('-')" type="date"
              width="200px"
              v-model="searchParams03.DATE_TO"
              margin="10px"/>
          </div>
        </v-sheet>
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
 
        <div class="h-grow">
          <!--개인 실적 -->
          <v-sheet width="49%" >
            <IGridTitle
              :title="$t('협력사별 summary')"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain03_01"
              class="mt-2"
              style="height: 580px"
              :grid-view-option="grdProps03_01.gridViewOption"
              :keys="grdProps03_01.keys"
              :fields="grdProps03_01.fields"
              :columns="grdProps03_01.columns"
              :column-layout="grdProps03_01.columnLayout"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>

          <v-sheet width="2%">
          </v-sheet>

          <!--부서 실적 -->
          <v-sheet width="49%">
            <div
              class="d-flex mB-10 justify-space-between align-center"
              style="min-height: 30px">
              <div class="d-flex align-center">
                <span class="gridTitle mR-10">
                  {{ '협력사별 실적 상세' }}
                </span>
              </div>

            </div>   

            <RealGrid
              ref="grdMain03_02"
              class="mt-2"
              style="height: 580px"
              :grid-view-option="grdProps03_02.gridViewOption"
              :keys="grdProps03_02.keys"
              :fields="grdProps03_02.fields"
              :columns="grdProps03_02.columns"
              :column-layout="grdProps03_02.columnLayout"
            />
          </v-sheet>
        </div>




      </div>
    </v-card-text>



  </v-card>
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
