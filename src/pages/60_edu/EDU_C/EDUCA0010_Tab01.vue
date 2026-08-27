<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import IGridTitle from "@/components/IGridTitle.vue";
const vm = getCurrentInstance().proxy //다이얼로그관련
import ILabel from "@/components/ILabel.vue";
import RealGrid from "@/components/RealGrid.vue";
import dayjs from "dayjs";
import html2canvas from 'html2canvas'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import Message from "@hiway/utils/notify"

defineOptions({
  name: "60_edu-EDU_C-EDUCA0010_Tab01",
});

const t = useI18n().t; //다국어
const menuTitle = ref(null);
const grdFirst1 = ref(null);
const grdFirst2 = ref(null);
const grdFirst3 = ref(null);
const grdSecond1 = ref(null);
const grdSecond2 = ref(null);
const grdSecond3 = ref(null);
const grdSub = ref(null);
const grdExcel = ref(null);
const userStore = useUserStore() 
const isShow1 = ref(false)
const isShow2 = ref(false)


/* 코드 리스트 1 */
const codeListFirst = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  WORK_YR: [],
  YEAR_DATE: [], //년도별 조회 콤보박스
  COLOR_LIST: [], //조회 조건 색상 
})

/* 코드 리스트 2 */
const codeListSecond = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  WORK_YR: [],
  YEAR_DATE: [], //년도별 조회 콤보박스
  COLOR_LIST: [], //조회 조건 색상 
})


/* 조회 조건 1 */
const searchParams1 = reactive({
  TASK_NO: dayjs(new Date()).format('YYYY'),
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  WORK_YR: '',
  JOB_TIT: '',
  SEARCH_COLOR: 'rgb(255,255,0)', //조회 조건 색상 
  TOT_COLOR: 'rgb(0,0,255)',
})


/* 조회 조건 2 */
const searchParams2 = reactive({
  TASK_NO: dayjs(new Date()).format('YYYY'), //년도별 조회 콤보박스
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  WORK_YR: '',
  JOB_TIT: '',
  SEARCH_COLOR: 'rgb(0,128,0)', //조회 조건 색상 
  TOT_COLOR: 'rgb(0,0,255)',
})

