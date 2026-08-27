<!-- SPPHF0010 실시간 피해현황 등록 -->
<!-- SI2팀 마환구 2025-03-06 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user';
import { commonSearchApi, commonExecuteApi, getCodeList,commonRequest2} from '@hiway/api/commonApi';
import queryFlowHelper from '@/utils/searchFlowHelper';
import deleteFlowHelper from '@/utils/deleteFlowHelper';
import dayjs from 'dayjs';
import Message from '@hiway/utils/notify'
import { useCommonStore } from '@hiway/stores/common'
import IGridTitle from '@/components/IGridTitle.vue'
import SPPHF0010_Popup_01 from '@/pages/50_safety-support/SPP_H/SPPHF0010Popup_01.vue'
defineOptions({
  name:'50_safety-support-SPP_H-SPPHF0010',
})

const FIUploadPopup =ref(null)
const userStore =  useUserStore()
const commonStore = useCommonStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMainProps1 = ref(null)
const saveParams= ref([])
const SPPHF0010_POPUP01=ref(null)
const isAdmin = ref(false)
const btnVisible=ref(false)

// const aa = reactive({
//   dteDATE_D: '',
//   dteDATE_T: ''
// })

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  TYPN_SERNO : '',
  BSNS_CD : '',
  DEPT_CD : '',
  ASGN_CD : '',
  TEAM_CD : ''
})

const codeList = reactive({
  TYPN: [],
  TYPN_YEAR: [],
  DAMAGE_DIV: [],
  REG_USER: []
})

const popupParam=reactive({});


//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: 'TYPN_SERNO',
      dataType: 'text',
      header: { text: t('태풍번호') },
      editable: false,
      visible : false
    },
    {
      fieldName: 'DAMAGE_DATE',
      dataType: 'text',
      editable: false,
      header: { text: t('시작일자') },
      datetimeFormat:'yyyy-MM-dd',
      editor:{type:'date', datetimeFormat:'yyyy-MM-dd',
              mask: {
              editMask: '9999-99-99',
              placeHolder: 'yyyy-MM-dd',
              includedFormat: true,
            },
          },
      width:'100'
    },
    {
      fieldName: 'DAMAGE_TIME_FR',
      dataType: 'text',
      editable: false,
      header: { text: t('시작시간') },
      // editable: TuiTreeVue,
      width:'100'
    },
    {
      fieldName: 'DAMAGE_DATE_FN',
      dataType: 'text',
      editable: false,
      header: { text: t('종료일자') },
      datetimeFormat:'yyyy-MM-dd',
      editor:{type:'date', datetimeFormat:'yyyy-MM-dd',
              mask: {
              editMask: '9999-99-99',
              placeHolder: 'yyyy-MM-dd',
              includedFormat: true,
            },
          },
      width:'100'
    },
    {
      fieldName: 'DAMAGE_TIME_FN',
      dataType: 'text',
      editable: false,
      header: { text: t('종료시간') },
      // editable: TuiTreeVue,
      width:'100'
    },
    {
      fieldName: 'RPT_USER_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('작성자') },
      width:'100'
    },
    {
      fieldName: 'RPT_USER',
      dataType: 'text',
      editable: false,
      visible : false,
      header: { text: t('작성자') },
      width:'100'
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('부서(팀)') },      
      width:'150'
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('과/협력사') },
      width:'130'
    },
    {
      fieldName: 'TEAM_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('팀') },
      width:'130'
    },
    {
      fieldName: 'L_AREA',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('대구역') },      
      width:'150',
      styleName : "wordWrap",
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'L_AREA_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('대구역') },
      width:'150',
      styleName : "wordWrap",
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'M_AREA',
      dataType: 'text',
      editable: false,
      visible : false,
      header: { text: t('중구역') },
      width:'150',
      styleName : "wordWrap",
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'M_AREA_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('중구역') },
      width:'150',
      styleName : "wordWrap",
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'S_AREA',
      dataType: 'text',
      editable: false,
      header: { text: t('소구역') },
      width:'150',
      styleName : "wordWrap",
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'SHIP_NO',
      dataType: 'text',
      editable: false,
      header: { text: t('호선') },
      width:'100',
      styleName : "wordWrap",
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'BLK_DIV',
      dataType: 'text',
      editable: false,
      header: { text: t('블록/구획') },
      width:'100',
      styleName : "wordWrap",
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'STG_TYP',
      dataType: 'text',
      editable: false,
      header: { text: t('공정/공종') },
      width:'100',
      styleName : "wordWrap",
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'STG_DATE',
      dataType: 'text',
      editable: false,
      header: { text: t('공정영향(일)') },
      styleName : "wordWrap left-column",
      width:'100'
    },
    {
      fieldName: 'DAMAGE_DIV',
      dataType: 'text',
      editable: false,
      visible : false,
      header: { text: t('피해유형') },
      width:'100'
    },
    {
      fieldName: 'DAMAGE_DIV_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('피해유형') },
      width:'100',
    },
    {
      fieldName: 'DAMAGE_DESC',
      dataType: 'text',
      editable: false,
      visible : false,
      header: { text: t('피해내용') },
      width:'450',
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'WRK_DESC',
      dataType: 'text',
      editable: false,
      header: { text: t('피해내용') },
      styleName: 'left-column wordWrap',
      width:'450',
      style :{
        textWrapping: "normal"
      }
    },
    {
      fieldName: 'WRK_QTY',
      dataType: 'text',
      editable: false,
      header: { text: t('투입/물량') },
      width:'100',
      styleName: 'right-column',
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'QTY_UNIT',
      dataType: 'text',
      editable: false,
      visible : false,
      header: { text: t('단위') },
      width:'80',
    },
    {
      fieldName: 'QTY_UNIT_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('단위') },
      width:'80',
    },
    {
      fieldName: 'IMAGE_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('사진첨부') },
      width:'80'
    },

    {
      fieldName: 'SPOT_X',
      dataType: 'text',
      editable: false,
      header: { text: t('경도') },
      styleName: 'right_column',
      width:'100'
    },
    {
      fieldName: 'SPOT_Y',
      dataType: 'text',
      editable: false,
      header: { text: t('위도') },
      styleName: 'right_column',
      width:'100'
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      editable: false,
      header: { text: t('비고') },
      styleName: 'left-column',
      width:'200',
      style :{
        textWrap: "explicit"
      }
    },
    {
      fieldName: 'ATTACH_ID',
      dataType: 'text',
      editable: false,
      visible : false
    },
    { fieldName: 'SAVE_YN', dataType: 'text', visible:false},
    { fieldName: 'ORGN_SEQNO', dataType: 'text', visible:false},
    { fieldName: 'SEQNO', dataType: 'text', visible:false},
    { fieldName: 'DEPT_CD', dataType: 'text', visible:false},
    { fieldName: 'ASGN_CD', dataType: 'text', visible:false},
    { fieldName: 'TEAM_CD', dataType: 'text', visible:false},
    { fieldName: 'REAL_TIME_YN', dataType: 'text', visible:false},
    
    // { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false},
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields


