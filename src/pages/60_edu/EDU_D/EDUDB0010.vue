<!-- SI2팀 김성근 사고 대시보드 -->

<script setup>
//그리드 속성셋팅
import { useI18n } from "vue-i18n"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import { useUserStore } from "@hiway/stores/user"
import dayjs from "dayjs"
import { onMounted, reactive } from "vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import Message from "@hiway/utils/notify"

defineOptions({
  name: '60_edu-EDU_D-EDUDB0010',
})
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보

const emit = defineEmits(["searchParams"])
const menuTitle = ref(null)
const grdMain = ref(null)

const totalProvide = ref(600)
const accidentProvide = ref(510)
const today = ref(dayjs().format("YYYY.MM.DD"))
const sAFAD0010Popup2 = ref(null)
const pieChart = ref()
// 조회 조건 파라미터
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format("YYYY"),
  DATE_FROM : dayjs(new Date).format('YYYY-MM'),
  DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), // 지급일 기간 끝
  RANK_DATE_FROM : dayjs(new Date()).format('YYYY-MM'), // 지급일 기간 시작  
  RANK_DATE_TO : dayjs(new Date()).format('YYYY-MM-DD'), // 지급일 기간 시작  
  BSNS_CD: "",
  DEPT_CD: "",
  ASGN_CD: "",
  TOT_DIV: "", // 컨텐츠 현황 기준 인원 구분 코드 (A: 전사, B: 사업부, C: 부서, D:협력사)
  TOT_CNT: "0",
  DATE_TYPE: "month",
})

const TOT_DATA = reactive({
  POINT: '',
  EMP_CNT: '',
  TOT_CNT: '',
  PERCENT: '',
  UNIT: ''
})

// 기본 코드 리스트
const codeList = reactive({
  DATE_LIST: [
    {COD: 'YEAR', TXT: '년'},
    {COD: 'month', TXT: '월'},
    {COD: 'date', TXT: '일'},]
})
const NOCMPNY = ref(false)
const NOBSNS = ref(true)
const NODEPT = ref(true)


const ISSPAY = ref(false)
// 포인트 단위
const UNIT = ref('')

let RANK_LIST = reactive([
  [], // RANK_LIST[0][IDX] HD안전페이 TOP5부서
  [], // RANK_LIST[1][IDX] HD안전페이 TOP5협력사
  [], // RANK_LIST[2][IDX] HD안전페이 TOP5개인 (직영)
  [], // RANK_LIST[3][IDX] HD안전페이 TOP5개인 (협력사)
])
 
const RANK_ICON = reactive([
'mdi-numeric-1-box-outline',
'mdi-numeric-2-box-outline',
'mdi-numeric-3-box-outline',
'mdi-numeric-4-box-outline',
'mdi-numeric-5-box-outline',
// 'mdi-numeric-6-box-outline',
// 'mdi-numeric-7-box-outline',
// 'mdi-numeric-8-box-outline',
// 'mdi-numeric-9-box-outline',
// 'mdi-numeric-10-box-outline',
])

const RANK_TITLE = reactive([
'HD안전페이 TOP 5 부서',
'HD안전페이 TOP 5 협력사',
'HD안전페이 TOP 5 개인(직영)',
'HD안전페이 TOP 5 개인(협력사)',
])

let BSNS_DATA = reactive([
  {BSNS_NM: '조선사업부'
  , BSNS_CD: 'AC00'
  , POINT: '0'
  , PERCENT: '0'
  , EMP_CNT: '0'
  , TOT_CNT: '0'
  , UNIT: ''
  },
  {BSNS_NM: '해양에너지사업본부'
  , BSNS_CD: 'AQ00'
  , POINT: '0'
  , PERCENT: '0'
  , EMP_CNT: '0'
  , TOT_CNT: '0'
  , UNIT: ''
  },
  {BSNS_NM: '특수선사업부'
  , BSNS_CD: 'AE00'
  , POINT: '0'
  , PERCENT: '0'
  , EMP_CNT: '0'
  , TOT_CNT: '0'
  , UNIT: ''
  },
  {BSNS_NM: '엔진기계사업부'
  , BSNS_CD: 'AK00'
  , POINT: '0'
  , PERCENT: '0'
  , EMP_CNT: '0'
  , TOT_CNT: '0'
  , UNIT: ''
  },
  {BSNS_NM: '기타'
  , BSNS_CD: 'ETC'
  , POINT: '0'
  , PERCENT: '0'
  , EMP_CNT: '0'
  , TOT_CNT: '0'
  , UNIT: ''
  },
  

])

let SPAY = reactive([,
  {TXT: '안전작업지시', COLOR: '#4C5DFA', COD: '10', POINT: 0, EMP_CNT: 0, TOT_CNT: 0, UNIT:''},
  {TXT: '현장위험성평가', COLOR: '#FF0000', COD: '40', POINT: 0, EMP_CNT: 0, TOT_CNT: 0, UNIT:''},
  {TXT: '안전제보', COLOR: '#94C81B', COD: '20', POINT: 0, EMP_CNT: 0, TOT_CNT: 0, UNIT:''},
  {TXT: '안전점검', COLOR: '#4A4D56', COD: '50', POINT: 0, EMP_CNT: 0, TOT_CNT: 0, UNIT:''},
  {TXT: '안전교육', COLOR: '#5F00FF', COD: '30', POINT: 0, EMP_CNT: 0, TOT_CNT: 0, UNIT:''},
  {TXT: '안전칭찬쿠폰', COLOR: '#0BB69C', COD: '60', POINT: 0, EMP_CNT: 0, TOT_CNT: 0, UNIT:''},
])

