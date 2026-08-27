<!-- 
  화면명 : 부서화학물질관리
  화면개요 : 부서별 MSDS 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import PdfView from '@/pages/99_indexPopUp/PdfViewPopup.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from '@/components/ILabel.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from '@/utils/excel'
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import HLTDA0020Popup01 from '@/pages/100_health/HLT_D/HLTDA0020Popup01.vue'
import HLTDA0020Popup02 from '@/pages/100_health/HLT_D/HLTDA0020Popup02.vue'
import HLTDA0020Popup03 from '@/pages/100_health/HLT_D/HLTDA0020Popup03.vue'

defineOptions({
  name: '100_health-HLT_D-HLTDA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const isAdmin = ref(0)
const RIGHT = ref(null)

const menuTitle = ref(null)
const gridTitleM = ref(null)
const gridTitleL = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const deptPopup = ref(null)
const hltda0020Popup01 = ref(null) // 화학물질 상세 팝업
const hltda0020Popup02 = ref(null) // 경고표지 작성
const hltda0020Popup03 = ref(null) // 사용팀 관리
const pdfPopup = ref(null)
const exPanVal = ref(0)
const mainData = ref(null)
const tooltipText = ref(
  '해당 화학제품은 부서 화학제품 현황에 신규로 등록되었거나, 30일 이내에 MSDS 개정이 이루어졌으므로\n해당 제품 취급자를 대상으로 MSDS교육을 실시하고,\n취급장소에 MSDS를 게시 해 주시기 바랍니다.'
)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  GUBN: '',
  GUBN_NM: '',
  SYN: 'N',
  SDATE: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  EDATE: dayjs().format('YYYY-MM-DD'),
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  STOP_USE_DT: '',
})

const butten = reactive({
  buttenOpenYN: 'Y',
})

const codeList = reactive({
  GUBN: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '자재번호' },
    { COD: 'B', TXT: 'MSDS명' },
    { COD: 'C', TXT: '제품명' },
    { COD: 'D', TXT: '납품업체' },
  ],
  TEAM_CD: [],
  STATUS: [
    { COD: 'A', TXT: '교육대기' },
    { COD: 'B', TXT: '교육완료' },
    { COD: 'C', TXT: '대상제외' },
  ],
})

/*  공통코드 세팅 */
onMounted(async () => {
  // admin 부여

  await Promise.all([
    commonSearchApi({ queryId: 'HLTDA0020_SEARCH_TEAM', param: { CMPNY_DIV: userStore.cmpnyDiv } }),
    commonSearchApi({
      queryId: 'HLTDA0020_SEARCH_RIGHT',
      param: { CMPNY_DIV: userStore.cmpnyDiv, EMP_NO: userStore.userId },
    }), //권한
  ]).then((res) => {
    codeList.TEAM_CD = res[0].ORESULT_CUR
    grdSub.value.setBindingColumn('TEAM_CD', codeList.TEAM_CD, 'TEAM_CD', 'ASGN_SHRT_NM')
    grdSub.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')

    // 부서별 담당자 등록/관리에서 등록된 계정이면 부서담당자
    if (!isEmpty(res[1].ORESULT_CUR[0])) {
      isAdmin.value = 1
    }
  })

  // 메뉴담당자 (최고 권한)
  // 화학물질관리자 : HLTD001, 보건총괄: GRP00372, HSE추진자: GRP00392
  if (
    useLogsStore().isMenuAdmin === 'Y' ||
    userStore.authGrpCd.includes('HLTD001') ||
    userStore.authGrpCd.includes('GRP00372')
    //userStore.authGrpCd.includes('GRP00392')    
  ) {
    isAdmin.value = 2
  }

  menuTitle.value.setBtnProperty('btnMSDSCollapse', 'visible', false)

  onButtonsClick({ id: 'btnSearch' })

  grdSub.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true } },
  keys: [],
  fields: [
    { fieldName: 'MATNO', width: '100', dataType: 'text', editable: false, header: { text: t('자재번호') } },
    {
      fieldName: 'MATDSC',
      width: '120',
      editable: false,
      styleName: 'left-column',
      dataType: 'text',
      header: { text: t('제품명') },
    },
    {
      fieldName: 'VNDNME',
      width: '120',
      editable: false,
      styleName: 'left-column',
      dataType: 'text',
      header: { text: t('납품사') },
    },
    { fieldName: 'REVNO_DT', width: '80', editable: false, dataType: 'text', header: { text: t('개정일자') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAUPBU', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사코드') }, visible: false },
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('등록ID') }, visible: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('변경ID') }, visible: false },
  ],
  columns: [],
})

