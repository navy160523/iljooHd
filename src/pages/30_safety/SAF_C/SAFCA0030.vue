<!-- 2024.06.21(시작일) 계층별 안전점검 모니터링 -->
<!-- 개발 : 김홍규 -->

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

// 쿼리 작동
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'


defineOptions({
  name: '30_safety-SAF_C-SAFCA0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)



/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,                                    // 부서 코드
  DATE_FROM: dayjs().startOf('month').format("YYYY-MM-DD"),
  DATE_TO: dayjs(new Date()).format("YYYY-MM-DD"),
  TEMP_FROM: dayjs().startOf('month').format("YYYY-MM-DD"),
  TEMP_TO: dayjs(new Date()).format("YYYY-MM-DD"),
  MANAGE_DIV: '',                                               // 관리감독자 / 생산매니저 / 임원 선택 
  WORKDAYS: ' 0 일',
  PROD_DIV: '',                                                 // 생산/비생산
  OFFI_RES_DIV: [],                                             // 관리감독자 구분
  OFFI_RES_TEXT: '',
})

/* 코드 리스트 */
const codeList = reactive({
  BSNS_CD: [], // 사업부 목록
  DEPT_CD: [], // 부서 목록
  MANAGE_DIV: [
    {COD: '', TXT: '전체'},
    {COD: 'A', TXT: '임원'},
    {COD: 'B', TXT: '관리감독자'},
    {COD: 'C', TXT: '생산매니저'},
  ], // 계층 구분

  PROD_DIVList: [
    {COD: '' , TXT: '전체'},
    {COD: 'P' , TXT: '생산'},
    {COD: 'N' , TXT: '비생산'},
    {COD: 'S' , TXT: '지원'},
  ], // 생산/비생산

  // 관리감독자 코드
  OFFI_RES_DIV: [],
})


// 초기 조회 코드 생성
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ 
      commonSearchApi(
      { queryId : 'searchBSNS',
        param:{
          CMPNY_DIV: userStore.cmpnyDiv,
          USE_DIV: 'Y', 
        }
      }),
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: userStore.bsnsCd, USE_ONLY: 'N'},
      }), // 부서
      commonSearchApi({ queryId : 'SAFCA0030_SEARCH_00', param: { } }),
      ]).then(res => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.OFFI_RES_DIV = res[2].ORESULT_CUR
    
    for(let i = 0; i < res[2].ORESULT_CUR.length; i++){
      searchParams.OFFI_RES_DIV.push(res[2].ORESULT_CUR[i])
    }
    
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD: '' })
    
  })
}


//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }, footer: { visible:true }  },
  keys : [],
  fields : [ 
    { fieldName: 'ASGN_NM', width: '350',dataType: 'text', header: { text: t('소속') }, styleName:'left-column' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') } },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') } },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') } },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }
    ,footer: {
        styleName: 'footer-font',
        text: '합계',
        exportStyleName: 'export_style',
      }  
    },
    { fieldName: 'USER_WORK_DAYS', dataType: 'number', numberFormat: "#,##0", header: { text: t('기준일수') }
    ,footer: { numberFormat: '#,###', expression: 'sum' },},
    { fieldName: 'REG_CNT', dataType: 'number', numberFormat: "#,##0", header: { text: t('등록일수') }
    ,footer: { numberFormat: '#,###', expression: 'sum' }},
    { fieldName: 'NON_REG_CNT', dataType: 'text', header: { text: t('미등록일수') } },
    { fieldName: 'REG_RATIO', dataType: 'text', header: { text: t('등록율(%)') } },
    { fieldName: 'TOTAL_CNT', dataType: 'number', numberFormat: "#,##0", header: { text: t('점검건수') }
    ,footer: { numberFormat: '#,###', expression: 'sum' } },
    { fieldName: 'SAFE_CNT', dataType: 'text', header: { text: t('완료') } },
    { fieldName: 'RISK_CNT', dataType: 'text', header: { text: t('필요') } },

    
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', visible: false },
    { fieldName: 'REG_DTL_CNT', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
     'ASGN_NM',
     'JOB_TIT_NM', 
     'OFFI_RES_NM', 
     'EMP_NO', 
     'KOR_NM',
     {
      name: '안전점검 결과',
      direction: 'horizontal',
      items: [
        'USER_WORK_DAYS',
        'REG_CNT',                          
        'NON_REG_CNT',                          
      ],
      header: {
        text: t('안전점검 결과'),
      },
    },
    'REG_RATIO',
    'TOTAL_CNT',
    {
      name: '점검 결과',
      direction: 'horizontal',
      items: [
        'SAFE_CNT',
        'RISK_CNT',                          
      ],
      header: {
        text: t('점검 결과'),
      },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()

  onButtonsClick({id: 'btnSearch'})
})

//메뉴버튼
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}


// 조회로직
const searchData = async () => {
  return commonSearchApi({ queryId : 'SAFCA0030_SEARCH_01', param: searchParams })
}

