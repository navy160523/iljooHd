<!--
  화면명 : 부서별 장비자격 보유현황
  화면개요 : 각 부서별 장비자격 보유현황을 확인할 수 있는 화면.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2 } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUBA0010Pop01 from '@/pages/60_edu/EDU_B/EDUBA0010Pop01.vue'
import _ from 'lodash'

defineOptions({
  name: '60_edu-EDU_B-EDUBA0010',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdMain2 = ref(null)
const grdDetail = ref(null)
const searchArea = ref(null)
let BSNS_NM = ref(null)
let DEPT_NM = ref(null) 
const eDUBA0010Pop01 = ref(null)
const gridLock = ref(0) //그리드 조회시
const firstLock = ref(0)

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const printParams = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

const setPrint = () => {
  reportName.value = '/manage/hse/EDUBA0010.ozr'

  printParams.value = [
    "IN_CMPNY_DIV="+userStore.cmpnyDiv,                     // 회사구분
    "IN_BSNS_CD="+searchParams.BSNS_CD,                     // 사업부
    "IN_DEPT_CD="+searchParams.DEPT_CD,                     // 부서
    "IN_DEPT_FULL_NM="+BSNS_NM.value + '-' + DEPT_NM.value, //사업부명 + 부서명
    "IN_TODAY="+dayjs(new Date()).format('YYYY-MM-DD'),     //오늘 날짜
  ]
}

// #1 END ------------------------------------------------------

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : '',        //사업부
  DEPT_CD : '',        //부서
  LICE_TYPE : '',      //사내자격, 국가자격 조회 구분
  HLD_OFFI_GBN : 'N',  //퇴사자 포함 여부
  LIC_STATUS : '',    //취소자 여부
  LIC_STATUS2 : '',   //정지자 여부
  LIC_KIND : '',       // 사내자격, 국가자격 그리드에서 선택된 데이터
  grdMainData : '',    //사내자격 보유현황 그리드 데이터
  grdMain2Data : '',   //국가자격 보유현황 그리드 데이터
  SEARCHALL : false,   //전체 조회 여부
})

//사내자격보유현황 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar : { visible:false } }, 
  fields : [ 
    { fieldName: 'LIC_KIND_NM', dataType: 'text', header: { text: t('자격종류') }, editable:false, styleName:"left-column" },
    { fieldName: 'CNT', dataType: 'text', width:"50", header: { text: t('보유현황') }, editable:false, styleName:"right-column" },

    //비활성화
    { fieldName: 'LIC_KIND', dataType: 'text', visible:false, header: { text: t('LIC_KIND') } },
  ],
  columns: [],
})

//국가자격보유현황 그리드 세팅
const grdMain2Props = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar : { visible:false } }, 
  fields : [ 
    { fieldName: 'LIC_KIND_NM', dataType: 'text', header: { text: t('자격종류') }, editable:false, styleName:"left-column" },
    { fieldName: 'CNT', dataType: 'text', width:"50", header: { text: t('보유현황') }, editable:false, styleName:"right-column" },

    //비활성화
    { fieldName: 'LIC_KIND', dataType: 'text', visible:false, header: { text: t('LIC_KIND') } },
  ],
  columns: [],
})

//자격종류별 보유자 현황
const grdDetailProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [ 
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, styleName:"left-column", editable:false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable:false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'BIRTH_DAY', dataType: 'text', header: { text: t('생년월일') }, editable: false },
    { fieldName: 'LIC_KIND_NM', dataType: 'text', header: { text: t('자격종류') }, styleName:"left-column", editable: false },
    { fieldName: 'LIC_GET_DT', dataType: 'text', header: { text: t('자격취득일') }, editable: false },
    { fieldName: 'DT', dataType: 'text', header: { text: t('보수교육일') }, editable: false },
    { fieldName: 'EDU_DEADLINE', dataType: 'text', header: { text: t('보수교육기한') }, editable: false },
    { fieldName: 'ALM_TARGET', dataType: 'text', header: { text: t('자격상태') }, /*styleName:'rg_blue rg_underLine',*/ lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, editable: false },
    { fieldName: 'LICE_NO', dataType: 'text', header: { text: t('면허번호') }, editable: false },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', header: { text: t('재직여부') }, editable: false },

  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields
