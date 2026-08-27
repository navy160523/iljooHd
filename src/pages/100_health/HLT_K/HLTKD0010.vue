<script setup>
//협력사 보건관리 평가(HLTKD0010)
//2025.05 마환구
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from "dayjs"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
// import VendTreePopup from '@/components/popup/VendTreePopup.vue'
import IButtonList from '@/components/IButtonList.vue'
import HLTKD0010Popup01 from './HLTKD0010Popup01.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'




defineOptions({
  name: '100_health-HLT_K-HLTKD0010',
})

const tab = ref("tab01")
const userStore = useUserStore()
// const vendTreePopup = ref(null)
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const calDate = ref(null)
const HLTKD0010Popup = ref(null)
const popupParam=reactive({})

const menuTitle= ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어


const codeList = reactive({
  //구분
  // Quarter : []
})

const Quarter = ref([
  { TXT: '1분기', COD: '1' },
  { TXT: '2분기', COD: '2' },
  { TXT: '3분기', COD: '3' },
  { TXT: '4분기', COD: '4' }
])


const initCodeList = async () => {

  let month = dayjs().format("MM")
  if (['01', '02', '03'].includes(month)) {
    // console.log('1')
    searchParam.QUARTER = '1'
  } else if (['04', '05', '06'].includes(month)) {
    // console.log('2')
    searchParam.QUARTER = '2'
  } else if (['07', '08', '09'].includes(month)) {
    // console.log('3')
    searchParam.QUARTER = '3'
  } else if (['10', '11', '12'].includes(month)) {
    // console.log('4')
    searchParam.QUARTER = '4'
  }
}

const searchParam = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs().format("YYYY"),
  QUARTER : '1'
})

const saveParam =ref([]);

const grdMainProps1 = reactive({
  gridViewOption: { checkBar: { visible: false }},
  fields: [
  {
      fieldName: 'COMP_CD',
      dataType: 'text',
      header: { text: t('협력사코드') },
      editable: false,
      visible : true
    },
    {
      fieldName: 'COMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('협력사명') },
      styleName : 'left-column'
    },
    {
      fieldName: 'TOT_CNT',
      dataType: 'text',
      editable: false,
      header: { text: t('총인원') },
      styleName : 'right-column'
    },
    {
      fieldName: 'MEDI_CNT',
      dataType: 'text',
      editable: false,
      header: { text: t('인원') },
      styleName : 'right-column'
    },
    {
      fieldName: 'MEDI_RATIO',
      dataType: 'text',
      editable: false,
      header: { text: t('비율') },
      styleName : 'right-column'
    },
    {
      fieldName: 'W_VALUE',
      dataType: 'text',
      editable: false,
      header: { text: t('비율 가중치') },
      styleName : 'right-column'
    },
    {
      fieldName: 'NOT_CHECK_CNT',
      dataType: 'text',
      editable: false,
      header: { text: t('재검\n미실시\n인원') },
      styleName : 'right-column'
    },
    {
      fieldName: 'NOT_ACTION_RATIO',
      dataType: 'text',
      editable: false,
      header: { text: t('재검\n미실시\n비율') },
      styleName : 'right-column'
    },
    {
      fieldName: 'MEDI_POINT',
      dataType: 'text',
      editable: false,
      header: { text: t('점수') },
      styleName : 'right-column'
    },
    {
      fieldName: 'AUTHOR_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('권한부여') },
      styleName : 'center-column'
    },
    {
      fieldName: 'AFTER_RATIO',
      dataType: 'text',
      editable: false,
      header: { text: t('실적등록율') },
      styleName : 'right-column'
    },
    {
      fieldName: 'A_VALUE',
      dataType: 'text',
      editable: false,
      header: { text: t('점수') },
      styleName : 'right-column'
    },
    {
      fieldName: 'AGENCY',
      dataType: 'text',
      editable: false,
      header: { text: t('선임·대행여부') },
      styleName : 'center-column'
    },
    {
      fieldName: 'AGENCY_POINT',
      dataType: 'text',
      editable: false,
      header: { text: t('가·감점') },
      styleName : 'right-column'
    },
    {
      fieldName: 'TOT_POINT',
      dataType: 'text',
      editable: false,
      header: { text: t('총점') },
      styleName : 'right-column'
    },
    
  ],
  columnLayout :[
    'COMP_CD','COMP_NM', 'TOT_CNT',
    {
      name:'건강관리위험대상자',
      direction: 'horizontal',
      items:['MEDI_CNT','MEDI_RATIO','W_VALUE',
      'NOT_CHECK_CNT','NOT_ACTION_RATIO','MEDI_POINT']
    }, 
    {
      name:'건강관리시스템',
      direction: 'horizontal',
      items:['AUTHOR_YN', 'AFTER_RATIO', 'A_VALUE']
    }, 
    {
      name:'보건관리자',
      direction: 'horizontal',
      items:['AGENCY', 'AGENCY_POINT']
    }, 
    'TOT_POINT'
  ]
})
grdMainProps1.columns = grdMainProps1.fields

