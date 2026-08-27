<!-- SPPFK0010 자체감사 현황 -->
<!-- SI2팀 손상규 2025-06-16 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IGridTitle from '@/components/IGridTitle.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)
const selectedRow = ref(null)

const fileUploadPopup = ref(null) //파일업로드 팝업
const fileTitle = ref('')

// 조회조건
const searchParams = reactive({
  YEAR_FROM: Number(dayjs().get('year')) - 5,
  YEAR_TO: dayjs().get('year'),
})

const codeList = reactive({

})

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
})

const initCodeList = () => {

}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields: [ 
    { fieldName: 'YEAR', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('년도') }, editable: false },
    {
      fieldName: 'ST_DT', width: '150', styleName: 'editable_column center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('실시 일자') },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      }
    },
    {
      fieldName: 'RESULT_RPT', width: '150', styleName: 'center-column', dataType: 'text', header: { text: t('결과 보고서') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'RESULT_COUNT');
          const SAVE_YN = grid.getValue(cell.index.itemIndex, 'SAVE_YN');
          if (SAVE_YN == 'N') {
            return `<div style="display: flex; align-items: center; padding: 0 5px;"><span style="font-color: red;">${''}</span></div>`;
          } else {
            const a = '등록'
            const b = '미등록'
            if (value > 0) {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <span style="color: green; font-weight: bold;">${a}</span> 
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >첨부</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 4px 8px;">
                  <span style="color: red; font-weight: bold;">${b}</span> 
                  <button 
                    class="v-btn" 
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >첨부</button>
                </div>
              `;
            }
          }
        }
      }
    },
    { fieldName: 'COMP_COUNT', width: '200', styleName: 'center-column', dataType: 'text', header: { text: t('조치잔여/전체건수') }, editable: false },
    { fieldName: 'COMPLETE', width: '100', styleName: 'center-column', dataType: 'text', header: { text: t('완료여부') }, editable: false },
    { fieldName: 'COMPLETE_DT', width: '150', styleName: 'center-column', dataType: 'text', datetimeFormat: 'yyyy-MM-dd', header: { text: t('완료일자') }, editable: false },
    { fieldName: 'REMARK', width: '500', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('비고') }, editable: true },
    { fieldName: 'SAVE_YN', width: '500', dataType: 'text', header: { text: t('저장플래그') }, visible: false },
    { fieldName: 'RESULT_COUNT', dataType: 'number', visible: false },
  ],
  columns: [],
  columnLayout: [
    'YEAR',
    'ST_DT',
    'RESULT_RPT',
    {
      name:'시정조치 현황',
      direction: 'horizontal',
      items: ['COMP_COUNT', 'COMPLETE', 'COMPLETE_DT'],
      header: {text : t('시정조치 현황')}
    },
    'REMARK'
  ],
})

grd1Props.columns = grd1Props.fields

// 파일첨부 팝업
const onCellItemClicked = (grid, index, col) => {
  const data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if (col.column === 'RESULT_RPT') {
    if (col.target.className === 'v-btn') {
      fileTitle.value = '결과 보고서 파일첨부'
      selectedRow.value = index.dataRow
      fileUploadPopup.value.openPopup(data.RESULT_RPT)
    }
  } 
}

const uploaded = (val) => { 
  let saveParams = []
  
  if(val.fileId == null) return
  
  const data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // DB에 파일정보 저장
  let param = {
    YEAR: data.YEAR,
    RESULT_RPT: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'SPPFK0010_SAVE_05', list: saveParams }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
}

//팝업 닫혔을때 조회
const filePopupClosed = () => {
  onButtonsClick({ id : 'btnSearch' })
}

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
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
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'SPPFK0010_SEARCH_02', param: searchParams })
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
    if (isEmpty(data.ST_DT)) {
      return Message.warn(t('실시 일자는 필수 입력입니다.'))
    }
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
  return commonExecuteApi({ queryId : 'SPPFK0010_SAVE_04', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex"> 
            <i-input
              v-model="searchParams.YEAR_FROM"
              :label="$t('년도')"
              label-width="30px"
              type="Number"
              width="130px"
            />
            <i-input
              v-model="searchParams.YEAR_TO"
              :label="$t('~')"
              label-width="20px"
              type="Number"
              width="120px"
            />
          </div>
        </v-sheet>
        <RealGrid
          ref="grdMain"
          :grid-view-option="grd1Props.gridViewOption"
          :keys="grd1Props.keys" 
          :fields="grd1Props.fields"
          :columns="grd1Props.columns"
          :column-layout="grd1Props.columnLayout"
          @onCellItemClicked="onCellItemClicked"
        />
      </div>
    </v-card-text>
  </v-card>
  <IUploadPopup ref="fileUploadPopup" :gridTitle="fileTitle" @uploaded="uploaded" @closed="filePopupClosed"/>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 280px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

</style>