grdMain2Props.columns = grdMain2Props.fields
grdDetailProps.columns = grdDetailProps.fields

const codeList = reactive({
  BSNS_CD : [],
  DEPT_CD : [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
    getCodeList('HHIF340'),
  ]).then(res => {
    //사업부 데이터 세팅
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    let findIndex = res[0].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
    searchParams.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD

    //부서 데이터 세팅
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

    res[2].ORESULT_CUR.unshift({ COD : 'Y', TXT :' ' })
    res[2].ORESULT_CUR.unshift({ COD : 'N', TXT :' ' })
    //자격 상태 컬럼 데이터 세팅
    grdDetail.value.setBindingColumn("ALM_TARGET", res[2].ORESULT_CUR, "COD", "TXT") 
  })
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  searchParams.DEPT_CD = ''
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

      if(firstLock.value === 0){
        let findIndex = res.ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
        searchParams.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
        firstLock.value = 1
      } else {
        searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
      }
    }).finally(() => {
      if(firstLock.value === 1){
        onButtonsClick({ id : 'btnSearch' })
        firstLock.value = 2
      }
      gridRefresh()
    })


})


//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {      //조회

  //그리드 조회시 grdMain, grdMain2 선택된 데이터 바인딩하여 조회
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let checkedRows2 = grdMain2.value.getGridView().getCheckedRows(true)

  if(checkedRows.length !== 0){
    for(let i = 0; i < checkedRows.length; i++){
      searchParams.LIC_KIND +=(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).LIC_KIND) +","
    } 
  }
  if(checkedRows2.length !== 0){
    for(let i = 0; i < checkedRows2.length; i++){
      searchParams.LIC_KIND +=(grdMain2.value.getDataProvider().getJsonRow(checkedRows2[i]).LIC_KIND) +","
    } 
  }
  if(btn.id === 'btnSearch'){
    if(searchParams.LIC_KIND !== ''){
      grdDetailSearch()
    } else {
      gridLock.value = 0
      new queryFlowHelper(vm, t)
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .showMessage(false)
        .run()
    }
  } else if(btn.id === 'btnPrint'){
    showOz.value = true
  }
}

//자격상태 컬럼이 정지 또는 취소인 경우 더블클릭 시 실행되는 이벤트
const onCellDblClicked = (grid, clickData) => {
  if(clickData.fieldIndex === 9){
    let rowData = grdDetail.value.getDataProvider().getJsonRow(clickData.dataRow)
    if(rowData.ALM_TARGET == "S"){
      eDUBA0010Pop01.value.openPopup({
        ALM_TARGET : 'S',
      })
    } else if(rowData.ALM_TARGET == 'C'){
      eDUBA0010Pop01.value.openPopup({
        ALM_TARGET : 'C',
      })
    }
  }
}

//사업부 변경시 발생 이벤트
const changedBSNS_CD = () => {
  gridRefresh()
}

//부서 변경시 발생 이벤트
const changedDEPT_CD = () => {
  gridRefresh()
}

//전체 조회 체크 및 체크 해제 시 발생 이벤트
const searchAll = () => {
  if(grdMain.value.getDataProvider().getRows().length !== 0){
    searchParams.SEARCHALL = 'Y'
    onButtonsClick({ id : 'btnSearch' })
  }
}