const grd2Props = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true } },
  keys: [],
  fields: [
    {
      fieldName: 'MATNO',
      width: '80',
      dataType: 'text',
      editable: false,
      header: { text: t('자재번호') },
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      styleCallback: function (grid, dataCell) {
        var ret = { style: { color: '#000000' } }
        if (grid.getValue(dataCell.index.itemIndex, 'DIVISION') == 'B') {
          ret.style.color = '#0000FF'
        } else {
          ret.style.color = '#000000'
        }
        return ret
      },
    },
    {
      fieldName: 'MATDSC',
      width: '150',
      editable: false,
      dataType: 'text',
      styleName: 'left-column',
      header: { text: t('제품명') },
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      styleCallback: function (grid, dataCell) {
        var ret = { style: { background: undefined, color: '#000000' } }
        let insertDate = dayjs(grid.getValue(dataCell.index.itemIndex, 'INSERT_DATE'))
        let revnoDt = dayjs(grid.getValue(dataCell.index.itemIndex, 'REVNO_DT'))
        if (
          dayjs().diff(insertDate, 'day') < 30 ||
          dayjs().diff(revnoDt, 'day') < 30 ||
          grid.getValue(dataCell.index.itemIndex, 'TEAM_CD').trim() == '미지정' ||
          grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'A'
        ) {
          ret.style.background = '#FF8888'
        } else {
          ret.style.background = '#FFFFFF'
        }

        return ret
      },
    },
    {
      fieldName: 'MSDS_NM',
      width: '150',
      editable: false,
      dataType: 'text',
      styleName: 'left-column',
      header: { text: t('MSDS명') },
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      styleCallback: function (grid, dataCell) {
        var ret = { style: { background: undefined } }
        let insertDate = dayjs(grid.getValue(dataCell.index.itemIndex, 'INSERT_DATE'))
        let revnoDt = dayjs(grid.getValue(dataCell.index.itemIndex, 'REVNO_DT'))
        if (
          dayjs().diff(insertDate, 'day') < 30 ||
          dayjs().diff(revnoDt, 'day') < 30 ||
          grid.getValue(dataCell.index.itemIndex, 'TEAM_CD').trim() == '미지정' ||
          grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'A'
        ) {
          ret.style.background = '#FF8888'
        } else {
          ret.style.background = '#FFFFFF'
        }
        return ret
      },
    },
    {
      fieldName: 'TYPE_ID',
      width: '80',
      editable: false,
      dataType: 'text',
      styleName: 'left-column',
      header: { text: t('TYPE') },
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          var btnColor = '#1a40c7'
          if (isEmpty(grid.getValue(cell.index.itemIndex, 'MSDS_FILEID'))) {
            btnColor = '#FF0000'
          }
          var str = `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value}</div>
            <button 
              class="v-btn" 
              style="color: #fff; background: ${btnColor}; padding: 4px;"
            >MSDS</button>
          </div>`
          return str
        },
      },
    },
    {
      fieldName: 'TEAM_CD',
      width: '80',
      editable: false,
      dataType: 'text',
      header: { text: t('사용팀') },
      editor: { type: 'dropdown' },
      lookupDisplay: true,
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      styleCallback: function (grid, dataCell) {
        var ret = { style: { background: undefined } }
        if (grid.getValue(dataCell.index.itemIndex, 'TEAM_CD').trim() == '미지정') {
          ret.style.color = '#FF8888'
        } else {
          ret.style.color = '#000000'
        }
        return ret
      },
    },
    {
      fieldName: 'VNDNME',
      width: '120',
      editable: false,
      dataType: 'text',
      styleName: 'left-column',
      header: { text: t('납품사') },
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      styleCallback: function (grid, dataCell) {
        var ret = { style: { background: undefined } }
        let insertDate = dayjs(grid.getValue(dataCell.index.itemIndex, 'INSERT_DATE'))
        let revnoDt = dayjs(grid.getValue(dataCell.index.itemIndex, 'REVNO_DT'))
        if (
          dayjs().diff(insertDate, 'day') < 30 ||
          dayjs().diff(revnoDt, 'day') < 30 ||
          grid.getValue(dataCell.index.itemIndex, 'TEAM_CD').trim() == '미지정' ||
          grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'A'
        ) {
          ret.style.background = '#FF8888'
        } else {
          ret.style.background = '#FFFFFF'
        }
        return ret
      },
    },
    {
      fieldName: 'RECDATE',
      width: '80',
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('입고일자') },
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      styleCallback: function (grid, dataCell) {
        var ret = { style: { background: undefined } }
        let insertDate = dayjs(grid.getValue(dataCell.index.itemIndex, 'INSERT_DATE'))
        let revnoDt = dayjs(grid.getValue(dataCell.index.itemIndex, 'REVNO_DT'))
        if (
          dayjs().diff(insertDate, 'day') < 30 ||
          dayjs().diff(revnoDt, 'day') < 30 ||
          grid.getValue(dataCell.index.itemIndex, 'TEAM_CD').trim() == '미지정' ||
          grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'A'
        ) {
          ret.style.background = '#FF8888'
        } else {
          ret.style.background = '#FFFFFF'
        }
        return ret
      },
    },
    {
      fieldName: 'REVNO_DT',
      width: '80',
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('개정일자') },
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      styleCallback: function (grid, dataCell) {
        var ret = { style: { background: undefined } }
        let insertDate = dayjs(grid.getValue(dataCell.index.itemIndex, 'INSERT_DATE'))
        let revnoDt = dayjs(grid.getValue(dataCell.index.itemIndex, 'REVNO_DT'))
        if (
          dayjs().diff(insertDate, 'day') < 30 ||
          dayjs().diff(revnoDt, 'day') < 30 ||
          grid.getValue(dataCell.index.itemIndex, 'TEAM_CD').trim() == '미지정' ||
          grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'A'
        ) {
          ret.style.background = '#FF8888'
        } else {
          ret.style.background = '#FFFFFF'
        }
        return ret
      },
    },
    {
      fieldName: 'EDT_STUS_NM',
      width: '80',
      editable: false,
      dataType: 'text',
      header: { text: t('경고표지인쇄') },
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      styleCallback: function (grid, dataCell) {
        if (grid.getValue(dataCell.index.itemIndex, 'EDT_STUS') == '9') {
          grid.setValue(dataCell.index.itemIndex, 'EDT_STUS_NM', '인쇄가능')
          return { style: { color: '#00FF00' } }
        } else {
          grid.setValue(dataCell.index.itemIndex, 'EDT_STUS_NM', '작성필요')
          return { style: { color: '#FF0000' } }
        }
      },
    },
    {
      fieldName: 'STOP_USE_DT',
      width: '80',
      editable: false,
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('삭제여부') },
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
    },
    {
      fieldName: 'STATUS',
      width: '80',
      editable: false,
      dataType: 'text',
      header: { text: t('교육상태') },
      lookupDisplay: true,
      mergeRule: { criteria: 'values["MATNO"] + values["MATDSC"] + values["MSDS_NM"] + values["VNDNME"] + value' },
      styleCallback: function (grid, dataCell) {
        var ret = { style: { background: undefined } }
        let insertDate = dayjs(grid.getValue(dataCell.index.itemIndex, 'INSERT_DATE'))
        let revnoDt = dayjs(grid.getValue(dataCell.index.itemIndex, 'REVNO_DT'))
        if (
          dayjs().diff(insertDate, 'day') < 30 ||
          dayjs().diff(revnoDt, 'day') < 30 ||
          grid.getValue(dataCell.index.itemIndex, 'TEAM_CD').trim() == '미지정' ||
          grid.getValue(dataCell.index.itemIndex, 'STATUS') == 'A'
        ) {
          ret.style.background = '#FF8888'
        } else {
          ret.style.background = '#FFFFFF'
        }
        return ret
      },
    },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'SAUPBU', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, visible: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서명') }, visible: false },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사코드') }, visible: false },
    { fieldName: 'EDT_STUS', dataType: 'text', header: { text: t('경고표지인쇄') }, visible: false },
    { fieldName: 'EXPENSE', dataType: 'text', header: { text: t('용도') }, visible: false },
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('DIVISION') }, visible: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('규제정보') }, visible: false },
    { fieldName: 'VND_TEL', dataType: 'text', header: { text: t('담당업체 연락처') }, visible: false },
    { fieldName: 'MSDS_FILEID', dataType: 'text', header: { text: t('MSDS파일') }, visible: false },
    { fieldName: 'EXTINFO', dataType: 'text', header: { text: t('규제정보') }, visible: false },
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('등록ID') }, visible: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('변경ID') }, visible: false },
  ],
  columns: [],
})
grd1Props.columns = grd1Props.fields
grd2Props.columns = grd2Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = (btn) => {
  // 2025.09.30
  // 부서원은 조회만 가능 부서담당자 권한 이상 부터 기능 사용가능
  
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {

    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }

    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    let checkDatas = []
    if (isEmpty(searchParams.DEPT_CD)) {
      return Message.warn(t('부서를 선택해주십시오.'))
    } else if (isEmpty(checkedRows)) {
      return Message.warn(t('MSDS를 선택해 주십시오.'))
    }
    for (let rowIdx of checkedRows) {
      checkDatas.push(grdMain.value.getDataProvider().getJsonRow(rowIdx))
    }
    hltda0020Popup03.value.openPopup(searchParams, checkDatas, grdSub.value.getGridView().getJsonRows(0, -1))
  } else if (btn.id === 'btnDelete') {

    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }

    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid: grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnManageDownload') {

    /* if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    } */

    if (isEmpty(searchParams.DEPT_NM)) {
      return Message.warn(t('부서를 선택해주십시오.'))
    }
    // 엑셀 다운로드
    grdSub.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '부서화학물질관리_화학물질 관리 목록' + '_' + searchParams.DEPT_NM + '.xlsx', // 저장될 파일 name
      documentTitle: {
        //제목
        message: '부서화학물질관리_화학물질 관리 목록' + '_' + searchParams.DEPT_NM,
        visible: true,
        spaceTop: 1,
        spaceBottom: 0,
        height: 80,
        styleName: 'excelTitle',
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: false, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })
  } else if (btn.id === 'btnMsdsAllDownload') {

    /* if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    } */

    if (grdSub.value.getGridView().getCheckedRows(true).length === 0) {
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
  } else if (btn.id === 'btnMSDSExpand') {

    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }

    menuTitle.value.setBtnProperty('btnMSDSExpand', 'visible', false)
    menuTitle.value.setBtnProperty('btnMSDSCollapse', 'visible', true)
    exPanVal.value = 1
  } else if (btn.id === 'btnMSDSCollapse') {

    if(!isAdmin.value > 0) {
      return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
    }

    menuTitle.value.setBtnProperty('btnMSDSExpand', 'visible', true)
    menuTitle.value.setBtnProperty('btnMSDSCollapse', 'visible', false)
    exPanVal.value = 0
  }
}

