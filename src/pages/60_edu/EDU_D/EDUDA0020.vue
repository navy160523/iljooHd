<!--
  화면명 : 협력사 안전평가
  화면개요 : 협력사 안전평가 조회 저장 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IButtonList from '@/components/IButtonList.vue'

defineOptions({
  name: '60_edu-EDU_D-EDUDA0020',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const saveParams= ref([])
const searchYn = ref(false) // 조회 여부
const onButtonsSub = ref(null)
const noYear = ref(false)
const noQuarter = ref(false)
let findIndex = 0

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'), // 년도
  QUARTER : '1', // 분기
  COMP_SAFETY_SEQ : '', // 협력사 안전평가 마스터 SEQ
})

const searchSaveParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date()).format('YYYY'), // 년도
  QUARTER : '1', // 분기
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, edit: { editable: true }, header: { height: 100 }, checkBar: { visible: true }, },
  keys : ['CMPNY_DIV','BSNS_CD','COMP_CD','ASGN_CD','PART_CD'],
  fields : [
    // 중앙 정렬은 styleName 삭제 styleName: 'left-column'/'right-column'
    { fieldName: 'BSNS_NM', dataType: 'text', width: '120', header: { text: t('사업부') }, styleName: 'left-column' },
    { fieldName: 'PRNT_NM', dataType: 'text', width: '120', header: { text: t('담당') }, styleName: 'left-column' },
    { fieldName: 'PART_NM', dataType: 'text', width: '120', header: { text: t('부문') }, styleName: 'left-column' },
    { fieldName: 'ASGN_NM', dataType: 'text', width: '120', header: { text: t('부서') }, styleName: 'left-column', editable: false },
    { fieldName: 'COMP_NM', dataType: 'text', width: '120', header: { text: t('협력사') }, styleName: 'left-column', editable: false },
    { fieldName: 'DSST_INDC', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('재해지표') }, editable: false },
    { fieldName: 'SFTY_MNGR_CMPT_ASSM', dataType: 'number', numberFormat: "#,###.##", width: '120', styleName: 'right-column', header: { text: t('안전관리자역량평가') }, editable: false },
    { fieldName: 'FCFC_INTRV', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('대면인터뷰') }, editable: false },
    { fieldName: 'SFTY_ACTVT', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('안전활동 건수') }, editable: false },
    { fieldName: 'RISK_ASSMN', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('위험성평가') }, editable: false },
    { fieldName: 'MBL_WRK_ORD', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('모바일 작업지시') }, editable: false },
    { fieldName: 'LGL_DOCS_CERTIFIED', dataType: 'number', numberFormat: "#,###.##", width: '120', styleName: 'right-column', header: { text: t('법적서류 및 인증') }, editable: false },
    { fieldName: 'CMP_SYS', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('제도준수') }, editable: false },
    { fieldName: 'SFTY_EDCT', dataType: 'number',numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('안전교육') }, editable: false },
    { fieldName: 'SITE_INSPC', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('현장점검') }, editable: false },
    { fieldName: 'SFTY_INTR_WORK', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('안전개입/안전작업 요구권') }, editable: false },
    { fieldName: 'ONST_ACTV', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('현장 개선활동') }, editable: false },
    { fieldName: 'HCARE_HSYS', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('건강관리/ 보건시스템 활용') }, editable: false },
    { fieldName: 'TOTAL', dataType: 'number', numberFormat: "#,###.##", width: '100', styleName: 'right-column', header: { text: t('합계') }, editable: false },
    { fieldName: 'EVAL_RESULTS', dataType: 'text', width: '100', header: { text: t('평가결과') }, editable: false },
    { fieldName: 'RWD_HIST', dataType: 'text', width: '200', styleName: 'left-column editable_column', header: { text: t('포상이력') }, editable: true },
    { fieldName: 'REMARK', dataType: 'text', width: '200', styleName: 'left-column editable_column', header: { text: t('비고') }, editable: true },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'COMP_CD', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible: false },
    { fieldName: 'PART_CD', dataType: 'text' , visible: false },
    { fieldName: 'REG_DATE', dataType: 'text' , visible: false },
    { fieldName: 'SLF_EVAL_STUS', dataType: 'text' , visible: false },
    { fieldName: 'STATUS', dataType: 'text' , visible: false },
    { fieldName: 'SENDMAIL_YN', dataType: 'text' , visible: false },
    { fieldName: 'CONFIRM_YN', dataType: 'text' , visible: false },
    { fieldName: 'COMP_SAFETY_SEQ', dataType: 'text' , visible: false },
    { fieldName: 'COMP_SAFETY_DETAIL_SEQ', dataType: 'text' , visible: false },
    { fieldName: 'PRNT_CD', dataType: 'text' , visible: false },

  ],
  columns : [],
  columnLayout: [
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
    'REMARK',
  ],
})

