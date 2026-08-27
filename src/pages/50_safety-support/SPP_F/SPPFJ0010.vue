<!-- SPPFJ0010 PSM 변경관리 -->
<!-- SI2팀 손상규 2025-02-25 -->

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
  commonSendSMS,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import { isEmpty, isEmptyArray } from "@/@core/utils"
import SPPFJ0010Popup from './SPPFJ0010Popup.vue'

defineOptions({
  name: '50_safety-support-SPP_F-SPPFJ0010',
})

const emit = defineEmits(['close'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)
const empPopup2 = ref(null)
const selectedData = reactive({})
const sppfj0010Popup = ref(null)

const deptListReady = ref(false);

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM: '', //기간 FROM
  TO: '', //기간 TO
  COMPANY: '', //회사구분
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  PROCESS: '', // 공정설비
  USER_ID: userStore.empNo,
})

const codeList = reactive({
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  PROCESS: [], //공정설비
})

const initCodeList = () => {
  console.log("1:",searchParams);
  Promise.all([
    commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_08', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_09', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_10', param: searchParams }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.PROCESS = res[2].ORESULT_CUR
    codeList.item = res[0].ORESULT_CUR.map(obj => ({
      ITEM_NM: obj.TXT,
      ITEM_CD: obj.COD  
    }))
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
    codeList.PROCESS.unshift({ PROCESS_NM: '전체', PROCESS: '' })
    deptListReady.value = true;

    grdMain.value.setBindingColumn('PROCESS', codeList.PROCESS, 'PROCESS', 'PROCESS_NM')
  })
}

