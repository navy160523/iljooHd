<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from "dayjs"
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'


defineOptions({
  name: '100_health-HLT_H-HLTHB0060',
})

const tab = ref('tab01')
const userStore = useUserStore()

const grdMain1 = ref(null)
const grdMain2 = ref(null)

const menuTitle= ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const codeList = reactive({
  //구분
  shoesKind: [],
  BSNS_CD : []
})


const initCodeList = async () => {
  
  Promise.all([
    //구분
    getCodeList('HHII710C')
  ]).then((res)=>{
    codeList.shoesKind=res[0].ORESULT_CUR
    
    if(codeList.shoesKind.length>0)
    {

      if(tab.value=="tab01")
      {
        grdMain1.value.setBindingColumn('SHOES_KIND', codeList.shoesKind, 'COD', 'TXT')
      }
      else
      {
        grdMain2.value.setBindingColumn('SHOES_KIND', codeList.shoesKind, 'COD', 'TXT')
      }
      
      
    }

  });

  if(tab.value=="tab02")
  {
    await commonSearchApi({
      queryId: 'HLTHB0060_COMBO_01',
      param: {CMPNY_DIV: userStore.cmpnyDiv},
    }).then(res=>{
      codeList.BSNS_CD=res.ORESULT_CUR
      if(codeList.BSNS_CD.length>0)
        {
          codeList.BSNS_CD.push({DISPLAY_TEXT:'기타',CODE:'ETC'})
          grdMain2.value.setBindingColumn('BSNS_CD', codeList.BSNS_CD, 'CODE', 'DISPLAY_TEXT')
        }
      });
  }
}

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  START_YEAR: dayjs().subtract(4, 'year').format("YYYY"),
  END_YEAR: dayjs().format("YYYY")
})

const grdMainProps1 = reactive({
  gridViewOption: { checkBar: { visible: false }},
  fields: [],
  columns: [],
  columnLayout:[],
})

const grdMainProps2 = reactive({
  gridViewOption: { checkBar: { visible: false }},
  fields: [],
  columns: [],
  columnLayout:[],
})


onMounted(() => {
  initCodeList()

  gridChange()


})



const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    // console.log("searchParams:",searchParams)
    new queryFlowHelper(vm, t)
      .setGridList([grdMain1])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

const beforeSearch = async () =>{
  await initCodeList();

  await gridChange();
  
  return true;
}
const searchData = async () =>{
  // console.log("searchParam:",searchParam)
  
  if(tab.value=="tab01")
  {
  await commonSearchApi({
    queryId: 'HLTHB0060_SEARCH_01',
    param: searchParam,
  }).then(res=>{
    if(res.ORESULT_CUR.length>0)
      {
        const dp = grdMain1.value.getDataProvider();

        dp.setRows(res.ORESULT_CUR);
      }

    });
  }
  else
  {
  await commonSearchApi({
    queryId: 'HLTHB0060_SEARCH_02',
    param: searchParam,
  }).then(res=>{

    if(res.ORESULT_CUR.length>0)
      {
        grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR);
      }

    });
  }
}

const afterSearch =() =>{

}

const gridChange=()=>{
  initCodeList()
  const result1 = setupTab01BandGrid(searchParam.START_YEAR, searchParam.END_YEAR);
  const result2 = setupTab02BandGrid(searchParam.START_YEAR, searchParam.END_YEAR);

  grdMainProps1.columnLayout = result1.columnLayout;
  grdMainProps1.fields = result1.fields;
  grdMainProps1.columns = result1.columns

  grdMainProps2.columnLayout = result2.columnLayout;
  grdMainProps2.fields = result2.fields;
  grdMainProps2.columns = result2.columns

  if(tab.value=="tab01")
  {
    grdMain1.value.getDataProvider().setFields(grdMainProps1.columns)
    grdMain1.value.getGridView().setColumns(grdMainProps1.columns)
    grdMain1.value.getGridView().setColumnLayout(grdMainProps1.columnLayout)
    grdMain1.value.getGridView().filterPanel.visible = true;
  }
  else
  {
    grdMain2.value.getDataProvider().setFields(grdMainProps2.columns)
    grdMain2.value.getGridView().setColumns(grdMainProps2.columns)
    grdMain2.value.getGridView().setColumnLayout(grdMainProps2.columnLayout)
    grdMain2.value.getGridView().filterPanel.visible = true;
  }
  
  //initCodeList();
  
}

