 <!-- MNGEE0020 반기별 이행점검 현황/분석 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import TAB01 from '@/pages/10_management/MNG_E/MNGEE0020_TAB01.vue'
import TAB02 from '@/pages/10_management/MNG_E/MNGEE0020_TAB02.vue'
import TAB03 from '@/pages/10_management/MNG_E/MNGEE0020_TAB03.vue'
import TAB04 from '@/pages/10_management/MNG_E/MNGEE0020_TAB04.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import { number } from 'echarts/core'


defineOptions({
  name:'10_management-MNG_E-MNGEE0020',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const logsStore = useLogsStore() 
const t = useI18n().t //다국어

const menuTitle = ref(null)
const tab = ref('tab_01')

const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
const tab04 = ref(null)

const approvalPopup = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  DEPT_CD: userStore.deptCd,
  YEAR: dayjs(new Date).get('year'),
  gbn: '',
  STATUS: '',
  INS_DATE_FROM: dayjs(dayjs(new Date).get('year') + '01' , '01').format('YYYY-MM-DD'),
  INS_DATE_TO: dayjs(new Date(dayjs(new Date).get('year') , 12 - 1 , '31')).format('YYYY-MM-DD'),
})

const gbnList = reactive([
  {COD: '', TXT: '전체'},
  {COD: 'A', TXT: '상반기'},
  {COD: 'B', TXT: '하반기'},
])

const HHIAF30 = ref([])    // 결재상태코드

const gbnChange = e => {
  if(e === 'A'){
    searchParams.INS_DATE_FROM = dayjs(searchParams.YEAR + '01' , '01').format('YYYY-MM-DD')
    searchParams.INS_DATE_TO = dayjs(new Date(searchParams.YEAR , 6 - 1 , '30')).format('YYYY-MM-DD')
  }else if(e === 'B') {
    searchParams.INS_DATE_FROM = dayjs(searchParams.YEAR + '07' , '01').format('YYYY-MM-DD')
    searchParams.INS_DATE_TO = dayjs(new Date(searchParams.YEAR , 12 - 1 , '31')).format('YYYY-MM-DD')
  }else {
    searchParams.INS_DATE_FROM = dayjs(searchParams.YEAR + '01' , '01').format('YYYY-MM-DD')
    searchParams.INS_DATE_TO = dayjs(new Date(searchParams.YEAR , 12 - 1 , '31')).format('YYYY-MM-DD')
  }
  
  onButtonsClick({ id: 'btnSearch' })
}

