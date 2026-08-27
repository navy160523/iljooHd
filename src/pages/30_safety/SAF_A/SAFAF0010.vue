<script setup>
/*
기능개요 :기간별 재해자 목록을 조회, 전사적으로 사용,
기존의 안전환경 홈페이지에 게시 되던 월별 재해자목록파일을 대체하는 기능
작성자 : SI3팀 김현재 선임
*/

import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import SAFAF0010Popup from './SAFAF0010PopUp.vue'

defineOptions({
  name: '30_safety-SAF_A-SAFAF0010',
})
//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const userStore = useUserStore()
const deptPopup = ref(null)
const sAFAF0010Popup = ref(null)
const searchParam = reactive({
  CMPNY_DIV: '', //회사
  BSNS_CD: '', //사업부
  FROM: '', //발생기간 FROM
  TO: '', //발생기간 TO
  INJR_DEPT_NM: '', //재해부서이름
  INJR_DEPT_CD: '', //재해부서코드
  JEWE_YN_IO: '', //통계제외분
})

const searchParam02 = reactive({
  CMPNY_DIV: '',
  SAGO_SN: '',
})

const codeList = reactive({
  bsnscd: [], // 사업부
  deptcd: [], //부서
  respondiv: [], //책임
  porcesscd: [], //공정
  sagodiv: [], //사고구분
  rpttypecd: [], //처리구분
  sosogdiv: [], //소속구분
  jikjongcd: [], //직종
  injurypartl: [], //상해부위 대
  injurytype: [], //상해종류
  jindancd: [], //진단
})
//변수선언부 끝

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {},
  fields: [
    {
      fieldName: 'OCCUR_DT_TIME',
      editable: false,
      dataType: 'text',
      header: { text: t('발생일시') },
    },
    {
      fieldName: 'ASGN_FULL_NM',
      width: '200px',
      editable: false,
      dataType: 'text',
      header: { text: t('재해조직명') },
    },
    {
      fieldName: 'RESP_DEPT_NM',
      editable: false,
      dataType: 'text',
      header: { text: t('책임부서명') },
    },
    {
      fieldName: 'VNDR_NM',
      editable: false,
      dataType: 'text',
      header: { text: t('업체명') },
    },
    {
      fieldName: 'RESPON_DIV',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('책임') },
    },
    {
      fieldName: 'PROCESS_CD',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('공정') },
    },
    {
      fieldName: 'SAGO_DIV_L',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('사고구분') },
    },
    {
      fieldName: 'SAGO_DIV_M',
      editable: false,
      dataType: 'text',
      header: { text: t('사고형태') },
    },
    {
      fieldName: 'APPROVAL_STATUS',
      editable: false,
      dataType: 'text',
      header: { text: t('진행상태') },
    },
    {
      fieldName: 'SAGO_GAEYO',
      dataType: 'text',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('사고개요') },
    },
    {
      fieldName: 'NAME',
      editable: false,
      dataType: 'text',
      header: { text: t('재해자') },
    },

    {
      fieldName: 'RESP_DEPT_CD',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('책임부서코드') },
    },

    {
      fieldName: 'VNDR_CD',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('업체코드') },
    },
    {
      fieldName: 'INJR_ORGN_NM',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_SN',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'INJR_ORGN_CD',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('재해조직코드') },
    },
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption: {},
  fields: [
    {
      fieldName: 'RPT_TYPE_CD',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('처리구분') },
    },
    {
      fieldName: 'SOSOG_DIV',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('소속구분') },
    },
    {
      fieldName: 'EMP_NO',
      editable: false,
      dataType: 'text',
      header: { text: t('사번') },
    },
    {
      fieldName: 'SOSOG_DEPT_DESC',
      editable: false,
      dataType: 'text',
      header: { text: t('소속조직명') },
    },
    {
      fieldName: 'SOSOG_DESC',
      editable: false,
      dataType: 'text',
      header: { text: t('업체명') },
    },
    {
      fieldName: 'GRD_DESC',
      editable: false,
      dataType: 'text',
      header: { text: t('직급') },
    },
    {
      fieldName: 'AGE',
      editable: false,
      dataType: 'text',
      header: { text: t('연령(만)') },
    },
    {
      fieldName: 'BIRTHDAY',
      editable: false,
      dataType: 'text',
      header: { text: t('생년월일') },
    },
    {
      fieldName: 'IPSAIL',
      editable: false,
      dataType: 'text',
      header: { text: t('입사일자') },
    },
    {
      fieldName: 'JIKJONG_CD',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('직종') },
    },
    {
      fieldName: 'INJURY_PART_L',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('대') },
    },
    {
      fieldName: 'INJURY_PART_S',
      editable: false,
      dataType: 'text',
      header: { text: t('소') },
    },
    {
      fieldName: 'INJURY_TYPE',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('상해종류') },
    },
    {
      fieldName: 'HND_PHN',
      editable: false,
      dataType: 'text',
      header: { text: t('연락처') },
    },
    {
      fieldName: 'JINDAN_CD',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('진단(주)') },
    },
    {
      fieldName: 'JINDAN_DAYS',
      editable: false,
      dataType: 'text',
      header: { text: t('손실일수') },
    },
    {
      fieldName: 'REGTDTE',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('총무부접수일') },
    },
    {
      fieldName: 'OKDTE',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('산재승인일') },
    },
    {
      fieldName: 'HUDTE',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('휴직일') },
    },
    {
      fieldName: 'BOKDTE',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('복직일') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_SN',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'SEQ',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'SOSOG_DEPT_CD',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'SOSOG_CD',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'GRD_CD',
      visible: false,
      editable: false,
      dataType: 'text',
      header: { text: t('') },
    },
    {
      fieldName: 'NAME',
      visible: false,
      editable: false,
      visible: false,
      dataType: 'text',
      header: { text: t('') },
    },
  ],
  columns: [],
  columnLayout: [
    'RPT_TYPE_CD',
    'SOSOG_DIV',
    'EMP_NO',
    'SOSOG_DEPT_DESC',
    'SOSOG_DESC',
    'GRD_DESC',
    'AGE',
    'BIRTHDAY',
    'IPSAIL',
    'JIKJONG_CD',
    {
      name: '상해부위',
      direction: 'horizontal',
      items: ['INJURY_PART_L', 'INJURY_PART_S'],
      header: { text: t('상해부위') },
    },
    'INJURY_TYPE',
    'HND_PHN',
    'JINDAN_CD',
    'JINDAN_DAYS',
  ],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields
