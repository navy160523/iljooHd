<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import HLTJB0040Popup from "./HLTJB0040Popup.vue"
import EmpPopup from '@/components/popup/EmpPopup.vue'

// 직업병관리 - 조직별담당자관리
defineOptions({
  name:'100_health-HLT_J-HLTJB0040',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const userId = ref(userStore.userId)
// const grdSubVisible = ref(false);
// const grdMainVisible = ref(false);
const tab = ref('tab1')
const selectedRowIndex = ref(null);
const Popup = ref(null)
// const로 선언하면 이후 값 변경 불가
// let으로 선언해서 값 변경가능 하도록함
let selectedRow = ref([]);


//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서,협력사
})

const codeList = reactive({
  BSNS: [], //사업부
  DEPT: [], //부서/협력사
})

// const saveParams = reactive([]);
const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  EMP_NO: '',
  KOR_NM: '',
  JOB_TIT_CD: '',
  JOB_TIT_NM: '',
  OFFI_RES_CD: '',
  OFFI_RES_NM: '',
  TEL_NO: '',
  EMAIL: '',
  ORG_DT: '',
  REMARK: '',
  USER_ID: userStore.userId,
})

// const states = reactive({
//   ASGN_CD: "" 
// })


// 3. 페이지가 처음 로드될 때 실행
onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()
  console.log("hhi", userStore.cmpnyDiv);
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()

  

  // 추가로 row 생성 후 사번컬럼에서 인원검색 팝업 띄우기
    nextTick(() => {
    grdMain.value.getGridView().onCellItemClicked = function (grid, itemIndex, column) {
      if (column.fieldName === "EMP_NO") {
        console.log(" EMP_NO 셀 클릭됨!", itemIndex);

        // 현재 선택된 행 데이터 가져오기
        selectedRow = itemIndex;

        if (Popup.value) {
          console.log(" 팝업 열기");
          Popup.value.openPopup({
            IS_EDUDC020: false,
          }); // 팝업에 데이터 전달 후 실행
        } else {
          console.error(" Popup이 바인딩되지 않았습니다.");
        }
      }
    };
  });
})


// 1. 초기 실행 시 사업부 리스트 가져옴
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv } }),
    commonSearchApi({ queryId: "searchDept", param: { CMPNY_DIV: userStore.cmpnyDiv, ORGN_DIV: 'A', BSNS_CD: '', ASGN_NM: '', DEPT_CD: '', HSE_ONLY: '', USE_ONLY: 'Y' } })
  ]).then(([bsnsRes, deptRes]) => {
    console.log("BSNS 응답:", bsnsRes); // API 응답 확인
    console.log("DEPT 응답:", deptRes); // API 응답 확인

    // 사업부 리스트 초기화 및 추가
    codeList.BSNS.splice(0);
    codeList.BSNS.push({ BSNS_NM: "전체", BSNS_CD: "" });
    bsnsRes.ORESULT_CUR.forEach(e => {
      codeList.BSNS.push(e);
    });
  }).catch(error => {
    console.error("코드 리스트 조회 중 오류 발생:", error);
  });
};

// 사업부 변경 시 부서
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y' },
    }).then((res) => {
      searchParams.DEPT_CD = ''
      codeList.DEPT = res.ORESULT_CUR
      codeList.DEPT.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    // grdMain.value.getGridView().filterPanel.visible = true
    new queryFlowHelper(vm, t)
    // .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
  } else if (btn.id === "btnCreate") {
    addData();
  } else if (btn.id === "btnUpdate"){
    // selectRowData();
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
    .run()
  }
  // else if (btn.id === "btnCreate"){
  //   if (Popup.value) {
  //     Popup.value.openPopup();  // ref가 존재할 때만 실행
  //   } else {
  //     console.error("Popup이 바인딩되지 않았습니다.");
  //   }
  // } 
  else if (btn.id === "btnDelete"){
    new deleteFlowHelper(vm, t)
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
    .run()
  }
}

