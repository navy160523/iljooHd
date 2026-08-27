<!-- 
  화면명 : 보건 - 건강진단 - 직무변경자 관리
  작성자: 일주지앤에스 SI1팀 박재형 선임
-->
<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import { forEach } from 'lodash-es'
import _ from 'lodash'
defineOptions({
  name: '100_health-HLT_G-HLTGA0060',
})
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { getJsonFromExcel } from "@/utils/excel"
import { useCommonStore } from '@hiway/stores/common'
import { isEmpty } from '@/@core/utils'
import dayjs from "dayjs"
import HLTGA0060Popup from './HLTGA0060Popup.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const logsStore = useLogsStore()
const fileUploadPopup = ref(null)
const Popup = ref(null)
const saveParams = reactive([]);
const empList = ref([]);


const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  FRDATE: '',
  TODATE: '', 
  FRDATE2: '',
  TODATE2: ''
})

const searchParam2 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
})

const codeList = reactive({
  HI: []
})

const initCodeList = () => {
  Promise.all([
    // 검진 상하반기 구분
    getCodeList('HHII800'), 
    commonSearchApi({ queryId : 'HLTGA0060_SEARCH_03', param: searchParam2 }),
  ]).then((res) => {
    // console.log("res", res)
    codeList.HI = res[0].ORESULT_CUR
    empList.value = res[1].ORESULT_CUR
    // console.log("전체사번", empList.value)
    grdMain.value.setBindingColumn("TEST_IN_HALF_DIV", codeList.HI, "COD", "TXT");
  })
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setBefore(searchBefore).setQuery(searchData).setAfter(afterSearch).run()
  }else if (btn.id === "btnUpdate") {
      new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(afterDelete)
    .run()
  }else if (btn.id === 'btnGetHrInfo') {
    Popup.value.openPopup()
  }
}

const searchBefore = () => {
  // console.log('FRDATE:', searchParam.FRDATE);
  // console.log('TODATE:', searchParam.TODATE);

  if(!searchParam.FRDATE || !searchParam.TODATE) {
    Message.warn(t('조회기간을 입력해주세요.'))
    return false
  }

  return true
}

