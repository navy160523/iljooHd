<script setup>
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import RealGridFactory from '@/utils/realgrid2'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js"


const emit = defineEmits(['selected'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)

// 구분 조직도 그리드
const grdMainProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } },
  keys : ['CODE_ID'],
  field : [
    { fieldName: 'CODE_ID', dataType: 'text', visible: false },
    { fieldName: 'PARENT_CODE_NM', dataType: 'text', width: '40', header: { text: t('순위') } },
    { fieldName: 'CODE_NM', dataType: 'text', width: '50',header: { text: t('분류') } },
    { fieldName: 'CODE_DESC', dataType: 'text', header: { text: t('내용') } },    
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = popupParam =>
{
  onButtonsClick({ id : 'btnSearch' })
  //팝업 visible
  dialog.value = true
}

//초기 데이터셋팅
onMounted(() => {
  // window.addEventListener('mousemove', mouseUpdate)  
})

// 화면이 다 뜨고 난 뒤 자동으로 조직도 조회
onUpdated(() => {
  
})

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchGubun)
      .setAfter(afterSearchGubun)
      .showMessage(false)
      .run()
  }
  else if (btn.id === 'btnSelect') {
    onSelect()

  } 
  else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 조회로직
const searchGubun = () => {
  return commonSearchApi({ queryId : 'RSKBA0010_SEARCH_02', param : { TYPE : 'RM_CD' } })
}

// 조회로직
const afterSearchGubun = (res) => {  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  // grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, 'CODE_ID')
}


/*메뉴버튼 조회*********************************************/

defineExpose({
  openPopup,
})

const onSelect = (grd,data) => {

  let index = grdMain.value.getGridView().getCurrent().dataRow
  let row = grdMain.value.getDataProvider().getJsonRow(index)
  
  if (row === 0) {
    return Message.warn('데이터를 선택해 주십시오.') 
  }else{
    emit('selected', row)
    dialog.value = false
  }    

}


const onClose = () => {
  dialog.value = false
}

const onCellDblClicked  = (grd,data) =>{
  let pushArr = []
  let innerData = []
  if(data.cellType === 'data'){

    let index = grdMain.value.getGridView().getCurrent().dataRow
    let row = grdMain.value.getDataProvider().getJsonRow(index)
    
    if (row === 0) {
      return Message.warn('데이터를 선택해 주십시오.') 
    }else{
      emit('selected', row)
      dialog.value = false
    }     
  }
}


//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  let gapx = event.pageX-x.value
  x.value = event.pageX
  y.value = event.pageY
}
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    width="600"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">위험성 감소대책 검색</div>
    <VContainer style="background-color: white">
      <VRow>
        <VCol>
          <IGridTitle
            :use-permission="false"
            :button-list="['btnSelect', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>

      <!-- 조회조건 -->
      <VRow>
        <VCol>
          <VForm
            ref="searchArea"
            style="background-color: #fafafa"
            class="searchArea"
          >            
          </VForm>
        </VCol>
      </VRow>
      <!-- /조회조건 -->

      <!-- 메인그리드 -->
      <VRow>
        <VCol>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 500px"
            :gridViewOption="grdMainProps.gridViewOption"
            :fields="grdMainProps.field"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
            
          />
        </VCol>
      </VRow>
      <!-- /메인그리드 -->
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}

</style>