const TopAllCnt = ref(1000)

let DATA_1 = reactive([])
let DATA_2 = reactive([])
let DATA_3 = reactive([])
let DATA_4 = reactive([])
let DATA_5 = reactive([])
let DATA_6 = reactive([])

onMounted(() => {
  Promise.all([
    getCodeList("HHIZ000"), //회사구분 조회
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: "N" },
    }),
    getCodeList("HHIC30"), //회사구분 조회
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.MAX_DATA = res[2].ORESULT_CUR
    // console.log(codeList.BSNS_CD)
    
    // console.log('codeList.MAX_DATA',codeList.MAX_DATA)
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    onButtonClick() // 초기 조회 작동
    
    codeList.MAX_DATA.forEach((e)=>{
      if(e.CODE_DESC1 !== null){
        e.DAY_MAX = parseFloat(e.CODE_DESC1)/ 21.75 // 월별 평균 평일 수
      }
    })
    // console.log('codeList.MAX_DATA',codeList.MAX_DATA)

    
  })

  // console.log(!SPAY.value, "SPAY");
})
const lineChartsOptions = ref({
  grid: {
    left: "2%",
    right: "2%",
    bottom: "7%",
    containLabel: true,
  },
  legend: {
    data: ["안전작업지시", "현장위험성평가", "안전제보", "안전점검", "안전교육", "안전칭찬쿠폰"],
  },
  xAxis: [
    {
      type: "category",
      data: [
        "1월",
        "2월",
        "3월",
        "4월",
        "5월",
        "6월",
        "7월",
        "8월",
        "9월",
        "10월",
        "11월",
        "12월",
      ],
    },
  ],
  yAxis: [
    {
      type: "value",
      
    },
  ],
  series: [
    {
      name: "안전작업지시",
      type: "bar",
      color: "#4C5DFA",
    },
    {
      name: "현장위험성평가",
      type: "bar",
      color: "#FF0000",
    },
    {
      name: "안전제보",
      type: "bar",
      color: "#94C81B",
    },
    {
      name: "안전점검",
      type: "bar",
      color: "#4A4D56",
    },
    {
      name: "안전교육",
      type: "bar",
      color: "#5F00FF",
    },
    {
      name: "안전칭찬쿠폰",
      type: "bar",
      color: "#0BB69C",
    },
  ],
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
})

