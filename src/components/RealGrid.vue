<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

import RealGrid from 'realgrid'
import notify from '@hiway/utils/notify'
import _ from 'lodash'
import { required } from '@/@hiway/utils/validation'

const props = defineProps({
  // 조회 전용 API
  retrieveApi: {
    type: Function,
    default: () => () => {},
  },

  // 조회 시, 사용되는 옵션 값
  retrieveData: {
    type: Object,
    default() {
      return {}
    },
  },

  // 저장 (추가/수정/삭제) 대응하는 전용 API
  saveApi: {
    type: Function,
    default: () => () => {},
  },
  
  // GridView를 정의하기 위한 옵션
  gridViewOption: {
    type: Object,
    required: false,
  },

  // dataProvider를 정의하기 위한 옵션
  dataProviderOption: {
    type: Object,
    required: false,
  },

  // RealGrid Data Provider에 사용되는 기본 열 정의
  fields: {
    type: Array,
    default() {
      return []
    },
  },

  // RealGrid Data 키컬럼 정의
  keys: {
    type: Array,
    default() {
      return []
    },
  },

  // RealGrid Grid View에 사용되는 기본 열 정의
  columns: {
    type: Array,
    default() {
      return []
    },
  },

  // RealGrid Grid View에 사용되는 기본 열 정의
  columnLayout: {
    type: Array,
    default() {
      return []
    },
  },

  isTree: {
    type: Boolean,
    default: false,
  },

})


//gridView, dataProvider, treeView 이벤트 목록 전체
//onRowInserting은 gridView, dataProvider 양쪽다 존재하기 때문에 dataProvider 쪽이벤트는 제외
//필요시 다른 이름으로 추가 => 추가된 이벤트명 : 
const emit = defineEmits([
  'loaded',
  'onCollapsed',
  'onCollapsing',
  'onExpanded',
  'onExpanding',
  'onGrouped',
  'onGrouping',
  'onPageChanged',
  'onPageChanging',
  'onPageCountChanged',
  'onCellButtonClicked',
  'onCellClicked',
  'onCellDblClicked',
  'onCellEdited',
  'onCellItemClicked',
  'onCellPasting',
  'onColumnCheckedChanged',
  'onColumnPropertyChanged',
  'onCommandStackChanged',
  'onContextMenuItemClicked',
  'onContextMenuPopup',
  'onCopy',
  'onCurrentChanged',
  'onCurrentChanging',
  'onCurrentRowChanged',
  'onDataLoadComplated',
  'onEditCanceled',
  'onEditChange',
  'onEditCommit',
  'onEditRowChanged',
  'onEditRowPasted',
  'onEditSearch',
  'onErrorClicked',
  'onFiltering',
  'onFilteringChanged',
  'onGetEditValue',
  'onGridActivated',
  'onHideEditor',
  'onItemAllChecked',
  'onItemChecked',
  'onItemEditCancel',
  'onItemEditCanceled',
  'onItemsChecked',
  'onKeyDown',
  'onKeyPress',
  'onKeyUp',
  'onLayoutCollapsed',
  'onLayoutCollapsing',
  'onLayoutExpanded',
  'onLayoutExpanding',
  'onLayoutPropertyChanged',
  'onLeftPosChanged',
  'onMenuItemClicked',
  'onPaste',
  'onPasted',
  'onRowInserting',
  'onRowsDeleting',
  'onRowsPasted',
  'onScrollToBottom',
  'onSearchCellButtonClick',
  'onSelectionAdded',
  'onSelectionChanged',
  'onSelectionCleared',
  'onSelectionEnded',
  'onShowEditCommand',
  'onShowEditor',
  'onShowHeaderTooltip',
  'onShowTooltip',
  'onSorting',
  'onSortingChanged',
  'onTopIndexChanged',
  'onTopIndexChanging',
  'onValidateColumn',
  'onValidateRow',
  'onValidationFail',
  'onWheel',
  'onDataChanged',
  'onRestoreRows',
  'onRowCountChanged',
  'onRowDeleted',
  'onRowDeleting',
  'onRowInserted',
  'onRowListMoved',
  'onRowListMoving',
  'onRowListUpdated',
  'onRowMoved',
  'onRowMoving',
  'onRowsDeleted',
  'onRowsInserted',
  'onRowsMoved',
  'onRowsMoving',
  'onRowStateChanged',
  'onRowStatesChanged',
  'onRowStatesCleared',
  'onRowsUpdated',
  'onRowUpdated',
  'onRowUpdating',
  'onValueChanged',
  'onTreeItemChanged',
  'onTreeItemCollapsed',
  'onTreeItemCollapsing',
  'onTreeItemExpanded',
  'onTreeItemExpanding',
])

const realGrid = ref()
let gridView = null
let dataProvider = null
const retrieveOriginData = ref({})
const inited = ref(false)
let preRow = null