const onButtonsClick = btn => {
  try {
    if(btn.id === 'btnApply'){
      setApply()
    }

    if(tab.value === 'tab_01'){
      tab01.value.onButtonsClick({id: btn.id})
    }else if(tab.value === 'tab_02') {
      tab02.value.onButtonsClick({id: btn.id})
    }else if(tab.value === 'tab_03'){
      tab03.value.onButtonsClick({id: btn.id})
    }else {
      tab04.value.onButtonsClick({id: btn.id})
    }
  }catch (err) {
  }
  
}
const setApply = () => {
  let INS_DATE_FROM = dayjs(searchParams.INS_DATE_FROM).format('YYYYMMDD')
  let INS_DATE_TO = dayjs(searchParams.INS_DATE_TO).format('YYYYMMDD')
  const params = {
    INS_DATE_FROM: INS_DATE_FROM,
    INS_DATE_TO: INS_DATE_TO,
  }
  let setGrid = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns="http://www.w3.org/TR/REC-html40">

  <head>
  <meta http-equiv=Content-Type content="text/html; charset=ks_c_5601-1987">
  <style id="법조항별 지적 현황 (8)_3174_Styles">
  <!--table
    {mso-displayed-decimal-separator:"\.";
    mso-displayed-thousand-separator:"\,";}
  .xl633174
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:#4E545F;
    font-size:9.0pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border:.5pt solid black;
    background:lightgrey;
    mso-pattern:black none;
    white-space:normal;}
  .xl643174
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:black;
    font-size:9.0pt;
    font-weight:400;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:"\@";
    text-align:center;
    vertical-align:middle;
    border:.5pt solid black;
    background:white;
    mso-pattern:black none;
    white-space:nowrap;}
  .xl663174
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:#4E545F;
    font-size:9.0pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border-top:.5pt solid black;
    border-right:.5pt solid black;
    border-bottom:.5pt solid black;
    border-left:none;
    background:lightgrey;
    mso-pattern:black none;
    white-space:normal;}
  .xl683174
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:black;
    font-size:22pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:Calibri, sans-serif;
    mso-font-charset:0;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    mso-background-source:auto;
    mso-pattern:auto;
    white-space:normal;}
  .xl693174
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:#4E545F;
    font-size:9.0pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:#E8EAF2;
    mso-pattern:black none;
    white-space:normal;}
  ruby
    {ruby-align:left;}
  rt
    {color:windowtext;
    font-size:8.0pt;
    font-weight:400;
    font-style:normal;
    text-decoration:none;
    font-family:돋움, monospace;
    mso-font-charset:129;
    mso-char-type:none;}
  -->

  <!--table
    {mso-displayed-decimal-separator:"\.";
    mso-displayed-thousand-separator:"\,";}
  .xl6330031
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:black;
    font-size:22pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:Calibri, sans-serif;
    mso-font-charset:0;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    mso-background-source:auto;
    mso-pattern:auto;
    white-space:normal;}
  .xl6430031
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:#4E545F;
    font-size:9.0pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:#E8EAF2;
    mso-pattern:black none;
    white-space:normal;}
  .xl6530031
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:#4E545F;
    font-size:9.0pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:lightgrey;
    mso-pattern:black none;
    white-space:normal;}
  .xl6630031
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:black;
    font-size:9.0pt;
    font-weight:400;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:#FAFAFA;
    mso-pattern:black none;
    white-space:nowrap;}
  .xl7130031
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:black;
    font-size:9.0pt;
    font-weight:400;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:white;
    mso-pattern:black none;
    white-space:normal;}
  ruby
    {ruby-align:left;}
  rt
    {color:windowtext;
    font-size:8.0pt;
    font-weight:400;
    font-style:normal;
    text-decoration:none;
    font-family:돋움, monospace;
    mso-font-charset:129;
    mso-char-type:none;}
  -->

  <!--table
    {mso-displayed-decimal-separator:"\.";
    mso-displayed-thousand-separator:"\,";}
  .xl6313448
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:black;
    font-size:22pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:Calibri, sans-serif;
    mso-font-charset:0;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    mso-background-source:auto;
    mso-pattern:auto;
    white-space:normal;}
  .xl6413448
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:#4E545F;
    font-size:9.0pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:#E8EAF2;
    mso-pattern:black none;
    white-space:normal;}
  .xl6513448
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:#4E545F;
    font-size:9.0pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:lightgrey;
    mso-pattern:black none;
    white-space:normal;}
  .xl6813448
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:black;
    font-size:9.0pt;
    font-weight:400;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:"\#\,\#\#0\.0\#";
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:white;
    mso-pattern:black none;
    white-space:nowrap;}
  -->

  <!--table
    {mso-displayed-decimal-separator:"\.";
    mso-displayed-thousand-separator:"\,";}
  .xl6310912
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:black;
    font-size:22pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:Calibri, sans-serif;
    mso-font-charset:0;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    mso-background-source:auto;
    mso-pattern:auto;
    white-space:normal;}
  .xl6510912
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:#4E545F;
    font-size:9.0pt;
    font-weight:700;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:General;
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:lightgrey;
    mso-pattern:black none;
    white-space:normal;}
  .xl6710912
    {padding-top:1px;
    padding-right:1px;
    padding-left:1px;
    mso-ignore:padding;
    color:black;
    font-size:9.0pt;
    font-weight:400;
    font-style:normal;
    text-decoration:none;
    font-family:"Malgun Gothic", monospace;
    mso-font-charset:129;
    mso-number-format:"\@";
    text-align:center;
    vertical-align:middle;
    border:.5pt solid windowtext;
    background:white;
    mso-pattern:black none;
    white-space:nowrap;}
  -->

  </style>
  </head>

  <body>

  <div id="법조항별 지적 현황 (8)_3174" align=center x:publishsource="Excel">

  <table border=0 cellpadding=0 cellspacing=0 width=1806 style='border-collapse:
  collapse;table-layout:fixed;width:1357pt'>
  <col width=35 style='mso-width-source:userset;mso-width-alt:1280;width:26pt'>
  <tr height=66 style='mso-height-source:userset;height:50.1pt'>
    <td colspan=12 height=66 class=xl683174 width=1806 style='border-bottom:.5pt solid black;
    height:50.1pt;width:1357pt'>법조항별 지적 현황</td>
  </tr>
  <tr height=34 style='mso-height-source:userset;height:26.1pt'>
  <td rowspan=3 height=102 class=xl693174 width=35 style='height:78.3pt;
  border-top:none;width:26pt'>No.</td>
  <td rowspan=3 class=xl693174 width=161 style='border-top:none;width:121pt'>사업부</td>
  <td rowspan=3 class=xl693174 width=161 style='border-top:none;width:121pt'>부서</td>
  <td rowspan=3 class=xl693174 width=161 style='border-top:none;width:121pt'>지적건수</td>
  `

  let LAW_CD_list = []
  let tntList = []

  commonSearchApi({ queryId : 'MNGEE0020_APPROVAL_01', param: params }).then(res => {

    /* 법령 구분 */
    let header = res.ORESULT_CUR.filter((item , idx) => {
      return (res.ORESULT_CUR.findIndex((gbn) => {
        return item.HEADER === gbn.HEADER
      }) === idx )
    })

    /* 법령 개수에 맞게 추가 */
    header.forEach(e => {
      setGrid += `
        <td colspan=${e.HEADER_COUNT} class=xl693174 width=805 style='border-left:none;width:605pt'>${e.HEADER}</td>
      `
    })
    setGrid += `
      </tr>
      <tr height=34 style='mso-height-source:userset;height:26.1pt'>
    `

    /* 조항 추가 */
    res.ORESULT_CUR.forEach(e => {
      setGrid += `
      <td height=34 class=xl693174>${e.JOHANG ? e.JOHANG : ''}</td>
      `

      LAW_CD_list.push("'" + e.LAW_CD + "'")
      tntList.push(0)
    })
    setGrid += `
    </tr> 
    <tr height=34 style='mso-height-source:userset;height:26.1pt'>
    `
    
    /* 조문 추가 */
    res.ORESULT_CUR.forEach(e => {
      setGrid += `
      <td class=xl693174>${e.JOMUN ? e.JOMUN : ''}</td>
      `
    })
    setGrid += `
    </tr> 
    `

    let ji_tnt = 0
    /* 그리드 데이터 추가 */
    res.ORESULT_CUR2.forEach((e, idx) => {
      setGrid += `
      <tr height=17 style='height:12.75pt'>
        <td class=xl643174>${idx + 1}</td>
        <td class=xl643174>${e.BSNS_NM}</td>
        <td class=xl643174>${e.DEPT_NM}</td>
        <td class=xl643174>${e.FAIL_CNT}</td>
      `
      ji_tnt += e.FAIL_CNT
      LAW_CD_list.forEach((item,idx) => {
        setGrid += `<td class=xl643174>${e[item] === 0 ? '' : e[item]}</td>`
        tntList[idx] += e[item] ? Number(e[item]) : 0
      })
      setGrid += `
        </tr>
        
      `
    })

    setGrid += `
      <tr height=17 style='height:12.75pt'>
        <td class=xl643174></td>
        <td colspan=2 class=xl643174>전사합계</td>
        <td class=xl643174>${ji_tnt}</td>
    `
    tntList.forEach(e => {
      setGrid += `
        <td class=xl643174>${e}</td>
      `
    })

    setGrid += `
      </tr>
    `

    /* 관계법령별 지적 건수 추가  */
    setGrid += `
    </table>
    <br />
    <br />
    <table border=0 cellpadding=0 cellspacing=0 width=1806 style='border-collapse:
    collapse;table-layout:fixed;width:1356pt'>
    <col width=35 style='mso-width-source:userset;mso-width-alt:1280;width:26pt'>
    <col width=357 style='mso-width-source:userset;mso-width-alt:13056;width:268pt'>
    <col width=350 style='mso-width-source:userset;mso-width-alt:12800;width:263pt'>
    <col width=357 style='mso-width-source:userset;mso-width-alt:13056;width:268pt'>
    <col width=350 style='mso-width-source:userset;mso-width-alt:12800;width:263pt'>
    <col width=357 style='mso-width-source:userset;mso-width-alt:13056;width:268pt'>
    <tr height=66 style='mso-height-source:userset;height:50.1pt'>
      <td colspan=6 height=66 class=xl6330031 width=1806 style='height:50.1pt;
      width:1356pt'>관계법령별 지적 건수</td>
    </tr>
    <tr height=35 style='mso-height-source:userset;height:26.25pt'>
      <td height=35 class=xl6430031 width=35 style='height:26.25pt;width:26pt'>No.</td>
      <td class=xl6430031 width=357 style='border-left:none;width:268pt'>구분</td>
      <td class=xl6430031 width=350 style='border-left:none;width:263pt'>지적건수</td>
      <td class=xl6430031 width=357 style='border-left:none;width:268pt'>점유율(%)</td>
      <td class=xl6430031 width=350 style='border-left:none;width:263pt'>조치건수</td>
      <td class=xl6430031 width=357 style='border-left:none;width:268pt'>조치율</td>
    </tr>
    `
    let FAIL_CNT = 0
    let OCC_RATE = 0
    let COMP_CNT = 0
    let COMP_RATE = 0
    res.ORESULT_CUR3.forEach((e, idx) => {
      setGrid += `
        <tr height=17 style='height:12.75pt'>
          <td height=17 class=xl6630031>${idx + 1}</td>
          <td height=17 class=xl6630031>${e.SYS_CDNM}</td>
          <td height=17 class=xl6630031>${e.FAIL_CNT}</td>
          <td height=17 class=xl6630031>${e.OCC_RATE.toFixed(2)} %</td>
          <td height=17 class=xl6630031>${e.COMP_CNT}</td>
          <td height=17 class=xl6630031>${e.COMP_RATE.toFixed(2)} %</td>
        </tr>
      `
      FAIL_CNT += e.FAIL_CNT
      OCC_RATE += e.OCC_RATE
      COMP_CNT += e.COMP_CNT
      COMP_RATE += e.COMP_RATE
    })

    /* 합계 추가 */
    setGrid += `
      <tr height=32>
        <td height=32 class=xl7130031></td>
        <td class=xl7130031>합계</td>
        <td class=xl7130031>${FAIL_CNT}</td>
        <td class=xl7130031>${OCC_RATE.toFixed(2)} %</td>
        <td class=xl7130031>${COMP_CNT}</td>
        <td class=xl7130031>${(COMP_RATE / res.ORESULT_CUR3.length).toFixed(2)} %</td>
      </tr>
      </table>
      <br />
      <br />
    `
    
    /* 부서별 시정조치 현황 추가 */
    setGrid += `
    <table border=0 cellpadding=0 cellspacing=0 width=1806 style='border-collapse:
    collapse;table-layout:fixed;width:1356pt'>
    <col width=35 style='mso-width-source:userset;mso-width-alt:1280;width:26pt'>
    <col width=357 style='mso-width-source:userset;mso-width-alt:13056;width:268pt'>
    <col width=350 style='mso-width-source:userset;mso-width-alt:12800;width:263pt'>
    <col width=357 style='mso-width-source:userset;mso-width-alt:13056;width:268pt'>
    <col width=350 style='mso-width-source:userset;mso-width-alt:12800;width:263pt'>
    <col width=357 style='mso-width-source:userset;mso-width-alt:13056;width:268pt'>
    <tr height=66 style='mso-height-source:userset;height:50.1pt'>
      <td colspan=6 height=66 class=xl6313448 width=1806 style='height:50.1pt;
      width:1356pt'>부서별 시정조치 현황</td>
    </tr>
    <tr height=35 style='mso-height-source:userset;height:26.25pt'>
      <td height=35 class=xl6413448 width=35 style='height:26.25pt;width:26pt'>No.</td>
      <td class=xl6413448 width=357 style='border-left:none;width:268pt'>사업부</td>
      <td class=xl6413448 width=350 style='border-left:none;width:263pt'>부서</td>
      <td class=xl6413448 width=357 style='border-left:none;width:268pt'>부적합 건수</td>
      <td class=xl6413448 width=350 style='border-left:none;width:263pt'>시정 건수</td>
      <td class=xl6413448 width=357 style='border-left:none;width:268pt'>시정완료율</td>
    </tr>
    `
    FAIL_CNT = 0
    COMP_CNT = 0
    COMP_RATE = 0
    res.ORESULT_CUR4.forEach((e, idx) => {
      setGrid += `
        <tr height=17 style='height:12.75pt'>
          <td height=17 class=xl6813448>${idx + 1}</td>
          <td height=17 class=xl6813448>${e.BSNS_NM}</td>
          <td height=17 class=xl6813448>${e.DEPT_NM}</td>
          <td height=17 class=xl6813448>${e.FAIL_CNT}</td>
          <td height=17 class=xl6813448>${e.COMP_CNT}</td>
          <td height=17 class=xl6813448>${e.COMP_RATE.toFixed(2)} %</td>
        </tr>
      `
      FAIL_CNT += e.FAIL_CNT
      COMP_CNT += e.COMP_CNT
      COMP_RATE += e.COMP_RATE
    })
    /* 합계 추가 */
    setGrid += `
      <tr height=32>
        <td height=32 class=xl6813448></td>
        <td colspan=2 class=xl6813448>합계</td>
        <td class=xl6813448>${FAIL_CNT}</td>
        <td class=xl6813448>${COMP_CNT}</td>
        <td class=xl6813448>${(COMP_RATE / res.ORESULT_CUR4.length).toFixed(2)} %</td>
      </tr>
      </table>
      <br />
      <br />
    `

    /* 조치 진행중인 사항 추가 */
    setGrid += `
    <table border=0 cellpadding=0 cellspacing=0 width=1596 style='border-collapse:
    collapse;table-layout:fixed;width:1356pt'>
    <col width=35 style='mso-width-source:userset;mso-width-alt:1280;width:26pt'>
    <col width=259 span=2 style='mso-width-source:userset;mso-width-alt:9472;
    width:194pt'>
    <col width=392 span=2 style='mso-width-source:userset;mso-width-alt:14336;
    width:294pt'>
    <col width=259 style='mso-width-source:userset;mso-width-alt:9472;width:194pt'>
    <tr height=66 style='mso-height-source:userset;height:50.1pt'>
      <td colspan=6 height=66 class=xl6310912 width=1596 style='height:50.1pt;
      width:1356pt'>반기별 이행점검 현황/분석</td>
    </tr>
    <tr height=30 style='mso-height-source:userset;height:22.5pt'>
      <td rowspan=2 height=60 class=xl6413448 width=35 style='height:45.0pt;
      width:26pt'>No.</td>
      <td rowspan=2 class=xl6413448 width=259 style='width:194pt'>수검부서(장소)</td>
      <td rowspan=2 class=xl6413448 width=259 style='width:194pt'>점검일자</td>
      <td class=xl6413448 width=392 style='border-left:none;width:294pt'>점검 결과 부적합
      내용</td>
      <td class=xl6413448 width=392 style='border-left:none;width:294pt'>시정조치(예정)</td>
      <td rowspan=2 class=xl6413448 width=259 style='width:194pt'>조치(예정)일</td>
    </tr>
    <tr height=30 style='mso-height-source:userset;height:22.5pt'>
      <td height=30 class=xl6413448 width=392 style='height:22.5pt;border-top:none;
      border-left:none;width:294pt'>내용</td>
      <td class=xl6413448 width=392 style='border-top:none;border-left:none;
      width:294pt'>내용</td>
    </tr>
    `
    res.ORESULT_CUR5.forEach((e, idx) => {
      setGrid += `
        <tr height=17 style='height:12.75pt'>
          <td height=17 class=xl6710912>${idx + 1}</td>
          <td height=17 class=xl6710912>${e.DEPT_NM}</td>
          <td height=17 class=xl6710912>${e.INS_DATE ? dayjs(e.INS_DATE).format('YYYY-MM-DD') : '' }</td>
          <td height=17 class=xl6710912>${e.FAIL_CONTENT ? e.FAIL_CONTENT : ''}</td>
          <td height=17 class=xl6710912>${e.SOL_CONTENT ? e.SOL_CONTENT : ''}</td>
          <td height=17 class=xl6710912>${e.SOL_DATE ? dayjs(e.SOL_DATE).format('YYYY-MM-DD') : ''}</td>
        </tr>
      `
    })

    setGrid += `
    </table>
    </div>
    </body>
    </html>
    `
  }).finally(() => {
    
    approvalPopup.value.openPopup({
      CLSS_ID: logsStore.vueId,
      TITLE: '반기별 이행점검 현황/분석',
      CMPNY_DIV : userStore.cmpnyDiv,
      DATA_KEY:
        searchParams.CMPNY_DIV +
        ";" +
        searchParams.BSNS_CD +
        ";" +
        searchParams.BSNS_CD +
        ";" +
        new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      REPORT : setGrid, 
      MODE : '3', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      CLRLINE : 'CLR_15', //결재라인
    })
    
  })
}

const reSet = () => {
  searchParams.gbn = ''
  searchParams.INS_DATE_FROM = dayjs(searchParams.YEAR + '01' , '01').format('YYYY-MM-DD')
  searchParams.INS_DATE_TO = dayjs(new Date(searchParams.YEAR , 12 - 1 , '31')).format('YYYY-MM-DD')
}

const tabChange = e => {
  onButtonsClick({ id: 'btnSearch' })
}

const initCodeList = () => {
}

onMounted(() => {
  initCodeList()    
  // onButtonsClick({ id: 'btnSearch' })
})

</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnPrint', 'btnApply']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area p-relative">
      <v-sheet class="content-body flex-nowrap" min-height="700">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('년도')"
            labelWidth="30px"
            v-model="searchParams.YEAR"
            type="Number"
            width="300px"
            @update:modelValue="reSet"
          />
          <i-select
            :label="$t('상/하반기')"
            labelWidth="70px"
            v-model="searchParams.gbn"
            :items="gbnList"
            item-title="TXT"
            item-value="COD"
            width="300px"
            @update:modelValue="gbnChange"
          />
          <i-input
            :label="$t('점검일자')"
            labelWidth="70px"
            v-model="searchParams.INS_DATE_FROM"
            type="date"
            width="370px"
            margin="4px"
          />
          <i-input
            v-model="searchParams.INS_DATE_TO"
            type="date"
            width="300px"
          />
        </v-sheet>
        <v-sheet class="flex-column">
          <VTabs v-model="tab" @update:model-value="tabChange">
            <VTab value="tab_01">법조항별 지적 현황</VTab>
            <VTab value="tab_02">지적 내용 통계</VTab>
            <VTab value="tab_03">부서별 시정조치 현황</VTab>
            <VTab value="tab_04">조치 진행중인 사항</VTab>
          </VTabs>
          <VWindow v-model="tab">
            <VWindowItem value="tab_01"><TAB01 ref="tab01" :searchParams="searchParams" /></VWindowItem> 
            <VWindowItem value="tab_02"><TAB02 ref="tab02" :searchParams="searchParams" /></VWindowItem> 
            <VWindowItem value="tab_03"><TAB03 ref="tab03" :searchParams="searchParams" /></VWindowItem> 
            <VWindowItem value="tab_04"><TAB04 ref="tab04" :searchParams="searchParams" /></VWindowItem> 
          </VWindow>
        </v-sheet>
      </v-sheet>
    </v-card-text> 
  </v-card>
  <ApprovalPopup ref="approvalPopup" />
</template>

<style scoped lang="scss">
.content-area {
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
}
</style>