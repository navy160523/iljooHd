<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMenuList } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useUserStore } from '@hiway/stores/user'
import RealGrid from '@/components/RealGrid.vue'
import { useMenuStore } from '@hiway/stores/menu'
import _ from 'lodash'
const dialog = ref(null)
const grdMain = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuStore = useMenuStore()
const emit = defineEmits(['selected', 'selectedData'])
const treeData = reactive({
  data: [],
})

const openPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnSearch') {
    getMenuList().then((res) => {
      treeData.data = _.cloneDeep(res)
      let level1TreeId = ''
      let level2TreeId = ''
      let level3TreeId = ''
      for (let i = 0; i < treeData.data.length; i++) {
        if (treeData.data[i].menulevel == 1) {
          treeData.data[i].treeId = treeData.data[i].prnts_menu_id + treeData.data[i].menu_id
          level1TreeId = treeData.data[i].treeId
        } else if (treeData.data[i].menulevel == 2) {
          treeData.data[i].treeId = level1TreeId + '>' + treeData.data[i].menu_id
          level2TreeId = treeData.data[i].treeId
        } else if (treeData.data[i].menulevel == 3) {
          treeData.data[i].treeId = level2TreeId + '>' + treeData.data[i].menu_id
          level3TreeId = treeData.data[i].treeId
        } else if (treeData.data[i].menulevel == 4) {
          treeData.data[i].treeId = level3TreeId + '>' + treeData.data[i].menu_id
        }
      }
      grdMain.value.getDataProvider().setRows(treeData.data, 'treeId')
    })
  } else if (btn.id === 'btnSelect') {
    selectedData()
  }
}

onMounted(() => {})

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
  },
  keys: ['treeId'],
  fields: [
    {
      fieldName: 'mnu_nm',
      dataType: 'text',
      width: '100',
      header: { text: t('화면명') },
      editable: false,
    },
    {
      fieldName: 'menu_id',
      dataType: 'text',
      width: '100',
      header: { text: t('화면ID') },
      editable: false,
    },
    {
      fieldName: 'href',
      dataType: 'text',
      width: '100',
      header: { text: t('href') },
      visible: false,
    },
    {
      fieldName: 'treeId',
      dataType: 'text',
      width: '100',
      header: { text: t('treeId') },
      editable: false,
      visible: false,
    },
  ],
  columns: [],
})
grdMainProps.columns = grdMainProps.fields

const onCellDblClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  if (row.href) {
    let rowData = [row]
    emit('selected', rowData)
    closePopup()
  } else {
    Message.warn('최하단 메뉴을 선택해주세요.')
    return false
  }
  //   if (clickData.fieldIndex == 0) {
  //     grdMain.value.getGridView().expand(clickData.itemIndex)
  //     return
  //   }
}

const onItemChecked = (grid, itemIndex, checked) => {
  const dataRow = grid.getDataRow(itemIndex)

  checkNode(grid, dataRow, checked)
}

const checkNode = (grid, dataRow, checked) => {
  const provider = grid.getDataSource()

  //형제노드체크 후 부모노드 체크
  checkSiblingNode(grid, dataRow, checked)

  //자식노드체크
  const desRows = provider.getDescendants(dataRow)
  if (desRows) {
    grid.checkRows(desRows, checked, false)
  }
}

const checkSiblingNode = (grid, dataRow, checked) => {
  const provider = grid.getDataSource()

  //부모노드
  const parent = provider.getParent(dataRow)

  //형제노드
  const sibling = parent == -1 ? provider.getChildren() : provider.getChildren(parent) //자식행 인덱스

  const index = sibling.indexOf(dataRow)

  //자기자신은 제외
  if (index !== -1) {
    sibling.splice(index, 1)
  }

  if (checked) {
    for (const i in sibling) {
      const value = grid.isCheckedRow(sibling[i])

      //console.log("value??", value)
      if (checked != value) {
        checked = false
        break
      }
    }
  } else {
    checked = false
  }

  if (parent > -1) grid.checkRow(parent, checked, false, false)

  //checkBar.head 영역의 V표시 제어
  if (parent == -1) grid.setAllCheck(checked, false)
  if (parent > -1) checkSiblingNode(grid, parent, checked)
}

const selectedData = () => {
  const checkedData = []

  const allDatas = grdMain.value.getGridView().getJsonRows(null, true)
  const checkedRows = grdMain.value.getGridView().getCheckedRows()

  console.log('checkedRows', checkedRows)

  checkedRows.forEach((row) => {
    const currRow = grdMain.value.getDataProvider().getJsonRow(row)

    if (currRow.href) {
      checkedData.push(currRow)
    }
  })

  if (checkedData.length === 0) {
    Message.warn('데이터를 선택해주세요.')

    return false
  }

  emit('selected', checkedData)
  closePopup()
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="800"
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
      <span>화면 목록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnSearch',
            'btnSelect',
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :is-tree="true"
              :gridViewOption="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
              @onItemChecked="onItemChecked"
            />
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
  height: calc(100vh - 350px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