// 일괄다운로드
const allDownload = async () => {
  let fileIdList = []
  let msdsFileIdList = []
  for (let row of grdSub.value.getGridView().getCheckedRows(true)) {
    let data = grdSub.value.getDataProvider().getJsonRow(row)

    if (isEmpty(data.MSDS_FILEID)) {
      Message.warn(t('자재번호 [' + data.MATNO + ']에 대한 첨부파일이 누락되었습니다. 확인 바랍니다. '))
      continue
    }

    if (msdsFileIdList.includes(data.MSDS_FILEID)) {
      continue
    } else {
      msdsFileIdList.push(data.MSDS_FILEID)
    }

    await Promise.all([
      commonSearchApi({
        queryId: 'searchFile',
        param: { CMPNY_DIV: searchParams.CMPNY_DIV, FILE_ID: data.MSDS_FILEID },
      }),
    ]).then((res) => {
      for (var id of res[0].ORESULT_CUR) {
        fileIdList.push(id)
      }
    })
  }

  if (isEmpty(fileIdList)) {
    return Message.warn(t('일괄다운로드 할 파일이 존재하지 않습니다.'))
  }

  for (var fileId of fileIdList) {
    try {
      await downloadFile(fileId)
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (err) {
      console.error(err)
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

const getData = () => {
  if (isEmpty(searchParams.DEPT_CD)) {
    return Message.warn(t('부서를 선택하여 주십시오.'))
  }

  // msds추가 접혀있을 때는 서브조회
  if (exPanVal.value == 0) {
    subSearchData()
  } else {
    new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).showMessage(true).run()
  }
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTDA0020_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  mainData.value = res.ORESULT_CUR
  subSearchData()
}

// 서브그리드 데이터 조회
const subSearchData = () => {
  let searchSubParams = { ...searchParams }
  searchSubParams.SDATE = searchParams.SYN == 'Y' ? searchParams.SDATE : ''
  searchSubParams.EDATE = searchParams.SYN == 'Y' ? searchParams.EDATE : ''

  grdSub.value.getDataProvider().setRows([])
  if (isEmpty(searchSubParams.DEPT_CD)) {
    return Message.warn(t('부서를 선택하여 주십시오.'))
  }
  commonSearchApi({ queryId: 'HLTDA0020_SEARCH_02', param: searchSubParams }).then((result) => {
    grdSub.value.getDataProvider().setRows(result.ORESULT_CUR1)
    let noTeam = result.ORESULT_CUR1.filter((item) => item.TEAM_CD == '미지정').length
    let eduA = result.ORESULT_CUR1.filter((item) => item.STATUS == 'A').length

    // 2025-07-30 김대원 선임 요청
    // 현업에 아직 안내가 되지 않아 일시적으로 나오지 않게 함.
    // let alarm = ''
    // if(noTeam > 0) {
    //   alarm += `<span style='position: relative;
    //             font-weight: 600;
    //             line-height: 1.5 !important;'>사용팀 지정이 필요한 자재가 있습니다. <br> <span style="color: red;">${noTeam}</span> 건<br> 자재의 사용팀을 지정바랍니다.</span><br><br>`
    // }
    // if(eduA > 0) {
    //   alarm += `<span style='position: relative;
    //             font-weight: 600;
    //             line-height: 1.5 !important;'>MSDS 교육 미완료 자재가 있습니다. <br> <span style="color: red;">${eduA}</span> 건<br> MSDS 교육 실시 바랍니다.<br>(MSDS 교육대상 자재관리메뉴 활용)</span>`
    // }
    // if(!isEmpty(alarm)) {
    //   vm.$swal({
    //     // title: alarm
    //     html: alarm
    //   })
    // }
  })
}

const deleteData = () => {
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    if (data.SAVE_YN != 'Y' || data.STOP_USE_DT == 'Y') {
      continue
    }
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: 'HLTDA0020_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  subSearchData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

// 부서별 화학물질 셀 클릭 이벤트
const onSubCellClicked = async (grid, clickData) => {

  // 2025.10.31 김대원 선임 요청으로 부서 인원들은 MSDS 확인및 경고표지 출력 가능
  // if(!isAdmin.value > 0) {
  //   return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
  // }

  // checkbox나 헤더를 클릭하면 return
  if (clickData.cellType == 'check' || clickData.cellType == 'header') {
    return
  }

  let rowData = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)

  if (clickData.fieldName == 'EDT_STUS_NM') {
    hltda0020Popup02.value.openPopup(rowData, isAdmin.value)
  } else if (clickData.fieldName !== 'TYPE_ID') {
    hltda0020Popup01.value.openPopup(rowData, isAdmin.value)
  }
}

const onTeamSelected = (teamList) => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let saveParams = []
  for (let rowIdx of checkedRows) {
    let msdsData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (isEmpty(msdsData.CMPNY_DIV)) {
      return Message.warn(t('회사코드는 필수 입력입니다.'))
    } else if (isEmpty(msdsData.VNDCOD)) {
      return Message.warn(t('납품사는 필수 입력입니다.'))
    } else if (isEmpty(msdsData.SAUPBU)) {
      return Message.warn(t('사업부코드는 필수 입력입니다.'))
    } else if (isEmpty(msdsData.MATNO)) {
      return Message.warn(t('자재번호는 필수 입력입니다.'))
    }

    for (let team of teamList) {
      let saveDt = {
        ...msdsData,
        ...team,
        NEW_YN: 'Y',
        DEPT_NM: searchParams.DEPT_NM,
        BSNS_CD: msdsData.SAUPBU,
      }
      saveParams.push(saveDt)
    }
  }
  commonExecuteApi({ queryId: 'HLTDA0020_SAVE_01', list: saveParams }).then(() => {
    subSearchData()
    Message.success(t('성공적으로 저장되었습니다'))
  })
}

//팝업 선택 이벤트
const onDeptSelected = (val) => {
  if(isAdmin.value < 2) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
  // getData()
  subSearchData()
}

const openDeptcdPopup = () => {
  if(isAdmin.value < 2) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }
  
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY: 'Y', ASGN_NM: searchParams.DEPT_NM })
}