const COLOR_LIST = [
	{ COD:"rgb(240,248,255)" ,TXT: 'AliceBlue' },
	{ COD:"rgb(250,235,215)" ,TXT: 'AntiqueWhite' },
	{ COD:"rgb(0,255,255)" ,TXT: 'Aqua' },
	{ COD:"rgb(127,255,212)" ,TXT: 'Aquamarine' },
	{ COD:"rgb(240,255,255)" ,TXT: 'Azure' },
	{ COD:"rgb(245,245,220)" ,TXT: 'Beige' },
	{ COD:"rgb(255,228,196)" ,TXT: 'Bisque' },
	{ COD:"rgb(0,0,0)" ,TXT: 'Black' },
	{ COD:"rgb(255,235,205)" ,TXT: 'BlanchedAlmond' },
	{ COD:"rgb(0,0,255)" ,TXT: 'Blue' },
	{ COD:"rgb(138,43,226)" ,TXT: 'BlueViolet' },
	{ COD:"rgb(165,42,42)" ,TXT: 'Brown' },
	{ COD:"rgb(222,184,135)" ,TXT: 'BurlyWood' },
	{ COD:"rgb(95,158,160)" ,TXT: 'CadetBlue' },
	{ COD:"rgb(127,255,0)" ,TXT: 'Chartreuse' },
	{ COD:"rgb(210,105,30)" ,TXT: 'Chocolate' },
	{ COD:"rgb(255,127,80)" ,TXT: 'Coral' },
	{ COD:"rgb(100,149,237)" ,TXT: 'CornflowerBlue' },
	{ COD:"rgb(255,248,220)" ,TXT: 'Cornsilk' },
	{ COD:"rgb(220,20,60)" ,TXT: 'Crimson' },
	{ COD:"rgb(0,255,255)" ,TXT: 'Cyan' },
	{ COD:"rgb(0,0,139)" ,TXT: 'DarkBlue' },
	{ COD:"rgb(0,139,139)" ,TXT: 'DarkCyan' },
	{ COD:"rgb(184,134,11)" ,TXT: 'DarkGoldenrod' },
	{ COD:"rgb(169,169,169)" ,TXT: 'DarkGray' },
	{ COD:"rgb(0,100,0)" ,TXT: 'DarkGreen' },
	{ COD:"rgb(189,183,107)" ,TXT: 'DarkKhaki' },
	{ COD:"rgb(139,0,139)" ,TXT: 'DarkMagenta' },
	{ COD:"rgb(85,107,47)" ,TXT: 'DarkOliveGreen' },
	{ COD:"rgb(255,140,0)" ,TXT: 'DarkOrange' },
	{ COD:"rgb(153,50,204)" ,TXT: 'DarkOrchid' },
	{ COD:"rgb(139,0,0)" ,TXT: 'DarkRed' },
	{ COD:"rgb(233,150,122)" ,TXT: 'DarkSalmon' },
	{ COD:"rgb(143,188,139)" ,TXT: 'DarkSeaGreen' },
	{ COD:"rgb(72,61,139)" ,TXT: 'DarkSlateBlue' },
	{ COD:"rgb(47,79,79)" ,TXT: 'DarkSlateGray' },
	{ COD:"rgb(0,206,209)" ,TXT: 'DarkTurquoise' },
	{ COD:"rgb(148,0,211)" ,TXT: 'DarkViolet' },
	{ COD:"rgb(255,20,147)" ,TXT: 'DeepPink' },
	{ COD:"rgb(0,191,255)" ,TXT: 'DeepSkyBlue' },
	{ COD:"rgb(105,105,105)" ,TXT: 'DimGray' },
	{ COD:"rgb(30,144,255)" ,TXT: 'DodgerBlue' },
	{ COD:"rgb(178,34,34)" ,TXT: 'Firebrick' },
	{ COD:"rgb(255,250,240)" ,TXT: 'FloralWhite' },
	{ COD:"rgb(34,139,34)" ,TXT: 'ForestGreen' },
	{ COD:"rgb(255,0,255)" ,TXT: 'Fuchsia' },
	{ COD:"rgb(220,220,220)" ,TXT: 'Gainsboro' },
	{ COD:"rgb(248,248,255)" ,TXT: 'GhostWhite' },
	{ COD:"rgb(255,215,0)" ,TXT: 'Gold' },
	{ COD:"rgb(218,165,32)" ,TXT: 'Goldenrod' },
	{ COD:"rgb(128,128,128)" ,TXT: 'Gray' },
	{ COD:"rgb(0,128,0)" ,TXT: 'Green' },
	{ COD:"rgb(173,255,47)" ,TXT: 'GreenYellow' },
	{ COD:"rgb(240,255,240)" ,TXT: 'Honeydew' },
	{ COD:"rgb(255,105,180)" ,TXT: 'HotPink' },
	{ COD:"rgb(205,92,92)" ,TXT: 'IndianRed' },
	{ COD:"rgb(75,0,130)" ,TXT: 'Indigo' },
	{ COD:"rgb(255,255,240)" ,TXT: 'Ivory' },
	{ COD:"rgb(240,230,140)" ,TXT: 'Khaki' },
	{ COD:"rgb(230,230,250)" ,TXT: 'Lavender' },
	{ COD:"rgb(255,240,245)" ,TXT: 'LavenderBlush' },
	{ COD:"rgb(124,252,0)" ,TXT: 'LawnGreen' },
	{ COD:"rgb(255,250,205)" ,TXT: 'LemonChiffon' },
	{ COD:"rgb(173,216,230)" ,TXT: 'LightBlue' },
	{ COD:"rgb(240,128,128)" ,TXT: 'LightCoral' },
	{ COD:"rgb(224,255,255)" ,TXT: 'LightCyan' },
	{ COD:"rgb(250,250,210)" ,TXT: 'LightGoldenrodYellow' },
	{ COD:"rgb(144,238,144)" ,TXT: 'LightGreen' },
	{ COD:"rgb(211,211,211)" ,TXT: 'LightGray' },
	{ COD:"rgb(255,182,193)" ,TXT: 'LightPink' },
	{ COD:"rgb(255,160,122)" ,TXT: 'LightSalmon' },
	{ COD:"rgb(32,178,170)" ,TXT: 'LightSeaGreen' },
	{ COD:"rgb(135,206,250)" ,TXT: 'LightSkyBlue' },
	{ COD:"rgb(119,136,153)" ,TXT: 'LightSlateGray' },
	{ COD:"rgb(176,196,222)" ,TXT: 'LightSteelBlue' },
	{ COD:"rgb(255,255,224)" ,TXT: 'LightYellow' },
	{ COD:"rgb(0,255,0)" ,TXT: 'Lime' },
	{ COD:"rgb(50,205,50)" ,TXT: 'LimeGreen' },
	{ COD:"rgb(250,240,230)" ,TXT: 'Linen' },
	{ COD:"rgb(255,0,255)" ,TXT: 'Magenta' },
	{ COD:"rgb(128,0,0)" ,TXT: 'Maroon' },
	{ COD:"rgb(102,205,170)" ,TXT: 'MediumAquamarine' },
	{ COD:"rgb(0,0,205)" ,TXT: 'MediumBlue' },
	{ COD:"rgb(186,85,211)" ,TXT: 'MediumOrchid' },
	{ COD:"rgb(147,112,219)" ,TXT: 'MediumPurple' },
	{ COD:"rgb(60,179,113)" ,TXT: 'MediumSeaGreen' },
	{ COD:"rgb(123,104,238)" ,TXT: 'MediumSlateBlue' },
	{ COD:"rgb(0,250,154)" ,TXT: 'MediumSpringGreen' },
	{ COD:"rgb(72,209,204)" ,TXT: 'MediumTurquoise' },
	{ COD:"rgb(199,21,133)" ,TXT: 'MediumVioletRed' },
	{ COD:"rgb(25,25,112)" ,TXT: 'MidnightBlue' },
	{ COD:"rgb(245,255,250)" ,TXT: 'MintCream' },
	{ COD:"rgb(255,228,225)" ,TXT: 'MistyRose' },
	{ COD:"rgb(255,228,181)" ,TXT: 'Moccasin' },
	{ COD:"rgb(255,222,173)" ,TXT: 'NavajoWhite' },
	{ COD:"rgb(0,0,128)" ,TXT: 'Navy' },
	{ COD:"rgb(253,245,230)" ,TXT: 'OldLace' },
	{ COD:"rgb(128,128,0)" ,TXT: 'Olive' },
	{ COD:"rgb(107,142,35)" ,TXT: 'OliveDrab' },
	{ COD:"rgb(255,165,0)" ,TXT: 'Orange' },
	{ COD:"rgb(255,69,0)" ,TXT: 'OrangeRed' },
	{ COD:"rgb(218,112,214)" ,TXT: 'Orchid' },
	{ COD:"rgb(238,232,170)" ,TXT: 'PaleGoldenrod' },
	{ COD:"rgb(152,251,152)" ,TXT: 'PaleGreen' },
	{ COD:"rgb(175,238,238)" ,TXT: 'PaleTurquoise' },
	{ COD:"rgb(219,112,147)" ,TXT: 'PaleVioletRed' },
	{ COD:"rgb(255,239,213)" ,TXT: 'PapayaWhip' },
	{ COD:"rgb(255,218,185)" ,TXT: 'PeachPuff' },
	{ COD:"rgb(205,133,63)" ,TXT: 'Peru' },
	{ COD:"rgb(255,192,203)" ,TXT: 'Pink' },
	{ COD:"rgb(221,160,221)" ,TXT: 'Plum' },
	{ COD:"rgb(176,224,230)" ,TXT: 'PowderBlue' },
	{ COD:"rgb(128,0,128)" ,TXT: 'Purple' },
	{ COD:"rgb(255,0,0)" ,TXT: 'Red' },
	{ COD:"rgb(188,143,143)" ,TXT: 'RosyBrown' },
	{ COD:"rgb(65,105,225)" ,TXT: 'RoyalBlue' },
	{ COD:"rgb(139,69,19)" ,TXT: 'SaddleBrown' },
	{ COD:"rgb(250,128,114)" ,TXT: 'Salmon' },
	{ COD:"rgb(244,164,96)" ,TXT: 'SandyBrown' },
	{ COD:"rgb(46,139,87)" ,TXT: 'SeaGreen' },
	{ COD:"rgb(255,245,238)" ,TXT: 'SeaShell' },
	{ COD:"rgb(160,82,45)" ,TXT: 'Sienna' },
	{ COD:"rgb(192,192,192)" ,TXT: 'Silver' },
	{ COD:"rgb(135,206,235)" ,TXT: 'SkyBlue' },
	{ COD:"rgb(106,90,205)" ,TXT: 'SlateBlue' },
	{ COD:"rgb(112,128,144)" ,TXT: 'SlateGray' },
	{ COD:"rgb(255,250,250)" ,TXT: 'Snow' },
	{ COD:"rgb(0,255,127)" ,TXT: 'SpringGreen' },
	{ COD:"rgb(70,130,180)" ,TXT: 'SteelBlue' },
	{ COD:"rgb(210,180,140)" ,TXT: 'Tan' },
	{ COD:"rgb(0,128,128)" ,TXT: 'Teal' },
	{ COD:"rgb(216,191,216)" ,TXT: 'Thistle' },
	{ COD:"rgb(255,99,71)" ,TXT: 'Tomato' },
	{ COD:"rgb(64,224,208)" ,TXT: 'Turquoise' },
	{ COD:"rgb(238,130,238)" ,TXT: 'Violet' },
	{ COD:"rgb(245,222,179)" ,TXT: 'Wheat' },
	{ COD:"rgb(255,255,255)" ,TXT: 'White' },
	{ COD:"rgb(245,245,245)" ,TXT: 'WhiteSmoke' },
	{ COD:"rgb(255,255,0)" ,TXT: 'Yellow' },
	{ COD:"rgb(154,205,50)" ,TXT: 'YellowGreen' },

]

// 차트 데이터
// 조회 조건 1 
let DATA_1 = reactive([]) //대상별 데이터

// 조회 조건 2
let DATA_2 = reactive([]) // 대상별 데이터

let DATA_3 = reactive([]) // 전사 데이터

