<!-- 
  화면명 : 작업환경측정 예비조사
  화면개요 : 예비조사
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import MsdsPopup from '@/pages/100_health/HLT_F/HLTFB0010Popup01.vue'
import WorkPopup from '@/pages/100_health/HLT_F/HLTFB0010Popup02.vue'

defineOptions({
  name: '100_health-HLT_F-HLTFB0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

// 첨부파일 버튼 리스트
const buttonList = ref(['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose'])
// 파일 ReadOnly 여부
const fileReadOnly = ref(false)

const isAdmin = ref(0)
const deptPopup = ref(null)
const fileUploadPopup = ref(null)
const msdsPopup = ref(null)
const workPopup = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const selectedRow = ref(null)
const selectedCol = ref(null)
const fileTitle = ref('')
const deptList = ref([]) // 한 부서 담당자가 담당하고 있는 부서들.(여러개일수도있다.)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: Number(dayjs().get('month')) > 6 ? 'LO' : 'HI',
  YEAR: String(dayjs().get('year')),
  REG_DIV: 'A',
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  ORGN_DIV: '',
})

const codeList = reactive({
  YEAR: [],
  HALF_DIV: [],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  BSNS_CD: [],
  DEPT_CD: [],
  ORGN_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '협력사' },
  ],
})

// 어드민 설정
const setAdmin = () => {
  // 보건관리자여부 확인
  // 0: 일반 사용자, 1: 부서보건담당자, 2. 보건관리팀담당자
  if (
    useLogsStore().isMenuAdmin === 'Y' ||
    userStore.authGrpCd.includes('HLTF001') ||
    userStore.authGrpCd.includes('HIWAYGRP00001') ||
    userStore.authGrpCd.includes('GRP00372')
  ) {
    isAdmin.value = 2
  } else {
    commonSearchApi({
      queryId: 'HLTFA0040_SEARCH_02',
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        EMP_NO: userStore.userId,
        YEAR: searchParams.YEAR,
      },
    }).then((res) => {
      deptList.value = []
      if (res.ORESULT_CUR.length > 0) {
        isAdmin.value = 1
        deptList.value = res.ORESULT_CUR.map((item) => item.DEPT_CD)
      } else {
        isAdmin.value = 0
      }
    })
  }
}