//사내 자격 보유 현황 그리드 로우 변경 시 발생 이벤트
const rowChangedGrdMain = (grid, oldRow, newRow) => {
  if(gridLock.value !== 0){
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    if(checkedRows.length > 0){
      for(let i = 0; i < checkedRows.length; i++){
        if(checkedRows[i] === newRow){
          grdMain.value.getGridView().checkRow(newRow, false)
          return
        }else{
          grdMain.value.getGridView().checkRow(newRow, true)
        }
      }
    }else {
      grdMain.value.getGridView().checkRow(newRow, true)
    }
  }
}
//국가 자격 보유 현황 그리드 로우 변경 시 발생 이벤트
const rowChangedGrdMain2 = (grid, oldRow, newRow) => {
  let data = grdMain2.value.getGridView().getCheckedRows(true)
  if(data.length > 0){
    for(let i = 0; i < data.length; i++){
      if(data[i] === newRow){
        grdMain2.value.getGridView().checkRow(newRow, false)

        return
      }else{
        grdMain2.value.getGridView().checkRow(newRow, true)
      }
    }
  }else {
    grdMain2.value.getGridView().checkRow(newRow, true)
  }
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdMain2.value.getDataProvider().setRows([])
  grdDetail.value.getDataProvider().setRows([])
  grdMain.value.getGridView().setAllCheck(false)
  grdMain2.value.getGridView().setAllCheck(false)
  gridLock.value = 0
}


//출력에 사용될 데이터 세팅
const printDataSetting = () => {
  let findIndex = codeList.bsnsCd.findIndex(item => item.BSNS_CD === searchParams.BSNS_CD)
  BSNS_NM.value = codeList.bsnsCd[findIndex].BSNS_NM

  let findIndex2 = codeList.deptCd.findIndex(item => item.DEPT_CD === searchParams.DEPT_CD)
  DEPT_NM.value = codeList.deptCd[findIndex2].DEPT_NM
}

//자격상태에 따른 ROW 색상 변경 이벤트
const gridColorSetting = () => {
  grdDetail.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    var ret = {}

    var LIC_STATUS = grid.getValue(item.index, "ALM_TARGET")
    if (LIC_STATUS == 'C') {                //취소
      ret.style = { background:"#A6A6A6" }
    } else if(LIC_STATUS === 'S'){          //정지
      ret.style = { background:"#F15F5F" }

    } else if(LIC_STATUS === 'Y'){          //교육기간임박
      ret.style = { background:"#FAED7D" }
    }

    return ret
  })
}
//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//사내 자격 보유 현황 조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//사내 자격 보유 현황 리스트 조회
const searchData = () => {
  searchParams.LICE_TYPE = 'I'
  return commonSearchApi({ queryId : 'EDUBA0010_SEARCH_01', param: searchParams })
}


//사내 자격 보유 현황 리스트 조회 후
const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain2Search()
}

//국가 자격 보유 현황 조회
const grdMain2Search = () => {
  searchParams.LICE_TYPE = 'O'
  commonSearchApi({ queryId : 'EDUBA0010_SEARCH_01', param: searchParams }).then(res => {
    grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdDetailSearch()
  })
}

//자격 종류별 보유자 현황 조회
const grdDetailSearch =  () => {
  let detailSearchParams = _.cloneDeep(searchParams)
  if(searchParams.SEARCHALL === 'Y'){
    detailSearchParams.LIC_KIND =''
    detailSearchParams.HLD_OFFI_GBN = ''
    detailSearchParams.LIC_STATUS = ''
  }
  commonSearchApi({ queryId : 'EDUBA0010_SEARCH_02', param: detailSearchParams }).then(res => {
    printDataSetting()
    res.ORESULT_CUR.forEach(val => {
      val.LIC_GET_DT = val.LIC_GET_DT ? dayjs(val.LIC_GET_DT).format('YYYY-MM-DD') : null
      val.BIRTH_DAY = val.BIRTH_DAY ? dayjs(val.BIRTH_DAY).format('YYYY-MM-DD') : null
      //val.EDU_DEADLINE = val.EDU_DEADLINE ? dayjs(val.EDU_DEADLINE).format('YYYY-MM-DD') : null
      val.DT = val.DT ? dayjs(val.DT).format('YYYY-MM-DD') : null
    })
    grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR)
    if(res.ORESULT_CUR.length > 0 ){
      Message.success(t('조회되었습니다.'))
    } else {
      Message.warn("데이터가 없습니다.")
    }
    gridColorSetting()
    setPrint()
    gridLock.value = 1
  })

  searchParams.LIC_KIND = ''
  searchParams.SEARCHALL = false
}