let GRID_DATA = reactive([
  {GBN: '차이',COL1: 0,COL2: 0,COL3: 0,COL4: 0,COL5: 0,COL6: 0,COL7: 0,COL8: 0,COL9: 0,COL10: 0,COL11: 0,COL12: 0,},
  // {GBN: '장점',COL1: '',COL2: '',COL3: '',COL4: '',COL5: '',COL6: '',COL7: '',COL8: '',COL9: '',COL10: '',COL11: '',COL12: '',},
  // {GBN: '약점',COL1: '',COL2: '',COL3: '',COL4: '',COL5: '',COL6: '',COL7: '',COL8: '',COL9: '',COL10: '',COL11: '',COL12: '',},
])

const grdFirstProps1 = reactive({
  gridViewOption : { checkBar: { visible: true },edit: { editable: false } },
  fields: [{ fieldName: "TXT", dataType: "text", header: { text: t("부서명") } }
  ,{ fieldName: "COD", dataType: "text", visible: false}],
  columns: [],
});

const grdFirstProps2 = reactive({
  gridViewOption : { checkBar: { visible: true } ,edit: { editable: false }},
  fields: [{ fieldName: "TXT", dataType: "text", header: { text: t("직급명") } }
  ,{ fieldName: "COD", dataType: "text", visible: false}],
  columns: [],
});

const grdFirstProps3 = reactive({
  gridViewOption : { checkBar: { visible: true } ,edit: { editable: false }},
  fields: [{ fieldName: "TXT", dataType: "text", header: { text: t("직급명") } }
  ,{ fieldName: "COD", dataType: "text", visible: false}],
  columns: [],
});

const grdSecondProps1 = reactive({
  gridViewOption : { checkBar: { visible: true } ,edit: { editable: false }},
  fields: [{ fieldName: "TXT", dataType: "text", header: { text: t("부서명") } }
  ,{ fieldName: "COD", dataType: "text", visible: false}],
  columns: [],
});

const grdSecondProps2 = reactive({
  gridViewOption : { checkBar: { visible: true } ,edit: { editable: false }},
  fields: [{ fieldName: "TXT", dataType: "text", header: { text: t("직급명") } }
  ,{ fieldName: "COD", dataType: "text", visible: false}],
  columns: [],
});

const grdSecondProps3 = reactive({
  gridViewOption : { checkBar: { visible: true } ,edit: { editable: false }},
  fields: [{ fieldName: "TXT", dataType: "text", header: { text: t("직급명") } }
  ,{ fieldName: "COD", dataType: "text", visible: false}]
  ,
  columns: [],
}); 


const grdSubProps = reactive({
  gridViewOption : {rowIndicator: {visible: false } ,edit: { editable: false }},
  fields: [
  { fieldName: "GBN", dataType: "text", header: { text: t("구분") } }
  ,{ fieldName: "COL1", dataType: "text", header: { text: t("리더쉽") } }
  ,{ fieldName: "COL2", dataType: "text", header: { text: t("안전의식") } }
  ,{ fieldName: "COL3", dataType: "text", header: { text: t("의사소통") } }
  ,{ fieldName: "COL4", dataType: "text", header: { text: t("교육/훈련") } }
  ,{ fieldName: "COL5", dataType: "text", header: { text: t("안전조직") } }
  ,{ fieldName: "COL6", dataType: "text", header: { text: t("성과/동기") } }
  ,{ fieldName: "COL7", dataType: "text", header: { text: t("위험관리") } }
  ,{ fieldName: "COL8", dataType: "text", header: { text: t("절차준수") } }
  ,{ fieldName: "COL9", dataType: "text", header: { text: t("사고조사") } }
  ,{ fieldName: "COL10", dataType: "text", header: { text: t("시정조치") } }
  ,{ fieldName: "COL11", dataType: "text", header: { text: t("협력사관리") } }
  ,{ fieldName: "COL12", dataType: "text", header: { text: t("신뢰") } }
  ],
  columns: [],
});


// 부서별 데이터 엑셀 출력용 그리드
const grdExcelProps = reactive({
  gridViewOption : {rowIndicator: {visible: false } ,edit: { editable: false }},
  fields: [
  { fieldName: "DEPT_CD", dataType: "text", header: { text: t("항목") } }
  ,{ fieldName: "CA_020", dataType: "text", header: { text: t("리더쉽") } }
  ,{ fieldName: "CA_030", dataType: "text", header: { text: t("안전의식") } }
  ,{ fieldName: "CA_040", dataType: "text", header: { text: t("의사소통") } }
  ,{ fieldName: "CA_050", dataType: "text", header: { text: t("교육/훈련") } }
  ,{ fieldName: "CA_060", dataType: "text", header: { text: t("안전조직") } }
  ,{ fieldName: "CA_070", dataType: "text", header: { text: t("성과/동기") } }
  ,{ fieldName: "CA_080", dataType: "text", header: { text: t("위험관리") } }
  ,{ fieldName: "CA_090", dataType: "text", header: { text: t("절차준수") } }
  ,{ fieldName: "CA_100", dataType: "text", header: { text: t("사고조사") } }
  ,{ fieldName: "CA_110", dataType: "text", header: { text: t("시정조치") } }
  ,{ fieldName: "CA_120", dataType: "text", header: { text: t("협력사관리") } }
  ,{ fieldName: "CA_130", dataType: "text", header: { text: t("신뢰") } }
  ],
  columns: [],
});

// 그리드 데이터 버퍼
let data1 = [];

let data2 = [];

let data3 = [];

// 조회 조건 1번
grdFirstProps1.columns = grdFirstProps1.fields;
grdFirstProps2.columns = grdFirstProps2.fields;
grdFirstProps3.columns = grdFirstProps3.fields;

// 조회 조건 2번
grdSecondProps1.columns = grdSecondProps1.fields;
grdSecondProps2.columns = grdSecondProps2.fields;
grdSecondProps3.columns = grdSecondProps3.fields;

// 하단 비교 그리드
grdSubProps.columns = grdSubProps.fields;

// 부서별 데이터 엑셀 출력용 그리드
grdExcelProps.columns = grdExcelProps.fields;

