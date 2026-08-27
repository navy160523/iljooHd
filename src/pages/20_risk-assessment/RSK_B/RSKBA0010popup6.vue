<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import RealGridFactory from '@/utils/realgrid2'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'

//****************************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const parentData = ref(null)
const emit = defineEmits(['selected'])
const deptPopup = ref(null)

//코드리스트 셋팅
const codeList = ref({
  DIVISION : [],
  MORGN_NM: [],
  HALF: [
    { COD: "1", TXT: "상반기" },
    { COD: "2", TXT: "하반기" },
  ],
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  HALF: (dayjs().get("month") + 1) <= 6 ? '1' : '2',

  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  ASGN_FULL_NM: userStore.deptNm,
})


//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } }, 
  fields : [
    { fieldName: "WORK_STANDARD_NM", dataType: 'text', width: '100', editable: false, header: { text: t('작업표준명') } },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', width: '150', editable: false, header: { text: t('작업표준ID') }, styleName: 'left-column'  },
    { fieldName: 'LOOK_OVER_RESULT', dataType: 'text', width: '200', editable: false, header: { text: t('검토결과') }, styleName: 'left-column'  },
    { fieldName: 'MEETING_DATE', dataType: 'text', width: '100', editable: false, header: { text: t('회의일시') } },    
    
    //출력 안함
    { fieldName: 'CURR_ID', dataType: 'text', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//****************************************세팅 영역(종료)***************************************************/

//****************************************오픈 팝업***************************************************/
const openPopup = gbn => {

  if(gbn === '부서조회'){
    deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.ASGN_NM })
  } 
  else if(gbn === 'click'){
    deptPopup.value.openPopup({})
  }
  
  //팝업 오픈
  dialog.value = true
}

//****************************************오픈 팝업(종료)***************************************************/

//****************************************이벤트 영역***************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

//추가 버튼 이벤트
const onAddButtonClick = () => {
  var row = grdMain.value.getGridView().getCheckedRows(true)
  if(row.length === 0) return
  var checkedRowList= []
  for(let i = 0; i < row.length; i++){
    checkedRowList.push(grdMain.value.getDataProvider().getJsonRow(row[i]))
  }
  emit("selected", checkedRowList)
  onClose()
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const yearChange = async e => {
  searchParams.YEAR = await searchParams.YEAR.replace(korean, '')
  if(searchParams.YEAR.length > 4){
    searchParams.YEAR = await searchParams.YEAR.slice(0, 4)
  }
}


//****************************************이벤트 영역(종료)***************************************************/

//****************************************조회 영역***********************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {  
  if(searchParams.DEPT_CD === null || searchParams.DEPT_CD === undefined){
    Message.warn(t('부서를 선택해주시기 바랍니다.'))
  }else{
    return true
  } 
}

// 위험성평가 회의이력(전체) 조회
const searchData = () =>{  
  return commonSearchApi({ queryId : 'RSKBA0010_SEARCH_25', param: searchParams })  
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


const onDeptSelected = val => {

  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
  searchParams.ASGN_FULL_NM = val.ASGN_FULL_NM
  onButtonsClick({ id: 'btnSearch' })
}


//****************************************조회 영역(종료)***************************************************/


defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog 
    v-model="dialog" 
    persistent 
    width="1300"
    class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <div 
      class="title-bar"
      @mousedown="startDragging"
    >
      위험성평가 회의이력
    </div>
    <VContainer style="background-color: white;">
      <VRow>
        <VCol>
          <IGridTitle
            :use-permission="false"
            :button-list="['btnSearch', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>

      <!-- 조회조건 -->
      <VRow>
        <VCol>
          <VForm
            ref="searchArea"
            class="searchArea"
          >
            <VRow>
              <!-- <VCol cols="12" md="3">
                <ILabel
                    :label="$t('사업부')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VAutocomplete
                        v-model="searchParams.DIVISION"
                        :items="codeList.DIVISION"
                        item-title="TXT"
                        item-value="COD"
                      />
                    </template>
                  </ILabel> 
              </VCol> -->
              <VCol cols="12" md="2">
                <ILabel
                    :label="$t('기준년도')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        v-model="searchParams.YEAR"
                        type="Number"
                        oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '')"
                        @update:modelValue="yearChange"
                      />
                    </template>
                  </ILabel> 
              </Vcol>
              <VCol cols="12" md="7">
                <ILabel
                    :label="$t('부서/ 협력사')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VRow no-gutters>
                        <VCol cols="3 pr-1">
                          <VTextField 
                            v-model="searchParams.ASGN_NM" 
                            append-inner-icon="mdi-magnify" 
                            @keydown.enter="e => {
                              openPopup('부서조회')
                            }"
                            @update:modelValue="e => { searchParams.DEPT_CD = null }"
                            @click:appendInner="openPopup('click')"
                          />
                        </VCol>   
                        <VCol cols="2">
                          <VTextField 
                            v-model="searchParams.DEPT_CD" 
                            readonly
                          />
                        </VCol>                   
                        <VCol cols="7">
                          <VTextField
                            class="ml-3"
                            v-model="searchParams.TEXT"
                            :placeholder="t('검색어를 입력하세요.')"
                          />
                        </VCol>                        
                      </VRow>
                    </template>      
                  </ILabel>
              </VCol>  
              <VCol cols="12" md="3">
                <ILabel
                    :label="$t('반기')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VAutocomplete
                        v-model="searchParams.HALF"
                        :items="codeList.HALF"
                        item-title="TXT"
                        item-value="COD"
                      />
                    </template>
                  </ILabel> 
              </VCol>              
            </VRow> 
            <VRow>              
              
              
            </VRow>
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
            style="height: 500px;"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields" 
            :columns="grdMainProps.columns"
          />
        </VCol>
      </VRow>
      <!-- /메인그리드 -->
    </VContainer>
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>