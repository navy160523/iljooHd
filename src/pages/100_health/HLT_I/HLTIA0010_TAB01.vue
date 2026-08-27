<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import { commonSearchApi } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import saveFlowHelper from '@/utils/saveFlowHelper'

// const props = defineProps({
//   tab: {
//     Type: String,
//     default: "",
//   },
// })

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)
const grdOrga = ref(null)
const grdEmpl = ref(null)
const grdApply1 = ref(null)
const grdApply2 = ref(null)
const grdApply3 = ref(null)
const selectedRow = ref([]);
const selectedApply = ref(null);

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '', //사업부
  DEPT_CD: '',
})
const searchParams2 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: searchParams.BSNS_CD, //사업부
  DEPT_CD: searchParams.DEPT_CD, //부서,협력사
})

const codeList = reactive({
  BSNS: [], //사업부
  DEPT: [],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv } }),
  ]).then(([bsnsRes]) => {
    //console.log("DEPT 응답:", deptRes); // API 응답 확인

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

// 사업부가 변경될 때 자동으로 부서 리스트 업데이트
watch(() => searchParams.BSNS_CD, (newBSNS) => {
  //console.log("사업부 변경됨:", newBSNS);
  // searchData01(newBSNS);
  onButtonsClick1({ id: "btnSearch" });
});

//---------------------------------------------------
// 조직도 조회 버튼
const onButtonsClick1 = (btn) => {
  if (btn.id === "btnSearch") {
    // grdOrga.value.getGridView().filterPanel.visible = true
    new queryFlowHelper(vm, t)
    .setGridList([grdOrga])
    .setQuery(() => searchData01(searchParams.BSNS_CD))
    .setAfter(afterSearch01)
    .run()
  }
}
const searchData01 = async (BSNS_CD) => {
  return await commonSearchApi({ 
    queryId: "searchDept", 
    param: { CMPNY_DIV: userStore.cmpnyDiv, ORGN_DIV: 'A', BSNS_CD: BSNS_CD, ASGN_NM: '', DEPT_CD: '', HSE_ONLY: '', USE_ONLY: 'Y' } 
  })
}
const afterSearch01 = res => {
  codeList.DEPT.splice(0);
  codeList.DEPT.push({ DEPT_NM: "전체", DEPT_CD: "" });
  res.ORESULT_CUR.forEach(e => {
      codeList.DEPT.push({
        DEPT_CD: e.DEPT_CD, // 부서 코드
        DEPT_NM: e.ASGN_SHRT_NM, // 부서명
      });
    });
  console.log("최종 부서 리스트:", JSON.stringify(codeList.DEPT));
  grdOrga.value.getDataProvider().setRows(codeList.DEPT)
}

// 조직도 row 클릭
const onCellClicked1 = (grid, clickData) => {
  const selectedData = grdOrga.value.getDataProvider().getJsonRow(clickData.dataRow);

  if (selectedData) {
    selectedRow.value = {
      DEPT_NM: selectedData.DEPT_NM,
      DEPT_CD: codeList.DEPT.find(item => item.DEPT_NM === selectedData.DEPT_NM)?.DEPT_CD
    }
  }

    console.log(" 선택한 행 데이터:", selectedRow.value);
    onButtonsClick2({ id: "btnSearch", DEPT_CD: selectedRow.value.DEPT_CD });
  }

//---------------------------------------------------
//임직원 목록 버튼
const onButtonsClick2 = (btn) => {
  if (btn.id === "btnSearch") {
    // grdOrga.value.getGridView().filterPanel.visible = true
    new queryFlowHelper(vm, t)
    .setGridList([grdEmpl])
    .setQuery(() => searchData02(selectedRow.value.DEPT_CD))
    .setAfter(afterSearch02)
    .run()
  } else if (btn.id === "btnAddApp") {
    grdApply1.value.getDataProvider().addRow(selectedApply.value);
  } else if (btn.id === "btnAddCC") {
    grdApply3.value.getDataProvider().addRow(selectedApply.value);
  }
}
const searchData02 = (deptCd) => {
  return commonSearchApi({ 
    queryId: 'HLTIA0010_SEARCH_02', 
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      DEPT_CD: deptCd
    }
  })
}
const afterSearch02 = res => {
  console.log("1111", res)
  grdEmpl.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 임직원 목록 row 클릭
const onCellClicked2 = (grid, clickData) => {
  const dataEm = grdEmpl.value.getDataProvider().getJsonRow(clickData.dataRow);
  console.log("직원목록 클릭 : ", dataEm);
  selectedApply.value = dataEm;
  // grdApply1.value.getDataProvider().setRows([dataEm])
  // setRows는 배열 형태의 데이터를 받아야함
}

//---------------------------------------------------
//결재자 버튼
const onButtonsClick3 = (btn) => {
  if (btn.id === "btnSelectRemove") {
    const selectedRow = grdApply1.value.getGridView().getCurrent().dataRow;
    grdApply1.value.getDataProvider().removeRow(selectedRow);
  } else if ( btn.id === "btnAllRemove" ) {
    const selectedRow = grdApply1.value.getGridView().getCurrent().dataRow;
    grdApply1.value.getDataProvider().clearRows(selectedRow);
  } else if ( btn.id === "btnMoveUp" ) {
    const gridView = grdApply1.value.getGridView();
    const dataProvider = grdApply1.value.getDataProvider();
  
    const current = gridView.getCurrent().dataRow; // 현재 선택된 행 인덱스
    if (current > 0) {
      dataProvider.moveRow(current, current - 1); // 현재 행을 위로 이동
      gridView.setCurrent({ dataRow: current - 1 }); // 이동한 위치로 포커스 변경
      console.log(`행 ${current} → ${current - 1}로 이동`);
    } else {
      console.warn("맨 위 행은 이동할 수 없습니다.");
    }
  } else if ( btn.id === "btnMoveDown" ) {
    const gridView = grdApply1.value.getGridView();
    const dataProvider = grdApply1.value.getDataProvider();
    
    const current = gridView.getCurrent().dataRow; // 현재 선택된 행 인덱스
    const rowCount = dataProvider.getRowCount(); // 전체 행 개수

    if (current < rowCount - 1) {
      dataProvider.moveRow(current, current + 1); // 현재 행을 아래로 이동
      gridView.setCurrent({ dataRow: current + 1 }); // 이동한 위치로 포커스 변경
      console.log(`행 ${current} → ${current + 1}로 이동`);
    } else {
      console.warn("맨 아래 행은 이동할 수 없습니다.");
    }
  }
}

//참조자 버튼
const onButtonsClick5 = (btn) => {
  if (btn.id === "btnSelectRemove") {
    const selectedRow = grdApply3.value.getGridView().getCurrent().dataRow;
    grdApply3.value.getDataProvider().removeRow(selectedRow);
  } else if ( btn.id === "btnAllRemove" ) {
    const selectedRow = grdApply3.value.getGridView().getCurrent().dataRow;
    grdApply3.value.getDataProvider().clearRows(selectedRow);
  } else if ( btn.id === "btnMoveUp" ) {
    const gridView = grdApply3.value.getGridView();
    const dataProvider = grdApply3.value.getDataProvider();
  
    const current = gridView.getCurrent().dataRow; // 현재 선택된 행 인덱스
    if (current > 0) {
      dataProvider.moveRow(current, current - 1); // 현재 행을 위로 이동
      gridView.setCurrent({ dataRow: current - 1 }); // 이동한 위치로 포커스 변경
      console.log(`행 ${current} → ${current - 1}로 이동`);
    } else {
      console.warn("맨 위 행은 이동할 수 없습니다.");
    }
  } else if ( btn.id === "btnMoveDown" ) {
    const gridView = grdApply3.value.getGridView();
    const dataProvider = grdApply3.value.getDataProvider();
    
    const current = gridView.getCurrent().dataRow; // 현재 선택된 행 인덱스
    const rowCount = dataProvider.getRowCount(); // 전체 행 개수

    if (current < rowCount - 1) {
      dataProvider.moveRow(current, current + 1); // 현재 행을 아래로 이동
      gridView.setCurrent({ dataRow: current + 1 }); // 이동한 위치로 포커스 변경
      console.log(`행 ${current} → ${current + 1}로 이동`);
    } else {
      console.warn("맨 아래 행은 이동할 수 없습니다.");
    }
  }
}


//---------------------------------------------------
//조직도
const grdOrgaProps = reactive({
  gridViewOption : { header: { height: 30 } },
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', width: '50', lookupDisplay: true, editable: false , 
      header: { text: t('부서명') } },
  ],
  columns : [],
})
grdOrgaProps.columns = grdOrgaProps.fields