onMounted(() => {
  Promise.all([ 
      // 콤보 데이터 
      commonSearchApi({ 
        queryId : 'EDUCA0010_SEARCH_08',
        param: {
          TASK_NO: dayjs(new Date()).format('YYYY')
          , CMPNY_DIV: userStore.cmpnyDiv  
        }
      }),
    ]).then(res => { 
      console.log('res',res)
      console.log('res.ORESULT_CUR1',res[0].ORESULT_CUR1)
      if(!res[0].ORESULT_CUR1){
        res[0].ORESULT_CUR1 = []
      }
      if(!res[0].ORESULT_CUR2){
        res[0].ORESULT_CUR2 = []
      }
      if(!res[0].ORESULT_CUR4){
        res[0].ORESULT_CUR4 = []
      }
      if(!res[0].ORESULT_CUR5){
        res[0].ORESULT_CUR5 = []
      }
      if(!res[0].ORESULT_CUR7){
        res[0].ORESULT_CUR7 = []
      }
      if(!res[0].ORESULT_CUR8){
        res[0].ORESULT_CUR8 = []
      }
      codeListFirst.CMPNY_DIV = res[0].ORESULT_CUR1
      codeListFirst.BSNS_CD = res[0].ORESULT_CUR2
      codeListFirst.WORK_YR = res[0].ORESULT_CUR8

      searchParams1.CMPNY_DIV = codeListFirst.CMPNY_DIV[0].COD
      // codeListFirst.CMPNY_DIV.unshift({COD: '', TXT: '전체'})
      codeListFirst.BSNS_CD.unshift({COD: '', TXT: '전체'})
      codeListFirst.WORK_YR.unshift({COD: '', TXT: '전체'})
      

      codeListSecond.CMPNY_DIV = res[0].ORESULT_CUR1
      codeListSecond.BSNS_CD = res[0].ORESULT_CUR2
      codeListSecond.WORK_YR = res[0].ORESULT_CUR8

      
      // codeListSecond.CMPNY_DIV.unshift({COD: '', TXT: '전체'})
      
      searchParams2.CMPNY_DIV = codeListSecond.CMPNY_DIV[0].COD
      codeListSecond.BSNS_CD.unshift({COD: '', TXT: '전체'})
      codeListSecond.WORK_YR.unshift({COD: '', TXT: '전체'})

      // const tempList = 
      // [
      //   // ...res.ORESULT_CUR4,
      // ...res[0].ORESULT_CUR5,
      // ]
      // console.log('tempList',tempList)
      grdFirst1.value.getDataProvider().setRows(res[0].ORESULT_CUR5);
      grdSecond1.value.getDataProvider().setRows(res[0].ORESULT_CUR5);

      data2 = []
      data3 = []
      if(!res[0].ORESULT_CUR7){
        res.ORESULT_CUR7 = []
      }
      res[0].ORESULT_CUR7.forEach((e)=>{
        if(e.DIV === '1'){ // 직영 데이터
          data2.push(e)
        } else if(e.DIV === '2'){ // 직영 데이터
          data3.push(e)
        }
      })
      grdFirst2.value.getDataProvider().setRows(data2);
      grdFirst3.value.getDataProvider().setRows(data3);
      grdSecond2.value.getDataProvider().setRows(data2);
      grdSecond3.value.getDataProvider().setRows(data3);

      
      grdSub.value.getDataProvider().setRows(GRID_DATA);

      checkGrid()
      
    })  

});

const checkGrid = () =>{
  grdFirst1.value.getGridView().checkAll()
  grdFirst2.value.getGridView().checkAll()
  grdFirst3.value.getGridView().checkAll()
  grdSecond1.value.getGridView().checkAll()
  grdSecond2.value.getGridView().checkAll()
  grdSecond3.value.getGridView().checkAll()
}

const lineChartsOptions = ref({
  grid: {
    left: "5%",
    right: "2%",
    bottom: "7%",
  },
  legend: {
    data: [ "조회조건1번 대상별",  "조회조건2번 대상별" , "전사 데이터" ],
  },
  xAxis: [
    {
      type: "category",
      data: [
        "리더십",
        "안전의식",
        "의사소통",
        "교육/훈련",
        "안전조직",
        "성과/동기",
        "위험관리",
        "절차준수",
        "사고조사",
        "시정조치",
        "협력사관리",
        "신뢰",
      ],
      
    },
  ],
  yAxis: [
    {
      type: "value",
      min: 0,
      max: 100,
      interval: 20,
      
    },
  ],
  series: [
    {
      name: "조회조건1번 대상별",
      type: "bar",
      color: "rgb(255,255,0)",
      
    },
    {
      name: "조회조건2번 대상별",
      type: "bar",
      color: "rgb(0,128,0)",
    },
    {
      name: "전사 데이터",
      type: "line",
      color: "rgb(0,0,255)",
    },
    
  ],
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },  
    valueFormatter: (value) => value.toFixed(2)
   
  },
})


