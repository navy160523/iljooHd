<!-- SPPFE0010_NOAUTH 안전운전절차 로그인안하고 조회로 권한만-->
<!-- SI2팀 마환구 2025.08.12 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchnoAuthApi,
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import SPPFE0010Popup_NOAUTH from './SPPFE0010Popup_NOAUTH.vue'
import { useRoute } from 'vue-router'


defineOptions({
  name: '50_safety-support-SPP_F-SPPFE0010',
})

const SPPFC0010_Popup = ref(null)
const approvalPopup = ref(null)
const FIUploadPopup = ref(null)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const useLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const selectrow = ref(null)
const route = useRoute()

const popupParam=reactive({});

const revDiv = ref([
  { DISPLAY_TEXT: '정기', CODE: 'A' },
  { DISPLAY_TEXT: '수시', CODE: 'B' },
])



const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.empNo,
})

const isAdmin = ref(0)

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  process: [],
  item: []
})

const initCodeList = async () => {
  Promise.all([ 
    commonSearchnoAuthApi({ queryId: 'SPPFE0010_COMBO_01', param: searchParams }),
    commonSearchnoAuthApi({ queryId: 'SPPFE0010_COMBO_02', param: searchParams }),
    commonSearchnoAuthApi({ queryId: 'SPPFE0010_COMBO_03', param: searchParams }),

  ]).then(res => {    
    codeList.bsnscd = res[0].ORESULT_CUR
    if(searchParams.BSNS_CD !== '') {
      codeList.deptcd = res[1].ORESULT_CUR
      codeList.process = res[2].ORESULT_CUR
    }

    codeList.bsnscd.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
    codeList.deptcd.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
    codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
  })
  grdMain2.value.setBindingColumn('REV_DIV', revDiv.value, 'CODE', 'DISPLAY_TEXT')
}

// 등록/수정 구분자
const isNew = ref(false)

const onButtonsClick = btn => {
  if(btn.id === 'btnCreate') {
    openPopup("C")
  }
  else if(btn.id === 'btnSearch') {
    getData("B")
  }
  else if(btn.id == 'btnReqApply') {
    approval()
  }

}

const openPopup = (data) => {
  let row= grdMain1.value.getGridView().getSelectedRows()
  let rowData = grdMain1.value.getDataProvider().getJsonRow(row)

  if(rowData.FILE_YN !='Y' && rowData.REV_SEQ && data=="C")
  {
    return Message.warn(t('이전 내용에 파일이 첨부되지 않았습니다.'))
  }


  if(rowData.REV_APP_STATUS != 'Y' && rowData.REV_SEQ && data=="C")
  {
    return Message.warn(t('이전 개정의 결재가 완료되지 않았습니다.'))
  }
  popupParam.DIV=data
  // selectrow.value=grdMain1.value.getGridView().getSelectedRows();

  SPPFC0010_Popup.value.openPopup(popupParam)
}

const getData = async (val) => {

  if(val=="B")
  {
    selectrow.value=0
  }
  else
  {
    selectrow.value=selectrow.value;
  }

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
    return codeList.bsnscd.some(item => item.CODE === searchParams.BSNS_CD)
      ? searchParams.BSNS_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.BSNS_CD = value;
  }
});

const selectedDeptCd = computed({
  get: () => {
    return codeList.deptcd.some(item => item.CODE === searchParams.DEPT_CD)
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
    BSNS_CD: codeList.bsnscd.some(item => item.CODE === searchParams.BSNS_CD) ? searchParams.BSNS_CD : '', //사업부
    DEPT_CD: codeList.deptcd.some(item => item.CODE === searchParams.DEPT_CD) ? searchParams.DEPT_CD : '', //부서
    PROCESS_CD: searchParams.PROCESS_CD, //공정설비
  }
  
  return commonSearchnoAuthApi({ queryId: 'SPPFE0010_SEARCH_01', param: param })  
}

// 조회 후
const afterSearch = (res) => {

  // initFileSearchData()

  grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);

  gridSelect()

}

