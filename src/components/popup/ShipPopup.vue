<!--
  화면명 : 호선 검색
  화면개요 : 모든 호선을 검색한다.
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(["after-search"])
const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

/* 안전요원 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  GBN: '1',
  SEARCH: '',
})

const gbnList = reactive([
  {CD:'1', NM:'전체'},
  {CD:'2', NM:'호선코드'},
  {CD:'3', NM:'호선명'},
  {CD:'4', NM:'타입'},
  {CD:'5', NM:'종류'},
])

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: true } },
  keys : [],
  fields : [ 
    { fieldName: 'WORK_NO', dataType: 'text', width: '80', header: { text: t('호선 코드') }, editable: false },
    { fieldName: 'SHIP_NM', dataType: 'text', width: '120', header: { text: t('호선 명') }, styleName: 'left-column', editable: false },
    { fieldName: 'SHIP_TYPE', dataType: 'text', width: '100', header: { text: t('타입') }, visible : true },
    { fieldName: 'SHIP_CAPA', dataType: 'text', width: '80', header: { text: t('용량') }, visible : true },
    { fieldName: 'SHIP_KIND', dataType: 'text', width: '60', header: { text: t('종류') }, visible : true },

    { fieldName: 'LOCOD', dataType: 'text', width: '120', header: { text: t('LOCOD') }, visible : false },
    { fieldName: 'ODR', dataType: 'text', width: '120', header: { text: t('ODR') }, visible : false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  searchShip()
  dialog.value = true
}

const searchShip = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

//DB 조회
const searchMainData = () => {  
  return commonSearchApi({ queryId : 'SEARCH_SHIP', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    searchShip()
  } else if (btn.id === 'btnSelect') {
    onSelect()
  } else if (btn.id === "btnClose") {
    closePopup()
  }
}

// gird 더블 클릭 시 조회
const onCellDblClicked = (grid, clickData) => {
  onSelect(clickData)
}

// 데이터 선택 후
const onSelect = (clickData) => {
  if (grdMain.value.getGridView().getCurrent().dataRow === -1) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  }
  var rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  emit('selected', rtnData)
  closePopup()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  dialog.value = false
}

defineExpose({
  openPopup
})

onMounted(() => {
  
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="800"
    height="800"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>호선 검색</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4">
        <IGridTitle
          ref="menuTitle"
          :title="$t('호선 목록')"
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-2">
        <div class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-select
              v-model="searchParams.GBN"
              :label="$t('구분')"
              :items="gbnList"
              label-width="40px"
              width="250px"
              item-value="CD"
              item-title="NM" 
            />
            <i-input
              :label="$t('검색')"
              v-model="searchParams.SEARCH"
              label-width="40px"
              type="Text"
              width="250px"
              margin="10px"
              @keypress.enter="searchShip"
            />
          </div>
        </div>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area" style="width:100%; height:500px;">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 450px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
