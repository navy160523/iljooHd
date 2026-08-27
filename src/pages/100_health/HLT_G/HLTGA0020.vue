<!-- 
  화면명 : 특수검진 CAS 번호 관리
  작성자: 일주지앤에스 SI1팀 박재형 선임
-->
<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import { forEach } from 'lodash-es'
import _ from 'lodash'
defineOptions({
  name: '100_health-HLT_G-HLTGA0020',
})
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { getJsonFromExcel } from "@/utils/excel"
import { useCommonStore } from '@hiway/stores/common'
import { isEmpty } from '@/@core/utils'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const logsStore = useLogsStore()
const fileUploadPopup = ref(null)
const Popup = ref(null)
const Popup2 = ref(null)
const saveParams = reactive([]);
let selectedRow = ref([]);
let selectedRow2 = ref([]);
let fileCheck = null;
const commonStore = useCommonStore()
const isAdmin = ref(false)


const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  GUBUN: '',
})

const searchParam2 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  GUBUN: '',
})

const codeList = reactive({
  GUBUN: [
    { COD: '0', TXT: '일반' },
    { COD: '1', TXT: '기타' },
  ],
})


const initCodeList = () => {
    grdMain.value.setBindingColumn('GUBUN', codeList.GUBUN, 'COD', 'TXT')
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }else if (btn.id === "btnCreate") {
    addData();
  }else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
    .run()
  }else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(afterDelete)
    .run()
  } else if (btn.id === 'btnFormDownload'){
    let params = {
      FILE_PATH: 'HLTF',
      FILE_NAME: '특수검진 CAS 번호 관리 샘플.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelUpload') {
    vm.$swal({
      title: t('특수검진 CAS 번호 관리를 업로드 하시겠습니까?'),
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed === true) {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = function(event) {
          commonStore.loading = true
          const selectedFile = event.target.files[0]
          // 선택된 파일에 대한 처리
          getJsonFromExcel(selectedFile, excelUploadCallback)
        }
        input.click()
      } else {
        commonStore.loading = false 
      }
    })

    }

}

// console.log('서치파람:', searchParam) 
const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTGA0020_SEARCH_01',
    param: searchParam,
  })
}
const afterSearch = (res) => {
  // console.log("resss", res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const beforeSave = () => {
  const chekedRow = grdMain.value.getGridView().getCheckedRows()
  const allRows = grdMain.value.getDataProvider().getJsonRows();
  // console.log("chekedRow", chekedRow)
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  
  // 체크된 행중 CASNO, 검진 유해인자 검증
  for (const rowIndex of chekedRow) {
    const rowData = grdMain.value.getDataProvider().getJsonRow(rowIndex); 
    if (!rowData.GUBUN) {
      Message.warn(t('구분자를 입력하세요.'));
      return false;
    }

    if (!rowData.CASNO) {
      Message.warn(t('CAS 번호를 입력하세요.'));
      return false;
    }

    if (!rowData.EXAM_FACTOR) {
      Message.warn(t('검진 유해인자를 입력하세요.'));
      return false;
    }
  }

  for (const rowIndex of chekedRow) {
    const { CASNO } = grdMain.value.getDataProvider().getJsonRow(rowIndex);

    if (!CASNO) continue;

    // 전체 행에서 같은 CAS번호가 있는지 확인
    const isDuplicate = allRows.some((row, idx) => {
      return (
        idx !== rowIndex &&
        row.CASNO?.trim() === CASNO?.trim()
      );
    });

    if (isDuplicate) {
      Message.warn(`동일한 CAS 번호가 존재합니다.`);
      return false;
    }
  }

  saveParams.length = 0;

  chekedRow.forEach(val => {
    let rowData = grdMain.value.getDataProvider().getJsonRow(val); // 사용자가 입력한 값 가져오기
    // console.log("rowData : ", rowData)

    saveParams.push({
      CMPNY_DIV: rowData.CMPNY_DIV, // 회사 구분 (고정값) 
      GUBUN: rowData.GUBUN,
      CASNO: rowData.CASNO,
      CHECKBOX: rowData.CHECKBOX,
      EXAM_FACTOR: rowData.EXAM_FACTOR,
      CASNM_KOR: rowData.CASNM_KOR,
      CASNM_ENG: rowData.CASNM_ENG,
      USER_ID: userStore.userId, // 사용자 ID (고정값)
    });
  });
  // console.log("저장전1", saveParams);
  return true;
}

