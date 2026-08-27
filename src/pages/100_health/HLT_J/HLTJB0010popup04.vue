<!-- 
  화면명 : 업무상질병 작업표준 지정
  화면개요 : 업무상질병 작업표준을 지정한다.
-->
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList , commonUploadFilesApi, commonRskApi } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'

const t = useI18n().t //다국어
const emit = defineEmits(['selected','closed'])
const menuTitle = ref(null)
const dialog = ref(false)
const grdMain = ref(null) //표준서명
const selectWork = ref([])
const workStandardList = ref([])
const workStandardFilterList = ref([])

const searchParams = reactive({  
  WORK_STANDARD_NM : '',
  BSNS_CD : '',
  BSNS_NM : '',
  DEPT_CD : '',
  DEPTH_ASGN_NM: '',
  DEPT_NM: '',
  IMG_CHECK : 'Y', 
})

// 데이터 바인딩
const saveForms =ref(null)

//  팝업 관련
const openPopup = (param)=> {
  selectWork.value = ''
  if(!isEmpty(param)){

    searchParams.BSNS_NM = param.BSNS_NM
    searchParams.DEPT_NM = param.DEPT_NM

    if(!isEmpty(param.WORK_STANDARD_ID)) {
      selectWork.value = param.WORK_STANDARD_ID.split('||')
    }
    commonSearchApi({ queryId: "RSKBA0010_SEARCH_17", param: { DEPT_CD : param.DEPT_CD }  }).then( res => {        
      grdMain.value.getDataProvider().setRows()
      if (res.ORESULT_CUR.length > 0) {
        workStandardList.value = res.ORESULT_CUR
        grdMain.value.getDataProvider().setRows(workStandardList.value)
        for(let i = 0; i < workStandardList.value.length; i++) {
          if(selectWork.value.includes(workStandardList.value[i].WORK_STANDARD_ID)) {
            grdMain.value.getGridView().checkRow(i, true, false, false)
          }
        }
      }    
    })
  } 
  
  dialog.value = true 
}

// 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    edit: { editable:false },
    checkBar: { visible:true }, 
    header: { visible: true },
    filterPanel: {visible: true},
  },
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_NM',  dataType: 'text', visible:false },
    { fieldName: 'GUBUN_NM',  dataType: 'text', header: { text: t('구분') } ,lookupDisplay: true },
    { fieldName: 'WORK_STANDARD_NM',  dataType: 'text', header: { text: t('작업표준명') } },    
    { fieldName: 'WORK_DATE', dataType: 'datetime',  datetimeFormat: 'yyyy-MM-dd', header: { text: t('제/개정일자') ,editor: { datetimeFormat: 'yyyy-MM-dd' } } },
    { fieldName: 'WORK_STANDARD_ID',  dataType: 'text', header: { text: t('작업표준ID') } },    
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//버튼
const onButtonsClick = async btn => {
  
  if (btn.id === 'btnRskCopyApp') {
    let params = []
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    for(let chk of checkRow) {
      let data = grdMain.value.getDataProvider().getJsonRow(chk)
      params.push(data)
    }
    emit('selected', params)
    onButtonsClick({id: 'btnClose'})
  } else if (btn.id === 'btnClose') {
    searchParams.divGbn = '1'    
    searchParams.DEPT_NM = ''
    searchParams.WORK_STANDARD_NM = ''
    searchParams.DEPTH_ASGN_NM = ''
    emit('closed', 'closed')
    dialog.value = false    
  }
}

// 작업표준명 검색 필터링
const workStandardNmFilter = () => {
  grdMain.value.getDataProvider().setRows([])
  workStandardFilterList.value = workStandardList.value.filter(item => {
    return item.WORK_STANDARD_NM.trim().toLowerCase().includes(searchParams.WORK_STANDARD_NM.trim().toLowerCase())
  })
  grdMain.value.getDataProvider().setRows(workStandardFilterList.value)
  for(let i = 0; i < workStandardFilterList.value.length; i++) {
    if(selectWork.value.includes(workStandardFilterList.value[i].WORK_STANDARD_ID)) {
      grdMain.value.getGridView().checkRow(i, true, false, false)
    }
  }
}

defineExpose({
  openPopup
})

</script>

<template>
    
  <VDialog v-model="dialog"  persistent width="1500"  height="1200"
    class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >    
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
    작업표준적용
    </div>
    <VContainer style="background-color: white;">
      <VForm ref="saveForms">
      <!-- 최상단 -->
        <VRow class="my-1">                                     
          <VCol cols="12">            
            <IMenuTitle
              ref="menuTitle"
              :use-permission="false"
              :button-list="['btnRskCopyApp', 'btnClose']"
              @click-button="onButtonsClick"
            >            
            </IMenuTitle>
          </VCol>
        </VRow>
        <v-row style="overflow-x: hidden; overflow-y: auto;">          
          <VRow class="popUp-input-Form fill-height">
          <!-- 첫번째 --> 
            <v-col cols="12">
              <v-row style="align-items: flex-end;">                            
                <VCol cols="12" md="12">                                  
                  <v-row>
                    <v-col cols="2">
                      <ILabel
                        :label="$t('사업부')" 
                        labelLoc="top"
                        >
                        <template #editor="editorProps">
                          <VTextField 
                            v-model="searchParams.BSNS_NM" 
                            readonly
                          />
                        </template>      
                      </ILabel>
                    </v-col>                  
                    <v-col cols="2">
                      <ILabel
                        :label="$t('부서')" 
                        labelLoc="top"
                        >
                        <template #editor="editorProps">                                                    
                          <VTextField 
                            v-model="searchParams.DEPT_NM"
                            readonly
                          />
                        </template>      
                      </ILabel>
                    </v-col>
                    <v-col cols="2">
                      <ILabel
                        :label="$t('작업표준명')" 
                        labelLoc="top"
                        >
                        <template #editor="editorProps">                                                    
                          <VTextField 
                            v-model="searchParams.WORK_STANDARD_NM"
                            @input="workStandardNmFilter"
                            @keydown="workStandardNmFilter"
                          />
                        </template>      
                      </ILabel>
                    </v-col>
                  </v-row>                  
                </VCol>               
              </v-row>
            </v-col> 
            <v-col cols="12">
              <v-row>                                             
                <VCol cols="12" md="12">
                  <RealGrid
                    ref="grdMain"
                    class="mt-2"
                    style="height: 534px;"
                    :grid-view-option="grdMainProps.gridViewOption"
                    :keys="grdMainProps.keys" 
                    :fields="grdMainProps.fields"
                    :columns="grdMainProps.columns"  
                  />
                </VCol>
              </v-row> 
            </v-col>
          </VRow>
        </v-row>
      </VForm>
    </VContainer>
  </VDialog>

</template>


<style scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }

</style>
