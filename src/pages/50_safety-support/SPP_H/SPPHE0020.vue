<!-- SPPHE0020 태풍 상황일지 등록 -->
<!-- SI2팀 마환구 2025-03-04 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user';
import { commonSearchApi, commonExecuteApi, getCodeList,commonRequest2} from '@hiway/api/commonApi';
import queryFlowHelper from '@/utils/searchFlowHelper';
import saveFlowHelper from '@/utils/saveFlowHelper';
import deleteFlowHelper from '@/utils/deleteFlowHelper';
import dayjs from 'dayjs';
import Message from '@hiway/utils/notify'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { useCommonStore } from '@hiway/stores/common'
import IGridTitle from '@/components/IGridTitle.vue'
import TuiTreeVue from '@/components/TuiTree.vue'

defineOptions({
  name:'50_safety-support-SPP_H-SPPHE0020',
})

const FIUploadPopup =ref(null)
const userStore =  useUserStore()
const commonStore = useCommonStore()

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMainProps1 = ref(null)
const saveParams= ref([])
const isAdmin = ref(false)

// const aa = reactive({
//   dteDATE_D: '',
//   dteDATE_T: ''
// })

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : '', 
  TYPN_SERNO : '',
  BSNS_CD : '',
  TYPN_DATE : '',
  TYPN_TIME : ''
})

