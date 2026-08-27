<!-- HLTLA0010 감염병 관리기준 -->
<!-- SI2팀 손상규 2025-03-27 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'100_health-HLT_L-HLTLA0010', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})

const codeList = reactive({
  gradeList: [
    {COD: 'A', TXT: '1급'},
    {COD: 'B', TXT: '2급'},
    {COD: 'C', TXT: '3급'},
    {COD: 'D', TXT: '4급'},
    {COD: 'E', TXT: '기타'},
  ],
})

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true

})

const customGridStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function(grid,dataCell) {
    let ret = {
      // style: {
      //   'background-color': undefined,
      // },
    }

    if (grid.getValue(dataCell.index.dataRow, 'INT_INFEC') == 'Y') {
      ret.style = { 'background-color': 'pink' }
    } else ret.style = { 'background-color': '' }
    return ret
  })
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHII840A1'),
    getCodeList('HHII840A2'),
    getCodeList('HHII840A3'),
    getCodeList('HHII840A4'),
    getCodeList('HHII840B'),
  ]).then((res) => {
    console.log(res[0].ORESULT_CUR);
    codeList.INFEC1 = res[0].ORESULT_CUR  
    codeList.INFEC2 = res[1].ORESULT_CUR  
    codeList.INFEC3 = res[2].ORESULT_CUR  
    codeList.INFEC4 = res[3].ORESULT_CUR  
    codeList.CONTACT = res[4].ORESULT_CUR

    codeList.allInfec = [
      ...codeList.INFEC1,
      ...codeList.INFEC2,
      ...codeList.INFEC3,
      ...codeList.INFEC4
    ];
    grdMain.value.setBindingColumn('INFEC_NM', codeList.allInfec, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CONTACT_CLS', codeList.CONTACT, 'COD', 'TXT')
    grdMain.value.setBindingColumn('GRADE', codeList.gradeList, 'COD', 'TXT')
  })
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields: [ 
    {
      fieldName: 'GRADE', width: '50', dataType: 'text', header: { text: t('급수'), styleName: 'header_validit' },
      styleName: 'editable_column', lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: true, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true }
    },
    {
      fieldName: 'INFEC_NM', width: '100', styleName: 'editable_column center-column', dataType: 'text', header: { text: t('명칭'), styleName: 'header_validit' }, lookupDisplay: true,
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 8, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      },
      styleCallback: function (grid, dataCell) {        
        const ret = {
          editable: true,
          styleName: "editable_column center-column",
          enabled: false,          
        }

        // 명칭도 빨간색으로 변경
        if (grid.getValue(dataCell.index.dataRow, 'INT_INFEC') == 'Y') {
          ret.style = { 'background-color': 'pink' }
        } else ret.style = { 'background-color': '' }

        const grade = grid.getValue(dataCell.index.itemIndex, "GRADE");
        const dropList = { COD: [], TXT: [] };

        // GRADE → INFEC 리스트 매핑
        const gradeToInfec = {
          A: "INFEC1",
          B: "INFEC2",
          C: "INFEC3",
          D: "INFEC4"
          // E(기타)는 제외
        };

        const infecKey = gradeToInfec[grade];
        if (infecKey) {
          for (let cd of (codeList[infecKey] || [])) {
            dropList.COD.push(cd.COD);
            dropList.TXT.push(cd.TXT);
          }
        }

        // 행별 드롭다운 에디터 설정
        ret.editor = {
          type: "dropdown",
          values: dropList.COD,
          labels: dropList.TXT,
          editable: ret.editable,
          styleName: "editable_column center-column",
          enabled: false
        };

        return ret;
      }
    },
    { fieldName: 'INFEC_INFO', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('정의') } },
    { fieldName: 'SUS_SYMP', width: '250', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('의심증상') } },
    {
      fieldName: 'CONTACT_CLS', width: '200', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('접촉자 분류'), styleName: 'header_validit' }, lookupDisplay: true,
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 4, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      },
    },
    { fieldName: 'MNG_STD', width: '200', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('관리기준') } },
    { fieldName: 'MNG_SEQ', width: '80', styleName: 'editable_column center-column', dataType: 'number', 'numberFormat': '0', header: { text: t('관리순번') }, editor: { type: 'number', showStepButton: true, direction: 'vertical', step: 1 } },
    {
      fieldName: 'INT_INFEC', width: '100', dataType: 'text', header: { text: t('관심 감염병') }, styleName: 'change_back_check',
      renderer: { type: "check", trueValues: 'Y', falseValues: 'N' },
    },
    // 안보이는거
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('시퀀스key') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      IDX_SEQ: '',
      GRADE: '',
      INFEC_NM: '',
      INFEC_INFO: '',
      SUS_SYMP: '',
      MNG_STD: '',
      MNG_SEQ: ' ',
      CONTACT_CLS: '',
      INT_INFEC: 'N',
      SAVE_YN: 'N',
    }, false)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
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
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  customGridStyle()
}

//  조회
const searchData = () => {
  console.log(searchParams)
  return commonSearchApi({ queryId: 'HLTLA0010_SEARCH_01', param: searchParams })
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

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (isEmpty(data.MNG_SEQ)) {
      return Message.warn(t('관리순번은 필수 입력입니다.'))
    } else if (isEmpty(data.GRADE)) { 
      return Message.warn(t('급수는 필수 입력입니다.'))
    } else if (isEmpty(data.INFEC_NM)) { 
      return Message.warn(t('명칭은 필수 입력입니다.'))
    } else if (isEmpty(data.CONTACT_CLS)) { 
      return Message.warn(t('접촉자 분류는 필수 입력입니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (data.INT_INFEC == 'true') {
      data.INT_INFEC = 'Y'
    } else if (data.INT_INFEC == 'false') { 
      data.INT_INFEC = 'N'
    }
    saveParams.push(data)
  }
  console.log(saveParams)
  return commonExecuteApi({ queryId : 'HLTLA0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  console.log(checkedRows)

  for (let rowIdx of checkedRows) {
    console.log(rowIdx)
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    console.log(data)
    if(data.SAVE_YN == 'N') {
      continue
    }
    saveParams.push(data) 
  }
  console.log(saveParams)
  return commonExecuteApi({ queryId : 'HLTLA0010_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
  initCodeList()
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="true"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onEditRowChanged="onEditRowChanged"
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