const clearDeptcd = () => {
  if(isAdmin.value < 2) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }
  searchParams.DEPT_CD = ''
  searchParams.DEPT_NM = ''
  grdSub.value.getDataProvider().setRows([])
}

// 상세 닫았을 때
const closeDetail = (changeYn) => {
  // 변경된 사항이 있으면 재조회
  if (changeYn == 'Y') {
    subSearchData()
  }
}

const onCellItemClicked = (grid, index, col) => {
  // 2025.10.24 한민규 매니저 요청
  // if(!isAdmin.value > 0) {
  //   return Message.warn(t('관리자 혹은 부서담당자만 사용가능합니다.'))
  // }

  let data = grdSub.value.getDataProvider().getJsonRow(index.dataRow)
  // PDF 뷰어 ON
  if (col.target.className === 'v-btn' && col.column === 'TYPE_ID') {
    if (isEmpty(data.MSDS_FILEID)) {
      return Message.err(t('해당 자재 및 TYPE에는 첨부파일이 없습니다.'))
    }
    pdfPopup.value.openMSDSPopup(data, 'HLTDA0020_SEARCH_08')
  }
}

// 체크박스 클릭
const onItemChecked = (grid, itemIndex, checked) => {
  const dataProvider = grdSub.value.getDataProvider()
  const gridView = grdSub.value.getGridView()
  const targetIndex = gridView.getDataRow(itemIndex)
  const data = dataProvider.getJsonRow(targetIndex)

  // 전체 데이터 한 번만 로드
  const allRows = dataProvider.getJsonRows(0, -1)

  // 고유 비교 키 생성 함수
  const makeKey = (row) => `${row.MATNO}__${row.MATDSC}__${row.MSDS_NM}__${row.VNDNME}__${row.TYPE_ID}`

  // 기준 키 미리 생성
  const targetKey = makeKey(data)

  allRows.forEach((row, i) => {
    if (i === targetIndex) return

    if (makeKey(row) === targetKey) {
      gridView.checkRow(i, checked, false, false)
    }
  })
}

