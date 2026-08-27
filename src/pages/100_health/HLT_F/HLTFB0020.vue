<!-- 
  화면명 : 작업환경측정 화학물질 세부 현황
  화면개요 : 화학물질 세부 현황
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'

defineOptions({
  name:'100_health-HLT_F-HLTFB0020', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const deptPopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: Number(dayjs().get('month')) > 6 ? 'LO' : 'HI', 
  YEAR: String(dayjs().get('year')),
  REG_DIV: 'A',
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  ORGN_DIV: '',
})

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  DEPT_CD: [],
  PROCESS_CD: [],
  ORGN_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '협력사' },
  ],
})

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
  // 0: 일반 사용자, 1: 부서보건담당자, 2. 보건관리팀담당자
  if(useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes('HLTF001') || 
    userStore.authGrpCd.includes('HLTF002') || 
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
    // 상하반기
    getCodeList('HHII800'),
    // 공정코드
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_09', param: { 
      CMPNY_DIV: searchParams.CMPNY_DIV, 
      YEAR: searchParams.YEAR,
      HALF_DIV: searchParams.HALF_DIV
    } }),
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.HALF_DIV = res[1].ORESULT_CUR
    codeList.PROCESS_CD = res[2].ORESULT_CUR
    grdMain.value.setBindingColumn('DEPT_NM', codeList.DEPT_CD, 'DEPT_CD', 'DEPT_NM')
    grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
    grdMain.value.setBindingColumn('PROCESS_CD', codeList.PROCESS_CD, 'COD', 'TXT')
  })
  grdMain.value.setBindingColumn('REG_DIV', codeList.REG_DIV, 'COD', 'TXT')
})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false },},
  keys : [], 
  fields : [ 
    { fieldName: 'DEPT_NM', width: '100', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('부서명') }, lookupDisplay: true },
    { fieldName: 'MATNO', width: '80', editable: false, dataType: 'text',  header: { text: t('자재번호') }, },
    { fieldName: 'MATDSC', width: '100', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('제품명') } },
    { fieldName: 'VNDNME', width: '60', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('납품사') } },
    { fieldName: 'MSDS_NM', width: '100', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('MSDS명') } },
    { fieldName: 'TYPE_ID', width: '30', editable: false, dataType: 'text', header: { text: t('TYPE') } },
    { fieldName: 'PROCESS_CD', width: '50', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('취급공정') }, lookupDisplay: true },
    { fieldName: 'EXPENSE', width: '60', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('용도') }, },
    { fieldName: 'CASNO', width: '60', dataType: 'text',  editable: false, header: { text: t('NO') } },
    { fieldName: 'KOR_NME', width: '60', dataType: 'text', styleName: 'left-column',  editable: false, header: { text: t('국문명') } },
    { fieldName: 'ENG_NME', width: '60', dataType: 'text', styleName: 'left-column', editable: false, header: { text: t('영문명') } },
    { fieldName: 'FROM_IGDTRATE', width: '40', dataType: 'text', styleName: 'right-column', editable: false, header: { text: t('FROM') } },
    { fieldName: 'TO_IGDTRATE', width: '40', dataType: 'text', styleName: 'right-column', editable: false, header: { text: t('TO') } },
    { fieldName: 'IGDTRATE', width: '40', dataType: 'text', styleName: 'right-column', editable: false, header: { text: t('AVG') } },
    { fieldName: 'EXTINFO_16', width: '40', editable: false, dataType: 'text', header: { text: t('측정대상') } },
    { fieldName: 'EXTINFO_17', width: '40', editable: false, dataType: 'text', header: { text: t('검진대상') } },
    { fieldName: 'EXTINFO_07', width: '40', editable: false, dataType: 'text', header: { text: t('특별관리물질') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부명') },visible: false, },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') },visible: false, },
    { fieldName: 'REG_DIV', dataType: 'text', header: { text: t('구분') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
  ],
  columnLayout: [
    'DEPT_NM',
    'MATNO',
    'MATDSC',
    'VNDNME',
    'MSDS_NM',
    'TYPE_ID',
    'PROCESS_CD',
    'EXPENSE',
    {
          name: 'CAS',
          direction: 'horizontal',
          items: [ 'CASNO', 'KOR_NME', 'ENG_NME' ],
          header: { text: t('CAS') },
    },
    {
          name: '구성비',
          direction: 'horizontal',
          items: [ 'FROM_IGDTRATE', 'TO_IGDTRATE', 'IGDTRATE' ],
          header: { text: t('구성비') },
    },
    'EXTINFO_16',
    'EXTINFO_17',
    'EXTINFO_07',
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }

  if (btn.id === 'btnSearch') {
    getData()
  } 
}

// 그리드 데이터 조회
const getData = () => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }
  
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTFB0020_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
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

watch(() => searchParams.YEAR, (newValue, oldValue) => {
  getData()
})
 
watch(() => searchParams.HALF_DIV, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.REG_DIV, (newValue, oldValue) => {
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
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onCellItemClicked="onCellItemClicked"
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
</style>