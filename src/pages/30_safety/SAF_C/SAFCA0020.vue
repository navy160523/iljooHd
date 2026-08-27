<!-- 2024.06.20(시작일) 생산매니저 점검 대상자 관리 -->
<!-- 개발 : 김홍규 -->

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
} from '@hiway/api/commonApi'

import {commonSampleDownFilesApi} from '@hiway/api/commonFileApi'

import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'

// 쿼리 작동
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from '@/utils/excel'

// 팝업
import EmpPopup from '@/pages/30_safety/SAF_C/SAFCA0020PopUp.vue'

defineOptions({
  name: '30_safety-SAF_C-SAFCA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)

let excelParams = []

/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: '', // 부서 코드
})

/* 코드 리스트 */
const codeList = reactive({
  BSNS_CD: [], // 사업부 목록
  DEPT_CD: [], // 부서 목록
})

// 초기 조회 코드 생성
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        USE_DIV: 'Y',
      },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: userStore.bsnsCd,
        USE_DIV: 'Y',
      },
    }), // 부서
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR

    // codeList.DATE_LIST.unshift({ TXT:'전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: false } },
  keys: [],
  fields: [
    {
      fieldName: 'ASGN_NM',
      width: '500',
      dataType: 'text',
      header: { text: t('소속') },
    },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') } },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') } },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') } },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('이름') } },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      header: { text: t('비고') },
      visible: false,
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', visible: false },
    { fieldName: 'BIRTH_DAY', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnCreate') {
    empPopup.value.openPopup({
      MULTI: true,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD,
    })
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnExcelUpload') {
    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function (event) {
      const selectedFile = event.target.files[0]
      console.log('selectedFile', selectedFile)
      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  } else if (btn.id === 'btnFormDownload') {
    // 샘플 기능 추후 활성화
    let params = {
      FILE_PATH: 'SAFC',
      FILE_NAME: '생산매니저업로드양식.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelDownload') {
    const excelFileNM = '생산매니저 점검 대상자 관리'
    const now = dayjs(new Date()).format('YYYYMMDDHHmm')
    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: now + '_' + excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.',
      showProgress: true,
      indicator: 'visible',
      header: 'visible',
      footer: 'hidden',
      showColumns: [],
      hideColumns: [],
      allColumns: false,
    })
  }
}

// 조회로직
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFCA0020_SEARCH_01',
    param: searchParams,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장로직
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  console.log()
  if (checkedRows.length < 1) {
    Message.warn('선택된 행이 없습니다.')
    return
  }

  return true
}

const saveData = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  console.log('checkedRows', checkedRows)

  checkedRows.forEach((e) => {
    const data = grdMain.value.getRowData(e)
    data.USER_ID = userStore.userId
    saveParams.push(data)
  })

  console.log('saveParams', saveParams)

  return commonExecuteApi({ queryId: 'SAFCA0020_SAVE_01', list: saveParams })
}

// 삭제로직
const beforeDelete = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if (checkedRows.length < 1) {
    Message.warn('선택된 행이 없습니다.')
    return
  }

  return true
}

const deleteData = () => {
  let deleteParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  checkedRows.forEach((e) => {
    const data = grdMain.value.getRowData(e)
    deleteParams.push(data)
  })

  return commonExecuteApi({
    queryId: 'SAFCA0020_DELETE_01',
    list: deleteParams,
  })
}

// 엑셀업로드
const excelUploadCallback = async (excelData) => {
  excelParams = []

  console.log('excelData', excelData)
  var mappedData = excelData.map((item) => {
    return {
      // 그리드 필드명  : 엑셀파일 해더
      CMPNY_DIV: searchParams.CMPNY_DIV,
      EMP_NO: item.사번,
      USER_ID: userStore.userId,
      // REMARK: item.비고,
    }
  })

  const uniqueData = Array.from(
    new Set(mappedData.map((item) => item.EMP_NO))
  ).map((employeeNo) => {
    return mappedData.find((item) => item.EMP_NO === employeeNo)
  })
  console.log('uniqueData', uniqueData)

  let ck = await vm.$swal({
    title: t('저장 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')
    return
  } else {
    if (uniqueData.length > 0) {
      commonExecuteApi({ queryId: 'SAFCA0020_SAVE_01', list: uniqueData }).then(
        (res) => {
          onButtonsClick({ id: 'btnSearch' })
        }
      )
    } else {
      Message.err('저장할 데이터가 없습니다.')
    }
  }
}

const selected = (val) => {
  console.log('select emp val', val)
  val.forEach((e) => {
    grdMain.value.addRow({
      CMPNY_DIV: e.CMPNY_DIV,
      BSNS_CD: e.BSNS_CD,
      DEPT_CD: e.DEPT_CD,
      ASGN_CD: e.ASGN_CD,
      ASGN_NM: e.ASGN_NM,
      KOR_NM: e.EMP_NM,
      EMP_NO: e.EMP_NO,
      JOB_TIT_CD: e.JOB_TIT_CD,
      JOB_TIT_NM: e.JOB_TIT_NM,
      OFFI_RES_CD: e.OFFI_RES_CD,
      OFFI_RES_NM: e.OFFI_RES_NM,
    })
  })
}

//사업부가 바뀌면 협력사 데이터 가져옴
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    // console.log("부서 데이터",newValue)
    if (newValue === null || newValue === '') {
      codeList.DEPT_CD = []
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      searchParams.DEPT_CD = codeList.BSNS_CD[0].COD
      return
    }
    searchParams.DEPT_CD = ''
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV: 'Y',
      },
    }).then((res) => {
      // console.log('dept_cd lsit',res)
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)
</script>

<template>
  <v-card class="pa-1 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',
          'btnCreate',
          'btnUpdate',
          'btnDelete',
          'btnExcelUpload',
          'btnFormDownload',
          'btnExcelDownload',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet height="100%" style="display: flex; flex-direction: row">
          <v-sheet width="100%" style="padding-right: 5px">
            <v-sheet
              class="searchArea"
              style="display: flex; flex-direction: row"
            >
              <v-sheet style="display: flex; flex-direction: row">
                <i-select
                  :label="$t('사업부')"
                  label-width="40px"
                  width="220px"
                  v-model="searchParams.BSNS_CD"
                  :items="codeList.BSNS_CD"
                  item-value="BSNS_CD"
                  item-title="BSNS_NM"
                />
                <i-select
                  :label="$t('부서')"
                  label-width="40px"
                  width="250px"
                  v-model="searchParams.DEPT_CD"
                  :items="codeList.DEPT_CD"
                  item-value="DEPT_CD"
                  item-title="DEPT_NM"
                />
              </v-sheet>
              <v-sheet
                style="
                  width: -webkit-fill-available;
                  display: flex;
                  align-items: center;
                  flex-direction: row-reverse;
                  padding-right: 10px;
                "
              >
                <h3>&nbsp;중복 인원은 생략됩니다.</h3>
                <v-icon icon="mdi-alert-rhombus-outline" size="28"></v-icon>
              </v-sheet>
            </v-sheet>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="selected" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 200px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 600px;
  }
}
</style>
