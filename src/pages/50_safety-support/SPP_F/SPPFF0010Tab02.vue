<!-- SPPFF0010 장비점검 및 유지관리 -->
<!-- SI1팀 마환구 2025.07.03 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
  commonRequest2
} from '@hiway/api/commonApi'
import {
  commonDeletFilesApi,
  commonDeleteAllFilesApi
} from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
// import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import Message from '@hiway/utils/notify'
import HHI_color_ko from '@/assets/images/ci/HHI_color_ko.png' 
import { useCommonStore } from '@/@hiway/stores/common'
// import { isEmpty, isEmptyArray } from "@/@core/utils"

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const useLogStore = useLogsStore()
const commonStore = useCommonStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)


const selectrow = ref(null)


// const bsnsCd =ref(null);
// const deptCd =ref(null);
// const processCd =ref(null);
// const bsnsNm =ref(null);
// const deptNm =ref(null);
// const processNm =ref(null);
// const processDetail =ref(null);
// const processDetailSeq =ref(null);
// const psiSeq =ref(null);


// const popupParam=reactive({});

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.userId,
})

const saveParams = reactive({});

const isAdmin = ref(0)

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  process: []
})

const initCodeList = () => {
  // console.log("searchParams:",searchParams)
  Promise.all([ 
    commonSearchApi({ queryId: 'SPPFF0010_COMBO_01', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFF0010_COMBO_02', param: {CMPNY_DIV : userStore.cmpnyDiv, BSNS_CD : ''} }),
    commonSearchApi({ queryId: 'SPPFF0010_COMBO_03', param: {CMPNY_DIV : userStore.cmpnyDiv, BSNS_CD : '', DEPT_CD:''} }),

  ]).then(res => {    
    
    codeList.bsnscd = res[0].ORESULT_CUR
    // if(searchParams.BSNS_CD !== '') {
      codeList.deptcd = res[1].ORESULT_CUR
      codeList.process = res[2].ORESULT_CUR
    // }


    if(codeList.bsnscd.length>0)
    {
      grdMain1.value.setBindingColumn("BSNS_CD",codeList.bsnscd,'BSNS_CD','BSNS_NM')
      codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    }
    else
    {
      codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    }
    
    if(codeList.deptcd.length>0)
    {
      grdMain1.value.setBindingColumn("DEPT_CD",codeList.deptcd,'DEPT_CD','DEPT_NM')
      codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    }
    else
    {
      codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    }
    
    if(codeList.process.length>0)
    {
      grdMain1.value.setBindingColumn("PROCESS_CD",codeList.process,'COD','TXT')
      codeList.process.unshift({ TXT: '전체', COD: '' })
    }
    else
    {
      codeList.process.unshift({ TXT: '전체', COD: '' })
    }
  })
  
}

// 등록/수정 구분자
const isNew = ref(false)

const onButtonsClick = btn => {
  if(btn.id === 'btnCreate') {
    // openPopup("C")
    addData();
  }
  else if(btn.id === 'btnSearch') {
    getData()
  }
  else if(btn.id=='btnUpdate')
  {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain1])
      .setBefore(beforeSave)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id=='btnDelete')
  {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain1])
      .setBefore(beforeDelete)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
  else if(btn.id=='btnPrint')
  {
    reportPrint()
  }
}

const reportPrint = () =>{

  console.log(searchParams.BSNS_CD)
  console.log(searchParams.DEPT_CD)
  if(searchParams.BSNS_CD=="")
  {
    return Message.warn(t('사업부를 선택 해주세요'))
  }
  if(searchParams.DEPT_CD=="")
  {
    return Message.warn(t('부서를 선택 해주세요'))
  }
  

  fetch(HHI_color_ko)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1]  // ← 헤더 제외
          searchParams.IMG_BASE64 = base64data

          commonStore.loading = true

          commonRequest2('hse/excel/SPPFF0010_PRINT_03', searchParams).then((res) => {
            commonStore.loading = false
            const blob = new Blob([res], { type: res.type })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = '예비품 목록'
            link.click()
            URL.revokeObjectURL(link.href)
          })
        }
        reader.readAsDataURL(blob)
      })

}

