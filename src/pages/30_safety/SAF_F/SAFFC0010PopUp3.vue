
<script setup>
import { ref, reactive, onMounted, watch ,getCurrentInstance} from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList , commonUploadFilesApi ,commonSendSMS} from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import queryFlowHelper from "@/utils/searchFlowHelper"
import SAFFC0010PopUp from '@/pages/30_safety/SAF_F/SAFFC0010PopUp4.vue'
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const searchData = ref({})
const popup =ref(null)
const openPopup = (param)=>{
  searchData.value =''
  dialog.value = true
 searchData.value =param
 console.log(searchData.value,'searchData.value')
}

const close =()=>{
  dialog.value = false
}

// 그리드
const grd1Props = reactive({
  gridViewOption : {edit: { editable:false }},
  keys : [],
  fields : [ 
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육일자') } },
    { fieldName: 'EDU_TIME_ST', dataType: 'text', header: { text: t('시작') } },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', header: { text: t('종료') } },
    { fieldName: 'LEAD_TIME', dataType: 'text', header: { text: t('시간(분)') } },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('과정명') } },
    { fieldName: 'LECTURER_NM', dataType: 'text', header: { text: t('강사명') } },
    { fieldName: 'EPLACE_NM', dataType: 'text', header: { text: t('교육장소') } },
    { fieldName: 'DIV_DESC', dataType: 'text', header: { text: t('이수여부') } },
],
  columns : [],
  columnLayout: [
    'EDU_DATE', 
    {
      name: '교육시간',
      direction: 'horizontal',
      items: [
        'EDU_TIME_ST',
        'EDU_TIME_FN',              
        'LEAD_TIME',              
      ],
      header: {
        text: t('교육시간'),
      },
    },
    'CURR_NM',
    'LECTURER_NM',
    'EPLACE_NM',
    'DIV_DESC',
  ],
})

grd1Props.columns = grd1Props.fields
const onButtonsClick=(btn)=>{
  if(btn.id==='btnClose'){
    close()
  }
  if(btn.id==='btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  }
}

//  조회
const searchData01 = (idx) => {
  searchData.value.YYYYMM = dayjs().format('YYYYMM')
  searchData.value.TARGET_ID = searchData.value.EMP_NO
  return commonSearchApi({ queryId: "SAFFC0010_POPUP4_SEARCH_01", param: searchData.value })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


const onCellDblClicked = (grid, clickData) => {
  // let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  // popup.value.openPopup(row)
  popup.value.openPopup()
}


defineExpose({
  openPopup
})

</script>

<template>
    
  <VDialog v-model="dialog"  persistent width="1200" 
  class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >    
    <div
      class="title-bar d-flex"
      @mousedown="startDragging"
      >
      교육이수 상세내역
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          :button-list="['btnSearch','btnClose']"
          @click-button="onButtonsClick"
          />
      </v-card-title>
      <v-card-text class="pa-0 px-3">
        <v-sheet>
          <div class="d-flex mb-3">
            <i-input
            v-model="searchData.KOR_NM"
            label="이름"
            width="200px"
            readonly
            />
            <i-input
            v-model="searchData.JOB_TIT_NM"
            label="직위"
            width="200px"
            readonly
            />

          </div>
          <div>
            <i-input
            v-model="searchData.ASGN_NM"
            label="소속"
            readonly
            />
          </div>
        </v-sheet>
        <v-sheet class="mt-3">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 400px;"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>

      </v-card-text>


      <SAFFC0010PopUp ref="popup"/>



    </v-card> 
   
  </VDialog>

</template>



<style scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }

</style>