const afterSearch = async res => {
  console.log('search res',res.ORESULT_CUR2)
  searchParams.WORKDAYS = res.ORESULT_CUR[0].WORKDAYS + ' 일'

  let result = ''
  if (searchParams.MANAGE_DIV === 'B' && searchParams.OFFI_RES_DIV.length > 1) {
    result = res.ORESULT_CUR2.filter((item) => searchParams.OFFI_RES_DIV.filter((item2) => item2.OFFI_RES_DIV === item.OFFI_RES_NM))
    await grdMain.value.getDataProvider().setRows(result)
  }else{
    await grdMain.value.getDataProvider().setRows(res.ORESULT_CUR2)
  }
}

//사업부가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  // console.log("부서 데이터",newValue)
  if(newValue===null||newValue===''){
    codeList.DEPT_CD = []
    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    searchParams.DEPT_CD = codeList.BSNS_CD[0].COD
    return
  }
  searchParams.DEPT_CD = ''
  commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, USE_ONLY: 'N' },
      }).then(res => {
        // console.log('dept_cd lsit',res)
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    })
})

// watch(() => searchParams.MANAGE_DIV, (newValue, oldValue) => {
//   debugger
//   if (newValue === 'B'){

//   }
// })

//기간 시작(FR)이 TO보다 높을 경우 경고
const dateFrChanged = data => {
  
  if(data.target.value > searchParams.DATE_TO){

    Message.warn(t('시작일이 종료일 보다 클 수 없습니다.'))
    searchParams.DATE_FROM = searchParams.TEMP_FROM // 기간 시작
  }else{
    searchParams.TEMP_FROM = searchParams.DATE_FROM
  }
}

//기간 끝(TO)이 FR보다 낮을 경우 경고
const dateToChanged = data => {
  if(data.target.value < searchParams.DATE_FROM){
    Message.warn(t('종료일이 시작일 보다 작을 수 없습니다.'))
    searchParams.DATE_TO = searchParams.TEMP_TO
  }else{
    searchParams.TEMP_TO = searchParams.DATE_TO
  }
}

</script>


<template>

<v-card class="pa-1 fill-height">
  <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
  </v-card-title>
  <v-card-text class="pa-2 pt-0 content-area">
    <div class="d-flex flex-column fill-height">
      <v-sheet height="100%" style="display: flex; flex-direction: row;">
        <v-sheet width="100%" style="padding-right: 5px;">

          <v-sheet class="searchArea">
            <div class="d-flex">
              <i-input
                  v-model="searchParams.DATE_FROM"
                  type="date"
                  :label="$t('기간')"
                  width="180px"
                  labelWidth="30px"
                  @change="dateFrChanged"
                />
                <i-input
                  v-model="searchParams.DATE_TO"
                  width="170px"
                  labelWidth="20px"
                  :label="$t('~')"
                  type="date"
                  @change="dateToChanged"
                />
              <i-select
                :label="$t('사업부')"
                label-width="40px"
                width="220px"
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
              />
              <i-select
                :label="$t('부서')"
                label-width="40px"
                width="250px"
                v-model="searchParams.DEPT_CD"
                :items="codeList.DEPT_CD"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
              />
              <i-select
                :label="$t('계층구분')"
                label-width="60px"
                width="200px"
                v-model="searchParams.MANAGE_DIV"
                :items="codeList.MANAGE_DIV"
                item-value="COD"
                item-title="TXT"
              />
              <i-input
                  v-model="searchParams.WORKDAYS"
                  width="120px"
                  labelWidth="50px"
                  :label="$t('근무일수')"
                  type="text"
                  readonly
                />
                <i-select 
                  :label="$t('생산/비생산')"
                  labelWidth="80px"
                  width="200px"
                  :items="codeList.PROD_DIVList"
                  item-title="TXT"
                  item-value="COD"
                  v-model="searchParams.PROD_DIV"
                />
            </div>
            <v-sheet :style="{ display: searchParams.MANAGE_DIV === 'B' ? 'contents' : 'none' }">
              <div class="d-flex mt-2" style="display: block;">
                <i-select
                  :label="$t('관리감독자')" 
                  multiple
                  v-model="searchParams.OFFI_RES_DIV"
                  :items="codeList.OFFI_RES_DIV"
                  item-title="OFFI_RES_NM"
                  item-value="OFFI_RES_NM"
                  width="750px"
                />
              </div>
            </v-sheet>
            
          </v-sheet>

              ※ 생산매니저 추가/삭제 문의 :  조선(김은지 T.3-0601)  해양(서은혜 T.2-2587)  특수선(최경호 T.2-1503)  엔진(김유정 T.2-7124)

              <RealGrid
                ref="grdMain"
                class="mt-2"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
              />
          </v-sheet>
      </v-sheet>
    </div>
  </v-card-text>
</v-card> 
</template>
    

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 200px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 600px;
  }
}

</style>