<script setup>
import IMenuTitle from "@/components/IGridTitle.vue";
import { ref, reactive, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from "@hiway/api/commonApi";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";
import { isPropsValid } from "@fullcalendar/core/internal";
import { dataTool } from "echarts/core";

const grdMain = ref(null);
const dialog = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const emit = defineEmits(['selected'])

const codeList = reactive({
  PLACE_SEQ:[],
})

const searchParam = reactive({
  CMPNY_DIV: '',
  YEAR: '',
  REQ_DIV: '',
  REQ_CHA: '',
})

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    headerHeight: 60,
    // rowIndicator: {
    //   visible: false
    // },
  },
  fields: [
    {
      fieldName: 'PLACE_SEQ',
      dataType: 'text',
      width: '100',
      editable: true,
      lookupDisplay: true,
      header: { text: t('검사장소') },
      styleName: "left-column",
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'EYESIGHT_DT',
      dataType: 'text',
      width: '100',
      editable: true,
      header: { text: t('검사일자') },
      styleName: "center-column",
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
    },
    {
      fieldName: 'EYESIGHT_ST_TIME',
      dataType: 'text',
      width: '100',
      editable: true,
      header: { text: t('검사시작시간') },
      styleName: "center-column",
      editor: {
        mask: {
          definitions:{
            "b":"[0-2]",
            "c":"[0-9]",
            "d":"[0-5]",
            "e":"[0-9]"
          },
          editMask:"bc:de",
          includedFormat:true,
          overWrite: true,
          allowEmpty: true,
        }
      },
      textFormat: "([0-9]{2})([0-9]{2});$1:$2",
      // styleCallback: function(grid, index, value){
      //   console.log('asda? : ', grid.getValue(dataCell.index.itemIndex, "EYESIGHT_ST_TIME"))
      // }
    },
    {
      fieldName: 'EYESIGHT_ED_TIME',
      dataType: 'text',
      width: '100',
      editable: true,
      header: { text: t('검사종료시간') },
      styleName: "center-column",
      editor: {
        mask: {
          definitions:{
            "b":"[0-2]",
            "c":"[0-9]",
            "d":"[0-5]",
            "e":"[0-9]"
          },
          editMask:"bc:de",
          includedFormat:true,
          overWrite: true,
          allowEmpty: true,
        }
      },
      textFormat: "([0-9]{2})([0-9]{2});$1:$2",
    },
    {
      fieldName: "SAVE_YN",
      visible: false,
    },
    {
      fieldName: "EYESIGHT_SEQ",
      visible: false,
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
    },
    {
      fieldName: "YEAR",  
      visible: false,
    },
    {
      fieldName: "REQ_DIV",
      visible: false,
    },
    {
      fieldName: "REQ_CHA",
      visible: false,
    },
    
    // {
    //   fieldName: 'EYESIGHT_ST_TIME',
    //   dataType: 'time',
    //   width: '100',
    //   editable: true,
    //   header: { text: t('검사시작시간') },
    //   styleName: "center-column",
    //   editor: {
    //     type: 'datetime',
    //     datetimeFormat: 'hhmm',
    //   },
    // },
    // {
    //   fieldName: 'EN_TIME',
    //   dataType: 'time',
    //   width: '100',
    //   editable: true,
    //   header: { text: t('검사종료시간') },
    // },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const closePopup = () => {
  dialog.value = false
}

const onButtonsClick = async (btn) => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run();
  }else if (btn.id === 'btnClose') {
    closePopup()
  }else if(btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }else if(btn.id === 'btnDelete'){
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }else if(btn.id === 'btnEyesightScheduleAdd') {
    const rowCount = grdMain.value.getDataProvider().getRowCount();
    grdMain.value.getDataProvider().insertRow(rowCount, {})
  }else if(btn.id === 'btnScheduleApply'){
    const rowCount = grdMain.value.getDataProvider().getRowCount();
    if(!rowCount > 0){
      return Message.warn(
        t("적용할 일정이 없습니다.")
      );
    }else{
      let dataArray = [];

      for(let i = 0; i < rowCount; i++){
        dataArray.push(grdMain.value.getDataProvider().getJsonRow(i))
      }
      emit('selected', dataArray) //getRows())//
      closePopup()
    }
  }
};

const beforeDelete = () => {
  const orignIndex = grdMain.value.getGridView().getCurrent().itemIndex;
  if (orignIndex < 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

//삭제 이벤트
const deleteData = async () => {
  const orignIndex = grdMain.value.getGridView().getCurrent().itemIndex;
    let data = grdMain.value.getDataProvider().getJsonRow(orignIndex)
    let deleteParam = [{
      CMPNY_DIV : data.CMPNY_DIV,
      YEAR      : data.YEAR,
      REQ_DIV   : data.REQ_DIV,
      REQ_CHA   : data.REQ_CHA,
      PLACE_SEQ : data.PLACE_SEQ,
      EYESIGHT_SEQ : data.EYESIGHT_SEQ
    }]

  return commonExecuteApi({ queryId : 'HLTHC0020_DELETE_01', list: deleteParam }) 
}

//삭제 후
const afterDelete = async () => {
  await onButtonsClick({ id: 'btnSearch' })
}

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHC0020_SEARCH_07",
    param: searchParam,
  });
};

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

