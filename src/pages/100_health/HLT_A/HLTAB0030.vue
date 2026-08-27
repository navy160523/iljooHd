<!-- HLTAB0030 보건 위험성 평가 현황 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

defineOptions({
  name: '100_health-HLT_A-HLTAB0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,    //사업부
  DEPT_CD: userStore.deptCd,    //부서
  ASGN_CD: (userStore.userDiv === 'A' || userStore.deptCd === userStore.asgnCd) ? '' : userStore.asgnCd, // 협력사
  YEAR: Number(dayjs().format('YYYY')),    //기준년도
  STATUS: '',                 //진행상태
  EVA_DIV: '',                  //평가구분
  SEARCH: ''                    //검색
})

// 코드리스트
const codeList = reactive({
  proStat: [],
  evaDiv: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' }
  ]
})

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true

})

const initCodeList = () => {
  Promise.all([
    // 사업부
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: searchParams.CMPNY_DIV },
    }),
    // 부서
    commonSearchApi({ 
      queryId: 'searchDept3', 
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y'} 
    }),
    // 협력사/과
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD },
    }),
    getCodeList('HHIZ030')
  ]).then((res) => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.asgnCd = res[2].ORESULT_CUR
    codeList.proStat = res[3].ORESULT_CUR

    codeList.bsnsCd.unshift({ BSNS_CD: '전체', BSNS_NM: '' })
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    codeList.proStat.unshift({ COD: '', TXT: '전체' })

    grdMain.value.setBindingColumn('EVAL_TYPE', codeList.evaDiv, 'COD', 'TXT')
    grdMain.value.setBindingColumn('APPROVAL_STATUS', codeList.proStat, 'COD', 'TXT')
  })

  //사업부 변경시 부서 조회
  watch(
    () => searchParams.BSNS_CD,
    (newValue) => {
      commonSearchApi({
        queryId: 'searchDept3',
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue, USE_DIV: 'Y'} 
      }).then((res) => {
        searchParams.DEPT_CD = ''
        codeList.deptCd = res.ORESULT_CUR
        codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      })
    }
  )
}

//부서 변경시 협력사 조회
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchVend',
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        BSNS_CD: searchParams.BSNS_CD,
        DEPT_CD: newValue,
      },
    }).then((res) => {
      searchParams.ASGN_CD = ''
      codeList.asgnCd = res.ORESULT_CUR
      codeList.asgnCd.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    })
  }
)

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }},
  keys : [],
  fields: [ 
    { fieldName: 'YEAR', width: '60', styleName: 'center-column', dataType: 'text', header: { text: t('기준연도') }},
    { fieldName: 'EVAL_TYPE', width: '60', styleName: 'center-column', dataType: 'text', header: { text: t('평가구분') }, lookupDisplay: true },
    { fieldName: 'DEPT_NM', width: '80', styleName: 'left-column', dataType: 'text', header: { text: t('부서명') }, lookupDisplay: true },
    { fieldName: 'ASGN_NM', width: '80', styleName: 'left-column', dataType: 'text', header: { text: t('협력사명') }, lookupDisplay: true },
    { fieldName: 'USER_DATA', width: '80', dataType: 'text', header: { text: t('작성자') }},
    { fieldName: 'APPROVAL_STATUS', width: '50', styleName: 'center-column', dataType: 'text', header: { text: t('진행상태') }, lookupDisplay: true },
    { fieldName: 'EVAL_DATE', width: '60', styleName: 'center-column', dataType: 'date', datetimeFormat: 'yyyy-MM-dd', header: { text: t('평가일자') }},
    { fieldName: 'CNT', width: '50', styleName: 'center-column', dataType: 'text', header: { text: t('평가대상\n공정/직무수'), styleName: 'multiline-editor-pre' }},
    { fieldName: 'HARM_NM', width: '200', styleName: 'left-column', dataType: 'text', header: { text: t('평가대상\n위험요인'), styleName: 'multiline-editor-pre' },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<div class="d-flex justify-space-between" style="align-items: center;">
            <p style="text-align:left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cell.value}</p>
          </div>`;
          return str;
        },
      }
    },
    { fieldName: 'A_POINT', width: '60', styleName: 'center-column', dataType: 'text', header: { text: t('화학물질\n평균 위험성'), styleName: 'multiline-editor-pre' }},
    { fieldName: 'B_POINT', width: '60', styleName: 'center-column', dataType: 'text', header: { text: t('소음\n평균 위험성'), styleName: 'multiline-editor-pre' }},
    { fieldName: 'C_POINT', width: '60', styleName: 'center-column', dataType: 'text', header: { text: t('근골\n평균 위험성'), styleName: 'multiline-editor-pre' }},
    { fieldName: 'PLAN_CNT', width: '80', styleName: 'center-column', dataType: 'text', header: { text: t('작업환경 개선대상\n공정/직무'), styleName: 'multiline-editor-pre' }},

    { fieldName: 'CMPNY_DIV', width: '100', dataType: 'text', visible: false},
    { fieldName: 'BSNS_CD', width: '100', dataType: 'text', visible: false},
    { fieldName: 'DEPT_CD', width: '100', dataType: 'text', visible: false},
    { fieldName: 'ASGN_CD', width: '100', dataType: 'text', visible: false},
  ],
  columns: [],
}) 

grd1Props.columns = grd1Props.fields

onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
})

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnPrint') {
    grdMain.value.getGridView().exportGrid({ 
      type: 'excel',
      target: 'local',
      fileName: '보건 위험성 평가 현황',
      progressMessage: '엑셀 다운로드중입니다.',
      showProgress: true,
      indicator: 'visible',
      header: 'visible',
      footer: 'hidden',
      allColumns: false,
      exportTemplate: true
    })
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAB0030_SEARCH_01', param: searchParams })
}

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
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              v-model="searchParams.YEAR"
              :label="$t('기준년도')"
              label-width="50px"
              width="200px"
              type="number"
            />

            <i-select
              :label="$t('사업부')"
              width="200px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              class="mr-4"
            />

            <i-select
              :label="$t('부서')"
              width="200px"
              placeholder="부서"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :readonly="isEmpty(searchParams.BSNS_CD)"
              class="mr-4"
            />

            <i-select
              :label="$t('협력사')"
              width="200px"
              placeholder="협력사"
              v-model="searchParams.ASGN_CD"
              :items="codeList.asgnCd"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              :readonly="isEmpty(searchParams.DEPT_CD)"
              class="mr-4"
            />

            <i-select
              :label="$t('진행상태')"
              width="200px"              
              placeholder="진행상태"
              v-model="searchParams.STATUS"
              :items="codeList.proStat"
              item-value="COD"
              item-title="TXT"
              class="mr-4"
            />

            <i-select
              :label="$t('평가구분')"
              width="200px"
              placeholder="평가구분"
              v-model="searchParams.EVA_DIV"
              :items="codeList.evaDiv"
              item-value="COD"
              item-title="TXT"
              class="mr-4"
            />
            <i-input
              :label="$t('검색')"
              v-model="searchParams.SEARCH"
              type="text"
              label-width="40px"
              width="250px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
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
::v-deep(.rg-header .rg-table tr td) {
  white-space: pre-line !important;
}
</style>