<!-- 
  화면명 : 예방접종이력 관리
  작성자: 일주지앤에스 SI1팀 박재형 선임
-->
<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import { forEach } from 'lodash-es'
import _ from 'lodash'
defineOptions({
  name: '100_health-HLT_L-HLTLA0030',
})
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import HLTLA0030Popup from "./HLTLA0030Popup.vue"
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
const allData = reactive({ list: [] })
let upFlag = false


const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  EMP_NO: '',
  EMP_NM: '',
  INFEC_NM: '',
  VACCINE_DATE: '',
  ST_VACCINE_DATE: '',
  ED_VACCINE_DATE: ''
})

const searchParam2 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})

const codeList = reactive({ 
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  ASGN_CD: [],
  COUNTRY_NM: [], //국가
  VACCINE_KIND: [], //백신
})

const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' },
    }),
    //협력사조회
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, DEPT_CD: searchParam.DEPT_CD, USE_DIV: 'Y' },
    }),
    //국가코드
    getCodeList('HHIZNATN_CD'),
    //백신종류
    // getCodeList('HHIIJ10'),
    //예방접종 종류
    commonSearchApi({ queryId: 'HLTLA0030_SEARCH_02', param: searchParam2 }), 
    getCodeList('HHII840A1'),
    getCodeList('HHII840A2'),
    getCodeList('HHII840A3'),
    getCodeList('HHII840A4'),
    //SCMS 국가코드
    commonSearchApi({ queryId: 'HLTLA0030_SEARCH_04', param: searchParam2 }), 
  ]).then((res) => {
    // console.log('res', res)
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.ASGN_CD = res[2].ORESULT_CUR
    codeList.CON = res[3].ORESULT_CUR
    let list = res[4]?.ORESULT_CUR ?? [];
    codeList.VACLIST = res[4].ORESULT_CUR

    codeList.INFEC1 = res[5].ORESULT_CUR  
    codeList.INFEC2 = res[6].ORESULT_CUR  
    codeList.INFEC3 = res[7].ORESULT_CUR  
    codeList.INFEC4 = res[8].ORESULT_CUR  
    codeList.CONSCMS = res[9].ORESULT_CUR 

    codeList.allInfecSearch = [
      { TXT: "전체", COD: "" },
      ...codeList.INFEC1,
      ...codeList.INFEC2,
      ...codeList.INFEC3,
      ...codeList.INFEC4
    ];
    codeList.allInfec = [
      ...codeList.INFEC1,
      ...codeList.INFEC2,
      ...codeList.INFEC3,
      ...codeList.INFEC4
    ];
    // console.log("list", list)
    list.sort((a, b) => Number(a.MAG_NO) - Number(b.MAG_NO));
    codeList.VACCINE_KIND = list
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    codeList.COUNTRY_NM.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('VACCINE_KIND', codeList.VACCINE_KIND, 'VAC_CD', 'VAC_NM')
    grdMain.value.setBindingColumn('INFEC_NM', codeList.allInfec, 'COD', 'TXT')
    // console.log("VACCINE_KIND", codeList.VACCINE_KIND)
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  })
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }else if (btn.id === "btnCreate") {
    addData();
  }else if (btn.id === "btnUpdate") {
    if(upFlag){
      new saveFlowHelper(vm, t)
      .showMessage(false)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
        upFlag = false
        NEW = 'N'
      })
      .run()
    }else{
      new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
        NEW = 'N'
      })
      .run()
    }

  }else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(afterDelete)
    .run()
  } else if (btn.id === "btnVtm"){
    Popup2.value.openPopup(allData.list)
  } else if (btn.id === 'btnFormDownload'){
    let params = {
      FILE_PATH: 'HLTF',
      FILE_NAME: '예방접종이력 관리 샘플.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelUpload') {
    vm.$swal({
      title: t('예방접종이력 관리를 업로드 하시겠습니까?\n예방접종 종류는 접종종류 관리에서 확인 후 작성하셔야 합니다.'),
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
    queryId: 'HLTLA0030_SEARCH_01',
    param: searchParam,
  })
}
const afterSearch = (res) => {
  const list = res.ORESULT_CUR.map(item => {
    // vaccine kind 이름 찾아오기
    const kind = codeList.VACCINE_KIND.find(code => String(code.VAC_CD) === item.VACCINE_KIND)
    const name = kind ? kind.VAC_NM : ''
    return {
      ...item,
      VACCINE_KIND_NM: name
    }
  })
  allData.list = list
  // console.log("resss", allData)
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
  
  // 체크된 행중 예방접종종류, 접종일자 검증
  for (const rowIndex of chekedRow) {
    const rowData = grdMain.value.getDataProvider().getJsonRow(rowIndex);
    if (!rowData.EMP_NM) {
      Message.warn(t('인원 정보를 입력해주세요.'));
      return false;
    }

    if (!rowData.INFEC_NM) {
      Message.warn(t('감염병 종류를 입력해주세요.'));
      return false;
    }

    // if (!rowData.VACCINE_KIND) {
    //   Message.warn(t('예방접종 종류를 입력해주세요.'));
    //   return false;
    // }

    if (!rowData.VACCINE_DATE) {
      Message.warn(t('접종일자를 입력해주세요.'));
      return false;
    }
  }

  for (const rowIndex of chekedRow) {
    const { EMP_NO, VACCINE_DATE } = grdMain.value.getDataProvider().getJsonRow(rowIndex);

    if (!EMP_NO || !VACCINE_DATE) continue;

    // 전체 행에서 같은 사번 + 접종일자 조합이 있는지 확인
    const isDuplicate = allRows.some((row, idx) => {
      return (
        idx !== rowIndex &&
        row.EMP_NO === EMP_NO &&
        row.VACCINE_DATE === VACCINE_DATE
      );
    });

    if (isDuplicate) {
      Message.warn(`사번 ${EMP_NO}의 접종일자 ${VACCINE_DATE}가 이미 존재합니다.`);
      return false;
    }
  }

  saveParams.length = 0;

  chekedRow.forEach(val => {
    let rowData = grdMain.value.getDataProvider().getJsonRow(val); // 사용자가 입력한 값 가져오기
    // console.log("rowData : ", rowData)

    saveParams.push({
      CMPNY_DIV: rowData.CMPNY_DIV, // 회사 구분 (고정값)
      VC_NO: rowData.VC_NO,
      BSNS_CD: rowData.BSNS_CD,
      DEPT_CD: rowData.DEPT_CD,
      ASGN_CD: rowData.ASGN_CD,
      ASGN_SHRT_NM: rowData.ASGN_SHRT_NM,
      EMP_NO: rowData.EMP_NO,
      EMP_NM: rowData.EMP_NM,
      JOB_TIT_CD: rowData.JOB_TIT_CD,
      JOB_TIT_NM: rowData.JOB_TIT_NM,
      COUNTRY_NM: rowData.COUNTRY_NM,
      VACCINE_KIND: rowData.VACCINE_KIND,
      VACCINE_DATE: rowData.VACCINE_DATE,
      REMARK: rowData.REMARK,
      INFEC_NM: rowData.INFEC_NM,
      FILE_ID: rowData.FILE_ID,
      INSERT_USER_NM: userStore.userName,
      USER_ID: userStore.userId, // 사용자 ID (고정값)
    });
  });
  return true;
}

const saveData = () => {
  // console.log("저장전", saveParams);
  return commonExecuteApi({ queryId : 'HLTLA0030_SAVE_01', list: saveParams })
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
      VC_NO: rowData.VC_NO, // 필수 키 값
    });
  });

  return commonExecuteApi({
    queryId: 'HLTLA0030_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const addData = () => {
  const defaultValues = {
    CMPNY_DIV: userStore.cmpnyDiv,
    DEPT_CD: '',
    VEND_CD: '',
    EMP_NO: '',
    EMP_NM: '',
    JOB_TIT_NM: '',
    COUNTRY_NM: '',
    INSERT_USER_NM: userStore.userName,
    VACCINE_KIND: '',
    VACCINE_DATE: '',
    REMARK: '',
    INFEC_NM: '',
    NEW: 'Y' // 새로만든행 Y, 저장하면 N
  };
  grdMain.value.getDataProvider().insertRow(0, defaultValues);
  grdMain.value.getGridView().checkItem(0, true)
}


// 인원검색 후 데이터 추가
const addToMainGrid = async (selectedData) => {
  // console.log(" 부모 컴포넌트에서 받은 데이터:", selectedData);
  // console.log(" 입력할 행:", selectedRow);

  const today = new Date().toISOString().split('T')[0];

  // DEPT_CD(부서 코드)로 DEPT_NM(부서명) 찾기
  const bsnsInfo = codeList.BSNS_CD.find(bsns => bsns.BSNS_CD === selectedData.BSNS_CD);
  const bsnsName = bsnsInfo ? bsnsInfo.BSNS_NM : ""; // 만약 코드가 없으면 기본값 설정

  // DEPT_CD(부서 코드)로 DEPT_NM(부서명) 찾기
  const deptInfo = codeList.DEPT_CD.find(dept => dept.DEPT_CD === selectedData.DEPT_CD);
  const deptName = deptInfo ? deptInfo.DEPT_NM : ""; // 만약 코드가 없으면 기본값 설정


  const dataProvider = grdMain.value.getDataProvider();

  // 중복 체크: 현재 그리드에 EMP_NO가 이미 존재하는지 확인
  // const existingRows = dataProvider.getJsonRows();
  // const isDuplicate = existingRows.some(row => row.EMP_NO === selectedData.EMP_NO);
  // if (isDuplicate) {
  //   // console.error(" 이미 존재하는 EMP_NO입니다:", selectedData.EMP_NO);
  //   Message.warn(" 이미 추가된 인원입니다!");
  //   return; // 중복이면 추가하지 않음
  // }

  if (selectedRow !== null) {
    let countryNm = null;
    // 1차: CONSCMS에서 NATN_CD 매칭
    const matchedCon = codeList.CON.find(con => con.COD === selectedData.NATN_CD);
    if (matchedCon) {
      countryNm = matchedCon.TXT;
    } else {
      // 2차: CON에서 EMP_NO 매칭
      const matchedScms = codeList.CONSCMS.find(scms => scms.EMP_ID === selectedData.EMP_NO);
      if (matchedScms) {
        countryNm = matchedScms.NATIONAL_NM;
      }
    }

    dataProvider.updateRow(selectedRow.itemIndex, {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: selectedData.BSNS_CD,
      BSNS_NM: bsnsName,
      DEPT_CD: selectedData.DEPT_CD,
      DEPT_NM: deptName,
      ASGN_CD: selectedData.ASGN_CD,
      ASGN_SHRT_NM: selectedData.ASGN_SHRT_NM,
      EMP_NM: selectedData.EMP_NM,
      JOB_TIT_NM: selectedData.JOB_TIT_NM,
      EMP_NO: selectedData.EMP_NO,
      EMAIL: selectedData.EMAIL,
      COUNTRY_NM: countryNm
    });

    // console.log(" 기존 행 업데이트 완료!", selectedRow);
  }
  selectedRow = null;
};

// 파일 업로드 후
const uploaded = async (val) => { 
  // console.log("val", val)
  // console.log("selectedRow2", selectedRow2)
  fileCheck = val.fileId

if (val.STATUS === 'delete') {
  // console.log("val.fileId1111", fileCheck)
  if (selectedRow2.value !== null) {
    // 파일업로드, 삭제 시 구분자를 true로 하고 저장로직에 메세지 안띄우는 용도
    upFlag = true

    // console.log("업로디드")
    grdMain.value.getDataProvider().setValue(
      selectedRow2.value,  // 저장해둔 dataRow
      'FILE_ID',
      ''               // 팝업에서 전달된 파일 ID
    );
    const rowIdx = selectedRow2.value;
    grdMain.value.getGridView().checkItem(rowIdx, true);
    // Message.warn('파일 업로드 후 저장해야합니다.')

    // closePopup이 업로드컴포넌트 defineExpose에 없어서 안됌
    // fileUploadPopup.value.closePopup()
    onButtonsClick({ id: 'btnUpdate' })
  }
} else {
  // console.log("val.fileId2222", fileCheck)
  if (selectedRow2.value !== null) {
    // 파일업로드, 삭제 시 구분자를 true로 하고 저장로직에 메세지 안띄우는 용도
    upFlag = true

    // console.log("업로디드")
    grdMain.value.getDataProvider().setValue(
      selectedRow2.value,  // 저장해둔 dataRow
      'FILE_ID',
      fileCheck               // 팝업에서 전달된 파일 ID
      );
      const rowIdx = selectedRow2.value;
      grdMain.value.getGridView().checkItem(rowIdx, true);
      
      // fileUploadPopup.value.closePopup()
      onButtonsClick({ id: 'btnUpdate' })

    // Message.warn('파일 업로드 후 저장해야합니다.')
  }
}
}

// 엑셀 업로드
const excelUploadCallback = async(excelData) => {  
  // debugger
  // console.log('excelData',excelData)
  let errMsg = ''
  let gridData = []
  let addedRows = []

  const existingData = grdMain.value.getDataProvider().getRows();

  //엑셀 데이터 한줄씩 확인
  // excelData.slice(1).map((item, index) => {

  for (let i = 0; i < excelData.length; i++) {
  const item = excelData[i];

  // console.log(item);
  // console.log("회사코드:", item['회사코드']);

    // 사번으로 사업부 코드, 부서 코드 찾아오기
    // console.log("item['사번'] : ", typeof item['사번'])
    const A = item['회사코드']
    const B = item['사번']
    // console.log("A", A)
    // console.log("B", B)
    const searchParam = {
      CMPNY_DIV: A,
      EMP_NO: B
    };
    const res = await commonSearchApi({ 
      queryId: 'HLTLA0030_SEARCH_03',
      param: searchParam
    })
    // console.log("엑셀업로드 인원검색 : ", res)

    // 조회 결과 1건 기준
    const empInfo = res.ORESULT_CUR?.[0] || {};

    // console.log("empInfo", empInfo)

    const vaccineDate = formatDate(item['접종일자']);
    // 엑셀에서 날짜가 들어올때 -1 돼서 들어와서 +1 해줌
    let formattedDate = vaccineDate;
    if (vaccineDate && !isNaN(new Date(vaccineDate).getTime())) {
        let dateObj = new Date(vaccineDate);  // 날짜 객체로 변환
        dateObj.setDate(dateObj.getDate() + 1);  // 날짜 +1 처리
        formattedDate = dateObj.toISOString().split('T')[0];  // YYYY-MM-DD 형식으로 변환
    }

    let addRow = {
      CMPNY_DIV: item['회사코드'],
      EMP_NO: item['사번'],
      EMP_NM: item['성명'],
      COUNTRY_NM: item['국적'],
      VACCINE_KIND: item['예방접종종류'],
      VACCINE_DATE: formattedDate,
      REMARK: item['비고'],
      BSNS_CD: empInfo.BSNS_CD || '',
      DEPT_CD: empInfo.DEPT_CD || '',
      ASGN_CD: empInfo.ASGN_CD || '',
      JOB_TIT_CD: empInfo.JOB_TIT_CD || '',
      JOB_TIT_NM: empInfo.JOB_TIT_NM || '',
      INSERT_USER_NM: userStore.userName,
      USER_ID: userStore.userId,
    }    

    //유효성검사
      if (!addRow.CMPNY_DIV || addRow.CMPNY_DIV.trim() === '') {
      errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : 회사코드`;
    } else if (!addRow.EMP_NO || addRow.EMP_NO.trim() === '') {
      errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : 사번`;
    } else if (!addRow.EMP_NM || addRow.EMP_NM.trim() === '') {
      errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : 성명`;
    } else if (!addRow.VACCINE_KIND || addRow.VACCINE_KIND.trim() === '') {
      errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : 예방접종종류`;
    } else if (!addRow.VACCINE_DATE || addRow.VACCINE_DATE.trim() === '' || isNaN(new Date(addRow.VACCINE_DATE).getTime())) {
      errMsg = `데이터 누락이 있습니다. ${(i + 1)}번째 행 : 접종일자`;
    }

    // 유효성 검사 실패 시 메시지 띄우고 데이터 추가하지 않음
    if (errMsg) {
      Message.warn(errMsg);
      return;
    }

    // 엑셀로 추가하는 데이터, 기존 데이터 비교해서 같은 사번이 접종일자도 같으면 추가 안하게
    const existingRow = existingData.some(row => row[2] === addRow.EMP_NO && row[8] === addRow.VACCINE_DATE);
    if (existingRow) {
      Message.warn(`사번 ${addRow.EMP_NO}의 접종일자 ${addRow.VACCINE_DATE}가 이미 존재합니다. 추가하지 않습니다.`)
    } else {
      // 사번과 접종일자가 중복되지 않으면 새로운 데이터를 추가
      gridData.push(addRow);
      addedRows.push(addRow);
      // Message.warn(`사번 ${addRow.EMP_NO}의 접종일자 ${addRow.VACCINE_DATE}가 추가되었습니다.`);
    }
        
    const upData = existingData.concat(gridData)
    grdMain.value.getDataProvider().setRows(upData);

    // 추가된 행 체크박스 체크
  addedRows.forEach((addedRow, index) => {
    const rowIndex = upData.findIndex(row => row.EMP_NO === addedRow.EMP_NO);
    if (rowIndex !== -1) {
      // 추가된 행 체크
      grdMain.value.getGridView().checkItem(rowIndex, true);
    }
  });
  }
  commonStore.loading = false

  // if(!isEmpty(errMsg)) {
  //   Message.err(t(errMsg))
  // }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 0부터 시작하므로 +1
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // 'YYYY-MM-DD' 형식으로 변환
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys : [], 
  fields: [
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('부서명') }, 
      // styleName: 'left-column',
    },
    {
      fieldName: 'ASGN_SHRT_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('소속명') },
      // styleName: 'left-column',
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('성명'), styleName: 'header_validit' },
      // required: true,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'EMP_NM')
          const saveYn = grid.getValue(cell.index.itemIndex, 'SAVE_YN')
          if (value == undefined) return '';
          if (value == ' ()') return '';
          if (saveYn == 'Y') {
            return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
              <pre>${cell.value}</pre>
            </div>
          `;
          } else { 
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
                <pre>${cell.value}</pre>
                <button class="mdi mdi-magnify hltla-search-icon" data-index="${cell.index.itemIndex}"></button>
              </div>
            `;
          }
        }
      }
    },
    {
      fieldName: 'JOB_TIT_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('직위') },
      // styleName: 'left-column',
    },
    {
      fieldName: 'COUNTRY_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('국적') },
    },
    {
      fieldName: 'INSERT_USER_NM',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('등록자') },
    },
    {
      fieldName: 'INFEC_NM', width: '100', styleName: 'center-column editable_column', dataType: 'text', header: { text: t('감염병 종류'), styleName: 'header_validit' }, editable: true, lookupDisplay: true,
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 10, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      }, 
    },
    {
      fieldName: 'VACCINE_KIND',
      dataType: 'text',
      width: '50',
      // editable: false,
      header: { text: t('예방접종 종류'), styleName: 'center-column editable_column'},
      // required: true,
      lookupDisplay: true,
      styleCallback: function (grid, dataCell) {
        const ret = {
          editable: true,
          styleName: "center-column editable_column",
          enabled: false,
        };

        const infecNm = grid.getValue(dataCell.index.itemIndex, "INFEC_NM");

        if (!infecNm) {
          ret.editable = false;
        }

        const list = (codeList.VACLIST || []).filter(v => (v.INFEC_NM || "").trim() === infecNm);

        if (list.length === 0) {
          ret.editable = false;
        } else {
          ret.editor = {
            type: "dropdown",
            values: list.map(v => v.VAC_CD),
            labels: list.map(v => v.VAC_NM),
            editable: false,
            enabled: false
          };
        }

        return ret;
      }
    },
    {
      fieldName: 'VACCINE_DATE',
      dataType: 'text',
      width: '50',
      styleName: 'center-column editable_column',
      // editable: true,
      header: { text: t('접종일자'), styleName: 'header_validit' },
      // required: true,
      // styleName: 'editable_column',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
        maxDate: new Date()
      }
      , datetimeFormat: 'yyyy-MM-dd' 
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      width: '120',
      editable: true,
      header: { text: t('비고') },
      styleName: 'left-column editable_column',
    },
    {
      fieldName: 'WRITE',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('파일업로드') },
      // styleName: 'left-column',
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          const row = grid.getValues(cell.index.itemIndex); 
          const fileId = row.FILE_ID;
          const btnLabel = fileId ? '완료' : '등록';
          const btnColor = fileId ? '#1eaf1e' : '#e52b2b';
          var str = 
          `<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
          <button 
              class="v-btn" 
              style="color: #fff; background: ${btnColor}; padding: 4px;"
            >${btnLabel}</button>
          </div> 
            `;
          return str;
        },
      }
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('협력사코드') },
      styleName: 'left-column',
    },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('파일아이디') },
    },
    {
      fieldName: 'VC_NO',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('순번') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('회사코드') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('사업부코드') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('부서코드') },
    },
    {
      fieldName: 'JOB_TIT_CD',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('직위코드') },
    },
    {
      fieldName: 'NEW',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('NEW') },
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('SAVE_YN') },
    },
  ],
  columns : [],
  columnLayout: []
})
grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true;

  // 감염병관리 모듈 관리자, 보건 총괄관리자, admin그룹
  if (userStore.authGrpCd.includes('HLTL001') 
        || userStore.authGrpCd.includes('HIWAYGRP00001')
        || userStore.authGrpCd.includes('GRP00372')
        ) {
        isAdmin.value = true // 관리자
    } else {
        isAdmin.value = false // 일반 사용자
        menuTitle.value.setBtnProperty('btnVtm', 'visible', false);
        // menuTitle.value.setBtnProperty('btnFormDownload', 'visible', false);
        // menuTitle.value.setBtnProperty('btnExcelUpload', 'visible', false);
    }

  // 추가로 row 생성 후 사번컬럼에서 인원검색 팝업 띄우기
  nextTick(() => {
    grdMain.value.getGridView().onCellItemClicked = function (grid, itemIndex, column) {
      let data = grdMain.value.getDataProvider().getJsonRow(itemIndex.dataRow)
      console.log(data)
      if (column.fieldName === "EMP_NM" && data.SAVE_YN != 'Y') {
        // console.log(" EMP_NM 셀 클릭됨!", itemIndex);

        // 현재 선택된 행 데이터 가져오기
        selectedRow = itemIndex;

        if (Popup.value) {
          // console.log(" 팝업 열기");
          Popup.value.openPopup({
            IS_EDUDC020: false,
          }); // 팝업에 데이터 전달 후 실행
        } else {
          // console.error(" Popup이 바인딩되지 않았습니다.");
        }
      }
      // 파일 업로드
      if(column.fieldName === 'WRITE'){  
        const rowData = grdMain.value.getDataProvider().getJsonRow(itemIndex.dataRow); 
        selectedRow2.value = itemIndex.dataRow
        if(rowData.NEW != 'Y' && rowData.EMP_NM && rowData.VACCINE_KIND && rowData.VACCINE_DATE) {
          fileUploadPopup.value.openPopup(rowData.FILE_ID)
        } else {
          Message.warn(t('데이터 저장 후 파일 업로드 해야합니다.'))
        }
      }
    };
  });
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

