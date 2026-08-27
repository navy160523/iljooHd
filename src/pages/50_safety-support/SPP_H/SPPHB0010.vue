<!-- 화면명 : SPPHB0010 태풍기본정보 관리 -->
<!-- 화면개요 : 해당년도에 발생한 태풍에 대한 기본정보관리 -->
<!-- SI2팀 마환구 2025-02-04 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user';
import { commonSearchApi, commonExecuteApi, getCodeList,} from '@hiway/api/commonApi';
import queryFlowHelper from '@/utils/searchFlowHelper';
import saveFlowHelper from '@/utils/saveFlowHelper';
import deleteFlowHelper from '@/utils/deleteFlowHelper';
import Message from '@hiway/utils/notify'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from "dayjs"

defineOptions({
  name:'50_safety-support-SPP_H-SPPHB0010',
})

const userStore =  useUserStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMainProps1 = ref(null)
const saveParams= ref([])

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR:''  
})
//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : {stateBar: { visible: false }, checkBar: { visible : true } },
  keys : [],
  fields : [ 
    { fieldName: 'CMPNY_DIV', width : '200', dataType: 'text', header: { text: t('사업장구분') }, editable:true,visible:false},
    { fieldName: 'TYPYEAR', width : '70', dataType: 'text', header: { text: t('년도') }, 
    editor :{dateType:'text', maxLength:'4'},
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        if(grid.getValue(dataCell.index.itemIndex, 'SAVE_YN') == 'Y') {
          ret.editable = false
          ret.enabled = false
          ret.style = { background:'#FFFFFF' }
        } else {
          ret.editable = true
          ret.enabled = true
          ret.style = { background:'#eff8fd' }
        }
        return ret
      }},
    { fieldName: 'TYPN_CD', width : '70', dataType: 'text', header: { text: t('코드') }, 
    editor :{dateType:'text',maxLength:'6'},
    'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        if(grid.getValue(dataCell.index.itemIndex, 'SAVE_YN') == 'Y') {
          ret.editable = false
          ret.enabled = false
          ret.style = { background:'#FFFFFF' }
        } else {
          ret.editable = true
          ret.enabled = true
          ret.style = { background:'#eff8fd' }
        }
        return ret
      }},
    { fieldName: 'TYPN_SERNO', width : '200', dataType: 'text', header: { text: t('태풍코드') }, editable:true,visible:false},
    { fieldName: 'TYPN_NAME', styleName: 'editable_column left-column', width : '200', dataType: 'text', header: { text: t('태풍명') }, editable:true},
    { fieldName: 'TYPN_HPA', styleName: 'editable_column right-column', width : '60', dataType: 'text', header: { text: t('기압(hpa)') }, editable:true,
      editor :{dateType:'number', maxLength:'4', type:'number'}},
    { fieldName: 'TYPN_SPD', styleName: 'editable_column right-column', width : '60', dataType: 'text', header: { text: t('풍속(m/s)') }, editable:true,
      editor :{dateType:'number', maxLength:'3', type:'number' }},
    { fieldName: 'TYPN_RAINFALL', styleName: 'editable_column right-column', width : '60', dataType: 'text', header: { text: t('강우량(mm/h)') }, editable:true,
      editor :{dateType:'number', maxLength:'4', type:'number'}},
    { fieldName: 'TYPN_WAVEH', styleName: 'editable_column right-column', width : '60',dataType: 'text', header: { text: t('파고(m)') }, editable:true,
      editor :{dateType:'number', maxLength:'2', type:'number'}},
    { fieldName: 'TYPN_SCORE', styleName: 'right-column', width : '60', dataType: 'text', header: { text: t('평가점수') }, editable:false},

    //{ fieldName: 'TYPN_GRADE', dataType: 'text', header: { text: t('위험도') }, editable:true, lookupDisplay: true},
    { fieldName: 'TYPN_GRADE', width : '100', dataType: 'text', 
      header: { text: t('위험도')}, styleName: 'editable_column', lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
      'styleCallback': function(grid, dataCell){
        var ret = { editable : true, styleName : 'editable_column', enabled: true }
        if(grid.getValue(dataCell.index.itemIndex, 'TYPN_GRADE') == '1') {
          ret.style = { background:'#90EE90' }
        } 
        else if(grid.getValue(dataCell.index.itemIndex, 'TYPN_GRADE') == '2')
        {
          ret.style = { background:'#FFFF00' }
        }
        else if(grid.getValue(dataCell.index.itemIndex, 'TYPN_GRADE') == '3')
        {
          ret.style = { background:'#FFA500' }
        }
        else if(grid.getValue(dataCell.index.itemIndex, 'TYPN_GRADE') == '4')
        {
          ret.style = { background:'#FF0000' }
        }
        else
        {
          ret.style = { background:'#FFFFFF' }
        }

        return ret
      }
    },

    { fieldName: 'DATE_FROM', 
    styleName: 'editable_column',
    width : '150', 
    dataType: 'text', 
    header: { text: t('비상기간(From)') }, 
    datetimeFormat:'yyyy-MM-dd', editable:true,
      editor:{type:'date', datetimeFormat:'yyyy-MM-dd',
              mask: {
              editMask: '9999-99-99',
              placeHolder: 'yyyy-MM-dd',
              includedFormat: true,
            },
          }},
    { fieldName: 'DATE_TO', styleName: 'editable_column', width : '150', dataType: 'text', header: { text: t('비상기간(To)') }, datetimeFormat:'yyyy-MM-dd', editable:true,
      editor:{type:'date', datetimeFormat:'yyyy-MM-dd',
              mask: {
              editMask: '9999-99-99',
              placeHolder: 'yyyy-MM-dd',
              includedFormat: true,
            },
          }},
    { fieldName: 'TYPSEQ', styleName: 'editable_column', width : '50', dataType: 'text', header: { text: t('기상청\n번호') }, editable:true},
    { fieldName: 'TYPNAME', styleName: 'editable_column left-column', width : '90',dataType: 'text', header: { text: t('기상청 영문명') }, editable:true},

    //{ fieldName: 'REF_TYPN_NM', dataType: 'text', header: { text: t('유사태풍') }, editable:true},
    { fieldName: 'REF_TYPN',width : '180', dataType: 'text', header: { text: t('유사태풍') }, styleName: 'editable_column left-column', lookupDisplay: true
      , editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 10, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },

    { fieldName: 'REMARK', styleName: 'editable_column left-column', width : '280', dataType: 'text', header: { text: t('비고') }, editable:true},
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('?') }, editable:true,visible:false},
  ],
  columnLayout: [
    
    'TYPYEAR',
    'TYPN_CD',
    'TYPN_SERNO',
    'TYPN_NAME',
    'TYPN_HPA',
    'TYPN_SPD',
    'TYPN_RAINFALL',
    'TYPN_WAVEH',
    'TYPN_SCORE',
    'TYPN_GRADE',
    'DATE_FROM',
    'DATE_TO',
    'TYPSEQ',
    'TYPNAME',
    'REF_TYPN',
    'REMARK',
    'SAVE_YN'
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields

const codeList = reactive({
  TYPN_GRADE: [],
  TYPN: [],
  TYPN_YEAR: []
})

onMounted( async () => {


  let param = {
    CMPNY_DIV: userStore.cmpnyDiv
  }
  let param1 = {
    
  }
  let param2={
    CMPNY_DIV: userStore.cmpnyDiv,
    YYYY:''
  }
  //그리드 표시용 태풍 내역 호출(SPPHB0010_SEARCH_03)
  await commonSearchApi({ queryId: 'SPPHB0010_SEARCH_03',param:param2})
    .then(res => {
      
      codeList.TYPN = res.ORESULT_CUR
        if (codeList.TYPN.length > 0) {
          codeList.TYPN.unshift({CODE:'', DISPLAY_TEXT:""})  
          grdMainProps1.value.setBindingColumn('REF_TYPN', codeList.TYPN, 'CODE', 'DISPLAY_TEXT')
      }
    })
  //그리드 표시용 태풍 등급내역 호출(SPPHB0010_SEARCH_02)
  await commonSearchApi({ queryId: 'SPPHB0010_SEARCH_02',param:param1})
    .then(res => {
      
      codeList.TYPN_GRADE = res.ORESULT_CUR
        if (codeList.TYPN_GRADE.length > 0) {
          grdMainProps1.value.setBindingColumn('TYPN_GRADE', codeList.TYPN_GRADE, 'CODE', 'DISPLAY_TEXT')
      }
    })
  // 조회용 태풍 발생 년도 호출(SPPHB0010_SEARCH_04)
  await commonSearchApi({ queryId: 'SPPHB0010_SEARCH_04', param: param })
    .then(res => {
      
      codeList.TYPN_YEAR = res.ORESULT_CUR
       if (codeList.TYPN_YEAR.length > 0) {
         // 첫 번째 값 설정
         searchParams.YEAR = codeList.TYPN_YEAR[0].CODE
      }
    })
    
  //initCodeList()
  grdMainProps1.value.getGridView().filterPanel.visible = true
  
  onButtonsClick({ id: 'btnSearch' })
})

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMainProps1])
      .setQuery(()=>{
        return commonSearchApi({
          queryId: "SPPHB0010_SEARCH_01",
          param: searchParams,
        })
      })
      .setAfter(afterSearch)
      .showMessage(true)
      .run();
  }
  else if(btn.id=='btnCreate')
  {
    addData();
  }
  else if(btn.id=='btnUpdate')
  {
    new saveFlowHelper(vm, t)
       .setTargetGridRow([{ grid:grdMainProps1, row: 'check' }])
       .setGridList([grdMainProps1])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()

  }
  else if(btn.id=='btnDelete')
  {
    new deleteFlowHelper(vm,t)
      .setTargetGridRow([{ grid:grdMainProps1, row: 'check' }])
      .setGridList([grdMainProps1])
      .setQuery(dataDelete)
      .setAfter(afterSave)
      .run()
  }
}

