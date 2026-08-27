<!-- SPPHB0020 태풍 위험도 평가 -->
<!-- SI2팀 마환구 2025-02-04 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user';
import { commonSearchApi, commonExecuteApi, getCodeList, commonGetTypnWeather, commonGetWeather} from '@hiway/api/commonApi';
import queryFlowHelper from '@/utils/searchFlowHelper';
import saveFlowHelper from '@/utils/saveFlowHelper';
import deleteFlowHelper from '@/utils/deleteFlowHelper';
import dayjs from 'dayjs';
import axios from 'axios';
import Message from '@hiway/utils/notify'
import IGridTitle from '@/components/IGridTitle.vue'

import IButtonList from '@/components/IButtonList.vue'

defineOptions({
  name:'50_safety-support-SPP_H-SPPHB0020',
})

const userStore =  useUserStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMainProps1 = ref(null)
const saveParams= ref([])

const aa = reactive({
  dteDATE_D: '',
  dteDATE_T: ''
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR:'', 
  TYPN:''
})

const codeList = reactive({
  TYPN_GRADE: [],
  TYPN: [],
  TYPN_YEAR: []
})


//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : {stateBar: { visible: false }, checkBar: { visible : true } },
  keys : [],
  fields : [ 
    { fieldName: 'TYPN_DATE_D', dataType: 'datetime', header: { text: t('변동일자') }, datetimeFormat:'yyyy-MM-dd', editable:false,
      editor:{type:'datetime', datetimeFormat:'yyyy-MM-dd',
              mask: {
              editMask: '9999-99-99',
              placeHolder: 'yyyy-MM-dd',
              includedFormat: true,
            },
          },
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
      }
    },
    { fieldName: 'TYPN_DATE_T', dataType: 'text', header: { text: t('변동시간') }, editable:false,
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
      }
  },
    { fieldName: 'TYPN_HPA', styleName: 'editable_column right-column', width : '60', dataType: 'text', header: { text: t('기압(hpa)') }, editable:true,editor :{type:'number', maxLength:'4'}},
    { fieldName: 'TYPN_SPD', styleName: 'editable_column right-column', width : '60', dataType: 'text', header: { text: t('풍속(m/s)') }, editable:true,editor :{type:'number', maxLength:'3'}},
    { fieldName: 'TYPN_RAINFALL', styleName: 'editable_column right-column', width : '60', dataType: 'text', header: { text: t('강우량(mm/h)') }, editable:true,editor :{type:'number', maxLength:'4'}},
    { fieldName: 'TYPN_WAVEH', styleName: 'editable_column right-column', width : '60',dataType: 'text', header: { text: t('파고(m)') }, editable:true,editor :{type:'number', maxLength:'2'}},
    { fieldName: 'TYPN_SCORE', styleName: 'editable_column right-column', width : '60', dataType: 'text', header: { text: t('평가점수') }, editable:false,editor :{type:'number'}},

    //{ fieldName: 'TYPN_GRADE', dataType: 'text', header: { text: t('위험도') }, editable:false, lookupDisplay: true},
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

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable:false,visible:false},
    { fieldName: 'TYPN_SERNO', dataType: 'text', header: { text: t('태풍코드') }, editable:false,visible:false},
    { fieldName: 'TYPN_DATE', dataType: 'text', header: { text: t('발생일자') }, editable:false,visible:false},
    { fieldName: 'REMARK', styleName:"editable_column left-column", dataType: 'text', header: { text: t('비고') }, editable:true},
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장유무') }, editable:false,visible:false},
  ],
  columnLayout: [
    'TYPN_DATE_D',
    'TYPN_DATE_T',
    'TYPN_HPA',
    'TYPN_SPD',
    'TYPN_RAINFALL',
    'TYPN_WAVEH',
    'TYPN_SCORE',
    'TYPN_GRADE',
    'CMPNY_DIV',
    'TYPN_SERNO',
    'TYPN_DATE',
    'REMARK',
    'SAVE_YN'
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields

//그리드 데이터 입력

onMounted( async () => {
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv
  }
  let param1 = {
    
  }
  //그리드 표시용 태풍 등급내역 호출(SPPHB0020_SEARCH_02)
  await commonSearchApi({ queryId: 'SPPHB0020_SEARCH_02',param:param1})
    .then(res => {
      // console.log("res :",res)
      codeList.TYPN_GRADE = res.ORESULT_CUR
        if (codeList.TYPN_GRADE.length > 0) {
          grdMainProps1.value.setBindingColumn('TYPN_GRADE', codeList.TYPN_GRADE, 'CODE', 'DISPLAY_TEXT')
      }
    })
  // 조회용 태풍 발생 년도 호출(SPPHB0010_SEARCH_04)
  await commonSearchApi({ queryId: 'SPPHB0020_SEARCH_04', param: param })
    .then(res => {
      // console.log("res1 :",res)
      codeList.TYPN_YEAR = res.ORESULT_CUR
       if (codeList.TYPN_YEAR.length > 0) {
         // 첫 번째 값 설정
         searchParams.YEAR = codeList.TYPN_YEAR[0].CODE
      }

        //그리드 표시용 태풍 내역 호출(SPPHB0020_SEARCH_03)
    return commonSearchApi({ queryId: 'SPPHB0020_SEARCH_03',param:{
                      CMPNY_DIV: userStore.cmpnyDiv,
                      YYYY: searchParams.YEAR
                  }})
    .then(res1 => {
      
      codeList.TYPN = res1.ORESULT_CUR
        if (codeList.TYPN.length > 0) {
          searchParams.TYPN=codeList.TYPN[0].CODE
      }
    })
    })
    
  //initCodeList()
  grdMainProps1.value.getGridView().filterPanel.visible = true

  aa.dteDATE_D=dayjs().format("YYYY-MM-DD");
  aa.dteDATE_T=dayjs().format("HH:mm");

  onButtonsClick({ id: 'btnSearch' })

})


