<!-- HLTKC0050Popup02 고령근로자 사후현황 이전 건강상태 현황-->
<!-- SI2팀 마환구 2025-02-12 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from "@/utils/saveFlowHelper"
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import dayjs from "dayjs"
import RealGrid from '@/components/RealGrid.vue'
import HLTKC0050Popup01 from './HLTKC0050Popup01.vue'


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)

const title=ref('');

const HLTKC0050Popup_01=ref(null)

const BSNS_CD = ref('');
const BSNS_NM = ref('');
const ASGN_CD = ref('');
const ASGN_NM = ref('');
const VEND_CD = ref('');
const VEND_NM = ref('');
const EMP_NO = ref('');
const EMP_NM = ref('');
const IDX_SEQ = ref('');
const YEAR = ref('');
const QUARTER = ref('');

const AGE_INT= ref('');

const saveParams=ref([]);
const fileUpload = ref(null)        
const btnVisible=ref(false)     

const emit = defineEmits(['closed'])

const searchParams = reactive({
  VEND_CD :'', 
  EMP_NO:'',
  IDX_SEQ : ''
})

//그리드 속성셋팅
const grdMainProps1 = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    checkBar: { visible: false, exclusive: false}
  },
  fields : [
    { 
      fieldName: 'BSNS_NM', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('사업부'),} ,
    },
    { 
      fieldName: 'DEPT_NM', dataType: 'text', width: '120', styleName: 'center-column',
      header: { text: t('부서') },
    },
    { 
      fieldName: 'VEND_NM', dataType: 'text', width: '120', styleName: 'left-column',
      header: { text: t('협력사') }, 
    },
    {
      fieldName: 'EMP_NM', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('이름') }, 
    },
    {
      fieldName: 'PAST_INSERT_DATE', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('등록일자') }, 
    },
    {
      fieldName: 'DETAIL', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('상세내용') }, 
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      },
    },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'VEND_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'IDX_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false, },

  ],
  columns : [],
  columnLayout :[]
})

grdMainProps1.columns = grdMainProps1.fields


const openPopup = async (param) => {

  console.log("param:",param)

  title.value='이전 건강상태 현황'

  searchParams.VEND_CD = param.VEND_CD
  searchParams.EMP_NO = param.EMP_NO
  searchParams.IDX_SEQ = param.IDX_SEQ
  

  BSNS_CD.value = param.BSNS_CD
  BSNS_NM.value = param.BSNS_NM
  ASGN_CD.value = param.ASGN_CD
  ASGN_NM.value = param.ASGN_NM
  VEND_CD.value = param.VEND_CD
  VEND_NM.value = param.VEND_NM
  EMP_NO.value = param.EMP_NO
  EMP_NM.value = param.EMP_NM
  IDX_SEQ.value = param.IDX_SEQ
  YEAR.value = param.YEAR
  QUARTER.value = param.QUARTER
  AGE_INT.value = param.AGE_INT
  

  grdMain.value.getGridView().filterPanel.visible = true;
  select_DATA()

  dialog.value = true;

}

const select_DATA= async ()=>{
  //  console.log("pop_searchParams:",searchParams)
  commonSearchApi({
          queryId: "HLTKC0050_SEARCH_02",
          param: searchParams,
        }).then(res=>{
          grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
          
        })
}

const initi= async ()=>{
  saveParams.value=[];
  DAMAGE_DATE.value = ''
  DAMAGE_DATE_FN.value = ''
  // DAMAGE_TIME_FR.value = ''
  // DAMAGE_TIME_FN.value = ''
  RPT_USER_NM.value = ''
  DAMAGE_DIV.value = ''
  L_AREA.value = ''
  M_AREA.value = ''
  S_AREA.value = ''
  SHIP_NO.value= ''
  BLK_DIV.value= ''
  STG_TYP.value= ''
  STG_DATE.value= ''
  WRK_DESC.value= ''
  WRK_QTY.value= ''
  QTY_UNIT.value= ''
  SPOT_X.value= ''
  SPOT_Y.value= ''
  REMARK.value= ''
  ATTACH_ID.value= ''
  fileUpload.value.setGuid(ATTACH_ID.value)
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
}

const onClose = () => {
  // detailData.TYPE = ''
  // detailData.ROWS = ''
  // initi();
  dialog.value = false
  emit('closed')
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnClose') {
    onClose()
  }
}


const onCellItemClicked = (grid, index, col) => {
  let param=[];
  if (col.fieldName === 'DETAIL') 
  { 
    
    param.VEND_CD=grdMain.value.getGridView().getValues(col.dataRow)['VEND_CD']
    param.EMP_NO=grdMain.value.getGridView().getValues(col.dataRow)['EMP_NO']
    param.BSNS_NM=grdMain.value.getGridView().getValues(col.dataRow)['BSNS_NM']
    param.VEND_NM=grdMain.value.getGridView().getValues(col.dataRow)['VEND_NM']
    param.EMP_NM=grdMain.value.getGridView().getValues(col.dataRow)['EMP_NM']
    param.ASGN_NM=grdMain.value.getGridView().getValues(col.dataRow)['DEPT_NM']
    param.IDX_SEQ=grdMain.value.getGridView().getValues(col.dataRow)['IDX_SEQ']
    
    param.DIV='R'

    HLTKC0050Popup_01.value.openPopup(param)
  }
  
}

</script>

<template style="margin: 0px">
  <v-dialog v-model="dialog" eager persistent 
  width="850" 
  height="500"
  class="p-absolute user-select-none" 
    >
    <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move"
      >
      <span>{{t(title)}}</span>
    </v-sheet>
    <!-- <v-card class="pa-0 fill-height rounded-b-5"> -->
      <v-card class="pa-0 rounded-b-5 h-full" >
      <v-card-title class="pa-4 pb-2">
        <IGridTitle :use-permission="true" :button-list="['btnClose']" @click-button="onButtonsClick" />
        <!-- <IButtonList
              :button-list="['btnContent','btnSend','btnDelete','btnSendHis','btnClose']"
              @click-button="onButtonsClick"/> -->
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <div class="fill-height">
          <v-sheet height="100%">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps1.gridViewOption"
              :keys="grdMainProps1.keys" 
              :fields="grdMainProps1.fields"
              :columns="grdMainProps1.columns"
              :column-layout="grdMainProps1.columnLayout"
              @onCellItemClicked="onCellItemClicked"
            >
            </RealGrid>
        </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <HLTKC0050Popup01 ref="HLTKC0050Popup_01"/>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 250px);
  //overflow-y: auto;
  > div {
    // min-height: 700px;
  }
}

.cols-padding{
  padding : 0px;
}

</style>