// 임직원 목록
const grdEmplProps = reactive({
  gridViewOption : { header: { height: 30 }, checkBar: {  visible: true } },
  keys : [],
  fields : [ 
    { fieldName: 'GRD_NM', dataType: 'text', width: '70', header: { text: t('직급') }, editable : false },
    { fieldName: 'EMP_NM', dataType: 'text', width: '70', header: { text: t('성명') }, editable : false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', width: '90', header: { text: t('직책') }, lookupDisplay: true},
    { fieldName: 'DEPT_NM', dataType: 'text', width: '100', lookupDisplay: true, editable: false , header: { text: t('부서명') } },
  ],
  columns : [],
})
grdEmplProps.columns = grdEmplProps.fields

// 결재자
const grdApply1Props = reactive({
  gridViewOption : { header: { height: 30 } },
  keys : [],
  fields : [ 
    { fieldName: 'GRD_NM', dataType: 'text', width: '70', header: { text: t('직급') }, editable : false },
    { fieldName: 'EMP_NM', dataType: 'text', width: '70', header: { text: t('성명') }, editable : false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', width: '90', header: { text: t('직책') }, lookupDisplay: true},
  ],
  columns : [],
})
grdApply1Props.columns = grdApply1Props.fields

// 고정 결재선
const grdApply2Props = reactive({
  gridViewOption : { header: { height: 30 } },
  keys : [],
  fields : [ 
    { fieldName: 'GRD_NM', dataType: 'text', width: '70', header: { text: t('직급') }, editable : false },
    { fieldName: 'EMP_NM', dataType: 'text', width: '70', header: { text: t('성명') }, editable : false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', width: '90', header: { text: t('직책') }, lookupDisplay: true},
  ],
  columns : [],
})
grdApply2Props.columns = grdApply2Props.fields

// 참조자
const grdApply3Props = reactive({
  gridViewOption : { header: { height: 30 } },
  keys : [],
  fields : [ 
    { fieldName: 'GRD_NM', dataType: 'text', width: '70', header: { text: t('직급') }, editable : false },
    { fieldName: 'EMP_NM', dataType: 'text', width: '70', header: { text: t('성명') }, editable : false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', width: '90', header: { text: t('직책') }, lookupDisplay: true},
  ],
  columns : [],
})
grdApply3Props.columns = grdApply3Props.fields



defineExpose({
})

onMounted(async () => {
  await initCodeList();
  searchParams.BSNS_CD = "";  // 전체 사업부 코드 (필요 시 수정)
  onButtonsClick1({ id: "btnSearch" });
})
</script>

<template>
  <v-card>
    <v-card-text class="pa-2 pt-0 content-area d-flex justify-space-around">
      <div class="d-flex flex-column">
        <v-sheet class="d-flex mt-4 h-auto">
          <i-select 
            :label="$t('사업부')"
            labelWidth="50px"
            top-label
            width="450px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
          />

          <IGridTitle
          ref="menuTitle"
          :title="$t('조직도')"
          :button-list="['btnSearch']"
          style="width:450px; margin-top: 10px;"
          @click-button="onButtonsClick1"
         />
          <RealGrid
            ref="grdOrga"
            class="mt-2"
            :grid-view-option="grdOrgaProps.gridViewOption"
            :keys="grdOrgaProps.keys"
            :fields="grdOrgaProps.fields"
            :columns="grdOrgaProps.columns"
            style="height: 500px; width:450px;"
            @onCellClicked="onCellClicked1"
          />
        </v-sheet>
      </div>

      <div class="d-flex flex-column">
        <v-sheet class="d-flex mt-4 h-auto">
          <!-- v-model="searchParam.EMP_NM" -->
          <i-input
          top-label
          :label="$t('이름검색')"
          width="450px"
         />

          <IGridTitle
          ref="menuTitle"
          :title="$t('임직원 목록')"
          :button-list="['btnSearch', 'btnAddApp', 'btnAddCC']"
          style="width:450px; margin-top: 10px;"
          @click-button="onButtonsClick2"
         />
          <RealGrid
            ref="grdEmpl"
            class="mt-2"
            :grid-view-option="grdEmplProps.gridViewOption"
            :keys="grdEmplProps.keys"
            :fields="grdEmplProps.fields"
            :columns="grdEmplProps.columns"
            style="height: 500px; width:450px;"
            @onCellClicked="onCellClicked2"
          />
        </v-sheet>
      </div>

    <!-- 결재자 -->
    <div class="d-flex flex-column">
      <div class="d-flex flex-column">
        <v-sheet class="d-flex mt-4 h-auto">
          <p class="text-red-darken-1">※ 부서장이상 결재선 지정 필요</p>
          <IGridTitle
          ref="menuTitle"
          :title="$t('결재자')"
          :button-list="['btnSelectRemove', 'btnAllRemove', 'btnMoveUp', 'btnMoveDown']"
          style="width:450px; margin-top: 10px;"
          @click-button="onButtonsClick3"
         />
          <RealGrid
            ref="grdApply1"
            class="mt-2"
            :grid-view-option="grdApply1Props.gridViewOption"
            :keys="grdApply1Props.keys"
            :fields="grdApply1Props.fields"
            :columns="grdApply1Props.columns"
            style="height: 200px; width:450px;"
            @onCellClicked="onCellClicked3"
          />
        </v-sheet>
      </div>

      <!-- 고정 결재선 -->
      <div class="d-flex flex-column">
        <v-sheet class="d-flex mt-4 h-auto">
          <IGridTitle
          ref="menuTitle"
          :title="$t('고정 결재선')"
          style="width:450px; margin-top: 10px;"
         />
          <RealGrid
            ref="grdApply2"
            class="mt-2"
            :grid-view-option="grdApply2Props.gridViewOption"
            :keys="grdApply2Props.keys"
            :fields="grdApply2Props.fields"
            :columns="grdApply2Props.columns"
            style="height: 200px; width:450px;"
            @onCellClicked="onCellClicked4"
          />
        </v-sheet>
      </div>

      <!-- 참조자 -->
      <div class="d-flex flex-column">
        <v-sheet class="d-flex mt-4 h-auto">
          <IGridTitle
          ref="menuTitle"
          :title="$t('참조자')"
          :button-list="['btnSelectRemove', 'btnAllRemove', 'btnMoveUp', 'btnMoveDown']"
          style="width:450px; margin-top: 10px;"
          @click-button="onButtonsClick5"
         />
          <RealGrid
            ref="grdApply3"
            class="mt-2"
            :grid-view-option="grdApply3Props.gridViewOption"
            :keys="grdApply3Props.keys"
            :fields="grdApply3Props.fields"
            :columns="grdApply3Props.columns"
            style="height: 200px; width:450px;"
            @onCellClicked="onCellClicked5"
          />
        </v-sheet>
      </div>
    </div>

    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 250px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