const gridSelect =()=>{
  grdMain1.value.getGridView().clearCurrent();
  grdMain1.value.getGridView().setCurrent({itemIndex : selectrow.value});
}


//사업부변경 감지
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    const param = {CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue,}
    if(newValue !== '') {
      Promise.all([ 
      commonSearchnoAuthApi({ queryId: 'SPPFE0010_COMBO_02', param: param }),
      commonSearchnoAuthApi({ queryId: 'SPPFE0010_COMBO_03', param: param })
      ]).then((res) => {
        searchParams.DEPT_CD = ''
        searchParams.PROCESS_CD = ''
        codeList.deptcd = res[0].ORESULT_CUR
        codeList.process = []
        // codeList.process = res[1].ORESULT_CUR
        codeList.deptcd.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
        codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
      })
    }else {
      searchParams.DEPT_CD = ''
      searchParams.PROCESS_CD = ''
      codeList.deptcd = []
      codeList.process = []
      codeList.deptcd.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
      codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
    }
  }
)

// 부서변경 감지
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    if(newValue !== '') {
      commonSearchnoAuthApi({ 
        queryId: 'SPPFE0010_COMBO_03', 
        param: { 
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: newValue
        } 
      }).then((res) => {
        searchParams.PROCESS_CD = ''
        codeList.process = res.ORESULT_CUR
        codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
      })
    }else {
      // console.log('dept and process Empty!')
      searchParams.PROCESS_CD = ''
      codeList.process = []
      codeList.process.unshift({ DISPLAY_TEXT: '전체', CODE: '' })
    }
  }
)




//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    checkBar: { visible: false, exclusive: true}
  },
  fields : [
    { 
      fieldName: 'BSNS_NM', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('사업부'),} ,
    },
    { 
      fieldName: 'DEPT_NM', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('부서') },
    },
    { 
      fieldName: 'PROCESS_NM', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('공정설비') }, 
    },
    {
      fieldName: 'RREV_DATE', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('정기 개정일자') }, 
    },
    {
      fieldName: 'REV_DUT_DT', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('차기 정기 유효성검토 유효기간') }, 
    },
    {
      fieldName: 'AD_HOC_DATE', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('수시 개정일자') }, 
    },
    {
      fieldName: 'REV_CONTENT', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('개정사유') }, 
    },
    {
      fieldName: 'REV_APP_YN', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('개정 승인 여부') }, 
    },
    {
      fieldName: 'FILE_YN', dataType: 'text', width: '150', styleName: 'center-column', visible : false,
      header: { text: t('결과') }, 
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20
        
        if (dataCell.value) {
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
        
        return ret;
      },
    },
    {
      fieldName: 'REMARKS', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('비고') }, 
    },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'REV_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false, },
    { fieldName: 'REV_DIV', dataType: 'text', visible: false, },
    { fieldName: 'REV_APP_STATUS', dataType: 'text', visible: false, },
  ],
  columns : [],
  columnLayout :[
    'BSNS_NM','DEPT_NM','PROCESS_NM',
    {
      name:'제/개정 현황',
      direction: 'horizontal',
      items:['RREV_DATE', 'REV_DUT_DT', 'AD_HOC_DATE','REV_CONTENT','REV_APP_YN','FILE_YN']
    }, 'REMARKS'
  ]
})

grdMain1Props.columns = grdMain1Props.fields