const searchData = () => {
  console.log(" API 요청 데이터:", JSON.stringify(searchParams));
  return commonSearchApi({ queryId : 'HLTJB0040_SEARCH_01', param: searchParams })
}
const afterSearch = res => {
  console.log("조회:", res);
  console.log("조회:", res.ORESULT_CUR);

  // YYYYMMDD → YYYY-MM-DD 변환 함수
  function formatYYYYMMDD(dateString) {
    if (!dateString || dateString.length !== 8) return dateString;
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
  }
  // 데이터 변환 적용
  if (res.ORESULT_CUR && Array.isArray(res.ORESULT_CUR)) {
    res.ORESULT_CUR.forEach(item => {
      if (item.ORG_DT) {
        item.ORG_DT = formatYYYYMMDD(item.ORG_DT); // 변환 적용
      }
    });
  }

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
const addData = () => {
  const defaultValues = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: '',
    DEPT_CD: '',
    EMP_NO: '',
    KOR_NM: '',
    JOB_TIT_CD: '',
    JOB_TIT_NM: '',
    OFFI_RES_CD: '',
    OFFI_RES_NM: '',
    TEL_NO: '',
    EMAIL: '',
    ORG_DT: '',
    REMARK: '',
    BSNS_NM: '',
    DEPT_NM: ''
  };
  grdMain.value.getDataProvider().insertRow(0, defaultValues);
}


const resetSaveParams = () => {
    Object.keys(saveParams).forEach(key => {
        saveParams[key] = ''; // 모든 값을 빈 문자열로 초기화
    });
    console.log(" 완전히 초기화된 saveParams:", saveParams);
};
// const beforeSave = () => {
//     let checkedRows = grdMain.value.getGridView().getCheckedRows();

//     if (checkedRows.length === 0) {
//         alert("선택된 인원이 없습니다.");
//         return false; //  저장 실행 중단
//     }

//     console.log(" 체크된 행 인덱스:", checkedRows);

//     const dataProvider = grdMain.value.getDataProvider();
//     resetSaveParams(); //saveParams 초기화
//     console.log("기존데이터", saveParams);

//     let isValid = true; //이메일 유효성체크
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 이메일 형식 정규식

//     checkedRows.forEach(rowIndex => {
//         let sData = dataProvider.getJsonRow(rowIndex);
//         console.log(` ${rowIndex}번 행 데이터:`, sData);

//         if (sData) {
//             // 이메일 필수 입력 체크
//             if (!sData.EMAIL || sData.EMAIL.trim() === "") {
//               Message.warn(t("이메일을 입력해야 합니다."));
//               isValid = false;
//               return;
//             }

//             if (!emailRegex.test(sData.EMAIL)) {
//                 Message.warn("이메일 형식이 올바르지 않습니다.");
//                 isValid = false;
//                 return;
//             }

//             Object.assign(saveParams, sData);
//             //Object.assign(saveParams, sData); // 데이터 덮어쓰기
//         }
//     });
//     if (!isValid) return false;
//     console.log(" 최종 saveParams 값:", JSON.stringify(saveParams));
//     return true; //  저장 진행 가능
// };
const beforeSave = () => {
  let chekedRow = ref([])
  let bCheck = true
  chekedRow = grdMain.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.value = []
  let data = ref([])

  chekedRow.forEach(val => {
    data = grdMain.value.getDataProvider().getJsonRow(val)
    if (!data.EMAIL || data.EMAIL.trim() === '') {
      Message.warn(`이메일을 입력해야 합니다.`)
      bCheck = false
      return
    }
    data.UPDATE_USER_ID = userStore.userId // 수정자
    // 이메일 유효성 검사 (정규식 사용)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.EMAIL)) {
      Message.warn(`유효한 이메일 형식이 아닙니다.`)
      bCheck = false
      return
    }

    // ORG_DT(지정일) 필수 입력 체크
    if (!data.ORG_DT || data.ORG_DT.trim() === '') {
      Message.warn(`지정일을 입력해야 합니다.`);
      bCheck = false;
      return;
    }

    // ORG_DT(지정일) 유효성 검사 (YYYY-MM-DD 포맷 확인)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.ORG_DT)) {
      Message.warn(`지정일 형식이 올바르지 않습니다.(YYYY-MM-DD)`);
      bCheck = false;
      return;
    }

    // 날짜 값이 실제로 존재하는 날짜인지 확인
    const dateParts = data.ORG_DT.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    const dateObj = new Date(year, month - 1, day);

    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() + 1 !== month ||
      dateObj.getDate() !== day
    ) {
      Message.warn(`존재하지 않는 날짜입니다. (Row: ${val + 1})`);
      bCheck = false;
      return;
    }

    saveParams.value.push(data)
  })
  console.log("저장 파라메트", saveParams.value)
  return bCheck
}
const saveData = () => {
  // saveParams.forEach(val => {
  //   console.log('val : ', val)
  //   data = grdMain.value.getDataProvider().getJsonRow(val)
  //   saveParams.value.push(data)
  // })
  console.log("저장전", saveParams.value);
  return commonRequest("/hse/health/HLTJB0040_SAVE_01", { queryId : 'HLTJB0040_SAVE_01', list: saveParams.value })
}
// const saveData = () => {
//     const payload = {...saveParams}; //  `saveParams`가 배열이므로 그대로 복사
//     console.log(" 최종 저장 데이터:", payload);

