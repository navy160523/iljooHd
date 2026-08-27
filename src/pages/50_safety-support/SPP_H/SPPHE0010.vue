<!-- SPPHE0010 실시간 태풍 모니터링-->
<!-- SI2팀 마환구 2025-02-11 -->

<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
} from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'

import queryFlowHelper from '@/utils/searchFlowHelper'

import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import SPPHE0010_Popup_01 from '@/pages/50_safety-support/SPP_H/SPPHE0010Popup_01.vue'

defineOptions({
  name:'50_safety-support-SPP_H-SPPHE0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  TYPN : ''
})

const codeList = reactive({
  TYPN: [],
  TYPN_YEAR: []
})
const grdMainProps1 = ref(null)
const grdMainProps2 = ref(null)
const grdMainProps3 = ref(null)

const grdTitle1 = ref(null)
const grdTitle2 = ref(null)
const grdTitle3 = ref(null)

const FIUploadPopup =ref(null)
const SPPHE0010_POPUP01=ref(null)
const tab = ref(null)
const ReFresh =ref(null)
const TYPN_ENM =ref(null)
const TYPN_DATE_TO = ref(null)

onMounted( async () => {
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv
  }

    // 조회용 태풍 발생 년도 호출(SPPHB0010_SEARCH_04)
    await commonSearchApi({ queryId: 'SPPHE0010_SEARCH_04', param: param })
    .then(res => {
      codeList.TYPN_YEAR = res.ORESULT_CUR
       if (codeList.TYPN_YEAR.length > 0) {
         // 첫 번째 값 설정
         searchParams.YEAR = codeList.TYPN_YEAR[0].CODE
      }

        //그리드 표시용 태풍 내역 호출(SPPHB0020_SEARCH_03)
        return commonSearchApi({ queryId: 'SPPHE0010_SEARCH_05',param:{
                      CMPNY_DIV: userStore.cmpnyDiv,
                      YYYY: searchParams.YEAR
                  }})
    .then(res1 => {
      
      codeList.TYPN = res1.ORESULT_CUR
        if (codeList.TYPN.length > 0) {
          searchParams.TYPN=codeList.TYPN[0].CODE
      }
    })
    })
    
  //initCodeList()
  grdMainProps1.value.getGridView().filterPanel.visible = true
  grdMainProps2.value.getGridView().filterPanel.visible = true
  grdMainProps3.value.getGridView().filterPanel.visible = true
  //tab.value='tab01'
  onButtonsClick({ id: 'btnSearch' })
})

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false },
    showAllCheck: false,
  },
  keys: [],
  fields: [
    {
      fieldName: 'TYPN_NAME',
      styleName: 'left-column',
      dataType: 'text',
      header: { text: t('태풍명') },
      editable: false,
    },
    {
      fieldName: 'DATE_FROM',
      dataType: 'text',
      header: { text: t('비상기간\n(From)') },
      editable: false,
    },
    {
      fieldName: 'DATE_TO',
      dataType: 'text',
      header: { text: t('비상기간\n(To)') },
      editable: false,
    },

    {
      fieldName: 'TYPN_HPA',
      dataType: 'text',
      header: { text: t('기압\n(hpa)') },
      editable: false,
    },
    {
      fieldName: 'TYPN_SPD',
      dataType: 'text',
      header: { text: t('풍속\n(m/s)') },
      editable: false,
    },
    {
      fieldName: 'TYPN_RAINFALL',
      dataType: 'text',
      header: { text: t('강우량\n(mm/h)') },
      editable: false,
    },
    {
      fieldName: 'TYPN_WAVEH',
      dataType: 'text',
      editable: false,
      header: { text: t('파고\n(m)') },
    },
    {
      fieldName: 'TYPN_SCORE',
      dataType: 'number',
      header: { text: t('평가점수') },
      editable: false,
    },
    {
      fieldName: 'TYPN_GRADE',
      dataType: 'text',
      header: { text: t('위험도') },
    },
    { fieldName: 'TYPN_ENAME', dataType: 'text', visible: false },
    { fieldName: 'TYPYEAR', dataType: 'text', visible: false },
    { fieldName: 'TYPSEQ', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: 'DAMAGE_AREA',
      dataType: 'text',
      header: { text: t('구역') },
      editable: false,
    },
    // 2025-07-15 태풍모니터링의 태풍상황일지쪽 일자와 시간의 정렬을 위하여 합쳐할라는 요청에 의하여 TYPN_DATETIME추가//마환구
    // 혹시몰라서 피해현황쪽도 변경
    {
      fieldName: 'DAMAGE_DATETIME',
      dataType: 'text',
      editable: false,
      header: { text: t('피해 일시') },
    },
    {
      fieldName: 'DAMAGE_DATE',
      dataType: 'text',
      editable: false,
      visible : false,
      header: { text: t('피해 일자') },
    },
    {
      fieldName: 'DAMAGE_TIME',
      dataType: 'text',
      header: { text: t('피해 일시') },
      visible : false,
      editable: false,
    },
    {
      fieldName: 'DAMAGE_DIV_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('피해구분') },
    },

    { fieldName: 'DAMAGE_DIV', dataType: 'text', visible: false },
    {
      fieldName: 'IMAGE_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('사진') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20
        
        if (dataCell.value) {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/image-search-outline.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        return ret;
      },
    },
    { fieldName: 'DAMAGE_DESC', dataType: 'text', header: { text: t('피해내용') } },
    { fieldName: 'ACT_DESC', dataType: 'text', header: { text: t('조치사항') } },
    {
      fieldName: 'ATTACH_ID', dataType: 'text', editable: false, visible : false
    },
  ],
  columns: [],
})

