<script setup>
import { defineComponent } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const userStore = useUserStore()

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear(),
  REQ_CHA: '1',
})

const codeList = reactive({
  REQ_CHA: [], //신청시기
  SHOES_STANDARD: [], //지급기준
  HLD_OFFI_GBN: [
    //재직여부
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴직' },
    { COD: '4', TXT: '입대' },
  ],
})

const initCodeList = () => {
  Promise.all([getCodeList('HHII808A'), getCodeList('HHII740')]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR
    codeList.SHOES_STANDARD = res[1].ORESULT_CUR
    //codeList.REQ_CHA.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('SHOES_STANDARD', codeList.SHOES_STANDARD, 'COD', 'TXT') // 지급기준
    grdMain.value.setBindingColumn('HLD_OFFI_GBN', codeList.HLD_OFFI_GBN, 'COD', 'TXT') // 재직여부
  })
}

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'USER_DIV_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('구분') },
      styleName: "center-column",
    },
    {
      fieldName: 'ASGN_FULL_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('소속명') },
      styleName: "left-column",
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '45',
      editable: false,
      header: { text: t('사번') },
      styleName: "center-column",
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('부서') },
      styleName: "left-column",
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('협력사') },
      styleName: "left-column",
    },
    {
      fieldName: 'HLD_OFFI_GBN',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('재직유무') },
      styleName: "center-column",
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('성명') },
      styleName: "left-column",
    },
    {
      fieldName: 'JOB_TIT_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('직위') },
      styleName: "left-column",
    },
    {
      fieldName: 'STD_DUTY_NM',
      dataType: 'text',
      width: '55',
      editable: false,
      header: { text: t('직무명') },
      styleName: "left-column",
    },
    {
      fieldName: 'SHOES_NAME',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('안전화종류') },
      styleName: "left-column",
    },
    {
      fieldName: 'VEND_NAME',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('납품업체') },
      styleName: "left-column",
    },
    {
      fieldName: 'SHOES_SIZE',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('사이즈') },
      styleName: "center-column",
    },
    {
      fieldName: 'SHOES_COUNT',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('신청수량') },
      styleName: "right-column",
    },
    {
      fieldName: 'INSORE_YN',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('보온깔창여부') },
      styleName: "center-column",
    },
    {
      fieldName: 'SHOES_STANDARD',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('지급기준') },
      lookupDisplay: true,
      styleName: "center-column",
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'EMP_NO_RECEIVER',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('수령자사번') },
      styleName: "left-column",
    },
    {
      fieldName: 'EMP_NM_RECEIVER',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('수령자') },
      styleName: "left-column",
    },
    {
      fieldName: 'TEL_NO_RECEIVER',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('수령자연락처') },
      styleName: "left-column",
    },
    {
      fieldName: 'PLACE_NAME',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('수령장소') },
      styleName: "left-column",
    },
    {
      fieldName: 'REMARKS',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('비고') },
      styleName: "left-column",
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if(btn.id === 'btnPrint'){
    onExceldown()
  }
}

const onExceldown = async () => {

  if(grdMain.value.getGridView().getItemCount() < 1){
    Message.warn(t('출력할 데이터가 없습니다.'))
    return ;
  }

  let std = '';
  
  if(searchParam.REQ_CHA !== ''){
    std = codeList.REQ_CHA.find(item => item.COD === searchParam.REQ_CHA)?.TXT + '_';
  }

  grdMain.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '안전보호구_안전화신청 지급 현황(지급 명단)_' + dayjs(new Date()).format('YYYY') + '_' + std + '.xlsx', // 저장될 파일 name
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    indicator: 'hidden', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'visible', // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTHA0060_SEARCH_02',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnPrint']"
        @click-button="onButtonsClick"
        :use-permission="false"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select :label="$t('해당년도')" width="200px" type="YEAR" v-model="searchParam.YEAR"> </i-select>
            <i-select
              :label="$t('신청시기')"
              width="200px"
              item-title="TXT"
              item-value="COD"
              :items="codeList.REQ_CHA"
              v-model="searchParam.REQ_CHA"
            >
            </i-select>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          >
          </RealGrid>
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
  height: calc(100vh - 280px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
