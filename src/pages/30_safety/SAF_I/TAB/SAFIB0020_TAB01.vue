<!-- 
  * Vue 내 용 : 협력사 안전관리 수준평가 결과(조선해양)
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/01
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/06/01 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import SAFIB0020Popup01 from "@/pages/30_safety/SAF_I/POPUP/SAFIB0020Popup01.vue"
import SAFIB0010Popup02 from "@/pages/30_safety/SAF_I/POPUP/SAFIB0010Popup02.vue"
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import { isEmpty } from 'lodash-es'

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

const isCharger = ref(false)  //담당자확인

const sAFIB0020Popup01 = ref(null)
const sAFIB0010Popup02 = ref(null)
const MailPopup = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  QUARTER: '',
  BSNS_CD: '',
  ASGN_CD: '',
  BELONG:'',
  STATUS:'',
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

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    checkBar: { visible: true },
    edit: { editable: false },
    header: { height: 100 },
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
      dataType: 'text', 
      width: '50',
      header: { text: t('순위') },
    },
    { 
      fieldName: 'BSNS_NM', 
      dataType: 'text', 
      width: '120',
      header: { text: t('사업부') },
      mergeRule: { "criteria": "value" },
    },
    { 
      fieldName: 'PART_NM', 
      dataType: 'text', 
      width: '150',
      header: { text: t('담당') },
      mergeRule: { "criteria": "value" },
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
    },
    { 
      fieldName: 'ASGN_NM', 
      dataType: 'text',
      width: '150',
      header: { text: t('부서') },
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
    },
    { 
      fieldName: 'COMP_NM', 
      dataType: 'text', 
      width: '150',
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
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
      header: { text: t('재해지표(20점)') },
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
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
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
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
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
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
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
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
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
          ret.styleName = "right-error-column"
        }
        else {
          ret.styleName = "right-column"
        }

        return ret
      },
    },
    { 
      fieldName: 'MBL_WRK_ORD',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
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
    },
    { 
      fieldName: 'LGL_DOCS_CERTIFIED', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '100',
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
      numberFormat: "#,###.##", 
      width: '100',
      styleName: "right-column",
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
      numberFormat: "#,###.##",
      width: '100',
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
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
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
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
      header: { text: t('안전개입/안전작업 요구권(5점)') },
    },
    { 
      fieldName: 'ONST_ACTV',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
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
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
      header: { text: t('건강관리/ 보건시스템 활용(10점)') },
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
      numberFormat: "#,###.##",
      width: '100',
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
    },
    { 
      fieldName: 'EVAL_RESULTS', dataType: 'text', 
      width: '100',
      header: { text: t('평가결과') },
    },
    { 
      fieldName: 'RWD_HIST', dataType: 'text', 
      width: '100',
      styleName: "left-column",
      header: { text: t('포상이력') },
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
      fieldName: 'INSUF_ACTN', 
      dataType: 'number',
      numberFormat: "#,###",
      width: '60',
      styleName: "right-column",
      header: { text: t('미흡건수') },
    },
    { 
      fieldName: 'REMARK', dataType: 'text', 
      width: '200',
      styleName: "left-column",
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
    { fieldName: 'SENDMAIL_YN', dataType: 'text' , visible: false },
    { fieldName: 'CONFIRM_YN', dataType: 'text' , visible: false },
    { fieldName: 'E_MAIL', dataType: 'text' , visible: false },
    { fieldName: 'CHRG_CD', dataType: 'text' , visible: false },
    { fieldName: 'BELONG', dataType: 'text' , visible: false },
    { fieldName: 'GM_CONFIRM_YN', dataType: 'text' , visible: false },
  ],
  columns : [],
  columnLayout: [
    'RANKING',
    'BSNS_NM', 
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
    'RWD_HIST',
    'INSUF_ACTN',
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
  })  
})

// props 감지
watch(
  () => props.business01, newValue => {
    console.log('[watch01] : ', newValue)
    searchParams.BSNS_CD = props.business01
  },
)

watch(
  () => props.charger, newValue => {
    console.log('[watch-charger] : ', newValue)
    if(newValue === 'A') { //전체
      searchParams.CHRG_GRP = ''
    }
    else if(newValue === 'S') {
      searchParams.CHRG_GRP = 'S'
    }
    else if(newValue === 'G') {
      searchParams.CHRG_GRP = 'G'
    }
  },
)

//로그인 사용자 담당자 확인
const setCharger = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    ASGN_CD: userStore.asgnCd,
    EMP_NO: userStore.userId,
  }

  Promise.all([ 
    commonSearchApi({ queryId : 'SAFIB0010_SEARCH_EMP', param }) , 
  ]).then(res => {
    console.log('[setCharger] res = ', res)
    if(res[0].ORESULT_CUR.length === 0) {
      isCharger.value = false
      grdMain.value.getGridView().setCheckBar({ visible: false })
    }
    else {
      res[0].ORESULT_CUR.forEach( value => {

        console.log('[setCharger] value = ', value)

        //총괄 담당자 확정, 확정취소, 미흡조치 메일 버튼 활성화
        if(value.PS_GUBUN === 'PS00' || value.PS_GUBUN === 'PS10' ||
          value.PS_GUBUN === 'PS20' || value.PS_GUBUN === 'PS30' ||
          value.PS_GUBUN === 'PS40' || value.PS_GUBUN === 'PS50') {

          isCharger.value = true
          grdMain.value.getGridView().setCheckBar({ visible: true })
        }
        else {
          isCharger.value = false
          grdMain.value.getGridView().setCheckBar({ visible: false })
        }

        if(value.PS_GUBUN === 'PS00'){
        }
        else if(value.PS_GUBUN === 'PS10') {
          if(props.charger === 'A') { //전체
            searchParams.CHRG_GRP = ''
          }
          else {  //조선
            searchParams.CHRG_GRP = 'S'
          }
        }
        else if(value.PS_GUBUN === 'PS20') {
          searchParams.CHRG_GRP = 'G'
        }
      })
    }
  })
}

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if (btn.id === 'btnInsfNotiMail') {
    transMail()
  }
}