//-1달 ~ 오늘날짜
const defaultDate = () => {
  let today = dayjs()
  let toDay =
    today.get('year') +
    '-' +
    (today.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    today.get('date').toString().padStart(2, '0')
  let fromDay = dayjs().subtract(1, 'month')
  let from =
    fromDay.$y +
    '-' +
    (fromDay.$M + 1).toString().padStart(2, '0') +
    '-' +
    fromDay.$D.toString().padStart(2, '0')
  searchParams.FROM = from
  searchParams.TO = toDay
}

//그리드 속성셋
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys: [],
  fields: [
    { fieldName: 'CHG_NM', width: '150', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('접수\n번호') } },
    { fieldName: 'PRO_DT', width: '120', editable: false, styleName: 'center-column', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('기안') } },
    { fieldName: 'CONFIRM_DT', width: '120', editable: false, styleName: 'center-column', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('승인') } },
    { fieldName: 'EFFECT_DT', width: '120', editable: false, styleName: 'center-column', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('공사시작') } },
    { fieldName: 'COMPLETE_DT', width: '120', editable: false, styleName: 'center-column', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('공사완료') } },
    { fieldName: 'CHK_DT', width: '120', editable: false, styleName: 'center-column', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('변경확인') } },
    { fieldName: 'LAST_CHG_GRADE', width: '120', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('변경\n등급') } },
    { fieldName: 'PROCESS_TARGET', width: '150', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('공정') } },
    { fieldName: 'PROCESS', width: '150', editable: false, styleName: 'center-column', dataType: 'text', header: { text: t('설비명') }, lookupDisplay: true},
    { fieldName: 'CHG_ITEM', width: '200', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('내용(검토구간)') } },

    {
      fieldName: 'CHECK1', width: '150', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('(PFD,P&ID,Plot Plan)') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK2', width: '120', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('기기목록 및 사양') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK3', width: '120', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('MSDS/물질목록') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK4', width: '120', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('폭발위험장소 선정') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK5', width: '100', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('가스감지기') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK6', width: '100', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('소방시설') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK7', width: '60', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('공정') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK8', width: '60', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('작업') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK9', width: '80', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('가동전\n점검') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK10', width: '80', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('안전운전\n절차개정') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    {
      fieldName: 'CHECK11', width: '60', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('변경\n교육') },
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N"
      },
    },
    { fieldName: 'PRO_EMP_NM', width: '100', editable: false, styleName: 'center-column', dataType: 'text', header: { text: t('담당자\n확인') } },
    { fieldName: 'REMARK', width: '200', editable: true, styleName: 'editable_column center-column', dataType: 'text', header: { text: t('비고') } },
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, visible: false, },
    { fieldName: 'CHG_NO', dataType: 'text', header: { text: t('접수번호') }, visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false, },
  ],
  columns: [],
  columnLayout: [
    'CHG_NM',
    {
      name: '변경 일정',
      direction: 'horizontal',
      items: [
        'PRO_DT',
        {
          name: '변경관리위원회',
          direction: 'horizontal',
          items: ['CONFIRM_DT'],
          header: { text: t('변경관리위원회') }
        },
        {
          name: '변경시작',
          direction: 'horizontal',
          items: ['EFFECT_DT'],
          header: { text: t('변경시작') }
        },
        {
          name: '변경완료',
          direction: 'horizontal',
          items: ['COMPLETE_DT'],
          header: { text: t('변경완료') }
        },
        'CHK_DT'
      ],
      header: { text: t('변경 일정') }
    },
    'LAST_CHG_GRADE',
    'PROCESS_TARGET',
    {
      name:'검토항목',
      direction: 'horizontal',
      items: ['PROCESS', 'CHG_ITEM'],
      header: {text : t('검토항목')}
    },
    {
      name: '변경관리 검토 자료',
      direction: 'horizontal',
      items: [
        {
          name: '도면관리',
          direction: 'horizontal',
          items: ['CHECK1'],
          header: { text: t('도면관리') }
        },
        {
          name: '설비,장치,동력',
          direction: 'horizontal',
          items: ['CHECK2'],
          header: { text: t('설비,장치,동력') }
        },
        {
          name: '유해화학물질',
          direction: 'horizontal',
          items: ['CHECK3'],
          header: { text: t('유해화학물질') }
        },
        {
          name: '설비적 변경 사항',
          direction: 'horizontal',
          items: ['CHECK4','CHECK5','CHECK6'],
          header: { text: t('설비적 변경 사항') }
        },
        {
          name: '위험성평가',
          direction: 'horizontal',
          items: ['CHECK7','CHECK8'],
          header: { text: t('위험성평가') }
        },
      ],
      header: { text: t('변경관리 검토 자료') }
    },
    'CHECK9',
    'CHECK10',
    'CHECK11',
    'PRO_EMP_NM',
    'REMARK'
  ],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  defaultDate()
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnNew') {
    if (searchParams.BSNS_CD == '' || searchParams.DEPT_CD == '' || searchParams.PROCESS == '') {
      Message.warn('사업부, 부서, 공정설비를 선택해주세요.');
    } else {
      sppfj0010Popup.value.openPopup(searchParams)
    }
  } else if (btn.id === 'btnUpdate') { 
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
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
  // 접수번호 한글로 바꾸려고 추가함
  let rows = res.ORESULT_CUR.map(row => {
    const chgNo = row.CHG_NO;
    if (chgNo) {
      const prefix = chgNo.split('_')[0];
      const matched = codeList.DEPT_CD.find(x => x.DEPT_CD === prefix);
      if (matched) {
        row.CHG_NM = `${matched.ASGN_SHRT_NM}_${chgNo.split('_')[1]}`;
      }
    }
    return row;
  });

  grdMain.value.getDataProvider().setRows(rows);

  if (sessionProcess) {

    const gridView = grdMain.value.getGridView();
    const rowCount = grdMain.value.getDataProvider().getRowCount();

    for (let i = 0; i < rowCount; i++) {

      const rowData = grdMain.value.getDataProvider().getJsonRow(i);

      if (rowData.PROCESS === sessionProcess) {
        gridView.setCurrent({ dataRow: i });
        gridView.setFocus(true);

        onCellClicked(gridView, {
          dataRow: i,
          column: 'PROCESS', // 또는 클릭으로 가정할 컬럼명
          itemIndex: gridView.getCurrent().itemIndex
        }, 'grdMain');
        
        // sessionStorage 값 삭제 (한번만 실행되도록)
        window.sessionStorage.removeItem('PROCESS');

        break;  
      }
    }
  }
}