const onButtonClick = () => {

  if(searchParams.BSNS_CD !== "" && searchParams.BSNS_CD !== null){
    searchParams.TOT_DIV = 'B'
  } else{
    searchParams.TOT_DIV = 'A'
  }
  if(searchParams.DEPT_CD !== "" && searchParams.DEPT_CD !== null){
    searchParams.TOT_DIV = 'C'
  } 
  if(searchParams.ASGN_CD !== "" && searchParams.ASGN_CD !== null){
    searchParams.TOT_DIV = 'D'
  }
  
  console.log('searchParams',searchParams)
  console.log('searchParams.TOT_DIV',searchParams.TOT_DIV)
  // 사업부 리스트 조회
  Promise.all([ 
      commonSearchApi(
      { queryId : 'EDUDB0010_SEARCH_01',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          YEAR: dayjs().format("YYYY"),
        }
      }),
      commonSearchApi(
      { queryId : 'EDUDB0010_SEARCH_02',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          YEAR: dayjs().format("YYYY"),
        } 
      }),
      commonSearchApi(
      { queryId : 'EDUDB0010_SEARCH_03',
        param: searchParams 
      }),
      commonSearchApi(
      { queryId : 'EDUDB0010_SEARCH_04',
      param: searchParams
      }),
      ]).then(res => {
    // 전사 데이터
    // console.log('EDUDB0010_SEARCH_01 res', res)
    // console.log('res[0].ORESULT_CUR2[0]',res[0].ORESULT_CUR2[0])
    searchParams.YEAR = searchParams.DATE_FROM.substring(0,4)
    let temp_emp_cnt = res[0].ORESULT_CUR2[0].EMP_CNT
    let temp_tot_cnt = res[0].ORESULT_CUR2[0].TOT_CNT
    TOT_DATA.POINT = res[0].ORESULT_CUR[0].TOT_POINT
    // console.log('TOT_DATA.POINT',TOT_DATA.POINT)
    if(TOT_DATA.POINT<1000000){
      TOT_DATA.POINT = TOT_DATA.POINT.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
      TOT_DATA.UNIT = ''
    //2024.08.06 박용훈 수정
    //}else if (e.POINT >= 1000000){
      }else if (TOT_DATA.POINT >= 1000000){
      TOT_DATA.POINT = (TOT_DATA.POINT/1000000).toFixed(1).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") 
      TOT_DATA.UNIT = '백만'
    }
    TOT_DATA.EMP_CNT = temp_emp_cnt.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") 
    TOT_DATA.TOT_CNT = temp_tot_cnt.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") 
    TOT_DATA.PERCENT = ((temp_emp_cnt/temp_tot_cnt)*100).toFixed(1) 
    
    // 사업부별 데이터
    console.log('res bsns',res[1])
    BSNS_DATA.forEach((e)=>{
      res[1].ORESULT_CUR.forEach((t)=>{
        if(e.BSNS_CD === t.BSNS_CD){
          // e.POINT = t.POINT.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
          e.POINT = t.POINT
          // console.log('POINT',e.POINT)
          if(e.POINT<1000000){
            e.POINT = e.POINT.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
            e.UNIT = ''
            
          }else if (e.POINT >= 1000000){
            e.POINT = (e.POINT/1000000).toFixed(1).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") 
            e.UNIT = '백만'
          }
        }
      })
      res[1].ORESULT_CUR2.forEach((t)=>{
        if(e.BSNS_CD === t.BSNS_CD){
          e.EMP_CNT = t.EMP_CNT.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
        }
      })
      res[1].ORESULT_CUR3.forEach((t)=>{
        if(e.BSNS_CD === t.BSNS_CD){
          e.TOT_CNT = t.TOT_CNT.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
        }
      })
      e.PERCENT = ((parseInt(e.EMP_CNT.replace(",",""))/parseInt(e.TOT_CNT.replace(",","")))*100).toFixed(1)
    })
    // console.log('BSNS_DATA',BSNS_DATA)

    console.log('res[2].ORESULT_CUR',res[2].ORESULT_CUR)
    // if(res[2].ORESULT_CUR3[0].length){

    // }
    // 전체 인원 없을 경우
    if(res[2].ORESULT_CUR3.length > 0){    
      console.log('res[2].ORESULT_CUR3',res[2].ORESULT_CUR3)
      searchParams.TOT_CNT = (res[2].ORESULT_CUR3[0].CNT).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
    } else {
      searchParams.TOT_CNT = '0'
    }
    SPAY.forEach((e)=>{
      e.POINT = 0
      e.EMP_CNT = 0
      e.TOT_CNT = '0'
      e.UNIT = ''
      e.PERCENT = '0.0'
      // codeList.MAX_DATA.forEach((m)=>{
        
      //   if(e.COD == m.COD){
      //     e.DAY_MAX = m.DAY_MAX 
      //   }
      // })
      if(res[2].ORESULT_CUR.length > 0){
        res[2].ORESULT_CUR.forEach((t)=>{
          if(e.COD == t.COD){
            // e.CNT = t.CONTENT_CNT //건수에 대한 데이터
            e.POINT = t.POINT
            if(e.POINT<1000000){
              e.POINT = e.POINT.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
              e.UNIT = ''
              
            }else if (e.POINT >= 1000000){
              e.POINT = (e.POINT/1000000).toFixed(1).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") 
              e.UNIT = '백만'
            }
            e.EMP_CNT = t.EMP_CNT 
            // e.TOT_CNT = res[2].ORESULT_CUR3[0].CNT
          }
        })
        e.TOT_CNT = res[2].ORESULT_CUR3[0].CNT
        
        if(e.EMP_CNT){
          e.PERCENT = ((e.EMP_CNT / e.TOT_CNT)*100).toFixed(1)
          e.EMP_CNT = e.EMP_CNT.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
        } else{
          e.EMP_CNT = '0'
          e.PERCENT = '0.0'
        }
      }else{
        e.EMP_CNT = '0'
        e.TOT_CNT = '0'
        e.UNIT = ''
        e.PERCENT = '0.0'
      }
      
      
      
     })
    // console.log('normalDay',normalDay)
    // console.log('SPAY',SPAY)
    // console.log('res[2].ORESULT_CUR2',res[2].ORESULT_CUR2)
    
   
    // console.log('lineChartsOptions.xAxis[0].data',lineChartsOptions._rawValue.xAxis[0].data)

    
    // const xAxisData = []
    // let fromDate = dayjs(searchParams.DATE_FROM)
    // let toDate = dayjs(searchParams.DATE_TO)
      
    // while(!fromDate.isAfter(toDate)){
    //   // console.log('fromDate',fromDate.format('YYYY-MM-DD'))
    //   fromDate = fromDate.add(1,'day')
    //   xAxisData.push(fromDate.format('YYYY-MM-DD'))
    // }
    // lineChartsOptions._rawValue.xAxis[0].data = xAxisData



    DATA_1 = []
    DATA_2 = []
    DATA_3 = []
    DATA_4 = []
    DATA_5 = []
    DATA_6 = []
    console.log('res[2].ORESULT_CUR2',res[2].ORESULT_CUR2)
    // 그래프 차트 일별 데이터
    // xAxisData.forEach((t,idx)=>{
    //   res[2].ORESULT_CUR2.forEach((e,idx2)=>{
    //     console.log('idx',idx)
    //     if(e.ACCUMULATED_DATE === t){
    //       console.log('ACCUMULATED_DATE',e.ACCUMULATED_DATE)
    //       console.log('t',t)

    //       if(e.COD === '10'){
    //         DATA_1[idx] = e.POINT
    //       } 
    //       else if(e.COD === '20'){
    //         DATA_2[idx] = e.POINT
    //       } 
    //       else if(e.COD === '30'){
    //         DATA_3[idx] = e.POINT
    //       } 
    //       else if(e.COD === '40'){
    //         DATA_4[idx] = e.POINT
    //       } 
    //       else if(e.COD === '50'){
    //         DATA_5[idx] = e.POINT
    //       } 
    //       else if(e.COD === '60'){
    //         DATA_6[idx] = e.POINT
    //       }else {
    //         DATA_1[idx] = 0
    //         DATA_2[idx] = 0
    //         DATA_3[idx] = 0
    //         DATA_4[idx] = 0
    //         DATA_5[idx] = 0
    //         DATA_6[idx] = 0
    //     } 
    //     } 
    //   })
    // }) 


    // console.log('xAxisData',xAxisData)
    // console.log('DATA_1',DATA_1)
    // console.log('DATA_2',DATA_2)
    // console.log('DATA_3',DATA_3)
    // console.log('DATA_4',DATA_4)
    // console.log('DATA_5',DATA_5)
    // console.log('DATA_6',DATA_6)

    res[2].ORESULT_CUR2.forEach((e)=>{
      if(e.COD === '10'){
        DATA_1[e.MNTH-1] = e.POINT
      }
      if(e.COD === '20'){
        DATA_2[e.MNTH-1] = e.POINT
      }
      if(e.COD === '30'){
        DATA_3[e.MNTH-1] = e.POINT
      }
      if(e.COD === '40'){
        DATA_4[e.MNTH-1] = e.POINT
      }
      if(e.COD === '50'){
        DATA_5[e.MNTH-1] = e.POINT
      }
      if(e.COD === '60'){
        DATA_6[e.MNTH-1] = e.POINT
      }
    })
    lineChartsOptions.value.series.map((x) => {
      
      switch (x.name) {
        case "안전작업지시":
          x.data = [...DATA_1]
          break

        case "안전제보":
          x.data = [...DATA_2]
          break

        case "안전교육":
          x.data = [...DATA_3]
          break

        case "현장위험성평가":
          x.data = [...DATA_4]
          break

        case "안전점검":
          x.data = [...DATA_5]
          break

        case "안전칭찬쿠폰":
        x.data = [...DATA_6]
          break
      }
    })
    // console.log('res[3].ORESULT_CUR',res[3].ORESULT_CUR)

    const TEMP_LIST = []
    TEMP_LIST[0] = res[3].ORESULT_CUR // 직영 부서 순위
    TEMP_LIST[1] = res[3].ORESULT_CUR2 // 협력사 순위
    TEMP_LIST[2] = res[3].ORESULT_CUR3 // 직영 개인 순위
    TEMP_LIST[3] = res[3].ORESULT_CUR4 // 협력사 개인 순위
    // console.log('TEMP_LIST',TEMP_LIST)
    RANK_TITLE.forEach((e,idx)=>{
      RANK_LIST[idx] = []
      // console.log('TEMP_LIST',TEMP_LIST[idx])
      RANK_ICON.forEach((icon,idx2)=>{
        if(TEMP_LIST[idx][idx2] !== undefined){
          const title = TEMP_LIST[idx][idx2].TXT
          let subTitle = ''
          if(idx === 0 || idx === 1){
            // 2024.08.06 박용훈 천단위 , 추가
            //subTitle = ' 평균 포인트: ' + TEMP_LIST[idx][idx2].AVG_POINT
            subTitle = ' 평균 포인트: ' + (TEMP_LIST[idx][idx2].AVG_POINT).toLocaleString("en-US")
          }else if(idx === 2 || idx === 3){
            // 2024.08.06 박용훈 천단위 , 추가
            //subTitle = ' 누적 포인트: ' + TEMP_LIST[idx][idx2].POINT
            subTitle = ' 누적 포인트: ' + (TEMP_LIST[idx][idx2].POINT).toLocaleString("en-US")
          }

          RANK_LIST[idx][idx2] =
          {
            title: title,
            subTitle: subTitle,
            value: idx2+1,
            icon: icon,
            props: {
              prependIcon: icon,
            }
          }
        }
        
      })
    })
    console.log('RANK_LIST : ', RANK_LIST)

  })


 

  // lineChartsOptions.value.yAxis.map((x) => {
  //   x.max = TopAllCnt.value
  // })
}

