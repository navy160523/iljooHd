<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import {
  commonDownloadFilesApi,
  commonDeletFilesApi,
  commonBigUploadFilesApi,
  commonDeleteAllFilesApi,
} from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { isEmpty } from '@/@core/utils'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import Compressor from 'compressorjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { useCommonStore } from '@hiway/stores/common'

defineOptions({
  name: '100_health-HLT_I-HLTIB0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const fileUploadPopup = ref(null)
const userId = ref(userStore.userId)
const tab = ref('tab1')
const saveParams = reactive([])
const commonStore = useCommonStore()
const route = useRoute()
const selectedRow = ref(0)
const imgList = []

// 파일 업로드 관련 변수
const maxFileSize = ref(5) // 최대 파일 크기 (MB)
const imgOnly = ref(true) // 이미지 파일만 허용할지 여부
const fileTypes = 'jpg,gif,bmp,png,jpeg'
// 이미지 업로드 후 행체크
let uploadedRow = null
// 이미지 업로드 후 메세지띄우기
let uploadMes = null
let uploadMes2 = null

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})

const initCodeList = () => {
  new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
}

// 버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    // grdMain.value.getGridView().filterPanel.visible = true
    new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnCreate') {
    addData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  }
}

// 조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTIB0030_SEARCH_01', param: searchParams })
}

const afterSearch = async (res) => {
  imgList.value = []
  // console.log('res.ORESULT_CUR', res.ORESULT_CUR)

  if (res.ORESULT_CUR.length > 0) {
    // console.log('res.ORESULT_CUR222', res.ORESULT_CUR)
    for (let e of res.ORESULT_CUR) {
      // console.log("파일타입", e.FILE_TYPE);
      if (isEmpty(e.FILE_TYPE)) {
        // Message.warn(" 파일 타입이 없습니다.");
        continue // 파일 타입이 없으면 현재 반복문 건너뛰기
        // return; 을 안쓴이유는 파일타입이 없는 하나의 데이터가 발견되는 순간 조회가 바로 중단됨 ( 정상적인 데이터도 처리안됌 )
      }
      if (
        e.FILE_TYPE.toUpperCase() === 'PNG' ||
        e.FILE_TYPE.toUpperCase() === 'JPG' ||
        e.FILE_TYPE.toUpperCase() === 'JPEG' ||
        e.FILE_TYPE.toUpperCase() === 'GIF'
      ) {
        let fileName = null
        let blob = null
        let imageURL = null
        let img = new Image() // 이미지 요소 생성
        let fileParam = {
          FILE_ID: e.HO_FILE_ID,
          FILE_NAME: e.FILE_NAME,
          FILE_NAME_ORIGINAL: e.FILE_NAME_ORIGINAL,
          FILE_NO: e.FILE_NO,
          FILE_PATH: e.FILE_PATH,
          FILE_TYPE: e.FILE_TYPE,
          INSERT_DATE: e.INSERT_DATE,
        }
        try {
          let res2 = await commonDownloadFilesApi(fileParam)
          fileName = res2.contentDisposition.match(/fileName="([^"]+)"/)[1]
          blob = new Blob([res2])
          imageURL = URL.createObjectURL(blob)
          img = new Image() // 이미지 요소 생성
          img.src = imageURL // 이미지 URL 설정
          img.alt = fileName
          if (!isEmpty(imageURL)) {
            e.IMAGE_URL = imageURL
          }
        } catch (ex) {}
      }
    }
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  }

  //이미지 업로드 후 그리드 행 체크
  // if (uploadedRow) {
  //   // 조회 후 행체크
  //   const rowIdx = grdMain.value
  //     .getDataProvider()
  //     .getJsonRows()
  //     .findIndex((row) => {
  //       // console.log("검사 중:", row); // row의 실제 데이터 출력
  //       return row.HO_FILE_ID === uploadedRow
  //     })
  //   if (rowIdx !== -1) {
  //     // console.log(" 업로드된 행 인덱스:", rowIdx);
  //     grdMain.value.getGridView().checkItem(rowIdx, true) //  행 자동 체크
  //   } else {
  //     console.warn(' 업로드된 행을 찾을 수 없습니다.')
  //   }

  //   uploadedRow = null
  // }
}

// 신규
const addData = () => {
  const newFileId = create_UUID()
  
  // console.log("뉴파일아이디", newFileId)
  grdMain.value.getDataProvider().insertRow(0, {
    HO_FILE_ID: newFileId, // 파일 ID 자동 생성
    ADD_YN: 'Y',
    NEW: 'Y'
  })
  grdMain.value.getGridView().checkItem(0, true)

  // HO_FILE_ID
}