// 그리드 세팅
grdMainProps.columns = grdMainProps.fields

const codeList = reactive({
  year : [], // 년도
  mnth : [], // 월
  compSafetySeq : [{ TXT: '선택', COD: '' }], // 버전
  quarter : [{ TXT: '1분기', COD: '1' },{ TXT: '2분기', COD: '2' }, { TXT: '3분기', COD: '3' }, { TXT: '4분기', COD: '4' } ], // 분기
})

const saveCodeList = reactive({
  quarter : [{ TXT: '1분기', COD: '1' },{ TXT: '2분기', COD: '2' }, { TXT: '3분기', COD: '3' }, { TXT: '4분기', COD: '4' } ], // 분기
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'EDUDA0020_SEARCH_10', param : { CMPNY_DIV: userStore.cmpnyDiv} }), // 년도
    commonSearchApi({ queryId : 'EDUDA0020_SEARCH_11', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : dayjs(new Date).format('YYYY')} }), // 분기
    commonSearchApi({ queryId : 'EDUDA0020_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : dayjs(new Date).format('YYYY'), QUARTER : searchParams.QUARTER} }), // 버전
  ]).then(res => {
    //console.log("레스 확인",res)
    //searchSaveParams.CLSS_CD = codeList.clssCd[0].COD
    // 분기 세팅
    let currentMonth = dayjs(new Date()).format('MM')
    if (currentMonth >= 1 && currentMonth <= 3) {
        searchParams.QUARTER = '1'
        searchSaveParams.QUARTER = '1'
    } else if (currentMonth >= 4 && currentMonth <= 6) {
        searchParams.QUARTER = '2'
        searchSaveParams.QUARTER = '2'
    } else if (currentMonth >= 7 && currentMonth <= 9) {
        searchParams.QUARTER = '3'
        searchSaveParams.QUARTER = '3'
    } else {
        searchParams.QUARTER = '4'
        searchSaveParams.QUARTER = '4'
    }

    

    // 년도
    if(res[0].ORESULT_CUR.length!=0){
      codeList.year = res[0].ORESULT_CUR
      findIndex = res[0].ORESULT_CUR.findIndex(item => item.COD == searchParams.YEAR)
      if(findIndex < 0){
          findIndex = 0
      }
      searchParams.YEAR = codeList.year[findIndex].COD
    }

    // 분기
    if(res[1].ORESULT_CUR.length!=0){
      codeList.quarter = res[1].ORESULT_CUR
      findIndex = res[1].ORESULT_CUR.findIndex(item => item.COD == searchParams.QUARTER)
      if(findIndex < 0){
          findIndex = 0
      }
      searchParams.QUARTER = codeList.quarter[findIndex].COD
    }
   
    // 버전
    if(res[2].ORESULT_CUR.length!=0){
      codeList.compSafetySeq = res[2].ORESULT_CUR
      searchParams.COMP_SAFETY_SEQ = codeList.compSafetySeq[0].COD
    }
  }).finally(() => {

  })
}

