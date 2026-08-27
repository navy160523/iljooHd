<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n"
import { commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'

defineOptions({
  name:'00_sample-TestLKH',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const grdMainTitle = ref(null)
const searchArea = ref(null)

//조회조건
const searchParam = reactive({  
  OWNER: 'XS01',
  TABLE_TYPE: 'TABLE',
  TABLE_NAME: '',
})

//상세내역 리스트
const detailList = reactive({ 
  OWNER: 'XS01', 
  TABLE_NAME: '',
  COMMENTS: '',  
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 30 }, stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'TABLE_NAME', dataType: 'text',  
      header: { text: t('TABLE') }, styleName: 'center-column', editable: false },    
    { fieldName: 'COMMENTS', dataType: 'text',
      header: { text: t('Comments') }, styleName: 'left-column', editable: false  },    
  ],
  columns : [],
  columnLayout: [
    'TABLE_NAME', 
    'COMMENTS',    
  ],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { header: { height: 30 }, stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'COLUMN_NAME', dataType: 'text',  
      header: { text: t('Name') }, styleName: 'left-column', editable: false },
    { fieldName: 'DATA_TYPE', dataType: 'text',  
      header: { text: t('Type') }, styleName: 'center-column', editable: false },    
    { fieldName: 'CHAR_LENGTH', dataType: 'text',  
      header: { text: t('Length') }, styleName: 'right-column', editable: false },
    { fieldName: 'NULLABLE', dataType: 'text',  
      header: { text: t('Nullable') }, styleName: 'center-column', editable: false },
    { fieldName: 'COMMENTS', dataType: 'text',
      header: { text: t('Comments') }, styleName: 'left-column', editable: false  },    
  ],
  columns : [],
  columnLayout: [
    'COLUMN_NAME', 
    'DATA_TYPE', 
    'CHAR_LENGTH', 
    'NULLABLE', 
    'COMMENTS',    
  ],
})

grdSubProps.columns = grdSubProps.fields

// 그리드 row 변경시 반영
const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
  if(newIdx === -1){
    grdMain.value.getDataProvider().setRows()
    clearDetail()
    return
  }
  clearDetail()
  var selectedRow = []
  selectedRow.push(grdMain.value.getDataProvider().getJsonRow(newIdx))

  detailList.TABLE_NAME = selectedRow[0].TABLE_NAME
  detailList.COMMENTS = selectedRow[0].COMMENTS

  commonSearchApi({ queryId : 'ADMAA0010_SEARCH_02', param: detailList }).then(res => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const onButtonsClick = async btn => {
  if (btn.id === "btnSearch") {
    grdMain.value.getDataProvider().setRows([])
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
}

const beforeSearch = async () => {  
  return true
}

const searchData = () => {
  clearDetail()

  return commonSearchApi({
    queryId: "ADMAA0010_SEARCH_01",
    param: searchParam,
  })  
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const clearDetail = () =>{
  detailList.TABLE = ''
  detailList.COMMENTS = ''
}
</script>

<template>
  <div>
    <VContainer class="pt-0">
      <div class="contentPanel">
        <VRow>
          <VCol>
            <IMenuTitle
              ref="menuTitle"
              :title="$t(useLogsStore().menuId)"
              :button-list="['btnSearch']"
              @click-button="onButtonsClick"
            />
          </VCol>
        </VRow>

        <!-- 조회조건 -->
        <VRow>
          <VCol>
            <VForm ref="searchArea" class="searchArea">
              <VRow>
                <VCol cols="12" md="2">
                <ILabel 
                  :label="$t('테이블명')"
                  @keydown.enter=" e => {
                    onButtonsClick({id:'btnSearch'})
                  }">
                  <template #editor="editorProps">                    
                    <VCol class="pl-3">
                      <VTextField v-model="searchParam.TABLE_NAME" />
                    </VCol>
                  </template>
                </ILabel>
              </VCol>
              </VRow>
            </VForm>
          </VCol>
        </VRow>
        <!-- /조회조건 -->

        <VRow no-gutters class="mt-3">
          <VCol cols="12" md="4" class="pr-3">
            <IGridTitle 
              ref="grdMainTitle"
              :title="$t('테이블리스트')"              
              >              
              <template #editors />
            </IGridTitle>            
            <RealGrid
              ref="grdMain"
              style="height:600px"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns" 
              :column-layout="grdMainProps.columnLayout"
              @onCurrentRowChanged="onCurrentRowChanged"
            />
          </VCol>
          <VCol cols="12" md="8" class="pl-3">
            <div 
              style="max-height: 650px; positon: reactive; overflow-y: auto; overflow-x: hidden" 
            >
              <IGridTitle :title="$t('상세정보')">
                <template #editors />
              </IGridTitle>
              <VForm>
                <VRow>
                  <VCol cols="6">
                    <ILabel
                      :label="$t('Table')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField 
                          v-model="detailList.TABLE_NAME"
                          readonly="true"
                        />
                      </template>
                    </ILabel>
                  </VCol>
                  <VCol cols="6">
                    <ILabel
                      :label="$t('Comments')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField 
                          v-model="detailList.COMMENTS"
                          readonly="true"
                        />
                      </template>
                    </ILabel>
                  </VCol>
                </VRow>                
              </VForm>                       
              <RealGrid
                ref="grdSub"
                style="height:530px;margin-top:10px;"
                :grid-view-option="grdSubProps.gridViewOption"
                :keys="grdSubProps.keys" 
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns" 
                :column-layout="grdSubProps.columnLayout"                
              />
            </div>
          </VCol>
        </VRow>

      </div>
    </VContainer>
  </div>  
</template>
