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
const searchText = ref("")

// 구분 조직도 그리드
const grdMainProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } },
  keys : ['COMP_CODE'],
  field : [
    { fieldName: 'COMMID', dataType: 'text', visible: false },
    { fieldName: 'COMPCODE', dataType: 'text', visible: false },
    { fieldName: 'BIZCODE', dataType: 'text', visible: false },    
    { fieldName: 'BIZUNIT', dataType: 'text', visible: false },    
    { fieldName: 'NAMEPATH', dataType: 'text', visible: false },    
    { fieldName: 'CODEPATH', dataType: 'text', visible: false },    
    { fieldName: 'CODENM', dataType: 'text', header: { text: t('코드명') }},
    { fieldName: 'HIDDENFIELD', dataType: 'text', visible: false },
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
    //onButtonsClick({ id : 'btnSearch' })
})

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      //.setGridList([grdMain])
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
  return commonSearchApi({ queryId : 'CommCodeTreeListELEC', param : { } })
}

// 조회로직
const afterSearchGubun = (res) => {
  console.log('ress',res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, 'COMMID')
}


/*메뉴버튼 조회*********************************************/

defineExpose({
  openPopup,
})

const onSelect = (grd,data) => {
  let pushArr = []
  let innerData = []
  // if(data.cellType === 'data'){

  let index = grdMain.value.getGridView().getCurrent().dataRow
  let row = grdMain.value.getDataProvider().getJsonRow(index)
  let children = grdMain.value.getDataProvider().getChildCount(index)
  console.log('children', children)

  if (children > 0) {
    return Message.warn('자세한 분류까지 선택해 주십시오') 
  }else{
    emit('selected', row)
    dialog.value = false
  }    
  // }
}


const onClose = () => {
  dialog.value = false
}

let ary = []

const onCellDblClicked  = (grd, data) =>{

  let index = grdMain.value.getGridView().getCurrent().dataRow
  let row = grdMain.value.getDataProvider().getJsonRow(index)
  let children = grdMain.value.getDataProvider().getChildCount(index)
  //console.log('grd = ', grd)
  //console.log('data = ', data)
  //console.log('row = ', row)

  //console.log('index    = ', index)
  //console.log('data.index = ', data.itemIndex)
  
  
  if (children > 0) {

    if(ary[data.itemIndex] == null)
    {
      ary[data.itemIndex] = 'expand'

    // 선택한 노드가 부모이면 펼치기
    grdMain.value.getGridView().expand(data.itemIndex)
    }
    else
    {
      ary[data.itemIndex] = null
      // 선택한 노드가 부모이면 접기
      grdMain.value.getGridView().collapse(data.itemIndex)
    }



    //var current = grdMain.value.getGridView().getCurrent()
    //grdMain.value.getGridView().expand(current.itemIndex)
    
    //선택 노드 펼치기
    //grdMain.expand(current.itemIndex, recursive, force)
    //return Message.warn('자세한 분류까지 선택해 주십시오') 
  }else{
    console.log('row = ', row)
    emit('selected', row)
    dialog.value = false
  }    
  
}

let cc = 0
const ttt = (index) => {

  let children = grdMain.value.getDataProvider().getChildCount(index)

  console.log('index = ', index)

  if(children > 0)
  {
    grdMain.value.getGridView().expand(index)

    let children2 = grdMain.value.getDataProvider().getChildCount(index+1)

    if(children2 > 0)
      ttt(index + 1)
    //grdMain.value.getDataProvider().getJsonRow(index+1)
  }
}

const ExpandAll = (index) => {
  
  let children = grdMain.value.getDataProvider().getChildCount(index)

  console.log('index', index)
  console.log('childern = ', children)

  if(children > 0)
  {
    grdMain.value.getGridView().expand(index)

    for(var i=index+1; i<index+children; i++)
    {
      ExpandAll(i)
    }
  }
}

const SearchGrd = () => {
  let gridView = grdMain.value.getGridView()

  let idx = 0
  let ret = grdMain.value.getDataProvider().searchData({
    fields: ['CODENM'],
    value: searchText.value,
    partialMatch: true,
  })
  if (ret == null) {
    gridView.collapseAll()
    return Message.warn("검색된 결과가 없습니다.")
  }
  while (ret != null) {
    if (ret) {
      idx = ret.dataRow
      var rowId = ret.dataRow
      var parents = grdMain.value.getDataProvider().getAncestors(rowId)
      if (parents) {
        gridView.expand(parents, false, true)
        for (var i = parents.length - 1; i >= 0; i--) {
          gridView.expand(gridView.getItemIndex(parents[i]))
        }

        // 찾은 row 포커싱
        gridView.setCurrent({
          itemIndex: gridView.getItemIndex(rowId),
          fieldIndex: ret.fieldIndex,
        })

        // 찾은 row 히든필드에 값넣기 HIDDENFIELD
        grdMain.value
          .getDataProvider()
          .setValue(rowId, "HIDDENFIELD", searchText.value)

        // 찾은 값들을 강조하기
        grdMain.value
          .getGridView()
          .setRowStyleCallback(function (grid, item, fixed) {
            var retVal = {}

            var val = grid.getValue(item.index, "HIDDENFIELD")

            if (val === searchText.value) {
              retVal.style = { background: "#D9E5FF" }
            }

            return retVal
          })
      }
      ret = grdMain.value.getDataProvider().searchData({
        fields: ['CODENM'],
        value: searchText.value,
        partialMatch: true,
        startIndex: idx + 1,
        wrap: false,
      })
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
    width="500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">구분 검색</div>
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
        <i-input
          v-model="searchText"
          @keypress.enter="SearchGrd"
          width="480px"
          :label="t('검색')"
        />
      </VRow>
      <!-- /조회조건 -->

      <!-- 메인그리드 -->
      <VRow>
        <VCol>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 500px"
            :is-tree="true"
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