// 저장
const beforeSave = () => {
  const chekedRow = grdMain.value.getGridView().getCheckedRows()
  const allRows = grdMain.value.getDataProvider().getJsonRows();
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }

  // 중복 검사
  for (const rowIdx of chekedRow) {
    const currentRow = allRows[rowIdx]
    const currentHoNo = currentRow.HO_NO?.trim()

    const isDuplicate = allRows.some((r, idx) => {
      return (
        idx !== rowIdx &&
        r.HO_NO?.trim() === currentHoNo
      )
    })

    if (isDuplicate) {
      Message.warn(`호 : ${currentHoNo} 중복입니다.`)
      return false
    }
  }

  saveParams.length = 0

  chekedRow.forEach((val) => {
    let rowData = grdMain.value.getDataProvider().getJsonRow(val) // 사용자가 입력한 값 가져오기
    // console.log("데이터파일아이디", rowData.HO_FILE_ID)

    if (rowData.NEW === 'Y') {
    rowData.NEW = 'N';
    }

    saveParams.push({
      CMPNY_DIV: userStore.cmpnyDiv, // 회사 구분 (고정값)
      HO_NO: rowData.HO_NO || '', // 그리드에서 입력된 값 반영
      EXP_TIME: rowData.EXP_TIME || '',
      EXP_FREQ: rowData.EXP_FREQ || '',
      BODY_PART: rowData.BODY_PART || '',
      WRK_FORM: rowData.WRK_FORM || '',
      WGT_DESC: rowData.WGT_DESC || '',
      HO_FILE_ID: rowData.HO_FILE_ID,
      ADD_YN: rowData.ADD_YN,
      HRMF_FCTR: rowData.HRMF_FCTR, //2025.04.03 김현재 추가
      USER_ID: userStore.userId, // 사용자 ID (고정값)
    })
  })
  // console.log('beforeSave',saveParams)
  // if (!saveParams.HO_FILE_ID) {
  //     Message.warn(" 파일이 업로드되지 않았습니다. 파일을 등록한 후 저장하세요.");
  //     return false;  // 저장 중단
  //   }

  return true
}

const saveData = () => {
  return commonExecuteApi({ queryId: 'HLTIB0030_SAVE_01', list: saveParams })
}