const codeList = reactive({
  TYPN: [],
  TYPN_YEAR: []
})


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
      fieldName: 'TYPN_DATE',
      dataType: 'text',
      editable: true,
      header: { text: t('일자') },
      datetimeFormat:'yyyy-MM-dd',
      editor:{type:'date', datetimeFormat:'yyyy-MM-dd',
              mask: {
              editMask: '9999-99-99',
              placeHolder: 'yyyy-MM-dd',
              includedFormat: true,
            },
          },
      styleName: 'editable_column',
      width:'100'
    },
    {
      fieldName: 'TYPN_TIME',
      dataType: 'text',
      header: { text: t('시간') },
      editable: TuiTreeVue,
      styleName: 'editable_column',
      width:'100'
    },
    {
      fieldName: 'OCCR_DESC',
      dataType: 'text',
      editable: true,
      header: { text: t('발생내용') },
      styleName: 'editable_column left-column',
      width:'300',
    },
    {
      fieldName: 'RPT_USER',
      dataType: 'text',
      editable: false,
      header: { text: t('보고자') },
      width:'100'
    },
    {
      fieldName: 'IMAGE_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('사진첨부') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20
        
        if (dataCell.value=="N") {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/paperclip.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        else if(dataCell.value=="Y")
        {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/image-search-outline.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        else
        {
          
        }
        return ret;
      },
      width:'80',
      styleName: 'editable_column',
    },
    {
      fieldName: 'ACT_DESC',
      dataType: 'text',
      editable: true,
      header: { text: t('조치 내용/결과') },
      styleName: 'editable_column left-column',
      width:'300'
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      editable: true,
      header: { text: t('비고') },
      styleName: 'editable_column left-column',
      width:'300'
    },
    {
      fieldName: 'ATTACH_ID',
      dataType: 'text',
      editable: false,
      visible : false
    },
    { fieldName: 'SAVE_YN', dataType: 'text', visible:false},
    // { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false},
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields


//그리드 데이터 입력

onMounted( async () => {
  if(useLogsStore().isMenuAdmin === 'Y' ||['SPPH001', 'GRP00392'].some(code => userStore.authGrpCd.includes(code)))
  { 
    isAdmin.value = true  
  }
  
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv
  }
  // 조회용 태풍 발생 년도 호출(SPPHE0020_COMBO_01)
  await commonSearchApi({ queryId: 'SPPHE0020_COMBO_01', param: param })
    .then(res => {
      // console.log("res1 :",res)
      codeList.TYPN_YEAR = res.ORESULT_CUR
       if (codeList.TYPN_YEAR.length > 0) {
         // 첫 번째 값 설정
         searchParams.YEAR = codeList.TYPN_YEAR[0].CODE
      }

        //그리드 표시용 태풍 내역 호출(SPPHE0020_COMBO_02)
    return commonSearchApi({ queryId: 'SPPHE0020_COMBO_02',param:{
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
    
  //initCodeList()
  grdMainProps1.value.getGridView().filterPanel.visible = true;


  onButtonsClick({ id: 'btnSearch' })

})


const TYPNChange = async e => { 
  // SPPHE0020_COMBO_02
  //그리드 표시용 태풍 내역 호출(SPPHB0020_SEARCH_03)
  commonSearchApi({ queryId: 'SPPHE0020_COMBO_02',param:{
    CMPNY_DIV: userStore.cmpnyDiv,
    YYYY: searchParams.YEAR
    }})
    .then(res1 => {
      
      codeList.TYPN = res1.ORESULT_CUR
        if (codeList.TYPN.length > 0) {
          searchParams.TYPN_SERNO=codeList.TYPN[0].CODE
      }
    })
}

const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMainProps1])
      .setQuery(()=>{
        return commonSearchApi({
          queryId: "SPPHE0020_SEARCH_01",
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
  else if(btn.id=='btnExcelDown')
  {
    excelDown()
  }
}

const excelDown = async ()=>{

    searchParams.TYPN_NM=""
    
    let typn_nm = codeList.TYPN.find((item)=>item.CODE==searchParams.TYPN_SERNO).DISPLAY_TEXT;
    
    searchParams.TYPN_NM=typn_nm
    
    commonStore.loading = true
    commonRequest2('hse/excel/SPPHE0020_EXCEL', searchParams).then((res) => {
    commonStore.loading = false

    const blob = new Blob([res], { type: res.type })
    let date=dayjs().format("YYYYMMDDhhmmss")
    
    
    const link = document.createElement('a')
    
    //const fileName = `현황 - ${bsnsNm} ${searchParam.YEAR}년도 ${reqDivNm.trim()} ${reqChaNm} 최종산출`.trim()
    const fileName = `${date}_태풍 상황일지`.trim()

    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

const afterSearch = (res) => {
  grdMainProps1.value.getDataProvider().setRows(res.ORESULT_CUR);


  grdMainProps1.value.setDisplayOptions({
    columnResizable: true, // 컬럼 크기 조정 가능
    rowResizable: true // 사용자가 마우스로 행 높이 변경 가능
  });

  grdMainProps1.value.getGridView().setColumnProperty("OCCR_DESC", "resizable", true);
  grdMainProps1.value.getGridView().setColumnProperty("ACT_DESC", "resizable", true);
}

// const reset = () => {
//   searchParams.INJR_DEPT_CD = ''
//   searchParams.DEPT_CD = ''
//   searchParams.ASGN_CD = ''
//   searchParams.ASGN_NM = ''

//   grdProps1.value.getDataProvider().setRows()
// }

const addData = () => {

  grdMainProps1.value.addRow({ 
    TYPN_SERNO    : searchParams.TYPN,
    TYPN_DATE     : dayjs().format("YYYY-MM-DD"),
    TYPN_TIME     : dayjs().format("HH:mm"),
    OCCR_DESC     : '',
    RPT_USER      : userStore.userName,
    IMAGE_YN      : '',
    ACT_DESC      : '',
    REMARK        : '',
    ATTACH_ID     : '',
    SAVE_YN       : 'N'},
    false)
}

const saveData = () => {
  // saveParams.forEach(val => {
  //   data = grdProps1.value.getDataProvider().getJsonRow(val)
  //   // data.UPDATE_USER_ID = userStore.userId // 수정자
  //   console.log("Data :" ,data)
  //    saveParams.value.push(data)
  // })
  // console.log('saveParams: ',saveParams);

  return commonExecuteApi({ queryId : 'SPPHE0020_SAVE_01', list: saveParams.value })
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
    data.ORG_TYPN_DATE=data.TYPN_DATE.replace(/-/g,"")
    data.ORG_TYPN_TIME=data.TYPN_TIME.replace(/:/g,"")
    data.TYPN_DATE=data.TYPN_DATE.replace(/-/g,"")
    data.TYPN_TIME=data.TYPN_TIME.replace(/:/g,"")
    data.TYPN_SERNO=searchParams.TYPN_SERNO;
    data.BSNS_CD=userStore.bsnsCd;
    data.CMPNY_DIV=userStore.cmpnyDiv;
    // console.log('data: ',data);
    if(data.OCCR_DESC=="")
    {
      Message.warn(t('발생내용을 입력해주세요'))
      bCheck = false
    }
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
    data.ORG_TYPN_DATE=data.TYPN_DATE.replace(/-/g,"")
    data.ORG_TYPN_TIME=data.TYPN_TIME.replace(/:/g,"")
    data.CMPNY_DIV=userStore.cmpnyDiv;
    data.TYPN_SERNO=searchParams.TYPN_SERNO;
    
    saveParams.value.push(data)
    
  })

  return commonExecuteApi({ queryId: 'SPPHE0020_DELETE_01', list: saveParams.value })
}

const dataRow=ref(null);
function onCellItemClicked (grid, index, col) {
  // console.log("isAdmin:",isAdmin.value)
  if(isAdmin.value)
  {
    if (col.fieldName === 'IMAGE_YN') {
      if(grdMainProps1.value.getGridView().getValues(col.dataRow)['SAVE_YN']=='Y')
      {
        let fileId=grdMainProps1.value.getGridView().getValues(col.dataRow)['ATTACH_ID']
        dataRow.value = col.dataRow;
        FIUploadPopup.value.openPopup(fileId);
      }
    }
  }
}

const uploaded = val =>{
  
  let saveParam=[];
  let Param={
    CMPNY_DIV : searchParams.CMPNY_DIV,
    TYPN_SERNO :searchParams.TYPN_SERNO ,
    TYPN_DATE : grdMainProps1.value.getGridView().getValues(dataRow.value)['TYPN_DATE'].replace(/-/g,""),
    TYPN_TIME : grdMainProps1.value.getGridView().getValues(dataRow.value)['TYPN_TIME'].replace(/:/g,""),
    ATTACH_ID : val.fileId,
    USER_ID : userStore.userId
  }
  saveParam.push(Param);

  // if(val.rowCnt>0)
  // {
  commonExecuteApi
  ({ 
      queryId : 'SPPHE0020_ATTACH_SAVE_01'
    , list: saveParam
  }).then((res)=>{
    onButtonsClick({id:"btnSearch"});
    // grdMainProps1.value.getDataProvider().setValue(dataRow.value,'IMAGE_YN','Y')
    // grdMainProps1.value.getDataProvider().setValue(dataRow.value,'ATTACH_ID',val.fileId)
  })
  // }
  // else
  // {
  //   // grdMainProps1.value.getDataProvider().setValue(dataRow.value,'IMAGE_YN','N')
  // }
  // grdMainProps1.value.getGridView().checkItem(dataRow.value, true)
  // grdMainProps1.value.getGridView().commit()
}

// const deleted = val =>{
//   grdMainProps1.value.getGridView().checkItem(dataRow.value, true)
//   grdMainProps1.value.getGridView().commit()
//   if(val.rowCnt>0)
//   {
//     grdMainProps1.value.getDataProvider().setValue(dataRow.value,'IMAGE_YN','Y')
//   }
//   else
//   {
//     grdMainProps1.value.getDataProvider().setValue(dataRow.value,'IMAGE_YN','N')
//   }
// }
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnCreate','btnUpdate','btnDelete','btnExcelDown']"
        @click-button="onButtonsClick"
        :usePermission="true"
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
            v-model="searchParams.TYPN_SERNO"
            :items="codeList.TYPN"
            item-value="CODE"
            item-title="DISPLAY_TEXT"
            
          />
        </v-sheet>
      </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('태풍 상황일지 현황')">
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
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>

  <IUploadPopup 
    ref="FIUploadPopup" 
    width="1200" 
    height="800"
    @uploaded="uploaded"
    :buttonList="['btnFileUpload','btnDownLoad', 'btnDelete', 'btnClose']"
    :imgOnly="true"
    ></IUploadPopup>

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