function setupTab01BandGrid(startYear, endYear){
   
  const fields = [
  {
    fieldName: 'DIV',
    dataType: 'text'
  },
  {
    fieldName: 'CATEGORY',
    dataType: 'text'
  },
  {
    fieldName: 'SHOES_KIND',
    dataType: 'text'
  }];
  const columns = [
  {
    name: 'DIV',
    dataType: 'text',
    fieldName: 'DIV',
    width: 80,
    editable: false,
    lookupDisplay: true,
    header: { text: ' ' },
    styleName: 'center-column',
    mergeRule: {
      criteria: "value"  // 값이 같으면 세로로 병합
    },
    sortable: false
  },  
  {
    name: 'CATEGORY',
    dataType: 'text',
    fieldName: 'CATEGORY',
    width: 100,
    editable: false,
    lookupDisplay: true,
    header: { text: '구분' },
    styleName: 'center-column',
    mergeRule: {
      criteria: "value"  // 값이 같으면 세로로 병합
    },
    sortable: false
  },
  {
    name: 'SHOES_KIND',
    dataType: 'text',
    fieldName: 'SHOES_KIND',
    width: 150,
    editable: false,
    lookupDisplay: true,
    header: { text: '안전장화 종류' },
    editor: { type: 'dropdown', 
              dropDownCount: 5, 
              partialMatch: true, 
              domainOnly: true, 
              dropDownWhenClick: true, },
    styleName: 'left-column',
    sortable: false
  }
  ];
  const columnLayout = [
    'DIV','CATEGORY','SHOES_KIND'
  ];


  // 2. 연도 반복
  for (let y = startYear; y <= endYear; y++) {
    // 상반기
    const h1 = [
      { type: 'A', text: '직영' },
      { type: 'B', text: '협력사' }
    ].map(({ type, text }) => {
      const fieldName = `${y}_H1_${type}`;
      return {
        field: { fieldName, dataType: "number"},
        column: {
          name: `col_${fieldName}`,
          fieldName,
          dataType: "number",
          header: { text },
          editable: false,
          width: 50,
          styleName: 'right-column',
          numberFormat: "#,##0",
          sortable: false
        }
      };
    });

    // 하반기
    const h2 = [
      { type: 'A', text: '직영' },
      { type: 'B', text: '협력사' },
    ].map(({ type, text }) => {
      const fieldName = `${y}_H2_${type}`;
      return {
        field: { fieldName, dataType: "number"},
        column: {
          name: `col_${fieldName}`,
          fieldName,
          dataType: "number",
          header: { text },
          editable: false,
          width: 50,
          styleName: 'right-column',
          numberFormat: "#,##0",
          sortable: false
        }
      };
    });

    // 병합
    h1.forEach(x => {
      fields.push(x.field);
      columns.push(x.column);
    });
    h2.forEach(x => {
      fields.push(x.field);
      columns.push(x.column);
    });

    columnLayout.push({
      name: `${y}년 상반기`,
      direction: 'horizontal',
      items: h1.map(x => x.column.name)
    });

    columnLayout.push({
      name: `${y}년 하반기`,
      direction: 'horizontal',
      items: h2.map(x => x.column.name)
    });
  }

  return { fields, columns, columnLayout };
}

