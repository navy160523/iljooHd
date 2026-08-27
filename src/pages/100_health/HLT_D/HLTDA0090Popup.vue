<script setup>
import { ref, reactive, getCurrentInstance, onMounted, defineEmits  } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi, getCompanyList } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import ILabel from "@/components/ILabel.vue"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IUpload from "@/components/IUpload.vue"
import { toUpper } from "lodash-es"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
// const emit = defineEmits(["after-search"])
const isCreate = ref(false)
const tab = ref('tab1')
const grdMain = ref(null)
const autoClose = ref(true);
const emit = defineEmits(["selectRowData"]);
const selectedRow = ref([]);
const grdSub = ref(null);

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  // VNDCOD: '', //협력회사
  // SAUPBU: '' //사업본부
})

const saveParams1 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  MATE_ID: '',
  USE_MATE: '',
  MATE_NUM: '',
  USER_ID: userStore.userId,
})

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  MATNO_LIST: [],
  USER_ID: userStore.userId,
})

const codeList = reactive({
  CMPNY: [],
  BSNS: [], //사업부
  DEPT: [], //부서/협력사
})


// const initCodeList = () => {
  
// };

// 3. 페이지가 처음 로드될 때 실행
onMounted(() => {
  // initCodeList()
  grdSub.value.getGridView().filterPanel.visible = true;
  grdMain.value.getGridView().filterPanel.visible = true;
  // new queryFlowHelper(vm, t)
  //   .setGridList([grdSub])
  //   .setQuery(searchData1)
  //   .setAfter(afterSearch1)
  //   .run()
})

const closePopup = () => {
  dialog.value = false;
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    grdMain.value.getGridView().filterPanel.visible = true;
    new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
  }
  else if (btn.id === 'btnCreate') {
    addData();
  }
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave1)
    .setQuery(saveData1)
    .setAfter(() => {
      grdMain.value.getDataProvider().clearRows()
      onButtonsClick({ id :'btnSearch' }) })
    .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(() => {
      grdMain.value.getDataProvider().clearRows()
      onButtonsClick({ id :'btnSearch' }) })
    .run()
  }
}

const onButtonsClick1 = (btn) => {
  if (btn.id === "btnSearch") {
    grdSub.value.getGridView().filterPanel.visible = true;
    new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData1)
    .setAfter(afterSearch1)
    .run()
  }
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(afterSave)
    .run()
  } else 
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

// 용접재 리스트 조회
const searchData = () => {
  return commonSearchApi({ queryId : 'HLTDA0090_SEARCH_04', param: searchParam })
}

const afterSearch = (res) => {
  console.log("조회:", res);

  const sortRes = res.ORESULT_CUR.sort((a, b) => a.MATE_NUM - b.MATE_NUM)

  grdMain.value.getDataProvider().setRows(sortRes)
}

// 조회
const searchData1 = () => {
  console.log(" API 요청 데이터:", JSON.stringify(searchParam));
  return commonSearchApi({ queryId : 'HLTDA0090_SEARCH_03', param: searchParam })
}

const afterSearch1 = (res) => {
  console.log("조회:", res);
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 용접재리스트 행추가
const addData = () => {
  grdMain.value.getDataProvider().insertRow(0, {});
}

// 용접재리스트 저장
const beforeSave1 = () => {
  let chekedRow = ref([])
  chekedRow = grdMain.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }

  saveParams1.value = []
  let data = ref([])

  chekedRow.forEach(val => {
    data = grdMain.value.getDataProvider().getJsonRow(val)
    //data.UPDATE_USER_ID = userStore.userId // 수정자
    data.CMPNY_DIV = userStore.cmpnyDiv
    saveParams1.value.push(data)
  })
  console.log("저장 파라메트", saveParams1.value)
  return true
}
const saveData1 = () => { 
  console.log("저장전", saveParams1.value);
  return commonExecuteApi({ queryId : 'HLTDA0090_SAVE_02', list: saveParams1.value })
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
  let deleteParams = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  checkedData.forEach(val => {
    let rowData = grdMain.value.getDataProvider().getJsonRow(val) //  체크된 행 데이터 가져오기
    deleteParams.push({
      CMPNY_DIV: userStore.cmpnyDiv,
      MATE_ID: rowData.MATE_ID,
      USE_MATE: rowData.USE_MATE,
      MATE_NUM: rowData.MATE_NUM,
      USER_ID: userStore.userId
    })
  })
  return commonExecuteApi({ queryId: "HLTDA0090_DELETE_01", list: deleteParams })
}

// 저장
const beforeSave = () => {
  const gridView = grdSub.value.getGridView();
  const dataProvider = gridView.getDataSource();
  const rowCount = dataProvider.getRowCount();

  let checkedMatnos = [];

  for (let i = 0; i < rowCount; i++) {
    let matnoYn = dataProvider.getValue(i, "MATNO_YN"); //  체크박스 값 가져오기
    if (matnoYn === 'Y') { //  체크된 경우만 추가
      let matno = dataProvider.getValue(i, "MATNO"); //  자재번호 가져오기
      checkedMatnos.push(matno);
    }
  }

  if (checkedMatnos.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'));
    return false;
  }

  saveParams.MATNO_LIST = checkedMatnos; //  체크된 자재번호 리스트 저장

  console.log("저장 파라미터:", saveParams); //  디버깅 로그
  return true;
};

