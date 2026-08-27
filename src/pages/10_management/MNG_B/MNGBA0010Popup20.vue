<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'

defineOptions({
})

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t

const menuTitle = ref(null)
const grdMain = ref(null)
const dialog = ref(false)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  FROM_DT: dayjs().format('YYYY') + '-01-01',
  TO_DT: dayjs().format('YYYY-MM-DD'),
  CLSS_CD: '',
})

const codeList = reactive({
  BSNS_CD: [],
  CLSS_CD: [
    { COD: '', TXT: '전체' },
    { COD: '60', TXT: '직책과장' },
    { COD: '70', TXT: '생산팀장' },
  ],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ 
      queryId: 'searchBSNS', 
      param: { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      }, 
    }),
  ]).then(res => {
    codeList.BSNS_CD = res[0].ORESULT_CUR    
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
  })
}

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false }, 
    edit: { editable: false },
    header: { height: 45 },
  },
  keys : [],
  fields : [ 
    { fieldName: 'GBN', dataType: 'text', header: { text: t('구분') }, },
    { fieldName: 'GRADE_A', dataType: 'text', header: { text: t('우수\n(90점 이상)'), styleName: 'multiline-editor', },
      styleName: 'multiline-editor', editor: { type: 'multiline' }, },
    { fieldName: 'GRADE_B', dataType: 'text', header: { text: t('양호\n(80 ~ 90점)'), styleName: 'multiline-editor', },
      styleName: 'multiline-editor', editor: { type: 'multiline' }, },
    { fieldName: 'GRADE_C', dataType: 'text', header: { text: t('보통\n(70 ~ 80점)'), styleName: 'multiline-editor', },
      styleName: 'multiline-editor', editor: { type: 'multiline' }, },
    { fieldName: 'GRADE_D', dataType: 'text', header: { text: t('미흡\n(70점 미만)'), styleName: 'multiline-editor', },
      styleName: 'multiline-editor', editor: { type: 'multiline' }, },
  ],
  columns : [],
  columnLayout: [],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if(btn.id === 'btnClose'){
    onClose()
  }
}

const searchData = async () => {
  return commonSearchApi({ queryId : 'MNGBA0010_SEARCH_POPUP20', param: searchParams }) 
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {
  initCodeList()
  onButtonsClick({id: 'btnSearch'})
  dialog.value = true 
}

onMounted(() => {
  vm.$nextTick(() => {
    // grdMain.value.getGridView().setDisplayOptions({
    //   fitStyle: 'none',
    // })
  })
})

defineExpose({
  openPopup,
})
</script>


<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="860"
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
      <span>{{'관리감독자 안전평가 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-1 fill-height">
      <v-card-title class="pa-3 pb-0">
          <IMenuTitle
            ref="menuTitle"
            :title="$t('관리감독자 안전평가')"
            :button-list="['btnSearch', 'btnClose']"
            @click-button="onButtonsClick"
          />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet height="100%" style="display: flex; flex-direction: row;">
            <v-sheet width="100%" style="padding-right: 5px;">
              <v-sheet class="searchArea" style="display: flex; flex-direction: row;">
                <v-sheet style="display: flex; flex-direction: row;">
                  <i-input
                    v-model="searchParams.FROM_DT"
                    type="date"
                    :label="$t('기간')"
                    width="180px"
                    labelWidth="30px"
                    margin="10px"
                  />
                  <i-input
                    v-model="searchParams.TO_DT"
                    width="160px"
                    labelWidth="10px"
                    :label="$t('~')"
                    type="date"
                  />
                  <i-select
                    :label="$t('사업부')"
                    width="200px"
                    margin="12px"
                    placeholder="사업부"
                    v-model="searchParams.BSNS_CD"
                    :items="codeList.BSNS_CD"
                    item-value="BSNS_CD"
                    item-title="BSNS_NM"
                  />
                  <i-select
                    :label="$t('직책')"
                    width="200px"
                    v-model="searchParams.CLSS_CD"
                    :items="codeList.CLSS_CD"
                    item-value="COD"
                    item-title="TXT"
                  />
              </v-sheet>
            </v-sheet>
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
              />
          </v-sheet>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card> 
</VDialog>
</template>
    

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 500px);
  overflow-y: auto;
  > div {
    min-height: 400px;
  }
}
</style>