const afterSearch = (res) => {
  
  grdMainProps1.value.getDataProvider().setRows(res.ORESULT_CUR);
}

const reset = () => {
  searchParams.CMPNY_DIV = userStore.cmpnyDiv;

  grdMainProps1.value.getDataProvider().setRows()

  //onButtonsClick({ id: "btnSearch" })
}

// const upData = () => {
//   console.log("upData")
//   onButtonsClick({ id: "btnSearch" })
// }

const addData = () => {
  grdMainProps1.value.addRow({ 
    TYPYEAR       : dayjs().format("YYYY"),
    CMPNY_DIV     : userStore.cmpnyDiv,
    TYPN_SERNO    : null,
    TYPN_NAME     : '',
    TYPN_HPA      : '',
    TYPN_SPD      : '',
    TYPN_RAINFALL : '',
    TYPN_WAVEH    : '',
    TYPN_SCORE    : '',
    TYPN_GRADE    : codeList.TYPN_GRADE[0].CODE,
    DATE_FROM     : '',
    DATE_TO       : '',
    TYPSEQ        : '',
    TYPNAME       : '',
    REF_TYPN   : '',
    REMARK        : '',
    SAVE_YN       : 'N'},
    false)
}

const saveData = () => {
  // console.log("saveParams.value:",saveParams.value)
  return commonExecuteApi({ queryId : "SPPHB0010_SAVE_01", list: saveParams.value })
}

