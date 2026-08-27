<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import saveFlowHelper from "@/utils/saveFlowHelper";
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useUserStore } from '@hiway/stores/user'
import {commonDownloadFilesApi} from "@hiway/api/commonFileApi"

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear(),
  REQ_DIV: 'A',
  REQ_CHA: (new Date().getMonth()+1).toString(),
});

const codeList = reactive({
  REQ_DIV: [
    { COD: 'A', TXT: '정기'},
    { COD: 'B', TXT: '수시'},
  ],
});

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'PLACE_NAME',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('시력검사 장소명') },
      styleName: "left-column",
    },
    {
      fieldName: "USE_YN",
      width: "60",
      header: {
        text: t("해당여부"),
      },
      styleName: "center-column editable_column",
      renderer: {
        type: "check", // ✅ 셀 내부에 체크박스 표시
        trueValues: "Y",
        falseValues: "N",
      },
      editor: {
        type: "check", // ✅ 클릭하면 체크 상태 토글 가능
        trueValues: "Y",
        falseValues: "N",
      }
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
    {
      fieldName: "PLACE_SEQ",
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const initCodeList = async () => {
  const res = await Promise.all([
    getCodeList('HHII806'), // 도수보안경
  ])
  codeList.REQ_CHA = res[0].ORESULT_CUR;
}

const getEyesightPlace = async() => {
  await new queryFlowHelper(vm, t)
    .setQuery(() => searchData())
    .setAfter(afterSearch)
    .run()
}

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHC0020_SEARCH_05",
      param: {
        CMPNY_DIV : searchParams.CMPNY_DIV,
        YEAR      : searchParams.YEAR,
        REQ_DIV   : searchParams.REQ_DIV,
        REQ_CHA   : searchParams.REQ_CHA
      },
  });
};

const afterSearch = async (res) => {
  console.log('444',res)
  await grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

const openPopup = async (userData) => {
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  searchParams.YEAR = userData.YEAR
  searchParams.REQ_DIV = userData.REQ_DIV
  searchParams.REQ_CHA = userData.REQ_CHA
  await initCodeList();
  await getEyesightPlace();
  dialog.value = true
}

const closePopup = () => {
  dialog.value = false

  searchParams.YEAR = new Date().getFullYear()
  searchParams.REQ_DIV = 'A'
  searchParams.REQ_CHA = (new Date().getMonth()+1).toString()
  grdMain.value.getDataProvider().clearRows();
}

const saveEyesightPlace = () =>{
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(afterSave)
    .run();
}

const beforeSave = () =>{
  return true
}

const saveData = () =>{
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true);
  let saveParam = [];

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      YEAR: data.YEAR,
      REQ_DIV: data.REQ_DIV,
      REQ_CHA: data.REQ_CHA,
      PLACE_SEQ: data.PLACE_SEQ,
      USE_YN: data.USE_YN,
      USER_ID   : userStore.userId
    };
    saveParam.push(saveData);
  }

  return commonExecuteApi({
      queryId: "HLTHC0020_SAVE_01",
      list: saveParam,
    });
}

const afterSave = () =>{
  getEyesightPlace();
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    saveEyesightPlace()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

onMounted(() => {

})

defineExpose({
  openPopup,
})
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
      <span>시력검사장소 관리</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0" >
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate','btnClose']"
          @click-button="onButtonsClick"
          :usePermission="true"
        />
      </v-card-title>
      <v-card-text class="pa-4 pb-0 pt-0">
        <div class="d-flex flex-gap searchArea">
          <i-select
              v-model="searchParams.YEAR"
              :label="$t('해당년도')"
              label-width="50px"
              type="YEAR"
              class="custom-flex-1"
            />
          <div class="custom-flex-1 d-flex">
            <i-label class="flex-grow-1 d-flex">
              <span
                class="form-label pr-2 pt-2"
                :style="{
                  display: 'block',
                  width: '60px',
                  margin: '0 8px 0 0',
                }"
              >
                {{ $t("구분") }}
              </span>
              <v-radio-group
                v-model="searchParams.REQ_DIV"
                inline
                class="radioStyle"
              >
                <v-radio
                  v-for="item in codeList.REQ_DIV"
                  :key="item"
                  :value="item.COD"
                  :label="item.TXT"
                />
              </v-radio-group>
            </i-label>
          </div>
          <i-select
                v-model="searchParams.REQ_CHA"
                :label="$t('신청시기')"
                label-width="50px"
                :items="codeList.REQ_CHA"
                item-value="COD"
                item-title="TXT"
                class="custom-flex-1"
              />
          <span class="custom-flex-1" />
        </div>
      </v-card-text>
      <v-card-text class="pa-2 pt-0">
        <div class="d-flex" :style="{ height: '500px' }">
          <v-sheet  class="h-auto pa-2 pt-0 custom-flex-1">
            <RealGrid
              ref="grdMain"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
  .form-row {
    display: flex;
    flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
    gap: 10px; /* 요소 간격 */
  }

  .image-container {
    display: flex;
    max-width: 100%;
    height: 300px;
    align-items: stretch;
    gap: 10px;
  }
  
.image-item {
  flex: 1;
  width: 0;
  flex-basis: 0;
  height: 100%;
}
/* overflow: hidden; */

.image-item span {
  display: block;
  text-align: center;
  line-height: 300px;
}

.viewer-img {
  width: 100%;
  height: 100%;
}

.flex-gap {
  gap: 20px;
  flex-wrap: wrap;
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.radioStyle {
  padding-left: 5px;
  height: 35px;
  background-color: rgb(255, 255, 255);
  border: 1px solid;
  border-radius: 2px;
  border-color: #e0e0e0; //#CCCCCC;
  // width: 80%;
  font-size: x-small;
  display: flex;
  align-items: center;
}

</style>