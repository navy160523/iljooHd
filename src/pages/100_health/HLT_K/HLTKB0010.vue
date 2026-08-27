<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useRoute, useRouter } from 'vue-router'
defineOptions({
  name: '100_health-HLT_K-HLTKB0010',
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const router = useRouter()
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear(),
  VEND_CD: userStore.authGrpCd.includes('HLTK001') === true ? '' : userStore.asgnCd,
  //userStore.userDiv === 'A' ? '' : userStore.asgnCd, //직영이면 협력사코드 없이 협력사면 ASGN_CD
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'VEND_NAME',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('협력사명') },
      styleName: 'left-column',
    },
    {
      fieldName: 'TARGET_EMP',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('작성 대상 인원') },
    },
    {
      fieldName: 'TARGET_COMPLETE',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('작성 완료 인원') },
    },
    {
      fieldName: 'COMPLETE_PERCENT',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('작성율') },
    },
    {
      fieldName: 'LAST_COMPLETE',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('최종 작성완료일시') },
    },
    {
      fieldName: 'SCMS',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('SCMS') },
    },
    {
      fieldName: 'ALARM_YN',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('알림발송여부') },
    },
    {
      fieldName: 'VEND_CD',
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    'VEND_NAME',
    {
      name: '보건관리계획서',
      direction: 'horizontal',
      items: ['TARGET_EMP', 'TARGET_COMPLETE', 'COMPLETE_PERCENT', 'LAST_COMPLETE'],
    },
    'ALARM_YN',
    'SCMS',
  ],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  //조회
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }
  //긴급승인
  else if (btn.id === 'btnEmergencyApprove') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave01)
      .setQuery(saveData01)
      .setAfter(afterSave01)
      .setConfirmMessage('긴급승인 하시겠습니까?')
      .run()
  }
  //알림발송
  else {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .setConfirmMessage('알림발송 하시겠습니까?')
      .run()
  }
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTKB0010_SEARCH_01',
    param: searchParam,
  })
}

//긴급승인 관련 로직 시작
const beforeSave01 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))

    return false
  }
  return true
}

const saveData01 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      VEND_CD: data.VEND_CD,
      YEAR: new Date().getFullYear(),
      VEND_NAME: data.VEND_NAME,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'HLTKB0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave01 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//긴급승인 관련 로직 끝

//알림발송 관련 로직 시작
const beforeSave02 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.ALARM_YN === 'Y') {
      Message.warn(t('이미 알람 발송된건이 있습니다.'))
      return false
    }
  }

  return true
}

const saveData02 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      VEND_CD: data.VEND_CD,
      YEAR: new Date().getFullYear(),
      VEND_NAME: data.VEND_NAME,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'HLTKB0010_SAVE_02',
    list: saveParam,
  })
}

const afterSave02 = () => {
  onButtonsClick({ id: 'btnSearch' })
  //grdMain.value.getGridView().checkAll(false) //체크해제
}
//알림발송 관련 로직 끝

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    var scms = grid.getValue(item.index, 'SCMS')
    /*
    2025.08.22 김현재 작성
    8월22일 현재시점 기준으로 SCMS컬럼을 조회하는 쿼리는 불승인이 안나오고 미완료,완료라고만 나옴
    12월에 쿼리 이관을 하게되면 불승인이 조회됨
    */

    //SCMS를 조회하는 쿼리는 12월에 수정예정임. 수정하게
    if (scms === '불승인' || scms === '미완료') {
      let ret = { style: { background: '#FFA500' } }
      return ret
    }
  })
}

onMounted(async () => {
  //협력사 건강관리 관리자, 협력사만 접근가능하도록
  if (userStore.authGrpCd.includes('HLTK001') || userStore.userDiv !== 'A') {
    grdMain.value.getGridView().filterPanel.visible = true
    return false
  } else {
    let result = await vm.$swal({
      title: '접근권한이 없습니다.',
    })
    if (result.isConfirmed) {
      router.push('/')
    }
  }
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnEmergencyApprove', 'btnSendAlert']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select :label="$t('년도')" width="200px" type="YEAR" v-model="searchParam.YEAR"> </i-select>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          >
          </RealGrid>
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
    min-height: 400px;
  }
}
</style>
