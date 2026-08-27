<!-- 
  화면명 : 작업환경측정 공정별 유해인자 초과 현황
  화면개요 : 공정별 유해인자 초과 현황 조회
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

defineOptions({
  name:'100_health-HLT_F-HLTFC0050', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const grdField = ref([])

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(dayjs().get('year')),
  HALF_DIV: Number(dayjs().get('month')) > 6 ? 'LO' : 'HI',
  REG_DIV: 'A',
  ORGN_DIV: '',
  DIVISION: 'P'
})

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
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
    // 상하반기
    getCodeList('HHII800'),
  ]).then((res) => {
    codeList.HALF_DIV = res[0].ORESULT_CUR
  })
})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false },},
  keys : [], 
  columns : [],
})

grd1Props.columns = grd1Props.fields

// 그리드 헤더 설정
const setGrdHeader = (harmList) => {
  grdField.value = []
  if(searchParams.DIVISION == 'P') {
    grdMain.value.getGridView().footer.visible = false
    grdField.value.push({ fieldName: 'PROCESS_CD', width: '50', editable: false, dataType: 'text', header: { text: t('공정코드') } },)
    grdField.value.push({ fieldName: 'PROCESS_NM', width: '120', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('공정명') } },)
  } else {
    grdMain.value.getGridView().footer.visible = true
    grdField.value.push({ fieldName: 'DEPT_NM', width: '120', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('부서') }, footer: { styleName: 'right-column', text: '총 합계 : ' }, },)
    grdField.value.push({ fieldName: 'ASGN_NM', width: '120', editable: false, dataType: 'text', styleName: 'left-column', header: { text: t('협력사') } })
  }

  for(var harm of harmList) {
    grdField.value.push({ fieldName: 'C' + harm.HARM_CD, width: '100', editable: false, dataType: 'number', numberFormat: '#,###', styleName: 'right-column', header: { text: t(harm.HARM_NM) }, footer: { numberFormat: '#,###',expression: 'sum' },},)
  }
  grdField.value.push({ fieldName: 'TOTAL', width: '80', editable: false, dataType: 'number', numberFormat: '#,###', styleName: 'right-column', header: { text: t('초과합계') }, footer: { numberFormat: '#,###',expression: 'sum' }},)

  grdMain.value.getDataProvider().setFields(grdField.value)
  grdMain.value.getGridView().setColumns(grdField.value)
}

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
      fileName: searchParams.YEAR + '년도'
        + (searchParams.HALF_DIV === 'HI' ? ' 상반기' : ' 하반기')
        + (searchParams.REG_DIV === 'A' ? ' 정기' : ' 수시')
        + ' 공정별 유해인자 초과 현황'
        + '.xlsx', // 저장될 파일 name
      documentTitle: { //제목
        message:  searchParams.YEAR + '년도'
        + (searchParams.HALF_DIV === 'HI' ? ' 상반기' : ' 하반기')
        + (searchParams.REG_DIV === 'A' ? ' 정기' : ' 수시')
        + ' 공정별 유해인자 초과 현황',
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
  if(searchParams.DIVISION == 'P') {
    return commonSearchApi({ queryId: 'HLTFC0050_SEARCH_01', param: searchParams })
  } else {
    return commonSearchApi({ queryId: 'HLTFC0050_SEARCH_02', param: searchParams })
  }
}

// 조회 후
const afterSearch = async (res) => {
  await setGrdHeader(res.ORESULT_CUR1)
  if(searchParams.DIVISION == 'D') {
    const exceptKeys = ['DEPT_NM', 'ASGN_NM']
    res.ORESULT_CUR2 = res.ORESULT_CUR2.map(obj => {
      const replaced = Object.fromEntries(
        Object.entries(obj).map(([key, value]) => 
          exceptKeys.includes(key) ? [key,value] : [key, value === null ? 0 : value]
        )
      )

      const TOTAL = Object.entries(replaced)
        .filter(([key,value]) => typeof value === 'number' && !exceptKeys.includes(key))
        .reduce((sum, [, val]) => sum + val, 0)
      return { ...replaced, TOTAL }
    }) 
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR2)
}

watch(() => [searchParams.YEAR,
            searchParams.REG_DIV,
            searchParams.HALF_DIV,
            searchParams.ORGN_DIV,
            searchParams.DIVISION], (newValue, oldValue) => {
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
            v-model="searchParams.YEAR"
            :label="$t('년도')"
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
          <v-radio-group 
            class="mt-1"
            v-model="searchParams.DIVISION"
            inline>
            <v-radio class="mr-5" :value="'P'" color="primary" label="공정별"/>
            <v-radio :value="'D'" color="primary" label="부서별" />
          </v-radio-group>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grdField"
            :columns="grd1Props.columns"
          />
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
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>