const grdMain2Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    rowIndicator: { visible: false },
  },
  fields : [
    { 
      fieldName: 'REV_DATE', dataType: 'text', width: '150', styleName: 'left-column', 
      header: { text: t('일자') } ,
    },
    { 
      fieldName: 'REV_DIV', dataType: 'text', width: '150', styleName: 'left-column', 
      header: { text: t('구분') } ,
      lookupDisplay: true,
      editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 10, partialMatch: true, domainOnly: true, dropDownWhenClick: true }
    },
    { 
      fieldName: 'REV_CONTENT', dataType: 'text', width: '150', styleName: 'left-column', 
      header: { text: t('내용') } ,
    },
    { 
      fieldName: 'REV_APP_YN', dataType: 'text', width: '80', styleName: 'center-column', 
      header: { text: t('결과') } ,
    },
    { 
      fieldName: 'FILE_YN', dataType: 'text', width: '150', styleName: 'left-column', 
      header: { text: t('첨부') } ,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_YN')
          if (value == 'Y') {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부 완료</button>
              </div>
            `;
          } else { 
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
              </div>
            `;
          }
        }
      }
    },
    { 
      fieldName: 'REMARKS', dataType: 'text', width: '150', styleName: 'left-column', 
      header: { text: t('비고') } ,
    },
    { 
      fieldName: 'REV_SEQ', dataType: 'text', width: '150', styleName: 'left-column', visible : false 
    },
    { 
      fieldName: 'FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible : false 
    },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'KOR_NM', dataType: 'text', visible: false, },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false, },
    { fieldName: 'REV_APP_STATUS', dataType: 'text', visible: false, },
  ],
  columns : [],
  columnLayout :[
    'REV_DATE','REV_DIV',
    {
      name:'변동현황',
      direction: 'horizontal',
      items:['REV_CONTENT', 'REV_APP_YN', 'FILE_YN']
    }, 'REMARKS'
  ]

})

grdMain2Props.columns = grdMain2Props.fields

onMounted( async () => {

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

  // "['btnSearch','btnCreate','btnApply']"
  if(isAdmin.value==0)
  {
    menuTitle.value.visibleBtn('btnCreate',false);
    menuTitle.value.visibleBtn('btnReqApply',false);
  }
  else
  {
    menuTitle.value.visibleBtn('btnCreate',true);
    menuTitle.value.visibleBtn('btnReqApply',true);
  }
  
  grdMain1.value.getGridView().filterPanel.visible = true
  grdMain2.value.getGridView().filterPanel.visible = true

  try {
    let value=userStore.url.split('&')
  
  
    // let rowKey;

    value.forEach(item => {
    const [key, value] = item.split('=')
    if (key === 'rowKey') selectrow.value = parseInt(value)
    if (key === 'cmpnyDiv') searchParams.CMPNY_DIV = value
    })

  } catch (e) {
    console.log(e);
  }

  await initCodeList()
  await getData()
  
})

const onCurrentChanged = async (grid, oldRow, newRow) =>{
  
  
  const gridView = grdMain1.value.getGridView();
  const clickedColumn = grid.getCurrent().column;
  let clickedField
  if(clickedColumn)
  {
    clickedField = grid.columnByName(clickedColumn).fieldName;
  }
  let row=grdMain1.value.getGridView().getSelectedRows();
  if(row[0]>=0)
  {
    selectrow.value=row[0];
  }
  gridView.checkAll(false);
  gridView.checkItem(row,true)


  if(clickedField == "FILE_YN" || clickedField == null)
  {
    return;
  }
  else
  {
  
  let v1, v2, v3
    v1=grdMain1.value.getGridView().getValues(row)["BSNS_CD"];
    v2=grdMain1.value.getGridView().getValues(row)["DEPT_CD"];
    v3=grdMain1.value.getGridView().getValues(row)["PROCESS_CD"];
    popupParam.BSNS_CD=v1
    popupParam.DEPT_CD=v2
    popupParam.PROCESS_CD=v3
    popupParam.BSNS_NM=grdMain1.value.getGridView().getValues(row)["BSNS_NM"];
    popupParam.DEPT_NM=grdMain1.value.getGridView().getValues(row)["DEPT_NM"];
    popupParam.PROCESS_NM=grdMain1.value.getGridView().getValues(row)["PROCESS_NM"];

    commonSearchnoAuthApi({
      queryId: 'SPPFE0010_SEARCH_02',
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        BSNS_CD : v1,
        DEPT_CD : v2,
        PROCESS_CD : v3},
      }).then(res2=>{
    
      grdMain2.value.getDataProvider().setRows(res2.ORESULT_CUR);
    });
  }
}

