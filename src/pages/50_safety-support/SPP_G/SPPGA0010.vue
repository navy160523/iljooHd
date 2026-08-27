<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { getJsonFromExcel } from '@/utils/excel'
import SPPGA0010Popup01 from './SPPGA0010Poup01.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { useCommonStore } from '@hiway/stores/common'
defineOptions({
  name: '50_safety-support-SPP_G-SPPGA0010',
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const empPopup = ref(null)
const sPPGA0010Popup01 = ref(null)
const commonStore = useCommonStore()
const deptPopup = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USE_YN: 'Y',
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'SHOW_CCTV',
      dataType: 'text',
      width: '80',
      header: { text: t('지도보기') },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        let iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'right',
          iconCallback: function (grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        return ret
      },
    },
    {
      fieldName: 'SERVER_NO',
      dataType: 'text',
      styleName: 'editable_column-left',
      width: '100',
      header: { text: t('서버NO') },
      editor: {
        type: 'line',
        inputCharacters: '0-9',
        maxLength: 2,
      },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '250',
      header: { text: t('부서명') },
      styleName: 'left-column',
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          let image = new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          var str = `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value ? cell.value : ''}</div>
            <img src=${image}></img>
          </div>`
          return str
        },
      },
    },
    {
      fieldName: 'MONITORING_LOCATION',
      dataType: 'text',
      width: '250',
      styleName: 'editable_column-left',
      header: { text: t('모니터링 장소') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '100',
      header: { text: t('담당자') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          let image = new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          var str = `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value ? cell.value : ''}</div>
            <img src=${image}></img>
          </div>`
          return str
        },
      },
    },

    {
      fieldName: 'INST_DATE',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      styleName: 'editable_column',
      width: '140',
      header: { text: t('설치일자') },
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        textReadOnly: true,
        mask: {
          editMask: '9999-99-99',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'CAMERA_NM',
      dataType: 'text',
      styleName: 'editable_column-left',
      width: '200',
      header: { text: t('카메라명칭') },
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      width: '80',
      header: { text: t('사용여부') },
      renderer: {
        type: 'check',
        trueValues: 'Y',
        falseValues: 'N',
      },
    },
    {
      fieldName: 'STOP_DATE',
      dataType: 'text',
      styleName: 'editable_column',
      datetimeFormat: 'yyyy-MM-dd',
      width: '140',
      header: { text: t('운영중단일자') },
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        textReadOnly: true,
        mask: {
          editMask: '9999-99-99',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'LENS_COUNT',
      dataType: 'number',
      numberFormat: '#,###',
      styleName: 'editable_column',
      width: '100',
      header: { text: t('화각(렌즈)개수') },
      editor: {
        type: 'line',
        inputCharacters: '1-9',
        maxLength: 1,
      },
    },
    {
      fieldName: 'MAKER',
      dataType: 'text',
      width: '200',
      styleName: 'editable_column-left',
      header: { text: t('제조사') },
    },
    {
      fieldName: 'MODEL',
      dataType: 'text',
      width: '200',
      styleName: 'editable_column-left',
      header: { text: t('모델명') },
    },
    {
      fieldName: 'MAKE_COUNTRY',
      dataType: 'text',
      width: '150',
      styleName: 'editable_column-left',
      header: { text: t('제조국') },
    },
    {
      fieldName: 'RESOLUTION',
      styleName: 'editable_column',
      header: { text: t('해상도') },
    },
    {
      fieldName: 'FRAME',
      styleName: 'editable_column',
      header: { text: t('프레임') },
      width: '100',
      editor: {
        type: 'line',
        inputCharacters: '0-9.',
        maxLength: 4,
      },
    },
    {
      fieldName: 'BITRATE',
      styleName: 'editable_column',
      header: { text: t('비트레이트') },
      width: '100',
      editor: {
        type: 'line',
        inputCharacters: '0-9.',
        maxLength: 4,
      },
    },
    {
      fieldName: 'SAVE_PERIOD',
      styleName: 'editable_column',
      header: { text: t('저장기간(일)') },
      width: '100',
      editor: {
        type: 'line',
        inputCharacters: '0-9.',
        maxLength: 4,
      },
    },
    {
      fieldName: 'LATITUDE',
      width: '150',
      header: { text: t('위도') },
      styleName: 'editable_column-left',
      editor: {
        type: 'line',
        inputCharacters: '0-9.-',
        maxLength: 18,
      },
    },
    {
      fieldName: 'LONGITUDE',
      dataType: 'text',
      width: '150',
      styleName: 'editable_column-left',
      header: { text: t('경도') },
      editor: {
        type: 'line',
        inputCharacters: '0-9.-',
        maxLength: 18,
      },
    },
    {
      fieldName: 'HEIGHT',
      dataType: 'text',
      width: '50',
      styleName: 'editable_column',
      header: { text: t('높이') },
      editor: {
        type: 'line',
        inputCharacters: '0-9.',
        maxLength: 10,
      },
    },
    {
      fieldName: 'HORIZONTAL_ROTATION_RANGE',
      styleName: 'editable_column',
      header: { text: t('수평회전범위') },
      width: '100',
      editor: {
        type: 'line',
        inputCharacters: '0-9.',
        maxLength: 5,
      },
    },
    {
      fieldName: 'VERTICAL_ROTATION_ANGLE',
      styleName: 'editable_column',
      header: { text: t('수직회전각도') },
      width: '100',
      editor: {
        type: 'line',
        inputCharacters: '0-9.',
        maxLength: 4,
      },
    },
    {
      fieldName: 'IP',
      dataType: 'text',
      width: '150',
      styleName: 'editable_column-left',
      header: { text: t('IP') },
      editor: {
        type: 'line',
        inputCharacters: '0-9.',
        maxLength: 15,
      },
      styleCallback: function (grid, dataCell) {
        //let ret = { editable: true, styleName: 'editable_column', enabled: true }
        let ret = {}
        ret.editor = {
          type: 'line',
          inputCharacters: '0-9.',
          maxLength: 15,
        }
        if (dataCell.item.rowState == 'created') {
          ret.editable = true
          ret.enabled = true
          ret.style = { background: '#eff8fd' }
        } else {
          ret.editable = false
          ret.enabled = false
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'ID',
      dataType: 'text',
      width: '140',
      styleName: 'editable_column-left',
      header: { text: t('ID') },
    },
    {
      fieldName: 'PASSWORD',
      dataType: 'text',
      width: '140',
      styleName: 'editable_column-left',
      header: { text: t('PASSWORD') },
    },
    {
      fieldName: 'HICAMS_YN',
      styleName: 'editable_column',
      header: { text: t('HiCAMS적용 여부') },
    },
    {
      fieldName: 'REMARKS',
      dataType: 'text',
      width: '350',
      styleName: 'editable_column-left',
      header: { text: t('비고') },
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
    },

    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'EMP_NO',
      visible: false,
      header: { text: t('담당자사번') },
    },

    {
      fieldName: 'STATUS',
      styleName: 'editable_column',
      header: { text: t('상태') },
    },

    {
      fieldName: 'DEPT_CD',
      visible: false,
      header: { text: t('부서코드') },
    },
  ],
  columns: [],
  // columnLayout: [
  //   'SHOW_CCTV',
  //   'SERVER_NO',
  //   {
  //     name: '관제 정보',
  //     direction: 'horizontal',
  //     items: ['CAMERA_NM', 'LENS_COUNT', 'LATITUDE', 'LONGITUDE', 'HEIGHT', 'USE_YN'],
  //   },
  //   {
  //     name: '운영 정보',
  //     direction: 'horizontal',
  //     items: ['DEPT_NM', 'MONITORING_LOCATION', 'EMP_NM', 'INST_DATE', 'STOP_DATE'],
  //   },
  //   {
  //     name: '카메라 정보',
  //     direction: 'horizontal',
  //     items: ['MAKER', 'MODEL', 'MAKE_COUNTRY'],
  //   },
  //   {
  //     name: '접근 정보',
  //     direction: 'horizontal',
  //     items: ['IP', 'ID', 'PASSWORD'],
  //   },
  //   'REMARKS',
  // ],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.addRow({ USE_YN: 'Y' })
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  } else if (btn.id === 'btnExcelFormDown') {
    //운영

    let params = {
      FILE_PATH: 'SPPG',
      FILE_NAME: 'CCTV현황관리 양식.xlsx',
    }
    //로컬 테스트용
    // let params = {
    //   PATH: '',
    //   FILE_PATH: '',
    //   FILE_NAME: 'CCTV현황관리 양식.xlsx',
    // }
    commonSampleDownFilesApi(params).catch((res) => {
      Message.err(res)
    })
  } else {
    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function (event) {
      const selectedFile = event.target.files[0]
      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  }
}
//엑셀 업로드

const excelUploadCallback = (excelData) => {
  commonStore.loading = true //로딩바 열기

  let mappedItemArray = []
  if (excelData.length === 0) {
    Message.err('엑셀 데이터를 입력해주세요.')
    commonStore.loading = false
    return false
  }
  for (let i = 0; i < excelData.length; i++) {
    const item = excelData[i]
    //IP,위경도 필수값 체크
    if (!item.회사코드) {
      Message.err(i + 2 + '번 행의 회사코드가 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!item.위도) {
      Message.err(i + 2 + '번 행의 위도가 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!item.경도) {
      Message.err(i + 2 + '번 행의 경도가 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!item.IP) {
      Message.err(i + 2 + '번 행의 IP가 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    }
    if (!isValidLat(item.위도)) {
      Message.err(i + 2 + '번 행의 위도형식이 일치하지 않습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!isValidLon(item.경도)) {
      Message.err(i + 2 + '번 행의 경도형식이 일치하지 않습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!isValidIP(item.IP)) {
      Message.err(i + 2 + '번 행의 IP형식이 일치하지 않습니다.')
      commonStore.loading = false
      return false // 함수 종료
    }

    /*
    2025.07.03 김현재 작성
    엑셀에서 일자를 yyyy-mm-dd 형태로 입력하고 엑셀 업로드를 했을때
    자바스크립트에서는 하루전 23시 59분 08초로 인식을함....
    예를들어 지급일자를 2025.06.30으로 입력을하고 업로드를 하면
    자바스크립트에서는 2025.06.29 23시 59 08초로 인식을함
    그래서 1분을 더하는 로직을 추가함
    */
    let instDate = null
    if (item.설치일자) {
      let date = dayjs(item.설치일자).add(1, 'minute')
      instDate = date.format('YYYY-MM-DD')
    }

    let stopDate = null
    if (item.운영중단일자) {
      stopDate = dayjs(item.운영중단일자).add(1, 'minute')
      stopDate = stopDate.format('YYYY-MM-DD')
    }

    // 필요한 데이터 매핑 후 추가
    mappedItemArray.push({
      CMPNY_DIV: item.회사코드,
      SERVER_NO: item.서버번호,
      DEPT_CD: item.운영주관부서코드,
      MONITORING_LOCATION: item.모니터링장소,
      EMP_NO: item.담당자사번,
      INST_DATE: instDate,
      CAMERA_NM: item.카메라명칭,
      LENS_COUNT: item.렌즈수,
      MAKER: item.제조사,
      MODEL: item.모델,
      MAKE_COUNTRY: item.제조국,
      RESOLUTION: item.Resolution,
      FRAME: item.Frame,
      BITRATE: item.BitRate,
      SAVE_PERIOD: item.저장기간,
      LATITUDE: item.위도,
      LONGITUDE: item.경도,
      HEIGHT: item.높이,
      HORIZONTAL_ROTATION_RANGE: item.수평회전범위,
      VERTICAL_ROTATION_ANGLE: item.수직회전각도,
      HICAMS_YN: item.HiCAMs적용,
      STATUS: item.상태,
      STOP_DATE: stopDate,
      USE_YN: 'Y',
      IP: item.IP,
      ID: item.ID,
      PASSWORD: item.PASSWORD,
      REMARKS: item.비고,
      USER_ID: userStore.userId,
    })
  }
  for (let i = 0; i < mappedItemArray.length; i++) {
    grdMain.value.addRow(mappedItemArray[i])
  }
  commonStore.loading = false //로딩바 닫기
  Message.info('엑셀 업로드가 완료되었습니다.')
}

//삭제관련 로직 시작
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  let deleteParam = []
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
      IP: data.IP, //IP
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SPPGA0010_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SPPGA0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//저장관련 로직 시작

const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (!data.LATITUDE) {
      Message.warn(t('위도를 입력해주세요.'))
      return false
    } else if (!data.LONGITUDE) {
      Message.warn(t('경도를 입력해주세요.'))
      return false
    } else if (!data.IP) {
      Message.warn(t('IP를 입력해주세요.'))
      return false
    } else if (!data.DEPT_CD) {
      Message.warn(t('부서를 입력해주세요.'))
      return false
    }

    //IP형식 체크
    if (!isValidIP(data.IP)) {
      Message.warn(t('올바른 IP를 입력해주세요.'))
      return false
    }
    //위도형식 체크
    if (!isValidLat(data.LATITUDE)) {
      Message.warn(t('올바른 위도를 입력해주세요.'))
      return false
    }
    //경도형식 체크
    if (!isValidLon(data.LONGITUDE)) {
      Message.warn(t('올바른 경도를 입력해주세요.'))
      return false
    }
  }

  return true
}

const saveData = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV, //사업장구분
      IP: data.IP, //IP
      SERVER_NO: data.SERVER_NO, //서버NO
      DEPT_NM: data.DEPT_CD, //부서코드
      MONITORING_LOCATION: data.MONITORING_LOCATION, //모니터링 장소
      EMP_NO: data.EMP_NO, //담당자사번
      INST_DATE: data.INST_DATE, //설치일자
      CAMERA_NM: data.CAMERA_NM, //카메라이름
      LENS_COUNT: data.LENS_COUNT, //화각(렌즈)개수
      MAKER: data.MAKER, //제조사
      MODEL: data.MODEL, //모델명
      MAKE_COUNTRY: data.MAKE_COUNTRY, //제조국
      RESOLUTION: data.RESOLUTION, //해상도
      FRAME: data.FRAME, //프레임
      BITRATE: data.BITRATE, //비트레이트
      SAVE_PERIOD: data.SAVE_PERIOD, //저장기간
      LATITUDE: data.LATITUDE, //위도
      LONGITUDE: data.LONGITUDE, //경도
      HEIGHT: data.HEIGHT, //높이
      HORIZONTAL_ROTATION_RANGE: data.HORIZONTAL_ROTATION_RANGE, //수평회전범위
      VERTICAL_ROTATION_ANGLE: data.VERTICAL_ROTATION_ANGLE, //수직회전각도
      ID: data.ID, //ID
      PASSWORD: data.PASSWORD, //PASSWORD
      HICAMS_YN: data.HICAMS_YN, //HiCAMS적용 여부
      STATUS: data.STATUS, //상태
      REMARKS: data.REMARKS, //비고
      USE_YN: data.USE_YN, //사용여부
      STOP_DATE: data.STOP_DATE, //운영중단일자
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SPPGA0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//ip체크 정규식
const isValidIP = (ip) => {
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(\.(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})){3}$/
  return ipRegex.test(ip)
}
//위도체크 정규식
const isValidLat = (lat) => {
  const latRegex = /^[-+]?([0-8]?[0-9](\.\d+)?|90(\.0+)?)$/
  return latRegex.test(String(lat))
}
//경도체크 정규식
const isValidLon = (lon) => {
  const lonRegex = /^[-+]?((1[0-7][0-9]|0?[0-9]{1,2})(\.\d+)?|180(\.0+)?)$/
  return lonRegex.test(String(lon))
}

const onCellClicked = (grid, clickData) => {
  if (clickData.column === 'EMP_NM') {
    let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    empPopup.value.openPopup({ EMP_NO: rowData.EMP_NO })
  } else if (clickData.column === 'SHOW_CCTV') {
    let selectedData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    if (!selectedData.LATITUDE || !selectedData.LONGITUDE) {
      Message.warn(t('위도,경도데이터를 모두 입력해주세요.'))
      return false
    }
    //위도가 35.5로 시작하면 본공장이 지도의 중심으로 세팅되도록
    //위도가 35.4로 시작하면 해양이 지도의 중심으로 세팅되도록
    let mapCenterFlag = ''
    if (selectedData.LATITUDE.startsWith('35.5')) {
      mapCenterFlag = 'A'
    } else if (selectedData.LATITUDE.startsWith('35.4')) {
      mapCenterFlag = 'B'
    }
    let rowData = grdMain.value.getDataProvider().getJsonRows()
    let filteredData = rowData.filter((x) => x.LONGITUDE !== null)
    filteredData.mapCenterFlag = mapCenterFlag
    for (let i = 0; i < filteredData.length; i++) {
      if (selectedData.IP === filteredData[i].IP) {
        filteredData[i].FLAG = true
      }
    }
    sPPGA0010Popup01.value.openPopup(filteredData)
  } else if (clickData.column === 'DEPT_NM') {
    let selectedData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    if (selectedData.DEPT_NM) {
      deptPopup.value.openPopup({
        CMPNY_DIV: selectedData.CMPNY_DIV,
        ASGN_NM: selectedData.DEPT_NM.split('-').pop(),
      })
    } else {
      deptPopup.value.openPopup({})
    }
  }
}

const selectedEmp = (val) => {
  let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'EMP_NO', val.EMP_NO)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'EMP_NM', val.EMP_NM)
}

const selectedDept = (val) => {
  let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow

  grdMain.value.getDataProvider().setValue(currentRowIdx, 'CMPNY_DIV', val.CMPNY_DIV)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'DEPT_CD', val.DEPT_CD)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'DEPT_NM', val.ASGN_FULL_NM)
  grdMain.value.getGridView().checkRow(currentRowIdx, true)
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnCreate', 'btnExcelFormDown', 'btnExcelUpload']"
        @click-button="onButtonsClick"
        :use-permission="false"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <v-checkbox true-value="Y" false-value="" v-model="searchParam.USE_YN"> </v-checkbox>
            <span class="mt-1">사용건만 조회</span>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellClicked="onCellClicked"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="selectedEmp"></EmpPopup>
  <DeptPopup ref="deptPopup" @selected="selectedDept"></DeptPopup>
  <SPPGA0010Popup01 ref="sPPGA0010Popup01"></SPPGA0010Popup01>
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
