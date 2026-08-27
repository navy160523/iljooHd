<!-- SPPFC0010 공정안전자료 -->
<!-- SI1팀 하선주 2025.03.28 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import { isEmpty, isEmptyArray } from "@/@core/utils"
import SPPFC0010Popup from './SPPFC0010Popup.vue'
import { handleDragging } from '@/utils/useDrag'
import { commonDownloadFilesApi } from '@/@hiway/api/commonFileApi'

defineOptions({
  name: '50_safety-support-SPP_F-SPPFC0010',
})

const sPPFC0010Popup = ref(null)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const useLogStore = useLogsStore()
const menuTitle = ref(null)
const grdSub = ref(null)
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const grdMain3 = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.empNo,
})

const isAdmin = ref(0)

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  process: [],
  item: []
})

const initCodeList = () => {
  Promise.all([ 
    commonSearchApi({ queryId: 'SPPFC0010_SEARCH_04', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFC0010_SEARCH_05', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFC0010_SEARCH_06', param: searchParams }),
    getCodeList('HHIV020')
  ]).then(res => {    
    codeList.bsnscd = res[0].ORESULT_CUR
    if(searchParams.BSNS_CD !== '') {
      codeList.deptcd = res[1].ORESULT_CUR
      codeList.process = res[2].ORESULT_CUR
    }
    codeList.item = res[3].ORESULT_CUR.map(obj => ({
      ITEM_NM: obj.TXT,
      ITEM_CD: obj.COD
    }))
    codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptcd.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
    codeList.process.unshift({ PROCESS_NM: '전체', PROCESS_CD: '' })
    // 항목 초기화
    grdMain2.value.getDataProvider().setRows([])
  })
}

// 등록/수정 구분자
const isNew = ref(false)

const onButtonsClick = async(btn) => {
  if (btn.id === 'btnRegisterModify') {
    if(isEmpty(fileSearchData.PROCESS_CD)) {
      return Message.err("공정설비를 선택해 주십시오.")
    }
    if(isEmpty(fileSearchData.ITEM_CD)) {
      return Message.err("항목을 선택해 주십시오.")
    }

    // 2025.06.12 손상규 / 등록된 파일이 없는데 이력이 계속 등록되는 문제때문에 추가함
    const res = await commonSearchApi({ queryId: 'SPPFC0010_SEARCH_09', param: fileSearchData })
    console.log(res)
    if (res.ORESULT_CUR[0] == null && res.ORESULT_CUR.length !== 0) {
      return Message.err("최근 변경이력에서 한개 이상의 파일을 등록해야합니다.")
    }

    isNew.value = true
    openPopup(fileSearchData)
  }else if(btn.id === 'btnSearch') {
    getData()
  }
}

const openPopup = (data) => {
  data.isAdmin = isAdmin.value
  sPPFC0010Popup.value.openPopup(isNew.value, data)
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain1])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

// 공정안전 자료와 관계없는 관리자가 왔을때 콤보박스 바인딩
const selectedBsnsCd = computed({
  get: () => {
    return codeList.bsnscd.some(item => item.BSNS_CD === searchParams.BSNS_CD)
      ? searchParams.BSNS_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.BSNS_CD = value;
  }
});

const selectedDeptCd = computed({
  get: () => {
    return codeList.deptcd.some(item => item.DEPT_CD === searchParams.DEPT_CD)
      ? searchParams.DEPT_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.DEPT_CD = value;
  }
})

//  조회
const searchData = () => {
  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: codeList.bsnscd.some(item => item.BSNS_CD === searchParams.BSNS_CD) ? searchParams.BSNS_CD : '', //사업부
    DEPT_CD: codeList.deptcd.some(item => item.DEPT_CD === searchParams.DEPT_CD) ? searchParams.DEPT_CD : '', //부서
    PROCESS_CD: searchParams.PROCESS_CD, //공정설비
    USER_ID: searchParams.USER_ID,
  }

  return commonSearchApi({ queryId: 'SPPFC0010_SEARCH_01', param: param })
}

