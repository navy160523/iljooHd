<!-- 
  화면명 : 사용 협력사 등록
  화면개요 : 구)건강관리대상 협력사 등록
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonLogExecuteApi, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import VendTreePopup from '@/components/popup/VendTreePopup.vue'

defineOptions({
  name:'100_health-HLT_K-HLTKC0040', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isIp = ref(false)
const vendTreePopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams =reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }
  userStore.getAuthIpMenus().then(res => {
    if(res.filter(item => item.EMP_NO == userStore.empNo && 
      item.PGM_ID == useLogsStore().menuId &&
      item.IP_ADD == userStore.clientIp).length > 0) {
      isIp.value = true
    }
    onButtonsClick({ id: 'btnSearch' })
    grdMain.value.getGridView().filterPanel.visible = true
  })
  
})

const showNoIp = () => {
  vm.$swal({ title: t('메뉴 사용 권한이 없습니다. 메뉴 사용을 희망하시는 경우\r\n시스템 관리자에게 IP 권한 등록을 요청하시기 바랍니다.\r\n\n☎ 문의처 : 안전보건지원부 보건관리과 T. 3-3022') }).then(res=> {
  })
  return false
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'VEND_CD', width: '80', dataType: 'text', editable: false, header: { text: t('협력사코드') } },
    { fieldName: 'VEND_NAME', width: '120', dataType: 'text', editable: false, styleName:'left-column', header: { text: t('협력사명') }, },
    { fieldName: 'EMAIL', width: '120', dataType: 'text', styleName:'left-column editable_column', header: { text: t('메일주소') } },
    { fieldName: 'REMARK', width: '120', dataType: 'text', styleName:'left-column editable_column', header: { text: t('비고') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isIp.value) {
    return showNoIp()
  }

  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnAddVend') {
    vendTreePopup.value.openPopup({ ORGN_DIV: 'B' })
  }
}
const getData = () => {
  if(!isIp.value) {
    return showNoIp()
  }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTKC0040_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.CMPNY_DIV)) {
      return Message.warn(t('사업부코드는 필수입니다.'))
    } else if (isEmpty(data.VEND_CD)) {
      return Message.warn(t('협력사코드는 필수입니다.'))
    }
  }
  return true
}
 
// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTKC0040_SAVE_01', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => {
  // check된 행 체크 해제
  grdMain.value.getGridView().getCheckedRows(true).forEach(element => {
    grdMain.value.getGridView().checkRow(element, false, false, false)
  })

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
  
  return commonExecuteApi({ queryId : 'HLTKC0040_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

const selectedVend = (data) => {  
  // 이미 같은 데이터가 있을 시 return
  if(!isEmpty(grdMain.value.getDataProvider().getJsonRows(0,-1).filter(item => item.VEND_CD === data.ASGN_CD))) {
    return Message.warn(t(`${data.ASGN_NM}은 이미 추가되어 있습니다.`))
  } else if (data.ASGN_CD.length == 4) {
    return Message.warn(t(`${data.ASGN_NM}은 협력사가 아닙니다.`))
  }
  grdMain.value.getGridView().filterPanel.clearInput()
  grdMain.value.addRow({
    CMPNY_DIV: userStore.cmpnyDiv,
    VEND_CD: data.ASGN_CD,
    VEND_NAME: data.ASGN_NM,
    EMAIL: '',
    REMARK: '',
    SAVE_YN: 'N',
  }, false)  
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnAddVend', 'btnSearch', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        
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
    <VendTreePopup ref="vendTreePopup" @selected="selectedVend"/>
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
</style>