const getImgUrl = imgNm => {
  return new URL(`/src/assets/images/icons/${imgNm}_icon.png`, import.meta.url).href
}

// 사업부 변경감지
watch(
  () => searchParams.BSNS_CD,
  (newValue) => {
    if (!newValue) {
      NOBSNS.value = true
      searchParams.DEPT_CD = ""
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        searchParams.DEPT_CD = ""
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
        codeList.ASGN_CD = [{ASGN_NM: "전체", ASGN_CD: ""}]
        NOBSNS.value = false
        // console.log(codeList.DEPT_CD)
      })
    }
  }
)


// 부서 변경감지
watch(
  () => searchParams.DEPT_CD,
  (newValue) => {
    // console.log('dept newValue',newValue)
    if (!newValue) {
      NODEPT.value = true
      searchParams.ASGN_CD = ""
    } else if(newValue === ""){
      NODEPT.value = true
      searchParams.ASGN_CD = ""
      codeList.ASGN_CD = [{ASGN_NM: "전체", ASGN_CD: ""}]
    }
    else {
      commonSearchApi({
        queryId: "searchTeam",
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: newValue },
      }).then((res) => {
        searchParams.ASGN_CD = ""
        codeList.ASGN_CD = res.ORESULT_CUR
        // console.log('codeList.ASGN_CD',codeList.ASGN_CD)
        codeList.ASGN_CD.unshift({ ASGN_NM: "전체", ASGN_CD: "" })
        NODEPT.value = false
        // console.log(codeList.ASGN_CD)
      })
    }
  }
)

watch(
  () => searchParams.DATE_TYPE,
  (newValue) => {
    console.log('DATE_TYPE',newValue)
    
    if(newValue === 'YEAR'){
      searchParams.RANK_DATE_FROM = dayjs(new Date()).format('YYYY')
    }
    if(newValue === 'month'){
      searchParams.RANK_DATE_FROM = dayjs(new Date()).format('YYYY-MM')
    }
    if(newValue === 'date'){
      searchParams.RANK_DATE_FROM = dayjs(new Date().setDate(new Date().getDate() - 30)).format('YYYY-MM-DD')
    }
  }
)

