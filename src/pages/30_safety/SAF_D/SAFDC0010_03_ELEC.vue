<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import IUpload from '@/components/IUpload.vue'
import SAFDC0010_03Popup from './SAFDC0010_03.Popup_ELEC.vue'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
defineOptions({
  name: '30_safety-SAF_D-SAFDC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const gridTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const workStopResist = ref(null)
const { sliSAFDC0010_03 } = history.state
const isMounted = ref(false)
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  JSTOP_DATE_FR: '',
  JSTOP_DATE_TO: '',
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
})

const initCodeList = async () => {
  await Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParam.BSNS_CD,
        USE_DIV: 'Y'
      },
    })
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })

    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  })
}

const codeList = reactive({
  BSNS_CD: [], //사업부
  DEPT_CD: [],
})

watch(() => searchParam.BSNS_CD, newValue => {
  if(isMounted.value) {
    if(newValue) {
      commonSearchApi({
        queryId: 'searchDept3',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: newValue,
          USE_DIV: 'Y'
        },
      }).then(res => {
        searchParam.DEPT_CD = ''
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }) 
    } else {
      searchParam.DEPT_CD = ''
      codeList.DEPT_CD = []
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    }
  }
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'JSTOP_DT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('중지일자') },
    },
    {
      fieldName: 'JSTOP_TIME',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('중지시간') },
    },
    {
      fieldName: 'RESTART_DT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('재개일자') },
    },
    {
      fieldName: 'RESTART_TIME',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('재개시간') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '350',
      editable: false,
      styleName: 'left-column',
      header: { text: t('작업담당소속') },
    },
    {
      fieldName: 'CHG_EMP_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('작업담당자') },
    },
    {
      fieldName: 'WORKER_CNT',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'right-column',
      header: { text: t('인원') },
    },
    {
      fieldName: 'JOB_SPLC_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      styleName: 'left-column',
      header: { text: t('장소분류') },
    },
    {
      fieldName: 'JOB_PLC_DESC',
      dataType: 'text',
      width: '350',
      editable: false,
      styleName: 'left-column',
      header: { text: t('작업장소') },
    },
    {
      fieldName: 'SHIP_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('호선번호') },
    },
    {
      fieldName: 'JSTOP_DESC',
      dataType: 'text',
      width: '400',
      editable: false,
      styleName: 'left-column',
      header: { text: t('중지사유') },
    },
    {
      fieldName: 'RESTART_DIV_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('조치구분') },
    },
    {
      fieldName: 'JSTOP_EMP_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('작업중지 처리자') },
    },

    {
      fieldName: 'RESTART_DESC',
      dataType: 'text',
      width: '300',
      editable: false,
      styleName: 'left-column',
      header: { text: t('조치결과') },
    },
    {
      fieldName: 'LOSS_TIME',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('시간손실') },
    },

    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JSTOP_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TEAM_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHG_EMP_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'RESTART_DIV',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_MPLC_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_LPLC_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_LPLC',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_MPLC',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_SPLC',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JSTOP_EMP_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ASGN_SHRT_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_L',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_M',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_S',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_L_NM',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_M_NM',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_S_NM',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'COMPANY',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'VIO_EMP_ASGN',
      visible: false,
      header: { text: t('') },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//디폴트 날짜 설정 -7일~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -7일 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(7, 'day')
  console.log('dateFrom', dateFrom)
  searchParam.JSTOP_DATE_FR =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.JSTOP_DATE_TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

const setSliParams = () => {
  if(sliSAFDC0010_03 !== undefined) {
    searchParam.JSTOP_DATE_FR = sliSAFDC0010_03.FROM_DT
    searchParam.JSTOP_DATE_TO = sliSAFDC0010_03.TO_DT
    searchParam.BSNS_CD = sliSAFDC0010_03.BSNS_CD
    searchParam.DEPT_CD = sliSAFDC0010_03.DEPT_CD
  }
}

onMounted(async () => {
  defaultDate()
  setSliParams()
  await initCodeList()
  //열고정 옵션
  grdMain.value.getGridView().setFixedOptions({
    colCount: 7,
  })
  onButtonsClick({ id: 'btnSearch' })

  isMounted.value = true
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else {
    workStopResist.value.openPopup()
  }
}

const beforeSearch = () => {
  return true
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_13',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//삭제관련 로직 시작
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    console.log('data', data)
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV, //회사구분
      JSTOP_NO: data.JSTOP_NO, //중지번호
      COMPANY: data.COMPANY, //위반자회사
    }
    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'SAFDC0010_DELETE05',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//셀 더블클릭 이벤트 관련 로직 시작
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  workStopResist.value.openPopup2(data)
}
//셀 더블클릭 이벤트 관련 로직 끝

//팝업 닫혔을때 재조회
const closedPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 py-0">
      <IGridTitle
        ref="gridTitle"
        :button-list="['btnSearch', 'btnWorkStopResist', 'btnDelete' ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            width="200px"
            :label="$t('중지일자')"
            type="date"
            class="mr-0"
            v-model="searchParam.JSTOP_DATE_FR"
          ></i-input>
          <span class="mt-2 mx-2">~</span>
          <i-input
            width="150px"
            type="date"
            class="ml-0"
            v-model="searchParam.JSTOP_DATE_TO"
          ></i-input>
          <i-select
            width="220px"
            :label="$t('사업부')"
            :items="codeList.BSNS_CD"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            v-model="searchParam.BSNS_CD"
            label-width="40px"
          ></i-select>
          <i-select
            width="275px"
            :label="$t('부서')"
            :items="codeList.DEPT_CD"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            v-model="searchParam.DEPT_CD"
            label-width="30px"
          ></i-select>
        </v-sheet>
        <v-sheet style="height: -webkit-fill-available">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SAFDC0010_03Popup
    ref="workStopResist"
    @closed="closedPopup"
  ></SAFDC0010_03Popup>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 293px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}
</style>