//*****************************************조회 영역(종료)***********************************************************/

onMounted( () => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
      <!-- 타이틀 -->      
        <v-card-title class="pa-3 pb-0">
            <IMenuTitle
              ref="menuTitle"
              :title="$t(useLogsStore().menuId)"
              :button-list="['btnSearch', 'btnPrint']"
              @click-button="onButtonsClick"
            />
        </v-card-title>
        <v-card-text class="pa-3 pt-0 content-area">
        <!-- 조회조건 -->
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea d-flex">
              <i-select
                :label="$t('사업부')"
                width=300px
                v-model="searchParams.BSNS_CD"
                :items="codeList.bsnsCd"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                @update:model-value="changedBSNS_CD"
              /> 
              <i-select
                :label="$t('부서')"
                width=300px
                v-model="searchParams.DEPT_CD"
                :items="codeList.deptCd"
                item-title="DEPT_NM"
                item-value="DEPT_CD"
                @update:model-value="changedDEPT_CD"
              />
              <v-checkbox 
                class="mt-1 mr-2"
                v-model="searchParams.HLD_OFFI_GBN"
                label="퇴사자 포함"
                false-value="N"
                true-value=""
              />
              <v-checkbox 
                class="mt-1 mr-2"
                v-model="searchParams.LIC_STATUS"
                label="취소자"
                false-value=""
                true-value="Y"
              />
              <v-checkbox 
                class="mt-1 mr-2"
                v-model="searchParams.LIC_STATUS2"
                label="정지자"
                false-value=""
                true-value="Y"
              />
            </v-sheet>
            <div class="d-flex" style="height:100%">
              <div class="flex-column mr-2" style="width:20%; height: 44.5%;">
                <IGridTitle 
                  :title="$t('사내 자격 보유 현황')"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdMain"
                  class="mt-2"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  @onCurrentRowChanged="rowChangedGrdMain"
                />
                <IGridTitle 
                  :title="$t('국가 자격 보유 현황')"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdMain2"
                  class="mt-2"
                  :grid-view-option="grdMain2Props.gridViewOption"
                  :fields="grdMain2Props.fields"
                  :columns="grdMain2Props.columns"
                  @onCurrentRowChanged="rowChangedGrdMain2"
                />
              </div>
              <div class="flex-column" style="width:80%; height: 95%;">
                <div class="d-flex" style="justify-content: space-between;">
                  <IGridTitle
                    :title="$t('자격 종류별 보유자 현황')" 
                    :button-list="['btnSearchAll']"
                    @click-button="searchAll"
                  >
                    <template #editors />
                  </IGridTitle> 
                  <div style="height:3%; justify-content: flex-end;" class="d-flex">
                    <div class="mr-1" style="background-color: #FAED7D; font-size: large; border-radius: 5px;">　　</div>
                    <div class="mr-2" style="font-size: large;"> 교육 기간 임박</div>
                    <div class="mr-1" style="background-color: #A6A6A6; font-size: large; border-radius: 5px;">　　</div>
                    <div class="mr-2" style="font-size: large;"> 취소</div>
                    <div class="mr-1" style="background-color: #F15F5F; font-size: large; border-radius: 5px;">　　</div>
                    <div class="mr-2" style="font-size: large;"> 정지</div>
                  </div>
                </div>
                <RealGrid
                  ref="grdDetail"
                  :grid-view-option="grdDetailProps.gridViewOption"
                  :fields="grdDetailProps.fields"
                  :columns="grdDetailProps.columns"
                  @onCellDblClicked="onCellDblClicked"
                />
              </div>
            </div>
          </div> 
      </v-card-text>
    <!-- OZReport -->
    <OZReport :showPop="showOz" :reportName="reportName" :params="printParams" @close="showOz = $event" />
    <!-- 부서/ 협력사 팝업 -->
    <EDUBA0010Pop01
      ref="eDUBA0010Pop01"
    />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
  