//     return commonExecuteApi({
//         queryId: 'HLTJB0040_SAVE_01',
//         list: [payload]
//     });
// };

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
      CMPNY_DIV: userStore.cmpnyDiv, // 필수 키 값
      USER_NO: rowData.USER_NO, // 필수 키 값
    });
  });

  console.log(" 삭제할 데이터:", deleteParam);

  return commonRequest("/hse/health/HLTJB0040_SAVE_01", { queryId : 'HLTJB0040_DELETE_01', list: deleteParam })
}
const afterDelete = () => {
  Message.success(t('성공적으로 삭제되었습니다'))
}


// 인원검색 후 데이터 추가
const addToMainGrid1 = async (selectedData) => {
  console.log(" 부모 컴포넌트에서 받은 데이터:", selectedData);
  console.log(" 입력할 행:", selectedRow);

  const today = new Date().toISOString().split('T')[0];

  // DEPT_CD(부서 코드)로 DEPT_NM(부서명) 찾기
  const bsnsInfo = codeList.BSNS.find(bsns => bsns.BSNS_CD === selectedData.BSNS_CD);
  const bsnsName = bsnsInfo ? bsnsInfo.BSNS_NM : ""; // 만약 코드가 없으면 기본값 설정

  // DEPT_CD(부서 코드)로 DEPT_NM(부서명) 찾기
  const deptInfo = codeList.DEPT.find(dept => dept.DEPT_CD === selectedData.DEPT_CD);
  const deptName = deptInfo ? deptInfo.DEPT_NM : ""; // 만약 코드가 없으면 기본값 설정


  const dataProvider = grdMain.value.getDataProvider();

  // 중복 체크: 현재 그리드에 EMP_NO가 이미 존재하는지 확인
  const existingRows = dataProvider.getJsonRows();
  const isDuplicate = existingRows.some(row => row.EMP_NO === selectedData.EMP_NO);
  if (isDuplicate) {
    // console.error(" 이미 존재하는 EMP_NO입니다:", selectedData.EMP_NO);
    Message.warn(" 이미 추가된 인원입니다!");
    return; // 중복이면 추가하지 않음
  }

  // saveParams.COOR_YN = selectedData.USER_DIV;

  if (selectedRow !== null) {
    // 기존 행 업데이트
    dataProvider.updateRow(selectedRow.itemIndex, {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: selectedData.BSNS_CD,
      BSNS_NM: bsnsName,
      DEPT_CD: selectedData.DEPT_CD,
      DEPT_NM: deptName,
      ORG_DT: today, // 현재 날짜 추가
      KOR_NM: selectedData.EMP_NM,
      JOB_TIT_NM: selectedData.JOB_TIT_NM,
      OFFI_RES_NM: selectedData.OFFI_RES_NM,
      TEL_NO: selectedData.TEL_NO,
      EMP_NO: selectedData.EMP_NO,
      // EMP_NM: selectedData.EMP_NM,
      EMAIL: selectedData.EMAIL,
    });

    console.log(" 기존 행 업데이트 완료!", selectedRow);
  }
  selectedRow = null;
  // dataProvider.addRow({
  //     ...selectedData,
  //   });


  // const rowData = {  
  //   ...selectedData, 
  //   CMPNY_DIV: userStore.cmpnyDiv,
  //   BSNS_CD: selectedData.BSNS_CD,
  //   DEPT_CD: selectedData.DEPT_CD,
  //   BSNS_NM: bsnsName,
  //   DEPT_NM: deptName,
  //   ORG_DT: today,  // 저장일 컬럼에 현재 날짜 추가
  //   KOR_NM: selectedData.EMP_NM,
  //   JOB_TIT_NM: selectedData.JOB_TIT_NM,
  //   OFFI_RES_NM: selectedData.OFFI_RES_NM,
  //   TEL_NO: selectedData.TEL_NO,
  //   EMAIL: selectedData.EMAIL,
  //   // COOR_YN: selectedData.USER_DIV,
  // };
  // // console.log("COOR_YN : " + COOR_YN);

  // //  새로운 행 추가
  // dataProvider.addRow(rowData);
  
  // // 새로운 행 추가
  // // dataProvider.addRow(selectedData);

  // console.log(" 그리드에 데이터 추가 완료!");

  // if (autoClose.value) {
  //   dialog.value = false;
  // }
};