const saveData = () => {
  console.log("저장전", saveParams);
  return commonExecuteApi({ queryId : 'HLTDA0090_SAVE_01', list: [{
      CMPNY_DIV: saveParams.CMPNY_DIV,
      MATNO_LIST: saveParams.MATNO_LIST.join(','), // 배열 → 쉼표 구분 문자열 변환
      USER_ID: saveParams.USER_ID
  }] })
}

const afterSave = () => {
  //그리드에 수정중 상태가 남아있어서 초기화
  grdSub.value.getDataProvider().clearRowStates(true, false)
  grdSub.value.getGridView().filterPanel.visible = true;
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData1)
    .setAfter(afterSearch1)
    .run()
}

// const onCellClicked = async (grid, clickData) => {
//   let rowData = await grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)

//   // 현재 그리드 데이터 가져오기
//   let mainData = grdMain.value.getDataProvider().getJsonRows();

//   const isDuplicate = mainData.some(row => row.MATNO === rowData.MATNO);
//   if (isDuplicate) {
//     Message.warn(t(`자재번호 ${rowData.MATNO}가 이미 추가되었습니다.`));
//     return; // 중복이면 추가하지 않음
//   }
  
//   mainData.push({
//     VNDCOD: rowData.VNDCOD,
//     SAUPBU: rowData.SAUPBU,
//     MATNO: rowData.MATNO,
//     USER_ID: userStore.userId
//   })
//   grdMain.value.getDataProvider().setRows(mainData);
// }


// 용접재리스트
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, checkBar: { visible: true }},
  keys : [],
  fields : [ 
    { fieldName: 'MATE_ID', dataType: 'text', width: '40',
      editable: false,
      visible: false,
      header: { text: t('ID') } 
    },
    { fieldName: 'USE_MATE', dataType: 'text', width: '100',
      styleName: "left-column",
      header: { text: t('용접재 종류') },
      editor: {
        dateType:'text',
        maxLength: 50, //입력길이제한 x
      }, 
    },
    { fieldName: 'MATE_NUM', dataType: 'text', width: '20',
      styleName: "right-column",
      header: { text: t('정렬순서') } 
    },
    { fieldName: 'VNDCOD', dataType: 'text', width: '60', visible: false,
      header: { text: t('협력회사') } 
    },
    { fieldName: 'SAUPBU', dataType: 'text', width: '60', visible: false,
      header: { text: t('사업본부') } 
    },
  ],
  columns: []
})
grdMainProps.columns = grdMainProps.fields

// 신규 확인 필요 용접재
const grdSubProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'MATNO', dataType: 'text', width: '70',
      editable: false,
      header: { text: t('자재번호') } 
    },
    { fieldName: 'MATDSC', dataType: 'text', width: '220',
      header: { text: t('품명') },
      editable: false,
      styleName: "left-column"
    },
    { fieldName: 'MATNO_YN', dataType: 'text', width: '40',
      header: { text: t('확인완료') },
      editable: false, 
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' } 
    },
    { fieldName: 'VNDCOD', dataType: 'text', width: '60', visible: false,
      header: { text: t('협력회사') } 
    },
    { fieldName: 'SAUPBU', dataType: 'text', width: '60', visible: false,
      header: { text: t('사업본부') } 
    },
  ],
  columns: [],
  columnLayout: [
    // {
    //   name: '신규 확인 필요 용접재',
    //   direction: 'horizontal',
    //   items: ['MATNO', 'MATDSC', 'MATNO_YN'],
    // },
  ]
})
grdSubProps.columns = grdSubProps.fields 

const openPopup = () => {
  selectedRow.value = null;
  grdMain.value.getDataProvider().clearRows();
  dialog.value = true;

  onButtonsClick({ id: "btnSearch" })
  onButtonsClick1({ id: "btnSearch" })
}

defineExpose({
  openPopup,
})
</script>

<template>
<v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>특별관리물질 자재 관리</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <div class="grid-fbox">
        <v-sheet width="50%" class="mr-3">
          <IGridTitle
            ref="menuTitle"
            :title="$t('취급 용접재')"
            :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
            @click-button="onButtonsClick"
            />
        </v-sheet>

        <v-sheet width="50%" class="mr-3">
        <IGridTitle
          ref="menuTitle"
          :title="$t('신규 확인 필요 용접재')"
          :button-list="['btnSearch', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick1"
        />
        </v-sheet>
        </div>
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-window v-model="tab" class="h-window">
            <v-window-item value="tab1">
              <div class="h-grow">
              <v-sheet width="50%" class="pa-0 h-auto mr-3">
                <div class="grid-fbox">
                  <RealGrid
                    ref="grdMain"
                    :grid-view-option="grdMainProps.gridViewOption"
                    :keys="grdMainProps.keys" 
                    :fields="grdMainProps.fields"
                    :columns="grdMainProps.columns"
                    style="height: 600px;"
                  />

                  <RealGrid
                    ref="grdSub"
                    :grid-view-option="grdSubProps.gridViewOption"
                    :keys="grdSubProps.keys" 
                    :fields="grdSubProps.fields"
                    :columns="grdSubProps.columns"
                    style="height: 600px;"
                    :column-layout="grdSubProps.columnLayout"
                  />
                </div>
                </v-sheet>
              </div>
            </v-window-item>
          </v-window>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  .input_flex {
    display: flex;
  }

  .vRadio {
    display: flex;
    align-items: center;
  }
  .vCheck {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-left: 20px;
  }
  .grid-fbox {
    display: flex;
    gap: 10px;
  }

</style>
