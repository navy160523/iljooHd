<!-- 
  * Vue 내 용 : 협력사 안전관리 수준 평가 등록(전체/순위)
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/01
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/01 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import SAFIB0010Popup01 from "@/pages/30_safety/SAF_I/POPUP/SAFIB0010Popup01.vue"
import SAFIB0020Popup01 from "@/pages/30_safety/SAF_I/POPUP/SAFIB0020Popup01.vue"
import { isEmpty } from "@/@core/utils"
import Message from "@hiway/utils/notify"

const props = defineProps({
  business01: { 
    type: String, 
    default: '',
  },
  charger: { 
    type: String, 
    default: '',
  },
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const grdMain = ref(null)
const menuTitle = ref(null)
const confirmButtons = ref(null)
const sAFIB0010Popup01 = ref(null)
const sAFIB0020Popup01 = ref(null)
const MailPopup = ref(null)

const psGubun = ref('')
const isCharger = ref(false)  //담당자확인
const isGeneralManager = ref(false)  //총괄담당자확인
const confirmMsg = ref(null)  //확정 메시지 문구
const btnList = ref(['btnSelectPartner', 'btnSearch', 'btnDataImport', 'btnUpdate', 'btnDelete' , 'btnExcelUpload', 'btnSampleDown', 'btnSendMail'])

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  VIO_GDIV: '',
  YEAR: dayjs().get("year"),
  QUARTER: '',
  CHRG_GRP: '',
  RANK_GBN: 'A',
  USER_ID: userStore.userId,
})

/* 조회 구분 */
const dtQuater = reactive([
  { COD: "1", TXT: "1분기" },
  { COD: "2", TXT: "2분기" },
  { COD: "3", TXT: "3분기" },
  { COD: "4", TXT: "4분기" },
])

/* 조회 구분 */
const dtRank = reactive([
  { COD: "A", TXT: "전체" },
  { COD: "S", TXT: "사업부" },
])

