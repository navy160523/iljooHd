<template>
  <div>
    <div id="compoundGrid" style="width: 100%; height: 130px"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { GridView, LocalDataProvider } from 'realgrid'
import { columns, fields, rows } from './data/register-search-grid'

let gridView = null
let dataProvider = null

// let layout = [
//     {
//         name: 'Group1',
//         direction: 'horiziontal',
//         items: [
//             {
//                 name: 'AA',
//                 items: ['AA'],
//                 header: {visible: false},
//             },
//             {
//                 name: 'BB',
//                 items: ['BB'],
//                 header: {visible: false},
//             }
//         ],
//         header: {text: 'Group1'}
//     },
//     {
//         name: '커스텀',
//         direction: 'horiziontal',
//         items: [
//             {
//                 name: '시각적인부분',
//                 items: ['GG','II'],
//             },
//             {
//                 name: '장소,가격',
//                 items: ['KK','JJ'],
//             }
//         ],
//         header: {text:'커스텀'}
//     }
// ]

onMounted(() => {
  dataProvider = new LocalDataProvider(false)
  gridView = new GridView('compoundGrid')
  //데이터 적용
  gridView.setDataSource(dataProvider)
  dataProvider.setFields(fields)
  gridView.setColumns(columns)
  dataProvider.setRows(rows)
  //그리드 옵션 적용
  gridView.setRowIndicator({
    visible: false
  })
  gridView.setStateBar({
    visible: false
  })
  gridView.setCheckBar({
    visible: true
  })
  gridView.setOptions({
    footer: { visible: false }
  })
  //그리드 CSS 적용
  gridView.displayOptions.fitStyle = 'fill'
  gridView.displayOptions.hscrollBar = false

  // gridView.setColumnLayout(layout);
})
</script>
