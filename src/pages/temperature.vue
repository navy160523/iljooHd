<!--
  화면명 : 지역별 온도현황
  화면개요 : 지역별 온도현황 iframe
-->
<script setup>
  import { ref, reactive, getCurrentInstance, onMounted, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { commonSearchnoAuthApi, commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
  import RealGrid from '@/components/RealGrid.vue'
  import dayjs from 'dayjs'
  
  const grdMainAm = ref(null)
  const grdMainCm = ref(null)
  const grdMainPm = ref(null)
  const grdMainAf = ref(null)
  const t = useI18n().t //다국어
  
  
  
  const now = ref(dayjs())
  let timerId
  const tabs = ref(null)
  const searchParams = reactive({
    CHECK_TIME: ''
    })
  
  //그리드 속성셋팅 
  const grdCmProps = reactive({ 
    gridViewOption : { 
      checkBar: { visible: false },
      edit: { editable: false },
      header: { height: 25 },
    },
    keys : [], 
    fields : [ 
      { fieldName: 'MEASURE_LOC_NM', width: '100', editable: false, dataType: 'text', header: { text: t('측정지역'), styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(dataCell.index.itemIndex % 2 == 0) {
            return { style: { background:'#FFFFFF' } }
          } else {
            return { style: { background:'#f3f3f3' } }
          }
        },
      },
      { fieldName: 'MEASURE_TEMP', width: '50', editable: false, dataType: 'text', header: { text: t('기온')+'(℃)', styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(grid.getValue(dataCell.index.itemIndex, 'MEASURE_TEMP') == '측정전') { 
            if(dataCell.index.itemIndex % 2 == 0) {
              return { style: { background:'#FFFFFF' } }
            } else {
              return { style: { background:'#f3f3f3' } }
            }
          } else if (grid.getValue(dataCell.index.itemIndex, 'MEASURE_TEMP') < 28) { 
            return { style: { background:'#ADF9AD' } }
          } else { 
            return { style: { background:'#F79090' } }
          }
        },
      },
      { fieldName: 'MEASURE_REST_NM', width: '100', editable: false, dataType: 'text', header: { text: t('휴게시간'), styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(dataCell.index.itemIndex % 2 == 0) {
            return { style: { background:'#FFFFFF' } }
          } else {
            return { style: { background:'#f3f3f3' } }
          }
        },
      },
     
      // 안보이는거
      { fieldName: 'MEASURE_DT', dataType: 'text', header: { text: t('측정일자') },visible: false, },
      { fieldName: 'MEASURE_LOC', dataType: 'text', header: { text: t('측정장소코드') },visible: false, },
      { fieldName: 'MEASURE_REST', dataType: 'text', header: { text: t('휴게시간코드') },visible: false, },
      { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') },visible: false, },
    ],
    columns : [],
    displayOptions : {
  
    }
  })
  
  grdCmProps.columns = grdCmProps.fields
  
  const grdAmProps = reactive({ 
    gridViewOption : { 
      checkBar: { visible: false },
      edit: { editable: false },
      header: { height: 25 },
    },
    keys : [], 
    fields : [ 
      { fieldName: 'POSITION_DIV_NM', width: '80', editable: false, dataType: 'text', header: { text: t('측정지역'), styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(dataCell.index.itemIndex % 2 == 0) {
            return { style: { background:'#FFFFFF' } }
          } else {
            return { style: { background:'#f3f3f3' } }
          }
        },
      },
      { fieldName: 'FEEL_TEMP', width: '70', editable: false, dataType: 'text', header: { text: t('체감온도')+'(℃)', styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(grid.getValue(dataCell.index.itemIndex, 'FEEL_TEMP') == '측정전') { 
            if(dataCell.index.itemIndex % 2 == 0) {
              return { style: { background:'#FFFFFF' } }
            } else {
              return { style: { background:'#f3f3f3' } }
            }
          } else if (grid.getValue(dataCell.index.itemIndex, 'FEEL_TEMP') < 33) { 
            return { style: { background:'#adf9ad' } }
          } else { 
            return { style: { background:'#f79090' } }
          }
        },
      },
      { fieldName: 'ACTION_NM', width: '90', editable: false, dataType: 'text', header: { text: t('휴게시간'), styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(dataCell.index.itemIndex % 2 == 0) {
            return { style: { background:'#FFFFFF' } }
          } else {
            return { style: { background:'#f3f3f3' } }
          }
        },
      },
     
      // 안보이는거
      { fieldName: 'CHECK_DATE', dataType: 'text', header: { text: t('측정날짜') },visible: false, },
      { fieldName: 'CHECK_TIME', dataType: 'text', header: { text: t('측정시간') },visible: false, },
    ],
    columns : [],
    displayOptions : {
  
    }
  })
  
  grdAmProps.columns = grdAmProps.fields
  
  const grdPmProps = reactive({ 
    gridViewOption : { 
      checkBar: { visible: false },
      edit: { editable: false },
      header: { height: 25 },
    },
    keys : [], 
    fields : [ 
      { fieldName: 'POSITION_DIV_NM', width: '80', editable: false, dataType: 'text', header: { text: t('측정지역'), styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(dataCell.index.itemIndex % 2 == 0) {
            return { style: { background:'#FFFFFF' } }
          } else {
            return { style: { background:'#f3f3f3' } }
          }
        },
      },
      { fieldName: 'FEEL_TEMP', width: '70', editable: false, dataType: 'text', header: { text: t('체감온도')+'(℃)', styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(grid.getValue(dataCell.index.itemIndex, 'FEEL_TEMP') == '측정전') { 
            if(dataCell.index.itemIndex % 2 == 0) {
              return { style: { background:'#FFFFFF' } }
            } else {
              return { style: { background:'#f3f3f3' } }
            }
          } else if (grid.getValue(dataCell.index.itemIndex, 'FEEL_TEMP') < 33) { 
            return { style: { background:'#adf9ad' } }
          } else { 
            return { style: { background:'#f79090' } }
          }
        },
      },
      { fieldName: 'ACTION_NM', width: '90', editable: false, dataType: 'text', header: { text: t('휴게시간'), styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(dataCell.index.itemIndex % 2 == 0) {
            return { style: { background:'#FFFFFF' } }
          } else {
            return { style: { background:'#f3f3f3' } }
          }
        },
      },
     
      // 안보이는거
      { fieldName: 'CHECK_DATE', dataType: 'text', header: { text: t('측정날짜') },visible: false, },
      { fieldName: 'CHECK_TIME', dataType: 'text', header: { text: t('측정시간') },visible: false, },
    ],
    columns : [],
    displayOptions : {
  
    }
  })
  
  grdPmProps.columns = grdPmProps.fields
  

  const grdAfProps = reactive({ 
    gridViewOption : { 
      checkBar: { visible: false },
      edit: { editable: false },
      header: { height: 25 },
    },
    keys : [], 
    fields : [ 
      { fieldName: 'POSITION_DIV_NM', width: '80', editable: false, dataType: 'text', header: { text: t('측정지역'), styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(dataCell.index.itemIndex % 2 == 0) {
            return { style: { background:'#FFFFFF' } }
          } else {
            return { style: { background:'#f3f3f3' } }
          }
        },
      },
      { fieldName: 'FEEL_TEMP', width: '70', editable: false, dataType: 'text', header: { text: t('체감온도')+'(℃)', styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(grid.getValue(dataCell.index.itemIndex, 'FEEL_TEMP') == '측정전') { 
            if(dataCell.index.itemIndex % 2 == 0) {
              return { style: { background:'#FFFFFF' } }
            } else {
              return { style: { background:'#f3f3f3' } }
            }
          } else if (grid.getValue(dataCell.index.itemIndex, 'FEEL_TEMP') < 33) { 
            return { style: { background:'#adf9ad' } }
          } else { 
            return { style: { background:'#f79090' } }
          }
        },
      },
      { fieldName: 'ACTION_NM', width: '90', editable: false, dataType: 'text', header: { text: t('휴게시간'), styleName: 'temp-header' },
        'styleCallback': function(grid, dataCell){
          if(dataCell.index.itemIndex % 2 == 0) {
            return { style: { background:'#FFFFFF' } }
          } else {
            return { style: { background:'#f3f3f3' } }
          }
        },
      },
     
      // 안보이는거
      { fieldName: 'CHECK_DATE', dataType: 'text', header: { text: t('측정날짜') },visible: false, },
      { fieldName: 'CHECK_TIME', dataType: 'text', header: { text: t('측정시간') },visible: false, },
    ],
    columns : [],
    displayOptions : {
  
    }
  })
  
  grdAfProps.columns = grdAfProps.fields
  

 const setGrid = async() => {
  await commonSearchnoAuthApi({ queryId: 'HLTMA0010_SEARCH_02', param: {} }).then(res => {
    grdMainCm.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMainCm.value.getGridView().displayOptions.minRowHeight = 20
    grdMainCm.value.getGridView().displayOptions.rowHeight = 24
    grdMainCm.value.getGridView().setRowIndicator({ visible: false })
    grdMainCm.value.getGridView().sortingOptions.enabled = false
    grdMainCm.value.getGridView().displayOptions.columnMovable = false
  })
 }


  
  function getTabBySec(sec) {
    let type = 'CM'
    if (sec >= 9 * 3600 && sec <= (10 * 3600) + (30 * 60)) {
      type = 'AM'
    } else if(sec >= 14 * 3600 && sec <= (15 * 3600) + (30 * 60)) {
      type = 'PM'
    } 
    // eles {
    //   type = 'CM'
    // }
    return type
  }
  
  const onTabClick = async() => {
    if(tabs.value === 'AM'){
      searchParams.CHECK_TIME = '0930' // 오전 09:30
      return await commonSearchnoAuthApi({ queryId: 'HLTMA0010_SEARCH_03', param: searchParams }).then(res => {
        grdMainAm.value.getDataProvider().setRows(res.ORESULT_CUR)
        grdMainAm.value.getGridView().displayOptions.minRowHeight = 20
        grdMainAm.value.getGridView().displayOptions.rowHeight = 24
        grdMainAm.value.getGridView().setRowIndicator({ visible: false })
        grdMainAm.value.getGridView().sortingOptions.enabled = false
        grdMainAm.value.getGridView().displayOptions.columnMovable = false
      })
    }
    if(tabs.value === 'CM'){
      return await commonSearchnoAuthApi({ queryId: 'HLTMA0010_SEARCH_02', param: {} }).then(res => {
        grdMainCm.value.getDataProvider().setRows(res.ORESULT_CUR)
        grdMainCm.value.getGridView().displayOptions.minRowHeight = 20
        grdMainCm.value.getGridView().displayOptions.rowHeight = 24
        grdMainCm.value.getGridView().setRowIndicator({ visible: false })
        grdMainCm.value.getGridView().sortingOptions.enabled = false
        grdMainCm.value.getGridView().displayOptions.columnMovable = false
      })
    }
    if(tabs.value === 'PM'){
      searchParams.CHECK_TIME = '1430' // 오후 14:30
      return await commonSearchnoAuthApi({ queryId: 'HLTMA0010_SEARCH_03', param: searchParams }).then(res => {
        grdMainPm.value.getDataProvider().setRows(res.ORESULT_CUR)
        grdMainPm.value.getGridView().displayOptions.minRowHeight = 20
        grdMainPm.value.getGridView().displayOptions.rowHeight = 24
        grdMainPm.value.getGridView().setRowIndicator({ visible: false })
        grdMainPm.value.getGridView().sortingOptions.enabled = false
        grdMainPm.value.getGridView().displayOptions.columnMovable = false
      })
    }
    if(tabs.value === 'AF'){
      searchParams.CHECK_TIME = '1630' // 오후 16:30
      return await commonSearchnoAuthApi({ queryId: 'HLTMA0010_SEARCH_03', param: searchParams }).then(res => {
        grdMainAf.value.getDataProvider().setRows(res.ORESULT_CUR)
        grdMainAf.value.getGridView().displayOptions.minRowHeight = 20
        grdMainAf.value.getGridView().displayOptions.rowHeight = 24
        grdMainAf.value.getGridView().setRowIndicator({ visible: false })
        grdMainAf.value.getGridView().sortingOptions.enabled = false
        grdMainAf.value.getGridView().displayOptions.columnMovable = false
      })
    }



  }
  
  watch(tabs, async value => {
    // console.log('@@@@@@@',grdMainAm);
     await onTabClick()
  })
  
  // mount 시 실행
  onMounted(() => {
    
    // const sec = dayjs().diff(dayjs().startOf('day'), 'second')
    // tabs.value = getTabBySec(sec)

    // timerId = setInterval(() => {
    //   const sec = dayjs().diff(dayjs().startOf('day'), 'second')
    //   tabs.value = getTabBySec(sec)
    // }, 60000) //60초
   
    setGrid()
  })
  
  </script>
  
  <template>
    <v-sheet class="h-auto">
      <div class="d-flex flex-column fill-height">
        <v-sheet width='340'>

          <RealGrid
            ref="grdMainCm"
            style="width: 340px; height: 167px;"
            :grid-view-option="grdCmProps.gridViewOption"
            :keys="grdCmProps.keys" 
            :fields="grdCmProps.fields"
            :columns="grdCmProps.columns"
          />

          <!-- 텝 -->
          <!-- 2025.10.01 김대원 선임 요청으로 비활성화 처리 -->
          <!-- <VTabs v-model="tabs" grow height="37">
            <VTab value="AM" @click="onTabClick">10시<br>(09:30)</VTab>
            <VTab value="CM" @click="onTabClick">중식<br>(11:50)</VTab>
            <VTab value="PM" @click="onTabClick">15시<br>(14:30)</VTab>
            <VTab value="AF" @click="onTabClick">17시<br>(16:30)</VTab>
          </VTabs> -->
          <!-- 텝아이템 -->
          <!-- <VWindow v-model="tabs">
            <VWindowItem value="AM">
              <RealGrid
                ref="grdMainAm"
                style="width: 340px; height: 171px;"
                :gridViewOption="grdAmProps.gridViewOption"
                :keys="grdAmProps.keys" 
                :fields="grdAmProps.fields"
                :columns="grdAmProps.columns"
              />
            </VWindowItem>
            <VWindowItem value="CM">
              <RealGrid
                ref="grdMainCm"
                style="width: 340px; height: 167px;"
                :grid-view-option="grdCmProps.gridViewOption"
                :keys="grdCmProps.keys" 
                :fields="grdCmProps.fields"
                :columns="grdCmProps.columns"
              />
            </VWindowItem>
            <VWindowItem value="PM">
              <RealGrid
                ref="grdMainPm"
                style="width: 340px; height: 171px;"
                :grid-view-option="grdPmProps.gridViewOption"
                :keys="grdPmProps.keys" 
                :fields="grdPmProps.fields"
                :columns="grdPmProps.columns"
              />
            </VWindowItem>
            <VWindowItem value="AF">
              <RealGrid
                ref="grdMainAf"
                style="width: 340px; height: 171px;"
                :grid-view-option="grdAfProps.gridViewOption"
                :keys="grdAfProps.keys" 
                :fields="grdAfProps.fields"
                :columns="grdAfProps.columns"
              />
            </VWindowItem> 
          </VWindow>-->

        </v-sheet>
      </div>
    </v-sheet>
  </template>
  
  <style scoped lang="scss">
    .v-tab.v-tab {
      height: 37px!important;
    }
  </style>
  
  <route lang="yaml">
  meta:
    noAuth: true
    layout: blank
    redirectIfLoggedIn: true
  </route>