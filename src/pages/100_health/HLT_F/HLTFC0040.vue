<!-- 
  화면명 : 작업환경측정 초과현황
  화면개요 : 작업환경측정 초과현황 조회
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'

defineOptions({
  name:'100_health-HLT_F-HLTFC0040', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR_FR: String(dayjs().add(-4, 'year').get('year')),
  YEAR_TO: String(dayjs().get('year')),
  REG_DIV: 'A',
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  ORGN_DIV: ''
})

const gridLayout = ref([
    'DEPT_NM',
    {
      name: t('초과 건수'),
      direction: 'horizontal',
      items: [
        {
          name: searchParams.YEAR_FR + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_1', 'LO_CNT_1' ],
          header: { text: searchParams.YEAR_FR },
        },
        {
          name: Number(searchParams.YEAR_FR)+1 + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_2', 'LO_CNT_2' ],
          header: { text: Number(searchParams.YEAR_FR)+1 },
        },
        {
          name: Number(searchParams.YEAR_FR)+2 + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_3', 'LO_CNT_3' ],
          header: { text: Number(searchParams.YEAR_FR)+2 },
        },
        {
          name: Number(searchParams.YEAR_FR)+3 + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_4', 'LO_CNT_4' ],
          header: { text: Number(searchParams.YEAR_FR)+3 },
        },
        {
          name: Number(searchParams.YEAR_FR)+4 + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_5', 'LO_CNT_5' ],
          header: { text: Number(searchParams.YEAR_FR)+4 },
        },
      ],
      header: { text: t('초과 건수') },
    }
    
])


const codeList = reactive({
  YEAR:[],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  DEPT_CD: [],
  ORGN_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '협력사' },
  ],
})

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
  if(useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes('HLTF001') || 
    userStore.authGrpCd.includes('HIWAYGRP00001') ||
    userStore.authGrpCd.includes('GRP00372')) {
      isAdmin.value = true
  }

  onButtonsClick({ id: 'btnSearch' })

  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }
  grdMain.value.getGridView().filterPanel.visible = true

  Promise.all([
    // 부서
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_DEPT', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR
  })
})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false },},
  keys : ['DEPT_NM', 'ASGN_NM'], 
  fields : [ 
    { fieldName: 'DEPT_NM', width: '100', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('부서') } },
    { fieldName: 'ASGN_NM', width: '100', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('협력사') } },
    { fieldName: 'HI_CNT_1', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('상반기') }},
    { fieldName: 'LO_CNT_1', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('하반기') } },
    { fieldName: 'HI_CNT_2', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('상반기') } },
    { fieldName: 'LO_CNT_2', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('하반기') } },
    { fieldName: 'HI_CNT_3', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('상반기') } },
    { fieldName: 'LO_CNT_3', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('하반기') } },
    { fieldName: 'HI_CNT_4', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('상반기') } },
    { fieldName: 'LO_CNT_4', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('하반기') } },
    { fieldName: 'HI_CNT_5', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('상반기') } },
    { fieldName: 'LO_CNT_5', width: '60', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('하반기') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   return Message.warn(t('관리자만 사용가능합니다.'))
  // }

  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnPrint') {    
    // 엑셀 다운로드
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: searchParams.YEAR_FR+ '_' + searchParams.YEAR_TO
        + (searchParams.REG_DIV === 'A' ? ' 정기' : ' 수시')
        + searchParams.DEPT_NM == '' ? '' : searchParams.DEPT_NM
        + ' 작업측정 초과 현황'
        + '.xlsx', // 저장될 파일 name
      documentTitle: { //제목
        message:  searchParams.YEAR_FR+ '_' + searchParams.YEAR_TO
        + (searchParams.REG_DIV === 'A' ? ' 정기' : ' 수시')
        + searchParams.DEPT_NM == '' ? '' : ' ' + searchParams.DEPT_NM
        + ' 작업측정 초과 현황',
        visible: true, 
        spaceTop: 1,
        spaceBottom: 0,
        height: 80,
        styleName: 'excelTitle',
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: false, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    }) 
  }
}

const setGridLayout = () => {
  gridLayout.value = [
    'DEPT_NM',
    'ASGN_NM',
    {
      name: t('초과 건수'),
      direction: 'horizontal',
      items: [
        {
          name: searchParams.YEAR_FR + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_1', 'LO_CNT_1' ],
          header: { text: searchParams.YEAR_FR + '' },
        },
        {
          name: Number(searchParams.YEAR_FR)+1 + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_2', 'LO_CNT_2' ],
          header: { text: Number(searchParams.YEAR_FR)+1 + '' },
        },
        {
          name: Number(searchParams.YEAR_FR)+2 + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_3', 'LO_CNT_3' ],
          header: { text: Number(searchParams.YEAR_FR)+2 + '' },
        },
        {
          name: Number(searchParams.YEAR_FR)+3 + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_4', 'LO_CNT_4' ],
          header: { text: Number(searchParams.YEAR_FR)+3 + '' },
        },
        {
          name: Number(searchParams.YEAR_FR)+4 + '',
          direction: 'horizontal',
          items: [ 'HI_CNT_5', 'LO_CNT_5' ],
          header: { text: Number(searchParams.YEAR_FR)+4 + '' },
        },
      ],
      header: { text: t('초과 건수') },
    }
  ]
  grdMain.value.getGridView().setColumnLayout(gridLayout.value)
}

// 그리드 데이터 조회
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
  return commonSearchApi({ queryId: 'HLTFC0040_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  setGridLayout()
}

//팝업 선택 이벤트
const onDeptSelected = val => {
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
  onButtonsClick({ id: 'btnSearch'})
}

const openDeptcdPopup = () => {
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.DEPT_NM })
}

const clearDeptcd = () => {
  searchParams.DEPT_CD = ''
  searchParams.DEPT_NM = ''
  onButtonsClick({ id: 'btnSearch'})
}

watch(() => searchParams.YEAR_FR, (newValue, oldValue) => {
  searchParams.YEAR_TO = Number(newValue) + 4
  getData()
})

watch(() => searchParams.REG_DIV, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.ORGN_DIV, (newValue, oldValue) => {
  getData()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.YEAR_FR"
            :label="$t('년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.YEAR_TO"
            :label="$t('~')"
            label-width="10px"
            :readonly="true"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="160px"
          />
          <i-select
            v-model="searchParams.REG_DIV"
            :label="$t('구분')"
            label-width="50px"
            :items="codeList.REG_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-input
            v-model="searchParams.DEPT_CD"
            label-width="50px"
            :label="$t('부서')"
            width="180px"
            :readonly="true"
          />
          <i-input
              v-model="searchParams.DEPT_NM"
              width="150px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptcdPopup"
              @keydown.enter="openDeptcdPopup"
            >
              <template #append-inner>
                <v-icon
                  icon="mdi-window-close"
                  @click="clearDeptcd"
                />
              </template>
          </i-input>
          <i-select
            class="ml-4"
            v-model="searchParams.ORGN_DIV"
            :label="$t('조직구분')"
            label-width="50px"
            :items="codeList.ORGN_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          /> 
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="gridLayout" 
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
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
    min-height: 400px;
  }
}

.echarts_style {
  height: 325px;
  width: 100%;
}
</style>