// 시력검사장소 초기화 및 불러오기
const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0020_SEARCH_PLACE",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv
      },
    })
  ])
  codeList.PLACE_SEQ = res[0].ORESULT_CUR;
  grdMain.value.setBindingColumn("PLACE_SEQ", codeList.PLACE_SEQ, "COD", "TXT")
};

// 그리드 초기화
const initGrid = () => {
  grdMain.value.getDataProvider().clearRows()
}

onMounted(() => {});

const beforeSave = () => {
  const provider = grdMain.value.getDataProvider();
  const view = grdMain.value.getGridView();
  const rowCount = provider.getRowCount();

  if(!rowCount){
    Message.warn(t("저장할 데이터가 없습니다."));
    return false;
  }
  
  for(let index = 0; index < rowCount; index++){
    if(provider.getValue(view.getDataRow(index), "PLACE_SEQ") === "" ||
       provider.getValue(view.getDataRow(index), "PLACE_SEQ") === null
      ){
      Message.warn(t("검사장소를 선택해주세요."));
      view.setCurrent({dataRow:index, column:"PLACE_SEQ"});
      view.setFocus(true);
      return false;
    }

    if(provider.getValue(view.getDataRow(index), "EYESIGHT_DT") === "" ||
       provider.getValue(view.getDataRow(index), "EYESIGHT_DT") === null
      ){
      Message.warn(t("검사일자를 선택해주세요."));
      view.setCurrent({dataRow:index, column:"EYESIGHT_DT"});
      view.setFocus(true);
      return false;
    }

    if(provider.getValue(view.getDataRow(index), "EYESIGHT_ST_TIME") === "" ||
       provider.getValue(view.getDataRow(index), "EYESIGHT_ST_TIME") === null
      ){
      Message.warn(t("검사시작시간을 입력해주세요."));
      view.setCurrent({dataRow:index, column:"EYESIGHT_ST_TIME"});
      view.setFocus(true);
      return false;
    }

    if(provider.getValue(view.getDataRow(index), "EYESIGHT_ED_TIME") === "" ||
       provider.getValue(view.getDataRow(index), "EYESIGHT_ED_TIME") === null
      ){
      Message.warn(t("검사종료시간을 입력해주세요."));
      view.setCurrent({dataRow:index, column:"EYESIGHT_ED_TIME"});
      view.setFocus(true);
      return false;
    }
  }

  return true
}

const saveData = () => {
  const provider = grdMain.value.getDataProvider();
  const rowCount = provider.getRowCount();
  let saveParam = []

  for(let index = 0; index < rowCount; index++){
    let data = provider.getJsonRow(index);
    
    let saveData = {
      CMPNY_DIV : searchParam.CMPNY_DIV,
      YEAR      : searchParam.YEAR,
      REQ_DIV   : searchParam.REQ_DIV,
      REQ_CHA   : searchParam.REQ_CHA,
      PLACE_SEQ : data.PLACE_SEQ,
      EYESIGHT_SEQ : data.EYESIGHT_SEQ != null ? data.EYESIGHT_SEQ : 0,
      EYESIGHT_DT  : dayjs(data.EYESIGHT_DT).format("YYYYMMDD"),
      EYESIGHT_ST_TIME : data.EYESIGHT_ST_TIME,
      EYESIGHT_ED_TIME : data.EYESIGHT_ED_TIME,
      SAVE_YN   : data.SAVE_YN,
      USER_ID: userStore.userId,
    }

    saveParam.push(saveData)
  }
  
  return commonExecuteApi({
    queryId: 'HLTHC0020_SAVE_03',
    list: saveParam,
  })
}

const afterSave = (res) => {
  onButtonsClick({ id: 'btnSearch' })
  // emit('Saved')
  // closePopup()
}

const openPopup = async (props) => {
  if(!props){
    return false
  }
  dialog.value = true

  searchParam.CMPNY_DIV = props.cmpnyDiv
  searchParam.YEAR = props.year
  searchParam.REQ_DIV = props.reqDiv
  searchParam.REQ_CHA = props.reqCha

  await initCodeList()
  
  grdMain.value.getGridView().onKeyDown = function(grid, event) {
    const input = document.activeElement;
    if (!(input && input.tagName === "INPUT")) return true;  

    const ch = event.key;

    if(!/^[0-9]/.test(ch)) return true;

    const pos = input.selectionStart;
    const current = grid.getEditValue();  
    
    const newValue = current.substring(0, pos) + ch + current.substring(pos+1);

    if (pos === 1 && newValue[0] === "2" && !/[0-3]/.test(ch)) {
      event.preventDefault();  
      return false;
    }
    if (pos === 3 && !/[0-5]/.test(ch)) {
      event.preventDefault();
      return false;
    }

    return true;
  }

  await onButtonsClick({ id: "btnSearch" });
};

defineExpose({
  openPopup,
});
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>시력검사일정 설정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :usePermission="false"
          :button-list="[
            'btnSearch',
            'btnUpdate',
            'btnDelete',
            'btnEyesightScheduleAdd', // 시력검사일정 추가
            'btnScheduleApply', //일정적용
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <div class="h-grow d-flex flex-area-gap">
            <v-sheet class="pa-0 h-auto custom-flex-1">
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              >
              </RealGrid>
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (505px - 12px));
  overflow-y: auto;
  > div {
    min-height: 300px;
  }
}

.form-row {
  display: flex;
  flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
  gap: 10px; /* 요소 간격 */
}

v-sheet {
  width: 100%;
}
</style>