const onButtonsClick = async btn =>{
  if(btn.id === 'btnSearch'){ // 조회 버튼
    const FIRST_DEPT = grdFirst1.value.getGridView().getCheckedItems()
    const FIRST_JOB_TIT_1 = grdFirst2.value.getGridView().getCheckedRows()
    const FIRST_JOB_TIT_2 = grdFirst3.value.getGridView().getCheckedRows()
   
    const SECOND_DEPT = grdSecond1.value.getGridView().getCheckedRows()
    const SECOND_JOB_TIT_1 = grdSecond2.value.getGridView().getCheckedRows()
    const SECOND_JOB_TIT_2 = grdSecond3.value.getGridView().getCheckedRows()
    

    // 조회 1 선택 부서 문자열
    let FIRST_DEPT_STR = ''
    // 조회 1 선택 직급 문자열
    let FIRST_JOB_TIT_STR = ''
    // 조회 1 쿼리 
    let FIRST_QUERY_ID = ''
    // 조회 2 선택 직급 문자열
    let SECOND_DEPT_STR = ''
    // 조회 2 선택 직급 문자열
    let SECOND_JOB_TIT_STR = ''
    // 조회 2 쿼리 
    let SECOND_QUERY_ID = ''
    


    
    console.log('FIRST_DEPT_STR',FIRST_DEPT_STR)
    
    // if(parseInt(searchParams1.TASK_NO) >= 2024){
    //   FIRST_QUERY_ID = 'EDUCA0010_SEARCH_09'
    //   FIRST_DEPT.forEach((e)=>{
    //     const selectData = grdFirst1.value.getRowData(e)
    //     FIRST_DEPT_STR += selectData.COD
    //     FIRST_DEPT_STR += ','
    //   })
    //   FIRST_DEPT_STR = FIRST_DEPT_STR.slice(0, -1)
      
    //   FIRST_JOB_TIT_1.forEach((e)=>{
    //     const selectData = grdFirst2.value.getRowData(e)
    //     FIRST_JOB_TIT_STR += selectData.COD
    //     FIRST_JOB_TIT_STR += ','
    //   })
      
    //   FIRST_JOB_TIT_2.forEach((e)=>{
    //     const selectData = grdFirst3.value.getRowData(e)
    //     FIRST_JOB_TIT_STR += selectData.COD
    //     FIRST_JOB_TIT_STR += ','
    //   })
    //   FIRST_JOB_TIT_STR = FIRST_JOB_TIT_STR.slice(0, -1)
    // } else {
      FIRST_QUERY_ID = 'EDUCA0010_SEARCH_01'
      FIRST_DEPT.forEach((e)=>{
        const selectData = grdFirst1.value.getRowData(e)
        FIRST_DEPT_STR += selectData.TXT
        FIRST_DEPT_STR += ','
      })
      FIRST_DEPT_STR = FIRST_DEPT_STR.slice(0, -1)
      
      FIRST_JOB_TIT_1.forEach((e)=>{
        const selectData = grdFirst2.value.getRowData(e)
        FIRST_JOB_TIT_STR += selectData.TXT
        FIRST_JOB_TIT_STR += ','
      })
      
      FIRST_JOB_TIT_2.forEach((e)=>{
        const selectData = grdFirst3.value.getRowData(e)
        FIRST_JOB_TIT_STR += selectData.TXT
        FIRST_JOB_TIT_STR += ','
      })
      FIRST_JOB_TIT_STR = FIRST_JOB_TIT_STR.slice(0, -1)
    // }
    
    // if(parseInt(searchParams2.TASK_NO) >= 2024){
    //   SECOND_QUERY_ID = 'EDUCA0010_SEARCH_09'
    //   SECOND_DEPT.forEach((e)=>{
    //     const selectData = grdSecond1.value.getRowData(e)
    //     SECOND_DEPT_STR += selectData.COD
    //     SECOND_DEPT_STR += ','
    //   })
    //   SECOND_DEPT_STR = SECOND_DEPT_STR.slice(0, -1)
      
    //   SECOND_JOB_TIT_1.forEach((e)=>{
    //     const selectData = grdSecond2.value.getRowData(e)
    //     SECOND_JOB_TIT_STR += selectData.COD
    //     SECOND_JOB_TIT_STR += ','
    //   })
      
    //   SECOND_JOB_TIT_2.forEach((e)=>{
    //     const selectData = grdSecond3.value.getRowData(e)
    //     SECOND_JOB_TIT_STR += selectData.COD
    //     SECOND_JOB_TIT_STR += ','
    //   })
    //   SECOND_JOB_TIT_STR = SECOND_JOB_TIT_STR.slice(0, -1)
    // } else {
      SECOND_QUERY_ID = 'EDUCA0010_SEARCH_01'
      SECOND_DEPT.forEach((e)=>{
        const selectData = grdSecond1.value.getRowData(e)
        SECOND_DEPT_STR += selectData.TXT
        SECOND_DEPT_STR += ','
      })
      SECOND_DEPT_STR = SECOND_DEPT_STR.slice(0, -1)
      
      SECOND_JOB_TIT_1.forEach((e)=>{
        const selectData = grdSecond2.value.getRowData(e)
        SECOND_JOB_TIT_STR += selectData.TXT
        SECOND_JOB_TIT_STR += ','
      })
      
      SECOND_JOB_TIT_2.forEach((e)=>{
        const selectData = grdSecond3.value.getRowData(e)
        SECOND_JOB_TIT_STR += selectData.TXT
        SECOND_JOB_TIT_STR += ','
      })
      SECOND_JOB_TIT_STR = SECOND_JOB_TIT_STR.slice(0, -1)
    // }
    
    Promise.all([ 
      // 조회조건 1번 데이터 조회
      commonSearchApi({ 
        queryId : FIRST_QUERY_ID,
        param: {
          TASK_NO: searchParams1.TASK_NO,
          CMPNY_DIV: searchParams1.CMPNY_DIV,
          BSNS_CD: searchParams1.BSNS_CD,
          DEPT_CD: FIRST_DEPT_STR,
          WORK_YR: searchParams1.WORK_YR,
          JOB_TIT: FIRST_JOB_TIT_STR,
        } }),
      // 조회조건 2번 데이터 조회
      commonSearchApi({ 
        queryId : SECOND_QUERY_ID,
        param: {
          TASK_NO: searchParams2.TASK_NO,
          CMPNY_DIV: searchParams2.CMPNY_DIV,
          BSNS_CD: searchParams2.BSNS_CD,
          DEPT_CD: SECOND_DEPT_STR,
          WORK_YR: searchParams2.WORK_YR,
          JOB_TIT: SECOND_JOB_TIT_STR,
        } }),
    ]).then(res => {
      console.log('1 번 데이터', res[0].ORESULT_CUR)
      console.log('2 번 데이터', res[1].ORESULT_CUR)    
      DATA_1 = []
      DATA_2 = []
      DATA_3 = []
      // 조회 1번 데이터
      res[0].ORESULT_CUR.forEach((e) => {
        if(e.CATEGORY === '020'){
          DATA_1[0] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[0] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '030'){
          DATA_1[1] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[1] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '040'){
          DATA_1[2] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[2] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '050'){
          DATA_1[3] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[3] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '060'){
          DATA_1[4] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[4] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '070'){
          DATA_1[5] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[5] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '080'){
          DATA_1[6] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[6] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '090'){
          DATA_1[7] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[7] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '100'){
          DATA_1[8] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[8] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '110'){
          DATA_1[9] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[9] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '120'){
          DATA_1[10] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[10] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '130'){
          DATA_1[11] = e.CATEGORY_VALUE // 대상별 조회 데이터
          DATA_3[11] = e.CATEGORY_TOT // 전사 데이터
        }
      })
      // 조회 2번 데이터
      res[1].ORESULT_CUR.forEach((e) => {
        if(e.CATEGORY === '020'){
          DATA_2[0] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[0] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '030'){
          DATA_2[1] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[1] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '040'){
          DATA_2[2] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[2] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '050'){
          DATA_2[3] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[3] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '060'){
          DATA_2[4] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[4] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '070'){
          DATA_2[5] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[5] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '080'){
          DATA_2[6] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[6] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '090'){
          DATA_2[7] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[7] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '100'){
          DATA_2[8] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[8] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '110'){
          DATA_2[9] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[9] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '120'){
          DATA_2[10] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[10] = e.CATEGORY_TOT // 전사 데이터
        }
        else if(e.CATEGORY === '130'){
          DATA_2[11] = e.CATEGORY_VALUE // 대상별 조회 데이터
          // DATA_3[11] = e.CATEGORY_TOT // 전사 데이터
        }
      })
      // console.log('DATA_1 LEN', DATA_1.length)
      // console.log('DATA_2 LEN', DATA_2.length)

      
      if(DATA_1.length <= 0){
        DATA_1 = [0,0,0,0,0,0,0,0,0,0,0,0]
      }
      if(DATA_2.length <= 0){
        DATA_2 = [0,0,0,0,0,0,0,0,0,0,0,0]
      }

      lineChartsOptions.value.series.map((x) => {
        switch (x.name) {
          case "조회조건1번 대상별":
            x.data = [...DATA_1]
            break

          case "조회조건2번 대상별":
            x.data = [...DATA_2]
            break

          case "전사 데이터":
            x.data = [...DATA_3]
            break
        }
      })
      // 비교 그리드 초기화
      GRID_DATA=[
        {GBN: '차이',COL1: 0,COL2: 0,COL3: 0,COL4: 0,COL5: 0,COL6: 0,COL7: 0,COL8: 0,COL9: 0,COL10: 0,COL11: 0,COL12: 0,},
        // {GBN: '장점',COL1: '',COL2: '',COL3: '',COL4: '',COL5: '',COL6: '',COL7: '',COL8: '',COL9: '',COL10: '',COL11: '',COL12: '',},
        // {GBN: '약점',COL1: '',COL2: '',COL3: '',COL4: '',COL5: '',COL6: '',COL7: '',COL8: '',COL9: '',COL10: '',COL11: '',COL12: '',},
      ]
      
      // console.log("GRID_DATA[0]['GBN']",GRID_DATA[0]['GBN'])
      // console.log('DATA_1',DATA_1)
      // console.log('DATA_2',DATA_2)
      DATA_1.forEach((e,idx)=>{
        const key = 'COL' + (idx+1).toString()
        let calcVal =  DATA_1[idx] - DATA_2[idx]
        console.log('calcVal',calcVal)

        GRID_DATA[0][key] = calcVal.toFixed(1)
      })
      // console.log('GRID_DATA',GRID_DATA)
      // // Extract key-value pairs and convert values to numbers
      // let entries = Object.entries(GRID_DATA[0]).filter(([key, value]) => key !== "GBN").map(([key, value]) => [key, parseFloat(value)])

      // // Sort entries by value in ascending order
      // entries.sort((a, b) => a[1] - b[1])
      // console.log('entries',entries)
      // GRID_DATA[2][entries[0][0]] = 1
      // GRID_DATA[2][entries[1][0]] = 2
      // GRID_DATA[2][entries[2][0]] = 3

      // entries.sort((a, b) => b[1] - a[1])
      // GRID_DATA[1][entries[0][0]] = 1
      // GRID_DATA[1][entries[1][0]] = 2
      // GRID_DATA[1][entries[2][0]] = 3
      grdSub.value.getDataProvider().setRows(GRID_DATA)
    })
  } else if(btn.id === 'btnPrint'){ // 이미지 저장
    
      const chart = document.getElementById('data_chart')
      html2canvas(chart).then(canvas => {
      // 이미지 다운로드
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = '안전의식조사 결과 분석'+ dayjs(new Date()).format('YYYYMMDD')+'.png'
      link.click()
    })
  } else if(btn.id === 'btnExcel'){ // Excel 다운로드


    let excelFileNM =  '안전의식조사 결과 분석'+ dayjs(new Date()).format('YYYYMMDD')
    const FIRST_DEPT = grdFirst1.value.getGridView().getCheckedItems()
    const FIRST_JOB_TIT_1 = grdFirst2.value.getGridView().getCheckedRows()
    const FIRST_JOB_TIT_2 = grdFirst3.value.getGridView().getCheckedRows()
   

    // 조회 1 선택 부서 명 문자열
    let FIRST_DEPT_STR = ''
    // 조회 1 선택 부서 코드 문자열
    let FIRST_DEPT_CD = ''
    // 조회 1 선택 직급 문자열
    let FIRST_JOB_TIT_STR = ''
    FIRST_DEPT.forEach((e)=>{
      const selectData = grdFirst1.value.getRowData(e)
      FIRST_DEPT_CD += selectData.COD
      FIRST_DEPT_CD += ','
      FIRST_DEPT_STR += selectData.TXT
      FIRST_DEPT_STR += ','
    })
    FIRST_DEPT_CD = FIRST_DEPT_CD.slice(0, -1)
    FIRST_DEPT_STR = FIRST_DEPT_STR.slice(0, -1)
    
    FIRST_JOB_TIT_1.forEach((e)=>{
      const selectData = grdFirst2.value.getRowData(e)
      FIRST_JOB_TIT_STR += selectData.TXT
      FIRST_JOB_TIT_STR += ','
    })
    
    FIRST_JOB_TIT_2.forEach((e)=>{
      const selectData = grdFirst3.value.getRowData(e)
      FIRST_JOB_TIT_STR += selectData.TXT
      FIRST_JOB_TIT_STR += ','
    })
    FIRST_JOB_TIT_STR = FIRST_JOB_TIT_STR.slice(0, -1)


    // console.log('FIRST_DEPT_CD',FIRST_DEPT_CD)

    commonSearchApi({
        queryId: "EDUCA0010_SEARCH_03",
        param: { 
          TASK_NO: searchParams1.TASK_NO,
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: searchParams1.BSNS_CD,
          DEPT_CD: FIRST_DEPT_CD,
          WORK_YR: searchParams1.WORK_YR,
          JOB_TIT: FIRST_JOB_TIT_STR,
        },
      }).then((res) => {
        // console.log('EDUCA0010_SEARCH_03',res)
        grdExcel.value.getDataProvider().setRows(res.ORESULT_CUR);

        
    if (grdExcel.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }
    let WORK_YR_TXT = ''
    if(searchParams1.WORK_YR === ''){
      WORK_YR_TXT = '전체'
    }
    grdExcel.value.getGridView().exportGrid({ 
      type: 'excel',
      target: 'local',
      fileName: excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.', 
      showProgress: true, 
      // indicator: 'visible', 
      header: 'visible', 
      footer: 'hidden', 
      allColumns: false,
      lookupDisplay: true,
      exportTemplate: true,
      yOffset: 7,
      userCellsCallback: function (grid, rowCount, colCount, sheetName) {
        return [
          {
            row: 0,
            col: 0,
            value: "부서별 현황",
            heights: 15,
            mergeRow: 2,
            mergeCol: 13,
            styles: { textAlign: "center",fontSize: "20px", border: "1px solid black" ,background: "RGB(84,130,53)",color: "RGB(255,255,255)" },
          },
          {
            row: 3,
            col: 0,
            widths: 30,
            value: "등록연도",
            heights: 15,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(0,122,153)" },
          },
          {
            row: 3,
            col: 1,
            value: searchParams1.TASK_NO,
            heights: 15,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(240,243,245)" },
          },
          {
            row: 4,
            col: 0,
            value: "소속회사",
            heights: 15,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(0,122,153)" },
          },
          {
            row: 4,
            col: 1,
            value: "HHI",
            heights: 15,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(240,243,245)" },
          },
          {
            row: 4,
            col: 2,
            value: "직급",
            heights: 15,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(0,122,153)" },
          },
          {
            row: 4,
            col: 3,
            value: FIRST_JOB_TIT_STR,
            heights: 15,
            mergeCol: 3,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(240,243,245)" },
          },
          {
            row: 4,
            col: 7,
            value: "근속년수",
            heights: 15,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(0,122,153)" },
          },
          { 
            row: 4,
            col: 8,
            value: WORK_YR_TXT,
            heights: 15,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(240,243,245)" },
          },
          {
            row: 5,
            col: 0,
            value: "부서List",
            heights: 15,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(0,122,153)" },
          },
          {
            row: 5,
            col: 1,
            value: FIRST_DEPT_STR,
            heights: 15,
            mergeCol: 12,
            styles: { textAlign: "left",fontSize: "11px", border: "1px solid black",background: "RGB(240,243,245)" },
          },

        
        ];
      },
    })
  })
}
}

