<!-- 
  화면명 : 월별 평균인원 관리
  화면개요 : 각부서별로 연도,월별 직영,협력업체 근무인원수를 관리하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import SAFAD0010Popup from './SAFAD0010Popup.vue'

defineOptions({
  name: '30_safety-SAF_A-SAFAD0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const grdMain = ref(null)

const searchParam = reactive({
  YEAR: dayjs().$y,
  CMPNY_DIV: userStore.cmpnyDiv,
})

const codeList = reactive({
  bsnscd: [],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
  ]).then((res) => {
    codeList.bsnscd = res[0].ORESULT_CUR
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      mergeRule: { criteria: 'value' },
      header: { text: t('사업부') },
    },
    {
      fieldName: 'PART_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      mergeRule: {
        criteria: ' value',
      },
      header: { text: t('부문') },
    },
    {
      fieldName: 'DAMD_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      mergeRule: {
        criteria: 'value',
      },
      header: { text: t('담당') },
    },

    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      mergeRule: {
        criteria: 'value',
      },
      groupFooter: { text: '소계 : ' },
      header: { text: t('부서') },
    },
    {
      fieldName: 'JIC_COUNT_01',
      dataType: 'number',
      width: '60',
      header: { text: t('직영인원') },
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'JIC_COUNT_02',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_03',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_04',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_05',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_06',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_07',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_08',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_09',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_10',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_11',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'JIC_COUNT_12',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'HYP_COUNT_01',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_02',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_03',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_04',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_05',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_06',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_07',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_08',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_09',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_10',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_11',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'HYP_COUNT_12',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      styleName: 'right-column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'ALL_COUNT_01',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_02',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_03',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_04',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_05',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_06',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_07',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_08',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_09',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_10',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_11',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'ALL_COUNT_12',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
      groupFooter: {
        numberFormat: '#,##0',
        expression: 'sum',
      },
    },
    {
      fieldName: 'WORK_DAYS_01',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_02',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_03',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_04',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_05',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_06',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_07',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_08',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_09',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_10',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_11',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'WORK_DAYS_12',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'JIC_COUNT_SUM',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('직영인원') },
    },
    {
      fieldName: 'HYP_COUNT_SUM',
      dataType: 'number',
      width: '60',
      numberFormat: '#,###',
      editable: false,
      styleName: 'right-column',
      header: { text: t('협력인원') },
    },
    {
      fieldName: 'ALL_COUNT_SUM',
      dataType: 'number',
      width: '60',
      editable: false,
      numberFormat: '#,###',
      styleName: 'right-column',
      header: { text: t('인원계') },
    },
    {
      fieldName: 'WORK_DAYS_SUM',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'right-column',
      header: { text: t('근로일수') },
    },
    {
      fieldName: 'PAST_YN',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      styleName: 'right-column',
      header: { text: t('과거조직여부') },
    },
    {
      fieldName: 'REL_CD',
      visible: false,
      dataType: 'text',
      width: '100',
      header: { text: t('정렬순서') },
    },
    {
      fieldName: 'DEPT_CD',
      visible: false,
      dataType: 'text',
      width: '100',
      header: { text: t('부서코드') },
    },
    {
      fieldName: 'BSNS_CD',
      visible: false,
      dataType: 'text',
      width: '100',
      header: { text: t('사업부코드') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      dataType: 'text',
      width: '100',
      header: { text: t('사업장구분') },
    },
  ],
  columns: [],
  columnLayout: [
    'PAST_YN', //과거조직 여부
    'BSNS_CD',
    'BSNS_NM', //사업부
    'PART_NM', //부문
    'DAMD_NM', //담당
    'DEPT_NM', //부서
    {
      name: '1월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_01', 'HYP_COUNT_01', 'ALL_COUNT_01'],
        },
        'WORK_DAYS_01',
      ],
    },
    {
      name: '2월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_02', 'HYP_COUNT_02', 'ALL_COUNT_02'],
        },
        'WORK_DAYS_02',
      ],
    },
    {
      name: '3월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_03', 'HYP_COUNT_03', 'ALL_COUNT_03'],
        },
        'WORK_DAYS_03',
      ],
    },
    {
      name: '4월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_04', 'HYP_COUNT_04', 'ALL_COUNT_04'],
        },
        'WORK_DAYS_04',
      ],
    },
    {
      name: '5월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_05', 'HYP_COUNT_05', 'ALL_COUNT_05'],
        },
        'WORK_DAYS_05',
      ],
    },
    {
      name: '6월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_06', 'HYP_COUNT_06', 'ALL_COUNT_06'],
        },
        'WORK_DAYS_06',
      ],
    },
    {
      name: '7월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_07', 'HYP_COUNT_07', 'ALL_COUNT_07'],
        },
        'WORK_DAYS_07',
      ],
    },
    {
      name: '8월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_08', 'HYP_COUNT_08', 'ALL_COUNT_08'],
        },
        'WORK_DAYS_08',
      ],
    },
    {
      name: '9월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_09', 'HYP_COUNT_09', 'ALL_COUNT_09'],
        },
        'WORK_DAYS_09',
      ],
    },
    {
      name: '10월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_10', 'HYP_COUNT_10', 'ALL_COUNT_10'],
        },
        'WORK_DAYS_10',
      ],
    },
    {
      name: '11월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_11', 'HYP_COUNT_11', 'ALL_COUNT_11'],
        },
        'WORK_DAYS_11',
      ],
    },
    {
      name: '12월',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_12', 'HYP_COUNT_12', 'ALL_COUNT_12'],
        },
        'WORK_DAYS_12',
      ],
    },
    {
      name: '평균',
      direction: 'horizontal',
      items: [
        {
          name: '평균인원수',
          direction: 'horizontal',
          items: ['JIC_COUNT_SUM', 'HYP_COUNT_SUM', 'ALL_COUNT_SUM'],
        },
      ],
    },
    {
      name: '합계',
      direction: 'horizontal',
      items: ['WORK_DAYS_SUM'],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    if(searchParam.YEAR * 1 < 2024) {
      Message.warn(t('2024년도부터 검색가능합니다.'))
      return
    }

    new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setGridList([grdMain]).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  } else {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  }
}

