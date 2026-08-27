<script setup>
import queryFlowHelper from '@/utils/searchFlowHelper'
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import IMenuTitle from '@/components/IMenuTitle.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import { commonSearchApi } from '@hiway/api/commonApi'
const vm = getCurrentInstance().proxy
const t = useI18n().t
const dialog = ref(false)
const grdMain = ref(null)
const emit = defineEmits(['selected'])
const userStore = useUserStore()
//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'SYS_CD',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SYS_CDNM',
      dataType: 'text',
      width: '120',
      type: 'data',
      editable: false,
      header: { text: t('위반항목(최대3개)') },
    },
    {
      fieldName: 'CODE_SHORTNM',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CODE_DESC2',
      visible: false,
      header: { text: t('') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
//위반항목 그리드 체크박스 선택 이벤트 -> 3개이상 체크안되도록
const onItemChecked = (grid, itemIndex, checked) => {
  //그리드 체크가 되면 위반항목에 추가
  if (checked) {
    let checkNum = grdMain.value.getGridView().getCheckedRows()
    if (checkNum.length > 3) {
      Message.warn(t('최대 3개항목만 선택 가능합니다!'))
      grdMain.value.getGridView().checkRow(itemIndex, false)
      return false
    }
  }
}
//교통위반항목 조회 관련 로직 시작
const searchTraffic = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_06',
    param: { CMPNY_DIV: userStore.cmpnyDiv },
  })
}

const afterTrafficSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//교통위반항목 조회 관련 로직 끝

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchTraffic)
      .setAfter(afterTrafficSearch)
      .run()
  } else if (btn.id === 'btnSelect') {
    select()
  } else {
    closePopup()
  }
}

const openPopup = () => {
  dialog.value = true
  onButtonsClick({ id: 'btnSearch' })
}

const closePopup = () => {
  dialog.value = false
}

//선택관련 로직 시작
const select = () => {
  let checkData = []
  let checkNum = grdMain.value.getGridView().getCheckedRows()
  if (checkNum.length > 3) {
    Message.warn(t('최대 3개항목만 선택 가능합니다!'))
    return false
  }
  for (let i = 0; i < checkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkNum[i])
    checkData.push(data)
  }
  emit('selected', checkData)
  closePopup()
}
//선택관련 로직 끝

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>교통위반항목조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            style="height: 500px"
            :column-layout="grdMainProps.columnLayout"
            @onItemChecked="onItemChecked"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