// 년도 바뀌면 분기 데이터 및 버전 데이터 변경
watch(() => searchParams.YEAR, async (newValue, oldValue) => {
  //searchParams.QUARTER = ''
  // console.log('searchParams.YEAR newValue : ', newValue)
  // console.log('searchParams.YEAR oldValue : ', oldValue)
  if(newValue !== oldValue){
    // 월 데이터 바인딩
    await commonSearchApi({ queryId : 'EDUDA0020_SEARCH_11', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : newValue } }) // 분기 가져 오기
      .then(res => {
        //console.log('searchParams.QUARTER : ', res)
        if(res.ORESULT_CUR.length!=0){
          codeList.quarter = res.ORESULT_CUR
          searchParams.QUARTER = res.ORESULT_CUR[0].COD
        }
      }).finally(() => {
        //gridRefresh()
      })
  }
})

// 분기 데이터 바뀌면 버전 데이터 변경
watch( () => searchParams.QUARTER, async (newValue,oldValue) => {
  // console.log('searchParams.MNTH newValue : ', newValue)
  // console.log('searchParams.MNTH oldValue : ', oldValue)
  if(newValue !== oldValue){
    searchParams.COMP_SAFETY_SEQ = ''
    // 버전 데이터 바인딩
    await commonSearchApi({ queryId : 'EDUDA0020_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchParams.YEAR, QUARTER : newValue } }) // 버전
      .then(res => {
        //console.log('searchParams.COMP_SAFETY_SEQ res  : ', res.ORESULT_CUR)
        if(res.ORESULT_CUR.length!=0){
          //console.log('버전  : ', res.ORESULT_CUR)
          codeList.compSafetySeq = res.ORESULT_CUR
          //console.log('codeList.compSafetySeq  : ', codeList.compSafetySeq)
          searchParams.COMP_SAFETY_SEQ = res.ORESULT_CUR[0].COD
        }
      }).finally(() => {
        //gridRefresh()
      })
  }
})

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/

//버튼 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){ //조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}
const onButtonsSubClick = btn => {
  if(btn.id === 'btnTargetSearch'){ //대상 검색
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData2)
      .setAfter(afterSearch2)
      .run()
  }else if(btn.id === 'btnNewSave'){ //신규저장
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(saveCheck)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  }else if(btn.id === 'btnUpdate'){ //저장
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(saveCheck2)
      .setQuery(saveData2)
      //.setAfter(afterSaveData2)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if(btn.id === 'btnReset'){ //초기화
    gridRefresh('grdMain')
    searchYn.value = false
    controllerSetting()
  }
}

// //그리드 초기화 이벤트
const gridRefresh = val => {
  if(val === 'grdMain'){
    grdMain.value.getDataProvider().setRows([])
  }
}

//널값체크후 숫자 리턴
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? 0 : Number(val)
}