//디폴트 날짜 설정 -1달~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -1달 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(1, 'month')
  searchParam.FROM =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    getCodeList('HHIB180'), //책임 조회
    getCodeList('HHIB050'), //공정 조회
    getCodeList('HHIB010'), //사고구분 조회
    getCodeList('HHIB070'), //처리구분 조회
    getCodeList('HHIZ020'), //소속구분 조회
    getCodeList('HHIB060'), //직종 조회
    getCodeList('HHIB020'), //상해부위 대 조회
    getCodeList('HHIB030'), //상해종류 조회
    getCodeList('HHIB120'), //진단 조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    }),
  ]).then((res) => {
    codeList.bsnscd = res[0].ORESULT_CUR
    codeList.respondiv = res[1].ORESULT_CUR
    codeList.porcesscd = res[2].ORESULT_CUR
    codeList.sagodiv = res[3].ORESULT_CUR
    codeList.rpttypecd = res[4].ORESULT_CUR
    codeList.sosogdiv = res[5].ORESULT_CUR
    codeList.jikjongcd = res[6].ORESULT_CUR
    codeList.injurypartl = res[7].ORESULT_CUR
    codeList.injurytype = res[8].ORESULT_CUR
    codeList.jindancd = res[9].ORESULT_CUR
    codeList.deptcd = res[10].ORESULT_CUR
    grdMain.value.setBindingColumn(
      'RESPON_DIV',
      codeList.respondiv,
      'COD',
      'TXT'
    )
    grdMain.value.setBindingColumn(
      'PROCESS_CD',
      codeList.porcesscd,
      'COD',
      'TXT'
    )
    grdMain.value.setBindingColumn('SAGO_DIV_L', codeList.sagodiv, 'COD', 'TXT')
    grdSub.value.setBindingColumn(
      'RPT_TYPE_CD',
      codeList.rpttypecd,
      'COD',
      'TXT'
    )
    grdSub.value.setBindingColumn('SOSOG_DIV', codeList.sosogdiv, 'COD', 'TXT')
    grdSub.value.setBindingColumn(
      'JIKJONG_CD',
      codeList.jikjongcd,
      'COD',
      'TXT'
    )
    grdSub.value.setBindingColumn(
      'INJURY_PART_L',
      codeList.injurypartl,
      'COD',
      'TXT'
    )
    grdSub.value.setBindingColumn(
      'INJURY_TYPE',
      codeList.injurytype,
      'COD',
      'TXT'
    )
    grdSub.value.setBindingColumn('JINDAN_CD', codeList.jindancd, 'COD', 'TXT')
    codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
  })
}

