<!-- 
  화면명 : 부서/직무 특수검진 유행인자 현황
  화면개요 : 특수검진 유해인자 TAB03
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const isAdmin = ref(false)

const menuTitle = ref(null)
const grdMain = ref(null)
const grdData = ref([])

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: 'HI',
  YEAR: String(dayjs().get('year')),
  JOB_GRP_ID: []
})

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [],
  JOB_GRP_NM: []
})

const gubunCodeList = reactive({
  GUBUN: [
    {COD: 'A', TXT: '작업환경측정 예비조사'},
    {COD: 'B', TXT: '작업환경측정 결과'},
    {COD: 'C', TXT: '부서 규제물질'},
    {COD: 'D', TXT: '기타'},
  ]
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // 화학물질관리자 : HLTD001, 보건총괄: GRP00372, HSE추진자: GRP00392
  // if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTD001') || 
  //   userStore.authGrpCd.includes('GRP00372') || userStore.authGrpCd.includes('GRP00392')) isAdmin.value = true 

  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }
  Promise.all([
    // 상하반기
    getCodeList('HHII800'),
    // 콤보박스 조회
    commonSearchApi({ queryId: 'HLTGA0050_SEARCH_COMBO', param: { CMPNY_DIV: searchParams.CMPNY_DIV } }),
  ]).then((res) => {
    codeList.HALF_DIV = res[0].ORESULT_CUR
    codeList.JOB_GRP_NM = res[1].ORESULT_CUR
    codeList.JOB_GRP_NM.unshift({ COD: '0', TXT: '전체'})
    searchParams.JOB_GRP_ID = ['0']
  })
  // onButtonsClick({ id: 'btnSearch' })
  
  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.setBindingColumn('GUBUN', gubunCodeList.GUBUN, 'COD', 'TXT')
})

// 부서/직무 특수검진 유해인자 현황 그리드 설정
const mainGridProps = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }},
  keys : [],
  fields : [ 

    { fieldName: 'DEPT_NM', width: '20', dataType: 'text', styleName:'left-column', editable: false, header: { text: t('부서') }, mergeRule: { criteria: 'value + values["DUTY_NM"]+ values["JOB_GRP_NM"]' }  },
    { fieldName: 'JOB_GRP_NM', width: '20', dataType: 'text', styleName:'left-column', editable: false, header: { text: t('직계') }, mergeRule: { criteria: 'value + values["DEPT_NM"] + values["DUTY_NM"]' }  },
    { fieldName: 'DUTY_NM', width: '80', dataType: 'text', styleName:'left-column', editable: false, header: { text: t('직무')}, mergeRule: { criteria: 'value + values["DEPT_NM"] + values["JOB_GRP_NM"]' }  },
    { fieldName: 'CNT', width: '10', dataType: 'text', styleName:'right-column', editable: false, header: { text: t('인원') }, mergeRule: { criteria: 'value + values["DEPT_NM"] + values["JOB_GRP_NM"]+ values["DUTY_NM"]' } },
    { fieldName: 'GUBUN', width: '40', dataType: 'text', styleName: 'left-column', header: { text: t('유해인자 구분')}, lookupDisplay: true , mergeRule: { criteria: 'value + values["DEPT_NM"] + values["JOB_GRP_NM"]+ values["DUTY_NM"]' }},
    { fieldName: 'FROM_DEPT_NM', width: '40', dataType: 'text', styleName: 'left-column', header: { text: t('유해인자 부서') } },
    { fieldName: 'PRC_MAT_NM', width: '40', dataType: 'text', styleName: 'left-column', header: { text: t('유해인자 취급공정') } },
    { fieldName: 'CASNM_KOR', width: '100', dataType: 'text', styleName: 'left-column multiline-editor', header: { text: t('특검 유해인자') }, },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') },visible: false, },
    { fieldName: 'JOB_GRP_ID', dataType: 'text', header: { text: t('직계코드') },visible: false, },
    { fieldName: 'DUTY_CD', dataType: 'text', header: { text: t('직무코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})
mainGridProps.columns = mainGridProps.fields


// 버튼 이벤트
const onButtonsClick = btn => {

  // 조회
  if (btn.id === 'btnSearch') {
    getData()
  }
}

// 데이터 불러오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTGA0050_SEARCH_08', param: searchParams })
} 

// 조회 후 실행
const afterSearch = (res) => {
  // 중복 제거
  for(let i = 0; i < res.ORESULT_CUR.length; i++) {
    let korNm = res.ORESULT_CUR[i].CASNM_KOR
    // null 이면 다음으로
    if(isEmpty(korNm)) {
      continue
    }
    const uniqueItems = [...new Set(
      korNm.split(',').map(item => item.trim())
    )]
    res.ORESULT_CUR[i].CASNM_KOR = uniqueItems.join(', ')
  }

  grdData.value = res.ORESULT_CUR
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


watch(() => [searchParams.YEAR, searchParams.HALF_DIV], (newValue, oldValue) => {
  onButtonsClick({id: 'btnSearch'})
})


watch(() => searchParams.JOB_GRP_ID, (newValue, oldValue) => {
  let selectCode = newValue.find(item => !oldValue.includes(item))
  if(selectCode == '0') {
    searchParams.JOB_GRP_ID = ['0']
    grdMain.value.getDataProvider().setRows([])
    grdMain.value.getDataProvider().setRows(grdData.value)
    return 
  } else if (!isEmpty(selectCode)) {
    searchParams.JOB_GRP_ID = newValue.filter(item => item != '0')
  } else if (newValue.length == 1 && newValue[0] == '0') {
    grdMain.value.getDataProvider().setRows([])
    grdMain.value.getDataProvider().setRows(grdData.value)
    return
  }

  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(gridData(grdData.value))
})

const gridData = (data) => {
  return data.filter(item => searchParams.JOB_GRP_ID.includes(item.JOB_GRP_ID))
}


</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('해당년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.HALF_DIV"
            :label="$t('반기구분')"
            label-width="50px"
            :items="codeList.HALF_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.JOB_GRP_ID"
            :label="$t('직계')"
            label-width="50px"
            :items="codeList.JOB_GRP_NM"
            item-value="COD"
            item-title="TXT" 
            width="500px"
            multiple
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="h-auto ml-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="mainGridProps.gridViewOption"
              :keys="mainGridProps.keys" 
              :fields="mainGridProps.fields"
              :columns="mainGridProps.columns"
            />
          </v-sheet>
        </div>
      </div>
      <!-- 팝업존 -->
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 110px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

.v-tab {
  width: 180px;
}
</style>