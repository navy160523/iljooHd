
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList , commonUploadFilesApi, commonRskApi } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { value } from 'lodash-es'
import Message from '@hiway/utils/notify'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RSKBA0010popup6 from './RSKBA0010popup6.vue'


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['closed'])
const menuTitle = ref(null)
const dialog = ref(false)
const grdMain = ref(null) //표준서명
const grdTreeMain = ref(null)
const grdTree = ref(null)
const grdSub = ref(null)
const saveParam = ref(null)
const rSKBA0010popup6 = ref(null) 
let divDept = ref(false)
let divWorkNm = ref(false)
const searchTreeNm = ref(null)

const popupParam = reactive({
  SaveData:{}
})

const codeList = reactive({
  displayGbn:[
    { COD:"1" ,TXT:"작업표준명" },
    { COD:"2" ,TXT:"조직도" },    
  ],
  partnerGbn:[
    { COD:"O" ,TXT:"직영" },
    { COD:"P" ,TXT:"협력사" },    
  ],
  deptCd: userStore.userDiv == 'A' ? userStore.deptCd : userStore.deptCd,
  bsnsCd: userStore.bsnsCd,   
  userId: userStore.userId,
})

const searchParams = reactive({  
  WORK_STANDARD_NM : '',
  DEPT_CD : '',
  divGbn : '1',
  partnerGbn : 'O',
  DEPTH_ASGN_NM: '',
  DEPT_NM: '', 
  IMG_CHECK : 'Y', 
})

// 데이터 바인딩
const saveForms =ref(null)

//  팝업 관련
const openPopup = (param )=>
{
  searchGbn()
  dialog.value = true 
}


//그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    edit: { editable:false },
    checkBar: { visible:true }, 
  },
  keys : [],
  fields : [ 
    
    { fieldName: 'GUBUN_NM',         dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('구분') }, lookupDisplay: true },
    { fieldName: 'WORK_STANDARD_NM', dataType: 'text', width: '110', styleName: 'left-column', header: { text: t('작업표준명') } },
    { fieldName: 'DEPT_NM',          dataType: 'text', width: '60', header: { text: t('소속') } },
    { fieldName: 'WORK_DATE',        dataType: 'datetime', width: '50', datetimeFormat: 'yyyy-MM-dd', header: { text: t('제/개정일자') ,editor: { datetimeFormat: 'yyyy-MM-dd' } } },
    { fieldName: 'WORK_STANDARD_ID', dataType: 'text', width: '100',header: { text: t('문서번호') } },
    { fieldName: 'null',             dataType: 'text', width: 'auto', styleName: 'center-column',  header: { text:' ' }, editable : false },
    { fieldName: 'WORK_STANDARD_NO', dataType: 'text', visible: false},
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 셋팅
const grdTreeProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } },
  keys : ['DEPTH_ASGN_CD'],
  fields : [ 
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'PRNT_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPTH_ASGN_NM', dataType: 'text', visible: false },
    { fieldName: 'DEPTH_ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'CODEPATH', dataType: 'text', visible: false },
    { fieldName: 'ASGN_FULL_NM',  dataType: 'text', visible: false },    
    { fieldName: 'ASGN_SHRT_NM',  dataType: 'text', header: { text: t(' ') } },    
    { fieldName: 'HIDDENFIELD', dataType: 'text', visible: false  },
  ],
  columns : [],
})

grdTreeProps.columns = grdTreeProps.fields

//그리드 셋팅
const grdSubProps = reactive({
  gridViewOption : { edit: { editable:false } },
  keys : [],
  fields : [ 
    { fieldName: 'CORP_NM',  dataType: 'text', header: { text: t('주관부서') } ,lookupDisplay: true },
    { fieldName: 'DEPT_CD',  dataType: 'text', visible: false },
    { fieldName: 'DEPT_NM',  dataType: 'text', header: { text: t('협력사명') } },    
  ],
  columns : [],
})