// 조회
const searchData = () =>{
  return commonSearchApi({ queryId : 'SAFIB0020_SEARCH_01', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  console.log(res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  searchParams.BELONG = res.ORESULT_CUR[0].BELONG
  searchParams.STATUS = res.ORESULT_CUR[0].STATUS

  customGridRowStyle()
  customGridCellStyle()
}

// 메일 전송
const transMail = () => {
  let mailForm = {
    TO_EMP_NO: [],
    TO_EMP_NM: [],
    M_TITLE: '',
    M_CONTENT: '',
  }

  let compDiv = ''
  let contents = ''
  let business_Temp = ''
  let business = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    console.log('INSUF_ACTN = ', data.INSUF_ACTN)

    if(data.INSUF_ACTN < 2) {
      return Message.warn(t(data.COMP_NM + '는 미흡 2회 이하 입니다.'))
    }
    else{
      if(data.INSUF_ACTN === 2) {
        contents += '미흡 2회(연속) :' + data.COMP_NM + '<br/>' + '- 협력사 안전관리자 지원금 50% 중단<br/>'
      }
      else if(data.INSUF_ACTN === 3) {
        contents += '미흡 3회(연속) :' + data.COMP_NM + '<br/>' + '- 협력사 재계약 심의대상 선정<br/>'
      }

      //체크된 사업부 저장
      if(business_Temp !== data.BSNS_CD) {
        business.push(data.BSNS_CD)
        business_Temp = data.BSNS_CD
        compDiv = data.CMPNY_DIV
      }
    }
  }

  // 체크된 사업부 담당자 정보 조회
  for (let cod of business) {
    const param = {
      CMPNY_DIV: compDiv,
      BSNS_CD: cod,
    }

    console.log('cod = ', cod)

    Promise.all([ 
      commonSearchApi({ queryId : 'SAFIB0020_SEARCH_04', param }) , 
    ]).then(res => {

      res[0].ORESULT_CUR.forEach( value => {
        console.log('[transMail] value : ', value)

        if(isEmpty(value.EMAIL)) {
          Message.warn(value.KOR_NM + '은(는) 이메일이 없습니다.')
        }
        else {
          mailForm.TO_EMP_NO.push(value.EMAIL)
          mailForm.TO_EMP_NM.push(value.KOR_NM)
        }
      })

      console.log('[transMail] mailForm : ', mailForm)

      mailForm.M_TITLE = '[HiSEs] 협력사 안전관리 수준평가 결과 미흡 조치건'
      mailForm.M_CONTENT = contents

      console.log('[transMail] mailForm : ', mailForm)

      if (mailForm.TO_EMP_NO.length > 0) {
        MailPopup.value.openPopup(mailForm)
      }
    })
  }
}

const complete = () => {
  onButtonsClick({ id :'btnSearch' })
}

const getQuarter  = date => {
  return Math.ceil((date.getMonth() + 1) / 3).toString()
}

defineExpose({
  onButtonsClick,
})

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)

  console.log('onCellItemClicked: ', col.field)
  if(col.field === 23) {
    if(data.SLF_EVAL_STUS === 'N') {
      return Message.err("업체 자체평가를 하지 않은 데이터 입니다.")
    } else {
      sAFIB0020Popup01.value.openPopup(data)
    }
  }
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType === 'data') {
    let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    searchParams.BELONG = row.BELONG
    searchParams.STATUS = row.STATUS

    if(isCharger.value) {
      if(row.INSUF_ACTN >= 2) {
        menuTitle.value.disableBtn("btnInsfNotiMail", false)
      }
      else {
        menuTitle.value.disableBtn("btnInsfNotiMail", true)
      }
    }
  }
}

const onCellDblClicked = () => {
  sAFIB0010Popup02.value.openPopup()
}

const customGridRowStyle = () => {

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = {}

    let value1 = grid.getValue(item.index, "RISK_ASSMN")
    let value2 = grid.getValue(item.index, "LGL_DOCS_CERTIFIED")
    let value3 = grid.getValue(item.index, "SFTY_EDCT")
    

    if(value1 < 10 || value2 < 0 || value3 < 5){
      ret.style = { background: "#FAED7D" }
    }

    return ret
  })
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
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"  
          :button-list="['btnSearch', 'btnInsfNotiMail']"
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
          width="200px"
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
          v-model="searchParams.BELONG"
          :label="$t('소속')"
          label-width="50px"
          width="450px"
          readonly
        />
        <i-input
          v-model="searchParams.STATUS"
          :label="$t('진행상태')"
          label-width="50px"
          width="250px"
          readonly
        />
      </v-sheet>
      <v-sheet 
        height="69%"
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
          @on-cell-dbl-clicked="onCellDblClicked"
        />
      </v-sheet>
    </div>
    <!-- 업체자체평가 팝업 -->
    <SAFIB0020Popup01
      ref="sAFIB0020Popup01" 
    />
    <!-- 평가협력사 근거 및 평가 기준 팝업 -->
    <SAFIB0010Popup02
      ref="sAFIB0010Popup02"
    />
    <SendMailPopup 
      ref="MailPopup" 
      @compleat="complete" 
    />
  </v-card-text>
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
    min-height: 400px;
  }
}
</style>