const searchData = () => {
  // console.log('서치파람:', searchParam)
  return commonSearchApi({
    queryId: 'HLTGA0060_SEARCH_01',
    param: searchParam,
  })
}
const afterSearch = (res) => {
  // console.log("res", res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const isValidDateYYYYMMDD = (str) => {
  if (!/^\d{8}$/.test(str)) return false;

  const year = +str.substring(0, 4);
  const month = +str.substring(4, 6);
  const day = +str.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}`);

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
};

const beforeSave = () => {
  const chekedRow = grdMain.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.length = 0;

  for (let i = 0; i < chekedRow.length; i++) {
  const val = chekedRow[i];
  const rowData = grdMain.value.getDataProvider().getJsonRow(val);
  let deployDate = rowData.DEPLOY_AFT_DATE;

  if (deployDate) {
      if (typeof deployDate === 'string') {
        // YYYY-MM-DD → 하이픈 제거
        if (/^\d{4}-\d{2}-\d{2}$/.test(deployDate)) {
          deployDate = deployDate.replace(/-/g, '');
        }

        // 최종 검증: YYYYMMDD 형식 + 실제 존재하는 날짜
        if (!isValidDateYYYYMMDD(deployDate)) {
          Message.warn(`'배치 후 검진일'은 실제 존재하는 'YYYYMMDD' 형식의 날짜여야 합니다.`);
          return false;
        }
      }
    }

  // if (deployDate) {
  //   if (typeof deployDate === 'string') {
  //     if (/^\d{4}-\d{2}-\d{2}$/.test(deployDate)) {
  //       deployDate = deployDate.replace(/-/g, '');
  //     } else if (/^\d{8}$/.test(deployDate)) {
  //       // 그대로 사용
  //     } else {
  //       Message.warn(`'배치 후 검진일'은 'YYYY-MM-DD' 또는 'YYYYMMDD' 형식으로 입력해주세요.`);
  //       return false;
  //     }
  //   }
  // }

  saveParams.push({
    CMPNY_DIV: userStore.cmpnyDiv,
    REQ_DATE: rowData.REQ_DATE,
    EMP_NO: rowData.EMP_NO,
    ZZ_HEALTH_DT: rowData.ZZ_HEALTH_DT,
    TEST_DATE_LIMIT: rowData.TEST_DATE_LIMIT,
    DEPLOY_AFT_DATE: deployDate,
    TEST_IN_YEAR: rowData.TEST_IN_YEAR,
    TEST_IN_HALF_DIV: rowData.TEST_IN_HALF_DIV,
    REMARK: rowData.REMARK,
    USER_ID: userStore.userId,
  });
}

  // chekedRow.forEach(val => {
  //   let rowData = grdMain.value.getDataProvider().getJsonRow(val); // 사용자가 입력한 값 가져오기
  //   // console.log("rowData : ", rowData)
  //   let deployDate = rowData.DEPLOY_AFT_DATE;

  //   if (typeof deployDate === 'string') {
  //   if (/^\d{4}-\d{2}-\d{2}$/.test(deployDate)) {
  //     deployDate = deployDate.replace(/-/g, '');
  //   } else if (/^\d{8}$/.test(deployDate)) {
  //     // 그대로 사용
  //   } else {
  //     Message.warn(`'배치 후 검진일'은 'YYYY-MM-DD' 또는 'YYYYMMDD' 형식으로 입력해주세요.`);
  //     return // 저장 중단
  //   }
  // }

  //   saveParams.push({
  //     CMPNY_DIV: userStore.cmpnyDiv, // 회사 구분 (고정값)
  //     REQ_DATE: rowData.REQ_DATE,
  //     EMP_NO: rowData.EMP_NO,
  //     ZZ_HEALTH_DT: rowData.ZZ_HEALTH_DT,
  //     TEST_DATE_LIMIT: rowData.TEST_DATE_LIMIT,
  //     DEPLOY_AFT_DATE: deployDate, // 배치 후 검진일
  //     TEST_IN_YEAR: rowData.TEST_IN_YEAR,
  //     TEST_IN_HALF_DIV: rowData.TEST_IN_HALF_DIV,
  //     REMARK: rowData.REMARK,
  //     USER_ID: userStore.userId, // 사용자 ID (고정값)
  //   })
  // })
  return true;
}

const saveData = () => {
  // console.log("저장전", saveParams);
  return commonExecuteApi({ queryId : 'HLTGA0060_SAVE_01', list: saveParams })
}

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

  checkedData.forEach(val => {
    let rowData = grdMain.value.getDataProvider().getJsonRow(val); //  체크된 행 데이터 가져오기
    // console.log("row", rowData)
    deleteParam.push({
      CMPNY_DIV: userStore.cmpnyDiv, // 필수 키 값
      REQ_DATE: rowData.REQ_DATE, // 필수 키 값
      EMP_NO: rowData.EMP_NO, // 필수 키 값
    });
  });

  return commonExecuteApi({
    queryId: 'HLTGA0060_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

// 인원 추가
const addTo = async (cData) => {
  // console.log("add", cData)

  const filtered = cData.filter(row => {
    return !empList.value.some(e => e.EMP_NO === row.EMP_NO);
  });

  if (filtered.length < cData.length) {
    Message.warn('이미 등록된 인원은 제외되었습니다.');
  }

  filtered.forEach(row => {
    const gch = grdMain.value.getDataProvider().addRow(row)
    grdMain.value.getGridView().checkRow(gch, true)
  });
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys : [], 
  fields: [
    {
      fieldName: 'REQ_DATE',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('신청일시') }, 
      // styleName: 'left-column',
    },
    {
      fieldName: 'DEPTID',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('변경전 부서코드') },
      // styleName: 'left-column',
    },
    {
      fieldName: 'ZZ_DEPTNAME',
      dataType: 'text',
      width: '130',
      editable: false,
      styleName: 'left-column',
      header: { text: t('변경전 부서명') },
    },
    {
      fieldName: 'DEPTID2',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('변경후 부서코드')},
    },
    {
      fieldName: 'ZZ_DEPTNAME2',
      dataType: 'text',
      width: '130',
      editable: false,
      header: { text: t('변경후 부서명') },
      styleName: 'left-column',
    },
    {
      fieldName: 'ZZ_POSITION_NM',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('직위') },
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'DISPLAY_NAME',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('성명')},
    },
    {
      fieldName: 'JOBCODE',
      dataType: 'text',
      width: '80',
      editable: false,
      visible: false,
      header: { text: t('변경전 직무코드') },
    },
    {
      fieldName: 'ZZ_JOB_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'left-column',
      header: { text: t('변경전 직무명') },
      // styleName: 'left-column editable_column',
    },
    {
      fieldName: 'JOBCODE2',
      dataType: 'text',
      width: '80',
      editable: false,
      visible: false,
      header: { text: t('변경후 직무코드') },
    },
    {
      fieldName: 'ZZ_JOB_NM2',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'left-column',
      header: { text: t('변경후 직무명') },
      // styleName: 'left-column editable_column',
    },
    {
      fieldName: 'ZZ_HEALTH_YN',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('배치전 검진대상 여부') },
      // styleName: 'left-column editable_column',
    },
    {
      fieldName: 'ZZ_HEALTH_CD',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('검진코드') },
      // styleName: 'left-column editable_column',
    },
    {
      fieldName: 'ZZ_HEALTH_CD2',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('배치전 검진코드') },
      // styleName: 'left-column editable_column',
    },
    {
      fieldName: 'ZZ_HEALTH_DT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('검진일자') },
      // styleName: 'left-column editable_column',
    },
    {
      fieldName: 'ZZ_HEALTH_RESULT',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('판정결과') },
      // styleName: 'left-column editable_column',
    },
    {
      fieldName: 'ZZ_HEALTH_FACTOR',
      dataType: 'text',
      width: '350',
      editable: false,
      header: { text: t('배치전 유해인자') },
      styleName: 'left-column',
    },
    {
      fieldName: 'ZZ_HEALTH_RSN',
      dataType: 'text',
      width: '150',
      editable: false,
      styleName: 'left-column',
      header: { text: t('산업보건의 의견') },
      // styleName: 'left-column editable_column',
    },
    {
      fieldName: 'ZZ_JOBCHG_DT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직무변경일자') },
    },
    {
      fieldName: 'TEST_DATE_LIMIT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('검진기간') },
    },
    {
      fieldName: 'TEST_IN_YEAR',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('년도') },
    },
    {
      fieldName: 'TEST_IN_HALF_DIV',
      dataType: 'text',
      width: '80',
      editable: false,
      lookupDisplay: true,
      header: { text: t('상하반기') },
    },
    {
      fieldName: 'DEPLOY_AFT_DATE',
      dataType: 'text',
      width: '150',
      editable: true,
      header: { text: t('배치후 검진일') },
      styleName: 'editable_column'
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      width: '250',
      editable: true,
      header: { text: t('비고') },
      styleName: 'editable_column left-column'
    },
    {
      fieldName: 'INSERT_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('등록일') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('등록자') },
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('저장여부') },
    },
  ],
  columns : [],
  columnLayout: [
    'REQ_DATE',
    'ZZ_DEPTNAME',
    'ZZ_DEPTNAME2',
    'ZZ_POSITION_NM',
    'EMP_NO',
    'DISPLAY_NAME',
    'ZZ_JOB_NM',
    'ZZ_JOB_NM2',
    'ZZ_HEALTH_YN',
    'ZZ_HEALTH_CD',
    'ZZ_HEALTH_CD2',
    'ZZ_HEALTH_DT',
    'ZZ_HEALTH_RESULT',
    'ZZ_HEALTH_FACTOR',
    'ZZ_HEALTH_RSN',
    'ZZ_JOBCHG_DT',
    'TEST_DATE_LIMIT',
    {
      name: '검진포함',
      direction: 'horizontal',
      items: ['TEST_IN_YEAR', 'TEST_IN_HALF_DIV'],
    },
    'DEPLOY_AFT_DATE',
    'REMARK',
    'INSERT_DATE',
    'INSERT_USER_ID'
  ]
})
grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true;

  // 기간입력
  const today = dayjs().format('YYYY-MM-DD');
  const monthAgo = dayjs().subtract(12, 'month').format('YYYY-MM-DD');
  const monthAgo2 = dayjs().subtract(48, 'month').format('YYYY-MM-DD');

  const year = dayjs().year();
  const yearStart = dayjs(`${year}-01-01`).format('YYYY-MM-DD');
  const yearCustomEnd = dayjs(`${year}-12-13`).format('YYYY-MM-DD');

  // searchParam.FRDATE = monthAgo;
  searchParam.FRDATE = yearStart;
  searchParam.TODATE = yearCustomEnd;
  // searchParam.FRDATE2 = monthAgo;
  // searchParam.TODATE2 = today;
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnGetHrInfo', 'btnSearch', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <!-- 기간 선택 -->
          <div class="d-flex">
                      <i-input
                        :label="$t('신청일시')"
                        type="date"
                        width="200px" 
                        v-model="searchParam.FRDATE"
                        >
                        <!-- :clearable="true"
                        @click:clearable="() => searchParam.FRDATE = ''" -->
                      </i-input>
                      <span class="mt-2">~</span>
                      <i-input
                        class="ml-3"
                        type="date"
                        width="160px"
                        v-model="searchParam.TODATE"
                        >
                        <!-- :clearable="true"
                        @click:clearable="() => searchParam.TODATE = ''" -->
                      </i-input>

                      <i-input
                        :label="$t('검진기한')"
                        type="date"
                        width="200px"
                        v-model="searchParam.FRDATE2"
                      >
                      </i-input>
                      <span class="mt-2">~</span>
                      <i-input
                        class="ml-3"
                        type="date"
                        width="160px"
                        v-model="searchParam.TODATE2"
                      >
                      </i-input>
          </div>
        </v-sheet>
        <!-- <v-sheet class="pa-0 h-auto"> -->
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
            <!-- @onCellItemClicked="onCellItemClicked" -->
        <!-- </v-sheet> -->
      </div>
    </v-card-text>
  </v-card>
  <HLTGA0060Popup ref="Popup" @selected="addTo"></HLTGA0060Popup>
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
