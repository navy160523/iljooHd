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
import Popup1 from './HLTCA0020Tab5_09Popup1.vue'

defineOptions({
  name: '100_health-HLT_C-HLTCA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)
const isAdmin = ref(false)
const Popup = ref(null)

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
  }
  else if (btn.id === 'btnDataUpload') {
    if (Popup.value) {
      Popup.value.openPopup();  // ref가 존재할 때만 실행
    }
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
    queryId: 'HLTCA0020_SEARCH5_09',
    param: props.searchParams,
  })
}

const afterSearch = (res) => {
  // console.log('조회', res.ORESULT_CUR)

  const rows = res.ORESULT_CUR
  if (!rows || rows.length === 0) return // 없으면 종료

  // null → 0 처리
//   rows.forEach((row) => {
//   Object.keys(row).forEach((key) => {
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

  // AAA 빈값일 경우 구분 값으로 채움
  rows.forEach((row) => {
    if (!row.AAA || row.AAA.trim() === '') {
      row.AAA = row.구분
    }
  })

  const sample = rows[0]
  const fields = []
  const columns = []
  const columnLayout = []

  // AAA 컬럼
  fields.push({ fieldName: 'AAA', dataType: 'text' })
  columns.push({
    name: 'AAA',
    fieldName: 'AAA',
    width: 130,
    header: { text: '구분' },
    editable: false,
    styleName: 'center-column',
    mergeRule: { criteria: 'values["AAA"]' },
  })

  // 구분 컬럼
  fields.push({ fieldName: '구분', dataType: 'text' })
  columns.push({
    name: '구분',
    fieldName: '구분',
    width: 130,
    header: { text: '' },
    editable: false,
    styleName: 'center-column',
  })

  // columnLayout 병합
  columnLayout.push({
    header: '구분',
    direction: 'horizontal',
    hideChildHeaders: true,
    items: ['AAA', '구분'],
  })

  // 동적 연도 컬럼 + REMARK
  Object.keys(sample).forEach((key) => {
    // if (['AAA', '구분', 'REMARK'].includes(key)) return
    if (['AAA', '구분'].includes(key)) return

    fields.push({ fieldName: key, dataType: 'text' })
    columns.push({
      name: key,
      fieldName: key,
      width: 100,
      editable: false,
      header: { text: key }, // 연도 그대로 표시
      numberFormat: '#,##0',
      styleName: 'right-column',
    })

    columnLayout.push({
      header: key,
      direction: 'horizontal',
      hideChildHeaders: true,
      items: [key],
    })
  })

  // REMARK 컬럼
  // fields.push({ fieldName: 'REMARK', dataType: 'text' })
  // columns.push({
  //   name: 'REMARK',
  //   fieldName: 'REMARK',
  //   width: 200,
  //   header: { text: '비고' },
  //   styleName: 'left-column',
  // })
  // columnLayout.push({
  //   header: '비고',
  //   direction: 'horizontal',
  //   hideChildHeaders: true,
  //   items: ['REMARK'],
  // })

  // 그리드에 적용
  nextTick(() => {
    const gridView = grdMain.value.getGridView()
    const dataProvider = grdMain.value.getDataProvider()

    if (gridView && dataProvider) {
      dataProvider.setFields(fields)
      gridView.setColumns(columns)
      gridView.setColumnLayout(columnLayout)
      dataProvider.setRows(rows)

      // AAA 기준 병합
      gridView.layoutByColumn("AAA").spanCallback = function (grid, layout, itemIndex) {
        const aaa = grid.getValue(itemIndex, "AAA")
        const gubun = grid.getValue(itemIndex, "구분")
        return aaa === gubun ? 2 : 1
      }
    }
  })
}

onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
})
const onPopupClosed = () => {
  onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- ref="menuTitle"
      :title="$t(useLogsStore().menuId)"  -->
      <IGridTitle :button-list="['btnDataUpload', 'btnIndicator', 'btnSearch']" @click-button="onButtonsClick" />
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
  <Popup1 ref="Popup" @closed="onPopupClosed"></Popup1>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 450px);
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
