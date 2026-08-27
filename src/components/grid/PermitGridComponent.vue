<template>
  <div>
    <div id="permitGrid" style="width: 100%; height: 900px"></div>
  </div>
</template>
  
<script setup>
import { onMounted } from 'vue';
import { GridView, LocalDataProvider } from 'realgrid';
import { columns, fields, rows } from './data/permit-grid';

let gridView = null;
let dataProvider = null;

let layout = [
  "DetailInfo",
  "Progress",
    {
        name: 'Group1',
        direction: 'horiziontal',
        items: [
            {
                name: 'RiskTarget1',
                items: ['RiskTarget1'],
                header: {visible: false},
            },
            {
                name: 'RiskTarget2',
                items: ['RiskTarget2'],
                header: {visible: false},
            }
        ],
        header: {text: '위험작업대상'}
    },
    "PermissionNumber",
    "ConstructionNumber",
    "ConstructionType",
    "ConstructionContent",
    "ConstructionDate",
    "Place",
    "Organize",
    "Manager1",
    "Manager2",
    "Worker"

]


onMounted(() => {
  dataProvider = new LocalDataProvider(false);
  gridView = new GridView('permitGrid');
  //데이터 적용
  gridView.setDataSource(dataProvider);
  dataProvider.setFields(fields);
  gridView.setColumns(columns);
  dataProvider.setRows(rows);
  //그리드 옵션 적용
  gridView.setStateBar({
    visible: false
  });
  gridView.setOptions({
    footer: { visible: false },
  })
  //그리드 CSS 적용
  gridView.displayOptions.fitStyle = "fill";
  gridView.setColumnLayout(layout);
  
  gridView.displayOptions.useFocusClass = true;
});
</script>