// 조회 후
const afterSearch = (res) => {
  initFileSearchData()
  grdMain2.value.getDataProvider().setRows([])
  grdMain3.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
  grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR)

  const sessionProcess = window.sessionStorage.getItem('PROCESS_CD');

  if (sessionProcess) {

    const gridView = grdMain1.value.getGridView();
    const rowCount = grdMain1.value.getDataProvider().getRowCount();

    for (let i = 0; i < rowCount; i++) {

      const rowData = grdMain1.value.getDataProvider().getJsonRow(i);

      if (rowData.PROCESS_CD === sessionProcess) {
        gridView.setCurrent({ dataRow: i });
        gridView.setFocus(true);

        onCellClicked(gridView, {
          dataRow: i,
          column: 'PROCESS_CD', // 또는 클릭으로 가정할 컬럼명
          itemIndex: gridView.getCurrent().itemIndex
        }, 'grdMain1');
        
        // sessionStorage 값 삭제 (한번만 실행되도록)
        window.sessionStorage.removeItem('PROCESS_CD');

        break;  
      }
    }
  }
}

//사업부변경 감지
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    const param = {CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue,}
    if(newValue !== '') {
      Promise.all([ 
        commonSearchApi({ queryId: 'SPPFC0010_SEARCH_05', param: param }),
        commonSearchApi({ queryId: 'SPPFC0010_SEARCH_06', param: param })
      ]).then((res) => {
        searchParams.DEPT_CD = ''
        searchParams.PROCESS_CD = ''
        codeList.deptcd = res[0].ORESULT_CUR
        codeList.process = []
        // codeList.process = res[1].ORESULT_CUR
        codeList.deptcd.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
        codeList.process.unshift({ PROCESS_NM: '전체', PROCESS_CD: '' })
      })
    }else {
      searchParams.DEPT_CD = ''
      searchParams.PROCESS_CD = ''
      codeList.deptcd = []
      codeList.process = []
      codeList.deptcd.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
      codeList.process.unshift({ PROCESS_NM: '전체', PROCESS_CD: '' })
    }
  }
)

// 부서변경 감지
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    if(newValue !== '') {
      commonSearchApi({ 
        queryId: 'SPPFC0010_SEARCH_06', 
        param: { 
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: newValue
        } 
      }).then((res) => {
        searchParams.PROCESS_CD = ''
        codeList.process = res.ORESULT_CUR
        codeList.process.unshift({ PROCESS_NM: '전체', PROCESS_CD: '' })
      })
    }else {
      searchParams.PROCESS_CD = ''
      codeList.process = []
      codeList.process.unshift({ PROCESS_NM: '전체', PROCESS_CD: '' })
    }
  }
)

const fileSearchData = reactive({})
const initFileSearchData = () => {
  const temp = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    ALL_UP_CD: 'HHIV020',
    USE_FLAG: 'Y',
    CODE_NAME_TYPE: '0',
    BSNS_CD: '',
    DEPT_CD: '',
    PROCESS_CD: '',
    PROCESS_NM: '',
    ITEM_CD: '',
    ITEM_NM: '',
    ITEM_SEQ: '',
  }
  Object.keys(temp).forEach(key => {
    fileSearchData[key] = temp[key]
  })
}

// searchData의 요소만 갱신
const updateFileSearchData = (data) => {
  Object.keys(data).forEach(key => {
    if (fileSearchData.hasOwnProperty(key)) {
      fileSearchData[key] = data[key]; 
    }
  })
}


// 셀 클릭 이벤트
const onCellClicked = (grid, clickData, gubn) => {
  let data
  if(gubn === 'grdMain1') { // 기초정보(사, 부, 공)
    data = grdMain1.value.getDataProvider().getJsonRow(clickData.dataRow)
    updateFileSearchData(data)
    bindingItems()
  }else if(gubn === 'grdMain2') { // 항목정보
    data = grdMain2.value.getDataProvider().getJsonRow(clickData.dataRow)
    updateFileSearchData(data)
    bindingFile()
  }  
}

const onCellDblClicked = (grid, clickData, gubn) => {
  if(gubn === 'grdSub') {
    let data = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)
    isNew.value = false
    data = Object.assign({}, fileSearchData, data)
    openPopup(data)
  }else if(gubn === 'grdMain3') {
    vm.$swal({ 
      title: t('다운로드 하시겠습니까?'), 
      showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        downloadFile(clickData.dataRow)
      }
    })
  }
}

const downloadFile = (row) => {
  const currRow = grdMain3.value.getDataProvider().getJsonRow(row)

  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    FILE_ID: currRow.FILE_ID
  }

  commonSearchApi({ queryId: 'searchFile', param: param }).then( res => {
    commonDownloadFilesApi(res.ORESULT_CUR.at(-1)).then((res) => {
      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)

      link.download = decodeURI(file[1].replace('";', ''))
      link.click()
      URL.revokeObjectURL(link.href)
    })
    .catch((e) => {
      return Message.success(e)
    })
  })
}


