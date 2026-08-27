<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import CLDAE0010Popup01 from './CLDAE0010Popup01.vue'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { getJsonFromExcel } from '@/utils/excel'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useCommonStore } from '@hiway/stores/common'
defineOptions({
  name: '110_cladding-CLD_A-CLDAE0010',
})

const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const menuTitle = ref(null)
const userStore = useUserStore()
const userLogStore = useLogsStore()
const grdMain = ref(null)
const cLDAE0010Popup01 = ref(null)
const commonStore = useCommonStore()
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear(), //년도
  REQ_CHA: '', ///신청시기
  BSNS_CD: '', //사업부
  USER_DIV: '', //조직구분
})

const codeList = reactive({
  REQ_CHA: [], //신청시기
  BSNS_CD: [], //사업부
  USER_DIV: [], //소속구분 직영:A 협력사 :B
  CLOTHE_GUBUN: [], //피복종류
  INITIAL_YN: [
    { TXT: 'Y', COD: 'Y' },
    { TXT: 'N', COD: 'N' },
  ],
})

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIT050'),
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    getCodeList('HHIZ020'),
    getCodeList('HHIT010'),
  ]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    //단기공사,기타 제외
    codeList.USER_DIV = res[2].ORESULT_CUR.filter((x) => !['Z', 'D'].includes(x.COD))
    codeList.CLOTHE_GUBUN = res[3].ORESULT_CUR.filter((x) => !['4'].includes(x.COD))
    codeList.REQ_CHA.unshift({ TXT: '전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.USER_DIV.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('REQ_CHA', codeList.REQ_CHA, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CLOTHE_GUBUN', codeList.CLOTHE_GUBUN, 'COD', 'TXT')
    grdMain.value.setBindingColumn('INITIAL_YN', codeList.INITIAL_YN, 'COD', 'TXT')
    console.log('codeList.CLOTHE_GUBUN', codeList.CLOTHE_GUBUN)
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'REQ_CHA',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('신청시기') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'CLOTHE_GUBUN',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('피복종류') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('소속') },
    },
    {
      fieldName: 'GUBUN',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('구분') },
    },
    {
      fieldName: 'DUTY_YN',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('대상여부') },
    },
    {
      fieldName: 'EMP_NO',
      width: '20',
      editable: false,
      header: { text: t('사번') },
    },

    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('직책') },
    },
    {
      fieldName: 'OFFI_RES_DATE',
      dataType: 'text',
      width: '25',
      editable: false,
      header: { text: t('직책보임일자') },
    },
    {
      fieldName: 'INITIAL_YN',
      dataType: 'text',
      styleName: 'editable_column',
      width: '20',
      header: { text: t('초도지급 여부') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REMARKS',
      width: '100',
      styleName: 'left-column',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },

    //안보이는컬럼
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'ASGN_CD',
      visible: false,
      header: { text: t('조직코드') },
    },
    {
      fieldName: 'BSNS_CD',
      visible: false,
      header: { text: t('사업부코드') },
    },
    {
      fieldName: 'DEPT_CD',
      visible: false,
      header: { text: t('부서코드') },
    },
    {
      fieldName: 'YEAR',
      visible: false,
      header: { text: t('년도') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()
  //  onButtonsClick({ id: 'btnSearch' })
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnCreate') {
    cLDAE0010Popup01.value.openPopup()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  } else if (btn.id === 'btnExcelDownload') {
    //운영
    let params = {
      FILE_PATH: 'CLDA',
      FILE_NAME: '강제대상관리 양식.xlsx',
    }
    //로컬 테스트용
    // let params = {
    //   PATH: '',
    //   FILE_PATH: '',
    //   FILE_NAME: '강제대상관리 양식.xlsx',
    // }
    commonSampleDownFilesApi(params)
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

const excelUploadCallback = async (excelData) => {
  commonStore.loading = true //로딩바 오픈
  let mappedItemArray = []
  if (excelData.length === 0) {
    Message.err('엑셀 데이터를 입력해주세요.')
    commonStore.loading = false
    return false
  }

  for (let i = 0; i < excelData.length; i++) {
    const item = excelData[i]
    //모든 엑셀 데이터 검증후에 행추가
    if (!item.피복구분) {
      Message.err(i + 2 + '번 행의 피복구분 값이 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!item.사번) {
      Message.err(i + 2 + '번 행의 사번 값이 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!item.대상여부) {
      Message.err(i + 2 + '번 행의 대상여부 값이 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    }

    // 필요한 데이터 매핑 후 추가
    //관리감독자 피복이면 0 SAFE클로버 피복이면 1 안전피복이면 2
    mappedItemArray.push({
      CLOTHE_GUBUN:
        item.피복구분 === '관리감독자 피복(직영)'
          ? 0
          : item.피복구분 === '관리감독자 피복(협력)'
          ? 1
          : item.피복구분 === '안전 피복(직영)'
          ? 2
          : item.피복구분 === '안전 피복(협력)'
          ? 3
          : '',
      EMP_NO: item.사번,
      DUTY_YN: item.대상여부,
      REMARKS: item.비고,
    })
  }
  for (let i = 0; i < mappedItemArray.length; i++) {
    grdMain.value.addRow(mappedItemArray[i])
  }
  commonStore.loading = false //로딩바 닫기
  Message.info('엑셀 업로드가 완료되었습니다.')
}

//저장관련 로직 시작
const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv, //회사구분
      EMP_NO: data.EMP_NO,
      YEAR: data.YEAR,
      USER_DIV: data.USER_DIV,
      REQ_CHA: data.REQ_CHA,
      USER_DIV: data.USER_DIV,
      BSNS_CD: data.BSNS_CD,
      DEPT_CD: data.DEPT_CD,
      ASGN_CD: data.ASGN_CD,
      DUTY_YN: data.DUTY_YN,
      INITIAL_YN: data.INITIAL_YN,
      CLOTHE_GUBUN: data.CLOTHE_GUBUN,
      REMARKS: data.REMARKS,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDAE0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//저장관련 로직 끝

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'CLDAE0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

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
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV, //회사구분
      YEAR: data.YEAR,
      REQ_CHA: data.REQ_CHA,
      EMP_NO: data.EMP_NO,
    }
    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'CLDAE0010_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//그리드 셀 더블클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  cLDAE0010Popup01.value.openPopup2(data)
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnExcelDownload', 'btnExcelUpload']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select :label="$t('년도')" width="150px" type="YEAR" v-model="searchParam.YEAR"> </i-select>
            <i-select
              :label="$t('신청시기')"
              width="200px"
              labelWidth="50px"
              :items="codeList.REQ_CHA"
              item-title="TXT"
              item-value="COD"
              v-model="searchParam.REQ_CHA"
            >
            </i-select>
            <i-select
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              width="250px"
              labelWidth="50px"
              v-model="searchParam.BSNS_CD"
            >
            </i-select>
            <i-select
              :label="$t('조직구분')"
              :items="codeList.USER_DIV"
              item-title="TXT"
              item-value="COD"
              width="200px"
              labelWidth="50px"
              v-model="searchParam.USER_DIV"
            >
            </i-select>
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <CLDAE0010Popup01 ref="cLDAE0010Popup01" @Saved="() => onButtonsClick({ id: 'btnSearch' })"></CLDAE0010Popup01>
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
