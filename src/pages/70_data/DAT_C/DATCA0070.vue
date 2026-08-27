<!--
  화면명 : 메뉴얼 관리
  화면개요 : 화면 별 메뉴얼을 저장하는 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useMenuStore } from '@hiway/stores/menu'
import { useI18n } from 'vue-i18n'
import { useRouter }    from 'vue-router'
import { commonSearchApi, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from 'dayjs'

defineOptions({
  name: '70_data-DAT_C-DATCA0070',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const router = useRouter()
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const selectedRow = ref(0)
const selectedCol = ref('')
const fileUploadPopup = ref(null)
const empPopup = ref(null)
const menuStore = useMenuStore()

// 첨부파일 버튼 리스트
const buttonList = reactive(['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose'])

const treeData = reactive({
  children: menuStore.treeMenus
})

//그리드 속성셋팅_main
const grdMainProps = reactive({ 
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: false }},
  keys : ['menu_id', 'mnu_nm'],
  fields : [ 
    
    { fieldName: 'mnu_nm', dataType: 'text', width: '30', header: { text: t('메뉴명') }, styleName: 'left-column', width : '150' },
    { fieldName: 'path', dataType: 'text', width: '30', header: { text: t('경로') }, styleName: 'left-column', width : '150',
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'menulevel', dataType: 'text', width: '30', header: { text: t('메뉴레벨') }, width : '30' },
    { fieldName: 'FILE1', dataType: 'text', width: '30', header: { text: t('원본파일') }, 
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'FILE2', dataType: 'text', width: '30', header: { text: t('PDF') }, 
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'EMP_NM1', dataType: 'text', width: '30', header: { text: t('전산담당자') },
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'EMP_NM2', dataType: 'text', width: '30', header: { text: t('업무담당자') },
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },


    { fieldName: 'INSERT_DATE', dataType: 'text', width: '50', header: { text: t('작성일자') }, visible: false },
    { fieldName: 'CATEGORY5', dataType: 'text', width: '50', header: { text: t('파일1') }, visible: false },
    { fieldName: 'NOTICE_FILEID', dataType: 'text', width: '50', header: { text: t('파일2') }, visible: false },
    { fieldName: 'menu_id', dataType: 'text', header: { text: t('메뉴코드') }, visible: false},
    { fieldName: 'prnt_menu_id', dataType: 'text', header: { text: t('상위메뉴') }, visible : false } ,
    { fieldName: 'app_id', dataType: 'text', header: { text: t('app_id') }, visible : false },
    { fieldName: 'sort', dataType: 'text', header: { text: t('정렬') }, visible : false },
    { fieldName: 'mnu_seq', dataType: 'text', header: { text: t('seq') }, visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장구분') }, visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text', header: { text: t('게시물번호') }, visible: false },
    { fieldName: 'NOTICE_TAG', dataType: 'text', header: { text: t('게시물 태그') }, visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text', header: { text: t('NOTICE_DIV') }, visible: false },
    { fieldName: 'CATEGORY1', dataType: 'text', header: { text: t('화면경로') }, visible: false },
    { fieldName: 'NOTICE_REG_EMPNO', dataType: 'text', header: { text: t('전산 담당자 사번') }, visible: false },
    { fieldName: 'EMP_NO2', dataType: 'text', header: { text: t('업무 담당자 사번') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//조회조건
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTICE_DIV: 'DATCA0070',
})

const onButtonsClick = (btn) => {
  if(btn.id === 'btnExpand'){
    grdMain.value.getGridView().expandAll()
  } else if(btn.id === 'btnCollapse'){
    grdMain.value.getGridView().collapseAll()
  } else if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
}

/* ****************** 파일첨부 선택 ******************* */
const uploaded = (val) => {
  let saveParams = []
  
  if(val.fileId == null) return
  
  Promise.all([
      commonSearchApi({ queryId : 'DATCA0070_SEARCH_03', param : { CMPNY_DIV: userStore.cmpnyDiv, FILE_ID: val.fileId } }), // 부서
    ]).then(res => {
    grdMain.value.getDataProvider().setValue(selectedRow.value, 'CATEGORY1', grdMain.value.getDataProvider().getValue(selectedRow.value, 'path'))
    if(selectedCol.value == 'CATEGORY5') {
      if(res[0].ORESULT_CUR[0].CNT_FILE > 0) {
        grdMain.value.getDataProvider().setValue(selectedRow.value, 'FILE1', 'Y')
      } else {
        grdMain.value.getDataProvider().setValue(selectedRow.value, 'FILE1', '')
      }
      grdMain.value.getDataProvider().setValue(selectedRow.value, 'CATEGORY5', val.fileId)
    } else {
      if(res[0].ORESULT_CUR[0].CNT_FILE > 0) {
        grdMain.value.getDataProvider().setValue(selectedRow.value, 'FILE2', 'Y')
      } else {
        grdMain.value.getDataProvider().setValue(selectedRow.value, 'FILE2', '')
      }
      grdMain.value.getDataProvider().setValue(selectedRow.value, 'NOTICE_FILEID', val.fileId)
    }

    // DB에 파일정보 저장
    let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
    // 파일 업로드 후 저장
    if(data.CMPNY_DIV == null) data.CMPNY_DIV = userStore.cmpnyDiv
    if(data.NOTICE_DIV == null) data.NOTICE_DIV = 'DATCA0070'
    saveParams.push(data)
    
    // 재 렌더링을 해주기 위한 코드(렌더링이 되지 않으면 데이터가 변하지 않은 거처럼 보임)
    grdMain.value.getGridView().displayOptions.rowHeight = grdMain.value.getGridView().displayOptions.rowHeight + 1
    grdMain.value.getGridView().displayOptions.rowHeight = grdMain.value.getGridView().displayOptions.rowHeight - 1
    
    commonExecuteApi({ queryId : 'DATCA0070_SAVE_01', list: saveParams }).then(res => {
      if(res.list.length > 0) {
        grdMain.value.getDataProvider().setValue(selectedRow.value, 'NOTICE_NO', res.list[0].OUT_NOTICE_NO)
      }
    })
  })
}

// 담당자 선택 시
const selectedemp = (row) => {
  let saveParams = []
  let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)

  if(selectedCol.value == 'EMP_NM1') {
    grdMain.value.getDataProvider().setValue(selectedRow.value, 'EMP_NM1', row.EMP_NM)
    grdMain.value.getDataProvider().setValue(selectedRow.value, 'NOTICE_REG_EMPNO', row.EMP_NO)

    data.EMP_NM1 = row.EMP_NM
    data.NOTICE_REG_EMPNO = row.EMP_NO
  } else {
    grdMain.value.getDataProvider().setValue(selectedRow.value, 'EMP_NM2', row.EMP_NM)
    grdMain.value.getDataProvider().setValue(selectedRow.value, 'EMP_NO2', row.EMP_NO)

    data.EMP_NM2 = row.EMP_NM
    data.EMP_NO2 = row.EMP_NO
  }

  if(data.CMPNY_DIV == null) data.CMPNY_DIV = userStore.cmpnyDiv
  if(data.NOTICE_DIV == null) data.NOTICE_DIV = 'DATCA0070'
  data.CATEGORY1 = data.path
  saveParams.push(data)

  // 재 렌더링을 해주기 위한 코드(렌더링이 되지 않으면 데이터가 변하지 않은 거처럼 보임)
  grdMain.value.getGridView().displayOptions.rowHeight = grdMain.value.getGridView().displayOptions.rowHeight + 1
  grdMain.value.getGridView().displayOptions.rowHeight = grdMain.value.getGridView().displayOptions.rowHeight - 1
  
  commonExecuteApi({ queryId : 'DATCA0070_SAVE_01', list: saveParams }).then(res => {
    if(res.list.length > 0) {
      grdMain.value.getDataProvider().setValue(selectedRow.value, 'NOTICE_NO', res.list[0].OUT_NOTICE_NO)
    }
  })
}

// Main 특정 열 클릭 시 
const onCellClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  if(data.path == null) return
  selectedRow.value = clickData.dataRow
  // 건축물대장 열 클릭 시 첨부파일
  if(clickData.fieldName == 'FILE1') {
    selectedCol.value = 'CATEGORY5'
    fileUploadPopup.value.openPopup(data.CATEGORY5)
  } else if(clickData.fieldName == 'FILE2') {
    selectedCol.value = 'NOTICE_FILEID'
    fileUploadPopup.value.openPopup(data.NOTICE_FILEID)
  } else if(clickData.fieldName == 'path') {
    router.push(data.path)
  } else if(clickData.fieldName == 'EMP_NM1') {
    selectedCol.value = 'EMP_NM1'
    empPopup.value.openPopup({})
  } else if(clickData.fieldName == 'EMP_NM2') {
    selectedCol.value = 'EMP_NM2'
    empPopup.value.openPopup({})
  }
}

const onCellDblClicked = (grid, clickData) => {
  if(clickData.fieldIndex == 0) {
    grdMain.value.getGridView().expand(clickData.itemIndex)
    return
  } 
}

const beforeSearch = async () => {
  //조회기간 입력체크
  if (searchParam.DATE_FROM === '' || searchParam.DATE_TO === '') {
    Message.warn(t('조회기간을 입력해주세요.'))
    return false
  }
  if (searchParam.GUBUN === '') {
    Message.warn(t('조회구분을 입력해주세요.'))
    return false
  }
  return true
}

// 데이터 조회
const searchData = () => {
  return commonRequest('/hse/operation/search01', {
    queryId: 'DATCA0070_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  for(var data of res.ORESULT_CUR) {
    for(var i = 0; i < grdMain.value.getDataProvider().getRowCount(); i++) {
      let rowData = grdMain.value.getDataProvider().getJsonRow(i)
      if(rowData == null) continue
      if(rowData.path === data.CATEGORY1) {
        grdMain.value.getDataProvider().setValue(i, 'CMPNY_DIV', data.CMPNY_DIV)
        grdMain.value.getDataProvider().setValue(i, 'CATEGORY5', data.CATEGORY5)
        grdMain.value.getDataProvider().setValue(i, 'EMP_NM1', data.EMP_NM1)
        grdMain.value.getDataProvider().setValue(i, 'EMP_NM2', data.EMP_NM2)
        grdMain.value.getDataProvider().setValue(i, 'NOTICE_NO', data.NOTICE_NO)
        grdMain.value.getDataProvider().setValue(i, 'NOTICE_REG_EMPNO', data.NOTICE_REG_EMPNO)
        grdMain.value.getDataProvider().setValue(i, 'EMP_NO2', data.EMP_NO2)
        grdMain.value.getDataProvider().setValue(i, 'NOTICE_TAG', data.NOTICE_TAG)
        grdMain.value.getDataProvider().setValue(i, 'CATEGORY1', data.CATEGORY1)        
        grdMain.value.getDataProvider().setValue(i, 'CATEGORY5', data.CATEGORY5)
        grdMain.value.getDataProvider().setValue(i, 'NOTICE_FILEID', data.NOTICE_FILEID)
        grdMain.value.getDataProvider().setValue(i, 'INSERT_DATE', data.INSERT_DATE)
        grdMain.value.getDataProvider().setValue(i, 'FILE1', data.FILE1)
        grdMain.value.getDataProvider().setValue(i, 'FILE2', data.FILE2)
        break
      }
    }
  } 
  grdMain.value.getGridView().expandAll()
}

onMounted(() => {
  grdMain.value.getDataProvider().setObjectRows(treeData, 'children','','')
  onButtonsClick({ id: 'btnSearch' }) 
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnExpand', 'btnCollapse', 'btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="h-auto">
          <IGridTitle :title="$t('메뉴얼 목록')"> </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            is-tree
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellClicked="onCellClicked"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="selectedemp" />
  <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded" :buttonList="buttonList" />
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
    min-height: 700px;
  }
}
</style>
 