// 체크박스 클릭
const onItemCheckedMain = (grid, itemIndex, checked) => {
  const dataProvider = grdMain.value.getDataProvider()
  const gridView = grdMain.value.getGridView()
  const targetIndex = gridView.getDataRow(itemIndex)
  const data = dataProvider.getJsonRow(targetIndex)

  // 전체 데이터 한 번만 로드
  const allRows = dataProvider.getJsonRows(0, -1)

  // 고유 비교 키 생성 함수
  const makeKey = (row) => `${row.MATNO}__${row.MATDSC}__${row.VNDNME}`

  // 기준 키 미리 생성
  const targetKey = makeKey(data)

  allRows.forEach((row, i) => {
    if (i === targetIndex) return

    if (makeKey(row) === targetKey) {
      gridView.checkRow(i, checked, false, false)
    }
  })
}

// 접고 펼치기
watch(
  () => exPanVal.value,
  (newValue, oldValue) => {
    if (newValue == 1) {
      nextTick(() => {
        grdMain.value.getGridView().filterPanel.visible = true
        if (isEmpty(mainData.value)) {
          commonSearchApi({ queryId: 'HLTDA0020_SEARCH_01', param: searchParams }).then((res) => {
            grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
            mainData.value = res.ORESULT_CUR
          })
        } else {
          grdMain.value.getDataProvider().setRows(mainData.value)
        }
      })
    }
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
        :use-permission="false"
        :button-list="['btnMSDSExpand', 'btnMSDSCollapse', 'btnManageDownload', 'btnMsdsAllDownload']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="justify-space-between searchArea d-flex">
          <div class="d-flex">
            <i-select
              v-model="searchParams.GUBN"
              :label="$t('구분')"
              label-width="50px"
              :items="codeList.GUBN"
              item-value="COD"
              item-title="TXT"
              width="200px"
            />
            <i-input
              :label="$t('')"
              v-model="searchParams.GUBN_NM"
              label-width="5px"
              type="text"
              width="150px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
            <ILabel :label="$t('입고일자')" style="width: 80px" class="mr-0"> </ILabel>
            <v-checkbox v-model="searchParams.SYN" :label="$t('')" true-value="Y" false-value="N" class="mt-1" />
            <i-input
              v-model="searchParams.SDATE"
              label-width="20px"
              :label="$t('')"
              type="date"
              width="150px"
              class="mr-2"
            />
            <i-input v-model="searchParams.EDATE" label-width="20px" :label="$t('~')" type="date" width="170px" />
            <i-input
              v-model="searchParams.DEPT_CD"
              label-width="30px"
              :label="$t('부서')"
              width="180px"
              :readonly="true"
              class="ml-2"
            />
            <i-input
              v-model="searchParams.DEPT_NM"
              width="150px"
              :append-inner-icon="isAdmin == 2 ? 'mdi-magnify' : ''"
              :readonly="isAdmin < 2"
              @click:appendInner="openDeptcdPopup"
              @keydown.enter="openDeptcdPopup"
            >
              <template #append-inner>
                <v-icon v-if="isAdmin == 2" icon="mdi-window-close" @click="clearDeptcd" />
              </template>
            </i-input>
            <v-checkbox
              v-model="searchParams.STOP_USE_DT"
              :label="$t('')"
              true-value="Y"
              false-value="N"
              class="mt-1"
            />
            <ILabel :label="$t('사용중지분포함')" style="width: 80px" class="mr-0"> </ILabel>
          </div>
          <v-btn @click="onButtonsClick({ id: 'btnSearch' })"> 조회 </v-btn>
        </v-sheet>
        <div class="h-grow">
          <v-sheet v-if="exPanVal == 1" class="h-auto" width="35%">
            <IGridTitle
              ref="gridTitleM"
              title="MSDS 추가"
              :use-permission="false"
              :button-list="['btnCreate']"
              @click-button="onButtonsClick"
            ></IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grd1Props.gridViewOption"
              :keys="grd1Props.keys"
              :fields="grd1Props.fields"
              :columns="grd1Props.columns"
              @onItemChecked="onItemCheckedMain"
            />
          </v-sheet>
          <v-sheet class="h-auto ml-2" :width="exPanVal == 0 ? '100%' : '65%'">
            <IGridTitle
              ref="gridTitleL"
              title="화학물질 관리 목록"
              :use-permission="false"
              :button-list="['btnDelete']"
              @click-button="onButtonsClick"
            ></IGridTitle>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grd1Props.gridViewOption"
              :keys="grd2Props.keys"
              :fields="grd2Props.fields"
              :columns="grd2Props.columns"
              @onItemChecked="onItemChecked"
              @onCellClicked="onSubCellClicked"
              @onCellItemClicked="onCellItemClicked"
            />
          </v-sheet>
        </div>
      </div>
      <!-- 팝업존 -->
      <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
      <HLTDA0020Popup01 ref="hltda0020Popup01" @after-search="closeDetail" />
      <HLTDA0020Popup02 ref="hltda0020Popup02" @after-search="closeDetail" />
      <HLTDA0020Popup03 ref="hltda0020Popup03" @select-team="onTeamSelected" />
      <PdfView ref="pdfPopup" />
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

#swal2-html-container {
  line-height: 1.5 !important;
}
</style>