// 조회1 년도 변경 감지 
watch(
  () => searchParams1.TASK_NO,
  (newValue) => {
  
    // if(parseInt(searchParams1.TASK_NO) >= 2024){
    //   searchParams1.CMPNY_DIV = userStore.cmpnyDiv
      
    // }
    if (!newValue) {
    } else {
      
      vm.$nextTick(() => {
        commonSearchApi({
          queryId: 'EDUCA0010_SEARCH_08',
          param: { TASK_NO: newValue, CMPNY_DIV: searchParams1.CMPNY_DIV },
        }).then((res) => {
          
        console.log('res',res)
        searchParams1.CMPNY_DIV = ''
        searchParams1.BSNS_CD = ''
        searchParams1.WORK_YR = ''
        if(!res.ORESULT_CUR1){
          res.ORESULT_CUR1 = []
        }
        
        if(!res.ORESULT_CUR2){
          res.ORESULT_CUR2 = []
        }
        
        if(!res.ORESULT_CUR7){
          res.ORESULT_CUR7 = []
        }
        if(!res.ORESULT_CUR8){
          res.ORESULT_CUR8 = []
        }
        codeListFirst.CMPNY_DIV = res.ORESULT_CUR1
        codeListFirst.BSNS_CD = res.ORESULT_CUR2
        codeListFirst.WORK_YR = res.ORESULT_CUR8
        // codeListFirst.CMPNY_DIV.unshift({COD: '', TXT: '전체'})
        searchParams1.CMPNY_DIV = codeListFirst.CMPNY_DIV[0].COD
        console.log('codeListFirst.CMPNY_DIV[0].COD',codeListFirst.CMPNY_DIV[0].COD)
        codeListFirst.BSNS_CD.unshift({COD: '', TXT: '전체'})
        codeListFirst.WORK_YR.unshift({COD: '', TXT: '전체'})

        // 부문 부서 데이터
        // const tempList = 
        // [
        //   // ...res.ORESULT_CUR4,
        // ...res.ORESULT_CUR5,
        // ]
        // console.log('tempList',tempList)
        grdFirst1.value.getDataProvider().setRows(res.ORESULT_CUR5);
  
  
        data2 = []
        data3 = []
        res.ORESULT_CUR7.forEach((e)=>{
          if(e.DIV === '1'){ // 직영 데이터
            data2.push(e)
          } else if(e.DIV === '2'){ // 직영 데이터
            data3.push(e)
          }
        })
        grdFirst2.value.getDataProvider().setRows(data2);
        grdFirst3.value.getDataProvider().setRows(data3);

        checkGrid()
        })
      })
    }
  }
)
// 조회2 년도 변경 감지
watch(
  () => searchParams2.TASK_NO,
  (newValue) => {
    if (!newValue) {
    } else {
      commonSearchApi({
        queryId: "EDUCA0010_SEARCH_08",
        param: { TASK_NO: newValue, CMPNY_DIV: searchParams2.CMPNY_DIV },
      }).then((res) => {
      
      searchParams2.CMPNY_DIV = ''
      searchParams2.BSNS_CD = ''
      searchParams2.WORK_YR = ''
      if(!res.ORESULT_CUR1){
        res.ORESULT_CUR1 = []
      }
      
      if(!res.ORESULT_CUR2){
        res.ORESULT_CUR2 = []
      }
      if(!res.ORESULT_CUR4){
        res.ORESULT_CUR4 = []
      }
      if(!res.ORESULT_CUR5){
        res.ORESULT_CUR5 = []
      }
      if(!res.ORESULT_CUR7){
        res.ORESULT_CUR7 = []
      }
      if(!res.ORESULT_CUR8){
        res.ORESULT_CUR8 = []
      }

      codeListSecond.CMPNY_DIV = res.ORESULT_CUR1
      codeListSecond.BSNS_CD = res.ORESULT_CUR2
      codeListSecond.WORK_YR = res.ORESULT_CUR8
      // codeListSecond.CMPNY_DIV.unshift({COD: '', TXT: '전체'})
      searchParams2.CMPNY_DIV = codeListSecond.CMPNY_DIV[0].COD
      codeListSecond.BSNS_CD.unshift({COD: '', TXT: '전체'})
      codeListSecond.WORK_YR.unshift({COD: '', TXT: '전체'})


      // 부문 부서 데이터
      // const tempList = 
      // [
      //   // ...res.ORESULT_CUR4,
      // ...res.ORESULT_CUR5,
      // ]
      // console.log('tempList',tempList)
      grdSecond1.value.getDataProvider().setRows(res.ORESULT_CUR5);
 
      data2 = []
      data3 = []
      res.ORESULT_CUR7.forEach((e)=>{
        if(e.DIV === '1'){ // 직영 데이터
          data2.push(e)
        } else if(e.DIV === '2'){ // 직영 데이터
          data3.push(e)
        }
      })
      grdSecond2.value.getDataProvider().setRows(data2);
      grdSecond3.value.getDataProvider().setRows(data3);

      checkGrid()
      })
    }
  }
)