watch(
  () => SPAY[0],
  (e) => {
    ISSPAY.value = true
  }
)



const calcColor = (percent) => {
  if (percent <= 5) {
    return "#1E88E5"
  } else if (percent > 5 && percent <= 10) {
    return "#1976D2"
  } else if (percent > 10 && percent <= 15) {
    return "#1565C0"
  } else if (percent < 15) {
    return "#0D47A1"
  }
}

// //공사기간 입력란 데이터 변경시 처리
// const dateChange = async (e) => {
//   const startDt = searchParams.RANK_DATE_FROM.replaceAll('-','')
//   const endDt = searchParams.RANK_DATE_TO.replaceAll('-', '')

//   if (startDt > endDt) {
//     Message.err('기간이 잘못 되었습니다.')
//     const date1 = new Date(searchParams.RANK_DATE_FROM)
//     const date2 = new Date(searchParams.RANK_DATE_TO)
//     const diffDate = date1.getTime() - date2.getTime()    
//     console.log('차이',diffDate)
//     // if(diff < 0)
//     // searchParams.RANK_DATE_TO = searchParams.RANK_DATE_FROM
//   }

//   // day.value = +1+'일'

// }

// watch(
//   () => searchParams.RANK_DATE_FROM,
//   (newFrom) => {
    
//     if (newFrom && searchParams.DATE_TYPE === 'date') {
//       const fromDate = dayjs(newFrom)
//       const toDate = dayjs(searchParams.RANK_DATE_TO)

//       if (fromDate.isAfter(toDate)) {
//         Message.warn(t("올바른 검색기간을 설정해주세요."))
//         searchParams.RANK_DATE_FROM = dayjs().startOf("month").format("YYYY-MM-DD")
//         return false
//       }
//     }
//   },
//   { deep: true }
// )
 
// watch(
//   () => searchParams.RANK_DATE_TO,
//   (newTo) => {
//     if (newTo && searchParams.DATE_TYPE === 'date') {
//       const fromDate = dayjs(searchParams.RANK_DATE_FROM)
//       const toDate = dayjs(newTo)
//       if (toDate.isBefore(fromDate)) {
//         Message.warn(t("올바른 검색기간을 설정해주세요."))

//         searchParams.RANK_DATE_TO = dayjs().format("YYYY-MM-DD")
//         return false
//       }
//     }
//   },
//   { deep: true }
// )


const stDateInput = () => {
  // console.log('page5 ', page5)

  // console.log('WORK_FROM_DT ::  ', page5.WORK_FROM_DT)
  // console.log('WORK_TO_DT ::  ', page5.WORK_TO_DT)
  
  //위험작업 시작날짜
  let wrkStDt = searchParams.RANK_DATE_FROM.replace(/-/g, "")
  //위험작업 종료날짜
  let wrkEnDt = searchParams.RANK_DATE_TO.replace(/-/g, "")

  // //작업종료일자보다 날짜가 클 경우 종료일자도 같은 날짜로 설정
  if (wrkStDt > wrkEnDt) {
    searchParams.RANK_DATE_TO = searchParams.RANK_DATE_FROM
    Message.warn(t("올바른 검색기간을 설정해주세요."))
  }

 

}

/**
 *작업정보 상세 작업종료 날짜 체크 
 * @param {'작업상세 리스트 인덱스'} arrIndex 
 * 단기공사 종료 날짜 보다 뒤의 날짜는 선택불가
 * 조건에따라 작업 시작 날짜랑 비교해서 일수가 7일 또는 3일안으로 설정되도록 기능 구현함
 */
const enDateInput = () => {

  // console.log('e ', e)

  //위험작업 시작날짜
  let wrkStDt = searchParams.RANK_DATE_FROM.replace(/-/g, "")
  //위험작업 종료날짜
  let wrkEnDt = searchParams.RANK_DATE_TO.replace(/-/g, "")
  // //작업종료일자보다 날짜가 클 경우 종료일자도 같은 날짜로 설정

  if (wrkStDt > wrkEnDt) {
    searchParams.RANK_DATE_FROM = searchParams.RANK_DATE_TO  
    Message.warn(t("올바른 검색기간을 설정해주세요."))
  }
}


</script>

