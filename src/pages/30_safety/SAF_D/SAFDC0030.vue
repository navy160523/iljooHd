<script setup>

import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'

import { useLogsStore } from '@hiway/stores/logs'

import { useUserStore } from '@hiway/stores/user'

import { useI18n } from 'vue-i18n'

import {

  commonPgSearchApi,

  commonPgExecuteApi,

  getPgCodeList,

} from '@hiway/api/commonApi'

import RealGrid from '@/components/RealGrid.vue'

import IGridTitle from '@/components/IGridTitle.vue'

import IMenuTitle from '@/components/IMenuTitle.vue'

import deleteFlowHelper from '@/utils/deleteFlowHelper'

import queryFlowHelper from '@/utils/searchFlowHelper'

import dayjs from 'dayjs'

import Message from '@hiway/utils/notify'

import SAFDC0030_Popup01 from './SAFDC0030_Popup01.vue'

defineOptions({

  name: '30_safety-SAF_D-SAFDC0030',

})

const vm = getCurrentInstance().proxy

const t = useI18n().t

const menuTitle = ref(null)

const grdMain = ref(null)

const userStore = useUserStore()

const sAFDC0030_Popup01 = ref(null)

const searchParam = reactive({

  CMPNY_DIV: userStore.cmpnyDiv,

  JSTOP_DATE_FR: '',

  JSTOP_DATE_TO: '',

  BSNS_CD: userStore.bsnsCd,

  DEPT_CD: userStore.deptCd,

  ASGN_CD: '',

  RESTART_DIV: '',

})

const codeList = reactive({

  company: [],

  bsnsCd: [],

  deptCd: [],

  asgnCd: [],

  restartDiv: [],

})

const initCodeList = () => {

  Promise.all([

    //사업부조회

    commonPgSearchApi({

      queryId: 'searchBSNS',

      param: { CMPNY_DIV: userStore.cmpnyDiv },

    }),

    commonPgSearchApi({

      queryId: 'searchDept3',

      param: {

        CMPNY_DIV: userStore.cmpnyDiv,

        BSNS_CD: searchParam.BSNS_CD,

        USE_DIV: 'Y'

      },

    }),

    getPgCodeList('HHIG170'),

  ]).then((res) => {

    codeList.bsnsCd = res[0].ORESULT_CUR

    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })

    codeList.deptCd = res[1].ORESULT_CUR

    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

    //codeList.company.unshift({ TXT: '전체', COD: '' })

    codeList.restartDiv = res[2].ORESULT_CUR

    codeList.restartDiv.unshift({ TXT: '전체', COD: '' })

    // Trigger initial watch calls

    searchParam.CMPNY_DIV = userStore.cmpnyDiv

  })

}