const beforeDelete = () =>{
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true)
  
  if(checkedRows.length==0)
  {
    return Message.warn(t('삭제 할 데이터가 없습니다.'))
  }
  
  return true;
}

const deleteData = () => {
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true)
  
  let deleteData=[]
  for(let idx of checkedRows)
  {
    let data =grdMain1.value.getDataProvider().getJsonRow(idx)
    data.CMPNY_DIV = userStore.cmpnyDiv
    data.USER_ID = userStore.userId;
    deleteData.push(data)
  }
  return commonExecuteApi({ queryId: 'SPPFF0010_DELETE_01', list: deleteData })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const beforeSave = () => {
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true)
  
  if(checkedRows.length==0)
  {
    return Message.warn(t('저장 할 데이터가 없습니다.'))
  }
  
  for(let idx of checkedRows)
  {
    let data =grdMain1.value.getDataProvider().getJsonRow(idx)
    
    if(!data.BSNS_CD)
    {
      return Message.warn(t('사업부를 선택해주세요'))
    }
    if(!data.DEPT_CD)
    {
      return Message.warn(t('부서를 선택해주세요'))
    }
    if(!data.PROCESS_CD)
    {
      return Message.warn(t('사업부를 선택해주세요'))
    }
    if(!data.PROCESS_PARTS)
    {
      return Message.warn(t('부품명을 입력해주세요'))
    }
  }

  return true;
  
}

const saveData = () => {
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true)
  
  let saveData=[]
  for(let idx of checkedRows)
  {
    let data =grdMain1.value.getDataProvider().getJsonRow(idx)
    data.CMPNY_DIV = userStore.cmpnyDiv
    data.USER_ID = userStore.userId;
    saveData.push(data)
  }
  return commonExecuteApi({ queryId: 'SPPFF0010_SAVE_05', list: saveData })
}

const afterSave =() => {
   onButtonsClick({ id: 'btnSearch' })
}

const addData=()=>{

  grdMain1.value.addRow({
    BSNS_CD             : "",
    DEPT_CD             : "",
    PROCESS_CD          : "",
    PROCESS_PARTS       : "",
    PARTS_SPEC          : "",
    PARTS_MANUFACTURER  : "",
    CUR_STOCK           : "",
    SAFE_STOCK          : "",
    REMARKS             : "",
    SEQ_IDX             : 0
    }, false)
}


const getData = () => {

  // if(val=="B")
  // {
  //   selectrow.value=0
  // }
  // else
  // {
  //   selectrow.value=selectrow.value;
  // }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain1])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

// 공정안전 자료와 관계없는 관리자가 왔을때 콤보박스 바인딩
const selectedBsnsCd = computed({
  get: () => {
    return codeList.bsnscd.some(item => item.BSNS_CD === searchParams.BSNS_CD)
      ? searchParams.BSNS_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.BSNS_CD = value;
  }
});

const selectedDeptCd = computed({
  get: () => {
    return codeList.deptcd.some(item => item.DEPT_CD === searchParams.DEPT_CD)
      ? searchParams.DEPT_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.DEPT_CD = value;
  }
})

//  조회
const searchData = () => {
  
  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: codeList.bsnscd.some(item => item.BSNS_CD === searchParams.BSNS_CD) ? searchParams.BSNS_CD : '', //사업부
    DEPT_CD: codeList.deptcd.some(item => item.DEPT_CD === searchParams.DEPT_CD) ? searchParams.DEPT_CD : '', //부서
    PROCESS_CD: searchParams.PROCESS_CD, //공정설비
  }
  // console.log("param:",param);
  
  return commonSearchApi({ queryId: 'SPPFF0010_SEARCH_05', param: param })  
}

