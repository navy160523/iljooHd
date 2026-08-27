<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const grdSub2 = ref(null)

const dialog = ref(false)

//조회조건
let searchParams = reactive({    
  CMPNY_DIV: 'HHI',                 // 회사
  BSNS_CD: '',                      // 사업부
  ASGN_CD: '',                      // 조직
  PART_CD: '',                      // 부문
  DAMD_CD: '',                      // 담당
  DEPT_CD: '',                      // 부서
  DEPT_TYPE: '',                    // 직영, 협력사 구분
  PROD_DIV: '',                     // 생산/비생산
  YEAR: dayjs().year() + '',        // 기준년도
  HALF: '1',                        // 반기 구분
})

const codeList = reactive({
  companyList: [
    { COD: 'HHI' , TXT: 'HD현대중공업' },
    { COD: '230' , TXT: 'HD현대중공업MOS' },
  ],
  bsnsList: [],
  sectorList: [],
  partList: [],
  deptList: [],
  /* 직영/협력사 구분 */
  typeList: [
    { COD: '' , TXT: '전체' },
    { COD: '0' , TXT: '직영' },
    { COD: '1' , TXT: '협력사' },
  ],
  /* 생산/비생산 */
  PROD_DIVList: [
    { COD: '' , TXT: '전체' },
    { COD: 'P' , TXT: '생산' },
    { COD: 'N' , TXT: '비생산' },
    { COD: 'S' , TXT: '지원' },
  ],
  /* 반기 */
  harfList: [
    { COD: '1' , TXT: '상반기' },
    { COD: '2' , TXT: '하반기 '},
  ]
})

