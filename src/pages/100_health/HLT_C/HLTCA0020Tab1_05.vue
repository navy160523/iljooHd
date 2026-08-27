<script setup>
//HLTCA0020 지표별 데이터 집계

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

defineOptions({
  name: '100_health-HLT_C-HLTCA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)
const isAdmin = ref(false)

const props = defineProps({
  searchParams: Object,
})

const emit = defineEmits(['onButtonsClick'])
// console.log("props", props)

const searchParams = reactive({
  // CMPNY_DIV: userStore.cmpnyDiv,
  // YEAR : props.searchParams.YEAR,
})

// watch(() => props.searchParams.YEAR, (val) => {
//   console.log("YEAR 변경됨:", val);
//   console.log("props.searchParams", props.searchParams);
// })

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  keys: [],
  fields: [],
  columnLayout: [
    // {
    //     name: '구분',
    //     direction: 'horizontal',
    //     items: ['AAA', '구분'],
    //   },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      // .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnIndicator') {
    emit('onButtonsClick', btn)
  }
}

/* ----------------- 조회 ----------------- */
const beforeSearch = () => {}

const searchData = () => {
  // console.log("searchParams", searchParams)
  // console.log("searchParams", props.searchParams)
  return commonSearchApi({
    queryId: 'HLTCA0020_SEARCH_05',
    param: props.searchParams,
  })
}

const afterSearch = (res) => {
  // console.log('조회', res.ORESULT_CUR)

  const rows = res.ORESULT_CUR
  if (!rows || rows.length === 0) return // 없으면 종료

    // null → 0 처리
//     rows.forEach((row) => {
//     Object.keys(row).forEach((key) => {
//     if (/_남$|_여$|_전체$/.test(key)) {
//       // 진짜 null이면 0으로
//       if (row[key] === null || row[key] === 'null' || row[key] === undefined) {
//         row[key] = 0;
//       } else if (typeof row[key] === 'string') {
//         const cleaned = row[key].replace(/,/g, '');
//         row[key] = isNaN(cleaned) ? 0 : Number(cleaned);
//       }
//     }
//   });
// });

  // AAA 데이터가 없으면 구분 데이터를 밀어넣음
  // AAA = 구분이면 컬럼 병합 위함
  rows.forEach((row) => {
    if (!row.AAA || row.AAA.trim() === '') {
      row.AAA = row.구분
    }
    // console.log("row.AAA", row.AAA)
  });

  const sample = rows[0] // 컬럼명을 기준으로 사용할 첫 행
  const fields = [] // 그리드에 넣을 필드 배열
  const columns = [] // 그리드의 넣을 컬럼 정의
  const columnLayout = [] // 그리드 레이아웃

  const yearMap = {} // ex) { 2023: ['2023_남', '2023_여', '2023_전체'] }

  // 순서 고정
  const genderOrder = ['남', '여', '전체']

  // sample 기준으로 forEach
  Object.keys(sample).forEach((key) => {
    if (key === 'AAA') {
      fields.push({ fieldName: 'AAA', dataType: 'text' })
      columns.push({
        name: 'AAA',
        fieldName: 'AAA',
        width: 150,
        header: { text: '구분' },
        editable: false,
        styleName: 'center-column',
        mergeRule: {
          criteria: 'values["AAA"]',
        }
      })
      // columnLayout.push('AAA');
    } else if (key === '구분') {
      // 구분은 항상 고정
      fields.push({ fieldName: '구분', dataType: 'text' }) 
      columns.push({
        name: '구분',
        fieldName: '구분',
        width: 200,
        header: { text: '' },
        editable: false,
        styleName: 'center-column',
      })
      // columnLayout.push('구분');
      columnLayout.push({
        header: '구분', // 상단 가로 병합 제목
        direction: 'horizontal',
        hideChildHeaders: true, //<<-------
        items: ['AAA', '구분'],
      })
    } else {
      // 동적 컬럼 처리
      // key = '2025_남'
      fields.push({ fieldName: key, dataType: 'text' })

      // key = '2025_남' → [year, gender] = ['2025', '남']
      const [year, gender] = key.split('_')
      columns.push({
        name: key,
        fieldName: key,
        width: 80,
        editable: false,
        header: { text: gender }, // 헤더에는 성별만
        numberFormat: '#,##0', // 천단위 콤마
        styleName: 'right-column',
      })

      // yearMap에 성별별로 컬럼 이름 매핑
      if (!yearMap[year]) yearMap[year] = {}
      yearMap[year][gender] = key // 성별 → 컬럼명 매핑,    yearMap['2024']['남'] = '2024_남'
    }
  })

  // 컬럼 레이아웃 구성 (년도별 + 성별 순서 고정)
  Object.keys(yearMap)
    .sort()
    .forEach((year) => {
      // 각 년도에 대해 '남 → 여 → 전체' 순으로 해당 컬럼 key('2024_남') 뽑음
      // 년도가 2024년이면 2024 포함 key를 뽑음
      const items = genderOrder
        .map((gender) => yearMap[year][gender]) // yearMap['2024']['남'] → '2024_남'
        .filter(Boolean) // 해당 성별 컬럼이 실제로 존재할 때만 포함

      columnLayout.push({
        header: year, // 상단에 년도
        direction: 'horizontal',
        items, // 나머지 하위 컬럼
      })
    })

  // 그리드에 적용
  nextTick(() => {
    const gridView = grdMain.value.getGridView()
    const dataProvider = grdMain.value.getDataProvider()

    if (gridView && dataProvider) {
      dataProvider.setFields(fields)
      gridView.setColumns(columns)
      gridView.setColumnLayout(columnLayout)
      dataProvider.setRows(rows)

      // spanCallback 그리드 가로 컬럼 병합
      gridView.layoutByColumn("AAA").spanCallback = function (grid, layout, itemIndex) {
      const aaa = grid.getValue(itemIndex, "AAA");
      const gubun = grid.getValue(itemIndex, "구분");

      // console.log(`[${itemIndex}] AAA: ${aaa}, 구분: ${gubun}`);

      if (aaa === gubun) {
        return 2; // A + B 병합
      }

      return 1; // 병합 안 함
    };
    }
  })
}

onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- ref="menuTitle"
      :title="$t(useLogsStore().menuId)"  -->
      <IGridTitle :button-list="['btnIndicator', 'btnSearch']" @click-button="onButtonsClick" />
    </v-card-title>
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
  height: calc(100vh - 390px);
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
.v-autocomplete__selection {
  flex-wrap: nowrap;
}
::v-deep(.v-field__input) {
  min-height: 40px !important;
  flex-wrap: nowrap !important;
  color: #000 !important;
  overflow: hidden !important;
}

::v-deep(.rg-header .rg-table tr td) {
  white-space: pre-line !important;
}
</style>
