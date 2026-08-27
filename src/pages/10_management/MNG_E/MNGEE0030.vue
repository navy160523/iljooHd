<!--
  화면명 : MNGEE0030.vue
  화면개요 :과태료 정보 관리 페이지
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonRequest3, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import MNGEB0010PopTab1Popup from './MNGEB0010PopTab1Popup.vue'

defineOptions({
  name:'10_management-MNG_E-MNGEE0030',
})


const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const mNGEB0010PopTab1Popup = ref(null)
const GUBN2Lookup = reactive([])

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ 
      queryId : 'LAW_DIV_SEARCH', 
      param: {
        CMPNY_DIV : userStore.cmpnyDiv,
        ALL_UP_CD : 'HHI.A',
        UP_CD : 'A',
        USE_FLAG : 'Y',
      } 
    }),
    commonSearchApi({ 
      queryId : 'LAW_DIV_SEARCH', 
      param: {
        CMPNY_DIV : userStore.cmpnyDiv,
        ALL_UP_CD : 'HHI.D',
        UP_CD : 'HHI',
        USE_FLAG : 'Y',
      } 
    }),
    commonSearchApi({ 
      queryId : 'MNGEE0030_SEARCH_02', 
      param: {
        CMPNY_DIV : userStore.cmpnyDiv,
        ALL_UP_CD : 'HHI.D',
        UP_CD : ' ',
        USE_FLAG : 'Y', 
      } 
    }),
  ]).then(res => {
    grdMain.value.setBindingColumn("DIV_CD", res[0].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("GUBN1", res[1].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("GUBN2", res[2].ORESULT_CUR, "COD", "TXT")
    menuTitle.value.setBtnProperty('btnSearch', 'visible', false)

    grdMain.value.getGridView().editOptions.movable = true
  })
}

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL1'],
  fields : [ 
    { fieldName: 'LAW_NM', dataType: 'text', width: '200', styleName: 'left-column',
      header: { text: t('법령명') , styleName: 'header_validit'},
      required: true, requiredMessage: '[법령명]은 필수입니다.',  button : 'action', editable: false
    },
    { fieldName: 'LAW_NM12', dataType: 'text', width: '100', header: { text: t('조 / 항목') }, editable: false },
    { fieldName: 'LE_TXT', dataType: 'text', header: { text: t('조문') }, editable: false },
    { fieldName: 'FINE', dataType: 'number',numberFormat: "#,###", header: { text: t('금액'), styleName: 'header_validit' }, 
      required: true, requiredMessage: '[금액]은 필수입니다.', },
    { fieldName: 'GUBN1', dataType: 'text', header: { text: t('분류') }, lookupDisplay: true, editable: false },
    { fieldName: 'GUBN2', dataType: 'text', header: { text: t('세분류') }, lookupDisplay: true, lookupData: GUBN2Lookup, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'GUBN3', dataType: 'text', header: { text: t('세세분류') }, lookupDisplay: true },
    { fieldName: 'REMARK', dataType: 'text', width: '100', header: { text: t('비고') }, styleName: 'left-column' },
    
    { fieldName: 'LAW_CD', dataType: 'text', visible:false },
    { fieldName: 'DIV_CD', dataType: 'text', visible:false },
    { fieldName: 'SEQ', dataType: 'text', visible:false },
    { fieldName: 'LAW_NM1', dataType: 'text', width: '50', header: { text: t('조') }, editable: false, visible: false },
    { fieldName: 'LAW_NM2', dataType: 'text', width: '50', header: { text: t('항목') }, editable: false, visible: false },

  ],
  columns : [],
  columnLayout: [
  'DIV_CD',
  'LAW_NM',
  'LAW_NM12',
  'LE_TXT',
  'FINE',
  'GUBN1',
  'GUBN2',
  'GUBN3',
  'REMARK'
  ]
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
  }
  else if(btn.id === 'btnCreate'){
    grdMain.value.addRow({})
  }
  else if(btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain]) 
      .setBefore(beforeSave)      
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if(btn.id === 'btnDelete'){
      new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
    }
}

const searchData = idx => {
  return commonSearchApi({ queryId : 'MNGEE0030_SEARCH_01', param: {}})
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const saveParam = ref('')

const beforeSave = () => {
  saveParam.value = []
  
  let result = true

  // 상태바가 체크된 항목
  let chekedRow = grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  } else {
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
     
      saveParam.value.push(data)
    })
  }
  return result
}

const saveData = () => {
  return commonExecuteApi({ queryId : 'MNGEE0030_SAVE_01', list: saveParam.value })
}

const deleteData = () => {  
  return commonExecuteApi({ queryId : 'MNGEE0030_DELETE_01', list: saveParam.value })
}

onMounted(() => {
  initCodeList()
  onButtonsClick({ id :'btnSearch' })
})