// 셀 클릭 이벤트
const onCellItemClicked = (grid, index, col) => {
  if (col.fieldName === 'FILE_YN') {    
    let fileId=grdMain1.value.getGridView().getValues(col.dataRow)['FILE_ID']
    FIUploadPopup.value.openPopup(fileId);
  }
}

const onCellDblClicked = (grid, col) => {

  const app_status = grdMain2.value.getGridView().getValues(col.dataRow)['REV_APP_STATUS'];

  if(col.dataRow==0 && isAdmin.value != 0 && [null, 'A', 'Z', 'C'].includes(app_status))
  {
    popupParam.WRITE="Y"
  }
  else
  {
    popupParam.WRITE="N"
  }

  popupParam.BSNS_CD=grdMain2.value.getGridView().getValues(col.dataRow)['BSNS_CD']
  popupParam.DEPT_CD=grdMain2.value.getGridView().getValues(col.dataRow)['DEPT_CD']
  popupParam.PROCESS_CD=grdMain2.value.getGridView().getValues(col.dataRow)['PROCESS_CD']
  popupParam.REV_SEQ=grdMain2.value.getGridView().getValues(col.dataRow)['REV_SEQ']
  popupParam.REV_DATE=grdMain2.value.getGridView().getValues(col.dataRow)['REV_DATE']
  popupParam.REV_DIV=grdMain2.value.getGridView().getValues(col.dataRow)['REV_DIV']
  popupParam.REV_CONTENT=grdMain2.value.getGridView().getValues(col.dataRow)['REV_CONTENT']
  popupParam.FILE_ID=grdMain2.value.getGridView().getValues(col.dataRow)['FILE_ID']
  popupParam.REMARKS=grdMain2.value.getGridView().getValues(col.dataRow)['REMARKS']
  popupParam.Admin=isAdmin.value;
  popupParam.KOR_NM=grdMain2.value.getGridView().getValues(col.dataRow)['KOR_NM']
  popupParam.USER_ID=grdMain2.value.getGridView().getValues(col.dataRow)['INSERT_USER_ID']
  openPopup("M")
}
const upDate =()=>{

  getData("F")
  // onButtonsClick({id:"btnSearch"});

}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
        :title="'안전운전절차'"
        usePermission
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
              item-title="DISPLAY_TEXT"
              item-value="CODE" 
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('부서')"
              v-model="selectedDeptCd"
              :items="codeList.deptcd"
              item-title="DISPLAY_TEXT"
              item-value="CODE"
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('공정설비')"
              v-model="searchParams.PROCESS_CD"
              :items="codeList.process"
              item-title="DISPLAY_TEXT"
              item-value="CODE"
            />
          </div>
        </v-sheet>
        <VRow no-gutters style="height 50%">
          <VCol class="pa-2 pt-0 pb-0">
            <RealGrid
              ref="grdMain1"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys" 
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
              :column-layout="grdMain1Props.columnLayout"
              @onCurrentChanged="onCurrentChanged"  
              @onCellItemClicked="onCellItemClicked" 
            />
          </VCol>
        </VRow>
        <VRow no-gutters>
          <VCol class="pa-2 pt-0 pb-0" >
            <IGridTitle 
              :title="$t('변경이력확인')"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain2"
              :grid-view-option="grdMain2Props.gridViewOption"
              :keys="grdMain2Props.keys" 
              :fields="grdMain2Props.fields"
              :columns="grdMain2Props.columns"
              :column-layout="grdMain2Props.columnLayout"
              @onCellDblClicked="onCellDblClicked"
              style="height:90%"
            />
          </VCol>
        </VRow>
      </div>
      <SPPFE0010Popup_NOAUTH ref="SPPFC0010_Popup" @upDate="upDate"/>
    </v-card-text>
  </v-card>
    
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 60px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>

<route lang="yaml">
  meta:
    noAuth: true
    layout: blank
    redirectIfLoggedIn: true
  </route>