const TYPNChange = async e => { 
  codeList.TYPN = []

  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YYYY: searchParams.YEAR
  }
  Promise.all([
    await commonSearchApi({ queryId: 'SPPHB0020_SEARCH_03', param: param })
  ]).then(res => {
    codeList.TYPN = res[0].ORESULT_CUR
    if (codeList.TYPN.length > 0) {
          searchParams.TYPN=codeList.TYPN[0].CODE
    }
  })
}

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMainProps1])
      .setQuery(()=>{
        return commonSearchApi({
          queryId: "SPPHB0020_SEARCH_01",
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
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()

  }
  else if(btn.id=='btnDelete')
  {
    new deleteFlowHelper(vm,t)
      .setTargetGridRow([{ grid:grdMainProps1, row: 'check' }])
      .setGridList([grdMainProps1])
      .setQuery(dataDelete)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }
  else if(btn.id=='btnWeatherInfo')
  {
    getWeatherinfo()
    
  }
}

const getWeatherinfo= async ()=>{

  let sDATE='', sDATE2='', DATE_T=''
  let ws='', wh='', rn=''
  let URL1='', URL2=''
  sDATE=aa.dteDATE_D.replace(/-/g,'');
  sDATE2=sDATE.substring(0,6);
  DATE_T=aa.dteDATE_T.replace(':','').substring(0,2)
  
  if (dayjs(aa.dteDATE_D) < dayjs().subtract(7,'day') || dayjs().add(7,'day') < dayjs(aa.dteDATE_D))
  {return Message.warn(t('현재일자의 7일 이전 또는 7일 이후의 예보만 확인 가능합니다.'))}

  if(0<=parseInt(DATE_T) && parseInt(DATE_T)<=3)
  {ws="ws03", wh="wh03", rn='rn03'}
  else if(3<=parseInt(DATE_T) && parseInt(DATE_T)<=6)
  {ws="ws36", wh="wh36", rn='rn36'}
  else if(6<=parseInt(DATE_T) && parseInt(DATE_T)<=9)
  {ws="ws69", wh="wh69", rn='rn69'}
  else if(9<=parseInt(DATE_T) && parseInt(DATE_T)<=12)
  {ws="ws912", wh="wh912", rn='rn912'}
  else if(12<=parseInt(DATE_T) && parseInt(DATE_T)<=15)
  {ws="ws1215", wh="wh1215", rn='rn1215'}
  else if(15<=parseInt(DATE_T) && parseInt(DATE_T)<=18)
  {ws="ws1518", wh="wh1518", rn='rn1518'}
  else if(18<=parseInt(DATE_T) && parseInt(DATE_T)<=21)
  {ws="ws1821", wh="wh1821", rn='rn1821'}
  else if(21<=parseInt(DATE_T) && parseInt(DATE_T)<=24)
  {ws="ws2124", wh="wh21", rn='rn24'}
  
  let spd1 = 0
  let waveh1 = 0
  let rainfall1 = 0
  let score1=0, grade1=0;
  //웹으로는 막혀서 BACK END를 이용
  await commonGetTypnWeather({Month:sDATE2,Date:sDATE,WS:ws,WH:wh,RN:rn}).then(res=>{
    // console.log("spd:",res.ORESULT_CUR[0].ws)
    // console.log("waveh1:",res.ORESULT_CUR[0].wh)
    // console.log("rainfall1:",res.ORESULT_CUR[0].rn)
    spd1=res.ORESULT_CUR[0].ws=="" ? 0 : res.ORESULT_CUR[0].ws 
    waveh1=res.ORESULT_CUR[0].wh=="" ? 0 : res.ORESULT_CUR[0].wh
    rainfall1=res.ORESULT_CUR[0].rn=="" ? 0 : res.ORESULT_CUR[0].rn
  })




  //풍속에 의한 평가점수
  if(spd1 < 17)
    {
      score1 = score1 + 0;
    }
    else if(17 <= spd1 && spd1 <= 24)
    {
      score1 = score1 + 15;
    }
    else if(25 <= spd1 && spd1 <= 32)
    {
      score1 = score1 + 25;
    }
    else if(33 <= spd1&& spd1 <= 43)
    {
      score1 = score1 + 35;
    }
    else if(44 <= spd1 && spd1 <= 999)
    {
      score1 = score1 + 40;
    
    }
    
    //강우량에 의한 평가점수
    if(parseInt(rainfall1) < 5)
    {
      score1 = score1
       + 0;
    }
    else if(5 <= parseInt(rainfall1) && parseInt(rainfall1) <= 19)
    {
      score1 = score1 + 1;
    }
    else if(20 <= parseInt(rainfall1) && parseInt(rainfall1) <= 99)
    {
      score1 = score1 + 3;
    }
    else if(100 <= parseInt(rainfall1))
    {
      score1 = score1 + 6;
    }
    
    //파고에 의한 평가점수
    if(parseInt(waveh1) < 2)
    {
      score1 = score1 + 0;
    }
    else if(2 <= parseInt(waveh1) && parseInt(waveh1) <= 2)
    {
      score1 = score1 + 1;
    }
    else if(3 <= parseInt(waveh1) && parseInt(waveh1) <= 4)
    {
      score1 = score1 + 3;
    }
    else if(5 <= parseInt(waveh1) && parseInt(waveh1) <= 5)
    {
      score1 = score1 + 5;
    }
    else if(6 <= parseInt(waveh1) && parseInt(waveh1) <= 99)
    {
      score1 = score1 + 7;
    }    

    if(score1 <15)
    {
      grade1 = 0;
    }
    else if(15 <= score1 && score1 <= 24)
    {
      grade1 = 1;
    }
    else if(25 <= score1 && score1<= 34)
    {
      grade1 = 2
    }
    else if(35 <= score1 && score1<= 39)
    {
      grade1 = 3
    }
    else if(40 <= score1)
    {
      grade1 = 4
    }
    
    // console.log("spd:",spd1)
    // console.log("waveh1:",waveh1)
    // console.log("rainfall1:",rainfall1)
    grdMainProps1.value.addRow({ 
    TYPN_DATE_D     : dayjs().format("YYYY-MM-DD"),
    TYPN_DATE_T     : dayjs().format("HH:mm"),
    TYPN_HPA        : grdMainProps1.value.getGridView().getValues(0)['TYPN_HPA'],//기압
    TYPN_SPD        : spd1,//풍속
    TYPN_RAINFALL   : rainfall1,//강우량
    TYPN_WAVEH      : waveh1,//파고
    TYPN_SCORE      : score1,//평가점수
    TYPN_GRADE      : grade1,//위험도
    CMPNY_DIV       : userStore.cmpnyDiv,
    TYPN_SERNO      : searchParams.TYPN,
    TYPN_DATE       : sDATE+DATE_T+'00',
    REMARK          : '',
    SAVE_YN         : 'N'},
    false)

}




const afterSearch = (res) => {
  grdMainProps1.value.getDataProvider().setRows(res.ORESULT_CUR);
}

// const reset = () => {
//   searchParams.INJR_DEPT_CD = ''
//   searchParams.DEPT_CD = ''
//   searchParams.ASGN_CD = ''
//   searchParams.ASGN_NM = ''

//   grdProps1.value.getDataProvider().setRows()
// }

// const upData = () => {
//   // console.log("upData")
//   onButtonsClick({ id: "btnSearch" })
// }

const addData = () => {

  grdMainProps1.value.addRow({ 
    TYPN_DATE_D     : dayjs().format("YYYY-MM-DD"),
    TYPN_DATE_T     : dayjs().format("HH:mm"),
    TYPN_HPA        : '',
    TYPN_SPD        : '',
    TYPN_RAINFALL   : '',
    TYPN_WAVEH      : '',
    TYPN_SCORE      : '',
    TYPN_GRADE      : codeList.TYPN_GRADE[0].CODE,
    CMPNY_DIV       : userStore.cmpnyDiv,
    TYPN_SERNO      : searchParams.TYPN,
    TYPN_DATE       : dayjs().format("YYYYMMDDHHmm00"),
    REMARK          : '',
    SAVE_YN         : 'N'},
    false)
}

const saveData = () => {

  return commonExecuteApi({ queryId : 'SPPHB0020_SAVE_01', list: saveParams.value })
}

const beforeSave = () => {
  let chekedRow = ref([])
  let bCheck = true
  chekedRow = grdMainProps1.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    bCheck = false
  }
  saveParams.value = []
  let data = ref([])

  chekedRow.forEach(val => {
    data = grdMainProps1.value.getDataProvider().getJsonRow(val)
    data.UPDATE_USER_ID = userStore.userId // 수정자
    // console.log('data: ',data);
    saveParams.value.push(data)
  })
  //console.log("저장 파라메트", saveParams.value)
  return bCheck
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

  return commonExecuteApi({ queryId: 'SPPHB0020_DELETE_01', list: saveParams.value })
}



const onEditRowChange=( grid, itemIndex, dataRow, field, oldValue, newValue )=>{
  grid.checkItem(dataRow,true)
  grid.commit()

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
          <v-sheet class ="d-flex">
          <i-select
            :label="$t('년도')"
            width="200px"
            labelWidth="50px" 
            v-model="searchParams.YEAR"
            :items="codeList.TYPN_YEAR"
            item-value="CODE"
            item-title="DISPLAY_TEXT"
            @update:modelValue="TYPNChange"
          />
          <i-select
            :label="$t('태풍')"
            width="300px"
            labelWidth="50px" 
            v-model="searchParams.TYPN"
            :items="codeList.TYPN"
            item-value="CODE"
            item-title="DISPLAY_TEXT"
            
          />
        </v-sheet>
         <v-sheet class="d-flex justify-end"
                style="
                  width: -webkit-fill-available;
                  display: flex;
                  align-items: center;
                  padding-right: 10px;
                ">
          <i-input
                :label="$t('일자')"
                v-model="aa.dteDATE_D"
                width="150px"
              />
              <i-input
                :label="$t('시간')"
                v-model="aa.dteDATE_T"
                width="100px"
              />
              <IButtonList
                :button-list="['btnWeatherInfo']"
                @click-button="onButtonsClick"
              />
          </v-sheet>
        </v-sheet>
        
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('태풍 위험도 평가')">
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
