<!-- SPPDB0010 안전검사 수수료정보 -->
<!-- SI2팀 김성근 2024-04-04 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'

defineOptions({
  name:'50_safety-support-SPP_D-SPPDB0010',
})

const userStore =  useUserStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)
const hueCode = reactive({
  SYS_CDNM:'',
  SYS_CD:'',
  CMPNY_DIV:''
})
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv
  
})
const codeList =reactive([])
//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : {stateBar: { visible: true }, checkBar: { visible : true } },
  keys : [''],
  fields : [ 
    { fieldName: 'EQUIP_KIND', dataType: 'text', header: { text: t('안전검사대상') } 
     ,editor: { type: "dropdown",domainOnly:true },  mergeRule: "value" , lookupDisplay: true
     ,editable: false,
     styleCallback: function(grid, dataCell){
      var ret = {}

      if(dataCell.item.rowState == 'created' || dataCell.item.itemState == 'appending' || dataCell.item.itemState == 'inserting'){
        ret.editable = true;
        ret.styleName = "editable_column";
      } else {
        ret.editable = false;
      }

      return ret;
    }
  
  
    },
    { fieldName: 'EQUIP_KIND_DETAIL', dataType: 'text', header: { text: t('안전검사대상') } ,
      styleName: "left-column",mergeRule: "value",lookupDisplay: true ,
      editor: { type: "dropdown",domainOnly:true },styleName: 'editable_column',
    },
    { fieldName: 'STANDARD_UNIT', dataType: 'text',  header: { text: t('기준범위') } ,mergeRule: "value" ,lookupDisplay: true, editor: { type: "dropdown",domainOnly:true },styleName: 'left-column editable_column'},
    { fieldName: 'SCOPE_MIN', dataType: 'number', numberFormat: "#,###.##", header: { text: t('MIN') } ,styleName: "right-column editable_column" },
    { fieldName: 'SCOPE_MAX', dataType: 'number', numberFormat: "#,###.##", header: { text: t('MAX') } ,styleName: "right-column editable_column" },
    { fieldName: 'UNIT_COST', dataType: 'number', numberFormat: "#,###.##", header: { text: t('기준단가(원)') } , styleName: "right-column editable_column"},
    { fieldName: 'ADD_UNIT', dataType: 'number', numberFormat: "#,###.##", header: { text: t('가산기준') } ,styleName: 'editable_column'  },
    { fieldName: 'ADD_COST', dataType: 'number', numberFormat: "#,###.##", header: { text: t('가산금액(원)') } ,styleName: "right-column editable_column" },
    { fieldName: 'MAX_COST', dataType: 'number', numberFormat: "#,###.##", header: { text: t('최대금액') } ,styleName: "right-column editable_column" },
    { fieldName: 'SORT', width : '50', dataType: 'number', numberFormat: "#,###.##", header: { text: t('정렬') } , styleName: 'right-column editable_column'  },
    { fieldName: 'STANDARD_DESC', dataType: 'text', header: { text: t('수수료기준명') } ,styleName: "left-column editable_column", },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') } ,styleName: "left-column editable_column", },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false  },
    { fieldName: 'SEQ', dataType: 'text',  visible: false  },
  ],
  columns : [],
  columnLayout: [

    {
      name: '안전검사대상',
      direction: 'horizontal',
      items: [
        'EQUIP_KIND',
        'EQUIP_KIND_DETAIL',
      ],
      header: { text: t('안전검사대상') },
      hideChildHeaders: true,
    },
    'STANDARD_UNIT',
    {
      name: '기준범위',
      direction: 'horizontal',
      items: [
        'SCOPE_MIN',
        'SCOPE_MAX',
      ],
      header: { text: t('기준범위') },
    },
    'UNIT_COST',
    {
      name: '기준범위',
      direction: 'horizontal',
      items: [
        'ADD_UNIT',
        'ADD_COST',
      ],
      header: { text: t('가산여부') },
    },
    'MAX_COST',
    'SORT',
    'STANDARD_DESC',
    'REMARK'
  ],
})

grdProps1.columns = grdProps1.fields

//그리드 데이터 입력

onMounted(() => {
  Promise.all([ 
  getCodeList("HHIF810"), //0
  getCodeList("HHIF819"), //1
  getCodeList("HHIF800"), //2
  commonSearchApi({
    queryId: "SPPDB0010_SEARCH_02",
    param: {CMPNY_DIV:'HHI',EQUIP_KIND:'F810'},
  })//3
  
    ]).then(res => {
      codeList.EQUIP_KIND = res[0].ORESULT_CUR
      grdMain.value.setBindingColumn("EQUIP_KIND",res[0].ORESULT_CUR,"COD","TXT");
      grdMain.value.setBindingColumn("STANDARD_UNIT",res[1].ORESULT_CUR,"COD","TXT");
      hueCode.SYS_CDNM = res[2].ORESULT_CUR[0].TXT
      hueCode.SYS_CD = res[2].ORESULT_CUR[0].COD
      hueCode.CMPNY_DIV = 'HHI'
      grdMain.value.setBindingColumn("EQUIP_KIND_DETAIL",res[3].ORESULT_CUR,"COD","TXT");
      codeList.EQUIP_KIND.unshift({ TXT: "전체", COD: "" })
      
    })
})

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run();
  }
  if(btn.id === 'btnCreate'){
    addRowData()
  }
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}