// 회사 변경감지

watch( 
  () => searchParams1.CMPNY_DIV 
  ,(newValue,oldValue) => {
    console.log('newValue',newValue)
    console.log('oldValuev',oldValue)
    if(oldValue !== newValue){
      commonSearchApi({
        queryId: "EDUCA0010_SEARCH_04",
        param: { TASK_NO: searchParams1.TASK_NO, CMPNY_DIV: newValue  },
      }).then((res) => {
        codeListFirst.BSNS_CD = res.ORESULT_CUR
        codeListFirst.BSNS_CD.unshift({COD: '', TXT: '전체'})
        searchParams1.BSNS_CD = ''
      })
    }
    
  })

// 회사 변경감지

watch( 
  () => searchParams2.CMPNY_DIV 
  ,(newValue,oldValue) => {
  if(oldValue !== newValue){
    commonSearchApi({
        queryId: "EDUCA0010_SEARCH_04",
        param: { TASK_NO: searchParams2.TASK_NO, CMPNY_DIV: newValue  },
      }).then((res) => {
        codeListSecond.BSNS_CD = res.ORESULT_CUR
        codeListSecond.BSNS_CD.unshift({COD: '', TXT: '전체'})
        searchParams2.BSNS_CD = ''
      })
    }
  })

// 사업부 변경감지

watch( 
  () => searchParams1.BSNS_CD 
  ,(newValue,oldValue) => {
    if(oldValue !== newValue){
    commonSearchApi({
        queryId: "EDUCA0010_SEARCH_06",
        param: { TASK_NO: searchParams1.TASK_NO, CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue},
      }).then((res) => {
        grdFirst1.value.getDataProvider().setRows(res.ORESULT_CUR);
        
        grdFirst1.value.getGridView().checkAll()
        grdFirst2.value.getGridView().checkAll()
        grdFirst3.value.getGridView().checkAll()
      })
    }
  })

// 사업부 변경감지

watch( 
  () => searchParams2.BSNS_CD 
  ,(newValue,oldValue) => {
    if(oldValue !== newValue){
    commonSearchApi({
        queryId: "EDUCA0010_SEARCH_06",
        param: { TASK_NO: searchParams2.TASK_NO, CMPNY_DIV: userStore.cmpnyDiv , BSNS_CD: newValue},
      }).then((res) => {
        grdSecond1.value.getDataProvider().setRows(res.ORESULT_CUR);
        
        grdSecond1.value.getGridView().checkAll()
        grdSecond2.value.getGridView().checkAll()
        grdSecond3.value.getGridView().checkAll()
      })
    }
  })
 


// 색상 변경 감지
watch( 
  () => searchParams1.SEARCH_COLOR 
  ,(newValue) => {
    lineChartsOptions._value.series[0].color = newValue
  })
watch( 
  () => searchParams1.TOT_COLOR 
  ,(newValue) => {
    lineChartsOptions._value.series[2].color = newValue
  })
watch( 
  () => searchParams2.SEARCH_COLOR 
  ,(newValue) => {
    lineChartsOptions._value.series[1].color = newValue
  })