// 삭제
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  checkedData.forEach((val) => {
    let rowData = grdMain.value.getDataProvider().getJsonRow(val) //  체크된 행 데이터 가져오기
    deleteParam.push({
      CMPNY_DIV: userStore.cmpnyDiv, // 필수 키 값
      HO_NO: rowData.HO_NO, // 필수 키 값
      USER_ID: userStore.userId, // 삭제 요청자 ID
    })
  })

  // console.log(" 삭제할 데이터:", deleteParam);

  return commonExecuteApi({
    queryId: 'HLTIB0030_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

// 이미지 업로드
const onCellItemClicked = function (grid, index, clickData) {
  if (clickData.fieldName === 'BTN_IMG') {
    const rowData = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
    if (rowData.NEW === 'Y' || !rowData.HO_NO || !rowData.BODY_PART || !rowData.WRK_FORM) {
      Message.warn('이미지는 호, 신체부위, 작업자세 관련된 사항을 먼저 저장 후에 등록하세요.')
      return
    }
    selectedRow.value = index.dataRow
    fileUploadPopup.value.openPopup(rowData.HO_FILE_ID)
  }
}

const uploaded = async (val) => {
  // console.log('val', val)
  // console.log('val.STATUS', val.STATUS)
  uploadedRow = val.fileId
  uploadMes = val.STATUS

  // 파일ID가 같은행 찾기
  const rowIdx = grdMain.value
    .getDataProvider()
    .getJsonRows()
    .findIndex((row) => row.HO_FILE_ID === uploadedRow)
  //

  if (rowIdx !== -1) {
    // 행 체크
    // grdMain.value.getGridView().checkItem(rowIdx, true)
    onButtonsClick({ id: 'btnSearch'})
  }

  
  
  // console.log("val.STATUS", val.STATUS)
  // if (val.STATUS) {
    //   Message.warn('파일 업로드 / 삭제 후 필수로 저장해야합니다.')
    // }
    
    fileload(uploadedRow, rowIdx)
    
    // 업로드했을때 바로 조회
    /* if(uploadMes === 'update') {
      onButtonsClick({ id: 'btnSearch'})
    } */

  // const rowData = grdMain.value.getDataProvider().getJsonRow(rowIdx);
  // grdMain.value.getDataProvider().setRows(rowData)
  //addyn 구분자를 만들어서 새 row면 Y, 기존은
  // console.log("rowData.AddYn", rowData.AddYn)
  // if (rowData.AddYn === "Y"){
  //   onButtonsClick({ id: 'btnUpdate'})
  // }else {
  //   onButtonsClick({ id: 'btnSearch'})
  // }
}

// 파일id 생성
const create_UUID = () => {
  grdMain.value.getGridView().filterPanel.clearInput()
  let dt = new Date().getTime()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// 이미지 파일로부터 Blob URL을 만들어주는 함수
const fileload = async (fileId, rowIdx, deleteSta) => {
  // console.log('fileID', fileId)
  // console.log('rowIdx', rowIdx)
  // console.log('deleteSta ', deleteSta)

  commonSearchApi({
    queryId: 'HLTIB0030_ATTACH_SEARCH_01',
    param: { FILE_IDE: fileId },
  }).then(async (res) => {
    // console.log('res1212 : ', res)
    if (Array.isArray(res.ORESULT_CUR) && res.ORESULT_CUR.length > 0) {
      const data = res.ORESULT_CUR[0]

      // if (isEmpty(fileID.FILE_TYPE)) {
      //   Message.warn("파일 타입이 없습니다.");
      //   return null;
      // }

      // const isImage = ['PNG', 'JPG', 'JPEG'].includes(fileID.FILE_TYPE.toUpperCase());
      // if (!isImage) return null;

      const fileParam = {
        FILE_ID: data.FILE_ID,
        FILE_NAME: data.FILE_NAME,
        FILE_NAME_ORIGINAL: data.FILE_NAME_ORIGINAL,
        FILE_NO: data.FILE_NO,
        FILE_PATH: data.FILE_PATH,
        FILE_TYPE: data.FILE_TYPE,
        INSERT_DATE: data.INSERT_DATE,
      }

      // console.log('fileParam', fileParam)

      try {
        const res2 = await commonDownloadFilesApi(fileParam)
        // console.log('res2', res2)
        const fileName = res2.contentDisposition.match(/fileName="([^"]+)"/)[1]
        const blob = new Blob([res2])
        const imageURL = URL.createObjectURL(blob)

        grdMain.value.getDataProvider().setValue(rowIdx, 'IMAGE_URL', imageURL)
        // return {
        //   imageUrl,
        //   fileName,
        // };
      } catch (ex) {
        console.error('이미지 로딩 실패', ex)
        return null
      }
    }
  })
}

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅 ( 운영조직 세부사항 )
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true }, displayOptions: { rowHeight: 114 } },
  keys: [],
  fields: [
    { fieldName: 'HO_NO', dataType: 'text', width: '100', header: { text: t('호'), styleName: 'header_validit' }, 
    editable: false, required: true,
    'styleCallback' : function(grid, dataCell){
        var ret = { editable : false, styleName : 'editable_column'}
        if(grid.getValue(dataCell.index.itemIndex, 'ADD_YN') == 'Y') {
          ret.editable = true
          ret.style = { background:'#eff8fd' }
        } else {
          ret.editable = false
          ret.style = { background:'#FFFFFF' }
        }
        return ret
      }
    },//styleName: 'editable_column' 
    { fieldName: 'HO_FILE_ID', dataType: 'text', width: '100', header: { text: t('구분') }, visible: false },
    {
      fieldName: 'IMAGE_URL',
      dataType: 'text',
      width: '100',
      header: { text: t('구분') }, // 이미지 컬럼 추가\
      editable: false,
      renderer: {
        type: 'image',
        imageField: 'IMAGE_URL',
        imageHeight: 130,
        imageCallback: function (grid, cell) {
          return cell.value || '/noimage.png' // 값이 없으면 빈 칸 유지
        },
      },
    },
    {
      fieldName: 'BTN_IMG',
      width: '40',
      editable: false,
      dataType: 'button',
      header: { text: t('이미지업로드') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          var str = `<button 
              class="v-btn" 
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >업로드</button>`
          return str
        },
      },
    },
    //2025.04.03김현재 추가
    {
      fieldName: 'HRMF_FCTR',
      dataType: 'text',
      width: '50',
      header: { text: t('유해요인') },
      styleName: 'left-column editable_column',
    },
    {
      fieldName: 'EXP_TIME',
      dataType: 'text',
      width: '100',
      header: { text: t('노출시간') },
      styleName: 'left-column editable_column',
    },
    {
      fieldName: 'EXP_FREQ',
      dataType: 'text',
      width: '100',
      header: { text: t('노출빈도') },
      styleName: 'left-column editable_column',
    },
    {
      fieldName: 'BODY_PART',
      dataType: 'text',
      width: '100',
      header: { text: t('신체부위'), styleName: 'header_validit' },
      required: true,
      styleName: 'left-column editable_column',
    },
    {
      fieldName: 'WRK_FORM',
      dataType: 'text',
      width: '100',
      header: { text: t('작업자세 및 내용'), styleName: 'header_validit' },
      required: true,
      styleName: 'left-column editable_column',
    },
    {
      fieldName: 'WGT_DESC',
      dataType: 'text',
      width: '100',
      header: { text: t('무게') },
      styleName: 'left-column editable_column',
    },
    {
      fieldName: 'ADD_YN',
      dataType: 'text',
      width: '100',
      header: { text: t('구분값') },
      styleName: 'left-column',
      visible: false,
    },
    {
      fieldName: 'NEW',
      dataType: 'text',
      width: '100',
      header: { text: t('구분값') },
      styleName: 'left-column',
      visible: false,
    },
  ],
  columns: [],
})
grdMainProps.columns = grdMainProps.fields
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="`${$t(useLogsStore().menuId)}`"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        :use-permission="false"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>

    <IUploadPopup ref="fileUploadPopup" :fileDan="true" :imgOnly="true" @uploaded="uploaded" @deleted="deleted" />
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