//조회관련 로직 시작

const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFAD0020_SEARCH01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//과거조직여부에 따른 행스타일 적용
const gridCellColorSetting = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    // let mergeItem = grdMain.value.getGridView().getMergedItems(dataCell.index.dataRow, 'DEPT_NM', true, true)
    // let groupItem = grdMain.value.getGridView().getRowsOfItems(mergeItem) //
    let ret = {
      style: {
        'background-color': undefined,
      },
    }

    if (dataCell && dataCell.index) {
      if (grid.getValue(dataCell.index.dataRow, 'PAST_YN') === 'Y') {
        if (
          dataCell.dataColumn.fieldName !== 'PAST_YN' &&
          dataCell.dataColumn.fieldName !== 'BSNS_NM' &&
          dataCell.dataColumn.fieldName !== 'PART_NM' &&
          dataCell.dataColumn.fieldName !== 'DAMD_NM'
        ) {
          ret.editable = false
          ret.style['background-color'] = '#FFD400'
        }
      }
      // else {
      //   // if ((dataCell.dataColumn.fieldName.includes('HYP') || dataCell.dataColumn.fieldName.includes('JIC')) && groupItem.length > 0) {
      //   if ((dataCell.dataColumn.fieldName.includes('HYP') || dataCell.dataColumn.fieldName.includes('JIC')) && groupItem.length > 0) {
      //     ret.style['background-color'] = '#EFF8FD'
      //     if (dataCell.dataColumn.fieldName.includes('HYP_COUNT_SUM') || dataCell.dataColumn.fieldName.includes('JIC_COUNT_SUM')) {
      //       ret.style['background-color'] = 'rgb(255,255,255)'
      //       ret.editable = false
      //     }
      //   }
      // }
      return ret
    }
  })
}

//저장관련 로직 시작
const beforeSave = () => {
  let data = grdMain.value.getGridView().getCheckedRows(true)
  if (data.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    for (let j = 1; j <= 12; j++) {
      let key = j.toString().padStart(2, '0')
      let saveData = {
        CMPNY_DIV: data.CMPNY_DIV,
        YEAR: searchParam.YEAR,
        MNTH: key,
        BSNS_CD: data.BSNS_CD,
        DEPT_CD: data.DEPT_CD,
        JIC_COUNT: data[`JIC_COUNT_${key}`],
        HYP_COUNT: data[`HYP_COUNT_${key}`],
        USER_ID: userStore.userId,
      }
      saveParam.push(saveData)
    }
  }
  return commonExecuteApi({
    queryId: 'SAFAD0020_SAVE01',
    list: saveParam,
  })
}