// 그리드 콤보박스
const PRIZEList = ref(
  [
    { COD: 'Y' , TXT: '포상' },
    { COD: 'N' , TXT: ' ' },
  ],
)

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    header: { height: 100 },
    checkBar: { visible: true },
    footers: {
      visible: true,
      items:[
        {},
        { height: 30,styleName:"text-primary" },
        { height: 30,styleName:"text-primary" },
      ],
    },
  },
  keys : ['CMPNY_DIV','BSNS_CD','COMP_CD','ASGN_CD','PART_CD'],
  fields : [
    { 
      fieldName: 'RANKING', 
      dataType: 'int', 
      width: '50',
      header: { text: t('순위') },
    },
    { 
      fieldName: 'BSNS_NM', 
      dataType: 'text', 
      width: '120',
      header: { text: t('사업부') },
      editable: false,
      mergeRule: { "criteria": "value" },
    },
    { 
      fieldName: 'CHRG_NM', 
      dataType: 'text', 
      width: '150',
      header: { text: t('담당') },
      editable: false,
      styleName: "left-column",
      mergeRule: { "criteria": "value" },
    },
    { 
      fieldName: 'PART_NM', 
      dataType: 'text', 
      width: '150',
      header: { text: t('부서') },
      editable: false,
      visible: false,
      styleName: "left-column",
      mergeRule: { "criteria": "value" },
    },
    { 
      fieldName: 'ASGN_NM', 
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('부서') },
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },
    { 
      fieldName: 'COMP_NM', 
      dataType: 'text', 
      width: '150',
      editable: false,
      header: { text: t('협력사') },
      styleName: "left-column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: 150px; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
      footers:[
        {},
        {
          text:"평점",
          visible:"true",
          align:"center",
        },
        {
          text:"최대점수",
          visible:"true",
          align:"center",
        },
      ],
    },
    { 
      fieldName: 'DSST_INDC', 
      dataType: 'number',
      width: '100',
      editable: false,
      editor: { 
        ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", 
        maxLength: 6,
      }, 
      styleName: 'right-column',
      header: { 
        text: t('재해지표(20점)'),
      },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SFTY_MNGR_CMPT_ASSM', 
      dataType: 'number',
      width: '100',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column right-column',
      header: { text: t('안전관리자역량평가(10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'FCFC_INTRV', 
      dataType: 'number',
      width: '100',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('대면인터뷰(10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SFTY_ACTVT', 
      dataType: 'number',
      width: '100',
      editable: false,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'right-column',
      header: { text: t('안전활동 건수(가점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'RISK_ASSMN', 
      dataType: 'number',
      width: '100',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column right-column',
      header: { text: t('위험성평가(10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],

      styleCallback: function(grid,dataCell){
        let ret = {}

        if(dataCell.value < 10) {
          ret.styleName = "editable_column right-error-column"
        }
        else {
          ret.styleName = "editable_column right-column"
        }

        return ret
      },
    },
    { 
      fieldName: 'MBL_WRK_ORD',
      dataType: 'number', 
      width: '100',
      editable: false,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'right-column',
      header: { text: t('모바일 작업지시(10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'right-column'}

        if(searchParams.BSNS_CD == 'AE00') { // 특수선일 경우 editable: true
          ret.editable = true
          ret.styleName = 'right-column editable_column'
        } 
        return ret
      }
    },
    { 
      fieldName: 'LGL_DOCS_CERTIFIED', 
      dataType: 'number',
      width: '100',
      editable: false,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'right-column',
      header: { text: t('법적서류 및 인증(가점/감점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
      styleCallback: function(grid,dataCell){
        let ret = {}

        if(dataCell.value < 0) {
          ret.styleName = "right-error-column"
        }
        else {
          ret.styleName = "right-column"
        }

        return ret
      },
    },
    { 
      fieldName: 'CMP_SYS', 
      dataType: 'number', 
      width: '100',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column right-column',
      header: { text: t('제도준수(15점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SFTY_EDCT', 
      dataType: 'number',
      width: '100',
      editable: false,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'right-column',
      header: { text: t('안전교육(5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
      styleCallback: function(grid,dataCell){
        let ret = {}

        if(dataCell.value < 5) {
          ret.styleName = "right-error-column"
        }
        else {
          ret.styleName = "right-column"
        }

        return ret
      },
    },
    { 
      fieldName: 'SITE_INSPC', 
      dataType: 'number',
      width: '100',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('현장점검(5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'SFTY_INTR_WORK',
      dataType: 'number',
      width: '100',
      editable: false,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'right-column',
      header: { text: t('일상점검/안전작업 요구권(5점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'ONST_ACTV', 
      dataType: 'number',
      width: '100', 
      editable: false,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'right-column',
      header: { text: t('현장 개선활동(가점)') }, 
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'HCARE_HSYS', 
      dataType: 'number', 
      width: '100',
      editable: true,
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 6 }, 
      styleName: 'editable_column-right',
      header: { text: t('건강관리/보건시스템 활용(10점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'TOTAL', 
      dataType: 'number', 
      width: '100',
      editable: false,
      styleName: "right-column",
      header: { text: t('합계(100점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
      valueExpression: "values['DSST_INDC'] +values['SFTY_MNGR_CMPT_ASSM'] +values['FCFC_INTRV'] +values['SFTY_ACTVT'] +values['RISK_ASSMN'] + values['MBL_WRK_ORD'] + values['LGL_DOCS_CERTIFIED'] + values['CMP_SYS']+ values['SFTY_EDCT']+ values['SITE_INSPC']+ values['SFTY_INTR_WORK']+ values['ONST_ACTV']+ values['HCARE_HSYS']",
    },
    { 
      fieldName: 'EVAL_RESULTS', dataType: 'text', 
      width: '70',
      editable: false,
      header: { text: t('평가결과') },
    },
    { 
      fieldName: 'REG_CNT', dataType: 'text', 
      width: '60',
      editable: false,
      styleName: "right-column",
      header: { text: t('등록인원') },
    },
    { 
      fieldName: 'RWD_HIST', dataType: 'text', 
      width: '100',
      header: { text: t('포상여부') },
      lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        if(isGeneralManager.value) {
          ret.editable = true
          ret.styleName = "editable_column"
        }
        else {
          ret.editable = false
          ret.styleName = "center-column"
        }

        return ret
      },
    },
    { 
      fieldName: 'REMARK', dataType: 'text', 
      width: '200',
      editable: true,
      styleName: "editable_column-left",
      header: { text: t('비고') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },
    { 
      fieldName: 'SLF_EVAL_STUS_NM', dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('업체자체 평가상태') },
      styleCallback: function(grid,dataCell){
        let ret = {}
        let targetData = grid.getValue(dataCell.index.itemIndex, "SLF_EVAL_STUS")

        if(targetData == 'C'){

          ret.styleName = "button-blue"
        }
        else if (targetData == 'Y') {
          ret.styleName = "button-grey"
        }
        else if (targetData == 'F') {
          ret.styleName = "button-green"
        }
        else {
          ret.styleName = "button-white"
        }

        ret.renderer = {
          type:'button',
        }

        return ret
      },    
    },
    { 
      fieldName: 'STATUS', dataType: 'text', 
      width: '150',
      editable: false,
      header: { text: t('최종 확정상태') },
    },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'COMP_CD', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible: false },
    { fieldName: 'PART_CD', dataType: 'text' , visible: false },
    { fieldName: 'REG_DATE', dataType: 'text' , visible: false },
    { fieldName: 'SLF_EVAL_STUS', dataType: 'text' , visible: false },
    { fieldName: 'E_MAIL', dataType: 'text' , visible: false },
    { fieldName: 'CONFIRM_YN', dataType: 'text' , visible: false },
    { fieldName: 'GM_CONFIRM_YN', dataType: 'text' , visible: false },
    { fieldName: 'RWD_HIST_YEAR', dataType: 'text' , visible: false },
  ],
  columns : [],
  columnLayout: [
    'RANKING',
    'BSNS_NM',
    'CHRG_NM', 
    'PART_NM', 
    'ASGN_NM', 
    'COMP_NM',
    {
      name: 'SAFETY_LEADERSHIP',
      fieldName : 'SAFETY_LEADERSHIP',
      direction: 'horizontal',
      items: [
        'DSST_INDC',
        'SFTY_MNGR_CMPT_ASSM',
        {
          name: '대표 안전 경영활동(10점 + α)',
          direction: 'horizontal',
          items: [
            'FCFC_INTRV',
            'SFTY_ACTVT',
          ],
          header: {
            text: t('대표 안전 경영활동(10점 + α)'),
          },
        },
      ],
      header: {
        text: t('안전리더십(40점 + α)'),
        template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('안전리더십(40점 + α)') },
      },
    },
    {
      name: 'SAFETY_SYSTEM',
      fieldName : 'SAFETY_SYSTEM',
      direction: 'horizontal',
      items: [
        'RISK_ASSMN',
        'MBL_WRK_ORD',
        'LGL_DOCS_CERTIFIED',
      ],
      header: {
        text: t('안전시스템(20점 +α)'),
        template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('안전시스템(20점 + α)') },
      },
    },
    {
      name: 'SAFETY_CULTURE',
      fieldName : 'SAFETY_CULTURE',
      direction: 'horizontal',
      items: [
        'CMP_SYS',
        'SFTY_EDCT',
      ],
      header: {
        text: t('안전문화(20점)'),
        template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('안전문화(20점 + α)') },
      },
    },
    {
      name: 'SITE_SAFETY_MANAGE',
      fieldName : 'SITE_SAFETY_MANAGE',
      direction: 'horizontal',
      items: [
        'SITE_INSPC',
        'SFTY_INTR_WORK',
        'ONST_ACTV',
      ],
      header: {
        text: t('현장안전관리(10점 + α)'),
        template: "<div style='display: grid; grid-template-columns: auto auto;'><div class='d-flex justify-end mr-2 align-self-center'><span>${headerText}</span></div><div class='d-flex justify-space-between'><button><span class='mdi mdi-magnify text-light-blue-darken-1 text-h6'></span></button></div></div>" ,
        values: { headerText: t('현장안전관리(10점 + α)') },
      },
    },
    {
      name: '보건(10점)',
      direction: 'horizontal',
      items: [
        'HCARE_HSYS',
      ],
      header: {
        text: t('보건(10점)'),
      },
    },
    'TOTAL',
    'EVAL_RESULTS',
    'REG_CNT',
    'RWD_HIST',
    'REMARK',
    'SLF_EVAL_STUS_NM',
    'STATUS',
  ],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 5,
    })
    searchParams.QUARTER = getQuarter(new Date())
    setCharger()
    setBindCombo()
  })  
})

// props 감지
watch(
  () => props.business01, newValue => {
    searchParams.BSNS_CD = props.business01
  },
)

watch(
  () => props.charger, newValue => {
    if(newValue === 'A') { //전체
      searchParams.CHRG_GRP = ''
      setDisableBtns1('Y')
    }
    else if(newValue === 'S') {
      searchParams.CHRG_GRP = 'S'
      setDisableBtns1('N')
    }
    else if(newValue === 'G') {
      searchParams.CHRG_GRP = 'G'
      setDisableBtns1('N')
    }
  },
)

const setBindCombo = () => {
  grdMain.value.setBindingColumn(
    'RWD_HIST',
    PRIZEList.value,
    'COD',
    'TXT',
  )
}

//로그인 사용자 담당자 확인
const setCharger = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    ASGN_CD: userStore.asgnCd,
    EMP_NO: userStore.userId,
  }

  confirmMsg.value = ''

  Promise.all([ 
    commonSearchApi({ queryId : 'SAFIB0010_SEARCH_EMP', param }) , 
  ]).then(res => {
    if(res[0].ORESULT_CUR.length === 0) {
      setDisableBtns1('Y')
      isCharger.value = false
      isGeneralManager.value = false
    }
    else {
      res[0].ORESULT_CUR.forEach( value => {
        psGubun.value = value.PS_GUBUN
        if(psGubun.value == 'PS00') {
          btnList.value = ['btnSearch', 'btnSampleDown', 'btnSendMail']
        } else {
          btnList.value = ['btnSelectPartner', 'btnSearch', 'btnDataImport', 'btnUpdate', 'btnDelete' , 'btnExcelUpload', 'btnSampleDown', 'btnSendMail']
        }

        //총괄 담당자 및 각 사업 담당자는 모두 저장, 삭제, 불러오기, 엑셀 업로드 버튼 활성화
        if(value.PS_GUBUN === 'PS00' || value.PS_GUBUN === 'PS10' ||
          value.PS_GUBUN === 'PS20' || value.PS_GUBUN === 'PS30' ||
          value.PS_GUBUN === 'PS40' || value.PS_GUBUN === 'PS50') {
          if(props.charger === 'A') {
            setDisableBtns1('Y')
          } else {
            setDisableBtns1('N')
          }

          if(value.PS_GUBUN === 'PS00') {
            isGeneralManager.value = true
            checkConfirmButton('Y')
          } else {
            isCharger.value = true
            checkConfirmButton('N')            
          }
        } else {
          setDisableBtns1('Y')
          isCharger.value = false
          isGeneralManager.value = false
        }

        if(value.PS_GUBUN === 'PS00'){ // 총괄

        } else if(value.PS_GUBUN === 'PS10') { // 조선담당자
          if(props.charger === 'A') { //전체
            searchParams.CHRG_GRP = ''
          } else {  //조선
            searchParams.CHRG_GRP = 'S'
          }
        } else if(value.PS_GUBUN === 'PS20') { // 군산담당자
          searchParams.CHRG_GRP = 'G'
        }
      })
    }
  })

  //총괄 담당자 조회
  Promise.all([ 
    commonSearchApi({ queryId : 'SAFIH0010_SEARCH_02', param }) , 
  ]).then(res2 => {
    if(res2[0].ORESULT_CUR.length > 0) {
      confirmMsg.value = '총괄담당자\n'

      res2[0].ORESULT_CUR.forEach( value => {
        confirmMsg.value = confirmMsg.value + value.EMP_NM + ' ' + 
        (value.JOB_TIT_NM ? value.JOB_TIT_NM : '') + ' ' +
        (value.TEL_NO ? value.TEL_NO : '') + '\n'
      })
    }
  })
}

const onButtonsClick = btn => {
  if (btn.id === 'btnSelectPartner') {
    selectPartner()
  } 
  else if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnDataImport') {

    // 안전수칙위반 항목 구분
    if(searchParams.BSNS_CD === '')  {  //전체
      return Message.warn("사업부를 선택해 주세요")
    }

    searchDataMain01() 
    searchDataMain02()
    searchDataMain03() // 위험성평가는 데이터오류가 있어 수기로 입력
    searchDataMain04()
    searchDataMain05() 
    searchDataMain06()
    searchDataMain07()
    searchDataMain08()
  }
  else if (btn.id === 'btnUpdate') {
    // 체크된 행이 없을 시 전체 체크
    if (grdMain.value.getGridView().getCheckedRows(true).length === 0) {
      allCheck()
    }
    
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id:'btnSearch' })
      })
      .run()
  }
  else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id:'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnExcelUpload') {
    const input = document.createElement('input')

    if (grdMain.value.getDataProvider().rowCount === 0) {
      return Message.err("데이터가 없습니다.")
    }

    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  }
  else if(btn.id === 'btnSampleDown'){
    let params = {
      FILE_PATH: 'SAFI',
      FILE_NAME: '첨부1. 협력사 안전관리 수준평가 점수 업로드 파일(양식).xlsx',
    }
    commonSampleDownFilesApi(params)
  }
  else if (btn.id === 'btnSendMail') {
    transMail()
  }
}

