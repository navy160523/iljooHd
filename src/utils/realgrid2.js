import RealGrid from 'realgrid'
import _ from 'lodash'

let RealgridFactory = function(gridRef, options) {
  let gridView
  let dataProvider
  let contextMenuArray = [
    { label: 'Column Filter 켜키', type: 'normal', tag: 'filter_on' },
    { label: 'Column Filter 끄기', type: 'normal', tag: 'filter_off' },
    { label: '-' }, // 메뉴 구분선 추가
    { label: 'Excel Export', type: 'normal', tag: 'export' },
  ]

  let inited = false

  let appendField = [
    { fieldName: 'recv_status', dataType: 'text' },
    { fieldName: 'is_change', dataType: 'text' },
  ]

  // 그리드 준비하기
  dataProvider = new RealGrid.LocalDataProvider()
  gridView = new RealGrid.GridView(gridRef)
  gridView.setDataSource(dataProvider)

  options = _.merge(getDefaultOptions(), options)
  gridView.setOptions(options.gridView)
  dataProvider.setOptions(options.dataProvider)

  /*
  if (options && options.gridView) {
    gridView.setOptions(options.gridView)
  } else {
    // 기본 옵션
    // gridView에 옵션을 적용한다.
    gridView.setOptions({
      edit: {
        appendable: true,
        insertable: true,
        deletable: true,
      },
      display: {
        // 그리드 너비에 맞춰 컬럼 너비 자동 조정
        fitStyle: 'even',
      },
    })
  }

  if (options && options.dataProvider) {
    dataProvider.setOptions(options.dataProvider)
  } else {
    // 기본 옵션
    // dataProvider에 옵션을 적용한다.
    dataProvider.setOptions({
      softDeleting: true,
    })
  }
  */

  // 필터 옵션 설정
  gridView.setFilteringOptions({
    selector: {
      showButtons: true, // 버튼 표시 여부
      acceptText: '확인', // 필터 적용 버튼 text
      cancelText: '취소', //  취소 버튼 text
    },
  })

  gridView.setContextMenu(contextMenuArray) // 컨텍스트 메뉴 설정

  // 컨텍스트 메뉴가 실행될 때 호출되는 함수, false 를 리턴하면 컨텍스트 메뉴를 실행하지 않는다.
  gridView.onContextMenuPopup = (cgrid, x, y, elementName) => {
    console.log('inited : ', inited, 'elementName: ', elementName)

    // 조회 전이거나, 조회후에 그리드 데이터가 없으면 컨텍스트 메뉴 실행하지 않음
    if (!inited || dataProvider.getRowCount() <= 0) return false

    // 헤더, 푸터, 그룹핑 패널 영역에서는 컨텍스트 메뉴 실행하지 않음
    if (elementName.cellType !== 'data') return false
  }

  gridView.onContextMenuItemClicked = (cgrid, menuItem, index) => {
    console.log('cgrid', cgrid)
    console.log('menuItem', menuItem)


    // 선택된 contextmenu 항목에 따라 처리
    switch (menuItem.tag) {
    case 'export': // 엑셀 다운로드
      gridView.exportGrid({
        type: 'excel',
        target: 'local',
        fileName: 'gridExport.xlsx', // 저장될 파일 name
        /*
        progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
        showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
        indicator: 'visible', // indidator 영역 표시
        header: 'visible', // 헤더 표시
        footer: 'hidden', // footer 표시하지 않음
        applyDynamicStyles: true,
        compatibility: '2010',
        */

        // allColumns: true, // visible : false 인 행도 표시할 것인지 여부
        done: () => {
          // 내보내기 완료 후 실행되는 함수
          // Message.success('엑셀 다운로드가 완료되었습니다.')
        },
      })
      break
    case 'filter_on': // Column Filter 켜키
      var distinctValues = dataProvider.getDistinctValues(index.column) // 지정된 컬럼의 데이터들을 중복을 제거하고 가져온다.
      var filters = []
      for (var value of distinctValues) {
        // 중복을 제거한 데이터를 넣어준다.
        // name: 사용자에게 보여질 값
        // criteria: 해당 필터 선택시 필터 조건
        filters.push({ name: value, criteria: "value = '" + value + "'" })
      }
      gridView.setColumnFilters(index.column, filters) // 선택된 컬럼에 필터 셋팅
      break
    case 'filter_off': // Column Filter 끄기
      gridView.clearColumnFilters(index.column) // 해당 컬럼의 필터 설정을 해제한다
      break
    }
  }

  gridView.onEditRowChanged = (
    grid,
    itemIndex,
    dataRow,
    field,
    oldValue,
    newValue,
  ) => {
    gridView.setValue(itemIndex, 'is_change', 'Y')
  }

  return {
    getGridView() {
      return gridView
    },
    getDataProvider() {
      return dataProvider
    },
    g() {
      return gridView
    },
    d() {
      return dataProvider
    },
    initGrid(fields, columns) {
      // 추가 필드 값 정의하여 넣는다.
      dataProvider.setFields(fields.concat(appendField))
      gridView.setColumns(columns)
      inited = true

      // validation 처리 정의
      // 기존은 Alert 창으로 출력된다.
      gridView.onValidationFail = function(grid, itemIndex, column, err) {
        // Message.err(err.message)
      }

      // setTimeout(() => {
      //   if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
      //     var evt = document.createEvent('UIEvents')
      //     evt.initUIEvent('resize', true, false, window, 0)
      //     window.dispatchEvent(evt)
      //   } else {
      //     window.dispatchEvent(new Event('resize'))
      //   }
      // }, 1000)
    },

    // Realgrid에 적용하기 전, columns에 팩토리 패턴에서 기본 제공되는 동적 스타일을 적용한다.
    autoSetDynamicStyle(columns) {
      columns.forEach(col => {
        // realgrid 2.0 마이그레이션 작업 후
        col.styleCallback = function(grid, dataCell) {
          let column = dataCell.index.column
          let provider = grid.getDataSource()
          let ret = {}
          if (column.editable === true) {
            ret.styleName = column.styleName ? column.styleName + ' editable_column' : 'editable_column'
          }

          let row = provider.getJsonRow(dataCell.index.dataRow)
          let status = row.recv_status
          let isChange = row.is_change
          let gridRowStatus = provider.getRowState(dataCell.index.dataRow)
          if (status === 'error' && isChange === 'Y') {
            ret.styleName = column.styleName ? column.styleName + ' created_column' : 'created_column'
          } else if (status === 'error' && isChange === 'Y') {
            ret.styleName = column.styleName ? column.styleName + ' updated_column' : 'updated_column'
          } else if (status === 'error') {
            ret.styleName = column.styleName ? column.styleName + ' error_column' : 'error_column'
          } else if (gridRowStatus === 'created') {
            ret.styleName = column.styleName ? column.styleName + ' created_column' : 'created_column'
          } else if (gridRowStatus === 'updated') {
            ret.styleName = column.styleName ? column.styleName + ' updated_column' : 'updated_column'
          }

          //  else if (status === 'success') {
          //   ret.background = colors.background.success
          // }
          return ret
        }
      })
    },

    // Realgrid에 적용하기 전, columns에 팩토리 패턴에서 기본 제공되는 필수 처리 적용한다.
    // header.require 가 true로 셋팅되면 적용되며, Header Text 앞에 *마크가 붙고, Validation으로 필수 입력해야 하는 값이 된다.
    setRequireColumn(columns) {
      columns.forEach(col => {
        // header 영역 중 require 옵션이 있는 경우, 컬럼 해더 텍스트에 * 입력
        if (col.header && col.header.require) {
          // realgrid 2.0 마이그레이션 작업 변경 후
          col.header.text = '* ' + col.header.text

          // 필수 값 처리
          if (!col.validations) col.validations = []
          var compiled = _.template(col.header.text + '은(는) 반드시 입력해야 합니다.')
          col.validations = col.validations.concat([
            {
              criteria: 'value is not empty',
              message: compiled({ header: col.header.text }),
              mode: 'always',
              level: 'error',
            },
          ])
        }
      })
    },

    // 그리드 오브젝트가 만들어진 이후에 사용이 가능하다.
    setValidationColumn(columns) {
      let uniqueCols = columns.filter(col => {
        return col.header && col.header.unique
      })

      gridView.onValidateColumn = function(grid, column, inserting, value) {
        console.log(column)
        let error = {}

        // 고유값 처리
        let targetCol = _.find(uniqueCols, { fieldName: column.fieldName })
        if (targetCol) {
          let gridData = dataProvider.getJsonRows(0, -1)
          let current = gridView.getCurrent()
          for (let i = 0; i < gridData.length; i++) {
            if (i === current.dataRow) continue
            if (value === gridData[i][column.fieldName]) {
              var compiled = _.template('${header}은(는) 고유해야 합니다.')
              error.level = RealGridJS.ValidationLevel.ERROR
              error.message = compiled({ header: targetCol.header.text })
              break
            }
          }
        }

        return error
      }
    },
    getAllData() {
      return dataProvider.getJsonRows(0, -1)
    },
    getGridInitStatData() {
      let gridData = dataProvider.getJsonRows(0, -1)
      gridData.forEach(row => {
        // 초기화
        this.initRow(row)
      })

      return gridData
    },
    setCreatedRowStatus(gridData, row) {
      if (!row || !row.dataRow) return
      let target = gridData[row.dataRow]
      this.initRow(target)
      Object.assign(target, row)
      if (target.ret_code === 'Y') target.recv_status = 'success'
      else target.recv_status = 'error'
    },
    setUpdatedRowStatus(gridData, row) {
      if (!row || !row.dataRow) return
      let target = gridData[row.dataRow]
      this.initRow(target)
      Object.assign(target, row)
      if (target.ret_code === 'Y') target.recv_status = 'success'
      else target.recv_status = 'error'
    },
    restoreGridCreatedDataStatus(row) {
      if (!row || !row.dataRow) return
      if (row.ret_code !== 'Y') dataProvider.setRowState(row.dataRow, 'created')
    },
    restoreGridUpdatedDataStatus(row) {
      if (!row || !row.dataRow) return
      if (row.ret_code !== 'Y') dataProvider.setRowState(row.dataRow, 'updated')
    },
    initRow(row) {
      row.ret_code = ''
      row.ret_msg = ''
      row.recv_status = ''
      row.is_change = ''
    },

    // targetRow위치에 선택된 행의 내용을 복사하여 추가한다.
    copyAndInsertRow(targetRow) {
      if (!targetRow) targetRow = 0

      // 현재 위치 정보 확인
      let currnetTarget = gridView.getCurrent()

      // 데이터 값 가져오기
      let currentJsonRow = _.cloneDeep(
        dataProvider.getJsonRow(currnetTarget.dataRow),
      )
      this.initRow(currentJsonRow)

      // 타겟 위치에 값 넣기
      dataProvider.insertRow(targetRow, currentJsonRow)

      // 이동할 위치 설정
      let idx = {
        column: currnetTarget.column,
        dataRow: targetRow,
      }

      // 이동
      gridView.setCurrent(idx)
    },

    // checkbox에 체크된 항목들을 가져와 삭제 상태로 변경한다.
    deletCheckRow() {
      gridView.commit()
      let rows = gridView.getCheckedRows(true)
      for (let i = 0; i < rows.length; i++) {
        dataProvider.setRowState(rows[i], 'deleted')

        // 체크 내역을 다시 해제한다.
        gridView.checkAll(false)
      }
    },
    fillByJson(data, isCreated) {
      // 덮어씌우기 전에는 기존 진행 작업들은 cancel 처리 한다.
      gridView.cancel()
      dataProvider.fillJsonData(data)
      if (isCreated) {
        this.setAllRowState('created')
      }
    },
    fillByCsv(data, isCreated) {
      // 덮어씌우기 전에는 기존 진행 작업들은 cancel 처리 한다.
      gridView.cancel()
      dataProvider.fillCsvData(data)
      if (isCreated) {
        this.setAllRowState('created')
      }
    },
    getCurrent() {
      return gridView.getCurrent()
    },
    getCurrentDataRow() {
      let currnetTarget = gridView.getCurrent()
      if (currnetTarget.dataRow === -1) return {}
      
      return dataProvider.getJsonRow(currnetTarget.dataRow)
    },

    // 저장을 위하여 created, updated, deleted 각각 상태의 row를 가져와 반영 한다.
    getDataForSave() {
      gridView.commit()
      var gridSaveData = {
        updated: [],
        created: [],
        deleted: [],
      }

      // 각 상태 별 값을 가져온다.
      // RealGrid에서 getStateRows를 통해 각 상태별 dataprovier 내 index 정보를 가져온다.
      var updatedRows = dataProvider.getStateRows('updated')
      var createdRows = dataProvider.getStateRows('created')
      var deletedRows = dataProvider.getStateRows('deleted')

      // index 정보를 기준으로 각 실제 값을 가져온다.
      updatedRows.forEach((row, idx) => {
        let u = dataProvider.getJsonRow(row)
        u.dataRow = row
        gridSaveData.updated.push(u)
      })
      createdRows.forEach((row, idx) => {
        let c = dataProvider.getJsonRow(row)
        c.dataRow = row
        gridSaveData.created.push(c)
      })
      deletedRows.forEach((row, idx) => {
        let d = dataProvider.getJsonRow(row)
        d.dataRow = row
        gridSaveData.deleted.push(d)
      })

      return gridSaveData
    },
    setAllRowState(state) {
      gridView.commit()
      let count = dataProvider.getRowCount()
      for (let i = 0; i < count; i++) {
        dataProvider.setRowState(i, state)
      }
    },
    eventSetter(e, func) {
      gridView[e] = func
    },
    gInvoke(func, ...params) {
      return gridView[func](...params)
    },
    dInvoke(func, ...params) {
      return dataProvider[func](...params)
    },
    excelDown(fileName) {
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
        allColumns: true, // visible : false 인 행도 표시할 것인지 여부
        done: () => {
          // 내보내기 완료 후 실행되는 함수
          // Message.success('엑셀 다운로드가 완료되었습니다.')
        },
      })
    },
    destroy() {
      // 데이터 초기화
      dataProvider.clearRows()

      // grid, provider 초기화
      gridView.destroy()
      dataProvider.destroy()

      // LocalDataProvider와 GridView 객체 초기화
      gridView = null
      dataProvider = null
    },
  }
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

      },
      dataDrop: {

      },
      display: {
        // 그리드 너비에 맞춰 컬럼 너비 자동 조정
        fitStyle: 'even',
        rowHeight: 35,
        emptyMessage: 'No Data',
      },
      edit: {
        appendable: true,
        insertable: true,
        deletable: true,
      },
      filtering: {

      },
      fixed: {

      },
      footer: {

      },
      footers: {

      },
      format: {

      },
      header: {
        height: 35,
      },
      headerSummaries: {

      },
      headerSummary: {

      },
      hideDeletedRows: {

      },
      pasted: {

      },
      rowIndicator: {
        width: 50,
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

export default RealgridFactory