</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
        <IMenuTitle
          ref="menuTitle"
          :title="$t(useLogsStore().menuId)"
          :button-list="[ 'btnSearch' ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
        <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
        <!-- 첫번째 조회 조건 -->
          <v-sheet class="searchArea d-flex" style="align-items: center;">
            <v-icon style="font-size: 32px; " icon="mdi-numeric-1-box-outline"></v-icon>
            <i-select
              :label="$t('년도')"
              label-width="30px"
              width="150px"
              v-model="searchParams1.TASK_NO"
              type="YEAR"
              style="margin-left:16px;"
              @change="yearChange('search1')"
            />
            <i-select
              :label="$t('회사')"
              label-width="30px"
              width="250px"
              v-model="searchParams1.CMPNY_DIV"
              :items="codeListFirst.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('사업부')"
              label-width="40px"
              width="250px"
              v-model="searchParams1.BSNS_CD"
              :items="codeListFirst.BSNS_CD"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('근속년수')"
              label-width="50px"
              width="250px"
              v-model="searchParams1.WORK_YR"
              :items="codeListFirst.WORK_YR"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('조회조건 색상')"
              label-width="80px"
              width="250px"
              v-model="searchParams1.SEARCH_COLOR"
              :items="COLOR_LIST"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('전사색상')"
              label-width="50px"
              width="250px"
              v-model="searchParams1.TOT_COLOR"
              :items="COLOR_LIST"
              item-value="COD"
              item-title="TXT"
            />
          </v-sheet>
          <!-- 두번째 조회 조건 -->
          <v-sheet class="searchArea d-flex" style="align-items: center;">
            <v-icon style="font-size: 32px;" icon="mdi-numeric-2-box-outline"></v-icon>
            <i-select
              :label="$t('년도')"
              label-width="30px"
              width="150px"
              v-model="searchParams2.TASK_NO"
              type="YEAR"
              style="margin-left:16px;"
              @change="yearChange('search2')"
            />
            <i-select
              :label="$t('회사')"
              label-width="30px"
              width="250px"
              v-model="searchParams2.CMPNY_DIV"
              :items="codeListSecond.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('사업부')"
              label-width="40px"
              width="250px"
              v-model="searchParams2.BSNS_CD"
              :items="codeListSecond.BSNS_CD"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('근속년수')"
              label-width="50px"
              width="250px"
              v-model="searchParams2.WORK_YR"
              :items="codeListSecond.WORK_YR"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              :label="$t('조회조건 색상')"
              label-width="80px"
              width="250px"
              v-model="searchParams2.SEARCH_COLOR"
              :items="COLOR_LIST"
              item-value="COD"
              item-title="TXT"
            />
            <!-- <i-select
              :label="$t('전사색상')"
              label-width="50px"
              width="250px"
              v-model="searchParams2.TOT_COLOR"
              :items="COLOR_LIST"
              item-value="COD"
              item-title="TXT"
            /> -->
          </v-sheet>
          <div style="display: flex; justify-content: space-between;">
            <v-sheet style="display: flex; flex-direction: row;">
              <v-btn rounded @click="isShow1 = !isShow1"><v-icon icon="mdi-numeric-1-box-outline"></v-icon>조회</v-btn>
              <v-btn rounded @click="isShow2 = !isShow2"><v-icon icon="mdi-numeric-2-box-outline"></v-icon>조회</v-btn>
            </v-sheet>
            <IGridTitle
              :use-permission="false"
              :button-list="[ 'btnPrint', 'btnExcel']"
              @click-button="onButtonsClick"
            />
          </div>
          <div class="fill-height" style="display: flex;">
            <v-sheet :style="{width: isShow1 || isShow2 ?'35%' : '0%', height: '100%',}">
              <div style="height: 100%;">
              <v-navigation-drawer
              v-model="isShow1"
              style="width: 100%; height: 96%; top: 5px;"
              temporary>
                <v-sheet style="display: flex;flex-direction: row;flex-wrap: wrap; width: 100%; height: 96%;">
                  <div style="width: 100%;">
                    <v-icon style="font-size: 32px; " icon="mdi-numeric-1-box-outline"></v-icon>
                  </div>
                  <v-sheet width="50%" height="96%" style="padding-right: 4px;">
                    <IGridTitle title="부서 리스트">
                    <template #editors />
                    </IGridTitle>
                    <RealGrid
                      ref="grdFirst1"
                      class="mt-2"
                      :grid-view-option="grdFirstProps1.gridViewOption"
                      :fields="grdFirstProps1.fields"
                      :columns="grdFirstProps1.columns"
                      :column-layout="grdFirstProps1.columnLayout"
                    />
                  </v-sheet>
                  <v-sheet width="50%" height="96%">
                  <IGridTitle title="직영 직급 리스트">
                    <template #editors />
                  </IGridTitle>
                  <RealGrid
                    ref="grdFirst2"
                    class="mt-2"
                    :grid-view-option="grdFirstProps2.gridViewOption"
                    :fields="grdFirstProps2.fields"
                    :columns="grdFirstProps2.columns"
                    :column-layout="grdFirstProps2.columnLayout"
                  />

                  <IGridTitle title="협력사 직급 리스트">
                    <template #editors />
                  </IGridTitle>
                  <RealGrid
                    ref="grdFirst3"
                    class="mt-2"
                    :grid-view-option="grdFirstProps3.gridViewOption"
                    :fields="grdFirstProps3.fields"
                    :columns="grdFirstProps3.columns"
                    :column-layout="grdFirstProps3.columnLayout"
                  />
                  </v-sheet>
                </v-sheet>
              </v-navigation-drawer>
              <v-navigation-drawer
              v-model="isShow2"
              :style="{
                      marginLeft: isShow1 && isShow2 ? '102%' : '',
                      height: '96%',
                      width: '100%',
                      top: '5px',
                    }"
              temporary>
                <v-sheet style="display: flex;
                flex-direction: row;
                flex-wrap: wrap; 
                width: 100%; 
                height: 96%;">
                  <div style="width: 100%;">
                    <v-icon style="font-size: 32px; " icon="mdi-numeric-2-box-outline"></v-icon>
                  </div>
                  <v-sheet width="50%" height="96%" style="padding-right: 4px;">
                    <IGridTitle title="부서 리스트">
                    <template #editors />
                    </IGridTitle>
                    <RealGrid
                      ref="grdSecond1"
                      class="mt-2"
                      :grid-view-option="grdSecondProps1.gridViewOption"
                      :fields="grdSecondProps1.fields"
                      :columns="grdSecondProps1.columns"
                      :column-layout="grdSecondProps1.columnLayout"
                    />
                  </v-sheet>
                  <v-sheet width="50%" height="96%">
                  <IGridTitle title="직영 직급 리스트">
                    <template #editors />
                  </IGridTitle>
                  <RealGrid
                    ref="grdSecond2"
                    class="mt-2"
                    :grid-view-option="grdSecondProps2.gridViewOption"
                    :fields="grdSecondProps2.fields"
                    :columns="grdSecondProps2.columns"
                    :column-layout="grdSecondProps2.columnLayout"
                  />

                  <IGridTitle title="협력사 직급 리스트">
                    <template #editors />
                  </IGridTitle>
                  <RealGrid
                    ref="grdSecond3"
                    class="mt-2"
                    :grid-view-option="grdSecondProps3.gridViewOption"
                    :fields="grdSecondProps3.fields"
                    :columns="grdSecondProps3.columns"
                    :column-layout="grdSecondProps3.columnLayout"
                  /> 
                  </v-sheet>
                </v-sheet>
              </v-navigation-drawer>
              </div> 
            </v-sheet>
            <v-sheet class="pa-0 h-auto" 
              :style="{width: isShow1 || isShow2  ? '63%' : '100%',}">
              <v-card class="pa-0 h-auto">
                <v-card-text class="pa-1">
                  <v-sheet style="height: 85%;">
                    <e-chart id="data_chart" :option="lineChartsOptions" style="padding-left: -22px;"/>
                  </v-sheet>
                  <v-sheet class="pl-5 pr-2" style="height: 15%; width: 100%; max-height: 160px;">
                    <RealGrid
                      ref="grdSub"
                      class="mt-2"
                      :grid-view-option="grdSubProps.gridViewOption"
                      :fields="grdSubProps.fields"
                      :columns="grdSubProps.columns"
                      :column-layout="grdSubProps.columnLayout"
                    />
                    <RealGrid
                      style="height: 0%; width: 0%;"
                      ref="grdExcel"
                      class="mt-2"
                      :grid-view-option="grdExcelProps.gridViewOption"
                      :fields="grdExcelProps.fields"
                      :columns="grdExcelProps.columns"
                      :column-layout="grdExcelProps.columnLayout"
                    />
                  </v-sheet>
                  
                </v-card-text>
              </v-card>
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
</template>

<style scoped lang="scss">
.v-navigation-drawer__scrim {
    display: none;
  }
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 210px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 580px;
  }
}
</style>