const grdMainProps2 = reactive({
  gridViewOption: { checkBar: { visible: false }},
  fields: [
  {
      fieldName: 'COMP_CD',
      dataType: 'text',
      header: { text: t('협력사코드') },
      editable: false,
      visible : true
    },
    {
      fieldName: 'COMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('협력사명') },
      styleName : 'left-column'
    },
    {
      fieldName: 'TOT_CNT',
      dataType: 'text',
      editable: false,
      header: { text: t('총인원') },
      styleName : 'right-column'
    },
    {
      fieldName: 'MEDI_CNT',
      dataType: 'text',
      editable: false,
      header: { text: t('인원') },
      styleName : 'right-column'
    },
    {
      fieldName: 'MEDI_RATIO',
      dataType: 'text',
      editable: false,
      header: { text: t('비율') },
      styleName : 'right-column'
    },
    {
      fieldName: 'W_VALUE',
      dataType: 'text',
      editable: false,
      header: { text: t('비율 가중치') },
      styleName : 'right-column'
    },
    {
      fieldName: 'NOT_CHECK_CNT',
      dataType: 'text',
      editable: false,
      header: { text: t('재검\n미실시\n인원') },
      styleName : 'right-column'
    },
    {
      fieldName: 'NOT_ACTION_RATIO',
      dataType: 'text',
      editable: false,
      header: { text: t('재검\n미실시\n비율') },
      styleName : 'right-column'
    },
    {
      fieldName: 'MEDI_POINT',
      dataType: 'text',
      editable: false,
      header: { text: t('점수') },
      styleName : 'right-column'
    },
    {
      fieldName: 'AUTHOR_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('권한부여') },
      styleName : 'center-column'
    },
    {
      fieldName: 'AFTER_RATIO',
      dataType: 'text',
      editable: false,
      header: { text: t('실적등록율') },
      styleName : 'right-column'
    },
    {
      fieldName: 'A_VALUE',
      dataType: 'text',
      editable: false,
      header: { text: t('점수') },
      styleName : 'right-column'
    },
    {
      fieldName: 'AGENCY',
      dataType: 'text',
      editable: false,
      header: { text: t('선임·대행여부') },
      styleName : 'center-column'
    },
    {
      fieldName: 'AGENCY_POINT',
      dataType: 'text',
      editable: false,
      header: { text: t('가·감점') },
      styleName : 'right-column'
    },
    {
      fieldName: 'TOT_POINT',
      dataType: 'text',
      editable: false,
      header: { text: t('총점') },
      styleName : 'right-column'
    },
    
  ],
  columnLayout :[
    'COMP_CD','COMP_NM', 'TOT_CNT',
    {
      name:'건강관리위험대상자',
      direction: 'horizontal',
      items:['MEDI_CNT','MEDI_RATIO','W_VALUE',
      'NOT_CHECK_CNT','NOT_ACTION_RATIO','MEDI_POINT']
    }, 
    {
      name:'건강관리시스템',
      direction: 'horizontal',
      items:['AUTHOR_YN', 'AFTER_RATIO', 'A_VALUE']
    }, 
    {
      name:'보건관리자',
      direction: 'horizontal',
      items:['AGENCY', 'AGENCY_POINT']
    }, 
    'TOT_POINT'
  ]
})
grdMainProps2.columns = grdMainProps2.fields


onMounted( async () => {
  await initCodeList()

  grdMain1.value.getGridView().filterPanel.visible = true;
  //grdMain2.value.getGridView().filterPanel.visible = true;
})



const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    // console.log("searchParams:",searchParams)
    getData();
  }
  else if(btn.id=='btnUpdate')
  {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id=='btnPrint')
  {

    if(grdMain2.value.getDataProvider().getRowCount()==0)
    {
      return Message.warn('조회 후 출력해주세요.')
    }
    else
    {
      grdMain2.value.getGridView().exportGrid({ 
        type: 'excel',
        target: 'local',
        fileName: searchParam.YEAR+ '년 ' + searchParam.QUARTER + '분기' + ' 협력사 보건관리 평가',
        progressMessage: '엑셀 다운로드중입니다.',
        showProgress: true,
        indicator: 'visible',
        header: 'visible',
        footer: 'hidden',
        allColumns: false,
        exportTemplate: true
      })
    }
  }
}

const getData = () => {

  new queryFlowHelper(vm, t)
      .setGridList([grdMain1])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
}

const beforeSearch = async () =>{
  

  return true;
}
const searchData = async () =>{
  // console.log("searchParam:",searchParam)
  
  if(tab.value=="tab01")
  {
  return commonSearchApi({
    queryId: 'HLTKD0010_SEARCH_01',
    param: searchParam,
    })
  }
  else
  {
  return commonSearchApi({
    queryId: 'HLTKD0010_SEARCH_02',
    param: searchParam,
    })
  }
}

const afterSearch =(res) =>{
  if(tab.value=="tab01")
  {
    grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);
  }
  else
  {

    let date=[]
    date=res.ORESULT_CUR[0]
    
    if(!date.UPDATE_DATE)
    {
      calDate.value=date.INSERT_DATE.split('T')[0]
    }
    else
    {
      calDate.value=date.UPDATE_DATE.split('T')[0]
    }
    
    grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR);
    
  }
}

