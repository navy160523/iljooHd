<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import HLTJC0010Popup01 from '@/pages/100_health/HLT_J/HLTJC0010Popup01.vue'
import HLTJC0010PopupAll from '@/pages/100_health/HLT_J/HLTJC0010PopupAll.vue'

defineOptions({
  name:'100_health-HLT_J-HLTJC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)
const hltjc0010Popup01 = ref(null)
// 사후관리, 보청기, 부가급여 공통팝업
const hltjc0010PopupAll = ref(null)

// 조회조건
const searchParams = reactive({
  BSNS_CD: '',    //사업부
  DEPT_CD: '',    //부서
  FST_YEAR: dayjs().get('year'),    //판정 첫
  SCD_YEAR: dayjs().get('year'),    //판정 두
})

// 코드리스트
const codeList = reactive({
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴사' },
    { COD: '4', TXT: '군입영' },
  ]
})

/*  공통코드 세팅 */
onMounted(() => {
  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 1,
    })
  })  
  grdMain.value.getGridView().filterPanel.visible = true
  
  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= '1970'; i--) {
    codeList.YEAR.push({ COD: i, TXT: i })
  }

  initCodeList()  
})

const initCodeList = () => {
  Promise.all([
    // 사업부
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    // 부서
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    }),
    // 판정구분
    getCodeList('HHII820J'),
    // 상병명
    commonSearchApi({ queryId : 'HLTJB0010_SEARCH_DISEASE', param: searchParams}),
  ]).then((res) => {  
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.evalDiv = res[2].ORESULT_CUR
    codeList.disease = res[3].ORESULT_CUR

    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    grdMain.value.setBindingColumn('EVAL_DIV', codeList.evalDiv, 'COD', 'TXT')
    grdMain.value.setBindingColumn('DISEASE_CODE', codeList.disease, 'COD', 'TXT')
    grdMain.value.setBindingColumn('HLD_OFFI_GBN', codeList.HLD_OFFI_GBN, 'COD', 'TXT')
  })

  //사업부 변경시 부서 조회
  watch(
    () => searchParams.BSNS_CD,
    (newValue) => {
      commonSearchApi({
        queryId: 'searchDept3',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: newValue,
          USE_DIV: 'Y'
        }
      }).then((res) => {
        searchParams.DEPT_CD = ''
        codeList.deptCd = res.ORESULT_CUR
        codeList.deptCd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      })
    }
  )
}

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const formatDateToYYYYMMDD = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true }, header: { height: 75 } },
  keys: [],
  fields: [
    { fieldName: 'EMP_NO', width: '80', editable: false, dataType: 'text', header: { text: t('사번') }, mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'BSNS_NM', width: '100', editable: false, dataType: 'text', header: { text: t('사업부') }, mergeRule: { criteria: 'values["EMP_NO"] + value' }, lookupDisplay: true },
    { fieldName: 'DEPT_NM', width: '120', editable: false, dataType: 'text', header: { text: t('부서') }, mergeRule: { criteria: 'values["EMP_NO"] + value' }, lookupDisplay: true },
    { fieldName: 'KOR_NM', width: '80', editable: false, dataType: 'text', header: { text: t('성명') }, mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'BIRTH_DAY', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('생년월일') }, mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'HLD_OFFI_GBN', width: '80', editable: false, dataType: 'text', header: { text: t('재직구분') }, mergeRule: { criteria: 'values["EMP_NO"] + value' }, lookupDisplay: true },
    { fieldName: 'STD_DUTY_NM', width: '80', editable: false, dataType: 'text', header: { text: t('직종') }, mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'COM_ENT_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('입사일') }, mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'RETI_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('휴•퇴직일') }, mergeRule: { criteria: 'values["EMP_NO"] + value' } },
    { fieldName: 'DISEASE_CODE', width: '120', editable: false, dataType: 'text', styleName: 'center-column', header: { text: t('상병명') }, lookupDisplay: true },
    { fieldName: 'HOSPITAL_NM', width: '150', editable: false, dataType: 'text', styleName: 'center-column', header: { text: t('진단기관') }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'EVAL_YEAR', width: '100', editable: false, dataType: 'text', header: { text: t('판정년도'), styleName: 'center-column' }, mergeRule: { criteria: 'values["EMP_NO"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'EVAL_DATE', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('판정일'), styleName: 'center-column' }, mergeRule: { criteria: 'values["EMP_NO"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'EVAL_DIV', width: '100', editable: false, dataType: 'text', header: { text: t('판정구분'), styleName: 'center-column' }, lookupDisplay: true, mergeRule: { criteria: 'values["EMP_NO"] + values["HOSPITAL_CODE"] + values["HOSPITAL_NM"] + value' } },
    { fieldName: 'OFF_NUM', width: '100', editable: false, dataType: 'text', header: { text: t('공문번호'), styleName: 'center-column' } },
    { fieldName: 'SENT_DT', width: '100', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('발신일'), styleName: 'center-column' } },
    { fieldName: 'LABOR_DT', width: '120', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('노동부보고일'), styleName: 'center-column' } },
    { fieldName: 'FINAL_RST', width: '200', editable: false, dataType: 'text', header: { text: t('최종결과'), styleName: 'center-column' } },
    {
      fieldName: 'FINAL_DT', width: '150', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('최종일자'), styleName: 'center-column' },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FINAL_DT');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          const formattedDate = formatDate(value);

          if (rowState) {
            if (value) {
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span>${formattedDate}</span>
                    <i class="mdi mdi-magnify finalDt-search-icon" data-index="${cell.index.itemIndex}" style="cursor: pointer;"></i>
                  </div>
                  <button 
                    class="v-btn finalDt-add-button" 
                    data-index="${cell.index.itemIndex}"
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >추가</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: flex-end; padding: 0 5px;">
                  <button 
                    class="v-btn finalDt-add-button" 
                    data-index="${cell.index.itemIndex}"
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >추가</button>
                </div>
              `;
            }
          }
        }
      }
    },
    { fieldName: 'HAID_CNT', width: '100', editable: false, dataType: 'text', header: { text: t('지급횟수'), styleName: 'center-column' } },
    {
      fieldName: 'RCT_HAID_DT', width: '150', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('최근지급일'), styleName: 'center-column' },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'RCT_HAID_DT');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          const formattedDate = formatDate(value);

          if (rowState) {
            if (value) {
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span>${formattedDate}</span>
                    <i class="mdi mdi-magnify rctHaidDt-search-icon" data-index="${cell.index.itemIndex}" style="cursor: pointer;"></i>
                  </div>
                  <button 
                    class="v-btn rctHaidDt-add-button" 
                    data-index="${cell.index.itemIndex}"
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >추가</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: flex-end; padding: 0 5px;">
                  <button 
                    class="v-btn rctHaidDt-add-button" 
                    data-index="${cell.index.itemIndex}"
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >추가</button>
                </div>
              `;
            }
          }
        }
      }
    },
    {
      fieldName: 'RCT_ADDBNF_DT', width: '150', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('최근지급일'), styleName: 'center-column' },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'RCT_ADDBNF_DT');
          const rowState = grid.getDataSource().getRowState(cell.index.itemIndex);
          const formattedDate = formatDate(value);

          if (rowState) {
            if (value) {
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span>${formattedDate}</span>
                    <i class="mdi mdi-magnify rctAddbnfDt-search-icon" data-index="${cell.index.itemIndex}" style="cursor: pointer;"></i>
                  </div>
                  <button 
                    class="v-btn rctAddbnfDt-add-button" 
                    data-index="${cell.index.itemIndex}"
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >추가</button>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; justify-content: flex-end; padding: 0 5px;">
                  <button 
                    class="v-btn rctAddbnfDt-add-button" 
                    data-index="${cell.index.itemIndex}"
                    style="color: #fff; background: #1a40c7; padding: 4px;"
                  >추가</button>
                </div>
              `;
            }
          }
        }
      }
    },
    { fieldName: 'RCT_ADDBNF', width: '100', editable: false, dataType: 'number', header: { text: t('최근지급액'), styleName: 'center-column' }, numberFormat: '#,##0' },
    { fieldName: 'CMT_ADDBNF', width: '100', editable: false, dataType: 'number', header: { text: t('누적지급액'), styleName: 'center-column' }, numberFormat: '#,##0'},
    { fieldName: 'REMARK', width: '300', editable: false, dataType: 'text', header: { text: t('비고'), styleName: 'center-column' } },

    //안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, visible: false, },
    { fieldName: 'HOSPITAL_CODE', dataType: 'text', header: { text: t('진단기관') }, visible: false, },
    { fieldName: 'AFTER_CNT', dataType: 'text', header: { text: t('사후 차수 카운트') },visible: false, },
    { fieldName: 'ADBNF_CNT', dataType: 'text', header: { text: t('부가급여 차수 카운트') },visible: false, }
  ],
  columnLayout: [
    {
      name: '대상자 정보',
      direction: 'horizontal',
      items: [ 'EMP_NO', 'BSNS_NM', 'DEPT_NM', 'KOR_NM', 'BIRTH_DAY', 'HLD_OFFI_GBN', 'STD_DUTY_NM', 'COM_ENT_DATE', 'RETI_DATE'],
      header: { text: t('대상자 정보') },
    },
    {
      name: '진단 정보',
      direction: 'horizontal',
      items: [ 'DISEASE_CODE', 'HOSPITAL_NM', 'EVAL_YEAR', 'EVAL_DATE', 'EVAL_DIV' ],
      header: { text: t('진단 정보') },
    },
    {
      name: '사후 관리',
      direction: 'horizontal',
      items: [ 'OFF_NUM', 'SENT_DT', 'LABOR_DT', 'FINAL_RST', 'FINAL_DT' ],
      header: { text: t('사후 관리') },
    },
    {
      name: '보상',
      direction: 'horizontal',
      items: [
        {
          name: '보청기',
          direction: 'horizontal',
          items: [  'HAID_CNT', 'RCT_HAID_DT'  ],
          header: { text: t('보청기')}
        },
        {
          name: '부가급여',
          direction: 'horizontal',
          items: [  'RCT_ADDBNF_DT', 'RCT_ADDBNF', 'CMT_ADDBNF'  ],
          header: { text: t('부가급여')}
        }
      ],
      header: { text: t('보상') }
    },
    'REMARK'
  ],
  columns: [],
}) 

grd1Props.columns = grd1Props.fields

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    hltjc0010Popup01.value.openPopup(null)
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('해당인원의 진당정보 및 사후관리, 보상 이력이 모두 삭제됩니다.\n 삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}
//그리드 버튼
// 그리드 안에 버튼 이벤트
const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)

  // 최종일자
  if (col.column === 'FINAL_DT') {    
    // 추가버튼
    if (col.target.className.includes('finalDt-add-button')) {
      hltjc0010PopupAll.value.openPopup({
        formType: 'aftercare',
        mode: 'edit',
        formData: data
      })
    }
    // 돋보기
    if (col.target.className.includes('finalDt-search-icon')) {
      hltjc0010PopupAll.value.openPopup({
        formType: 'aftercare',
        mode: 'read',
        formData: data
      })
    }
  }
  

  // 보청기 최근지급일
  if (col.column === 'RCT_HAID_DT') {
    // 돋보기
    if (col.target.className.includes('rctHaidDt-search-icon')) {
      hltjc0010PopupAll.value.openPopup({
        formType: 'haid',
        mode: 'read',
        formData: data
      })
    }
    // 추가버튼
    if (col.target.className.includes('rctHaidDt-add-button')) {
      hltjc0010PopupAll.value.openPopup({
        formType: 'haid',
        mode: 'edit',
        formData: data
      })
    }
  }
  // 부가급여 최근지급일
  if (col.column === 'RCT_ADDBNF_DT') {
    // 돋보기
    if (col.target.className.includes('rctAddbnfDt-search-icon')) {
      hltjc0010PopupAll.value.openPopup({
        formType: 'addbnf',
        mode: 'read',
        formData: data
      })
    }
    //추가버튼
    if (col.target.className.includes('rctAddbnfDt-add-button')) {
      hltjc0010PopupAll.value.openPopup({
        formType: 'addbnf',
        mode: 'edit',
        formData: data
      })
    }
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
  const rows = res.ORESULT_CUR.map(row => {
    if (row.EVAL_DATE && typeof row.EVAL_DATE === 'string' && row.EVAL_DATE.length === 8) {
      row.EVAL_DATE = `${row.EVAL_DATE.slice(0, 4)}-${row.EVAL_DATE.slice(4, 6)}-${row.EVAL_DATE.slice(6, 8)}`;
    }
    if (row.RCT_ADDBNF != null) {
      row.RCT_ADDBNF = parseInt(row.RCT_ADDBNF, 10);
    }
    if (row.CMT_ADDBNF != null) {
      row.CMT_ADDBNF = parseInt(row.CMT_ADDBNF, 10);
    }
    return row;
  });
  grdMain.value.getDataProvider().setRows(rows);
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTJC0010_SEARCH_01', param: searchParams })
}

const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (data.EVAL_DATE instanceof Date || typeof data.EVAL_DATE === 'string') {
      data.EVAL_DATE = formatDateToYYYYMMDD(data.EVAL_DATE);
    }

    saveParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'HLTJC0010_DELETE_01', list: saveParams })
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
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              v-model="searchParams.FST_YEAR"
              :label="$t('판정년도')"
              label-width="50px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT" 
              width="160px"
            />
            <i-select
              v-model="searchParams.SCD_YEAR"
              :label="$t('~')"
              label-width="10px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT" 
              width="120px"
            />

            <i-select
              :label="$t('사업부')"
              width="250px"
              margin="10px"
              placeholder="사업부"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />

            <i-select
              :label="$t('부서')"
              width="250px"
              margin="10px"
              placeholder="부서"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              :readonly="isEmpty(searchParams.BSNS_CD)"
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
            :column-layout="grd1Props.columnLayout"
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <HLTJC0010Popup01 ref="hltjc0010Popup01" @after-search="getData" />
    <HLTJC0010PopupAll ref="hltjc0010PopupAll" @update="getData"/>
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