// 조회 후
const afterSearch = (res) => {
  
  grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);

}

//사업부변경 감지
watch(

  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    const param = {CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue,}
    if(newValue !== '') {
      Promise.all([ 
        commonSearchApi({ queryId: 'SPPFF0010_COMBO_02', param: searchParams }),
        commonSearchApi({ queryId: 'SPPFF0010_COMBO_03', param: searchParams }),
      ]).then((res) => {
        searchParams.DEPT_CD = ''
        searchParams.PROCESS_CD = ''
        codeList.deptcd = res[0].ORESULT_CUR
        codeList.process = []
        // codeList.process = res[1].ORESULT_CUR
        codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        codeList.process.unshift({ TXT: '전체', COD: '' })
  
      })
    }else {
      searchParams.DEPT_CD = ''
      searchParams.PROCESS_CD = ''
      codeList.deptcd = []
      codeList.process = []
      codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      codeList.process.unshift({ TXT: '전체', COD: '' })

    }
  }
)

// 부서변경 감지
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    if(newValue !== '') {
      commonSearchApi({ 
        queryId: 'SPPFF0010_COMBO_03', 
        param: { 
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: newValue
        } 
      }).then((res) => {
        searchParams.PROCESS_CD = ''
        codeList.process = res.ORESULT_CUR
        codeList.process.unshift({ TXT: '전체', COD: '' })
      })
    }else {
      // console.log('dept and process Empty!')
      searchParams.PROCESS_CD = ''
      codeList.process = []
      codeList.process.unshift({ TXT: '전체', COD: '' })
    }                                                 
  }
)




//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption : { 
    edit: { editable:true },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'BSNS_CD', dataType: 'text', width: '100', styleName: 'center-column',editable:true,
      header: { text: t('사업부'),}, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
    },
    { 
      fieldName: 'DEPT_CD', dataType: 'text', width: '100', styleName: 'center-column',editable:true,
      header: { text: t('부서') }, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true },
      'styleCallback': function(grid, dataCell){
        var ret = {editable : true, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var dropList = { DEPT_CD: [], DEPT_NM: [] }
        var bsnsCd = grid.getValue(dataCell.index.itemIndex, 'BSNS_CD')
        for(let cd of codeList.deptcd) {
          if((bsnsCd == null || bsnsCd == '') || bsnsCd == cd.BSNS_CD) {
            dropList.DEPT_CD.push(cd.DEPT_CD)
            dropList.DEPT_NM.push(cd.DEPT_NM)
          }
        }
        ret.editor = {
          type: 'dropdown',
          values: dropList.DEPT_CD,
          labels: dropList.DEPT_NM,
          editable : true, 
          styleName : 'middle_column', 
          enabled: false
        }
        return ret
      },
    },
    { 
      fieldName: 'PROCESS_CD', dataType: 'text', width: '150', styleName: 'left-column',editable:true,
      header: { text: t('PSM 대상설비') }, lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true }, 
      'styleCallback': function(grid, dataCell){
        var ret = {editable : true, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var dropList = { COD: [], TXT: [] }
        var bsnsCd = grid.getValue(dataCell.index.itemIndex, 'BSNS_CD')
        var deptCd = grid.getValue(dataCell.index.itemIndex, 'DEPT_CD')
        for(let cd of codeList.process) {
          if((deptCd == null || deptCd == '') || deptCd == cd.DEPT_CD && bsnsCd == cd.BSNS_CD) {
            dropList.COD.push(cd.COD)
            dropList.TXT.push(cd.TXT)
          }
        }
        ret.editor = {
          type: 'dropdown',
          values: dropList.COD,
          labels: dropList.TXT,
          editable : true, 
          styleName : 'middle_column', 
          enabled: false
        }
        return ret
      },
    },
    { 
      fieldName: 'PROCESS_PARTS', dataType: 'text', width: '150', styleName: 'left-column',editable:true,
      header: { text: t('부품명') }, 
    },
    {
      fieldName: 'PARTS_SPEC', dataType: 'text', width: '100', styleName: 'left-column',editable:true,
      header: { text: t('사양') },
    },
    {
      fieldName: 'PARTS_MANUFACTURER', dataType: 'text', width: '100', styleName: 'left-column', editable:true,
      header: { text: t('제조사') }, 
    },
    {
      fieldName: 'CUR_STOCK', dataType: 'number', width: '100', styleName: 'right-column',
      header: { text: t('현재 재고') }, editable : true,
      editor:{
        type:'number',
      },
      renderer: {
        type: 'text',
        options: {
          numberFormat: '#,##0',
          textAlignment: 'far'
        }
      },
      'styleCallback': function(grid, dataCell){
        var ret = { type:'number', editable : true, styleName : 'right-column', enabled: true,style: {textAlignment: 'far'}}
        const value = Number(grid.getValue(dataCell.index.itemIndex, 'SAFE_STOCK'));
        
        if (!value) return null;
           
        if(value > Number(dataCell.value))
        {
          ret.style = {background:'#FFCCCC', textAlignment:'far'}
          
        }
        else if(value == Number(dataCell.value))
        {
          ret.style = {background:'#FFF8B3', textAlignment:'far'}
        }
        else
        {
          ret.style = {background:'#CCFFCC', textAlignment:'far'}
        }
        return ret
      } 
    },
    {
      fieldName: 'SAFE_STOCK', dataType: 'number', width: '100', styleName: 'right-column',
      header: { text: t('적정 재고') }, lookupDisplay: true, editable : true,
      editor:{
        type:'number'
      },
      renderer: {
        type: 'text',
        options: {
          numberFormat: '#,##0',
          textAlignment: 'far'
        }
      },
    },
    {
      fieldName: 'REMARKS', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('비고\n(긴급구매 담당자/연락처 등)') }, 
    },
    {
      fieldName: 'SEQ_IDX', dataType: 'text', width: '150', styleName: 'left-column',visible:false,
      header: { text: t('SEQ') }, 
    },
  ],
  columns : []
})