const beforeSave = () =>{
  if(grdMain1.value.getDataProvider().getRowCount()==0)
  {
    return Message.warn('조회 후 저장해주세요.')
  }
  let data = ref([])
  data.CMPNY_DIV=userStore.cmpnyDiv;
  data.YEAR=searchParam.YEAR;
  data.QUARTER=searchParam.QUARTER;
  data.USER_ID=userStore.userId;

  saveParam.value.push(data);
  return true
}
const saveData = () =>{
  // console.log("saveParam:",saveParam.value)
  return commonExecuteApi({ queryId: 'HLTKD0010_SAVE_01', list: saveParam.value })

}
const afterSave = () =>{

}

// const openVendPopup = () => {
//   vendTreePopup.value.openPopup({ ORGN_DIV: 'B', DEPT_CD : searchParam.COMP_CD })
// }

const selectedVend = (data) => {  
  searchParam.COMP_CD = data.ASGN_CD
  searchParam.COMP_NM = data.ASGN_NM
  getData()
}

const changeTab = () =>
{
  nextTick(() => {
    if(tab.value=="tab01")
    {
      grdMain1.value.getGridView().filterPanel.visible = true;
    }
    else if(tab.value=="tab02")
    {
      grdMain2.value.getGridView().filterPanel.visible = true;
    }
  })
}

const onCellClicked = (grd,col) =>{
  
  let grid

  if(col.fieldName=='TOT_POINT' && tab.value=="tab02")
  {   
    if(tab.value=="tab02")
    {
      grid=grdMain2.value.getGridView();
    }

    let rowData = grdMain2.value.getDataProvider().getJsonRow(col.dataRow)

    popupParam.CMPNY_DIV=userStore.cmpnyDiv;
    // popupParam.COMP_CD=grid.getValues(col.dataRow)['COMP_CD']
    // popupParam.COMP_NM=grid.getValues(col.dataRow)['COMP_NM']
    popupParam.COMP_CD=rowData.COMP_CD
    popupParam.COMP_NM=rowData.COMP_NM
    popupParam.CAL_DATE=calDate.value

    
    HLTKD0010Popup.value.openPopup(popupParam)
  }
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
      usePermission 
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select :label="$t('년도')" 
            width="200px" 
            type="YEAR" 
            v-model="searchParam.YEAR"
            > </i-select>
            <i-select :label="$t('분기')" 
            width="200px" 
            type="TEXT" 
            v-model="searchParam.QUARTER" 
            :items="Quarter"
            item-value="COD"
            item-title="TXT"
            > </i-select>
            <!-- <i-input
            v-model="searchParam.COMP_NM"
            label-width="50px"
            :label="$t('협력사')"
            width="200px"
            :readonly="true"
          />
          <i-input
            v-model="searchParam.COMP_CD"
            width="150px"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openVendPopup"
            @keydown.enter="openVendPopup"
            :readonly="false"
          >
          </i-input> -->
          </div>
        </v-sheet>
        <v-sheet height="100%">
          <v-tabs v-model="tab" @update:model-value="changeTab">
            <v-tab value="tab01">점수 산출</v-tab>
            <v-tab value="tab02">결과 조회</v-tab>
          </v-tabs>
          <v-window v-model="tab" class="h-window">
            <v-window-item value="tab01">
              <v-sheet class="d-flex justify-end pa-2">
              <IButtonList
                :button-list="['btnUpdate']"
                @click-button="onButtonsClick"
                usePermission
              />
              </v-sheet>
              <v-sheet style="height:100%">
              <RealGrid
                ref="grdMain1"
                :grid-view-option="grdMainProps1.gridViewOption"
                :keys="grdMainProps1.keys" 
                :fields="grdMainProps1.fields"
                :columns="grdMainProps1.columns"
                :column-layout="grdMainProps1.columnLayout"
                @onCellClicked="onCellClicked"
                >
              </RealGrid>
              </v-sheet>
            </v-window-item>
            <v-window-item value="tab02">
              <VRow>
                <VCol cols="12" md="6" class="d-flex justify-start pa-2">
                  <i-input
                    v-model="calDate"
                    :label="$t('산출일 : ')"
                    width="200px"
                  />
                </VCol>
                <VCol cols="12" md="6" class="d-flex justify-end pa-2">
                  <IButtonList
                  :button-list="['btnPrint']"
                  @click-button="onButtonsClick"
                  usePermission
                />
                </VCol>
            </VRow>
              <v-sheet style="height:100%">
              <RealGrid
                ref="grdMain2"
                :grid-view-option="grdMainProps2.gridViewOption"
                :fields="grdMainProps2.fields"
                :columns="grdMainProps2.columns"
                :column-layout="grdMainProps2.columnLayout"
                @onCellClicked="onCellClicked"
                >
              </RealGrid>
              </v-sheet>
            </v-window-item>
            
          </v-window>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <!-- <VendTreePopup ref="vendTreePopup" @selected="selectedVend"/> -->
  <HLTKD0010Popup01 ref="HLTKD0010Popup"/>
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
