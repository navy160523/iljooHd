
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
import IUpload from "@/components/IUpload.vue";
import tab1 from '@/pages/30_safety/SAF_F/SAFFC0010PopUp4Tab1.vue'
import tab2 from '@/pages/30_safety/SAF_F/SAFFC0010PopUp4Tab2.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const searchData = ref({})
const popup =ref(null)
const fileUpload =ref(null)
const tab = ref(null)
const codeList =reactive([])
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
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('차수') } },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육일자') } },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('시작') } },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', header: { text: t('종료') } },
    { fieldName: 'LEAD_TEPLACE_ETCIME', dataType: 'text', header: { text: t('교육장소') } },
    { fieldName: 'TARGET_CNT', dataType: 'text', header: { text: t('대상인원') } },
    { fieldName: 'EDU_CNT', dataType: 'text', header: { text: t('출결인원') } },
    { fieldName: 'CMPNY_DIV', dataType: 'text',visible :false },
    { fieldName: 'YEAR', dataType: 'text',visible :false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text',visible :false },
],
  columns : [],
  columnLayout: [
    'EDUTIME_SERIAL', 
    'EDU_DATE', 
    {
      name: '교육시간',
      direction: 'horizontal',
      items: [
        'EDU_TIME',
        'EDU_TIME_FN',                            
      ],
      header: {
        text: t('교육시간'),
      },
    },
    'LEAD_TEPLACE_ETCIME',
    'TARGET_CNT',
    'EDU_CNT',

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


onMounted(() => {
  Promise.all([
    getCodeList("HHID010"), //0
  ])
    .then((res) => {
      codeList.CURR_ID = res[0].ORESULT_CUR
    })
    .catch((err) => {})


})

// 파일업로드
watch(
  () => fileUpload.value,
  (newValue) => {
    if (newValue !== null && newValue !== "" && newValue !== undefined) {
      checkFileId();
    }
  }
);

//  진술 파일 업로드
const checkFileId = () => {
  console.log("업로드 ");
  // if (Popdata.RCA_FILE_ID === null || Popdata.RCA_FILE_ID === undefined) {
  //   fileUpload.value.setGuid();
  //   Popdata.RCA_FILE_ID = fileUpload.value.guid;
  //   fileUpload.value.onButtonsClick({ id: "btnSearch" });
  // } else {
  //   //파일아이디 있을때
  //   fileUpload.value.setGuid(Popdata.RCA_FILE_ID);
  //   Popdata.RCA_FILE_ID = fileUpload.value.guid;
  //   fileUpload.value.onButtonsClick({ id: "btnSearch" });
  // }
};


defineExpose({
  openPopup
})

</script>

<template>
    
  <VDialog v-model="dialog"  persistent width="1440" 
  class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >    
    <div
      class="title-bar d-flex"
      @mousedown="startDragging"
      >
      이수 확인
    </div>
    <v-card class="content-fill-height">
      <v-card-title>
        <IMenuTitle
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
          />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <div class="h-grow">
          <v-sheet width="40%" class="pa-0 h-auto mr-3">
            <div>
            <i-input 
            top-label
            :label="$t('분류')"
            label-width="80px"
            width="556px"
            class="mb-3"
          />
            <i-select 
            top-label
            :label="$t('교육명')"
            labelWidth="80px"
            width="556px"
            class="mb-3"
            :items="codeList.CURR_ID"
            item-title="TXT"
            item-value="COD"
          />
          <i-textarea 
            top-label
            :label="$t('교육내용')"
            labelWidth="80px"
            width="556px"
          />
           </div>
           <div>
            <RealGrid
            ref="grdMain"
            class="mt-3 mb-3"
            style="height: 200px;"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onCellDblClicked="onCellDblClicked"
            />
           </div>
           <div>
          <IUpload
          gridTitle=""
          :isVisibled="false"
          :gridOnly="true"
          :showSearchMessage="false"
          ref="fileUpload"
          style="height: 200px"
          />
           </div>
          </v-sheet>
          <v-sheet width="60%" class="pa-0 h-auto mr-3">
            <div>
              <VTabs v-model="tab">
                <VTab value="one">이수확인</VTab>
                <VTab value="two">평가관리</VTab>
              </VTabs>
              <VWindow v-model="tab">
                <VWindowItem value="one">
                  <tab1 />
                </VWindowItem>
                <VWindowItem value="two">
                  <tab2 />
                </VWindowItem>
              </VWindow>
           </div>
          </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card> 
  </VDialog>
</template>



<style scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }

</style>