<template>
  <v-card class="pa-0 fill-height" style="overflow-y: auto;">
    <v-card-title class="pa-3 pb-0" style="display: flex; flex-direction: column;">
      <IMenuTitle
        ref="menuTitle"
        :title="'HD안전페이 대시보드'"
      />
      <div style="display: flex; justify-content: space-around;">
      <v-card class="fill-height" style="width: 20%; border-width: 2px;">
        <v-card-title class="pa-0 py-2" style="display: flex; justify-content: center;">
          <p style="text-align: center;">
            전사 HD안전페이 현황
            {{`(${dayjs().format("YYYY.MM.DD")} 기준)`}}
          </p>
        </v-card-title>
        <v-card-text class="pa-0 h-auto pl-2 pr-2" style="display: flex;">
          <div class="mt-4 mb-4" style="width: 100%; display: flex; justify-content: space-around;">
            <v-card class="pa-1 fill-height" style="width: 48%; border-width: 1px;" >
              <v-card-title class="pa-0 py-2" style="display: flex; justify-content: center;">
                <p style="text-align: center;">
                  {{`${dayjs().format("YYYY.MM.DD").substring(2,4)}년`}} HD안전페이<br>포인트 실적 
                </p>
              </v-card-title>
              <v-card-text class="pa-0 h-auto pl-2 pr-2" style="display: flex; justify-content: center; ">
                <div class="mt-6 mb-4 d-flex flex-wrap">
                  <div
                    class="d-flex justify-center flex-column text-center"
                  >
                    <div>
                      <!-- 2024.08.06 박용훈 글짜 크기 수정 -->
                      <p style="font-size: 20px; margin-bottom: 10px;">
                        {{ TOT_DATA.POINT + ` ` + TOT_DATA.UNIT }} 
                      </p>
                    </div>
                    <div>
                      <p style="font-size: 18px;margin-bottom: 10px;">
                        Point
                      </p> 
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
            <v-card class="pa-1 fill-height" style="width: 48%; border-width: 1px;">
              <v-card-title class="pa-0 py-2" style="display: flex; justify-content: center;">
                <p style="text-align: center;">
                  {{`${dayjs().format("YYYY.MM.DD").substring(2,4)}년`}} HD안전페이<br>참여율(%) 
                </p>
              </v-card-title>
              <v-card-text class="pa-0 h-auto pl-2 pr-2" style="display: flex; justify-content: center;">
                <div class="mt-4 mb-4 d-flex flex-wrap">
                  <div
                    class="d-flex justify-center flex-column text-center"
                  >
                    <div>
                      <!-- 2024.08.06 박용훈 글짜 크기 수정 -->
                      <p style="font-size: 20px;margin-bottom: 5px;">
                         {{ TOT_DATA.EMP_CNT }}명
                      </p>
                    </div>
                    <div>
                      <p style="font-size: 14px;margin-bottom: 5px;">
                        [{{ TOT_DATA.TOT_CNT }}명 기준]
                      </p> 
                    </div>
                    <div>
                      <p style="font-size: 18px;margin-bottom: 5px;">
                        ({{ TOT_DATA.PERCENT }}%)
                      </p> 
                    </div>
                    
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
      </v-card>
      <v-card class="fill-height" style="width: 79%; border-width: 2px;">
        <v-card-title  style="display: flex; justify-content: flex-start; padding-bottom: 24px;">
          <p style="text-align: center;">
            사업부 HD안전페이 현황
            {{`(${dayjs().format("YYYY.MM.DD")} 기준)`}}
          </p>
        </v-card-title>
        <v-card-text class="pl-2 pr-2 pb-4" style="display: flex; justify-content: space-around;">
          <v-card 
            class="fill-height" style="width: 19%; border-width: 1px;"
            v-for="(item, index) in BSNS_DATA"
            :key="index">
              <v-card-title class="pa-0 py-2" style="display: flex; justify-content: center; align-items: center;">
                <img  :src="getImgUrl(item.BSNS_CD)">
                <!-- <v-icon v-if="index === 4" icon="mdi-office-building" color="#003087" style="font-size: 28px;"></v-icon> -->
                <p style="padding-left: 8px;">
                  {{ item.BSNS_NM }} 
                </p>
              </v-card-title>
              <v-card-text class="pa-0 h-auto pl-2 pr-2" >
                <div
                :style="{
                  display: 'flex', 
                  justifyContent: 'space-around', 
                  marginBottom: index === 1 ? '22px' : '19px',
                  marginTop: index === 1 ? '14px' : '17px',
                  }">
                  <div
                    class="d-flex  flex-column text-center"
                    style="width: 40%"
                  >
                    <div>
                      <p style="font-size: 20px;margin-bottom: 10px;">
                        [포인트]
                      </p>
                    </div>
                    <div>
                      <p style="font-size: 20px; margin-bottom: 5px; margin-top: 5px;">
                        {{ item.POINT + ` ` + item.UNIT}}
                      </p> 
                    </div>
                    <div>
                      <p style="font-size: 18px;">
                        Point
                      </p> 
                    </div>
                  </div>
                  <v-divider vertical :thickness="3" class="border-opacity-75"/>
                  <div
                    class="d-flex  flex-column text-center"
                    style="width: 40%"
                  >
                    <div>
                      <p style="font-size: 20px;margin-bottom: 2px;">
                        [참여율]
                      </p>
                    </div>
                    <div>
                      <p style="font-size: 20px;margin-bottom: 2px; margin-top: 5px;">
                        {{ item.EMP_CNT + ` 명` }}
                      </p> 
                    </div>
                    <div>
                      <p style="font-size: 14px;margin-bottom: 2px;">
                        ({{ item.TOT_CNT + ` 명 기준` }})
                      </p> 
                    </div>
                    <div>
                      <p style="font-size: 18px;">
                        {{ item.PERCENT + ` %` }}
                      </p> 
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
        </v-card-text>
      </v-card>
    </div>
    </v-card-title>
    <v-card-text class="pa-3 content-area">
      <v-sheet class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex" style="justify-content: space-between;">
          <div style="display: flex;">
            <!-- <i-select
              :label="$t('년도')"
              labelWidth="26px"
              width="130px"
              v-model="searchParams.YEAR"
              type="YEAR"
            /> -->
            <!-- <i-input labelWidth="52px" width="200px" 
              :label="$t('적립기간')" type="date"
              v-model="searchParams.DATE_FROM"
              margin="10px"
            />
            <i-input width="155px"
              :label="$t('-')" type="date"
              v-model="searchParams.DATE_TO"
            /> -->
            <i-input
              :label="$t('적립기간')"
              labelWidth="50px"
              width="250px"
              type="month"
              v-model="searchParams.DATE_FROM"
            />
            <i-select
              :label="$t('사업부')"
              width="290px"
              label-width="40px"
              margin="12px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              :disabled="NOCMPNY"
            />
            <i-select
              :label="$t('부서')"
              width="290px"
              label-width="30px"
              margin="12px"
              placeholder="부서"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :disabled="NOBSNS"
            />
            <i-select
              :label="$t('협력사')"
              width="300px"
              label-width="40px"
              margin="12px"
              :items="codeList.ASGN_CD"
              v-model="searchParams.ASGN_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              :disabled="NODEPT"
            />
          </div>
          <div style="display: flex; align-items: center;">
            <v-btn  @click="onButtonClick">조회</v-btn>
          </div>
        </v-sheet>
        <v-sheet class="d-flex pb-3" style="height: 70%;">
          <div class="h-grow h-auto">
            <!-- 사고 등록 -->
            <v-sheet class="pa-0 mr-3 d-flex flex-column" style="width: 100%;">
              <div class="fill-height" style="display: flex;">
                <v-sheet class="mb-0 h-auto" style="width: 38%; padding-right: 4px;">
                  <v-card class="pa-0 h-auto">
                    <v-card-title class="pa-0 pb-2">
                      {{
                        "HD안전페이 컨텐츠 현황"
                      }}
                    </v-card-title>
                    <div class="d-flex flex-wrap justify-center fill-height">
                      <div
                        class="SPAYDiv"
                        v-for="(item, index) in SPAY.filter(
                          (x) => x.COD !== 'TOT'
                        )"
                        :key="index"
                        
                      >
                      <v-card class="ma-1" style="border: #e4e4e4 1px solid; height: 95%; ">
                        <v-card-title>
                          <p style="font-size: 18px; font-weight: bold;">
                            {{ item.TXT }}
                          </p>
                        </v-card-title>
                        <v-card-text class="pa-0">
                          <div
                            :style="{
                              display: 'flex',  
                              flexDirection: 'column',
                              alignItems: 'center',
                              marginBottom: '19px',
                              marginTop: '17px',
                              }">
                            <div
                              class="d-flex  flex-column text-center"
                            >
                              <!-- <div>
                                <p style="font-size: 18px;margin-bottom: 10px;">
                                  [포인트]
                                </p>
                              </div> -->
                              <div style="display: flex;">
                                <p :style="{fontSize: '24px',
                                          marginBottom: '10px',
                                          color: `${item.COLOR}`,
                                          }">
                                  {{ item.POINT }}
                                </p>
                                <p style="font-size: 24px;margin-bottom: 10px;">
                                  {{ ` ` + item.UNIT}}
                                </p> 
                              </div>
                              <div>
                                <p style="font-size: 16px;">
                                  Point
                                </p> 
                              </div>
                            </div>
                            <v-divider :thickness="2" class="border-opacity-75" style="width: 80%; margin-bottom: 14px; margin-top: 14px;"/>
                            <div
                              class="d-flex  flex-column text-center"
                            >
                              <!-- <div>
                                <p style="font-size: 18px;margin-bottom: 4px;">
                                  [참여율]
                                </p>
                              </div> -->
                              <div>
                                <p style="font-size: 20px;margin-bottom: 4px;">
                                  {{ item.EMP_CNT + ` 명 ` }} [{{ item.PERCENT + ` %` }}]
                                </p> 
                              </div>
                              <div>
                                <p style="font-size: 16px;">
                                  ({{ searchParams.TOT_CNT + ` 명 기준` }})
                                </p> 
                              </div>
                            </div>
                          </div>
                        </v-card-text>
                      </v-card>
                      </div>
                    </div>
                  </v-card>
                </v-sheet>
                <!-- 사고 현황 -->
                <v-sheet class="pa-0 h-auto" style="width: 59%;">
                  <v-card class="pa-0 h-auto">
                    <v-card-title class="pa-1 pb-2">
                      {{
                        `${searchParams.YEAR}년도 HD안전페이 현황`
                      }}
                    </v-card-title>
                    <v-card-text class="pa-1">
                      <e-chart :option="lineChartsOptions" />
                    </v-card-text>
                  </v-card>
                </v-sheet>
              </div>
            </v-sheet>
          </div>
        </v-sheet>
        <!-- 2024.08.06 박용훈 툴팁 기능 추가 -->
        <!-- 2024.08.07 염인식 툴팁 관련 추가 -->
        <v-sheet class="pb-3" style="height: 40%; display: flex; flex-direction: column;">
          <v-sheet class="searchArea d-flex" style="justify-content: space-between;">
            <div style="display: flex;">
              <i-select
                width="150px"
                :label="$t('적립기간')"
                v-model="searchParams.DATE_TYPE"
                :items="codeList.DATE_LIST"
                item-value="COD"
                item-title="TXT"
              /> 
              <!-- <i-input labelWidth="52px" width="200px" 
                :label="$t('적립기간')" type="date"
                v-model="searchParams.DATE_FROM"
                margin="10px"
              />-->
              <i-select
                v-if="searchParams.DATE_TYPE === 'YEAR'"
                v-model="searchParams.RANK_DATE_FROM"
                width="100px"
                :type="searchParams.DATE_TYPE"
              />
              <i-input
                v-if="searchParams.DATE_TYPE !== 'YEAR'"
                labelWidth="50px"
                width="150px"
                :type="searchParams.DATE_TYPE"
                v-model="searchParams.RANK_DATE_FROM"
                @change="stDateInput"
              />
              <i-input 
                v-if="searchParams.DATE_TYPE === 'date'"
                width="155px"
                :label="$t('-')" 
                :type="searchParams.DATE_TYPE"
                v-model="searchParams.RANK_DATE_TO"          
                @change="enDateInput"  
              /> 
            </div>
          </v-sheet>
          <v-sheet class="d-flex">
            <v-card
              class="mx-auto"
              style="width: 23%; border-width: 1px;"
              v-for="(item, index) in RANK_TITLE"
              :key="index"
            >
            <v-card-title>
              <p>{{ item }}</p>
            </v-card-title>
            <v-card-text>
              <v-list >
                <v-list-item
                  v-for="n in RANK_LIST[index]"
                  :key="n"
                  >
                  <template v-slot:prepend>
                      <v-icon :icon="n.icon" style="font-size: 26px"></v-icon>
                      <div class="flex-column">
                        <v-tooltip location="top">
                          <template v-slot:activator="{ props }">
                            <div class="listTitle" v-bind="props">{{ n.title }}</div>
                          </template>
                          <div class="d-flex align-center tooltip_div">
                            {{ n.title }} - {{ n.subTitle }}
                          </div>
                        </v-tooltip>

                        <div class="mt-1">{{ n.subTitle }}</div> 
                      </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
            </v-card>
          </v-sheet>
        </v-sheet>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">