const popupParams = reactive({
  ROW_IDX : 0,
})
const popupOpen = (grid, clickInfo, column) => {  

popupParams.ROW_IDX = clickInfo.itemIndex

if(clickInfo.fieldName === 'LAW_NM'){
  let lawArr = []
  grdMain.value.getDataProvider().getJsonRows().forEach(ele => {
    lawArr.push(ele.LAW_CD)
  })

  mNGEB0010PopTab1Popup.value.openPopup({
    SELECT_YN : 'Y',
    LAW_CD_ARR: lawArr
  })
}


// if(clickInfo.fieldName === 'DEPT_NM'){
//   deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : row.DEPT_NM, pageGbn : 'MNG' })
// }
// else if(clickInfo.fieldName === 'MNG_NM'){
//   empPopup.value.openPopup({ EMP_NM : row.MNG_NM, DISABLE:["전체","사내협력사","단기공사","기타"], })    
// }
}

//법령팝업
const openLawPopup = () =>{
  mNGEB0010PopTab1Popup.value.openPopup({
    SELECT_YN : 'Y'
  })
}

//법령 팝업 선택 결과
const onMNGEB0010PopTab1PopupSelected = res =>{
  console.log('법령 팝업 선택 결과 : ',res)

  let grdData = grdMain.value.getDataProvider().getJsonRows()
  let a = grdData.filter((data) => data.LAW_CD === res[0].LAW_CD)
  if(a.length > 0){
    Message.err('이미 존재하는 데이터입니다.')
    return
  }

  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LAW_CD', res[0].LAW_CD)
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LAW_NM', res[0].LAW_NM)
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DIV_CD', res[0].DIV_CD)
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LAW_NM1', res[0].LAW_NM1)
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LAW_NM2', res[0].LAW_NM2)
  let lawNM12 = ''
  // console.log('res[0].LAW_NM1:',res[0].LAW_NM1,' / res[0].LAW_NM2 : ',res[0].LAW_NM2)
  if(res[0].LAW_NM1 && res[0].LAW_NM2) {
    lawNM12 = res[0].LAW_NM1+'조 '+res[0].LAW_NM2+' 항'
  }
  else if(res[0].LAW_NM1 && !res[0].LAW_NM2){
    lawNM12 = res[0].LAW_NM1+'조'
  }
  else if(!res[0].LAW_NM1 && res[0].LAW_NM2){
    lawNM12 = res[0].LAW_NM2+'항'
  }

  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LAW_NM12', lawNM12)
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LE_TXT', res[0].LE_TXT)
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'GUBN1', res[0].GUBN_DETAIL)

  // if(res[0].GUBN_DETAIL){
  //   Promise.all([
  //     commonSearchApi({ 
  //       queryId : 'LAW_DIV_SEARCH', 
  //       param: {
  //         CMPNY_DIV : userStore.cmpnyDiv,
  //         ALL_UP_CD : 'HHI.D.'+res[0].GUBN_DETAIL, 
  //         UP_CD : ' ',
  //         USE_FLAG : 'Y',
  //       } 
  //     }),
  //   ]).then(res => {
  //     grdMain.value.setBindingColumn("GUBN1", res[1].ORESULT_CUR, "COD", "TXT")
  //   })
  // }

  grdMain.value.getGridView().checkItem(popupParams.ROW_IDX, true)
}

const onGrdMainRowChanged = (grid, oldRow, newRow) => {

  let acol = grdMain.value.getGridView().columnByName("GUBN2")
  let rowData = grdMain.value.getDataProvider().getJsonRow(newRow)
  grid.setColumnProperty(acol, "editable", true)
  if(!rowData.GUBN1){
    // console.log("rowData.GUBN1:",rowData.GUBN1)
    // acol._values = ['']
    // acol._labels = ['']
    // grdMain.value.getGridView().setColumn(acol)
    grid.setColumnProperty(acol, "editable", false)
    return
  }
  const data = {
    queryId: 'MNGEE0030_SEARCH_02', 
    param: {
      CMPNY_DIV : userStore.cmpnyDiv,
      ALL_UP_CD : 'HHI.D.'+rowData.GUBN1, 
      UP_CD : ' ',
      USE_FLAG : 'Y',
    } 
  }
  const meta = {
    useProgress: false
  }
  commonRequest3("/hse/common/selectList", data, meta).then(res => {
    let cod = []
    let txt = []
    const mapData = {}
    res.ORESULT_CUR.forEach(e => {
      cod.push(e.COD)
      txt.push(e.TXT)
      // cod += e.COD+','
      // txt += e.TXT+','
      mapData[e.COD] = e.TXT
    })

    // if(cod.length>0){
    //   cod = cod.slice(0, -1)
    //   txt = txt.slice(0, -1)
    //   cod = cod.split(',')
    //   txt = txt.split(',')
    // }
    acol._values = cod
    acol._labels = txt
    // acol._lookupMap = mapData
// console.log('res:',res,'/ acol:',acol,'/mapData:',mapData)
    grdMain.value.getGridView().setColumn(acol)

  }) 
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnCreate', 'btnSearch', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 700px;"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellButtonClicked="popupOpen"
            @onCurrentRowChanged="onGrdMainRowChanged"
            />
            <!-- @onCellClicked="onCellClicked" -->
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 법규 선택 팝업 -->
    <MNGEB0010PopTab1Popup
      ref="mNGEB0010PopTab1Popup"
      @selected="onMNGEB0010PopTab1PopupSelected"
    />
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