const grdMainProps = reactive({

  gridViewOption: { checkBar: true },

  fields: [

    { fieldName: 'JSTOP_DT', dataType: 'text', width: '120', editable: false, header: { text: t('중지일자') } },

    { fieldName: 'JSTOP_TIME', dataType: 'text', width: '100', editable: false, header: { text: t('중지시간') } },

    { fieldName: 'RESTART_DT', dataType: 'text', width: '120', editable: false, header: { text: t('재개일자') } },

    { fieldName: 'RESTART_TIME', dataType: 'text', width: '100', editable: false, header: { text: t('재개시간') } },

    { fieldName: 'RESTART_DIV_NM', dataType: 'text', width: '120', editable: false, header: { text: t('진행상태') } },

    { fieldName: 'DEPT_NM', dataType: 'text', styleName: 'left-column', width: '250', editable: false, visible: false, header: { text: t('소속조직') } },

    { fieldName: 'ASGN_NM', dataType: 'text', styleName: 'left-column', width: '250', editable: false, header: { text: t('작업담당소속') } },

    { fieldName: 'CHG_EMP_NM', dataType: 'text', width: '100', editable: false, header: { text: t('작업담당자') } },

    { fieldName: 'CHG_EMP_NO', dataType: 'text', width: '100', editable: false, visible: false, header: { text: t('작업담당자 사번') } },

    { fieldName: 'JOB_TIT_NM', dataType: 'text', width: '100', editable: false, visible: false, header: { text: t('작업담당자 직위') } },

    { fieldName: 'WORKER_CNT', dataType: 'text', width: '80', editable: false, styleName: 'right-column', header: { text: t('인원') } },

    { fieldName: 'JSTOP_DESC', dataType: 'text', styleName: 'left-column', width: '350', editable: false, header: { text: t('중지사유') } },

    { fieldName: 'STOP_IMG_YN', dataType: 'text', width: '60', editable: false, header: { text: t('사진') } },

    { fieldName: 'STOP_FILE_YN', dataType: 'text', width: '60', editable: false, header: { text: t('자료') } },

    { fieldName: 'RESTART_DIV', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('조치구분') } },

    { fieldName: 'RESTART_DESC', dataType: 'text', styleName: 'left-column', width: '350', editable: false, header: { text: t('조치내용') } },

    { fieldName: 'ACT_IMG_YN', dataType: 'text', width: '60', editable: false, header: { text: t('사진') } },

    { fieldName: 'ACT_FILE_YN', dataType: 'text', width: '60', editable: false, header: { text: t('자료') } },

    { fieldName: 'JOB_LPLC', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('작업장소(대)') } },

    { fieldName: 'JOB_MPLC', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('작업장소(중)') } },

    { fieldName: 'JOB_SPLC', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('작업장소(소)') } },

    { fieldName: 'JOB_SPLC_NM', dataType: 'text', styleName: 'left-column', width: '150', editable: false, header: { text: t('장소') } },

    { fieldName: 'JOB_PLC_DESC', dataType: 'text', styleName: 'left-column', width: '200', editable: false, header: { text: t('장소상세') } },

    { fieldName: 'SHIP_NO', dataType: 'text', width: '150', editable: false, header: { text: t('호선/프로젝트No.') } },

    { fieldName: 'LOSS_TIME', dataType: 'text', width: '100', editable: false, styleName: 'right-column', header: { text: t('시간손실') } },

    { fieldName: 'JSTOP_NO', dataType: 'text', visible: false, header: { text: t('중지번호') } },

    { fieldName: 'FILE_ID', dataType: 'text', visible: false, header: { text: t('중지첨부') } },

    { fieldName: 'FILE_ID2', dataType: 'text', visible: false, header: { text: t('조치첨부') } },

    { fieldName: 'JSTOP_EMP_NO', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('단속자 사번') } },

    { fieldName: 'JSTOP_EMP_NM', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('단속자 성명') } },

    { fieldName: 'JSTOP_BSNS_CD', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('단속자 사업본부') } },

    { fieldName: 'JSTOP_ASGN_CD', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('단속자 소속코드') } },

    { fieldName: 'JSTOP_ASGN_NM', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('단속자 소속') } },

    { fieldName: 'JSTOP_DEPT_CD', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('단속자 부서코드') } },

    { fieldName: 'JSTOP_JOB_TIT_NM', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('단속자 직위') } },

    { fieldName: 'IMG_ID', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('이미지 ID') } },

    { fieldName: 'IMG_ID2', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('이미지 ID2') } },

    { fieldName: 'COMPANY', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('사업장구분') } },

    { fieldName: 'BSNS_CD', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('사업장구분') } },

    { fieldName: 'DEPT_CD', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('사업장구분') } },

    { fieldName: 'ASGN_CD', dataType: 'text', styleName: 'left-column', width: '350', editable: false, visible: false, header: { text: t('사업장구분') } },

  ],

  columns: [],

  columnLayout: [

    'JSTOP_DT',

    'JSTOP_TIME',

    'RESTART_DT',

    'RESTART_TIME',

    'RESTART_DIV_NM',

    'ASGN_NM',

    'CHG_EMP_NM',

    'WORKER_CNT',

    'JSTOP_DESC',

    {

      name: '중지',

      direction: 'horizontal',

      items: ['STOP_IMG_YN', 'STOP_FILE_YN'],

    },

    'RESTART_DESC',

    {

      name: '조치',

      direction: 'horizontal',

      items: ['ACT_IMG_YN', 'ACT_FILE_YN'],

    },

    'JOB_SPLC_NM',

    'JOB_PLC_DESC',

    'SHIP_NO',

    'LOSS_TIME',

  ],

})