//그리드 데이터 입력

onMounted( async () => {

  if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('SPPH001','GRP00392'))
  { 
    isAdmin.value = true  
  }


  let param = {
    CMPNY_DIV: userStore.cmpnyDiv
  }
  // 조회용 태풍 발생 년도 호출(SPPHE0030_COMBO_01)
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_01', param: param })
    .then(res => {
      // console.log("res1 :",res)
      codeList.TYPN_YEAR = res.ORESULT_CUR
       if (codeList.TYPN_YEAR.length > 0) {
         // 첫 번째 값 설정
         searchParams.YEAR = codeList.TYPN_YEAR[0].CODE
      }

        //그리드 표시용 태풍 내역 호출(SPPHE0030_COMBO_02)
    return commonSearchApi({ queryId: 'SPPHF0010_COMBO_02',param:{
                      CMPNY_DIV: userStore.cmpnyDiv,
                      YYYY: searchParams.YEAR
                  }})
    .then(res1 => {
      
      codeList.TYPN = res1.ORESULT_CUR
        if (codeList.TYPN.length > 0) {
          searchParams.TYPN_SERNO=codeList.TYPN[0].CODE
      }
    })
    })
  
  // 조회용 회사 호출(SPPHE0030_COMBO_03)  
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_03', param: {} })
    .then(res => {
        codeList.cmpnydiv = res.ORESULT_CUR
        searchParams.CMPNY_DIV=userStore.cmpnyDiv
      }
      
  )

    // 조회용 사업부 호출(SPPHE0030_COMBO_03)  
    await commonSearchApi({ queryId: 'SPPHF0010_COMBO_04', param: param })
    .then(res => {
        codeList.bsns = res.ORESULT_CUR
        if(codeList.bsns.length>0)
        {
          codeList.bsns.unshift({CODE:'', DISPLAY_TEXT:"전체"})  
          searchParams.BSNS_CD = userStore.bsnsCd =='' ? codeList.bsns[0].CODE : userStore.bsnsCd;
        }
      }
  )

    // 조회용 부서 호출(SPPHE0030_COMBO_03)  
    await commonSearchApi({ queryId: 'SPPHF0010_COMBO_05', param: {
    CMPNY_DIV : param.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD 
  } })
    .then(res => {
        // console.log("res:",res)
        codeList.dept = res.ORESULT_CUR
        if(codeList.dept.length > 0)
        {
          codeList.dept.unshift({CODE:'', DISPLAY_TEXT:"전체"})  
          searchParams.DEPT_CD = userStore.deptCd == '' ? codeList.dept[0].CODE : userStore.deptCd;
          //searchParams.DEPT_CD = '';
        }
      }
  )
    

    
  //initCodeList()
  grdMainProps1.value.getGridView().filterPanel.visible = true;
  
  onButtonsClick({ id: 'btnSearch' })

})


