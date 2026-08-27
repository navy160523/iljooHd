<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  chatbotTranslateLn,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useCommonStore } from '@hiway/stores/common'
import { isEmpty } from '@/@core/utils'
import dayjs from 'dayjs'
import IGridTitle from '@/components/IGridTitle.vue'

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

const getDataProvider = () => grdMain.value.getDataProvider()
const getGridView = () => grdMain.value.getGridView()

defineExpose({
  getDataProvider,
  getGridView,
})

const props = defineProps({
  tabValue: { type: String, default: 'tab01' },
})

const codeList = {
  USE_YN: [
    { COD: 'Y', TXT: '공제' },
    { COD: 'N', TXT: '미공제' },
  ],
}

onMounted(() => {
  grdMain.value.setBindingColumn('USE_YN', codeList.USE_YN, 'COD', 'TXT')
  grdMain.value.getGridView().setContextMenu([
    { label: 'Column Filter 켜기', type: 'normal', tag: 'filter_on' },
    { label: 'Column Filter 끄기', type: 'normal', tag: 'filter_off' },
    { label: '-' }, // 메뉴 구분선 추가
    { label: '셀 복사', type: 'normal', tag: 'copy_cell' },
    { label: '행 복사', type: 'normal', tag: 'copy_row' },
  ])
})

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: props.tabValue !== 'tab01' } },
  fields: [
    {
      fieldName: 'MGR_DEPT_NM',
      dataType: 'text',
      styleName: 'center-column',
      width: '150',
      editable: false,
      header: { text: t('부서명') },
    },
    {
      fieldName: 'RECEIVE_ASGN_NM',
      dataType: 'text',
      styleName: 'center-column',
      width: '100',
      editable: false,
      header: { text: t('업체명') },
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      styleName: 'center-column',
      width: '100',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'ENTER_NAME',
      dataType: 'text',
      styleName: 'center-column',
      width: '100',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'SHOES_NM',
      dataType: 'text',
      styleName: 'center-column',
      width: '150',
      editable: false,
      header: { text: t('안전장화 종류') },
    },
    {
      fieldName: 'COST',
      dataType: 'text',
      width: '100',
      styleName: 'right-column',
      editable: false,
      header: { text: t('금액') },
    },
    {
      fieldName: 'SHOES_SIZE',
      dataType: 'text',
      styleName: 'center-column',
      width: '100',
      editable: false,
      header: { text: t('SIZE') },
    },
    {
      fieldName: 'RECEIVE_DT',
      dataType: 'text',
      styleName: 'center-column',
      width: '100',
      editable: false,
      header: { text: t('지급일자') },
    },
    {
      fieldName: 'RETIRE_DT',
      dataType: 'text',
      styleName: 'center-column',
      width: '100',
      editable: false,
      header: { text: t('퇴사일자') },
    },
    {
      fieldName: 'DEDUCTION_TERM',
      dataType: 'text',
      styleName: 'center-column',
      width: '50',
      editable: false,
      header: { text: t('3개월 유무') },
    },
    {
      fieldName: 'REASON_NM',
      dataType: 'text',
      styleName: 'center-column',
      width: '100',
      editable: false,
      header: { text: t('사유') },
    },
    {
      fieldName: 'VEND_NM',
      dataType: 'text',
      styleName: 'center-column',
      width: '150',
      editable: false,
      header: { text: t('퇴사업체') },
    },
    {
      fieldName: 'IS_SAME',
      dataType: 'text',
      styleName: 'center-column',
      width: '50',
      editable: false,
      header: { text: t('협력사 동일') },
    },
    {
      fieldName: 'DEDUCTION_DATE',
      dataType: 'text',
      styleName: 'center-column',
      header: { text: t('공제일자') },
      visible: props.tabValue !== 'tab01',
      displayCallback: function (grid, index, value) {
        return dayjs(value).format('YYYY-MM-DD')
      },
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      styleName: 'center-column',
      header: { text: t('공제여부') },
      width: '60',
      visible: props.tabValue !== 'tab01',
      editor: { type: 'dropdown' },
      lookupDisplay: true,
    },

    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'RECEIVE_ASGN_CD', dataType: 'text', header: { text: t('업체코드') }, visible: false },
    { fieldName: 'VEND_CD', dataType: 'text', header: { text: t('퇴사업체 코드') }, visible: false },
    { fieldName: 'RECEIVE_COUNT', dataType: 'text', header: { text: t('지급수량') }, visible: false },
    { fieldName: 'JOIN_DT', dataType: 'text', header: { text: t('입사일자') }, visible: false },
  ],
  keys: [],
  columnLayout: [],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
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
  height: calc(100vh - 335px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

.flex-gap {
  gap: 20px;
  flex-wrap: wrap;
}
</style>