const beforeSave = () => {
  let chekedRow = ref([])
  let bCheck = true
  chekedRow = grdMainProps1.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.value = []
  let data = ref([])

  chekedRow.forEach(val => {
    data = grdMainProps1.value.getDataProvider().getJsonRow(val)
    data.UPDATE_USER_ID = userStore.userId // 수정자
    data.DATE_FROM = data.DATE_FROM ? data.DATE_FROM.replace(/-/g,"") : ""
    data.DATE_TO= data.DATE_TO ? data.DATE_TO.replace(/-/g,"") : ""
    if(!data.TYPN_CD)
    {
      Message.warn(t('코드를 입력해주세요.'))
      bCheck=false
    }
    else if(!data.TYPN_NAME)
    {
      Message.warn(t('태풍이름을 입력해주세요.'))
      bCheck=false
    }
    else if(data.DATE_FROM>data.DATE_TO)
    {
      Message.warn(t('비상기간(To)는 비상기간(From)보다 빠를 수 없습니다.'))
      bCheck=false
    }
    else if(data.TYPN_SERNO == data.REF_TYPN)
    {
      Message.warn(t('태풍과 유사태풍은 같을 수 없습니다.'))
      bCheck=false
    }
    
    saveParams.value.push(data)
  })
  //console.log('saveParams : ',saveParams)
  //console.log("저장 파라메트", saveParams.value)
  return bCheck
}

const afterSave = async ()=>{
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv
  }
  // 조회용 태풍 발생 년도 호출(SPPHB0010_SEARCH_04)
  await  commonSearchApi({ queryId: 'SPPHB0010_SEARCH_04', param: param })
    .then(res => {
      
      codeList.TYPN_YEAR = res.ORESULT_CUR
       if (codeList.TYPN_YEAR.length > 0) {
         // 첫 번째 값 설정
         searchParams.YEAR = codeList.TYPN_YEAR[0].CODE
      }
    })
  
  
  onButtonsClick({ id: 'btnSearch' })
 

}

const dataDelete =()=>{
  let chekedRow = ref([])

  chekedRow = grdMainProps1.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.value = []
  let data = ref([])
  

  chekedRow.forEach(val => {
    
    data = grdMainProps1.value.getDataProvider().getJsonRow(val)
    
    data.UPDATE_USER_ID = userStore.userId // 수정자
    
    saveParams.value.push(data)
    
  })
  
  //console.log("저장 파라메트", saveParams.value)
  return commonExecuteApi({ queryId: 'SPPHB0010_DELETE_01', list: saveParams.value })
}