const TYPNChange = async e => { 
  codeList.TYPN = []

  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YYYY: searchParams.YEAR
  }
  Promise.all([
    await commonSearchApi({ queryId: 'SPPHF0010_COMBO_02', param: param })
  ]).then(res => {
    codeList.TYPN = res[0].ORESULT_CUR
    if (codeList.TYPN.length > 0) {
          searchParams.TYPN_SERNO=codeList.TYPN[0].CODE
    }
  })
}

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    // console.log("searchParams:",searchParams)
    new queryFlowHelper(vm, t)
      .setGridList([grdMainProps1])
      .setQuery(()=>{
        return commonSearchApi({
          queryId: "SPPHF0010_SEARCH_01",
          param: searchParams,
        })
      })
      .setAfter(afterSearch)
      .showMessage(true)
      .run();
  }
  else if(btn.id=='btnCreate')
  {
    addData("C");
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
  else if(btn.id=='btnExcelDown')
  {
    excelDown()
  }
}

const excelDown = async ()=>{

    searchParams.TYPN_NM=""
    searchParams.DEPT_NM=""
    
    let typn_nm = codeList.TYPN.find((item)=>item.CODE==searchParams.TYPN_SERNO).DISPLAY_TEXT;
    let dept_nm = codeList.dept.find((item)=>item.CODE==searchParams.DEPT_CD).DISPLAY_TEXT;
    
    searchParams.TYPN_NM=typn_nm
    searchParams.DEPT_NM=dept_nm

    // console.log("searchParams :",searchParams);
    
    commonStore.loading = true
    commonRequest2('hse/excel/SPPHF0010_EXCEL', searchParams).then((res) => {
    commonStore.loading = false

    const blob = new Blob([res], { type: res.type })
    
    const link = document.createElement('a')
    
    //const fileName = `현황 - ${bsnsNm} ${searchParam.YEAR}년도 ${reqDivNm.trim()} ${reqChaNm} 최종산출`.trim()
    const fileName = dayjs().format("YYYYMMDDhhmmss")+'_태풍피해상황'.trim()

    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
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

const addData = (value) => {
 //수정은 M 등록은 C

  popupParam.DIV=value
  popupParam.btnVisible=isAdmin.value

if(value=="C")
{
  if(searchParams.BSNS_CD=="")
  {
    return Message.warn(t('사업부를 선택해주세요'))
  }
  else if(searchParams.DEPT_CD=="")
  {
    return Message.warn(t('부서(팀)를 선택해주세요'))
  }
  popupParam.CMPNY_DIV=userStore.cmpnyDiv
  popupParam.YEAR=searchParams.YEAR
  popupParam.TYPN_SERNO=searchParams.TYPN_SERNO
  popupParam.BSNS_CD=searchParams.BSNS_CD
  popupParam.DEPT_CD=searchParams.DEPT_CD
  popupParam.ASGN_CD=searchParams.ASGN_CD
  popupParam.TEAM_CD=searchParams.TEAM_CD

}

//  SPPHF0010_POPUP01.value.openPopup(searchParams)
  SPPHF0010_POPUP01.value.openPopup(popupParam)
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
    data.CMPNY_DIV=userStore.cmpnyDiv;
    data.TYPN_SERNO=searchParams.TYPN_SERNO;
    
    saveParams.value.push(data)
    
  })

  for(let i in saveParams.value)
  {
    // console.log(saveParams.value[i].REAL_TIME_YN);
    if(saveParams.value[i].REAL_TIME_YN=="Y")
    {
      Message.warn(t('실시간 피해등록 정보는 삭제되지 않습니다.'))    
      return false
    }
  }

  // console.log('saveParams:',saveParams);
  return commonExecuteApi({ queryId: 'SPPHF0010_DELETE_01', list: saveParams.value })
}

function onCMPNYChanged(newValue){
  searchParams.CMPNY_DIV=newValue

  let param ={
    CMPNY_DIV : searchParams.CMPNY_DIV
  };

  commonSearchApi({ queryId: 'SPPHF0010_COMBO_04', param: param })
    .then(res => {
        codeList.bsns = res.ORESULT_CUR
        if(codeList.bsns.length>0)
        {
          searchParams.BSNS_CD = codeList.bsns[0].CODE;
          onBsnsChanged(searchParams.BSNS_CD)
        }
      }
  )
}

function onBsnsChanged(newValue){
  searchParams.BSNS_CD=newValue

  commonSearchApi({ queryId: 'SPPHF0010_COMBO_05', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD 
  } })
    .then(res => {
        codeList.dept = res.ORESULT_CUR
        if(codeList.dept.length>0)
        {
          codeList.dept.unshift({CODE:"", DISPLAY_TEXT:"전체"})  
          searchParams.DEPT_CD=""
          onDeptChanged(searchParams.DEPT_CD)
        }
      }
  )
    }