onMounted(() => {
  
  if (!props.fields) {
    console.warn('[UI Framework] RealGrid Component 내 fields를 정의하지 않았습니다.')

    return
  }

  if (!props.columns) {
    console.warn('[UI Framework] RealGrid Component 내 columns를 정의하지 않았습니다.')

    return
  }

  if (props.isTree) {
    dataProvider = new RealGrid.LocalTreeDataProvider(false)
    gridView = new RealGrid.TreeView(realGrid.value)
  }
  else
  {
    dataProvider = new RealGrid.LocalDataProvider(false)
    gridView = new RealGrid.GridView(realGrid.value)
  }

  gridView.setDataSource(dataProvider)

  let gridViewOption =  _.merge(getDefaultOptions().gridView, props.gridViewOption)
  let dataProviderOption = _.merge(getDefaultOptions().dataProvider, props.dataProviderOption)

  // gridView 옵션 적용
  gridView.setOptions(gridViewOption)

  // 필터 옵션 설정
  /*
  gridView.setFilteringOptions({
    selector: {
      showButtons: true, // 버튼 표시 여부
      acceptText: '확인', // 필터 적용 버튼 text
      cancelText: '취소', //  취소 버튼 text
    },
    automating: {
      lookupDisplay: true,
    },
  })
  */

  // 컨텍스트 메뉴 설정
  gridView.setContextMenu([
    { label: 'Column Filter 켜기', type: 'normal', tag: 'filter_on' },
    { label: 'Column Filter 끄기', type: 'normal', tag: 'filter_off' },
    { label: '-' }, // 메뉴 구분선 추가
    { label: 'Excel Export', type: 'normal', tag: 'export' },
    { label: '-' }, // 메뉴 구분선 추가
    { label: '셀 복사', type: 'normal', tag: 'copy_cell' },
    { label: '행 복사', type: 'normal', tag: 'copy_row' },
  ])

  // dataProvider 옵션 적용
  dataProvider.setOptions(dataProviderOption)

  // 열 적용
  dataProvider.setFields(props.fields)
  
  const tempCol = _.cloneDeep(props.columns)

  /* 컬럼에 파일 첨부 이미지 적용
  ex) isFile: { value: true }
  ex) isFile: { value: true, align: 'left' } (align: left, center, right)
  */
  tempCol.forEach(col => {
    if(col.editor && col.editor.type && col.editor.type === 'date') {
      col.editor.showButtons = false
    }

    if(col.isFile && col.isFile.value) {
      // console.log('isFile')

      col.styleCallback = function(grid, dataCell) {
        let ret = {}
        const iconSize = 16
        const val = grid.getValue(dataCell.index.itemIndex, col.fieldName)
        if(col.isFile.showAlways) {
          ret.renderer = {
            type: 'icon',
            iconLocation: col.isFile.align ? col.isFile.align : 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/file-plus-outline.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        } else if(val) {
          ret.renderer = {
            type: 'icon',
            iconLocation: col.isFile.align ? col.isFile.align : 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/file-plus-outline.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        } else if(!val && col.isFile.isUpload) {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'rightEdge',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/paperclip.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }

        return ret
      }
    }
  })

  gridView.setColumns(tempCol)

  if (props.columnLayout.length > 0)
  {
    gridView.setColumnLayout(props.columnLayout)
  }
  
  initEvent()

  inited.value = true
  emit('loaded')
})


const initEvent = () => {

  // 컨텍스트 메뉴가 실행될 때 호출되는 함수, false 를 리턴하면 컨텍스트 메뉴를 실행하지 않는다.
  gridView.onContextMenuPopup = (cgrid, x, y, elementName) => {
    // 조회 전이거나, 조회후에 그리드 데이터가 없으면 컨텍스트 메뉴 실행하지 않음
    //if (!inited.value || dataProvider.getRowCount() <= 0) return false
    if (dataProvider.getRowCount() <= 0) return false

    // 헤더, 푸터, 그룹핑 패널 영역에서는 컨텍스트 메뉴 실행하지 않음
    if (elementName.cellType !== 'data') return false
    
    emit('onContextMenuPopup', cgrid, x, y, elementName)
  }

  gridView.onContextMenuItemClicked = (cgrid, menuItem, index) => {

    // 선택된 contextmenu 항목에 따라 처리
    switch (menuItem.tag) {
    case 'export': // 엑셀 다운로드
      gridView.exportGrid({
        type: 'excel',
        target: 'local',
        lookupDisplay: true,
        fileName: 'gridExportSample.xlsx', // 저장될 파일 name
        progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
        // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
        indicator: 'visible', // indidator 영역 표시
        header: 'visible', // 헤더 표시
        footer: 'hidden', // footer 표시하지 않음
        allColumns: false, // visible : false 인 행도 표시할 것인지 여부
        done: () => {
          // 내보내기 완료 후 실행되는 함수
          notify.success('엑셀 다운로드가 완료되었습니다.')
        },
      })
      break
    case 'filter_on': // Column Filter 켜키
      gridView.setColumnProperty(index.column, "autoFilter", true)
      break
    case 'filter_off': // Column Filter 끄기
      gridView.setColumnProperty(index.column, "autoFilter", false)
      break
    case 'copy_cell':
      gridView.copyToClipboard({
        startItem: index.itemIndex,
        endItem: index.itemIndex,
        startColumn: index.column,
        endColumn: index.column,
      }, true)
      break
    case 'copy_row':
      const onlyColsNames = gridView.getColumnNames(true, true)

      gridView.copyToClipboard({
        startItem: index.itemIndex,
        endItem: index.itemIndex,
        startColumn: onlyColsNames[0],
        endColumn: onlyColsNames[onlyColsNames.length - 1],
      }, true)
      break
    }
    
    emit('onContextMenuItemClicked', cgrid, menuItem, index)
  }


  // 그룹핑 된 행이 접힘을 알리는 콜백
  gridView.onCollapsed = (grid, itemIndex) => { emit('onCollapsed', grid, itemIndex) }


  // 그룹핑 된 행 접기를 결정하는 콜백
  gridView.onCollapsing = (grid, itemIndex) => { emit('onCollapsing', grid, itemIndex) }

  // 그룹핑 된 행이 펼쳐졌음을 알리는 콜백
  gridView.onExpanded = (grid, itemIndex) => { emit('onExpanded', grid, itemIndex) }

  // 그룹핑 된 행 펼치기를 결정하는 콜백
  gridView.onExpanding = (grid, itemIndex) => { emit('onExpanding', grid, itemIndex) }

  // 그룹핑했음을 알리는 콜백
  gridView.onGrouped = grid => { emit('onGrouped', grid) }

  // 그룹핑을 결정하는 콜백
  gridView.onGrouping = (grid, fields) => { emit('onGrouping', grid, fields) }

  // 그리드가 Paging 상태일 때, 다른 페이지로 이동했음을 알리는 콜백
  gridView.onPageChanged = (grid, page) => { emit('onPageChanged', grid, page) }

  // 그리드가 Paging 상태일 때, 페이지 이동을 결정하는 콜백
  gridView.onPageChanging = (grid, page) => { emit('onPageChanging', grid, page) }

  // 그리드가 Paging 상태일 때, 변경된 페이지 수와 함께 다른 페이지로 이동했음을 알리는 콜백
  gridView.onPageCountChanged = (grid, pageCount) => { emit('onPageCountChanged', grid, pageCount) }

  // 사용자가 데이터 셀 내부의 action 버튼을 클릭했을 때 호출한다.
  gridView.onCellButtonClicked = (grid, index, col) => { emit('onCellButtonClicked', grid, index, col) }

  // 그리드 셀이 클릭되었음을 알리는 콜백
  gridView.onCellClicked = (grid, clickData) => { emit('onCellClicked', grid, clickData) }
  
  // 그리드 셀이 더블 클릭되었음을 알리는 콜백
  gridView.onCellDblClicked = (grid, clickData) => { emit('onCellDblClicked', grid, clickData) }
  
  //  수정이나 추가 중인 편집 아이템의 한 필드값이 편집 완료되었음을 알리는 콜백
  gridView.onCellEdited = (grid, itemIndex, row, field) => { 
    
    // 2024.01.03(장도은)
    // - gridView.checkItem(row, true) -> gridView.checkItem(itemIndex, true)
    gridView.checkItem(itemIndex, true)
    gridView.commit()

    emit('onCellEdited', grid, itemIndex, row, field) 
  }

  // 그리드 셀에 포함된 엘리먼트가 클릭되었음을 알리는 콜백
  gridView.onCellItemClicked = (grid, index, clickData) => { emit('onCellItemClicked', grid, index, clickData) }
 
 
  // 셀에 붙여넣기를 결정하는 콜백
  gridView.onCellPasting = (grid, index, value) => { emit('onCellPasting', grid, index, value) }

  // 사용자의 컬럼 헤더 체크박스를 클릭을 알리는 콜백 chk: boolean
  gridView.onColumnCheckedChanged = (grid, col, chk) => { emit('onColumnCheckedChanged', grid, col, chk) }

  // grid - GridBase 컨트롤 column - 변경된 컬럼의 정보 property - 컬럼의 displayWidth, displayIndex, visible 속성 중 변경된 것 value - 변경된 값이 전달된다.
  gridView.onColumnPropertyChanged = (grid, column, property, newValue, oldValue) => { emit('onColumnPropertyChanged', grid, column, property, newValue, oldValue) }

  // CommandStack이 바뀌었음을 알리는 콜백 undoable: boolean, redoable: boolean
  gridView.onCommandStackChanged = (grid, undoable, redoable) => { emit('onCommandStackChanged', grid, undoable, redoable) }

  // control + c 키로 복사하기를 결정하는 콜백 (grid: GridBase, selection: Selection | Selection[], event: ClipboardEvent) => boolean
  gridView.onCopy = (grid, selection, event) => { emit('onCopy', grid, selection, event) }

  // 그리드의 focus cell 의 위치 변경을 알리는 콜백
  gridView.onCurrentChanged = (grid, newIndex) => { emit('onCurrentChanged', grid, newIndex) }

  // 그리드의 focus cell 의 위치 변경을 결정하는 콜백 (grid: GridBase, oldIndex: CellIndex, newIndex: CellIndex) => boolean
  // return false; 를 하는 경우 위치 변경이 되지 않는다.
  gridView.onCurrentChanging = (grid, oldIndex, newIndex) => { emit('onCurrentChanging', grid, oldIndex, newIndex) }


  // 데이터 행의 위치가 변경됨을 알리는 콜백
  gridView.onCurrentRowChanged = (grid, oldRow, newRow) => { emit('onCurrentRowChanged', grid, oldRow, newRow) }

  // dataProvider.setRows()를 실행한 이후 그리드 refresh가 완료된 후 발생하는 콜백
  gridView.onDataLoadComplated = grid => { emit('onDataLoadComplated', grid) }

  // 사용자가 편집중 ESCAPE 키를 입력하거나 cancel() 이 호출되어 편집이 취소됨을 알리는 콜백
  gridView.onEditCanceled = (grid, index) => { emit('onEditCanceled', grid, index) }

  // 아이템이 사용자의 Key 입력 등으로 값이 변경되었음을 알리는 콜백
  gridView.onEditChange = (grid, index, value) => { emit('onEditChange', grid, index, value) }

  // 사용자 입력이 셀에 반영함을 결정하는 콜백
  gridView.onEditCommit = (grid, index, oldValue, newValue) => { emit('onEditCommit', grid, index, oldValue, newValue) }

  // 사용자 입력으로 변경된 값이 행에 반영되었음을 알리는 콜백
  gridView.onEditRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => { emit('onEditRowChanged', grid, itemIndex, dataRow, field, oldValue, newValue) }

  // 그리드 셀에 붙여넣기 했음을 알리는 콜백
  gridView.onEditRowPasted = (grid, itemIndex, row, fields, oldValues, newValues) => { emit('onEditRowPasted', grid, itemIndex, row, fields, oldValues, newValues) }

  // 검색을 했음을 알리는 콜백
  gridView.onEditSearch = (grid, index, text) => { emit('onEditSearch', grid, index, text) }
 
  // 그리드에 발생한 에러창을 클릭했음을 알리는 콜백
  gridView.onErrorClicked = (grid, error) => { emit('onErrorClicked', grid, error) }
  
  // 필터링을 결정하는 콜백
  gridView.onFiltering = grid => { emit('onFiltering', grid) }

  // 컬럼에 필터들이 설정되어 있고, 그 필터의 상태가 변경되었음을 알리는 콜백
  gridView.onFilteringChanged = (grid, column, filter) => { emit('onFilteringChanged', grid, column, filter) }

  // 셀 편집이 완료되었을 때 셀의 위차와 편집결과를 갖고 있는 콜백
  gridView.onGetEditValue = (grid, index, editResult) => { emit('onGetEditValue', grid, index, editResult) }

  // 그리드가 선택되었음을 알리는 콜백
  gridView.onGridActivated = grid => { emit('onGridActivated', grid) }


  // 편집이 완료되고 편집기가 사라진 것을 알리는 콜백
  gridView.onHideEditor = (grid, index) => { emit('onHideEditor', grid, index) }

  //사용자가 checkBar의 Header를 클릭하여 전체선택, 해제를 하거나 또는 checkAll true / false 을 입력하여 전체선택, 해제를 했음을 알리는 콜백 
  gridView.onItemAllChecked = (grid, checked) => { emit('onItemAllChecked', grid, checked) }

  // 사용자가 checkBar의 체크박스를 클릭하거나 checkItem을 호출하여 체크를 변경했음을 알리는 콜백
  gridView.onItemChecked = (grid, itemIndex, checked) => { emit('onItemChecked', grid, itemIndex, checked) }

  // 사용자가 행 편집을 취소를 결정하는 콜백
  gridView.onItemEditCancel = (grid, itemIndex, state) => { emit('onItemEditCancel', grid, itemIndex, state) }

  // 사용자가 행 편집을 취소했음을 알리는 콜백
  gridView.onItemEditCanceled = (grid, itemIndex, state) => { emit('onItemEditCanceled', grid, itemIndex, state) }


  // 사용자가 checkBar의 체크박스를 클릭하거나 checkItem을 호출하여 체크를 변경했음을 알리는 콜백
  gridView.onItemsChecked = (grid, items, checked) => { emit('onItemsChecked', grid, items, checked) }

  // 키 입력을 결정하는 콜백
  gridView.onKeyDown = (grid, event) => { emit('onKeyDown', grid, event) }

  // 키가 입력되고 있음을 알리는 콜백
  gridView.onKeyPress = (grid, event) => { emit('onKeyPress', grid, event) }

  // 키를 입력하였음을 알리는 콜백.
  gridView.onKeyUp = (grid, event) => { emit('onKeyUp', grid, event) }

  // 그룹 Layout이 접혔음을 알리는 콜백
  gridView.onLayoutCollapsed = (grid, layout) => { emit('onLayoutCollapsed', grid, layout) }

  // 그룹 Layout 접기를 결정하는 콜백
  gridView.onLayoutCollapsing = (grid, layout) => { emit('onLayoutCollapsing', grid, layout) }

  // 그룹 Layout이 펼쳐졌음을 알리는 콜백
  gridView.onLayoutExpanded = (grid, layout) => { emit('onLayoutExpanded', grid, layout) }

  // 그룹 Layout 펼치기를 결정하는 콜백 false를 return 하면 펼치기가 취소된다.
  gridView.onLayoutExpanding = (grid, layout) => { emit('onLayoutExpanding', grid, layout) }

  // Layout의 속성 중 displayWidth, displayIndex, visible 속성값이 변경되었음을 알리는 콜백
  gridView.onLayoutPropertyChanged = (grid, layout, property, newValue, oldValue) => { emit('onLayoutPropertyChanged', grid, layout, property, newValue, oldValue) }

  // 수평 스크롤 바의 위치가 변경됨을 알리는 콜백
  gridView.onLeftPosChanged = (grid, pos) => { emit('onLeftPosChanged', grid, pos) }

  // 추가한 팝업메뉴 항목의 클릭을 알리는 콜백
  gridView.onMenuItemClicked = (grid, item, clickData) => { emit('onMenuItemClicked', grid, item, clickData) }

  // 그리드에 붙여넣기를 결정하는 콜백
  gridView.onPaste = (grid, index, event) => { emit('onPaste', grid, index, event) }

  // 그리드에 붙여넣기 했음을 알리는 콜백
  gridView.onPasted = grid => { emit('onPasted', grid) }

  // 사용자가 Insert 키를 눌러 새로운 행을 삽입하거나, 마지막 행에서 아래 화살표를 눌러 행을 추가하는 것을 결정하는 콜백
  gridView.onRowInserting = (grid, itemIndex, dataRow) => { emit('onRowInserting', grid, itemIndex, dataRow) }

  // 사용자가 Ctrl+Del 키를 누르거나 deleteSelection() 으로 삭제할 때, 실제 삭제를 결정하는 콜백
  gridView.onRowsDeleting = (grid, rows) => { emit('onRowsDeleting', grid, rows) }

  // 여러 행을 붙여넣기 했음을 알리는 콜백
  gridView.onRowsPasted = (grid, items) => { emit('onRowsPasted', grid, items) }

  // 사용자가 키보드나 스크롤 바 등을 조작하여 그리드에 마지막 행이 표시될 때 호출되는 콜백
  gridView.onScrollToBottom = grid => { emit('onScrollToBottom', grid) }

  // SearchCellEditor 에서 버튼을 클릭했음을 알리는 콜백
  gridView.onSearchCellButtonClick = (grid, index, text) => { emit('onSearchCellButtonClick', grid, index, text) }

  // 선택 영역이 새로 추가됨을 알리는 콜백
  gridView.onSelectionAdded = (grid, selection) => { emit('onSelectionAdded', grid, selection) }

  // 사용자가 마우스나 키보드로 선택 영역의 크기를 변경했음을 알리는 콜백
  gridView.onSelectionChanged = grid => { emit('onSelectionChanged', grid) }

  //사용자가 마우스나 키보드로 선택 영역을 변경했을때 기존 선택 영역이 제거 되었음을 알리는 콜백
  gridView.onSelectionCleared = grid => { emit('onSelectionCleared', grid) }

  // 사용자가 마우스로 선택 영역 변경 완료를 알리는 콜백
  gridView.onSelectionEnded = grid => { emit('onSelectionEnded', grid) }
  
  // mobile에서 표시되는 editCommand의 표시여부를 결정하는 콜백
  gridView.onShowEditCommand = (grid,index) => { emit('onShowEditCommand', grid,index) }

  // Cell 별로 열리는 Editor 의 표시를 결정하는 콜백
  // row가 신규행이 아니고 key 컬럼이면 에디팅 불가
  gridView.onShowEditor = (grid, index, editorProps, attrs) => { 
    
    let arrKey = [...props.keys]
    let column = index.column
    let rowState = dataProvider.getRowState(index.dataRow)

    if (rowState != 'created' && arrKey.includes(column)) {
      return false
    }

    emit('onShowEditor', grid, index, editorProps, attrs) 
  }

  // 컬럼 헤더의 툴팁이 표시되었음을 알리는 콜백
  gridView.onShowHeaderTooltip = (grid, column, value, layout) => { emit('onShowHeaderTooltip', grid, column, value, layout) }

  // 데이터 셀의 툴팁이 표시되었음을 알리는 콜백
  gridView.onShowTooltip = (grid, index, value) => { emit('onShowTooltip', grid, index, value) }

  // 정렬을 결정하는 콜백
  gridView.onSorting = grid => { emit('onSorting', grid) }

  // 정렬했음을 알리는 콜백
  gridView.onSortingChanged = grid => { emit('onSortingChanged', grid) }
 
  // 수직 스크롤 바의 위치가 변경됨을 알리는 콜백
  gridView.onTopIndexChanged = (grid, idx) => { emit('onTopIndexChanged', grid, idx) }
 
  // gridView.topIndex가 변경될때 호출되는 콜백 focusing: boolean, adjust: boolean
  gridView.onTopIndexChanging = (grid, current, delta, focusing, adjust) => { emit('onTopIndexChanging', grid, current, delta, focusing, adjust) }

  //셀 편집을 완료하고 다른 셀로 이동할때 Javascript를 통한 사용자 검증 결과를 결정하는 콜백  
  gridView.onValidateColumn = (grid, column, inserting, value, itemIndex, dataRow) => { emit('onValidateColumn', grid, column, inserting, value, itemIndex, dataRow) }

  // Javascript를 통한 행 단위 사용자 검증 결과를 결정하는 콜백  inserting: boolean
  gridView.onValidateRow = (grid, itemIndex, dataRow, inserting, values) => { emit('onValidateRow', grid, itemIndex, dataRow, inserting, values) }
  
  // validation 실패시 발생하는 콜백
  gridView.onValidationFail = (grid, itemIndex, column, err) => { emit('onValidationFail', grid, itemIndex, column, err) }

  // Wheel Event가 발생했음을 알리는 콜백
  gridView.onWheel = (grid, event) => { emit('onWheel', grid, event) }

  // 데이터가 변경 되었음을 알리는 콜백
  dataProvider.onDataChanged = provider => { emit('onDataChanged', provider) }

  // 복수의 데이터 행의 상태가 복원되었음을 알리는 콜백
  dataProvider.onRestoreRows = (provider, rows) => { emit('onRestoreRows', provider, rows) }
  
  // 행의 갯수가 변경되었음을 알리는 콜백
  dataProvider.onRowCountChanged = (provider, count) => { emit('onRowCountChanged', provider, count) }

  // 행 삭제가 되었음을 알리는 콜백
  dataProvider.onRowDeleted = (provider, row) => { emit('onRowDeleted', provider, row) }

  // 행 삭제를 결정하는 콜백
  dataProvider.onRowDeleting = (provider, row) => { emit('onRowDeleting', provider, row) }

  // 데이터 행이 추가되었을을 알리는 콜백
  dataProvider.onRowInserted = (provider, row) => { emit('onRowInserted', provider, row) }

  // 데이터 행 추가를 결정하는 콜백
  dataProvider.onRowInserting =  (provider, row, values) => { emit('onRowInserting', provider, row, values) }
 
  // 복수의 데이터 행이 이동되었음을 알리는 콜백
  dataProvider.onRowListMoved = (provider, rows, newRow) => { emit('onRowListMoved', provider, rows, newRow) }
 
  // 마우스를 이용한 행의 이동을 결정하는 콜백
  dataProvider.onRowListMoving = (provider, rows, newRow) => { emit('onRowListMoving', provider, rows, newRow) }

  // 다수의 데이터 행이 변경되었음을 알리는 콜백
  dataProvider.onRowListUpdated = (provider, rows) => { emit('onRowListUpdated', provider, rows) }

  // 데이터 행이 이동되었음을 알리는 콜백
  dataProvider.onRowMoved = (provider, row, newRow) => { emit('onRowMoved', provider, row, newRow) }
  
  // 데이터 행의 이동을 결정하는 콜백
  dataProvider.onRowMoving = (provider, row, newRow) => { emit('onRowMoving', provider, row, newRow) }
  
  // 데이터 행이 삭제되었음을 알리는 콜백
  dataProvider.onRowsDeleted = (provider, rows) => { emit('onRowsDeleted', provider, rows) }
  
  // 다수의 데이터 행이 일괄 추가되었을 때 알리는 콜백
  dataProvider.onRowsInserted = (provider, row, count) => { emit('onRowsInserted', provider, row, count) }
  
  // 복수의 데이터 행이 이동되었음을 알리는 콜백
  dataProvider.onRowsMoved = (provider, row, count, newRow) => { emit('onRowsMoved', provider, row, count, newRow) }
  
  // 복수의 데이터 행의 이동을 결정하는 콜백
  dataProvider.onRowsMoving = (provider, row, count, newRow) => { emit('onRowsMoving', provider, row, count, newRow) }
  
  // 데이터 행의 상태가 변경되었음을 알리는 콜백
  dataProvider.onRowStateChanged = (provider, row) => { emit('onRowStateChanged', provider, row) }

  // 복수의 데이터 행의 상태가 일괄 변경되었음을 알리는 콜백
  dataProvider.onRowStatesChanged = (provider, rows) => { emit('onRowStatesChanged', provider, rows) }

  // 모든 행의 상태가 초기화 되었음을 알리는 콜백
  dataProvider.onRowStatesCleared = provider => { emit('onRowStatesCleared', provider) }

  // 다수의 데이터 행이 일괄 수정되었음을 알리는 콜백
  dataProvider.onRowsUpdated = (provider, row, count) => { emit('onRowsUpdated', provider, row, count) }

  // 데이터 행이 수정되었음을 알리는 콜백
  dataProvider.onRowUpdated = (provider, row) => { emit('onRowUpdated', provider, row) }

  // 데이터 행의 수정을 결정하는 콜백
  dataProvider.onRowUpdating = (provider, row) => { emit('onRowUpdating', provider, row) }

  // 데이터 셀의 값이 변경되었음을 알리는 콜백
  dataProvider.onValueChanged = (provider, row, field) => { emit('onValueChanged', provider, row, field) }

  // TreeView의 값이 변경되었음을 알리는 콜백
  gridView.onTreeItemChanged = (tree, itemIndex, rowId) => { emit('onTreeItemChanged', tree, itemIndex, rowId) }

  // TreeView의 아이템 노드가 졉혔음을 알리는 콜백
  gridView.onTreeItemCollapsed = (tree, itemIndex, rowId) => { emit('onTreeItemCollapsed', tree, itemIndex, rowId) }

  // TreeView의 아이템 노드 접힘을 결정하는 콜백
  gridView.onTreeItemCollapsing = (tree, itemIndex, rowId) => { emit('onTreeItemCollapsing', tree, itemIndex, rowId) }

  // TreeView의 아이템 노드가 펼쳐졌음을 알리는 콜백
  gridView.onTreeItemExpanded = (tree, itemIndex, rowId) => { emit('onTreeItemExpanded', tree, itemIndex, rowId) }
  
  // TreeView의 아이템 노드 펼치기를 결정하는 콜백
  gridView.onTreeItemExpanding = (tree, itemIndex, rowId) => { emit('onTreeItemExpanding', tree, itemIndex, rowId) }

}

onBeforeUnmount(() => {
  /*
   * RealGrid를 사용할 경우, lifecycle 내 beforeDestroy 항목에서,
   * RealGrid가 사용한 리소스를 해제해야 하는 작업이 필요합니다.
  */

  // 데이터 초기화
  dataProvider.clearRows()

  // grid, provider 초기화
  dataProvider.destroy()
  gridView.destroy()

  // LocalDataProvider와 GridView 객체 초기화
  gridView = null
  dataProvider = null
})

//조회 후 이동할 행 저장
const setPreRow = row => {    
  let idx = gridView.getCurrent()
  
  if (idx.dataRow < 0)
    preRow = null
  else
    preRow = dataProvider.getJsonRow(idx.dataRow, false)
}

//조회 완료 후 이전 행으로 포커스 이동
const movePreRow = () => {

  let arrKey = [...props.keys]
  let rowData = dataProvider.getJsonRows().find(data => arrKey.every(key => preRow != null && data[key] == preRow[key] ) )
  let values = []

  if (rowData) 
  {
    for(let [key, value] of Object.entries(rowData)) {
      if (arrKey.includes(key))
        values.push(value)
    }

    let row = gridView.searchItem( { fields: props.keys, values: values })

    gridView.setCurrent( { dataRow : row } )
  }
  else 
  {
    let rowCnt = dataProvider.getRowCount()

   
    if (rowCnt > 0) {
     
      gridView.setCurrent( { dataRow: 0, fieldIndex: 0 } )
    }
  }
}

// 함수
// 그리드 조회
const retrieve = () => {
  if (typeof props.retrieveApi !== 'function') return

  let requestObj = props.retrieveData ?? {}

  // 조회 시, 사용했던 조건 데이터들은 retrieveOriginData에 저장되어, 차후 Save 시 사용된다.
  retrieveOriginData.value = requestObj

  // 데이터를 가져오는 retrieveApi를 API 실행
  return new Promise((resolve, reject) => {
    props.retrieveApi(requestObj).then(res => {
      // RealGrid에 조회한 데이터를 넣는다.
      // callback object 분기처리
      if (res.dataList !== undefined) {
        dataProvider.fillJsonData(res.dataList)
      } else {
        dataProvider.fillJsonData(res)
      }

      inited.value = true
      resolve()
    }).catch(err => reject(err))
  })
}

const goRow = param => {
  const keys = _.keys(param)
  const vals = _.values(param)

  const row = gridView.searchItem({ fields: keys, values: vals })

  // console.log('keys', keys)
  // console.log('vals', vals)
  // console.log('row', row)

  // gridView.setCurrent({ dataRow : row })
  gridView.setCurrent(row)
}


/* ******* 2024.01.05 염인식, 마지막 로우에 추가기능 추가 ******* */
const addRow = (data, moveFocusYn) => {
  // 조회 되지 않는 그리드에서는 해당 기능을 사용할 수 없다.
  if (!inited.value) return

  let idx = gridView.getCurrent().itemIndex
  let lastIdx = dataProvider.getRowCount()
  let moveFocus = moveFocusYn === false ? false : true

  idx = idx + 1
  lastIdx = lastIdx

  if(moveFocus){
    gridView.commit()
    if(dataProvider.insertRow(idx , data)){
      gridView.setCurrent({ itemIndex: idx })
      gridView.checkItem(idx, true)
    }
  }else if(moveFocus === false) {
    gridView.commit()
    if(dataProvider.insertRow(lastIdx , data)){
      gridView.setCurrent({ itemIndex: lastIdx })
      gridView.checkItem(lastIdx, true)
    }
  }


  // if (dataProvider.insertRow(idx , data) && moveFocus) {
  //   gridView.checkItem(idx, true)
  //   gridView.commit()
  //   gridView.setCurrent({ itemIndex: idx })
  // } else if(dataProvider.insertRow(lastIdx , data) && !moveFocus){
  //   gridView.checkItem(lastIdx, true)
  //   gridView.commit()
  //   gridView.setCurrent({ itemIndex: lastIdx })
  // }
}

// 선택된 Current Row에 삭제 표시를 한다.
// 차후, 저장 시 삭제 대상이 된다.
const deleteRow = () => {
  // 조회 되지 않는 그리드에서는 해당 기능을 사용할 수 없다.
  // if (!inited.value) return

  // 옵션이 true일 경우 묻지않고 삭제 대상이 된다.
  gridView.deleteSelection(true)
}

const deleteRows = () => {
  const rows = gridView.getCheckedRows(true)
  for (let i = 0; i < rows.length; i++) {
    dataProvider.setRowState(rows[i], 'deleted')
  }
  gridView.checkAll(false)
}

const checkValidation = (checkedYn, requiredYn) => {

  gridView.commit()

  if (dataProvider.getRowCount() == 0)
  {
    return '저장할 데이터가 없습니다.'
  }
  
  let checkedRows = gridView.getCheckedItems(true)
  if (checkedYn && checkedRows.length == 0)
  {
    return '선택된 데이터가 없습니다.'
  }

  if (requiredYn)
  {
    let columns = gridView.getColumns()

    for (let i=0; i < checkedRows.length; i++) {

      let row = dataProvider.getJsonRow(checkedRows[i])

      for (let j=0; j < columns.length; j++) {
        let col = columns[j]

        if (col.required && [null, undefined, ''].includes(row[col.fieldName]))
          return '[' + col.header.text + ']는 필수 입력값입니다.'
      }
    }
  }

  return ''

}


// saveApi에 정의한 API를 호출한다.
// 조회 때 저장한 조건 데이터를 가져와 사용한다.
const save = () => {
  // 조회 되지 않는 그리드에서는 해당 기능을 사용할 수 없다.
  if (!inited.value) return

  // 수정 도중이면 현재 상황을 정리한다.
  // commit은 수정 줄이 수정 상태 그대로, cancel은 수정 이전 상태로 변경
  gridView.commit()

  // saveApi에 API 매칭되어야 기능을 사용할 수 있다.
  if (typeof props.saveApi !== 'function') return

  const gridSaveData = {
    updated: [],
    created: [],
    deleted: [],
  }

  // 각 상태 별 값을 가져온다.
  // RealGrid에서 getStateRows를 통해 각 상태별 dataProvider 내 index 정보를 가져온다.
  const updatedRows = dataProvider.getStateRows('updated')
  const createdRows = dataProvider.getStateRows('created')
  const deletedRows = dataProvider.getStateRows('deleted')

  // index 정보를 기준으로 각 실제 값을 가져온다.
  updatedRows.forEach((row, idx) => {
    gridSaveData.updated.push(dataProvider.getJsonRow(row))
  })
  createdRows.forEach((row, idx) => {
    gridSaveData.created.push(dataProvider.getJsonRow(row))
  })
  deletedRows.forEach((row, idx) => {
    gridSaveData.deleted.push(dataProvider.getJsonRow(row))
  })

  gridSaveData.retrieveData = retrieveOriginData.value

  // 전송
  return new Promise((resolve, reject) => {
    // 조회 시, 조건 파라미터들은 retrieveOriginData 저장되어 있으며,
    // 이 값을 저장 시에도 조건으로 사용한다.
    props.saveApi(gridSaveData).then(() => {
      // 저장 완료되면, 그리드를 재 조회 한다.
      retrieve()
      resolve()
    }).catch(err => reject(err))
  })
}

const getGridView = () => {
  return gridView
}

const getDataProvider = () => {
  return dataProvider
}

//포커스된 행의 데이터를 Json형태로 리턴하는 함수
const getFocusedRowData = () => {
  var focusRowIdx = gridView.getCurrent().itemIndex
  if(focusRowIdx < 0) return null

  var focusRow = dataProvider.getJsonRow(focusRowIdx)
  focusRow.FOCUSED_ROW_IDX = focusRowIdx

  return focusRow
}

//행의 인덱스 데이터를 Json형태로 리턴하는 함수
const getRowData = rowIdx => {  
  if(rowIdx < 0) return null

  return dataProvider.getJsonRow(rowIdx)
}

const setBindingColumn = (colName, source, valueField, textField) => {  
  try {
    var col = gridView.getColumns().find(x => x._name == colName)
    col.values = source.map(item => item[valueField])
    col.labels = source.map(item => item[textField])
  } 
  catch (err) {
    console.log('err : ', err)
  }
}

const excelDown = fileName => {
  if (fileName) {
    fileName = fileName.trim()
  }
  gridView.commit()
  gridView.exportGrid({
    type: 'excel',
    target: 'local',
    fileName: fileName ? fileName + '.xlsx' : 'gridExport.xlsx', // 저장될 파일 name
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
    indicator: 'visible', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'hidden', // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      notify.success('엑셀 다운로드가 완료되었습니다.')
    },
  })
}

const getDefaultOptions = function() {

  return {
    dataProvider: {
      softDeleting: true,
      deleteCreated: true, // 추가된 행은 삭제 시 그리드에서 바로 삭제된다.
    },
    gridView : {   
      checkBar: {
        visible: false,
        width: 35,
      },
      copy: {
        singleMode: true,
      },
      dataDrop: {

      },
      display: {
        // 그리드 너비에 맞춰 컬럼 너비 자동 조정
        fitStyle: 'even',
        rowHeight: -1,
        minRowHeight: 32,
        emptyMessage: 'No Data',
        selectionStyle: 'rows',
        useFocusClass: true
      },
      edit: {
        //appendable: true,
        insertable: true,
        deletable: true,
        commitByCell: true,
        commitLevel: true,
        commitWhenExitLast: true,
        commitWhenLeave: true,
        commitWhenNoEdit: true,
        crossWhenExitLast: true,
      },
      filtering: {
        selector: {
          showButtons: true, // 버튼 표시 여부
          acceptText: '확인', // 필터 적용 버튼 text
          cancelText: '취소', //  취소 버튼 text
        },
        automating: {
          lookupDisplay: true,
        },
      },
      fixed: {

      },
      footer: {
        height: 0,
        minHeight: 32,
        visible: false,
      },
      footers: {
      },
      format: {

      },
      header: {
        height: 35,
      },
      headerSummaries: {
        // 2024.08.19 박용훈 상단요약 표시 추가
        visible: false,
      },
      headerSummary: {

      },
      hideDeletedRows: {

      },
      pasted: {

      },
      rowIndicator: {
        width: 50,
        footText: '',
      },
      sorting: {

      },
      sortMode: {

      },
      stateBar: {
        visible: false,
      },
      summaryMode: {

      },
    },
  }
}

// 외부에서 사용
defineExpose({
  retrieve,
  addRow,
  goRow,
  deleteRow,
  deleteRows,
  save,
  getGridView,
  getDataProvider,
  excelDown,
  checkValidation,
  setPreRow,
  movePreRow,
  setBindingColumn,
  getFocusedRowData,
  getRowData,
})
</script>

<template>
  <div
    ref="realGrid"
    :style="`height: 100%;  width: 100%`"
  />
</template>