grdProps2.columns = grdProps2.fields

//그리드3 속성셋팅
const grdProps3 = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: 'TYPN_SERNO',
      dataType: 'text',
      header: { text: t('태풍번호') },
      editable: false,
      visible : false
    },
    // 2025-07-15 태풍모니터링의 태풍상황일지쪽 일자와 시간의 정렬을 위하여 합쳐할라는 요청에 의하여 TYPN_DATETIME추가//마환구    
    {
      fieldName: 'TYPN_DATETIME',
      dataType: 'text',
      editable: false,
      header: { text: t('상황일시') },
    },
    {
      fieldName: 'TYPN_DATE',
      dataType: 'text',
      editable: false,
      visible : false,
      header: { text: t('일자') },
    },
    {
      fieldName: 'TYPN_TIME',
      dataType: 'text',
      header: { text: t('시간') },
      editable: false,
      visible : false,
    },
    {
      fieldName: 'OCCR_DESC',
      dataType: 'text',
      editable: false,
      header: { text: t('발생내용') },
    },
    {
      fieldName: 'RPT_USER',
      dataType: 'text',
      editable: false,
      header: { text: t('보고자') },
    },
    {
      fieldName: 'IMAGE_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('사진') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20
        
        if (dataCell.value) {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/image-search-outline.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        return ret;
      },
    },
    {
      fieldName: 'ACT_DESC',
      dataType: 'text',
      editable: false,
      header: { text: t('조치 내용/결과') },
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      editable: false,
      header: { text: t('비고') },
    },
    {
      fieldName: 'ATTACH_ID',
      dataType: 'text',
      editable: false,
      visible : false
    },
    
  ],
  columns: [],
})

grdProps3.columns = grdProps3.fields

const onButtonsClick = (btn) => {

  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMainProps1,grdMainProps2,grdMainProps3])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }

  if (btn.id === 'btnTypnSMS') {
    SPPHE0010_POPUP01.value.openPopup()
  }
  if (btn.id === 'btnTypnDamage') {
    let userid = userStore.userId
    window.open('http://10.100.29.248/#/loginpass?userid='+ userid +'&menu_gubun=hse0060&typn_serno='+ searchParams.TYPN);
  }
}
  //그리드 셀 클릭 이벤트