const onEditRowChange=( grid, itemIndex, dataRow, field, oldValue, newValue )=>{
  grid.checkItem(dataRow,true)
  grid.commit()
  // console.log(grdMainProps1.value.getGridView().getValues(dataRow)['TYPN_GRADE'])
  // console.log("dataRow:",dataRow)
  // console.log("itemIndex:",itemIndex)
  let SPD = grdMainProps1.value.getGridView().getValues(dataRow)['TYPN_SPD']?grdMainProps1.value.getGridView().getValues(dataRow)['TYPN_SPD']:0;
  let RAINFALL = grdMainProps1.value.getGridView().getValues(dataRow)['TYPN_RAINFALL']?grdMainProps1.value.getGridView().getValues(dataRow)['TYPN_RAINFALL']:0;
  let WAVEH = grdMainProps1.value.getGridView().getValues(dataRow)['TYPN_WAVEH']?grdMainProps1.value.getGridView().getValues(dataRow)['TYPN_WAVEH']:0;
  let fieldname=grdMainProps1.value.getDataProvider().getFieldName(field)
  let score=0;
  let grade=0;  
  if(fieldname == "TYPN_SPD" || fieldname == "TYPN_RAINFALL" || fieldname == "TYPN_SCORE" || fieldname == "TYPN_WAVEH")
  {
  if(fieldname == "TYPN_SPD")
  {
    SPD=newValue;
  }
  else if(fieldname == "TYPN_RAINFALL")
  {
    RAINFALL=newValue;
  }
  else if(fieldname == "TYPN_WAVEH")
  {
    WAVEH=newValue;
  }
  else if(fieldname == "TYPN_SCORE")
  {
    score=newValue;
  }

  if(SPD >= 0 && RAINFALL >= 0 && WAVEH >= 0)
  {
    //풍속에 의한 평가점수
    if(SPD < 17)
    {
      score = score + 0;
    }
    else if(17 <= SPD && SPD <= 24)
    {
      score = score + 15;
    }
    else if(25 <= SPD && SPD <= 32)
    {
      score = score + 25;
    }
    else if(33 <= SPD && SPD <= 43)
    {
      score = score + 35;
    }
    else if(44 <= SPD && SPD <= 999)
    {
      score = score + 40;
    
    }
    
    //강우량에 의한 평가점수
    if(parseInt(RAINFALL) < 5)
    {
      score = score + 0;
    }
    else if(5 <= parseInt(RAINFALL) && parseInt(RAINFALL) <= 19)
    {
      score = score + 1;
    }
    else if(20 <= parseInt(RAINFALL) && parseInt(RAINFALL) <= 99)
    {
      score = score + 3;
    }
    else if(100 <= parseInt(RAINFALL))
    {
      score = score + 6;
    }
    //파고에 의한 평가점수
    if(parseInt(WAVEH) < 2)
    {
      score = score + 0;
    }
    else if(2 <= parseInt(WAVEH) && parseInt(WAVEH) <= 2)
    {
      score = score + 1;
    }
    else if(3 <= parseInt(WAVEH) && parseInt(WAVEH) <= 4)
    {
      score = score + 3;
    }
    else if(5 <= parseInt(WAVEH) && parseInt(WAVEH) <= 5)
    {
      score = score + 5;
    }
    else if(6 <= parseInt(WAVEH) && parseInt(WAVEH) <= 99)
    {
      score = score + 7;
    }    

    if(score <15)
    {
      grade = 0;
    }
    else if(15 <= score && score <= 24)
    {
      grade = 1;
    }
    else if(25 <= score && score<= 34)
    {
      grade = 2
    }
    else if(35 <= score && score<= 39)
    {
      grade = 3
    }
    else if(40 <= score)
    {
      grade = 4
    }
    
    grdMainProps1.value.getDataProvider().setValue(dataRow,'TYPN_SCORE',score);
    grdMainProps1.value.getDataProvider().setValue(dataRow,'TYPN_GRADE',grade);

    SPD=null;
    RAINFALL=null;
    WAVEH=null;
  }
  else if(score>=0)
  {
    if(score <15)
    {
      grade = 0;
    }
    else if(15 <= score && score <= 24)
    {
      grade = 1;
    }
    else if(25 <= score && score<= 34)
    {
      grade = 2
    }
    else if(35 <= score && score<= 39)
    {
      grade = 3
    }
    else if(40 <= score)
    {
      grade = 4
    }
    grdMainProps1.value.getDataProvider().setValue(dataRow,'TYPN_GRADE',grade);
  }
}
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnCreate','btnUpdate','btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">         
          <i-select
            :label="$t('년도')"
            width="150px"
            labelWidth="50px" 
            placeholder="년도"
            v-model="searchParams.YEAR"
            :items="codeList.TYPN_YEAR"
            item-value="CODE"
            item-title="DISPLAY_TEXT"
            @update:modelValue="reset"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('태풍 기본정보 관리')">
              <template #editors />
            </IGridTitle>
          <RealGrid
            ref="grdMainProps1"
            class="mt-2"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
            @onEditRowChanged="onEditRowChange"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>

