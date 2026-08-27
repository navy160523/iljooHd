<template>
  <div>
    <div id="RegisterGrid" style="width: 100%; height: 99px"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { GridView, LocalDataProvider } from 'realgrid'
import { columns, fields, rows } from './data/register-grid'

let gridView = null
let dataProvider = null

onMounted(() => {
  dataProvider = new LocalDataProvider(false)
  gridView = new GridView('RegisterGrid')
  //데이터 적용
  gridView.setDataSource(dataProvider)
  dataProvider.setFields(fields)
  gridView.setColumns(columns)
  dataProvider.setRows(rows)
  //그리드 옵션 적용
  gridView.setRowIndicator({
    visible: true
  })
  gridView.setStateBar({
    visible: false
  })
  gridView.setCheckBar({
    visible: false
  })
  gridView.setOptions({
    footer: { visible: false }
  })
  //그리드 CSS 적용
  gridView.header.height = 35
  gridView.displayOptions.fitStyle = 'fill'
  gridView.displayOptions.rowHeight = 32

  gridView.displayOptions.hscrollBar = false
})
</script>
