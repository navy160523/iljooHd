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
  FILE_ID: "",
});

const iamageParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FILE_ID: "",
  FILE_NO: "",
  FILE_TITLE: "",
  FILE_NAME_ORIGINAL: "",
  FILE_NAME: "",
  FILE_PATH: "",
  FILE_TYPE: "",
  FILE_SIZE: "",
  USER_ID: "",
});

const imageField = reactive({
  files: '',
  images: '',
});

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    {
      fieldName: 'TXT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('안전화 종류') },
      styleName: "left-column",
    },
    {
      fieldName: 'FILE_ID',
      visible: false,
      header: { text: t("FILE_ID") },
    },
    
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const getShoesKind = async() => {
  await new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHA0020_SEARCH_SHOES",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
  });
};

const afterSearch = async (res, auto = true) => {
  await grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

const openPopup = () => {
  dialog.value = true
  getShoesKind();
}

const closePopup = () => {
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const onCellClicked = async (grid, clickData) => {
  const fileId = grdMain.value.getDataProvider().getValue(clickData.itemIndex, 'FILE_ID')

  searchParams.FILE_ID = fileId
  imageField.images = ''
  const res = await commonSearchApi({
    queryId: "searchFile",
    param: searchParams,
  })
  if (res.ORESULT_CUR.length < 1) {
    imageField.images = ''
    return
  }
  const res2 =  await commonDownloadFilesApi(res.ORESULT_CUR[0])
   if(res2){
      const blob = new Blob([res2])
      imageField.images = URL.createObjectURL(blob)
    }else{
      imageField.images = ''    
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
      <span>안전화 디자인 조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0" >
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
          :use-permission="true"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0">
      <div class="d-flex mt-2" :style="{ height: '300px' }">
        <v-sheet  class="h-auto pa-2 pt-0 custom-flex-2">
          <RealGrid
            ref="grdMain"
            :gridViewOption="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
        <!-- :width="1000" -->
        <v-sheet  class="h-auto pa-2 pt-0 custom-flex-1">
            <v-viewer class="image-item">
              <img
                :key="index"
                :src="imageField.images"
                class="viewer-img"
                style="cursor: pointer; border: 1px solid #F4F5F9; border-radius: 7px;"
              />
            </v-viewer>
        </v-sheet>
      </div>
    </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped>
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


</style>