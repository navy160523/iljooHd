<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import {commonSearchApi} from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import {startDragging,handleDragging,stopDragging} from "@/utils/useDrag.js"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(null)
const grdMain = ref(null)

const props = defineProps({
  codeList: {
    Type: Object,
    default: {},
  },
})

const searchParams = reactive({
  YEAR: userStore.cmpnyDiv,
  BSNS_CD: '',
  HARF: '',
  GBN: 'A'
})

// 팝업 오픈 함수
const openPopup =  val => {
  for (const [key, value] of Object.entries(val)) {
    searchParams[key] = value
  }
  if(val.HARF === 'A'){
    grdMain.value.getDataProvider().setFields(grdMainProps.fields)
    grdMain.value.getGridView().setColumns(grdMainProps.fields)
    grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)
  }else {
    grdMain.value.getDataProvider().setFields(grdMainProps.fields2)
    grdMain.value.getGridView().setColumns(grdMainProps.fields2)
    grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout2)
  }
  dialog.value = true
  onButtonsClick({id: 'btnSearch'})
}


const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, header: { height: 60 }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', width: '200', header: { text: t('부서'), styleName: 'multiline-editor' } },   
    { fieldName: 'M12', dataType: 'text', width: '120', header: { text: t('12월') } },
    { fieldName: 'M01', dataType: 'text', width: '120', header: { text: t('1월') } },
    { fieldName: 'M02', dataType: 'text', width: '120', header: { text: t('2월') } },
    { fieldName: 'M03', dataType: 'text', width: '120', header: { text: t('3월') } },
    { fieldName: 'M04', dataType: 'text', width: '120', header: { text: t('4월') } },
    { fieldName: 'M05', dataType: 'text', width: '120', header: { text: t('5월') } }, 
    { fieldName: 'DESC', dataType: 'text', width: '120', header: { text: t('비고') } },
  ],
  columns : [],
  columnLayout: [
    'DEPT_NM', 
    {
      name: '협의회 운영 실적',
      direction: 'horizontal',
      items: [ 'M12', 'M01', 'M02', 'M03', 'M04', 'M05' ],
    },
    'DESC',
  ],
  fields2 : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', width: '200', header: { text: t('부서'), styleName: 'multiline-editor' } },   
    { fieldName: 'M06', dataType: 'text', width: '120', header: { text: t('6월') } },
    { fieldName: 'M07', dataType: 'text', width: '120', header: { text: t('7월') } },
    { fieldName: 'M08', dataType: 'text', width: '120', header: { text: t('8월') } },
    { fieldName: 'M09', dataType: 'text', width: '120', header: { text: t('9월') } },
    { fieldName: 'M10', dataType: 'text', width: '120', header: { text: t('10월') } },
    { fieldName: 'M11', dataType: 'text', width: '120', header: { text: t('11월') } }, 
    { fieldName: 'DESC', dataType: 'text', width: '120', header: { text: t('비고') } },
  ],
  columnLayout2: [
    'DEPT_NM', 
    {
      name: '협의회 운영 실적',
      direction: 'horizontal',
      items: [ 'M06', 'M07', 'M08', 'M09', 'M10', 'M11' ],
    },
    'DESC',
  ],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()    
  }else {
    onClose()
  }
}

const onClose = () => {
  grdMain.value.getDataProvider().setRows([]) 
  dialog.value = false  
}

// 조회
const searchData = () => { 
 return commonSearchApi({ queryId: "SAFIF0020_POP01_SEARCH_01", param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const gbnChange = e => {
  searchParams.BSNS_CD = ''
  grdMain.value.getDataProvider().setRows([])
}

onMounted(() => {
})

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1200"
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
      <span>협력사 안전보건 협의회 이행 실적 상세</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-2">
        <IGridTitle
          :use-permission="false"
          :title="$t('')"
          :button-list="['btnSearch','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 상세 -->
      <v-card-text class="pa-4 pt-0 mt-2 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <div class="d-flex align-center mr-3">
                <div class="formLabelText mr-5">
                  {{ $t('구분') }}
                </div>
                <VRadioGroup
                  v-model="searchParams.GBN"
                  inline
                  @change="gbnChange"
                >
                  <VRadio
                    v-for="(item , i) in props.codeList.GBNList"
                    :key="i"
                    :value="item.COD"
                    :label="item.TXT"
                  />
                </VRadioGroup>
              </div>
              <i-select 
                :label="$t('')"
                width="200px"
                :items="searchParams.GBN === 'A' ? props.codeList.BSNSList : props.codeList.BSNSList2"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                v-model="searchParams.BSNS_CD"
              />
            </div>           
          </v-sheet>
          <v-sheet height="30%" class="h-auto">
            <RealGrid
              ref="grdMain"
              height="300px"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
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
  height: calc(100vh - (530px));
  overflow-y: auto;
  > div {
    min-height: 400px;
  }
}
</style>