<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi, getCodeList } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IUpload from "@/components/IUpload.vue"
import { toUpper } from "lodash-es"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from '@/components/RealGrid.vue'
import { nextTick } from "vue";

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const emit = defineEmits(["complete"])
const isCreate = ref(false)
const isAdmin = ref(false)
const grdMain = ref(null)
const saveParams = reactive([]);
const allData = reactive([]);

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  VAC_CD: '',
  VAC_NM: ''
})

const openPopup = (data) => {
  data.forEach(item => {
    allData.push(item)
  })

  dialog.value = true
  initCodeList()
  onButtonsClick({ id: "btnSearch" })
}

const codeList = reactive({})
const initCodeList = () => { 
  Promise.all([
    getCodeList('HHII840A1'),
    getCodeList('HHII840A2'),
    getCodeList('HHII840A3'),
    getCodeList('HHII840A4'),
  ]).then((res) => {
    codeList.INFEC1 = res[0].ORESULT_CUR  
    codeList.INFEC2 = res[1].ORESULT_CUR  
    codeList.INFEC3 = res[2].ORESULT_CUR  
    codeList.INFEC4 = res[3].ORESULT_CUR  

    codeList.allInfec = [
      ...codeList.INFEC1,
      ...codeList.INFEC2,
      ...codeList.INFEC3,
      ...codeList.INFEC4
    ];

    grdMain.value.setBindingColumn('INFEC_NM', codeList.allInfec, 'COD', 'TXT')
  })
}
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === "btnCreate") {
    addData();
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
    .run()
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(afterDelete)
    .run()
  } else if (btn.id === "btnClose") {
    closePopup()
  }
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTLA0030_SEARCH_02',
    param: searchParam,
  })
}
const afterSearch = (res) => {
  // console.log("resss", res)

  const cur = res.ORESULT_CUR.sort((a, b) => {
    return Number(a.MAG_NO) - Number(b.MAG_NO)
  })
  grdMain.value.getDataProvider().setRows(cur)
  // appMagNo()
}

// 행 추가 시 드롭다운 값 갱신
// const appMagNo = () => {

//   const dp = grdMain.value.getDataProvider();
//   const rows = dp.getJsonRows();

//   // 현재 MAG_NO 값들 중 최대값 찾기
//   const currentMax = rows.reduce((max, row) => {
//     const num = parseInt(row.MAG_NO, 10);
//     return !isNaN(num) && num > max ? num : max;
//   }, 0);

//   // 마지막 행의 MAG_NO가 없으면 새 번호 할당
//   const lastIndex = rows.length - 1;
//   if (!rows[lastIndex].MAG_NO) {
//     dp.setValue(lastIndex, 'MAG_NO', `${currentMax + 1}`);
//   }

//   // 드롭다운 값 갱신
//   const dropdownValues = Array.from({ length: rows.length }, (_, i) => `${i + 1}`);
//   grdMainProps.columns.forEach(col => {
//     if (col.fieldName === 'MAG_NO') {
//       col.editor = {
//         type: 'dropdown',
//         values: dropdownValues,
//         labels: dropdownValues,
//         domainOnly: true,
//         textReadOnly: true,
//       };
//     }
//   });

//   grdMain.value.getGridView().setColumns(grdMainProps.columns);
//   // MAG_NO 오름차순으로 정렬
//   // grdMain.value.getGridView().orderBy(['MAG_NO'], ['ascending']);
// };

// 행추가
const addData = () => {
  const today = new Date().toISOString().split('T')[0];
  const currentRows = grdMain.value.getDataProvider().getJsonRows();
  const nextOrder = currentRows.length + 1;
  const defaultValues = {
    CMPNY_DIV: userStore.cmpnyDiv,
    VAC_NM: '',
    MAG_NO: '',
    INSERT_DATE: today,
    INSERT_USER_NM: userStore.userName,
    INSERT_USER_ID: userStore.userId,
    NEW: 'Y'
  };
  grdMain.value.getDataProvider().insertRow(0, defaultValues);
  grdMain.value.getGridView().checkItem(0, true)
  // appMagNo()
}

// 저장
const beforeSave = () => {

const chekedRow = grdMain.value.getGridView().getCheckedRows()

if(chekedRow.length === 0){
  Message.warn(t('선택한 데이터가 없습니다.'))
  return false
}

saveParams.length = 0;
let hasError = false;

chekedRow.forEach(val => {
  let rowData = grdMain.value.getDataProvider().getJsonRow(val); // 사용자가 입력한 값 가져오기
  // console.log("rowData", rowData)

  if (rowData.NEW === 'Y') {
    rowData.NEW = 'N';
    }

  if (!rowData.INFEC_NM || !rowData.VAC_NM || !rowData.MAG_NO) {
      Message.warn('감염병 종류, 예방접종명 또는 관리순번이 입력되지 않은 행이 있습니다.');
      hasError = true;
      return;
    }

  saveParams.push({
    CMPNY_DIV: userStore.cmpnyDiv, // 회사 구분 (고정값)
    INFEC_NM: rowData.INFEC_NM,
    VAC_CD: rowData.VAC_CD,
    VAC_NM: rowData.VAC_NM,
    MAG_NO: rowData.MAG_NO,
    INSERT_USER_NM: rowData.INSERT_USER_NM,
    USER_ID: userStore.userId, // 사용자 ID (고정값)
  });
});
if (hasError) return false; // 검증 실패 시 저장중단
return true;
}