function setupTab02BandGrid(startYear, endYear){
   
  const fields = [{
    fieldName: 'BSNS_CD',
    dataType: 'text'
  },
  {
    fieldName: 'SHOES_KIND',
    dataType: 'text'
  }];
  const columns = [
    {
    name: 'BSNS_CD',
    dataType: 'text',
    fieldName: 'BSNS_CD',
    width: 100,
    editable: false,
    lookupDisplay: true,
    header: { text: '사업부' },
    editor: { type: 'dropdown', 
              dropDownCount: 5, 
              partialMatch: true, 
              domainOnly: true, 
              dropDownWhenClick: true, },
    styleName: 'center-column',
    mergeRule: {
      criteria: "value"  // 값이 같으면 세로로 병합
    },
    sortable: false
  },
  {
    name: 'SHOES_KIND',
    dataType: 'text',
    fieldName: 'SHOES_KIND',
    width: 150,
    editable: false,
    lookupDisplay: true,
    header: { text: '안전장화 종류' },
    editor: { type: 'dropdown', 
              dropDownCount: 5, 
              partialMatch: true, 
              domainOnly: true, 
              dropDownWhenClick: true, },
    styleName: 'left-column',
    sortable: false
  }
  ];
  const columnLayout = [
    'BSNS_CD','SHOES_KIND'
  ];


  // 2. 연도 반복
  for (let y = startYear; y <= endYear; y++) {
    // 상반기
    const h1 = [
      { type: 'A', text: '직영' },
      { type: 'B', text: '협력사' }
    ].map(({ type, text }) => {
      const fieldName = `${y}_H1_${type}`;
      return {
        field: { fieldName, dataType: "number"},
        column: {
          name: `col_${fieldName}`,
          fieldName,
          dataType: "number",
          header: { text },
          editable: false,
          width: 50,
          styleName: 'right-column',
          numberFormat: "#,##0",
          sortable: false
        }
      };
    });

    // 하반기
    const h2 = [
      { type: 'A', text: '직영' },
      { type: 'B', text: '협력사' },
    ].map(({ type, text }) => {
      const fieldName = `${y}_H2_${type}`;
      return {
        field: { fieldName, dataType: "number"},
        column: {
          name: `col_${fieldName}`,
          fieldName,
          dataType: "number",
          header: { text },
          editable: false,
          width: 50,
          styleName: 'right-column',
          numberFormat: "#,##0",
          sortable: false
        }
      };
    });

    // 병합
    h1.forEach(x => {
      fields.push(x.field);
      columns.push(x.column);
    });
    h2.forEach(x => {
      fields.push(x.field);
      columns.push(x.column);
    });

    columnLayout.push({
      name: `${y}년 상반기`,
      direction: 'horizontal',
      items: h1.map(x => x.column.name)
    });

    columnLayout.push({
      name: `${y}년 하반기`,
      direction: 'horizontal',
      items: h2.map(x => x.column.name)
    });
  }

  return { fields, columns, columnLayout };
}

const yearChange = () =>{
  searchParam.START_YEAR = dayjs(`${searchParam.END_YEAR}-01-01`).subtract(4,'year').format("YYYY")
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle 
      ref="menuTitle" 
      :title="`${$t(useLogsStore().menuId)}`"
      :button-list="['btnSearch']"
      @click-button="onButtonsClick"
      :usePermission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input :label="$t('년도')" 
            class="no-click"
            width="200px" 
            type="YEAR" 
            v-model="searchParam.START_YEAR"
            > </i-input>
            <i-select :label="$t('~')" 
            width="200px" 
            type="YEAR" 
            v-model="searchParam.END_YEAR" 
            @update:modelValue="yearChange"> </i-select>
          </div>
        </v-sheet>
        <v-sheet height="100%">
          <v-tabs v-model="tab">
            <v-tab value="tab01">전체</v-tab>
            <v-tab value="tab02">사업부</v-tab>
          </v-tabs>
          <v-window v-model="tab" class="h-window">
            <v-window-item value="tab01">
              <v-sheet style="height:100%">
              <RealGrid
                ref="grdMain1"
                :grid-view-option="grdMainProps1.gridViewOption"
                :fields="grdMainProps1.fields"
                :columns="grdMainProps1.columns"
                :column-layout="grdMainProps1.columnLayout"
                >
              </RealGrid>
              </v-sheet>
            </v-window-item>
            <v-window-item value="tab02">
              <v-sheet style="height:100%">
              <RealGrid
                ref="grdMain2"
                :grid-view-option="grdMainProps2.gridViewOption"
                :fields="grdMainProps2.fields"
                :columns="grdMainProps2.columns"
                :column-layout="grdMainProps2.columnLayout"
                >
              </RealGrid>
              </v-sheet>
            </v-window-item>
            
          </v-window>
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
</style>
