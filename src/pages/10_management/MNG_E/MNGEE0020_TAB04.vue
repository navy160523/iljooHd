<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import ImageViewerPopup from '@/components/popup/ImageViewerPopup.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const imageViewerPopup = ref(null)

const props = defineProps({
  searchParams: {
    Type : Object,
    default: {},
  },
}) 

const codeList = reactive({
  COMP_YN : [
    {label : '조치완료', value: 'Y'},
    {label : '조치미완료', value: 'N'},
  ],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {stateBar: { visible: false }, edit: { editable:false }, header: { height: 60 } },
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('수검부서(장소)'), exportStyleName: 'export_header_style'}, 
      exportStyleName: 'export_style', mergeRule: { criteria: 'value' }},
    { fieldName: 'INS_DATE', dataType: 'text', header: { text: t('점검일자'), exportStyleName: 'export_header_style'}, 
      exportStyleName: 'export_style',displayCallback: function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null}},
    { fieldName: 'FAIL_CONTENT', dataType: 'text', header: { text: t('내용'), exportStyleName: 'export_header_style'}, 
      width: '150', exportStyleName: 'export_style'},
    { fieldName: 'FAIL_FILE', dataType: 'text', header: { text: t('사진')}, renderer: { type: 'button'}, width: '40'},
    { fieldName: 'SOL_CONTENT', dataType: 'text', header: { text: t('내용'), exportStyleName: 'export_header_style'}, 
      width: '150', exportStyleName: 'export_style'},
    { fieldName: 'SOL_FILE', dataType: 'text', header: { text: t('사진')}, renderer: { type: 'button'}, width: '40'},
    { fieldName: 'SOL_DATE', dataType: 'text', header: { text: t('조치(예정)일'), exportStyleName: 'export_header_style'}, 
      exportStyleName: 'export_style',displayCallback: function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null} },

    { fieldName: 'FAIL_FILE_ID', dataType: 'text',visible: false },
    { fieldName: 'SOL_FILE_ID', dataType: 'text',visible: false },
  ],
  columns : [],
  columnLayout: [
    'DEPT_NM', 
    'INS_DATE',
    {
      name: '점검 결과 부적합 내용',
      direction: 'horizontal',
      items: [
        'FAIL_CONTENT',
        'FAIL_FILE',           
      ],
      header: { text: t('점검 결과 부적합 내용'), exportStyleName: 'export_header_style' },
    },
    {
      name: '시정조치(예정)',
      direction: 'horizontal',
      items: [
        'SOL_CONTENT',
        'SOL_FILE',           
      ],
      header: { text: t('시정조치(예정)'), exportStyleName: 'export_header_style' },
    },
    'SOL_DATE'
  ],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn =>{
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnPrint'){
    printSet()
  }
}

const searchData = () => {
  let INS_DATE_FROM = dayjs(props.searchParams.INS_DATE_FROM).format('YYYYMMDD')
  let INS_DATE_TO = dayjs(props.searchParams.INS_DATE_TO).format('YYYYMMDD')
  const params = {
    INS_DATE_FROM: INS_DATE_FROM,
    INS_DATE_TO: INS_DATE_TO,
  }

  return commonSearchApi({ queryId : 'MNGEE0020_TAB04_SEARCH_01', param: params })
}

const afterSearch = async res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellItemClicked = (grid, index, col) => {

  let rowData = grdMain.value.getDataProvider().getJsonRow(col.dataRow)
  let fileID = null

  /* ************** 점검 결과 부적합 내용 사진 보기 *************** */
  if (col.fieldName === 'FAIL_FILE') {
    imageViewerPopup.value.setGuid()
    fileID = rowData.FAIL_FILE_ID ? rowData.FAIL_FILE_ID : imageViewerPopup.value.guid
    imageViewerPopup.value.openPopup(fileID)
  }else {
    /* ************** 시정조치 사진 보기 *************** */
    imageViewerPopup.value.setGuid()
    fileID = rowData.SOL_FILE_ID ? rowData.SOL_FILE_ID : imageViewerPopup.value.guid
    imageViewerPopup.value.openPopup(fileID)
  }
}

const printSet = () => {
  grdMain.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '반기별 이행점검 현황/분석.xlsx', // 저장될 파일 name
    documentTitle: { //제목
      message: "반기별 이행점검 현황/분석",
      visible: true,
      spaceTop: 1,
      spaceBottom: 0,
      height: 50,
      styleName: "excelTitle",
    },
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
    indicator: 'visible', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'visible', // footer 표시하지 않음
    allColumns: true, // visible : false 인 행도 표시할 것인지 여부
    showColumns: [],
    hideColumns: ['FAIL_FILE','SOL_FILE'],
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })
}

defineExpose({
  onButtonsClick,
})

onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
})

</script>

<template>
  <RealGrid
    ref="grdMain"
    style="height: calc(100vh - 330px);"
    :grid-view-option="grdMainProps.gridViewOption"
    :keys="grdMainProps.keys"
    :fields="grdMainProps.fields"
    :columns="grdMainProps.columns"
    :column-layout="grdMainProps.columnLayout"
    @onCellItemClicked="onCellItemClicked"
  />
  <!-- IMAGE 미리보기 팝업 -->
  <ImageViewerPopup ref="imageViewerPopup" :buttonList="['btnDownLoad','btnClose']" :isVisibled="false" />
</template>

 