const saveData = async () => {
// console.log("저장전", saveParams);
const res = await commonExecuteApi({ queryId : 'HLTLA0030_SAVE_02', list: saveParams })
// console.log("res", res)
if (res?.result?.status === '200') {
    // console.log("emit")
    emit('complete'); // 메인 화면에 저장 완료 알림
  }
}

// 삭제
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  const chData = checkedData.map(idx =>
  grdMain.value.getDataProvider().getJsonRow(idx)
  )
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }

  // console.log("chData", chData)

  // allData의 VACCINE_KIND 값 목록 추출 (중복 제거)
  const vaccineKinds = [...new Set(allData.map(item => item.VACCINE_KIND_NM))]
  // console.log("vaccineKinds", vaccineKinds)

  // 체크된 항목 중 VACCINE_KIND가 chData에 포함된 경우가 있는지
  const vaccine = chData.some(row => vaccineKinds.includes(row.VAC_NM))
  // console.log("vacc", vaccine)

  if (vaccine) {
    Message.warn(t('사용 중인 접종 종류는 삭제할 수 없습니다.'))
    return false
  }

  return true
}

const deleteData = async () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  checkedData.forEach(val => {
    let rowData = grdMain.value.getDataProvider().getJsonRow(val); //  체크된 행 데이터 가져오기
    deleteParam.push({
      CMPNY_DIV: rowData.CMPNY_DIV, // 필수 키 값
      VAC_CD: rowData.VAC_CD, // 필수 키 값
    });
  });

  const res = await commonExecuteApi({
    queryId: 'HLTLA0030_DELETE_02',
    list: deleteParam,
  })

  // console.log("resDDD", res)
  if (res?.result?.status === '200') {
    // console.log("emit")
    emit('complete'); // 메인 화면에 삭제 완료 알림
  }
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  dialog.value = false
  grdMain.value.getDataProvider().setRows([])
}



const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys : [], 
  fields: [
  {
      fieldName: 'VAC_CD',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('예방접종코드') },  
      styleName: 'left-column',
    },
    {
      fieldName: 'INFEC_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('감염병 종류'), styleName: 'header_validit' }, 
      lookupDisplay: true,
      editor: {
        type: 'dropdown', textReadOnly: true, dropDownCount: 10, partialMatch: true, domainOnly: true, dropDownWhenClick: true,
      },
      styleName: 'left-column',
      'styleCallback' : function(grid, dataCell){
        var ret = { editable : false, styleName : 'editable_column'} 
        if(grid.getValue(dataCell.index.itemIndex, 'NEW') == 'Y') {
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
      fieldName: 'VAC_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('예방접종명'), styleName: 'header_validit' }, 
      styleName: 'left-column',
      'styleCallback' : function(grid, dataCell){
        var ret = { editable : false, styleName : 'editable_column'} 
        if(grid.getValue(dataCell.index.itemIndex, 'NEW') == 'Y') {
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
      fieldName: 'MAG_NO',
      dataType: 'text',
      width: '20',
      editable: true,
      header: { text: t('관리순번') },
      styleName: 'editable_column',
      // editor: {
      //   type: 'dropdown',
      //   textReadOnly: true, dropDownCount: 8, partialMatch: true, domainOnly: true, dropDownWhenClick: true
      // },
    },
    {
      fieldName: 'INSERT_DATE',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('등록일') },
    },
    {
      fieldName: 'INSERT_USER_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('등록자') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('등록자') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('사업부코드') }, 
      styleName: 'left-column',
    },
    {
      fieldName: 'NEW',
      dataType: 'text',
      width: '50',
      editable: false,
      visible: false,
      header: { text: t('NEW') }, 
      styleName: 'left-column',
    },
    // {
    //   fieldName: 'VC',
    //   dataType: 'text',
    //   width: '50',
    //   // editable: false,
    //   header: { text: t('예방접종 종류') },
    //   lookupDisplay: true,
    //   editor: {
    //     type: 'dropdown',
    //     textReadOnly: true, dropDownCount: 8, partialMatch: true, domainOnly: true, dropDownWhenClick: true
    //   },
    // },
  ],
  columns : [],
  columnLayout: []
})
grdMainProps.columns = grdMainProps.fields



defineExpose({
  openPopup,
})

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true;
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="940"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>접종종류 관리</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="true"
          :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <div class="d-flex flex-column fill-height">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            style="height: 400px;"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">

</style>