.v-card-title {
  color: #222;
  font-size: 18px;
  font-weight: 700;
}
.content-area {
  position: relative;
  overflow-y: auto;
  > div {
    min-height: 780px;
  }
}
.textBold {
  font-size: 22px;
  font-weight: 700;
}

.divide {
  font-size: 18px;
  .bold {
    font-size: 30px;
    font-weight: 700;
  }
  .percent {
    font-size: 18px;
    color: #666666;
  }
  .v-col {
    border-right: #e4e4e4 1px solid;
    // height:150px;
  }
  .v-col:last-child {
    border: none;
  }
  border-bottom: #e4e4e4 1px solid;
}
.divide:last-child {
  border: none;
}
.divide_col {
  border-right: #e4e4e4 1px solid;
}
.topCard {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  .v-col:nth-child(2) {
    .divide_col {
      border: none;
    }
  }

  .v-col:nth-child(3) {
    border: none;
  }
  .v-col:nth-child(4) {
    .divide_col {
      border: none;
    }
  }
}
.nonTypes {
  .v-col {
    border-right: #e4e4e4 1px solid;
    border-bottom: #e4e4e4 1px solid;
    height: 33.3%;
    position: relative;
  }
  .v-col:nth-child(2) {
    border-right: none;
  }
  .v-col:nth-child(4) {
    border-right: none;
  }
  .v-col:nth-child(5) {
    border-bottom: none;
  }
  .v-col:last-child {
    border-right: none;
    border-bottom: none;
  }
  .percent {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
  }
}
.types {
  .v-col {
    // border-right: #E4E4E4 1px solid;
    // border-bottom: #E4E4E4 1px solid;
    height: 23%;
    position: relative;
  }

  .v-col:nth-child(4) {
    .divide_col {
      border-right: none;
    }
  }
  .v-col:nth-child(8) {
    .divide_col {
      border-right: none;
    }
  }
  .v-col:nth-child(12) {
    .divide_col {
      border-right: none;
    }
  }
  .v-col:nth-child(13) {
    border-bottom: none;
  }
  .v-col:nth-child(14) {
    border-bottom: none;
  }
  .v-col:nth-child(15) {
    border-bottom: none;
  }
  .v-col:nth-child(16) {
    .divide_col {
      border-right: none;
    }
  }
  .v-col:last-child {
    border-right: none;
    border-bottom: none;
  }
  .percent {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
  }
}
.pieChartContainer {
  margin: 8px auto;
  height: 200px;
  max-height: 241px;
  width: 250px;
  text-align: center;
}
.pieChartContainer2 {
  // padding-left: 10px;
  // padding-right: 40px;
  height: 100px;
  max-height: 100px;
  width: 80px;
  margin: 0 0 0 15px;
}
.title {
  font-size: 14pt;
}
.tooltip {
  color: #1d43ca;
  .bold {
    font-weight: 700;
  }
}