// 항목 출력
const bindingItems = () => {
  fileSearchData.ITEM_CD = codeList.item[0].ITEM_CD
  fileSearchData.ITEM_NM = codeList.item[0].ITEM_NM
  Promise.all([
    commonSearchApi({ queryId: 'SPPFC0010_SEARCH_02', param: fileSearchData }),
    commonSearchApi({ queryId: 'SPPFC0010_SEARCH_03', param: fileSearchData }),
  ]).then(res => {
    
    if(isEmptyArray(res[1].ORESULT_CUR)) {
      fileSearchData.ITEM_SEQ = ''
    }else {
      fileSearchData.ITEM_SEQ = res[1].ORESULT_CUR[0].ITEM_SEQ
    }
    grdMain2.value.getDataProvider().setRows(codeList.item)
    grdMain2.value.getGridView().setCurrent({ dataRow: 0 })
    grdMain3.value.getDataProvider().setRows(res[0].ORESULT_CUR)
    grdSub.value.getDataProvider().setRows(res[1].ORESULT_CUR)
  })
}

// 변경이력 출력
const bindingFile = () => {
  Promise.all([ 
    commonSearchApi({ queryId: 'SPPFC0010_SEARCH_02', param: fileSearchData }),
    commonSearchApi({ queryId: 'SPPFC0010_SEARCH_03', param: fileSearchData }),
  ]).then(res => { 
    if(isEmptyArray(res[1].ORESULT_CUR)) {
      fileSearchData.ITEM_SEQ = ''
    }else {
      fileSearchData.ITEM_SEQ = res[1].ORESULT_CUR[0].ITEM_SEQ
    }
    // fileSearchData.ITEM_SEQ = isEmpty(res[1].ORESULT_CUR[0].ITEM_SEQ) ? '' : res[1].ORESULT_CUR[0].ITEM_SEQ
    grdMain3.value.getDataProvider().setRows(res[0].ORESULT_CUR)
    grdSub.value.getDataProvider().setRows(res[1].ORESULT_CUR)
  })
}

// 팝업 종료 이벤트(저장버튼 클릭 시)
const upData = (saveYn) => {
  // bindingItems()
  bindingFile()
}

//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    rowIndicator: { visible: false },
  },
  fields : [
    { 
      fieldName: 'BSNS_NM', dataType: 'text', width: '100', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('사업부'),
    } ,
    },
    { 
      fieldName: 'DEPT_NM', dataType: 'text', width: '100', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('부서') },
    },
    { 
      fieldName: 'PROCESS_NM', dataType: 'text', width: '250', styleName: 'left-column',
      header: { text: t('공정설비') }, 
    },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
  ],
  columns : [],

})

grdMain1Props.columns = grdMain1Props.fields

const grdMain2Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    rowIndicator: { visible: false },
  },
  fields : [
    { 
      fieldName: 'ITEM_NM', dataType: 'text', width: '150', styleName: 'left-column', 
      header: { text: t('항목') } ,
    },
    { fieldName: 'ITEM_CD', dataType: 'text', header: { text: t('항목코드') },visible: false, },
  ],
  columns : [],
  propsValue: { name: 'grdMain2'}

})

grdMain2Props.columns = grdMain2Props.fields

//그리드 속성셋팅
const grdMain3Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    rowIndicator: { visible: false },
  },
  fields : [
    { 
      fieldName: 'PREV_FILE_NM', dataType: 'text', width: '200', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('첨부파일명') },
    },
    { 
      fieldName: 'LAST_INSERT_USER_NM', dataType: 'text', width: '150', 
      header: { text: t('등록자') }, disabled: true,
    },
    { 
      fieldName: 'LAST_INSERT_DATE', dataType: 'text', width: '100', styleName: 'multiline-editor-pre',
      header: { text: t('최종등록일') } ,
    },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('파일아이디') },visible: false, },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', header: { text: t('수정자아이디') },visible: false, },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자') },visible: false, },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정일자') },visible: false, },
  ],
  columns : [],
  propsValue: { name: 'grdMain3'}

})