// 조회


const searchData01 = (idx) => {  
  return commonSearchApi({
    queryId: "SPPDB0010_SEARCH_01",
    param: searchParams,
  })
};


const afterSearch01 = (res) => {
  console.log(res.ORESULT_CUR,'res')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};
// 추가

const addRowData = () => {
  let newRow = {
    EQUIP_KIND       :'',
    EQUIP_KIND_DETAIL:'',
    STANDARD_UNIT    :'',
    SCOPE_MIN        :'',
    SCOPE_MAX        :'',
    UNIT_COST        :'',
    ADD_UNIT         :'',
    ADD_COST         :'',
    MAX_COST         :'',
    SORT             :'',
    STANDARD_DESC    :'',
    REMARK           :'',
    CMPNY_DIV        :userStore.cmpnyDiv,
    SEQ              :'',
  }
  grdMain.value.addRow(newRow)
}

// 저장
const beforeSave = () =>{
  let chekedRow =  grdMain.value.getGridView().getCheckedRows();

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."));
    return false;
  }
  return true;

}

const saveData =() =>{
  let chekedRow =  grdMain.value.getGridView().getCheckedRows();
  let saveList = []

  chekedRow.forEach((val) => {
    saveList.push(grdMain.value.getDataProvider().getJsonRow(val))
  })

  return commonExecuteApi({ queryId : 'SPPDB0010_SAVE_01', list: saveList })
}

// 삭제
const beforeDelete= ()=>{
  let chekedRow =  grdMain.value.getGridView().getCheckedRows();

    if (chekedRow.length === 0) {
      Message.warn(t("선택한 데이터가 없습니다."));
      return false;
    }
    return true;
}
const deleteData =() =>{
  let chekedRow =  grdMain.value.getGridView().getCheckedRows();
  let delList = []

  chekedRow.forEach((val) => {
    delList.push(grdMain.value.getDataProvider().getJsonRow(val))
  })

  return commonExecuteApi({ queryId : 'SPPDB0010_DELETE_01', list: delList })
}



//  팝업 오픈
const openPopup =() => {
  empPopup.value.openPopup({ EMP_NM: hueCode.SYS_CDNM })
}
//  팝업 이벤트
const onEmpSelected = (row) =>{
  hueCode.CMPNY_DIV = row.CMPNY_DIV
  hueCode.SYS_CD = row.EMP_NO
  hueCode.SYS_CDNM =  row.EMP_NM
}
// 담당자 저장
const saveTheHue =()=>{
  new saveFlowHelper(vm, t)
      .setBefore(beforeHueSave)
      .setQuery(saveHueData)
      .setAfter()
      .run()
}

const beforeHueSave =()=>{
  if(!hueCode.SYS_CD||!hueCode.SYS_CDNM){
      Message.warn(t("선택된 담당자가 없습니다."));
      return false;
    }
    return true;
}  

const saveHueData =()=>{
  let HueData = []
  HueData.push(hueCode)
  return commonExecuteApi({ queryId : 'SPPDB0010_SAVE_02', list: HueData })
}

watch(hueCode,(newValue)=>{
  if(newValue.SYS_CDNM == '' ||!newValue.SYS_CDNM){
    newValue.SYS_CD = ''
  }
})


// 그리드이벤트
const onCellClicked = (grid, cellData) =>{

if (cellData.cellType === "data") {
  if(cellData.column ==='EQUIP_KIND_DETAIL'){
    let row = grdMain.value.getDataProvider().getJsonRow(cellData.dataRow);
    if(row.EQUIP_KIND !=='A' || row.EQUIP_KIND ==''){
      grdMain.value.getGridView().columnByName("EQUIP_KIND_DETAIL").editable = false;
    }
    else{
      grdMain.value.getGridView().columnByName("EQUIP_KIND_DETAIL").editable = true;
    }
  }
}
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate','btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
         
          <i-select
           :label="$t('장비군')"
           width="200px"
           required
           v-model="searchParams.EQUIP_KIND" 
           :items="codeList.EQUIP_KIND"
            item-value="COD"
            item-title="TXT"
          />
          <i-input 
            :label="$t('안전경영실 담당자')"
            width="240px"
            v-model="hueCode.SYS_CDNM" 
            append-inner-icon="mdi-magnify" 
            @keydown.enter="e => {
              openPopup()
            }"
            @update:modelValue="e => { searchParams.SYS_CD = null }"
            @click:appendInner="openPopup()"
            margin="4px"        
          />
          <i-input 
            :label="$t('')"
            width="130px"
            v-model="hueCode.SYS_CD" 
            margin="4px"
            readonly        
          />
            <v-btn style="margin-top: 3px;" @click="saveTheHue">담당자 저장</v-btn>
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle
            :title="$t('')"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
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