//부서 변경시 협력사 조회
watch(
  () => searchParam.DEPT_CD,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchVend',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParam.BSNS_CD,
        DEPT_CD: newValue,
        USE_DIV: 'Y'
      }
    }).then((res) => {
      searchParam.ASGN_CD = ''
      codeList.ASGN_CD = res.ORESULT_CUR
      codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    })
  }
)
  
const onPopupComplete = () => {
  // console.log("타나")
  Promise.all([ 
    commonSearchApi({ queryId: 'HLTLA0030_SEARCH_02', param: searchParam2 }),
  ]).then((res) => {
    let list = res[0]?.ORESULT_CUR ?? []
    list.sort((a, b) => Number(a.MAG_NO) - Number(b.MAG_NO));
    codeList.VACCINE_KIND = list
    grdMain.value.setBindingColumn('VACCINE_KIND', codeList.VACCINE_KIND, 'VAC_CD', 'VAC_NM')
    // console.log("VACCINE_KIND", codeList.VACCINE_KIND)
  })
  new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnVtm', 'btnFormDownload', 'btnExcelUpload']"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              width="250px"
              margin="10px"
              v-model="searchParam.BSNS_CD"
            ></i-select>
            <i-select
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              width="250px"
              margin="10px"
              v-model="searchParam.DEPT_CD"
              :readonly="isEmpty(searchParam.BSNS_CD)"
            ></i-select>
            <i-select
              :label="$t('협력사')"
              :items="codeList.ASGN_CD"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              width="250px"
              margin="10px"
              v-model="searchParam.ASGN_CD"
              :readonly="isEmpty(searchParam.DEPT_CD)"
            ></i-select>
          </div>
          <div class="d-flex mt-1" />
          <div class="d-flex mt-1">
            <i-input
              :label="$t('사번')"
              width="200px"
              labelWidth="30px"
              v-model="searchParam.EMP_NO"
              @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
            ></i-input>
            <i-input
              :label="$t('이름')"
              width="200px"
              labelWidth="30px"
              v-model="searchParam.EMP_NM"
              @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
            ></i-input>
            <i-select
              :label="$t('감염병 종류')"
              width="300px"
              margin="10px"
              placeholder="감염병 종류"
              v-model="searchParam.INFEC_NM"
              :items="codeList.allInfecSearch"
              item-value="COD"
              item-title="TXT"
            />
            <i-input
              :label="$t('접촉일자')"
              v-model="searchParam.ST_VACCINE_DATE"
              type="Date"
              width="215px"
              margin="10px"
            />
            <i-input
              :label="$t('-')"
              v-model="searchParam.ED_VACCINE_DATE"
              type="Date"
              width="160px"
              margin="10px"
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            />
            <!-- @onCellItemClicked="onCellItemClicked" -->
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <IUploadPopup ref="fileUploadPopup" :fileDan="true" @uploaded="uploaded" />
  <!-- :buttonList="buttonList" -->
  <EmpPopup ref="Popup" @selected="addToMainGrid"></EmpPopup>
  <HLTLA0030Popup ref="Popup2" @complete="onPopupComplete "></HLTLA0030Popup>
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