function onDeptChanged(newValue){
  searchParams.DEPT_CD=newValue
  
  commonSearchApi({ queryId: 'SPPHF0010_COMBO_06', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD 
  } })
    .then(res => {
        codeList.asgn = res.ORESULT_CUR
        if(codeList.asgn.length>0)
        {
          codeList.asgn.unshift({CODE:'', DISPLAY_TEXT:"전체"})  
          searchParams.ASGN_CD=''
          onAsgnChanged(searchParams.ASGN_CD)
        }
        
      }
  )
}

function onAsgnChanged(newValue){
  searchParams.ASGN_CD=newValue

  commonSearchApi({ queryId: 'SPPHF0010_COMBO_07', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD, 
    ASGN_CD : searchParams.ASGN_CD
  } })
    .then(res => {
        codeList.team = res.ORESULT_CUR
        if(codeList.team.length>0)
        {
          codeList.team.unshift({CODE:'', DISPLAY_TEXT:"전체"})  
          searchParams.TEAM_CD=''
        }
      }
  )
}

function onCellDblClicked(grid, col)
{  
  popupParam.CMPNY_DIV=userStore.cmpnyDiv
  popupParam.YEAR=searchParams.YEAR
  popupParam.TYPN_SERNO=searchParams.TYPN_SERNO
  popupParam.BSNS_CD=searchParams.BSNS_CD
  popupParam.DEPT_CD=grdMainProps1.value.getGridView().getValues(col.dataRow)['DEPT_CD']
  popupParam.ASGN_CD=grdMainProps1.value.getGridView().getValues(col.dataRow)['ASGN_CD']
  popupParam.TEAM_CD=grdMainProps1.value.getGridView().getValues(col.dataRow)['TEAM_CD']
  popupParam.SEQNO=grdMainProps1.value.getGridView().getValues(col.dataRow)['SEQNO']
  popupParam.L_AREA=grdMainProps1.value.getGridView().getValues(col.dataRow)['L_AREA']
  popupParam.M_AREA=grdMainProps1.value.getGridView().getValues(col.dataRow)['M_AREA']

  addData("M");
}

const closed=(val)=>
{
  console.log(val)
  if(val=='Y')
  {
    onButtonsClick({ id: 'btnSearch' });
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnCreate','btnDelete','btnExcelDown']"
        @click-button="onButtonsClick"
        :usePermission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex"  style="margin:0px; padding:5px;">         
          <v-sheet class ="d-flex">
          <i-select
            :label="$t('년도')"
            width="200px"
            labelWidth="40px" 
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
            v-model="searchParams.TYPN_SERNO"
            :items="codeList.TYPN"
            item-value="CODE"
            item-title="DISPLAY_TEXT"
          />
          </v-sheet>
        </v-sheet>
        <v-sheet class="searchArea d-flex" style="margin:0px; padding:5px;">         
          <v-sheet  class ="d-flex">
            <!-- 회사 -->
            <i-select
              v-model="searchParams.CMPNY_DIV"
              :label="$t('회사')"
              :items="codeList.cmpnydiv"
              item-value="CODE"
              item-title="TEXT" 
              label-width="40px"
              width="250px"
              @update:modelValue="onCMPNYChanged"
            />
            <!-- 사업부 -->
            <i-select
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')"
              :items="codeList.bsns"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="40px"
              width="210px"
              @update:modelValue="onBsnsChanged"
            />  
            <!-- 부서(팀) -->
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서(팀)')"
              :items="codeList.dept"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="50px"
              width="210px"
              @update:modelValue="onDeptChanged"
            />     
            <!-- 과/협력사 -->
            <i-select
              v-model="searchParams.ASGN_CD"
              :label="$t('과/협력사')"
              :items="codeList.asgn"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="60px"
              width="210px"
              @update:modelValue="onAsgnChanged"
            />     
            <!-- 팀 -->
            <i-select
              v-model="searchParams.TEAM_CD"
              :label="$t('팀')"
              :items="codeList.team"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="20px"
              width="150px"

            />   
        </v-sheet>
      </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('태풍 피해복구 실적 현황')">
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
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>


  <SPPHF0010_Popup_01 ref="SPPHF0010_POPUP01" @closed="closed"/>
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
    min-height: 400px;
  }
}
</style>