grdMain3Props.columns = grdMain3Props.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } 
  },
  fields : [
    { 
      fieldName: 'ITEM_NM', dataType: 'text', width: '100', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('항목') } ,
    },
    { 
      fieldName: 'UPDATE_REASON', dataType: 'text', width: '150', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('변경사유') },
    },
    { 
      fieldName: 'UPDATE_DETAIL', dataType: 'text', width: '250', styleName: 'left-column',
      header: { text: t('변경상세') }, 
    },
    { 
      fieldName: 'LAST_INSERT_USER_NM', dataType: 'text', width: '100', 
      header: { text: t('등록자') } ,
    },
    { 
      fieldName: 'LAST_INSERT_DATE', dataType: 'text', 
      header: { text: t('최종등록일') },
    },
    { fieldName: 'LAST_INSERT_USER_ID', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('파일아이디') },visible: false, },
    { fieldName: 'ITEM_CD', dataType: 'text', header: { text: t('항목코드') },visible: false, },
    { fieldName: 'ITEM_SEQ', dataType: 'text', header: { text: t('순번') },visible: false, },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장구분') },visible: false, },
    { fieldName: 'LATEST_INSERT_SEQ', dataType: 'text', header: { text: t('입력순서') },visible: false, },
  ],
  columns : [],

})

grdSubProps.columns = grdSubProps.fields

onMounted( () => {

  // PSM 관리자 확인
  // 2: PSM 모듈 관리자, 1: PSM 부서 담당자, 0: 일반 사용자
  if(
    useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes("SPPF001")
  ) {
    // isAdmin.value = 2
    isAdmin.value = 2
  }else if(userStore.authGrpCd.includes("SPPF002")) {
    isAdmin.value = 1
  }

  if(isAdmin.value === 0) {
    return
  }

  initCodeList()
  getData()

  grdMain1.value.getGridView().filterPanel.visible = true
  grdMain2.value.getGridView().filterPanel.visible = true
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnRegisterModify']"
        :usePermission="false"
        @click-button="onButtonsClick"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <i-select
              label-width="50px"
              width="200px"
              :label="$t('사업부')"
              v-model="selectedBsnsCd"
              
              :items="codeList.bsnscd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :disabled="!(isAdmin > 1)"
            />
            <i-select
              label-width="50px"
              width="240px"
              :label="$t('부서')"
              v-model="selectedDeptCd"
              :items="codeList.deptcd"
              item-title="ASGN_SHRT_NM"
              item-value="DEPT_CD"
              :disabled="!(isAdmin > 1)"
            />
            <i-select
              label-width="50px"
              width="240px"
              :label="$t('공정설비')"
              v-model="searchParams.PROCESS_CD"
              :items="codeList.process"
              item-title="PROCESS_NM"
              item-value="PROCESS_CD"
            />
          </div>
        </v-sheet>
        <VRow no-gutters>
          <VCol cols="4 pa-2">
            <RealGrid
              ref="grdMain1"
              style="height: 100%"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys" 
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
              :column-layout="grdMain1Props.columnLayout"   
              @onCellClicked="(a, b) => onCellClicked(a, b, 'grdMain1')"
            />
          </VCol>
          <VCol cols="2" class="pa-2">
            <RealGrid
              ref="grdMain2"
              style="height: 100%"
              :grid-view-option="grdMain2Props.gridViewOption"
              :keys="grdMain2Props.keys" 
              :fields="grdMain2Props.fields"
              :columns="grdMain2Props.columns"
              :column-layout="grdMain2Props.columnLayout"
              @onCellClicked="(a, b) => onCellClicked(a, b, 'grdMain2')"
            />
          </VCol>
          <VCol cols="6" class="pa-2">
            <RealGrid
              ref="grdMain3"
              style="height: 100%"
              :grid-view-option="grdMain3Props.gridViewOption"
              :keys="grdMain3Props.keys" 
              :fields="grdMain3Props.fields"
              :columns="grdMain3Props.columns"
              :column-layout="grdMain3Props.columnLayout"
              @onCellDblClicked="(a, b) => onCellDblClicked(a, b, 'grdMain3')"
            />
          </VCol>
        </VRow>
        <VRow no-gutters>
          <VCol class="pa-2 pt-0 pb-0">
            <div class="d-flex">
              <IGridTitle 
                :title="$t('변경이력확인')"            
              >
                <template #editors />
              </IGridTitle>
              <span class="mt-2" style="color: orange">
                ※ 변경사유 등록 후 파일을 첨부하지 않았다면 행을 더블클릭하세요.
              </span>
            </div>
            <RealGrid
              ref="grdSub"
              style="height: calc(100% - 50px);"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys" 
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"      
              @onCellDblClicked="(a, b) => onCellDblClicked(a, b, 'grdSub')"
            />
          </VCol>
        </VRow>
      </div>
      <SPPFC0010Popup ref="sPPFC0010Popup" @up-data="upData" />
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
</style>