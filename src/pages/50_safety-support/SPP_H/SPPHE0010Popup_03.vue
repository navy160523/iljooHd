<!-- SPPHE0010Popup_03 실시간 태풍 모니터링 문자발송내역 팝업-->
<!-- SI2팀 마환구 2025-02-14 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, defineProps, defineEmits } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'

import { commonSearchApi, commonExecuteApi, commonSendSMS } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMainProps1 = ref(null)
const grdMainProps2 = ref(null)
const grdMainProps3 = ref(null)

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
      fieldName: 'SEND_YEAR',
      styleName: 'left-column',
      dataType: 'text',
      header: { text: t('년도') },
      editable: false,
    },
    {
      fieldName: 'SEND_MON',
      dataType: 'text',
      header: { text: t('월') },
      editable: false,
    },
    {
      fieldName: 'SMS',
      dataType: 'text',
      header: { text: t('SMS(건)') },
      editable: false,
    },
    {
      fieldName: 'LMS',
      dataType: 'text',
      header: { text: t('LMS(건)') },
      editable: false,
    },
    {
      fieldName: 'TOT',
      dataType: 'text',
      header: { text: t('합계') },
      editable: false,
    },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false },
    showAllCheck: false,
  },
  keys: [],
  fields: [
    {
      fieldName: 'SEND_REG_DTE',
      styleName: 'left-column',
      dataType: 'text',
      header: { text: t('발송일시') },
      editable: false,
    },
    {
      fieldName: 'SEND_MSG',
      dataType: 'text',
      header: { text: t('발송내역') },
      editable: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'SEND_DATE',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'SEND_SERNO',
      dataType: 'text',
      editable: false,
      visible : false
    },
  ],
  columns: [],
})

grdProps2.columns = grdProps2.fields

//그리드3 속성셋팅
const grdProps3 = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: false },
    showAllCheck: false,
  },
  keys: [],
  fields: [
    {
      fieldName: 'SOSOK',
      styleName: 'left-column',
      dataType: 'text',
      header: { text: t('소속') },
      editable: false,
    },
    {
      fieldName: 'JIKWI',
      dataType: 'text',
      header: { text: t('직위') },
      editable: false,
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      header: { text: t('사번') },
      editable: false,
    },
    {
      fieldName: 'NAME',
      dataType: 'text',
      header: { text: t('성명') },
      editable: false,
    },
    {
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      header: { text: t('직책') },
      editable: false,
    },
  ],
  columns: [],
})

grdProps3.columns = grdProps3.fields



const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
})



const openPopup = async () => {

  dialog.value = true
  onDialog();
}

onMounted(() => {

  // let param = {
    
  // }
  //   // 조회용 태풍 발생 년도 호출(SPPHB0010_SEARCH_04)
  //   commonSearchApi({ queryId: 'SPPHE0010_SEARCH_07', param: param })
  //   .then(res => {
  //     codeList.Content_Result = res.ORESULT_CUR  
  //   })
  //   console.log("gridRows :",gridRows.value);
})

const onDialog =()=>{
  grdMainProps1.value.getGridView().filterPanel.visible = true
  grdMainProps2.value.getGridView().filterPanel.visible = true
  grdMainProps3.value.getGridView().filterPanel.visible = true

  onButtonsClick['btnSendSearch'];
}


const onClose = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnSendSearch') {
    new queryFlowHelper(vm, t)
      // .setGridList([grdMainProps1,grdMainProps2,grdMainProps3])
      .setGridList([grdMainProps1])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }

  else if (btn.id === 'btnClose') {
    onClose()
  }
}

const afterSearch = (res) => {
  // console.log("res:",res)
  // grdMain.value.getGridView().setCheckBar({ showAll: false })
  
}

const code1=ref('');
const code2=ref('');