grdSubProps.columns = grdSubProps.fields

const grdTrMainProps = reactive({
  gridViewOption : { 
    edit: { editable:false },
    checkBar: { visible:true }, 
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

grdTrMainProps.columns = grdTrMainProps.fields


//조건검색에 따라 동적으로 화면 변경
const searchGbn = () => {
  let gbn = searchParams.divGbn
  if( gbn === '1' ){  
    divDept.value = false
    divWorkNm.value = true   
  }else if( gbn === '2' ){ 
    divDept.value = true
    divWorkNm.value = false
    onButtonsClick({ id :'btnTreeSearch' }) 
  }
}

const beforeSave = async () => {

  saveParam.value = []
  let result = true
  let chekedRow
  let isSame = false    
  let data
  // codeList.deptCd = 'A0001077'

  if(searchParams.divGbn == '1'){
    chekedRow = await grdMain.value.getGridView().getCheckedRows()    
  }else{
    chekedRow = await grdTreeMain.value.getGridView().getCheckedRows()    
  }

  if(chekedRow.length === 0){
    
    return Message.warn(t('복사할 작업표준이 없습니다.'))
    
  } else {

    chekedRow.forEach( val => {    
      
      if(searchParams.divGbn == '1'){
        data = grdMain.value.getDataProvider().getJsonRow(val)     
      }else{
        data = grdTreeMain.value.getDataProvider().getJsonRow(val)
      }
      
      saveParam.value.push(data)
      
      commonSearchApi({ queryId: "RSKBA0010_SEARCH_12", param: { DEPT_CD: codeList.deptCd, WORK_STANDARD_NM : data.WORK_STANDARD_NM } }).then( res => {

        if (res.OUT_DATA > 0) {

          isSame = true

          return false
        }          
      })

    })    
        
    if (isSame) {
        
      return Message.warn('현재 조직에 동일한 작업표준이 존재합니다.작업표준명 수정 후 저장하시기 바랍니다.')         

    } else {

      //saveParam.value.push(data)

    }
  }

  return result
}

const setTransMaster = res => {
  
  // 직영인 경우 부서코드, 협력사인 경우 조직코드
  let upDeptCd = userStore.userDiv == 'A' ? '' : userStore.deptCd
  let deptCd = userStore.userDiv == 'A' ? userStore.deptCd : userStore.asgnCd
  console.log('[표준 복사] ')
  console.log('CODE LIST = ', codeList)
  console.log('UP_DEPT_CD', upDeptCd)
  console.log('DEPT_CD = ', deptCd)
  console.log('USD_ID = ', codeList.userId)
  console.log('IMG_CHECK = ', searchParams.IMG_CHECK)
  console.log('saveParam = ', saveParam.value)  

  //PKG_RSKBA0010.TRANS_MASTER_M
  return commonRskApi({ 
    queryId: "RSKBA0010_SAVE_05",
    UP_DEPT_CD: upDeptCd,
    DEPT_CD: deptCd,
    USR_ID: userStore.userId,
    IMG_CHECK: searchParams.IMG_CHECK,
    list: saveParam.value,
  })
}


//저장버튼 눌렀을때 실행되는 함수
const saveData = () => {

  commonExecuteApi({ queryId: "MNGAC0010_SAVE_01", list: saveParam.value })

  return commonExecuteApi({ queryId: "MNGAC0010_SAVE_02", list: saveParam.value })
}


//버튼
const onButtonsClick = async btn => {
  
  if (btn.id === 'btnTreeSearch')   // 조직도 조회
  {        
    new queryFlowHelper(vm, t)
      .setGridList([grdTree])
      .setQuery(searchTree)
      .setAfter(afterSearchTree)
      .showMessage(false)
      .run() 
  }

  else if (btn.id === 'btnWorkSearch') {  // 작업표준명 조회
  
    if(searchParams.WORK_STANDARD_NM == '') {
      /*
      let dialogResult = await vm.$swal({ 
        //title: t('표준명을 입력하지 않을 경우 오래걸릴 수 있습니다. 조회하시겠습니까?'), 
        //title: t('[작업표준명] 최소 한글자 이상 입력 후 검색해주세요.')
      })*/
      Message.warn(t('작업표준명을 최소 한글자 이상 입력해주세요.'))
    }
    else {
      new queryFlowHelper(vm, t)
          .setGridList([grdMain])
          .setQuery(searchCopy)
          .setAfter(afterSearchCopy)
          // .showMessage(false)
          .run()
    }
  }

  else if (btn.id === 'btnRskCopyApp') {
    
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(setTransMaster)         
      .setAfter(afterSave)
      // .setAfter(() => { onButtonsClick({ id :'btnClose' })
                        // upDataRow()})
      .run()
  } 


  else if (btn.id === 'btnClose') {
    searchParams.divGbn = '1'    
    searchParams.DEPT_NM = ''
    searchParams.WORK_STANDARD_NM = ''
    searchParams.DEPTH_ASGN_NM = ''
    searchGbn()
    emit('closed', 'closed')
    dialog.value = false    
  }

  else {
    return  Message.warn(t('개발중입니다.'))    
  }
}

const afterSave = () => {
  Message.success(t('작업표준을 정상적으로 복사했습니다.'))
}

const onCellDblClick = async () =>
{
  let ck = await vm.$swal({ 
    title: t('선택한 표준으로 복사하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!ck.isConfirmed)
    return
  
  new saveFlowHelper(vm, t)
    .showMessage(false)
    .setBefore(SetBeforeData)
    .setQuery(setTransMaster)
    .setAfter(afterSave)
    .run()


  //if(!SetBeforeData())
  //  return
  
  //setTransMaster()
}

const SetBeforeData = () => {
  
  let data
  let isSame

  saveParam.value = []

  if(searchParams.divGbn == '1')
    data = grdMain.value.getFocusedRowData()
  else
    data = grdTreeMain.value.getFocusedRowData()

  saveParam.value.push(data)
      
  commonSearchApi({ queryId: "RSKBA0010_SEARCH_12", param: { DEPT_CD: codeList.deptCd, WORK_STANDARD_NM : data.WORK_STANDARD_NM } }).then( res => {

    if (res.OUT_DATA > 0)
      isSame = true
  })
        
  if (isSame)
  {
    Message.warn('현재 조직에 동일한 작업표준이 존재합니다.작업표준명 수정 후 저장하시기 바랍니다.')
    return false
  }

  return true
}

const searchCopy = idx => {
  let param = 
    {
      WORK_STANDARD_NM : searchParams.WORK_STANDARD_NM,
    }
  
  return commonSearchApi({ queryId : 'RSKBA0010_SEARCH_11', param: param })
}

const afterSearchCopy = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)    
}

const searchTree = idx => {  
  return commonSearchApi({ queryId : 'RSKBA0010_SEARCH_19', param: {} })
}

const afterSearchTree = res => {  
  grdTree.value.getDataProvider().setRows(res.ORESULT_CUR, 'DEPTH_ASGN_CD') 
}

// 메인그리드 조회
const selectTreeNodeEvent = (data , row) => {
  
  searchParams.DEPTH_ASGN_NM = row.DEPTH_ASGN_NM

  commonSearchApi({ queryId: "RSKBA0010_SEARCH_17", param: { DEPT_CD : data }  }).then( res => {        
  
    grdTreeMain.value.getDataProvider().setRows()
  
    if (res.ORESULT_CUR.length > 0) {
      grdTreeMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }    
    
  })

}

// 협력사 그리드 조회
const searchPartner = row => {
  let asgnCd
  console.log('parterGbn = ', searchParams.partnerGbn)
  if (searchParams.partnerGbn === 'O' && row === '') {
    console.log('협력사가 아닌경우 여기')
    searchParams.DEPT_NM = ''    

  }
  else {

    if (row !== '') {      
      // row.ASGN_CD = 'K490'
      asgnCd = row.ASGN_CD        
    }
    console.log('asgnCd', asgnCd)
    console.log('deptNm', searchParams.DEPT_NM)
    console.log('searchTreeNm =', searchTreeNm.value)
    
    //commonSearchApi({ queryId: "RSKBA0010_SEARCH_18", param: { CORP_CD : asgnCd, DEPT_NM : searchParams.DEPT_NM }  }).then( res => {          
    commonSearchApi({ queryId: "RSKBA0010_SEARCH_18", param: { CORP_CD : asgnCd, DEPT_NM : searchTreeNm.value }  }).then( res => {          
      grdSub.value.getDataProvider().setRows()
      
      if (res.ORESULT_CUR.length > 0) {
        grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
      }
    })
  }  
}

// 검색구분에 따라 조회
const searchGubun = gbn => {
  if (gbn === '표준서명') {
    onButtonsClick({ id :'btnWorkSearch' })
  }
  else if (gbn === '직영') 
  {
    // 검색조건이 조직도인 경우
    if(searchParams.partnerGbn == 'O')
      searchTreeBtn()
    // 검색조건이 협력사인 경우
    else
      searchPartner('')
  }
}

// 조직도 - 트리 그리드 클릭 시 데이터 바인딩
const onTreeCellClicked = (grid,clickData) =>{
  
  let index = grdTree.value.getGridView().getCurrent().dataRow
  let row = grdTree.value.getDataProvider().getJsonRow(index)
  let children = grdTree.value.getDataProvider().getChildCount(index)  

  if (children === 0) {        
    selectTreeNodeEvent(row.ASGN_CD, row) // 메인그리드 조회
    searchPartner(row)       // 협력사그리드 조회
  }
}

// 조직도 - 협력사 그리드 클릭 시 데이터 바인딩
const onSubCellClicked = (grid,clickData) =>{
  
  let index = grdSub.value.getGridView().getCurrent().dataRow
  let row = grdSub.value.getDataProvider().getJsonRow(index)  

  selectTreeNodeEvent(row.DEPT_CD, row) // 메인그리드 조회

}

watch(() => searchTreeNm.value, (newValue, oldValue) => {
  grdTree.value.getDataProvider().setRows()
})

const searchTreeBtn = () => {
  
  let gridView = grdTree.value.getGridView()

  let idx = 0
  let ret = grdTree.value.getDataProvider().searchData({fields:["ASGN_FULL_NM"], value:searchTreeNm.value, partialMatch : true})
  while(ret != null){
    if (ret) {
      idx = ret.dataRow
      var rowId = ret.dataRow
      var parents = grdTree.value.getDataProvider().getAncestors(rowId)
      if (parents) {
        gridView.expand(0, false, true)
        for (var i = parents.length - 1; i >= 0 ; i--) {
          gridView.expand(gridView.getItemIndex(parents[i]))
        }
        // 찾은 row 포커싱
        gridView.setCurrent({itemIndex:gridView.getItemIndex(rowId), fieldIndex:ret.fieldIndex})
        
        // 찾은 row 히든필드에 값넣기 HIDDENFIELD
        grdTree.value.getDataProvider().setValue(rowId, 'HIDDENFIELD', searchTreeNm.value )

        // 찾은 값들을 강조하기
        grdTree.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
          var retVal = {}

          var val = grid.getValue(item.index, "HIDDENFIELD")

          if (val === searchTreeNm.value) {
            retVal.style = { background:"#D9E5FF" }
          }

          return retVal
        })

      }
      ret = grdTree.value.getDataProvider().searchData({fields:["ASGN_FULL_NM"], value:searchTreeNm.value, partialMatch : true, startIndex : idx+1, wrap : false })
    }
  }
}



const grdClick = () => {
  
  let grdLength
  let row   
  let index  
  
  if (searchParams.divGbn == '1') {    
    grdLength = grdMain.value.getDataProvider().getRows().length
    index = grdMain.value.getGridView().getCurrent().dataRow
    row = grdMain.value.getDataProvider().getJsonRow(index)  
  } else {
    grdLength = grdTreeMain.value.getDataProvider().getRows().length    
    index = grdTreeMain.value.getGridView().getCurrent().dataRow
    row = grdTreeMain.value.getDataProvider().getJsonRow(index)  
  }  
  
  // if ( grdLength > 0 ) {
  //   rSKBA0010popup6.value.openPopup(row.WORK_STANDARD_ID)    
  // }  
  // emit('selected', 'selected')
}




onMounted(()=>{
  
})

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
    작업표준복사
    </div>
    <VContainer style="background-color: white;">
      <VForm ref="saveForms">
      <!-- 최상단 -->
        <VRow class="my-1">
          <VCol cols="3">
            <ILabel
              :label="$t('구분')"               
              >
              <template #editor="editorProps">                          
                <VAutocomplete                            
                  v-model="searchParams.divGbn"
                  :items="codeList.displayGbn"
                  item-value="COD"
                  item-title="TXT"     
                  @update:modelValue="searchGbn"                            
                />                              
              </template>      
            </ILabel>            
          </VCol>
          <VCol cols="7">
            <div class="d-flex flex-grow-1 pa-2">
              <v-checkbox
              v-model="searchParams.IMG_CHECK"
              true-value="Y"
              false-value="N"
              :label="t('사진포함')"  
              v-if="divWorkNm"              
              />
            </div>
          </VCol>                    
          <VCol cols="2">            
            <IMenuTitle
              ref="menuTitle"
              :use-permission="false"
              :button-list="['btnRskCopyApp','btnClose']"
              @click-button="onButtonsClick"
            >            
            </IMenuTitle>
          </VCol>
        </VRow>
        <v-row style="overflow-x: hidden; overflow-y: auto; height: 740px;">          
          <VRow class="popUp-input-Form fill-height">
          <!-- 첫번째 --> 
            <v-col cols="12">
              <v-row style="align-items: flex-end;">
                <!-- TABLE -->
                <VCol cols="12">
                  <VTable 
                    density="comfortable" 
                    class="text-center border nondrag"
                  >
                    <tbody>                      
                      <tr height="100">
                        <td                          
                          rowspan="7"
                          class="border text-start font-weight-bold"
                          width="160"
                        >
                          [작업표준/위험성 평가 복사하기] 정기위험성평가 복사 기능을 통해 다른 조직의 정기위험성평가 결과를 소속 조직으로 복사해 올 수 있습니다.<br>
                          복사한 정기위험성평가는 ＇정기위험성평가＇-＇작성 중’ 화면에서 조회할 수 있습니다.<br>
                          정기위험성평가 내용을 검토하여 우리 조직에 맞게 위험성평가를 실시한 후 결재 상신 하여 최종결재까지 완료되어야 정기위험성평가 이관이 완료됩니다. 
                        </td>
                      </tr>                      
                    </tbody>
                  </VTable>
                </VCol>
                <VCol cols="12" md="12">                                  
                  <v-row>
                    <v-col v-if="divDept" cols="2">
                      <ILabel
                        :label="$t('검색조건')" 
                        labelLoc="top"
                        >
                        <template #editor="editorProps">                          
                          <VAutocomplete                            
                            v-model="searchParams.partnerGbn"
                            :items="codeList.partnerGbn"
                            item-value="COD"
                            item-title="TXT"                             
                          />                              
                        </template>      
                      </ILabel>
                    </v-col>
                    <v-col v-if="divWorkNm" cols="3">
                      <ILabel
                        :label="$t('작업표준명')" 
                        labelLoc="top"
                        >
                        <template #editor="editorProps">                             
                          <VTextField
                            v-model="searchParams.WORK_STANDARD_NM"     
                            append-inner-icon="mdi-magnify"               
                            @update:modelValue="e => { searchParams.DEPT_CD = null }"
                            @click:appendInner="searchGubun('표준서명')"
                            @keyup.enter="e => { searchGubun('표준서명') }"
                          />                      
                        </template>      
                      </ILabel>                     
                    </v-col>                     
                    <v-col v-if="divDept" cols="3">
                      <ILabel
                        :label="$t('')" 
                        labelLoc="top"
                        >
                        <template #editor="editorProps">                             
                          <VTextField
                            v-model="searchTreeNm" 
                            append-inner-icon="mdi-magnify" 
                            :placeholder="t('검색어를 입력하세요.')"
                            @click:appendInner="searchGubun('직영')"
                            @keydown.enter=" e => {
                              searchGubun('직영')
                            }"
                          />
                        </template>      
                      </ILabel>
                    </v-col> 
                    <v-col v-if="divDept" cols="7">
                      <ILabel
                        :label="$t('가져올 조직')" 
                        labelLoc="top"                        
                        >
                        <template #editor="editorProps">                             
                          <VTextField
                            v-model="searchParams.DEPTH_ASGN_NM"                                 
                            readonly
                          />                                
                        </template>      
                      </ILabel>
                    </v-col> 
                  </v-row>                  
                </VCol>               
              </v-row>
            </v-col>


            <!-- 두번째 -->
            <v-col v-if="divWorkNm" cols="12">
              <v-row>
                <VCol cols="12" md="12">
                  <RealGrid
                    ref="grdMain"
                    style="height: 540px;"
                    :grid-view-option="grdMainProps.gridViewOption"
                    :keys="grdMainProps.keys" 
                    :fields="grdMainProps.fields"
                    :columns="grdMainProps.columns"
                    @onCellClicked="grdClick"
                    @onCellDblClicked="onCellDblClick"
                  />
                </VCol>
              </v-row> 
            </v-col> 

            <v-col v-if="divDept" cols="4">
              <v-row>                
                <VCol cols="12" md="12">
                  <RealGrid
                    ref="grdTree"
                    class="mt-2"
                    style="height: calc(66.5vh - 366px);"
                    :grid-view-option="grdTreeProps.gridViewOption"
                    :keys="grdTreeProps.keys" 
                    :fields="grdTreeProps.fields"
                    :columns="grdTreeProps.columns"
                    :is-tree="true"
                    @onCellClicked="onTreeCellClicked"
                  />
                </VCol>                
                <VCol cols="12" md="12">
                  <RealGrid
                    ref="grdSub"
                    class="mt-2"
                    style="height: 250px;"
                    :grid-view-option="grdSubProps.gridViewOption"
                    :keys="grdSubProps.keys" 
                    :fields="grdSubProps.fields"
                    :columns="grdSubProps.columns"
                    @onCellClicked="onSubCellClicked"
                  />
                </VCol>
              </v-row> 
            </v-col>
            <v-col v-if="divDept" cols="8">
              <v-row>                                             
                <VCol cols="12" md="12">
                  <RealGrid
                    ref="grdTreeMain"
                    class="mt-2"
                    style="height: 534px;"
                    :grid-view-option="grdTrMainProps.gridViewOption"
                    :keys="grdTrMainProps.keys" 
                    :fields="grdTrMainProps.fields"
                    :columns="grdTrMainProps.columns"  
                    @onCellClicked="grdClick"
                    @onCellDblClicked="onCellDblClick"
                  />
                </VCol>
              </v-row> 
            </v-col>
          </VRow>
        </v-row>
      </VForm>
    </VContainer>
    <RSKBA0010popup6 ref="rSKBA0010popup6" @selected="OnSelectedSago" />     
  </VDialog>

</template>


<style scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }

</style>