const allCheck = () => {
  if(grdMain.value.getGridView().getCheckedRows().length > 0) return
  // 저장전 모든 데이터 체크
  for(var i = 0; i < grdMain.value.getDataProvider().getRowCount(); i++) {
    grdMain.value.getGridView().checkRow(i, true, false, false)
  }
}
const onStatusButtonsClick = btn => {
  if (btn.id === 'btnChargerConfirm') {
    allCheck()
    new saveFlowHelper(vm, t)
      .setBefore(beforeConfirm)
      .setQuery(confirmData)
      .setConfirmMessage('최종확정 하시겠습니까?\n' + confirmMsg.value)
      .setResultMessage('확정되었습니다.')
      .setAfter(() => {
        // vm.$swal({ 
        //   title: t('담당자 확정 후 수정불가하며, 수정을 위해서는 안전경영부 담당자에게 문의 후 조치바랍니다.'), 
        //   showCancelButton: false,
        // })
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  } 
  else if (btn.id === 'btnCancelConfirm') {
    allCheck()
    new saveFlowHelper(vm, t)
      .setBefore(beforeCancel)
      .setQuery(cancelConfirmData)
      .setConfirmMessage('확정 취소 하시겠습니까?')
      .setResultMessage('확정 취소되었습니다.')
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnGeneralManagerConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeGeneralManagerConfirm)
      .setQuery(GeneralManagerconfirmData)
      .setConfirmMessage('총괄 담당자 확정 하시겠습니까?')
      .setResultMessage('확정되었습니다.')
      .setAfter(() => {
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  } 
  else if (btn.id === 'btnGeneralManagerCancelConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeGeneralManagerCancelConfirm)
      .setQuery(GeneralManagerCancelconfirmData)
      .setConfirmMessage('총괄 담당자 확정취소 하시겠습니까?')
      .setResultMessage('확정취소되었습니다.')
      .setAfter(() => {
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  } 
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {
  let grdMainData = grdMain.value.getDataProvider().getJsonRows()
  
  var mappedData = excelData.map(item => {
    return {
      COMP_CD: item.협력사코드,
      COMP_NM: item.협력사명,
      SITE_INSPC: item.현장점검,
      HCARE_HSYS: item.건강관리보건시스템활용,
      RISK_ASSMN: item.위험성평가,
      CMP_SYS: item.제도준수,
      SFTY_MNGR_CMPT_ASSM: item.안전관리자역량평가,
      FCFC_INTRV: item.대면인터뷰,
    }
  })

  if(mappedData.length > 0){
    mappedData.forEach(item => {

      for(let i=0; i <grdMainData.length;i++)
      {
        let val = grdMainData[i]
        if(val.COMP_CD === item.COMP_CD) {
          grdMain.value.getDataProvider().setValue(i, 'SITE_INSPC', item.SITE_INSPC )
          grdMain.value.getDataProvider().setValue(i, 'HCARE_HSYS', item.HCARE_HSYS )
          grdMain.value.getDataProvider().setValue(i, 'RISK_ASSMN', item.RISK_ASSMN )
          grdMain.value.getDataProvider().setValue(i, 'CMP_SYS', item.CMP_SYS )
          grdMain.value.getDataProvider().setValue(i, 'SFTY_MNGR_CMPT_ASSM', item.SFTY_MNGR_CMPT_ASSM )
          grdMain.value.getDataProvider().setValue(i, 'FCFC_INTRV', item.FCFC_INTRV )
        }
      }
    })
  }
}

const selectPartner = () => {
  sAFIB0010Popup01.value.openPopup(searchParams.CHRG_GRP)
}

// 조회
const searchData = () =>{
  searchParams.END_DATE = getEndDate(searchParams.YEAR, searchParams.QUARTER)
  
  return commonSearchApi({ queryId : 'SAFIB0010_SEARCH_MAIN01', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  // searchParams.STATUS = res.ORESULT_CUR[0].STATUS
  setStatus(res.ORESULT_CUR)

  customGridRowStyle()
  customGridCellStyle()
}

// 상태 표시 변경
const setStatus = (data) => {
  const rank = {
    '진행중': 0,
    '담당자 확정완료': 1,
    '총괄 담당자 확정완료' : 2,
  }
  let min = 3

  for(let dt of data) {
    if(rank[dt.STATUS] < min) min = rank[dt.STATUS]
  }

  if(min === 0) {
    searchParams.STATUS = '진행중'

    menuTitle.value.disableBtn("btnDataImport", false)
      menuTitle.value.disableBtn("btnSelectPartner", false)
      menuTitle.value.disableBtn("btnUpdate", false)
      menuTitle.value.disableBtn("btnDelete", false)
      menuTitle.value.disableBtn("btnExcelUpload", false)
      menuTitle.value.disableBtn("btnSampleDown", false)
      menuTitle.value.disableBtn("btnSendMail", false)
      menuTitle.value.disableBtn("btnSearch", false)
      confirmButtons.value.disableBtn("btnChargerConfirm", false)
      confirmButtons.value.disableBtn("btnCancelConfirm", false)
      if(psGubun == 'PS00') {
        confirmButtons.value.disableBtn("btnGeneralManagerConfirm", false)
        confirmButtons.value.disableBtn("btnGeneralManagerCancelConfirm", false)
      }
  } else if(min === 1) {
    searchParams.STATUS = '담당자 확정완료'

    if(psGubun != 'PS00') {
      menuTitle.value.disableBtn("btnDataImport", true)
      menuTitle.value.disableBtn("btnSelectPartner", true)
      menuTitle.value.disableBtn("btnUpdate", true)
      menuTitle.value.disableBtn("btnDelete", true)
      menuTitle.value.disableBtn("btnExcelUpload", true)
      menuTitle.value.disableBtn("btnSampleDown", false)
      menuTitle.value.disableBtn("btnSendMail", false)
      menuTitle.value.disableBtn("btnSearch", false)
      confirmButtons.value.disableBtn("btnChargerConfirm", true)
      confirmButtons.value.disableBtn("btnCancelConfirm", false)
      if(psGubun == 'PS00') {
        confirmButtons.value.disableBtn("btnGeneralManagerConfirm", true)
        confirmButtons.value.disableBtn("btnGeneralManagerCancelConfirm", true)
      }
    }
  } else if(min === 2) {
    searchParams.STATUS = '총괄 담당자 확정완료'

//  - 비활성화 : 최종확정 / 평가협력사 선정 / 데이터 불러오기 / 저장 / 삭제 / 엑셀 업로드
//  - 활성화 : 확정취소 / 조회 / 샘플 다운로드 / 메일발송
    menuTitle.value.disableBtn("btnDataImport", true)
    menuTitle.value.disableBtn("btnSelectPartner", true)
    menuTitle.value.disableBtn("btnUpdate", true)
    menuTitle.value.disableBtn("btnDelete", true)
    menuTitle.value.disableBtn("btnExcelUpload", true)
    menuTitle.value.disableBtn("btnSampleDown", false)
    menuTitle.value.disableBtn("btnSendMail", false)
    menuTitle.value.disableBtn("btnSearch", false)
    confirmButtons.value.disableBtn("btnChargerConfirm", true)
    confirmButtons.value.disableBtn("btnCancelConfirm", true)
    confirmButtons.value.disableBtn("btnGeneralManagerConfirm", true)
    if(psGubun == 'PS00') {
      confirmButtons.value.disableBtn("btnGeneralManagerCancelConfirm", false)
    } else {
      confirmButtons.value.disableBtn("btnGeneralManagerCancelConfirm", true)
    }
  }
}

// 재해지표 조회
const searchDataMain01 = () =>{
  
  searchParams.START_DATE = getStartDate(searchParams.YEAR, searchParams.QUARTER)
  searchParams.END_DATE = getEndDate(searchParams.YEAR, searchParams.QUARTER)

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  Promise.all(
    [
      commonSearchApi({ queryId: "SAFIB0010_SEARCH_01", param: searchParams }),
    ]).then(res => {
    if(res[0].ORESULT_CUR.length > 0){
      res[0].ORESULT_CUR.forEach(item => {

        for(let i=0; i <grdMainData.length;i++)
        {
          let val = grdMainData[i]
          if(val.CMPNY_DIV === item.CMPNY_DIV 
          && val.BSNS_CD === item.BSNS_CD
          && val.COMP_CD === item.COMP_CD 
          && val.ASGN_CD === item.ASGN_CD) {
            grdMain.value.getDataProvider().setValue(i, 'DSST_INDC', item.DSST_INDC )
          }
        }
      })
    }
  })
}

// 안전관리자 역량평가 조회
const searchDataMain02 = () =>{
  
  searchParams.START_DATE = getStartDate(searchParams.YEAR, searchParams.QUARTER)
  searchParams.END_DATE = getEndDate(searchParams.YEAR, searchParams.QUARTER)

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  Promise.all(
    [
      commonSearchApi({ queryId: "SAFIB0010_SEARCH_02", param: searchParams }),
    ]).then(res => {

    if(res[0].ORESULT_CUR.length > 0){
      res[0].ORESULT_CUR.forEach(item => {

        for(let i=0; i <grdMainData.length;i++)
        {
          let val = grdMainData[i]
          if(val.CMPNY_DIV === item.CMPNY_DIV 
          && val.BSNS_CD === item.BSNS_CD
          && val.COMP_CD === item.COMP_CD 
          && val.ASGN_CD === item.ASGN_CD) {
            grdMain.value.getDataProvider().setValue(i, 'SFTY_MNGR_CMPT_ASSM', item.SFTY_MNGR_CMPT_ASSM )
          }
        }
      })
    }
  })
}

// 위험성평가 조회
const searchDataMain03 = () =>{
  searchParams.START_DATE = getStartDate(searchParams.YEAR, searchParams.QUARTER)
  searchParams.END_DATE = getEndDate(searchParams.YEAR, searchParams.QUARTER)

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  Promise.all(
    [
      commonSearchApi({ queryId: "SAFIB0010_SEARCH_03", param: searchParams }),
    ]).then(res => {

    if(res[0].ORESULT_CUR.length > 0){
      res[0].ORESULT_CUR.forEach(item => {

        for(let i=0; i <grdMainData.length;i++)
        {
          let val = grdMainData[i]
          if(val.CMPNY_DIV === item.CMPNY_DIV 
          && val.BSNS_CD === item.BSNS_CD
          && val.COMP_CD === item.COMP_CD 
          && val.ASGN_CD === item.ASGN_CD) {
            grdMain.value.getDataProvider().setValue(i, 'RISK_ASSMN', item.RISK_ASSMN )
          }
        }
      })
    }
  })
}

// 법적서류 및 인증 조회 조회
const searchDataMain04 = () =>{

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  Promise.all(
    [
      commonSearchApi({ queryId: "SAFIB0010_SEARCH_04", param: searchParams }),
    ]).then(res => {
    if(res[0].ORESULT_CUR.length > 0){
      res[0].ORESULT_CUR.forEach(item => {

        for(let i=0; i <grdMainData.length;i++)
        {
          let val = grdMainData[i]
          if(val.CMPNY_DIV === item.CMPNY_DIV 
          && val.BSNS_CD === item.BSNS_CD
          && val.COMP_CD === item.COMP_CD 
          && val.ASGN_CD === item.ASGN_CD ) {
            grdMain.value.getDataProvider().setValue(i, 'LGL_DOCS_CERTIFIED', item.LGL_DOCS_CERTIFIED )
          }
        }
      })
    }
  })
}

// 제도준수 조회
const searchDataMain05 = () =>{
  searchParams.START_DATE = getStartDate(searchParams.YEAR, searchParams.QUARTER)
  searchParams.END_DATE = getEndDate(searchParams.YEAR, searchParams.QUARTER)

  // 안전수칙위반 항목 구분
  if(searchParams.BSNS_CD === 'AC00') { //조선사업부
    searchParams.VIO_GDIV = 'D10'
  }
  else if(searchParams.BSNS_CD === 'AE00') {  //특수선사업부
    searchParams.VIO_GDIV = 'D20'
  }
  else if(searchParams.BSNS_CD === 'AQ00') {  //해양에너지사업본부
    searchParams.VIO_GDIV = 'D30'
  }
  else if(searchParams.BSNS_CD === 'AK00') {  //엔진기계사업부
    searchParams.VIO_GDIV = 'D40'
  }
  else {  //전체
    return Message.warn("사업부를 선택해 주세요")
  }

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  Promise.all(
    [
      commonSearchApi({ queryId: "SAFIB0010_SEARCH_05", param: searchParams }),
    ]).then(res => {

    if(res[0].ORESULT_CUR.length > 0){
      res[0].ORESULT_CUR.forEach(item => {

        for(let i=0; i <grdMainData.length;i++)
        {
          let val = grdMainData[i]
          if(val.CMPNY_DIV === item.CMPNY_DIV 
          && val.BSNS_CD === item.BSNS_CD
          && val.COMP_CD === item.COMP_CD 
          && val.ASGN_CD === item.ASGN_CD) {
            grdMain.value.getDataProvider().setValue(i, 'CMP_SYS', item.CMP_SYS )
          }
        }
      })
    }
  })
}

// 안전교육 조회
const searchDataMain06 = () =>{
  searchParams.START_DATE = getStartDate(searchParams.YEAR, searchParams.QUARTER)
  searchParams.END_DATE = getEndDate(searchParams.YEAR, searchParams.QUARTER)

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  Promise.all(
    [
      commonSearchApi({ queryId: "SAFIB0010_SEARCH_06", param: searchParams }),
    ]).then(res => {

    if(res[0].ORESULT_CUR.length > 0){
      res[0].ORESULT_CUR.forEach(item => {

        for(let i=0; i <grdMainData.length;i++)
        {
          let val = grdMainData[i]
          if(val.CMPNY_DIV === item.CMPNY_DIV 
          && val.BSNS_CD === item.BSNS_CD
          && val.COMP_CD === item.COMP_CD 
          && val.ASGN_CD === item.ASGN_CD) {
            grdMain.value.getDataProvider().setValue(i, 'SFTY_EDCT', item.SFTY_EDCT )
          }
        }
      })
    }
  })
}

// 안전교육 조회
const searchDataMain07 = () =>{
  searchParams.START_DATE = getStartDate(searchParams.YEAR, searchParams.QUARTER)
  searchParams.END_DATE = getEndDate(searchParams.YEAR, searchParams.QUARTER)

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  Promise.all(
    [
      commonSearchApi({ queryId: "SAFIB0010_SEARCH_07", param: searchParams }),
    ]).then(res => {

    if(res[0].ORESULT_CUR.length > 0){
      res[0].ORESULT_CUR.forEach(item => {

        for(let i=0; i <grdMainData.length;i++)
        {
          let val = grdMainData[i]
          if(val.CMPNY_DIV === item.CMPNY_DIV 
          && val.BSNS_CD === item.BSNS_CD
          && val.COMP_CD === item.COMP_CD 
          && val.ASGN_CD === item.ASGN_CD) {
            grdMain.value.getDataProvider().setValue(i, 'SFTY_INTR_WORK', item.SFTY_INTR_WORK_SCORE )
          }
        }
      })
    }
  })
}

// 모바일 작업지시 조회
const searchDataMain08 = () =>{
  
  searchParams.START_DATE = getStartDate(searchParams.YEAR, searchParams.QUARTER)
  searchParams.END_DATE = getEndDate(searchParams.YEAR, searchParams.QUARTER)

  let grdMainData = grdMain.value.getDataProvider().getJsonRows()

  Promise.all(
    [
      commonSearchApi({ queryId: "SAFIB0010_SEARCH_08", param: searchParams }),
    ]).then(res => {
    if(res[0].ORESULT_CUR.length > 0){
      res[0].ORESULT_CUR.forEach(item => {

        for(let i=0; i <grdMainData.length;i++)
        {
          let val = grdMainData[i]
          if(val.CMPNY_DIV === item.CMPNY_DIV 
          && val.BSNS_CD === item.BSNS_CD
          && val.COMP_CD === item.COMP_CD 
          && val.ASGN_CD === item.ASGN_CD) {
            grdMain.value.getDataProvider().setValue(i, 'MBL_WRK_ORD', item.MBL_WRK_ORD )
          }
        }
      })
    }
  })
}

// 저장 전 체크
const beforeSave = () => {
  
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  for (let rowIdx of checkedRows) {
    let val = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (isEmpty(val.DSST_INDC)) {
      return Message.err("재해지표 점수를 입력해 주세요.")
    }

    if (isEmpty(val.SFTY_MNGR_CMPT_ASSM)) {
      return Message.err("안전관리자역량평가 점수를 입력해 주세요.")
    }

    if (isEmpty(val.FCFC_INTRV)) {
      return Message.err("대면인터뷰 점수를 입력해 주세요.")
    }

    if (isEmpty(val.SFTY_ACTVT)) {
      return Message.err("안전활동 점수를 입력해 주세요.")
    }

    if (isEmpty(val.RISK_ASSMN)) {
      return Message.err("위험성평가 점수를 입력해 주세요.")
    }

    if (isEmpty(val.MBL_WRK_ORD)) {
      return Message.err("모바일 작업지시 점수를 입력해 주세요.")
    }

    if (isEmpty(val.LGL_DOCS_CERTIFIED)) {
      return Message.err("법적서류 및 인증 점수를 입력해 주세요.")
    }

    if (isEmpty(val.CMP_SYS)) {
      return Message.err("제도준수 점수를 입력해 주세요.")
    }

    if (isEmpty(val.SFTY_EDCT)) {
      return Message.err("안전교육 점수를 입력해 주세요.")
    }

    if (isEmpty(val.SITE_INSPC)) {
      return Message.err("현장점검 점수를 입력해 주세요.")
    }
    if (isEmpty(val.SFTY_INTR_WORK)) {
      return Message.err("일상점검/안전작업 요구권 점수를 입력해 주세요.")
    }

    if (isEmpty(val.ONST_ACTV)) {
      return Message.err("현장 개선활동 점수를 입력해 주세요.")
    }

    if (isEmpty(val.HCARE_HSYS)) {
      return Message.err("건강관리/보건시스템 활용 점수를 입력해 주세요.")
    }

    // if(val.SLF_EVAL_STUS === 'F') {
    //   return Message.warn(t('검토완료된 평가는 수정 할 수 없습니다.'))
    // }

    if(val.CONFIRM_YN === 'Y') {
      return Message.warn(t('최종 확정된 평가는 수정 할 수 없습니다.'))
    }

    if(val.GM_CONFIRM_YN === 'Y') {
      return Message.warn(t('총괄 담당자 확정된 평가는 수정 할 수 없습니다.'))
    }
  }

  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId

    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SAFIB0010_SAVE_01', list: saveParams })
}

// 삭제 전 체크
const beforeDelete = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  for (let rowIdx of checkedRows) {
    let val = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(val.SLF_EVAL_STUS === 'F') {
      return Message.warn(t('검토완료된 평가는 삭제 할 수 없습니다.'))
    }

    if(val.CONFIRM_YN === 'Y') {
      return Message.warn(t('최종 확정된 평가는 삭제 할 수 없습니다.'))
    }

    if(val.GM_CONFIRM_YN === 'Y') {
      return Message.warn(t('총괄 담당자 확정된 평가는 삭제 할 수 없습니다.'))
    }
  }

  return true
}

const deleteData = () => {

  let deleteParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(
      {
        CMPNY_DIV: data.CMPNY_DIV,
        COMP_CD: data.COMP_CD,
        BSNS_CD: data.BSNS_CD,
        ASGN_CD: data.ASGN_CD,
        REG_DATE: data.REG_DATE,
      },
    )
  }
  return commonExecuteApi({ queryId : 'SAFIB0010_DELETE_01', list: deleteParams })
}

// 메일 전송
const transMail = () => {
  let mailForm = {  
    TO_EMP_NO: [],
    TO_EMP_NM: [],
    BSNS_CD: [],
    ASGN_CD: [],
    REG_DATE: [],
  }

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {

    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(isEmpty(data.E_MAIL)) {
      Message.err(data.COMP_NM + "는 대표 메일이 없습니다. 확인바랍니다.")
    }
    else {
      mailForm.TO_EMP_NO.push(data.E_MAIL)
      mailForm.TO_EMP_NM.push(data.COMP_NM)
      mailForm.BSNS_CD.push(data.BSNS_CD)
      mailForm.ASGN_CD.push(data.ASGN_CD)
      mailForm.REG_DATE.push(data.REG_DATE)
    }
  }
  
  MailPopup.value.openPopup(mailForm)
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)

  if(col.field === 24) {
    if(data.SLF_EVAL_STUS === 'N') {
      return Message.err("업체 자체평가를 하지 않은 데이터 입니다.")
    } else {
      sAFIB0020Popup01.value.openPopup(data)
    }
  }
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType === 'header') {

    if (grdMain.value.getDataProvider().rowCount === 0) {
      return Message.err("데이터가 없습니다.")
    }

    switch(clickData.column) {
    case 'SAFETY_LEADERSHIP' :
      searchDataMain01() 
      //searchDataMain02() -- 2024.11.13 이상현 책임 요청으로 조회 X
      break
    case 'SAFETY_SYSTEM' :
      //searchDataMain03() -- 2024.11.13 이상현 책임 요청으로 조회 X
      searchDataMain04()
      searchDataMain08()
      break
    case 'SAFETY_CULTURE' :
      searchDataMain05() 
      searchDataMain06()
      break
    case 'SITE_SAFETY_MANAGE' :
      searchDataMain07()
      break
    }
  }
  // else if(clickData.cellType === 'data') {
  //   let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  //   searchParams.STATUS = row.STATUS
  // }
}

// 최대 최소 값 입력 방지
const onEditRowChanged  = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  let fieldName = grdMain.value.getDataProvider().getFieldName(field)

  switch(fieldName) {
  case 'DSST_INDC':
    if(newValue > 20) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < -20) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break
  case 'SFTY_MNGR_CMPT_ASSM':
  case 'FCFC_INTRV':
  case 'RISK_ASSMN':
  case 'MBL_WRK_ORD':
  case 'HCARE_HSYS':
    if(newValue > 10) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < 0) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break
  case 'SFTY_ACTVT':
  case 'SFTY_EDCT':
  case 'SITE_INSPC':
  case 'SFTY_INTR_WORK':
  case 'ONST_ACTV':
    if(newValue > 5) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < 0) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break
  case 'LGL_DOCS_CERTIFIED':
    if(newValue > 2) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < -10) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break
  case 'CMP_SYS':
    if(newValue > 15) {
      grid.commit()
      Message.warn("최대 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    else if (newValue < 0) {
      grid.commit()
      Message.warn("최소 값을 초과된 값입니다.")
      grdMain.value.getDataProvider().setValue(dataRow, fieldName, oldValue)
    }
    break
  }
}