// 검색여부에 따라서 버튼 활성화 및 비활성화
// 조회를 했으면 기간/과팀/대상자검색/신규저장 비활성화
/* ******************* true: 비활성화 , false: 활성화 ******************** */
const controllerSetting = () => {
  if(searchYn.value){
    //console.log('조회버튼 클릭')
    // 조회버튼을 클릭했을때
    //menuTitle.value.disableBtn('btnUpdate', false)
    onButtonsSub.value.disableBtn('btnTargetSearch', true)
    onButtonsSub.value.disableBtn('btnNewSave', true)
    onButtonsSub.value.disableBtn('btnUpdate', false)
    onButtonsSub.value.disableBtn('btnReset', false)
    noYear.value = true
    noQuarter.value = true
  }else{
    //console.log('조회버튼 안클릭')
    // 조회버튼을 클릭 안했을때
    onButtonsSub.value.disableBtn('btnTargetSearch', false)
    onButtonsSub.value.disableBtn('btnNewSave', false)
    onButtonsSub.value.disableBtn('btnUpdate', true)
    onButtonsSub.value.disableBtn('btnReset', true)
    noYear.value = false
    noQuarter.value = false
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

// 협력사 안전평가 조회
const searchData = idx => {
  gridRefresh('grdMain')
  //console.log('searchParams : ',searchParams)
  return commonSearchApi({ queryId : 'EDUDA0020_SEARCH_02', param: searchParams })
}

//협력사 안전평가 대상 조회
const searchData2 = idx => {
  gridRefresh('grdMain')
  //console.log('saveParams : ',saveParams)
  return commonSearchApi({ queryId : 'EDUDA0020_SEARCH_01', param: searchSaveParams })
}

// 협력사 안전평가 검색후
const afterSearch = res => {
  // console.log('res.ORESULT_CUR : ',res.ORESULT_CUR)
  // console.log('res.ORESULT_CUR2 : ',res.ORESULT_CUR2)
  if(res.ORESULT_CUR.length!=0){
    searchYn.value = true
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    controllerSetting()
    // 조회조건으로 기준년도 분기 세팅
    searchSaveParams.YEAR = searchParams.YEAR
    searchSaveParams.QUARTER = searchParams.QUARTER
  }
}

// 협력사 안전평가 검색후 대상검색후
const afterSearch2 = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/
// 협력사 안전평가 신규저장 저장 전 유효성 검사
const saveCheck = () => {
  // 대상자가 검색이 안되었을때는 동작하면 안됨
  if(grdMain.value.getGridView().getItemCount() <= 0){
    Message.warn(t('대상 검색부터 하셔야 합니다.'))
    return false  
  }
  return true
}

// 협력사 안전평가 저장 전 유효성 검사
const saveCheck2 = () => {
  let result = true
  saveParams.value = []
  // 상태바가 체크된 항목
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    result = false
  } else {
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.UPDATE_USER_ID = userStore.userId
      //console.log('data:',data)
      saveParams.value.push(data)
    })
  }
  return result
}

// 협력사 안전평가 신규저장 저장
const saveData = ()=> {
  saveParams.value = []
  saveParams.value = searchSaveParams
  saveParams.value.COMP_SAFETY_SEQ = 0
  saveParams.value.INSERT_USER_ID = userStore.userId //등록자
  //console.log("여기 오냐??? 저장 파라메트", saveParams2.value)
  //return
  return commonExecuteApi({ queryId : 'EDUDA0020_SAVE_01', list: [saveParams.value] })
}

// 협력사 안전평가 저장
const saveData2 = ()=> {
  saveParams.value.UPDATE_USER_ID = userStore.userId //등록자
  //console.log("여기 오냐??? 저장 파라메트", saveParams.value)
  //return
  return commonExecuteApi({ queryId : 'EDUDA0020_SAVE_02', list: saveParams.value })
}

// 협력사 안전평가 신규저장 저장 이후
const afterSaveData = res => {
  saveParams.value = []
  if(res.list[0].length!=0){
    let grdMainData = ref([]) // 그리드 데이터
    grdMainData = grdMain.value.getDataProvider().getJsonRows()
    grdMainData.forEach(val => {
      val.COMP_SAFETY_SEQ = res.list[0].OUT_COMP_SAFETY_SEQ
      val.COMP_SAFETY_DETAIL_SEQ = 0
      val.INSERT_USER_ID = userStore.userId //등록자
      saveParams.value.push(val)
    })
    commonExecuteApi({ queryId : 'EDUDA0020_SAVE_02', list: saveParams.value }).then(async res => {
      // 년도가 다를때 새로 년도 세팅
      //console.log('searchParams.YEAR : ' ,searchParams.YEAR)
      //console.log('searchSaveParams.YEAR : ' ,searchSaveParams.YEAR)
      if(searchParams.YEAR !== searchSaveParams.YEAR){
        // 년도 바인딩
        await commonSearchApi({ queryId : 'EDUDA0020_SEARCH_10', param : { CMPNY_DIV: userStore.cmpnyDiv } })
          .then(res => {
            if(res.ORESULT_CUR.length!=0){
              //console.log('저장후 년도 검색' ,res.ORESULT_CUR)
              codeList.year = res.ORESULT_CUR
              findIndex = res.ORESULT_CUR.findIndex(item => item.COD == searchSaveParams.YEAR)
              //console.log('findIndex : ' ,findIndex)
              if(findIndex < 0){
                  findIndex = 0
              }
              searchParams.YEAR = codeList.year[findIndex].COD
            }
          })
      }else{
        searchParams.YEAR = searchSaveParams.YEAR
      }
      searchParams.QUARTER = searchSaveParams.QUARTER
      // 버전
      await commonSearchApi({ queryId : 'EDUDA0020_SEARCH_12', param : { CMPNY_DIV: userStore.cmpnyDiv, YEAR : searchParams.YEAR, QUARTER : searchParams.QUARTER } }) // 버전
        .then(res => {
          if(res.ORESULT_CUR.length!=0){
            codeList.compSafetySeq = res.ORESULT_CUR
            searchParams.COMP_SAFETY_SEQ = res.ORESULT_CUR[0].COD
          }
          onButtonsClick({ id:'btnSearch' })
        })
    }).catch( res =>{
      // 에러 발생시 기존 마스터 테이블 데이터 삭제
      commonExecuteApi({ queryId : 'EDUDA0020_DELETE_01', list: [saveParams.value[0]]})
    })
  }
}