.H2TextBox {
  width: 160px;
  font-size: 14px;
  font-weight: 400;
  margin: 16px 10px;
}

.normal {
  width: 90px;
  display: inline-block;
}

.top-emphasis {
  font-size: 28px;
  width: 57px;
  text-align: right;
  font-weight: 800;
  display: inline-block;
}
.bottom-emphasis {
  font-size: 26px;
  font-weight: 800;
}
.SPAYDiv {
  box-sizing: border-box;
  width: 30%;
  height: 50%;
  text-align: center;
}

.TextOverFlow {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.border-apply {
  border-width: 1px;
}

/* 2024.08.07 염인식 툴팁 관련 추가 */
.listTitle {
  font-size: 14pt;
  font-weight: bold;
  cursor: pointer;
  width: 260px; /* 원하는 너비를 설정 */
  white-space: nowrap; /* 텍스트가 한 줄로 유지되도록 설정 */
  overflow: hidden; /* 넘치는 텍스트를 숨김 */
  text-overflow: ellipsis; /* 넘치는 텍스트에 생략 부호를 표시 */
}

.tooltip_div {
  background-color: white;
  color: black;
  margin: -3px -7px;
  padding: 8px;
  font-size: 12pt;
  font-weight: bold;
  // border: 1px solid black;
  text-align: center;
}
</style>