grdMain1Props.columns = grdMain1Props.fields

onMounted(() => {
  
  // PSM 관리자 확인
  // 2: PSM 모듈 관리자, 1: PSM 부서 담당자, 0: 일반 사용자
  if(
    useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes("SPPF001")
  ) {
    isAdmin.value = 2
  }else if(userStore.authGrpCd.includes("SPPF002")) {
    isAdmin.value = 1
  }
  // if(isAdmin.value === 0) {
  //   return
  // }
  if(isAdmin.value==0)
  {
    menuTitle.value.visibleBtn('btnCreate',false);
  }
  else
  {
    menuTitle.value.visibleBtn('btnCreate',true);
  }
  
  initCodeList()
  // getData()

  grdMain1.value.getGridView().filterPanel.visible = true
  grdMain1.value.getGridView().header.height = 50;
  grdMain1.value.getGridView().header.textWrap = true;
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnSearch','btnCreate','btnUpdate','btnDelete','btnPrint']"
        @click-button="onButtonsClick"
        :title="'예비품 목록'"
        :usePermission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('사업부')"
              v-model="selectedBsnsCd"
              :items="codeList.bsnscd"
              item-title="BSNS_NM"
              item-value="BSNS_CD" 
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('부서')"
              v-model="selectedDeptCd"
              :items="codeList.deptcd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('공정설비')"
              v-model="searchParams.PROCESS_CD"
              :items="codeList.process"
              item-title="TXT"
              item-value="COD"
            />
          </div>
        </v-sheet>
        <VRow no-gutters style="height 50%">
          <VCol class="pa-2 pt-0 pb-0" style="height:93%">
            <RealGrid
              ref="grdMain1"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys" 
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
            />
          </VCol>
        </VRow>
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
    min-height: 400px;
  }
}

::v-deep(.rg-header .rg-table tr td) {
  white-space: pre-line !important;
}
</style>