/* ******************* 위험성평가모니터링 메인 그리드 ******************* */
const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    header: { height: 70 },
    edit: { editable: false },
  },
  keys: [],
  fields: [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부'), }, mergeRule: { criteria: "values['BSNS_CD']" }, width: '140', },
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문'), }, mergeRule: { criteria: "values['BSNS_CD'] + values['PART_CD']" }, width: '140', },
    { fieldName: 'DAMD_NM', dataType: 'text', header: { text: t('담당'), }, mergeRule: { criteria: "values['BSNS_CD'] + values['PART_CD'] + values['DAMD_CD']" }, width: '150', },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), }, width: '170', },
    { fieldName: 'STAT_WORK_TOTAL_COUNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('전체'), }, width: '90', styleName: 'right-column', },
    { fieldName: 'STAT_RISK_PROGRESS_COUNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('실시'), }, width: '90', styleName: 'right-column', },
    { fieldName: 'STAT_RISK_RATE', dataType: 'number', numberFormat: '#,##0', header: { text: t('실시율(%)'), }, width: '90', styleName: 'right-column', },
    { fieldName: 'STAT_OVER_IMPOSSIBLE_COUNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('전체'), }, width: '90', styleName: 'right-column', },
    { fieldName: 'STAT_SRSRM_COMPLETE_COUNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('결재완료'), }, width: '90', styleName: 'right-column', },
    { fieldName: 'STAT_SRSRM_RATE', dataType: 'number', numberFormat: '#,##0', header: { text: t('개선율(%)'), }, width: '90', styleName: 'right-column', },
    { fieldName: 'APPR_STATUS', dataType: 'text', header: { text: t('위험성평가\n위원회\n실시 여부'), styleName: 'multiline-editor' }, width: '100', },

    { fieldName: 'GRP_ID', dataType: 'text', header: { text: t('그룹ID'), }, visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드'), }, visible: false, },
    { fieldName: 'PART_CD', dataType: 'text', header: { text: t('부문코드'), }, visible: false, },
    { fieldName: 'DAMD_CD', dataType: 'text', header: { text: t('담당코드'), }, visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드'), }, visible: false, },
  ],
  columns: [],
  columnLayout: [
    'BSNS_NM', 'PART_NM', 'DAMD_NM', 'DEPT_NM',
    {
      name: '작업표준',
      direction: 'horizontal',
      items: [
        'STAT_WORK_TOTAL_COUNT', 
        'STAT_RISK_PROGRESS_COUNT',
        'STAT_RISK_RATE',
      ],
      header: { text: t('작업표준') },
    },
    {
      name: '중요위험 특별감소대책',
      direction: 'horizontal',
      items: [
        'STAT_OVER_IMPOSSIBLE_COUNT', 
        'STAT_SRSRM_COMPLETE_COUNT',
        'STAT_SRSRM_RATE',
      ],
      header: { text: t('중요위험 특별감소대책') },
    },
    'APPR_STATUS'
  ]
})
grdMainProps.columns = grdMainProps.fields

/* ******************* 작업표준리스트 그리드(숨김) ******************* */
const grdSubProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable:false },
  },
  keys: [],
  fields: [ 
    { fieldName: 'COMP_NM', dataType: 'text', header: { text: t('회사'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150', styleName: 'left-column'}, 
    { fieldName: 'GUBUN_NM', dataType: 'text', header: { text: t('분류'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '200', styleName: 'left-column'},
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', header: { text: t('작업표준명'), exportStyleName: 'export_header_style' }, width: '300', exportStyleName: 'export_style', styleName: 'left-column'},
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'CORP_NM', dataType: 'text', header: { text: t('조직명'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'USR_NM', dataType: 'text', header: { text: t('작성자'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'C_DATE', dataType: 'text', header: { text: t('재정일자'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'U_DATE', dataType: 'text', header: { text: t('개정일자'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'RISK_TYPE', dataType: 'text', header: { text: t('평가유형'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'ACT_COUNT', dataType: 'text', header: { text: t('작업행동개수'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'RISK_COUNT', dataType: 'text', header: { text: t('위험요인'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'RISK_IMPOSSIBLE_COUNT', dataType: 'text', header: { text: t('허용불가능 위험요인'), exportStyleName: 'export_header_style' }, width: '150', exportStyleName: 'export_style'},
    { fieldName: 'RISK_AVG_SUM', dataType: 'text', header: { text: t('평균위험성 점수'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'IMG_COUNT', dataType: 'text', header: { text: t('사진등록'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', header: { text: t('문서번호'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', styleName: 'left-column'},
  
  ],
  columns : []
})

grdSubProps.columns = grdSubProps.fields

/* ******************* 특별감소대책(숨김) ******************* */
const grdSub2Props = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable:false },
  },
  keys: [],
  fields: [ 
    { fieldName: 'COMP_NM', dataType: 'text', header: { text: t('회사'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150', styleName: 'left-column'}, 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'CORP_NM', dataType: 'text', header: { text: t('조직명'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', header: { text: t('문서번호'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', styleName: 'left-column'},
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', header: { text: t('작업표준명'), exportStyleName: 'export_header_style' }, width: '300', exportStyleName: 'export_style', styleName: 'left-column'},
    { fieldName: 'GUBUN_NM', dataType: 'text', header: { text: t('작업행동'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '300', styleName: 'left-column'},
    { fieldName: 'RISK_COUNT', dataType: 'text', header: { text: t('위험요인'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'USR_NM', dataType: 'text', header: { text: t('개선전위험성'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style', width: '150'},
    { fieldName: 'C_DATE', dataType: 'text', header: { text: t('위험감소대책'), exportStyleName: 'export_header_style' }, width: '300', exportStyleName: 'export_style'},
    { fieldName: 'U_DATE', dataType: 'text', header: { text: t('개선완료일'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'RISK_TYPE', dataType: 'text', header: { text: t('개선후위험성'), exportStyleName: 'export_header_style' }, exportStyleName: 'export_style'},
    { fieldName: 'ACT_COUNT', dataType: 'text', header: { text: t('조치결과'), exportStyleName: 'export_header_style' }, width: '350', exportStyleName: 'export_style'},
    { fieldName: 'RISK_IMPOSSIBLE_COUNT', dataType: 'text', header: { text: t('담당자'), exportStyleName: 'export_header_style' }, width: '150', exportStyleName: 'export_style'}
  
  ],
  columns : []
})
grdSub2Props.columns = grdSub2Props.fields

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnWorkStandard') {
    workStandard()
  }else if(btn.id === 'btnMeasures') {
    measures()
  }else if(btn.id === 'btnClose') {
    onClose()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'MNGBA0010_SEARCH_POPUP02', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* *********************** 작업표준리스트 *********************** */
const workStandard = () => {
  commonSearchApi({ queryId : 'RSKAB0010_SEARCH_02', param: searchParams }).then( res => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)

    grdSub.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '작업표준리스트_' + dayjs().format('YYYY-MM-DD') + '.xlsx', // 저장될 파일 name
      documentTitle: { 
        //제목
        message: "작업표준/ 위험성 평가 리스트 - 결재완료",
        visible: true,
        spaceTop: 1,
        spaceBottom: 0,
        height: 50,
        styleName: "excelTitle",
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: true, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })
  })
}

/* *********************** 특별감소대책 엑셀 다운로드 *********************** */
const measures = () => {
  commonSearchApi({ queryId : 'RSKAB0010_SEARCH_03', param: searchParams }).then( res => {
    grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)

    grdSub2.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '특별감소대책_' + dayjs().format('YYYY-MM-DD') + '.xlsx', // 저장될 파일 name
      documentTitle: { 
        //제목
        message: "중요위험 특별감소대책",
        visible: true,
        spaceTop: 1,
        spaceBottom: 0,
        height: 50,
        styleName: "excelTitle",
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: true, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })
  })
}

/* ******************* 안전사고 cell 클릭 ******************* */
const comboChange = gbn => {
  let param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    PART_CD: searchParams.PART_CD,
    DAMD_CD: searchParams.DAMD_CD,
    USE_DIV: 'Y'
  }
  if(gbn === 'company'){
    /* 사업부,부문,담당,부서 초기화 */
    searchParams.BSNS_CD = ''
    searchParams.PART_CD = ''
    searchParams.DAMD_CD = ''
    searchParams.DEPT_CD = ''
    Promise.all([commonSearchApi({ queryId : 'searchBSNS', param })]).then(res => {
      codeList.bsnsList = res[0].ORESULT_CUR
      codeList.bsnsList.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    })
  }else if(gbn === 'bsns'){
    /* 부문,담당,부서 초기화 */
    searchParams.PART_CD = ''
    searchParams.DAMD_CD = ''
    searchParams.DEPT_CD = ''
    Promise.all([commonSearchApi({ queryId : 'SECTOR_COMBO', param })]).then(res => {
      codeList.sectorList = res[0].ORESULT_CUR
      codeList.sectorList.unshift({ SECTOR_NM: '전체', SECTOR_CD: '' })
    })
  }else if(gbn === 'sector'){
    /* 담당,부서 초기화 */
    searchParams.DAMD_CD = ''
    searchParams.DEPT_CD = ''
    Promise.all([commonSearchApi({ queryId : 'PART_COMBO', param })]).then(res => {
      codeList.partList = res[0].ORESULT_CUR
      codeList.partList.unshift({ PART_NM: '전체', PART_CD: '' })
    })
  }else if(gbn === 'part'){
    /* 부서 초기화 */
    searchParams.DEPT_CD = ''
    Promise.all([commonSearchApi({ queryId : 'DEPT_COMBO', param })]).then(res => {
      codeList.deptList = res[0].ORESULT_CUR
      codeList.deptList.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
}

const initCodeList = () => {
  codeList.sectorList.unshift({ SECTOR_NM: '전체', SECTOR_CD: '' })
  codeList.partList.unshift({ PART_NM: '전체', PART_CD: '' })
  codeList.deptList.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
}

const openPopup = async data => {  
  await comboChange('company')
  await initCodeList()
  // await onButtonsClick({ id :'btnSearch' })
  //팝업 오픈
  dialog.value = true 
}

const setGrdMainStyle = () => {
  grdMain.value.getGridView().layoutByColumn('BSNS_NM').spanCallback =
    function (grid, layout, itemIndex) {
      var value = grid.getValue(itemIndex, 'GRP_ID')
      if (value != null) {
        if (value === '01111') {
          return 4
        }
      }
    }

  grdMain.value.getGridView().layoutByColumn('DAMD_NM').spanCallback =
    function (grid, layout, itemIndex) {
      var value = grid.getValue(itemIndex, 'GRP_ID')
      if (value != null) {
        if (value === '00011') {
          return 2
        }
      }
    }

  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    const ret = {}
    ret.style = { 'background-color': '' }
    
    const value = grid.getValue(dataCell.index.itemIndex, 'GRP_ID')

    if (value != null) {
      if (value === '01111') {
        ret.style = { 'background-color': '#eeffdd' }
      } else if (value === '00011') {
        if(dataCell.dataColumn.fieldName !== 'BSNS_NM'
           && dataCell.dataColumn.fieldName !== 'PART_NM') {
          ret.style = { 'background-color': '#eeeeee' }
        }
      } else if(value === '00001') {
        if(dataCell.dataColumn.fieldName !== 'BSNS_NM'
           && dataCell.dataColumn.fieldName !== 'PART_NM'
           && dataCell.dataColumn.fieldName !== 'DAMD_NM') {
          ret.style = { 'background-color': '#e0f0ff' }
        }
      }
    }

    return ret
  })
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

onMounted(() => {
  vm.$nextTick(() => {
    setGrdMainStyle()
  })
})

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1350"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{'위험성평가 모니터링 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="'위험성평가 모니터링'"
          :button-list="['btnSearch', 'btnWorkStandard' , 'btnMeasures', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select 
                :label="$t('회사')"
                labelWidth="55px"
                width="250px"
                :items="codeList.companyList"
                item-title="TXT"
                item-value="COD"
                v-model="searchParams.CMPNY_DIV"
                @update:modelValue="comboChange('company')"
              />
              <i-select 
                :label="$t('사업부')"
                labelWidth="45px"
                width="250px"
                :items="codeList.bsnsList"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                v-model="searchParams.BSNS_CD"
                @update:modelValue="comboChange('bsns')"
              />
              <i-select 
                :label="$t('부문')"
                labelWidth="30px"
                width="220px"
                :items="codeList.sectorList"
                item-title="SECTOR_NM"
                item-value="SECTOR_CD"
                v-model="searchParams.PART_CD"
                @update:modelValue="comboChange('sector')"
              />
              <i-select 
                :label="$t('담당')"
                labelWidth="30px"
                width="200px"
                :items="codeList.partList"
                item-title="PART_NM"
                item-value="PART_CD"
                v-model="searchParams.DAMD_CD"
                @update:modelValue="comboChange('part')"
              />
              <i-select 
                :label="$t('부서')"
                labelWidth="30px"
                width="180px"
                :items="codeList.deptList"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                v-model="searchParams.DEPT_CD"
              />
            </div>
            <div class="d-flex mt-1">
              <i-select 
                :label="$t('기준년도')"
                labelWidth="55px"
                width="250px"
                type="YEAR"
                v-model="searchParams.YEAR"
              />
              <i-select 
                :label="$t('반기')"
                labelWidth="45px"
                width="250px"
                :items="codeList.harfList"
                item-title="TXT"
                item-value="COD"
                v-model="searchParams.HALF"
              />
              <i-select 
                :label="$t('직영/협력사 구분')"
                labelWidth="100px"
                width="220px"
                :items="codeList.typeList"
                item-title="TXT"
                item-value="COD"
                v-model="searchParams.DEPT_TYPE"
              />
              <i-select 
                :label="$t('생산/비생산')"
                labelWidth="80px"
                width="200px"
                :items="codeList.PROD_DIVList"
                item-title="TXT"
                item-value="COD"
                v-model="searchParams.PROD_DIV"
              />
            </div>
          </v-sheet>
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
          <v-sheet class="pa-0 h-auto" v-show="false">
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys" 
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
          <v-sheet class="pa-0 h-auto" v-show="false">
            <RealGrid
              ref="grdSub2"
              :grid-view-option="grdSub2Props.gridViewOption"
              :keys="grdSub2Props.keys" 
              :fields="grdSub2Props.fields"
              :columns="grdSub2Props.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