const beforeConfirm = () => {
  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  if (!isCharger.value) {
    return Message.err("담당자가 아닙니다.")
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let value4 = data.SLF_EVAL_STUS

    if(value4 === 'N' || value4 === 'Y') {
      return Message.err("선택한 업체 중 자체 평가가 확정 되지 않는 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }

    if(data.CONFIRM_YN === 'Y') {
      return Message.err("선택한 업체 중 최종 확정된 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }

    if(value4 !== 'F') {
      return Message.err("선택한 업체 중 검토 미완료 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }

    if(data.GM_CONFIRM_YN === 'Y') {
      return Message.err("선택한 업체 중 총괄 담당자 확정된 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }
  }

  return true
}

//확정
const confirmData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,
        COMP_CD : data.COMP_CD,       
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        REG_DATE : data.REG_DATE,
        CONFIRM_YN : 'Y',
        USER_ID : userStore.userId,
      },
    )
  }
  return commonExecuteApi({ queryId : 'SAFIB0020_SAVE_03', list: saveParams })
}

const beforeCancel = () => {
  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if(checkedRows.length === 0){
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  if (!isCharger.value) {
    return Message.err("담당자가 아닙니다.")
  }

  return true
}

//확정
const cancelConfirmData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,
        COMP_CD : data.COMP_CD,       
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        REG_DATE : data.REG_DATE,
        CONFIRM_YN : 'N',
        USER_ID : userStore.userId,
      },
    )
  }

  return commonExecuteApi({ queryId : 'SAFIB0020_SAVE_03', list: saveParams })
}

const beforeGeneralManagerConfirm = () => {
  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  if (!isGeneralManager.value) {
    return Message.err("총괄 담당자가 아닙니다.")
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let value1 = data.RISK_ASSMN
    let value2 = data.LGL_DOCS_CERTIFIED
    let value3 = data.SFTY_EDCT
    let value4 = data.SLF_EVAL_STUS
    let value5 = data.RWD_HIST_YEAR

    if(value4 === 'N' || value4 === 'Y') {
      return Message.err("선택한 업체 중 자체 평가가 확정 되지 않는 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }

    if(data.CONFIRM_YN !== 'Y') {
      return Message.err("선택한 업체 중 최종 확정 미완료 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }

    if(value4 !== 'F') {
      return Message.err("선택한 업체 중 검토 미완료 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }

    if(value5 > 0) {
      return Message.err("선택한 업체 중 1년 이내 포상이력이 있는 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }

    if(value1 < 10){
      return Message.err("선택한 업체 중 위험성 평가 평점 미달 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }

    if(value2 < 0){
      return Message.err("선택한 업체 중 법적서류 및 인증 평점 미달 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }

    if(value3 < 5){
      return Message.err("선택한 업체 중 안전교육 평점 미달 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }
  }

  return true
}

//총괄 담당자 확정
const GeneralManagerconfirmData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,
        COMP_CD : data.COMP_CD,       
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        REG_DATE : data.REG_DATE,
        RWD_HIST: 'Y',
        GM_CONFIRM_YN : 'Y',
        USER_ID : userStore.userId,
      },
    )
  }
  return commonExecuteApi({ queryId : 'SAFIB0020_SAVE_04', list: saveParams })
}

const beforeGeneralManagerCancelConfirm = () => {
  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  if (!isGeneralManager.value) {
    return Message.err("총괄 담당자가 아닙니다.")
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(data.GM_CONFIRM_YN === 'N') {
      return Message.err("선택한 업체 중 총괄 담당자 미확정 업체가 있습니다. 확인 바랍니다.(" + data.COMP_NM + ")")
    }
  }

  return true
}

//총괄 담당자 확정취소
const GeneralManagerCancelconfirmData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,
        COMP_CD : data.COMP_CD,       
        BSNS_CD : data.BSNS_CD,
        ASGN_CD : data.ASGN_CD,
        REG_DATE : data.REG_DATE,
        RWD_HIST: 'N',
        GM_CONFIRM_YN : 'N',
        USER_ID : userStore.userId,
      },
    )
  }
  return commonExecuteApi({ queryId : 'SAFIB0020_SAVE_04', list: saveParams })
}

const getQuarter  = date => {
  return Math.ceil((date.getMonth() + 1) / 3).toString()
}

const getStartDate  = (year, quarter) => {
  let firstDay = new Date()

  // 0 ~ 11 / 1월 ~ 12월
  if (quarter === '1') {
    firstDay = new Date(year, 0, 1)
  }
  else if(quarter === '2') {
    firstDay = new Date(year, 3, 1)
  }
  else if(quarter === '3') {
    firstDay = new Date(year, 6, 1)
  }
  else if(quarter === '4') {
    firstDay = new Date(year, 9, 1)
  }

  return dayjs(firstDay).format('YYYYMMDD')
}

const getEndDate  = (year, quarter) => {
  let lastDay = new Date()

  // 0 ~ 11 / 1월 ~ 12월
  if (quarter === '1') {
    lastDay = new Date(year, 3, 0)
  }
  else if(quarter === '2') {
    lastDay = new Date(year, 6, 0)
  }
  else if(quarter === '3') {
    lastDay = new Date(year, 9, 0)
  }
  else if(quarter === '4') {
    lastDay = new Date(year, 12, 0)
  }

  return dayjs(lastDay).format('YYYYMMDD')
}

const popupClosed = () => {
  onButtonsClick({ id:'btnSearch' })
}

const setDisableBtns1 = disabled => {
  if(disabled === 'Y') {
    menuTitle.value.disableBtn("btnDataImport", true)
    menuTitle.value.disableBtn("btnSelectPartner", true)
    menuTitle.value.disableBtn("btnUpdate", true)
    menuTitle.value.disableBtn("btnDelete", true)
    menuTitle.value.disableBtn("btnExcelUpload", true)
    confirmButtons.value.disableBtn("btnChargerConfirm", true)
    confirmButtons.value.disableBtn("btnCancelConfirm", true)
  }
  else {
    menuTitle.value.disableBtn("btnDataImport", false)
    menuTitle.value.disableBtn("btnSelectPartner", false)
    menuTitle.value.disableBtn("btnUpdate", false)
    menuTitle.value.disableBtn("btnDelete", false)
    menuTitle.value.disableBtn("btnExcelUpload", false)
    confirmButtons.value.disableBtn("btnChargerConfirm", false)
    confirmButtons.value.disableBtn("btnCancelConfirm", false)
  }
}

const checkConfirmButton = disabled => {
  if(disabled === 'Y') {
    confirmButtons.value.disableBtn("btnChargerConfirm", true)
    confirmButtons.value.disableBtn("btnCancelConfirm", true)
    confirmButtons.value.disableBtn("btnGeneralManagerConfirm", false)
    confirmButtons.value.disableBtn("btnGeneralManagerCancelConfirm", false)
  }
  else {
    confirmButtons.value.disableBtn("btnChargerConfirm", false)
    confirmButtons.value.disableBtn("btnCancelConfirm", false)
    confirmButtons.value.disableBtn("btnGeneralManagerConfirm", true)
    confirmButtons.value.disableBtn("btnGeneralManagerCancelConfirm", true)
  }
}

const customGridCellStyle = () => {

  grdMain.value.getGridView().setCellStyleCallback(function(grid, dataCell) {
    let ret = {}

    if(dataCell.dataColumn.fieldName === 'COMP_NM') {
      let confirm = grid.getValue(dataCell.index.itemIndex, 'CONFIRM_YN')

      if(confirm === 'Y') {
        ret.style = { background: "#6799FF" } 
      }
      else{
        ret.style = { background: "#FFFFFF" } 
      }
    }

    return ret
  })
}
</script>

<template>
  <v-card-text class="pa-3 pt-0 content-area">
    <div class="d-flex flex-column fill-height">
      <v-card-title class="pa-2 py-0">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"  
          :button-list="btnList"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-sheet class="searchArea d-flex">
        <i-input
          v-model="searchParams.YEAR"
          :label="$t('년도')"
          label-width="50px"
          type="Number"
          width="150px"
        />
        <i-select
          v-model="searchParams.QUARTER"
          :label="$t('분기')"
          label-width="60px"
          append-inner-icon="mdi-magnify"
          :items="dtQuater"
          item-title="TXT"
          item-value="COD"
          width="230px"
        />
        <i-select
          v-model="searchParams.RANK_GBN"
          :label="$t('순위')"
          label-width="60px"
          append-inner-icon="mdi-magnify"
          :items="dtRank"
          item-title="TXT"
          item-value="COD"
          width="230px"
        />
        <i-input
          v-model="searchParams.STATUS"
          class="color-black"
          :label="$t('진행상태')"
          label-width="50px"
          width="250px"
          readonly
        />
        <IGridTitle
          ref="confirmButtons"
          class="ma-2"
          :use-permission="false"
          :button-list="['btnChargerConfirm', 'btnCancelConfirm', 'btnGeneralManagerConfirm', 'btnGeneralManagerCancelConfirm']"
          @click-button="onStatusButtonsClick"
        />
      </v-sheet>
      <v-sheet 
        height="67%"
      >
        <RealGrid
          ref="grdMain"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
          @on-cell-item-clicked="onCellItemClicked"
          @on-cell-clicked="onCellClicked"
          @on-edit-row-changed="onEditRowChanged"
        />
      </v-sheet>
    </div>
  </v-card-text>
  <!-- 평가 대상 협력사 팝업 -->
  <SAFIB0010Popup01
    ref="sAFIB0010Popup01"
    @closed="popupClosed"
  />
  <!-- 업체자체평가 팝업 -->
  <SAFIB0020Popup01
    ref="sAFIB0020Popup01" 
    @closed="popupClosed"
  />
  <SendMailPopup ref="MailPopup" />
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
    min-height: 700px;
  }
}

.color-black {
  color: black !important;
}
</style>