/*  공통코드 세팅 */
onMounted(() => {
  setAdmin()

  codeList.YEAR = []
  for (var i = dayjs().get('year') + 1; i >= dayjs().get('year') - 10; i--) {
    codeList.YEAR.push({ COD: String(i), TXT: String(i) })
  }
  grdMain.value.getGridView().filterPanel.visible = true

  Promise.all([
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV } }),
    // 부서
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_DEPT', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y' } }),
    // 상하반기
    getCodeList('HHII800'),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.HALF_DIV = res[2].ORESULT_CUR
    grdMain.value.setBindingColumn('BSNS_NM', codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_NM', codeList.DEPT_CD, 'DEPT_CD', 'DEPT_NM')
    grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
  })
  grdMain.value.setBindingColumn('REG_DIV', codeList.REG_DIV, 'COD', 'TXT')
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true }, header: { height: 75 } },
  keys: [],
  fields: [
    {
      fieldName: 'BSNS_NM',
      width: '60',
      editable: false,
      dataType: 'text',
      styleName: 'left-column',
      header: { text: t('사업부') },
      editor: { type: 'dropdown' },
      lookupDisplay: true,
    },
    {
      fieldName: 'DEPT_NM',
      width: '80',
      editable: false,
      dataType: 'text',
      styleName: 'left-column',
      header: { text: t('부서명') },
      editor: { type: 'dropdown' },
      lookupDisplay: true,
    },
    { fieldName: 'DEPT_CD', width: '40', editable: false, dataType: 'text', header: { text: t('부서코드') } },
    {
      fieldName: 'PRE_SUR_DATE',
      width: '60',
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('예비조사일') },
    },
    {
      fieldName: 'SCH_CHK_DATE',
      width: '60',
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('측정예정일') },
    },
    {
      fieldName: 'PRC_STATUS',
      width: '40',
      editable: false,
      dataType: 'text',
      header: { text: t('진행상태') },
      styleCallback: function (grid, dataCell) {
        if (grid.getValue(dataCell.index.itemIndex, 'FIX_DIV') == 'Y') {
          grid.setValue(dataCell.index.itemIndex, 'PRC_STATUS', '완료')
        } else if (
          grid.getValue(dataCell.index.itemIndex, 'FIX_DIV') == 'N' &&
          grid.getValue(dataCell.index.itemIndex, 'SUB_DIV') == 'Y'
        ) {
          grid.setValue(dataCell.index.itemIndex, 'PRC_STATUS', '제출')
        } else {
          grid.setValue(dataCell.index.itemIndex, 'PRC_STATUS', '진행중')
        }
      },
    },
    {
      fieldName: 'WORK_CNT',
      width: '60',
      editable: false,
      styleName: 'editable_column',
      dataType: 'text',
      header: { text: t('단기공사현황\n(최근 7일)'), styleName: 'multiline-editor-pre' },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          var str = `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <button
              class="v-btn"
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >상세</button>
          </div>`
          return str
        },
      },
    },
    {
      fieldName: 'ORGN_FILE_DSC',
      width: '60',
      editable: false,
      styleName: 'editable_column',
      dataType: 'text',
      header: { text: t('조직도 및\n레이아웃'), styleName: 'multiline-editor-pre' },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          var str = `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <button
              class="v-btn"
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >첨부</button>
          </div>`
          return str
        },
      },
    },
    {
      fieldName: 'PERS_FILE_DSC',
      width: '60',
      editable: false,
      styleName: 'editable_column',
      dataType: 'text',
      header: { text: t('공정별\n인원 현황'), styleName: 'multiline-editor-pre' },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          var str = `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <button
              class="v-btn"
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >첨부</button>
          </div>`
          return str
        },
      },
    },
    {
      fieldName: 'MSDS_CNT',
      width: '60',
      editable: false,
      styleName: 'editable_column',
      dataType: 'text',
      header: { text: t('화학물질\n현황'), styleName: 'multiline-editor-pre' },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          var str = `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <button
              class="v-btn"
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >상세</button>
          </div>`
          return str
        },
      },
    },
    {
      fieldName: 'SUB_DIV_DSC',
      width: '80',
      editable: false,
      styleName: 'editable_column',
      dataType: 'text',
      header: { text: t('제출처리') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          let isFIX = false // 보건관리팀 확인 여부
          let isSUB = false // 체출처리 여부
          // 보건관리팀 확인 완료시 -> 제출처리 모든 버튼 비활성화
          if (grid.getValue(cell.index.itemIndex, 'FIX_DIV') == 'Y') isFIX = true
          // 제출완료시 -> 제출버튼 비활성화
          // 미제출시 -> 취소버튼 비활성화
          if (grid.getValue(cell.index.itemIndex, 'SUB_DIV') == 'Y') isSUB = true

          var str = `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <div>
              <button
                class="v-btn"
                id="submit"
                style="color: #fff; background: ${isFIX || isSUB ? '#e8e7ea' : '#1a40c7'}; padding: 4px;"
                ${isFIX || isSUB ? 'disabled' : ''}
              >제출</button>
              <button
                class="v-btn"
                id="cancel"
                style="color: #fff; background: ${isFIX || !isSUB ? '#e8e7ea' : '#1a40c7'}; padding: 4px;"
                ${isFIX || !isSUB ? 'disabled' : ''}
              >취소</button>
            </div>
          </div>`
          return str
        },
      },
    },
    {
      fieldName: 'SUB_DATE',
      width: '60',
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('제출일자') },
    },
    { fieldName: 'SUB_USER_NM', width: '40', editable: false, dataType: 'text', header: { text: t('제출자') } },
    {
      fieldName: 'FIX_DIV_DSC',
      width: '80',
      editable: false,
      styleName: 'editable_column',
      dataType: 'text',
      header: { text: t('보건관리팀 확인') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          let isFIX = false // 보건관리팀 확인 여부
          let isSUB = false // 체출처리 여부
          // 보건관리팀 확인 완료 -> 확인버튼 비활성화
          // 보건관리팀 확인 전 -> 취소버튼 비활성화
          if (grid.getValue(cell.index.itemIndex, 'FIX_DIV') == 'Y') isFIX = true
          // 미제출시 -> 보건관리팀 확인 모든 버튼 비활성화
          if (grid.getValue(cell.index.itemIndex, 'SUB_DIV') == 'Y') isSUB = true

          var str = `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <div>
              <button
                class="v-btn"
                id="checkButton"
                style="color: #fff; background: ${!isSUB || isFIX ? '#e8e7ea' : '#1a40c7'}; padding: 4px;"
                ${!isSUB || isFIX ? 'disabled' : ''}
              >확인</button>
              <button
                class="v-btn"
                id="cancel"
                style="color: #fff; background: ${!isSUB || !isFIX ? '#e8e7ea' : '#1a40c7'}; padding: 4px;"
                ${!isSUB || !isFIX ? 'disabled' : ''}
              >취소</button>
            </div>
          </div>`
          return str
        },
      },
    },
    {
      fieldName: 'FIX_DATE',
      width: '60',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      header: { text: t('확인일자') },
    },
    { fieldName: 'FIX_USER_NM', width: '40', editable: false, dataType: 'text', header: { text: t('확인자') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부명') }, visible: false },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') }, visible: false },
    { fieldName: 'REG_DIV', dataType: 'text', header: { text: t('구분') }, visible: false },
    { fieldName: 'ORGN_FILE_YN', dataType: 'text', header: { text: t('조직도 첨부여부') }, visible: false },
    { fieldName: 'ORGN_FILEID', dataType: 'text', header: { text: t('조직도 첨부파일ID') }, visible: false },
    { fieldName: 'PERS_FILEID', dataType: 'text', header: { text: t('공정별 인원현황 첨부파일ID') }, visible: false },
    { fieldName: 'PERS_FILE_YN', dataType: 'text', header: { text: t('공정별 인원현황 첨부여부') }, visible: false },
    { fieldName: 'SUB_DIV', dataType: 'text', header: { text: t('제출여부') }, visible: false },
    { fieldName: 'FIX_DIV', dataType: 'text', header: { text: t('확인여부') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
  ],
  columnLayout: [
    'BSNS_NM',
    'DEPT_NM',
    'DEPT_CD',
    'PRE_SUR_DATE',
    'SCH_CHK_DATE',
    'PRC_STATUS',
    'WORK_CNT',
    {
      name: '예비조사 자료 등록',
      direction: 'horizontal',
      items: ['ORGN_FILE_DSC', 'PERS_FILE_DSC', 'MSDS_CNT'],
      header: { text: t('예비조사 자료 등록') },
    },
    'SUB_DIV_DSC',
    'SUB_DATE',
    'SUB_USER_NM',
    'FIX_DIV_DSC',
    'FIX_DATE',
    'FIX_USER_NM',
  ],
  columns: [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnUpdate') {
    if (isAdmin.value != 2) {
      return Message.warn(t('보건관리자만 사용할 수 있습니다.'))
    }
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnAllDownload') {
    if (grdMain.value.getGridView().getCheckedRows(true).length === 0) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    }
    vm.$swal({
      title: t('일괄 다운로드 하시겠습니까?'),
      showCancelButton: true,
    }).then((swalRes) => {
      if (swalRes.isConfirmed === true) {
        allDownload()
      }
    })
  }
}

