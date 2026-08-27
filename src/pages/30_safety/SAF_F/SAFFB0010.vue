<!-- 김성근 SLI 일자별 현황  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import { color } from 'echarts/core'
import dayjs from 'dayjs'

defineOptions({
  name:'30_safety-SAF_F-SAFFB0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const grdMain = ref(null)

const searchParams = reactive({ 
  CMPNY_DIV:userStore.cmpnyDiv,
  FROM_DT:dayjs().add(-1, 'day').format('YYYY-MM-DD'),
  TO_DT:dayjs().add(-1, 'day').format('YYYY-MM-DD')

})


const codeList = reactive({
  ASGN_CD:[],
  PART_CD:[],

})

const gradeList = reactive([
  // {Text:'안전',Color:'#C0FFC0'},
  // {Text:'주의',Color:'#FFFFC0'},
  // {Text:'경고',Color:'#FFE0C0'},
  // {Text:'위험',Color:'#FF8080'}
  {Text:'안전',Color:'rgba(5, 129, 253, 0.1)'},
  {Text:'주의',Color:'rgba(11, 182, 156, 0.1)'},
  {Text:'경고',Color:'rgba(255, 118, 55, 0.1)'},
  {Text:'위험',Color:'rgba(255, 82, 82, 0.1)'}
])

onMounted(()=>{

  Promise.all([
    commonSearchApi({ queryId : 'SAFFB0010_search02', 
    param : { CMPNY_DIV: userStore.cmpnyDiv} 
    })
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.PART_CD.unshift({ PART_NM: "전체", PART_CD: "" })
    codeList.ASGN_CD.unshift({ ASGN_NM: "전체", ASGN_CD: "" })
  })
  grdMain.value.getGridView().setFixedOptions({colCount: 3})
})



//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : {edit: { editable:false }, header: { height: 75 }},
  keys : [''],
  fields : [ 
  //   { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, width:'230',
  //   styleCallback: function(grid, dataCell){
  //     // console.log(dataCell,'dataCell')
  //     let ret = {}
  //     let gender = grid.getValue(dataCell.index.itemIndex, "TOT_GRADE")
  //     if( (gender == '안전')){
  //       ret.style = {background:"#C0FFC0"}
  //     }
  //     if( (gender == '주의')){
  //       ret.style = {background:"#FFFFC0"}
  //     }
  //     if( (gender == '경고')){
  //       ret.style = {background:"#FFE0C0"}
  //     }
  //     if( (gender == '위험')){
  //       ret.style = {background:"#FF8080"}
  //     }
  //     return ret
  //   },
  // },
  //   { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') },width:'230',styleName: "left-column",
  //   styleCallback: function(grid, dataCell){
  //     // console.log(dataCell,'dataCell')
  //     let ret = {}
  //     let gender = grid.getValue(dataCell.index.itemIndex, "TOT_GRADE")
  //     if( (gender == '안전')){
  //       ret.style = {background:"#C0FFC0"}
  //     }
  //     if( (gender == '주의')){
  //       ret.style = {background:"#FFFFC0"}
  //     }
  //     if( (gender == '경고')){
  //       ret.style = {background:"#FFE0C0"}
  //     }
  //     if( (gender == '위험')){
  //       ret.style = {background:"#FF8080"}
  //     }
  //     return ret
  //   },},
    { fieldName: 'ASGN_NM', dataType: 'text',width:'230', header: { text: t('조직')  },
    //   styleCallback: function(grid, dataCell){
    //   // console.log(dataCell,'dataCell')
    //   let ret = {}
    //   let gender = grid.getValue(dataCell.index.itemIndex, "TOT_GRADE")
    //   // if( (gender == '안전')){
    //   //   ret.style = {background:"#C0FFC0"}
    //   // }
    //   // if( (gender == '주의')){
    //   //   ret.style = {background:"#FFFFC0"}
    //   // }
    //   // if( (gender == '경고')){
    //   //   ret.style = {background:"#FFE0C0"}
    //   // }
    //   // if( (gender == '위험')){
    //   //   ret.style = {background:"#FF8080"}
    //   // }
    //   if( (gender == '안전')){
    //     ret.style = {background:gradeList[0].Color}
    //   }
    //   if( (gender == '주의')){
    //     ret.style = {background:gradeList[1].Color}
    //   }
    //   if( (gender == '경고')){
    //     ret.style = {background:gradeList[2].Color}
    //   }
    //   if( (gender == '위험')){
    //     ret.style = {background:gradeList[3].Color}
    //   }
    //   return ret
    // },
    styleName: "left-column"
  },  

    // { fieldName: 'DEPT_PERSONNEL', dataType: 'text', header: { text: t('인원') } ,styleName: "right-column",},
    // { fieldName: 'DEPT_WEIGHT', dataType: 'text', header: { text: t('인원가중치') },styleName: "right-column", },
    
  //     // 안전사고
  //   { fieldName: 'ACC_COUNT_A', dataType: 'text', header: { text: t('중대재해') },styleName: "right-column", },
  //   { fieldName: 'ACC_COUNT_B', dataType: 'text', header: { text: t('중대성사고') } ,styleName: "right-column",},
  //   { fieldName: 'ACC_COUNT_C', dataType: 'text', header: { text: t('산재사고') } ,styleName: "right-column",},
  //   { fieldName: 'ACC_COUNT_D', dataType: 'text', header: { text: t('휴업사고') } ,styleName: "right-column"},
  //   { fieldName: 'ACC_COUNT_E', dataType: 'text', header: { text: t('일반사고') },styleName: "right-column" },
  //   { fieldName: 'ACC_MPOINT_TOT2', dataType: 'text', header: { text: t('안전사고 감점합') },styleName: 'editable_column right-column' },
  //   { fieldName: 'ACC_POINT', dataType: 'text', header: { text: t('안전사고 점수') },styleName: 'editable_column right-column' },

  //   // 안전수칙
  //   { fieldName: 'RUL_COUNT_A', dataType: 'text', header: { text: t('절대수칙') },styleName: "right-column", },
  //   { fieldName: 'RUL_COUNT_B', dataType: 'text', header: { text: t('중대성수칙') } ,styleName: "right-column",},
  //   { fieldName: 'RUL_COUNT_C', dataType: 'text', header: { text: t('작업중지') } ,styleName: "right-column",},
  //   { fieldName: 'RUL_COUNT_D', dataType: 'text', header: { text: t('시정통보') } ,styleName: "right-column",},
  //   { fieldName: 'RUL_COUNT_E', dataType: 'text', header: { text: t('일반수칙') } ,styleName: "right-column",},
  //   { fieldName: 'RUL_MPOINT_TOT2', dataType: 'text', header: { text: t('안전수칙 감점합') } ,styleName: "right-column editable_column"},
  //   { fieldName: 'RUL_POINT', dataType: 'text', header: { text: t('안전수칙 점수') },styleName: "right-column editable_column" },

  //   // 안전교육
  //   { fieldName: 'EDU_COUNT_A', dataType: 'text', header: { text: t('정기 보건교육 ') },styleName: "right-column", },
  //   { fieldName: 'EDU_COUNT_B', dataType: 'text', header: { text: t('관리감독자 보건교육 ') } ,styleName: "right-column",},
  //   { fieldName: 'EDU_COUNT_C', dataType: 'text', header: { text: t('단기공사 안전교육 ') } ,styleName: "right-column",},
  //   { fieldName: 'EDU_COUNT_D', dataType: 'text', header: { text: t('사내강사\n(내국인) ') } ,styleName: "right-column",},
  //   { fieldName: 'EDU_COUNT_E', dataType: 'text', header: { text: t('사내강사\n(외국인) ') } ,styleName: "right-column",},
  //   { fieldName: 'EDU_MPOINT_TOT2', dataType: 'text', header: { text: t('안전교육 감점합') } ,styleName: "right-column editable_column"},
  //   { fieldName: 'EDU_POINT', dataType: 'text', header: { text: t('안전교육 점수') },styleName: "right-column editable_column" },
 

  //   // 위험성평가
  //   { fieldName: 'DNG_COUNT_A', dataType: 'text', header: { text: t('수시\n(안전사고) ') },styleName: "right-column", },
  //   { fieldName: 'DNG_COUNT_B', dataType: 'text', header: { text: t('수시\n(비일상)수') } ,styleName: "right-column",},
  //   { fieldName: 'DNG_COUNT_C', dataType: 'text', header: { text: t('안전작업요구권/안전제보 ') } ,styleName: "right-column",},
  //   { fieldName: 'DNG_COUNT_D', dataType: 'text', header: { text: t('현장 위험성평가\n(전일) ') } ,styleName: "right-column",},
  //   { fieldName: 'DNG_MPOINT_TOT2', dataType: 'text', header: { text: t('위험성평가 감점합') } ,styleName: "right-column editable_column",},
  //   { fieldName: 'DNG_POINT', dataType: 'text', header: { text: t('위험성평가 점수') } ,styleName: "right-column editable_column"},

  // //  점검부분
  //   { fieldName: 'CHK_COUNT_A', dataType: 'text', header: { text: t('일상점검') },styleName: "right-column", },
  //   { fieldName: 'CHK_COUNT_B', dataType: 'text', header: { text: t('일상점검\n3일 평균') } ,styleName: "right-column",},
  //   { fieldName: 'CHK_COUNT_D', dataType: 'text', header: { text: t('일상점검\n안전요원') } ,styleName: "right-column",},
  //   { fieldName: 'CHK_COUNT_E', dataType: 'text', header: { text: t('고위험작업\n(PTW 3중 대상)점검') } ,styleName: "right-column",},
  //   { fieldName: 'CHK_COUNT_F', dataType: 'text', header: { text: t('부서관리작업 점검') } ,styleName: "right-column",},
  //   { fieldName: 'CHK_MPOINT_TOT2', dataType: 'text', header: { text: t('일상점검 감점합') } ,styleName: "right-column editable_column",},
  //   { fieldName: 'CHK_POINT', dataType: 'text', header: { text: t('일상점검 점수') } ,styleName: "right-column editable_column"},

  //   { fieldName: 'TOT_GRADE', dataType: 'text', header: { text: t('등급') } },
  //   { fieldName: 'TOT_POINT', dataType: 'text', header: { text: t('합계점수') },styleName: "right-column", },
    // , mergeRule: { "criteria": "value" }
    { fieldName: 'YYYYMMDD', dataType: 'text', header: { text: t('조회일자') }, mergeRule: { criteria: 'value' }},
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, mergeRule: { criteria: 'value' } ,styleName: 'left-column', width: 100},
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') }, mergeRule: { criteria: 'value' } ,styleName: 'left-column', width: 100},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') } ,styleName: 'left-column', width: 125 },
    // 안전사고
    { fieldName: 'ACC_COUNT_A', dataType: 'text', header: { text: t('중대재해') }, width: 85},
    { fieldName: 'ACC_COUNT_B', dataType: 'text', header: { text: t('중대성사고') }, width: 85},
    { fieldName: 'ACC_COUNT_C', dataType: 'text', header: { text: t('산재사고') }, width: 85},
    { fieldName: 'ACC_COUNT_D', dataType: 'text', header: { text: t('휴업사고') }, width: 85},
    { fieldName: 'ACC_COUNT_E', dataType: 'text', header: { text: t('일반사고') }, width: 85},
    { fieldName: 'ACC_MPOINT_TOT2', dataType: 'text', header: { text: t('감점합') }, width: 85},
    { fieldName: 'ACC_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},
    // 안전수칙
    { fieldName: 'RUL_COUNT_G', dataType: 'text', header: { text: t('The Safe Care\n핵심안전수칙'), styleName: 'multiline-editor' }, width: 100},
    { fieldName: 'RUL_COUNT_A', dataType: 'text', header: { text: t('절대수칙') }, width: 85},
    { fieldName: 'RUL_COUNT_B', dataType: 'text', header: { text: t('중대성수칙') }, width: 85},
    { fieldName: 'RUL_COUNT_F', dataType: 'text', header: { text: t('크레인\n특별안전수칙'), styleName: 'multiline-editor' }, width: 85},
    { fieldName: 'RUL_COUNT_C', dataType: 'text', header: { text: t('작업중지') }, width: 85},
    { fieldName: 'RUL_COUNT_D', dataType: 'text', header: { text: t('시정통보') }, width: 85},
    { fieldName: 'RUL_COUNT_E', dataType: 'text', header: { text: t('일반수칙') }, width: 85},
    { fieldName: 'RUL_MPOINT_TOT2', dataType: 'text', header: { text: t('감점합') }, width: 85},
    { fieldName: 'RUL_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},
    // 안전교육
    { fieldName: 'EDU_COUNT_A', dataType: 'text', header: { text: t('정기\n안전보건교육'), styleName: 'multiline-editor' }},
    { fieldName: 'EDU_COUNT_B', dataType: 'text', header: { text: t('관리감독자\n안전보건교육'), styleName: 'multiline-editor' }},
    { fieldName: 'EDU_COUNT_C', dataType: 'text', header: { text: t('단기공사') }, width: 85},
    { fieldName: 'EDU_COUNT_D', dataType: 'text', header: { text: t('사내강사(내국인)\n등록'), styleName: 'multiline-editor'}, width: 125},
    { fieldName: 'EDU_COUNT_E', dataType: 'text', header: { text: t('사내강사(외국인)\n등록'), styleName: 'multiline-editor' }, width: 125},
    { fieldName: 'EDU_MPOINT_TOT2', dataType: 'text', header: { text: t('감점합') }, width: 85},
    { fieldName: 'EDU_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},
    // 위험성평가
    { fieldName: 'DNG_COUNT_A', dataType: 'text', header: { text: t('수시 위험성평가\n(안전사고)'), styleName: 'multiline-editor' }},
    // { fieldName: 'DNG_COUNT_B', dataType: 'text', header: { text: t('수시 위험성평가\n(비일상작업)'), styleName: 'multiline-editor' }},
    { fieldName: 'DNG_COUNT_C', dataType: 'text', header: { text: t('안전작업요구권\n/안전제보'), styleName: 'multiline-editor' }},
    { fieldName: 'DNG_COUNT_D', dataType: 'text', header: { text: t('현장 위험성평가'), styleName: 'multiline-editor' }},
    { fieldName: 'DNG_MPOINT_TOT2', dataType: 'text', header: { text: t('감점합') }, width: 85},
    { fieldName: 'DNG_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},
    // 안전점검
    { fieldName: 'CHK_COUNT_A', dataType: 'text', header: { text: t('일상점검') }, width: 85},
    { fieldName: 'CHK_COUNT_B', dataType: 'text', header: { text: t('일상점검\n(3일 평균)'), styleName: 'multiline-editor' }},
    // { fieldName: 'CHK_COUNT_D', dataType: 'text', header: { text: t('일상점검\n(안전요원)'), styleName: 'multiline-editor' }},
    { fieldName: 'CHK_COUNT_E', dataType: 'text', header: { text: t('PTW 점검\n(3중)'), styleName: 'multiline-editor' }},
    { fieldName: 'CHK_COUNT_F', dataType: 'text', header: { text: t('부서관리작업\n점검'), styleName: 'multiline-editor' }},
    { fieldName: 'CHK_MPOINT_TOT2', dataType: 'text', header: { text: t('가점합') }, width: 85},
    { fieldName: 'CHK_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},

    { fieldName: 'TOT_POINT', dataType: 'text', header: { text: t('합계점수') }, width: 75},
    { fieldName: 'TOT_GRADE', dataType: 'text', header: { text: t('합산등급') }, width: 75,
      styleCallback: function(grid, dataCell){
        // console.log(dataCell,'dataCell')
        let ret = {}
        let gender = grid.getValue(dataCell.index.itemIndex, "TOT_GRADE")
        // if( (gender == '안전')){
        //   ret.style = {background:"#C0FFC0"}
        // }
        // if( (gender == '주의')){
        //   ret.style = {background:"#FFFFC0"}
        // }
        // if( (gender == '경고')){
        //   ret.style = {background:"#FFE0C0"}
        // }
        // if( (gender == '위험')){
        //   ret.style = {background:"#FF8080"}
        // }
        if( (gender == '안전')){
          ret.style = {background:gradeList[0].Color}
        }
        if( (gender == '주의')){
          ret.style = {background:gradeList[1].Color}
        }
        if( (gender == '경고')){
          ret.style = {background:gradeList[2].Color}
        }
        if( (gender == '위험')){
          ret.style = {background:gradeList[3].Color}
        }
        return ret
      },
    },

    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부')}, visible: false},
    { fieldName: 'PART_CD', dataType: 'text', header: { text: t('부문')}, visible: false},
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서')}, visible: false},
    { fieldName: 'TREE_ID', visible: false },
  ],
  columns : [],
  columnLayout:[
  'ASGN_NM',
  'TOT_GRADE',
  'TOT_POINT',
  {
    name: "안전사고",
    direction: "horizontal",
    items: [
      "ACC_COUNT_A",
      "ACC_COUNT_B",
      "ACC_COUNT_C",
      "ACC_COUNT_D",
      "ACC_COUNT_E",
      "ACC_MPOINT_TOT2",
      "ACC_POINT",
    ],
    header: {
      text: t('안전사고(20)'),
    }
  }, 
  {
    name: "안전수칙",
    direction: "horizontal",
    items: [
      "RUL_COUNT_G",
      "RUL_COUNT_A",
      "RUL_COUNT_B",
      "RUL_COUNT_F",
      "RUL_COUNT_C",
      "RUL_COUNT_D",
      "RUL_COUNT_E",
      "RUL_MPOINT_TOT2",
      "RUL_POINT",
    ],
    header: {
      text: t('안전수칙(20)'),
    }
  }, 
  {
    name: "안전교육",
    direction: "horizontal",
    items: [
      "EDU_COUNT_A",
      "EDU_COUNT_B",
      "EDU_COUNT_C",
      "EDU_COUNT_D",
      "EDU_COUNT_E",
      "EDU_MPOINT_TOT2",
      "EDU_POINT",
    ],
    header: {
      text: t('안전교육(20)'),
    }
  }, 
  {
    name: "위험성평가",
    direction: "horizontal",
    items: [
      "DNG_COUNT_A",
      // "DNG_COUNT_B",
      "DNG_COUNT_C",
      "DNG_COUNT_D",
      "DNG_MPOINT_TOT2",
      "DNG_POINT",
    ],
    header: {
      text: t('위험성평가(20)'),
    }
  },
  {
    name: "안전점검/개입",
    direction: "horizontal",
    items: [
      "CHK_COUNT_A",
      "CHK_COUNT_B",
      // "CHK_COUNT_D",
      "CHK_COUNT_E",
      "CHK_COUNT_F",
      "CHK_MPOINT_TOT2",
      "CHK_POINT",
    ],
    header: {
      text: t('안전점검/개입(20)'),
    }
  },
  ]

})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

onMounted(() => {
  grdMain.value.getDataProvider().setRows()
})


//  조회
const MainChek = ()=>{
  // if(searchParams.YYYYMMDD == ''){
  //   Message.warn(t('조회일자는 필수 입력값 입니다.'))
  //   return   false
  // }
  return true
}
const searchData01 = idx => {
     searchParams.TO_DT  =  searchParams.FROM_DT 
     let param ={
      CMPNY_DIV :searchParams.CMPNY_DIV,
      FROM_DT :dayjs(searchParams.FROM_DT).format('YYYYMMDD'),
      TO_DT :dayjs(searchParams.TO_DT).format('YYYYMMDD'),
      BSNS_CD :searchParams.BSNS_CD,
      PART_CD :searchParams.PART_CD,
      DEPT_CD :searchParams.ASGN_CD,
     }

    return commonSearchApi({ queryId : 'SAFFB0010_search01', param: param})   
}

const afterSearch01 = res => {
 
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR,"TREE_ID")
}
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(MainChek)
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  } 
console.log('dmdkd')
}


