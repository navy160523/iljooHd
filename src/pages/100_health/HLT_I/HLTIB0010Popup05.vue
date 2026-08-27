<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import RealGrid from '@/components/RealGrid.vue'
const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['groupingSaved'])
const grdMain = ref(null)

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'WORK_STANDARD_ID',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('작업표준ID') },
    },
    {
      fieldName: 'WORK_STANDARD_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('작업표준명') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
    },
    {
      fieldName: 'WORK_STANDARD_NO',
      visible: false,
    },
    {
      fieldName: 'WORK_STANDARD_REVISION',
      visible: false,
    },
    {
      fieldName: 'BSNS_CD',
      visible: false,
    },
    {
      fieldName: 'DEPT_CD',
      visible: false,
    },
    {
      fieldName: 'YEAR',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (rowData) => {
  grdMain.value.getDataProvider().setRows(rowData)
  dialog.value = true
}

const closePopup = () => {
  grdMain.value.getDataProvider().setRows(null)
  dialog.value = false
  emit('groupingSaved')
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setConfirmMessage(
        `<div style=color:red;>
        체크한 작업표준을 확인해주세요. 
        그룹화 시 그룹을 해체하거나 다른 작업으로 재 그룹화 할 수 없습니다. 
        그룹화 하시겠습니까?</div>`
      )
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

//저장관련 로직 시작
const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  } else if (checkedData.length >= 2) {
    Message.warn(t('하나의 작업표준을 선택해주세요.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = [] //이력관리에 저장될 데이터
  let deleteParam = [] //작업표준마스터에서 삭제되어야할 데이터
  let checkedData = grdMain.value.getGridView().getCheckedRows(true) //그룹핑될 대표 작업표준
  let data = grdMain.value.getDataProvider().getJsonRow(checkedData[0])
  let unCheckedData = grdMain.value.getDataProvider().getJsonRows(0, -1)
  let filtered = unCheckedData.filter((row) => JSON.stringify(row) !== JSON.stringify(data))
  for (let i = 0; i < filtered.length; i++) {
    //삭제될 데이터
    let groupedData = {
      COMPANY_CD: userStore.cmpnyDiv,
      WORK_STANDARD_NO: filtered[i].WORK_STANDARD_NO,
      WORK_STANDARD_REVISION: filtered[i].WORK_STANDARD_REVISION,
      BSNS_CD: filtered[i].BSNS_CD,
      DEPT_CD: filtered[i].DEPT_CD,
      WORK_STANDARD_ID: filtered[i].WORK_STANDARD_ID,
      WORK_STANDARD_NM: filtered[i].WORK_STANDARD_NM,
      YEAR: filtered[i].YEAR,
      GROUPED_CMPNY_DIV: userStore.cmpnyDiv,
      GROUPED_WORK_STANDARD_NO: data.WORK_STANDARD_NO,
      GROUPED_REVISION: data.WORK_STANDARD_REVISION,
      GROUPED_BSNS_CD: data.BSNS_CD,
      GROUPED_DEPT_CD: data.DEPT_CD,
      INSERT_USER_ID: userStore.userId,
    }
    deleteParam.push(groupedData)
    saveParam.push(groupedData)
  }
  //남는 데이터(대표작업표준번호)
  let unGroupedData = {
    COMPANY_CD: userStore.cmpnyDiv,
    WORK_STANDARD_NO: data.WORK_STANDARD_NO,
    WORK_STANDARD_REVISION: data.WORK_STANDARD_REVISION,
    BSNS_CD: data.BSNS_CD,
    DEPT_CD: data.DEPT_CD,
    WORK_STANDARD_ID: data.WORK_STANDARD_ID,
    WORK_STANDARD_NM: data.WORK_STANDARD_NM,
    YEAR: data.YEAR,
    GROUP_YN: 'Y',
    INSERT_USER_ID: userStore.userId,
  }
  saveParam.push(unGroupedData)

  return commonExecuteApi({
    queryId: 'HLTIB0010_DELETE_03',
    list: deleteParam,
  }).then(() => {
    commonExecuteApi({
      queryId: 'HLTIB0010_SAVE_15',
      list: saveParam,
    })
  })
}

const afterSave = () => {
  closePopup()
}

//저장관련 로직 끝

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="600"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>그룹화</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnUpdate', //저장
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 500px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
