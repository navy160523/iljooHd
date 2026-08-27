<template>
  <div>
    <div id="dataGrid" style="width: 100%; height: 800px"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { GridView, LocalDataProvider } from 'realgrid';
import { columns, fields, rows } from './data/data-grid';

let gridView = null;
let dataProvider = null;

onMounted(() => {
dataProvider = new LocalDataProvider(false);
gridView = new GridView('dataGrid');
//데이터 적용
gridView.setDataSource(dataProvider);
dataProvider.setFields(fields);
gridView.setColumns(columns);
dataProvider.setRows(rows);
//그리드 옵션 적용
gridView.setStateBar({
    visible: false
});
gridView.setCheckBar({
    visible: false
});
gridView.setOptions({
    footer: { visible: false },
})
//그리드 CSS 적용
gridView.displayOptions.fitStyle = "fill";
gridView.displayOptions.vscrollBar = false;
gridView.displayOptions.hscrollBar = false;

});
</script>