// 일괄다운로드
const allDownload = async () => {
  let fileIdList = []
  for (let row of grdMain.value.getGridView().getCheckedRows(true)) {
    let data = grdMain.value.getDataProvider().getJsonRow(row)
    await Promise.all([
      commonSearchApi({
        queryId: 'searchFile',
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, FILE_ID: data.ORGN_FILEID },
      }),
      commonSearchApi({
        queryId: 'searchFile',
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, FILE_ID: data.PERS_FILEID },
      }),
      commonSearchApi({ queryId: 'HLTFB0010_SEARCH_02', param: data }),
    ]).then((res) => {
      for (var id of res[0].ORESULT_CUR) {
        fileIdList.push(id)
      }
      for (var id of res[1].ORESULT_CUR) {
        fileIdList.push(id)
      }
      for (var id of res[2].ORESULT_CUR) {
        var idMap = {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          FILE_ID: id.MSDS_FILEID,
          ...id,
        }
        fileIdList.push(idMap)
      }
    })

    await msdsPopup.value.exportGrid(data)
  }

  if (isEmpty(fileIdList)) {
    return Message.warn(t('일괄다운로드 할 파일이 존재하지 않습니다.'))
  }

  for (var fileId of fileIdList) {
    if (isEmpty(fileId.FILE_ID)) {
      Message.warn(t('자재번호 [' + fileId.MATNO + ']에 대한 첨부파일이 누락되었습니다. 확인 바랍니다. '))
      continue
    }
    try {
      await downloadFile(fileId)
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (err) {
      //console.error(err)
    }
  }
}