const searchData= async ()=>{
  await commonSearchApi({
    queryId: 'SPPHE0010_SEARCH_09',
    param: searchParams,
  }).then(res1=>{
    // console.log("res :",res1);
    grdMainProps1.value.getDataProvider().setRows(res1.ORESULT_CUR);
    code1.value=res1.ORESULT_CUR[0].SEND_YEAR;
    code2.value=res1.ORESULT_CUR[0].SEND_MON;
  });
  
  await commonSearchApi({
    queryId: 'SPPHE0010_SEARCH_10',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      SEND_DATE: code1.value + code2.value},
    }).then(res2=>{
    // console.log("res :",res2);
    grdMainProps2.value.getDataProvider().setRows(res2.ORESULT_CUR);
    code1.value=res2.ORESULT_CUR[0].SEND_DATE
    code2.value=res2.ORESULT_CUR[0].SEND_SERNO
  });
  

  await commonSearchApi({
    queryId: 'SPPHE0010_SEARCH_11',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      SEND_DATE: code1.value,
      SEND_SERNO: code2.value
    },
  }).then(res3=>{
    grdMainProps3.value.getDataProvider().setRows(res3.ORESULT_CUR)
  });
}

const onCurrentChange1 = async ()=>{
let row=grdMainProps1.value.getGridView().getSelectedRows()
let tcode1='', tcode2='';
tcode1=grdMainProps1.value.getGridView().getValues(row)["SEND_YEAR"];
tcode2=grdMainProps1.value.getGridView().getValues(row)["SEND_MON"];
commonSearchApi({
    queryId: 'SPPHE0010_SEARCH_10',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      SEND_DATE: tcode1 + tcode2},
    }).then(res2=>{
    // console.log("res :",res2);
    grdMainProps2.value.getDataProvider().setRows(res2.ORESULT_CUR);
  });
}

const onCurrentChange2 =async ()=>{
let row=''
let tcode1='', tcode2='';

row=grdMainProps2.value.getGridView().getSelectedRows()
tcode1=grdMainProps2.value.getGridView().getValues(row)["SEND_DATE"];
tcode2=grdMainProps2.value.getGridView().getValues(row)["SEND_SERNO"];

commonSearchApi({
  queryId: 'SPPHE0010_SEARCH_11',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      SEND_DATE: tcode1,
      SEND_SERNO: tcode2
    },
  }).then(res3=>{
    grdMainProps3.value.getDataProvider().setRows(res3.ORESULT_CUR)
  });
}

</script>

<template>
  <v-dialog v-model="dialog" eager persistent width="1200" class="p-absolute user-select-none"
    >
    <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move"
      >
      <span>발송이력</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle :use-permission="false" :button-list="['btnSendSearch','btnClose']" @click-button="onButtonsClick" />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto d-flex">
              <v-sheet>
              <IGridTitle :title="$t('발송 현황')">
              </IGridTitle>
            </v-sheet>
            <v-sheet height="100%">
              <RealGrid
                ref="grdMainProps1"
                class="mt-2"
                :grid-view-option="grdProps1.gridViewOption"
                :keys="grdProps1.keys"
                :fields="grdProps1.fields"
                :columns="grdProps1.columns"
                :column-layout="grdProps1.columnLayout"
                @onCurrentChanged="onCurrentChange1"
              />
            </v-sheet>
          </v-sheet>   
          <v-sheet class="h-auto">
              <IGridTitle :title="$t('발송 이력')">
              </IGridTitle>
              <RealGrid
                ref="grdMainProps2"
                class="mt-2"
                :grid-view-option="grdProps2.gridViewOption"
                :keys="grdProps2.keys"
                :fields="grdProps2.fields"
                :columns="grdProps2.columns"
                :column-layout="grdProps2.columnLayout"
                @onCurrentChanged="onCurrentChange2"
              />
          </v-sheet>
          <v-sheet class="h-auto">
              <IGridTitle :title="$t('수신자 정보(명)')">
              </IGridTitle>
              <RealGrid
                ref="grdMainProps3"
                class="mt-2"
                :grid-view-option="grdProps3.gridViewOption"
                :keys="grdProps3.keys"
                :fields="grdProps3.fields"
                :columns="grdProps3.columns"
                :column-layout="grdProps3.columnLayout"
              />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
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