grdMainProps.columns = grdMainProps.fields

const onSearch = () => {

  new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()

}

const onRegister = () => {

  sAFDC0030_Popup01.value.openPopup()

}

const onDelete = () => {

  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedData.length === 0) {

    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return

  }

  new deleteFlowHelper(vm, t)

    .setBefore(() => true)

    .setQuery(deleteData)

    .setAfter(() => {

      Message.success(t('삭제되었습니다.'))

      onSearch()

    })

    .run()

}

const onButtonsClick = (btn) => {

  if (btn.id === 'btnSearch') {

    onSearch()

  } else if (btn.id === 'btnRegist') {

    onRegister()

  } else if (btn.id === 'btnDelete') {

    onDelete()

  }

}

const deleteData = () => {

  let deleteParam = []

  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < checkedData.length; i++) {

    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])

    deleteParam.push({

      CMPNY_DIV: data.COMPANY,

      JSTOP_NO: data.JSTOP_NO,

      COMPANY: data.COMPANY,

    })

  }

  return commonPgExecuteApi({

    queryId: 'SAFDC0010_DELETE05',

    list: deleteParam,

  })

}

const searchData = () => {

  return commonPgSearchApi({

    queryId: 'SAFDC0010_SEARCH_13',

    param: searchParam,

  })

}

const afterSearch = (res) => {

  let list = res.ORESULT_CUR || []

  list.forEach(row => {

    row.STOP_IMG_YN = row.IMG_ID ? 'Y' : 'N'

    row.STOP_FILE_YN = row.FILE_ID ? 'Y' : 'N'

    row.ACT_IMG_YN = row.IMG_ID2 ? 'Y' : 'N'

    row.ACT_FILE_YN = row.FILE_ID2 ? 'Y' : 'N'

    row.LOSS_TIME = row.LOSS_TIME || '-'

  })

  grdMain.value.getDataProvider().setRows(list)

}

const defaultDate = () => {

  let date = dayjs()

  let dateFrom = dayjs().subtract(7, 'day')

  searchParam.JSTOP_DATE_FR = dateFrom.format('YYYY-MM-DD')

  searchParam.JSTOP_DATE_TO = date.format('YYYY-MM-DD')

}

onMounted(() => {

  defaultDate()

  initCodeList()

  onSearch()

})

//셀 더블클릭 이벤트 관련 로직 시작

const onCellDblClicked = (grid, clickData) => {

  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  // console.log("목록 > 팝업 data : ", data);

  sAFDC0030_Popup01.value.openPopup2(data)

}

//셀 더블클릭 이벤트 관련 로직 끝

const closedPopup = () => {

  onSearch()

}

// 대상조직 연동

watch(

  () => searchParam.CMPNY_DIV,

  (newValue) => {

    commonPgSearchApi({

      queryId: 'searchBSNS',

      param: { CMPNY_DIV: newValue },

    }).then((res) => {

      searchParam.BSNS_CD = ''

      codeList.bsnsCd = res.ORESULT_CUR

      codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })

    })

  }

)

watch(

  () => searchParam.BSNS_CD,

  (newValue) => {

    commonPgSearchApi({

      queryId: 'searchDept3',

      param: { CMPNY_DIV: searchParam.CMPNY_DIV, BSNS_CD: newValue, USE_DIV: 'Y' },

    }).then((res) => {

      searchParam.DEPT_CD = ''

      codeList.deptCd = res.ORESULT_CUR

      codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

    })

  }

)