//*****************************************저장 영역(종료)***********************************************************/

//********************************************삭제 영역*************************************************************//

//********************************************삭제 영역(종료)**********************************************************//
onMounted(() => {
  initCodeList()
  controllerSetting()
  //onButtonsClick({ id:'btnSearch' })
  // grdMainSearch()
  // onButtonsClick()

  // // 행 병합 그룹핑(mergeMode)을 사용하면 groupPanel.visible 사용할 필요가 없으며, 대신 groupBy 세팅된 순서대로 컬럼이 이동됨
  // //grdTab03Main.value.getGridView().groupPanel.visible = false //그룹패널 안보이게하기
  // grdMain.value.getGridView().groupBy(["BSNS_NM","PART_NM","PRNT_NM"]) //BSNS_COMP_NM 기준으로 그룹핑
  // grdMain.value.getGridView().setRowGroup
  // ({ 
  //   expandedAdornments: "footer"  //그룹을 펼쳤을때 FOOTER만 보이기
  //   //, collapsedAdornments: "footer" //그룹을 접었을때 FOOTER만 보이기
  //   , mergeExpanderVisibility: "none" //그룹 접기 여부 화면에 안보이게하기
  //   , mergeMode: true // 행 병합 그룹핑 활성화
  //   //, indentVisible: false // 행 병합 그룹핑 비활성화일대 사용하면 그룹핑 바 표시 안함.
  // })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('년도')"
            labelWidth="30px"
            width="160px"
            v-model="searchParams.YEAR"
            :items="codeList.year"
            item-value="COD"
            item-title="TXT"
            @update:model-value="gridRefresh('grdMain')"
          />
          <i-select
            :label="$t('분기')"
            labelWidth="30px"
            width="150px"
            v-model="searchParams.QUARTER"
            :items="codeList.quarter"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh('grdMain')"
          />
          <i-select
            :label="$t('버전')"
            labelWidth="30px"
            width="350px"
            v-model="searchParams.COMP_SAFETY_SEQ"
            :items="codeList.compSafetySeq"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh('grdMain')"
          />
        </v-sheet>
        <!-- 메인그리드 -->
        <v-sheet class="h-auto">
          <v-sheet class="d-flex justify-end mB-5">
            <i-select
              :label="$t('기준년도')"
              labelWidth="60px"
              width="190px"
              v-model="searchSaveParams.YEAR"
              type="YEAR"
              @update:model-value="gridRefresh('grdMain')"
              :disabled="noYear"
            />
            <i-select
              :label="$t('분기')"
              labelWidth="30px"
              width="150px"
              v-model="searchSaveParams.QUARTER"
              :items="saveCodeList.quarter"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdMain')"
              :disabled="noQuarter"
            />
            <IButtonList
              :button-list="['btnTargetSearch', 'btnNewSave', 'btnUpdate', 'btnReset']"
              @click-button="onButtonsSubClick"
              ref="onButtonsSub"
            />
          </v-sheet>

            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          <!-- </div> -->
        </v-sheet>
        
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 300px;
  }
}
</style>