const afterSave = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//저장관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let data = grdMain.value.getGridView().getCheckedRows(true)
  if (data.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV,
      YEAR: searchParam.YEAR,
      DEPT_CD: data.DEPT_CD,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFAD0020_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//삭제관련 로직 끝

//셀변경 이벤트 시작
const onCellEdited = (grid, itemIndex, row, field) => {
  let fieldName = grdMain.value.getGridView().getColumn(field).name
  fieldName = fieldName.split('_')[2].toString()
  switch (fieldName) {
    //1월인원수를 변경했을때
    case '01':
      let data01 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount01 = Number(data01.JIC_COUNT_01) + Number(data01.HYP_COUNT_01) //1월 직영,협력사 인원을 더함
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_01', allCount01) //1월 인원계에 넣어줌
      let data01_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      //2024.06.18 김현재 작성 기존엔 각월에 값을 입력하면 입력한값의 합들이 평균에 입력되고, 저장하면 평균값이 계산되었는데 저장하고나서 평균값이 나오도록 수정 1~12월 입력값 전부
      //let all01 = calcHapCount(data01_1) //직영인원,협력인원,인원계 계산
      //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all01.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all01.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all01.all) //인원계 협력인원
      break
    case '02':
      let data02 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount02 = Number(data02.JIC_COUNT_02) + Number(data02.HYP_COUNT_02)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_02', allCount02) //2월 인원계
      let data02_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all02 = calcHapCount(data02_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all02.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all02.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all02.all) //인원계 협력인원
      break
    case '03':
      let data03 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount03 = Number(data03.JIC_COUNT_03) + Number(data03.HYP_COUNT_03)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_03', allCount03) //3월 인원계
      let data03_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all03 = calcHapCount(data03_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all03.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all03.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all03.all) //인원계 협력인원
      break
    case '04':
      let data04 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount04 = Number(data04.JIC_COUNT_04) + Number(data04.HYP_COUNT_04)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_04', allCount04) //4월 인원계
      let data04_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all04 = calcHapCount(data04_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all04.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all04.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all04.all) //인원계 협력인원
      break
    case '05':
      let data05 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount05 = Number(data05.JIC_COUNT_05) + Number(data05.HYP_COUNT_05)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_05', allCount05) //5월 인원계
      let data05_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all05 = calcHapCount(data05_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all05.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all05.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all05.all) //인원계 협력인원
      break
    case '06':
      let data06 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount06 = Number(data06.JIC_COUNT_06) + Number(data06.HYP_COUNT_06)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_06', allCount06) //6월 인원계
      let data06_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all06 = calcHapCount(data06_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all06.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all06.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all06.all) //인원계 협력인원
      break
    case '07':
      let data07 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount07 = Number(data07.JIC_COUNT_07) + Number(data07.HYP_COUNT_07)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_07', allCount07) //7월 인원계
      let data07_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all07 = calcHapCount(data07_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all07.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all07.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all07.all) //인원계 협력인원
      break
    case '08':
      let data08 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount08 = Number(data08.JIC_COUNT_08) + Number(data08.HYP_COUNT_08)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_08', allCount08) //8월 인원계
      let data08_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all08 = calcHapCount(data08_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all08.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all08.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all08.all) //인원계 협력인원
      break
    case '09':
      let data09 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount09 = Number(data09.JIC_COUNT_09) + Number(data09.HYP_COUNT_09)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_09', allCount09) //9월 인원계
      let data09_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all09 = calcHapCount(data09_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all09.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all09.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all09.all) //인원계 협력인원
      break
    case '10':
      let data10 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount10 = Number(data10.JIC_COUNT_10) + Number(data10.HYP_COUNT_10)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_10', allCount10) //10월 인원계
      let data10_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all10 = calcHapCount(data10_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all10.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all10.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all10.all) //인원계 협력인원
      break
    case '11':
      let data11 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount11 = Number(data11.JIC_COUNT_11) + Number(data11.HYP_COUNT_11)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_11', allCount11) //11월 인원계
      let data11_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all11 = calcHapCount(data11_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all11.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all11.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all11.all) //인원계 협력인원
      break
    case '12':
      let data12 = grdMain.value.getDataProvider().getJsonRow(row)
      let allCount12 = Number(data12.JIC_COUNT_12) + Number(data12.HYP_COUNT_12)
      grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_12', allCount12) //12월 인원계
      let data12_1 = grdMain.value.getDataProvider().getJsonRow(row) //셀변후 인원계값이 적용이 되지않아서 값 변경후 데이터 다시 들고와서 합계 계산 로직실행
      // let all12 = calcHapCount(data12_1) //직영인원,협력인원,인원계 계산
      // //인원 계산한 값을 합계컬럼에 각각 넣어줌
      // grdMain.value.getDataProvider().setValue(row, 'JIC_COUNT_SUM', all12.jicAll) //합계 직영인원
      // grdMain.value.getDataProvider().setValue(row, 'HYP_COUNT_SUM', all12.hypAll) //합계 협력인원
      // grdMain.value.getDataProvider().setValue(row, 'ALL_COUNT_SUM', all12.all) //인원계 협력인원
      break
  }
}
//셀변경 이벤트 끝

//합계인원 계산 로직 시작
const calcHapCount = (data) => {
  const countObj = {
    jicAll: 0, //직영인원 합계
    hypAll: 0, //협력인원 합계
    all: 0, //총인원수
  }
  for (let i in data) {
    if (i.includes('JIC')) {
      if (i === 'JIC_COUNT_SUM') {
        continue
      }
      countObj.jicAll += Number(data[i])
    } else if (i.includes('HYP')) {
      if (i === 'HYP_COUNT_SUM') {
        continue
      }
      countObj.hypAll += Number(data[i])
    } else if (i.includes('ALL')) {
      if (i === 'ALL_COUNT_SUM') {
        continue
      }
      countObj.all += Number(data[i])
    }
  }
  return countObj
}
//합계인원 계산 로직 끝

onMounted(() => {
  grdMain.value.getGridView().setRowGroup({
    expandedAdornments: 'footer',
    collapsedAdornments: 'footer',
    mergeExpanderVisibility: 'none',
    indentVisible: false,
    mergeMode: true, // 행 병합 그룹핑 활성화
    sorting: false,
    createFooterCallback: function (grid, groupModel) {
      //console.log('grid', grid)
      // console.log('groupModel', groupModel)
      // console.log('groupValue', groupModel.groupValue)

      if (groupModel.groupValue) {
        // grdMain.value
        //   .getGridView()
        //   .setRowStyleCallback(function (grid, item, fixed) {
        //     var ret = {}
        //     ret.style = { background: '#555555' }
        //     return ret
        //   })
        return true
      } else {
        return false
      }
    },
  })
  gridCellColorSetting()
  grdMain.value.getGridView().groupPanel.visible = false //그룹패널 안보이게하기
  grdMain.value.getGridView().groupBy(['BSNS_NM', 'PART_NM', 'DAMD_NM']) //BSNS_NM 기준으로 그룹핑
  //열고정 옵션
  grdMain.value.getGridView().setFixedOptions({
    colCount: 4,
  })

  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      >
      </IMenuTitle>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            width="200px"
            :label="$t('년도')"
            type="number"
            :min="2000"
            :max="3000"
            v-model="searchParam.YEAR"
            oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
          ></i-input>
          <div style="background-color: #ffd400; width: 40px; position: relative; left: 1300px"></div>
          <span style="position: relative; left: 1320px; font-size: 15px; font-weight: bold" class="mt-2">과거조직 (수정불가)</span>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :column-layout="grdMainProps.columnLayout"
            :columns="grdMainProps.columns"
            @onCellEdited="onCellEdited"
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
    min-height: 700px;
  }
}

::v-deep(.rg-root.rg-grid) {
  tr:not(.rg-rowgroup-footer) {
    td:not(.rg-data-readonly-cell) {
      background-color: #EFF8FD;
    }
  }
}
</style>
