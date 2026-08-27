<!-- SPPHE0040 호선이동 계획 -->
<!-- SI2팀 마환구 2025-03-06 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user';
import { commonSearchApi, commonExecuteApi, getCodeList,commonRequest2} from '@hiway/api/commonApi';
import queryFlowHelper from '@/utils/searchFlowHelper';
import dayjs from 'dayjs';
import { useCommonStore } from '@hiway/stores/common'
import IGridTitle from '@/components/IGridTitle.vue'

defineOptions({
  name:'50_safety-support-SPP_H-SPPHE0040',
})

const FIUploadPopup =ref(null)
const userStore =  useUserStore()
const commonStore = useCommonStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMainProps1 = ref(null)
const saveParams= ref([])

// const aa = reactive({
//   dteDATE_D: '',
//   dteDATE_T: ''
// })

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  DATE : dayjs().format("YYYY-MM-DD"), 
  
})

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'SHPMV_DATE',
      dataType: 'text',
      editable: false,
      visible : false,
    },
    {
      fieldName: 'SHPMV_DATE_D',
      dataType: 'text',
      editable: false,
      header: { text: t('일자') },
      // datetimeFormat:'yyyy-MM-dd',
      width:'150'
    },
    {
      fieldName: 'SHPMV_DATE_T',
      dataType: 'text',
      header: { text: t('시간') },
      editable: false,
      width:'100'
    },
    {
      fieldName: 'SHPNO',
      dataType: 'text',
      editable: false,
      header: { text: t('호선') },
      width:'100',
    },
    {
      fieldName: 'DCK',
      dataType: 'text',
      editable: false,
      header: { text: t('도크') },
      width:'80',
    },
    {
      fieldName: 'SHPMV_DETL',
      dataType: 'text',
      editable: false,
      header: { text: t('현황') },
      styleName: 'left-column',
      width:'200',      
    },
    {
      fieldName: 'QUAY_CURR',
      dataType: 'text',
      editable: false,
      header: { text: t('접안안벽 현재') },
      styleName: 'left-column',
      width:'150'
    },
    {
      fieldName: 'QUAY_PLAN',
      dataType: 'text',
      editable: false,
      header: { text: t('접안안벽 반경') },
      styleName: 'left-column',
      width:'150'
    },
    {
      fieldName: 'RMV_UTIL',
      dataType: 'text',
      editable: false,
      header: { text: t('철거시간 UTILITY') },
      styleName: 'left-column',
      width:'150'
    },
    {
      fieldName: 'RMV_SPWR',
      dataType: 'text',
      editable: false,
      header: { text: t('철거시간 S/POWER') },
      styleName: 'left-column',
      width:'150'
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      editable: false,
      header: { text: t('비고') },
      styleName: 'left-column',
      width:'400'
    },
    {
      fieldName: 'SPOT_X',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('경도') },
      width:'100'
    },
    {
      fieldName: 'SPOT_Y',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('위도') },
      width:'100'
    },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields


//그리드 데이터 입력

onMounted( async () => {

  grdMainProps1.value.getGridView().filterPanel.visible = true;


  onButtonsClick({ id: 'btnSearch' })

})

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    // console.log("searchParams:",searchParams)
    new queryFlowHelper(vm, t)
      .setGridList([grdMainProps1])
      .setQuery(()=>{
        return commonSearchApi({
          queryId: "SPPHE0040_SEARCH_01",
          param: searchParams,
        })
      })
      .setAfter(afterSearch)
      .showMessage(true)
      .run();
  }

}

const afterSearch = (res) => {
  grdMainProps1.value.getDataProvider().setRows(res.ORESULT_CUR);

}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
        :usePermission="false"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">         
          <v-sheet class ="d-flex">
          <!-- <i-select
            :label="$t('년도')"
            width="200px"
            labelWidth="50px" 
            v-model="searchParams.YEAR"
            :items="codeList.TYPN_YEAR"
            item-value="CODE"
            item-title="DISPLAY_TEXT"
            @update:modelValue="TYPNChange"
          /> -->
          <i-input labelWidth="30px" width="180px" 
              :label="$t('일자')" type="date"
              v-model="searchParams.DATE"
              margin="10px"
            />
        </v-sheet>
      </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('실시간 호선이동(피항) 계획')">
              <template #editors />
            </IGridTitle>
          <RealGrid
            ref="grdMainProps1"
            class="mt-2"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
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
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