const grd3_onCellItemClicked = (grid, index, col) => {
  if (col.fieldName === 'IMAGE_YN') {
    //console.log("V1",index);
    let fileId=grdMainProps3.value.getGridView().getValues(col.dataRow)['ATTACH_ID']
    // console.log("fileId:",fileId);
    FIUploadPopup.value.openPopup(fileId);
  }
}

const grd2_onCellItemClicked = (grid, index, col) => {
  if (col.fieldName === 'IMAGE_YN') {
    //console.log("V1",index);
    let fileId=grdMainProps2.value.getGridView().getValues(col.dataRow)['ATTACH_ID']
    // console.log("fileId:",fileId);
    FIUploadPopup.value.openPopup(fileId);
  }
}

// 메인조회
const searchData = async () => {
  
  await commonSearchApi({
    queryId: 'SPPHE0010_SEARCH_01',
    param: searchParams,
  }).then(res=>{
    grdMainProps1.value.getDataProvider().setRows(res.ORESULT_CUR);
    TYPN_ENM.value=res.ORESULT_CUR[0].TYPN_ENAME
    TYPN_DATE_TO.value=res.ORESULT_CUR[0].DATE_TO
  });

  await commonSearchApi({
    queryId: 'SPPHE0010_SEARCH_02',
    param: searchParams,
  }).then(res=>{
    grdMainProps2.value.getDataProvider().setRows(res.ORESULT_CUR);
  });

  await commonSearchApi({
    queryId: 'SPPHE0010_SEARCH_03',
    param: searchParams,
  }).then(res=>{
    grdMainProps3.value.getDataProvider().setRows(res.ORESULT_CUR)
  });
  
}

const afterSearch = (res) => {
  let TPYN_DATE//DATE_TO
  let TYPN_NAME//TYPN_ENAME
  // grdMainProps1
  // grdMain.value.getGridView().setCheckBar({ showAll: false })
  
}
// const rowChangedSub = (grid, oldRow, newRow) => {
//   if (newRow === -1) {
//     return
//   }
//   let row = grdSub.value.getDataProvider().getJsonRow(newRow)

//   if (row.FLAG === 'P') {
//     grdSub.value.getGridView().editOptions.editable = false
//   } else {
//     grdSub.value.getGridView().editOptions.editable = true
//   }
// }

// 체크아이템

// const onItemCheckedMain = (grid, items, checked)=>{
//   let row = grdMain.value.getDataProvider().getJsonRow(items)
//   if(row.STATUS ==='PTW' && checked && !row.isNew){
//     grdMain.value.getGridView().checkItem(items,false)
//   }
// }
// const onItemCheckedSub = (grid, items, checked)=>{
//   let row = grdSub.value.getDataProvider().getJsonRow(items)
//   if(row.FLAG ==='P'){
//     grdSub.value.getGridView().checkItem(items,false)
//   }
// }
let timer=null
const checkedChanged=(newValue)=>{
  
  if(newValue=='Y')
  {
    if(timer) return; 
    // console.log('reFresh start');
    timer=setInterval(()=>{
      onButtonsClick({ id: 'btnSearch' })}
      ,30000);
  }
  else
  {
    if(timer)
    {
      clearInterval(timer);
      timer=null;
    }
  }
}
const TYPNChange = async e => { 
  //그리드 표시용 태풍 내역 호출(SPPHB0020_SEARCH_03)
  commonSearchApi({ queryId: 'SPPHE0010_SEARCH_05',param:{
    CMPNY_DIV: userStore.cmpnyDiv,
    YYYY: searchParams.YEAR
    }})
    .then(res1 => {
      
      codeList.TYPN = res1.ORESULT_CUR
        if (codeList.TYPN.length > 0) {
          searchParams.TYPN=codeList.TYPN[0].CODE
      }
    })
}

const onCellDblClicked =(grid, col) =>{

let userid = userStore.userId
window.open('http://10.100.29.248/#/loginpass?userid='+ userid +'&menu_gubun=hse0060&typn_serno='+ searchParams.TYPN);

}

