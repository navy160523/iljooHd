
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, onBeforeMount } from "vue";
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
} from "@hiway/api/commonApi";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@hiway/stores/user";
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import HLTHF0030Popup from './HLTHF0030Popup.vue'

const grdMain = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const hLTHF0030Popup = ref(null)
const isAdmin = ref(0);


const codeList = reactive({
  USE_YN: [
    { TXT: "전체", COD: '' },
    { TXT: "사용", COD: "Y" },
    { TXT: "미사용", COD: "N" },
  ],
});

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DIVISION: "A",
  BSNS_CD: "",
  PLACE_NAME: "",
  USE_YN: "Y",
});

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: "PLACE_NAME",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("검사장소") },
      styleName: "left-column",
    },
    {
      fieldName: "USE_YN",
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("사용여부") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "REMARK",
      visible: false,
      header: { text: t("비고") },
    },

    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장구분") },
    },
    {
      fieldName: "DIVISION",
      visible: false,
      header: { text: t("구분") },
    },
    {
      fieldName: "PLACE_SEQ",
      visible: false,
      header: { text: t("장소순번") },
    },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

onMounted(async() => {
  initCodeList();
  grdMain.value.getGridView().filterPanel.visible = true;
});

const initCodeList = async () => {
  grdMain.value.setBindingColumn("USE_YN", codeList.USE_YN, "COD", "TXT");
};

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
  } else if (btn.id === "btnCreate") {
    hLTHF0030Popup.value.openPopup('A')
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
};

const btnSearch = async() => {
  new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
}

const btnCreate = async() =>{
  hLTHF0030Popup.value.openPopup('A')
}

const btnDelete = async() =>{
  new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
}


const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  hLTHF0030Popup.value.openPopup(data.DIVISION, '' ,data)
}

//삭제 전 유효성 검사
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

//삭제 이벤트
const deleteData = async () => {
  let temp = null
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let deleteParam = [{
      CMPNY_DIV: data.CMPNY_DIV,
      DIVISION : data.DIVISION,
      PLACE_SEQ : data.PLACE_SEQ,
      USER_ID  : userStore.userId
    }]
    temp = commonExecuteApi({ queryId : 'HLTHF0030_DELETE_01', list: deleteParam }) 
  }
  return temp
}

//삭제 후
const afterDelete = async () => {
  await onButtonsClick({ id: 'btnSearch' })
}

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHF0030_SEARCH_01",
    param: searchParam,
  });
};

const afterSearch = (res) => {
  const gridView = grdMain.value.getGridView();
 
  gridView.setAllCheck(false)
  gridView.checkAll(false)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

const buttonList = computed(() => {
  return isAdmin.value > 0 ? ['btnSearch', 'btnCreate', 'btnDelete'] : ['btnSearch', 'btnCreate'];
})

defineExpose({
  btnSearch,
  btnCreate,
  btnDelete,
});
</script>



<template>
  <v-card class="pa-0 fil-height">
    <!-- <v-card-title class="pa-3 pb-0" style="justify-content: space-between">
      <IMenuTitle
        :title="$t('시력검사 장소관리')"
        :button-list="buttonList"
        @click-button="onButtonsClick"
      />
    </v-card-title> -->
    <v-card-text class="pa-3 pt-3 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('검사장소')"
              width="300px"
              labelWidth="50px"
              v-model="searchParam.PLACE_NAME"
              @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
            >
              
            </i-input>
            <i-select
              :label="$t('사용여부')"
              :items="codeList.USE_YN"
              item-title="TXT"
              item-value="COD"
              width="300px"
              labelWidth="50px"
              v-model="searchParam.USE_YN"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            >
            </i-select>
            
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked = "onCellDblClicked"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <HLTHF0030Popup
    @Saved="() => onButtonsClick({ id: 'btnSearch' })"
    ref="hLTHF0030Popup"
  ></HLTHF0030Popup>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
.tooltip-wrapper {
  position: absolute;
}
.tooltip {
  position: relative; /* 화살표가 툴팁 아래에 위치하도록 */
  background-color: #424242;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1000; /* 툴팁이 다른 요소 위에 보이도록 */
  pointer-events: none; /* 툴팁이 마우스 이벤트를 받지 않도록 */
  white-space: nowrap; /* 내용이 줄바꿈되지 않도록 */
}

.tooltip-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent; /* 화살표의 왼쪽 부분 */
  border-right: 5px solid transparent; /* 화살표의 오른쪽 부분 */
  border-top: 5px solid #424242; /* 화살표의 색상 */
  position: absolute;
  left: 50%; /* 가운데 정렬 */
  transform: translateX(-50%); /* 수평 중심으로 이동 */
  top: 100%; /* 툴팁 아래에 위치 */
}
</style>