//  조회
const searchData = () => {
  console.log(searchParams)
  return commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_07', param: searchParams })
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  console.log("saveParams", saveParams)
  return commonExecuteApi({ queryId: 'SPPFJ0010_SAVE_10', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

//사업부변경 감지
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    const param = {CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue,}
    if(newValue !== '') {
      Promise.all([ 
        commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_09', param: param }),
        commonSearchApi({ queryId: 'SPPFJ0010_SEARCH_10', param: param })
      ]).then((res) => {
        searchParams.DEPT_CD = ''
        searchParams.PROCESS = ''
        codeList.DEPT_CD = res[0].ORESULT_CUR
        codeList.PROCESS = []
        // codeList.process = res[1].ORESULT_CUR
        codeList.DEPT_CD.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
        codeList.PROCESS.unshift({ PROCESS_NM: '전체', PROCESS: '' })
      })
    }else {
      searchParams.DEPT_CD = ''
      searchParams.PROCESS = ''
      codeList.DEPT_CD = []
      codeList.PROCESS = []
      codeList.DEPT_CD.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
      codeList.PROCESS.unshift({ PROCESS_NM: '전체', PROCESS: '' }) 
    }
  }
)

// 부서변경 감지
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    if(newValue !== '') {
      commonSearchApi({ 
        queryId: 'SPPFJ0010_SEARCH_10', 
        param: { 
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: newValue
        } 
      }).then((res) => {
        searchParams.PROCESS = ''
        codeList.PROCESS = res.ORESULT_CUR
        codeList.PROCESS.unshift({ PROCESS_NM: '전체', PROCESS: '' })
      })
    }else {
      searchParams.PROCESS = ''
      codeList.PROCESS = []
      codeList.PROCESS.unshift({ PROCESS_NM: '전체', PROCESS: '' })
    }
  }
)

//로우 더블클릭시 상세정보 팝업 출력
const onCellDblClicked = (grid, clickData) => {
  const targetCols = [ 'CHG_NM', 'PRO_DT', 'CONFIRM_DT', 'EFFECT_DT', 'COMPLETE_DT', 'CHK_DT', 'PROCESS', 'PRO_EMP_NM' ]

  if (targetCols.includes(clickData.fieldName)) {
    let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    sppfj0010Popup.value.openPopup(data)
  }
}

//로우클릭시 해당로우 정보 get
const onCellClicked = (grid, clickData) => {
  let rowData = grdMain.value.getFocusedRowData()
  selectedData.value = rowData
}

//팝업 닫혔을때 조회
const closedPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="false"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnNew', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <i-select
              label-width="40px"
              width="240px"
              :label="$t('사업부')"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
            />
            <i-select
              label-width="30px"
              width="240px"
              :label="$t('부서')"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-title="ASGN_SHRT_NM"
              item-value="DEPT_CD"
              :readonly="isEmpty(searchParams.BSNS_CD)"
            />
            <i-select
              label-width="50px"
              width="240px"
              :label="$t('공정설비')"
              v-model="searchParams.PROCESS"
              :items="codeList.PROCESS"
              item-title="PROCESS_NM"
              item-value="PROCESS"
            />
            <i-input
              label-width="30px"
              :label="$t('기간')"
              type="date"
              width="188px"
              v-model="searchParams.FROM"
            />
            ~
            <i-input width="150px" type="date" class="ml-4" v-model="searchParams.TO" />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-1"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="onActEmpSelected"></EmpPopup>
  <SPPFJ0010Popup ref="sppfj0010Popup" @upData="upData" />
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