</script>
<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="true"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnTypnSMS','btnTypnDamage','btnSearch']"
        @click-button="onButtonsClick">
    </IMenuTitle>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          
          <i-select
            :label="$t('년도')"
            width="200px"
            labelWidth="50px" 
            v-model="searchParams.YEAR"
            :items="codeList.TYPN_YEAR"
            item-value="CODE"
            item-title="DISPLAY_TEXT"
            @update:modelValue="TYPNChange"
          />
        
          <i-select
            :label="$t('태풍')"
            width="300px"
            labelWidth="50px" 
            v-model="searchParams.TYPN"
            :items="codeList.TYPN"
            item-value="CODE"
            item-title="DISPLAY_TEXT"
          />
          <VCheckbox
              v-model="ReFresh"
              label="자동 업데이트"
              @update:modelValue="checkedChanged"> 
          </VCheckbox>
        </v-sheet>

        <v-sheet class="h-auto">
          <div class="h-grow">
            <v-sheet width="50%" class="pa-0 h-auto mr-3" >
            <v-sheet height="151">
              <IGridTitle
                :title="$t('태풍 정보')"
                ref="grdTitle1"
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMainProps1"
                :grid-view-option="grdProps1.gridViewOption"
                :keys="grdProps1.keys"
                :fields="grdProps1.fields"
                :columns="grdProps1.columns"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-sheet>
            <v-sheet height="calc(100% - 151px)">
                <VTabs v-model="tab">
                  <VTab value="tab01">실시간 태풍(기상청)</VTab> <!--기상청 -->
                  <VTab value="tab02" v-show="false">현재 기상상황</VTab> <!--WINDY -->
                </VTabs> 
                <VWindow v-model="tab" class="h-window">
                  <VWindowItem value="tab01">
                    <div style="height:100%; display:flex;">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        :src="'https://www.weather.go.kr/w/typhoon/ko/weather/typhoon_02.jsp'"                                
                        ></iframe>
                <!-- :src="'http://www.typhoon2000.ph/multi/log.php?name='+TYPN_ENM" -->
                  </div>
                  </VWindowItem>
                  <VWindowItem value="tab02">
                    <div style="height:100%; display:flex;">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        ></iframe>
                        <!-- :src="'https://earth.nullschool.net/ko/#'+TYPN_DATE_TO+'1500Z/wind/surface/level/orthographic=130.26,33.91,3367/loc=129.510,35.473'" -->
                        <!-- src="https://earth.nullschool.net/ko/#2024/09/23/1500Z/wind/surface/level/orthographic=130.26,33.91,3367/loc=129.510,35.473" -->
                    </div>
                  </VWindowItem>
                </VWindow>
            </v-sheet>
            
            </v-sheet>

            <v-sheet width="50%" class="pa-0 h-auto">
              <v-sheet class="h-auto">
              <IGridTitle
                :title="$t('실시간 피해현황')"
                ref="grdTitle2"
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMainProps2"
                :grid-view-option="grdProps2.gridViewOption"
                :keys="grdProps2.keys"
                :fields="grdProps2.fields"
                :columns="grdProps2.columns"
                @onCellItemClicked="grd2_onCellItemClicked"
              />
            </v-sheet>
            <v-sheet class="h-auto">
              <IGridTitle
                :title="$t('상황일지')"
                ref="grdTitle3"> 
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMainProps3"
                :grid-view-option="grdProps3.gridViewOption"
                :keys="grdProps3.keys"
                :fields="grdProps3.fields"
                :columns="grdProps3.columns"
                @onCellItemClicked="grd3_onCellItemClicked"
              />
            </v-sheet>
              
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
    
  </v-card>
  <IUploadPopup ref="FIUploadPopup" 
  gridTitle="사진"
  width="1200" 
  height="800" 
  :button-list="['btnDownLoad','btnClose']"
  :isVisibled="false"
  ></IUploadPopup>
  <SPPHE0010_Popup_01 ref="SPPHE0010_POPUP01"/>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>

