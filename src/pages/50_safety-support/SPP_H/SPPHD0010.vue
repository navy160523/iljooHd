<!-- SPPHD0010 부서별 표준 사전점검시트 관리 -->
<!-- SI2팀 손상규 2025-02-07 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import IButtonList from '@/components/IButtonList.vue'
import SPPHD0010Popup from '@/pages/50_safety-support/SPP_H/SPPHD0010Popup.vue'

defineOptions({
  name: '50_safety-support-SPP_H-SPPHD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)

//팝업
const spphd0010Popup = ref(null)

// 조회조건 disabled
const NOCMPNY = ref(true)
const NOBSNS = ref(true)
const NODEPT = ref(true)
const NOASGN = ref(true)
const watchPlag = ref(0)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  TEAM_CD: ''
})

const codeList = reactive({})

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
})

const initCodeList = async () => {
  // console.log(userStore)
  let param = {}
  await commonSearchApi({ queryId: 'SPPHD0010_COMBO_01', param: param })
    .then(res => {
      codeList.company = res.ORESULT_CUR
      }
  )
  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_03', param: {} })
    .then(res => {
        codeList.company = res.ORESULT_CUR
      }
  )

  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_04', param: { CMPNY_DIV : userStore.cmpnyDiv } })
    .then(res => {
      codeList.bsns = res.ORESULT_CUR
        if(codeList.bsns.length>0)
        {
          searchParams.BSNS_CD = userStore.bsnsCd =='' ? codeList.bsns[0].CODE : userStore.bsnsCd;
        }
      }
  )

  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_05', param: {
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD : searchParams.BSNS_CD 
  } })
    .then(res => {
        // console.log("res:",res)
      codeList.dept = res.ORESULT_CUR
        if(codeList.dept.length > 0)
        {
          //searchParams.DEPT_CD = userStore.deptCd == '' ? codeList.dept[0].CODE : userStore.deptCd;
          searchParams.DEPT_CD = '';
        }
      }
  )
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  
  searchParams.BSNS_CD = userStore.bsnsCd =='' ? codeList.bsns[0].CODE : userStore.bsnsCd;
  // console.log("BSNS_CD :",searchParams.BSNS_CD)
  // console.log("DEPT_CD :",userStore.deptCd)
  searchParams.DEPT_CD = userStore.deptCd
  onDeptChanged(searchParams.DEPT_CD)
}

function onBsnsChanged(newValue){
  searchParams.BSNS_CD=newValue

  commonSearchApi({ queryId: 'SPPHD0020_COMBO_05', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD 
  } })
    .then(res => {
      codeList.dept = res.ORESULT_CUR
        if(codeList.dept.length>0)
        {
        searchParams.DEPT_CD=codeList.dept[0].CODE
        onDeptChanged(searchParams.DEPT_CD)
        }
        else
        {
          searchParams.DEPT_CD=''
          onDeptChanged(searchParams.DEPT_CD)
        }
      }
  )
  viweChange()
}
function viweChange() {
  if (searchParams.BSNS_CD == "AK00") {
    grdMain.value.getGridView().setColumnProperty('CHK_FACT', 'visible', true)
  }
  else {
    grdMain.value.getGridView().setColumnProperty('CHK_FACT', 'visible', false)
  }
}
function onDeptChanged(newValue){
  searchParams.DEPT_CD=newValue
  
  commonSearchApi({ queryId: 'SPPHD0020_COMBO_06', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD 
  } })
    .then(res => {
      codeList.asgn = res.ORESULT_CUR
      codeList.asgn.unshift({ DISPLAY_TEXT:'전체', CODE:'' })
        if(codeList.asgn.length>0)
        {
          searchParams.ASGN=''
          onAsgnChanged(searchParams.ASGN)
        }
        else
        {
          searchParams.ASGN=''
          onAsgnChanged(searchParams.ASGN)
        }
        
      }
  )
}

function onAsgnChanged(newValue){
  searchParams.ASGN_CD=newValue

  commonSearchApi({ queryId: 'SPPHD0020_COMBO_07', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD, 
    ASGN_CD : searchParams.ASGN_CD
  } })
    .then(res => {
      codeList.team = res.ORESULT_CUR
      codeList.team.unshift({ DISPLAY_TEXT:'전체', CODE:'' })
        if(codeList.team.length>0)
        {
          searchParams.TEAM_CD=''
        }
        else
        {
          searchParams.TEAM_CD=''
        }
      }
  )
}