const saveData = () => {
  // console.log("저장전", saveParams);
  return commonExecuteApi({ queryId : 'HLTGA0020_SAVE_01', list: saveParams })
}

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

  checkedData.forEach(val => {
    let rowData = grdMain.value.getDataProvider().getJsonRow(val); //  체크된 행 데이터 가져오기
    deleteParam.push({
      CMPNY_DIV: rowData.CMPNY_DIV, // 필수 키 값
      CASNO: rowData.CASNO, // 필수 키 값
    });
  });

  return commonExecuteApi({
    queryId: 'HLTGA0020_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const addData = () => {

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const defaultValues = {
    CMPNY_DIV: userStore.cmpnyDiv, 
    INSERT_USER_ID: userStore.userId,
    DIV: 'Y',
    WRITE_DATE: `${yyyy}-${mm}-${dd}`,
    CHECKBOX: ''
  };
  grdMain.value.getDataProvider().insertRow(0, defaultValues);
  grdMain.value.getGridView().checkItem(0, true)
}

// 체크클릭
// window.handleYnCheck = function (rowIndex, value) {
//   const dp = grdMain.value.getDataProvider();
//   dp.setValue(rowIndex, 'CHECKBOX', value); // 값 저장

//   const rowData = dp.getJsonRow(rowIndex);
//   grdMain.value.getGridView().checkItem(rowIndex, true)
//   // console.log('선택한 값:', value);
//   console.log('선택한 행 데이터:', rowData);
// };

// 엑셀 업로드
const excelUploadCallback = async(excelData) => {  
  // debugger
  // console.log('excelData',excelData)
  let errMsg = ''
  let gridData = []
  let addedRows = []

  const existingData = grdMain.value.getDataProvider().getRows();
  // console.log('existingData', existingData)

  //엑셀 데이터 한줄씩 확인
  // excelData.slice(1).map((item, index) => {

  for (let i = 0; i < excelData.length; i++) {
  const item = excelData[i];

    let addRow = {
      CMPNY_DIV: userStore.cmpnyDiv,
      GUBUN: item['구분자( 일반, 기타 )'] === '일반' ? '0'
            : item['구분자( 일반, 기타 )'] === '기타' ? '1'
            : '',  // 혹시나 둘 다 아니면 빈값
      CASNO: item['CAS No.'],
      CHECKBOX: item['기타 추가'],
      EXAM_FACTOR: item['검진 유해인자'],
      CASNM_KOR: item['국문표기'],
      CASNM_ENG: item['영문표기'],
      USER_ID: userStore.userId,
    }    

    //유효성검사
    if (!addRow.GUBUN || addRow.GUBUN.trim() === '') {
      errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : 구분자`;
    } else if (!addRow.CASNO || addRow.CASNO.trim() === '') {
      errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : CAS번호`;
    } else if (!addRow.EXAM_FACTOR || addRow.EXAM_FACTOR.trim() === '') {
      errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : 검진 유해인자`;
    } 
    // else if (!addRow.CASNM_KOR || addRow.CASNM_KOR.trim() === '') {
    //   errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : 국문표기`;
    // } else if (!addRow.CASNM_ENG || addRow.CASNM_ENG.trim() === '') {
    //   errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : 영문표기`;
    // }

    // 유효성 검사 실패 시 메시지 띄우고 데이터 추가하지 않음
    if (errMsg) {
      Message.warn(errMsg);
      return;
    }

    // 엑셀로 추가하는 데이터, 기존 데이터 비교해서 같은 CASNO면 추가 안하게
    const existingRow = existingData.find(row => row[1] === addRow.CASNO);
    if (existingRow) {
      // console.log("111", 12121)
      Message.warn(`(${i + 1}행) (CAS No.: ${existingRow[1]})가 이미 존재합니다. 추가하지 않습니다.`)
    } else {
      // 중복되지 않으면 새로운 데이터를 추가
      gridData.push(addRow);
      addedRows.push(addRow);
      Message.success('업로드 되었습니다.'); 
    }
        
    const upData = existingData.concat(gridData)
    grdMain.value.getDataProvider().setRows(upData);

    // 추가된 행 체크박스 체크
  addedRows.forEach((addedRow, index) => {
    const rowIndex = upData.findIndex(row => row.CASNO === addedRow.CASNO);
    if (rowIndex !== -1) {
      // 추가된 행 체크
      grdMain.value.getGridView().checkItem(rowIndex, true);
    }
  });
  }
  commonStore.loading = false
}


const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } }, 
  keys : [], 
  fields: [
    {
      fieldName: 'GUBUN',
      dataType: 'text',
      width: '30',
      header: { text: t('구분자'), styleName: 'header_validit' },
      lookupDisplay: true,
      editable: true,
      styleName: 'editable_column',
      editor: {
        type: 'dropdown',
        textReadOnly: true, dropDownCount: 2, partialMatch: true, domainOnly: true, dropDownWhenClick: true
      },
    },
    {
      fieldName: 'CASNO',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('CAS No.'), styleName: 'header_validit' },
      'styleCallback' : function(grid, dataCell){
        var ret = { editable : false, styleName : 'editable_column'}
        if(grid.getValue(dataCell.index.itemIndex, 'DIV') == 'Y') {
          ret.editable = true
          ret.style = { background:'#eff8fd' }
        } else {
          ret.editable = false
          ret.style = { background:'#FFFFFF' }
        }
        return ret
      }
    },
    {
      fieldName: 'CHECKBOX',
      dataType: 'text',
      width: '20',
      editable: false,
      styleName: 'editable_column',
      header: { text: t('기타 추가') },
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }
    },
    {
      fieldName: 'EXAM_FACTOR',
      dataType: 'text',
      width: '150',
      editable: true,
      styleName: 'left-column editable_column',
      header: { text: t('검진 유해인자'), styleName: 'header_validit' }
    },
    {
      fieldName: 'CASNM_KOR',
      dataType: 'text',
      width: '50',
      editable: true,
      styleName: 'left-column editable_column',
      header: { text: t('국문표기') },
    },
    {
      fieldName: 'CASNM_ENG',
      dataType: 'text',
      width: '50',
      editable: true,
      styleName: 'left-column editable_column',
      header: { text: t('영문표기') },
    },
    {
      fieldName: 'WRITE_DATE',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'center-column',
      header: { text: t('작성일자') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      width: '150',
      editable: true,
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      dataType: 'text',
      width: '150',
      editable: true,
      visible: false,
      header: { text: t('등록자') },
    },
    {
      fieldName: 'DIV',
      dataType: 'text',
      width: '10',
      editable: true,
      visible: false,
      header: { text: t('구분자') },
    },
  ],
  columns : [],
  columnLayout: []
})
grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true;

  onButtonsClick({ id: "btnSearch" })

  // 건강검진 모듈 관리자, 보건 총괄관리자, admin그룹
  if (userStore.authGrpCd.includes('HLTG001') 
        || userStore.authGrpCd.includes('HIWAYGRP00001')
        || userStore.authGrpCd.includes('GRP00372')
        ) {
        isAdmin.value = true // 관리자
    } else {
        isAdmin.value = false // 일반 사용자
        // menuTitle.value.setBtnProperty('btnVtm', 'visible', false);
        // menuTitle.value.setBtnProperty('btnFormDownload', 'visible', false);
        // menuTitle.value.setBtnProperty('btnExcelUpload', 'visible', false);
    }
})

//사업부 변경시 부서 조회
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <div class="casNo">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnFormDownload', 'btnExcelUpload']"
        @click-button="onButtonsClick"
        :use-permission="true"
      />

      <v-radio-group v-model="searchParam.GUBUN" inline class="casRadio">
        <v-radio label="전체" value="" />
        <v-radio label="일반" value="0" />
        <v-radio label="기타" value="1" />
      </v-radio-group>
    </div>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellItemClicked="onCellItemClicked"
            @onCellEdited ="onCellEdited"
          />
        </v-sheet>
      </div>
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

.casNo {
  position: relative;
}

.casRadio {
  position: absolute;
  top: 4px;
  right: 450px;
}
</style>