// 파일 다운로드
const downloadFile = async (data) => {
  try {
    const res = await commonDownloadFilesApi(data)
    //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
    const file = res.contentDisposition.split('fileName="')
    const blob = new Blob([res])
    const link = document.createElement('a')

    link.href = URL.createObjectURL(blob)

    //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
    // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
    link.download = await decodeURI(file[1].replace('";', ''))
    await link.click()
    await URL.revokeObjectURL(link.href)
  } catch (e) {
    // console.log('e', e)
  }
}

// 그리드 데이터 조회
const getData = () => {
  new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).showMessage(true).run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTFB0010_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if (checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수 입력 사항입니다.'))
    } else if (isEmpty(data.HALF_DIV)) {
      return Message.warn(t('반기는 필수 입력 사항입니다.'))
    } else if (isEmpty(data.REG_DIV)) {
      return Message.warn(t('구분은 필수 입력 사항입니다.'))
    } else if (isEmpty(data.BSNS_CD)) {
      return Message.warn(t('사업부는 필수 입력 사항입니다.'))
    } else if (isEmpty(data.DEPT_CD)) {
      return Message.warn(t('부서는 필수 입력 사항입니다.'))
    } else if (data.SUB_DIV == 'Y') {
      return Message.warn(t('제출완료되어 저장할 수 없습니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.SUB_DATE = parsingDate(data.SUB_DATE)
    data.FIX_DATE = parsingDate(data.FIX_DATE)

    saveParams.push(data)
  }
  return commonExecuteApi({ queryId: 'HLTFB0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

// 날짜파싱 ('2024-01-01' >> '20240101')
const parsingDate = (date) => {
  if (date == null) return ''
  var year = date.getFullYear()
  var month = ('0' + (date.getMonth() + 1)).slice(-2) // 월은 0부터 시작하므로 1을 더하고, 두 자리로 표현하기 위해 slice 사용
  var day = ('0' + date.getDate()).slice(-2) // 일도 두 자리로 표현하기 위해 slice 사용

  return '' + year + month + day
}

//팝업 선택 이벤트
const onDeptSelected = (val) => {
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
  onButtonsClick({ id: 'btnSearch' })
}

const openDeptcdPopup = () => {
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY: 'Y', ASGN_NM: searchParams.DEPT_NM })
}

const clearDeptcd = () => {
  searchParams.DEPT_CD = ''
  searchParams.DEPT_NM = ''
  onButtonsClick({ id: 'btnSearch' })
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if (col.target.className === 'v-btn' && col.column === 'ORGN_FILE_DSC') {
    if (isAdmin.value == 0) {
      return Message.warn(t('부서 보건담당자가 아닙니다. 보건관리팀 담당자에게 문의하세요.'))
    } else if (data.FIX_DIV == 'Y' && isAdmin.value != 2) {
      return Message.warn(t('보건관리팀 확인인 경우 첨부가 불가합니다.'))
    } else if (isAdmin.value == 1 && !deptList.value.includes(data.DEPT_CD)) {
      return Message.warn('부서 보건 담당자는 담당부서만 가능합니다.')
    }
    selectedRow.value = index.dataRow
    selectedCol.value = 'ORGN_FILE_DSC'
    fileTitle.value = '조직도 및 레이아웃 파일첨부'
    // 제출완료시 파일 수정불가
    if (data.SUB_DIV === 'Y') {
      buttonList.value = ['btnDownLoad', 'btnClose']
      fileReadOnly.value = true
    } else {
      buttonList.value = ['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose']
      fileReadOnly.value = false
    }
    fileUploadPopup.value.openPopup(data.ORGN_FILEID)
  } else if (col.target.className === 'v-btn' && col.column === 'PERS_FILE_DSC') {
    if (isAdmin.value == 0) {
      return Message.warn(t('부서 보건담당자가 아닙니다. 보건관리팀 담당자에게 문의하세요.'))
    } else if (data.FIX_DIV == 'Y' && isAdmin.value != 2) {
      return Message.warn(t('보건관리팀 확인인 경우 첨부가 불가합니다.'))
    } else if (isAdmin.value == 1 && !deptList.value.includes(data.DEPT_CD)) {
      return Message.warn('부서 보건 담당자는 담당부서만 가능합니다.')
    }
    selectedRow.value = index.dataRow
    selectedCol.value = 'PERS_FILE_DSC'
    fileTitle.value = '공정별 인원 현황 파일첨부'
    // 제출완료시 파일 수정불가
    if (data.SUB_DIV === 'Y') {
      buttonList.value = ['btnDownLoad', 'btnClose']
      fileReadOnly.value = true
    } else {
      buttonList.value = ['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose']
      fileReadOnly.value = false
    }
    fileUploadPopup.value.openPopup(data.PERS_FILEID)
  } else if (col.target.className === 'v-btn' && col.column === 'MSDS_CNT') {
    if (isAdmin.value == 0) {
      return Message.warn(t('부서 보건담당자가 아닙니다. 보건관리팀 담당자에게 문의하세요.'))
    } else if (data.FIX_DIV == 'Y' && isAdmin.value != 2) {
      return Message.warn(t('보건관리팀 확인인 경우 상세조회가 불가합니다.'))
    } else if (isAdmin.value == 1 && !deptList.value.includes(data.DEPT_CD)) {
      return Message.warn('부서 보건 담당자는 담당부서만 가능합니다.')
    }
    msdsPopup.value.openPopup(data)
  } else if (col.target.className === 'v-btn' && col.column === 'WORK_CNT') {
    workPopup.value.openPopup(data)
  } else if (col.target.className === 'v-btn' && col.column === 'SUB_DIV_DSC') {
    // 관리자 아닐 시 return
    if (isAdmin.value == 0) {
      Message.warn(t('부서 보건담당자가 아닙니다. 보건관리팀 담당자에게 문의하세요.'))
      return
    }
    // 이미 보건담당자 확인된 경우에는 return
    if (data.FIX_DIV == 'Y') return
    if (isAdmin.value == 1 && !deptList.value.includes(data.DEPT_CD)) {
      return Message.warn('부서 보건 담당자는 담당부서만 가능합니다.')
    }

    if (col.target.id === 'submit') {
      // 제출
      // 이미 제출 상태이면 return
      if (data.SUB_DIV == 'Y') return
      data.SUB_DIV = 'Y'
      data.SUB_DATE = dayjs().format('YYYYMMDD')
      data.SUB_USER_ID = userStore.empNo
    } else if (col.target.id === 'cancel') {
      //취소
      // 이미 미제출 상태이면 return
      if (data.SUB_DIV != 'Y') return
      data.SUB_DIV = 'N'
      data.SUB_DATE = ''
      data.SUB_USER_ID = ''
    }
    Promise.all([commonSearchApi({ queryId: 'HLTFB0010_SAVE_04', param: data })]).then((res) => {
      if (res[0].OUT_RES_MSG == 'Y') {
        grdMain.value.getGridView().setValue(index.dataRow, 'SUB_DIV_DSC', '제출')
        grdMain.value.getGridView().setValue(index.dataRow, 'SUB_DATE', dayjs().format('YYYY-MM-DD'))
        grdMain.value.getGridView().setValue(index.dataRow, 'SUB_USER_NM', userStore.empNm)
        grdMain.value.getGridView().setValue(index.dataRow, 'SUB_DIV', 'Y')
      } else {
        grdMain.value.getGridView().setValue(index.dataRow, 'SUB_DIV_DSC', '미제출')
        grdMain.value.getGridView().setValue(index.dataRow, 'SUB_DATE', '')
        grdMain.value.getGridView().setValue(index.dataRow, 'SUB_USER_NM', '')
        grdMain.value.getGridView().setValue(index.dataRow, 'SUB_DIV', 'N')
      }
    })
  } else if (col.target.className === 'v-btn' && col.column === 'FIX_DIV_DSC') {
    // 관리자 아닐 시 return
    if (isAdmin.value != 2) {
      Message.warn(t('보건관리팀이 아닙니다. 보건관리팀 담당자에게 문의하세요.'))
      return
    }

    // 이미 보건담당자 확인된 경우에는 return
    if (data.SUB_DIV != 'Y') {
      Message.warn(t('미제출 상태입니다.'))
      return
    }

    if (col.target.id === 'checkButton') {
      // 확인
      // 이미 확인 상태이면 return
      if (data.FIX_DIV == 'Y') return
      data.FIX_DIV = 'Y'
      data.FIX_DATE = dayjs().format('YYYYMMDD')
      data.FIX_USER_ID = userStore.empNo
    } else if (col.target.id === 'cancel') {
      // 취소
      // 이미 취소 상태이면 return
      if (data.FIX_DIV != 'Y') return
      data.FIX_DIV = 'N'
      data.FIX_DATE = ''
      data.FIX_USER_ID = ''
    }
    Promise.all([commonSearchApi({ queryId: 'HLTFB0010_SAVE_05', param: data })]).then((res) => {
      if (res[0].OUT_RES_MSG == 'Y') {
        grdMain.value.getGridView().setValue(index.dataRow, 'FIX_DIV_DSC', '확인')
        grdMain.value.getGridView().setValue(index.dataRow, 'FIX_DATE', dayjs().format('YYYY-MM-DD'))
        grdMain.value.getGridView().setValue(index.dataRow, 'FIX_USER_NM', userStore.empNm)
        grdMain.value.getGridView().setValue(index.dataRow, 'FIX_DIV', 'Y')
      } else {
        grdMain.value.getGridView().setValue(index.dataRow, 'FIX_DIV_DSC', '미확인')
        grdMain.value.getGridView().setValue(index.dataRow, 'FIX_DATE', '')
        grdMain.value.getGridView().setValue(index.dataRow, 'FIX_USER_NM', '')
        grdMain.value.getGridView().setValue(index.dataRow, 'FIX_DIV', 'N')
      }
    })
  }
}

// 파일 업로드 이벤트
const uploaded = (val) => {
  if (val.fileId == null) return

  Promise.all([
    commonSearchApi({ queryId: 'DATCA0070_SEARCH_03', param: { CMPNY_DIV: userStore.cmpnyDiv, FILE_ID: val.fileId } }),
  ]).then((res) => {
    if (selectedCol.value == 'ORGN_FILE_DSC') {
      // 조직도 및 레이아웃
      if (res[0].ORESULT_CUR[0].CNT_FILE > 0) {
        grdMain.value.getDataProvider().setValue(selectedRow.value, 'ORGN_FILE_DSC', '등록')
      } else {
        grdMain.value.getDataProvider().setValue(selectedRow.value, 'ORGN_FILE_DSC', '미등록')
      }
      grdMain.value.getDataProvider().setValue(selectedRow.value, 'ORGN_FILEID', val.fileId)
    } else if (selectedCol.value == 'PERS_FILE_DSC') {
      // 공정별 인원현황
      if (res[0].ORESULT_CUR[0].CNT_FILE > 0) {
        grdMain.value.getDataProvider().setValue(selectedRow.value, 'PERS_FILE_DSC', '등록')
      } else {
        grdMain.value.getDataProvider().setValue(selectedRow.value, 'PERS_FILE_DSC', '미등록')
      }
      grdMain.value.getDataProvider().setValue(selectedRow.value, 'PERS_FILEID', val.fileId)
    }
    let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)

    // 파일아이디를 저장합니다.
    commonExecuteApi({ queryId: 'HLTFB0010_SAVE_01', list: [data] })
  })
}

watch(
  () => searchParams.YEAR,
  (newValue, oldValue) => {
    setAdmin()
    getData()
  }
)

watch(
  () => searchParams.HALF_DIV,
  (newValue, oldValue) => {
    getData()
  }
)

watch(
  () => searchParams.REG_DIV,
  (newValue, oldValue) => {
    getData()
  }
)

watch(
  () => searchParams.ORGN_DIV,
  (newValue, oldValue) => {
    getData()
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnAllDownload']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('해당년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT"
            width="200px"
          />
          <i-select
            v-model="searchParams.HALF_DIV"
            :label="$t('반기구분')"
            label-width="50px"
            :items="codeList.HALF_DIV"
            item-value="COD"
            item-title="TXT"
            width="200px"
          />
          <i-select
            v-model="searchParams.REG_DIV"
            :label="$t('구분')"
            label-width="50px"
            :items="codeList.REG_DIV"
            item-value="COD"
            item-title="TXT"
            width="200px"
          />
          <i-input
            v-model="searchParams.DEPT_CD"
            label-width="50px"
            :label="$t('부서')"
            width="180px"
            :readonly="true"
          />
          <i-input
            v-model="searchParams.DEPT_NM"
            width="150px"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openDeptcdPopup"
            @keydown.enter="openDeptcdPopup"
          >
            <template #append-inner>
              <v-icon icon="mdi-window-close" @click="clearDeptcd" />
            </template>
          </i-input>
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('예비조사자료 목록')" />
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys"
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
    <IUploadPopup
      ref="fileUploadPopup"
      :gridTitle="fileTitle"
      @uploaded="uploaded"
      :buttonList="buttonList"
      :readOnly="fileReadOnly"
    />
    <MsdsPopup ref="msdsPopup" @after-search="getData" />
    <WorkPopup ref="workPopup" />
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