//그리드 속성셋팅 ( 운영조직 세부사항 )
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, checkBar: {  visible: true }},
  keys : [],
  fields : [ 
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '100', header: { text: t('회사') }, visible: false},
    { fieldName: 'USER_NO', dataType: 'text', width: '100', header: { text: t('No') }, editable: false, visible: false},
    { fieldName: 'BSNS_NM', dataType: 'text', width: '70', header: { text: t('사업부') }, editable: false, styleName: "left-column"},
    { fieldName: 'DEPT_NM', dataType: 'text', width: '70', header: { text: t('부서명/협력사명') }, editable: false, styleName: "left-column",  },
    { fieldName: 'EMP_NO', dataType: 'text', width: '70', header: { text: t('사번') }, editable: false,
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'EMP_NO')
          if (value == undefined) return '';
          if (value == ' ()') return '';
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
              <pre>${cell.value}</pre>
              <button class="mdi mdi-magnify search-icon" data-index="${cell.index.itemIndex}"></button>
            </div>
          `;
        }
      }
    },
    { fieldName: 'KOR_NM', dataType: 'text', width: '50', header: { text: t('성명') }, editable: false,},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', width: '90', header: { text: t('직위') }, editable: false, styleName: "left-column"  },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', width: '90', header: { text: t('직책') }, editable: false, styleName: "left-column" },
    { fieldName: 'TEL_NO', dataType: 'text', width: '70', header: { text: t('전화번호') }, editable: false},
    { fieldName: 'EMAIL', dataType: 'text', width: '140', header: { text: t('이메일') }, editable: false, styleName: "left-column" },
    { fieldName: 'ORG_DT', dataType: 'text', width: '70', header: { text: t('지정일') }, editable: false},
    { fieldName: 'REMARK', dataType: 'text', width: '140', header: { text: t('비고') }, styleName: "editable_column left-column" },
    { fieldName: 'BSNS_CD', dataType: 'text', width: '100', header: { text: t('사업부코드') }, editable: false, visible: false},
    { fieldName: 'DEPT_CD', dataType: 'text', width: '100', header: { text: t('부서코드') }, editable: false, visible: false},
  ], 
  columns : [],
})
grdMainProps.columns = grdMainProps.fields


</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <!-- menuId로 title가져옴 -->
      <IMenuTitle
        ref="menuTitle"
        :title="`${$t(useLogsStore().menuId)}`"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        :use-permission="false"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select 
            :label="$t('사업부')"
            labelWidth="50px"
            width="250px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
          />
          <i-select 
            :label="$t('부서/협력사')"
            labelWidth="70px"
            width="250px"
            v-model="searchParams.DEPT_CD"
            :items="codeList.DEPT"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
          />
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <!-- h-window: 만약 v-window를 사용하고 싶다면 v-window의 클래스에 h-window 클래스를 넣어주고
                      v-window-item 하위에 dom을 넣으시면 됩니다. -->
        <v-window v-model="tab" class="h-window">
          <v-window-item value="tab1">
            <!-- h-grow : 컨텐츠를 가로로 놓고싶다면 v-sheet 아래에 div와 클래스를 지정해주세요 
                바로 <div class="h-grow"> 부터 시작한다면 컨텐츠는 자동으로 지정됩니다.
            -->
            <div class="h-grow">
              <v-sheet width="70%" class="pa-0 h-auto">
                <!-- 메인그리드 -->
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  @onCellClicked="onCellClicked"
                />
              </v-sheet>
            </div>
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
  <!-- <HLTJB0040Popup ref="Popup" @selectRowData="addToMainGrid1"></HLTJB0040Popup> -->
  <EmpPopup ref="Popup" @selected="addToMainGrid1"></EmpPopup>
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