watch(

  () => searchParam.DEPT_CD,

  (newValue) => {

    // 만약 부서가 선택되지 않았거나 빈 값('전체')이면 팀 목록을 비우고 차단

    if (!newValue) {

      searchParam.ASGN_CD = "";

      codeList.asgnCd = [{ ASGN_NM: "전체", ASGN_CD: "" }];

      return;

    }

    commonPgSearchApi({

      queryId: "searchTeam",

      param: {

        CMPNY_DIV: searchParam.CMPNY_DIV || userStore.cmpnyDiv,

        BSNS_CD: searchParam.BSNS_CD,

        DEPT_CD: newValue,

        USE_DIV: "Y"

      },

    }).then((res) => {

      searchParam.ASGN_CD = "";

      // API 응답 구조 검증 및 대입

      const teamData = res?.ORESULT_CUR || res || [];

      codeList.asgnCd = Array.isArray(teamData) ? teamData : [];

      // 중복 체크 후 배열의 맨 앞에 "전체" 항목 추가

      if (codeList.asgnCd.length === 0 || codeList.asgnCd[0].ASGN_CD !== "") {

        codeList.asgnCd.unshift({ ASGN_NM: "전체", ASGN_CD: "" });

      }

    });

  },

  { immediate: true }

);

</script>

<template>

  <v-card class="pa-0 fill-height">

    <v-card-title class="pa-3 pb-0">

      <IMenuTitle ref="menuTitle" :title="`${$t(useLogsStore().menuId)}`" />

      <IGridTitle class="mt-0" :button-list="['btnSearch', 'btnRegist', 'btnDelete']" @click-button="onButtonsClick" />

    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">

      <div class="d-flex flex-column fill-height">

        <v-sheet class="searchArea d-flex mb-2">

          <i-input v-model="searchParam.JSTOP_DATE_FR" label-width="25px" :label="$t('일자')" width="170px" class="mr-1"

            type="date"></i-input>

          <span class="mt-2">~</span>

          <i-input v-model="searchParam.JSTOP_DATE_TO" class="ml-1" type="date" width="150px"></i-input>

          <!-- <i-select v-model="searchParam.CMPNY_DIV" :label="$t('대상조직')" label-width="60px" width="220px"

            :items="codeList.company" item-title="TXT" item-value="COD"></i-select> -->

          <i-select v-model="searchParam.BSNS_CD" width="180px" :label="$t('대상조직')" :items="codeList.bsnsCd"

            item-title="BSNS_NM" item-value="BSNS_CD"></i-select>

          <i-select v-model="searchParam.DEPT_CD" width="220px" :items="codeList.deptCd" item-title="DEPT_NM"

            item-value="DEPT_CD"></i-select>

          <i-select v-model="searchParam.ASGN_CD" width="220px" :items="codeList.asgnCd" item-title="ASGN_NM"

            item-value="ASGN_CD"></i-select>

          <i-select v-model="searchParam.RESTART_DIV" :label="$t('조치구분')" label-width="60px" width="220px"

            :items="codeList.restartDiv" item-title="TXT" item-value="COD"></i-select>

        </v-sheet>

        <v-sheet style="height: -webkit-fill-available">

          <RealGrid ref="grdMain" :grid-view-option="grdMainProps.gridViewOption" :keys="grdMainProps.keys"

            :fields="grdMainProps.fields" :columns="grdMainProps.columns" :column-layout="grdMainProps.columnLayout"

            @onCellDblClicked="onCellDblClicked" />

        </v-sheet>

      </div>

    </v-card-text>

  </v-card>

  <SAFDC0030_Popup01 ref="sAFDC0030_Popup01" @closed="closedPopup"></SAFDC0030_Popup01>

</template>

<style scoped lang="scss">

.content-area {

  position: relative;

  // 만약 타이틀 영역에 컴포넌트를 추가한다면

  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.

  height: calc(100vh - 293px);

  overflow-y: auto;

  >div {

    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.

    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.

    min-height: 500px;

  }

}

</style>