onMounted(() => {
  defaultDate()
  initCodeList()
  //초기값 세팅
  searchParam.CMPNY_DIV = userStore.cmpnyDiv
  searchParam.BSNS_CD = userStore.bsnsCd
  searchParam.INJR_DEPT_NM = '전체'
  onButtonsClick({ id: 'btnSearch' })
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }
}

//재해자현황 조회 관련 로직
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFAF0010_SEARCH01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//재해자현황 조회 관련 로직 끝

//재해자 인적사항 조회 관련 로직 시작
const searchData02 = () => {
  return commonSearchApi({
    queryId: 'SAFAF0010_SEARCH02',
    param: searchParam02,
  })
}

const afterSearch02 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//재해자 인적사항 관련 로직 끝

//재해자 현황 로우 체인지 이벤트
const onGrdMainCurrRowChanged = (grid, oldIndex, newIndex) => {
  let row = grdMain.value.getDataProvider().getJsonRow(newIndex)
  searchParam02.CMPNY_DIV = row.CMPNY_DIV
  searchParam02.SAGO_SN = row.SAGO_SN
  new queryFlowHelper(vm, t)
    .setQuery(searchData02)
    .setAfter(afterSearch02)
    .run()
}

//셀 더블클릭시 안전사고 즉보,보고서 팝업 출력
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex)
  let safeReportParam = {
    CMPNY_DIV: data.CMPNY_DIV,
    SAGO_SN: data.SAGO_SN,
  }
  sAFAF0010Popup.value.openPopup(safeReportParam)
}

//사업부변경 감지
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        ORGN_DIV: 'A',
        BSNS_CD: newValue,
        ASGN_NM: '',
        DEPT_CD: '',
        HSE_ONLY: '',
        USE_ONLY: 'Y',
      },
    }).then((res) => {
      searchParam.INJR_DEPT_CD = ''
      codeList.deptcd = res.ORESULT_CUR
      codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      >
      </IMenuTitle>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParam.FROM"
            :label="$t('발생기간')"
            width="200px"
            type="date"
            class="mr-0"
          ></i-input>
          <span class="mx-2 mt-1">~</span>
          <i-input
            v-model="searchParam.TO"
            width="150px"
            type="date"
            class="ml-0"
          ></i-input>
          <i-select
            label="사업부"
            width="250px"
            :items="codeList.bsnscd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            v-model="searchParam.BSNS_CD"
          ></i-select>
          <i-select
            :label="$t('재해부서')"
            width="250px"
            v-model="searchParam.INJR_DEPT_CD"
            :items="codeList.deptcd"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
          >
          </i-select>
          <div class="d-flex">
            <span style="font-size: 14px" class="mt-1 mr-2">통계제외분</span>
            <v-radio-group inline v-model="searchParam.JEWE_YN_IO">
              <v-radio label="전체" value=""></v-radio>
              <v-radio label="제외" value="O"></v-radio>
              <v-radio label="포함" value="I"></v-radio>
            </v-radio-group>
          </div>
        </v-sheet>
        <v-sheet height="50%" class="mb-3">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCurrentRowChanged="onGrdMainCurrRowChanged"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('재해자 인적사항')"> </IGridTitle>
          <RealGrid
            ref="grdSub"
            class="mt-2"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SAFAF0010Popup ref="sAFAF0010Popup"></SAFAF0010Popup>
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
    min-height: 700px;
  }
}
</style>