function onCMPNYChanged(newValue){
  searchParams.CMPNY_DIV=newValue

  let param ={
    CMPNY_DIV : searchParams.CMPNY_DIV
  };

  commonSearchApi({ queryId: 'SPPHD0020_COMBO_04', param: param })
    .then(res => {
      codeList.bsns = res.ORESULT_CUR
        if(codeList.bsns.length>0)
        {
          searchParams.BSNS_CD = userStore.bsnsCd =='' ? codeList.bsns[0].CODE : userStore.bsnsCd;
/* 
          if(searchParams.BSNS_CD=="AC00")
          {
            menuTitle.value.setBtnProperty('btnPreChkResPrint', 'visible', true)
          }
          else
          {
            menuTitle.value.setBtnProperty('btnPreChkResPrint', 'visible', false)
          } */
          onBsnsChanged(searchParams.BSNS_CD)
        }
      }
  )
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'CHK_FACT', width: '150', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('공장') }, visible: false },
    { fieldName: 'CHK_GUBN', width: '150', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('구분') }},
    { fieldName: 'CHK_ITEM', width: '600', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('점검항목') }},
    { fieldName: 'SRT', width: '120', editable: true, styleName: 'editable_column right-column', dataType: 'text', header: { text: t('정렬순서') }, editor: { type: 'number', maxLength: 3 }},
    { fieldName: 'REMARK', width: '500', editable: true, styleName: 'editable_column left-column', dataType: 'text', header: { text: t('비고') }},
    // 안보이는거
    { fieldName: 'SHEET_NO', dataType: 'text', header: { text: t('체크시트 No') },visible: false, },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') },visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('과/협력사') },visible: false, },
    { fieldName: 'TEAM_CD', dataType: 'text', header: { text: t('팀') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      CMPNY_DIV: searchParams.CMPNY_DIV,
      DEPT_CD: searchParams.DEPT_CD ? searchParams.DEPT_CD : ' ',
      ASGN_CD: searchParams.ASGN_CD ? searchParams.ASGN_CD : ' ',
      TEAM_CD: searchParams.TEAM_CD ? searchParams.TEAM_CD : ' ',
      SHEET_NO: '',
      CHK_GUBN: '',
      CHK_ITEM: '',
      CHK_FACT: '',
      SRT: '',
      REMARK: '',
      SAVE_YN: 'N'
    }, false)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnSheetInfoCopy') { 
    spphd0010Popup.value.openPopup(searchParams)
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

//  조회
const searchData = async() => {
  // console.log(searchParams)
  return await commonSearchApi({ queryId: 'SPPHD0010_SEARCH_01', param: searchParams })
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (isEmpty(data.CHK_GUBN)) {
      return Message.warn(t('구분은 필수 입력입니다.'))
    } else if (isEmpty(data.CHK_ITEM)) {
      return Message.warn(t('점검항목은 필수 입력입니다.'))
    } else if (searchParams.BSNS_CD == 'AK00' && isEmpty(data.CHK_FACT)) {
      return Message.warn(t('공장은 필수 입력입니다.')) 
    }
  }

  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  // console.log("saveParams",saveParams)
  return commonExecuteApi({ queryId: 'SPPHD0010_SAVE_01', list: saveParams })
    .then(res => { 
      // console.log(res)
    })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'SPPHD0010_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

// 팝업
const upData = () => {
  // console.log("upData")
  onButtonsClick({ id: "btnSearch" })
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="true"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex" style="justify-content: space-between">
          <div class="d-flex">          
            <!-- 회사 -->
            <i-select
              v-model="searchParams.CMPNY_DIV"
              :label="$t('회사')"
              :items="codeList.company"
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
          </div>
          <div class="d-flex">
            <IButtonList
              :button-list="['btnSheetInfoCopy']"
              @click-button="onButtonsClick"
              :usePermission="true"
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SPPHD0010Popup ref="spphd0010Popup" @upData="upData" />
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