const NOBSNS = ref(true)
const NOASGN = ref(true)

  watch(
    () => searchParams.BSNS_CD,
    (newValue) => {
      if (!newValue) {
        NOBSNS.value = true
        NOASGN.value =true
        searchParams.PART_CD = ""
          searchParams.ASGN_CD = ""
      } else {
        commonSearchApi({
          queryId: "SAFFB0010_search03",
          param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue },
        }).then((res) => {
          // console.log(res, "res")
          searchParams.PART_CD = ""
          searchParams.ASGN_CD = ""
          codeList.PART_CD = res.ORESULT_CUR
          codeList.PART_CD.unshift({ PART_NM: "전체", PART_CD: "" })
          NOBSNS.value = false
        })
        }
      })
  watch(
    () => searchParams.PART_CD,
    (newValue) => {
      if (!newValue) {
        NOASGN.value =true
        searchParams.ASGN_CD = ""
      } else {
        commonSearchApi({
          queryId: "SAFFB0010_search04",
          param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD,PART_CD:newValue },
        }).then((res) => {
          searchParams.ASGN_CD = ""
          codeList.ASGN_CD = res.ORESULT_CUR
          codeList.ASGN_CD.unshift({ ASGN_NM: "전체", ASGN_CD: "" })
          NOASGN.value = false
        })
        }
      })
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex mb-1">
          <i-input
              :label="$t('조회일자')"
              width="220px"
              margin="10px"
              v-model="searchParams.FROM_DT"
              type="date"
            />
            <i-select
              :label="$t('사업부')"
              width="235px"
              margin="10px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
        
            />
            <i-select
              :label="$t('부문')"
              width="235px"
              margin="10px"
              v-model="searchParams.PART_CD"
              :items="codeList.PART_CD"
              item-value="PART_CD"
              item-title="PART_NM"
              :disabled="NOBSNS"
            />
            <i-select
              :label="$t('부서')"
              width="235px"
              margin="10px"
              v-model="searchParams.ASGN_CD"
              :items="codeList.ASGN_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              :disabled="NOASGN"
              />
        </v-sheet>
        <v-sheet class="h-auto flex-column">
          <div class="d-flex align-self-end">
            <div v-for="item in gradeList" :key="item" class="d-flex align-center mb-1 ml-2">
              <div class="pr-1">{{ item.Text }}</div>
              <div class="border pa-2" :style="'width:40px; height:25px; background-color: ' + item.Color"></div>
            </div>
          </div>
          <RealGrid
            ref="grdMain"
            :is-tree="true"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

  
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>